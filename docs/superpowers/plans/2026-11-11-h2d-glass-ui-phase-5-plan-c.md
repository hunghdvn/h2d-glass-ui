# h2d-glass-ui: Plan C, các widget của header, công thức bảng thông báo và bản phát hành `0.4.0` (giai đoạn 5, phần 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan C, plan cuối của giai đoạn 5: `SearchField` với hai giao diện H2 (`collapsible={false}`) và H3 (`collapsible`) và phím tắt `'/'`, `'mod+k'`; `UserMenu` với U1 và U2 (`showName`); `ThemeSwitch` (T1), `ThemeMenuGroup` (T3) và `ThemeScript` trên một store theme nội bộ; các icon `SearchIcon`, `SunIcon`, `MoonIcon`, `MonitorIcon` và hướng `left` của `ArrowIcon`; `isEditable` chuyển vào `src/internal/`; prop `surface` của `List`; công thức bảng thông báo (B1, B3), trang "Examples/App shell", mục "App shell" của Getting started và các ghi chú của trang Accessibility; check tương phản `kbd-text`, dòng 36 của §4.9 và các dòng 2, 6, 9, 14, 29 mở rộng; trang khung trong hai fixture và kịch bản kiểm tra của chúng; changeset `minor` cho `0.4.0`, và ngưỡng kích thước.

**Architecture:**
- **Hai helper dùng chung** (Task 1): `isEditable` chuyển nguyên từ `Toaster.tsx` vào `src/internal/editable.ts`, để Toaster và phím tắt của SearchField dùng chung. `isApplePlatform()` trong `src/internal/platform.ts` đọc `navigator.userAgentData?.platform` rồi `navigator.platform`, không phân biệt hoa thường, và chỉ được đọc sau khi mount.
- **`SearchField`** (Task 1): client (`src/components/search-field/SearchField.tsx`, `"use client"`), một control của form như `Input` (`markAsFieldControl`, `useFormReset`; `className` và `style` vào gốc `.flg-search-field`, mọi prop khác vào `<input>`, `ref` là `<input>`). Phím tắt qua `useShortcut` của `search-field/shortcut.ts`: một listener `keydown` trên `document` cho mỗi ô, và một danh sách người giữ cho mỗi phím, nên ô được mount sau cùng nhận phím. Nền tảng đọc qua `useSyncExternalStore` có giá trị phía server là `undefined`, nên `<kbd>` của `'mod+k'` rỗng và `hidden` trong HTML từ server. H3: nút nằm trong `TooltipRoot describe={false}`; trạng thái mở là nội bộ; ô luôn nằm trong DOM (CSS ẩn nó khi thu gọn); dưới 768px trong header, ô mở phủ hàng header chỉ bằng CSS (`:has()`).
- **`UserMenu`** (Task 2): client (`src/components/user-menu/UserMenu.tsx`), xây trên `DropdownMenu` và `Avatar`. Đầu menu là một `div role="presentation"` có id, và là mô tả của menu (`aria-describedby`, nối với của `contentProps` bằng `joinIds`). Hai vòng của U1 là `box-shadow`; nền của nút `ghost` đang mở là quy tắc của `.flg-app-shell-header` (Plan A), nên story "mở" được vẽ trong một header AppShell thật.
- **Theme** (Task 3): `src/internal/theme-value.ts` (kiểu `ThemeValue`, `isThemeValue`, khoá mặc định; không có React) và `src/internal/theme-store.ts` (một store cho mỗi `storageKey`, `useSyncExternalStore` với giá trị phía server là `defaultValue`, `applyTheme`). `ThemeSwitch` và `ThemeMenuGroup` là client (`theme-switch/ThemeSwitch.tsx`); `ThemeScript` là server-safe (`theme-switch/ThemeScript.tsx`) và render chuỗi của hàm thuần `themeScriptSource` (`theme-switch/theme-script.ts`). Icon của `ThemeSwitch` được chọn bằng CSS: theo `data-value` của nút, hay theo `:root[data-flg-theme]` khi nút còn `data-pending`.
- **`List surface`** (Task 4): `false` ở `inset` bỏ lớp `flg-surface` và đặt `data-surface="false"`; DOM mặc định không đổi.
- **Công thức bảng thông báo và trang Examples** (Task 4): code nằm ở `src/docs/app-shell-example/` (chỉ dùng phần của lib, import từ `../../index`), trang `src/docs/AppShellExample.mdx` hiện chính các file đó bằng `?raw`; story ở `src/docs/AppShellExample.stories.tsx` (`Examples/App shell`).
- **Helper của story** (Task 2, 3, 4): `.storybook/header-strip.tsx` (`Strip`, `HeaderWidgets`, `End`, `App`, `strips`, với các khe `account`, `theme`, `bell`); `PAGE_RULES` chuyển từ `AppShell.stories.tsx` sang `.storybook/app-shell-demo.tsx`.
- **Fixtures và phát hành** (Task 5): route `/shell` của Next.js (`app/shell/[[...slug]]`), entry thứ hai `shell.html` của Vite, kịch bản trong `scripts/test-fixtures.mjs`; test `scripts/lib/theme-script-copies.test.ts` giữ hai bản chép tay của script theme bằng `themeScriptSource`; `.changeset/phase-5-app-shell.md` (`minor`); `pnpm size:record` một lần cho cả Plan C.

**Tech Stack:** Như Plan B: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Fixtures có sẵn: Next.js 16.3.8 (React 19.3.0) và Vite 8.3.1 (React 18.3.1). Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`. Plan này làm các phần sau:
- §2 dòng C: các icon, `isEditable`, `SearchField` (Task 1); `UserMenu` (Task 2); `theme-store`, `ThemeSwitch`, `ThemeMenuGroup`, `ThemeScript` (Task 3); `List surface`, công thức bảng thông báo, trang "Examples/App shell", mục "App shell" của Getting started (Task 4); fixtures, changeset `minor` → `0.4.0` (Task 5). §2 "Thay đổi ở code cũ", dòng Plan C (Task 1, 4).
- §1: các dòng SearchField (Task 1), UserMenu (Task 2), Theme (Task 3) của bảng "Các điểm Claude chốt"; dòng "Tương phản: cần duyệt", phần dòng 36 (Task 1); dòng "Thay đổi ở component cũ", phần `List`, `ArrowIcon`, `isEditable` (Task 1, 4); dòng "Phát hành" (Task 5).
- §3.1: dòng SearchField (Task 1), UserMenu (Task 2), ThemeSwitch, ThemeMenuGroup, ThemeScript (Task 3); `check:use-client` thêm ba file client; `check:rsc` thêm hai ca `ThemeScript` (Task 3).
- §3.2: dòng H (Task 1), U (Task 2), T (Task 3); đoạn về hai ví dụ của bảng thông báo (Task 4).
- §3.5: dòng "Phím gợi ý của SearchField" (Task 1), dòng ThemeSwitch (Task 3).
- §3.6: dòng H3 (Task 1), chevron của U2 (Task 2).
- §3.7: các file của Plan C, kể cả `theme-value.ts` (Task 3).
- §4.1: mockup h2, h3 (Task 1), u1, u2 (Task 2), t1, t3 (Task 3), b1, b3 (Task 4) của `phase-5-header.html`.
- §4.3 **SearchField** (Task 1), **UserMenu** (Task 2), **ThemeSwitch (T1) và ThemeMenuGroup (T3)** (Task 3), **Công thức bảng thông báo (B1, B3) và thay đổi của List** (Task 4).
- §4.4: check `kbd-text` và dòng 36 (Task 1); dòng 2 và 6 mở rộng (Task 2), dòng 9 (Task 3), dòng 6, 14, 29 (Task 4).
- §4.5: SearchField (Task 1), UserMenu (Task 2), ThemeSwitch và ThemeMenuGroup (Task 3), công thức thông báo (Task 4).
- §4.6: `SearchIcon`, `ArrowIcon` `left` (Task 1); `SunIcon`, `MoonIcon`, `MonitorIcon` (Task 3).
- §5: `editable.ts`, `platform.ts`, cảnh báo của SearchField (Task 1); cảnh báo của UserMenu (Task 2); `theme-store.ts`, `theme-value.ts`, `theme-switch/theme-script.ts` (Task 3); `List` `surface` và cảnh báo của nó (Task 4).
- §6.1: quy ước API (`ref`, `className`, `labels`, controlled, kiểu giá trị `ThemeValue`).
- §6.3: `SearchField` (Task 1), `UserMenu` (Task 2), `ThemeSwitch`, `ThemeMenuGroup`, `ThemeScript` và next-themes (Task 3).
- §7: lớp 1–3 của các component trên (Task 1–4); test kiểu; danh sách kiểm tra gói; story giao diện của Plan C (Task 1–4); fixtures và kịch bản kiểm tra (Task 5).
- §8: `SearchField.mdx` (Task 1), `UserMenu.mdx` (Task 2), `ThemeSwitch.mdx` (Task 3), `List.mdx` `surface`, trang "Examples/App shell", Getting started "App shell", ghi chú Accessibility của Plan C (Task 4); "Phát hành" (Task 5).
- §9: Task 5 kết thúc bằng kiểm tra cuối của cả nhánh; mọi tiêu chí của giai đoạn 5 đủ sau Plan C, trừ lớp 6 (phát hiện 23) và việc chủ dự án merge PR "Version Packages".
- §10: các dòng hydrate của ThemeSwitch, `ThemeScript` và CSP, phím tắt `mod+k`, ảnh chuẩn, CSS tăng.
- §4.9 của spec 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 36, đoạn về dòng 36, "Cả ba mươi sáu điểm" (Task 1); nhãn và đoạn của các dòng 2, 6 (Task 2), 9 (Task 3), 6, 14, 29 (Task 4).

Chủ dự án chọn mockup ngày 2026-11-10 ("Cả S1 và S2, cả N1 và N2, cả H2 và H3, T1 và T3, U1 và U2, B1 và B3") và duyệt spec cùng ngày, kể cả dòng 35–36 của §4.9 (dòng 36 là của Plan C). Plan A và Plan B đã merge (PR #37, PR #38; `main` ở `87b8578`).

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-5-plan-c`, mỗi task một commit: năm commit trên `87b8578` (`main` sau PR #38): `6b9bc14` (Task 1), `2af3d12` (Task 2), `97514e7` (Task 3), `937acb6` (Task 4), `ca5b44e` (Task 5).
- Mỗi test viết trước đã được chạy trên code trước nó và được thấy fail. Các test viết sau code, và cách chúng được kiểm bằng đột biến, nằm ở phát hiện 19: `SearchField.test.tsx` của Task 1 viết sau code và được kiểm bằng bảy đột biến; Task 2 kiểm bảy test bằng đột biến.
- Cả năm task do subagent Claude Sonnet viết, lần lượt từng task. Plan C không dùng opencode: việc đó không được đề xuất trong phiên này (mỗi phiên cần chủ dự án đồng ý). Claude (Opus) kiểm tra từng task.
- Claude chụp mọi story giao diện từ một bản Storybook vừa build và đối chiếu với `phase-5-header.html`: h2, h3 (Task 1), u1, u2 (Task 2), t1, t3 (Task 3), b1, b3 (Task 4), ở sáng và tối, cùng trang Examples. Tất cả khớp, với các điểm chốt ở phát hiện 6, 8, 10 và 12. Lần chụp đầu của Task 1 đến từ một bản build cũ (play function gõ "report" vào ô đã có chữ đó); Claude chụp lại trên bản build mới.
- Hai task được trả lại một lần mỗi task:
  - Task 2: ảnh U2 đang mở không có nền xám. Nền đó là quy tắc của header (§4.1), mà story "Open" được vẽ trong một dải dựng trong story; hai story "Open" nay nằm trong header AppShell thật (phát hiện 8). Commit sửa lại thành `2af3d12` (trước là `06c6f35`, rồi `8354d78`; xem dòng dưới).
  - Task 3: header của ba story T3 có nút theme, mà header của mockup t3 không có (phát hiện 10). Commit sửa lại thành `97514e7` (trước là `2dabe1e`, rồi `a67ced9`).
  - Khi viết plan, người viết thấy hai chỗ lệch, Claude sửa và gộp vào commit của task: §7 "Gói phát hành" ghi lớp `flg-user-menu-trigger` mà code dùng `flg-user-menu` (dòng spec sửa, gộp vào Task 2); chú thích của `scripts/lib/theme-script-copies.test.ts` nói `index.html` mà test đọc `shell.html` (gộp vào Task 5). Năm commit sau đó là `6b9bc14`, `2af3d12`, `97514e7`, `937acb6`, `ca5b44e`.
- Mọi khối patch trong plan được lấy thẳng từ năm commit đó (`patches/make-patches.sh` của bản nháp tách mỗi commit thành patch test và patch code).

Kết quả đo ở đầu nhánh nháp `e03af8d`, ngày 2026-11-11, do Claude chạy (`check-p5c.sh` của bản nháp, 27 bước, mọi bước rc 0). `ca5b44e` chỉ khác `e03af8d` ở một dòng spec và một dòng chú thích (xem ở trên):

| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run --project unit --project unit-react18 --project scripts` (như `pnpm test:unit`) | PASS. Bản ghi `check-output.txt` chỉ giữ mã thoát, không giữ số test; theo `include` của ba project, lần chạy có 220 file |
| Story | search-field 33, user-menu 27, theme-switch 30, list 30, toast 21, app-shell 165, docs 78, ở mỗi project (`storybook-light`, `storybook-dark`). PASS ở Chromium, Firefox và WebKit, chạy từng thư mục một và từng project một. Cả bộ story chưa chạy một lượt trên máy này; CI chạy cả bộ |
| `pnpm check:contrast` | PASS (`Contrast check passed.`). Một check mới, `kbd-text`; một ngoại lệ mới, dòng 36 (`kbd-text` dark 3.31) |
| `pnpm check:package`, `pnpm size` | PASS với ngưỡng mới: JS 60183 B, CSS 17773 B (đo được JS 54.71 kB, CSS 16.16 kB; ngưỡng trước 57286 B và 17041 B) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name`, `pnpm build` | PASS |
| `pnpm build-storybook`, `pnpm check:docs-tables` | PASS (`no table built as text in 204 files`). Index đã build có 152 story có ảnh (130 trước Plan C) và đúng một trang docs cho mỗi trang mới: `components-searchfield--docs`, `components-themeswitch--docs`, `components-usermenu--docs`, `examples-app-shell--docs` |
| Fixtures | `Fixtures OK: vite, next.` (bản production và development của cả hai app, Chromium), chạy ở Task 5 qua một bản sao của `scripts/test-fixtures.mjs` ở cổng 5179/4179 (bản sao đã xoá). Claude không chạy lại: Task 5 là commit cuối |
| Visual | Chưa chạy. 176 ảnh chuẩn mới của 22 story giao diện chạy lần đầu trong CI |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Năm task nháp là năm task của plan, cùng số thứ tự** (Claude chốt cách chia, để mỗi commit review được riêng).
   - Task 1: `isEditable` chuyển vào `src/internal/editable.ts`, `platform.ts`, `SearchIcon` và `ArrowIcon` `left`, `SearchField` (H2, H3), check `kbd-text` và dòng 36, `SearchField.mdx`.
   - Task 2: `UserMenu` (U1, U2), helper chung của story `.storybook/header-strip.tsx`, `UserMenu.mdx`, dòng 2 và 6 mở rộng.
   - Task 3: `theme-value.ts`, `theme-store.ts`, `SunIcon`, `MoonIcon`, `MonitorIcon`, `ThemeSwitch` (T1), `ThemeMenuGroup` (T3), `ThemeScript`, `ThemeSwitch.mdx`, dòng 9 mở rộng.
   - Task 4: `List` `surface`, công thức bảng thông báo (B1, B3) trong `src/docs/app-shell-example/`, trang "Examples/App shell", mục "App shell" của Getting started, ghi chú Accessibility, dòng 6, 14, 29 mở rộng, story `SheetCloses…` của AppShell vững hơn.
   - Task 5: trang khung trong hai fixture (Next.js `/shell`, entry thứ hai của Vite) và kịch bản của chúng, test giữ các bản chép của script theme bằng `themeScriptSource`, changeset `minor` cho `0.4.0`, ngưỡng kích thước.
   - Mỗi task thêm những story giao diện nó vẽ đúng được: năm của SearchField ở Task 1; bốn của UserMenu ở Task 2; năm của ThemeSwitch ở Task 3; tám của "Examples/App shell" ở Task 4.
2. **SearchField trong header** (Task 1; spec §4.3 đã sửa):
   - **Ô H2 trong header có cả `width: 280px`, không chỉ `flex: 0 1 280px`.** Story bố cục `InTheHeader` lần đầu đo ô H3 đang mở trong cụm widget cuối header được 253px, không phải 300px: một phần tử bọc (cụm widget) rộng bằng nội dung của nó, và không đo theo flex-basis, nên ô chỉ rộng bằng cỡ tự nhiên của `<input>`. H3 đang mở: `flex: 0 1 300px; width: 300px`, cách phải 6px; H3 thu gọn: `flex: none; width: auto`.
   - **H2 dưới 768px là `flex: 1 1 0%`**, không phải `1 1 auto` của spec cũ: `auto` bắt các phần khác của header co lại theo cỡ tự nhiên của `<input>`. Brand chỉ còn dấu (kỹ thuật của `flg-visually-hidden` trên `.flg-app-shell-brand-name`, nên tên vẫn là tên của link).
   - Mọi quy tắc màn hẹp nằm trong một `@media not all and (min-width: 768px)`: một ranh giới, cố định ở 768px, không theo `breakpoint` của AppShell (spec §3.2).
   - **Ô H3 mở phủ cả hàng header** (`position: absolute; inset: 0`), nên nó cao bằng hộp padding của header: 55px trong header 56px có viền dưới 1px. Story kiểm 55px (bản đầu đòi 56px, và chính test được sửa).
   - **Một ô tìm kiếm khác trong cùng header cũng ẩn** khi H3 phủ header (ngoài spec, Claude chấp nhận): quy tắc `visibility: hidden` của spec chỉ đụng con trực tiếp của header, còn ô H2 nằm trong một phần tử bọc thì vẫn hiện qua lớp phủ.
3. **Hành vi của SearchField** (Task 1):
   - **Esc:** có chữ thì xoá (`preventDefault`); rỗng và thu gọn được thì đóng ô và đưa focus về nút, **cũng với `preventDefault`** (ngoài spec, Claude chấp nhận: một Dialog chứa ô không đóng theo); rỗng và không thu gọn được thì để Esc đi tiếp. Esc khi bộ gõ đang soạn chữ (`isComposing`) là của bộ gõ.
   - **Ô `disabled` hay `readOnly` không có nút xoá và không nhận phím tắt** (ngoài spec, Claude chấp nhận); nút của một H3 tắt cũng tắt.
   - Phím tắt: bỏ qua đích là chỗ gõ chữ (`isEditable` trên `composedPath()[0]`, nên một ô trong shadow DOM cũng tính), sự kiện đã `defaultPrevented` và lúc bộ gõ đang soạn; `'mod+k'` nhận cả chữ `K` hoa của Caps Lock; ô mount sau cùng nhận phím, và trả phím cho ô trước khi nó unmount hay tắt phím.
   - **Ô H3 thu gọn vẫn nằm trong DOM** (`display: none`), nên `ref`, `FormData` và `required` vẫn chạy khi đóng. Hệ quả: một ô `required` rỗng đang thu gọn chặn việc gửi form gốc mà không hiện gì (không xử lý ở plan này, phát hiện 23).
   - H3 tự đóng khi ô rỗng và focus rời gốc. `relatedTarget` là `null` cả khi bấm ra trang lẫn khi cửa sổ mất focus; chỉ ở trường hợp sau ô vẫn là `document.activeElement`, nên cửa sổ mất focus không đóng ô.
4. **Nền tảng và gợi ý phím** (Task 1; spec §5 đã sửa):
   - **`isApplePlatform` khớp không phân biệt hoa thường.** Test `is true for macOS` fail ở bản đầu: chữ "Mac" của spec không khớp "macOS" của `userAgentData.platform`.
   - **SearchField đọc nền tảng bằng `useSyncExternalStore` với giá trị phía server là `undefined`** (`useApplePlatform` trong `SearchField.tsx`), nên lần render hydrate cho đúng chữ của server (`<kbd>` rỗng, `hidden`, không `aria-keyshortcuts` cho `'mod+k'`) rồi mới điền. Đột biến bỏ giá trị phía server làm hai test hydrate fail.
   - Story của SearchField đặt `labels.shortcut` thành "⌘K" (`APPLE_KEY`), để ảnh chụp trên Linux của CI khớp mockup. Trang Examples (Task 4) giữ mặc định, nên ở đó là "Ctrl K" trên Linux (phát hiện 12).
5. **`kbd-text` và dòng 36** (Task 1):
   - Check `kbd-text` (4.5) đo chữ `--flg-text-muted` trên nền `--flg-control-bg-secondary` của phím, nằm trên nền ô và trên kính của tooltip, lấy số thấp hơn. Số bằng số của spec: 7.15 light, 3.31 dark (3.76 trong tooltip), 7.83 light +, 7.63 dark +. Một kính tooltip nhạt được vá vào trong test chứng minh phần tooltip được đo thật (`measures the hint in the tooltip too, so a weak glass cannot hide behind the frame`).
   - Dòng 36 (chủ dự án duyệt cùng spec): ngoại lệ dark 3.31 trong `scripts/contrast-exceptions.ts`, dòng và đoạn sau bảng §4.9 của spec 0+1, "Cả ba mươi sáu điểm", `ExceptionTable.test.tsx` đếm 36 dòng, câu trỏ của trang Accessibility.
6. **Story của SearchField** (Task 1):
   - **Mỗi story giao diện có một phần tử được focus và một phần tử được rê chuột**, vì trang chỉ có một focus thật (mockup vẽ hai vòng). Vì vậy dải "mở, có chữ" của `SearchFieldCollapsible` không có focus; vòng focus với chữ có ở dải 2 của `SearchFieldDefault` và ở `SearchFieldCollapsiblePhoneOpen` (Claude chốt; nếu sai, cái giá là một story nữa).
   - Story nhiều trạng thái đặt mỗi trạng thái trong một dải kính 56px dựng trong story theo dải header của mockup; ba story điện thoại (`SearchFieldDefaultPhone`, `SearchFieldCollapsiblePhone`, `SearchFieldCollapsiblePhoneOpen`) dùng AppShell thật, `stage: 'page'`, tag `viewport-360x640`. Tooltip của nút H3 qua `data-visual-hover="tooltip"`.
   - Vòng focus của nút ← nhạt ở Firefox tối cho tới khi transition xong; `FocusRings` (đọc điểm ảnh của khung ô, nút xoá và nút ← ở mép trái header điện thoại) chờ `settled` trước khi chụp.
   - `ForcedColors` chỉ chạy ở Chromium (giả lập qua protocol, như story của Table).
7. **UserMenu** (Task 2; spec §6.3 đã sửa):
   - **`UserMenuProps` bỏ cả `asChild` và `id`:** một slot làm hỏng avatar, tên và chevron, còn menu được gọi tên bằng `id` mà `DropdownMenu` đặt trên nút, nên `id` của người gọi sẽ bị bỏ lặng lẽ. `variant` và `size` vẫn qua được (mặc định `ghost`, `md`).
   - **U2 có `min-width: 0`** (`.flg-user-menu[data-show-name]`): ở 360px nút tràn 2px vì một phần tử flex rộng bằng nội dung. Phần tử bọc của chính ứng dụng cũng cần nó; `UserMenu.mdx` nói vậy, và `End` của helper story có nó. Lib không ép được điều đó.
   - **Tên và hai dòng của đầu menu có `padding: 2px 0; margin: -2px 0`:** `overflow: hidden` với `line-height` 1 hay 1.2 cắt dấu chồng của tiếng Việt ("Nguyễn"); bố cục vẫn như mockup.
   - Dòng phụ (`description`) nằm trong `div`, không phải `span`: `dom-accessibility-api` (jsdom và Testing Library trong trình duyệt) nối chữ inline không có khoảng trắng, nên mô tả đọc thành "Minh Anh Nguyenminhanh@…".
   - Chữ cái đầu lấy từ chữ đầu của từ đầu và từ cuối (theo code point, chuẩn hoá NFC); tên Việt Nam truyền `avatar={{ fallback: 'MA' }}` (docs nói rõ). Không còn chữ nào thì avatar vẽ icon người.
   - `toHaveAccessibleName` của Testing Library trả `''` cho menu (menu được gọi tên bằng `aria-labelledby` trỏ vào một nút chỉ có `aria-label`), nên unit test và story kiểm `aria-labelledby` và mô tả. Chưa kiểm bằng screen reader (phát hiện 23).
   - Không có cặp tương phản mới. Dòng 2 (nút của UserMenu; cùng lúc thêm nút xoá của SearchField, mà Task 1 bỏ sót dù spec §4.4 có liệt kê) và dòng 6 (dòng phụ ở đầu menu) mở rộng, ở `contrast-exceptions.ts`, bảng §4.9, đoạn sau bảng và câu trỏ của trang Accessibility; `ExceptionTable.test.tsx` không đổi (không thêm dòng).
8. **Story của UserMenu và lần trả lại Task 2:**
   - Mỗi trạng thái của mockup có chỗ của nó: nghỉ, hover (`data-visual-hover` trên nút của dải 2), focus bàn phím (play function focus nút của dải 3) trong `UserMenu` và `UserMenuShowName`; mở trong `UserMenuOpen` và `UserMenuShowNameOpen`.
   - **Mọi giao diện "mở" vẽ trong header AppShell thật** (`App` của `.storybook/header-strip.tsx`, `stage: 'page'`, tag `viewport-1280x720`): nền mà một nút `ghost` giữ khi popup của nó mở là quy tắc của `.flg-app-shell-header`, nên một dải dựng trong story không vẽ nó. Lần chụp đầu thấy U2 mở không có nền xám; sau khi sửa, U2 mở có nền và chevron hướng lên, U1 mở không có nền và có vòng nhấn 2px.
   - Vòng hover và vòng "mở" của U1 thắng nền hover của Button và nền "mở" của header nhờ độ cụ thể của selector (chú thích trong `user-menu.css`); `RingsInTheHeader` fail nếu một quy tắc sau này đổi điều đó.
   - Trong header 60px của AppShell màn rộng, menu nằm 4px dưới mép header (cách nút 17px như spec); mockup đo 6px dưới dải 56px. `MenuPlace` kiểm 17px.
   - Component được import trong file story dưới tên `Component`, vì story giao diện `UserMenu` trùng tên; id của story là `components-usermenu--user-menu`.
   - Khi chạy story: một callback của `waitFor` thêm và bỏ một phần tử dò trong DOM sẽ tự đánh thức `MutationObserver` của chính nó và treo trình duyệt (Firefox "page crashed"), nên `RingsInTheHeader` đọc các phần tử dò một lần, ngoài `waitFor`. Một tiến trình `vitest` bị giết để lại `chrome-headless-shell` chạy hết CPU; chỉ tắt những tiến trình do chính lần chạy của mình để lại.
9. **Store theme** (Task 3; spec §5, §6.3 đã sửa):
   - **Thứ tự đọc lúc mount:** giá trị đã lưu trong `localStorage`, không có (hay không đọc được) thì thuộc tính `data-flg-theme` của `<html>`, vắng thì `defaultValue`; kết quả được áp lên `<html>`. Store đọc một lần cho mọi người đăng ký mount cùng lúc, và đọc lại khi mọi người đăng ký đã đi hết rồi có người mới.
   - **Sự kiện `storage`:** chỉ theo đúng khoá, bỏ qua `sessionStorage`; khoá bị xoá (`newValue: null`), `localStorage.clear()` (`key: null`) hay giá trị lạ là `'system'`, như `ThemeScript` đọc. Listener do người đăng ký đầu tiên thêm và người cuối cùng bỏ; thay đổi từ tab khác không được báo như một lần chọn.
   - Controlled: `subscribe` không làm gì, không đọc, không ghi, không áp lên `<html>`; mọi lần chọn đều được báo, kể cả giá trị đang có (cha có thể muốn hoàn lại). Giá trị controlled ngoài union hiện như `defaultValue`. Uncontrolled: chọn đúng giá trị đang có thì không báo.
   - Mọi lần đọc và ghi `localStorage` nằm trong `try/catch`, kể cả lần chạm vào chính thuộc tính `localStorage`: khi đó giá trị chỉ sống trong store.
   - **`theme-value.ts` tách khỏi `theme-store.ts`** (kiểu, `isThemeValue`, khoá mặc định; không React), để `ThemeScript` server-safe không kéo hook của store vào.
10. **`ThemeSwitch` và `ThemeMenuGroup`** (Task 3; spec §6.3, §7 đã sửa):
    - Tên của nút là `labels.trigger(labels[current])`: các hàm của `labels` nhận chữ, không nhận giá trị, nên một chữ đã dịch tới được tên, tooltip và gợi ý. `aria-describedby` là `joinIds(<id của gợi ý>, <của người gọi>)`; gợi ý là `<span hidden>` đặt sau gốc của tooltip.
    - `data-pending` có khi không truyền `value` và chưa có effect đầu tiên; effect đặt `mounted` được khai báo sau lần đăng ký của store, nên cả hai đổi trong một lần render. `ThemeSwitchProps` bỏ cả `asChild`, `ThemeMenuGroupProps` bỏ cả `children`.
    - **Tooltip của T1 gắn vào nút** (`side="bottom"`, `align="end"`, cách 17px, spec §4.3 đã duyệt), nên nó nằm lệch trái khoảng 36px so với mockup t1, nơi tooltip được ghim cách mép cuối header 12px (`.mk-tipR right: 12px`). Đó là bản chất của một tooltip gắn vào trigger; mô tả PR nêu điều này.
    - **Mỗi story một tooltip hay một popover đang mở:** trạng thái hover (`ThemeSwitch`, dải 4, `data-visual-hover="tooltip"`) và focus bàn phím (`ThemeSwitchFocus`) là hai story; hai mảnh menu Dark và System của mockup t3 là `ThemeMenuGroupDark` và `ThemeMenuGroupSystem` (spec §7 đã sửa).
    - **Lần trả lại Task 3:** header của mockup t3 không có nút theme (theme nằm trong menu cá nhân), nhưng ba story T3 vẽ nút theme giữ chỗ giữa chuông và avatar. Ba story nay truyền `theme={null}` cho `End` (khe `null` không render gì, chỉ `undefined` mới lấy nút giữ chỗ); ảnh của Claude chỉ còn chuông và avatar, menu ở yên chỗ cũ.
    - `ThemeMenuGroup` là `MenuRadioGroup` (controlled bằng giá trị của store) với `MenuLabel` và ba `MenuRadioItem` có `textValue` và icon ở cuối (`span.flg-theme-menu-icon[aria-hidden]`), nên tên của mục chỉ là chữ của nó.
    - **Story `TwoShellsStayInSync` ghi `localStorage` từ một iframe ẩn cùng gốc**, vì một tài liệu không nhận sự kiện `storage` cho lần ghi của chính nó. Nó pass ở ba engine trên máy này, nhưng là story dễ chập chờn nhất ở WebKit của CI. Mọi story hành vi của theme trả lại `<html>` và các khoá nó đã dùng.
    - Không có cặp tương phản mới; icon ở cuối mục đang được trỏ là cùng cặp của dòng 9 (nhãn mở rộng).
    - `PersonIcon` và `LogOutIcon` chuyển từ `UserMenu.stories.tsx` vào `.storybook/icons.tsx` (cùng SVG), để hai file story không giữ hai bản; helper của header thêm khe `theme`.
11. **`ThemeScript`** (Task 3; spec §6.3 đã sửa):
    - `themeScriptSource(storageKey)` là đúng chuỗi của spec; khoá được chèn bằng `JSON.stringify` rồi mọi `<` thành `\u003c`. Dòng spec cũ viết cả hai vế là `<` (một phép thay không làm gì) và được sửa.
    - `<script>` có `nonce` và `suppressHydrationWarning` (trình duyệt xoá giá trị `nonce` sau khi dùng); đột biến bỏ `suppressHydrationWarning` làm test hydrate có `nonce` fail. `ThemeScript` không có `ref` (không có phần tử nào để trỏ), nên không dùng `forwardRef`.
    - `scripts/rsc-probe.mjs` thêm hai ca (`ThemeScript with the default key`, `ThemeScript with a storageKey and a nonce`); probe nhận một `check(tree)` tuỳ chọn và một phần tử không có class.
    - **Giới hạn đã biết** (mô tả PR): `defaultValue` khác `system` khi chưa lưu gì thì trang nháy một lần (`ThemeScript` không biết `defaultValue`; docs khuyên để mặc định). Với next-themes (controlled), `theme` là `undefined` trên server, nên icon là của System cho tới khi mount (docs dùng `?? 'system'`, vì `value={undefined}` là uncontrolled).
    - `themeScriptSource` không được export từ gói, nên đoạn script cho SPA trong `ThemeSwitch.mdx` là bản chép tay; Task 5 chép từ đó vào fixture Vite và thêm test giữ cả hai bản bằng chuỗi gốc (phát hiện 16).
12. **`List surface` và công thức bảng thông báo** (Task 4; spec §4.3 đã sửa):
    - `surface` mặc định `true`, DOM không đổi (unit test: lớp `flg-surface`, không `data-surface`). Thay đổi CSS duy nhất là một quy tắc mà selector cần `[data-surface='false']` (hàng đầu và cuối không bo góc riêng), nên không phần tử nào có sẵn khớp nó; ảnh của List không đổi. `surface={false}` ở variant khác: `devWarn`, DOM của variant giữ nguyên.
    - Công thức chỉ dựng từ lib: `IconButton` trong `Indicator status="danger"` (B1) hay `"accent"` (B3), `Popover`, `List surface={false}` (B1) hay `List variant="plain"` trong `Tabs` (B3). Tên của chuông có số chưa đọc ("Notifications, 2 unread"); hàng chưa đọc có chữ ẩn "Unread: ", tiêu đề đậm hơn và một chấm `aria-hidden`.
    - **"Mark all as read" ở yên** cả khi không còn hàng chưa đọc, và chỉ mất khi danh sách rỗng: nếu nó biến mất ngay khi bấm thì focus rơi xuống đầu trang. **Chuông nhận `count={số chưa đọc}`** và tự không vẽ gì ở 0, nên công thức không cần `show`. Hai dòng spec được thêm.
    - **WebKit không đưa focus vào nút khi bấm chuột** (focus vào tấm, vốn có `tabindex`): story chỉ đòi focus còn trong tấm sau một cú bấm chuột, và đòi nút giữ focus sau Enter.
    - Bảng cách chuông 17px, rộng 360px, căn mép cuối; trên điện thoại rộng bằng chỗ cửa sổ còn lại. Tiêu đề dài kết thúc bằng "…" (tiêu đề của `List` một dòng).
    - Dòng 6 (thời gian), 14 (chấm chưa đọc: dark 2.29:1, không phải dấu hiệu duy nhất) và 29 ("Mark all as read") mở rộng.
    - **Trang Examples hiện icon System của T1 (mặc định) và "Ctrl K" trên Linux**, không phải mặt trời và "⌘K" của mockup: đó là mặc định thật của lib, Claude chấp nhận.
    - Helper chung: khe `bell` của `.storybook/header-strip.tsx`; `PAGE_RULES` chuyển nguyên sang `.storybook/app-shell-demo.tsx`; `src/docs/css.d.ts` khai báo `*.css` cho `import './notifications.css'` của công thức.
13. **Docs** (Task 1–4):
    - `SearchField.mdx` (Task 1): Props, A form control, The clear button, Shortcut (The words), Collapsible (In the header, on a phone), In the header, Accessibility, Do and don't. Khung điện thoại là `StoryFrame` (iframe của story), vì ô phủ header chỉ có dưới 768px.
    - `UserMenu.mdx` (Task 2): Props, The avatar (`fallback` cho tên Việt Nam), The button, The menu (The header), The keys, The words, Accessibility, Do and don't; nói `min-width: 0` cho phần tử bọc, và nền "mở" của U2 chỉ có trong `AppShellHeader`.
    - `ThemeSwitch.mdx` (Task 3): How the theme is kept, ThemeSwitch, ThemeMenuGroup, ThemeScript (A Content Security Policy, next-themes, đoạn script cho SPA), The words, Hydration, Accessibility, Do and don't. Test của Task 5 đọc đoạn script trong khối ` ```html ` đầu tiên có dạng `<script>` … `</script>`; đổi dạng khối đó là hỏng test.
    - Task 4: `List.mdx` mục "Inside glass"; trang "Examples/App shell" (The application, The frame, The notifications panel, What a screen reader is told, The panel in its states, The code, With a router), hiện code bằng `?raw` và đổi `'../../index'` thành `'h2d-glass-ui'` (`asShown`); khung là `StoryFrame` với id `examples-app-shell--…` (đổi tên story là hỏng khung). Getting started mục "App shell" (Server and client, Keep the sidebar folded, Two rules for the document, The theme, and no flash, The Toaster, and text on the page), sau "Show data". Trang Accessibility: mục mới "The widgets of the header", sau "Navigation and the Indicator".
14. **Story `SheetClosesSidebarLayout` và `SheetClosesHeaderLayout` của AppShell** (Task 4): story này fail hai lần trên CI ở WebKit, ở bước PageDown sau khi tấm đóng. `waitFor` nay có `{ timeout: 5000, interval: 300 }` và một chú thích: 300ms giữa hai lần nhấn là khoảng thời gian một lần cuộn mượt bắt đầu dời trang. **Đó là giả thuyết**: không tái hiện được trên máy này (165/165 ở ba engine trước và sau).
15. **Fixtures** (Task 5):
    - Next.js: `app/layout.tsx` có `<ThemeScript />` trong `<head>` và `suppressHydrationWarning` trên `<html>` (`Toaster` đã nằm trong layout, ngoài mọi khung). **Route là `app/shell/[[...slug]]`**, để mọi `Link` của nav tới một trang thật (không có 404 khi prefetch); kịch bản mở `/shell/projects/mobile`, nên con của nhóm là mục đang chọn. Trang là Server Component (đọc `params` và cookie `flg-sidebar`); `nav.tsx` là Server Component (nav từ một mảng dữ liệu, `NavItem asChild` với `Link`, một `NavGroup`, số đếm 12); `shell.tsx` là `'use client'` (`AppShell` với `defaultCollapsed`, cookie, `AppShellBrand asChild`, `<form role="search">` với `SearchField shortcut="/"`, chuông, `ThemeSwitch`, `UserMenu` có `ThemeMenuGroup`, footer, `data-hydrated` trên main).
    - Vite: entry thứ hai `shell.html` (script theme trên một dòng, `<!-- prettier-ignore -->`), `src/shell-main.tsx`, `src/ShellPage.tsx` (link là hash; cookie đọc từ `document.cookie` vì không có server), `vite.config.ts` có hai `rollupOptions.input`. Spec §6.3 nói ứng dụng Vite chép đoạn script vào `index.html`; fixture đặt nó vào `shell.html`, HTML của entry thứ hai (§7: "HTML của entry"), vì trang có sẵn không được đổi.
    - Kịch bản (`scripts/test-fixtures.mjs`): `listenForProblems` tách khỏi `checkPage` (cùng bộ lọc); `checkPage` thêm: trang chính giữ margin 8px của `body` và `scroll-padding-top: auto`; `checkShellHtml` (chỉ Next: HTML từ server, không chạy script) và `checkShell` (cả hai app, trình duyệt), chạy ở cả hai bản của mỗi app; `APPS[…].shellPath` (`/shell/projects/mobile`, `/shell.html#/projects/mobile`). Mười ba check của §7 "Kịch bản kiểm tra" đều có (báo cáo của Task 5 liệt kê), console sạch.
    - Lần chạy đầu với Next fail với 8 lỗi, đều của kịch bản: regex của skip link và của nhóm khớp nhầm (`class="flg-app-shell-skip flg-visually-hidden"` và nút khác), và `MutationObserver` được đặt trên `document.documentElement` trước khi có `<html>`. Sửa trong kịch bản, không trong fixture.
    - Kịch bản không kiểm "icon của ThemeSwitch đúng trước khi hydrate" (§7 lớp 2, không nằm trong danh sách của kịch bản); story `IconBeforeHydration` của Task 3 kiểm nó. Check "trước khi hydrate" của kịch bản dựa vào một `MutationObserver` do init script đặt, không dựa vào ảnh của trang đã vẽ.
16. **Các bản chép của script theme** (Task 5): `scripts/lib/theme-script-copies.test.ts` (project `scripts`) so script trong `<head>` của `fixtures/vite-app/shell.html` với `themeScriptSource('flg-theme')` từng ký tự, và đoạn script trong `ThemeSwitch.mdx` sau khi bỏ khoảng trắng, kiểu dấu nháy và dấu `;` mà Prettier thêm (đoạn docs đã được định dạng, nên không thể trùng từng ký tự).
17. **Phát hành `0.4.0`** (Task 5): `.changeset/phase-5-app-shell.md` (`minor`) liệt kê AppShell và các phần, Nav và các phần, Indicator, SearchField, ThemeSwitch, ThemeMenuGroup, ThemeScript, UserMenu, prop `surface` của `List`, hai token mới, các phần server-safe; không có thay đổi phá vỡ. Việc merge làm gì: Global Constraints, "Changeset".
18. **Ngưỡng kích thước và `check:package` giữa các task:**
    - Ngưỡng ban đầu (ghi sau các sửa của PR #38): JS 57286 B, CSS 17041 B.
    - Sau Task 1: PASS (JS 53.06 kB, CSS 15.79 kB). Sau Task 2: PASS (JS 53.59 kB, CSS 16.04 kB). Sau Task 3: PASS (JS 54.68 kB, CSS 16.12 kB). Sau Task 4: PASS (JS 54.71 kB, CSS 16.16 kB).
    - Task 5 chạy `pnpm size:record`: JS 60183 B, CSS 17773 B (số đo cộng 10%). Việc gì thêm CSS hay JS sau Task 5 phải chạy lại `size:record`.
19. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: `editable.test.ts`, `platform.test.ts`, `shortcut.test.tsx`, test của icon, test của `contrast.ts` và `ExceptionTable.test.tsx` viết trước và fail trước. **`SearchField.test.tsx` (54 test ở mỗi project React) và `SearchField.test-d.ts` viết sau component**; `SearchField.test.tsx` được kiểm bằng bảy đột biến, cái nào cũng bị bắt. Báo cáo kể: bỏ kiểm tra IME (2 test fail), bỏ kiểm tra `activeElement` khi cửa sổ mất focus (1), bỏ việc đưa focus về nút (3), bỏ giá trị phía server của nền tảng (2, hydrate), bỏ `describe={false}` (1), bỏ `preventDefault` của Esc (1). Story viết cùng code; story bố cục fail lần đầu vì lỗi thật (phát hiện 2, 6).
    - Task 2: mọi test của `UserMenu.test.tsx` và `UserMenu.test-d.ts` viết trước `UserMenu.tsx`, nên lần chạy đầu fail cùng lúc vì module chưa có. Sau code, bảy đột biến làm từng test fail đúng lý do: trải `labels` thay cho `withDefaults` (tên đọc thành "undefined"), lấy từ thứ hai thay cho từ cuối ("NM" thay cho "NA"), truyền `alt` của người gọi (avatar có tên và không `aria-hidden`), `align` mặc định `start`, chỉ giữ id của đầu menu (thiếu mô tả của `contentProps`), `Boolean(description)` (`0` không được vẽ), bỏ cảnh báo (`expected "warn" to be called 1 times, but got 0`). Các test còn lại pass với code là đặc tả.
    - Task 3: mọi file test viết trước code và fail vì module chưa có; ba test icon mới fail với `Element type is invalid`. Nhiều test của store pass ngay với code (đặc tả). Hai đột biến: bỏ `suppressHydrationWarning` làm test hydrate của `ThemeScript` fail; đổi `:root[data-flg-theme='dark']` thành `'dark-x'` trong quy tắc `data-pending` làm `IconBeforeHydration` fail ở cả ba engine. Các lỗi của chính test tìm ra khi chạy, ví dụ: một root hydrate còn mount làm 11 test sau fail (`expected null to be 'dark'`); cảnh báo `useLayoutEffect` của `renderToString` ở React 18 (spy đặt sau nó, như `UserMenu.test.tsx`); `ref` không phải prop của helper ở React 18 (đổi tên thành `groupRef`); jsdom không có `scrollIntoView` (giả lập trong test).
    - Task 4: unit test và test kiểu của `surface` viết trước và fail (`expect(element).not.toHaveClass("flg-surface")`; `warn` được gọi 0 lần; `Property 'surface' does not exist`). Story `InsetWithoutSurface` viết sau CSS (đặc tả); làm hỏng selector thì nó fail (`expected ['11px','11px','0px','0px'] to equal 0px`). Công thức và story của nó viết sau code; ba đột biến đều bị bắt: ẩn "Mark all as read" khi không còn hàng chưa đọc (`MarkAllAsRead…`, `TabsFilterTheRows` fail), bỏ "Unread: " (`UnreadIsMoreThanColour…` fail), `sideOffset` 8 (`PanelPlace…` fail).
    - Task 5: hai bản chép đã đúng khi test được viết, nên không có gì để fail trên bản nháp; làm hỏng từng bản (bỏ `||v==="dark"` khỏi `shell.html`, bỏ `|| v === 'dark'` khỏi `ThemeSwitch.mdx`) thì test tương ứng fail. Trên cây của plan, test Vite fail ở Step 2 vì `shell.html` chưa có. Kịch bản fixture nằm trong patch code (cùng các fixture), nên chạy ở Step 4.
    - Trên cây của plan, patch test của Task 1, 2 và 3 làm file test của module mới fail vì module chưa có (`Failed to resolve import …`).
20. **Các chỗ spec được sửa khi lập Plan C** (đánh dấu "(phát hiện khi lập Plan C)" ở chỗ nêu lý do):
    - §4.3 SearchField, "Phần chung" và "H2" (Task 1): `width: 280px` trong header, và vì sao; H2 dưới 768px `flex: 1 1 0%`.
    - §5 `platform.ts` (Task 1): không phân biệt hoa thường; đọc qua `useSyncExternalStore` có giá trị phía server là `undefined`.
    - §6.3 `UserMenu` (Task 2): kiểu bỏ `asChild` và `id`, và vì sao. §7 "Gói phát hành" (Task 2): lớp của nút là `flg-user-menu`, như code và `check-dist-css.ts`; spec từng ghi `flg-user-menu-trigger` (người viết plan phát hiện).
    - §3.7, §5 `theme-store.ts` (Task 3): trả `[giá trị, đặt giá trị]`, đọc lại khi mọi người đăng ký đã đi hết, `theme-value.ts`.
    - §6.3 theme (Task 3): kiểu bỏ `asChild` (`ThemeSwitchProps`) và `children` (`ThemeMenuGroupProps`); sự kiện `storage` cho khoá bị xoá, `clear()` hay giá trị lạ là `'system'`; thứ tự đọc lúc mount; phép thoát `<` của `ThemeScript`.
    - §7, story giao diện của Plan C (Task 3): `ThemeSwitchFocus`, `ThemeMenuGroupDark`, `ThemeMenuGroupSystem`.
    - §4.3 công thức bảng thông báo (Task 4): "Mark all as read" ở yên; chuông có `count`.
    - Spec 0+1 §4.9: dòng 36, đoạn về dòng 36, "Cả ba mươi sáu điểm" (Task 1); nhãn và đoạn của dòng 2, 6 (Task 2), 9 (Task 3), 6, 14, 29 (Task 4).
    - Task 5 không sửa dòng spec nào.
21. **Ảnh chuẩn của component cũ không đổi.**
    - CSS mới nằm trong `search-field.css`, `user-menu.css`, `theme-switch.css`, đều dưới `.flg-search-field…`, `.flg-user-menu…`, `.flg-theme-…`, hay dưới `.flg-app-shell-header:has(.flg-search-field…)`, mà không story cũ nào có. `preferences.css` chỉ thêm quy tắc cho các lớp mới. Quy tắc mới của `list.css` cần `[data-surface='false']`.
    - Không token nào được thêm hay đổi. `isEditable` chỉ đổi chỗ; `ArrowIcon` thêm một hướng; `SearchIcon`, `SunIcon`, `MoonIcon`, `MonitorIcon` là icon mới.
    - Story của AppShell: chỉ `waitFor` của `SheetCloses…` đổi, và `PAGE_RULES` chuyển chỗ nguyên văn. Story của Nav, Indicator, List (trừ `InsetWithoutSurface` mới, `no-visual`) không đổi.
    - Số story có ảnh đi từ 130 lên 152, đúng 22 story của Plan C. Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
22. **Duyệt của chủ dự án.** Không có gì chờ duyệt ngoài review PR (dòng 36 được duyệt cùng spec). Mô tả PR vẫn liệt kê:
    - các dòng spec sửa trong bản nháp (phát hiện 20);
    - dòng 36 mới và các dòng 2, 6, 9, 14, 29 mở rộng;
    - chỗ của tooltip T1 (phát hiện 10);
    - các điểm ngoài spec mà Claude chấp nhận: Esc trên ô thu gọn rỗng bị `preventDefault`, ô tìm kiếm khác ẩn khi H3 phủ header, ô tắt hay chỉ đọc không có nút xoá và không nhận phím tắt (phát hiện 2, 3);
    - các giới hạn đã biết: SearchField (vòng ← nhạt ở Firefox tối cho tới khi transition xong; ô phủ cao 55px; ô `required` thu gọn chặn việc gửi form mà không hiện gì; dải "mở, có chữ" của H3 không có focus), `min-width: 0` của phần tử bọc U2, `defaultValue` khác `system` nháy một lần, icon System với next-themes trước khi mount, story `storage` qua iframe ẩn (dễ chập chờn nhất ở WebKit của CI), sửa của `SheetCloses…` là giả thuyết, WebKit không focus nút khi bấm chuột, chấm chưa đọc 2.29:1 ở dark (dòng 14) và tiêu đề dài bị cắt trong bảng thông báo, trang Examples hiện System và "Ctrl K" trên Linux;
    - 176 ảnh chuẩn mới cần duyệt: 22 story giao diện × 4 chế độ × sáng, tối, đếm từ index đã build (lệnh ở Step 4 của Task 5);
    - merge PR này làm workflow "Release" mở PR "Version Packages" cho `0.4.0`, mà chỉ chủ dự án merge (Global Constraints, "Changeset").
23. **Các mục để lại** (không làm ở plan này):
    - Kiểm tra screen reader (§7 lớp 6): SearchField (tên, phím tắt, nút xoá), ThemeSwitch (tên và gợi ý), ThemeMenuGroup, đầu menu của UserMenu được đọc khi mở, tên của chuông có số chưa đọc. Ghi "chưa kiểm tra" cho từng mục (spec §9).
    - Một ô H3 `required` rỗng đang thu gọn chặn việc gửi form gốc mà không hiện gì (phát hiện 3).
    - Vòng focus của nút ← nhạt ở Firefox tối cho tới khi transition xong; ô phủ cao 55px (phát hiện 2, 6).
    - Chưa fixture nào đặt một CSP thật; `nonce` chỉ được kiểm ở unit test và `check:rsc`.
    - Story `storage` qua iframe ẩn có thể chập chờn ở WebKit của CI; sửa của `SheetCloses…` chưa được chứng minh (phát hiện 14).
    - Safari thật (không đưa focus vào nút khi bấm; phím Tab) và iPad: story chỉ chạy WebKit của Playwright.

**Phạm vi:**
- **Không làm ở plan này:**
  - Ngoài phạm vi của spec §2: menu ngang hay mega menu trên header, hộp lệnh (⌘K mở một command palette), điều hướng sâu quá 2 cấp, sidebar phải, kéo đổi độ rộng sidebar, breadcrumb riêng của header, thông báo đẩy hay realtime, component "bảng thông báo" (đó là công thức docs), hướng phải sang trái, hệ thống i18n.
  - Trạng thái mở của H3 không controlled (spec §6.3).
  - Các mục để lại ở phát hiện 23.
- **Ảnh chuẩn visual:**
  - 22 story giao diện, mỗi story 8 ảnh (4 chế độ × sáng, tối): 176 ảnh mới.
    - SearchField (5): `SearchFieldDefault`, `SearchFieldCollapsible` (dải dựng trong story); `SearchFieldDefaultPhone`, `SearchFieldCollapsiblePhone`, `SearchFieldCollapsiblePhoneOpen` (AppShell thật, `stage: 'page'`, `viewport-360x640`).
    - UserMenu (4): `UserMenu`, `UserMenuShowName` (dải); `UserMenuOpen`, `UserMenuShowNameOpen` (header thật, `viewport-1280x720`).
    - ThemeSwitch (5): `ThemeSwitch`, `ThemeSwitchFocus` (dải); `ThemeMenuGroup`, `ThemeMenuGroupDark`, `ThemeMenuGroupSystem` (header thật, `viewport-1280x720`).
    - Examples/App shell (8): `NotificationsList`, `NotificationsTabs` (dải); `NotificationsListOpen`, `NotificationsListEmpty`, `NotificationsTabsOpen`, `NotificationsTabsEmpty`, `AppShellExample` (header hay trang thật, `viewport-1280x720`); `AppShellExamplePhone` (`viewport-390x844`).
  - Mỗi story có nhiều nhất một phần tử được rê chuột (`data-visual-hover`, hay `data-visual-hover="tooltip"` cho tooltip của H3 và T1) và một phần tử được focus (play function).
  - Mọi story khác của Plan C gắn `no-visual`. Index đã build có 152 story có ảnh (130 trước Plan C).
  - Không tạo ảnh trên Windows. Ảnh chuẩn mới chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh; mọi story mới chạy lần đầu với ảnh chuẩn trong CI.
  - Ảnh của mọi component cũ phải giữ giống từng byte (phát hiện 21).

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`; code của công thức trong `src/docs/app-shell-example/` import từ `'../../index'` và trang hiện nó với `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency, kể cả trong fixture.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
  - `:has()` (brand chỉ còn dấu với H2, ô phủ của H3, phần còn lại của header bị ẩn) có ở mọi trình duyệt của mốc này.
  - `navigator.userAgentData` không có ở Safari và Firefox: `isApplePlatform` lùi về `navigator.platform`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Giao diện và trạng thái dùng data-attribute, đặt sau props của người dùng: `data-collapsible`, `data-open` trên gốc của SearchField; `data-show-name`, `data-icon-only` trên nút của UserMenu và `data-show-name` trên menu của nó; `data-value`, `data-pending` trên nút của ThemeSwitch và `data-for` trên ba icon của nó; `data-surface="false"` trên `List`. Theme nằm ở `data-flg-theme` trên `<html>`.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`.
  - `src/styles/components/search-field.css`, `user-menu.css`, `theme-switch.css` (import theo thứ tự đó trong `src/styles/index.css`), và quy tắc mới của `list.css`.
  - Quy tắc `forced-colors` nằm trong `src/styles/preferences.css`. Một selector forced colors phải cụ thể ít nhất bằng selector contrast-more của cùng phần: Chromium khớp cả hai khi màu bị ép.
  - CSS của công thức (`src/docs/app-shell-example/notifications.css`, lớp `notif-…`) là của docs, không vào `styles.css` của gói.
- Mỗi điểm gãy đúng một ranh giới: các quy tắc điện thoại của SearchField nằm trong một `@media not all and (min-width: 768px)`; không bao giờ một cặp 767/768 hay `max-width`.
- **Mockup lock.** Không giá trị token nào trong `src/styles/theme/values.ts` đổi, và Plan C không thêm token. Component cũ phải giữ ảnh giống từng byte. SearchField theo đúng H2, H3; UserMenu theo U1, U2; ThemeSwitch theo T1, ThemeMenuGroup theo T3; công thức theo B1, B3.
- Mọi component dùng `forwardRef` (trừ `ThemeScript`, không có `ref`, spec §6.1), export kiểu props của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`).
  - `SearchField.tsx`, `UserMenu.tsx`, `ThemeSwitch.tsx` là client: bắt đầu bằng `"use client"` và có trong `scripts/check-use-client.ts`.
  - `ThemeScript.tsx` là server-safe: không `"use client"`, không hook, chỉ import `theme-script.ts` (và qua nó `theme-value.ts`), có hai ca trong `scripts/rsc-probe.mjs`.
  - Class CSS mới có trong `scripts/check-dist-css.ts`.
  - `themeScriptSource`, store theme, `isEditable` và `isApplePlatform` không được export từ `src/index.ts`.
- Cặp tương phản mới nằm trong `scripts/lib/contrast.ts`. Cặp dưới ngưỡng ở theme mặc định là ngoại lệ trong `scripts/contrast-exceptions.ts`, kèm số dòng §4.9. Bảng §4.9 cùng đoạn sau nó trong spec 0+1, `src/docs/ExceptionTable.test.tsx` và câu trỏ của `src/docs/Accessibility.mdx` đi cùng nhau.
- Cảnh báo dev đi qua `devWarn`; lời cảnh báo không chứa giá trị đổi theo mỗi lần render. Lib không throw khi người dùng dùng sai, kể cả khi `localStorage` ném lỗi. Trang docs (`*.mdx`) viết bằng tiếng Anh, dòng văn ngắt ở 100 ký tự.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR từ `feat/phase-5-plan-c`. Nhánh đó cắt từ `main` (`87b8578`), nên PR chỉ mang các commit của Plan C và file plan.
- **Changeset:** Plan C thêm `.changeset/phase-5-app-shell.md` (`minor`, Task 5), changeset duy nhất của giai đoạn 5. Merge PR của Plan C là một push lên `main`, nên workflow "Release" (`.github/workflows/release.yml`) chạy:
  - `changesets/action@v2` thấy changeset đang chờ, nên mở PR "Version Packages" (hoặc cập nhật PR đó nếu đã có). PR đó chạy `pnpm changeset version`: nâng `package.json` từ `0.3.1` lên `0.4.0`, ghi `CHANGELOG.md` và xoá file changeset. Lượt chạy này không publish gì.
  - Chỉ khi chủ dự án merge PR "Version Packages", lượt chạy sau của workflow mới chạy `pnpm release` (`pnpm build && changeset publish`): publish `0.4.0` lên npm qua trusted publishing (OIDC, có provenance, không token nào nằm trong repo), đẩy tag phiên bản và tạo GitHub release. Bản đó mang theo cả Plan A, Plan B và Plan C.
  - Merge PR "Version Packages" là quyết định publish của chủ dự án. Claude không merge PR đó, không chạy `changeset version`, `changeset publish` hay `npm publish`, và không bao giờ cầm token npm.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (ghi sau các sửa của PR #38): JS 57286 B, CSS 17041 B.
  - Task 1 đến Task 4: `check:package` PASS với ngưỡng cũ (phát hiện 18).
  - Chỉ Task 5 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 60183 B, CSS 17773 B.
- Trước mọi lệnh `pnpm vitest run` chạy thẳng, chạy `pnpm gen:theme`: nó ghi các file trong `src/styles/generated/`, mà story cần. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, và từng project một (`storybook-light` rồi `storybook-dark`: chạy cả hai trong một tiến trình đã làm đứt kết nối tới trình duyệt trên máy này), như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc.
- **Cổng 5173, 4173, 5174 và 4174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`**: script ghim cổng 5173 và 4173. Fixture chạy qua một bản sao tạm của `scripts/test-fixtures.mjs` với cổng đổi sang một cặp rảnh, kiểm trước bằng `netstat -ano | grep LISTENING` (bản nháp dùng 5179/4179), cùng cổng 3100 và 3101 của Next; Task 5 ghi lệnh. Xoá bản sao sau khi chạy, kể cả khi nó fail; bản sao không bao giờ được commit. Chỉ tắt tiến trình mình đã mở. Storybook chạy tạm (nếu cần) dùng cổng khác. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Plan C (176 ảnh) đến từ workflow "Update visual baselines" sau khi đẩy nhánh. Không ảnh cũ nào được đổi (story của AppShell, Nav, Indicator, List).
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch, test rồi code; áp theo đúng thứ tự trong plan. Khối test chứa file `*.test.ts(x)`, `*.test-d.ts`, `*.stories.tsx` và helper chỉ story dùng (`.storybook/header-strip.tsx`, `.storybook/icons.tsx`, `.storybook/app-shell-demo.tsx`). Khối test của Task 5 chỉ có `scripts/lib/theme-script-copies.test.ts`; kịch bản fixture (`scripts/test-fixtures.mjs`) nằm trong khối code, cùng các fixture.
- Khối code của Task 1 đến Task 4 có dòng bắt đầu bằng ba dấu backtick (khối code trong `SearchField.mdx`, `UserMenu.mdx`, `ThemeSwitch.mdx`, `List.mdx`, `GettingStarted.mdx`, và ngữ cảnh quanh khối `ts` của spec giai đoạn 5), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Các file nhiều task cùng sửa:
  - Task 1 đến 4: spec giai đoạn 5, spec 0+1, `scripts/contrast-exceptions.ts`, `src/docs/Accessibility.mdx`.
  - Task 1 đến 3: `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`.
  - Task 1 và 3: `src/internal/icons.tsx`, `icons.test.tsx`. Task 1 và 2: `SearchField.stories.tsx`. Task 2 và 3: `UserMenu.stories.tsx`. Task 2, 3 và 4: `.storybook/header-strip.tsx`.
  - Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào. `.size-limit.json` không có trong patch nào: Task 5 ghi nó bằng `pnpm size:record`. `src/styles/generated/*.css` không có trong patch nào: `pnpm gen:theme` sinh chúng.
- Đường dẫn `fixtures/next-app/app/shell/[[...slug]]/page.tsx` có dấu ngoặc vuông: trong shell, đặt nó trong dấu nháy đơn (lệnh `git add` của Task 5 đã làm vậy).

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng, trừ chỗ ghi rõ là chưa có:

1. **Phím tắt tìm kiếm được nhấn khi đang gõ ở một ô khác, hay khi bộ gõ (IME) đang soạn chữ.** Phím là của chỗ đang gõ: không focus ô tìm kiếm, không `preventDefault`, nên "/" vẫn được gõ ra; một phím đã có ai `preventDefault` hay phím của bộ gõ cũng bị bỏ qua. Esc khi đang soạn chữ là của bộ gõ, không xoá và không đóng ô. Hai ô cùng một phím: ô mount sau cùng nhận phím, và trả lại khi nó unmount. Test ở Task 1:
   - `SearchField > shortcut > leaves the key to a place where the user types, including this field`, `leaves a key that something else prevented, and one the input method owns`, `"mod+k" is ⌘K on an Apple system and Ctrl K elsewhere`, `is not taken by a field that is disabled, and is again when it is enabled`, `goes to the field mounted last when two ask for the same key, and back when it unmounts`;
   - `SearchField > Esc > leaves the key to the input method while it composes`, `SearchField > collapsible > Esc during an input method composition does not close it`;
   - `useShortcut > skips an editable target, an event that was prevented and one in an IME composition`; `matchesShortcut > "/" is the slash key with no Ctrl, Meta or Alt, Shift allowed`, `"mod+k" takes the capital K that Caps Lock types`;
   - story `ShortcutsAndEsc` (ba engine, phím thật: "/" gõ trong một ô, kể cả ô này, là một chữ).
2. **H3 trên điện thoại, có chữ, đóng bằng nút ←.** Ô phủ hàng header; phần còn lại của header (kể cả một ô tìm kiếm khác) ẩn khỏi mắt, cây truy cập và thứ tự Tab; ← đóng mà giữ chữ, focus về nút, mở lại thì chữ vẫn đó; có chữ thì ô không tự đóng khi focus rời; chữ vẫn được gửi cùng form khi ô đóng. Test ở Task 1:
   - `SearchField > collapsible > the ← button closes it with the text kept, the focus on the button; opening again shows the text`, `names the ← button with labels.close`, `does not close while it has text, or while the focus is on one of its own buttons`, `keeps the text it has in a form while it is closed`;
   - story `InTheHeader` (360px và màn rộng: ô phủ, phần còn lại ẩn và ra khỏi thứ tự Tab, ← giữ chữ, trang không cuộn ngang), `FocusRings` (vòng của nút ← ở mép trái header điện thoại được vẽ, không bị cắt), story giao diện `SearchFieldCollapsiblePhoneOpen`.
   - Chỗ hở đã biết: vòng ← nhạt ở Firefox tối cho tới khi transition xong; một ô `required` rỗng đang thu gọn chặn việc gửi form (phát hiện 2, 3).
3. **Theme đã lưu: trước khi hydrate dưới `ThemeScript` có `nonce` của CSP, khi `localStorage` ném lỗi (Safari riêng tư), và hai control theme cùng khoá.** Script đặt `data-flg-theme` trước khi trang vẽ, CSS chọn icon theo `<html>` khi nút còn `data-pending`, hydrate không cảnh báo dù trình duyệt đã ẩn `nonce`; một khoá chứa `</script>` không đóng được thẻ. `localStorage` ném lỗi thì không gì vỡ và theme sống trong trang. `ThemeSwitch` và `ThemeMenuGroup` cùng khoá luôn khớp nhau, và theo tab khác. Test:
   - Task 3: `ThemeScript > puts the nonce on the tag, and has no attribute without one`, `cannot be closed early by a key that holds a tag`, `hydrates without a warning when the browser has hidden the nonce, as it does after it ran the script`; `themeScriptSource > when it runs > does not throw when localStorage cannot be read, and leaves <html> as it is`; `ThemeSwitch > before hydration > is rendered with the default value and data-pending, which the CSS reads the icon from <html> by`, `drops data-pending at the first effect, with the stored value shown, and warns of no mismatch`; story `IconBeforeHydration` (dark, light, system, chưa lưu; ba engine).
   - Task 3: `useThemeValue > when localStorage is not there >` (ba test), `ThemeSwitch > uncontrolled > goes on working when localStorage throws`, story `WorksWhenLocalStorageThrows`.
   - Task 3: `useThemeValue > uncontrolled > keeps every consumer of one key in step, and the other keys apart`, `follows a storage event for its key, from another tab, and puts it on <html>`, `takes a key that was removed, or all of localStorage cleared, for 'system'`; `ThemeSwitch > uncontrolled > keeps two switches of one key in step, and tells them from a switch of another key`; `ThemeMenuGroup > with a ThemeSwitch of the same key > agrees with it, whichever of the two is used`; story `TwoShellsStayInSync` (sự kiện `storage` thật từ một iframe cùng gốc).
   - Task 5: `check:rsc` (`ThemeScript with a storageKey and a nonce`), check 5 của kịch bản fixture (`data-flg-theme="dark"` trước khi hydrate, Next và Vite), `the copies of the theme script` (hai bản chép).
   - Chỗ hở đã biết: chưa fixture nào đặt một CSP thật; `defaultValue` khác `system` nháy một lần; với next-themes icon là System cho tới khi mount (phát hiện 11, 23).
4. **Tên dài ở U2 trong một header hẹp.** Tên bị cắt ở 160px bằng "…", nút nằm trong cửa sổ và trang không cuộn ngang ở 360px; menu giữ bề rộng 244px (U1) hay 230px (U2) và cắt tiêu đề, dòng phụ dài; dấu tiếng Việt không bị cắt. Test ở Task 2:
   - story `LongNameAndChevron` (ở 360px: nút trong cửa sổ, tên hẹp lại, không cuộn ngang, `elementFromPoint` ở tâm nút là nút), `MenuPlace` (dòng dài bị cắt, `scrollWidth > clientWidth`, không làm menu rộng ra);
   - `UserMenu > the button > follows showName and name on a mounted button`.
   - Chỗ hở đã biết: phần tử bọc của chính ứng dụng cũng cần `min-width: 0` (docs nói; lib không ép được). Việc dấu chồng không bị cắt chỉ được xem bằng mắt (phát hiện 7).
5. **"Mark all as read" trong bảng thông báo.** Bấm xong, nút ở yên và giữ focus (focus không rơi xuống đầu trang); tên của chuông đổi từ "Notifications, 2 unread" thành "Notifications" và số trên chuông mất; Esc đóng bảng và focus về chuông; ở tab "Unread", danh sách thành rỗng và bảng nói không có gì mới, focus vẫn trên nút. Test ở Task 4:
   - story `MarkAllAsReadList`, `MarkAllAsReadTabs`, `TabsFilterTheRows` (ba engine, phím thật);
   - story `UnreadIsMoreThanColourList`, `UnreadIsMoreThanColourTabs` (hàng chưa đọc: "Unread: ", chữ đậm, chấm ẩn khỏi screen reader).
   - Chỗ hở đã biết: công thức là docs, không có unit test; ở WebKit một cú bấm chuột đưa focus vào tấm, không vào nút (phát hiện 12).

Các chỗ **chỉ story bắt được**: hình học trong header (`InTheHeader`: 280px, 300px, ô phủ 55px; `MenuPlace`; `TooltipUnderTheButton`; `PanelPlaceList`, `PanelPlaceTabs`, `PanelOnAPhone`); vòng focus đọc từ điểm ảnh (`FocusRings`) và vòng của U1 trong header thật (`RingsInTheHeader`); forced colors (`ForcedColors`, chỉ Chromium); phím thật của menu (`MenuKeys`) và đầu menu là mô tả (`HeaderIsTheDescription`); Enter gửi form (`EnterSubmitsTheForm`); icon trước khi hydrate (`IconBeforeHydration`); sự kiện `storage` thật (`TwoShellsStayInSync`); góc của `List surface={false}` (`InsetWithoutSurface`); mọi hành vi của công thức bảng thông báo. jsdom không có layout, và popover của jsdom chỉ là giả lập.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/editable.ts` (và test) | `isEditable`, chuyển từ Toaster (Task 1) |
| `src/internal/platform.ts` (và test) | `isApplePlatform` (Task 1) |
| `src/internal/icons.tsx` (và test) | `SearchIcon`, `ArrowIcon` `left` (Task 1); `SunIcon`, `MoonIcon`, `MonitorIcon` (Task 3) |
| `src/components/toast/Toaster.tsx` | Import `isEditable` (Task 1) |
| `src/components/search-field/SearchField.tsx`, `shortcut.ts`, `index.ts` | `SearchField`, phím tắt (Task 1) |
| `src/components/search-field/SearchField.test.tsx`, `shortcut.test.tsx`, `SearchField.test-d.ts`, `SearchField.stories.tsx` | Unit test, test kiểu, story (Task 1; story đổi helper ở Task 2) |
| `src/components/search-field/SearchField.mdx` | Trang docs (Task 1) |
| `src/styles/components/search-field.css` | SearchField, trong và ngoài header (Task 1) |
| `src/components/user-menu/UserMenu.tsx`, `index.ts` | `UserMenu` (Task 2) |
| `src/components/user-menu/UserMenu.test.tsx`, `UserMenu.test-d.ts`, `UserMenu.stories.tsx` | Unit test, test kiểu, story (Task 2; story đổi icon ở Task 3) |
| `src/components/user-menu/UserMenu.mdx` | Trang docs (Task 2) |
| `src/styles/components/user-menu.css` | Nút U1, U2, menu và đầu menu (Task 2) |
| `.storybook/header-strip.tsx` | Dải header và AppShell của story (Task 2; khe `theme` ở Task 3, `bell` ở Task 4) |
| `src/internal/theme-value.ts`, `theme-store.ts` (và test) | Kiểu và store theme (Task 3) |
| `src/components/theme-switch/ThemeSwitch.tsx`, `ThemeScript.tsx`, `theme-script.ts`, `index.ts` | `ThemeSwitch`, `ThemeMenuGroup`, `ThemeScript`, `themeScriptSource` (Task 3) |
| `src/components/theme-switch/*.test.ts(x)`, `ThemeSwitch.test-d.ts`, `ThemeSwitch.stories.tsx` | Unit test, test kiểu, story (Task 3) |
| `src/components/theme-switch/ThemeSwitch.mdx` | Trang docs (Task 3) |
| `src/styles/components/theme-switch.css` | Icon theo giá trị, icon cuối mục menu (Task 3) |
| `.storybook/icons.tsx` | `PersonIcon`, `LogOutIcon` cho story (Task 3) |
| `src/components/list/List.tsx`, `src/styles/components/list.css` (và test, story, `List.mdx`) | `surface` (Task 4) |
| `src/docs/app-shell-example/` (`Shell.tsx`, `notifications.tsx`, `notifications.css`, `icons.tsx`), `src/docs/css.d.ts` | Ứng dụng mẫu và công thức bảng thông báo (Task 4) |
| `src/docs/AppShellExample.mdx`, `AppShellExample.stories.tsx` | Trang "Examples/App shell" và story của nó (Task 4) |
| `src/docs/GettingStarted.mdx` | Mục "App shell" (Task 4) |
| `.storybook/app-shell-demo.tsx`, `src/components/app-shell/AppShell.stories.tsx` | `PAGE_RULES` dùng chung; `SheetCloses…` vững hơn (Task 4) |
| `fixtures/next-app/app/layout.tsx`, `fixtures/next-app/app/shell/` | `ThemeScript`; trang khung `/shell` (Task 5) |
| `fixtures/vite-app/shell.html`, `src/shell-main.tsx`, `src/ShellPage.tsx`, `vite.config.ts` | Entry thứ hai, trang khung (Task 5) |
| `scripts/test-fixtures.mjs` | Kịch bản của trang khung (Task 5) |
| `scripts/lib/theme-script-copies.test.ts` | Các bản chép của script theme (Task 5) |
| `.changeset/phase-5-app-shell.md` | Changeset `minor` cho `0.4.0` (Task 5) |
| `scripts/lib/contrast.ts` (và test), `scripts/contrast-exceptions.ts` | `kbd-text`, dòng 36 (Task 1); nhãn các dòng mở rộng (Task 2, 3, 4) |
| `src/index.ts`, `src/index.test.ts` | Export (Task 1, 2, 3) |
| `src/styles/index.css`, `src/styles/preferences.css` | Import CSS; forced colors (Task 1, 2, 3) |
| `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs` | Kiểm tra gói (Task 1, 2, 3) |
| `src/docs/ExceptionTable.test.tsx`, spec 0+1 §4.9 | Dòng 36 (Task 1); các dòng mở rộng (Task 2, 3, 4) |
| `src/docs/Accessibility.mdx` | Câu trỏ (Task 1–4); mục "The widgets of the header" (Task 4) |
| `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md` | Các dòng sửa khi lập Plan C (Task 1–4) |
| `.size-limit.json` | Ngưỡng mới (Task 5) |

---

### Task 1: `SearchField` (H2, H3), `isEditable`, `platform.ts` và dòng 36

Spec §1 (dòng SearchField; dòng "Tương phản: cần duyệt", phần dòng 36), §2 (thay đổi ở `ArrowIcon` và Toaster), §3.1 (dòng SearchField), §3.2 (dòng H), §3.5 (dòng "Phím gợi ý của SearchField"), §3.6 (dòng H3), §4.1 (h2, h3), §4.3 **SearchField**, §4.4 (`kbd-text`, dòng 36), §4.5 SearchField, §4.6 (`SearchIcon`, `ArrowIcon` `left`), §5 (`editable.ts`, `platform.ts`, các cảnh báo của SearchField), §6.1, §6.3 `SearchField`, §7 lớp 1–3 cho SearchField, "Test kiểu", danh sách kiểm tra gói, story giao diện H2 và H3, §8 `SearchField.mdx`, §10 (dòng `mod+k`). Mockup h2, h3 (`phase-5-header.html`). Bắt đầu từ `main` `87b8578`.
- **`isEditable`** chuyển nguyên từ `Toaster.tsx` vào `src/internal/editable.ts`; Toaster import nó, test của Toaster không đổi. **`isApplePlatform()`** trong `src/internal/platform.ts` (phát hiện 4).
- **Icon:** `SearchIcon`; `ArrowIcon` thêm hướng `left`.
- **`SearchField`** (client): control của form như `Input`, nút xoá trong thứ tự Tab, Esc, phím tắt (`search-field/shortcut.ts`), gợi ý phím theo nền tảng sau khi mount, H3 với tooltip `describe={false}` và nút ← (phát hiện 2, 3, 4).
- **CSS:** `search-field.css` (trong header 280px; H3 mở 300px; dưới 768px: không gợi ý phím, H2 giãn, H3 phủ header); forced colors trong `preferences.css`.
- **Tương phản:** check `kbd-text`, dòng 36 trong `contrast-exceptions.ts`, bảng §4.9 và đoạn sau nó, `ExceptionTable.test.tsx`, câu trỏ của trang Accessibility (phát hiện 5).
- **Story:** năm story giao diện (`SearchFieldDefault`, `SearchFieldDefaultPhone`, `SearchFieldCollapsible`, `SearchFieldCollapsiblePhone`, `SearchFieldCollapsiblePhoneOpen`); `ShortcutsAndEsc`, `EnterSubmitsTheForm`, `ClearAndClose`, `InTheHeader`, `FocusRings`, `ForcedColors` gắn `no-visual` (phát hiện 6).
- **`SearchField.mdx`** thay trang autodocs (phát hiện 13).
- Spec §4.3, §5 và spec 0+1 §4.9 được sửa (phát hiện 20). Cuối task, `check:package` PASS với ngưỡng cũ (phát hiện 18).

**Files:**
- Create: `src/internal/editable.ts`, `src/internal/editable.test.ts`, `src/internal/platform.ts`, `src/internal/platform.test.ts`, `src/components/search-field/SearchField.tsx`, `shortcut.ts`, `index.ts`, `SearchField.test.tsx`, `shortcut.test.tsx`, `SearchField.test-d.ts`, `SearchField.stories.tsx`, `SearchField.mdx`, `src/styles/components/search-field.css`
- Modify: `src/components/toast/Toaster.tsx`, `src/internal/icons.tsx`, `src/internal/icons.test.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `scripts/contrast-exceptions.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/components/search-field/SearchField.tsx` (client), export qua `search-field/index.ts` và `src/index.ts`:
  - `SearchField`: `markAsFieldControl(forwardRef<HTMLInputElement, SearchFieldProps>)`; `ref` là `<input>`; `className` và `style` vào gốc `.flg-search-field`, mọi prop khác vào `<input>`.
  - `SearchFieldLabels = { clear: string; open: string; close: string; shortcut: (shortcut: '/' | 'mod+k', apple: boolean) => string }`, mặc định "Clear search", "Search", "Close search", `'/'` hay `'⌘K'` hay `'Ctrl K'`.
  - `SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'defaultValue'> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; size?: 'sm' | 'md' | 'lg'; invalid?: boolean; shortcut?: '/' | 'mod+k'; collapsible?: boolean; labels?: Partial<SearchFieldLabels> }`. Mặc định `size` `'md'`, `collapsible` `false`, không có `shortcut`.
- Nội bộ:
  - `src/internal/editable.ts`: `isEditable(target: EventTarget | undefined): boolean` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]` khác `"false"`, hay con của chúng).
  - `src/internal/platform.ts`: `isApplePlatform(): boolean`.
  - `src/components/search-field/shortcut.ts`: `type Shortcut = '/' | 'mod+k'`; `matchesShortcut(event, shortcut, apple)`; `useShortcut(shortcut, onMatch: () => boolean, enabled)` (listener trên `document`; ô mount sau cùng giữ phím; `onMatch` trả `true` thì phím bị `preventDefault`).
  - `useApplePlatform()` (riêng của `SearchField.tsx`): `useSyncExternalStore` với `isApplePlatform`, giá trị phía server `undefined`.
  - `src/internal/icons.tsx`: `SearchIcon`; `ArrowIcon` nhận `direction: 'left'` (`M19 12H5`, `m12 19-7-7 7-7`).
- DOM: `div.flg-search-field` (`data-collapsible`, `data-open`, `className`, `style`) > [H3 thu gọn: `IconButton` `ghost` tên `labels.open`, có `aria-keyshortcuts`, trong `TooltipRoot describe={false}`; tooltip `side="bottom"`, `align="center"`, cách 8px, chữ là `labels.open` rồi `kbd`] > [H3 mở: `IconButton.flg-search-field-back` tên `labels.close`, icon `ArrowIcon` `left`; CSS chỉ hiện nó dưới 768px trong header] > `Input` (`type="search"`, ô đầu là `SearchIcon`, ô cuối là `button.flg-search-field-clear` tên `labels.clear` khi có chữ và ô sửa được, hay `kbd.flg-search-field-kbd[aria-hidden="true"]` khi rỗng và có `shortcut`). `<kbd>` của `'mod+k'` rỗng và `hidden` cho tới khi biết nền tảng.
- `aria-keyshortcuts` trên `<input>` và nút thu gọn: `"/"`, `"Meta+K"` hay `"Control+K"` (sau khi mount); giá trị của người gọi được giữ.
- Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `):
  - `<SearchField> needs a name: a Field label or aria-label. A placeholder is not a name.`
  - `<SearchField> shortcut must be "/" or "mod+k"; it is ignored.`
- CSS: `.flg-search-field`, `.flg-search-field-kbd`, `.flg-search-field-clear`, `.flg-search-field-back` (có trong `check-dist-css.ts`); quy tắc header dưới `.flg-app-shell-header .flg-search-field…`; mọi quy tắc điện thoại trong `@media not all and (min-width: 768px)`. `check-use-client.ts` thêm `src/components/search-field/SearchField.tsx`.
- `scripts/lib/contrast.ts`: `CHECKS` thêm `'kbd-text': 4.5`. `scripts/contrast-exceptions.ts`: dòng 36 (`kbd-text`, dark, 3.31).
- Story: `SearchField.stories.tsx`, meta `title: 'Components/SearchField'` (id `components-searchfield--…`). Ở task này các helper dải header (`Strip`, `App` với prop `search`, `End`, `strips`) nằm trong file story; `APPLE_KEY` giữ chữ gợi ý là "⌘K".
- Consumes: `Input`, `IconButton`, `TooltipRoot`/`TooltipTrigger`/`TooltipContent` (`tooltip/Tooltip.tsx`), `markAsFieldControl`, `useFieldContext`, `useControllableState`, `useFormReset`, `useWriteOnCommit`, `useIsoLayoutEffect`, `isComposing`, `hasModifier`, `composeEventHandlers`, `mergeRefs`, `dataAttr`, `withDefaults`, `devWarn`, `CloseIcon`; trong story: AppShell thật, `realUserEvent`, `settled`, `paintedPixels`.
- Task sau dùng: Task 2 chuyển các helper dải header sang `.storybook/header-strip.tsx` (prop `search` của `App` thành `header`) và thêm nút xoá vào nhãn dòng 2; Task 4 và Task 5 đặt `SearchField` vào header của trang Examples và của hai fixture.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index e03508e..666a1ff 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -288,6 +288,56 @@ describe('the Nav `bar` checks (spec phase 5 §4.4)', () => {
   });
 });
 
+describe('the key hint of a SearchField (spec phase 5 §4.4)', () => {
+  const CHECK = 'kbd-text';
+
+  it('is a check at 4.5:1', () => {
+    expect(CHECKS[CHECK]).toBe(4.5);
+  });
+
+  // The numbers are the spec's: the lowest of the hint in the field (on the background of the frame)
+  // and in the tooltip of a collapsed field (on its glass).
+  it.each([
+    ['light', 'default', 7.15],
+    ['dark', 'default', 3.31],
+    ['light', 'contrast-more', 7.83],
+    ['dark', 'contrast-more', 7.63],
+  ] as const)('measures %s, %s mode: %s', (theme, mode, expected) => {
+    expect(measure(values, theme, mode)[CHECK]).toBe(expected);
+  });
+
+  it('records the dark hint as row 36, and passes in light and in contrast-more', () => {
+    const { rows } = evaluate(values, KNOWN_EXCEPTIONS);
+    expect(
+      rows
+        .filter((row) => row.check === CHECK)
+        .map(({ theme, mode, status }) => [theme, mode, status]),
+    ).toEqual([
+      ['light', 'default', 'pass'],
+      ['light', 'contrast-more', 'pass'],
+      ['dark', 'default', 'known-exception'],
+      ['dark', 'contrast-more', 'pass'],
+    ]);
+    expect(
+      KNOWN_EXCEPTIONS.filter((exception) => exception.check === CHECK).map(
+        ({ row, theme, recorded }) => [row, theme, recorded],
+      ),
+    ).toEqual([[36, 'dark', 3.31]]);
+  });
+
+  it('measures the hint in the tooltip too, so a weak glass cannot hide behind the frame', () => {
+    // In dark the frame is the lower of the two (3.31 against 3.76); a pale glass makes the tooltip lower.
+    const patched = {
+      ...values,
+      themes: {
+        ...values.themes,
+        dark: { ...values.themes.dark, 'glass-tint': 'rgba(255,255,255,1)' },
+      },
+    };
+    expect(measure(patched, 'dark', 'default')[CHECK]).toBeLessThan(3.31);
+  });
+});
+
 describe('the dot of a count on the current item of a `pill` rail (spec phase 5 §4.4)', () => {
   const CHECK = 'nav-rail-current-dot';
 
diff --git a/src/components/search-field/SearchField.stories.tsx b/src/components/search-field/SearchField.stories.tsx
new file mode 100644
index 0000000..28b39b7
--- /dev/null
+++ b/src/components/search-field/SearchField.stories.tsx
@@ -0,0 +1,675 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import type { CSSProperties, ReactNode, SVGProps } from 'react';
+import { expect, userEvent, waitFor, within } from 'storybook/test';
+import { DemoBrand, DemoContent, DemoNav, DemoStyles } from '../../../.storybook/app-shell-demo';
+import { BellIcon } from '../../../.storybook/icons';
+import { paintedPixels } from '../../../.storybook/painted-pixel';
+import { realUserEvent, settled } from '../../../.storybook/real-input';
+import { withViewport } from '../../../.storybook/viewport';
+import { strokeIcon } from '../../internal/icons';
+import { isApplePlatform } from '../../internal/platform';
+import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
+import type { AppShellLayout } from '../app-shell/AppShell';
+import { Avatar } from '../avatar/Avatar';
+import { IconButton } from '../icon-button/IconButton';
+import { Surface } from '../surface/Surface';
+import { SearchField } from './SearchField';
+import type { SearchFieldProps } from './SearchField';
+
+const meta = {
+  title: 'Components/SearchField',
+  component: SearchField,
+  args: { 'aria-label': 'Search docs', placeholder: 'Search…' },
+} satisfies Meta<typeof SearchField>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+// The mockup (phase-5-header) draws ⌘K, and the baselines are shot on Linux, where the hint would read
+// "Ctrl K": the stories fix the text, so what is compared is the look.
+const APPLE_KEY: SearchFieldProps['labels'] = { shortcut: () => '⌘K' };
+
+/** The widgets of the header of the mockup that the question is not about: drawn neutral, the same in every option. */
+function Sun(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <circle cx="12" cy="12" r="4" />
+      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
+    </svg>
+  );
+}
+function Menu(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M4 6h16M4 12h16M4 18h16" />
+    </svg>
+  );
+}
+
+const WIDGETS = (
+  <>
+    <IconButton variant="ghost" aria-label="Notifications">
+      <BellIcon />
+    </IconButton>
+    <IconButton variant="ghost" aria-label="Theme">
+      <Sun />
+    </IconButton>
+    <IconButton
+      variant="ghost"
+      aria-label="Account"
+      style={{ borderRadius: 'var(--flg-radius-full)' }}
+    >
+      <Avatar alt="" fallback="MA" size="sm" />
+    </IconButton>
+  </>
+);
+
+const mark: CSSProperties = {
+  flex: 'none',
+  width: 22,
+  height: 22,
+  borderRadius: 'var(--flg-radius-xs)',
+  background: 'var(--flg-accent-gradient)',
+};
+
+/**
+ * A strip like the header strip of the mockup (a glass bar, 56px high, a menu button and the brand
+ * at the start, the neutral widgets at the end), one for each state. Several bars cannot be a whole
+ * AppShell each, so they are drawn as in the page of the mockup (spec phase 5 §7); the stories that
+ * need the real header use an AppShell.
+ */
+function Strip({
+  caption,
+  children,
+  end,
+}: {
+  caption: string;
+  /** What stands between the brand and the end cluster. */
+  children?: ReactNode;
+  /** What stands in the end cluster, before the widgets. */
+  end?: ReactNode;
+}) {
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
+        <IconButton variant="ghost" aria-label="Open navigation">
+          <Menu />
+        </IconButton>
+        <span
+          style={{
+            display: 'inline-flex',
+            alignItems: 'center',
+            gap: 8,
+            margin: '0 10px 0 4px',
+            font: 'var(--flg-weight-semibold) var(--flg-text-md)/1 var(--flg-font-sans)',
+            color: 'var(--flg-text)',
+            whiteSpace: 'nowrap',
+          }}
+        >
+          <span style={mark} aria-hidden="true" />
+          Lumen
+        </span>
+        {children}
+        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
+          {end}
+          {WIDGETS}
+        </div>
+      </Surface>
+    </div>
+  );
+}
+
+const strips = { display: 'grid', gap: 14, width: 640 } as const;
+/** The field of H2 in the strip: 280px, 2px off the gap that follows the brand. */
+const H2_BOX: CSSProperties = { width: 280, marginLeft: 2 };
+/** H3 open: 300px, 6px off the widget that follows. */
+const H3_BOX: CSSProperties = { width: 300, margin: '0 6px 0 0' };
+
+/**
+ * H2: the field of the library next to the brand, 280px wide. Empty, with the hint of the key; focused,
+ * with some text and the button that clears it.
+ */
+export const SearchFieldDefault: Story = {
+  render: (args) => (
+    <div style={strips}>
+      <Strip caption="Empty, with the placeholder and the hint ⌘K">
+        <SearchField {...args} shortcut="mod+k" labels={APPLE_KEY} style={H2_BOX} />
+      </Strip>
+      <Strip caption="Focus, with some text and the button that clears it">
+        <SearchField {...args} defaultValue="report" style={H2_BOX} />
+      </Strip>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const inputs = within(canvasElement).getAllByRole('searchbox');
+    inputs[1]!.focus();
+    await expect(inputs[1]).toHaveFocus();
+  },
+};
+
+/** An application with the search in its header. S2 (`header`) keeps the brand in the header at every width. */
+const App = ({ search, layout }: { search: ReactNode; layout?: AppShellLayout }) => (
+  <>
+    <DemoStyles />
+    <AppShell brand={<DemoBrand />} layout={layout}>
+      <AppShellHeader>{search}</AppShellHeader>
+      <AppShellSidebar>
+        <DemoNav />
+      </AppShellSidebar>
+      <AppShellMain>
+        <DemoContent />
+      </AppShellMain>
+    </AppShell>
+  </>
+);
+
+/** The widgets that follow the search in the header, on the right: a cluster that has no `position`. */
+const End = ({ children }: { children?: ReactNode }) => (
+  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
+    {children}
+    {WIDGETS}
+  </div>
+);
+
+/** H2 on a phone, in a real AppShell: the field shrinks to the room that is left, with no key hint, and the brand keeps its mark only. */
+export const SearchFieldDefaultPhone: Story = {
+  tags: ['viewport-360x640'],
+  parameters: { stage: 'page' },
+  render: (args) => (
+    <App
+      search={
+        <>
+          <SearchField {...args} shortcut="mod+k" labels={APPLE_KEY} />
+          <End />
+        </>
+      }
+    />
+  ),
+};
+
+/**
+ * H3: a button that rests in the place of the field, with the name of the key in its tooltip; open and
+ * empty, with the focus in it; open with some text.
+ */
+export const SearchFieldCollapsible: Story = {
+  render: (args) => (
+    <div style={{ ...strips, paddingBottom: 30 }}>
+      <Strip
+        caption="Collapsed, the pointer on the button: the tooltip has the key"
+        end={
+          <span data-visual-hover="tooltip" style={{ display: 'inline-flex' }}>
+            <SearchField {...args} collapsible shortcut="mod+k" labels={APPLE_KEY} />
+          </span>
+        }
+      />
+      <Strip
+        caption="Open (a click, or the key), empty, with the focus in it"
+        end={
+          <SearchField {...args} collapsible shortcut="mod+k" labels={APPLE_KEY} style={H3_BOX} />
+        }
+      />
+      <Strip
+        caption="Open, with some text and the button that clears it"
+        end={<SearchField {...args} collapsible defaultValue="report" style={H3_BOX} />}
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const buttons = within(canvasElement).getAllByRole('button', { name: 'Search' });
+    // The three fields rest as buttons; the last two are opened. The one with text is opened first:
+    // an empty field closes when the focus leaves it, and the focus ends in the empty one.
+    await userEvent.click(buttons[2]!);
+    await userEvent.click(buttons[1]!);
+    const empty = within(canvasElement)
+      .getAllByRole('searchbox')
+      .find((input) => !(input as HTMLInputElement).value);
+    await expect(empty).toHaveFocus();
+  },
+};
+
+/** H3 on a phone, in a real AppShell: the button rests among the widgets. */
+export const SearchFieldCollapsiblePhone: Story = {
+  tags: ['viewport-360x640'],
+  parameters: { stage: 'page' },
+  render: (args) => (
+    <App
+      search={
+        <End>
+          <SearchField {...args} collapsible shortcut="mod+k" labels={APPLE_KEY} />
+        </End>
+      }
+    />
+  ),
+};
+
+/**
+ * H3 on a phone, open: the field covers the row of the header, from the button ← to the edge. It has
+ * some text, so it stays open when the focus goes.
+ */
+export const SearchFieldCollapsiblePhoneOpen: Story = {
+  tags: ['viewport-360x640'],
+  parameters: { stage: 'page' },
+  render: SearchFieldCollapsiblePhone.render,
+  play: async ({ canvasElement }) => {
+    const canvas = within(canvasElement);
+    await userEvent.click(canvas.getByRole('button', { name: 'Search' }));
+    await userEvent.type(canvas.getByRole('searchbox'), 'report');
+    await expect(canvas.getByRole('searchbox')).toHaveFocus();
+  },
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it.
+
+/** The key of the platform for `mod+k`, pressed as a user does. */
+const modK = isApplePlatform() ? '{Meta>}k{/Meta}' : '{Control>}k{/Control}';
+
+/**
+ * "/" focuses the field from the page and types no "/"; typed in a field it is a letter, in this one
+ * too. Esc clears, and Esc on an empty field leaves the page its key. `mod+k` opens a collapsed field,
+ * and the next Esc clears it, the one after closes it and puts the focus back on the button. Trusted
+ * keys: the Storybook UI has none.
+ */
+export const ShortcutsAndEsc: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={strips}>
+      <SearchField {...args} aria-label="Docs" shortcut="/" />
+      <SearchField {...args} aria-label="Collapsible" collapsible shortcut="mod+k" />
+      <input aria-label="Other" />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    const docs = canvas.getByRole('searchbox', { name: 'Docs' });
+    const other = canvas.getByRole('textbox', { name: 'Other' });
+
+    await real.keyboard('/');
+    await expect(docs).toHaveFocus();
+    await expect(docs).toHaveValue('');
+    await real.keyboard('ab/');
+    await expect(docs).toHaveValue('ab/');
+    await real.keyboard('{Escape}');
+    await expect(docs).toHaveValue('');
+    await expect(docs).toHaveFocus();
+    // Empty and not collapsible: the key is the page's.
+    const seen: boolean[] = [];
+    const watch = (event: KeyboardEvent) => seen.push(event.defaultPrevented);
+    document.addEventListener('keydown', watch);
+    await real.keyboard('{Escape}');
+    document.removeEventListener('keydown', watch);
+    await expect(seen).toEqual([false]);
+
+    await real.click(other);
+    await real.keyboard('/');
+    await expect(other).toHaveValue('/');
+    await expect(other).toHaveFocus();
+    other.blur();
+
+    // Collapsed, its field is out of the page, and so out of the accessibility tree.
+    const collapsible = canvas.getByRole('searchbox', { name: 'Collapsible', hidden: true });
+    await expect(collapsible).not.toBeVisible();
+    await real.keyboard(modK);
+    await waitFor(() => expect(collapsible).toHaveFocus());
+    await expect(canvas.queryByRole('button', { name: 'Search' })).toBeNull();
+    await real.keyboard('xyz');
+    await real.keyboard('{Escape}');
+    await expect(collapsible).toHaveValue('');
+    await expect(collapsible).toBeVisible();
+    await real.keyboard('{Escape}');
+    const button = await canvas.findByRole('button', { name: 'Search' });
+    await expect(button).toHaveFocus();
+    await expect(collapsible).not.toBeVisible();
+    // The key opens it again, and takes the text back as selected.
+    await real.keyboard(modK);
+    await waitFor(() => expect(collapsible).toHaveFocus());
+  },
+};
+
+/** Enter in a field of a `<form role="search">` submits it, with the name and the text, in every engine. */
+export const EnterSubmitsTheForm: Story = {
+  tags: ['no-visual'],
+  render: (args) => {
+    function Form() {
+      const [sent, setSent] = useState('');
+      return (
+        <form
+          role="search"
+          style={{ width: 320 }}
+          onSubmit={(event) => {
+            event.preventDefault();
+            setSent(String(new FormData(event.currentTarget).get('q')));
+          }}
+        >
+          <SearchField {...args} name="q" />
+          <output aria-label="Sent">{sent}</output>
+        </form>
+      );
+    }
+    return <Form />;
+  },
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    await real.click(canvas.getByRole('searchbox'));
+    await real.keyboard('glass{Enter}');
+    await expect(canvas.getByLabelText('Sent')).toHaveTextContent('glass');
+  },
+};
+
+/**
+ * The clear button is in the Tab order after the field and takes the text away with the focus back in
+ * the field; a collapsed field closes when it is empty and the page is clicked, and does not close
+ * while it has text (WebKit does not focus a button that is clicked, so the focus leaves by a different
+ * road there). Real presses and clicks.
+ */
+export const ClearAndClose: Story = {
+  tags: ['no-visual'],
+  render: (args) => (
+    <div style={{ display: 'grid', gap: 16, width: 360 }}>
+      <SearchField {...args} aria-label="Plain" defaultValue="abc" />
+      <SearchField {...args} aria-label="Collapsible" collapsible />
+      <p data-page="">Somewhere on the page</p>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    const plain = canvas.getByRole('searchbox', { name: 'Plain' });
+    await real.click(plain);
+    await real.keyboard('{Tab}');
+    const clear = canvas.getByRole('button', { name: 'Clear search' });
+    await expect(clear).toHaveFocus();
+    await real.click(clear);
+    await expect(plain).toHaveValue('');
+    await expect(plain).toHaveFocus();
+
+    const page = canvasElement.querySelector<HTMLElement>('[data-page]')!;
+    await real.click(canvas.getByRole('button', { name: 'Search' }));
+    const collapsible = canvas.getByRole('searchbox', { name: 'Collapsible' });
+    await expect(collapsible).toHaveFocus();
+    await real.click(page);
+    await waitFor(() => expect(collapsible).not.toBeVisible());
+    await real.click(canvas.getByRole('button', { name: 'Search' }));
+    await real.keyboard('a');
+    await real.click(page);
+    await expect(collapsible).toBeVisible();
+    await expect(collapsible).toHaveValue('a');
+    await real.click(canvas.getByRole('button', { name: 'Clear search' }));
+    await expect(collapsible).toHaveValue('');
+    await expect(collapsible).toHaveFocus();
+  },
+};
+
+const rect = (el: Element) => el.getBoundingClientRect();
+const header = (root: ParentNode) => root.querySelector<HTMLElement>('.flg-app-shell-header')!;
+const shown = (el: Element) => getComputedStyle(el).display !== 'none';
+const hidden = (el: Element) => getComputedStyle(el).visibility === 'hidden';
+
+/**
+ * In the header of a real AppShell, at the width of a phone and wider. H2: wide, 280px, brand with
+ * its name, hint of the key; below 768px the field takes what is left, the name of the brand is
+ * hidden to its mark and there is no hint. H3: wide, the open field is 300px beside the widgets, 6px
+ * off the next one; below 768px it covers the row of the header, the rest of it is out of sight, out of
+ * the Tab order, and the button ← closes it and keeps the text; the page never scrolls sideways.
+ */
+export const InTheHeader: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: (args) => (
+    <App
+      layout="header"
+      search={
+        <>
+          <SearchField {...args} aria-label="Docs" shortcut="/" />
+          <End>
+            <SearchField {...args} aria-label="Quick" collapsible shortcut="mod+k" />
+          </End>
+        </>
+      }
+    />
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      const bar = () => header(canvasElement);
+      // Found by their attributes, not by role and name: what is out of sight (`display: none`,
+      // `visibility: hidden`) has no name in the accessibility tree, and the story is about it.
+      const button = (name: string) =>
+        bar().querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
+      const field = (name: string) =>
+        canvasElement.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`)!;
+      const docs = () => field('Docs');
+      const quick = () => field('Quick');
+      const docsKbd = () =>
+        docs().closest('.flg-search-field')!.querySelector('.flg-search-field-kbd')!;
+      const brandName = () => bar().querySelector<HTMLElement>('.flg-app-shell-brand-name')!;
+      const noSideScroll = () =>
+        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
+          document.documentElement.clientWidth,
+        );
+
+      // Wide: H2 is 280px, the brand is written out, the hint of the key shows.
+      await viewport.set(1280, 720);
+      const root = docs().closest<HTMLElement>('.flg-search-field')!;
+      await expect(rect(root).width).toBeCloseTo(280, 0);
+      await expect(rect(brandName()).width).toBeGreaterThan(20);
+      await expect(shown(docsKbd().parentElement!)).toBe(true);
+      await noSideScroll();
+      // H3 opens beside the widgets, 300px wide, 6px and the gap off the next one, and the button ←
+      // is not drawn.
+      await real.click(button('Search'));
+      const quickRoot = quick().closest<HTMLElement>('.flg-search-field')!;
+      await expect(quick()).toHaveFocus();
+      await expect(rect(quickRoot).width).toBeCloseTo(300, 0);
+      await expect(getComputedStyle(quickRoot).position).not.toBe('absolute');
+      await expect(shown(button('Close search'))).toBe(false);
+      await expect(hidden(button('Theme'))).toBe(false);
+      await expect(rect(button('Notifications')).left - rect(quickRoot).right).toBeCloseTo(10, 0);
+      quick().blur();
+      await waitFor(() => expect(quick()).not.toBeVisible());
+
+      // Narrow: H2 fills the row, the name of the brand is only its mark, no hint of the key.
+      await viewport.set(360, 640);
+      await expect(rect(brandName()).width).toBeLessThanOrEqual(1);
+      // It takes the room that is left: 4px of its margin and the gap of the header off the widgets.
+      const end = bar().lastElementChild!;
+      await expect(rect(end).left - rect(root).right).toBeCloseTo(8, 0);
+      await expect(rect(root).width).toBeGreaterThan(100);
+      await expect(shown(docsKbd().parentElement!)).toBe(false);
+      await noSideScroll();
+
+      // Narrow, H3 open: it covers the header.
+      await real.click(button('Search'));
+      await expect(quick()).toHaveFocus();
+      const cover = quick().closest<HTMLElement>('.flg-search-field')!;
+      await expect(getComputedStyle(cover).position).toBe('absolute');
+      // It covers what the header has inside its border: the padding box, which is where an element
+      // placed with `inset: 0` is.
+      const barBox = rect(bar());
+      const inside = [
+        barBox.left + bar().clientLeft,
+        barBox.top + bar().clientTop,
+        barBox.left + bar().clientLeft + bar().clientWidth,
+        barBox.top + bar().clientTop + bar().clientHeight,
+      ];
+      const coverBox = rect(cover);
+      await expect(
+        [coverBox.left, coverBox.top, coverBox.right, coverBox.bottom].map(Math.round),
+      ).toEqual(inside.map(Math.round));
+      const back = button('Close search');
+      await expect(shown(back)).toBe(true);
+      await expect(rect(back).left - barBox.left).toBeCloseTo(10, 0);
+      for (const name of ['Notifications', 'Theme', 'Account', 'Open navigation']) {
+        await expect(hidden(button(name)), name).toBe(true);
+      }
+      await expect(hidden(brandName())).toBe(true);
+      await expect(hidden(docs())).toBe(true);
+      await noSideScroll();
+
+      // The Tab order has the field and its buttons, and nothing of the rest of the header.
+      await real.keyboard('x');
+      await real.keyboard('{Tab}');
+      await expect(button('Clear search')).toHaveFocus();
+      await real.keyboard('{Tab}');
+      await expect(bar().contains(document.activeElement)).toBe(false);
+      await expect(quick()).toHaveValue('x');
+      quick().focus();
+      await real.keyboard('{Shift>}{Tab}{/Shift}');
+      await expect(back).toHaveFocus();
+
+      // ← closes it with the text kept, and the header is back.
+      await real.click(back);
+      await expect(button('Search')).toHaveFocus();
+      await expect(quick()).not.toBeVisible();
+      for (const name of ['Notifications', 'Theme', 'Account']) {
+        await expect(hidden(button(name)), name).toBe(false);
+      }
+      await expect(hidden(docs())).toBe(false);
+      await real.click(button('Search'));
+      await expect(quick()).toHaveValue('x');
+
+      // The width of the window decides, not the state: opened on a phone, it is a field of 300px again.
+      await viewport.set(1280, 720);
+      await expect(getComputedStyle(cover).position).not.toBe('absolute');
+      await expect(rect(cover).width).toBeCloseTo(300, 0);
+      await expect(hidden(button('Theme'))).toBe(false);
+      await expect(shown(button('Close search'))).toBe(false);
+    });
+  },
+};
+
+/**
+ * The ring of the focus, read from the pixels: the frame of the field, the button that clears it and
+ * the button ← at the left edge of the header of a phone. Each is drawn, and nothing clips it. The
+ * header is photographed before and after the focus, and the pixels where the ring is must differ.
+ */
+export const FocusRings: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: (args) => (
+    <App
+      search={
+        <>
+          <SearchField {...args} aria-label="Docs" defaultValue="abc" />
+          <End>
+            <SearchField {...args} aria-label="Quick" collapsible defaultValue="abc" />
+          </End>
+        </>
+      }
+    />
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      const canvas = within(canvasElement);
+      const bar = () => header(canvasElement);
+      type Side = 'left' | 'top' | 'bottom';
+      /** Whether focusing `control` paints something 2.5 to 3.5px outside the edges of `box`, where its 2px outline, offset by 2px, is. */
+      const drawsRing = async (control: HTMLElement, box: HTMLElement, sides: Side[]) => {
+        const outer = rect(bar());
+        const at = () => {
+          const edge = rect(box);
+          return sides.flatMap((side) =>
+            [2.5, 3, 3.5].map((depth): [number, number] => {
+              const x = side === 'left' ? edge.left - depth : edge.left + edge.width / 2;
+              const y =
+                side === 'top'
+                  ? edge.top - depth
+                  : side === 'bottom'
+                    ? edge.bottom + depth
+                    : edge.top + edge.height / 2;
+              return [x - outer.x, y - outer.y];
+            }),
+          );
+        };
+        (document.activeElement as HTMLElement | null)?.blur();
+        // The ring fades in and out: the screenshots are taken once it has.
+        await settled(bar());
+        const before = (await paintedPixels(bar(), at()))!;
+        control.focus({ focusVisible: true });
+        await expect(control).toHaveFocus();
+        await settled(bar());
+        const after = (await paintedPixels(bar(), at()))!;
+        control.blur();
+        return after.some((pixel, point) =>
+          pixel.some((channel, index) => Math.abs(channel - before[point]![index]!) > 4),
+        );
+      };
+
+      await viewport.set(1280, 720);
+      const docs = canvas.getByRole('searchbox', { name: 'Docs' });
+      await expect(
+        await drawsRing(docs, docs.parentElement!, ['left', 'top', 'bottom']),
+        'frame',
+      ).toBe(true);
+      const clear = canvas.getByRole('button', { name: 'Clear search' });
+      await expect(await drawsRing(clear, clear, ['left', 'top', 'bottom']), 'clear button').toBe(
+        true,
+      );
+
+      await viewport.set(360, 640);
+      await real.click(canvas.getByRole('button', { name: 'Search' }));
+      const back = canvas.getByRole('button', { name: 'Close search' });
+      await expect(await drawsRing(back, back, ['left', 'top', 'bottom']), '← button').toBe(true);
+    });
+  },
+};
+
+/**
+ * Forced colours (emulated through the protocol, which only Chromium has): the key hint has the border
+ * and the text of the system, and the clear button the colour of a button.
+ */
+export const ForcedColors: Story = {
+  tags: ['no-visual'],
+  render: (args) => <SearchField {...args} shortcut="/" style={{ width: 300 }} />,
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    if (server.browser !== 'chromium') return;
+    const session = cdp();
+    const colorOf = (name: string) => {
+      const probe = document.createElement('div');
+      probe.style.color = name;
+      canvasElement.append(probe);
+      const color = getComputedStyle(probe).color;
+      probe.remove();
+      return color;
+    };
+    const canvas = within(canvasElement);
+    await session.send('Emulation.setEmulatedMedia', {
+      features: [{ name: 'forced-colors', value: 'active' }],
+    });
+    try {
+      await waitFor(() => expect(matchMedia('(forced-colors: active)').matches).toBe(true));
+      const kbd = canvasElement.querySelector<HTMLElement>('.flg-search-field-kbd')!;
+      await expect(getComputedStyle(kbd).color).toBe(colorOf('CanvasText'));
+      await expect(getComputedStyle(kbd).borderTopColor).toBe(colorOf('CanvasText'));
+      await userEvent.type(canvas.getByRole('searchbox'), 'a');
+      const clear = await canvas.findByRole('button', { name: 'Clear search' });
+      await expect(getComputedStyle(clear).color).toBe(colorOf('ButtonText'));
+    } finally {
+      await session.send('Emulation.setEmulatedMedia', { features: [] });
+    }
+  },
+};
diff --git a/src/components/search-field/SearchField.test-d.ts b/src/components/search-field/SearchField.test-d.ts
new file mode 100644
index 0000000..ba1433d
--- /dev/null
+++ b/src/components/search-field/SearchField.test-d.ts
@@ -0,0 +1,32 @@
+import { expectTypeOf, test } from 'vitest';
+import type { SearchFieldLabels, SearchFieldProps } from './SearchField';
+
+test('SearchField accepts only the documented sizes and shortcuts', () => {
+  expectTypeOf<SearchFieldProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
+  expectTypeOf<SearchFieldProps['shortcut']>().toEqualTypeOf<'/' | 'mod+k' | undefined>();
+  // @ts-expect-error 'xl' is not a size
+  const unknownSize: SearchFieldProps = { size: 'xl' };
+  // @ts-expect-error only "/" and "mod+k" are shortcuts
+  const unknownShortcut: SearchFieldProps = { shortcut: 'ctrl+k' };
+  expectTypeOf(unknownSize).toBeObject();
+  expectTypeOf(unknownShortcut).toBeObject();
+});
+
+test("the text is a string, and the type of the input is not the caller's to change", () => {
+  expectTypeOf<SearchFieldProps['value']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<SearchFieldProps['defaultValue']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<SearchFieldProps['onValueChange']>().toEqualTypeOf<
+    ((value: string) => void) | undefined
+  >();
+  // @ts-expect-error the input is always of type search
+  const typed: SearchFieldProps = { type: 'text' };
+  expectTypeOf(typed).toBeObject();
+});
+
+test('labels is partial, and the key hint is told the key and the platform', () => {
+  expectTypeOf<SearchFieldLabels['shortcut']>().toEqualTypeOf<
+    (shortcut: '/' | 'mod+k', apple: boolean) => string
+  >();
+  const some: SearchFieldProps['labels'] = { clear: 'Xoá' };
+  expectTypeOf(some).not.toBeAny();
+});
diff --git a/src/components/search-field/SearchField.test.tsx b/src/components/search-field/SearchField.test.tsx
new file mode 100644
index 0000000..0b02b1f
--- /dev/null
+++ b/src/components/search-field/SearchField.test.tsx
@@ -0,0 +1,715 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef, useState } from 'react';
+import { hydrateRoot } from 'react-dom/client';
+import { renderToString } from 'react-dom/server';
+import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
+import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { SearchField } from './SearchField';
+import type { SearchFieldProps } from './SearchField';
+
+// jsdom has no Popover API; the tooltip of a collapsed field needs a stand-in to be in the page.
+const original = {
+  showPopover: HTMLElement.prototype.showPopover,
+  hidePopover: HTMLElement.prototype.hidePopover,
+};
+beforeAll(() => {
+  HTMLElement.prototype.showPopover = () => {};
+  HTMLElement.prototype.hidePopover = () => {};
+});
+afterAll(() => Object.assign(HTMLElement.prototype, original));
+
+const NO_NAME =
+  WARN_PREFIX +
+  ' <SearchField> needs a name: a Field label or aria-label. A placeholder is not a name.';
+const BAD_SHORTCUT = WARN_PREFIX + ' <SearchField> shortcut must be "/" or "mod+k"; it is ignored.';
+
+const search = () => screen.getByRole('searchbox') as HTMLInputElement;
+const rootOf = (input: HTMLElement) => input.closest('.flg-search-field') as HTMLElement;
+const kbds = () => Array.from(document.querySelectorAll('.flg-search-field-kbd'));
+const press = (init: KeyboardEventInit, target: Element | Document = document.body) =>
+  fireEvent.keyDown(target, init);
+
+/** Pretends to run on a system whose `navigator.platform` is `platform`. */
+function platform(name: string) {
+  vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue(name);
+}
+
+function Search(props: SearchFieldProps) {
+  return <SearchField aria-label="Search docs" {...props} />;
+}
+
+describe('SearchField', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => {
+    vi.restoreAllMocks();
+    document.body.innerHTML = '';
+  });
+
+  describe('structure', () => {
+    it('renders a search input in an Input frame with a magnifier, and routes className and style to the root', () => {
+      const ref = createRef<HTMLInputElement>();
+      render(
+        <SearchField
+          aria-label="Search docs"
+          ref={ref}
+          className="mine"
+          style={{ width: 200 }}
+          name="q"
+          placeholder="Search…"
+          maxLength={40}
+        />,
+      );
+      const input = search();
+      const root = rootOf(input);
+      expect(ref.current).toBe(input);
+      expect(input).toHaveAttribute('type', 'search');
+      expect(input).toHaveAttribute('name', 'q');
+      expect(input).toHaveAttribute('maxlength', '40');
+      expect(input).not.toHaveAttribute('class');
+      expect(root).toHaveClass('flg-search-field', 'mine');
+      expect(root).toHaveStyle({ width: '200px' });
+      expect(root).not.toHaveAttribute('data-collapsible');
+      const frame = input.parentElement!;
+      expect(frame).toHaveClass('flg-input');
+      expect(frame).not.toHaveClass('mine');
+      expect(frame.querySelector('.flg-input-adornment > svg circle')).not.toBeNull();
+    });
+
+    it('takes the size of an Input, and a size it does not know is medium', () => {
+      const { rerender } = render(<Search size="sm" />);
+      expect(search().parentElement).toHaveAttribute('data-size', 'sm');
+      rerender(<Search size="lg" />);
+      expect(search().parentElement).toHaveAttribute('data-size', 'lg');
+      rerender(<Search size={'huge' as 'sm'} />);
+      expect(search().parentElement).toHaveAttribute('data-size', 'md');
+    });
+
+    it('marks an invalid field, as an Input does', () => {
+      render(<Search invalid />);
+      expect(search()).toHaveAttribute('aria-invalid', 'true');
+      expect(search().parentElement).toHaveAttribute('data-invalid');
+    });
+  });
+
+  describe('value', () => {
+    it('starts from defaultValue and follows what is typed', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      render(<Search defaultValue="ab" onValueChange={onValueChange} />);
+      expect(search()).toHaveValue('ab');
+      await user.type(search(), 'c');
+      expect(search()).toHaveValue('abc');
+      expect(onValueChange).toHaveBeenLastCalledWith('abc');
+    });
+
+    it('is controlled by value, and shows the value of the parent whatever is typed', async () => {
+      const user = userEvent.setup();
+      const seen: string[] = [];
+      function Parent() {
+        const [value, setValue] = useState('x');
+        return (
+          <Search
+            value={value}
+            onValueChange={(next) => {
+              seen.push(next);
+              if (next.length < 3) setValue(next);
+            }}
+          />
+        );
+      }
+      render(<Parent />);
+      await user.type(search(), 'yz');
+      expect(seen).toEqual(['xy', 'xyz']);
+      expect(search()).toHaveValue('xy');
+    });
+
+    it('calls the onChange of the caller first, and leaves the text alone when it prevents the event', () => {
+      const order: string[] = [];
+      render(
+        <Search
+          onChange={(event) => {
+            order.push(`change:${event.target.value}`);
+            event.preventDefault();
+          }}
+          onValueChange={(value) => order.push(`value:${value}`)}
+        />,
+      );
+      fireEvent.change(search(), { target: { value: 'a' } });
+      expect(order).toEqual(['change:a']);
+    });
+
+    it('sends its name and text with the form', async () => {
+      const user = userEvent.setup();
+      const { container } = render(
+        <form>
+          <Search name="q" />
+        </form>,
+      );
+      await user.type(search(), 'glass');
+      expect(new FormData(container.querySelector('form')!).get('q')).toBe('glass');
+    });
+
+    it('puts back defaultValue when its form is reset, and the clear button follows', async () => {
+      const user = userEvent.setup();
+      const { container } = render(
+        <form>
+          <Search name="q" defaultValue="start" />
+        </form>,
+      );
+      await user.type(search(), '!');
+      expect(search()).toHaveValue('start!');
+      act(() => container.querySelector('form')!.reset());
+      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
+      expect(search()).toHaveValue('start');
+      expect(new FormData(container.querySelector('form')!).get('q')).toBe('start');
+      await user.clear(search());
+      act(() => container.querySelector('form')!.reset());
+      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
+      expect(search()).toHaveValue('start');
+      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
+    });
+
+    it('follows a form that its form attribute names', async () => {
+      const user = userEvent.setup();
+      render(
+        <>
+          <form id="outside" />
+          <Search defaultValue="start" form="outside" />
+        </>,
+      );
+      await user.type(search(), '!');
+      act(() => (document.getElementById('outside') as HTMLFormElement).reset());
+      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
+      expect(search()).toHaveValue('start');
+    });
+
+    it('submits the form it is in on Enter, as a native input does', async () => {
+      const user = userEvent.setup();
+      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
+      render(
+        <form role="search" onSubmit={onSubmit}>
+          <Search name="q" />
+          <button type="submit">Go</button>
+        </form>,
+      );
+      await user.type(search(), 'x{Enter}');
+      expect(onSubmit).toHaveBeenCalledTimes(1);
+    });
+  });
+
+  describe('clear button', () => {
+    it('shows only while there is text, is named by labels.clear and is in the Tab order', async () => {
+      const user = userEvent.setup();
+      render(<Search labels={{ clear: 'Xoá' }} />);
+      expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
+      await user.type(search(), 'a');
+      const clear = screen.getByRole('button', { name: 'Xoá' });
+      expect(clear).toHaveAttribute('type', 'button');
+      expect(clear).not.toHaveAttribute('tabindex');
+      await user.tab();
+      expect(clear).toHaveFocus();
+    });
+
+    it('clears the text, tells onValueChange and puts the focus back in the field', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      render(<Search defaultValue="abc" onValueChange={onValueChange} />);
+      await user.click(screen.getByRole('button', { name: 'Clear search' }));
+      expect(search()).toHaveValue('');
+      expect(onValueChange).toHaveBeenCalledWith('');
+      expect(search()).toHaveFocus();
+      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
+    });
+
+    it('is not there on a field that cannot be changed', () => {
+      const { rerender } = render(<Search defaultValue="abc" disabled />);
+      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
+      rerender(<Search defaultValue="abc" readOnly />);
+      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
+      rerender(<Search defaultValue="abc" />);
+      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
+    });
+
+    it('is not there inside a disabled Field either', () => {
+      render(
+        <Field label="Docs" disabled>
+          <SearchField defaultValue="abc" />
+        </Field>,
+      );
+      expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
+    });
+  });
+
+  describe('Esc', () => {
+    it('clears the text, keeps the event from going on, and the field open for the next Esc', () => {
+      const onValueChange = vi.fn();
+      render(<Search defaultValue="abc" onValueChange={onValueChange} />);
+      search().focus();
+      expect(press({ key: 'Escape' }, search())).toBe(false);
+      expect(search()).toHaveValue('');
+      expect(onValueChange).toHaveBeenCalledWith('');
+      expect(search()).toHaveFocus();
+    });
+
+    it('does nothing to an empty field that is not collapsible, and lets the key go on', () => {
+      render(<Search />);
+      search().focus();
+      expect(press({ key: 'Escape' }, search())).toBe(true);
+      expect(search()).toHaveFocus();
+    });
+
+    it('leaves the key to the input method while it composes', () => {
+      render(<Search defaultValue="abc" />);
+      press({ key: 'Escape', isComposing: true }, search());
+      press({ key: 'Escape', keyCode: 229 }, search());
+      expect(search()).toHaveValue('abc');
+    });
+
+    it('is left alone by the field when the caller prevented it', () => {
+      render(<Search defaultValue="abc" onKeyDown={(event) => event.preventDefault()} />);
+      press({ key: 'Escape' }, search());
+      expect(search()).toHaveValue('abc');
+    });
+  });
+
+  describe('name', () => {
+    it('warns once the field is in the page without a name, and a placeholder is not one', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<SearchField placeholder="Search…" />);
+      expect(warn).toHaveBeenCalledWith(NO_NAME);
+    });
+
+    it('does not warn with aria-label, aria-labelledby or a Field label', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { unmount } = render(<SearchField aria-label="Search docs" />);
+      unmount();
+      render(
+        <>
+          <span id="title">Docs</span>
+          <SearchField aria-labelledby="title" />
+        </>,
+      ).unmount();
+      render(
+        <Field label="Docs">
+          <SearchField />
+        </Field>,
+      );
+      expect(warn).not.toHaveBeenCalled();
+      expect(screen.getByRole('searchbox', { name: 'Docs' })).toBeInTheDocument();
+    });
+
+    it('does not take a Field that has no label for a name', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(
+        <Field description="Looks in the docs">
+          <SearchField />
+        </Field>,
+      );
+      expect(warn).toHaveBeenCalledWith(NO_NAME);
+    });
+
+    it('lets a Field describe it and mark it invalid', () => {
+      render(
+        <Field label="Docs" description="Looks in the docs" error="Too short">
+          <SearchField />
+        </Field>,
+      );
+      const input = screen.getByRole('searchbox', { name: 'Docs' });
+      expect(input).toHaveAccessibleDescription('Looks in the docs Too short');
+      expect(input).toHaveAttribute('aria-invalid', 'true');
+    });
+  });
+
+  describe('shortcut', () => {
+    it('"/" focuses the field and selects its text, and no "/" is typed', () => {
+      render(<Search shortcut="/" defaultValue="abc" />);
+      const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
+      document.body.dispatchEvent(event);
+      expect(event.defaultPrevented).toBe(true);
+      expect(search()).toHaveFocus();
+      expect(search().selectionStart).toBe(0);
+      expect(search().selectionEnd).toBe(3);
+    });
+
+    it('leaves the key to a place where the user types, including this field', async () => {
+      const user = userEvent.setup();
+      render(
+        <>
+          <input aria-label="other" />
+          <Search shortcut="/" />
+        </>,
+      );
+      const other = screen.getByRole('textbox', { name: 'other' });
+      await user.click(other);
+      await user.keyboard('/');
+      expect(other).toHaveValue('/');
+      expect(other).toHaveFocus();
+      await user.click(search());
+      await user.keyboard('a/b');
+      expect(search()).toHaveValue('a/b');
+    });
+
+    it('leaves a key that something else prevented, and one the input method owns', () => {
+      render(<Search shortcut="/" />);
+      document.addEventListener('keydown', (event) => event.preventDefault(), {
+        once: true,
+        capture: true,
+      });
+      press({ key: '/' });
+      press({ key: '/', isComposing: true });
+      expect(search()).not.toHaveFocus();
+    });
+
+    it('"mod+k" is ⌘K on an Apple system and Ctrl K elsewhere', () => {
+      platform('MacIntel');
+      const { unmount } = render(<Search shortcut="mod+k" />);
+      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['⌘K']);
+      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Meta+K');
+      press({ key: 'k', ctrlKey: true });
+      expect(search()).not.toHaveFocus();
+      press({ key: 'k', metaKey: true });
+      expect(search()).toHaveFocus();
+      unmount();
+      platform('Win32');
+      render(<Search shortcut="mod+k" />);
+      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['Ctrl K']);
+      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Control+K');
+      press({ key: 'k', metaKey: true });
+      expect(search()).not.toHaveFocus();
+      press({ key: 'k', ctrlKey: true });
+      expect(search()).toHaveFocus();
+    });
+
+    it('writes the hint with labels.shortcut, which is told the key and the platform', () => {
+      platform('Linux x86_64');
+      const text = vi.fn((shortcut: string, apple: boolean) => `${shortcut}/${apple}`);
+      render(<Search shortcut="mod+k" labels={{ shortcut: text }} />);
+      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['mod+k/false']);
+    });
+
+    it('hides the hint from assistive technology, and the shortcut is said by aria-keyshortcuts', () => {
+      render(<Search shortcut="/" />);
+      expect(kbds()[0]).toHaveAttribute('aria-hidden', 'true');
+      expect(search()).toHaveAttribute('aria-keyshortcuts', '/');
+    });
+
+    it('keeps the aria-keyshortcuts of the caller', () => {
+      render(<Search shortcut="/" aria-keyshortcuts="Alt+S" />);
+      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Alt+S');
+    });
+
+    it('shows the hint only while the field is empty, and the clear button in its place', async () => {
+      const user = userEvent.setup();
+      render(<Search shortcut="/" />);
+      expect(kbds()).toHaveLength(1);
+      await user.type(search(), 'a');
+      expect(kbds()).toHaveLength(0);
+      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
+      await user.clear(search());
+      expect(kbds()).toHaveLength(1);
+    });
+
+    it('has no hint and no aria-keyshortcuts without a shortcut', () => {
+      render(<Search />);
+      expect(kbds()).toHaveLength(0);
+      expect(search()).not.toHaveAttribute('aria-keyshortcuts');
+    });
+
+    it('ignores a shortcut it does not know and says so once', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Search shortcut={'ctrl+p' as '/'} />);
+      expect(kbds()).toHaveLength(0);
+      expect(warn).toHaveBeenCalledWith(BAD_SHORTCUT);
+      press({ key: 'p', ctrlKey: true });
+      expect(search()).not.toHaveFocus();
+    });
+
+    it('follows a shortcut that changes, and one that is turned off', () => {
+      platform('Win32');
+      const { rerender } = render(<Search shortcut="/" />);
+      rerender(<Search shortcut="mod+k" />);
+      expect(kbds().map((kbd) => kbd.textContent)).toEqual(['Ctrl K']);
+      expect(search()).toHaveAttribute('aria-keyshortcuts', 'Control+K');
+      press({ key: '/' });
+      expect(search()).not.toHaveFocus();
+      press({ key: 'k', ctrlKey: true });
+      expect(search()).toHaveFocus();
+      search().blur();
+      rerender(<Search />);
+      expect(search()).not.toHaveAttribute('aria-keyshortcuts');
+      press({ key: 'k', ctrlKey: true });
+      expect(search()).not.toHaveFocus();
+    });
+
+    it('is not taken by a field that is disabled, and is again when it is enabled', () => {
+      const { rerender } = render(<Search shortcut="/" disabled />);
+      expect(press({ key: '/' })).toBe(true);
+      expect(search()).not.toHaveFocus();
+      rerender(<Search shortcut="/" />);
+      expect(press({ key: '/' })).toBe(false);
+      expect(search()).toHaveFocus();
+    });
+
+    it('goes to the field mounted last when two ask for the same key, and back when it unmounts', () => {
+      const { rerender } = render(
+        <>
+          <Search aria-label="First" shortcut="/" />
+          <Search aria-label="Second" shortcut="/" />
+        </>,
+      );
+      press({ key: '/' });
+      expect(screen.getByRole('searchbox', { name: 'Second' })).toHaveFocus();
+      rerender(<Search aria-label="First" shortcut="/" />);
+      press({ key: '/' });
+      expect(screen.getByRole('searchbox', { name: 'First' })).toHaveFocus();
+    });
+  });
+
+  describe('server and client agree on the key hint', () => {
+    it('renders an empty hidden key for mod+k and the key itself for "/"', () => {
+      const html = renderToString(
+        <>
+          <Search aria-label="One" shortcut="mod+k" />
+          <Search aria-label="Two" shortcut="/" />
+        </>,
+      );
+      const host = document.createElement('div');
+      host.innerHTML = html;
+      const [mod, slash] = Array.from(host.querySelectorAll('kbd'));
+      expect(mod).toHaveAttribute('hidden');
+      expect(mod?.textContent).toBe('');
+      expect(slash).not.toHaveAttribute('hidden');
+      expect(slash?.textContent).toBe('/');
+      const [first, second] = Array.from(host.querySelectorAll('input'));
+      expect(first).not.toHaveAttribute('aria-keyshortcuts');
+      expect(second).toHaveAttribute('aria-keyshortcuts', '/');
+    });
+
+    it('hydrates that HTML without a mismatch, then fills in the key of the platform', async () => {
+      platform('MacIntel');
+      const recoverable = vi.fn();
+      const html = renderToString(<Search shortcut="mod+k" />);
+      // After the server render: React 18 warns about a layout effect there, which is the test's jsdom.
+      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
+      // The server knows no platform: its HTML is what a server with no `navigator` renders.
+      const host = document.createElement('div');
+      host.innerHTML = html.replace('>⌘K<', '><');
+      document.body.append(host);
+      expect(host.querySelector('kbd')?.textContent).toBe('');
+      await act(async () => {
+        hydrateRoot(host, <Search shortcut="mod+k" />, { onRecoverableError: recoverable });
+      });
+      expect(recoverable).not.toHaveBeenCalled();
+      expect(error).not.toHaveBeenCalled();
+      expect(host.querySelector('kbd')?.textContent).toBe('⌘K');
+      expect(host.querySelector('kbd')).not.toHaveAttribute('hidden');
+      expect(host.querySelector('input')).toHaveAttribute('aria-keyshortcuts', 'Meta+K');
+    });
+  });
+
+  describe('collapsible', () => {
+    const open = async (user = userEvent.setup()) => {
+      await user.click(screen.getByRole('button', { name: 'Search' }));
+      return user;
+    };
+
+    it('rests as a button named by labels.open, with the key in aria-keyshortcuts, and no tooltip description', () => {
+      platform('Win32');
+      render(<Search collapsible shortcut="mod+k" labels={{ open: 'Tìm' }} />);
+      const button = screen.getByRole('button', { name: 'Tìm' });
+      expect(rootOf(button)).toHaveAttribute('data-collapsible');
+      expect(rootOf(button)).not.toHaveAttribute('data-open');
+      expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+K');
+      // The tooltip says what the name does: a second reading would repeat the name.
+      expect(button).not.toHaveAttribute('aria-describedby');
+      expect(button).toHaveAttribute('data-icon-only');
+      expect(button).toHaveAttribute('data-variant', 'ghost');
+    });
+
+    it('has a tooltip with the name and the key, below the button', () => {
+      platform('Win32');
+      render(<Search collapsible shortcut="mod+k" />);
+      const tip = screen.getByRole('tooltip', { hidden: true });
+      expect(tip.firstChild?.textContent).toBe('Search');
+      expect(tip.querySelector('kbd')?.textContent).toBe('Ctrl K');
+      expect(tip).toHaveAttribute('data-side', 'bottom');
+    });
+
+    it('opens on a click: the button goes, the field has the focus, and the ← button is there', async () => {
+      render(<Search collapsible />);
+      await open();
+      expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
+      expect(rootOf(search())).toHaveAttribute('data-open');
+      expect(search()).toHaveFocus();
+      expect(screen.getByRole('button', { name: 'Close search' })).toBeInTheDocument();
+      expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
+    });
+
+    it('opens on Enter, from the keyboard', async () => {
+      const user = userEvent.setup();
+      render(<Search collapsible />);
+      await user.tab();
+      await user.keyboard('{Enter}');
+      expect(search()).toHaveFocus();
+    });
+
+    it('the shortcut opens it, focuses the field and selects the text', async () => {
+      render(<Search collapsible shortcut="/" defaultValue="abc" />);
+      expect(rootOf(screen.getByRole('button', { name: 'Search' }))).not.toHaveAttribute(
+        'data-open',
+      );
+      press({ key: '/' });
+      expect(rootOf(search())).toHaveAttribute('data-open');
+      expect(search()).toHaveFocus();
+      expect(search().selectionStart).toBe(0);
+      expect(search().selectionEnd).toBe(3);
+      // Open already: it only takes the focus and selects the text again.
+      search().setSelectionRange(1, 1);
+      search().blur();
+      press({ key: '/' });
+      expect(search()).toHaveFocus();
+      expect(search().selectionEnd).toBe(3);
+    });
+
+    it('closes when it is empty and the focus leaves it, and the button is back', async () => {
+      const user = userEvent.setup();
+      render(
+        <>
+          <Search collapsible />
+          <button type="button">After</button>
+        </>,
+      );
+      await open(user);
+      await user.tab();
+      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
+      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
+      expect(screen.queryByRole('searchbox')).not.toBeNull();
+      expect(rootOf(search())).not.toHaveAttribute('data-open');
+    });
+
+    it('closes when the page is clicked', async () => {
+      const user = userEvent.setup();
+      render(<Search collapsible />);
+      await open(user);
+      await user.click(document.body);
+      expect(rootOf(search())).not.toHaveAttribute('data-open');
+    });
+
+    it('does not close while it has text, or while the focus is on one of its own buttons', async () => {
+      const user = userEvent.setup();
+      render(
+        <>
+          <Search collapsible />
+          <button type="button">After</button>
+        </>,
+      );
+      await open(user);
+      await user.type(search(), 'abc');
+      await user.tab();
+      expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();
+      expect(rootOf(search())).toHaveAttribute('data-open');
+      await user.tab();
+      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
+      expect(rootOf(search())).toHaveAttribute('data-open');
+      await user.click(search());
+      await user.clear(search());
+      // Now empty, with the focus in the field: the clear button is gone and the field stays open.
+      expect(rootOf(search())).toHaveAttribute('data-open');
+      await user.tab({ shift: true });
+      expect(screen.getByRole('button', { name: 'Close search' })).toHaveFocus();
+      expect(rootOf(search())).toHaveAttribute('data-open');
+    });
+
+    it('does not close when the window loses the focus, which leaves the field the active element', async () => {
+      const user = userEvent.setup();
+      render(<Search collapsible />);
+      await open(user);
+      fireEvent.blur(search(), { relatedTarget: null });
+      expect(search()).toHaveFocus();
+      expect(rootOf(search())).toHaveAttribute('data-open');
+    });
+
+    it('Esc on the empty field closes it, puts the focus on the button and keeps the key from going on', async () => {
+      render(<Search collapsible />);
+      await open();
+      expect(press({ key: 'Escape' }, search())).toBe(false);
+      const button = screen.getByRole('button', { name: 'Search' });
+      expect(rootOf(button)).not.toHaveAttribute('data-open');
+      expect(button).toHaveFocus();
+    });
+
+    it('Esc on a field with text clears it first, and closes it on the next', async () => {
+      const user = userEvent.setup();
+      render(<Search collapsible />);
+      await open(user);
+      await user.type(search(), 'abc');
+      press({ key: 'Escape' }, search());
+      expect(search()).toHaveValue('');
+      expect(rootOf(search())).toHaveAttribute('data-open');
+      press({ key: 'Escape' }, search());
+      expect(rootOf(search())).not.toHaveAttribute('data-open');
+      expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
+    });
+
+    it('Esc during an input method composition does not close it', async () => {
+      render(<Search collapsible />);
+      await open();
+      press({ key: 'Escape', isComposing: true }, search());
+      expect(rootOf(search())).toHaveAttribute('data-open');
+    });
+
+    it('the ← button closes it with the text kept, the focus on the button; opening again shows the text', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      render(<Search collapsible onValueChange={onValueChange} />);
+      await open(user);
+      await user.type(search(), 'abc');
+      await user.click(screen.getByRole('button', { name: 'Close search' }));
+      expect(rootOf(search())).not.toHaveAttribute('data-open');
+      expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
+      expect(search()).toHaveValue('abc');
+      expect(onValueChange).toHaveBeenLastCalledWith('abc');
+      await open(user);
+      expect(search()).toHaveValue('abc');
+      expect(search()).toHaveFocus();
+    });
+
+    it('names the ← button with labels.close', async () => {
+      render(<Search collapsible labels={{ close: 'Đóng' }} />);
+      await open();
+      expect(screen.getByRole('button', { name: 'Đóng' })).toHaveClass('flg-search-field-back');
+    });
+
+    it('keeps the text it has in a form while it is closed', async () => {
+      const user = userEvent.setup();
+      const { container } = render(
+        <form>
+          <Search collapsible name="q" />
+        </form>,
+      );
+      await open(user);
+      await user.type(search(), 'abc');
+      await user.click(screen.getByRole('button', { name: 'Close search' }));
+      expect(new FormData(container.querySelector('form')!).get('q')).toBe('abc');
+    });
+
+    it('a field that becomes collapsible and back follows the prop', () => {
+      const { rerender } = render(<Search />);
+      expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
+      rerender(<Search collapsible />);
+      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
+      rerender(<Search />);
+      expect(screen.queryByRole('button', { name: 'Search' })).toBeNull();
+      expect(rootOf(search())).not.toHaveAttribute('data-collapsible');
+    });
+
+    it('a disabled collapsed field has a button that does not open it, and the shortcut does not', () => {
+      render(<Search collapsible shortcut="/" disabled />);
+      expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
+      press({ key: '/' });
+      expect(rootOf(search())).not.toHaveAttribute('data-open');
+    });
+  });
+});
diff --git a/src/components/search-field/shortcut.test.tsx b/src/components/search-field/shortcut.test.tsx
new file mode 100644
index 0000000..6f26523
--- /dev/null
+++ b/src/components/search-field/shortcut.test.tsx
@@ -0,0 +1,190 @@
+import { render } from '@testing-library/react';
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import { matchesShortcut, useShortcut } from './shortcut';
+import type { Shortcut } from './shortcut';
+
+function press(init: KeyboardEventInit, target: EventTarget = document.body): KeyboardEvent {
+  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
+  target.dispatchEvent(event);
+  return event;
+}
+
+describe('matchesShortcut', () => {
+  const key = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);
+
+  it('"/" is the slash key with no Ctrl, Meta or Alt, Shift allowed', () => {
+    expect(matchesShortcut(key({ key: '/' }), '/', false)).toBe(true);
+    expect(matchesShortcut(key({ key: '/', shiftKey: true }), '/', true)).toBe(true);
+    for (const modifier of ['ctrlKey', 'metaKey', 'altKey'] as const) {
+      expect(matchesShortcut(key({ key: '/', [modifier]: true }), '/', false)).toBe(false);
+    }
+  });
+
+  it('"mod+k" is K with exactly the modifier of the platform', () => {
+    const k = (init: KeyboardEventInit) => key({ key: 'k', ...init });
+    expect(matchesShortcut(k({ metaKey: true }), 'mod+k', true)).toBe(true);
+    expect(matchesShortcut(k({ ctrlKey: true }), 'mod+k', true)).toBe(false);
+    expect(matchesShortcut(k({ ctrlKey: true }), 'mod+k', false)).toBe(true);
+    expect(matchesShortcut(k({ metaKey: true }), 'mod+k', false)).toBe(false);
+    expect(matchesShortcut(k({}), 'mod+k', false)).toBe(false);
+    // Another modifier makes it another shortcut.
+    expect(matchesShortcut(k({ ctrlKey: true, shiftKey: true }), 'mod+k', false)).toBe(false);
+    expect(matchesShortcut(k({ ctrlKey: true, altKey: true }), 'mod+k', false)).toBe(false);
+    expect(matchesShortcut(k({ ctrlKey: true, metaKey: true }), 'mod+k', false)).toBe(false);
+  });
+
+  it('"mod+k" takes the capital K that Caps Lock types', () => {
+    expect(matchesShortcut(key({ key: 'K', ctrlKey: true }), 'mod+k', false)).toBe(true);
+  });
+});
+
+function Probe({
+  shortcut,
+  onMatch,
+  enabled = true,
+}: {
+  shortcut: Shortcut | undefined;
+  onMatch: () => boolean;
+  enabled?: boolean;
+}) {
+  useShortcut(shortcut, onMatch, enabled);
+  return null;
+}
+
+describe('useShortcut', () => {
+  afterEach(() => {
+    vi.unstubAllGlobals();
+    document.body.innerHTML = '';
+  });
+
+  it('runs the handler on a match and prevents the key', () => {
+    const onMatch = vi.fn(() => true);
+    render(<Probe shortcut="/" onMatch={onMatch} />);
+    const event = press({ key: '/' });
+    expect(onMatch).toHaveBeenCalledTimes(1);
+    expect(event.defaultPrevented).toBe(true);
+  });
+
+  it('leaves the key alone when the handler did not take it', () => {
+    render(<Probe shortcut="/" onMatch={() => false} />);
+    expect(press({ key: '/' }).defaultPrevented).toBe(false);
+  });
+
+  it('does nothing without a shortcut, for another key or while disabled', () => {
+    const onMatch = vi.fn(() => true);
+    const { rerender } = render(<Probe shortcut={undefined} onMatch={onMatch} />);
+    press({ key: '/' });
+    rerender(<Probe shortcut="/" onMatch={onMatch} />);
+    press({ key: 'a' });
+    rerender(<Probe shortcut="/" onMatch={onMatch} enabled={false} />);
+    press({ key: '/' });
+    expect(onMatch).not.toHaveBeenCalled();
+  });
+
+  it('skips an editable target, an event that was prevented and one in an IME composition', () => {
+    const onMatch = vi.fn(() => true);
+    const { container } = render(
+      <>
+        <Probe shortcut="/" onMatch={onMatch} />
+        <input aria-label="other" />
+        <div contentEditable suppressContentEditableWarning />
+      </>,
+    );
+    press({ key: '/' }, container.querySelector('input')!);
+    press({ key: '/' }, container.querySelector('[contenteditable]')!);
+    document.addEventListener('keydown', (event) => event.preventDefault(), {
+      once: true,
+      capture: true,
+    });
+    press({ key: '/' });
+    press({ key: '/', isComposing: true });
+    expect(onMatch).not.toHaveBeenCalled();
+    press({ key: '/' });
+    expect(onMatch).toHaveBeenCalledTimes(1);
+  });
+
+  it('reads the platform when the key is pressed', () => {
+    const onMatch = vi.fn(() => true);
+    vi.stubGlobal('navigator', { platform: 'MacIntel' });
+    render(<Probe shortcut="mod+k" onMatch={onMatch} />);
+    press({ key: 'k', ctrlKey: true });
+    expect(onMatch).not.toHaveBeenCalled();
+    press({ key: 'k', metaKey: true });
+    expect(onMatch).toHaveBeenCalledTimes(1);
+  });
+
+  it('gives the key to the one mounted last, and back when it unmounts', () => {
+    const first = vi.fn(() => true);
+    const second = vi.fn(() => true);
+    render(<Probe shortcut="/" onMatch={first} />);
+    const later = render(<Probe shortcut="/" onMatch={second} />);
+    press({ key: '/' });
+    expect(first).not.toHaveBeenCalled();
+    expect(second).toHaveBeenCalledTimes(1);
+    later.unmount();
+    press({ key: '/' });
+    expect(first).toHaveBeenCalledTimes(1);
+  });
+
+  it('keeps one claim per shortcut: another shortcut is another claim', () => {
+    const slash = vi.fn(() => true);
+    const mod = vi.fn(() => true);
+    vi.stubGlobal('navigator', { platform: 'Win32' });
+    render(
+      <>
+        <Probe shortcut="/" onMatch={slash} />
+        <Probe shortcut="mod+k" onMatch={mod} />
+      </>,
+    );
+    press({ key: '/' });
+    press({ key: 'k', ctrlKey: true });
+    expect(slash).toHaveBeenCalledTimes(1);
+    expect(mod).toHaveBeenCalledTimes(1);
+  });
+
+  it('a field that changes its shortcut and back is the one mounted last again', () => {
+    const first = vi.fn(() => true);
+    const second = vi.fn(() => true);
+    const both = (a: Shortcut) => (
+      <>
+        <Probe shortcut={a} onMatch={first} />
+        <Probe shortcut="/" onMatch={second} />
+      </>
+    );
+    const { rerender } = render(both('/'));
+    press({ key: '/' });
+    expect([first.mock.calls.length, second.mock.calls.length]).toEqual([0, 1]);
+    rerender(both('mod+k'));
+    rerender(both('/'));
+    press({ key: '/' });
+    expect([first.mock.calls.length, second.mock.calls.length]).toEqual([1, 1]);
+  });
+
+  it('a field that is turned off hands the key to the one before it', () => {
+    const first = vi.fn(() => true);
+    const second = vi.fn(() => true);
+    const both = (enabled: boolean) => (
+      <>
+        <Probe shortcut="/" onMatch={first} />
+        <Probe shortcut="/" onMatch={second} enabled={enabled} />
+      </>
+    );
+    const { rerender } = render(both(true));
+    rerender(both(false));
+    press({ key: '/' });
+    expect(first).toHaveBeenCalledTimes(1);
+    expect(second).not.toHaveBeenCalled();
+  });
+
+  it('calls the handler of the latest render', () => {
+    const calls: string[] = [];
+    const handler = (name: string) => () => {
+      calls.push(name);
+      return true;
+    };
+    const { rerender } = render(<Probe shortcut="/" onMatch={handler('a')} />);
+    rerender(<Probe shortcut="/" onMatch={handler('b')} />);
+    press({ key: '/' });
+    expect(calls).toEqual(['b']);
+  });
+});
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 5597658..37de242 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the thirty-five rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the thirty-six rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(35);
+    expect(rows).toHaveLength(36);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -53,6 +53,7 @@ describe('ExceptionTable', () => {
       '33',
       '34',
       '35',
+      '36',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -101,6 +102,8 @@ describe('ExceptionTable', () => {
     expect(cells(rows[33]!).slice(1, 3)).toEqual(['2.97:1', '3.27:1']);
     // The bar of the current item of a Nav `bar` on its tint (spec phase 5 §4.4): under 3:1 in both.
     expect(cells(rows[34]!).slice(1, 3)).toEqual(['2.52:1', '2.03:1']);
+    // The key hint of a SearchField (spec phase 5 §4.4): enough in light, 3.31:1 in dark.
+    expect(cells(rows[35]!).slice(1, 3)).toEqual(['meets AA (7.15:1)', '3.31:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -148,6 +151,7 @@ describe('ExceptionTable', () => {
       '1.4.3',
       '1.4.3',
       '1.4.11',
+      '1.4.3',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/index.test.ts b/src/index.test.ts
index f53dd03..04e3519 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -92,6 +92,7 @@ describe('public API', () => {
       'Progress',
       'Radio',
       'RadioGroup',
+      'SearchField',
       'SegmentedControl',
       'SegmentedControlItem',
       'Select',
diff --git a/src/internal/editable.test.ts b/src/internal/editable.test.ts
new file mode 100644
index 0000000..f7b9fe4
--- /dev/null
+++ b/src/internal/editable.test.ts
@@ -0,0 +1,45 @@
+import { afterEach, describe, expect, it } from 'vitest';
+import { isEditable } from './editable';
+
+function mount(html: string): HTMLElement {
+  const host = document.createElement('div');
+  host.innerHTML = html;
+  document.body.append(host);
+  return host;
+}
+
+describe('isEditable', () => {
+  afterEach(() => {
+    document.body.innerHTML = '';
+  });
+
+  it('is true for the controls the user types into', () => {
+    const host = mount(
+      '<input id="a"><input id="b" type="search"><input id="c" type="EMAIL"><textarea id="d"></textarea><select id="e"></select>',
+    );
+    for (const id of ['a', 'b', 'c', 'd', 'e']) {
+      expect(isEditable(host.querySelector(`#${id}`)!), id).toBe(true);
+    }
+  });
+
+  it('is true for a contenteditable element and for a descendant of one', () => {
+    const host = mount('<div id="a" contenteditable="true"><b id="b">x</b></div>');
+    expect(isEditable(host.querySelector('#a')!)).toBe(true);
+    expect(isEditable(host.querySelector('#b')!)).toBe(true);
+  });
+
+  it('is false for an input that takes no text, and for contenteditable="false"', () => {
+    const host = mount(
+      '<input id="a" type="checkbox"><input id="b" type="BUTTON"><input id="c" type="range"><div id="d" contenteditable="false"></div><button id="e"></button>',
+    );
+    for (const id of ['a', 'b', 'c', 'd', 'e']) {
+      expect(isEditable(host.querySelector(`#${id}`)!), id).toBe(false);
+    }
+  });
+
+  it('is false for a target that is not an element', () => {
+    expect(isEditable(undefined)).toBe(false);
+    expect(isEditable(document)).toBe(false);
+    expect(isEditable(window)).toBe(false);
+  });
+});
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index 36d62c9..e9389ed 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -14,6 +14,7 @@ import {
   MenuIcon,
   MinusIcon,
   PlusIcon,
+  SearchIcon,
   StatusIcon,
   UploadIcon,
   strokeIcon,
@@ -74,6 +75,7 @@ describe('shared icons', () => {
   it.each([
     ['down', ['M12 5v14', 'm19 12-7 7-7-7']],
     ['up', ['M12 19V5', 'm5 12 7-7 7 7']],
+    ['left', ['M19 12H5', 'm12 19-7-7 7-7']],
   ] as const)('ArrowIcon direction %s pins its paths', (direction, paths) => {
     const { container } = render(<ArrowIcon direction={direction} />);
     expect(Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual(
@@ -102,6 +104,20 @@ describe('shared icons', () => {
     expect(container.querySelector('path')?.getAttribute('d')).toBe('M18 6 6 18M6 6l12 12');
   });
 
+  it('SearchIcon pins its shapes: a circle and the handle', () => {
+    const { container } = render(<SearchIcon />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    const circle = container.querySelector('circle')!;
+    expect([
+      circle.getAttribute('cx'),
+      circle.getAttribute('cy'),
+      circle.getAttribute('r'),
+    ]).toEqual(['11', '11', '7']);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('m20 20-3.5-3.5');
+  });
+
   it('MinusIcon pins its path', () => {
     const { container } = render(<MinusIcon />);
     expect(container.querySelector('path')?.getAttribute('d')).toBe('M5 12h14');
diff --git a/src/internal/platform.test.ts b/src/internal/platform.test.ts
new file mode 100644
index 0000000..c400457
--- /dev/null
+++ b/src/internal/platform.test.ts
@@ -0,0 +1,38 @@
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import { isApplePlatform } from './platform';
+
+/** Sets the two places the platform is read from; `undefined` removes the property. */
+function platform(userAgentData: string | undefined, legacy: string): void {
+  vi.stubGlobal('navigator', {
+    ...(userAgentData === undefined ? {} : { userAgentData: { platform: userAgentData } }),
+    platform: legacy,
+  });
+}
+
+describe('isApplePlatform', () => {
+  afterEach(() => {
+    vi.unstubAllGlobals();
+  });
+
+  it.each(['macOS', 'MacIntel', 'iPhone', 'iPad', 'iPod'])('is true for %s', (name) => {
+    platform(undefined, name);
+    expect(isApplePlatform()).toBe(true);
+  });
+
+  it.each(['Win32', 'Linux x86_64', 'Android', ''])('is false for "%s"', (name) => {
+    platform(undefined, name);
+    expect(isApplePlatform()).toBe(false);
+  });
+
+  it('prefers userAgentData.platform to navigator.platform', () => {
+    platform('macOS', 'Win32');
+    expect(isApplePlatform()).toBe(true);
+    platform('Windows', 'MacIntel');
+    expect(isApplePlatform()).toBe(false);
+  });
+
+  it('is false when the browser says nothing', () => {
+    vi.stubGlobal('navigator', {});
+    expect(isApplePlatform()).toBe(false);
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal src/components/search-field src/index.test.ts src/docs
pnpm vitest run --project scripts scripts/lib/contrast.test.ts
```

Expected: FAIL.
- `editable.test.ts`, `platform.test.ts` (project `unit`), `shortcut.test.tsx` và `SearchField.test.tsx` (cả hai project React) không nạp được (`Failed to resolve import "./editable" from "src/internal/editable.test.ts". Does the file exist?`, và tương tự cho `./platform`, `./shortcut`, `./SearchField`), nên không test nào của chúng chạy. `SearchField.test-d.ts` báo lỗi kiểu vì module chưa có.
- `icons.test.tsx`: `SearchIcon pins its shapes: a circle and the handle` fail (`Element type is invalid`), `ArrowIcon direction left pins its paths` fail (chưa có đường vẽ cho `left`).
- `public API > exports exactly the documented components and nothing internal`: danh sách export nhận được thiếu `SearchField`.
- `ExceptionTable.test.tsx`: `lists the thirty-six rows of spec §4.9 with light and dark measurements` fail: bảng dựng từ `contrast-exceptions.ts` còn 35 dòng.
- `contrast.test.ts`: ba test của `the key hint of a SearchField (spec phase 5 §4.4)` fail, ví dụ `is a check at 4.5:1` với `expected undefined to be 4.5`.
- Test của Toaster không có trong patch và vẫn pass: `isEditable` còn nằm trong `Toaster.tsx`.

Story không chạy ở bước này: `SearchField.stories.tsx` import `SearchField`, chưa có.

Theo báo cáo của bản nháp (phát hiện 19):
- `editable.test.ts`, `platform.test.ts`, `shortcut.test.tsx`, test icon, test của `contrast.ts` và `ExceptionTable.test.tsx` được viết trước và fail như trên. `platform.test.ts` còn fail một lần nữa sau khi module có: `is true for macOS` (`expected false to be true`), vì chữ "Mac" của spec không khớp "macOS"; code và spec §5 được sửa (phát hiện 4).
- **`SearchField.test.tsx` và `SearchField.test-d.ts` được viết sau component**, không có lần chạy fail trước. `SearchField.test.tsx` được kiểm bằng bảy đột biến, mỗi lần một đột biến, cái nào cũng bị bắt (danh sách ở phát hiện 19).
- Story viết cùng code. Story bố cục `InTheHeader` fail lần đầu vì lỗi thật: ô H3 mở trong cụm widget rộng 253px, không phải 300px (thêm `width`), và ô phủ cao 55px, không phải 56px (test được sửa: ô phủ hộp padding của header). `FocusRings` chờ `settled` vì vòng ← nhạt ở Firefox tối cho tới khi transition xong (phát hiện 2, 6).

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 1f6ded4..0df180f 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -347,6 +347,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 33 | Chữ trên hàng lẻ của Table `striped` (`--flg-control-track` pha 50%): chữ mờ `--flg-text-muted`; chữ của Badge | đạt (4.57:1) chữ mờ; Badge 3.09:1 `accent` (trạng thái 4.09:1) | chữ mờ 3.71:1; Badge 3.37:1 `accent` (trạng thái 4.08:1) | 4.5:1 | 1.4.3 |
 | 34 | Chữ của Badge trên hàng đã chọn của Table (`--flg-accent-subtle`) | 2.97:1 `accent` (trạng thái 3.91:1) | 3.27:1 `accent` (trạng thái 3.98:1) | 4.5:1 | 1.4.3 |
 | 35 | Vạch 3px `--flg-accent-solid` của mục đang chọn, Nav `bar` (N2), trên nền nhuộm 18% `--flg-accent-solid` của mục | 2.52:1 | 2.03:1 | 3:1 | 1.4.11 |
+| 36 | Chữ `--flg-text-muted` của phím gợi ý (`⌘K`) trên nền `--flg-control-bg-secondary`: trong ô SearchField, trong tooltip của SearchField thu gọn | đạt (7.15:1) | 3.31:1 (ô), 3.76:1 (tooltip) | 4.5:1 | 1.4.3 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
@@ -362,7 +363,9 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 35 là vạch của mục đang chọn Nav `bar` theo mockup N2 (giai đoạn 5, Plan B): vạch `--flg-accent-solid` rộng 3px trên nền nhuộm `color-mix` 18% của chính màu đó, nên thấp ở cả hai theme; mục đó còn có chữ đậm và `aria-current="page"`, nên vạch không phải dấu hiệu duy nhất. Chữ `--flg-text` của mục (và số đếm của nó) đạt (8.24:1 light, 5.82:1 dark, thấp nhất của hai điểm 18% và 3% của nền) và icon `--flg-accent-text` đạt (3.28:1, 3.80:1), nên không phải ngoại lệ. Các vị trí khác của Nav cùng cặp màu với các điểm 2 (vòng focus của mục và nút nhóm), 6 (tiêu đề mục, số đếm trần của `bar`), 7 và 8 (chữ, icon và nền của mục đang chọn `pill`), 12 (số đếm trần của `bar` khi hover), 29 (nhãn của nhóm chứa trang hiện tại, `pill`) và 32 (`Badge` đếm của `pill` khi hover, dark 4.15:1 `neutral`), nên được ghi ở đó. Ở `prefers-contrast: more` cả ba cặp mới đều đạt (4.65:1, 11.44:1 và 4.55:1 ở light; 5.30:1, 10.17:1 và 6.64:1 ở dark).
 
-Cả ba mươi lăm điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Điểm 36 là chữ của phím gợi ý (`⌘K`) trong ô SearchField theo mockup H2 và H3 (giai đoạn 5, Plan C): `--flg-text-muted` trên nền `--flg-control-bg-secondary` của phím, nằm trên nền ô (`--flg-control-bg`) hoặc trên kính của tooltip của nút thu gọn. Ở dark là 3.31:1 trong ô và 3.76:1 trong tooltip, nên ghi 3.31:1 (số thấp hơn); light đạt cả hai (7.15:1). Phím gợi ý là chữ phụ ẩn khỏi công nghệ hỗ trợ (`aria-hidden`), và phím tắt được nói qua `aria-keyshortcuts` trên ô và trên nút thu gọn, nên không có thông tin nào chỉ nằm ở chữ đó; hai điều này không miễn tiêu chí, chỉ là bối cảnh khi duyệt. Ở `prefers-contrast: more` đạt (7.83:1 light, 7.63:1 dark).
+
+Cả ba mươi sáu điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index 1872430..b2f5ecf 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -383,7 +383,7 @@ Bảng là của khung có sidebar; không có sidebar thì chỉ có ô brand c
 
 **Phần chung:**
 
-- Gốc `.flg-search-field`; bên trong là khung của `Input` (`.flg-input`, cùng cỡ `sm`/`md`/`lg`, cùng focus: viền `--flg-accent-solid`, `outline`, `--flg-focus-ring`). Ngoài header, gốc rộng như `Input` (đầy hàng). Trong `AppShellHeader`: `flex: 0 1 280px; min-width: 0`, cách phần tử trước thêm 4px (trang S).
+- Gốc `.flg-search-field`; bên trong là khung của `Input` (`.flg-input`, cùng cỡ `sm`/`md`/`lg`, cùng focus: viền `--flg-accent-solid`, `outline`, `--flg-focus-ring`). Ngoài header, gốc rộng như `Input` (đầy hàng). Trong `AppShellHeader`: `flex: 0 1 280px; width: 280px; min-width: 0`, cách phần tử trước thêm 4px (trang S); `width` có thêm vì một phần tử bọc quanh ô (cụm widget cuối header) rộng bằng nội dung bên trong, không đo theo flex-basis, nên ô chỉ rộng bằng cỡ tự nhiên của `<input>` (phát hiện khi lập Plan C).
 - Đầu ô: icon kính lúp 16px, màu `--flg-text-muted` (ô trang trí của `Input`).
 - `<input type="search">`: bỏ giao diện riêng của trình duyệt (`appearance: none`, `::-webkit-search-cancel-button` và `::-webkit-search-decoration` ẩn).
 - Cuối ô (ô trang trí cuối có `margin-right: -5px`):
@@ -391,7 +391,7 @@ Bảng là của khung có sidebar; không có sidebar thì chỉ có ô brand c
   - **Nút xoá** (khi có chữ, thay chỗ gợi ý): `<button type="button">` 20×20px, bo `--flg-radius-full`, không nền, màu `--flg-text-muted`, icon × 14px. Hover (ngoài mockup): nền `--flg-control-track`, màu `--flg-text`. Focus: vòng focus chung.
 - **Dưới 768px** (Claude chốt): gợi ý phím ẩn (mockup H2 điện thoại: "không có gợi ý phím").
 
-**H2 (`collapsible={false}`, mặc định):** ô luôn hiện, rộng 280px trong header. Dưới 768px trong header: `flex: 1 1 auto`, cách hai bên `0 4px 0 2px`, và chữ của brand chỉ còn dấu (§AppShell).
+**H2 (`collapsible={false}`, mặc định):** ô luôn hiện, rộng 280px trong header. Dưới 768px trong header: `flex: 1 1 0%` (như `flex: 1` của mockup; `1 1 auto` bắt các phần khác của header co lại theo cỡ tự nhiên của `<input>`; phát hiện khi lập Plan C), cách hai bên `0 4px 0 2px`, và chữ của brand chỉ còn dấu (§AppShell).
 
 **H3 (`collapsible`):**
 
@@ -544,7 +544,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
 | `popover.ts` (A) | `OPEN_POPOVER_CLOSES_ON_ESC`, `hasOpenPopover(root)` | Selector của popover đang mở mà Esc và lần nhấn ra ngoài đóng được (`auto`, `hint`; không phải `manual`), và lần tìm nó trong một phần tử, trả `false` ở engine không biết `:popover-open`. Tooltip và tấm trượt của AppShell dùng chung, để một sửa đổi tới được cả hai. Cùng lúc `isVisible` của `focus.ts` được export và tấm trượt dùng nó thay cho kiểm tra riêng (phát hiện khi review PR #37) |
 | `child-keys.ts` (B, thêm vào file có sẵn) | `keyedChildren(children)` | Các con thành danh sách phẳng như `flattenChildren` (qua Fragment, mảng, iterable, tham chiếu lazy; bỏ những gì không render), mỗi con kèm một khoá là đường đi của nó trong children như được viết, như `Children.toArray` dựng: ở mỗi cấp là khoá riêng hay vị trí của nó (khe rỗng như `{cond && …}` vẫn được đếm), mảng lồng và Fragment thêm tiền tố là khoá hay vị trí của chúng; khoá riêng lặp lại trong cùng một danh sách thì dùng vị trí, như `childKeys`; hai hàm dùng chung một quy tắc khoá (`keyRule`: hai không gian `$` và `#`, thoát `:` và `=` trong khoá riêng, khoá lặp thì dùng vị trí), để một sửa đổi tới được cả hai (phát hiện khi review PR #38). Nhờ vậy một con đến hay đi không đổi khoá của các con sau nó. `flattenChildren` trả các `node` của nó, để chỉ có một lần duyệt (phát hiện khi review cuối Plan B) |
 | `click.ts` (B) | `isPlainClick(event)`, `blockActivation(event)` | `isPlainClick`: lần bấm mà trình duyệt theo link ngay trong tab này (nút chính, không Ctrl, Cmd, Shift, Alt, chưa `defaultPrevented`, và link không có `target` khác `_self` cũng không có `download`: `target` rỗng là tab này, từ khoá đọc không phân biệt hoa thường; `target="_blank"` hay `download` để người dùng ở lại trang, nên tấm trượt, flyout và trang của Pagination giữ nguyên; phát hiện khi review PR #38), trước là `leftToBrowser` của Pagination. `blockActivation`: `preventDefault` và `stopPropagation` ở pha capture, trước là bản riêng của `Button` và của `NavItem`. Button, Pagination và Nav dùng chung, để một sửa đổi của "lần bấm thường" tới được mọi nơi (phát hiện khi review cuối Plan B) |
-| `platform.ts` (C) | `isApplePlatform(): boolean` | `navigator.userAgentData?.platform`, không có thì `navigator.platform`, có chứa "Mac", "iPhone", "iPad" hay "iPod". Chỉ gọi sau khi mount |
+| `platform.ts` (C) | `isApplePlatform(): boolean` | `navigator.userAgentData?.platform`, không có thì `navigator.platform`, có chứa "Mac", "iPhone", "iPad" hay "iPod", không phân biệt hoa thường (`userAgentData` trả "macOS", `navigator.platform` trả "MacIntel") (phát hiện khi lập Plan C). Chỉ đọc sau khi mount: SearchField đọc nó bằng `useSyncExternalStore` có giá trị phía server là `undefined`, nên lần render hydrate cho cùng chữ với server rồi mới điền (phát hiện khi lập Plan C) |
 | `editable.ts` (C) | `isEditable(target)` | Chuyển nguyên từ `Toaster.tsx` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]`, hay con của chúng); Toaster và phím tắt của SearchField dùng chung |
 | `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store |
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 943b69d..a3dcf16 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -201,6 +201,10 @@ const SHIPPED_CLASSES = [
   'flg-nav-group',
   'flg-nav-group-chevron',
   'flg-nav-sub',
+  'flg-search-field',
+  'flg-search-field-kbd',
+  'flg-search-field-clear',
+  'flg-search-field-back',
 ];
 
 // The rules of the AppShell that depend on the width are generated, one `@media` block per breakpoint
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 0079a40..2dfee49 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -34,6 +34,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/table/Table.tsx',
   'src/components/app-shell/AppShell.tsx',
   'src/components/nav/Nav.tsx',
+  'src/components/search-field/SearchField.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
   'src/components/file-upload/FileUpload.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 7ce0693..6cd054c 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -216,6 +216,12 @@ const D = {
       'the accent that the item has behind it',
     criterion: '1.4.11',
   },
+  36: {
+    description:
+      'The text of the key hint of a SearchField (`⌘K`, muted text on the secondary control ' +
+      'background), in the field and in the tooltip of a collapsed field',
+    criterion: '1.4.3',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -291,4 +297,5 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 34, theme: 'dark', check: 'table-selected-badge', recorded: 3.27, ...D[34] },
   { row: 35, theme: 'light', check: 'nav-bar-indicator', recorded: 2.52, ...D[35] },
   { row: 35, theme: 'dark', check: 'nav-bar-indicator', recorded: 2.03, ...D[35] },
+  { row: 36, theme: 'dark', check: 'kbd-text', recorded: 3.31, ...D[36] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 9c0b59b..08b557c 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -87,6 +87,7 @@ export const CHECKS = {
   'nav-bar-text': 4.5,
   'nav-bar-icon': 3,
   'nav-rail-current-dot': 3,
+  'kbd-text': 4.5,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -283,8 +284,15 @@ export function measure(
   // Tooltip: the tint straight over the page, with no border gradient under it.
   const tooltips = backdrops.map((backdrop) => composite(color('glass-tint'), backdrop));
   const textOn = (name: string, under: Rgba) => contrastRatio(composite(color(name), under), under);
+  // The key hint of a SearchField (search-field.css): muted text on control-bg-secondary, over what it
+  // sits in: the background of the frame, or the glass of the tooltip of a collapsed field.
+  const kbdText = (under: Rgba) => {
+    const key = composite(color('control-bg-secondary'), under);
+    return contrastRatio(composite(color('text-muted'), key), key);
+  };
   for (const under of tooltips) {
     lowest['tooltip-text'] = Math.min(lowest['tooltip-text'], textOn('text', under));
+    lowest['kbd-text'] = Math.min(lowest['kbd-text'], kbdText(under));
   }
   for (const surface of surfaces) {
     const control = composite(color('control-bg'), surface);
@@ -462,6 +470,8 @@ export function measure(
     const onNavTint = (name: string, tints: Rgba[]) =>
       Math.min(...tints.map((tint) => contrastRatio(composite(color(name), tint), tint)));
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
+      // The tooltip's half of this check is measured above, with the tooltips.
+      'kbd-text': kbdText(control),
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
       success: onSurface('success'),
diff --git a/src/components/search-field/SearchField.mdx b/src/components/search-field/SearchField.mdx
new file mode 100644
index 0000000..443241f
--- /dev/null
+++ b/src/components/search-field/SearchField.mdx
@@ -0,0 +1,202 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import { StoryFrame } from '../../../.storybook/story-frame';
+import * as Stories from './SearchField.stories';
+
+<Meta of={Stories} />
+
+# SearchField
+
+A search box for the header of an application: a text input with a magnifier, a key hint, a button
+that clears it, and a key that takes you to it from anywhere on the page. It has two looks. The
+default is a field that is always there (H2). With `collapsible` it rests as a button in the place
+of the field and opens as the field when it is needed (H3).
+
+```tsx
+import { AppShell, AppShellHeader, SearchField } from 'h2d-glass-ui';
+
+<AppShellHeader>
+  <form role="search" action="/search">
+    <SearchField name="q" aria-label="Search the docs" shortcut="mod+k" />
+  </form>
+</AppShellHeader>;
+```
+
+<Canvas of={Stories.SearchFieldDefault} />
+
+## Props
+
+| Prop            | Type                         | Default | Does                                                                  |
+| --------------- | ---------------------------- | ------- | --------------------------------------------------------------------- |
+| `value`         | `string`                     | none    | The text. Pass it with `onValueChange` to control it                  |
+| `defaultValue`  | `string`                     | `''`    | The text at first, and what a form reset puts back                    |
+| `onValueChange` | `(value: string) => void`    | none    | Called with the text when it changes, the clear button too            |
+| `size`          | `'sm' \| 'md' \| 'lg'`       | `'md'`  | The size of the frame, as an `Input`                                  |
+| `invalid`       | `boolean`                    | `false` | Marks the text as wrong. Inside a `Field` with an error it already is |
+| `shortcut`      | `'/' \| 'mod+k'`             | none    | A key that focuses the field (see Shortcut)                           |
+| `collapsible`   | `boolean`                    | `false` | Rests as a button and opens as the field (see Collapsible)            |
+| `labels`        | `Partial<SearchFieldLabels>` | English | The words of the buttons and the name of the key hint                 |
+
+`className` and `style` go on the root, `.flg-search-field`, which is as wide as an `Input` outside
+a header. The `ref` and every other prop of an `<input>` (`name`, `form`, `placeholder`, `disabled`,
+`onFocus`, `aria-*`, `id`) go to the `<input type="search">`, as with `Input`. The type is always
+`search`. A `size` that is not one of the three is read as `md`.
+
+## A form control
+
+It is an `Input` underneath, so it works in a `Field`, in a form and with the keyboard as a native
+input does:
+
+- Inside a `Field` the label names it, the description and the error describe it, and `invalid` and
+  `disabled` follow the Field.
+- `name` is on the `<input>`, so `FormData` and native validation see the text. It stays in the
+  form while a collapsible field is closed.
+- `onChange` of the input is called first, then `onValueChange`; `event.preventDefault()` in
+  `onChange` leaves the text as it was.
+- A form reset puts `defaultValue` back, and the clear button follows it.
+- Enter submits the form the field is in. Wrap it in `<form role="search">`, which makes the
+  landmark of the page for it (see Accessibility).
+
+The text is the field's own unless you pass `value`. Nothing is searched for it: do that in
+`onSubmit` of the form, or in `onValueChange`, as your page needs.
+
+## The clear button
+
+When there is text the key hint gives way to a button that clears it. It sets the text to `''`,
+calls `onValueChange('')` and puts the focus back in the field. **It is in the Tab order**: Esc does
+the same, but not everyone knows that. It is not drawn on a field that is `disabled` or `readOnly`.
+
+**Esc** in the field clears the text and is prevented, so a `Dialog` that holds the field stays
+open. Esc on an empty field does nothing and leaves the key to whoever is around it (a collapsible
+field closes, see below). The library does this itself, because browsers differ in
+whether Esc clears a search input, and so that Esc means the same everywhere. Esc while an input
+method is composing text belongs to the input method.
+
+## Shortcut
+
+`shortcut="/"` or `shortcut="mod+k"` takes the focus to the field from anywhere on the page, and
+selects its text, so what the user types next replaces it. A collapsible field opens first. The key
+is prevented, so no "/" is typed and the browser's own `Ctrl K` does not run.
+
+- `"/"` is the slash key, with no Ctrl, Meta or Alt (Shift is allowed, since some keyboards type "/"
+  with it).
+- `"mod+k"` is K with the modifier of the platform and no other: ⌘ on Apple systems, Ctrl on the
+  others.
+- The key is left alone where the user types (an `<input>`, a `<textarea>`, a `<select>`, anything
+  `contenteditable`, this field included), when something else prevented it, and while an input
+  method is composing.
+- Two fields that ask for the same key: the one mounted last takes it.
+- A field that is `disabled` or `readOnly` does not take it.
+
+A value that is not one of the two is ignored and warned about in development. The shortcut is
+on `document`, so it needs the page to have the focus; it works in an iframe only for the frame.
+
+The key hint, `⌘K` or `Ctrl K` or `/`, is shown while the field is empty and a shortcut is set, and
+is hidden below 768px, where a phone has no such key. Which of `⌘K` and `Ctrl K` it is can be known
+only in the browser, so the HTML from the server has an empty, hidden `<kbd>` for `"mod+k"` and the
+browser fills it in once the page is ready; for `"/"` the text is there from the start. The
+hydration of the page does not see the difference.
+
+Firefox opens its own search bar with `Ctrl K`. The field prevents the key whenever it is pressed
+somewhere that does not take text, but a page that already uses `Ctrl K` or ⌘K for something else
+should take `"/"`.
+
+`aria-keyshortcuts` says the key to assistive technology: `"/"`, `"Meta+K"` or `"Control+K"`, on the
+field and on the button of a collapsible one. (For `"mod+k"` it appears when the page is ready, with
+the hint.) Pass your own `aria-keyshortcuts` and it is kept. The hint itself is `aria-hidden`.
+
+### The words
+
+`labels` has the names of the buttons and a function for the hint, since the keyboards of some
+languages write the key differently ("Strg"):
+
+```tsx
+<SearchField
+  aria-label="Suche"
+  shortcut="mod+k"
+  labels={{
+    clear: 'Suche leeren',
+    open: 'Suche',
+    close: 'Suche schließen',
+    shortcut: (shortcut, apple) => (shortcut === '/' ? '/' : apple ? '⌘K' : 'Strg K'),
+  }}
+/>
+```
+
+`labels.shortcut` is given the key and whether the page is on an Apple system. A key you leave out
+keeps its English default.
+
+## Collapsible
+
+<Canvas of={Stories.SearchFieldCollapsible} />
+
+With `collapsible` the field rests as an icon button named by `labels.open` ("Search"), with a
+tooltip that has the name and the key. A click, Enter on the button, or the shortcut opens the
+field in its place and puts the focus in it. The tooltip does not describe the button again (the
+button has its name and `aria-keyshortcuts` already), so a screen reader does not read it twice.
+
+It closes, and the button is back:
+
+- when it is **empty and the focus leaves it** (Tab, a click elsewhere). A window that loses the
+  focus does not count;
+- on **Esc** while it is **empty**, with the focus on the button. With text, Esc clears it first;
+- with the **← button** (see below), which keeps the text.
+
+A field with text never closes by itself. The open state is the field's own and has no prop, and the
+field starts closed.
+
+### In the header, on a phone
+
+<StoryFrame
+  phone
+  title="A collapsible SearchField, open, in the header of a phone"
+  id="components-searchfield--search-field-collapsible-phone-open"
+/>
+
+Below 768px, which is the same width for every `breakpoint` of the shell, an open collapsible field
+in an `AppShellHeader` covers the whole row of the header, and a button **←** (named by
+`labels.close`, "Close search") stands first in it. The rest of the header is out of sight, out of
+the accessibility tree and out of the Tab order while it is open. ← closes the field and keeps its
+text, and puts the focus on the button; when the user opens it again the text is there, since it is
+theirs.
+
+Put the field as a direct child of the header, or inside an element that has no `position` (a plain
+`<div>` for the widgets at the end of the header works): the cover is placed against the header.
+
+## In the header
+
+A field in an `AppShellHeader` is 280px wide, 4px off the element before it. Below 768px, it takes
+all the room that is left, the name of the `AppShellBrand` is shortened to its mark (the name stays
+the name of the link), and the hint of the key goes.
+
+<StoryFrame
+  phone
+  title="A SearchField in the header of a phone"
+  id="components-searchfield--search-field-default-phone"
+/>
+
+Outside a header the field is as wide as an `Input`: it fills its row.
+
+## Accessibility
+
+- **It needs a name.** Give it a `Field` label, `aria-label` or `aria-labelledby`. A placeholder is
+  not a name, and the field says so in development. The buttons are named by `labels`.
+- Wrap the field in `<form role="search">` when it searches the site: the form becomes the search
+  landmark, and the field inside it needs a name of its own anyway.
+- The key hint is for the eye; the key is said by `aria-keyshortcuts`.
+- The clear button and the button ← are in the Tab order and show the focus ring of the library. The
+  field shows it as an `Input` does.
+- The text of the key hint is `--flg-text-muted` on `--flg-control-bg-secondary`. In dark it is
+  3.31:1 and 3.76:1, which is below 4.5:1: row 36 of the table on the Accessibility page. The hint
+  is the only place the key is written, and the key is also said by `aria-keyshortcuts` and by the
+  tooltip of the button, so no one has to read the hint. With `prefers-contrast: more` it passes.
+- In forced colours the hint is drawn with the border and the text of the system, and the buttons
+  with the colour of a button.
+
+## Do and don't
+
+- Do give it a name, and `autoComplete="off"` when it searches your own data, so the browser does
+  not offer what was typed in other forms.
+- Do take `shortcut="/"` when the page already uses ⌘K or Ctrl K.
+- Don't rely on the placeholder to say what the field searches. It goes when the user types.
+- Don't put the field inside an element with `position` if it is `collapsible` and you want the
+  cover on a phone.
diff --git a/src/components/search-field/SearchField.tsx b/src/components/search-field/SearchField.tsx
new file mode 100644
index 0000000..6157efb
--- /dev/null
+++ b/src/components/search-field/SearchField.tsx
@@ -0,0 +1,310 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
+import type { ChangeEvent, FocusEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { dataAttr } from '../../internal/data-attr';
+import { markAsFieldControl, useFieldContext } from '../../internal/field-context';
+import { ArrowIcon, CloseIcon, SearchIcon } from '../../internal/icons';
+import { mergeRefs } from '../../internal/merge-refs';
+import { isApplePlatform } from '../../internal/platform';
+import { isComposing } from '../../internal/roving';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useFormReset } from '../../internal/use-form-reset';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+import { devWarn } from '../../internal/warn';
+import { withDefaults } from '../../internal/with-defaults';
+import { IconButton } from '../icon-button/IconButton';
+import { Input } from '../input/Input';
+import { TooltipContent, TooltipRoot, TooltipTrigger } from '../tooltip/Tooltip';
+import { useShortcut } from './shortcut';
+import type { Shortcut } from './shortcut';
+
+export interface SearchFieldLabels {
+  /** The name of the button that clears the text. */
+  clear: string;
+  /** The name of the button that opens a `collapsible` field. */
+  open: string;
+  /** The name of the button that closes it again on a narrow screen. */
+  close: string;
+  /** The text of the key hint. `apple` is true where the shortcut key is ⌘. */
+  shortcut: (shortcut: Shortcut, apple: boolean) => string;
+}
+
+export interface SearchFieldProps extends Omit<
+  InputHTMLAttributes<HTMLInputElement>,
+  'size' | 'type' | 'value' | 'defaultValue'
+> {
+  /** The text. Pass it with `onValueChange` to control it. */
+  value?: string;
+  /** The text at first, when uncontrolled. Also what a form reset puts back. */
+  defaultValue?: string;
+  /** Called with the text whenever it changes: typed, cleared with the button or with Esc. */
+  onValueChange?: (value: string) => void;
+  size?: 'sm' | 'md' | 'lg';
+  /** Marks the value as wrong. Inside a Field with an error this is already true. */
+  invalid?: boolean;
+  /** A key that focuses the field from anywhere on the page: `"/"`, or `"mod+k"` (⌘K, Ctrl K). */
+  shortcut?: Shortcut;
+  /** Rests as a button with a tooltip, and opens as the field. */
+  collapsible?: boolean;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<SearchFieldLabels>;
+}
+
+const DEFAULT_LABELS: SearchFieldLabels = {
+  clear: 'Clear search',
+  open: 'Search',
+  close: 'Close search',
+  shortcut: (shortcut, apple) => (shortcut === '/' ? '/' : apple ? '⌘K' : 'Ctrl K'),
+};
+
+const NO_SUBSCRIPTION = () => () => undefined;
+
+/**
+ * Whether the page runs on an Apple system, or `undefined` while that is not known: on the server and
+ * in the render that hydrates the HTML from it. The browser says it after that, so the text of a key
+ * hint that depends on it is the same on both and does not break the hydration (spec phase 5 §3.5).
+ */
+function useApplePlatform(): boolean | undefined {
+  return useSyncExternalStore(NO_SUBSCRIPTION, isApplePlatform, () => undefined);
+}
+
+const isShortcut = (value: unknown): value is Shortcut => value === '/' || value === 'mod+k';
+
+interface KbdProps {
+  shortcut: Shortcut;
+  labels: SearchFieldLabels;
+  apple: boolean | undefined;
+}
+
+/**
+ * The hint of the key. `⌘K` or `Ctrl K` is known only once the platform is: until then the key is
+ * there but empty and hidden, so the HTML from the server and the first render in the browser agree.
+ */
+function Kbd({ shortcut, labels, apple }: KbdProps) {
+  const text =
+    apple === undefined && shortcut === 'mod+k' ? '' : labels.shortcut(shortcut, !!apple);
+  return (
+    <kbd className="flg-search-field-kbd" aria-hidden="true" hidden={text === ''}>
+      {text}
+    </kbd>
+  );
+}
+
+/** The value of `aria-keyshortcuts`, or `undefined` while the platform is not known. */
+function keyShortcuts(shortcut: Shortcut | undefined, apple: boolean | undefined) {
+  if (shortcut === '/') return '/';
+  if (shortcut === 'mod+k' && apple !== undefined) return apple ? 'Meta+K' : 'Control+K';
+  return undefined;
+}
+
+/**
+ * A search field: a text input of type `search` with a magnifier, a button that clears it, and, with
+ * `shortcut`, a key that focuses it from anywhere on the page. With `collapsible` it rests as a
+ * button that opens it. It is a form control like `Input`: `className` and `style` go on the root,
+ * every other prop on `<input>`, which is what `ref` points to.
+ */
+export const SearchField = markAsFieldControl(
+  forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
+    {
+      value,
+      defaultValue,
+      onValueChange,
+      size,
+      shortcut: shortcutProp,
+      collapsible = false,
+      labels: labelsProp,
+      className,
+      style,
+      onChange,
+      onKeyDown,
+      ...props
+    },
+    ref,
+  ) {
+    const field = useFieldContext();
+    const disabled = Boolean(props.disabled ?? field?.disabled);
+    const inactive = disabled || Boolean(props.readOnly);
+    const labels = withDefaults(DEFAULT_LABELS, labelsProp);
+    const shortcut = isShortcut(shortcutProp) ? shortcutProp : undefined;
+    useEffect(() => {
+      if (shortcutProp !== undefined && shortcut === undefined) {
+        devWarn('<SearchField> shortcut must be "/" or "mod+k"; it is ignored.');
+      }
+    }, [shortcutProp, shortcut]);
+    const apple = useApplePlatform();
+
+    const [current, setValue, resetValue] = useControllableState<string>({
+      value,
+      defaultValue: defaultValue ?? '',
+      onChange: onValueChange,
+      name: 'SearchField value',
+    });
+    const empty = current === '';
+
+    const inputRef = useRef<HTMLInputElement>(null);
+    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
+    const buttonRef = useRef<HTMLButtonElement>(null);
+    const defaultRef = useRef(defaultValue);
+    useWriteOnCommit(() => {
+      defaultRef.current = defaultValue;
+    });
+    // The form resets the input behind React's back; put the text back, so the clear button follows.
+    useFormReset(inputRef, () => resetValue(defaultRef.current ?? ''), props.form);
+
+    // The name of the field, once it is in the DOM: a label that points at it counts, and only the
+    // DOM knows that (a Field's label is its own element). A placeholder is not a name.
+    const named = Boolean(props['aria-label']?.trim()) || Boolean(props['aria-labelledby']?.trim());
+    useEffect(() => {
+      if (named || (inputRef.current?.labels?.length ?? 0) > 0) return;
+      devWarn(
+        '<SearchField> needs a name: a Field label or aria-label. A placeholder is not a name.',
+      );
+    }, [named]);
+
+    // H3: whether the field is open. Not controlled (spec phase 5 §6.3). Where focus goes when the
+    // state changes is decided by whoever changed it, and done once the element is there.
+    const [open, setOpen] = useState(false);
+    const isOpen = collapsible && open;
+    const focusAfter = useRef<'input' | 'select' | 'button' | null>(null);
+    useIsoLayoutEffect(() => {
+      const target = focusAfter.current;
+      focusAfter.current = null;
+      if (target === 'button') {
+        buttonRef.current?.focus();
+      } else if (target !== null) {
+        inputRef.current?.focus();
+        if (target === 'select') inputRef.current?.select();
+      }
+    }, [isOpen]);
+
+    const clear = () => {
+      setValue('');
+      inputRef.current?.focus();
+    };
+    const close = (focusButton: boolean) => {
+      if (focusButton) focusAfter.current = 'button';
+      setOpen(false);
+    };
+
+    // The shortcut opens a collapsed field, then focuses it and selects the text, which the next key
+    // replaces. A field that cannot be typed into does not take the key.
+    useShortcut(
+      shortcut,
+      () => {
+        if (collapsible && !open) {
+          focusAfter.current = 'select';
+          setOpen(true);
+        } else {
+          inputRef.current?.focus();
+          inputRef.current?.select();
+        }
+        return true;
+      },
+      !inactive,
+    );
+
+    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
+      // Esc during an input method's composition cancels the candidate, not the text.
+      if (event.key !== 'Escape' || isComposing(event)) return;
+      // The text first, then the field: and a Dialog around it stays open for both. A field that is
+      // not collapsible, and empty, leaves Esc to whoever is around it.
+      if (!empty) {
+        event.preventDefault();
+        clear();
+      } else if (collapsible) {
+        event.preventDefault();
+        close(true);
+      }
+    };
+
+    // An empty field that has lost the focus closes. `relatedTarget` is where the focus went; it is
+    // null for a click on the page and for a window that lost the focus, and only in the second the
+    // field keeps being the active element.
+    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
+      if (!isOpen || !empty) return;
+      const root = event.currentTarget;
+      if (root.contains(event.relatedTarget) || root.contains(document.activeElement)) return;
+      close(false);
+    };
+
+    const hint = shortcut !== undefined && empty;
+    const keyshortcuts = props['aria-keyshortcuts'] ?? keyShortcuts(shortcut, apple);
+
+    return (
+      <div
+        className={clsx('flg-search-field', className)}
+        style={style}
+        data-collapsible={dataAttr(collapsible)}
+        data-open={dataAttr(isOpen)}
+        onBlur={handleBlur}
+      >
+        {collapsible && !isOpen ? (
+          <TooltipRoot describe={false}>
+            <TooltipTrigger>
+              <IconButton
+                ref={buttonRef}
+                variant="ghost"
+                aria-label={labels.open}
+                aria-keyshortcuts={keyshortcuts}
+                disabled={disabled}
+                onClick={() => {
+                  focusAfter.current = 'input';
+                  setOpen(true);
+                }}
+              >
+                <SearchIcon />
+              </IconButton>
+            </TooltipTrigger>
+            <TooltipContent side="bottom" align="center" sideOffset={8}>
+              {labels.open}
+              {shortcut !== undefined ? (
+                <Kbd shortcut={shortcut} labels={labels} apple={apple} />
+              ) : null}
+            </TooltipContent>
+          </TooltipRoot>
+        ) : null}
+        {isOpen ? (
+          <IconButton
+            variant="ghost"
+            className="flg-search-field-back"
+            aria-label={labels.close}
+            onClick={() => close(true)}
+          >
+            <ArrowIcon direction="left" />
+          </IconButton>
+        ) : null}
+        <Input
+          {...props}
+          ref={mergedRef}
+          type="search"
+          size={size === 'sm' || size === 'lg' ? size : 'md'}
+          value={current}
+          aria-keyshortcuts={keyshortcuts}
+          onChange={composeEventHandlers(onChange, (event: ChangeEvent<HTMLInputElement>) =>
+            setValue(event.target.value),
+          )}
+          onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
+          startContent={<SearchIcon />}
+          endContent={
+            !empty && !inactive ? (
+              <button
+                type="button"
+                className="flg-search-field-clear"
+                aria-label={labels.clear}
+                onClick={clear}
+              >
+                <CloseIcon />
+              </button>
+            ) : hint ? (
+              <Kbd shortcut={shortcut} labels={labels} apple={apple} />
+            ) : null
+          }
+        />
+      </div>
+    );
+  }),
+);
diff --git a/src/components/search-field/index.ts b/src/components/search-field/index.ts
new file mode 100644
index 0000000..c16471b
--- /dev/null
+++ b/src/components/search-field/index.ts
@@ -0,0 +1,2 @@
+export { SearchField } from './SearchField';
+export type { SearchFieldLabels, SearchFieldProps } from './SearchField';
diff --git a/src/components/search-field/shortcut.ts b/src/components/search-field/shortcut.ts
new file mode 100644
index 0000000..e9a5571
--- /dev/null
+++ b/src/components/search-field/shortcut.ts
@@ -0,0 +1,71 @@
+import { useEffect, useRef } from 'react';
+import { isEditable } from '../../internal/editable';
+import { isApplePlatform } from '../../internal/platform';
+import { hasModifier, isComposing } from '../../internal/roving';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+
+/** The keys a SearchField can take: the slash, or K with the modifier of the platform (⌘ or Ctrl). */
+export type Shortcut = '/' | 'mod+k';
+
+/**
+ * Whether the key event is `shortcut` on this platform. The slash allows Shift, since some keyboards
+ * type "/" with it, and no other modifier. `mod+k` is K with exactly the modifier of the platform
+ * (Meta on Apple, Ctrl elsewhere): K with another one is another shortcut.
+ */
+export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut, apple: boolean): boolean {
+  if (shortcut === '/') return event.key === '/' && !hasModifier(event);
+  return (
+    event.key.toLowerCase() === 'k' &&
+    !event.shiftKey &&
+    !event.altKey &&
+    (apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey)
+  );
+}
+
+/**
+ * The fields that hold each shortcut, in the order they were mounted. Page-wide on purpose: one key
+ * has one owner, and when two fields ask for it the one mounted last takes it (spec phase 5 §6.3).
+ */
+const claims: Record<Shortcut, object[]> = { '/': [], 'mod+k': [] };
+
+/**
+ * Listens on the document for `shortcut` while `enabled`. `onMatch` is called for the key when this is
+ * the field that holds it, and returns whether it took the key: then the key is prevented, so no "/"
+ * is typed and the browser's own `Ctrl K` is not run. A key pressed where the user types (this field
+ * included), one that something else prevented and one that an input method owns are left alone.
+ */
+export function useShortcut(
+  shortcut: Shortcut | undefined,
+  onMatch: () => boolean,
+  enabled: boolean,
+): void {
+  const latest = useRef(onMatch);
+  useWriteOnCommit(() => {
+    latest.current = onMatch;
+  });
+  useEffect(() => {
+    if (shortcut === undefined || !enabled) return;
+    const self = {};
+    const holders = claims[shortcut];
+    holders.push(self);
+    const onKeyDown = (event: KeyboardEvent) => {
+      if (
+        typeof event.key !== 'string' ||
+        event.defaultPrevented ||
+        isComposing({ nativeEvent: event }) ||
+        holders[holders.length - 1] !== self ||
+        !matchesShortcut(event, shortcut, isApplePlatform()) ||
+        // `target` is the host of a shadow tree at the document; the path starts at the real target.
+        isEditable(event.composedPath()[0] ?? event.target ?? undefined)
+      ) {
+        return;
+      }
+      if (latest.current()) event.preventDefault();
+    };
+    document.addEventListener('keydown', onKeyDown);
+    return () => {
+      document.removeEventListener('keydown', onKeyDown);
+      holders.splice(holders.indexOf(self), 1);
+    };
+  }, [shortcut, enabled]);
+}
diff --git a/src/components/toast/Toaster.tsx b/src/components/toast/Toaster.tsx
index cf5574e..45e1722 100644
--- a/src/components/toast/Toaster.tsx
+++ b/src/components/toast/Toaster.tsx
@@ -14,6 +14,7 @@ import {
 import type { FocusEvent, HTMLAttributes, KeyboardEvent } from 'react';
 import { createPortal } from 'react-dom';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { isEditable } from '../../internal/editable';
 import { returnFocus } from '../../internal/focus';
 import { CloseIcon, STATUS_WORDS, StatusIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
@@ -66,27 +67,6 @@ export interface ToasterProps extends Omit<
   className?: string;
 }
 
-// An input that takes no text is no place for typing: a letter pressed on one is a hotkey.
-const TEXT_INPUT = [
-  'checkbox',
-  'radio',
-  'button',
-  'range',
-  'color',
-  'file',
-  'submit',
-  'reset',
-  'image',
-]
-  .map((type) => `:not([type="${type}" i])`)
-  .join('');
-const EDITABLE = `input${TEXT_INPUT}, textarea, select, [contenteditable]:not([contenteditable="false"])`;
-
-/** True for a target the user types into, or a descendant of one. */
-function isEditable(target: EventTarget | undefined): boolean {
-  return target instanceof Element && target.closest(EDITABLE) !== null;
-}
-
 const DEFAULT_LABELS: ToasterLabels = {
   region: 'Notifications',
   dismiss: 'Dismiss notification',
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index a2d8686..824a387 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -63,8 +63,9 @@ application's responsibility.
 The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22),
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
-9, 12 and 22), AppShell (its part in rows 2 and 6) and Nav (row 35, and its part in rows 2, 6, 7, 8,
-12, 14, 29 and 32) are in the table above, which is built from the same data CI checks.
+9, 12 and 22), AppShell (its part in rows 2 and 6), Nav (row 35, and its part in rows 2, 6, 7, 8,
+12, 14, 29 and 32) and SearchField (row 36) are in the table above, which is built from the same
+data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
diff --git a/src/index.ts b/src/index.ts
index bec7207..2ff2991 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -290,3 +290,5 @@ export type {
   NavSectionProps,
   NavVariant,
 } from './components/nav';
+export { SearchField } from './components/search-field';
+export type { SearchFieldLabels, SearchFieldProps } from './components/search-field';
diff --git a/src/internal/editable.ts b/src/internal/editable.ts
new file mode 100644
index 0000000..f3e6165
--- /dev/null
+++ b/src/internal/editable.ts
@@ -0,0 +1,23 @@
+// An input that takes no text is no place for typing: a letter pressed on one is a hotkey.
+const TEXT_INPUT = [
+  'checkbox',
+  'radio',
+  'button',
+  'range',
+  'color',
+  'file',
+  'submit',
+  'reset',
+  'image',
+]
+  .map((type) => `:not([type="${type}" i])`)
+  .join('');
+const EDITABLE = `input${TEXT_INPUT}, textarea, select, [contenteditable]:not([contenteditable="false"])`;
+
+/**
+ * True for a target the user types into, or a descendant of one. A key that is a letter or a symbol
+ * (the Toaster's hotkey, the shortcut of a SearchField) must not take what the user types.
+ */
+export function isEditable(target: EventTarget | undefined): boolean {
+  return target instanceof Element && target.closest(EDITABLE) !== null;
+}
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index 0d77a5c..2f56bcc 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -97,14 +97,15 @@ export function ChevronIcon({
   );
 }
 
-export type ArrowDirection = 'up' | 'down';
+export type ArrowDirection = 'up' | 'down' | 'left';
 
 const ARROW_PATHS: Record<ArrowDirection, readonly [string, string]> = {
   down: ['M12 5v14', 'm19 12-7 7-7-7'],
   up: ['M12 19V5', 'm5 12 7-7 7 7'],
+  left: ['M19 12H5', 'm12 19-7-7 7-7'],
 };
 
-/** An arrow up or down: the sort direction in the heading of a Table column. */
+/** An arrow up or down (the sort direction in the heading of a Table column) or left (the back button of a SearchField). */
 export function ArrowIcon({
   direction,
   ...props
@@ -153,6 +154,16 @@ export function StatusIcon({
   );
 }
 
+/** A magnifying glass, for a search field. */
+export function SearchIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <circle cx="11" cy="11" r="7" />
+      <path d="m20 20-3.5-3.5" />
+    </svg>
+  );
+}
+
 /** A minus sign. */
 export function MinusIcon(props: SVGProps<SVGSVGElement>) {
   return (
diff --git a/src/internal/platform.ts b/src/internal/platform.ts
new file mode 100644
index 0000000..24b25fa
--- /dev/null
+++ b/src/internal/platform.ts
@@ -0,0 +1,17 @@
+/** What `navigator.userAgentData` has, in the browsers that have it; not in the DOM typings yet. */
+interface NavigatorWithUserAgentData {
+  userAgentData?: { platform?: string };
+}
+
+/**
+ * Whether the page runs on an Apple system, where the shortcut key is ⌘ and not Ctrl. It reads the
+ * browser, which the server cannot, so a component calls it after it has mounted and shows the
+ * server's text until then (spec phase 5 §3.5). The match ignores case: `userAgentData` says "macOS",
+ * `navigator.platform` says "MacIntel".
+ */
+export function isApplePlatform(): boolean {
+  if (typeof navigator === 'undefined') return false;
+  const platform =
+    (navigator as NavigatorWithUserAgentData).userAgentData?.platform || navigator.platform || '';
+  return /mac|iphone|ipad|ipod/i.test(platform);
+}
diff --git a/src/styles/components/search-field.css b/src/styles/components/search-field.css
new file mode 100644
index 0000000..be0139b
--- /dev/null
+++ b/src/styles/components/search-field.css
@@ -0,0 +1,180 @@
+/* SearchField (spec phase 5 §4.3, mockup H2 and H3): the frame is an Input, and this is what a search
+   adds to it: the key hint, the clear button, and, with `collapsible`, the button that rests in its
+   place and the overlay of a narrow header. */
+@layer flg.components {
+  .flg-search-field {
+    display: flex;
+    align-items: center;
+    gap: 4px;
+    box-sizing: border-box;
+    min-width: 0;
+  }
+  /* The field takes what the root leaves; a root in a flex row is sized by its own rules below. */
+  .flg-search-field > .flg-input {
+    flex: 1 1 auto;
+  }
+  /* The input is a search input without the look the browser gives it: its own clear button (WebKit,
+     Chromium) and its magnifier. The library's button does that, and the same in every engine. */
+  .flg-search-field .flg-input > input[type='search'] {
+    appearance: none;
+    -webkit-appearance: none;
+  }
+  .flg-search-field .flg-input > input[type='search']::-webkit-search-cancel-button,
+  .flg-search-field .flg-input > input[type='search']::-webkit-search-decoration,
+  .flg-search-field .flg-input > input[type='search']::-webkit-search-results-button,
+  .flg-search-field .flg-input > input[type='search']::-webkit-search-results-decoration {
+    display: none;
+    -webkit-appearance: none;
+  }
+  /* The end cell is 5px closer to the edge than the padding of the frame, as the mockup draws it. */
+  .flg-search-field .flg-input > .flg-input-adornment:last-child {
+    margin-right: -5px;
+  }
+  /* An icon-only button of the field, the one that opens it and the one that closes it, has an icon of
+     18px, as in the header of the mockup (in a header the rule of the AppShell says the same). */
+  .flg-search-field > .flg-button[data-icon-only] {
+    --flg-button-icon: 18px;
+    flex: none;
+  }
+
+  .flg-search-field-kbd {
+    display: inline-flex;
+    align-items: center;
+    box-sizing: border-box;
+    height: 20px;
+    padding: 0 6px;
+    border: 1px solid var(--flg-control-border);
+    border-radius: var(--flg-radius-xs);
+    background: var(--flg-control-bg-secondary);
+    color: var(--flg-text-muted);
+    font: var(--flg-weight-medium) var(--flg-text-2xs) / 1 var(--flg-font-sans);
+    letter-spacing: 0.02em;
+    white-space: nowrap;
+  }
+  /* Until the platform is known the key is empty and hidden; `display` above would show it. */
+  .flg-search-field-kbd[hidden] {
+    display: none;
+  }
+  .flg-tooltip .flg-search-field-kbd {
+    height: 16px;
+    margin-left: 6px;
+    padding: 0 4px;
+  }
+
+  .flg-search-field-clear {
+    display: inline-flex;
+    flex: none;
+    align-items: center;
+    justify-content: center;
+    box-sizing: border-box;
+    width: 20px;
+    height: 20px;
+    margin: 0;
+    padding: 0;
+    border: 0;
+    border-radius: var(--flg-radius-full);
+    background: none;
+    color: var(--flg-text-muted);
+    cursor: pointer;
+  }
+  .flg-search-field-clear > svg {
+    width: 14px;
+    height: 14px;
+  }
+  .flg-search-field-clear:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  @media (hover: hover) {
+    .flg-search-field-clear:hover {
+      background: var(--flg-control-track);
+      color: var(--flg-text);
+    }
+  }
+
+  /* `collapsible`: at rest the root holds the button alone, and the frame is out of the page until the
+     field opens. The button that closes the field is drawn only where it is needed (below). */
+  .flg-search-field[data-collapsible]:not([data-open]) {
+    display: inline-flex;
+  }
+  .flg-search-field[data-collapsible]:not([data-open]) > .flg-input {
+    display: none;
+  }
+  .flg-search-field > .flg-search-field-back {
+    display: none;
+  }
+
+  /* In the header of an AppShell (mockup H2: 280px, 4px off the brand; H3: a button that is as wide as
+     it is, and 300px when it opens, 6px off the next widget). */
+  .flg-app-shell-header .flg-search-field {
+    flex: 0 1 280px;
+    /* The width too: a wrapper around the field (the widgets at the end of the header) is as wide as
+       what is in it, and a flex basis is not what it measures. */
+    width: 280px;
+    margin-left: 4px;
+  }
+  .flg-app-shell-header .flg-search-field[data-collapsible] {
+    flex: none;
+    width: auto;
+    margin-left: 0;
+  }
+  .flg-app-shell-header .flg-search-field[data-collapsible][data-open] {
+    flex: 0 1 300px;
+    width: 300px;
+    margin: 0 6px 0 0;
+  }
+
+  /* Below 768px, which is the same width for every breakpoint of the shell (spec §3.2): the screen
+     is a phone's. One boundary, the narrow side written as the exception to the wide one. */
+  @media not all and (min-width: 768px) {
+    /* No key hint: a phone has no such key. The cell goes too, with its gap. */
+    .flg-search-field .flg-input-adornment:has(> .flg-search-field-kbd) {
+      display: none;
+    }
+    /* H2 takes what is left of the row and the name of the brand shrinks to its mark; the name stays
+       the name of the link (the technique of `flg-visually-hidden`). */
+    .flg-app-shell-header .flg-search-field:not([data-collapsible]) {
+      flex: 1 1 0%;
+      width: auto;
+      margin: 0 4px 0 2px;
+    }
+    .flg-app-shell-header:has(.flg-search-field:not([data-collapsible])) .flg-app-shell-brand-name {
+      position: absolute;
+      width: 1px;
+      height: 1px;
+      margin: -1px;
+      padding: 0;
+      overflow: hidden;
+      clip-path: inset(50%);
+      white-space: nowrap;
+      border: 0;
+    }
+    /* H3 open covers the row of the header, from the button that closes it to the edge. The rest of
+       the header goes out of sight and out of the accessibility tree and the Tab order, and the
+       field stays where it was in the DOM (a wrapper around it must have no `position`). */
+    .flg-app-shell-header:has(.flg-search-field[data-collapsible][data-open])
+      > :not(.flg-search-field) {
+      visibility: hidden;
+    }
+    /* A field of the header that is not the open one is part of the rest of it. */
+    .flg-app-shell-header:has(.flg-search-field[data-collapsible][data-open])
+      .flg-search-field:not([data-open]) {
+      visibility: hidden;
+    }
+    .flg-app-shell-header .flg-search-field[data-collapsible][data-open] {
+      position: absolute;
+      inset: 0;
+      width: auto;
+      margin: 0;
+      padding: 0 10px;
+      visibility: visible;
+    }
+    .flg-app-shell-header .flg-search-field[data-collapsible][data-open] > .flg-input {
+      margin: 0 4px 0 2px;
+    }
+    .flg-app-shell-header .flg-search-field > .flg-search-field-back {
+      display: inline-flex;
+    }
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 95c4f3c..be385d1 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -43,6 +43,7 @@
 @import './components/list.css';
 @import './components/table.css';
 @import './components/nav.css';
+@import './components/search-field.css';
 @import './components/app-shell.css';
 @import './generated/app-shell.css';
 @import './components/floating.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 8d274a7..a1c54f8 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -244,6 +244,12 @@
     .flg-input {
       border-color: CanvasText;
     }
+    /* The button that clears a SearchField is a button, and its colour is the one the system gives
+       buttons; the key hint is drawn by the system as it is (its border and text become CanvasText
+       by themselves). The button that closes the field is a Button (spec phase 5 §4.5). */
+    .flg-search-field-clear {
+      color: ButtonText;
+    }
     .flg-input:has(> input:disabled) {
       border-color: GrayText;
       color: GrayText;
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/search-field src/components/toast src/internal src/index.test.ts src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/search-field
pnpm vitest run --project storybook-dark src/components/search-field
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `pnpm gen:theme` in `Wrote src/styles/generated/theme.css, src/styles/generated/simulate.css and src/styles/generated/app-shell.css`; Plan C không thêm token, nên các file sinh không đổi.
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: PASS, 70 file (hai project React cộng lại, kể cả ba file test kiểu), không lỗi kiểu; `SearchField.test.tsx` có 54 test ở mỗi project; `ExceptionTable` đòi 36 dòng; test của Toaster pass như trước khi `isEditable` đổi chỗ. Báo cáo của bản nháp ghi 815 test trong 73 file cho lần chạy của nó, gồm các thư mục này và vài file khác.
- `scripts`: 130 test PASS (5 file).
- `pnpm check:contrast`: PASS (`Contrast check passed.`). `kbd-text` đo 7.15 light, 3.31 dark (ngoại lệ dòng 36), 7.83 light +, 7.63 dark +.
- Story search-field: 33 test PASS ở mỗi project (11 story × ba engine). axe chạy sau play function, không có vi phạm.
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy bốn lớp `flg-search-field…`; `check:use-client` có `SearchField.tsx`; `size`: JS 53.06 kB trên 57.29 kB, CSS 15.79 kB trên 17.04 kB. Không chạy `size:record`.
- `pnpm build-storybook`: PASS. `SearchField.mdx` thay trang autodocs (`components-searchfield--docs`); trong `storybook-static/index.json`, chỉ năm story giao diện của SearchField không gắn `no-visual` (135 story có ảnh).
- `pnpm check:docs-tables`: PASS.
- SearchField là component mới, các file dùng chung chỉ được thêm vào, và `isEditable` chỉ đổi chỗ (phát hiện 21), nên ảnh chuẩn của component cũ giữ nguyên.

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
  src/components/search-field/SearchField.mdx \
  src/components/search-field/SearchField.stories.tsx \
  src/components/search-field/SearchField.test-d.ts \
  src/components/search-field/SearchField.test.tsx \
  src/components/search-field/SearchField.tsx \
  src/components/search-field/index.ts \
  src/components/search-field/shortcut.test.tsx \
  src/components/search-field/shortcut.ts \
  src/components/toast/Toaster.tsx \
  src/docs/Accessibility.mdx \
  src/docs/ExceptionTable.test.tsx \
  src/index.test.ts \
  src/index.ts \
  src/internal/editable.test.ts \
  src/internal/editable.ts \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx \
  src/internal/platform.test.ts \
  src/internal/platform.ts \
  src/styles/components/search-field.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(search-field): add SearchField in its two looks, H2 and H3" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: `UserMenu` (U1, U2) và helper dải header của story

Spec §1 (dòng UserMenu), §3.1 (dòng UserMenu), §3.2 (dòng U), §3.6 (chevron của U2), §4.1 (u1, u2), §4.3 **UserMenu** và quy tắc của header cho nút `ghost` có popup đang mở, §4.4 (dòng 2 và 6 mở rộng; vòng của U1 không đo), §4.5 UserMenu, §5 (cảnh báo của UserMenu), §6.1, §6.3 `UserMenu`, §7 cho UserMenu, §8 `UserMenu.mdx`. Mockup u1, u2 (`phase-5-header.html`).
- **`UserMenu`** (client): nút tên `labels.trigger(name)` với avatar (U1) hay avatar, tên và chevron (U2, `showName`); menu `DropdownMenuContent` cách nút 17px; đầu menu là mô tả của menu; chữ cái đầu từ từ đầu và từ cuối (phát hiện 7).
- **CSS:** `user-menu.css` (U1 34px, vòng hover 3px, vòng "mở" 2px; U2 `min-width: 0`, tên tối đa 160px; menu 244px hay 230px; đầu menu); forced colors trong `preferences.css`.
- **Helper chung của story:** `Strip`, `HeaderWidgets`, `End`, `App`, `strips` chuyển từ `SearchField.stories.tsx` sang `.storybook/header-strip.tsx`, với khe `account`; prop `search` của `App` thành `header` (phát hiện 8).
- **Story:** `UserMenu`, `UserMenuShowName` (dải: nghỉ, hover, focus) và `UserMenuOpen`, `UserMenuShowNameOpen` (header AppShell thật) là story giao diện; `MenuKeys`, `HeaderIsTheDescription`, `MenuPlace`, `LongNameAndChevron`, `RingsInTheHeader` gắn `no-visual`.
- **Tương phản:** không có cặp mới; dòng 2 (nút của UserMenu và nút xoá của SearchField) và dòng 6 (dòng phụ của đầu menu) mở rộng.
- **`UserMenu.mdx`** thay trang autodocs (phát hiện 13). Spec §6.3 và spec 0+1 §4.9 được sửa (phát hiện 20).

**Files:**
- Create: `src/components/user-menu/UserMenu.tsx`, `index.ts`, `UserMenu.test.tsx`, `UserMenu.test-d.ts`, `UserMenu.stories.tsx`, `UserMenu.mdx`, `src/styles/components/user-menu.css`, `.storybook/header-strip.tsx`
- Modify: `src/components/search-field/SearchField.stories.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/contrast-exceptions.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/components/user-menu/UserMenu.tsx` (client), export qua `user-menu/index.ts` và `src/index.ts`:
  - `UserMenu`: `forwardRef<HTMLButtonElement, UserMenuProps>`; `ref`, `className`, `style` và mọi prop của nút vào nút.
  - `UserMenuLabels = { trigger: (name: string) => string }`, mặc định `` (name) => `Account: ${name}` ``.
  - `UserMenuProps = Omit<ButtonProps, 'children' | 'aria-label' | 'aria-labelledby' | 'asChild' | 'id'> & { name: string; description?: ReactNode; avatar?: Omit<AvatarProps, 'size'>; showName?: boolean; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; contentProps?: Omit<DropdownMenuContentProps, 'children'>; labels?: Partial<UserMenuLabels>; children: ReactNode }`. Mặc định `showName` `false`, `variant` `'ghost'`, `size` `'md'`.
- DOM: `DropdownMenuTrigger` là nút `.flg-user-menu` (`aria-label`, `data-show-name`, `data-icon-only` ở U1) > `Avatar` (`alt=""`, `md` ở U1, `sm` ở U2) [U2: `span.flg-user-menu-name`, `ChevronIcon.flg-user-menu-chevron`]. `DropdownMenuContent.flg-user-menu-content` (`side="bottom"`, `align="end"`, `sideOffset={17}`, ghi đè qua `contentProps`; `aria-describedby` = id của đầu menu rồi của `contentProps`; `data-show-name`) > `div.flg-user-menu-header[role="presentation"][id]` > `Avatar` (`lg` ở U1, `md` ở U2), `div.flg-user-menu-text` > `div.flg-user-menu-title`, `div.flg-user-menu-description` (khi `hasContent(description)`); rồi `MenuSeparator`, rồi `children`. Lớp của nút là `flg-user-menu`.
- Cảnh báo dev: `<UserMenu> needs a name: it is the name of the button and the first line of the menu.` (khi `name` rỗng hay chỉ có khoảng trắng; vẫn render).
- CSS: tám lớp `flg-user-menu`, `-name`, `-chevron`, `-content`, `-header`, `-text`, `-title`, `-description` (có trong `check-dist-css.ts`). `check-use-client.ts` thêm `src/components/user-menu/UserMenu.tsx`.
- `.storybook/header-strip.tsx`: `HeaderWidgets({ account? })`, `Strip({ caption, children?, end?, account? })` (dải kính 56px như mockup, `caption` là tên của trạng thái), `End({ children?, account? })` (cụm widget cuối header, không `position`, `minWidth: 0`), `App({ header, layout? })` (AppShell thật có `header` trong header), `strips` (cột 640px). Một khe `undefined` vẽ đồ giữ chỗ của mockup.
- Story: meta `title: 'Components/UserMenu'`; component được import là `Component`; id `components-usermenu--user-menu`, `--user-menu-open`, `--user-menu-show-name`, `--user-menu-show-name-open`.
- Consumes: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `MenuSeparator`, `Avatar`, `ChevronIcon`, `joinIds`, `hasContent`, `withDefaults`, `dataAttr`, `devWarn`; quy tắc nền "mở" của `.flg-app-shell-header` (Plan A).
- Task sau dùng: Task 3 vẽ `ThemeMenuGroup` trong một `UserMenu` đang mở, thêm khe `theme` vào helper và chuyển `PersonIcon`, `LogOutIcon` sang `.storybook/icons.tsx`; Task 4 thêm khe `bell`; trang Examples và hai fixture đặt `UserMenu` trong header.

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/header-strip.tsx b/.storybook/header-strip.tsx
new file mode 100644
index 0000000..00f1bc3
--- /dev/null
+++ b/.storybook/header-strip.tsx
@@ -0,0 +1,163 @@
+// The header of the phase 5 look stories (the widgets of the header of the mockup phase-5-header): a
+// strip drawn in the story, after the header strip of the mockup, one for each state, and an
+// AppShell for the states that need the real header. The widgets that a story is not about are
+// neutral placeholders, the same in every option, as the mockup draws them; a story puts the widget it
+// is about in their place.
+import type { CSSProperties, ReactNode, SVGProps } from 'react';
+import {
+  AppShell,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+} from '../src/components/app-shell/AppShell';
+import type { AppShellLayout } from '../src/components/app-shell/AppShell';
+import { Avatar } from '../src/components/avatar/Avatar';
+import { IconButton } from '../src/components/icon-button/IconButton';
+import { Surface } from '../src/components/surface/Surface';
+import { strokeIcon } from '../src/internal/icons';
+import { DemoBrand, DemoContent, DemoNav, DemoStyles } from './app-shell-demo';
+import { BellIcon } from './icons';
+
+function Sun(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <circle cx="12" cy="12" r="4" />
+      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
+    </svg>
+  );
+}
+
+function Menu(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M4 6h16M4 12h16M4 18h16" />
+    </svg>
+  );
+}
+
+/** The avatar button of the mockup, until a story puts the real UserMenu in its place. */
+const PLACEHOLDER_ACCOUNT = (
+  <IconButton
+    variant="ghost"
+    aria-label="Account"
+    style={{ borderRadius: 'var(--flg-radius-full)' }}
+  >
+    <Avatar alt="" fallback="MA" size="sm" />
+  </IconButton>
+);
+
+/** The widgets at the end of the header: the bell, the theme, and the account, `account` or a placeholder. */
+export function HeaderWidgets({ account = PLACEHOLDER_ACCOUNT }: { account?: ReactNode }) {
+  return (
+    <>
+      <IconButton variant="ghost" aria-label="Notifications">
+        <BellIcon />
+      </IconButton>
+      <IconButton variant="ghost" aria-label="Theme">
+        <Sun />
+      </IconButton>
+      {account}
+    </>
+  );
+}
+
+const mark: CSSProperties = {
+  flex: 'none',
+  width: 22,
+  height: 22,
+  borderRadius: 'var(--flg-radius-xs)',
+  background: 'var(--flg-accent-gradient)',
+};
+
+/**
+ * A strip like the header strip of the mockup (a glass bar, 56px high, a menu button and the brand
+ * at the start, the neutral widgets at the end), one for each state. Several bars cannot be a whole
+ * AppShell each, so they are drawn as in the page of the mockup (spec phase 5 §7); the stories that
+ * need the real header use an AppShell.
+ */
+export function Strip({
+  caption,
+  children,
+  end,
+  account,
+}: {
+  caption: string;
+  /** What stands between the brand and the end cluster. */
+  children?: ReactNode;
+  /** What stands in the end cluster, before the widgets. */
+  end?: ReactNode;
+  /** What stands in the place of the avatar button, the last widget. */
+  account?: ReactNode;
+}) {
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
+        <IconButton variant="ghost" aria-label="Open navigation">
+          <Menu />
+        </IconButton>
+        <span
+          style={{
+            display: 'inline-flex',
+            alignItems: 'center',
+            gap: 8,
+            margin: '0 10px 0 4px',
+            font: 'var(--flg-weight-semibold) var(--flg-text-md)/1 var(--flg-font-sans)',
+            color: 'var(--flg-text)',
+            whiteSpace: 'nowrap',
+          }}
+        >
+          <span style={mark} aria-hidden="true" />
+          Lumen
+        </span>
+        {children}
+        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
+          {end}
+          <HeaderWidgets account={account} />
+        </div>
+      </Surface>
+    </div>
+  );
+}
+
+/** The column of strips of a look story: 640px, as the strips of the mockup. */
+export const strips = { display: 'grid', gap: 14, width: 640 } as const;
+
+/** An application with `header` in its header. S2 (`header`) keeps the brand in the header at every width. */
+export const App = ({ header, layout }: { header: ReactNode; layout?: AppShellLayout }) => (
+  <>
+    <DemoStyles />
+    <AppShell brand={<DemoBrand />} layout={layout}>
+      <AppShellHeader>{header}</AppShellHeader>
+      <AppShellSidebar>
+        <DemoNav />
+      </AppShellSidebar>
+      <AppShellMain>
+        <DemoContent />
+      </AppShellMain>
+    </AppShell>
+  </>
+);
+
+/** The widgets that follow the search in the header, on the right: a cluster that has no `position`. */
+export const End = ({ children, account }: { children?: ReactNode; account?: ReactNode }) => (
+  // `minWidth: 0`: a wrapper is as wide as what is in it unless it may be narrower, and then the name
+  // of a UserMenu cannot give way in a header that is too narrow.
+  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', minWidth: 0 }}>
+    {children}
+    <HeaderWidgets account={account} />
+  </div>
+);
diff --git a/src/components/search-field/SearchField.stories.tsx b/src/components/search-field/SearchField.stories.tsx
index 28b39b7..f3c0fb5 100644
--- a/src/components/search-field/SearchField.stories.tsx
+++ b/src/components/search-field/SearchField.stories.tsx
@@ -1,19 +1,12 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
 import { useState } from 'react';
-import type { CSSProperties, ReactNode, SVGProps } from 'react';
+import type { CSSProperties } from 'react';
 import { expect, userEvent, waitFor, within } from 'storybook/test';
-import { DemoBrand, DemoContent, DemoNav, DemoStyles } from '../../../.storybook/app-shell-demo';
-import { BellIcon } from '../../../.storybook/icons';
+import { App, End, Strip, strips } from '../../../.storybook/header-strip';
 import { paintedPixels } from '../../../.storybook/painted-pixel';
 import { realUserEvent, settled } from '../../../.storybook/real-input';
 import { withViewport } from '../../../.storybook/viewport';
-import { strokeIcon } from '../../internal/icons';
 import { isApplePlatform } from '../../internal/platform';
-import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from '../app-shell/AppShell';
-import type { AppShellLayout } from '../app-shell/AppShell';
-import { Avatar } from '../avatar/Avatar';
-import { IconButton } from '../icon-button/IconButton';
-import { Surface } from '../surface/Surface';
 import { SearchField } from './SearchField';
 import type { SearchFieldProps } from './SearchField';
 
@@ -30,111 +23,6 @@ type Story = StoryObj<typeof meta>;
 // "Ctrl K": the stories fix the text, so what is compared is the look.
 const APPLE_KEY: SearchFieldProps['labels'] = { shortcut: () => '⌘K' };
 
-/** The widgets of the header of the mockup that the question is not about: drawn neutral, the same in every option. */
-function Sun(props: SVGProps<SVGSVGElement>) {
-  return (
-    <svg {...strokeIcon} {...props}>
-      <circle cx="12" cy="12" r="4" />
-      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
-    </svg>
-  );
-}
-function Menu(props: SVGProps<SVGSVGElement>) {
-  return (
-    <svg {...strokeIcon} {...props}>
-      <path d="M4 6h16M4 12h16M4 18h16" />
-    </svg>
-  );
-}
-
-const WIDGETS = (
-  <>
-    <IconButton variant="ghost" aria-label="Notifications">
-      <BellIcon />
-    </IconButton>
-    <IconButton variant="ghost" aria-label="Theme">
-      <Sun />
-    </IconButton>
-    <IconButton
-      variant="ghost"
-      aria-label="Account"
-      style={{ borderRadius: 'var(--flg-radius-full)' }}
-    >
-      <Avatar alt="" fallback="MA" size="sm" />
-    </IconButton>
-  </>
-);
-
-const mark: CSSProperties = {
-  flex: 'none',
-  width: 22,
-  height: 22,
-  borderRadius: 'var(--flg-radius-xs)',
-  background: 'var(--flg-accent-gradient)',
-};
-
-/**
- * A strip like the header strip of the mockup (a glass bar, 56px high, a menu button and the brand
- * at the start, the neutral widgets at the end), one for each state. Several bars cannot be a whole
- * AppShell each, so they are drawn as in the page of the mockup (spec phase 5 §7); the stories that
- * need the real header use an AppShell.
- */
-function Strip({
-  caption,
-  children,
-  end,
-}: {
-  caption: string;
-  /** What stands between the brand and the end cluster. */
-  children?: ReactNode;
-  /** What stands in the end cluster, before the widgets. */
-  end?: ReactNode;
-}) {
-  return (
-    <div style={{ display: 'grid', gap: 6 }}>
-      <span style={{ fontSize: 'var(--flg-text-xs)', color: 'var(--flg-text)' }}>{caption}</span>
-      <Surface
-        style={
-          {
-            display: 'flex',
-            alignItems: 'center',
-            gap: 4,
-            height: 56,
-            minWidth: 0,
-            padding: '0 10px 0 8px',
-            boxSizing: 'border-box',
-            '--flg-button-icon': '18px',
-          } as CSSProperties
-        }
-      >
-        <IconButton variant="ghost" aria-label="Open navigation">
-          <Menu />
-        </IconButton>
-        <span
-          style={{
-            display: 'inline-flex',
-            alignItems: 'center',
-            gap: 8,
-            margin: '0 10px 0 4px',
-            font: 'var(--flg-weight-semibold) var(--flg-text-md)/1 var(--flg-font-sans)',
-            color: 'var(--flg-text)',
-            whiteSpace: 'nowrap',
-          }}
-        >
-          <span style={mark} aria-hidden="true" />
-          Lumen
-        </span>
-        {children}
-        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
-          {end}
-          {WIDGETS}
-        </div>
-      </Surface>
-    </div>
-  );
-}
-
-const strips = { display: 'grid', gap: 14, width: 640 } as const;
 /** The field of H2 in the strip: 280px, 2px off the gap that follows the brand. */
 const H2_BOX: CSSProperties = { width: 280, marginLeft: 2 };
 /** H3 open: 300px, 6px off the widget that follows. */
@@ -162,37 +50,13 @@ export const SearchFieldDefault: Story = {
   },
 };
 
-/** An application with the search in its header. S2 (`header`) keeps the brand in the header at every width. */
-const App = ({ search, layout }: { search: ReactNode; layout?: AppShellLayout }) => (
-  <>
-    <DemoStyles />
-    <AppShell brand={<DemoBrand />} layout={layout}>
-      <AppShellHeader>{search}</AppShellHeader>
-      <AppShellSidebar>
-        <DemoNav />
-      </AppShellSidebar>
-      <AppShellMain>
-        <DemoContent />
-      </AppShellMain>
-    </AppShell>
-  </>
-);
-
-/** The widgets that follow the search in the header, on the right: a cluster that has no `position`. */
-const End = ({ children }: { children?: ReactNode }) => (
-  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
-    {children}
-    {WIDGETS}
-  </div>
-);
-
 /** H2 on a phone, in a real AppShell: the field shrinks to the room that is left, with no key hint, and the brand keeps its mark only. */
 export const SearchFieldDefaultPhone: Story = {
   tags: ['viewport-360x640'],
   parameters: { stage: 'page' },
   render: (args) => (
     <App
-      search={
+      header={
         <>
           <SearchField {...args} shortcut="mod+k" labels={APPLE_KEY} />
           <End />
@@ -248,7 +112,7 @@ export const SearchFieldCollapsiblePhone: Story = {
   parameters: { stage: 'page' },
   render: (args) => (
     <App
-      search={
+      header={
         <End>
           <SearchField {...args} collapsible shortcut="mod+k" labels={APPLE_KEY} />
         </End>
@@ -438,7 +302,7 @@ export const InTheHeader: Story = {
   render: (args) => (
     <App
       layout="header"
-      search={
+      header={
         <>
           <SearchField {...args} aria-label="Docs" shortcut="/" />
           <End>
@@ -569,7 +433,7 @@ export const FocusRings: Story = {
   parameters: { stage: 'page' },
   render: (args) => (
     <App
-      search={
+      header={
         <>
           <SearchField {...args} aria-label="Docs" defaultValue="abc" />
           <End>
diff --git a/src/components/user-menu/UserMenu.stories.tsx b/src/components/user-menu/UserMenu.stories.tsx
new file mode 100644
index 0000000..69f533b
--- /dev/null
+++ b/src/components/user-menu/UserMenu.stories.tsx
@@ -0,0 +1,412 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import type { SVGProps } from 'react';
+import { expect, waitFor, within } from 'storybook/test';
+import { GearIcon } from '../../../.storybook/icons';
+import { App, End, Strip, strips } from '../../../.storybook/header-strip';
+import { realUserEvent, settled } from '../../../.storybook/real-input';
+import { withViewport } from '../../../.storybook/viewport';
+import { strokeIcon } from '../../internal/icons';
+import { MenuItem, MenuSeparator } from '../menu/Menu';
+// Named for what it is in the stories: the story called `UserMenu` is the look of the button.
+import { UserMenu as Component } from './UserMenu';
+
+function PersonIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <circle cx="12" cy="8" r="4" />
+      <path d="M4 21a8 8 0 0 1 16 0" />
+    </svg>
+  );
+}
+function LogOutIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
+      <path d="m16 17 5-5-5-5" />
+      <path d="M21 12H9" />
+    </svg>
+  );
+}
+
+const icon = { width: 15, height: 15 };
+
+/** The items of the menu of the mockup: Profile, Settings, a rule, Log out. */
+const ITEMS = (
+  <>
+    <MenuItem icon={<PersonIcon {...icon} />}>Profile</MenuItem>
+    <MenuItem icon={<GearIcon {...icon} />}>Settings</MenuItem>
+    <MenuSeparator />
+    <MenuItem icon={<LogOutIcon {...icon} />}>Log out</MenuItem>
+  </>
+);
+
+const meta = {
+  title: 'Components/UserMenu',
+  component: Component,
+  // "MA" is what the mockup draws for this name: the initials of its first and last word would be "MN".
+  args: {
+    name: 'Minh Anh Nguyen',
+    description: 'minhanh@lumen.vn',
+    avatar: { fallback: 'MA' },
+    children: ITEMS,
+  },
+} satisfies Meta<typeof Component>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** The name of the button of every story: made from the name above. */
+const ACCOUNT = { name: 'Account: Minh Anh Nguyen' };
+
+/**
+ * The states of the button in the header strip of the mockup, one strip each: at rest, under the pointer
+ * (the harness hovers the button marked `data-visual-hover`) and with the focus of the keyboard, which
+ * the play function sets. The open state is the next story.
+ */
+const buttonStates: Story['render'] = (args) => (
+  <div style={strips}>
+    <Strip caption="At rest" account={<Component {...args} />} />
+    <Strip
+      caption={
+        args.showName
+          ? 'Under the pointer: the fill of a ghost button'
+          : 'Under the pointer: a gray ring of 3px around the avatar'
+      }
+      account={<Component {...args} data-visual-hover="" />}
+    />
+    <Strip caption="Keyboard focus" account={<Component {...args} />} />
+  </div>
+);
+
+const focusTheLast: Story['play'] = async ({ canvasElement }) => {
+  const buttons = within(canvasElement).getAllByRole('button', ACCOUNT);
+  buttons[2]!.focus();
+  await expect(buttons[2]).toHaveFocus();
+};
+
+/**
+ * U1: the avatar alone, in a round button of 34px. Under the pointer it has no fill but a gray ring;
+ * with the keyboard focus, the ring of the focus.
+ */
+export const UserMenu: Story = {
+  render: buttonStates,
+  play: focusTheLast,
+};
+
+/**
+ * U1 with the menu open: the accent ring on the button, and the menu 17px below it, lined up with its end.
+ * Drawn in a real AppShell header: the fill of an open ghost button is a rule of the header, which the ring
+ * of U1 has to win over, and a strip would not show that.
+ */
+export const UserMenuOpen: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: { stage: 'page' },
+  render: (args) => <App header={<End account={<Component {...args} defaultOpen />} />} />,
+  play: async ({ canvasElement }) => {
+    await settled(within(canvasElement).getByRole('menu'));
+  },
+};
+
+/**
+ * U2: the avatar, the name and a chevron, in a round ghost button. Under the pointer and open it has the
+ * fill of a ghost button, and the chevron turns while it is open.
+ */
+export const UserMenuShowName: Story = {
+  args: { showName: true },
+  render: buttonStates,
+  play: focusTheLast,
+};
+
+/** U2 with the menu open, in a real header: the fill stays, the chevron points up, and the menu is narrower. */
+export const UserMenuShowNameOpen: Story = {
+  args: { showName: true },
+  tags: ['viewport-1280x720'],
+  parameters: { stage: 'page' },
+  render: UserMenuOpen.render,
+  play: UserMenuOpen.play,
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it.
+
+const isOpen = (menu: HTMLElement) => menu.matches(':popover-open');
+
+/**
+ * The keys of the menu, with trusted input (Esc closes a popover only for a key the browser trusts): Enter,
+ * Space and ↓ open it on the first item, ↑ on the last, and Esc closes it and puts the focus back on the
+ * button. The header is not an item: ↓ goes past it and ↑ from the first item goes round to the last.
+ */
+export const MenuKeys: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'viewport' },
+  render: (args) => (
+    <div style={strips}>
+      <Strip caption="Keys" account={<Component {...args} />} />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    const button = canvas.getByRole('button', ACCOUNT);
+    const menu = canvas.getByRole('menu', { hidden: true });
+    const item = (label: string) => canvas.getByRole('menuitem', { name: label });
+    const closed = () => waitFor(() => expect(isOpen(menu)).toBe(false));
+    const opened = () => waitFor(() => expect(isOpen(menu)).toBe(true));
+
+    for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
+      button.focus();
+      await real.keyboard(key);
+      await opened();
+      await waitFor(() => expect(item('Profile')).toHaveFocus());
+      await real.keyboard('{Escape}');
+      await closed();
+      await expect(button).toHaveFocus();
+    }
+
+    button.focus();
+    await real.keyboard('{ArrowUp}');
+    await opened();
+    await waitFor(() => expect(item('Log out')).toHaveFocus());
+    await real.keyboard('{ArrowUp}');
+    await expect(item('Settings')).toHaveFocus();
+    await real.keyboard('{ArrowUp}');
+    await expect(item('Profile')).toHaveFocus();
+    // The header is in the menu but not among the items: the keys go round past it.
+    await real.keyboard('{ArrowUp}');
+    await expect(item('Log out')).toHaveFocus();
+    await real.keyboard('{ArrowDown}');
+    await expect(item('Profile')).toHaveFocus();
+    await real.keyboard('{Escape}');
+    await closed();
+    await expect(button).toHaveFocus();
+  },
+};
+
+/**
+ * The header is not a menu item: it has no role of one, takes no focus (a click on it leaves the menu
+ * open, with the focus on the menu), and it is the description of the menu, so a screen reader reads the
+ * name and the line under it when the menu opens. A `contentProps` description is read after it.
+ */
+export const HeaderIsTheDescription: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'viewport' },
+  render: (args) => (
+    <div style={strips}>
+      <p id="signed-in">Signed in with SSO</p>
+      <Strip
+        caption="Header"
+        account={<Component {...args} contentProps={{ 'aria-describedby': 'signed-in' }} />}
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    const menu = canvas.getByRole('menu', { hidden: true });
+    await real.click(canvas.getByRole('button', ACCOUNT));
+    await waitFor(() => expect(isOpen(menu)).toBe(true));
+    await expect(menu).toHaveAccessibleDescription(
+      'Minh Anh Nguyen minhanh@lumen.vn Signed in with SSO',
+    );
+
+    const header = menu.querySelector<HTMLElement>('.flg-user-menu-header')!;
+    await expect(canvas.getAllByRole('menuitem').map((el) => el.textContent)).toEqual([
+      'Profile',
+      'Settings',
+      'Log out',
+    ]);
+    header.focus();
+    await expect(header).not.toHaveFocus();
+    await real.click(header);
+    await expect(isOpen(menu)).toBe(true);
+    await expect(header).not.toHaveFocus();
+    await expect(menu.contains(document.activeElement)).toBe(true);
+  },
+};
+
+/**
+ * Where the menu is, in px: 17px below the button (6px below a header of 56px) and lined up with the
+ * button's end; 244px wide for U1 and 230px for U2, whatever the width of its lines; and in the window.
+ */
+export const MenuPlace: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'viewport' },
+  render: (args) => (
+    <div style={strips}>
+      <Strip caption="U1" account={<Component {...args} />} />
+      <Strip
+        caption="U2"
+        account={
+          <Component
+            {...args}
+            showName
+            name="A name that is much longer than the room the menu gives it"
+            description="and a line under it that is longer still, an address@that-goes-on-and-on.example"
+          />
+        }
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    const buttons = canvas.getAllByRole('button', { name: /^Account: / });
+    const menus = canvas.getAllByRole('menu', { hidden: true });
+    for (const [index, width] of [244, 230].entries()) {
+      const button = buttons[index]!;
+      const menu = menus[index]!;
+      await real.click(button);
+      await waitFor(() => expect(isOpen(menu)).toBe(true));
+      await settled(menu);
+      const b = button.getBoundingClientRect();
+      const m = menu.getBoundingClientRect();
+      await expect(Math.round(m.top - b.bottom)).toBe(17);
+      await expect(Math.round(m.right)).toBe(Math.round(b.right));
+      await expect(Math.round(m.width)).toBe(width);
+      await expect(m.left).toBeGreaterThanOrEqual(0);
+      await expect(m.bottom).toBeLessThanOrEqual(window.innerHeight);
+      // A line that is too long is cut with an ellipsis, and does not widen the menu.
+      if (index === 1) {
+        for (const line of ['.flg-user-menu-title', '.flg-user-menu-description']) {
+          const el = menu.querySelector<HTMLElement>(line)!;
+          await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
+          await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(m.right);
+        }
+      }
+      await real.keyboard('{Escape}');
+      await waitFor(() => expect(isOpen(menu)).toBe(false));
+    }
+  },
+};
+
+/**
+ * The name of U2 is cut at 160px with an ellipsis, and gives way to the room there is: in a header of
+ * 360px the button is inside the window and the page does not scroll sideways. The chevron points down,
+ * and up while the menu is open.
+ */
+export const LongNameAndChevron: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: (args) => (
+    <App
+      header={
+        <End
+          account={
+            <Component {...args} showName name="Bartholomew Maximilian Montgomery-Fitzgerald" />
+          }
+        />
+      }
+    />
+  ),
+  play: async ({ canvasElement }) => {
+    const canvas = within(canvasElement);
+    const button = canvas.getByRole('button', { name: /^Account: / });
+    const name = button.querySelector<HTMLElement>('.flg-user-menu-name')!;
+    const chevron = button.querySelector<HTMLElement>('.flg-user-menu-chevron')!;
+    await expect(name.getBoundingClientRect().width).toBeLessThanOrEqual(160);
+    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
+    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
+      document.documentElement.clientWidth,
+    );
+    await expect(getComputedStyle(chevron).rotate).toBe('none');
+
+    await withViewport(async (viewport) => {
+      await viewport.set(360, 640);
+      const box = button.getBoundingClientRect();
+      await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
+      await expect(name.getBoundingClientRect().width).toBeLessThan(160);
+      await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
+      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
+        document.documentElement.clientWidth,
+      );
+      // Nothing is on top of it: a press at its centre reaches the button.
+      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
+      await expect(button.contains(hit)).toBe(true);
+    });
+
+    const real = await realUserEvent();
+    if (!real) return;
+    await real.click(button);
+    await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
+    await waitFor(() => expect(getComputedStyle(chevron).rotate).toBe('180deg'));
+  },
+};
+
+/**
+ * What the button draws in a real header, where the fill of an open ghost button is a rule of the
+ * header that U1 must win over: under the pointer U1 has a ring of 3px and no fill, open a ring of 2px
+ * and no fill, with the keyboard focus the ring of the focus, as the bell beside it has; and U2, open,
+ * keeps the fill of a ghost button. Real pointer and keys.
+ */
+export const RingsInTheHeader: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'page' },
+  render: (args) => (
+    <App
+      header={
+        <End account={<Component {...args} />}>
+          <Component {...args} showName name="Second" />
+        </End>
+      }
+    />
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const canvas = within(canvasElement);
+    const u1 = canvasElement.querySelector<HTMLElement>('.flg-user-menu:not([data-show-name])')!;
+    const u2 = canvasElement.querySelector<HTMLElement>('.flg-user-menu[data-show-name]')!;
+    const bell = canvas.getByRole('button', { name: 'Notifications' });
+    const theme = canvas.getByRole('button', { name: 'Theme' });
+    const shadow = (el: Element) => getComputedStyle(el).boxShadow;
+    const noFill = (el: Element) => getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)';
+    /** What a custom property computes to on a probe beside the button, in the theme of the story. */
+    const computed = (property: 'background' | 'boxShadow', value: string) => {
+      const probe = document.createElement('span');
+      probe.style[property] = value;
+      u2.after(probe);
+      const result =
+        getComputedStyle(probe)[property === 'background' ? 'backgroundColor' : 'boxShadow'];
+      probe.remove();
+      return result;
+    };
+
+    await real.hover(u1);
+    await waitFor(() => expect(shadow(u1)).toMatch(/ 0px 0px 0px 3px/));
+    await expect(noFill(u1)).toBe(true);
+
+    // Open, and still under the pointer: the ring of the accent, and no fill.
+    await real.click(u1);
+    await waitFor(() => expect(u1).toHaveAttribute('aria-expanded', 'true'));
+    await waitFor(() => expect(shadow(u1)).toMatch(/ 0px 0px 0px 2px/));
+    await expect(noFill(u1)).toBe(true);
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(u1).toHaveAttribute('aria-expanded', 'false'));
+
+    await real.click(u2);
+    await waitFor(() => expect(u2).toHaveAttribute('aria-expanded', 'true'));
+    // Read once: `waitFor` watches the DOM, and a probe added to it on every look would wake it again.
+    const fill = computed('background', 'var(--flg-control-track)');
+    await waitFor(() => expect(getComputedStyle(u2).backgroundColor).toBe(fill));
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(u2).toHaveAttribute('aria-expanded', 'false'));
+
+    // The keyboard: the ring of the focus, which the bell beside it has as well. It comes in with a
+    // transition, so it is waited for.
+    const ring = computed('boxShadow', 'var(--flg-focus-ring)');
+    await expect(ring).not.toBe('none');
+    u2.focus();
+    await real.keyboard('{Tab}');
+    await expect(bell).toHaveFocus();
+    await waitFor(() => expect(shadow(bell)).toBe(ring));
+    await real.keyboard('{Tab}');
+    await expect(theme).toHaveFocus();
+    await real.keyboard('{Tab}');
+    await expect(u1).toHaveFocus();
+    await expect(u1.matches(':focus-visible')).toBe(true);
+    await waitFor(() => expect(shadow(u1)).toBe(ring));
+  },
+};
diff --git a/src/components/user-menu/UserMenu.test-d.ts b/src/components/user-menu/UserMenu.test-d.ts
new file mode 100644
index 0000000..baef372
--- /dev/null
+++ b/src/components/user-menu/UserMenu.test-d.ts
@@ -0,0 +1,37 @@
+import { expectTypeOf, test } from 'vitest';
+import type { UserMenuLabels, UserMenuProps } from './UserMenu';
+
+test('UserMenu needs a name and the items of the menu', () => {
+  expectTypeOf<UserMenuProps['name']>().toEqualTypeOf<string>();
+  // @ts-expect-error a UserMenu is told who the user is
+  const noName: UserMenuProps = { children: null };
+  // @ts-expect-error and has the items of its menu
+  const noChildren: UserMenuProps = { name: 'Ada Lovelace' };
+  expectTypeOf(noName).toBeObject();
+  expectTypeOf(noChildren).toBeObject();
+});
+
+test('the name of the button is made by labels.trigger, never passed in', () => {
+  expectTypeOf<UserMenuLabels['trigger']>().toEqualTypeOf<(name: string) => string>();
+  expectTypeOf<UserMenuProps['labels']>().toEqualTypeOf<Partial<UserMenuLabels> | undefined>();
+  // @ts-expect-error the name of the button comes from labels.trigger
+  const label: UserMenuProps = { name: 'Ada', children: null, 'aria-label': 'Account' };
+  // @ts-expect-error nor from another element
+  const labelledby: UserMenuProps = { name: 'Ada', children: null, 'aria-labelledby': 'x' };
+  expectTypeOf(label).toBeObject();
+  expectTypeOf(labelledby).toBeObject();
+});
+
+test("the button is not a slot, and its id is the menu's", () => {
+  // @ts-expect-error the content of the button is the avatar and the name
+  const asChild: UserMenuProps = { name: 'Ada', children: null, asChild: true };
+  // @ts-expect-error the menu is named by the button, whose id it owns
+  const id: UserMenuProps = { name: 'Ada', children: null, id: 'mine' };
+  expectTypeOf(asChild).toBeObject();
+  expectTypeOf(id).toBeObject();
+});
+
+test('the avatar is told everything but its size', () => {
+  expectTypeOf<NonNullable<UserMenuProps['avatar']>>().not.toHaveProperty('size');
+  expectTypeOf<UserMenuProps['showName']>().toEqualTypeOf<boolean | undefined>();
+});
diff --git a/src/components/user-menu/UserMenu.test.tsx b/src/components/user-menu/UserMenu.test.tsx
new file mode 100644
index 0000000..559690d
--- /dev/null
+++ b/src/components/user-menu/UserMenu.test.tsx
@@ -0,0 +1,320 @@
+import { act, render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef } from 'react';
+import { hydrateRoot } from 'react-dom/client';
+import { renderToString } from 'react-dom/server';
+import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
+import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
+import { MenuItem, MenuSeparator } from '../menu/Menu';
+import { UserMenu } from './UserMenu';
+import type { UserMenuProps } from './UserMenu';
+
+// jsdom has no Popover API; the menu needs a stand-in to be in the page.
+const original = {
+  showPopover: HTMLElement.prototype.showPopover,
+  hidePopover: HTMLElement.prototype.hidePopover,
+};
+beforeAll(() => {
+  HTMLElement.prototype.showPopover = () => {};
+  HTMLElement.prototype.hidePopover = () => {};
+});
+afterAll(() => Object.assign(HTMLElement.prototype, original));
+
+const NO_NAME =
+  WARN_PREFIX +
+  ' <UserMenu> needs a name: it is the name of the button and the first line of the menu.';
+
+const trigger = () => screen.getByRole('button', { name: /^Account/ });
+const menu = () => screen.getByRole('menu', { hidden: true });
+const header = () => menu().querySelector<HTMLElement>('.flg-user-menu-header')!;
+
+function Menu(props: Partial<UserMenuProps>) {
+  return (
+    <UserMenu name="Ada Lovelace" {...props}>
+      <MenuItem>Profile</MenuItem>
+      <MenuSeparator />
+      <MenuItem>Log out</MenuItem>
+    </UserMenu>
+  );
+}
+
+describe('UserMenu', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => {
+    vi.restoreAllMocks();
+    document.body.innerHTML = '';
+  });
+
+  describe('the button', () => {
+    it('is named by labels.trigger, with the default "Account: <name>"', () => {
+      render(<Menu />);
+      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
+      expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
+      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+    });
+
+    it('takes a name from labels.trigger, and keeps the default for a key given as undefined', () => {
+      const { rerender } = render(<Menu labels={{ trigger: (name) => `Tài khoản: ${name}` }} />);
+      expect(screen.getByRole('button')).toHaveAccessibleName('Tài khoản: Ada Lovelace');
+      rerender(<Menu labels={{ trigger: undefined }} />);
+      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
+    });
+
+    it('is a ghost button of the library, round, with the avatar only (U1)', () => {
+      render(<Menu />);
+      expect(trigger()).toHaveClass('flg-button', 'flg-user-menu');
+      expect(trigger()).toHaveAttribute('data-variant', 'ghost');
+      expect(trigger()).toHaveAttribute('data-size', 'md');
+      expect(trigger()).toHaveAttribute('data-icon-only');
+      expect(trigger()).not.toHaveAttribute('data-show-name');
+      expect(trigger().textContent).toBe('AL');
+      expect(trigger().querySelector('.flg-user-menu-name, .flg-user-menu-chevron')).toBeNull();
+      expect(trigger().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'md');
+    });
+
+    it('shows the name and a chevron with showName, and the avatar at sm (U2)', () => {
+      render(<Menu showName />);
+      expect(trigger()).toHaveAttribute('data-show-name');
+      expect(trigger()).not.toHaveAttribute('data-icon-only');
+      expect(trigger().querySelector('.flg-user-menu-name')).toHaveTextContent('Ada Lovelace');
+      expect(trigger().querySelector('.flg-user-menu-chevron')).toHaveAttribute(
+        'aria-hidden',
+        'true',
+      );
+      expect(trigger().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'sm');
+      // The name that is seen is part of the name that is spoken (WCAG 2.5.3).
+      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
+    });
+
+    it('follows showName and name on a mounted button', () => {
+      const { rerender } = render(<Menu />);
+      rerender(<Menu showName name="Grace Hopper" />);
+      expect(trigger()).toHaveAttribute('data-show-name');
+      expect(trigger()).not.toHaveAttribute('data-icon-only');
+      expect(trigger()).toHaveAccessibleName('Account: Grace Hopper');
+      expect(trigger().querySelector('.flg-user-menu-name')).toHaveTextContent('Grace Hopper');
+      expect(trigger().querySelector('.flg-avatar')).toHaveTextContent('GH');
+      rerender(<Menu name="Grace Hopper" />);
+      expect(trigger()).not.toHaveAttribute('data-show-name');
+      expect(trigger()).toHaveAttribute('data-icon-only');
+      expect(trigger().querySelector('.flg-user-menu-name')).toBeNull();
+    });
+
+    it('gives className, style, disabled, ref and other props to the button', () => {
+      const ref = createRef<HTMLButtonElement>();
+      render(
+        <UserMenu
+          ref={ref}
+          name="Ada Lovelace"
+          className="mine"
+          style={{ marginLeft: 3 }}
+          disabled
+          data-x="y"
+        >
+          <MenuItem>Profile</MenuItem>
+        </UserMenu>,
+      );
+      expect(ref.current).toBe(trigger());
+      expect(trigger()).toHaveClass('mine', 'flg-user-menu');
+      expect(trigger()).toHaveStyle({ marginLeft: '3px' });
+      expect(trigger()).toBeDisabled();
+      expect(trigger()).toHaveAttribute('data-x', 'y');
+    });
+
+    it('keeps the name it makes, whatever a caller sends from JavaScript', () => {
+      render(<Menu {...({ 'aria-label': 'Mine' } as object)} />);
+      expect(trigger()).toHaveAccessibleName('Account: Ada Lovelace');
+    });
+  });
+
+  describe('the initials', () => {
+    it.each([
+      ['Ada Lovelace', 'AL'],
+      ['ada lovelace', 'AL'],
+      ['Nguyễn Minh Anh', 'NA'],
+      ['Plato', 'P'],
+      ['  Mary   Jane  Watson ', 'MW'],
+      ['😀 Bob', '😀B'],
+    ])('are taken from the first and the last word of %j: %j', (name, initials) => {
+      render(<Menu name={name} />);
+      expect(trigger().querySelector('.flg-avatar')).toHaveTextContent(initials);
+    });
+
+    it('are replaced by avatar.fallback, which is how a Vietnamese name gets "MA"', () => {
+      render(<Menu name="Nguyễn Minh Anh" avatar={{ fallback: 'MA' }} />);
+      expect(trigger().querySelector('.flg-avatar')).toHaveTextContent('MA');
+      expect(header().querySelector('.flg-avatar')).toHaveTextContent('MA');
+    });
+
+    it('give way to the person icon when the name has no letters to take', () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<Menu name=" " />);
+      const avatar = trigger().querySelector('.flg-avatar')!;
+      expect(avatar.textContent).toBe('');
+      expect(avatar.querySelector('svg')).not.toBeNull();
+    });
+  });
+
+  describe('the avatar', () => {
+    it('is decorative in the button and in the header, whatever alt says', () => {
+      render(<Menu avatar={{ src: 'https://example.test/a.png', alt: 'A photo' }} />);
+      const avatars = [
+        trigger().querySelector('.flg-avatar'),
+        header().querySelector('.flg-avatar'),
+      ];
+      expect(avatars).toHaveLength(2);
+      for (const avatar of avatars) {
+        expect(avatar).toHaveAttribute('aria-hidden', 'true');
+        expect(avatar!.querySelector('img')).toHaveAttribute('alt', '');
+      }
+      expect(screen.queryByRole('img')).toBeNull();
+    });
+
+    it('is not told its size by the caller', () => {
+      render(<Menu avatar={{ ...({ size: 'sm' } as object) }} />);
+      expect(trigger().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'md');
+    });
+  });
+
+  describe('the menu', () => {
+    it('is named by the button, below it and lined up with its end', () => {
+      render(<Menu />);
+      expect(menu()).toHaveAttribute('aria-labelledby', trigger().id);
+      expect(menu()).toHaveClass('flg-user-menu-content');
+      expect(menu()).toHaveAttribute('data-side', 'bottom');
+      expect(menu()).toHaveAttribute('data-align', 'end');
+      expect(menu()).not.toHaveAttribute('data-show-name');
+    });
+
+    it('is the narrower one with showName', () => {
+      render(<Menu showName />);
+      expect(menu()).toHaveAttribute('data-show-name');
+    });
+
+    it('takes contentProps over its defaults, and keeps a default that is given as undefined', () => {
+      const { rerender } = render(
+        <Menu contentProps={{ align: 'start', side: 'top', className: 'mine' }} />,
+      );
+      expect(menu()).toHaveAttribute('data-align', 'start');
+      expect(menu()).toHaveAttribute('data-side', 'top');
+      expect(menu()).toHaveClass('flg-user-menu-content', 'mine');
+      rerender(<Menu contentProps={{ align: undefined, side: undefined }} />);
+      expect(menu()).toHaveAttribute('data-align', 'end');
+      expect(menu()).toHaveAttribute('data-side', 'bottom');
+    });
+
+    it('has the items it is given after the header and a separator', () => {
+      render(<Menu />);
+      const items = within(menu()).getAllByRole('menuitem', { hidden: true });
+      expect(items.map((item) => item.textContent)).toEqual(['Profile', 'Log out']);
+      const children = Array.from(menu().children);
+      expect(children[0]).toBe(header());
+      // The one the component draws, then the one the caller wrote.
+      expect(children[1]).toHaveAttribute('role', 'separator');
+      expect(children[2]).toBe(items[0]);
+    });
+
+    it('opens when the button is pressed, and tells onOpenChange', async () => {
+      const onOpenChange = vi.fn();
+      render(<Menu onOpenChange={onOpenChange} />);
+      await userEvent.setup().click(trigger());
+      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+      expect(onOpenChange).toHaveBeenCalledWith(true);
+    });
+
+    it('can start open, and be controlled', () => {
+      const { rerender } = render(<Menu defaultOpen />);
+      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+      rerender(<Menu open={false} />);
+      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+      rerender(<Menu open />);
+      expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+    });
+  });
+
+  describe('the header of the menu', () => {
+    it('has the avatar, the name and the description, and is not an item of the menu', () => {
+      render(<Menu description="ada@example.com" />);
+      expect(header()).toHaveAttribute('role', 'presentation');
+      expect(header().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'lg');
+      expect(header().querySelector('.flg-user-menu-title')).toHaveTextContent('Ada Lovelace');
+      expect(header().querySelector('.flg-user-menu-description')).toHaveTextContent(
+        'ada@example.com',
+      );
+      expect(header().closest('[role^="menuitem"]')).toBeNull();
+      expect(header()).not.toHaveAttribute('tabindex');
+      expect(header().querySelector('[tabindex], button, a')).toBeNull();
+    });
+
+    it('has a smaller avatar with showName', () => {
+      render(<Menu showName />);
+      expect(header().querySelector('.flg-avatar')).toHaveAttribute('data-size', 'md');
+    });
+
+    it('is the description of the menu, so the name and the line under it are read when it opens', () => {
+      render(<Menu description="ada@example.com" />);
+      expect(header().id).not.toBe('');
+      expect(menu()).toHaveAttribute('aria-describedby', header().id);
+      expect(menu()).toHaveAccessibleDescription('Ada Lovelace ada@example.com');
+    });
+
+    it('comes before the description of contentProps in aria-describedby, which is kept', () => {
+      render(
+        <>
+          <p id="hint">Signed in</p>
+          <Menu description="ada@example.com" contentProps={{ 'aria-describedby': 'hint' }} />
+        </>,
+      );
+      expect(menu()).toHaveAttribute('aria-describedby', `${header().id} hint`);
+      expect(menu()).toHaveAccessibleDescription('Ada Lovelace ada@example.com Signed in');
+    });
+
+    it.each([[undefined], [null], [false], ['']])('has no line for the description %j', (value) => {
+      render(<Menu description={value} />);
+      expect(header().querySelector('.flg-user-menu-description')).toBeNull();
+    });
+
+    it('has a line for the description 0, which is something to say', () => {
+      render(<Menu description={0} />);
+      expect(header().querySelector('.flg-user-menu-description')).toHaveTextContent('0');
+    });
+  });
+
+  describe('a name that is missing', () => {
+    it.each([[''], ['   ']])('warns once for %j, and still renders', (name) => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { rerender } = render(<Menu name={name} />);
+      rerender(<Menu name={name} showName />);
+      expect(warn).toHaveBeenCalledTimes(1);
+      expect(warn).toHaveBeenCalledWith(NO_NAME);
+      expect(screen.getByRole('button')).toBeInTheDocument();
+    });
+
+    it('does not warn for a name', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(<Menu />);
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('on the server', () => {
+    it('renders in the browser what the server sent', async () => {
+      const html = renderToString(<Menu showName description="ada@example.com" />);
+      expect(html).toContain('aria-label="Account: Ada Lovelace"');
+      expect(html).toContain('aria-haspopup="menu"');
+      const host = document.createElement('div');
+      host.innerHTML = html;
+      document.body.append(host);
+      const recoverable = vi.fn();
+      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
+      await act(async () => {
+        hydrateRoot(host, <Menu showName description="ada@example.com" />, {
+          onRecoverableError: recoverable,
+        });
+      });
+      expect(recoverable).not.toHaveBeenCalled();
+      expect(error).not.toHaveBeenCalled();
+      expect(within(host).getByRole('button')).toHaveAccessibleName('Account: Ada Lovelace');
+    });
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 04e3519..2917f58 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -125,6 +125,7 @@ describe('public API', () => {
       'Tooltip',
       'TooltipContent',
       'TooltipTrigger',
+      'UserMenu',
       'toast',
     ]);
   });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/user-menu src/index.test.ts
```

Expected: FAIL.
- `UserMenu.test.tsx` không nạp được ở cả hai project (`Failed to resolve import "./UserMenu" from "src/components/user-menu/UserMenu.test.tsx". Does the file exist?`); `UserMenu.test-d.ts` báo `Cannot find module`.
- `public API > exports exactly the documented components and nothing internal`: thiếu `UserMenu`.

Story của UserMenu không chạy ở bước này (module chưa có). Story của SearchField nay lấy helper từ `.storybook/header-strip.tsx` (có trong patch test này), với DOM của các dải như cũ.

Theo báo cáo của bản nháp (phát hiện 19): mọi test của `UserMenu.test.tsx` được viết trước `UserMenu.tsx` và fail cùng lúc như trên. Sau code, bảy đột biến làm từng test fail đúng lý do; các test còn lại (`avatar.fallback`, icon người, cấu trúc của đầu menu, props của nút, mở và controlled, HTML từ server) pass với code và là đặc tả.

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 0df180f..fef96e5 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -313,11 +313,11 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và liên kết của AppShellBrand cùng skip link của AppShell, và mục cùng nút nhóm của Nav | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và liên kết của AppShellBrand cùng skip link của AppShell, và mục cùng nút nhóm của Nav, và nút xoá của SearchField, và nút của UserMenu | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục, tiêu đề flyout của nhóm ở rail và số đếm trần của `bar` | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục, tiêu đề flyout của nhóm ở rail và số đếm trần của `bar`; ở UserMenu: dòng phụ ở đầu menu | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List, chữ và icon của mục đang chọn Nav `pill` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List, nền mục đang chọn của Nav `pill` | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
@@ -361,6 +361,8 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 2 và 6 còn có các vị trí của AppShell (giai đoạn 5, Plan A): vòng focus của liên kết `AppShellBrand` và của skip link (điểm 2), chữ của footer (điểm 6, `--flg-text-muted` trên kính; liên kết trong footer dùng `--flg-text`). Cùng cặp màu nên cùng số đo, không thêm dòng (spec giai đoạn 5 §4.4).
 
+Điểm 2 và 6 còn có các vị trí của giai đoạn 5, Plan C: vòng focus của nút xoá của SearchField và của nút `UserMenu` (điểm 2, cùng vòng focus chung; hai vòng hover và "đang mở" của U1 là `box-shadow` mang trạng thái mà menu và `aria-expanded` đã nói, nên không đo), dòng phụ ở đầu menu của `UserMenu` (điểm 6, `--flg-text-muted` trên kính của menu). Cùng cặp màu nên cùng số đo, không thêm dòng (spec giai đoạn 5 §4.4).
+
 Điểm 35 là vạch của mục đang chọn Nav `bar` theo mockup N2 (giai đoạn 5, Plan B): vạch `--flg-accent-solid` rộng 3px trên nền nhuộm `color-mix` 18% của chính màu đó, nên thấp ở cả hai theme; mục đó còn có chữ đậm và `aria-current="page"`, nên vạch không phải dấu hiệu duy nhất. Chữ `--flg-text` của mục (và số đếm của nó) đạt (8.24:1 light, 5.82:1 dark, thấp nhất của hai điểm 18% và 3% của nền) và icon `--flg-accent-text` đạt (3.28:1, 3.80:1), nên không phải ngoại lệ. Các vị trí khác của Nav cùng cặp màu với các điểm 2 (vòng focus của mục và nút nhóm), 6 (tiêu đề mục, số đếm trần của `bar`), 7 và 8 (chữ, icon và nền của mục đang chọn `pill`), 12 (số đếm trần của `bar` khi hover), 29 (nhãn của nhóm chứa trang hiện tại, `pill`) và 32 (`Badge` đếm của `pill` khi hover, dark 4.15:1 `neutral`), nên được ghi ở đó. Ở `prefers-contrast: more` cả ba cặp mới đều đạt (4.65:1, 11.44:1 và 4.55:1 ở light; 5.30:1, 10.17:1 và 6.64:1 ở dark).
 
 Điểm 36 là chữ của phím gợi ý (`⌘K`) trong ô SearchField theo mockup H2 và H3 (giai đoạn 5, Plan C): `--flg-text-muted` trên nền `--flg-control-bg-secondary` của phím, nằm trên nền ô (`--flg-control-bg`) hoặc trên kính của tooltip của nút thu gọn. Ở dark là 3.31:1 trong ô và 3.76:1 trong tooltip, nên ghi 3.31:1 (số thấp hơn); light đạt cả hai (7.15:1). Phím gợi ý là chữ phụ ẩn khỏi công nghệ hỗ trợ (`aria-hidden`), và phím tắt được nói qua `aria-keyshortcuts` trên ô và trên nút thu gọn, nên không có thông tin nào chỉ nằm ở chữ đó; hai điều này không miễn tiêu chí, chỉ là bối cảnh khi duyệt. Ở `prefers-contrast: more` đạt (7.83:1 light, 7.63:1 dark).
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index b2f5ecf..e44d8f5 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -853,7 +853,7 @@ type ThemeScriptProps = { storageKey?: string; nonce?: string };
 
 ```ts
 interface UserMenuLabels { trigger: (name: string) => string }
-type UserMenuProps = Omit<ButtonProps, 'children' | 'aria-label' | 'aria-labelledby'> & {
+type UserMenuProps = Omit<ButtonProps, 'children' | 'aria-label' | 'aria-labelledby' | 'asChild' | 'id'> & {
   name: string; description?: ReactNode; avatar?: Omit<AvatarProps, 'size'>; showName?: boolean;
   open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
   contentProps?: Omit<DropdownMenuContentProps, 'children'>;
@@ -862,7 +862,7 @@ type UserMenuProps = Omit<ButtonProps, 'children' | 'aria-label' | 'aria-labelle
 ```
 
 - **Mặc định:** `showName=false`, `labels={ trigger: (name) => \`Account: ${name}\` }`. Menu `side="bottom"`, `align="end"`, `sideOffset={17}` (ghi đè qua `contentProps`).
-- **Xây trên** `DropdownMenu` (trigger, menu, phím của menu) và `Avatar` có sẵn. Props của nút (`className`, `style`, `disabled`…) vào nút.
+- **Xây trên** `DropdownMenu` (trigger, menu, phím của menu) và `Avatar` có sẵn. Props của nút (`className`, `style`, `disabled`…) vào nút. Nút không nhận `asChild` (nội dung của nó là avatar, tên và chevron, nên một slot làm hỏng nó) và không nhận `id` (menu được gọi tên bằng `id` của nút, do `DropdownMenu` giữ), nên hai prop đó bị `Omit` khỏi kiểu (phát hiện khi lập Plan C). `variant` và `size` của `Button` vẫn qua được, mặc định `ghost` và `md`.
 - **Nút:** tên `labels.trigger(name)`; U2 có tên nhìn thấy nằm trong tên đó ("Account: Nguyễn Minh Anh" chứa "Nguyễn Minh Anh"). Avatar trong nút và trong đầu menu là trang trí (`alt=""`, tên đã có).
 - **Chữ cái đầu mặc định** khi không có `avatar.src` hay `avatar.fallback`: chữ đầu của từ đầu và từ cuối của `name`, viết hoa ("Ada Lovelace" → "AL"). Tên Việt Nam thường lấy hai từ cuối ("Nguyễn Minh Anh" → "MA" như mockup): truyền `avatar={{ fallback: 'MA' }}`; docs nói rõ (Claude chốt).
 - **Đầu menu:** avatar, tên, `description`, đặt trong panel trước `children`, `role="presentation"`, không focus được, không phải mục menu (theo bản quyết định). Menu có `aria-describedby` trỏ vào nó (id từ `useId`, nối với `aria-describedby` của `contentProps` nếu có), nên screen reader đọc tên và dòng phụ khi menu mở (Claude chốt). Sau nó là một `MenuSeparator`.
@@ -902,7 +902,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 **Kiểm tra bổ sung:**
 
 - **Test kiểu:** `layout`, `variant`, `status`, `breakpoint`, `shortcut` từ chối giá trị lạ; `AppShellMain` và `AppShellSidebar` không nhận `id`; `AppShellSidebarTrigger`, `ThemeSwitch` không nhận `aria-label`; `UserMenu` bắt buộc `name`; `NavGroup` bắt buộc `label`; `ThemeValue` chỉ ba giá trị; `List surface` là boolean.
-- **Gói phát hành:** `check:use-client`, `check:dist-css` và `check:rsc` thêm danh sách ở §3.1 (lớp CSS của mọi phần: `flg-app-shell`, `flg-app-shell-header`, `flg-app-shell-sidebar`, `flg-app-shell-sidebar-head`, `flg-app-shell-sidebar-body`, `flg-app-shell-main`, `flg-app-shell-footer`, `flg-app-shell-trigger`, `flg-app-shell-skip`, `flg-app-shell-scrim`, `flg-app-shell-brand`, `flg-nav`, `flg-nav-item`, `flg-nav-group`, `flg-nav-sub`, `flg-nav-section`, `flg-indicator`, `flg-indicator-mark`, `flg-search-field`, `flg-search-field-kbd`, `flg-theme-switch`, `flg-theme-menu-icon`, `flg-user-menu-trigger`, `flg-user-menu-header`…), cùng ba khối `@media` của CSS sinh; `size-limit` ghi lại ngưỡng ở mỗi plan.
+- **Gói phát hành:** `check:use-client`, `check:dist-css` và `check:rsc` thêm danh sách ở §3.1 (lớp CSS của mọi phần: `flg-app-shell`, `flg-app-shell-header`, `flg-app-shell-sidebar`, `flg-app-shell-sidebar-head`, `flg-app-shell-sidebar-body`, `flg-app-shell-main`, `flg-app-shell-footer`, `flg-app-shell-trigger`, `flg-app-shell-skip`, `flg-app-shell-scrim`, `flg-app-shell-brand`, `flg-nav`, `flg-nav-item`, `flg-nav-group`, `flg-nav-sub`, `flg-nav-section`, `flg-indicator`, `flg-indicator-mark`, `flg-search-field`, `flg-search-field-kbd`, `flg-theme-switch`, `flg-theme-menu-icon`, `flg-user-menu` (lớp của nút; spec từng ghi `flg-user-menu-trigger`, phát hiện khi lập Plan C), `flg-user-menu-header`…), cùng ba khối `@media` của CSS sinh; `size-limit` ghi lại ngưỡng ở mỗi plan.
 - **`theme-css.test.ts`** giữ `--flg-indicator-accent` đúng giá trị mockup.
 - **Fixtures** (Plan C), mỗi app một trang riêng cho khung (Next.js: route `/shell`; Vite: một entry thứ hai), để trang hiện có không đổi:
   - `next-app`: `app/layout.tsx` có `<ThemeScript />` trong `<head>` và `suppressHydrationWarning` trên `<html>`. Trang `/shell` là Server Component: đọc cookie `flg-sidebar` cho `defaultCollapsed` (qua client component nhỏ ghi cookie, §8), render `AppShell` với brand (`AppShellBrand asChild` quanh `Link`), nav render từ server (mảng dữ liệu → `NavItem asChild` với `Link`, một `NavGroup` có con `active`, số đếm), header có SearchField trong `<form role="search">`, ThemeSwitch, bảng thông báo, UserMenu có `ThemeMenuGroup`; `Toaster` ngoài `AppShell`.
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index a3dcf16..df3132a 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -205,6 +205,14 @@ const SHIPPED_CLASSES = [
   'flg-search-field-kbd',
   'flg-search-field-clear',
   'flg-search-field-back',
+  'flg-user-menu',
+  'flg-user-menu-name',
+  'flg-user-menu-chevron',
+  'flg-user-menu-content',
+  'flg-user-menu-header',
+  'flg-user-menu-text',
+  'flg-user-menu-title',
+  'flg-user-menu-description',
 ];
 
 // The rules of the AppShell that depend on the width are generated, one `@media` block per breakpoint
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 2dfee49..1fc8da4 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -35,6 +35,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/app-shell/AppShell.tsx',
   'src/components/nav/Nav.tsx',
   'src/components/search-field/SearchField.tsx',
+  'src/components/user-menu/UserMenu.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
   'src/components/file-upload/FileUpload.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 6cd054c..d645c05 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -29,7 +29,8 @@ const D = {
       'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
       'step, on a row of a List, on the sort button and the scroll frame of a Table, on the link of ' +
       'an AppShellBrand and the skip link of an AppShell, on an item and the button of a group of ' +
-      'a Nav, and on an invalid Input or Textarea, whose border stays red while focused',
+      'a Nav, on the clear button of a SearchField and the button of a UserMenu, and on an ' +
+      'invalid Input or Textarea, whose border stays red while focused',
     criterion: '1.4.11',
   },
   3: {
@@ -55,7 +56,8 @@ const D = {
       'description of every step and the "Step N" line of a step not reached, in a List the ' +
       'description and the end cell of a row, and in a Table `striped` and `minimal` the column ' +
       'headings and the icon of a column that is not sorted, the text of an AppShell footer, and in ' +
-      'a Nav the title of a section and of the flyout of a group at the rail, and the count of `bar`',
+      'a Nav the title of a section and of the flyout of a group at the rail, and the count of `bar`, ' +
+      'and in a UserMenu the line under the name at the top of the menu',
     criterion: '1.4.3',
   },
   7: {
diff --git a/src/components/user-menu/UserMenu.mdx b/src/components/user-menu/UserMenu.mdx
new file mode 100644
index 0000000..d67cbcb
--- /dev/null
+++ b/src/components/user-menu/UserMenu.mdx
@@ -0,0 +1,177 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './UserMenu.stories';
+
+<Meta of={Stories} />
+
+# UserMenu
+
+The menu of the person who is signed in, for the end of a header: a round button with their avatar
+that opens a menu. The first lines of the menu say who is signed in; the items after them are yours.
+It is a [DropdownMenu](?path=/docs/components-dropdownmenu--docs) underneath, so it has the keys,
+the focus and the dismissal of one. It has two looks. The default is the avatar alone (U1). With
+`showName` the button shows the name and a chevron as well (U2).
+
+```tsx
+import { AppShell, AppShellHeader, MenuItem, MenuSeparator, UserMenu } from 'h2d-glass-ui';
+
+<AppShellHeader>
+  <UserMenu
+    name="Ada Lovelace"
+    description="ada@example.com"
+    avatar={{ src: '/people/ada.jpg' }}
+    onOpenChange={(open) => console.log(open)}
+  >
+    <MenuItem icon={<PersonIcon />}>Profile</MenuItem>
+    <MenuItem icon={<GearIcon />}>Settings</MenuItem>
+    <MenuSeparator />
+    <MenuItem icon={<LogOutIcon />} onSelect={signOut}>
+      Log out
+    </MenuItem>
+  </UserMenu>
+</AppShellHeader>;
+```
+
+<Canvas of={Stories.UserMenu} />
+
+## Props
+
+| Prop           | Type                                         | Default  | Does                                                                     |
+| -------------- | -------------------------------------------- | -------- | ------------------------------------------------------------------------ |
+| `name`         | `string`                                     | none     | Who is signed in: in the name of the button, and in the menu. Required   |
+| `description`  | `ReactNode`                                  | none     | The line under the name at the top of the menu, such as an email address |
+| `avatar`       | `Omit<AvatarProps, 'size'>`                  | initials | The picture (see Avatar)                                                 |
+| `showName`     | `boolean`                                    | `false`  | Shows the name and a chevron on the button (U2)                          |
+| `open`         | `boolean`                                    | none     | Whether the menu is open. Pass it with `onOpenChange` to control it      |
+| `defaultOpen`  | `boolean`                                    | `false`  | Whether it starts open, when uncontrolled                                |
+| `onOpenChange` | `(open: boolean) => void`                    | none     | Called with the new state whenever the menu opens or closes              |
+| `contentProps` | `Omit<DropdownMenuContentProps, 'children'>` | see Menu | Props of the menu: `side`, `align`, `sideOffset`, `className`…           |
+| `labels`       | `Partial<UserMenuLabels>`                    | English  | The words of the button                                                  |
+| `children`     | `ReactNode`                                  | none     | The items of the menu, after the header. Required                        |
+
+`className`, `style`, `disabled`, `ref` and every other prop of a button go on the button; `variant`
+and `size` are `ghost` and `md` unless you say otherwise. The button is not a slot, so it takes no
+`asChild`, and it takes no `id` or `aria-label`: the menu is named by the button through its `id`,
+and the name of the button is made from `name` (see The words).
+
+## The avatar
+
+The avatar has the picture in `avatar.src`. Until it loads, and if it never does, and without a
+`src`, it shows `avatar.fallback`, and without that the initials of `name`: the first letter of its
+first word and of its last, in capitals ("Ada Lovelace" is "AL", "Plato" is "P"). A name with no
+letters in it shows the person icon.
+
+The initials are right for a name that is written given name first. **A Vietnamese name is written
+the other way, and the two last words are the ones people use**: "Nguyễn Minh Anh" would be "NA". Pass
+the initials you want:
+
+```tsx
+<UserMenu name="Nguyễn Minh Anh" avatar={{ fallback: 'MA' }}>
+  …
+</UserMenu>
+```
+
+The avatar is decorative, in the button and in the menu: the name is already there, in words. Its
+`alt` is always empty, whatever you pass, and its size is the button's to choose (24px with
+`showName`, 32px without; 32px and 40px in the menu).
+
+## The button
+
+U1 is a ghost button of 34px with the avatar and nothing else. It has no fill under the pointer; it
+has a gray ring of 3px instead. While the menu is open the ring is the accent, 2px. The keyboard
+focus is the ring of the focus that every button has, and it wins over both.
+
+<Canvas of={Stories.UserMenuOpen} />
+
+U2 is a ghost button with the avatar, the name and a chevron, 8px apart. The name is one line, cut
+with an ellipsis at 160px, and shorter in a row that is too narrow for the button: the button may be
+narrower than its content. If you put the button in an element of your own in the header, give that
+element `min-width: 0`, or it is as wide as the button is and the name cannot give way. Under the
+pointer, and while the menu is open, the button has the fill of a ghost button. The chevron points
+up while the menu is open, and turns in `--flg-duration-fast`.
+
+<Canvas of={Stories.UserMenuShowName} />
+<Canvas of={Stories.UserMenuShowNameOpen} />
+
+The fill of an open U2 is a rule of the `AppShellHeader`, as it is for the button that opens the
+notifications: a ghost button that has a popup open keeps its fill there. Outside a header U2 has
+the fill under the pointer only. The rings of U1 are on the button wherever it is.
+
+## The menu
+
+The menu opens below the button and lines up with the button's end. It is 17px away, which in a
+header of 56px is 6px under its edge, and 244px wide (230px with `showName`, which has a smaller
+avatar and a narrower button). It does not stop at the usual maximum width of a menu. `contentProps`
+changes all of it:
+
+```tsx
+<UserMenu name="Ada Lovelace" contentProps={{ side: 'top', sideOffset: 8, style: { width: 280 } }}>
+  …
+</UserMenu>
+```
+
+Its `side` and `align` follow the room there is: it turns over when there is none. Give it
+`className` and it is added to the classes of the library. The items are the parts of any menu
+(`MenuItem`, `MenuGroup`, `MenuSeparator`, `MenuCheckboxItem`, `MenuRadioGroup`…), and a menu of
+them closes when one is chosen, as it does everywhere.
+
+### The header
+
+The top of the menu has the avatar, the name and `description`, and a separator under them. It is
+**not an item of the menu**: it takes no focus, the arrow keys go past it, and a click on it leaves
+the menu open. Both lines are cut with an ellipsis when they are too long for the menu.
+
+It is what the menu is described by, so a screen reader reads the name and the line under it when
+the menu opens. If `contentProps` has an `aria-describedby` of its own it is kept, and read after
+the header. `description` shows nothing for `undefined`, `null`, `false` and `''`; `0` is something
+to say.
+
+## The keys
+
+They are those of a `DropdownMenu`:
+
+| Key          | On the button                    | In the menu                                    |
+| ------------ | -------------------------------- | ---------------------------------------------- |
+| Enter, Space | Opens the menu on the first item | Chooses the item                               |
+| ↓            | Opens the menu on the first item | Moves to the next item, and goes round         |
+| ↑            | Opens the menu on the last item  | Moves to the previous item, and goes round     |
+| Esc          | none                             | Closes the menu, and the focus is the button's |
+
+A click opens it on the menu itself. A key held down opens it once.
+
+## The words
+
+`labels.trigger` makes the name of the button from `name`. The default is "Account: " and the name.
+With `showName` the name that is seen is part of the name that is said, as WCAG 2.5.3 asks. Replace
+it for another language, and keep the name in it:
+
+```tsx
+<UserMenu name="Nguyễn Minh Anh" labels={{ trigger: (name) => `Tài khoản: ${name}` }}>
+  …
+</UserMenu>
+```
+
+A key you leave out, or give as `undefined`, keeps its English default. The words of the items are
+yours.
+
+## Accessibility
+
+- **The button is named** by `labels.trigger` (`Account: Ada Lovelace`, by default) and says it opens
+  a menu (`aria-haspopup="menu"`, `aria-expanded`). An empty `name` is warned about in
+  development: it is the name of the button.
+- The menu is named by the button and described by its header.
+- The chevron and the avatars are hidden from assistive technology: they say nothing the name does
+  not.
+- The ring of the focus of U1 is the ring of the focus of the library, a contrast of 3:1 as for every
+  button (row 2 of the table on the Accessibility page). The line under the name in the menu is
+  `--flg-text-muted` on the glass of the menu, which is row 6 of the same table.
+- The rings of hover and open of U1 are not measured: they say nothing the menu and `aria-expanded`
+  do not.
+- In forced colours the shadows are dropped, so U1 has the border of a button and no ring, and the
+  open menu says that it is open. The header is drawn in the text colour of the system.
+
+## Do and don't
+
+- Do pass `avatar.fallback` for a name that does not run given name first.
+- Do put the menu where the person looks for it, at the end of the header, after the other widgets.
+- Don't put the one thing a person must do in a menu that opens from a picture: it hides it.
+- Don't pass a long `description`: it is cut at the width of the menu.
diff --git a/src/components/user-menu/UserMenu.tsx b/src/components/user-menu/UserMenu.tsx
new file mode 100644
index 0000000..396cbeb
--- /dev/null
+++ b/src/components/user-menu/UserMenu.tsx
@@ -0,0 +1,166 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useId } from 'react';
+import type { ReactNode } from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { hasContent } from '../../internal/has-content';
+import { ChevronIcon } from '../../internal/icons';
+import { joinIds } from '../../internal/join-ids';
+import { devWarn } from '../../internal/warn';
+import { withDefaults } from '../../internal/with-defaults';
+import { Avatar } from '../avatar/Avatar';
+import type { AvatarProps } from '../avatar/Avatar';
+import type { ButtonProps } from '../button/Button';
+import {
+  DropdownMenu,
+  DropdownMenuContent,
+  DropdownMenuTrigger,
+} from '../dropdown-menu/DropdownMenu';
+import type { DropdownMenuContentProps } from '../dropdown-menu/DropdownMenu';
+import { MenuSeparator } from '../menu/Menu';
+
+export interface UserMenuLabels {
+  /** The name of the button, made from the name of the user. */
+  trigger: (name: string) => string;
+}
+
+export type UserMenuProps = Omit<
+  ButtonProps,
+  'children' | 'aria-label' | 'aria-labelledby' | 'asChild' | 'id'
+> & {
+  /** The name of the user: on the button with `showName`, in the name of the button, in the menu. */
+  name: string;
+  /** The line under the name at the top of the menu, such as an email address. */
+  description?: ReactNode;
+  /** The picture. Without `src` and `fallback` it shows the initials of `name`. */
+  avatar?: Omit<AvatarProps, 'size'>;
+  /** Shows the name and a chevron on the button, next to the avatar. */
+  showName?: boolean;
+  /** Whether the menu is open. Pass it with `onOpenChange` to control it. */
+  open?: boolean;
+  /** Whether the menu starts open, when uncontrolled. */
+  defaultOpen?: boolean;
+  /** Called with the new state whenever the menu opens or closes. */
+  onOpenChange?: (open: boolean) => void;
+  /** Props of the menu, which opens below the button and lines up with its end, 17px away. */
+  contentProps?: Omit<DropdownMenuContentProps, 'children'>;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<UserMenuLabels>;
+  /** The items of the menu, after the header. */
+  children: ReactNode;
+};
+
+const DEFAULT_LABELS: UserMenuLabels = {
+  trigger: (name) => `Account: ${name}`,
+};
+
+/** The first letter of a word, as a person sees it: a code point, not a UTF-16 unit. */
+const firstLetter = (word: string) => Array.from(word.normalize('NFC'))[0] ?? '';
+
+/**
+ * The initials of a name: the first letter of its first word and of its last, in capitals, or the
+ * one letter of a single word; `undefined` when there is none, so that the avatar draws its icon.
+ * Names that are written the other way round, as Vietnamese ones are, pass `avatar.fallback`.
+ */
+function initialsOf(name: string): string | undefined {
+  const words = name.split(/\s+/).filter(Boolean);
+  const first = firstLetter(words[0] ?? '');
+  const last = words.length > 1 ? firstLetter(words[words.length - 1] ?? '') : '';
+  return (first + last).toUpperCase() || undefined;
+}
+
+/**
+ * The menu of the signed-in user, for the end of a header: a round button with the avatar, and with
+ * `showName` the name and a chevron, that opens a menu whose first lines say who is signed in. It is
+ * a `DropdownMenu` underneath; the items are its `children`. `className`, `style` and every other
+ * prop of a button go on the button, which is what `ref` points to; the menu takes `contentProps`.
+ */
+export const UserMenu = forwardRef<HTMLButtonElement, UserMenuProps>(function UserMenu(
+  {
+    name,
+    description,
+    avatar,
+    showName = false,
+    open,
+    defaultOpen,
+    onOpenChange,
+    contentProps,
+    labels: labelsProp,
+    variant = 'ghost',
+    size = 'md',
+    className,
+    children,
+    ...props
+  },
+  ref,
+) {
+  const headerId = useId();
+  const labels = withDefaults(DEFAULT_LABELS, labelsProp);
+  // A caller that is not checked by TypeScript may leave it out.
+  const text = String(name ?? '');
+  if (!text.trim()) {
+    devWarn(
+      '<UserMenu> needs a name: it is the name of the button and the first line of the menu.',
+    );
+  }
+  const initials = initialsOf(text);
+  // The name is on the button or in the menu, so the picture adds nothing to it: it is decorative.
+  const picture = (pictureSize: AvatarProps['size']) => (
+    <Avatar {...avatar} alt="" size={pictureSize} fallback={avatar?.fallback ?? initials} />
+  );
+
+  const {
+    side = 'bottom',
+    align = 'end',
+    sideOffset = 17,
+    className: contentClassName,
+    'aria-describedby': describedBy,
+    ...contentRest
+  } = contentProps ?? {};
+
+  return (
+    <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
+      <DropdownMenuTrigger
+        ref={ref}
+        variant={variant}
+        size={size}
+        {...props}
+        className={clsx('flg-user-menu', className)}
+        aria-label={labels.trigger(text)}
+        data-show-name={dataAttr(showName)}
+        data-icon-only={dataAttr(!showName)}
+      >
+        {picture(showName ? 'sm' : 'md')}
+        {showName ? (
+          <>
+            <span className="flg-user-menu-name">{text}</span>
+            <ChevronIcon className="flg-user-menu-chevron" />
+          </>
+        ) : null}
+      </DropdownMenuTrigger>
+      <DropdownMenuContent
+        {...contentRest}
+        side={side}
+        align={align}
+        sideOffset={sideOffset}
+        className={clsx('flg-user-menu-content', contentClassName)}
+        // The header says who is signed in, so it is what a screen reader reads when the menu opens.
+        aria-describedby={joinIds(headerId, describedBy)}
+        data-show-name={dataAttr(showName)}
+      >
+        <div id={headerId} className="flg-user-menu-header" role="presentation">
+          {picture(showName ? 'md' : 'lg')}
+          <div className="flg-user-menu-text">
+            <div className="flg-user-menu-title">{text}</div>
+            {hasContent(description) ? (
+              <div className="flg-user-menu-description">{description}</div>
+            ) : null}
+          </div>
+        </div>
+        <MenuSeparator />
+        {children}
+      </DropdownMenuContent>
+    </DropdownMenu>
+  );
+});
diff --git a/src/components/user-menu/index.ts b/src/components/user-menu/index.ts
new file mode 100644
index 0000000..3763556
--- /dev/null
+++ b/src/components/user-menu/index.ts
@@ -0,0 +1,2 @@
+export { UserMenu } from './UserMenu';
+export type { UserMenuLabels, UserMenuProps } from './UserMenu';
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 824a387..501b6b0 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -64,8 +64,8 @@ The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
 9, 12 and 22), AppShell (its part in rows 2 and 6), Nav (row 35, and its part in rows 2, 6, 7, 8,
-12, 14, 29 and 32) and SearchField (row 36) are in the table above, which is built from the same
-data CI checks.
+12, 14, 29 and 32), SearchField (row 36, and its part in row 2) and UserMenu (its part in rows 2
+and 6) are in the table above, which is built from the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
diff --git a/src/index.ts b/src/index.ts
index 2ff2991..afe8f3a 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -292,3 +292,5 @@ export type {
 } from './components/nav';
 export { SearchField } from './components/search-field';
 export type { SearchFieldLabels, SearchFieldProps } from './components/search-field';
+export { UserMenu } from './components/user-menu';
+export type { UserMenuLabels, UserMenuProps } from './components/user-menu';
diff --git a/src/styles/components/user-menu.css b/src/styles/components/user-menu.css
new file mode 100644
index 0000000..19ce418
--- /dev/null
+++ b/src/styles/components/user-menu.css
@@ -0,0 +1,106 @@
+/* UserMenu (spec phase 5 §4.3, mockup U1 and U2): a round ghost button with the avatar, and with
+   `showName` the name and a chevron; and the header of its menu, which says who is signed in. The
+   button is a `Button` and the menu a `Menu`, so this is only what they do not draw. */
+@layer flg.components {
+  .flg-user-menu {
+    border-radius: var(--flg-radius-full);
+  }
+
+  /* U2: the avatar, the name, and a chevron that turns the other way while the menu is open. */
+  /* It may be narrower than its content, so that in a row that is too narrow the name gives way (the
+     avatar button is a fixed size, and is not allowed to). */
+  .flg-user-menu[data-show-name] {
+    min-width: 0;
+    gap: 8px;
+    padding: 0 9px 0 5px;
+    font-weight: var(--flg-weight-medium);
+  }
+  /* The name is cut short with an ellipsis (outside the mockup). The padding gives the clip room for the
+     marks of a letter, as in "Nguyễn", and the margin takes it back, so the name is where the mockup has it. */
+  .flg-user-menu-name {
+    min-width: 0;
+    max-width: 160px;
+    overflow: hidden;
+    margin: -2px 0;
+    padding: 2px 0;
+    text-overflow: ellipsis;
+  }
+  .flg-user-menu > .flg-user-menu-chevron {
+    flex: none;
+    width: 14px;
+    height: 14px;
+    color: var(--flg-text-muted);
+    transition: rotate var(--flg-duration-fast) var(--flg-ease);
+  }
+  .flg-user-menu[aria-expanded='true'] > .flg-user-menu-chevron {
+    rotate: 180deg;
+  }
+
+  /* U1: the avatar alone. It has no fill under the pointer, and a ring takes its place: gray under the
+     pointer, the accent while the menu is open. Each rule names the ghost button and what it is not, so
+     that it is at least as specific as the fill of a ghost button and of an open one in a header (which
+     it is meant to win over, app-shell.css); and the ring of the focus is the last, so that it wins over
+     both. The rings are shadows, so forced colours drops them (preferences.css). */
+  @media (hover: hover) {
+    .flg-user-menu.flg-button[data-variant='ghost']:not(
+        [data-show-name],
+        :disabled,
+        [aria-disabled='true']
+      ):hover {
+      background: transparent;
+      box-shadow: 0 0 0 3px var(--flg-control-track);
+    }
+  }
+  .flg-user-menu.flg-button[data-variant='ghost'][aria-haspopup][aria-expanded='true']:not(
+      [data-show-name]
+    ) {
+    background: transparent;
+    box-shadow: 0 0 0 2px var(--flg-accent-solid);
+  }
+  .flg-user-menu.flg-button[data-variant='ghost'][aria-haspopup]:not(
+      [data-show-name]
+    ):focus-visible {
+    box-shadow: var(--flg-focus-ring);
+  }
+
+  /* The menu is as wide as the mockup draws it, and not as wide as the limit of a menu. */
+  .flg-user-menu-content {
+    width: 244px;
+    max-width: none;
+  }
+  .flg-user-menu-content[data-show-name] {
+    width: 230px;
+  }
+  .flg-user-menu-header {
+    display: flex;
+    align-items: center;
+    gap: 10px;
+    padding: 8px 8px 9px;
+  }
+  .flg-user-menu-text {
+    display: flex;
+    flex-direction: column;
+    gap: 3px;
+    min-width: 0;
+  }
+  /* Both lines are cut short with an ellipsis (outside the mockup). The padding gives the clip room for
+     the marks of a letter, and the margin takes it back, so the lines are where the mockup has them. */
+  .flg-user-menu-title,
+  .flg-user-menu-description {
+    overflow: hidden;
+    margin: -2px 0;
+    padding: 2px 0;
+    text-overflow: ellipsis;
+    white-space: nowrap;
+    line-height: 1.2;
+  }
+  .flg-user-menu-title {
+    color: var(--flg-text);
+    font-size: var(--flg-text-sm);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-user-menu-description {
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index be385d1..07341b6 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -44,6 +44,7 @@
 @import './components/table.css';
 @import './components/nav.css';
 @import './components/search-field.css';
+@import './components/user-menu.css';
 @import './components/app-shell.css';
 @import './generated/app-shell.css';
 @import './components/floating.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index a1c54f8..3be2217 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -250,6 +250,13 @@
     .flg-search-field-clear {
       color: ButtonText;
     }
+    /* The rings of the avatar button of a UserMenu (U1) are shadows, which this mode drops: the menu
+       that is open says that it is, and the button has the border of a Button. The header of the menu is
+       text on the canvas, whatever muted colour it was written in (spec phase 5 §4.5). */
+    .flg-user-menu-title,
+    .flg-user-menu-description {
+      color: CanvasText;
+    }
     .flg-input:has(> input:disabled) {
       border-color: GrayText;
       color: GrayText;
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/user-menu src/components/toast src/index.test.ts src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/user-menu
pnpm vitest run --project storybook-dark src/components/user-menu
pnpm vitest run --project storybook-light src/components/search-field
pnpm vitest run --project storybook-dark src/components/search-field
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 238 test PASS (12 file, hai project React cộng lại; `UserMenu.test.tsx` 36 test ở mỗi project), không lỗi kiểu.
- `scripts`: 130 test PASS (5 file).
- `pnpm check:contrast`: PASS. Không cặp mới; chỉ nhãn của dòng 2 và 6 đổi.
- Story user-menu: 27 test PASS ở mỗi project (9 story × ba engine). Story search-field: 33 ở mỗi project, như Task 1 (helper đổi chỗ, DOM của dải không đổi).
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy tám lớp `flg-user-menu…`; `check:use-client` có `UserMenu.tsx`; `size`: JS 53.59 kB trên 57.29 kB, CSS 16.04 kB trên 17.04 kB.
- `pnpm build-storybook`: PASS. `UserMenu.mdx` thay trang autodocs (`components-usermenu--docs`); chỉ bốn story giao diện của UserMenu không gắn `no-visual` (139 story có ảnh).
- `pnpm check:docs-tables`: PASS.
- Ảnh chuẩn của component cũ giữ nguyên (phát hiện 21).

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/header-strip.tsx \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  scripts/contrast-exceptions.ts \
  src/components/search-field/SearchField.stories.tsx \
  src/components/user-menu/UserMenu.mdx \
  src/components/user-menu/UserMenu.stories.tsx \
  src/components/user-menu/UserMenu.test-d.ts \
  src/components/user-menu/UserMenu.test.tsx \
  src/components/user-menu/UserMenu.tsx \
  src/components/user-menu/index.ts \
  src/docs/Accessibility.mdx \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/user-menu.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(user-menu): add UserMenu in its two looks, U1 and U2" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: store theme, `ThemeSwitch` (T1), `ThemeMenuGroup` (T3) và `ThemeScript`

Spec §1 (dòng Theme), §3.1 (dòng ThemeSwitch, ThemeMenuGroup, ThemeScript; hai ca `check:rsc`), §3.2 (dòng T), §3.5 (dòng ThemeSwitch), §3.7 (`theme-value.ts`), §4.1 (t1, t3), §4.3 **ThemeSwitch (T1) và ThemeMenuGroup (T3)**, §4.4 (dòng 9 mở rộng), §4.5 ThemeSwitch, ThemeMenuGroup, §4.6 (`SunIcon`, `MoonIcon`, `MonitorIcon`), §5 (`theme-store.ts`, `theme-value.ts`, `theme-switch/theme-script.ts`; không có cảnh báo mới), §6.1, §6.3 `ThemeSwitch`, `ThemeMenuGroup`, `ThemeScript`, next-themes, §7 cho theme, §8 `ThemeSwitch.mdx` (cả `ThemeMenuGroup`, `ThemeScript`, CSP `nonce`, next-themes, SPA), §10 (dòng hydrate của ThemeSwitch, dòng `ThemeScript` và CSP). Mockup t1, t3 (`phase-5-header.html`).
- **`theme-value.ts`, `theme-store.ts`** (phát hiện 9).
- **Icon:** `SunIcon`, `MoonIcon`, `MonitorIcon`.
- **`ThemeSwitch`** (client): nút đổi vòng light → dark → system, tên theo giá trị, tooltip `describe={false}` và gợi ý ẩn, `data-value` và `data-pending` (phát hiện 10).
- **`ThemeMenuGroup`** (client, cùng file): `MenuRadioGroup` với `MenuLabel` và ba mục có icon ở cuối, cùng store (phát hiện 10).
- **`ThemeScript`** (server-safe) và `themeScriptSource` (phát hiện 11).
- **CSS:** `theme-switch.css` (một icon theo `data-value` hay theo `<html>` khi `data-pending`; icon cuối mục menu); forced colors trong `preferences.css`.
- **Story:** `ThemeSwitch`, `ThemeSwitchFocus` (dải), `ThemeMenuGroup`, `ThemeMenuGroupDark`, `ThemeMenuGroupSystem` (UserMenu đang mở trong header thật, không có nút theme) là story giao diện; `ChangesTheHtml`, `TwoShellsStayInSync`, `IconBeforeHydration`, `WorksWhenLocalStorageThrows`, `TooltipUnderTheButton` gắn `no-visual`. Helper: khe `theme`; `PersonIcon`, `LogOutIcon` vào `.storybook/icons.tsx`.
- **Tương phản:** không có cặp mới; dòng 9 mở rộng (icon cuối mục của `ThemeMenuGroup`).
- **`ThemeSwitch.mdx`** thay trang autodocs (phát hiện 13). Spec §3.7, §5, §6.3, §7 và spec 0+1 §4.9 được sửa (phát hiện 20).

**Files:**
- Create: `src/internal/theme-value.ts`, `src/internal/theme-store.ts`, `src/internal/theme-store.test.tsx`, `src/components/theme-switch/ThemeSwitch.tsx`, `ThemeScript.tsx`, `theme-script.ts`, `index.ts`, `ThemeSwitch.test.tsx`, `ThemeMenuGroup.test.tsx`, `ThemeScript.test.tsx`, `theme-script.test.ts`, `ThemeSwitch.test-d.ts`, `ThemeSwitch.stories.tsx`, `ThemeSwitch.mdx`, `src/styles/components/theme-switch.css`
- Modify: `src/internal/icons.tsx`, `src/internal/icons.test.tsx`, `src/components/user-menu/UserMenu.stories.tsx`, `.storybook/header-strip.tsx`, `.storybook/icons.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/contrast-exceptions.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/components/theme-switch/ThemeSwitch.tsx` (client), export qua `theme-switch/index.ts` và `src/index.ts`:
  - `ThemeSwitch`: `forwardRef<HTMLButtonElement, ThemeSwitchProps>`; `ref`, `className` và mọi prop của nút vào nút.
  - `ThemeMenuGroup`: `forwardRef<HTMLDivElement, ThemeMenuGroupProps>`; `ref` và mọi prop vào nhóm (`MenuRadioGroup`).
  - `ThemeValue = 'light' | 'dark' | 'system'` (export lại từ `theme-value.ts`).
  - `ThemeSwitchLabels = { light: string; dark: string; system: string; trigger: (current: string) => string; tooltip: (current: string, next: string) => string; hint: (next: string) => string }`, mặc định "Light", "Dark", "System", `` `Theme: ${c}` ``, `` `Theme: ${c} · click to switch to ${n}` ``, `` `Click to switch to ${n}` ``.
  - `ThemeSwitchProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby' | 'children' | 'value' | 'defaultValue' | 'asChild'> & { value?: ThemeValue; defaultValue?: ThemeValue; onValueChange?: (value: ThemeValue) => void; storageKey?: string; labels?: Partial<ThemeSwitchLabels> }`.
  - `ThemeMenuGroupLabels = { group: string; light: string; dark: string; system: string }`, mặc định "Theme", "Light", "Dark", "System".
  - `ThemeMenuGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'children'> & { value?, defaultValue?, onValueChange?, storageKey?, labels?: Partial<ThemeMenuGroupLabels> }`. Mặc định của cả hai: `defaultValue` `'system'`, `storageKey` `'flg-theme'`.
- Produces trong `src/components/theme-switch/ThemeScript.tsx` (server-safe, không hook, không `ref`): `ThemeScript({ storageKey, nonce }: ThemeScriptProps)`, `ThemeScriptProps = { storageKey?: string; nonce?: string }`. Render đúng một `<script nonce suppressHydrationWarning dangerouslySetInnerHTML>`.
- Nội bộ:
  - `src/components/theme-switch/theme-script.ts`: `themeScriptSource(storageKey = 'flg-theme'): string`, đúng chuỗi của spec §6.3, khoá qua `JSON.stringify` với mọi `<` thành `\u003c`. Không export từ gói.
  - `src/internal/theme-value.ts`: `ThemeValue`, `DEFAULT_THEME_STORAGE_KEY = 'flg-theme'`, `isThemeValue(value)`.
  - `src/internal/theme-store.ts`: `applyTheme(value)` (`light`/`dark` đặt `data-flg-theme` trên `<html>`, `system` bỏ nó); `useThemeValue({ value, defaultValue, onValueChange, storageKey }): [ThemeValue, (next: ThemeValue) => void]`.
  - `src/internal/icons.tsx`: `SunIcon`, `MoonIcon`, `MonitorIcon`.
- DOM: `ThemeSwitch`: `TooltipRoot describe={false}` > `IconButton.flg-theme-switch` (`aria-label` = `labels.trigger(labels[current])`, `aria-describedby` = id của gợi ý rồi của người gọi, `data-value`, `data-pending` khi uncontrolled và chưa có effect đầu tiên) > ba `svg.flg-theme-switch-icon[data-for="light"|"dark"|"system"]`; tooltip `side="bottom"`, `align="end"`, `sideOffset={17}`; sau gốc tooltip là `<span id hidden>` chứa `labels.hint(next)`. `ThemeMenuGroup`: `MenuRadioGroup` > `MenuLabel` + ba `MenuRadioItem` (`light`, `dark`, `system`; `textValue` là chữ) mỗi mục có `span.flg-theme-menu-icon[aria-hidden="true"]` ở cuối.
- CSS: `flg-theme-switch`, `flg-theme-switch-icon`, `flg-theme-menu-icon` (có trong `check-dist-css.ts`). `check-use-client.ts` thêm `src/components/theme-switch/ThemeSwitch.tsx`. `scripts/rsc-probe.mjs` thêm `ThemeScript with the default key` và `ThemeScript with a storageKey and a nonce` (probe nhận `check(tree)` và `className: undefined`).
- Không có cảnh báo dev mới (giá trị lạ đọc từ `localStorage` bị bỏ qua lặng lẽ).
- Helper của story: `.storybook/header-strip.tsx`: `HeaderWidgets`, `Strip`, `End` nhận khe `theme` (`undefined`: nút giữ chỗ; `null`: không gì); `.storybook/icons.tsx`: `PersonIcon`, `LogOutIcon`. Story: meta `title: 'Components/ThemeSwitch'`.
- Consumes: `IconButton`, `TooltipRoot`/`TooltipTrigger`/`TooltipContent`, `MenuRadioGroup`, `MenuLabel`, `MenuRadioItem`, `useWriteOnCommit`, `composeEventHandlers`, `joinIds`, `dataAttr`, `withDefaults`; trong story: `UserMenu` (Task 2), `App`, `End`.
- Task sau dùng: trang Examples (Task 4) có `ThemeSwitch`; hai fixture (Task 5) có `ThemeScript`, `ThemeSwitch`, `ThemeMenuGroup`; `scripts/lib/theme-script-copies.test.ts` (Task 5) gọi `themeScriptSource` và đọc khối ` ```html ` đầu tiên của `ThemeSwitch.mdx` có dạng `<script>` … `</script>`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/header-strip.tsx b/.storybook/header-strip.tsx
index 00f1bc3..ae611fd 100644
--- a/.storybook/header-strip.tsx
+++ b/.storybook/header-strip.tsx
@@ -46,16 +46,30 @@ const PLACEHOLDER_ACCOUNT = (
   </IconButton>
 );
 
-/** The widgets at the end of the header: the bell, the theme, and the account, `account` or a placeholder. */
-export function HeaderWidgets({ account = PLACEHOLDER_ACCOUNT }: { account?: ReactNode }) {
+/** The theme button of the mockup, until a story puts the real ThemeSwitch in its place. */
+const PLACEHOLDER_THEME = (
+  <IconButton variant="ghost" aria-label="Theme">
+    <Sun />
+  </IconButton>
+);
+
+/**
+ * The widgets at the end of the header: the bell, the theme and the account, each `theme` and `account`
+ * or a placeholder.
+ */
+export function HeaderWidgets({
+  account = PLACEHOLDER_ACCOUNT,
+  theme = PLACEHOLDER_THEME,
+}: {
+  account?: ReactNode;
+  theme?: ReactNode;
+}) {
   return (
     <>
       <IconButton variant="ghost" aria-label="Notifications">
         <BellIcon />
       </IconButton>
-      <IconButton variant="ghost" aria-label="Theme">
-        <Sun />
-      </IconButton>
+      {theme}
       {account}
     </>
   );
@@ -79,6 +93,7 @@ export function Strip({
   caption,
   children,
   end,
+  theme,
   account,
 }: {
   caption: string;
@@ -86,6 +101,8 @@ export function Strip({
   children?: ReactNode;
   /** What stands in the end cluster, before the widgets. */
   end?: ReactNode;
+  /** What stands in the place of the theme button, the widget before the account. */
+  theme?: ReactNode;
   /** What stands in the place of the avatar button, the last widget. */
   account?: ReactNode;
 }) {
@@ -126,7 +143,7 @@ export function Strip({
         {children}
         <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
           {end}
-          <HeaderWidgets account={account} />
+          <HeaderWidgets theme={theme} account={account} />
         </div>
       </Surface>
     </div>
@@ -153,11 +170,19 @@ export const App = ({ header, layout }: { header: ReactNode; layout?: AppShellLa
 );
 
 /** The widgets that follow the search in the header, on the right: a cluster that has no `position`. */
-export const End = ({ children, account }: { children?: ReactNode; account?: ReactNode }) => (
+export const End = ({
+  children,
+  theme,
+  account,
+}: {
+  children?: ReactNode;
+  theme?: ReactNode;
+  account?: ReactNode;
+}) => (
   // `minWidth: 0`: a wrapper is as wide as what is in it unless it may be narrower, and then the name
   // of a UserMenu cannot give way in a header that is too narrow.
   <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', minWidth: 0 }}>
     {children}
-    <HeaderWidgets account={account} />
+    <HeaderWidgets theme={theme} account={account} />
   </div>
 );
diff --git a/.storybook/icons.tsx b/.storybook/icons.tsx
index af89a0d..96d6afc 100644
--- a/.storybook/icons.tsx
+++ b/.storybook/icons.tsx
@@ -126,3 +126,24 @@ export function BellIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+/** The head and shoulders of a person: "Profile" in the menu of a user. */
+export function PersonIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <circle cx="12" cy="8" r="4" />
+      <path d="M4 21a8 8 0 0 1 16 0" />
+    </svg>
+  );
+}
+
+/** An arrow leaving a door: "Log out" in the menu of a user. */
+export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
+      <path d="m16 17 5-5-5-5" />
+      <path d="M21 12H9" />
+    </svg>
+  );
+}
diff --git a/src/components/theme-switch/ThemeMenuGroup.test.tsx b/src/components/theme-switch/ThemeMenuGroup.test.tsx
new file mode 100644
index 0000000..b3117a9
--- /dev/null
+++ b/src/components/theme-switch/ThemeMenuGroup.test.tsx
@@ -0,0 +1,197 @@
+import { act, render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef } from 'react';
+import type { Ref } from 'react';
+import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import {
+  DropdownMenu,
+  DropdownMenuContent,
+  DropdownMenuTrigger,
+} from '../dropdown-menu/DropdownMenu';
+import { ThemeMenuGroup, ThemeSwitch } from './ThemeSwitch';
+import type { ThemeMenuGroupProps } from './ThemeSwitch';
+
+// jsdom has no Popover API; the menu needs a stand-in to be in the page.
+// Nor does it scroll an item into view.
+const original = {
+  showPopover: HTMLElement.prototype.showPopover,
+  hidePopover: HTMLElement.prototype.hidePopover,
+  scrollIntoView: Element.prototype.scrollIntoView,
+};
+beforeAll(() => {
+  HTMLElement.prototype.showPopover = () => {};
+  HTMLElement.prototype.hidePopover = () => {};
+  Element.prototype.scrollIntoView = () => {};
+});
+afterAll(() => Object.assign(HTMLElement.prototype, original));
+
+function Menu(props: ThemeMenuGroupProps & { groupRef?: Ref<HTMLDivElement> }) {
+  const { groupRef, ...rest } = props;
+  return (
+    <DropdownMenu defaultOpen>
+      <DropdownMenuTrigger>Account</DropdownMenuTrigger>
+      <DropdownMenuContent>
+        <ThemeMenuGroup ref={groupRef} {...rest} />
+      </DropdownMenuContent>
+    </DropdownMenu>
+  );
+}
+
+const group = () => screen.getByRole('group', { hidden: true });
+const items = () => within(group()).getAllByRole('menuitemradio', { hidden: true });
+const item = (name: string) => within(group()).getByRole('menuitemradio', { name, hidden: true });
+const html = () => document.documentElement.getAttribute('data-flg-theme');
+
+describe('ThemeMenuGroup', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => {
+    vi.restoreAllMocks();
+    localStorage.clear();
+    document.documentElement.removeAttribute('data-flg-theme');
+    document.body.replaceChildren();
+  });
+
+  describe('the group', () => {
+    it('is named "Theme" by its title, and has Light, Dark and System, in that order', () => {
+      render(<Menu />);
+      expect(group()).toHaveAccessibleName('Theme');
+      expect(items().map((element) => element.textContent)).toEqual(['Light', 'Dark', 'System']);
+    });
+
+    it('has the stored value chosen, and System when nothing is stored', () => {
+      localStorage.setItem('flg-theme', 'dark');
+      const { unmount } = render(<Menu />);
+      expect(items().map((element) => element.getAttribute('aria-checked'))).toEqual([
+        'false',
+        'true',
+        'false',
+      ]);
+      unmount();
+      localStorage.clear();
+      document.documentElement.removeAttribute('data-flg-theme');
+      render(<Menu />);
+      expect(item('System')).toHaveAttribute('aria-checked', 'true');
+    });
+
+    it('has an icon at the end of each item, hidden, and the name of an item is its word alone', () => {
+      render(<Menu />);
+      for (const [index, name] of ['Light', 'Dark', 'System'].entries()) {
+        const icon = items()[index]!.querySelector<HTMLElement>('.flg-theme-menu-icon')!;
+        expect(icon).toHaveAttribute('aria-hidden', 'true');
+        expect(icon.querySelector('svg')).not.toBeNull();
+        expect(item(name)).toBeDefined();
+      }
+      // The sun, the moon and the screen.
+      expect(
+        items().map((element) => element.querySelector('.flg-theme-menu-icon svg')?.innerHTML),
+      ).toEqual([
+        expect.stringContaining('<circle'),
+        expect.stringMatching(/^<path d="M12 3a6/),
+        expect.stringContaining('<rect'),
+      ]);
+    });
+
+    it('takes its words from labels, and keeps the default for one given as undefined', () => {
+      render(
+        <Menu labels={{ group: 'Giao diện', light: 'Sáng', dark: 'Tối', system: undefined }} />,
+      );
+      expect(group()).toHaveAccessibleName('Giao diện');
+      expect(items().map((element) => element.textContent)).toEqual(['Sáng', 'Tối', 'System']);
+    });
+
+    it('passes className and data attributes to the group, and ref points to it', () => {
+      const ref = createRef<HTMLDivElement>();
+      render(<Menu groupRef={ref} className="mine" data-x="1" />);
+      expect(ref.current).toBe(group());
+      expect(group()).toHaveClass('mine');
+      expect(group()).toHaveAttribute('data-x', '1');
+    });
+  });
+
+  describe('choosing', () => {
+    it('stores the choice, puts it on <html>, closes the menu and reports it', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      render(<Menu onValueChange={onValueChange} />);
+      expect(screen.getByRole('button', { name: 'Account' })).toHaveAttribute(
+        'aria-expanded',
+        'true',
+      );
+      await user.click(item('Dark'));
+      expect(localStorage.getItem('flg-theme')).toBe('dark');
+      expect(html()).toBe('dark');
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
+      expect(screen.getByRole('button', { name: 'Account' })).toHaveAttribute(
+        'aria-expanded',
+        'false',
+      );
+    });
+
+    it('chooses with the keyboard, Enter on the item that has the focus', async () => {
+      const user = userEvent.setup();
+      render(<Menu />);
+      act(() => item('Light').focus());
+      await user.keyboard('{Enter}');
+      expect(html()).toBe('light');
+      expect(localStorage.getItem('flg-theme')).toBe('light');
+    });
+
+    it('goes under its storageKey', async () => {
+      const user = userEvent.setup();
+      render(<Menu storageKey="my-theme" />);
+      await user.click(item('Dark'));
+      expect(localStorage.getItem('my-theme')).toBe('dark');
+      expect(localStorage.getItem('flg-theme')).toBeNull();
+    });
+
+    it('keeps its choice when the menu is opened again', async () => {
+      const user = userEvent.setup();
+      render(
+        <DropdownMenu>
+          <DropdownMenuTrigger>Account</DropdownMenuTrigger>
+          <DropdownMenuContent>
+            <ThemeMenuGroup />
+          </DropdownMenuContent>
+        </DropdownMenu>,
+      );
+      await user.click(screen.getByRole('button', { name: 'Account' }));
+      await user.click(item('Dark'));
+      await user.click(screen.getByRole('button', { name: 'Account' }));
+      expect(item('Dark')).toHaveAttribute('aria-checked', 'true');
+    });
+  });
+
+  describe('controlled', () => {
+    it('shows the value it is given and reports a choice, and never touches <html> or localStorage', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      const set = vi.spyOn(Storage.prototype, 'setItem');
+      render(<Menu value="light" onValueChange={onValueChange} />);
+      expect(item('Light')).toHaveAttribute('aria-checked', 'true');
+      await user.click(item('System'));
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('system');
+      expect(set).not.toHaveBeenCalled();
+      expect(html()).toBeNull();
+    });
+  });
+
+  describe('with a ThemeSwitch of the same key', () => {
+    it('agrees with it, whichever of the two is used', async () => {
+      const user = userEvent.setup();
+      render(
+        <>
+          <ThemeSwitch defaultValue="light" />
+          <Menu defaultValue="light" />
+        </>,
+      );
+      const switcher = screen.getByRole('button', { name: /^Theme:/ });
+      expect(switcher).toHaveAccessibleName('Theme: Light');
+      await user.click(switcher);
+      expect(switcher).toHaveAccessibleName('Theme: Dark');
+      expect(item('Dark')).toHaveAttribute('aria-checked', 'true');
+      await user.click(item('System'));
+      expect(switcher).toHaveAccessibleName('Theme: System');
+    });
+  });
+});
diff --git a/src/components/theme-switch/ThemeScript.test.tsx b/src/components/theme-switch/ThemeScript.test.tsx
new file mode 100644
index 0000000..315c0a6
--- /dev/null
+++ b/src/components/theme-switch/ThemeScript.test.tsx
@@ -0,0 +1,52 @@
+import { act } from '@testing-library/react';
+import { hydrateRoot } from 'react-dom/client';
+import { renderToStaticMarkup, renderToString } from 'react-dom/server';
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import { ThemeScript } from './ThemeScript';
+import { themeScriptSource } from './theme-script';
+
+describe('ThemeScript', () => {
+  afterEach(() => vi.restoreAllMocks());
+
+  it('renders exactly one <script>, with the source of the default key', () => {
+    expect(renderToStaticMarkup(<ThemeScript />)).toBe(
+      `<script>${themeScriptSource('flg-theme')}</script>`,
+    );
+  });
+
+  it('renders the source as it is, not as text: its quotes are not escaped', () => {
+    const markup = renderToStaticMarkup(<ThemeScript storageKey="my-key" />);
+    expect(markup).toContain('("my-key")');
+    expect(markup).not.toContain('&quot;');
+  });
+
+  it('puts the nonce on the tag, and has no attribute without one', () => {
+    expect(renderToStaticMarkup(<ThemeScript nonce="abc123" />)).toMatch(
+      /^<script nonce="abc123">/,
+    );
+    expect(renderToStaticMarkup(<ThemeScript />)).not.toContain('nonce');
+  });
+
+  it('cannot be closed early by a key that holds a tag', () => {
+    const markup = renderToStaticMarkup(<ThemeScript storageKey="</script><b>" />);
+    expect(markup.match(/<\/script>/g)).toHaveLength(1);
+    expect(markup.endsWith('</script>')).toBe(true);
+  });
+
+  it('hydrates without a warning when the browser has hidden the nonce, as it does after it ran the script', async () => {
+    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
+    const container = document.createElement('div');
+    container.innerHTML = renderToString(<ThemeScript nonce="abc123" />);
+    // The browser keeps the value in the property and takes it out of the attribute, so that a
+    // script of the page cannot read it.
+    container.querySelector('script')!.removeAttribute('nonce');
+    document.body.append(container);
+    let root!: ReturnType<typeof hydrateRoot>;
+    await act(async () => {
+      root = hydrateRoot(container, <ThemeScript nonce="abc123" />);
+    });
+    expect(error).not.toHaveBeenCalled();
+    act(() => root.unmount());
+    container.remove();
+  });
+});
diff --git a/src/components/theme-switch/ThemeSwitch.stories.tsx b/src/components/theme-switch/ThemeSwitch.stories.tsx
new file mode 100644
index 0000000..98c3df5
--- /dev/null
+++ b/src/components/theme-switch/ThemeSwitch.stories.tsx
@@ -0,0 +1,453 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { createRoot, hydrateRoot } from 'react-dom/client';
+import { renderToString } from 'react-dom/server';
+import { expect, userEvent, waitFor, within } from 'storybook/test';
+import { GearIcon, LogOutIcon, PersonIcon } from '../../../.storybook/icons';
+import { App, End, Strip, strips } from '../../../.storybook/header-strip';
+import { settled } from '../../../.storybook/real-input';
+import { Avatar } from '../avatar/Avatar';
+import {
+  DropdownMenu,
+  DropdownMenuContent,
+  DropdownMenuTrigger,
+} from '../dropdown-menu/DropdownMenu';
+import { MenuItem, MenuSeparator } from '../menu/Menu';
+import { UserMenu } from '../user-menu/UserMenu';
+import { ThemeScript } from './ThemeScript';
+// Named for what they are in the stories: the stories called `ThemeSwitch` and `ThemeMenuGroup` are the looks.
+import { ThemeMenuGroup as Group, ThemeSwitch as Switch } from './ThemeSwitch';
+
+const meta = {
+  title: 'Components/ThemeSwitch',
+  component: Switch,
+} satisfies Meta<typeof Switch>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+// ---------------------------------------------------------------------------------------------------
+// Looks. Every one of them is controlled (`value`): the page is not changed, and each state is drawn
+// whatever the theme of the story is ("the chosen value is drawn independently of the theme of the
+// cell", as the mockup says). The header of the T3 ones has no theme button: the theme is in the menu.
+
+/**
+ * T1: the button that goes round the themes, with the icon of the value it has (the sun, the moon, the
+ * screen), and under the pointer the fill of a ghost button and the tooltip, which says the value and
+ * the one a click goes to. The tooltip below it is 6px under the header. The state with the focus of the
+ * keyboard is the next story: only one tooltip shows at a time, and the pointer has it here.
+ */
+export const ThemeSwitch: Story = {
+  render: () => (
+    <div style={{ ...strips, paddingBottom: 40 }}>
+      <Strip caption="Light: the sun" theme={<Switch value="light" />} />
+      <Strip caption="Dark: the moon" theme={<Switch value="dark" />} />
+      <Strip caption="System: the screen" theme={<Switch value="system" />} />
+      <Strip
+        caption="Under the pointer: the fill of the button and the tooltip"
+        theme={<Switch value="light" data-visual-hover="tooltip" />}
+      />
+    </div>
+  ),
+};
+
+/** T1 with the focus of the keyboard: the ring of the focus, and the tooltip, which a focus shows too. */
+export const ThemeSwitchFocus: Story = {
+  render: () => (
+    <div style={{ ...strips, paddingBottom: 40 }}>
+      <Strip caption="Keyboard focus: the ring and the tooltip" theme={<Switch value="light" />} />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const button = within(canvasElement).getByRole('button', { name: 'Theme: Light' });
+    button.focus();
+    await expect(button).toHaveFocus();
+    // The tooltip opens a task after the focus, so the shot waits for it.
+    const tooltip = canvasElement.ownerDocument.querySelector<HTMLElement>('[role="tooltip"]')!;
+    await waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));
+    await settled(tooltip);
+  },
+};
+
+const ITEMS = [
+  <MenuItem key="profile" icon={<PersonIcon width={15} height={15} />}>
+    Profile
+  </MenuItem>,
+  <MenuItem key="settings" icon={<GearIcon width={15} height={15} />}>
+    Settings
+  </MenuItem>,
+];
+
+/**
+ * T3: the group in the menu of a UserMenu, which is open: Light chosen, with its dot, and Dark under the
+ * keyboard, which has the fill of a menu item. The icon at the end of each item is muted, and takes the
+ * colour of the item that is lit. Drawn in a real header, as the menu is a popover of the page.
+ */
+export const ThemeMenuGroup: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: { stage: 'page' },
+  render: () => (
+    <App
+      header={
+        <End
+          theme={null}
+          account={
+            <UserMenu
+              name="Minh Anh Nguyen"
+              description="minhanh@lumen.vn"
+              avatar={{ fallback: 'MA' }}
+              defaultOpen
+            >
+              {ITEMS}
+              <MenuSeparator />
+              <Group value="light" />
+              <MenuSeparator />
+              <MenuItem icon={<LogOutIcon width={15} height={15} />}>Log out</MenuItem>
+            </UserMenu>
+          }
+        />
+      }
+    />
+  ),
+  play: async ({ canvasElement }) => {
+    const menu = within(canvasElement).getByRole('menu');
+    await settled(menu);
+    const dark = within(menu).getByRole('menuitemradio', { name: 'Dark' });
+    dark.focus();
+    await expect(dark).toHaveFocus();
+  },
+};
+
+/** A menu that holds only the Theme group, open under a button of the header, with `value` chosen. */
+const themeOnly =
+  (value: 'dark' | 'system'): Story['render'] =>
+  () => (
+    <App
+      header={
+        <End
+          theme={null}
+          account={
+            <DropdownMenu defaultOpen>
+              <DropdownMenuTrigger
+                variant="ghost"
+                data-icon-only=""
+                aria-label="Appearance"
+                style={{ borderRadius: 'var(--flg-radius-full)' }}
+              >
+                <Avatar alt="" fallback="MA" size="sm" />
+              </DropdownMenuTrigger>
+              <DropdownMenuContent align="end" sideOffset={17}>
+                <Group value={value} />
+              </DropdownMenuContent>
+            </DropdownMenu>
+          }
+        />
+      }
+    />
+  );
+
+/** T3 with Dark chosen: the menu holds only the Theme part. */
+export const ThemeMenuGroupDark: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: { stage: 'page' },
+  render: themeOnly('dark'),
+  play: async ({ canvasElement }) => {
+    await settled(within(canvasElement).getByRole('menu'));
+  },
+};
+
+/** T3 with System chosen. */
+export const ThemeMenuGroupSystem: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: { stage: 'page' },
+  render: themeOnly('system'),
+  play: async ({ canvasElement }) => {
+    await settled(within(canvasElement).getByRole('menu'));
+  },
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it. They leave the
+// page as they found it: `<html>` and the keys of `localStorage` that they used.
+
+const ATTRIBUTE = 'data-flg-theme';
+
+/** Runs `run` and puts `<html>` back as it was, with the keys it used gone from `localStorage`. */
+async function leavingThePageAsItWas(keys: string[], run: () => Promise<void>): Promise<void> {
+  const root = document.documentElement;
+  const before = root.getAttribute(ATTRIBUTE);
+  for (const key of keys) localStorage.removeItem(key);
+  try {
+    await run();
+  } finally {
+    for (const key of keys) localStorage.removeItem(key);
+    if (before === null) root.removeAttribute(ATTRIBUTE);
+    else root.setAttribute(ATTRIBUTE, before);
+  }
+}
+
+const html = () => document.documentElement.getAttribute(ATTRIBUTE);
+
+/** The icons of a button that the CSS shows, by the value they stand for. */
+const visibleIcons = (button: HTMLElement) =>
+  [...button.querySelectorAll<SVGElement>('.flg-theme-switch-icon')]
+    .filter((icon) => getComputedStyle(icon).display !== 'none')
+    .map((icon) => icon.getAttribute('data-for'));
+
+const CHANGES_KEY = 'flg-story-theme-changes';
+
+/**
+ * A click of the switch puts the theme on `<html>` and in `localStorage`, round light, dark, system; a
+ * choice in the menu group does the same, and the switch follows it.
+ */
+export const ChangesTheHtml: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={strips}>
+      <Strip
+        caption="Strip"
+        theme={<Switch storageKey={CHANGES_KEY} defaultValue="light" />}
+        account={
+          <DropdownMenu>
+            <DropdownMenuTrigger variant="ghost">Menu</DropdownMenuTrigger>
+            <DropdownMenuContent>
+              <Group storageKey={CHANGES_KEY} defaultValue="light" />
+            </DropdownMenuContent>
+          </DropdownMenu>
+        }
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    await leavingThePageAsItWas([CHANGES_KEY], async () => {
+      const canvas = within(canvasElement);
+      const button = canvas.getByRole('button', { name: /^Theme:/ });
+      // Nothing is stored: the default value is what the page has, and it is on `<html>` after mount.
+      await waitFor(() => expect(html()).toBe('light'));
+      await expect(button).toHaveAccessibleName('Theme: Light');
+      await expect(button).not.toHaveAttribute('data-pending');
+
+      await userEvent.click(button);
+      await expect(html()).toBe('dark');
+      await expect(localStorage.getItem(CHANGES_KEY)).toBe('dark');
+      await expect(button).toHaveAccessibleName('Theme: Dark');
+      await userEvent.click(button);
+      await expect(html()).toBeNull();
+      await expect(localStorage.getItem(CHANGES_KEY)).toBe('system');
+      await userEvent.click(button);
+      await expect(html()).toBe('light');
+
+      // The group is the same store: its choice moves the switch. The press on the switch closed the
+      // menu, which was open: it is opened again.
+      await userEvent.click(canvas.getByRole('button', { name: 'Menu' }));
+      const menu = await canvas.findByRole('menu');
+      await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Dark' }));
+      await expect(html()).toBe('dark');
+      await expect(button).toHaveAccessibleName('Theme: Dark');
+    });
+  },
+};
+
+const SYNC_KEY = 'flg-story-theme-sync';
+
+/**
+ * Two shells on one page agree: two switches and a menu group of one key follow one another. A page of
+ * the same origin that changes the key (a `storage` event, which a document does not hear of its own
+ * writes) moves all of them, and <html>; so does removing the key, which is the system's choice.
+ */
+export const TwoShellsStayInSync: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={strips}>
+      <Strip caption="First shell" theme={<Switch storageKey={SYNC_KEY} defaultValue="light" />} />
+      <Strip
+        caption="Second shell"
+        theme={<Switch storageKey={SYNC_KEY} defaultValue="light" />}
+        account={
+          <DropdownMenu>
+            <DropdownMenuTrigger variant="ghost">Menu</DropdownMenuTrigger>
+            <DropdownMenuContent>
+              <Group storageKey={SYNC_KEY} defaultValue="light" />
+            </DropdownMenuContent>
+          </DropdownMenu>
+        }
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    await leavingThePageAsItWas([SYNC_KEY], async () => {
+      const canvas = within(canvasElement);
+      const [first, second] = canvas.getAllByRole('button', { name: /^Theme:/ }) as [
+        HTMLElement,
+        HTMLElement,
+      ];
+      const checked = () =>
+        within(canvasElement)
+          .getAllByRole('menuitemradio', { hidden: true })
+          .find((item) => item.getAttribute('aria-checked') === 'true')?.textContent;
+      await waitFor(() => expect(checked()).toBe('Light'));
+
+      await userEvent.click(first);
+      await expect(second).toHaveAccessibleName('Theme: Dark');
+      await expect(checked()).toBe('Dark');
+
+      // Another document of the same origin: a frame with no page of its own.
+      const frame = document.createElement('iframe');
+      frame.hidden = true;
+      document.body.append(frame);
+      try {
+        const other = frame.contentWindow!.localStorage;
+        other.setItem(SYNC_KEY, 'light');
+        await waitFor(() => expect(second).toHaveAccessibleName('Theme: Light'));
+        await expect(first).toHaveAccessibleName('Theme: Light');
+        await expect(checked()).toBe('Light');
+        await expect(html()).toBe('light');
+        other.removeItem(SYNC_KEY);
+        await waitFor(() => expect(second).toHaveAccessibleName('Theme: System'));
+        await expect(checked()).toBe('System');
+        await expect(html()).toBeNull();
+      } finally {
+        frame.remove();
+      }
+    });
+  },
+};
+
+const HYDRATION_KEY = 'flg-story-theme-hydration';
+
+/**
+ * The icon is right before hydration. The server's HTML (`ThemeScript` and a `ThemeSwitch`, rendered to a
+ * string) shows the default value, with `data-pending`; the script puts the stored theme on `<html>`
+ * first, and the CSS picks the icon from there, so the right one is already drawn when React takes over,
+ * and it stays when the button learns its value and drops `data-pending`.
+ */
+export const IconBeforeHydration: Story = {
+  tags: ['no-visual'],
+  render: () => <div />,
+  play: async ({ canvasElement }) => {
+    await leavingThePageAsItWas([HYDRATION_KEY], async () => {
+      const cases: Array<[stored: string | null, icon: string, name: string]> = [
+        ['dark', 'dark', 'Theme: Dark'],
+        ['light', 'light', 'Theme: Light'],
+        ['system', 'system', 'Theme: System'],
+        [null, 'system', 'Theme: System'],
+      ];
+      for (const [stored, icon, name] of cases) {
+        if (stored === null) localStorage.removeItem(HYDRATION_KEY);
+        else localStorage.setItem(HYDRATION_KEY, stored);
+        // A page that has not been touched yet, as the browser parses it.
+        document.documentElement.removeAttribute(ATTRIBUTE);
+        const app = (
+          <>
+            <ThemeScript storageKey={HYDRATION_KEY} />
+            <Switch storageKey={HYDRATION_KEY} />
+          </>
+        );
+        const container = document.createElement('div');
+        canvasElement.append(container);
+        container.innerHTML = renderToString(app);
+        const button = within(container).getByRole('button');
+        try {
+          // The server knows nothing of the stored theme.
+          await expect(button).toHaveAttribute('data-pending');
+          await expect(button).toHaveAccessibleName('Theme: System');
+          await expect(visibleIcons(button)).toEqual(['system']);
+
+          // The browser runs the script as it parses it, before the first paint.
+          const script = document.createElement('script');
+          script.textContent = container.querySelector('script')!.textContent;
+          document.head.append(script);
+          script.remove();
+          await expect(visibleIcons(button)).toEqual([icon]);
+
+          const root = hydrateRoot(container, app);
+          try {
+            await waitFor(() => expect(button).not.toHaveAttribute('data-pending'));
+            await expect(button).toHaveAccessibleName(name);
+            await expect(button).toHaveAttribute('data-value', icon);
+            await expect(visibleIcons(button)).toEqual([icon]);
+          } finally {
+            root.unmount();
+          }
+        } finally {
+          container.remove();
+        }
+      }
+    });
+  },
+};
+
+const BLOCKED_KEY = 'flg-story-theme-blocked';
+
+/** Makes every read and write of `localStorage` throw, as it does where site data is blocked. */
+function blockStorage(): () => void {
+  const { getItem, setItem } = Storage.prototype;
+  const refuse = () => {
+    throw new DOMException('Blocked', 'SecurityError');
+  };
+  Storage.prototype.getItem = refuse;
+  Storage.prototype.setItem = refuse;
+  return () => {
+    Storage.prototype.getItem = getItem;
+    Storage.prototype.setItem = setItem;
+  };
+}
+
+/** `localStorage` that throws: the switch still works, and the theme lives in the page. */
+export const WorksWhenLocalStorageThrows: Story = {
+  tags: ['no-visual'],
+  render: () => <div />,
+  play: async ({ canvasElement }) => {
+    await leavingThePageAsItWas([BLOCKED_KEY], async () => {
+      const container = document.createElement('div');
+      canvasElement.append(container);
+      const root = createRoot(container);
+      const restore = blockStorage();
+      try {
+        // `<html>` is the only thing there is to read.
+        document.documentElement.setAttribute(ATTRIBUTE, 'dark');
+        root.render(<Switch storageKey={BLOCKED_KEY} />);
+        const button = await within(container).findByRole('button', { name: 'Theme: Dark' });
+
+        await userEvent.click(button);
+        await expect(button).toHaveAccessibleName('Theme: System');
+        await expect(html()).toBeNull();
+        await userEvent.click(button);
+        await expect(button).toHaveAccessibleName('Theme: Light');
+        await expect(html()).toBe('light');
+      } finally {
+        restore();
+        root.unmount();
+        container.remove();
+      }
+    });
+  },
+};
+
+/**
+ * The tooltip opens under the button, 17px from it (6px under a header of 56px), lined up with its end,
+ * and is not what describes the button: the hint is, so that a screen reader does not say it twice.
+ */
+export const TooltipUnderTheButton: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ ...strips, paddingBottom: 60 }}>
+      <Strip caption="Strip" theme={<Switch value="light" />} />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const button = within(canvasElement).getByRole('button', { name: 'Theme: Light' });
+    button.focus();
+    const tooltip = canvasElement.ownerDocument.querySelector<HTMLElement>('[role="tooltip"]')!;
+    await waitFor(() => expect(tooltip.matches(':popover-open')).toBe(true));
+    await settled(tooltip);
+    await expect(tooltip).toHaveTextContent('Theme: Light · click to switch to Dark');
+
+    const trigger = button.getBoundingClientRect();
+    const box = tooltip.getBoundingClientRect();
+    await expect(Math.abs(box.top - trigger.bottom - 17)).toBeLessThan(1.5);
+    await expect(Math.abs(box.right - trigger.right)).toBeLessThan(1.5);
+
+    await expect(button.getAttribute('aria-describedby')).not.toContain(tooltip.id);
+    await expect(button).toHaveAccessibleDescription('Click to switch to Dark');
+  },
+};
diff --git a/src/components/theme-switch/ThemeSwitch.test-d.ts b/src/components/theme-switch/ThemeSwitch.test-d.ts
new file mode 100644
index 0000000..640b6dd
--- /dev/null
+++ b/src/components/theme-switch/ThemeSwitch.test-d.ts
@@ -0,0 +1,61 @@
+import { expectTypeOf, test } from 'vitest';
+import type { ThemeMenuGroupProps, ThemeScriptProps, ThemeSwitchProps, ThemeValue } from './index';
+
+test('the theme is one of three words', () => {
+  expectTypeOf<ThemeValue>().toEqualTypeOf<'light' | 'dark' | 'system'>();
+  expectTypeOf<ThemeSwitchProps['value']>().toEqualTypeOf<ThemeValue | undefined>();
+  expectTypeOf<ThemeSwitchProps['defaultValue']>().toEqualTypeOf<ThemeValue | undefined>();
+  expectTypeOf<ThemeMenuGroupProps['value']>().toEqualTypeOf<ThemeValue | undefined>();
+  expectTypeOf<ThemeSwitchProps['onValueChange']>().toEqualTypeOf<
+    ((value: ThemeValue) => void) | undefined
+  >();
+  // @ts-expect-error a theme the library does not know
+  const sepia: ThemeSwitchProps = { value: 'sepia' };
+  // @ts-expect-error nor as the theme of the menu group
+  const sepiaGroup: ThemeMenuGroupProps = { defaultValue: 'sepia' };
+  expectTypeOf(sepia).toBeObject();
+  expectTypeOf(sepiaGroup).toBeObject();
+});
+
+test('the name of the switch is made by labels.trigger, never passed in', () => {
+  // @ts-expect-error the name of the button comes from labels.trigger
+  const label: ThemeSwitchProps = { 'aria-label': 'Theme' };
+  // @ts-expect-error nor from another element
+  const labelledby: ThemeSwitchProps = { 'aria-labelledby': 'x' };
+  expectTypeOf(label).toBeObject();
+  expectTypeOf(labelledby).toBeObject();
+});
+
+test('the content of the switch is its three icons, and it is not a slot', () => {
+  // @ts-expect-error the icons are the library's
+  const children: ThemeSwitchProps = { children: 'Theme' };
+  // @ts-expect-error a slot would replace the button that the icons are in
+  const asChild: ThemeSwitchProps = { asChild: true };
+  expectTypeOf(children).toBeObject();
+  expectTypeOf(asChild).toBeObject();
+});
+
+test('the words of the switch and of the menu group are all optional, and some are functions', () => {
+  expectTypeOf<NonNullable<ThemeSwitchProps['labels']>['trigger']>().toEqualTypeOf<
+    ((current: string) => string) | undefined
+  >();
+  expectTypeOf<NonNullable<ThemeSwitchProps['labels']>['tooltip']>().toEqualTypeOf<
+    ((current: string, next: string) => string) | undefined
+  >();
+  expectTypeOf<NonNullable<ThemeSwitchProps['labels']>['hint']>().toEqualTypeOf<
+    ((next: string) => string) | undefined
+  >();
+  expectTypeOf<NonNullable<ThemeMenuGroupProps['labels']>['group']>().toEqualTypeOf<
+    string | undefined
+  >();
+});
+
+test('the menu group has its own items', () => {
+  // @ts-expect-error the three items are the library's
+  const children: ThemeMenuGroupProps = { children: null };
+  expectTypeOf(children).toBeObject();
+});
+
+test('ThemeScript takes a key and a nonce, and nothing else', () => {
+  expectTypeOf<ThemeScriptProps>().toEqualTypeOf<{ storageKey?: string; nonce?: string }>();
+});
diff --git a/src/components/theme-switch/ThemeSwitch.test.tsx b/src/components/theme-switch/ThemeSwitch.test.tsx
new file mode 100644
index 0000000..05e4dfd
--- /dev/null
+++ b/src/components/theme-switch/ThemeSwitch.test.tsx
@@ -0,0 +1,316 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef } from 'react';
+import { hydrateRoot } from 'react-dom/client';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
+import { ThemeSwitch } from './ThemeSwitch';
+
+// jsdom has no Popover API: which popovers show is kept here, for the tooltip.
+const showing = new Set<Element>();
+const original = {
+  showPopover: HTMLElement.prototype.showPopover,
+  hidePopover: HTMLElement.prototype.hidePopover,
+  matches: Element.prototype.matches,
+};
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
+  vi.useRealTimers();
+  localStorage.clear();
+  document.documentElement.removeAttribute('data-flg-theme');
+  document.body.replaceChildren();
+});
+
+const button = () => screen.getByRole('button');
+const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]')!;
+const html = () => document.documentElement.getAttribute('data-flg-theme');
+
+describe('ThemeSwitch', () => {
+  describe('the button', () => {
+    it('is a ghost icon button of the library, named "Theme: <value>", with System as the default', () => {
+      render(<ThemeSwitch />);
+      expect(button()).toHaveClass('flg-button', 'flg-theme-switch');
+      expect(button()).toHaveAttribute('data-variant', 'ghost');
+      expect(button()).toHaveAttribute('data-size', 'md');
+      expect(button()).toHaveAttribute('data-icon-only');
+      expect(button()).toHaveAttribute('type', 'button');
+      expect(button()).toHaveAccessibleName('Theme: System');
+      expect(button()).toHaveAttribute('data-value', 'system');
+    });
+
+    it('has the three icons in the DOM, all hidden, for the CSS to choose from', () => {
+      render(<ThemeSwitch />);
+      const icons = [...button().querySelectorAll<SVGElement>('svg.flg-theme-switch-icon')];
+      expect(icons.map((icon) => icon.getAttribute('data-for'))).toEqual([
+        'light',
+        'dark',
+        'system',
+      ]);
+      for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true');
+    });
+
+    it('goes round light, dark, system, light, and says the value it has each time', async () => {
+      const user = userEvent.setup();
+      render(<ThemeSwitch defaultValue="light" />);
+      const seen: Array<[string | null, string | null]> = [];
+      for (let i = 0; i < 4; i++) {
+        seen.push([button().getAttribute('aria-label'), html()]);
+        await user.click(button());
+      }
+      expect(seen).toEqual([
+        // Nothing is stored, so the default value is what the page gets, as the value of a first visit.
+        ['Theme: Light', 'light'],
+        ['Theme: Dark', 'dark'],
+        ['Theme: System', null],
+        ['Theme: Light', 'light'],
+      ]);
+    });
+
+    it('takes its words from labels, and keeps the default for one given as undefined', () => {
+      const { rerender } = render(
+        <ThemeSwitch
+          value="dark"
+          labels={{
+            dark: 'Tối',
+            trigger: (current) => `Giao diện: ${current}`,
+            hint: (next) => `Bấm để đổi sang ${next}`,
+          }}
+        />,
+      );
+      expect(button()).toHaveAccessibleName('Giao diện: Tối');
+      // The next value is said with the word for it, which here is the default.
+      expect(button()).toHaveAccessibleDescription('Bấm để đổi sang System');
+      rerender(<ThemeSwitch value="dark" labels={{ trigger: undefined, dark: undefined }} />);
+      expect(button()).toHaveAccessibleName('Theme: Dark');
+    });
+
+    it('is described by a hidden hint that names the next value, and by that only', () => {
+      render(<ThemeSwitch value="light" />);
+      expect(button()).toHaveAccessibleDescription('Click to switch to Dark');
+      const hint = document.getElementById(button().getAttribute('aria-describedby')!)!;
+      expect(hint).toHaveAttribute('hidden');
+      expect(hint).toHaveTextContent('Click to switch to Dark');
+      // The tooltip says the same and more: it must not be read as a second description.
+      expect(button().getAttribute('aria-describedby')).not.toContain(tooltip().id);
+    });
+
+    it('keeps the aria-describedby of the caller after the hint', () => {
+      render(
+        <>
+          <p id="own">Mine</p>
+          <ThemeSwitch value="light" aria-describedby="own" />
+        </>,
+      );
+      expect(button()).toHaveAccessibleDescription('Click to switch to Dark Mine');
+    });
+
+    it('passes className, style, disabled and data attributes to the button, and ref points to it', () => {
+      const ref = createRef<HTMLButtonElement>();
+      render(
+        <ThemeSwitch ref={ref} className="mine" style={{ color: 'red' }} data-x="1" disabled />,
+      );
+      expect(ref.current).toBe(button());
+      expect(button()).toHaveClass('flg-theme-switch', 'mine');
+      expect(button()).toHaveStyle({ color: 'rgb(255, 0, 0)' });
+      expect(button()).toHaveAttribute('data-x', '1');
+      expect(button()).toBeDisabled();
+    });
+
+    it('runs the onClick of the caller first, and does not switch when it prevents the default', async () => {
+      const user = userEvent.setup();
+      const onClick = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
+      render(<ThemeSwitch defaultValue="light" onClick={onClick} />);
+      await user.click(button());
+      expect(onClick).toHaveBeenCalledTimes(1);
+      expect(button()).toHaveAccessibleName('Theme: Light');
+      expect(localStorage.getItem('flg-theme')).toBeNull();
+    });
+  });
+
+  describe('the tooltip', () => {
+    it('says the value and the next one, below the button and lined up with its end', () => {
+      render(<ThemeSwitch value="light" />);
+      expect(tooltip()).toHaveTextContent('Theme: Light · click to switch to Dark');
+      expect(tooltip()).toHaveAttribute('data-side', 'bottom');
+      expect(tooltip()).toHaveAttribute('data-align', 'end');
+    });
+
+    it('follows labels.tooltip', () => {
+      render(<ThemeSwitch value="dark" labels={{ tooltip: (c, n) => `${c} -> ${n}` }} />);
+      expect(tooltip()).toHaveTextContent('Dark -> System');
+    });
+
+    it('opens when the pointer rests on the button, and closes when it leaves', () => {
+      vi.useFakeTimers();
+      render(<ThemeSwitch value="light" />);
+      fireEvent.pointerEnter(button(), { pointerType: 'mouse' });
+      act(() => {
+        vi.advanceTimersByTime(600);
+      });
+      expect(showing.has(tooltip())).toBe(true);
+      fireEvent.pointerLeave(button(), { pointerType: 'mouse' });
+      act(() => {
+        vi.advanceTimersByTime(200);
+      });
+      expect(showing.has(tooltip())).toBe(false);
+    });
+  });
+
+  describe('uncontrolled', () => {
+    it('reads the stored value after mount', () => {
+      localStorage.setItem('flg-theme', 'dark');
+      render(<ThemeSwitch />);
+      expect(button()).toHaveAccessibleName('Theme: Dark');
+      expect(button()).toHaveAttribute('data-value', 'dark');
+      expect(html()).toBe('dark');
+    });
+
+    it('writes a choice under its storageKey and under no other', async () => {
+      const user = userEvent.setup();
+      render(<ThemeSwitch storageKey="my-theme" defaultValue="light" />);
+      await user.click(button());
+      expect(localStorage.getItem('my-theme')).toBe('dark');
+      expect(localStorage.getItem('flg-theme')).toBeNull();
+      expect(html()).toBe('dark');
+    });
+
+    it('calls onValueChange with the value it switched to', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      render(<ThemeSwitch defaultValue="light" onValueChange={onValueChange} />);
+      await user.click(button());
+      await user.click(button());
+      expect(onValueChange.mock.calls).toEqual([['dark'], ['system']]);
+    });
+
+    it('goes on working when localStorage throws', async () => {
+      const user = userEvent.setup();
+      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
+        throw new DOMException('denied', 'SecurityError');
+      });
+      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
+        throw new DOMException('denied', 'SecurityError');
+      });
+      render(<ThemeSwitch defaultValue="light" />);
+      await user.click(button());
+      expect(button()).toHaveAccessibleName('Theme: Dark');
+      expect(html()).toBe('dark');
+    });
+
+    it('keeps two switches of one key in step, and tells them from a switch of another key', async () => {
+      const user = userEvent.setup();
+      render(
+        <>
+          <ThemeSwitch data-testid="a" defaultValue="light" />
+          <ThemeSwitch data-testid="b" defaultValue="light" />
+          <ThemeSwitch data-testid="c" storageKey="other" defaultValue="light" />
+        </>,
+      );
+      await user.click(screen.getByTestId('a'));
+      expect(screen.getByTestId('a')).toHaveAccessibleName('Theme: Dark');
+      expect(screen.getByTestId('b')).toHaveAccessibleName('Theme: Dark');
+      expect(screen.getByTestId('c')).toHaveAccessibleName('Theme: Light');
+    });
+
+    it('follows a change that another tab makes', () => {
+      render(<ThemeSwitch />);
+      act(() => {
+        window.dispatchEvent(
+          new StorageEvent('storage', {
+            key: 'flg-theme',
+            newValue: 'dark',
+            storageArea: localStorage,
+          }),
+        );
+      });
+      expect(button()).toHaveAccessibleName('Theme: Dark');
+      expect(html()).toBe('dark');
+    });
+  });
+
+  describe('controlled', () => {
+    it('shows the value it is given and reports a click, and never touches <html> or localStorage', async () => {
+      const user = userEvent.setup();
+      const onValueChange = vi.fn();
+      const set = vi.spyOn(Storage.prototype, 'setItem');
+      const { rerender } = render(<ThemeSwitch value="dark" onValueChange={onValueChange} />);
+      expect(button()).toHaveAccessibleName('Theme: Dark');
+      await user.click(button());
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('system');
+      expect(button()).toHaveAccessibleName('Theme: Dark');
+      expect(set).not.toHaveBeenCalled();
+      expect(html()).toBeNull();
+      rerender(<ThemeSwitch value="system" onValueChange={onValueChange} />);
+      expect(button()).toHaveAccessibleName('Theme: System');
+    });
+
+    it('has no data-pending: it knows its value from the first render', () => {
+      expect(renderToString(<ThemeSwitch value="dark" />)).not.toContain('data-pending');
+    });
+  });
+
+  describe('before hydration', () => {
+    it('is rendered with the default value and data-pending, which the CSS reads the icon from <html> by', () => {
+      localStorage.setItem('flg-theme', 'dark');
+      const markup = renderToString(<ThemeSwitch />);
+      expect(markup).toContain('data-value="system"');
+      expect(markup).toContain('data-pending=""');
+      expect(markup).toContain('aria-label="Theme: System"');
+    });
+
+    it('drops data-pending at the first effect, with the stored value shown, and warns of no mismatch', async () => {
+      const markup = renderToString(<ThemeSwitch />);
+      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
+      const recoverable = vi.fn();
+      localStorage.setItem('flg-theme', 'dark');
+      const container = document.createElement('div');
+      container.innerHTML = markup;
+      document.body.append(container);
+      const server = container.querySelector('button')!;
+      expect(server).toHaveAttribute('data-pending');
+      let root!: ReturnType<typeof hydrateRoot>;
+      await act(async () => {
+        root = hydrateRoot(container, <ThemeSwitch />, { onRecoverableError: recoverable });
+      });
+      expect(error).not.toHaveBeenCalled();
+      expect(recoverable).not.toHaveBeenCalled();
+      // The same element: hydration kept it.
+      expect(container.querySelector('button')).toBe(server);
+      expect(server).not.toHaveAttribute('data-pending');
+      expect(server).toHaveAttribute('data-value', 'dark');
+      expect(server).toHaveAttribute('aria-label', 'Theme: Dark');
+      act(() => root.unmount());
+      container.remove();
+    });
+
+    it('has no data-pending in a page that is not hydrating', () => {
+      render(<ThemeSwitch />);
+      expect(button()).not.toHaveAttribute('data-pending');
+    });
+  });
+
+  it('warns of nothing', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(<ThemeSwitch />);
+    expect(warn.mock.calls.filter(([text]) => String(text).startsWith(WARN_PREFIX))).toEqual([]);
+  });
+});
diff --git a/src/components/theme-switch/theme-script.test.ts b/src/components/theme-switch/theme-script.test.ts
new file mode 100644
index 0000000..769e7a1
--- /dev/null
+++ b/src/components/theme-switch/theme-script.test.ts
@@ -0,0 +1,83 @@
+import { afterEach, describe, expect, it } from 'vitest';
+import { themeScriptSource } from './theme-script';
+
+describe('themeScriptSource', () => {
+  afterEach(() => {
+    localStorage.clear();
+    document.documentElement.removeAttribute('data-flg-theme');
+  });
+
+  it('is, character for character, the script of the spec (spec phase 5 §6.3), for the default key', () => {
+    expect(themeScriptSource()).toBe(
+      '(function(k){try{var v=localStorage.getItem(k),d=document.documentElement;' +
+        'if(v==="light"||v==="dark")d.setAttribute("data-flg-theme",v);' +
+        'else d.removeAttribute("data-flg-theme")}catch(e){}})("flg-theme")',
+    );
+  });
+
+  it('puts the key in as a string literal, and nothing else changes', () => {
+    expect(themeScriptSource('my-app:theme')).toBe(
+      themeScriptSource().replace('("flg-theme")', '("my-app:theme")'),
+    );
+  });
+
+  it('escapes every < of the key, so that a key cannot close the tag or open a comment', () => {
+    const source = themeScriptSource('</script><script>alert(1)</script><!--');
+    expect(source).not.toContain('<');
+    expect(
+      source.endsWith('("\\u003c/script>\\u003cscript>alert(1)\\u003c/script>\\u003c!--")'),
+    ).toBe(true);
+  });
+
+  describe('when it runs', () => {
+    const run = (key?: string) => new Function(themeScriptSource(key))();
+    const attribute = () => document.documentElement.getAttribute('data-flg-theme');
+
+    it.each(['light', 'dark'])('puts a stored %s on <html>', (stored) => {
+      localStorage.setItem('flg-theme', stored);
+      run();
+      expect(attribute()).toBe(stored);
+    });
+
+    it.each(['system', 'sepia', ''])(
+      'takes the attribute off <html> for a stored "%s"',
+      (stored) => {
+        document.documentElement.setAttribute('data-flg-theme', 'dark');
+        localStorage.setItem('flg-theme', stored);
+        run();
+        expect(attribute()).toBeNull();
+      },
+    );
+
+    it('takes the attribute off <html> when nothing is stored', () => {
+      document.documentElement.setAttribute('data-flg-theme', 'dark');
+      run();
+      expect(attribute()).toBeNull();
+    });
+
+    it('reads the key it was given, whatever characters it has', () => {
+      const key = 'a"b\\c</script>';
+      localStorage.setItem(key, 'dark');
+      localStorage.setItem('flg-theme', 'light');
+      run(key);
+      expect(attribute()).toBe('dark');
+    });
+
+    it('does not throw when localStorage cannot be read, and leaves <html> as it is', () => {
+      document.documentElement.setAttribute('data-flg-theme', 'dark');
+      const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
+      Object.defineProperty(window, 'localStorage', {
+        configurable: true,
+        get() {
+          throw new DOMException('denied', 'SecurityError');
+        },
+      });
+      try {
+        expect(() => run()).not.toThrow();
+      } finally {
+        Object.defineProperty(window, 'localStorage', original);
+      }
+      expect(attribute()).toBe('dark');
+    });
+  });
+});
diff --git a/src/components/user-menu/UserMenu.stories.tsx b/src/components/user-menu/UserMenu.stories.tsx
index 69f533b..501b7c4 100644
--- a/src/components/user-menu/UserMenu.stories.tsx
+++ b/src/components/user-menu/UserMenu.stories.tsx
@@ -1,33 +1,13 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
-import type { SVGProps } from 'react';
 import { expect, waitFor, within } from 'storybook/test';
-import { GearIcon } from '../../../.storybook/icons';
+import { GearIcon, LogOutIcon, PersonIcon } from '../../../.storybook/icons';
 import { App, End, Strip, strips } from '../../../.storybook/header-strip';
 import { realUserEvent, settled } from '../../../.storybook/real-input';
 import { withViewport } from '../../../.storybook/viewport';
-import { strokeIcon } from '../../internal/icons';
 import { MenuItem, MenuSeparator } from '../menu/Menu';
 // Named for what it is in the stories: the story called `UserMenu` is the look of the button.
 import { UserMenu as Component } from './UserMenu';
 
-function PersonIcon(props: SVGProps<SVGSVGElement>) {
-  return (
-    <svg {...strokeIcon} {...props}>
-      <circle cx="12" cy="8" r="4" />
-      <path d="M4 21a8 8 0 0 1 16 0" />
-    </svg>
-  );
-}
-function LogOutIcon(props: SVGProps<SVGSVGElement>) {
-  return (
-    <svg {...strokeIcon} {...props}>
-      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
-      <path d="m16 17 5-5-5-5" />
-      <path d="M21 12H9" />
-    </svg>
-  );
-}
-
 const icon = { width: 15, height: 15 };
 
 /** The items of the menu of the mockup: Profile, Settings, a rule, Log out. */
diff --git a/src/index.test.ts b/src/index.test.ts
index 2917f58..5adb08b 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -121,6 +121,9 @@ describe('public API', () => {
       'TabsTrigger',
       'TagInput',
       'Textarea',
+      'ThemeMenuGroup',
+      'ThemeScript',
+      'ThemeSwitch',
       'Toaster',
       'Tooltip',
       'TooltipContent',
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index e9389ed..a1df6f5 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -13,9 +13,12 @@ import {
   FileIcon,
   MenuIcon,
   MinusIcon,
+  MonitorIcon,
+  MoonIcon,
   PlusIcon,
   SearchIcon,
   StatusIcon,
+  SunIcon,
   UploadIcon,
   strokeIcon,
 } from './icons';
@@ -118,6 +121,42 @@ describe('shared icons', () => {
     expect(container.querySelector('path')?.getAttribute('d')).toBe('m20 20-3.5-3.5');
   });
 
+  it('SunIcon pins its disc and its eight rays', () => {
+    const { container } = render(<SunIcon />);
+    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
+    const circle = container.querySelector('circle')!;
+    expect([
+      circle.getAttribute('cx'),
+      circle.getAttribute('cy'),
+      circle.getAttribute('r'),
+    ]).toEqual(['12', '12', '4']);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe(
+      'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
+    );
+  });
+
+  it('MoonIcon pins its path', () => {
+    const { container } = render(<MoonIcon />);
+    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
+    expect(container.querySelector('path')?.getAttribute('d')).toBe(
+      'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
+    );
+  });
+
+  it('MonitorIcon pins its screen and its stand', () => {
+    const { container } = render(<MonitorIcon />);
+    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
+    const rect = container.querySelector('rect')!;
+    expect(['x', 'y', 'width', 'height', 'rx'].map((name) => rect.getAttribute(name))).toEqual([
+      '2',
+      '3',
+      '20',
+      '14',
+      '2',
+    ]);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('M8 21h8M12 17v4');
+  });
+
   it('MinusIcon pins its path', () => {
     const { container } = render(<MinusIcon />);
     expect(container.querySelector('path')?.getAttribute('d')).toBe('M5 12h14');
diff --git a/src/internal/theme-store.test.tsx b/src/internal/theme-store.test.tsx
new file mode 100644
index 0000000..69aab31
--- /dev/null
+++ b/src/internal/theme-store.test.tsx
@@ -0,0 +1,300 @@
+import { act, render, screen } from '@testing-library/react';
+import { hydrateRoot } from 'react-dom/client';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { applyTheme, useThemeValue } from './theme-store';
+
+type Options = Partial<Parameters<typeof useThemeValue>[0]>;
+
+/** Shows the value, and has one button for each value that sets it. */
+function Probe({ id = 'probe', ...options }: Options & { id?: string }) {
+  const [value, setValue] = useThemeValue({
+    defaultValue: 'system',
+    storageKey: 'flg-theme',
+    ...options,
+  } as Parameters<typeof useThemeValue>[0]);
+  return (
+    <div>
+      <output data-testid={id}>{value}</output>
+      {(['light', 'dark', 'system'] as const).map((next) => (
+        <button key={next} type="button" onClick={() => setValue(next)}>
+          {`${id}:${next}`}
+        </button>
+      ))}
+    </div>
+  );
+}
+
+const html = () => document.documentElement.getAttribute('data-flg-theme');
+const shown = (id = 'probe') => screen.getByTestId(id).textContent;
+const choose = (name: string) => act(() => screen.getByText(name).click());
+/** A `storage` event as another tab causes it. */
+function storage(key: string | null, newValue: string | null) {
+  act(() => {
+    window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }));
+  });
+}
+
+describe('applyTheme', () => {
+  afterEach(() => document.documentElement.removeAttribute('data-flg-theme'));
+
+  it("puts 'light' and 'dark' on <html> and takes the attribute off for 'system'", () => {
+    applyTheme('dark');
+    expect(html()).toBe('dark');
+    applyTheme('light');
+    expect(html()).toBe('light');
+    applyTheme('system');
+    expect(html()).toBeNull();
+  });
+});
+
+describe('useThemeValue', () => {
+  beforeEach(() => localStorage.clear());
+  afterEach(() => {
+    vi.restoreAllMocks();
+    localStorage.clear();
+    document.documentElement.removeAttribute('data-flg-theme');
+  });
+
+  describe('on the server', () => {
+    it('is the default value, whatever the page holds', () => {
+      localStorage.setItem('flg-theme', 'dark');
+      expect(renderToString(<Probe defaultValue="light" />)).toContain('>light</output>');
+      expect(renderToString(<Probe />)).toContain('>system</output>');
+    });
+
+    it('hydrates with the markup of the server and then reads the stored value, without a warning', async () => {
+      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
+      const markup = renderToString(<Probe />);
+      localStorage.setItem('flg-theme', 'dark');
+      const container = document.createElement('div');
+      container.innerHTML = markup;
+      document.body.append(container);
+      let root!: ReturnType<typeof hydrateRoot>;
+      await act(async () => {
+        root = hydrateRoot(container, <Probe />);
+      });
+      expect(error).not.toHaveBeenCalled();
+      expect(container.querySelector('output')?.textContent).toBe('dark');
+      // It subscribes to the store until it goes; the tests after this one read the page afresh.
+      act(() => root.unmount());
+      container.remove();
+    });
+  });
+
+  describe('uncontrolled', () => {
+    it('reads the stored value after mount and puts it on <html>', () => {
+      localStorage.setItem('flg-theme', 'dark');
+      render(<Probe />);
+      expect(shown()).toBe('dark');
+      expect(html()).toBe('dark');
+    });
+
+    it("takes the attribute off <html> for a stored 'system'", () => {
+      localStorage.setItem('flg-theme', 'system');
+      document.documentElement.setAttribute('data-flg-theme', 'dark');
+      render(<Probe />);
+      expect(shown()).toBe('system');
+      expect(html()).toBeNull();
+    });
+
+    it('has the default value when nothing is stored and <html> has no attribute, and puts it on <html>', () => {
+      render(<Probe defaultValue="dark" />);
+      expect(shown()).toBe('dark');
+      expect(html()).toBe('dark');
+    });
+
+    it('takes the attribute of <html> when nothing is stored, and leaves it as it is', () => {
+      document.documentElement.setAttribute('data-flg-theme', 'light');
+      render(<Probe defaultValue="dark" />);
+      expect(shown()).toBe('light');
+      expect(html()).toBe('light');
+    });
+
+    it('ignores a stored value that is none of the three', () => {
+      localStorage.setItem('flg-theme', 'sepia');
+      document.documentElement.setAttribute('data-flg-theme', 'dark');
+      render(<Probe />);
+      expect(shown()).toBe('dark');
+    });
+
+    it('writes a choice to localStorage, puts it on <html> and reports it', () => {
+      const onValueChange = vi.fn();
+      render(<Probe onValueChange={onValueChange} />);
+      choose('probe:dark');
+      expect(shown()).toBe('dark');
+      expect(localStorage.getItem('flg-theme')).toBe('dark');
+      expect(html()).toBe('dark');
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
+      // System is written too, so that another tab hears of it.
+      choose('probe:system');
+      expect(localStorage.getItem('flg-theme')).toBe('system');
+      expect(html()).toBeNull();
+    });
+
+    it('does not report the value it already has', () => {
+      localStorage.setItem('flg-theme', 'dark');
+      const onValueChange = vi.fn();
+      render(<Probe onValueChange={onValueChange} />);
+      choose('probe:dark');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('keeps every consumer of one key in step, and the other keys apart', () => {
+      render(
+        <>
+          <Probe id="a" />
+          <Probe id="b" />
+          <Probe id="c" storageKey="other" />
+        </>,
+      );
+      choose('a:dark');
+      expect(shown('a')).toBe('dark');
+      expect(shown('b')).toBe('dark');
+      expect(shown('c')).toBe('system');
+      expect(localStorage.getItem('other')).toBeNull();
+    });
+
+    it('reads localStorage once for all the consumers that mount together, and again after they have all gone', () => {
+      const get = vi.spyOn(Storage.prototype, 'getItem');
+      const { unmount } = render(
+        <>
+          <Probe id="a" />
+          <Probe id="b" />
+        </>,
+      );
+      expect(get).toHaveBeenCalledTimes(1);
+      unmount();
+      localStorage.setItem('flg-theme', 'light');
+      get.mockClear();
+      render(<Probe />);
+      expect(get).toHaveBeenCalledTimes(1);
+      expect(shown()).toBe('light');
+    });
+
+    it('follows a storage event for its key, from another tab, and puts it on <html>', () => {
+      render(<Probe />);
+      storage('flg-theme', 'dark');
+      expect(shown()).toBe('dark');
+      expect(html()).toBe('dark');
+      storage('flg-theme', 'light');
+      expect(shown()).toBe('light');
+      expect(html()).toBe('light');
+    });
+
+    it("takes a key that was removed, or all of localStorage cleared, for 'system'", () => {
+      render(<Probe />);
+      storage('flg-theme', 'dark');
+      storage('flg-theme', null);
+      expect(shown()).toBe('system');
+      expect(html()).toBeNull();
+      storage('flg-theme', 'dark');
+      storage(null, null);
+      expect(shown()).toBe('system');
+    });
+
+    it('ignores a storage event for another key', () => {
+      render(<Probe />);
+      storage('other', 'dark');
+      expect(shown()).toBe('system');
+      expect(html()).toBeNull();
+    });
+
+    it('stops listening to storage once the last consumer has gone', () => {
+      const add = vi.spyOn(window, 'addEventListener');
+      const remove = vi.spyOn(window, 'removeEventListener');
+      const { unmount } = render(
+        <>
+          <Probe id="a" />
+          <Probe id="b" />
+        </>,
+      );
+      expect(add.mock.calls.filter(([type]) => type === 'storage')).toHaveLength(1);
+      unmount();
+      expect(remove.mock.calls.filter(([type]) => type === 'storage')).toHaveLength(1);
+    });
+
+    it('does not report a change that came from another tab as a choice', () => {
+      const onValueChange = vi.fn();
+      render(<Probe onValueChange={onValueChange} />);
+      storage('flg-theme', 'dark');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('controlled', () => {
+    it('is the value it is given, and never reads, writes or touches <html>', () => {
+      localStorage.setItem('flg-theme', 'dark');
+      const get = vi.spyOn(Storage.prototype, 'getItem');
+      const set = vi.spyOn(Storage.prototype, 'setItem');
+      const onValueChange = vi.fn();
+      render(<Probe value="light" onValueChange={onValueChange} />);
+      expect(shown()).toBe('light');
+      expect(get).not.toHaveBeenCalled();
+      choose('probe:dark');
+      // The parent decides: the value stays until it passes another.
+      expect(shown()).toBe('light');
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
+      expect(set).not.toHaveBeenCalled();
+      expect(html()).toBeNull();
+      storage('flg-theme', 'dark');
+      expect(shown()).toBe('light');
+    });
+
+    it('reports a choice that is the value it has, as the parent may mean to undo it', () => {
+      const onValueChange = vi.fn();
+      render(<Probe value="light" onValueChange={onValueChange} />);
+      choose('probe:light');
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('light');
+    });
+
+    it('shows the default value for one that is none of the three', () => {
+      render(<Probe value={'sepia' as 'light'} defaultValue="dark" />);
+      expect(shown()).toBe('dark');
+    });
+
+    it('follows the value of the parent', () => {
+      const { rerender } = render(<Probe value="light" />);
+      rerender(<Probe value="dark" />);
+      expect(shown()).toBe('dark');
+    });
+  });
+
+  describe('when localStorage is not there', () => {
+    it('reads <html> when it cannot be read, and the default value when <html> has nothing', () => {
+      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
+        throw new DOMException('denied', 'SecurityError');
+      });
+      document.documentElement.setAttribute('data-flg-theme', 'dark');
+      const { unmount } = render(<Probe />);
+      expect(shown()).toBe('dark');
+      unmount();
+      document.documentElement.removeAttribute('data-flg-theme');
+      render(<Probe defaultValue="light" />);
+      expect(shown()).toBe('light');
+    });
+
+    it('keeps a choice in the page when it cannot be written, and still reports it', () => {
+      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
+        throw new DOMException('full', 'QuotaExceededError');
+      });
+      const onValueChange = vi.fn();
+      render(<Probe onValueChange={onValueChange} />);
+      choose('probe:dark');
+      expect(shown()).toBe('dark');
+      expect(html()).toBe('dark');
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('dark');
+    });
+
+    it('works when reaching localStorage itself throws', () => {
+      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
+        throw new DOMException('denied', 'SecurityError');
+      });
+      render(<Probe />);
+      expect(shown()).toBe('system');
+      choose('probe:light');
+      expect(shown()).toBe('light');
+      expect(html()).toBe('light');
+    });
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/theme-store.test.tsx src/internal/icons.test.tsx src/components/theme-switch src/index.test.ts
```

Expected: FAIL.
- `theme-store.test.tsx`, `ThemeSwitch.test.tsx`, `ThemeMenuGroup.test.tsx`, `ThemeScript.test.tsx` (cả hai project React) và `theme-script.test.ts` (project `unit`) không nạp được (`Failed to resolve import "./theme-store" from "src/internal/theme-store.test.tsx". Does the file exist?`, và tương tự cho `./ThemeSwitch`, `./ThemeScript`, `./theme-script`). `ThemeSwitch.test-d.ts` báo lỗi kiểu vì module chưa có.
- `icons.test.tsx`: `SunIcon pins its disc and its eight rays`, `MoonIcon pins its path`, `MonitorIcon pins its screen and its stand` fail với `Element type is invalid`.
- `public API > exports exactly the documented components and nothing internal`: thiếu `ThemeMenuGroup`, `ThemeScript`, `ThemeSwitch`.

Story của ThemeSwitch không chạy ở bước này (module chưa có). `UserMenu.stories.tsx` nay lấy `PersonIcon`, `LogOutIcon` từ `.storybook/icons.tsx` (có trong patch test này).

Theo báo cáo của bản nháp (phát hiện 19): mọi file test được viết trước code và fail như trên. Nhiều test của store pass ngay với code (đặc tả). Bỏ `suppressHydrationWarning` thì `ThemeScript > hydrates without a warning when the browser has hidden the nonce, as it does after it ran the script` fail; đổi `:root[data-flg-theme='dark']` thành `'dark-x'` trong quy tắc `data-pending` thì story `IconBeforeHydration` fail ở cả ba engine.

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index fef96e5..daf21cd 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -320,7 +320,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục, tiêu đề flyout của nhóm ở rail và số đếm trần của `bar`; ở UserMenu: dòng phụ ở đầu menu | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List, chữ và icon của mục đang chọn Nav `pill` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List, nền mục đang chọn của Nav `pill` | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
-| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
+| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ, kể cả icon ở cuối mục của `ThemeMenuGroup`; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
 | 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%); tiêu đề và mô tả của bước lỗi trong viên thuốc (Stepper `compact`) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
 | 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được, và mô tả của bước Stepper bấm được, và chữ mờ trên hàng của Table, khi hover (`inset`, `plain`; `cards` ở dark), và số đếm trần của Nav `bar` khi hover | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
@@ -363,6 +363,8 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 2 và 6 còn có các vị trí của giai đoạn 5, Plan C: vòng focus của nút xoá của SearchField và của nút `UserMenu` (điểm 2, cùng vòng focus chung; hai vòng hover và "đang mở" của U1 là `box-shadow` mang trạng thái mà menu và `aria-expanded` đã nói, nên không đo), dòng phụ ở đầu menu của `UserMenu` (điểm 6, `--flg-text-muted` trên kính của menu). Cùng cặp màu nên cùng số đo, không thêm dòng (spec giai đoạn 5 §4.4).
 
+Điểm 9 còn có icon ở cuối mục của `ThemeMenuGroup` khi mục đang được trỏ (giai đoạn 5, Plan C): `--flg-highlight-icon`, tức `--flg-text-muted` ở theme mặc định, trên nền `--flg-highlight-bg`, cùng cặp màu với icon của mọi item menu, nên cùng số đo và cùng ngưỡng 3:1, không thêm dòng (spec giai đoạn 5 §4.4). Ở `prefers-contrast: more` `--flg-highlight-icon` là `--flg-highlight-text`; ở `forced-colors` icon lấy màu chữ của mục (§4.5).
+
 Điểm 35 là vạch của mục đang chọn Nav `bar` theo mockup N2 (giai đoạn 5, Plan B): vạch `--flg-accent-solid` rộng 3px trên nền nhuộm `color-mix` 18% của chính màu đó, nên thấp ở cả hai theme; mục đó còn có chữ đậm và `aria-current="page"`, nên vạch không phải dấu hiệu duy nhất. Chữ `--flg-text` của mục (và số đếm của nó) đạt (8.24:1 light, 5.82:1 dark, thấp nhất của hai điểm 18% và 3% của nền) và icon `--flg-accent-text` đạt (3.28:1, 3.80:1), nên không phải ngoại lệ. Các vị trí khác của Nav cùng cặp màu với các điểm 2 (vòng focus của mục và nút nhóm), 6 (tiêu đề mục, số đếm trần của `bar`), 7 và 8 (chữ, icon và nền của mục đang chọn `pill`), 12 (số đếm trần của `bar` khi hover), 29 (nhãn của nhóm chứa trang hiện tại, `pill`) và 32 (`Badge` đếm của `pill` khi hover, dark 4.15:1 `neutral`), nên được ghi ở đó. Ở `prefers-contrast: more` cả ba cặp mới đều đạt (4.65:1, 11.44:1 và 4.55:1 ở light; 5.30:1, 10.17:1 và 6.64:1 ở dark).
 
 Điểm 36 là chữ của phím gợi ý (`⌘K`) trong ô SearchField theo mockup H2 và H3 (giai đoạn 5, Plan C): `--flg-text-muted` trên nền `--flg-control-bg-secondary` của phím, nằm trên nền ô (`--flg-control-bg`) hoặc trên kính của tooltip của nút thu gọn. Ở dark là 3.31:1 trong ô và 3.76:1 trong tooltip, nên ghi 3.31:1 (số thấp hơn); light đạt cả hai (7.15:1). Phím gợi ý là chữ phụ ẩn khỏi công nghệ hỗ trợ (`aria-hidden`), và phím tắt được nói qua `aria-keyshortcuts` trên ô và trên nút thu gọn, nên không có thông tin nào chỉ nằm ở chữ đó; hai điều này không miễn tiêu chí, chỉ là bối cảnh khi duyệt. Ở `prefers-contrast: more` đạt (7.83:1 light, 7.63:1 dark).
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index e44d8f5..69aec26 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -207,7 +207,7 @@ Không có animation lặp nào, nên không thêm quy tắc viết tay vào kh
 ### 3.7 Cấu trúc file bổ sung
 
 ```
-src/internal/        use-media-query.ts, theme-store.ts, editable.ts (chuyển từ Toaster), platform.ts,
+src/internal/        use-media-query.ts, theme-store.ts, theme-value.ts, editable.ts (chuyển từ Toaster), platform.ts,
                      icons.tsx (MenuIcon, SearchIcon, SunIcon, MoonIcon, MonitorIcon; ArrowIcon 'left')
 src/components/      app-shell/ (AppShell.tsx client: AppShell và các phần; AppShellBrand.tsx;
                      app-shell-context.ts; use-header-offset.ts; use-sheet.ts), nav/, indicator/, search-field/,
@@ -546,7 +546,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
 | `click.ts` (B) | `isPlainClick(event)`, `blockActivation(event)` | `isPlainClick`: lần bấm mà trình duyệt theo link ngay trong tab này (nút chính, không Ctrl, Cmd, Shift, Alt, chưa `defaultPrevented`, và link không có `target` khác `_self` cũng không có `download`: `target` rỗng là tab này, từ khoá đọc không phân biệt hoa thường; `target="_blank"` hay `download` để người dùng ở lại trang, nên tấm trượt, flyout và trang của Pagination giữ nguyên; phát hiện khi review PR #38), trước là `leftToBrowser` của Pagination. `blockActivation`: `preventDefault` và `stopPropagation` ở pha capture, trước là bản riêng của `Button` và của `NavItem`. Button, Pagination và Nav dùng chung, để một sửa đổi của "lần bấm thường" tới được mọi nơi (phát hiện khi review cuối Plan B) |
 | `platform.ts` (C) | `isApplePlatform(): boolean` | `navigator.userAgentData?.platform`, không có thì `navigator.platform`, có chứa "Mac", "iPhone", "iPad" hay "iPod", không phân biệt hoa thường (`userAgentData` trả "macOS", `navigator.platform` trả "MacIntel") (phát hiện khi lập Plan C). Chỉ đọc sau khi mount: SearchField đọc nó bằng `useSyncExternalStore` có giá trị phía server là `undefined`, nên lần render hydrate cho cùng chữ với server rồi mới điền (phát hiện khi lập Plan C) |
 | `editable.ts` (C) | `isEditable(target)` | Chuyển nguyên từ `Toaster.tsx` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]`, hay con của chúng); Toaster và phím tắt của SearchField dùng chung |
-| `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store |
+| `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })` trả `[giá trị, đặt giá trị]`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên (đọc lại khi mọi người đăng ký đã đi hết rồi có người mới) và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store. Kiểu `ThemeValue`, `isThemeValue` và khoá mặc định `'flg-theme'` nằm ở `theme-value.ts`, không có React, để `ThemeScript` (server-safe) không kéo hook của store vào (phát hiện khi lập Plan C) |
 
 **Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `modal` (`open && !isWide`: tấm đang là dialog; phần nào cần biết thì đọc nó, không tự tính lại; phát hiện khi review cuối Plan A), `setOpen(open, { returnFocus, opener })` (`returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, là nút trigger đã mở tấm, không có thì trigger đầu tiên còn hiện; `opener` chỉ do `AppShellSidebarTrigger` truyền khi mở; phát hiện khi lập Plan A. Focus cũng về như vậy khi cha controlled tự đóng không qua `setOpen`; lần đóng do cửa sổ rộng ra không dùng `setOpen` mà được nhận ra bằng `matchMedia` (§3.4); `opener` và cờ `returnFocus: false` bị quên sau mỗi lần đóng; phát hiện khi review cuối Plan A; cờ chỉ được ghi khi lời gọi đóng một tấm đang hiện, và cũng bị quên mỗi khi tấm hiện ra, §3.4; phát hiện khi review PR #37), id của sidebar và main, đăng ký phần và trigger; **không** có `labels` và `brand`: hai thứ đó nằm ở một context thứ hai, `AppShellTextContext` (`{ labels, brand }`), vì cha thường truyền chúng inline nên chúng là giá trị mới ở mọi lần render, và `NavItem` đọc context của AppShell (để đóng tấm trượt), nên nếu chúng cùng một context thì mọi mục nav render lại theo mọi lần render của cha; chỉ header, sidebar và trigger đọc context thứ hai; phát hiện khi lập Plan B, từ M8 của Plan A); `app-shell/app-shell-context.ts` còn `AppShellSidebarContext` (boolean, `true` trong thân của `AppShellSidebar`: chỗ duy nhất khung vẽ rail; `NavItem` và `NavGroup` chỉ là rail khi nó `true`, AppShell `collapsible`, `collapsed` và `isWide`; phát hiện khi lập Plan B); `app-shell/use-sheet.ts` (`useSheet`: layout effect của tấm trượt (`inert`, khoá cuộn, focus vào và về), Esc, lớp nền, việc đóng khi cửa sổ rộng ra; `AppShell.tsx` chỉ gọi nó; phát hiện khi review cuối Plan A); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `nav/nav-rail.tsx` (những phần chỉ rail có: `useRailState`, `RailTooltip`, chữ cái đầu, chấm số đếm, và `useFlyout`, toàn bộ logic flyout của `NavGroup`; `Nav.tsx` chỉ còn dựng danh sách và các mục; phát hiện khi review cuối Plan B); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
 
@@ -820,11 +820,11 @@ interface ThemeSwitchLabels {
   tooltip: (current: string, next: string) => string;
   hint: (next: string) => string;
 }
-type ThemeSwitchProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby' | 'children' | 'value' | 'defaultValue'> & {
+type ThemeSwitchProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby' | 'children' | 'value' | 'defaultValue' | 'asChild'> & {
   value?: ThemeValue; defaultValue?: ThemeValue; onValueChange?: (value: ThemeValue) => void;
   storageKey?: string; labels?: Partial<ThemeSwitchLabels>;
 };
-type ThemeMenuGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> & {
+type ThemeMenuGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'children'> & {
   value?: ThemeValue; defaultValue?: ThemeValue; onValueChange?: (value: ThemeValue) => void;
   storageKey?: string; labels?: Partial<{ group: string; light: string; dark: string; system: string }>;
 };
@@ -832,7 +832,7 @@ type ThemeScriptProps = { storageKey?: string; nonce?: string };
 ```
 
 - **Mặc định:** `defaultValue="system"`, `storageKey="flg-theme"`. `ThemeSwitch labels={ light: "Light", dark: "Dark", system: "System", trigger: (c) => \`Theme: ${c}\`, tooltip: (c, n) => \`Theme: ${c} · click to switch to ${n}\`, hint: (n) => \`Click to switch to ${n}\` }`. `ThemeMenuGroup labels={ group: "Theme", light: "Light", dark: "Dark", system: "System" }`.
-- **Không truyền `value`** (tự quản lý, theo bản quyết định): giá trị nằm trong `localStorage[storageKey]` (`'light'`, `'dark'` hay `'system'`; chọn System cũng ghi `'system'`, để tab khác nhận được qua sự kiện `storage`; Claude chốt). Chọn thì ghi và `applyTheme`. Sự kiện `storage` cho đúng khoá từ tab khác thì cập nhật và `applyTheme`. Lần đầu sau mount: đọc `localStorage` (khác bản quyết định, vốn đọc thuộc tính trên `<html>`: `localStorage` là nguồn sự thật, còn thuộc tính vắng mặt không phân biệt được "System" với "chưa lưu"; Claude chốt); không đọc được thì dùng `data-flg-theme` của `<html>`, vắng thì `'system'`. Nếu giá trị đã lưu khác thuộc tính đang có trên `<html>` (không có `ThemeScript`), lib áp nó ngay khi mount (trang khi đó có nháy một lần; docs nói thêm `ThemeScript`).
+- **Không truyền `value`** (tự quản lý, theo bản quyết định): giá trị nằm trong `localStorage[storageKey]` (`'light'`, `'dark'` hay `'system'`; chọn System cũng ghi `'system'`, để tab khác nhận được qua sự kiện `storage`; Claude chốt). Chọn thì ghi và `applyTheme`. Sự kiện `storage` cho đúng khoá từ tab khác thì cập nhật và `applyTheme`; khoá bị xoá hay `localStorage.clear()` (`newValue` là `null`) hay giá trị lạ thì là `'system'`, như `ThemeScript` đọc (phát hiện khi lập Plan C). Lần đầu sau mount: đọc `localStorage` (khác bản quyết định, vốn đọc thuộc tính trên `<html>`: `localStorage` là nguồn sự thật, còn thuộc tính vắng mặt không phân biệt được "System" với "chưa lưu"; Claude chốt); không có giá trị đã lưu (hay không đọc được) thì dùng `data-flg-theme` của `<html>`, vắng thì `defaultValue` (mặc định `'system'`), và kết quả được áp lên `<html>` (phát hiện khi lập Plan C). Nếu giá trị đã lưu khác thuộc tính đang có trên `<html>` (không có `ThemeScript`), lib áp nó ngay khi mount (trang khi đó có nháy một lần; docs nói thêm `ThemeScript`).
 - **Có `value`** (controlled): chỉ là UI, gọi `onValueChange`, không chạm `<html>` hay `localStorage`: cho next-themes và ứng dụng tự quản lý theme.
 - **`ThemeSwitch` (T1):** một nút đổi vòng light → dark → system → light. Tên `labels.trigger(<chữ của giá trị>)` ("Theme: Light"). Tooltip `labels.tooltip(current, next)`, với tuỳ chọn `describe: false`; nút có `aria-describedby` trỏ vào một `<span hidden>` (id từ `useId`) chứa `labels.hint(next)` ("Click to switch to Dark"), như mô tả ẩn của Progress (spec giai đoạn 4 §6.3), nên screen reader đọc "Theme: Light, button, Click to switch to Dark" mà không lặp tên. Không phải nhóm radio (theo bản quyết định).
   - **Icon trước khi hydrate** (Claude chốt): nút có `data-value` (giá trị đang dùng) và, ở chế độ tự quản lý, `data-pending` từ HTML của server tới effect đầu tiên. Khi còn `data-pending`, CSS chọn icon theo `<html>`: `:root[data-flg-theme='light']` → mặt trời, `'dark'` → trăng, không có thuộc tính → màn hình. Vì `ThemeScript` đã đặt thuộc tính trước khi trang vẽ, icon đúng ngay. Tên của nút đổi sau hydrate (không nhìn thấy).
@@ -843,7 +843,7 @@ type ThemeScriptProps = { storageKey?: string; nonce?: string };
   <script nonce="…">(function(k){try{var v=localStorage.getItem(k),d=document.documentElement;if(v==="light"||v==="dark")d.setAttribute("data-flg-theme",v);else d.removeAttribute("data-flg-theme")}catch(e){}})("flg-theme")</script>
   ```
 
-  - Khoá được chèn bằng `JSON.stringify(storageKey)` rồi thay mọi `<` bằng `<`, để một khoá lạ không đóng được thẻ script. Render bằng `dangerouslySetInnerHTML`, có `suppressHydrationWarning` (trình duyệt xoá giá trị `nonce` khỏi thuộc tính sau khi dùng, nên lúc hydrate React thấy thuộc tính khác; Claude chốt).
+  - Khoá được chèn bằng `JSON.stringify(storageKey)` rồi thay mọi `<` bằng `\u003c` (bản trước của dòng này viết cả hai vế là `<`; phát hiện khi lập Plan C), để một khoá lạ không đóng được thẻ script. Render bằng `dangerouslySetInnerHTML`, có `suppressHydrationWarning` (trình duyệt xoá giá trị `nonce` khỏi thuộc tính sau khi dùng, nên lúc hydrate React thấy thuộc tính khác; Claude chốt).
   - Đặt trong `<head>` (Next.js App Router: `app/layout.tsx`, trong `<head>` hoặc đầu `<body>`), chạy trước khi trang vẽ, nên không nháy. `<html>` của layout cần `suppressHydrationWarning`, vì script đổi thuộc tính của nó trước khi React hydrate; docs nói rõ.
   - Ứng dụng chỉ render ở client (Vite): React không chạy script do chính nó tạo, nên docs cho đoạn script trên để chép thẳng vào `index.html` (Claude chốt; fixture Vite làm vậy).
   - `'system'` và mọi giá trị khác bỏ thuộc tính: CSS của lib đã theo `prefers-color-scheme` qua `:root:not([data-flg-theme])`.
@@ -888,7 +888,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 
 - **Plan A** (`stage: 'page'`): `Sidebar` (S1, 1280×720, sidebar mở rộng, có footer), `SidebarRail` (S1, rail, không footer), `SidebarPhone` (S1, 390×844, đóng), `SidebarPhoneOpen` (S1, tấm mở, mở bằng play function), và bốn story như vậy cho `Header` (S2). Như mockup S, sidebar chứa một nav trung tính dựng bằng CSS riêng của story (trang S vẽ như vậy), header chứa các IconButton trơn: các story này kiểm khung, không kiểm Nav. Story điện thoại gắn tag `viewport-390x844`.
 - **Plan B:** `Pill`, `Bar` (Nav mở rộng trong một tấm kính 264px như cột trái của mockup N: mục đang chọn, số đếm, focus bàn phím trên một mục, tiêu đề mục, nhóm mở có con đang chọn, nhóm đóng, mục tắt, mục hover, mục ở đáy; để so sánh trên một hình, mục cấp 1 và mục con cùng `active` như mockup); `PillRail`, `BarRail` (AppShell S1 thu gọn, `stage: 'page'`: icon đang chọn, chấm số đếm, tooltip của mục đang hover qua `data-visual-hover="tooltip"`, flyout của nhóm mở bằng play function); `Indicator` (các trạng thái: `danger` và `accent` trên nút chuông, chấm, "99+", bốn `status`).
-- **Plan C:** `SearchFieldDefault` (H2: rỗng với ⌘K, focus với chữ và nút xoá; trong các dải header dựng trong story), `SearchFieldDefaultPhone` (H2 trong AppShell, `viewport-360x640`), `SearchFieldCollapsible` (H3: thu gọn với tooltip qua `data-visual-hover="tooltip"`, mở rỗng, mở có chữ), `SearchFieldCollapsiblePhone` (H3 dưới 768px: thu gọn, và mở phủ header, hai story); `ThemeSwitch` (T1: Light, Dark, System bằng `value`, hover có tooltip, focus bàn phím); `ThemeMenuGroup` (T3: menu của UserMenu mở, Light đang chọn, mục Dark đang được trỏ, cộng hai menu chỉ có phần Theme với Dark và System đang chọn); `UserMenu`, `UserMenuOpen` (U1: nghỉ, hover, focus, mở) và như vậy cho `showName` (U2); `NotificationsList` (B1: nghỉ, mở, rỗng), `NotificationsTabs` (B3); trang Examples: `AppShellExample` (S1, N1, H2, T1, U1, B1, 1280×720) và `AppShellExamplePhone` (390×844).
+- **Plan C:** `SearchFieldDefault` (H2: rỗng với ⌘K, focus với chữ và nút xoá; trong các dải header dựng trong story), `SearchFieldDefaultPhone` (H2 trong AppShell, `viewport-360x640`), `SearchFieldCollapsible` (H3: thu gọn với tooltip qua `data-visual-hover="tooltip"`, mở rỗng, mở có chữ), `SearchFieldCollapsiblePhone` (H3 dưới 768px: thu gọn, và mở phủ header, hai story); `ThemeSwitch` (T1: Light, Dark, System bằng `value`, hover có tooltip) và `ThemeSwitchFocus` (focus bàn phím có tooltip: một lúc chỉ một tooltip hiện, nên hover và focus là hai story; phát hiện khi lập Plan C); `ThemeMenuGroup` (T3: menu của UserMenu mở, Light đang chọn, mục Dark đang được trỏ), `ThemeMenuGroupDark` và `ThemeMenuGroupSystem` (menu chỉ có phần Theme với Dark và System đang chọn: một popover mở một lúc, nên mỗi menu một story); `UserMenu`, `UserMenuOpen` (U1: nghỉ, hover, focus, mở) và như vậy cho `showName` (U2); `NotificationsList` (B1: nghỉ, mở, rỗng), `NotificationsTabs` (B3); trang Examples: `AppShellExample` (S1, N1, H2, T1, U1, B1, 1280×720) và `AppShellExamplePhone` (390×844).
 - Story nhiều trạng thái của widget đặt mỗi trạng thái trong một dải kính dựng trong story theo dải header của trang mockup (cao 56px, padding `0 10px 0 8px`, khoảng cách 4px), vì nhiều `AppShell` không đặt được trên một trang; story một trạng thái cần đúng ngữ cảnh header (ô phủ của H3) dùng `AppShell` thật.
 - Menu, popover, tooltip đang mở nằm trong top layer: các story đó dùng `stage: 'viewport'` hoặc `'page'`.
 - Ảnh chuẩn mới: khoảng 30 story giao diện × 8 ảnh, khoảng 240 ảnh (§10).
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index df3132a..867e0fd 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -213,6 +213,9 @@ const SHIPPED_CLASSES = [
   'flg-user-menu-text',
   'flg-user-menu-title',
   'flg-user-menu-description',
+  'flg-theme-switch',
+  'flg-theme-switch-icon',
+  'flg-theme-menu-icon',
 ];
 
 // The rules of the AppShell that depend on the width are generated, one `@media` block per breakpoint
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 1fc8da4..55d470a 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -36,6 +36,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/nav/Nav.tsx',
   'src/components/search-field/SearchField.tsx',
   'src/components/user-menu/UserMenu.tsx',
+  'src/components/theme-switch/ThemeSwitch.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
   'src/components/file-upload/FileUpload.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index d645c05..0e05eb8 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -77,7 +77,8 @@ const D = {
   },
   9: {
     description:
-      'Muted icon, shortcut and submenu chevron on a highlighted menu item or option, the hint ' +
+      'Muted icon, shortcut and submenu chevron on a highlighted menu item or option (the icon at ' +
+      'the end of an item of a ThemeMenuGroup too), the hint ' +
       'of a FileUpload zone while files are over it, the description of the current step of a ' +
       'Stepper `compact`, the description and end cell of the current row of a List, and the muted ' +
       'text on a chosen row of a Table',
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index ae959ca..c3894c4 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -203,6 +203,30 @@ const CASES = [
       createElement(C, { name: 'Lumen', asChild: true }, createElement('a', { href: '/home' })),
     expect: { type: 'a', className: 'flg-app-shell-brand' },
   },
+  // The script of the theme goes into the <head> of a layout that is a Server Component. It has no class:
+  // the check looks at the tag, the nonce and the source it renders.
+  ...[
+    ['with the default key', {}, undefined, '("flg-theme")'],
+    [
+      'with a storageKey and a nonce',
+      { storageKey: 'my-key', nonce: 'n0nce' },
+      'n0nce',
+      '("my-key")',
+    ],
+  ].map(([what, props, nonce, call]) => ({
+    label: `ThemeScript ${what}`,
+    file: '../dist/components/theme-switch/ThemeScript.js',
+    exportName: 'ThemeScript',
+    element: (C) => createElement(C, props),
+    expect: { type: 'script', className: undefined },
+    check: (tree) => {
+      const source = tree.props.dangerouslySetInnerHTML?.__html;
+      if (tree.props.nonce !== nonce) throw new Error(`nonce is ${tree.props.nonce}`);
+      if (typeof source !== 'string' || !source.endsWith(call)) {
+        throw new Error(`the source does not end with ${call}`);
+      }
+    },
+  })),
   ...['rect', 'circle', 'text'].map((shape) => ({
     label: `Skeleton ${shape}`,
     file: '../dist/components/skeleton/Skeleton.js',
@@ -328,6 +352,7 @@ for (const c of CASES) {
         `expected <${c.expect.type} class="${c.expect.className}">, got <${tree.type} class="${tree.props.className}">`,
       );
     }
+    c.check?.(tree);
     console.log(`ok   ${c.label}`);
   } catch (error) {
     failed += 1;
diff --git a/src/components/theme-switch/ThemeScript.tsx b/src/components/theme-switch/ThemeScript.tsx
new file mode 100644
index 0000000..e27760c
--- /dev/null
+++ b/src/components/theme-switch/ThemeScript.tsx
@@ -0,0 +1,26 @@
+import { themeScriptSource } from './theme-script';
+
+export interface ThemeScriptProps {
+  /** The key of `localStorage` that the theme is kept in; the one `ThemeSwitch` uses. Default `"flg-theme"`. */
+  storageKey?: string;
+  /** The nonce of a Content Security Policy that allows scripts by nonce. */
+  nonce?: string;
+}
+
+/**
+ * Sets the stored theme on `<html>` before the page is painted, so that it does not flash. Render it
+ * in the `<head>` of the document, and put `suppressHydrationWarning` on `<html>`, which the script
+ * changes before React hydrates. It renders one `<script>` and has no hooks, so a layout that is a
+ * Server Component can use it.
+ */
+export function ThemeScript({ storageKey, nonce }: ThemeScriptProps) {
+  return (
+    <script
+      nonce={nonce}
+      // The browser takes the value out of the `nonce` attribute once it has used it, so that React
+      // finds another one when it hydrates.
+      suppressHydrationWarning
+      dangerouslySetInnerHTML={{ __html: themeScriptSource(storageKey) }}
+    />
+  );
+}
diff --git a/src/components/theme-switch/ThemeSwitch.mdx b/src/components/theme-switch/ThemeSwitch.mdx
new file mode 100644
index 0000000..d8c1bc6
--- /dev/null
+++ b/src/components/theme-switch/ThemeSwitch.mdx
@@ -0,0 +1,285 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './ThemeSwitch.stories';
+
+<Meta of={Stories} />
+
+# ThemeSwitch
+
+The choice between the light theme, the dark theme and the system's, for the header of an
+application. There are two controls for it, and you pick where it lives: **`ThemeSwitch`**, a
+button that goes round the three themes (T1), and **`ThemeMenuGroup`**, three radio items for a
+menu such as the [UserMenu](?path=/docs/components-usermenu--docs) (T3). Both read and write the
+same store, so they agree when you use both. **`ThemeScript`** puts the stored theme on the page
+before it is painted, so that it does not flash.
+
+```tsx
+import { AppShellHeader, ThemeSwitch } from 'h2d-glass-ui';
+
+<AppShellHeader>
+  <ThemeSwitch />
+</AppShellHeader>;
+```
+
+<Canvas of={Stories.ThemeSwitch} />
+
+## How the theme is kept
+
+By default the control keeps the theme for you (it is **uncontrolled**):
+
+- The choice is `'light'`, `'dark'` or `'system'`, kept in `localStorage` under `storageKey`
+  (`"flg-theme"`). Choosing System writes `'system'` too, so that another tab hears of it.
+- It is put on `<html>` as `data-flg-theme="light"` or `"dark"`. System takes the attribute off, and
+  the CSS of the library follows `prefers-color-scheme` when there is none.
+- When the first control of a `storageKey` mounts, the value is read from `localStorage` once. What
+  is stored wins; without it, the attribute that `<html>` already has; without that, `defaultValue`.
+  A value that is none of the three is ignored. The result is put on `<html>`, so a page that has no
+  `ThemeScript` shows the stored theme from then on (and flashes once: see ThemeScript).
+- Another tab that changes the key changes this one too (the `storage` event), and so does a tab
+  that removes the key or clears `localStorage`, which is the system's choice.
+- Every control of the same `storageKey`, in any part of the page, shows the same value. They are
+  one store. Controls with other keys are separate stores, but they all write the one attribute of
+  `<html>`: use one key for a page.
+- Where `localStorage` is not available (blocked site data, some private windows) nothing throws:
+  the choice lives in the page until it is closed.
+
+With `value` the control is **controlled**: it shows what you pass, calls `onValueChange` with the
+choice and does nothing else. It never reads or writes `localStorage` and never touches `<html>`.
+Use it when the theme belongs to something else, such as next-themes or a store of your application
+(see next-themes).
+
+## ThemeSwitch
+
+One button that goes round Light, Dark, System and Light again, with the icon of the theme it has:
+the sun, the moon, the screen. It is a ghost icon button of 34px.
+
+| Prop            | Type                            | Default       | Does                                                          |
+| --------------- | ------------------------------- | ------------- | ------------------------------------------------------------- |
+| `value`         | `'light' \| 'dark' \| 'system'` | none          | The theme. Pass it with `onValueChange` to control it         |
+| `defaultValue`  | `'light' \| 'dark' \| 'system'` | `'system'`    | What the server renders, and the theme when nothing is stored |
+| `onValueChange` | `(value: ThemeValue) => void`   | none          | Called with the theme that was chosen                         |
+| `storageKey`    | `string`                        | `'flg-theme'` | The key of `localStorage`                                     |
+| `labels`        | `Partial<ThemeSwitchLabels>`    | English       | The words (see The words)                                     |
+
+`className`, `style`, `disabled`, `ref` and every other prop of a button go on the button; `variant`
+and `size` are `ghost` and `md` unless you say otherwise. The button is not a slot, so it takes no
+`asChild`, and it takes no `children`, `aria-label` or `aria-labelledby`: its content is the three
+icons (the CSS shows one), and its name is made from the theme (see The words). The
+`aria-describedby` you pass is kept, after the hint.
+
+The tooltip is below the button, lined up with its end, 17px away: 6px under a header of 56px. It
+says what the theme is and what a click does, "Theme: Light · click to switch to Dark", when the
+pointer rests on the button and when the keyboard focuses it.
+
+<Canvas of={Stories.ThemeSwitchFocus} />
+
+## ThemeMenuGroup
+
+Three radio items, Light, Dark and System, under the title "Theme", each with its icon at the end.
+Put it in the menu of a `UserMenu`, or in any `DropdownMenuContent`; choosing an item closes the
+menu, as every radio item of a menu does.
+
+```tsx
+<UserMenu name="Ada Lovelace" description="ada@example.com">
+  <MenuItem icon={<PersonIcon />}>Profile</MenuItem>
+  <MenuSeparator />
+  <ThemeMenuGroup />
+  <MenuSeparator />
+  <MenuItem icon={<LogOutIcon />}>Log out</MenuItem>
+</UserMenu>
+```
+
+<Canvas of={Stories.ThemeMenuGroup} />
+
+It has the props of `ThemeSwitch` that make sense for a menu (`value`, `defaultValue`,
+`onValueChange`, `storageKey`, `labels`), and the rest go on the group, which is what `ref` points
+to. It takes no `children`: the three items are the library's. Rendered outside a menu its items
+warn, as every menu item does. Until the stored theme is read, and on the server, the item of
+`defaultValue` is the chosen one. The chosen theme is not shown by the icons, which are only a
+picture of each theme: the dot says which one it is.
+
+<Canvas of={Stories.ThemeMenuGroupDark} />
+
+## ThemeScript
+
+Without it the page is painted with the theme of the system, and then, when the control mounts and
+reads `localStorage`, with the one that was stored: a person who chose Dark sees a flash of light.
+`ThemeScript` is a `<script>` that reads the key and sets the attribute on `<html>` before the first
+paint. It renders nothing else, has no hooks, and so can be used in a layout that is a Server
+Component. It takes the same `storageKey` as the controls, and a `nonce`.
+
+```tsx
+// app/layout.tsx (Next.js, App Router)
+import { ThemeScript } from 'h2d-glass-ui';
+import 'h2d-glass-ui/styles.css';
+
+export default function RootLayout({ children }: { children: React.ReactNode }) {
+  return (
+    // The script changes an attribute of <html> before React hydrates it.
+    <html lang="en" suppressHydrationWarning>
+      <head>
+        <ThemeScript />
+      </head>
+      <body>{children}</body>
+    </html>
+  );
+}
+```
+
+- **Put `suppressHydrationWarning` on `<html>`.** The script changes its `data-flg-theme` before
+  React hydrates, and React would warn that the server sent something else. (The script has a
+  `suppressHydrationWarning` of its own, for its nonce: see A Content Security Policy.)
+- The script knows `localStorage` and the key, and not `defaultValue`. A `ThemeSwitch` with a
+  `defaultValue` other than `'system'` and nothing stored paints with the system's theme, and then
+  switches. Leave the default as it is, and let the choice be made.
+- A page of a server that renders no React (an application that only renders in the browser, such as
+  one built with Vite) cannot use the component: React does not run a script that it makes itself.
+  Copy the script into the `index.html`, in the `<head>`, before the stylesheet. It is the same one,
+  for the default key:
+
+```html
+<script>
+  (function (k) {
+    try {
+      var v = localStorage.getItem(k),
+        d = document.documentElement;
+      if (v === 'light' || v === 'dark') d.setAttribute('data-flg-theme', v);
+      else d.removeAttribute('data-flg-theme');
+    } catch (e) {}
+  })('flg-theme');
+</script>
+```
+
+### A Content Security Policy
+
+A policy that allows scripts by nonce needs the nonce on this one:
+
+```tsx
+import { headers } from 'next/headers';
+
+export default async function RootLayout({ children }: { children: React.ReactNode }) {
+  const nonce = (await headers()).get('x-nonce') ?? undefined;
+  return (
+    <html lang="en" suppressHydrationWarning>
+      <head>
+        <ThemeScript nonce={nonce} />
+      </head>
+      <body>{children}</body>
+    </html>
+  );
+}
+```
+
+The browser takes the value out of the `nonce` attribute once it has used it, so the script has
+`suppressHydrationWarning` too: React would find another value than the server's when it hydrates.
+A policy that allows scripts by hash can use the hash of the script above, for the key you chose.
+A key with a `<` in it is written out as `<`, so a key can never close the tag.
+
+### next-themes
+
+[next-themes](https://github.com/pacocoursey/next-themes) keeps the theme, and has a script of its
+own, so **do not render `ThemeScript` with it**. Tell it to write the attribute the library reads,
+and pass its value to the control:
+
+```tsx
+// Providers.tsx
+'use client';
+import { ThemeProvider } from 'next-themes';
+
+export function Providers({ children }: { children: React.ReactNode }) {
+  return (
+    <ThemeProvider attribute="data-flg-theme" defaultTheme="system" enableSystem>
+      {children}
+    </ThemeProvider>
+  );
+}
+```
+
+```tsx
+// ThemeToggle.tsx
+'use client';
+import { ThemeSwitch } from 'h2d-glass-ui';
+import type { ThemeValue } from 'h2d-glass-ui';
+import { useTheme } from 'next-themes';
+
+export function ThemeToggle() {
+  const { theme, setTheme } = useTheme();
+  // `theme` is undefined until next-themes has mounted: the icon of System is drawn meanwhile.
+  return (
+    <ThemeSwitch value={(theme as ThemeValue | undefined) ?? 'system'} onValueChange={setTheme} />
+  );
+}
+```
+
+The control is controlled here, so it writes nothing: next-themes does. The icon cannot be picked
+from `<html>` before hydration, as it can with `ThemeScript`: it is the System's until next-themes
+has mounted.
+
+## The words
+
+`labels` of `ThemeSwitch` has the three words and three functions:
+
+| Key       | Default                                  | Where                                                 |
+| --------- | ---------------------------------------- | ----------------------------------------------------- |
+| `light`   | `"Light"`                                | In the name, the tooltip and the hint                 |
+| `dark`    | `"Dark"`                                 | The same                                              |
+| `system`  | `"System"`                               | The same                                              |
+| `trigger` | `(current) => "Theme: " + current`       | The name of the button, from the word of the theme    |
+| `tooltip` | `(current, next) => "Theme: …"`          | The tooltip: `Theme: Light · click to switch to Dark` |
+| `hint`    | `(next) => "Click to switch to " + next` | The hidden description of the button                  |
+
+`labels` of `ThemeMenuGroup` has `group` (`"Theme"`), `light`, `dark` and `system`. A key you leave
+out, or give as `undefined`, keeps its English default. The functions get the **words**, not the
+values, so a translation of `light` is in the name of the button and in its tooltip:
+
+```tsx
+<ThemeSwitch
+  labels={{
+    light: 'Sáng',
+    dark: 'Tối',
+    system: 'Theo hệ thống',
+    trigger: (current) => `Giao diện: ${current}`,
+    tooltip: (current, next) => `Giao diện: ${current} · bấm để đổi sang ${next}`,
+    hint: (next) => `Bấm để đổi sang ${next}`,
+  }}
+/>
+```
+
+## Hydration
+
+The server renders the button with `defaultValue`, and the first render in the browser does too, so
+the two agree and React reports nothing. The stored theme is read in the first effect. Until then
+the button has `data-pending`, and its icon is picked by the CSS from `<html data-flg-theme>`, which
+`ThemeScript` has set before the page was painted: a person who chose Dark sees the moon in the
+HTML that the server sent. When the effect has run the button knows its value, drops `data-pending`
+and shows the same icon from its own `data-value`. The name of the button (not seen) changes then,
+from "Theme: System" to the real one. A controlled button knows its value from the start and is
+never pending.
+
+## Accessibility
+
+- The button is named "Theme: Light" for the theme it has (not for the one a click goes to), and
+  its name changes with it, as that of a button that says a state does.
+- It is described by a hidden hint, "Click to switch to Dark", so a screen reader says "Theme:
+  Light, button, Click to switch to Dark". The tooltip says the same and more, and does not describe
+  the button as well: the name would be read twice. The tooltip shows when the pointer rests and
+  when the keyboard focuses the button; Esc closes it.
+- It is not a radio group: a switch is a button, and it says the value it has. If you want people to
+  see the three, put a `ThemeMenuGroup` in a menu.
+- The items of `ThemeMenuGroup` are `menuitemradio`, named by their words; the icons at the end are
+  hidden. The group is named by its title.
+- The icon of the item that is lit is `--flg-highlight-icon` on the fill of the item, which is row 9
+  of the table on the Accessibility page (an icon, 3:1). In forced colours it takes the colour of
+  the item's text.
+- The icon of a ThemeSwitch is `currentColor` of the button, so it is the colour of the text of a
+  ghost button in every mode. The three themes are not told by colour alone: the icons differ in
+  shape, and the name says which one it is.
+
+## Do and don't
+
+- Do render `ThemeScript` in the `<head>`, and `suppressHydrationWarning` on `<html>`.
+- Do give every control of a page the same `storageKey`.
+- Don't render `ThemeScript` with next-themes: two scripts write the same attribute.
+- Don't put `ThemeSwitch` in a menu: it is a button that goes round the themes. Use
+  `ThemeMenuGroup` there.
+- Don't read the theme from `<html>` to decide what your own code draws, when the theme is System:
+  the attribute is absent then, and the answer is in `prefers-color-scheme`.
diff --git a/src/components/theme-switch/ThemeSwitch.tsx b/src/components/theme-switch/ThemeSwitch.tsx
new file mode 100644
index 0000000..785ea17
--- /dev/null
+++ b/src/components/theme-switch/ThemeSwitch.tsx
@@ -0,0 +1,206 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useId, useState } from 'react';
+import type { HTMLAttributes } from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { dataAttr } from '../../internal/data-attr';
+import { MonitorIcon, MoonIcon, SunIcon } from '../../internal/icons';
+import { joinIds } from '../../internal/join-ids';
+import { useThemeValue } from '../../internal/theme-store';
+import { DEFAULT_THEME_STORAGE_KEY, isThemeValue } from '../../internal/theme-value';
+import type { ThemeValue } from '../../internal/theme-value';
+import { withDefaults } from '../../internal/with-defaults';
+import type { ButtonProps } from '../button/Button';
+import { IconButton } from '../icon-button/IconButton';
+import { MenuLabel, MenuRadioGroup, MenuRadioItem } from '../menu/Menu';
+import { TooltipContent, TooltipRoot, TooltipTrigger } from '../tooltip/Tooltip';
+
+export type { ThemeValue };
+
+export interface ThemeSwitchLabels {
+  light: string;
+  dark: string;
+  system: string;
+  /** The name of the button, made from the word for the value it has. */
+  trigger: (current: string) => string;
+  /** The text of the tooltip, made from the words for the value it has and the one it goes to. */
+  tooltip: (current: string, next: string) => string;
+  /** The hint that describes the button to a screen reader, made from the word for the next value. */
+  hint: (next: string) => string;
+}
+
+export type ThemeSwitchProps = Omit<
+  ButtonProps,
+  'aria-label' | 'aria-labelledby' | 'children' | 'value' | 'defaultValue' | 'asChild'
+> & {
+  /** The theme. Pass it with `onValueChange` to own it: nothing is read, stored or put on `<html>`. */
+  value?: ThemeValue;
+  /** The theme of the server's HTML, and until the stored one is read. Default `"system"`. */
+  defaultValue?: ThemeValue;
+  /** Called with the theme that was chosen. */
+  onValueChange?: (value: ThemeValue) => void;
+  /** The key of `localStorage` the theme is kept in. Default `"flg-theme"`. */
+  storageKey?: string;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<ThemeSwitchLabels>;
+};
+
+export type ThemeMenuGroupProps = Omit<
+  HTMLAttributes<HTMLDivElement>,
+  'defaultValue' | 'children'
+> & {
+  /** The theme. Pass it with `onValueChange` to own it: nothing is read, stored or put on `<html>`. */
+  value?: ThemeValue;
+  /** The theme of the server's HTML, and until the stored one is read. Default `"system"`. */
+  defaultValue?: ThemeValue;
+  /** Called with the theme that was chosen. */
+  onValueChange?: (value: ThemeValue) => void;
+  /** The key of `localStorage` the theme is kept in. Default `"flg-theme"`. */
+  storageKey?: string;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<ThemeMenuGroupLabels>;
+};
+
+export interface ThemeMenuGroupLabels {
+  /** The title of the group. */
+  group: string;
+  light: string;
+  dark: string;
+  system: string;
+}
+
+const DEFAULT_LABELS: ThemeSwitchLabels = {
+  light: 'Light',
+  dark: 'Dark',
+  system: 'System',
+  trigger: (current) => `Theme: ${current}`,
+  tooltip: (current, next) => `Theme: ${current} · click to switch to ${next}`,
+  hint: (next) => `Click to switch to ${next}`,
+};
+
+const DEFAULT_GROUP_LABELS: ThemeMenuGroupLabels = {
+  group: 'Theme',
+  light: 'Light',
+  dark: 'Dark',
+  system: 'System',
+};
+
+/** The order of the button, and of the items of the menu. */
+const NEXT: Record<ThemeValue, ThemeValue> = { light: 'dark', dark: 'system', system: 'light' };
+
+/**
+ * The button that goes round the themes: light, dark, system. It shows an icon for the value it has
+ * (all three are in the DOM, and the CSS shows one) and says it in its name; the tooltip says what a
+ * click will do, and a hidden hint says that to a screen reader instead of the tooltip, so that the
+ * name is not read twice. Uncontrolled it keeps the theme in `localStorage` and on `<html>`, as does
+ * any `ThemeMenuGroup` with the same `storageKey`; with `value` it only reports a click.
+ */
+export const ThemeSwitch = forwardRef<HTMLButtonElement, ThemeSwitchProps>(function ThemeSwitch(
+  {
+    value,
+    defaultValue = 'system',
+    onValueChange,
+    storageKey = DEFAULT_THEME_STORAGE_KEY,
+    labels: labelsProp,
+    variant = 'ghost',
+    size = 'md',
+    className,
+    onClick,
+    'aria-describedby': describedBy,
+    ...props
+  },
+  ref,
+) {
+  const labels = withDefaults(DEFAULT_LABELS, labelsProp);
+  const hintId = useId();
+  const [current, setValue] = useThemeValue({ value, defaultValue, onValueChange, storageKey });
+  const next = NEXT[current];
+
+  // The server's HTML, and the render that hydrates it, show the default value, which may not be the
+  // stored one, so the button is `pending` until the first effect: the CSS draws the icon of
+  // `<html data-flg-theme>` meanwhile, which `ThemeScript` has set before the page was painted. This
+  // effect is declared after the one of the store (in `useThemeValue`), so both change in one render.
+  // A controlled value is known from the first render.
+  const [mounted, setMounted] = useState(false);
+  useEffect(() => setMounted(true), []);
+
+  return (
+    <>
+      <TooltipRoot describe={false}>
+        <TooltipTrigger>
+          <IconButton
+            ref={ref}
+            variant={variant}
+            size={size}
+            {...props}
+            className={clsx('flg-theme-switch', className)}
+            aria-label={labels.trigger(labels[current])}
+            aria-describedby={joinIds(hintId, describedBy)}
+            data-value={current}
+            data-pending={dataAttr(value === undefined && !mounted)}
+            onClick={composeEventHandlers(onClick, () => setValue(next))}
+          >
+            <SunIcon className="flg-theme-switch-icon" data-for="light" />
+            <MoonIcon className="flg-theme-switch-icon" data-for="dark" />
+            <MonitorIcon className="flg-theme-switch-icon" data-for="system" />
+          </IconButton>
+        </TooltipTrigger>
+        <TooltipContent side="bottom" align="end" sideOffset={17}>
+          {labels.tooltip(labels[current], labels[next])}
+        </TooltipContent>
+      </TooltipRoot>
+      <span id={hintId} hidden>
+        {labels.hint(labels[next])}
+      </span>
+    </>
+  );
+});
+
+const GROUP_ITEMS = [
+  { value: 'light', Icon: SunIcon },
+  { value: 'dark', Icon: MoonIcon },
+  { value: 'system', Icon: MonitorIcon },
+] as const;
+
+/**
+ * The three themes as a group of radio items, for a menu (the `UserMenu`, or any
+ * `DropdownMenuContent`): a title, and Light, Dark and System, each with its icon at the end. It
+ * shares its store with the `ThemeSwitch` of the same `storageKey`, so the two always agree.
+ */
+export const ThemeMenuGroup = forwardRef<HTMLDivElement, ThemeMenuGroupProps>(
+  function ThemeMenuGroup(
+    {
+      value,
+      defaultValue = 'system',
+      onValueChange,
+      storageKey = DEFAULT_THEME_STORAGE_KEY,
+      labels: labelsProp,
+      ...props
+    },
+    ref,
+  ) {
+    const labels = withDefaults(DEFAULT_GROUP_LABELS, labelsProp);
+    const [current, setValue] = useThemeValue({ value, defaultValue, onValueChange, storageKey });
+    return (
+      <MenuRadioGroup
+        ref={ref}
+        {...props}
+        value={current}
+        onValueChange={(chosen) => {
+          if (isThemeValue(chosen)) setValue(chosen);
+        }}
+      >
+        <MenuLabel>{labels.group}</MenuLabel>
+        {GROUP_ITEMS.map(({ value: item, Icon }) => (
+          <MenuRadioItem key={item} value={item} textValue={labels[item]}>
+            {labels[item]}
+            <span className="flg-theme-menu-icon" aria-hidden="true">
+              <Icon />
+            </span>
+          </MenuRadioItem>
+        ))}
+      </MenuRadioGroup>
+    );
+  },
+);
diff --git a/src/components/theme-switch/index.ts b/src/components/theme-switch/index.ts
new file mode 100644
index 0000000..0397326
--- /dev/null
+++ b/src/components/theme-switch/index.ts
@@ -0,0 +1,10 @@
+export { ThemeMenuGroup, ThemeSwitch } from './ThemeSwitch';
+export type {
+  ThemeMenuGroupLabels,
+  ThemeMenuGroupProps,
+  ThemeSwitchLabels,
+  ThemeSwitchProps,
+  ThemeValue,
+} from './ThemeSwitch';
+export { ThemeScript } from './ThemeScript';
+export type { ThemeScriptProps } from './ThemeScript';
diff --git a/src/components/theme-switch/theme-script.ts b/src/components/theme-switch/theme-script.ts
new file mode 100644
index 0000000..e728d70
--- /dev/null
+++ b/src/components/theme-switch/theme-script.ts
@@ -0,0 +1,21 @@
+import { DEFAULT_THEME_STORAGE_KEY } from '../../internal/theme-value';
+
+/**
+ * The script that puts the stored theme on `<html>` before the page is painted (spec phase 5 §6.3):
+ * `light` and `dark` as `data-flg-theme`, anything else, or nothing, as no attribute, which leaves the
+ * choice to the system. `ThemeScript` renders it; an application that has no server to render it
+ * (Vite) copies it into its `index.html`. It reads `localStorage` as `theme-store.ts` does.
+ *
+ * The key goes in as a string literal, and every `<` of it is escaped, so that a key cannot close the
+ * `<script>` tag or open a comment inside it.
+ */
+export function themeScriptSource(storageKey: string = DEFAULT_THEME_STORAGE_KEY): string {
+  const key = JSON.stringify(storageKey).replace(/</g, '\\u003c');
+  return (
+    '(function(k){try{var v=localStorage.getItem(k),d=document.documentElement;' +
+    'if(v==="light"||v==="dark")d.setAttribute("data-flg-theme",v);' +
+    'else d.removeAttribute("data-flg-theme")}catch(e){}})(' +
+    key +
+    ')'
+  );
+}
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 501b6b0..5da5a73 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -64,8 +64,9 @@ The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
 9, 12 and 22), AppShell (its part in rows 2 and 6), Nav (row 35, and its part in rows 2, 6, 7, 8,
-12, 14, 29 and 32), SearchField (row 36, and its part in row 2) and UserMenu (its part in rows 2
-and 6) are in the table above, which is built from the same data CI checks.
+12, 14, 29 and 32), SearchField (row 36, and its part in row 2), UserMenu (its part in
+rows 2 and 6) and ThemeMenuGroup (its part in row 9) are in the table above, which is built from
+the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
diff --git a/src/index.ts b/src/index.ts
index afe8f3a..4d9b19f 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -294,3 +294,12 @@ export { SearchField } from './components/search-field';
 export type { SearchFieldLabels, SearchFieldProps } from './components/search-field';
 export { UserMenu } from './components/user-menu';
 export type { UserMenuLabels, UserMenuProps } from './components/user-menu';
+export { ThemeMenuGroup, ThemeScript, ThemeSwitch } from './components/theme-switch';
+export type {
+  ThemeMenuGroupLabels,
+  ThemeMenuGroupProps,
+  ThemeScriptProps,
+  ThemeSwitchLabels,
+  ThemeSwitchProps,
+  ThemeValue,
+} from './components/theme-switch';
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index 2f56bcc..caf8987 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -221,3 +221,32 @@ export function MenuIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+/** A sun: the light theme of a ThemeSwitch. */
+export function SunIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <circle cx="12" cy="12" r="4" />
+      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
+    </svg>
+  );
+}
+
+/** A crescent moon: the dark theme of a ThemeSwitch. */
+export function MoonIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
+    </svg>
+  );
+}
+
+/** A screen on a stand: the theme of a ThemeSwitch that follows the system. */
+export function MonitorIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <rect x="2" y="3" width="20" height="14" rx="2" />
+      <path d="M8 21h8M12 17v4" />
+    </svg>
+  );
+}
diff --git a/src/internal/theme-store.ts b/src/internal/theme-store.ts
new file mode 100644
index 0000000..b74ae4d
--- /dev/null
+++ b/src/internal/theme-store.ts
@@ -0,0 +1,181 @@
+import { useCallback, useRef, useSyncExternalStore } from 'react';
+import { isThemeValue } from './theme-value';
+import type { ThemeValue } from './theme-value';
+import { useWriteOnCommit } from './use-write-on-commit';
+
+/** The attribute of `<html>` that the theme of the library is chosen by. */
+const ATTRIBUTE = 'data-flg-theme';
+
+/**
+ * Puts the theme on `<html>`: `light` and `dark` as the attribute, `system` as no attribute, which
+ * leaves the choice to `prefers-color-scheme` (the CSS of the library does that through
+ * `:root:not([data-flg-theme])`).
+ */
+export function applyTheme(value: ThemeValue): void {
+  if (typeof document === 'undefined') return;
+  const root = document.documentElement;
+  if (value === 'light' || value === 'dark') root.setAttribute(ATTRIBUTE, value);
+  else root.removeAttribute(ATTRIBUTE);
+}
+
+/** `localStorage`, or `null` where reaching it throws (blocked site data, some private windows). */
+function storage(): Storage | null {
+  try {
+    return window.localStorage;
+  } catch {
+    return null;
+  }
+}
+
+function readStored(key: string): ThemeValue | undefined {
+  try {
+    const stored = storage()?.getItem(key);
+    return isThemeValue(stored) ? stored : undefined;
+  } catch {
+    return undefined;
+  }
+}
+
+function writeStored(key: string, value: ThemeValue): void {
+  try {
+    storage()?.setItem(key, value);
+  } catch {
+    // The choice lives in the page until it is closed; there is nowhere to keep it longer.
+  }
+}
+
+/** What `<html>` says: a page that `ThemeScript` or a stylesheet of its own has set up. */
+function readAttribute(): ThemeValue | undefined {
+  const attribute = document.documentElement.getAttribute(ATTRIBUTE);
+  return attribute === 'light' || attribute === 'dark' ? attribute : undefined;
+}
+
+interface ThemeStore {
+  /** `undefined` until the first subscriber has read it. */
+  value: ThemeValue | undefined;
+  listeners: Set<() => void>;
+  /** The listener of `storage` events, made once so that it can be removed. */
+  onStorage: (event: StorageEvent) => void;
+}
+
+/** One store for each `storageKey`: the consumers of a key agree with each other, and only they. */
+const stores = new Map<string, ThemeStore>();
+
+function storeFor(key: string): ThemeStore {
+  let store = stores.get(key);
+  if (!store) {
+    const made: ThemeStore = {
+      value: undefined,
+      listeners: new Set(),
+      onStorage: (event) => {
+        // Another tab changed the key, removed it (`newValue` is `null`) or cleared everything
+        // (`key` is `null`); the last two leave nothing to follow, which is the system's choice,
+        // as `ThemeScript` reads it. Not the changes of `sessionStorage`, which has the same keys.
+        if (event.key !== null && event.key !== key) return;
+        if (event.storageArea && event.storageArea !== storage()) return;
+        const next = isThemeValue(event.newValue) ? event.newValue : 'system';
+        if (next === made.value) return;
+        update(made, next);
+      },
+    };
+    store = made;
+    stores.set(key, store);
+  }
+  return store;
+}
+
+/** Shows `value` to every consumer and puts it on `<html>`. It does not write: that is a choice. */
+function update(store: ThemeStore, value: ThemeValue): void {
+  store.value = value;
+  applyTheme(value);
+  for (const listener of store.listeners) listener();
+}
+
+/**
+ * Reads what the page holds, when the first consumer of a key is there: what the user stored, else
+ * what `<html>` says, else the default of that consumer. The result goes on `<html>`, so a page
+ * without `ThemeScript` shows the stored theme from the first effect on (and flashes once).
+ */
+function load(store: ThemeStore, key: string, defaultValue: ThemeValue): void {
+  store.value = readStored(key) ?? readAttribute() ?? defaultValue;
+  applyTheme(store.value);
+}
+
+function attach(key: string, defaultValue: ThemeValue, listener: () => void): () => void {
+  const store = storeFor(key);
+  store.listeners.add(listener);
+  if (store.listeners.size === 1) {
+    load(store, key, defaultValue);
+    window.addEventListener('storage', store.onStorage);
+  }
+  return () => {
+    store.listeners.delete(listener);
+    if (store.listeners.size === 0) window.removeEventListener('storage', store.onStorage);
+  };
+}
+
+const noSubscription = () => () => {};
+
+export interface ThemeValueOptions {
+  /** The value of a parent that owns it; without it the value is the store's. */
+  value: ThemeValue | undefined;
+  /** What the server renders, and what is shown until the stored value is read. */
+  defaultValue: ThemeValue;
+  /** Called with the value that was chosen. */
+  onValueChange: ((value: ThemeValue) => void) | undefined;
+  storageKey: string;
+}
+
+/**
+ * The theme, for a `ThemeSwitch` or a `ThemeMenuGroup`, and the function that sets it.
+ *
+ * Uncontrolled, it is the store of `storageKey`: on the server and while hydrating it is
+ * `defaultValue`, so the markup agrees with the server's; the first effect reads `localStorage`
+ * (once, for all the consumers of the key) and every later choice is written to it, put on `<html>`
+ * and shown to all of them. Controlled, it is `value` and a choice is only reported: `localStorage`
+ * and `<html>` belong to the parent then (next-themes, a store of the application).
+ */
+export function useThemeValue({
+  value,
+  defaultValue,
+  onValueChange,
+  storageKey,
+}: ThemeValueOptions): [ThemeValue, (next: ThemeValue) => void] {
+  const controlled = value !== undefined;
+  // The default of the last commit, which a subscription made in a later effect reads.
+  const latestDefault = useRef(defaultValue);
+  useWriteOnCommit(() => {
+    latestDefault.current = defaultValue;
+  });
+
+  const subscribe = useCallback(
+    (listener: () => void) =>
+      controlled ? noSubscription() : attach(storageKey, latestDefault.current, listener),
+    [controlled, storageKey],
+  );
+  // A controlled value that is none of the three is the default, as for the other values of a prop.
+  const getSnapshot = () =>
+    controlled
+      ? isThemeValue(value)
+        ? value
+        : defaultValue
+      : (stores.get(storageKey)?.value ?? defaultValue);
+  const current = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);
+
+  const setValue = useCallback(
+    (next: ThemeValue) => {
+      if (controlled) {
+        onValueChange?.(next);
+        return;
+      }
+      const store = storeFor(storageKey);
+      if ((store.value ?? defaultValue) === next) return;
+      writeStored(storageKey, next);
+      update(store, next);
+      onValueChange?.(next);
+    },
+    [controlled, storageKey, defaultValue, onValueChange],
+  );
+
+  return [current, setValue];
+}
diff --git a/src/internal/theme-value.ts b/src/internal/theme-value.ts
new file mode 100644
index 0000000..7d3a545
--- /dev/null
+++ b/src/internal/theme-value.ts
@@ -0,0 +1,12 @@
+/**
+ * What the theme can be. Its own file, with no React in it, because `ThemeScript` (a server-safe
+ * module) needs the default key and must not pull in the hooks of `theme-store.ts`.
+ */
+export type ThemeValue = 'light' | 'dark' | 'system';
+
+/** The key of `localStorage` that `ThemeSwitch`, `ThemeMenuGroup` and `ThemeScript` share. */
+export const DEFAULT_THEME_STORAGE_KEY = 'flg-theme';
+
+export function isThemeValue(value: unknown): value is ThemeValue {
+  return value === 'light' || value === 'dark' || value === 'system';
+}
diff --git a/src/styles/components/theme-switch.css b/src/styles/components/theme-switch.css
new file mode 100644
index 0000000..c7a52f9
--- /dev/null
+++ b/src/styles/components/theme-switch.css
@@ -0,0 +1,46 @@
+/* ThemeSwitch (spec phase 5 §4.3, mockup T1) and ThemeMenuGroup (T3). The switch is an IconButton; this
+   is only what picks its icon, and the icon at the end of an item of the menu group. */
+@layer flg.components {
+  /* All three icons are in the DOM and one is shown: the one of the value the button has. */
+  .flg-theme-switch-icon {
+    display: none;
+  }
+  .flg-theme-switch:not([data-pending])[data-value='light']
+    > .flg-theme-switch-icon[data-for='light'],
+  .flg-theme-switch:not([data-pending])[data-value='dark']
+    > .flg-theme-switch-icon[data-for='dark'],
+  .flg-theme-switch:not([data-pending])[data-value='system']
+    > .flg-theme-switch-icon[data-for='system'] {
+    display: block;
+  }
+
+  /* Until the first effect the button does not know the stored value: the server rendered it with the
+     default one. `ThemeScript` has put the stored theme on <html> before the page was painted, so the
+     icon is picked from there, and the right one is in the HTML that the server sent. */
+  :root[data-flg-theme='light']
+    .flg-theme-switch[data-pending]
+    > .flg-theme-switch-icon[data-for='light'],
+  :root[data-flg-theme='dark']
+    .flg-theme-switch[data-pending]
+    > .flg-theme-switch-icon[data-for='dark'],
+  :root:not([data-flg-theme])
+    .flg-theme-switch[data-pending]
+    > .flg-theme-switch-icon[data-for='system'] {
+    display: block;
+  }
+
+  /* The icon at the end of an item of the menu group, in the way of the shortcut of a menu item. */
+  .flg-theme-menu-icon {
+    display: inline-flex;
+    margin-left: auto;
+    padding-left: 12px;
+    color: var(--flg-text-muted);
+  }
+  .flg-theme-menu-icon svg {
+    width: 15px;
+    height: 15px;
+  }
+  .flg-menu-item:is(:focus, [data-open], [data-highlighted]) .flg-theme-menu-icon {
+    color: var(--flg-highlight-icon);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 07341b6..4915d91 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -45,6 +45,7 @@
 @import './components/nav.css';
 @import './components/search-field.css';
 @import './components/user-menu.css';
+@import './components/theme-switch.css';
 @import './components/app-shell.css';
 @import './generated/app-shell.css';
 @import './components/floating.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 3be2217..a6814f6 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -340,7 +340,8 @@
        also follows a disabled trigger or item to GrayText. */
     .flg-select-chevron,
     .flg-menu-chevron,
-    .flg-accordion-chevron {
+    .flg-accordion-chevron,
+    .flg-theme-menu-icon {
       color: inherit;
     }
     .flg-menu-item:is(:focus, [data-open], [data-highlighted]) {
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal src/components/theme-switch src/components/user-menu src/components/search-field src/components/tooltip src/index.test.ts src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/theme-switch
pnpm vitest run --project storybook-dark src/components/theme-switch
pnpm vitest run --project storybook-light src/components/user-menu
pnpm vitest run --project storybook-light src/components/search-field
pnpm vitest run --project storybook-light src/components/app-shell
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 906 test PASS, 3 skip (80 file, hai project React cộng lại; 137 trong số đó là của `theme-store` và `theme-switch`), không lỗi kiểu.
- `scripts`: 130 test PASS (5 file).
- `pnpm check:contrast`: PASS. Không cặp mới; chỉ nhãn của dòng 9 đổi.
- Story theme-switch: 30 test PASS ở mỗi project (10 story × ba engine). Mỗi story trả lại `<html>` và các khoá `localStorage` nó dùng.
- `storybook-light` của user-menu 27, search-field 33, app-shell 165: PASS (khe `theme` giữ nút giữ chỗ như cũ).
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy ba lớp mới; `check:use-client` có `ThemeSwitch.tsx` (168 module, 39 client); `check:rsc` in `ok` cho hai ca `ThemeScript`; `size`: JS 54.68 kB trên 57.29 kB, CSS 16.12 kB trên 17.04 kB.
- `pnpm build-storybook`: PASS. `ThemeSwitch.mdx` thay trang autodocs (`components-themeswitch--docs`); chỉ năm story giao diện của ThemeSwitch không gắn `no-visual` (144 story có ảnh).
- `pnpm check:docs-tables`: PASS.
- Ảnh chuẩn của component cũ giữ nguyên (phát hiện 21).

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/header-strip.tsx \
  .storybook/icons.tsx \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  scripts/contrast-exceptions.ts \
  scripts/rsc-probe.mjs \
  src/components/theme-switch/ThemeMenuGroup.test.tsx \
  src/components/theme-switch/ThemeScript.test.tsx \
  src/components/theme-switch/ThemeScript.tsx \
  src/components/theme-switch/ThemeSwitch.mdx \
  src/components/theme-switch/ThemeSwitch.stories.tsx \
  src/components/theme-switch/ThemeSwitch.test-d.ts \
  src/components/theme-switch/ThemeSwitch.test.tsx \
  src/components/theme-switch/ThemeSwitch.tsx \
  src/components/theme-switch/index.ts \
  src/components/theme-switch/theme-script.test.ts \
  src/components/theme-switch/theme-script.ts \
  src/components/user-menu/UserMenu.stories.tsx \
  src/docs/Accessibility.mdx \
  src/index.test.ts \
  src/index.ts \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx \
  src/internal/theme-store.test.tsx \
  src/internal/theme-store.ts \
  src/internal/theme-value.ts \
  src/styles/components/theme-switch.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(theme-switch): add ThemeSwitch (T1), ThemeMenuGroup (T3) and ThemeScript" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: `List surface`, công thức bảng thông báo và docs chung của Plan C

Spec §2 (thay đổi ở `List`), §3.2 (hai ví dụ của bảng thông báo), §4.1 (b1, b3), §4.3 **Công thức bảng thông báo (B1, B3) và thay đổi của List**, §4.4 (dòng 6, 14, 29 mở rộng), §4.5 (công thức thông báo), §5 (`List` `surface` và cảnh báo của nó), §7 (story của công thức, story của trang Examples; test kiểu `List surface`), §8 (trang "Examples/App shell", Getting started "App shell", `List.mdx` `surface`, ghi chú Accessibility của Plan C), §9 (tiêu chí 5). Mockup b1, b3 (`phase-5-header.html`).
- **`List` `surface`** (mặc định `true`, DOM như cũ; `false` bỏ kính riêng của `inset`; cảnh báo ở variant khác) (phát hiện 12).
- **Công thức bảng thông báo** trong `src/docs/app-shell-example/` (`notifications.tsx`, `notifications.css`, `icons.tsx`) và **ứng dụng mẫu** (`Shell.tsx`: S1, N1, H2, T1, U1, B1) (phát hiện 12).
- **Trang "Examples/App shell"** (`AppShellExample.mdx`, code hiện bằng `?raw`) và story của nó; **Getting started** mục "App shell"; **Accessibility** mục "The widgets of the header"; **`List.mdx`** mục "Inside glass" (phát hiện 13).
- **Story:** `NotificationsList`, `NotificationsTabs` (dải), `NotificationsListOpen`, `NotificationsListEmpty`, `NotificationsTabsOpen`, `NotificationsTabsEmpty`, `AppShellExample` (header hay trang thật, 1280×720), `AppShellExamplePhone` (390×844) là story giao diện; `UnreadIsMoreThanColourList`, `UnreadIsMoreThanColourTabs`, `MarkAllAsReadList`, `MarkAllAsReadTabs`, `TabsFilterTheRows`, `PanelPlaceList`, `PanelPlaceTabs`, `PanelOnAPhone` và `InsetWithoutSurface` của List gắn `no-visual`.
- **Story `SheetCloses…` của AppShell** vững hơn (phát hiện 14). Helper: khe `bell`, `PAGE_RULES` dùng chung.
- **Tương phản:** không có cặp mới; dòng 6, 14, 29 mở rộng. Spec §4.3 và spec 0+1 §4.9 được sửa (phát hiện 20).

**Files:**
- Create: `src/docs/app-shell-example/Shell.tsx`, `src/docs/app-shell-example/notifications.tsx`, `src/docs/app-shell-example/notifications.css`, `src/docs/app-shell-example/icons.tsx`, `src/docs/css.d.ts`, `src/docs/AppShellExample.mdx`, `src/docs/AppShellExample.stories.tsx`
- Modify: `src/components/list/List.tsx`, `List.test.tsx`, `List.test-d.ts`, `List.stories.tsx`, `List.mdx`, `src/styles/components/list.css`, `src/components/app-shell/AppShell.stories.tsx`, `.storybook/app-shell-demo.tsx`, `.storybook/header-strip.tsx`, `src/docs/GettingStarted.mdx`, `src/docs/Accessibility.mdx`, `scripts/contrast-exceptions.ts`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- `ListProps` thêm `surface?: boolean` (mặc định `true`). `false` với `variant="inset"`: gốc không có lớp `flg-surface` và có `data-surface="false"`. `false` với variant khác: DOM của variant giữ nguyên, cảnh báo dev `<List> surface={false} only has an effect on variant="inset"; the other variants draw no glass of their own.`
- CSS: `.flg-list[data-variant='inset'][data-surface='false'] > .flg-list-item { --flg-list-item-radius: 0 }`. Không có lớp CSS mới trong gói.
- Công thức (docs, không export từ gói; import từ `'../../index'`):
  - `src/docs/app-shell-example/notifications.tsx`: `ListNotifications(props)` (B1), `TabbedNotifications(props)` (B3), `NotificationsProps = { items: NotificationItem[]; onMarkAllRead: () => void; popover?: Omit<PopoverProps, 'children'> }`, `NotificationItem = { id; title; time; href; unread; from?; icon?; tone?: 'success' }`. Tên của chuông: "Notifications" hay "Notifications, N unread".
  - `notifications.css`: các lớp `notif-…` (ngoài mọi layer, nên thắng CSS của lib).
  - `icons.tsx`: icon của ứng dụng (chuông, nhà, hộp thư, lịch, thư mục, người, biểu đồ, người dùng, đăng xuất, hai dấu ✓, vòng ✓).
  - `Shell.tsx`: `Shell({ notifications, children })`, khung của ứng dụng "Lumen".
  - `src/docs/css.d.ts`: `declare module '*.css'`.
- Trang: `src/docs/AppShellExample.mdx` (`<Meta of={Stories} />`), `AppShellExample.stories.tsx` với meta `title: 'Examples/App shell'`; `StoryFrame` trỏ vào `examples-app-shell--app-shell-example`, `--app-shell-example-phone`, `--notifications-list-open`, `--notifications-tabs-open`, `--notifications-list-empty`, `--notifications-tabs-empty`: đổi tên các story đó là hỏng khung.
- Docs: `GettingStarted.mdx` mục `## App shell` (sau "Show data", trước "Pick a theme"), trỏ tới `?path=/docs/examples-app-shell--docs`; `Accessibility.mdx` mục `## The widgets of the header` (sau "Navigation and the Indicator", trước "A `<dialog>` the library did not create"); `List.mdx` mục `## Inside glass`.
- Helper của story: `.storybook/header-strip.tsx` thêm khe `bell`; `.storybook/app-shell-demo.tsx` export `PAGE_RULES` (chuyển nguyên từ `AppShell.stories.tsx`, mà nay import nó).
- `AppShell.stories.tsx`: `waitFor` trong `checkSheetCloses` có `{ timeout: 5000, interval: 300 }`.
- Consumes: `IconButton`, `Indicator`, `Popover`, `PopoverTrigger`, `PopoverContent`, `List`, `ListItem`, `Tabs`, `Badge`, `Avatar`, `Button`; khung: `AppShell` và các phần, `Nav`, `SearchField`, `ThemeSwitch`, `UserMenu`.
- Task sau dùng: fixture của Task 5 dựng lại cùng bộ widget (chuông có `Indicator`, `Popover`, `List surface={false}`).

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/app-shell-demo.tsx b/.storybook/app-shell-demo.tsx
index 8190f23..feef303 100644
--- a/.storybook/app-shell-demo.tsx
+++ b/.storybook/app-shell-demo.tsx
@@ -507,3 +507,24 @@ export function DemoPage({
     </>
   );
 }
+
+/**
+ * The rules about pages that axe is asked for in the stories of an application (spec phase 5 §7, layer
+ * 3): the preview turns them off for the stories of single components.
+ */
+export const PAGE_RULES = [
+  // Two places are left out of `region`. The skip link: the page that Storybook renders a story in has
+  // links of its own before it, so axe does not take it for the first link of the page, which an
+  // application's skip link is. The head of the sidebar, where S1 draws the brand on a wide screen:
+  // the sidebar is not a landmark (spec §6.3), so a brand there is outside every landmark, where on a
+  // narrow screen it is in the banner.
+  {
+    id: 'region',
+    enabled: true,
+    selector:
+      ':not(.flg-app-shell-skip, .flg-app-shell-sidebar-head, .flg-app-shell-sidebar-head *)',
+  },
+  { id: 'landmark-one-main', enabled: true },
+  { id: 'landmark-unique', enabled: true },
+  { id: 'bypass', enabled: true },
+];
diff --git a/.storybook/header-strip.tsx b/.storybook/header-strip.tsx
index ae611fd..e8c2219 100644
--- a/.storybook/header-strip.tsx
+++ b/.storybook/header-strip.tsx
@@ -53,22 +53,29 @@ const PLACEHOLDER_THEME = (
   </IconButton>
 );
 
+/** The bell of the mockup, until a story puts the real notifications in its place. */
+const PLACEHOLDER_BELL = (
+  <IconButton variant="ghost" aria-label="Notifications">
+    <BellIcon />
+  </IconButton>
+);
+
 /**
- * The widgets at the end of the header: the bell, the theme and the account, each `theme` and `account`
- * or a placeholder.
+ * The widgets at the end of the header: the bell, the theme and the account, each `bell`, `theme` and
+ * `account` or a placeholder.
  */
 export function HeaderWidgets({
   account = PLACEHOLDER_ACCOUNT,
   theme = PLACEHOLDER_THEME,
+  bell = PLACEHOLDER_BELL,
 }: {
   account?: ReactNode;
   theme?: ReactNode;
+  bell?: ReactNode;
 }) {
   return (
     <>
-      <IconButton variant="ghost" aria-label="Notifications">
-        <BellIcon />
-      </IconButton>
+      {bell}
       {theme}
       {account}
     </>
@@ -95,6 +102,7 @@ export function Strip({
   end,
   theme,
   account,
+  bell,
 }: {
   caption: string;
   /** What stands between the brand and the end cluster. */
@@ -105,6 +113,8 @@ export function Strip({
   theme?: ReactNode;
   /** What stands in the place of the avatar button, the last widget. */
   account?: ReactNode;
+  /** What stands in the place of the bell, the first widget. */
+  bell?: ReactNode;
 }) {
   return (
     <div style={{ display: 'grid', gap: 6 }}>
@@ -143,7 +153,7 @@ export function Strip({
         {children}
         <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
           {end}
-          <HeaderWidgets theme={theme} account={account} />
+          <HeaderWidgets theme={theme} account={account} bell={bell} />
         </div>
       </Surface>
     </div>
@@ -174,15 +184,17 @@ export const End = ({
   children,
   theme,
   account,
+  bell,
 }: {
   children?: ReactNode;
   theme?: ReactNode;
   account?: ReactNode;
+  bell?: ReactNode;
 }) => (
   // `minWidth: 0`: a wrapper is as wide as what is in it unless it may be narrower, and then the name
   // of a UserMenu cannot give way in a header that is too narrow.
   <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', minWidth: 0 }}>
     {children}
-    <HeaderWidgets theme={theme} account={account} />
+    <HeaderWidgets theme={theme} account={account} bell={bell} />
   </div>
 );
diff --git a/src/components/app-shell/AppShell.stories.tsx b/src/components/app-shell/AppShell.stories.tsx
index 924e297..0dd1864 100644
--- a/src/components/app-shell/AppShell.stories.tsx
+++ b/src/components/app-shell/AppShell.stories.tsx
@@ -2,7 +2,7 @@ import type { Meta, StoryObj } from '@storybook/react-vite';
 import { useContext, useEffect, useState } from 'react';
 import type { CSSProperties } from 'react';
 import { expect, userEvent, waitFor, within } from 'storybook/test';
-import { DemoPage, DemoRows } from '../../../.storybook/app-shell-demo';
+import { DemoPage, DemoRows, PAGE_RULES } from '../../../.storybook/app-shell-demo';
 import { paintedPixels } from '../../../.storybook/painted-pixel';
 import type { Rgb } from '../../../.storybook/painted-pixel';
 import { realUserEvent, settled } from '../../../.storybook/real-input';
@@ -25,23 +25,7 @@ import { APP_SHELL_BREAKPOINTS } from './breakpoints';
 // approved mockups are `Sidebar` (S1) and `Header` (S2). The others check the layout in the real
 // engines, which jsdom has no layout for: they are `no-visual`, since a screenshot cannot say them.
 // An application is a page, so these stories ask axe for the rules about pages that the preview turns
-// off for the stories of single components (spec phase 5 §7, layer 3).
-const PAGE_RULES = [
-  // Two places are left out of `region`. The skip link: the page that Storybook renders a story in has
-  // links of its own before it, so axe does not take it for the first link of the page, which an
-  // application's skip link is. The head of the sidebar, where S1 draws the brand on a wide screen:
-  // the sidebar is not a landmark (spec §6.3), so a brand there is outside every landmark, where on a narrow screen it is
-  // in the banner.
-  {
-    id: 'region',
-    enabled: true,
-    selector:
-      ':not(.flg-app-shell-skip, .flg-app-shell-sidebar-head, .flg-app-shell-sidebar-head *)',
-  },
-  { id: 'landmark-one-main', enabled: true },
-  { id: 'landmark-unique', enabled: true },
-  { id: 'bypass', enabled: true },
-];
+// off for the stories of single components (spec phase 5 §7, layer 3): `PAGE_RULES`.
 
 const meta = {
   title: 'Components/AppShell',
@@ -1062,13 +1046,20 @@ function checkSheetCloses() {
       await real.keyboard('{Escape}');
       await expectClosed();
       // The key goes where the focus is, so wait for it to be back on the trigger. WebKit on a busy CI
-      // runner once let a single press move nothing right after the lock came off: press again until
-      // the page moves, which is all this proves (the locked page above got a press and the time).
+      // runner twice let a press move nothing right after the lock came off: press again until the
+      // page moves, which is all this proves (the locked page above got a press and the time). The
+      // presses are 300ms apart, about as long as a smooth scroll takes to start moving the page: at
+      // the default 50ms each press came before the one before it had moved anything, which a smooth
+      // scroll that is restarted by every key may never get past. Five seconds in all, for a runner that
+      // is busy.
       await waitFor(() => expect(trigger()).toHaveFocus());
-      await waitFor(async () => {
-        await real.keyboard('{PageDown}');
-        await expect(window.scrollY).toBeGreaterThan(0);
-      });
+      await waitFor(
+        async () => {
+          await real.keyboard('{PageDown}');
+          await expect(window.scrollY).toBeGreaterThan(0);
+        },
+        { timeout: 5000, interval: 300 },
+      );
       window.scrollTo(0, 0);
       await afterLayout();
 
diff --git a/src/components/list/List.stories.tsx b/src/components/list/List.stories.tsx
index 43bdd5c..ce371a7 100644
--- a/src/components/list/List.stories.tsx
+++ b/src/components/list/List.stories.tsx
@@ -731,3 +731,59 @@ export const ControlsInTheEndCell: Story = {
     await waitFor(() => expect(textTitle.count).toBe(1));
   },
 };
+
+/**
+ * `surface={false}` takes the glass of its own off an `inset` list that sits in a panel that is glass
+ * already (a Popover, a Card): no border, no shadow, no blur and no corners of its own, and its first
+ * and last rows have square corners, so that their hover background meets the edges of the panel. The
+ * rule between the rows stays. A list with the default `surface` keeps all of that.
+ */
+export const InsetWithoutSurface: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 18, width: 320 }}>
+      <List data-list="glass" aria-label="With glass">
+        <ListItem title="First" href="#first" />
+        <ListItem title="Second" href="#second" />
+      </List>
+      <Card style={{ padding: 0 }}>
+        <List data-list="flat" surface={false} aria-label="Without glass">
+          <ListItem title="First" href="#first" />
+          <ListItem title="Second" href="#second" />
+          <ListItem title="Third" href="#third" />
+        </List>
+      </Card>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const glass = canvasElement.querySelector<HTMLElement>('[data-list="glass"]')!;
+    const flat = canvasElement.querySelector<HTMLElement>('[data-list="flat"]')!;
+    const corners = (row: Element) => {
+      const style = getComputedStyle(row);
+      return [
+        style.borderTopLeftRadius,
+        style.borderTopRightRadius,
+        style.borderBottomRightRadius,
+        style.borderBottomLeftRadius,
+      ];
+    };
+
+    // The default: glass, a border, a shadow and rounded corners, and rounded outer rows.
+    await expect(getComputedStyle(glass).boxShadow).not.toBe('none');
+    await expect(parseFloat(getComputedStyle(glass).borderTopWidth)).toBeGreaterThan(0);
+    await expect(parseFloat(getComputedStyle(glass).borderTopLeftRadius)).toBeGreaterThan(0);
+    await expect(glass.firstElementChild).not.toBeNull();
+    await expect(corners(glass.firstElementChild!)[0]).not.toBe('0px');
+
+    // Without it: nothing of the above, on the list or on any of the rows.
+    const style = getComputedStyle(flat);
+    await expect(style.boxShadow).toBe('none');
+    await expect(style.borderTopWidth).toBe('0px');
+    await expect(style.borderTopLeftRadius).toBe('0px');
+    const flatRows = Array.from(flat.querySelectorAll('.flg-list-item'));
+    await expect(flatRows).toHaveLength(3);
+    for (const row of flatRows) await expect(corners(row)).toEqual(['0px', '0px', '0px', '0px']);
+    // The rule between the rows is still drawn: it is the row's `::before`, which has a size.
+    await expect(getComputedStyle(flatRows[1]!, '::before').height).toBe('1px');
+  },
+};
diff --git a/src/components/list/List.test-d.ts b/src/components/list/List.test-d.ts
index e59ce84..4cb22b4 100644
--- a/src/components/list/List.test-d.ts
+++ b/src/components/list/List.test-d.ts
@@ -44,3 +44,10 @@ test('renderLink gets the props of the <a>, with href, className and children gi
     (props: ListItemLinkProps) => ReactElement
   >();
 });
+
+test('surface is a boolean', () => {
+  expectTypeOf<ListProps['surface']>().toEqualTypeOf<boolean | undefined>();
+  // @ts-expect-error a string is not a boolean
+  const text: ListProps = { surface: 'false' };
+  expectTypeOf(text).toBeObject();
+});
diff --git a/src/components/list/List.test.tsx b/src/components/list/List.test.tsx
index e450a00..4f45f6a 100644
--- a/src/components/list/List.test.tsx
+++ b/src/components/list/List.test.tsx
@@ -22,6 +22,8 @@ const HREF_AND_ON_SELECT =
 const NEEDS_TITLE =
   '<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable.';
 const RENDER_LINK_WITHOUT_HREF = '<ListItem> renderLink has no effect without href.';
+const SURFACE_NEEDS_INSET =
+  '<List> surface={false} only has an effect on variant="inset"; the other variants draw no glass of their own.';
 
 describe('List', () => {
   it('renders a <ul role="list"> with inset and md by default, and the glass surface only for inset', () => {
@@ -70,6 +72,110 @@ describe('List', () => {
   });
 });
 
+describe('surface', () => {
+  it('is true by default: the DOM of an inset list is the one it always was', () => {
+    const { container } = render(
+      <List>
+        <ListItem title="A" />
+      </List>,
+    );
+    const list = container.firstElementChild!;
+    expect(list).toHaveClass('flg-surface');
+    expect(list).not.toHaveAttribute('data-surface');
+  });
+
+  it('false takes the glass off an inset list and says so with data-surface', () => {
+    const { container } = render(
+      <List surface={false}>
+        <ListItem title="A" />
+      </List>,
+    );
+    const list = container.firstElementChild!;
+    expect(list).not.toHaveClass('flg-surface');
+    expect(list).toHaveClass('flg-list');
+    expect(list).toHaveAttribute('data-surface', 'false');
+    expect(list).toHaveAttribute('data-variant', 'inset');
+  });
+
+  it('true is the same as leaving it out', () => {
+    const { container } = render(
+      <List surface>
+        <ListItem title="A" />
+      </List>,
+    );
+    expect(container.firstElementChild).toHaveClass('flg-surface');
+    expect(container.firstElementChild).not.toHaveAttribute('data-surface');
+  });
+
+  it('has no effect on another variant, which warns once and keeps its own DOM', () => {
+    const warn = spyWarn();
+    const { container, rerender } = render(
+      <>
+        <List variant="cards" surface={false}>
+          <ListItem title="A" />
+        </List>
+        <List variant="plain" surface={false}>
+          <ListItem title="B" />
+        </List>
+      </>,
+    );
+    const lists = Array.from(container.querySelectorAll('ul'));
+    expect(lists).toHaveLength(2);
+    for (const list of lists) {
+      expect(list).not.toHaveAttribute('data-surface');
+      expect(list).not.toHaveClass('flg-surface');
+    }
+    rerender(
+      <List variant="plain" surface={false}>
+        <ListItem title="B" />
+      </List>,
+    );
+    expect(warn).toHaveBeenCalledTimes(1);
+    expect(warn).toHaveBeenCalledWith(expect.stringContaining(SURFACE_NEEDS_INSET));
+  });
+
+  it('does not warn for an inset list, with the surface or without it, or for another variant', () => {
+    const warn = spyWarn();
+    render(
+      <>
+        <List>
+          <ListItem title="A" />
+        </List>
+        <List surface={false}>
+          <ListItem title="B" />
+        </List>
+        <List variant="cards">
+          <ListItem title="C" />
+        </List>
+      </>,
+    );
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it('follows a change on a mounted list', () => {
+    const { container, rerender } = render(
+      <List>
+        <ListItem title="A" />
+      </List>,
+    );
+    const list = container.firstElementChild!;
+    rerender(
+      <List surface={false}>
+        <ListItem title="A" />
+      </List>,
+    );
+    expect(list).not.toHaveClass('flg-surface');
+    expect(list).toHaveAttribute('data-surface', 'false');
+    rerender(
+      <List>
+        <ListItem title="A" />
+      </List>,
+    );
+    expect(list).toHaveClass('flg-surface');
+    expect(list).not.toHaveAttribute('data-surface');
+  });
+});
+
 describe('ListItem structure', () => {
   it('renders start, a main column with title and description, and end, in that order', () => {
     const { container } = render(
diff --git a/src/docs/AppShellExample.stories.tsx b/src/docs/AppShellExample.stories.tsx
new file mode 100644
index 0000000..24e8b62
--- /dev/null
+++ b/src/docs/AppShellExample.stories.tsx
@@ -0,0 +1,415 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import type { ComponentType } from 'react';
+import { expect, waitFor, within } from 'storybook/test';
+import { DemoContent, DemoStyles, PAGE_RULES } from '../../.storybook/app-shell-demo';
+import { App, End, Strip, strips } from '../../.storybook/header-strip';
+import { realUserEvent, settled } from '../../.storybook/real-input';
+import { withViewport } from '../../.storybook/viewport';
+import { CalendarIcon, CheckCircleIcon } from './app-shell-example/icons';
+import { ListNotifications, TabbedNotifications } from './app-shell-example/notifications';
+import type { NotificationItem, NotificationsProps } from './app-shell-example/notifications';
+import { Shell } from './app-shell-example/Shell';
+
+// The page "Examples/App shell": the application of the mockup, whole, and the recipe of its
+// notifications panel (B1, a list with rules; B3, tabs). The code is in `app-shell-example/`, and
+// `AppShellExample.mdx` shows that very code, so what a reader copies is what the stories run.
+const meta = {
+  title: 'Examples/App shell',
+} satisfies Meta;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** The notifications of the mockup: two unread, two read, a person and an icon in each pair. */
+const SAMPLE: NotificationItem[] = [
+  {
+    id: 'mention',
+    title: 'Hoàng Tùng mentioned you in “Tokens”',
+    time: '5 minutes ago',
+    href: '#mention',
+    unread: true,
+    from: 'HT',
+  },
+  {
+    id: 'report',
+    title: 'The report for October is ready',
+    time: '32 minutes ago',
+    href: '#report',
+    unread: true,
+    icon: <CheckCircleIcon />,
+    tone: 'success',
+  },
+  {
+    id: 'task',
+    title: 'Lê Phương assigned you “Fix the primary button”',
+    time: '2 hours ago',
+    href: '#task',
+    unread: false,
+    from: 'LP',
+  },
+  {
+    id: 'meeting',
+    title: 'Design team meeting at 14:00 tomorrow',
+    time: 'Yesterday',
+    href: '#meeting',
+    unread: false,
+    icon: <CalendarIcon />,
+  },
+];
+
+type Recipe = ComponentType<NotificationsProps>;
+
+/**
+ * A recipe that keeps its own list: "Mark all as read" changes it, as the application's store would.
+ * `open` opens the panel at the start, for the stories that are about the panel.
+ */
+function Notifications({
+  recipe: Panel,
+  items: first = SAMPLE,
+  open = false,
+}: {
+  recipe: Recipe;
+  items?: NotificationItem[];
+  open?: boolean;
+}) {
+  const [items, setItems] = useState(first);
+  return (
+    <Panel
+      items={items}
+      onMarkAllRead={() => setItems((all) => all.map((item) => ({ ...item, unread: false })))}
+      popover={open ? { defaultOpen: true } : undefined}
+    />
+  );
+}
+
+// ---------------------------------------------------------------------------------------------------
+// The whole application, wide and narrow (S1, N1, H2, T1, U1, B1).
+
+// The stories with a header or a whole application are pages (stage `page`: a sticky header sticks to the
+// document); the strips of the bell at rest are not. The two whole applications ask axe for the rules
+// about pages (spec phase 5 §7, layer 3); a bell in a header is not a page.
+const IN_A_PAGE = { stage: 'page' };
+const A_PAGE = { ...IN_A_PAGE, a11y: { config: { rules: PAGE_RULES } } };
+
+const application = (
+  <>
+    <DemoStyles />
+    <Shell notifications={SAMPLE}>
+      <DemoContent />
+    </Shell>
+  </>
+);
+
+/** The application of the mockup on a wide screen: S1, N1, H2, T1, U1 and B1 together. */
+export const AppShellExample: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: A_PAGE,
+  render: () => application,
+};
+
+/** The same application on a phone: the sidebar is a sheet, the search keeps what room is left. */
+export const AppShellExamplePhone: Story = {
+  tags: ['viewport-390x844'],
+  parameters: A_PAGE,
+  render: () => application,
+};
+
+// ---------------------------------------------------------------------------------------------------
+// The recipe. The bell at rest sits in a strip; an open panel needs the real header, since the fill that
+// a ghost button keeps while its popup is open is a rule of the header of an AppShell.
+
+const BELL_STATES = (recipe: Recipe) => (
+  <div style={strips}>
+    <Strip caption="At rest, 2 unread" bell={<Notifications recipe={recipe} />} />
+    <Strip
+      caption="Nothing unread: no count, and the name says so"
+      bell={<Notifications recipe={recipe} items={SAMPLE.map((n) => ({ ...n, unread: false }))} />}
+    />
+  </div>
+);
+
+const bellOf = (root: HTMLElement) => within(root).getByRole('button', { name: /^Notifications/ });
+
+// The panel is in the page before it is opened, with nothing in it: the role query skips a popover
+// that is closed, so it is found by its class.
+const panelOf = (root: HTMLElement) => {
+  const panel = root.querySelector<HTMLElement>('.flg-popover');
+  if (!panel) throw new Error('The panel is not in the story.');
+  return panel;
+};
+const isOpen = (panel: HTMLElement) => panel.matches(':popover-open');
+
+/**
+ * The panel open, as the mockup draws it: it takes the focus when it opens, which draws the ring of the
+ * keyboard on "Mark all as read" when nothing was pressed, so the focus is let go once the panel is in
+ * place. The panel stays open: only a press outside, or Esc, closes it.
+ */
+const openPanel: Story['play'] = async ({ canvasElement }) => {
+  const panel = panelOf(canvasElement);
+  await waitFor(() => expect(isOpen(panel)).toBe(true));
+  await settled(panel);
+  (document.activeElement as HTMLElement | null)?.blur();
+  await expect(isOpen(panel)).toBe(true);
+};
+
+/** B1 at rest: a red count on the bell, which is named with the number. */
+export const NotificationsList: Story = {
+  render: () => BELL_STATES(ListNotifications),
+};
+
+/**
+ * B1 open, in a real header: the bell keeps the fill of an open button, and the panel hangs 17px under
+ * it, lined up with its end. A heading on a rule with "Mark all as read", and flat rows: the two unread
+ * ones with a bolder title and a dot.
+ */
+export const NotificationsListOpen: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: IN_A_PAGE,
+  render: () => <App header={<End bell={<Notifications recipe={ListNotifications} open />} />} />,
+  play: openPanel,
+};
+
+/** B1 with nothing in it: no count on the bell, and the panel says so, with no button. */
+export const NotificationsListEmpty: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: IN_A_PAGE,
+  render: () => (
+    <App header={<End bell={<Notifications recipe={ListNotifications} items={[]} open />} />} />
+  ),
+  play: openPanel,
+};
+
+/** B3 at rest: the same bell with an accent count. */
+export const NotificationsTabs: Story = {
+  render: () => BELL_STATES(TabbedNotifications),
+};
+
+/** B3 open: the tabs "All" and "Unread 2" under the heading, over plain rows. */
+export const NotificationsTabsOpen: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: IN_A_PAGE,
+  render: () => <App header={<End bell={<Notifications recipe={TabbedNotifications} open />} />} />,
+  play: openPanel,
+};
+
+/** B3 with nothing in it. */
+export const NotificationsTabsEmpty: Story = {
+  tags: ['viewport-1280x720'],
+  parameters: IN_A_PAGE,
+  render: () => (
+    <App header={<End bell={<Notifications recipe={TabbedNotifications} items={[]} open />} />} />
+  ),
+  play: openPanel,
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it. The tags are
+// written on each story, not in a helper: the Storybook indexer reads them without running the file.
+
+const MARK_ALL = { name: 'Mark all as read' };
+
+/** The header with the bell of `recipe` in it, the panel closed (`open`: open from the start). */
+const inHeader = (recipe: Recipe, open = false) => (
+  <App header={<End bell={<Notifications recipe={recipe} open={open} />} />} />
+);
+
+/**
+ * A row that is unread says so in more than its colour. Its name starts with "Unread: ", which a screen
+ * reader reads, its title is bolder, and its end has a dot, which is hidden from a screen reader since
+ * the words are there. A row that was read has none of the three.
+ */
+const checkUnreadIsMoreThanColour: Story['play'] = async ({ canvasElement }) => {
+  const panel = panelOf(canvasElement);
+  await waitFor(() => expect(isOpen(panel)).toBe(true));
+  // Both tabs keep their rows in the page, and the one that is not selected is hidden.
+  const rows = Array.from(panel.querySelectorAll<HTMLElement>('.flg-list-item')).filter((row) =>
+    row.checkVisibility(),
+  );
+  await expect(rows).toHaveLength(4);
+  const weights = rows.map(
+    (row) => getComputedStyle(row.querySelector('.flg-list-item-title')!).fontWeight,
+  );
+  const dots = rows.map((row) => row.querySelector('.notif-dot'));
+  await expect(rows.map((row) => row.hasAttribute('data-unread'))).toEqual([
+    true,
+    true,
+    false,
+    false,
+  ]);
+  // The bolder title: an unread row is above a read one.
+  await expect(Number(weights[0])).toBeGreaterThan(Number(weights[2]));
+  await expect(weights[0]).toBe(weights[1]);
+  await expect(weights[2]).toBe(weights[3]);
+  await expect(dots.map(Boolean)).toEqual([true, true, false, false]);
+  for (const dot of dots) if (dot) await expect(dot).toHaveAttribute('aria-hidden', 'true');
+  // The words: the name of the link, which is what a screen reader reads.
+  const links = within(panel).getAllByRole('link');
+  await expect(links).toHaveLength(4);
+  await expect(links[0]).toHaveAccessibleName(/^Unread: Hoàng Tùng mentioned you/);
+  await expect(links[1]).toHaveAccessibleName(/^Unread: /);
+  await expect(links[2]).toHaveAccessibleName(/^Lê Phương assigned you/);
+  await expect(links[3]).toHaveAccessibleName(/^Design team meeting/);
+};
+
+export const UnreadIsMoreThanColourList: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(ListNotifications, true),
+  play: checkUnreadIsMoreThanColour,
+};
+export const UnreadIsMoreThanColourTabs: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(TabbedNotifications, true),
+  play: checkUnreadIsMoreThanColour,
+};
+
+/**
+ * The name of the bell carries the count, because the number on its corner is hidden from a screen
+ * reader; with nothing unread there is no number and the name is only "Notifications". "Mark all as
+ * read" changes both, and leaves the focus on the button that was pressed: the button stays where it
+ * is, so the focus does not fall to the page. Esc then closes the panel and the focus goes back to the
+ * bell. Trusted input: a press on the button, and Esc, need it.
+ */
+const checkMarkAllAsRead: Story['play'] = async ({ canvasElement }) => {
+  const real = await realUserEvent();
+  if (!real) return;
+  const bell = bellOf(canvasElement);
+  const panel = panelOf(canvasElement);
+  await expect(bell).toHaveAccessibleName('Notifications, 2 unread');
+  const mark = () => canvasElement.querySelector('.flg-indicator-mark');
+  await expect(mark()).toHaveTextContent('2');
+  await expect(mark()).toHaveAttribute('aria-hidden', 'true');
+
+  await real.click(bell);
+  await waitFor(() => expect(isOpen(panel)).toBe(true));
+  const button = within(panel).getByRole('button', MARK_ALL);
+  await real.click(button);
+  await waitFor(() => expect(bell).toHaveAccessibleName('Notifications'));
+  await expect(mark()).toBeNull();
+  await expect(panel.querySelectorAll('[data-unread]')).toHaveLength(0);
+  await expect(panel.querySelectorAll('.notif-sr')).toHaveLength(0);
+  // The button is still there, and the focus did not fall to the page. A press does not give a button
+  // the focus in every engine (Safari gives it to the panel, which has a tabindex), so what is asked
+  // of the press is that the focus is inside the panel; the key, which needs the focus on the button,
+  // is the proof that the button keeps it.
+  await expect(within(panel).getByRole('button', MARK_ALL)).toBe(button);
+  await expect(panel.contains(document.activeElement)).toBe(true);
+  button.focus();
+  await real.keyboard('{Enter}');
+  await expect(within(panel).getByRole('button', MARK_ALL)).toBe(button);
+  await expect(button).toHaveFocus();
+
+  await real.keyboard('{Escape}');
+  await waitFor(() => expect(isOpen(panel)).toBe(false));
+  await expect(bell).toHaveFocus();
+};
+
+export const MarkAllAsReadList: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(ListNotifications),
+  play: checkMarkAllAsRead,
+};
+export const MarkAllAsReadTabs: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(TabbedNotifications),
+  play: checkMarkAllAsRead,
+};
+
+/**
+ * B3: "Unread" shows the unread rows only, and its badge has their number. "Mark all as read" on that
+ * tab empties it, and the panel says there is nothing new, with the focus still on the button; "All"
+ * still has the four rows, now read.
+ */
+export const TabsFilterTheRows: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(TabbedNotifications, true),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const panel = panelOf(canvasElement);
+    await waitFor(() => expect(isOpen(panel)).toBe(true));
+    const inPanel = within(panel);
+    const rowsShown = () => inPanel.queryAllByRole('link').length;
+
+    await expect(rowsShown()).toBe(4);
+    const unreadTab = inPanel.getByRole('tab', { name: /^Unread/ });
+    await expect(unreadTab.querySelector('.flg-badge')).toHaveTextContent('2');
+    await real.click(unreadTab);
+    await waitFor(() => expect(rowsShown()).toBe(2));
+    for (const link of inPanel.getAllByRole('link')) {
+      await expect(link).toHaveAccessibleName(/^Unread: /);
+    }
+
+    const button = inPanel.getByRole('button', MARK_ALL);
+    await real.click(button);
+    await waitFor(() => expect(rowsShown()).toBe(0));
+    await expect(inPanel.getByText('No new notifications')).toBeVisible();
+    await expect(unreadTab.querySelector('.flg-badge')).toBeNull();
+    await expect(inPanel.getByRole('button', MARK_ALL)).toBe(button);
+    await expect(panel.contains(document.activeElement)).toBe(true);
+
+    await real.click(inPanel.getByRole('tab', { name: 'All' }));
+    await waitFor(() => expect(rowsShown()).toBe(4));
+    await expect(panel.querySelectorAll('[data-unread]')).toHaveLength(0);
+  },
+};
+
+/**
+ * Where the panel is: 360px wide, 17px under the bell and lined up with its end, so its right edge is
+ * the bell's, and inside the window.
+ */
+const checkPanelPlace: Story['play'] = async ({ canvasElement }) => {
+  const panel = panelOf(canvasElement);
+  await waitFor(() => expect(isOpen(panel)).toBe(true));
+  await settled(panel);
+  const bell = bellOf(canvasElement).getBoundingClientRect();
+  const box = panel.getBoundingClientRect();
+  await expect(box.width).toBe(360);
+  await expect(Math.abs(box.top - (bell.bottom + 17))).toBeLessThan(1);
+  await expect(Math.abs(box.right - bell.right)).toBeLessThan(1);
+  await expect(box.left).toBeGreaterThanOrEqual(0);
+  await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
+};
+
+export const PanelPlaceList: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(ListNotifications, true),
+  play: checkPanelPlace,
+};
+export const PanelPlaceTabs: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(TabbedNotifications, true),
+  play: checkPanelPlace,
+};
+
+/**
+ * On a phone the panel is as wide as the window leaves it (360px, less the 16px that the popover keeps
+ * clear on each side), inside the window, and the page does not scroll sideways.
+ */
+export const PanelOnAPhone: Story = {
+  tags: ['no-visual'],
+  parameters: IN_A_PAGE,
+  render: () => inHeader(ListNotifications, true),
+  play: async ({ canvasElement }) => {
+    await withViewport(async (viewport) => {
+      await viewport.set(390, 844);
+      const panel = panelOf(canvasElement);
+      await waitFor(() => expect(isOpen(panel)).toBe(true));
+      await settled(panel);
+      const box = panel.getBoundingClientRect();
+      await expect(box.left).toBeGreaterThanOrEqual(0);
+      await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
+      await expect(box.width).toBeLessThanOrEqual(360);
+      await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
+        document.documentElement.clientWidth,
+      );
+    });
+  },
+};
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/list
```

Expected: FAIL.
- `List.test.tsx`: các test của `describe('surface')` fail trên `List` chưa có prop đó, ví dụ `false takes the glass off an inset list and says so with data-surface` (`expect(element).not.toHaveClass("flg-surface")`) và `has no effect on another variant, which warns once and keeps its own DOM` (`warn` được gọi 0 lần).
- `List.test-d.ts`: `Property 'surface' does not exist …`.

Story không chạy ở bước này: `AppShellExample.stories.tsx` import `./app-shell-example/…`, chưa có, và `InsetWithoutSurface` cần prop mới. Story của AppShell nay lấy `PAGE_RULES` từ `.storybook/app-shell-demo.tsx` (có trong patch test này).

Theo báo cáo của bản nháp (phát hiện 19): unit test và test kiểu của `surface` được viết trước và fail như trên. `InsetWithoutSurface` viết sau CSS (đặc tả; đột biến selector làm nó fail). Công thức và story của nó viết sau code; ba đột biến đều bị bắt. Sửa của `SheetCloses…` không có test fail trước: lỗi chưa tái hiện được trên máy này (phát hiện 14).

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index daf21cd..85b545c 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -317,7 +317,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục, tiêu đề flyout của nhóm ở rail và số đếm trần của `bar`; ở UserMenu: dòng phụ ở đầu menu | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục, tiêu đề flyout của nhóm ở rail và số đếm trần của `bar`; ở UserMenu: dòng phụ ở đầu menu; ở bảng thông báo (công thức): thời gian của thông báo | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List, chữ và icon của mục đang chọn Nav `pill` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List, nền mục đang chọn của Nav `pill` | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ, kể cả icon ở cuối mục của `ThemeMenuGroup`; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
@@ -325,7 +325,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
 | 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được, và mô tả của bước Stepper bấm được, và chữ mờ trên hàng của Table, khi hover (`inset`, `plain`; `cards` ở dark), và số đếm trần của Nav `bar` khi hover | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
-| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`); viền 1.5px của hàng hiện tại (List `cards`); vạch 3px của mục đang chọn ở rail (Nav `bar`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
+| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`); viền 1.5px của hàng hiện tại (List `cards`); vạch 3px của mục đang chọn ở rail (Nav `bar`); chấm chưa đọc trong bảng thông báo (công thức) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
 | 16 | Rãnh của Slider và của Progress (`--flg-control-track`) so với nền; thanh của bước chưa tới (Stepper `bars`) | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
 | 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
@@ -340,7 +340,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 26 | Chữ `--flg-accent-text` trên `--flg-control-bg`: tiêu đề Alert `plain` `info`; số của bước hiện tại, Stepper `circles` và `compact` | đạt (5.78:1 Alert, 5.67:1 Stepper) | 3.90:1 Alert, 3.33:1 Stepper | 4.5:1 | 1.4.3 |
 | 27 | Phần đã chạy của Progress `thin` và `inline` (các điểm của `--flg-accent-gradient`, `--flg-success`, `--flg-danger`) so với rãnh `--flg-control-track`; nửa đã chạy của thanh bước hiện tại (Stepper `bars`) | 2.45:1 | 1.74:1 | 3:1 | 1.4.11 |
 | 28 | Phần đã chạy của Progress `glow`, kể cả lớp ánh sáng trắng 24% ở nửa trên, so với rãnh | 1.62:1 | 1.74:1 | 3:1 | 1.4.11 |
-| 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; dòng "Step N" của bước xong và bước hiện tại (Stepper `bars`); nhãn của nhóm chứa trang hiện tại (Nav `pill`) | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
+| 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; dòng "Step N" của bước xong và bước hiện tại (Stepper `bars`); nhãn của nhóm chứa trang hiện tại (Nav `pill`); nút "Mark all as read" của bảng thông báo (công thức) | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
 | 30 | Vòng của bước chưa tới (`--flg-stepper-ring`, 65% `--flg-text-muted`) so với nền: Stepper `circles` và `compact` | 2.63:1 | 2.63:1 | 3:1 | 1.4.11 |
 | 31 | Vạch `--flg-accent-solid` trên nền nhấn nhạt `--flg-selected-bg`: viền 2px của dấu tròn bước hiện tại, Stepper `compact`; vạch 3px của hàng hiện tại, List `inset` | 2.61:1 | 2.01:1 | 3:1 | 1.4.11 |
 | 32 | Chữ của Badge trên hàng đang hover (`--flg-control-track`): Table (cả ba variant); Badge ở ô cuối của hàng List bấm được; số đếm `Badge` của mục Nav `pill` | 2.80:1 `accent` (trạng thái 3.69:1) | 3.03:1 `accent` (trạng thái 3.67:1, `neutral` 4.15:1) | 4.5:1 | 1.4.3 |
@@ -365,6 +365,8 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 9 còn có icon ở cuối mục của `ThemeMenuGroup` khi mục đang được trỏ (giai đoạn 5, Plan C): `--flg-highlight-icon`, tức `--flg-text-muted` ở theme mặc định, trên nền `--flg-highlight-bg`, cùng cặp màu với icon của mọi item menu, nên cùng số đo và cùng ngưỡng 3:1, không thêm dòng (spec giai đoạn 5 §4.4). Ở `prefers-contrast: more` `--flg-highlight-icon` là `--flg-highlight-text`; ở `forced-colors` icon lấy màu chữ của mục (§4.5).
 
+Điểm 6, 14 và 29 còn có các vị trí của công thức bảng thông báo (giai đoạn 5, Plan C; docs, không phải component): thời gian của thông báo (điểm 6, `--flg-text-muted` trên kính của bảng, như mô tả của `List`), chấm chưa đọc 8px `--flg-accent-solid` (điểm 14: 3.04:1 light và 2.29:1 dark so với nền, dưới 3:1 ở dark) và nút "Mark all as read" (điểm 29, `--flg-accent-text` trên kính). Cùng cặp màu nên cùng số đo, không thêm dòng (spec giai đoạn 5 §4.4). Chấm chưa đọc không phải dấu hiệu duy nhất: hàng chưa đọc còn có tiêu đề đậm hơn và chữ "Unread: " ẩn khỏi mắt, và chấm bị ẩn khỏi công nghệ hỗ trợ (`aria-hidden`); đó là bối cảnh khi duyệt, không miễn tiêu chí.
+
 Điểm 35 là vạch của mục đang chọn Nav `bar` theo mockup N2 (giai đoạn 5, Plan B): vạch `--flg-accent-solid` rộng 3px trên nền nhuộm `color-mix` 18% của chính màu đó, nên thấp ở cả hai theme; mục đó còn có chữ đậm và `aria-current="page"`, nên vạch không phải dấu hiệu duy nhất. Chữ `--flg-text` của mục (và số đếm của nó) đạt (8.24:1 light, 5.82:1 dark, thấp nhất của hai điểm 18% và 3% của nền) và icon `--flg-accent-text` đạt (3.28:1, 3.80:1), nên không phải ngoại lệ. Các vị trí khác của Nav cùng cặp màu với các điểm 2 (vòng focus của mục và nút nhóm), 6 (tiêu đề mục, số đếm trần của `bar`), 7 và 8 (chữ, icon và nền của mục đang chọn `pill`), 12 (số đếm trần của `bar` khi hover), 29 (nhãn của nhóm chứa trang hiện tại, `pill`) và 32 (`Badge` đếm của `pill` khi hover, dark 4.15:1 `neutral`), nên được ghi ở đó. Ở `prefers-contrast: more` cả ba cặp mới đều đạt (4.65:1, 11.44:1 và 4.55:1 ở light; 5.30:1, 10.17:1 và 6.64:1 ở dark).
 
 Điểm 36 là chữ của phím gợi ý (`⌘K`) trong ô SearchField theo mockup H2 và H3 (giai đoạn 5, Plan C): `--flg-text-muted` trên nền `--flg-control-bg-secondary` của phím, nằm trên nền ô (`--flg-control-bg`) hoặc trên kính của tooltip của nút thu gọn. Ở dark là 3.31:1 trong ô và 3.76:1 trong tooltip, nên ghi 3.31:1 (số thấp hơn); light đạt cả hai (7.15:1). Phím gợi ý là chữ phụ ẩn khỏi công nghệ hỗ trợ (`aria-hidden`), và phím tắt được nói qua `aria-keyshortcuts` trên ô và trên nút thu gọn, nên không có thông tin nào chỉ nằm ở chữ đó; hai điều này không miễn tiêu chí, chỉ là bối cảnh khi duyệt. Ở `prefers-contrast: more` đạt (7.83:1 light, 7.63:1 dark).
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index 69aec26..8fcb525 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -441,6 +441,8 @@ Công thức docs, không phải component. Ghép từ phần có sẵn; số đ
   - Mỗi hàng là `ListItem` có `href` (hoặc `onSelect`): ô đầu là `Avatar` `md` hoặc một vòng icon 32px (nền `--flg-control-track`, icon 17px `--flg-text-muted`; thông báo thành công: nền `--flg-success` pha `--flg-status-bg-alpha`, icon `--flg-success`); tiêu đề đậm `--flg-weight-regular`; mô tả là thời gian.
   - **Chưa đọc** (không chỉ bằng màu): tiêu đề đậm `--flg-weight-semibold`, chữ ẩn "Unread: " ở đầu tiêu đề, và một chấm 8px `--flg-accent-solid` ở ô cuối (`aria-hidden`).
   - **Rỗng:** cột căn giữa, khoảng cách 6px, padding `18px 16px 22px` (B1: trên 22px), vòng icon 40px (icon chuông 20px), tiêu đề `--flg-text-sm` đậm, gợi ý `--flg-text-xs` `--flg-text-muted`.
+- **"Mark all as read" ở yên** (phát hiện khi lập Plan C): nút còn đó cả khi không còn hàng chưa đọc, và chỉ mất khi danh sách rỗng (không có gì để đánh dấu). Nếu nó biến mất ngay khi bấm xong thì focus rơi xuống đầu trang; ở lại thì bấm thêm lần nữa không đổi gì. Ở Safari một cú bấm chuột không đưa focus vào nút mà vào tấm (tấm có `tabindex`), nên story chỉ đòi focus còn nằm trong tấm sau khi bấm chuột, và đòi nút giữ focus sau khi bấm phím.
+- **Chuông có `count` là số chưa đọc** (phát hiện khi lập Plan C): `Indicator` nhận `count={số chưa đọc}` và tự không vẽ gì ở 0, nên công thức không cần `show`; tên của nút vẫn phải tự ghép số (§4.3 Indicator).
 - **Thay đổi của `List`** (Plan C): prop `surface?: boolean`, mặc định `true`, chỉ có tác dụng ở `inset`. `false` thì gốc không mang lớp `flg-surface` (không kính, không viền, không bo, không bóng của riêng nó) và mang `data-surface="false"`; hàng đầu và hàng cuối bỏ góc bo của mình (nền hover chạm thẳng hai mép của tấm chứa). Đường ngăn, hover và hàng hiện tại giữ như `inset`. Dùng cho List đặt trong một tấm đã là kính (Popover, Card, Dialog). Ở variant khác thì không có tác dụng và `devWarn`.
 
 ### 4.4 Tương phản (bổ sung cho §4.9 của spec 0+1)
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 0e05eb8..b754c45 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -57,7 +57,8 @@ const D = {
       'description and the end cell of a row, and in a Table `striped` and `minimal` the column ' +
       'headings and the icon of a column that is not sorted, the text of an AppShell footer, and in ' +
       'a Nav the title of a section and of the flyout of a group at the rail, and the count of `bar`, ' +
-      'and in a UserMenu the line under the name at the top of the menu',
+      'and in a UserMenu the line under the name at the top of the menu, and in the notifications ' +
+      'panel of the recipe the time of a notification',
     criterion: '1.4.3',
   },
   7: {
@@ -110,7 +111,8 @@ const D = {
     description:
       'The icon and bar of an info toast, the 2px border of the dot of the current step in a ' +
       'Stepper `circles`, the 1.5px outline of the current row of a List `cards`, and the 3px bar of ' +
-      'the current item of a Nav `bar` at the rail, against the surface',
+      'the current item of a Nav `bar` at the rail, and the dot of an unread notification in the ' +
+      'recipe, against the surface',
     criterion: '1.4.11',
   },
   15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
@@ -181,7 +183,7 @@ const D = {
     description:
       'Accent text on the surface: the value of a Progress `glow`, the "Step N" line of a ' +
       'done or current step in a Stepper `bars`, and the label of the group of a Nav `pill` that ' +
-      'holds the current page',
+      'holds the current page, and the "Mark all as read" button of the notifications recipe',
     criterion: '1.4.3',
   },
   30: {
diff --git a/src/components/list/List.mdx b/src/components/list/List.mdx
index 70b59b5..7996e95 100644
--- a/src/components/list/List.mdx
+++ b/src/components/list/List.mdx
@@ -29,10 +29,11 @@ import { Avatar, Badge, List, ListItem } from 'h2d-glass-ui';
 
 ### List
 
-| Prop      | Type                            | Default   | Does                              |
-| --------- | ------------------------------- | --------- | --------------------------------- |
-| `variant` | `'inset' \| 'cards' \| 'plain'` | `'inset'` | The look (see Variants)           |
-| `size`    | `'sm' \| 'md'`                  | `'md'`    | The height of a row: 44px or 52px |
+| Prop      | Type                            | Default   | Does                                        |
+| --------- | ------------------------------- | --------- | ------------------------------------------- |
+| `variant` | `'inset' \| 'cards' \| 'plain'` | `'inset'` | The look (see Variants)                     |
+| `size`    | `'sm' \| 'md'`                  | `'md'`    | The height of a row: 44px or 52px           |
+| `surface` | `boolean`                       | `true`    | `false`: no glass of its own (Inside glass) |
 
 `ref`, `className`, `style` and the other attributes of a `ul` go to the list. It carries
 `role="list"`, since Safari drops the list semantics of a list that has `list-style: none`.
@@ -112,6 +113,28 @@ its name and state readable.
 <Canvas of={Stories.Cards} />
 <Canvas of={Stories.Plain} />
 
+## Inside glass
+
+An `inset` list is a block of glass, and a block of glass inside a Popover, a Card or a Dialog is
+glass on glass: a second border, shadow and blur, and corners that do not follow the panel. Pass
+`surface={false}` for a list that sits in a panel like that. The list then has no glass, border,
+corners or shadow of its own and carries `data-surface="false"`; its first and last rows have
+square corners, so that their hover background runs to the edges of the panel. The rule between the
+rows, the hover and the current row are the ones of `inset`.
+
+```tsx
+<PopoverContent aria-label="Notifications" style={{ padding: 0 }}>
+  <List surface={false} aria-label="Notifications">
+    <ListItem title="Ada commented on your file" description="5 minutes ago" href="/inbox/1" />
+    <ListItem title="Your report is ready" description="32 minutes ago" href="/inbox/2" />
+  </List>
+</PopoverContent>
+```
+
+`surface` only has an effect on `variant="inset"`: the other variants draw no glass of their own,
+and `surface={false}` on one is ignored, with a warning in development. See the
+[notifications recipe](?path=/docs/examples-app-shell--docs) for a full panel.
+
 ## Sizes
 
 `size="md"` (52px) fits a list of people with an avatar and two lines. `size="sm"` (44px) is for a
diff --git a/src/components/list/List.tsx b/src/components/list/List.tsx
index cb2f610..abaeede 100644
--- a/src/components/list/List.tsx
+++ b/src/components/list/List.tsx
@@ -17,6 +17,13 @@ export type ListVariant = 'inset' | 'cards' | 'plain';
 export type ListProps = HTMLAttributes<HTMLUListElement> & {
   variant?: ListVariant;
   size?: 'sm' | 'md';
+  /**
+   * Whether an `inset` list is a block of glass of its own. Pass `false` for a list that sits in a
+   * panel that is already glass (a Popover, a Card, a Dialog): the rows run to the edges of the panel
+   * and there is no second layer of glass, border and shadow. Has no effect on another variant.
+   * Default `true`.
+   */
+  surface?: boolean;
 };
 
 /** What the library puts on the `<a>` of a link row, for `renderLink` to pass on. */
@@ -60,18 +67,26 @@ export type ListItemProps = Omit<
  * state and no hook, so it renders in a Server Component.
  */
 export const List = forwardRef<HTMLUListElement, ListProps>(function List(
-  { variant = 'inset', size = 'md', className, ...props },
+  { variant = 'inset', size = 'md', surface = true, className, ...props },
   ref,
 ) {
+  // The glass belongs to `inset` alone, so `false` has something to take away only there.
+  if (!surface && variant !== 'inset') {
+    devWarn(
+      '<List> surface={false} only has an effect on variant="inset"; the other variants draw no glass of their own.',
+    );
+  }
+  const flat = !surface && variant === 'inset';
   return (
     // Safari drops the list semantics of a list with `list-style: none`, so the role says it again.
     // eslint-disable-next-line jsx-a11y/no-redundant-roles
     <ul
       ref={ref}
       role="list"
-      className={clsx('flg-list', variant === 'inset' && 'flg-surface', className)}
+      className={clsx('flg-list', variant === 'inset' && !flat && 'flg-surface', className)}
       data-variant={variant}
       data-size={size}
+      data-surface={flat ? 'false' : undefined}
       {...props}
     />
   );
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 5da5a73..0c59420 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -65,8 +65,8 @@ Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and it
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
 9, 12 and 22), AppShell (its part in rows 2 and 6), Nav (row 35, and its part in rows 2, 6, 7, 8,
 12, 14, 29 and 32), SearchField (row 36, and its part in row 2), UserMenu (its part in
-rows 2 and 6) and ThemeMenuGroup (its part in row 9) are in the table above, which is built from
-the same data CI checks.
+rows 2 and 6), ThemeMenuGroup (its part in row 9) and the notifications recipe (its part in rows 6,
+14 and 29) are in the table above, which is built from the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
@@ -164,6 +164,24 @@ when a change is announced.
   unread"). The colour of the mark only reinforces: in forced colours every status is the selection
   colour.
 
+## The widgets of the header
+
+- **The key of the SearchField.** `shortcut="mod+k"` (or `"/"`) focuses the field from anywhere on
+  the page, and opens it when it is collapsed, except while the person types in another field or
+  the key was handled already. The field carries `aria-keyshortcuts`, so assistive technology can
+  say the key; the hint drawn in the field (⌘K or Ctrl K, by platform) is for the eye. Where an
+  application already uses ⌘K, or a browser takes Ctrl K for its own search, use `"/"`.
+- **The theme says what it is now.** The name of a `ThemeSwitch` is "Theme: Light", the theme it has,
+  and it changes with the theme. A hidden hint, "Click to switch to Dark", says where a press goes.
+  The icons differ in shape, so the three are not told by colour alone.
+- **The menu of the person names itself.** The button is "Account: Ada Lovelace" and opens a menu
+  that is described by the lines at its head (the name, and the address under it).
+- **The bell says how many.** The number on the corner is only for the eyes, so the name of the
+  button has it: "Notifications, 2 unread". An unread notification is told by its words
+  ("Unread: …", hidden from sight), its bolder title and a dot, never by colour alone, and "Mark all
+  as read" keeps the focus where it was. The recipe is on the page
+  [Examples/App shell](?path=/docs/examples-app-shell--docs#what-a-screen-reader-is-told).
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
diff --git a/src/docs/AppShellExample.mdx b/src/docs/AppShellExample.mdx
new file mode 100644
index 0000000..5ce105a
--- /dev/null
+++ b/src/docs/AppShellExample.mdx
@@ -0,0 +1,120 @@
+import { Meta, Source } from '@storybook/addon-docs/blocks';
+import { StoryFrame } from '../../.storybook/story-frame';
+import * as Stories from './AppShellExample.stories';
+import iconsCode from './app-shell-example/icons.tsx?raw';
+import notificationsCode from './app-shell-example/notifications.tsx?raw';
+import notificationsCss from './app-shell-example/notifications.css?raw';
+import shellCode from './app-shell-example/Shell.tsx?raw';
+
+export const asShown = (code) => code.replaceAll("'../../index'", "'h2d-glass-ui'");
+
+<Meta of={Stories} />
+
+# App shell
+
+A whole application, built from the library and nothing else: "Lumen", the application of the
+mockups. A sidebar with a navigation that has a group and counts, and a header with the search, the
+notifications, the theme and the account. This page shows it, and gives the code of each part. The
+code is the code the stories run: it is copied from the files, not written again for the page.
+
+## The application
+
+On a wide screen: the sidebar layout (S1, `layout="sidebar"`), the pill navigation (N1,
+`variant="pill"`), the search field (H2), the theme button (T1), the menu of the person with the
+avatar alone (U1) and the notifications with a red count and a list (B1).
+
+<StoryFrame title="The application on a wide screen" id="examples-app-shell--app-shell-example" />
+
+On a phone the sidebar is a sheet that the button in the header opens, and the search field takes
+the room that the other widgets leave:
+
+<StoryFrame
+  title="The application on a phone"
+  id="examples-app-shell--app-shell-example-phone"
+  phone
+/>
+
+## The frame
+
+The frame is a Client Component, because the notifications keep a list in state here. The page
+that it frames, `children`, can be a Server Component: `AppShell` and its parts render on the server
+too, and what is client is only what has state. See
+[Getting started](?path=/docs/docs-getting-started--docs#app-shell) for the layout of a Next.js
+application, the cookie that keeps the sidebar folded, and the theme script.
+
+The widgets at the end of the header sit in a row of their own with `margin-left: auto`: the header
+is a row, and that pushes them to its end. Everything else is a part of the library.
+
+<Source code={asShown(shellCode)} language="tsx" />
+
+## The notifications panel
+
+The library has no notifications component. A panel is put together from parts it has, and the
+numbers of the mockups are in the stylesheet of the example. Two looks were drawn, and both are
+here: B1 has a red count and a list with rules between the rows, B3 has an accent count and the tabs
+"All" and "Unread" over a plain list. They share the rows, the heading and the empty state, so
+choosing between them is choosing which function to call.
+
+- **The bell** is an `IconButton` that is the trigger of a `Popover` (`PopoverTrigger asChild`), in
+  an `Indicator`: `status="danger"` for B1 and `"accent"` for B3, with the number of unread
+  notifications as `count`. At 0 the `Indicator` draws nothing.
+- **The panel** is a `PopoverContent` 360px wide, 17px under the bell and lined up with its end, with
+  no arrow. It is named "Notifications".
+- **The list** of B1 is a `List` that is `inset` with `surface={false}`: the panel is the glass
+  already, and a second block of glass in it would be glass on glass (see
+  [List](?path=/docs/components-list--docs#inside-glass)). B3 uses `variant="plain"`. A row is a
+  `ListItem` with an `href`, so a press anywhere on it follows the link.
+
+<StoryFrame title="B1: the panel open" id="examples-app-shell--notifications-list-open" />
+
+<StoryFrame title="B3: the panel open" id="examples-app-shell--notifications-tabs-open" />
+
+### What a screen reader is told
+
+- **The name of the bell has the count in it.** The number on the corner of the bell is for the eyes:
+  the `Indicator` hides it from a screen reader. The name is "Notifications, 2 unread", and with
+  nothing unread it is "Notifications" (and there is no count to draw). Without the number in the
+  name, the one thing the bell is for would not be said. Do not set the name to "Notifications" and
+  expect the count to be read: it will not be.
+- **An unread notification is told by more than its colour.** The title is bolder, a dot ends the
+  row, and the title starts with the words "Unread: ", visually hidden, so that its name reads
+  "Unread: Hoàng Tùng mentioned you…". The dot is `aria-hidden`: the words are there. In forced
+  colours, which drop the background of the dot, it is drawn in the colour of the system's highlight.
+- **"Mark all as read" leaves the focus where it is.** The button is not removed when there is nothing
+  unread any more: pressing it would take it from under the focus, and the focus would fall to the
+  top of the page. It stays while there is anything in the list, and a press on it then changes
+  nothing. Only an empty panel has no button.
+- **The empty panel says so** ("No new notifications"), instead of being a heading above nothing.
+- The panel is a non-modal dialog, which the [Popover](?path=/docs/components-popover--docs) gives:
+  Tab moves into it from the bell, Esc and a press outside close it, and the focus goes back to the
+  bell.
+
+### The panel in its states
+
+<StoryFrame title="B1: nothing in the panel" id="examples-app-shell--notifications-list-empty" />
+
+<StoryFrame title="B3: nothing in the panel" id="examples-app-shell--notifications-tabs-empty" />
+
+### The code
+
+The panel takes the notifications, and a function to call when the person presses "Mark all as read":
+the application marks them, wherever it keeps them, and passes the new list. `popover` is for the
+state of the panel (`open`, `defaultOpen`, `onOpenChange`), when the application wants to close it
+itself, after a row led somewhere.
+
+<Source code={asShown(notificationsCode)} language="tsx" />
+
+Its stylesheet. It is not in a layer, so it wins over the library's without `!important`:
+
+<Source code={notificationsCss} language="css" />
+
+The icons are the application's own. The library draws none, so a panel does not depend on an icon
+set:
+
+<Source code={iconsCode} language="tsx" />
+
+### With a router
+
+A row is a link. With a router, pass the router's `Link` through `renderLink`, as the page of
+[List](?path=/docs/components-list--docs) shows, or use `onSelect` for a row that does something
+other than lead to a page. The rest of the recipe does not change.
diff --git a/src/docs/GettingStarted.mdx b/src/docs/GettingStarted.mdx
index 32168d4..e78b3b7 100644
--- a/src/docs/GettingStarted.mdx
+++ b/src/docs/GettingStarted.mdx
@@ -50,7 +50,8 @@ Input, Textarea, Checkbox, RadioGroup and Switch. Phase 2 adds Dialog, Drawer, P
 DropdownMenu, ContextMenu, Select, Tabs, Accordion, Breadcrumb, Pagination and Toast. Phase 3 adds
 the advanced inputs: Slider, NumberInput, SegmentedControl, Combobox, TagInput, FileUpload, Calendar
 and DatePicker. Phase 4 adds the display of data and of progress: Alert, Progress, Skeleton,
-Stepper, List and Table.
+Stepper, List and Table. Phase 5 adds the frame of an application: AppShell, Nav, Indicator,
+SearchField, ThemeSwitch and UserMenu.
 
 ## Overlays
 
@@ -452,6 +453,128 @@ export function Checkout() {
 The [Stepper](?path=/docs/components-stepper--docs) page shows the wrong way to write it, and the
 warning it causes.
 
+## App shell
+
+`AppShell` is the frame of an application: a header, a sidebar with a navigation, the main content
+and, if you want one, a footer. The CSS lays it out, so the HTML from the server is right at every
+width. This is the least you write; each part has a page of its own, and
+[Examples/App shell](?path=/docs/examples-app-shell--docs) has a whole application with the search,
+the notifications, the theme and the account in the header.
+
+```tsx
+import {
+  AppShell,
+  AppShellBrand,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+  Nav,
+  NavItem,
+} from 'h2d-glass-ui';
+
+<AppShell brand={<AppShellBrand logo={<LogoMark />} name="Lumen" href="/" />}>
+  <AppShellHeader>{/* search, notifications, the user */}</AppShellHeader>
+  <AppShellSidebar>
+    <Nav aria-label="Main">
+      <NavItem href="/" icon={<HomeIcon />} active>
+        Overview
+      </NavItem>
+      <NavItem href="/inbox" icon={<InboxIcon />} badge={12}>
+        Inbox
+      </NavItem>
+    </Nav>
+  </AppShellSidebar>
+  <AppShellMain>{children}</AppShellMain>
+  <AppShellFooter>© 2026 Lumen</AppShellFooter>
+</AppShell>;
+```
+
+The header, the sidebar, the main and the footer must be direct children of `AppShell`. The footer
+is optional, and so are the header and the sidebar: with no sidebar the page is one column.
+
+### Server and client
+
+`AppShell`, `Nav` and the widgets of the header (`SearchField`, `ThemeSwitch`, `UserMenu`) are
+client components, since they keep state. The page is not: a Server Component renders a small
+client component that holds the shell, and hands it the page as `children`, so what is in
+`AppShellMain` stays on the server. `AppShellBrand` and `Indicator` need no client code at all.
+
+The navigation is data, drawn by a component that reads the path: a router's `Link` goes into
+`NavItem` with `asChild`, and `active` comes from the current path (see
+[Nav](?path=/docs/components-nav--docs#the-current-page-and-next-js)).
+
+### Keep the sidebar folded
+
+`AppShell` keeps the sidebar folded into a rail in its own state, which a reload would lose. Keep it
+in a cookie, which the server can read when it sends the HTML, so that the page arrives already
+folded:
+
+```tsx
+// app/(app)/layout.tsx: Server Component
+const collapsed = (await cookies()).get('flg-sidebar')?.value === 'collapsed';
+return <Shell defaultCollapsed={collapsed}>{children}</Shell>;
+
+// shell.tsx: 'use client'
+<AppShell
+  defaultCollapsed={defaultCollapsed}
+  onCollapsedChange={(c) => {
+    document.cookie = `flg-sidebar=${c ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
+  }}
+>
+```
+
+`onCollapsedChange` is a function, so it can only be passed from a client component: that is why
+the shell is one.
+
+### Two rules for the document
+
+On a page that renders an `AppShell`, and only there, the library sets two rules on the document.
+Both are in a layer, so a rule of yours wins:
+
+- `scroll-padding-top` on `<html>` is the height of the header, so that a focused control, a link to
+  `#anchor` and a hit of find-in-page do not land under the sticky header.
+- `body` has no margin, so that the frame touches the four edges of the screen.
+
+If you set your own `scroll-padding-top` or margin, add the height of the header yourself with
+`var(--flg-app-shell-header-offset)`. The [AppShell](?path=/docs/components-appshell--docs#rules-for-the-document)
+page has the details.
+
+### The theme, and no flash
+
+A person who chose Dark would see a flash of light before `ThemeSwitch` has read what they chose.
+`ThemeScript` in the `<head>` sets the theme before the first paint, and `suppressHydrationWarning`
+on `<html>` tells React that the script changed the element:
+
+```tsx
+// app/layout.tsx
+import { ThemeScript } from 'h2d-glass-ui';
+import 'h2d-glass-ui/styles.css';
+
+export default function RootLayout({ children }: { children: React.ReactNode }) {
+  return (
+    <html lang="en" suppressHydrationWarning>
+      <head>
+        <ThemeScript />
+      </head>
+      <body>{children}</body>
+    </html>
+  );
+}
+```
+
+With next-themes, do not render `ThemeScript` (it has a script of its own): set
+`attribute="data-flg-theme"` and pass its value to a controlled `ThemeSwitch`. A Content Security
+Policy that needs a nonce is on the [ThemeSwitch](?path=/docs/components-themeswitch--docs) page.
+
+### The Toaster, and text on the page
+
+- Render `<Toaster />` outside `AppShell`. The header, the main and the footer are `inert` while the
+  sheet of a narrow screen is open, and a toast inside one of them could be neither seen nor pressed.
+- Put text that sits straight on the page, with no card behind it, in `--flg-text`, not in
+  `--flg-text-muted`. The muted colour is tuned for text on glass, and is not guaranteed to reach
+  AA on the bare gradient of the page (see the known gaps in Accessibility).
+
 ## Pick a theme
 
 Without a `data-flg-theme` attribute the library follows the operating system's light or dark
diff --git a/src/docs/app-shell-example/Shell.tsx b/src/docs/app-shell-example/Shell.tsx
new file mode 100644
index 0000000..7e0202a
--- /dev/null
+++ b/src/docs/app-shell-example/Shell.tsx
@@ -0,0 +1,118 @@
+'use client';
+
+import { useState } from 'react';
+import type { ReactNode } from 'react';
+import {
+  AppShell,
+  AppShellBrand,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+  MenuItem,
+  MenuSeparator,
+  Nav,
+  NavGroup,
+  NavItem,
+  NavSection,
+  SearchField,
+  ThemeSwitch,
+  UserMenu,
+} from '../../index';
+import {
+  CalendarIcon,
+  ChartIcon,
+  FolderIcon,
+  HomeIcon,
+  InboxIcon,
+  LogOutIcon,
+  PersonIcon,
+  UsersIcon,
+} from './icons';
+import { ListNotifications } from './notifications';
+import type { NotificationItem } from './notifications';
+
+/**
+ * The frame of the application "Lumen": the brand and the navigation, a header with the search, the
+ * notifications, the theme and the account, the page, and a footer. It is a Client Component because
+ * the notifications keep their own state here; the page (`children`) can be a Server Component.
+ */
+export function Shell({
+  notifications,
+  children,
+}: {
+  notifications: NotificationItem[];
+  children: ReactNode;
+}) {
+  const [items, setItems] = useState(notifications);
+  const markAllRead = () => setItems((all) => all.map((item) => ({ ...item, unread: false })));
+
+  return (
+    <AppShell
+      brand={
+        <AppShellBrand
+          href="/"
+          name="Lumen"
+          logo={
+            <span
+              style={{
+                display: 'block',
+                width: 26,
+                height: 26,
+                borderRadius: 'var(--flg-radius-md)',
+                background: 'var(--flg-accent-gradient)',
+              }}
+            />
+          }
+        />
+      }
+    >
+      <AppShellHeader>
+        <SearchField aria-label="Search" placeholder="Search…" shortcut="mod+k" />
+        {/* The widgets stand at the end of the header: the header is a row, and this pushes them. */}
+        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
+          <ListNotifications items={items} onMarkAllRead={markAllRead} />
+          <ThemeSwitch />
+          <UserMenu
+            name="Minh Anh Nguyen"
+            description="minhanh@lumen.vn"
+            avatar={{ fallback: 'MA' }}
+          >
+            <MenuItem icon={<PersonIcon />}>Profile</MenuItem>
+            <MenuSeparator />
+            <MenuItem icon={<LogOutIcon />}>Log out</MenuItem>
+          </UserMenu>
+        </div>
+      </AppShellHeader>
+      <AppShellSidebar>
+        <Nav aria-label="Main">
+          <NavItem href="/" icon={<HomeIcon />} active>
+            Overview
+          </NavItem>
+          <NavItem href="/inbox" icon={<InboxIcon />} badge={12}>
+            Inbox
+          </NavItem>
+          <NavItem href="/calendar" icon={<CalendarIcon />}>
+            Calendar
+          </NavItem>
+          <NavSection title="Projects">
+            <NavGroup label="Design" icon={<FolderIcon />}>
+              <NavItem href="/projects/design-system">Design system</NavItem>
+              <NavItem href="/projects/mobile">Mobile app</NavItem>
+            </NavGroup>
+          </NavSection>
+          <NavSection title="Team">
+            <NavItem href="/team" icon={<UsersIcon />}>
+              Members
+            </NavItem>
+            <NavItem href="/reports" icon={<ChartIcon />} badge={3}>
+              Reports
+            </NavItem>
+          </NavSection>
+        </Nav>
+      </AppShellSidebar>
+      <AppShellMain>{children}</AppShellMain>
+      <AppShellFooter>© 2026 Lumen</AppShellFooter>
+    </AppShell>
+  );
+}
diff --git a/src/docs/app-shell-example/icons.tsx b/src/docs/app-shell-example/icons.tsx
new file mode 100644
index 0000000..2bca18a
--- /dev/null
+++ b/src/docs/app-shell-example/icons.tsx
@@ -0,0 +1,89 @@
+import type { ReactNode } from 'react';
+
+// The icons of the example are the application's own: the library draws none for you. These are the
+// strokes of the Lucide set, on a 24px grid, that take the colour of the text around them.
+const Icon = ({ children }: { children: ReactNode }) => (
+  <svg
+    viewBox="0 0 24 24"
+    fill="none"
+    stroke="currentColor"
+    strokeWidth={2}
+    strokeLinecap="round"
+    strokeLinejoin="round"
+    aria-hidden="true"
+    focusable="false"
+  >
+    {children}
+  </svg>
+);
+
+export const BellIcon = () => (
+  <Icon>
+    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
+    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
+  </Icon>
+);
+export const CheckCircleIcon = () => (
+  <Icon>
+    <circle cx="12" cy="12" r="10" />
+    <path d="m9 12 2 2 4-4" />
+  </Icon>
+);
+export const ChecksIcon = () => (
+  <Icon>
+    <path d="M18 6 7 17l-5-5" />
+    <path d="m22 10-7.5 7.5L13 16" />
+  </Icon>
+);
+export const CalendarIcon = () => (
+  <Icon>
+    <rect x="3" y="4" width="18" height="18" rx="2" />
+    <path d="M16 2v4M8 2v4M3 10h18" />
+  </Icon>
+);
+export const HomeIcon = () => (
+  <Icon>
+    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
+    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
+  </Icon>
+);
+export const InboxIcon = () => (
+  <Icon>
+    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
+    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
+  </Icon>
+);
+export const FolderIcon = () => (
+  <Icon>
+    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
+  </Icon>
+);
+export const UsersIcon = () => (
+  <Icon>
+    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
+    <circle cx="9" cy="7" r="4" />
+    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
+    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
+  </Icon>
+);
+export const ChartIcon = () => (
+  <Icon>
+    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
+    <path d="M18 17V9" />
+    <path d="M13 17V5" />
+    <path d="M8 17v-3" />
+  </Icon>
+);
+export const PersonIcon = () => (
+  <Icon>
+    <circle cx="12" cy="8" r="4" />
+    <path d="M4 21a8 8 0 0 1 16 0" />
+  </Icon>
+);
+export const LogOutIcon = () => (
+  <Icon>
+    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
+    <path d="m16 17 5-5-5-5" />
+    <path d="M21 12H9" />
+  </Icon>
+);
diff --git a/src/docs/app-shell-example/notifications.css b/src/docs/app-shell-example/notifications.css
new file mode 100644
index 0000000..7fff737
--- /dev/null
+++ b/src/docs/app-shell-example/notifications.css
@@ -0,0 +1,154 @@
+/* The notifications panel of the recipe. Nothing here is in the library: it is the CSS of the example,
+   and the numbers are those of the mockup. It is not in a layer, so it wins over the library's. */
+
+/* The panel is a Popover with no padding of its own: each part sets its own. It stays a column, which
+   the Popover makes it while it is open. */
+.notif-panel {
+  box-sizing: border-box;
+  width: 360px;
+  padding: 0;
+  gap: 0;
+  color: var(--flg-text);
+  font-family: var(--flg-font-sans);
+}
+
+/* The first row: the title at one end and "Mark all as read" at the other. */
+.notif-head {
+  display: flex;
+  align-items: center;
+  justify-content: space-between;
+  gap: 8px;
+  box-sizing: border-box;
+  min-height: 44px;
+  padding: 4px 6px 4px 14px;
+}
+.notif-title {
+  color: var(--flg-text);
+  font: var(--flg-weight-semibold) var(--flg-text-md) / 1.2 var(--flg-font-sans);
+}
+.flg-button.notif-mark-all {
+  gap: 5px;
+  padding: 0 8px;
+  color: var(--flg-accent-text);
+}
+
+/* B1: a rule under the heading, and rows that are flat in the panel. */
+.notif-panel-list > .notif-head {
+  border-bottom: 1px solid var(--flg-control-border);
+}
+.notif-panel-list > .flg-list {
+  padding: 2px 0 4px;
+}
+.notif-panel-list .notif-row {
+  min-height: 56px;
+  padding: 8px 14px 8px 12px;
+}
+.notif-panel-list .notif-empty {
+  padding-top: 22px;
+}
+
+/* B3: the heading and the tabs on the panel's padding, and plain rows. */
+.notif-panel-tabs {
+  gap: 6px;
+  padding: 0 12px 10px;
+}
+.notif-panel-tabs > .notif-head {
+  margin-right: -6px;
+  padding: 4px 0 4px 2px;
+}
+.notif-tabs {
+  gap: 6px;
+}
+.notif-tabs > .flg-tabs-list {
+  margin: 0 -2px 2px;
+}
+.notif-tabs .flg-badge {
+  margin-left: 2px;
+  padding: 2px 6px;
+}
+.notif-panel-tabs .notif-row {
+  min-height: 54px;
+}
+
+/* The title of a row is regular; an unread one is bolder, and has the dot at its end. */
+.notif-row .flg-list-item-title {
+  font-weight: var(--flg-weight-regular);
+}
+.notif-row[data-unread] .flg-list-item-title {
+  font-weight: var(--flg-weight-semibold);
+}
+.notif-dot {
+  flex: none;
+  width: 8px;
+  height: 8px;
+  border-radius: 50%;
+  background: var(--flg-accent-solid);
+}
+
+/* The words "Unread: " at the start of a title are for a screen reader. */
+.notif-sr {
+  position: absolute;
+  width: 1px;
+  height: 1px;
+  overflow: hidden;
+  clip-path: inset(50%);
+  white-space: nowrap;
+}
+
+/* A ring for the icon of a notification that is not from a person, and the bigger one of the empty
+   panel. */
+.notif-ring {
+  display: inline-flex;
+  align-items: center;
+  justify-content: center;
+  width: 32px;
+  height: 32px;
+  border-radius: var(--flg-radius-full);
+  background: var(--flg-control-track);
+  color: var(--flg-text-muted);
+}
+.notif-ring > svg {
+  width: 17px;
+  height: 17px;
+}
+.notif-ring[data-tone='success'] {
+  background: color-mix(in srgb, var(--flg-success) var(--flg-status-bg-alpha), transparent);
+  color: var(--flg-success);
+}
+
+.notif-empty {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  gap: 6px;
+  padding: 18px 16px 22px;
+  text-align: center;
+}
+.notif-empty > .notif-ring {
+  width: 40px;
+  height: 40px;
+  margin-bottom: 2px;
+}
+.notif-empty > .notif-ring > svg {
+  width: 20px;
+  height: 20px;
+}
+.notif-empty-title {
+  color: var(--flg-text);
+  font-size: var(--flg-text-sm);
+  font-weight: var(--flg-weight-semibold);
+}
+.notif-empty-hint {
+  color: var(--flg-text-muted);
+  font-size: var(--flg-text-xs);
+}
+
+/* Forced colours drop the backgrounds, which would take the dot away: it is the colour of the system's
+   highlight instead. The rest of an unread row (the bolder title, the words for a screen reader) does not
+   depend on colour. */
+@media (forced-colors: active) {
+  .notif-dot {
+    forced-color-adjust: none;
+    background: Highlight;
+  }
+}
diff --git a/src/docs/app-shell-example/notifications.tsx b/src/docs/app-shell-example/notifications.tsx
new file mode 100644
index 0000000..fa8d063
--- /dev/null
+++ b/src/docs/app-shell-example/notifications.tsx
@@ -0,0 +1,238 @@
+import type { ReactNode } from 'react';
+import {
+  Avatar,
+  Badge,
+  Button,
+  IconButton,
+  Indicator,
+  List,
+  ListItem,
+  Popover,
+  PopoverContent,
+  PopoverTrigger,
+  Tabs,
+  TabsContent,
+  TabsList,
+  TabsTrigger,
+} from '../../index';
+import type { PopoverProps } from '../../index';
+import { BellIcon, ChecksIcon } from './icons';
+import './notifications.css';
+
+export type NotificationItem = {
+  id: string;
+  title: string;
+  /** When it happened, in words: the description of the row. */
+  time: string;
+  /** Where the row leads. */
+  href: string;
+  unread: boolean;
+  /** The initials of the person it is from. Without them the row shows `icon` in a ring. */
+  from?: string;
+  icon?: ReactNode;
+  /** `success` tints the ring of the icon green. */
+  tone?: 'success';
+};
+
+export type NotificationsProps = {
+  items: NotificationItem[];
+  /** Called by "Mark all as read". Your app marks them and passes the new `items`. */
+  onMarkAllRead: () => void;
+  /** The state of the popover: `open`, `defaultOpen` and `onOpenChange`. */
+  popover?: Omit<PopoverProps, 'children'>;
+};
+
+/**
+ * The name of the bell has the count in it, because the number on its corner is only for the eyes
+ * (the Indicator hides it from a screen reader).
+ */
+const bellName = (unread: number) =>
+  unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
+
+/**
+ * One notification. A row that has not been read says so in more than its colour: its title is
+ * bolder, it starts with the words "Unread: " for a screen reader, and it ends with a dot.
+ */
+function NotificationRow({ item }: { item: NotificationItem }) {
+  return (
+    <ListItem
+      className="notif-row"
+      data-unread={item.unread ? '' : undefined}
+      href={item.href}
+      start={
+        item.from ? (
+          <Avatar alt="" fallback={item.from} />
+        ) : (
+          <span className="notif-ring" data-tone={item.tone} aria-hidden="true">
+            {item.icon}
+          </span>
+        )
+      }
+      title={
+        <>
+          {item.unread ? <span className="notif-sr">Unread: </span> : null}
+          {item.title}
+        </>
+      }
+      description={item.time}
+      end={item.unread ? <span className="notif-dot" aria-hidden="true" /> : undefined}
+    />
+  );
+}
+
+function Empty() {
+  return (
+    <div className="notif-empty">
+      <span className="notif-ring" aria-hidden="true">
+        <BellIcon />
+      </span>
+      <span className="notif-empty-title">No new notifications</span>
+      <span className="notif-empty-hint">New notifications will show up here.</span>
+    </div>
+  );
+}
+
+/**
+ * The first row of the panel: the title and "Mark all as read". The button stays while there is
+ * anything in the list, also when nothing is unread any more: pressing it takes it away from under
+ * the focus otherwise, and the focus would fall to the page. It stays where it is instead.
+ */
+function Head({
+  title,
+  showMarkAll,
+  onMarkAllRead,
+}: {
+  title: string;
+  showMarkAll: boolean;
+  onMarkAllRead: () => void;
+}) {
+  return (
+    <div className="notif-head">
+      <span className="notif-title">{title}</span>
+      {showMarkAll ? (
+        <Button variant="ghost" size="sm" className="notif-mark-all" onClick={onMarkAllRead}>
+          <ChecksIcon />
+          Mark all as read
+        </Button>
+      ) : null}
+    </div>
+  );
+}
+
+/** The bell, with the count of unread notifications on its corner, that opens `panel`. */
+function Bell({
+  unread,
+  status,
+  popover,
+  panelClass,
+  panel,
+}: {
+  unread: number;
+  status: 'danger' | 'accent';
+  popover: NotificationsProps['popover'];
+  panelClass: string;
+  panel: ReactNode;
+}) {
+  return (
+    <Popover {...popover}>
+      <Indicator status={status} count={unread}>
+        <PopoverTrigger asChild>
+          <IconButton variant="ghost" aria-label={bellName(unread)}>
+            <BellIcon />
+          </IconButton>
+        </PopoverTrigger>
+      </Indicator>
+      <PopoverContent
+        side="bottom"
+        align="end"
+        sideOffset={17}
+        arrow={false}
+        aria-label="Notifications"
+        className={panelClass}
+      >
+        {panel}
+      </PopoverContent>
+    </Popover>
+  );
+}
+
+/**
+ * B1: a red count on the bell, and a panel with a heading and one list. The list is an `inset` List
+ * with no glass of its own (`surface={false}`): the panel is the glass.
+ */
+export function ListNotifications({ items, onMarkAllRead, popover }: NotificationsProps) {
+  const unread = items.filter((item) => item.unread).length;
+  return (
+    <Bell
+      unread={unread}
+      status="danger"
+      popover={popover}
+      panelClass="notif-panel notif-panel-list"
+      panel={
+        <>
+          <Head
+            title="Notifications"
+            showMarkAll={items.length > 0}
+            onMarkAllRead={onMarkAllRead}
+          />
+          {items.length > 0 ? (
+            <List surface={false} aria-label="Notifications">
+              {items.map((item) => (
+                <NotificationRow key={item.id} item={item} />
+              ))}
+            </List>
+          ) : (
+            <Empty />
+          )}
+        </>
+      }
+    />
+  );
+}
+
+/**
+ * B3: an accent count on the bell, and a panel with the tabs "All" and "Unread", each over a plain
+ * list.
+ */
+export function TabbedNotifications({ items, onMarkAllRead, popover }: NotificationsProps) {
+  const unreadItems = items.filter((item) => item.unread);
+  const unread = unreadItems.length;
+  const rows = (shown: NotificationItem[]) =>
+    shown.length > 0 ? (
+      <List variant="plain" aria-label="Notifications">
+        {shown.map((item) => (
+          <NotificationRow key={item.id} item={item} />
+        ))}
+      </List>
+    ) : (
+      <Empty />
+    );
+  return (
+    <Bell
+      unread={unread}
+      status="accent"
+      popover={popover}
+      panelClass="notif-panel notif-panel-tabs"
+      panel={
+        <>
+          <Head
+            title="Notifications"
+            showMarkAll={items.length > 0}
+            onMarkAllRead={onMarkAllRead}
+          />
+          <Tabs defaultValue="all" className="notif-tabs">
+            <TabsList aria-label="Show">
+              <TabsTrigger value="all">All</TabsTrigger>
+              <TabsTrigger value="unread">
+                Unread
+                {unread > 0 ? <Badge variant="accent">{unread}</Badge> : null}
+              </TabsTrigger>
+            </TabsList>
+            <TabsContent value="all">{rows(items)}</TabsContent>
+            <TabsContent value="unread">{rows(unreadItems)}</TabsContent>
+          </Tabs>
+        </>
+      }
+    />
+  );
+}
diff --git a/src/docs/css.d.ts b/src/docs/css.d.ts
new file mode 100644
index 0000000..8307562
--- /dev/null
+++ b/src/docs/css.d.ts
@@ -0,0 +1,3 @@
+// The examples of the docs import their own stylesheet (`import './notifications.css'`), as an
+// application does; the bundler (Storybook's Vite) handles it, and this tells TypeScript it is there.
+declare module '*.css';
diff --git a/src/styles/components/list.css b/src/styles/components/list.css
index 817ad22..f462bc0 100644
--- a/src/styles/components/list.css
+++ b/src/styles/components/list.css
@@ -153,6 +153,12 @@
   .flg-list[data-variant='inset'] > .flg-list-item:only-child {
     --flg-list-item-radius: calc(var(--flg-radius-lg) - 1px);
   }
+  /* `surface={false}` (a list in a panel that is glass already): the list has no corners of its own to
+     follow, so the first and last rows keep square corners and their hover and current backgrounds meet
+     the edges of the panel. The extra attribute makes this win over the three rules above. */
+  .flg-list[data-variant='inset'][data-surface='false'] > .flg-list-item {
+    --flg-list-item-radius: 0;
+  }
   /* The rule starts after the start cell (12px + 32px + 12px); a row without one starts it at 12px.
      Like the bar of the current row below, it is drawn after the stretched link and lets the presses
      through to it. */
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/list src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/list
pnpm vitest run --project storybook-dark src/components/list
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm vitest run --project storybook-light src/components/search-field
pnpm vitest run --project storybook-dark src/components/search-field
pnpm vitest run --project storybook-light src/components/user-menu
pnpm vitest run --project storybook-dark src/components/user-menu
pnpm vitest run --project storybook-light src/components/theme-switch
pnpm vitest run --project storybook-dark src/components/theme-switch
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS. Dòng văn của các trang MDX không quá 100 ký tự.
- Unit `list`, `src/docs`: 106 test PASS (5 file, hai project React cộng lại), không lỗi kiểu.
- `scripts`: 130 test PASS (5 file).
- `pnpm check:contrast`: PASS. Không cặp mới; chỉ nhãn của dòng 6, 14, 29 đổi.
- Story, ở mỗi project: list 30, docs 78, app-shell 165, search-field 33, user-menu 27, theme-switch 30 test PASS.
- `pnpm build && pnpm check:package`: PASS. Không lớp mới (`List` dùng `data-surface`; CSS của công thức không vào gói); `size`: JS 54.71 kB trên 57.29 kB, CSS 16.16 kB trên 17.04 kB.
- `pnpm build-storybook`: PASS. Index có trang `examples-app-shell--docs`; tám story giao diện của "Examples/App shell" không gắn `no-visual`, còn `InsetWithoutSurface` và tám story hành vi của công thức có gắn (152 story có ảnh).
- `pnpm check:docs-tables`: `Docs tables: no table built as text in 204 files.`
- `List` giữ DOM mặc định và quy tắc CSS mới chỉ khớp `[data-surface='false']`, nên ảnh của List giữ nguyên; story của AppShell chỉ đổi `waitFor` (phát hiện 21).

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/app-shell-demo.tsx \
  .storybook/header-strip.tsx \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/contrast-exceptions.ts \
  src/components/app-shell/AppShell.stories.tsx \
  src/components/list/List.mdx \
  src/components/list/List.stories.tsx \
  src/components/list/List.test-d.ts \
  src/components/list/List.test.tsx \
  src/components/list/List.tsx \
  src/docs/Accessibility.mdx \
  src/docs/AppShellExample.mdx \
  src/docs/AppShellExample.stories.tsx \
  src/docs/GettingStarted.mdx \
  src/docs/app-shell-example/Shell.tsx \
  src/docs/app-shell-example/icons.tsx \
  src/docs/app-shell-example/notifications.css \
  src/docs/app-shell-example/notifications.tsx \
  src/docs/css.d.ts \
  src/styles/components/list.css
```
```bash
git commit -m "feat(list): add surface, with the notifications recipe and the App shell docs" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 5: trang khung trong hai fixture, changeset `0.4.0` và ngưỡng kích thước

Spec §7 "Fixtures" (hai app, mọi check của "Kịch bản kiểm tra"), §8 "Phát hành", §9 (tiêu chí 3 và 6). Không có code của lib. Task này kết thúc bằng kiểm tra cuối của cả nhánh.
- **Next.js:** `ThemeScript` trong `<head>` của layout, `suppressHydrationWarning` trên `<html>`; route `app/shell/[[...slug]]` (Server Component), nav render từ server, phần client nhỏ `shell.tsx` (phát hiện 15).
- **Vite:** entry thứ hai `shell.html` với script theme chép vào HTML; trang có sẵn không đổi (phát hiện 15).
- **Kịch bản** trong `scripts/test-fixtures.mjs`: HTML từ server (Next), rồi trình duyệt (cả hai app), production và development (phát hiện 15).
- **Test** `scripts/lib/theme-script-copies.test.ts` (phát hiện 16).
- **Changeset** `.changeset/phase-5-app-shell.md`, `minor` (phát hiện 17).
- **Ngưỡng kích thước** cho cả Plan C, ghi bằng `pnpm size:record` (không chép `.size-limit.json`).

**Files:**
- Create: `fixtures/next-app/app/shell/[[...slug]]/page.tsx`, `fixtures/next-app/app/shell/nav.tsx`, `fixtures/next-app/app/shell/shell.tsx`, `fixtures/next-app/app/shell/icons.tsx`, `fixtures/vite-app/shell.html`, `fixtures/vite-app/src/shell-main.tsx`, `fixtures/vite-app/src/ShellPage.tsx`, `scripts/lib/theme-script-copies.test.ts`, `.changeset/phase-5-app-shell.md`
- Modify: `fixtures/next-app/app/layout.tsx`, `fixtures/vite-app/vite.config.ts`, `scripts/test-fixtures.mjs`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- `fixtures/next-app/app/layout.tsx`: `<html lang="en" suppressHydrationWarning>`, `<head><ThemeScript /></head>`; `Toaster` vẫn ở cuối `<body>`, ngoài mọi khung.
- `fixtures/next-app/app/shell/[[...slug]]/page.tsx`: Server Component `async`, đọc `params` và cookie `flg-sidebar` (`collapsed` → `defaultCollapsed`), render `<Shell defaultCollapsed nav={<ShellNav path />}>`.
- `fixtures/next-app/app/shell/nav.tsx`: `ShellNav({ path })`, Server Component: nav từ một mảng dữ liệu, `NavItem asChild` với `Link`, một `NavGroup` có con ở `/shell/projects/mobile`, số đếm 12, `active` từ `path`.
- `fixtures/next-app/app/shell/shell.tsx` (`'use client'`): `Shell({ defaultCollapsed, nav, children })`: `AppShell` với `onCollapsedChange` ghi cookie `flg-sidebar=collapsed|expanded; path=/; max-age=31536000; samesite=lax`, `AppShellBrand asChild` quanh `Link`, `<form role="search">` với `SearchField name="q" aria-label="Search" shortcut="/"`, chuông (`Indicator`, `Popover`, `List surface={false}`, tên có số, "Mark all as read"), `ThemeSwitch`, `UserMenu` có `ThemeMenuGroup`, footer, `data-hydrated` trên `AppShellMain` sau khi mount.
- `fixtures/vite-app/shell.html`: script theme trên một dòng, đúng `themeScriptSource('flg-theme')`, sau `<!-- prettier-ignore -->`; `src/shell-main.tsx` mount `ShellPage`; `src/ShellPage.tsx`: cùng bộ ở client, link là hash, cookie đọc từ `document.cookie`, `Toaster` ngoài `AppShell`. `vite.config.ts`: `build.rollupOptions.input` là `main` (`index.html`) và `shell` (`shell.html`).
- `scripts/test-fixtures.mjs`: `APPS.vite.shellPath = '/shell.html#/projects/mobile'`, `APPS.next.shellPath = '/shell/projects/mobile'`; `listenForProblems(page, problems)`; `checkPage(browser, url)` (thêm: trang chính giữ margin 8px của `body` và `scroll-padding-top: auto`); `checkShellHtml(origin, path)` (chỉ app render từ server); `checkShell(browser, url)`.
- `scripts/lib/theme-script-copies.test.ts` (project `scripts`): `describe('the copies of the theme script')`, đọc `fixtures/vite-app/shell.html` và `src/components/theme-switch/ThemeSwitch.mdx`.
- `.changeset/phase-5-app-shell.md`: `'h2d-glass-ui': minor`.
- `.size-limit.json`: ngưỡng mới JS 60183 B, CSS 17773 B (do `size:record` ghi).
- Không có export, class, CSS hay token mới.
- Consumes: mọi phần của giai đoạn 5 qua gói đã đóng (`h2d-glass-ui`, `h2d-glass-ui/styles.css`); `themeScriptSource` (Task 3) trong test.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/theme-script-copies.test.ts b/scripts/lib/theme-script-copies.test.ts
new file mode 100644
index 0000000..9ce823d
--- /dev/null
+++ b/scripts/lib/theme-script-copies.test.ts
@@ -0,0 +1,38 @@
+import { readFileSync } from 'node:fs';
+import { resolve } from 'node:path';
+import { describe, expect, it } from 'vitest';
+import { themeScriptSource } from '../../src/components/theme-switch/theme-script';
+
+// The script of the theme is copied by hand to two places that no server renders it for: the docs
+// of ThemeSwitch, which an application copies from, and the `shell.html` of the Vite fixture. These
+// tests keep both the same as what `ThemeScript` renders, so a change to the script cannot leave a
+// copy behind.
+const ROOT = resolve(import.meta.dirname, '../..');
+const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');
+const scriptOf = (text: string, pattern: RegExp) => {
+  const match = pattern.exec(text);
+  if (!match?.[1]) throw new Error(`no script found by ${pattern}`);
+  return match[1];
+};
+
+describe('the copies of the theme script', () => {
+  const source = themeScriptSource('flg-theme');
+
+  it('is what the fixture of Vite has in the head of its frame page, character for character', () => {
+    const html = read('fixtures/vite-app/shell.html');
+    expect(scriptOf(html, /<head>[\s\S]*?<script>([\s\S]*?)<\/script>/)).toBe(source);
+  });
+
+  it('is what the docs of ThemeSwitch show, once Prettier has set it out for reading', () => {
+    // The docs snippet is formatted: it has line breaks and single quotes, and a `;` where Prettier
+    // puts one. None of that is code, so the two are compared without it.
+    const flat = (code: string) =>
+      code
+        .replace(/\s+/g, '')
+        .replace(/"/g, "'")
+        .replace(/;(?=[})]|$)/g, '');
+    const docs = read('src/components/theme-switch/ThemeSwitch.mdx');
+    const snippet = scriptOf(docs, /```html\n<script>\n([\s\S]*?)\n<\/script>\n```/);
+    expect(flat(snippet)).toBe(flat(source));
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm vitest run --project scripts scripts/lib/theme-script-copies.test.ts
```

Expected: FAIL.
- `the copies of the theme script > is what the fixture of Vite has in the head of its frame page, character for character` fail với `ENOENT: no such file or directory, open '…/fixtures/vite-app/shell.html'`.
- `is what the docs of ThemeSwitch show, once Prettier has set it out for reading` PASS: `ThemeSwitch.mdx` có đoạn script từ Task 3. Đây là đặc tả.

Bản nháp không chạy đúng bước này: hai bản chép đã đúng khi test được viết, nên test được kiểm bằng cách làm hỏng từng bản (phát hiện 19). Kịch bản fixture nằm trong patch code, cùng các fixture, nên chạy ở Step 4.

- [ ] **Step 3: Viết code**

```diff
diff --git a/.changeset/phase-5-app-shell.md b/.changeset/phase-5-app-shell.md
new file mode 100644
index 0000000..5e8423d
--- /dev/null
+++ b/.changeset/phase-5-app-shell.md
@@ -0,0 +1,34 @@
+---
+'h2d-glass-ui': minor
+---
+
+Phase 5 of the roadmap: the frame of an application, and the widgets of its header.
+
+- AppShell (with AppShellHeader, AppShellSidebar, AppShellMain, AppShellFooter,
+  AppShellSidebarTrigger and AppShellBrand): a header, a sidebar, the page and a footer on one grid,
+  laid out by CSS alone, so the HTML from the server is right at every width. `layout` puts the
+  sidebar full height (`sidebar`) or under a full-width header (`header`). Wide, the sidebar is a
+  column that folds into a rail (`collapsed`, `defaultCollapsed`, `onCollapsedChange`; keep it in a
+  cookie and the server draws the rail from the first HTML); narrow, it is a sheet with a scrim,
+  `inert` behind it, Esc and focus return. It has a skip link, and on a page that has one it keeps
+  `scroll-padding-top` of `<html>` equal to the header and the margin of `<body>` at zero.
+- Nav (with NavSection, NavItem and NavGroup): `pill` and `bar`. Items are links (`asChild` takes a
+  router's `Link`), can show a count, and groups open from an active child. In a rail an item keeps
+  its name and count, with a tooltip, and a group is a flyout.
+- Indicator: a count, a dot or a status on the corner of what it wraps, in four statuses. The number
+  is for the eyes: put it in the name of the button.
+- SearchField: a field with a key hint, a clear button and `shortcut` (`/` or `mod+k`); with
+  `collapsible` it rests as a button and opens over the header on a narrow screen.
+- ThemeSwitch, ThemeMenuGroup and ThemeScript: a button that goes round Light, Dark and System, the
+  same choice as three radio items for a menu, and a script for the `<head>` that sets the stored
+  theme on `<html>` before the first paint. They share one `localStorage` key and follow other tabs.
+- UserMenu: the avatar of the person signed in as a menu button, with a header that says who it is;
+  `showName` adds their name.
+- List gets `surface`, so a list can sit inside a panel that is already glass.
+- Two new theme tokens: `--flg-indicator-accent` and `--flg-on-status`.
+
+AppShellBrand and Indicator render in a Server Component, and so does ThemeScript. The other parts
+are client components that take server-rendered children: a Server Component page can render the
+whole frame, its navigation included.
+
+There are no breaking changes.
diff --git a/fixtures/next-app/app/layout.tsx b/fixtures/next-app/app/layout.tsx
index c1b90b8..439efe4 100644
--- a/fixtures/next-app/app/layout.tsx
+++ b/fixtures/next-app/app/layout.tsx
@@ -1,12 +1,16 @@
 import 'h2d-glass-ui/styles.css';
-import { Toaster } from 'h2d-glass-ui';
+import { ThemeScript, Toaster } from 'h2d-glass-ui';
 import type { ReactNode } from 'react';
 
 export const metadata = { title: 'h2d-glass-ui Next.js fixture' };
 
 export default function RootLayout({ children }: { children: ReactNode }) {
   return (
-    <html lang="en">
+    // The theme script changes an attribute of <html> before React hydrates it.
+    <html lang="en" suppressHydrationWarning>
+      <head>
+        <ThemeScript />
+      </head>
       <body>
         {children}
         <Toaster />
diff --git a/fixtures/next-app/app/shell/[[...slug]]/page.tsx b/fixtures/next-app/app/shell/[[...slug]]/page.tsx
new file mode 100644
index 0000000..fcd96b7
--- /dev/null
+++ b/fixtures/next-app/app/shell/[[...slug]]/page.tsx
@@ -0,0 +1,17 @@
+// A Server Component: it reads the cookie that the shell writes, so the sidebar is a rail from the
+// first HTML when it was left folded, and it renders the navigation from data.
+import { cookies } from 'next/headers';
+import { ShellNav } from '../nav';
+import { Shell } from '../shell';
+
+export default async function ShellPage({ params }: { params: Promise<{ slug?: string[] }> }) {
+  const { slug = [] } = await params;
+  const collapsed = (await cookies()).get('flg-sidebar')?.value === 'collapsed';
+  const path = ['/shell', ...slug].join('/');
+  return (
+    <Shell defaultCollapsed={collapsed} nav={<ShellNav path={path} />}>
+      <h1>{slug.length > 0 ? slug.join(' / ') : 'Overview'}</h1>
+      <p>The page of the application, rendered on the server.</p>
+    </Shell>
+  );
+}
diff --git a/fixtures/next-app/app/shell/icons.tsx b/fixtures/next-app/app/shell/icons.tsx
new file mode 100644
index 0000000..265fffa
--- /dev/null
+++ b/fixtures/next-app/app/shell/icons.tsx
@@ -0,0 +1,41 @@
+import type { ReactNode } from 'react';
+
+// The library draws no icons for you: these strokes are the fixture's own, on a 24px grid, in the
+// colour of the text around them.
+const Icon = ({ children }: { children: ReactNode }) => (
+  <svg
+    viewBox="0 0 24 24"
+    fill="none"
+    stroke="currentColor"
+    strokeWidth={2}
+    strokeLinecap="round"
+    strokeLinejoin="round"
+    aria-hidden="true"
+    focusable="false"
+  >
+    {children}
+  </svg>
+);
+
+export const HomeIcon = () => (
+  <Icon>
+    <path d="M3 10.5 12 3l9 7.5V21H3z" />
+  </Icon>
+);
+export const InboxIcon = () => (
+  <Icon>
+    <path d="M3 13h5l1 3h6l1-3h5" />
+    <path d="M5 5h14l2 8v6H3v-6z" />
+  </Icon>
+);
+export const FolderIcon = () => (
+  <Icon>
+    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
+  </Icon>
+);
+export const BellIcon = () => (
+  <Icon>
+    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
+    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
+  </Icon>
+);
diff --git a/fixtures/next-app/app/shell/nav.tsx b/fixtures/next-app/app/shell/nav.tsx
new file mode 100644
index 0000000..e6c81a1
--- /dev/null
+++ b/fixtures/next-app/app/shell/nav.tsx
@@ -0,0 +1,35 @@
+// A Server Component: the navigation is data, rendered into the HTML, and the sidebar of the client
+// shell shows it. `active` comes from the path, which is how an application knows the page it is on.
+import { Nav, NavGroup, NavItem, NavSection } from 'h2d-glass-ui';
+import Link from 'next/link';
+import { FolderIcon, HomeIcon, InboxIcon } from './icons';
+
+const MAIN = [
+  { href: '/shell', label: 'Overview', icon: <HomeIcon />, badge: undefined },
+  { href: '/shell/inbox', label: 'Inbox', icon: <InboxIcon />, badge: 12 },
+];
+const PROJECTS = [
+  { href: '/shell/projects/design-system', label: 'Design system' },
+  { href: '/shell/projects/mobile', label: 'Mobile app' },
+];
+
+export function ShellNav({ path }: { path: string }) {
+  return (
+    <Nav aria-label="Main">
+      {MAIN.map(({ href, label, icon, badge }) => (
+        <NavItem key={href} asChild active={path === href} icon={icon} badge={badge}>
+          <Link href={href}>{label}</Link>
+        </NavItem>
+      ))}
+      <NavSection title="Projects">
+        <NavGroup label="Design" icon={<FolderIcon />}>
+          {PROJECTS.map(({ href, label }) => (
+            <NavItem key={href} asChild active={path === href}>
+              <Link href={href}>{label}</Link>
+            </NavItem>
+          ))}
+        </NavGroup>
+      </NavSection>
+    </Nav>
+  );
+}
diff --git a/fixtures/next-app/app/shell/shell.tsx b/fixtures/next-app/app/shell/shell.tsx
new file mode 100644
index 0000000..e1298ad
--- /dev/null
+++ b/fixtures/next-app/app/shell/shell.tsx
@@ -0,0 +1,113 @@
+'use client';
+
+// The frame of the page, a Client Component because it keeps state (the folded sidebar, the unread
+// notifications) and passes functions. The navigation and the page arrive as children, rendered by
+// the server. The Toaster is not here: it belongs to the layout, outside the shell.
+import {
+  AppShell,
+  AppShellBrand,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+  Button,
+  IconButton,
+  Indicator,
+  List,
+  ListItem,
+  MenuItem,
+  MenuSeparator,
+  Popover,
+  PopoverContent,
+  PopoverTrigger,
+  SearchField,
+  ThemeMenuGroup,
+  ThemeSwitch,
+  UserMenu,
+} from 'h2d-glass-ui';
+import Link from 'next/link';
+import { useEffect, useState } from 'react';
+import type { ReactNode } from 'react';
+import { BellIcon } from './icons';
+
+const NOTIFICATIONS = [
+  { id: 'a', title: 'Minh Anh commented on Design system', time: '5 minutes ago' },
+  { id: 'b', title: 'Release 0.4.0 is ready to review', time: '2 hours ago' },
+];
+
+function Notifications() {
+  const [unread, setUnread] = useState(NOTIFICATIONS.length);
+  // The number on the bell is for the eyes only, so the name of the button says it too.
+  const name = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
+  return (
+    <Popover>
+      <Indicator status="danger" count={unread}>
+        <PopoverTrigger asChild>
+          <IconButton variant="ghost" aria-label={name}>
+            <BellIcon />
+          </IconButton>
+        </PopoverTrigger>
+      </Indicator>
+      <PopoverContent side="bottom" align="end" arrow={false} aria-label="Notifications">
+        <Button variant="ghost" size="sm" onClick={() => setUnread(0)}>
+          Mark all as read
+        </Button>
+        <List surface={false} aria-label="Notifications">
+          {NOTIFICATIONS.map((item) => (
+            <ListItem
+              key={item.id}
+              href="/shell/inbox"
+              title={item.title}
+              description={item.time}
+            />
+          ))}
+        </List>
+      </PopoverContent>
+    </Popover>
+  );
+}
+
+export function Shell({
+  defaultCollapsed,
+  nav,
+  children,
+}: {
+  defaultCollapsed: boolean;
+  nav: ReactNode;
+  children: ReactNode;
+}) {
+  const [hydrated, setHydrated] = useState(false);
+  useEffect(() => setHydrated(true), []);
+  return (
+    <AppShell
+      defaultCollapsed={defaultCollapsed}
+      // The server reads this cookie for `defaultCollapsed`, so the next page opens as it was left.
+      onCollapsedChange={(collapsed) => {
+        document.cookie = `flg-sidebar=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
+      }}
+      brand={
+        <AppShellBrand asChild name="Lumen">
+          <Link href="/shell" />
+        </AppShellBrand>
+      }
+    >
+      <AppShellHeader>
+        <form role="search" action="/shell" style={{ display: 'contents' }}>
+          <SearchField name="q" aria-label="Search" placeholder="Search…" shortcut="/" />
+        </form>
+        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
+          <Notifications />
+          <ThemeSwitch />
+          <UserMenu name="Minh Anh Nguyen" description="minhanh@lumen.vn">
+            <MenuItem>Profile</MenuItem>
+            <MenuSeparator />
+            <ThemeMenuGroup />
+          </UserMenu>
+        </div>
+      </AppShellHeader>
+      <AppShellSidebar>{nav}</AppShellSidebar>
+      <AppShellMain data-hydrated={hydrated ? '' : undefined}>{children}</AppShellMain>
+      <AppShellFooter>© 2026 Lumen</AppShellFooter>
+    </AppShell>
+  );
+}
diff --git a/fixtures/vite-app/shell.html b/fixtures/vite-app/shell.html
new file mode 100644
index 0000000..6db0298
--- /dev/null
+++ b/fixtures/vite-app/shell.html
@@ -0,0 +1,17 @@
+<!doctype html>
+<html lang="en">
+  <head>
+    <meta charset="UTF-8" />
+    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <title>h2d-glass-ui Vite fixture: app shell</title>
+    <!-- The same script as ThemeScript renders, for the default key: this page has no server to render
+      it. It stays on one line, as `themeScriptSource('flg-theme')` writes it, so that a test can compare
+      the two. -->
+    <!-- prettier-ignore -->
+    <script>(function(k){try{var v=localStorage.getItem(k),d=document.documentElement;if(v==="light"||v==="dark")d.setAttribute("data-flg-theme",v);else d.removeAttribute("data-flg-theme")}catch(e){}})("flg-theme")</script>
+  </head>
+  <body>
+    <div id="root"></div>
+    <script type="module" src="/src/shell-main.tsx"></script>
+  </body>
+</html>
diff --git a/fixtures/vite-app/src/ShellPage.tsx b/fixtures/vite-app/src/ShellPage.tsx
new file mode 100644
index 0000000..56a3419
--- /dev/null
+++ b/fixtures/vite-app/src/ShellPage.tsx
@@ -0,0 +1,176 @@
+// The frame of an application, rendered with React 18.3 in the browser: the same set as the Next.js
+// fixture's /shell page. Links are hashes, so that pressing one stays on this page.
+import {
+  AppShell,
+  AppShellBrand,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+  Button,
+  IconButton,
+  Indicator,
+  List,
+  ListItem,
+  MenuItem,
+  MenuSeparator,
+  Nav,
+  NavGroup,
+  NavItem,
+  NavSection,
+  Popover,
+  PopoverContent,
+  PopoverTrigger,
+  SearchField,
+  ThemeMenuGroup,
+  ThemeSwitch,
+  Toaster,
+  UserMenu,
+} from 'h2d-glass-ui';
+import { useEffect, useState } from 'react';
+import type { ReactNode } from 'react';
+
+// The strokes of the fixture's own icons, on a 24px grid.
+const Icon = ({ children }: { children: ReactNode }) => (
+  <svg
+    viewBox="0 0 24 24"
+    fill="none"
+    stroke="currentColor"
+    strokeWidth={2}
+    strokeLinecap="round"
+    strokeLinejoin="round"
+    aria-hidden="true"
+    focusable="false"
+  >
+    {children}
+  </svg>
+);
+const HomeIcon = () => (
+  <Icon>
+    <path d="M3 10.5 12 3l9 7.5V21H3z" />
+  </Icon>
+);
+const InboxIcon = () => (
+  <Icon>
+    <path d="M3 13h5l1 3h6l1-3h5" />
+    <path d="M5 5h14l2 8v6H3v-6z" />
+  </Icon>
+);
+const FolderIcon = () => (
+  <Icon>
+    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
+  </Icon>
+);
+const BellIcon = () => (
+  <Icon>
+    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
+    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
+  </Icon>
+);
+
+const NOTIFICATIONS = [
+  { id: 'a', title: 'Minh Anh commented on Design system', time: '5 minutes ago' },
+  { id: 'b', title: 'Release 0.4.0 is ready to review', time: '2 hours ago' },
+];
+
+function Notifications() {
+  const [unread, setUnread] = useState(NOTIFICATIONS.length);
+  // The number on the bell is for the eyes only, so the name of the button says it too.
+  const name = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
+  return (
+    <Popover>
+      <Indicator status="danger" count={unread}>
+        <PopoverTrigger asChild>
+          <IconButton variant="ghost" aria-label={name}>
+            <BellIcon />
+          </IconButton>
+        </PopoverTrigger>
+      </Indicator>
+      <PopoverContent side="bottom" align="end" arrow={false} aria-label="Notifications">
+        <Button variant="ghost" size="sm" onClick={() => setUnread(0)}>
+          Mark all as read
+        </Button>
+        <List surface={false} aria-label="Notifications">
+          {NOTIFICATIONS.map((item) => (
+            <ListItem key={item.id} href="#/inbox" title={item.title} description={item.time} />
+          ))}
+        </List>
+      </PopoverContent>
+    </Popover>
+  );
+}
+
+const readCollapsed = () => document.cookie.split('; ').includes('flg-sidebar=collapsed');
+
+/** The route of the page: the hash, as there is no router here. */
+function useRoute() {
+  const [route, setRoute] = useState(() => window.location.hash || '#/');
+  useEffect(() => {
+    const onChange = () => setRoute(window.location.hash || '#/');
+    window.addEventListener('hashchange', onChange);
+    return () => window.removeEventListener('hashchange', onChange);
+  }, []);
+  return route;
+}
+
+export function ShellPage() {
+  const [hydrated, setHydrated] = useState(false);
+  useEffect(() => setHydrated(true), []);
+  const route = useRoute();
+  return (
+    <>
+      <AppShell
+        // There is no server to read the cookie here, so the page reads it itself.
+        defaultCollapsed={readCollapsed()}
+        onCollapsedChange={(collapsed) => {
+          document.cookie = `flg-sidebar=${collapsed ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
+        }}
+        brand={<AppShellBrand href="#/" name="Lumen" />}
+      >
+        <AppShellHeader>
+          <form role="search" action="#/" style={{ display: 'contents' }}>
+            <SearchField name="q" aria-label="Search" placeholder="Search…" shortcut="/" />
+          </form>
+          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
+            <Notifications />
+            <ThemeSwitch />
+            <UserMenu name="Minh Anh Nguyen" description="minhanh@lumen.vn">
+              <MenuItem>Profile</MenuItem>
+              <MenuSeparator />
+              <ThemeMenuGroup />
+            </UserMenu>
+          </div>
+        </AppShellHeader>
+        <AppShellSidebar>
+          <Nav aria-label="Main">
+            <NavItem href="#/" icon={<HomeIcon />} active={route === '#/'}>
+              Overview
+            </NavItem>
+            <NavItem href="#/inbox" icon={<InboxIcon />} badge={12} active={route === '#/inbox'}>
+              Inbox
+            </NavItem>
+            <NavSection title="Projects">
+              <NavGroup label="Design" icon={<FolderIcon />}>
+                <NavItem
+                  href="#/projects/design-system"
+                  active={route === '#/projects/design-system'}
+                >
+                  Design system
+                </NavItem>
+                <NavItem href="#/projects/mobile" active={route === '#/projects/mobile'}>
+                  Mobile app
+                </NavItem>
+              </NavGroup>
+            </NavSection>
+          </Nav>
+        </AppShellSidebar>
+        <AppShellMain data-hydrated={hydrated ? '' : undefined}>
+          <h1>{route === '#/' ? 'Overview' : route.slice(2)}</h1>
+          <p>The page of the application, rendered in the browser.</p>
+        </AppShellMain>
+        <AppShellFooter>© 2026 Lumen</AppShellFooter>
+      </AppShell>
+      <Toaster />
+    </>
+  );
+}
diff --git a/fixtures/vite-app/src/shell-main.tsx b/fixtures/vite-app/src/shell-main.tsx
new file mode 100644
index 0000000..d5864d4
--- /dev/null
+++ b/fixtures/vite-app/src/shell-main.tsx
@@ -0,0 +1,10 @@
+import 'h2d-glass-ui/styles.css';
+import { StrictMode } from 'react';
+import { createRoot } from 'react-dom/client';
+import { ShellPage } from './ShellPage';
+
+createRoot(document.getElementById('root') as HTMLElement).render(
+  <StrictMode>
+    <ShellPage />
+  </StrictMode>,
+);
diff --git a/fixtures/vite-app/vite.config.ts b/fixtures/vite-app/vite.config.ts
index f113497..05c9851 100644
--- a/fixtures/vite-app/vite.config.ts
+++ b/fixtures/vite-app/vite.config.ts
@@ -1,4 +1,17 @@
+import { resolve } from 'node:path';
 import react from '@vitejs/plugin-react';
 import { defineConfig } from 'vite';
 
-export default defineConfig({ plugins: [react()] });
+// Two entries: the page of the components, and `shell.html`, the frame of an application with the
+// theme script in its HTML. The first does not change when the second does.
+export default defineConfig({
+  plugins: [react()],
+  build: {
+    rollupOptions: {
+      input: {
+        main: resolve(import.meta.dirname, 'index.html'),
+        shell: resolve(import.meta.dirname, 'shell.html'),
+      },
+    },
+  },
+});
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index 87c113b..c19163c 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -17,6 +17,9 @@ const APPS = {
   vite: {
     dir: 'vite-app',
     steps: [['typecheck'], ['build']],
+    // The frame of an application is a second entry. Its links are hashes, so the hash chooses
+    // the active item.
+    shellPath: '/shell.html#/projects/mobile',
     // Vite listens on one address of the host it is given. Inside the Playwright container CI uses,
     // `localhost` also names ::1, and Vite listened there while the check below never reached it,
     // so the host is an address. Next.js listens on every interface, so `localhost` is fine there.
@@ -40,6 +43,8 @@ const APPS = {
     steps: [['build']],
     // The page is a Server Component: its HTML must already name the RadioGroup with a span label.
     serverRendered: true,
+    // The route of the frame; it reads the active item from the path.
+    shellPath: '/shell/projects/mobile',
     servers: [
       {
         mode: 'production',
@@ -165,9 +170,8 @@ async function fetchWhenReady(url, timeoutMs = 120_000) {
   throw new Error(`${url} did not answer within ${timeoutMs / 1000}s.`);
 }
 
-async function checkPage(browser, url) {
-  const problems = [];
-  const page = await browser.newPage();
+/** Records what the console and the page say that a clean page would not. */
+function listenForProblems(page, problems) {
   page.on('console', (message) => {
     if (message.type() !== 'error' && message.type() !== 'warning') return;
     // The broken-avatar case requests a file that does not exist on purpose.
@@ -177,6 +181,12 @@ async function checkPage(browser, url) {
     problems.push(`console.${message.type()}: ${message.text()}`);
   });
   page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
+}
+
+async function checkPage(browser, url) {
+  const problems = [];
+  const page = await browser.newPage();
+  listenForProblems(page, problems);
   try {
     await inspect(page, url, problems);
   } catch (error) {
@@ -217,6 +227,19 @@ async function inspect(page, url, problems) {
   await yearly.click();
   if (!(await yearly.isChecked())) problems.push('"Yearly" did not get selected');
 
+  // The page of the components has no AppShell, so the library leaves the document as the browser
+  // makes it: the 8px margin of the body, and no room kept for a header.
+  const document_ = await page.evaluate(() => ({
+    margin: getComputedStyle(document.body).marginTop,
+    scrollPadding: getComputedStyle(document.documentElement).scrollPaddingTop,
+  }));
+  if (document_.margin !== '8px') {
+    problems.push(`the body of a page without an AppShell has a margin of ${document_.margin}`);
+  }
+  if (document_.scrollPadding !== 'auto') {
+    problems.push(`a page without an AppShell has scroll-padding-top ${document_.scrollPadding}`);
+  }
+
   await checkOverlays(page, problems);
   await checkMenus(page, problems);
   await checkSelects(page, problems);
@@ -499,6 +522,195 @@ async function checkDataDisplay(page, problems) {
   if ((await alert.count()) !== 0) problems.push('the close button did not remove the Alert');
 }
 
+/** The start tag of the first element in `html` that matches `pattern` (a test of its tag text). */
+const startTag = (html, pattern) =>
+  [...html.matchAll(/<[a-z][^>]*>/g)].map((match) => match[0]).find((tag) => pattern.test(tag));
+
+/**
+ * Phase 5: what the server sends for the frame of an application, before any script has run. The
+ * cookie `flg-sidebar` decides whether the sidebar is a rail, so the page is asked with and without.
+ */
+async function checkShellHtml(origin, path) {
+  const problems = [];
+  const get = async (cookie) => {
+    const response = await fetch(origin + path, { headers: cookie ? { cookie } : {} });
+    return response.text();
+  };
+  const html = await get();
+
+  const skip = startTag(html, /class="(?:[^"]*\s)?flg-app-shell-skip[\s"]/);
+  const target = skip?.match(/href="#([^"]+)"/)?.[1];
+  if (!target) problems.push('the server HTML has no skip link');
+  else if (!startTag(html, new RegExp(`^<main[^>]*\\sid="${target}"`))) {
+    problems.push(`the skip link points at #${target}, and no <main> has that id`);
+  }
+
+  // The item of the page is marked, and the group that holds it is open: its list is not hidden.
+  const current = [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>[\s\S]*?<\/a>/g)];
+  if (current.length !== 1 || !current[0][0].includes('Mobile app')) {
+    problems.push('the server HTML does not mark "Mobile app", and only it, as the current page');
+  }
+  // The button of the group is the one of the Nav that controls a panel; the panel is its list.
+  const group = startTag(html, /^<button[^>]*class="flg-nav-item"[^>]*aria-controls=/) ?? '';
+  const panelId = group.match(/aria-controls="([^"]+)"/)?.[1];
+  const panel = panelId && startTag(html, new RegExp(`^<div[^>]*\\sid="${panelId}"`));
+  if (!group.includes('aria-expanded="true"') || !panel || /\shidden/.test(panel)) {
+    problems.push('the server HTML does not open the group that holds the current page');
+  }
+
+  const root = (page) => startTag(page, /class="(?:[^"]*\s)?flg-app-shell[\s"]/) ?? '';
+  if (/data-collapsed/.test(root(html))) problems.push('the sidebar is a rail without a cookie');
+  const folded = await get('flg-sidebar=collapsed');
+  if (!/data-collapsed/.test(root(folded))) {
+    problems.push('the server HTML is not a rail when the cookie says collapsed');
+  }
+  return problems;
+}
+
+/** Phase 5: the frame of an application in a real browser, at 1280px and at 390px. */
+async function checkShell(browser, url) {
+  const problems = [];
+  const origin = new URL(url).origin;
+  const open = async (options, init) => {
+    const context = await browser.newContext(options);
+    if (init) await context.addInitScript(init);
+    const page = await context.newPage();
+    listenForProblems(page, problems);
+    await page.goto(url);
+    await page.locator('[data-hydrated]').waitFor({ timeout: 60_000 });
+    await page.waitForLoadState('networkidle');
+    return { context, page };
+  };
+  const wide = { viewport: { width: 1280, height: 720 } };
+  const cookieOf = async (context) =>
+    (await context.cookies(origin)).find((cookie) => cookie.name === 'flg-sidebar')?.value;
+  const documentStyle = (page) =>
+    page.evaluate(() => ({
+      margin: getComputedStyle(document.body).marginTop,
+      scrollPadding: getComputedStyle(document.documentElement).scrollPaddingTop,
+      header: document.querySelector('header')?.getBoundingClientRect().height,
+    }));
+
+  // 1280px, with Dark stored: the theme is on <html> before React has run anything.
+  {
+    const { context, page } = await open(wide, () => {
+      localStorage.setItem('flg-theme', 'dark');
+      window.firstTheme = undefined;
+      // An init script runs before <html> exists, so it watches the document and its subtree.
+      new MutationObserver(() => {
+        // The first value the attribute takes, and whether the page had hydrated by then.
+        window.firstTheme ??= {
+          value: document.documentElement.getAttribute('data-flg-theme'),
+          hydrated: document.querySelector('[data-hydrated]') !== null,
+        };
+      }).observe(document, {
+        subtree: true,
+        attributes: true,
+        attributeFilter: ['data-flg-theme'],
+      });
+    });
+    const first = await page.evaluate(() => window.firstTheme);
+    if (first?.value !== 'dark' || first.hydrated) {
+      problems.push(
+        `<html> did not get data-flg-theme="dark" before hydration: ${JSON.stringify(first)}`,
+      );
+    }
+
+    // The frame has no margin round it, and the page keeps clear of the header (60px here).
+    await page.waitForFunction(
+      () => getComputedStyle(document.documentElement).scrollPaddingTop !== '56px',
+    );
+    const style = await documentStyle(page);
+    if (style.margin !== '0px')
+      problems.push(`the body of the frame has a margin of ${style.margin}`);
+    if (style.header !== 60 || style.scrollPadding !== '60px') {
+      problems.push(
+        `at 1280px the header is ${style.header}px and scroll-padding-top ${style.scrollPadding}, expected 60px both`,
+      );
+    }
+
+    // "/" takes the focus to the search field.
+    const search = page.getByRole('searchbox', { name: 'Search' });
+    await page.keyboard.press('/');
+    if (!(await hasFocus(search))) problems.push('"/" did not focus the search field');
+
+    // The ThemeSwitch goes from the stored Dark to System (no attribute) and on to Light.
+    const html = page.locator('html');
+    const theme = page.getByRole('button', { name: /^Theme/ });
+    await theme.click();
+    if ((await html.getAttribute('data-flg-theme')) !== null) {
+      problems.push('the ThemeSwitch did not take data-flg-theme off <html> for System');
+    }
+    await theme.click();
+    if ((await html.getAttribute('data-flg-theme')) !== 'light') {
+      problems.push('the ThemeSwitch did not set data-flg-theme="light" on <html>');
+    }
+
+    // The trigger folds the sidebar into a rail and writes the cookie, and back.
+    const shell = page.locator('.flg-app-shell');
+    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
+    if ((await shell.getAttribute('data-collapsed')) === null) {
+      problems.push('the trigger did not fold the sidebar into a rail');
+    }
+    if ((await cookieOf(context)) !== 'collapsed')
+      problems.push('folding did not write the cookie');
+    await page.getByRole('button', { name: 'Expand sidebar' }).click();
+    if ((await shell.getAttribute('data-collapsed')) !== null) {
+      problems.push('the trigger did not unfold the rail');
+    }
+    if ((await cookieOf(context)) !== 'expanded')
+      problems.push('unfolding did not write the cookie');
+    await context.close();
+  }
+
+  // 1280px with the cookie: the rail is there when the page has loaded, and the trigger says so.
+  {
+    const context = await browser.newContext(wide);
+    await context.addCookies([{ name: 'flg-sidebar', value: 'collapsed', url: origin }]);
+    const page = await context.newPage();
+    listenForProblems(page, problems);
+    await page.goto(url);
+    await page.locator('[data-hydrated]').waitFor({ timeout: 60_000 });
+    if ((await page.locator('.flg-app-shell[data-collapsed]').count()) !== 1) {
+      problems.push('the sidebar is not a rail when the cookie says collapsed');
+    }
+    await page.getByRole('button', { name: 'Expand sidebar' }).waitFor({ timeout: 10_000 });
+    await context.close();
+  }
+
+  // 390px: the sidebar is a sheet that the trigger opens, Esc closes, and the focus comes back from.
+  {
+    const { context, page } = await open({ viewport: { width: 390, height: 844 } });
+    const style = await documentStyle(page);
+    if (style.margin !== '0px') problems.push(`at 390px the body has a margin of ${style.margin}`);
+    if (style.header !== 56 || style.scrollPadding !== '56px') {
+      problems.push(
+        `at 390px the header is ${style.header}px and scroll-padding-top ${style.scrollPadding}, expected 56px both`,
+      );
+    }
+    const trigger = page.getByRole('button', { name: 'Open navigation' });
+    await trigger.click();
+    const sheet = page.getByRole('dialog', { name: 'Navigation' });
+    await sheet.waitFor({ timeout: 10_000 });
+    await page.keyboard.press('Escape');
+    await sheet.waitFor({ state: 'hidden', timeout: 10_000 });
+    if (!(await hasFocus(trigger))) problems.push('focus did not return to the trigger');
+    await context.close();
+  }
+
+  // The current page is marked and its group is open in the browser as well.
+  {
+    const { context, page } = await open(wide);
+    const current = page.locator('a[aria-current="page"]');
+    if ((await current.count()) !== 1 || !(await current.textContent())?.includes('Mobile app')) {
+      problems.push('the navigation does not mark "Mobile app" as the current page');
+    }
+    if (!(await current.isVisible())) problems.push('the group of the current page is closed');
+    await context.close();
+  }
+  return problems;
+}
+
 async function testApp(name, browser) {
   const app = APPS[name];
   const cwd = join(FIXTURES, app.dir);
@@ -561,6 +773,13 @@ async function testApp(name, browser) {
       for (const problem of await checkPage(browser, server.url)) {
         problems.push(`${label}: ${problem}`);
       }
+      // Phase 5: the frame of an application, in the HTML of the server and in the browser.
+      const origin = new URL(server.url).origin;
+      const shell = [
+        ...(app.serverRendered ? await checkShellHtml(origin, app.shellPath) : []),
+        ...(await checkShell(browser, origin + app.shellPath)),
+      ];
+      for (const problem of shell) problems.push(`${label} shell: ${problem}`);
     } catch (error) {
       // Keep the server's own output: it usually explains why it never got ready.
       const tail = running.output().split('\n').slice(-30).join('\n');
```

Build, rồi kiểm tra gói trước khi ghi ngưỡng:

```bash
pnpm gen:theme
pnpm build
pnpm check:package
```

Expected: PASS với ngưỡng cũ (JS 54.71 kB trên 57.29 kB, CSS 16.16 kB trên 17.04 kB): task này không đổi CSS hay JS của lib.

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm size:record
```

Expected: ngưỡng mới gần JS 60183 B, CSS 17773 B (trước: 57286 B, 17041 B), là kết quả ở bản nháp; ngưỡng là số đo cộng 10%. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project scripts
pnpm build && pnpm check:package
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS. Script trong `shell.html` giữ một dòng nhờ `<!-- prettier-ignore -->`.
- `scripts`: 132 test PASS (6 file).
- `pnpm check:package`: PASS với ngưỡng mới: JS 54.71 kB trên 60.18 kB, CSS 16.16 kB trên 17.77 kB.

Chạy fixture. Kiểm cổng trước. Lệnh này không được in dòng nào (khi đó `grep` trả mã 1, và đó là kết quả mong muốn):

```bash
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
```

Nếu 4179 hay 5179 bận, chọn một cặp khác đang rảnh (không bao giờ 5173, 4173 hay 5174) và sửa lệnh `sed` theo cặp đó. Nếu 3100 hay 3101 bận (script ghim hai cổng đó cho Next), dừng lại và báo cáo; không tắt tiến trình đang giữ chúng.

```bash
pnpm build
sed -e 's/5173/5179/g' -e 's/4173/4179/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
```

Expected:
- `Fixtures OK: vite, next.`, sau bản production và development của mỗi app, ở Chromium. Mỗi bản chạy trang chính và trang khung; console sạch (không lỗi, không cảnh báo, không cảnh báo hydrate) trên mọi trang.
- Các check của trang khung, như bản nháp đã thấy pass:
  1. (Next, HTML từ server) skip link có `href="#<id>"` và có `<main id="<id>">`;
  2. (Next) đúng một link `aria-current="page"`, là "Mobile app";
  3. (Next) nút của nhóm có `aria-expanded="true"` và danh sách `flg-nav-sub` không có `hidden`;
  4. (Next) gốc không có `data-collapsed` khi không có cookie, và có nó khi cookie là `flg-sidebar=collapsed`;
  5. Dark đã lưu (init script): lần đầu `data-flg-theme` được đặt trên `<html>`, giá trị là `dark` và `[data-hydrated]` chưa có trong trang;
  6. 1280px: margin của `body` 0px, header 60px, `scroll-padding-top` 60px;
  7. 1280px: "/" focus ô tìm kiếm;
  8. ThemeSwitch: Dark → System (thuộc tính bị bỏ) → Light (`data-flg-theme="light"`);
  9. 1280px: trigger "Collapse sidebar" đặt `data-collapsed` và cookie `collapsed`; "Expand sidebar" bỏ nó và ghi `expanded`;
  10. cookie `collapsed` đặt trước khi tải: gốc là rail và trigger tên "Expand sidebar";
  11. 390px: margin của `body` 0px, header 56px, `scroll-padding-top` 56px; "Open navigation" mở hộp thoại "Navigation", Esc đóng, focus về trigger;
  12. nav đánh dấu "Mobile app" là trang hiện tại, và nó hiện (nhóm mở) trong trình duyệt;
  13. trang chính (không có `AppShell`) giữ margin 8px của `body` và `scroll-padding-top: auto`.
- Chạy `rm` kể cả khi lệnh `node` fail. Hai lệnh `netstat` không in dòng nào: cổng rảnh trước khi chạy, và không server nào chạy sót sau đó. Nếu lệnh sau in một dòng, chỉ tắt tiến trình đó khi chính lần chạy này đã mở nó.

Kiểm tra cuối của cả nhánh, như Claude chạy ở đầu nhánh nháp `e03af8d` (`ca5b44e` chỉ khác ở một dòng spec và một dòng chú thích):

```bash
pnpm gen:theme
pnpm check:name
npx tsc --noEmit -p .
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
pnpm vitest run --project storybook-light src/components/search-field
pnpm vitest run --project storybook-dark src/components/search-field
pnpm vitest run --project storybook-light src/components/user-menu
pnpm vitest run --project storybook-dark src/components/user-menu
pnpm vitest run --project storybook-light src/components/theme-switch
pnpm vitest run --project storybook-dark src/components/theme-switch
pnpm vitest run --project storybook-light src/components/list
pnpm vitest run --project storybook-dark src/components/list
pnpm vitest run --project storybook-light src/components/toast
pnpm vitest run --project storybook-dark src/components/toast
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
node -e "const e=Object.values(require('./storybook-static/index.json').entries);const v=e.filter((x)=>x.type==='story'&&!(x.tags||[]).includes('no-visual'));console.log(v.length);console.log(v.filter((x)=>/^(components-(searchfield|usermenu|themeswitch)|examples-app-shell)--/.test(x.id)).map((x)=>x.id).join(' '));console.log(e.filter((x)=>x.type==='docs'&&/^(components-(searchfield|usermenu|themeswitch)|examples-app-shell)--/.test(x.id)).map((x)=>x.id).join(' '))"
```

Expected:
- `pnpm check:name`: PASS (`check:name: no "fl-glass-ui" outside docs/superpowers.`).
- `npx tsc --noEmit -p .`: PASS.
- `pnpm test:unit`: PASS, 220 file theo `include` của project `unit`, `unit-react18`, `scripts` (bản nháp chạy được một lượt trên máy này). Bản ghi của bản nháp chỉ giữ mã thoát, nên số test không có ở đây.
- `pnpm check:contrast`: PASS (`Contrast check passed.`).
- `pnpm check:package`: PASS với ngưỡng của Step 3.
- `pnpm build-storybook`: PASS. Thư mục `storybook-static` bị git bỏ qua.
- `pnpm check:docs-tables`: `Docs tables: no table built as text in 204 files.`
- Story, ở mỗi project: search-field 33, user-menu 27, theme-switch 30, list 30, toast 21, app-shell 165, docs 78 test PASS.
- Lệnh `node` in `152`, rồi `components-searchfield--search-field-default components-searchfield--search-field-default-phone components-searchfield--search-field-collapsible components-searchfield--search-field-collapsible-phone components-searchfield--search-field-collapsible-phone-open components-themeswitch--theme-switch components-themeswitch--theme-switch-focus components-themeswitch--theme-menu-group components-themeswitch--theme-menu-group-dark components-themeswitch--theme-menu-group-system components-usermenu--user-menu components-usermenu--user-menu-open components-usermenu--user-menu-show-name components-usermenu--user-menu-show-name-open examples-app-shell--app-shell-example examples-app-shell--app-shell-example-phone examples-app-shell--notifications-list examples-app-shell--notifications-list-open examples-app-shell--notifications-list-empty examples-app-shell--notifications-tabs examples-app-shell--notifications-tabs-open examples-app-shell--notifications-tabs-empty`, rồi `components-searchfield--docs components-themeswitch--docs components-usermenu--docs examples-app-shell--docs`: 22 story giao diện, 176 ảnh chuẩn mới, như mô tả PR phải nêu (phát hiện 22).
- Không chạy cả bộ story một lượt; CI chạy cả bộ.

- [ ] **Step 5: Commit**

```bash
git add \
  .changeset/phase-5-app-shell.md \
  .size-limit.json \
  fixtures/next-app/app/layout.tsx \
  'fixtures/next-app/app/shell/[[...slug]]/page.tsx' \
  fixtures/next-app/app/shell/icons.tsx \
  fixtures/next-app/app/shell/nav.tsx \
  fixtures/next-app/app/shell/shell.tsx \
  fixtures/vite-app/shell.html \
  fixtures/vite-app/src/ShellPage.tsx \
  fixtures/vite-app/src/shell-main.tsx \
  fixtures/vite-app/vite.config.ts \
  scripts/lib/theme-script-copies.test.ts \
  scripts/test-fixtures.mjs
```
```bash
git commit -m "feat(fixtures): add the app shell to both fixtures, the 0.4.0 changeset and the size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```


## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines": 176 ảnh mới của 22 story giao diện (năm của SearchField, bốn của UserMenu, năm của ThemeSwitch, tám của "Examples/App shell"; mỗi story 4 chế độ × sáng, tối). Xem ảnh trước khi xin review: khớp h2, h3, u1, u2, t1, t3, b1, b3 ở chế độ `normal`; tooltip của H3 và của T1 có trong ảnh; menu và bảng đang mở nằm trong header thật, với nền "mở" của U2 và của chuông; header của các story T3 không có nút theme; ảnh cũ của mọi component khác không đổi.
- Mô tả PR nêu cho chủ dự án những gì phát hiện 22 liệt kê, các quyết định Claude tự chốt và các mục để lại (phát hiện 23). Merge PR này làm workflow "Release" mở PR "Version Packages" cho `0.4.0`; chỉ chủ dự án merge PR đó, và việc publish chạy qua trusted publishing (Global Constraints, "Changeset").

### Đã thực thi (2026-11-12)

- Năm commit của nhánh nháp được cherry-pick lên `feat/phase-5-plan-c` (`45c5965`, `84a6aa4`, `b7ccd57`, `52ee3f7`, `21b660e`). Cây giống hệt đầu nhánh nháp (`ca5b44e`), cộng file plan.
- Mỗi task có một reviewer riêng (năm reviewer chạy song song, chỉ đọc). Task 2, 4, 5: Approved. Task 1: Needs fixes, vì quy tắc giãn của H2 trên điện thoại chỉ đúng khi ô là con trực tiếp của header, còn docs bọc ô trong `<form role="search">` (hai fixture tránh được nhờ `display: contents`, điều docs không nói). Task 3: Needs fixes, vì `ThemeSwitch.mdx` viết `<` ở chỗ phải là `\u003c`, và lời khuyên về hash CSP trỏ vào bản script đã qua Prettier.
- Review toàn nhánh trên Opus, lấy góp ý của chủ dự án ở PR #38 và #37 làm lăng kính trước tiên, rồi PR #29 và #34: "With fixes" (6 Important, 12 Minor mới, cùng bảng phân loại 32 Minor của các review task). Sửa trong một đợt, mỗi mục một commit (`8bcfd73`..`e179847`):
  - **Quy tắc của header đi qua phần tử bọc, và chỉ áp cho ô của chính header** (`8bcfd73`). H2 trên điện thoại giãn hết hàng cả khi nằm trong `<form role="search">`. Khi H3 phủ header, phần tử chứa ô đang mở không bị ẩn, nên landmark tìm kiếm vẫn còn. Một SearchField trong popover hay dialog của header không bị coi là ô của header. Công thức và hai fixture bọc ô trong form và bỏ `display: contents`. Số đo bố cục trước và sau giống hệt ở ba engine.
  - **Esc không xoá chữ của ô `disabled` hay `readOnly`** (`fc9b8cd`).
  - **Phím tắt để lại cho trang khi ô không với tới được** (`bb541ea`). Ô nằm dưới `inert` (tấm trượt đang mở) hay dưới một modal của lib thì không nhận phím và không chặn phím, và H3 không mở phía sau modal. `isCoveredByModal` chuyển từ Tooltip vào `internal/modal-stack.ts`.
  - **Docs của ThemeSwitch nói đúng điều code làm** (`d18ac5e`, `13c7ad7`, `bd27bd4`). HTML của server và lần render khi hydrate hiện `defaultValue` ở cả hai chế độ, nên ứng dụng biết theme từ server thì truyền nó làm `defaultValue`. Khoá có `<` được viết thành `\u003c`. Hash CSP lấy từ đúng đoạn chữ mà `ThemeScript` render ra. Chọn lại đúng theme đang hiện thì không ghi gì.
  - Minor sửa luôn: chỉ nhả phím tắt khi đang giữ (`b96cd6e`); `defaultValue` ngoài union thành System (`a061f95`); một quy tắc chữ cái đầu cho rail của Nav và cho UserMenu, trong `internal/first-letter.ts` (`093e8af`); câu chữ của các trang docs (`39c08d9`); hai chú thích, và kịch bản fixture chắc hơn (`ae0e12f`); ngưỡng kích thước JS 60274 B, CSS 17761 B (`e179847`).
  - Các dòng spec sửa, đánh dấu "(phát hiện khi review cuối Plan C)": §4.3, §5, §6.3.
  - Lần review lại: cả 12 mục đã xử lý, không có lỗi mới đáng kể. Claude sửa hai chỗ ở `67ae404`: form của ví dụ App shell không còn rời trang docs khi nhấn Enter, và câu về khoá vắng mặt trong `localStorage`.
- **Quyết định Claude tự chốt khi thực thi** (chủ dự án có thể đảo lại):
  - ThemeSwitch controlled không đổi code: trước khi hydrate nó hiện `defaultValue` (spec §3.5; nhờ vậy next-themes không lệch khi hydrate), và docs nói vậy. Cách khác là cho bản controlled `data-pending` trước khi mount, để CSS đọc `<html>`; khi đó System của next-themes hiện mặt trời hay mặt trăng cho tới khi mount, nên việc này cần chủ dự án quyết.
  - Chọn lại đúng theme đang hiện không ghi `localStorage`: giữ code; docs và spec nói rõ.
  - `defaultValue` ngoài union thành System, không cảnh báo, như `value`.
- **Để lại** (ghi trong mô tả PR):
  - Ở màn rộng, form bọc ô H2 rộng theo nội dung (284px) và không co lại như ô trần, nên một header hẹp có thể tràn.
  - Một `<dialog>` modal do ứng dụng tự mở (không qua lib) không chặn phím tắt của ô.
  - iOS: bấm ← làm ô rỗng mất focus và đóng lại trước khi lần bấm tới nút, nên focus về `<body>`.
  - Bề rộng đổi qua 768px khi H3 đang mở có thể để focus trên một phần tử vừa bị ẩn.
  - Khoảng 17px của menu và tooltip được chỉnh cho header 56px; trong header 60px của AppShell chúng cách mép 4px, và không tính từ `--flg-app-shell-header-height`.
  - Bảng thông báo của công thức không có chiều cao tối đa.
  - Story `TwoShellsStayInSync` (iframe ẩn) dễ chập chờn ở WebKit của CI; phần sửa story `SheetCloses` vẫn là giả thuyết.
  - Safari thật, VoiceOver và NVDA chưa thử.
- Kiểm tra trên `67ae404` (Claude): format, contrast, unit + unit-react18 + scripts 221 file, 4624 passed, 5 skipped; build, `check:package`, `pnpm size` (JS 54,79/60,27 kB, CSS 16,15/17,76 kB); build Storybook, `check:docs-tables`; story docs 78 (light). Kịch bản fixture chạy từ bản sao đổi cổng sang 5179/4179 trên `e179847`: "Fixtures OK: vite, next". Người sửa chạy story search-field 42 + 42, theme-switch 30, user-menu 27, tooltip 42, nav 60, docs 78, app-shell 165 ở ba engine (light; search-field cả dark).
