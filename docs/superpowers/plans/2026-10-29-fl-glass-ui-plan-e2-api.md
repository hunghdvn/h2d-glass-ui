# fl-glass-ui: Plan E2, API trước 0.2.0, docs chung và changeset (giai đoạn 2, phần 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng giai đoạn 2 để phát hành `0.2.0`: sửa các mục API mà Plan B, C và D hoãn "trước `0.2.0`", làm tab list tràn cuộn được, cho `Pagination` dùng `Link` của router, cho `Toaster` nhận prop HTML, rồi viết docs chung, changeset và ghi lại ngưỡng kích thước.

**Architecture:**
- **Không còn ghi ref trong lúc render.** Mọi `ref.current = …` chạy trong render được chuyển vào layout effect, để một render bị React bỏ không để lại giá trị của render chưa commit (Task 1).
- **Phần được trỏ tới bằng id không nhận `id`.** `TabsTrigger`, `TabsContent` và `MenuSubTrigger` bỏ `id` khỏi kiểu, và id do lib sinh đứng sau `{...props}` (Task 2).
- **Tabs** (Task 3, 4).
  - Tab dừng của Tab key và `onPointerDown` của người dùng được sửa (Task 3).
  - Hàng tab không đủ chỗ thì cuộn. `TabsList` đo và đặt `data-overflow`, `data-at-start`, `data-at-end`; mọi CSS tràn gắn vào `data-overflow`, nên tab vừa chỗ không đổi một pixel (Task 4).
- **Select** (Task 5): giá trị không khớp item được giữ ở chỗ cũ khi chọn nhiều; cảnh báo rõ hơn; list chỉ cuộn theo phím.
- **Pagination** (Task 6): `renderLink` cho mọi link có `href`, qua một hàm dựng duy nhất.
- **Toaster** (Task 7): nhận prop HTML của `<section>`, cùng các mục Plan E1 để lại.
- **Nhỏ** (Task 8, 9): cảnh báo tên của `ContextMenuContent`, key của Breadcrumb, thứ tự export; vòng focus của Accordion.
- **Docs, fixture, changeset, ngưỡng kích thước** (Task 10).

**Tech Stack:** Như Plan E1: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`. Plan này làm mọi dòng gắn "Plan E2" hoặc "Claude chốt":
- §2: Plan E gồm Toast, docs chung, fixtures, changeset `0.2.0`; E2 là phần các mục API trước `0.2.0`, docs chung và changeset.
- §4.3 Tabs: hàng tab ngang không đủ chỗ (Task 4).
- §5: cảnh báo dev (Task 1, 5, 6, 8).
- §6.1: `id` do lib sinh (Task 2).
- Task 1 (không ghi ref trong render) không có dòng spec riêng: chủ dự án yêu cầu nó ở review PR #8.
- §6.3 Menu: `MenuSubTrigger` không nhận `id` (Task 2).
- §6.3 Select: giá trị không khớp, listbox chỉ cuộn theo phím (Task 5).
- §6.3 Tabs: không nhận `id`, tab dừng, `onPointerDown`, cuộn (Task 2, 3, 4).
- §6.3 Accordion: vòng focus (Task 9).
- §6.3 Pagination: `renderLink` (Task 6).
- §6.3 Toaster: prop HTML, các mục E1 để lại (Task 7).
- §8: docs và phát hành (Task 10).

Chủ dự án đã chọn cả tám câu trả lời ngày 2026-10-29: 1B 2A 3B 4A 5A 6A 7A 8A. Tab list tràn (câu chọn qua ảnh) là phương án cuộn với thanh mảnh và mờ dần ở mép.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/plan-e2-tasks`, mỗi task một commit, và mỗi test viết trước đã được chạy trên commit cha của task.
- Task 2, 7 và phần đầu của Task 8 do model miễn phí `reflection/beam-free` viết qua opencode, Claude kiểm tra lại. Các task còn lại do subagent của Claude viết.
- Mọi khối patch trong plan được lấy thẳng từ các commit đó.

Kết quả ở commit cuối:

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 912 test PASS, 3 skip (trước plan, ở main: 811 PASS, 3 skip) |
| `pnpm test:stories` | 948 test PASS (main: 924) |
| `pnpm check:contrast` | PASS |
| `pnpm check:package` | PASS với ngưỡng mới (JS 30784 B, CSS 7126 B; trước: 29195 B, 6793 B) |
| `pnpm test:fixtures` | Cả hai fixture PASS, ở production lẫn development |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | PASS |

Check "không tải lại trang" của fixture Next.js đã được thử bằng cách bỏ `renderLink` (thành `<a>` thường): nó fail với "a Pagination link click loaded the document again instead of the router".

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Có nhiều chỗ ghi ref trong render hơn brief nêu.** Task 1 liệt kê và sửa hết: `use-controllable-state` (`latest`, `wasControlled`), Accordion, Select (`latest`, `chooseRef`, `defaultRef`), `use-popover`, `use-floating`, ContextMenu, Toaster. `use-popover-trigger` đã ghi trong layout effect từ trước, nên chỉ thêm test.
   - Một layout effect của **component con** gọi setter của cha trong cùng một commit sẽ thấy giá trị của commit trước, vì effect của con chạy trước. Lib hiện không có chỗ nào làm vậy.
   - Test helper `tests/discarded-render.tsx` nằm ngoài `src/`, vì `check:use-client` đòi build output cho mọi file không phải test trong `src/`.
2. **Phần còn nhận `id` mà không làm hỏng link:** `Field`, `Select`, `RadioGroup`, `MenuLabel`, `ModalTitle`, `ModalDescription`; id của người dùng được dùng làm đích của link. Chỉ ba phần ở Task 2 cần đổi. `MenuCheckboxItem` và `MenuRadioItem` không có `asChild` và giữ nguyên.
3. **Kịch bản `onPointerDown` cần focus mà không có click xen giữa**, vì handler click cũng đặt lại cờ (Task 3).
4. **Task 4 gắn toàn bộ CSS tràn vào `data-overflow`**, không bật sẵn.
   - Thử bật sẵn thì tab vừa chỗ đổi pixel: gradient 1px khác viền ở 237 pixel, hộp cuộn cắt bóng của tab segmented và nửa dưới thanh underline, nền track segmented khác ở 13 pixel góc.
   - Hệ quả: trước khi hydrate, một hàng không vừa chỗ tràn ra ngoài container như trước E2, chưa cuộn. Các dòng spec được sửa cho khớp.
   - Hai bước đo dùng hai phép thử khác nhau (ngoài chế độ cuộn: mép con so với content box; trong chế độ cuộn: `scrollWidth > clientWidth`), để list không nhảy qua lại ở biên.
   - Báo cáo của `ResizeObserver` chờ một `requestAnimationFrame`, để tránh lỗi "loop".
   - Với segmented, hai spacer 1px bằng `::before`/`::after` thay cho margin âm, vì Firefox không tính margin âm vào `scrollWidth`.
5. **Glow 12px của theme mặc định bị cắt ở 6px khi đang cuộn** (còn khoảng 4% độ đặc). Vòng 3px và outline đều nguyên vẹn.
6. **Safari 17.4 chưa được thử**; chỉ có WebKit của Playwright. Các phép đo dựa vào việc mọi engine đã thử tính padding cuối vào `scrollWidth`.
7. **Container tự nở theo nội dung thì hàng tab không bao giờ tràn:** grid track có min `auto`, flex item thiếu `min-width: 0`. Lib không chặn được mà không làm hỏng segmented. Docs (Task 4) khuyên `min-width: 0` hoặc `minmax(0, 1fr)`.
8. **Story của Select phải hover ở `position: { x: 12, y: 2 }`**, vì `hover` của Playwright tự cuộn đích vào view, che mất lỗi (Task 5).
9. **Select chọn nhiều:** giá trị không khớp giữ đúng chỉ số của nó; các ô của giá trị khớp được điền lại theo thứ tự trong list (Task 5).
10. **Task 7 chạy hai vòng.** Vòng 1 bỏ qua test mới; vòng 2 thêm tám test và kiểm tra fail trước. Listener ném lỗi được ném lại bằng `setTimeout`, để store không nuốt lỗi mà các listener khác vẫn chạy. Hotkey không phân biệt hoa thường.
11. **Task 9 dùng padding cộng margin âm trên `::details-content`**, không dùng `overflow-clip-margin`, vì WebKit của Playwright không hỗ trợ. Cặp `pointer-events` ngăn 4px chồng lấn nhận click của trigger. Glow 12px vẫn bị cắt trên 4px. Chỉ `Accordion/Default` có ảnh chuẩn; nó giữ nguyên từng byte.
12. **Task 10: huỷ typeahead của menu bằng `event.preventDefault()` trong `onKeyDownCapture`**, không phải `stopPropagation`, vì `MenuPanel` dùng `composeEventHandlers`. Tên file changeset giữ `phase-2-overlays.md`, vì spec và Plan A nhắc đến tên đó.

**Phạm vi:**
- **Không làm ở plan này:**
  - Kiểm tra Safari/VoiceOver còn nợ từ PR #7, và Safari 17.4 cho tab list tràn.
  - `toast.promise`, toast xếp chồng, vuốt để đóng (ngoài phạm vi giai đoạn 2, spec §2).
  - RTL cho tab list tràn.
- **Ảnh chuẩn visual:**
  - Task 4 thêm story có ảnh `Tabs/Overflow`, tức 8 ảnh mới (2 theme × 4 chế độ). Mọi story mới khác gắn `no-visual`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-overflow`, `data-at-start`, `data-at-end`).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` nằm trong `src/styles/preferences.css`.
- **Mockup lock.** Plan này không đổi giá trị token nào trong `src/styles/theme/values.ts`. Khi tab vừa chỗ hoặc Accordion không đổi, ảnh phải giống từng byte ảnh trước plan.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`.
- **Changeset:** khác E1, plan này **có** đổi changeset `.changeset/phase-2-overlays.md` (Task 10), và vẫn là bump `minor`.
- **Ngưỡng `size-limit`:**
  - Task 1–9 chạy `pnpm build && pnpm check:package` với ngưỡng cũ (JS 29195 B, CSS 6793 B); lần chạy thử cho thấy ngưỡng đó còn đủ.
  - Chỉ Task 10 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở draft: JS 30784 B, CSS 7126 B.
- **Test helper `tests/discarded-render.tsx`** nằm ngoài `src/`, vì `check:use-client` đòi build output cho mọi file không phải test trong `src/`.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Fixture** chạy ở cổng 5173 theo script. Nếu cổng 5173 đang bận, sao script `scripts/test-fixtures.mjs` ra một file tạm, thay `5173` bằng `5174`, chạy file đó bằng `node` sau `pnpm build`, rồi xoá file tạm. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch (test rồi code); Task 10 chỉ có khối code. Áp theo đúng thứ tự trong plan.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý nhưng không nêu thành test. Mỗi dòng có test ở task tương ứng:

1. **Tab list trong một flex hoặc grid item thiếu `min-width: 0`.** Container nở theo nội dung nên hàng không bao giờ tràn, và lib không chặn được điều đó. Không có test cho trường hợp lỗi này; Task 4 ghi lời khuyên vào `Tabs.mdx`, và story `Tabs/Overflow` đặt tab list trong cột `minmax(0, 1fr)` để cho thấy cách đúng.
2. **Select chọn nhiều có `value` chứa giá trị mà item chưa tải.** Giá trị đó được giữ ở chỗ cũ, không mất khi người dùng bật hoặc tắt một item khác. Test ở Task 5: `Select.test.tsx`, nhóm `a multiple Select whose value has no item`, các test `keeps the value where it was when another option is turned on`, `... turned off` và `keeps the matched values in list order, and it in its place`.
3. **Pagination trong app Next.js dùng `Link` của `next/link` qua `renderLink`.** Bấm trang không tải lại tài liệu. Test ở Task 6: `Pagination.test.tsx`, nhóm `renderLink`, và kịch bản của fixture Next.js (giá trị đặt trên `window` còn nguyên sau khi bấm).
4. **Người dùng đưa `aria-label`, `role`, `popover` hoặc `tabIndex` cho `Toaster`.** Lib giữ giá trị của nó, nên vùng toast vẫn có tên và vai trò đúng. Test ở Task 7: `Toaster.test.tsx`, test `ignores aria-label, role, popover and tabIndex given by the user`.
5. **`value` của Tabs (có điều khiển) đổi từ bên ngoài trong lúc tab đó đang ngoài tầm nhìn.** Hàng cuộn tới tab, trang không cuộn. Test ở Task 4: `Tabs.test.tsx`, test `scrolls the row, and not the page, to the selected tab`, và story `Tabs/OverflowControlled`.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `tests/discarded-render.tsx` | Helper render bị bỏ cho test (Task 1) |
| `src/internal/use-controllable-state.ts`, `use-popover.ts`, `use-floating.ts` (và test), `src/components/accordion/Accordion.tsx`, `select/Select.tsx`, `context-menu/ContextMenu.tsx`, `toast/Toaster.tsx` | Ghi ref trong layout effect (Task 1) |
| `src/components/tabs/Tabs.tsx`, `src/components/menu/Menu.tsx` (và test, test-d) | Kiểu không có `id`; id sinh đứng sau spread (Task 2) |
| `src/components/tabs/Tabs.tsx`, `Tabs.mdx` | Tab dừng, `onPointerDown` (Task 3); tràn và cuộn (Task 4) |
| `src/styles/components/tabs.css`, `src/styles/preferences.css` | CSS tràn, mờ dần, forced colors (Task 4) |
| `src/components/select/Select.tsx`, `select-rows.ts`, `Select.mdx` | Giá trị không khớp, cảnh báo, cuộn theo phím (Task 5) |
| `src/components/pagination/Pagination.tsx`, `Pagination.mdx`, `fixtures/next-app/app/pages.tsx`, `scripts/test-fixtures.mjs` | `renderLink` và fixture Next.js (Task 6) |
| `src/components/toast/Toaster.tsx`, `store.ts`, `toast.ts`, `Toast.mdx`, `src/docs/ExceptionTable.test.tsx` | Prop HTML và các mục E1 để lại (Task 7) |
| `src/components/breadcrumb/Breadcrumb.tsx`, `context-menu/ContextMenu.tsx`, `src/index.ts` | Key, cảnh báo tên, thứ tự export (Task 8) |
| `src/styles/components/accordion.css`, `Accordion.stories.tsx` | Vòng focus (Task 9) |
| `src/docs/GettingStarted.mdx`, `Accessibility.mdx`, hai trang MDX của menu, `fixtures/vite-app/src/Overlays.tsx`, `.changeset/phase-2-overlays.md`, `.size-limit.json` | Docs chung, changeset, ngưỡng (Task 10) |
| Spec giai đoạn 2 | Cập nhật theo phát hiện, trong Task 4 và Task 7 |

---

### Task 1: Không ghi ref trong lúc render

Chủ dự án yêu cầu ở review PR #8: không ghi ref trong render (spec §6.1). Một render bị React bỏ (StrictMode lần hai, render treo hoặc ném lỗi, transition bị huỷ) có thể để ref giữ props của một render chưa bao giờ commit. Task này chuyển mọi chỗ ghi vào layout effect (`useIsoLayoutEffect`), không đổi hành vi nào khác.

Mọi event handler và callback `setTimeout` chạy sau commit, nên layout effect đã chạy trước chúng. Các effect cùng component đọc ref được khai báo sau effect ghi nó, vì React chạy effect cùng component theo thứ tự.

**Files:**
- Create: `tests/discarded-render.tsx`
- Modify: `src/internal/use-controllable-state.ts`, `src/internal/use-popover.ts`, `src/internal/use-floating.ts`, `src/components/accordion/Accordion.tsx`, `src/components/select/Select.tsx`, `src/components/context-menu/ContextMenu.tsx`, `src/components/toast/Toaster.tsx`
- Test: các file `.test.tsx` cùng thư mục của chúng, và `src/internal/use-popover-trigger.test.tsx` (chỉ test, không đổi code)

**Interfaces:**
- Consumes: `useIsoLayoutEffect` (`src/internal/use-iso-layout-effect.ts`).
- Produces: `renderDiscardable(ui)` trong `tests/discarded-render.tsx`: nhận `ui(discarded: boolean)`, trả về kết quả của `render` kèm `discard()`. `discard()` render `ui(true)` trong một `startTransition` mà đứa con cuối ném một promise không bao giờ xong, trong một `Suspense` đã hiện, nên React render rồi không commit. Các test ở Task sau không dùng; chỉ Task 1.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/accordion/Accordion.test.tsx b/src/components/accordion/Accordion.test.tsx
index ca7557c..739ff02 100644
--- a/src/components/accordion/Accordion.test.tsx
+++ b/src/components/accordion/Accordion.test.tsx
@@ -4,6 +4,7 @@ import type { ReactNode } from 'react';
 import { hydrateRoot } from 'react-dom/client';
 import { renderToString } from 'react-dom/server';
 import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
+import { renderDiscardable } from '../../../tests/discarded-render';
 import { resetDevWarnings } from '../../internal/warn';
 import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
 import type { AccordionProps } from './Accordion';
@@ -382,4 +383,16 @@ describe('Accordion', () => {
       expect([...next].sort()).toEqual(['a', 'b', 'c']);
     });
   });
+
+  it('asks for the change from the value of the last commit, not of a render React threw away', () => {
+    const onValueChange = vi.fn();
+    const view = renderDiscardable((discarded) => (
+      <Faq value={discarded ? 'plans' : 'trial'} onValueChange={onValueChange} />
+    ));
+    view.discard();
+    // On screen 'trial' is open, so the click closes it. Judged by the discarded 'plans', it would
+    // have opened it, and reported 'trial' again.
+    toggle('Is there a free trial?');
+    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(null);
+  });
 });
diff --git a/src/components/context-menu/ContextMenu.test.tsx b/src/components/context-menu/ContextMenu.test.tsx
new file mode 100644
index 0000000..f75f25f
--- /dev/null
+++ b/src/components/context-menu/ContextMenu.test.tsx
@@ -0,0 +1,37 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
+import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './ContextMenu';
+
+// jsdom has no Popover API. This stand-in is enough for the menu to open and close.
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
+describe('ContextMenu', () => {
+  // A characterization test: `openAt` reads whether the menu is open from a ref that is written
+  // after each commit, and it behaved the same when the ref was written during render.
+  it('closes, and opens afresh a task later, when asked again at a new place while open', async () => {
+    const onOpenChange = vi.fn();
+    render(
+      <ContextMenu onOpenChange={onOpenChange}>
+        <ContextMenuTrigger>Area</ContextMenuTrigger>
+        <ContextMenuContent aria-label="Actions" />
+      </ContextMenu>,
+    );
+    const area = screen.getByText('Area');
+    fireEvent.contextMenu(area, { clientX: 10, clientY: 20 });
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
+    onOpenChange.mockClear();
+    fireEvent.contextMenu(area, { clientX: 40, clientY: 50 });
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+    onOpenChange.mockClear();
+    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
+  });
+});
diff --git a/src/components/select/Select.test.tsx b/src/components/select/Select.test.tsx
index a9fb8d4..60c5819 100644
--- a/src/components/select/Select.test.tsx
+++ b/src/components/select/Select.test.tsx
@@ -2,6 +2,7 @@ import { act, fireEvent, render, screen } from '@testing-library/react';
 import { renderToString } from 'react-dom/server';
 import type { ReactNode } from 'react';
 import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
+import { renderDiscardable } from '../../../tests/discarded-render';
 import { resetDevWarnings } from '../../internal/warn';
 import { Field } from '../field/Field';
 import { Select, SelectGroup, SelectItem, SelectSeparator } from './Select';
@@ -403,4 +404,54 @@ describe('Select', () => {
     fireEvent.click(screen.getAllByRole('option', { name: 'B', hidden: true }).at(-1)!);
     expect(onValueChange).not.toHaveBeenCalled();
   });
+
+  describe('when React throws a render away', () => {
+    const fruit = (...values: string[]) =>
+      values.map((value) => (
+        <SelectItem key={value} value={value}>
+          {value}
+        </SelectItem>
+      ));
+
+    it('picks the option that a typed letter matches from the options of the last commit', () => {
+      const onValueChange = vi.fn();
+      const view = renderDiscardable((discarded) => (
+        <Select aria-label="Fruit" onValueChange={onValueChange}>
+          {fruit('apple', discarded ? 'blueberry' : 'banana')}
+        </Select>
+      ));
+      view.discard();
+      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'b' });
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('banana');
+    });
+
+    it('chooses with a typed letter while it is closed on screen, not open in the discarded render', () => {
+      const onValueChange = vi.fn();
+      const view = renderDiscardable((discarded) => (
+        <Select aria-label="Fruit" open={discarded} onValueChange={onValueChange}>
+          {fruit('apple', 'banana')}
+        </Select>
+      ));
+      view.discard();
+      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'b' });
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('banana');
+    });
+
+    it('resets to the default value of the last commit', async () => {
+      const view = renderDiscardable((discarded) => (
+        <form>
+          <Select aria-label="Fruit" name="fruit" defaultValue={discarded ? 'banana' : 'apple'}>
+            {fruit('apple', 'banana')}
+          </Select>
+        </form>
+      ));
+      view.discard();
+      const trigger = screen.getByRole('combobox');
+      fireEvent.keyDown(trigger, { key: 'b' });
+      expect(trigger.textContent).toBe('banana');
+      trigger.closest('form')!.reset();
+      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
+      expect(trigger.textContent).toBe('apple');
+    });
+  });
 });
diff --git a/src/components/toast/Toaster.test.tsx b/src/components/toast/Toaster.test.tsx
index 95a304a..9e9b2c4 100644
--- a/src/components/toast/Toaster.test.tsx
+++ b/src/components/toast/Toaster.test.tsx
@@ -1,5 +1,5 @@
 import { act, fireEvent, render, screen, within } from '@testing-library/react';
-import { useState } from 'react';
+import { StrictMode, useState } from 'react';
 import { renderToString } from 'react-dom/server';
 import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
 import { registerModal } from '../../internal/modal-stack';
@@ -344,6 +344,39 @@ describe('Toaster', () => {
     const hostItems = (host: HTMLElement) =>
       within(host).queryAllByRole('listitem', { hidden: true });
 
+    // A characterization test: it passed before the hold stopped being written during render, and
+    // must keep passing. StrictMode renders twice, so it runs the hold's render-time rule twice.
+    it('holds the same in StrictMode: what the old region showed comes along, the rest a task later', () => {
+      render(
+        <StrictMode>
+          <Toaster />
+        </StrictMode>,
+      );
+      act(() => {
+        vi.advanceTimersByTime(0);
+      });
+      show(() => toast({ title: 'Saved', duration: Infinity }));
+      act(() => {
+        vi.advanceTimersByTime(0);
+      });
+      const { dialog, host } = modal();
+      let unregister = () => {};
+      act(() => {
+        unregister = registerModal({ dialog, host });
+      });
+      expect(hostItems(host)).toHaveLength(1);
+      act(() => {
+        toast({ title: 'Later', duration: Infinity });
+      });
+      expect(hostItems(host)).toHaveLength(1);
+      act(() => {
+        vi.advanceTimersByTime(0);
+      });
+      expect(hostItems(host)).toHaveLength(2);
+      act(() => unregister());
+      dialog.remove();
+    });
+
     it('lets a toast shown as the region moves in a task after it', () => {
       mount();
       const { dialog, host } = modal();
diff --git a/src/internal/use-controllable-state.test.tsx b/src/internal/use-controllable-state.test.tsx
index f87ca4a..1f0581a 100644
--- a/src/internal/use-controllable-state.test.tsx
+++ b/src/internal/use-controllable-state.test.tsx
@@ -1,6 +1,7 @@
 import { act, render, renderHook } from '@testing-library/react';
 import { useState } from 'react';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { renderDiscardable } from '../../tests/discarded-render';
 import { useControllableState } from './use-controllable-state';
 import { resetDevWarnings } from './warn';
 
@@ -110,4 +111,49 @@ describe('useControllableState', () => {
         'lifetime of the component.',
     );
   });
+
+  describe('when React throws a render away', () => {
+    // The setter is called after the discarded render, so it works from the last commit.
+    function setup(discardedProps: { value?: string; onChange: (value: string) => void }) {
+      const committed = vi.fn();
+      let set: (next: string) => void = () => {};
+      function Probe({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
+        [, set] = useControllableState<string>({
+          value,
+          defaultValue: 'a',
+          onChange,
+          name: 'Test',
+        });
+        return null;
+      }
+      const view = renderDiscardable((discarded) =>
+        discarded ? <Probe {...discardedProps} /> : <Probe value="a" onChange={committed} />,
+      );
+      return { view, committed, set: (next: string) => act(() => set(next)) };
+    }
+
+    it('reports to the onChange of the last commit', () => {
+      const thrownAway = vi.fn();
+      const { view, committed, set } = setup({ value: 'a', onChange: thrownAway });
+      view.discard();
+      set('b');
+      expect(committed).toHaveBeenCalledExactlyOnceWith('b');
+      expect(thrownAway).not.toHaveBeenCalled();
+    });
+
+    it('compares a request with the value of the last commit', () => {
+      const { view, committed, set } = setup({ value: 'b', onChange: vi.fn() });
+      view.discard();
+      // The discarded render said 'b'; on screen it is still 'a', so a request for 'b' is a change.
+      set('b');
+      expect(committed).toHaveBeenCalledExactlyOnceWith('b');
+    });
+
+    it('does not warn about a switch that no commit made', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { view } = setup({ value: undefined, onChange: vi.fn() });
+      view.discard();
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
 });
diff --git a/src/internal/use-floating.test.tsx b/src/internal/use-floating.test.tsx
index b5c37d0..b9af77f 100644
--- a/src/internal/use-floating.test.tsx
+++ b/src/internal/use-floating.test.tsx
@@ -1,6 +1,7 @@
 import { act, render } from '@testing-library/react';
 import { useRef } from 'react';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { renderDiscardable } from '../../tests/discarded-render';
 import { useFloating } from './use-floating';
 
 function Harness({ open }: { open: boolean }) {
@@ -152,4 +153,17 @@ describe('useFloating sizing and onPlaced', () => {
     await flush();
     expect(onPlaced).toHaveBeenCalledTimes(2);
   });
+
+  it('calls the onPlaced of the last commit, not that of a render React threw away', async () => {
+    const committed = vi.fn();
+    const thrownAway = vi.fn();
+    const view = renderDiscardable((discarded) => (
+      <Listbox open onPlaced={discarded ? thrownAway : committed} />
+    ));
+    // The first placement is still on its way when the discarded render comes and goes.
+    view.discard();
+    await flush();
+    expect(committed).toHaveBeenCalledOnce();
+    expect(thrownAway).not.toHaveBeenCalled();
+  });
 });
diff --git a/src/internal/use-popover-trigger.test.tsx b/src/internal/use-popover-trigger.test.tsx
index 2bf1f6e..d14eb68 100644
--- a/src/internal/use-popover-trigger.test.tsx
+++ b/src/internal/use-popover-trigger.test.tsx
@@ -60,6 +60,40 @@ describe('usePopoverState', () => {
     expect(onOpenChange).not.toHaveBeenCalled();
   });
 
+  it('notes nothing for a request for the state of the last commit, even when the panel shows it', () => {
+    const { result } = renderHook(() =>
+      usePopoverState<HTMLDivElement>({
+        open: undefined,
+        defaultOpen: true,
+        onOpenChange: undefined,
+        name: 'Test',
+      }),
+    );
+    // Open, and the browser agrees: a request to open has nothing to note.
+    result.current.contentRef.current = fakePopover(true);
+    act(() => result.current.request(true));
+    expect(result.current.pendingToggle.current).toBeNull();
+  });
+
+  it('compares a request with the state after the commit that changed it', () => {
+    const { result, rerender } = renderHook(
+      ({ open }) =>
+        usePopoverState<HTMLDivElement>({
+          open,
+          defaultOpen: false,
+          onOpenChange: undefined,
+          name: 'Test',
+        }),
+      { initialProps: { open: false } },
+    );
+    result.current.contentRef.current = fakePopover(true);
+    rerender({ open: true });
+    // It is open now, and showing: asking to open is no change the browser made ahead of us. Had
+    // the note kept the state of the first render, this request would look like a new opening.
+    act(() => result.current.request(true));
+    expect(result.current.pendingToggle.current).toBeNull();
+  });
+
   it('notes nothing for a change the browser has not made yet', () => {
     const { result } = renderHook(() =>
       usePopoverState<HTMLDivElement>({
@@ -100,6 +134,22 @@ describe('useTriggerPress', () => {
     expect(toggle).toHaveBeenCalledWith(false, false);
   });
 
+  it('goes by the state now for a code click, also when it was closed at an earlier press', () => {
+    const toggle = vi.fn();
+    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
+      initialProps: { open: false },
+    });
+    // A press that never became a click leaves a note from when it was closed; it opened since.
+    result.current.onPointerDown();
+    rerender({ open: true });
+    result.current.onClick({ detail: 0 });
+    expect(toggle).toHaveBeenCalledWith(true, false);
+    // The note is spent: a click without a detail at all goes by the state as well.
+    toggle.mockClear();
+    result.current.onClick(undefined);
+    expect(toggle).toHaveBeenCalledWith(true, false);
+  });
+
   it('forgets a press that was cancelled', () => {
     const toggle = vi.fn();
     const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
diff --git a/src/internal/use-popover.test.tsx b/src/internal/use-popover.test.tsx
index 5a37fc6..f53a50b 100644
--- a/src/internal/use-popover.test.tsx
+++ b/src/internal/use-popover.test.tsx
@@ -1,6 +1,7 @@
 import { act, render } from '@testing-library/react';
 import { useRef } from 'react';
 import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
+import { renderDiscardable } from '../../tests/discarded-render';
 import { usePopover } from './use-popover';
 import type { UsePopoverOptions } from './use-popover';
 import { resetDevWarnings } from './warn';
@@ -301,4 +302,44 @@ describe('usePopover', () => {
     expect(warn).toHaveBeenCalledOnce();
     expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
   });
+
+  describe('when React throws a render away', () => {
+    const toggle = (el: Element, newState: 'open' | 'closed') =>
+      act(() => {
+        el.dispatchEvent(Object.assign(new Event('toggle'), { newState }));
+      });
+
+    it('reports a toggle against the open state and the onOpenChange of the last commit', () => {
+      const committed = vi.fn();
+      const thrownAway = vi.fn();
+      const view = renderDiscardable((discarded) =>
+        discarded ? (
+          <Harness open onOpenChange={thrownAway} />
+        ) : (
+          <Harness open={false} onOpenChange={committed} />
+        ),
+      );
+      view.discard();
+      // The browser opened it (find-in-page): on screen it is closed, so that is news to report.
+      toggle(view.getByTestId('popover'), 'open');
+      expect(committed).toHaveBeenCalledExactlyOnceWith(true);
+      expect(thrownAway).not.toHaveBeenCalled();
+    });
+
+    it('skips the toggle that the pendingToggle of the last commit says was reported', () => {
+      const onOpenChange = vi.fn();
+      const reportedAlready = { current: true as boolean | null };
+      const view = renderDiscardable((discarded) => (
+        <Harness
+          open={false}
+          onOpenChange={onOpenChange}
+          pendingToggle={discarded ? { current: null } : reportedAlready}
+        />
+      ));
+      view.discard();
+      toggle(view.getByTestId('popover'), 'open');
+      expect(onOpenChange).not.toHaveBeenCalled();
+      expect(reportedAlready.current).toBeNull();
+    });
+  });
 });
diff --git a/tests/discarded-render.tsx b/tests/discarded-render.tsx
new file mode 100644
index 0000000..51e4e35
--- /dev/null
+++ b/tests/discarded-render.tsx
@@ -0,0 +1,40 @@
+import { act, render } from '@testing-library/react';
+import { Suspense, startTransition, useState } from 'react';
+import type { ReactNode } from 'react';
+
+// A promise that never settles: a child that throws it keeps its Suspense boundary waiting.
+const never = new Promise<never>(() => {});
+
+function Hang({ when }: { when: boolean }) {
+  if (when) throw never;
+  return null;
+}
+
+/**
+ * Test helper: renders `ui(false)`, and lets a test make React render `ui(true)` and throw that
+ * render away. The new render runs in a transition and ends in a child that suspends, so React keeps
+ * what is on screen and never commits it, as it does for a transition that is abandoned. `ui` is
+ * called with `true` for the render that is thrown away, so a test can give it different props.
+ *
+ * A component that wrote a ref during render keeps what that render gave it. After the discarded
+ * render, an event reads the ref: a hook that is right finds the values of the last commit.
+ */
+export function renderDiscardable(ui: (discarded: boolean) => ReactNode) {
+  let attempt = () => {};
+  function Host() {
+    const [discarded, setDiscarded] = useState(false);
+    attempt = () => startTransition(() => setDiscarded(true));
+    return (
+      <Suspense fallback={null}>
+        {ui(discarded)}
+        <Hang when={discarded} />
+      </Suspense>
+    );
+  }
+  const result = render(<Host />);
+  return {
+    ...result,
+    /** Renders `ui(true)` and throws the render away. */
+    discard: () => act(() => attempt()),
+  };
+}
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal src/components/accordion src/components/select src/components/context-menu src/components/toast
```

Expected: FAIL. Lần fail đầu của từng test ở báo cáo của draft:
- `use-controllable-state.test.tsx`, `reports to the onChange of the last commit`: expected `onChange('b')`, gọi 0 lần; `compares a request with the value of the last commit`: 0 lần gọi; `does not warn about a switch that no commit made`: cảnh báo "changing from controlled to uncontrolled".
- `Accordion.test.tsx`, `asks for the change from the value of the last commit, …`: báo `'trial'` thay vì `null`.
- `Select.test.tsx`: `chooses with a typed letter while it is closed on screen, …` không gọi `onValueChange` (highlight đi chỗ khác); `picks the option that a typed letter matches …` nhận `'blueberry'` thay vì `'banana'`; `resets to the default value of the last commit` nhận `'banana'` thay vì `'apple'`.
- `use-popover.test.tsx`: `reports a toggle against the open state …` (0 lần gọi) và `skips the toggle that the pendingToggle of the last commit says was reported` (gọi một lần).
- `use-floating.test.tsx`, `calls the onPlaced of the last commit, …`: 0 lần gọi trên component đã commit.

Các test này **không** fail trước (đặc tính, pass trước và sau):
- `ContextMenu.test.tsx`: `openAt` đọc `openNow`, mà state của ContextMenu không có điều khiển nên không thể khác nhau trong render bị bỏ. Kiểm tra đột biến: bỏ layout effect thì test fail.
- `Toaster.test.tsx`, `holds the same in StrictMode, …`: `modal` đến từ `useSyncExternalStore`, thay đổi đồng bộ và không bị bỏ được, nên không dựng được test bỏ render thật.
- Ba test mới của `use-popover-trigger.test.tsx`: code đã đúng (`openNow` đã ghi trong layout effect), test chỉ củng cố. Kiểm tra đột biến: bỏ layout effect thì `compares a request with the state after the commit that changed it` fail; bỏ `next !== openNow.current` thì ba test fail; thay bằng `openAtPress.current ?? open` (bỏ qua `fromPress`) thì `goes by the state now for a code click, also when it was closed at an earlier press` và test cũ `goes by the state now` fail.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/accordion/Accordion.tsx b/src/components/accordion/Accordion.tsx
index 8188171..eefb742 100644
--- a/src/components/accordion/Accordion.tsx
+++ b/src/components/accordion/Accordion.tsx
@@ -130,8 +130,12 @@ export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Acc
   const rootRef = useRef<HTMLDivElement | null>(null);
   const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
   const mounted = useRef(false);
+  // The values of the last commit, for handlers and the effect below. Written after the commit, not
+  // during a render that React may throw away, and before the effects that read it.
   const latest = useRef({ open, multiple, setValue });
-  latest.current = { open, multiple, setValue };
+  useIsoLayoutEffect(() => {
+    latest.current = { open, multiple, setValue };
+  });
 
   // A click on a trigger (also the one Enter or Space makes) asks for the change instead of making
   // it: the item opens or closes once `value` says so. A controlled parent that commits later (a
diff --git a/src/components/context-menu/ContextMenu.tsx b/src/components/context-menu/ContextMenu.tsx
index 6caabaa..7f9e41f 100644
--- a/src/components/context-menu/ContextMenu.tsx
+++ b/src/components/context-menu/ContextMenu.tsx
@@ -14,6 +14,7 @@ import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { mergeRefs } from '../../internal/merge-refs';
 import { Slot } from '../../internal/slot';
 import { useControllableState } from '../../internal/use-controllable-state';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { devWarn } from '../../internal/warn';
 import { MenuTreeContext } from '../menu/menu-context';
 import type { FocusOnOpen, Point } from '../menu/menu-context';
@@ -86,8 +87,11 @@ export function ContextMenu({ onOpenChange, children }: ContextMenuProps) {
   const contentRef = useRef<HTMLDivElement | null>(null);
   const point = useRef<Point>([0, 0]);
   const returnTo = useRef<HTMLElement | null>(null);
+  // The state of the last commit, written after it and not during a render that React may throw away.
   const openNow = useRef(isOpen);
-  openNow.current = isOpen;
+  useIsoLayoutEffect(() => {
+    openNow.current = isOpen;
+  });
   const reopen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
   useEffect(() => () => clearTimeout(reopen.current), []);
 
diff --git a/src/components/select/Select.tsx b/src/components/select/Select.tsx
index 7a6033c..d7e6722 100644
--- a/src/components/select/Select.tsx
+++ b/src/components/select/Select.tsx
@@ -219,8 +219,11 @@ export const Select = markAsFieldControl(
     };
 
     // --- Typeahead: open, it moves the highlight; closed (choose one), it changes the value.
+    // The state of the last commit. Written after it, not during a render that React may throw away.
     const latest = useRef({ open, highlighted: active, first });
-    latest.current = { open, highlighted: active, first };
+    useIsoLayoutEffect(() => {
+      latest.current = { open, highlighted: active, first };
+    });
     const optionElements = useCallback(
       () => Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
       [contentRef],
@@ -233,7 +236,9 @@ export const Select = markAsFieldControl(
         : (contentRef.current?.querySelector(`[data-index="${at}"]`) ?? null);
     }, [contentRef]);
     const chooseRef = useRef<(index: number) => void>(() => {});
-    chooseRef.current = (index) => choose(options[index]);
+    useIsoLayoutEffect(() => {
+      chooseRef.current = (index) => choose(options[index]);
+    });
     const onTypeaheadMatch = useCallback((el: HTMLElement) => {
       const index = Number(el.dataset.index);
       if (latest.current.open) setHighlighted(index);
@@ -342,7 +347,9 @@ export const Select = markAsFieldControl(
       // `chosen` is a new array on every render; `chosenKey` stands for it.
     }, [chosenKey, options, synced]);
     const defaultRef = useRef(defaultValue);
-    defaultRef.current = defaultValue;
+    useIsoLayoutEffect(() => {
+      defaultRef.current = defaultValue;
+    });
     useEffect(() => {
       const form = nativeRef.current?.form;
       if (!form) return;
diff --git a/src/components/toast/Toaster.tsx b/src/components/toast/Toaster.tsx
index 1f5c91f..da04fe2 100644
--- a/src/components/toast/Toaster.tsx
+++ b/src/components/toast/Toaster.tsx
@@ -198,16 +198,23 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     holding: boolean;
   }>({ modal, moved: new Set(), holding: false });
   const [, release] = useReducer((n: number) => n + 1, 0);
-  // Kept in a ref, set while rendering, because a render that React throws away and runs again
-  // must find the same hold; it only ever depends on the last commit.
-  if (moveRef.current.modal !== modal) {
-    moveRef.current = {
-      modal,
-      moved: new Set([...rendered.current].filter((id) => settled.current.has(id))),
-      holding: true,
-    };
-  }
-  const move = moveRef.current;
+  // The hold only ever depends on the last commit (`rendered`, `settled` and the ref are written
+  // after one), so a render that React throws away and runs again works it out the same. The ref
+  // takes it over only once a render has committed.
+  const move = useMemo(
+    () =>
+      moveRef.current.modal === modal
+        ? moveRef.current
+        : {
+            modal,
+            moved: new Set([...rendered.current].filter((id) => settled.current.has(id))),
+            holding: true,
+          },
+    [modal],
+  );
+  useIsoLayoutEffect(() => {
+    moveRef.current = move;
+  });
   const mergedRef = useMemo(() => mergeRefs(ref, regionRef), [ref]);
   // The newest toast sits nearest the edge, so at the top it is first on screen. The DOM follows the
   // screen, so that Tab does (WCAG 2.4.3), and so does the focus that moves on after a close.
diff --git a/src/internal/use-controllable-state.ts b/src/internal/use-controllable-state.ts
index 95db95b..169cc80 100644
--- a/src/internal/use-controllable-state.ts
+++ b/src/internal/use-controllable-state.ts
@@ -1,4 +1,5 @@
 import { useCallback, useRef, useState } from 'react';
+import { useIsoLayoutEffect } from './use-iso-layout-effect';
 import { devWarn } from './warn';
 
 export interface ControllableStateOptions<T> {
@@ -23,19 +24,24 @@ export function useControllableState<T>({
 }: ControllableStateOptions<T>): [T, (next: T) => void, (next: T) => void] {
   const [internal, setInternal] = useState(defaultValue);
   const controlled = value !== undefined;
+  // The mode of the last commit. A render that React throws away must neither warn nor change it.
   const wasControlled = useRef(controlled);
-  if (wasControlled.current !== controlled) {
+  useIsoLayoutEffect(() => {
+    if (wasControlled.current === controlled) return;
     devWarn(
       `${name} is changing from ${wasControlled.current ? 'controlled' : 'uncontrolled'} to ` +
         `${controlled ? 'controlled' : 'uncontrolled'}. Pick one for the lifetime of the component.`,
     );
     wasControlled.current = controlled;
-  }
+  });
   const current = controlled ? value : internal;
 
-  // The latest values, read by a setter whose identity never changes.
+  // The values of the last commit, read by a setter whose identity never changes. Written after the
+  // commit, not during a render that React may throw away; every event runs after a commit.
   const latest = useRef({ current, controlled, onChange });
-  latest.current = { current, controlled, onChange };
+  useIsoLayoutEffect(() => {
+    latest.current = { current, controlled, onChange };
+  });
 
   const setValue = useCallback((next: T) => {
     const { current: before, controlled: isControlled, onChange: notify } = latest.current;
diff --git a/src/internal/use-floating.ts b/src/internal/use-floating.ts
index 633c8ba..b6557a2 100644
--- a/src/internal/use-floating.ts
+++ b/src/internal/use-floating.ts
@@ -90,9 +90,13 @@ export function useFloating({
   onPlaced,
 }: UseFloatingOptions): void {
   const getReference = useRef(reference);
-  getReference.current = reference;
   const latestOnPlaced = useRef(onPlaced);
-  latestOnPlaced.current = onPlaced;
+  // Written after the commit, not during a render that React may throw away. It comes before the
+  // effect below that reads them, which runs in the order the effects are written.
+  useIsoLayoutEffect(() => {
+    getReference.current = reference;
+    latestOnPlaced.current = onPlaced;
+  });
 
   useIsoLayoutEffect(() => {
     if (!open) return;
diff --git a/src/internal/use-popover.ts b/src/internal/use-popover.ts
index 214de27..0ddb68d 100644
--- a/src/internal/use-popover.ts
+++ b/src/internal/use-popover.ts
@@ -85,7 +85,11 @@ export function usePopover(
 ): void {
   const [, forceRender] = useReducer((count: number) => count + 1, 0);
   const latest = useRef({ open, onOpenChange, restoreFocusTo, onShown, pendingToggle });
-  latest.current = { open, onOpenChange, restoreFocusTo, onShown, pendingToggle };
+  // Written after the commit, not during a render that React may throw away. It comes before the
+  // effects below that read it, which run in the order they are written.
+  useIsoLayoutEffect(() => {
+    latest.current = { open, onOpenChange, restoreFocusTo, onShown, pendingToggle };
+  });
   // Whether the last render asked for it to be open. The browser may already have hidden it (light
   // dismiss happens before the click that sets `open` to false), so focus is restored on every
   // change from open to closed, not only when this hook hides it.
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/accordion src/components/select src/components/context-menu src/components/toast src/components/popover src/components/dropdown-menu src/components/menu
pnpm build && pnpm check:package
```

Expected: unit PASS (draft: 790 test PASS, 3 skip); story của bảy thư mục PASS (342 test); gói PASS với ngưỡng cũ.

- [ ] **Step 5: Commit**

```bash
git add src/components/accordion/Accordion.test.tsx \n  src/components/accordion/Accordion.tsx \n  src/components/context-menu/ContextMenu.test.tsx \n  src/components/context-menu/ContextMenu.tsx \n  src/components/select/Select.test.tsx \n  src/components/select/Select.tsx \n  src/components/toast/Toaster.test.tsx \n  src/components/toast/Toaster.tsx \n  src/internal/use-controllable-state.test.tsx \n  src/internal/use-controllable-state.ts \n  src/internal/use-floating.test.tsx \n  src/internal/use-floating.ts \n  src/internal/use-popover-trigger.test.tsx \n  src/internal/use-popover.test.tsx \n  src/internal/use-popover.ts \n  tests/discarded-render.tsx
```
```bash
git commit -m "fix: write no ref during render" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: Phần được trỏ tới bằng id không nhận `id`

Spec §6.1 (bullet "`id` do lib sinh" và bullet con), §6.3 Tabs ("`TabsTrigger` và `TabsContent` không nhận prop `id`") và §6.3 Menu (`MenuSubTrigger`). Ba phần này được `aria-controls` hoặc `aria-labelledby` trỏ tới; nếu người dùng đưa `id` thì link gãy. Kiểu bỏ `id` (như `PopoverContent`), và id do lib sinh đặt **sau** `{...props}` để một `id` truyền từ JavaScript không có kiểu cũng bị bỏ qua.

**Files:**
- Modify: `src/components/tabs/Tabs.tsx`, `src/components/menu/Menu.tsx`
- Test: `src/components/tabs/Tabs.test.tsx`, `src/components/tabs/Tabs.test-d.ts`, `src/components/menu/Menu.test.tsx`, `src/components/menu/Menu.test-d.ts`

**Interfaces:**
- Consumes: không.
- Produces: `TabsTriggerProps`, `TabsContentProps` và `MenuSubTriggerProps` không còn `id`. Task 3 và 4 sửa tiếp `Tabs.tsx`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/menu/Menu.test-d.ts b/src/components/menu/Menu.test-d.ts
index aec6384..e00860b 100644
--- a/src/components/menu/Menu.test-d.ts
+++ b/src/components/menu/Menu.test-d.ts
@@ -1,5 +1,10 @@
 import { expectTypeOf, test } from 'vitest';
-import type { MenuCheckboxItemProps, MenuItemProps, MenuRadioItemProps } from './Menu';
+import type {
+  MenuCheckboxItemProps,
+  MenuItemProps,
+  MenuRadioItemProps,
+  MenuSubTriggerProps,
+} from './Menu';
 
 test('MenuItem takes the documented variants; a checkbox item takes none', () => {
   expectTypeOf<MenuItemProps['variant']>().toEqualTypeOf<'default' | 'danger' | undefined>();
@@ -15,3 +20,9 @@ test('MenuRadioItem needs a value', () => {
   const radio: MenuRadioItemProps = {};
   expectTypeOf(radio).toBeObject();
 });
+
+test('MenuSubTrigger does not take an id', () => {
+  // @ts-expect-error the sub-trigger's id is generated by the library
+  const trigger: MenuSubTriggerProps = { id: 'x' };
+  expectTypeOf(trigger).toBeObject();
+});
diff --git a/src/components/menu/Menu.test.tsx b/src/components/menu/Menu.test.tsx
index deef0eb..5924e2e 100644
--- a/src/components/menu/Menu.test.tsx
+++ b/src/components/menu/Menu.test.tsx
@@ -200,6 +200,32 @@ describe('Menu parts', () => {
     expect(trees.size).toBe(1);
   });
 
+  it('keeps the generated ids when an id is forced through a cast', () => {
+    render(
+      <DropdownMenu defaultOpen>
+        <DropdownMenuTrigger>File</DropdownMenuTrigger>
+        <DropdownMenuContent>
+          <MenuSub defaultOpen>
+            <MenuSubTrigger {...({ id: 'evil-trigger' } as unknown as { id: string })}>
+              Move to
+            </MenuSubTrigger>
+            <MenuSubContent>
+              <MenuItem>Archive</MenuItem>
+            </MenuSubContent>
+          </MenuSub>
+        </DropdownMenuContent>
+      </DropdownMenu>,
+    );
+    const trigger = screen.getByRole('menuitem', { name: /Move to/, hidden: true });
+    const panel = trigger.getAttribute('aria-controls')
+      ? document.getElementById(trigger.getAttribute('aria-controls')!)
+      : null;
+    expect(trigger.id).not.toBe('evil-trigger');
+    expect(panel).not.toBeNull();
+    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
+    expect(trigger).toHaveAttribute('aria-controls', panel!.id);
+  });
+
   it('keeps its items mounted while closed', () => {
     render(
       <DropdownMenu>
diff --git a/src/components/tabs/Tabs.test-d.ts b/src/components/tabs/Tabs.test-d.ts
index 37d67f8..b785d05 100644
--- a/src/components/tabs/Tabs.test-d.ts
+++ b/src/components/tabs/Tabs.test-d.ts
@@ -1,5 +1,5 @@
 import { expectTypeOf, test } from 'vitest';
-import type { TabsProps, TabsTriggerProps } from './Tabs';
+import type { TabsContentProps, TabsProps, TabsTriggerProps } from './Tabs';
 
 test('Tabs take only the documented variants, orientations and activation modes', () => {
   expectTypeOf<TabsProps['variant']>().toEqualTypeOf<
@@ -11,8 +11,14 @@ test('Tabs take only the documented variants, orientations and activation modes'
   const unknownVariant: TabsProps = { variant: 'boxed' };
   // @ts-expect-error a tab needs the value that ties it to its panel
   const noValue: TabsTriggerProps = { children: 'Overview' };
+  // @ts-expect-error the tab's id is generated by the library
+  const triggerId: TabsTriggerProps = { value: 'overview', id: 'x' };
+  // @ts-expect-error the panel's id is generated by the library
+  const contentId: TabsContentProps = { value: 'overview', id: 'x' };
   expectTypeOf(unknownVariant).toBeObject();
   expectTypeOf(noValue).toBeObject();
+  expectTypeOf(triggerId).toBeObject();
+  expectTypeOf(contentId).toBeObject();
 });
 
 test('a controlled Tabs takes null for no tab, and reports only tabs', () => {
diff --git a/src/components/tabs/Tabs.test.tsx b/src/components/tabs/Tabs.test.tsx
index 7aef131..947974e 100644
--- a/src/components/tabs/Tabs.test.tsx
+++ b/src/components/tabs/Tabs.test.tsx
@@ -226,6 +226,27 @@ describe('Tabs', () => {
     );
   });
 
+  it('keeps the generated ids when an id is forced through a cast', () => {
+    render(
+      <Tabs defaultValue="overview">
+        <TabsList aria-label="Project">
+          <TabsTrigger value="overview" {...({ id: 'evil-trigger' } as unknown as { id: string })}>
+            Overview
+          </TabsTrigger>
+        </TabsList>
+        <TabsContent value="overview" {...({ id: 'evil-panel' } as unknown as { id: string })}>
+          Overview panel
+        </TabsContent>
+      </Tabs>,
+    );
+    const trigger = tab('Overview');
+    const panel = screen.getByRole('tabpanel', { name: 'Overview' });
+    expect(trigger.id).not.toBe('evil-trigger');
+    expect(panel.id).not.toBe('evil-panel');
+    expect(trigger).toHaveAttribute('aria-controls', panel.id);
+    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
+  });
+
   it('warns when a part is rendered outside Tabs', () => {
     const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
     render(<TabsTrigger value="lost">Lost</TabsTrigger>);
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/tabs src/components/menu
```

Expected: FAIL.
- Test kiểu (`Tabs.test-d.ts`, `Menu.test-d.ts`): `TypeCheckError: Unused '@ts-expect-error' directive.`
- `Tabs.test.tsx`, `keeps the generated ids when an id is forced through a cast`: `Unable to find an accessible element with the role "tabpanel" and name "Overview"`, vì `id` ép vào đã xoá phần tử mà `aria-labelledby` trỏ tới.
- Test chạy của Menu (`MenuSubTrigger`) pass trước, vì id sinh đã đứng sau spread; chỉ test kiểu fail.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/menu/Menu.tsx b/src/components/menu/Menu.tsx
index c6eba28..cb14cf2 100644
--- a/src/components/menu/Menu.tsx
+++ b/src/components/menu/Menu.tsx
@@ -87,7 +87,7 @@ export interface MenuSubProps {
   onOpenChange?: (open: boolean) => void;
   children?: ReactNode;
 }
-export interface MenuSubTriggerProps extends Omit<ItemBaseProps, 'onSelect'> {
+export interface MenuSubTriggerProps extends Omit<ItemBaseProps, 'onSelect' | 'id'> {
   /** An icon in the column before the text. */
   icon?: ReactNode;
 }
diff --git a/src/components/tabs/Tabs.tsx b/src/components/tabs/Tabs.tsx
index 36e12fc..6eca09b 100644
--- a/src/components/tabs/Tabs.tsx
+++ b/src/components/tabs/Tabs.tsx
@@ -32,11 +32,14 @@ export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'default
   variant?: TabsVariant;
 }
 export type TabsListProps = HTMLAttributes<HTMLDivElement>;
-export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
+export interface TabsTriggerProps extends Omit<
+  ButtonHTMLAttributes<HTMLButtonElement>,
+  'value' | 'id'
+> {
   /** Ties the tab to the `TabsContent` with the same value. */
   value: string;
 }
-export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
+export interface TabsContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
   /** Ties the panel to the `TabsTrigger` with the same value. */
   value: string;
 }
@@ -216,13 +219,13 @@ export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(funct
       ref={register}
       type="button"
       role="tab"
-      id={triggerId(ctx.baseId, value)}
       aria-selected={selected}
       aria-controls={contentId(ctx.baseId, value)}
       tabIndex={(selected && !disabled) || fallback === value ? 0 : -1}
       disabled={disabled}
       className={clsx('flg-tabs-trigger', className)}
       {...props}
+      id={triggerId(ctx.baseId, value)}
       onPointerDown={composeEventHandlers(onPointerDown, () => {
         selectedOnFocus.current = false;
       })}
@@ -250,12 +253,12 @@ export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function
     <div
       ref={ref}
       role="tabpanel"
-      id={contentId(ctx.baseId, value)}
       aria-labelledby={triggerId(ctx.baseId, value)}
       tabIndex={0}
       hidden={ctx.value !== value}
       className={clsx('flg-tabs-content', className)}
       {...props}
+      id={contentId(ctx.baseId, value)}
     />
   );
 });
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/tabs src/components/menu
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs src/components/menu
pnpm build && pnpm check:package
```

Expected: 61 unit test PASS (kể cả test kiểu); 36 story test PASS; gói PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/menu/Menu.test-d.ts \n  src/components/menu/Menu.test.tsx \n  src/components/menu/Menu.tsx \n  src/components/tabs/Tabs.test-d.ts \n  src/components/tabs/Tabs.test.tsx \n  src/components/tabs/Tabs.tsx
```
```bash
git commit -m "fix: parts that another part points at by id take no id" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: Tabs, tab dừng và `onPointerDown` của người dùng

Spec §6.3 Tabs, các dòng "Plan E2":
- Khi không có tab nào được chọn, tab đầu tiên chưa `disabled` nhận `tabIndex=0`. Giá trị này phải được tính lại cả khi `disabled` của một tab đổi bên trong một component đã `memo`, mà `TabsList` không render lại. Mỗi `TabsTrigger` báo cho list khi `disabled` của nó đổi.
- `onPointerDown` của người dùng có gọi `preventDefault()` thì lib vẫn ghi nhận lần nhấn mới: lib đặt lại `selectedOnFocus` trước, rồi gọi handler của người dùng.
- `Tabs.mdx`: ghi giới hạn đã biết (HTML từ server chưa có tab `tabIndex=0` khi không chọn tab nào; cách tránh là cho Tabs một value), và sửa câu về biến thể `pill`, chỉ đúng ở theme mặc định.

**Files:**
- Modify: `src/components/tabs/Tabs.tsx`, `src/components/tabs/Tabs.mdx`
- Test: `src/components/tabs/Tabs.test.tsx`

**Interfaces:**
- Consumes: `TabsList` và `TabsTrigger` từ Task 2.
- Produces: `RefreshFallbackContext` (nội bộ trong `Tabs.tsx`): `TabsList` cung cấp hàm `refreshFallback` ổn định, mỗi `TabsTrigger` gọi nó trong layout effect theo `[disabled]`. Task 4 đổi tên nó thành `RefreshTabsContext`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/tabs/Tabs.test.tsx b/src/components/tabs/Tabs.test.tsx
index 947974e..37d9f0a 100644
--- a/src/components/tabs/Tabs.test.tsx
+++ b/src/components/tabs/Tabs.test.tsx
@@ -1,4 +1,5 @@
 import { act, fireEvent, render, screen } from '@testing-library/react';
+import { memo, useState } from 'react';
 import { renderToString } from 'react-dom/server';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
 import { resetDevWarnings } from '../../internal/warn';
@@ -182,6 +183,61 @@ describe('Tabs', () => {
     expect(onValueChange).toHaveBeenCalledTimes(4);
   });
 
+  it('counts a pointer press the user prevented as a new press', () => {
+    const onValueChange = vi.fn();
+    render(
+      <Tabs value="overview" onValueChange={onValueChange}>
+        <TabsList aria-label="Project">
+          <TabsTrigger value="overview">Overview</TabsTrigger>
+          <TabsTrigger value="members" onPointerDown={(event) => event.preventDefault()}>
+            Members
+          </TabsTrigger>
+        </TabsList>
+      </Tabs>,
+    );
+    // The parent refuses: the tab is focused, and asked for once. No click follows, so the focus
+    // still counts as the selection when the next press lands on the focused tab.
+    act(() => tab('Members').focus());
+    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('members');
+    // A new press asks again, though the user's handler prevented it.
+    expect(fireEvent.pointerDown(tab('Members'), { button: 0 })).toBe(false);
+    fireEvent.click(tab('Members'));
+    expect(onValueChange).toHaveBeenCalledTimes(2);
+  });
+
+  it('gives Tab to the first enabled tab when a tab inside a memo wrapper changes `disabled`', () => {
+    // The wrapper re-renders alone: neither Tabs nor TabsList renders again.
+    const Wrapper = memo(function Wrapper() {
+      const [disabled, setDisabled] = useState(true);
+      return (
+        <>
+          <TabsTrigger value="a" disabled={disabled}>
+            A
+          </TabsTrigger>
+          <button type="button" onClick={() => setDisabled((current) => !current)}>
+            Toggle
+          </button>
+        </>
+      );
+    });
+    render(
+      <Tabs value={null}>
+        <TabsList aria-label="Project">
+          <Wrapper />
+          <TabsTrigger value="b">B</TabsTrigger>
+        </TabsList>
+      </Tabs>,
+    );
+    expect(tab('A')).toHaveAttribute('tabindex', '-1');
+    expect(tab('B')).toHaveAttribute('tabindex', '0');
+    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
+    expect(tab('A')).toHaveAttribute('tabindex', '0');
+    expect(tab('B')).toHaveAttribute('tabindex', '-1');
+    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
+    expect(tab('A')).toHaveAttribute('tabindex', '-1');
+    expect(tab('B')).toHaveAttribute('tabindex', '0');
+  });
+
   it('selects no tab while a controlled value is null, and stays controlled', () => {
     const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
     const onValueChange = vi.fn();
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/tabs
```

Expected: FAIL, hai test mới.
- `gives Tab to the first enabled tab when a tab inside a memo wrapper changes `disabled``: tab A vẫn `tabindex=-1` sau khi wrapper bật nó, vì `TabsList` không render.
- `counts a pointer press the user prevented as a new press`: `expected "vi.fn()" to be called 2 times, but got 1 times`.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/tabs/Tabs.mdx b/src/components/tabs/Tabs.mdx
index 6c46833..57780b0 100644
--- a/src/components/tabs/Tabs.mdx
+++ b/src/components/tabs/Tabs.mdx
@@ -41,7 +41,9 @@ Tabs with no tab selected takes `value={null}`, for example while the address ha
 
 - `variant="underline"` (default): a line under the row, and an accent bar under the selected tab.
 - `variant="segmented"`: the tabs sit in a track as wide as they are; the selected one is raised.
-- `variant="pill"`: round tabs; the selected one has the accent wash and accent text.
+- `variant="pill"`: round tabs; the selected one has the accent wash and accent text. With
+  `prefers-contrast: more` it is solid accent with the matching text instead, and in forced colours
+  an edge of the system highlight colour marks it.
 
 ## Orientation and activation
 
@@ -70,7 +72,7 @@ is selected, the first enabled tab takes its place.
   `aria-controls`; each panel is a `tabpanel` named by its tab, and takes focus (`tabIndex` 0), so
   its content is reachable even when it has nothing focusable.
 - The selected tab uses the full text colour, while the others are muted; in `pill` it has the
-  accent text. The approved looks also mark it with colours below the WCAG minimums in the default
+  accent text in the default theme (see Variants for the other modes). The approved looks also mark it with colours below the WCAG minimums in the default
   theme, listed on the Accessibility page:
   - `underline`: the accent bar, in dark (row 5);
   - `segmented`: the raised tab against its track, and the muted text on the track (rows 12, 13);
@@ -79,6 +81,10 @@ is selected, the first enabled tab takes its place.
   With `prefers-contrast: more` they all meet AA: the bar and the pill are solid accent, and the
   selected segmented tab has an edge of the text colour.
 
+- With no tab selected, the server's HTML has no tab with `tabIndex={0}`: the first enabled tab takes
+  Tab only once the page hydrates, so until then Tab skips the list. Give Tabs a value (`value` or
+  `defaultValue`) when the page can be used before hydration.
+
 ## Do and don't
 
 - Do use tabs to switch between views of the same thing.
diff --git a/src/components/tabs/Tabs.tsx b/src/components/tabs/Tabs.tsx
index 6eca09b..97edd59 100644
--- a/src/components/tabs/Tabs.tsx
+++ b/src/components/tabs/Tabs.tsx
@@ -1,7 +1,16 @@
 'use client';
 
 import { clsx } from 'clsx';
-import { createContext, forwardRef, useContext, useId, useMemo, useRef, useState } from 'react';
+import {
+  createContext,
+  forwardRef,
+  useCallback,
+  useContext,
+  useId,
+  useMemo,
+  useRef,
+  useState,
+} from 'react';
 import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { mergeRefs } from '../../internal/merge-refs';
@@ -56,6 +65,11 @@ interface TabsContextValue {
 const TabsContext = createContext<TabsContextValue | null>(null);
 /** The tab that takes Tab when no enabled tab is selected; set by `TabsList`. */
 const FallbackContext = createContext<string | null>(null);
+/**
+ * Asks `TabsList` to work out the fallback again. A tab calls it when its `disabled` changes: the
+ * tab may sit in a memoized component that renders alone, and then the list does not render.
+ */
+const RefreshFallbackContext = createContext<() => void>(() => {});
 
 function useTabsContext(part: string): TabsContextValue {
   const ctx = useContext(TabsContext);
@@ -146,7 +160,7 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
   // With no enabled tab selected (no value yet, or the selected one is disabled), Tab would skip the
   // list: the first enabled tab takes Tab instead. Known only once the tabs are in the document.
   const [fallback, setFallback] = useState<string | null>(null);
-  useIsoLayoutEffect(() => {
+  const refreshFallback = useCallback(() => {
     const list = listRef.current;
     if (!list) return;
     const tabs = tabsOf(list);
@@ -156,6 +170,12 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
     const first = reachable ? undefined : tabs.find((tab) => !tab.disabled);
     const next = first ? (values.get(first) ?? null) : null;
     setFallback((current) => (current === next ? current : next));
+  }, []);
+  useIsoLayoutEffect(() => {
+    const list = listRef.current;
+    if (!list) return;
+    refreshFallback();
+    const tabs = tabsOf(list);
     const seen = new Set<string>();
     for (const tab of tabs) {
       const value = values.get(tab);
@@ -179,19 +199,21 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
     focusNext(event, tabs, { orientation: ctx.orientation, loop: true }, tab);
   };
   return (
-    <FallbackContext.Provider value={fallback}>
-      {/* The tabs take focus, not the list: the arrow keys reach it from the focused tab (APG). */}
-      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
-      <div
-        ref={mergedRef}
-        role="tablist"
-        aria-orientation={ctx.orientation}
-        className={clsx('flg-tabs-list', className)}
-        data-variant={ctx.variant}
-        {...props}
-        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
-      />
-    </FallbackContext.Provider>
+    <RefreshFallbackContext.Provider value={refreshFallback}>
+      <FallbackContext.Provider value={fallback}>
+        {/* The tabs take focus, not the list: the arrow keys reach it from the focused tab (APG). */}
+        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
+        <div
+          ref={mergedRef}
+          role="tablist"
+          aria-orientation={ctx.orientation}
+          className={clsx('flg-tabs-list', className)}
+          data-variant={ctx.variant}
+          {...props}
+          onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
+        />
+      </FallbackContext.Provider>
+    </RefreshFallbackContext.Provider>
   );
 });
 
@@ -202,11 +224,17 @@ export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(funct
 ) {
   const ctx = useTabsContext('TabsTrigger');
   const fallback = useContext(FallbackContext);
+  const refreshFallback = useContext(RefreshFallbackContext);
   const selected = ctx.value === value;
   // A press focuses the tab, then clicks it; an arrow key focuses a tab, then Enter or Space clicks
   // it. In automatic mode the focus selects, and the click after it does not select again: a parent
   // that commits later (a router) would get it twice. A new pointer press asks again.
   const selectedOnFocus = useRef(false);
+  // Whether this tab can be the fallback depends on its `disabled`, and a render of this tab alone
+  // (inside a memoized component) does not make the list look again.
+  useIsoLayoutEffect(() => {
+    refreshFallback();
+  }, [disabled, refreshFallback]);
   const register = useMemo(
     () =>
       mergeRefs(ref, (el: HTMLButtonElement | null) => {
@@ -226,9 +254,11 @@ export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(funct
       className={clsx('flg-tabs-trigger', className)}
       {...props}
       id={triggerId(ctx.baseId, value)}
-      onPointerDown={composeEventHandlers(onPointerDown, () => {
+      onPointerDown={(event) => {
+        // Reset even when the user's handler prevents the press: it is a new press all the same.
         selectedOnFocus.current = false;
-      })}
+        onPointerDown?.(event);
+      }}
       onFocus={composeEventHandlers(onFocus, () => {
         if (ctx.activationMode !== 'automatic') return;
         ctx.select(value);
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/tabs
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs
```

Expected: 38 unit test PASS; 36 story test PASS. Task này không đổi export, CSS hay gói, nên chưa cần `check:package`.

- [ ] **Step 5: Commit**

```bash
git add src/components/tabs/Tabs.mdx \n  src/components/tabs/Tabs.test.tsx \n  src/components/tabs/Tabs.tsx
```
```bash
git commit -m "fix(tabs): recompute the fallback tab stop on \`disabled\`, count prevented presses" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: Hàng tab không đủ chỗ thì cuộn, với thanh mảnh và mờ dần ở mép

Spec §4.3 Tabs, bullet "Khi hàng tab ngang không đủ chỗ" và các bullet con (Plan E2 và Claude chốt). Chủ dự án chọn phương án này qua ảnh. Task này sửa các dòng spec đó theo điều code đã chứng minh (xem phát hiện 4 ở đầu plan).

- `TabsList` (ngang) đo mình và đặt `data-overflow`, `data-at-start`, `data-at-end` bằng listener `scroll` và `ResizeObserver` (dọn cả hai khi unmount). Mọi CSS tràn hiện ra chỉ khi có `data-overflow`: `overflow-x: auto`, thanh cuộn mảnh, `mask-image` mờ dần ở mép chưa tới.
- `segmented` giữ track, tab cuộn bên trong; `pill` giống `underline` không có vạch; vạch của `underline` chạy hết bề rộng cuộn và thanh tab chọn vẫn nằm trên nó.
- Tab được chọn được cuộn vào tầm nhìn khi mount, khi hàng bắt đầu tràn, và mỗi khi `value` đổi (kể cả từ bên ngoài), bằng cách đặt `scrollLeft`, không dùng `scrollIntoView`, để trang không cuộn.
- Forced colors: không có mờ dần; vạch của `underline` đổi sang `CanvasText` bằng `forced-color-adjust: none` trên list (các tab vẫn bị ép màu). `prefers-reduced-motion`: không cần quy tắc, vì không có gì chuyển động.
- Tab vừa chỗ giữ nguyên từng byte. Draft đã chứng minh bằng cách chụp `Tabs/Variants` ở commit cha và commit này (Chromium, light và dark × normal, solid, contrast-more, forced-colors): 8 cặp, giống từng byte, 0 pixel khác.

**Files:**
- Modify: `src/components/tabs/Tabs.tsx`, `src/components/tabs/Tabs.mdx`, `src/styles/components/tabs.css`, `src/styles/preferences.css`, spec giai đoạn 2 (§4.3 Tabs)
- Test: `src/components/tabs/Tabs.test.tsx`, `src/components/tabs/Tabs.stories.tsx`

**Interfaces:**
- Consumes: `RefreshFallbackContext` từ Task 3.
- Produces:
  - `RefreshTabsContext` (đổi tên từ `RefreshFallbackContext`): lời gọi từ tab khi mount và khi `disabled` đổi giờ cũng đo lại, nên tab do một wrapper `memo` thêm vào được thấy.
  - `data-overflow`, `data-at-start`, `data-at-end` trên `.flg-tabs-list`; `scroll-padding-inline: 36px`, mà `revealSelected` đọc lại.
  - Story `Tabs/Overflow` (có ảnh, 8 ảnh chuẩn đến sau từ CI) và `Tabs/OverflowControlled` (`no-visual`).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/tabs/Tabs.stories.tsx b/src/components/tabs/Tabs.stories.tsx
index c6b7dc6..7849c50 100644
--- a/src/components/tabs/Tabs.stories.tsx
+++ b/src/components/tabs/Tabs.stories.tsx
@@ -82,6 +82,136 @@ export const Variants: Story = {
   ),
 };
 
+/** More tabs than a narrow column has room for. */
+function Workspace(props: Omit<TabsProps, 'children'>) {
+  return (
+    <Tabs defaultValue="overview" {...props}>
+      <TabsList aria-label="Workspace">
+        <TabsTrigger value="overview">Overview</TabsTrigger>
+        <TabsTrigger value="members">
+          Members <Badge variant="neutral">12</Badge>
+        </TabsTrigger>
+        <TabsTrigger value="activity">Activity</TabsTrigger>
+        <TabsTrigger value="billing" disabled>
+          Billing
+        </TabsTrigger>
+        <TabsTrigger value="settings">Settings</TabsTrigger>
+      </TabsList>
+      {['overview', 'members', 'activity', 'billing', 'settings'].map((value) => (
+        <TabsContent key={value} value={value} style={panelText}>
+          The {value} of Website 2026.
+        </TabsContent>
+      ))}
+    </Tabs>
+  );
+}
+
+// A grid item grows to fit its content unless its track lets it shrink (`minmax(0, 1fr)`).
+const narrow = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16, width: 260 };
+
+/**
+ * Whether the tab, with the 4px its focus ring reaches out (an outline 2px wide, 2px away), lies
+ * inside the list's padding box, where the list clips what it scrolls.
+ */
+function inView(tab: HTMLElement, list: HTMLElement) {
+  const t = tab.getBoundingClientRect();
+  const l = list.getBoundingClientRect();
+  const left = l.left + list.clientLeft;
+  const top = l.top + list.clientTop;
+  return (
+    t.left - 4 >= left &&
+    t.right + 4 <= left + list.clientWidth &&
+    t.top - 4 >= top &&
+    t.bottom + 4 <= top + list.clientHeight
+  );
+}
+
+export const Overflow: Story = {
+  render: () => (
+    <div style={narrow}>
+      <Card style={card}>
+        <Workspace />
+      </Card>
+      <Card style={card}>
+        <Workspace variant="segmented" />
+      </Card>
+      <Card style={card}>
+        <Workspace variant="pill" />
+      </Card>
+      <Card style={card}>
+        <Workspace defaultValue="settings" />
+      </Card>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const [underline, segmented, pill, mountedAtEnd] = canvas.getAllByRole('tablist') as [
+      HTMLElement,
+      HTMLElement,
+      HTMLElement,
+      HTMLElement,
+    ];
+    // At rest a row that does not fit is marked so, at its start; the fade shows at its end.
+    for (const list of [underline, segmented, pill]) {
+      await expect(list).toHaveAttribute('data-overflow');
+      await expect(list).toHaveAttribute('data-at-start');
+      await expect(list).not.toHaveAttribute('data-at-end');
+    }
+    // A row mounted with its last tab selected has scrolled to it.
+    const settings = (list: HTMLElement) => within(list).getByRole('tab', { name: 'Settings' });
+    await expect(settings(mountedAtEnd)).toHaveAttribute('aria-selected', 'true');
+    await expect(mountedAtEnd).toHaveAttribute('data-at-end');
+    await expect(inView(settings(mountedAtEnd), mountedAtEnd)).toBe(true);
+    // The keys move focus with trusted input, which the Storybook UI cannot give.
+    const real = await realUserEvent();
+    if (!real) return;
+    const { scrollX, scrollY } = window;
+    for (const list of [underline, segmented, pill]) {
+      within(list).getByRole('tab', { name: 'Overview' }).focus();
+      await real.keyboard('{End}');
+      await expect(settings(list)).toHaveFocus();
+      // The browser scrolled the row to the focused tab, and its ring is not cut off.
+      await waitFor(() => expect(list).toHaveAttribute('data-at-end'));
+      await expect(list).not.toHaveAttribute('data-at-start');
+      await expect(inView(settings(list), list)).toBe(true);
+    }
+    // The page did not move.
+    await expect([window.scrollX, window.scrollY]).toEqual([scrollX, scrollY]);
+  },
+};
+
+function ControlledOverflow() {
+  const [value, setValue] = useState('overview');
+  return (
+    <div style={narrow}>
+      <Card style={card}>
+        <Workspace value={value} onValueChange={setValue} />
+      </Card>
+      <button type="button" onClick={() => setValue('settings')}>
+        Open settings
+      </button>
+    </div>
+  );
+}
+
+export const OverflowControlled: Story = {
+  tags: ['no-visual'],
+  render: () => <ControlledOverflow />,
+  play: async ({ canvas }) => {
+    const list = canvas.getByRole('tablist');
+    const settings = canvas.getByRole('tab', { name: 'Settings' });
+    await expect(list).toHaveAttribute('data-at-start');
+    await expect(inView(settings, list)).toBe(false);
+    const { scrollX, scrollY } = window;
+    // The parent selects a tab out of view: the row scrolls to it, and the page stays.
+    const real = await realUserEvent();
+    await (real ?? userEvent).click(canvas.getByRole('button', { name: 'Open settings' }));
+    await expect(settings).toHaveAttribute('aria-selected', 'true');
+    await expect(inView(settings, list)).toBe(true);
+    await expect(list).toHaveAttribute('data-at-end');
+    await expect([window.scrollX, window.scrollY]).toEqual([scrollX, scrollY]);
+  },
+};
+
 export const Keyboard: Story = {
   tags: ['no-visual'],
   render: (args) => <Project onValueChange={args.onValueChange} />,
diff --git a/src/components/tabs/Tabs.test.tsx b/src/components/tabs/Tabs.test.tsx
index 37d9f0a..7ee427f 100644
--- a/src/components/tabs/Tabs.test.tsx
+++ b/src/components/tabs/Tabs.test.tsx
@@ -311,3 +311,195 @@ describe('Tabs', () => {
     );
   });
 });
+
+const box = (left: number, width: number) =>
+  ({ left, right: left + width, top: 0, bottom: 32, width, height: 32, x: left, y: 0 }) as DOMRect;
+
+/**
+ * jsdom lays nothing out. This gives every tab list the width `room` and each of its children the
+ * width `tab`, side by side from the list's left edge and moved by its scroll, which stays in range
+ * as in a browser. A test changes `room` to resize the list.
+ */
+function mockLayout(sizes: { room: number; tab: number }) {
+  const scrolled = new WeakMap<Element, number>();
+  const isList = (el: Element) => el.classList.contains('flg-tabs-list');
+  const maxScroll = (list: Element) => Math.max(0, list.children.length * sizes.tab - sizes.room);
+  const scrollOf = (list: Element) => Math.min(scrolled.get(list) ?? 0, maxScroll(list));
+  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
+    return isList(this) ? sizes.room : 0;
+  });
+  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
+    return isList(this) ? sizes.room + maxScroll(this) : 0;
+  });
+  vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockImplementation(function (this: Element) {
+    return scrollOf(this);
+  });
+  vi.spyOn(Element.prototype, 'scrollLeft', 'set').mockImplementation(function (
+    this: Element,
+    value: number,
+  ) {
+    scrolled.set(this, Math.min(Math.max(value, 0), maxScroll(this)));
+  });
+  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
+    const list = this.parentElement;
+    if (isList(this)) return box(0, sizes.room);
+    if (!list || !isList(list)) return box(0, 0);
+    return box(Array.from(list.children).indexOf(this) * sizes.tab - scrollOf(list), sizes.tab);
+  });
+  return sizes;
+}
+
+/** Stands in for ResizeObserver, which jsdom lacks; `resize()` reports what a browser would. */
+function fakeResizeObservers() {
+  const all: FakeResizeObserver[] = [];
+  class FakeResizeObserver {
+    readonly observed = new Set<Element>();
+    readonly disconnect = vi.fn(() => this.observed.clear());
+    constructor(readonly callback: ResizeObserverCallback) {
+      all.push(this);
+    }
+    observe(target: Element) {
+      this.observed.add(target);
+    }
+    unobserve(target: Element) {
+      this.observed.delete(target);
+    }
+    resize() {
+      const entries = Array.from(this.observed, (target) => ({ target }) as ResizeObserverEntry);
+      this.callback(entries, this as unknown as ResizeObserver);
+    }
+  }
+  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
+  return all;
+}
+
+const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
+
+describe('Tabs that do not fit', () => {
+  afterEach(() => {
+    vi.restoreAllMocks();
+    vi.unstubAllGlobals();
+  });
+
+  it('marks a row whose tabs do not fit, and the edges it has been scrolled to', async () => {
+    const observers = fakeResizeObservers();
+    // Four tabs of 100px in 250px.
+    const sizes = mockLayout({ room: 250, tab: 100 });
+    render(<Example defaultValue="overview" />);
+    const list = screen.getByRole('tablist');
+    expect(list).toHaveAttribute('data-overflow');
+    expect(list).toHaveAttribute('data-at-start');
+    expect(list).not.toHaveAttribute('data-at-end');
+    list.scrollLeft = 150;
+    fireEvent.scroll(list);
+    expect(list).not.toHaveAttribute('data-at-start');
+    expect(list).toHaveAttribute('data-at-end');
+    // The row grows until the tabs fit, and the marks go.
+    sizes.room = 400;
+    await act(async () => {
+      for (const observer of observers) observer.resize();
+      await nextFrame();
+    });
+    for (const name of ['data-overflow', 'data-at-start', 'data-at-end']) {
+      expect(list).not.toHaveAttribute(name);
+    }
+  });
+
+  it('marks nothing while the tabs fit, nor in the HTML from the server', () => {
+    // A characterization test: before the row could scroll, nothing was marked either.
+    fakeResizeObservers();
+    mockLayout({ room: 400, tab: 100 });
+    render(<Example defaultValue="overview" />);
+    const list = screen.getByRole('tablist');
+    for (const name of ['data-overflow', 'data-at-start', 'data-at-end']) {
+      expect(list).not.toHaveAttribute(name);
+    }
+    expect(renderToString(<Example defaultValue="overview" />)).not.toMatch(/data-(overflow|at-)/);
+  });
+
+  it('scrolls the row, and not the page, to the selected tab', () => {
+    mockLayout({ room: 250, tab: 100 });
+    const scrollIntoView = vi.fn();
+    vi.stubGlobal('scrollTo', vi.fn());
+    Object.defineProperty(Element.prototype, 'scrollIntoView', {
+      configurable: true,
+      value: scrollIntoView,
+    });
+    try {
+      // Settings, the fourth tab, spans 300px to 400px; the row shows 250px of them.
+      const { rerender } = render(<Example value="settings" onValueChange={() => {}} />);
+      const list = screen.getByRole('tablist');
+      expect(list.scrollLeft).toBe(150);
+      // A parent selects another tab out of view, then one already in view.
+      rerender(<Example value="overview" onValueChange={() => {}} />);
+      expect(list.scrollLeft).toBe(0);
+      rerender(<Example value="members" onValueChange={() => {}} />);
+      expect(list.scrollLeft).toBe(0);
+      expect(scrollIntoView).not.toHaveBeenCalled();
+      expect(window.scrollTo).not.toHaveBeenCalled();
+    } finally {
+      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
+    }
+  });
+
+  it('looks again when a tab inside a memo wrapper mounts', () => {
+    // The wrapper re-renders alone: neither Tabs nor TabsList renders again.
+    const Wrapper = memo(function Wrapper() {
+      const [more, setMore] = useState(false);
+      return (
+        <>
+          <TabsTrigger value="a">A</TabsTrigger>
+          {more ? <TabsTrigger value="b">B</TabsTrigger> : null}
+          <button type="button" onClick={() => setMore(true)}>
+            More
+          </button>
+        </>
+      );
+    });
+    fakeResizeObservers();
+    // The list holds A and the button; B makes three 100px children in 250px.
+    mockLayout({ room: 250, tab: 100 });
+    render(
+      <Tabs defaultValue="a">
+        <TabsList aria-label="Project">
+          <Wrapper />
+        </TabsList>
+      </Tabs>,
+    );
+    const list = screen.getByRole('tablist');
+    expect(list).not.toHaveAttribute('data-overflow');
+    fireEvent.click(screen.getByRole('button', { name: 'More' }));
+    expect(list).toHaveAttribute('data-overflow');
+  });
+
+  it('removes its scroll listener and its ResizeObserver when it unmounts', () => {
+    const observers = fakeResizeObservers();
+    mockLayout({ room: 250, tab: 100 });
+    const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
+    const remove = vi.spyOn(EventTarget.prototype, 'removeEventListener');
+    const { unmount } = render(<Example defaultValue="overview" />);
+    const list = screen.getByRole('tablist');
+    const onList = (spy: typeof add) =>
+      spy.mock.calls.filter(
+        ([type], index) => type === 'scroll' && spy.mock.contexts[index] === list,
+      );
+    expect(onList(add)).toHaveLength(1);
+    expect(observers).toHaveLength(1);
+    unmount();
+    expect(onList(remove).map(([, listener]) => listener)).toEqual([onList(add)[0]?.[1]]);
+    expect(observers[0]?.disconnect).toHaveBeenCalled();
+  });
+
+  it('leaves a vertical list alone', () => {
+    // A characterization test: a vertical list never scrolled sideways.
+    const observers = fakeResizeObservers();
+    mockLayout({ room: 250, tab: 100 });
+    const add = vi.spyOn(EventTarget.prototype, 'addEventListener');
+    render(<Example defaultValue="settings" orientation="vertical" />);
+    const list = screen.getByRole('tablist');
+    expect(list).not.toHaveAttribute('data-overflow');
+    expect(list.scrollLeft).toBe(0);
+    expect(add.mock.contexts).not.toContain(list);
+    expect(observers).toEqual([]);
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/tabs
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs
```

Expected: FAIL. Test unit nằm trong `describe('Tabs that do not fit')`; jsdom không có layout nên test dùng `mockLayout()` và một `ResizeObserver` giả.
- `marks a row whose tabs do not fit, and the edges it has been scrolled to`: `expect(element).toHaveAttribute("data-overflow")`.
- `scrolls the row, and not the page, to the selected tab`: `AssertionError: expected +0 to be 150`.
- `looks again when a tab inside a memo wrapper mounts`: `expect(element).toHaveAttribute("data-overflow")`.
- `removes its scroll listener and its ResizeObserver when it unmounts`: `AssertionError: expected [] to have a length of 1 but got +0`.
- Story `Tabs/Overflow` và `Tabs/OverflowControlled`, cả ba trình duyệt: `expect(element).toHaveAttribute("data-overflow")` (và `data-at-start` cho `OverflowControlled`).
- Hai test `marks nothing while the tabs fit, nor in the HTML from the server` và `leaves a vertical list alone` là đặc tính, pass trước.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 5e970bb..a3ef28f 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -330,15 +330,16 @@ Số liệu lấy từ mockup đã duyệt. Mọi giá trị đều dùng token
   - Tab bo `--flg-radius-full`.
   - Tab đang chọn có nền `--flg-accent-subtle`, chữ `--flg-accent-text`.
 - **Khi hàng tab ngang không đủ chỗ** (ngoài mockup; chủ dự án chọn qua ảnh chụp, Plan E2):
-  - Hàng tab cuộn ngang, có thanh cuộn mảnh (`scrollbar-width: thin`) màu `--flg-text-muted` pha trong suốt. Windows luôn hiện thanh; macOS và điện thoại chỉ hiện khi đang cuộn.
+  - Khi lib đã đo thấy tràn (`data-overflow`, xem dưới), hàng tab cuộn ngang, có thanh cuộn mảnh (`scrollbar-width: thin`) màu `--flg-text-muted` pha trong suốt. Windows luôn hiện thanh; macOS và điện thoại chỉ hiện khi đang cuộn.
   - Mép nào còn tab khuất thì mờ dần trên 36px (`mask-image`). Lib đánh dấu mép đã chạm (`data-at-start`, `data-at-end`) khi cuộn và khi kích thước đổi.
   - Khi đủ chỗ, hàng tab trông đúng như mockup T1–T3: không thanh cuộn, không vệt mờ, không xê dịch. Ảnh chuẩn visual hiện có kiểm điều này.
-  - Vòng focus không bị cắt: hàng tab có padding 6px, bù lại bằng margin âm 6px. Đường kẻ dưới của `underline` vẽ bằng nền `local` của hàng tab, nên chạy dài theo cả phần cuộn và vạch của tab đang chọn vẫn nằm đè lên nó.
-  - Lúc mount, hàng tab cuộn để tab đang chọn nằm trong tầm nhìn. Lib đặt `scrollLeft` của hàng tab, không gọi `scrollIntoView`, để trang không bị cuộn theo. Khi phím mũi tên chuyển focus, trình duyệt tự cuộn tới tab mới.
+  - Vòng focus không bị cắt: khi tràn, hàng tab có padding 6px, bù lại bằng margin âm 6px. Với `segmented`, rãnh là content box của hàng tab, quanh nó 3px padding trống, và các tab giữ 3px trong rãnh bằng margin của chính chúng. Đường kẻ dưới của `underline` khi tràn vẽ bằng nền `local` của hàng tab, nên chạy dài theo cả phần cuộn và vạch của tab đang chọn vẫn nằm đè lên nó. Quầng sáng 12px của ring mặc định bị cắt ở 6px, chỗ nó chỉ còn khoảng 4% độ đậm; vòng 3px và viền focus của contrast-more, forced colors nằm trọn trong hàng tab (ghi lại khi làm Plan E2).
+  - Ở forced colors, trình duyệt bỏ nền gradient, nên khi tràn hàng tab `underline` giữ màu của nó (`forced-color-adjust: none`, các tab bên trong vẫn bị ép màu) để đường kẻ còn, màu `CanvasText`. Không có vệt mờ: thanh cuộn của hệ thống đã cho biết hàng tab cuộn được, còn vệt mờ thì hạ độ tương phản mà chế độ này cần (Claude chốt, Plan E2).
+  - Lúc mount, và mỗi khi hàng tab bắt đầu tràn (khung hẹp lại, font web tải xong), hàng tab cuộn để tab đang chọn nằm trọn trong tầm nhìn, ra khỏi vệt mờ: `scroll-padding-inline: 36px` giữ bề rộng vệt mờ. Lib đặt `scrollLeft` của hàng tab, không gọi `scrollIntoView`, để trang không bị cuộn theo. Khi phím mũi tên chuyển focus, trình duyệt tự cuộn tới tab mới, cũng ra khỏi vệt mờ nhờ `scroll-padding`.
   - Hàng tab dọc không đổi.
   - `segmented`: rãnh đứng yên, các tab cuộn bên trong rãnh. `pill`: như `underline`, không có đường kẻ (Claude chốt, Plan E2).
   - Vòng focus của tab không bị cắt tới mức thấy được, ở cả ba kiểu. Nếu một kiểu chỉ đạt được điều đó bằng cách đổi hình khi đủ chỗ, hỏi chủ dự án trước (Claude chốt, Plan E2).
-  - Lib đặt `data-overflow` lên `TabsList` khi hàng tab tràn, cùng `data-at-start` và `data-at-end` (listener `scroll` và `ResizeObserver`). Đây là móc CSS nội bộ, docs không ghi. Vệt mờ chỉ bật khi có `data-overflow`, nên HTML từ server và lần vẽ trước khi hydrate không có vệt mờ (Claude chốt, Plan E2).
+  - Lib đặt `data-overflow` lên `TabsList` khi hàng tab tràn, cùng `data-at-start` và `data-at-end` (listener `scroll` và `ResizeObserver`). Đây là móc CSS nội bộ, docs không ghi. Mọi thứ của trường hợp tràn (cuộn, padding, đường kẻ bằng nền, vệt mờ) chỉ bật khi có `data-overflow`: hộp cuộn bật sẵn thì đổi pixel khi đủ chỗ (đo khi làm Plan E2: đường kẻ gradient lệch 1–2 mức màu so với border, góc rãnh `segmented` lệch, hộp cuộn cắt bóng tab `segmented` đang chọn và nửa dưới vạch `underline`). Vì vậy HTML từ server và lần vẽ trước khi hydrate không có vệt mờ, và hàng tab không đủ chỗ thì tràn ra ngoài như trước Plan E2 cho tới khi hydrate (Claude chốt, Plan E2).
   - Hàng tab cuộn tới tab đang chọn lúc mount, và mỗi khi tab được chọn đổi mà nằm ngoài tầm nhìn, kể cả khi `value` controlled đổi từ ngoài (Claude chốt, Plan E2).
   - Hướng phải sang trái vẫn ngoài phạm vi (§2).
   - Kiểm bằng story chạy ở trình duyệt thật (Chromium, Firefox, WebKit). Story mới `Tabs/Overflow` có ảnh chuẩn visual cho trường hợp tràn (Claude chốt, Plan E2).
diff --git a/src/components/tabs/Tabs.mdx b/src/components/tabs/Tabs.mdx
index 57780b0..817cf94 100644
--- a/src/components/tabs/Tabs.mdx
+++ b/src/components/tabs/Tabs.mdx
@@ -53,6 +53,24 @@ Tabs with no tab selected takes `value={null}`, for example while the address ha
   panels as they go. `"manual"` moves focus only, and Enter or Space selects: use it when showing a
   panel is slow.
 
+## When the tabs do not fit
+
+A horizontal row of tabs wider than its container scrolls sideways, with a thin scroll bar (always
+shown on Windows, while scrolling on macOS and phones), and fades out at an edge with tabs still
+hidden behind it. Tabs that fit look exactly as above.
+
+<Canvas of={Stories.Overflow} />
+
+- The selected tab is scrolled into full view when the Tabs mount, when the row starts to overflow,
+  and whenever the selected tab changes, also when a parent sets `value`. Only the row scrolls,
+  never the page. The arrow keys bring the tab they move to into view.
+- The row can only be narrower than its tabs if its container is. A grid or flex item grows to fit
+  its content by default: give the one around the Tabs `min-width: 0`, or put it in a
+  `minmax(0, 1fr)` track.
+- The row is measured in the browser, so a row that does not fit overflows its container until the
+  page hydrates, then scrolls.
+- Vertical tabs do not scroll. In forced colours there is no fade; the system scroll bar shows.
+
 ## Keyboard
 
 Only the selected tab is in the Tab order; Tab moves on from it to its panel. When no enabled tab
diff --git a/src/components/tabs/Tabs.tsx b/src/components/tabs/Tabs.tsx
index 97edd59..e916328 100644
--- a/src/components/tabs/Tabs.tsx
+++ b/src/components/tabs/Tabs.tsx
@@ -66,10 +66,11 @@ const TabsContext = createContext<TabsContextValue | null>(null);
 /** The tab that takes Tab when no enabled tab is selected; set by `TabsList`. */
 const FallbackContext = createContext<string | null>(null);
 /**
- * Asks `TabsList` to work out the fallback again. A tab calls it when its `disabled` changes: the
- * tab may sit in a memoized component that renders alone, and then the list does not render.
+ * Asks `TabsList` to look at its tabs again: which one takes Tab when none is selected, and whether
+ * they still fit. A tab calls it when it mounts and when its `disabled` changes: the tab may sit in
+ * a memoized component that renders alone, and then the list does not render.
  */
-const RefreshFallbackContext = createContext<() => void>(() => {});
+const RefreshTabsContext = createContext<() => void>(() => {});
 
 function useTabsContext(part: string): TabsContextValue {
   const ctx = useContext(TabsContext);
@@ -108,6 +109,40 @@ function tabsOf(list: HTMLElement): HTMLButtonElement[] {
 /** The value of each tab element, for the list's fallback; kept off the DOM. */
 const values = new WeakMap<HTMLElement, string>();
 
+const px = (value: string) => parseFloat(value) || 0;
+
+/**
+ * Whether a horizontal list needs to scroll. While it does not, the test is whether a child reaches
+ * past its content box by more than a pixel; while it does, whether anything is left to scroll. The
+ * two layouts round differently, and the gap between the tests keeps the list from switching back
+ * and forth at the boundary.
+ */
+function overflows(list: HTMLElement): boolean {
+  if (list.hasAttribute('data-overflow')) return list.scrollWidth > list.clientWidth;
+  const style = getComputedStyle(list);
+  const end =
+    list.getBoundingClientRect().right - px(style.borderRightWidth) - px(style.paddingRight);
+  const reach = Math.max(...Array.from(list.children, (el) => el.getBoundingClientRect().right));
+  return reach > end + 1;
+}
+
+/**
+ * Scrolls a list that scrolls, and only the list (`scrollIntoView` would scroll the page too), so
+ * its selected tab is in full view and clear of the fades, whose width the list's `scroll-padding`
+ * holds. A tab wider than the view shows its start.
+ */
+function revealSelected(list: HTMLElement) {
+  const tab = tabsOf(list).find((item) => item.getAttribute('aria-selected') === 'true');
+  if (!tab) return;
+  const style = getComputedStyle(list);
+  const left = list.getBoundingClientRect().left + list.clientLeft;
+  const start = left + px(style.scrollPaddingLeft);
+  const end = left + list.clientWidth - px(style.scrollPaddingRight);
+  const rect = tab.getBoundingClientRect();
+  if (rect.left < start) list.scrollLeft -= start - rect.left;
+  else if (rect.right > end) list.scrollLeft += Math.min(rect.right - end, rect.left - start);
+}
+
 /**
  * Tabs: a list of tabs, each showing its own panel. Every panel stays mounted; the ones not selected
  * are `hidden`. `TabsList`, `TabsTrigger` and `TabsContent` go inside.
@@ -160,7 +195,10 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
   // With no enabled tab selected (no value yet, or the selected one is disabled), Tab would skip the
   // list: the first enabled tab takes Tab instead. Known only once the tabs are in the document.
   const [fallback, setFallback] = useState<string | null>(null);
-  const refreshFallback = useCallback(() => {
+  // Set by the effect below while the list is horizontal: looks again at whether the tabs fit and,
+  // when asked, brings the selected tab into view.
+  const overflowRef = useRef<((reveal: boolean) => void) | null>(null);
+  const refreshTabs = useCallback(() => {
     const list = listRef.current;
     if (!list) return;
     const tabs = tabsOf(list);
@@ -170,11 +208,12 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
     const first = reachable ? undefined : tabs.find((tab) => !tab.disabled);
     const next = first ? (values.get(first) ?? null) : null;
     setFallback((current) => (current === next ? current : next));
+    overflowRef.current?.(false);
   }, []);
   useIsoLayoutEffect(() => {
     const list = listRef.current;
     if (!list) return;
-    refreshFallback();
+    refreshTabs();
     const tabs = tabsOf(list);
     const seen = new Set<string>();
     for (const tab of tabs) {
@@ -189,6 +228,66 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
       seen.add(value);
     }
   });
+  const horizontal = ctx.orientation === 'horizontal';
+  // A horizontal list whose tabs do not fit scrolls (see tabs.css). It carries `data-overflow` while
+  // it does, and `data-at-start` or `data-at-end` while scrolled to that edge, which turns the fade
+  // there off. Vertical lists stay as they are.
+  useIsoLayoutEffect(() => {
+    const list = listRef.current;
+    if (!list || !horizontal) return;
+    const markEdges = () => {
+      const overflow = list.hasAttribute('data-overflow');
+      const { scrollLeft, clientWidth, scrollWidth } = list;
+      list.toggleAttribute('data-at-start', overflow && scrollLeft <= 1);
+      list.toggleAttribute('data-at-end', overflow && scrollLeft + clientWidth >= scrollWidth - 1);
+    };
+    let observer: ResizeObserver | undefined;
+    const watched = new WeakSet<Element>();
+    const update = (reveal: boolean) => {
+      for (const el of [list, ...Array.from(list.children)]) {
+        if (watched.has(el)) continue;
+        watched.add(el);
+        observer?.observe(el);
+      }
+      const was = list.hasAttribute('data-overflow');
+      const overflow = overflows(list);
+      list.toggleAttribute('data-overflow', overflow);
+      // A list that has just started to scroll (on mount, or its room shrank, or a web font arrived)
+      // shows its selected tab.
+      if (overflow && (reveal || !was)) revealSelected(list);
+      markEdges();
+    };
+    // The list's width follows its container, and its children's widths follow their labels and the
+    // fonts. The look waits for the next frame: switching layouts resizes the list, which the
+    // observer would otherwise have to report again within this one, a "loop" error.
+    let frame = 0;
+    if (typeof ResizeObserver !== 'undefined') {
+      observer = new ResizeObserver((entries) => {
+        for (const entry of entries) {
+          if (!entry.target.isConnected) observer?.unobserve(entry.target);
+        }
+        cancelAnimationFrame(frame);
+        frame = requestAnimationFrame(() => update(false));
+      });
+    }
+    overflowRef.current = update;
+    update(false);
+    list.addEventListener('scroll', markEdges, { passive: true });
+    return () => {
+      overflowRef.current = null;
+      cancelAnimationFrame(frame);
+      observer?.disconnect();
+      list.removeEventListener('scroll', markEdges);
+      for (const name of ['data-overflow', 'data-at-start', 'data-at-end']) {
+        list.removeAttribute(name);
+      }
+    };
+  }, [horizontal]);
+  // The selected tab comes into view whenever it changes, whoever changed it: a parent may set
+  // `value`. One the arrow keys moved to is in view already, as the browser scrolled to it on focus.
+  useIsoLayoutEffect(() => {
+    overflowRef.current?.(true);
+  }, [ctx.value]);
   // A key on one of the list's own tabs moves from that tab. Focus selects the tab it lands on in
   // automatic mode (see TabsTrigger).
   const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
@@ -199,7 +298,7 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
     focusNext(event, tabs, { orientation: ctx.orientation, loop: true }, tab);
   };
   return (
-    <RefreshFallbackContext.Provider value={refreshFallback}>
+    <RefreshTabsContext.Provider value={refreshTabs}>
       <FallbackContext.Provider value={fallback}>
         {/* The tabs take focus, not the list: the arrow keys reach it from the focused tab (APG). */}
         {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
@@ -213,7 +312,7 @@ export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsL
           onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
         />
       </FallbackContext.Provider>
-    </RefreshFallbackContext.Provider>
+    </RefreshTabsContext.Provider>
   );
 });
 
@@ -224,17 +323,18 @@ export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(funct
 ) {
   const ctx = useTabsContext('TabsTrigger');
   const fallback = useContext(FallbackContext);
-  const refreshFallback = useContext(RefreshFallbackContext);
+  const refreshTabs = useContext(RefreshTabsContext);
   const selected = ctx.value === value;
   // A press focuses the tab, then clicks it; an arrow key focuses a tab, then Enter or Space clicks
   // it. In automatic mode the focus selects, and the click after it does not select again: a parent
   // that commits later (a router) would get it twice. A new pointer press asks again.
   const selectedOnFocus = useRef(false);
-  // Whether this tab can be the fallback depends on its `disabled`, and a render of this tab alone
-  // (inside a memoized component) does not make the list look again.
+  // Whether this tab can be the fallback depends on its `disabled`, and whether the tabs fit on this
+  // tab being there; a render of this tab alone (inside a memoized component) does not make the list
+  // look again.
   useIsoLayoutEffect(() => {
-    refreshFallback();
-  }, [disabled, refreshFallback]);
+    refreshTabs();
+  }, [disabled, refreshTabs]);
   const register = useMemo(
     () =>
       mergeRefs(ref, (el: HTMLButtonElement | null) => {
diff --git a/src/styles/components/tabs.css b/src/styles/components/tabs.css
index 339040f..612fc9f 100644
--- a/src/styles/components/tabs.css
+++ b/src/styles/components/tabs.css
@@ -99,6 +99,12 @@
     border-radius: var(--flg-radius-md);
     background: var(--flg-control-track);
   }
+  /* No wider than the row has room for, so tabs that do not fit overflow the track, where TabsList
+     can see it. */
+  .flg-tabs-list[data-variant='segmented']:not([aria-orientation='vertical']) {
+    box-sizing: border-box;
+    max-width: 100%;
+  }
   .flg-tabs-list[data-variant='segmented'] .flg-tabs-trigger {
     height: 28px;
     border-radius: calc(var(--flg-radius-md) - 3px);
@@ -120,4 +126,70 @@
     background: var(--flg-selected-bg);
     color: var(--flg-selected-text);
   }
+
+  /* A horizontal row of tabs that does not fit scrolls (outside the mockup). TabsList marks it with
+     `data-overflow` while its tabs are wider than it is, and only then does any of this apply: tabs
+     that fit keep the look of the mockup exactly. A scroll box clips at its padding edge, so 6px of
+     padding keeps the focus ring of a tab inside it, and the negative margin gives that room back:
+     the tabs stay where they were. `scroll-padding` makes the arrow keys bring a tab clear of the
+     fade, and TabsList reads it for the selected tab too. */
+  .flg-tabs-list[data-overflow] {
+    overflow-x: auto;
+    overflow-y: hidden;
+    overscroll-behavior-x: contain;
+    scroll-padding-inline: 36px;
+    scrollbar-width: thin;
+    scrollbar-color: color-mix(in srgb, var(--flg-text-muted) 45%, transparent) transparent;
+    margin: -6px;
+    padding: 6px;
+    /* An edge with tabs still hidden behind it fades out; `data-at-start` and `data-at-end` mark the
+       edges the row has been scrolled to. */
+    mask-image: linear-gradient(
+      to right,
+      transparent,
+      #000 36px,
+      #000 calc(100% - 36px),
+      transparent
+    );
+  }
+  .flg-tabs-list[data-overflow][data-at-start] {
+    mask-image: linear-gradient(to left, transparent, #000 36px);
+  }
+  .flg-tabs-list[data-overflow][data-at-end] {
+    mask-image: linear-gradient(to right, transparent, #000 36px);
+  }
+  .flg-tabs-list[data-overflow][data-at-start][data-at-end] {
+    mask-image: none;
+  }
+  /* The hairline becomes a background that scrolls with the tabs (`local`), so it runs the full
+     width of the row. A border would sit outside the padding edge, where the scroll box clips the
+     lower half of the selected tab's bar. */
+  .flg-tabs-list[data-variant='underline'][data-overflow] {
+    margin-bottom: -5px;
+    border-bottom: 0;
+    background: linear-gradient(var(--flg-control-border), var(--flg-control-border)) left 6px
+      bottom 5px / calc(100% - 12px) 1px no-repeat local;
+  }
+  /* The track stays put and the tabs scroll inside it. The track is the content box, with 3px of
+     clear padding around it for the focus ring. Inside it the tabs keep 3px from its edges and 4px
+     between them through their own margins and a 1px spacer at each end, not a gap: Firefox leaves
+     a negative margin, and what it cancels, out of the scroll width, which would put the last tab
+     against the end of the track. */
+  .flg-tabs-list[data-variant='segmented'][data-overflow] {
+    gap: 0;
+    max-width: calc(100% + 6px);
+    margin: -3px;
+    padding: 3px;
+    border-radius: calc(var(--flg-radius-md) + 3px);
+    background-clip: content-box;
+  }
+  .flg-tabs-list[data-variant='segmented'][data-overflow] .flg-tabs-trigger {
+    margin: 3px 2px;
+  }
+  .flg-tabs-list[data-variant='segmented'][data-overflow]::before,
+  .flg-tabs-list[data-variant='segmented'][data-overflow]::after {
+    content: '';
+    flex: none;
+    width: 1px;
+  }
 }
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index fa2dfbb..2de982f 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -201,6 +201,22 @@
       .flg-tabs-trigger[aria-selected='true'] {
       border-color: Highlight;
     }
+    /* A row of tabs that scrolls: the system scroll bar shows that it does, and a fade would lower
+       the contrast this mode is for. */
+    .flg-tabs-list[data-overflow] {
+      mask-image: none;
+    }
+    /* Forced colours drop gradients, and the underline's hairline is one while the row scrolls. The
+       list keeps its own colours, so the line stays, in the text colour; its tabs are forced as
+       usual, and the scroll bar is the system's. */
+    .flg-tabs-list[data-variant='underline'][data-overflow] {
+      forced-color-adjust: none;
+      background-image: linear-gradient(CanvasText, CanvasText);
+      scrollbar-color: auto;
+    }
+    .flg-tabs-list[data-variant='underline'][data-overflow] > * {
+      forced-color-adjust: auto;
+    }
     .flg-accordion-item + .flg-accordion-item {
       border-color: CanvasText;
     }
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/tabs
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs
pnpm build && pnpm check:package
```

Expected: 50 unit test PASS; 48 story test PASS (8 story × 3 trình duyệt × 2 theme); gói PASS với ngưỡng cũ (draft: JS 27.74 kB, CSS 6.45 kB). Visual test của `Tabs/Overflow` fail cho tới khi workflow tạo ảnh chuẩn; đó là chủ ý.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md \n  src/components/tabs/Tabs.mdx \n  src/components/tabs/Tabs.stories.tsx \n  src/components/tabs/Tabs.test.tsx \n  src/components/tabs/Tabs.tsx \n  src/styles/components/tabs.css \n  src/styles/preferences.css
```
```bash
git commit -m "feat(tabs): a row of tabs that does not fit scrolls, with a thin bar and a fade" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Select, giá trị không khớp, cảnh báo rõ hơn, cuộn chỉ theo phím

Spec §6.3 Select và §5, các dòng "Plan E2" và "Claude chốt":
- **Giá trị không khớp** (chọn nhiều): một giá trị trong `value` không khớp item nào vẫn được giữ, ở đúng chỉ số cũ. `choose` bật hoặc tắt trong mảng hiện có, rồi điền lại các ô của giá trị khớp theo thứ tự trong list. Chip và `<select>` ẩn vẫn chỉ hiện item khớp; cảnh báo dev vẫn có.
- **Cảnh báo:** `value` rỗng và `value` không phải chuỗi của `SelectItem` có hai thông điệp khác nhau; hai lời gọi `useControllableState` tên `Select value` và `Select open`.
- **Cuộn chỉ theo phím:** khi mở, list chỉ cuộn tới option được highlight nếu highlight đến từ bàn phím hoặc typeahead, không bao giờ từ con trỏ. Lúc mở, cuộn một lần trong `onPlaced`.

**Files:**
- Modify: `src/components/select/Select.tsx`, `src/components/select/select-rows.ts`, `src/components/select/Select.mdx`
- Test: `src/components/select/Select.test.tsx`, `src/components/select/Select.stories.tsx`

**Interfaces:**
- Consumes: `usePopoverState` (đã nhận `name`), từ Task 1 các ref `latest` của Select đã ở layout effect.
- Produces: `NOT_A_STRING` (nội bộ, `select-rows.ts`); trong `Select.tsx` ref `keyed` và hàm `highlight(index, fromKeys)`: phím và typeahead truyền `true`; con trỏ, `openAt` và effect mở/đóng truyền `false`. Story `Select/LongListPointerDoesNotScroll` (`no-visual`, cần input thật).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/select/Select.stories.tsx b/src/components/select/Select.stories.tsx
index df8723b..32ffc3c 100644
--- a/src/components/select/Select.stories.tsx
+++ b/src/components/select/Select.stories.tsx
@@ -610,6 +610,54 @@ export const LongList: Story = {
   },
 };
 
+// The pointer highlights what it is over without moving the list; the keyboard moves it to keep the
+// highlight in view.
+export const LongListPointerDoesNotScroll: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={column}>
+      <Field label="Option">
+        <Select defaultValue="Option 1">
+          {MANY.map((name) => (
+            <SelectItem key={name} value={name}>
+              {name}
+            </SelectItem>
+          ))}
+        </Select>
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const trigger = canvas.getByRole('combobox', { name: 'Option' });
+    const listbox = listboxIn(canvasElement);
+    await real.click(trigger);
+    await waitFor(() => expect(listbox.matches(':popover-open')).toBe(true));
+    await settled(listbox);
+    await expect(listbox.scrollTop, 'after open').toBe(0);
+    // The last option that is in view, cut by the bottom edge or not: the one that a highlight
+    // scrolls into view.
+    const box = listbox.getBoundingClientRect();
+    const options = within(listbox).getAllByRole('option');
+    const lastInView = options.findLast(
+      (option) => option.getBoundingClientRect().top < box.bottom,
+    )!;
+    await real.hover(lastInView, { position: { x: 12, y: 2 } });
+    await waitFor(() => expect(trigger.getAttribute('aria-activedescendant')).toBe(lastInView.id));
+    await delay(100);
+    await expect(listbox.scrollTop, 'after hover').toBe(0);
+    // The keyboard moves on from there, and the list follows it.
+    await real.keyboard('{ArrowDown}');
+    await real.keyboard('{ArrowDown}');
+    await waitFor(() => expect(listbox.scrollTop).toBeGreaterThan(0));
+    const highlighted = canvasElement.querySelector<HTMLElement>('[data-highlighted]')!;
+    await expect(highlighted.getBoundingClientRect().bottom).toBeLessThanOrEqual(
+      listbox.getBoundingClientRect().bottom + 1,
+    );
+  },
+};
+
 // Room for the 320px cap below the trigger, but not for the whole list, and more room above.
 export const LongListLowOnThePage: Story = {
   tags: ['no-visual'],
diff --git a/src/components/select/Select.test.tsx b/src/components/select/Select.test.tsx
index 60c5819..b6c6386 100644
--- a/src/components/select/Select.test.tsx
+++ b/src/components/select/Select.test.tsx
@@ -84,6 +84,105 @@ describe('Select', () => {
     );
   });
 
+  it('tells an empty SelectItem value from one that is not a string', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(
+      <Select aria-label="Sort">
+        <SelectItem value="">Nothing</SelectItem>
+        <SelectItem value={5 as unknown as string}>Five</SelectItem>
+      </Select>,
+    );
+    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/needs a value that is not empty/));
+    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/needs a value that is a string/));
+  });
+
+  it('names the prop that switches between controlled and not', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const { rerender } = render(
+      <Select aria-label="Sort" defaultValue="a" onValueChange={() => {}}>
+        <SelectItem value="a">A</SelectItem>
+      </Select>,
+    );
+    rerender(
+      <Select aria-label="Sort" value="a" open={false} onValueChange={() => {}}>
+        <SelectItem value="a">A</SelectItem>
+      </Select>,
+    );
+    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\] Select value is changing from/));
+    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/\] Select open is changing from/));
+  });
+
+  describe('a multiple Select whose value has no item', () => {
+    const items = (
+      <>
+        <SelectItem value="a">A</SelectItem>
+        <SelectItem value="b">B</SelectItem>
+      </>
+    );
+    // The listbox's option: the native <select> has one of the same name, and no id.
+    const option = (name: string) =>
+      screen.getAllByRole('option', { name, hidden: true }).find((o) => o.id !== '')!;
+
+    it('keeps the value where it was when another option is turned on', () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const onValueChange = vi.fn();
+      render(
+        <Select multiple aria-label="Tags" value={['gone', 'a']} onValueChange={onValueChange}>
+          {items}
+        </Select>,
+      );
+      fireEvent.click(option('B'));
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['gone', 'a', 'b']);
+    });
+
+    it('keeps the value where it was when another option is turned off', () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const onValueChange = vi.fn();
+      render(
+        <Select multiple aria-label="Tags" value={['gone', 'a']} onValueChange={onValueChange}>
+          {items}
+        </Select>,
+      );
+      fireEvent.click(option('A'));
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['gone']);
+    });
+
+    it('keeps the matched values in list order, and it in its place', () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const onValueChange = vi.fn();
+      render(
+        <Select multiple aria-label="Tags" value={['b', 'gone']} onValueChange={onValueChange}>
+          {items}
+        </Select>,
+      );
+      fireEvent.click(option('A'));
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(['a', 'gone', 'b']);
+    });
+
+    it('warns, and shows and submits only the items it has', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      render(
+        <Select
+          multiple
+          aria-label="Tags"
+          name="tags"
+          value={['gone', 'a']}
+          onValueChange={() => {}}
+        >
+          {items}
+        </Select>,
+      );
+      expect(warn).toHaveBeenCalledWith(
+        '[fl-glass-ui] <Select> has a value that matches no SelectItem: "gone".',
+      );
+      const trigger = screen.getByRole('combobox', { name: 'Tags' });
+      expect(trigger).toHaveTextContent('A');
+      expect(trigger).not.toHaveTextContent('gone');
+      const native = document.querySelector<HTMLSelectElement>('select[name="tags"]')!;
+      expect(Array.from(native.selectedOptions, (o) => o.value)).toEqual(['a']);
+    });
+  });
+
   it('warns when a part is rendered outside a Select', () => {
     const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
     render(
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/select src/internal
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
```

Expected: FAIL.
- Nhóm `a multiple Select whose value has no item`, `keeps the value where it was when another option is turned on`: `expected "vi.fn()" to be called once with arguments: [ [ 'gone', 'a', 'b' ] ]` (code cũ chỉ phát giá trị khớp). Các test `... turned off` và `keeps the matched values in list order, …` fail tương tự. `warns, and shows and submits only the items it has` là đặc tính, pass trước.
- `tells an empty SelectItem value from one that is not a string`: `expected "warn" to be called with arguments: [ StringMatching ]` (chưa có thông điệp "is a string"); `names the prop that switches between controlled and not` fail tương tự cho `Select value` và `Select open`.
- Story `LongListPointerDoesNotScroll`, cả ba trình duyệt: `after hover: expected 16 to be +0`. `hover` của Playwright tự cuộn đích vào view nếu điểm hover ở ngoài vùng thấy được, nên story hover ở `position: { x: 12, y: 2 }`, trong phần option còn thấy; không có tuỳ chọn này, lỗi bị che.
- Việc bỏ lần cuộn dư trong commit mở là refactor, không có test fail trước; các story `LongList` có sẵn vẫn pass.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/select/Select.mdx b/src/components/select/Select.mdx
index 8d476a3..21057ed 100644
--- a/src/components/select/Select.mdx
+++ b/src/components/select/Select.mdx
@@ -44,6 +44,10 @@ options show as chips; when they do not all fit, the rest become one "+N" chip.
 always shows, cut short with an ellipsis when it alone is too wide. The chips are for the eye
 only: the trigger also carries the full list as text for screen readers.
 
+A value in `value` that matches no item (an item that loads later) is kept, in its place, when the user
+turns another option on or off, and `onValueChange` receives it with the rest. It shows no chip, and the
+hidden native `<select>` leaves it out. In development, the Select warns about it.
+
 <Canvas of={Stories.MultipleOpen} />
 
 ## In a form
diff --git a/src/components/select/Select.tsx b/src/components/select/Select.tsx
index d7e6722..3c8d7f3 100644
--- a/src/components/select/Select.tsx
+++ b/src/components/select/Select.tsx
@@ -145,7 +145,7 @@ export const Select = markAsFieldControl(
       value: props.value,
       defaultValue,
       onChange: props.onValueChange as ((value: string | null | string[]) => void) | undefined,
-      name: 'Select',
+      name: 'Select value',
     });
     const chosen: string[] = Array.isArray(value)
       ? value
@@ -167,7 +167,7 @@ export const Select = markAsFieldControl(
       open: props.open,
       defaultOpen: props.defaultOpen ?? false,
       onOpenChange: props.onOpenChange,
-      name: 'Select',
+      name: 'Select open',
     });
     const [highlighted, setHighlighted] = useState<number | null>(null);
     // The highlight can outlive its option (the list changed while open): only an enabled one counts.
@@ -188,14 +188,23 @@ export const Select = markAsFieldControl(
     /** The chosen option, or the first (`"Home"`) or last (`"End"`) one that can be chosen. */
     const startAt = (edge: 'Home' | 'End') =>
       first && !first.disabled ? first.index : move(-1, edge);
-    const openAt = (index: number | null) => {
+    // Whether the last change of the highlight came from the keyboard or typeahead. Only those scroll
+    // the list: a pointer over an option at the edge must not move what it is pointing at. Written
+    // in the event that changes the highlight, read in the layout effect that follows it.
+    const keyed = useRef(false);
+    const highlight = (index: number | null, fromKeys: boolean) => {
+      keyed.current = fromKeys;
       setHighlighted(index);
+    };
+    // An opening scrolls once the listbox is placed (`onPlaced`), not when it commits.
+    const openAt = (index: number | null) => {
+      highlight(index, false);
       request(true);
     };
     // Opened without a highlight (`defaultOpen`, a controlled `open`): the chosen option, or the first.
     useIsoLayoutEffect(() => {
-      if (open && highlighted === null) setHighlighted(startAt('Home'));
-      if (!open) setHighlighted(null);
+      if (open && highlighted === null) highlight(startAt('Home'), false);
+      if (!open) highlight(null, false);
       // Only an opening or a closing decides this; the highlight itself changes it after that.
     }, [open]);
 
@@ -214,8 +223,15 @@ export const Select = markAsFieldControl(
       const next = chosen.includes(option.value)
         ? chosen.filter((one) => one !== option.value)
         : [...chosen, option.value];
-      // In the order of the list, so the chips do not reorder as options are toggled.
-      setValue(options.filter((one) => next.includes(one.value)).map((one) => one.value));
+      // The values that match an item go in the order of the list, so the chips do not reorder as
+      // options are toggled. One that matches no item (an item that loads later) stays where it was.
+      const inListOrder = options.filter((one) => next.includes(one.value)).map((one) => one.value);
+      let matched = 0;
+      setValue(
+        next.map((one) =>
+          options.some((candidate) => candidate.value === one) ? inListOrder[matched++]! : one,
+        ),
+      );
     };
 
     // --- Typeahead: open, it moves the highlight; closed (choose one), it changes the value.
@@ -241,7 +257,7 @@ export const Select = markAsFieldControl(
     });
     const onTypeaheadMatch = useCallback((el: HTMLElement) => {
       const index = Number(el.dataset.index);
-      if (latest.current.open) setHighlighted(index);
+      if (latest.current.open) highlight(index, true);
       else chooseRef.current(index);
     }, []);
     const typeahead = useTypeahead(optionElements, onTypeaheadMatch, currentOption);
@@ -278,7 +294,7 @@ export const Select = markAsFieldControl(
       if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
         event.preventDefault();
         const next = move(active ?? -1, key);
-        if (next !== null) setHighlighted(next);
+        if (next !== null) highlight(next, true);
       } else if (key === 'Enter' || key === ' ') {
         event.preventDefault();
         if (event.repeat) return;
@@ -330,8 +346,10 @@ export const Select = markAsFieldControl(
       onPlaced: scrollToHighlighted,
     });
     useIsoLayoutEffect(() => {
-      if (open) scrollToHighlighted();
-    }, [open, highlighted]);
+      if (open && keyed.current) scrollToHighlighted();
+      // Only the highlight decides this: an opening scrolls in `onPlaced`, and the flag says whether
+      // the keyboard moved it.
+    }, [highlighted]);
 
     // --- The hidden native <select>: kept in step with the value for forms. Synced again when the
     // value or the options change, and on `resync`: after a form reset or an autofill, which change
@@ -414,7 +432,7 @@ export const Select = markAsFieldControl(
             data-text-value={option.text}
             className="flg-menu-item flg-select-option"
             onPointerMove={(event) => {
-              if (event.pointerType !== 'touch' && !option.disabled) setHighlighted(option.index);
+              if (event.pointerType !== 'touch' && !option.disabled) highlight(option.index, false);
             }}
             onClick={() => choose(option)}
           >
diff --git a/src/components/select/select-rows.ts b/src/components/select/select-rows.ts
index 821bb1f..61e4f93 100644
--- a/src/components/select/select-rows.ts
+++ b/src/components/select/select-rows.ts
@@ -14,6 +14,7 @@ const UNKNOWN_CHILD =
 const EMPTY_VALUE =
   '<SelectItem> needs a value that is not empty: the empty value is how the native select says ' +
   'nothing is chosen. The item is skipped.';
+const NOT_A_STRING = '<SelectItem> needs a value that is a string. The item is skipped.';
 
 /** One option of the Select, in the order the listbox shows it. */
 export interface Option {
@@ -56,7 +57,7 @@ function toRows(parts: CollectedPart[], options: Option[], path: string): Row[]
     } else {
       const props = part.props as unknown as SelectItemProps;
       if (typeof props.value !== 'string' || props.value === '') {
-        devWarn(EMPTY_VALUE);
+        devWarn(typeof props.value === 'string' ? EMPTY_VALUE : NOT_A_STRING);
         return;
       }
       const option: Option = {
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/select src/internal
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
```

Expected: 248 unit test PASS (3 skip); 84 story test PASS. Task này không đổi export, CSS hay gói.

- [ ] **Step 5: Commit**

```bash
git add src/components/select/Select.mdx \n  src/components/select/Select.stories.tsx \n  src/components/select/Select.test.tsx \n  src/components/select/Select.tsx \n  src/components/select/select-rows.ts
```
```bash
git commit -m "fix(select): keep unmatched values, name the warnings, scroll the list only for keys" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: `renderLink` của Pagination

Spec §6.3 Pagination: dòng `renderLink` trong khối kiểu và bullet "Có `getHref` và `renderLink`" cùng các bullet con.

- `renderLink?: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }, page: number) => ReactElement`. Mọi link có `href` (link trang, trước, sau) đi qua nó; trước và sau vẫn nằm trong `IconButton asChild` bao quanh phần tử nó trả về. Các nút đầu và cuối không có `href` giữ `<a role="link" aria-disabled>` của lib. `props.onClick` là handler của lib.
- `renderLink` không có `getHref` bị bỏ qua, kèm `devWarn`.
- Một hàm dựng duy nhất (`link`) thay cho hai dạng `<a>` khác nhau, để `renderLink` có một chỗ cắm.
- Fixture Next.js: `Pagination` dùng `getHref` và `renderLink={(props) => <Link {...props} />}`; kịch bản fixture chứng minh bấm trang không tải lại tài liệu.
- Một click mà người dùng đã `preventDefault` thì lib bỏ qua.

**Files:**
- Modify: `src/components/pagination/Pagination.tsx`, `src/components/pagination/Pagination.mdx`, `fixtures/next-app/app/pages.tsx`, `scripts/test-fixtures.mjs`
- Test: `src/components/pagination/Pagination.test.tsx`

**Interfaces:**
- Consumes: không.
- Produces: prop `renderLink` của `Pagination`; kiểu props của nó viết thẳng tại chỗ, không export. Ở fixture, kịch bản đặt `window.keptAcrossPageClick`, bấm trang 6, và với link thì đợi URL `?page=6` rồi kiểm tra giá trị còn đó. Fixture Vite vẫn dùng nút, nên kiểm tra này chỉ chạy khi điều khiển trang là `<a>`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/pagination/Pagination.test.tsx b/src/components/pagination/Pagination.test.tsx
index 21eb893..c9f0b63 100644
--- a/src/components/pagination/Pagination.test.tsx
+++ b/src/components/pagination/Pagination.test.tsx
@@ -1,14 +1,28 @@
 import { fireEvent, render, screen, within } from '@testing-library/react';
+import { forwardRef } from 'react';
+import type { AnchorHTMLAttributes } from 'react';
 import { renderToString } from 'react-dom/server';
-import { afterEach, describe, expect, it, vi } from 'vitest';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
 import { Pagination } from './Pagination';
 
+type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
+
+// What a router's Link does: it takes every prop and the ref down to its <a>, and marks itself.
+const TestLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
+  function TestLink(props, ref) {
+    // eslint-disable-next-line jsx-a11y/anchor-has-content -- the children are in `props`.
+    return <a ref={ref} data-router-link="" {...props} />;
+  },
+);
+
 const pages = (nav: HTMLElement) =>
   Array.from(nav.querySelectorAll('.flg-pagination-page, .flg-pagination-ellipsis'), (el) =>
     el.classList.contains('flg-pagination-ellipsis') ? '…' : el.textContent,
   ).join(' ');
 
 describe('Pagination', () => {
+  beforeEach(() => resetDevWarnings());
   afterEach(() => vi.restoreAllMocks());
 
   it('names the pages and marks the current one', () => {
@@ -185,4 +199,113 @@ describe('Pagination', () => {
     expect(html).toContain('aria-current="page"');
     expect(html).toContain('aria-label="Pagination"');
   });
+
+  describe('renderLink', () => {
+    it('renders every link with an href through it, with the page', () => {
+      const renderLink = vi.fn((props: LinkProps, page: number) => (
+        <TestLink {...props} data-page={page} />
+      ));
+      render(
+        <Pagination
+          count={5}
+          defaultPage={2}
+          getHref={(page) => `#page-${page}`}
+          renderLink={renderLink}
+        />,
+      );
+      const nav = screen.getByRole('navigation');
+      // Five pages, and the previous and next links.
+      expect(nav.querySelectorAll('[data-router-link]')).toHaveLength(7);
+      expect(screen.getByRole('link', { name: 'Page 4' })).toHaveAttribute('data-router-link');
+      const calls = renderLink.mock.calls.map(([props, page]) => [props.href, page]);
+      expect(calls).toContainEqual(['#page-4', 4]);
+      // Previous and next are told the page they lead to.
+      expect(calls).toContainEqual(['#page-1', 1]);
+      expect(calls).toContainEqual(['#page-3', 3]);
+      const props = renderLink.mock.calls.find(([, page]) => page === 4)![0];
+      expect(props).toMatchObject({ 'aria-label': 'Page 4', className: 'flg-pagination-page' });
+      expect(props.onClick).toBeTypeOf('function');
+      expect(screen.getByRole('link', { name: 'Page 4' })).toHaveAttribute('data-page', '4');
+    });
+
+    it('keeps the button classes and the name of previous and next', () => {
+      render(
+        <Pagination
+          count={5}
+          defaultPage={2}
+          getHref={(page) => `#page-${page}`}
+          renderLink={(props) => <TestLink {...props} />}
+        />,
+      );
+      const next = screen.getByRole('link', { name: 'Next page' });
+      expect(next).toHaveAttribute('data-router-link');
+      expect(next).toHaveAttribute('href', '#page-3');
+      expect(next).toHaveClass('flg-button');
+      expect(next).toHaveAttribute('data-icon-only');
+    });
+
+    it('leaves the links at the ends, which have no href, to the library', () => {
+      const renderLink = vi.fn((props: LinkProps) => <TestLink {...props} />);
+      render(<Pagination count={1} getHref={(page) => `#page-${page}`} renderLink={renderLink} />);
+      for (const name of ['Previous page', 'Next page']) {
+        const link = screen.getByRole('link', { name });
+        expect(link).not.toHaveAttribute('data-router-link');
+        expect(link).not.toHaveAttribute('href');
+        expect(link).toHaveAttribute('aria-disabled', 'true');
+      }
+      // Only page 1 went through it.
+      expect(renderLink).toHaveBeenCalledTimes(1);
+    });
+
+    it('calls onPageChange once on a plain click, and leaves modified clicks to the browser', () => {
+      const onPageChange = vi.fn();
+      render(
+        <Pagination
+          count={5}
+          getHref={(page) => `#page-${page}`}
+          renderLink={(props) => <TestLink {...props} />}
+          onPageChange={onPageChange}
+        />,
+      );
+      const page2 = screen.getByRole('link', { name: 'Page 2' });
+      fireEvent.click(page2, { ctrlKey: true });
+      fireEvent.click(screen.getByRole('link', { name: 'Next page' }), { button: 1 });
+      expect(onPageChange).not.toHaveBeenCalled();
+      fireEvent.click(page2);
+      expect(onPageChange).toHaveBeenCalledTimes(1);
+      expect(onPageChange).toHaveBeenCalledWith(2);
+      expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
+    });
+
+    it('ignores a click that the consumer cancelled', () => {
+      const onPageChange = vi.fn();
+      render(
+        <Pagination
+          count={5}
+          getHref={(page) => `#page-${page}`}
+          renderLink={(props) => (
+            <TestLink
+              {...props}
+              onClick={(event) => {
+                event.preventDefault();
+                props.onClick?.(event);
+              }}
+            />
+          )}
+          onPageChange={onPageChange}
+        />,
+      );
+      fireEvent.click(screen.getByRole('link', { name: 'Page 2' }));
+      expect(onPageChange).not.toHaveBeenCalled();
+    });
+
+    it('warns, and is ignored, without getHref', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const renderLink = vi.fn((props: LinkProps) => <TestLink {...props} />);
+      render(<Pagination count={3} renderLink={renderLink} />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('renderLink'));
+      expect(renderLink).not.toHaveBeenCalled();
+      expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
+    });
+  });
 });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/pagination
```

Expected: FAIL, năm trên sáu test trong nhóm `renderLink`:
- `renders every link with an href through it, with the page`: `expected  to have a length of 7 but got +0` (React cũng cảnh báo prop DOM lạ `renderLink`).
- `keeps the button classes and the name of previous and next`: `expected the element to have attribute data-router-link`.
- `leaves the links at the ends … to the library`: `expected "vi.fn()" to be called 1 times, but got 0 times`.
- `ignores a click that the consumer cancelled`: `expected "vi.fn()" to not be called at all` (`onPageChange` được gọi với 2).
- `warns, and is ignored, without getHref`: `expected console.warn to be called with renderLink`.
- `calls onPageChange once on a plain click, leaves modified clicks to the browser` là đặc tính của cách xử lý click có sẵn, pass trước.

- [ ] **Step 3: Viết code**

```diff
diff --git a/fixtures/next-app/app/pages.tsx b/fixtures/next-app/app/pages.tsx
index b8b1824..1d524e8 100644
--- a/fixtures/next-app/app/pages.tsx
+++ b/fixtures/next-app/app/pages.tsx
@@ -1,10 +1,20 @@
 'use client';
 
-// Pagination keeps its page in state here: a Server Component cannot pass it onPageChange.
+// Pagination keeps its page in state here: a Server Component cannot pass it onPageChange, getHref
+// or renderLink, which are functions.
 import { Pagination } from 'fl-glass-ui';
+import Link from 'next/link';
 import { useState } from 'react';
 
 export function Pages() {
   const [page, setPage] = useState(5);
-  return <Pagination count={12} page={page} onPageChange={setPage} />;
+  return (
+    <Pagination
+      count={12}
+      page={page}
+      onPageChange={setPage}
+      getHref={(target) => `?page=${target}`}
+      renderLink={(props) => <Link {...props} />}
+    />
+  );
 }
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index 91f01cf..adbf376 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -339,11 +339,21 @@ async function checkNavigation(page, problems) {
     problems.push('opening an Accordion item did not close the other one');
   }
 
-  const page6 = page.getByRole('button', { name: 'Page 6' });
+  // The Next fixture gives Pagination links through next/link (Plan E2): a click moves the page and
+  // the address without loading the document again, which a value kept on `window` shows.
+  const page6 = page.locator('.flg-pagination [aria-label="Page 6"]');
+  const isLink = (await page6.evaluate((el) => el.tagName)) === 'A';
+  await page.evaluate(() => (window.keptAcrossPageClick = true));
   await page6.click();
   if ((await page6.getAttribute('aria-current')) !== 'page') {
     problems.push('Pagination did not move to the page clicked');
   }
+  if (isLink) {
+    await page.waitForURL(/[?&]page=6$/);
+    if (!(await page.evaluate(() => window.keptAcrossPageClick))) {
+      problems.push('a Pagination link click loaded the document again instead of the router');
+    }
+  }
 }
 
 async function testApp(name, browser) {
diff --git a/src/components/pagination/Pagination.mdx b/src/components/pagination/Pagination.mdx
index ca368b3..7475b5f 100644
--- a/src/components/pagination/Pagination.mdx
+++ b/src/components/pagination/Pagination.mdx
@@ -38,6 +38,40 @@ jump around. `count` below 1 counts as 1, and the page stays within 1 and `count
 In a React Server Component, pass `getHref` from a client component of your own: a function
 cannot cross from the server to a client component.
 
+## Links from a router
+
+By default a link is a plain `<a>`, so a click loads the page again. `renderLink` renders each link
+that has an `href` (the pages, previous and next) as the link of your router. Pass it every prop it
+gets: `onClick` is the library's handler, which calls `onPageChange`, and the router runs it before
+it navigates. Previous and next are still wrapped by the library's button, which adds its classes and
+`aria-label` to what you return, so the link must hand every prop and its `ref` down to its `<a>`;
+the `Link` of Next.js and of React Router both do.
+
+```tsx
+'use client';
+
+import { Pagination } from 'fl-glass-ui';
+import Link from 'next/link';
+
+export function Pages({ page }: { page: number }) {
+  return (
+    <Pagination
+      count={12}
+      page={page}
+      getHref={(target) => `?page=${target}`}
+      renderLink={(props) => <Link {...props} />}
+    />
+  );
+}
+```
+
+- `renderLink` is a function too, so it must come from a client component, like `getHref`.
+- The previous and next links at the ends have no `href`: they stay the library's `<a role="link"
+aria-disabled="true">` and do not go through `renderLink`.
+- A click your own handler cancels with `preventDefault` is ignored by the library: the page does
+  not change and `onPageChange` is not called. Without `getHref`, `renderLink` is ignored, with a
+  warning in development.
+
 ## Labels
 
 The navigation is named "Pagination"; the arrows "Previous page" and "Next page"; each page
diff --git a/src/components/pagination/Pagination.tsx b/src/components/pagination/Pagination.tsx
index babca21..d7b835c 100644
--- a/src/components/pagination/Pagination.tsx
+++ b/src/components/pagination/Pagination.tsx
@@ -1,14 +1,24 @@
 'use client';
 
 import { clsx } from 'clsx';
-import { forwardRef } from 'react';
-import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
+import { Fragment, forwardRef } from 'react';
+import type {
+  AnchorHTMLAttributes,
+  HTMLAttributes,
+  MouseEvent,
+  ReactElement,
+  ReactNode,
+} from 'react';
 import { strokeIcon } from '../../internal/icons';
 import { hasModifier } from '../../internal/roving';
 import { useControllableState } from '../../internal/use-controllable-state';
+import { devWarn } from '../../internal/warn';
 import { IconButton } from '../icon-button/IconButton';
 import { getPaginationRange, wholeNumber } from './pagination-range';
 
+/** What the library puts on the `<a>` of a link, for `renderLink` to pass on. */
+type PaginationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
+
 export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
   /** How many pages there are; below 1, or not a finite number, counts as 1. */
   count: number;
@@ -24,6 +34,12 @@ export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onCh
   boundaryCount?: number;
   /** Makes every page a link to this address; the browser follows it as usual. */
   getHref?: (page: number) => string;
+  /**
+   * Renders each link that has an `href` (the pages, previous and next), for a router's `Link`:
+   * `renderLink={(props) => <Link {...props} />}`. Pass every prop on, `onClick` included, and
+   * hand the `ref` down to the `<a>`. Ignored, with a warning, without `getHref`.
+   */
+  renderLink?: (props: PaginationLinkProps, page: number) => ReactElement;
   /** Default `"Previous page"`. */
   previousLabel?: string;
   /** Default `"Next page"`. */
@@ -62,6 +78,7 @@ export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagi
     siblingCount = 1,
     boundaryCount = 1,
     getHref,
+    renderLink,
     previousLabel = 'Previous page',
     nextLabel = 'Next page',
     getPageLabel = defaultPageLabel,
@@ -82,6 +99,16 @@ export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagi
   const follow = (page: number) => (event: MouseEvent) => {
     if (!leftToBrowser(event)) setValue(page);
   };
+  if (renderLink && !getHref) {
+    devWarn('<Pagination renderLink> has no effect without getHref: the pages are buttons.');
+  }
+  // The one place a link with an `href` is made, so that `renderLink` has one place to plug in.
+  const link = (target: number, extra: AnchorHTMLAttributes<HTMLAnchorElement>) => {
+    const props = { ...extra, href: getHref!(target), onClick: follow(target) };
+    // The content is in `extra.children`, which the linter cannot see through the spread.
+    // eslint-disable-next-line jsx-a11y/anchor-has-content
+    return renderLink ? renderLink(props, target) : <a {...props} />;
+  };
   const items = getPaginationRange({ count: total, page: current, siblingCount, boundaryCount });
 
   const step = (target: number, label: string, glyph: ReactNode) => {
@@ -111,9 +138,7 @@ export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagi
           // eslint-disable-next-line jsx-a11y/anchor-is-valid
           <a role="link">{glyph}</a>
         ) : (
-          <a href={getHref(target)} onClick={follow(target)}>
-            {glyph}
-          </a>
+          link(target, { children: glyph })
         )}
       </IconButton>
     );
@@ -141,9 +166,7 @@ export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagi
           'aria-current': item === current ? ('page' as const) : undefined,
         };
         return getHref ? (
-          <a key={item} href={getHref(item)} onClick={follow(item)} {...shared}>
-            {item}
-          </a>
+          <Fragment key={item}>{link(item, { ...shared, children: item })}</Fragment>
         ) : (
           <button key={item} type="button" onClick={() => setValue(item)} {...shared}>
             {item}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/pagination
pnpm vitest run --project storybook-light --project storybook-dark src/components/pagination
pnpm build && pnpm check:package
pnpm test:fixtures
```

Expected: 39 unit test PASS; 18 story test PASS; gói PASS (draft: 6.45 kB của 6.79 kB CSS); `Fixtures OK: vite, next.` Nếu cổng 5173 bận, chạy bản sao tạm của script ở cổng 5174 như ở Global Constraints. Fixture Next.js chứng minh không tải lại ở cả production lẫn development.

- [ ] **Step 5: Commit**

```bash
git add fixtures/next-app/app/pages.tsx \n  scripts/test-fixtures.mjs \n  src/components/pagination/Pagination.mdx \n  src/components/pagination/Pagination.test.tsx \n  src/components/pagination/Pagination.tsx
```
```bash
git commit -m "feat(pagination): render links through renderLink, for a router's Link" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 7: HTML props của Toaster, và các mục Toast còn lại từ Plan E1

Spec §6.3 `toast` và `Toaster`, đoạn dưới bảng props bắt đầu "`Toaster` nhận mọi prop HTML của `<section>`" (Plan E2).

- `ToasterProps` nhận prop HTML của `<section>` (trừ `children`). Lib giữ `aria-label`, `role`, `popover`, `tabIndex` (của người dùng bị bỏ qua); `onKeyDown`, `onFocus`, `onBlur` được ghép với handler của lib bằng `composeEventHandlers`. Toaster đang chờ (không active) vẫn không render gì.
- Các mục Plan E1 để lại: comment cũ của đoạn "giữ" và thứ tự khai báo `timers`; hotkey không phân biệt hoa thường; callback ref của item không còn đăng ký lại mỗi render; comment cho thứ tự effect và `aria-hidden`; store không để listener ném lỗi chặn các listener khác (lỗi được ném lại bằng `setTimeout`); `toast()` coi object không có `title` là options và `devWarn`; `count` chỉ tăng khi sinh id.
- Spec §6.3 Toast: hai bullet về việc chuyển vùng khớp nhau; ghi dự phòng của `max` và `duration` (số nguyên ≥ 1; `duration` không dương hoặc NaN thì dùng mặc định; `Infinity` vẫn hợp lệ; cảnh báo dev nêu giá trị) vào spec và `Toast.mdx`.
- Test: StrictMode cho hàng đợi `claim`; tách test tạm dừng ba pha; test twin-focus khẳng định vùng đã vào host; `ExceptionTable.test.tsx` khẳng định mức tối thiểu của dòng 14; comment rằng jsdom không khớp `:focus-visible` nên test mock `matches`.

**Files:**
- Modify: `src/components/toast/Toaster.tsx`, `src/components/toast/store.ts`, `src/components/toast/toast.ts`, `src/components/toast/Toast.mdx`, spec giai đoạn 2 (§6.3 Toast)
- Test: `src/components/toast/Toaster.test.tsx`, `Toaster.test-d.ts`, `store.test.ts`, `toast.test.ts`, `src/docs/ExceptionTable.test.tsx`

**Interfaces:**
- Consumes: `composeEventHandlers`; `Toaster`, `store` và `toast` từ Plan E1; ref `moveRef` của Toaster từ Task 1.
- Produces: `ToasterProps` mở rộng `Omit<HTMLAttributes<HTMLElement>, 'children'>`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/toast/Toaster.test-d.ts b/src/components/toast/Toaster.test-d.ts
index 86f09cf..88bb6b2 100644
--- a/src/components/toast/Toaster.test-d.ts
+++ b/src/components/toast/Toaster.test-d.ts
@@ -18,6 +18,12 @@ test('Toaster takes only the documented positions', () => {
   expectTypeOf(unknown).toBeObject();
 });
 
+test('Toaster does not accept children, since it renders its own', () => {
+  // @ts-expect-error children are not part of ToasterProps
+  const withChildren: ToasterProps = { children: 'x' };
+  expectTypeOf(withChildren).toBeObject();
+});
+
 test('a toast takes only the documented statuses, and the helpers set their own', () => {
   expectTypeOf<ToastOptions['status']>().toEqualTypeOf<
     'info' | 'success' | 'warning' | 'error' | undefined
diff --git a/src/components/toast/Toaster.test.tsx b/src/components/toast/Toaster.test.tsx
index 9e9b2c4..386aa5d 100644
--- a/src/components/toast/Toaster.test.tsx
+++ b/src/components/toast/Toaster.test.tsx
@@ -55,6 +55,7 @@ describe('Toaster', () => {
     resetDevWarnings();
     keyboard = true;
     supported = true;
+    // jsdom matches `:focus-visible` for nothing, which is why the tests mock `matches`.
     const matches = Element.prototype.matches;
     vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
       this: Element,
@@ -165,7 +166,7 @@ describe('Toaster', () => {
     expect(assertive).toBeEmptyDOMElement();
   });
 
-  it('stops the time under the pointer, in focus and on a hidden page', () => {
+  it('stops the time under the pointer', () => {
     mount({ duration: 1000 });
     show(() => toast('Saved'));
     act(() => {
@@ -175,13 +176,43 @@ describe('Toaster', () => {
     act(() => {
       vi.advanceTimersByTime(5000);
     });
+    expect(items()).toHaveLength(1);
     fireEvent.pointerLeave(region());
+    act(() => {
+      vi.advanceTimersByTime(600);
+    });
+    expect(items()).toHaveLength(0);
+  });
+
+  it('stops the time while focus is in the region', () => {
+    mount({ duration: 1000 });
+    show(() => toast('Saved'));
+    act(() => {
+      vi.advanceTimersByTime(400);
+    });
     const close = screen.getByRole('button', { hidden: true, name: 'Dismiss notification' });
     act(() => close.focus());
     act(() => {
       vi.advanceTimersByTime(5000);
     });
+    expect(items()).toHaveLength(1);
     act(() => close.blur());
+    act(() => {
+      vi.advanceTimersByTime(599);
+    });
+    expect(items()).toHaveLength(1);
+    act(() => {
+      vi.advanceTimersByTime(1);
+    });
+    expect(items()).toHaveLength(0);
+  });
+
+  it('stops the time while the page is hidden', () => {
+    mount({ duration: 1000 });
+    show(() => toast('Saved'));
+    act(() => {
+      vi.advanceTimersByTime(400);
+    });
     const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
     act(() => {
       document.dispatchEvent(new Event('visibilitychange'));
@@ -557,6 +588,7 @@ describe('Toaster', () => {
       act(() => {
         unregister = registerModal({ dialog, host });
       });
+      expect(host).toContainElement(region());
       act(() => {
         vi.advanceTimersByTime(1000);
       });
@@ -838,6 +870,37 @@ describe('Toaster', () => {
     expect(items()[0]).toHaveTextContent('Saved');
   });
 
+  it('hands the toasts to a waiting Toaster under StrictMode, in mount order', () => {
+    vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const { rerender } = render(
+      <StrictMode>
+        <>
+          <Toaster key="a" position="top-left" />
+          <Toaster key="b" position="top-right" />
+        </>
+      </StrictMode>,
+    );
+    act(() => {
+      vi.advanceTimersByTime(0);
+    });
+    show(() => toast({ title: 'Saved', duration: Infinity }));
+    expect(region()).toHaveAttribute('data-position', 'top-left');
+    rerender(
+      <StrictMode>
+        <>
+          <Toaster key="b" position="top-right" />
+        </>
+      </StrictMode>,
+    );
+    act(() => {
+      vi.advanceTimersByTime(0);
+    });
+    expect(screen.getAllByRole('region', { hidden: true })).toHaveLength(1);
+    expect(region()).toHaveAttribute('data-position', 'top-right');
+    expect(items()).toHaveLength(1);
+    expect(items()[0]).toHaveTextContent('Saved');
+  });
+
   it('forgets the toast that held focus once focus left without a blur', () => {
     mount();
     show(() => {
@@ -929,4 +992,62 @@ describe('Toaster', () => {
     expect(items().map((item) => item.textContent)).toEqual(['c']);
     expect(items()[0]).toHaveFocus();
   });
+
+  it('passes id, style and data-testid to the section', () => {
+    mount({ id: 'my-toaster', style: { color: 'red' }, 'data-testid': 'toaster' } as ToasterProps);
+    const section = region();
+    expect(section).toHaveAttribute('id', 'my-toaster');
+    expect(section).toHaveAttribute('data-testid', 'toaster');
+    expect(section.getAttribute('style')).toContain('color: red');
+  });
+
+  it('ignores aria-label, role, popover and tabIndex given by the user', () => {
+    mount({
+      'aria-label': 'custom',
+      role: 'status',
+      popover: 'auto',
+      tabIndex: 0,
+    });
+    const section = region();
+    expect(section).toHaveAttribute('aria-label', 'Notifications (F8)');
+    expect(section).not.toHaveAttribute('role');
+    expect(section).toHaveAttribute('popover', 'manual');
+    expect(section).toHaveAttribute('tabindex', '-1');
+  });
+
+  it('runs a user onKeyDown, and Esc still closes the focused toast', () => {
+    const userKeyDown = vi.fn();
+    mount({ onKeyDown: userKeyDown });
+    show(() => toast('Saved'));
+    act(() => items()[0]?.focus());
+    fireEvent.keyDown(items()[0] ?? region(), { key: 'Escape' });
+    expect(userKeyDown).toHaveBeenCalled();
+    expect(items()).toHaveLength(0);
+  });
+
+  it('runs a user onFocus and onBlur, and the focus pause still holds and releases the time', () => {
+    const userFocus = vi.fn();
+    const userBlur = vi.fn();
+    mount({ duration: 1000, onFocus: userFocus, onBlur: userBlur });
+    show(() => toast('Saved'));
+    act(() => vi.advanceTimersByTime(400));
+    const close = screen.getByRole('button', { hidden: true, name: 'Dismiss notification' });
+    act(() => close.focus());
+    expect(userFocus).toHaveBeenCalled();
+    act(() => vi.advanceTimersByTime(5000));
+    expect(items()).toHaveLength(1);
+    act(() => close.blur());
+    expect(userBlur).toHaveBeenCalled();
+    act(() => vi.advanceTimersByTime(599));
+    expect(items()).toHaveLength(1);
+    act(() => vi.advanceTimersByTime(1));
+    expect(items()).toHaveLength(0);
+  });
+
+  it('matches the hotkey without regard to case', () => {
+    mount({ hotkey: 't' });
+    show(() => toast('Saved'));
+    fireEvent.keyDown(document.body, { key: 'T' });
+    expect(region()).toHaveFocus();
+  });
 });
diff --git a/src/components/toast/store.test.ts b/src/components/toast/store.test.ts
index 7f56af2..4365f81 100644
--- a/src/components/toast/store.test.ts
+++ b/src/components/toast/store.test.ts
@@ -287,4 +287,18 @@ describe('toast store', () => {
     vi.advanceTimersByTime(1);
     expect(store.getState().shown).toEqual([]);
   });
+
+  it('calls every listener even when one throws', () => {
+    const store = createToastStore();
+    store.attach({ max: 3, duration: 1000 });
+    const throwing = vi.fn(() => {
+      throw new Error('boom');
+    });
+    const other = vi.fn();
+    store.subscribe(throwing);
+    store.subscribe(other);
+    store.add(entry('a'));
+    expect(throwing).toHaveBeenCalled();
+    expect(other).toHaveBeenCalled();
+  });
 });
diff --git a/src/components/toast/toast.test.ts b/src/components/toast/toast.test.ts
index 3259f9c..77ca022 100644
--- a/src/components/toast/toast.test.ts
+++ b/src/components/toast/toast.test.ts
@@ -1,7 +1,10 @@
 import { createElement } from 'react';
-import { afterEach, describe, expect, it } from 'vitest';
+import { act, render } from '@testing-library/react';
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
 import { toastStore } from './store';
 import { toast } from './toast';
+import { Toaster } from './Toaster';
 
 const last = () => toastStore.getState().toasts.at(-1);
 
@@ -68,4 +71,31 @@ describe('toast', () => {
     toast.dismiss();
     expect(toastStore.getState().toasts).toEqual([]);
   });
+
+  it('treats an options object with no title as options, warns once, and renders', () => {
+    vi.useFakeTimers();
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    resetDevWarnings();
+    const id = toast({ description: 'x' } as unknown as Parameters<typeof toast>[0]);
+    expect(id).toMatch(/^flg-toast-\d+$/);
+    expect(toastStore.getState().toasts.at(-1)).toMatchObject({
+      title: undefined,
+      description: 'x',
+    });
+    expect(warn).toHaveBeenCalledTimes(1);
+    const { unmount } = render(createElement(Toaster));
+    act(() => {
+      vi.advanceTimersByTime(0);
+    });
+    unmount();
+    vi.useRealTimers();
+    warn.mockRestore();
+  });
+
+  it('does not consume a generated number when a toast is given an id', () => {
+    const seed = toast('seed');
+    const n = Number(seed.split('-').pop());
+    toast({ id: 'a', title: 'A' } as unknown as Parameters<typeof toast>[0]);
+    expect(toast('B')).toBe(`flg-toast-${n + 1}`);
+  });
 });
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 2a62f04..cfdf665 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -45,6 +45,7 @@ describe('ExceptionTable', () => {
     expect(cells(rows[12]!).slice(1, 3)).toEqual(['1.24:1', '1.12:1']);
     expect(cells(rows[13]!)[1]).toMatch(/^meets AA \(3\.\d\d:1\)$/);
     expect(cells(rows[13]!)[2]).toBe('2.29:1');
+    expect(cells(rows[13]!).at(-2)).toBe('3:1');
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/toast src/docs
```

Expected: FAIL, tám test mới (lần fail đầu ở báo cáo của draft):
- `Toaster.test-d.ts`, `Toaster does not accept children, since it renders its own`: kiểu của `ToasterProps` chưa nhận prop HTML.
- `passes id, style and data-testid to the section`: `Expected the element to have attribute: id="my-toaster"`, nhận `null`.
- `ignores aria-label, role, popover and tabIndex given by the user`: `Unable to find an element with the role "region"`.
- `runs a user onKeyDown, and Esc still closes the focused toast`: `expected "vi.fn()" to be called at least once`.
- `runs a user onFocus and onBlur, and the focus pause still holds and releases the time`: `expected "vi.fn()" to be called at least once`.
- `matches the hotkey without regard to case`: `Expected element with focus: <section ...>`.
- `store.test.ts`, `calls every listener even when one throws`: `Error: boom`.
- `toast.test.ts`, `treats an options object with no title as options, warns once, and renders`: `expected { id: 'flg-toast-1', ... } to match object { title: undefined, description: 'x' }`; `does not consume a generated number when a toast is given an id`: `expected 'flg-toast-3' to be 'flg-toast-2'`.

Các test còn lại của patch (ba test tạm dừng đã tách, test StrictMode của hàng đợi `claim`, dòng 14 của `ExceptionTable`) kiểm tra hành vi đã có; báo cáo của draft không ghi lần fail đầu của chúng.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index a3ef28f..66f5b58 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -969,6 +969,8 @@ toast.dismiss(id?: string): void;                    // không có id thì đón
 
   `Toaster` nhận mọi prop HTML của `<section>` (`id`, `className`, `style`, `data-*`…), và `ref` trỏ vào nó (Plan E2). Lib giữ `aria-label`, `role`, `popover` và `tabIndex`: prop cùng tên của người dùng bị bỏ qua. `onKeyDown`, `onFocus` và `onBlur` của người dùng được ghép với của lib theo cách chung (`composeEventHandlers`). Đổi `max` hoặc `duration` trong lúc toast đang hiện không xoá danh sách rồi hiện lại (screen reader sẽ đọc lại cả danh sách): store nhận cấu hình mới tại chỗ (Plan E1).
 
+  Lib kiểm tra `max` và `duration` của `Toaster` (và `duration` của từng toast): `max` phải là số nguyên ít nhất 1 (NaN hoặc không phải số về 3, phân số hay giá trị dưới 1 được làm tròn xuống và chặn ở 1, `Infinity` nghĩa là không giới hạn); `duration` phải là số dương tính bằng mili giây (NaN, 0 hoặc giá trị âm về 5000 cho `Toaster`, hoặc về thời gian của `Toaster` cho `duration` của toast, `Infinity` giữ toast cho tới khi đóng). Giá trị sai được thay và nêu trong cảnh báo dev.
+
 - **Cấu trúc:**
 
   ```html
@@ -1020,7 +1022,7 @@ toast.dismiss(id?: string): void;                    // không có id thì đón
   - Toast vì vậy vẫn nhìn thấy, bấm được và được đọc. Những gì người dùng đang nhập trong dialog được giữ nguyên.
   - Khi modal đóng, vùng toast về lại vị trí trên trang và được `showPopover()` lại.
   - Con trỏ hay focus nằm trên vùng cũ không còn giữ giờ sau khi vùng chuyển chỗ (Plan E1).
-  - Chuyển chỗ không làm mất toast, vì dữ liệu nằm trong store. Các toast mà vùng cũ đang hiện được render ngay trong vùng mới; chúng có sẵn lúc vùng được chèn nên không bị đọc lại, và không trượt vào lần nữa.
+  - Chuyển chỗ không làm mất toast, vì dữ liệu nằm trong store. Các toast mà vùng cũ đã hiện trọn một task được render ngay trong vùng mới; chúng có sẵn lúc vùng được chèn nên không bị đọc lại, và không trượt vào lần nữa. Các toast còn lại chỉ vào vùng mới sau một task, như lúc `Toaster` mount.
   - Toast chưa nằm trong một vùng đã hiện trọn một task thì chỉ vào vùng mới sau một task, như lúc `Toaster` mount. Ví dụ `toast()` rồi đóng Dialog trong cùng một handler: Dialog chỉ rời modal stack trong layout effect, sau lần commit đã đưa toast vào vùng cũ, nên toast đó vẫn chưa được đọc. Nếu vào cùng lúc với vùng mới, screen reader không đọc nó (phát hiện khi review cuối Plan E1).
 - **Hạn chế, ghi trong docs:** `<dialog>` modal không do lib tạo không có trong modal stack. Toast khi đó nằm dưới dialog đó và không bấm được.
 
diff --git a/src/components/toast/Toast.mdx b/src/components/toast/Toast.mdx
index 7713827..b00ad1c 100644
--- a/src/components/toast/Toast.mdx
+++ b/src/components/toast/Toast.mdx
@@ -64,6 +64,12 @@ A toast shown before the Toaster mounts waits, and shows once it does.
 | `className` |                   | On the region.                                                                                           |
 
 Place one Toaster in the app. Another one renders nothing and prints a warning in development.
+
+A wrong `max` or `duration` is replaced and named in a development warning: `max` must be an
+integer of at least 1 (NaN or a non-number becomes 3; a fraction or a value below 1 is rounded
+down and clamped to 1; `Infinity` means no limit); `duration` must be a positive number of ms
+(NaN, zero or a negative value falls back to 5000 for the Toaster, or to the Toaster's time for
+a toast's own `duration`; `Infinity` keeps the toast until it is closed).
 It waits, and takes over, in the order they mounted, if the one that shows the toasts unmounts.
 The newest toast sits nearest the edge of the screen. The order in the page is the order on
 screen (newest first at a `top-*` position), so Tab goes through the toasts as they appear.
diff --git a/src/components/toast/Toaster.tsx b/src/components/toast/Toaster.tsx
index da04fe2..c955071 100644
--- a/src/components/toast/Toaster.tsx
+++ b/src/components/toast/Toaster.tsx
@@ -2,6 +2,7 @@
 
 import { clsx } from 'clsx';
 import {
+  useCallback,
   forwardRef,
   useEffect,
   useMemo,
@@ -10,8 +11,9 @@ import {
   useState,
   useSyncExternalStore,
 } from 'react';
-import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
+import type { FocusEvent, HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
 import { createPortal } from 'react-dom';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { returnFocus } from '../../internal/focus';
 import { strokeIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
@@ -38,7 +40,7 @@ export interface ToasterLabels {
   info: string;
 }
 
-export interface ToasterProps {
+export interface ToasterProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
   /** Where the toasts sit. Default `"bottom-center"`. */
   position?: ToastPosition;
   /** How many toasts show at once; the others wait for room. Default 3. */
@@ -102,9 +104,11 @@ interface ToastItemProps {
 
 function ToastItem({ entry, labels, register, moved }: ToastItemProps) {
   const { id, status, action } = entry;
+  // A stable ref callback keeps React from calling register with null on every render.
+  const refCallback = useCallback((el: HTMLLIElement | null) => register(id, el), [id, register]);
   return (
     <li
-      ref={(el) => register(id, el)}
+      ref={refCallback}
       // Focus goes to the toast itself when the one that held it closes.
       tabIndex={-1}
       className="flg-surface flg-toast"
@@ -116,6 +120,8 @@ function ToastItem({ entry, labels, register, moved }: ToastItemProps) {
     >
       <span className="flg-toast-icon">
         {/* Named, so the status is not told by its colour alone. */}
+        {/* `aria-hidden` is left undefined: the icon carries its own name (`role="img"` +
+            `aria-label`), so it must not be hidden from assistive tech. */}
         <svg {...strokeIcon} aria-hidden={undefined} role="img" aria-label={labels[status]}>
           {ICONS[status]}
         </svg>
@@ -168,9 +174,22 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     hotkey = 'F8',
     labels: labelsProp,
     className,
+    // The library keeps these four; a value given by the caller is ignored.
+    'aria-label': _ariaLabel,
+    role: _role,
+    popover: _popover,
+    tabIndex: _tabIndex,
+    onKeyDown: userKeyDown,
+    onFocus: userFocus,
+    onBlur: userBlur,
+    ...props
   },
   ref,
 ) {
+  void _ariaLabel;
+  void _role;
+  void _popover;
+  void _tabIndex;
   // A label given as `undefined` keeps its default, which a plain spread would replace.
   const labels = { ...DEFAULT_LABELS };
   for (const key of Object.keys(DEFAULT_LABELS) as (keyof ToasterLabels)[]) {
@@ -257,12 +276,14 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     };
   }, [active]);
 
-  // While the region is new, only what the old one showed: those toasts are there as the region
-  // comes in, so they are not read again; the others come in a task later.
+  // While the region is new, only the toasts the old region has shown for at least a task come
+  // along with it: they are already there as the region comes in, so they are not read again;
+  // the rest come in a task later.
   const visible = move.holding
     ? state.shown.filter((entry) => move.moved.has(entry.id))
     : state.shown;
   const onScreen = newestFirst ? [...visible].reverse() : visible;
+  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
   useIsoLayoutEffect(() => {
     const ids = active ? visible.map((entry) => entry.id) : [];
     // A render that shows the same toasts as the last one has nothing new to settle: the timer that
@@ -277,7 +298,6 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     }, 0);
     timers.current.add(timer);
   });
-  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
   useEffect(() => {
     const pending = timers.current;
     return () => {
@@ -405,7 +425,7 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     const onKeyDown = (event: globalThis.KeyboardEvent) => {
       const region = regionRef.current;
       if (
-        event.key !== hotkey ||
+        event.key.toLowerCase() !== hotkey.toLowerCase() ||
         hasModifier(event) ||
         event.isComposing ||
         event.defaultPrevented ||
@@ -475,14 +495,15 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
     <section
       ref={mergedRef}
+      {...props}
       popover={modal ? undefined : 'manual'}
       className={clsx('flg-toaster', className)}
       data-position={position}
       aria-label={`${labels.region} (${hotkey})`}
       tabIndex={-1}
-      onFocus={handleFocus}
-      onBlur={handleBlur}
-      onKeyDown={handleKeyDown}
+      onFocus={composeEventHandlers(userFocus, handleFocus)}
+      onBlur={composeEventHandlers(userBlur, handleBlur)}
+      onKeyDown={composeEventHandlers(userKeyDown, handleKeyDown)}
     >
       <ol className="flg-toaster-list" aria-live="polite">
         {onScreen.map((entry) => (
diff --git a/src/components/toast/store.ts b/src/components/toast/store.ts
index 10dcb80..3fee323 100644
--- a/src/components/toast/store.ts
+++ b/src/components/toast/store.ts
@@ -153,7 +153,7 @@ export function createToastStore() {
           // Not the `Infinity` of an action: a time was asked for, only not given right.
           own = config?.duration;
         }
-        const wanted = own ?? (entry.action ? Infinity : (config?.duration ?? 0));
+        const wanted = own ?? (entry.action ? Infinity : config!.duration);
         // A longer time overflows setTimeout, which then fires at once: it means "forever".
         const duration = wanted > MAX_TIMEOUT ? Infinity : wanted;
         clock = { remaining: duration, startedAt: 0, handle: undefined };
@@ -169,7 +169,18 @@ export function createToastStore() {
     }
     if (sameList(state.toasts, toasts) && sameList(state.shown, shown)) return;
     state = { toasts, shown };
-    for (const listener of listeners) listener();
+    // One listener that throws must not keep the rest from hearing about the change.
+    for (const listener of [...listeners]) {
+      try {
+        listener();
+      } catch (error) {
+        // Rethrow later, so the error still reaches the console and error reporting
+        // instead of being lost, without stopping the other listeners.
+        setTimeout(() => {
+          throw error;
+        });
+      }
+    }
   };
 
   /** Adds a toast, or updates the one with the same id in place and starts its time again. */
diff --git a/src/components/toast/toast.ts b/src/components/toast/toast.ts
index 3dc5263..5d4a442 100644
--- a/src/components/toast/toast.ts
+++ b/src/components/toast/toast.ts
@@ -22,21 +22,27 @@ export interface ToastFunction {
 
 let count = 0;
 
-/** Options are a plain object with a `title`; anything else is the title itself. */
+/** Options are a plain object; anything else (a node, including an element) is the title. */
 function isOptions(input: Input): input is ToastOptions {
   return (
-    typeof input === 'object' &&
-    input !== null &&
-    !Array.isArray(input) &&
-    !isValidElement(input) &&
-    'title' in input
+    typeof input === 'object' && input !== null && !Array.isArray(input) && !isValidElement(input)
   );
 }
 
 function show(input: Input, status?: ToastStatus): string {
   const options: ToastOptions = isOptions(input) ? input : { title: input };
-  count += 1;
-  const id = options.id ?? `flg-toast-${count}`;
+  if (isOptions(input) && !('title' in input)) {
+    devWarn(
+      'toast() was given an options object with no `title`. Treating it as options; the toast has ' +
+        'no title.',
+    );
+  }
+  const id =
+    options.id ??
+    (() => {
+      count += 1;
+      return `flg-toast-${count}`;
+    })();
   // A store on the server would carry toasts from one request into the next.
   if (typeof window === 'undefined') {
     devWarn(
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/toast src/docs
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
pnpm build && pnpm check:package
```

Expected: unit PASS (draft: 127 test ở `src/components/toast`, 6 ở `src/docs`); 42 story test PASS; gói PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md \n  src/components/toast/Toast.mdx \n  src/components/toast/Toaster.test-d.ts \n  src/components/toast/Toaster.test.tsx \n  src/components/toast/Toaster.tsx \n  src/components/toast/store.test.ts \n  src/components/toast/store.ts \n  src/components/toast/toast.test.ts \n  src/components/toast/toast.ts \n  src/docs/ExceptionTable.test.tsx
```
```bash
git commit -m "feat(toast): Toaster takes HTML props; the Toast items left from Plan E1" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 8: Cảnh báo tên của ContextMenuContent, key của Breadcrumb, thứ tự export

- **`ContextMenuContent` không có tên** (spec §5): `devWarn` một lần khi nó không có `aria-label` lẫn `aria-labelledby`, như `PopoverContent`.
- **Key của Breadcrumb:** mục được đánh key theo chỉ số nên key của con bị bỏ. Dùng key của phần tử con nếu có, không thì chỉ số. `flattenChildren` (`src/internal/collect-children.ts`) giữ key.
- **`src/index.ts`:** các export của Accordion nằm giữa export giá trị và kiểu của Tabs; chuyển thành một nhóm riêng sau các export kiểu của Tabs.

**Files:**
- Modify: `src/components/context-menu/ContextMenu.tsx`, `src/components/breadcrumb/Breadcrumb.tsx`, `src/index.ts`
- Test: `src/components/context-menu/ContextMenu.test.tsx`, `src/components/breadcrumb/Breadcrumb.test.tsx`

**Interfaces:**
- Consumes: `devWarn`, `resetDevWarnings` (`src/internal/warn.ts`).
- Produces: không có tên mới. Thứ tự export của `src/index.ts` không đổi API.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/breadcrumb/Breadcrumb.test.tsx b/src/components/breadcrumb/Breadcrumb.test.tsx
index bb86726..5ec0056 100644
--- a/src/components/breadcrumb/Breadcrumb.test.tsx
+++ b/src/components/breadcrumb/Breadcrumb.test.tsx
@@ -1,5 +1,5 @@
-import { render, screen, within } from '@testing-library/react';
-import { createRef } from 'react';
+import { fireEvent, render, screen, within } from '@testing-library/react';
+import { createRef, useState } from 'react';
 import { renderToString } from 'react-dom/server';
 import { describe, expect, it } from 'vitest';
 import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './Breadcrumb';
@@ -102,4 +102,31 @@ describe('Breadcrumb', () => {
     expect(html).toContain('aria-label="Breadcrumb"');
     expect(html).toContain('aria-current="page"');
   });
+
+  it('keeps a keyed item’s state when the items are reordered', () => {
+    function Item({ label }: { label: string }) {
+      const [count, setCount] = useState(0);
+      return (
+        <button type="button" onClick={() => setCount((c) => c + 1)}>
+          {label}: {count}
+        </button>
+      );
+    }
+    const { rerender } = render(
+      <Breadcrumb>
+        <Item key="a" label="A" />
+        <Item key="b" label="B" />
+      </Breadcrumb>,
+    );
+    fireEvent.click(screen.getByText('A: 0'));
+    expect(screen.getByText('A: 1')).toBeInTheDocument();
+    rerender(
+      <Breadcrumb>
+        <Item key="b" label="B" />
+        <Item key="a" label="A" />
+      </Breadcrumb>,
+    );
+    expect(screen.getByText('A: 1')).toBeInTheDocument();
+    expect(screen.getByText('B: 0')).toBeInTheDocument();
+  });
 });
diff --git a/src/components/context-menu/ContextMenu.test.tsx b/src/components/context-menu/ContextMenu.test.tsx
index f75f25f..61a026e 100644
--- a/src/components/context-menu/ContextMenu.test.tsx
+++ b/src/components/context-menu/ContextMenu.test.tsx
@@ -1,5 +1,6 @@
 import { act, fireEvent, render, screen } from '@testing-library/react';
-import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
+import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
 import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './ContextMenu';
 
 // jsdom has no Popover API. This stand-in is enough for the menu to open and close.
@@ -14,6 +15,8 @@ beforeAll(() => {
 afterAll(() => Object.assign(HTMLElement.prototype, original));
 
 describe('ContextMenu', () => {
+  beforeEach(() => resetDevWarnings());
+
   // A characterization test: `openAt` reads whether the menu is open from a ref that is written
   // after each commit, and it behaved the same when the ref was written during render.
   it('closes, and opens afresh a task later, when asked again at a new place while open', async () => {
@@ -34,4 +37,29 @@ describe('ContextMenu', () => {
     await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
     expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
   });
+
+  it('warns once when its content has no name', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(
+      <ContextMenu>
+        <ContextMenuTrigger>Area</ContextMenuTrigger>
+        <ContextMenuContent />
+      </ContextMenu>,
+    );
+    expect(warn).toHaveBeenCalledOnce();
+    expect(warn.mock.calls[0]?.[0]).toMatch(/ContextMenuContent.*aria-label or aria-labelledby/);
+    warn.mockRestore();
+  });
+
+  it('does not warn when its content is named', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(
+      <ContextMenu>
+        <ContextMenuTrigger>Area</ContextMenuTrigger>
+        <ContextMenuContent aria-labelledby="heading" />
+      </ContextMenu>,
+    );
+    expect(warn).not.toHaveBeenCalled();
+    warn.mockRestore();
+  });
 });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/context-menu src/components/breadcrumb src/index.test.ts
```

Expected: FAIL.
- `Breadcrumb.test.tsx`, `keeps a keyed item's state when the items are reordered`: state đi theo vị trí, nên `A: 1` thành `A: 0`.
- `ContextMenu.test.tsx`, `warns once when its content has no name`: chưa có cảnh báo, `console.warn` không được gọi.
- `does not warn when its content is named` là test bảo vệ, pass trước.
- Việc đổi thứ tự export là refactor, không có test fail trước.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/breadcrumb/Breadcrumb.tsx b/src/components/breadcrumb/Breadcrumb.tsx
index 1d89a5c..9b78f9b 100644
--- a/src/components/breadcrumb/Breadcrumb.tsx
+++ b/src/components/breadcrumb/Breadcrumb.tsx
@@ -1,5 +1,5 @@
 import { clsx } from 'clsx';
-import { forwardRef } from 'react';
+import { forwardRef, isValidElement } from 'react';
 import type { AnchorHTMLAttributes, HTMLAttributes, Ref } from 'react';
 import { flattenChildren } from '../../internal/collect-children';
 import { strokeIcon } from '../../internal/icons';
@@ -44,8 +44,12 @@ export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Brea
     >
       <ol className="flg-breadcrumb-list">
         {items.map((item, index) => (
-          // The items have no identity of their own: their place in the path is it.
-          <li key={index} className="flg-breadcrumb-item">
+          // Keep the child's own key when it has one, so reordering keyed items preserves
+          // each item's state and DOM node; fall back to the index for unkeyed children.
+          <li
+            key={isValidElement(item) && item.key !== null ? item.key : index}
+            className="flg-breadcrumb-item"
+          >
             {item}
             {index < items.length - 1 ? (
               <span className="flg-breadcrumb-separator" aria-hidden="true">
diff --git a/src/components/context-menu/ContextMenu.tsx b/src/components/context-menu/ContextMenu.tsx
index 7f9e41f..d550cbf 100644
--- a/src/components/context-menu/ContextMenu.tsx
+++ b/src/components/context-menu/ContextMenu.tsx
@@ -289,6 +289,12 @@ export const ContextMenuContent = forwardRef<HTMLDivElement, ContextMenuContentP
     const ctx = useContextMenu('ContextMenuContent');
     const { contentRef, point, returnTo } = ctx;
     const mergedRef = useMemo(() => mergeRefs(ref, contentRef), [ref, contentRef]);
+    const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
+    useEffect(() => {
+      if (!named) {
+        devWarn('<ContextMenuContent> needs a name: pass aria-label or aria-labelledby.');
+      }
+    }, [named]);
     return (
       <MenuPanel
         ref={mergedRef}
diff --git a/src/index.ts b/src/index.ts
index fd94780..f2ab916 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -140,6 +140,14 @@ export type {
   BreadcrumbProps,
   BreadcrumbSeparator,
 } from './components/breadcrumb';
+export type {
+  TabsActivationMode,
+  TabsContentProps,
+  TabsListProps,
+  TabsProps,
+  TabsTriggerProps,
+  TabsVariant,
+} from './components/tabs';
 export {
   Accordion,
   AccordionContent,
@@ -154,14 +162,6 @@ export type {
   AccordionSingleProps,
   AccordionTriggerProps,
 } from './components/accordion';
-export type {
-  TabsActivationMode,
-  TabsContentProps,
-  TabsListProps,
-  TabsProps,
-  TabsTriggerProps,
-  TabsVariant,
-} from './components/tabs';
 export type {
   ContextMenuContentProps,
   ContextMenuProps,
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/context-menu src/components/breadcrumb src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/context-menu src/components/breadcrumb
pnpm build && pnpm check:package
```

Expected: unit PASS (ở draft: 50 test cho context-menu, breadcrumb và menu, React 19 và 18); 30 story test PASS; gói PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/breadcrumb/Breadcrumb.test.tsx \n  src/components/breadcrumb/Breadcrumb.tsx \n  src/components/context-menu/ContextMenu.test.tsx \n  src/components/context-menu/ContextMenu.tsx \n  src/index.ts
```
```bash
git commit -m "fix: name warning for ContextMenuContent, Breadcrumb keys, export order" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 9: Vòng focus của Accordion

Spec §6.3 Accordion, bullet "Vòng focus" (Plan E2). `.flg-accordion-item::details-content` có `overflow-y: clip` và vẫn cắt khi mở, nên vòng focus của control đầu tiên trong nội dung bị cắt ở trên. Sửa mà không đổi baseline Accordion nào.

- `::details-content` có `padding-block-start: 4px; margin-block-start: -4px; pointer-events: none`, và `.flg-accordion-content` có `pointer-events: auto`. Mép cắt cao hơn 4px, nội dung đứng yên, và 4px chồng lấn không nhận click của trigger.
- Không dùng `overflow-clip-margin: 4px`: Chromium và Firefox chạy, nhưng WebKit của Playwright không hỗ trợ.
- Firefox của Playwright có `::details-content`, nên trước đó cũng cắt và giờ đã sửa. Trình duyệt không có pseudo này thì không cắt (item mở ngay), nên story thoát sớm ở đó.
- Draft đã chứng minh: chỉ `Accordion/Default` có ảnh chuẩn; 8 cặp (light và dark × 4 chế độ) giống từng byte, 0 pixel khác.

**Files:**
- Modify: `src/styles/components/accordion.css`
- Test: `src/components/accordion/Accordion.stories.tsx`

**Interfaces:**
- Consumes: `Button` và `Accordion` có sẵn.
- Produces: story `Accordion/FocusRingInContent` (`no-visual`).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/accordion/Accordion.stories.tsx b/src/components/accordion/Accordion.stories.tsx
index e999bcf..7b426a3 100644
--- a/src/components/accordion/Accordion.stories.tsx
+++ b/src/components/accordion/Accordion.stories.tsx
@@ -2,6 +2,7 @@ import type { Meta, StoryObj } from '@storybook/react-vite';
 import { useState } from 'react';
 import { expect, fn, userEvent, waitFor } from 'storybook/test';
 import { realUserEvent } from '../../../.storybook/real-input';
+import { Button } from '../button';
 import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
 import type { AccordionProps } from './Accordion';
 
@@ -321,3 +322,44 @@ export const AddedItem: Story = {
     await expect(args.onValueChange).not.toHaveBeenCalled();
   },
 };
+
+/** How far the focus outline reaches from the control. The 3px ring is inside it, the glow is not measured. */
+function ringReach(control: HTMLElement) {
+  const style = getComputedStyle(control);
+  return parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
+}
+
+export const FocusRingInContent: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <Accordion defaultValue="filter" style={width}>
+      <AccordionItem value="filter">
+        <AccordionTrigger>Filter the invoices</AccordionTrigger>
+        <AccordionContent>
+          <Button>Download</Button>
+        </AccordionContent>
+      </AccordionItem>
+    </Accordion>
+  ),
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const download = canvas.getByRole('button', { name: 'Download' });
+    await real.tab();
+    await real.tab();
+    await expect(download).toHaveFocus();
+    // The browsers without `::details-content` do not clip: there is nothing to measure.
+    if (!CSS.supports('selector(::details-content)')) return;
+    const item = itemOf(download);
+    const clip = getComputedStyle(item, '::details-content');
+    await expect(clip.overflowY).toBe('clip');
+    // The clip box starts above the content by its padding (and its clip margin, where the browser
+    // has one). The ring is whole when that reaches as far above the control as the ring does.
+    const content = download.closest('.flg-accordion-content') as HTMLElement;
+    const room =
+      parseFloat(clip.paddingBlockStart) +
+      (parseFloat(clip.overflowClipMargin) || 0) -
+      (download.getBoundingClientRect().top - content.getBoundingClientRect().top);
+    await expect(room).toBeGreaterThanOrEqual(ringReach(download));
+  },
+};
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project storybook-light --project storybook-dark src/components/accordion
```

Expected: FAIL, story `FocusRingInContent` ở cả ba trình duyệt: `expected 0 to be greater than or equal to 4` (khoảng trống mép cắt phía trên control, so với tầm với 4px của outline). Visual run bỏ qua các bước input thật, nên chỉ story này kiểm tra vòng focus.

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/styles/components/accordion.css b/src/styles/components/accordion.css
index e72bc0b..7ebf816 100644
--- a/src/styles/components/accordion.css
+++ b/src/styles/components/accordion.css
@@ -52,16 +52,25 @@
     transform: rotate(180deg);
   }
   .flg-accordion-content {
+    pointer-events: auto;
     padding-bottom: 12px;
     color: var(--flg-text-muted);
     font-size: var(--flg-text-sm);
     line-height: 1.5;
   }
   /* The height opens and closes where the browser has `::details-content`; elsewhere the item
-     opens at once. Reduced motion zeroes the duration. */
+     opens at once. Reduced motion zeroes the duration.
+     The clip stays on when the item is open, so the focus ring of a control first in the content
+     would be cut at the top. The 4px of padding, taken back by the margin, put the clip edge where
+     the ring ends, and the content stays where it was. `overflow-clip-margin` would do this
+     without the margin, but WebKit has no such property. The box ignores the pointer so that its
+     4px over the trigger do not take the trigger's clicks. */
   .flg-accordion-item::details-content {
     block-size: 0;
     overflow-y: clip;
+    padding-block-start: 4px;
+    margin-block-start: -4px;
+    pointer-events: none;
     transition:
       block-size var(--flg-duration-normal) var(--flg-ease),
       content-visibility var(--flg-duration-normal) var(--flg-ease) allow-discrete;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/accordion
pnpm vitest run --project storybook-light --project storybook-dark src/components/accordion
pnpm build && pnpm check:package
```

Expected: 39 unit test PASS; 54 story test PASS; gói PASS (draft: CSS 6.48 kB của 6.79 kB).

- [ ] **Step 5: Commit**

```bash
git add src/components/accordion/Accordion.stories.tsx \n  src/styles/components/accordion.css
```
```bash
git commit -m "fix(accordion): keep the focus ring of the first control in an open item whole" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 10: Docs chung, dọn fixture, changeset `0.2.0` và ngưỡng kích thước

Spec §8 (Docs và phát hành), gồm các dòng Plan E2. Task này không có test viết trước: nó là docs, fixture và changeset; kiểm tra là `ExceptionTable.test.tsx` có sẵn, build, gói, fixture và toàn bộ bộ test.

- **Getting started:** mục "Overlays": đặt `<Toaster />` một lần trong app; không cần portal hay z-index; ghi chú về `<dialog>` không do lib tạo.
- **Accessibility:** bảng §4.9 đã có đủ 14 dòng (test xác nhận); thêm ghi chú về toast (vùng live, F8, Esc, giờ dừng) và về `<dialog>` không do lib tạo.
- **Docs menu:** typeahead chạy ở pha capture của panel, người dùng huỷ bằng `event.preventDefault()` trong `onKeyDownCapture`; chữ lặp lại luôn xoay vòng giữa các item bắt đầu bằng nó; không lồng `ContextMenuTrigger`; item của menu vẫn mount khi đóng (chú ý chi phí DOM trong bảng lớn).
- **Fixture:** các lần đợi toast thêm `timeout: 60_000` như lần đợi hydrate; tiêu đề `Overlays` của fixture Vite sửa "plan A" cho đúng.
- **Changeset:** mở rộng ra cả giai đoạn 2, giữ đoạn **Breaking** (Safari và iOS 17.4) và dòng `asChild`; bump `minor`.
- **Ngưỡng kích thước:** ghi lại bằng `pnpm size:record` sau `pnpm build`. Plan không chép `.size-limit.json`.

**Files:**
- Modify: `.changeset/phase-2-overlays.md`, `fixtures/vite-app/src/Overlays.tsx`, `scripts/test-fixtures.mjs`, `src/components/context-menu/ContextMenu.mdx`, `src/components/dropdown-menu/DropdownMenu.mdx`, `src/docs/Accessibility.mdx`, `src/docs/GettingStarted.mdx`, `.size-limit.json` (do `size:record` ghi)
- Test: không có test mới.

**Interfaces:**
- Consumes: mọi thứ của Task 1–9.
- Produces: changeset `minor` cho `0.2.0`; ngưỡng mới JS 30784 B, CSS 7126 B (ở draft).

- [ ] **Step 1: Viết code**

````diff
diff --git a/.changeset/phase-2-overlays.md b/.changeset/phase-2-overlays.md
index 195714f..9e9b45e 100644
--- a/.changeset/phase-2-overlays.md
+++ b/.changeset/phase-2-overlays.md
@@ -2,11 +2,16 @@
 'fl-glass-ui': minor
 ---
 
-Overlays, the first part of phase 2 of the roadmap. Components: Dialog (with DialogTrigger,
-DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter and DialogClose), Drawer
-(with the same parts), Popover (with PopoverTrigger, PopoverContent and PopoverClose) and Tooltip
-(with TooltipTrigger and TooltipContent). They are built on the native `<dialog>` element and the
-Popover API, so there is no portal or z-index to manage.
+Phase 2 of the roadmap. Components: Dialog (with DialogTrigger, DialogContent, DialogHeader,
+DialogTitle, DialogDescription, DialogFooter and DialogClose), Drawer (with the same parts), Popover
+(with PopoverTrigger, PopoverContent and PopoverClose), Tooltip (with TooltipTrigger and
+TooltipContent), DropdownMenu and ContextMenu (with the shared Menu parts: MenuItem,
+MenuCheckboxItem, MenuRadioGroup, MenuRadioItem, MenuGroup, MenuLabel, MenuSeparator, MenuShortcut,
+MenuSub, MenuSubTrigger and MenuSubContent for submenus), Select (single and multiple, with
+SelectItem, SelectGroup and SelectSeparator), Tabs, Accordion,
+Breadcrumb, Pagination (with `renderLink` for the links of a router), and Toast (`toast()` and
+`Toaster`). The overlays are built on the native `<dialog>` element and the Popover API, so there is
+no portal or z-index to manage.
 
 **Breaking:** the supported browsers now start at Safari and iOS 17.4, the first versions in which
 a dialog's `::backdrop` reads the theme's custom properties.
diff --git a/fixtures/vite-app/src/Overlays.tsx b/fixtures/vite-app/src/Overlays.tsx
index 1f9a8f2..8528f5f 100644
--- a/fixtures/vite-app/src/Overlays.tsx
+++ b/fixtures/vite-app/src/Overlays.tsx
@@ -1,4 +1,5 @@
-// The overlays of phase 2, plan A. The Next.js fixture renders the same markup from a Server Component.
+// The overlays of phase 2: Dialog, Drawer, Popover and Tooltip (plan A), and a toast shown from
+// inside a Dialog (plan E1). The Next.js fixture renders the same markup from a Server Component.
 import {
   Button,
   Dialog,
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index adbf376..af72ac0 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -224,9 +224,9 @@ async function checkOverlays(page, problems) {
   await name.fill('Minh Anh');
   await dialog.getByRole('button', { name: 'Notify' }).click();
   const toasts = dialog.getByRole('region', { name: 'Notifications (F8)' });
-  await toasts.getByText('Profile saved').waitFor();
+  await toasts.getByText('Profile saved').waitFor({ timeout: 60_000 });
   await toasts.getByRole('button', { name: 'Dismiss notification' }).click();
-  await toasts.getByText('Profile saved').waitFor({ state: 'detached' });
+  await toasts.getByText('Profile saved').waitFor({ state: 'detached', timeout: 60_000 });
   if (!(await dialog.evaluate((el) => el.open))) problems.push('closing a toast closed the Dialog');
   if ((await name.inputValue()) !== 'Minh Anh') problems.push('the Dialog lost what was typed');
   await page.keyboard.press('Escape');
diff --git a/src/components/context-menu/ContextMenu.mdx b/src/components/context-menu/ContextMenu.mdx
index 542a2c0..740c6a3 100644
--- a/src/components/context-menu/ContextMenu.mdx
+++ b/src/components/context-menu/ContextMenu.mdx
@@ -46,6 +46,13 @@ It opens on its first item. When it closes, focus goes back to the element that
 `ContextMenuContent` opens to the right of the point, `sideOffset` (2px by default) away, and flips
 when there is no room.
 
+## Good to know
+
+- Do not nest a `ContextMenuTrigger` inside another one. Both would listen to the same right click,
+  and only the inner area could open its menu.
+- Typeahead, the repeated-letter rule and the DOM cost of items that stay mounted while the menu is
+  closed are those of the DropdownMenu; see its page.
+
 ## Accessibility
 
 - Give `ContextMenuContent` an `aria-label`: no trigger names it.
diff --git a/src/components/dropdown-menu/DropdownMenu.mdx b/src/components/dropdown-menu/DropdownMenu.mdx
index 2016ab3..714a0ad 100644
--- a/src/components/dropdown-menu/DropdownMenu.mdx
+++ b/src/components/dropdown-menu/DropdownMenu.mdx
@@ -88,6 +88,23 @@ menu, such as a filter at the top, keeps typing, Home, End and ← for itself; 
 the items. ARIA allows only items, groups and separators inside `role="menu"`, so a field there
 fails axe's `aria-required-children` rule; where that matters, put the field outside the menu.
 
+## Typeahead
+
+A letter moves the highlight to the next item whose text starts with it; several letters typed
+quickly match as a prefix. Typing the same letter again always cycles between the items that start
+with it, so a prefix such as "ss" cannot be typed.
+
+Typeahead runs in the panel's capture phase, before an item sees the key, and skips keys typed in a
+field. To cancel it for a key, pass `onKeyDownCapture` to the content and call
+`event.preventDefault()`: the search then ignores that key. A handler in the bubble phase (`onKeyDown`)
+is too late.
+
+## Size
+
+The items of a menu stay in the DOM while it is closed, so a checkbox or radio item keeps its value
+from one opening to the next. A menu in every row of a large table therefore adds all of its items
+to the page: keep such menus short, or render one menu for the table and point it at the row.
+
 ## Placement
 
 `side` (default `"bottom"`) and `align` (default `"start"`) place the menu next to the trigger, with
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 02f9c05..e213cff 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -34,6 +34,23 @@ application's responsibility.
 - Light: {referenceBackgrounds.light.join(', ')}
 - Dark: {referenceBackgrounds.dark.join(', ')}
 
+## Toasts
+
+- Toasts are read from a polite live region; an error is read at once, from an assertive one. Both
+  regions are in the page before the first toast, so the first one is read too.
+- F8 moves focus to the toasts (the key is the Toaster's `hotkey`), and Esc closes the toast that
+  holds focus. The region is a landmark named "Notifications (F8)".
+- The time of every toast stands still while the pointer is over the toasts, while focus is in them
+  and while the page is hidden, so there is time to read and reach a button.
+- A toast must not be the only way to do or learn something: it goes away.
+
+## A `<dialog>` the library did not create
+
+The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
+that stack: the toasts, which sit in the page, become inert under it, so a keyboard or screen-reader
+user cannot reach them and a pointer cannot click them. Open modals through the library's Dialog and
+Drawer, or keep toasts for moments when no other modal is open.
+
 ## Other preferences
 
 - Without `backdrop-filter` support, or with `prefers-reduced-transparency: reduce`, surfaces become
diff --git a/src/docs/GettingStarted.mdx b/src/docs/GettingStarted.mdx
index cefdcc1..10c9d04 100644
--- a/src/docs/GettingStarted.mdx
+++ b/src/docs/GettingStarted.mdx
@@ -44,7 +44,34 @@ export function Upgrade() {
 ```
 
 Phase 1 components: Surface, Card, Button, IconButton, Badge, Avatar, Divider, Spinner, Field,
-Input, Textarea, Checkbox, RadioGroup and Switch.
+Input, Textarea, Checkbox, RadioGroup and Switch. Phase 2 adds Dialog, Drawer, Popover, Tooltip,
+DropdownMenu, ContextMenu, Select, Tabs, Accordion, Breadcrumb, Pagination and Toast.
+
+## Overlays
+
+Dialog, Drawer, Popover, Tooltip, the menus, Select and Toast are built on the native `<dialog>`
+element and the Popover API, so there is no portal and no z-index to manage: an overlay renders next
+to its trigger and sits above the page.
+
+Put a `<Toaster />` once near the root of the app, then call `toast()` from client code:
+
+```tsx
+import { Toaster } from 'fl-glass-ui';
+
+export function App({ children }: { children: React.ReactNode }) {
+  return (
+    <>
+      {children}
+      <Toaster />
+    </>
+  );
+}
+```
+
+A `<dialog>` that this library did not create is not part of its overlay stack. A modal one makes
+the rest of the page inert, the toasts among it, so they sit under it and cannot be clicked; the
+library's own Dialog and Drawer carry the toasts inside them instead. Open a modal through the
+library's Dialog when toasts must stay reachable.
 
 ## Build a form
 
````

- [ ] **Step 2: Ghi lại ngưỡng kích thước**

Run:

```bash
pnpm gen:theme
pnpm build && pnpm size:record
```

Expected: `.size-limit.json` đổi: JS từ 29195 lên 30784 B, CSS từ 6793 lên 7126 B. Nếu số khác nhiều, dừng và báo cáo: cây khác với cây đã chạy thử.

- [ ] **Step 3: Chạy toàn bộ kiểm tra**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm test:stories
pnpm check:contrast
pnpm check:package
pnpm test:fixtures
```

Expected: 912 unit test PASS (3 skip); 948 story test PASS; tương phản PASS; gói PASS với ngưỡng mới; hai fixture PASS (vite và next, production lẫn development).

- [ ] **Step 4: Commit**

```bash
git add .changeset/phase-2-overlays.md \n  fixtures/vite-app/src/Overlays.tsx \n  scripts/test-fixtures.mjs \n  src/components/context-menu/ContextMenu.mdx \n  src/components/dropdown-menu/DropdownMenu.mdx \n  src/docs/Accessibility.mdx \n  src/docs/GettingStarted.mdx \n  .size-limit.json
```
```bash
git commit -m "docs: the shared docs, the phase 2 changeset, fixture tidy and the size limits" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines" (8 ảnh của `Tabs/Overflow`). Xem ảnh trước khi xin review; `Accordion/Default` và `Tabs/Variants` phải không đổi.
- Mô tả PR nêu cho chủ dự án: glow 12px bị cắt ở 6px (Tabs, khi cuộn) và ở 4px (Accordion); trước khi hydrate, hàng tab không vừa chỗ tràn ra như trước E2; Safari 17.4 chưa được thử cho tab list tràn.
- Bảng kiểm tra screen reader của PR có các dòng: tab list cuộn (phím mũi tên, tab được chọn vào tầm nhìn), `Pagination` với `Link`, toast và `<dialog>` không do lib tạo.
