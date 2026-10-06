# fl-glass-ui: Plan B, Menu (giai đoạn 2, phần 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm các phần `Menu*` dùng chung, DropdownMenu (có menu con, item checkbox và radio) và ContextMenu. Kèm theo là quyết định I1 của chủ dự án về tương phản trên lớp phủ, và hai việc còn lại từ Plan A.

**Architecture:**
- **Một panel cho mọi menu.** `MenuPanel` (nội bộ, trong `src/components/menu/`) là `popover="auto"` với `role="menu"`, được `useFloating` định vị, và mang bàn phím của menu. `DropdownMenuContent`, `ContextMenuContent` và `MenuSubContent` đều render nó.
- **Hai context.**
  - `MenuTreeContext` (`closeAll`) đi từ gốc qua mọi menu con, nên chọn một item ở đâu cũng đóng cả cây.
  - `MenuLevelContext` thuộc từng panel: panel đang hiện, menu con đang mở ở tầng đó, và vùng tam giác an toàn của con trỏ.
- **Item giữ mounted khi menu đóng.** Nhờ đó `MenuCheckboxItem` và `MenuRadioGroup` uncontrolled giữ giá trị giữa các lần mở. Popover đóng là `display: none`, nên item nằm ngoài cây truy cập. Menu con chỉ hiện sau khi panel cha đã hiện, và đóng theo khi panel cha đóng.
- **Highlight là focus.** Item đang được trỏ chính là item có focus (mọi item `tabIndex=-1`). CSS tô bằng `:focus` qua năm token dẫn xuất `--flg-highlight-*`.
- **Bàn phím.** `focusNext` (`src/internal/roving.ts`) cho mũi tên, Home, End. `useTypeahead` (`src/internal/use-typeahead.ts`) cho gõ chữ. Esc và bấm ra ngoài do trình duyệt lo (light dismiss).
- **ContextMenu** mở tại một điểm, qua phần tử ảo của Floating UI. Một lần nhấn (chuột phải, chạm và giữ) mở menu lúc nhả, vì trình duyệt light-dismiss popover đã hiện trong lúc con trỏ còn nhấn.

**Tech Stack:** Như Plan A: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`:
- §2: phạm vi Plan B.
- §3.3: lớp nổi gốc, vỏ overlay (Plan B thêm ngoại lệ cho panel menu).
- §4.2–4.5: token highlight, kích thước menu, tương phản, forced colors.
- §5: `roving.ts`, `use-typeahead.ts`, `use-floating.ts`.
- §6.3: các phần `Menu*`, DropdownMenu, ContextMenu.
- §7: kiểm thử, input thật, fixture.

Và §4.9 của `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md` (bảng điểm chưa đạt AA).

**Mockup chuẩn:** `docs/superpowers/specs/mockups/phase-2-menus.html`, phương án **A** (nền nhấn nhạt). CSS trong plan này dựng lại đúng phương án đó. Ảnh chụp story `Open` ở Chromium, light và dark, đã được so với mockup khi lập kế hoạch.

**Đã chạy thử khi lập kế hoạch:** toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/plan-b-tasks`, mỗi task một commit, và mỗi task đã chạy riêng các lệnh kiểm tra của nó. Mọi khối code trong plan được lấy thẳng từ các commit đó. Kết quả ở commit cuối:

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 486 test PASS, 2 skip (trước plan: 454), gồm React 19, React 18.3, script và type test |
| `pnpm test:stories` | 600 test PASS (trước plan: 552): 100 story × 3 trình duyệt × 2 theme, kèm axe |
| `pnpm check:contrast` | PASS, với ba dòng mới 8–10 ở §4.9 (Task 4) |
| `pnpm check:package` | PASS |
| `pnpm test:fixtures` | Cả hai fixture PASS, ở production lẫn development |

Mười phát hiện từ lần chạy thử đã được đưa vào plan. Spec được cập nhật theo, trong chính các task:

1. **Popover hiện trong lúc con trỏ đang nhấn sẽ bị light-dismiss khi thả** (đo ở cả ba engine). WebKit và Firefox phát `contextmenu` trước khi thả nút; Chromium trên Windows phát sau. Vì vậy ContextMenu mở lúc thả nếu nút còn đang nhấn, và chạm và giữ cũng mở lúc nhấc tay (Task 6).
2. **Shift+F10 và phím ContextMenu không thành `contextmenu`** ở WebKit và Firefox (dưới Playwright). Lib tự xử lý hai phím ở `keydown`. Chromium phát `contextmenu` cho phím ContextMenu sau `keyup`, lúc focus đã ở trong menu. `preventDefault` ở `keydown` không chặn được nó, nên panel tự chặn (Task 6).
3. **Item uncontrolled mất giá trị nếu menu unmount con khi đóng.** Panel menu giữ con mounted (ngoại lệ mới ở spec §3.3). Có hai hệ quả, mỗi hệ quả có test riêng ở Task 5:
   - React chạy layout effect của con trước cha, nên menu con đang mở sẽ gọi `showPopover()` trước menu gốc, rồi bị menu gốc đóng mất khi nó hiện. Menu con vì vậy chờ panel cha báo đã hiện.
   - Menu con không còn tự đóng nhờ unmount, nên panel đóng thì tự đóng menu con của nó.
4. **Tab ra khỏi menu.** Đóng menu ngay trong `focusout` kéo focus về trigger, vì lúc đó chưa phần tử nào có focus. Menu đóng chậm một task, nên focus đi đúng chỗ Tab gửi tới (Task 5).
5. **Item là link không đi theo link khi bấm Enter.** Enter và Space giờ gọi `click()` trên item, nên `<MenuItem asChild><a href>` hoạt động bằng bàn phím (Task 5).
6. **`MenuLabel` trong `MenuRadioGroup` đặt tên cho nhóm radio**, như trong `MenuGroup`. Mockup đặt nhãn "Sort by" ngay trong nhóm radio (Task 5).
7. **Item `danger` đang được trỏ giữ icon màu danger.** Quy tắc tô icon khi trỏ và quy tắc icon của `danger` có cùng độ ưu tiên, và quy tắc sau thắng. Plan thêm một quy tắc riêng cho trường hợp này (Task 5).
8. **Tooltip đang mở nuốt Esc của menu.** Đây là lỗi từ Plan A, lộ ra ở fixture: tooltip hiện do hover bắt Esc ở pha capture rồi `preventDefault`, nên menu đang có focus không đóng. Tooltip giờ nhường Esc khi focus nằm trong một overlay khác không chứa trigger của nó (Task 7).
9. **Tương phản của item đang được trỏ.** Đo theo mockup A, ba cặp dưới ngưỡng. Theo quy tắc đã duyệt ở spec §4.4 ("cặp nào dưới ngưỡng mà đúng như mockup thì thêm vào §4.9"), chúng thành dòng 8–10 (Task 4). Cả ba đạt ở `prefers-contrast: more`. **Chủ dự án nên xem ba dòng này khi duyệt plan.**
10. **Story chạy thẳng bằng `vitest` dùng CSS theme đã sinh từ trước.** Thêm token mà không chạy `pnpm gen:theme` thì story chạy với token cũ. Một assertion về màu icon ở story `Submenu` bắt được đúng lỗi này. `pnpm test:stories` tự sinh lại, còn lệnh `vitest` trong plan luôn chạy `pnpm gen:theme` trước.

**Phạm vi:**
- **Không làm ở plan này:**
  - Select và `matchWidth` của `useFloating` (Plan C).
  - Tabs, Accordion, Breadcrumb, Pagination (Plan D).
  - Toast, changeset `0.2.0` và trang docs tổng (Plan E).
  - Đo tương phản ở chế độ solid fallback (vẫn hoãn từ giai đoạn 1).
- **Ảnh chuẩn visual:**
  - Plan thêm một story có ảnh: `DropdownMenu/Open`, tức 8 ảnh mới. Các story khác của menu gắn `no-visual`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` nằm trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`.
- **Mockup lock.** Chỉ hai chỗ đổi token, đều có căn cứ:
  - Task 1 làm đậm ba màu trạng thái light ngoài mockup (quyết định I1 của chủ dự án, 2026-10-06).
  - Task 4 thêm năm token dẫn xuất `highlight-*` trỏ về token mockup, kèm giá trị `prefers-contrast: more` của chúng.
  - Không đổi giá trị token nào khác trong `src/styles/theme/values.ts`. CSS ở plan này là bản đã đối chiếu với mockup, không được "cải thiện".
- `backdrop-filter` chỉ có ở: `Surface`, `Card`, panel của Dialog và Drawer, Popover, menu (qua `.flg-surface`), Tooltip, `::backdrop` (spec §4.2).
- **Không set `display` vô điều kiện** cho phần tử `popover`. `.flg-menu` không set `display`.
- **`"use client"`** chỉ có ở `Menu.tsx`, `DropdownMenu.tsx`, `ContextMenu.tsx` (cùng các module client của giai đoạn 1 và Plan A). `MenuPanel.tsx`, `menu-context.ts` và mọi file trong `src/internal/` **không** có directive.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Sự kiện `toggle` gắn bằng `addEventListener` (qua `usePopover`), không dùng prop React.
- Chữ mặc định do lib cung cấp bằng tiếng Anh. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. Plan này không thêm changeset.
- Mỗi task thêm CSS hoặc JS (Task 5, 6, 7): chạy `pnpm build && pnpm size:record` trước `pnpm check:package`, và commit `.size-limit.json` đã cập nhật.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme` (phát hiện 10).
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.** Với file đã có, plan đưa một patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo. Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử. Với file mới, plan đưa toàn bộ nội dung file.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý nhưng không nêu thành test. Mỗi dòng có test ở task tương ứng:

1. **Bật "Show grid" (uncontrolled), đóng menu, mở lại:** item vẫn được chọn. Lựa chọn của nhóm radio cũng vậy. Test ở Task 5: story `CheckboxAndRadioItems`.
2. **Chuột phải trên Safari, Firefox, hay Chrome trên macOS và Linux** (nơi `contextmenu` tới khi nút còn nhấn): menu vẫn mở sau khi nhả nút. Test ở Task 6: story `Default`, chuột phải thật của Playwright trên WebKit và Firefox.
3. **Con trỏ nằm trên một nút có tooltip, trong lúc bàn phím làm việc trong menu:** Esc đóng menu, không chỉ đóng tooltip. Test ở Task 7: story `Tooltip/WhileAMenuHasFocus`.
4. **`<MenuItem asChild><a href="…">` chọn bằng Enter:** trình duyệt đi theo link, và menu đóng. Test ở Task 5: story `LinkItems`.
5. **Chọn một item trong menu con, rồi mở lại menu:** menu con không còn mở sẵn. Test ở Task 5: story `Submenu`.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/styles/theme/values.ts` | Ba màu trạng thái light (Task 1); năm token `highlight-*` và giá trị `prefers-contrast: more` của chúng (Task 4) |
| `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `scripts/check-contrast.ts` | Đo mọi cặp bề mặt trên lớp phủ (Task 1); đo item đang được trỏ (Task 4) |
| `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx` | Số đo mới của dòng 2 và 7 (Task 1); dòng 8–10 (Task 4) |
| `src/components/drawer/Drawer.stories.tsx`, `CONTRIBUTING.md` | Hai việc còn lại từ Plan A (Task 2) |
| `src/internal/roving.ts`, `src/internal/use-typeahead.ts` | Phím mũi tên, Home, End và gõ chữ trong một danh sách item (Task 3) |
| `src/internal/use-floating.ts` | Thêm `alignOffset` và `maxHeight` (Task 5) |
| `src/components/menu/menu-context.ts` | Hai context của menu, `useMenu`, `menuItems`, `isPointInPolygon` (Task 5) |
| `src/components/menu/MenuPanel.tsx` | Panel dùng chung: popover, định vị, bàn phím, Tab, menu con (Task 5) |
| `src/components/menu/Menu.tsx` | Các phần `Menu*` công khai (Task 5) |
| `src/components/dropdown-menu/DropdownMenu.tsx` | DropdownMenu, trigger, content (Task 5) |
| `src/components/context-menu/ContextMenu.tsx` | ContextMenu, vùng trigger, content (Task 6) |
| `src/styles/components/menu.css` | Giao diện menu theo mockup A (Task 5); `-webkit-touch-callout` của vùng ContextMenu (Task 6) |
| `src/styles/components/floating.css`, `src/styles/preferences.css`, `src/styles/index.css` | Animation mở, forced colors, thứ tự import (Task 5) |
| `src/components/tooltip/Tooltip.tsx` | Nhường Esc cho overlay đang có focus (Task 7) |
| `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Export và kiểm tra gói (Task 5, 6) |
| `fixtures/*`, `scripts/test-fixtures.mjs` | Menu trong hai app fixture (Task 8) |
| Hai spec | Cập nhật theo phát hiện, trong task tương ứng |

---

### Task 1: Quyết định I1, làm đậm ba màu trạng thái và đo mọi cặp trên lớp phủ

Chủ dự án chọn phương án "làm đậm 3%" ngày 2026-10-06. Plan A chỉ đo chữ thường và chữ phụ trên panel phủ scrim. Spec §4.4 đòi đo **mọi cặp** trên panel, và khi đo như vậy, chữ Badge trạng thái ở light tụt xuống 4.37:1.

**Files:**
- Modify: `scripts/lib/contrast.ts`, `src/styles/theme/values.ts`, `scripts/contrast-exceptions.ts`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`
- Test: `src/docs/ExceptionTable.test.tsx`

**Interfaces:**
- Consumes: không có gì mới.
- Produces:
  - `CHECKS` bỏ `scrim-text` và `scrim-text-muted`. Mọi check bề mặt chạy cả trên kính thường lẫn trên panel phủ scrim. `OverlayCheck` chỉ còn `'tooltip-text'`.
  - Màu light mới: `success` `#115934`, `warning` `#734200`, `danger` `#92222b`. `danger-fill` giữ `#96232c`.

- [ ] **Step 1: Sửa test bảng ngoại lệ (test fail)**

```diff
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index a25dbc1..23c3dde 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -28,7 +28,7 @@ describe('ExceptionTable', () => {
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
-    expect(rows[6]).toHaveTextContent('3.53:1');
+    expect(rows[6]).toHaveTextContent('3.40:1');
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/docs/ExceptionTable.test.tsx`
Expected: 1 test FAIL (`lists the seven rows…`), vì dòng 7 vẫn ghi 3.53:1.

- [ ] **Step 3: Đo mọi check bề mặt trên panel phủ scrim**

```diff
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 0fb15b5..8d3c162 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -28,15 +28,13 @@ export const CHECKS = {
   'focus-indicator': 3,
   'input-focus-border': 3,
   'checked-fill': 3,
-  'scrim-text': 4.5,
-  'scrim-text-muted': 4.5,
   'tooltip-text': 4.5,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
 /** Measured over their own surfaces rather than the plain glass. */
-type OverlayCheck = 'scrim-text' | 'scrim-text-muted' | 'tooltip-text';
-const OVERLAY_CHECKS: readonly CheckId[] = ['scrim-text', 'scrim-text-muted', 'tooltip-text'];
+type OverlayCheck = 'tooltip-text';
+const OVERLAY_CHECKS: readonly CheckId[] = ['tooltip-text'];
 const SURFACE_CHECK_IDS = CHECK_IDS.filter((id) => !OVERLAY_CHECKS.includes(id)) as Array<
   Exclude<CheckId, OverlayCheck>
 >;
@@ -138,18 +136,13 @@ export function measure(
   const backdrops = values.referenceBackgrounds[theme].map(parseColor);
   const surfaceOver = (backdrop: Rgba) =>
     borderStops.map((stop) => composite(color('glass-tint'), composite(stop, backdrop)));
-  const surfaces = backdrops.flatMap(surfaceOver);
-  // Dialog and Drawer: the panel over the page darkened by the scrim (spec §4.4).
-  const scrimmed = backdrops.flatMap((backdrop) =>
-    surfaceOver(composite(color('scrim'), backdrop)),
-  );
+  // Every surface check runs on the plain glass and on a Dialog or Drawer panel, which sits over
+  // the page darkened by the scrim (spec §4.4: every pair on the panel).
+  const scrimmed = backdrops.map((backdrop) => composite(color('scrim'), backdrop));
+  const surfaces = [...backdrops, ...scrimmed].flatMap(surfaceOver);
   // Tooltip: the tint straight over the page, with no border gradient under it.
   const tooltips = backdrops.map((backdrop) => composite(color('glass-tint'), backdrop));
   const textOn = (name: string, under: Rgba) => contrastRatio(composite(color(name), under), under);
-  for (const under of scrimmed) {
-    lowest['scrim-text'] = Math.min(lowest['scrim-text'], textOn('text', under));
-    lowest['scrim-text-muted'] = Math.min(lowest['scrim-text-muted'], textOn('text-muted', under));
-  }
   for (const under of tooltips) {
     lowest['tooltip-text'] = Math.min(lowest['tooltip-text'], textOn('text', under));
   }
```

- [ ] **Step 4: Chạy script tương phản để thấy hệ quả**

Run: `pnpm check:contrast | tail -6`
Expected: script fail với đúng 5 vấn đề:

```
- light/default badge-success = 4.37 is below 4.5:1. …
- light/default badge-warning = 4.37 is below 4.5:1. …
- light/default badge-danger = 4.37 is below 4.5:1. …
- light/default badge-accent = 3.40 is worse than the recorded 3.53 (spec §4.9 row 7).
- light/default focus-indicator = 1.20 is worse than the recorded 1.21 (spec §4.9 row 2).
```

- [ ] **Step 5: Làm đậm ba màu trạng thái và ghi số mới cho dòng 2 và 7**

```diff
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 27d22f8..55ea3a4 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -52,13 +52,13 @@ const D = {
 export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 1, theme: 'light', check: 'control-border', recorded: 1.28, ...D[1] },
   { row: 1, theme: 'dark', check: 'control-border', recorded: 1.31, ...D[1] },
-  { row: 2, theme: 'light', check: 'focus-indicator', recorded: 1.21, ...D[2] },
+  { row: 2, theme: 'light', check: 'focus-indicator', recorded: 1.2, ...D[2] },
   { row: 2, theme: 'dark', check: 'focus-indicator', recorded: 1.23, ...D[2] },
   { row: 3, theme: 'dark', check: 'input-focus-border', recorded: 2.06, ...D[3] },
   { row: 4, theme: 'dark', check: 'on-accent-start', recorded: 3.63, ...D[4] },
   { row: 4, theme: 'dark', check: 'on-accent-end', recorded: 2.24, ...D[4] },
   { row: 5, theme: 'dark', check: 'checked-fill', recorded: 2.26, ...D[5] },
   { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, ...D[6] },
-  { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.53, ...D[7] },
+  { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
   { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
 ];
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index 7376658..39c6e36 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -68,9 +68,9 @@ export const themes: Readonly<Record<ThemeName, TokenMap>> = {
     'control-border': 'rgba(31,36,51,.14)',
     'control-track': 'rgba(31,36,51,.12)',
     'control-thumb': '#ffffff',
-    success: '#125c36', // (outside mockup)
-    warning: '#774400', // (outside mockup)
-    danger: '#96232c', // (outside mockup)
+    success: '#115934', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
+    warning: '#734200', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
+    danger: '#92222b', // (outside mockup) darkened 3% to pass over the Dialog scrim (I1)
     'danger-fill': '#96232c', // (outside mockup) Plan 2 mockup option B: danger button fill
     'on-danger': '#ffffff', // (outside mockup)
     'status-bg-alpha': '12%', // (outside mockup)
```

- [ ] **Step 6: Ghi quyết định vào hai spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index bef2f0b..457c50b 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -308,19 +308,19 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 
 ### 4.9 Các điểm chưa đạt WCAG AA (đã biết, công khai)
 
-Đây là hệ quả của quyết định giữ đúng mockup. Số liệu đo trên giá trị mockup với các nền ở §4.8, lấy giá trị **thấp nhất**:
+Đây là hệ quả của quyết định giữ đúng mockup. Số liệu đo trên giá trị mockup với các nền ở §4.8, lấy giá trị **thấp nhất**. Từ giai đoạn 2, mỗi cặp được đo cả trên kính thường lẫn trên panel của Dialog/Drawer, nằm trên nền đã phủ lớp tối (spec giai đoạn 2, §4.4):
 
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus) | 1.21:1 | 1.23:1 | 3:1 | 1.4.11 |
-| 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.48:1) | 2.06:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus) | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
+| 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
-| 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) so với nền | đạt (3.18:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.31:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
-| 7 | Chữ Badge `accent` (`--flg-accent-text` trên `--flg-accent-subtle`) | 3.53:1 (nền `#ff5fa2`) | 3.76:1 | 4.5:1 | 1.4.3 |
+| 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 7 | Chữ Badge `accent` (`--flg-accent-text` trên `--flg-accent-subtle`) | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 
-Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch.
+Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
 Cả bảy điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index cf6e2fe..28ac031 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -359,11 +359,11 @@ Số liệu lấy từ mockup đã duyệt. Mọi giá trị đều dùng token
 - Tab `pill` đang chọn.
 - Trang hiện tại của Pagination.
 
-Số đo không đổi (3.53:1 light, 3.76:1 dark) vì cùng một cặp màu. `scripts/contrast-exceptions.ts` được sửa nhãn cho điểm này.
+Vì cùng một cặp màu, số đo không đổi so với Badge: 3.40:1 light (trên lớp phủ, xem bên dưới) và 3.76:1 dark. `scripts/contrast-exceptions.ts` được sửa nhãn cho điểm này.
 
 **`scripts/check-contrast.ts` đo thêm:**
 
-- **Panel trên lớp phủ.** Mọi cặp chữ trên panel của Dialog và Drawer, đo trên nền tham chiếu đã phủ `--flg-scrim`.
+- **Panel trên lớp phủ.** Mọi cặp trên panel của Dialog và Drawer, đo trên nền tham chiếu đã phủ `--flg-scrim`. Cụ thể, mọi check bề mặt chạy cả trên kính thường lẫn trên panel phủ lớp tối, và lấy số thấp hơn. Ở light, cách đo này làm chữ Badge trạng thái tụt xuống 4.37:1. Chủ dự án chọn làm đậm 3% ba màu trạng thái ngoài mockup: `success` `#125c36`→`#115934`, `warning` `#774400`→`#734200`, `danger` `#96232c`→`#92222b` (2026-10-06). §4.9 ghi số mới cho dòng 2 (1.20:1) và dòng 7 (3.40:1).
 - **Chữ trên nền kính:**
   - Chữ của item menu đang được trỏ, trên `--flg-accent-subtle`.
   - Chữ của item `danger` đang được trỏ, trên nền danger 16%.
```

- [ ] **Step 7: Chạy lại script, test và kiểm tra tĩnh**

Run: `pnpm check:contrast | grep -E "light +default +(success|warning|danger|badge-success|badge-warning|badge-danger) |passed" && pnpm vitest run --project scripts --project unit scripts src/docs && pnpm lint && pnpm typecheck`
Expected:
- Script in `Contrast check passed.` Ở light `default`: `success` 5.39, `warning` 5.37, `danger` 5.42, `badge-success` 4.54, `badge-warning` 4.54, `badge-danger` 4.51.
- 52 test PASS (47 script, 5 docs).

- [ ] **Step 8: Commit**

```bash
git add scripts/lib/contrast.ts src/styles/theme/values.ts scripts/contrast-exceptions.ts src/docs/ExceptionTable.test.tsx docs/superpowers/specs
git commit -m "feat: darken the light status colours 3% and measure every pair over the scrim" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: Hai việc còn lại từ Plan A

Chủ dự án chọn gộp vào Plan B (2026-10-06):
- Story `Drawer/SlidesIn` kiểm tra thật rằng panel đang trượt, qua `getAnimations()`.
- `CONTRIBUTING.md` ghi rằng chạy lại một job CI là chạy lại commit cũ.

**Files:**
- Modify: `src/components/drawer/Drawer.stories.tsx`, `CONTRIBUTING.md`

**Interfaces:**
- Consumes: không có gì mới.
- Produces: không có API mới.

- [ ] **Step 1: Cho story `SlidesIn` bắt được panel không trượt**

```diff
diff --git a/src/components/drawer/Drawer.stories.tsx b/src/components/drawer/Drawer.stories.tsx
index c4c0faa..17ce2f5 100644
--- a/src/components/drawer/Drawer.stories.tsx
+++ b/src/components/drawer/Drawer.stories.tsx
@@ -1,4 +1,5 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
+import type { CSSProperties } from 'react';
 import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
 import { CloseIcon } from '../../../.storybook/icons';
 import { realUserEvent, settled } from '../../../.storybook/real-input';
@@ -130,10 +131,14 @@ export const Bottom: Story = {
 
 const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
 
+// A slide that lasts long enough for the check to see it running even on a slow CI machine, where
+// the 200ms default can be over before the play function looks.
+const slowSlide = { display: 'flex', gap: 8, '--flg-duration-normal': '10s' } as CSSProperties;
+
 export const SlidesIn: Story = {
   tags: ['no-visual'],
   render: (args) => (
-    <div style={{ display: 'flex', gap: 8 }}>
+    <div style={slowSlide}>
       <Drawer {...args}>
         <DrawerTrigger variant="secondary">From the right</DrawerTrigger>
         <InvoiceDrawer />
@@ -152,13 +157,19 @@ export const SlidesIn: Story = {
       canvas.getByRole('button', { name: trigger }).click();
       await waitFor(() => expect(dialog.open).toBe(true));
       const panel = dialog.querySelector('.flg-drawer-panel') as HTMLElement;
-      // The frame scrolling is what cancelled the slide, so it is what this checks. Whether the
-      // slide is visibly in motion depends on the environment (a hidden or throttled CI tab does
-      // not run transitions), so the movement itself is left to the eye and the visual tests.
       await nextFrame();
       await nextFrame();
+      // The panel slides: its transform transition is running, and the frame has not scrolled.
+      const slide = panel
+        .getAnimations()
+        .find(
+          (animation) =>
+            animation instanceof CSSTransition && animation.transitionProperty === 'transform',
+        );
+      await expect(slide?.playState).toBe('running');
       await expect(dialog.scrollLeft).toBe(0);
       await expect(dialog.scrollTop).toBe(0);
+      for (const animation of dialog.getAnimations({ subtree: true })) animation.finish();
       await settled(panel);
       await expect(dialog.scrollLeft).toBe(0);
       await expect(dialog.scrollTop).toBe(0);
```

Story làm chậm animation (`--flg-duration-normal: 10s` trên khung bọc), tìm `CSSTransition` của `transform` trên panel, và đòi nó đang chạy. Sau đó nó kiểm tra khung `<dialog>` không bị cuộn ngang hay dọc. Lúc lập kế hoạch, đổi `overflow: clip` của khung thành `overflow: hidden` làm story fail (`scrollLeft` là 396), nên story bắt được đúng lỗi Plan A đã sửa.

- [ ] **Step 2: Chạy story trên cả ba trình duyệt**

Run: `pnpm gen:theme && pnpm vitest run --project storybook-light --project storybook-dark src/components/drawer`
Expected: mọi test PASS.

- [ ] **Step 3: Ghi chú về chạy lại job visual**

```diff
diff --git a/CONTRIBUTING.md b/CONTRIBUTING.md
index c0af7b4..48141fa 100644
--- a/CONTRIBUTING.md
+++ b/CONTRIBUTING.md
@@ -34,8 +34,10 @@ branch; it commits the new images. With Docker installed you can also run `pnpm
 locally. Never commit screenshots taken outside the container.
 
 The workflow pushes its commit with `GITHUB_TOKEN`, and GitHub does not start new workflow runs for
-such pushes, so CI does not re-run on that commit. Push any later change, or re-run CI by hand,
-before you rely on a green check; keep this in mind before making CI a required check.
+such pushes, so CI does not run on that commit. Re-running an earlier CI run does not help either:
+a re-run tests the commit it first ran on, which has no baselines. Push any later change, or close
+and reopen the pull request, before you rely on a green check; keep this in mind before making CI a
+required check.
 
 ## Screen reader checks
 
```

- [ ] **Step 4: Commit**

```bash
git add src/components/drawer/Drawer.stories.tsx CONTRIBUTING.md
git commit -m "test: assert the Drawer slide-in runs, and note how to retest visual baselines" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: `roving.ts` và `useTypeahead`

Spec §5 từng mô tả một hook `useRovingFocus` hai chế độ. Menu chỉ cần một hàm, nên plan thay hook đó bằng `focusNext` và ghi lại vào spec. Tabs (Plan D) sẽ dùng `getNextIndex` và tự giữ `tabIndex=0`.

**Files:**
- Create: `src/internal/roving.ts`, `src/internal/use-typeahead.ts`
- Test: `src/internal/roving.test.ts`, `src/internal/use-typeahead.test.ts`
- Modify: `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`

**Interfaces:**
- Consumes: không có gì mới.
- Produces:
  - `type Orientation = 'vertical' | 'horizontal'`, `interface RovingOptions { orientation: Orientation; loop: boolean }`.
  - `getNextIndex(items: readonly { disabled?: boolean | undefined }[], current: number, key: string, options: RovingOptions): number | null`: `current` là -1 khi chưa item nào có focus; trả `null` cho phím không điều hướng hoặc khi mọi item đều disabled.
  - `isDisabledItem(el: Element): boolean`: `true` khi `aria-disabled="true"` hoặc `:disabled`.
  - `focusNext(event, items: readonly HTMLElement[], options: RovingOptions): boolean`: `preventDefault` rồi focus item kế tiếp; trả `true` nếu đã xử lý phím.
  - `TYPEAHEAD_TIMEOUT = 500`, `findTypeaheadMatch(texts: readonly string[], current: number, search: string): number` (-1 khi không khớp), `itemText(el: HTMLElement): string`.
  - `useTypeahead(getItems: () => HTMLElement[], onMatch: (el: HTMLElement) => void)`: trả handler `keydown`, handler trả `true` nếu đã dùng phím.

- [ ] **Step 1: Viết test**

`src/internal/roving.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getNextIndex } from './roving';

const items = (...disabled: boolean[]) => disabled.map((value) => ({ disabled: value }));
const vertical = { orientation: 'vertical', loop: true } as const;

describe('getNextIndex', () => {
  it('moves down and up, wrapping at the ends when looping', () => {
    const list = items(false, false, false);
    expect(getNextIndex(list, 0, 'ArrowDown', vertical)).toBe(1);
    expect(getNextIndex(list, 2, 'ArrowDown', vertical)).toBe(0);
    expect(getNextIndex(list, 0, 'ArrowUp', vertical)).toBe(2);
  });

  it('stays at the ends without looping', () => {
    const list = items(false, false);
    const options = { orientation: 'vertical', loop: false } as const;
    expect(getNextIndex(list, 1, 'ArrowDown', options)).toBe(1);
    expect(getNextIndex(list, 0, 'ArrowUp', options)).toBe(0);
  });

  it('skips disabled items, also for Home and End', () => {
    const list = items(true, false, true, false, true);
    expect(getNextIndex(list, 1, 'ArrowDown', vertical)).toBe(3);
    expect(getNextIndex(list, 3, 'ArrowDown', vertical)).toBe(1);
    expect(getNextIndex(list, 3, 'Home', vertical)).toBe(1);
    expect(getNextIndex(list, 1, 'End', vertical)).toBe(3);
  });

  it('starts at the first or the last item when nothing has focus', () => {
    const list = items(false, false, false);
    expect(getNextIndex(list, -1, 'ArrowDown', vertical)).toBe(0);
    expect(getNextIndex(list, -1, 'ArrowUp', vertical)).toBe(2);
  });

  it('uses the arrows of its orientation and ignores the others', () => {
    const list = items(false, false);
    const horizontal = { orientation: 'horizontal', loop: true } as const;
    expect(getNextIndex(list, 0, 'ArrowRight', horizontal)).toBe(1);
    expect(getNextIndex(list, 1, 'ArrowLeft', horizontal)).toBe(0);
    expect(getNextIndex(list, 0, 'ArrowDown', horizontal)).toBeNull();
    expect(getNextIndex(list, 0, 'ArrowRight', vertical)).toBeNull();
    expect(getNextIndex(list, 0, 'a', vertical)).toBeNull();
  });

  it('returns null when every item is disabled', () => {
    expect(getNextIndex(items(true, true), 0, 'ArrowDown', vertical)).toBeNull();
  });
});
```

`src/internal/use-typeahead.test.ts`:

```ts
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findTypeaheadMatch, TYPEAHEAD_TIMEOUT, useTypeahead } from './use-typeahead';

const FRUIT = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Blackberry'];

describe('findTypeaheadMatch', () => {
  it('finds the first item that starts with the search, ignoring case', () => {
    expect(findTypeaheadMatch(FRUIT, -1, 'b')).toBe(1);
    expect(findTypeaheadMatch(FRUIT, -1, 'CH')).toBe(3);
    expect(findTypeaheadMatch(FRUIT, -1, 'z')).toBe(-1);
  });

  it('moves on to the next item with the same first letter, and wraps', () => {
    expect(findTypeaheadMatch(FRUIT, 1, 'b')).toBe(2);
    expect(findTypeaheadMatch(FRUIT, 4, 'b')).toBe(1);
  });

  it('treats a repeated letter as cycling through that letter', () => {
    expect(findTypeaheadMatch(FRUIT, 1, 'bb')).toBe(2);
    expect(findTypeaheadMatch(FRUIT, 2, 'bbb')).toBe(4);
  });

  it('keeps the current item while a longer search still matches it', () => {
    expect(findTypeaheadMatch(FRUIT, 2, 'blu')).toBe(2);
    expect(findTypeaheadMatch(FRUIT, 2, 'bla')).toBe(4);
  });
});

function list(...labels: string[]) {
  const root = document.createElement('div');
  for (const label of labels) {
    const el = document.createElement('div');
    el.tabIndex = -1;
    el.textContent = label;
    root.append(el);
  }
  document.body.append(root);
  return Array.from(root.children) as HTMLElement[];
}

const key = (k: string) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault: vi.fn(),
});

describe('useTypeahead', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('builds a search from keys typed within 500ms, then starts over', () => {
    const items = list('Rename', 'Remove', 'Share');
    const onMatch = vi.fn((el: HTMLElement) => el.focus());
    const { result } = renderHook(() => useTypeahead(() => items, onMatch));
    result.current(key('r'));
    result.current(key('e'));
    result.current(key('m'));
    expect(onMatch).toHaveBeenLastCalledWith(items[1]);
    vi.advanceTimersByTime(TYPEAHEAD_TIMEOUT);
    result.current(key('s'));
    expect(onMatch).toHaveBeenLastCalledWith(items[2]);
  });

  it('leaves a lone Space and modified keys alone, but counts a Space inside a search', () => {
    const items = list('Save as', 'Save', 'Settings');
    const onMatch = vi.fn((el: HTMLElement) => el.focus());
    const { result } = renderHook(() => useTypeahead(() => items, onMatch));
    expect(result.current(key(' '))).toBe(false);
    expect(result.current({ ...key('s'), ctrlKey: true })).toBe(false);
    expect(result.current(key('ArrowDown'))).toBe(false);
    for (const k of ['s', 'a', 'v', 'e', ' ']) result.current(key(k));
    expect(onMatch).toHaveBeenLastCalledWith(items[0]);
  });

  it('skips disabled items and uses data-text-value when set', () => {
    const items = list('Delete', 'Duplicate', 'Download');
    items[0]?.setAttribute('aria-disabled', 'true');
    if (items[2]) items[2].dataset.textValue = 'Export';
    const onMatch = vi.fn();
    const { result } = renderHook(() => useTypeahead(() => items, onMatch));
    result.current(key('d'));
    expect(onMatch).toHaveBeenLastCalledWith(items[1]);
    vi.advanceTimersByTime(TYPEAHEAD_TIMEOUT);
    result.current(key('e'));
    expect(onMatch).toHaveBeenLastCalledWith(items[2]);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/roving.test.ts src/internal/use-typeahead.test.ts`
Expected: cả hai file FAIL vì chưa có module.

- [ ] **Step 3: Viết hai module**

`src/internal/roving.ts`:

```ts
export type Orientation = 'vertical' | 'horizontal';

export interface RovingOptions {
  orientation: Orientation;
  /** Wrap from the last item to the first and back. */
  loop: boolean;
}

/** What a navigation key asks for. */
type Move = 'next' | 'previous' | 'first' | 'last';

const KEYS: Record<Orientation, Record<string, Move>> = {
  vertical: { ArrowDown: 'next', ArrowUp: 'previous', Home: 'first', End: 'last' },
  horizontal: { ArrowRight: 'next', ArrowLeft: 'previous', Home: 'first', End: 'last' },
};

/**
 * The index a navigation key moves to, skipping disabled items. `current` is -1 when no item has
 * focus: then the next item is the first and the previous one the last. Returns null for a key that
 * does not navigate, or when every item is disabled. Without `loop`, the ends stay where they are.
 */
export function getNextIndex(
  items: readonly { disabled?: boolean | undefined }[],
  current: number,
  key: string,
  { orientation, loop }: RovingOptions,
): number | null {
  const move = KEYS[orientation][key];
  if (!move) return null;
  const enabled = items.flatMap((item, index) => (item.disabled ? [] : [index]));
  if (enabled.length === 0) return null;
  const first = enabled[0] as number;
  const last = enabled[enabled.length - 1] as number;
  if (move === 'first') return first;
  if (move === 'last') return last;
  if (current < 0) return move === 'next' ? first : last;
  if (move === 'next') {
    const after = enabled.find((index) => index > current);
    return after ?? (loop ? first : current);
  }
  const before = enabled.filter((index) => index < current).pop();
  return before ?? (loop ? last : current);
}

/** True for an item the user cannot act on: native `disabled` or `aria-disabled="true"`. */
export function isDisabledItem(el: Element): boolean {
  return el.getAttribute('aria-disabled') === 'true' || el.matches(':disabled');
}

/**
 * Moves focus among `items` for a navigation key and reports whether it did. The caller decides
 * what the items are; Tab order (`tabIndex`) is the caller's business too.
 */
export function focusNext(
  event: { key: string; preventDefault(): void },
  items: readonly HTMLElement[],
  options: RovingOptions,
): boolean {
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = getNextIndex(
    items.map((el) => ({ disabled: isDisabledItem(el) })),
    current,
    event.key,
    options,
  );
  if (next === null) return false;
  event.preventDefault();
  items[next]?.focus();
  return true;
}
```

`src/internal/use-typeahead.ts`:

```ts
import { useCallback, useEffect, useRef } from 'react';
import { isDisabledItem } from './roving';

/** How long a pause ends the typed search, in ms. */
export const TYPEAHEAD_TIMEOUT = 500;

/**
 * The index of the item that a typed search lands on, or -1. Case is ignored. Typing the same
 * letter again moves on to the next item that starts with it, so "b", "b" cycles through every "b"
 * item; any other search starts after the current item too, and wraps around.
 */
export function findTypeaheadMatch(
  texts: readonly string[],
  current: number,
  search: string,
): number {
  const query = search.toLowerCase();
  const repeated = query.length > 1 && [...query].every((char) => char === query[0]);
  const needle = repeated ? (query[0] ?? '') : query;
  const count = texts.length;
  // A single letter looks past the current item; a longer search may match it again.
  const start = needle.length === 1 ? current + 1 : Math.max(current, 0);
  for (let step = 0; step < count; step += 1) {
    const index = (start + step) % count;
    if (texts[index]?.toLowerCase().startsWith(needle)) return index;
  }
  return -1;
}

/** The text a typed search matches: `data-text-value` when set, else the visible text. */
export function itemText(el: HTMLElement): string {
  return (el.dataset.textValue ?? el.textContent ?? '').trim();
}

/**
 * Typing jumps to the item whose text starts with what was typed in the last 500ms. Returns a
 * keydown handler that reports whether it used the key. Space counts as a character only inside a
 * search, so a lone Space still activates the item.
 */
export function useTypeahead(
  getItems: () => HTMLElement[],
  onMatch: (el: HTMLElement) => void,
): (event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  preventDefault(): void;
}) => boolean {
  const search = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(
    (event) => {
      const { key } = event;
      if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return false;
      if (key === ' ' && search.current === '') return false;
      event.preventDefault();
      clearTimeout(timer.current);
      search.current += key;
      timer.current = setTimeout(() => {
        search.current = '';
      }, TYPEAHEAD_TIMEOUT);
      const items = getItems().filter((el) => !isDisabledItem(el));
      const current = items.indexOf(document.activeElement as HTMLElement);
      const match = findTypeaheadMatch(items.map(itemText), current, search.current);
      const el = match >= 0 ? items[match] : undefined;
      if (el) onMatch(el);
      return true;
    },
    [getItems, onMatch],
  );
}
```

- [ ] **Step 4: Chạy test**

Run: `pnpm vitest run --project unit src/internal/roving.test.ts src/internal/use-typeahead.test.ts && pnpm lint && pnpm typecheck`
Expected: 13 test PASS.

- [ ] **Step 5: Cập nhật spec**

````diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 28ac031..bc262f5 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -38,7 +38,7 @@ Các yêu cầu bắt buộc của spec 0+1 §1 giữ nguyên:
 | Plan | Nội dung | Phụ thuộc |
 |---|---|---|
 | **A** | Mốc trình duyệt mới, dependency `@floating-ui/dom`, token scrim. Primitives: `useControllableState`, `useFloating`, `usePopover`, `focus`, `lockScroll`, modal stack. Component: **Dialog, Drawer, Popover, Tooltip** | — |
-| **B** | Primitives: `useRovingFocus`, `useTypeahead`. Component: các phần `Menu*` dùng chung, **DropdownMenu** (có menu con, item checkbox và radio), **ContextMenu** | A |
+| **B** | Primitives: `roving.ts` (`getNextIndex`, `focusNext`), `useTypeahead`. Component: các phần `Menu*` dùng chung, **DropdownMenu** (có menu con, item checkbox và radio), **ContextMenu** | A |
 | **C** | Primitive: `collectChildren`. Component: **Select** chọn một và chọn nhiều, kèm `<select>` gốc ẩn | A, B |
 | **D** | **Tabs, Accordion, Breadcrumb, Pagination** | B, C (`collectChildren`) |
 | **E** | **Toast** và `Toaster`, các trang docs chung, fixtures đầy đủ, changeset `0.2.0` | A |
@@ -164,7 +164,7 @@ Mỗi plan tự mang đủ phần của mình: stories, test các lớp ở §7,
 ```
 src/internal/        use-controllable-state.ts, use-floating.ts, use-popover.ts, focus.ts,
                      lock-scroll.ts, modal-stack.ts, use-iso-layout-effect.ts, react-lazy.ts,
-                     roving.ts, use-roving-focus.ts, use-typeahead.ts, collect-children.ts
+                     roving.ts, use-typeahead.ts, collect-children.ts
 src/components/      dialog/, drawer/, popover/, tooltip/, menu/ (phần Menu* dùng chung),
                      dropdown-menu/, context-menu/, select/, tabs/, accordion/,
                      breadcrumb/, pagination/, toast/
@@ -409,8 +409,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | `focus.ts` | `getFocusables(root)`, `focusFirst(root)`, `isFocusable(el)` | Tìm các phần tử nhận focus được, theo thứ tự DOM, bỏ qua phần tử bị ẩn, `inert` hoặc `disabled` |
 | `lock-scroll.ts` | `lockScroll(): () => void` | Có đếm số lần khoá. Lần khoá đầu đặt `overflow: hidden` lên `<html>`, kèm `scrollbar-gutter: stable` nếu trang đang có thanh cuộn dọc (để bố cục không bị xô). Lần mở khoá cuối trả lại style cũ |
 | `modal-stack.ts` | `registerModal(el, host)`, `subscribeModals(fn)`, `getTopModal()` | Danh sách các `<dialog>` modal của lib đang mở, theo thứ tự. `host` là phần tử `.flg-toast-host` của dialog đó. Toaster dùng danh sách này (§6.3) |
-| `roving.ts` | `getNextIndex(items, current, key, { orientation, loop })` | Hàm thuần: ra chỉ số kế tiếp cho các phím mũi tên, Home và End, bỏ qua item disabled. Dùng chung cho Tabs, menu và Select |
-| `use-roving-focus.ts` | `useRovingFocus(options)` | Hai chế độ. `"tabindex"` (Tabs): đúng một item có `tabIndex=0`. `"focus"` (menu): mọi item có `tabIndex=-1`, focus được chuyển bằng `.focus()` |
+| `roving.ts` | `getNextIndex(items, current, key, { orientation, loop })`, `focusNext(event, items, options)`, `isDisabledItem(el)` | `getNextIndex` là hàm thuần: ra chỉ số kế tiếp cho các phím mũi tên, Home và End, bỏ qua item disabled. `focusNext` xử lý một `keydown`: tìm item kế tiếp, `preventDefault` rồi `.focus()` nó, trả `true` nếu đã xử lý. Menu dùng `focusNext` (mọi item có `tabIndex=-1`). Tabs (Plan D) tự giữ `tabIndex=0` ở tab đang chọn và dùng `getNextIndex`. Hook `useRovingFocus` hai chế độ của bản trao đổi bị bỏ khi lập Plan B: menu chỉ cần một hàm |
 | `use-typeahead.ts` | `useTypeahead(getItems, onMatch)` | Gom phím trong 500ms rồi so tiền tố, không phân biệt hoa thường. Gõ lặp một chữ thì nhảy vòng giữa các item cùng chữ đầu. Phím Space nằm giữa một chuỗi đang gõ được tính là ký tự |
 | `use-iso-layout-effect.ts` | `useIsoLayoutEffect` | `useLayoutEffect` trên trình duyệt, `useEffect` trên server (React 18 cảnh báo layout effect khi render ở server). Overlay cần layout effect để mở, đo và chuyển focus trước khi trình duyệt vẽ |
 | `react-lazy.ts` | `resolveLazy(value)` | Gỡ lazy reference của React. Server Component truyền client component xuống dưới dạng lazy reference; ở development nó còn truyền cả element con dưới dạng đó. `Slot` (giai đoạn 1) và `isFieldGroup`/`isFieldControl` dùng hàm này. Thiếu bước này, `asChild` trong Server Component in cảnh báo và lỗi hydrate ở Next dev (phát hiện khi lập Plan A) |
````

- [ ] **Step 6: Commit**

```bash
git add src/internal/roving.ts src/internal/roving.test.ts src/internal/use-typeahead.ts src/internal/use-typeahead.test.ts docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
git commit -m "feat: add the roving and typeahead helpers for menus" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: Token highlight và tương phản của item đang được trỏ

Item đang được trỏ dùng nền nhấn nhạt của mockup A. Script đo thêm bốn check, và ba cặp dưới ngưỡng thành dòng 8–10 của §4.9, đúng theo quy tắc đã duyệt ở spec §4.4.

**Files:**
- Modify: `scripts/lib/contrast.ts`, `scripts/check-contrast.ts`, `src/styles/theme/values.ts`, `scripts/contrast-exceptions.ts`, hai spec
- Test: `scripts/lib/contrast.test.ts`, `src/docs/ExceptionTable.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`measure` chạy trên kính thường và panel phủ scrim).
- Produces:
  - Token dẫn xuất `--flg-highlight-bg`, `--flg-highlight-text`, `--flg-highlight-danger-bg`, `--flg-highlight-danger-text`, `--flg-highlight-icon`. Task 5 dùng chúng trong `menu.css`.
  - `paintStops(input: string): Rgba[]`, đọc được `color-mix(in srgb, <màu> N%, transparent)`.
  - Bốn check mới: `highlight-text` (4.5), `highlight-danger-text` (4.5), `highlight-icon` (4.5, vì nó tô cả chữ phím tắt), `highlight-indicator` (3).

- [ ] **Step 1: Test cho `paintStops` (test fail)**

```diff
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index 961e4f5..3407ffe 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -8,6 +8,7 @@ import {
   contrastRatio,
   evaluate,
   measure,
+  paintStops,
   parseColor,
   resolveToken,
 } from './contrast';
@@ -30,6 +31,16 @@ describe('color math', () => {
     ]);
   });
 
+  it('reads a colour mixed with transparent as that colour at the mixed alpha', () => {
+    expect(paintStops('color-mix(in srgb, #92222b 16%, transparent)')).toEqual([
+      [146, 34, 43, 0.16],
+    ]);
+    expect(paintStops('color-mix(in srgb, rgba(0,0,0,.5) 50%, transparent)')).toEqual([
+      [0, 0, 0, 0.25],
+    ]);
+    expect(paintStops('linear-gradient(#000000, #ffffff)')).toHaveLength(2);
+  });
+
   it('gives 21:1 for black on white', () => {
     expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 5);
   });
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project scripts scripts/lib/contrast.test.ts`
Expected: 1 test FAIL với `TypeError: paintStops is not a function`.

- [ ] **Step 3: Đo item đang được trỏ**

```diff
diff --git a/scripts/check-contrast.ts b/scripts/check-contrast.ts
index a5a8a1e..2036271 100644
--- a/scripts/check-contrast.ts
+++ b/scripts/check-contrast.ts
@@ -17,7 +17,7 @@ const explain = (f: Finding): string => {
 const { rows, findings } = evaluate(values, KNOWN_EXCEPTIONS);
 for (const row of rows) {
   console.log(
-    `${row.status.padEnd(16)}${row.theme.padEnd(6)}${row.mode.padEnd(14)}${row.check.padEnd(20)}${row.measured.toFixed(2)} (min ${row.threshold})`,
+    `${row.status.padEnd(16)}${row.theme.padEnd(6)}${row.mode.padEnd(14)}${row.check.padEnd(22)}${row.measured.toFixed(2)} (min ${row.threshold})`,
   );
 }
 if (findings.length > 0) {
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 8d3c162..6caed96 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -29,6 +29,10 @@ export const CHECKS = {
   'input-focus-border': 3,
   'checked-fill': 3,
   'tooltip-text': 4.5,
+  'highlight-text': 4.5,
+  'highlight-danger-text': 4.5,
+  'highlight-icon': 4.5,
+  'highlight-indicator': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -68,6 +72,21 @@ export function colorsIn(input: string): Rgba[] {
   return (input.match(/#[0-9a-f]{6}\b|rgba?\([^)]*\)/gi) ?? []).map(parseColor);
 }
 
+/**
+ * The colours a background paints: one colour, the stops of a gradient, or a colour mixed with
+ * `transparent` by `color-mix(in srgb, <colour> N%, transparent)`.
+ */
+export function paintStops(input: string): Rgba[] {
+  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i.exec(
+    input.trim(),
+  );
+  if (mix?.[1] && mix[2]) {
+    const [r, g, b, a] = parseColor(mix[1]);
+    return [[r, g, b, (a * Number(mix[2])) / 100]];
+  }
+  return colorsIn(input);
+}
+
 /** Paints `top` over an opaque `bottom`. */
 export function composite(top: Rgba, bottom: Rgba): Rgba {
   const a = top[3];
@@ -160,6 +179,14 @@ export function measure(
       }),
     );
     const neutralBg = composite(color('control-track'), surface);
+    // A menu or listbox item under the pointer or the keyboard: the worst stop of its background.
+    const onPaint = (fg: string, bg: string) =>
+      Math.min(
+        ...paintStops(resolveToken(t, bg)).map((stop) => {
+          const under = composite(stop, surface);
+          return contrastRatio(composite(color(fg), under), under);
+        }),
+      );
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -184,6 +211,14 @@ export function measure(
         contrastRatio(color('accent-start'), surface),
         contrastRatio(color('accent-end'), surface),
       ),
+      'highlight-text': onPaint('highlight-text', 'highlight-bg'),
+      'highlight-danger-text': onPaint('highlight-danger-text', 'highlight-danger-bg'),
+      'highlight-icon': onPaint('highlight-icon', 'highlight-bg'),
+      'highlight-indicator': Math.min(
+        ...paintStops(resolveToken(t, 'highlight-bg')).map((stop) =>
+          contrastRatio(composite(stop, surface), surface),
+        ),
+      ),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
```

(`check-contrast.ts` chỉ nới cột tên check, vì `highlight-danger-text` dài hơn 20 ký tự.)

Run: `pnpm check:contrast`
Expected: script dừng với `Error: Unknown token --flg-highlight-bg`, vì token chưa có.

- [ ] **Step 4: Thêm năm token**

```diff
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index 39c6e36..b9eddf9 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -115,6 +115,12 @@ export const derivedTokens: TokenMap = {
   'glass-filter': 'blur(var(--flg-glass-blur)) saturate(var(--flg-glass-saturate))',
   'accent-gradient': 'linear-gradient(135deg, var(--flg-accent-start), var(--flg-accent-end))',
   'focus-outline-color': 'transparent',
+  // The highlighted item of a menu or listbox (mockup A): a light accent wash, the text unchanged.
+  'highlight-bg': 'var(--flg-accent-subtle)',
+  'highlight-text': 'var(--flg-text)',
+  'highlight-danger-bg': 'color-mix(in srgb, var(--flg-danger) 16%, transparent)',
+  'highlight-danger-text': 'var(--flg-danger)',
+  'highlight-icon': 'var(--flg-text-muted)',
 };
 
 /** No backdrop-filter support, or prefers-reduced-transparency: an almost opaque surface. */
@@ -135,6 +141,9 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     'glass-border': 'linear-gradient(var(--flg-text), var(--flg-text))',
     glow: 'none',
     'focus-ring': 'none',
+    'highlight-danger-bg': 'var(--flg-danger-fill)',
+    'highlight-danger-text': 'var(--flg-on-danger)',
+    'highlight-icon': 'var(--flg-highlight-text)',
   },
   light: {
     'glass-tint': 'rgb(250,251,255)',
@@ -144,6 +153,8 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     'accent-end': '#3554d1',
     'accent-solid': '#3554d1',
     'on-accent': '#ffffff',
+    'highlight-bg': '#3554d1',
+    'highlight-text': '#ffffff',
   },
   dark: {
     'glass-tint': 'rgb(22,26,44)',
@@ -154,6 +165,8 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     'accent-end': '#8ea6ff',
     'accent-solid': '#8ea6ff',
     'on-accent': '#0b1020',
+    'highlight-bg': '#8ea6ff',
+    'highlight-text': '#0b1020',
   },
 };
 
```

Run: `pnpm check:contrast | tail -6`
Expected: đúng 5 vấn đề, mọi cặp khác đều PASS:

```
- light/default highlight-danger-text = 4.24 is below 4.5:1. …
- light/default highlight-icon = 4.37 is below 4.5:1. …
- light/default highlight-indicator = 1.15 is below 3:1. …
- dark/default highlight-icon = 3.60 is below 4.5:1. …
- dark/default highlight-indicator = 1.18 is below 3:1. …
```

Cả năm cặp đều là giá trị mockup (nền `--flg-accent-subtle`, icon `--flg-text-muted`, nền danger 16%), nên không được chỉnh token. `highlight-text` đạt ở cả hai theme, và mọi check `highlight-*` đều đạt ở `prefers-contrast: more`.

- [ ] **Step 5: Ghi dòng 8–10 vào §4.9 và bảng docs**

```diff
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 55ea3a4..4ebf807 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -46,6 +46,16 @@ const D = {
   },
   6: { description: 'Muted text on the brightest reference backdrop', criterion: '1.4.3' },
   7: { description: 'Accent badge text on the accent badge background', criterion: '1.4.3' },
+  8: {
+    description: 'Highlighted menu item: the accent wash against the menu panel',
+    criterion: '1.4.11',
+  },
+  9: {
+    description: 'Muted icon, shortcut and submenu chevron on a highlighted menu item',
+    criterion: '1.4.3, 1.4.11',
+    minimum: '4.5:1 shortcut text, 3:1 icons',
+  },
+  10: { description: 'Danger text on a highlighted danger menu item', criterion: '1.4.3' },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -61,4 +71,9 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, ...D[6] },
   { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
   { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
+  { row: 8, theme: 'light', check: 'highlight-indicator', recorded: 1.15, ...D[8] },
+  { row: 8, theme: 'dark', check: 'highlight-indicator', recorded: 1.18, ...D[8] },
+  { row: 9, theme: 'light', check: 'highlight-icon', recorded: 4.37, ...D[9] },
+  { row: 9, theme: 'dark', check: 'highlight-icon', recorded: 3.6, ...D[9] },
+  { row: 10, theme: 'light', check: 'highlight-danger-text', recorded: 4.24, ...D[10] },
 ];
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 23c3dde..fc1433b 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the seven rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the ten rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(7);
+    expect(rows).toHaveLength(10);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -25,10 +25,17 @@ describe('ExceptionTable', () => {
       '5',
       '6',
       '7',
+      '8',
+      '9',
+      '10',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
     expect(rows[6]).toHaveTextContent('3.40:1');
+    expect(rows[8]).toHaveTextContent('4.37:1');
+    expect(rows[8]).toHaveTextContent('3.60:1');
+    expect(cells(rows[9]!)[1]).toBe('4.24:1');
+    expect(cells(rows[9]!)[2]).toMatch(/^meets AA \(4\.\d\d:1\)$/);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -48,6 +55,9 @@ describe('ExceptionTable', () => {
       '1.4.11',
       '1.4.3',
       '1.4.3',
+      '1.4.11',
+      '1.4.3, 1.4.11',
+      '1.4.3',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
```

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 457c50b..9f87ab0 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -319,10 +319,13 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
 | 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ Badge `accent` (`--flg-accent-text` trên `--flg-accent-subtle`) | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
+| 8 | Item menu đang được trỏ: nền `--flg-accent-subtle` so với nền panel | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
+| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu đang được trỏ | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
+| 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 
-Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
+Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
-Cả bảy điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Cả mười điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index bc262f5..33a4db8 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -210,6 +210,18 @@ Các file nằm ở `docs/superpowers/specs/mockups/`. Mỗi file trình bày nh
 - `--flg-scrim-blur` về `0px`.
 - `--flg-scrim` giữ nguyên.
 
+**Item đang được trỏ của menu và listbox** dùng năm token dẫn xuất. Mặc định chúng trỏ về token của mockup menu A; chế độ `prefers-contrast: more` đổi giá trị (§4.4):
+
+| Token | Mặc định | `prefers-contrast: more` |
+|---|---|---|
+| `--flg-highlight-bg` | `var(--flg-accent-subtle)` | `#3554d1` (light), `#8ea6ff` (dark) |
+| `--flg-highlight-text` | `var(--flg-text)` | `#ffffff` (light), `#0b1020` (dark) |
+| `--flg-highlight-danger-bg` | `color-mix(in srgb, var(--flg-danger) 16%, transparent)` | `var(--flg-danger-fill)` |
+| `--flg-highlight-danger-text` | `var(--flg-danger)` | `var(--flg-on-danger)` |
+| `--flg-highlight-icon` | `var(--flg-text-muted)` | `var(--flg-highlight-text)` |
+
+Icon, phím tắt và chevron của item đang được trỏ dùng `--flg-highlight-icon`. Ở item `danger`, chúng lấy màu chữ của item.
+
 **Quy tắc hiệu năng (thay §4.5 của spec 0+1).** Chỉ các phần tử sau được dùng `backdrop-filter`:
 
 - `Surface` và `Card`.
@@ -380,6 +392,7 @@ Vì cùng một cặp màu, số đo không đổi so với Badge: 3.40:1 light
 
 - Cặp nào dưới ngưỡng mà đúng như mockup thì được thêm vào §4.9 thành một dòng mới, kèm số đo (làm tròn xuống).
 - Danh sách điểm mới được nêu trong mô tả PR để chủ dự án biết.
+- Plan B đo item menu đang được trỏ và thêm ba dòng 8–10 vào §4.9: nền item so với panel (1.15:1 light, 1.18:1 dark), icon và phím tắt `--flg-text-muted` trên nền đó (4.37:1 light, 3.60:1 dark), chữ danger trên nền danger 16% (4.24:1 light; dark đạt). Chữ `--flg-text` trên nền item đạt ở cả hai theme. Cả ba dòng đều đạt ở `prefers-contrast: more`.
 
 **`prefers-contrast: more`.** Mọi cặp mới đều phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, thêm các quy tắc sau (đều ngoài mockup, chỉ có hiệu lực khi người dùng bật tùy chọn này):
 
```

- [ ] **Step 6: Chạy lại script, test và kiểm tra tĩnh**

Run: `pnpm check:contrast | tail -1 && pnpm vitest run --project scripts --project unit scripts src/docs && pnpm lint && pnpm typecheck`
Expected: `Contrast check passed.` và 53 test PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts src/styles/theme/values.ts src/docs/ExceptionTable.test.tsx docs/superpowers/specs
git commit -m "feat: add the menu highlight tokens and measure them (§4.9 rows 8-10)" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Các phần `Menu*`, DropdownMenu và menu con

Task lớn nhất. Các phần dính chặt với nhau (panel, tầng menu, menu con, vùng tam giác), nên được làm và review cùng nhau.

**Files:**
- Create:
  - `src/components/menu/menu-context.ts`, `src/components/menu/MenuPanel.tsx`, `src/components/menu/Menu.tsx`, `src/components/menu/index.ts`
  - `src/components/dropdown-menu/DropdownMenu.tsx`, `src/components/dropdown-menu/index.ts`, `src/components/dropdown-menu/DropdownMenu.mdx`
  - `src/styles/components/menu.css`
- Modify: `src/internal/use-floating.ts`, `src/styles/components/floating.css`, `src/styles/preferences.css`, `src/styles/index.css`, `.storybook/icons.tsx`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`, spec giai đoạn 2
- Test: `src/components/menu/Menu.test.tsx`, `src/components/menu/Menu.test-d.ts`, `src/components/dropdown-menu/DropdownMenu.test-d.ts`, `src/components/dropdown-menu/DropdownMenu.stories.tsx`

**Interfaces:**
- Consumes:
  - Task 3: `focusNext`, `getNextIndex`, `isDisabledItem`, `useTypeahead`.
  - Task 4: các token `--flg-highlight-*`.
  - Plan A: `usePopover(ref, { open, onOpenChange, restoreFocusTo, onShown, pendingToggle })`, `useFloating`, `useControllableState`, `Slot`, `resolveLazy`, `composeEventHandlers`, `mergeRefs`, `dataAttr`, `devWarn`, `useIsoLayoutEffect`, `Button`.
- Produces (Task 6 dùng):
  - `MenuPanel` với props `{ open, report, pendingToggle?, contentId, reference: () => ReferenceElement | null, restoreFocusTo, focusOnOpen: MutableRefObject<FocusOnOpen>, side, align, offset, alignOffset?, onCloseSub? }` cùng mọi thuộc tính HTML của `<div>` trừ `id`.
  - `MenuTreeContext` (`{ closeAll(): void }`), `type FocusOnOpen = 'first' | 'last' | 'menu' | 'none'`, `type Point = readonly [number, number]`.
  - `useFloating` nhận thêm `alignOffset?: number` và `maxHeight?: number`.
  - Export công khai: `MenuItem`, `MenuCheckboxItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuGroup`, `MenuLabel`, `MenuSeparator`, `MenuShortcut`, `MenuSub`, `MenuSubTrigger`, `MenuSubContent`, `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, cùng kiểu props của chúng và `MenuSelectEvent`.

- [ ] **Step 1: Viết unit test và type test**

`src/components/menu/Menu.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../dropdown-menu/DropdownMenu';
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from './Menu';

// jsdom has no Popover API. This stand-in is enough for a menu to render.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

const outside = (part: string) =>
  `[fl-glass-ui] <${part}> must be rendered inside a DropdownMenuContent, ContextMenuContent or MenuSubContent.`;

describe('Menu parts', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('warn when rendered outside a menu, and still render', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <MenuItem>Rename</MenuItem>
        <MenuCheckboxItem>Show grid</MenuCheckboxItem>
        <MenuSub>
          <MenuSubTrigger>Move to</MenuSubTrigger>
        </MenuSub>
      </>,
    );
    expect(warn).toHaveBeenCalledWith(outside('MenuItem'));
    expect(warn).toHaveBeenCalledWith(outside('MenuCheckboxItem'));
    expect(warn).toHaveBeenCalledWith(outside('MenuSub'));
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
  });

  it('warns about a radio item outside a radio group', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Sort</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuRadioItem value="name">Name</MenuRadioItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <MenuRadioItem> must be rendered inside a <MenuRadioGroup>.',
    );
  });

  it('warns about submenu parts outside a MenuSub', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>File</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuSubTrigger>Move to</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Archive</MenuItem>
          </MenuSubContent>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <MenuSubTrigger> must be rendered inside a <MenuSub>.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <MenuSubContent> must be rendered inside a <MenuSub>.',
    );
  });

  // jsdom treats the panel as hidden (it has no :popover-open), so the queries include hidden nodes.
  it('names a group by its label, and marks the chosen radio item', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuGroup>
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioGroup defaultValue="name">
              <MenuRadioItem value="name">Name</MenuRadioItem>
              <MenuRadioItem value="date">Date</MenuRadioItem>
            </MenuRadioGroup>
          </MenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('group', { name: 'Sort by', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Name', hidden: true })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Date', hidden: true })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('names a radio group by the label inside it', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuRadioGroup defaultValue="name">
            <MenuLabel>Sort by</MenuLabel>
            <MenuRadioItem value="name">Name</MenuRadioItem>
          </MenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('group', { name: 'Sort by', hidden: true })).toContainElement(
      screen.getByRole('menuitemradio', { name: 'Name', hidden: true }),
    );
  });

  it('keeps its items mounted while closed', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>View</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuCheckboxItem defaultChecked>Show grid</MenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByText('Show grid');
    expect(item).toHaveAttribute('aria-checked', 'true');
    expect(item.closest('[role="menu"]')).toHaveAttribute('popover', 'auto');
    expect(screen.getByRole('button', { name: 'View' })).not.toHaveAttribute('aria-controls');
  });
});
```

`src/components/menu/Menu.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { MenuCheckboxItemProps, MenuItemProps, MenuRadioItemProps } from './Menu';

test('MenuItem takes the documented variants; a checkbox item takes none', () => {
  expectTypeOf<MenuItemProps['variant']>().toEqualTypeOf<'default' | 'danger' | undefined>();
  expectTypeOf<MenuItemProps['onSelect']>().toEqualTypeOf<((event: Event) => void) | undefined>();
  // @ts-expect-error a checkbox item has no variant
  const checkbox: MenuCheckboxItemProps = { variant: 'danger' };
  expectTypeOf(checkbox).toBeObject();
});

test('MenuRadioItem needs a value', () => {
  expectTypeOf<MenuRadioItemProps['value']>().toEqualTypeOf<string>();
  // @ts-expect-error value is required
  const radio: MenuRadioItemProps = {};
  expectTypeOf(radio).toBeObject();
});
```

`src/components/dropdown-menu/DropdownMenu.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { DropdownMenuContentProps, DropdownMenuTriggerProps } from './DropdownMenu';

test('DropdownMenuContent accepts only the documented sides and alignments', () => {
  expectTypeOf<DropdownMenuContentProps['side']>().toEqualTypeOf<
    'top' | 'right' | 'bottom' | 'left' | undefined
  >();
  expectTypeOf<DropdownMenuContentProps['align']>().toEqualTypeOf<
    'start' | 'center' | 'end' | undefined
  >();
});

test('the trigger and the panel take their ids from the menu', () => {
  // @ts-expect-error the trigger's id names the menu
  const trigger: DropdownMenuTriggerProps = { id: 'x' };
  // @ts-expect-error the panel's id is what aria-controls points at
  const content: DropdownMenuContentProps = { id: 'x' };
  expectTypeOf(trigger).toBeObject();
  expectTypeOf(content).toBeObject();
});
```

- [ ] **Step 2: Thêm icon cho story và viết story**

```diff
diff --git a/.storybook/icons.tsx b/.storybook/icons.tsx
index c5a1bf3..af2a600 100644
--- a/.storybook/icons.tsx
+++ b/.storybook/icons.tsx
@@ -63,3 +63,48 @@ export function SearchIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+export function EditIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <path d="M12 20h9" />
+      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
+    </svg>
+  );
+}
+
+export function CopyIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <rect x="9" y="9" width="13" height="13" rx="2" />
+      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
+    </svg>
+  );
+}
+
+export function FolderIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
+    </svg>
+  );
+}
+
+export function FileIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
+      <path d="M14 2v6h6" />
+    </svg>
+  );
+}
+
+export function TrashIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <path d="M3 6h18" />
+      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
+      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
+    </svg>
+  );
+}
```

`src/components/dropdown-menu/DropdownMenu.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  CopyIcon,
  EditIcon,
  FileIcon,
  FolderIcon,
  MoreIcon,
  TrashIcon,
} from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from '../menu/Menu';
import type { MenuSubProps } from '../menu/Menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './DropdownMenu';

const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = { width: 15, height: 15 };
const corner = { placeSelf: 'start', display: 'flex', gap: 8 } as const;

// The menu from the approved mockup: commands with icons and shortcuts, a submenu, a checkbox item,
// a radio group, a disabled item and a danger item.
function ProjectMenu({ onRename, sub }: { onRename?: (event: Event) => void; sub?: MenuSubProps }) {
  return (
    <DropdownMenuContent>
      <MenuGroup>
        <MenuLabel>Project</MenuLabel>
        <MenuItem icon={<EditIcon {...icon} />} onSelect={onRename}>
          Rename <MenuShortcut>F2</MenuShortcut>
        </MenuItem>
        <MenuItem icon={<CopyIcon {...icon} />}>
          Duplicate <MenuShortcut>Ctrl+D</MenuShortcut>
        </MenuItem>
        <MenuSub {...sub}>
          <MenuSubTrigger icon={<FolderIcon {...icon} />}>Move to</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>Design</MenuItem>
            <MenuItem>Marketing</MenuItem>
            <MenuItem>Archive</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </MenuGroup>
      <MenuSeparator />
      <MenuCheckboxItem defaultChecked>Show grid</MenuCheckboxItem>
      <MenuRadioGroup defaultValue="name">
        <MenuLabel>Sort by</MenuLabel>
        <MenuRadioItem value="name">Name</MenuRadioItem>
        <MenuRadioItem value="date">Date modified</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSeparator />
      <MenuItem icon={<FileIcon {...icon} />} disabled>
        Export PDF
      </MenuItem>
      <MenuItem icon={<TrashIcon {...icon} />} variant="danger">
        Delete project
      </MenuItem>
    </DropdownMenuContent>
  );
}

const onRename = fn();

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu onRename={onRename} />
      </DropdownMenu>
      <Button variant="secondary">After</Button>
    </div>
  ),
  play: async ({ canvas, args }) => {
    onRename.mockClear();
    const trigger = canvas.getByRole('button', { name: 'Project' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // The keyboard opens it on the first item and moves through the items, skipping the disabled one.
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'Project' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', menu.id);
    await expect(canvas.getByRole('menuitem', { name: 'Rename F2' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('menuitem', { name: 'Duplicate Ctrl+D' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('menuitem', { name: 'Delete project' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByRole('menuitemradio', { name: 'Date modified' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(canvas.getByRole('menuitem', { name: 'Rename F2' })).toHaveFocus();
    // Typeahead: "d" goes to the next item starting with it.
    await userEvent.keyboard('d');
    await expect(canvas.getByRole('menuitem', { name: 'Duplicate Ctrl+D' })).toHaveFocus();

    // Choosing an item closes the menu and returns focus to the trigger.
    await userEvent.keyboard('{Home}{Enter}');
    await expect(onRename).toHaveBeenCalledOnce();
    await expect(onRename.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    // ↑ opens it on the last item.
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByRole('menuitem', { name: 'Delete project' })).toHaveFocus();

    const real = await realUserEvent();
    if (!real) return;
    // Esc closes it and returns focus to the trigger.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    // Tab closes it, and focus moves on as usual.
    await real.keyboard('{ArrowDown}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await real.keyboard('{Tab}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
    // A click opens it on the menu itself, with no item lit; a click outside closes it.
    await real.click(trigger);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(menu).toHaveFocus();
    await real.click(canvas.getByRole('button', { name: 'After' }));
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
  },
};

export const Open: Story = {
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args} defaultOpen>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu sub={{ defaultOpen: true }} />
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const menu = canvas.getByRole('menu', { name: 'Project' });
    await settled(menu);
    // Below the trigger, lined up with its start edge, 4px away.
    const t = canvas.getByRole('button', { name: 'Project' }).getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(Math.round(m.left)).toBe(Math.round(t.left));
    await expect(Math.round(m.top - t.bottom)).toBe(4);
  },
};

export const CheckboxAndRadioItems: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary" size="sm" aria-label="View options">
          <MoreIcon {...icon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuCheckboxItem onSelect={(event) => event.preventDefault()}>
            Show grid
          </MenuCheckboxItem>
          <MenuRadioGroup defaultValue="name">
            <MenuRadioItem value="name">Name</MenuRadioItem>
            <MenuRadioItem value="date">Date modified</MenuRadioItem>
          </MenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'View options' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'View options' });
    const grid = canvas.getByRole('menuitemcheckbox', { name: 'Show grid' });
    await expect(grid).toHaveAttribute('aria-checked', 'false');
    // preventDefault in onSelect keeps the menu open.
    await userEvent.keyboard(' ');
    await expect(grid).toHaveAttribute('aria-checked', 'true');
    await expect(menu.matches(':popover-open')).toBe(true);
    await expect(canvas.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(canvas.getByRole('menuitemradio', { name: 'Date modified' }));
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    // Uncontrolled values survive closing and reopening.
    await expect(grid).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('menuitemradio', { name: 'Date modified' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(within(menu).getByRole('group')).toBeInTheDocument();
  },
};

export const Submenu: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
        <ProjectMenu />
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Project' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    const menu = canvas.getByRole('menu', { name: 'Project' });
    const moveTo = canvas.getByRole('menuitem', { name: 'Move to' });
    await expect(moveTo).toHaveAttribute('aria-haspopup', 'menu');
    // A highlighted danger item keeps its icon in the danger colour; others turn it muted.
    await userEvent.keyboard('{End}');
    const danger = canvas.getByRole('menuitem', { name: 'Delete project' });
    await expect(danger).toHaveFocus();
    const iconOf = (el: Element) =>
      getComputedStyle(el.querySelector('.flg-menu-item-icon')!).color;
    await expect(iconOf(danger)).toBe(getComputedStyle(danger).color);
    await userEvent.keyboard('{Home}');
    await expect(iconOf(canvas.getByRole('menuitem', { name: 'Rename F2' }))).not.toBe(
      getComputedStyle(canvas.getByRole('menuitem', { name: 'Rename F2' })).color,
    );
    // → opens the submenu on its first item; ← closes it and returns to its trigger.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
    const sub = canvas.getByRole('menu', { name: 'Move to' });
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await expect(moveTo).toHaveAttribute('aria-expanded', 'true');
    await expect(within(sub).getByRole('menuitem', { name: 'Design' })).toHaveFocus();
    // The submenu opens to the right, its first item level with the trigger.
    await settled(sub);
    const t = moveTo.getBoundingClientRect();
    const firstItem = within(sub).getByRole('menuitem', { name: 'Design' }).getBoundingClientRect();
    await expect(Math.abs(firstItem.top - t.top)).toBeLessThanOrEqual(1);
    await expect(sub.getBoundingClientRect().left).toBeGreaterThan(t.right - 4);
    // ↑ and ↓ stay inside the submenu.
    await userEvent.keyboard('{ArrowDown}');
    await expect(within(sub).getByRole('menuitem', { name: 'Marketing' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
    await expect(moveTo).toHaveFocus();
    // Choosing an item in the submenu closes the whole menu.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    // The items stay mounted while the menu is closed; the submenu does not stay open with them.
    await expect(moveTo).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(sub.matches(':popover-open')).toBe(false);
    await userEvent.click(trigger);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();

    const real = await realUserEvent();
    if (!real) return;
    // Esc closes only the submenu.
    await real.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await real.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
    await expect(menu.matches(':popover-open')).toBe(true);
    await expect(moveTo).toHaveFocus();
    // Resting the pointer on the trigger opens it after a short delay; another item closes it.
    await real.hover(moveTo);
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(true));
    await expect(moveTo).toHaveFocus();
    await real.hover(canvas.getByRole('menuitem', { name: 'Rename F2' }));
    await waitFor(() => expect(sub.matches(':popover-open')).toBe(false));
  },
};

export const LinkItems: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <DropdownMenu {...args}>
        <DropdownMenuTrigger variant="secondary">Go to</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem asChild>
            <a href="#settings">Settings</a>
          </MenuItem>
          <MenuItem asChild>
            <a href="#billing">Billing</a>
          </MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvas }) => {
    // Records the links the menu follows, and stops the navigation. It listens on window, after
    // React has handled the click.
    const followed: string[] = [];
    const follow = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a');
      if (!link) return;
      followed.push(link.getAttribute('href') ?? '');
      event.preventDefault();
    };
    window.addEventListener('click', follow);
    try {
      const trigger = canvas.getByRole('button', { name: 'Go to' });
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      const menu = canvas.getByRole('menu', { name: 'Go to' });
      await expect(canvas.getByRole('menuitem', { name: 'Settings' })).toHaveFocus();
      // Enter on an item rendered as a link follows the link, and closes the menu.
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await expect(followed).toEqual(['#billing']);
      await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
      await expect(trigger).toHaveFocus();
    } finally {
      window.removeEventListener('click', follow);
    }
  },
};
```

Mỗi story kiểm tra những gì:

| Story | Kiểm tra |
|---|---|
| `Default` | Enter, ↓, ↑ trên trigger; quay vòng; Home và End; typeahead; chọn item; Esc; Tab đi tiếp; bấm trigger để đóng; bấm ra ngoài |
| `Open` (có ảnh) | Menu và menu con mở sẵn; khoảng cách 4px tới trigger |
| `CheckboxAndRadioItems` | Space bật item checkbox mà menu vẫn mở; giá trị uncontrolled còn sau khi đóng và mở lại (Review Focus 1) |
| `Submenu` | Màu icon của item `danger` khi được trỏ; → mở menu con trên item đầu; vị trí menu con; ← đóng; chọn trong menu con đóng cả cây và menu con không còn mở sẵn (Review Focus 5); Esc chỉ đóng menu con; rê chuột mở sau 100ms |
| `LinkItems` | Enter trên item là link thì đi theo link và đóng menu (Review Focus 4) |

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm gen:theme && pnpm vitest run --project unit src/components/menu && pnpm vitest run --project storybook-light src/components/dropdown-menu --browser.name=chromium`
Expected: FAIL vì chưa có module `./Menu` và `./DropdownMenu`.

- [ ] **Step 4: Thêm `alignOffset` và `maxHeight` cho `useFloating`**

```diff
diff --git a/src/internal/use-floating.ts b/src/internal/use-floating.ts
index e203d51..3518c75 100644
--- a/src/internal/use-floating.ts
+++ b/src/internal/use-floating.ts
@@ -5,6 +5,7 @@ import {
   flip,
   offset as offsetMiddleware,
   shift,
+  size,
 } from '@floating-ui/dom';
 import type { Placement, ReferenceElement } from '@floating-ui/dom';
 import { useRef } from 'react';
@@ -23,6 +24,13 @@ export interface UseFloatingOptions {
   align: Align;
   /** Distance from the reference, in px. */
   offset: number;
+  /** Shift along the side, in px: a negative value moves a `start`-aligned element back. */
+  alignOffset?: number | undefined;
+  /**
+   * Caps the height at the space left in the viewport, and at this many px; `Infinity` means the
+   * space left only. The element scrolls past it. Leave it out to let the element keep its height.
+   */
+  maxHeight?: number | undefined;
   /** An element inside `floating` that points at the reference. */
   arrow?: RefObject<HTMLElement | null> | undefined;
 }
@@ -43,6 +51,8 @@ export function useFloating({
   side,
   align,
   offset,
+  alignOffset = 0,
+  maxHeight,
   arrow,
 }: UseFloatingOptions): void {
   const getReference = useRef(reference);
@@ -63,9 +73,20 @@ export function useFloating({
           strategy: 'fixed',
           placement,
           middleware: [
-            offsetMiddleware(offset),
+            offsetMiddleware({ mainAxis: offset, alignmentAxis: alignOffset }),
             flip({ padding: VIEWPORT_PADDING }),
             shift({ padding: VIEWPORT_PADDING }),
+            ...(maxHeight === undefined
+              ? []
+              : [
+                  size({
+                    padding: VIEWPORT_PADDING,
+                    apply({ availableHeight, elements }) {
+                      const cap = Math.min(Math.max(availableHeight, 0), maxHeight);
+                      elements.floating.style.maxHeight = `${cap}px`;
+                    },
+                  }),
+                ]),
             ...(arrowEl ? [arrowMiddleware({ element: arrowEl, padding: 8 })] : []),
           ],
         }).then(({ x, y, placement: landed, middlewareData }) => {
@@ -93,5 +114,5 @@ export function useFloating({
       active = false;
       stop?.();
     };
-  }, [open, floating, side, align, offset, arrow]);
+  }, [open, floating, side, align, offset, alignOffset, maxHeight, arrow]);
 }
```

- [ ] **Step 5: Viết hai context và panel dùng chung**

`src/components/menu/menu-context.ts`:

```ts
import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import { devWarn } from '../../internal/warn';

/** Where focus goes when a menu opens. */
export type FocusOnOpen = 'first' | 'last' | 'menu' | 'none';

export type Point = readonly [number, number];

/** The whole menu tree, from the root menu to the deepest submenu. */
export interface MenuTreeContextValue {
  /** Closes every menu of the tree; focus goes back to where the root menu returns it. */
  closeAll: () => void;
}

/** One menu panel: the root menu or a submenu. */
export interface MenuLevelContextValue {
  contentRef: MutableRefObject<HTMLDivElement | null>;
  /** The panel is showing. A submenu waits for it: a nested popover shown first would be hidden. */
  open: boolean;
  /** The submenu open at this level: it closes when another item here is highlighted. */
  openSub: MutableRefObject<{ trigger: HTMLElement | null; close: () => void } | null>;
  /**
   * While the pointer travels from a sub-trigger to its submenu, it may cross other items of this
   * level. Inside this triangle, and until `until`, those items do not take the highlight.
   */
  pointerGrace: MutableRefObject<{ polygon: readonly Point[]; until: number } | null>;
}

export const MenuTreeContext = createContext<MenuTreeContextValue | null>(null);
export const MenuLevelContext = createContext<MenuLevelContextValue | null>(null);

const NO_TREE: MenuTreeContextValue = { closeAll: () => {} };
const NO_LEVEL: MenuLevelContextValue = {
  contentRef: { current: null },
  open: false,
  openSub: { current: null },
  pointerGrace: { current: null },
};

/** The menu a part sits in. Outside one, a dev warning and an inert stand-in. */
export function useMenu(part: string): {
  tree: MenuTreeContextValue;
  level: MenuLevelContextValue;
} {
  const tree = useContext(MenuTreeContext);
  const level = useContext(MenuLevelContext);
  if (!tree || !level) {
    devWarn(
      `<${part}> must be rendered inside a DropdownMenuContent, ContextMenuContent or MenuSubContent.`,
    );
    return { tree: NO_TREE, level: NO_LEVEL };
  }
  return { tree, level };
}

/** The items of one menu panel, in order: not those of a submenu nested in it. */
export function menuItems(content: HTMLElement | null): HTMLElement[] {
  if (!content) return [];
  return Array.from(content.querySelectorAll<HTMLElement>('[role^="menuitem"]')).filter(
    (el) => el.closest('[role="menu"]') === content,
  );
}

/** True when the point lies inside the polygon (ray casting). */
export function isPointInPolygon([x, y]: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i] as Point;
    const [xj, yj] = polygon[j] as Point;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
```

`src/components/menu/MenuPanel.tsx` (không có `"use client"`, vì chỉ module client import nó):

```tsx
import type { ReferenceElement } from '@floating-ui/dom';
import { clsx } from 'clsx';
import { forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  MutableRefObject,
  PointerEvent,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { focusNext, getNextIndex, isDisabledItem } from '../../internal/roving';
import { useFloating } from '../../internal/use-floating';
import type { Align, Side } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { useTypeahead } from '../../internal/use-typeahead';
import { MenuLevelContext, MenuTreeContext, menuItems } from './menu-context';
import type { FocusOnOpen, MenuLevelContextValue } from './menu-context';

// The panel shared by DropdownMenuContent, ContextMenuContent and MenuSubContent: a native
// `popover="auto"` with `role="menu"`, placed by Floating UI, with the menu keyboard (spec §6.3).
// Unlike Popover's, its items stay mounted while it is closed: an uncontrolled checkbox item or radio
// group keeps its value from one opening to the next. A closed popover is `display: none`, so they
// are out of the accessibility tree and the tab order meanwhile.

export interface MenuPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  open: boolean;
  /** Reports a change the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  pendingToggle?: MutableRefObject<boolean | null> | undefined;
  contentId: string;
  reference: () => ReferenceElement | null;
  restoreFocusTo: () => HTMLElement | null;
  focusOnOpen: MutableRefObject<FocusOnOpen>;
  side: Side;
  align: Align;
  offset: number;
  alignOffset?: number | undefined;
  /** A submenu: ← closes it. */
  onCloseSub?: (() => void) | undefined;
}

const VERTICAL = { orientation: 'vertical', loop: true } as const;

function focusEdge(content: HTMLElement, edge: 'Home' | 'End') {
  const items = menuItems(content);
  const index = getNextIndex(
    items.map((el) => ({ disabled: isDisabledItem(el) })),
    -1,
    edge,
    VERTICAL,
  );
  (index === null ? content : (items[index] ?? content)).focus({ preventScroll: true });
}

export const MenuPanel = forwardRef<HTMLDivElement, MenuPanelProps>(function MenuPanel(
  {
    open,
    report,
    pendingToggle,
    contentId,
    reference,
    restoreFocusTo,
    focusOnOpen,
    side,
    align,
    offset,
    alignOffset,
    onCloseSub,
    className,
    children,
    onKeyDown,
    onPointerLeave,
    onBlur,
    ...props
  },
  ref,
) {
  const tree = useContext(MenuTreeContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref]);
  const openSub = useRef<MenuLevelContextValue['openSub']['current']>(null);
  const pointerGrace = useRef<MenuLevelContextValue['pointerGrace']['current']>(null);
  // Set once the browser shows the panel, so that a submenu open at the same time shows after it.
  const [shown, setShown] = useState(false);
  if (!open && shown) setShown(false);
  const level = useMemo<MenuLevelContextValue>(
    () => ({ contentRef, open: shown, openSub, pointerGrace }),
    [shown],
  );
  const isSub = onCloseSub !== undefined;
  // The items stay mounted while it is closed, so a submenu open from here would stay open too.
  useEffect(() => {
    if (!open) openSub.current?.close();
  }, [open]);

  usePopover(contentRef, {
    open,
    onOpenChange: report,
    pendingToggle,
    restoreFocusTo,
    onShown: () => {
      setShown(true);
      const el = contentRef.current;
      if (!el) return;
      const where = focusOnOpen.current;
      if (where === 'first') focusEdge(el, 'Home');
      else if (where === 'last') focusEdge(el, 'End');
      else if (where === 'menu') el.focus({ preventScroll: true });
    },
  });
  useFloating({
    open,
    reference,
    floating: contentRef,
    side,
    align,
    offset,
    alignOffset,
    maxHeight: Number.POSITIVE_INFINITY,
  });

  const getItems = useCallback(() => menuItems(contentRef.current), []);
  const focusItem = useCallback((el: HTMLElement) => el.focus(), []);
  const typeahead = useTypeahead(getItems, focusItem);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const content = contentRef.current;
    // Keys pressed in a submenu bubble up through this panel; that submenu handles its own.
    if (!content || (event.target as Element).closest('[role="menu"]') !== content) return;
    if (focusNext(event, getItems(), VERTICAL)) return;
    if (isSub && event.key === 'ArrowLeft') {
      event.preventDefault();
      onCloseSub?.();
      return;
    }
    typeahead(event);
  };

  // The pointer leaving the panel takes the highlight with it, unless a submenu is open from here.
  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    const content = contentRef.current;
    if (event.pointerType !== 'mouse' || !content || openSub.current) return;
    if (content.contains(document.activeElement) && document.activeElement !== content) {
      content.focus({ preventScroll: true });
    }
  };

  // Tab moves focus out, the browser's way; the whole tree closes once focus has left it. A submenu
  // sits inside the root panel in the DOM, so only the root panel needs to watch. The close waits a
  // task: during `focusout` nothing has focus yet, and closing then would pull focus back to the
  // trigger instead of letting it land where Tab sent it.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (isSub || !(next instanceof Node) || (contentRef.current?.contains(next) ?? true)) return;
    setTimeout(() => tree?.closeAll(), 0);
  };

  return (
    <MenuLevelContext.Provider value={level}>
      <div
        ref={mergedRef}
        popover="auto"
        role="menu"
        tabIndex={-1}
        data-side={side}
        data-align={align}
        {...props}
        id={contentId}
        className={clsx('flg-surface flg-menu', className)}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
        onPointerLeave={composeEventHandlers(onPointerLeave, handlePointerLeave)}
        onBlur={composeEventHandlers(onBlur, handleBlur)}
      >
        {children}
      </div>
    </MenuLevelContext.Provider>
  );
});
```

Ba điểm dễ sai trong file này:
- **`shown` chứ không phải `open`** đi vào `MenuLevelContext`. `shown` chỉ thành `true` trong `onShown`, tức sau khi trình duyệt đã hiện panel. Menu con đọc nó để không gọi `showPopover()` trước cha.
- **Effect `if (!open) openSub.current?.close()`.** Item không còn unmount khi menu đóng, nên phải tự đóng menu con.
- **Blur đóng cây sau một task** (`setTimeout(…, 0)`), xem phát hiện 4.

- [ ] **Step 6: Viết các phần `Menu*`**

`src/components/menu/Menu.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { dataAttr } from '../../internal/data-attr';
import { mergeRefs } from '../../internal/merge-refs';
import { resolveLazy } from '../../internal/react-lazy';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import { isPointInPolygon, useMenu } from './menu-context';
import type { FocusOnOpen, MenuLevelContextValue } from './menu-context';
import { MenuPanel } from './MenuPanel';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

const CHECK = (
  <svg {...iconProps}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const CHEVRON = (
  <svg {...iconProps} className="flg-menu-chevron">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/** What happens when an item is chosen: `event.preventDefault()` keeps the menu open. */
export type MenuSelectEvent = Event;

interface ItemBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Called when the item is chosen. `event.preventDefault()` keeps the menu open. */
  onSelect?: (event: MenuSelectEvent) => void;
  /** Leaves the item in the menu but out of reach: skipped by the keyboard, not chosen on click. */
  disabled?: boolean;
  /** The text typeahead matches. Default: the item's own text. */
  textValue?: string;
}

export interface MenuItemProps extends ItemBaseProps {
  /** `"danger"` for an item that destroys something. Default `"default"`. */
  variant?: 'default' | 'danger';
  /** An icon in the column before the text. */
  icon?: ReactNode;
  /** Render the single child element (for example a link) as the item. */
  asChild?: boolean;
}
export interface MenuCheckboxItemProps extends ItemBaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
export interface MenuRadioGroupProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
export interface MenuRadioItemProps extends ItemBaseProps {
  value: string;
}
export type MenuGroupProps = HTMLAttributes<HTMLDivElement>;
export type MenuLabelProps = HTMLAttributes<HTMLDivElement>;
export type MenuSeparatorProps = HTMLAttributes<HTMLDivElement>;
export type MenuShortcutProps = HTMLAttributes<HTMLSpanElement>;
export interface MenuSubProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export interface MenuSubTriggerProps extends Omit<ItemBaseProps, 'onSelect'> {
  /** An icon in the column before the text. */
  icon?: ReactNode;
}
export type MenuSubContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>;

/** Chooses an item: dispatches the cancellable select event on it, then closes the tree. */
function choose(el: HTMLElement | null, onSelect: ItemBaseProps['onSelect'], closeAll: () => void) {
  const event = new Event('flg-menu-select', { cancelable: true });
  if (el && onSelect) el.addEventListener('flg-menu-select', onSelect, { once: true });
  el?.dispatchEvent(event);
  if (!event.defaultPrevented) closeAll();
}

/**
 * What every item shares: the highlight follows focus, the pointer moves the focus (outside the
 * grace triangle of an open submenu), Enter and Space choose.
 */
function useItem(
  level: MenuLevelContextValue,
  disabled: boolean,
  textValue: string | undefined,
  onActivate: (pointer: boolean) => void,
) {
  return {
    tabIndex: -1,
    'aria-disabled': disabled || undefined,
    'data-text-value': textValue,
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'mouse' || disabled) return;
      const grace = level.pointerGrace.current;
      if (grace) {
        const inside =
          performance.now() < grace.until &&
          isPointInPolygon([event.clientX, event.clientY], grace.polygon);
        if (inside) return;
        level.pointerGrace.current = null;
      }
      if (document.activeElement !== event.currentTarget) {
        event.currentTarget.focus({ preventScroll: true });
      }
    },
    onFocus: (event: { currentTarget: HTMLElement }) => {
      const sub = level.openSub.current;
      if (sub && sub.trigger !== event.currentTarget) sub.close();
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onActivate(event.detail !== 0);
    },
    // Enter and Space click the item, so that an item rendered as a link follows it.
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!disabled) event.currentTarget.click();
    },
  };
}

/** A command in a menu. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  {
    onSelect,
    disabled = false,
    textValue,
    variant = 'default',
    icon,
    asChild = false,
    className,
    children,
    onPointerMove,
    onFocus,
    onClick,
    onKeyDown,
    ...props
  },
  ref,
) {
  const { tree, level } = useMenu('MenuItem');
  const itemRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
  const item = useItem(level, disabled, textValue, () =>
    choose(itemRef.current, onSelect, tree.closeAll),
  );
  const iconSlot = (
    <span className="flg-menu-item-icon" aria-hidden="true">
      {icon}
    </span>
  );
  const shared = {
    role: 'menuitem',
    ...props,
    ...item,
    className: clsx('flg-menu-item', className),
    'data-variant': variant,
    onPointerMove: composeEventHandlers(onPointerMove, item.onPointerMove),
    onFocus: composeEventHandlers(onFocus, item.onFocus),
    onClick: composeEventHandlers(onClick, item.onClick),
    onKeyDown: composeEventHandlers(onKeyDown, item.onKeyDown),
  };
  if (asChild) {
    const child = resolveLazy(children);
    const withIcon = isValidElement<{ children?: ReactNode }>(child)
      ? cloneElement(child as ReactElement<{ children?: ReactNode }>, undefined, [
          iconSlot,
          child.props.children,
        ])
      : child;
    return (
      <Slot ref={mergedRef as Ref<HTMLElement>} {...shared}>
        {withIcon}
      </Slot>
    );
  }
  return (
    <div ref={mergedRef} {...shared}>
      {iconSlot}
      {children}
    </div>
  );
});

/** An item that turns an option on and off. */
export const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(
  function MenuCheckboxItem(
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      onSelect,
      disabled = false,
      textValue,
      className,
      children,
      onPointerMove,
      onFocus,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const { tree, level } = useMenu('MenuCheckboxItem');
    const itemRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
    const [isChecked, setChecked] = useControllableState({
      value: checked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
      name: 'MenuCheckboxItem',
    });
    const item = useItem(level, disabled, textValue, () => {
      setChecked(!isChecked);
      choose(itemRef.current, onSelect, tree.closeAll);
    });
    return (
      <div
        ref={mergedRef}
        role="menuitemcheckbox"
        aria-checked={isChecked}
        {...props}
        {...item}
        tabIndex={-1}
        className={clsx('flg-menu-item', className)}
        onPointerMove={composeEventHandlers(onPointerMove, item.onPointerMove)}
        onFocus={composeEventHandlers(onFocus, item.onFocus)}
        onClick={composeEventHandlers(onClick, item.onClick)}
        onKeyDown={composeEventHandlers(onKeyDown, item.onKeyDown)}
      >
        <span className="flg-menu-item-icon" aria-hidden="true">
          {isChecked ? CHECK : null}
        </span>
        {children}
      </div>
    );
  },
);

interface GroupContextValue {
  setLabelId: (id: string | undefined) => void;
}
const GroupContext = createContext<GroupContextValue | null>(null);

/** A group that the MenuLabel inside it, if any, names. */
function useGroupLabel() {
  const [labelId, setLabelId] = useState<string | undefined>();
  const context = useMemo<GroupContextValue>(() => ({ setLabelId }), []);
  return [labelId, context] as const;
}

interface RadioGroupContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
}
const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/** A set of items where one is chosen. A MenuLabel inside names it. */
export const MenuRadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  function MenuRadioGroup({ value, defaultValue, onValueChange, ...props }, ref) {
    const [current, setValue] = useControllableState<string | undefined>({
      value,
      defaultValue,
      onChange: onValueChange as ((value: string | undefined) => void) | undefined,
      name: 'MenuRadioGroup',
    });
    const context = useMemo(() => ({ value: current, setValue }), [current, setValue]);
    const [labelId, labelContext] = useGroupLabel();
    return (
      <GroupContext.Provider value={labelContext}>
        <RadioGroupContext.Provider value={context}>
          <div ref={ref} role="group" aria-labelledby={labelId} {...props} />
        </RadioGroupContext.Provider>
      </GroupContext.Provider>
    );
  },
);

/** One choice of a MenuRadioGroup. */
export const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(function MenuRadioItem(
  {
    value,
    onSelect,
    disabled = false,
    textValue,
    className,
    children,
    onPointerMove,
    onFocus,
    onClick,
    onKeyDown,
    ...props
  },
  ref,
) {
  const { tree, level } = useMenu('MenuRadioItem');
  const group = useContext(RadioGroupContext);
  if (!group) devWarn('<MenuRadioItem> must be rendered inside a <MenuRadioGroup>.');
  const itemRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, itemRef), [ref]);
  const checked = group?.value === value;
  const item = useItem(level, disabled, textValue, () => {
    group?.setValue(value);
    choose(itemRef.current, onSelect, tree.closeAll);
  });
  return (
    <div
      ref={mergedRef}
      role="menuitemradio"
      aria-checked={checked}
      {...props}
      {...item}
      tabIndex={-1}
      className={clsx('flg-menu-item', className)}
      onPointerMove={composeEventHandlers(onPointerMove, item.onPointerMove)}
      onFocus={composeEventHandlers(onFocus, item.onFocus)}
      onClick={composeEventHandlers(onClick, item.onClick)}
      onKeyDown={composeEventHandlers(onKeyDown, item.onKeyDown)}
    >
      <span className="flg-menu-item-icon" aria-hidden="true">
        {checked ? <span className="flg-menu-radio-dot" /> : null}
      </span>
      {children}
    </div>
  );
});

/** Groups items; a MenuLabel inside names the group. */
export const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(function MenuGroup(props, ref) {
  const [labelId, labelContext] = useGroupLabel();
  return (
    <GroupContext.Provider value={labelContext}>
      <div ref={ref} role="group" aria-labelledby={labelId} {...props} />
    </GroupContext.Provider>
  );
});

/** A heading for the items after it. Inside a MenuGroup, it names the group. */
export const MenuLabel = forwardRef<HTMLDivElement, MenuLabelProps>(function MenuLabel(
  { id: idProp, className, ...props },
  ref,
) {
  const generated = useId();
  const id = idProp ?? generated;
  const group = useContext(GroupContext);
  const setLabelId = group?.setLabelId;
  useIsoLayoutEffect(() => {
    if (!setLabelId) return;
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);
  return (
    <div
      ref={ref}
      role="presentation"
      id={id}
      className={clsx('flg-menu-label', className)}
      {...props}
    />
  );
});

export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator(
  { className, ...props },
  ref,
) {
  return (
    <div ref={ref} role="separator" className={clsx('flg-menu-separator', className)} {...props} />
  );
});

/** A keyboard shortcut shown at the end of an item. */
export const MenuShortcut = forwardRef<HTMLSpanElement, MenuShortcutProps>(function MenuShortcut(
  { className, ...props },
  ref,
) {
  return <span ref={ref} className={clsx('flg-menu-shortcut', className)} {...props} />;
});

interface SubContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLDivElement | null>;
  focusOnOpen: MutableRefObject<FocusOnOpen>;
  /** The menu the submenu opens from. */
  parent: MenuLevelContextValue;
}
const SubContext = createContext<SubContextValue | null>(null);

function useSub(part: string): SubContextValue | null {
  const sub = useContext(SubContext);
  if (!sub) devWarn(`<${part}> must be rendered inside a <MenuSub>.`);
  return sub;
}

/** A submenu: a MenuSubTrigger and the MenuSubContent it opens. */
export function MenuSub({ open, defaultOpen = false, onOpenChange, children }: MenuSubProps) {
  const { level } = useMenu('MenuSub');
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'MenuSub',
  });
  const contentId = useId();
  const triggerId = useId();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const focusOnOpen = useRef<FocusOnOpen>('none');
  // While open, it is the submenu of its level: highlighting another item there closes it.
  useEffect(() => {
    if (!isOpen) return;
    const entry = { trigger: triggerRef.current, close: () => setOpen(false) };
    level.openSub.current = entry;
    return () => {
      if (level.openSub.current === entry) level.openSub.current = null;
    };
  }, [isOpen, level, setOpen]);
  const context = useMemo(
    () => ({ open: isOpen, setOpen, contentId, triggerId, triggerRef, focusOnOpen, parent: level }),
    [isOpen, setOpen, contentId, triggerId, level],
  );
  return (
    <SubContext.Provider value={context}>
      <div role="none" className="flg-menu-sub">
        {children}
      </div>
    </SubContext.Provider>
  );
}

/** How long the pointer rests on a sub-trigger before its submenu opens, in ms. */
const SUB_OPEN_DELAY = 100;
/** How long the pointer may take to reach the submenu through the grace triangle, in ms. */
const GRACE_TIME = 300;

/** The item that opens a submenu: →, Enter, Space, a click, or the pointer resting on it. */
export const MenuSubTrigger = forwardRef<HTMLDivElement, MenuSubTriggerProps>(
  function MenuSubTrigger(
    {
      disabled = false,
      textValue,
      icon,
      className,
      children,
      onPointerMove,
      onPointerLeave,
      onFocus,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const { level } = useMenu('MenuSubTrigger');
    const sub = useSub('MenuSubTrigger');
    const triggerRef = sub?.triggerRef;
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    const openSub = (focus: FocusOnOpen) => {
      if (!sub) return;
      sub.focusOnOpen.current = focus;
      if (!sub.open) {
        sub.setOpen(true);
        return;
      }
      // Already open, from the pointer: the keyboard moves into it now.
      const content = document.getElementById(sub.contentId);
      if (focus === 'first' && content) {
        const first = content.querySelector<HTMLElement>(
          '[role^="menuitem"]:not([aria-disabled="true"])',
        );
        first?.focus();
      }
    };
    const item = useItem(level, disabled, textValue, (pointer) =>
      openSub(pointer ? 'none' : 'first'),
    );

    return (
      <div
        ref={mergedRef}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={sub?.open ?? false}
        aria-controls={sub?.open ? sub.contentId : undefined}
        data-open={dataAttr(sub?.open)}
        {...props}
        {...item}
        tabIndex={-1}
        id={sub?.triggerId}
        className={clsx('flg-menu-item', className)}
        onPointerMove={composeEventHandlers(
          onPointerMove,
          (event: PointerEvent<HTMLDivElement>) => {
            item.onPointerMove(event);
            if (event.pointerType !== 'mouse' || disabled || sub?.open) return;
            if (timer.current === undefined) {
              timer.current = setTimeout(() => {
                timer.current = undefined;
                openSub('none');
              }, SUB_OPEN_DELAY);
            }
          },
        )}
        onPointerLeave={composeEventHandlers(
          onPointerLeave,
          (event: PointerEvent<HTMLDivElement>) => {
            clearTimeout(timer.current);
            timer.current = undefined;
            const content = sub?.open ? document.getElementById(sub.contentId) : null;
            if (event.pointerType !== 'mouse' || !content) return;
            // The pointer heads for the submenu: other items it crosses on the way stay unlit.
            const box = content.getBoundingClientRect();
            const edge = content.dataset.side === 'left' ? box.right : box.left;
            level.pointerGrace.current = {
              polygon: [
                [event.clientX, event.clientY],
                [edge, box.top],
                [edge, box.bottom],
              ],
              until: performance.now() + GRACE_TIME,
            };
          },
        )}
        onFocus={composeEventHandlers(onFocus, item.onFocus)}
        onClick={composeEventHandlers(onClick, item.onClick)}
        onKeyDown={composeEventHandlers(onKeyDown, (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            if (!disabled) openSub('first');
            return;
          }
          item.onKeyDown(event);
        })}
      >
        <span className="flg-menu-item-icon" aria-hidden="true">
          {icon}
        </span>
        {children}
        {CHEVRON}
      </div>
    );
  },
);

/** The panel of a submenu. Opens to the right of its trigger, and flips when there is no room. */
export const MenuSubContent = forwardRef<HTMLDivElement, MenuSubContentProps>(
  function MenuSubContent({ onPointerEnter, ...props }, ref) {
    const sub = useSub('MenuSubContent');
    const close = () => sub?.setOpen(false);
    return (
      <MenuPanel
        ref={ref}
        aria-labelledby={sub?.triggerId}
        {...props}
        open={(sub?.open ?? false) && (sub?.parent.open ?? false)}
        report={(next) => sub?.setOpen(next)}
        contentId={sub?.contentId ?? ''}
        reference={() => sub?.triggerRef.current ?? null}
        restoreFocusTo={() => sub?.triggerRef.current ?? null}
        focusOnOpen={sub?.focusOnOpen ?? { current: 'none' }}
        side="right"
        align="start"
        offset={2}
        // The panel's 4px padding and 1px border: its first item lines up with the trigger.
        alignOffset={-5}
        onCloseSub={close}
        onPointerEnter={composeEventHandlers(onPointerEnter, () => {
          if (sub) sub.parent.pointerGrace.current = null;
        })}
      />
    );
  },
);
```

`src/components/menu/index.ts`:

```ts
export {
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from './Menu';
export type {
  MenuCheckboxItemProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLabelProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSelectEvent,
  MenuSeparatorProps,
  MenuShortcutProps,
  MenuSubContentProps,
  MenuSubProps,
  MenuSubTriggerProps,
} from './Menu';
```

Ghi chú:
- **Chọn item.** `choose()` phát sự kiện `flg-menu-select` (cancelable) trên item. `onSelect` nhận đúng sự kiện đó, nên `event.preventDefault()` giữ menu mở.
- **Enter và Space** gọi `click()` trên item. Nhờ vậy mọi item có một đường kích hoạt, và item là link vẫn đi theo link (phát hiện 5).
- **`tabIndex={-1}` viết tường minh** trên từng item, sau phần spread. Thiếu nó, `jsx-a11y/interactive-supports-focus` báo lỗi vì không thấy `tabIndex` đi qua spread.

- [ ] **Step 7: Viết DropdownMenu**

`src/components/dropdown-menu/DropdownMenu.tsx`:

```tsx
'use client';

import { createContext, forwardRef, useCallback, useContext, useId, useMemo, useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, MutableRefObject, ReactNode } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllableState } from '../../internal/use-controllable-state';
import type { Align, Side } from '../../internal/use-floating';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';
import { MenuTreeContext } from '../menu/menu-context';
import type { FocusOnOpen } from '../menu/menu-context';
import { MenuPanel } from '../menu/MenuPanel';

interface DropdownMenuContextValue {
  open: boolean;
  /** Asks for a change: the trigger, a chosen item, Tab. */
  setOpen: (open: boolean) => void;
  /** Reports a change that the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  contentId: string;
  triggerId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  pendingToggle: MutableRefObject<boolean | null>;
  focusOnOpen: MutableRefObject<FocusOnOpen>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu(part: string): DropdownMenuContextValue {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <DropdownMenu>.`);
    return {
      open: false,
      setOpen: () => {},
      report: () => {},
      contentId: '',
      triggerId: '',
      triggerRef: { current: null },
      contentRef: { current: null },
      pendingToggle: { current: null },
      focusOnOpen: { current: 'menu' },
    };
  }
  return ctx;
}

export interface DropdownMenuProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export type DropdownMenuTriggerProps = Omit<ButtonProps, 'id'>;
export interface DropdownMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** The side of the trigger it opens on. It flips when there is no room. Default `"bottom"`. */
  side?: Side;
  /** How it lines up with the trigger along that side. Default `"start"`. */
  align?: Align;
  /** Gap to the trigger, in px. Default 4. */
  sideOffset?: number;
}

/** A menu of commands that a button opens, on the native `popover="auto"`. Renders no element. */
export function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'DropdownMenu',
  });
  const contentId = useId();
  const triggerId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pendingToggle = useRef<boolean | null>(null);
  const focusOnOpen = useRef<FocusOnOpen>('menu');
  // A press on the trigger light-dismisses the menu before its click asks to close it; the browser's
  // late `toggle` for that close must not reach the parent a second time (see Popover).
  const request = useCallback(
    (next: boolean) => {
      const el = contentRef.current;
      const alreadyMade = el !== null && next !== isOpen && el.matches(':popover-open') === next;
      pendingToggle.current = alreadyMade ? next : null;
      setOpen(next);
    },
    [isOpen, setOpen],
  );
  const tree = useMemo(() => ({ closeAll: () => request(false) }), [request]);
  const value = useMemo(
    () => ({
      open: isOpen,
      setOpen: request,
      report: setOpen,
      contentId,
      triggerId,
      triggerRef,
      contentRef,
      pendingToggle,
      focusOnOpen,
    }),
    [isOpen, request, setOpen, contentId, triggerId],
  );
  return (
    <DropdownMenuContext.Provider value={value}>
      <MenuTreeContext.Provider value={tree}>{children}</MenuTreeContext.Provider>
    </DropdownMenuContext.Provider>
  );
}

/**
 * Opens the menu. Renders the library's `Button` and takes its props. Enter, Space and ↓ open it on
 * the first item, ↑ on the last; a click opens it on the menu itself.
 */
export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger(
    { onPointerDown, onPointerCancel, onClick, onKeyDown, ...props },
    ref,
  ) {
    const ctx = useDropdownMenu('DropdownMenuTrigger');
    const openAtPress = useRef<boolean | null>(null);
    const triggerRef = ctx.triggerRef;
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);

    const openOn = (where: FocusOnOpen) => {
      ctx.focusOnOpen.current = where;
      if (!ctx.open) {
        ctx.setOpen(true);
        return;
      }
      // Already open: the keyboard moves into it now.
      const content = ctx.contentRef.current;
      const items = content
        ? Array.from(
            content.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])'),
          ).filter((el) => el.closest('[role="menu"]') === content)
        : [];
      (where === 'last' ? items[items.length - 1] : items[0])?.focus();
    };

    return (
      <Button
        ref={mergedRef}
        aria-haspopup="menu"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        {...props}
        id={ctx.triggerId}
        onKeyDown={composeEventHandlers(onKeyDown, (event: KeyboardEvent<HTMLButtonElement>) => {
          const where =
            event.key === 'ArrowUp'
              ? 'last'
              : ['Enter', ' ', 'ArrowDown'].includes(event.key)
                ? 'first'
                : null;
          if (!where) return;
          event.preventDefault();
          openOn(where);
        })}
        onPointerDown={composeEventHandlers(onPointerDown, () => {
          openAtPress.current = ctx.open;
        })}
        onPointerCancel={composeEventHandlers(onPointerCancel, () => {
          openAtPress.current = null;
        })}
        onClick={composeEventHandlers(onClick, (event) => {
          // Like PopoverTrigger: a press decides from the state at the press, anything else from now.
          const fromPress = (event?.detail ?? 0) !== 0;
          const wasOpen = (fromPress ? openAtPress.current : null) ?? ctx.open;
          openAtPress.current = null;
          ctx.focusOnOpen.current = fromPress ? 'menu' : 'first';
          ctx.setOpen(!wasOpen);
        })}
      />
    );
  },
);

/** The menu panel. Rendered right after the trigger, and named by it. */
export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function DropdownMenuContent(
    { side = 'bottom', align = 'start', sideOffset = 4, ...props },
    ref,
  ) {
    const ctx = useDropdownMenu('DropdownMenuContent');
    const contentRef = ctx.contentRef;
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref, contentRef]);
    const { triggerRef } = ctx;
    return (
      <MenuPanel
        ref={mergedRef}
        aria-labelledby={ctx.triggerId}
        {...props}
        open={ctx.open}
        report={ctx.report}
        pendingToggle={ctx.pendingToggle}
        contentId={ctx.contentId}
        reference={() => triggerRef.current}
        restoreFocusTo={() => triggerRef.current}
        focusOnOpen={ctx.focusOnOpen}
        side={side}
        align={align}
        offset={sideOffset}
      />
    );
  },
);
```

`src/components/dropdown-menu/index.ts`:

```ts
export { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './DropdownMenu';
export type {
  DropdownMenuContentProps,
  DropdownMenuProps,
  DropdownMenuTriggerProps,
} from './DropdownMenu';
```

- [ ] **Step 8: CSS của menu**

`src/styles/components/menu.css`:

```css
/* Menus: DropdownMenu, ContextMenu and submenus (spec §4.3, mockup menus A). The browser's styles
   for [popover] are undone here; Floating UI writes `left`, `top` and `max-height`. */
@layer flg.components {
  .flg-menu {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    min-width: 180px;
    max-width: calc(100vw - 32px);
    margin: 0;
    padding: 4px;
    border-radius: var(--flg-radius-md);
    background-color: transparent;
    color: var(--flg-text);
    font-size: var(--flg-text-sm);
    overflow-y: auto;
    overscroll-behavior: contain;
    outline: none;
    transition:
      opacity var(--flg-duration-normal) var(--flg-ease),
      translate var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    height: 30px;
    padding: 0 8px;
    border-radius: calc(var(--flg-radius-md) - 4px);
    color: inherit;
    text-decoration: none;
    white-space: nowrap;
    cursor: default;
    outline: none;
    user-select: none;
  }
  /* The highlighted item is the focused one; a sub-trigger stays lit while its submenu is open. */
  .flg-menu-item:focus,
  .flg-menu-item[data-open] {
    background: var(--flg-highlight-bg);
    color: var(--flg-highlight-text);
  }
  .flg-menu-item[data-variant='danger'] {
    color: var(--flg-danger);
  }
  .flg-menu-item[data-variant='danger']:focus {
    background: var(--flg-highlight-danger-bg);
    color: var(--flg-highlight-danger-text);
  }
  .flg-menu-item[aria-disabled='true'] {
    opacity: 0.5;
  }
  .flg-menu-item-icon {
    display: inline-flex;
    flex: none;
    justify-content: center;
    width: 16px;
    color: var(--flg-text-muted);
  }
  .flg-menu-item-icon svg {
    width: 15px;
    height: 15px;
  }
  .flg-menu-item[data-variant='danger'] .flg-menu-item-icon {
    color: inherit;
  }
  .flg-menu-radio-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  .flg-menu-shortcut {
    margin-left: auto;
    padding-left: 12px;
    color: var(--flg-text-muted);
    font-size: var(--flg-text-xs);
  }
  .flg-menu-chevron {
    flex: none;
    width: 15px;
    height: 15px;
    margin-left: auto;
    color: var(--flg-text-muted);
  }
  .flg-menu-item:is(:focus, [data-open])
    :is(.flg-menu-item-icon, .flg-menu-shortcut, .flg-menu-chevron) {
    color: var(--flg-highlight-icon);
  }
  .flg-menu-item[data-variant='danger']:focus
    :is(.flg-menu-item-icon, .flg-menu-shortcut, .flg-menu-chevron) {
    color: inherit;
  }
  .flg-menu-label {
    padding: 6px 8px 2px;
    color: var(--flg-text-muted);
    font-size: var(--flg-text-xs);
    font-weight: var(--flg-weight-medium);
  }
  .flg-menu-separator {
    height: 1px;
    margin: 4px 6px;
    background: var(--flg-control-border);
  }
  /* The submenu wrapper only groups a trigger with its panel for assistive technology. */
  .flg-menu-sub {
    display: contents;
  }
}
```

```diff
diff --git a/src/styles/components/floating.css b/src/styles/components/floating.css
index 21c9b30..7be4e65 100644
--- a/src/styles/components/floating.css
+++ b/src/styles/components/floating.css
@@ -2,19 +2,19 @@
    moves 4px away from the trigger. `data-side` is where Floating UI placed it. */
 @layer flg.components {
   @starting-style {
-    :is(.flg-popover, .flg-tooltip):popover-open {
+    :is(.flg-popover, .flg-tooltip, .flg-menu):popover-open {
       opacity: 0;
     }
-    :is(.flg-popover, .flg-tooltip)[data-side='bottom']:popover-open {
+    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='bottom']:popover-open {
       translate: 0 -4px;
     }
-    :is(.flg-popover, .flg-tooltip)[data-side='top']:popover-open {
+    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='top']:popover-open {
       translate: 0 4px;
     }
-    :is(.flg-popover, .flg-tooltip)[data-side='right']:popover-open {
+    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='right']:popover-open {
       translate: -4px 0;
     }
-    :is(.flg-popover, .flg-tooltip)[data-side='left']:popover-open {
+    :is(.flg-popover, .flg-tooltip, .flg-menu)[data-side='left']:popover-open {
       translate: 4px 0;
     }
   }
diff --git a/src/styles/index.css b/src/styles/index.css
index 3202961..41818f8 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -20,5 +20,6 @@
 @import './components/dialog.css';
 @import './components/popover.css';
 @import './components/tooltip.css';
+@import './components/menu.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index d06c09f..2d314bc 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -108,6 +108,20 @@
       color: CanvasText;
       box-shadow: none;
     }
+    .flg-menu-item:is(:focus, [data-open]) {
+      background: Highlight;
+      color: HighlightText;
+    }
+    .flg-menu-item:is(:focus, [data-open])
+      :is(.flg-menu-item-icon, .flg-menu-shortcut, .flg-menu-chevron) {
+      color: HighlightText;
+    }
+    .flg-menu-item[aria-disabled='true'] {
+      color: GrayText;
+    }
+    .flg-menu-separator {
+      background: CanvasText;
+    }
     .flg-popover-arrow {
       border-color: CanvasText;
       background: Canvas;
```

- [ ] **Step 9: Export và kiểm tra gói**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 51f3ac5..de0aa76 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -34,6 +34,11 @@ const SHIPPED_CLASSES = [
   'flg-popover',
   'flg-popover-arrow',
   'flg-tooltip',
+  'flg-menu',
+  'flg-menu-item',
+  'flg-menu-label',
+  'flg-menu-separator',
+  'flg-menu-shortcut',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 1b9b3da..898e3c0 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -17,6 +17,8 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/drawer/Drawer.tsx',
   'src/components/popover/Popover.tsx',
   'src/components/tooltip/Tooltip.tsx',
+  'src/components/menu/Menu.tsx',
+  'src/components/dropdown-menu/DropdownMenu.tsx',
 ];
 
 /**
diff --git a/src/index.test.ts b/src/index.test.ts
index ae37be3..e01f9e7 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -31,9 +31,23 @@ describe('public API', () => {
       'DrawerHeader',
       'DrawerTitle',
       'DrawerTrigger',
+      'DropdownMenu',
+      'DropdownMenuContent',
+      'DropdownMenuTrigger',
       'Field',
       'IconButton',
       'Input',
+      'MenuCheckboxItem',
+      'MenuGroup',
+      'MenuItem',
+      'MenuLabel',
+      'MenuRadioGroup',
+      'MenuRadioItem',
+      'MenuSeparator',
+      'MenuShortcut',
+      'MenuSub',
+      'MenuSubContent',
+      'MenuSubTrigger',
       'Popover',
       'PopoverClose',
       'PopoverContent',
diff --git a/src/index.ts b/src/index.ts
index 890e9d0..8e59d42 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -92,3 +92,36 @@ export type {
 } from './components/popover';
 export { Tooltip, TooltipContent, TooltipTrigger } from './components/tooltip';
 export type { TooltipContentProps, TooltipProps, TooltipTriggerProps } from './components/tooltip';
+export {
+  MenuCheckboxItem,
+  MenuGroup,
+  MenuItem,
+  MenuLabel,
+  MenuRadioGroup,
+  MenuRadioItem,
+  MenuSeparator,
+  MenuShortcut,
+  MenuSub,
+  MenuSubContent,
+  MenuSubTrigger,
+} from './components/menu';
+export type {
+  MenuCheckboxItemProps,
+  MenuGroupProps,
+  MenuItemProps,
+  MenuLabelProps,
+  MenuRadioGroupProps,
+  MenuRadioItemProps,
+  MenuSelectEvent,
+  MenuSeparatorProps,
+  MenuShortcutProps,
+  MenuSubContentProps,
+  MenuSubProps,
+  MenuSubTriggerProps,
+} from './components/menu';
+export { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './components/dropdown-menu';
+export type {
+  DropdownMenuContentProps,
+  DropdownMenuProps,
+  DropdownMenuTriggerProps,
+} from './components/dropdown-menu';
```

- [ ] **Step 10: Docs**

`src/components/dropdown-menu/DropdownMenu.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './DropdownMenu.stories';

<Meta of={Stories} />

# DropdownMenu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  MenuItem,
  MenuSeparator,
  MenuShortcut,
} from 'fl-glass-ui';

<DropdownMenu>
  <DropdownMenuTrigger variant="secondary">Project</DropdownMenuTrigger>
  <DropdownMenuContent>
    <MenuItem icon={<EditIcon />} onSelect={rename}>
      Rename <MenuShortcut>F2</MenuShortcut>
    </MenuItem>
    <MenuSeparator />
    <MenuItem variant="danger" onSelect={remove}>
      Delete project
    </MenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

<Canvas of={Stories.Open} />
<Controls />

## Menu parts

The parts below work in a DropdownMenu, a ContextMenu and a submenu alike.

| Part                                          | Renders                   | Notes                                                                                         |
| --------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `MenuItem`                                    | `role="menuitem"`         | `onSelect`, `disabled`, `variant` (`"default"` or `"danger"`), `icon`, `textValue`, `asChild` |
| `MenuCheckboxItem`                            | `role="menuitemcheckbox"` | `checked`, `defaultChecked`, `onCheckedChange`                                                |
| `MenuRadioGroup`                              | `role="group"`            | `value`, `defaultValue`, `onValueChange`                                                      |
| `MenuRadioItem`                               | `role="menuitemradio"`    | `value`                                                                                       |
| `MenuGroup`, `MenuLabel`                      | `role="group"`            | A `MenuLabel` inside a `MenuGroup` names it                                                   |
| `MenuSeparator`                               | `role="separator"`        |                                                                                               |
| `MenuShortcut`                                | `<span>`                  | A keyboard shortcut at the end of an item. It only shows the keys; the app binds them         |
| `MenuSub`, `MenuSubTrigger`, `MenuSubContent` | a submenu                 | `MenuSub` takes `open`, `defaultOpen`, `onOpenChange`                                         |

Choosing an item closes the whole menu and returns focus to the trigger. Call
`event.preventDefault()` in `onSelect` to keep the menu open, for example to toggle several
checkbox items in a row.

Checkbox items and radio groups keep their value from one opening to the next, controlled or not.

<Canvas of={Stories.CheckboxAndRadioItems} />

## Submenus

A submenu opens on its trigger with →, Enter or Space, or after the pointer rests on it for 100ms.
← or Esc closes it. On the way from the trigger to the submenu, the pointer may cross other items
without taking the highlight.

<Canvas of={Stories.Submenu} />

## Keyboard

| Key          | On the trigger             | In the menu                           |
| ------------ | -------------------------- | ------------------------------------- |
| Enter, Space | Opens it on the first item | Chooses the item                      |
| ↓            | Opens it on the first item | Next item, wrapping round             |
| ↑            | Opens it on the last item  | Previous item, wrapping round         |
| Home, End    |                            | First or last item                    |
| →            |                            | Opens the submenu                     |
| ←            |                            | Closes the submenu                    |
| A letter     |                            | The next item that starts with it     |
| Esc          |                            | Closes the menu it is in              |
| Tab          |                            | Closes the whole menu; focus moves on |

## Placement

`side` (default `"bottom"`) and `align` (default `"start"`) place the menu next to the trigger, with
a gap of `sideOffset` (4px by default). It flips when there is no room, and never grows taller than
the room it has; past that it scrolls.

## Accessibility

- The menu is a native `popover="auto"`: Esc and a click outside close it, and it needs no portal.
- The trigger names the menu, and carries `aria-haspopup="menu"`, `aria-expanded` and, while open,
  `aria-controls`.
- The highlighted item is the focused item. The highlight's light accent wash comes from the
  approved design and falls short of 3:1 against the panel; see rows 8–10 on the Accessibility page.
  With `prefers-contrast: more`, the highlight is a solid accent fill.

## Do and don't

- Do use a menu for commands. For choosing a value in a form, use a Select.
- Don't hide a command only in a menu when it is the main thing on the page; show it as a button.
````

- [ ] **Step 11: Cập nhật spec**

````diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 33a4db8..2e57f41 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -114,6 +114,7 @@ Mỗi plan tự mang đủ phần của mình: stories, test các lớp ở §7,
   - Vỏ là phần tử `<dialog>` hoặc phần tử `popover`. Nó luôn được render để HTML từ server có sẵn và ref ổn định.
   - Con của vỏ chỉ được render khi đang mở.
   - Ngoại lệ là `TooltipContent`: con luôn được render, vì nó là nguồn của `aria-describedby`.
+  - Ngoại lệ thứ hai là panel của menu (`DropdownMenuContent`, `ContextMenuContent`, `MenuSubContent`): con luôn được render, để `MenuCheckboxItem` và `MenuRadioGroup` uncontrolled giữ giá trị từ lần mở này sang lần mở sau. Popover đóng là `display: none`, nên lúc đó các item nằm ngoài cây truy cập và thứ tự Tab. Hai hệ quả, phát hiện khi lập Plan B: menu con chỉ hiện sau khi menu cha đã hiện (một popover lồng được hiện trước cha sẽ bị cha đóng mất khi cha hiện), và menu con đóng theo khi menu cha đóng.
 - **`aria-controls` trên trigger** chỉ có khi đang mở, vì lúc đóng phần tử đích chưa tồn tại.
 - **Bỏ style mặc định của trình duyệt.** CSS nền của lib xoá style mặc định cho `[popover]` và `dialog` thuộc lib: `inset`, `margin`, `padding`, `border`, `background`, `color`, `max-width` và `max-height`.
 
@@ -417,7 +418,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | File | Export | Nhiệm vụ |
 |---|---|---|
 | `use-controllable-state.ts` | `useControllableState({ value, defaultValue, onChange })` | Trả `[value, setValue]`. Controlled khi `value !== undefined`. `setValue` gọi `onChange` khi giá trị đổi, và chỉ cập nhật state nội bộ khi uncontrolled. Cảnh báo dev khi một component đổi giữa controlled và uncontrolled |
-| `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `maxHeight`, Plan C thêm `matchWidth` | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
+| `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `alignOffset` (lệch dọc theo cạnh, cho menu con) và `maxHeight` (middleware `size`, giới hạn thêm ngoài chỗ trống; menu truyền `Infinity`), Plan C thêm `matchWidth` | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
 | `use-popover.ts` | `usePopover(ref, { open, onOpenChange })` | Gọi `showPopover()`/`hidePopover()` theo `open`. Nghe `toggle` để gọi `onOpenChange` khi trình duyệt tự đóng |
 | `focus.ts` | `getFocusables(root)`, `focusFirst(root)`, `isFocusable(el)` | Tìm các phần tử nhận focus được, theo thứ tự DOM, bỏ qua phần tử bị ẩn, `inert` hoặc `disabled` |
 | `lock-scroll.ts` | `lockScroll(): () => void` | Có đếm số lần khoá. Lần khoá đầu đặt `overflow: hidden` lên `<html>`, kèm `scrollbar-gutter: stable` nếu trang đang có thanh cuộn dọc (để bố cục không bị xô). Lần mở khoá cuối trả lại style cũ |
@@ -563,10 +564,11 @@ Như §3.6.
 - **`MenuItem`:**
 
   ```ts
-  { onSelect?: (event: Event) => void; disabled?: boolean; variant?: "default" | "danger"; textValue?: string; asChild?: boolean }
+  { onSelect?: (event: Event) => void; disabled?: boolean; variant?: "default" | "danger"; textValue?: string; icon?: ReactNode; asChild?: boolean }
   ```
 
   - Render `role="menuitem"`.
+  - `icon` nằm trong cột icon 16px ở đầu item, theo mockup menu A. `MenuSubTrigger` cũng nhận `icon` (thêm khi lập Plan B).
   - Chọn một item thì đóng toàn bộ cây menu và trả focus về trigger. Nếu `onSelect` gọi `event.preventDefault()`, menu giữ nguyên trạng thái mở.
 - **`MenuCheckboxItem`:**
   - Nhận `checked`, `defaultChecked`, `onCheckedChange`, cùng các prop của `MenuItem` trừ `variant`.
````

- [ ] **Step 12: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/dropdown-menu
pnpm build && pnpm size:record && pnpm check:package
pnpm check:contrast
```

Expected:
- `pnpm test:unit`: 484 test PASS, 2 skip, không có lỗi kiểu.
- Story: 30 test PASS (5 story × 3 trình duyệt × 2 theme).
- `size:record` ghi JS khoảng 19.7 kB và CSS khoảng 5.2 kB (brotli). `check:package` PASS.

- [ ] **Step 13: Commit**

```bash
git add src/components/menu src/components/dropdown-menu src/internal/use-floating.ts src/styles .storybook/icons.tsx src/index.ts src/index.test.ts scripts/check-use-client.ts scripts/check-dist-css.ts .size-limit.json docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
git commit -m "feat: add DropdownMenu and the shared Menu parts, with submenus" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: ContextMenu

**Files:**
- Create: `src/components/context-menu/ContextMenu.tsx`, `src/components/context-menu/index.ts`, `src/components/context-menu/ContextMenu.mdx`
- Modify: `src/styles/components/menu.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`, spec giai đoạn 2
- Test: `src/components/context-menu/ContextMenu.stories.tsx`, `src/components/context-menu/ContextMenu.test-d.ts`

**Interfaces:**
- Consumes (Task 5): `MenuPanel`, `MenuTreeContext`, `FocusOnOpen`, `Point`, các phần `Menu*`.
- Produces: `ContextMenu` (`{ onOpenChange?; children }`), `ContextMenuTrigger` (`HTMLAttributes<HTMLDivElement> & { asChild? }`), `ContextMenuContent` (`Omit<HTMLAttributes<HTMLDivElement>, 'id'> & { sideOffset? }`), cùng kiểu props của chúng.

- [ ] **Step 1: Viết story và type test**

`src/components/context-menu/ContextMenu.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { CopyIcon, EditIcon, FileIcon, TrashIcon } from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { MenuItem, MenuSeparator, MenuShortcut } from '../menu/Menu';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './ContextMenu';

const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
  tags: ['no-visual'],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = { width: 15, height: 15 };
const area = {
  display: 'grid',
  placeItems: 'center',
  gap: 8,
  width: 320,
  height: 180,
  border: '1px dashed var(--flg-control-border)',
  borderRadius: 'var(--flg-radius-md)',
  color: 'var(--flg-text-muted)',
} as const;

const onOpen = fn();

function FileMenu() {
  return (
    <ContextMenuContent aria-label="report.pdf">
      <MenuItem icon={<FileIcon {...icon} />} onSelect={onOpen}>
        Open
      </MenuItem>
      <MenuItem icon={<EditIcon {...icon} />}>
        Rename <MenuShortcut>F2</MenuShortcut>
      </MenuItem>
      <MenuItem icon={<CopyIcon {...icon} />}>Duplicate</MenuItem>
      <MenuSeparator />
      <MenuItem icon={<TrashIcon {...icon} />} variant="danger">
        Delete
      </MenuItem>
    </ContextMenuContent>
  );
}

function Scene(args: Story['args']) {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Button variant="secondary" size="sm">
        Before
      </Button>
      <ContextMenu {...args}>
        <ContextMenuTrigger style={area} data-testid="area">
          <span>Right-click report.pdf</span>
          <Button variant="ghost" size="sm">
            report.pdf
          </Button>
        </ContextMenuTrigger>
        <FileMenu />
      </ContextMenu>
    </div>
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const Default: Story = {
  render: (args) => <Scene {...args} />,
  play: async ({ canvas, args }) => {
    const before = canvas.getByRole('button', { name: 'Before' });
    const file = canvas.getByRole('button', { name: 'report.pdf' });
    const menu = canvas.getByRole('menu', { hidden: true });

    // Shift+F10 on the focused element opens the menu below it, on its first item.
    file.focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await settled(menu);
    const f = file.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    await expect(Math.abs(m.top - f.bottom)).toBeLessThanOrEqual(1);
    await expect(Math.abs(m.left - (f.left + 2))).toBeLessThanOrEqual(1);
    // Choosing an item closes it, and focus goes back to the element it opened from.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(onOpen).toHaveBeenCalledTimes(1);
    await expect(file).toHaveFocus();
    // So does the ContextMenu key.
    await userEvent.keyboard('{ContextMenu}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();

    const real = await realUserEvent();
    if (!real) return;
    await real.keyboard('{Escape}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(file).toHaveFocus();

    // A right click opens it at the pointer. The press ends before it opens: in WebKit and Firefox
    // the browser fires `contextmenu` while the button is still down.
    before.focus();
    const zone = canvas.getByTestId('area');
    const z = zone.getBoundingClientRect();
    await real.click(zone, { button: 'right', position: { x: 40, y: 30 } });
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    await settled(menu);
    const opened = menu.getBoundingClientRect();
    await expect(Math.abs(opened.left - (z.left + 40 + 2))).toBeLessThanOrEqual(1);
    await expect(Math.abs(opened.top - (z.top + 30))).toBeLessThanOrEqual(1);
    // Another right click in the area, clear of the menu, opens it afresh at the new point.
    await real.click(zone, { button: 'right', position: { x: 280, y: 160 } });
    await waitFor(() => {
      const again = menu.getBoundingClientRect();
      expect(menu.matches(':popover-open')).toBe(true);
      expect(Math.abs(again.left - (z.left + 280 + 2))).toBeLessThanOrEqual(1);
      expect(Math.abs(again.top - (z.top + 160))).toBeLessThanOrEqual(1);
    });
    await expect(canvas.getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    // Esc closes it; focus goes back to where it was before the first right click.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
    await expect(before).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

// Touch has no trusted input here, so these presses are synthetic pointer events. They exercise the
// timer and the slop; the browser's light dismiss, which ignores synthetic input, is covered above.
function touch(target: Element, type: string, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 7,
      pointerType: 'touch',
      isPrimary: true,
      clientX: x,
      clientY: y,
    }),
  );
}

export const LongPress: Story = {
  render: (args) => <Scene {...args} />,
  play: async ({ canvas }) => {
    const zone = canvas.getByTestId('area');
    const menu = canvas.getByRole('menu', { hidden: true });
    const z = zone.getBoundingClientRect();
    const x = z.left + 50;
    const y = z.top + 40;

    // Lifted too soon: nothing.
    touch(zone, 'pointerdown', x, y);
    await delay(200);
    touch(zone, 'pointerup', x, y);
    await delay(50);
    await expect(menu.matches(':popover-open')).toBe(false);

    // Moved more than 10px while held: nothing.
    touch(zone, 'pointerdown', x, y);
    touch(zone, 'pointermove', x + 12, y);
    await delay(600);
    touch(zone, 'pointerup', x + 12, y);
    await delay(50);
    await expect(menu.matches(':popover-open')).toBe(false);

    // Held still for 500ms: it opens at the touch point when the finger lifts.
    touch(zone, 'pointerdown', x, y);
    touch(zone, 'pointermove', x + 4, y + 3);
    await delay(600);
    await expect(menu.matches(':popover-open')).toBe(false);
    touch(zone, 'pointerup', x + 4, y + 3);
    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
    await settled(menu);
    const m = menu.getBoundingClientRect();
    await expect(Math.abs(m.left - (x + 2))).toBeLessThanOrEqual(1);
    await expect(Math.abs(m.top - y)).toBeLessThanOrEqual(1);
    await expect(within(menu).getByRole('menuitem', { name: 'Open' })).toHaveFocus();
    // The click that follows the lifted finger does not reach what it rested on.
    const clicked = fn();
    const file = canvas.getByRole('button', { name: 'report.pdf' });
    file.addEventListener('click', clicked);
    file.click();
    await expect(clicked).not.toHaveBeenCalled();
    file.click();
    await expect(clicked).toHaveBeenCalledTimes(1);
    file.removeEventListener('click', clicked);
  },
};
```

`src/components/context-menu/ContextMenu.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { ContextMenuContentProps, ContextMenuProps } from './ContextMenu';

test('ContextMenu opens only where the user asks: it has no open or defaultOpen', () => {
  expectTypeOf<ContextMenuProps>().not.toHaveProperty('open');
  expectTypeOf<ContextMenuProps>().not.toHaveProperty('defaultOpen');
  expectTypeOf<ContextMenuProps['onOpenChange']>().toEqualTypeOf<
    ((open: boolean) => void) | undefined
  >();
});

test('ContextMenuContent opens at a point: no side or align', () => {
  expectTypeOf<ContextMenuContentProps>().not.toHaveProperty('side');
  expectTypeOf<ContextMenuContentProps>().not.toHaveProperty('align');
  expectTypeOf<ContextMenuContentProps['sideOffset']>().toEqualTypeOf<number | undefined>();
});
```

| Story | Kiểm tra |
|---|---|
| `Default` | Shift+F10 và phím ContextMenu mở ngay dưới phần tử đang có focus, trên item đầu; chọn item trả focus; Esc; chuột phải thật mở tại con trỏ (Review Focus 2); chuột phải lần nữa mở lại tại điểm mới; focus về phần tử có focus trước lần chuột phải đầu |
| `LongPress` | Chạm quá ngắn hoặc trôi quá 10px thì không mở; giữ yên 500ms thì mở lúc nhấc tay, tại điểm chạm; cú click theo sau không tới phần tử dưới ngón tay |

`LongPress` dùng sự kiện pointer giả lập, vì Vitest không có input chạm thật. Light dismiss bỏ qua sự kiện giả, nên phần đó được `Default` phủ bằng chuột phải thật.

- [ ] **Step 2: Chạy story để xác nhận fail**

Run: `pnpm gen:theme && pnpm vitest run --project storybook-light src/components/context-menu --browser.name=chromium`
Expected: FAIL vì chưa có module `./ContextMenu`.

- [ ] **Step 3: Viết ContextMenu**

`src/components/context-menu/ContextMenu.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef } from 'react';
import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { devWarn } from '../../internal/warn';
import { MenuTreeContext } from '../menu/menu-context';
import type { FocusOnOpen, Point } from '../menu/menu-context';
import { MenuPanel } from '../menu/MenuPanel';

/** How long a touch rests before the menu opens, in ms. */
const LONG_PRESS = 500;
/** How far a resting touch may drift, in px. */
const LONG_PRESS_SLOP = 10;

interface ContextMenuContextValue {
  open: boolean;
  /** Opens the menu at a point in viewport coordinates. Focus returns to `from` when it closes. */
  openAt: (point: Point, from: HTMLElement | null) => void;
  /** Reports a change that the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  contentId: string;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  point: MutableRefObject<Point>;
  returnTo: MutableRefObject<HTMLElement | null>;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenu(part: string): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <ContextMenu>.`);
    return {
      open: false,
      openAt: () => {},
      report: () => {},
      contentId: '',
      contentRef: { current: null },
      point: { current: [0, 0] },
      returnTo: { current: null },
    };
  }
  return ctx;
}

export interface ContextMenuProps {
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export interface ContextMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element as the area instead of a `<div>`. */
  asChild?: boolean;
}
export interface ContextMenuContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Gap to the point it opens at, in px. Default 2. */
  sideOffset?: number;
}

const FIRST: MutableRefObject<FocusOnOpen> = { current: 'first' };

/**
 * A menu that opens where the user asks for it: a right click, a touch held still, or Shift+F10 and
 * the ContextMenu key on the focused element. Uncontrolled: opening always comes with a place.
 */
export function ContextMenu({ onOpenChange, children }: ContextMenuProps) {
  const [isOpen, setOpen] = useControllableState({
    value: undefined,
    defaultValue: false,
    onChange: onOpenChange,
    name: 'ContextMenu',
  });
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const point = useRef<Point>([0, 0]);
  const returnTo = useRef<HTMLElement | null>(null);
  const openNow = useRef(isOpen);
  openNow.current = isOpen;
  const reopen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(reopen.current), []);

  const value = useMemo<ContextMenuContextValue>(
    () => ({
      open: isOpen,
      openAt: (at, from) => {
        clearTimeout(reopen.current);
        const show = () => {
          point.current = at;
          returnTo.current = from;
          setOpen(true);
        };
        if (!openNow.current) {
          show();
          return;
        }
        // Asked again while open: the press that asked has already light-dismissed the menu, and
        // the browser reports that a task later. Close, then open afresh at the new place.
        setOpen(false);
        reopen.current = setTimeout(show, 0);
      },
      report: setOpen,
      contentId,
      contentRef,
      point,
      returnTo,
    }),
    [isOpen, setOpen, contentId],
  );
  const tree = useMemo(() => ({ closeAll: () => setOpen(false) }), [setOpen]);
  return (
    <ContextMenuContext.Provider value={value}>
      <MenuTreeContext.Provider value={tree}>{children}</MenuTreeContext.Provider>
    </ContextMenuContext.Provider>
  );
}

interface Press {
  id: number;
  start: Point;
  /** Where the menu opens once the press ends; set by `contextmenu` or a long touch. */
  armed: Point | null;
  timer: ReturnType<typeof setTimeout> | undefined;
  stop: () => void;
}

/**
 * The area that has the menu. A press opens it when the press ends: the browser light-dismisses a
 * popover shown while a pointer is down as soon as that pointer comes up, and WebKit and Firefox fire
 * `contextmenu` before the button is released.
 */
export const ContextMenuTrigger = forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  function ContextMenuTrigger(
    {
      asChild = false,
      className,
      onPointerDown,
      onContextMenu,
      onKeyDown,
      onClickCapture,
      ...props
    },
    ref,
  ) {
    const ctx = useContextMenu('ContextMenuTrigger');
    const press = useRef<Press | null>(null);
    // Focus as it was before the press, which may have moved it.
    const focusBefore = useRef<HTMLElement | null>(null);
    // A touch that opened the menu must not also click what it rested on.
    const swallowClickUntil = useRef(0);
    useEffect(() => () => press.current?.stop(), []);

    const currentFocus = (): HTMLElement | null => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || active === document.body) return null;
      // Pressed again while open: focus is in the menu; it still goes back where it came from.
      return ctx.contentRef.current?.contains(active) ? ctx.returnTo.current : active;
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      press.current?.stop();
      focusBefore.current = currentFocus();
      const { pointerId, pointerType, button, clientX, clientY } = event;
      const current: Press = {
        id: pointerId,
        start: [clientX, clientY],
        armed: null,
        timer: undefined,
        stop: () => {},
      };
      if (pointerType === 'touch') {
        current.timer = setTimeout(() => {
          current.armed = current.start;
        }, LONG_PRESS);
      }
      const onMove = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointerId || current.armed) return;
        const [x, y] = current.start;
        if (Math.hypot(e.clientX - x, e.clientY - y) > LONG_PRESS_SLOP) {
          clearTimeout(current.timer);
          current.timer = undefined;
        }
      };
      // A cancelled press (the browser took the gesture over) is followed by no `pointerup`, so
      // there is no light dismiss to wait for.
      const onEnd = (e: globalThis.PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        current.stop();
        if (press.current === current) press.current = null;
        if (!current.armed) {
          // Chromium on Windows fires `contextmenu` after a right press ends; keep its focus note.
          if (button !== 2) focusBefore.current = null;
          return;
        }
        if (pointerType === 'touch') swallowClickUntil.current = performance.now() + 400;
        ctx.openAt(current.armed, focusBefore.current);
      };
      current.stop = () => {
        clearTimeout(current.timer);
        document.removeEventListener('pointermove', onMove, true);
        document.removeEventListener('pointerup', onEnd, true);
        document.removeEventListener('pointercancel', onEnd, true);
      };
      document.addEventListener('pointermove', onMove, true);
      document.addEventListener('pointerup', onEnd, true);
      document.addEventListener('pointercancel', onEnd, true);
      press.current = current;
    };

    const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      const at: Point = [event.clientX, event.clientY];
      const current = press.current;
      if (current) {
        clearTimeout(current.timer);
        current.armed = at;
        return;
      }
      // After the press (Chromium on Windows), or from assistive technology: open now.
      ctx.openAt(at, focusBefore.current ?? currentFocus());
      focusBefore.current = null;
    };

    // Not every browser turns these keys into `contextmenu`, so the menu handles them itself.
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const isMenuKey =
        event.key === 'ContextMenu' ||
        (event.key === 'F10' &&
          event.shiftKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.metaKey);
      if (!isMenuKey) return;
      event.preventDefault();
      const target = event.target as HTMLElement;
      const box = target.getBoundingClientRect();
      ctx.openAt([box.left, box.bottom], target);
    };

    const shared = {
      ...props,
      className: clsx('flg-context-menu-trigger', className),
      onPointerDown: composeEventHandlers(onPointerDown, handlePointerDown),
      onContextMenu: composeEventHandlers(onContextMenu, handleContextMenu),
      onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
      onClickCapture: composeEventHandlers(onClickCapture, (event: MouseEvent<HTMLDivElement>) => {
        if (performance.now() >= swallowClickUntil.current) return;
        swallowClickUntil.current = 0;
        event.preventDefault();
        event.stopPropagation();
      }),
    };
    return asChild ? <Slot ref={ref} {...shared} /> : <div ref={ref} {...shared} />;
  },
);

/** The menu panel. It opens at the point the trigger reports, and flips to stay on screen. */
export const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentProps>(
  function ContextMenuContent({ sideOffset = 2, onContextMenu, ...props }, ref) {
    const ctx = useContextMenu('ContextMenuContent');
    const { contentRef, point, returnTo } = ctx;
    const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref, contentRef]);
    return (
      <MenuPanel
        ref={mergedRef}
        {...props}
        open={ctx.open}
        report={ctx.report}
        contentId={ctx.contentId}
        reference={() => {
          const [x, y] = point.current;
          return { getBoundingClientRect: () => DOMRect.fromRect({ x, y, width: 0, height: 0 }) };
        }}
        restoreFocusTo={() => returnTo.current}
        focusOnOpen={FIRST}
        side="right"
        align="start"
        offset={sideOffset}
        // The ContextMenu key fires `contextmenu` after the menu opened, at the item it focused.
        onContextMenu={composeEventHandlers(onContextMenu, (event: MouseEvent<HTMLDivElement>) =>
          event.preventDefault(),
        )}
      />
    );
  },
);
```

`src/components/context-menu/index.ts`:

```ts
export { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './ContextMenu';
export type {
  ContextMenuContentProps,
  ContextMenuProps,
  ContextMenuTriggerProps,
} from './ContextMenu';
```

Ghi chú:
- **Mở lúc nhả** (phát hiện 1). `contextmenu` tới khi một lần nhấn trong vùng còn đang giữ thì chỉ "nạp" điểm mở. Menu mở trong `pointerup` của lần nhấn đó, lúc trình duyệt đã chạy xong light dismiss. `pointercancel` sau khi đã nạp thì mở ngay.
- **Mở lại khi đang mở.** Lần nhấn mới đã light-dismiss menu cũ, nhưng trình duyệt báo `toggle` một task sau. `openAt` vì vậy đóng state rồi mở lại ở task sau, thay vì coi menu vẫn đang mở.
- **Bàn phím** (phát hiện 2). `keydown` của Shift+F10 và phím ContextMenu mở menu dưới phần tử đang có focus. `onContextMenu` của panel chặn sự kiện Chromium phát trễ cho phím ContextMenu.

- [ ] **Step 4: CSS, export và kiểm tra gói**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index de0aa76..98368e5 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -34,6 +34,7 @@ const SHIPPED_CLASSES = [
   'flg-popover',
   'flg-popover-arrow',
   'flg-tooltip',
+  'flg-context-menu-trigger',
   'flg-menu',
   'flg-menu-item',
   'flg-menu-label',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 898e3c0..28deb65 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -19,6 +19,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/tooltip/Tooltip.tsx',
   'src/components/menu/Menu.tsx',
   'src/components/dropdown-menu/DropdownMenu.tsx',
+  'src/components/context-menu/ContextMenu.tsx',
 ];
 
 /**
diff --git a/src/index.test.ts b/src/index.test.ts
index e01f9e7..133a28f 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -14,6 +14,9 @@ describe('public API', () => {
       'CardHeader',
       'CardTitle',
       'Checkbox',
+      'ContextMenu',
+      'ContextMenuContent',
+      'ContextMenuTrigger',
       'Dialog',
       'DialogClose',
       'DialogContent',
diff --git a/src/index.ts b/src/index.ts
index 8e59d42..659c318 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -120,6 +120,12 @@ export type {
   MenuSubTriggerProps,
 } from './components/menu';
 export { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './components/dropdown-menu';
+export { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './components/context-menu';
+export type {
+  ContextMenuContentProps,
+  ContextMenuProps,
+  ContextMenuTriggerProps,
+} from './components/context-menu';
 export type {
   DropdownMenuContentProps,
   DropdownMenuProps,
diff --git a/src/styles/components/menu.css b/src/styles/components/menu.css
index 7ff30f1..3d3df7f 100644
--- a/src/styles/components/menu.css
+++ b/src/styles/components/menu.css
@@ -103,6 +103,10 @@
     margin: 4px 6px;
     background: var(--flg-control-border);
   }
+  /* A held touch opens the ContextMenu; iOS would show its own callout over it. */
+  .flg-context-menu-trigger {
+    -webkit-touch-callout: none;
+  }
   /* The submenu wrapper only groups a trigger with its panel for assistive technology. */
   .flg-menu-sub {
     display: contents;
```

- [ ] **Step 5: Docs**

`src/components/context-menu/ContextMenu.mdx`:

````mdx
import { Canvas, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './ContextMenu.stories';

<Meta of={Stories} />

# ContextMenu

```tsx
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, MenuItem } from 'fl-glass-ui';

<ContextMenu>
  <ContextMenuTrigger>
    <FileCard file={file} />
  </ContextMenuTrigger>
  <ContextMenuContent aria-label={file.name}>
    <MenuItem onSelect={open}>Open</MenuItem>
    <MenuItem variant="danger" onSelect={remove}>
      Delete
    </MenuItem>
  </ContextMenuContent>
</ContextMenu>;
```

<Canvas of={Stories.Default} />

`ContextMenuTrigger` is a `<div>` that marks the area; with `asChild` it is its child instead. The
menu takes the same parts as a DropdownMenu: see Menu parts on the DropdownMenu page.

## Opening

- **Right click:** at the pointer. Where the browser fires `contextmenu` while the button is still
  down (Safari, Firefox, and Chrome on macOS and Linux), the menu opens when the button comes up.
  Another right click in the area opens it again at the new point.
- **Keyboard:** Shift+F10 or the ContextMenu key on the focused element in the area. The menu opens
  just below that element.
- **Touch:** a touch held still for 500ms (it may drift up to 10px) opens the menu at the touch
  point when the finger lifts. The area has `-webkit-touch-callout: none`, so iOS does not show its
  own menu.

It opens on its first item. When it closes, focus goes back to the element that had it before.

`ContextMenu` takes only `onOpenChange`: it opens where the user asks, so there is no `open` prop.
`ContextMenuContent` opens to the right of the point, `sideOffset` (2px by default) away, and flips
when there is no room.

## Accessibility

- Give `ContextMenuContent` an `aria-label`: no trigger names it.
- A context menu must never be the only way to reach a command. Many users do not know it is
  there, and some cannot right-click or hold a touch. Offer the same commands in a toolbar, a
  DropdownMenu or a button too.

## Do and don't

- Do use it for shortcuts to commands that also live elsewhere.
- Don't put a ContextMenu around text people may want to select or copy: it replaces the browser's
  own menu there.
````

- [ ] **Step 6: Cập nhật spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 2e57f41..c2b3315 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -620,13 +620,18 @@ Như §3.6.
 
 - **`ContextMenuTrigger`:** một `<div>` (hoặc `asChild`) đánh dấu vùng có menu chuột phải.
 - **Mở bằng chuột phải:** sự kiện `contextmenu` bị `preventDefault`, menu mở tại vị trí con trỏ.
-- **Mở bằng bàn phím:** Shift+F10 hoặc phím ContextMenu cũng phát `contextmenu`, và menu mở tại phần tử đang có focus trong vùng.
+  - Nếu nút chuột vẫn đang nhấn khi `contextmenu` tới, menu mở lúc thả nút. Lý do: trình duyệt light-dismiss một popover đã hiện trong lúc con trỏ đang nhấn ngay khi con trỏ được thả, và WebKit với Firefox phát `contextmenu` trước khi thả nút. Chromium trên Windows phát nó sau khi thả, nên menu mở ngay (đo khi lập Plan B, cả ba engine).
+  - Bấm chuột phải lần nữa trong vùng khi menu đang mở: menu đóng rồi mở lại tại điểm mới.
+- **Mở bằng bàn phím:** Shift+F10 hoặc phím ContextMenu, và menu mở ngay dưới phần tử đang có focus trong vùng (góc dưới bên trái của nó).
+  - Lib tự xử lý hai phím này ở `keydown`, vì WebKit và Firefox không biến chúng thành `contextmenu`. Chromium phát `contextmenu` cho phím ContextMenu sau `keyup`, lúc focus đã ở item đầu; panel `preventDefault` sự kiện đó để trình duyệt không hiện menu của nó.
 - **Mở bằng chạm và giữ:**
-  - Giữ 500ms mà không di quá 10px thì mở tại điểm chạm.
+  - Giữ 500ms mà không di quá 10px thì menu mở tại điểm chạm, lúc nhấc tay (cùng lý do light dismiss như chuột phải).
   - Nếu trình duyệt tự phát `contextmenu` (Android), menu mở theo sự kiện đó và bộ đếm giờ bị huỷ.
+  - Nếu trình duyệt huỷ lần chạm (`pointercancel`) sau khi đã đủ 500ms, menu mở ngay, vì sẽ không có lần nhấc tay nào để chờ.
+  - Cú `click` đi sau lần nhấc tay đó không tới phần tử dưới ngón tay.
   - Vùng trigger có `-webkit-touch-callout: none` để iOS không hiện menu riêng của nó.
-- **Focus:** khi mở, focus vào item đầu. Khi đóng, focus về phần tử đã có focus trước đó, nếu nó còn trong DOM.
-- **`ContextMenuContent`:** giống `DropdownMenuContent` nhưng không có `side`/`align`. Vị trí tham chiếu là một điểm.
+- **Focus:** khi mở, focus vào item đầu. Khi đóng, focus về phần tử đã có focus trước đó, nếu nó còn trong DOM. Với chuột và chạm, đó là phần tử có focus trước lần nhấn (lần nhấn có thể đã đưa focus về `<body>`). Nếu trước đó không có phần tử nào có focus, focus ở yên chỗ trình duyệt để nó.
+- **`ContextMenuContent`:** giống `DropdownMenuContent` nhưng không có `side`/`align`. Vị trí tham chiếu là một điểm: menu mở về phía `right-start` của điểm, cách `sideOffset` (mặc định 2), và tự lật khi thiếu chỗ. Nó không có tên từ trigger, nên người dùng nên đặt `aria-label`.
 - **Docs ghi rõ:** menu chuột phải không được là cách duy nhất để thực hiện một thao tác.
 
 **`Select`**
```

- [ ] **Step 7: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/context-menu src/components/dropdown-menu
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 486 test PASS, 2 skip.
- Story: 42 test PASS (12 ContextMenu, 30 DropdownMenu).
- `size:record` ghi JS khoảng 20.5 kB. `check:package` PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/context-menu src/styles/components/menu.css src/index.ts src/index.test.ts scripts/check-use-client.ts scripts/check-dist-css.ts .size-limit.json docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
git commit -m "feat: add ContextMenu" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 7: Tooltip nhường Esc cho overlay đang có focus

Lỗi từ Plan A, lộ ra khi fixture mở menu trong lúc con trỏ còn nằm trên nút có tooltip (phát hiện 8).

**Files:**
- Modify: `src/components/tooltip/Tooltip.tsx`, `.size-limit.json`
- Test: `src/components/tooltip/Tooltip.stories.tsx`

**Interfaces:**
- Consumes (Task 5): `DropdownMenu`, `MenuItem` (chỉ trong story).
- Produces: không có API mới.

- [ ] **Step 1: Story cho tình huống này (test fail)**

```diff
diff --git a/src/components/tooltip/Tooltip.stories.tsx b/src/components/tooltip/Tooltip.stories.tsx
index bd23060..9ff5637 100644
--- a/src/components/tooltip/Tooltip.stories.tsx
+++ b/src/components/tooltip/Tooltip.stories.tsx
@@ -8,7 +8,13 @@ import { CloseIcon, GearIcon, SearchIcon } from '../../../.storybook/icons';
 import { realUserEvent, settled } from '../../../.storybook/real-input';
 import { Button } from '../button/Button';
 import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '../dialog/Dialog';
+import {
+  DropdownMenu,
+  DropdownMenuContent,
+  DropdownMenuTrigger,
+} from '../dropdown-menu/DropdownMenu';
 import { IconButton } from '../icon-button/IconButton';
+import { MenuItem } from '../menu/Menu';
 import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover';
 import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
 
@@ -409,3 +415,36 @@ export const UnderAModal: Story = {
     await waitFor(() => expect(dialog.open).toBe(false));
   },
 };
+
+export const WhileAMenuHasFocus: Story = {
+  tags: ['no-visual'],
+  parameters: { stage: 'viewport' },
+  render: (args) => (
+    <div style={{ display: 'flex', gap: 8 }}>
+      <Tooltip {...args}>{settings}</Tooltip>
+      <DropdownMenu>
+        <DropdownMenuTrigger variant="secondary">Actions</DropdownMenuTrigger>
+        <DropdownMenuContent>
+          <MenuItem>Rename</MenuItem>
+        </DropdownMenuContent>
+      </DropdownMenu>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const tip = canvas.getByRole('tooltip', { hidden: true });
+    await real.hover(canvas.getByRole('button', { name: 'Settings' }));
+    await waitFor(() => expect(isOpen(tip)).toBe(true), { timeout: 1000 });
+    // The pointer rests on the trigger while the keyboard works in a menu: Esc closes the menu.
+    canvas.getByRole('button', { name: 'Actions' }).focus();
+    await real.keyboard('{Enter}');
+    const menu = canvas.getByRole('menu', { name: 'Actions' });
+    await waitFor(() => expect(menu.matches(':popover-open')).toBe(true));
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(menu.matches(':popover-open')).toBe(false));
+    await expect(isOpen(tip)).toBe(true);
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(isOpen(tip)).toBe(false));
+  },
+};
```

- [ ] **Step 2: Chạy story để xác nhận fail**

Run: `pnpm gen:theme && pnpm vitest run --project storybook-light src/components/tooltip --browser.name=chromium -t "Menu Has Focus"`
Expected: 1 test FAIL: sau Esc đầu tiên, menu vẫn mở.

- [ ] **Step 3: Sửa Tooltip**

```diff
diff --git a/src/components/tooltip/Tooltip.tsx b/src/components/tooltip/Tooltip.tsx
index e1673ca..f2efeeb 100644
--- a/src/components/tooltip/Tooltip.tsx
+++ b/src/components/tooltip/Tooltip.tsx
@@ -53,6 +53,16 @@ function isCoveredByModal(trigger: HTMLElement | null): boolean {
   return top !== undefined && trigger !== null && !top.dialog.contains(trigger);
 }
 
+/**
+ * Focus is in an open popover or dialog that the trigger is not part of, such as a menu opened
+ * while the pointer rests on the trigger. Esc belongs to that overlay. (A closed popover holds no
+ * focus, so any popover around the focused element is open.)
+ */
+function isFocusInAnotherOverlay(trigger: HTMLElement | null): boolean {
+  const overlay = document.activeElement?.closest('[popover], dialog[open]');
+  return overlay != null && trigger !== null && !overlay.contains(trigger);
+}
+
 interface TooltipContextValue {
   open: boolean;
   contentId: string;
@@ -167,7 +177,10 @@ export function Tooltip({
   useEffect(() => {
     if (!isOpen) return;
     const onKeyDown = (event: globalThis.KeyboardEvent) => {
-      if (event.key !== 'Escape' || isCoveredByModal(triggerRef.current)) return;
+      const trigger = triggerRef.current;
+      if (event.key !== 'Escape' || isCoveredByModal(trigger) || isFocusInAnotherOverlay(trigger)) {
+        return;
+      }
       event.preventDefault();
       closeNow();
     };
```

Điều kiện "overlay khác không chứa trigger" giữ hành vi của Plan A khi tooltip nằm trong Dialog: focus ở trigger bên trong dialog, nên Esc đầu tiên vẫn chỉ đóng tooltip (story `InsideADialog`). `[popover]` được dùng thay `:popover-open`, vì một popover đã đóng thì không giữ focus được.

- [ ] **Step 4: Chạy toàn bộ story của Tooltip**

Run: `pnpm vitest run --project storybook-light --project storybook-dark src/components/tooltip && pnpm lint && pnpm typecheck && pnpm build && pnpm size:record && pnpm check:package`
Expected: 66 test PASS (11 story × 3 trình duyệt × 2 theme). `check:package` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/tooltip .size-limit.json
git commit -m "fix: let a tooltip leave Esc to the overlay that has focus" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 8: Menu trong hai fixture

**Files:**
- Create: `fixtures/vite-app/src/Menus.tsx`, `fixtures/next-app/app/menus.tsx`
- Modify: `fixtures/vite-app/src/App.tsx`, `fixtures/next-app/app/page.tsx`, `scripts/test-fixtures.mjs`

**Interfaces:**
- Consumes: mọi export của Task 5 và 6, từ bản build đã pack.
- Produces: không có API mới.

- [ ] **Step 1: Thêm kiểm tra vào script fixture (test fail)**

```diff
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index f35987d..7bc2ae0 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -71,6 +71,8 @@ const COMPONENTS = [
   'dialog.flg-dialog',
   '.flg-popover',
   '.flg-tooltip',
+  '.flg-menu',
+  '.flg-context-menu-trigger',
 ];
 
 function run(command, args, cwd) {
@@ -191,6 +193,7 @@ async function inspect(page, url, problems) {
   if (!(await yearly.isChecked())) problems.push('"Yearly" did not get selected');
 
   await checkOverlays(page, problems);
+  await checkMenus(page, problems);
 }
 
 const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement);
@@ -230,6 +233,39 @@ async function checkOverlays(page, problems) {
   await page.getByRole('tooltip', { name: 'Opens the help center' }).waitFor();
 }
 
+/** Phase 2, plan B: a DropdownMenu with a submenu, and a ContextMenu, open and move focus. */
+async function checkMenus(page, problems) {
+  const actions = page.getByRole('button', { name: 'Actions' });
+  await actions.focus();
+  await page.keyboard.press('Enter');
+  const menu = page.getByRole('menu', { name: 'Actions' });
+  await menu.waitFor();
+  if (!(await hasFocus(page.getByRole('menuitem', { name: 'Rename F2' })))) {
+    problems.push('focus did not move to the first item of the DropdownMenu');
+  }
+  await page.keyboard.press('ArrowDown');
+  await page.keyboard.press('ArrowRight');
+  const sub = page.getByRole('menu', { name: 'Move to' });
+  await sub.waitFor();
+  if (!(await hasFocus(sub.getByRole('menuitem', { name: 'Design' })))) {
+    problems.push('focus did not move into the submenu');
+  }
+  await page.keyboard.press('Escape');
+  await sub.waitFor({ state: 'hidden' });
+  await page.keyboard.press('Escape');
+  await menu.waitFor({ state: 'hidden' });
+  if (!(await hasFocus(actions))) problems.push('focus did not return to the DropdownMenu trigger');
+
+  await page.getByText('Right-click report.pdf').click({ button: 'right' });
+  const context = page.getByRole('menu', { name: 'report.pdf' });
+  await context.waitFor();
+  if (!(await hasFocus(context.getByRole('menuitem', { name: 'Open' })))) {
+    problems.push('focus did not move to the first item of the ContextMenu');
+  }
+  await page.keyboard.press('Escape');
+  await context.waitFor({ state: 'hidden' });
+}
+
 async function testApp(name, browser) {
   const app = APPS[name];
   const cwd = join(FIXTURES, app.dir);
```

Run: `pnpm build && pnpm test:fixtures`
Expected: FAIL ở cả bốn lần chạy, vì trang chưa có menu.

- [ ] **Step 2: Render menu trong hai app**

`fixtures/vite-app/src/Menus.tsx`:

```tsx
// The menus of phase 2, plan B. The Next.js fixture renders the same markup from a Server Component.
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  MenuCheckboxItem,
  MenuItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from 'fl-glass-ui';

export function Menus() {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <DropdownMenu>
        <DropdownMenuTrigger variant="secondary">Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem>
            Rename <MenuShortcut>F2</MenuShortcut>
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger>Move to</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>Design</MenuItem>
              <MenuItem>Archive</MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuSeparator />
          <MenuCheckboxItem defaultChecked>Show grid</MenuCheckboxItem>
          <MenuItem variant="danger">Delete</MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu>
        <ContextMenuTrigger
          style={{ padding: '12px 16px', border: '1px dashed currentColor', borderRadius: 8 }}
        >
          Right-click report.pdf
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="report.pdf">
          <MenuItem>Open</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </section>
  );
}
```

`fixtures/next-app/app/menus.tsx` (Server Component, nên item không có `onSelect`):

```tsx
// A Server Component: the menus of phase 2, plan B, composed from client components the way an
// App Router page would. The Vite fixture renders the same markup on the client.
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  MenuCheckboxItem,
  MenuItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from 'fl-glass-ui';

export function Menus() {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <DropdownMenu>
        <DropdownMenuTrigger variant="secondary">Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <MenuItem>
            Rename <MenuShortcut>F2</MenuShortcut>
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger>Move to</MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>Design</MenuItem>
              <MenuItem>Archive</MenuItem>
            </MenuSubContent>
          </MenuSub>
          <MenuSeparator />
          <MenuCheckboxItem defaultChecked>Show grid</MenuCheckboxItem>
          <MenuItem variant="danger">Delete</MenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu>
        <ContextMenuTrigger
          style={{ padding: '12px 16px', border: '1px dashed currentColor', borderRadius: 8 }}
        >
          Right-click report.pdf
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="report.pdf">
          <MenuItem>Open</MenuItem>
          <MenuItem>Duplicate</MenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </section>
  );
}
```

```diff
diff --git a/fixtures/next-app/app/page.tsx b/fixtures/next-app/app/page.tsx
index 77cf079..9a13e1a 100644
--- a/fixtures/next-app/app/page.tsx
+++ b/fixtures/next-app/app/page.tsx
@@ -23,6 +23,7 @@ import {
   Textarea,
 } from 'fl-glass-ui';
 import { ClientControls } from './client-controls';
+import { Menus } from './menus';
 import { Overlays } from './overlays';
 
 export default function Page() {
@@ -69,6 +70,7 @@ export default function Page() {
       </Card>
       <ClientControls />
       <Overlays />
+      <Menus />
     </main>
   );
 }
diff --git a/fixtures/vite-app/src/App.tsx b/fixtures/vite-app/src/App.tsx
index ea6b2cd..91e6bb4 100644
--- a/fixtures/vite-app/src/App.tsx
+++ b/fixtures/vite-app/src/App.tsx
@@ -22,6 +22,7 @@ import {
   Textarea,
 } from 'fl-glass-ui';
 import { useEffect, useState } from 'react';
+import { Menus } from './Menus';
 import { Overlays } from './Overlays';
 
 const CHANNELS = ['email', 'sms'];
@@ -91,6 +92,7 @@ export function App() {
         </Field>
       </section>
       <Overlays />
+      <Menus />
     </main>
   );
 }
```

- [ ] **Step 3: Chạy fixture**

Run: `pnpm build && pnpm test:fixtures`
Expected: PASS ở Vite và Next.js, production lẫn development.

- [ ] **Step 4: Commit**

```bash
git add fixtures scripts/test-fixtures.mjs
git commit -m "test: open the menus in both fixtures" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

## Kiểm tra cuối

- [ ] **Chạy cả bộ trên nhánh**

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm test:stories
pnpm check:contrast
pnpm build && pnpm check:package
pnpm test:fixtures
```

Expected: 486 unit test PASS (2 skip); 600 story test PASS; tương phản PASS; gói PASS; hai fixture PASS.

- [ ] **Sau khi đẩy nhánh:** chủ dự án chạy workflow "Update visual baselines" cho nhánh, để tạo 8 ảnh của `DropdownMenu/Open`. Sau commit của bot, cần một lần push mới, hoặc đóng rồi mở lại PR, thì job visual mới chạy trên commit có ảnh.
- [ ] **Mô tả PR** nêu dòng 8–10 mới của §4.9 (spec §4.4: "danh sách điểm mới được nêu trong mô tả PR").
