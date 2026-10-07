# fl-glass-ui: Plan C, Select (giai đoạn 2, phần 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm Select chọn một và chọn nhiều, có `<select>` gốc ẩn để dùng trong form, cùng primitive `collectChildren`. Kèm theo là sáu việc Plan B để lại cho Plan C, trong đó có hook trigger dùng chung theo quyết định của chủ dự án.

**Architecture:**
- **Item đọc tĩnh từ `children`.** `SelectItem`, `SelectGroup` và `SelectSeparator` render `null`; chúng chỉ là marker (`markPart`). `collectChildren` (`src/internal/collect-children.ts`) đọc chúng qua Fragment, mảng và `SelectGroup`, và gỡ lớp lazy reference của RSC. Nhờ vậy HTML từ server đã có chữ của lựa chọn trên trigger và đủ các `<option>` gốc.
- **Focus luôn ở trigger**, theo mẫu APG "select-only combobox". Option được trỏ là state (một chỉ số), báo cho công nghệ hỗ trợ qua `aria-activedescendant`, và mang `data-highlighted`. CSS của menu tô `[data-highlighted]` giống `:focus`.
- **Listbox dùng lại hạ tầng của menu:**
  - `popover="auto"` qua `usePopover`;
  - `useFloating` với hai option mới, `matchWidth` và `onPlaced`;
  - class `flg-menu` và `flg-menu-item`, cùng các token `--flg-highlight-*` của Plan B.
- **Trạng thái mở và cú nhấn trigger dùng chung** cho Popover, DropdownMenu và Select, qua `usePopoverState` và `useTriggerPress` (`src/internal/use-popover-trigger.ts`). Đây là quyết định của chủ dự án ở review PR #6 (ý 12).
- **`<select>` gốc ẩn** nằm phủ trùng trigger và luôn đồng bộ với giá trị. Nhờ nó Select có FormData, `required`, reset form và autofill. Khi form reset, Select dùng `reset` mới của `useControllableState`, nên `onValueChange` không bị gọi.
- **Chọn nhiều hiện thẻ.** Thẻ là `Badge`, được đo trên một thước ẩn bằng `ResizeObserver`. Phần không vừa gom thành một thẻ "+N". Thẻ có `aria-hidden`; một danh sách ẩn mang chữ cho screen reader.

**Tech Stack:** Như Plan B: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`:
- §2: phạm vi Plan C, và những gì của Select nằm ngoài phạm vi.
- §4.1: mockup đã duyệt.
- §4.3: kích thước và giao diện của listbox và thẻ.
- §4.5: forced colors.
- §5:
  - mới: `collect-children.ts`, `use-popover-trigger.ts`;
  - cập nhật: `use-floating.ts`, `use-popover.ts`, `use-controllable-state.ts`, `use-typeahead.ts`.
- §6.3: Select.
- §7: kiểm thử, fixture.

Và §4.9 của `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`: dòng 8 và 9 giờ nói cả option của Select.

**Mockup chuẩn:**
- `docs/superpowers/specs/mockups/phase-2-menus.html`, phương án **A**: Select chọn một, option được trỏ và dấu check.
- `docs/superpowers/specs/mockups/phase-2-multi-select.html`, phương án **M1**: trigger có thẻ.

CSS trong plan này dựng lại đúng hai phương án đó. Ảnh chụp story `Open` (light) và `MultipleOpen` (dark) ở Chromium đã được so với mockup khi lập kế hoạch.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/plan-c-tasks`, mỗi task một commit, và mỗi task đã chạy riêng các lệnh kiểm tra của nó.
- Test viết trước của mỗi task đã được chạy trên commit cha của task, để xác nhận nó fail đúng như plan ghi.
- Mọi khối code trong plan được lấy thẳng từ các commit đó.

Kết quả ở commit cuối:

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 556 test PASS, 2 skip (trước plan: 511), gồm React 19, React 18.3, script và type test |
| `pnpm test:stories` | 744 test PASS (trước plan: 678): 124 story × 3 trình duyệt × 2 theme, kèm axe |
| `pnpm check:contrast` | PASS. Không có dòng mới ở §4.9; dòng 8 và 9 giờ nói cả option của Select (Task 6) |
| `pnpm check:package` | PASS |
| `pnpm test:fixtures` | Cả hai fixture PASS, ở production lẫn development |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | PASS |

Mười phát hiện từ lần chạy thử đã được đưa vào plan. Spec được cập nhật theo, trong chính các task:

1. **Safari không focus nút được bấm.** Vì vậy một Select mở bằng chuột không nhận phím. Trigger tự focus trong cú nhấn. Story `Default` có bước bấm thật rồi dùng phím, và bước này fail ở WebKit nếu thiếu dòng đó (Task 6).
2. **Bấm lại trigger để đóng một popover đang mở trong Dialog.** WebKit để focus ở panel của Dialog, vì Safari focus phần tử focus được gần nhất bao quanh nút.
   - Lỗi này có từ Plan B (Popover, DropdownMenu). Plan B đã ghi lại nhưng chưa có test.
   - Giờ `usePopover` nhận ra lần nhấn lên chính trigger và trả focus về đó (Task 2).
3. **Thẻ làm Select phình ra.** Phần tử con của grid có `min-width: auto`, nên rộng theo nội dung. Thẻ của Select chọn nhiều đẩy trigger rộng ra, thay vì gom vào "+N". Spec thêm quy tắc chiều rộng (Task 6).
4. **Menu cao giấu item cuối.** ↑ trên trigger focus item cuối, nhưng `max-height` áp sau đó, nên item nằm ngoài tầm nhìn.
   - `useFloating` có thêm `onPlaced`, được gọi sau lần đặt vị trí đầu, và panel menu cuộn item đang focus vào tầm nhìn (Task 4).
   - Listbox dùng cùng cơ chế.
5. **`paintStops` im lặng trước một dạng `color-mix` nó không đọc được.**
   - Nó trả về không màu nào, và `Math.min()` của mảng rỗng là `Infinity`, nên check đó đạt mà không đo gì.
   - Giờ nó throw (Task 1). Việc này phải xong trước khi listbox dùng lại các token highlight.
6. **Select sẽ là bản sao thứ ba** của logic trạng thái mở và cú nhấn trigger, sau Popover và DropdownMenu.
   - Theo quyết định ở review PR #6, logic đó được tách thành hook dùng chung trước (Task 3).
   - Hành vi không đổi: story của Popover và DropdownMenu chạy lại mà không cần sửa.
7. **Typeahead bắt đầu từ phần tử đang có focus**, nhưng focus của Select luôn ở trigger. `useTypeahead` nhận thêm `getCurrent` (Task 5).
8. **Reset form không phát `change`.** `useControllableState` trả thêm `reset` (Task 5). Nhờ đó Select uncontrolled trở về `defaultValue` mà không gọi `onValueChange`, giống control gốc.
9. **Select cần `open`, `defaultOpen` và `onOpenChange`** như các overlay khác: để story mở sẵn cho ảnh chuẩn, và để người dùng điều khiển được. Spec §6.3 thêm ba prop này (Task 6).
10. **`collectChildren` không ship được một mình.** `check:use-client` đòi mọi module trong `src/internal/` có bản build, mà module chưa ai import thì không có. Vì vậy nó đi cùng Select ở Task 6, chứ không ở Task 5 cùng các primitive khác.

**Phạm vi:**
- **Không làm ở plan này:**
  - Ảo hoá danh sách dài, nạp item bất đồng bộ, item do component tự định nghĩa bọc lại (ngoài phạm vi giai đoạn 2, spec §2).
  - Combobox có ô tìm kiếm (giai đoạn 3).
  - Tabs, Accordion, Breadcrumb, Pagination (Plan D). Breadcrumb sẽ dùng `collectChildren` của plan này.
  - Toast, changeset `0.2.0` và trang docs tổng (Plan E).
  - Các việc từ review PR #6 không đụng tới code của plan này.
- **Ảnh chuẩn visual:**
  - Plan thêm hai story có ảnh: `Select/Open` và `Select/MultipleOpen`, tức 16 ảnh mới (2 theme × 4 chế độ).
  - Mọi story khác của plan gắn `no-visual`, kể cả `DropdownMenu/TallMenu`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` nằm trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`.
- **Mockup lock.**
  - Plan này không đổi giá trị token nào trong `src/styles/theme/values.ts`.
  - Listbox dùng lại các token `--flg-highlight-*` của Plan B. Thẻ là `Badge`. Hộp chọn của option chọn nhiều dựng lại đúng hộp của Checkbox.
  - CSS ở plan này là bản đã đối chiếu với mockup, không được "cải thiện".
- `backdrop-filter` chỉ có ở: `Surface`, `Card`, panel của Dialog và Drawer, Popover, menu và listbox (qua `.flg-surface`), Tooltip, `::backdrop` (spec §4.2).
- **Không set `display` vô điều kiện** cho phần tử `popover`. `.flg-select-listbox` không set `display`.
- **`"use client"`** chỉ có ở `Select.tsx` (cùng các module client có từ trước). `collect-children.ts`, `use-popover-trigger.ts` và mọi file khác trong `src/internal/` **không** có directive.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Sự kiện `toggle` gắn bằng `addEventListener` (qua `usePopover`), không dùng prop React.
- Chữ mặc định do lib cung cấp bằng tiếng Anh. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. Plan này không thêm changeset.
- Mỗi task đổi JS hoặc CSS của lib (Task 2–6): chạy `pnpm build && pnpm size:record` trước `pnpm check:package`, và commit `.size-limit.json` đã cập nhật.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme` (phát hiện 10 của Plan B).
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Với file đã có, plan đưa một patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Với file mới, plan đưa toàn bộ nội dung file.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý nhưng không nêu thành test. Mỗi dòng có test ở task tương ứng:

1. **Reset một form có Select uncontrolled và Select controlled.** Select uncontrolled trở về `defaultValue` mà không gọi `onValueChange`; Select controlled giữ giá trị. Test:
   - Task 5: unit test `resets an uncontrolled value without reporting it, and leaves a controlled one alone`.
   - Task 6: story `InAForm`.
2. **Bấm chuột vào trigger trên Safari, rồi dùng phím mũi tên.** Listbox nhận phím. Test ở Task 6: story `Default`, bước bấm thật trên WebKit.
3. **Select hoặc DropdownMenu trong Dialog, bấm lại trigger để đóng.** Focus ở trigger và Dialog vẫn mở; Esc chỉ đóng listbox. Test:
   - Task 2: story `Dialog/DropdownMenu in a Dialog`.
   - Task 6: story `InADialog`.
4. **Chọn nhiều giá trị trong một cột hẹp.** Select giữ chiều rộng, và phần không vừa vào "+N". Test ở Task 6: story `MultipleOpen` (cột 220px, ba lựa chọn, đòi "+1").
5. **`SelectItem` bọc trong một component tự viết.** Item bị bỏ qua, kèm một cảnh báo dev nói rõ lý do; trang không vỡ. Test ở Task 6: `Select.test.tsx`, test `warns about children it cannot read, and skips them`.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts` | `paintStops` throw khi không đo được (Task 1) |
| `src/internal/use-popover.ts`, `src/internal/use-popover.test.tsx`, `src/components/dialog/Dialog.stories.tsx` | Focus về trigger được bấm để đóng; test cho `beforetoggle` (Task 2) |
| `src/internal/use-popover-trigger.ts` | `usePopoverState` và `useTriggerPress`, dùng chung (Task 3) |
| `src/components/popover/Popover.tsx`, `src/components/dropdown-menu/DropdownMenu.tsx` | Chuyển sang hook dùng chung (Task 3) |
| `src/internal/use-floating.ts`, `src/components/menu/MenuPanel.tsx` | `matchWidth`, `onPlaced`; menu cao cuộn tới item đang focus (Task 4) |
| `src/internal/use-controllable-state.ts`, `src/internal/use-typeahead.ts` | `reset`; `getCurrent` (Task 5) |
| `src/internal/collect-children.ts` | Đọc tĩnh các phần con qua marker (Task 6) |
| `src/components/select/Select.tsx` | Select, `SelectItem`, `SelectGroup`, `SelectSeparator` (Task 6) |
| `src/styles/components/select.css` | Giao diện Select theo mockup A và M1 (Task 6) |
| `src/styles/components/menu.css`, `src/styles/preferences.css`, `src/styles/index.css` | `[data-highlighted]`, forced colors, thứ tự import (Task 6) |
| `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `scripts/contrast-exceptions.ts` | Export và kiểm tra gói; mô tả dòng 8 và 9 (Task 6) |
| `fixtures/*`, `scripts/test-fixtures.mjs` | Select trong hai app fixture (Task 7) |
| Hai spec | Cập nhật theo phát hiện, trong task tương ứng |

---

### Task 1: `paintStops` từ chối màu nó không đo được

Việc Plan B để lại (phát hiện 5). Script tương phản đọc màu nền qua `paintStops`. Với một dạng `color-mix` lạ, hàm trả về rỗng, và check đó đạt mà không đo gì.

**Files:**
- Modify: `scripts/lib/contrast.ts`
- Test: `scripts/lib/contrast.test.ts`

**Interfaces:**
- Consumes: không có gì mới.
- Produces: `paintStops(input: string): Rgba[]` throw `Unsupported color-mix: …` với mọi dạng `color-mix(` khác `color-mix(in srgb, <màu> N%, transparent)`, và throw `No color to measure in: …` khi không tìm thấy màu nào.

- [ ] **Step 1: Viết test (test fail)**

```diff
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index 3407ffe..208ed94 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -41,6 +41,16 @@ describe('color math', () => {
     expect(paintStops('linear-gradient(#000000, #ffffff)')).toHaveLength(2);
   });
 
+  it('refuses a paint it cannot measure, so a check never passes on nothing', () => {
+    expect(() => paintStops('color-mix(in oklch, #92222b 16%, transparent)')).toThrow(
+      /Unsupported color-mix/,
+    );
+    expect(() => paintStops('color-mix(in srgb, transparent, #92222b 16%)')).toThrow(
+      /Unsupported color-mix/,
+    );
+    expect(() => paintStops('none')).toThrow(/No color to measure/);
+  });
+
   it('gives 21:1 for black on white', () => {
     expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 5);
   });
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project scripts scripts/lib/contrast.test.ts`
Expected: 1 test FAIL (`refuses a paint it cannot measure…`) với `AssertionError: expected [Function] to throw an error`; 17 test PASS.

- [ ] **Step 3: Cho `paintStops` throw**

```diff
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 6caed96..e92b7e2 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -74,17 +74,24 @@ export function colorsIn(input: string): Rgba[] {
 
 /**
  * The colours a background paints: one colour, the stops of a gradient, or a colour mixed with
- * `transparent` by `color-mix(in srgb, <colour> N%, transparent)`.
+ * `transparent` by `color-mix(in srgb, <colour> N%, transparent)`. Anything else throws: a check
+ * that measured no colour would pass without measuring anything.
  */
 export function paintStops(input: string): Rgba[] {
-  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i.exec(
-    input.trim(),
-  );
+  const value = input.trim();
+  const mix = /^color-mix\(\s*in srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i.exec(value);
   if (mix?.[1] && mix[2]) {
     const [r, g, b, a] = parseColor(mix[1]);
     return [[r, g, b, (a * Number(mix[2])) / 100]];
   }
-  return colorsIn(input);
+  if (/color-mix\(/i.test(value)) {
+    throw new Error(
+      `Unsupported color-mix: ${input}. Only "color-mix(in srgb, <color> N%, transparent)" is measured.`,
+    );
+  }
+  const stops = colorsIn(value);
+  if (stops.length === 0) throw new Error(`No color to measure in: ${input}`);
+  return stops;
 }
 
 /** Paints `top` over an opaque `bottom`. */
```

- [ ] **Step 4: Chạy test và script tương phản**

Run: `pnpm vitest run --project scripts scripts/lib/contrast.test.ts && pnpm check:contrast | tail -1 && pnpm lint && pnpm typecheck`
Expected: 18 test PASS. Script in `Contrast check passed.`: mọi màu nền hiện có đều đo được.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/contrast.ts scripts/lib/contrast.test.ts
git commit -m "fix(contrast): refuse a paint the script cannot measure" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: Focus về trigger được bấm để đóng popover (Safari trong Dialog)

Hai việc Plan B để lại:
- **Lỗi focus (phát hiện 2).** Bấm lại trigger của một popover đang mở trong Dialog, WebKit để focus ở panel của Dialog.
- **Spec và unit test cho `beforetoggle`.** Bản sửa cuối của Plan B trả focus ngay ở `beforetoggle`, nhưng dòng `use-popover.ts` của spec §5 chưa nói tới, và chưa có unit test.

**Files:**
- Modify: `src/internal/use-popover.ts`, `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`, `.size-limit.json`
- Test: `src/internal/use-popover.test.tsx`, `src/components/dialog/Dialog.stories.tsx`

**Interfaces:**
- Consumes: không có gì mới.
- Produces: không đổi API. Bên trong, ref `pressedElsewhere: boolean` thành `lastPress: 'none' | 'elsewhere' | 'home'`. Lần nhấn `'home'` (lên phần tử mà focus sẽ trở về) luôn đưa focus về đó khi popover đóng.

- [ ] **Step 1: Viết unit test**

```diff
diff --git a/src/internal/use-popover.test.tsx b/src/internal/use-popover.test.tsx
index 9f94c53..92226a7 100644
--- a/src/internal/use-popover.test.tsx
+++ b/src/internal/use-popover.test.tsx
@@ -42,10 +42,93 @@ function stubPopover(el: HTMLElement) {
 
 const nextTask = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
 
+// A trigger outside the popover and a control inside it, for the focus-return tests.
+function WithTrigger(props: Omit<UsePopoverOptions, 'restoreFocusTo'>) {
+  const ref = useRef<HTMLDivElement>(null);
+  const trigger = useRef<HTMLButtonElement>(null);
+  usePopover(ref, { ...props, restoreFocusTo: () => trigger.current });
+  return (
+    <>
+      <button ref={trigger} type="button">
+        Trigger
+      </button>
+      <div ref={ref} data-testid="popover">
+        <button type="button">Inside</button>
+      </div>
+    </>
+  );
+}
+
+// The trigger inside a focusable panel, like a menu inside a Dialog.
+function InAPanel(props: Omit<UsePopoverOptions, 'restoreFocusTo'>) {
+  const ref = useRef<HTMLDivElement>(null);
+  const trigger = useRef<HTMLButtonElement>(null);
+  usePopover(ref, { ...props, restoreFocusTo: () => trigger.current });
+  return (
+    <div tabIndex={-1} data-testid="panel">
+      <button ref={trigger} type="button">
+        Trigger
+      </button>
+      <div ref={ref} data-testid="popover" />
+    </div>
+  );
+}
+
+const beforeToggle = (el: Element, newState: 'open' | 'closed') =>
+  act(() => {
+    el.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState }));
+  });
+
 describe('usePopover', () => {
   beforeEach(() => resetDevWarnings());
   afterEach(() => vi.restoreAllMocks());
 
+  it('returns focus to the trigger before the browser hides it (Esc, light dismiss)', () => {
+    const { getByTestId, getByRole, rerender } = render(
+      <WithTrigger open={false} onOpenChange={() => {}} />,
+    );
+    stubPopover(getByTestId('popover'));
+    rerender(<WithTrigger open onOpenChange={() => {}} />);
+    getByRole('button', { name: 'Inside' }).focus();
+    // The browser's own hide: `beforetoggle` comes while the popover is still showing and focused.
+    beforeToggle(getByTestId('popover'), 'closed');
+    expect(getByRole('button', { name: 'Trigger' })).toHaveFocus();
+  });
+
+  it('leaves focus alone on beforetoggle for its own hide and for opening', () => {
+    const { getByTestId, getByRole, rerender } = render(
+      <WithTrigger open={false} onOpenChange={() => {}} />,
+    );
+    const el = getByTestId('popover');
+    stubPopover(el);
+    rerender(<WithTrigger open onOpenChange={() => {}} />);
+    const inside = getByRole('button', { name: 'Inside' });
+    inside.focus();
+    beforeToggle(el, 'open');
+    expect(inside).toHaveFocus();
+    // The library's own hide already moved focus out before hiding; its beforetoggle does nothing.
+    rerender(<WithTrigger open={false} onOpenChange={() => {}} />);
+    inside.focus();
+    beforeToggle(el, 'closed');
+    expect(inside).toHaveFocus();
+  });
+
+  it('returns focus to the trigger that was pressed to close it, wherever the press moved it', () => {
+    const { getByTestId, getByRole, rerender } = render(
+      <InAPanel open={false} onOpenChange={() => {}} />,
+    );
+    stubPopover(getByTestId('popover'));
+    rerender(<InAPanel open onOpenChange={() => {}} />);
+    const trigger = getByRole('button', { name: 'Trigger' });
+    // Safari does not focus a pressed button: it focuses the nearest focusable element around it.
+    act(() => {
+      trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
+    });
+    getByTestId('panel').focus();
+    rerender(<InAPanel open={false} onOpenChange={() => {}} />);
+    expect(trigger).toHaveFocus();
+  });
+
   it('calls onShown once the popover really shows', () => {
     const onShown = vi.fn();
     const { getByTestId, rerender } = render(
```

Hai test đầu ghi lại hành vi `beforetoggle` mà Plan B đã sửa, nên chúng PASS ngay. Test thứ ba là lỗi mới.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/use-popover.test.tsx`
Expected: 1 test FAIL (`returns focus to the trigger that was pressed to close it…`) với `Error: expect(element).toHaveFocus()`; 10 test PASS.

- [ ] **Step 3: Thêm bước bấm lại trigger vào story Dialog**

```diff
diff --git a/src/components/dialog/Dialog.stories.tsx b/src/components/dialog/Dialog.stories.tsx
index d77299e..56fd75b 100644
--- a/src/components/dialog/Dialog.stories.tsx
+++ b/src/components/dialog/Dialog.stories.tsx
@@ -291,6 +291,16 @@ export const DropdownMenuInADialog: Story = {
     await expect(dialog.open).toBe(true);
     await expect(args.onOpenChange).not.toHaveBeenCalled();
 
+    // A press on the trigger of the open menu closes it, and focus stays on the trigger.
+    await real.click(status);
+    await waitFor(() => expect(isOpen()).toBe(true));
+    await real.click(status);
+    await waitFor(() => expect(isOpen()).toBe(false));
+    await delay(50);
+    await expect(isOpen()).toBe(false);
+    await expect(status).toHaveFocus();
+    await expect(dialog.open).toBe(true);
+
     // With no menu open, a click on the frame closes the dialog as before.
     await real.click(dialog, { position: { x: 4, y: 4 } });
     await waitFor(() => expect(dialog.open).toBe(false));
```

Run: `pnpm gen:theme && pnpm vitest run --project storybook-light src/components/dialog --browser.name=webkit -t "DropdownMenu in a Dialog"`
Expected: 1 test FAIL ở WebKit: sau cú bấm thứ hai, focus không ở trigger. Cùng lệnh với `--browser.name=chromium` thì PASS, vì Chromium focus nút được bấm.

- [ ] **Step 4: Sửa `usePopover`**

```diff
diff --git a/src/internal/use-popover.ts b/src/internal/use-popover.ts
index 7d6a17c..b2f425b 100644
--- a/src/internal/use-popover.ts
+++ b/src/internal/use-popover.ts
@@ -45,13 +45,28 @@ const REFUSED =
   'being shown or hidden at that moment. This happens when code opens a popover from an event that ' +
   'fires while another popover closes, such as a focus handler. Open it a task later instead.';
 
+/**
+ * The press that closes it by light dismiss: one on another control, which keeps focus, or one on
+ * the element focus returns to (its trigger).
+ */
+type Press = 'none' | 'elsewhere' | 'home';
+
 /** Returns focus to the trigger, unless the press that closed the popover was on another control. */
 function restoreFocus(
   el: HTMLElement,
-  pressedElsewhere: boolean,
+  press: Press,
   target: (() => HTMLElement | null) | undefined,
 ) {
-  if (!pressedElsewhere) returnFocus(target?.(), el);
+  if (press === 'elsewhere') return;
+  const home = target?.();
+  // A press on the trigger itself: Safari does not focus a pressed button, and moves focus to the
+  // nearest focusable element around it, such as a dialog's panel. That is no move of the user's,
+  // so focus goes back to the trigger.
+  if (press === 'home' && home?.isConnected) {
+    home.focus({ preventScroll: true });
+    return;
+  }
+  returnFocus(home, el);
 }
 
 /**
@@ -74,26 +89,31 @@ export function usePopover(
   const retry = useRef<Retry>(NO_RETRY);
   useEffect(() => () => clearTimeout(retry.current.timer), []);
 
-  // A press on another control while it is open, outside both the popover and the element focus
-  // returns to. The press closes it by light dismiss, and focus stays with that control: Safari does
-  // not focus a pressed button, and the focus left on <body> would otherwise go back to the trigger.
+  // The press that closes it by light dismiss, while it is open:
+  // - On another control, outside both the popover and the element focus returns to: focus stays
+  //   with that control. Safari does not focus a pressed button, and the focus left on <body> would
+  //   otherwise go back to the trigger.
+  // - On the element focus returns to (the trigger, pressed to close it): focus goes back to it,
+  //   wherever the press moved it (see restoreFocus).
   // It only speaks for the close that this press causes. Every press decides it afresh, and a key
   // press, a press released inside the panel or cancelled, the popover showing, or a close that has
   // been handled clears it: none of those leaves a light dismiss for it to speak for.
-  const pressedElsewhere = useRef(false);
+  const lastPress = useRef<Press>('none');
   useEffect(() => {
     if (!open) return;
     const onPointerDown = (event: PointerEvent) => {
       const { target } = event;
       const home = latest.current.restoreFocusTo?.();
-      pressedElsewhere.current =
-        target instanceof Node &&
-        !(ref.current?.contains(target) ?? false) &&
-        !(home?.contains(target) ?? false) &&
-        isInsideControl(target);
+      if (!(target instanceof Node) || (ref.current?.contains(target) ?? false)) {
+        lastPress.current = 'none';
+      } else if (home?.contains(target)) {
+        lastPress.current = 'home';
+      } else {
+        lastPress.current = isInsideControl(target) ? 'elsewhere' : 'none';
+      }
     };
     const clear = () => {
-      pressedElsewhere.current = false;
+      lastPress.current = 'none';
     };
     // A press released inside the panel, or cancelled, light-dismisses nothing.
     const onPointerUp = (event: PointerEvent) => {
@@ -149,13 +169,13 @@ export function usePopover(
       // On the retry, `wasOpen` already says open: the first try knew whether this was the opening.
       const opening = retry.current.action === 'show' ? retry.current.opening : !wasOpen.current;
       if (!isShowing(el)) {
-        pressedElsewhere.current = false;
+        lastPress.current = 'none';
         run('show', opening);
       }
     } else if (wasOpen.current || retry.current.action === 'hide') {
       // Focus leaves first, so the browser's own hide has no focus inside the popover to move.
-      restoreFocus(el, pressedElsewhere.current, latest.current.restoreFocusTo);
-      pressedElsewhere.current = false;
+      restoreFocus(el, lastPress.current, latest.current.restoreFocusTo);
+      lastPress.current = 'none';
       if (isShowing(el)) run('hide');
     }
     wasOpen.current = open;
@@ -170,7 +190,7 @@ export function usePopover(
     // As before the library's own hide, focus leaves first.
     const onBeforeToggle = (event: Event) => {
       if ((event as ToggleEvent).newState !== 'closed' || !latest.current.open) return;
-      restoreFocus(el, pressedElsewhere.current, latest.current.restoreFocusTo);
+      restoreFocus(el, lastPress.current, latest.current.restoreFocusTo);
     };
     const onToggle = (event: Event) => {
       const nowOpen = (event as ToggleEvent).newState === 'open';
@@ -178,7 +198,7 @@ export function usePopover(
       const reported = pending?.current === nowOpen;
       if (pending) pending.current = null;
       if (nowOpen === latest.current.open) return;
-      if (!nowOpen) restoreFocus(el, pressedElsewhere.current, latest.current.restoreFocusTo);
+      if (!nowOpen) restoreFocus(el, lastPress.current, latest.current.restoreFocusTo);
       if (!reported) latest.current.onOpenChange(nowOpen);
       // A controlled parent that keeps the old value does not re-render; this render resyncs the DOM.
       forceRender();
```

Trước đây lần nhấn lên trigger chỉ được tính là "không phải control khác", nên focus đi qua `returnFocus`. Hàm đó không kéo focus về khi focus đang ở ngoài popover và không ở `<body>`, mà panel Dialog Safari vừa focus đúng là chỗ như vậy. Giờ lần nhấn đó có tên riêng (`'home'`), và `restoreFocus` focus thẳng trigger.

- [ ] **Step 5: Cập nhật spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 4aac3f4..e09fbaf 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -420,7 +420,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 |---|---|---|
 | `use-controllable-state.ts` | `useControllableState({ value, defaultValue, onChange })` | Trả `[value, setValue]`. Controlled khi `value !== undefined`. `setValue` gọi `onChange` khi giá trị đổi, và chỉ cập nhật state nội bộ khi uncontrolled. Cảnh báo dev khi một component đổi giữa controlled và uncontrolled |
 | `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `alignOffset` (lệch dọc theo cạnh, cho menu con) và `maxHeight` (middleware `size`, giới hạn thêm ngoài chỗ trống; menu truyền `Infinity`), Plan C thêm `matchWidth` | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
-| `use-popover.ts` | `usePopover(ref, { open, onOpenChange })` | Gọi `showPopover()`/`hidePopover()` theo `open`. Nghe `toggle` để gọi `onOpenChange` khi trình duyệt tự đóng. Đăng ký `restoreFocusTo` của popover với `registerPopoverReturn` |
+| `use-popover.ts` | `usePopover(ref, { open, onOpenChange, restoreFocusTo, onShown, pendingToggle })` | Gọi `showPopover()`/`hidePopover()` theo `open`. Nghe `toggle` để gọi `onOpenChange` khi trình duyệt tự đóng. Khi trình duyệt tự đóng (Esc, light dismiss), focus được trả về `restoreFocusTo` ngay ở `beforetoggle`, lúc popover còn hiện: Safari không focus nút được bấm, nên trình duyệt có thể trả focus về phần tử bao quanh trigger (ví dụ panel của Dialog) mà `toggle` không còn kéo về được (sửa sau review cuối Plan B). Lần nhấn lên chính trigger để đóng nó thì focus quay về trigger, dù lần nhấn đã đưa focus đi đâu: Safari focus phần tử focus được gần nhất bao quanh nút, ví dụ panel của Dialog (phát hiện khi lập Plan C). Đăng ký `restoreFocusTo` của popover với `registerPopoverReturn` |
 | `focus.ts` | `getFocusables(root)`, `focusFirst(root)`, `isFocusable(el)`, `returnFocus(target, container, fallback)`, `registerPopoverReturn(popover, getTarget)` | Tìm các phần tử nhận focus được, theo thứ tự DOM, bỏ qua phần tử bị ẩn, `inert` hoặc `disabled`. `returnFocus` trả focus khi một overlay đóng. Nó focus đích trước; đích không nhận focus vì nằm trong một popover đã đóng thì đi tiếp tới chỗ popover đó trả focus về, theo bảng mà `registerPopoverReturn` ghi. `fallback` cũng đi như vậy |
 | `lock-scroll.ts` | `lockScroll(): () => void` | Có đếm số lần khoá. Lần khoá đầu đặt `overflow: hidden` lên `<html>`, kèm `scrollbar-gutter: stable` nếu trang đang có thanh cuộn dọc (để bố cục không bị xô). Lần mở khoá cuối trả lại style cũ |
 | `modal-stack.ts` | `registerModal(el, host)`, `subscribeModals(fn)`, `getTopModal()` | Danh sách các `<dialog>` modal của lib đang mở, theo thứ tự. `host` là phần tử `.flg-toast-host` của dialog đó. Toaster dùng danh sách này (§6.3) |
```

- [ ] **Step 6: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/dialog src/components/popover src/components/tooltip src/components/dropdown-menu src/components/context-menu
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 518 test PASS, 2 skip.
- Story: 312 test PASS (52 story × 3 trình duyệt × 2 theme).
- `check:package` PASS.
- `size:record` cũng cập nhật dòng CSS (5194 → 5214 B), dù task không đổi CSS. Lý do: lần ghi trên `main` có trước bản sửa forced colors cuối của PR #6.

- [ ] **Step 7: Commit**

```bash
git add src/internal/use-popover.ts src/internal/use-popover.test.tsx src/components/dialog/Dialog.stories.tsx .size-limit.json docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
git commit -m "fix(popover): return focus to a trigger pressed to close its popover (Safari in a Dialog)" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: Hook dùng chung cho trạng thái mở và cú nhấn trigger

Chủ dự án quyết định ở review PR #6 (ý 12): tách logic này khi Select sắp thành bản sao thứ ba (phát hiện 6). Task này là refactor, không đổi hành vi. Story của Popover và DropdownMenu là lưới an toàn, và phải PASS mà không sửa dòng nào.

**Files:**
- Create: `src/internal/use-popover-trigger.ts`
- Modify: `src/components/popover/Popover.tsx`, `src/components/dropdown-menu/DropdownMenu.tsx`, `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`, `.size-limit.json`
- Test: `src/internal/use-popover-trigger.test.tsx`

**Interfaces:**
- Consumes: Plan A: `useControllableState`.
- Produces (Task 6 dùng):
  - `usePopoverState<E extends HTMLElement>({ open, defaultOpen, onOpenChange, name }): PopoverState<E>`, với `PopoverState<E> = { open: boolean; request(open: boolean): void; report(open: boolean): void; contentRef: MutableRefObject<E | null>; pendingToggle: MutableRefObject<boolean | null> }`.
    - `request` là đường của trigger và của item: nó ghi `pendingToggle` khi trình duyệt đã tự đóng popover (light dismiss trước cú click), và giữ nguyên identity khi trạng thái mở đổi.
    - `report` là đường của `usePopover` (sự kiện `toggle`).
  - `useTriggerPress(open: boolean, toggle: (wasOpen: boolean, fromPress: boolean) => void): { onPointerDown(): void; onPointerCancel(): void; onClick(event: { detail: number } | undefined): void }`. Cú click đi theo trạng thái lúc nhấn; click từ bàn phím hoặc từ code (`detail` 0) đi theo trạng thái hiện tại.

- [ ] **Step 1: Viết test**

`src/internal/use-popover-trigger.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePopoverState, useTriggerPress } from './use-popover-trigger';

// jsdom has no Popover API: a stand-in element answers `:popover-open` from a flag.
function fakePopover(showing: boolean) {
  const el = document.createElement('div');
  el.matches = ((selector: string) => selector === ':popover-open' && showing) as typeof el.matches;
  return el;
}

describe('usePopoverState', () => {
  it('keeps request stable while the open state changes', () => {
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: false,
        onOpenChange: undefined,
        name: 'Test',
      }),
    );
    const first = result.current.request;
    act(() => first(true));
    expect(result.current.open).toBe(true);
    expect(result.current.request).toBe(first);
  });

  it('notes a close the browser already made, so its late toggle is not reported again', () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: true,
        onOpenChange,
        name: 'Test',
      }),
    );
    // Light dismiss already hid the panel when the trigger's click asks to close it.
    result.current.contentRef.current = fakePopover(false);
    act(() => result.current.request(false));
    expect(result.current.pendingToggle.current).toBe(false);
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('notes nothing for a change the browser has not made yet', () => {
    const { result } = renderHook(() =>
      usePopoverState<HTMLDivElement>({
        open: undefined,
        defaultOpen: true,
        onOpenChange: undefined,
        name: 'Test',
      }),
    );
    result.current.contentRef.current = fakePopover(true);
    act(() => result.current.request(false));
    expect(result.current.pendingToggle.current).toBeNull();
  });
});

describe('useTriggerPress', () => {
  it('goes by the state at the press: a press on the open trigger closes it', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
      initialProps: { open: true },
    });
    result.current.onPointerDown();
    // Light dismiss closed it between the press and the click.
    rerender({ open: false });
    result.current.onClick({ detail: 1 });
    expect(toggle).toHaveBeenCalledWith(true, true);
  });

  it('goes by the state now for a click from the keyboard or from code', () => {
    const toggle = vi.fn();
    const { result } = renderHook(() => useTriggerPress(false, toggle));
    result.current.onPointerDown();
    result.current.onClick({ detail: 0 });
    expect(toggle).toHaveBeenCalledWith(false, false);
  });

  it('forgets a press that was cancelled', () => {
    const toggle = vi.fn();
    const { result, rerender } = renderHook(({ open }) => useTriggerPress(open, toggle), {
      initialProps: { open: true },
    });
    result.current.onPointerDown();
    result.current.onPointerCancel();
    rerender({ open: false });
    result.current.onClick({ detail: 1 });
    expect(toggle).toHaveBeenCalledWith(false, true);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/use-popover-trigger.test.tsx`
Expected: FAIL với `Failed to resolve import "./use-popover-trigger"`.

- [ ] **Step 3: Viết hook**

`src/internal/use-popover-trigger.ts`:

```ts
import { useCallback, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useControllableState } from './use-controllable-state';

export interface PopoverStateOptions {
  open: boolean | undefined;
  defaultOpen: boolean;
  onOpenChange: ((open: boolean) => void) | undefined;
  /** The component's name, for the dev warning about switching between controlled and not. */
  name: string;
}

export interface PopoverState<E extends HTMLElement> {
  open: boolean;
  /**
   * Asks for a change: a trigger, a chosen item, a close button. Stable across opening and closing.
   */
  request: (open: boolean) => void;
  /** Reports a change that the browser made: light dismiss, Esc. */
  report: (open: boolean) => void;
  contentRef: MutableRefObject<E | null>;
  /** Pass to `usePopover`: the toggle the browser fires for a change already reported. */
  pendingToggle: MutableRefObject<boolean | null>;
}

/**
 * The open state of a `popover="auto"` panel that a trigger toggles: Popover, DropdownMenu, Select.
 *
 * A press on the trigger light-dismisses the open panel before the trigger's click asks to close
 * it. The browser's `toggle` event for that close comes a task later and says nothing new, so the
 * parent must not hear it twice: `request` notes it in `pendingToggle`, and `usePopover` skips the
 * toggle that matches. The open state is read through a ref, so `request` keeps its identity when
 * the panel opens and closes.
 */
export function usePopoverState<E extends HTMLElement>({
  open,
  defaultOpen,
  onOpenChange,
  name,
}: PopoverStateOptions): PopoverState<E> {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name,
  });
  const contentRef = useRef<E | null>(null);
  const pendingToggle = useRef<boolean | null>(null);
  const openNow = useRef(isOpen);
  openNow.current = isOpen;
  const request = useCallback(
    (next: boolean) => {
      const el = contentRef.current;
      const alreadyMade =
        el !== null && next !== openNow.current && el.matches(':popover-open') === next;
      pendingToggle.current = alreadyMade ? next : null;
      setOpen(next);
    },
    [setOpen],
  );
  return { open: isOpen, request, report: setOpen, contentRef, pendingToggle };
}

export interface TriggerPress {
  onPointerDown: () => void;
  onPointerCancel: () => void;
  onClick: (event: { detail: number } | undefined) => void;
}

/**
 * The handlers a trigger of a `popover="auto"` panel needs to toggle it on a click. A press on the
 * trigger light-dismisses the open panel before the click arrives, so the click goes by whether it
 * was open at the press. A press that never became a click (dragged off, right-clicked) leaves a
 * stale note, so a click from the keyboard or from code (`detail` 0) goes by the state now.
 * `toggle` receives the state to leave and whether a pointer press made the click.
 */
export function useTriggerPress(
  open: boolean,
  toggle: (wasOpen: boolean, fromPress: boolean) => void,
): TriggerPress {
  const openAtPress = useRef<boolean | null>(null);
  return {
    onPointerDown: () => {
      openAtPress.current = open;
    },
    onPointerCancel: () => {
      openAtPress.current = null;
    },
    onClick: (event) => {
      const fromPress = (event?.detail ?? 0) !== 0;
      const wasOpen = (fromPress ? openAtPress.current : null) ?? open;
      openAtPress.current = null;
      toggle(wasOpen, fromPress);
    },
  };
}
```

Run: `pnpm vitest run --project unit src/internal/use-popover-trigger.test.tsx`
Expected: 6 test PASS.

- [ ] **Step 4: Chuyển Popover và DropdownMenu sang hook**

```diff
diff --git a/src/components/dropdown-menu/DropdownMenu.tsx b/src/components/dropdown-menu/DropdownMenu.tsx
index 1a85257..ab39630 100644
--- a/src/components/dropdown-menu/DropdownMenu.tsx
+++ b/src/components/dropdown-menu/DropdownMenu.tsx
@@ -1,10 +1,10 @@
 'use client';
 
-import { createContext, forwardRef, useCallback, useContext, useId, useMemo, useRef } from 'react';
+import { createContext, forwardRef, useContext, useId, useMemo, useRef } from 'react';
 import type { HTMLAttributes, KeyboardEvent, MutableRefObject, ReactNode } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { mergeRefs } from '../../internal/merge-refs';
-import { useControllableState } from '../../internal/use-controllable-state';
+import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
 import type { Align, Side } from '../../internal/use-floating';
 import { devWarn } from '../../internal/warn';
 import { Button } from '../button/Button';
@@ -74,40 +74,25 @@ export function DropdownMenu({
   onOpenChange,
   children,
 }: DropdownMenuProps) {
-  const [isOpen, setOpen] = useControllableState({
-    value: open,
-    defaultValue: defaultOpen,
-    onChange: onOpenChange,
-    name: 'DropdownMenu',
-  });
+  // `request` keeps its identity when the menu opens and closes, and so does the tree context made
+  // from it: every item would otherwise re-render on each change.
+  const {
+    open: isOpen,
+    request,
+    report,
+    contentRef,
+    pendingToggle,
+  } = usePopoverState<HTMLDivElement>({ open, defaultOpen, onOpenChange, name: 'DropdownMenu' });
   const contentId = useId();
   const triggerId = useId();
   const triggerRef = useRef<HTMLButtonElement | null>(null);
-  const contentRef = useRef<HTMLDivElement | null>(null);
-  const pendingToggle = useRef<boolean | null>(null);
   const focusOnOpen = useRef<FocusOnOpen>('menu');
-  // Read through a ref, so that `request`, and the tree context made from it, keep their identity
-  // when the menu opens and closes: every item would otherwise re-render on each change.
-  const openNow = useRef(isOpen);
-  openNow.current = isOpen;
-  // A press on the trigger light-dismisses the menu before its click asks to close it; the browser's
-  // late `toggle` for that close must not reach the parent a second time (see Popover).
-  const request = useCallback(
-    (next: boolean) => {
-      const el = contentRef.current;
-      const alreadyMade =
-        el !== null && next !== openNow.current && el.matches(':popover-open') === next;
-      pendingToggle.current = alreadyMade ? next : null;
-      setOpen(next);
-    },
-    [setOpen],
-  );
   const tree = useMemo(() => ({ closeAll: () => request(false) }), [request]);
   const value = useMemo(
     () => ({
       open: isOpen,
       setOpen: request,
-      report: setOpen,
+      report,
       contentId,
       triggerId,
       triggerRef,
@@ -115,7 +100,7 @@ export function DropdownMenu({
       pendingToggle,
       focusOnOpen,
     }),
-    [isOpen, request, setOpen, contentId, triggerId],
+    [isOpen, request, report, contentId, triggerId, contentRef, pendingToggle],
   );
   return (
     <DropdownMenuContext.Provider value={value}>
@@ -134,7 +119,11 @@ export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTri
     ref,
   ) {
     const ctx = useDropdownMenu('DropdownMenuTrigger');
-    const openAtPress = useRef<boolean | null>(null);
+    // Like PopoverTrigger; a press opens it on the menu itself, a keyboard click on the first item.
+    const press = useTriggerPress(ctx.open, (wasOpen, fromPress) => {
+      ctx.focusOnOpen.current = fromPress ? 'menu' : 'first';
+      ctx.setOpen(!wasOpen);
+    });
     const triggerRef = ctx.triggerRef;
     const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
 
@@ -170,20 +159,9 @@ export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTri
           if (event.repeat) return;
           openOn(where);
         })}
-        onPointerDown={composeEventHandlers(onPointerDown, () => {
-          openAtPress.current = ctx.open;
-        })}
-        onPointerCancel={composeEventHandlers(onPointerCancel, () => {
-          openAtPress.current = null;
-        })}
-        onClick={composeEventHandlers(onClick, (event) => {
-          // Like PopoverTrigger: a press decides from the state at the press, anything else from now.
-          const fromPress = (event?.detail ?? 0) !== 0;
-          const wasOpen = (fromPress ? openAtPress.current : null) ?? ctx.open;
-          openAtPress.current = null;
-          ctx.focusOnOpen.current = fromPress ? 'menu' : 'first';
-          ctx.setOpen(!wasOpen);
-        })}
+        onPointerDown={composeEventHandlers(onPointerDown, press.onPointerDown)}
+        onPointerCancel={composeEventHandlers(onPointerCancel, press.onPointerCancel)}
+        onClick={composeEventHandlers(onClick, press.onClick)}
       />
     );
   },
diff --git a/src/components/popover/Popover.tsx b/src/components/popover/Popover.tsx
index 7e4f1cf..013a9ce 100644
--- a/src/components/popover/Popover.tsx
+++ b/src/components/popover/Popover.tsx
@@ -1,24 +1,15 @@
 'use client';
 
 import { clsx } from 'clsx';
-import {
-  createContext,
-  forwardRef,
-  useCallback,
-  useContext,
-  useEffect,
-  useId,
-  useMemo,
-  useRef,
-} from 'react';
+import { createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef } from 'react';
 import type { HTMLAttributes, MutableRefObject, ReactNode } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { focusFirst } from '../../internal/focus';
 import { mergeRefs } from '../../internal/merge-refs';
-import { useControllableState } from '../../internal/use-controllable-state';
 import { useFloating } from '../../internal/use-floating';
 import type { Align, Side } from '../../internal/use-floating';
 import { usePopover } from '../../internal/use-popover';
+import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
 import { devWarn } from '../../internal/warn';
 import { Button } from '../button/Button';
 import type { ButtonProps } from '../button/Button';
@@ -79,39 +70,26 @@ export interface PopoverContentProps extends Omit<HTMLAttributes<HTMLDivElement>
 
 /** A non-modal panel anchored to its trigger, on the native `popover="auto"`. Renders no element. */
 export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
-  const [isOpen, setOpen] = useControllableState({
-    value: open,
-    defaultValue: defaultOpen,
-    onChange: onOpenChange,
-    name: 'Popover',
-  });
+  const {
+    open: isOpen,
+    request,
+    report,
+    contentRef,
+    pendingToggle,
+  } = usePopoverState<HTMLDivElement>({ open, defaultOpen, onOpenChange, name: 'Popover' });
   const contentId = useId();
   const triggerRef = useRef<HTMLButtonElement | null>(null);
-  const contentRef = useRef<HTMLDivElement | null>(null);
-  const pendingToggle = useRef<boolean | null>(null);
-  // A press on the trigger light-dismisses the popover before its click asks to close it. The
-  // browser's `toggle` event for that close comes a task later and says nothing new, so the parent
-  // must not hear it twice: usePopover skips the toggle that matches.
-  const request = useCallback(
-    (next: boolean) => {
-      const el = contentRef.current;
-      const alreadyMade = el !== null && next !== isOpen && el.matches(':popover-open') === next;
-      pendingToggle.current = alreadyMade ? next : null;
-      setOpen(next);
-    },
-    [isOpen, setOpen],
-  );
   const value = useMemo(
     () => ({
       open: isOpen,
       setOpen: request,
-      report: setOpen,
+      report,
       contentId,
       triggerRef,
       contentRef,
       pendingToggle,
     }),
-    [isOpen, request, setOpen, contentId],
+    [isOpen, request, report, contentId, contentRef, pendingToggle],
   );
   return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
 }
@@ -120,9 +98,7 @@ export function Popover({ open, defaultOpen = false, onOpenChange, children }: P
 export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
   function PopoverTrigger({ onPointerDown, onPointerCancel, onClick, ...props }, ref) {
     const ctx = usePopoverContext('PopoverTrigger');
-    // A press on the trigger light-dismisses an open popover before the click arrives. Remember
-    // whether it was open at the press, so that click closes it instead of opening it again.
-    const openAtPress = useRef<boolean | null>(null);
+    const press = useTriggerPress(ctx.open, (wasOpen) => ctx.setOpen(!wasOpen));
     const triggerRef = ctx.triggerRef;
     const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref, triggerRef]);
     return (
@@ -132,20 +108,9 @@ export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>
         aria-expanded={ctx.open}
         aria-controls={ctx.open ? ctx.contentId : undefined}
         {...props}
-        onPointerDown={composeEventHandlers(onPointerDown, () => {
-          openAtPress.current = ctx.open;
-        })}
-        onPointerCancel={composeEventHandlers(onPointerCancel, () => {
-          openAtPress.current = null;
-        })}
-        onClick={composeEventHandlers(onClick, (event) => {
-          // A press that never became a click (dragged off, right-clicked) leaves a stale value, so
-          // a click from the keyboard or from code (`detail` 0) goes by the current state.
-          const fromPress = (event?.detail ?? 0) !== 0;
-          const wasOpen = (fromPress ? openAtPress.current : null) ?? ctx.open;
-          openAtPress.current = null;
-          ctx.setOpen(!wasOpen);
-        })}
+        onPointerDown={composeEventHandlers(onPointerDown, press.onPointerDown)}
+        onPointerCancel={composeEventHandlers(onPointerCancel, press.onPointerCancel)}
+        onClick={composeEventHandlers(onClick, press.onClick)}
       />
     );
   },
```

DropdownMenu dùng tham số `fromPress` để chọn chỗ đặt focus khi mở: cú nhấn chuột đặt focus vào panel (`'menu'`), còn phím đặt focus vào item đầu (`'first'`), đúng như trước.

- [ ] **Step 5: Cập nhật spec**

````diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index e09fbaf..0141a6e 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -166,7 +166,8 @@ Mỗi plan tự mang đủ phần của mình: stories, test các lớp ở §7,
 ```
 src/internal/        use-controllable-state.ts, use-floating.ts, use-popover.ts, focus.ts,
                      lock-scroll.ts, modal-stack.ts, use-iso-layout-effect.ts, react-lazy.ts,
-                     roving.ts, use-typeahead.ts, collect-children.ts
+                     roving.ts, use-typeahead.ts, collect-children.ts,
+                     use-popover-trigger.ts
 src/components/      dialog/, drawer/, popover/, tooltip/, menu/ (phần Menu* dùng chung),
                      dropdown-menu/, context-menu/, select/, tabs/, accordion/,
                      breadcrumb/, pagination/, toast/
@@ -419,6 +420,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | File | Export | Nhiệm vụ |
 |---|---|---|
 | `use-controllable-state.ts` | `useControllableState({ value, defaultValue, onChange })` | Trả `[value, setValue]`. Controlled khi `value !== undefined`. `setValue` gọi `onChange` khi giá trị đổi, và chỉ cập nhật state nội bộ khi uncontrolled. Cảnh báo dev khi một component đổi giữa controlled và uncontrolled |
+| `use-popover-trigger.ts` | `usePopoverState({ open, defaultOpen, onOpenChange, name })`, `useTriggerPress(open, toggle)` | Trạng thái mở của một `popover="auto"` có trigger, dùng chung cho Popover, DropdownMenu và Select (tách ở Plan C khi Select thành bản sao thứ ba). `usePopoverState` trả `{ open, request, report, contentRef, pendingToggle }`: `request` ghi `pendingToggle` khi trình duyệt đã tự đóng (light dismiss trước cú click của trigger), và giữ nguyên identity khi mở và đóng. `useTriggerPress` trả `onPointerDown`, `onPointerCancel`, `onClick`: cú click đi theo trạng thái lúc nhấn, click từ bàn phím (`detail` 0) đi theo trạng thái hiện tại |
 | `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `alignOffset` (lệch dọc theo cạnh, cho menu con) và `maxHeight` (middleware `size`, giới hạn thêm ngoài chỗ trống; menu truyền `Infinity`), Plan C thêm `matchWidth` | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
 | `use-popover.ts` | `usePopover(ref, { open, onOpenChange, restoreFocusTo, onShown, pendingToggle })` | Gọi `showPopover()`/`hidePopover()` theo `open`. Nghe `toggle` để gọi `onOpenChange` khi trình duyệt tự đóng. Khi trình duyệt tự đóng (Esc, light dismiss), focus được trả về `restoreFocusTo` ngay ở `beforetoggle`, lúc popover còn hiện: Safari không focus nút được bấm, nên trình duyệt có thể trả focus về phần tử bao quanh trigger (ví dụ panel của Dialog) mà `toggle` không còn kéo về được (sửa sau review cuối Plan B). Lần nhấn lên chính trigger để đóng nó thì focus quay về trigger, dù lần nhấn đã đưa focus đi đâu: Safari focus phần tử focus được gần nhất bao quanh nút, ví dụ panel của Dialog (phát hiện khi lập Plan C). Đăng ký `restoreFocusTo` của popover với `registerPopoverReturn` |
 | `focus.ts` | `getFocusables(root)`, `focusFirst(root)`, `isFocusable(el)`, `returnFocus(target, container, fallback)`, `registerPopoverReturn(popover, getTarget)` | Tìm các phần tử nhận focus được, theo thứ tự DOM, bỏ qua phần tử bị ẩn, `inert` hoặc `disabled`. `returnFocus` trả focus khi một overlay đóng. Nó focus đích trước; đích không nhận focus vì nằm trong một popover đã đóng thì đi tiếp tới chỗ popover đó trả focus về, theo bảng mà `registerPopoverReturn` ghi. `fallback` cũng đi như vậy |
````

- [ ] **Step 6: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/popover src/components/dropdown-menu
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 530 test PASS, 2 skip.
- Story: 150 test PASS (25 story × 3 trình duyệt × 2 theme), không sửa story nào.
- `check:package` PASS.

- [ ] **Step 7: Commit**

```bash
git add src/internal/use-popover-trigger.ts src/internal/use-popover-trigger.test.tsx src/components/popover/Popover.tsx src/components/dropdown-menu/DropdownMenu.tsx .size-limit.json docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
git commit -m "refactor: share the popover state and the trigger press between Popover and DropdownMenu" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: `matchWidth`, `onPlaced` và menu cao

`matchWidth` là option spec đã hẹn cho Select. `onPlaced` sửa lỗi menu cao mà Plan B để lại (phát hiện 4), và listbox ở Task 6 dùng lại nó.

**Files:**
- Modify: `src/internal/use-floating.ts`, `src/components/menu/MenuPanel.tsx`, `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`, `.size-limit.json`
- Test: `src/internal/use-floating.test.tsx`, `src/components/dropdown-menu/DropdownMenu.stories.tsx`

**Interfaces:**
- Consumes: không có gì mới.
- Produces (Task 6 dùng): `useFloating` nhận thêm:
  - `matchWidth?: boolean`: middleware `size` đặt `min-width` bằng chiều rộng của reference.
  - `onPlaced?: () => void`: gọi một lần mỗi lần mở, ngay sau lần đặt vị trí đầu (lúc `max-height` đã áp).

- [ ] **Step 1: Viết unit test (test fail)**

```diff
diff --git a/src/internal/use-floating.test.tsx b/src/internal/use-floating.test.tsx
index 1920a1f..b5c37d0 100644
--- a/src/internal/use-floating.test.tsx
+++ b/src/internal/use-floating.test.tsx
@@ -98,3 +98,58 @@ describe('useFloating', () => {
     expect(floating.dataset.side).toBe('stale');
   });
 });
+
+function Listbox({ open, onPlaced }: { open: boolean; onPlaced?: () => void }) {
+  const reference = useRef<HTMLButtonElement>(null);
+  const floating = useRef<HTMLDivElement>(null);
+  useFloating({
+    open,
+    reference: () => reference.current,
+    floating,
+    side: 'bottom',
+    align: 'start',
+    offset: 6,
+    maxHeight: 320,
+    matchWidth: true,
+    onPlaced,
+  });
+  return (
+    <>
+      <button ref={reference} type="button">
+        Trigger
+      </button>
+      <div ref={floating} data-testid="floating" />
+    </>
+  );
+}
+
+describe('useFloating sizing and onPlaced', () => {
+  it('makes the element at least as wide as the reference, and caps its height', async () => {
+    const view = render(<Listbox open={false} />);
+    view.getByRole('button').getBoundingClientRect = () =>
+      DOMRect.fromRect({ width: 240, height: 34 });
+    view.rerender(<Listbox open />);
+    await flush();
+    const floating = view.getByTestId('floating');
+    expect(floating.style.minWidth).toBe('240px');
+    expect(floating.style.maxHeight).not.toBe('');
+  });
+
+  it('calls onPlaced once per opening, after the first placement', async () => {
+    const onPlaced = vi.fn();
+    const view = render(<Listbox open={false} onPlaced={onPlaced} />);
+    view.rerender(<Listbox open onPlaced={onPlaced} />);
+    expect(onPlaced).not.toHaveBeenCalled();
+    await flush();
+    expect(onPlaced).toHaveBeenCalledOnce();
+    expect(view.getByTestId('floating').style.top).not.toBe('');
+    // A second placement while it stays open does not call it again.
+    window.dispatchEvent(new Event('resize'));
+    await flush();
+    expect(onPlaced).toHaveBeenCalledOnce();
+    view.rerender(<Listbox open={false} onPlaced={onPlaced} />);
+    view.rerender(<Listbox open onPlaced={onPlaced} />);
+    await flush();
+    expect(onPlaced).toHaveBeenCalledTimes(2);
+  });
+});
```

Run: `pnpm vitest run --project unit src/internal/use-floating.test.tsx`
Expected: 2 test FAIL; 3 test PASS. Hai lỗi:
- `expected '' to be '240px'`;
- `expected "vi.fn()" to be called once, but got 0 times`.

- [ ] **Step 2: Story menu cao (test fail)**

```diff
diff --git a/src/components/dropdown-menu/DropdownMenu.stories.tsx b/src/components/dropdown-menu/DropdownMenu.stories.tsx
index f6a8fa6..7a8a44a 100644
--- a/src/components/dropdown-menu/DropdownMenu.stories.tsx
+++ b/src/components/dropdown-menu/DropdownMenu.stories.tsx
@@ -849,3 +849,50 @@ export const Controlled: Story = {
     await expect(trigger).toHaveAttribute('aria-expanded', 'true');
   },
 };
+
+const MANY = Array.from({ length: 40 }, (_, index) => `Item ${index + 1}`);
+
+export const TallMenu: Story = {
+  tags: ['no-visual'],
+  parameters: {
+    a11y: {
+      config: {
+        rules: [
+          { id: 'region', enabled: false },
+          // A menu scrolls by moving focus with the arrow keys, through items that are not in the
+          // tab order (roving focus); axe only counts tab stops as keyboard access.
+          { id: 'scrollable-region-focusable', enabled: false },
+        ],
+      },
+    },
+  },
+  render: (args) => (
+    <div style={corner}>
+      <DropdownMenu {...args}>
+        <DropdownMenuTrigger variant="secondary">Many</DropdownMenuTrigger>
+        <DropdownMenuContent>
+          {MANY.map((name) => (
+            <MenuItem key={name}>{name}</MenuItem>
+          ))}
+        </DropdownMenuContent>
+      </DropdownMenu>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const trigger = canvas.getByRole('button', { name: 'Many' });
+    trigger.focus();
+    // ↑ opens it on the last item. The menu is capped at the room left below the trigger and
+    // scrolls; the last item is scrolled into view, not left below the fold.
+    await userEvent.keyboard('{ArrowUp}');
+    const menu = canvas.getByRole('menu', { name: 'Many' });
+    const last = canvas.getByRole('menuitem', { name: 'Item 40' });
+    await expect(last).toHaveFocus();
+    await waitFor(() => {
+      expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight);
+      const box = menu.getBoundingClientRect();
+      const item = last.getBoundingClientRect();
+      expect(item.top).toBeGreaterThanOrEqual(box.top - 1);
+      expect(item.bottom).toBeLessThanOrEqual(box.bottom + 1);
+    });
+  },
+};
```

Story tắt luật axe `scrollable-region-focusable`. Menu cuộn bằng cách chuyển focus giữa các item không nằm trong thứ tự Tab (roving focus), còn axe chỉ tính các điểm dừng của Tab là đường vào của bàn phím.

Run: `pnpm gen:theme && pnpm vitest run --project storybook-light src/components/dropdown-menu --browser.name=chromium -t "Tall Menu"`
Expected: 1 test FAIL: đáy của item cuối nằm dưới đáy menu (`expected 1275 to be less than or equal to 893`; con số tuỳ cỡ cửa sổ).

- [ ] **Step 3: Thêm hai option cho `useFloating`**

```diff
diff --git a/src/internal/use-floating.ts b/src/internal/use-floating.ts
index be4cdad..633c8ba 100644
--- a/src/internal/use-floating.ts
+++ b/src/internal/use-floating.ts
@@ -31,8 +31,15 @@ export interface UseFloatingOptions {
    * space left only. The element scrolls past it. Leave it out to let the element keep its height.
    */
   maxHeight?: number | undefined;
+  /** Makes the element at least as wide as the reference (a listbox under its trigger). */
+  matchWidth?: boolean | undefined;
   /** An element inside `floating` that points at the reference. */
   arrow?: RefObject<HTMLElement | null> | undefined;
+  /**
+   * Called once each time it opens, right after the first placement is written: its size is final
+   * then, so whatever must be scrolled into view inside it can be.
+   */
+  onPlaced?: (() => void) | undefined;
 }
 
 /** Margin kept between a floating element and the edge of the viewport, in px. */
@@ -78,15 +85,20 @@ export function useFloating({
   offset,
   alignOffset = 0,
   maxHeight,
+  matchWidth = false,
   arrow,
+  onPlaced,
 }: UseFloatingOptions): void {
   const getReference = useRef(reference);
   getReference.current = reference;
+  const latestOnPlaced = useRef(onPlaced);
+  latestOnPlaced.current = onPlaced;
 
   useIsoLayoutEffect(() => {
     if (!open) return;
     const placement = (align === 'center' ? side : `${side}-${align}`) as Placement;
     let active = true;
+    let placed = false;
     let stop: (() => void) | undefined;
     const start = () => {
       const ref = getReference.current();
@@ -101,14 +113,19 @@ export function useFloating({
             offsetMiddleware({ mainAxis: offset, alignmentAxis: alignOffset }),
             flip({ padding: VIEWPORT_PADDING }),
             shift({ padding: VIEWPORT_PADDING }),
-            ...(maxHeight === undefined
+            ...(maxHeight === undefined && !matchWidth
               ? []
               : [
                   size({
                     padding: VIEWPORT_PADDING,
-                    apply({ availableHeight, elements }) {
-                      const cap = Math.min(Math.max(availableHeight, 0), maxHeight);
-                      elements.floating.style.maxHeight = `${cap}px`;
+                    apply({ availableHeight, elements, rects }) {
+                      if (maxHeight !== undefined) {
+                        const cap = Math.min(Math.max(availableHeight, 0), maxHeight);
+                        elements.floating.style.maxHeight = `${cap}px`;
+                      }
+                      if (matchWidth) {
+                        elements.floating.style.minWidth = `${rects.reference.width}px`;
+                      }
                     },
                   }),
                 ]),
@@ -126,6 +143,10 @@ export function useFloating({
             arrowEl.style.left = ax === undefined ? '' : `${ax}px`;
             arrowEl.style.top = ay === undefined ? '' : `${ay}px`;
           }
+          if (!placed) {
+            placed = true;
+            latestOnPlaced.current?.();
+          }
         });
       };
       stop = autoUpdate(ref, el, update);
@@ -150,5 +171,5 @@ export function useFloating({
       active = false;
       stop?.();
     };
-  }, [open, floating, side, align, offset, alignOffset, maxHeight, arrow]);
+  }, [open, floating, side, align, offset, alignOffset, maxHeight, matchWidth, arrow]);
 }
```

- [ ] **Step 4: Panel menu cuộn item đang focus vào tầm nhìn**

```diff
diff --git a/src/components/menu/MenuPanel.tsx b/src/components/menu/MenuPanel.tsx
index a8e3e82..86df4a3 100644
--- a/src/components/menu/MenuPanel.tsx
+++ b/src/components/menu/MenuPanel.tsx
@@ -124,6 +124,20 @@ export const MenuPanel = forwardRef<HTMLDivElement, MenuPanelProps>(function Men
     offset,
     alignOffset,
     maxHeight: Number.POSITIVE_INFINITY,
+    // The item focused on opening was focused without scrolling, before the height was capped: a
+    // last item in a menu taller than the room left would otherwise stay out of sight.
+    onPlaced: () => {
+      const content = contentRef.current;
+      const active = document.activeElement;
+      if (
+        content &&
+        active instanceof HTMLElement &&
+        active !== content &&
+        content.contains(active)
+      ) {
+        active.scrollIntoView({ block: 'nearest' });
+      }
+    },
   });
 
   const getItems = useCallback(() => menuItems(contentRef.current), []);
```

Item được focus lúc mở với `preventScroll`, trước khi chiều cao bị giới hạn. Vì vậy panel phải cuộn sau lần đặt vị trí đầu, không phải lúc focus.

- [ ] **Step 5: Cập nhật spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 0141a6e..1e43f64 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -421,7 +421,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 |---|---|---|
 | `use-controllable-state.ts` | `useControllableState({ value, defaultValue, onChange })` | Trả `[value, setValue]`. Controlled khi `value !== undefined`. `setValue` gọi `onChange` khi giá trị đổi, và chỉ cập nhật state nội bộ khi uncontrolled. Cảnh báo dev khi một component đổi giữa controlled và uncontrolled |
 | `use-popover-trigger.ts` | `usePopoverState({ open, defaultOpen, onOpenChange, name })`, `useTriggerPress(open, toggle)` | Trạng thái mở của một `popover="auto"` có trigger, dùng chung cho Popover, DropdownMenu và Select (tách ở Plan C khi Select thành bản sao thứ ba). `usePopoverState` trả `{ open, request, report, contentRef, pendingToggle }`: `request` ghi `pendingToggle` khi trình duyệt đã tự đóng (light dismiss trước cú click của trigger), và giữ nguyên identity khi mở và đóng. `useTriggerPress` trả `onPointerDown`, `onPointerCancel`, `onClick`: cú click đi theo trạng thái lúc nhấn, click từ bàn phím (`detail` 0) đi theo trạng thái hiện tại |
-| `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `alignOffset` (lệch dọc theo cạnh, cho menu con) và `maxHeight` (middleware `size`, giới hạn thêm ngoài chỗ trống; menu truyền `Infinity`), Plan C thêm `matchWidth` | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
+| `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `alignOffset` (lệch dọc theo cạnh, cho menu con) và `maxHeight` (middleware `size`, giới hạn thêm ngoài chỗ trống; menu truyền `Infinity`), Plan C thêm `matchWidth` (rộng tối thiểu bằng reference) và `onPlaced` (gọi một lần mỗi lần mở, ngay sau lần đặt vị trí đầu: menu và listbox cuộn item đang focus hoặc được trỏ vào tầm nhìn, vì lúc mở chúng chưa bị giới hạn chiều cao) | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
 | `use-popover.ts` | `usePopover(ref, { open, onOpenChange, restoreFocusTo, onShown, pendingToggle })` | Gọi `showPopover()`/`hidePopover()` theo `open`. Nghe `toggle` để gọi `onOpenChange` khi trình duyệt tự đóng. Khi trình duyệt tự đóng (Esc, light dismiss), focus được trả về `restoreFocusTo` ngay ở `beforetoggle`, lúc popover còn hiện: Safari không focus nút được bấm, nên trình duyệt có thể trả focus về phần tử bao quanh trigger (ví dụ panel của Dialog) mà `toggle` không còn kéo về được (sửa sau review cuối Plan B). Lần nhấn lên chính trigger để đóng nó thì focus quay về trigger, dù lần nhấn đã đưa focus đi đâu: Safari focus phần tử focus được gần nhất bao quanh nút, ví dụ panel của Dialog (phát hiện khi lập Plan C). Đăng ký `restoreFocusTo` của popover với `registerPopoverReturn` |
 | `focus.ts` | `getFocusables(root)`, `focusFirst(root)`, `isFocusable(el)`, `returnFocus(target, container, fallback)`, `registerPopoverReturn(popover, getTarget)` | Tìm các phần tử nhận focus được, theo thứ tự DOM, bỏ qua phần tử bị ẩn, `inert` hoặc `disabled`. `returnFocus` trả focus khi một overlay đóng. Nó focus đích trước; đích không nhận focus vì nằm trong một popover đã đóng thì đi tiếp tới chỗ popover đó trả focus về, theo bảng mà `registerPopoverReturn` ghi. `fallback` cũng đi như vậy |
 | `lock-scroll.ts` | `lockScroll(): () => void` | Có đếm số lần khoá. Lần khoá đầu đặt `overflow: hidden` lên `<html>`, kèm `scrollbar-gutter: stable` nếu trang đang có thanh cuộn dọc (để bố cục không bị xô). Lần mở khoá cuối trả lại style cũ |
```

- [ ] **Step 6: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/dropdown-menu src/components/context-menu src/components/popover src/components/tooltip
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 534 test PASS, 2 skip.
- Story: 246 test PASS (41 story × 3 trình duyệt × 2 theme). Popover và Tooltip có mặt vì cũng dùng `useFloating`.
- `check:package` PASS.

- [ ] **Step 7: Commit**

```bash
git add src/internal/use-floating.ts src/internal/use-floating.test.tsx src/components/menu/MenuPanel.tsx src/components/dropdown-menu/DropdownMenu.stories.tsx .size-limit.json docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
git commit -m "feat(floating): match the reference width and scroll a tall menu to its focused item once placed" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: `reset` của `useControllableState` và `getCurrent` của `useTypeahead`

Hai primitive mà Select cần (phát hiện 7 và 8). Cả hai đều có mặc định giữ đúng hành vi cũ.

**Files:**
- Modify: `src/internal/use-controllable-state.ts`, `src/internal/use-typeahead.ts`, `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`, `.size-limit.json`
- Test: `src/internal/use-controllable-state.test.tsx`, `src/internal/use-typeahead.test.ts`

**Interfaces:**
- Consumes: không có gì mới.
- Produces (Task 6 dùng):
  - `useControllableState(…)` trả `[value, setValue, reset]`. `reset(next)` đặt giá trị uncontrolled mà không gọi `onChange`, và không làm gì khi controlled.
  - `useTypeahead(getItems, onMatch, getCurrent?: () => Element | null)`. Mặc định của `getCurrent` là `document.activeElement`.

- [ ] **Step 1: Viết test (test fail)**

```diff
diff --git a/src/internal/use-controllable-state.test.tsx b/src/internal/use-controllable-state.test.tsx
index e1c39ee..f87ca4a 100644
--- a/src/internal/use-controllable-state.test.tsx
+++ b/src/internal/use-controllable-state.test.tsx
@@ -32,6 +32,26 @@ describe('useControllableState', () => {
     expect(result.current[0]).toBe(true);
   });
 
+  it('resets an uncontrolled value without reporting it, and leaves a controlled one alone', () => {
+    const onChange = vi.fn();
+    const { result, rerender } = renderHook(
+      ({ value }) => useControllableState({ value, defaultValue: 'a', onChange, name: 'Test' }),
+      { initialProps: { value: undefined as string | undefined } },
+    );
+    act(() => result.current[1]('b'));
+    onChange.mockClear();
+    act(() => result.current[2]('a'));
+    expect(result.current[0]).toBe('a');
+    expect(onChange).not.toHaveBeenCalled();
+    const controlled = renderHook(() =>
+      useControllableState({ value: 'x', defaultValue: 'a', onChange, name: 'Other' }),
+    );
+    act(() => controlled.result.current[2]('a'));
+    expect(controlled.result.current[0]).toBe('x');
+    expect(onChange).not.toHaveBeenCalled();
+    rerender({ value: undefined });
+  });
+
   it('reports every request a controlled parent rejects', () => {
     const onChange = vi.fn();
     const { result } = renderHook(() =>
diff --git a/src/internal/use-typeahead.test.ts b/src/internal/use-typeahead.test.ts
index 3fdfed5..2297fde 100644
--- a/src/internal/use-typeahead.test.ts
+++ b/src/internal/use-typeahead.test.ts
@@ -78,6 +78,21 @@ describe('useTypeahead', () => {
     expect(onMatch).toHaveBeenLastCalledWith(items[0]);
   });
 
+  it('starts from the item getCurrent names, for a list that keeps focus elsewhere', () => {
+    const items = list('Daily', 'Weekly', 'Monthly', 'Wednesday');
+    const onMatch = vi.fn();
+    // A select-only combobox: focus stays on the trigger, the highlighted option is the current one.
+    const { result } = renderHook(() =>
+      useTypeahead(
+        () => items,
+        onMatch,
+        () => items[1] ?? null,
+      ),
+    );
+    result.current(key('w'));
+    expect(onMatch).toHaveBeenLastCalledWith(items[3]);
+  });
+
   it('skips disabled items and uses data-text-value when set', () => {
     const items = list('Delete', 'Duplicate', 'Download');
     items[0]?.setAttribute('aria-disabled', 'true');
```

Run: `pnpm vitest run --project unit src/internal/use-controllable-state.test.tsx src/internal/use-typeahead.test.ts`
Expected: 2 test FAIL; 13 test PASS. Hai lỗi:
- `TypeError: result.current[2] is not a function`;
- `expected last "vi.fn()" call to have been called with [ <div tabindex="-1"></div> ]`.

- [ ] **Step 2: Thêm `reset` và `getCurrent`**

```diff
diff --git a/src/internal/use-controllable-state.ts b/src/internal/use-controllable-state.ts
index bce1b07..95db95b 100644
--- a/src/internal/use-controllable-state.ts
+++ b/src/internal/use-controllable-state.ts
@@ -12,14 +12,15 @@ export interface ControllableStateOptions<T> {
 
 /**
  * State that a parent may own (`value`) or leave to the component (`defaultValue`). The setter calls
- * `onChange` whenever the value changes, and stores the value itself only when uncontrolled.
+ * `onChange` whenever the value changes, and stores the value itself only when uncontrolled. The third
+ * item, `reset`, sets an uncontrolled value without calling `onChange`.
  */
 export function useControllableState<T>({
   value,
   defaultValue,
   onChange,
   name,
-}: ControllableStateOptions<T>): [T, (next: T) => void] {
+}: ControllableStateOptions<T>): [T, (next: T) => void, (next: T) => void] {
   const [internal, setInternal] = useState(defaultValue);
   const controlled = value !== undefined;
   const wasControlled = useRef(controlled);
@@ -48,5 +49,13 @@ export function useControllableState<T>({
     notify?.(next);
   }, []);
 
-  return [current, setValue];
+  // Puts an uncontrolled value back without reporting it, as a form reset does for a native control
+  // (no change event). A controlled value is the parent's: left alone.
+  const reset = useCallback((next: T) => {
+    if (latest.current.controlled) return;
+    setInternal(next);
+    latest.current = { ...latest.current, current: next };
+  }, []);
+
+  return [current, setValue, reset];
 }
diff --git a/src/internal/use-typeahead.ts b/src/internal/use-typeahead.ts
index 075a7f2..a390f7b 100644
--- a/src/internal/use-typeahead.ts
+++ b/src/internal/use-typeahead.ts
@@ -27,6 +27,8 @@ export function findTypeaheadMatch(
   return -1;
 }
 
+const focusedElement = () => document.activeElement;
+
 /** The text a typed search matches: `data-text-value` when set, else the visible text. */
 export function itemText(el: HTMLElement): string {
   return (el.dataset.textValue ?? el.textContent ?? '').trim();
@@ -40,6 +42,9 @@ export function itemText(el: HTMLElement): string {
 export function useTypeahead(
   getItems: () => HTMLElement[],
   onMatch: (el: HTMLElement) => void,
+  /** The item a search starts from. Default: the focused element (a select-only combobox keeps
+   * focus on its trigger and passes the highlighted option). */
+  getCurrent: () => Element | null = focusedElement,
 ): (event: {
   key: string;
   ctrlKey: boolean;
@@ -62,12 +67,12 @@ export function useTypeahead(
         search.current = '';
       }, TYPEAHEAD_TIMEOUT);
       const items = getItems().filter((el) => !isDisabledItem(el));
-      const current = items.indexOf(document.activeElement as HTMLElement);
+      const current = items.indexOf(getCurrent() as HTMLElement);
       const match = findTypeaheadMatch(items.map(itemText), current, search.current);
       const el = match >= 0 ? items[match] : undefined;
       if (el) onMatch(el);
       return true;
     },
-    [getItems, onMatch],
+    [getItems, onMatch, getCurrent],
   );
 }
```

`getCurrent` mặc định là một hàm khai báo ở cấp module, nên identity của nó ổn định và không làm callback của typeahead đổi sau mỗi lần render.

- [ ] **Step 3: Cập nhật spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 1e43f64..ee78182 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -419,7 +419,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 
 | File | Export | Nhiệm vụ |
 |---|---|---|
-| `use-controllable-state.ts` | `useControllableState({ value, defaultValue, onChange })` | Trả `[value, setValue]`. Controlled khi `value !== undefined`. `setValue` gọi `onChange` khi giá trị đổi, và chỉ cập nhật state nội bộ khi uncontrolled. Cảnh báo dev khi một component đổi giữa controlled và uncontrolled |
+| `use-controllable-state.ts` | `useControllableState({ value, defaultValue, onChange })` | Trả `[value, setValue, reset]`. `reset` (thêm ở Plan C) đặt lại giá trị uncontrolled mà không gọi `onChange`, như reset form với control gốc (không có sự kiện `change`); giá trị controlled thì để nguyên. Controlled khi `value !== undefined`. `setValue` gọi `onChange` khi giá trị đổi, và chỉ cập nhật state nội bộ khi uncontrolled. Cảnh báo dev khi một component đổi giữa controlled và uncontrolled |
 | `use-popover-trigger.ts` | `usePopoverState({ open, defaultOpen, onOpenChange, name })`, `useTriggerPress(open, toggle)` | Trạng thái mở của một `popover="auto"` có trigger, dùng chung cho Popover, DropdownMenu và Select (tách ở Plan C khi Select thành bản sao thứ ba). `usePopoverState` trả `{ open, request, report, contentRef, pendingToggle }`: `request` ghi `pendingToggle` khi trình duyệt đã tự đóng (light dismiss trước cú click của trigger), và giữ nguyên identity khi mở và đóng. `useTriggerPress` trả `onPointerDown`, `onPointerCancel`, `onClick`: cú click đi theo trạng thái lúc nhấn, click từ bàn phím (`detail` 0) đi theo trạng thái hiện tại |
 | `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `alignOffset` (lệch dọc theo cạnh, cho menu con) và `maxHeight` (middleware `size`, giới hạn thêm ngoài chỗ trống; menu truyền `Infinity`), Plan C thêm `matchWidth` (rộng tối thiểu bằng reference) và `onPlaced` (gọi một lần mỗi lần mở, ngay sau lần đặt vị trí đầu: menu và listbox cuộn item đang focus hoặc được trỏ vào tầm nhìn, vì lúc mở chúng chưa bị giới hạn chiều cao) | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
 | `use-popover.ts` | `usePopover(ref, { open, onOpenChange, restoreFocusTo, onShown, pendingToggle })` | Gọi `showPopover()`/`hidePopover()` theo `open`. Nghe `toggle` để gọi `onOpenChange` khi trình duyệt tự đóng. Khi trình duyệt tự đóng (Esc, light dismiss), focus được trả về `restoreFocusTo` ngay ở `beforetoggle`, lúc popover còn hiện: Safari không focus nút được bấm, nên trình duyệt có thể trả focus về phần tử bao quanh trigger (ví dụ panel của Dialog) mà `toggle` không còn kéo về được (sửa sau review cuối Plan B). Lần nhấn lên chính trigger để đóng nó thì focus quay về trigger, dù lần nhấn đã đưa focus đi đâu: Safari focus phần tử focus được gần nhất bao quanh nút, ví dụ panel của Dialog (phát hiện khi lập Plan C). Đăng ký `restoreFocusTo` của popover với `registerPopoverReturn` |
@@ -427,7 +427,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | `lock-scroll.ts` | `lockScroll(): () => void` | Có đếm số lần khoá. Lần khoá đầu đặt `overflow: hidden` lên `<html>`, kèm `scrollbar-gutter: stable` nếu trang đang có thanh cuộn dọc (để bố cục không bị xô). Lần mở khoá cuối trả lại style cũ |
 | `modal-stack.ts` | `registerModal(el, host)`, `subscribeModals(fn)`, `getTopModal()` | Danh sách các `<dialog>` modal của lib đang mở, theo thứ tự. `host` là phần tử `.flg-toast-host` của dialog đó. Toaster dùng danh sách này (§6.3) |
 | `roving.ts` | `getNextIndex(items, current, key, { orientation, loop })`, `focusNext(event, items, options)`, `isDisabledItem(el)` | `getNextIndex` là hàm thuần: ra chỉ số kế tiếp cho các phím mũi tên, Home và End, bỏ qua item disabled. `focusNext` xử lý một `keydown`: tìm item kế tiếp, `preventDefault` rồi `.focus()` nó, trả `true` nếu đã xử lý. Menu dùng `focusNext` (mọi item có `tabIndex=-1`). Tabs (Plan D) tự giữ `tabIndex=0` ở tab đang chọn và dùng `getNextIndex`. Hook `useRovingFocus` hai chế độ của bản trao đổi bị bỏ khi lập Plan B: menu chỉ cần một hàm |
-| `use-typeahead.ts` | `useTypeahead(getItems, onMatch)` | Gom phím trong 500ms rồi so tiền tố, không phân biệt hoa thường. Gõ lặp một chữ thì nhảy vòng giữa các item cùng chữ đầu. Phím Space nằm giữa một chuỗi đang gõ được tính là ký tự |
+| `use-typeahead.ts` | `useTypeahead(getItems, onMatch, getCurrent?)` | `getCurrent` (thêm ở Plan C) là item mà lần gõ bắt đầu từ đó, mặc định là phần tử đang có focus; Select truyền option đang được trỏ, vì focus luôn ở trigger. Gom phím trong 500ms rồi so tiền tố, không phân biệt hoa thường. Gõ lặp một chữ thì nhảy vòng giữa các item cùng chữ đầu. Phím Space nằm giữa một chuỗi đang gõ được tính là ký tự |
 | `use-iso-layout-effect.ts` | `useIsoLayoutEffect` | `useLayoutEffect` trên trình duyệt, `useEffect` trên server (React 18 cảnh báo layout effect khi render ở server). Overlay cần layout effect để mở, đo và chuyển focus trước khi trình duyệt vẽ |
 | `react-lazy.ts` | `resolveLazy(value)` | Gỡ lazy reference của React. Server Component truyền client component xuống dưới dạng lazy reference; ở development nó còn truyền cả element con dưới dạng đó. `Slot` (giai đoạn 1) và `isFieldGroup`/`isFieldControl` dùng hàm này. Thiếu bước này, `asChild` trong Server Component in cảnh báo và lỗi hydrate ở Next dev (phát hiện khi lập Plan A) |
 | `collect-children.ts` | `collectChildren(children, parts)` | Duyệt tĩnh `children` qua Fragment, mảng và các phần nhóm đã khai báo. Nhận ra component qua marker và gỡ lớp lazy reference của RSC, giống `isFieldControl` ở giai đoạn 1. Dùng cho Select và Breadcrumb |
```

- [ ] **Step 4: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/dropdown-menu src/components/context-menu src/components/radio-group
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 537 test PASS, 2 skip.
- Story: 138 test PASS (23 story × 3 trình duyệt × 2 theme).
- `check:package` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/internal/use-controllable-state.ts src/internal/use-controllable-state.test.tsx src/internal/use-typeahead.ts src/internal/use-typeahead.test.ts .size-limit.json docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
git commit -m "feat(internal): reset an uncontrolled value without onChange, and start typeahead from a chosen item" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: `collectChildren` và Select

Task lớn nhất. `collectChildren` đi cùng Select vì nó chỉ ship được khi đã có người import (phát hiện 10).

**Files:**
- Create:
  - `src/internal/collect-children.ts`
  - `src/components/select/Select.tsx`, `src/components/select/index.ts`, `src/components/select/Select.mdx`
  - `src/styles/components/select.css`
- Modify: `src/styles/components/menu.css`, `src/styles/preferences.css`, `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `scripts/contrast-exceptions.ts`, `.size-limit.json`, hai spec
- Test: `src/internal/collect-children.test.tsx`, `src/components/select/Select.test.tsx`, `src/components/select/Select.test-d.ts`, `src/components/select/Select.stories.tsx`

**Interfaces:**
- Consumes:
  - Task 3: `usePopoverState`, `useTriggerPress`.
  - Task 4: `useFloating({ …, maxHeight, matchWidth, onPlaced })`.
  - Task 5: `reset` của `useControllableState`, `getCurrent` của `useTypeahead`.
  - Plan B: `getNextIndex`, `TYPEAHEAD_TIMEOUT`, các class `flg-menu*` và token `--flg-highlight-*`.
  - Plan A và giai đoạn 1: `usePopover`, `useFieldProps`, `markAsFieldControl`, `Badge`, `resolveLazy`, `mergeRefs`, `dataAttr`, `devWarn`, `useIsoLayoutEffect`.
- Produces:
  - `markPart<T>(component: T, part: string): T`, `partOf(node: ReactNode): string | undefined`.
  - `collectChildren(children: ReactNode, options: { parts: readonly string[]; groups?: readonly string[]; onUnknown?: (node: ReactNode) => void }): CollectedPart[]`, với `CollectedPart = { part: string; key: Key | null; props: Record<string, unknown>; parts?: CollectedPart[] }`. Plan D (Breadcrumb) dùng hàm này.
  - Export công khai: `Select`, `SelectItem`, `SelectGroup`, `SelectSeparator`, cùng các kiểu `SelectProps`, `SelectSingleProps`, `SelectMultipleProps`, `SelectItemProps`, `SelectGroupProps`, `SelectSeparatorProps`.

- [ ] **Step 1: Viết unit test và type test**

`src/internal/collect-children.test.tsx`:

```tsx
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { collectChildren, markPart, partOf } from './collect-children';

const Item = markPart(
  (() => null) as (props: { value: string; children?: ReactNode }) => null,
  'item',
);
const Group = markPart(
  (() => null) as (props: { label: string; children?: ReactNode }) => null,
  'group',
);
const Separator = markPart(() => null, 'separator');
const Other = markPart(() => null, 'other');
function Wrapper({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

const options = { parts: ['item', 'group', 'separator'], groups: ['group'] };

describe('collectChildren', () => {
  it('reads parts through Fragments, arrays and group parts, in order', () => {
    const result = collectChildren(
      <>
        <Item value="a">A</Item>
        {[<Item key="b" value="b" />, <Separator key="s" />]}
        <Group label="More">
          <>
            <Item value="c" />
          </>
        </Group>
      </>,
      options,
    );
    expect(result.map((part) => part.part)).toEqual(['item', 'item', 'separator', 'group']);
    expect(result[0]?.props.value).toBe('a');
    expect(result[0]?.props.children).toBe('A');
    expect(result[1]?.key).toBe('b');
    expect(result[3]?.parts?.map((part) => part.props.value)).toEqual(['c']);
  });

  it('reports anything else, and skips it', () => {
    const onUnknown = vi.fn();
    const result = collectChildren(
      <>
        <Item value="a" />
        <Wrapper>
          <Item value="hidden" />
        </Wrapper>
        <Other />
        text
        {'   '}
        {null}
        {false}
      </>,
      { ...options, onUnknown },
    );
    expect(result.map((part) => part.props.value)).toEqual(['a']);
    // The wrapper (a component of the user's own), the part not asked for, and the text.
    expect(onUnknown).toHaveBeenCalledTimes(3);
  });

  it('recognises a part handed over as a lazy reference', () => {
    // React Server Components pass client components to the client as lazy references.
    const resolved = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: Item,
      _init: (x: unknown) => x,
    };
    expect(partOf(<Item value="a" />)).toBe('item');
    expect(partOf(<Other />)).toBe('other');
    expect(partOf('text')).toBeUndefined();
    // The element's type is a lazy reference that resolves to the marked component.
    const element = { ...(<Item value="a" />), type: resolved } as unknown as ReactNode;
    expect(partOf(element)).toBe('item');
  });
});
```

`src/components/select/Select.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { Select, SelectGroup, SelectItem, SelectSeparator } from './Select';

// jsdom has no Popover API. This stand-in is enough for a Select to render.
const original = {
  showPopover: HTMLElement.prototype.showPopover,
  hidePopover: HTMLElement.prototype.hidePopover,
};
beforeAll(() => {
  HTMLElement.prototype.showPopover = () => {};
  HTMLElement.prototype.hidePopover = () => {};
});
afterAll(() => Object.assign(HTMLElement.prototype, original));

function Wrapper({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

describe('Select', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders the chosen option and every native option on the server', () => {
    const html = renderToString(
      <Select aria-label="Frequency" name="frequency" defaultValue="weekly">
        <SelectGroup label="Frequency">
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
        </SelectGroup>
      </Select>,
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('[role="combobox"]')?.textContent).toBe('Weekly');
    const native = doc.querySelector('select[name="frequency"]');
    expect(Array.from(native?.querySelectorAll('option') ?? [], (o) => o.value)).toEqual([
      '',
      'daily',
      'weekly',
    ]);
    expect(native?.querySelector('option[value="weekly"]')?.hasAttribute('selected')).toBe(true);
  });

  it('warns about children it cannot read, and skips them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Select aria-label="Sort">
        <SelectItem value="name">Name</SelectItem>
        <Wrapper>
          <SelectItem value="size">Size</SelectItem>
        </Wrapper>
      </Select>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/reads only SelectItem/));
    expect(screen.getAllByRole('option', { hidden: true }).map((o) => o.textContent)).toEqual([
      // The native <select>'s empty option, its "Name", and the listbox's "Name".
      '',
      'Name',
      'Name',
    ]);
  });

  it('warns about an empty value and about a value that matches no item', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Select aria-label="Sort" defaultValue="price">
        <SelectItem value="">Nothing</SelectItem>
        <SelectItem value="name">Name</SelectItem>
      </Select>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/needs a value that is not empty/));
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <Select> has a value that matches no SelectItem: "price".',
    );
  });

  it('warns when a part is rendered outside a Select', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <SelectItem value="a">A</SelectItem>
        <SelectGroup label="G" />
        <SelectSeparator />
      </>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <SelectItem> must be rendered inside a <Select>.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <SelectGroup> must be rendered inside a <Select>.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <SelectSeparator> must be rendered inside a <Select>.',
    );
  });

  it('takes its id, name and description from a Field, and gives the listbox the same name', () => {
    render(
      <Field label="Frequency" description="How often.">
        <Select>
          <SelectItem value="daily">Daily</SelectItem>
        </Select>
      </Field>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Frequency' });
    expect(trigger).toHaveAccessibleDescription('How often.');
    // The listbox is named by the same label (its accessible name is checked in the browser stories).
    const labelledBy = trigger.getAttribute('aria-labelledby');
    expect(labelledBy).toBe(screen.getByText('Frequency').id);
    expect(document.querySelector('.flg-select-listbox')).toHaveAttribute(
      'aria-labelledby',
      labelledBy,
    );
  });

  it('puts className and style on the element around the trigger, and the ref on the trigger', () => {
    let trigger: HTMLButtonElement | null = null;
    render(
      <Select
        aria-label="Sort"
        className="custom"
        style={{ width: 200 }}
        ref={(el) => {
          trigger = el;
        }}
      >
        <SelectItem value="name">Name</SelectItem>
      </Select>,
    );
    const combobox = screen.getByRole('combobox', { name: 'Sort' });
    expect(trigger).toBe(combobox);
    expect(combobox.parentElement).toHaveClass('flg-select', 'custom');
    expect(combobox.parentElement).toHaveStyle({ width: '200px' });
  });
});
```

`src/components/select/Select.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { SelectMultipleProps, SelectProps, SelectSingleProps } from './Select';

test('a multiple Select takes only string arrays; a single one only a string or null', () => {
  expectTypeOf<SelectMultipleProps['value']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<SelectMultipleProps['onValueChange']>().toEqualTypeOf<
    ((value: string[]) => void) | undefined
  >();
  expectTypeOf<SelectSingleProps['value']>().toEqualTypeOf<string | null | undefined>();
  // @ts-expect-error a multiple Select's value is an array
  const multipleWithString: SelectProps = { multiple: true, value: 'a', children: null };
  // @ts-expect-error a single Select's value is not an array
  const singleWithArray: SelectProps = { value: ['a'], children: null };
  expectTypeOf(multipleWithString).toBeObject();
  expectTypeOf(singleWithArray).toBeObject();
});
```

Unit test chạy trong jsdom, nên chỉ kiểm tra những gì không cần trình duyệt: HTML từ server, cảnh báo dev, tên lấy từ Field (kiểm tra theo cấu trúc, vì jsdom không tính tên của listbox), và chỗ gắn `className`, `style`, `ref`. Hành vi còn lại nằm ở story.

- [ ] **Step 2: Viết story**

`src/components/select/Select.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '../dialog/Dialog';
import { Field } from '../field/Field';
import { Select, SelectGroup, SelectItem, SelectSeparator } from './Select';

const meta = {
  title: 'Components/Select',
  component: Select,
  args: { children: null, onValueChange: fn(), onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { placeSelf: 'start', display: 'grid', gap: 12, width: 220 } as const;

// The list from the approved mockup (menus A): a labelled group, a disabled option.
const frequency = (
  <SelectGroup label="Frequency">
    <SelectItem value="daily">Daily</SelectItem>
    <SelectItem value="weekly">Weekly</SelectItem>
    <SelectItem value="monthly">Monthly</SelectItem>
    <SelectItem value="hourly" disabled>
      Hourly (Pro)
    </SelectItem>
  </SelectGroup>
);

// The list from the approved multi-select mockup (M1).
const departments = (
  <>
    <SelectItem value="design">Design</SelectItem>
    <SelectItem value="marketing">Marketing</SelectItem>
    <SelectItem value="engineering">Engineering</SelectItem>
    <SelectItem value="finance">Finance</SelectItem>
    <SelectItem value="people">People</SelectItem>
  </>
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The Select's listbox; the hidden native <select> has a listbox role of its own. */
const listboxIn = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-select-listbox')!;

export const Default: Story = {
  tags: ['no-visual'],
  render: (args) => (
    // "After" sits beside the Select: the open listbox covers what lies under it.
    <div style={{ placeSelf: 'start', display: 'flex', gap: 16, alignItems: 'end' }}>
      <div style={column}>
        <Field label="Frequency">
          <Select
            name="frequency"
            placeholder="Choose…"
            onValueChange={args.onValueChange as (value: string) => void}
            onOpenChange={args.onOpenChange}
          >
            {frequency}
          </Select>
        </Field>
      </div>
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    const listbox = listboxIn(canvasElement);
    const options = within(listbox);
    const isOpen = () => listbox.matches(':popover-open');
    const highlighted = () => listbox.querySelector('[data-highlighted]')?.textContent;
    await expect(trigger).toHaveTextContent('Choose…');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // ↓ opens it on the first option; focus stays on the trigger, which names the highlight.
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(isOpen()).toBe(true);
    await expect(trigger).toHaveFocus();
    await expect(highlighted()).toBe('Daily');
    await expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      options.getByRole('option', { name: 'Daily' }).id,
    );
    // Arrows move it and skip the disabled option; they stop at the ends.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    await expect(highlighted()).toBe('Monthly');
    await userEvent.keyboard('{Home}');
    await expect(highlighted()).toBe('Daily');
    // Typing moves it too.
    await userEvent.keyboard('m');
    await expect(highlighted()).toBe('Monthly');
    // Enter chooses it and closes.
    await userEvent.keyboard('{Enter}');
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Monthly');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('monthly');
    await expect(options.getByRole('option', { name: 'Monthly', hidden: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Closed, typing changes the value at once without opening.
    await delay(600);
    await userEvent.keyboard('w');
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Weekly');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('weekly');

    // ↑ opens it on the chosen option.
    await userEvent.keyboard('{ArrowUp}');
    await expect(highlighted()).toBe('Weekly');
    // Tab takes the highlighted option, like Enter, and focus moves on.
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.tab();
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Daily');
    await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();

    // The pointer: a click opens it on the chosen option, a click on an option chooses it.
    await userEvent.click(trigger);
    await expect(isOpen()).toBe(true);
    await expect(highlighted()).toBe('Daily');
    await userEvent.click(options.getByRole('option', { name: 'Weekly' }));
    await expect(isOpen()).toBe(false);
    await expect(trigger).toHaveTextContent('Weekly');
    await expect(trigger).toHaveFocus();
    // A disabled option cannot be chosen.
    await userEvent.click(trigger);
    await userEvent.click(options.getByRole('option', { name: 'Hourly (Pro)' }));
    await expect(isOpen()).toBe(true);
    await expect(trigger).toHaveTextContent('Weekly');

    const real = await realUserEvent();
    if (!real) return;
    // Esc closes it without changing the value.
    await real.keyboard('{ArrowDown}');
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Weekly');
    await expect(trigger).toHaveFocus();
    // A click on the open trigger closes it, once.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    args.onOpenChange?.mockClear();
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(isOpen()).toBe(false);
    await expect(args.onOpenChange).toHaveBeenCalledOnce();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(trigger).toHaveFocus();
    // Opened by a real click, it takes the keyboard: Safari does not focus a clicked button.
    trigger.blur();
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await expect(trigger).toHaveFocus();
    await real.keyboard('{ArrowDown}');
    await expect(highlighted()).toBe('Monthly');
    await real.keyboard('{Enter}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Monthly');
    // A click outside closes it without changing the value.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(canvas.getByRole('button', { name: 'After' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Monthly');
  },
};

export const Open: Story = {
  render: () => (
    <div style={column}>
      <Field label="Frequency">
        <Select defaultValue="weekly" defaultOpen>
          {frequency}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    const listbox = canvas.getByRole('listbox', { name: 'Frequency' });
    await settled(listbox);
    // Under the trigger, 6px away, at least as wide.
    const t = trigger.getBoundingClientRect();
    const l = listbox.getBoundingClientRect();
    await expect(Math.round(l.top - t.bottom)).toBe(6);
    await expect(Math.round(l.left)).toBe(Math.round(t.left));
    await expect(l.width).toBeGreaterThanOrEqual(t.width - 0.5);
    await expect(within(listbox).getByRole('group', { name: 'Frequency' })).toBeInTheDocument();
  },
};

export const Multiple: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={column}>
      <Field label="Departments">
        <Select
          multiple
          name="departments"
          placeholder="None"
          onValueChange={args.onValueChange as (value: string[]) => void}
        >
          {departments}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement, args }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Departments' });
    const listbox = listboxIn(canvasElement);
    const isOpen = () => listbox.matches(':popover-open');
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    // Enter and Space toggle the highlighted option; the listbox stays open.
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{ArrowDown} ');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(isOpen()).toBe(true);
    await expect(args.onValueChange).toHaveBeenLastCalledWith([
      'design',
      'marketing',
      'engineering',
    ]);
    await userEvent.keyboard('{ArrowUp} ');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['design', 'engineering']);
    // A click toggles too, and keeps it open.
    await userEvent.click(within(listbox).getByRole('option', { name: 'Marketing' }));
    await expect(isOpen()).toBe(true);
    await expect(args.onValueChange).toHaveBeenLastCalledWith([
      'design',
      'marketing',
      'engineering',
    ]);
    // Tab closes it.
    await userEvent.tab();
    await expect(isOpen()).toBe(false);
    // The chips are for the eye; the trigger also carries the full list as text.
    await expect(trigger).toHaveTextContent('Design, Marketing, Engineering');
    const chips = trigger.querySelector('.flg-select-chips');
    await expect(chips).toHaveAttribute('aria-hidden', 'true');
  },
};

export const MultipleOpen: Story = {
  render: () => (
    <div style={column}>
      <Field label="Departments">
        <Select multiple defaultValue={['design', 'marketing', 'engineering']} defaultOpen>
          {departments}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Departments' });
    // Three chosen, two chips fit: the third goes into "+1".
    const plus = () =>
      trigger.querySelector('.flg-select-chips > .flg-badge[data-variant="accent"]');
    await waitFor(() => expect(plus()).toHaveTextContent('+1'));
  },
};

export const Separators: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Select aria-label="Sort" defaultValue="name">
        <SelectItem value="name">Name</SelectItem>
        <SelectItem value="date">Date modified</SelectItem>
        <SelectSeparator />
        <SelectItem value="size">Size</SelectItem>
      </Select>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Sort' });
    await userEvent.click(trigger);
    const listbox = canvas.getByRole('listbox', { name: 'Sort' });
    await expect(within(listbox).getAllByRole('option')).toHaveLength(3);
  },
};

const teams = (
  <>
    <SelectItem value="design">Design</SelectItem>
    <SelectItem value="sales">Sales</SelectItem>
    <SelectItem value="support">Support</SelectItem>
  </>
);

function ProfileForm() {
  const [team, setTeam] = useState<string | null>('design');
  return (
    <form aria-label="Profile" style={column} onSubmit={(event) => event.preventDefault()}>
      <Field label="Frequency" required>
        <Select name="frequency" placeholder="Choose…">
          {frequency}
        </Select>
      </Field>
      <Field label="Departments">
        <Select multiple name="departments" defaultValue={['design']}>
          {departments}
        </Select>
      </Field>
      <Field label="Team">
        <Select name="team" value={team} onValueChange={setTeam}>
          {teams}
        </Select>
      </Field>
    </form>
  );
}

export const InAForm: Story = {
  tags: ['no-visual'],
  render: () => <ProfileForm />,
  play: async ({ canvas, canvasElement }) => {
    const form = canvasElement.querySelector('form')!;
    const frequency = canvas.getByRole('combobox', { name: 'Frequency' });
    const departmentsTrigger = canvas.getByRole('combobox', { name: 'Departments' });
    const team = canvas.getByRole('combobox', { name: 'Team' });
    await expect(frequency).toHaveAttribute('aria-required', 'true');

    // Required and empty: the submit is stopped, and focus lands on the trigger, not on the hidden
    // native <select> the browser focused to show its message.
    form.requestSubmit();
    await waitFor(() => expect(frequency).toHaveFocus());

    // The values are in FormData, through the hidden native <select>s.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await expect(frequency).toHaveTextContent('Weekly');
    let data = new FormData(form);
    await expect(data.get('frequency')).toBe('weekly');
    await expect(data.getAll('departments')).toEqual(['design']);
    await expect(data.get('team')).toBe('design');

    // Change all three, then reset the form: the uncontrolled ones go back to their defaults, the
    // controlled one keeps its value, as a controlled React input does.
    departmentsTrigger.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown} {Escape}');
    team.focus();
    await userEvent.keyboard('s');
    await expect(team).toHaveTextContent('Sales');
    data = new FormData(form);
    await expect(data.getAll('departments')).toEqual(['design', 'marketing']);
    form.reset();
    await waitFor(() => expect(frequency).toHaveTextContent('Choose…'));
    await expect(departmentsTrigger).toHaveTextContent(/^Design/);
    await expect(team).toHaveTextContent('Sales');
    await waitFor(() => {
      data = new FormData(form);
      expect(data.get('frequency')).toBe('');
      expect(data.getAll('departments')).toEqual(['design']);
      expect(data.get('team')).toBe('sales');
    });

    // Autofill: the browser sets the native <select> and fires `change`; the Select follows.
    const native = form.querySelector<HTMLSelectElement>('select[name="frequency"]')!;
    native.value = 'daily';
    native.dispatchEvent(new Event('change', { bubbles: true }));
    await expect(frequency).toHaveTextContent('Daily');
  },
};

function ControlledSelect({ onValueChange }: { onValueChange: (value: string) => void }) {
  const [value, setValue] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  return (
    <div style={column}>
      <Field label="Frequency">
        <Select
          value={value}
          placeholder="Choose…"
          onValueChange={(next) => {
            onValueChange(next);
            if (!locked) setValue(next);
          }}
        >
          {frequency}
        </Select>
      </Field>
      <label>
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />{' '}
        Locked
      </label>
      <button type="button" onClick={() => setValue('monthly')}>
        Set monthly
      </button>
      <button type="button" onClick={() => setValue(null)}>
        Clear
      </button>
    </div>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <ControlledSelect onValueChange={args.onValueChange as (value: string) => void} />
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await userEvent.click(canvas.getByRole('button', { name: 'Set monthly' }));
    await expect(trigger).toHaveTextContent('Monthly');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(trigger).toHaveTextContent('Choose…');
    // A parent that refuses the change keeps the value; the request was still reported.
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Locked' }));
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('daily');
    await expect(trigger).toHaveTextContent('Choose…');
  },
};

export const InADialog: Story = {
  tags: ['no-visual'],
  render: () => (
    <Dialog>
      <DialogTrigger variant="secondary">Edit schedule</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Edit schedule</DialogTitle>
        <Field label="Frequency">
          <Select defaultValue="weekly">{frequency}</Select>
        </Field>
        <DialogFooter>
          <DialogClose>Save</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(canvas.getByRole('button', { name: 'Edit schedule' }));
    const dialog = canvasElement.querySelector('dialog')!;
    await expect(dialog.open).toBe(true);
    const trigger = within(dialog).getByRole('combobox', { name: 'Frequency' });
    const listbox = listboxIn(dialog);
    const isOpen = () => listbox.matches(':popover-open');
    // Esc closes only the listbox, the topmost layer.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveFocus();
    await delay(50);
    await expect(dialog.open).toBe(true);
    // A press on the open trigger closes it, and focus stays on the trigger (WebKit moves it to the
    // dialog's panel on the press).
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveFocus();
    // A click on the frame, outside the panel, closes only the listbox.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(isOpen()).toBe(false));
    await delay(50);
    await expect(dialog.open).toBe(true);
    // Choosing an option closes the listbox and keeps the dialog.
    await real.click(trigger);
    await waitFor(() => expect(isOpen()).toBe(true));
    await real.click(within(listbox).getByRole('option', { name: 'Monthly' }));
    await waitFor(() => expect(isOpen()).toBe(false));
    await expect(trigger).toHaveTextContent('Monthly');
    await expect(trigger).toHaveFocus();
    await expect(dialog.open).toBe(true);
  },
};

const MANY = Array.from({ length: 60 }, (_, index) => `Option ${index + 1}`);

export const LongList: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Field label="Option">
        <Select defaultValue="Option 55">
          {MANY.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Option' });
    const listbox = listboxIn(canvasElement);
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const chosen = within(listbox).getByRole('option', { name: 'Option 55' });
    // At most 320px tall; it opens scrolled to the chosen option.
    await waitFor(() => {
      const box = listbox.getBoundingClientRect();
      const item = chosen.getBoundingClientRect();
      expect(box.height).toBeLessThanOrEqual(320);
      expect(item.top).toBeGreaterThanOrEqual(box.top - 1);
      expect(item.bottom).toBeLessThanOrEqual(box.bottom + 1);
    });
    // Moving the highlight keeps it in view.
    await userEvent.keyboard('{End}');
    const last = within(listbox).getByRole('option', { name: 'Option 60' });
    await waitFor(() => {
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        listbox.getBoundingClientRect().bottom + 1,
      );
    });
  },
};

export const InAField: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={column}>
      <Field
        label="Frequency"
        description="How often we send the digest."
        error="Pick one."
        required
      >
        <Select placeholder="Choose…">{frequency}</Select>
      </Field>
      <Field label="Plan" disabled>
        <Select defaultValue="weekly">{frequency}</Select>
      </Field>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Frequency' });
    await expect(trigger).toHaveAccessibleDescription('How often we send the digest. Pick one.');
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAttribute('aria-required', 'true');
    await expect(trigger.closest('.flg-select')).toHaveAttribute('data-invalid');
    // A click on the label is a click on the trigger: it opens the listbox.
    await userEvent.click(canvas.getByText('Frequency', { selector: 'label' }));
    const listbox = listboxIn(canvasElement);
    await expect(listbox.matches(':popover-open')).toBe(true);
    await userEvent.keyboard('{Escape}');
    // Disabled: it does not open.
    const plan = canvas.getByRole('combobox', { name: 'Plan' });
    await expect(plan).toBeDisabled();
  },
};
```

Story tìm listbox qua class (`listboxIn`) rồi query bên trong nó. Lý do: query `hidden: true` bắt cả `<option>` của `<select>` gốc, và `<select multiple>` cũng có role `listbox`.

| Story | Kiểm tra |
|---|---|
| `Default` | ↓ mở trên option đầu, focus ở trigger, `aria-activedescendant` trỏ đúng; mũi tên bỏ qua option disabled và dừng ở hai đầu; typeahead; Enter chọn và đóng; khi đóng, gõ chữ đổi giá trị ngay; ↑ mở trên option đã chọn; Tab lấy option được trỏ và focus đi tiếp; bấm chuột mở và chọn; option disabled không chọn được; Esc; bấm trigger đang mở thì đóng, một lần; mở bằng cú bấm thật rồi dùng phím (Review Focus 2); bấm ra ngoài |
| `Open` (có ảnh) | Listbox ở dưới trigger 6px, rộng ít nhất bằng trigger, cùng tên với trigger; nhóm có tên |
| `Multiple` | Enter và Space bật/tắt, listbox vẫn mở; bấm chuột bật/tắt; Tab đóng; trigger mang đủ danh sách dạng chữ |
| `MultipleOpen` (có ảnh) | Ba lựa chọn trong cột 220px: hai thẻ và "+1" (Review Focus 4) |
| `Separators` | Đường phân cách không phải option |
| `InAForm` | `required` chặn submit, focus về trigger; FormData; reset form (Review Focus 1); autofill |
| `Controlled` | Giá trị từ cha; `null` xoá lựa chọn; cha từ chối thì giá trị giữ nguyên, nhưng yêu cầu vẫn được báo |
| `InADialog` | Esc chỉ đóng listbox; bấm lại trigger thì đóng và focus ở trigger (Review Focus 3); bấm vào khung ngoài panel chỉ đóng listbox; chọn option thì đóng listbox, Dialog vẫn mở |
| `LongList` | Cao tối đa 320px, mở ra đã cuộn tới option đã chọn; di chuyển thì option được trỏ vẫn trong tầm nhìn |
| `InAField` | Bấm nhãn mở listbox; Select disabled không mở |

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/collect-children.test.tsx src/components/select/Select.test.tsx`
Expected: cả hai file FAIL với `Failed to resolve import "./collect-children"` và `Failed to resolve import "./Select"`.

- [ ] **Step 4: Viết `collectChildren`**

`src/internal/collect-children.ts`:

```ts
import { Children, Fragment, isValidElement } from 'react';
import type { Key, ReactNode } from 'react';
import { resolveLazy } from './react-lazy';

const PART = Symbol.for('fl-glass-ui.part');

/**
 * Marks a component as a part that `collectChildren` recognises, for example `"select-item"`. A
 * marker rather than the component's identity, so a part still counts after React Server Components
 * hand it over as a lazy reference, as `markAsFieldControl` does.
 */
export function markPart<T extends object>(component: T, part: string): T {
  Object.defineProperty(component, PART, { value: part });
  return component;
}

/** The part a node is, or `undefined` for anything that is not a marked component's element. */
export function partOf(node: ReactNode): string | undefined {
  const element = resolveLazy(node);
  if (!isValidElement(element)) return undefined;
  const type = resolveLazy(element.type) as unknown;
  if ((typeof type !== 'function' && typeof type !== 'object') || type === null) return undefined;
  const part = (type as { [PART]?: unknown })[PART];
  return typeof part === 'string' ? part : undefined;
}

export interface CollectedPart {
  part: string;
  key: Key | null;
  props: Record<string, unknown> & { children?: ReactNode };
  /** The parts inside a group part. */
  parts?: CollectedPart[];
}

export interface CollectOptions {
  /** The parts to keep. */
  parts: readonly string[];
  /** Parts whose children are collected too, such as `"select-group"`. */
  groups?: readonly string[];
  /** Called for each child that is not one of `parts` (and not text that is only whitespace). */
  onUnknown?: (node: ReactNode) => void;
}

/**
 * Reads the parts out of `children` without rendering them: through Fragments, arrays and the group
 * parts, so the result is known on the server's first render. A component of the user's own that
 * wraps a part is not looked into; it goes to `onUnknown`.
 */
export function collectChildren(children: ReactNode, options: CollectOptions): CollectedPart[] {
  const { parts, groups = [], onUnknown } = options;
  const collected: CollectedPart[] = [];
  Children.forEach(children, (raw) => {
    const node = resolveLazy(raw);
    if (node === null || node === undefined || typeof node === 'boolean') return;
    if (typeof node === 'string' && node.trim() === '') return;
    if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
      collected.push(...collectChildren(node.props.children, options));
      return;
    }
    const part = partOf(node);
    if (part === undefined || !parts.includes(part) || !isValidElement(node)) {
      onUnknown?.(node);
      return;
    }
    const props = node.props as CollectedPart['props'];
    collected.push({
      part,
      key: node.key,
      props,
      ...(groups.includes(part) ? { parts: collectChildren(props.children, options) } : {}),
    });
  });
  return collected;
}
```

Run: `pnpm vitest run --project unit src/internal/collect-children.test.tsx`
Expected: 3 test PASS.

- [ ] **Step 5: Viết Select**

`src/components/select/Select.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChangeEvent, CSSProperties, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { collectChildren, markPart } from '../../internal/collect-children';
import type { CollectedPart } from '../../internal/collect-children';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
import { mergeRefs } from '../../internal/merge-refs';
import { getNextIndex } from '../../internal/roving';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { usePopover } from '../../internal/use-popover';
import { usePopoverState, useTriggerPress } from '../../internal/use-popover-trigger';
import { useTypeahead } from '../../internal/use-typeahead';
import { devWarn } from '../../internal/warn';
import { Badge } from '../badge/Badge';

interface SelectBaseProps {
  /** The name the value is submitted under, through a hidden native `<select>`. */
  name?: string;
  /** Shown, muted, while nothing is chosen. */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Passed to the hidden native `<select>`, so the browser can autofill it. */
  autoComplete?: string;
  /** The trigger's id. */
  id?: string;
  /** On the element around the trigger. */
  className?: string;
  /** On the element around the trigger. */
  style?: CSSProperties;
  /** `SelectItem`, `SelectGroup` and `SelectSeparator`, read without rendering them. */
  children: ReactNode;
  /** Whether the listbox is open. Pass it with `onOpenChange` to control it. */
  open?: boolean;
  /** Whether the listbox starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the listbox opens or closes. */
  onOpenChange?: (open: boolean) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface SelectSingleProps extends SelectBaseProps {
  multiple?: false;
  /** The chosen value; `null` chooses nothing. Pass it with `onValueChange` to control it. */
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export interface SelectMultipleProps extends SelectBaseProps {
  multiple: true;
  /** The chosen values. Pass it with `onValueChange` to control it. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type SelectProps = SelectSingleProps | SelectMultipleProps;

export interface SelectItemProps {
  /** Not empty: an empty value is how the native `<select>` says nothing is chosen. */
  value: string;
  disabled?: boolean;
  /** The text typeahead matches and a chip of a multiple Select shows. Default: the item's text. */
  textValue?: string;
  children?: ReactNode;
}

export interface SelectGroupProps {
  /** Names the group. */
  label: ReactNode;
  children?: ReactNode;
}

/** Takes no props. */
export type SelectSeparatorProps = Record<string, never>;

const PARTS = ['select-item', 'select-group', 'select-separator'] as const;

const UNKNOWN_CHILD =
  '<Select> reads only SelectItem, SelectGroup and SelectSeparator, directly or inside Fragments, ' +
  'arrays and SelectGroup. It skips anything else, including a component of your own that wraps ' +
  'a SelectItem.';
const EMPTY_VALUE =
  '<SelectItem> needs a value that is not empty: the empty value is how the native select says ' +
  'nothing is chosen. The item is skipped.';
const OUTSIDE = (part: string) => `<${part}> must be rendered inside a <Select>.`;

/** One option of the Select, in the order the listbox shows it. */
interface Option {
  index: number;
  value: string;
  disabled: boolean;
  /** For typeahead, the native `<option>` and a chip. */
  text: string;
  children: ReactNode;
}

type Row =
  | { kind: 'option'; option: Option }
  | { kind: 'group'; key: string; label: ReactNode; rows: Row[] }
  | { kind: 'separator'; key: string };

/** The text inside `node`, as a screen reader would read it. */
function textOf(node: ReactNode): string {
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
    const key = `${path}${part.key ?? position}`;
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

const CHEVRON = (
  <svg
    className="flg-select-chevron"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const CHECK = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const BOX_CHECK = (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M2.5 6.2 5 8.5l4.5-5" />
  </svg>
);

/** Gap between chips, in px; matches `.flg-select-chips`. */
const CHIP_GAP = 4;

/**
 * The chosen values of a multiple Select as chips, as many as fit, and the rest as one "+N" chip.
 * A hidden ruler holds every chip, so what fits is measured without rendering twice.
 */
function Chips({ chosen }: { chosen: Option[] }) {
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
      setVisible(count);
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
          {option.text}
        </Badge>
      ))}
      {hidden > 0 ? <Badge variant="accent">+{hidden}</Badge> : null}
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

/**
 * A select-only combobox: a trigger that opens a listbox of options, with a hidden native `<select>`
 * that takes part in forms (FormData, `required`, reset, autofill). Choose one value, or several with
 * `multiple`. `ref` is the trigger; `className` and `style` go on the element around it.
 */
export const Select = markAsFieldControl(
  forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
    const {
      name,
      placeholder,
      size = 'md',
      autoComplete,
      className,
      style,
      children,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    } = props;
    const multiple = props.multiple === true;
    const field = useFieldContext();
    const fieldProps = useFieldProps({
      id: props.id,
      invalid: props.invalid,
      required: props.required,
      disabled: props.disabled,
      'aria-describedby': props['aria-describedby'],
    });
    const { invalid, required = false, disabled = false } = fieldProps;

    // --- Items, read from children without rendering them.
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

    // --- Value.
    const defaultValue = multiple
      ? ((props as SelectMultipleProps).defaultValue ?? [])
      : ((props as SelectSingleProps).defaultValue ?? null);
    const [value, setValue, resetValue] = useControllableState<string | null | string[]>({
      value: props.value,
      defaultValue,
      onChange: props.onValueChange as ((value: string | null | string[]) => void) | undefined,
      name: 'Select',
    });
    const chosen: string[] = Array.isArray(value) ? value : value === null ? [] : [value];
    for (const one of chosen) {
      if (!options.some((option) => option.value === one)) {
        devWarn(`<Select> has a value that matches no SelectItem: "${one}".`);
      }
    }
    const chosenOptions = options.filter((option) => chosen.includes(option.value));
    const first = chosenOptions[0];

    // --- Open state and the highlighted option.
    const { open, request, report, contentRef, pendingToggle } = usePopoverState<HTMLDivElement>({
      open: props.open,
      defaultOpen: props.defaultOpen ?? false,
      onOpenChange: props.onOpenChange,
      name: 'Select',
    });
    const [highlighted, setHighlighted] = useState<number | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, triggerRef), [ref]);
    const nativeRef = useRef<HTMLSelectElement>(null);
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const optionId = (index: number) => `${baseId}-option-${index}`;

    const flags = options.map((option) => ({ disabled: option.disabled }));
    const move = (current: number, key: string) =>
      getNextIndex(flags, current, key, { orientation: 'vertical', loop: false });
    /** The chosen option, or the first (`"Home"`) or last (`"End"`) one that can be chosen. */
    const startAt = (edge: 'Home' | 'End') =>
      first && !first.disabled ? first.index : move(-1, edge);
    const openAt = (index: number | null) => {
      setHighlighted(index);
      request(true);
    };
    // Opened without a highlight (`defaultOpen`, a controlled `open`): the chosen option, or the first.
    useIsoLayoutEffect(() => {
      if (open && highlighted === null) setHighlighted(startAt('Home'));
      if (!open) setHighlighted(null);
      // Only an opening or a closing decides this; the highlight itself changes it after that.
    }, [open]);

    const choose = (option: Option | undefined) => {
      if (!option || option.disabled) return;
      if (!multiple) {
        setValue(option.value);
        request(false);
        return;
      }
      const next = chosen.includes(option.value)
        ? chosen.filter((one) => one !== option.value)
        : [...chosen, option.value];
      // In the order of the list, so the chips do not reorder as options are toggled.
      setValue(options.filter((one) => next.includes(one.value)).map((one) => one.value));
    };

    // --- Typeahead: open, it moves the highlight; closed (choose one), it changes the value.
    const latest = useRef({ open, highlighted, first });
    latest.current = { open, highlighted, first };
    const optionElements = useCallback(
      () => Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
      [contentRef],
    );
    const currentOption = useCallback(() => {
      const { open: isOpen, highlighted: index, first: chosenFirst } = latest.current;
      const at = isOpen ? index : (chosenFirst?.index ?? null);
      return at === null
        ? null
        : (contentRef.current?.querySelector(`[data-index="${at}"]`) ?? null);
    }, [contentRef]);
    const chooseRef = useRef<(index: number) => void>(() => {});
    chooseRef.current = (index) => choose(options[index]);
    const onTypeaheadMatch = useCallback((el: HTMLElement) => {
      const index = Number(el.dataset.index);
      if (latest.current.open) setHighlighted(index);
      else chooseRef.current(index);
    }, []);
    const typeahead = useTypeahead(optionElements, onTypeaheadMatch, currentOption);

    const press = useTriggerPress(open, (wasOpen) => {
      // Focus stays on the trigger while the listbox is open, and the keyboard works from there; Safari
      // does not focus a clicked button, so the click does.
      triggerRef.current?.focus({ preventScroll: true });
      if (wasOpen) request(false);
      else openAt(startAt('Home'));
    });

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      const { key } = event;
      if (!open) {
        if (key === 'Enter' || key === ' ' || key === 'ArrowDown' || key === 'ArrowUp') {
          event.preventDefault();
          // A held key opens it once: the repeats are not presses of their own.
          if (event.repeat) return;
          openAt(startAt(key === 'ArrowUp' ? 'End' : 'Home'));
        } else if (key === 'Home' || key === 'End') {
          event.preventDefault();
          openAt(move(-1, key));
        } else if (!multiple) {
          typeahead(event);
        }
        return;
      }
      // A Space inside a typed search is part of it, so typeahead goes before Enter and Space.
      if (typeahead(event)) return;
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
        event.preventDefault();
        const next = move(highlighted ?? -1, key);
        if (next !== null) setHighlighted(next);
      } else if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        if (event.repeat) return;
        choose(highlighted === null ? undefined : options[highlighted]);
      } else if (key === 'Tab') {
        // Focus moves on as usual. Choose one: Tab takes the highlighted option, like Enter.
        if (!multiple && highlighted !== null) setValue(options[highlighted]?.value ?? null);
        request(false);
      }
    };

    // --- The listbox: a native popover placed under the trigger, as wide as it at least.
    usePopover(contentRef, {
      open,
      onOpenChange: report,
      pendingToggle,
      restoreFocusTo: () => triggerRef.current,
    });
    const scrollToHighlighted = () => {
      const index = latest.current.highlighted;
      if (index === null) return;
      contentRef.current
        ?.querySelector<HTMLElement>(`[data-index="${index}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    };
    useFloating({
      open,
      reference: () => triggerRef.current,
      floating: contentRef,
      side: 'bottom',
      align: 'start',
      offset: 6,
      maxHeight: 320,
      matchWidth: true,
      onPlaced: scrollToHighlighted,
    });
    useIsoLayoutEffect(() => {
      if (open) scrollToHighlighted();
    }, [open, highlighted]);

    // --- The hidden native <select>: kept in step with the value for forms.
    useIsoLayoutEffect(() => {
      const native = nativeRef.current;
      if (!native) return;
      for (const option of Array.from(native.options)) {
        option.selected = option.value === '' ? chosen.length === 0 : chosen.includes(option.value);
      }
    });
    const [, resync] = useState(0);
    const defaultRef = useRef(defaultValue);
    defaultRef.current = defaultValue;
    useEffect(() => {
      const form = nativeRef.current?.form;
      if (!form) return;
      // The browser resets the native <select> after this event: put an uncontrolled Select back to
      // its default, and the native one back in step with a controlled value, a task later.
      const onReset = () => {
        resetValue(defaultRef.current);
        setTimeout(() => resync((count) => count + 1), 0);
      };
      form.addEventListener('reset', onReset);
      return () => form.removeEventListener('reset', onReset);
    }, [resetValue]);
    const handleNativeChange = (event: ChangeEvent<HTMLSelectElement>) => {
      // Autofill, or anything else that changes the native <select> directly.
      if (multiple) {
        setValue(Array.from(event.target.selectedOptions, (option) => option.value));
      } else if (event.target.value !== '') {
        setValue(event.target.value);
      }
      resync((count) => count + 1);
    };

    // --- Names: the listbox has the trigger's name.
    const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId);
    const label = labelledBy ? undefined : ariaLabel;

    const renderRows = (list: Row[]): ReactElement[] =>
      list.map((row) => {
        if (row.kind === 'separator') {
          return <div key={row.key} role="none" className="flg-menu-separator" />;
        }
        if (row.kind === 'group') {
          const labelId = `${baseId}-group-${row.key}`;
          return (
            <div key={row.key} role="group" aria-labelledby={labelId}>
              <div id={labelId} role="presentation" className="flg-menu-label">
                {row.label}
              </div>
              {renderRows(row.rows)}
            </div>
          );
        }
        const { option } = row;
        const selected = chosen.includes(option.value);
        return (
          // The options take no focus: the trigger keeps it and points at the highlighted option with
          // aria-activedescendant (APG select-only combobox), and its keyboard handles them.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
          <div
            key={`${option.index}-${option.value}`}
            id={optionId(option.index)}
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            data-highlighted={dataAttr(open && highlighted === option.index)}
            data-index={option.index}
            data-text-value={option.text}
            className="flg-menu-item flg-select-option"
            onPointerMove={(event) => {
              if (event.pointerType !== 'touch' && !option.disabled) setHighlighted(option.index);
            }}
            onClick={() => choose(option)}
          >
            <span className="flg-menu-item-icon" aria-hidden="true">
              {multiple ? (
                <span className="flg-select-box">{BOX_CHECK}</span>
              ) : selected ? (
                CHECK
              ) : null}
            </span>
            {option.children}
          </div>
        );
      });

    const nativeDefault = multiple ? chosen : (chosen[0] ?? '');
    return (
      <div
        className={clsx('flg-select', className)}
        style={style}
        data-size={size}
        data-invalid={dataAttr(invalid)}
        data-disabled={dataAttr(disabled)}
        data-multiple={dataAttr(multiple)}
      >
        <button
          ref={mergedRef}
          type="button"
          role="combobox"
          id={fieldProps.id}
          className="flg-input flg-select-trigger"
          data-size={size}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open && highlighted !== null ? optionId(highlighted) : undefined}
          aria-label={label}
          aria-labelledby={labelledBy}
          aria-describedby={fieldProps['aria-describedby']}
          aria-invalid={fieldProps['aria-invalid']}
          aria-required={required || undefined}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onPointerDown={press.onPointerDown}
          onPointerCancel={press.onPointerCancel}
          onClick={press.onClick}
        >
          {chosenOptions.length === 0 ? (
            <span className="flg-select-value flg-select-placeholder">{placeholder}</span>
          ) : multiple ? (
            <>
              <Chips chosen={chosenOptions} />
              <span className="flg-visually-hidden">
                {chosenOptions.map((option) => option.text).join(', ')}
              </span>
            </>
          ) : (
            <span className="flg-select-value">{first?.children}</span>
          )}
          {CHEVRON}
        </button>
        <select
          ref={nativeRef}
          className="flg-select-native"
          aria-hidden="true"
          tabIndex={-1}
          name={name}
          multiple={multiple}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          defaultValue={nativeDefault}
          onChange={handleNativeChange}
          // The browser focuses an invalid native control to show its message: the trigger stands
          // for it.
          onFocus={() => triggerRef.current?.focus()}
        >
          {multiple ? null : <option value="" />}
          {options.map((option) => (
            <option
              key={`${option.index}-${option.value}`}
              value={option.value}
              disabled={option.disabled}
            >
              {option.text}
            </option>
          ))}
        </select>
        {/* No focus here either: the trigger keeps it (see the options). */}
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
        <div
          ref={contentRef}
          popover="auto"
          role="listbox"
          id={listboxId}
          className="flg-surface flg-menu flg-select-listbox"
          aria-multiselectable={multiple || undefined}
          aria-label={label}
          aria-labelledby={labelledBy}
          // Focus stays on the trigger: a press in the listbox must not take it.
          onMouseDown={(event) => event.preventDefault()}
        >
          {renderRows(rows)}
        </div>
      </div>
    );
  }),
);

/** One option of a Select. Read by the Select, never rendered on its own. */
export const SelectItem = markPart(function SelectItem(props: SelectItemProps): null {
  void props;
  devWarn(OUTSIDE('SelectItem'));
  return null;
}, 'select-item');

/** Options under a label. Read by the Select, never rendered on its own. */
export const SelectGroup = markPart(function SelectGroup(props: SelectGroupProps): null {
  void props;
  devWarn(OUTSIDE('SelectGroup'));
  return null;
}, 'select-group');

/** A line between options. Read by the Select, never rendered on its own. */
export const SelectSeparator = markPart(function SelectSeparator(
  props: SelectSeparatorProps,
): null {
  void props;
  devWarn(OUTSIDE('SelectSeparator'));
  return null;
}, 'select-separator');
```

`src/components/select/index.ts`:

```ts
export { Select, SelectGroup, SelectItem, SelectSeparator } from './Select';
export type {
  SelectGroupProps,
  SelectItemProps,
  SelectMultipleProps,
  SelectProps,
  SelectSeparatorProps,
  SelectSingleProps,
} from './Select';
```

Bốn điểm dễ sai trong file này:
- **Focus trong cú nhấn.** Toggle của `useTriggerPress` gọi `triggerRef.current?.focus({ preventScroll: true })` trước khi mở (phát hiện 1).
- **Highlight là state, không phải focus.**
  - Phím và chuột đặt highlight trước khi mở. Một layout effect trên `open` lo trường hợp mở mà chưa có highlight (`defaultOpen`, `open` controlled): option đã chọn, hoặc option đầu. Khi đóng, highlight bị xoá.
  - `onMouseDown` của listbox gọi `preventDefault`, để focus không rời trigger.
- **Tab ở Select chọn một** chọn option được trỏ rồi `request(false)`, mà **không** `preventDefault`, nên focus vẫn đi tiếp.
- **`<select>` gốc ẩn.**
  - Nó được đồng bộ lại trong một layout effect sau mỗi lần render, vì trình duyệt và autofill có thể đổi nó.
  - Khi form reset, Select gọi `reset(defaultValue)`, rồi đồng bộ lại `<select>` sau một task, vì trình duyệt reset `<select>` sau sự kiện `reset`. Với Select controlled, chính lần đồng bộ này trả `<select>` về giá trị của cha.

- [ ] **Step 6: CSS**

`src/styles/components/select.css`:

```css
/* Select (spec §4.3 Select, mockups menus A and multi-select M1). The trigger reuses the Input frame
   (`.flg-input`: size tokens, border, background); the listbox reuses the menu panel and items
   (menu.css). */
@layer flg.components {
  /* As wide as its container, like an Input in a Field. What is chosen never sets the width, as a
     native input's text does not (`width: 0` on the value and the chips, below). */
  .flg-select {
    position: relative;
    display: flex;
    width: 100%;
    min-width: 0;
  }
  .flg-select-trigger {
    flex: 1;
    min-width: 0;
    margin: 0;
    text-align: start;
    cursor: pointer;
  }
  .flg-select-trigger:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  /* As for Input: an invalid Select keeps its danger border while focused. */
  .flg-select:not([data-invalid]) .flg-select-trigger:focus-visible {
    border-color: var(--flg-accent-solid);
  }
  .flg-select[data-invalid] .flg-select-trigger {
    border-color: var(--flg-danger);
  }
  .flg-select-trigger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .flg-select-value {
    flex: 1;
    width: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .flg-select-placeholder {
    color: var(--flg-text-muted);
  }
  .flg-select-chevron {
    flex: none;
    width: 15px;
    height: 15px;
    color: var(--flg-text-muted);
  }
  .flg-select-chips {
    position: relative;
    display: flex;
    flex: 1;
    gap: 4px;
    width: 0;
    min-width: 0;
    overflow: hidden;
  }
  /* Holds every chip, unseen, so the Select can measure how many fit. */
  .flg-select-ruler {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: 4px;
    visibility: hidden;
    pointer-events: none;
  }
  /* The native <select> lies over the trigger, out of sight and out of reach, so the browser's
     validation message points at the trigger. */
  .flg-select-native {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    opacity: 0;
    pointer-events: none;
  }
  /* The square of a multiple Select's option, drawn like Checkbox. */
  .flg-select-box {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--flg-control-border);
    border-radius: var(--flg-radius-xs);
    background: var(--flg-control-bg);
    color: var(--flg-on-accent);
  }
  .flg-select-box > svg {
    display: none;
    width: 11px;
    height: 11px;
  }
  .flg-select-option[aria-selected='true'] .flg-select-box {
    border-color: transparent;
    background: var(--flg-accent-gradient);
  }
  .flg-select-option[aria-selected='true'] .flg-select-box > svg {
    display: block;
  }
}
```

```diff
diff --git a/src/styles/components/menu.css b/src/styles/components/menu.css
index 3d3df7f..823ac0b 100644
--- a/src/styles/components/menu.css
+++ b/src/styles/components/menu.css
@@ -1,5 +1,6 @@
-/* Menus: DropdownMenu, ContextMenu and submenus (spec §4.3, mockup menus A). The browser's styles
-   for [popover] are undone here; Floating UI writes `left`, `top` and `max-height`. */
+/* Menus: DropdownMenu, ContextMenu and submenus, and the listbox of Select (spec §4.3, mockup
+   menus A). The browser's styles for [popover] are undone here; Floating UI writes `left`, `top`,
+   `max-height` and, for a listbox, `min-width`. */
 @layer flg.components {
   .flg-menu {
     position: fixed;
@@ -35,9 +36,11 @@
     outline: none;
     user-select: none;
   }
-  /* The highlighted item is the focused one; a sub-trigger stays lit while its submenu is open. */
+  /* The highlighted item is the focused one; a sub-trigger stays lit while its submenu is open. A
+     Select's option is lit by `data-highlighted`: focus stays on the Select's trigger. */
   .flg-menu-item:focus,
-  .flg-menu-item[data-open] {
+  .flg-menu-item[data-open],
+  .flg-menu-item[data-highlighted] {
     background: var(--flg-highlight-bg);
     color: var(--flg-highlight-text);
   }
@@ -84,7 +87,7 @@
     margin-left: auto;
     color: var(--flg-text-muted);
   }
-  .flg-menu-item:is(:focus, [data-open])
+  .flg-menu-item:is(:focus, [data-open], [data-highlighted])
     :is(.flg-menu-item-icon, .flg-menu-shortcut, .flg-menu-chevron) {
     color: var(--flg-highlight-icon);
   }
diff --git a/src/styles/index.css b/src/styles/index.css
index 41818f8..be2eab7 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -21,5 +21,6 @@
 @import './components/popover.css';
 @import './components/tooltip.css';
 @import './components/menu.css';
+@import './components/select.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 5d60321..66634af 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -108,17 +108,17 @@
       color: CanvasText;
       box-shadow: none;
     }
-    .flg-menu-item:is(:focus, [data-open]) {
+    .flg-menu-item:is(:focus, [data-open], [data-highlighted]) {
       background: Highlight;
       color: HighlightText;
     }
     /* Chromium paints a Canvas backplate behind text in forced colours, which turns HighlightText on
        Highlight into a blank box: the highlighted item paints its own system colours instead. A
        disabled one keeps the backplate behind its GrayText. */
-    .flg-menu-item:is(:focus, [data-open]):not([aria-disabled='true']) {
+    .flg-menu-item:is(:focus, [data-open], [data-highlighted]):not([aria-disabled='true']) {
       forced-color-adjust: none;
     }
-    .flg-menu-item:is(:focus, [data-open])
+    .flg-menu-item:is(:focus, [data-open], [data-highlighted])
       :is(.flg-menu-item-icon, .flg-menu-shortcut, .flg-menu-chevron) {
       color: HighlightText;
     }
@@ -134,6 +134,26 @@
     .flg-menu-separator {
       background: CanvasText;
     }
+    .flg-select-trigger:disabled {
+      border-color: GrayText;
+      color: GrayText;
+    }
+    .flg-select-box {
+      border-color: CanvasText;
+    }
+    .flg-select-option[aria-selected='true'] .flg-select-box {
+      border-color: Highlight;
+      background: Highlight;
+      color: HighlightText;
+    }
+    /* On a highlighted option (a Highlight background) the colours swap, or the box would vanish. */
+    .flg-select-option[data-highlighted] .flg-select-box {
+      border-color: HighlightText;
+    }
+    .flg-select-option[data-highlighted][aria-selected='true'] .flg-select-box {
+      background: HighlightText;
+      color: Highlight;
+    }
     .flg-popover-arrow {
       border-color: CanvasText;
       background: Canvas;
```

Ghi chú:
- **Chiều rộng (phát hiện 3).** `.flg-select` rộng `100%`, còn giá trị và thẻ có `flex: 1; width: 0`, để nội dung không bao giờ làm Select rộng ra.
- **Forced colors.** Option được trỏ dùng chung quy tắc của item menu, gồm `forced-color-adjust: none` (bản sửa cuối của PR #6: Chromium vẽ nền Canvas sau chữ, làm chữ trên nền `Highlight` thành ô trắng). Hộp chọn của option chọn nhiều đổi màu khi option được trỏ, nếu không nó biến mất trên nền `Highlight`.

- [ ] **Step 7: Export và kiểm tra gói**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 98368e5..7f31dd0 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -40,6 +40,11 @@ const SHIPPED_CLASSES = [
   'flg-menu-label',
   'flg-menu-separator',
   'flg-menu-shortcut',
+  'flg-select',
+  'flg-select-trigger',
+  'flg-select-native',
+  'flg-select-chips',
+  'flg-select-box',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 28deb65..d6d1f21 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -20,6 +20,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/menu/Menu.tsx',
   'src/components/dropdown-menu/DropdownMenu.tsx',
   'src/components/context-menu/ContextMenu.tsx',
+  'src/components/select/Select.tsx',
 ];
 
 /**
diff --git a/src/index.test.ts b/src/index.test.ts
index 133a28f..11bcb6f 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -57,6 +57,10 @@ describe('public API', () => {
       'PopoverTrigger',
       'Radio',
       'RadioGroup',
+      'Select',
+      'SelectGroup',
+      'SelectItem',
+      'SelectSeparator',
       'Spinner',
       'Surface',
       'Switch',
diff --git a/src/index.ts b/src/index.ts
index 659c318..86319fa 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -121,6 +121,15 @@ export type {
 } from './components/menu';
 export { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './components/dropdown-menu';
 export { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './components/context-menu';
+export { Select, SelectGroup, SelectItem, SelectSeparator } from './components/select';
+export type {
+  SelectGroupProps,
+  SelectItemProps,
+  SelectMultipleProps,
+  SelectProps,
+  SelectSeparatorProps,
+  SelectSingleProps,
+} from './components/select';
 export type {
   ContextMenuContentProps,
   ContextMenuProps,
```

- [ ] **Step 8: Docs**

`src/components/select/Select.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Select.stories';

<Meta of={Stories} />

# Select

```tsx
import { Field, Select, SelectGroup, SelectItem, SelectSeparator } from 'fl-glass-ui';

<Field label="Frequency">
  <Select name="frequency" placeholder="Choose…" defaultValue="weekly">
    <SelectGroup label="Frequency">
      <SelectItem value="daily">Daily</SelectItem>
      <SelectItem value="weekly">Weekly</SelectItem>
      <SelectItem value="hourly" disabled>
        Hourly (Pro)
      </SelectItem>
    </SelectGroup>
  </Select>
</Field>;
```

<Canvas of={Stories.Open} />
<Controls />

## Items

`SelectItem` takes a `value` (not empty), `disabled` and `textValue`. `SelectGroup` puts items
under a `label`; `SelectSeparator` draws a line between them.

The Select reads its items from `children` without rendering them, so the first HTML from the
server already shows the chosen option and has every native `<option>`. Put `SelectItem` directly
inside the Select, or inside Fragments, arrays or a `SelectGroup`. A component of your own that
wraps a `SelectItem` is not looked into: it is skipped, with a warning in development.

`textValue` is the text typing matches, the native `<option>` carries and a chip shows. It
defaults to the item's text, so set it when the item shows something other than text.

## Choosing several

`multiple` makes `value` and `defaultValue` arrays, and `onValueChange` receives one. The chosen
options show as chips; when they do not all fit, the rest become one "+N" chip. The chips are for
the eye only: the trigger also carries the full list as text for screen readers.

<Canvas of={Stories.MultipleOpen} />

## In a form

A hidden native `<select>` lies under the trigger and follows the value, so the Select takes part
in forms like a native control:

- **FormData:** the value is submitted under `name`.
- **`required`:** an empty Select stops the submit. The browser's message points at the trigger, and
  focus goes to the trigger.
- **Reset:** a form reset puts an uncontrolled Select back to `defaultValue`. A controlled Select
  keeps its value, like a controlled React input.
- **Autofill:** a value the browser fills in reaches `onValueChange`.

Inside a `Field`, the label names the Select, and a click on the label opens it, as a label does for
any button. The description and error are announced with it, and the Field's `required`, `disabled`
and error apply to it.

## Keyboard

Focus stays on the trigger; the trigger tells assistive technology which option is highlighted.

| Key          | Closed                                                       | Open                                                                            |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Enter, Space | Opens it on the chosen option, or the first                  | Chooses the highlighted option and closes it; with `multiple`, toggles it       |
| ↓ / ↑        | Opens it on the chosen option, or the first / last           | Next / previous option, stopping at the ends                                    |
| Home, End    | Opens it on the first / last option                          | First / last option                                                             |
| A letter     | Chooses the next option that starts with it, without opening | Highlights the next option that starts with it                                  |
| Tab          |                                                              | Chooses the highlighted option (not with `multiple`), closes it, focus moves on |
| Esc          |                                                              | Closes it without changing the value                                            |

## Placement and size

The listbox opens 6px below the trigger, at least as wide as it, and at most 320px tall (less when
the room below or above is smaller); past that it scrolls, and it opens scrolled to the highlighted
option. It flips above the trigger when there is no room below.

The Select is as wide as its container. What is chosen never changes its width; give it a width
with `style` or `className` where it should be narrower.

## Accessibility

- The trigger is a `combobox` button and the list a `listbox` with the trigger's name, following
  the APG select-only combobox pattern.
- Disabled options are announced and skipped by the keyboard.
- The highlighted option uses the same accent wash as a menu item; see rows 8–10 on the
  Accessibility page.

## Do and don't

- Do use a Select to choose from a list of values in a form.
- Don't use it for commands; use a DropdownMenu.
- Don't put hundreds of options in it: the list is not virtualised and has no search.
````

- [ ] **Step 9: Cập nhật spec và mô tả dòng 8, 9 của §4.9**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index f73a8f3..9ebefc1 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -319,8 +319,8 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) so với nền | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
 | 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ Badge `accent` (`--flg-accent-text` trên `--flg-accent-subtle`) | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
-| 8 | Item menu đang được trỏ: nền `--flg-accent-subtle` so với nền panel | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
-| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu đang được trỏ | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
+| 8 | Item menu (hoặc option của Select) đang được trỏ: nền `--flg-accent-subtle` so với nền panel | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
+| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
 | 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index ee78182..e192e7b 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -430,7 +430,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`:
 | `use-typeahead.ts` | `useTypeahead(getItems, onMatch, getCurrent?)` | `getCurrent` (thêm ở Plan C) là item mà lần gõ bắt đầu từ đó, mặc định là phần tử đang có focus; Select truyền option đang được trỏ, vì focus luôn ở trigger. Gom phím trong 500ms rồi so tiền tố, không phân biệt hoa thường. Gõ lặp một chữ thì nhảy vòng giữa các item cùng chữ đầu. Phím Space nằm giữa một chuỗi đang gõ được tính là ký tự |
 | `use-iso-layout-effect.ts` | `useIsoLayoutEffect` | `useLayoutEffect` trên trình duyệt, `useEffect` trên server (React 18 cảnh báo layout effect khi render ở server). Overlay cần layout effect để mở, đo và chuyển focus trước khi trình duyệt vẽ |
 | `react-lazy.ts` | `resolveLazy(value)` | Gỡ lazy reference của React. Server Component truyền client component xuống dưới dạng lazy reference; ở development nó còn truyền cả element con dưới dạng đó. `Slot` (giai đoạn 1) và `isFieldGroup`/`isFieldControl` dùng hàm này. Thiếu bước này, `asChild` trong Server Component in cảnh báo và lỗi hydrate ở Next dev (phát hiện khi lập Plan A) |
-| `collect-children.ts` | `collectChildren(children, parts)` | Duyệt tĩnh `children` qua Fragment, mảng và các phần nhóm đã khai báo. Nhận ra component qua marker và gỡ lớp lazy reference của RSC, giống `isFieldControl` ở giai đoạn 1. Dùng cho Select và Breadcrumb |
+| `collect-children.ts` | `markPart(component, part)`, `partOf(node)`, `collectChildren(children, { parts, groups, onUnknown })` | Duyệt tĩnh `children` qua Fragment, mảng và các phần nhóm (`groups`) đã khai báo, trả danh sách `{ part, key, props, parts? }`. Nhận ra component qua marker (`markPart`) và gỡ lớp lazy reference của RSC, giống `isFieldControl` ở giai đoạn 1. Con không phải phần đã khai báo (kể cả component tự định nghĩa bọc một phần) đi vào `onUnknown`. Dùng cho Select và Breadcrumb |
 
 **Cảnh báo dev mới:**
 
@@ -659,6 +659,9 @@ type SelectBaseProps = {
   "aria-label"?: string;
   "aria-labelledby"?: string;
   "aria-describedby"?: string;
+  open?: boolean;              // thêm ở Plan C, như các overlay khác
+  defaultOpen?: boolean;
+  onOpenChange?: (open: boolean) => void;
 };
 type SelectProps =
   | (SelectBaseProps & { multiple?: false; value?: string | null; defaultValue?: string; onValueChange?: (value: string) => void })
@@ -678,6 +681,8 @@ type SelectProps =
   </div>
   ```
 
+  - Trigger mang thêm class `flg-input` để dùng lại khung của Input; listbox mang thêm class `flg-menu` để dùng lại panel và item của menu (option có `flg-menu-item`).
+  - Đường phân cách là `<div role="none">`, vì listbox chỉ được chứa option và group.
   - `ref` trỏ vào button trigger.
   - `className` và `style` gắn vào phần tử bọc ngoài.
   - Các prop `id` và `aria-*` gắn vào trigger.
@@ -701,7 +706,7 @@ type SelectProps =
     - Các thẻ có `aria-hidden`.
     - Trigger chứa thêm một đoạn chữ ẩn (`flg-visually-hidden`) liệt kê đủ các lựa chọn, để screen reader đọc được.
 - **Focus và highlight** theo mẫu APG "select-only combobox":
-  - Focus DOM luôn nằm trên trigger.
+  - Focus DOM luôn nằm trên trigger. Bấm vào trigger thì lib focus nó: Safari không focus nút được bấm, nên nếu không, listbox mở ra mà bàn phím không tới được trigger (phát hiện khi lập Plan C).
   - Option đang được trỏ được báo qua `aria-activedescendant` và có `data-highlighted` (giao diện như item menu đang được trỏ).
   - Di chuột lên option thì option đó được trỏ.
 - **Bàn phím khi listbox đang đóng:**
@@ -720,10 +725,11 @@ type SelectProps =
 - **Listbox:**
   - Middleware: `offset` (6px), `flip`, `size` (rộng tối thiểu bằng trigger, cao tối đa `min(320px, chỗ còn trống)`).
   - Mở ra thì cuộn tới option được trỏ.
+- **Chiều rộng:** Select rộng bằng phần tử chứa nó, như Input trong Field. Giá trị đã chọn không bao giờ làm đổi chiều rộng (thẻ của Select chọn nhiều cũng vậy); muốn hẹp hơn thì đặt `style` hoặc `className` (phát hiện khi lập Plan C: không có quy tắc này, thẻ làm Select phình ra trong bố cục grid).
 - **`<select>` gốc ẩn:**
   - Nằm phủ trùng lên trigger với `position: absolute`, `inset: 0`, `opacity: 0` và `pointer-events: none`.
   - Mang `name`, `multiple`, `required`, `disabled`, `autoComplete`.
-  - Có một `<option>` cho mỗi item. Select chọn một có thêm một `<option value="">` đứng đầu, để `required` hoạt động.
+  - Có một `<option>` cho mỗi item, mang chữ của `textValue` (hoặc chữ của children). Select chọn một có thêm một `<option value="">` đứng đầu, để `required` hoạt động.
   - Luôn được đồng bộ với giá trị hiện tại.
 - **Nhờ `<select>` gốc ẩn:**
   - `FormData` có giá trị của Select.
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 4ebf807..50d4be1 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -47,11 +47,11 @@ const D = {
   6: { description: 'Muted text on the brightest reference backdrop', criterion: '1.4.3' },
   7: { description: 'Accent badge text on the accent badge background', criterion: '1.4.3' },
   8: {
-    description: 'Highlighted menu item: the accent wash against the menu panel',
+    description: 'Highlighted menu item or Select option: the accent wash against the panel',
     criterion: '1.4.11',
   },
   9: {
-    description: 'Muted icon, shortcut and submenu chevron on a highlighted menu item',
+    description: 'Muted icon, shortcut and submenu chevron on a highlighted menu item or option',
     criterion: '1.4.3, 1.4.11',
     minimum: '4.5:1 shortcut text, 3:1 icons',
   },
````

Option được trỏ dùng đúng nền và màu icon của item menu, nên hai dòng có sẵn bao luôn nó. Số đo không đổi.

- [ ] **Step 10: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/select src/components/dropdown-menu src/components/context-menu src/components/dialog src/components/field
pnpm check:contrast
pnpm build && pnpm size:record && pnpm check:package
```

Expected:
- `pnpm test:unit`: 556 test PASS, 2 skip, không có lỗi kiểu.
- Story: 270 test PASS (45 story × 3 trình duyệt × 2 theme), trong đó Select có 60.
- `check:contrast` PASS.
- `size:record` nâng giới hạn JS lên khoảng 24.1 kB và CSS lên khoảng 5.5 kB. `check:package` PASS.

- [ ] **Step 11: Commit**

```bash
git add src/internal/collect-children.ts src/internal/collect-children.test.tsx src/components/select src/styles src/index.ts src/index.test.ts scripts/check-use-client.ts scripts/check-dist-css.ts scripts/contrast-exceptions.ts .size-limit.json docs/superpowers/specs
git commit -m "feat(select): add Select, single and multiple, with a hidden native select for forms" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 7: Select trong hai fixture

**Files:**
- Create: `fixtures/vite-app/src/Selects.tsx`, `fixtures/next-app/app/selects.tsx`
- Modify: `fixtures/vite-app/src/App.tsx`, `fixtures/next-app/app/page.tsx`, `scripts/test-fixtures.mjs`

**Interfaces:**
- Consumes: mọi export của Task 6, từ bản build đã pack.
- Produces: không có API mới.

- [ ] **Step 1: Thêm kiểm tra vào script fixture (test fail)**

```diff
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index 7bc2ae0..94e5b1c 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -73,6 +73,7 @@ const COMPONENTS = [
   '.flg-tooltip',
   '.flg-menu',
   '.flg-context-menu-trigger',
+  '.flg-select',
 ];
 
 function run(command, args, cwd) {
@@ -194,6 +195,7 @@ async function inspect(page, url, problems) {
 
   await checkOverlays(page, problems);
   await checkMenus(page, problems);
+  await checkSelects(page, problems);
 }
 
 const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement);
@@ -266,6 +268,32 @@ async function checkMenus(page, problems) {
   await context.waitFor({ state: 'hidden' });
 }
 
+/** Phase 2, plan C: a Select opens from the keyboard, chooses, and is in the form's FormData. */
+async function checkSelects(page, problems) {
+  const frequency = page.getByRole('combobox', { name: 'Frequency' });
+  if (!(await frequency.textContent())?.includes('Weekly')) {
+    problems.push('the Select does not show its default value');
+  }
+  await frequency.focus();
+  await page.keyboard.press('ArrowDown');
+  const listbox = page.locator('.flg-select-listbox').first();
+  await listbox.waitFor();
+  if (!(await hasFocus(frequency))) problems.push('focus left the Select trigger when it opened');
+  await page.keyboard.press('ArrowDown');
+  await page.keyboard.press('Enter');
+  await listbox.waitFor({ state: 'hidden' });
+  if (!(await frequency.textContent())?.includes('Monthly')) {
+    problems.push('choosing an option did not change the Select');
+  }
+  const data = await page.getByRole('form', { name: 'Schedule' }).evaluate((form) => {
+    const formData = new FormData(form);
+    return { frequency: formData.get('frequency'), departments: formData.getAll('departments') };
+  });
+  if (data.frequency !== 'monthly' || data.departments.join() !== 'design') {
+    problems.push(`the form data is wrong: ${JSON.stringify(data)}`);
+  }
+}
+
 async function testApp(name, browser) {
   const app = APPS[name];
   const cwd = join(FIXTURES, app.dir);
@@ -285,6 +313,19 @@ async function testApp(name, browser) {
       if (app.serverRendered && !/<span[^>]*class="flg-field-label"[^>]*>Plan</.test(html)) {
         problems.push(`${label}: the server HTML labels the Plan RadioGroup with <label for>`);
       }
+      // The Select reads its items without rendering them: the server HTML already shows the chosen
+      // option on the trigger and has the native <option>s.
+      if (
+        app.serverRendered &&
+        !(
+          /role="combobox"(?:(?!<\/button>)[\s\S])*Weekly/.test(html) &&
+          /<option value="weekly" selected/.test(html)
+        )
+      ) {
+        problems.push(
+          `${label}: the server HTML lacks the Select's chosen option or native options`,
+        );
+      }
       for (const problem of await checkPage(browser, server.url)) {
         problems.push(`${label}: ${problem}`);
       }
```

Script kiểm tra ba điều:
- HTML từ server của Next.js đã có chữ của lựa chọn trên trigger và `<option selected>` gốc. Select đọc item mà không render chúng, nên điều này đúng cả khi item được viết trong một Server Component.
- Select mở bằng phím, và focus ở yên trigger.
- Lựa chọn có trong FormData.

Run: `pnpm build && pnpm test:fixtures`
Expected: FAIL với 10 vấn đề:
- Cả bốn lần chạy báo `missing .flg-select` và `locator.textContent: Timeout 30000ms exceeded.`, vì trang chưa có combobox "Frequency".
- Hai lần chạy Next.js báo thêm `the server HTML lacks the Select's chosen option or native options`.

- [ ] **Step 2: Render Select trong hai app**

`fixtures/vite-app/src/Selects.tsx`:

```tsx
// The Select of phase 2, plan C. The Next.js fixture renders the same markup from a Server Component.
import { Field, Select, SelectGroup, SelectItem } from 'fl-glass-ui';

export function Selects() {
  return (
    <form aria-label="Schedule" style={{ display: 'grid', gap: 12 }}>
      <Field label="Frequency" required>
        <Select name="frequency" defaultValue="weekly">
          <SelectGroup label="Frequency">
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectGroup>
        </Select>
      </Field>
      <Field label="Departments">
        <Select multiple name="departments" defaultValue={['design']}>
          <SelectItem value="design">Design</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
        </Select>
      </Field>
    </form>
  );
}
```

`fixtures/next-app/app/selects.tsx` (Server Component):

```tsx
// A Server Component: the Select of phase 2, plan C, with its items written on the server, which the
// Select reads without rendering them. The Vite fixture renders the same markup on the client.
import { Field, Select, SelectGroup, SelectItem } from 'fl-glass-ui';

export function Selects() {
  return (
    <form aria-label="Schedule" style={{ display: 'grid', gap: 12 }}>
      <Field label="Frequency" required>
        <Select name="frequency" defaultValue="weekly">
          <SelectGroup label="Frequency">
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectGroup>
        </Select>
      </Field>
      <Field label="Departments">
        <Select multiple name="departments" defaultValue={['design']}>
          <SelectItem value="design">Design</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
        </Select>
      </Field>
    </form>
  );
}
```

```diff
diff --git a/fixtures/next-app/app/page.tsx b/fixtures/next-app/app/page.tsx
index 9a13e1a..32e7f5c 100644
--- a/fixtures/next-app/app/page.tsx
+++ b/fixtures/next-app/app/page.tsx
@@ -25,6 +25,7 @@ import {
 import { ClientControls } from './client-controls';
 import { Menus } from './menus';
 import { Overlays } from './overlays';
+import { Selects } from './selects';
 
 export default function Page() {
   return (
@@ -71,6 +72,7 @@ export default function Page() {
       <ClientControls />
       <Overlays />
       <Menus />
+      <Selects />
     </main>
   );
 }
diff --git a/fixtures/vite-app/src/App.tsx b/fixtures/vite-app/src/App.tsx
index 91e6bb4..2fd2c63 100644
--- a/fixtures/vite-app/src/App.tsx
+++ b/fixtures/vite-app/src/App.tsx
@@ -24,6 +24,7 @@ import {
 import { useEffect, useState } from 'react';
 import { Menus } from './Menus';
 import { Overlays } from './Overlays';
+import { Selects } from './Selects';
 
 const CHANNELS = ['email', 'sms'];
 
@@ -93,6 +94,7 @@ export function App() {
       </section>
       <Overlays />
       <Menus />
+      <Selects />
     </main>
   );
 }
```

- [ ] **Step 3: Chạy fixture**

Run: `pnpm build && pnpm test:fixtures`
Expected: `Fixtures OK: vite, next.`, ở production lẫn development.

- [ ] **Step 4: Commit**

```bash
git add fixtures scripts/test-fixtures.mjs
git commit -m "test(fixtures): choose a Select from the keyboard and read it from FormData in both apps" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
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

Expected: 556 unit test PASS (2 skip); 744 story test PASS; tương phản PASS; gói PASS; hai fixture PASS.

- [ ] **Sau khi đẩy nhánh:** chủ dự án chạy workflow "Update visual baselines" cho nhánh, để tạo 16 ảnh của `Select/Open` và `Select/MultipleOpen`. Sau commit của bot, cần một lần push mới, hoặc đóng rồi mở lại PR, thì job visual mới chạy trên commit có ảnh.
- [ ] **Xem bằng mắt bốn ảnh forced colors** của hai story đó: chữ của option được trỏ phải đọc được, và hộp chọn phải thấy được. Ở PR #6, ngưỡng `maxDiffPixelRatio` của visual test không bắt được một nhãn bị trắng xoá.
- [ ] **Mô tả PR** nêu rằng dòng 8 và 9 của §4.9 giờ bao cả option của Select, với số đo không đổi (spec §4.4: điểm mới được nêu trong mô tả PR).
