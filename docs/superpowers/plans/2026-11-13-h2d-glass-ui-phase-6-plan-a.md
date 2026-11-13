# h2d-glass-ui: Plan A, `Kbd`, `MenuShortcut keys`, kéo bằng con trỏ và Dialog kéo được (giai đoạn 6, phần 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan A, plan đầu của giai đoạn 6: bộ định dạng phím dùng chung `src/internal/shortcut-format.ts`; component `Kbd` (K1) trong câu chữ, trong Tooltip và trên Button, server-safe với phần biết nền tảng là client; gợi ý phím của `SearchField` lấy chữ từ bộ định dạng đó mà không đổi pixel nào; `MenuShortcut keys` (menu vẽ ô K1) cùng quy tắc `prefers-contrast: more` và forced colors của nó; primitive `usePointerDrag` (`src/internal/use-pointer-drag.ts`) và `GripIcon`; `DialogContent movable` (D2) với token `--flg-dialog-lift-shadow`; thuộc tính `data-visual-drag` của harness visual; check tương phản `kbd-key-text` và `dialog-grip`, dòng 37 của §4.9 và dòng 4 mở rộng; trang `Kbd.mdx`, mục "Shortcuts" của trang menu, mục "Movable" của `Dialog.mdx`, các ghi chú của trang Accessibility; và ngưỡng kích thước.

**Architecture:**
- **Bộ định dạng phím** (Task 1): `src/internal/shortcut-format.ts` là hàm thuần, không React, không đọc nền tảng (`apple` là tham số), nên server chạy được và test với tới mọi dòng của bảng §3.3. `parseKeys` → `{ parts, unknown }`; `formatKeys` → ký hiệu và tên ẩn của từng phím; `shortcutText` → chuỗi phẳng ("⌘K", "Ctrl K"); `toAriaKeyShortcuts` → "Meta+K", "Control+K". `Kbd`, `MenuShortcut keys` (qua `Kbd`) và gợi ý của `SearchField` dùng chung nó.
- **`Kbd`** (Task 1): server-safe (`src/components/kbd/Kbd.tsx`, không `"use client"`, không hook). Có `children` thì là một `<kbd class="flg-kbd">` của server; có `keys` thì trả về `KbdKeys` (`kbd/kbd-keys.tsx`, `'use client'`, không export từ gói), phần vẽ cả `<kbd>` ngoài, vì `data-platform="apple"` nằm trên phần tử đó và chỉ phần client biết nền tảng (`useApplePlatform`, sau khi mount). `scripts/rsc-probe.mjs` thay bundler bằng loader `scripts/rsc-client-boundary.mjs`: module `dist/` bắt đầu bằng "use client" thành tham chiếu client, và `renderTree` dừng ở đó.
- **`MenuShortcut keys`** (Task 2): `keys` vẽ `<Kbd keys labels>` bên trong `span.flg-menu-shortcut`; `children` như cũ. Ô giữ giao diện của nó trên mục đang được trỏ mà không cần quy tắc nào (`.flg-kbd` có màu riêng); `prefers-contrast: more` và forced colors có quy tắc riêng, cùng một selector.
- **`usePointerDrag`** (Task 3): `usePointerDrag(options) → { onPointerDown }`. Một lần nhấn, ngưỡng (mặc định 4px, đo theo khoảng cách), `onStart`, `onMove` (lần vượt ngưỡng đồng bộ, sau đó gộp theo `requestAnimationFrame`), `onEnd`, `onCancel` (Esc khi `cancelOnEscape`, `pointercancel`, `lostpointercapture` trước khi thả). Pointer capture, listener trên `document`, tuỳ chọn đọc qua một ref; mọi thứ được nhả khi kết thúc, huỷ hay unmount. Nền chung của Dialog và các thao tác kéo của DataGrid (Plan C, E).
- **`DialogContent movable`** (Task 4): `src/components/dialog/use-movable.ts` (máy trạng thái của §3.4 trên `usePointerDrag`, `threshold: 3`, `cancelOnEscape: false`) được `ModalContent` gọi, vì nó giữ ref của `<dialog>` và panel; `DialogHeader` lấy handler qua một context nội bộ của `modal.tsx` (null ở Dialog thường và ở Drawer). Độ lệch nằm ở `--flg-dialog-x`, `--flg-dialog-y` trên `style` của panel, ghi bằng `style.setProperty` (không render React mỗi lần di), CSS đổi thành `translate`. Mọi quy tắc kéo được nằm trong `@media (min-width: 640px)`.
- **Story theo nền tảng** (Task 1, 2): `.storybook/platform.ts` (`onPlatform('apple' | 'other')`), một `beforeEach` che `navigator.platform` và `navigator.userAgentData` rồi gỡ khi xong.
- **Harness visual** (Task 4): `tests/visual/stories.visual.ts` nhận `data-visual-drag="dx,dy"`: chuột thật nhấn vào tâm phần tử, đi `dx, dy`, chụp khi chưa thả.

**Tech Stack:** Như Plan C của giai đoạn 5: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`. Plan này làm các phần sau:
- §2 dòng A: `shortcut-format.ts`, `Kbd`, SearchField dùng bộ định dạng chung (Task 1); `MenuShortcut keys` (Task 2); `use-pointer-drag.ts`, `GripIcon` (Task 3); `DialogContent movable`, token `--flg-dialog-lift-shadow`, `data-visual-drag` của harness (Task 4). §2 "Thay đổi ở code cũ", dòng Plan A (Task 1, 2, 4).
- §1: dòng "Tương phản: cần duyệt", phần dòng 37 (Task 1); dòng "Phím" (Task 1, 2); dòng "Dialog kéo được" (Task 4); dòng "Thay đổi ở component cũ", phần `MenuShortcut keys` (Task 2), `SearchField` (Task 1), `DialogContent movable` và lớp `flg-dialog-header` (Task 4); dòng "Kiểm thử", phần harness (Task 4).
- §3.1: dòng `Kbd`, `KbdKeys` và các ý "Kbd trong Server Component", `check:use-client`, `check:rsc` (Task 1); dòng `MenuShortcut` (Task 2); dòng `DialogContent`, `DialogHeader` (Task 4).
- §3.3 trọn mục (Task 1; `MenuShortcut` ở Task 2).
- §3.4 trọn mục (Task 4).
- §3.8: đoạn đầu (ngưỡng, Esc, `lostpointercapture`) (Task 3); dòng "Kéo hộp thoại `movable`" (Task 4).
- §3.9: dòng Kbd (Task 1), dòng Dialog `movable` (Task 4). §3.10: dòng Dialog nhấc lên và Dialog về giữa (Task 4).
- §4.1: K1 (Task 1, 2), D2 (Task 4) của `phase-6-kbd-dialog.html`.
- §4.2: `--flg-dialog-lift-shadow` (Task 4); màu "Viền của Kbd trên nút đặc" (Task 1).
- §4.3 **Kbd (K1)** (Task 1; ý "Trong menu" ở Task 2), **Dialog kéo được (D2)** (Task 4).
- §4.4: check `kbd-key-text`, dòng 37, dòng 4 mở rộng (Task 1); quy tắc `prefers-contrast: more` của Kbd trong mục menu đang được trỏ (Task 2); check `dialog-grip` (Task 4).
- §4.5: Kbd (Task 1; mục menu đang được trỏ và mục bị tắt ở Task 2), "Dialog kéo được" (Task 4).
- §4.6: `GripIcon` (Task 3).
- §5: `shortcut-format.ts`, thay đổi của `SearchField`, cảnh báo của Kbd (Task 1); `MenuShortcut` và cảnh báo của nó (Task 2); `use-pointer-drag.ts` (Task 3); `dialog/use-movable.ts`, thay đổi của `DialogContent` và `DialogHeader`, cảnh báo của Dialog (Task 4); "Công cụ": `rsc-probe.mjs` (Task 1), `stories.visual.ts` (Task 4), `contrast.ts` (Task 1, 4).
- §6.1: `ref` của `Kbd` (Task 1). §6.3: `Kbd`, `SearchField` (Task 1), `MenuShortcut` (Task 2), `DialogContent` phần `movable` (Task 4).
- §7: lớp 1–3 của Kbd, SearchField (Task 1), MenuShortcut (Task 2), Dialog `movable` (Task 4); "Test kiểu" (`KbdProps`, `MenuShortcutProps`, `movable`); "Gói phát hành" (`flg-kbd`, `flg-dialog-header`, `flg-dialog-grip`); `theme-css.test.ts` (`--flg-dialog-lift-shadow`); story giao diện của Plan A (Task 1, 2, 4); "Harness visual" (Task 4).
- §8: `Kbd.mdx`, dòng của trang SearchField, ghi chú Accessibility "Kbd đọc tên ký hiệu" (Task 1); trang menu thêm `MenuShortcut keys` (Task 2); `Dialog.mdx` mục "Movable", ghi chú Accessibility về Dialog kéo được (Task 4); `size-limit` (Task 4).
- §10: dòng "Kbd trên Apple hiện Ctrl K một khung hình" (Task 1), dòng WCAG 2.5.7 (Task 4), dòng "Bảy dòng mới của §4.9", phần dòng 37 (Task 1).
- §4.9 của spec 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 37, nhãn dòng 4, đoạn về dòng 37, "Cả ba mươi bảy điểm" (Task 1).
- Không có ở plan này: `DialogContent fullScreenOnPhone` (Plan F); `DataGrid` và engine của nó (Plan B–G).

Chủ dự án chọn mockup ngày 2026-11-13 ("như đề xuất": K1 D2 G1 C1 F1 R1 E2 EF1) và duyệt spec cùng ngày ("ok"), kể cả dòng 37–43 của §4.9 (dòng 37 là của Plan A). `main` ở `b9bb9ca` (`0.4.0`); nhánh `feat/phase-6-plan-a` ở `37273ea` (`b9bb9ca` cộng spec `3c1dda8` và lần duyệt `37273ea`).

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-6-plan-a`, mỗi task một commit: bốn commit trên `37273ea`: `81827b6` (Task 1), `46e6d10` (Task 2), `f216dc8` (Task 3), `735c725` (Task 4). Sau khi plan được viết, Claude xuống dòng lại hai dòng docs dài quá 100 ký tự (một ở `src/docs/Accessibility.mdx`, Task 1; một ở `DropdownMenu.mdx`, Task 2) và gộp vào đúng commit của chúng, nên SHA đổi so với lúc kiểm: `5bdb92a` → `81827b6`, `c7d0a72` → `46e6d10`, `a9095c7` → `f216dc8`, `ac0ea8d` → `735c725`. Cây của `735c725` chỉ khác `ac0ea8d` ở hai dòng đó (`prettier --check` pass).
- Mỗi test viết trước đã được chạy trên code trước nó và được thấy fail, nếu fail được. Các test viết sau code hay không fail trước được, và cách chúng được kiểm, nằm ở phát hiện 20: test và story có sẵn của SearchField là đặc tả cho lần tái cấu trúc của Task 1; story của Task 4 viết sau code và được kiểm bằng đột biến (bỏ `preventDefault` của lần nhấn thì `MovableKeepsTheFocus` fail ở cả ba engine).
- Cả bốn task do subagent Claude Sonnet viết, lần lượt từng task. Plan A không dùng opencode: việc đó không được đề xuất trong phiên này (mỗi phiên cần chủ dự án đồng ý). Claude (Opus) kiểm tra từng task.
- Claude chụp mọi story giao diện từ một bản Storybook vừa build và đối chiếu với `phase-6-kbd-dialog.html`: k1 (câu chữ, nút `primary` và SearchField; tooltip; menu) ở Task 1 và Task 2, d2 (nghỉ, hover header, đang kéo, điện thoại; 1280×720 và 390×844) ở Task 4, ở sáng và tối. Tất cả khớp, với các điểm chốt ở phát hiện 6, 10 và 15.
- Hai task được trả lại một lần mỗi task:
  - Task 1: trong tooltip, Kbd dính sát chữ "Search", mockup cách 6px. `:not(:first-child)` không thấy nút văn bản, nên khoảng cách nay luôn có (phát hiện 6). Commit sửa lại thành `5bdb92a` (trước là `9d7126b`; nay là `81827b6`).
  - Task 3: sự kiện vượt ngưỡng phải tới cả `onMove`, để mọi nơi dùng chỉ đặt vị trí ở một chỗ (phát hiện 12). Commit sửa lại thành `a9095c7` (trước là `8d83d1f`; nay là `f216dc8`).
- Mọi khối patch trong plan được lấy thẳng từ bốn commit đó (`patches/make-patches.sh` của bản nháp tách mỗi commit thành patch test và patch code).

Kết quả đo ở đầu nhánh nháp `ac0ea8d` (nay `735c725`, cùng code), ngày 2026-11-13, do Claude chạy (`check-p6a.sh` của bản nháp, 29 bước, mọi bước rc 0):

| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run --project unit --project unit-react18 --project scripts` (như `pnpm test:unit`) | PASS. Bản ghi `check-output.txt` chỉ giữ mã thoát, không giữ số test; số của từng task nằm ở Step 4 của task đó |
| Story | kbd 51, dropdown-menu 48, context-menu 9, search-field 54, tooltip 42, dialog 78, drawer 15, docs 78, ở mỗi project (`storybook-light`, `storybook-dark`). PASS ở Chromium, Firefox và WebKit, chạy từng thư mục một và từng project một. Lần search-field của `storybook-light` pass nhưng trình duyệt đóng chậm (`The browser did not close within 10000ms`); chạy lại riêng: 54 PASS. Cả bộ story chưa chạy một lượt trên máy này; CI chạy cả bộ |
| `pnpm check:contrast` | PASS (`Contrast check passed.`). Hai check mới, `kbd-key-text` và `dialog-grip`; một ngoại lệ mới, dòng 37 (`kbd-key-text` dark 3.23) |
| `pnpm check:package`, `pnpm size` | PASS với ngưỡng mới: JS 62946 B, CSS 18263 B (CSS đo được 16.6 kB; ngưỡng trước 60417 B và 17797 B) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name`, `pnpm build` | PASS |
| `pnpm build-storybook`, `pnpm check:docs-tables` | PASS (`no table built as text in 210 files`). Index đã build có 162 story có ảnh (152 trước Plan A) và một trang docs mới, `components-kbd--docs`; trang `components-dialog--docs`, `components-dropdownmenu--docs`, `components-searchfield--docs` được sửa |
| Fixtures | Không chạy: Plan A không đổi fixture nào, và `check:rsc` kiểm `Kbd` ở phía server |
| Visual | Chưa chạy. 80 ảnh chuẩn mới của 10 story giao diện chạy lần đầu trong CI |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Bốn task nháp là bốn task của plan, cùng số thứ tự** (Claude chốt cách chia, để mỗi commit review được riêng).
   - Task 1: `shortcut-format.ts`; `Kbd` (K1) trong câu chữ, Tooltip và trên Button; gợi ý của SearchField qua bộ định dạng; ranh giới client của probe RSC (`scripts/rsc-client-boundary.mjs`); dòng 37 của §4.9 và dòng 4 mở rộng; `Kbd.mdx`; helper nền tảng của story `.storybook/platform.ts`.
   - Task 2: `MenuShortcut keys` và Kbd trong menu, quy tắc contrast-more và forced colors của nó, `DropdownMenu.mdx`.
   - Task 3: `usePointerDrag` (`src/internal/use-pointer-drag.ts`) và `GripIcon`.
   - Task 4: `DialogContent movable` (D2), `use-movable.ts`, `--flg-dialog-lift-shadow`, check `dialog-grip`, `data-visual-drag` của harness, mục "Movable" của `Dialog.mdx`, ghi chú Accessibility, ngưỡng kích thước.
   - Mỗi task thêm những story giao diện nó vẽ đúng được: bốn của Kbd ở Task 1, hai của Kbd trong menu ở Task 2, bốn của Dialog ở Task 4. Task 3 không có story (primitive nội bộ, chưa ai dùng).
2. **Bộ định dạng phím** (Task 1):
   - `parseKeys` tách theo `+`, bỏ khoảng trắng hai bên, không phân biệt hoa thường, giữ thứ tự người viết (`mod+shift+f` ra ⌘⇧F và "Ctrl Shift F"). Mỗi phần là `named` (một phím của bảng §3.3; `escape` là `esc`; `f1` tới `f12`), `char` hay `unknown`. Một phần lạ nằm trong `parts` (vẽ nguyên chữ) và trong `unknown`; một phần rỗng (`mod++`) chỉ nằm trong `unknown` dưới dạng `''`, vì không có gì để vẽ. `unknown` không rỗng là một `devWarn`.
   - **Một ký tự chỉ được viết hoa khi bản hoa vẫn là một ký tự** (Claude chốt theo nhận xét 9 của PR #39): `k` ra K, `ß` giữ nguyên (bản hoa là "SS"). "Một ký tự" là một code point (`[...x].length === 1`), cả cho phần lẫn cho kết quả. Dùng `toUpperCase`, không `toLocaleUpperCase`, nên server và trình duyệt ở mọi ngôn ngữ cho cùng chữ (test `does not depend on the locale of the page`).
   - `shortcutText` trên Apple nối các ký hiệu liền nhau và đặt một khoảng trắng quanh một chữ (`⌘⇧F`, `⌘ Page Up`); nơi khác nối bằng một khoảng trắng. Spec chỉ cho "⌘K" và "Ctrl K" (ngoài spec, Claude chấp nhận).
   - `KbdLabels` (export) là `KeyLabels` của `shortcut-format.ts`; `DEFAULT_KEY_LABELS` là mặc định tiếng Anh của spec §6.3.
3. **`Kbd` và `KbdKeys`** (Task 1; spec §3.1, §6.3 đã sửa):
   - **`KbdKeys` vẽ cả `<kbd class="flg-kbd">` ngoài** (Claude chốt): `data-platform="apple"` nằm trên phần tử ngoài, và chỉ phần client biết nền tảng. Spec cũ để `<kbd>` ngoài ở server và `KbdKeys` là con của nó. `Kbd` có `children` vẫn là markup thuần của server; với `keys` nó trả `<KbdKeys ref {...props} className keys labels />`.
   - HTML từ server và lần render hydrate dùng dạng "nơi khác"; Apple sau khi mount (`useApplePlatform`, giá trị phía server là `undefined`). `data-platform` đặt sau props của người gọi, nên người gọi không gỡ được thứ CSS dựa vào; mọi prop khác (`title`, `style`, `aria-*`, handler) được giữ, `className` được nối.
   - Cảnh báo "cả `keys` lẫn `children`" ở `Kbd` lúc render (như Indicator và Skeleton), quyết bằng `hasContent`; cảnh báo phần lạ ở `KbdKeys`, trong một effect theo một boolean, nên chỉ một lần cho mỗi lần chuyển.
   - Các phím được đánh key theo vị trí (danh sách đến từ một chuỗi, không giữ state, và một phím có thể lặp); code có chú thích nói vậy.
4. **Probe RSC và ranh giới client** (Task 1; ngoài spec):
   - `Kbd.js` import `kbd-keys.js`, mà qua `platform.js` import `useSyncExternalStore`; bản `react-server` của React không có export đó, nên ca probe của `Kbd` fail với `Named export 'useSyncExternalStore' not found` trước khi `renderTree` chạy. Bundler của một framework không nạp module client cho Server Component; nó đặt một tham chiếu vào chỗ đó.
   - `scripts/rsc-client-boundary.mjs` làm việc của bundler: một loader (`module.register`) thay mỗi module của `dist/` bắt đầu bằng "use client" bằng một tham chiếu client (`$$typeof: Symbol.for('react.client.reference')`) cho mỗi export. `renderTree` nhận tập tham chiếu client và dừng ở đó; một ca có `clients` và `expect.type: { client: '<tên export>' }`.
   - Hai ca mới: `Kbd with children` và `Kbd with keys hands them to the client component KbdKeys` (kiểm `type`, `keys`, `labels`, `className`).
   - **Giới hạn:** loader đọc các dạng export tsdown đang viết (`export { A, B as C }`, `export const|let|var|function|class`). Một bản tsdown viết export khác đi thì danh sách tham chiếu rỗng, và ca Kbd fail ồn ào (`type` là `undefined`), không pass lặng lẽ.
5. **Nền tảng trong story** (Task 1; spec §7 đã sửa, "loader" thành `beforeEach`):
   - `.storybook/platform.ts`: `onPlatform('apple' | 'other')` trả một `beforeEach` che `navigator.platform` và `navigator.userAgentData` trên chính đối tượng `navigator` (`Object.defineProperty(…, { configurable: true, value })`; story không gán được, vì đó là getter của prototype), và trả cleanup xoá cả hai. Apple: `'MacIntel'` và `{ platform: 'macOS' }`; Other: `'Linux x86_64'` và `undefined`.
   - Story "Other" cũng đặt nền tảng: ảnh chuẩn chụp trên Linux, nhưng người phát triển có thể chạy story trên Mac.
   - `Default` (đọc nền tảng của máy) và `OneKey` gắn `no-visual`: chúng không phải giao diện của mockup, và `Default` đổi theo máy.
   - `Kbd.mdx` chỉ hiện story không đặt nền tảng (`Default`): một trang docs vẽ cùng lúc story Apple và Other thì hai `beforeEach` giành nhau `navigator`. Vì cùng lý do, trang menu không có Canvas của hai story menu (Task 2).
6. **CSS của Kbd và lần trả lại Task 1** (Task 1; spec §4.3 đã sửa):
   - `kbd.css` theo §4.3. Các quy tắc theo chỗ đặt (tooltip, nút đặc, menu) chỉ đổi màu, viền, cỡ và canh dòng, không đổi `display`, nên quy tắc trạng thái của Button (đang tải, chỉ có icon) vẫn thắng (nhận xét 8 của PR #39).
   - Chữ ẩn "+" giữa hai phím là `flg-visually-hidden` (`position: absolute`; `.flg-kbd` là `position: relative`), không phải flex item, nên không thêm khoảng (story `KbdSeparatorsTakeNoRoom`, `KbdSeparatorsTakeNoRoomApple`).
   - **Kbd trong tooltip luôn cách chữ 6px.** Ảnh tooltip đầu tiên của Claude có Kbd dính sát "Search"; mockup cách 6px. Selector `.flg-tooltip .flg-kbd:not(:first-child)` của spec không bao giờ khớp: selector không thấy nút văn bản, nên trong `Search<Kbd />` Kbd là con phần tử đầu tiên. Quy tắc nay là `.flg-tooltip .flg-kbd { margin-left: 6px }`; một tooltip chỉ có một phím cũng có 6px (hiếm). `KbdBoxHeights` đo khoảng đó bằng một `Range` quanh nút văn bản (fail trước, nhận 0 ở ba engine). `Kbd.mdx` dặn không viết khoảng trắng giữa chữ và Kbd.
   - Forced colors: viền và chữ `CanvasText`; trên nút đặc `ButtonText`, với selector cụ thể bằng quy tắc của chỗ đó trong `kbd.css`.
7. **Tên đọc của Kbd** (Task 1):
   - Một nút chứa `<Kbd keys="mod+k" />` có tên là chữ của nút cộng tên các phím nối bằng "+": khớp `/Command\s*\+\s*K/` trên Apple, `/Ctrl\s*\+\s*K/` nơi khác, không bao giờ "CtrlK" hay "⌘K" (unit test và story `KbdNamesAButtonOther`, `KbdNamesAButtonApple`, tính tên bằng Testing Library).
   - **Ngoài Apple, trình đọc màn hình đọc chữ "Ctrl"**, vì code vẽ chữ "Ctrl" không có tên ẩn, như §3.3 nói (chữ được đọc như chữ). Docs ghi "Ctrl plus K"; spec §7 lớp 6 ghi "Control plus K". Cần kiểm bằng NVDA (phát hiện 24).
8. **SearchField trên bộ định dạng** (Task 1):
   - Hàm nội bộ `Kbd` của `SearchField.tsx` đổi tên thành `KeyHint` (kiểu `KeyHintProps`). `labels.shortcut` mặc định là `shortcutText(parseKeys(shortcut).parts, apple)`, dạng chung của biểu thức trong spec §3.3, cùng kết quả "/", "⌘K", "Ctrl K"; `aria-keyshortcuts` qua `toAriaKeyShortcuts`. `matchesShortcut` không đổi.
   - Không đổi API, DOM hay CSS. Test và story có sẵn của SearchField là đặc tả, không fail trước được, và chạy nguyên (54 story test ở mỗi project); không ảnh chuẩn nào của SearchField đổi. `SearchField.mdx` thêm một đoạn nói nó dùng chung bộ định dạng với `Kbd`.
9. **`kbd-key-text` và dòng 37** (Task 1):
   - Check `kbd-key-text` (4.5) đo chữ `--flg-text-muted` trên ô `--flg-control-bg-secondary`, lấy số thấp nhất của năm chỗ: trên kính (câu chữ, menu), trên `--flg-control-bg` (nút `secondary`), trên mục menu đang được trỏ (mọi điểm màu của `--flg-highlight-bg`), trong tooltip. Ở contrast-more mục đang được trỏ là màu nhấn đặc và ô mất nền, nên đo `--flg-highlight-text` trên mục. Hàm `kbdText` của `kbd-text` đổi tên thành `keyText` và được dùng chung.
   - Số bằng số của spec: 6.71 light, 3.23 dark, 6.28 light +, 7.63 dark +. Ở dark: 3.64 trên kính, 3.31 trên nút `secondary`, 3.23 trên mục đang được trỏ, 3.76 trong tooltip. Hai test vá một lớp nhấn và một kính tooltip nhạt để chứng minh mục đang được trỏ và tooltip được đo thật.
   - Dòng 37 (chủ dự án duyệt cùng spec): ngoại lệ dark 3.23 trong `scripts/contrast-exceptions.ts`; nhãn dòng 4 thêm "Kbd trên nút `primary`"; dòng 37, nhãn dòng 4, đoạn về dòng 37 và "Cả ba mươi bảy điểm" trong §4.9 của spec 0+1; `ExceptionTable.test.tsx` đếm 37 dòng; câu trỏ của trang Accessibility ("Kbd (row 37, and its part in row 4)").
10. **`MenuShortcut keys`** (Task 2):
    - `keys` vẽ `<Kbd keys labels>` bên trong `span.flg-menu-shortcut`; `children` như cũ; có cả hai thì `devWarn` (quyết bằng `hasContent`) và `keys` thắng. `MenuShortcutProps` là union của §6.3, có test kiểu.
    - Ô giữ giao diện của nó trên mục đang được trỏ mà **không cần quy tắc nào**: `.flg-kbd` có màu riêng, nên màu mà mục đặt cho `.flg-menu-shortcut` không tới ô. Ô cao khoảng 18px và hàng không đổi chiều cao so với một `MenuShortcut` chữ (`KbdInMenuRowHeight`).
    - **`.flg-menu-shortcut .flg-kbd { vertical-align: 0 }` không làm gì:** phần shortcut là một flex item, nên ô được canh giữa dù có quy tắc hay không (bỏ quy tắc thì `KbdInMenuRowHeight` vẫn pass). Quy tắc được giữ như spec ghi.
    - Story menu: nút mở không có chevron (mockup vẽ "Chỉnh sửa ⌄"), là nội dung của story, Claude chấp nhận. `minHeight: 134` giữ thẻ cao bằng menu nằm trong luồng của mockup (menu của lib là popover ở top layer). Ảnh của Claude: `KbdInMenuApple`, `KbdInMenuOther` khớp k1 (c) ở hai theme; ô giữ giao diện trên "Paste" đang được trỏ.
    - Không có cặp tương phản mới: `kbd-key-text` và dòng 37 đã đo mục đang được trỏ (contrast-more 7.63 ở dark).
11. **Contrast-more và forced colors của Kbd trong menu** (Task 2; spec §4.4, §4.5 đã sửa; Claude chốt, vì cả hai là chế độ người dùng bật, ngoài mockup):
    - Contrast-more, mục đang được trỏ: chữ `inherit` (không phải `--flg-highlight-text` như spec cũ), nền trong suốt, viền `currentColor`. `inherit` lấy màu của `.flg-menu-shortcut`, tức `--flg-highlight-icon` (ở chế độ này bằng `--flg-highlight-text`), còn mục `danger` có màu chữ riêng (`--flg-on-danger` trên `--flg-danger-fill`), mà `--flg-highlight-text` sẽ sai.
    - Forced colors: mục đang được trỏ, viền và chữ `HighlightText`, nền trong suốt; mục bị tắt, `GrayText` (thêm ngoài spec: quy tắc `CanvasText` chung của `.flg-kbd` sẽ nằm trên mục đó).
    - Hai quy tắc dùng cùng một selector, `.flg-menu-item:is(:focus, [data-open], [data-highlighted]) .flg-kbd` (0,3,0), và quy tắc forced colors đứng sau trong `preferences.css`, để màu hệ thống thắng khi cả hai chế độ cùng bật.
    - Người viết task kiểm cả hai bằng computed style trong Chromium (`emulateMedia({ contrast: 'more' })`, `{ forcedColors: 'active' }`) trên story đã build, ở hai theme: viền và chữ `HighlightText`, nền trong suốt (trắng trên tím; đen trên lục lam ở forced dark). Không có story cho việc này.
12. **`usePointerDrag` và `GripIcon`** (Task 3; không sửa dòng spec nào):
    - Mọi callback sau lần nhấn nhận một `PointerDragInfo` (`x`, `y`, `startX`, `startY`, `dx`, `dy`, `pointerId`, `pointerType`, `event`). `onPress` nhận sự kiện `pointerdown` của React, để gọi `preventDefault` được.
    - **Lần trả lại Task 3:** sự kiện vượt ngưỡng gọi `onStart(info)` rồi ngay `onMove(info)` với cùng `info`, đồng bộ, không chờ khung hình; nếu `onStart` đã kết thúc cử chỉ (unmount, huỷ) thì bỏ `onMove`. `onStart` chỉ có nghĩa "lần nhấn thành kéo"; `onMove` là chỗ duy nhất đặt vị trí, cho mọi nơi dùng. Test mới `the event that crosses the threshold reaches onMove at once, after onStart` fail trên code cũ (thứ tự chỉ có `start 6,3`); bốn test ghim hợp đồng cũ được sửa.
    - Sau đó `onMove` gộp theo `requestAnimationFrame` (sự kiện cuối thắng) và lần đang chờ được đẩy ra ngay trước `onEnd`. Lần nhấn thả trước ngưỡng chỉ gọi `onPress`; `pointercancel` trước ngưỡng không gọi gì. `onCancel(info)` không có tham số lý do (một plan sau có thể thêm). Một lần nhấn mới của con trỏ chính huỷ cử chỉ cũ chưa kết thúc (`onCancel` nếu cử chỉ đó đã thành kéo).
    - Chỉ con trỏ chính và nút chính; chuột với `ctrlKey` trên Apple là chuột phải. Tuỳ chọn nằm trong một ref cập nhật trong layout effect, nên callback mới của cha không bao giờ khởi động lại một lần kéo. Listener `pointermove`, `pointerup`, `pointercancel` và `keydown` (pha capture) trên `document`, `lostpointercapture` trên phần tử được nhấn; một hàm `stop` gỡ hết, cùng `cancelAnimationFrame` và `releasePointerCapture`, khi kết thúc, huỷ, nhấn mới hay unmount. Một lần kéo đang dở lúc unmount kết thúc lặng lẽ, không callback nào.
    - Dùng lại `isComposing` (`roving.ts`), `isApplePlatform` (`platform.ts`), `useIsoLayoutEffect`.
    - **Slider giữ hook riêng `slider/use-pointer-drag.ts`:** lần nhấn của nó dời núm ngay và kéo không có ngưỡng, điều primitive này không làm. Mô tả PR nêu điều này.
    - `GripIcon` trong `src/internal/icons.tsx`: viewBox `0 0 8 14`, sáu `circle` bán kính 1.4 tại các điểm của §4.3 D2, `fill="currentColor"`, `stroke="none"`, `aria-hidden` và `focusable="false"` từ `strokeIcon`; props ghi đè được.
13. **Máy trạng thái của Dialog kéo được** (Task 4; không sửa dòng spec nào):
    - `useMovable({ enabled, open, dialogRef, panelRef })` trả `{ onPointerDown, onDoubleClick }` cho header; `ModalContent` gọi nó (giữ cả hai ref), `DialogHeader` đọc handler qua `ModalMovableContext`, null ở Dialog không kéo được và ở Drawer. Drawer không đổi gì, nhưng vẫn chạy `useMovable` (với `enabled: false`, kể cả `useMediaQuery`) qua `ModalContent` dùng chung (mô tả PR nêu).
    - Trên `usePointerDrag` (`threshold: 3`, `cancelOnEscape: false`): `onPress` gọi `preventDefault` (focus và vùng chọn chữ ở yên), nhớ độ lệch lúc bắt đầu và đo; `onStart` bật `data-dragging` trên `<dialog>` (`toggleAttribute`, không render React); `onMove` là chỗ duy nhất ghi độ lệch, đã kẹp; `onEnd` và `onCancel` là cùng một hàm. **`pointercancel` giữ vị trí panel đã tới** (Claude chốt: một lần huỷ là trình duyệt lấy con trỏ, không phải người dùng rút lại).
    - Lọc lần nhấn: `active` (`movable`, đang mở, cửa sổ ≥ 640px qua `useMediaQuery`) và đích không nằm trong phần tử tương tác của header (selector `INTERACTIVE` của §3.4, qua `closest`, và phần tử đó phải nằm trong header). Nút chính và con trỏ chính là việc của primitive. Lần nhấn bị lọc không bị `preventDefault`, nên trình duyệt giữ hành vi của nó. `useMovable` ghi `activeRef.current` trong lúc render (mô tả PR nêu).
    - Kẹp: khung kẹp tính từ cỡ layout (`offsetWidth`, `offsetHeight`) và tâm của `getBoundingClientRect()` trừ độ lệch hiện tại, nên panel đang nhấc lên (`scale`) đo như panel nằm yên. Khung là `clientWidth`, `clientHeight` của `<dialog>`; lề 16px là padding của khung. **`offsetWidth`, `offsetHeight` là số nguyên**, nên một mép có thể lệch tới 0.5px; story cho phép 1px. Một `ResizeObserver` trên panel và trên khung đo lại và kẹp độ lệch hiện tại; nó cũng báo một lần khi bắt đầu quan sát, không làm gì (độ lệch 0 nằm trong khung).
    - Mọi thứ đã đặt được trả lại khi `active` thành `false` (cửa sổ dưới 640px, `movable` tắt, hộp thoại đóng) và khi unmount: `removeProperty` hai biến, bỏ `data-dragging`, bỏ phiên kéo; một lần kéo đang dở lúc đó không ghi gì nữa. `dblclick` trên phần không tương tác của header xoá hai biến: về giữa ngay, không animation. Esc trong lúc kéo đóng hộp thoại như mọi khi (primitive không lấy phím).
    - `devWarn("<DialogContent movable> needs a <DialogHeader> to drag it by.")` sau khi mở, khi panel không có phần tử `.flg-dialog-header`.
    - `DialogHeader` luôn có lớp `flg-card-header flg-dialog-header` (không có CSS ở trạng thái thường); khi kéo được, `data-movable` (sau props của người gọi, và chỉ đặt khi kéo được, để không xoá thuộc tính của người gọi ở chỗ khác), tay nắm là con đầu (`GripIcon`, lớp `flg-dialog-grip`, `aria-hidden`), và `onPointerDown`, `onDoubleClick` của người gọi được ghép trước (`composeEventHandlers`: người gọi gọi `preventDefault` là từ chối kéo).
    - Unit test `does not render React for each move` (Profiler) giữ việc mỗi lần di không qua React.
14. **CSS của D2, token và `dialog-grip`** (Task 4):
    - Mọi quy tắc kéo được nằm trong `@media (min-width: 640px)`; ngoài đó tay nắm là `display: none`. Quy tắc `cursor: auto` cho phần tử tương tác trong header viết bằng `:where()` (độ cụ thể 0), để `cursor` riêng của control (Button `pointer`) thắng. Selector của tay nắm lúc kéo dài hơn selector hover, nên tay nắm dưới con trỏ có màu nhấn.
    - `translate` của panel không nằm trong `transition` (panel bám con trỏ ngay); `transition` của panel thêm `scale` và `box-shadow` (`--flg-duration-fast`, ngoài mockup).
    - `preferences.css`: forced colors (tay nắm `CanvasText`, lúc kéo `Highlight`, bỏ bóng nhấc lên); giảm chuyển động (`scale: none`; bóng vẫn đổi, ngay, vì token thời lượng là 0ms ở chế độ này).
    - Token `--flg-dialog-lift-shadow` trong `values.ts` (light và dark, giá trị mockup) và bảng `MOCKUP` của `scripts/lib/theme-css.test.ts`.
    - Check `dialog-grip` (3): thấp hơn của `--flg-text-muted` (nghỉ) và `--flg-accent-text` (đang kéo) trên panel: 3.95 light, 4.10 dark, 5.95 light +, 9.29 dark +, như spec. Đạt mọi nơi, không có ngoại lệ.
15. **Tiêu đề của D2 cao 20px trong mockup, 15.5px trong story** (Task 4; Claude chốt: không đổi). Đó là quy tắc `h2{font-size:20px;margin:0 0 6px}` riêng của trang mockup (`chrome.css`, không nằm trong layer), thắng `.flg-card-title` (nằm trong layer) của lib. Tiêu đề Dialog giữ đúng cỡ đã duyệt ở giai đoạn 2. Mô tả PR nêu điều này.
16. **Story của Dialog** (Task 4):
    - Story giao diện vẽ lại nội dung của mockup bằng tiếng Anh, trên trang bảng đơn hàng của nó; cỡ `sm` (360px, đúng mockup). Focus bắt đầu ở tiêu đề (`tabIndex={-1}`, `outline: none`), vì mockup không vẽ vòng focus. `DialogMovableHover`: `data-visual-hover` trên header. `DialogMovableDragging`: `data-visual-drag="-112,-34"`. `DialogMovablePhone`: tag `viewport-390x844`.
    - Story hành vi chạy với con trỏ thật (`real.dragAndDrop`) sau khi `withViewport` đặt 1280×720 (khung mà Vitest chạy story có cỡ riêng, và dưới 640px không kéo được).
    - **Hai giới hạn:** `real.dragAndDrop` không giữ được một lần nhấn chưa thả, nên story Esc trong lúc kéo gửi lần nhấn và lần di bằng sự kiện con trỏ tổng hợp (Esc là phím thật của trình duyệt); story chạm cũng là sự kiện tổng hợp `pointerType: 'touch'`, không phải chạm thật. Safari không focus nút được bấm bằng chuột, nên story nút trên header không hỏi focus của nút.
    - Ảnh của Claude (1280×720 và 390×844): nghỉ, hover header (tay nắm `--flg-text`), đang kéo (tay nắm màu nhấn, nhấc lên, lệch −112/−34 cộng 2% phóng to), điện thoại (không tay nắm) khớp d2 ở hai theme.
17. **`data-visual-drag` của harness** (Task 4): đọc "dx,dy"; throw khi một story có cả `data-visual-hover` lẫn `data-visual-drag`, khi giá trị không phải hai số, hay khi phần tử không có hộp. Chuột tới tâm phần tử, `mouse.down()`, đi `dx, dy` trong 5 bước, chờ hai khung hình, chụp khi chưa thả; chờ render xong như hover. Story không có thuộc tính này chụp như cũ. Harness chỉ chạy trong container Linux của CI, nên bản nháp chưa chạy nó; `DialogMovableDragging` là story duy nhất dùng nó.
18. **Docs** (Task 1, 2, 4):
    - `Kbd.mdx` (Task 1): Props, Keys (bảng §3.3), Apple and other systems (HTML từ server, đổi sau khi mount), Where it goes (câu chữ, Tooltip, nút đặc; "In a menu" ở Task 2), A Kbd in a button (`aria-hidden` và `aria-keyshortcuts`), Labels, Accessibility, Do and don't. Chỉ có Canvas của `Default` (phát hiện 5).
    - `SearchField.mdx` (Task 1): một đoạn về bộ định dạng chung. `DropdownMenu.mdx` (Task 2): dòng `MenuShortcut` của bảng, mục "Shortcuts" (`keys`, cách đặt tên với `aria-keyshortcuts` trên `MenuItem` và `aria-hidden` trên shortcut), một ý accessibility (dòng 37).
    - `Dialog.mdx` (Task 4): mục "Movable" và "Why there is no key to move it" (WCAG 2.5.7, 2.1.1), một ý accessibility.
    - Trang Accessibility: câu trỏ (Task 1), mục "Keys" (Task 1), mục "A movable Dialog" (Task 4).
19. **Ngưỡng kích thước và `check:package` giữa các task:**
    - Ngưỡng ban đầu (ở `37273ea`): JS 60417 B, CSS 17797 B.
    - Sau Task 1: PASS (JS 55.85 kB, CSS 16.32 kB). Sau Task 2: PASS (JS 55.92 kB, CSS 16.34 kB). Task 3 không build: primitive và icon nội bộ chưa được export nào dùng, không có CSS.
    - Task 4 chạy `pnpm size:record`: JS 62946 B, CSS 18263 B (số đo cộng 10%; CSS đo được 16.6 kB). Việc gì thêm CSS hay JS sau Task 4 phải chạy lại `size:record`.
20. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: `shortcut-format.test.ts`, `Kbd.test.tsx`, `Kbd.test-d.ts`, test của `contrast.ts`, `ExceptionTable.test.tsx` và `src/index.test.ts` viết trước và fail trước. Story của Kbd viết cùng code; bỏ import `kbd.css` thì 15 trong 42 lần chạy fail (`KbdBoxHeights`, `KbdDrawsAppleSymbols`, `KbdDrawsWords`, `KbdSeparatorsTakeNoRoom`, `KbdSeparatorsTakeNoRoomApple`); `KbdNamesAButton…` và `KbdHydratesToTheApplePlatform` pass không cần CSS, vì chúng kiểm tên và hydrate. Phép đo 6px của lần trả lại fail trước (nhận 0 ở ba engine). **Test và story có sẵn của SearchField là đặc tả** cho lần tái cấu trúc, không fail trước được. Bốn story giao diện không có test; chúng được so với `k1.png` bằng mắt.
    - Task 2: năm test mới của `MenuShortcut` fail trước; `keeps the text it is given, as it did before keys`, `lets the item be named by its label when the shortcut is hidden from assistive technology` và `does not warn for keys alone or for text alone` pass trên code cũ (đặc tả). Test kiểu fail trước. `KbdInMenuRowHeight` fail ở ba engine khi `Menu.tsx` chưa đổi; nó không phân biệt được quy tắc `vertical-align: 0` (phát hiện 10).
    - Task 3: cả file `use-pointer-drag.test.tsx` không nạp được trước khi có module; `GripIcon` fail với `Element type is invalid`. Một test tự tính sai (ngưỡng 10: 9.43px chưa bắt đầu, 10px thì có) và được sửa trong test. Lần trả lại: phát hiện 12.
    - Task 4: unit test của `DialogContent movable`, test kiểu, test của `dialog-grip` và test token viết trước và fail trước. **Story của Dialog viết sau code** (chúng cần engine thật). Để thấy chúng fail được, bỏ `preventDefault` của lần nhấn: `MovableKeepsTheFocus` fail ở cả ba engine, `MovableStopsAtEveryEdge` và `MovableStaysInsideASmallerWindow` fail ở Chromium (vùng chọn chữ kéo theo con trỏ); rồi trả lại.
    - Trên cây của plan, patch test của Task 1 và 3 làm file test của module mới không nạp được (`Failed to resolve import …`).
21. **Các chỗ spec được sửa khi lập Plan A** (đánh dấu "(phát hiện khi lập Plan A)" ở chỗ nêu lý do):
    - Task 1, spec giai đoạn 6: §3.1 dòng `Kbd` của bảng, ý "Kbd trong Server Component", ý `check:rsc` (probe kiểm `type` của phần tử `Kbd` trả về, cùng `keys` và `labels`); §4.3 "Trong Tooltip" (luôn cách 6px, lần trả lại); §6.3 đoạn sau khối cấu trúc (`KbdKeys` vẽ `<kbd>` ngoài); §7 dòng story của Plan A (`beforeEach` và `.storybook/platform.ts` thay cho "loader").
    - Task 1, spec 0+1 §4.9: dòng 37, nhãn dòng 4, đoạn về dòng 37, "Cả ba mươi bảy điểm".
    - Task 2, spec giai đoạn 6: §4.4 ý contrast-more của Kbd trong mục menu đang được trỏ (`inherit`); §4.5 ý Kbd (mục đang được trỏ, mục bị tắt, cùng selector và đứng sau).
    - Task 3 và Task 4 không sửa dòng spec nào.
22. **Ảnh chuẩn của component cũ không đổi.**
    - CSS mới nằm dưới `.flg-kbd` (lớp mới), `.flg-dialog-grip`, `.flg-dialog-header[data-movable]`, `.flg-dialog-panel[data-movable]` và `.flg-dialog[data-dragging]`, mà không story cũ nào có. `DialogHeader` thêm lớp `flg-dialog-header`, không có quy tắc nào ở trạng thái thường. `preferences.css` chỉ thêm quy tắc cho các phần mới.
    - DOM và CSS của SearchField không đổi (phát hiện 8). Thêm một token (`--flg-dialog-lift-shadow`); không giá trị token nào có sẵn đổi.
    - Story cũ của SearchField, Tooltip, menu, Dialog và Drawer chạy nguyên ở ba engine (phát hiện 19, kết quả ở trên). Số story có ảnh đi từ 152 lên 162, đúng 10 story của Plan A. Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
23. **Duyệt của chủ dự án.** Không có gì chờ duyệt ngoài review PR (dòng 37 được duyệt cùng spec). Mô tả PR vẫn liệt kê:
    - các dòng spec sửa trong bản nháp (phát hiện 21);
    - dòng 37 mới và dòng 4 mở rộng;
    - tiêu đề D2 20px của mockup, 15.5px của lib (phát hiện 15);
    - các điểm ngoài spec mà Claude chấp nhận: khoảng trắng của `shortcutText` quanh một chữ trên Apple, `GrayText` của Kbd trong mục menu bị tắt, `pointercancel` giữ vị trí, loader ranh giới client của probe, `Default` và `OneKey` gắn `no-visual`, nút mở menu của story không có chevron (phát hiện 2, 4, 5, 10, 11, 13);
    - các giới hạn đã biết: ngoài Apple trình đọc màn hình đọc "Ctrl" (spec lớp 6 ghi "Control"; cần NVDA); tooltip chỉ có một phím cũng có 6px; `vertical-align: 0` trong menu không làm gì; contrast-more và forced colors của Kbd trong menu chỉ được kiểm bằng computed style ở Chromium; story Esc trong lúc kéo và story chạm dùng sự kiện con trỏ tổng hợp; Safari không focus nút được bấm; kẹp lệch tới 0.5px; `activeRef` ghi trong lúc render; Drawer chạy `useMediaQuery` qua `ModalContent` dùng chung; Slider giữ hook kéo riêng; `onCancel` không có lý do; loader của probe dựa vào dạng export của tsdown; trên Mac, Kbd hiện "Ctrl K" một khung hình trước khi thành "⌘K" (spec §10);
    - 80 ảnh chuẩn mới cần duyệt: 10 story giao diện × 4 chế độ × sáng, tối, đếm từ index đã build (lệnh ở Step 4 của Task 4);
    - Plan A không có changeset: merge PR này không mở PR "Version Packages"; `Kbd`, `MenuShortcut keys` và `movable` lên npm trong `0.5.0` (Plan G). Từ lúc merge tới lúc đó, chúng có trên `main` và trên trang docs công khai (deploy mỗi lần push lên `main`), nhưng chưa có trong gói npm; spec chỉ ẩn DataGrid khỏi docs (§2).
24. **Các mục để lại** (không làm ở plan này):
    - Kiểm tra screen reader (§7 lớp 6): tên của Kbd ("Command plus K" trên Mac; NVDA đọc "Ctrl" hay "Control" ở nơi khác), tên của mục menu có `MenuShortcut keys`, Dialog kéo được đọc như trước. Ghi "chưa kiểm tra" cho từng mục (spec §9).
    - Safari thật và iPad: kéo hộp thoại bằng chạm thật, `touch-action: none` của header giữ trang không cuộn, focus của nút được bấm. Story chỉ chạy WebKit của Playwright, với chạm giả lập.
    - Chưa fixture nào render `<Kbd keys>` từ một Server Component thật; chỉ `check:rsc` và story `KbdHydratesToTheApplePlatform` kiểm điều đó. Fixture của giai đoạn 6 là việc của Plan G.
    - Story cho contrast-more và forced colors của Kbd trong menu (phát hiện 11).
    - Di chuyển Dialog bằng bàn phím (spec §3.4, §10): thêm khi một đợt kiểm định coi vị trí là chức năng.

**Phạm vi:**
- **Không làm ở plan này:**
  - `DialogContent fullScreenOnPhone` (Plan F).
  - `DataGrid`, engine của nó, icon, token (`--flg-data-grid-pin-bg`, `--flg-data-grid-pin-shadow`, `--flg-column-resize-line`), các check và dòng 38–43 của nó, `auto-scroll.ts`, `text-fold.ts`, `download.ts`, `ArrowIcon` hướng `right` (Plan B–G).
  - Changeset (Plan G, `0.5.0`).
  - Ngoài phạm vi của spec §2: đổi kích thước Dialog bằng chuột, kéo Drawer, di chuyển Dialog bằng bàn phím, bảng lệnh, phím tắt toàn trang cho `Kbd` (Kbd chỉ vẽ phím).
  - Các mục để lại ở phát hiện 24.
- **Ảnh chuẩn visual:**
  - 10 story giao diện, mỗi story 8 ảnh (4 chế độ × sáng, tối): 80 ảnh mới.
    - Kbd (6): `KbdInTextApple`, `KbdInTextOther`, `KbdInTooltipApple`, `KbdInTooltipOther` (Task 1); `KbdInMenuApple`, `KbdInMenuOther` (Task 2; menu mở, "Paste" có focus từ play function).
    - Dialog (4): `DialogMovable`, `DialogMovableHover` (`data-visual-hover` trên header), `DialogMovableDragging` (`data-visual-drag="-112,-34"`), `DialogMovablePhone` (`viewport-390x844`).
  - Mỗi story dùng nhiều nhất một trong `data-visual-hover` và `data-visual-drag`, và có nhiều nhất một phần tử được focus (play function, hay `initialFocus` của Dialog).
  - Mọi story khác của Plan A gắn `no-visual`: `Default`, `OneKey`, tám story hành vi của Kbd và `KbdInMenuRowHeight`; mười story `Movable…` của Dialog. Index đã build có 162 story có ảnh (152 trước Plan A).
  - Không tạo ảnh trên Windows. Ảnh chuẩn mới chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh; mọi story mới chạy lần đầu với ảnh chuẩn trong CI.
  - Ảnh của mọi component cũ phải giữ giống từng byte (phát hiện 22).

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
  - `translate` và `scale` là thuộc tính riêng (không qua `transform`), `:where()`, `ResizeObserver`, pointer capture: có ở mọi trình duyệt của mốc này. Code vẫn kiểm `typeof ResizeObserver` và bọc `setPointerCapture` trong `try/catch` (jsdom, sự kiện tổng hợp).
  - `navigator.userAgentData` không có ở Safari và Firefox: `isApplePlatform` lùi về `navigator.platform`.
  - `module.register` của loader probe cần Node 20.6 trở lên; dự án dùng Node 24.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Giao diện và trạng thái dùng data-attribute, đặt sau props của người dùng: `data-platform="apple"` trên `<kbd>` ngoài của Kbd có `keys`; `data-movable` trên panel và trên `DialogHeader` của một Dialog kéo được; `data-dragging` trên `<dialog>` trong lúc kéo. `--flg-dialog-x`, `--flg-dialog-y` nằm trên `style` của panel, do `use-movable.ts` ghi và xoá, không qua React.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`.
  - `src/styles/components/kbd.css` (import trong `src/styles/index.css` sau `tooltip.css`, trước `menu.css`), và quy tắc mới của `dialog.css`.
  - Quy tắc `forced-colors`, `prefers-contrast: more` và `prefers-reduced-motion` nằm trong `src/styles/preferences.css`. Một selector forced colors phải cụ thể ít nhất bằng selector contrast-more của cùng phần, và đứng sau nó: Chromium khớp cả hai khi màu bị ép.
- Mỗi điểm gãy đúng một ranh giới: mọi quy tắc kéo được của Dialog nằm trong `@media (min-width: 640px)`, và JS dùng đúng `useMediaQuery('(min-width: 640px)')`; không bao giờ một cặp 639/640 hay `max-width`.
- **Mockup lock.** Không giá trị token nào có sẵn trong `src/styles/theme/values.ts` đổi. Plan A thêm đúng một token, `--flg-dialog-lift-shadow`, giá trị mockup, có trong bảng `MOCKUP` của `scripts/lib/theme-css.test.ts`. Kbd theo đúng K1, Dialog kéo được theo đúng D2. SearchField và mọi component cũ giữ ảnh giống từng byte.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`).
  - Export mới: `Kbd`, `KbdProps`, `KbdLabels`. Kiểu đổi: `MenuShortcutProps` (union có `keys`), `DialogContentProps` (`movable`).
  - `src/components/kbd/kbd-keys.tsx` là client: bắt đầu bằng `'use client'` và có trong `scripts/check-use-client.ts`. `Kbd.tsx` là server-safe: không `"use client"`, không hook, có hai ca trong `scripts/rsc-probe.mjs`.
  - Class CSS mới có trong `scripts/check-dist-css.ts`: `flg-kbd`, `flg-dialog-header`, `flg-dialog-grip`.
  - Không export từ `src/index.ts`: `shortcut-format.ts`, `KbdKeys`, `usePointerDrag`, `GripIcon`, `useMovable`, `useModalMovable`.
- **`DataGrid` không được export trước Plan G**, và Plan A không có code nào của nó.
- Cặp tương phản mới nằm trong `scripts/lib/contrast.ts` (`kbd-key-text`, `dialog-grip`). Cặp dưới ngưỡng ở theme mặc định là ngoại lệ trong `scripts/contrast-exceptions.ts`, kèm số dòng §4.9 (dòng 37). Bảng §4.9 cùng đoạn sau nó trong spec 0+1, `src/docs/ExceptionTable.test.tsx` và câu trỏ của `src/docs/Accessibility.mdx` đi cùng nhau.
- Cảnh báo dev đi qua `devWarn`; lời cảnh báo không chứa giá trị đổi theo mỗi lần render. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh, dòng văn ngắt ở 100 ký tự.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR từ `feat/phase-6-plan-a`. Nhánh đó cắt từ `37273ea` (`main` `b9bb9ca` cộng hai commit spec), nên PR mang hai commit spec giai đoạn 6, bốn commit của Plan A và file plan.
- **Không có changeset ở Plan A.** Changeset `minor` duy nhất của giai đoạn 6 (`.changeset/phase-6-data-grid.md`, `0.5.0`) là việc của Plan G; `Kbd`, `MenuShortcut keys` và `movable` được phát hành trong đó. Merge PR của Plan A không mở PR "Version Packages". Claude không chạy `changeset version`, `changeset publish` hay `npm publish`, và không bao giờ cầm token npm.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (ở `37273ea`): JS 60417 B, CSS 17797 B.
  - Task 1 và Task 2: `check:package` PASS với ngưỡng cũ; Task 3 không đổi gì của gói (phát hiện 19).
  - Chỉ Task 4 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 62946 B, CSS 18263 B.
- Trước mọi lệnh `pnpm vitest run` chạy thẳng, chạy `pnpm gen:theme`: nó ghi các file trong `src/styles/generated/`, mà story cần (Task 4 thêm một token). Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, và từng project một (`storybook-light` rồi `storybook-dark`: chạy cả hai trong một tiến trình đã làm đứt kết nối tới trình duyệt trên máy này), như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc. Một lần chạy bị giết có thể để lại `chrome-headless-shell` chạy hết CPU: chỉ tắt những tiến trình do chính mình mở.
- **Cổng 5173, 4173, 5174 và 4174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`**: script ghim cổng 5173 và 4173. Plan A không đổi fixture và không chạy chúng; nếu cần chạy, dùng một bản sao tạm của `scripts/test-fixtures.mjs` với cổng đổi sang một cặp rảnh (kiểm trước bằng `netstat -ano | grep LISTENING`; 5179/4179 đã dùng được), rồi xoá bản sao, kể cả khi nó fail. Storybook hay server tĩnh chạy tạm (nếu cần) dùng cổng khác, và không được để chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Plan A (80 ảnh) đến từ workflow "Update visual baselines" sau khi đẩy nhánh. Không ảnh cũ nào được đổi (SearchField, menu, Tooltip, Dialog, Drawer và mọi component khác).
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch, test rồi code; áp theo đúng thứ tự trong plan. Khối test chứa file `*.test.ts(x)`, `*.test-d.ts`, `*.stories.tsx` và helper chỉ story dùng (`.storybook/platform.ts`, Task 1). Khối code chứa mọi file khác, kể cả harness visual (`tests/visual/stories.visual.ts`), loader của probe (`scripts/rsc-client-boundary.mjs`) và các dòng spec.
- Khối code của Task 1, 2 và 4 có dòng bắt đầu bằng ba dấu backtick (khối code trong `Kbd.mdx`, `DropdownMenu.mdx`, `Dialog.mdx`), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Các file nhiều task cùng sửa:
  - Task 1 và 2: spec giai đoạn 6, `src/components/kbd/Kbd.stories.tsx`, `Kbd.mdx`, `src/styles/components/kbd.css`.
  - Task 1 và 4: `scripts/check-dist-css.ts`, `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `src/docs/Accessibility.mdx`.
  - Task 1, 2 và 4: `src/styles/preferences.css`.
  - Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào. `.size-limit.json` không có trong patch nào: Task 4 ghi nó bằng `pnpm size:record`. `src/styles/generated/*.css` không có trong patch nào (git bỏ qua): `pnpm gen:theme` sinh chúng.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng, trừ chỗ ghi rõ là chưa có:

1. **Một `Kbd keys="mod+k"` được render bởi Server Component, rồi hydrate trên Mac.** Server không biết nền tảng: HTML là dạng "nơi khác" ("Ctrl K", không `data-platform`), `Kbd` trả về tham chiếu client `KbdKeys` với `keys`, `labels`, `className` đi qua; hydrate không lỗi và giữ nguyên phần tử của server, rồi đổi sang "⌘K" với `data-platform="apple"`. Một `Kbd` có `children` là markup thuần. Test:
   - Task 1: `check:rsc` (`Kbd with children`, `Kbd with keys hands them to the client component KbdKeys`); `Kbd > server and client agree > renders the form for other systems on the server, and the Apple one after mount`, `renders children the same way everywhere`; story `KbdHydratesToTheApplePlatform` (ba engine: không `onRecoverableError`, phần tử của server được giữ).
   - Task 1: `parseKeys > does not depend on the locale of the page` (server và trình duyệt cho cùng chữ).
   - Chỗ hở đã biết: chữ đổi "Ctrl K" → "⌘K" sau một khung hình (spec §10); chưa fixture nào render `Kbd` từ Server Component thật; loader của probe dựa vào dạng export của tsdown (phát hiện 4, 24).
2. **Một mục menu có `MenuShortcut keys`, được trình đọc màn hình đọc và được trỏ dưới `prefers-contrast: more`.** Tên của mục có cả phím ("Paste Command plus V" trên Mac, "Paste Ctrl plus V" nơi khác), không dính thành "CtrlV"; người dùng muốn tên chỉ là nhãn thì đặt `aria-keyshortcuts` trên `MenuItem` và `aria-hidden` trên shortcut. Ô giữ giao diện khi mục được trỏ; ở contrast-more ô thành viền theo màu chữ của mục (cả mục `danger`) và chữ đạt. Test:
   - Task 2: `MenuShortcut > names the item with its keys, so a screen reader hears them`, `lets the item be named by its label when the shortcut is hidden from assistive technology`, `draws the symbols of a Mac once it has mounted`, `shows the keys and says so when it is given both keys and children`; story `KbdInMenuRowHeight` (ô khoảng 18px, hàng không đổi chiều cao, ba engine).
   - Task 1: `Kbd > with keys > is named by the key names joined with "+", never "CtrlK" or "⌘K"`; story `KbdNamesAButtonOther`, `KbdNamesAButtonApple`.
   - Task 1: `the key of a Kbd (spec phase 6 §4.4) > measures the key on the highlighted item of a menu too`, và contrast-more 6.28 light, 7.63 dark (`measures dark, contrast-more mode: 7.63`).
   - Chỗ hở đã biết: quy tắc contrast-more và forced colors chỉ được kiểm bằng computed style ở Chromium, không có story; NVDA đọc "Ctrl" (phát hiện 7, 11).
3. **Kéo một hộp thoại đang có một ô được focus, rồi nhấn Esc giữa lúc kéo.** Nhấn và kéo header không lấy focus khỏi ô, không chọn chữ của header; Esc đóng hộp thoại như mọi khi (primitive không lấy phím), `data-dragging` mất, và lần thả sau đó không làm gì; panel unmount giữa lúc kéo không để lại listener, khung hình hay capture. Test:
   - Task 4: `DialogContent movable > cancels the press, so that focus and the selection of text stay where they are`, `leaves Esc to close the dialog, and the drag ends with the panel`, `lets go of what it took when the dialog unmounts in the middle of a drag`; story `MovableKeepsTheFocus` (ba engine, chuột thật; bị bắt bởi đột biến bỏ `preventDefault`), `MovableEscClosesInTheMiddleOfADrag` (Esc là phím thật).
   - Task 3: `usePointerDrag > Esc > is left alone with cancelOnEscape false`, `belongs to the input method during a composition`; `a drag in flight at unmount ends quietly and leaves nothing behind`.
   - Chỗ hở đã biết: lần nhấn và lần di của story Esc là sự kiện tổng hợp (phát hiện 16).
4. **Cửa sổ hẹp lại dưới 640px khi hộp thoại đang lệch khỏi giữa.** Panel về giữa ngay, hai biến bị xoá khỏi `style`, một lần kéo đang dở dừng, tay nắm ẩn và lần nhấn không làm gì; rộng lại thì vẫn ở giữa và kéo lại được. Cửa sổ nhỏ lại mà vẫn ≥ 640px thì panel được kẹp lại, còn 16px ở mỗi mép. Test:
   - Task 4: `DialogContent movable > does not drag below 640px, and the panel goes to the middle when the window narrows`, `clamps again when the window or the panel changes size`, `stops the panel 16px from each edge of the frame`, `does not drag where there is no matchMedia, as on the server`; story `MovableCentresBelow640AndStaysThere`, `MovableStaysInsideASmallerWindow`, `MovableStopsAtEveryEdge` (ba engine, cửa sổ thật), story giao diện `DialogMovablePhone`.
   - Chỗ hở đã biết: kẹp dùng cỡ nguyên (lệch tới 0.5px; story cho 1px) (phát hiện 13).
5. **Kéo hộp thoại bằng ngón tay trên máy tính bảng.** Chạm kéo như chuột (≥ 640px), header có `touch-action: none` để trang không cuộn thay; khi trình duyệt lấy con trỏ (`pointercancel`), panel ở yên chỗ đã tới; thả ngoài panel không phải bấm ra ngoài. Test:
   - Task 4: `DialogContent movable > drags with a touch as with a mouse`, `drags with a pen as with a mouse`, `keeps the position when the browser takes the pointer (pointercancel)`, `is not an outside click when the drag is let go on the frame`; story `MovableFollowsATouch`, `MovableLetGoOutsideStaysOpen`.
   - Task 3: `usePointerDrag > Ctrl and the mouse > does not apply to touch on Apple`, `pointercancel after the start is a cancel, and before it is nothing`.
   - Chỗ hở đã biết: chạm trong story là sự kiện tổng hợp; chưa thử trên iPad hay Safari thật, và chưa test nào chứng minh `touch-action: none` giữ trang không cuộn (phát hiện 16, 24).

Các chỗ **chỉ story bắt được**: hình học của Kbd (ô 20px ở `--flg-text-sm`, 16px và cách chữ 6px trong tooltip, khoảng `.05em` trên Apple và `.3em` nơi khác, chữ ẩn "+" không chiếm chỗ, ô khoảng 18px trong menu và hàng không cao thêm); tên tính bởi engine thật (`KbdNamesAButton…`); hydrate từ HTML của server (`KbdHydratesToTheApplePlatform`); mọi điều về vị trí của Dialog với con trỏ thật (kéo, kẹp ở bốn góc, kẹp lại khi cửa sổ nhỏ đi, qua 640px, thả ngoài panel, nút trên header, bấm đúp, focus và vùng chọn chữ, Esc giữa lúc kéo, chạm). jsdom không có layout; unit test của Dialog giả lập hình chữ nhật, `ResizeObserver`, `matchMedia` và khung hình.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/shortcut-format.ts` (và test) | Ngữ pháp và bảng phím của §3.3 (Task 1) |
| `src/components/kbd/Kbd.tsx`, `kbd-keys.tsx`, `index.ts` | `Kbd` (server-safe), `KbdKeys` (client, nội bộ) (Task 1) |
| `src/components/kbd/Kbd.test.tsx`, `Kbd.test-d.ts`, `Kbd.stories.tsx` | Unit test, test kiểu, story (Task 1; story menu ở Task 2) |
| `src/components/kbd/Kbd.mdx` | Trang docs (Task 1; "In a menu" và forced colors của menu ở Task 2) |
| `src/styles/components/kbd.css` | Kbd trong câu chữ, Tooltip, nút đặc (Task 1); trong menu (Task 2) |
| `.storybook/platform.ts` | `onPlatform`, nền tảng của story (Task 1) |
| `src/components/search-field/SearchField.tsx`, `SearchField.mdx` | Gợi ý phím qua bộ định dạng; `KeyHint` (Task 1) |
| `scripts/rsc-client-boundary.mjs`, `scripts/rsc-probe.mjs` | Tham chiếu client của probe; hai ca `Kbd` (Task 1) |
| `src/components/menu/Menu.tsx` (và `Menu.test.tsx`, `Menu.test-d.ts`) | `MenuShortcut keys` (Task 2) |
| `src/components/dropdown-menu/DropdownMenu.mdx` | Mục "Shortcuts" (Task 2) |
| `src/internal/use-pointer-drag.ts` (và test) | `usePointerDrag` (Task 3) |
| `src/internal/icons.tsx` (và test) | `GripIcon` (Task 3) |
| `src/components/dialog/use-movable.ts` | Máy trạng thái của Dialog kéo được (Task 4) |
| `src/components/dialog/modal.tsx`, `Dialog.tsx` | `movable`, `ModalMovableContext`, `DialogHeader` (Task 4) |
| `src/components/dialog/Dialog.test.tsx`, `Dialog.test-d.ts`, `Dialog.stories.tsx`, `Dialog.mdx` | Unit test, test kiểu, story, mục "Movable" (Task 4) |
| `src/styles/components/dialog.css`, `src/styles/theme/values.ts` | D2; token `--flg-dialog-lift-shadow` (Task 4) |
| `tests/visual/stories.visual.ts` | `data-visual-drag` (Task 4) |
| `scripts/lib/contrast.ts` (và test), `scripts/contrast-exceptions.ts` | `kbd-key-text`, dòng 37, nhãn dòng 4 (Task 1); `dialog-grip` (Task 4) |
| `scripts/lib/theme-css.test.ts` | Token mockup `dialog-lift-shadow` (Task 4) |
| `src/index.ts`, `src/index.test.ts` | Export `Kbd` (Task 1) |
| `src/styles/index.css`, `src/styles/preferences.css` | Import `kbd.css` (Task 1); forced colors, contrast-more, giảm chuyển động (Task 1, 2, 4) |
| `scripts/check-dist-css.ts`, `scripts/check-use-client.ts` | Kiểm tra gói (Task 1, 4) |
| `src/docs/ExceptionTable.test.tsx`, spec 0+1 §4.9 | Dòng 37, dòng 4 (Task 1) |
| `src/docs/Accessibility.mdx` | Câu trỏ, mục "Keys" (Task 1); mục "A movable Dialog" (Task 4) |
| `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md` | Các dòng sửa khi lập Plan A (Task 1, 2) |
| `.size-limit.json` | Ngưỡng mới (Task 4) |

---

### Task 1: bộ định dạng phím, `Kbd` (K1), SearchField trên bộ định dạng và dòng 37

Spec §1 (dòng "Phím"; dòng "Tương phản: cần duyệt", phần dòng 37; dòng "Thay đổi ở component cũ", phần SearchField), §2 (dòng A; "Thay đổi ở code cũ", phần `SearchField.tsx`), §3.1 (dòng Kbd, KbdKeys; các ý "Kbd trong Server Component", `check:use-client`, `check:rsc`), §3.3 trọn mục, §3.9 (dòng Kbd), §4.1 (K1), §4.2 (viền của Kbd trên nút đặc), §4.3 **Kbd (K1)** (câu chữ, Tooltip, nút đặc; menu ở Task 2), §4.4 (`kbd-key-text`, dòng 37, dòng 4 mở rộng), §4.5 Kbd, §5 (`shortcut-format.ts`, thay đổi của SearchField, cảnh báo của Kbd), §6.1 (`ref`), §6.3 `Kbd`, `SearchField`, §7 lớp 1–3 cho Kbd và SearchField, "Test kiểu" (`KbdProps`), "Gói phát hành" (`flg-kbd`), story giao diện K1 của Task 1, §8 (`Kbd.mdx`, dòng của trang SearchField, ghi chú Accessibility "Kbd đọc tên ký hiệu"), §10 (dòng "Kbd trên Apple"). Mockup k1 (`phase-6-kbd-dialog.html`). Bắt đầu từ `37273ea`.
- **Bộ định dạng** `src/internal/shortcut-format.ts`: `parseKeys`, `formatKeys`, `shortcutText`, `toAriaKeyShortcuts`, `DEFAULT_KEY_LABELS` (phát hiện 2).
- **`Kbd`** (server-safe) và **`KbdKeys`** (client, nội bộ, vẽ cả `<kbd>` ngoài; nền tảng sau khi mount) (phát hiện 3, 7).
- **CSS:** `kbd.css` (câu chữ, Tooltip luôn cách chữ 6px, nút `primary` và `danger`); forced colors trong `preferences.css` (phát hiện 6).
- **SearchField** lấy chữ gợi ý và `aria-keyshortcuts` từ bộ định dạng; hàm nội bộ `Kbd` đổi tên `KeyHint`; không đổi API, DOM hay CSS (phát hiện 8).
- **Probe RSC:** `scripts/rsc-client-boundary.mjs` và hai ca `Kbd` trong `scripts/rsc-probe.mjs` (phát hiện 4).
- **Tương phản:** check `kbd-key-text`, dòng 37 và nhãn dòng 4 trong `contrast-exceptions.ts`, bảng §4.9 và đoạn sau nó, `ExceptionTable.test.tsx`, câu trỏ của trang Accessibility (phát hiện 9).
- **Story:** bốn story giao diện (`KbdInTextApple`, `KbdInTextOther`, `KbdInTooltipApple`, `KbdInTooltipOther`); `Default`, `OneKey` và tám story hành vi (`KbdBoxHeights`, `KbdDrawsAppleSymbols`, `KbdDrawsWords`, `KbdSeparatorsTakeNoRoom`, `KbdSeparatorsTakeNoRoomApple`, `KbdNamesAButtonOther`, `KbdNamesAButtonApple`, `KbdHydratesToTheApplePlatform`) gắn `no-visual`; helper `.storybook/platform.ts` (phát hiện 5).
- **Docs:** `Kbd.mdx`, một đoạn của `SearchField.mdx`, mục "Keys" của trang Accessibility (phát hiện 18).
- Spec §3.1, §4.3, §6.3, §7 và spec 0+1 §4.9 được sửa (phát hiện 21). Cuối task, `check:package` PASS với ngưỡng cũ (phát hiện 19).

**Files:**
- Create: `src/internal/shortcut-format.ts`, `src/internal/shortcut-format.test.ts`, `src/components/kbd/Kbd.tsx`, `kbd-keys.tsx`, `index.ts`, `Kbd.test.tsx`, `Kbd.test-d.ts`, `Kbd.stories.tsx`, `Kbd.mdx`, `src/styles/components/kbd.css`, `scripts/rsc-client-boundary.mjs`, `.storybook/platform.ts`
- Modify: `src/components/search-field/SearchField.tsx`, `src/components/search-field/SearchField.mdx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `scripts/contrast-exceptions.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/components/kbd/Kbd.tsx` (server-safe), export qua `kbd/index.ts` và `src/index.ts`:
  - `Kbd`: `forwardRef<HTMLElement, KbdProps>`; `ref` là `<kbd>` ngoài. Có `children`: `<kbd {...props} className="flg-kbd …">{children}</kbd>`. Có `keys`: trả `<KbdKeys ref {...props} className keys labels />`.
  - `KbdLabels` (= `KeyLabels` của `shortcut-format.ts`): `{ command, option, control, shift, return, tab, delete, forwardDelete, up, down, left, right, separator: string }`, mặc định "Command", "Option", "Control", "Shift", "Return", "Tab", "Delete", "Forward Delete", "Up Arrow", "Down Arrow", "Left Arrow", "Right Arrow", "+".
  - `KbdProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & ({ keys: string; labels?: Partial<KbdLabels>; children?: never } | { keys?: never; labels?: never; children: ReactNode })`.
- Nội bộ:
  - `src/components/kbd/kbd-keys.tsx` (`'use client'`, không export từ gói): `KbdKeys = forwardRef<HTMLElement, KbdKeysProps>`, `KbdKeysProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> { keys: string; labels?: Partial<KeyLabels> }`. Nền tảng qua `useApplePlatform()` (`=== true`); `labels` qua `withDefaults(DEFAULT_KEY_LABELS, …)`.
  - `src/internal/shortcut-format.ts`: `KeyLabels`, `DEFAULT_KEY_LABELS`; `KeyPart = { kind: 'named'; key: string } | { kind: 'char'; char: string } | { kind: 'unknown'; text: string }`; `ParsedKeys = { parts: KeyPart[]; unknown: string[] }`; `parseKeys(keys: string): ParsedKeys`; `FormattedKey = { glyph: string; name: string | undefined }`; `formatKeys(parts, apple: boolean, labels: KeyLabels): FormattedKey[]`; `shortcutText(parts, apple): string`; `toAriaKeyShortcuts(parts, apple): string`.
  - `SearchField.tsx`: hàm nội bộ `KeyHint` (trước là `Kbd`), kiểu `KeyHintProps`; `DEFAULT_LABELS.shortcut = (shortcut, apple) => shortcutText(parseKeys(shortcut).parts, apple)`; `keyShortcuts(shortcut, apple)` trả `toAriaKeyShortcuts(…)` hay `undefined` khi chưa biết nền tảng của `'mod+k'`.
- DOM (spec §6.3): `<kbd class="flg-kbd">Esc</kbd>`; với `keys`: `<kbd class="flg-kbd" data-platform="apple"?>` > mỗi phím một `<kbd>` (ký hiệu: `<span aria-hidden="true">⌘</span><span class="flg-visually-hidden">Command</span>`; chữ: chữ trần), giữa hai phím `<span class="flg-visually-hidden">+</span>` (`labels.separator`). `data-platform` chỉ có trên Apple sau khi mount, và đặt sau props của người gọi.
- Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `):
  - `<Kbd> takes keys or children, not both; keys is used.`
  - `<Kbd> keys has a part it does not know; it is shown as written.`
- CSS: `.flg-kbd` (có trong `check-dist-css.ts`), `.flg-kbd[data-platform='apple']`, `.flg-kbd > kbd`, `.flg-tooltip .flg-kbd`, `.flg-button:is([data-variant='primary'], [data-variant='danger']) .flg-kbd`; forced colors của `.flg-kbd` và của Kbd trên nút đặc. `kbd.css` import sau `tooltip.css`. `check-use-client.ts` thêm `src/components/kbd/kbd-keys.tsx`.
- Probe: `scripts/rsc-client-boundary.mjs` export hook `load(url, context, nextLoad)`, đăng ký bằng `register('./rsc-client-boundary.mjs', import.meta.url)`; `renderTree(node, clients = new Set())`; một ca nhận thêm `clients: [{ file, exportName }]`, `expect.type: { client: exportName }` và `check(tree)`.
- `scripts/lib/contrast.ts`: `CHECKS` thêm `'kbd-key-text': 4.5`. `scripts/contrast-exceptions.ts`: dòng 37 (`kbd-key-text`, dark, 3.23); nhãn dòng 4.
- Helper của story: `.storybook/platform.ts`: `onPlatform(kind: 'apple' | 'other'): () => () => void`, dùng làm `beforeEach` của story. Story: `Kbd.stories.tsx`, meta `title: 'Components/Kbd'` (id `components-kbd--…`), `args: { keys: 'mod+k' }`; các helper `Head`, `Part`, `CARD`, `TAG`, `PROSE`, `visible`, `find`.
- Consumes: `useApplePlatform` (`platform.ts`), `withDefaults`, `hasContent`, `devWarn`, `clsx`; trong story: `Button`, `Card`, `IconButton`, `SearchField`, `Tooltip`/`TooltipTrigger`/`TooltipContent`, `settled`, `SearchIcon` của `.storybook/icons.tsx`.
- Task sau dùng: Task 2 vẽ `<Kbd keys labels>` trong `MenuShortcut`, thêm quy tắc menu vào `kbd.css` và story menu vào `Kbd.stories.tsx` (dùng lại `Head`, `Part`, `CARD`, `find`); Task 4 thêm `flg-dialog-…` vào `check-dist-css.ts` và `dialog-grip` vào `contrast.ts`. Plan B vẽ bảng phím của `DataGrid.mdx` bằng `Kbd`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/platform.ts b/.storybook/platform.ts
new file mode 100644
index 0000000..914d2b1
--- /dev/null
+++ b/.storybook/platform.ts
@@ -0,0 +1,32 @@
+// The platform a story runs on. A key is drawn as ⌘K on Apple and as Ctrl K elsewhere, and the library
+// asks the browser which it is (`internal/platform.ts`: `navigator.userAgentData.platform`, then
+// `navigator.platform`). The baselines are shot on Linux, but a developer runs the stories on a Mac, so
+// every story that is about a key says which platform it is, whichever machine it runs on.
+/** What a Mac says, in the two places the library asks. */
+const APPLE = { platform: 'MacIntel', userAgentData: { platform: 'macOS' } } as const;
+/** What a Linux machine says; `userAgentData` is `undefined`, as in the engines that have none. */
+const OTHER = { platform: 'Linux x86_64', userAgentData: undefined } as const;
+
+/**
+ * A `beforeEach` for a story: shadows `navigator.platform` and `navigator.userAgentData` on the
+ * `navigator` instance, which a story cannot assign to (the properties are getters of the prototype),
+ * and returns the cleanup that deletes both shadows, so the story that follows starts on the real
+ * platform. Both are shadowed on both sides: an engine that has `userAgentData` would otherwise say
+ * "Linux" through it to a story that asks for a Mac, and the other way round.
+ *
+ * ```ts
+ * beforeEach: onPlatform('apple'),
+ * ```
+ */
+export function onPlatform(kind: 'apple' | 'other'): () => () => void {
+  const shadow = kind === 'apple' ? APPLE : OTHER;
+  return () => {
+    for (const [name, value] of Object.entries(shadow)) {
+      Object.defineProperty(navigator, name, { configurable: true, value });
+    }
+    return () => {
+      for (const name of Object.keys(shadow))
+        delete (navigator as unknown as Record<string, unknown>)[name];
+    };
+  };
+}
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index 666a1ff..d363d67 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -428,3 +428,70 @@ describe('the Table checks (spec phase 4 §4.4)', () => {
     expect(measure(patched, 'light', 'default')['table-hover-badge']).toBeLessThan(1.5);
   });
 });
+
+describe('the key of a Kbd (spec phase 6 §4.4)', () => {
+  const CHECK = 'kbd-key-text';
+
+  it('is a check at 4.5:1', () => {
+    expect(CHECKS[CHECK]).toBe(4.5);
+  });
+
+  // The numbers are the spec's: the lowest of the key on the glass (in a sentence, in a menu), on the
+  // background of a control (a `secondary` Button), on the highlighted item of a menu and in a tooltip.
+  // Under contrast-more a highlighted item has the solid accent and the key takes its text colour.
+  it.each([
+    ['light', 'default', 6.71],
+    ['dark', 'default', 3.23],
+    ['light', 'contrast-more', 6.28],
+    ['dark', 'contrast-more', 7.63],
+  ] as const)('measures %s, %s mode: %s', (theme, mode, expected) => {
+    expect(measure(values, theme, mode)[CHECK]).toBe(expected);
+  });
+
+  it('records the dark key as row 37, and passes in light and in contrast-more', () => {
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
+    ).toEqual([[37, 'dark', 3.23]]);
+  });
+
+  // In dark the key on the highlighted item (3.23) is the lowest of the five, and it is the wash of
+  // that item that decides it: a paler wash lowers the number only if the item is measured.
+  it('measures the key on the highlighted item of a menu too', () => {
+    const patched = {
+      ...values,
+      themes: {
+        ...values.themes,
+        dark: { ...values.themes.dark, 'accent-subtle': 'rgba(255,255,255,1)' },
+      },
+    };
+    expect(measure(patched, 'dark', 'default')[CHECK]).toBeLessThan(3.23);
+  });
+
+  it('measures the key in the tooltip too', () => {
+    const patched = {
+      ...values,
+      themes: {
+        ...values.themes,
+        dark: { ...values.themes.dark, 'glass-tint': 'rgba(255,255,255,1)' },
+      },
+    };
+    expect(measure(patched, 'dark', 'default')[CHECK]).toBeLessThan(3.23);
+  });
+
+  it('is not the key hint of a SearchField, which is measured on its own (row 36)', () => {
+    expect(measure(values, 'dark', 'default')['kbd-text']).toBe(3.31);
+  });
+});
diff --git a/src/components/kbd/Kbd.stories.tsx b/src/components/kbd/Kbd.stories.tsx
new file mode 100644
index 0000000..306e458
--- /dev/null
+++ b/src/components/kbd/Kbd.stories.tsx
@@ -0,0 +1,383 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import type { CSSProperties, ReactNode } from 'react';
+import { hydrateRoot } from 'react-dom/client';
+import type { Root } from 'react-dom/client';
+import { renderToString } from 'react-dom/server';
+import { expect, fn, waitFor } from 'storybook/test';
+import { SearchIcon } from '../../../.storybook/icons';
+import { onPlatform } from '../../../.storybook/platform';
+import { settled } from '../../../.storybook/real-input';
+import { Button } from '../button/Button';
+import { Card } from '../card/Card';
+import { IconButton } from '../icon-button/IconButton';
+import { SearchField } from '../search-field/SearchField';
+import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/Tooltip';
+import { Kbd } from './Kbd';
+
+const meta = {
+  title: 'Components/Kbd',
+  component: Kbd,
+  args: { keys: 'mod+k' },
+} satisfies Meta<typeof Kbd>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** Reads the platform of the reader's own machine, as a page does. */
+export const Default: Story = { tags: ['no-visual'] };
+
+/** One key, as text. */
+export const OneKey: Story = {
+  tags: ['no-visual'],
+  render: () => <Kbd>Esc</Kbd>,
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Looks (mockup K1, option k1 of phase-6-kbd-dialog.html). Each story is the part of the card of the
+// mockup that its name says, on the platform that its name says, so its shot can be put beside
+// `.superpowers/mockups/shots/k1.png`. The baselines are shot on Linux, and a story on "Apple" says so
+// itself (.storybook/platform.ts).
+
+const CARD: CSSProperties = { gap: 12, padding: '14px 16px 16px', minWidth: 300 };
+const HEAD: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 10 };
+const TITLE: CSSProperties = {
+  fontWeight: 'var(--flg-weight-semibold)',
+  fontSize: 'var(--flg-text-md)',
+};
+const TAG: CSSProperties = {
+  color: 'var(--flg-text-muted)',
+  fontSize: 'var(--flg-text-2xs)',
+  fontWeight: 'var(--flg-weight-medium)',
+  letterSpacing: '0.06em',
+  textTransform: 'uppercase',
+};
+const PROSE: CSSProperties = {
+  margin: 0,
+  fontSize: 'var(--flg-text-sm)',
+  lineHeight: 1.6,
+};
+
+/** The head of a card of the mockup: the platform and how its keys are written. */
+function Head({ apple }: { apple: boolean }) {
+  return (
+    <div style={HEAD}>
+      <span style={TITLE}>{apple ? 'macOS, iOS' : 'Windows, Linux'}</span>
+      <span style={TAG}>{apple ? '⌘ ⇧ ⌥ ⌃, no spaces' : 'Ctrl, Shift, Alt as words'}</span>
+    </div>
+  );
+}
+
+/** A caption over a state of the mockup. */
+function Part({ label, children }: { label: string; children: ReactNode }) {
+  return (
+    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
+      <span style={TAG}>{label}</span>
+      {children}
+    </div>
+  );
+}
+
+/** (a), (e) and the SearchField beside them: a key in a sentence and on a solid Button. */
+function InText({ apple }: { apple: boolean }) {
+  return (
+    <Card style={CARD}>
+      <Head apple={apple} />
+      <Part label="In a sentence · text-sm">
+        <p style={PROSE}>
+          Press <Kbd>Esc</Kbd> to close, or <Kbd keys="mod+k" /> to search.
+        </p>
+      </Part>
+      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
+        <Part label="On a primary Button">
+          <div>
+            <Button variant="primary" aria-keyshortcuts={apple ? 'Meta+S' : 'Control+S'}>
+              Save
+              <Kbd keys="mod+s" />
+            </Button>
+          </div>
+        </Part>
+        <Part label="SearchField · approved, unchanged">
+          <SearchField
+            aria-label="Search docs"
+            placeholder="Search…"
+            shortcut="mod+k"
+            style={{ width: 184 }}
+          />
+        </Part>
+      </div>
+    </Card>
+  );
+}
+
+/** (b): the tooltip of an icon button, open, with the key after the words. */
+function InTooltip({ apple }: { apple: boolean }) {
+  return (
+    <Card style={{ ...CARD, minWidth: 260 }}>
+      <Head apple={apple} />
+      <Part label="In a tooltip">
+        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
+          <Tooltip defaultOpen>
+            <TooltipTrigger>
+              <IconButton
+                aria-label="Search"
+                variant="secondary"
+                aria-keyshortcuts={apple ? 'Meta+K' : 'Control+K'}
+              >
+                <SearchIcon width={16} height={16} />
+              </IconButton>
+            </TooltipTrigger>
+            <TooltipContent side="right">
+              Search
+              <Kbd keys="mod+k" />
+            </TooltipContent>
+          </Tooltip>
+        </div>
+      </Part>
+    </Card>
+  );
+}
+
+/** K1 (a) and (e) on a Mac: ⌘ with the symbols close together; the key on the Button is an outline. */
+export const KbdInTextApple: Story = {
+  beforeEach: onPlatform('apple'),
+  render: () => <InText apple />,
+};
+
+/** K1 (a) and (e) on Windows and Linux: Ctrl as a word, set apart from the letter. */
+export const KbdInTextOther: Story = {
+  beforeEach: onPlatform('other'),
+  render: () => <InText apple={false} />,
+};
+
+/** K1 (b) on a Mac. */
+export const KbdInTooltipApple: Story = {
+  beforeEach: onPlatform('apple'),
+  render: () => <InTooltip apple />,
+};
+
+/** K1 (b) on Windows and Linux. */
+export const KbdInTooltipOther: Story = {
+  beforeEach: onPlatform('other'),
+  render: () => <InTooltip apple={false} />,
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it.
+
+/** The keys of a combination as a sighted person reads them: the glyph, or the text of the key. */
+const visible = (outer: Element) =>
+  Array.from(outer.querySelectorAll(':scope > kbd')).map(
+    (cell) => cell.querySelector('[aria-hidden="true"]')?.textContent ?? cell.textContent,
+  );
+
+/** The first element in the page that matches, as an element of its own kind. */
+function find<T extends Element>(root: ParentNode, selector: string): T {
+  const found = root.querySelector<T>(selector);
+  if (!found) throw new Error(`nothing matches ${selector}`);
+  return found;
+}
+
+/** The box a combination is drawn in must be what its visible parts take, with nothing for the "+". */
+function expectNoRoomForSeparators(outer: HTMLElement) {
+  const cells = Array.from(outer.querySelectorAll<HTMLElement>(':scope > kbd'));
+  expect(cells.length).toBeGreaterThan(1);
+  // The separators are there, one between each two keys, and out of the flow.
+  const separators = Array.from(
+    outer.querySelectorAll<HTMLElement>(':scope > .flg-visually-hidden'),
+  );
+  expect(separators).toHaveLength(cells.length - 1);
+  for (const separator of separators) {
+    expect(getComputedStyle(separator).position).toBe('absolute');
+  }
+  const style = getComputedStyle(outer);
+  const sides = ['borderLeftWidth', 'paddingLeft', 'paddingRight', 'borderRightWidth'] as const;
+  const frame = sides.reduce((total, side) => total + Number.parseFloat(style[side]), 0);
+  const gaps = (cells.length - 1) * Number.parseFloat(style.columnGap);
+  const parts = cells.reduce((total, cell) => total + cell.getBoundingClientRect().width, 0);
+  expect(outer.getBoundingClientRect().width).toBeCloseTo(frame + gaps + parts, 0);
+}
+
+/**
+ * The box is 20px high at `--flg-text-sm`, as the key hint of a SearchField, for a combination and
+ * for a single key, and 16px in a tooltip, where it is 6px after the words.
+ */
+export const KbdBoxHeights: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('other'),
+  render: () => (
+    <div>
+      <p style={PROSE} data-testid="sentence">
+        Press <Kbd>Esc</Kbd> to close, or <Kbd keys="mod+shift+f" /> to find.
+      </p>
+      <Tooltip defaultOpen>
+        <TooltipTrigger>
+          <IconButton aria-label="Search" variant="secondary">
+            <SearchIcon width={16} height={16} />
+          </IconButton>
+        </TooltipTrigger>
+        <TooltipContent side="right">
+          Search
+          <Kbd keys="mod+k" />
+        </TooltipContent>
+      </Tooltip>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const sentence = canvas.getByTestId('sentence');
+    for (const box of Array.from(sentence.querySelectorAll<HTMLElement>('.flg-kbd'))) {
+      await expect(box.getBoundingClientRect().height).toBeCloseTo(20, 0);
+    }
+    const tip = await waitFor(() => {
+      const open = document.querySelector<HTMLElement>('.flg-tooltip:popover-open');
+      if (!open) throw new Error('the tooltip is not open');
+      return open;
+    });
+    await settled(tip);
+    const box = find<HTMLElement>(tip, '.flg-kbd');
+    await expect(box.getBoundingClientRect().height).toBeCloseTo(16, 0);
+    // 6px between the end of the words and the cell. A selector cannot see the text node, so the rule
+    // is on the Kbd whatever comes before it; the Range measures the text itself.
+    const words = Array.from(tip.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
+    if (!words) throw new Error('the tooltip has no text');
+    const range = document.createRange();
+    range.selectNodeContents(words);
+    await expect(
+      box.getBoundingClientRect().left - range.getBoundingClientRect().right,
+    ).toBeCloseTo(6, 0);
+  },
+};
+
+/** On a Mac the combination is drawn with symbols, named for a screen reader, and marked as Apple. */
+export const KbdDrawsAppleSymbols: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('apple'),
+  render: () => (
+    <p style={PROSE} data-testid="sentence">
+      <Kbd keys="mod+shift+f" /> and <Kbd keys="mod+k" /> and <Kbd keys="up" />
+    </p>
+  ),
+  play: async ({ canvas }) => {
+    const [combo, search, up] = Array.from(
+      canvas.getByTestId('sentence').querySelectorAll<HTMLElement>(':scope > .flg-kbd'),
+    );
+    for (const box of [combo!, search!, up!]) {
+      await expect(box).toHaveAttribute('data-platform', 'apple');
+    }
+    await expect(visible(combo!)).toEqual(['⌘', '⇧', 'F']);
+    await expect(visible(search!)).toEqual(['⌘', 'K']);
+    await expect(visible(up!)).toEqual(['↑']);
+    await expect(combo!.querySelector('.flg-visually-hidden')?.textContent).toBe('Command');
+    // The gap is the tight one of Apple: .05em of the font of the box.
+    const style = getComputedStyle(combo!);
+    await expect(Number.parseFloat(style.columnGap)).toBeCloseTo(
+      0.05 * Number.parseFloat(style.fontSize),
+      1,
+    );
+  },
+};
+
+/** Elsewhere the same combination is drawn with words, and the gap is wider. */
+export const KbdDrawsWords: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('other'),
+  render: () => (
+    <p style={PROSE} data-testid="sentence">
+      <Kbd keys="mod+shift+f" /> and <Kbd keys="mod+k" /> and <Kbd keys="up" />
+    </p>
+  ),
+  play: async ({ canvas }) => {
+    const [combo, search, up] = Array.from(
+      canvas.getByTestId('sentence').querySelectorAll<HTMLElement>(':scope > .flg-kbd'),
+    );
+    for (const box of [combo!, search!, up!]) {
+      await expect(box).not.toHaveAttribute('data-platform');
+    }
+    await expect(visible(combo!)).toEqual(['Ctrl', 'Shift', 'F']);
+    await expect(visible(search!)).toEqual(['Ctrl', 'K']);
+    // The arrow is a symbol everywhere, and has its name.
+    await expect(visible(up!)).toEqual(['↑']);
+    await expect(up!.querySelector('.flg-visually-hidden')?.textContent).toBe('Up Arrow');
+    const style = getComputedStyle(combo!);
+    await expect(Number.parseFloat(style.columnGap)).toBeCloseTo(
+      0.3 * Number.parseFloat(style.fontSize),
+      1,
+    );
+  },
+};
+
+/** The hidden "+" is not a flex item: the box is what the keys take, and the gaps between them. */
+export const KbdSeparatorsTakeNoRoom: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('other'),
+  render: () => (
+    <p style={PROSE} data-testid="sentence">
+      <Kbd keys="mod+shift+f" />
+    </p>
+  ),
+  play: async ({ canvas }) => {
+    expectNoRoomForSeparators(find<HTMLElement>(canvas.getByTestId('sentence'), '.flg-kbd'));
+  },
+};
+
+/** The same on a Mac, where the gap is the tight one. */
+export const KbdSeparatorsTakeNoRoomApple: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('apple'),
+  render: KbdSeparatorsTakeNoRoom.render,
+  play: KbdSeparatorsTakeNoRoom.play,
+};
+
+/** A button that holds a Kbd is named by the keys joined with the separator: never "CtrlK". */
+export const KbdNamesAButtonOther: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('other'),
+  render: () => (
+    <Button variant="secondary">
+      Search
+      <Kbd keys="mod+k" />
+    </Button>
+  ),
+  play: async ({ canvas }) => {
+    await expect(canvas.getByRole('button', { name: /Search\s*Ctrl\s*\+\s*K/ })).toBeVisible();
+  },
+};
+
+/** On a Mac the symbol is hidden and its name is read: "Command plus K", not "⌘K". */
+export const KbdNamesAButtonApple: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('apple'),
+  render: KbdNamesAButtonOther.render,
+  play: async ({ canvas }) => {
+    await expect(canvas.getByRole('button', { name: /Search\s*Command\s*\+\s*K/ })).toBeVisible();
+  },
+};
+
+/**
+ * The HTML a server makes has no platform, so it is the form for other systems; once the page has
+ * hydrated it, a Mac gets its symbols, without a hydration error.
+ */
+export const KbdHydratesToTheApplePlatform: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('apple'),
+  render: () => <div data-testid="host" />,
+  play: async ({ canvas }) => {
+    const host = canvas.getByTestId('host');
+    const server = renderToString(<Kbd keys="mod+k" />);
+    host.innerHTML = server;
+    const outer = find<HTMLElement>(host, '.flg-kbd');
+    await expect(outer).not.toHaveAttribute('data-platform');
+    await expect(visible(outer)).toEqual(['Ctrl', 'K']);
+    const recoverable = fn();
+    let root: Root | undefined;
+    try {
+      root = hydrateRoot(host, <Kbd keys="mod+k" />, { onRecoverableError: recoverable });
+      await waitFor(() => expect(outer).toHaveAttribute('data-platform', 'apple'));
+      await expect(visible(outer)).toEqual(['⌘', 'K']);
+      // The element the server made is the one that was kept.
+      await expect(find(host, '.flg-kbd')).toBe(outer);
+      await expect(recoverable).not.toHaveBeenCalled();
+    } finally {
+      root?.unmount();
+    }
+  },
+};
diff --git a/src/components/kbd/Kbd.test-d.ts b/src/components/kbd/Kbd.test-d.ts
new file mode 100644
index 0000000..77c955b
--- /dev/null
+++ b/src/components/kbd/Kbd.test-d.ts
@@ -0,0 +1,33 @@
+import { expectTypeOf, test } from 'vitest';
+import type { KbdLabels, KbdProps } from './Kbd';
+
+test('Kbd takes keys or children, not both, and not neither', () => {
+  const withKeys: KbdProps = { keys: 'mod+k' };
+  const withChildren: KbdProps = { children: 'Esc' };
+  // @ts-expect-error keys and children together
+  const both: KbdProps = { keys: 'mod+k', children: 'Esc' };
+  // @ts-expect-error neither
+  const neither: KbdProps = {};
+  // @ts-expect-error labels belong to keys
+  const labelsAlone: KbdProps = { children: 'Esc', labels: { command: 'Befehl' } };
+  expectTypeOf(withKeys).toBeObject();
+  expectTypeOf(withChildren).toBeObject();
+  expectTypeOf(both).toBeObject();
+  expectTypeOf(neither).toBeObject();
+  expectTypeOf(labelsAlone).toBeObject();
+});
+
+test('keys is a string and labels is a partial of the names of the symbols', () => {
+  const labels: KbdProps = { keys: 'mod+k', labels: { command: 'Befehl', separator: ' plus ' } };
+  // @ts-expect-error the key of a label must exist
+  const unknown: KbdProps = { keys: 'mod+k', labels: { meta: 'Befehl' } };
+  expectTypeOf(labels).toBeObject();
+  expectTypeOf(unknown).toBeObject();
+  expectTypeOf<KbdLabels['command']>().toBeString();
+  expectTypeOf<KbdLabels['separator']>().toBeString();
+});
+
+test('the other props are those of an HTML element', () => {
+  const props: KbdProps = { keys: 'mod+k', className: 'mine', title: 'Search', onClick: () => {} };
+  expectTypeOf(props).toBeObject();
+});
diff --git a/src/components/kbd/Kbd.test.tsx b/src/components/kbd/Kbd.test.tsx
new file mode 100644
index 0000000..27ee27a
--- /dev/null
+++ b/src/components/kbd/Kbd.test.tsx
@@ -0,0 +1,261 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import { createRef } from 'react';
+import { hydrateRoot } from 'react-dom/client';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
+import { Kbd } from './Kbd';
+
+const UNKNOWN_PART =
+  WARN_PREFIX + ' <Kbd> keys has a part it does not know; it is shown as written.';
+const BOTH = WARN_PREFIX + ' <Kbd> takes keys or children, not both; keys is used.';
+
+/** Pretends to run on a system whose `navigator.platform` is `name`. */
+function platform(name: string) {
+  vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue(name);
+}
+
+/** The cells of a combination: the `<kbd>` inside the outer one. */
+const cells = (outer: Element) => Array.from(outer.querySelectorAll(':scope > kbd'));
+/** What a sighted user reads: the text that is not hidden from them. */
+const seen = (cell: Element) =>
+  Array.from(cell.childNodes)
+    .filter(
+      (node) =>
+        node.nodeType === Node.TEXT_NODE ||
+        !(node as Element).classList.contains('flg-visually-hidden'),
+    )
+    .map((node) => node.textContent)
+    .join('');
+
+describe('Kbd', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => {
+    vi.restoreAllMocks();
+    document.body.innerHTML = '';
+  });
+
+  describe('with children', () => {
+    it('is a plain kbd with the class of the library', () => {
+      render(<Kbd>Esc</Kbd>);
+      const kbd = screen.getByText('Esc');
+      expect(kbd.tagName).toBe('KBD');
+      expect(kbd).toHaveClass('flg-kbd');
+      expect(kbd).not.toHaveAttribute('data-platform');
+    });
+
+    it('keeps what the caller gives, merges the class and points ref at the kbd', () => {
+      const ref = createRef<HTMLElement>();
+      const onClick = vi.fn();
+      render(
+        <Kbd ref={ref} className="mine" title="Escape" style={{ color: 'red' }} onClick={onClick}>
+          Esc
+        </Kbd>,
+      );
+      const kbd = screen.getByText('Esc');
+      expect(ref.current).toBe(kbd);
+      expect(kbd).toHaveClass('flg-kbd', 'mine');
+      expect(kbd).toHaveAttribute('title', 'Escape');
+      expect(kbd).toHaveStyle({ color: 'rgb(255, 0, 0)' });
+      fireEvent.click(kbd);
+      expect(onClick).toHaveBeenCalledTimes(1);
+    });
+  });
+
+  describe('with keys', () => {
+    it('draws a cell for each key inside the outer kbd, with a hidden "+" between them', () => {
+      platform('Win32');
+      const ref = createRef<HTMLElement>();
+      const { container } = render(<Kbd ref={ref} keys="mod+shift+f" />);
+      const outer = container.firstElementChild!;
+      expect(outer).toBe(ref.current);
+      expect(outer.tagName).toBe('KBD');
+      expect(outer).toHaveClass('flg-kbd');
+      expect(outer).not.toHaveAttribute('data-platform');
+      expect(cells(outer).map((cell) => cell.textContent)).toEqual(['Ctrl', 'Shift', 'F']);
+      const separators = Array.from(outer.querySelectorAll(':scope > .flg-visually-hidden'));
+      expect(separators.map((separator) => separator.textContent)).toEqual(['+', '+']);
+      // The order of the nodes: key, "+", key, "+", key.
+      expect(Array.from(outer.children).map((child) => child.tagName)).toEqual([
+        'KBD',
+        'SPAN',
+        'KBD',
+        'SPAN',
+        'KBD',
+      ]);
+    });
+
+    it('draws the symbols of Apple with a hidden name each, and marks the outer kbd', () => {
+      platform('MacIntel');
+      const { container } = render(<Kbd keys="mod+shift+f" />);
+      const outer = container.firstElementChild!;
+      expect(outer).toHaveAttribute('data-platform', 'apple');
+      const [command, shift, f] = cells(outer);
+      expect(seen(command!)).toBe('⌘');
+      expect(command!.querySelector('[aria-hidden="true"]')?.textContent).toBe('⌘');
+      expect(command!.querySelector('.flg-visually-hidden')?.textContent).toBe('Command');
+      expect(seen(shift!)).toBe('⇧');
+      expect(shift!.querySelector('.flg-visually-hidden')?.textContent).toBe('Shift');
+      // A letter is read as it is: no hidden name.
+      expect(f!.innerHTML).toBe('F');
+    });
+
+    it('keeps the order of the writer', () => {
+      platform('MacIntel');
+      const { container } = render(<Kbd keys="shift+mod+f" />);
+      expect(cells(container.firstElementChild!).map(seen)).toEqual(['⇧', '⌘', 'F']);
+    });
+
+    it.each(['Up Arrow', 'Down Arrow'])('names an arrow on both platforms: %s', (name) => {
+      const keys = name === 'Up Arrow' ? 'up' : 'down';
+      for (const system of ['Win32', 'MacIntel']) {
+        platform(system);
+        const { container, unmount } = render(<Kbd keys={keys} />);
+        expect(container.querySelector('.flg-visually-hidden')?.textContent).toBe(name);
+        unmount();
+      }
+    });
+
+    it('takes the names and the separator from labels, and a label left undefined keeps its default', () => {
+      platform('MacIntel');
+      const { container } = render(
+        <Kbd keys="mod+k" labels={{ command: 'Befehl', separator: ' plus ', shift: undefined }} />,
+      );
+      const outer = container.firstElementChild!;
+      expect(outer.querySelector('.flg-visually-hidden')?.textContent).toBe('Befehl');
+      expect(outer.querySelectorAll(':scope > .flg-visually-hidden')[0]?.textContent).toBe(
+        ' plus ',
+      );
+    });
+
+    it('keeps the class, the title, the style, the handlers and the aria of the caller', () => {
+      const onClick = vi.fn();
+      const { container } = render(
+        <Kbd
+          keys="mod+k"
+          className="mine"
+          title="Search"
+          style={{ color: 'red' }}
+          aria-hidden="true"
+          data-testid="k"
+          onClick={onClick}
+        />,
+      );
+      const outer = container.firstElementChild!;
+      expect(outer).toHaveClass('flg-kbd', 'mine');
+      expect(outer).toHaveAttribute('title', 'Search');
+      expect(outer).toHaveAttribute('aria-hidden', 'true');
+      expect(outer).toHaveAttribute('data-testid', 'k');
+      expect(outer).toHaveStyle({ color: 'rgb(255, 0, 0)' });
+      fireEvent.click(outer);
+      expect(onClick).toHaveBeenCalledTimes(1);
+    });
+
+    it('follows `keys` when it changes on the mounted element, and a switch to children', () => {
+      platform('Win32');
+      const { container, rerender } = render(<Kbd keys="mod+k" />);
+      const outer = container.firstElementChild!;
+      expect(cells(outer).map(seen)).toEqual(['Ctrl', 'K']);
+      rerender(<Kbd keys="alt+j" />);
+      expect(container.firstElementChild).toBe(outer);
+      expect(cells(outer).map(seen)).toEqual(['Alt', 'J']);
+      rerender(<Kbd>Esc</Kbd>);
+      expect(container.firstElementChild).toHaveTextContent('Esc');
+      expect(container.querySelectorAll('kbd')).toHaveLength(1);
+    });
+
+    it('is named by the key names joined with "+", never "CtrlK" or "⌘K"', () => {
+      platform('Win32');
+      const { unmount } = render(
+        <button type="button">
+          Save <Kbd keys="mod+k" />
+        </button>,
+      );
+      const name = screen.getByRole('button').textContent;
+      expect(screen.getByRole('button', { name: /Ctrl\s*\+\s*K/ })).toBeInTheDocument();
+      expect(name).not.toMatch(/CtrlK/);
+      unmount();
+      platform('MacIntel');
+      render(
+        <button type="button">
+          Save <Kbd keys="mod+k" />
+        </button>,
+      );
+      // The symbol is hidden and its name read.
+      expect(screen.getByRole('button', { name: /Command\s*\+\s*K/ })).toBeInTheDocument();
+      expect(screen.queryByRole('button', { name: /⌘/ })).toBeNull();
+    });
+
+    it('draws a part it does not know as written, and says so once', () => {
+      platform('Win32');
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { container, rerender } = render(<Kbd keys="mod+foo" />);
+      expect(cells(container.firstElementChild!).map(seen)).toEqual(['Ctrl', 'foo']);
+      expect(warn).toHaveBeenCalledWith(UNKNOWN_PART);
+      rerender(<Kbd keys="mod+bar" />);
+      expect(warn).toHaveBeenCalledTimes(1);
+    });
+
+    it('says an empty part is wrong and draws nothing for it', () => {
+      platform('Win32');
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { container } = render(<Kbd keys="mod++" />);
+      expect(cells(container.firstElementChild!).map(seen)).toEqual(['Ctrl']);
+      expect(warn).toHaveBeenCalledWith(UNKNOWN_PART);
+    });
+
+    it('does not warn for a combination it knows', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Kbd keys="mod+shift+f" />);
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('takes keys when it is given both, and says so', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      platform('Win32');
+      const { container } = render(
+        // @ts-expect-error `keys` and `children` are not allowed together
+        <Kbd keys="mod+k">Esc</Kbd>,
+      );
+      expect(cells(container.firstElementChild!).map(seen)).toEqual(['Ctrl', 'K']);
+      expect(container).not.toHaveTextContent('Esc');
+      expect(warn).toHaveBeenCalledWith(BOTH);
+    });
+
+    it('does not warn for keys with children that render nothing', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(
+        // @ts-expect-error `keys` and `children` are not allowed together
+        <Kbd keys="mod+k">{false}</Kbd>,
+      );
+      expect(warn).not.toHaveBeenCalledWith(BOTH);
+    });
+  });
+
+  describe('server and client agree', () => {
+    it('renders the form for other systems on the server, and the Apple one after mount', async () => {
+      platform('MacIntel');
+      const recoverable = vi.fn();
+      const html = renderToString(<Kbd keys="mod+k" />);
+      const host = document.createElement('div');
+      host.innerHTML = html;
+      document.body.append(host);
+      expect(host.firstElementChild).not.toHaveAttribute('data-platform');
+      expect(cells(host.firstElementChild!).map(seen)).toEqual(['Ctrl', 'K']);
+      // After the server render: React 18 warns about a layout effect there, which is the test's jsdom.
+      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
+      await act(async () => {
+        hydrateRoot(host, <Kbd keys="mod+k" />, { onRecoverableError: recoverable });
+      });
+      expect(recoverable).not.toHaveBeenCalled();
+      expect(error).not.toHaveBeenCalled();
+      expect(host.firstElementChild).toHaveAttribute('data-platform', 'apple');
+      expect(cells(host.firstElementChild!).map(seen)).toEqual(['⌘', 'K']);
+    });
+
+    it('renders children the same way everywhere', () => {
+      platform('MacIntel');
+      expect(renderToString(<Kbd>Esc</Kbd>)).toBe('<kbd class="flg-kbd">Esc</kbd>');
+    });
+  });
+});
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 37de242..83442c7 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the thirty-six rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the thirty-seven rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(36);
+    expect(rows).toHaveLength(37);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -54,6 +54,7 @@ describe('ExceptionTable', () => {
       '34',
       '35',
       '36',
+      '37',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -104,6 +105,8 @@ describe('ExceptionTable', () => {
     expect(cells(rows[34]!).slice(1, 3)).toEqual(['2.52:1', '2.03:1']);
     // The key hint of a SearchField (spec phase 5 §4.4): enough in light, 3.31:1 in dark.
     expect(cells(rows[35]!).slice(1, 3)).toEqual(['meets AA (7.15:1)', '3.31:1']);
+    // The key of a Kbd (spec phase 6 §4.4): five places, and the highlighted item of a menu is the lowest.
+    expect(cells(rows[36]!).slice(1, 3)).toEqual(['meets AA (6.71:1)', '3.23:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -152,6 +155,7 @@ describe('ExceptionTable', () => {
       '1.4.3',
       '1.4.11',
       '1.4.3',
+      '1.4.3',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/index.test.ts b/src/index.test.ts
index 5adb08b..1d1b3ab 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -66,6 +66,7 @@ describe('public API', () => {
       'IconButton',
       'Indicator',
       'Input',
+      'Kbd',
       'List',
       'ListItem',
       'MenuCheckboxItem',
diff --git a/src/internal/shortcut-format.test.ts b/src/internal/shortcut-format.test.ts
new file mode 100644
index 0000000..83406b9
--- /dev/null
+++ b/src/internal/shortcut-format.test.ts
@@ -0,0 +1,206 @@
+import { describe, expect, it } from 'vitest';
+import {
+  DEFAULT_KEY_LABELS,
+  formatKeys,
+  parseKeys,
+  shortcutText,
+  toAriaKeyShortcuts,
+} from './shortcut-format';
+import type { KeyLabels } from './shortcut-format';
+
+/** One part, formatted for a platform: its glyph and its hidden name. */
+const one = (key: string, apple: boolean) =>
+  formatKeys(parseKeys(key).parts, apple, DEFAULT_KEY_LABELS)[0]!;
+
+describe('parseKeys', () => {
+  it('splits on "+", trims each part and ignores case', () => {
+    const { parts, unknown } = parseKeys(' Mod + SHIFT+f ');
+    expect(parts).toEqual([
+      { kind: 'named', key: 'mod' },
+      { kind: 'named', key: 'shift' },
+      { kind: 'char', char: 'F' },
+    ]);
+    expect(unknown).toEqual([]);
+  });
+
+  it('keeps the order the writer gave', () => {
+    const order = (keys: string) => shortcutText(parseKeys(keys).parts, true);
+    expect(order('mod+shift+f')).toBe('⌘⇧F');
+    expect(order('shift+mod+f')).toBe('⇧⌘F');
+  });
+
+  it('upper-cases a one-character part only when that gives one character back', () => {
+    const chars = (keys: string) =>
+      parseKeys(keys).parts.map((part) => (part.kind === 'char' ? part.char : part.kind));
+    expect(chars('k')).toEqual(['K']);
+    expect(chars('/')).toEqual(['/']);
+    expect(chars(',')).toEqual([',']);
+    expect(chars('[')).toEqual(['[']);
+    // 'ß'.toUpperCase() is 'SS': the part stays as it was.
+    expect(chars('ß')).toEqual(['ß']);
+    // One code point is one character, even where it is two UTF-16 units.
+    expect(chars('𝑥')).toEqual(['𝑥']);
+    expect(parseKeys('ß').unknown).toEqual([]);
+  });
+
+  it('does not depend on the locale of the page', () => {
+    // A Turkish locale would turn "i" into "İ"; the key is "I" everywhere.
+    const original = String.prototype.toLocaleUpperCase;
+    String.prototype.toLocaleUpperCase = () => 'İ';
+    try {
+      expect(shortcutText(parseKeys('mod+i').parts, false)).toBe('Ctrl I');
+    } finally {
+      String.prototype.toLocaleUpperCase = original;
+    }
+  });
+
+  it('returns a part it does not know as written, and says so', () => {
+    const { parts, unknown } = parseKeys('mod+Foo');
+    expect(parts).toEqual([
+      { kind: 'named', key: 'mod' },
+      { kind: 'unknown', text: 'Foo' },
+    ]);
+    expect(unknown).toEqual(['Foo']);
+  });
+
+  it('reports an empty part and draws nothing for it', () => {
+    const { parts, unknown } = parseKeys('mod++');
+    expect(parts).toEqual([{ kind: 'named', key: 'mod' }]);
+    expect(unknown).toEqual(['', '']);
+    expect(parseKeys('').parts).toEqual([]);
+    expect(parseKeys('').unknown).toEqual(['']);
+    expect(parseKeys(' + ').unknown).toEqual(['', '']);
+  });
+
+  it('writes "+" as plus', () => {
+    expect(parseKeys('mod+plus').parts).toEqual([
+      { kind: 'named', key: 'mod' },
+      { kind: 'named', key: 'plus' },
+    ]);
+  });
+
+  it('knows escape as esc, and a function key from f1 to f12 only', () => {
+    expect(one('escape', false).glyph).toBe('Esc');
+    expect(one('f1', false).glyph).toBe('F1');
+    expect(one('f12', false).glyph).toBe('F12');
+    expect(parseKeys('f13').unknown).toEqual(['f13']);
+    expect(parseKeys('f0').unknown).toEqual(['f0']);
+  });
+});
+
+describe('formatKeys: every row of the table of spec §3.3', () => {
+  // [key, apple glyph, apple name, other glyph, other name, aria-keyshortcuts (apple / other)]
+  const rows: Array<[string, string, string?, string?, string?, string?, string?]> = [
+    ['mod', '⌘', 'Command', 'Ctrl', undefined, 'Meta', 'Control'],
+    ['ctrl', '⌃', 'Control', 'Ctrl', undefined, 'Control', 'Control'],
+    ['alt', '⌥', 'Option', 'Alt', undefined, 'Alt', 'Alt'],
+    ['shift', '⇧', 'Shift', 'Shift', undefined, 'Shift', 'Shift'],
+    ['enter', '↩', 'Return', 'Enter', undefined, 'Enter', 'Enter'],
+    ['esc', 'Esc', undefined, 'Esc', undefined, 'Escape', 'Escape'],
+    ['escape', 'Esc', undefined, 'Esc', undefined, 'Escape', 'Escape'],
+    ['tab', '⇥', 'Tab', 'Tab', undefined, 'Tab', 'Tab'],
+    ['backspace', '⌫', 'Delete', 'Backspace', undefined, 'Backspace', 'Backspace'],
+    ['delete', '⌦', 'Forward Delete', 'Del', undefined, 'Delete', 'Delete'],
+    ['up', '↑', 'Up Arrow', '↑', 'Up Arrow', 'ArrowUp', 'ArrowUp'],
+    ['down', '↓', 'Down Arrow', '↓', 'Down Arrow', 'ArrowDown', 'ArrowDown'],
+    ['left', '←', 'Left Arrow', '←', 'Left Arrow', 'ArrowLeft', 'ArrowLeft'],
+    ['right', '→', 'Right Arrow', '→', 'Right Arrow', 'ArrowRight', 'ArrowRight'],
+    ['space', 'Space', undefined, 'Space', undefined, 'Space', 'Space'],
+    ['home', 'Home', undefined, 'Home', undefined, 'Home', 'Home'],
+    ['end', 'End', undefined, 'End', undefined, 'End', 'End'],
+    ['pageup', 'Page Up', undefined, 'Page Up', undefined, 'PageUp', 'PageUp'],
+    ['pagedown', 'Page Down', undefined, 'Page Down', undefined, 'PageDown', 'PageDown'],
+    ['f1', 'F1', undefined, 'F1', undefined, 'F1', 'F1'],
+    ['f12', 'F12', undefined, 'F12', undefined, 'F12', 'F12'],
+    ['plus', '+', undefined, '+', undefined, 'Plus', 'Plus'],
+    ['k', 'K', undefined, 'K', undefined, 'K', 'K'],
+    ['/', '/', undefined, '/', undefined, '/', '/'],
+  ];
+
+  it.each(rows)('%s', (key, appleGlyph, appleName, otherGlyph, otherName, ariaApple, ariaOther) => {
+    expect(one(key, true)).toEqual({ glyph: appleGlyph, name: appleName });
+    expect(one(key, false)).toEqual({ glyph: otherGlyph, name: otherName });
+    const { parts } = parseKeys(key);
+    expect(toAriaKeyShortcuts(parts, true)).toBe(ariaApple);
+    expect(toAriaKeyShortcuts(parts, false)).toBe(ariaOther);
+  });
+
+  it('draws an unknown part as written, with no name', () => {
+    expect(one('foo', true)).toEqual({ glyph: 'foo', name: undefined });
+    expect(one('Foo', false)).toEqual({ glyph: 'Foo', name: undefined });
+  });
+
+  it('takes the names of the symbols from the labels, and only those', () => {
+    const labels: KeyLabels = {
+      ...DEFAULT_KEY_LABELS,
+      command: 'Befehl',
+      option: 'Wahl',
+      up: 'Pfeil nach oben',
+    };
+    const format = (keys: string, apple: boolean) =>
+      formatKeys(parseKeys(keys).parts, apple, labels).map((key) => key.name);
+    expect(format('mod+alt+up', true)).toEqual(['Befehl', 'Wahl', 'Pfeil nach oben']);
+    // Elsewhere "Ctrl" and "Alt" are words and are read as written; the arrow keeps its name.
+    expect(format('mod+alt+up', false)).toEqual([undefined, undefined, 'Pfeil nach oben']);
+  });
+});
+
+describe('shortcutText', () => {
+  it('is the flat text of the hint: "⌘K" on Apple, "Ctrl K" elsewhere', () => {
+    const { parts } = parseKeys('mod+k');
+    expect(shortcutText(parts, true)).toBe('⌘K');
+    expect(shortcutText(parts, false)).toBe('Ctrl K');
+  });
+
+  it('joins several keys', () => {
+    const { parts } = parseKeys('mod+shift+f');
+    expect(shortcutText(parts, true)).toBe('⌘⇧F');
+    expect(shortcutText(parts, false)).toBe('Ctrl Shift F');
+  });
+
+  it('puts a space around a word on Apple, so "Page Up" does not run into the symbol', () => {
+    expect(shortcutText(parseKeys('mod+pageup').parts, true)).toBe('⌘ Page Up');
+    expect(shortcutText(parseKeys('esc').parts, true)).toBe('Esc');
+  });
+
+  it('reads "/" as it is', () => {
+    expect(shortcutText(parseKeys('/').parts, true)).toBe('/');
+    expect(shortcutText(parseKeys('/').parts, false)).toBe('/');
+  });
+
+  it('is empty without parts', () => {
+    expect(shortcutText([], true)).toBe('');
+  });
+});
+
+describe('toAriaKeyShortcuts', () => {
+  it('joins the names with "+", in the order given', () => {
+    const { parts } = parseKeys('mod+shift+f');
+    expect(toAriaKeyShortcuts(parts, true)).toBe('Meta+Shift+F');
+    expect(toAriaKeyShortcuts(parts, false)).toBe('Control+Shift+F');
+  });
+
+  it('keeps an unknown part as written', () => {
+    expect(toAriaKeyShortcuts(parseKeys('mod+foo').parts, false)).toBe('Control+foo');
+  });
+});
+
+describe('DEFAULT_KEY_LABELS', () => {
+  it('has the English names of spec §6.3', () => {
+    expect(DEFAULT_KEY_LABELS).toEqual({
+      command: 'Command',
+      option: 'Option',
+      control: 'Control',
+      shift: 'Shift',
+      return: 'Return',
+      tab: 'Tab',
+      delete: 'Delete',
+      forwardDelete: 'Forward Delete',
+      up: 'Up Arrow',
+      down: 'Down Arrow',
+      left: 'Left Arrow',
+      right: 'Right Arrow',
+      separator: '+',
+    });
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/shortcut-format.test.ts src/components/kbd src/index.test.ts src/docs
pnpm vitest run --project scripts scripts/lib/contrast.test.ts
```

Expected: FAIL.
- `shortcut-format.test.ts` (project `unit`) và `Kbd.test.tsx` (cả hai project React) không nạp được (`Failed to resolve import "./shortcut-format" from "src/internal/shortcut-format.test.ts". Does the file exist?`, và tương tự cho `./Kbd`), nên không test nào của chúng chạy. `Kbd.test-d.ts` báo lỗi kiểu vì module chưa có.
- `public API > exports exactly the documented components and nothing internal`: danh sách export nhận được thiếu `Kbd`.
- `ExceptionTable.test.tsx`: `lists the thirty-seven rows of spec §4.9 with light and dark measurements` fail (bảng dựng từ `contrast-exceptions.ts` còn 36 dòng), và `names the WCAG criterion and minimum of every row` fail (thiếu tiêu chí của dòng 37).
- `contrast.test.ts`: tám test của `the key of a Kbd (spec phase 6 §4.4)` fail, ví dụ `is a check at 4.5:1` với `expected undefined to be 4.5`. `is not the key hint of a SearchField, which is measured on its own (row 36)` pass: `kbd-text` có từ giai đoạn 5, nên đây là đặc tả.

Story không chạy ở bước này: `Kbd.stories.tsx` import `Kbd`, chưa có. `.storybook/platform.ts` chỉ story dùng. Test của SearchField không có trong patch: chúng là đặc tả cho lần tái cấu trúc ở Step 3, và chạy ở Step 4.

Theo báo cáo của bản nháp (phát hiện 20):
- `shortcut-format.test.ts`, `Kbd.test.tsx`, `Kbd.test-d.ts`, test của `contrast.ts`, `ExceptionTable.test.tsx` và test export được viết trước và fail như trên.
- Story của Kbd viết cùng code. Bỏ import `kbd.css` thì 15 trong 42 lần chạy fail (`KbdBoxHeights`, `KbdDrawsAppleSymbols`, `KbdDrawsWords`, `KbdSeparatorsTakeNoRoom`, `KbdSeparatorsTakeNoRoomApple`); `KbdNamesAButtonOther`, `KbdNamesAButtonApple` và `KbdHydratesToTheApplePlatform` pass không cần CSS, vì chúng kiểm tên và hydrate. Phép đo 6px giữa chữ và Kbd trong tooltip (lần trả lại) fail trước ở ba engine, nhận 0 (phát hiện 6).
- **Test và story có sẵn của SearchField không fail trước được** (đặc tả); bốn story giao diện không có test, chúng được so với `k1.png` bằng mắt.

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 85b545c..91e8a2e 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -315,7 +315,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
 | 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và liên kết của AppShellBrand cùng skip link của AppShell, và mục cùng nút nhóm của Nav, và nút xoá của SearchField, và nút của UserMenu | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
-| 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
+| 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn; phím `Kbd` trên nút primary (giai đoạn 6, cùng chữ trắng) | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
 | 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer; ở Nav: tiêu đề mục, tiêu đề flyout của nhóm ở rail và số đếm trần của `bar`; ở UserMenu: dòng phụ ở đầu menu; ở bảng thông báo (công thức): thời gian của thông báo | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List, chữ và icon của mục đang chọn Nav `pill` | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
@@ -348,6 +348,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 34 | Chữ của Badge trên hàng đã chọn của Table (`--flg-accent-subtle`) | 2.97:1 `accent` (trạng thái 3.91:1) | 3.27:1 `accent` (trạng thái 3.98:1) | 4.5:1 | 1.4.3 |
 | 35 | Vạch 3px `--flg-accent-solid` của mục đang chọn, Nav `bar` (N2), trên nền nhuộm 18% `--flg-accent-solid` của mục | 2.52:1 | 2.03:1 | 3:1 | 1.4.11 |
 | 36 | Chữ `--flg-text-muted` của phím gợi ý (`⌘K`) trên nền `--flg-control-bg-secondary`: trong ô SearchField, trong tooltip của SearchField thu gọn | đạt (7.15:1) | 3.31:1 (ô), 3.76:1 (tooltip) | 4.5:1 | 1.4.3 |
+| 37 | Chữ `--flg-text-muted` của `Kbd` trên nền `--flg-control-bg-secondary`: trong câu chữ, trong menu, trên mục menu đang được trỏ, trên nút `secondary`, trong tooltip | đạt (6.71:1) | 3.23:1 | 4.5:1 | 1.4.3 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
@@ -371,7 +372,9 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 36 là chữ của phím gợi ý (`⌘K`) trong ô SearchField theo mockup H2 và H3 (giai đoạn 5, Plan C): `--flg-text-muted` trên nền `--flg-control-bg-secondary` của phím, nằm trên nền ô (`--flg-control-bg`) hoặc trên kính của tooltip của nút thu gọn. Ở dark là 3.31:1 trong ô và 3.76:1 trong tooltip, nên ghi 3.31:1 (số thấp hơn); light đạt cả hai (7.15:1). Phím gợi ý là chữ phụ ẩn khỏi công nghệ hỗ trợ (`aria-hidden`), và phím tắt được nói qua `aria-keyshortcuts` trên ô và trên nút thu gọn, nên không có thông tin nào chỉ nằm ở chữ đó; hai điều này không miễn tiêu chí, chỉ là bối cảnh khi duyệt. Ở `prefers-contrast: more` đạt (7.83:1 light, 7.63:1 dark).
 
-Cả ba mươi sáu điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Điểm 37 là chữ của `Kbd` theo mockup K1 (giai đoạn 6, Plan A): cùng nền `--flg-control-bg-secondary` và chữ `--flg-text-muted` như phím gợi ý của điểm 36, nhưng ở nhiều chỗ hơn, nên số là thấp nhất của năm chỗ. Ở dark là 3.64:1 trên kính (câu chữ, menu), 3.31:1 trên nút `secondary` (nền `--flg-control-bg`), 3.76:1 trong tooltip và 3.23:1 trên mục menu đang được trỏ (`--flg-highlight-bg`, vì ô giữ nguyên ở đó); light đạt cả năm (6.71:1). Phím tắt của `Kbd` còn được nói bằng chữ ẩn ("Command plus K", "Control plus K"), và nút có phím tắt thật đặt `aria-keyshortcuts`; đó là bối cảnh khi duyệt, không miễn tiêu chí. `Kbd` trên nút `primary` và `danger` mang màu chữ của nút, nên cùng cặp màu với điểm 4. Ở `prefers-contrast: more` mục menu đang được trỏ là màu nhấn đặc và ô mất nền, lấy `--flg-highlight-text`, nên đạt (6.28:1 light, 7.63:1 dark).
+
+Cả ba mươi bảy điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index a9cf1d2..f2a055f 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -102,17 +102,17 @@ Các ràng buộc của giai đoạn 1–5 giữ nguyên, spec này không nhắ
 
 | Component | Phân loại | Lý do |
 |---|---|---|
-| `Kbd` | Server-safe (`kbd/Kbd.tsx`) | `<Kbd>Esc</Kbd>` chỉ là markup. Với `keys`, nó render một con client `KbdKeys` (`kbd/kbd-keys.tsx`, `'use client'`) |
+| `Kbd` | Server-safe (`kbd/Kbd.tsx`) | `<Kbd>Esc</Kbd>` chỉ là markup. Với `keys`, nó render `KbdKeys` (`kbd/kbd-keys.tsx`, `'use client'`), vẽ cả `<kbd>` ngoài (phát hiện khi lập Plan A: `data-platform` nằm trên `<kbd>` ngoài và chỉ phần client biết nền tảng) |
 | `KbdKeys` (nội bộ, không export) | Client | Đọc nền tảng bằng `useApplePlatform()` (spec giai đoạn 5 §5) |
 | `MenuShortcut` | Client (như cả `Menu.tsx`) | Không đổi |
 | `DialogContent`, `DialogHeader` | Client (như trước) | `movable` cần pointer events, `ResizeObserver`, `useMediaQuery` |
 | `DataGrid` | Client (`data-grid/DataGrid.tsx`) | Giữ trạng thái, nghe sự kiện, đo khung, cuộn ảo, focus |
 | Engine của DataGrid (`data-grid/engine/*`) | Hàm thuần, không React | Test được riêng; không export ra ngoài gói |
 
-- **Kbd trong Server Component.** `labels` của `Kbd` chỉ là chuỗi, nên vượt ranh giới server→client được. Một trang server viết `<Kbd keys="mod+k" />`: phần tử ngoài `<kbd class="flg-kbd">` render trên server, con `KbdKeys` là tham chiếu client.
+- **Kbd trong Server Component.** `labels` của `Kbd` chỉ là chuỗi, nên vượt ranh giới server→client được. Một trang server viết `<Kbd keys="mod+k" />`: `Kbd` trả về `KbdKeys`, một tham chiếu client, và client vẽ cả `<kbd class="flg-kbd">` ngoài (phát hiện khi lập Plan A). `Kbd` có `children` là markup thuần của server.
 - **DataGrid trong Server Component.** Cột có hàm (`cell`, `format`, `value`, `editor`…) không đi qua được ranh giới, nên docs dặn: định nghĩa cột và render `DataGrid` trong một client component nhỏ (`'use client'`), Server Component chỉ truyền `data` (dữ liệu tuần tự hoá được) xuống nó (§8). Grid vẫn render đủ HTML ở server (trang đầu hay cửa sổ đầu), §3.9.
 - **`check:use-client`** thêm `src/components/kbd/kbd-keys.tsx`, `src/components/data-grid/DataGrid.tsx`.
-- **`check:rsc`** thêm: `Kbd` có `children` (ra `<kbd class="flg-kbd">Esc</kbd>`); `Kbd keys="mod+k"`: probe kiểm phần tử ngoài và rằng con của nó có `type` là export `KbdKeys` của `dist/components/kbd/kbd-keys.js`, và không gọi nó (probe hiện gọi mọi hàm component, mà `KbdKeys` dùng hook; `renderTree` thêm một danh sách "tham chiếu client" để dừng ở đó; phát hiện khi viết spec).
+- **`check:rsc`** thêm: `Kbd` có `children` (ra `<kbd class="flg-kbd">Esc</kbd>`); `Kbd keys="mod+k"`: probe kiểm rằng phần tử `Kbd` trả về có `type` là export `KbdKeys` của `dist/components/kbd/kbd-keys.js`, cùng `keys` và `labels` đi qua, và không gọi nó (probe hiện gọi mọi hàm component, mà `KbdKeys` dùng hook; `renderTree` thêm một danh sách "tham chiếu client" để dừng ở đó; phát hiện khi viết spec).
 
 ### 3.2 Giao diện không có prop mới
 
@@ -471,7 +471,7 @@ Trong mục này "kính" là lớp `flg-surface`; "focus chung" là `outline: 2p
 #### Kbd (K1)
 
 - **`.flg-kbd`:** `display: inline-flex; align-items: center; gap: .3em` (Apple, `[data-platform='apple']`: `gap: .05em`), `position: relative` (khối chứa của chữ ẩn), `box-sizing: border-box`, cao `1.9em`, padding `0 .55em`, viền 1px `--flg-control-border`, bo `--flg-radius-xs`, nền `--flg-control-bg-secondary`, chữ `--flg-text-muted`, font `--flg-weight-medium` `.84em/1` `--flg-font-sans`, `letter-spacing: .02em`, không xuống dòng, `vertical-align: .12em`. Ở `--flg-text-sm` (câu chữ) là cao 20px, chữ 10.5px, đúng gợi ý phím 20px của SearchField. `<kbd>` con: `font: inherit; letter-spacing: inherit` (bỏ font monospace của trình duyệt).
-- **Trong Tooltip** (`.flg-tooltip .flg-kbd`): cao `1.65em`, padding `0 .4em`, `vertical-align: 0`; khi đứng sau chữ (`:not(:first-child)`) cách trái 6px. Ở cỡ chữ của tooltip là cao 16px, như gợi ý của SearchField trong tooltip.
+- **Trong Tooltip** (`.flg-tooltip .flg-kbd`): cao `1.65em`, padding `0 .4em`, `vertical-align: 0`; luôn cách trái 6px, đúng mockup (phát hiện khi lập Plan A: điều kiện `:not(:first-child)` không bao giờ đúng, vì selector CSS bỏ qua nút văn bản nên trong `Search<Kbd />` Kbd là con phần tử đầu tiên; tooltip chỉ có một phím cũng có 6px, hiếm gặp). Ở cỡ chữ của tooltip là cao 16px, như gợi ý của SearchField trong tooltip.
 - **Trong menu** (`.flg-menu-shortcut .flg-kbd`): `vertical-align: 0`; giữ nguyên ô, cả ở mục đang được trỏ (`[data-highlighted]`, mục có focus) (điểm mở; K1 vẽ vậy). `MenuShortcut` có `keys` vẫn mang lớp `flg-menu-shortcut` (margin trái tự động, padding trái 12px, `--flg-text-xs`), nên ô cao khoảng 18px (chữ 9.7px). `MenuShortcut` có `children` chữ giữ đúng giao diện cũ.
 - **Trên nút đặc** (`.flg-button:is([data-variant='primary'], [data-variant='danger']) .flg-kbd`): cách trái 2px, nền trong suốt, viền màu chữ của nút 45%, chữ `inherit` (`--flg-on-accent`, `--flg-on-danger`), `vertical-align: 0`. Mockup vẽ nút `primary`; `danger` theo cùng quy tắc (ngoài mockup). Nút `secondary`, `ghost`: giao diện thường của Kbd.
 - **Dark:** chỉ khác giá trị token.
@@ -795,7 +795,7 @@ type KbdProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & (
   <kbd class="flg-kbd"><kbd>Ctrl</kbd><span class="flg-visually-hidden">+</span><kbd>Shift</kbd>…</kbd>  <!-- nơi khác -->
   ```
 
-  Theo HTML, một tổ hợp là các `<kbd>` lồng trong một `<kbd>` ngoài (bản quyết định). `data-platform` chỉ có sau khi mount trên Apple.
+  Theo HTML, một tổ hợp là các `<kbd>` lồng trong một `<kbd>` ngoài (bản quyết định). `data-platform` chỉ có sau khi mount trên Apple. `KbdKeys` (client) vẽ cả `<kbd>` ngoài cùng các `<kbd>` con; `Kbd` có `children` là `<kbd class="flg-kbd">` của server (phát hiện khi lập Plan A).
 - **Chỉ vẽ phím:** Kbd không nghe phím, không đặt `aria-keyshortcuts` cho ai. **Kbd trong một nút** thành một phần tên của nút ("Save Command plus S"); docs khuyên `aria-hidden` cho Kbd và `aria-keyshortcuts` trên nút khi nút thật sự có phím tắt (mockup K1 vẽ nút "Lưu ⌘S" với `aria-keyshortcuts`).
 - **Ngữ cảnh** (Tooltip, mục menu kể cả mục đang được trỏ, nút đặc): CSS theo chỗ đặt (§4.3), không cần prop.
 
@@ -1159,7 +1159,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 
 **Story giao diện** (dựng lại nội dung mẫu của mockup; tiếng Anh như các story trước, trừ chỗ cần chữ của mockup để so; trạng thái kéo qua `data-visual-drag`, hover qua `data-visual-hover`, focus bàn phím và popup mở qua play function):
 
-- **Plan A** (khoảng 10 story × 8 = 80 ảnh): `KbdInTextApple`, `KbdInTextOther` (câu chữ, Button `primary` "Save ⌘S", SearchField để so; nền tảng đặt bằng loader của story), `KbdInTooltipApple`, `KbdInTooltipOther`, `KbdInMenuApple`, `KbdInMenuOther` (menu mở, mục "Paste" đang được trỏ); `DialogMovable` (nghỉ, ở giữa), `DialogMovableHover` (header hover), `DialogMovableDragging` (kéo lệch `-112px, -34px` như mockup), `DialogMovablePhone` (`viewport-390x844`, không tay nắm).
+- **Plan A** (khoảng 10 story × 8 = 80 ảnh): `KbdInTextApple`, `KbdInTextOther` (câu chữ, Button `primary` "Save ⌘S", SearchField để so; nền tảng đặt bằng `beforeEach` của story, qua `.storybook/platform.ts`: che `navigator.platform` và `navigator.userAgentData` trên chính `navigator` rồi gỡ khi xong (phát hiện khi lập Plan A: máy của người phát triển có thể là Mac, nên cả story "Other" cũng đặt nền tảng)), `KbdInTooltipApple`, `KbdInTooltipOther`, `KbdInMenuApple`, `KbdInMenuOther` (menu mở, mục "Paste" đang được trỏ); `DialogMovable` (nghỉ, ở giữa), `DialogMovableHover` (header hover), `DialogMovableDragging` (kéo lệch `-112px, -34px` như mockup), `DialogMovablePhone` (`viewport-390x844`, không tay nắm).
 - **Plan B** (khoảng 7 × 8 = 56): `GridCore` (phần của G1 mà B có: sắp hai cấp, ô chọn tiêu đề một phần, hai dòng đã chọn, một dòng hover, một ô có focus bàn phím, thanh phân trang), `GridStriped`, `GridMinimal`, `GridCompact`, `GridLoading`, `GridReloading`, `GridEmpty`. Story hành vi `no-visual`: 10 000 dòng ảo, chế độ server, bản đồ phím.
 - **Plan C** (khoảng 7 × 8 = 56): `GridColumns` (G1 với cột ghim, ⋮ trên tiêu đề hover, nút chọn cột và xuất), `GridColumnsScrolled` (khung 700px đã cuộn ngang: ô ghim đặc, bóng ở mép), `ColumnResizeHandle` (nghỉ, hover), `ColumnResizing` (kéo +20px, nhãn "180 px"), `ColumnDragging` (kéo cột Kênh), `ColumnMenu` (menu của Khách hàng, "Ghim bên trái" đang được trỏ), `ColumnChooser` (Kênh đang ẩn, Mã đơn có ổ khoá).
 - **Plan D** (khoảng 4 × 8 = 32): `G1` (đủ mặt G1: thêm ô tìm kiếm, phễu, phễu đặc của Trạng thái), `GridFiltering` (F1: hàng lọc có giá trị, toán tử đang bật, popover lọc của Trạng thái mở, tìm "minh" tô sáng, thanh bộ lọc, 6 dòng), `GridFilterEmpty`, `FilterOperatorMenu` (ngoài mockup).
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 867e0fd..574df4d 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -216,6 +216,7 @@ const SHIPPED_CLASSES = [
   'flg-theme-switch',
   'flg-theme-switch-icon',
   'flg-theme-menu-icon',
+  'flg-kbd',
 ];
 
 // The rules of the AppShell that depend on the width are generated, one `@media` block per breakpoint
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 55d470a..5d6a182 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -35,6 +35,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/app-shell/AppShell.tsx',
   'src/components/nav/Nav.tsx',
   'src/components/search-field/SearchField.tsx',
+  'src/components/kbd/kbd-keys.tsx',
   'src/components/user-menu/UserMenu.tsx',
   'src/components/theme-switch/ThemeSwitch.tsx',
   'src/components/calendar/Calendar.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index b754c45..75e946f 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -38,7 +38,8 @@ const D = {
     criterion: '1.4.11',
   },
   4: {
-    description: 'White text and check marks on the accent gradient',
+    description:
+      'White text and check marks on the accent gradient, and the key of a Kbd on a `primary` Button',
     criterion: '1.4.3, 1.4.11',
     minimum: '4.5:1 text, 3:1 check marks',
   },
@@ -227,6 +228,12 @@ const D = {
       'background), in the field and in the tooltip of a collapsed field',
     criterion: '1.4.3',
   },
+  37: {
+    description:
+      'The text of a Kbd (muted text on the secondary control background) in a sentence, in a ' +
+      'menu, on the highlighted item of a menu, on a `secondary` Button and in a tooltip',
+    criterion: '1.4.3',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -303,4 +310,5 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 35, theme: 'light', check: 'nav-bar-indicator', recorded: 2.52, ...D[35] },
   { row: 35, theme: 'dark', check: 'nav-bar-indicator', recorded: 2.03, ...D[35] },
   { row: 36, theme: 'dark', check: 'kbd-text', recorded: 3.31, ...D[36] },
+  { row: 37, theme: 'dark', check: 'kbd-key-text', recorded: 3.23, ...D[37] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 08b557c..7decfe9 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -88,6 +88,7 @@ export const CHECKS = {
   'nav-bar-icon': 3,
   'nav-rail-current-dot': 3,
   'kbd-text': 4.5,
+  'kbd-key-text': 4.5,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -284,15 +285,17 @@ export function measure(
   // Tooltip: the tint straight over the page, with no border gradient under it.
   const tooltips = backdrops.map((backdrop) => composite(color('glass-tint'), backdrop));
   const textOn = (name: string, under: Rgba) => contrastRatio(composite(color(name), under), under);
-  // The key hint of a SearchField (search-field.css): muted text on control-bg-secondary, over what it
-  // sits in: the background of the frame, or the glass of the tooltip of a collapsed field.
-  const kbdText = (under: Rgba) => {
+  // The key hint of a SearchField (search-field.css) and the cell of a Kbd (kbd.css) are drawn the same:
+  // muted text on control-bg-secondary, over what it sits in. For the hint that is the background of
+  // the frame, or the glass of the tooltip of a collapsed field; a Kbd has more places (below).
+  const keyText = (under: Rgba) => {
     const key = composite(color('control-bg-secondary'), under);
     return contrastRatio(composite(color('text-muted'), key), key);
   };
   for (const under of tooltips) {
     lowest['tooltip-text'] = Math.min(lowest['tooltip-text'], textOn('text', under));
-    lowest['kbd-text'] = Math.min(lowest['kbd-text'], kbdText(under));
+    lowest['kbd-text'] = Math.min(lowest['kbd-text'], keyText(under));
+    lowest['kbd-key-text'] = Math.min(lowest['kbd-key-text'], keyText(under));
   }
   for (const surface of surfaces) {
     const control = composite(color('control-bg'), surface);
@@ -471,7 +474,21 @@ export function measure(
       Math.min(...tints.map((tint) => contrastRatio(composite(color(name), tint), tint)));
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       // The tooltip's half of this check is measured above, with the tooltips.
-      'kbd-text': kbdText(control),
+      'kbd-text': keyText(control),
+      // A Kbd on the glass (a sentence, a menu), on a control (a `secondary` Button) and on the
+      // highlighted item of a menu, which keeps the cell. Under contrast-more that item is the solid
+      // accent and the cell loses its background and takes the text of the item (preferences.css), so
+      // the text of the item is what is measured there. The tooltip is measured above.
+      'kbd-key-text': Math.min(
+        keyText(surface),
+        keyText(control),
+        ...paintStops(resolveToken(t, 'highlight-bg')).map((stop) => {
+          const row = composite(stop, surface);
+          return mode === 'contrast-more'
+            ? contrastRatio(composite(color('highlight-text'), row), row)
+            : keyText(row);
+        }),
+      ),
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
       success: onSurface('success'),
diff --git a/scripts/rsc-client-boundary.mjs b/scripts/rsc-client-boundary.mjs
new file mode 100644
index 0000000..5918387
--- /dev/null
+++ b/scripts/rsc-client-boundary.mjs
@@ -0,0 +1,45 @@
+// A module loader for scripts/rsc-probe.mjs. A framework's bundler does not load the client modules a
+// Server Component imports: it puts a reference to each in their place, and the browser loads the real
+// ones. Node has no bundler, so the probe would load them, and a client module that imports a hook
+// (`useSyncExternalStore`, `useEffect`) fails to load in the `react-server` build of React, which has
+// none. This stands in for the bundler: a module of `dist/` that starts with "use client" is replaced
+// by a client reference for each of its exports. The server-safe module that imports it still loads, and
+// what it returns for a client component is the reference, which is what React would send.
+//
+// Registered by the probe: `register('./rsc-client-boundary.mjs', import.meta.url)`.
+
+const USE_CLIENT = /^\s*(["'])use client\1/;
+
+/** The names a module exports, from the forms tsdown writes: `export { A, B as C }` and `export const`. */
+function exportedNames(source) {
+  const names = new Set();
+  for (const [, list] of source.matchAll(/^export\s*\{([^}]*)\}/gm)) {
+    for (const part of list.split(',')) {
+      const name = part
+        .trim()
+        .split(/\s+as\s+/)
+        .pop();
+      if (name) names.add(name);
+    }
+  }
+  for (const [, name] of source.matchAll(
+    /^export\s+(?:const|let|var|function|class)\s+([\w$]+)/gm,
+  )) {
+    names.add(name);
+  }
+  return names;
+}
+
+export async function load(url, context, nextLoad) {
+  const loaded = await nextLoad(url, context);
+  if (loaded.format !== 'module' || !url.includes('/dist/')) return loaded;
+  const source = String(loaded.source);
+  if (!USE_CLIENT.test(source)) return loaded;
+  const stubs = [...exportedNames(source)].map((name) => {
+    const reference = `{ $$typeof: Symbol.for('react.client.reference'), $$id: ${JSON.stringify(`${url}#${name}`)}, $$async: false, name: ${JSON.stringify(name)} }`;
+    return name === 'default'
+      ? `export default ${reference};`
+      : `export const ${name} = ${reference};`;
+  });
+  return { format: 'module', shortCircuit: true, source: stubs.join('\n') };
+}
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index c3894c4..d580d0f 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -1,25 +1,39 @@
 // Renders server-safe modules from dist/ with React's `react-server` build, the build React Server
 // Components use. A module that touches hooks or context there fails here.
 // Run with: node --conditions=react-server scripts/rsc-probe.mjs
+import { register } from 'node:module';
 import { createElement } from 'react';
 
+// The modules of dist/ that are client components are not loaded, as a framework's bundler does not
+// load them for a Server Component; each export is a client reference instead.
+register('./rsc-client-boundary.mjs', import.meta.url);
+
 const FORWARD_REF = Symbol.for('react.forward_ref');
 const FRAGMENT = Symbol.for('react.fragment');
 
-function renderTree(node) {
+/**
+ * `clients` are the client references a server component may return (see rsc-client-boundary.mjs).
+ * A Server Component does not run them: it hands React the reference, and the client renders it. The
+ * probe does the same, and stops at them.
+ */
+function renderTree(node, clients = new Set()) {
   if (node === null || node === undefined || typeof node !== 'object') return node;
-  if (Array.isArray(node)) return node.map(renderTree);
+  if (Array.isArray(node)) return node.map((child) => renderTree(child, clients));
   const { type, props } = node;
+  if (clients.has(type)) return node;
   if (typeof type === 'string') {
-    return { type, props: { ...props, children: renderTree(props.children) } };
+    return { type, props: { ...props, children: renderTree(props.children, clients) } };
   }
-  if (type === FRAGMENT) return renderTree(props.children);
-  if (typeof type === 'function') return renderTree(type(props));
-  if (type && type.$$typeof === FORWARD_REF) return renderTree(type.render(props, null));
+  if (type === FRAGMENT) return renderTree(props.children, clients);
+  if (typeof type === 'function') return renderTree(type(props), clients);
+  if (type && type.$$typeof === FORWARD_REF) return renderTree(type.render(props, null), clients);
   throw new Error(`Unsupported element type: ${String(type)}`);
 }
 
-/** Plan 2 appends the other server-safe components of spec §6.2. */
+/**
+ * Plan 2 appends the other server-safe components of spec §6.2. A case that returns a client component
+ * lists it in `clients` and expects `type: { client: <export name> }`.
+ */
 const CASES = [
   {
     label: 'Surface',
@@ -64,6 +78,32 @@ const CASES = [
     element: (C) => createElement(C, props, createElement('button', { type: 'button' }, 'Bell')),
     expect: { type: 'span', className: 'flg-indicator' },
   })),
+  // A Kbd with children is markup. With `keys` it hands the combination to `KbdKeys`, which knows the
+  // platform and is a client component: the probe checks that the reference is there, with the props,
+  // and does not run it.
+  {
+    label: 'Kbd with children',
+    file: '../dist/components/kbd/Kbd.js',
+    exportName: 'Kbd',
+    element: (C) => createElement(C, null, 'Esc'),
+    expect: { type: 'kbd', className: 'flg-kbd' },
+    check: (tree) => {
+      if (tree.props.children !== 'Esc') throw new Error('the children are not the text');
+    },
+  },
+  {
+    label: 'Kbd with keys hands them to the client component KbdKeys',
+    file: '../dist/components/kbd/Kbd.js',
+    exportName: 'Kbd',
+    clients: [{ file: '../dist/components/kbd/kbd-keys.js', exportName: 'KbdKeys' }],
+    element: (C) =>
+      createElement(C, { keys: 'mod+k', className: 'mine', labels: { command: 'C' } }),
+    expect: { type: { client: 'KbdKeys' }, className: 'mine' },
+    check: (tree) => {
+      if (tree.props.keys !== 'mod+k') throw new Error(`keys is ${tree.props.keys}`);
+      if (tree.props.labels?.command !== 'C') throw new Error('labels did not pass through');
+    },
+  },
   {
     label: 'Divider',
     file: '../dist/components/divider/Divider.js',
@@ -346,10 +386,16 @@ let failed = 0;
 for (const c of CASES) {
   try {
     const mod = await import(new URL(c.file, import.meta.url));
-    const tree = renderTree(await c.element(mod[c.exportName]));
-    if (tree.type !== c.expect.type || tree.props.className !== c.expect.className) {
+    const clients = new Map();
+    for (const { file, exportName } of c.clients ?? []) {
+      clients.set(exportName, (await import(new URL(file, import.meta.url)))[exportName]);
+    }
+    const tree = renderTree(await c.element(mod[c.exportName]), new Set(clients.values()));
+    const expectedType =
+      typeof c.expect.type === 'object' ? clients.get(c.expect.type.client) : c.expect.type;
+    if (tree.type !== expectedType || tree.props.className !== c.expect.className) {
       throw new Error(
-        `expected <${c.expect.type} class="${c.expect.className}">, got <${tree.type} class="${tree.props.className}">`,
+        `expected <${c.expect.type?.client ?? c.expect.type} class="${c.expect.className}">, got <${typeof tree.type === 'string' ? tree.type : 'another component'} class="${tree.props.className}">`,
       );
     }
     c.check?.(tree);
diff --git a/src/components/kbd/Kbd.mdx b/src/components/kbd/Kbd.mdx
new file mode 100644
index 0000000..430250e
--- /dev/null
+++ b/src/components/kbd/Kbd.mdx
@@ -0,0 +1,146 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Kbd.stories';
+
+<Meta of={Stories} />
+
+# Kbd
+
+A key, or a combination of keys, as the keyboard shows it. `<Kbd keys="mod+k" />` is **⌘K** on a Mac
+and **Ctrl K** on Windows and Linux; `<Kbd>Esc</Kbd>` is one key, as written. It draws and does
+nothing else: it listens to no key and sets `aria-keyshortcuts` for nobody.
+
+```tsx
+import { Kbd } from 'h2d-glass-ui';
+
+<p>
+  Press <Kbd>Esc</Kbd> to close, or <Kbd keys="mod+k" /> to search.
+</p>;
+```
+
+<Canvas of={Stories.Default} />
+<Controls />
+
+## Props
+
+| Prop       | Type                 | Default | Does                                                        |
+| ---------- | -------------------- | ------- | ----------------------------------------------------------- |
+| `keys`     | `string`             | none    | A combination, such as `"mod+shift+f"` (see Keys)           |
+| `children` | `ReactNode`          | none    | The text of one key, as it is. Pass `keys` or `children`    |
+| `labels`   | `Partial<KbdLabels>` | English | The names a screen reader says for the symbols (see Labels) |
+
+`ref` and every other prop of an HTML element (`className`, `style`, `title`, `aria-*`, handlers)
+go to the outer `<kbd>`, and are kept: the class you pass is joined to the library's. With both
+`keys` and `children`, `keys` is used and development says so.
+
+## Keys
+
+`keys` is one combination: parts joined with `+`, in the order you write them. Case does not matter,
+and spaces around a part are dropped. The platform decides what each part looks like.
+
+| Part                                | Apple                                                                                              | Elsewhere |
+| ----------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
+| `mod`                               | ⌘                                                                                                  | Ctrl      |
+| `ctrl`                              | ⌃                                                                                                  | Ctrl      |
+| `alt`                               | ⌥                                                                                                  | Alt       |
+| `shift`                             | ⇧                                                                                                  | Shift     |
+| `enter`                             | ↩                                                                                                  | Enter     |
+| `esc`, `escape`                     | Esc                                                                                                | Esc       |
+| `tab`                               | ⇥                                                                                                  | Tab       |
+| `backspace`                         | ⌫                                                                                                  | Backspace |
+| `delete`                            | ⌦                                                                                                  | Del       |
+| `up`, `down`, `left`, `right`       | ↑ ↓ ← →                                                                                            | ↑ ↓ ← →   |
+| `space`                             | Space                                                                                              | Space     |
+| `home`, `end`, `pageup`, `pagedown` | Home, End, Page Up, Page Down                                                                      | the same  |
+| `f1` to `f12`                       | F1 to F12                                                                                          | F1 to F12 |
+| `plus`                              | +                                                                                                  | +         |
+| one character                       | the character, in capitals (`k` is K); a character that has no single capital stays as it is (`ß`) | the same  |
+
+The order is yours: `mod+shift+f` is ⌘⇧F and Ctrl Shift F. Apple's own order is ⇧⌘F (Shift, then
+Command), so write `shift+mod+f` if you want that. A part the table does not have (`mod+foo`), or an
+empty one (`mod++`: write `mod+plus`), is drawn as you wrote it and development warns about it once.
+One `Kbd` is one combination: a sequence ("g, then i") is two of them.
+
+## Apple and other systems
+
+On Apple systems the modifiers are symbols, close together. Elsewhere they are words, set apart. The
+platform is the browser's to say, so **the HTML from a server, and the first render of a page that
+hydrates it, are written for other systems** (`Ctrl K`), and a Mac swaps in `⌘K` as soon as the page
+is in the browser. The swap is one frame. A `Kbd` in a sentence cannot be left empty until then: a
+gap in a sentence is worse than a key that changes. (A `SearchField`'s hint is empty until it
+knows, and keeps its own look.)
+
+The part that knows the platform is a client component, so a Server Component can use
+`<Kbd keys="…" />`: the outer `<kbd>` is drawn by that part, and `<Kbd>Esc</Kbd>` is plain markup.
+
+## Where it goes
+
+The same `Kbd` suits each place; the library changes its size and colours to fit.
+
+- **In text.** At `--flg-text-sm` the box is 20px high, the height of the key hint of a
+  `SearchField`.
+- **In a Tooltip**, after the words. It is 16px high there, and 6px after the text: write no space
+  between them (`Search<Kbd keys="mod+k" />`).
+- **On a `primary` or `danger` Button.** The box keeps its outline and loses its background, and its
+  text is the Button's own, so it is as readable as the label. On `secondary` and `ghost` Buttons it
+  looks as it does in text.
+
+## A Kbd in a button
+
+A `Kbd` inside a button is part of the button's name: the keys are read as **"Save Command plus
+S"** on a Mac and **"Save Ctrl plus S"** elsewhere (see Labels). If the button really has that
+shortcut, say so for assistive technology, and let the button be named by its label alone:
+
+```tsx
+<Button aria-keyshortcuts="Meta+S">
+  Save <Kbd keys="mod+s" aria-hidden="true" />
+</Button>
+```
+
+`aria-hidden` on the `Kbd` keeps the keys out of the name, and `aria-keyshortcuts` carries them.
+`aria-keyshortcuts` itself uses the names of the keys (`Meta`, `Control`), not the symbols. `Kbd`
+never sets it, since only your code knows that the shortcut works.
+
+## Labels
+
+Screen readers do not agree on what to say for a symbol such as ⌘, and some say nothing. So each
+symbol is drawn with a name that only a screen reader gets, and a hidden "+" is put between two
+keys, so that the name reads "Command plus K" and not "CommandK":
+
+| Key       | Default     | Key             | Default            |
+| --------- | ----------- | --------------- | ------------------ |
+| `command` | `"Command"` | `forwardDelete` | `"Forward Delete"` |
+| `option`  | `"Option"`  | `up`            | `"Up Arrow"`       |
+| `control` | `"Control"` | `down`          | `"Down Arrow"`     |
+| `shift`   | `"Shift"`   | `left`          | `"Left Arrow"`     |
+| `return`  | `"Return"`  | `right`         | `"Right Arrow"`    |
+| `tab`     | `"Tab"`     | `separator`     | `"+"`              |
+| `delete`  | `"Delete"`  |                 |                    |
+
+Words (`Ctrl`, `Esc`, `Shift` elsewhere) are read as they are; the arrows have a name on every
+platform. Pass the ones you translate; a key you leave out keeps its English default:
+
+```tsx
+<Kbd keys="mod+k" labels={{ command: 'Befehl', control: 'Steuerung', separator: ' plus ' }} />
+```
+
+## Accessibility
+
+- The keys are named by the symbol names and the hidden "+": "Command plus K" on a Mac, "Ctrl plus
+  K" elsewhere. The symbols themselves are hidden from screen readers.
+- The text of a key is `--flg-text-muted` on `--flg-control-bg-secondary`. In light it is 6.71:1. In
+  dark it is 3.23:1 where the key stands on the highlighted item of a menu, 3.31:1 on a `secondary`
+  Button, 3.64:1 on glass and 3.76:1 in a tooltip, which is below 4.5:1: row 37 of the table on the
+  Accessibility page. It is the same colour pair as the key hint of a `SearchField` (row 36). The
+  keys are also said by the hidden names, so no one has to read the box. With
+  `prefers-contrast: more` it passes.
+- In forced colours the box has the border and text of the system, and on a solid Button those of a
+  button.
+
+## Do and don't
+
+- Do write the key as `mod+k`, not `cmd+k` or `ctrl+k`: `mod` is the one that is ⌘ on a Mac and Ctrl
+  elsewhere, which is what a shortcut that works on both needs.
+- Do put `aria-keyshortcuts` on a control that really has the shortcut.
+- Don't use `Kbd` to listen for a key. It draws one.
+- Don't type the symbols yourself (`<Kbd>⌘K</Kbd>`): a screen reader may read nothing for them, and
+  Windows has no ⌘.
diff --git a/src/components/kbd/Kbd.tsx b/src/components/kbd/Kbd.tsx
new file mode 100644
index 0000000..8d63d4e
--- /dev/null
+++ b/src/components/kbd/Kbd.tsx
@@ -0,0 +1,48 @@
+import { clsx } from 'clsx';
+import { forwardRef } from 'react';
+import type { HTMLAttributes, ReactNode } from 'react';
+import { hasContent } from '../../internal/has-content';
+import type { KeyLabels } from '../../internal/shortcut-format';
+import { devWarn } from '../../internal/warn';
+import { KbdKeys } from './kbd-keys';
+
+/** The names a screen reader says for the symbols of a combination, and the "+" between its keys. */
+export type KbdLabels = KeyLabels;
+
+export type KbdProps = Omit<HTMLAttributes<HTMLElement>, 'children'> &
+  (
+    | {
+        /** A combination: `"mod+k"` is ⌘K on Apple and Ctrl K elsewhere. */
+        keys: string;
+        /** Default English names; any of them can be replaced. */
+        labels?: Partial<KbdLabels>;
+        children?: never;
+      }
+    | {
+        keys?: never;
+        labels?: never;
+        /** The text of one key, such as `Esc`, as it is. */
+        children: ReactNode;
+      }
+  );
+
+/**
+ * A key, or a combination of keys, as the keyboard shows it. With `children` it is a plain `<kbd>`;
+ * with `keys` the platform decides how it is written (`⌘K` or `Ctrl K`) and the part that knows the
+ * platform is a client component, so a Server Component can render this one. It only draws: it
+ * listens to no key and sets `aria-keyshortcuts` for nobody. `ref` points to the outer `<kbd>`.
+ */
+export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
+  { keys, labels, children, className, ...props },
+  ref,
+) {
+  if (keys === undefined) {
+    return (
+      <kbd ref={ref} {...props} className={clsx('flg-kbd', className)}>
+        {children}
+      </kbd>
+    );
+  }
+  if (hasContent(children)) devWarn('<Kbd> takes keys or children, not both; keys is used.');
+  return <KbdKeys ref={ref} {...props} className={className} keys={keys} labels={labels} />;
+});
diff --git a/src/components/kbd/index.ts b/src/components/kbd/index.ts
new file mode 100644
index 0000000..de51aa0
--- /dev/null
+++ b/src/components/kbd/index.ts
@@ -0,0 +1,2 @@
+export { Kbd } from './Kbd';
+export type { KbdLabels, KbdProps } from './Kbd';
diff --git a/src/components/kbd/kbd-keys.tsx b/src/components/kbd/kbd-keys.tsx
new file mode 100644
index 0000000..f7a38f7
--- /dev/null
+++ b/src/components/kbd/kbd-keys.tsx
@@ -0,0 +1,62 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { Fragment, forwardRef, useEffect, useMemo } from 'react';
+import type { HTMLAttributes } from 'react';
+import { useApplePlatform } from '../../internal/platform';
+import { DEFAULT_KEY_LABELS, formatKeys, parseKeys } from '../../internal/shortcut-format';
+import type { KeyLabels } from '../../internal/shortcut-format';
+import { devWarn } from '../../internal/warn';
+import { withDefaults } from '../../internal/with-defaults';
+
+export interface KbdKeysProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
+  keys: string;
+  labels?: Partial<KeyLabels>;
+}
+
+/**
+ * The part of `Kbd` that needs the browser: a combination of keys, drawn as the platform writes it.
+ * It draws the whole outer `<kbd>`, since `data-platform` sits on it and only this part knows the
+ * platform. The platform is known after mount (`useApplePlatform`), so the server and the first
+ * render in the browser draw the form for other systems and the HTML agrees (spec phase 6 §3.3). Not
+ * exported from the package: `Kbd` is its way in.
+ */
+export const KbdKeys = forwardRef<HTMLElement, KbdKeysProps>(function KbdKeys(
+  { keys, labels: labelsProp, className, ...props },
+  ref,
+) {
+  const apple = useApplePlatform() === true;
+  const labels = withDefaults(DEFAULT_KEY_LABELS, labelsProp);
+  const { parts, unknown } = useMemo(() => parseKeys(keys), [keys]);
+  const mistaken = unknown.length > 0;
+  useEffect(() => {
+    if (mistaken) devWarn('<Kbd> keys has a part it does not know; it is shown as written.');
+  }, [mistaken]);
+
+  return (
+    <kbd
+      ref={ref}
+      {...props}
+      className={clsx('flg-kbd', className)}
+      data-platform={apple ? 'apple' : undefined}
+    >
+      {formatKeys(parts, apple, labels).map((key, index) => (
+        // The list comes from a string and holds no state, and a key may appear twice: the position
+        // is its only identity.
+        <Fragment key={index}>
+          {index > 0 ? <span className="flg-visually-hidden">{labels.separator}</span> : null}
+          <kbd>
+            {key.name === undefined ? (
+              key.glyph
+            ) : (
+              <>
+                <span aria-hidden="true">{key.glyph}</span>
+                <span className="flg-visually-hidden">{key.name}</span>
+              </>
+            )}
+          </kbd>
+        </Fragment>
+      ))}
+    </kbd>
+  );
+});
diff --git a/src/components/search-field/SearchField.mdx b/src/components/search-field/SearchField.mdx
index fdcba02..9b0876e 100644
--- a/src/components/search-field/SearchField.mdx
+++ b/src/components/search-field/SearchField.mdx
@@ -145,6 +145,11 @@ languages write the key differently ("Strg"):
 `labels.shortcut` is given the key and whether the page is on an Apple system. A key you leave out
 keeps its English default.
 
+The default hint and `aria-keyshortcuts` are written by the same key formatter as
+[`Kbd`](?path=/docs/components-kbd--docs), so `⌘K`, `Ctrl K`, `Meta+K` and `Control+K` are spelled
+the same here and in a `Kbd keys="mod+k"` on the same page. The hint keeps its own look: it is not
+a `Kbd`.
+
 ## Collapsible
 
 <Canvas of={Stories.SearchFieldCollapsible} />
diff --git a/src/components/search-field/SearchField.tsx b/src/components/search-field/SearchField.tsx
index 53b072f..9c66733 100644
--- a/src/components/search-field/SearchField.tsx
+++ b/src/components/search-field/SearchField.tsx
@@ -10,6 +10,7 @@ import { ArrowIcon, CloseIcon, SearchIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { useApplePlatform } from '../../internal/platform';
 import { isComposing } from '../../internal/roving';
+import { parseKeys, shortcutText, toAriaKeyShortcuts } from '../../internal/shortcut-format';
 import { useControllableState } from '../../internal/use-controllable-state';
 import { useFormReset } from '../../internal/use-form-reset';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
@@ -59,12 +60,12 @@ const DEFAULT_LABELS: SearchFieldLabels = {
   clear: 'Clear search',
   open: 'Search',
   close: 'Close search',
-  shortcut: (shortcut, apple) => (shortcut === '/' ? '/' : apple ? '⌘K' : 'Ctrl K'),
+  shortcut: (shortcut, apple) => shortcutText(parseKeys(shortcut).parts, apple),
 };
 
 const isShortcut = (value: unknown): value is Shortcut => value === '/' || value === 'mod+k';
 
-interface KbdProps {
+interface KeyHintProps {
   shortcut: Shortcut;
   labels: SearchFieldLabels;
   apple: boolean | undefined;
@@ -74,7 +75,7 @@ interface KbdProps {
  * The hint of the key. `⌘K` or `Ctrl K` is known only once the platform is: until then the key is
  * there but empty and hidden, so the HTML from the server and the first render in the browser agree.
  */
-function Kbd({ shortcut, labels, apple }: KbdProps) {
+function KeyHint({ shortcut, labels, apple }: KeyHintProps) {
   const text =
     apple === undefined && shortcut === 'mod+k' ? '' : labels.shortcut(shortcut, !!apple);
   return (
@@ -86,9 +87,8 @@ function Kbd({ shortcut, labels, apple }: KbdProps) {
 
 /** The value of `aria-keyshortcuts`, or `undefined` while the platform is not known. */
 function keyShortcuts(shortcut: Shortcut | undefined, apple: boolean | undefined) {
-  if (shortcut === '/') return '/';
-  if (shortcut === 'mod+k' && apple !== undefined) return apple ? 'Meta+K' : 'Control+K';
-  return undefined;
+  if (shortcut === undefined || (shortcut === 'mod+k' && apple === undefined)) return undefined;
+  return toAriaKeyShortcuts(parseKeys(shortcut).parts, !!apple);
 }
 
 /**
@@ -269,7 +269,7 @@ export const SearchField = markAsFieldControl(
             <TooltipContent side="bottom" align="center" sideOffset={8}>
               {labels.open}
               {shortcut !== undefined && !inactive ? (
-                <Kbd shortcut={shortcut} labels={labels} apple={apple} />
+                <KeyHint shortcut={shortcut} labels={labels} apple={apple} />
               ) : null}
             </TooltipContent>
           </TooltipRoot>
@@ -307,7 +307,7 @@ export const SearchField = markAsFieldControl(
                 <CloseIcon />
               </button>
             ) : hint ? (
-              <Kbd shortcut={shortcut} labels={labels} apple={apple} />
+              <KeyHint shortcut={shortcut} labels={labels} apple={apple} />
             ) : null
           }
         />
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 3afd2a1..f52d00d 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -64,9 +64,10 @@ The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
 9, 12 and 22), AppShell (its part in rows 2 and 6), Nav (row 35, and its part in rows 2, 6, 7, 8,
-12, 14, 29 and 32), SearchField (row 36, and its part in row 2), UserMenu (its part in
-rows 2 and 6), ThemeMenuGroup (its part in row 9) and the notifications recipe (its part in rows 6,
-14 and 29) are in the table above, which is built from the same data CI checks.
+12, 14, 29 and 32), SearchField (row 36, and its part in row 2), Kbd (row 37, and its part in
+row 4), UserMenu (its part in rows 2 and 6), ThemeMenuGroup (its part in row 9) and the
+notifications recipe (its part in rows 6, 14 and 29) are in the table above, which is built from
+the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
@@ -184,6 +185,20 @@ when a change is announced.
   on the page
   [Examples/App shell](?path=/docs/examples-app-shell--docs#what-a-screen-reader-is-told).
 
+## Keys
+
+- **Kbd reads symbol names.** A combination drawn with symbols is read by the names of the keys,
+  not by the symbols: `<Kbd keys="mod+k" />` on a Mac is read "Command plus K", since the symbol is
+  hidden from screen readers and its name is there for them, with a hidden "+" between the keys.
+  Elsewhere the words "Ctrl" and "Esc" are read as they are ("Ctrl plus K"). The names and the "+"
+  come from `labels`, so a translated page reads in its language.
+- **A Kbd inside a button becomes part of its name** ("Save Command plus S"). When the button has
+  a real shortcut, put `aria-keyshortcuts` on the button, and hide the Kbd with `aria-hidden` if
+  the name should not carry it. Kbd only draws keys: it listens to none and sets
+  `aria-keyshortcuts` for nobody.
+- On a Mac the first render and the HTML from a server show the form for other systems (`Ctrl K`),
+  and the symbols (`⌘K`) replace it once the page is in the browser.
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
diff --git a/src/index.ts b/src/index.ts
index 4d9b19f..b2660f5 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -303,3 +303,5 @@ export type {
   ThemeSwitchProps,
   ThemeValue,
 } from './components/theme-switch';
+export { Kbd } from './components/kbd';
+export type { KbdLabels, KbdProps } from './components/kbd';
diff --git a/src/internal/shortcut-format.ts b/src/internal/shortcut-format.ts
new file mode 100644
index 0000000..b0b6333
--- /dev/null
+++ b/src/internal/shortcut-format.ts
@@ -0,0 +1,181 @@
+/**
+ * The grammar of a key combination (spec phase 6 §3.3) and what it is called on each platform: the
+ * glyphs and the hidden names of `Kbd`, the flat text of a key hint, and `aria-keyshortcuts`. Pure and
+ * free of React and of the browser (`apple` is an argument), so the server runs it and a test can
+ * reach every row.
+ */
+
+/**
+ * The names a screen reader says for a symbol, and the hidden "+" between two keys. They are only
+ * needed where a key is drawn as a symbol (⌘ ⇧ ⌥ ⌃ ↩ ⌫ ⌦ ⇥, and the arrows everywhere); a word such as
+ * "Ctrl" or "Esc" is read as written.
+ */
+export interface KeyLabels {
+  command: string;
+  option: string;
+  control: string;
+  shift: string;
+  return: string;
+  tab: string;
+  delete: string;
+  forwardDelete: string;
+  up: string;
+  down: string;
+  left: string;
+  right: string;
+  /** Said between two keys, so a name reads "Control plus K" and not "ControlK". */
+  separator: string;
+}
+
+export const DEFAULT_KEY_LABELS: KeyLabels = {
+  command: 'Command',
+  option: 'Option',
+  control: 'Control',
+  shift: 'Shift',
+  return: 'Return',
+  tab: 'Tab',
+  delete: 'Delete',
+  forwardDelete: 'Forward Delete',
+  up: 'Up Arrow',
+  down: 'Down Arrow',
+  left: 'Left Arrow',
+  right: 'Right Arrow',
+  separator: '+',
+};
+
+/** What each key of the grammar looks like. A glyph or a name that is `undefined` has none. */
+interface KeyInfo {
+  /** The glyph on Apple and elsewhere. */
+  apple: string;
+  other: string;
+  /** The label that names the glyph on Apple and elsewhere; `undefined` where the text is the name. */
+  appleName?: keyof KeyLabels;
+  otherName?: keyof KeyLabels;
+  /** The name `aria-keyshortcuts` uses, on Apple and elsewhere. */
+  aria: string | { apple: string; other: string };
+}
+
+const FUNCTION_KEYS = Object.fromEntries(
+  Array.from({ length: 12 }, (_, index) => {
+    const name = `F${index + 1}`;
+    return [name.toLowerCase(), { apple: name, other: name, aria: name }];
+  }),
+) as Record<string, KeyInfo>;
+
+const KEYS: Record<string, KeyInfo> = {
+  mod: {
+    apple: '⌘',
+    other: 'Ctrl',
+    appleName: 'command',
+    aria: { apple: 'Meta', other: 'Control' },
+  },
+  ctrl: { apple: '⌃', other: 'Ctrl', appleName: 'control', aria: 'Control' },
+  alt: { apple: '⌥', other: 'Alt', appleName: 'option', aria: 'Alt' },
+  shift: { apple: '⇧', other: 'Shift', appleName: 'shift', aria: 'Shift' },
+  enter: { apple: '↩', other: 'Enter', appleName: 'return', aria: 'Enter' },
+  esc: { apple: 'Esc', other: 'Esc', aria: 'Escape' },
+  tab: { apple: '⇥', other: 'Tab', appleName: 'tab', aria: 'Tab' },
+  backspace: { apple: '⌫', other: 'Backspace', appleName: 'delete', aria: 'Backspace' },
+  delete: { apple: '⌦', other: 'Del', appleName: 'forwardDelete', aria: 'Delete' },
+  up: { apple: '↑', other: '↑', appleName: 'up', otherName: 'up', aria: 'ArrowUp' },
+  down: { apple: '↓', other: '↓', appleName: 'down', otherName: 'down', aria: 'ArrowDown' },
+  left: { apple: '←', other: '←', appleName: 'left', otherName: 'left', aria: 'ArrowLeft' },
+  right: { apple: '→', other: '→', appleName: 'right', otherName: 'right', aria: 'ArrowRight' },
+  space: { apple: 'Space', other: 'Space', aria: 'Space' },
+  home: { apple: 'Home', other: 'Home', aria: 'Home' },
+  end: { apple: 'End', other: 'End', aria: 'End' },
+  pageup: { apple: 'Page Up', other: 'Page Up', aria: 'PageUp' },
+  pagedown: { apple: 'Page Down', other: 'Page Down', aria: 'PageDown' },
+  plus: { apple: '+', other: '+', aria: 'Plus' },
+  ...FUNCTION_KEYS,
+};
+
+/** The spellings that mean another key. */
+const ALIASES: Record<string, string> = { escape: 'esc' };
+
+/** One part of a combination, normalised. */
+export type KeyPart =
+  | { kind: 'named'; key: string }
+  | { kind: 'char'; char: string }
+  | { kind: 'unknown'; text: string };
+
+export interface ParsedKeys {
+  parts: KeyPart[];
+  /** The parts that are not a key of the grammar, as written (an empty part is `''`), for one warning. */
+  unknown: string[];
+}
+
+/**
+ * Reads `keys`: parts are split on "+", trimmed, and matched without regard to case. A part of one
+ * character is that character, upper-cased when the upper case is one character too (`k` is K, but
+ * `ß` stays: its upper case is "SS"). It is `toUpperCase`, not `toLocaleUpperCase`, so the server and
+ * a browser in any language agree. The writer's order is kept. A part the grammar does not know comes
+ * back in `parts` as written and in `unknown`; an empty one is only in `unknown`, since there is
+ * nothing to draw.
+ */
+export function parseKeys(keys: string): ParsedKeys {
+  const parts: KeyPart[] = [];
+  const unknown: string[] = [];
+  for (const raw of keys.split('+')) {
+    const text = raw.trim();
+    if (text === '') {
+      unknown.push('');
+      continue;
+    }
+    const name = text.toLowerCase();
+    const key = ALIASES[name] ?? name;
+    if (Object.hasOwn(KEYS, key)) {
+      parts.push({ kind: 'named', key });
+    } else if ([...text].length === 1) {
+      const upper = text.toUpperCase();
+      parts.push({ kind: 'char', char: [...upper].length === 1 ? upper : text });
+    } else {
+      parts.push({ kind: 'unknown', text });
+      unknown.push(text);
+    }
+  }
+  return { parts, unknown };
+}
+
+/** What one key shows, and the name a screen reader says when the glyph is a symbol. */
+export interface FormattedKey {
+  glyph: string;
+  name: string | undefined;
+}
+
+/** The glyph and the hidden name of each part, for a platform. */
+export function formatKeys(parts: KeyPart[], apple: boolean, labels: KeyLabels): FormattedKey[] {
+  return parts.map((part) => {
+    if (part.kind === 'char') return { glyph: part.char, name: undefined };
+    if (part.kind === 'unknown') return { glyph: part.text, name: undefined };
+    const info = KEYS[part.key]!;
+    const label = apple ? info.appleName : info.otherName;
+    return { glyph: apple ? info.apple : info.other, name: label && labels[label] };
+  });
+}
+
+/**
+ * The text of a combination where the keys are not drawn one by one: "⌘K" on Apple, "Ctrl K"
+ * elsewhere. Apple symbols run together; a word (`Esc`, `Page Up`) is set apart from its neighbours.
+ */
+export function shortcutText(parts: KeyPart[], apple: boolean): string {
+  const glyphs = formatKeys(parts, apple, DEFAULT_KEY_LABELS).map((key) => key.glyph);
+  if (!apple) return glyphs.join(' ');
+  return glyphs.reduce((text, glyph, index) => {
+    const previous = glyphs[index - 1];
+    const apart = previous !== undefined && ([...previous].length > 1 || [...glyph].length > 1);
+    return text + (apart ? ' ' : '') + glyph;
+  }, '');
+}
+
+/** The value of `aria-keyshortcuts` for a combination: "Meta+K" on Apple, "Control+K" elsewhere. */
+export function toAriaKeyShortcuts(parts: KeyPart[], apple: boolean): string {
+  return parts
+    .map((part) => {
+      if (part.kind === 'char') return part.char;
+      if (part.kind === 'unknown') return part.text;
+      const { aria } = KEYS[part.key]!;
+      return typeof aria === 'string' ? aria : apple ? aria.apple : aria.other;
+    })
+    .join('+');
+}
diff --git a/src/styles/components/kbd.css b/src/styles/components/kbd.css
new file mode 100644
index 0000000..8bb7155
--- /dev/null
+++ b/src/styles/components/kbd.css
@@ -0,0 +1,55 @@
+/* Kbd (spec phase 6 §4.3, mockup K1): a key, or a combination, in one flat cell like the key hint of a
+   SearchField, which keeps its own look. The rules for a place (a tooltip, a solid Button) change the
+   colour, the border, the size and the alignment, never `display`, so what that place says about its
+   children (a loading Button, an icon-only one) keeps winning. */
+@layer flg.components {
+  .flg-kbd {
+    display: inline-flex;
+    align-items: center;
+    gap: 0.3em;
+    /* The block of the hidden "+" between two keys, which is absolute (`flg-visually-hidden`). */
+    position: relative;
+    box-sizing: border-box;
+    height: 1.9em;
+    padding: 0 0.55em;
+    border: 1px solid var(--flg-control-border);
+    border-radius: var(--flg-radius-xs);
+    background: var(--flg-control-bg-secondary);
+    color: var(--flg-text-muted);
+    font: var(--flg-weight-medium) 0.84em / 1 var(--flg-font-sans);
+    letter-spacing: 0.02em;
+    white-space: nowrap;
+    vertical-align: 0.12em;
+  }
+  /* Apple writes its symbols close together; elsewhere the words are set apart. */
+  .flg-kbd[data-platform='apple'] {
+    gap: 0.05em;
+  }
+  /* The cell of a key inside a combination is the monospace of the browser's `kbd`, which is not the
+     font of the library. */
+  .flg-kbd > kbd {
+    font: inherit;
+    letter-spacing: inherit;
+  }
+
+  .flg-tooltip .flg-kbd {
+    height: 1.65em;
+    padding: 0 0.4em;
+    vertical-align: 0;
+  }
+  /* 6px after the words, as the mockup has it. A selector cannot see a text node, so `:not(:first-child)`
+     would never match in `Search<Kbd />`; the rule is on every Kbd of a tooltip, and a tooltip that
+     holds only a key has the 6px too (rare). */
+  .flg-tooltip .flg-kbd {
+    margin-left: 6px;
+  }
+
+  /* On a solid Button the cell is an outline, so the key keeps the colour of the label. */
+  .flg-button:is([data-variant='primary'], [data-variant='danger']) .flg-kbd {
+    margin-left: 2px;
+    border-color: color-mix(in srgb, currentColor 45%, transparent);
+    background: transparent;
+    color: inherit;
+    vertical-align: 0;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 4915d91..e0d43be 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -21,6 +21,7 @@
 @import './components/dialog.css';
 @import './components/popover.css';
 @import './components/tooltip.css';
+@import './components/kbd.css';
 @import './components/menu.css';
 @import './components/select.css';
 @import './components/combobox.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index a6814f6..dba588e 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -250,6 +250,16 @@
     .flg-search-field-clear {
       color: ButtonText;
     }
+    /* A Kbd takes the system colours for its border and text (spec phase 6 §4.5); on a solid Button
+       it is the Button's, so its selector is as specific as the rule of that place in kbd.css. */
+    .flg-kbd {
+      border-color: CanvasText;
+      color: CanvasText;
+    }
+    .flg-button:is([data-variant='primary'], [data-variant='danger']) .flg-kbd {
+      border-color: ButtonText;
+      color: ButtonText;
+    }
     /* The rings of the avatar button of a UserMenu (U1) are shadows, which this mode drops: the menu
        that is open says that it is, and the button has the border of a Button. The header of the menu is
        text on the canvas, whatever muted colour it was written in (spec phase 5 §4.5). */
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/kbd src/components/search-field src/internal src/docs src/index.test.ts
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/kbd
pnpm vitest run --project storybook-dark src/components/kbd
pnpm vitest run --project storybook-light src/components/search-field
pnpm vitest run --project storybook-dark src/components/search-field
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `pnpm gen:theme` in `Wrote src/styles/generated/theme.css, src/styles/generated/simulate.css and src/styles/generated/app-shell.css`; task này không thêm token, nên các file sinh không đổi.
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 821 test PASS, 3 skip (71 file, hai project React cộng lại, kể cả các file test kiểu), không lỗi kiểu. Test của SearchField pass không đổi.
- `scripts`: 141 test PASS (6 file).
- `pnpm check:contrast`: PASS (`Contrast check passed.`). `kbd-key-text` đo 6.71 light, 3.23 dark (ngoại lệ dòng 37), 6.28 light +, 7.63 dark +.
- Story kbd: 42 test PASS ở mỗi project (14 story × ba engine). axe chạy sau play function, không có vi phạm.
- Story search-field: 54 test PASS ở mỗi project, như trước task.
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy `flg-kbd`; `check:use-client` có `kbd-keys.tsx` (174 module, 40 client); `check:rsc` in `ok` cho `Kbd with children` và `Kbd with keys hands them to the client component KbdKeys`; `size`: JS 55.85 kB trên 60.42 kB, CSS 16.32 kB trên 17.8 kB. Không chạy `size:record`.
- `pnpm build-storybook`: PASS. `Kbd.mdx` là trang docs (`components-kbd--docs`); trong `storybook-static/index.json`, chỉ bốn story giao diện của Kbd không gắn `no-visual` (156 story có ảnh).
- `pnpm check:docs-tables`: PASS.
- Kbd là component mới, các file dùng chung chỉ được thêm vào, và DOM, CSS của SearchField không đổi (phát hiện 22), nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/platform.ts \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.test.ts \
  scripts/lib/contrast.ts \
  scripts/rsc-client-boundary.mjs \
  scripts/rsc-probe.mjs \
  src/components/kbd/Kbd.mdx \
  src/components/kbd/Kbd.stories.tsx \
  src/components/kbd/Kbd.test-d.ts \
  src/components/kbd/Kbd.test.tsx \
  src/components/kbd/Kbd.tsx \
  src/components/kbd/index.ts \
  src/components/kbd/kbd-keys.tsx \
  src/components/search-field/SearchField.mdx \
  src/components/search-field/SearchField.tsx \
  src/docs/Accessibility.mdx \
  src/docs/ExceptionTable.test.tsx \
  src/index.test.ts \
  src/index.ts \
  src/internal/shortcut-format.test.ts \
  src/internal/shortcut-format.ts \
  src/styles/components/kbd.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(kbd): add Kbd (K1) and the shared key formatter, and put SearchField on it" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: `MenuShortcut keys` và Kbd trong menu

Spec §1 (dòng "Phím"; dòng "Thay đổi ở component cũ", phần `MenuShortcut keys`), §2 ("Thay đổi ở code cũ", phần `Menu.tsx`), §3.1 (dòng MenuShortcut), §4.3 **Kbd (K1)** ý "Trong menu", §4.4 (quy tắc `prefers-contrast: more` của Kbd trong mục menu đang được trỏ), §4.5 Kbd (mục menu đang được trỏ, mục bị tắt), §5 (`MenuShortcut` và cảnh báo của nó), §6.3 `MenuShortcut`, §7 (lớp 1 cho MenuShortcut, `KbdInMenuApple`, `KbdInMenuOther`, "Test kiểu" `MenuShortcutProps`), §8 (trang menu thêm `MenuShortcut keys`). Mockup k1, phần (c).
- **`MenuShortcut`** nhận `keys` và `labels`; `keys` vẽ `<Kbd keys labels>` bên trong `.flg-menu-shortcut`; có cả hai thì `devWarn`, `keys` thắng (phát hiện 10).
- **CSS:** quy tắc menu của `kbd.css`; contrast-more và forced colors của Kbd trong mục đang được trỏ, forced colors của mục bị tắt, trong `preferences.css` (phát hiện 11).
- **Story:** `KbdInMenuApple`, `KbdInMenuOther` (giao diện; menu mở, "Paste" có focus); `KbdInMenuRowHeight` gắn `no-visual` (phát hiện 10).
- **Docs:** `DropdownMenu.mdx` (mục "Shortcuts", dòng của bảng, một ý accessibility); `Kbd.mdx` ("In a menu", forced colors và contrast-more của menu) (phát hiện 18).
- Spec §4.4 và §4.5 được sửa (phát hiện 21). Không có cặp tương phản mới; cuối task, `check:package` PASS với ngưỡng cũ (phát hiện 19).

**Files:**
- Modify: `src/components/menu/Menu.tsx`, `src/components/menu/Menu.test.tsx`, `src/components/menu/Menu.test-d.ts`, `src/components/kbd/Kbd.stories.tsx`, `src/components/kbd/Kbd.mdx`, `src/components/dropdown-menu/DropdownMenu.mdx`, `src/styles/components/kbd.css`, `src/styles/preferences.css`, `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`

**Interfaces:**
- Đổi trong `src/components/menu/Menu.tsx` (client), export như cũ qua `src/index.ts`:
  - `MenuShortcutProps = HTMLAttributes<HTMLSpanElement> & ({ keys?: never; labels?: never } | { keys: string; labels?: Partial<KbdLabels>; children?: never })`.
  - `MenuShortcut`: `forwardRef<HTMLSpanElement, MenuShortcutProps>`; `ref`, `className` và mọi prop khác vào `span.flg-menu-shortcut`. Không có `keys`: con là `children`, như trước. Có `keys`: con là `<Kbd keys={keys} labels={labels} />`.
- DOM: `<span class="flg-menu-shortcut"><kbd class="flg-kbd" data-platform="apple"?>…</kbd></span>` (Kbd của Task 1).
- Cảnh báo dev: `<MenuShortcut> takes keys or children, not both; keys is used.`
- CSS: `.flg-menu-shortcut .flg-kbd { vertical-align: 0 }` (`kbd.css`). `preferences.css`: `.flg-menu-item:is(:focus, [data-open], [data-highlighted]) .flg-kbd` ở contrast-more (`border-color: currentColor; background: transparent; color: inherit`) và, cùng selector, ở forced colors (`HighlightText`, nền trong suốt); `.flg-menu-item[aria-disabled='true'] .flg-kbd` ở forced colors (`GrayText`).
- Không có export, lớp CSS, token hay cặp tương phản mới.
- Story trong `Kbd.stories.tsx`: `KbdInMenuApple`, `KbdInMenuOther`, `KbdInMenuRowHeight`; helper `EditMenu`, `InMenu`, `highlightPaste`; icon riêng của story `PasteIcon`, `FindIcon`; `CopyIcon` của `.storybook/icons.tsx`.
- Consumes: `Kbd`, `KbdLabels` (Task 1), `hasContent`, `devWarn`; trong story: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `MenuItem`, `onPlatform`, `settled`.
- Task sau dùng: menu cột và menu dòng của DataGrid (Plan C, E) có thể hiện phím bằng `MenuShortcut keys`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/kbd/Kbd.stories.tsx b/src/components/kbd/Kbd.stories.tsx
index 306e458..0b1411b 100644
--- a/src/components/kbd/Kbd.stories.tsx
+++ b/src/components/kbd/Kbd.stories.tsx
@@ -1,15 +1,21 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
-import type { CSSProperties, ReactNode } from 'react';
+import type { CSSProperties, ReactNode, SVGProps } from 'react';
 import { hydrateRoot } from 'react-dom/client';
 import type { Root } from 'react-dom/client';
 import { renderToString } from 'react-dom/server';
-import { expect, fn, waitFor } from 'storybook/test';
-import { SearchIcon } from '../../../.storybook/icons';
+import { expect, fn, waitFor, within } from 'storybook/test';
+import { CopyIcon, SearchIcon } from '../../../.storybook/icons';
 import { onPlatform } from '../../../.storybook/platform';
 import { settled } from '../../../.storybook/real-input';
 import { Button } from '../button/Button';
 import { Card } from '../card/Card';
+import {
+  DropdownMenu,
+  DropdownMenuContent,
+  DropdownMenuTrigger,
+} from '../dropdown-menu/DropdownMenu';
 import { IconButton } from '../icon-button/IconButton';
+import { MenuItem, MenuShortcut } from '../menu/Menu';
 import { SearchField } from '../search-field/SearchField';
 import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/Tooltip';
 import { Kbd } from './Kbd';
@@ -161,6 +167,116 @@ export const KbdInTooltipOther: Story = {
   render: () => <InTooltip apple={false} />,
 };
 
+/** The clipboard of the mockup's "Paste", which the icons of the stories do not have. */
+function PasteIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg
+      viewBox="0 0 24 24"
+      fill="none"
+      stroke="currentColor"
+      strokeWidth={2}
+      strokeLinecap="round"
+      strokeLinejoin="round"
+      aria-hidden
+      focusable={false}
+      {...props}
+    >
+      <rect x="8" y="2" width="8" height="4" rx="1" />
+      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
+    </svg>
+  );
+}
+
+/** The "Find in page" of the mockup: a list with a lens. */
+function FindIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg
+      viewBox="0 0 24 24"
+      fill="none"
+      stroke="currentColor"
+      strokeWidth={2}
+      strokeLinecap="round"
+      strokeLinejoin="round"
+      aria-hidden
+      focusable={false}
+      {...props}
+    >
+      <path d="M21 6H3M10 12H3M10 18H3" />
+      <circle cx="17" cy="15" r="3" />
+      <path d="m21 19-1.9-1.9" />
+    </svg>
+  );
+}
+
+const ICON = { width: 15, height: 15 };
+/** The width of the menu of the mockup. */
+const MENU_WIDTH: CSSProperties = { width: 232 };
+
+/**
+ * The menu of the mockup (c), open, with the Kbd as the shortcut of each item. The menu is a popover
+ * in the top layer, so the part keeps the room it takes, as the mockup's menu (in the flow) does.
+ */
+function EditMenu() {
+  return (
+    <div style={{ minHeight: 134 }}>
+      <DropdownMenu defaultOpen>
+        <DropdownMenuTrigger variant="secondary" size="sm">
+          Edit
+        </DropdownMenuTrigger>
+        <DropdownMenuContent style={MENU_WIDTH}>
+          <MenuItem icon={<CopyIcon {...ICON} />}>
+            Copy <MenuShortcut keys="mod+c" />
+          </MenuItem>
+          <MenuItem icon={<PasteIcon {...ICON} />}>
+            Paste <MenuShortcut keys="mod+v" />
+          </MenuItem>
+          <MenuItem icon={<FindIcon {...ICON} />}>
+            Find in page <MenuShortcut keys="mod+shift+f" />
+          </MenuItem>
+        </DropdownMenuContent>
+      </DropdownMenu>
+    </div>
+  );
+}
+
+/** (c): the menu is open and the pointer is on "Paste", which is the item that has the focus. */
+async function highlightPaste(canvas: HTMLElement) {
+  const menu = await waitFor(() => {
+    const open = canvas.querySelector<HTMLElement>('[role="menu"]:popover-open');
+    if (!open) throw new Error('the menu is not open');
+    return open;
+  });
+  await settled(menu);
+  const paste = within(menu).getByRole('menuitem', { name: /Paste/ });
+  paste.focus();
+  await expect(paste).toHaveFocus();
+}
+
+function InMenu({ apple }: { apple: boolean }) {
+  return (
+    <Card style={{ ...CARD, minWidth: 280 }}>
+      <Head apple={apple} />
+      <Part label="Open menu · on Paste">
+        <EditMenu />
+      </Part>
+    </Card>
+  );
+}
+
+/** K1 (c) on a Mac: the menu draws a cell for each shortcut, and keeps it on the highlighted item. */
+export const KbdInMenuApple: Story = {
+  beforeEach: onPlatform('apple'),
+  render: () => <InMenu apple />,
+  play: ({ canvasElement }) => highlightPaste(canvasElement),
+};
+
+/** K1 (c) on Windows and Linux. */
+export const KbdInMenuOther: Story = {
+  beforeEach: onPlatform('other'),
+  render: () => <InMenu apple={false} />,
+  play: ({ canvasElement }) => highlightPaste(canvasElement),
+};
+
 // ---------------------------------------------------------------------------------------------------
 // Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it.
 
@@ -381,3 +497,47 @@ export const KbdHydratesToTheApplePlatform: Story = {
     }
   },
 };
+
+/**
+ * In a menu the cell is about 18px high (`--flg-text-xs` is 11.5px, the cell 1.9 of 0.84 of that),
+ * and a row that has one is as high as a row that has text: the row has a height of its own.
+ */
+export const KbdInMenuRowHeight: Story = {
+  tags: ['no-visual'],
+  beforeEach: onPlatform('other'),
+  render: () => (
+    <DropdownMenu defaultOpen>
+      <DropdownMenuTrigger variant="secondary" size="sm">
+        Edit
+      </DropdownMenuTrigger>
+      <DropdownMenuContent style={MENU_WIDTH}>
+        <MenuItem>
+          Rename <MenuShortcut>F2</MenuShortcut>
+        </MenuItem>
+        <MenuItem>
+          Paste <MenuShortcut keys="mod+v" />
+        </MenuItem>
+      </DropdownMenuContent>
+    </DropdownMenu>
+  ),
+  play: async ({ canvas }) => {
+    const menu = await waitFor(() => {
+      const open = document.querySelector<HTMLElement>('.flg-menu:popover-open');
+      if (!open) throw new Error('the menu is not open');
+      return open;
+    });
+    await settled(menu);
+    const text = within(menu).getByRole('menuitem', { name: /Rename/ });
+    const keys = within(menu).getByRole('menuitem', { name: /Paste/ });
+    const box = find<HTMLElement>(keys, '.flg-menu-shortcut > .flg-kbd');
+    await expect(box.getBoundingClientRect().height).toBeCloseTo(18, 0);
+    await expect(keys.getBoundingClientRect().height).toBe(text.getBoundingClientRect().height);
+    // The cell sits inside its row, centred on the line of the text.
+    const row = keys.getBoundingClientRect();
+    const cell = box.getBoundingClientRect();
+    await expect(cell.top).toBeGreaterThanOrEqual(row.top);
+    await expect(cell.bottom).toBeLessThanOrEqual(row.bottom);
+    await expect(cell.top + cell.height / 2).toBeCloseTo(row.top + row.height / 2, 0);
+    await expect(canvas.getByRole('button', { name: 'Edit' })).toBeVisible();
+  },
+};
diff --git a/src/components/menu/Menu.test-d.ts b/src/components/menu/Menu.test-d.ts
index e00860b..d3bb040 100644
--- a/src/components/menu/Menu.test-d.ts
+++ b/src/components/menu/Menu.test-d.ts
@@ -3,6 +3,7 @@ import type {
   MenuCheckboxItemProps,
   MenuItemProps,
   MenuRadioItemProps,
+  MenuShortcutProps,
   MenuSubTriggerProps,
 } from './Menu';
 
@@ -26,3 +27,26 @@ test('MenuSubTrigger does not take an id', () => {
   const trigger: MenuSubTriggerProps = { id: 'x' };
   expectTypeOf(trigger).toBeObject();
 });
+
+test('MenuShortcut takes text or keys, not both', () => {
+  const text: MenuShortcutProps = { children: 'F2' };
+  const keys: MenuShortcutProps = { keys: 'mod+v' };
+  const labelled: MenuShortcutProps = { keys: 'mod+v', labels: { command: 'Befehl' } };
+  // @ts-expect-error keys and children together
+  const both: MenuShortcutProps = { keys: 'mod+v', children: 'Ctrl+V' };
+  // @ts-expect-error labels belong to keys
+  const labelsAlone: MenuShortcutProps = { children: 'F2', labels: { command: 'Befehl' } };
+  // @ts-expect-error the key of a label must exist
+  const unknown: MenuShortcutProps = { keys: 'mod+v', labels: { meta: 'Befehl' } };
+  expectTypeOf(text).toBeObject();
+  expectTypeOf(keys).toBeObject();
+  expectTypeOf(labelled).toBeObject();
+  expectTypeOf(both).toBeObject();
+  expectTypeOf(labelsAlone).toBeObject();
+  expectTypeOf(unknown).toBeObject();
+});
+
+test('MenuShortcut keeps the props of a span', () => {
+  const props: MenuShortcutProps = { keys: 'mod+v', className: 'mine', title: 'Paste' };
+  expectTypeOf(props).toBeObject();
+});
diff --git a/src/components/menu/Menu.test.tsx b/src/components/menu/Menu.test.tsx
index 2d1593a..55d7098 100644
--- a/src/components/menu/Menu.test.tsx
+++ b/src/components/menu/Menu.test.tsx
@@ -1,6 +1,6 @@
 import { fireEvent, render, screen } from '@testing-library/react';
-import { forwardRef, useContext } from 'react';
-import type { AnchorHTMLAttributes } from 'react';
+import { createRef, forwardRef, useContext } from 'react';
+import type { AnchorHTMLAttributes, ReactNode } from 'react';
 import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
 import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
 import {
@@ -15,10 +15,12 @@ import {
   MenuLabel,
   MenuRadioGroup,
   MenuRadioItem,
+  MenuShortcut,
   MenuSub,
   MenuSubContent,
   MenuSubTrigger,
 } from './Menu';
+import type { MenuShortcutProps } from './Menu';
 import { MenuTreeContext } from './menu-context';
 
 // jsdom has no Popover API. This stand-in is enough for a menu to render.
@@ -241,3 +243,102 @@ describe('Menu parts', () => {
     expect(screen.getByRole('button', { name: 'View' })).not.toHaveAttribute('aria-controls');
   });
 });
+
+describe('MenuShortcut', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => {
+    vi.restoreAllMocks();
+    document.body.innerHTML = '';
+  });
+
+  /** A menu that is open, with one item and the shortcut under test. */
+  const inItem = (shortcut: ReactNode) =>
+    render(
+      <DropdownMenu defaultOpen>
+        <DropdownMenuTrigger>Edit</DropdownMenuTrigger>
+        <DropdownMenuContent>
+          <MenuItem>Paste {shortcut}</MenuItem>
+        </DropdownMenuContent>
+      </DropdownMenu>,
+    );
+
+  it('keeps the text it is given, as it did before keys', () => {
+    inItem(<MenuShortcut>F2</MenuShortcut>);
+    const shortcut = screen.getByText('F2');
+    expect(shortcut.tagName).toBe('SPAN');
+    expect(shortcut).toHaveClass('flg-menu-shortcut');
+    expect(shortcut.querySelector('.flg-kbd')).toBeNull();
+  });
+
+  it('draws the keys in a Kbd inside the span of the menu', () => {
+    const ref = createRef<HTMLSpanElement>();
+    inItem(<MenuShortcut ref={ref} keys="mod+v" className="mine" title="Paste" data-extra="1" />);
+    const shortcut = ref.current!;
+    expect(shortcut.tagName).toBe('SPAN');
+    expect(shortcut).toHaveClass('flg-menu-shortcut', 'mine');
+    expect(shortcut).toHaveAttribute('title', 'Paste');
+    expect(shortcut).toHaveAttribute('data-extra', '1');
+    const kbd = shortcut.querySelector(':scope > kbd.flg-kbd');
+    expect(kbd).not.toBeNull();
+    expect(kbd).toHaveTextContent('Ctrl');
+    expect(kbd).toHaveTextContent('V');
+  });
+
+  it('passes labels to the Kbd', () => {
+    inItem(<MenuShortcut keys="mod+v" labels={{ separator: ' und ' }} />);
+    expect(document.querySelector('.flg-kbd > .flg-visually-hidden')).toHaveTextContent('und');
+  });
+
+  it('names the item with its keys, so a screen reader hears them', () => {
+    inItem(<MenuShortcut keys="mod+v" />);
+    const item = screen.getByRole('menuitem', { name: /Paste\s*Ctrl\s*\+\s*V/, hidden: true });
+    expect(item).toBeInTheDocument();
+  });
+
+  it('lets the item be named by its label when the shortcut is hidden from assistive technology', () => {
+    render(
+      <DropdownMenu defaultOpen>
+        <DropdownMenuTrigger>Edit</DropdownMenuTrigger>
+        <DropdownMenuContent>
+          <MenuItem aria-keyshortcuts="Meta+V">
+            Paste <MenuShortcut keys="mod+v" aria-hidden="true" />
+          </MenuItem>
+        </DropdownMenuContent>
+      </DropdownMenu>,
+    );
+    const item = screen.getByRole('menuitem', { name: 'Paste', hidden: true });
+    expect(item).toHaveAttribute('aria-keyshortcuts', 'Meta+V');
+    expect(item.querySelector('.flg-menu-shortcut')).toHaveAttribute('aria-hidden', 'true');
+  });
+
+  it('draws the symbols of a Mac once it has mounted', () => {
+    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('MacIntel');
+    inItem(<MenuShortcut keys="mod+v" />);
+    const kbd = document.querySelector('.flg-menu-shortcut > .flg-kbd');
+    expect(kbd).toHaveAttribute('data-platform', 'apple');
+    expect(kbd?.querySelector('[aria-hidden="true"]')).toHaveTextContent('⌘');
+  });
+
+  it('shows the keys and says so when it is given both keys and children', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    // The types forbid it; a caller in JavaScript, or behind a cast, can still do it.
+    const both = { keys: 'mod+v', children: 'Ctrl+V' } as unknown as MenuShortcutProps;
+    inItem(<MenuShortcut {...both} />);
+    expect(screen.queryByText('Ctrl+V')).toBeNull();
+    expect(document.querySelector('.flg-menu-shortcut > .flg-kbd')).not.toBeNull();
+    expect(warn).toHaveBeenCalledWith(
+      WARN_PREFIX + ' <MenuShortcut> takes keys or children, not both; keys is used.',
+    );
+  });
+
+  it('does not warn for keys alone or for text alone', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    inItem(
+      <>
+        <MenuShortcut keys="mod+v" />
+        <MenuShortcut>F2</MenuShortcut>
+      </>,
+    );
+    expect(warn).not.toHaveBeenCalled();
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/menu
pnpm vitest run --project storybook-light src/components/kbd
```

Expected: FAIL.
- `Menu.test.tsx` (cả hai project React): năm test của `MenuShortcut` fail: `draws the keys in a Kbd inside the span of the menu` (`expected null not to be null`), `passes labels to the Kbd`, `names the item with its keys, so a screen reader hears them`, `draws the symbols of a Mac once it has mounted`, `shows the keys and says so when it is given both keys and children`. `keeps the text it is given, as it did before keys`, `lets the item be named by its label when the shortcut is hidden from assistive technology` và `does not warn for keys alone or for text alone` pass trên code cũ (đặc tả).
- `Menu.test-d.ts`: `MenuShortcut takes text or keys, not both` và `MenuShortcut keeps the props of a span` báo lỗi kiểu ở `keys` (chưa có trong `MenuShortcutProps`).
- Story kbd (`storybook-light`): `KbdInMenuRowHeight` fail ở ba engine (`nothing matches .flg-menu-shortcut > .flg-kbd`: ô chưa có); các story khác pass. Hai story giao diện mới chỉ mở menu và focus "Paste", nên chúng chạy được, nhưng chưa vẽ ô nào.

Theo báo cáo của bản nháp (phát hiện 20): các test trên được viết trước và fail như vậy (báo cáo ghi "5 of 7" ở lần chạy đầu; test thứ tám, về cảnh báo, pass trên code cũ). Bỏ quy tắc `vertical-align: 0` thì `KbdInMenuRowHeight` vẫn pass: phần shortcut là flex item, nên ô được canh giữa dù có quy tắc hay không (phát hiện 10).

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index f2a055f..accfe7e 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -663,7 +663,7 @@ Số in đậm là dưới ngưỡng ở theme mặc định. Ở `kbd-key-text`
 
 **`prefers-contrast: more`:** mọi cặp mới phải đạt (lớp 4 (b) ở §7). Ngoài phần token đã có của chế độ này và quy tắc của `Table` (dòng hover, dòng chọn, sọc không có nền; dòng chọn có khung 2px, spec giai đoạn 4 §4.3), các quy tắc sau đều ngoài mockup:
 
-- Kbd trong mục menu đang được trỏ: chữ `--flg-highlight-text`, nền trong suốt, viền `currentColor` (giữ nguyên thì chữ mờ nằm trên nền nhấn đặc, dưới 2:1).
+- Kbd trong mục menu đang được trỏ: chữ `inherit`, nền trong suốt, viền `currentColor` (giữ nguyên thì chữ mờ nằm trên nền nhấn đặc, dưới 2:1). `inherit` lấy màu của `.flg-menu-shortcut`, tức `--flg-highlight-icon` (ở chế độ này bằng `--flg-highlight-text`) và màu chữ riêng của mục `danger` (phát hiện khi lập Plan A: ghi thẳng `--flg-highlight-text` thì mục `danger` đang trỏ, nền `--flg-danger-fill`, sai màu chữ).
 - `--flg-column-resize-line` thành `--flg-text-muted` đặc (token, §4.2).
 - Ô có focus, ô đang sửa có focus: khung `--flg-accent-solid` của chế độ này; `outline` `--flg-focus-outline-color` vẽ vào trong (`outline-offset: -2px`) như control trong Table `lined` (spec giai đoạn 4 §4.3).
 - Dòng mới, ô đã sửa, dòng chờ xoá: bỏ nền (accent 12%, `--flg-highlight-danger-bg`, mà ở chế độ này là `--flg-danger-fill` đặc), như Table bỏ nền của dòng chọn; dấu hiệu còn lại là khung nét đứt (ô đã sửa), "+ (new)" (dòng mới), gạch ngang và chữ mờ (dòng chờ xoá), cộng chữ ẩn.
@@ -674,7 +674,7 @@ Số in đậm là dưới ngưỡng ở theme mặc định. Ở `kbd-key-text`
 
 Mọi phần mới có quy tắc riêng trong `preferences.css`. Icon dùng `currentColor`, màu đặt trên phần tử bọc ngoài (spec giai đoạn 2 §4.5).
 
-- **Kbd:** viền và chữ theo hệ thống (`CanvasText`); trên nút đặc: `ButtonText`, viền `ButtonText`.
+- **Kbd:** viền và chữ theo hệ thống (`CanvasText`); trên nút đặc: `ButtonText`, viền `ButtonText`; trong mục menu đang được trỏ (có focus, đang mở): viền và chữ `HighlightText`, nền trong suốt; trong mục menu bị tắt: `GrayText` (phát hiện khi lập Plan A: mục đó vẽ nền `Highlight`, nên `CanvasText` không đọc được). Selector của quy tắc này giống hệt quy tắc `prefers-contrast: more` của cùng phần và đứng sau nó, để màu hệ thống thắng khi cả hai chế độ cùng bật.
 - **Dialog kéo được:** tay nắm `CanvasText`, đang kéo `Highlight`; bóng nhấc lên bị bỏ (panel đã có viền `CanvasText` của `.flg-surface`).
 - **Dialog toàn màn hình:** không có quy tắc riêng.
 - **DataGrid:**
diff --git a/src/components/dropdown-menu/DropdownMenu.mdx b/src/components/dropdown-menu/DropdownMenu.mdx
index 24d5c04..bf341f8 100644
--- a/src/components/dropdown-menu/DropdownMenu.mdx
+++ b/src/components/dropdown-menu/DropdownMenu.mdx
@@ -36,17 +36,17 @@ import {
 
 The parts below work in a DropdownMenu, a ContextMenu and a submenu alike.
 
-| Part                                          | Renders                   | Notes                                                                                         |
-| --------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
-| `MenuItem`                                    | `role="menuitem"`         | `onSelect`, `disabled`, `variant` (`"default"` or `"danger"`), `icon`, `textValue`, `asChild` |
-| `MenuCheckboxItem`                            | `role="menuitemcheckbox"` | `checked`, `defaultChecked`, `onCheckedChange`                                                |
-| `MenuRadioGroup`                              | `role="group"`            | `value`, `defaultValue`, `onValueChange`                                                      |
-| `MenuRadioItem`                               | `role="menuitemradio"`    | `value`                                                                                       |
-| `MenuGroup`                                   | `role="group"`            | A `MenuLabel` inside it names it                                                              |
-| `MenuLabel`                                   | `role="presentation"`     | A heading. Inside a `MenuGroup` or a `MenuRadioGroup`, it names the group                     |
-| `MenuSeparator`                               | `role="separator"`        |                                                                                               |
-| `MenuShortcut`                                | `<span>`                  | A keyboard shortcut at the end of an item. It only shows the keys; the app binds them         |
-| `MenuSub`, `MenuSubTrigger`, `MenuSubContent` | a submenu                 | `MenuSub` takes `open`, `defaultOpen`, `onOpenChange`                                         |
+| Part                                          | Renders                   | Notes                                                                                          |
+| --------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
+| `MenuItem`                                    | `role="menuitem"`         | `onSelect`, `disabled`, `variant` (`"default"` or `"danger"`), `icon`, `textValue`, `asChild`  |
+| `MenuCheckboxItem`                            | `role="menuitemcheckbox"` | `checked`, `defaultChecked`, `onCheckedChange`                                                 |
+| `MenuRadioGroup`                              | `role="group"`            | `value`, `defaultValue`, `onValueChange`                                                       |
+| `MenuRadioItem`                               | `role="menuitemradio"`    | `value`                                                                                        |
+| `MenuGroup`                                   | `role="group"`            | A `MenuLabel` inside it names it                                                               |
+| `MenuLabel`                                   | `role="presentation"`     | A heading. Inside a `MenuGroup` or a `MenuRadioGroup`, it names the group                      |
+| `MenuSeparator`                               | `role="separator"`        |                                                                                                |
+| `MenuShortcut`                                | `<span>`                  | A keyboard shortcut at the end of an item: text, or `keys` (see Shortcuts). The app binds them |
+| `MenuSub`, `MenuSubTrigger`, `MenuSubContent` | a submenu                 | `MenuSub` takes `open`, `defaultOpen`, `onOpenChange`                                          |
 
 Choosing an item closes the whole menu and returns focus to the trigger. Call
 `event.preventDefault()` in `onSelect` to keep the menu open, for example to toggle several
@@ -56,6 +56,33 @@ Checkbox items and radio groups keep their value from one opening to the next, c
 
 <Canvas of={Stories.CheckboxAndRadioItems} />
 
+## Shortcuts
+
+`MenuShortcut` shows a shortcut at the end of an item. It only shows it: the app binds the keys.
+Give it text, which is drawn as it is, or `keys`, which a `Kbd` draws for the platform, as a small
+cell: **⌘V** on a Mac and **Ctrl V** elsewhere (the grammar of `keys` and `labels` is on the Kbd
+page). Give it one or the other: with both, `keys` is used and development says so.
+
+```tsx
+<MenuItem icon={<PasteIcon />} onSelect={paste}>
+  Paste <MenuShortcut keys="mod+v" />
+</MenuItem>
+```
+
+The cell is about 18px high and the row keeps its height. The highlighted item keeps the cell too.
+With `prefers-contrast: more` the cell on a highlighted item is an outline in the colour of the
+item, and in forced colours it takes the system colours of the item.
+
+A shortcut is part of the name of its item: a screen reader says "Paste Command plus V" on a Mac.
+To name the item by its label alone, and say the keys through `aria-keyshortcuts`, hide the
+shortcut from assistive technology:
+
+```tsx
+<MenuItem aria-keyshortcuts="Meta+V" onSelect={paste}>
+  Paste <MenuShortcut keys="mod+v" aria-hidden="true" />
+</MenuItem>
+```
+
 ## Submenus
 
 A submenu opens on its trigger with →, Enter or Space, or after the pointer rests on it for 100ms.
@@ -119,6 +146,8 @@ the room it has; past that it scrolls.
 - The highlighted item is the focused item. The highlight's light accent wash comes from the
   approved design and falls short of 3:1 against the panel; see rows 8–10 on the Accessibility page.
   With `prefers-contrast: more`, the highlight is a solid accent fill.
+- The keys of a `MenuShortcut` are muted text on the highlighted item. In dark that is 3.23:1, below
+  4.5:1: row 37 of the Accessibility page. The keys are also in the name of the item.
 
 ## Do and don't
 
diff --git a/src/components/kbd/Kbd.mdx b/src/components/kbd/Kbd.mdx
index 430250e..e34e7c7 100644
--- a/src/components/kbd/Kbd.mdx
+++ b/src/components/kbd/Kbd.mdx
@@ -80,6 +80,8 @@ The same `Kbd` suits each place; the library changes its size and colours to fit
   `SearchField`.
 - **In a Tooltip**, after the words. It is 16px high there, and 6px after the text: write no space
   between them (`Search<Kbd keys="mod+k" />`).
+- **In a menu**, as `<MenuShortcut keys="mod+v" />` (see the DropdownMenu page). The cell is about
+  18px high and sits on the line of the item; the highlighted item keeps it.
 - **On a `primary` or `danger` Button.** The box keeps its outline and loses its background, and its
   text is the Button's own, so it is as readable as the label. On `secondary` and `ghost` Buttons it
   looks as it does in text.
@@ -133,8 +135,9 @@ platform. Pass the ones you translate; a key you leave out keeps its English def
   Accessibility page. It is the same colour pair as the key hint of a `SearchField` (row 36). The
   keys are also said by the hidden names, so no one has to read the box. With
   `prefers-contrast: more` it passes.
-- In forced colours the box has the border and text of the system, and on a solid Button those of a
-  button.
+- In forced colours the box has the border and text of the system, on a solid Button those of a
+  button, and on a highlighted menu item those of the item. With `prefers-contrast: more` the box on
+  a highlighted menu item is an outline in the colour of the item, on the solid accent.
 
 ## Do and don't
 
diff --git a/src/components/menu/Menu.tsx b/src/components/menu/Menu.tsx
index e11f2af..5b3e04d 100644
--- a/src/components/menu/Menu.tsx
+++ b/src/components/menu/Menu.tsx
@@ -26,6 +26,7 @@ import type {
 } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { dataAttr } from '../../internal/data-attr';
+import { hasContent } from '../../internal/has-content';
 import { CheckIcon, ChevronIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { resolveLazy } from '../../internal/react-lazy';
@@ -35,6 +36,8 @@ import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { devWarn } from '../../internal/warn';
 import { focusMenuEdge, isPointInPolygon, useMenu } from './menu-context';
 import type { FocusOnOpen, MenuLevelContextValue } from './menu-context';
+import { Kbd } from '../kbd/Kbd';
+import type { KbdLabels } from '../kbd/Kbd';
 import { MenuPanel } from './MenuPanel';
 
 const CHECK = <CheckIcon />;
@@ -76,7 +79,17 @@ export interface MenuRadioItemProps extends ItemBaseProps {
 export type MenuGroupProps = HTMLAttributes<HTMLDivElement>;
 export type MenuLabelProps = HTMLAttributes<HTMLDivElement>;
 export type MenuSeparatorProps = HTMLAttributes<HTMLDivElement>;
-export type MenuShortcutProps = HTMLAttributes<HTMLSpanElement>;
+export type MenuShortcutProps = HTMLAttributes<HTMLSpanElement> &
+  (
+    | { keys?: never; labels?: never }
+    | {
+        /** A combination, drawn as a Kbd: `"mod+v"` is ⌘V on Apple and Ctrl V elsewhere. */
+        keys: string;
+        /** The names a screen reader says for the symbols, as the Kbd takes them. */
+        labels?: Partial<KbdLabels>;
+        children?: never;
+      }
+  );
 export interface MenuSubProps {
   open?: boolean;
   defaultOpen?: boolean;
@@ -417,12 +430,22 @@ export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(func
   );
 });
 
-/** A keyboard shortcut shown at the end of an item. */
+/**
+ * A keyboard shortcut shown at the end of an item: text as it is, or `keys`, which a Kbd draws for
+ * the platform. It only shows the keys; the app binds them.
+ */
 export const MenuShortcut = forwardRef<HTMLSpanElement, MenuShortcutProps>(function MenuShortcut(
-  { className, ...props },
+  { className, keys, labels, children, ...props },
   ref,
 ) {
-  return <span ref={ref} className={clsx('flg-menu-shortcut', className)} {...props} />;
+  if (keys !== undefined && hasContent(children)) {
+    devWarn('<MenuShortcut> takes keys or children, not both; keys is used.');
+  }
+  return (
+    <span ref={ref} className={clsx('flg-menu-shortcut', className)} {...props}>
+      {keys === undefined ? children : <Kbd keys={keys} labels={labels} />}
+    </span>
+  );
 });
 
 interface SubContextValue {
diff --git a/src/styles/components/kbd.css b/src/styles/components/kbd.css
index 8bb7155..1be61bc 100644
--- a/src/styles/components/kbd.css
+++ b/src/styles/components/kbd.css
@@ -44,6 +44,15 @@
     margin-left: 6px;
   }
 
+  /* A menu draws the cell too (K1): the key of an item is a cell like any other, with the size of the
+     text of the shortcut (`--flg-text-xs`, so about 18px high), which sits on the line of the item.
+     The highlighted item colours its shortcut, but the cell has its own colour, so it keeps its look
+     there, as the mockup draws it; only `prefers-contrast: more` and forced colours take it over
+     (preferences.css). */
+  .flg-menu-shortcut .flg-kbd {
+    vertical-align: 0;
+  }
+
   /* On a solid Button the cell is an outline, so the key keeps the colour of the label. */
   .flg-button:is([data-variant='primary'], [data-variant='danger']) .flg-kbd {
     margin-left: 2px;
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index dba588e..3032fcd 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -8,6 +8,15 @@
       background: var(--flg-highlight-text);
       color: var(--flg-highlight-bg);
     }
+    /* The muted key of a Kbd would sit on the solid accent of a highlighted item at under 2:1, so the
+       cell is an outline in the colour of the item (its shortcut has `--flg-highlight-icon`, which is
+       `--flg-highlight-text` here, and a danger item has the colour of its own text). The forced
+       colours rule for the same part has the same selector (spec phase 6 §4.4). */
+    .flg-menu-item:is(:focus, [data-open], [data-highlighted]) .flg-kbd {
+      border-color: currentColor;
+      background: transparent;
+      color: inherit;
+    }
     /* The selected segmented tab, and segment, gets an edge of the text colour, which its track can
        tell apart. */
     .flg-tabs-list[data-variant='segmented'] .flg-tabs-trigger[aria-selected='true'],
@@ -368,6 +377,18 @@
       :is(.flg-menu-item-icon, .flg-menu-shortcut, .flg-menu-chevron) {
       color: HighlightText;
     }
+    /* A Kbd in an item takes the colours of the item. This selector is the one of its rule in
+       `prefers-contrast: more`, above, and comes after it: both modes can be on at once, and the
+       system colours must win. The cell stays an outline, as there. */
+    .flg-menu-item:is(:focus, [data-open], [data-highlighted]) .flg-kbd {
+      border-color: HighlightText;
+      background: transparent;
+      color: HighlightText;
+    }
+    .flg-menu-item[aria-disabled='true'] .flg-kbd {
+      border-color: GrayText;
+      color: GrayText;
+    }
     .flg-menu-radio-dot {
       background: CanvasText;
     }
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/menu src/components/kbd src/components/search-field src/index.test.ts src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/kbd
pnpm vitest run --project storybook-dark src/components/kbd
pnpm vitest run --project storybook-light src/components/dropdown-menu
pnpm vitest run --project storybook-dark src/components/dropdown-menu
pnpm vitest run --project storybook-light src/components/context-menu
pnpm vitest run --project storybook-dark src/components/context-menu
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 266 test PASS, không lỗi kiểu (thư mục menu riêng: 45, trong đó 8 test mới của `MenuShortcut`).
- `scripts`: 141 test PASS (6 file).
- `pnpm check:contrast`: PASS. Không có cặp mới: `kbd-key-text` (Task 1) đã đo mục menu đang được trỏ.
- Story kbd: 51 test PASS ở mỗi project (17 story × ba engine). Story dropdown-menu 48 và context-menu 9 PASS ở mỗi project, như trước task (menu có `MenuShortcut` chữ giữ giao diện cũ).
- `pnpm build && pnpm check:package`: PASS; `size`: JS 55.92 kB trên 60.42 kB, CSS 16.34 kB trên 17.8 kB. Không chạy `size:record`.
- `pnpm build-storybook`: PASS. Trong `storybook-static/index.json`, `KbdInMenuRowHeight` gắn `no-visual`, `KbdInMenuApple` và `KbdInMenuOther` thì không (158 story có ảnh).
- `pnpm check:docs-tables`: PASS (bảng của `DropdownMenu.mdx` vẫn là bảng Markdown).
- Quy tắc mới cần một `.flg-kbd` trong `.flg-menu-shortcut` hay trong `.flg-menu-item`, mà không story cũ nào có, nên ảnh chuẩn của menu giữ nguyên (phát hiện 22).
- Contrast-more và forced colors của Kbd trong menu không có story; bản nháp kiểm chúng bằng computed style trong Chromium (phát hiện 11, 24).

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  src/components/dropdown-menu/DropdownMenu.mdx \
  src/components/kbd/Kbd.mdx \
  src/components/kbd/Kbd.stories.tsx \
  src/components/menu/Menu.test-d.ts \
  src/components/menu/Menu.test.tsx \
  src/components/menu/Menu.tsx \
  src/styles/components/kbd.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(menu): MenuShortcut takes keys and draws them as a Kbd" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: `usePointerDrag` và `GripIcon`

Spec §3.8 (đoạn đầu: ngưỡng, Esc, `lostpointercapture`), §5 (dòng `use-pointer-drag.ts`), §4.6 (Plan A: `GripIcon`). Không component nào đổi: primitive và icon chưa được dùng cho tới Task 4.
- **`usePointerDrag`** trong `src/internal/use-pointer-drag.ts`: hợp đồng callback ở phần Interfaces dưới đây; lần vượt ngưỡng tới cả `onMove` (lần trả lại) (phát hiện 12).
- **`GripIcon`** trong `src/internal/icons.tsx` (phát hiện 12).
- Slider giữ hook riêng (phát hiện 12). Không sửa dòng spec nào; không export, CSS hay story mới.

**Files:**
- Create: `src/internal/use-pointer-drag.ts`, `src/internal/use-pointer-drag.test.tsx`
- Modify: `src/internal/icons.tsx`, `src/internal/icons.test.tsx`

**Interfaces:**
- Produces trong `src/internal/use-pointer-drag.ts` (nội bộ, không export từ gói):
  - `usePointerDrag(options: PointerDragOptions): PointerDragHandlers`, với `PointerDragHandlers = { onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void }`: handler duy nhất cần đặt lên phần tử được nhấn để kéo.
  - `PointerDragOptions`:
    - `pointerTypes?: readonly string[]`: các `pointerType` được bắt đầu kéo (ví dụ `['mouse', 'pen']` cho một lần kéo sẽ tranh với cuộn bằng ngón tay); loại khác bị bỏ hẳn, cả `onPress`. Mặc định: mọi loại.
    - `threshold?: number`: khoảng cách đường thẳng (không theo từng trục), tính bằng px, trước khi lần nhấn thành kéo. Mặc định 4.
    - `cancelOnEscape?: boolean`: Esc trong lúc kéo gọi `preventDefault` và `onCancel`; Esc khi bộ gõ đang soạn chữ là của bộ gõ. Mặc định `true`.
    - `onPress?: (event: ReactPointerEvent<HTMLElement>) => void`: lần nhấn hợp lệ, trước khi theo dõi gì; gọi `event.preventDefault()` để focus và vùng chọn chữ ở yên.
    - `onStart?`, `onMove?`, `onEnd?`, `onCancel?`: `(info: PointerDragInfo) => void`.
  - `PointerDragInfo = { x: number; y: number; startX: number; startY: number; dx: number; dy: number; pointerId: number; pointerType: string; event: PointerEvent }`: `clientX`, `clientY` hiện tại, của lần nhấn, và hiệu của chúng; người gọi tự cộng phần cuộn của khung riêng.
  - **Hợp đồng callback** (Task 4, Plan C và E dựa vào):
    1. Lần nhấn hợp lệ là nút chính (`button` 0), con trỏ chính, `pointerType` được phép, và không phải chuột có `ctrlKey` trên Apple (đó là chuột phải). Nó huỷ một cử chỉ cũ chưa kết thúc, gọi `onPress(event)`, capture con trỏ (`try/catch`) và nghe trên `document`.
    2. Thả hay `pointercancel` trước ngưỡng: không callback nào nữa.
    3. Sự kiện đầu tiên đạt `threshold`: `onStart(info)`, rồi đồng bộ `onMove(info)` với cùng `info`, trừ khi `onStart` đã kết thúc cử chỉ. `onStart` chỉ để dựng trạng thái "đang kéo"; mọi vị trí được đặt ở `onMove`.
    4. Sau đó `onMove` được gộp mỗi khung hình (`requestAnimationFrame`), sự kiện cuối thắng.
    5. Thả sau khi đã kéo: lần di đang chờ được đẩy qua `onMove`, rồi `onEnd(info)` với vị trí lúc thả.
    6. Esc (khi `cancelOnEscape`), `pointercancel`, `lostpointercapture` trước khi thả, hay một lần nhấn mới: `onCancel(info)` với `info` cuối cùng đã báo, chỉ khi cử chỉ đã thành kéo; lần di đang chờ bị bỏ. `onCancel` không có tham số lý do.
    7. Kết thúc, huỷ, nhấn mới, unmount: mọi listener, khung hình và capture được nhả; một lần kéo đang dở lúc unmount kết thúc lặng lẽ, không callback nào.
    8. Callback và tuỳ chọn được đọc từ lần render mới nhất (một ref), nên callback mới của cha không khởi động lại lần kéo.
- Produces trong `src/internal/icons.tsx`: `GripIcon(props: SVGProps<SVGSVGElement>)`: `strokeIcon`, `viewBox="0 0 8 14"`, `fill="currentColor"`, `stroke="none"`, sáu `circle` `r="1.4"` tại (1.5, 1.5), (6.5, 1.5), (1.5, 7), (6.5, 7), (1.5, 12.5), (6.5, 12.5); props của người gọi ghi đè được.
- Consumes: `isApplePlatform` (`platform.ts`), `isComposing` (`roving.ts`), `useIsoLayoutEffect`, `strokeIcon`.
- Task sau dùng: Task 4 (`useMovable`, `threshold: 3`, `cancelOnEscape: false`; `GripIcon` làm tay nắm của `DialogHeader`). Plan C (đổi độ rộng cột, kéo cột với `pointerTypes: ['mouse', 'pen']`), Plan E (kéo chip của thanh nhóm, kéo dòng; `GripIcon` trên tay nắm kéo dòng).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index a1df6f5..4b8ba05 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -11,6 +11,7 @@ import {
   CloseIcon,
   ExclamationIcon,
   FileIcon,
+  GripIcon,
   MenuIcon,
   MinusIcon,
   MonitorIcon,
@@ -248,6 +249,27 @@ describe('shared icons', () => {
     expect(svg.getAttribute('class')).toBe('x');
   });
 
+  it('GripIcon draws six filled dots in an 8x14 box and is hidden', () => {
+    const { container } = render(<GripIcon className="flg-dialog-grip" />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 8 14');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    expect(svg.getAttribute('focusable')).toBe('false');
+    expect(svg.getAttribute('class')).toBe('flg-dialog-grip');
+    expect(svg.getAttribute('fill')).toBe('currentColor');
+    expect(svg.getAttribute('stroke')).toBe('none');
+    const dots = [...container.querySelectorAll('circle')];
+    expect(dots.map((dot) => [dot.getAttribute('cx'), dot.getAttribute('cy')])).toEqual([
+      ['1.5', '1.5'],
+      ['6.5', '1.5'],
+      ['1.5', '7'],
+      ['6.5', '7'],
+      ['1.5', '12.5'],
+      ['6.5', '12.5'],
+    ]);
+    expect(dots.every((dot) => dot.getAttribute('r') === '1.4')).toBe(true);
+  });
+
   it('forwards extra props such as className', () => {
     const { container } = render(<ChevronIcon direction="down" className="flg-select-chevron" />);
     expect(container.querySelector('svg')?.getAttribute('class')).toBe('flg-select-chevron');
diff --git a/src/internal/use-pointer-drag.test.tsx b/src/internal/use-pointer-drag.test.tsx
new file mode 100644
index 0000000..2202157
--- /dev/null
+++ b/src/internal/use-pointer-drag.test.tsx
@@ -0,0 +1,391 @@
+import { act, fireEvent, render } from '@testing-library/react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { usePointerDrag } from './use-pointer-drag';
+import type { PointerDragOptions } from './use-pointer-drag';
+
+function Handle(props: PointerDragOptions) {
+  const { onPointerDown } = usePointerDrag(props);
+  return <div data-testid="handle" onPointerDown={onPointerDown} />;
+}
+
+const base = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
+
+function setup(options: PointerDragOptions = {}) {
+  const calls = {
+    onPress: vi.fn(),
+    onStart: vi.fn(),
+    onMove: vi.fn(),
+    onEnd: vi.fn(),
+    onCancel: vi.fn(),
+  };
+  const view = render(<Handle {...calls} {...options} />);
+  const handle = view.getByTestId('handle');
+  return { ...view, handle, calls };
+}
+
+const press = (el: Element, x = 100, y = 100, init: PointerEventInit = {}) =>
+  fireEvent.pointerDown(el, { ...base, clientX: x, clientY: y, ...init });
+const move = (el: Element | Document, x: number, y: number, init: PointerEventInit = {}) =>
+  fireEvent.pointerMove(el, { ...base, clientX: x, clientY: y, ...init });
+const release = (el: Element | Document, x: number, y: number) =>
+  fireEvent.pointerUp(el, { ...base, clientX: x, clientY: y });
+
+// The animation frames the hook asks for, run by hand so a test decides when a frame passes.
+let frames: Map<number, FrameRequestCallback>;
+let nextFrame: number;
+const runFrames = () => {
+  const due = [...frames.values()];
+  frames.clear();
+  act(() => due.forEach((callback) => callback(0)));
+};
+
+describe('usePointerDrag', () => {
+  beforeEach(() => {
+    frames = new Map();
+    nextFrame = 1;
+    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
+      frames.set(nextFrame, callback);
+      return nextFrame++;
+    });
+    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
+  });
+  afterEach(() => vi.unstubAllGlobals());
+
+  it('a press that stays under the threshold is no drag', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    move(handle, 102, 102);
+    release(handle, 102, 102);
+    expect(calls.onPress).toHaveBeenCalledTimes(1);
+    expect(calls.onStart).not.toHaveBeenCalled();
+    expect(calls.onMove).not.toHaveBeenCalled();
+    expect(calls.onEnd).not.toHaveBeenCalled();
+    expect(calls.onCancel).not.toHaveBeenCalled();
+  });
+
+  it('the threshold is a distance, not a limit per axis', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    // 3px on each axis is under 4px per axis but 4.24px away.
+    move(handle, 103, 103);
+    expect(calls.onStart).toHaveBeenCalledTimes(1);
+  });
+
+  it('a custom threshold applies, and a distance just under it does not start', () => {
+    const { handle, calls } = setup({ threshold: 10 });
+    press(handle);
+    move(handle, 108, 105);
+    expect(calls.onStart).not.toHaveBeenCalled();
+    move(handle, 108, 106);
+    expect(calls.onStart).toHaveBeenCalledTimes(1);
+  });
+
+  it('the event that crosses the threshold reaches onMove at once, after onStart', () => {
+    const order: string[] = [];
+    const { handle, calls } = setup({
+      onStart: (info) => order.push(`start ${info.dx},${info.dy}`),
+      onMove: (info) => order.push(`move ${info.dx},${info.dy}`),
+    });
+    press(handle, 50, 60);
+    move(handle, 56, 63);
+    // No frame has run: the first visible move is not delayed.
+    expect(frames.size).toBe(0);
+    expect(order).toEqual(['start 6,3', 'move 6,3']);
+    expect(calls.onEnd).not.toHaveBeenCalled();
+  });
+
+  it('onStart reports the press point, the position and the distance travelled', () => {
+    const { handle, calls } = setup();
+    press(handle, 50, 60);
+    move(handle, 56, 60);
+    expect(calls.onStart).toHaveBeenCalledWith(
+      expect.objectContaining({
+        x: 56,
+        y: 60,
+        startX: 50,
+        startY: 60,
+        dx: 6,
+        dy: 0,
+        pointerId: 1,
+        pointerType: 'mouse',
+      }),
+    );
+    expect(calls.onMove).toHaveBeenCalledTimes(1);
+  });
+
+  it('coalesces moves per frame, the last wins, and flushes before onEnd', () => {
+    const order: string[] = [];
+    const { handle, calls } = setup({
+      onMove: (info) => order.push(`move ${info.x}`),
+      onEnd: (info) => order.push(`end ${info.x}`),
+    });
+    press(handle);
+    move(handle, 110, 100);
+    move(handle, 120, 100);
+    move(handle, 130, 100);
+    expect(frames.size).toBe(1);
+    runFrames();
+    expect(order).toEqual(['move 110', 'move 130']);
+    move(handle, 140, 100);
+    move(handle, 150, 100);
+    release(handle, 150, 100);
+    expect(order).toEqual(['move 110', 'move 130', 'move 150', 'end 150']);
+    expect(frames.size).toBe(0);
+    expect(calls.onCancel).not.toHaveBeenCalled();
+  });
+
+  it('the document follows the pointer when the capture is not in effect', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    move(document, 120, 100);
+    release(document, 120, 100);
+    expect(calls.onStart).toHaveBeenCalledTimes(1);
+    expect(calls.onEnd).toHaveBeenCalledTimes(1);
+  });
+
+  it('captures the pointer on a press and lets go on the release', () => {
+    const { handle } = setup();
+    const capture = vi.fn();
+    const letGo = vi.fn();
+    handle.setPointerCapture = capture;
+    handle.hasPointerCapture = () => true;
+    handle.releasePointerCapture = letGo;
+    press(handle);
+    expect(capture).toHaveBeenCalledWith(1);
+    move(handle, 120, 100);
+    release(handle, 120, 100);
+    expect(letGo).toHaveBeenCalledWith(1);
+  });
+
+  it('a pointer that cannot be captured still drags', () => {
+    const { handle, calls } = setup();
+    handle.setPointerCapture = () => {
+      throw new DOMException('gone', 'NotFoundError');
+    };
+    press(handle);
+    move(handle, 120, 100);
+    release(handle, 120, 100);
+    expect(calls.onEnd).toHaveBeenCalledTimes(1);
+  });
+
+  it('filters by pointer type and ignores the press whole', () => {
+    const { handle, calls } = setup({ pointerTypes: ['mouse', 'pen'] });
+    press(handle, 100, 100, { pointerType: 'touch' });
+    move(handle, 140, 100, { pointerType: 'touch' });
+    expect(calls.onPress).not.toHaveBeenCalled();
+    expect(calls.onStart).not.toHaveBeenCalled();
+    press(handle, 100, 100, { pointerType: 'pen' });
+    move(handle, 140, 100, { pointerType: 'pen' });
+    expect(calls.onStart).toHaveBeenCalledTimes(1);
+  });
+
+  it('ignores a secondary button and a non-primary pointer', () => {
+    const { handle, calls } = setup();
+    press(handle, 100, 100, { button: 2 });
+    press(handle, 100, 100, { isPrimary: false, pointerId: 2 });
+    move(handle, 140, 100);
+    expect(calls.onPress).not.toHaveBeenCalled();
+    expect(calls.onStart).not.toHaveBeenCalled();
+  });
+
+  it('follows only the pointer that pressed', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    move(handle, 140, 100, { pointerId: 2, isPrimary: false });
+    expect(calls.onStart).not.toHaveBeenCalled();
+  });
+
+  describe('Ctrl and the mouse', () => {
+    afterEach(() => vi.restoreAllMocks());
+
+    it('is a right click on Apple and does not drag', () => {
+      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
+      const { handle, calls } = setup();
+      press(handle, 100, 100, { ctrlKey: true });
+      expect(calls.onPress).not.toHaveBeenCalled();
+    });
+
+    it('is a plain press elsewhere', () => {
+      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
+      const { handle, calls } = setup();
+      press(handle, 100, 100, { ctrlKey: true });
+      expect(calls.onPress).toHaveBeenCalledTimes(1);
+    });
+
+    it('does not apply to touch on Apple', () => {
+      vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
+      const { handle, calls } = setup();
+      press(handle, 100, 100, { ctrlKey: true, pointerType: 'touch' });
+      expect(calls.onPress).toHaveBeenCalledTimes(1);
+    });
+  });
+
+  it('onPress can prevent the default of the press', () => {
+    const { handle } = setup({ onPress: (event) => event.preventDefault() });
+    expect(press(handle)).toBe(false);
+  });
+
+  describe('Esc', () => {
+    const esc = (init: KeyboardEventInit = {}) =>
+      fireEvent.keyDown(document.body, { key: 'Escape', ...init });
+
+    it('cancels a drag that has begun, prevents the key, and ends the drag for good', () => {
+      const { handle, calls } = setup();
+      press(handle);
+      move(handle, 120, 100);
+      expect(esc()).toBe(false);
+      expect(calls.onCancel).toHaveBeenCalledTimes(1);
+      expect(calls.onCancel).toHaveBeenCalledWith(expect.objectContaining({ x: 120 }));
+      move(handle, 160, 100);
+      release(handle, 160, 100);
+      expect(calls.onMove).toHaveBeenCalledTimes(1);
+      expect(calls.onEnd).not.toHaveBeenCalled();
+    });
+
+    it('is heard in the capture phase, before a handler that stops it', () => {
+      const { handle, calls } = setup();
+      const bubble = (event: Event) => event.stopPropagation();
+      document.body.addEventListener('keydown', bubble);
+      try {
+        press(handle);
+        move(handle, 120, 100);
+        esc();
+        expect(calls.onCancel).toHaveBeenCalledTimes(1);
+      } finally {
+        document.body.removeEventListener('keydown', bubble);
+      }
+    });
+
+    it('does nothing before a press, before the threshold, and after the end', () => {
+      const { handle, calls } = setup();
+      expect(esc()).toBe(true);
+      press(handle);
+      move(handle, 101, 100);
+      expect(esc()).toBe(true);
+      move(handle, 120, 100);
+      release(handle, 120, 100);
+      expect(esc()).toBe(true);
+      expect(calls.onCancel).not.toHaveBeenCalled();
+    });
+
+    it('is left alone with cancelOnEscape false', () => {
+      const { handle, calls } = setup({ cancelOnEscape: false });
+      press(handle);
+      move(handle, 120, 100);
+      expect(esc()).toBe(true);
+      expect(calls.onCancel).not.toHaveBeenCalled();
+      release(handle, 120, 100);
+      expect(calls.onEnd).toHaveBeenCalledTimes(1);
+    });
+
+    it('belongs to the input method during a composition', () => {
+      const { handle, calls } = setup();
+      press(handle);
+      move(handle, 120, 100);
+      expect(esc({ isComposing: true })).toBe(true);
+      expect(esc({ keyCode: 229 })).toBe(true);
+      expect(calls.onCancel).not.toHaveBeenCalled();
+    });
+  });
+
+  it('pointercancel after the start is a cancel, and before it is nothing', () => {
+    const early = setup();
+    press(early.handle);
+    fireEvent.pointerCancel(early.handle, { ...base });
+    expect(early.calls.onCancel).not.toHaveBeenCalled();
+    early.unmount();
+
+    const { handle, calls } = setup();
+    press(handle);
+    move(handle, 120, 100);
+    fireEvent.pointerCancel(handle, { ...base });
+    expect(calls.onCancel).toHaveBeenCalledTimes(1);
+    release(handle, 120, 100);
+    expect(calls.onEnd).not.toHaveBeenCalled();
+  });
+
+  it('lostpointercapture before the release is a cancel; a release after it does nothing', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    move(handle, 120, 100);
+    fireEvent.lostPointerCapture(handle, { ...base });
+    expect(calls.onCancel).toHaveBeenCalledTimes(1);
+    release(handle, 120, 100);
+    expect(calls.onEnd).not.toHaveBeenCalled();
+    expect(calls.onCancel).toHaveBeenCalledTimes(1);
+  });
+
+  it('lostpointercapture after a release is not a cancel', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    move(handle, 120, 100);
+    release(handle, 120, 100);
+    fireEvent.lostPointerCapture(handle, { ...base });
+    expect(calls.onEnd).toHaveBeenCalledTimes(1);
+    expect(calls.onCancel).not.toHaveBeenCalled();
+  });
+
+  it('a cancel drops a pending move', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    move(handle, 120, 100);
+    move(handle, 130, 100);
+    fireEvent.pointerCancel(handle, { ...base });
+    expect(frames.size).toBe(0);
+    // Only the crossing event was reported; the pending 130 is dropped, not flushed.
+    expect(calls.onMove).toHaveBeenCalledTimes(1);
+    expect(calls.onMove).toHaveBeenCalledWith(expect.objectContaining({ x: 120 }));
+  });
+
+  it('reads the latest callbacks, so new ones never restart a drag', () => {
+    const first = vi.fn();
+    const second = vi.fn();
+    const { handle, rerender, calls } = setup({ onEnd: first });
+    press(handle);
+    move(handle, 120, 100);
+    rerender(<Handle {...calls} onEnd={second} threshold={50} />);
+    release(handle, 120, 100);
+    expect(first).not.toHaveBeenCalled();
+    expect(second).toHaveBeenCalledTimes(1);
+    expect(calls.onStart).toHaveBeenCalledTimes(1);
+  });
+
+  it('a drag in flight at unmount ends quietly and leaves nothing behind', () => {
+    const add = vi.spyOn(document, 'addEventListener');
+    const remove = vi.spyOn(document, 'removeEventListener');
+    try {
+      const { handle, calls, unmount } = setup();
+      press(handle);
+      move(handle, 120, 100);
+      move(handle, 130, 100);
+      expect(frames.size).toBe(1);
+      expect(calls.onMove).toHaveBeenCalledTimes(1);
+      unmount();
+      expect(frames.size).toBe(0);
+      move(document, 150, 100);
+      release(document, 150, 100);
+      fireEvent.keyDown(document.body, { key: 'Escape' });
+      runFrames();
+      // Only the crossing event, reported before the unmount.
+      expect(calls.onMove).toHaveBeenCalledTimes(1);
+      expect(calls.onEnd).not.toHaveBeenCalled();
+      expect(calls.onCancel).not.toHaveBeenCalled();
+      const added = add.mock.calls.map(([type]) => type).sort();
+      const removed = remove.mock.calls.map(([type]) => type).sort();
+      expect(added).toEqual(removed);
+    } finally {
+      add.mockRestore();
+      remove.mockRestore();
+    }
+  });
+
+  it('a new press replaces a drag whose end never came, and cancels it', () => {
+    const { handle, calls } = setup();
+    press(handle);
+    move(handle, 120, 100);
+    press(handle, 300, 300);
+    expect(calls.onCancel).toHaveBeenCalledTimes(1);
+    move(handle, 320, 300);
+    expect(calls.onStart).toHaveBeenCalledTimes(2);
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/use-pointer-drag.test.tsx src/internal/icons.test.tsx
```

Expected: FAIL.
- `use-pointer-drag.test.tsx` (cả hai project React) không nạp được (`Failed to resolve import "./use-pointer-drag" from "src/internal/use-pointer-drag.test.tsx". Does the file exist?`), nên không test nào của nó chạy.
- `icons.test.tsx`: `GripIcon draws six filled dots in an 8x14 box and is hidden` fail (`Element type is invalid … got: undefined`); các test icon khác pass.

Theo báo cáo của bản nháp (phát hiện 12, 20): hai file được viết trước và fail như trên. Sau khi có module, một test tự tính sai một lần (ngưỡng 10: 9.43px chưa bắt đầu, 10px thì có) và được sửa trong test. Ở lần trả lại, test `the event that crosses the threshold reaches onMove at once, after onStart` fail trên code cũ (thứ tự chỉ có `start 6,3`), và bốn test ghim hợp đồng cũ được sửa theo hợp đồng mới.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index caf8987..1f69bce 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -250,3 +250,20 @@ export function MonitorIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+/**
+ * Six dots in two columns, in an 8x14 box: the grip of a movable Dialog and, later, of a DataGrid
+ * row. Filled and not stroked, so it takes the colour of the text around it.
+ */
+export function GripIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} viewBox="0 0 8 14" fill="currentColor" stroke="none" {...props}>
+      <circle cx="1.5" cy="1.5" r="1.4" />
+      <circle cx="6.5" cy="1.5" r="1.4" />
+      <circle cx="1.5" cy="7" r="1.4" />
+      <circle cx="6.5" cy="7" r="1.4" />
+      <circle cx="1.5" cy="12.5" r="1.4" />
+      <circle cx="6.5" cy="12.5" r="1.4" />
+    </svg>
+  );
+}
diff --git a/src/internal/use-pointer-drag.ts b/src/internal/use-pointer-drag.ts
new file mode 100644
index 0000000..53c17fa
--- /dev/null
+++ b/src/internal/use-pointer-drag.ts
@@ -0,0 +1,269 @@
+import { useCallback, useEffect, useRef } from 'react';
+import type { PointerEvent as ReactPointerEvent } from 'react';
+import { isApplePlatform } from './platform';
+import { isComposing } from './roving';
+import { useIsoLayoutEffect } from './use-iso-layout-effect';
+
+/**
+ * Where a drag is, as every callback after the press receives it. Distances are in CSS pixels of the
+ * viewport (`clientX` / `clientY`), so a caller that scrolls its own container adds the scroll itself.
+ */
+export interface PointerDragInfo {
+  /** The pointer's `clientX` / `clientY` now. */
+  x: number;
+  y: number;
+  /** The `clientX` / `clientY` of the press that began the gesture, before the threshold. */
+  startX: number;
+  startY: number;
+  /** `x - startX` and `y - startY`: how far the pointer has travelled from the press. */
+  dx: number;
+  dy: number;
+  /** The `pointerId` and `pointerType` of the pointer that is dragging. */
+  pointerId: number;
+  pointerType: string;
+  /** The native event behind this report, for its modifier keys or `timeStamp`. */
+  event: PointerEvent;
+}
+
+export interface PointerDragOptions {
+  /**
+   * The `pointerType`s that may start a drag, such as `['mouse', 'pen']` for a drag that would fight
+   * a finger's scroll. A press of any other type is ignored whole: not even `onPress` runs.
+   * Default: every type.
+   */
+  pointerTypes?: readonly string[];
+  /**
+   * How far, in pixels, the pointer must travel from the press, measured as a straight-line
+   * distance and not per axis, before the press becomes a drag. A press released before that is
+   * a plain click and none of the drag callbacks run. Default 4.
+   */
+  threshold?: number;
+  /**
+   * Whether Esc, while a drag is in flight, cancels it: `preventDefault` is called on the key and
+   * `onCancel` runs. Esc during an input method's composition is left to the input method. Pass
+   * `false` when Esc must keep its own meaning, such as closing the dialog that is being dragged.
+   * Default `true`.
+   */
+  cancelOnEscape?: boolean;
+  /**
+   * A qualifying press, called with React's `pointerdown` event before anything is tracked. Call
+   * `preventDefault()` on it to keep the browser from moving focus or starting a text selection;
+   * the drag goes on either way.
+   */
+  onPress?: (event: ReactPointerEvent<HTMLElement>) => void;
+  /**
+   * The press became a drag: the pointer has travelled past `threshold`. Called once per drag,
+   * for setting up the dragging state only. It carries the position of the event that crossed the
+   * threshold, but `onMove` runs for that same event right after it with the same `info`, so
+   * apply positions in `onMove` alone.
+   */
+  onStart?: (info: PointerDragInfo) => void;
+  /**
+   * The one place that applies a position. It runs synchronously for the event that crossed the
+   * threshold, straight after `onStart`; after that it is coalesced to one call per animation
+   * frame, with the last event of the frame, and a pending one is flushed just before `onEnd`,
+   * so the last position is never lost.
+   */
+  onMove?: (info: PointerDragInfo) => void;
+  /** The pointer was released after a drag began; `info` is the final position. */
+  onEnd?: (info: PointerDragInfo) => void;
+  /**
+   * The drag was cancelled after it began: Esc (see `cancelOnEscape`), `pointercancel` (the browser
+   * took the pointer, for instance a touch that became a scroll) or `lostpointercapture` before the
+   * release. `info` is the last position reported. A press that is over before the threshold is
+   * never a cancel, and nothing is called once the component has unmounted.
+   */
+  onCancel?: (info: PointerDragInfo) => void;
+}
+
+/** What the hook returns: the one handler to put on the element that can be pressed to drag. */
+export interface PointerDragHandlers {
+  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
+}
+
+/** A gesture from its press to its end. */
+interface Gesture {
+  target: HTMLElement;
+  pointerId: number;
+  pointerType: string;
+  startX: number;
+  startY: number;
+  started: boolean;
+  /** The last event received, which `onMove` has not reported yet. */
+  pending: PointerEvent | null;
+  /** What the callbacks last saw, for `onCancel`. */
+  last: PointerDragInfo | null;
+  frame: number | null;
+  /** Removes the listeners the gesture added. */
+  stop: () => void;
+}
+
+const DEFAULT_THRESHOLD = 4;
+
+function infoOf(gesture: Gesture, event: PointerEvent): PointerDragInfo {
+  return {
+    x: event.clientX,
+    y: event.clientY,
+    startX: gesture.startX,
+    startY: gesture.startY,
+    dx: event.clientX - gesture.startX,
+    dy: event.clientY - gesture.startY,
+    pointerId: gesture.pointerId,
+    pointerType: gesture.pointerType,
+    event,
+  };
+}
+
+/**
+ * One drag with a pointer: a press, a threshold that tells a drag from a click, moves, and an end
+ * or a cancel. It captures the pointer, so the drag goes on outside the element and over iframes,
+ * and listens on the document for the rest, so it needs no handler but `onPointerDown`. Only the
+ * primary pointer and the main button count (on Apple, a mouse press with Ctrl is a right click).
+ * It is the shared base of the movable Dialog and of the DataGrid's column resize, column drag,
+ * group chips and row drag.
+ *
+ * The callbacks are read from the latest render, so a parent that passes new ones never restarts a
+ * drag. Every listener, animation frame and capture it took is released when the drag ends, is
+ * cancelled or the component unmounts; a drag in flight at unmount ends quietly, with no callback.
+ */
+export function usePointerDrag(options: PointerDragOptions): PointerDragHandlers {
+  const latest = useRef(options);
+  useIsoLayoutEffect(() => {
+    latest.current = options;
+  });
+  const gesture = useRef<Gesture | null>(null);
+
+  /** Releases everything the gesture took and forgets it; reports nothing. */
+  const release = useCallback(() => {
+    const current = gesture.current;
+    gesture.current = null;
+    if (!current) return;
+    if (current.frame !== null) cancelAnimationFrame(current.frame);
+    current.stop();
+    try {
+      if (current.target.hasPointerCapture?.(current.pointerId)) {
+        current.target.releasePointerCapture(current.pointerId);
+      }
+    } catch {
+      // The pointer is gone already, and so is its capture.
+    }
+  }, []);
+
+  useEffect(() => release, [release]);
+
+  const cancel = useCallback(() => {
+    const current = gesture.current;
+    if (!current) return;
+    release();
+    // A press that never reached the threshold was not a drag, so there is nothing to cancel.
+    if (current.started && current.last) latest.current.onCancel?.(current.last);
+  }, [release]);
+
+  const onPointerDown = useCallback(
+    (event: ReactPointerEvent<HTMLElement>) => {
+      const { pointerTypes, onPress } = latest.current;
+      if (event.button > 0 || event.isPrimary === false) return;
+      if (pointerTypes && !pointerTypes.includes(event.pointerType)) return;
+      // A Ctrl press of the mouse is a right click on Apple systems, and `button` says 0 for it.
+      if (event.pointerType === 'mouse' && event.ctrlKey && isApplePlatform()) return;
+
+      // A new press of the primary pointer replaces a drag whose end never came.
+      cancel();
+      onPress?.(event);
+
+      const target = event.currentTarget;
+      const next: Gesture = {
+        target,
+        pointerId: event.pointerId,
+        pointerType: event.pointerType,
+        startX: event.clientX,
+        startY: event.clientY,
+        started: false,
+        pending: null,
+        last: null,
+        frame: null,
+        stop: () => {},
+      };
+      gesture.current = next;
+      try {
+        target.setPointerCapture?.(event.pointerId);
+      } catch {
+        // A pointer that is gone already (a synthetic one) cannot be captured; the document
+        // listeners still follow it.
+      }
+
+      const flush = () => {
+        next.frame = null;
+        const pending = next.pending;
+        next.pending = null;
+        if (!pending) return;
+        next.last = infoOf(next, pending);
+        latest.current.onMove?.(next.last);
+      };
+
+      const onMove = (move: PointerEvent) => {
+        if (move.pointerId !== next.pointerId) return;
+        if (!next.started) {
+          const distance = Math.hypot(move.clientX - next.startX, move.clientY - next.startY);
+          if (distance < (latest.current.threshold ?? DEFAULT_THRESHOLD)) return;
+          next.started = true;
+          next.last = infoOf(next, move);
+          latest.current.onStart?.(next.last);
+          // The crossing event is a move too, and is not held back for a frame. `onStart` may
+          // have ended the gesture (an unmount, a cancel), and then there is nothing to move.
+          if (gesture.current === next) latest.current.onMove?.(next.last);
+          return;
+        }
+        next.pending = move;
+        next.frame ??= requestAnimationFrame(flush);
+      };
+
+      const onUp = (up: PointerEvent) => {
+        if (up.pointerId !== next.pointerId) return;
+        // Read before releasing: the callbacks may unmount the component or start another press.
+        const { started, pending } = next;
+        release();
+        if (!started) return;
+        const { onMove: report, onEnd } = latest.current;
+        if (pending) report?.(infoOf(next, pending));
+        onEnd?.(infoOf(next, up));
+      };
+
+      const onPointerCancel = (other: PointerEvent) => {
+        if (other.pointerId === next.pointerId) cancel();
+      };
+
+      const onKeyDown = (key: KeyboardEvent) => {
+        if (key.key !== 'Escape' || !next.started) return;
+        if (latest.current.cancelOnEscape === false) return;
+        if (isComposing({ nativeEvent: key })) return;
+        key.preventDefault();
+        cancel();
+      };
+
+      // The capture can be lost without a release (the element left the DOM, another element took
+      // the pointer). After a normal release `release()` has removed this listener already, so the
+      // `lostpointercapture` that follows it is not a cancel.
+      const onLostCapture = (lost: PointerEvent) => {
+        if (lost.pointerId === next.pointerId) cancel();
+      };
+
+      const doc = target.ownerDocument;
+      doc.addEventListener('pointermove', onMove);
+      doc.addEventListener('pointerup', onUp);
+      doc.addEventListener('pointercancel', onPointerCancel);
+      doc.addEventListener('keydown', onKeyDown, true);
+      target.addEventListener('lostpointercapture', onLostCapture);
+      next.stop = () => {
+        doc.removeEventListener('pointermove', onMove);
+        doc.removeEventListener('pointerup', onUp);
+        doc.removeEventListener('pointercancel', onPointerCancel);
+        doc.removeEventListener('keydown', onKeyDown, true);
+        target.removeEventListener('lostpointercapture', onLostCapture);
+      };
+    },
+    [cancel, release],
+  );
+
+  return { onPointerDown };
+}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 658 test PASS, 3 skip (62 file, hai project React cộng lại).
- Không chạy `scripts`, story, `check:contrast` hay `build`: task này không đổi export, CSS, token hay story nào, và chưa component nào dùng hai phần mới.

- [ ] **Step 5: Commit**

```bash
git add \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx \
  src/internal/use-pointer-drag.test.tsx \
  src/internal/use-pointer-drag.ts
```
```bash
git commit -m "feat(internal): usePointerDrag and GripIcon" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: `DialogContent movable` (D2), `data-visual-drag` và ngưỡng kích thước

Spec §1 (dòng "Dialog kéo được"; dòng "Thay đổi ở component cũ", phần `DialogContent movable` và lớp `flg-dialog-header`; dòng "Kiểm thử", phần harness), §2 (dòng A; "Thay đổi ở code cũ", phần `Dialog.tsx`, `modal.tsx`, `dialog.css`, `tests/visual/stories.visual.ts`), §3.1 (dòng DialogContent, DialogHeader), §3.4 trọn mục, §3.8 (dòng "Kéo hộp thoại `movable`"), §3.9 (dòng Dialog), §3.10 (dòng Dialog), §4.1 (D2), §4.2 (`--flg-dialog-lift-shadow`), §4.3 **Dialog kéo được (D2)**, §4.4 (`dialog-grip`), §4.5 "Dialog kéo được", §5 (`dialog/use-movable.ts`, thay đổi của `DialogContent`, `DialogHeader`, cảnh báo), §6.3 `DialogContent` (chỉ `movable`), §7 (lớp 1 và 2 cho Dialog, bốn story giao diện, "Harness visual", "Test kiểu" `movable`, `theme-css.test.ts`, `check:dist-css` `flg-dialog-header`, `flg-dialog-grip`), §8 (`Dialog.mdx` "Movable", ghi chú Accessibility; `size-limit`), §10 (dòng WCAG 2.5.7). Mockup d2 (`phase-6-kbd-dialog.html`). Task này kết thúc bằng kiểm tra cuối của cả nhánh.
- **`use-movable.ts`** trên `usePointerDrag` của Task 3: lọc lần nhấn, `preventDefault`, kẹp, `ResizeObserver`, `dblclick` về giữa, dưới 640px trả lại mọi thứ; `pointercancel` giữ vị trí (phát hiện 13).
- **`DialogContent movable`**, `ModalMovableContext` của `modal.tsx`, `DialogHeader` với lớp `flg-dialog-header`, `data-movable` và tay nắm; Drawer không đổi; cảnh báo khi thiếu `DialogHeader` (phát hiện 13).
- **CSS và token:** D2 trong `dialog.css`; forced colors và giảm chuyển động trong `preferences.css`; `--flg-dialog-lift-shadow` trong `values.ts` và bảng `MOCKUP` của `theme-css.test.ts`; check `dialog-grip` (phát hiện 14).
- **Harness visual:** `data-visual-drag` (phát hiện 17).
- **Story:** bốn story giao diện (`DialogMovable`, `DialogMovableHover`, `DialogMovableDragging`, `DialogMovablePhone`); mười story hành vi gắn `no-visual` (`MovableDragsByTheHeader`, `MovableStopsAtEveryEdge`, `MovableStaysInsideASmallerWindow`, `MovableCentresBelow640AndStaysThere`, `MovableLetGoOutsideStaysOpen`, `MovableLeavesHeaderButtonsAlone`, `MovableCentresOnADoubleClick`, `MovableKeepsTheFocus`, `MovableEscClosesInTheMiddleOfADrag`, `MovableFollowsATouch`) (phát hiện 15, 16).
- **Docs:** `Dialog.mdx` "Movable" và "Why there is no key to move it", mục "A movable Dialog" của trang Accessibility (phát hiện 18).
- **Ngưỡng kích thước** cho cả Plan A, ghi bằng `pnpm size:record` (không chép `.size-limit.json`).
- Không sửa dòng spec nào.

**Files:**
- Create: `src/components/dialog/use-movable.ts`
- Modify: `src/components/dialog/Dialog.tsx`, `src/components/dialog/modal.tsx`, `src/components/dialog/Dialog.test.tsx`, `src/components/dialog/Dialog.test-d.ts`, `src/components/dialog/Dialog.stories.tsx`, `src/components/dialog/Dialog.mdx`, `src/styles/components/dialog.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `scripts/lib/theme-css.test.ts`, `scripts/check-dist-css.ts`, `tests/visual/stories.visual.ts`, `src/docs/Accessibility.mdx`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- Đổi trong `src/components/dialog/Dialog.tsx` (client), export như cũ:
  - `DialogContentProps extends ModalContentProps { size?: DialogSize; alert?: boolean; movable?: boolean }`; `movable` mặc định `false`. `DialogContent` đặt `data-movable` trên panel (qua `panelData`, sau props của người gọi) và truyền `movable` cho `ModalContent`.
  - `DialogHeader` (kiểu không đổi, `HTMLAttributes<HTMLDivElement>`): luôn có lớp `flg-card-header flg-dialog-header`; trong một `DialogContent movable`: `data-movable=""` sau props của người gọi, con đầu là `<GripIcon className="flg-dialog-grip" />`, `onPointerDown` và `onDoubleClick` của người gọi ghép trước handler kéo (`composeEventHandlers`).
- Nội bộ:
  - `src/components/dialog/modal.tsx`: `ModalContent` nhận `movable?: boolean | undefined` (chỉ Dialog truyền); `ModalMovableContext` (`MovableHeaderHandlers | null`, null ở Dialog không kéo được và ở Drawer); `useModalMovable()`.
  - `src/components/dialog/use-movable.ts`: `MovableOptions = { enabled: boolean; open: boolean; dialogRef: RefObject<HTMLDialogElement | null>; panelRef: RefObject<HTMLDivElement | null> }`; `MovableHeaderHandlers = { onPointerDown: (event: PointerEvent<HTMLElement>) => void; onDoubleClick: (event: MouseEvent<HTMLElement>) => void }`; `useMovable(options): MovableHeaderHandlers`. Hằng số: `--flg-dialog-x`, `--flg-dialog-y`, `MARGIN = 16`, `WIDE = '(min-width: 640px)'`, `INTERACTIVE` (selector của spec §3.4).
- DOM: `dialog.flg-dialog[data-kind="dialog"][data-dragging]` (chỉ trong lúc kéo) > `div.flg-dialog-panel[data-size][data-movable]` (`style` có `--flg-dialog-x`, `--flg-dialog-y` sau khi kéo) > `div.flg-card-header.flg-dialog-header[data-movable]` > `svg.flg-dialog-grip[aria-hidden="true"]` rồi con của người gọi.
- Cảnh báo dev: `<DialogContent movable> needs a <DialogHeader> to drag it by.`
- CSS: `flg-dialog-header`, `flg-dialog-grip` (có trong `check-dist-css.ts`); quy tắc D2 trong `@media (min-width: 640px)` của `dialog.css`; token `--flg-dialog-lift-shadow` (light `0 6px 14px rgba(0,0,0,.08), 0 36px 80px rgba(60,95,210,.45)`, dark `0 8px 18px rgba(0,0,0,.45), 0 40px 90px rgba(0,0,0,.85)`).
- `scripts/lib/contrast.ts`: `CHECKS` thêm `'dialog-grip': 3`. Không có ngoại lệ mới.
- Harness: `tests/visual/stories.visual.ts` nhận `data-visual-drag="dx,dy"` trên phần tử đầu tiên mang nó (phát hiện 17).
- Story: trong `Dialog.stories.tsx`, helper `OrdersPage`, `OrderDialog({ header, help })`, `panelOf`, `titleOf`, `dragTo`, `boxOf`, `same`; `withViewport` của `.storybook/viewport.ts`, `realUserEvent`, `settled`.
- Consumes: `usePointerDrag`, `GripIcon` (Task 3), `useMediaQuery`, `clamp` (`number.ts`), `composeEventHandlers`, `devWarn`; trong story: `Card`, `Table` và các phần của nó, `Field`, `Input`, `Select`, `SelectItem`.
- Task sau dùng: Plan F thêm `fullScreenOnPhone` cạnh `movable` (cùng `Dialog.tsx`, `modal.tsx`, `dialog.css`); popup sửa dữ liệu của DataGrid (Plan F) truyền `movable` khi `editing.popup.movable` (mặc định `false`); `data-visual-drag` chụp các story đang kéo của Plan C và E.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index d363d67..5a11d0b 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -495,3 +495,49 @@ describe('the key of a Kbd (spec phase 6 §4.4)', () => {
     expect(measure(values, 'dark', 'default')['kbd-text']).toBe(3.31);
   });
 });
+
+describe('the grip of a movable Dialog (spec phase 6 §4.4)', () => {
+  const CHECK = 'dialog-grip';
+
+  it('is a check at 3:1', () => {
+    expect(CHECKS[CHECK]).toBe(3);
+  });
+
+  // The numbers are the spec's: the lower of the grip at rest (`--flg-text-muted`) and while dragging
+  // (`--flg-accent-text`), on the panel over the plain glass and over the page darkened by the scrim.
+  it.each([
+    ['light', 'default', 3.95],
+    ['dark', 'default', 4.1],
+    ['light', 'contrast-more', 5.95],
+    ['dark', 'contrast-more', 9.29],
+  ] as const)('measures %s, %s mode: %s', (theme, mode, expected) => {
+    expect(measure(values, theme, mode)[CHECK]).toBe(expected);
+  });
+
+  it('passes everywhere, with no exception recorded', () => {
+    const { rows } = evaluate(values, KNOWN_EXCEPTIONS);
+    expect(rows.filter((row) => row.check === CHECK).map((row) => row.status)).toEqual([
+      'pass',
+      'pass',
+      'pass',
+      'pass',
+    ]);
+    expect(KNOWN_EXCEPTIONS.filter((exception) => exception.check === CHECK)).toEqual([]);
+  });
+
+  it('measures the grip while dragging too', () => {
+    const patched = {
+      ...values,
+      themes: { ...values.themes, light: { ...values.themes.light, 'accent-text': '#ffffff' } },
+    };
+    expect(measure(patched, 'light', 'default')[CHECK]).toBeLessThan(1.5);
+  });
+
+  it('measures the grip at rest too', () => {
+    const patched = {
+      ...values,
+      themes: { ...values.themes, light: { ...values.themes.light, 'text-muted': '#ffffff' } },
+    };
+    expect(measure(patched, 'light', 'default')[CHECK]).toBeLessThan(1.5);
+  });
+});
diff --git a/scripts/lib/theme-css.test.ts b/scripts/lib/theme-css.test.ts
index bf7f91a..39ba23c 100644
--- a/scripts/lib/theme-css.test.ts
+++ b/scripts/lib/theme-css.test.ts
@@ -51,6 +51,7 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'list-card-shadow': '0 1px 2px #0000000a, 0 6px 16px #3c5fd21f',
     'list-card-shadow-hover': '0 2px 4px #0000000f, 0 12px 26px #3c5fd238',
     'list-card-hover-bg': 'var(--flg-control-bg)',
+    'dialog-lift-shadow': '0 6px 14px rgba(0,0,0,.08), 0 36px 80px rgba(60,95,210,.45)',
     'indicator-accent': 'var(--flg-accent-solid)',
     scrim: 'rgba(15,20,40,.28)',
   },
@@ -81,6 +82,7 @@ const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
     'list-card-shadow': '0 6px 18px #00000047',
     'list-card-shadow-hover': '0 12px 28px #00000073',
     'list-card-hover-bg': 'var(--flg-control-track)',
+    'dialog-lift-shadow': '0 8px 18px rgba(0,0,0,.45), 0 40px 90px rgba(0,0,0,.85)',
     'indicator-accent': 'color-mix(in srgb, var(--flg-accent-start) 78%, #000)',
     scrim: 'rgba(0,0,0,.45)',
   },
diff --git a/src/components/dialog/Dialog.stories.tsx b/src/components/dialog/Dialog.stories.tsx
index 56fd75b..5758a92 100644
--- a/src/components/dialog/Dialog.stories.tsx
+++ b/src/components/dialog/Dialog.stories.tsx
@@ -1,8 +1,11 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
 import { useEffect, useRef, useState } from 'react';
+import type { ComponentProps } from 'react';
 import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
 import { realUserEvent, settled } from '../../../.storybook/real-input';
+import { withViewport } from '../../../.storybook/viewport';
 import { Button } from '../button/Button';
+import { Card } from '../card/Card';
 import {
   DropdownMenu,
   DropdownMenuContent,
@@ -13,6 +16,8 @@ import { Input } from '../input/Input';
 import { MenuItem } from '../menu/Menu';
 import { Radio } from '../radio-group/Radio';
 import { RadioGroup } from '../radio-group/RadioGroup';
+import { Select, SelectItem } from '../select/Select';
+import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
 import {
   Dialog,
   DialogClose,
@@ -484,3 +489,457 @@ export const SkipsADisabledFieldset: Story = {
     ).toHaveFocus();
   },
 };
+
+// ---------------------------------------------------------------------------------------------------
+// A movable dialog (mockup D2, option d2 of phase-6-kbd-dialog.html). The looks are the rows of the
+// mockup: at rest, with the pointer over the header, while it is dragged (the harness presses the
+// header and moves the mouse, through `data-visual-drag`) and on a phone. Lay beside
+// `.superpowers/mockups/shots/d2.png`. The text is the mockup's, in English; the page behind it is the
+// orders table the mockup draws.
+
+const ORDERS = [
+  ['DH-1032', 'Lumen Studio', 'Shipped', '03/11/2026'],
+  ['DH-1030', 'Hoa Binh Market', 'Shipped', '03/11/2026'],
+  ['DH-1029', 'Misty Dawn Coffee', 'Cancelled', '02/11/2026'],
+  ['DH-1028', 'Misty Dawn Coffee', 'Processing', '05/11/2026'],
+  ['DH-1027', 'An Phat Bakery', 'New', '05/11/2026'],
+  ['DH-1026', 'Lumen Studio', 'Shipped', '01/11/2026'],
+] as const;
+
+/** The page the dialog is over, which the scrim blurs. */
+function OrdersPage() {
+  return (
+    <Card aria-hidden="true" style={{ padding: '14px 16px', gap: 8, width: 'min(100%, 880px)' }}>
+      <strong>Orders</strong>
+      <Table size="sm">
+        <TableHeader>
+          <TableRow>
+            <TableHead>Order</TableHead>
+            <TableHead>Customer</TableHead>
+            <TableHead>Status</TableHead>
+            <TableHead>Date</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {ORDERS.map(([id, customer, status, date]) => (
+            <TableRow key={id}>
+              <TableCell>{id}</TableCell>
+              <TableCell>{customer}</TableCell>
+              <TableCell>{status}</TableCell>
+              <TableCell>{date}</TableCell>
+            </TableRow>
+          ))}
+        </TableBody>
+      </Table>
+    </Card>
+  );
+}
+
+/**
+ * The dialog of the mockup. `header` is what goes on its `DialogHeader`, such as an attribute for the
+ * visual harness; `help` adds a button to the header, for the stories about what a press must leave
+ * alone.
+ */
+function OrderDialog({
+  header,
+  help = false,
+}: {
+  header?: ComponentProps<typeof DialogHeader> & Record<`data-${string}`, string>;
+  help?: boolean;
+}) {
+  // The mockup draws no focus ring, so the focus starts on the title, which draws none either.
+  const title = useRef<HTMLHeadingElement>(null);
+  return (
+    <>
+      <OrdersPage />
+      <Dialog defaultOpen>
+        <DialogContent movable size="sm" initialFocus={title}>
+          <DialogHeader {...header}>
+            <DialogTitle ref={title} tabIndex={-1} style={{ outline: 'none' }}>
+              Edit order DH-1028
+            </DialogTitle>
+            <DialogDescription>Placed on 05/11/2026 via the website.</DialogDescription>
+            {help ? (
+              <Button variant="ghost" size="sm" style={{ justifySelf: 'start' }}>
+                Help
+              </Button>
+            ) : null}
+          </DialogHeader>
+          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12 }}>
+            <Field label="Customer">
+              <Input defaultValue="Misty Dawn Coffee" />
+            </Field>
+            <Field label="Status">
+              <Select defaultValue="processing">
+                <SelectItem value="new">New</SelectItem>
+                <SelectItem value="processing">Processing</SelectItem>
+                <SelectItem value="shipped">Shipped</SelectItem>
+              </Select>
+            </Field>
+          </div>
+          <DialogFooter>
+            <DialogClose variant="ghost">Cancel</DialogClose>
+            <DialogClose>Save</DialogClose>
+          </DialogFooter>
+        </DialogContent>
+      </Dialog>
+    </>
+  );
+}
+
+/** (a) At rest, in the middle, with the six-dot grip before the title. */
+export const DialogMovable: Story = { render: () => <OrderDialog /> };
+
+/** (b) The pointer over the header: the grip darkens, and the cursor is the open hand. */
+export const DialogMovableHover: Story = {
+  render: () => <OrderDialog header={{ 'data-visual-hover': '' }} />,
+};
+
+/** (c) Dragged up and left of the middle: lifted, 2% larger, a deeper shadow, the grip in the accent. */
+export const DialogMovableDragging: Story = {
+  render: () => <OrderDialog header={{ 'data-visual-drag': '-112,-34' }} />,
+};
+
+/** (d) On a phone nothing can be dragged: no grip, and the header of any other dialog. */
+export const DialogMovablePhone: Story = {
+  tags: ['viewport-390x844'],
+  render: () => <OrderDialog />,
+};
+
+// Real pointers (layer 2): where the panel goes is layout, and only an engine has it. Under
+// `pnpm test:stories` the press is the browser's own, through Playwright; in the Storybook UI there is
+// none, and each story skips what needs it (real-input.ts). The window is set to 1280x720 first, since
+// the size of the frame Vitest runs a story in is its own and a dialog is not movable below 640px.
+
+const WIDE = { width: 1280, height: 720 };
+const boxOf = (element: Element) => element.getBoundingClientRect();
+const same = (actual: number, expected: number) =>
+  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
+
+/** The panel of the dialog, once its enter animation and any lift have finished. */
+async function panelOf(dialog: HTMLDialogElement) {
+  const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
+  await settled(panel);
+  return panel;
+}
+
+const titleOf = (dialog: HTMLElement) =>
+  within(dialog).getByRole('heading', { name: 'Edit order DH-1028' });
+
+/** Drags `from` to the point (x, y) of the window: the frame of the dialog covers the window. */
+async function dragTo(
+  real: NonNullable<Awaited<ReturnType<typeof realUserEvent>>>,
+  dialog: HTMLDialogElement,
+  from: Element,
+  x: number,
+  y: number,
+) {
+  await real.dragAndDrop(from, dialog, { targetPosition: { x, y } });
+}
+
+export const MovableDragsByTheHeader: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      const title = titleOf(dialog);
+      const before = boxOf(panel);
+      const grab = boxOf(title);
+      // The attribute shows while the button is down; what is left once it is up is the position.
+      let lifted = false;
+      const watch = new MutationObserver(() => {
+        lifted ||= dialog.hasAttribute('data-dragging');
+      });
+      watch.observe(dialog, { attributes: true, attributeFilter: ['data-dragging'] });
+      try {
+        await dragTo(
+          real,
+          dialog,
+          title,
+          grab.left + grab.width / 2 + 120,
+          grab.top + grab.height / 2 + 60,
+        );
+      } finally {
+        watch.disconnect();
+      }
+      await expect(lifted).toBe(true);
+      await expect(dialog).not.toHaveAttribute('data-dragging');
+      await settled(panel);
+      same(boxOf(panel).left, before.left + 120);
+      same(boxOf(panel).top, before.top + 60);
+      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('120px');
+      await expect(panel.style.getPropertyValue('--flg-dialog-y')).toBe('60px');
+      await expect(dialog.open).toBe(true);
+    });
+  },
+};
+
+export const MovableStopsAtEveryEdge: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      const title = titleOf(dialog);
+      // Each drag ends in a corner of the window that the panel cannot reach: 16px is left.
+      await dragTo(real, dialog, title, 2, 2);
+      await settled(panel);
+      same(boxOf(panel).left, 16);
+      same(boxOf(panel).top, 16);
+      await dragTo(real, dialog, title, WIDE.width - 2, WIDE.height - 2);
+      await settled(panel);
+      same(boxOf(panel).right, WIDE.width - 16);
+      same(boxOf(panel).bottom, WIDE.height - 16);
+      await dragTo(real, dialog, title, WIDE.width - 2, 2);
+      await settled(panel);
+      same(boxOf(panel).right, WIDE.width - 16);
+      same(boxOf(panel).top, 16);
+      await dragTo(real, dialog, title, 2, WIDE.height - 2);
+      await settled(panel);
+      same(boxOf(panel).left, 16);
+      same(boxOf(panel).bottom, WIDE.height - 16);
+    });
+  },
+};
+
+export const MovableStaysInsideASmallerWindow: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      await dragTo(real, dialog, titleOf(dialog), WIDE.width - 2, WIDE.height - 2);
+      await settled(panel);
+      same(boxOf(panel).right, WIDE.width - 16);
+      // The window shrinks under it, and the panel is taken in with it.
+      await viewport.set(900, 600);
+      await settled(panel);
+      same(boxOf(panel).right, 900 - 16);
+      same(boxOf(panel).bottom, 600 - 16);
+      await expect(boxOf(panel).left).toBeGreaterThanOrEqual(15);
+      await expect(boxOf(panel).top).toBeGreaterThanOrEqual(15);
+    });
+  },
+};
+
+export const MovableCentresBelow640AndStaysThere: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      const title = titleOf(dialog);
+      const middle = boxOf(panel);
+      await dragTo(real, dialog, title, 2, 2);
+      await settled(panel);
+      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
+      // Under 640px it is in the middle at once, with nothing left on its style, and it cannot be moved.
+      await viewport.set(600, WIDE.height);
+      await settled(panel);
+      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
+      same(boxOf(panel).left + boxOf(panel).width / 2, 300);
+      await dragTo(real, dialog, title, 2, 2);
+      await settled(panel);
+      same(boxOf(panel).left + boxOf(panel).width / 2, 300);
+      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
+      // Wide again: still in the middle, and it moves once more.
+      await viewport.set(WIDE.width, WIDE.height);
+      await settled(panel);
+      same(boxOf(panel).left + boxOf(panel).width / 2, WIDE.width / 2);
+      await dragTo(real, dialog, title, 2, 2);
+      await settled(panel);
+      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
+    });
+  },
+};
+
+export const MovableLetGoOutsideStaysOpen: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      // The press starts in the panel, and the pointer is let go on the frame, 4px from its corner,
+      // which the panel does not reach: that is not an outside click.
+      await dragTo(real, dialog, titleOf(dialog), 4, 4);
+      await new Promise((resolve) => setTimeout(resolve, 50));
+      await expect(dialog.open).toBe(true);
+      await settled(panel);
+      same(boxOf(panel).left, 16);
+    });
+  },
+};
+
+export const MovableLeavesHeaderButtonsAlone: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog help />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      const help = within(dialog).getByRole('button', { name: 'Help' });
+      const before = boxOf(panel);
+      await dragTo(real, dialog, help, 2, 2);
+      await settled(panel);
+      same(boxOf(panel).left, before.left);
+      same(boxOf(panel).top, before.top);
+      await expect(dialog).not.toHaveAttribute('data-dragging');
+      // A click on it is a click: the press that starts a drag does not take it.
+      let clicks = 0;
+      help.addEventListener('click', () => (clicks += 1));
+      await real.click(help);
+      // (Safari does not focus a button that is clicked, so its focus is not asked about.)
+      await expect(clicks).toBe(1);
+    });
+  },
+};
+
+export const MovableCentresOnADoubleClick: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog help />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      const title = titleOf(dialog);
+      const middle = boxOf(panel);
+      await dragTo(real, dialog, title, 2, 2);
+      await settled(panel);
+      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
+      // On a control of the header it does nothing.
+      await real.dblClick(within(dialog).getByRole('button', { name: 'Help' }));
+      await expect(boxOf(panel).left).toBeLessThan(middle.left - 50);
+      // On the header it puts the panel back at once, with no animation to wait for.
+      await real.dblClick(title);
+      same(boxOf(panel).left, middle.left);
+      same(boxOf(panel).top, middle.top);
+      await expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
+    });
+  },
+};
+
+export const MovableKeepsTheFocus: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      const input = within(dialog).getByRole('textbox', { name: 'Customer' });
+      const title = titleOf(dialog);
+      input.focus();
+      await expect(input).toHaveFocus();
+      // A press on the header, and a drag by it, do not pull the focus out of the field that has it.
+      await real.click(title);
+      await expect(input).toHaveFocus();
+      await dragTo(real, dialog, title, 2, 2);
+      await settled(panel);
+      await expect(input).toHaveFocus();
+      // Nor does the press select the text of the header.
+      await expect(window.getSelection()?.toString()).toBe('');
+    });
+  },
+};
+
+export const MovableEscClosesInTheMiddleOfADrag: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const title = titleOf(dialog);
+      await panelOf(dialog);
+      const at = boxOf(title);
+      // A held button cannot be left down from here, so the press is dispatched: a pointer the browser
+      // does not know, which the listeners of the page follow all the same. The key is the browser's.
+      const send = (target: EventTarget, type: string, dx: number) =>
+        target.dispatchEvent(
+          new PointerEvent(type, {
+            bubbles: true,
+            pointerId: 21,
+            isPrimary: true,
+            pointerType: 'mouse',
+            button: 0,
+            clientX: at.left + 10 + dx,
+            clientY: at.top + 5,
+          }),
+        );
+      send(title, 'pointerdown', 0);
+      send(document, 'pointermove', 80);
+      await expect(dialog).toHaveAttribute('data-dragging');
+      await real.keyboard('{Escape}');
+      await waitFor(() => expect(dialog.open).toBe(false));
+      send(document, 'pointerup', 80);
+      await expect(dialog).not.toHaveAttribute('data-dragging');
+    });
+  },
+};
+
+export const MovableFollowsATouch: Story = {
+  tags: ['no-visual'],
+  render: () => <OrderDialog />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const dialog = dialogIn(canvasElement);
+      const panel = await panelOf(dialog);
+      const title = titleOf(dialog);
+      const before = boxOf(panel);
+      const at = boxOf(title);
+      // An emulated finger: pointer events of type `touch`, which the browser did not send.
+      const send = (target: EventTarget, type: string, dx: number, dy: number) =>
+        target.dispatchEvent(
+          new PointerEvent(type, {
+            bubbles: true,
+            pointerId: 22,
+            isPrimary: true,
+            pointerType: 'touch',
+            button: 0,
+            clientX: at.left + 10 + dx,
+            clientY: at.top + 5 + dy,
+          }),
+        );
+      send(title, 'pointerdown', 0, 0);
+      send(document, 'pointermove', 70, 40);
+      send(document, 'pointerup', 70, 40);
+      await settled(panel);
+      same(boxOf(panel).left, before.left + 70);
+      same(boxOf(panel).top, before.top + 40);
+    });
+  },
+};
diff --git a/src/components/dialog/Dialog.test-d.ts b/src/components/dialog/Dialog.test-d.ts
index 3887b76..460cdbb 100644
--- a/src/components/dialog/Dialog.test-d.ts
+++ b/src/components/dialog/Dialog.test-d.ts
@@ -14,3 +14,10 @@ test('DialogContent takes the onCancel that can refuse Esc', () => {
     ReactEventHandler<HTMLDialogElement> | undefined
   >();
 });
+
+test('DialogContent takes movable as a boolean, and no draggable', () => {
+  expectTypeOf<DialogContentProps['movable']>().toEqualTypeOf<boolean | undefined>();
+  // @ts-expect-error `movable` is a flag, not a string
+  const wrong: DialogContentProps = { movable: 'yes' };
+  expectTypeOf(wrong).toBeObject();
+});
diff --git a/src/components/dialog/Dialog.test.tsx b/src/components/dialog/Dialog.test.tsx
index 8c1049b..79d7413 100644
--- a/src/components/dialog/Dialog.test.tsx
+++ b/src/components/dialog/Dialog.test.tsx
@@ -1,9 +1,9 @@
-import { act, render } from '@testing-library/react';
-import { StrictMode, useState } from 'react';
+import { act, fireEvent, render } from '@testing-library/react';
+import { Profiler, StrictMode, useState } from 'react';
 import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
 import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
 import { getTopModal } from '../../internal/modal-stack';
-import { Dialog, DialogContent, DialogTitle } from './Dialog';
+import { Dialog, DialogContent, DialogHeader, DialogTitle } from './Dialog';
 
 // jsdom has no showModal(). This stand-in is just enough for the state logic: it toggles `open` and,
 // like a browser, fires `close` in a later task rather than at once.
@@ -149,3 +149,556 @@ describe('Dialog', () => {
     expect(getTopModal()).toBeUndefined();
   });
 });
+
+// The movable dialog (spec phase 6 §3.4). jsdom has no layout, no ResizeObserver and no matchMedia,
+// so each is stood in for. The frame is 1000x800 and the panel 400x300, centred, which puts the panel
+// at 300,250 when it has not been moved and gives these limits for its offset, with 16px of margin
+// left: x from -284 to 284, y from -234 to 234.
+describe('DialogContent movable', () => {
+  const FRAME = { width: 1000, height: 800 };
+  const PANEL = { width: 400, height: 300 };
+  const LIMIT = { x: 284, y: 234 };
+  const base = { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0 };
+
+  /** What `ResizeObserver` does in a browser, driven by hand: `resize()` reports to every observer. */
+  const observers: Array<{ observed: Set<Element>; callback: ResizeObserverCallback }> = [];
+  const resize = () =>
+    act(() => {
+      for (const { callback, observed } of observers) {
+        callback(
+          Array.from(observed, (target) => ({ target }) as ResizeObserverEntry),
+          {} as ResizeObserver,
+        );
+      }
+    });
+  let wide: { matches: boolean; listeners: Set<() => void> };
+  const setWide = (matches: boolean) =>
+    act(() => {
+      wide.matches = matches;
+      wide.listeners.forEach((listener) => listener());
+    });
+
+  // The animation frames the primitive coalesces moves into, run by hand so a test decides when one
+  // passes.
+  let frames: Map<number, FrameRequestCallback>;
+  let nextFrame: number;
+  const runFrames = () => {
+    const due = [...frames.values()];
+    frames.clear();
+    act(() => due.forEach((callback) => callback(0)));
+  };
+
+  beforeEach(() => {
+    resetDevWarnings();
+    observers.length = 0;
+    frames = new Map();
+    nextFrame = 1;
+    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
+      frames.set(nextFrame, callback);
+      return nextFrame++;
+    });
+    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
+    wide = { matches: true, listeners: new Set() };
+    vi.stubGlobal(
+      'matchMedia',
+      vi.fn(() => ({
+        get matches() {
+          return wide.matches;
+        },
+        addEventListener: (_type: string, listener: () => void) => wide.listeners.add(listener),
+        removeEventListener: (_type: string, listener: () => void) =>
+          wide.listeners.delete(listener),
+      })),
+    );
+    vi.stubGlobal(
+      'ResizeObserver',
+      class {
+        observed = new Set<Element>();
+        constructor(readonly callback: ResizeObserverCallback) {
+          observers.push(this);
+        }
+        observe(target: Element) {
+          this.observed.add(target);
+        }
+        disconnect() {
+          this.observed.clear();
+        }
+      },
+    );
+  });
+  afterEach(() => {
+    vi.unstubAllGlobals();
+    vi.restoreAllMocks();
+    FRAME.width = 1000;
+    FRAME.height = 800;
+    PANEL.height = 300;
+  });
+
+  /** Gives the frame and the panel the sizes a browser would, and moves the panel with its variables. */
+  function layout(dialog: HTMLElement, panel: HTMLElement) {
+    const define = (element: HTMLElement, name: string, get: () => number) =>
+      Object.defineProperty(element, name, { configurable: true, get });
+    define(dialog, 'clientWidth', () => FRAME.width);
+    define(dialog, 'clientHeight', () => FRAME.height);
+    define(panel, 'offsetWidth', () => PANEL.width);
+    define(panel, 'offsetHeight', () => PANEL.height);
+    panel.getBoundingClientRect = () => {
+      const x = Number.parseFloat(panel.style.getPropertyValue('--flg-dialog-x') || '0');
+      const y = Number.parseFloat(panel.style.getPropertyValue('--flg-dialog-y') || '0');
+      const left = (FRAME.width - PANEL.width) / 2 + x;
+      const top = (FRAME.height - PANEL.height) / 2 + y;
+      return {
+        left,
+        top,
+        right: left + PANEL.width,
+        bottom: top + PANEL.height,
+        width: PANEL.width,
+        height: PANEL.height,
+        x: left,
+        y: top,
+        toJSON: () => ({}),
+      };
+    };
+  }
+
+  /** A dialog with a header that holds a title and the interactive things a press must leave alone. */
+  function setup(movable = true) {
+    const view = render(
+      <Dialog defaultOpen>
+        <DialogContent movable={movable}>
+          <DialogHeader data-testid="header">
+            <DialogTitle>Edit order</DialogTitle>
+            <button type="button">Help</button>
+            <span role="button" tabIndex={0}>
+              Focusable
+            </span>
+            <label>
+              Label <input />
+            </label>
+          </DialogHeader>
+          <p>Body</p>
+        </DialogContent>
+      </Dialog>,
+    );
+    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
+    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
+    layout(dialog, panel);
+    const offset = () => [
+      panel.style.getPropertyValue('--flg-dialog-x'),
+      panel.style.getPropertyValue('--flg-dialog-y'),
+    ];
+    return {
+      ...view,
+      dialog,
+      panel,
+      offset,
+      header: view.getByTestId('header'),
+      title: view.getByText('Edit order'),
+    };
+  }
+  type Setup = ReturnType<typeof setup>;
+
+  /** A dialog with nothing in its header but the title, for the tests that need no more. */
+  function setupPlain(props: { onOpenChange?: () => void; style?: object } = {}) {
+    const view = render(
+      <Dialog defaultOpen onOpenChange={props.onOpenChange}>
+        <DialogContent movable style={props.style}>
+          <DialogHeader>
+            <DialogTitle>Edit order</DialogTitle>
+          </DialogHeader>
+        </DialogContent>
+      </Dialog>,
+    );
+    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
+    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
+    layout(dialog, panel);
+    return { ...view, dialog, panel, title: view.getByText('Edit order') };
+  }
+
+  const press = (el: Element, x = 500, y = 260, init: PointerEventInit = {}) =>
+    fireEvent.pointerDown(el, { ...base, clientX: x, clientY: y, ...init });
+  const move = (x: number, y: number) =>
+    fireEvent.pointerMove(document, { ...base, clientX: x, clientY: y });
+  const release = (x: number, y: number) =>
+    fireEvent.pointerUp(document, { ...base, clientX: x, clientY: y });
+
+  it('puts data-movable on the panel and the grip first in the header', () => {
+    const { panel, header } = setup();
+    expect(panel).toHaveAttribute('data-movable');
+    expect(header).toHaveClass('flg-card-header', 'flg-dialog-header');
+    expect(header).toHaveAttribute('data-movable');
+    const grip = header.firstElementChild as SVGElement;
+    expect(grip.tagName.toLowerCase()).toBe('svg');
+    expect(grip).toHaveClass('flg-dialog-grip');
+    expect(grip).toHaveAttribute('aria-hidden', 'true');
+  });
+
+  it('leaves a dialog that is not movable as it was, bar the class of its header', () => {
+    const { panel, header, title, offset } = setup(false);
+    expect(panel).not.toHaveAttribute('data-movable');
+    expect(header).toHaveClass('flg-card-header', 'flg-dialog-header');
+    expect(header).not.toHaveAttribute('data-movable');
+    expect(header.querySelector('.flg-dialog-grip')).toBeNull();
+    expect(header.firstElementChild).toBe(title);
+    expect(press(title)).toBe(true);
+    move(560, 320);
+    expect(offset()).toEqual(['', '']);
+  });
+
+  it('a press on the header becomes a drag only when the pointer is 3px away', () => {
+    const { dialog, title, offset } = setup();
+    press(title);
+    move(502, 260);
+    // 2px and 2px is 2.8px away, still under; 3px along one axis is the threshold.
+    move(502, 262);
+    expect(dialog).not.toHaveAttribute('data-dragging');
+    expect(offset()).toEqual(['', '']);
+    move(503, 260);
+    expect(dialog).toHaveAttribute('data-dragging');
+    release(503, 260);
+    expect(dialog).not.toHaveAttribute('data-dragging');
+  });
+
+  it('moves the panel with the pointer through two properties, and keeps it where it is let go', () => {
+    const { dialog, title, offset } = setup();
+    press(title, 500, 260);
+    move(540, 300);
+    // The event that crosses the threshold moves the panel at once; the next ones wait for a frame.
+    expect(dialog).toHaveAttribute('data-dragging');
+    expect(offset()).toEqual(['40px', '40px']);
+    move(520, 250);
+    runFrames();
+    expect(offset()).toEqual(['20px', '-10px']);
+    release(520, 250);
+    expect(dialog).not.toHaveAttribute('data-dragging');
+    expect(offset()).toEqual(['20px', '-10px']);
+  });
+
+  it('continues from where the last drag left the panel', () => {
+    const { title, offset } = setup();
+    press(title, 500, 260);
+    move(540, 300);
+    release(540, 300);
+    press(title, 500, 260);
+    move(510, 270);
+    expect(offset()).toEqual(['50px', '50px']);
+    release(510, 270);
+  });
+
+  it('stops the panel 16px from each edge of the frame', () => {
+    const { title, offset, panel } = setup();
+    press(title, 500, 260);
+    move(5000, 5000);
+    expect(offset()).toEqual([`${LIMIT.x}px`, `${LIMIT.y}px`]);
+    expect(panel.getBoundingClientRect().right).toBe(FRAME.width - 16);
+    expect(panel.getBoundingClientRect().bottom).toBe(FRAME.height - 16);
+    move(-5000, -5000);
+    runFrames();
+    expect(offset()).toEqual([`${-LIMIT.x}px`, `${-LIMIT.y}px`]);
+    expect(panel.getBoundingClientRect().left).toBe(16);
+    expect(panel.getBoundingClientRect().top).toBe(16);
+    release(-5000, -5000);
+  });
+
+  it('clamps again when the window or the panel changes size', () => {
+    const { title, offset } = setup();
+    const observed = observers.flatMap(({ observed }) => [...observed]);
+    expect(observed.map((element) => element.tagName).sort()).toEqual(['DIALOG', 'DIV']);
+    press(title, 500, 260);
+    move(5000, 5000);
+    release(5000, 5000);
+    expect(offset()).toEqual([`${LIMIT.x}px`, `${LIMIT.y}px`]);
+    // A window 200px narrower and 100px shorter: the room to the right shrinks by 100px, below by 50px.
+    FRAME.width = 800;
+    FRAME.height = 700;
+    resize();
+    expect(offset()).toEqual(['184px', '184px']);
+    // A panel 100px taller has 50px less room below.
+    PANEL.height = 400;
+    resize();
+    expect(offset()).toEqual(['184px', '134px']);
+  });
+
+  it('leaves a panel that has not been moved alone when it is measured', () => {
+    const { offset } = setup();
+    resize();
+    expect(offset()).toEqual(['', '']);
+  });
+
+  it('goes back to the middle on a double click on the header, and removes what it set', () => {
+    const { title, offset, panel } = setup();
+    press(title, 500, 260);
+    move(540, 300);
+    release(540, 300);
+    fireEvent.doubleClick(title);
+    expect(offset()).toEqual(['', '']);
+    expect(panel.getAttribute('style') ?? '').not.toContain('--flg-dialog');
+  });
+
+  it('keeps what the caller put in the style of the panel', () => {
+    const { title, panel } = setupPlain({ style: { width: 333 } });
+    press(title, 500, 260);
+    move(540, 300);
+    release(540, 300);
+    expect(panel.style.width).toBe('333px');
+    fireEvent.doubleClick(title);
+    expect(panel.style.width).toBe('333px');
+    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
+  });
+
+  it.each([
+    ['a button', (view: Setup) => view.getByRole('button', { name: 'Help' })],
+    ['a focusable element', (view: Setup) => view.getByText('Focusable')],
+    ['a label', (view: Setup) => view.getByText('Label')],
+    ['an input', (view: Setup) => view.container.querySelector('input') as HTMLElement],
+  ])('does not drag from %s in the header, nor centre on its double click', (_name, find) => {
+    const view = setup();
+    const target = find(view);
+    // A press that starts a drag is cancelled, so this one is left to the browser.
+    expect(press(target)).toBe(true);
+    move(560, 320);
+    expect(view.dialog).not.toHaveAttribute('data-dragging');
+    expect(view.offset()).toEqual(['', '']);
+    release(560, 320);
+    press(view.title, 500, 260);
+    move(540, 300);
+    release(540, 300);
+    fireEvent.doubleClick(target);
+    expect(view.offset()).toEqual(['40px', '40px']);
+  });
+
+  it('cancels the press, so that focus and the selection of text stay where they are', () => {
+    const { title } = setup();
+    expect(press(title)).toBe(false);
+  });
+
+  it.each([
+    ['a secondary button', { button: 2 }],
+    ['a second pointer', { isPrimary: false }],
+  ])('ignores %s', (_name, init) => {
+    const { title, offset, dialog } = setup();
+    expect(press(title, 500, 260, init)).toBe(true);
+    move(560, 320);
+    expect(offset()).toEqual(['', '']);
+    expect(dialog).not.toHaveAttribute('data-dragging');
+  });
+
+  it.each(['touch', 'pen'])('drags with a %s as with a mouse', (pointerType) => {
+    const { title, offset } = setup();
+    fireEvent.pointerDown(title, { ...base, pointerType, clientX: 500, clientY: 260 });
+    fireEvent.pointerMove(document, { ...base, pointerType, clientX: 540, clientY: 300 });
+    expect(offset()).toEqual(['40px', '40px']);
+    fireEvent.pointerUp(document, { ...base, pointerType, clientX: 540, clientY: 300 });
+  });
+
+  it('keeps the position when the browser takes the pointer (pointercancel)', () => {
+    const { title, offset, dialog } = setup();
+    press(title, 500, 260);
+    move(540, 300);
+    fireEvent.pointerCancel(document, { ...base, clientX: 540, clientY: 300 });
+    expect(dialog).not.toHaveAttribute('data-dragging');
+    expect(offset()).toEqual(['40px', '40px']);
+  });
+
+  it('leaves Esc to close the dialog, and the drag ends with the panel', async () => {
+    const onOpenChange = vi.fn();
+    const { title, dialog } = setupPlain({ onOpenChange });
+    press(title, 500, 260);
+    move(540, 300);
+    // The key is not taken by the drag.
+    expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(true);
+    expect(dialog).toHaveAttribute('data-dragging');
+    // What the browser does with it next.
+    act(() => {
+      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
+    });
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
+    expect(dialog).not.toHaveAttribute('open');
+    expect(dialog).not.toHaveAttribute('data-dragging');
+    release(540, 300);
+    expect(dialog).not.toHaveAttribute('data-dragging');
+  });
+
+  it('is not an outside click when the drag is let go on the frame', () => {
+    const onOpenChange = vi.fn();
+    const { title, dialog } = setupPlain({ onOpenChange });
+    press(title, 500, 260);
+    move(540, 300);
+    fireEvent.pointerUp(dialog, { ...base, clientX: 900, clientY: 700 });
+    fireEvent.click(dialog);
+    expect(onOpenChange).not.toHaveBeenCalled();
+  });
+
+  it('does not drag below 640px, and the panel goes to the middle when the window narrows', () => {
+    const { title, offset, panel, dialog } = setup();
+    press(title, 500, 260);
+    move(540, 300);
+    expect(offset()).toEqual(['40px', '40px']);
+    setWide(false);
+    // The drag in flight stops, and what it set is gone.
+    expect(offset()).toEqual(['', '']);
+    expect(panel.getAttribute('style') ?? '').not.toContain('--flg-dialog');
+    expect(dialog).not.toHaveAttribute('data-dragging');
+    move(600, 360);
+    expect(offset()).toEqual(['', '']);
+    release(600, 360);
+    // A press now does nothing, and is not cancelled: the browser keeps its own behaviour.
+    expect(press(title)).toBe(true);
+    move(560, 320);
+    expect(offset()).toEqual(['', '']);
+    release(560, 320);
+    // Wide again: still in the middle, and it drags.
+    setWide(true);
+    expect(offset()).toEqual(['', '']);
+    press(title, 500, 260);
+    move(540, 300);
+    expect(offset()).toEqual(['40px', '40px']);
+    release(540, 300);
+  });
+
+  it('does not drag where there is no matchMedia, as on the server', () => {
+    vi.stubGlobal('matchMedia', undefined);
+    const { title, offset } = setup();
+    expect(press(title)).toBe(true);
+    move(560, 320);
+    expect(offset()).toEqual(['', '']);
+  });
+
+  it('drags on when the pointer cannot be captured', () => {
+    const { title, offset, header } = setup();
+    header.setPointerCapture = () => {
+      throw new DOMException('no such pointer', 'NotFoundError');
+    };
+    press(title, 500, 260);
+    move(540, 300);
+    expect(offset()).toEqual(['40px', '40px']);
+    release(540, 300);
+  });
+
+  it('starts in the middle each time it opens', () => {
+    function Page() {
+      const [open, setOpen] = useState(true);
+      return (
+        <>
+          <button type="button" onClick={() => setOpen((value) => !value)}>
+            Toggle
+          </button>
+          <Dialog open={open} onOpenChange={setOpen}>
+            <DialogContent movable>
+              <DialogHeader>
+                <DialogTitle>Edit order</DialogTitle>
+              </DialogHeader>
+            </DialogContent>
+          </Dialog>
+        </>
+      );
+    }
+    const view = render(<Page />);
+    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
+    layout(dialog, dialog.querySelector('.flg-dialog-panel') as HTMLElement);
+    press(view.getByText('Edit order'), 500, 260);
+    move(540, 300);
+    release(540, 300);
+    fireEvent.click(view.getByText('Toggle'));
+    fireEvent.click(view.getByText('Toggle'));
+    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
+    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('');
+    layout(dialog, panel);
+    press(view.getByText('Edit order'), 500, 260);
+    move(510, 270);
+    // From the middle, not from where the last opening left it.
+    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('10px');
+    release(510, 270);
+  });
+
+  it('does not render React for each move', () => {
+    let commits = 0;
+    const view = render(
+      <Profiler id="dialog" onRender={() => (commits += 1)}>
+        <Dialog defaultOpen>
+          <DialogContent movable>
+            <DialogHeader>
+              <DialogTitle>Edit order</DialogTitle>
+            </DialogHeader>
+          </DialogContent>
+        </Dialog>
+      </Profiler>,
+    );
+    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
+    layout(dialog, dialog.querySelector('.flg-dialog-panel') as HTMLElement);
+    const before = commits;
+    press(view.getByText('Edit order'), 500, 260);
+    for (let step = 1; step <= 10; step += 1) move(500 + step * 10, 260 + step * 5);
+    runFrames();
+    release(600, 310);
+    expect(commits).toBe(before);
+  });
+
+  it("keeps the caller's own onPointerDown and onDoubleClick, and lets them refuse", () => {
+    const onPointerDown = vi.fn();
+    const onDoubleClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
+    const view = render(
+      <Dialog defaultOpen>
+        <DialogContent movable>
+          <DialogHeader onPointerDown={onPointerDown} onDoubleClick={onDoubleClick}>
+            <DialogTitle>Edit order</DialogTitle>
+          </DialogHeader>
+        </DialogContent>
+      </Dialog>,
+    );
+    const dialog = view.container.querySelector('dialog') as HTMLDialogElement;
+    const panel = dialog.querySelector('.flg-dialog-panel') as HTMLElement;
+    layout(dialog, panel);
+    const title = view.getByText('Edit order');
+    press(title, 500, 260);
+    move(540, 300);
+    release(540, 300);
+    expect(onPointerDown).toHaveBeenCalledTimes(1);
+    fireEvent.doubleClick(title);
+    expect(onDoubleClick).toHaveBeenCalledTimes(1);
+    // The caller refused the double click, so the panel stays where it is.
+    expect(panel.style.getPropertyValue('--flg-dialog-x')).toBe('40px');
+  });
+
+  it('warns once when a movable dialog has no DialogHeader to drag it by', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(
+      <Dialog defaultOpen>
+        <DialogContent movable>
+          <DialogTitle>Edit order</DialogTitle>
+        </DialogContent>
+      </Dialog>,
+    );
+    expect(warn).toHaveBeenCalledExactlyOnceWith(
+      WARN_PREFIX + ' <DialogContent movable> needs a <DialogHeader> to drag it by.',
+    );
+  });
+
+  it('does not warn for a movable dialog with a header, nor for one that is closed', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    setup();
+    render(
+      <Dialog>
+        <DialogContent movable>
+          <DialogTitle>Closed</DialogTitle>
+        </DialogContent>
+      </Dialog>,
+    );
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it('lets go of what it took when the dialog unmounts in the middle of a drag', () => {
+    const { title, unmount, dialog } = setup();
+    const remove = vi.spyOn(document, 'removeEventListener');
+    press(title, 500, 260);
+    move(540, 300);
+    unmount();
+    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
+    expect(remove).toHaveBeenCalledWith('pointerup', expect.any(Function));
+    expect(dialog).not.toHaveAttribute('data-dragging');
+    // Nothing is left to answer a pointer that is still moving.
+    expect(() => move(600, 360)).not.toThrow();
+    remove.mockRestore();
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/dialog
pnpm vitest run --project scripts scripts/lib/contrast.test.ts scripts/lib/theme-css.test.ts
```

Expected: FAIL.
- `Dialog.test.tsx` (cả hai project React): các test của `DialogContent movable` fail, ví dụ `puts data-movable on the panel and the grip first in the header` (`expected … to have attribute "data-movable"`), `leaves a dialog that is not movable as it was, bar the class of its header` (chưa có lớp `flg-dialog-header`), và mọi test kéo, kẹp, bấm đúp, `preventDefault`, cảnh báo. Các test chỉ khẳng định một điều không xảy ra (`ignores a secondary button`, `ignores a second pointer`, `does not drag where there is no matchMedia, as on the server`, `is not an outside click when the drag is let go on the frame`, `does not warn for a movable dialog with a header, nor for one that is closed`) có thể pass ngay trên code cũ: chúng là đặc tả. Các test cũ của `Dialog` pass.
- `Dialog.test-d.ts`: `DialogContent takes movable as a boolean, and no draggable` báo lỗi kiểu (`Property 'movable' does not exist`).
- `contrast.test.ts`: cả tám test của `the grip of a movable Dialog (spec phase 6 §4.4)` fail, ví dụ `is a check at 3:1` với `expected undefined to be 3`.
- `theme-css.test.ts`: `theme values > keeps every light mockup token exactly as approved` và `… dark …` fail: `values.ts` chưa có `dialog-lift-shadow`.

Story không chạy ở bước này: chúng viết sau code (cần engine thật) và đòi một Dialog kéo được.

Theo báo cáo của bản nháp (phát hiện 20):
- Unit test, test kiểu, test tương phản và test token được viết trước và fail như trên (báo cáo nói cả khối `DialogContent movable` fail; các test "không xảy ra" kể trên là đặc tả).
- **Story của Dialog viết sau code.** Để thấy chúng fail được, bỏ `preventDefault` của lần nhấn trong `use-movable.ts`: `MovableKeepsTheFocus` fail ở cả ba engine, `MovableStopsAtEveryEdge` và `MovableStaysInsideASmallerWindow` fail ở Chromium (vùng chọn chữ kéo theo con trỏ). Rồi trả lại.
- Bốn story giao diện được chụp bằng một script Playwright tạm làm đúng các bước của harness và so với `d2.png` bằng mắt, ở sáng và tối (không file ảnh nào được thêm).

- [ ] **Step 3: Viết code**

````diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 574df4d..faecb17 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -217,6 +217,8 @@ const SHIPPED_CLASSES = [
   'flg-theme-switch-icon',
   'flg-theme-menu-icon',
   'flg-kbd',
+  'flg-dialog-header',
+  'flg-dialog-grip',
 ];
 
 // The rules of the AppShell that depend on the width are generated, one `@media` block per breakpoint
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 7decfe9..bf8e739 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -89,6 +89,7 @@ export const CHECKS = {
   'nav-rail-current-dot': 3,
   'kbd-text': 4.5,
   'kbd-key-text': 4.5,
+  'dialog-grip': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -489,6 +490,9 @@ export function measure(
             : keyText(row);
         }),
       ),
+      // The grip of a movable Dialog (dialog.css): muted at rest, the accent text while it is dragged,
+      // both on the panel.
+      'dialog-grip': Math.min(onSurface('text-muted'), onSurface('accent-text')),
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
       success: onSurface('success'),
diff --git a/src/components/dialog/Dialog.mdx b/src/components/dialog/Dialog.mdx
index 5fad8ce..4e7e91d 100644
--- a/src/components/dialog/Dialog.mdx
+++ b/src/components/dialog/Dialog.mdx
@@ -55,6 +55,48 @@ For a decision the user must take, pass `alert`. The dialog gets `role="alertdia
 outside does not close it; Esc still does. Put the least destructive action first, so it gets the
 focus.
 
+## Movable
+
+Pass `movable` to `DialogContent` and the user can drag the dialog by its `DialogHeader`, which
+shows a six-dot grip before the title. Mouse, pen and touch all work, and the dialog stays inside
+the screen with 16px left on every side, also when the window or the dialog changes size.
+
+```tsx
+<DialogContent movable>
+  <DialogHeader>
+    <DialogTitle>Edit order DH-1028</DialogTitle>
+    <DialogDescription>Placed on 05/11/2026 via the website.</DialogDescription>
+  </DialogHeader>
+  {/* form fields */}
+</DialogContent>
+```
+
+- **Only the header drags,** and a button, link, field or label in it is used, not dragged by. A
+  `movable` dialog without a `DialogHeader` has nothing to drag and warns in development.
+- **A double click on the header** puts the dialog back in the middle. So does opening it again: it
+  always opens in the middle, and what it remembers is gone when it closes.
+- **Below 640px it is not movable:** the grip is hidden, a press does nothing, and a dialog that was
+  moved goes back to the middle when the window narrows.
+- Pressing the header leaves the focus where it is, so a field being typed in keeps it, and Esc
+  still closes the dialog in the middle of a drag. Letting go outside the panel is not a click
+  outside it.
+- While it is dragged the panel is lifted: 2% larger, with a deeper shadow, and the grip takes the
+  accent colour. With `prefers-reduced-motion: reduce` it is not enlarged, and in forced colours it
+  has no shadow.
+- It works with `alert`, and each `movable` dialog has a position of its own. The Drawer cannot be
+  moved.
+
+### Why there is no key to move it
+
+The position of the dialog is how it is shown, not something it does. The drag changes no data and
+no state of your application, and the position is forgotten when the dialog closes; everything the
+dialog offers works from the middle; the page behind is inert while it is open, so moving the dialog
+uncovers nothing that can be used; and to read what is behind it, close it. For that reason it has
+no keyboard way to move and no alternative to dragging: WCAG 2.5.7 (Dragging Movements) and 2.1.1
+(Keyboard) ask for one for functions, and this is not one. If your audit counts moving the dialog
+as a function, the cheap fix is a key on the header, such as Alt with the arrow keys, which can be
+added without changing the API.
+
 ## Controlled
 
 Pass `open` and `onOpenChange` to own the state. Esc and an outside click only ask to close
@@ -72,6 +114,8 @@ before `onOpenChange` is called.
   panel scrolls to the focused element, so it can be seen. On close it returns to where it was, or
   to the trigger.
 - The ref and the ARIA attributes go to the `<dialog>`; `className` and `style` go to the panel.
+- A `movable` dialog reads the same to a screen reader: the grip is hidden from it, and the drag
+  is a pointer gesture that no key repeats (see Movable, above, for why).
 
 ## Do and don't
 
diff --git a/src/components/dialog/Dialog.tsx b/src/components/dialog/Dialog.tsx
index f4c115a..adeea11 100644
--- a/src/components/dialog/Dialog.tsx
+++ b/src/components/dialog/Dialog.tsx
@@ -3,6 +3,8 @@
 import { clsx } from 'clsx';
 import { forwardRef } from 'react';
 import type { HTMLAttributes } from 'react';
+import { GripIcon } from '../../internal/icons';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import type { ButtonProps } from '../button/Button';
 import {
   ModalClose,
@@ -11,6 +13,7 @@ import {
   ModalRoot,
   ModalTitle,
   ModalTrigger,
+  useModalMovable,
 } from './modal';
 import type { ModalContentProps, ModalRootProps, ModalTitleProps } from './modal';
 
@@ -23,6 +26,12 @@ export interface DialogContentProps extends ModalContentProps {
   size?: DialogSize;
   /** For a decision the user must take: `role="alertdialog"`, and an outside click does not close. */
   alert?: boolean;
+  /**
+   * Drag the dialog by its `DialogHeader` on screens 640px and wider. It stays inside the screen, a
+   * double click on the header puts it back in the middle, and it opens in the middle each time.
+   * Default `false`.
+   */
+  movable?: boolean;
 }
 export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;
 export type DialogTitleProps = ModalTitleProps;
@@ -53,7 +62,7 @@ export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  * `className` and `style` go to the panel.
  */
 export const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(
-  function DialogContent({ size = 'md', alert, ...props }, ref) {
+  function DialogContent({ size = 'md', alert, movable, ...props }, ref) {
     return (
       <ModalContent
         ref={ref}
@@ -61,18 +70,40 @@ export const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(
         alert={alert}
         frameData={{ 'data-kind': 'dialog' }}
         panelClassName="flg-dialog-panel"
-        panelData={{ 'data-size': size }}
+        panelData={{ 'data-size': size, 'data-movable': movable ? '' : undefined }}
+        movable={movable}
         {...props}
       />
     );
   },
 );
 
+/**
+ * The top of the panel. In a `DialogContent movable` it is what the user drags the dialog by, and
+ * shows the grip for it.
+ */
 export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
-  { className, ...props },
+  { className, children, onPointerDown, onDoubleClick, ...props },
   ref,
 ) {
-  return <div ref={ref} className={clsx('flg-card-header', className)} {...props} />;
+  const movable = useModalMovable();
+  return (
+    <div
+      ref={ref}
+      className={clsx('flg-card-header flg-dialog-header', className)}
+      {...props}
+      {...(movable ? { 'data-movable': '' } : undefined)}
+      onPointerDown={
+        movable ? composeEventHandlers(onPointerDown, movable.onPointerDown) : onPointerDown
+      }
+      onDoubleClick={
+        movable ? composeEventHandlers(onDoubleClick, movable.onDoubleClick) : onDoubleClick
+      }
+    >
+      {movable ? <GripIcon className="flg-dialog-grip" /> : null}
+      {children}
+    </div>
+  );
 });
 
 /** The dialog's name. Renders an `h2`; `asChild` renders another heading level. */
diff --git a/src/components/dialog/modal.tsx b/src/components/dialog/modal.tsx
index 0fc24a3..31afbbe 100644
--- a/src/components/dialog/modal.tsx
+++ b/src/components/dialog/modal.tsx
@@ -33,6 +33,8 @@ import { useRequireName } from '../../internal/use-require-name';
 import { devWarn } from '../../internal/warn';
 import { Button } from '../button/Button';
 import type { ButtonProps } from '../button/Button';
+import { useMovable } from './use-movable';
+import type { MovableHeaderHandlers } from './use-movable';
 
 // The shared core of Dialog and Drawer (spec §3.4): a native modal `<dialog>` that is a transparent,
 // full-viewport frame around the glass panel, with the toast host as the panel's sibling.
@@ -55,6 +57,14 @@ interface ModalContextValue {
 
 const ModalContext = createContext<ModalContextValue | null>(null);
 
+/**
+ * What a `DialogContent movable` hands to its `DialogHeader`: the handlers that drag the panel. It is
+ * null in every other dialog and in a Drawer, whose header is not this one.
+ */
+const ModalMovableContext = createContext<MovableHeaderHandlers | null>(null);
+
+export const useModalMovable = () => useContext(ModalMovableContext);
+
 const noop = () => {};
 
 function useModalContext(part: string): ModalContextValue {
@@ -176,6 +186,8 @@ interface ModalContentInternalProps extends ModalContentProps {
   frameData: Record<`data-${string}`, string | undefined>;
   panelClassName: string;
   panelData?: Record<`data-${string}`, string | undefined>;
+  /** Let the user drag the panel by its `DialogHeader` (a Dialog only). */
+  movable?: boolean | undefined;
 }
 
 /** What one opening of the dialog holds until it closes. */
@@ -198,6 +210,7 @@ export const ModalContent = forwardRef<HTMLDialogElement, ModalContentInternalPr
       frameData,
       panelClassName,
       panelData,
+      movable = false,
       className,
       style,
       children,
@@ -217,6 +230,12 @@ export const ModalContent = forwardRef<HTMLDialogElement, ModalContentInternalPr
     const hostRef = useRef<HTMLDivElement>(null);
     const mergedRef = useMemo(() => mergeRefs(ref, dialogRef), [ref]);
     const [, forceRender] = useReducer((count: number) => count + 1, 0);
+    const movableHandlers = useMovable({
+      enabled: movable,
+      open: ctx.open,
+      dialogRef,
+      panelRef,
+    });
 
     const session = useRef<ModalSession | null>(null);
 
@@ -362,7 +381,9 @@ export const ModalContent = forwardRef<HTMLDialogElement, ModalContentInternalPr
             tabIndex={-1}
             {...panelData}
           >
-            {children}
+            <ModalMovableContext.Provider value={movable ? movableHandlers : null}>
+              {children}
+            </ModalMovableContext.Provider>
           </div>
         ) : null}
         <div ref={hostRef} className="flg-toast-host" />
diff --git a/src/components/dialog/use-movable.ts b/src/components/dialog/use-movable.ts
new file mode 100644
index 0000000..4bb896f
--- /dev/null
+++ b/src/components/dialog/use-movable.ts
@@ -0,0 +1,211 @@
+import { useCallback, useEffect, useRef } from 'react';
+import type { MouseEvent, PointerEvent, RefObject } from 'react';
+import { clamp } from '../../internal/number';
+import { useMediaQuery } from '../../internal/use-media-query';
+import { usePointerDrag } from '../../internal/use-pointer-drag';
+import { devWarn } from '../../internal/warn';
+
+// Dragging a dialog by its header (spec phase 6 §3.4). The offset of the panel from the middle lives
+// in two custom properties on the panel, written straight to the style so that a move costs no render;
+// the CSS turns them into a `translate` (dialog.css).
+
+const OFFSET_X = '--flg-dialog-x';
+const OFFSET_Y = '--flg-dialog-y';
+
+/** The padding of the frame, which is the margin around a panel that has not been moved. */
+const MARGIN = 16;
+
+/** From this width the dialog can be moved; below it the panel fills the width and stays put. */
+const WIDE = '(min-width: 640px)';
+
+/**
+ * What a press must leave to itself: a control in the header is used, not dragged by. The header is
+ * not an `inert` region, so each of these keeps its own press, focus and double click.
+ */
+const INTERACTIVE =
+  'button, a[href], input, select, textarea, label, summary, [contenteditable], ' +
+  '[role=button], [role=link], [tabindex]:not([tabindex="-1"])';
+
+/** How far the offset may go on each axis, so that the panel stays `MARGIN` inside the frame. */
+interface Bounds {
+  minX: number;
+  maxX: number;
+  minY: number;
+  maxY: number;
+}
+
+export interface MovableOptions {
+  /** `DialogContent`'s `movable`. */
+  enabled: boolean;
+  /** Whether the dialog is open: the panel exists only then. */
+  open: boolean;
+  /** The `<dialog>`: the frame the panel stays in, and the element that shows `data-dragging`. */
+  dialogRef: RefObject<HTMLDialogElement | null>;
+  panelRef: RefObject<HTMLDivElement | null>;
+}
+
+/** What `DialogHeader` puts on itself to take part. */
+export interface MovableHeaderHandlers {
+  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
+  onDoubleClick: (event: MouseEvent<HTMLElement>) => void;
+}
+
+/** Takes the offset off the panel: it is back in the middle, with nothing left on its style. */
+function removeOffset(panel: HTMLElement | null) {
+  panel?.style.removeProperty(OFFSET_X);
+  panel?.style.removeProperty(OFFSET_Y);
+}
+
+/** Whether the press or click landed on something in the header that has a use of its own. */
+function onInteractive(event: { target: EventTarget; currentTarget: HTMLElement }): boolean {
+  const { target, currentTarget } = event;
+  if (!(target instanceof Element)) return false;
+  const control = target.closest(INTERACTIVE);
+  return control !== null && currentTarget.contains(control);
+}
+
+/**
+ * The state machine of a movable dialog: a press on the header, filtered, becomes a drag past 3px; the
+ * panel follows the pointer and is kept inside the frame, also when the frame or the panel changes
+ * size; a double click on the header puts it back in the middle; below 640px none of it applies, and
+ * what was set is removed. Returns the handlers for the header.
+ */
+export function useMovable({
+  enabled,
+  open,
+  dialogRef,
+  panelRef,
+}: MovableOptions): MovableHeaderHandlers {
+  const wide = useMediaQuery(WIDE);
+  // The panel is rendered only while open, so a closed dialog has nothing to move, and every opening
+  // starts in the middle because the properties go with the element.
+  const active = enabled && open && wide;
+  const activeRef = useRef(active);
+  activeRef.current = active;
+
+  /** Where the panel is now, as the properties say. */
+  const offset = useRef({ x: 0, y: 0 });
+  const bounds = useRef<Bounds | null>(null);
+  /** The press that is being dragged: where the panel was when it started. */
+  const session = useRef<{ x: number; y: number } | null>(null);
+
+  const place = useCallback(
+    (x: number, y: number) => {
+      const panel = panelRef.current;
+      if (!panel || (x === offset.current.x && y === offset.current.y)) return;
+      offset.current = { x, y };
+      panel.style.setProperty(OFFSET_X, `${x}px`);
+      panel.style.setProperty(OFFSET_Y, `${y}px`);
+    },
+    [panelRef],
+  );
+
+  const measure = useCallback(() => {
+    const dialog = dialogRef.current;
+    const panel = panelRef.current;
+    if (!dialog || !panel) return;
+    // The size is the layout size, which the `scale` of a lifted panel does not touch; the middle of
+    // the rectangle does not move with a scale either, so together they say where the panel would be
+    // without the offset, lifted or not.
+    const rect = panel.getBoundingClientRect();
+    const left = rect.left + rect.width / 2 - offset.current.x - panel.offsetWidth / 2;
+    const top = rect.top + rect.height / 2 - offset.current.y - panel.offsetHeight / 2;
+    bounds.current = {
+      minX: MARGIN - left,
+      maxX: dialog.clientWidth - MARGIN - (left + panel.offsetWidth),
+      minY: MARGIN - top,
+      maxY: dialog.clientHeight - MARGIN - (top + panel.offsetHeight),
+    };
+  }, [dialogRef, panelRef]);
+
+  const endDrag = useCallback(() => {
+    session.current = null;
+    dialogRef.current?.toggleAttribute('data-dragging', false);
+  }, [dialogRef]);
+
+  const { onPointerDown: startDrag } = usePointerDrag({
+    threshold: 3,
+    // Esc closes the dialog, whatever else is going on (spec §3.4): the drag is not its to cancel.
+    cancelOnEscape: false,
+    onPress: (event) => {
+      // Keeps the focus where it is and the text from being selected by the drag.
+      event.preventDefault();
+      session.current = { ...offset.current };
+      measure();
+    },
+    onStart: () => dialogRef.current?.toggleAttribute('data-dragging', true),
+    onMove: ({ dx, dy }) => {
+      const start = session.current;
+      const limits = bounds.current;
+      if (!start || !limits) return;
+      place(
+        clamp(start.x + dx, limits.minX, limits.maxX),
+        clamp(start.y + dy, limits.minY, limits.maxY),
+      );
+    },
+    onEnd: endDrag,
+    // The browser took the pointer (a touch that became a scroll, say): that is not the user taking
+    // the move back, so the panel stays where it got to.
+    onCancel: endDrag,
+  });
+
+  // While the dialog can be moved: keep the panel inside the frame as either of them changes size.
+  // Whatever ends it (a window below 640px, `movable` turned off, the dialog closing, an unmount)
+  // takes back exactly what it set, and ends a drag still in flight.
+  useEffect(() => {
+    if (!active) return;
+    const panel = panelRef.current;
+    const dialog = dialogRef.current;
+    if (!panel || !dialog) return;
+    let observer: ResizeObserver | undefined;
+    if (typeof ResizeObserver !== 'undefined') {
+      observer = new ResizeObserver(() => {
+        measure();
+        const limits = bounds.current;
+        if (limits) {
+          place(
+            clamp(offset.current.x, limits.minX, limits.maxX),
+            clamp(offset.current.y, limits.minY, limits.maxY),
+          );
+        }
+      });
+      observer.observe(panel);
+      observer.observe(dialog);
+    }
+    return () => {
+      observer?.disconnect();
+      session.current = null;
+      bounds.current = null;
+      offset.current = { x: 0, y: 0 };
+      removeOffset(panel);
+      dialog.toggleAttribute('data-dragging', false);
+    };
+  }, [active, dialogRef, panelRef, measure, place]);
+
+  // A movable dialog with no header has nothing to drag it by.
+  useEffect(() => {
+    if (!enabled || !open) return;
+    if (!panelRef.current?.querySelector('.flg-dialog-header')) {
+      devWarn('<DialogContent movable> needs a <DialogHeader> to drag it by.');
+    }
+  }, [enabled, open, panelRef]);
+
+  const onPointerDown = useCallback(
+    (event: PointerEvent<HTMLElement>) => {
+      if (!activeRef.current || onInteractive(event)) return;
+      startDrag(event);
+    },
+    [startDrag],
+  );
+
+  const onDoubleClick = useCallback(
+    (event: MouseEvent<HTMLElement>) => {
+      if (!activeRef.current || onInteractive(event)) return;
+      offset.current = { x: 0, y: 0 };
+      removeOffset(panelRef.current);
+    },
+    [panelRef],
+  );
+
+  return { onPointerDown, onDoubleClick };
+}
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index f52d00d..62d2be7 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -199,6 +199,18 @@ when a change is announced.
 - On a Mac the first render and the HTML from a server show the form for other systems (`Ctrl K`),
   and the symbols (`⌘K`) replace it once the page is in the browser.
 
+## A movable Dialog
+
+`DialogContent movable` can be dragged by its header with a pointer, and has no key that moves it.
+The position is treated as presentation and not as a function (WCAG 2.5.7 Dragging Movements, 2.1.1
+Keyboard): the drag changes no data or state, the position is forgotten when the dialog closes,
+everything the dialog does works from the middle, the page behind is inert while it is open so that
+moving the dialog uncovers nothing to use, and closing it shows what is behind. A screen reader
+reads the dialog as it reads any other: the grip is hidden, and the title, the description and the
+focus are unchanged. If an audit disagrees, a key on the header (Alt with the arrow keys) can be
+added without changing the API. The grip has a contrast check of its own, `dialog-grip`, which
+passes everywhere.
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
diff --git a/src/styles/components/dialog.css b/src/styles/components/dialog.css
index b17a3fe..3d1516e 100644
--- a/src/styles/components/dialog.css
+++ b/src/styles/components/dialog.css
@@ -68,6 +68,82 @@
       transform: scale(0.96);
     }
   }
+  /* A Dialog the user can drag by its header (spec phase 6 §3.4, §4.3; mockup D2). Nothing here applies
+     below 640px, where the grip is hidden and the header is the plain card header. */
+  .flg-dialog-grip {
+    display: none;
+  }
+  @media (min-width: 640px) {
+    /* The offset is set by use-movable.ts. `translate` is its own property, so it does not meet the
+       `transform` of the opening animation or the `scale` of the lifted panel, and it is not in the
+       transition below: the panel is on the pointer at once. */
+    .flg-dialog-panel[data-movable] {
+      translate: var(--flg-dialog-x, 0px) var(--flg-dialog-y, 0px);
+      transition:
+        opacity var(--flg-duration-normal) var(--flg-ease),
+        transform var(--flg-duration-normal) var(--flg-ease),
+        scale var(--flg-duration-fast) var(--flg-ease),
+        box-shadow var(--flg-duration-fast) var(--flg-ease);
+    }
+    /* The grip takes the first column and the rest of the header the second, so the title stands 18px
+       in and the grip is in line with the content below. */
+    .flg-dialog-header[data-movable] {
+      display: grid;
+      grid-template-columns: 8px minmax(0, 1fr);
+      column-gap: 10px;
+      row-gap: 4px;
+      align-items: center;
+      cursor: grab;
+      touch-action: none;
+      user-select: none;
+    }
+    .flg-dialog-header[data-movable] > :not(.flg-dialog-grip) {
+      grid-column: 2;
+    }
+    /* What the press leaves alone (use-movable.ts) keeps its own pointer. Zero specificity, so that the
+       rule of the control itself, a Button's `cursor: pointer` for one, wins. */
+    :where(.flg-dialog-header[data-movable])
+      :where(
+        button,
+        a[href],
+        input,
+        select,
+        textarea,
+        label,
+        summary,
+        [contenteditable],
+        [role='button'],
+        [role='link'],
+        [tabindex]:not([tabindex='-1'])
+      ) {
+      cursor: auto;
+    }
+    .flg-dialog-grip {
+      display: block;
+      grid-row: 1;
+      width: 8px;
+      height: 14px;
+      color: var(--flg-text-muted);
+    }
+    @media (hover: hover) {
+      .flg-dialog-header[data-movable]:hover .flg-dialog-grip {
+        color: var(--flg-text);
+      }
+    }
+    /* Lifted while it is dragged. The selector for the grip is longer than the hover one above, which
+       is also true while the header is dragged. */
+    .flg-dialog[data-dragging] .flg-dialog-header[data-movable] {
+      cursor: grabbing;
+    }
+    .flg-dialog[data-dragging] .flg-dialog-header[data-movable] .flg-dialog-grip {
+      color: var(--flg-accent-text);
+    }
+    .flg-dialog[data-dragging] .flg-dialog-panel[data-movable] {
+      scale: 1.02;
+      box-shadow: var(--flg-dialog-lift-shadow);
+    }
+  }
+
   /* Drawer: the same frame, with the panel against one edge. */
   .flg-dialog[data-kind='drawer'] {
     padding: 0;
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 3032fcd..26ec7e9 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -269,6 +269,18 @@
       border-color: ButtonText;
       color: ButtonText;
     }
+    /* The grip of a movable Dialog is drawn in the text colour, and in the selection colour while the
+       dialog is dragged. The lift is a shadow, which this mode drops: the panel keeps the edge that
+       `.flg-surface` gives it (spec phase 6 §4.5). */
+    .flg-dialog-grip {
+      color: CanvasText;
+    }
+    .flg-dialog[data-dragging] .flg-dialog-header[data-movable] .flg-dialog-grip {
+      color: Highlight;
+    }
+    .flg-dialog[data-dragging] .flg-dialog-panel[data-movable] {
+      box-shadow: none;
+    }
     /* The rings of the avatar button of a UserMenu (U1) are shadows, which this mode drops: the menu
        that is open says that it is, and the button has the border of a Button. The header of the menu is
        text on the canvas, whatever muted colour it was written in (spec phase 5 §4.5). */
@@ -897,5 +909,10 @@
     .flg-skeleton::after {
       display: none;
     }
+    /* A dialog that is dragged is not enlarged; its shadow still changes, at once, since the duration
+       tokens are 0ms in this mode (spec phase 6 §3.10). */
+    .flg-dialog[data-dragging] .flg-dialog-panel[data-movable] {
+      scale: none;
+    }
   }
 }
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index 4d94ead..68d8024 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -76,6 +76,9 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     'list-card-shadow': '0 1px 2px #0000000a, 0 6px 16px #3c5fd21f',
     'list-card-shadow-hover': '0 2px 4px #0000000f, 0 12px 26px #3c5fd238',
     'list-card-hover-bg': 'var(--flg-control-bg)',
+    // The panel of a Dialog while it is dragged by its header (mockup D2): lifted, so a deeper shadow
+    // than the glass one.
+    'dialog-lift-shadow': '0 6px 14px rgba(0,0,0,.08), 0 36px 80px rgba(60,95,210,.45)',
     success: '#115934', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     warning: '#734200', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     danger: '#92222b', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
@@ -117,6 +120,7 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     'list-card-shadow': '0 6px 18px #00000047',
     'list-card-shadow-hover': '0 12px 28px #00000073',
     'list-card-hover-bg': 'var(--flg-control-track)',
+    'dialog-lift-shadow': '0 8px 18px rgba(0,0,0,.45), 0 40px 90px rgba(0,0,0,.85)',
     success: '#bbf1d7', // (outside mockup)
     warning: '#fae0ad', // (outside mockup)
     danger: '#ffdbdd', // (outside mockup)
diff --git a/tests/visual/stories.visual.ts b/tests/visual/stories.visual.ts
index 4b7ae9e..ea72d10 100644
--- a/tests/visual/stories.visual.ts
+++ b/tests/visual/stories.visual.ts
@@ -79,12 +79,52 @@ for (const story of stories) {
         // attribute is shot exactly as before.
         const hover = stage.locator('[data-visual-hover]').first();
         const hovered = (await hover.count()) > 0;
+        // A story that must be shot while something is being dragged marks the thing to press with
+        // `data-visual-drag="dx,dy"`. A drag cannot be left half done from a play function either: the
+        // pointer events it sends are synthetic, and a synthetic press cannot capture the pointer. So
+        // the harness presses the real mouse on the middle of the element, moves it `dx`, `dy` pixels
+        // in five steps, lets two frames pass for what the drag changes to settle, and shoots with the
+        // button still down. It does the same wait for the render to finish as the hover does, and a
+        // story uses one of the two attributes, never both: the mouse is only in one place.
+        const dragMark = stage.locator('[data-visual-drag]').first();
+        const dragged = (await dragMark.count()) > 0;
+        if (hovered && dragged) {
+          throw new Error(`${story.id} has both data-visual-hover and data-visual-drag.`);
+        }
         // A story shot at a size of its own (`viewportFromTags` hands back the default itself when
         // there is no tag) may reach its look in the play function, as a sheet that the play function
         // opens does, so its shot waits for the render to finish too. The tag came with the stories of
         // the AppShell, so no older baseline is shot any later than before.
-        if (hovered || viewport !== DEFAULT_VIEWPORT) await page.waitForFunction(renderFinished);
+        if (hovered || dragged || viewport !== DEFAULT_VIEWPORT) {
+          await page.waitForFunction(renderFinished);
+        }
         if (hovered) await hover.hover();
+        if (dragged) {
+          const [dx, dy] = ((await dragMark.getAttribute('data-visual-drag')) ?? '')
+            .split(',')
+            .map(Number);
+          if (
+            dx === undefined ||
+            dy === undefined ||
+            !Number.isFinite(dx) ||
+            !Number.isFinite(dy)
+          ) {
+            throw new Error(`${story.id}: data-visual-drag must be "dx,dy", two numbers.`);
+          }
+          const box = await dragMark.boundingBox();
+          if (!box) throw new Error(`${story.id}: the element of data-visual-drag has no box.`);
+          const x = box.x + box.width / 2;
+          const y = box.y + box.height / 2;
+          await page.mouse.move(x, y);
+          await page.mouse.down();
+          await page.mouse.move(x + dx, y + dy, { steps: 5 });
+          await page.evaluate(
+            () =>
+              new Promise<void>((resolve) =>
+                requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
+              ),
+          );
+        }
         // `data-visual-hover="tooltip"` says that what is hovered has a tooltip, which opens after its
         // delay (500ms): two shots taken before it opens would be the same, and would pass. So the shot
         // waits for a tooltip that is open (spec phase 5 §7).
````

Build, rồi kiểm tra gói trước khi ghi ngưỡng:

```bash
pnpm gen:theme
pnpm build
pnpm check:package
```

Expected: PASS với ngưỡng cũ (JS 60417 B, CSS 17797 B): `pnpm size` ở đầu nhánh nháp đo JS 57.22 kB, CSS 16.6 kB.

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm size:record
```

Expected: ngưỡng mới gần JS 62946 B, CSS 18263 B (trước: 60417 B, 17797 B), là kết quả ở bản nháp; ngưỡng là số đo cộng 10%. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/dialog src/components/drawer src/components/menu src/components/search-field src/docs src/internal
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/dialog
pnpm vitest run --project storybook-dark src/components/dialog
pnpm vitest run --project storybook-light src/components/drawer
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `pnpm gen:theme` ghi lại các file sinh, nay có `--flg-dialog-lift-shadow`.
- `lint`, `typecheck`, `format:check`: PASS.
- Unit: 962 test PASS, 3 skip (77 file, hai project React cộng lại), không lỗi kiểu. Test của Drawer pass như trước.
- `scripts`: 149 test PASS (6 file).
- `pnpm check:contrast`: PASS. `dialog-grip` đo 3.95 light, 4.10 dark, 5.95 light +, 9.29 dark +; không ngoại lệ mới.
- Story dialog: 78 test PASS ở mỗi project (26 story × ba engine), kể cả 12 story cũ. Story drawer: 15 PASS.
- `pnpm build && pnpm check:package`: PASS với ngưỡng mới của Step 3. `check:dist-css` thấy `flg-dialog-header` và `flg-dialog-grip`; `check:rsc` và `check:use-client` pass như trước.
- `pnpm build-storybook`: PASS. Trong `storybook-static/index.json`, bốn story `components-dialog--dialog-movable…` không gắn `no-visual`, mười story `Movable…` thì có.
- `pnpm check:docs-tables`: PASS.
- Harness visual không chạy được trên máy này (ảnh chuẩn cần container Linux của CI); không chạy `pnpm test:visual`.

Kiểm tra cuối của cả nhánh, như Claude chạy ở đầu nhánh nháp `ac0ea8d` (nay `735c725`, cùng code):

```bash
pnpm gen:theme
pnpm check:name
npx tsc --noEmit -p .
pnpm vitest run --project unit --project unit-react18 --project scripts
pnpm check:contrast
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
pnpm vitest run --project storybook-light src/components/kbd
pnpm vitest run --project storybook-dark src/components/kbd
pnpm vitest run --project storybook-light src/components/dropdown-menu
pnpm vitest run --project storybook-dark src/components/dropdown-menu
pnpm vitest run --project storybook-light src/components/context-menu
pnpm vitest run --project storybook-dark src/components/context-menu
pnpm vitest run --project storybook-light src/components/search-field
pnpm vitest run --project storybook-dark src/components/search-field
pnpm vitest run --project storybook-light src/components/tooltip
pnpm vitest run --project storybook-dark src/components/tooltip
pnpm vitest run --project storybook-light src/components/dialog
pnpm vitest run --project storybook-dark src/components/dialog
pnpm vitest run --project storybook-light src/components/drawer
pnpm vitest run --project storybook-dark src/components/drawer
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
node -e "const e=Object.values(require('./storybook-static/index.json').entries);const v=e.filter((x)=>x.type==='story'&&!(x.tags||[]).includes('no-visual'));console.log(v.length);console.log(v.filter((x)=>/^components-kbd--|^components-dialog--dialog-movable/.test(x.id)).map((x)=>x.id).join(' '));console.log(e.filter((x)=>x.type==='docs'&&/^components-(kbd|dialog|dropdownmenu|searchfield)--/.test(x.id)).map((x)=>x.id).join(' '))"
```

Expected:
- `pnpm check:name`: PASS (`check:name: no "fl-glass-ui" outside docs/superpowers.`).
- `npx tsc --noEmit -p .`: PASS.
- `pnpm vitest run --project unit --project unit-react18 --project scripts`: PASS (bản nháp chạy được một lượt trên máy này; bản ghi chỉ giữ mã thoát, nên số test không có ở đây).
- `pnpm check:contrast`: PASS (`Contrast check passed.`).
- `pnpm check:package`: PASS với ngưỡng của Step 3 (CSS 16.6 kB trên 18.26 kB).
- `pnpm build-storybook`: PASS. Thư mục `storybook-static` bị git bỏ qua.
- `pnpm check:docs-tables`: `Docs tables: no table built as text in 210 files.`
- Story, ở mỗi project: kbd 51, dropdown-menu 48, context-menu 9, search-field 54, tooltip 42, dialog 78, drawer 15, docs 78 test PASS. Nếu trình duyệt đóng chậm sau một lần pass (`The browser did not close within 10000ms`), chạy lại riêng thư mục đó; chỉ tắt `chrome-headless-shell` do chính lần chạy này để lại.
- Lệnh `node` in `162`, rồi `components-dialog--dialog-movable components-dialog--dialog-movable-hover components-dialog--dialog-movable-dragging components-dialog--dialog-movable-phone components-kbd--kbd-in-text-apple components-kbd--kbd-in-text-other components-kbd--kbd-in-tooltip-apple components-kbd--kbd-in-tooltip-other components-kbd--kbd-in-menu-apple components-kbd--kbd-in-menu-other`, rồi `components-dialog--docs components-dropdownmenu--docs components-kbd--docs components-searchfield--docs`: 10 story giao diện, 80 ảnh chuẩn mới, như mô tả PR phải nêu (phát hiện 23).
- Không chạy cả bộ story một lượt; CI chạy cả bộ. Không chạy fixture: Plan A không đổi fixture nào.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  scripts/check-dist-css.ts \
  scripts/lib/contrast.test.ts \
  scripts/lib/contrast.ts \
  scripts/lib/theme-css.test.ts \
  src/components/dialog/Dialog.mdx \
  src/components/dialog/Dialog.stories.tsx \
  src/components/dialog/Dialog.test-d.ts \
  src/components/dialog/Dialog.test.tsx \
  src/components/dialog/Dialog.tsx \
  src/components/dialog/modal.tsx \
  src/components/dialog/use-movable.ts \
  src/docs/Accessibility.mdx \
  src/styles/components/dialog.css \
  src/styles/preferences.css \
  src/styles/theme/values.ts \
  tests/visual/stories.visual.ts
```
```bash
git commit -m "feat(dialog): DialogContent movable, dragged by its header (D2)" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```


## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines": 80 ảnh mới của 10 story giao diện (sáu của Kbd, bốn của Dialog; mỗi story 4 chế độ × sáng, tối). Xem ảnh trước khi xin review: khớp k1 và d2 ở chế độ `normal`; Kbd trong câu chữ, trên nút `primary` và cạnh SearchField, trong tooltip (cách chữ 6px) và trong menu (ô giữ nguyên trên "Paste" đang được trỏ), ở cả Apple và Other; Dialog ở giữa, hover header (tay nắm đậm), đang kéo (nhấc lên, tay nắm màu nhấn, lệch −112px, −34px) và trên điện thoại (không tay nắm); tiêu đề Dialog 15.5px (phát hiện 15); ảnh cũ của mọi component khác không đổi.
- Mô tả PR nêu cho chủ dự án những gì phát hiện 23 liệt kê, các quyết định Claude tự chốt và các mục để lại (phát hiện 24). Plan A không có changeset, nên merge PR này không mở PR "Version Packages"; `Kbd`, `MenuShortcut keys` và `movable` lên npm trong `0.5.0` (Plan G), và chủ dự án vẫn là người publish.
