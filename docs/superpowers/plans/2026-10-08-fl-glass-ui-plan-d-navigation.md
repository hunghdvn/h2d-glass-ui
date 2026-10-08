# fl-glass-ui: Plan D, Tabs, Accordion, Breadcrumb và Pagination (giai đoạn 2, phần 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm bốn component điều hướng của giai đoạn 2: Tabs (ba kiểu, hai hướng), Accordion (trên `<details>`), Breadcrumb (chạy được trong Server Component) và Pagination (nút hoặc link). Kèm theo là các việc Plan B và Plan C để lại cho Plan D.

**Architecture:**
- **Tabs** là component client có context. Focus đi theo kiểu roving tabindex: chỉ tab đang chọn có `tabIndex=0`. Phím mũi tên đi qua `getNextIndex` của `roving.ts`, và bỏ qua phím có kèm Alt, Ctrl hoặc Meta (`hasModifier`, mới). Ở chế độ `automatic`, tab nào nhận focus thì được chọn. `id` của tab và panel được mã hoá từ `value`. Ba kiểu `underline`, `segmented` và `pill` chỉ khác nhau ở CSS.
- **Accordion** dựng trên `<details>` và `<summary>` gốc, nên chạy được trước khi hydrate và find-in-page mở được mục chứa kết quả. Ở kiểu `single`, các mục chung một `name`, nên trình duyệt tự đóng mục kia. `Accordion` nghe `toggle` ở pha capture rồi đọc lại các mục đang mở từ DOM. Khi cha controlled từ chối, nó đặt DOM về đúng `value`.
- **Breadcrumb** không có hook và không có `"use client"`. Nó làm phẳng `children` bằng `flattenChildren` (mới, trong `collect-children.ts`) và bọc mỗi con trong một `<li>`.
- **Pagination** tính dãy trang bằng một hàm thuần (`getPaginationRange`, trong `pagination-range.ts`). Mặc định các ô là nút; khi có `getHref` thì là link.
- **Trạng thái đã chọn dùng chung hai token mới.** Tab `pill` đang chọn và trang hiện tại dùng `--flg-selected-bg` và `--flg-selected-text`. Mặc định chúng là nền và chữ nhấn của mockup; ở `prefers-contrast: more`, chúng thành cặp màu đặc của item đang được trỏ.

**Tech Stack:** Như Plan C: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`:
- §2: phạm vi Plan D.
- §4.1: mockup đã duyệt.
- §4.2 và §4.4: token `selected-*` mới, và các phép đo tương phản của tab và trang hiện tại.
- §4.3: kích thước và giao diện của bốn component.
- §4.5: forced colors.
- §5: cập nhật `roving.ts` (`hasModifier`), `collect-children.ts` (`flattenChildren`), danh sách cảnh báo dev.
- §6.3: Tabs, Accordion, Breadcrumb, Pagination.
- §7: kiểm thử, fixture.

Và §4.9 và §6.1 của `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`: dòng 5, 7 và 8 được mở rộng, dòng 12 và 13 được thêm; các phần marker được miễn `forwardRef`.

**Mockup chuẩn:**
- `docs/superpowers/specs/mockups/phase-2-tabs-accordion.html`: Tabs **T1, T2, T3** (thành prop `variant`) và Accordion **A1**.
- `docs/superpowers/specs/mockups/phase-2-drawer-breadcrumb-pagination.html`: Breadcrumb **B1 và B2** (thành prop `separator`) và Pagination **G1**.

CSS trong plan này dựng lại đúng các phương án đó. Khi lập kế hoạch, ảnh chụp các story có ảnh chuẩn (light, Chromium) đã được so với mockup. Bản dọc của Tabs nằm ngoài mockup; chủ dự án duyệt nó qua ảnh chuẩn visual.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/plan-d-tasks`, mỗi task một commit, và mỗi task đã chạy riêng các lệnh kiểm tra của nó.
- Test viết trước của mỗi task đã được chạy trên commit cha của task, để xác nhận nó fail đúng như plan ghi.
- Mọi khối code trong plan được lấy thẳng từ các commit đó.

Kết quả ở commit cuối:

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 670 test PASS, 3 skip (trước plan: 582 PASS, 2 skip), gồm React 19, React 18.3, script và type test |
| `pnpm test:stories` | 858 test PASS (trước plan: 768): 143 story × 3 trình duyệt × 2 theme, kèm axe |
| `pnpm check:contrast` | PASS. Dòng 12 và 13 mới ở §4.9; dòng 5, 7 và 8 nói thêm tab và trang hiện tại (Task 3, 4, 7) |
| `pnpm check:package` | PASS, gồm `rsc-probe` cho Breadcrumb |
| `pnpm test:fixtures` | Cả hai fixture PASS, ở production lẫn development |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | PASS |

Mười hai phát hiện từ lần chạy thử đã được đưa vào plan. Spec được cập nhật theo, trong chính các task:

1. **Không có tab nào được chọn thì phím Tab bỏ qua cả hàng tab.** Chuyện này xảy ra khi chưa có giá trị, hoặc khi tab được chọn bị disabled. Khi đó tab bật được đầu tiên nhận `tabIndex=0` (Task 3).
2. **`value` có dấu cách làm hỏng `aria-controls`**, vì thuộc tính này chứa một danh sách id ngăn bằng dấu cách. Đây là bài học của Plan C với id nhóm của Select. `id` của tab và panel được mã hoá từ `value` (Task 3).
3. **Vạch dưới tab `underline` là gradient nhấn đặt trên bề mặt**, cùng cặp màu với trạng thái đã chọn của checkbox. Vì vậy phép đo mới `tab-indicator` có đúng số của dòng 5 §4.9 (2.26:1 ở dark), và dòng đó được mở rộng (Task 3).
4. **Bảng ngoại lệ trong docs in "2.26:1 / 2.26:1"** khi hai check của cùng một dòng đo ra cùng một số. Bảng giờ gộp các số trùng (Task 3).
5. **Tab `segmented` đang chọn che mất ring focus.** Cả bóng nổi lẫn ring đều là `box-shadow`, và quy tắc của tab đang chọn cụ thể hơn. Khi có focus, tab đó bỏ bóng nổi (Task 4).
6. **Hai cặp màu mới của T2 không đạt ở theme mặc định**, đúng như mockup. Chữ mờ trên rãnh đo được 4.10:1 light và 3.36:1 dark; tab đang chọn so với rãnh đo được 1.24:1 light và 1.12:1 dark. Chúng thành dòng 12 và 13 của §4.9. Tab `pill` và trang hiện tại có đúng số của dòng 7 và 8 (Task 4, 7).
7. **`toggle` của `<details>` không nổi bọt.** `Accordion` nghe sự kiện này ở pha capture. Ở kiểu `single`, khi trình duyệt đóng mục kia, DOM chỉ còn một mục mở, nên lib không gọi `onValueChange(null)` xen giữa (Task 5).
8. **Mục người dùng mở trước khi hydrate bị mất** nếu effect của từng mục đặt lại `open` lúc mount. Giờ `Accordion` đọc DOM một lần lúc mount, giữ và báo những gì người dùng đã làm. `<details>` mang `suppressHydrationWarning` (Task 5).
9. **Accordion lồng trong một mục của Accordion khác.** Gốc ngoài cũng nhận `toggle` của các mục bên trong (pha capture), nên phải bỏ qua chúng. Có test riêng (Task 5).
10. **`Children` của React 18 không nhận lazy reference ở vị trí con.** Lazy reference ở vị trí con chỉ đến từ Server Components, vốn cần React 19, nên test đó chỉ chạy trên React 19 (Task 6).
11. **Hai Breadcrumb trên một trang trùng tên landmark** (axe `landmark-unique`). Docs khuyên đặt `aria-label` riêng cho mỗi cái (Task 6).
12. **Bấm link thật trong story làm iframe của test điều hướng đi chỗ khác.** Firefox mất luôn kết nối tới runner. Story của Pagination chặn điều hướng ở `nav`; component thì không chặn (Task 7).

**Phạm vi:**
- **Không làm ở plan này:**
  - Toast, changeset `0.2.0` và trang docs tổng (Plan E).
  - Tuỳ chọn chỉ mount panel của Tabs khi được chọn (ngoài phạm vi giai đoạn 2, spec §2).
  - Các mục hoãn cho Plan E của Plan B và Plan C (hình dạng API trước `0.2.0`, cuộn khi rê chuột trên listbox của Select, giá trị không khớp item nào khi bật/tắt).
  - Kiểm tra Safari/VoiceOver còn nợ từ PR #7.
- **Ảnh chuẩn visual:**
  - Plan thêm bốn story có ảnh: `Tabs/Variants`, `Accordion/Default`, `Breadcrumb/Separators` và `Pagination/Default`, tức 32 ảnh mới (2 theme × 4 chế độ mỗi story).
  - Mọi story khác của plan gắn `no-visual`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute hoặc thuộc tính ARIA (`aria-selected`, `aria-current`, `aria-disabled`).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` và quy tắc `prefers-contrast: more` không diễn đạt được bằng token nằm trong `src/styles/preferences.css`.
- **Mockup lock.**
  - Plan này không đổi giá trị token nào có sẵn trong `src/styles/theme/values.ts`.
  - Hai token dẫn xuất mới (`selected-bg`, `selected-text`) có giá trị mặc định là token của mockup (`accent-subtle`, `accent-text`).
  - CSS ở plan này là bản đã đối chiếu với mockup, không được "cải thiện".
- `backdrop-filter` chỉ có ở các phần tử spec §4.2 liệt kê. Accordion là một `Surface` (class `flg-surface`), nên nằm trong danh sách đó; Tabs, Breadcrumb và Pagination không có blur riêng.
- **`"use client"`** chỉ có ở `Tabs.tsx`, `Accordion.tsx` và `Pagination.tsx` (cùng các module client có từ trước). `Breadcrumb.tsx`, `pagination-range.ts`, `select-rows.ts`, `Chips.tsx` và mọi file trong `src/internal/` **không** có directive.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng. Ngoại lệ là các phần chỉ làm marker và render `null`, như `SelectItem` (Task 1 ghi ngoại lệ này vào spec 0+1 §6.1).
- Chữ mặc định do lib cung cấp bằng tiếng Anh. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. Plan này không thêm changeset.
- Mỗi task đổi JS hoặc CSS của lib (Task 1–7): chạy `pnpm build && pnpm size:record` trước `pnpm check:package`, và commit `.size-limit.json` đã cập nhật. Plan không chép file này: `size:record` tự ghi ngưỡng.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme` (phát hiện 10 của Plan B).
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Với file đã có, plan đưa một patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Với file mới, plan đưa toàn bộ nội dung file.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý nhưng không nêu thành test. Mỗi dòng có test ở task tương ứng:

1. **`value` của tab có dấu cách hoặc dấu câu** (ví dụ `"Billing history"`). Tab và panel vẫn được nối với nhau, và mỗi `value` cho một id riêng. Test ở Task 3: `Tabs.test.tsx`, test `builds ids that stay single tokens whatever the value holds`.
2. **Người dùng mở một mục Accordion trước khi trang hydrate xong** (mạng chậm). Mục đó vẫn mở sau khi hydrate, và `onValueChange` được gọi. Test ở Task 5: `Accordion.test.tsx`, test `keeps an item the user opened before hydration, and reports it`.
3. **Một Accordion nằm trong nội dung của một mục Accordion khác.** Mỗi Accordion chỉ theo dõi mục của chính nó. Test ở Task 5: `Accordion.test.tsx`, test `leaves the items of an Accordion nested in one of its items to that Accordion`.
4. **Cha controlled từ chối giá trị mới.** Tabs và Accordion hiện đúng giá trị của cha; riêng Accordion còn đóng lại mục mà DOM đã mở. Test:
   - Task 3: `Tabs.test.tsx`, test `reports a click on a controlled Tabs and keeps the value its parent gives`, và story `Tabs/Controlled`.
   - Task 5: `Accordion.test.tsx`, test `puts an item back when a controlled parent refuses the change`, và story `Accordion/Controlled`.
5. **Pagination nhận số liệu ngoài khoảng** (`count` bằng 0, `page` lớn hơn `count`, số lẻ). Pagination kẹp các giá trị lại và vẫn đúng các quy tắc của dãy trang. Test ở Task 7: `pagination-range.test.ts`, các test `clamps what it is given` và `holds its rules for every page of every small count`, cùng `Pagination.test.tsx`, test `keeps the page and the count within range`.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/roving.ts`, `src/internal/use-popover-trigger.ts` (và test) | `hasModifier`; trạng thái mở ghi sau commit; test chặt hơn (Task 1) |
| `src/components/select/select-rows.ts`, `src/components/select/Chips.tsx` | Phần đọc item và dãy chip, tách khỏi `Select.tsx` (Task 2) |
| `src/components/tabs/*`, `src/styles/components/tabs.css` | Tabs (Task 3, 4) |
| `src/styles/theme/values.ts` | Token `selected-bg`, `selected-text` (Task 4) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.*` | Phép đo của tab và trang hiện tại; dòng 12, 13; bảng gộp số trùng (Task 3, 4, 7) |
| `src/components/accordion/*`, `src/styles/components/accordion.css` | Accordion (Task 5) |
| `src/internal/collect-children.ts` (và test) | `flattenChildren` (Task 6) |
| `src/components/breadcrumb/*`, `src/styles/components/breadcrumb.css`, `scripts/rsc-probe.mjs`, `.storybook/icons.tsx` | Breadcrumb (Task 6) |
| `src/components/pagination/*`, `src/styles/components/pagination.css` | Pagination và hàm dãy trang (Task 7) |
| `src/styles/index.css`, `src/styles/preferences.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Nối từng component mới (Task 3–7) |
| `fixtures/*`, `scripts/test-fixtures.mjs` | Bốn component trong hai app fixture (Task 8) |
| Hai spec | Cập nhật theo phát hiện, trong task tương ứng |

---

### Task 1: Các việc Plan B và Plan C để lại cho primitive

Ba việc nhỏ:
- **`focusNext` đi cả khi người dùng giữ Alt, Ctrl hoặc Meta** (Plan B để lại). Các tổ hợp như Alt+← hay Ctrl+Home thuộc về trình duyệt và hệ điều hành. `hasModifier` mới bỏ qua chúng, và Tabs (Task 3) dùng lại hàm này.
- **`usePopoverState` ghi `openNow` ngay trong lúc render** (Plan C để lại). Một lần render bị React bỏ đi có thể để lại giá trị sai. Giờ việc ghi nằm trong layout effect.
- **Test của `useTriggerPress` chưa đủ chặt** (Plan C để lại). Test click từ bàn phím bấm và click đều khi đang đóng, nên không phân biệt được trạng thái lúc nhấn với trạng thái hiện tại. Giờ test bắt đầu từ một lần bấm lúc đang mở. Thêm một test cho yêu cầu đặt lại đúng trạng thái đang có.

Kèm hai sửa câu chữ ở spec: các phần marker được miễn `forwardRef` (spec 0+1 §6.1), và §5 liệt kê cảnh báo khi một phần của Select nằm ngoài `Select`.

**Files:**
- Modify: `src/internal/roving.ts`, `src/internal/use-popover-trigger.ts`, hai spec, `.size-limit.json`
- Test: `src/internal/roving.test.ts`, `src/internal/use-popover-trigger.test.tsx`

**Interfaces:**
- Consumes: không có gì mới.
- Produces (Task 3 dùng):
  - `hasModifier(event: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }): boolean`, trả `true` khi giữ Alt, Ctrl hoặc Meta. Shift không tính.
  - `focusNext` trả `false` và không làm gì với một phím như vậy.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/internal/roving.test.ts b/src/internal/roving.test.ts
index 63bef1b..d93d2a3 100644
--- a/src/internal/roving.test.ts
+++ b/src/internal/roving.test.ts
@@ -1,5 +1,5 @@
-import { describe, expect, it } from 'vitest';
-import { getNextIndex } from './roving';
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import { focusNext, getNextIndex } from './roving';
 
 const items = (...disabled: boolean[]) => disabled.map((value) => ({ disabled: value }));
 const vertical = { orientation: 'vertical', loop: true } as const;
@@ -47,3 +47,47 @@ describe('getNextIndex', () => {
     expect(getNextIndex(items(true, true), 0, 'ArrowDown', vertical)).toBeNull();
   });
 });
+
+describe('focusNext', () => {
+  afterEach(() => document.body.replaceChildren());
+
+  const buttons = (count: number) =>
+    Array.from({ length: count }, (_, index) => {
+      const button = document.createElement('button');
+      button.textContent = String(index);
+      document.body.append(button);
+      return button;
+    });
+  const keydown = (
+    key: string,
+    modifiers: Partial<Record<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>> = {},
+  ) => ({
+    key,
+    ...modifiers,
+    preventDefault: vi.fn(),
+  });
+
+  it('moves focus for a navigation key and reports it', () => {
+    const list = buttons(3);
+    list[0]?.focus();
+    const event = keydown('ArrowDown');
+    expect(focusNext(event, list, vertical)).toBe(true);
+    expect(document.activeElement).toBe(list[1]);
+    expect(event.preventDefault).toHaveBeenCalled();
+  });
+
+  it('leaves a key with Alt, Ctrl or Meta to the browser and the system', () => {
+    const list = buttons(3);
+    list[0]?.focus();
+    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
+      for (const key of ['ArrowDown', 'End']) {
+        const event = keydown(key, { [modifier]: true });
+        expect(focusNext(event, list, vertical)).toBe(false);
+        expect(event.preventDefault).not.toHaveBeenCalled();
+      }
+    }
+    expect(document.activeElement).toBe(list[0]);
+    // Shift alone changes nothing a list does with these keys.
+    expect(focusNext(keydown('ArrowDown', { shiftKey: true }), list, vertical)).toBe(true);
+  });
+});
diff --git a/src/internal/use-popover-trigger.test.tsx b/src/internal/use-popover-trigger.test.tsx
index fd5b0b5..2bf1f6e 100644
--- a/src/internal/use-popover-trigger.test.tsx
+++ b/src/internal/use-popover-trigger.test.tsx
@@ -43,6 +43,23 @@ describe('usePopoverState', () => {
     expect(onOpenChange).toHaveBeenCalledWith(false);
   });
 
+  it('reports nothing and notes nothing for a request for the state it already has', () => {
+    const onOpenChange = vi.fn();
+    const { result } = renderHook(() =>
+      usePopoverState<HTMLDivElement>({
+        open: undefined,
+        defaultOpen: false,
+        onOpenChange,
+        name: 'Test',
+      }),
+    );
+    result.current.contentRef.current = fakePopover(false);
+    act(() => result.current.request(false));
+    expect(result.current.open).toBe(false);
+    expect(result.current.pendingToggle.current).toBeNull();
+    expect(onOpenChange).not.toHaveBeenCalled();
+  });
+
   it('notes nothing for a change the browser has not made yet', () => {
     const { result } = renderHook(() =>
       usePopoverState<HTMLDivElement>({
@@ -73,8 +90,12 @@ describe('useTriggerPress', () => {
 
   it('goes by the state now for a click from the keyboard or from code', () => {
     const toggle = vi.fn();
-    const { result } = renderHook(() => useTriggerPress(false, toggle));
+    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
+      initialProps: { open: true },
+    });
+    // A press that never became a click (dragged off) leaves a note from when it was open.
     result.current.onPointerDown();
+    rerender({ open: false });
     result.current.onClick({ detail: 0 });
     expect(toggle).toHaveBeenCalledWith(false, false);
   });
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/internal/roving.test.ts src/internal/use-popover-trigger.test.tsx`
Expected: 1 test FAIL (`leaves a key with Alt, Ctrl or Meta to the browser and the system`) với `AssertionError: expected true to be false`; 21 test PASS. Các test của `use-popover-trigger.test.tsx` PASS ngay, vì chúng siết chặt hành vi đã có. Nếu `onClick` dùng ghi chú của lần bấm cả cho click từ bàn phím, test `goes by the state now for a click from the keyboard or from code` sẽ fail.

- [ ] **Step 3: Thêm `hasModifier` và chuyển việc ghi `openNow` vào layout effect**

```diff
diff --git a/src/internal/roving.ts b/src/internal/roving.ts
index 8a86504..6307b37 100644
--- a/src/internal/roving.ts
+++ b/src/internal/roving.ts
@@ -42,20 +42,37 @@ export function getNextIndex(
   return before ?? (loop ? last : current);
 }
 
+/** The modifier keys of a key event; all optional, so a plain `{ key }` object works as well. */
+export interface Modifiers {
+  altKey?: boolean;
+  ctrlKey?: boolean;
+  metaKey?: boolean;
+}
+
+/**
+ * True when Alt, Ctrl or Meta is held: Alt+←, Ctrl+Home and the like belong to the browser or the
+ * system, not to the list. Shift is not counted; it means nothing to these keys here.
+ */
+export function hasModifier(event: Modifiers): boolean {
+  return event.altKey === true || event.ctrlKey === true || event.metaKey === true;
+}
+
 /** True for an item the user cannot act on: native `disabled` or `aria-disabled="true"`. */
 export function isDisabledItem(el: Element): boolean {
   return el.getAttribute('aria-disabled') === 'true' || el.matches(':disabled');
 }
 
 /**
- * Moves focus among `items` for a navigation key and reports whether it did. The caller decides
- * what the items are; Tab order (`tabIndex`) is the caller's business too.
+ * Moves focus among `items` for a navigation key and reports whether it did. A key held with Alt,
+ * Ctrl or Meta is left alone. The caller decides what the items are; Tab order (`tabIndex`) is the
+ * caller's business too.
  */
 export function focusNext(
-  event: { key: string; preventDefault(): void },
+  event: Modifiers & { key: string; preventDefault(): void },
   items: readonly HTMLElement[],
   options: RovingOptions,
 ): boolean {
+  if (hasModifier(event)) return false;
   const current = items.indexOf(document.activeElement as HTMLElement);
   const next = getNextIndex(
     items.map((el) => ({ disabled: isDisabledItem(el) })),
diff --git a/src/internal/use-popover-trigger.ts b/src/internal/use-popover-trigger.ts
index 4e2b7a7..7be7eb1 100644
--- a/src/internal/use-popover-trigger.ts
+++ b/src/internal/use-popover-trigger.ts
@@ -1,6 +1,7 @@
 import { useCallback, useRef } from 'react';
 import type { MutableRefObject } from 'react';
 import { useControllableState } from './use-controllable-state';
+import { useIsoLayoutEffect } from './use-iso-layout-effect';
 
 export interface PopoverStateOptions {
   open: boolean | undefined;
@@ -46,8 +47,12 @@ export function usePopoverState<E extends HTMLElement>({
   });
   const contentRef = useRef<E | null>(null);
   const pendingToggle = useRef<boolean | null>(null);
+  // The state of the last commit, for `request` to compare against. Written after the commit, not
+  // during a render that React may throw away.
   const openNow = useRef(isOpen);
-  openNow.current = isOpen;
+  useIsoLayoutEffect(() => {
+    openNow.current = isOpen;
+  });
   const request = useCallback(
     (next: boolean) => {
       const el = contentRef.current;
```

- [ ] **Step 4: Cập nhật hai spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index bcb4f90..38a47e1 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -361,7 +361,7 @@ Cả mười một điểm đều đạt ở chế độ `prefers-contrast: more
 
 ### 6.1 Quy ước API chung
 
-- Mọi component dùng `forwardRef`. Ref trỏ tới **phần tử DOM chính**; với control dựa trên input, đó là `<input>`/`<textarea>` gốc.
+- Mọi component dùng `forwardRef`. Ref trỏ tới **phần tử DOM chính**; với control dựa trên input, đó là `<input>`/`<textarea>` gốc. Ngoại lệ là các phần chỉ làm marker và render `null`, như `SelectItem`, `SelectGroup` và `SelectSeparator`: chúng không có phần tử DOM nào để trỏ tới (ghi lại khi lập Plan D của giai đoạn 2).
 - Với control dựa trên input: `className` và `style` gắn vào **phần tử bọc ngoài**; mọi prop còn lại chuyển xuống **input gốc**.
 - Giữ nguyên sự kiện gốc (`onChange(e)`) và thêm phiên bản tiện dụng (`onCheckedChange(checked: boolean)`, `onValueChange(value: string)`). Khi có cả hai, cả hai đều được gọi, `onChange` trước; nếu `onChange` gọi `preventDefault()` (việc bật/tắt bị huỷ) thì phiên bản tiện dụng không được gọi.
 - Export phẳng (`Card`, `CardHeader`, …), không dùng kiểu `Card.Header`, vì dấu chấm không chạy qua ranh giới client của RSC.
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 8ad9a57..a1dada4 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -432,7 +432,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | `focus.ts` | `getFocusables(root)`, `focusFirst(root)`, `isFocusable(el)`, `returnFocus(target, container, fallback)`, `registerPopoverReturn(popover, getTarget)` | Tìm các phần tử nhận focus được, theo thứ tự DOM, bỏ qua phần tử bị ẩn, `inert` hoặc `disabled`. `returnFocus` trả focus khi một overlay đóng. Nó focus đích trước; đích không nhận focus vì nằm trong một popover đã đóng thì đi tiếp tới chỗ popover đó trả focus về, theo bảng mà `registerPopoverReturn` ghi. `fallback` cũng đi như vậy |
 | `lock-scroll.ts` | `lockScroll(): () => void` | Có đếm số lần khoá. Lần khoá đầu đặt `overflow: hidden` lên `<html>`, kèm `scrollbar-gutter: stable` nếu trang đang có thanh cuộn dọc (để bố cục không bị xô). Lần mở khoá cuối trả lại style cũ |
 | `modal-stack.ts` | `registerModal(el, host)`, `subscribeModals(fn)`, `getTopModal()` | Danh sách các `<dialog>` modal của lib đang mở, theo thứ tự. `host` là phần tử `.flg-toast-host` của dialog đó. Toaster dùng danh sách này (§6.3) |
-| `roving.ts` | `getNextIndex(items, current, key, { orientation, loop })`, `focusNext(event, items, options)`, `isDisabledItem(el)` | `getNextIndex` là hàm thuần: ra chỉ số kế tiếp cho các phím mũi tên, Home và End, bỏ qua item disabled. `focusNext` xử lý một `keydown`: tìm item kế tiếp, `preventDefault` rồi `.focus()` nó, trả `true` nếu đã xử lý. Menu dùng `focusNext` (mọi item có `tabIndex=-1`). Tabs (Plan D) tự giữ `tabIndex=0` ở tab đang chọn và dùng `getNextIndex`. Hook `useRovingFocus` hai chế độ của bản trao đổi bị bỏ khi lập Plan B: menu chỉ cần một hàm |
+| `roving.ts` | `getNextIndex(items, current, key, { orientation, loop })`, `focusNext(event, items, options)`, `hasModifier(event)`, `isDisabledItem(el)` | `getNextIndex` là hàm thuần: ra chỉ số kế tiếp cho các phím mũi tên, Home và End, bỏ qua item disabled. `focusNext` xử lý một `keydown`: tìm item kế tiếp, `preventDefault` rồi `.focus()` nó, trả `true` nếu đã xử lý. Phím có kèm Alt, Ctrl hoặc Meta (`hasModifier`) thuộc về trình duyệt và hệ điều hành, nên `focusNext` và Tabs bỏ qua (thêm ở Plan D). Menu dùng `focusNext` (mọi item có `tabIndex=-1`). Tabs (Plan D) tự giữ `tabIndex=0` ở tab đang chọn và dùng `getNextIndex`. Hook `useRovingFocus` hai chế độ của bản trao đổi bị bỏ khi lập Plan B: menu chỉ cần một hàm |
 | `use-typeahead.ts` | `useTypeahead(getItems, onMatch, getCurrent?)` | `getCurrent` (thêm ở Plan C) là item mà lần gõ bắt đầu từ đó, mặc định là phần tử đang có focus; Select truyền option đang được trỏ, vì focus luôn ở trigger. Gom phím trong 500ms rồi so tiền tố, không phân biệt hoa thường. Gõ lặp một chữ thì nhảy vòng giữa các item cùng chữ đầu. Phím Space nằm giữa một chuỗi đang gõ được tính là ký tự |
 | `use-iso-layout-effect.ts` | `useIsoLayoutEffect` | `useLayoutEffect` trên trình duyệt, `useEffect` trên server (React 18 cảnh báo layout effect khi render ở server). Overlay cần layout effect để mở, đo và chuyển focus trước khi trình duyệt vẽ |
 | `react-lazy.ts` | `resolveLazy(value)` | Gỡ lazy reference của React. Server Component truyền client component xuống dưới dạng lazy reference; ở development nó còn truyền cả element con dưới dạng đó. `Slot` (giai đoạn 1) và `isFieldGroup`/`isFieldControl` dùng hàm này. Thiếu bước này, `asChild` trong Server Component in cảnh báo và lỗi hydrate ở Next dev (phát hiện khi lập Plan A) |
@@ -448,6 +448,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
   - Có con không phải `SelectItem`, `SelectGroup` hay `SelectSeparator`. Con đó bị bỏ qua.
   - Có `SelectItem` với `value` rỗng.
   - Có giá trị không khớp item nào.
+  - `SelectItem`, `SelectGroup` hoặc `SelectSeparator` được render ở ngoài một `Select`.
 - Có hơn một `Toaster` được mount.
 - `toast()` được gọi khi không có `window` (trên server). Lời gọi bị bỏ qua.
 - Một component đổi giữa controlled và uncontrolled.
```

- [ ] **Step 5: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/popover src/components/dropdown-menu src/components/context-menu src/components/select
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 586 test PASS, 2 skip (trước task: 582).
- Story: 252 test PASS (42 story × 3 trình duyệt × 2 theme).
- `check:package` PASS.
- `size:record` cũng nâng dòng CSS (5519 → 5561 B), dù task không đổi CSS. Lý do: các commit cuối của PR #7 đã đổi CSS mà không ghi lại ngưỡng.

- [ ] **Step 6: Commit**

```bash
git add src/internal/roving.ts src/internal/roving.test.ts src/internal/use-popover-trigger.ts src/internal/use-popover-trigger.test.tsx .size-limit.json docs/superpowers/specs
git commit -m "fix(internal): leave modified keys to the browser, and note the popover state after the commit" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: Tách dãy chip và phần đọc item ra khỏi `Select.tsx`

Việc Plan C để lại: `Select.tsx` đã dài khoảng 700 dòng. Hai phần được chuyển ra file riêng; hành vi giữ nguyên:
- `Chips` (các chip đo trên một thước ẩn của Select chọn nhiều) sang `Chips.tsx`.
- Phần đọc `children` thành hàng và option (`textOf`, `toRows`, cùng các cảnh báo) sang `select-rows.ts`, gói trong hàm mới `readRows`.

**Files:**
- Create: `src/components/select/select-rows.ts`, `src/components/select/Chips.tsx`
- Modify: `src/components/select/Select.tsx`, `.size-limit.json`
- Test: `src/components/select/select-rows.test.tsx`

**Interfaces:**
- Consumes: `collectChildren` (Plan C).
- Produces: `readRows(children: ReactNode): { rows: Row[]; options: Option[] }`, `textOf(node: ReactNode): string`, các kiểu `Option` và `Row` (trong `select-rows.ts`); `Chips({ chosen }: { chosen: Option[] })` (trong `Chips.tsx`). Chỉ Select dùng chúng; public API không đổi.

- [ ] **Step 1: Viết test cho module mới**

`src/components/select/select-rows.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { SelectGroup, SelectItem, SelectSeparator } from './Select';
import { readRows, textOf } from './select-rows';

describe('textOf', () => {
  it('joins the text of nested elements and collapses whitespace', () => {
    expect(
      textOf(
        <>
          New <b>York</b>
          {'  '}
          {2026}
        </>,
      ),
    ).toBe('New York 2026');
  });
});

describe('readRows', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('numbers the options in list order through groups, and keys rows by position', () => {
    const { rows, options } = readRows(
      <>
        <SelectItem value="a">A</SelectItem>
        <SelectGroup label="More">
          <SelectItem value="b" disabled>
            B
          </SelectItem>
          <SelectSeparator />
          <SelectItem value="c" textValue="Sea">
            C
          </SelectItem>
        </SelectGroup>
      </>,
    );
    expect(
      options.map(({ index, value, disabled, text }) => [index, value, disabled, text]),
    ).toEqual([
      [0, 'a', false, 'A'],
      [1, 'b', true, 'B'],
      [2, 'c', false, 'Sea'],
    ]);
    expect(rows.map((row) => row.kind)).toEqual(['option', 'group']);
    const group = rows[1];
    expect(group?.kind === 'group' && group.key).toBe('1');
    expect(group?.kind === 'group' && group.rows.map((row) => row.kind)).toEqual([
      'option',
      'separator',
      'option',
    ]);
    expect(
      group?.kind === 'group' && group.rows[1]?.kind === 'separator' && group.rows[1].key,
    ).toBe('1.1');
  });

  it('skips an item with an empty value, and anything that is not a part, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { options } = readRows(
      <>
        <SelectItem value="">Empty</SelectItem>
        <span>Not a part</span>
        <SelectItem value="kept">Kept</SelectItem>
      </>,
    );
    expect(options.map((option) => option.value)).toEqual(['kept']);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/select/select-rows.test.tsx`
Expected: Cả hai project báo `Failed to resolve import "./select-rows"`; chưa test nào chạy.

- [ ] **Step 3: Tạo hai module**

`src/components/select/select-rows.ts`:

```ts
import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { collectChildren } from '../../internal/collect-children';
import type { CollectedPart } from '../../internal/collect-children';
import { devWarn } from '../../internal/warn';
import type { SelectItemProps } from './Select';

const PARTS = ['select-item', 'select-group', 'select-separator'] as const;

const UNKNOWN_CHILD =
  '<Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, ' +
  'arrays and SelectGroup. It skips anything else, including a component of your own that wraps ' +
  'a SelectItem.';
const EMPTY_VALUE =
  '<SelectItem> needs a value that is not empty: the empty value is how the native select says ' +
  'nothing is chosen. The item is skipped.';

/** One option of the Select, in the order the listbox shows it. */
export interface Option {
  index: number;
  value: string;
  disabled: boolean;
  /** For typeahead, the native `<option>` and a chip. */
  text: string;
  children: ReactNode;
}

export type Row =
  | { kind: 'option'; option: Option }
  | { kind: 'group'; key: string; label: ReactNode; rows: Row[] }
  | { kind: 'separator'; key: string };

/** The text inside `node`, as a screen reader would read it. */
export function textOf(node: ReactNode): string {
  let text = '';
  Children.forEach(node, (child) => {
    if (typeof child === 'string' || typeof child === 'number') text += String(child);
    else if (isValidElement<{ children?: ReactNode }>(child)) text += textOf(child.props.children);
  });
  return text.replace(/\s+/g, ' ').trim();
}

function toRows(parts: CollectedPart[], options: Option[], path: string): Row[] {
  const rows: Row[] = [];
  parts.forEach((part, position) => {
    const key = `${path}${position}`;
    if (part.part === 'select-group') {
      rows.push({
        kind: 'group',
        key,
        label: part.props.label as ReactNode,
        rows: toRows(part.parts ?? [], options, `${key}.`),
      });
    } else if (part.part === 'select-separator') {
      rows.push({ kind: 'separator', key });
    } else {
      const props = part.props as unknown as SelectItemProps;
      if (typeof props.value !== 'string' || props.value === '') {
        devWarn(EMPTY_VALUE);
        return;
      }
      const option: Option = {
        index: options.length,
        value: props.value,
        disabled: props.disabled === true,
        text: props.textValue ?? textOf(props.children),
        children: props.children,
      };
      options.push(option);
      rows.push({ kind: 'option', option });
    }
  });
  return rows;
}

/**
 * The Select's rows (options, groups, separators) and its options in list order, read from
 * `children` without rendering them. Rows are keyed by position, never by the caller's keys.
 */
export function readRows(children: ReactNode): { rows: Row[]; options: Option[] } {
  const options: Option[] = [];
  const rows = toRows(
    collectChildren(children, {
      parts: PARTS,
      groups: ['select-group'],
      onUnknown: () => devWarn(UNKNOWN_CHILD),
    }),
    options,
    '',
  );
  return { rows, options };
}
```

`src/components/select/Chips.tsx`:

```tsx
import { useRef, useState } from 'react';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { Badge } from '../badge/Badge';
import type { Option } from './select-rows';

/** Gap between chips, in px; matches `.flg-select-chips`. */
const CHIP_GAP = 4;

/**
 * The chosen values of a multiple Select as chips, as many as fit, and the rest as one "+N" chip.
 * The first chip always shows, cut short when it alone is too wide: a lone "+N" would not say what
 * is chosen. A hidden ruler holds every chip, so what fits is measured without rendering twice.
 */
export function Chips({ chosen }: { chosen: Option[] }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(chosen.length);
  const key = chosen.map((option) => option.value).join('\u0000');
  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    const ruler = rulerRef.current;
    if (!box || !ruler) return;
    const measure = () => {
      const widths = Array.from(ruler.children, (chip) => chip.getBoundingClientRect().width);
      const plus = widths.pop() ?? 0;
      const room = box.clientWidth;
      let used = 0;
      let count = 0;
      for (const [index, width] of widths.entries()) {
        const next = used + (index > 0 ? CHIP_GAP : 0) + width;
        const rest = widths.length - index - 1;
        if (next + (rest > 0 ? CHIP_GAP + plus : 0) > room) break;
        used = next;
        count = index + 1;
      }
      setVisible(Math.max(count, 1));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    // The room changes with the trigger; the chips' widths change when a web font arrives.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(ruler);
    return () => observer.disconnect();
  }, [key]);
  const hidden = chosen.length - visible;
  return (
    <span ref={boxRef} className="flg-select-chips" aria-hidden="true">
      {chosen.slice(0, visible).map((option) => (
        <Badge key={option.value} variant="neutral">
          <span className="flg-select-chip-label">{option.text}</span>
        </Badge>
      ))}
      {hidden > 0 ? (
        <Badge variant="accent" className="flg-select-more">
          +{hidden}
        </Badge>
      ) : null}
      <span ref={rulerRef} className="flg-select-ruler">
        {chosen.map((option) => (
          <Badge key={option.value} variant="neutral">
            {option.text}
          </Badge>
        ))}
        <Badge variant="accent">+{chosen.length}</Badge>
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Cho `Select.tsx` dùng chúng**

```diff
diff --git a/src/components/select/Select.tsx b/src/components/select/Select.tsx
index d312927..7a6033c 100644
--- a/src/components/select/Select.tsx
+++ b/src/components/select/Select.tsx
@@ -1,17 +1,7 @@
 'use client';
 
 import { clsx } from 'clsx';
-import {
-  Children,
-  forwardRef,
-  isValidElement,
-  useCallback,
-  useEffect,
-  useId,
-  useMemo,
-  useRef,
-  useState,
-} from 'react';
+import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
 import type {
   ChangeEvent,
   CSSProperties,
@@ -20,8 +10,7 @@ import type {
   ReactElement,
   ReactNode,
 } from 'react';
-import { collectChildren, markPart } from '../../internal/collect-children';
-import type { CollectedPart } from '../../internal/collect-children';
+import { markPart } from '../../internal/collect-children';
 import { dataAttr } from '../../internal/data-attr';
 import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
 import { BoxCheckIcon, CheckIcon, strokeIcon } from '../../internal/icons';
@@ -34,7 +23,9 @@ import { usePopover } from '../../internal/use-popover';
 import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
 import { useTypeahead } from '../../internal/use-typeahead';
 import { devWarn, isProduction } from '../../internal/warn';
-import { Badge } from '../badge/Badge';
+import { Chips } from './Chips';
+import { readRows } from './select-rows';
+import type { Option, Row } from './select-rows';
 
 interface SelectBaseProps {
   /** The name the value is submitted under, through a hidden native `<select>`. */
@@ -103,75 +94,8 @@ export interface SelectGroupProps {
 /** Takes no props. */
 export type SelectSeparatorProps = Record<string, never>;
 
-const PARTS = ['select-item', 'select-group', 'select-separator'] as const;
-
-const UNKNOWN_CHILD =
-  '<Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, ' +
-  'arrays and SelectGroup. It skips anything else, including a component of your own that wraps ' +
-  'a SelectItem.';
-const EMPTY_VALUE =
-  '<SelectItem> needs a value that is not empty: the empty value is how the native select says ' +
-  'nothing is chosen. The item is skipped.';
 const OUTSIDE = (part: string) => `<${part}> must be rendered inside a <Select>.`;
 
-/** One option of the Select, in the order the listbox shows it. */
-interface Option {
-  index: number;
-  value: string;
-  disabled: boolean;
-  /** For typeahead, the native `<option>` and a chip. */
-  text: string;
-  children: ReactNode;
-}
-
-type Row =
-  | { kind: 'option'; option: Option }
-  | { kind: 'group'; key: string; label: ReactNode; rows: Row[] }
-  | { kind: 'separator'; key: string };
-
-/** The text inside `node`, as a screen reader would read it. */
-function textOf(node: ReactNode): string {
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
-        devWarn(EMPTY_VALUE);
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
 const CHEVRON = (
   <svg {...strokeIcon} className="flg-select-chevron">
     <path d="m6 9 6 6 6-6" />
@@ -180,71 +104,6 @@ const CHEVRON = (
 const CHECK = <CheckIcon />;
 const BOX_CHECK = <BoxCheckIcon />;
 
-/** Gap between chips, in px; matches `.flg-select-chips`. */
-const CHIP_GAP = 4;
-
-/**
- * The chosen values of a multiple Select as chips, as many as fit, and the rest as one "+N" chip.
- * The first chip always shows, cut short when it alone is too wide: a lone "+N" would not say what
- * is chosen. A hidden ruler holds every chip, so what fits is measured without rendering twice.
- */
-function Chips({ chosen }: { chosen: Option[] }) {
-  const boxRef = useRef<HTMLSpanElement>(null);
-  const rulerRef = useRef<HTMLSpanElement>(null);
-  const [visible, setVisible] = useState(chosen.length);
-  const key = chosen.map((option) => option.value).join('\u0000');
-  useIsoLayoutEffect(() => {
-    const box = boxRef.current;
-    const ruler = rulerRef.current;
-    if (!box || !ruler) return;
-    const measure = () => {
-      const widths = Array.from(ruler.children, (chip) => chip.getBoundingClientRect().width);
-      const plus = widths.pop() ?? 0;
-      const room = box.clientWidth;
-      let used = 0;
-      let count = 0;
-      for (const [index, width] of widths.entries()) {
-        const next = used + (index > 0 ? CHIP_GAP : 0) + width;
-        const rest = widths.length - index - 1;
-        if (next + (rest > 0 ? CHIP_GAP + plus : 0) > room) break;
-        used = next;
-        count = index + 1;
-      }
-      setVisible(Math.max(count, 1));
-    };
-    measure();
-    if (typeof ResizeObserver === 'undefined') return;
-    // The room changes with the trigger; the chips' widths change when a web font arrives.
-    const observer = new ResizeObserver(measure);
-    observer.observe(box);
-    observer.observe(ruler);
-    return () => observer.disconnect();
-  }, [key]);
-  const hidden = chosen.length - visible;
-  return (
-    <span ref={boxRef} className="flg-select-chips" aria-hidden="true">
-      {chosen.slice(0, visible).map((option) => (
-        <Badge key={option.value} variant="neutral">
-          <span className="flg-select-chip-label">{option.text}</span>
-        </Badge>
-      ))}
-      {hidden > 0 ? (
-        <Badge variant="accent" className="flg-select-more">
-          +{hidden}
-        </Badge>
-      ) : null}
-      <span ref={rulerRef} className="flg-select-ruler">
-        {chosen.map((option) => (
-          <Badge key={option.value} variant="neutral">
-            {option.text}
-          </Badge>
-        ))}
-        <Badge variant="accent">+{chosen.length}</Badge>
-      </span>
-    </span>
-  );
-}
-
 /**
  * A select-only combobox: a trigger that opens a listbox of options, with a hidden native `<select>`
  * that takes part in forms (FormData, `required`, reset, autofill). Choose one value, or several with
@@ -276,19 +135,7 @@ export const Select = markAsFieldControl(
 
     // --- Items, read from children without rendering them; again only when the children change, not
     // on every move of the highlight.
-    const { rows, options } = useMemo(() => {
-      const collected: Option[] = [];
-      const list = toRows(
-        collectChildren(children, {
-          parts: PARTS,
-          groups: ['select-group'],
-          onUnknown: () => devWarn(UNKNOWN_CHILD),
-        }),
-        collected,
-        '',
-      );
-      return { rows: list, options: collected };
-    }, [children]);
+    const { rows, options } = useMemo(() => readRows(children), [children]);
 
     // --- Value.
     const defaultValue = multiple
```

Không file mới nào có `"use client"`: chỉ `Select.tsx` (một module client) import chúng.

- [ ] **Step 5: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 592 test PASS, 2 skip.
- Story: 78 test PASS (13 story × 3 trình duyệt × 2 theme). Các story của Select chạy lại mà không cần sửa.
- `check:package` PASS: `dist/components/select/` có thêm `Chips.js` và `select-rows.js`, không có directive.

- [ ] **Step 6: Commit**

```bash
git add src/components/select .size-limit.json
git commit -m "refactor(select): move the chips and the row model out of Select.tsx" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: Tabs, kiểu `underline`, hai hướng và hai chế độ chọn

**Files:**
- Create: `src/components/tabs/Tabs.tsx`, `src/components/tabs/index.ts`, `src/components/tabs/Tabs.stories.tsx`, `src/components/tabs/Tabs.mdx`, `src/styles/components/tabs.css`
- Modify: `src/styles/index.css`, `src/styles/preferences.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.tsx`, hai spec, `.size-limit.json`
- Test: `src/components/tabs/Tabs.test.tsx`, `src/components/tabs/Tabs.test-d.ts`, `src/docs/ExceptionTable.test.tsx`

**Interfaces:**
- Consumes: `getNextIndex`, `hasModifier` (Task 1), `useControllableState`, `useIsoLayoutEffect`, `mergeRefs`, `composeEventHandlers`.
- Produces:
  - `Tabs` (`<div class="flg-tabs" data-orientation data-variant>`), props `TabsProps`: `value?`, `defaultValue?`, `onValueChange?: (value: string) => void`, `orientation?: 'horizontal' | 'vertical'`, `activationMode?: 'automatic' | 'manual'`, `variant?: 'underline' | 'segmented' | 'pill'`, cùng mọi prop HTML của `<div>`.
  - `TabsList` (`role="tablist"`, `data-variant`), `TabsTrigger` (`value`, `disabled`), `TabsContent` (`value`).
  - Kiểu `TabsVariant`, `TabsActivationMode`. Task 4 thêm CSS cho `segmented` và `pill` dựa trên `.flg-tabs-list[data-variant=…]`.
  - Check tương phản `tab-indicator`.

- [ ] **Step 1: Viết unit test và test kiểu**

`src/components/tabs/Tabs.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import type { TabsProps } from './Tabs';

function Example(props: Omit<TabsProps, 'children'>) {
  return (
    <Tabs {...props}>
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="members">Members panel</TabsContent>
      <TabsContent value="billing">Billing panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
const press = (key: string, init: Record<string, boolean> = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });

describe('Tabs', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('ties every tab to its panel and shows only the selected panel', () => {
    render(<Example defaultValue="members" />);
    const list = screen.getByRole('tablist', { name: 'Project' });
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    const members = tab('Members');
    expect(members).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Members' });
    expect(members).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Members panel');
    expect(panel).toHaveAttribute('tabindex', '0');
    // The other panels stay mounted, hidden.
    expect(screen.getByText('Overview panel')).not.toBeVisible();
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(4);
  });

  it('builds ids that stay single tokens whatever the value holds', () => {
    render(
      <Tabs defaultValue="Billing history">
        <TabsList aria-label="Account">
          <TabsTrigger value="Billing history">Billing history</TabsTrigger>
          <TabsTrigger value="Billing_history">Underscore</TabsTrigger>
        </TabsList>
        <TabsContent value="Billing history">History</TabsContent>
        <TabsContent value="Billing_history">Other</TabsContent>
      </Tabs>,
    );
    const first = tab('Billing history');
    const second = tab('Underscore');
    expect(first.getAttribute('aria-controls')).not.toMatch(/\s/);
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('tabpanel', { name: 'Billing history' })).toHaveTextContent('History');
  });

  it('gives Tab to the selected tab only', () => {
    render(<Example defaultValue="members" />);
    expect(tab('Members')).toHaveAttribute('tabindex', '0');
    for (const name of ['Overview', 'Billing', 'Settings']) {
      expect(tab(name)).toHaveAttribute('tabindex', '-1');
    }
  });

  it('gives Tab to the first enabled tab when no enabled tab is selected', () => {
    const { rerender } = render(<Example />);
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    rerender(<Example value="billing" onValueChange={() => {}} />);
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    expect(tab('Billing')).toHaveAttribute('tabindex', '-1');
  });

  it('moves with the arrows, wraps at the ends and skips a disabled tab, selecting as it goes', () => {
    const onValueChange = vi.fn();
    render(<Example defaultValue="overview" onValueChange={onValueChange} />);
    act(() => tab('Overview').focus());
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    press('ArrowRight');
    expect(tab('Settings')).toHaveFocus();
    press('ArrowRight');
    expect(tab('Overview')).toHaveFocus();
    press('ArrowLeft');
    expect(tab('Settings')).toHaveFocus();
    press('Home');
    expect(tab('Overview')).toHaveFocus();
    press('End');
    expect(tab('Settings')).toHaveFocus();
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      'members',
      'settings',
      'overview',
      'settings',
      'overview',
      'settings',
    ]);
  });

  it('leaves the arrows of the other orientation and keys with Alt, Ctrl or Meta alone', () => {
    render(<Example defaultValue="overview" />);
    act(() => tab('Overview').focus());
    press('ArrowDown');
    press('ArrowRight', { ctrlKey: true });
    press('ArrowRight', { altKey: true });
    press('End', { metaKey: true });
    expect(tab('Overview')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('uses ↑ and ↓ when vertical', () => {
    render(<Example defaultValue="overview" orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    act(() => tab('Overview').focus());
    press('ArrowDown');
    expect(tab('Members')).toHaveFocus();
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
  });

  it('moves focus without selecting in manual mode, and selects on a click', () => {
    const onValueChange = vi.fn();
    render(
      <Example defaultValue="overview" activationMode="manual" onValueChange={onValueChange} />,
    );
    act(() => tab('Overview').focus());
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
    // Enter and Space click a focused button.
    fireEvent.click(tab('Members'));
    expect(onValueChange).toHaveBeenCalledWith('members');
    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
  });

  it('reports a click on a controlled Tabs and keeps the value its parent gives', () => {
    const onValueChange = vi.fn();
    render(<Example value="overview" onValueChange={onValueChange} />);
    fireEvent.click(tab('Settings'));
    expect(onValueChange).toHaveBeenCalledWith('settings');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Overview panel')).toBeVisible();
  });

  it('renders the selected panel on the server and hides the others', () => {
    const html = renderToString(<Example defaultValue="settings" />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const panels = Array.from(doc.querySelectorAll('[role="tabpanel"]'));
    expect(
      panels.filter((panel) => !panel.hasAttribute('hidden')).map((p) => p.textContent),
    ).toEqual(['Settings panel']);
    expect(doc.querySelector('[aria-selected="true"]')?.getAttribute('tabindex')).toBe('0');
  });

  it('warns when a part is rendered outside Tabs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<TabsTrigger value="lost">Lost</TabsTrigger>);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <TabsTrigger> must be rendered inside a <Tabs>.',
    );
  });
});
```

`src/components/tabs/Tabs.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { TabsProps, TabsTriggerProps } from './Tabs';

test('Tabs take only the documented variants, orientations and activation modes', () => {
  expectTypeOf<TabsProps['variant']>().toEqualTypeOf<
    'underline' | 'segmented' | 'pill' | undefined
  >();
  expectTypeOf<TabsProps['orientation']>().toEqualTypeOf<'vertical' | 'horizontal' | undefined>();
  expectTypeOf<TabsProps['activationMode']>().toEqualTypeOf<'automatic' | 'manual' | undefined>();
  // @ts-expect-error an unknown variant
  const unknownVariant: TabsProps = { variant: 'boxed' };
  // @ts-expect-error a tab needs the value that ties it to its panel
  const noValue: TabsTriggerProps = { children: 'Overview' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(noValue).toBeObject();
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/tabs`
Expected: Cả hai project báo `Failed to resolve import "./Tabs"` cho `Tabs.test.tsx`, và test kiểu fail với `Cannot find module './Tabs'`.

- [ ] **Step 3: Viết Tabs**

`src/components/tabs/Tabs.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { createContext, forwardRef, useContext, useId, useMemo, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { mergeRefs } from '../../internal/merge-refs';
import { getNextIndex, hasModifier } from '../../internal/roving';
import type { Orientation } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';

export type TabsVariant = 'underline' | 'segmented' | 'pill';
export type TabsActivationMode = 'automatic' | 'manual';

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /** The value of the selected tab. Pass it with `onValueChange` to control it. */
  value?: string;
  /** The tab selected at first, when uncontrolled. */
  defaultValue?: string;
  /** Called with the value of the tab the user selects. */
  onValueChange?: (value: string) => void;
  /** Default `"horizontal"`: ← and → move between the tabs. `"vertical"`: ↑ and ↓. */
  orientation?: Orientation;
  /** Default `"automatic"`: the tab that gets focus is selected. `"manual"`: Enter or Space selects. */
  activationMode?: TabsActivationMode;
  /** Default `"underline"`. */
  variant?: TabsVariant;
}
export type TabsListProps = HTMLAttributes<HTMLDivElement>;
export interface TabsTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Ties the tab to the `TabsContent` with the same value. */
  value: string;
}
export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Ties the panel to the `TabsTrigger` with the same value. */
  value: string;
}

interface TabsContextValue {
  baseId: string;
  value: string | undefined;
  select: (value: string) => void;
  orientation: Orientation;
  activationMode: TabsActivationMode;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);
/** The tab that takes Tab when no enabled tab is selected; set by `TabsList`. */
const FallbackContext = createContext<string | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <Tabs>.`);
    return {
      baseId: '',
      value: undefined,
      select: () => {},
      orientation: 'horizontal',
      activationMode: 'automatic',
      variant: 'underline',
    };
  }
  return ctx;
}

/**
 * A value as part of an id. `aria-controls` and `aria-labelledby` hold space-separated ids, so only
 * letters, digits and `-` stay as they are; every other character (`_` too) becomes `_<hex>_`, and
 * two values never share an id.
 */
function idPart(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/g, (char) => `_${(char.codePointAt(0) ?? 0).toString(16)}_`);
}
const triggerId = (baseId: string, value: string) => `${baseId}-tab-${idPart(value)}`;
const contentId = (baseId: string, value: string) => `${baseId}-panel-${idPart(value)}`;

/** The tabs of this list, in order; not those of a Tabs nested inside one of its panels. */
function tabsOf(list: HTMLElement): HTMLButtonElement[] {
  return Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]')).filter(
    (tab) => tab.closest('[role="tablist"]') === list,
  );
}

/** The value of each tab element, for the list's fallback; kept off the DOM. */
const values = new WeakMap<HTMLElement, string>();

/**
 * Tabs: a list of tabs, each showing its own panel. Every panel stays mounted; the ones not selected
 * are `hidden`. `TabsList`, `TabsTrigger` and `TabsContent` go inside.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    activationMode = 'automatic',
    variant = 'underline',
    className,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: onValueChange as ((value: string | undefined) => void) | undefined,
    name: 'Tabs',
  });
  const baseId = useId();
  const ctx = useMemo(
    () => ({ baseId, value, select: setValue, orientation, activationMode, variant }),
    [baseId, value, setValue, orientation, activationMode, variant],
  );
  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={ref}
        className={clsx('flg-tabs', className)}
        data-orientation={orientation}
        data-variant={variant}
        {...props}
      />
    </TabsContext.Provider>
  );
});

/** The row (or column) of tabs. Name it with `aria-label` or `aria-labelledby`. */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, onKeyDown, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsList');
  const listRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, listRef), [ref]);
  // With no enabled tab selected (no value yet, or the selected one is disabled), Tab would skip the
  // list: the first enabled tab takes Tab instead. Known only once the tabs are in the document.
  const [fallback, setFallback] = useState<string | null>(null);
  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const tabs = tabsOf(list);
    const reachable = tabs.some(
      (tab) => tab.getAttribute('aria-selected') === 'true' && !tab.disabled,
    );
    const first = reachable ? undefined : tabs.find((tab) => !tab.disabled);
    const next = first ? (values.get(first) ?? null) : null;
    setFallback((current) => (current === next ? current : next));
  });
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list || hasModifier(event)) return;
    const tabs = tabsOf(list);
    const current = tabs.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    const next = getNextIndex(
      tabs.map((tab) => ({ disabled: tab.disabled })),
      current,
      event.key,
      { orientation: ctx.orientation, loop: true },
    );
    if (next === null) return;
    event.preventDefault();
    // Focus selects the tab in automatic mode (see TabsTrigger).
    tabs[next]?.focus();
  };
  return (
    <FallbackContext.Provider value={fallback}>
      {/* The tabs take focus, not the list: the arrow keys reach it from the focused tab (APG). */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={mergedRef}
        role="tablist"
        aria-orientation={ctx.orientation}
        className={clsx('flg-tabs-list', className)}
        data-variant={ctx.variant}
        {...props}
        onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
      />
    </FallbackContext.Provider>
  );
});

/** One tab. A disabled tab uses the native `disabled` and is skipped by the arrow keys. */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, disabled = false, className, onClick, onFocus, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsTrigger');
  const fallback = useContext(FallbackContext);
  const selected = ctx.value === value;
  const register = useMemo(
    () =>
      mergeRefs(ref, (el: HTMLButtonElement | null) => {
        if (el) values.set(el, value);
      }),
    [ref, value],
  );
  return (
    <button
      ref={register}
      type="button"
      role="tab"
      id={triggerId(ctx.baseId, value)}
      aria-selected={selected}
      aria-controls={contentId(ctx.baseId, value)}
      tabIndex={(selected && !disabled) || fallback === value ? 0 : -1}
      disabled={disabled}
      className={clsx('flg-tabs-trigger', className)}
      {...props}
      onClick={composeEventHandlers(onClick, () => ctx.select(value))}
      onFocus={composeEventHandlers(onFocus, () => {
        if (ctx.activationMode === 'automatic') ctx.select(value);
      })}
    />
  );
});

/** The panel of the tab with the same value. Stays mounted; `hidden` while its tab is not selected. */
export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, className, ...props },
  ref,
) {
  const ctx = useTabsContext('TabsContent');
  return (
    <div
      ref={ref}
      role="tabpanel"
      id={contentId(ctx.baseId, value)}
      aria-labelledby={triggerId(ctx.baseId, value)}
      tabIndex={0}
      hidden={ctx.value !== value}
      className={clsx('flg-tabs-content', className)}
      {...props}
    />
  );
});
```

`src/components/tabs/index.ts`:

```ts
export { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
export type {
  TabsActivationMode,
  TabsContentProps,
  TabsListProps,
  TabsProps,
  TabsTriggerProps,
  TabsVariant,
} from './Tabs';
```

Một số điểm của code:
- Phím mũi tên chỉ di chuyển focus. Việc chọn nằm ở `onFocus` của tab (chế độ `automatic`) và ở `onClick` (cả hai chế độ; Enter và Space bấm một nút đang có focus).
- `TabsList` tìm tab dự phòng trong một layout effect, vì cần các tab đã có trong DOM. Giá trị của mỗi tab được giữ trong một `WeakMap`, không ghi ra DOM.

Run: `pnpm vitest run --project unit --project unit-react18 src/components/tabs`
Expected: 23 test PASS (11 test × React 19 và 18.3, cùng test kiểu)

- [ ] **Step 4: CSS và quy tắc forced colors**

`src/styles/components/tabs.css`:

```css
/* Tabs (spec §4.3 Tabs, mockup tabs T1). The tab list sits above its panels, 12px apart, as in the
   mockup's Card; vertical tabs sit at the left of the panels (outside the mockup). */
@layer flg.components {
  .flg-tabs {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    font-family: var(--flg-font-sans);
    color: var(--flg-text);
  }
  .flg-tabs[data-orientation='vertical'] {
    flex-direction: row;
    align-items: flex-start;
  }
  .flg-tabs-list {
    display: flex;
    gap: 4px;
  }
  .flg-tabs-list[aria-orientation='vertical'] {
    flex-direction: column;
  }
  .flg-tabs-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-sizing: border-box;
    height: 32px;
    margin: 0;
    padding: 0 12px;
    border: 0;
    border-radius: var(--flg-radius-xs);
    background: transparent;
    color: var(--flg-text-muted);
    font: var(--flg-weight-medium) var(--flg-text-sm) var(--flg-font-sans);
    white-space: nowrap;
    cursor: pointer;
  }
  .flg-tabs-trigger[aria-selected='true'] {
    color: var(--flg-text);
  }
  .flg-tabs-trigger:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .flg-tabs-trigger:focus-visible,
  .flg-tabs-content:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-tabs-content {
    min-width: 0;
    border-radius: var(--flg-radius-xs);
  }
  .flg-tabs[data-orientation='vertical'] > .flg-tabs-content {
    flex: 1;
  }

  /* underline (T1): a hairline under the row; the selected tab has a 2px accent bar on it, 10px in
     from each side. Vertical: the line and the bar move to the right edge of the column. */
  .flg-tabs-list[data-variant='underline'] {
    gap: 0;
    border-bottom: 1px solid var(--flg-control-border);
  }
  .flg-tabs-list[data-variant='underline'] .flg-tabs-trigger {
    padding: 0 14px;
    border-radius: 0;
  }
  .flg-tabs-list[data-variant='underline'] .flg-tabs-trigger[aria-selected='true']::after {
    content: '';
    position: absolute;
    right: 10px;
    bottom: -1px;
    left: 10px;
    height: 2px;
    border-radius: 2px;
    background: var(--flg-accent-gradient);
  }
  .flg-tabs-list[data-variant='underline'][aria-orientation='vertical'] {
    border-right: 1px solid var(--flg-control-border);
    border-bottom: 0;
  }
  .flg-tabs-list[data-variant='underline'][aria-orientation='vertical']
    .flg-tabs-trigger[aria-selected='true']::after {
    top: 6px;
    right: -1px;
    bottom: 6px;
    left: auto;
    width: 2px;
    height: auto;
  }
}
```

```diff
diff --git a/src/styles/index.css b/src/styles/index.css
index be2eab7..bc8715f 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -22,5 +22,6 @@
 @import './components/tooltip.css';
 @import './components/menu.css';
 @import './components/select.css';
+@import './components/tabs.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index fba2971..7868fff 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -175,5 +175,15 @@
       border-color: CanvasText;
       background: Canvas;
     }
+    .flg-tabs-list[data-variant='underline'] {
+      border-color: CanvasText;
+    }
+    /* The bar under the selected tab: forced colours drop its accent gradient (spec §4.5). */
+    .flg-tabs-trigger[aria-selected='true']::after {
+      background: Highlight;
+    }
+    .flg-tabs-trigger:disabled {
+      color: GrayText;
+    }
   }
 }
```

- [ ] **Step 5: Export và danh sách kiểm tra gói**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index cfb305d..7239baa 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -49,6 +49,10 @@ const SHIPPED_CLASSES = [
   'flg-select-ruler',
   'flg-select-box',
   'flg-select-listbox',
+  'flg-tabs',
+  'flg-tabs-list',
+  'flg-tabs-trigger',
+  'flg-tabs-content',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index d6d1f21..67d4db9 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -21,6 +21,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/dropdown-menu/DropdownMenu.tsx',
   'src/components/context-menu/ContextMenu.tsx',
   'src/components/select/Select.tsx',
+  'src/components/tabs/Tabs.tsx',
 ];
 
 /**
diff --git a/src/index.test.ts b/src/index.test.ts
index 11bcb6f..8c7a7e7 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -64,6 +64,10 @@ describe('public API', () => {
       'Spinner',
       'Surface',
       'Switch',
+      'Tabs',
+      'TabsContent',
+      'TabsList',
+      'TabsTrigger',
       'Textarea',
       'Tooltip',
       'TooltipContent',
diff --git a/src/index.ts b/src/index.ts
index 86319fa..28882ca 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -130,6 +130,15 @@ export type {
   SelectSeparatorProps,
   SelectSingleProps,
 } from './components/select';
+export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
+export type {
+  TabsActivationMode,
+  TabsContentProps,
+  TabsListProps,
+  TabsProps,
+  TabsTriggerProps,
+  TabsVariant,
+} from './components/tabs';
 export type {
   ContextMenuContentProps,
   ContextMenuProps,
```

- [ ] **Step 6: Đo vạch dưới tab đang chọn**

```diff
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 58c190e..b411da4 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -41,7 +41,8 @@ const D = {
   },
   5: {
     description:
-      'Accent fill of checked states (checkbox, radio dot, switch on) against the surface',
+      'Accent fill of checked states (checkbox, radio dot, switch on) and the bar under the ' +
+      'selected underline tab, against the surface',
     criterion: '1.4.11',
   },
   6: { description: 'Muted text on the brightest reference backdrop', criterion: '1.4.3' },
@@ -74,6 +75,7 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 4, theme: 'dark', check: 'on-accent-start', recorded: 3.63, ...D[4] },
   { row: 4, theme: 'dark', check: 'on-accent-end', recorded: 2.24, ...D[4] },
   { row: 5, theme: 'dark', check: 'checked-fill', recorded: 2.26, ...D[5] },
+  { row: 5, theme: 'dark', check: 'tab-indicator', recorded: 2.26, ...D[5] },
   { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, ...D[6] },
   { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
   { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 82f57c7..ef4a80e 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -28,6 +28,7 @@ export const CHECKS = {
   'focus-indicator': 3,
   'input-focus-border': 3,
   'checked-fill': 3,
+  'tab-indicator': 3,
   'tooltip-text': 4.5,
   'highlight-text': 4.5,
   'highlight-danger-text': 4.5,
@@ -230,6 +231,12 @@ export function measure(
       }),
     );
     const neutralBg = composite(color('control-track'), surface);
+    // The accent gradient on the surface: a checked control's fill, and the bar under the selected
+    // underline tab.
+    const accentFill = Math.min(
+      contrastRatio(color('accent-start'), surface),
+      contrastRatio(color('accent-end'), surface),
+    );
     // A menu or listbox item under the pointer or the keyboard: the worst stop of its background.
     const onPaint = (fg: string, bg: string) =>
       Math.min(
@@ -258,10 +265,8 @@ export function measure(
       ),
       'focus-indicator': contrastRatio(composite(focusColor, surface), surface),
       'input-focus-border': contrastRatio(composite(color('accent-solid'), control), control),
-      'checked-fill': Math.min(
-        contrastRatio(color('accent-start'), surface),
-        contrastRatio(color('accent-end'), surface),
-      ),
+      'checked-fill': accentFill,
+      'tab-indicator': accentFill,
       'highlight-text': onPaint('highlight-text', 'highlight-bg'),
       'highlight-danger-text': onPaint('highlight-danger-text', 'highlight-danger-bg'),
       'highlight-icon': onPaint('highlight-icon', 'highlight-bg'),
```

Run: `pnpm check:contrast | grep tab-indicator`
Expected: `tab-indicator` đạt ở light (3.04:1) và ở `prefers-contrast: more`, và là `known-exception` 2.26:1 ở dark, đúng như `checked-fill` (phát hiện 3).

- [ ] **Step 7: Bảng ngoại lệ trong docs gộp số trùng**

Dòng 5 giờ có hai check cùng số, nên bảng in "2.26:1 / 2.26:1" (phát hiện 4). Thêm test:

```diff
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index a586106..2e7a6ad 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -66,4 +66,10 @@ describe('ExceptionTable', () => {
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
     expect(cells(rows[5]!).at(-2)).toBe('4.5:1');
   });
+
+  it('gives one number for a row whose checks measure the same pair', () => {
+    const [, light, dark] = cells(bodyRows()[4]!);
+    expect(light).toMatch(/^meets AA \(3\.\d\d:1\)$/);
+    expect(dark).toBe('2.26:1');
+  });
 });
```

Run: `pnpm vitest run --project unit src/docs/ExceptionTable.test.tsx`
Expected: 1 test FAIL (`gives one number for a row whose checks measure the same pair`) với `AssertionError: expected '2.26:1 / 2.26:1' to be '2.26:1'`.

```diff
diff --git a/src/docs/ExceptionTable.tsx b/src/docs/ExceptionTable.tsx
index 83b4714..c39e288 100644
--- a/src/docs/ExceptionTable.tsx
+++ b/src/docs/ExceptionTable.tsx
@@ -31,7 +31,9 @@ export function ExceptionTable() {
           const cell = (theme: ThemeName) => {
             const own = entries.filter((exception) => exception.theme === theme);
             if (own.length > 0) {
-              return own.map((exception) => `${exception.recorded.toFixed(2)}:1`).join(' / ');
+              // Two checks of one pair (a checkbox's fill and a tab's bar) give one number.
+              const recorded = own.map((exception) => `${exception.recorded.toFixed(2)}:1`);
+              return [...new Set(recorded)].join(' / ');
             }
             // No exception for this theme: show what it actually measures, so the docs stay exact.
             const lowest = Math.min(...checks.map((check) => live[theme][check]));
```

Run lại lệnh trên. Expected: mọi test PASS.

- [ ] **Step 8: Story và trang docs**

`src/components/tabs/Tabs.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Badge } from '../badge/Badge';
import { Card } from '../card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import type { TabsProps } from './Tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: { onValueChange: fn() },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// The panel text of the approved mockup (tabs T1–T3).
const panelText: CSSProperties = {
  fontSize: 'var(--flg-text-sm)',
  color: 'var(--flg-text-muted)',
  lineHeight: 1.5,
};
const strong: CSSProperties = {
  color: 'var(--flg-text)',
  fontWeight: 'var(--flg-weight-semibold)',
};

/** The tabs of the mockup: the first selected, "Billing" disabled, a count on "Members". */
function Project(props: Omit<TabsProps, 'children'>) {
  return (
    <Tabs defaultValue="overview" {...props}>
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">
          Members <Badge variant="neutral">12</Badge>
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" style={panelText}>
        <span style={strong}>Website 2026</span>
        <br />
        14 files · updated 2 hours ago · 3 open tasks.
      </TabsContent>
      <TabsContent value="members" style={panelText}>
        12 members, 3 of them admins.
      </TabsContent>
      <TabsContent value="settings" style={panelText}>
        Name, visibility and integrations.
      </TabsContent>
      <TabsContent value="billing" style={panelText}>
        Invoices and payment methods.
      </TabsContent>
    </Tabs>
  );
}

const column = { display: 'grid', gap: 16, width: 420 } as const;
const card = { gap: 12 } as const;

export const Variants: Story = {
  render: () => (
    <div style={column}>
      <Card style={card}>
        <Project />
      </Card>
      <Card style={card}>
        <Project orientation="vertical" />
      </Card>
    </div>
  ),
};

export const Keyboard: Story = {
  tags: ['no-visual'],
  render: (args) => <Project onValueChange={args.onValueChange} />,
  play: async ({ canvas, args }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    // Only the selected tab is in the Tab order; Tab goes on to its panel.
    await userEvent.tab();
    await expect(tab('Overview')).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('tabpanel', { name: 'Overview' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    // The arrows move and select, wrap at the ends, and skip the disabled tab.
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Members')).toHaveFocus();
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel', { name: /^Members/ })).toBeVisible();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect(tab('Overview')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tab('Settings')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(tab('Overview')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(tab('Settings')).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
    // A key held with Ctrl is the browser's.
    await userEvent.keyboard('{Control>}{ArrowRight}{/Control}');
    await expect(tab('Settings')).toHaveFocus();
  },
};

export const Manual: Story = {
  tags: ['no-visual'],
  render: (args) => <Project activationMode="manual" onValueChange={args.onValueChange} />,
  play: async ({ canvas, args }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    tab('Overview').focus();
    // The arrows move focus only; Enter or Space selects.
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Members')).toHaveFocus();
    await expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight} ');
    await expect(tab('Settings')).toHaveAttribute('aria-selected', 'true');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
  },
};

export const Vertical: Story = {
  tags: ['no-visual'],
  render: (args) => <Project orientation="vertical" onValueChange={args.onValueChange} />,
  play: async ({ canvas }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    await expect(canvas.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    tab('Overview').focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(tab('Members')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(tab('Members')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect(tab('Settings')).toHaveFocus();
  },
};

function ControlledTabs({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [value, setValue] = useState('overview');
  return (
    <div style={column}>
      <Project
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          if (next !== 'settings') setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue('settings')}>
        Open settings
      </button>
    </div>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: (args) => <ControlledTabs onValueChange={args.onValueChange as (v: string) => void} />,
  play: async ({ canvas, args }) => {
    const tab = (name: string) => canvas.getByRole('tab', { name: new RegExp(`^${name}`) });
    await userEvent.click(tab('Members'));
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    // A parent that refuses a value keeps its own; the request was still reported.
    await userEvent.click(tab('Settings'));
    await expect(args.onValueChange).toHaveBeenLastCalledWith('settings');
    await expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    // The parent can select any tab itself.
    await userEvent.click(canvas.getByRole('button', { name: 'Open settings' }));
    await expect(tab('Settings')).toHaveAttribute('aria-selected', 'true');
    await expect(
      within(canvas.getByRole('tabpanel', { name: 'Settings' })).getByText(/Name/),
    ).toBeVisible();
  },
};
```

`src/components/tabs/Tabs.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Tabs.stories';

<Meta of={Stories} />

# Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'fl-glass-ui';

<Tabs defaultValue="overview">
  <TabsList aria-label="Project">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="members">Members</TabsTrigger>
    <TabsTrigger value="billing" disabled>
      Billing
    </TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  <TabsContent value="members">…</TabsContent>
  <TabsContent value="billing">…</TabsContent>
</Tabs>;
```

<Canvas of={Stories.Variants} />
<Controls />

## Parts

- `TabsList` holds the tabs. Name it with `aria-label` or `aria-labelledby`.
- `TabsTrigger` is one tab. Its `value` ties it to the `TabsContent` with the same `value`; any
  string works, spaces included. A `disabled` tab is skipped by the arrow keys.
- `TabsContent` is the panel of one tab. Every panel stays mounted, so its state survives a switch;
  the panels of the tabs not selected are `hidden`.

`value`, `defaultValue` and `onValueChange` select a tab, as for the other controls.

## Orientation and activation

- `orientation="horizontal"` (default) puts the tabs above the panels; `"vertical"` puts them in a
  column at the left, and the arrow keys follow.
- `activationMode="automatic"` (default) selects the tab that gets focus, so the arrow keys switch
  panels as they go. `"manual"` moves focus only, and Enter or Space selects: use it when showing a
  panel is slow.

## Keyboard

Only the selected tab is in the Tab order; Tab moves on from it to its panel. When no enabled tab
is selected, the first enabled tab takes its place.

| Key                    | Does                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| ← / → (horizontal)     | Previous / next tab, wrapping at the ends; in automatic mode, selects it |
| ↑ / ↓ (vertical)       | The same, in a vertical list                                             |
| Home, End              | First / last tab                                                         |
| Enter, Space           | Selects the focused tab (manual mode)                                    |
| With Alt, Ctrl or Meta | Nothing: those keys are the browser's and the system's                   |

## Accessibility

- The list is a `tablist` with `aria-orientation`; each tab is a `tab` with `aria-selected` and
  `aria-controls`; each panel is a `tabpanel` named by its tab, and takes focus (`tabIndex` 0), so
  its content is reachable even when it has nothing focusable.
- The bar under the selected tab is the accent gradient. In dark it measures 2.26:1 against the
  surface, below the 3:1 for non-text contrast; see row 5 on the Accessibility page. The selected
  tab's text is also brighter than the others.

## Do and don't

- Do use tabs to switch between views of the same thing.
- Don't use them for steps that must happen in order, or for navigation between pages; use links.
- Don't hide something the user must see in a tab that is not selected at first.
````

`Variants` là story duy nhất của task có ảnh chuẩn visual. Các story khác dùng `userEvent` của Testing Library: Tabs chỉ phản ứng với sự kiện React, nên không cần input thật.

- [ ] **Step 9: Cập nhật hai spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 38a47e1..8b9ccf6 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -316,7 +316,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus) | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
-| 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
+| 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
 | 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ Badge `accent` (`--flg-accent-text` trên `--flg-accent-subtle`) | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Item menu (hoặc option của Select) đang được trỏ: nền `--flg-accent-subtle` so với nền panel | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index a1dada4..e00631c 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -322,7 +322,9 @@ Số liệu lấy từ mockup đã duyệt. Mọi giá trị đều dùng token
   - Tab đang chọn có nền `--flg-accent-subtle`, chữ `--flg-accent-text`.
 - **`orientation="vertical"`** (ngoài mockup, chủ dự án duyệt qua ảnh chuẩn visual):
   - Hàng tab xếp dọc, nằm bên trái panel.
-  - Với `underline`, đường kẻ và vạch chuyển sang mép phải của hàng tab.
+  - Với `underline`, đường kẻ và vạch chuyển sang mép phải của hàng tab. Vạch thụt vào 6px ở trên và dưới.
+- **Khoảng cách:** hàng tab và panel cách nhau 12px, như khoảng cách trong Card của mockup (ghi lại khi lập Plan D). Panel không có kiểu chữ riêng; nội dung do người dùng đặt.
+- **Focus:** tab và panel có ring focus như Button.
 
 **Accordion (A1):**
 
@@ -388,7 +390,7 @@ Vì cùng một cặp màu, số đo không đổi so với Badge: 3.40:1 light
 - **Dấu hiệu không phải chữ, ngưỡng 3:1:**
   - Nền item đang được trỏ so với nền panel. Đây là dấu hiệu focus của menu và listbox.
   - Ô checkbox đã chọn của Select chọn nhiều so với nền option đang được trỏ (check `highlight-chosen-box`, thêm khi review Plan C).
-  - Vạch của tab `underline`.
+  - Vạch của tab `underline` (check `tab-indicator`). Vạch là gradient nhấn trên bề mặt, cùng cặp màu với trạng thái đã chọn của checkbox, nên số đo giống dòng 5 của §4.9: đạt ở light (3.04:1), 2.26:1 ở dark. Dòng 5 được mở rộng cho vạch này (Plan D).
   - Nền tab `segmented` đang chọn so với rãnh.
   - Nền tab `pill` và nền trang hiện tại so với bề mặt.
   - Icon trạng thái của Toast.
@@ -444,6 +446,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 - `PopoverContent` thiếu cả `aria-label` lẫn `aria-labelledby`.
 - Con của `TooltipTrigger` không nhận focus được.
 - Một phần `Menu*` nằm ngoài menu; một `MenuRadioItem` nằm ngoài `MenuRadioGroup`.
+- `TabsList`, `TabsTrigger` hoặc `TabsContent` nằm ngoài `Tabs`.
 - Select:
   - Có con không phải `SelectItem`, `SelectGroup` hay `SelectSeparator`. Con đó bị bỏ qua.
   - Có `SelectItem` với `value` rỗng.
@@ -765,12 +768,16 @@ Mặc định `orientation="horizontal"`, `activationMode="automatic"`, `variant
 - **Các phần con:**
   - `TabsList`: `role="tablist"`, `aria-orientation`. Người dùng nên đặt `aria-label` cho nó.
   - `TabsTrigger` (nhận `value`, `disabled`): `<button role="tab" aria-selected aria-controls>`. Roving tabindex: chỉ tab đang chọn có `tabIndex=0`. Tab disabled dùng `disabled` gốc và bị bỏ qua khi điều hướng.
+    - Khi không có tab nào được chọn mà bật được (chưa có giá trị, hoặc tab được chọn bị disabled), tab bật được đầu tiên nhận `tabIndex=0`. Nếu không, phím Tab bỏ qua cả hàng tab (phát hiện khi lập Plan D).
+    - `id` của tab và panel sinh từ `useId` và `value`. Ký tự ngoài chữ cái, chữ số và `-` được mã hoá, nên `value` có dấu cách vẫn ra một id duy nhất và hợp lệ trong `aria-controls` (bài học của Plan C).
   - `TabsContent` (nhận `value`): `role="tabpanel"` với `aria-labelledby` và `tabIndex=0`. Panel không được chọn vẫn được mount nhưng có `hidden`.
 - **Bàn phím:**
   - ← và → (ngang) hoặc ↑ và ↓ (dọc) di chuyển, quay vòng ở hai đầu.
   - Home và End nhảy về đầu và cuối.
   - `automatic`: tab nhận focus là tab được chọn.
   - `manual`: phải bấm Enter hoặc Space mới chọn.
+  - Phím có kèm Alt, Ctrl hoặc Meta được để cho trình duyệt (`hasModifier`, §5).
+- `Tabs` render một `<div>` và nhận mọi prop HTML của nó. Một phần của Tabs nằm ngoài `Tabs` thì in cảnh báo dev.
 
 **`Accordion`**
 
```

- [ ] **Step 10: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm check:contrast
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 616 test PASS, 2 skip.
- `check:contrast` PASS.
- Story: 30 test PASS (5 story × 3 trình duyệt × 2 theme).
- `check:package` PASS.

- [ ] **Step 11: Commit**

```bash
git add src/components/tabs src/styles src/index.ts src/index.test.ts scripts src/docs .size-limit.json docs/superpowers/specs
git commit -m "feat(tabs): add Tabs with the underline look, both orientations and both activation modes" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: Kiểu `segmented` và `pill`, và phép đo của tab đang chọn

**Files:**
- Modify: `src/styles/theme/values.ts`, `src/styles/components/tabs.css`, `src/styles/preferences.css`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/components/tabs/Tabs.stories.tsx`, `src/components/tabs/Tabs.mdx`, hai spec, `.size-limit.json`
- Test: `src/docs/ExceptionTable.test.tsx`

**Interfaces:**
- Consumes: Tabs và `data-variant` (Task 3).
- Produces (Task 7 dùng):
  - Token dẫn xuất `--flg-selected-bg` (mặc định `var(--flg-accent-subtle)`) và `--flg-selected-text` (mặc định `var(--flg-accent-text)`). Ở `prefers-contrast: more`, chúng là `var(--flg-highlight-bg)` và `var(--flg-highlight-text)`.
  - Check tương phản `segmented-text`, `segmented-indicator`, `selected-text`, `selected-indicator`.

- [ ] **Step 1: Thêm hai token**

```diff
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index b9eddf9..e91b4de 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -121,6 +121,10 @@ export const derivedTokens: TokenMap = {
   'highlight-danger-bg': 'color-mix(in srgb, var(--flg-danger) 16%, transparent)',
   'highlight-danger-text': 'var(--flg-danger)',
   'highlight-icon': 'var(--flg-text-muted)',
+  // A selected pill tab and the current page (mockups tabs T3 and pagination G1): the accent wash
+  // with accent text, as an accent Badge.
+  'selected-bg': 'var(--flg-accent-subtle)',
+  'selected-text': 'var(--flg-accent-text)',
 };
 
 /** No backdrop-filter support, or prefers-reduced-transparency: an almost opaque surface. */
@@ -144,6 +148,9 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     'highlight-danger-bg': 'var(--flg-danger-fill)',
     'highlight-danger-text': 'var(--flg-on-danger)',
     'highlight-icon': 'var(--flg-highlight-text)',
+    // The solid accent of a highlighted item (spec §4.4).
+    'selected-bg': 'var(--flg-highlight-bg)',
+    'selected-text': 'var(--flg-highlight-text)',
   },
   light: {
     'glass-tint': 'rgb(250,251,255)',
```

- [ ] **Step 2: CSS của hai kiểu, và quy tắc cho hai chế độ đặc biệt**

```diff
diff --git a/src/styles/components/tabs.css b/src/styles/components/tabs.css
index 386e814..339040f 100644
--- a/src/styles/components/tabs.css
+++ b/src/styles/components/tabs.css
@@ -91,4 +91,33 @@
     width: 2px;
     height: auto;
   }
+
+  /* segmented (T2): the tabs sit in a track as wide as they are; the selected one is raised. */
+  .flg-tabs-list[data-variant='segmented'] {
+    width: fit-content;
+    padding: 3px;
+    border-radius: var(--flg-radius-md);
+    background: var(--flg-control-track);
+  }
+  .flg-tabs-list[data-variant='segmented'] .flg-tabs-trigger {
+    height: 28px;
+    border-radius: calc(var(--flg-radius-md) - 3px);
+  }
+  .flg-tabs-list[data-variant='segmented'] .flg-tabs-trigger[aria-selected='true'] {
+    background: var(--flg-control-bg);
+  }
+  /* The focus ring is a shadow too: while focused, the tab shows the ring instead. */
+  .flg-tabs-list[data-variant='segmented']
+    .flg-tabs-trigger[aria-selected='true']:not(:focus-visible) {
+    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
+  }
+
+  /* pill (T3): round tabs; the selected one has the accent wash and accent text. */
+  .flg-tabs-list[data-variant='pill'] .flg-tabs-trigger {
+    border-radius: var(--flg-radius-full);
+  }
+  .flg-tabs-list[data-variant='pill'] .flg-tabs-trigger[aria-selected='true'] {
+    background: var(--flg-selected-bg);
+    color: var(--flg-selected-text);
+  }
 }
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 7868fff..473707c 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -8,6 +8,10 @@
       background: var(--flg-highlight-text);
       color: var(--flg-highlight-bg);
     }
+    /* The selected segmented tab gets an edge of the text colour, which its track can tell apart. */
+    .flg-tabs-list[data-variant='segmented'] .flg-tabs-trigger[aria-selected='true'] {
+      box-shadow: inset 0 0 0 1px var(--flg-text);
+    }
   }
   @media (forced-colors: active) {
     .flg-surface {
@@ -185,5 +189,10 @@
     .flg-tabs-trigger:disabled {
       color: GrayText;
     }
+    /* A selected segmented or pill tab loses its fill: a Highlight edge marks it instead. */
+    .flg-tabs-list:is([data-variant='segmented'], [data-variant='pill'])
+      .flg-tabs-trigger[aria-selected='true'] {
+      border: 1px solid Highlight;
+    }
   }
 }
```

Tab `segmented` đang chọn bỏ bóng nổi khi có `:focus-visible`, vì ring focus cũng là một `box-shadow` (phát hiện 5). Ở `prefers-contrast: more`, viền 1px màu chữ là một `box-shadow` inset, nên tab không đổi kích thước.

- [ ] **Step 3: Đo bốn cặp màu mới**

```diff
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index ef4a80e..a7de24b 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -29,6 +29,10 @@ export const CHECKS = {
   'input-focus-border': 3,
   'checked-fill': 3,
   'tab-indicator': 3,
+  'segmented-text': 4.5,
+  'segmented-indicator': 3,
+  'selected-text': 4.5,
+  'selected-indicator': 3,
   'tooltip-text': 4.5,
   'highlight-text': 4.5,
   'highlight-danger-text': 4.5,
@@ -230,6 +234,7 @@ export function measure(
         return contrastRatio(composite(color('accent-text'), bg), bg);
       }),
     );
+    // The track of a neutral Badge and of a segmented tab list.
     const neutralBg = composite(color('control-track'), surface);
     // The accent gradient on the surface: a checked control's fill, and the bar under the selected
     // underline tab.
@@ -237,7 +242,8 @@ export function measure(
       contrastRatio(color('accent-start'), surface),
       contrastRatio(color('accent-end'), surface),
     );
-    // A menu or listbox item under the pointer or the keyboard: the worst stop of its background.
+    // A menu or listbox item under the pointer or the keyboard, a selected pill tab, the current
+    // page: the worst stop of its background, for its text and against the surface.
     const onPaint = (fg: string, bg: string) =>
       Math.min(
         ...paintStops(resolveToken(t, bg)).map((stop) => {
@@ -245,6 +251,12 @@ export function measure(
           return contrastRatio(composite(color(fg), under), under);
         }),
       );
+    const paintOnSurface = (bg: string) =>
+      Math.min(
+        ...paintStops(resolveToken(t, bg)).map((stop) =>
+          contrastRatio(composite(stop, surface), surface),
+        ),
+      );
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -267,14 +279,19 @@ export function measure(
       'input-focus-border': contrastRatio(composite(color('accent-solid'), control), control),
       'checked-fill': accentFill,
       'tab-indicator': accentFill,
+      'segmented-text': contrastRatio(composite(color('text-muted'), neutralBg), neutralBg),
+      // The selected segmented tab against its track: raised on control-bg, or under contrast-more
+      // edged with a line of the text colour (preferences.css).
+      'segmented-indicator':
+        mode === 'contrast-more'
+          ? contrastRatio(composite(color('text'), neutralBg), neutralBg)
+          : contrastRatio(composite(color('control-bg'), neutralBg), neutralBg),
+      'selected-text': onPaint('selected-text', 'selected-bg'),
+      'selected-indicator': paintOnSurface('selected-bg'),
       'highlight-text': onPaint('highlight-text', 'highlight-bg'),
       'highlight-danger-text': onPaint('highlight-danger-text', 'highlight-danger-bg'),
       'highlight-icon': onPaint('highlight-icon', 'highlight-bg'),
-      'highlight-indicator': Math.min(
-        ...paintStops(resolveToken(t, 'highlight-bg')).map((stop) =>
-          contrastRatio(composite(stop, surface), surface),
-        ),
-      ),
+      'highlight-indicator': paintOnSurface('highlight-bg'),
       // The box of a chosen option of a multiple Select, on a highlighted row: filled with the accent
       // (select.css), or under contrast-more with the row's text colour (preferences.css).
       'highlight-chosen-box': Math.min(
```

Run: `pnpm check:contrast`
Expected: `check:contrast` FAIL với tám dòng `fail` ở theme mặc định:
- light: `segmented-text` 4.10, `segmented-indicator` 1.24, `selected-text` 3.40, `selected-indicator` 1.15;
- dark: `segmented-text` 3.36, `segmented-indicator` 1.12, `selected-text` 3.76, `selected-indicator` 1.18.

Cả bốn check đều đạt ở `prefers-contrast: more`. `selected-text` và `selected-indicator` có đúng số của `badge-accent` và `highlight-indicator` (dòng 7 và 8), vì tab `pill` dùng cùng cặp màu.

- [ ] **Step 4: Viết test bảng docs cho 13 dòng**

```diff
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 2e7a6ad..a2df0d5 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the eleven rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the thirteen rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(11);
+    expect(rows).toHaveLength(13);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -29,6 +29,8 @@ describe('ExceptionTable', () => {
       '9',
       '10',
       '11',
+      '12',
+      '13',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -38,6 +40,8 @@ describe('ExceptionTable', () => {
     expect(cells(rows[9]!)[1]).toBe('4.24:1');
     expect(cells(rows[9]!)[2]).toMatch(/^meets AA \(4\.\d\d:1\)$/);
     expect(cells(rows[10]!).slice(1, 3)).toEqual(['2.61:1', '1.91:1']);
+    expect(cells(rows[11]!).slice(1, 3)).toEqual(['4.10:1', '3.36:1']);
+    expect(cells(rows[12]!).slice(1, 3)).toEqual(['1.24:1', '1.12:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -61,6 +65,8 @@ describe('ExceptionTable', () => {
       '1.4.3, 1.4.11',
       '1.4.3',
       '1.4.11',
+      '1.4.3',
+      '1.4.11',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
```

Run: `pnpm vitest run --project unit src/docs/ExceptionTable.test.tsx`
Expected: 2 test FAIL: `lists the thirteen rows…` với `expected […] to have a length of 13 but got 11`, và `names the WCAG criterion and minimum of every row`; 2 test PASS.

- [ ] **Step 5: Ghi các ngoại lệ**

```diff
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index b411da4..8422374 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -46,9 +46,14 @@ const D = {
     criterion: '1.4.11',
   },
   6: { description: 'Muted text on the brightest reference backdrop', criterion: '1.4.3' },
-  7: { description: 'Accent badge text on the accent badge background', criterion: '1.4.3' },
+  7: {
+    description: 'Accent text on the accent wash: an accent Badge, a selected pill tab',
+    criterion: '1.4.3',
+  },
   8: {
-    description: 'Highlighted menu item or Select option: the accent wash against the panel',
+    description:
+      'The accent wash against the panel or surface: a highlighted menu item or Select option, a ' +
+      'selected pill tab',
     criterion: '1.4.11',
   },
   9: {
@@ -63,6 +68,8 @@ const D = {
       'accent wash of the row',
     criterion: '1.4.11',
   },
+  12: { description: 'Muted text of a segmented tab on its track', criterion: '1.4.3' },
+  13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -79,11 +86,19 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.1, ...D[6] },
   { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.4, ...D[7] },
   { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.76, ...D[7] },
+  { row: 7, theme: 'light', check: 'selected-text', recorded: 3.4, ...D[7] },
+  { row: 7, theme: 'dark', check: 'selected-text', recorded: 3.76, ...D[7] },
   { row: 8, theme: 'light', check: 'highlight-indicator', recorded: 1.15, ...D[8] },
   { row: 8, theme: 'dark', check: 'highlight-indicator', recorded: 1.18, ...D[8] },
+  { row: 8, theme: 'light', check: 'selected-indicator', recorded: 1.15, ...D[8] },
+  { row: 8, theme: 'dark', check: 'selected-indicator', recorded: 1.18, ...D[8] },
   { row: 9, theme: 'light', check: 'highlight-icon', recorded: 4.37, ...D[9] },
   { row: 9, theme: 'dark', check: 'highlight-icon', recorded: 3.6, ...D[9] },
   { row: 10, theme: 'light', check: 'highlight-danger-text', recorded: 4.24, ...D[10] },
   { row: 11, theme: 'light', check: 'highlight-chosen-box', recorded: 2.61, ...D[11] },
   { row: 11, theme: 'dark', check: 'highlight-chosen-box', recorded: 1.91, ...D[11] },
+  { row: 12, theme: 'light', check: 'segmented-text', recorded: 4.1, ...D[12] },
+  { row: 12, theme: 'dark', check: 'segmented-text', recorded: 3.36, ...D[12] },
+  { row: 13, theme: 'light', check: 'segmented-indicator', recorded: 1.24, ...D[13] },
+  { row: 13, theme: 'dark', check: 'segmented-indicator', recorded: 1.12, ...D[13] },
 ];
```

Run: `pnpm check:contrast | tail -1 && pnpm vitest run --project unit src/docs/ExceptionTable.test.tsx`
Expected: `Contrast check passed.`, và mọi test của bảng PASS.

- [ ] **Step 6: Story và trang docs**

```diff
diff --git a/src/components/tabs/Tabs.mdx b/src/components/tabs/Tabs.mdx
index 3071c45..8fbadce 100644
--- a/src/components/tabs/Tabs.mdx
+++ b/src/components/tabs/Tabs.mdx
@@ -35,6 +35,12 @@ import { Tabs, TabsContent, TabsList, TabsTrigger } from 'fl-glass-ui';
 
 `value`, `defaultValue` and `onValueChange` select a tab, as for the other controls.
 
+## Variants
+
+- `variant="underline"` (default): a line under the row, and an accent bar under the selected tab.
+- `variant="segmented"`: the tabs sit in a track as wide as they are; the selected one is raised.
+- `variant="pill"`: round tabs; the selected one has the accent wash and accent text.
+
 ## Orientation and activation
 
 - `orientation="horizontal"` (default) puts the tabs above the panels; `"vertical"` puts them in a
@@ -61,9 +67,15 @@ is selected, the first enabled tab takes its place.
 - The list is a `tablist` with `aria-orientation`; each tab is a `tab` with `aria-selected` and
   `aria-controls`; each panel is a `tabpanel` named by its tab, and takes focus (`tabIndex` 0), so
   its content is reachable even when it has nothing focusable.
-- The bar under the selected tab is the accent gradient. In dark it measures 2.26:1 against the
-  surface, below the 3:1 for non-text contrast; see row 5 on the Accessibility page. The selected
-  tab's text is also brighter than the others.
+- The selected tab's text is brighter than the others in every variant. The approved looks also
+  mark it with colours below the WCAG minimums in the default theme, listed on the Accessibility
+  page:
+  - `underline`: the accent bar, in dark (row 5);
+  - `segmented`: the raised tab against its track, and the muted text on the track (rows 12, 13);
+  - `pill`: the accent wash against the surface, and the accent text on it (rows 7, 8).
+
+  With `prefers-contrast: more` they all meet AA: the bar and the pill are solid accent, and the
+  selected segmented tab has an edge of the text colour.
 
 ## Do and don't
 
diff --git a/src/components/tabs/Tabs.stories.tsx b/src/components/tabs/Tabs.stories.tsx
index d433547..84d4104 100644
--- a/src/components/tabs/Tabs.stories.tsx
+++ b/src/components/tabs/Tabs.stories.tsx
@@ -68,6 +68,12 @@ export const Variants: Story = {
       <Card style={card}>
         <Project />
       </Card>
+      <Card style={card}>
+        <Project variant="segmented" />
+      </Card>
+      <Card style={card}>
+        <Project variant="pill" />
+      </Card>
       <Card style={card}>
         <Project orientation="vertical" />
       </Card>
```

- [ ] **Step 7: Cập nhật hai spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 8b9ccf6..48c79ec 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -318,15 +318,17 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
 | 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
-| 7 | Chữ Badge `accent` (`--flg-accent-text` trên `--flg-accent-subtle`) | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
-| 8 | Item menu (hoặc option của Select) đang được trỏ: nền `--flg-accent-subtle` so với nền panel | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
+| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
+| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
 | 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
+| 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track` | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
+| 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
-Cả mười một điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Cả mười ba điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index e00631c..348fbf1 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -225,6 +225,13 @@ Các file nằm ở `docs/superpowers/specs/mockups/`. Mỗi file trình bày nh
 
 Icon, phím tắt và chevron của item đang được trỏ dùng `--flg-highlight-icon`. Ở item `danger`, chúng lấy màu chữ của item.
 
+**Tab `pill` đang chọn và trang hiện tại của Pagination** dùng hai token dẫn xuất (thêm ở Plan D, để script tương phản đo đúng thứ CSS dùng):
+
+| Token | Mặc định | `prefers-contrast: more` |
+|---|---|---|
+| `--flg-selected-bg` | `var(--flg-accent-subtle)` | `var(--flg-highlight-bg)` |
+| `--flg-selected-text` | `var(--flg-accent-text)` | `var(--flg-highlight-text)` |
+
 **Quy tắc hiệu năng (thay §4.5 của spec 0+1).** Chỉ các phần tử sau được dùng `backdrop-filter`:
 
 - `Surface` và `Card`.
@@ -391,16 +398,18 @@ Vì cùng một cặp màu, số đo không đổi so với Badge: 3.40:1 light
   - Nền item đang được trỏ so với nền panel. Đây là dấu hiệu focus của menu và listbox.
   - Ô checkbox đã chọn của Select chọn nhiều so với nền option đang được trỏ (check `highlight-chosen-box`, thêm khi review Plan C).
   - Vạch của tab `underline` (check `tab-indicator`). Vạch là gradient nhấn trên bề mặt, cùng cặp màu với trạng thái đã chọn của checkbox, nên số đo giống dòng 5 của §4.9: đạt ở light (3.04:1), 2.26:1 ở dark. Dòng 5 được mở rộng cho vạch này (Plan D).
-  - Nền tab `segmented` đang chọn so với rãnh.
-  - Nền tab `pill` và nền trang hiện tại so với bề mặt.
+  - Nền tab `segmented` đang chọn so với rãnh (check `segmented-indicator`).
+  - Nền tab `pill` và nền trang hiện tại so với bề mặt (check `selected-indicator`, cùng cặp màu với dòng 8).
   - Icon trạng thái của Toast.
-- **Chữ tab chưa chọn** (`--flg-text-muted`) trên rãnh `segmented`.
+- **Chữ tab chưa chọn** (`--flg-text-muted`) trên rãnh `segmented` (check `segmented-text`).
+- **Chữ tab `pill` đang chọn và trang hiện tại** (check `selected-text`, cùng cặp màu với dòng 7).
 
 **Cách xử lý kết quả:**
 
 - Cặp nào dưới ngưỡng mà đúng như mockup thì được thêm vào §4.9 thành một dòng mới, kèm số đo (làm tròn xuống).
 - Danh sách điểm mới được nêu trong mô tả PR để chủ dự án biết.
 - Plan B đo item menu đang được trỏ và thêm ba dòng 8–10 vào §4.9: nền item so với panel (1.15:1 light, 1.18:1 dark), icon và phím tắt `--flg-text-muted` trên nền đó (4.37:1 light, 3.60:1 dark), chữ danger trên nền danger 16% (4.24:1 light; dark đạt). Chữ `--flg-text` trên nền item đạt ở cả hai theme. Cả ba dòng đều đạt ở `prefers-contrast: more`.
+- Plan D đo tab và thêm dòng 12 và 13 vào §4.9: chữ mờ trên rãnh `segmented` (4.10:1 light, 3.36:1 dark) và tab `segmented` đang chọn so với rãnh (1.24:1 light, 1.12:1 dark), đúng như mockup T2. Tab `pill` đang chọn có cùng số đo với dòng 7 và 8, nên hai dòng đó được mở rộng. Ở `prefers-contrast: more` cả bốn check đều đạt.
 - Plan C đo ô checkbox đã chọn trên option đang được trỏ và thêm dòng 11 vào §4.9: màu nhấn của ô so với nền của hàng (2.61:1 light, 1.91:1 dark), đúng như mockup M1. Ở `prefers-contrast: more` ô đổi màu (quy tắc bên dưới) và đạt (6.28:1 light, 8.15:1 dark).
 
 **`prefers-contrast: more`.** Mọi cặp mới đều phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, thêm các quy tắc sau (đều ngoài mockup, chỉ có hiệu lực khi người dùng bật tùy chọn này):
```

- [ ] **Step 8: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm check:contrast
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 616 test PASS, 2 skip.
- Story: 30 test PASS (5 story × 3 trình duyệt × 2 theme).
- `check:contrast` và `check:package` PASS.

- [ ] **Step 9: Commit**

```bash
git add src/styles scripts src/docs src/components/tabs .size-limit.json docs/superpowers/specs
git commit -m "feat(tabs): add the segmented and pill looks, and measure what marks the selected tab" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Accordion

**Files:**
- Create: `src/components/accordion/Accordion.tsx`, `src/components/accordion/index.ts`, `src/components/accordion/Accordion.stories.tsx`, `src/components/accordion/Accordion.mdx`, `src/styles/components/accordion.css`
- Modify: `src/styles/index.css`, `src/styles/preferences.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, spec giai đoạn 2, `.size-limit.json`
- Test: `src/components/accordion/Accordion.test.tsx`, `src/components/accordion/Accordion.test-d.ts`

**Interfaces:**
- Consumes: `useControllableState`, `useIsoLayoutEffect`, `mergeRefs`, `composeEventHandlers`, `strokeIcon` (Plan C).
- Produces: `Accordion` (`<div class="flg-surface flg-accordion" data-type>`), props `AccordionProps = AccordionSingleProps | AccordionMultipleProps`:
  - `type?: 'single'`, `value?: string | null`, `defaultValue?: string`, `onValueChange?: (value: string | null) => void`;
  - hoặc `type: 'multiple'`, `value?: string[]`, `defaultValue?: string[]`, `onValueChange?: (value: string[]) => void`.

  Các phần con: `AccordionItem` (`<details>`, nhận `value`, `disabled`), `AccordionTrigger` (`<summary>`), `AccordionContent` (`<div>`).

- [ ] **Step 1: Viết unit test và test kiểu**

`src/components/accordion/Accordion.test.tsx`:

```tsx
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
import type { AccordionProps } from './Accordion';

function Faq(props: AccordionProps) {
  return (
    <Accordion {...props}>
      <AccordionItem value="trial">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>Yes, 14 days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans?</AccordionTrigger>
        <AccordionContent>At any time.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="legacy" disabled>
        <AccordionTrigger>Legacy plans</AccordionTrigger>
        <AccordionContent>No longer sold.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const item = (title: string) => screen.getByText(title).closest('details') as HTMLDetailsElement;
const toggle = (title: string) => fireEvent.click(screen.getByText(title));

describe('Accordion', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders the open items on the server, and groups a single Accordion by name', () => {
    const doc = new DOMParser().parseFromString(
      renderToString(<Faq defaultValue="plans" />),
      'text/html',
    );
    const items = Array.from(doc.querySelectorAll('details'));
    expect(items.map((details) => details.hasAttribute('open'))).toEqual([false, true, false]);
    const names = new Set(items.map((details) => details.getAttribute('name')));
    expect(names.size).toBe(1);
    expect([...names][0]).toBeTruthy();
    const multiple = new DOMParser().parseFromString(
      renderToString(<Faq type="multiple" defaultValue={['trial', 'plans']} />),
      'text/html',
    );
    const open = Array.from(multiple.querySelectorAll('details[open]'));
    expect(open).toHaveLength(2);
    expect(multiple.querySelector('details[name]')).toBeNull();
  });

  it('reports the item that opens, and null once it closes again', async () => {
    const onValueChange = vi.fn();
    render(<Faq onValueChange={onValueChange} />);
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('plans'));
    expect(item('Can I change plans?').open).toBe(true);
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(null));
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it('reports every open item of a multiple Accordion, in order', async () => {
    const onValueChange = vi.fn();
    render(<Faq type="multiple" defaultValue={['plans']} onValueChange={onValueChange} />);
    toggle('Is there a free trial?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(['trial', 'plans']));
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(['trial']));
  });

  it('puts an item back when a controlled parent refuses the change', async () => {
    const onValueChange = vi.fn();
    render(<Faq value="trial" onValueChange={onValueChange} />);
    toggle('Can I change plans?');
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('plans'));
    await waitFor(() => expect(item('Can I change plans?').open).toBe(false));
    expect(item('Is there a free trial?').open).toBe(true);
  });

  it('opens what a controlled parent asks for', () => {
    const { rerender } = render(<Faq value="trial" onValueChange={() => {}} />);
    rerender(<Faq value="plans" onValueChange={() => {}} />);
    expect(item('Can I change plans?').open).toBe(true);
    expect(item('Is there a free trial?').open).toBe(false);
    rerender(<Faq value={null} onValueChange={() => {}} />);
    expect(item('Can I change plans?').open).toBe(false);
  });

  it('leaves the items of an Accordion nested in one of its items to that Accordion', async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <Accordion defaultValue="billing" onValueChange={outer}>
        <AccordionItem value="billing">
          <AccordionTrigger>Billing</AccordionTrigger>
          <AccordionContent>
            <Accordion onValueChange={inner}>
              <AccordionItem value="invoices">
                <AccordionTrigger>Invoices</AccordionTrigger>
                <AccordionContent>Monthly.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="plans">
          <AccordionTrigger>Plans</AccordionTrigger>
          <AccordionContent>Three.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    toggle('Invoices');
    await waitFor(() => expect(inner).toHaveBeenLastCalledWith('invoices'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(outer).not.toHaveBeenCalled();
    expect(item('Billing').open).toBe(true);
    toggle('Plans');
    await waitFor(() => expect(outer).toHaveBeenLastCalledWith('plans'));
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('keeps a disabled item as it is', async () => {
    const onValueChange = vi.fn();
    render(<Faq onValueChange={onValueChange} />);
    const trigger = screen.getByText('Legacy plans');
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    toggle('Legacy plans');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(item('Legacy plans').open).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps an item the user opened before hydration, and reports it', async () => {
    const onValueChange = vi.fn();
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Faq />);
    document.body.append(container);
    const details = container.querySelectorAll('details')[1] as HTMLDetailsElement;
    details.open = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      hydrateRoot(container, <Faq onValueChange={onValueChange} />);
    });
    expect(onValueChange).toHaveBeenCalledWith('plans');
    expect(details.open).toBe(true);
    expect(error).not.toHaveBeenCalled();
    container.remove();
  });

  it('warns when a part is rendered outside its parent', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <AccordionItem value="lost">
        <AccordionTrigger>Lost</AccordionTrigger>
      </AccordionItem>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <AccordionItem> must be rendered inside an <Accordion>.',
    );
    render(<AccordionTrigger>Alone</AccordionTrigger>);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <AccordionTrigger> must be rendered inside an <AccordionItem>.',
    );
  });
});
```

`src/components/accordion/Accordion.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { AccordionMultipleProps, AccordionProps, AccordionSingleProps } from './Accordion';

test('a multiple Accordion takes only string arrays; a single one only a string or null', () => {
  expectTypeOf<AccordionMultipleProps['value']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<AccordionMultipleProps['onValueChange']>().toEqualTypeOf<
    ((value: string[]) => void) | undefined
  >();
  expectTypeOf<AccordionSingleProps['value']>().toEqualTypeOf<string | null | undefined>();
  // @ts-expect-error a multiple Accordion's value is an array
  const multipleWithString: AccordionProps = { type: 'multiple', value: 'a' };
  // @ts-expect-error a single Accordion's value is not an array
  const singleWithArray: AccordionProps = { value: ['a'] };
  expectTypeOf(multipleWithString).toBeObject();
  expectTypeOf(singleWithArray).toBeObject();
});
```

jsdom mở `<details>` khi click vào `<summary>` và phát `toggle`, nhưng không làm tính năng `name`. Vì vậy việc mục kia tự đóng ở kiểu `single` được kiểm bằng story ở Step 6.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/accordion`
Expected: Cả hai project báo `Failed to resolve import "./Accordion"` cho `Accordion.test.tsx`, và test kiểu fail với `Cannot find module './Accordion'`.

- [ ] **Step 3: Viết Accordion**

`src/components/accordion/Accordion.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { createContext, forwardRef, useContext, useId, useMemo, useRef, useState } from 'react';
import type { DetailsHTMLAttributes, HTMLAttributes, MouseEvent } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { strokeIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';

type AccordionBaseProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'>;

export interface AccordionSingleProps extends AccordionBaseProps {
  /** Default `"single"`: one item open at a time. */
  type?: 'single';
  /** The open item, or `null` for none. Pass it with `onValueChange` to control it. */
  value?: string | null;
  /** The item open at first, when uncontrolled. */
  defaultValue?: string;
  /** Called with the open item, or `null` once none is. */
  onValueChange?: (value: string | null) => void;
}
export interface AccordionMultipleProps extends AccordionBaseProps {
  /** Any number of items open at a time. */
  type: 'multiple';
  /** The open items. Pass it with `onValueChange` to control it. */
  value?: string[];
  /** The items open at first, when uncontrolled. */
  defaultValue?: string[];
  /** Called with the open items, in the order they appear. */
  onValueChange?: (value: string[]) => void;
}
export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export interface AccordionItemProps extends Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  'open' | 'name'
> {
  /** Names the item in `value`. */
  value: string;
  /** Keeps the item as it is: a click on its trigger does nothing. */
  disabled?: boolean;
}
export type AccordionTriggerProps = HTMLAttributes<HTMLElement>;
export type AccordionContentProps = HTMLAttributes<HTMLDivElement>;

interface AccordionContextValue {
  /** Shared by every item of a single Accordion, so the browser closes one when another opens. */
  name: string | undefined;
  isOpen: (value: string) => boolean;
  /** Changes whenever the items must put their `open` back in line with the value. */
  sync: number;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);
const ItemContext = createContext<{ disabled: boolean } | null>(null);

/** The value of each item element, for reading the open items off the DOM. */
const itemValues = new WeakMap<HTMLDetailsElement, string>();

/** The items of this Accordion, in order; not those of an Accordion nested in one of them. */
function itemsOf(root: HTMLElement): HTMLDetailsElement[] {
  return Array.from(root.querySelectorAll<HTMLDetailsElement>('details.flg-accordion-item')).filter(
    (item) => item.closest('.flg-accordion') === root,
  );
}

/** The open items of a value: one, none (`null`), or several. */
const toList = (value: string | null | string[]): string[] =>
  Array.isArray(value) ? value : value === null ? [] : [value];

const sameValues = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value) => b.includes(value));

/**
 * A stack of items that open and close, on native `<details>`: the items work before hydration,
 * and find-in-page opens the one that holds a match. `AccordionItem`, `AccordionTrigger` and
 * `AccordionContent` go inside.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(props, ref) {
  const {
    type,
    value: valueProp,
    defaultValue,
    onValueChange,
    className,
    ...rest
  } = props as AccordionBaseProps & {
    type?: 'single' | 'multiple';
    value?: string | null | string[];
    defaultValue?: string | string[];
    onValueChange?: (value: string | null | string[]) => void;
  };
  const multiple = type === 'multiple';
  const [value, setValue] = useControllableState<string | null | string[]>({
    value: valueProp,
    defaultValue: defaultValue ?? (multiple ? [] : null),
    onChange: onValueChange,
    name: 'Accordion',
  });
  const open = toList(value);
  const groupName = useId();
  const [sync, setSync] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
  const latest = useRef({ open, multiple, setValue });
  latest.current = { open, multiple, setValue };

  // The DOM is where an item opens or closes (a click, the keyboard, find-in-page, the browser
  // closing the other item of a single Accordion): read the open items back from it. A controlled
  // parent may refuse the change; the re-render then puts every item back as `value` says.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reconcile = () => {
      const { open: before, multiple: many, setValue: set } = latest.current;
      const now = itemsOf(root)
        .filter((item) => item.open)
        .map((item) => itemValues.get(item) as string);
      if (sameValues(now, before)) return;
      set(many ? now : (now.find((item) => !before.includes(item)) ?? now[0] ?? null));
      setSync((count) => count + 1);
    };
    // `toggle` does not bubble: listen in the capture phase, for this Accordion's own items.
    const onToggle = (event: Event) => {
      const item = event.target;
      if (item instanceof HTMLDetailsElement && itemValues.has(item)) {
        if (item.closest('.flg-accordion') === root) reconcile();
      }
    };
    // An item the user opened or closed before hydration counts too.
    reconcile();
    root.addEventListener('toggle', onToggle, true);
    return () => root.removeEventListener('toggle', onToggle, true);
  }, []);

  const ctx = useMemo(() => {
    const items = toList(value);
    return {
      name: multiple ? undefined : groupName,
      isOpen: (item: string) => items.includes(item),
      sync,
    };
  }, [multiple, groupName, value, sync]);
  return (
    <AccordionContext.Provider value={ctx}>
      <div
        ref={mergedRef}
        className={clsx('flg-surface', 'flg-accordion', className)}
        data-type={multiple ? 'multiple' : 'single'}
        {...rest}
      />
    </AccordionContext.Provider>
  );
});

/** One item: a native `<details>`. */
export const AccordionItem = forwardRef<HTMLDetailsElement, AccordionItemProps>(
  function AccordionItem({ value, disabled = false, className, ...props }, ref) {
    const ctx = useContext(AccordionContext);
    if (!ctx) devWarn('<AccordionItem> must be rendered inside an <Accordion>.');
    const open = ctx?.isOpen(value) ?? false;
    const itemRef = useRef<HTMLDetailsElement | null>(null);
    const register = useMemo(
      () =>
        mergeRefs(ref, itemRef, (el: HTMLDetailsElement | null) => {
          if (el) itemValues.set(el, value);
        }),
      [ref, value],
    );
    // React sets `open` only when it changes; after a change the parent refused, the DOM is put
    // back here. Not on the first run: the Accordion first reads what the user did before
    // hydration.
    const mounted = useRef(false);
    useIsoLayoutEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      const el = itemRef.current;
      if (el && el.open !== open) el.open = open;
    }, [open, ctx?.sync]);
    const item = useMemo(() => ({ disabled }), [disabled]);
    return (
      <ItemContext.Provider value={item}>
        <details
          ref={register}
          name={ctx?.name}
          open={open}
          // The user can open an item before hydration; the Accordion reads it back then.
          suppressHydrationWarning
          className={clsx('flg-accordion-item', className)}
          data-disabled={disabled ? '' : undefined}
          {...props}
        />
      </ItemContext.Provider>
    );
  },
);

const CHEVRON = (
  <span className="flg-accordion-chevron" aria-hidden="true">
    <svg {...strokeIcon}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  </span>
);

/** The item's heading: a native `<summary>`, with a chevron after its children. */
export const AccordionTrigger = forwardRef<HTMLElement, AccordionTriggerProps>(
  function AccordionTrigger({ className, children, onClick, ...props }, ref) {
    const item = useContext(ItemContext);
    if (!item) devWarn('<AccordionTrigger> must be rendered inside an <AccordionItem>.');
    const disabled = item?.disabled ?? false;
    return (
      <summary
        ref={ref}
        className={clsx('flg-accordion-trigger', className)}
        aria-disabled={disabled || undefined}
        {...props}
        // A click, also the one Enter and Space make, would open or close the item.
        onClick={composeEventHandlers(onClick, (event: MouseEvent<HTMLElement>) => {
          if (disabled) event.preventDefault();
        })}
      >
        {children}
        {CHEVRON}
      </summary>
    );
  },
);

/** What the item shows while open. */
export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  function AccordionContent({ className, ...props }, ref) {
    return <div ref={ref} className={clsx('flg-accordion-content', className)} {...props} />;
  },
);
```

`src/components/accordion/index.ts`:

```ts
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
export type {
  AccordionContentProps,
  AccordionItemProps,
  AccordionMultipleProps,
  AccordionProps,
  AccordionSingleProps,
  AccordionTriggerProps,
} from './Accordion';
```

Ba điểm của code:
- `reconcile` đọc các mục đang mở từ DOM. Nó chạy lúc mount (để giữ những gì người dùng làm trước khi hydrate) và sau mỗi `toggle` của một mục của chính Accordion này.
- Sau mỗi thay đổi, bộ đếm `sync` tăng lên. Lần render lại đó cho mỗi mục cơ hội đặt `open` về đúng `value`, phòng khi cha controlled từ chối.
- Effect của mỗi mục bỏ qua lần chạy đầu, để không xoá những gì người dùng làm trước khi hydrate.

Run: `pnpm vitest run --project unit --project unit-react18 src/components/accordion`
Expected: 19 test PASS (9 test × React 19 và 18.3, cùng test kiểu)

- [ ] **Step 4: CSS và quy tắc forced colors**

`src/styles/components/accordion.css`:

```css
/* Accordion (spec §4.3 Accordion, mockup A1): one glass surface, the items split by hairlines. */
@layer flg.components {
  .flg-accordion {
    padding: 4px 14px;
    font-family: var(--flg-font-sans);
    /* Lets the height of an opening item move to `auto` (below). */
    interpolate-size: allow-keywords;
  }
  .flg-accordion-item + .flg-accordion-item {
    border-top: 1px solid var(--flg-control-border);
  }
  /* 40px tall, as in the mockup; a title too long for one line wraps instead of overflowing. */
  .flg-accordion-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-sizing: border-box;
    min-height: 40px;
    padding: 8px 0;
    border-radius: var(--flg-radius-xs);
    color: var(--flg-text);
    font: var(--flg-weight-medium) var(--flg-text-sm) var(--flg-font-sans);
    text-align: start;
    list-style: none;
    cursor: pointer;
  }
  .flg-accordion-trigger::-webkit-details-marker {
    display: none;
  }
  .flg-accordion-trigger:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-accordion-trigger[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* The colour is on the span, not the <svg>: in forced colours an <svg> keeps a colour set on it. */
  .flg-accordion-chevron {
    display: inline-flex;
    flex: none;
    color: var(--flg-text-muted);
    transition: transform var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-accordion-chevron > svg {
    width: 16px;
    height: 16px;
  }
  .flg-accordion-item[open] > .flg-accordion-trigger .flg-accordion-chevron {
    transform: rotate(180deg);
  }
  .flg-accordion-content {
    padding-bottom: 12px;
    color: var(--flg-text-muted);
    font-size: var(--flg-text-sm);
    line-height: 1.5;
  }
  /* The height opens and closes where the browser has `::details-content`; elsewhere the item
     opens at once. Reduced motion zeroes the duration. */
  .flg-accordion-item::details-content {
    block-size: 0;
    overflow-y: clip;
    transition:
      block-size var(--flg-duration-normal) var(--flg-ease),
      content-visibility var(--flg-duration-normal) var(--flg-ease) allow-discrete;
  }
  .flg-accordion-item[open]::details-content {
    block-size: auto;
  }
}
```

```diff
diff --git a/src/styles/index.css b/src/styles/index.css
index bc8715f..27739a5 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -23,5 +23,6 @@
 @import './components/menu.css';
 @import './components/select.css';
 @import './components/tabs.css';
+@import './components/accordion.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 473707c..2a6a161 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -194,5 +194,11 @@
       .flg-tabs-trigger[aria-selected='true'] {
       border: 1px solid Highlight;
     }
+    .flg-accordion-item + .flg-accordion-item {
+      border-color: CanvasText;
+    }
+    .flg-accordion-trigger[aria-disabled='true'] {
+      color: GrayText;
+    }
   }
 }
```

Lightning CSS giữ nguyên `::details-content` và `interpolate-size`. Trình duyệt không hiểu chúng thì bỏ qua cả quy tắc, và mục mở ngay.

- [ ] **Step 5: Export và danh sách kiểm tra gói**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 7239baa..72c89f1 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -53,6 +53,11 @@ const SHIPPED_CLASSES = [
   'flg-tabs-list',
   'flg-tabs-trigger',
   'flg-tabs-content',
+  'flg-accordion',
+  'flg-accordion-item',
+  'flg-accordion-trigger',
+  'flg-accordion-chevron',
+  'flg-accordion-content',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 67d4db9..ff8f4d4 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -22,6 +22,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/context-menu/ContextMenu.tsx',
   'src/components/select/Select.tsx',
   'src/components/tabs/Tabs.tsx',
+  'src/components/accordion/Accordion.tsx',
 ];
 
 /**
diff --git a/src/index.test.ts b/src/index.test.ts
index 8c7a7e7..ce8325b 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -4,6 +4,10 @@ import * as api from './index';
 describe('public API', () => {
   it('exports exactly the documented components and nothing internal', () => {
     expect(Object.keys(api).sort()).toEqual([
+      'Accordion',
+      'AccordionContent',
+      'AccordionItem',
+      'AccordionTrigger',
       'Avatar',
       'Badge',
       'Button',
diff --git a/src/index.ts b/src/index.ts
index 28882ca..05a057f 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -131,6 +131,20 @@ export type {
   SelectSingleProps,
 } from './components/select';
 export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
+export {
+  Accordion,
+  AccordionContent,
+  AccordionItem,
+  AccordionTrigger,
+} from './components/accordion';
+export type {
+  AccordionContentProps,
+  AccordionItemProps,
+  AccordionMultipleProps,
+  AccordionProps,
+  AccordionSingleProps,
+  AccordionTriggerProps,
+} from './components/accordion';
 export type {
   TabsActivationMode,
   TabsContentProps,
```

- [ ] **Step 6: Story và trang docs**

`src/components/accordion/Accordion.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';
import type { AccordionProps } from './Accordion';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: { onValueChange: fn() },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const width = { width: 380 } as const;

/** The questions of the approved mockup (accordion A1). */
function Faq(props: AccordionProps) {
  return (
    <Accordion style={width} {...props}>
      <AccordionItem value="trial">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>
          Yes. 14 days, no card needed. When it ends, the account moves to the Free plan.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans midway?</AccordionTrigger>
        <AccordionContent>
          Yes, at any time. The new price applies from the next invoice.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="data">
        <AccordionTrigger>Where is my data stored?</AccordionTrigger>
        <AccordionContent>In the region you chose when you signed up.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="legacy" disabled>
        <AccordionTrigger>Legacy plans</AccordionTrigger>
        <AccordionContent>No longer sold.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const itemOf = (trigger: HTMLElement) => trigger.closest('details') as HTMLDetailsElement;

export const Default: Story = {
  render: () => (
    <Accordion defaultValue="trial" style={width}>
      <AccordionItem value="trial">
        <AccordionTrigger>Is there a free trial?</AccordionTrigger>
        <AccordionContent>
          Yes. 14 days, no card needed. When it ends, the account moves to the Free plan.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans midway?</AccordionTrigger>
        <AccordionContent>Yes, at any time.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="data">
        <AccordionTrigger>Where is my data stored?</AccordionTrigger>
        <AccordionContent>In the region you chose when you signed up.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Single: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Faq
      defaultValue="trial"
      onValueChange={args.onValueChange as (value: string | null) => void}
    />
  ),
  play: async ({ canvas, args }) => {
    const trial = canvas.getByText('Is there a free trial?');
    const plans = canvas.getByText('Can I change plans midway?');
    // Opening one closes the other: the items share a name.
    await userEvent.click(plans);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('plans'));
    await expect(itemOf(plans).open).toBe(true);
    await expect(itemOf(trial).open).toBe(false);
    // The open one closes again.
    await userEvent.click(plans);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(null));
    await expect(itemOf(plans).open).toBe(false);
    // Enter and Space work the trigger.
    const real = await realUserEvent();
    if (!real) return;
    trial.focus();
    await real.keyboard('{Enter}');
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('trial'));
    await real.keyboard(' ');
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(null));
  },
};

export const Multiple: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Faq
      type="multiple"
      defaultValue={['trial']}
      onValueChange={args.onValueChange as (value: string[]) => void}
    />
  ),
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByText('Where is my data stored?'));
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(['trial', 'data']));
    await expect(itemOf(canvas.getByText('Is there a free trial?')).open).toBe(true);
    await userEvent.click(canvas.getByText('Is there a free trial?'));
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith(['data']));
  },
};

export const Disabled: Story = {
  tags: ['no-visual'],
  render: (args) => <Faq onValueChange={args.onValueChange as (value: string | null) => void} />,
  play: async ({ canvas, args }) => {
    const legacy = canvas.getByText('Legacy plans');
    await expect(legacy).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(legacy);
    const real = await realUserEvent();
    if (real) {
      legacy.focus();
      await real.keyboard('{Enter}');
      await real.keyboard(' ');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(itemOf(legacy).open).toBe(false);
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

function ControlledFaq({ onValueChange }: { onValueChange: (value: string | null) => void }) {
  const [value, setValue] = useState<string | null>('trial');
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Faq
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          // This parent keeps "Where is my data stored?" closed.
          if (next !== 'data') setValue(next);
        }}
      />
      <button type="button" onClick={() => setValue('plans')}>
        Show plans
      </button>
    </div>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <ControlledFaq onValueChange={args.onValueChange as (value: string | null) => void} />
  ),
  play: async ({ canvas, args }) => {
    const trial = canvas.getByText('Is there a free trial?');
    const data = canvas.getByText('Where is my data stored?');
    // A refused item closes again, and the open one stays open.
    await userEvent.click(data);
    await waitFor(() => expect(args.onValueChange).toHaveBeenLastCalledWith('data'));
    await waitFor(() => expect(itemOf(data).open).toBe(false));
    await expect(itemOf(trial).open).toBe(true);
    // The parent can open any item itself.
    await userEvent.click(canvas.getByRole('button', { name: 'Show plans' }));
    await expect(itemOf(canvas.getByText('Can I change plans midway?')).open).toBe(true);
    await waitFor(() => expect(itemOf(trial).open).toBe(false));
  },
};
```

`src/components/accordion/Accordion.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Accordion.stories';

<Meta of={Stories} />

# Accordion

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'fl-glass-ui';

<Accordion defaultValue="trial">
  <AccordionItem value="trial">
    <AccordionTrigger>Is there a free trial?</AccordionTrigger>
    <AccordionContent>Yes. 14 days, no card needed.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="plans">
    <AccordionTrigger>Can I change plans midway?</AccordionTrigger>
    <AccordionContent>Yes, at any time.</AccordionContent>
  </AccordionItem>
</Accordion>;
```

<Canvas of={Stories.Default} />
<Controls />

## One open item, or several

By default (`type="single"`) one item is open at a time: opening another closes it. The open item
closes again on a click, so none may be open; `value` is then `null`.

With `type="multiple"`, any number of items are open; `value`, `defaultValue` and `onValueChange`
take arrays.

A `disabled` item stays as it is: a click on its trigger, or Enter or Space, does nothing.

## Built on `<details>`

Every item is a native `<details>`, and its trigger a `<summary>`:

- The items open and close before the page hydrates; the Accordion reads back what the user did
  then, and reports it.
- The browser's find-in-page opens the item that holds a match.
- The height moves as an item opens and closes in browsers with `::details-content`; elsewhere it
  opens at once. Reduced motion turns the movement off.

A controlled Accordion keeps the parent in charge: an item the parent does not open in its
`value` closes again.

## Accessibility

- The trigger is read as a button that is expanded or collapsed. Enter and Space open and close
  it, and Tab moves from trigger to trigger and into the open content.
- A heading inside `AccordionTrigger` loses its heading role, because a `<summary>` is read as a
  button. Give the page its headings outside the Accordion.
- A disabled item's trigger has `aria-disabled="true"` and stays in the Tab order, so it is still
  announced.

## Do and don't

- Do use an Accordion for long content that people read a part of, such as a FAQ.
- Don't put the only copy of something the user must read inside a closed item.
- Don't nest Accordions deeply; split the content into pages instead.
````

`Default` là story duy nhất của task có ảnh chuẩn visual. Story `Single` và `Disabled` dùng phím thật qua `realUserEvent` cho Enter và Space trên `<summary>`.

- [ ] **Step 7: Cập nhật spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 348fbf1..b606657 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -336,8 +336,9 @@ Số liệu lấy từ mockup đã duyệt. Mọi giá trị đều dùng token
 **Accordion (A1):**
 
 - **Khung:** một `Surface` bo `--flg-radius-lg`, padding 4px 14px. Các mục ngăn bằng đường kẻ 1px `--flg-control-border`.
-- **Trigger:** cao 40px, chữ `--flg-text-sm` đậm `--flg-weight-medium`.
-- **Chevron:** 16px, màu `--flg-text-muted`, xoay 180° khi mở.
+- **Trigger:** cao 40px, chữ `--flg-text-sm` đậm `--flg-weight-medium`. Viết thành `min-height: 40px` kèm padding dọc 8px, để tiêu đề dài xuống dòng thay vì tràn; tiêu đề một dòng vẫn cao đúng 40px (ghi lại khi lập Plan D).
+- **Item disabled** (ngoài mockup): trigger `opacity: .5`, như Button disabled.
+- **Chevron:** 16px, màu `--flg-text-muted`, xoay 180° khi mở. Màu đặt trên `<span>` bọc ngoài chứ không trên `<svg>`, để chevron nhận màu hệ thống ở forced colors (§4.5).
 - **Nội dung:** padding dưới 12px, chữ `--flg-text-sm` màu `--flg-text-muted`.
 
 **Breadcrumb:**
@@ -456,6 +457,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 - Con của `TooltipTrigger` không nhận focus được.
 - Một phần `Menu*` nằm ngoài menu; một `MenuRadioItem` nằm ngoài `MenuRadioGroup`.
 - `TabsList`, `TabsTrigger` hoặc `TabsContent` nằm ngoài `Tabs`.
+- `AccordionItem` nằm ngoài `Accordion`; `AccordionTrigger` nằm ngoài `AccordionItem`.
 - Select:
   - Có con không phải `SelectItem`, `SelectGroup` hay `SelectSeparator`. Con đó bị bỏ qua.
   - Có `SelectItem` với `value` rỗng.
@@ -804,13 +806,15 @@ Mặc định `type="single"`.
   - `AccordionContent` là `<div>`.
 - **Mở và đóng:**
   - Item đang mở vẫn đóng lại được, kể cả ở `single`.
-  - Sự kiện `toggle` của từng `<details>` được đồng bộ về `value`.
+  - Sự kiện `toggle` của từng `<details>` được đồng bộ về `value`. `toggle` không nổi bọt, nên `Accordion` nghe nó ở pha capture và đọc lại các item đang mở từ DOM. Ở `single`, trình duyệt đóng item kia trong sự kiện `toggle` của chính nó, nên lib không gọi `onValueChange(null)` xen giữa (phát hiện khi lập Plan D).
   - Ở chế độ controlled, nếu trạng thái DOM khác `value` thì lib đặt lại `open` theo `value`.
+  - Item người dùng mở hoặc đóng trước khi hydrate được giữ nguyên và báo qua `onValueChange` lúc mount. `<details>` mang `suppressHydrationWarning`, vì thuộc tính `open` có thể đã đổi trước khi hydrate.
+  - `AccordionItem` hoặc `AccordionTrigger` nằm sai chỗ thì in cảnh báo dev.
 - **Item disabled:**
   - `<summary>` có `aria-disabled="true"`.
   - Click (kể cả click do Enter hoặc Space) bị `preventDefault`.
 - **Trước khi hydrate** accordion đã chạy được nhờ `<details>`. HTML từ server mang sẵn `open` theo `defaultValue` hoặc `value`.
-- **Animation chiều cao** viết bằng `::details-content` và `interpolate-size: allow-keywords`. Trình duyệt không hỗ trợ thì mở ngay, không có animation.
+- **Animation chiều cao** viết bằng `::details-content` và `interpolate-size: allow-keywords`. Trình duyệt không hỗ trợ thì mở ngay, không có animation. Accordion không phải overlay, nên chiều cao chuyển động cả lúc đóng (`content-visibility` với `allow-discrete`); §3.5 chỉ loại animation đóng của overlay.
 - **Hạn chế, ghi trong docs:** heading đặt trong `<summary>` mất ngữ nghĩa heading, vì `<summary>` được đọc như một nút.
 
 **`Breadcrumb`** (server-safe): `HTMLAttributes<HTMLElement> & { separator?: "chevron" | "slash" }`
```

- [ ] **Step 8: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/accordion
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 635 test PASS, 2 skip.
- Story: 30 test PASS (5 story × 3 trình duyệt × 2 theme), gồm việc mục kia tự đóng ở cả ba trình duyệt.
- `check:package` PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/accordion src/styles src/index.ts src/index.test.ts scripts .size-limit.json docs/superpowers/specs
git commit -m "feat(accordion): add Accordion on native details, single or multiple" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: `flattenChildren` và Breadcrumb

**Files:**
- Create: `src/components/breadcrumb/Breadcrumb.tsx`, `src/components/breadcrumb/index.ts`, `src/components/breadcrumb/Breadcrumb.stories.tsx`, `src/components/breadcrumb/Breadcrumb.mdx`, `src/styles/components/breadcrumb.css`
- Modify: `src/internal/collect-children.ts`, `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-dist-css.ts`, `scripts/rsc-probe.mjs`, `.storybook/icons.tsx`, spec giai đoạn 2, `.size-limit.json`
- Test: `src/internal/collect-children.test.tsx`, `src/components/breadcrumb/Breadcrumb.test.tsx`, `src/components/breadcrumb/Breadcrumb.test-d.ts`

**Interfaces:**
- Consumes: `Slot`, `strokeIcon`, `resolveLazy`.
- Produces:
  - `flattenChildren(children: ReactNode): ReactNode[]` trong `collect-children.ts`. `collectChildren` giờ dựng trên nó, hành vi không đổi.
  - `Breadcrumb` (`<nav aria-label="Breadcrumb" class="flg-breadcrumb" data-separator>` quanh `<ol>`), props `BreadcrumbProps` (`separator?: 'chevron' | 'slash'` và mọi prop HTML của `<nav>`).
  - `BreadcrumbLink` (`<a>`, nhận `asChild`), `BreadcrumbPage` (`<span aria-current="page">`).

- [ ] **Step 1: Viết test cho `flattenChildren`**

```diff
diff --git a/src/internal/collect-children.test.tsx b/src/internal/collect-children.test.tsx
index 54a6c8a..30c2872 100644
--- a/src/internal/collect-children.test.tsx
+++ b/src/internal/collect-children.test.tsx
@@ -1,6 +1,7 @@
 import type { ReactNode } from 'react';
 import { describe, expect, it, vi } from 'vitest';
-import { collectChildren, markPart, partOf } from './collect-children';
+import { collectChildren, flattenChildren, markPart, partOf } from './collect-children';
+import { IS_REACT_19 } from './react-version';
 
 const Item = markPart(
   (() => null) as (props: { value: string; children?: ReactNode }) => null,
@@ -75,3 +76,35 @@ describe('collectChildren', () => {
     expect(partOf(element)).toBe('item');
   });
 });
+
+describe('flattenChildren', () => {
+  it('flattens Fragments and arrays, and drops what renders nothing', () => {
+    const nodes = flattenChildren(
+      <>
+        <a href="/">Home</a>
+        {[<span key="x">X</span>, null, false]}
+        <>
+          text
+          {'   '}
+          {undefined}
+          {0}
+        </>
+      </>,
+    );
+    expect(
+      nodes.map((node) => (typeof node === 'object' && node && 'type' in node ? node.type : node)),
+    ).toEqual(['a', 'span', 'text', 0]);
+  });
+
+  // Only Server Components hand a child over as a lazy reference, and they need React 19; React 18's
+  // Children utilities reject one.
+  it.runIf(IS_REACT_19)('resolves a child handed over as a lazy reference', () => {
+    const lazy = {
+      $$typeof: Symbol.for('react.lazy'),
+      _payload: <b>Bold</b>,
+      _init: (x: unknown) => x,
+    } as unknown as ReactNode;
+    const [node] = flattenChildren(<>{lazy}</>);
+    expect(node && typeof node === 'object' && 'type' in node && node.type).toBe('b');
+  });
+});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/internal/collect-children.test.tsx`
Expected: 3 test FAIL với `TypeError: flattenChildren is not a function`: `flattens Fragments and arrays…` ở cả hai project, và `resolves a child handed over as a lazy reference` ở React 19; 6 test PASS, 1 skip (test lazy reference ở React 18.3). Vitest cũng báo lỗi kiểu `has no exported member 'flattenChildren'`.

- [ ] **Step 3: Viết `flattenChildren` và cho `collectChildren` dùng nó**

```diff
diff --git a/src/internal/collect-children.ts b/src/internal/collect-children.ts
index b709669..e946560 100644
--- a/src/internal/collect-children.ts
+++ b/src/internal/collect-children.ts
@@ -42,25 +42,38 @@ export interface CollectOptions {
 }
 
 /**
- * Reads the parts out of `children` without rendering them: through Fragments, arrays and the group
- * parts, so the result is known on the server's first render. A component of the user's own that
- * wraps a part is not looked into; it goes to `onUnknown`.
+ * The children as a flat list: through Fragments and arrays, with the lazy references of React
+ * Server Components resolved, and without what renders nothing (`null`, `undefined`, booleans, and
+ * text that is only whitespace). Breadcrumb puts each one in a list item.
  */
-export function collectChildren(children: ReactNode, options: CollectOptions): CollectedPart[] {
-  const { parts, groups = [], onUnknown } = options;
-  const collected: CollectedPart[] = [];
+export function flattenChildren(children: ReactNode): ReactNode[] {
+  const flat: ReactNode[] = [];
   Children.forEach(children, (raw) => {
     const node = resolveLazy(raw);
     if (node === null || node === undefined || typeof node === 'boolean') return;
     if (typeof node === 'string' && node.trim() === '') return;
     if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
-      collected.push(...collectChildren(node.props.children, options));
+      flat.push(...flattenChildren(node.props.children));
       return;
     }
+    flat.push(node);
+  });
+  return flat;
+}
+
+/**
+ * Reads the parts out of `children` without rendering them: through Fragments, arrays and the group
+ * parts, so the result is known on the server's first render. A component of the user's own that
+ * wraps a part is not looked into; it goes to `onUnknown`.
+ */
+export function collectChildren(children: ReactNode, options: CollectOptions): CollectedPart[] {
+  const { parts, groups = [], onUnknown } = options;
+  const collected: CollectedPart[] = [];
+  for (const node of flattenChildren(children)) {
     const part = partOf(node);
     if (part === undefined || !parts.includes(part) || !isValidElement(node)) {
       onUnknown?.(node);
-      return;
+      continue;
     }
     const props = node.props as CollectedPart['props'];
     collected.push({
@@ -69,6 +82,6 @@ export function collectChildren(children: ReactNode, options: CollectOptions): C
       props,
       ...(groups.includes(part) ? { parts: collectChildren(props.children, options) } : {}),
     });
-  });
+  }
   return collected;
 }
```

Run: `pnpm vitest run --project unit --project unit-react18 src/internal/collect-children.test.tsx src/components/select`
Expected: mọi test PASS. Test lazy reference chỉ chạy ở project React 19 (phát hiện 10), nên project React 18.3 có 1 test bị bỏ qua.

- [ ] **Step 4: Viết unit test và test kiểu cho Breadcrumb**

`src/components/breadcrumb/Breadcrumb.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('puts each child in a list item, with a hidden separator between them', () => {
    render(
      <Breadcrumb>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
        <BreadcrumbPage>Attachments</BreadcrumbPage>
      </Breadcrumb>,
    );
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const items = within(nav).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Home', 'Projects', 'Attachments']);
    const separators = nav.querySelectorAll('.flg-breadcrumb-separator');
    expect(separators).toHaveLength(2);
    for (const separator of separators) expect(separator).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Attachments')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  });

  it('reads children through Fragments and arrays, skipping null and false', () => {
    const extra = ['a', 'b'].map((name) => (
      <BreadcrumbLink key={name} href={`/${name}`}>
        {name}
      </BreadcrumbLink>
    ));
    render(
      <Breadcrumb>
        <>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
          {extra}
        </>
        {null}
        {false}
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Home', 'a', 'b', 'Here']);
  });

  it('uses a slash when asked, and takes its own label', () => {
    render(
      <Breadcrumb separator="slash" aria-label="You are here">
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    const nav = screen.getByRole('navigation', { name: 'You are here' });
    expect(nav).toHaveAttribute('data-separator', 'slash');
    expect(nav.querySelector('.flg-breadcrumb-separator')?.textContent).toBe('/');
  });

  it('renders a router link as the link with asChild, and forwards refs', () => {
    const navRef = createRef<HTMLElement>();
    const linkRef = createRef<HTMLAnchorElement>();
    render(
      <Breadcrumb ref={navRef}>
        <BreadcrumbLink asChild ref={linkRef} className="mine">
          <a href="/docs" data-router="">
            Docs
          </a>
        </BreadcrumbLink>
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('data-router');
    expect(link).toHaveClass('flg-breadcrumb-link', 'mine');
    expect(linkRef.current).toBe(link);
    expect(navRef.current?.tagName).toBe('NAV');
  });

  it('renders on the server', () => {
    const html = renderToString(
      <Breadcrumb>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
        <BreadcrumbPage>Here</BreadcrumbPage>
      </Breadcrumb>,
    );
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('aria-current="page"');
  });
});
```

`src/components/breadcrumb/Breadcrumb.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { BreadcrumbProps } from './Breadcrumb';

test('Breadcrumb takes only the documented separators', () => {
  expectTypeOf<BreadcrumbProps['separator']>().toEqualTypeOf<'chevron' | 'slash' | undefined>();
  // @ts-expect-error an unknown separator
  const unknown: BreadcrumbProps = { separator: 'arrow' };
  expectTypeOf(unknown).toBeObject();
});
```

Run: `pnpm vitest run --project unit --project unit-react18 src/components/breadcrumb`
Expected: Cả hai project báo `Failed to resolve import "./Breadcrumb"` cho `Breadcrumb.test.tsx`, và test kiểu fail với `Cannot find module './Breadcrumb'`.

- [ ] **Step 5: Viết Breadcrumb**

`src/components/breadcrumb/Breadcrumb.tsx`:

```tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, HTMLAttributes, Ref } from 'react';
import { flattenChildren } from '../../internal/collect-children';
import { strokeIcon } from '../../internal/icons';
import { Slot } from '../../internal/slot';

export type BreadcrumbSeparator = 'chevron' | 'slash';

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** What sits between two items. Default `"chevron"`. */
  separator?: BreadcrumbSeparator;
}
export interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Render the single child element (for example a router's `Link`) as the link. */
  asChild?: boolean;
}
export type BreadcrumbPageProps = HTMLAttributes<HTMLSpanElement>;

const CHEVRON = (
  <svg {...strokeIcon}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/**
 * The path to the current page: `<nav aria-label="Breadcrumb">` around a list, one item per child,
 * with a separator after every item but the last. Safe to render in React Server Components.
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { separator = 'chevron', className, children, 'aria-label': ariaLabel, ...props },
  ref,
) {
  const items = flattenChildren(children);
  return (
    <nav
      ref={ref}
      aria-label={ariaLabel ?? 'Breadcrumb'}
      className={clsx('flg-breadcrumb', className)}
      data-separator={separator}
      {...props}
    >
      <ol className="flg-breadcrumb-list">
        {items.map((item, index) => (
          // The items have no identity of their own: their place in the path is it.
          <li key={index} className="flg-breadcrumb-item">
            {item}
            {index < items.length - 1 ? (
              <span className="flg-breadcrumb-separator" aria-hidden="true">
                {separator === 'slash' ? '/' : CHEVRON}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
});

/** A link to a page on the path. With `asChild`, the child element (a router's link) is the link. */
export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  function BreadcrumbLink({ asChild = false, className, children, ...props }, ref) {
    const shared = { className: clsx('flg-breadcrumb-link', className), ...props };
    return asChild ? (
      <Slot ref={ref as Ref<HTMLElement>} {...shared}>
        {children}
      </Slot>
    ) : (
      <a ref={ref} {...shared}>
        {children}
      </a>
    );
  },
);

/** The current page: the last item, not a link. */
export const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-current="page"
        className={clsx('flg-breadcrumb-page', className)}
        {...props}
      />
    );
  },
);
```

`src/components/breadcrumb/index.ts`:

```ts
export { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './Breadcrumb';
export type {
  BreadcrumbLinkProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparator,
} from './Breadcrumb';
```

Không có `"use client"` và không có hook. `key` của mỗi `<li>` là vị trí của nó, vì các mục không có danh tính nào khác.

- [ ] **Step 6: CSS**

`src/styles/components/breadcrumb.css`:

```css
/* Breadcrumb (spec §4.3 Breadcrumb, mockups B1 and B2): muted links, the current page in the text
   colour, a separator 6px from each side; the path wraps when it runs out of room. */
@layer flg.components {
  .flg-breadcrumb {
    font: var(--flg-text-sm) var(--flg-font-sans);
  }
  .flg-breadcrumb-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .flg-breadcrumb-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .flg-breadcrumb-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: var(--flg-radius-xs);
    color: var(--flg-text-muted);
    text-decoration: none;
  }
  .flg-breadcrumb-link > svg {
    flex: none;
    width: 14px;
    height: 14px;
  }
  @media (hover: hover) {
    .flg-breadcrumb-link:hover {
      color: var(--flg-text);
      text-decoration: underline;
    }
  }
  .flg-breadcrumb-link:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-breadcrumb-page {
    color: var(--flg-text);
    font-weight: var(--flg-weight-medium);
  }
  .flg-breadcrumb-separator {
    display: inline-flex;
    color: var(--flg-text-muted);
    opacity: 0.7;
  }
  .flg-breadcrumb-separator > svg {
    width: 13px;
    height: 13px;
  }
}
```

```diff
diff --git a/src/styles/index.css b/src/styles/index.css
index 27739a5..8e3b630 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -24,5 +24,6 @@
 @import './components/select.css';
 @import './components/tabs.css';
 @import './components/accordion.css';
+@import './components/breadcrumb.css';
 @import './components/floating.css';
 @import './preferences.css';
```

Link là `<a>`, nên ở forced colors trình duyệt tự cho nó màu `LinkText`. Breadcrumb không cần quy tắc riêng trong `preferences.css`.

- [ ] **Step 7: Export, danh sách kiểm tra gói và `rsc-probe`**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 72c89f1..5194f1f 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -58,6 +58,11 @@ const SHIPPED_CLASSES = [
   'flg-accordion-trigger',
   'flg-accordion-chevron',
   'flg-accordion-content',
+  'flg-breadcrumb',
+  'flg-breadcrumb-list',
+  'flg-breadcrumb-link',
+  'flg-breadcrumb-page',
+  'flg-breadcrumb-separator',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index 66740e8..539b296 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -104,13 +104,45 @@ const CASES = [
     element: (C) => createElement(C, null, 'x'),
     expect: { type: 'div', className: 'flg-card-footer' },
   },
+  {
+    label: 'Breadcrumb with a link, a link asChild and the page',
+    file: '../dist/components/breadcrumb/Breadcrumb.js',
+    exportName: 'Breadcrumb',
+    element: async (C) => {
+      const { BreadcrumbLink, BreadcrumbPage } = await import(
+        new URL('../dist/components/breadcrumb/Breadcrumb.js', import.meta.url)
+      );
+      return createElement(
+        C,
+        null,
+        createElement(BreadcrumbLink, { href: '/' }, 'Home'),
+        createElement(BreadcrumbLink, { asChild: true }, createElement('a', { href: '/p' }, 'P')),
+        createElement(BreadcrumbPage, null, 'Here'),
+      );
+    },
+    expect: { type: 'nav', className: 'flg-breadcrumb' },
+  },
+  {
+    label: 'BreadcrumbLink',
+    file: '../dist/components/breadcrumb/Breadcrumb.js',
+    exportName: 'BreadcrumbLink',
+    element: (C) => createElement(C, { href: '/' }, 'x'),
+    expect: { type: 'a', className: 'flg-breadcrumb-link' },
+  },
+  {
+    label: 'BreadcrumbPage',
+    file: '../dist/components/breadcrumb/Breadcrumb.js',
+    exportName: 'BreadcrumbPage',
+    element: (C) => createElement(C, null, 'x'),
+    expect: { type: 'span', className: 'flg-breadcrumb-page' },
+  },
 ];
 
 let failed = 0;
 for (const c of CASES) {
   try {
     const mod = await import(new URL(c.file, import.meta.url));
-    const tree = renderTree(c.element(mod[c.exportName]));
+    const tree = renderTree(await c.element(mod[c.exportName]));
     if (tree.type !== c.expect.type || tree.props.className !== c.expect.className) {
       throw new Error(
         `expected <${c.expect.type} class="${c.expect.className}">, got <${tree.type} class="${tree.props.className}">`,
diff --git a/src/index.test.ts b/src/index.test.ts
index ce8325b..b0bbacc 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -10,6 +10,9 @@ describe('public API', () => {
       'AccordionTrigger',
       'Avatar',
       'Badge',
+      'Breadcrumb',
+      'BreadcrumbLink',
+      'BreadcrumbPage',
       'Button',
       'Card',
       'CardContent',
diff --git a/src/index.ts b/src/index.ts
index 05a057f..ce36ad4 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -131,6 +131,13 @@ export type {
   SelectSingleProps,
 } from './components/select';
 export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
+export { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './components/breadcrumb';
+export type {
+  BreadcrumbLinkProps,
+  BreadcrumbPageProps,
+  BreadcrumbProps,
+  BreadcrumbSeparator,
+} from './components/breadcrumb';
 export {
   Accordion,
   AccordionContent,
```

`check-use-client.ts` không đổi: Breadcrumb không nằm trong danh sách module client, và check này đòi file của nó **không** có directive. `rsc-probe` render một Breadcrumb có link, link `asChild` và trang hiện tại bằng bản build `react-server`.

- [ ] **Step 8: Story, icon trang chủ và trang docs**

```diff
diff --git a/.storybook/icons.tsx b/.storybook/icons.tsx
index af2a600..00404cd 100644
--- a/.storybook/icons.tsx
+++ b/.storybook/icons.tsx
@@ -90,6 +90,15 @@ export function FolderIcon(props: SVGProps<SVGSVGElement>) {
   );
 }
 
+export function HomeIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...base} {...props}>
+      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
+      <path d="M9 22V12h6v10" />
+    </svg>
+  );
+}
+
 export function FileIcon(props: SVGProps<SVGSVGElement>) {
   return (
     <svg {...base} {...props}>
```

`src/components/breadcrumb/Breadcrumb.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { HomeIcon } from '../../../.storybook/icons';
import { Card } from '../card/Card';
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './Breadcrumb';
import type { BreadcrumbProps } from './Breadcrumb';

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

// The card the mockup puts the path in (mockups B1 and B2).
const card = { padding: '10px 14px' } as const;

function Path({ home = false, ...props }: BreadcrumbProps & { home?: boolean }) {
  return (
    <Breadcrumb {...props}>
      <BreadcrumbLink href="#">
        {home ? <HomeIcon /> : null}
        Home
      </BreadcrumbLink>
      <BreadcrumbLink href="#">Projects</BreadcrumbLink>
      <BreadcrumbLink href="#">Website 2026</BreadcrumbLink>
      <BreadcrumbPage>Attachments</BreadcrumbPage>
    </Breadcrumb>
  );
}

export const Separators: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, width: 420 }}>
      {/* Several on one page: each needs its own name (axe: landmark-unique). */}
      <Card style={card}>
        <Path home aria-label="Breadcrumb, chevrons" />
      </Card>
      <Card style={card}>
        <Path separator="slash" aria-label="Breadcrumb, slashes" />
      </Card>
      {/* Too narrow for the whole path: it wraps. */}
      <Card style={{ ...card, width: 220 }}>
        <Path home aria-label="Breadcrumb, wrapped" />
      </Card>
    </div>
  ),
};

export const Keyboard: Story = {
  tags: ['no-visual'],
  render: () => <Path home />,
  play: async ({ canvas }) => {
    // Tab goes through the links; the current page is not one.
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Website 2026' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByText('Attachments')).not.toHaveFocus();
    await expect(canvas.getByText('Attachments')).toHaveAttribute('aria-current', 'page');
  },
};
```

`src/components/breadcrumb/Breadcrumb.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Breadcrumb.stories';

<Meta of={Stories} />

# Breadcrumb

```tsx
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from 'fl-glass-ui';

<Breadcrumb>
  <BreadcrumbLink href="/">Home</BreadcrumbLink>
  <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
  <BreadcrumbPage>Attachments</BreadcrumbPage>
</Breadcrumb>;
```

<Canvas of={Stories.Separators} />
<Controls />

## Items

Each child of the Breadcrumb becomes one item of the path; Fragments and arrays are read through,
and `null` and `false` skipped. A separator sits between two items: a chevron (default) or, with
`separator="slash"`, a `/`. The path wraps when it runs out of room.

- `BreadcrumbLink` is a link to a page on the path. Put an icon inside it (a home icon, say) and
  it gets 14px and a 5px gap. With `asChild`, your router's link is the link:

  ```tsx
  <BreadcrumbLink asChild>
    <Link href="/projects">Projects</Link>
  </BreadcrumbLink>
  ```

- `BreadcrumbPage` is the current page: the last item, in the text colour, not a link.

The Breadcrumb has no state and no `"use client"`: render it in a React Server Component.

## Accessibility

- It is a `nav` landmark named "Breadcrumb", around an ordered list. Name it yourself with
  `aria-label` when a page has more than one, so the landmarks stay distinct.
- The current page has `aria-current="page"`. The separators are hidden from assistive
  technology.
- The links are the muted text colour, which in dark falls below 4.5:1 on the brightest
  backdrops; see row 6 on the Accessibility page.

## Do and don't

- Do show the path from the top of the site to the current page.
- Don't use it for the steps of a task; it shows where a page is, not what comes next.
````

Mỗi Breadcrumb trong story `Separators` có tên riêng; nếu không, axe báo `landmark-unique` (phát hiện 11).

- [ ] **Step 9: Cập nhật spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index b606657..a419916 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -448,7 +448,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | `use-typeahead.ts` | `useTypeahead(getItems, onMatch, getCurrent?)` | `getCurrent` (thêm ở Plan C) là item mà lần gõ bắt đầu từ đó, mặc định là phần tử đang có focus; Select truyền option đang được trỏ, vì focus luôn ở trigger. Gom phím trong 500ms rồi so tiền tố, không phân biệt hoa thường. Gõ lặp một chữ thì nhảy vòng giữa các item cùng chữ đầu. Phím Space nằm giữa một chuỗi đang gõ được tính là ký tự |
 | `use-iso-layout-effect.ts` | `useIsoLayoutEffect` | `useLayoutEffect` trên trình duyệt, `useEffect` trên server (React 18 cảnh báo layout effect khi render ở server). Overlay cần layout effect để mở, đo và chuyển focus trước khi trình duyệt vẽ |
 | `react-lazy.ts` | `resolveLazy(value)` | Gỡ lazy reference của React. Server Component truyền client component xuống dưới dạng lazy reference; ở development nó còn truyền cả element con dưới dạng đó. `Slot` (giai đoạn 1) và `isFieldGroup`/`isFieldControl` dùng hàm này. Thiếu bước này, `asChild` trong Server Component in cảnh báo và lỗi hydrate ở Next dev (phát hiện khi lập Plan A) |
-| `collect-children.ts` | `markPart(component, part)`, `partOf(node)`, `collectChildren(children, { parts, groups, onUnknown })` | Duyệt tĩnh `children` qua Fragment, mảng và các phần nhóm (`groups`) đã khai báo, trả danh sách `{ part, key, props, parts? }`. Nhận ra component qua marker (`markPart`) và gỡ lớp lazy reference của RSC, giống `isFieldControl` ở giai đoạn 1. Con không phải phần đã khai báo (kể cả component tự định nghĩa bọc một phần) đi vào `onUnknown`. Dùng cho Select và Breadcrumb |
+| `collect-children.ts` | `markPart(component, part)`, `partOf(node)`, `collectChildren(children, { parts, groups, onUnknown })`, `flattenChildren(children)` | Duyệt tĩnh `children` qua Fragment, mảng và các phần nhóm (`groups`) đã khai báo, trả danh sách `{ part, key, props, parts? }`. Nhận ra component qua marker (`markPart`) và gỡ lớp lazy reference của RSC, giống `isFieldControl` ở giai đoạn 1. Con không phải phần đã khai báo (kể cả component tự định nghĩa bọc một phần) đi vào `onUnknown`. `flattenChildren` (thêm ở Plan D) làm phẳng `children` theo cùng cách nhưng giữ mọi con, và bỏ những gì không render ra gì (`null`, `false`, chữ chỉ có khoảng trắng); `collectChildren` dựng trên nó. Select dùng `collectChildren`, Breadcrumb dùng `flattenChildren` |
 
 **Cảnh báo dev mới:**
 
@@ -823,12 +823,13 @@ Mặc định `type="single"`.
   - Render `<nav aria-label="Breadcrumb"><ol>…</ol></nav>`.
   - `aria-label` ghi đè được.
 - **Children:**
-  - Được duyệt qua `collectChildren`, bỏ qua `null` và `false`.
+  - Được duyệt qua `flattenChildren` (§5), bỏ qua `null` và `false`. Breadcrumb nhận mọi con, không chỉ các phần có marker, nên không dùng `collectChildren` (ghi lại khi lập Plan D).
   - Mỗi con nằm trong một `<li>`.
   - Mỗi `<li>` trừ cái cuối có thêm `<span class="flg-breadcrumb-separator" aria-hidden="true">` chứa dấu phân cách.
 - **`BreadcrumbLink`:** `<a>`, nhận `asChild` (ví dụ `Link` của Next.js).
 - **`BreadcrumbPage`:** `<span aria-current="page">`.
-- **Icon trang chủ** do người dùng tự đặt vào children.
+- **Icon trang chủ** do người dùng tự đặt vào children. Icon trong `BreadcrumbLink` rộng 14px, cách chữ 5px, như mockup B1.
+- **Nhiều Breadcrumb trên một trang:** docs khuyên đặt `aria-label` riêng cho mỗi cái, vì các landmark trùng tên không phân biệt được (axe `landmark-unique`, phát hiện khi lập Plan D).
 
 **`Pagination`**
 
```

- [ ] **Step 10: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/breadcrumb src/components/select
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 649 test PASS, 3 skip.
- Story: 90 test PASS (15 story × 3 trình duyệt × 2 theme).
- `check:package` PASS, gồm ba dòng `ok` mới của `rsc-probe` cho Breadcrumb.

- [ ] **Step 11: Commit**

```bash
git add src/internal/collect-children.ts src/internal/collect-children.test.tsx src/components/breadcrumb src/styles src/index.ts src/index.test.ts scripts .storybook/icons.tsx .size-limit.json docs/superpowers/specs
git commit -m "feat(breadcrumb): add Breadcrumb, safe in Server Components" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 7: Pagination

**Files:**
- Create: `src/components/pagination/pagination-range.ts`, `src/components/pagination/Pagination.tsx`, `src/components/pagination/index.ts`, `src/components/pagination/Pagination.stories.tsx`, `src/components/pagination/Pagination.mdx`, `src/styles/components/pagination.css`
- Modify: `src/styles/index.css`, `src/styles/preferences.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `scripts/contrast-exceptions.ts`, hai spec, `.size-limit.json`
- Test: `src/components/pagination/pagination-range.test.ts`, `src/components/pagination/Pagination.test.tsx`

**Interfaces:**
- Consumes: token `selected-*` (Task 4), `IconButton`, `useControllableState`, `strokeIcon`.
- Produces:
  - `getPaginationRange({ count, page, siblingCount, boundaryCount }): PaginationItem[]`, với `PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'`.
  - `Pagination`, props `PaginationProps`: `count`, `page?`, `defaultPage?`, `onPageChange?`, `siblingCount?`, `boundaryCount?`, `getHref?`, `previousLabel?`, `nextLabel?`, `getPageLabel?`, và mọi prop HTML của `<nav>` trừ `onChange`.

- [ ] **Step 1: Viết test cho dãy trang**

`src/components/pagination/pagination-range.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getPaginationRange } from './pagination-range';
import type { PaginationItem } from './pagination-range';

const range = (count: number, page: number, siblingCount = 1, boundaryCount = 1) =>
  getPaginationRange({ count, page, siblingCount, boundaryCount })
    .map((item) => (typeof item === 'number' ? String(item) : '…'))
    .join(' ');

describe('getPaginationRange', () => {
  it('shows the mockup: page 5 of 12', () => {
    expect(range(12, 5)).toBe('1 … 4 5 6 … 12');
  });

  it('keeps the number of slots near the ends', () => {
    expect(range(12, 1)).toBe('1 2 3 4 5 … 12');
    expect(range(12, 3)).toBe('1 2 3 4 5 … 12');
    expect(range(12, 4)).toBe('1 2 3 4 5 … 12');
    expect(range(12, 9)).toBe('1 … 8 9 10 11 12');
    expect(range(12, 12)).toBe('1 … 8 9 10 11 12');
  });

  it('shows the page itself where a gap would hide only one', () => {
    expect(range(7, 4)).toBe('1 2 3 4 5 6 7');
    expect(range(8, 4)).toBe('1 2 3 4 5 … 8');
    expect(range(9, 5)).toBe('1 … 4 5 6 … 9');
  });

  it('shows every page when there are few', () => {
    expect(range(1, 1)).toBe('1');
    expect(range(3, 2)).toBe('1 2 3');
    expect(range(5, 5)).toBe('1 2 3 4 5');
  });

  it('follows siblingCount and boundaryCount', () => {
    expect(range(20, 10, 2)).toBe('1 … 8 9 10 11 12 … 20');
    expect(range(20, 10, 0)).toBe('1 … 10 … 20');
    expect(range(20, 10, 1, 2)).toBe('1 2 … 9 10 11 … 19 20');
    expect(range(20, 10, 1, 0)).toBe('… 9 10 11 …');
  });

  it('clamps what it is given', () => {
    expect(range(0, 1)).toBe('1');
    expect(range(-3, 2)).toBe('1');
    expect(range(12, 99)).toBe(range(12, 12));
    expect(range(12, -1)).toBe(range(12, 1));
    expect(range(12, 4.6)).toBe(range(12, 4));
    expect(range(12, 5, -2, -1)).toBe(range(12, 5, 0, 0));
  });

  it('holds its rules for every page of every small count', () => {
    for (let count = 1; count <= 30; count += 1) {
      for (let page = 1; page <= count; page += 1) {
        for (const [siblings, boundary] of [
          [1, 1],
          [0, 1],
          [2, 1],
          [1, 2],
          [1, 0],
        ] as const) {
          const items = getPaginationRange({
            count,
            page,
            siblingCount: siblings,
            boundaryCount: boundary,
          });
          const numbers = items.filter((item): item is number => typeof item === 'number');
          const where = `count ${count}, page ${page}, siblings ${siblings}, boundary ${boundary}`;
          // In order, each once, within range, and the current page among them.
          expect(numbers, where).toEqual([...new Set(numbers)].sort((a, b) => a - b));
          expect(
            numbers.every((n) => n >= 1 && n <= count),
            where,
          ).toBe(true);
          expect(numbers, where).toContain(page);
          // The pages at the ends and around the current one.
          for (let n = 1; n <= Math.min(boundary, count); n += 1)
            expect(numbers, where).toContain(n);
          for (let n = count - boundary + 1; n <= count; n += 1) {
            if (n >= 1) expect(numbers, where).toContain(n);
          }
          for (let n = page - siblings; n <= page + siblings; n += 1) {
            if (n >= 1 && n <= count) expect(numbers, where).toContain(n);
          }
          // An ellipsis stands for two pages or more, never for a single one.
          items.forEach((item: PaginationItem, index) => {
            if (typeof item === 'number') return;
            const before = index > 0 ? (items[index - 1] as number) : 0;
            const after = index < items.length - 1 ? (items[index + 1] as number) : count + 1;
            expect(after - before - 1, where).toBeGreaterThanOrEqual(2);
          });
          // A fixed number of slots once the count is large enough.
          const slots = 2 * boundary + 2 * siblings + 3;
          if (count >= slots) expect(items, where).toHaveLength(slots);
        }
      }
    }
  });
});
```

Test cuối kiểm các quy tắc của spec trên mọi trang của mọi `count` từ 1 tới 30, với năm cặp `siblingCount`/`boundaryCount`.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/pagination/pagination-range.test.ts`
Expected: Vitest báo `Failed to resolve import "./pagination-range"`; chưa test nào chạy.

- [ ] **Step 3: Viết hàm dãy trang**

`src/components/pagination/pagination-range.ts`:

```ts
/** A slot of the page row: a page number, or an ellipsis standing for two pages or more. */
export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

export interface PaginationRangeOptions {
  /** How many pages there are; below 1 counts as 1. */
  count: number;
  /** The current page; kept within 1 and `count`. */
  page: number;
  /** Pages shown on each side of the current one. */
  siblingCount: number;
  /** Pages always shown at each end. */
  boundaryCount: number;
}

/** `from` to `to`, both included; empty when `from` is past `to`. */
const span = (from: number, to: number): number[] =>
  from > to ? [] : Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * The slots of the page row (spec §6.3 Pagination): `boundaryCount` pages at each end,
 * `siblingCount` pages on each side of the current one, and an ellipsis for each gap. A gap of a
 * single page shows that page instead, and the window of siblings slides inward near the ends, so
 * the row keeps `2 × boundaryCount + 2 × siblingCount + 3` slots once there are that many pages.
 */
export function getPaginationRange({
  count,
  page,
  siblingCount,
  boundaryCount,
}: PaginationRangeOptions): PaginationItem[] {
  const total = Math.max(1, Math.floor(count));
  const current = Math.min(Math.max(Math.floor(page), 1), total);
  const siblings = Math.max(0, Math.floor(siblingCount));
  const boundary = Math.max(0, Math.floor(boundaryCount));

  const startPages = span(1, Math.min(boundary, total));
  const endPages = span(Math.max(total - boundary + 1, boundary + 1), total);
  // The window around the current page, slid inward so that it keeps its width at the ends.
  const windowStart = Math.max(
    Math.min(current - siblings, total - boundary - siblings * 2 - 1),
    boundary + 2,
  );
  const windowEnd = Math.min(
    Math.max(current + siblings, boundary + siblings * 2 + 2),
    endPages.length > 0 ? (endPages[0] as number) - 2 : total - 1,
  );

  // Between the start pages and the window: an ellipsis, or the one page it would hide.
  const startGap: PaginationItem[] =
    windowStart > boundary + 2
      ? ['start-ellipsis']
      : boundary + 1 < total - boundary
        ? [boundary + 1]
        : [];
  const endGap: PaginationItem[] =
    windowEnd < total - boundary - 1
      ? ['end-ellipsis']
      : total - boundary > boundary
        ? [total - boundary]
        : [];

  return [...startPages, ...startGap, ...span(windowStart, windowEnd), ...endGap, ...endPages];
}
```

Run lại lệnh ở Step 2. Expected: 7 test PASS.

- [ ] **Step 4: Viết test cho component**

`src/components/pagination/Pagination.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

const pages = (nav: HTMLElement) =>
  Array.from(nav.querySelectorAll('.flg-pagination-page, .flg-pagination-ellipsis'), (el) =>
    el.classList.contains('flg-pagination-ellipsis') ? '…' : el.textContent,
  ).join(' ');

describe('Pagination', () => {
  afterEach(() => vi.restoreAllMocks());

  it('names the pages and marks the current one', () => {
    render(<Pagination count={12} defaultPage={5} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(pages(nav)).toBe('1 … 4 5 6 … 12');
    expect(within(nav).getByRole('button', { name: 'Page 5' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('button', { name: 'Page 4' })).not.toHaveAttribute('aria-current');
    for (const ellipsis of nav.querySelectorAll('.flg-pagination-ellipsis')) {
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    }
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(within(nav).getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('goes to a page, and to the previous and next ones, disabling them at the ends', () => {
    const onPageChange = vi.fn();
    render(<Pagination count={3} onPageChange={onPageChange} />);
    const previous = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();
    // The current page again changes nothing.
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('reports a page to a controlled parent and shows the page it gives', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination count={10} page={2} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    rerender(<Pagination count={10} page={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Page 10' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps the page and the count within range', () => {
    render(<Pagination count={0} page={7} onPageChange={() => {}} />);
    const nav = screen.getByRole('navigation');
    expect(pages(nav)).toBe('1');
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('renders links with getHref, and links at the ends that lead nowhere', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination count={5} getHref={(page) => `#page-${page}`} onPageChange={onPageChange} />,
    );
    const page2 = screen.getByRole('link', { name: 'Page 2' });
    expect(page2).toHaveAttribute('href', '#page-2');
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    const next = screen.getByRole('link', { name: 'Next page' });
    expect(next).toHaveAttribute('href', '#page-2');
    const previous = screen.getByLabelText('Previous page');
    expect(previous.tagName).toBe('A');
    expect(previous).not.toHaveAttribute('href');
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    // At the first page, the previous link goes nowhere.
    fireEvent.click(previous);
    expect(onPageChange).not.toHaveBeenCalled();
    fireEvent.click(page2);
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(previous).toHaveAttribute('href', '#page-1');
  });

  it('takes its own labels', () => {
    render(
      <Pagination
        count={3}
        aria-label="Results pages"
        previousLabel="Back"
        nextLabel="Forward"
        getPageLabel={(page) => `Results page ${page}`}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Results pages' });
    expect(within(nav).getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Forward' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Results page 2' })).toBeInTheDocument();
  });

  it('renders on the server', () => {
    const html = renderToString(<Pagination count={12} defaultPage={5} />);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="Pagination"');
  });
});
```

Run: `pnpm vitest run --project unit --project unit-react18 src/components/pagination/Pagination.test.tsx`
Expected: Cả hai project báo `Failed to resolve import "./Pagination"`; chưa test nào chạy.

- [ ] **Step 5: Viết Pagination**

`src/components/pagination/Pagination.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { strokeIcon } from '../../internal/icons';
import { useControllableState } from '../../internal/use-controllable-state';
import { IconButton } from '../icon-button/IconButton';
import { getPaginationRange } from './pagination-range';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** How many pages there are; below 1 counts as 1. */
  count: number;
  /** The current page. Pass it with `onPageChange` to control it. */
  page?: number;
  /** The page at first, when uncontrolled. Default 1. */
  defaultPage?: number;
  /** Called with the page the user goes to. */
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current one. Default 1. */
  siblingCount?: number;
  /** Pages always shown at each end. Default 1. */
  boundaryCount?: number;
  /** Makes every page a link to this address; the browser follows it as usual. */
  getHref?: (page: number) => string;
  /** Default `"Previous page"`. */
  previousLabel?: string;
  /** Default `"Next page"`. */
  nextLabel?: string;
  /** The accessible name of a page. Default `` (page) => `Page ${page}` ``. */
  getPageLabel?: (page: number) => string;
}

const icon = (path: string) => (
  <svg {...strokeIcon}>
    <path d={path} />
  </svg>
);
const PREVIOUS = icon('m15 18-6-6 6-6');
const NEXT = icon('m9 18 6-6-6-6');

const defaultPageLabel = (page: number) => `Page ${page}`;

/**
 * Moves between the pages of a list: previous and next, the pages at the ends and around the
 * current one, and an ellipsis for the rest. Buttons by default; links with `getHref`.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    count,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    getHref,
    previousLabel = 'Previous page',
    nextLabel = 'Next page',
    getPageLabel = defaultPageLabel,
    className,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
    name: 'Pagination',
  });
  const total = Math.max(1, Math.floor(count));
  const current = Math.min(Math.max(Math.floor(value), 1), total);
  const items = getPaginationRange({ count: total, page: current, siblingCount, boundaryCount });

  const step = (target: number, label: string, glyph: ReactNode) => {
    const atEnd = target < 1 || target > total;
    const shared = { variant: 'ghost', size: 'sm', 'aria-label': label } as const;
    if (!getHref) {
      return (
        <IconButton {...shared} disabled={atEnd} onClick={() => setValue(target)}>
          {glyph}
        </IconButton>
      );
    }
    // A link at an end leads nowhere: no href, and `aria-disabled` (from the disabled Button).
    return (
      <IconButton {...shared} asChild disabled={atEnd}>
        {atEnd ? (
          // Spec §6.3: at an end the link has no href, so it is neither followed nor focused.
          // eslint-disable-next-line jsx-a11y/anchor-is-valid
          <a>{glyph}</a>
        ) : (
          <a href={getHref(target)} onClick={() => setValue(target)}>
            {glyph}
          </a>
        )}
      </IconButton>
    );
  };

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel ?? 'Pagination'}
      className={clsx('flg-pagination', className)}
      {...props}
    >
      {step(current - 1, previousLabel, PREVIOUS)}
      {items.map((item) => {
        if (typeof item !== 'number') {
          return (
            <span key={item} className="flg-pagination-ellipsis" aria-hidden="true">
              …
            </span>
          );
        }
        const shared = {
          className: 'flg-pagination-page',
          'aria-label': getPageLabel(item),
          'aria-current': item === current ? ('page' as const) : undefined,
          onClick: () => setValue(item),
        };
        return getHref ? (
          <a key={item} href={getHref(item)} {...shared}>
            {item}
          </a>
        ) : (
          <button key={item} type="button" {...shared}>
            {item}
          </button>
        );
      })}
      {step(current + 1, nextLabel, NEXT)}
    </nav>
  );
});
```

`src/components/pagination/index.ts`:

```ts
export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';
```

Ở hai đầu, link trước và sau là `<a>` không có `href`, đúng như spec §6.3. Vì vậy rule `jsx-a11y/anchor-is-valid` được tắt ngay tại đó, kèm lý do.

- [ ] **Step 6: CSS và quy tắc forced colors**

`src/styles/components/pagination.css`:

```css
/* Pagination (spec §4.3 Pagination, mockup G1): 28px pages 4px apart, the current one in the accent
   wash with accent text, as a selected pill tab. */
@layer flg.components {
  .flg-pagination {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    font-family: var(--flg-font-sans);
  }
  /* The previous and next IconButtons hold a 15px chevron (the mockup's), not the 14px of `sm`. */
  .flg-pagination .flg-button > svg {
    width: 15px;
    height: 15px;
  }
  .flg-pagination-page {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: 28px;
    height: 28px;
    margin: 0;
    padding: 0 6px;
    border: 0;
    border-radius: var(--flg-radius-xs);
    background: transparent;
    color: var(--flg-text);
    font: var(--flg-weight-medium) var(--flg-text-sm) var(--flg-font-sans);
    text-decoration: none;
    cursor: pointer;
    transition: background-color var(--flg-duration-fast) var(--flg-ease);
  }
  /* Outside the mockup, which shows no hover: a page reacts as a ghost button does. */
  @media (hover: hover) {
    .flg-pagination-page:not([aria-current='page']):hover {
      background: var(--flg-control-track);
    }
  }
  .flg-pagination-page:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-pagination-page[aria-current='page'] {
    background: var(--flg-selected-bg);
    color: var(--flg-selected-text);
  }
  .flg-pagination-ellipsis {
    min-width: 20px;
    color: var(--flg-text-muted);
    text-align: center;
  }
}
```

```diff
diff --git a/src/styles/index.css b/src/styles/index.css
index 8e3b630..42a40aa 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -25,5 +25,6 @@
 @import './components/tabs.css';
 @import './components/accordion.css';
 @import './components/breadcrumb.css';
+@import './components/pagination.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 2a6a161..4f78f65 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -200,5 +200,9 @@
     .flg-accordion-trigger[aria-disabled='true'] {
       color: GrayText;
     }
+    /* The current page loses its fill: a Highlight edge marks it instead. */
+    .flg-pagination-page[aria-current='page'] {
+      border: 1px solid Highlight;
+    }
   }
 }
```

- [ ] **Step 7: Export, danh sách kiểm tra gói, và tên của dòng 7, 8**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 5194f1f..2758de5 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -63,6 +63,9 @@ const SHIPPED_CLASSES = [
   'flg-breadcrumb-link',
   'flg-breadcrumb-page',
   'flg-breadcrumb-separator',
+  'flg-pagination',
+  'flg-pagination-page',
+  'flg-pagination-ellipsis',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index ff8f4d4..730a1e9 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -23,6 +23,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/select/Select.tsx',
   'src/components/tabs/Tabs.tsx',
   'src/components/accordion/Accordion.tsx',
+  'src/components/pagination/Pagination.tsx',
 ];
 
 /**
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 8422374..a25af68 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -47,13 +47,14 @@ const D = {
   },
   6: { description: 'Muted text on the brightest reference backdrop', criterion: '1.4.3' },
   7: {
-    description: 'Accent text on the accent wash: an accent Badge, a selected pill tab',
+    description:
+      'Accent text on the accent wash: an accent Badge, a selected pill tab, the current page',
     criterion: '1.4.3',
   },
   8: {
     description:
       'The accent wash against the panel or surface: a highlighted menu item or Select option, a ' +
-      'selected pill tab',
+      'selected pill tab, the current page',
     criterion: '1.4.11',
   },
   9: {
diff --git a/src/index.test.ts b/src/index.test.ts
index b0bbacc..d2c93c2 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -58,6 +58,7 @@ describe('public API', () => {
       'MenuSub',
       'MenuSubContent',
       'MenuSubTrigger',
+      'Pagination',
       'Popover',
       'PopoverClose',
       'PopoverContent',
diff --git a/src/index.ts b/src/index.ts
index ce36ad4..10fe28f 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -132,6 +132,8 @@ export type {
 } from './components/select';
 export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
 export { Breadcrumb, BreadcrumbLink, BreadcrumbPage } from './components/breadcrumb';
+export { Pagination } from './components/pagination';
+export type { PaginationProps } from './components/pagination';
 export type {
   BreadcrumbLinkProps,
   BreadcrumbPageProps,
```

Trang hiện tại dùng cùng token với tab `pill`, nên các check `selected-*` của Task 4 đã đo nó. Chỉ tên của dòng 7 và 8 đổi.

- [ ] **Step 8: Story và trang docs**

`src/components/pagination/Pagination.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Card } from '../card/Card';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  args: { count: 12, onPageChange: fn() },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

// The card the mockup puts the pages in (mockup G1).
const card = { padding: '10px 14px', width: 'fit-content' } as const;

export const Default: Story = {
  render: (args) => (
    <Card style={card}>
      <Pagination {...args} defaultPage={5} />
    </Card>
  ),
};

export const Buttons: Story = {
  tags: ['no-visual'],
  render: (args) => <Pagination {...args} count={5} />,
  play: async ({ canvas, args }) => {
    const previous = canvas.getByRole('button', { name: 'Previous page' });
    const next = canvas.getByRole('button', { name: 'Next page' });
    await expect(previous).toBeDisabled();
    // Tab skips the disabled previous button and reaches the first page.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Page 1' })).toHaveFocus();
    await userEvent.click(next);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
    await expect(canvas.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Page 5' }));
    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();
    await userEvent.click(previous);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(4);
  },
};

export const Links: Story = {
  tags: ['no-visual'],
  render: (args) => <Pagination {...args} getHref={(page) => `#page-${page}`} />,
  play: async ({ canvasElement, args }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Pagination' });
    const previous = within(nav).getByLabelText('Previous page');
    // At the first page the previous link has no href and takes no focus.
    await expect(previous).not.toHaveAttribute('href');
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    await expect(within(nav).getByRole('link', { name: 'Page 1' })).toHaveFocus();
    // A link reports the page; the browser would then follow its href. Following it here would
    // take the test's own page away, so the story stops the navigation (the component does not).
    nav.addEventListener('click', (event) => event.preventDefault());
    const page3 = within(nav).getByRole('link', { name: 'Page 3' });
    await expect(page3).toHaveAttribute('href', '#page-3');
    await userEvent.click(page3);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(3);
    await expect(within(nav).getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '#page-2',
    );
  },
};
```

`src/components/pagination/Pagination.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Pagination.stories';

<Meta of={Stories} />

# Pagination

```tsx
import { Pagination } from 'fl-glass-ui';

<Pagination count={12} page={page} onPageChange={setPage} />;
```

<Canvas of={Stories.Default} />
<Controls />

## Which pages show

The row shows `boundaryCount` pages at each end (default 1), `siblingCount` pages on each side of
the current one (default 1), and an ellipsis for each gap. A gap of one page shows that page
instead, and the row keeps the same number of slots as the current page moves, so it does not
jump around. `count` below 1 counts as 1, and the page stays within 1 and `count`.

## Buttons or links

- By default the pages are buttons: `onPageChange` gets the page, and you show it. The previous
  and next buttons are disabled at the ends.
- With `getHref`, every page is a link to `getHref(page)`, so the pages work without JavaScript
  and open in a new tab. A click still calls `onPageChange`, and the browser follows the link. At
  the ends, the previous and next links have no `href` and `aria-disabled="true"`.

In a React Server Component, pass `getHref` from a client component of your own: a function
cannot cross from the server to a client component.

## Labels

The navigation is named "Pagination"; the arrows "Previous page" and "Next page"; each page
"Page 5" and so on. Change them with `aria-label`, `previousLabel`, `nextLabel` and
`getPageLabel`, for example to translate them.

## Accessibility

- It is a `nav` landmark. The current page has `aria-current="page"`, and the ellipses are
  hidden from assistive technology.
- The current page uses the accent wash with accent text, as a selected pill tab: see rows 7 and
  8 on the Accessibility page. With `prefers-contrast: more` it is solid accent.

## Do and don't

- Do use Pagination for long lists split into pages.
- Don't use it for steps of a task, or for a few items: show them all.
````

Story `Links` chặn điều hướng ở `nav` sau khi đã kiểm `href` (phát hiện 12).

- [ ] **Step 9: Cập nhật hai spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 48c79ec..f8d367b 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -318,8 +318,8 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
 | 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
-| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
-| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
+| 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
+| 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
 | 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index a419916..bf9e65b 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -356,7 +356,10 @@ Số liệu lấy từ mockup đã duyệt. Mọi giá trị đều dùng token
 - Nút trang 28×28px, padding ngang 6px, bo `--flg-radius-xs`, chữ `--flg-text-sm` đậm `--flg-weight-medium`.
 - Trang hiện tại có nền `--flg-accent-subtle`, chữ `--flg-accent-text`.
 - Dấu `…` màu `--flg-text-muted`.
-- Nút trước và sau là `IconButton` `ghost` `sm`.
+- Nút trước và sau là `IconButton` `ghost` `sm`, chevron 15px như mockup (không phải 14px của `sm`).
+- Các nút trang cách nhau 4px.
+- **Hover** (ngoài mockup, vì mockup không vẽ): nút trang không phải trang hiện tại có nền `--flg-control-track`, như Button `ghost`.
+- Trang hiện tại dùng `--flg-selected-bg` và `--flg-selected-text` (§4.2), như tab `pill` đang chọn.
 
 **Toast (P3 + S2):**
 
@@ -868,6 +871,8 @@ Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
   - **Có `getHref`:** các nút là `<a href>` (nút trước và sau dùng `IconButton asChild`).
     - Ở hai đầu, nút trước và sau là `<a aria-disabled="true">` không có `href`.
     - Bấm link vẫn gọi `onPageChange`, và trình duyệt vẫn điều hướng bình thường.
+    - `getHref` là một hàm, nên không truyền được từ Server Component sang Pagination (một client component). Docs hướng dẫn bọc nó trong một client component của người dùng.
+- Mỗi nút trang có `aria-label` từ `getPageLabel`. Hàm tính dãy trang nằm ở `src/components/pagination/pagination-range.ts` (`getPaginationRange`), không có `"use client"`, và có test riêng cho mọi `count` ≤ 30 (Plan D).
 
 **`toast` và `Toaster`**
 
```

- [ ] **Step 10: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm check:contrast
pnpm vitest run --project storybook-light --project storybook-dark src/components/pagination
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 670 test PASS, 3 skip.
- Story: 18 test PASS (3 story × 3 trình duyệt × 2 theme).
- `check:contrast` và `check:package` PASS.

- [ ] **Step 11: Commit**

```bash
git add src/components/pagination src/styles src/index.ts src/index.test.ts scripts .size-limit.json docs/superpowers/specs
git commit -m "feat(pagination): add Pagination, with buttons or links" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 8: Bốn component trong hai fixture

Spec §7: hai fixture render đủ component giai đoạn 2, và `next-app` render Breadcrumb trong một Server Component.

**Files:**
- Create: `fixtures/vite-app/src/Navigation.tsx`, `fixtures/next-app/app/navigation.tsx`, `fixtures/next-app/app/pages.tsx`
- Modify: `fixtures/vite-app/src/App.tsx`, `fixtures/next-app/app/page.tsx`, `scripts/test-fixtures.mjs`, spec giai đoạn 2

**Interfaces:**
- Consumes: public API của Task 3–7, từ tarball đã build.
- Produces: không có gì cho task khác.

- [ ] **Step 1: Thêm phần kiểm tra vào script fixture**

```diff
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index 94e5b1c..9c71e1c 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -74,6 +74,10 @@ const COMPONENTS = [
   '.flg-menu',
   '.flg-context-menu-trigger',
   '.flg-select',
+  '.flg-tabs',
+  '.flg-accordion',
+  '.flg-breadcrumb',
+  '.flg-pagination',
 ];
 
 function run(command, args, cwd) {
@@ -196,6 +200,7 @@ async function inspect(page, url, problems) {
   await checkOverlays(page, problems);
   await checkMenus(page, problems);
   await checkSelects(page, problems);
+  await checkNavigation(page, problems);
 }
 
 const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement);
@@ -294,6 +299,41 @@ async function checkSelects(page, problems) {
   }
 }
 
+/** Phase 2, plan D: Tabs from the keyboard, a single Accordion, Breadcrumb and Pagination. */
+async function checkNavigation(page, problems) {
+  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
+  if ((await crumbs.locator('[aria-current="page"]').textContent()) !== 'Attachments') {
+    problems.push('the Breadcrumb does not mark the current page');
+  }
+
+  await page.getByRole('tab', { name: 'Overview' }).focus();
+  await page.keyboard.press('ArrowRight');
+  const members = page.getByRole('tab', { name: 'Members' });
+  if (!(await hasFocus(members)) || (await members.getAttribute('aria-selected')) !== 'true') {
+    problems.push('the arrow key did not move to and select the next tab');
+  }
+  if (!(await page.getByRole('tabpanel', { name: 'Members' }).isVisible())) {
+    problems.push('the selected tab did not show its panel');
+  }
+
+  // A single Accordion: its items share a name, so the browser closes one as another opens.
+  const isOpen = (title) =>
+    page.getByText(title).evaluate((summary) => summary.closest('details').open);
+  await page.getByText('Can I change plans?').click();
+  await page.waitForFunction(
+    () => document.querySelectorAll('.flg-accordion details[open]').length === 1,
+  );
+  if (!(await isOpen('Can I change plans?')) || (await isOpen('Is there a free trial?'))) {
+    problems.push('opening an Accordion item did not close the other one');
+  }
+
+  const page6 = page.getByRole('button', { name: 'Page 6' });
+  await page6.click();
+  if ((await page6.getAttribute('aria-current')) !== 'page') {
+    problems.push('Pagination did not move to the page clicked');
+  }
+}
+
 async function testApp(name, browser) {
   const app = APPS[name];
   const cwd = join(FIXTURES, app.dir);
@@ -326,6 +366,16 @@ async function testApp(name, browser) {
           `${label}: the server HTML lacks the Select's chosen option or native options`,
         );
       }
+      // Breadcrumb renders in the Server Component, and the open Accordion item is open in the HTML.
+      if (
+        app.serverRendered &&
+        !(
+          /<nav aria-label="Breadcrumb" class="flg-breadcrumb"/.test(html) &&
+          /<details(?=[^>]*\bclass="flg-accordion-item")(?=[^>]*\bopen="")/.test(html)
+        )
+      ) {
+        problems.push(`${label}: the server HTML lacks the Breadcrumb or the open Accordion item`);
+      }
       for (const problem of await checkPage(browser, server.url)) {
         problems.push(`${label}: ${problem}`);
       }
```

Regex của HTML từ server dùng lookahead. Lý do: React in `name` và `open` trước `class` trên `<details>`, nên một regex phụ thuộc thứ tự thuộc tính sẽ không khớp.

- [ ] **Step 2: Viết hai khối Navigation**

`fixtures/vite-app/src/Navigation.tsx`:

```tsx
// The navigation of phase 2, plan D. The Next.js fixture renders the same markup, with the
// Breadcrumb, Tabs and Accordion written in a Server Component.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
  Pagination,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'fl-glass-ui';
import { useState } from 'react';

export function Navigation() {
  const [page, setPage] = useState(5);
  return (
    <section aria-label="Navigation" style={{ display: 'grid', gap: 12 }}>
      <Breadcrumb>
        <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
        <BreadcrumbPage>Attachments</BreadcrumbPage>
      </Breadcrumb>
      <Tabs defaultValue="overview">
        <TabsList aria-label="Project">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">The overview panel.</TabsContent>
        <TabsContent value="members">The members panel.</TabsContent>
      </Tabs>
      <Accordion defaultValue="trial">
        <AccordionItem value="trial">
          <AccordionTrigger>Is there a free trial?</AccordionTrigger>
          <AccordionContent>Yes, 14 days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="plans">
          <AccordionTrigger>Can I change plans?</AccordionTrigger>
          <AccordionContent>At any time.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Pagination count={12} page={page} onPageChange={setPage} />
    </section>
  );
}
```

`fixtures/next-app/app/navigation.tsx`:

```tsx
// A Server Component: the navigation of phase 2, plan D. Breadcrumb is server-safe and renders
// here; Tabs and Accordion are client components with their content written on the server. The
// Vite fixture renders the same markup on the client.
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'fl-glass-ui';
import { Pages } from './pages';

export function Navigation() {
  return (
    <section aria-label="Navigation" style={{ display: 'grid', gap: 12 }}>
      <Breadcrumb>
        <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
        <BreadcrumbPage>Attachments</BreadcrumbPage>
      </Breadcrumb>
      <Tabs defaultValue="overview">
        <TabsList aria-label="Project">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">The overview panel.</TabsContent>
        <TabsContent value="members">The members panel.</TabsContent>
      </Tabs>
      <Accordion defaultValue="trial">
        <AccordionItem value="trial">
          <AccordionTrigger>Is there a free trial?</AccordionTrigger>
          <AccordionContent>Yes, 14 days.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="plans">
          <AccordionTrigger>Can I change plans?</AccordionTrigger>
          <AccordionContent>At any time.</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Pages />
    </section>
  );
}
```

`fixtures/next-app/app/pages.tsx`:

```tsx
'use client';

// Pagination keeps its page in state here: a Server Component cannot pass it onPageChange.
import { Pagination } from 'fl-glass-ui';
import { useState } from 'react';

export function Pages() {
  const [page, setPage] = useState(5);
  return <Pagination count={12} page={page} onPageChange={setPage} />;
}
```

```diff
diff --git a/fixtures/next-app/app/page.tsx b/fixtures/next-app/app/page.tsx
index 32e7f5c..3721230 100644
--- a/fixtures/next-app/app/page.tsx
+++ b/fixtures/next-app/app/page.tsx
@@ -24,6 +24,7 @@ import {
 } from 'fl-glass-ui';
 import { ClientControls } from './client-controls';
 import { Menus } from './menus';
+import { Navigation } from './navigation';
 import { Overlays } from './overlays';
 import { Selects } from './selects';
 
@@ -73,6 +74,7 @@ export default function Page() {
       <Overlays />
       <Menus />
       <Selects />
+      <Navigation />
     </main>
   );
 }
diff --git a/fixtures/vite-app/src/App.tsx b/fixtures/vite-app/src/App.tsx
index 2fd2c63..103d2e0 100644
--- a/fixtures/vite-app/src/App.tsx
+++ b/fixtures/vite-app/src/App.tsx
@@ -23,6 +23,7 @@ import {
 } from 'fl-glass-ui';
 import { useEffect, useState } from 'react';
 import { Menus } from './Menus';
+import { Navigation } from './Navigation';
 import { Overlays } from './Overlays';
 import { Selects } from './Selects';
 
@@ -95,6 +96,7 @@ export function App() {
       <Overlays />
       <Menus />
       <Selects />
+      <Navigation />
     </main>
   );
 }
```

Pagination nằm trong một client component của fixture: một Server Component không truyền được `onPageChange` (hay `getHref`) sang client component.

- [ ] **Step 3: Cập nhật spec và chạy hai fixture**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index bf9e65b..342d6a3 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -986,6 +986,7 @@ Các lớp 1–6 của spec 0+1 §7 giữ nguyên, với phần bổ sung sau.
   - `vite-app` và `next-app` render đủ component giai đoạn 2.
   - Kịch bản kiểm tra: mở và đóng một Dialog, chọn một option của Select, mở một menu, và hiện một toast trong lúc Dialog đang mở. Console phải sạch.
   - `next-app` render Breadcrumb trong một Server Component.
+  - Plan D thêm: chuyển tab bằng phím mũi tên, mở một mục của Accordion `single` thì mục kia đóng, trang hiện tại của Breadcrumb, và bấm sang trang khác của Pagination. HTML từ server của `next-app` có sẵn Breadcrumb và mục Accordion đang mở. Pagination nằm trong một client component của fixture, vì Server Component không truyền được `onPageChange`.
 
 ---
 
```

Run: `pnpm build && pnpm test:fixtures`
Expected: `Fixtures OK: vite, next.`

- [ ] **Step 4: Commit**

```bash
git add fixtures scripts/test-fixtures.mjs docs/superpowers/specs
git commit -m "test(fixtures): render Tabs, Accordion, Breadcrumb and Pagination in both apps" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
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

Expected: 670 unit test PASS (3 skip); 858 story test PASS; tương phản PASS; gói PASS; hai fixture PASS.

- [ ] **Sau khi đẩy nhánh:** chủ dự án chạy workflow "Update visual baselines" cho nhánh, để tạo 32 ảnh của `Tabs/Variants`, `Accordion/Default`, `Breadcrumb/Separators` và `Pagination/Default`. Sau commit của bot, cần một lần push mới, hoặc đóng rồi mở lại PR, thì job visual mới chạy trên commit có ảnh.
- [ ] **Xem bằng mắt các ảnh forced colors và `prefers-contrast: more`:**
  - tab đang chọn của cả ba kiểu phải có dấu hiệu `Highlight`;
  - trang hiện tại phải có viền;
  - tab `segmented` đang chọn phải có viền màu chữ ở `prefers-contrast: more`.
- [ ] **Bản dọc của Tabs** nằm ngoài mockup (spec §4.3): chủ dự án duyệt qua ảnh `Tabs/Variants`.
- [ ] **Mô tả PR** nêu các dòng mới của §4.9 (spec §4.4: điểm mới được nêu trong mô tả PR):
  - dòng 12 và 13 mới (tab `segmented`);
  - dòng 5, 7 và 8 nói thêm vạch dưới tab, tab `pill` và trang hiện tại, với số đo không đổi.
