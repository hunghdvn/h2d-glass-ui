# fl-glass-ui: Plan A, Primitives và overlay (giai đoạn 2, phần 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở đầu giai đoạn 2. Plan này nâng mốc trình duyệt lên Safari/iOS 17.4, thêm `@floating-ui/dom`, các primitive nội bộ cho overlay, và bốn component Dialog, Drawer, Popover, Tooltip.

**Architecture:**
- **Lớp nổi gốc (spec §3.3).**
  - Dialog và Drawer dùng `<dialog>.showModal()`. Khung `<dialog>` trong suốt, phủ toàn viewport. Bên trong có panel kính và đích của vùng toast (spec §3.4).
  - Popover dùng `popover="auto"`, Tooltip dùng `popover="manual"`.
  - Không portal, không thang z-index.
- **State đóng/mở.**
  - Đi qua `useControllableState`.
  - Sự kiện gốc (`cancel`, `close`, `toggle`) được gắn bằng `addEventListener` và luôn được đồng bộ về state.
- **Định vị.** `useFloating` bọc Floating UI với `strategy: "fixed"`. Hook ghi `left`/`top` thẳng vào style và ghi `data-side`/`data-align` theo vị trí thật sau khi lật.
- **Bố cục file:**
  - Mỗi component nằm trong `src/components/<tên>/`.
  - CSS nằm ở `src/styles/components/<tên>.css`; Drawer dùng chung `dialog.css`.
  - Animation lúc mở dùng chung nằm ở `floating.css`.
  - Quy tắc `forced-colors` nằm trong `src/styles/preferences.css`.

**Tech Stack:** Như Plan 3: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63. Thêm `@floating-ui/dom` 1.8.0.

**Spec:** `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`:
- §3: kiến trúc, lớp nổi, khung Dialog, animation, client/server, file.
- §4.1–4.5: mockup, token scrim, kích thước, tương phản, forced colors.
- §5: primitives, cảnh báo dev.
- §6.1 và §6.3: Dialog, Drawer, Popover, Tooltip.
- §7: kiểm thử, input thật, fixture.

**Mockup chuẩn** (`docs/superpowers/specs/mockups/`):

| File | Phương án đã chọn |
|---|---|
| `phase-2-scrim.html` | A (tối và làm mờ) |
| `phase-2-tooltip-popover.html` | T2 (tooltip kính), P1 (popover có mũi tên) |
| `phase-2-drawer-breadcrumb-pagination.html` | D1 và D2 của Drawer |

CSS trong plan này dựng lại đúng các phương án đó bằng token có sẵn. Ảnh chụp trạng thái mở ở Chromium đã được so với mockup khi lập kế hoạch.

**Đã chạy thử khi lập kế hoạch:** toàn bộ code dưới đây đã chạy trên một nhánh nháp, kết quả:

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 404 test PASS (trước plan: 379) trên React 19 và 18.3 |
| `pnpm test:stories` | 444 test PASS (trước plan: 336): 74 story × 3 trình duyệt × 2 theme, kèm axe |
| `pnpm check:contrast` | PASS. Chữ trên panel phủ scrim thấp nhất 5.08:1, chữ tooltip thấp nhất 7.13:1, nên plan này không thêm dòng nào vào §4.9 |
| `pnpm check:package` | PASS |
| `pnpm test:fixtures` | Cả hai fixture PASS, ở production lẫn development |

Sáu phát hiện từ lần chạy thử đã được đưa vào plan, và spec đã được cập nhật theo:

1. **Esc và light dismiss chỉ phản ứng với input thật.**
   - `userEvent` của Testing Library phát sự kiện giả, nên không kích hoạt được hai hành vi này.
   - Story lấy `userEvent` của Vitest (điều khiển Playwright) qua `.storybook/real-input.ts`. Trong Storybook UI không có bản này, và các bước đó được bỏ qua.
   - Input thật chỉ đến đúng story khi mỗi lúc chỉ chạy một file. Vì vậy hai project story đặt `fileParallelism: false`. Thiếu dòng này, cả 26 story dùng input thật timeout khi chạy cả bộ, dù chạy riêng từng thư mục thì pass. Bộ test lâu thêm khoảng 20 giây.
2. **Safari không focus nút khi bấm chuột.** Mở Dialog bằng chuột thì trước đó không phần tử nào có focus. Lúc đóng, focus về trigger thay vì `<body>`. Lỗi này lộ ra ở WebKit.
3. **`Slot` nhận con là lazy reference.**
   - Ở Next dev, Server Component truyền element con xuống dưới dạng lazy reference.
   - `Slot` của giai đoạn 1 không nhận ra, nên in cảnh báo `asChild` và gây lỗi hydrate (lộ ra khi đặt `TooltipTrigger` trong Server Component).
   - Đây là lỗi tiềm ẩn của mọi `asChild` từ giai đoạn 1. Task 2 sửa nó.
4. **StrictMode.**
   - React chạy effect hai lần khi mount: đóng dialog rồi mở lại.
   - Sự kiện `close` của lần đóng đầu đến trễ một task, và đóng nhầm dialog vừa mở lại.
   - Môi trường story không chạy effect hai lần, nên chỉ unit test (có `showModal` giả) bắt được lỗi này.
5. **Mốc trình duyệt thành 17.4.**
   - `::backdrop` chỉ kế thừa custom property của theme từ Safari 17.4.
   - Cách vá là sinh token cho selector `X ::backdrop`, nhưng cách này hỏng khi một vùng light lồng trong vùng dark: selector con cháu không biết theme nào gần nhất.
   - Chủ dự án chọn nâng mốc từ 17.2 lên 17.4 (2026-10-05), nên `::backdrop` dùng thẳng `var(--flg-scrim)`.
6. **Tooltip.** Chuyển nhanh từ tooltip này sang tooltip kia phải bỏ qua thời gian chờ, kể cả khi tooltip trước chưa kịp đóng. Mở tooltip mới thì tooltip cũ đóng ngay trong cùng một lần render (WebKit chậm hơn một nhịp nếu đóng trong effect).

**Phạm vi:**
- **Không làm ở plan này:** Toast và việc Toaster vào `.flg-toast-host` (Plan E); `maxHeight` và `matchWidth` của `useFloating` (Plan B, C); changeset `0.2.0` (Plan E); đo tương phản ở chế độ solid fallback (vẫn hoãn từ giai đoạn 1).
- **Ảnh chuẩn visual:** plan thêm 8 story có ảnh, tức 64 ảnh mới. Không tạo ảnh trên Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`).
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` nằm trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`.
- **Mockup lock:** chỉ thêm token mới ở Task 1 (`scrim`, `scrim-blur`). Không đổi giá trị token nào khác trong `src/styles/theme/values.ts`. CSS ở plan này là bản đã đối chiếu với mockup, không được "cải thiện".
- `backdrop-filter` chỉ có ở: `Surface`, `Card`, panel của Dialog và Drawer, Popover, Tooltip, `::backdrop` (spec §4.2).
- **Khung `<dialog>`** không bao giờ có `transform`, `filter`, `backdrop-filter`, `opacity`, `mask` hay `clip-path` (spec §3.4).
- **Không set `display` vô điều kiện** cho phần tử `<dialog>` hay `popover`. CSS của tác giả thắng style của trình duyệt, nên làm vậy sẽ hiện cả phần tử đang đóng. Chỉ set dưới `[open]` hoặc `:popover-open`.
- **`"use client"`** chỉ có ở `Dialog.tsx`, `Drawer.tsx`, `Popover.tsx`, `Tooltip.tsx` (cùng các module client của giai đoạn 1). `src/components/dialog/modal.tsx` và mọi file trong `src/internal/` **không** có directive.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Sự kiện `toggle`, `cancel`, `close` gắn bằng `addEventListener`, không dùng prop React.
- Chữ mặc định do lib cung cấp bằng tiếng Anh. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. Plan này không thêm changeset.
- Mỗi task thêm CSS hoặc JS: chạy `pnpm build && pnpm size:record` trước `pnpm check:package`, và commit `.size-limit.json` đã cập nhật.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý nhưng không nêu thành test. Mỗi dòng có test ở task tương ứng:

1. **Mở Dialog bằng chuột trên Safari rồi đóng:** focus phải về trigger, không rơi về `<body>`. Test ở Task 4: story `Default` dùng click thật của Playwright trên WebKit.
2. **`asChild` trong Server Component ở Next dev** (ví dụ `<TooltipTrigger><IconButton/></TooltipTrigger>`): không cảnh báo, không lỗi hydrate. Test ở Task 2 (unit test với lazy reference giả lập) và Task 8 (fixture Next dev).
3. **`<Dialog defaultOpen>` trong StrictMode:** dialog vẫn mở sau khi mount, không gọi `onOpenChange(false)`, trang vẫn khoá cuộn. Test ở Task 4 (`Dialog.test.tsx`, với `showModal` giả lập vì jsdom không có).
4. **Dialog controlled từ chối đóng** (ví dụ còn thay đổi chưa lưu): Esc không đóng. Sau khi cha đồng ý, Esc đóng. Test ở Task 4 (story `Controlled`).
5. **Bấm trigger của Popover khi đang mở:** popover đóng, không đóng rồi mở lại do light dismiss. Test ở Task 6 (story `Default`).

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `package.json`, `pnpm-lock.yaml` | Mốc trình duyệt 17.4, `@floating-ui/dom` (Task 1) |
| `src/styles/theme/values.ts`, `scripts/lib/theme-css.test.ts` | Token `scrim`, `scrim-blur` và khoá mockup của chúng (Task 1) |
| `scripts/lib/contrast.ts` | Đo chữ trên panel phủ scrim và chữ tooltip (Task 1) |
| `src/internal/react-lazy.ts`, `src/internal/slot.tsx`, `src/internal/field-context.tsx` | Gỡ lazy reference, dùng chung cho `Slot` và Field (Task 2) |
| `src/internal/{use-iso-layout-effect,use-controllable-state,lock-scroll,modal-stack,focus}.ts` | Primitive không cần Popover API (Task 3) |
| `src/components/dialog/modal.tsx` | Lõi dùng chung của Dialog và Drawer: context, trigger, nút đóng, khung `<dialog>`, tiêu đề, mô tả (Task 4) |
| `src/components/dialog/Dialog.tsx`, `src/styles/components/dialog.css` | Dialog và CSS của khung (Task 4); Drawer thêm phần của nó vào cuối file CSS (Task 5) |
| `.storybook/real-input.ts`, `.storybook/preview.tsx`, `.storybook/stage.css`, `vitest.config.ts` | Input thật trong play function, stage phủ viewport, chạy từng file một (Task 4) |
| `src/components/drawer/Drawer.tsx` | Drawer (Task 5) |
| `src/internal/{use-popover,use-floating}.ts` | Đồng bộ phần tử `popover` với state; định vị bằng Floating UI (Task 6) |
| `src/components/popover/Popover.tsx`, `src/styles/components/{popover,floating}.css` | Popover và animation dùng chung (Task 6) |
| `src/components/tooltip/Tooltip.tsx`, `src/styles/components/tooltip.css` | Tooltip (Task 7) |
| `fixtures/vite-app/src/Overlays.tsx`, `fixtures/next-app/app/overlays.tsx`, `scripts/test-fixtures.mjs` | Bốn overlay trong hai fixture, kèm kiểm tra tương tác (Task 8) |
| `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Đăng ký module client và class mới (Task 4–7) |
| `src/index.ts`, `src/index.test.ts` | API công khai và test khoá danh sách export (Task 4–7) |

**Quy ước story:**
- Trước plan có 56 story, tức 336 test (mỗi story chạy 3 trình duyệt × 2 theme). Sau mỗi task, phần Expected ghi tổng số test đếm được.
- Story có thẻ `no-visual` không có ảnh visual. Story trạng thái đóng (`Default`) đều mang thẻ này, vì trạng thái đóng chỉ là một Button đã có ảnh riêng.
- Story overlay đặt `parameters: { stage: 'viewport' }`, để overlay trong top layer nằm trong ảnh chụp.

---

### Task 1: Mốc trình duyệt, `@floating-ui/dom`, token scrim và đo tương phản

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`, `src/styles/theme/values.ts`, `scripts/lib/contrast.ts`
- Test: `scripts/lib/theme-css.test.ts`

**Interfaces:**
- Consumes: không có gì mới.
- Produces:
  - Token `--flg-scrim` (theo theme) và `--flg-scrim-blur` (token nền, về `0px` ở chế độ solid).
  - Ba check mới trong `CHECKS`: `scrim-text`, `scrim-text-muted`, `tooltip-text`.
  - Package `@floating-ui/dom` cài sẵn cho Task 6.

- [ ] **Step 1: Khoá giá trị mockup của token scrim (test fail)**

Trong `scripts/lib/theme-css.test.ts`, đối tượng `MOCKUP` có hai nhánh `light` và `dark`. Thêm một dòng vào cuối mỗi nhánh, ngay sau dòng `'control-thumb': '#ffffff',`:

```ts
    scrim: 'rgba(15,20,40,.28)',
```

vào nhánh `light`, và

```ts
    scrim: 'rgba(0,0,0,.45)',
```

vào nhánh `dark`.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project scripts scripts/lib/theme-css.test.ts`
Expected: 2 test FAIL (`keeps every light mockup token exactly as approved` và bản dark), vì `values.ts` chưa có `scrim`.

- [ ] **Step 3: Thêm token vào `values.ts`**

Trong `src/styles/theme/values.ts`:

1. Trong `baseTokens`, ngay sau `'spinner-duration': '800ms',`, thêm:

```ts
  'scrim-blur': '6px',
```

2. Trong `themes.light`, ngay sau `'status-bg-alpha': '12%', // (outside mockup)`, thêm:

```ts
    scrim: 'rgba(15,20,40,.28)',
```

3. Trong `themes.dark`, ngay sau `'status-bg-alpha': '16%', // (outside mockup)`, thêm:

```ts
    scrim: 'rgba(0,0,0,.45)',
```

4. Thay `solidFallback` bằng:

```ts
export const solidFallback: TokenMap = {
  'glass-tint': 'var(--flg-glass-tint-solid)',
  'glass-filter': 'none',
  'scrim-blur': '0px',
};
```

- [ ] **Step 4: Đo chữ trên panel phủ scrim và chữ tooltip**

Trong `scripts/lib/contrast.ts`:

1. Trong `CHECKS`, ngay sau `'checked-fill': 3,`, thêm:

```ts
  'scrim-text': 4.5,
  'scrim-text-muted': 4.5,
  'tooltip-text': 4.5,
```

2. Ngay sau dòng `const CHECK_IDS = Object.keys(CHECKS) as CheckId[];`, thêm:

```ts
/** Measured over their own surfaces rather than the plain glass. */
type OverlayCheck = 'scrim-text' | 'scrim-text-muted' | 'tooltip-text';
const OVERLAY_CHECKS: readonly CheckId[] = ['scrim-text', 'scrim-text-muted', 'tooltip-text'];
const SURFACE_CHECK_IDS = CHECK_IDS.filter((id) => !OVERLAY_CHECKS.includes(id)) as Array<
  Exclude<CheckId, OverlayCheck>
>;
```

3. Trong `measure()`, thay khối:

```ts
  const surfaces = values.referenceBackgrounds[theme].flatMap((backdrop) =>
    borderStops.map((stop) => {
      const under = composite(stop, parseColor(backdrop));
      return composite(color('glass-tint'), under);
    }),
  );
```

bằng:

```ts
  const backdrops = values.referenceBackgrounds[theme].map(parseColor);
  const surfaceOver = (backdrop: Rgba) =>
    borderStops.map((stop) => composite(color('glass-tint'), composite(stop, backdrop)));
  const surfaces = backdrops.flatMap(surfaceOver);
  // Dialog and Drawer: the panel over the page darkened by the scrim (spec §4.4).
  const scrimmed = backdrops.flatMap((backdrop) =>
    surfaceOver(composite(color('scrim'), backdrop)),
  );
  // Tooltip: the tint straight over the page, with no border gradient under it.
  const tooltips = backdrops.map((backdrop) => composite(color('glass-tint'), backdrop));
  const textOn = (name: string, under: Rgba) => contrastRatio(composite(color(name), under), under);
  for (const under of scrimmed) {
    lowest['scrim-text'] = Math.min(lowest['scrim-text'], textOn('text', under));
    lowest['scrim-text-muted'] = Math.min(lowest['scrim-text-muted'], textOn('text-muted', under));
  }
  for (const under of tooltips) {
    lowest['tooltip-text'] = Math.min(lowest['tooltip-text'], textOn('text', under));
  }
```

4. Ngay dưới đó, trong vòng `for (const surface of surfaces)`:
   - Đổi `const measured: Record<CheckId, number> = {` thành `const measured: Omit<Record<CheckId, number>, OverlayCheck> = {`.
   - Đổi dòng cuối vòng lặp `for (const id of CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);` thành:

```ts
    for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
```

- [ ] **Step 5: Chạy test và script tương phản**

Run: `pnpm vitest run --project scripts && pnpm check:contrast | grep -E "scrim|tooltip|passed"`
Expected:
- Mọi test PASS.
- Script in 12 dòng `pass`. Ở chế độ `default`, các số là:

  | Theme | `scrim-text` | `scrim-text-muted` | `tooltip-text` |
  |---|---|---|---|
  | light | 9.93 | 5.08 | 10.95 |
  | dark | 9.17 | 5.19 | 7.13 |

- Dòng cuối là `Contrast check passed.`

- [ ] **Step 6: Nâng mốc trình duyệt và thêm `@floating-ui/dom`**

Trong `package.json`, mảng `browserslist`, đổi `"Safari >= 16.4"` thành `"Safari >= 17.4"` và `"iOS >= 16.4"` thành `"iOS >= 17.4"`.

Run: `pnpm add --save-exact @floating-ui/dom@1.8.0`
Expected: `package.json` có `"dependencies": { "@floating-ui/dom": "1.8.0", "clsx": "2.1.1" }`, `pnpm-lock.yaml` được cập nhật.

- [ ] **Step 7: Build và kiểm tra gói**

Run: `pnpm build && grep -o "\-\-flg-scrim[^;]*;" src/styles/generated/theme.css | sort -u && pnpm check:package`
Expected:
- `grep` in ra `--flg-scrim-blur: 0px;`, `--flg-scrim-blur: 6px;`, `--flg-scrim: rgba(0,0,0,.45);`, `--flg-scrim: rgba(15,20,40,.28);`.
- `check:package` PASS: JS chưa dùng Floating UI nên kích thước chưa đổi.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add package.json pnpm-lock.yaml src/styles/theme/values.ts scripts/lib/theme-css.test.ts scripts/lib/contrast.ts
git commit -m "feat!: raise the browser floor to Safari 17.4 and add the scrim tokens" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: `Slot` nhận con là lazy reference (sửa lỗi từ giai đoạn 1)

**Files:**
- Create: `src/internal/react-lazy.ts`
- Modify: `src/internal/slot.tsx`, `src/internal/field-context.tsx`
- Test: `src/internal/slot.test.tsx`

**Interfaces:**
- Consumes: không có gì mới.
- Produces: `resolveLazy<T>(value: T): T`. Tooltip (Task 7) dùng hàm này. Mọi `asChild` (Button, IconButton, Card, các trigger của plan này) nhận được con do Server Component truyền xuống ở development.

- [ ] **Step 1: Viết test fail**

Trong `src/internal/slot.test.tsx`:
- Thêm `import type { ReactElement } from 'react';` ngay sau dòng `import { createRef } from 'react';`.
- Thêm test sau, ngay trước `it('lets child props win over slot props', ...)`:

```tsx
  it('renders a child that a Server Component passed as a lazy reference', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // What React's Flight client hands over in development: the element, behind a lazy reference.
    const lazy = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: <a href="/x">Link</a>,
      _init: (payload: unknown) => payload,
    } as unknown as ReactElement;
    render(<Slot className="from-slot">{lazy}</Slot>);
    expect(screen.getByRole('link', { name: 'Link' })).toHaveClass('from-slot');
    expect(warn).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/internal/slot.test.tsx`
Expected: test mới FAIL ở cả hai project, vì không tìm thấy link: `Slot` coi lazy reference là con không hợp lệ và render `null`.

- [ ] **Step 3: Viết `react-lazy.ts`**

Tạo `src/internal/react-lazy.ts`:

```ts
const REACT_LAZY = Symbol.for('react.lazy');

interface Lazy {
  $$typeof: symbol;
  _payload: unknown;
  _init: (payload: unknown) => unknown;
}

const isLazy = (value: unknown): value is Lazy =>
  typeof value === 'object' && value !== null && (value as Lazy).$$typeof === REACT_LAZY;

/**
 * What a React lazy reference stands for. A Server Component passes client components down as lazy
 * references, and in development it can pass a child element as one too. Reading one returns the
 * value once its code or data has loaded, and suspends until then, just as rendering it would.
 * Anything else is returned unchanged.
 */
export function resolveLazy<T>(value: T): T {
  let current: unknown = value;
  while (isLazy(current)) current = current._init(current._payload);
  return current as T;
}
```

- [ ] **Step 4: Dùng `resolveLazy` trong `Slot` và Field**

Trong `src/internal/slot.tsx`:
- Thêm `import { resolveLazy } from './react-lazy';` ngay sau `import { mergeRefs } from './merge-refs';`.
- Thay phần đầu của `Slot`:

```tsx
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...slotProps },
  forwardedRef,
) {
```

bằng:

```tsx
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children: rawChildren, ...slotProps },
  forwardedRef,
) {
  const children = resolveLazy(rawChildren);
```

Trong `src/internal/field-context.tsx`:
- Thêm `import { resolveLazy } from './react-lazy';` ngay trước `import { devWarn } from './warn';`.
- Xoá hằng `REACT_LAZY` và interface `LazyComponent`.
- Thay toàn bộ hàm `resolveType` bằng:

```tsx
function resolveType(node: ReactNode): unknown {
  const element = resolveLazy(node);
  return isValidElement(element) ? resolveLazy(element.type) : undefined;
}
```

- [ ] **Step 5: Chạy test**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected:
- Mọi test PASS, gồm test mới ở cả React 19 và 18.3.
- Các test lazy reference của Field ở Plan 3 vẫn PASS, vì hành vi đó không đổi.

- [ ] **Step 6: Format và commit**

```bash
pnpm format
git add src/internal/react-lazy.ts src/internal/slot.tsx src/internal/slot.test.tsx src/internal/field-context.tsx
git commit -m "fix: let asChild take a child that a Server Component passed as a lazy reference" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: Primitive nội bộ: controllable state, khoá cuộn, modal stack, focus

**Files:**
- Create: `src/internal/use-iso-layout-effect.ts`, `src/internal/use-controllable-state.ts`, `src/internal/lock-scroll.ts`, `src/internal/modal-stack.ts`, `src/internal/focus.ts`
- Test: `src/internal/use-controllable-state.test.tsx`, `src/internal/lock-scroll.test.ts`, `src/internal/modal-stack.test.ts`

**Interfaces:**
- Consumes: `devWarn` (`src/internal/warn.ts`).
- Produces:
  - `useIsoLayoutEffect`: `useLayoutEffect` trên trình duyệt, `useEffect` trên server.
  - `useControllableState<T>({ value, defaultValue, onChange, name }): [T, (next: T) => void]`. `value === undefined` nghĩa là uncontrolled. Setter giữ nguyên identity qua các lần render.
  - `lockScroll(): () => void`.
  - `ModalEntry { dialog: HTMLDialogElement; host: HTMLElement }`, `registerModal(entry): () => void`, `getTopModal(): ModalEntry | undefined`, `subscribeModals(listener): () => void`.
  - `isFocusable(el): el is HTMLElement`, `getFocusables(root): HTMLElement[]`, `focusFirst(root, fallback = root): void`.
  - `focus.ts` dùng `checkVisibility()`, nên không test được trong jsdom. Nó được kiểm qua story ở Task 4–7.

- [ ] **Step 1: Viết test fail**

Tạo `src/internal/use-controllable-state.test.tsx`:

```tsx
import { act, render, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useControllableState } from './use-controllable-state';
import { resetDevWarnings } from './warn';

describe('useControllableState', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('keeps its own value when uncontrolled and reports every change', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: false, onChange, name: 'Test' }),
    );
    expect(result.current[0]).toBe(false);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('follows the parent when controlled and only asks for a change', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, defaultValue: false, onChange, name: 'Test' }),
      { initialProps: { value: false as boolean | undefined } },
    );
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(result.current[0]).toBe(false);
    rerender({ value: true });
    expect(result.current[0]).toBe(true);
  });

  it('does not report a value that did not change, even when set twice before a render', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: 'a', onChange, name: 'Test' }),
    );
    act(() => {
      result.current[1]('a');
      result.current[1]('b');
      result.current[1]('b');
    });
    expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('keeps the same setter across renders', () => {
    const { result, rerender } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: 0, name: 'Test' }),
    );
    const first = result.current[1];
    act(() => first(1));
    rerender();
    expect(result.current[1]).toBe(first);
  });

  it('warns once when a component switches between controlled and uncontrolled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    function Probe({ value }: { value: boolean | undefined }) {
      useControllableState({ value, defaultValue: false, name: 'Dialog' });
      return null;
    }
    function Parent() {
      const [value, setValue] = useState<boolean | undefined>(undefined);
      return (
        <>
          <Probe value={value} />
          <button type="button" onClick={() => setValue(true)}>
            control
          </button>
        </>
      );
    }
    const { getByRole } = render(<Parent />);
    act(() => getByRole('button').click());
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] Dialog is changing from uncontrolled to controlled. Pick one for the ' +
        'lifetime of the component.',
    );
  });
});
```

Tạo `src/internal/lock-scroll.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lockScroll } from './lock-scroll';

const root = document.documentElement;

function withScrollbar(width: number) {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000);
  vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(1000 - width);
}

describe('lockScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    root.removeAttribute('style');
  });

  it('hides the overflow of <html> and keeps the scrollbar space while locked', () => {
    withScrollbar(15);
    const release = lockScroll();
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.scrollbarGutter).toBe('stable');
    release();
    expect(root.style.overflow).toBe('');
    expect(root.style.scrollbarGutter).toBe('');
  });

  it('adds no gutter when the page shows no classic scrollbar', () => {
    withScrollbar(0);
    const release = lockScroll();
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.scrollbarGutter).toBe('');
    release();
  });

  it('stays locked until the last of several locks is released', () => {
    withScrollbar(15);
    const first = lockScroll();
    const second = lockScroll();
    first();
    expect(root.style.overflow).toBe('hidden');
    second();
    expect(root.style.overflow).toBe('');
  });

  it('ignores a release called twice, and restores the inline style the page had', () => {
    withScrollbar(15);
    root.style.overflow = 'scroll';
    const first = lockScroll();
    const second = lockScroll();
    first();
    first();
    expect(root.style.overflow).toBe('hidden');
    second();
    expect(root.style.overflow).toBe('scroll');
  });
});
```

Tạo `src/internal/modal-stack.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { getTopModal, registerModal, subscribeModals } from './modal-stack';

const entry = () => ({
  dialog: document.createElement('dialog'),
  host: document.createElement('div'),
});

describe('modal stack', () => {
  it('returns the modal opened last, and the one below once it closes', () => {
    const first = entry();
    const second = entry();
    const removeFirst = registerModal(first);
    const removeSecond = registerModal(second);
    expect(getTopModal()).toBe(second);
    removeSecond();
    expect(getTopModal()).toBe(first);
    removeFirst();
    expect(getTopModal()).toBeUndefined();
  });

  it('lets a modal below the top one close first', () => {
    const first = entry();
    const second = entry();
    const removeFirst = registerModal(first);
    const removeSecond = registerModal(second);
    removeFirst();
    expect(getTopModal()).toBe(second);
    removeSecond();
  });

  it('notifies subscribers on every change, and not after they unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeModals(listener);
    const remove = registerModal(entry());
    remove();
    remove();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    registerModal(entry())();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/use-controllable-state.test.tsx src/internal/lock-scroll.test.ts src/internal/modal-stack.test.ts`
Expected: cả ba file FAIL với `Failed to resolve import "./use-controllable-state"` (và tương tự cho `./lock-scroll`, `./modal-stack`).

- [ ] **Step 3: Viết các primitive**

Tạo `src/internal/use-iso-layout-effect.ts`:

```ts
import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server, where React 18 warns about layout
 * effects. Overlays need it to open, measure and move focus before the browser paints.
 */
export const useIsoLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
```

Tạo `src/internal/use-controllable-state.ts`:

```ts
import { useCallback, useRef, useState } from 'react';
import { devWarn } from './warn';

export interface ControllableStateOptions<T> {
  /** The controlled value. `undefined` means uncontrolled. */
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  /** Names the component in the dev warning, for example `"Dialog"`. */
  name: string;
}

/**
 * State that a parent may own (`value`) or leave to the component (`defaultValue`). The setter calls
 * `onChange` whenever the value changes, and stores the value itself only when uncontrolled.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  name,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const wasControlled = useRef(controlled);
  if (wasControlled.current !== controlled) {
    devWarn(
      `${name} is changing from ${wasControlled.current ? 'controlled' : 'uncontrolled'} to ` +
        `${controlled ? 'controlled' : 'uncontrolled'}. Pick one for the lifetime of the component.`,
    );
    wasControlled.current = controlled;
  }
  const current = controlled ? value : internal;

  // The latest values, read by a setter whose identity never changes.
  const latest = useRef({ current, controlled, onChange });
  latest.current = { current, controlled, onChange };

  const setValue = useCallback((next: T) => {
    const { current: before, controlled: isControlled, onChange: notify } = latest.current;
    if (Object.is(before, next)) return;
    if (!isControlled) setInternal(next);
    latest.current = { ...latest.current, current: next };
    notify?.(next);
  }, []);

  return [current, setValue];
}
```

Tạo `src/internal/lock-scroll.ts`:

```ts
let locks = 0;
let saved: { overflow: string; gutter: string } | null = null;

/**
 * Stops the page from scrolling while a modal is open. Counted, so nested modals share one lock: the
 * first call saves the inline style of `<html>`, the last release restores it. When the page shows a
 * classic scrollbar, `scrollbar-gutter: stable` keeps its space so the layout does not shift.
 * Returns the release function; calling it twice is safe.
 */
export function lockScroll(): () => void {
  const root = document.documentElement;
  if (locks === 0) {
    saved = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    const hasScrollbar = window.innerWidth > root.clientWidth;
    root.style.overflow = 'hidden';
    if (hasScrollbar) root.style.scrollbarGutter = 'stable';
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0 && saved) {
      root.style.overflow = saved.overflow;
      root.style.scrollbarGutter = saved.gutter;
      saved = null;
    }
  };
}
```

Tạo `src/internal/modal-stack.ts`:

```ts
/** A library `<dialog>` that is open as a modal, and the element the Toaster renders into. */
export interface ModalEntry {
  readonly dialog: HTMLDialogElement;
  readonly host: HTMLElement;
}

let stack: readonly ModalEntry[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Adds an open modal on top of the stack. Returns the function that removes it again. */
export function registerModal(entry: ModalEntry): () => void {
  stack = [...stack, entry];
  emit();
  return () => {
    if (!stack.includes(entry)) return;
    stack = stack.filter((item) => item !== entry);
    emit();
  };
}

/** The modal opened last, if any. The same object is returned until the stack changes. */
export function getTopModal(): ModalEntry | undefined {
  return stack[stack.length - 1];
}

/** Calls `listener` after every change to the stack. Returns the unsubscribe function. */
export function subscribeModals(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
```

Tạo `src/internal/focus.ts`:

```ts
const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

function isVisible(el: HTMLElement): boolean {
  return typeof el.checkVisibility === 'function'
    ? el.checkVisibility()
    : el.getClientRects().length > 0;
}

/** True when the element can receive keyboard focus with Tab. */
export function isFocusable(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    el.matches(TABBABLE) &&
    el.tabIndex >= 0 &&
    !el.closest('[inert]') &&
    isVisible(el)
  );
}

/** Every element inside `root` that Tab reaches, in DOM order. */
export function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll(TABBABLE)).filter(isFocusable);
}

/** Focuses the first focusable element inside `root`, or `fallback` when there is none. */
export function focusFirst(root: HTMLElement, fallback: HTMLElement = root): void {
  (getFocusables(root)[0] ?? fallback).focus({ preventScroll: true });
}
```

- [ ] **Step 4: Chạy test**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: mọi test PASS. Tổng số: 398 PASS, 2 skipped. Số này gồm:
- 5 test của `use-controllable-state` × 2 project React;
- 4 test của `lock-scroll`;
- 3 test của `modal-stack`;
- 2 test `Slot` của Task 2.

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add src/internal/use-iso-layout-effect.ts src/internal/use-controllable-state.ts src/internal/use-controllable-state.test.tsx src/internal/lock-scroll.ts src/internal/lock-scroll.test.ts src/internal/modal-stack.ts src/internal/modal-stack.test.ts src/internal/focus.ts
git commit -m "feat: add controllable state, scroll lock, modal stack and focus helpers" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: Dialog (kèm hạ tầng story cho overlay)

**Files:**
- Create: `src/components/dialog/modal.tsx`, `src/components/dialog/Dialog.tsx`, `src/components/dialog/index.ts`, `src/components/dialog/Dialog.stories.tsx`, `src/components/dialog/Dialog.mdx`, `src/styles/components/dialog.css`, `.storybook/real-input.ts`
- Test: `src/components/dialog/Dialog.test.tsx`, `src/components/dialog/Dialog.stories.tsx`
- Modify: `.storybook/preview.tsx`, `.storybook/stage.css`, `vitest.config.ts`, `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes:
  - `useControllableState`, `useIsoLayoutEffect`, `lockScroll`, `registerModal`, `focusFirst` (Task 3).
  - `Slot`, `mergeRefs`, `composeEventHandlers`, `devWarn` (giai đoạn 1).
  - `Button`, `ButtonProps`.
- Produces:
  - Từ `modal.tsx` (Drawer dùng ở Task 5):
    - `ModalRoot`, `ModalRootProps { open?, defaultOpen?, onOpenChange?, children? }`.
    - `ModalPartProps { part: string }`.
    - `ModalTrigger`, `ModalClose` (`ButtonProps & ModalPartProps`).
    - `ModalContent`, `ModalContentProps { closeOnOutsideClick?, initialFocus? }`. Nội bộ còn nhận `part`, `alert`, `frameData`, `panelClassName`, `panelData`.
    - `ModalTitle`, `ModalTitleProps { asChild? }`, `ModalDescription`.
  - Public: `Dialog`, `DialogTrigger`, `DialogClose`, `DialogContent` (`size`, `alert`, `closeOnOutsideClick`, `initialFocus`), `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, kèm kiểu props của từng phần và `DialogSize`.
  - Story:
    - `realUserEvent(): Promise<RealUserEvent | null>` và `settled(el): Promise<void>` từ `.storybook/real-input.ts`.
    - `parameters: { stage: 'viewport' }` cho story.
  - Class: `.flg-dialog`, `.flg-dialog-panel`, `.flg-toast-host`.

- [ ] **Step 1: Hạ tầng story cho overlay**

Tạo `.storybook/real-input.ts`:

```ts
// Trusted keyboard and pointer input for play functions. A native <dialog> closes on Esc, and a
// popover closes on an outside press, only for input the browser trusts. Testing Library's userEvent
// dispatches synthetic events, which it ignores. Under `pnpm test:stories` the stories run in Vitest
// browser mode, whose userEvent drives Playwright, so its input is real. In the Storybook UI there is
// no such input, and this returns null: play functions skip the steps that need it.
import type { userEvent as vitestUserEvent } from 'vitest/browser';

export type RealUserEvent = typeof vitestUserEvent;

export async function realUserEvent(): Promise<RealUserEvent | null> {
  if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return null;
  const { userEvent } = await import('vitest/browser');
  return userEvent;
}

/** Waits for the element's enter animation, so measurements see where it really lands. */
export async function settled(el: Element): Promise<void> {
  await Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
```

Trong `.storybook/preview.tsx`, trong `withStage`, thêm thuộc tính sau ngay dưới dòng `data-backdrop={backdrop === 'mockup' ? 'mockup' : 'solid'}`:

```tsx
      data-stage={context.parameters.stage === 'viewport' ? 'viewport' : undefined}
```

Trong `.storybook/stage.css`, chèn khối sau ngay trước `.flg-stage[data-backdrop='mockup'][data-flg-theme='light'] {` đầu tiên:

```css
/* Overlays live in the top layer, outside the stage box; a stage as big as the viewport keeps them
   inside the visual-test screenshot. */
.flg-stage[data-stage='viewport'] {
  min-height: 100vh;
}

```

Trong `vitest.config.ts`, trong `storybookProject`, thêm vào `test` ngay sau dòng `` name: `storybook-${theme}`, ``:

```ts
    // Overlay stories drive trusted input through Playwright (.storybook/real-input.ts), which only
    // reaches the right story when one test file runs at a time.
    fileParallelism: false,
```

- [ ] **Step 2: Viết test fail**

Tạo `src/components/dialog/Dialog.test.tsx`:

```tsx
import { act, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Dialog, DialogContent, DialogTitle } from './Dialog';

// jsdom has no showModal(). This stand-in is just enough for the state logic: it toggles `open` and,
// like a browser, fires `close` in a later task rather than at once.
const original = {
  showModal: HTMLDialogElement.prototype.showModal,
  close: HTMLDialogElement.prototype.close,
};
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    setTimeout(() => this.dispatchEvent(new Event('close')), 0);
  };
});
afterAll(() => Object.assign(HTMLDialogElement.prototype, original));

describe('Dialog', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('stays open when StrictMode mounts it twice', async () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <StrictMode>
        <Dialog defaultOpen onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
      </StrictMode>,
    );
    // The late `close` event of StrictMode's first, simulated unmount must not close it again.
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(container.querySelector('dialog')).toHaveAttribute('open');
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('warns when it has no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Dialog defaultOpen>
        <DialogContent>Unnamed</DialogContent>
      </Dialog>,
    );
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] <DialogContent> needs a name: render a DialogTitle inside it, or pass ' +
        'aria-label or aria-labelledby.',
    );
  });

  it('does not warn when a title or aria-label names it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { getByRole } = render(
      <>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogContent>
        </Dialog>
        <Dialog defaultOpen>
          <DialogContent aria-label="Share">Link</DialogContent>
        </Dialog>
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
    expect(getByRole('dialog', { name: 'Edit profile' })).toBeInTheDocument();
  });
});
```

Tạo `src/components/dialog/Dialog.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Field } from '../field/Field';
import { Input } from '../input/Input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Your name is shown to everyone in the workspace.</DialogDescription>
    </DialogHeader>
    <Field label="Name">
      <Input defaultValue="Minh An" />
    </Field>
    <DialogFooter>
      <DialogClose variant="ghost">Cancel</DialogClose>
      <DialogClose>Save</DialogClose>
    </DialogFooter>
  </>
);

// The <dialog> sits in the top layer but stays inside the story in the DOM.
const dialogIn = (canvasElement: HTMLElement) =>
  canvasElement.querySelector('dialog') as HTMLDialogElement;

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Edit profile' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-controls');

    await userEvent.click(trigger);
    const dialog = canvas.getByRole('dialog', { name: 'Edit profile' }) as HTMLDialogElement;
    await expect(dialog).toHaveAccessibleDescription(
      'Your name is shown to everyone in the workspace.',
    );
    await expect(dialog.matches(':modal')).toBe(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    // Focus moves to the first focusable element; the page behind cannot scroll.
    await expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus();
    await expect(document.documentElement.style.overflow).toBe('hidden');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await expect(dialog.open).toBe(false);
    await expect(trigger).toHaveFocus();
    await expect(document.documentElement.style.overflow).toBe('');
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    const real = await realUserEvent();
    if (!real) return;
    // Esc, through the browser's own close request.
    await real.click(trigger);
    await expect(dialog.open).toBe(true);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(trigger).toHaveFocus();
    // A click on the frame, outside the panel.
    await real.click(trigger);
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(trigger).toHaveFocus();
  },
};

export const DragOutOfThePanel: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const dialog = dialogIn(canvasElement);
    await expect(dialog.open).toBe(true);
    const real = await realUserEvent();
    if (!real) return;
    // Selecting text that starts in the panel and ends outside it is not an outside click.
    const description = within(dialog).getByText(/Your name is shown/);
    await real.dragAndDrop(description, dialog, { targetPosition: { x: 4, y: 4 } });
    await expect(dialog.open).toBe(true);
  },
};

export const Open: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  ),
};

export const Alert: Story = {
  render: (args) => (
    <Dialog {...args} defaultOpen>
      <DialogContent alert size="sm">
        <DialogHeader>
          <DialogTitle>Delete this project?</DialogTitle>
          <DialogDescription>
            Its 14 files are deleted too. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose variant="ghost">Cancel</DialogClose>
          <DialogClose variant="danger">Delete project</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas }) => {
    const dialog = canvas.getByRole('alertdialog', {
      name: 'Delete this project?',
    }) as HTMLDialogElement;
    // The least destructive action comes first, so it takes the focus.
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    const real = await realUserEvent();
    if (!real) return;
    await real.click(dialog, { position: { x: 4, y: 4 } });
    await expect(dialog.open).toBe(true);
  },
};

function ControlledDialog() {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(true);
  return (
    <Dialog open={open} onOpenChange={(next) => (next || !dirty) && setOpen(next)}>
      <DialogTrigger variant="secondary">Rename</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Rename file</DialogTitle>
        <Button variant="secondary" onClick={() => setDirty(false)}>
          Discard changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export const Controlled: Story = {
  tags: ['no-visual'],
  render: () => <ControlledDialog />,
  play: async ({ canvas, canvasElement }) => {
    const real = await realUserEvent();
    if (!real) return;
    await real.click(canvas.getByRole('button', { name: 'Rename' }));
    const dialog = dialogIn(canvasElement);
    await expect(dialog.open).toBe(true);
    // The parent refuses to close while there are changes: Esc does nothing.
    await real.keyboard('{Escape}');
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(dialog.open).toBe(true);
    await real.click(within(dialog).getByRole('button', { name: 'Discard changes' }));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};
```

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/dialog`
Expected: FAIL với `Failed to resolve import "./Dialog"`.

- [ ] **Step 4: Viết lõi modal và Dialog**

Tạo `src/components/dialog/modal.tsx`. Lưu ý:
- Tệp này không có `"use client"`.
- Dòng `eslint-disable-next-line` phải nằm ngay trên `<dialog`.

```tsx
import { clsx } from 'clsx';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
  Ref,
  RefObject,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { focusFirst } from '../../internal/focus';
import { lockScroll } from '../../internal/lock-scroll';
import { mergeRefs } from '../../internal/merge-refs';
import { registerModal } from '../../internal/modal-stack';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';

// The shared core of Dialog and Drawer (spec §3.4): a native modal `<dialog>` that is a transparent,
// full-viewport frame around the glass panel, with the toast host as the panel's sibling.

interface ModalContextValue {
  /** `"Dialog"` or `"Drawer"`, for dev warnings. */
  name: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string | undefined;
  descriptionId: string | undefined;
  setTitleId: (id: string | undefined) => void;
  setDescriptionId: (id: string | undefined) => void;
  /** Set during layout, so a passive effect in the same commit already sees the title. */
  titleRef: MutableRefObject<string | undefined>;
  /** The trigger, if there is one: where focus returns when nothing had it before opening. */
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const noop = () => {};

function useModalContext(part: string): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside its <Dialog> or <Drawer>.`);
    return {
      name: 'Dialog',
      open: false,
      setOpen: noop,
      contentId: '',
      titleId: undefined,
      descriptionId: undefined,
      setTitleId: noop,
      setDescriptionId: noop,
      titleRef: { current: undefined },
      triggerRef: { current: null },
    };
  }
  return ctx;
}

export interface ModalRootProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function ModalRoot({
  name,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: ModalRootProps & { name: string }) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name,
  });
  const contentId = useId();
  const [titleId, setTitleId] = useState<string | undefined>();
  const [descriptionId, setDescriptionId] = useState<string | undefined>();
  const titleRef = useRef<string | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const value = useMemo(
    () => ({
      name,
      open: isOpen,
      setOpen,
      contentId,
      titleId,
      descriptionId,
      setTitleId,
      setDescriptionId,
      titleRef,
      triggerRef,
    }),
    [name, isOpen, setOpen, contentId, titleId, descriptionId],
  );
  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export interface ModalPartProps {
  /** The public name of the part, for dev warnings. */
  part: string;
}

export const ModalTrigger = forwardRef<HTMLButtonElement, ButtonProps & ModalPartProps>(
  function ModalTrigger({ part, onClick, ...props }, ref) {
    const ctx = useModalContext(part);
    return (
      <Button
        ref={mergeRefs(ref, ctx.triggerRef)}
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        {...props}
        onClick={composeEventHandlers(onClick, () => ctx.setOpen(true))}
      />
    );
  },
);

export const ModalClose = forwardRef<HTMLButtonElement, ButtonProps & ModalPartProps>(
  function ModalClose({ part, onClick, ...props }, ref) {
    const ctx = useModalContext(part);
    return (
      <Button
        ref={ref}
        {...props}
        onClick={composeEventHandlers(onClick, () => ctx.setOpen(false))}
      />
    );
  },
);

export interface ModalContentProps extends Omit<HTMLAttributes<HTMLDialogElement>, 'id'> {
  /** Close when the user clicks outside the panel. Default `true`. */
  closeOnOutsideClick?: boolean;
  /** The element that receives focus when it opens. Default: the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>;
}

interface ModalContentInternalProps extends ModalContentProps {
  part: string;
  alert?: boolean | undefined;
  /** Data attributes for the frame: `data-kind`, `data-side`, `data-variant`. */
  frameData: Record<`data-${string}`, string | undefined>;
  panelClassName: string;
  panelData?: Record<`data-${string}`, string | undefined>;
}

export const ModalContent = forwardRef<HTMLDialogElement, ModalContentInternalProps>(
  function ModalContent(
    {
      part,
      alert = false,
      closeOnOutsideClick = true,
      initialFocus,
      frameData,
      panelClassName,
      panelData,
      className,
      style,
      children,
      onPointerDown,
      onClick,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const ctx = useModalContext(part);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hostRef = useRef<HTMLDivElement>(null);
    const [, forceRender] = useReducer((count: number) => count + 1, 0);

    const session = useRef<{
      previous: HTMLElement | null;
      release: () => void;
      unregister: () => void;
    } | null>(null);

    const latest = useRef({ open: ctx.open, setOpen: ctx.setOpen });
    latest.current = { open: ctx.open, setOpen: ctx.setOpen };

    // Releases the scroll lock and the modal-stack entry and returns focus. Safe to call twice.
    const teardown = useRef(() => {
      const current = session.current;
      if (!current) return;
      session.current = null;
      current.release();
      current.unregister();
      const active = document.activeElement;
      const dialog = dialogRef.current;
      if (
        current.previous?.isConnected &&
        (active === null || active === document.body || (dialog?.contains(active) ?? false))
      ) {
        current.previous.focus({ preventScroll: true });
      }
    }).current;

    // Runs after every render: the dialog follows `open`, whatever closed it last.
    useIsoLayoutEffect(() => {
      const dialog = dialogRef.current;
      const host = hostRef.current;
      if (!dialog || !host || !dialog.isConnected) return;
      if (ctx.open && !dialog.open) {
        // Safari does not focus a button that is clicked, so nothing may have focus: then the
        // trigger is where focus returns.
        const active = document.activeElement;
        const previous =
          active instanceof HTMLElement && active !== document.body
            ? active
            : ctx.triggerRef.current;
        dialog.showModal();
        session.current = {
          previous,
          release: lockScroll(),
          unregister: registerModal({ dialog, host }),
        };
        const panel = panelRef.current;
        const target = initialFocus?.current;
        if (target) target.focus({ preventScroll: true });
        else if (panel) focusFirst(panel);
      } else if (!ctx.open && dialog.open) {
        dialog.close();
        teardown();
      }
    });

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      // Esc: the parent decides, so the native close is cancelled and the request goes through state.
      const onCancel = (event: Event) => {
        event.preventDefault();
        latest.current.setOpen(false);
        forceRender();
      };
      // Closed without the library: `<form method="dialog">`, or Chromium closing on a repeated Esc.
      // The event arrives a task later, so a dialog that opened again since then ignores it: that is
      // what StrictMode's simulated unmount and remount leaves behind.
      const onClose = () => {
        if (dialog.open) return;
        teardown();
        if (latest.current.open) {
          latest.current.setOpen(false);
          forceRender();
        }
      };
      dialog.addEventListener('cancel', onCancel);
      dialog.addEventListener('close', onClose);
      return () => {
        dialog.removeEventListener('cancel', onCancel);
        dialog.removeEventListener('close', onClose);
        if (dialog.open) dialog.close();
        teardown();
      };
    }, [teardown]);

    const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
    useEffect(() => {
      if (ctx.open && !named && ctx.titleRef.current === undefined) {
        devWarn(
          `<${part}> needs a name: render a ${ctx.name}Title inside it, or pass aria-label or ` +
            'aria-labelledby.',
        );
      }
    }, [ctx.open, ctx.name, ctx.titleRef, named, part]);

    // A click outside the panel lands on the frame itself. Both the press and the release must, so
    // selecting text inside the panel and releasing outside does not close it.
    const pressedOnFrame = useRef(false);
    const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
      pressedOnFrame.current = event.target === event.currentTarget;
    };
    const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
      const outside = pressedOnFrame.current && event.target === event.currentTarget;
      pressedOnFrame.current = false;
      if (outside && closeOnOutsideClick && !alert) ctx.setOpen(false);
    };

    return (
      // The click handler only catches a click on the frame around the panel, a pointer shortcut
      // for closing; Esc is the keyboard way, and the browser handles it.
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
      <dialog
        ref={mergeRefs(ref, dialogRef)}
        role={alert ? 'alertdialog' : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy ?? (ariaLabel === undefined ? ctx.titleId : undefined)}
        aria-describedby={ariaDescribedBy ?? ctx.descriptionId}
        {...props}
        {...frameData}
        id={ctx.contentId}
        className="flg-dialog"
        onPointerDown={composeEventHandlers(onPointerDown, handlePointerDown)}
        onClick={composeEventHandlers(onClick, handleClick)}
      >
        {ctx.open ? (
          <div
            ref={panelRef}
            className={clsx('flg-surface flg-card', panelClassName, className)}
            style={style as CSSProperties | undefined}
            tabIndex={-1}
            {...panelData}
          >
            {children}
          </div>
        ) : null}
        <div ref={hostRef} className="flg-toast-host" />
      </dialog>
    );
  },
);

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Render the single child element (another heading level) instead of an `h2`. */
  asChild?: boolean;
}

export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps & ModalPartProps>(
  function ModalTitle({ part, asChild = false, id: idProp, className, children, ...props }, ref) {
    const ctx = useModalContext(part);
    const generated = useId();
    const id = idProp ?? generated;
    const { setTitleId, titleRef } = ctx;
    useIsoLayoutEffect(() => {
      titleRef.current = id;
      setTitleId(id);
      return () => {
        titleRef.current = undefined;
        setTitleId(undefined);
      };
    }, [id, setTitleId, titleRef]);
    const shared = { id, className: clsx('flg-card-title', className), ...props };
    if (asChild) {
      return (
        <Slot ref={ref as Ref<HTMLElement>} {...shared}>
          {children}
        </Slot>
      );
    }
    return (
      <h2 ref={ref} {...shared}>
        {children}
      </h2>
    );
  },
);

export const ModalDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement> & ModalPartProps
>(function ModalDescription({ part, id: idProp, className, ...props }, ref) {
  const ctx = useModalContext(part);
  const generated = useId();
  const id = idProp ?? generated;
  const { setDescriptionId } = ctx;
  useIsoLayoutEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);
  return <p ref={ref} id={id} className={clsx('flg-card-description', className)} {...props} />;
});
```

Tạo `src/components/dialog/Dialog.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { ButtonProps } from '../button/Button';
import {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from './modal';
import type { ModalContentProps, ModalRootProps, ModalTitleProps } from './modal';

export type DialogProps = ModalRootProps;
export type DialogTriggerProps = ButtonProps;
export type DialogCloseProps = ButtonProps;
export type DialogSize = 'sm' | 'md' | 'lg';
export interface DialogContentProps extends ModalContentProps {
  /** Panel width: 360, 480 or 640px. Default `"md"`. */
  size?: DialogSize;
  /** For a decision the user must take: `role="alertdialog"`, and an outside click does not close. */
  alert?: boolean;
}
export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;
export type DialogTitleProps = ModalTitleProps;
export type DialogDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

/** A modal dialog on the native `<dialog>`. Renders no element of its own. */
export function Dialog(props: DialogProps) {
  return <ModalRoot name="Dialog" {...props} />;
}

/** Opens the dialog. Renders the library's `Button` and takes its props, `asChild` included. */
export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger(props, ref) {
    return <ModalTrigger ref={ref} part="DialogTrigger" {...props} />;
  },
);

/** Closes the dialog. Renders the library's `Button` and takes its props, `asChild` included. */
export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  function DialogClose(props, ref) {
    return <ModalClose ref={ref} part="DialogClose" {...props} />;
  },
);

/**
 * The `<dialog>` and its glass panel. The ref and the ARIA attributes go to the `<dialog>`;
 * `className` and `style` go to the panel.
 */
export const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(
  function DialogContent({ size = 'md', alert, ...props }, ref) {
    return (
      <ModalContent
        ref={ref}
        part="DialogContent"
        alert={alert}
        frameData={{ 'data-kind': 'dialog' }}
        panelClassName="flg-dialog-panel"
        panelData={{ 'data-size': size }}
        {...props}
      />
    );
  },
);

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-header', className)} {...props} />;
});

/** The dialog's name. Renders an `h2`; `asChild` renders another heading level. */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle(props, ref) {
    return <ModalTitle ref={ref} part="DialogTitle" {...props} />;
  },
);

/** Becomes the dialog's accessible description. */
export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription(props, ref) {
    return <ModalDescription ref={ref} part="DialogDescription" {...props} />;
  },
);

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-footer', className)} {...props} />;
});
```

Tạo `src/components/dialog/index.ts`:

```ts
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog';
export type {
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogProps,
  DialogSize,
  DialogTitleProps,
  DialogTriggerProps,
} from './Dialog';
```

- [ ] **Step 5: Viết CSS của khung và panel**

Tạo `src/styles/components/dialog.css`. Task 5 sẽ thêm phần của Drawer vào cuối khối `@layer`.

```css
/* Dialog and Drawer (spec §3.4). The <dialog> is a transparent, full-viewport frame; the glass panel
   and the toast host sit inside it. The frame never gets opacity, transform, filter or
   backdrop-filter: each would cut the panel's glass off from the page behind it. */
@layer flg.components {
  .flg-dialog {
    position: fixed;
    inset: 0;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 16px;
    border: 0;
    background: transparent;
    color: var(--flg-text);
    overflow: hidden;
  }
  /* Only while open: the closed <dialog> keeps the browser's display: none. */
  .flg-dialog[open] {
    display: grid;
    place-items: center;
  }
  /* ::backdrop inherits the theme's custom properties from the <dialog> (Safari 17.4 and later). */
  .flg-dialog::backdrop {
    background: var(--flg-scrim);
    -webkit-backdrop-filter: blur(var(--flg-scrim-blur));
    backdrop-filter: blur(var(--flg-scrim-blur));
    transition: opacity var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-toast-host {
    display: contents;
  }
  .flg-dialog-panel {
    width: 480px;
    max-width: 100%;
    max-height: 100%;
    overflow: auto;
    outline: none;
    transition:
      opacity var(--flg-duration-normal) var(--flg-ease),
      transform var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-dialog-panel[data-size='sm'] {
    width: 360px;
  }
  .flg-dialog-panel[data-size='lg'] {
    width: 640px;
  }

  /* Enter animations (spec §3.5); there is no exit animation yet. */
  @starting-style {
    .flg-dialog[open]::backdrop {
      opacity: 0;
    }
    .flg-dialog[open] .flg-dialog-panel {
      opacity: 0;
      transform: scale(0.96);
    }
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/dialog.css';` ngay sau `@import './components/switch.css';`.

- [ ] **Step 6: Export và đăng ký**

Trong `src/index.ts`, thêm vào cuối file:

```ts
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/dialog';
export type {
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogProps,
  DialogSize,
  DialogTitleProps,
  DialogTriggerProps,
} from './components/dialog';
```

Trong `src/index.test.ts`, thêm vào mảng mong đợi, ngay sau `'Checkbox',`:

```ts
      'Dialog',
      'DialogClose',
      'DialogContent',
      'DialogDescription',
      'DialogFooter',
      'DialogHeader',
      'DialogTitle',
      'DialogTrigger',
```

Trong `scripts/check-use-client.ts`, thêm `'src/components/dialog/Dialog.tsx',` vào cuối `CLIENT_MODULES`.

Trong `scripts/check-dist-css.ts`, thêm `'flg-dialog',` và `'flg-dialog-panel',` vào cuối `SHIPPED_CLASSES`.

- [ ] **Step 7: Viết trang docs**

Tạo `src/components/dialog/Dialog.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Dialog.stories';

<Meta of={Stories} />

# Dialog

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'fl-glass-ui';

<Dialog>
  <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Your name is shown to everyone in the workspace.</DialogDescription>
    </DialogHeader>
    {/* form fields */}
    <DialogFooter>
      <DialogClose variant="ghost">Cancel</DialogClose>
      <DialogClose>Save</DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

<Canvas of={Stories.Default} />
<Controls />

## Sizes

`size` on `DialogContent` sets the panel width: `"sm"` 360px, `"md"` 480px (default), `"lg"`
640px. The panel never gets wider than the screen minus 32px, and scrolls when it is taller.

## Alert dialogs

For a decision the user must take, pass `alert`. The dialog gets `role="alertdialog"`, and a click
outside does not close it; Esc still does. Put the least destructive action first, so it gets the
focus.

## Controlled

Pass `open` and `onOpenChange` to own the state. Esc and an outside click only ask to close
through `onOpenChange(false)`: keep `open` true to refuse, for example while there are unsaved
changes.

## Accessibility

- It is a native `<dialog>` opened with `showModal()`: the rest of the page is inert, the page
  does not scroll, and there is no portal or z-index to manage.
- The `DialogTitle` names the dialog and the `DialogDescription` describes it. Without a title,
  pass `aria-label`.
- Focus moves to `initialFocus`, else to the first focusable element, else to the panel. On close
  it returns to where it was, or to the trigger.
- The ref and the ARIA attributes go to the `<dialog>`; `className` and `style` go to the panel.

## Do and don't

- Do give every dialog a title, and a way out that is not only Esc.
- Don't open a dialog from another dialog unless the second one is a short confirmation.
````

- [ ] **Step 8: Chạy test**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm vitest run --project storybook-light --project storybook-dark src/components/dialog`
Expected:
- `test:unit`: 404 PASS, 2 skipped (thêm 3 test của `Dialog.test.tsx` × 2 project React).
- Story: 30 test PASS (5 story × 3 trình duyệt × 2 theme).
- Nếu WebKit báo `Importing a module script failed` ở lần chạy đầu, chạy lại. Đó là Vite đang tối ưu một dependency mới gặp lần đầu, không phải lỗi của code.

- [ ] **Step 9: Build, ghi lại kích thước, kiểm tra gói**

Run: `pnpm build && pnpm size:record && pnpm check:package && pnpm test:stories`
Expected:
- `check:package` PASS, `check:use-client` in `... 11 client.`
- `test:stories`: 366 test PASS.

- [ ] **Step 10: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Dialog on the native dialog element" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Drawer

**Files:**
- Create: `src/components/drawer/Drawer.tsx`, `src/components/drawer/index.ts`, `src/components/drawer/Drawer.stories.tsx`, `src/components/drawer/Drawer.mdx`
- Modify: `src/styles/components/dialog.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `ModalRoot`, `ModalTrigger`, `ModalClose`, `ModalContent`, `ModalTitle`, `ModalDescription` và các kiểu của chúng (Task 4). `settled`, `realUserEvent` (Task 4).
- Produces: `Drawer`, `DrawerTrigger`, `DrawerClose`, `DrawerContent` (`side`, `variant`, `closeOnOutsideClick`, `initialFocus`), `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter`, kèm kiểu props, `DrawerSide`, `DrawerVariant`. Class `.flg-drawer-panel`.

- [ ] **Step 1: Viết story (test fail)**

Tạo `src/components/drawer/Drawer.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { CloseIcon } from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { IconButton } from '../icon-button/IconButton';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './Drawer';
import type { DrawerContentProps } from './Drawer';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '6px 12px',
  color: 'var(--flg-text-muted)',
  fontSize: 'var(--flg-text-sm)',
} as const;
const amount = { color: 'var(--flg-text)', fontWeight: 'var(--flg-weight-medium)' } as const;

// The drawer from the approved mockup: a title row with a close button, totals, actions at the end.
function InvoiceDrawer(props: DrawerContentProps) {
  return (
    <DrawerContent {...props}>
      <DrawerHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <DrawerTitle>Invoice details</DrawerTitle>
          <DrawerClose asChild>
            <IconButton aria-label="Close drawer" variant="ghost" size="sm">
              <CloseIcon width={15} height={15} />
            </IconButton>
          </DrawerClose>
        </div>
        <DrawerDescription>INV-2026-0142 · Minh An JSC</DrawerDescription>
      </DrawerHeader>
      <div style={rows}>
        <span>Subtotal</span>
        <b style={amount}>$12,400</b>
        <span>VAT 8%</span>
        <b style={amount}>$992</b>
        <span>Total</span>
        <b style={amount}>$13,392</b>
      </div>
      <DrawerFooter>
        <DrawerClose variant="ghost">Close</DrawerClose>
        <DrawerClose>Send invoice</DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
}

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger variant="secondary">Invoice details</DrawerTrigger>
      <InvoiceDrawer />
    </Drawer>
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Invoice details' });
    await userEvent.click(trigger);
    const drawer = canvas.getByRole('dialog', { name: 'Invoice details' });
    await expect(drawer).toHaveAttribute('data-side', 'right');
    await expect(drawer).toHaveAccessibleDescription('INV-2026-0142 · Minh An JSC');
    // The first focusable element is the close button in the title row.
    await expect(within(drawer).getByRole('button', { name: 'Close drawer' })).toHaveFocus();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Close drawer' }));
    await expect(drawer).toHaveProperty('open', false);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    const real = await realUserEvent();
    if (!real) return;
    await real.click(trigger);
    // The frame left of the panel is outside it.
    await real.click(drawer, { position: { x: 4, y: 200 } });
    await waitFor(() => expect(drawer).toHaveProperty('open', false));
    await expect(trigger).toHaveFocus();
  },
};

export const Flush: Story = {
  render: (args) => (
    <Drawer {...args} defaultOpen>
      <InvoiceDrawer />
    </Drawer>
  ),
};

export const Floating: Story = {
  render: (args) => (
    <Drawer {...args} defaultOpen>
      <InvoiceDrawer variant="floating" />
    </Drawer>
  ),
};

export const Bottom: Story = {
  render: (args) => (
    <Drawer {...args} defaultOpen>
      <InvoiceDrawer side="bottom" />
    </Drawer>
  ),
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('dialog').querySelector('.flg-drawer-panel') as HTMLElement;
    await settled(panel);
    const box = panel.getBoundingClientRect();
    // Full width at the bottom edge, no taller than 85% of the viewport.
    await expect(Math.round(box.bottom)).toBe(window.innerHeight);
    await expect(box.height).toBeLessThanOrEqual(window.innerHeight * 0.85 + 1);
  },
};
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project storybook-light src/components/drawer`
Expected: FAIL với `Failed to resolve import "./Drawer"`.

- [ ] **Step 3: Viết Drawer**

Tạo `src/components/drawer/Drawer.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import type { ButtonProps } from '../button/Button';
import {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from '../dialog/modal';
import type { ModalContentProps, ModalRootProps, ModalTitleProps } from '../dialog/modal';

export type DrawerProps = ModalRootProps;
export type DrawerTriggerProps = ButtonProps;
export type DrawerCloseProps = ButtonProps;
export type DrawerSide = 'right' | 'left' | 'top' | 'bottom';
export type DrawerVariant = 'flush' | 'floating';
export interface DrawerContentProps extends ModalContentProps {
  /** The edge it slides in from. Default `"right"`. */
  side?: DrawerSide;
  /** `"flush"` touches the edge; `"floating"` sits 10px inside it. Default `"flush"`. */
  variant?: DrawerVariant;
}
export type DrawerHeaderProps = HTMLAttributes<HTMLDivElement>;
export type DrawerTitleProps = ModalTitleProps;
export type DrawerDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type DrawerFooterProps = HTMLAttributes<HTMLDivElement>;

/** A modal panel that slides in from an edge, on the native `<dialog>`. Renders no element. */
export function Drawer(props: DrawerProps) {
  return <ModalRoot name="Drawer" {...props} />;
}

/** Opens the drawer. Renders the library's `Button` and takes its props, `asChild` included. */
export const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  function DrawerTrigger(props, ref) {
    return <ModalTrigger ref={ref} part="DrawerTrigger" {...props} />;
  },
);

/** Closes the drawer. Renders the library's `Button` and takes its props, `asChild` included. */
export const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(
  function DrawerClose(props, ref) {
    return <ModalClose ref={ref} part="DrawerClose" {...props} />;
  },
);

/**
 * The `<dialog>` and its glass panel. The ref and the ARIA attributes go to the `<dialog>`;
 * `className` and `style` go to the panel.
 */
export const DrawerContent = forwardRef<HTMLDialogElement, DrawerContentProps>(
  function DrawerContent({ side = 'right', variant = 'flush', ...props }, ref) {
    return (
      <ModalContent
        ref={ref}
        part="DrawerContent"
        frameData={{ 'data-kind': 'drawer', 'data-side': side, 'data-variant': variant }}
        panelClassName="flg-drawer-panel"
        {...props}
      />
    );
  },
);

export const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(function DrawerHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-header', className)} {...props} />;
});

/** The drawer's name. Renders an `h2`; `asChild` renders another heading level. */
export const DrawerTitle = forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  function DrawerTitle(props, ref) {
    return <ModalTitle ref={ref} part="DrawerTitle" {...props} />;
  },
);

/** Becomes the drawer's accessible description. */
export const DrawerDescription = forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
  function DrawerDescription(props, ref) {
    return <ModalDescription ref={ref} part="DrawerDescription" {...props} />;
  },
);

export const DrawerFooter = forwardRef<HTMLDivElement, DrawerFooterProps>(function DrawerFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-footer', className)} {...props} />;
});
```

Tạo `src/components/drawer/index.ts`:

```ts
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './Drawer';
export type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
  DrawerSide,
  DrawerTitleProps,
  DrawerTriggerProps,
  DrawerVariant,
} from './Drawer';
```

- [ ] **Step 4: Thêm CSS của Drawer**

Trong `src/styles/components/dialog.css`, chèn khối sau ngay trước dấu `}` cuối cùng của file (dấu đóng `@layer flg.components`):

```css
  /* Drawer: the same frame, with the panel against one edge. */
  .flg-dialog[data-kind='drawer'] {
    padding: 0;
  }
  .flg-dialog[data-kind='drawer'][open] {
    display: flex;
  }
  .flg-dialog[data-kind='drawer'][data-variant='floating'] {
    padding: 10px;
  }
  .flg-dialog[data-side='right'] {
    justify-content: flex-end;
  }
  .flg-dialog[data-side='left'] {
    justify-content: flex-start;
  }
  .flg-dialog[data-side='top'] {
    flex-direction: column;
    justify-content: flex-start;
  }
  .flg-dialog[data-side='bottom'] {
    flex-direction: column;
    justify-content: flex-end;
  }
  .flg-drawer-panel {
    gap: 10px;
    padding: 16px;
    overflow: auto;
    outline: none;
    transition: transform var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-dialog:is([data-side='right'], [data-side='left']) .flg-drawer-panel {
    width: 380px;
    max-width: calc(100vw - 32px);
    height: 100%;
  }
  .flg-dialog:is([data-side='top'], [data-side='bottom']) .flg-drawer-panel {
    width: 100%;
    max-height: 85dvh;
  }
  .flg-dialog[data-variant='flush'][data-side='right'] .flg-drawer-panel {
    border-radius: var(--flg-radius-lg) 0 0 var(--flg-radius-lg);
  }
  .flg-dialog[data-variant='flush'][data-side='left'] .flg-drawer-panel {
    border-radius: 0 var(--flg-radius-lg) var(--flg-radius-lg) 0;
  }
  .flg-dialog[data-variant='flush'][data-side='top'] .flg-drawer-panel {
    border-radius: 0 0 var(--flg-radius-lg) var(--flg-radius-lg);
  }
  .flg-dialog[data-variant='flush'][data-side='bottom'] .flg-drawer-panel {
    border-radius: var(--flg-radius-lg) var(--flg-radius-lg) 0 0;
  }
  /* The footer sits at the far end of the drawer. */
  .flg-drawer-panel > .flg-card-footer {
    margin-top: auto;
  }

  @starting-style {
    .flg-dialog[open][data-side='right'] .flg-drawer-panel {
      transform: translateX(calc(100% + 16px));
    }
    .flg-dialog[open][data-side='left'] .flg-drawer-panel {
      transform: translateX(calc(-100% - 16px));
    }
    .flg-dialog[open][data-side='top'] .flg-drawer-panel {
      transform: translateY(calc(-100% - 16px));
    }
    .flg-dialog[open][data-side='bottom'] .flg-drawer-panel {
      transform: translateY(calc(100% + 16px));
    }
  }
```

- [ ] **Step 5: Export, đăng ký và docs**

Trong `src/index.ts`, thêm vào cuối file:

```ts
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './components/drawer';
export type {
  DrawerCloseProps,
  DrawerContentProps,
  DrawerDescriptionProps,
  DrawerFooterProps,
  DrawerHeaderProps,
  DrawerProps,
  DrawerSide,
  DrawerTitleProps,
  DrawerTriggerProps,
  DrawerVariant,
} from './components/drawer';
```

Trong `src/index.test.ts`, thêm vào mảng mong đợi, ngay sau `'Divider',`:

```ts
      'Drawer',
      'DrawerClose',
      'DrawerContent',
      'DrawerDescription',
      'DrawerFooter',
      'DrawerHeader',
      'DrawerTitle',
      'DrawerTrigger',
```

Trong `scripts/check-use-client.ts`, thêm `'src/components/drawer/Drawer.tsx',` vào cuối `CLIENT_MODULES`. Trong `scripts/check-dist-css.ts`, thêm `'flg-drawer-panel',` vào cuối `SHIPPED_CLASSES`.

Tạo `src/components/drawer/Drawer.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Drawer.stories';

<Meta of={Stories} />

# Drawer

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from 'fl-glass-ui';

<Drawer>
  <DrawerTrigger variant="secondary">Invoice details</DrawerTrigger>
  <DrawerContent side="right">
    <DrawerHeader>
      <DrawerTitle>Invoice details</DrawerTitle>
      <DrawerDescription>INV-2026-0142</DrawerDescription>
    </DrawerHeader>
    {/* content */}
    <DrawerFooter>
      <DrawerClose variant="ghost">Close</DrawerClose>
      <DrawerClose>Send invoice</DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>;
```

<Canvas of={Stories.Default} />
<Controls />

## Side and variant

`side` is the edge it slides in from: `"right"` (default), `"left"`, `"top"` or `"bottom"`. Left and
right drawers are 380px wide; top and bottom ones are as tall as their content, up to 85% of the
screen.

`variant="flush"` (default) touches the edge and rounds only its inner corners.
`variant="floating"` sits 10px inside the edges, with every corner rounded.

## Accessibility

A drawer is a modal dialog that slides in: everything on the Dialog page applies, from the native
`<dialog>` and the focus rules to Esc, the outside click and the controlled state.

## Do and don't

- Do use a drawer for details or a form that relates to the page behind it.
- Don't put a second navigation menu in a drawer on a wide screen; there is room for it on the page.
````

- [ ] **Step 6: Chạy test, build, kiểm tra gói**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm build && pnpm size:record && pnpm check:package && pnpm test:stories`
Expected:
- `test:unit` PASS.
- `check:use-client` in `... 12 client.`
- `test:stories`: 390 test PASS.

- [ ] **Step 7: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Drawer, sharing the dialog core" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: Popover (kèm `usePopover` và `useFloating`)

**Files:**
- Create: `src/internal/use-popover.ts`, `src/internal/use-floating.ts`, `src/components/popover/Popover.tsx`, `src/components/popover/index.ts`, `src/components/popover/Popover.stories.tsx`, `src/components/popover/Popover.mdx`, `src/styles/components/popover.css`, `src/styles/components/floating.css`
- Modify: `src/styles/index.css`, `src/styles/preferences.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes:
  - `useControllableState`, `useIsoLayoutEffect`, `focusFirst` (Task 3).
  - `realUserEvent`, `settled` (Task 4).
  - `Button`, `Checkbox`, `Switch`.
- Produces:
  - `usePopover(ref, { open, onOpenChange, restoreFocusTo? }): void`.
  - `Side = 'top' | 'right' | 'bottom' | 'left'`, `Align = 'start' | 'center' | 'end'`.
  - `useFloating({ open, reference: () => ReferenceElement | null, floating, side, align, offset, arrow? }): void`.
  - Public: `Popover`, `PopoverTrigger`, `PopoverClose`, `PopoverContent` (`side`, `align`, `sideOffset`, `arrow`), kèm kiểu props.
  - Class: `.flg-popover`, `.flg-popover-arrow`. `floating.css` dùng chung cho Tooltip (Task 7).

- [ ] **Step 1: Viết story (test fail)**

Tạo `src/components/popover/Popover.stories.tsx`. Kiểm tra `Math.round(p.top - t.bottom)).toBe(18)` gồm `sideOffset` 8 cộng 10px chỗ cho mũi tên, đúng khoảng cách trong mockup P1.

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Checkbox } from '../checkbox/Checkbox';
import { Switch } from '../switch/Switch';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './Popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  args: { onOpenChange: fn() },
  parameters: { stage: 'viewport' },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

// The popover from the approved mockup: a filter panel with real controls.
const filters = (
  <PopoverContent aria-labelledby="filters-title" style={{ width: 210 }}>
    <div
      id="filters-title"
      style={{ fontSize: 'var(--flg-text-sm)', fontWeight: 'var(--flg-weight-semibold)' }}
    >
      Filter projects
    </div>
    <Checkbox defaultChecked>Active</Checkbox>
    <Checkbox>Archived</Checkbox>
    <Switch defaultChecked>Only mine</Switch>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 2 }}>
      <PopoverClose variant="ghost" size="sm">
        Reset
      </PopoverClose>
      <PopoverClose size="sm">Apply</PopoverClose>
    </div>
  </PopoverContent>
);

const corner = { placeSelf: 'start' } as const;

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => (
    <div style={corner}>
      <Popover {...args}>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Filters' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    const panel = canvas.getByRole('dialog', { name: 'Filter projects' });
    await expect(panel.matches(':popover-open')).toBe(true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', panel.id);
    await expect(within(panel).getByRole('checkbox', { name: 'Active' })).toHaveFocus();
    // Opens below the trigger, lined up with its start edge.
    await settled(panel);
    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    await expect(panel).toHaveAttribute('data-side', 'bottom');
    await expect(Math.round(p.left)).toBe(Math.round(t.left));
    await expect(Math.round(p.top - t.bottom)).toBe(18);
    // Tab moves on through the panel, which sits right after the trigger in the DOM.
    await userEvent.tab();
    await expect(within(panel).getByRole('checkbox', { name: 'Archived' })).toHaveFocus();

    await userEvent.click(within(panel).getByRole('button', { name: 'Apply' }));
    await expect(panel.matches(':popover-open')).toBe(false);
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);

    const real = await realUserEvent();
    if (!real) return;
    // Esc and an outside press close it through the browser; focus comes back to the trigger.
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.keyboard('{Escape}');
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.click(document.body, { position: { x: 600, y: 400 } });
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(false));
    // A press on the trigger while open closes it, and does not open it again.
    await real.click(trigger);
    await waitFor(() => expect(panel.matches(':popover-open')).toBe(true));
    await real.click(trigger);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await expect(panel.matches(':popover-open')).toBe(false);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Open: Story = {
  render: (args) => (
    <div style={corner}>
      <Popover {...args} defaultOpen>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
};

export const WithoutArrow: Story = {
  render: (args) => (
    <div style={corner}>
      <Popover {...args} defaultOpen>
        <PopoverTrigger variant="secondary">Share</PopoverTrigger>
        <PopoverContent aria-label="Share" arrow={false} side="right" align="center">
          <Button size="sm">Copy link</Button>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('dialog', { name: 'Share' });
    await expect(panel.querySelector('.flg-popover-arrow')).toBeNull();
    await expect(panel).toHaveAttribute('data-side', 'right');
  },
};

export const FlipsWhenThereIsNoRoom: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ position: 'fixed', bottom: 8, left: 8 }}>
      <Popover {...args} defaultOpen>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        {filters}
      </Popover>
    </div>
  ),
  play: async ({ canvas }) => {
    const panel = canvas.getByRole('dialog', { name: 'Filter projects' });
    await waitFor(() => expect(panel).toHaveAttribute('data-side', 'top'));
    const arrow = panel.querySelector('.flg-popover-arrow') as HTMLElement;
    await expect(getComputedStyle(arrow).bottom).toBe('-6px');
  },
};
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project storybook-light src/components/popover`
Expected: FAIL với `Failed to resolve import "./Popover"`.

- [ ] **Step 3: Viết `usePopover` và `useFloating`**

Tạo `src/internal/use-popover.ts`:

```ts
import { useReducer, useRef } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from './use-iso-layout-effect';

export interface UsePopoverOptions {
  open: boolean;
  /** Called when the browser opens or closes the popover itself (light dismiss, Esc). */
  onOpenChange: (open: boolean) => void;
  /**
   * Where focus goes when the popover closes while focus is inside it or nowhere (on `<body>`).
   * Focus that the user moved elsewhere, for example by clicking another control, is left alone.
   */
  restoreFocusTo?: (() => HTMLElement | null) | undefined;
}

const isShowing = (el: HTMLElement) => el.matches(':popover-open');

function restoreFocus(
  el: HTMLElement,
  hadFocus: boolean,
  target: (() => HTMLElement | null) | undefined,
) {
  const active = document.activeElement;
  if (hadFocus || active === null || active === document.body || el.contains(active)) {
    target?.()?.focus({ preventScroll: true });
  }
}

/**
 * Keeps an element with the `popover` attribute in step with `open`. The `toggle` event is attached
 * with `addEventListener`, since React 18 does not deliver `onToggle` for popovers. When the parent
 * controls `open` and keeps it `true` after the browser closed the popover, the popover reopens.
 */
export function usePopover(
  ref: RefObject<HTMLElement | null>,
  { open, onOpenChange, restoreFocusTo }: UsePopoverOptions,
): void {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const latest = useRef({ open, onOpenChange, restoreFocusTo });
  latest.current = { open, onOpenChange, restoreFocusTo };

  // Runs after every render: the DOM follows `open`, whatever closed or opened it last.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !el.isConnected) return;
    if (open && !isShowing(el)) {
      el.showPopover();
    } else if (!open && isShowing(el)) {
      const hadFocus = el.contains(document.activeElement);
      el.hidePopover();
      restoreFocus(el, hadFocus, latest.current.restoreFocusTo);
    }
  });

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onToggle = (event: Event) => {
      const nowOpen = (event as ToggleEvent).newState === 'open';
      if (nowOpen === latest.current.open) return;
      if (!nowOpen) restoreFocus(el, false, latest.current.restoreFocusTo);
      latest.current.onOpenChange(nowOpen);
      // A controlled parent that keeps the old value does not re-render; this render resyncs the DOM.
      forceRender();
    };
    el.addEventListener('toggle', onToggle);
    return () => el.removeEventListener('toggle', onToggle);
  }, [ref]);
}
```

Tạo `src/internal/use-floating.ts`:

```ts
import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  flip,
  offset as offsetMiddleware,
  shift,
} from '@floating-ui/dom';
import type { Placement, ReferenceElement } from '@floating-ui/dom';
import { useRef } from 'react';
import type { RefObject } from 'react';
import { useIsoLayoutEffect } from './use-iso-layout-effect';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Align = 'start' | 'center' | 'end';

export interface UseFloatingOptions {
  open: boolean;
  /** What the floating element is placed against. Read when it opens. */
  reference: () => ReferenceElement | null;
  floating: RefObject<HTMLElement | null>;
  side: Side;
  align: Align;
  /** Distance from the reference, in px. */
  offset: number;
  /** An element inside `floating` that points at the reference. */
  arrow?: RefObject<HTMLElement | null> | undefined;
}

/** Margin kept between a floating element and the edge of the viewport, in px. */
const VIEWPORT_PADDING = 8;

/**
 * Places `floating` next to `reference` while `open`, and keeps it there as either moves (scroll,
 * resize, layout). Writes `left`/`top` straight to the element, so nothing re-renders, and sets
 * `data-side`/`data-align` to where it really landed after flipping. Uses the `fixed` strategy, which
 * is what an element in the top layer needs.
 */
export function useFloating({
  open,
  reference,
  floating,
  side,
  align,
  offset,
  arrow,
}: UseFloatingOptions): void {
  const getReference = useRef(reference);
  getReference.current = reference;

  useIsoLayoutEffect(() => {
    const ref = getReference.current();
    const el = floating.current;
    if (!open || !ref || !el) return;
    const placement = (align === 'center' ? side : `${side}-${align}`) as Placement;
    let active = true;
    const update = () => {
      const arrowEl = arrow?.current ?? null;
      void computePosition(ref, el, {
        strategy: 'fixed',
        placement,
        middleware: [
          offsetMiddleware(offset),
          flip({ padding: VIEWPORT_PADDING }),
          shift({ padding: VIEWPORT_PADDING }),
          ...(arrowEl ? [arrowMiddleware({ element: arrowEl, padding: 8 })] : []),
        ],
      }).then(({ x, y, placement: landed, middlewareData }) => {
        if (!active) return;
        const [landedSide, landedAlign = 'center'] = landed.split('-');
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.dataset.side = landedSide;
        el.dataset.align = landedAlign;
        if (arrowEl && middlewareData.arrow) {
          const { x: ax, y: ay } = middlewareData.arrow;
          arrowEl.style.left = ax === undefined ? '' : `${ax}px`;
          arrowEl.style.top = ay === undefined ? '' : `${ay}px`;
        }
      });
    };
    const stop = autoUpdate(ref, el, update);
    return () => {
      active = false;
      stop();
    };
  }, [open, floating, side, align, offset, arrow]);
}
```

- [ ] **Step 4: Viết Popover**

Tạo `src/components/popover/Popover.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { createContext, forwardRef, useContext, useEffect, useId, useMemo, useRef } from 'react';
import type { HTMLAttributes, MutableRefObject, ReactNode } from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { focusFirst } from '../../internal/focus';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import type { Align, Side } from '../../internal/use-floating';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { usePopover } from '../../internal/use-popover';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(part: string): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    devWarn(`<${part}> must be rendered inside a <Popover>.`);
    return { open: false, setOpen: () => {}, contentId: '', triggerRef: { current: null } };
  }
  return ctx;
}

export interface PopoverProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}
export type PopoverTriggerProps = ButtonProps;
export type PopoverCloseProps = ButtonProps;
export interface PopoverContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** The side of the trigger it opens on. It flips when there is no room. Default `"bottom"`. */
  side?: Side;
  /** How it lines up with the trigger along that side. Default `"start"`. */
  align?: Align;
  /** Gap to the trigger, in px. Default 8. */
  sideOffset?: number;
  /** Show the arrow pointing at the trigger. Default `true`. */
  arrow?: boolean;
}

/** A non-modal panel anchored to its trigger, on the native `popover="auto"`. Renders no element. */
export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Popover',
  });
  const contentId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const value = useMemo(
    () => ({ open: isOpen, setOpen, contentId, triggerRef }),
    [isOpen, setOpen, contentId],
  );
  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

/** Opens and closes the popover. Renders the library's `Button` and takes its props. */
export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  function PopoverTrigger({ onPointerDown, onClick, ...props }, ref) {
    const ctx = usePopoverContext('PopoverTrigger');
    // A press on the trigger light-dismisses an open popover before the click arrives. Remember
    // whether it was open at the press, so that click closes it instead of opening it again.
    const openAtPress = useRef<boolean | null>(null);
    return (
      <Button
        ref={mergeRefs(ref, ctx.triggerRef)}
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        aria-controls={ctx.open ? ctx.contentId : undefined}
        {...props}
        onPointerDown={composeEventHandlers(onPointerDown, () => {
          openAtPress.current = ctx.open;
        })}
        onClick={composeEventHandlers(onClick, () => {
          const wasOpen = openAtPress.current ?? ctx.open;
          openAtPress.current = null;
          ctx.setOpen(!wasOpen);
        })}
      />
    );
  },
);

/** Closes the popover. Renders the library's `Button` and takes its props. */
export const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(function PopoverClose(
  { onClick, ...props },
  ref,
) {
  const ctx = usePopoverContext('PopoverClose');
  return (
    <Button
      ref={ref}
      {...props}
      onClick={composeEventHandlers(onClick, () => ctx.setOpen(false))}
    />
  );
});

/** Extra distance that makes room for the arrow, in px. */
const ARROW_SPACE = 10;

/** The glass panel. Rendered right after the trigger, so Tab moves into it naturally. */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    {
      side = 'bottom',
      align = 'start',
      sideOffset = 8,
      arrow = true,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const ctx = usePopoverContext('PopoverContent');
    const contentRef = useRef<HTMLDivElement>(null);
    const arrowRef = useRef<HTMLSpanElement>(null);
    const { open, setOpen, triggerRef } = ctx;

    usePopover(contentRef, {
      open,
      onOpenChange: setOpen,
      restoreFocusTo: () => triggerRef.current,
    });
    useFloating({
      open,
      reference: () => triggerRef.current,
      floating: contentRef,
      side,
      align,
      offset: sideOffset + (arrow ? ARROW_SPACE : 0),
      arrow: arrow ? arrowRef : undefined,
    });

    // Focus moves in when it opens: to the first focusable element, else the panel itself.
    useIsoLayoutEffect(() => {
      const el = contentRef.current;
      if (open && el) focusFirst(el);
    }, [open]);

    const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
    useEffect(() => {
      if (!named) {
        devWarn('<PopoverContent> needs a name: pass aria-label or aria-labelledby.');
      }
    }, [named]);

    return (
      <div
        ref={mergeRefs(ref, contentRef)}
        popover="auto"
        role="dialog"
        tabIndex={-1}
        data-side={side}
        data-align={align}
        {...props}
        id={ctx.contentId}
        className={clsx('flg-surface flg-popover', className)}
      >
        {open ? (
          <>
            {arrow ? (
              <span ref={arrowRef} className="flg-popover-arrow" aria-hidden="true" />
            ) : null}
            {children}
          </>
        ) : null}
      </div>
    );
  },
);
```

Tạo `src/components/popover/index.ts`:

```ts
export { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './Popover';
export type {
  PopoverCloseProps,
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from './Popover';
```

- [ ] **Step 5: Viết CSS**

Tạo `src/styles/components/popover.css`:

```css
/* Popover (spec §4.3, mockup P1). The browser's styles for [popover] are undone here; Floating UI
   writes `left` and `top`. */
@layer flg.components {
  .flg-popover {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    max-width: calc(100vw - 32px);
    margin: 0;
    padding: 12px;
    border-radius: var(--flg-radius-md);
    background-color: transparent;
    overflow: visible;
    outline: none;
    transition:
      opacity var(--flg-duration-normal) var(--flg-ease),
      translate var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-popover:popover-open {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  /* A square turned 45 degrees, clipped to the triangle that sticks out. It inherits the glass. */
  .flg-popover-arrow {
    position: absolute;
    z-index: 1;
    width: 12px;
    height: 12px;
    border: 0 solid var(--flg-control-border);
    background: inherit;
    transform: rotate(45deg);
    pointer-events: none;
  }
  .flg-popover[data-side='bottom'] > .flg-popover-arrow {
    top: -6px;
    border-top-width: 1px;
    border-left-width: 1px;
    border-top-left-radius: 2px;
    clip-path: polygon(0 0, 100% 0, 0 100%);
  }
  .flg-popover[data-side='top'] > .flg-popover-arrow {
    bottom: -6px;
    border-right-width: 1px;
    border-bottom-width: 1px;
    border-bottom-right-radius: 2px;
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
  }
  .flg-popover[data-side='right'] > .flg-popover-arrow {
    left: -6px;
    border-bottom-width: 1px;
    border-left-width: 1px;
    border-bottom-left-radius: 2px;
    clip-path: polygon(0 0, 0 100%, 100% 100%);
  }
  .flg-popover[data-side='left'] > .flg-popover-arrow {
    right: -6px;
    border-top-width: 1px;
    border-right-width: 1px;
    border-top-right-radius: 2px;
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }
}
```

Tạo `src/styles/components/floating.css`. Selector đã gồm cả `.flg-tooltip` của Task 7:

```css
/* Enter animation shared by everything that floats next to a trigger (spec §3.5): it fades in and
   moves 4px away from the trigger. `data-side` is where Floating UI placed it. */
@layer flg.components {
  @starting-style {
    :is(.flg-popover, .flg-tooltip):popover-open {
      opacity: 0;
    }
    :is(.flg-popover, .flg-tooltip)[data-side='bottom']:popover-open {
      translate: 0 -4px;
    }
    :is(.flg-popover, .flg-tooltip)[data-side='top']:popover-open {
      translate: 0 4px;
    }
    :is(.flg-popover, .flg-tooltip)[data-side='right']:popover-open {
      translate: -4px 0;
    }
    :is(.flg-popover, .flg-tooltip)[data-side='left']:popover-open {
      translate: 4px 0;
    }
  }
}
```

Trong `src/styles/index.css`, ngay sau `@import './components/dialog.css';`, thêm:

```css
@import './components/popover.css';
@import './components/floating.css';
```

Trong `src/styles/preferences.css`, thêm vào cuối khối `@media (forced-colors: active)`, ngay sau quy tắc `.flg-switch:has(> input:disabled:checked) .flg-switch-thumb`:

```css
    .flg-popover-arrow {
      border-color: CanvasText;
      background: Canvas;
    }
```

- [ ] **Step 6: Export, đăng ký và docs**

Trong `src/index.ts`, thêm vào cuối file:

```ts
export { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './components/popover';
export type {
  PopoverCloseProps,
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from './components/popover';
```

Trong `src/index.test.ts`, thêm vào mảng mong đợi, ngay sau `'Input',`:

```ts
      'Popover',
      'PopoverClose',
      'PopoverContent',
      'PopoverTrigger',
```

Trong `scripts/check-use-client.ts`, thêm `'src/components/popover/Popover.tsx',` vào cuối `CLIENT_MODULES`. Trong `scripts/check-dist-css.ts`, thêm `'flg-popover',` và `'flg-popover-arrow',` vào cuối `SHIPPED_CLASSES`.

Tạo `src/components/popover/Popover.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Popover.stories';

<Meta of={Stories} />

# Popover

```tsx
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from 'fl-glass-ui';

<Popover>
  <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
  <PopoverContent aria-label="Filters">
    {/* controls */}
    <PopoverClose size="sm">Apply</PopoverClose>
  </PopoverContent>
</Popover>;
```

<Canvas of={Stories.Default} />
<Controls />

## Placement

`side` (default `"bottom"`) and `align` (default `"start"`) place it next to the trigger. It flips
to the other side when there is no room, and shifts to stay on screen. `sideOffset` is the gap, 8px
by default. `arrow={false}` hides the arrow.

## Accessibility

- It is a native `popover="auto"`: Esc and a click outside close it, and it needs no portal.
- It is a non-modal dialog. Name it with `aria-label` or `aria-labelledby`.
- It sits right after the trigger in the DOM, so Tab moves from the trigger into it. Focus moves to
  its first focusable element when it opens, and back to the trigger when it closes, unless the user
  already moved focus elsewhere.

## Do and don't

- Do use a popover for a few related controls, such as filters.
- Don't put a long form in a popover; use a Dialog or a Drawer.
````

- [ ] **Step 7: Chạy test, build, kiểm tra gói**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm build && pnpm size:record && pnpm check:package && pnpm test:stories`
Expected:
- `test:unit` PASS.
- `check:use-client` in `... 13 client.`
- `size-limit`: JS tăng khoảng 9KB (brotli), phần lớn là Floating UI.
- `test:stories`: 414 test PASS.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Popover with Floating UI positioning" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 7: Tooltip

**Files:**
- Create: `src/components/tooltip/Tooltip.tsx`, `src/components/tooltip/index.ts`, `src/components/tooltip/Tooltip.stories.tsx`, `src/components/tooltip/Tooltip.mdx`, `src/styles/components/tooltip.css`
- Modify: `src/styles/index.css`, `src/styles/preferences.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes:
  - `usePopover`, `useFloating`, `Side`, `Align` (Task 6).
  - `useControllableState`, `isFocusable` (Task 3).
  - `resolveLazy` (Task 2).
  - `Slot`, `mergeRefs`, `composeEventHandlers`.
  - `Dialog`, `DialogContent`, `DialogTitle` (Task 4, dùng trong story).
- Produces: `Tooltip` (`delay`), `TooltipTrigger`, `TooltipContent` (`side`, `align`, `sideOffset`), kèm kiểu props. Class `.flg-tooltip`.

- [ ] **Step 1: Viết story (test fail)**

Tạo `src/components/tooltip/Tooltip.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { GearIcon } from '../../../.storybook/icons';
import { realUserEvent, settled } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { Dialog, DialogContent, DialogTitle } from '../dialog/Dialog';
import { IconButton } from '../icon-button/IconButton';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: { onOpenChange: fn() },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const shortcut = { opacity: 0.7, marginLeft: 6, fontWeight: 'var(--flg-weight-regular)' } as const;

const settings = (
  <>
    <TooltipTrigger>
      <IconButton aria-label="Settings" variant="secondary">
        <GearIcon width={16} height={16} />
      </IconButton>
    </TooltipTrigger>
    <TooltipContent>
      Settings <span style={shortcut}>Ctrl+,</span>
    </TooltipContent>
  </>
);

export const Default: Story = {
  // The closed state is a Button, which has its own baselines; the open states have theirs.
  tags: ['no-visual'],
  render: (args) => <Tooltip {...args}>{settings}</Tooltip>,
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole('button', { name: 'Settings' });
    const tip = canvas.getByRole('tooltip', { hidden: true });
    await expect(trigger).toHaveAccessibleDescription('Settings Ctrl+,');
    await expect(tip.matches(':popover-open')).toBe(false);
    // Keyboard focus shows it at once; Esc and blur hide it.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(tip.matches(':popover-open')).toBe(true);
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await settled(tip);
    const t = trigger.getBoundingClientRect();
    const p = tip.getBoundingClientRect();
    await expect(Math.round(t.top - p.bottom)).toBe(6);
    await userEvent.keyboard('{Escape}');
    await expect(tip.matches(':popover-open')).toBe(false);
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(tip.matches(':popover-open')).toBe(true);
    await userEvent.tab();
    await expect(tip.matches(':popover-open')).toBe(false);

    const real = await realUserEvent();
    if (!real) return;
    // Hover waits for the delay (once the 300ms skip window has passed), and the pointer can move
    // onto the tooltip without closing it.
    await new Promise((resolve) => setTimeout(resolve, 350));
    await real.hover(trigger);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(tip.matches(':popover-open')).toBe(false);
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(true), { timeout: 1000 });
    await real.hover(tip);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await expect(tip.matches(':popover-open')).toBe(true);
    await real.unhover(tip);
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(false));
  },
};

export const Open: Story = {
  render: (args) => (
    <Tooltip {...args} defaultOpen>
      {settings}
    </Tooltip>
  ),
};

export const KeepsTheTriggersDescription: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
      <Tooltip {...args}>
        <TooltipTrigger>
          <Button variant="secondary" aria-describedby="export-hint">
            Export
          </Button>
        </TooltipTrigger>
        <TooltipContent>CSV, up to 10,000 rows</TooltipContent>
      </Tooltip>
      <p id="export-hint">Exports run in the background.</p>
    </div>
  ),
  play: async ({ canvas }) => {
    const tip = canvas.getByRole('tooltip', { hidden: true });
    await expect(canvas.getByRole('button', { name: 'Export' })).toHaveAttribute(
      'aria-describedby',
      `export-hint ${tip.id}`,
    );
  },
};

export const SkipDelay: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Tooltip>
        <TooltipTrigger>
          <Button variant="secondary">Bold</Button>
        </TooltipTrigger>
        <TooltipContent>Bold</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button variant="secondary">Italic</Button>
        </TooltipTrigger>
        <TooltipContent>Italic</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const [bold, italic] = canvas.getAllByRole('tooltip', { hidden: true });
    await real.hover(canvas.getByRole('button', { name: 'Bold' }));
    await waitFor(() => expect(bold?.matches(':popover-open')).toBe(true), { timeout: 1000 });
    // Moving straight to the next trigger shows its tooltip without the delay.
    await real.hover(canvas.getByRole('button', { name: 'Italic' }));
    await waitFor(() => expect(italic?.matches(':popover-open')).toBe(true), { timeout: 250 });
    // Only one shows at a time.
    await waitFor(() => expect(bold?.matches(':popover-open')).toBe(false), { timeout: 50 });
  },
};

export const InsideADialog: Story = {
  tags: ['no-visual'],
  parameters: { stage: 'viewport' },
  render: () => (
    <Dialog defaultOpen>
      <DialogContent size="sm">
        <DialogTitle>Toolbar</DialogTitle>
        <Tooltip>{settings}</Tooltip>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const dialog = canvas.getByRole('dialog', { name: 'Toolbar' }) as HTMLDialogElement;
    const tip = canvas.getByRole('tooltip', { hidden: true });
    // The trigger is the dialog's first focusable element, and focus there came from code, not the
    // keyboard. Tab away and back to show the tooltip.
    await real.keyboard('{Tab}');
    await real.keyboard('{Shift>}{Tab}{/Shift}');
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(true));
    // The first Esc closes only the tooltip; the dialog stays open.
    await real.keyboard('{Escape}');
    await waitFor(() => expect(tip.matches(':popover-open')).toBe(false));
    await expect(dialog.open).toBe(true);
    await real.keyboard('{Escape}');
    await waitFor(() => expect(dialog.open).toBe(false));
  },
};
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project storybook-light src/components/tooltip`
Expected: FAIL với `Failed to resolve import "./Tooltip"`.

- [ ] **Step 3: Viết Tooltip**

Tạo `src/components/tooltip/Tooltip.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import type {
  FocusEvent,
  HTMLAttributes,
  MutableRefObject,
  PointerEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { composeEventHandlers } from '../../internal/compose-event-handlers';
import { isFocusable } from '../../internal/focus';
import { mergeRefs } from '../../internal/merge-refs';
import { resolveLazy } from '../../internal/react-lazy';
import { Slot } from '../../internal/slot';
import { useControllableState } from '../../internal/use-controllable-state';
import { useFloating } from '../../internal/use-floating';
import type { Align, Side } from '../../internal/use-floating';
import { usePopover } from '../../internal/use-popover';
import { devWarn } from '../../internal/warn';

/** How long after one tooltip closes the next one opens without waiting, in ms. */
const SKIP_DELAY = 300;
/** How long the pointer may be off both the trigger and the tooltip before it closes, in ms. */
const CLOSE_DELAY = 100;
/** Every open tooltip and its close function; shared by every tooltip on the page. */
const openTooltips = new Map<string, () => void>();
/** When the last tooltip closed. */
let lastClosedAt = Number.NEGATIVE_INFINITY;

interface TooltipContextValue {
  open: boolean;
  contentId: string;
  triggerRef: MutableRefObject<HTMLElement | null>;
  /** Open after the hover delay (or at once, inside the skip window). */
  openSoon: () => void;
  openNow: () => void;
  /** Close after the grace period, unless the pointer comes back. */
  closeSoon: () => void;
  closeNow: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(part: string): TooltipContextValue | null {
  const ctx = useContext(TooltipContext);
  if (!ctx) devWarn(`<${part}> must be rendered inside a <Tooltip>.`);
  return ctx;
}

export interface TooltipProps {
  /** Whether it is open. Pass it with `onOpenChange` to control the state. */
  open?: boolean;
  /** Whether it starts open, when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the new state whenever it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** How long the pointer rests on the trigger before it opens, in ms. Default 500. */
  delay?: number;
  children?: ReactNode;
}
export interface TooltipTriggerProps {
  /** Exactly one element that can take keyboard focus, such as a button or a link. */
  children: ReactElement;
}
export interface TooltipContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** The side of the trigger it opens on. It flips when there is no room. Default `"top"`. */
  side?: Side;
  /** How it lines up with the trigger along that side. Default `"center"`. */
  align?: Align;
  /** Gap to the trigger, in px. Default 6. */
  sideOffset?: number;
}

/** A short text label for its trigger, on hover and keyboard focus. Renders no element. */
export function Tooltip({
  open,
  defaultOpen = false,
  onOpenChange,
  delay = 500,
  children,
}: TooltipProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    name: 'Tooltip',
  });
  const contentId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = () => clearTimeout(timer.current);
  // Only one tooltip shows at a time: opening this one closes any other in the same render.
  const show = useCallback(() => {
    for (const [id, close] of openTooltips) if (id !== contentId) close();
    setOpen(true);
  }, [contentId, setOpen]);
  const openNow = useCallback(() => {
    clearTimeout(timer.current);
    show();
  }, [show]);
  const closeNow = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, [setOpen]);
  const openSoon = useCallback(() => {
    clearTimeout(timer.current);
    // Moving from one tooltip to the next skips the delay.
    const skip = openTooltips.size > 0 || performance.now() - lastClosedAt < SKIP_DELAY;
    timer.current = setTimeout(show, skip ? 0 : delay);
  }, [delay, show]);
  const closeSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(closeNow, CLOSE_DELAY);
  }, [closeNow]);
  useEffect(() => clear, []);

  useEffect(() => {
    if (!isOpen) return;
    openTooltips.set(contentId, closeNow);
    return () => {
      openTooltips.delete(contentId);
      lastClosedAt = performance.now();
    };
  }, [isOpen, contentId, closeNow]);

  // Esc closes it wherever focus is. Prevented, so a Dialog around it stays open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeNow();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, closeNow]);

  const value = useMemo(
    () => ({ open: isOpen, contentId, triggerRef, openSoon, openNow, closeSoon, closeNow }),
    [isOpen, contentId, openSoon, openNow, closeSoon, closeNow],
  );
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

const isTouch = (event: PointerEvent) => event.pointerType === 'touch';

/** Wires its single child to the tooltip: hover, focus and `aria-describedby`. */
export const TooltipTrigger = forwardRef<HTMLElement, TooltipTriggerProps>(function TooltipTrigger(
  { children },
  ref,
) {
  const ctx = useTooltipContext('TooltipTrigger');
  const triggerRef = ctx?.triggerRef;

  useEffect(() => {
    const el = triggerRef?.current;
    if (el && !isFocusable(el)) {
      devWarn(
        '<TooltipTrigger> needs a child that keyboard users can focus, such as a button or a link.',
      );
    }
  }, [triggerRef]);

  if (!ctx) return children;
  // The child keeps its own description, and the tooltip's is added after it. Slot lets the child's
  // props win, so the merged value goes on the child itself.
  const child = resolveLazy(children);
  const described = isValidElement<HTMLAttributes<HTMLElement>>(child)
    ? cloneElement(child, {
        'aria-describedby': [child.props['aria-describedby'], ctx.contentId]
          .filter(Boolean)
          .join(' '),
      })
    : child;
  return (
    <Slot
      ref={mergeRefs(ref, ctx.triggerRef)}
      onPointerEnter={(event: PointerEvent<HTMLElement>) => {
        if (!isTouch(event)) ctx.openSoon();
      }}
      onPointerLeave={(event: PointerEvent<HTMLElement>) => {
        if (!isTouch(event)) ctx.closeSoon();
      }}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        // Keyboard focus only: a click or a tap also focuses, and must not show it.
        if (event.currentTarget.matches(':focus-visible')) ctx.openNow();
      }}
      onBlur={() => ctx.closeNow()}
    >
      {described}
    </Slot>
  );
});

/** The tooltip text. Always in the DOM, hidden until open, so `aria-describedby` can read it. */
export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent(
    {
      side = 'top',
      align = 'center',
      sideOffset = 6,
      className,
      onPointerEnter,
      onPointerLeave,
      ...props
    },
    ref,
  ) {
    const ctx = useTooltipContext('TooltipContent');
    const contentRef = useRef<HTMLDivElement>(null);
    const open = ctx?.open ?? false;
    usePopover(contentRef, {
      open,
      onOpenChange: (next) => (next ? ctx?.openNow() : ctx?.closeNow()),
    });
    useFloating({
      open,
      reference: () => ctx?.triggerRef.current ?? null,
      floating: contentRef,
      side,
      align,
      offset: sideOffset,
    });
    return (
      <div
        ref={mergeRefs(ref, contentRef)}
        popover="manual"
        role="tooltip"
        data-side={side}
        data-align={align}
        {...props}
        id={ctx?.contentId}
        className={clsx('flg-tooltip', className)}
        onPointerEnter={composeEventHandlers(onPointerEnter, () => ctx?.openNow())}
        onPointerLeave={composeEventHandlers(onPointerLeave, () => ctx?.closeSoon())}
      />
    );
  },
);
```

Tạo `src/components/tooltip/index.ts`:

```ts
export { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip';
export type { TooltipContentProps, TooltipProps, TooltipTriggerProps } from './Tooltip';
```

- [ ] **Step 4: Viết CSS**

Tạo `src/styles/components/tooltip.css`:

```css
/* Tooltip (spec §4.3, mockup T2): a small piece of glass. */
@layer flg.components {
  .flg-tooltip {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    max-width: 240px;
    margin: 0;
    padding: 5px 9px;
    border: 1px solid var(--flg-control-border);
    border-radius: var(--flg-radius-xs);
    background: var(--flg-glass-tint);
    -webkit-backdrop-filter: var(--flg-glass-filter);
    backdrop-filter: var(--flg-glass-filter);
    box-shadow: var(--flg-glass-shadow);
    color: var(--flg-text);
    font: var(--flg-weight-medium) var(--flg-text-xs) / 1.3 var(--flg-font-sans);
    overflow: visible;
    overflow-wrap: break-word;
    transition:
      opacity var(--flg-duration-normal) var(--flg-ease),
      translate var(--flg-duration-normal) var(--flg-ease);
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/tooltip.css';` ngay sau `@import './components/popover.css';`.

Trong `src/styles/preferences.css`, thêm vào khối `@media (forced-colors: active)`, ngay trước quy tắc `.flg-popover-arrow` của Task 6:

```css
    .flg-tooltip {
      border-color: CanvasText;
      background: Canvas;
      color: CanvasText;
      box-shadow: none;
    }
```

- [ ] **Step 5: Export, đăng ký và docs**

Trong `src/index.ts`, thêm vào cuối file:

```ts
export { Tooltip, TooltipContent, TooltipTrigger } from './components/tooltip';
export type { TooltipContentProps, TooltipProps, TooltipTriggerProps } from './components/tooltip';
```

Trong `src/index.test.ts`, thêm vào cuối mảng mong đợi, ngay sau `'Textarea',`:

```ts
      'Tooltip',
      'TooltipContent',
      'TooltipTrigger',
```

Trong `scripts/check-use-client.ts`, thêm `'src/components/tooltip/Tooltip.tsx',` vào cuối `CLIENT_MODULES`. Trong `scripts/check-dist-css.ts`, thêm `'flg-tooltip',` vào cuối `SHIPPED_CLASSES`.

Tạo `src/components/tooltip/Tooltip.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Tooltip.stories';

<Meta of={Stories} />

# Tooltip

```tsx
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from 'fl-glass-ui';

<Tooltip>
  <TooltipTrigger>
    <IconButton aria-label="Settings">
      <GearIcon />
    </IconButton>
  </TooltipTrigger>
  <TooltipContent>Settings</TooltipContent>
</Tooltip>;
```

<Canvas of={Stories.Default} />
<Controls />

## When it shows

- On hover, after `delay` (500ms by default). Moving from one tooltip to the next skips the delay.
- At once, when the trigger gets focus from the keyboard.
- Never on touch.

It hides on Esc, when the trigger loses focus, and shortly after the pointer leaves both the trigger
and the tooltip, so the pointer can move onto the tooltip to read it.

## Accessibility

- The tooltip text becomes the trigger's accessible description (`aria-describedby`), so it should
  add to the trigger's name, not repeat it.
- `TooltipTrigger` takes exactly one element that keyboard users can focus, such as a button or a
  link.
- It is a native `popover="manual"`, with `role="tooltip"`.

## Do and don't

- Do keep it to a few words of plain text.
- Don't put links or buttons in a tooltip; nobody can reach them. Use a Popover.
- Don't put a tooltip on a button with the native `disabled` attribute, which gets no pointer or
  focus events. Use `aria-disabled` instead.
````

- [ ] **Step 6: Chạy test, build, kiểm tra gói**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm check:contrast && pnpm build && pnpm size:record && pnpm check:package && pnpm test:stories`
Expected:
- `test:unit`: 404 PASS, 2 skipped.
- `check:use-client` in `... 14 client.`
- `test:stories`: 444 test PASS.
- Story tooltip dùng hover thật. Nếu `Default` hoặc `SkipDelay` fail ở WebKit, chạy lại 3 lần bằng `pnpm vitest run --project storybook-light src/components/tooltip`. Vẫn fail thì đó là lỗi thật, không được nới thời gian chờ để che đi.

- [ ] **Step 7: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Tooltip" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 8: Fixture Vite và Next.js cho overlay

**Files:**
- Create: `fixtures/vite-app/src/Overlays.tsx`, `fixtures/next-app/app/overlays.tsx`
- Modify: `fixtures/vite-app/src/App.tsx`, `fixtures/next-app/app/page.tsx`, `scripts/test-fixtures.mjs`

**Interfaces:**
- Consumes: mọi export của Task 4–7.
- Produces:
  - Fixture Next render Dialog, Drawer, Popover và Tooltip từ một Server Component. Đây là test thật cho Review Focus 2.
  - Fixture Vite render cùng bộ đó với React 18.3 trong StrictMode.

- [ ] **Step 1: Thêm kiểm tra tương tác vào script (test fail)**

Trong `scripts/test-fixtures.mjs`:

1. Đổi comment `/** One element per phase 1 component (spec §6.3), as the page renders it. */` thành:

```js
/** One element per component, as the page renders it (closed overlays are in the DOM too). */
```

2. Thêm vào cuối mảng `COMPONENTS`, ngay sau `'.flg-switch',`:

```js
  'dialog.flg-dialog',
  '.flg-popover',
  '.flg-tooltip',
```

3. Trong `inspect()`, thêm dòng sau vào cuối hàm, ngay sau dòng `if (!(await yearly.isChecked())) problems.push('"Yearly" did not get selected');`:

```js

  await checkOverlays(page, problems);
```

4. Thêm hai khai báo sau ngay sau hàm `inspect()`:

```js
const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement);

/** Phase 2: a native modal Dialog, a Drawer, a Popover and a Tooltip open, close and move focus. */
async function checkOverlays(page, problems) {
  const editProfile = page.getByRole('button', { name: 'Edit profile' });
  await editProfile.click();
  const dialog = page.getByRole('dialog', { name: 'Edit profile' });
  await dialog.waitFor();
  if (!(await dialog.evaluate((el) => el.matches(':modal')))) {
    problems.push('the Dialog did not open as a modal');
  }
  if (!(await hasFocus(page.getByRole('textbox', { name: 'Name' })))) {
    problems.push('focus did not move into the Dialog');
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  if (!(await hasFocus(editProfile))) problems.push('focus did not return to the Dialog trigger');

  await page.getByRole('button', { name: 'Invoice' }).click();
  const drawer = page.getByRole('dialog', { name: 'Invoice details' });
  await drawer.waitFor();
  await drawer.getByRole('button', { name: 'Close' }).click();
  await drawer.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Filters' }).click();
  const filters = page.getByRole('dialog', { name: 'Filters' });
  await filters.waitFor();
  if (!(await hasFocus(page.getByRole('switch', { name: 'Only mine' })))) {
    problems.push('focus did not move into the Popover');
  }
  await page.mouse.click(4, 4);
  await filters.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Help' }).hover();
  await page.getByRole('tooltip', { name: 'Opens the help center' }).waitFor();
}
```

- [ ] **Step 2: Chạy để xác nhận fail**

Run: `pnpm build && pnpm test:fixtures`
Expected: FAIL ở cả hai fixture, với `missing dialog.flg-dialog`, `missing .flg-popover`, `missing .flg-tooltip`, rồi `locator.click: Timeout` khi tìm nút "Edit profile".

- [ ] **Step 3: Thêm overlay vào hai fixture**

Tạo `fixtures/vite-app/src/Overlays.tsx`:

```tsx
// The overlays of phase 2, plan A. The Next.js fixture renders the same markup from a Server Component.
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'fl-glass-ui';

export function Overlays() {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Dialog>
        <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Shown to everyone in the workspace.</DialogDescription>
          </DialogHeader>
          <Field label="Name">
            <Input name="name" defaultValue="Minh An" />
          </Field>
          <DialogFooter>
            <DialogClose>Save</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Drawer>
        <DrawerTrigger variant="secondary">Invoice</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Invoice details</DrawerTitle>
          </DrawerHeader>
          <DrawerClose variant="ghost">Close</DrawerClose>
        </DrawerContent>
      </Drawer>
      <Popover>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        <PopoverContent aria-label="Filters">
          <Switch defaultChecked>Only mine</Switch>
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger>
          <IconButton aria-label="Help" variant="ghost">
            ?
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>Opens the help center</TooltipContent>
      </Tooltip>
    </section>
  );
}
```

Tạo `fixtures/next-app/app/overlays.tsx` với cùng nội dung. Chỉ khác hai dòng comment đầu, và file **không** có `"use client"`, vì nó là Server Component:

```tsx
// A Server Component: the overlays of phase 2, plan A, composed from client components the way an
// App Router page would. The Vite fixture renders the same markup on the client.
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'fl-glass-ui';

export function Overlays() {
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Dialog>
        <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Shown to everyone in the workspace.</DialogDescription>
          </DialogHeader>
          <Field label="Name">
            <Input name="name" defaultValue="Minh An" />
          </Field>
          <DialogFooter>
            <DialogClose>Save</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Drawer>
        <DrawerTrigger variant="secondary">Invoice</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Invoice details</DrawerTitle>
          </DrawerHeader>
          <DrawerClose variant="ghost">Close</DrawerClose>
        </DrawerContent>
      </Drawer>
      <Popover>
        <PopoverTrigger variant="secondary">Filters</PopoverTrigger>
        <PopoverContent aria-label="Filters">
          <Switch defaultChecked>Only mine</Switch>
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger>
          <IconButton aria-label="Help" variant="ghost">
            ?
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>Opens the help center</TooltipContent>
      </Tooltip>
    </section>
  );
}
```

Trong `fixtures/vite-app/src/App.tsx`:
- Thêm `import { Overlays } from './Overlays';` ngay sau `import { useEffect, useState } from 'react';`.
- Thêm `<Overlays />` ngay trước `</main>`.

Trong `fixtures/next-app/app/page.tsx`:
- Thêm `import { Overlays } from './overlays';` ngay sau `import { ClientControls } from './client-controls';`.
- Thêm `<Overlays />` ngay sau `<ClientControls />`.

- [ ] **Step 4: Chạy fixture**

Run: `pnpm build && pnpm test:fixtures`
Expected: `Fixtures OK: vite, next.` Bốn lượt (Vite production và development, Next production và development) đều không có cảnh báo hay lỗi trên console. Nếu Next development báo `` `asChild` expects exactly one React element `` và lỗi hydrate, nghĩa là Task 2 chưa được áp dụng.

- [ ] **Step 5: Kiểm tra toàn bộ**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm check:contrast && pnpm check:package && pnpm test:stories`
Expected: tất cả PASS (`test:unit` 404, `test:stories` 444).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: render the overlays in both fixtures, from a Server Component in Next.js" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

## Sau khi xong plan

- Đẩy nhánh và mở PR theo lựa chọn của chủ dự án. Sau đó chạy workflow "Update visual baselines" để tạo 64 ảnh mới:
  - Dialog: `Open`, `Alert`.
  - Drawer: `Flush`, `Floating`, `Bottom`.
  - Popover: `Open`, `WithoutArrow`.
  - Tooltip: `Open`.

  Mỗi story có 8 ảnh (2 theme × 4 chế độ).
- Checklist screen reader (spec §7, lớp 6) cho bốn component mới: ghi "chưa kiểm tra" nếu chưa làm.

---

## Sau khi thực thi (2026-10-05)

Plan được chạy theo subagent-driven development. opencode (`opencode/muse-spark-1.3-contributor-free`) viết code từ các task ở trên, và Claude review từng task rồi review cả nhánh. Code trong các task là bản **trước** các lần sửa dưới đây. Code cuối cùng nằm trên nhánh `feat/plan-a-overlays`.

**Lỗi trong code của plan, đã sửa:**

| Phát hiện ở | Lỗi | Commit |
|---|---|---|
| Review Task 3 | `useControllableState` ở chế độ controlled nuốt yêu cầu lặp lại mà cha đã từ chối | `fe8915e` |
| Review Task 4 | `<dialog>` bị đóng theo cách gốc rồi React render trước sự kiện `close`: dialog mở lại, giữ khoá cuộn và mục modal stack | `e5f0460` |
| Review Task 6 | WebKit: bấm trigger để đóng Popover làm focus rơi về `<body>` | `9fbcc1a` |
| Review cả nhánh (Critical) | Tooltip bọc `PopoverTrigger`: nhấn Esc làm `showPopover()` ném `InvalidStateError` và sập cả app (Chromium, WebKit). `usePopover` giờ thử lại ở task sau | `ca2fed7`, `0565ba3` |
| Review cả nhánh | Safari: tooltip trên trigger mở overlay không đóng và nuốt Esc đầu tiên. Tooltip giờ đóng khi bấm trigger, spec §6.3 được bổ sung | `c18559d` |
| Review cả nhánh | Nội dung có chiều cao cố định bị co về 0 trong panel đang cuộn (`flex-shrink: 0`) | `62061fd` |
| Review cả nhánh | Firefox/WebKit mở dialog dài ở vị trí đã cuộn tới cuối | `b8a2d60` |
| Review cả nhánh | Phần tử có focus trước khi mở đã bị gỡ: focus về trigger | `2841b30` |
| Review cả nhánh | Thiếu type test của spec §7 | `6e1e7f4` |
| Review cả nhánh | Cảnh báo dev của `TooltipTrigger` báo sai khi trigger bị ẩn, và chạy cả ở production | `02062d7` |
| Review cả nhánh | Một lần bấm không thành click làm lần bấm phím kế tiếp vào trigger Popover bị bỏ qua | `49a9107` |
| Review cả nhánh | Mẫu code trong Tooltip.mdx không chạy được; docs thiếu `closeOnOutsideClick`, các prop vị trí của Tooltip, khoảng cách mũi tên của Popover | `6bdb663`, `92cc781` |
| Review cả nhánh | `.vitest/` (ảnh chụp khi test trình duyệt fail) chưa có trong `.gitignore` | `333ce18` |

**Số test cuối cùng:**
- `test:unit`: 423 PASS, 2 skipped.
- `test:stories`: 480 PASS (80 story × 3 trình duyệt × 2 theme).
- `test:fixtures`: cả hai fixture PASS.

**Changeset.** Theo review PR #5, changeset `minor` cho `0.2.0` (spec §8) bắt đầu từ Plan A, thay vì đợi Plan E như ghi ở phần "Không làm ở plan này" và Global Constraints. File `.changeset/phase-2-overlays.md` ghi Dialog, Drawer, Popover và Tooltip, mốc trình duyệt nâng lên Safari/iOS 17.4 (thay đổi phá vỡ), và việc `asChild` nhận con từ Server Component. Plan E bổ sung các component của nó vào changeset này.

**Chờ chủ dự án quyết (I1).**
- Hiện check tương phản chỉ đo `text` và `text-muted` trên panel phủ scrim, trong khi spec §4.4 yêu cầu đo mọi cặp chữ.
- Nếu đo đủ, ở light, trên lớp phủ:
  - chữ của Badge success/warning/danger chỉ còn 4.37:1;
  - Badge accent còn 3.40:1, dưới số đã ghi ở §4.9 dòng 7;
  - focus ring còn 1.20:1, dưới số đã ghi ở §4.9 dòng 2.
- Hai cách:
  - làm đậm 3% ba token trạng thái "ngoài mockup" của light: `#125c36` thành `#115934`, `#774400` thành `#734200`, `#96232c` thành `#92222b`;
  - hoặc ghi thêm các dòng mới vào §4.9.

**Để lại cho các plan sau** (các nhận xét Minor của review, chưa sửa):
- `focus.ts`:
  - `checkVisibility()` coi `visibility: hidden` là nhìn thấy được;
  - selector `summary` khớp cả `summary` không phải con đầu của `details`;
  - chưa xử lý fieldset bị disabled.
- `modal.tsx`:
  - lần reset cuộn chậm một task (thêm cho WebKit) xoá mất `scrollIntoView()` mà code người dùng chạy trong effect lúc mở;
  - `forceRender()` trong `onCancel` không có tác dụng.
- Popover controlled từ chối đóng nhận `onOpenChange(false)` hai lần cho một lần bấm trigger.
- Sau khi đóng overlay bằng Esc, Chromium và WebKit hiện lại tooltip của trigger (focus quay về qua bàn phím); Firefox thì không.
- `flex-shrink: 0` trên con của panel làm thân drawer kiểu `flex-grow: 1; min-height: 0; overflow: auto` không tự cuộn nữa; nên ghi một dòng trong docs của Drawer.
- Thiếu story cho:
  - side `left`/`top` của Drawer;
  - Popover controlled mở lại;
  - Tooltip trên thiết bị chạm;
  - dọn dẹp khi Tooltip unmount;
  - `<form method="dialog">` với input thật.
- `checkOverlays` của fixture ném lỗi khi hết thời gian chờ, thay vì ghi vào `problems`.
- `MaxListenersExceededWarning` của Vitest xuất hiện trong mọi lần chạy story.

**Review PR #5 của chủ dự án:**

| # | Nhận xét | Commit |
|---|---|---|
| 1 | Bấm trên khung rồi thả trong panel làm dialog đóng | `45d3cec` |
| 2 | `onCancel` của người dùng không giữ được dialog mở (kèm kiểu `onCancel` cho `DialogContent`) | `43989dd`, `c9bc0e5` |
| 3 | `openTooltips` theo `useId()` trùng giữa các React root | `eddd6fb` |
| 4 | Reset cuộn đẩy phần tử có focus ra ngoài tầm nhìn (WCAG 2.4.11) | `3a6ef98` |
| 5 | Vòng thử lại trong `usePopover` chỉ chữa triệu chứng | `7802017` |
| 6 | Nguyên nhân gốc ở Tooltip; tooltip hiện lại sau Esc | `379b6f6` |
| 7 | Focus không vào Popover khi `showPopover()` được thử lại | `5d36d22` |
| 8 | Safari: light dismiss bằng một nút khác kéo focus về trigger | `6e153e6` |
| 9 | Popover controlled từ chối đóng nhận `onOpenChange(false)` hai lần | `d52b3b1` |
| 10 | Tooltip mở bằng hover còn mở dưới modal và lấy Esc đầu tiên | `b8ab5ff` |
| 11 | Con của `TooltipTrigger` không chuyển ref thì hỏng im lặng | `9f19840` |
| 12 | `mergeRefs(...)` inline tạo callback ref mới mỗi render | `7222424`, `8d3b58d` |
| 13 | Danh sách tabbable khác nơi Tab đi tới (fieldset disabled, radio) | `c88ae22` |
| 14 | Quy tắc trả focus viết hai lần | `000c110` |
| 15 | `asChild` của Button không giải lazy child | `45f0e95` |
| 16 | Changelog không nhắc gì tới giai đoạn 2 | `9e2ffcc` |

- Khác với đề xuất trong review:
  - Mục 3: hai root `createRoot` dùng chung một bộ đếm `useId` nên không bao giờ trùng id. Story vì vậy hydrate hai island render từ server, nơi id trùng thật (`_R_0_`).
  - Mục 8: chỉ bỏ trả focus khi bấm vào một phần tử nhận focus được, để bấm vào vùng trống vẫn trả focus về trigger như §6.3.
  - Mục 12: memo ref chỉ sửa lần mở sau. Lúc mount, `useFloating` phải đợi hết commit để trigger đứng sau có ref.
- Các mục Minor đã sửa nhờ review này: fieldset bị disabled, reset cuộn xoá `scrollIntoView()` của người dùng, `onOpenChange(false)` hai lần, tooltip hiện lại sau Esc.
- Số test sau review:
  - `test:unit`: 442 PASS, 2 skipped.
  - `test:stories`: 534 PASS (89 story × 3 trình duyệt × 2 theme).
  - `test:fixtures`: cả hai fixture PASS.
- Size: `.size-limit.json` ghi lại ở `5a0b3ad`.
