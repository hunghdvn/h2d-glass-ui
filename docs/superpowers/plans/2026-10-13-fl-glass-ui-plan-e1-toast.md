# fl-glass-ui: Plan E1, Toast (giai đoạn 2, phần 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm Toast của giai đoạn 2: hàm `toast()` gọi được ở mọi chỗ trong code client, và `<Toaster />` đặt một lần trong app để hiện các toast đó, kể cả khi một Dialog hay Drawer đang mở. Kèm trang docs của Toast và kịch bản "toast trong Dialog" ở hai fixture.

**Architecture:**
- **Store** (`src/components/toast/store.ts`, module thuần, không có `"use client"`).
  - Giữ mọi toast theo thứ tự cũ trước, mới sau, cùng cấu hình của Toaster đang gắn (`max`, `duration`).
  - Giữ đồng hồ của từng toast đang hiện, và các lý do làm giờ đứng yên (con trỏ, focus, trang bị ẩn).
  - Chỉ toast đang hiện mới chạy giờ.
  - Store nằm ngoài React, nên `toast()` gọi được cả trước khi Toaster mount.
- **`toast()`** (`toast.ts`, `"use client"`).
  - Nhận tiêu đề hoặc options, gán id, rồi đưa vào store. Kèm `toast.success`, `.error`, `.warning`, `.info` và `.dismiss`.
  - Trên server nó không làm gì, chỉ in cảnh báo dev.
- **`Toaster`** (`Toaster.tsx`, `"use client"`): một `<section>` chứa danh sách toast (vùng live polite) và một vùng live assertive.
  - **Trên trang:** vùng là `popover="manual"`, hiện ngay khi mount.
  - **Khi một Dialog hay Drawer của lib đang mở:** vùng vào `.flg-toast-host` của modal trên cùng bằng `createPortal`. Danh sách modal lấy từ modal stack của Plan A.
  - **Bàn phím:** F8 đưa focus vào vùng, Esc đóng toast đang có focus. Khi toast đang có focus đóng, focus chuyển sang chỗ khác.
- **CSS** (`toast.css`): dựng lại đúng mockup P3 + S2.
  - Kính bo `--flg-radius-md`, vạch 3px màu trạng thái ở mép trái, icon 17px.
  - Vùng toast đặt giữa phía dưới, cách mép 16px.

**Tech Stack:** Như Plan D: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md`:
- §2: Plan E gồm Toast, docs chung, fixtures, changeset `0.2.0`. Chủ dự án tách thành E1 (plan này: Toast) và E2 (các mục API trước `0.2.0`, docs chung, changeset) ngày 2026-10-13.
- §3.3 và §3.4: vùng toast trên trang, và đích `.flg-toast-host` trong khung của Dialog.
- §3.5: animation lúc mở.
- §4.1 và §4.3: mockup đã duyệt; kích thước và giao diện của Toast.
- §4.4: phép đo icon trạng thái.
- §4.5: forced colors.
- §5: modal stack; cảnh báo dev.
- §6.3: `toast` và `Toaster`.
- §7: kiểm thử, fixture.
- §8: trang MDX.

Và §4.9 của `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`: thêm dòng 14.

**Mockup chuẩn:** `docs/superpowers/specs/mockups/phase-2-toast.html`: **P3** (giữa phía dưới) và **S2** (icon và vạch màu bên trái).
- Mockup không vẽ toast `warning`. Toast này dùng `--flg-warning` (spec §4.3) và icon tam giác.
- Khi lập kế hoạch, ảnh chụp story `Toast/Default` đã được so với mockup S2, ở light và dark.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/plan-e1-tasks`, mỗi task một commit, và mỗi task đã chạy riêng các lệnh kiểm tra của nó.
- Test viết trước của mỗi task đã được chạy trên commit cha của task, để xác nhận nó fail đúng như plan ghi.
- Mọi khối code trong plan được lấy thẳng từ các commit đó.

Kết quả ở commit cuối:

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 753 test PASS, 3 skip (trước plan: 706 PASS, 3 skip), gồm React 19, React 18.3, script và type test |
| `pnpm test:stories` | 912 test PASS (trước plan: 882): 152 story × 3 trình duyệt × 2 theme, kèm axe |
| `pnpm check:contrast` | PASS. Dòng 14 mới ở §4.9: icon `info` của toast ở dark (Task 5) |
| `pnpm check:package` | PASS |
| `pnpm test:fixtures` | Cả hai fixture PASS, ở production lẫn development |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | PASS |

Mười phát hiện từ lần chạy thử đã được đưa vào plan. Spec được cập nhật theo, trong chính các task:

1. **Vùng live phải có trong trang trước toast.** Screen reader chỉ đọc thay đổi trong một vùng live mà nó đã biết.
   - Vì vậy `Toaster` render vùng trống trước. Toast xếp hàng từ trước khi Toaster mount chỉ vào sau đó một task.
   - Toaster không render gì trên server và trước lần commit đầu ở client, nên không lệch khi hydrate (Task 2).
2. **Đổi `max` hoặc `duration` của một Toaster đang hiện không được xoá danh sách rồi hiện lại**, vì screen reader sẽ đọc lại cả danh sách. Store có thêm `configure()` để nhận cấu hình mới tại chỗ (Task 2).
3. **Vùng toast không được có `transform`.** Một `transform` biến vùng thành backdrop root: kính của toast khi đó chỉ làm mờ vùng trong suốt, không thấy trang. Đây cũng là lý do khung của Dialog không có `transform` (§3.4). Vị trí giữa dùng `left: 0; right: 0; margin-inline: auto` (Task 2).
4. **jsdom ẩn `[popover]` nhưng không có `showPopover`.** Stylesheet mặc định của jsdom ẩn phần tử popover chưa mở.
   - Test của Toaster truy vấn với `{ hidden: true }`.
   - jsdom không đặt tên cho phần tử bị ẩn, nên tên của vùng được đọc từ thuộc tính `aria-label` (Task 2).
5. **Toast vừa được chèn còn ở `opacity: 0` của `@starting-style`.** Vì vậy story không dùng `toBeVisible` cho nội dung của toast vừa hiện (Task 2).
6. **Focus chuyển sang toast thế chỗ thì không có `relatedTarget`**, vì toast trước đã bị gỡ khỏi DOM.
   - Nếu đọc "focus từ ngoài vào" từ sự kiện, chỗ focus cũ bị ghi đè, và focus không về được nút đã bấm F8.
   - Vì vậy Toaster ghi việc focus đang ở trong vùng bằng một cờ (Task 3).
7. **Một Tooltip đang mở nhận Esc trước, ở pha capture.** Toaster bỏ qua Esc đã bị chặn, nên mỗi lần Esc chỉ đóng một thứ.
   - Ghi chú của Plan B "Tooltip nhường Esc cho mọi `[popover]` đang có focus, kể cả `manual`" không còn đúng. Từ Plan C, focus trong một popover `manual` không lấy Esc của Tooltip.
   - Không cần sửa Tooltip (Task 3).
8. **Icon `info` dùng `--flg-accent-solid`, đúng như mockup S2.** Nó đạt 3.04:1 ở light và chỉ 2.29:1 ở dark, nên thành dòng 14 của §4.9.
   - Check mới `toast-info-icon` chỉ đo màu này. Icon `success`, `warning` và `error` mang màu trạng thái, đã được đo như chữ ở ngưỡng 4.5:1, chặt hơn.
   - Gộp bốn màu vào một check vừa đo trùng, vừa để ngoại lệ của màu nhấn che ba màu kia (Task 5).
9. **`src/index.test.ts` liệt kê chính xác mọi export**, nên được cập nhật cùng lúc với export (Task 1, 2).
10. **Server Component không truyền được handler `onClick`.** Vì vậy nút "Notify" của fixture Next.js là một client component riêng của fixture (Task 6).

**Phạm vi:**
- **Không làm ở plan này:**
  - Các mục hoãn "trước `0.2.0`" của Plan B, C và D: hình dạng API của Menu, Select, Tabs, Pagination, Breadcrumb. Tab list tràn cũng thuộc nhóm này, và cần chủ dự án chọn qua ảnh.
  - Mục "Overlays" của Getting started, các ghi chú về toast trên trang Accessibility, và changeset `0.2.0`.

  Tất cả để cho Plan E2.
  - `toast.promise`, toast xếp chồng thành tập, vuốt để đóng (ngoài phạm vi giai đoạn 2, spec §2).
  - Kiểm tra Safari/VoiceOver còn nợ từ PR #7.
- **Ảnh chuẩn visual:**
  - Plan thêm một story có ảnh: `Toast/Default`, tức 8 ảnh mới (2 theme × 4 chế độ).
  - Mọi story khác của plan gắn `no-visual`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-status`, `data-position`).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` nằm trong `src/styles/preferences.css`.
- **Mockup lock.** Plan này không đổi giá trị token nào trong `src/styles/theme/values.ts`. CSS ở plan này là bản đã đối chiếu với mockup, không được "cải thiện".
- `backdrop-filter` chỉ có ở các phần tử spec §4.2 liệt kê. Toast là một `Surface` (class `flg-surface`); vùng toast (`flg-toaster`) không có blur, nền hay `transform`.
- **`"use client"`** chỉ có ở `toast.ts` và `Toaster.tsx` (cùng các module client có từ trước). `store.ts` **không** có directive.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. Plan này không thêm changeset.
- **Ngưỡng `size-limit`:**
  - Task 1–5 chạy `pnpm build && pnpm check:package` với ngưỡng cũ (JS 26797 B, CSS 6442 B). Lần chạy thử cho thấy còn dư.
  - Task 6 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme` (phát hiện 10 của Plan B).
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Với file đã có, plan đưa một patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Với file mới, plan đưa toàn bộ nội dung file.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý nhưng không nêu thành test. Mỗi dòng có test ở task tương ứng:

1. **App gọi `toast()` trong lúc khởi động, trước khi Toaster mount.** Toast hiện khi Toaster mount, và vào sau vùng live để screen reader đọc được. Test ở Task 2: `Toaster.test.tsx`, test `shows the toasts given before it mounted a task after its empty region is in the page`.
2. **Nhiều toast hơn `max`.** Toast thừa chờ, và giờ của nó chỉ chạy từ lúc nó hiện. Test:
   - Task 1: `store.test.ts`, test `closes a toast after its time, counted from when it shows, not from when it was added`.
   - Task 2: `Toaster.test.tsx`, test ``closes a toast after its time, and takes `duration` and `max` ``.
3. **Người dùng đang đọc một toast** (con trỏ trên toast, focus trong vùng, hoặc chuyển sang tab khác). Toast không tự đóng; khi tiếp tục, nó chạy nốt thời gian còn lại. Test:
   - Task 1: `store.test.ts`, test `stands still while any reason pauses it, and runs on with the time that was left`.
   - Task 2: `Toaster.test.tsx`, test `stops the time under the pointer, in focus and on a hidden page`, và story `Toast/PausesUnderThePointer`.
4. **Toast đang có focus thì đóng** (Esc, nút đóng, nút hành động, `toast.dismiss`). Focus không rơi về `<body>` khi còn toast khác hoặc còn chỗ cũ. Test ở Task 3: `Toaster.test.tsx`, các test `closes the toast that holds focus on Esc, and hands focus on: next, before, then back` và `leaves focus where the user moved it, and on the body when its old place is gone`, cùng story `Toast/Keyboard`.
5. **Toast hiện trong lúc một Dialog có form đang mở.** Toast nhìn thấy và bấm được; Esc trên toast chỉ đóng toast; chữ đã nhập còn nguyên. Test:
   - Task 4: story `Toast/InADialog`, và `Toaster.test.tsx`, test `moves the region into the host of the modal on top, and back to the page`.
   - Task 6: kịch bản của hai fixture.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/components/toast/store.ts` (và test) | Store: danh sách, `max`, thời gian, tạm dừng, một Toaster (Task 1, 2) |
| `src/components/toast/toast.ts` (và test, test server) | Hàm `toast()` (Task 1) |
| `src/components/toast/Toaster.tsx` (và test) | Vùng toast, vùng live, F8, Esc, focus, chuyển vào modal (Task 2–4) |
| `src/components/toast/Toast.stories.tsx`, `Toast.mdx` | Story và trang docs (Task 2–4, 6) |
| `src/components/toast/index.ts`, `src/index.ts`, `src/index.test.ts` | Export (Task 1, 2) |
| `src/styles/components/toast.css`, `src/styles/index.css`, `src/styles/preferences.css` | Giao diện P3 + S2; forced colors (Task 2, 3, 5) |
| `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Hai module client mới; các class phải có trong `dist/styles.css` (Task 1, 2) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx` | Check `toast-info-icon`, dòng 14 (Task 5) |
| `fixtures/*`, `scripts/test-fixtures.mjs` | Toaster trong hai app fixture; toast trong Dialog (Task 6) |
| Hai spec | Cập nhật theo phát hiện, trong task tương ứng |

---

### Task 1: Store và hàm `toast()`

Phần không cần React: store cấp module và hàm `toast()`. Store giữ toast cả khi chưa có Toaster, và chỉ chạy giờ cho toast đang hiện. Toaster (Task 2) gắn vào store qua `attach()` và `claim()`.

**Files:**
- Create: `src/components/toast/store.ts`, `src/components/toast/toast.ts`, `src/components/toast/index.ts`
- Modify: `src/index.ts`, `scripts/check-use-client.ts`, spec giai đoạn 2
- Test: `src/components/toast/store.test.ts`, `src/components/toast/toast.test.ts`, `src/components/toast/toast.server.test.ts`, `src/index.test.ts`

**Interfaces:**
- Consumes: `devWarn` (`src/internal/warn.ts`).
- Produces (Task 2 dùng):
  - Kiểu `ToastStatus = 'info' | 'success' | 'warning' | 'error'`, `ToastAction { label: string; onClick(event: MouseEvent<HTMLButtonElement>): void }`, `ToastOptions`, `ToastEntry` (toast đã chuẩn hoá: `id`, `title`, `description`, `status`, `action`, `duration`), `ToasterConfig { max: number; duration: number }`, `ToastState { toasts; shown }`, `PauseReason = 'hover' | 'focus' | 'hidden'`.
  - `createToastStore()` và bản dùng chung `toastStore`. Các hàm: `add(entry)`, `dismiss(id?)`, `getState()`, `subscribe(listener)`, `attach(config) => detach`, `pause(reason)`, `resume(reason)`, `claim(token) => boolean`, `release(token)`.
  - `toast(input)`, `toast.success/error/warning/info(input)`, `toast.dismiss(id?)`, kiểu `ToastFunction`.

- [ ] **Step 1: Viết test**

`src/components/toast/store.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createToastStore } from './store';
import type { ToastEntry } from './store';

const entry = (id: string, extra: Partial<ToastEntry> = {}): ToastEntry => ({
  id,
  title: `Toast ${id}`,
  description: undefined,
  status: 'info',
  action: undefined,
  duration: undefined,
  ...extra,
});
const ids = (list: readonly ToastEntry[]) => list.map((item) => item.id);

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps toasts until a Toaster shows them, then shows the first `max`, oldest first', () => {
    const store = createToastStore();
    store.add(entry('a'));
    store.add(entry('b'));
    store.add(entry('c'));
    expect(ids(store.getState().toasts)).toEqual(['a', 'b', 'c']);
    expect(store.getState().shown).toEqual([]);
    store.attach({ max: 2, duration: 5000 });
    expect(ids(store.getState().shown)).toEqual(['a', 'b']);
    // One closes: the waiting one moves up.
    store.dismiss('a');
    expect(ids(store.getState().shown)).toEqual(['b', 'c']);
  });

  it('closes a toast after its time, counted from when it shows, not from when it was added', () => {
    const store = createToastStore();
    store.attach({ max: 1, duration: 5000 });
    store.add(entry('a'));
    store.add(entry('b'));
    vi.advanceTimersByTime(4000);
    expect(ids(store.getState().toasts)).toEqual(['a', 'b']);
    vi.advanceTimersByTime(1000);
    expect(ids(store.getState().shown)).toEqual(['b']);
    // b waited 5000 ms already; its own 5000 ms start now.
    vi.advanceTimersByTime(4999);
    expect(ids(store.getState().shown)).toEqual(['b']);
    vi.advanceTimersByTime(1);
    expect(store.getState().toasts).toEqual([]);
  });

  it("takes the Toaster's time by default, keeps a toast with an action, and honours its own", () => {
    const store = createToastStore();
    store.attach({ max: 5, duration: 1000 });
    store.add(entry('default'));
    store.add(entry('action', { action: { label: 'Undo', onClick: () => {} } }));
    store.add(entry('own', { duration: 3000 }));
    store.add(entry('forever', { duration: Infinity }));
    vi.advanceTimersByTime(1000);
    expect(ids(store.getState().toasts)).toEqual(['action', 'own', 'forever']);
    vi.advanceTimersByTime(2000);
    expect(ids(store.getState().toasts)).toEqual(['action', 'forever']);
    vi.advanceTimersByTime(60_000);
    expect(ids(store.getState().toasts)).toEqual(['action', 'forever']);
  });

  it('updates a toast with the same id in place and starts its time again', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: 1000 });
    store.add(entry('a'));
    store.add(entry('b'));
    vi.advanceTimersByTime(800);
    store.add(entry('a', { title: 'Saved', status: 'success' }));
    expect(ids(store.getState().shown)).toEqual(['a', 'b']);
    expect(store.getState().shown[0]).toMatchObject({ title: 'Saved', status: 'success' });
    vi.advanceTimersByTime(200);
    expect(ids(store.getState().shown)).toEqual(['a']);
    vi.advanceTimersByTime(800);
    expect(store.getState().shown).toEqual([]);
  });

  it('stands still while any reason pauses it, and runs on with the time that was left', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: 1000 });
    store.add(entry('a'));
    vi.advanceTimersByTime(600);
    store.pause('hover');
    store.pause('focus');
    vi.advanceTimersByTime(10_000);
    store.resume('hover');
    vi.advanceTimersByTime(10_000);
    expect(ids(store.getState().shown)).toEqual(['a']);
    store.resume('focus');
    vi.advanceTimersByTime(399);
    expect(ids(store.getState().shown)).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(store.getState().shown).toEqual([]);
  });

  it('stops the time while no Toaster shows the toasts, and runs on when one does', () => {
    const store = createToastStore();
    const detach = store.attach({ max: 3, duration: 1000 });
    store.add(entry('a'));
    vi.advanceTimersByTime(700);
    detach();
    expect(store.getState().shown).toEqual([]);
    vi.advanceTimersByTime(10_000);
    store.attach({ max: 3, duration: 1000 });
    vi.advanceTimersByTime(299);
    expect(ids(store.getState().shown)).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(store.getState().shown).toEqual([]);
  });

  it('closes one toast by id, or all of them', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: Infinity });
    store.add(entry('a'));
    store.add(entry('b'));
    store.add(entry('c'));
    store.dismiss('b');
    expect(ids(store.getState().toasts)).toEqual(['a', 'c']);
    store.dismiss('missing');
    expect(ids(store.getState().toasts)).toEqual(['a', 'c']);
    store.dismiss();
    expect(store.getState().toasts).toEqual([]);
  });

  it('tells its listeners about a change, and keeps the same state object without one', () => {
    const store = createToastStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const before = store.getState();
    store.attach({ max: 3, duration: 1000 });
    store.pause('hover');
    store.resume('hover');
    expect(store.getState()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    store.add(entry('a'));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.dismiss();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('lets one Toaster at a time show the toasts', () => {
    const store = createToastStore();
    const first = {};
    const second = {};
    expect(store.claim(first)).toBe(true);
    expect(store.claim(first)).toBe(true);
    expect(store.claim(second)).toBe(false);
    store.release(second);
    expect(store.claim(second)).toBe(false);
    store.release(first);
    expect(store.claim(second)).toBe(true);
  });
});
```

`src/components/toast/toast.test.ts`:

```ts
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { toastStore } from './store';
import { toast } from './toast';

const last = () => toastStore.getState().toasts.at(-1);

describe('toast', () => {
  afterEach(() => toast.dismiss());

  it('shows an info toast from a title, and returns its id', () => {
    const id = toast('Saved');
    expect(id).toMatch(/^flg-toast-\d+$/);
    expect(last()).toEqual({
      id,
      title: 'Saved',
      description: undefined,
      status: 'info',
      action: undefined,
      duration: undefined,
    });
    // A React element is a title too, not options.
    const title = createElement('strong', null, 'Done');
    toast(title);
    expect(last()?.title).toBe(title);
  });

  it('takes options, and an id that updates the toast with it', () => {
    const onClick = () => {};
    const id = toast({
      id: 'upload',
      title: 'Uploading',
      description: '3 files',
      status: 'warning',
      action: { label: 'Cancel', onClick },
      duration: 2000,
    });
    expect(id).toBe('upload');
    expect(last()).toEqual({
      id: 'upload',
      title: 'Uploading',
      description: '3 files',
      status: 'warning',
      action: { label: 'Cancel', onClick },
      duration: 2000,
    });
    toast.success({ id: 'upload', title: 'Uploaded' });
    expect(toastStore.getState().toasts).toHaveLength(1);
    expect(last()).toMatchObject({ id: 'upload', title: 'Uploaded', status: 'success' });
  });

  it('sets the status with toast.success, .error, .warning and .info', () => {
    toast.success('a');
    expect(last()?.status).toBe('success');
    toast.error({ title: 'b' });
    expect(last()?.status).toBe('error');
    toast.warning('c');
    expect(last()?.status).toBe('warning');
    toast.info('d');
    expect(last()?.status).toBe('info');
  });

  it('closes one toast by id, or all of them', () => {
    const a = toast('a');
    toast('b');
    toast.dismiss(a);
    expect(toastStore.getState().toasts.map((item) => item.title)).toEqual(['b']);
    toast.dismiss();
    expect(toastStore.getState().toasts).toEqual([]);
  });
});
```

`src/components/toast/toast.server.test.ts` (chạy trong môi trường `node`, không có `window`):

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { toastStore } from './store';
import { toast } from './toast';

describe('toast on the server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetDevWarnings();
  });

  it('does nothing but warn, so no toast carries over into the next request', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(typeof window).toBe('undefined');
    expect(toast({ id: 'saved', title: 'Saved' })).toBe('saved');
    expect(toast.error('Failed')).toMatch(/^flg-toast-\d+$/);
    expect(toastStore.getState().toasts).toEqual([]);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] toast() was called on the server, where it does nothing. Call it from code ' +
        'that runs in the browser, such as an event handler or an effect.',
    );
  });
});
```

Và `src/index.test.ts`:

```diff
diff --git a/src/index.test.ts b/src/index.test.ts
index d2c93c2..a6c477b 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -80,6 +80,7 @@ describe('public API', () => {
       'Tooltip',
       'TooltipContent',
       'TooltipTrigger',
+      'toast',
     ]);
   });
 });
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/toast src/index.test.ts`
Expected: Ba file test mới không chạy được vì chưa có `./store` (`Failed to resolve import "./store"`; với `toast.server.test.ts` là `Cannot find module './store'`). `src/index.test.ts` fail với `AssertionError: expected [ 'Accordion', …(75) ] to deeply equal [ 'Accordion', …(76) ]`.

- [ ] **Step 3: Tạo store**

`src/components/toast/store.ts`:

```ts
import type { MouseEvent, ReactNode } from 'react';

export type ToastStatus = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  /** Runs on a click of the action button; the toast closes after it. */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastOptions {
  /** Names the toast: `toast()` with the same id updates it and starts its time again. */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Default `"info"`. */
  status?: ToastStatus;
  /** A button that runs `onClick`, then closes the toast. */
  action?: ToastAction;
  /**
   * How long it stays, in ms; `Infinity` keeps it until it is closed. Default: the Toaster's
   * `duration`, or `Infinity` for a toast with an `action`.
   */
  duration?: number;
}

/** A toast as the store holds it. */
export interface ToastEntry {
  readonly id: string;
  readonly title: ReactNode;
  readonly description: ReactNode | undefined;
  readonly status: ToastStatus;
  readonly action: ToastAction | undefined;
  readonly duration: number | undefined;
}

/** What the mounted Toaster asks for. */
export interface ToasterConfig {
  /** How many toasts show at once; the others wait. */
  max: number;
  /** The time of a toast that sets none, in ms. */
  duration: number;
}

export interface ToastState {
  /** Every toast, oldest first: the ones shown, then the ones waiting for room. */
  readonly toasts: readonly ToastEntry[];
  /** The first `max` toasts, while a Toaster shows them; none while no Toaster does. */
  readonly shown: readonly ToastEntry[];
}

/** Why the time of the toasts stands still: the pointer, focus, or the page being hidden. */
export type PauseReason = 'hover' | 'focus' | 'hidden';

interface Clock {
  /** Time left, in ms, as of `startedAt` while running. */
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | undefined;
}

const sameList = (a: readonly ToastEntry[], b: readonly ToastEntry[]) =>
  a.length === b.length && a.every((entry, index) => entry === b[index]);

/**
 * The toasts of the page, kept apart from React so `toast()` works anywhere and before a Toaster
 * mounts. Only a toast that shows has a running time: one waiting for room starts when it shows.
 */
export function createToastStore() {
  let toasts: readonly ToastEntry[] = [];
  let config: ToasterConfig | null = null;
  let state: ToastState = { toasts, shown: [] };
  let owner: object | null = null;
  const clocks = new Map<string, Clock>();
  const pauses = new Set<PauseReason>();
  const listeners = new Set<() => void>();

  const stop = (clock: Clock) => {
    if (clock.handle === undefined) return;
    clearTimeout(clock.handle);
    clock.handle = undefined;
    clock.remaining -= Date.now() - clock.startedAt;
  };

  const sync = () => {
    const shown = config ? toasts.slice(0, config.max) : [];
    const running = config !== null && pauses.size === 0;
    for (const [id, clock] of clocks) {
      if (!toasts.some((entry) => entry.id === id)) {
        stop(clock);
        clocks.delete(id);
      }
    }
    for (const entry of toasts) {
      let clock = clocks.get(entry.id);
      if (!shown.includes(entry)) {
        if (clock) stop(clock);
        continue;
      }
      if (!clock) {
        const duration = entry.duration ?? (entry.action ? Infinity : (config?.duration ?? 0));
        clock = { remaining: duration, startedAt: 0, handle: undefined };
        clocks.set(entry.id, clock);
      }
      if (!running) {
        stop(clock);
      } else if (clock.handle === undefined && Number.isFinite(clock.remaining)) {
        const id = entry.id;
        clock.startedAt = Date.now();
        clock.handle = setTimeout(() => dismiss(id), Math.max(0, clock.remaining));
      }
    }
    if (sameList(state.toasts, toasts) && sameList(state.shown, shown)) return;
    state = { toasts, shown };
    for (const listener of listeners) listener();
  };

  /** Adds a toast, or updates the one with the same id in place and starts its time again. */
  const add = (entry: ToastEntry) => {
    const index = toasts.findIndex((item) => item.id === entry.id);
    if (index < 0) {
      toasts = [...toasts, entry];
    } else {
      const clock = clocks.get(entry.id);
      if (clock) stop(clock);
      clocks.delete(entry.id);
      toasts = toasts.map((item, at) => (at === index ? entry : item));
    }
    sync();
  };

  /** Closes one toast, or every toast without an id. */
  const dismiss = (id?: string) => {
    const next = id === undefined ? [] : toasts.filter((entry) => entry.id !== id);
    if (next.length === toasts.length) return;
    toasts = next;
    sync();
  };

  return {
    add,
    dismiss,
    getState: () => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Shows the toasts as `next` says. The returned function hides them again. */
    attach(next: ToasterConfig): () => void {
      config = next;
      sync();
      return () => {
        if (config !== next) return;
        config = null;
        sync();
      };
    },
    pause(reason: PauseReason) {
      pauses.add(reason);
      sync();
    },
    resume(reason: PauseReason) {
      if (!pauses.delete(reason)) return;
      sync();
    },
    /** Makes `token` the Toaster that shows the toasts, unless another one already is. */
    claim(token: object): boolean {
      if (owner !== null && owner !== token) return false;
      owner = token;
      return true;
    },
    release(token: object) {
      if (owner === token) owner = null;
    },
  };
}

export type ToastStore = ReturnType<typeof createToastStore>;

/** The page's toasts: one store for `toast()` and the Toaster. */
export const toastStore = createToastStore();
```

- [ ] **Step 4: Tạo hàm `toast()` và export**

`src/components/toast/toast.ts`:

```ts
'use client';

import { isValidElement } from 'react';
import type { ReactNode } from 'react';
import { devWarn } from '../../internal/warn';
import { toastStore } from './store';
import type { ToastOptions, ToastStatus } from './store';

type Input = ReactNode | ToastOptions;
type StatusInput = ReactNode | Omit<ToastOptions, 'status'>;

export interface ToastFunction {
  /** Shows a toast, by default an `info` one, and returns its id. */
  (input: Input): string;
  success(input: StatusInput): string;
  error(input: StatusInput): string;
  warning(input: StatusInput): string;
  info(input: StatusInput): string;
  /** Closes the toast with this id, or every toast without one. */
  dismiss(id?: string): void;
}

let count = 0;

/** Options are a plain object with a `title`; anything else is the title itself. */
function isOptions(input: Input): input is ToastOptions {
  return (
    typeof input === 'object' &&
    input !== null &&
    !Array.isArray(input) &&
    !isValidElement(input) &&
    'title' in input
  );
}

function show(input: Input, status?: ToastStatus): string {
  const options: ToastOptions = isOptions(input) ? input : { title: input };
  count += 1;
  const id = options.id ?? `flg-toast-${count}`;
  // A store on the server would carry toasts from one request into the next.
  if (typeof window === 'undefined') {
    devWarn(
      'toast() was called on the server, where it does nothing. Call it from code that runs in ' +
        'the browser, such as an event handler or an effect.',
    );
    return id;
  }
  toastStore.add({
    id,
    title: options.title,
    description: options.description,
    status: status ?? options.status ?? 'info',
    action: options.action,
    duration: options.duration,
  });
  return id;
}

/**
 * Shows a toast from anywhere in client code. A `<Toaster />`, placed once in the app, shows them;
 * toasts shown before it mounts wait for it.
 */
export const toast: ToastFunction = Object.assign((input: Input) => show(input), {
  success: (input: StatusInput) => show(input, 'success'),
  error: (input: StatusInput) => show(input, 'error'),
  warning: (input: StatusInput) => show(input, 'warning'),
  info: (input: StatusInput) => show(input, 'info'),
  dismiss: (id?: string) => toastStore.dismiss(id),
});
```

`src/components/toast/index.ts`:

```ts
export { toast } from './toast';
export type { ToastFunction } from './toast';
export type { ToastAction, ToastOptions, ToastStatus } from './store';
```

```diff
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 730a1e9..c6404f5 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -24,6 +24,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/tabs/Tabs.tsx',
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
+  'src/components/toast/toast.ts',
 ];
 
 /**
diff --git a/src/index.ts b/src/index.ts
index 10fe28f..0a58f42 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -172,3 +172,5 @@ export type {
   DropdownMenuProps,
   DropdownMenuTriggerProps,
 } from './components/dropdown-menu';
+export { toast } from './components/toast';
+export type { ToastAction, ToastFunction, ToastOptions, ToastStatus } from './components/toast';
```

- [ ] **Step 5: Cập nhật spec**

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index f8431a4..e9db55f 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -911,6 +911,8 @@ toast.dismiss(id?: string): void;                    // không có id thì đón
 - **Store:**
   - Dữ liệu nằm trong một store cấp module.
   - Gọi `toast()` trước khi `Toaster` mount thì toast được xếp hàng và hiện khi `Toaster` mount.
+  - Chỉ toast đang hiện mới chạy giờ. Toast đang chờ (vượt `max`, hoặc chưa có `Toaster`) bắt đầu tính giờ khi nó hiện. Khi `Toaster` unmount, giờ của mọi toast đứng yên cho tới khi một `Toaster` khác hiện chúng (Plan E1).
+  - `toast()` luôn trả về id, kể cả trên server: id được truyền vào, hoặc một id mới.
   - Trên server, `toast()` không làm gì và in cảnh báo dev, để không rò toast giữa các request.
   - Chỉ `Toaster` mount đầu tiên hiển thị. Các `Toaster` khác in cảnh báo dev và render `null`.
 - **Props của `<Toaster>`:**
```

- [ ] **Step 6: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm build && pnpm check:package
```

Expected:
- `pnpm test:unit`: 720 test PASS, 3 skip (trước task: 706).
- `check:package` PASS: `dist/components/toast/toast.js` có `"use client"`, `dist/components/toast/store.js` không có.

- [ ] **Step 7: Commit**

```bash
git add src/components/toast src/index.ts src/index.test.ts scripts/check-use-client.ts docs/superpowers/specs
git commit -m "feat(toast): the toast store and the toast() function" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: `Toaster`, vùng live và thời gian

`Toaster` hiện các toast của store.
- **Chỉ một Toaster:** Toaster mount đầu tiên nhận việc hiện toast; các Toaster khác in cảnh báo dev và render `null`.
- **Thứ tự render:** vùng trống vào trang trước, các toast vào sau một task (phát hiện 1).
- **Vùng toast:** trên trang là `popover="manual"`, hiện ngay khi mount.
- **Thời gian:** đứng yên khi con trỏ ở trên vùng, khi focus ở trong vùng, và khi trang bị ẩn.

Store có thêm `configure()` cho phát hiện 2. CSS là mockup P3 + S2.

**Files:**
- Create: `src/components/toast/Toaster.tsx`, `src/styles/components/toast.css`, `src/components/toast/Toast.stories.tsx`
- Modify: `src/components/toast/store.ts`, `src/components/toast/index.ts`, `src/index.ts`, `src/styles/index.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, spec giai đoạn 2
- Test: `src/components/toast/Toaster.test.tsx`, `src/components/toast/Toaster.test-d.ts`, `src/components/toast/store.test.ts`, `src/index.test.ts`

**Interfaces:**
- Consumes: store của Task 1 (`toastStore`, `ToastEntry`, `ToastState`, `ToastStatus`); `Button` (`src/components/button/Button.tsx`); `strokeIcon` (`src/internal/icons.tsx`); `mergeRefs`, `useIsoLayoutEffect`, `devWarn`.
- Produces:
  - `configure(config: ToasterConfig): void` trong store. Nó đổi cấu hình của Toaster đang gắn mà không ẩn các toast.
  - `Toaster` (`forwardRef<HTMLElement, ToasterProps>`), kiểu `ToasterProps { position?; max?; duration?; hotkey?; labels?; className? }`, `ToastPosition`, `ToasterLabels`.
  - Các class `flg-toaster`, `flg-toaster-list`, `flg-toast`, `flg-toast-icon`, `flg-toast-text`, `flg-toast-title`, `flg-toast-description`, `flg-toast-close`.
  - Task 3 và 4 sửa `Toaster.tsx`.

- [ ] **Step 1: Viết test**

`src/components/toast/Toaster.test.tsx`:

```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { toast } from './toast';
import { Toaster } from './Toaster';
import type { ToasterProps } from './Toaster';

/** Renders a Toaster and lets the task pass after which it shows the toasts. */
function mount(props: ToasterProps = {}) {
  const result = render(<Toaster {...props} />);
  act(() => {
    vi.advanceTimersByTime(0);
  });
  return result;
}
const show = (fn: () => unknown) =>
  act(() => {
    fn();
  });
// jsdom hides a [popover] that it cannot show, so every role query takes hidden elements.
const region = () => screen.getByRole('region', { hidden: true });
const items = () => within(region()).queryAllByRole('listitem', { hidden: true });

describe('Toaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetDevWarnings();
  });
  afterEach(() => {
    act(() => toast.dismiss());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders nothing on the server', () => {
    expect(renderToString(<Toaster />)).toBe('');
  });

  it('names its region with the hotkey, with both live regions there before any toast', () => {
    mount();
    const section = region();
    // jsdom names no hidden element, so the label is read off the attribute.
    expect(section).toHaveAttribute('aria-label', 'Notifications (F8)');
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveAttribute('tabindex', '-1');
    expect(section).toHaveAttribute('popover', 'manual');
    expect(section).toHaveAttribute('data-position', 'bottom-center');
    expect(section.querySelector('ol')).toHaveAttribute('aria-live', 'polite');
    const assertive = section.querySelector('[aria-live="assertive"]');
    expect(assertive).toHaveAttribute('aria-atomic', 'true');
    expect(assertive).toHaveClass('flg-visually-hidden');
    expect(items()).toHaveLength(0);
  });

  it('shows the toasts given before it mounted a task after its empty region is in the page', () => {
    toast('Queued');
    render(<Toaster />);
    expect(items()).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(items()).toHaveLength(1);
    expect(items()[0]).toHaveTextContent('Queued');
  });

  it('shows a named status icon, the title and description, an action and a close button', () => {
    const onClick = vi.fn();
    mount();
    show(() =>
      toast.success({
        title: 'Saved',
        description: 'All changes are stored.',
        action: { label: 'Undo', onClick },
      }),
    );
    const [item] = items();
    if (!item) throw new Error('no toast');
    expect(item).toHaveClass('flg-surface', 'flg-toast');
    expect(item).toHaveAttribute('data-status', 'success');
    expect(within(item).getByRole('img', { hidden: true, name: 'Success' })).toBeInTheDocument();
    expect(within(item).getByText('Saved')).toHaveClass('flg-toast-title');
    expect(within(item).getByText('All changes are stored.')).toHaveClass('flg-toast-description');
    // The action runs, then the toast closes.
    fireEvent.click(within(item).getByRole('button', { hidden: true, name: 'Undo' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(items()).toHaveLength(0);
    show(() => toast('Plain'));
    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Dismiss notification' }));
    expect(items()).toHaveLength(0);
  });

  it('closes a toast after its time, and takes `duration` and `max`', () => {
    mount({ duration: 1000, max: 2 });
    show(() => {
      toast('a');
      toast('b');
      toast('c');
    });
    expect(items().map((item) => item.textContent)).toEqual(['a', 'b']);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(items().map((item) => item.textContent)).toEqual(['c']);
  });

  it('reads an error from the assertive region, and drops the copy when it closes', () => {
    mount();
    show(() => toast.error({ title: 'Not sent', description: 'Check the connection.' }));
    const [item] = items();
    expect(item).toHaveAttribute('aria-live', 'off');
    const assertive = region().querySelector('[aria-live="assertive"]');
    expect(assertive).toHaveTextContent('Error: Not sent');
    expect(assertive).toHaveTextContent('Check the connection.');
    show(() => toast.dismiss());
    expect(assertive).toBeEmptyDOMElement();
    // Other toasts are read from the polite list.
    show(() => toast.warning('Low space'));
    expect(items()[0]).not.toHaveAttribute('aria-live');
    expect(assertive).toBeEmptyDOMElement();
  });

  it('stops the time under the pointer, in focus and on a hidden page', () => {
    mount({ duration: 1000 });
    show(() => toast('Saved'));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.pointerEnter(region());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.pointerLeave(region());
    const close = screen.getByRole('button', { hidden: true, name: 'Dismiss notification' });
    act(() => close.focus());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => close.blur());
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(items()).toHaveLength(1);
    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(items()).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(items()).toHaveLength(0);
  });

  it('takes its labels, position and class', () => {
    mount({
      position: 'top-right',
      hotkey: 'F6',
      className: 'mine',
      labels: { region: 'Thông báo', dismiss: 'Đóng', success: 'Thành công' },
    });
    show(() => toast.success('Đã lưu'));
    const section = region();
    // jsdom names no hidden element, so the label is read off the attribute.
    expect(section).toHaveAttribute('aria-label', 'Thông báo (F6)');
    expect(section).toHaveAttribute('data-position', 'top-right');
    expect(section).toHaveClass('flg-toaster', 'mine');
    expect(
      within(section).getByRole('img', { hidden: true, name: 'Thành công' }),
    ).toBeInTheDocument();
    expect(within(section).getByRole('button', { hidden: true, name: 'Đóng' })).toBeInTheDocument();
  });

  it('lets only the first Toaster show the toasts; another warns and renders nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Toaster />
        <Toaster position="top-left" />
      </>,
    );
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getAllByRole('region', { hidden: true })).toHaveLength(1);
    expect(region()).toHaveAttribute('data-position', 'bottom-center');
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] More than one <Toaster> is mounted. Only the first shows toasts; this one ' +
        'renders nothing.',
    );
  });
});
```

`src/components/toast/Toaster.test-d.ts` (spec §7: union của `position` từ chối giá trị lạ):

```ts
import { expectTypeOf, test } from 'vitest';
import type { ToastOptions } from './store';
import { toast } from './toast';
import type { ToasterProps } from './Toaster';

test('Toaster takes only the documented positions', () => {
  expectTypeOf<ToasterProps['position']>().toEqualTypeOf<
    | 'bottom-center'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'top-right'
    | 'top-left'
    | undefined
  >();
  // @ts-expect-error 'center' is not a position
  const unknown: ToasterProps = { position: 'center' };
  expectTypeOf(unknown).toBeObject();
});

test('a toast takes only the documented statuses, and the helpers set their own', () => {
  expectTypeOf<ToastOptions['status']>().toEqualTypeOf<
    'info' | 'success' | 'warning' | 'error' | undefined
  >();
  // @ts-expect-error 'danger' is a Badge variant, not a toast status
  const danger: ToastOptions = { title: 'Failed', status: 'danger' };
  expectTypeOf(danger).toBeObject();
  // @ts-expect-error toast.success sets the status itself
  toast.success({ title: 'Saved', status: 'error' });
  expectTypeOf(toast('Saved')).toEqualTypeOf<string>();
});
```

Thêm test cho `configure()`, và `Toaster` vào danh sách export:

```diff
diff --git a/src/components/toast/store.test.ts b/src/components/toast/store.test.ts
index f2c7d1b..31a9c1f 100644
--- a/src/components/toast/store.test.ts
+++ b/src/components/toast/store.test.ts
@@ -114,6 +114,26 @@ describe('toast store', () => {
     expect(store.getState().shown).toEqual([]);
   });
 
+  it('takes a new `max` or `duration` without hiding the toasts in between', () => {
+    const store = createToastStore();
+    store.configure({ max: 1, duration: 1000 });
+    store.add(entry('a'));
+    store.add(entry('b'));
+    // Nothing to configure before a Toaster attaches.
+    expect(store.getState().shown).toEqual([]);
+    const detach = store.attach({ max: 3, duration: 1000 });
+    const listener = vi.fn();
+    store.subscribe(listener);
+    store.configure({ max: 1, duration: 1000 });
+    expect(ids(store.getState().shown)).toEqual(['a']);
+    // One change: not empty first, then full again.
+    expect(listener).toHaveBeenCalledOnce();
+    // A detach from an earlier attach does nothing once another has attached.
+    store.attach({ max: 2, duration: 1000 });
+    detach();
+    expect(ids(store.getState().shown)).toEqual(['a', 'b']);
+  });
+
   it('closes one toast by id, or all of them', () => {
     const store = createToastStore();
     store.attach({ max: 3, duration: Infinity });
diff --git a/src/index.test.ts b/src/index.test.ts
index a6c477b..bfea75a 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -77,6 +77,7 @@ describe('public API', () => {
       'TabsList',
       'TabsTrigger',
       'Textarea',
+      'Toaster',
       'Tooltip',
       'TooltipContent',
       'TooltipTrigger',
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/toast src/index.test.ts`
Expected: Cả hai project báo `Failed to resolve import "./Toaster"` cho `Toaster.test.tsx`. Thêm 2 test FAIL: ``takes a new `max` or `duration` without hiding the toasts in between`` với `TypeError: store.configure is not a function`, và test export với `expected [ 'Accordion', …(76) ] to deeply equal [ 'Accordion', …(77) ]`; 15 test PASS. Test kiểu fail với `Cannot find module './Toaster'`.

- [ ] **Step 3: Thêm `configure()` vào store**

```diff
diff --git a/src/components/toast/store.ts b/src/components/toast/store.ts
index 202970f..df7e9a4 100644
--- a/src/components/toast/store.ts
+++ b/src/components/toast/store.ts
@@ -69,6 +69,8 @@ const sameList = (a: readonly ToastEntry[], b: readonly ToastEntry[]) =>
 export function createToastStore() {
   let toasts: readonly ToastEntry[] = [];
   let config: ToasterConfig | null = null;
+  /** The current `attach()` call, so a stale detach does nothing. */
+  let attachment: object | null = null;
   let state: ToastState = { toasts, shown: [] };
   let owner: object | null = null;
   const clocks = new Map<string, Clock>();
@@ -149,14 +151,23 @@ export function createToastStore() {
     },
     /** Shows the toasts as `next` says. The returned function hides them again. */
     attach(next: ToasterConfig): () => void {
+      const self = {};
+      attachment = self;
       config = next;
       sync();
       return () => {
-        if (config !== next) return;
+        if (attachment !== self) return;
+        attachment = null;
         config = null;
         sync();
       };
     },
+    /** Changes what the attached Toaster asks for, without hiding the toasts in between. */
+    configure(next: ToasterConfig) {
+      if (attachment === null) return;
+      config = next;
+      sync();
+    },
     pause(reason: PauseReason) {
       pauses.add(reason);
       sync();
```

- [ ] **Step 4: Tạo `Toaster`**

`src/components/toast/Toaster.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import {
  Fragment,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { strokeIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import { toastStore } from './store';
import type { ToastEntry, ToastState, ToastStatus } from './store';

export type ToastPosition =
  'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

/** The words the Toaster says; translate them here. */
export interface ToasterLabels {
  /** The name of the region, before the hotkey. */
  region: string;
  /** The name of the close button. */
  dismiss: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export interface ToasterProps {
  /** Where the toasts sit. Default `"bottom-center"`. */
  position?: ToastPosition;
  /** How many toasts show at once; the others wait for room. Default 3. */
  max?: number;
  /** How long a toast stays, in ms, when it sets no `duration`. Default 5000. */
  duration?: number;
  /** The key that moves focus to the toasts. Default `"F8"`. */
  hotkey?: string;
  /** Default English words; any of them can be replaced. */
  labels?: Partial<ToasterLabels>;
  className?: string;
}

const DEFAULT_LABELS: ToasterLabels = {
  region: 'Notifications',
  dismiss: 'Dismiss notification',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const EMPTY: ToastState = { toasts: [], shown: [] };

const ICONS: Record<ToastStatus, ReactNode> = {
  success: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
};

function ToastItem({ entry, labels }: { entry: ToastEntry; labels: ToasterLabels }) {
  const { id, status, action } = entry;
  return (
    <li
      className="flg-surface flg-toast"
      data-status={status}
      // An error is read at once from the assertive region instead (spec §6.3).
      aria-live={status === 'error' ? 'off' : undefined}
    >
      <span className="flg-toast-icon">
        {/* Named, so the status is not told by its colour alone. */}
        <svg {...strokeIcon} aria-hidden={undefined} role="img" aria-label={labels[status]}>
          {ICONS[status]}
        </svg>
      </span>
      <div className="flg-toast-text">
        <div className="flg-toast-title">{entry.title}</div>
        {entry.description == null ? null : (
          <div className="flg-toast-description">{entry.description}</div>
        )}
      </div>
      {action ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={(event) => {
            action.onClick(event);
            toastStore.dismiss(id);
          }}
        >
          {action.label}
        </Button>
      ) : null}
      <button
        type="button"
        className="flg-toast-close"
        aria-label={labels.dismiss}
        onClick={() => toastStore.dismiss(id)}
      >
        <svg {...strokeIcon}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}

/**
 * Shows the toasts of `toast()`. Place one in the app; any other Toaster renders nothing. On the
 * page the toasts are a manual popover, in the top layer above the page.
 */
export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
  {
    position = 'bottom-center',
    max = 3,
    duration = 5000,
    hotkey = 'F8',
    labels: labelsProp,
    className,
  },
  ref,
) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [token] = useState<object>(() => ({}));
  const [active, setActive] = useState(false);
  const state = useSyncExternalStore(toastStore.subscribe, toastStore.getState, () => EMPTY);
  const regionRef = useRef<HTMLElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(ref, regionRef), [ref]);

  // The first Toaster to mount shows the toasts. Nothing renders on the server, or before this.
  useIsoLayoutEffect(() => {
    if (!toastStore.claim(token)) {
      devWarn(
        'More than one <Toaster> is mounted. Only the first shows toasts; this one renders nothing.',
      );
      return;
    }
    setActive(true);
    return () => {
      toastStore.release(token);
      setActive(false);
    };
  }, [token]);

  const config = useRef({ max, duration });
  useEffect(() => {
    config.current = { max, duration };
    toastStore.configure(config.current);
  }, [max, duration]);
  // A task after the empty region is in the page: a screen reader announces what changes in a live
  // region it already knows, so toasts shown before the Toaster mounted come in only then.
  useEffect(() => {
    if (!active) return;
    let detach: (() => void) | undefined;
    const timer = setTimeout(() => {
      detach = toastStore.attach(config.current);
    }, 0);
    return () => {
      clearTimeout(timer);
      detach?.();
    };
  }, [active]);

  // The time stands still while the page is hidden.
  useEffect(() => {
    if (!active) return;
    const update = () =>
      document.visibilityState === 'hidden'
        ? toastStore.pause('hidden')
        : toastStore.resume('hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      toastStore.resume('hidden');
    };
  }, [active]);

  // On the page the region is a manual popover, shown as soon as it mounts. A region that goes away
  // takes the pointer and focus with it.
  useIsoLayoutEffect(() => {
    const region = regionRef.current;
    if (!active || !region) return;
    if (typeof region.showPopover === 'function' && !region.matches(':popover-open')) {
      region.showPopover();
    }
    return () => {
      toastStore.resume('hover');
      toastStore.resume('focus');
    };
  }, [active]);

  // Focus that left with a closed toast (to <body>) no longer holds the time.
  useIsoLayoutEffect(() => {
    const region = regionRef.current;
    if (region && !region.contains(document.activeElement)) toastStore.resume('focus');
  }, [state.shown]);

  if (!active) return null;
  const errors = state.shown.filter((entry) => entry.status === 'error');
  return (
    <section
      ref={mergedRef}
      popover="manual"
      className={clsx('flg-toaster', className)}
      data-position={position}
      aria-label={`${labels.region} (${hotkey})`}
      tabIndex={-1}
      onPointerEnter={() => toastStore.pause('hover')}
      onPointerLeave={() => toastStore.resume('hover')}
      onFocus={() => toastStore.pause('focus')}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          toastStore.resume('focus');
        }
      }}
    >
      <ol className="flg-toaster-list" aria-live="polite">
        {state.shown.map((entry) => (
          <ToastItem key={entry.id} entry={entry} labels={labels} />
        ))}
      </ol>
      <div className="flg-visually-hidden" aria-live="assertive" aria-atomic="true">
        {errors.map((entry) => (
          <Fragment key={entry.id}>
            <p>
              {labels.error}: {entry.title}
            </p>
            {entry.description == null ? null : <p>{entry.description}</p>}
          </Fragment>
        ))}
      </div>
    </section>
  );
});
```

- [ ] **Step 5: CSS (mockup P3 + S2)**

`src/styles/components/toast.css`:

```css
/* Toast (spec §4.3 Toast, mockup P3 + S2): glass toasts with a status icon and a 3px bar of the
   status colour at the left edge. The region undoes the browser's styles for [popover]; it has no
   transform, which would make it the backdrop of the toasts' glass instead of the page. */
@layer flg.components {
  .flg-toaster {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    width: 360px;
    max-width: calc(100vw - 32px);
    height: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--flg-text);
    overflow: visible;
    outline: none;
  }
  .flg-toaster:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
  }
  .flg-toaster[data-position^='bottom'] {
    bottom: 16px;
  }
  .flg-toaster[data-position^='top'] {
    top: 16px;
  }
  .flg-toaster[data-position$='center'] {
    right: 0;
    left: 0;
    margin-inline: auto;
  }
  .flg-toaster[data-position$='right'] {
    right: 16px;
  }
  .flg-toaster[data-position$='left'] {
    left: 16px;
  }
  /* Oldest first in the DOM; the newest sits nearest the edge. */
  .flg-toaster-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .flg-toaster[data-position^='top'] .flg-toaster-list {
    flex-direction: column-reverse;
  }

  .flg-toast {
    --flg-toast-color: var(--flg-accent-solid);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 10px 10px 12px;
    border-radius: var(--flg-radius-md);
    overflow: hidden;
    outline: none;
    transition:
      opacity var(--flg-duration-normal) var(--flg-ease),
      translate var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-toast[data-status='success'] {
    --flg-toast-color: var(--flg-success);
  }
  .flg-toast[data-status='warning'] {
    --flg-toast-color: var(--flg-warning);
  }
  .flg-toast[data-status='error'] {
    --flg-toast-color: var(--flg-danger);
  }
  /* It slides in from the edge it sits at (spec §3.5). */
  @starting-style {
    .flg-toast {
      opacity: 0;
      translate: 0 16px;
    }
    .flg-toaster[data-position^='top'] .flg-toast {
      translate: 0 -16px;
    }
  }
  .flg-toast::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    background: var(--flg-toast-color);
  }
  /* The colour is on the span, not the <svg>: in forced colours an <svg> keeps a colour set on it. */
  .flg-toast-icon {
    display: inline-flex;
    flex: none;
    margin-top: 1px;
    color: var(--flg-toast-color);
  }
  .flg-toast-icon > svg {
    width: 17px;
    height: 17px;
  }
  .flg-toast-text {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .flg-toast-title {
    color: var(--flg-text);
    font-size: var(--flg-text-sm);
    font-weight: var(--flg-weight-medium);
    line-height: 1.35;
  }
  .flg-toast-description {
    margin-top: 2px;
    color: var(--flg-text-muted);
    font-size: var(--flg-text-xs);
    line-height: 1.4;
  }
  .flg-toast-close {
    display: inline-flex;
    flex: none;
    margin: 0;
    padding: 2px;
    border: 0;
    border-radius: var(--flg-radius-xs);
    background: transparent;
    color: var(--flg-text-muted);
    cursor: pointer;
  }
  .flg-toast-close > svg {
    width: 14px;
    height: 14px;
  }
  .flg-toast-close:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
}
```

- [ ] **Step 6: Export, danh sách của các script kiểm tra gói, và spec**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 54834b3..029a980 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -67,6 +67,14 @@ const SHIPPED_CLASSES = [
   'flg-pagination',
   'flg-pagination-page',
   'flg-pagination-ellipsis',
+  'flg-toaster',
+  'flg-toaster-list',
+  'flg-toast',
+  'flg-toast-icon',
+  'flg-toast-text',
+  'flg-toast-title',
+  'flg-toast-description',
+  'flg-toast-close',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index c6404f5..5c79acf 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -25,6 +25,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
   'src/components/toast/toast.ts',
+  'src/components/toast/Toaster.tsx',
 ];
 
 /**
diff --git a/src/components/toast/index.ts b/src/components/toast/index.ts
index 69db189..80ca085 100644
--- a/src/components/toast/index.ts
+++ b/src/components/toast/index.ts
@@ -1,3 +1,5 @@
 export { toast } from './toast';
+export { Toaster } from './Toaster';
+export type { ToastPosition, ToasterLabels, ToasterProps } from './Toaster';
 export type { ToastFunction } from './toast';
 export type { ToastAction, ToastOptions, ToastStatus } from './store';
diff --git a/src/index.ts b/src/index.ts
index 0a58f42..fd94780 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -172,5 +172,13 @@ export type {
   DropdownMenuProps,
   DropdownMenuTriggerProps,
 } from './components/dropdown-menu';
-export { toast } from './components/toast';
-export type { ToastAction, ToastFunction, ToastOptions, ToastStatus } from './components/toast';
+export { Toaster, toast } from './components/toast';
+export type {
+  ToastAction,
+  ToastFunction,
+  ToastOptions,
+  ToastPosition,
+  ToastStatus,
+  ToasterLabels,
+  ToasterProps,
+} from './components/toast';
diff --git a/src/styles/index.css b/src/styles/index.css
index 42a40aa..72ec6fc 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -26,5 +26,6 @@
 @import './components/accordion.css';
 @import './components/breadcrumb.css';
 @import './components/pagination.css';
+@import './components/toast.css';
 @import './components/floating.css';
 @import './preferences.css';
```

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index e9db55f..2164fe3 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -380,6 +380,7 @@ Số liệu lấy từ mockup đã duyệt. Mọi giá trị đều dùng token
 - **Nút đóng:** icon 14px, màu `--flg-text-muted`.
 - **Kích thước:** rộng 360px, tối đa `calc(100vw - 32px)`. Cách mép màn hình 16px; các toast cách nhau 8px.
 - **Thứ tự:** toast mới nhất nằm gần mép nhất.
+- **Vùng toast không có `transform`.** Vị trí giữa dùng `left: 0; right: 0; margin-inline: auto`. Một `transform` sẽ biến vùng thành backdrop root: kính của toast khi đó chỉ làm mờ vùng trong suốt, không thấy trang (như khung của Dialog, §3.4; Plan E1).
 
 ### 4.4 Tương phản (bổ sung cho §4.9 của spec 0+1)
 
@@ -925,7 +926,7 @@ toast.dismiss(id?: string): void;                    // không có id thì đón
   | `hotkey` | `"F8"` |
   | `labels` | `{ region: "Notifications", dismiss: "Dismiss notification", success: "Success", error: "Error", warning: "Warning", info: "Info" }`, ghi đè được từng khoá |
 
-  `Toaster` cũng nhận `className`.
+  `Toaster` cũng nhận `className`. Đổi `max` hoặc `duration` trong lúc toast đang hiện không xoá danh sách rồi hiện lại (screen reader sẽ đọc lại cả danh sách): store nhận cấu hình mới tại chỗ (Plan E1).
 
 - **Cấu trúc:**
 
@@ -942,10 +943,13 @@ toast.dismiss(id?: string): void;                    // không có id thì đón
 
   - `aria-label` của `<section>` là `labels.region` kèm `hotkey` trong ngoặc.
   - Cả hai vùng live có mặt ngay từ lúc mount, trước khi có toast đầu tiên.
+    - `Toaster` không render gì trên server và trước lần commit đầu ở client, nên không lệch khi hydrate.
+    - Vùng toast trống vào trang trước. Toast xếp hàng từ trước khi `Toaster` mount chỉ vào sau đó một task: screen reader chỉ đọc thay đổi trong một vùng live mà nó đã biết (Plan E1).
   - Icon trạng thái mang tên theo `labels`, để trạng thái không chỉ được truyền bằng màu.
 - **Thông báo cho screen reader:**
   - Toast thường được đọc qua vùng polite.
   - Toast `error` có `aria-live="off"` trên `<li>` của nó. Bản sao tiêu đề và mô tả của toast đó được đưa vào vùng assertive.
+  - Bản sao bắt đầu bằng tên trạng thái, như icon của toast: `Error: <tiêu đề>` (`labels.error`).
   - Bản sao bị xoá khi toast đóng.
 - **Thời gian tự đóng:**
   - Mọi bộ đếm giờ tạm dừng khi chuột nằm trên vùng toast, khi focus nằm trong vùng, và khi trang bị ẩn (`visibilitychange`).
```

- [ ] **Step 7: Story**

Story `Default` là story duy nhất của Toast có ảnh chuẩn: bốn toast như mockup S2, cộng một toast `warning`, đều không tự đóng. Hai story còn lại kiểm tra nút hành động, nút đóng, và việc giờ đứng yên dưới con trỏ thật.

`src/components/toast/Toast.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { realUserEvent } from '../../../.storybook/real-input';
import { Button } from '../button/Button';
import { toast } from './toast';
import { Toaster } from './Toaster';

const meta = {
  title: 'Components/Toast',
  component: Toaster,
  parameters: { stage: 'viewport' },
  // One store holds the page's toasts: every story starts and ends without any.
  beforeEach: () => {
    toast.dismiss();
    return () => toast.dismiss();
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const onRetry = fn();

/** The toasts of the approved mockup (toast P3 + S2), with a warning added. Ids keep it to one each. */
function MockupToasts() {
  useEffect(() => {
    toast.success({ id: 'saved', title: 'Changes saved', duration: Infinity });
    toast.error({
      id: 'invoice',
      title: 'Could not send the invoice',
      description: 'Check the connection, then try again.',
      action: { label: 'Retry', onClick: onRetry },
    });
    toast.warning({
      id: 'storage',
      title: 'Storage almost full',
      description: '9.2 GB of 10 GB used.',
      duration: Infinity,
    });
    toast.info({ id: 'sync', title: 'Syncing 14 files…', duration: Infinity });
  }, []);
  return null;
}

export const Default: Story = {
  render: () => (
    <>
      <Toaster max={4} />
      <MockupToasts />
    </>
  ),
};

export const ActionAndClose: Story = {
  tags: ['no-visual'],
  beforeEach: () => {
    onRetry.mockClear();
  },
  render: () => (
    <>
      <Toaster />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={() => toast.success('Changes saved')}>
          Save
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.error({
              title: 'Could not send the invoice',
              action: { label: 'Retry', onClick: onRetry },
            })
          }
        >
          Send invoice
        </Button>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
    // A manual popover, shown at once: the toasts sit in the top layer, above the page.
    await expect(region.matches(':popover-open')).toBe(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const saved = await within(region).findByRole('listitem');
    await expect(within(saved).getByRole('img', { name: 'Success' })).toBeInTheDocument();
    await userEvent.click(within(saved).getByRole('button', { name: 'Dismiss notification' }));
    await waitFor(() => expect(within(region).queryByRole('listitem')).toBeNull());
    // The action runs, then the toast closes.
    await userEvent.click(canvas.getByRole('button', { name: 'Send invoice' }));
    await userEvent.click(await within(region).findByRole('button', { name: 'Retry' }));
    await expect(onRetry).toHaveBeenCalledOnce();
    await waitFor(() => expect(within(region).queryByRole('listitem')).toBeNull());
  },
};

export const PausesUnderThePointer: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <Toaster duration={2000} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={() => toast('Changes saved')}>
          Save
        </Button>
        <Button variant="secondary">Elsewhere</Button>
      </div>
    </>
  ),
  play: async ({ canvas }) => {
    const real = await realUserEvent();
    if (!real) return;
    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
    await real.click(canvas.getByRole('button', { name: 'Save' }));
    const saved = await within(region).findByRole('listitem');
    // Under the pointer the time stands still, past the toast's 2000 ms.
    await real.hover(saved);
    await delay(2500);
    await expect(saved).toBeInTheDocument();
    // Off it, the time runs on.
    await real.hover(canvas.getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(saved).not.toBeInTheDocument(), { timeout: 4000 });
  },
};
```

- [ ] **Step 8: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
pnpm build && pnpm check:package
```

Expected:
- `pnpm test:unit`: 741 test PASS, 3 skip.
- Story: 18 test PASS (3 story × 3 trình duyệt × 2 theme).
- `check:package` PASS, gồm 8 dòng `ok   ships .flg-toast…`.
- So ảnh chụp story `Toast/Default` (light và dark, Chromium) với mockup S2: vạch, icon, tiêu đề, mô tả, nút "Retry" `secondary sm`, nút đóng. Bề rộng là 360px như spec §4.3; mockup vẽ hẹp hơn để vừa ô.

- [ ] **Step 9: Commit**

```bash
git add src/components/toast src/index.ts src/index.test.ts src/styles scripts docs/superpowers/specs
git commit -m "feat(toast): the Toaster, its live regions, and time that waits for the reader" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: F8, Esc và focus

- **F8** (`hotkey`) đưa focus vào vùng toast khi đang có toast hiện. Phím giữ kèm Alt, Ctrl hoặc Meta được để cho trình duyệt.
- **Esc** đóng toast đang có focus. Esc được `preventDefault`, để Dialog chứa vùng toast không đóng theo. Esc đã bị chặn trước đó (phát hiện 7), hay Esc ở chính vùng, thì Toaster bỏ qua.
- **Khi toast đang có focus đóng,** focus đi theo thứ tự sau:
  1. sang toast thế chỗ nó;
  2. nếu không có, sang toast trước nó;
  3. hết toast thì về chỗ cũ, tức phần tử có focus trước khi vào vùng;
  4. không còn chỗ cũ thì về `body`.

  Focus mà người dùng đã đưa ra ngoài vùng thì giữ nguyên chỗ đó. Chỗ cũ được ghi bằng một cờ "focus đang ở trong vùng" (phát hiện 6).

**Files:**
- Modify: `src/components/toast/Toaster.tsx`, `src/styles/components/toast.css`, `src/components/toast/Toast.stories.tsx`, spec giai đoạn 2
- Test: `src/components/toast/Toaster.test.tsx`

**Interfaces:**
- Consumes: `returnFocus(target, container)` (`src/internal/focus.ts`): trả focus chỉ khi focus đang ở `<body>` hoặc trong `container`. `hasModifier(event)` (`src/internal/roving.ts`).
- Produces: mỗi `<li class="flg-toast">` có `tabindex="-1"`; Task 4 giữ nguyên.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/toast/Toaster.test.tsx b/src/components/toast/Toaster.test.tsx
index a3724e1..5426f04 100644
--- a/src/components/toast/Toaster.test.tsx
+++ b/src/components/toast/Toaster.test.tsx
@@ -159,6 +159,99 @@ describe('Toaster', () => {
     expect(items()).toHaveLength(0);
   });
 
+  it('moves focus to the region with its hotkey, only while a toast shows', () => {
+    mount({ hotkey: 'F6' });
+    fireEvent.keyDown(document.body, { key: 'F6' });
+    expect(region()).not.toHaveFocus();
+    show(() => toast('Saved'));
+    fireEvent.keyDown(document.body, { key: 'F6', ctrlKey: true });
+    fireEvent.keyDown(document.body, { key: 'F8' });
+    expect(region()).not.toHaveFocus();
+    expect(fireEvent.keyDown(document.body, { key: 'F6' })).toBe(false);
+    expect(region()).toHaveFocus();
+  });
+
+  it('closes the toast that holds focus on Esc, and hands focus on: next, before, then back', () => {
+    render(<button type="button">Save</button>);
+    mount();
+    show(() => {
+      toast('a');
+      toast('b');
+      toast('c');
+    });
+    const save = screen.getByRole('button', { name: 'Save' });
+    act(() => save.focus());
+    fireEvent.keyDown(save, { key: 'F8' });
+    expect(region()).toHaveFocus();
+    const b = items()[1];
+    if (!b) throw new Error('no toast b');
+    act(() =>
+      within(b).getByRole('button', { hidden: true, name: 'Dismiss notification' }).focus(),
+    );
+    // Prevented, so a Dialog around the region stays open.
+    expect(fireEvent.keyDown(document.activeElement ?? b, { key: 'Escape' })).toBe(false);
+    expect(items().map((item) => item.textContent)).toEqual(['a', 'c']);
+    // The toast that took its place.
+    expect(items()[1]).toHaveFocus();
+    fireEvent.keyDown(items()[1] ?? b, { key: 'Escape' });
+    // None after it: the one before.
+    expect(items()[0]).toHaveFocus();
+    fireEvent.keyDown(items()[0] ?? b, { key: 'Escape' });
+    // None left: back to where focus was before it came into the region.
+    expect(items()).toHaveLength(0);
+    expect(save).toHaveFocus();
+  });
+
+  it('leaves focus where the user moved it, and on the body when its old place is gone', () => {
+    const { rerender } = render(<button type="button">Save</button>);
+    mount();
+    show(() => toast('a'));
+    const save = screen.getByRole('button', { name: 'Save' });
+    act(() => save.focus());
+    fireEvent.keyDown(save, { key: 'F8' });
+    act(() => items()[0]?.focus());
+    rerender(<span />);
+    fireEvent.keyDown(items()[0] ?? region(), { key: 'Escape' });
+    expect(document.body).toHaveFocus();
+    // Focus that the user moved out stays there when a toast closes.
+    show(() => toast('b'));
+    act(() => items()[0]?.focus());
+    const other = document.createElement('button');
+    document.body.append(other);
+    act(() => other.focus());
+    show(() => toast.dismiss());
+    expect(other).toHaveFocus();
+    other.remove();
+  });
+
+  it('leaves an Esc outside a toast, or one that something else took', () => {
+    mount();
+    show(() => toast('a'));
+    act(() => region().focus());
+    expect(fireEvent.keyDown(region(), { key: 'Escape' })).toBe(true);
+    expect(items()).toHaveLength(1);
+    // An open Tooltip takes Esc in the capture phase.
+    const take = (event: Event) => event.preventDefault();
+    document.addEventListener('keydown', take, true);
+    act(() => items()[0]?.focus());
+    fireEvent.keyDown(items()[0] ?? region(), { key: 'Escape' });
+    document.removeEventListener('keydown', take, true);
+    expect(items()).toHaveLength(1);
+  });
+
+  it('runs the time again once focus has left with the toast that held it', () => {
+    render(<button type="button">Save</button>);
+    mount({ duration: 1000 });
+    show(() => toast('a'));
+    act(() => items()[0]?.focus());
+    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'Dismiss notification' }));
+    show(() => toast('b'));
+    act(() => {
+      vi.advanceTimersByTime(1000);
+    });
+    expect(items()).toHaveLength(0);
+  });
+
   it('takes its labels, position and class', () => {
     mount({
       position: 'top-right',
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/toast/Toaster.test.tsx`
Expected: 4 test FAIL (2 test × React 19 và 18.3): `moves focus to the region with its hotkey, only while a toast shows` với `AssertionError: expected true to be false` (F8 chưa được chặn), và `closes the toast that holds focus on Esc, and hands focus on: next, before, then back` ở `toHaveFocus()`; 24 test PASS. Ba test mới còn lại PASS ngay: chúng giữ những gì Task 3 không được làm hỏng (focus mà người dùng đã đưa ra ngoài, Esc ngoài toast hoặc đã bị chặn, giờ chạy lại khi focus rời đi cùng toast).

- [ ] **Step 3: Thêm F8, Esc và việc chuyển focus**

```diff
diff --git a/src/components/toast/Toaster.tsx b/src/components/toast/Toaster.tsx
index da58ef8..810ac2d 100644
--- a/src/components/toast/Toaster.tsx
+++ b/src/components/toast/Toaster.tsx
@@ -10,9 +10,11 @@ import {
   useState,
   useSyncExternalStore,
 } from 'react';
-import type { ReactNode } from 'react';
+import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
+import { returnFocus } from '../../internal/focus';
 import { strokeIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
+import { hasModifier } from '../../internal/roving';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { devWarn } from '../../internal/warn';
 import { Button } from '../button/Button';
@@ -86,10 +88,20 @@ const ICONS: Record<ToastStatus, ReactNode> = {
   ),
 };
 
-function ToastItem({ entry, labels }: { entry: ToastEntry; labels: ToasterLabels }) {
+interface ToastItemProps {
+  entry: ToastEntry;
+  labels: ToasterLabels;
+  /** Keeps the toast's element, by id, for moving focus to it. */
+  register: (id: string, el: HTMLLIElement | null) => void;
+}
+
+function ToastItem({ entry, labels, register }: ToastItemProps) {
   const { id, status, action } = entry;
   return (
     <li
+      ref={(el) => register(id, el)}
+      // Focus goes to the toast itself when the one that held it closes.
+      tabIndex={-1}
       className="flg-surface flg-toast"
       data-status={status}
       // An error is read at once from the assertive region instead (spec §6.3).
@@ -218,15 +230,98 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     };
   }, [active]);
 
-  // Focus that left with a closed toast (to <body>) no longer holds the time.
+  const items = useRef(new Map<string, HTMLLIElement>());
+  const register = useMemo(
+    () => (id: string, el: HTMLLIElement | null) => {
+      if (el) items.current.set(id, el);
+      else items.current.delete(id);
+    },
+    [],
+  );
+  /** The toast that holds focus, and where focus was before it came into the region. */
+  const focused = useRef<string | null>(null);
+  const previous = useRef<HTMLElement | null>(null);
+  // Focus that moves on from a removed toast comes from nowhere (no `relatedTarget`), yet it never
+  // left the region: whether focus is in the region is kept here, not read off the event.
+  const inside = useRef(false);
+  const toastAround = (target: EventTarget | null) => {
+    for (const [id, el] of items.current) if (el.contains(target as Node | null)) return id;
+    return null;
+  };
+
+  // A closed toast that held focus hands it to the toast that takes its place, else the one before
+  // it; with none left, focus goes back to where it was before it came into the region (spec §6.3).
+  const shownBefore = useRef(state.shown);
   useIsoLayoutEffect(() => {
+    const before = shownBefore.current;
+    shownBefore.current = state.shown;
     const region = regionRef.current;
-    if (region && !region.contains(document.activeElement)) toastStore.resume('focus');
+    const gone = focused.current;
+    if (region && gone !== null && !state.shown.some((entry) => entry.id === gone)) {
+      focused.current = null;
+      const index = before.findIndex((entry) => entry.id === gone);
+      const next = state.shown[Math.min(index, state.shown.length - 1)];
+      const el = next ? items.current.get(next.id) : undefined;
+      const active = document.activeElement;
+      // Unless the user had already moved focus somewhere else.
+      if (active === null || active === document.body || region.contains(active)) {
+        if (el) el.focus();
+        else returnFocus(previous.current, region);
+      }
+    }
+    // Focus that left with a closed toast no longer holds the time.
+    if (region && !region.contains(document.activeElement)) {
+      inside.current = false;
+      toastStore.resume('focus');
+    }
   }, [state.shown]);
 
+  // The hotkey moves focus to the region, when there is a toast to go to.
+  useEffect(() => {
+    if (!active) return;
+    const onKeyDown = (event: globalThis.KeyboardEvent) => {
+      const region = regionRef.current;
+      if (event.key !== hotkey || hasModifier(event) || event.defaultPrevented || !region) return;
+      if (toastStore.getState().shown.length === 0 || region.contains(document.activeElement)) {
+        return;
+      }
+      event.preventDefault();
+      region.focus();
+    };
+    document.addEventListener('keydown', onKeyDown);
+    return () => document.removeEventListener('keydown', onKeyDown);
+  }, [active, hotkey]);
+
+  const handleFocus = (event: FocusEvent<HTMLElement>) => {
+    toastStore.pause('focus');
+    if (!inside.current) {
+      inside.current = true;
+      previous.current = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
+    }
+    focused.current = toastAround(event.target);
+  };
+  const handleBlur = (event: FocusEvent<HTMLElement>) => {
+    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
+    inside.current = false;
+    focused.current = null;
+    toastStore.resume('focus');
+  };
+  // Esc closes the toast that holds focus. Prevented, so a Dialog around the region stays open. An
+  // Esc that something else already took, such as an open Tooltip, is left alone.
+  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
+    if (event.key !== 'Escape' || event.defaultPrevented) return;
+    const id = toastAround(event.target);
+    if (id === null) return;
+    event.preventDefault();
+    toastStore.dismiss(id);
+  };
+
   if (!active) return null;
   const errors = state.shown.filter((entry) => entry.status === 'error');
   return (
+    // The region acts on what bubbles up from its toasts: Esc, and the pointer or focus that holds
+    // the time. Its controls are the toasts' buttons.
+    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
     <section
       ref={mergedRef}
       popover="manual"
@@ -236,16 +331,13 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
       tabIndex={-1}
       onPointerEnter={() => toastStore.pause('hover')}
       onPointerLeave={() => toastStore.resume('hover')}
-      onFocus={() => toastStore.pause('focus')}
-      onBlur={(event) => {
-        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
-          toastStore.resume('focus');
-        }
-      }}
+      onFocus={handleFocus}
+      onBlur={handleBlur}
+      onKeyDown={handleKeyDown}
     >
       <ol className="flg-toaster-list" aria-live="polite">
         {state.shown.map((entry) => (
-          <ToastItem key={entry.id} entry={entry} labels={labels} />
+          <ToastItem key={entry.id} entry={entry} labels={labels} register={register} />
         ))}
       </ol>
       <div className="flg-visually-hidden" aria-live="assertive" aria-atomic="true">
diff --git a/src/styles/components/toast.css b/src/styles/components/toast.css
index 0acf7d4..fe2b42d 100644
--- a/src/styles/components/toast.css
+++ b/src/styles/components/toast.css
@@ -64,6 +64,12 @@
       opacity var(--flg-duration-normal) var(--flg-ease),
       translate var(--flg-duration-normal) var(--flg-ease);
   }
+  /* Focus lands on a toast when the one that held it closes. */
+  .flg-toast:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
   .flg-toast[data-status='success'] {
     --flg-toast-color: var(--flg-success);
   }
```

- [ ] **Step 4: Story với bàn phím thật, và spec**

```diff
diff --git a/src/components/toast/Toast.stories.tsx b/src/components/toast/Toast.stories.tsx
index c8f2cb2..b312f39 100644
--- a/src/components/toast/Toast.stories.tsx
+++ b/src/components/toast/Toast.stories.tsx
@@ -124,3 +124,46 @@ export const PausesUnderThePointer: Story = {
     await waitFor(() => expect(saved).not.toBeInTheDocument(), { timeout: 4000 });
   },
 };
+
+export const Keyboard: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <>
+      <Toaster />
+      <Button
+        variant="secondary"
+        onClick={() => {
+          toast({ title: 'Upload finished', duration: Infinity });
+          toast({ title: 'Changes saved', duration: Infinity });
+        }}
+      >
+        Show two
+      </Button>
+    </>
+  ),
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const region = canvas.getByRole('region', { name: 'Notifications (F8)' });
+    const showTwo = canvas.getByRole('button', { name: 'Show two' });
+    showTwo.focus();
+    await real.keyboard('{Enter}');
+    const [upload, saved] = await within(region).findAllByRole('listitem');
+    if (!upload || !saved) throw new Error('two toasts');
+    // F8 moves focus to the region; Tab goes on to the first toast's buttons.
+    await real.keyboard('{F8}');
+    await expect(region).toHaveFocus();
+    await real.keyboard('{Tab}');
+    await expect(
+      within(upload).getByRole('button', { name: 'Dismiss notification' }),
+    ).toHaveFocus();
+    // Esc closes the toast that holds focus; focus goes to the toast that takes its place.
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(upload).not.toBeInTheDocument());
+    await expect(saved).toHaveFocus();
+    // With none left, focus goes back to where it was before F8.
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(saved).not.toBeInTheDocument());
+    await expect(showTwo).toHaveFocus();
+  },
+};
```

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 2164fe3..a5cce99 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -955,12 +955,14 @@ toast.dismiss(id?: string): void;                    // không có id thì đón
   - Mọi bộ đếm giờ tạm dừng khi chuột nằm trên vùng toast, khi focus nằm trong vùng, và khi trang bị ẩn (`visibilitychange`).
   - Khi tiếp tục, mỗi toast chạy nốt thời gian còn lại.
 - **Bàn phím:**
-  - `hotkey` chuyển focus vào vùng toast.
-  - Esc đóng toast đang chứa focus.
+  - `hotkey` chuyển focus vào vùng toast, khi đang có toast hiện. Phím giữ kèm Alt, Ctrl hoặc Meta được để cho trình duyệt (`hasModifier`, §5).
+  - Esc đóng toast đang chứa focus, và được `preventDefault`, để một Dialog chứa vùng toast không đóng theo.
+  - Esc ở chính vùng toast, ngoài mọi toast, không làm gì. Esc đã bị chặn trước đó thì `Toaster` bỏ qua: một Tooltip đang mở nhận Esc trước, ở pha capture (focus trong một `popover="manual"` không lấy Esc của Tooltip), nên mỗi lần Esc chỉ đóng một thứ (Plan E1).
 - **Focus khi một toast đang chứa focus bị đóng:**
-  - Focus sang toast kế tiếp.
+  - Focus sang toast thế chỗ toast vừa đóng; nếu đó là toast cuối thì sang toast trước nó. Focus nằm trên chính `<li>` của toast (`tabindex="-1"`), để screen reader đọc lại cả toast (Plan E1).
   - Hết toast thì về phần tử có focus trước khi vào vùng toast.
   - Không còn phần tử đó thì về `body`.
+  - Focus mà người dùng đã đưa ra ngoài vùng trước khi toast đóng thì giữ nguyên chỗ đó.
 - **Vị trí:**
   - Ở trang, vùng toast là một `popover="manual"`, hiện ngay khi mount.
   - Nếu modal của lib mở sau đó, vùng toast nằm dưới modal đó trong top layer.
```

- [ ] **Step 5: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
pnpm build && pnpm check:package
```

Expected:
- `pnpm test:unit`: 751 test PASS, 3 skip.
- Story: 24 test PASS (4 story × 3 trình duyệt × 2 theme).
- `check:package` PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/toast src/styles/components/toast.css docs/superpowers/specs
git commit -m "feat(toast): F8 to the toasts, Esc to close one, and focus that moves on" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: Toast trong Dialog và Drawer

Một `<dialog>` modal làm phần còn lại của trang thành inert, kể cả popover của vùng toast.
- **Khi modal mở:** Toaster theo dõi modal stack. Khi có modal của lib đang mở, nó render vùng toast vào `.flg-toast-host` của modal trên cùng bằng `createPortal`. Ở đó, vùng là một phần tử `position: fixed` bình thường, không có `popover`.
- **Khi modal đóng:** vùng về lại trang và được `showPopover()` lại.
- **Toast đang hiện đi cùng vùng:** chúng được render ngay trong vùng mới, nên không bị đọc lại.
- **Con trỏ và focus:** trên vùng cũ thì không còn giữ giờ sau khi vùng chuyển chỗ.

**Files:**
- Modify: `src/components/toast/Toaster.tsx`, `src/components/toast/Toast.stories.tsx`, spec giai đoạn 2
- Test: `src/components/toast/Toaster.test.tsx`

**Interfaces:**
- Consumes: `getTopModal()` và `subscribeModals(fn)` (`src/internal/modal-stack.ts`), mỗi mục có `dialog` và `host`. Dialog và Drawer đã đăng ký vào stack từ Plan A (`src/components/dialog/modal.tsx`).
- Produces: không có API mới.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/toast/Toaster.test.tsx b/src/components/toast/Toaster.test.tsx
index 5426f04..16c6002 100644
--- a/src/components/toast/Toaster.test.tsx
+++ b/src/components/toast/Toaster.test.tsx
@@ -1,6 +1,7 @@
 import { act, fireEvent, render, screen, within } from '@testing-library/react';
 import { renderToString } from 'react-dom/server';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { registerModal } from '../../internal/modal-stack';
 import { resetDevWarnings } from '../../internal/warn';
 import { toast } from './toast';
 import { Toaster } from './Toaster';
@@ -252,6 +253,28 @@ describe('Toaster', () => {
     expect(items()).toHaveLength(0);
   });
 
+  it('moves the region into the host of the modal on top, and back to the page', () => {
+    mount();
+    show(() => toast({ title: 'Saved', duration: Infinity }));
+    const dialog = document.createElement('dialog');
+    const host = document.createElement('div');
+    dialog.append(host);
+    document.body.append(dialog);
+    let unregister = () => {};
+    act(() => {
+      unregister = registerModal({ dialog, host });
+    });
+    // Inside the modal's top layer, a plain element; the toast that shows comes with it.
+    expect(host).toContainElement(region());
+    expect(region()).not.toHaveAttribute('popover');
+    expect(items()[0]).toHaveTextContent('Saved');
+    act(() => unregister());
+    expect(host).toBeEmptyDOMElement();
+    expect(region()).toHaveAttribute('popover', 'manual');
+    expect(items()[0]).toHaveTextContent('Saved');
+    dialog.remove();
+  });
+
   it('takes its labels, position and class', () => {
     mount({
       position: 'top-right',
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/toast/Toaster.test.tsx`
Expected: 2 test FAIL (React 19 và 18.3): `moves the region into the host of the modal on top, and back to the page` ở `toContainElement`; 28 test PASS.

- [ ] **Step 3: Đưa vùng toast vào modal trên cùng**

```diff
diff --git a/src/components/toast/Toaster.tsx b/src/components/toast/Toaster.tsx
index 810ac2d..b86cdb8 100644
--- a/src/components/toast/Toaster.tsx
+++ b/src/components/toast/Toaster.tsx
@@ -11,9 +11,11 @@ import {
   useSyncExternalStore,
 } from 'react';
 import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
+import { createPortal } from 'react-dom';
 import { returnFocus } from '../../internal/focus';
 import { strokeIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
+import { getTopModal, subscribeModals } from '../../internal/modal-stack';
 import { hasModifier } from '../../internal/roving';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { devWarn } from '../../internal/warn';
@@ -60,6 +62,7 @@ const DEFAULT_LABELS: ToasterLabels = {
 };
 
 const EMPTY: ToastState = { toasts: [], shown: [] };
+const noModal = () => undefined;
 
 const ICONS: Record<ToastStatus, ReactNode> = {
   success: (
@@ -147,7 +150,8 @@ function ToastItem({ entry, labels, register }: ToastItemProps) {
 
 /**
  * Shows the toasts of `toast()`. Place one in the app; any other Toaster renders nothing. On the
- * page the toasts are a manual popover, in the top layer above the page.
+ * page the toasts are a manual popover, in the top layer above the page. While a Dialog or Drawer of
+ * the library is open, they move into it, so they can still be seen, clicked and read.
  */
 export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
   {
@@ -164,6 +168,9 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
   const [token] = useState<object>(() => ({}));
   const [active, setActive] = useState(false);
   const state = useSyncExternalStore(toastStore.subscribe, toastStore.getState, () => EMPTY);
+  // A modal dialog makes the rest of the page inert, a popover of the page among it: the region
+  // goes into the host of the modal on top, as a plain fixed element in the dialog's top layer.
+  const modal = useSyncExternalStore(subscribeModals, getTopModal, noModal);
   const regionRef = useRef<HTMLElement | null>(null);
   const mergedRef = useMemo(() => mergeRefs(ref, regionRef), [ref]);
 
@@ -216,20 +223,6 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     };
   }, [active]);
 
-  // On the page the region is a manual popover, shown as soon as it mounts. A region that goes away
-  // takes the pointer and focus with it.
-  useIsoLayoutEffect(() => {
-    const region = regionRef.current;
-    if (!active || !region) return;
-    if (typeof region.showPopover === 'function' && !region.matches(':popover-open')) {
-      region.showPopover();
-    }
-    return () => {
-      toastStore.resume('hover');
-      toastStore.resume('focus');
-    };
-  }, [active]);
-
   const items = useRef(new Map<string, HTMLLIElement>());
   const register = useMemo(
     () => (id: string, el: HTMLLIElement | null) => {
@@ -249,6 +242,25 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
     return null;
   };
 
+  // On the page the region is a manual popover, shown as soon as it mounts, again each time it comes
+  // back from a modal. A region that goes away takes the pointer and focus with it.
+  useIsoLayoutEffect(() => {
+    const region = regionRef.current;
+    if (!active || !region) return;
+    if (
+      region.hasAttribute('popover') &&
+      typeof region.showPopover === 'function' &&
+      !region.matches(':popover-open')
+    ) {
+      region.showPopover();
+    }
+    return () => {
+      inside.current = false;
+      toastStore.resume('hover');
+      toastStore.resume('focus');
+    };
+  }, [active, modal]);
+
   // A closed toast that held focus hands it to the toast that takes its place, else the one before
   // it; with none left, focus goes back to where it was before it came into the region (spec §6.3).
   const shownBefore = useRef(state.shown);
@@ -262,9 +274,9 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
       const index = before.findIndex((entry) => entry.id === gone);
       const next = state.shown[Math.min(index, state.shown.length - 1)];
       const el = next ? items.current.get(next.id) : undefined;
-      const active = document.activeElement;
+      const now = document.activeElement;
       // Unless the user had already moved focus somewhere else.
-      if (active === null || active === document.body || region.contains(active)) {
+      if (now === null || now === document.body || region.contains(now)) {
         if (el) el.focus();
         else returnFocus(previous.current, region);
       }
@@ -318,13 +330,14 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
 
   if (!active) return null;
   const errors = state.shown.filter((entry) => entry.status === 'error');
-  return (
+  // The toasts that show are there as the region comes in, so a moved region does not read them again.
+  const region = (
     // The region acts on what bubbles up from its toasts: Esc, and the pointer or focus that holds
     // the time. Its controls are the toasts' buttons.
     // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
     <section
       ref={mergedRef}
-      popover="manual"
+      popover={modal ? undefined : 'manual'}
       className={clsx('flg-toaster', className)}
       data-position={position}
       aria-label={`${labels.region} (${hotkey})`}
@@ -352,4 +365,5 @@ export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster(
       </div>
     </section>
   );
+  return modal ? createPortal(region, modal.host) : region;
 });
```

- [ ] **Step 4: Story trong Dialog, và spec**

Story `InADialog` dùng input thật: Esc của `<dialog>` chỉ phản ứng với input mà trình duyệt tin cậy.

```diff
diff --git a/src/components/toast/Toast.stories.tsx b/src/components/toast/Toast.stories.tsx
index b312f39..6ad7517 100644
--- a/src/components/toast/Toast.stories.tsx
+++ b/src/components/toast/Toast.stories.tsx
@@ -3,6 +3,16 @@ import { useEffect } from 'react';
 import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
 import { realUserEvent } from '../../../.storybook/real-input';
 import { Button } from '../button/Button';
+import {
+  Dialog,
+  DialogContent,
+  DialogFooter,
+  DialogHeader,
+  DialogTitle,
+  DialogTrigger,
+} from '../dialog/Dialog';
+import { Field } from '../field/Field';
+import { Input } from '../input/Input';
 import { toast } from './toast';
 import { Toaster } from './Toaster';
 
@@ -167,3 +177,80 @@ export const Keyboard: Story = {
     await expect(showTwo).toHaveFocus();
   },
 };
+
+const onUndo = fn();
+
+export const InADialog: Story = {
+  tags: ['no-visual'],
+  beforeEach: () => {
+    onUndo.mockClear();
+  },
+  render: () => (
+    <>
+      <Toaster />
+      <div style={{ display: 'flex', gap: 8 }}>
+        <Button
+          variant="secondary"
+          onClick={() => toast({ id: 'draft', title: 'Draft kept', duration: Infinity })}
+        >
+          Keep draft
+        </Button>
+        <Dialog>
+          <DialogTrigger variant="secondary">Edit profile</DialogTrigger>
+          <DialogContent>
+            <DialogHeader>
+              <DialogTitle>Edit profile</DialogTitle>
+            </DialogHeader>
+            <Field label="Name">
+              <Input />
+            </Field>
+            <DialogFooter>
+              <Button
+                onClick={() =>
+                  toast.success({
+                    title: 'Profile saved',
+                    action: { label: 'Undo', onClick: onUndo },
+                  })
+                }
+              >
+                Save
+              </Button>
+            </DialogFooter>
+          </DialogContent>
+        </Dialog>
+      </div>
+    </>
+  ),
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await real.click(canvas.getByRole('button', { name: 'Keep draft' }));
+    await real.click(canvas.getByRole('button', { name: 'Edit profile' }));
+    const dialog = (await canvas.findByRole('dialog', {
+      name: 'Edit profile',
+    })) as HTMLDialogElement;
+    // The region moved into the dialog, with the toast that shows.
+    const region = within(dialog).getByRole('region', { name: 'Notifications (F8)' });
+    await expect(within(region).getByText('Draft kept')).toBeInTheDocument();
+    const name = within(dialog).getByRole('textbox', { name: 'Name' });
+    await real.type(name, 'Ada');
+    // A toast shown from the dialog can be seen and clicked; what was typed stays.
+    await real.click(within(dialog).getByRole('button', { name: 'Save' }));
+    await real.click(await within(region).findByRole('button', { name: 'Undo' }));
+    await expect(onUndo).toHaveBeenCalledOnce();
+    await waitFor(() => expect(within(region).queryByText('Profile saved')).toBeNull());
+    await expect(dialog.open).toBe(true);
+    await expect(name).toHaveValue('Ada');
+    // Esc on a toast closes the toast, not the dialog.
+    within(region).getByRole('button', { name: 'Dismiss notification' }).focus();
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(within(region).queryByText('Draft kept')).toBeNull());
+    await expect(dialog.open).toBe(true);
+    // Once the dialog closes, the region is back on the page, in the top layer again.
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(dialog.open).toBe(false));
+    const back = canvas.getByRole('region', { name: 'Notifications (F8)' });
+    await expect(dialog.contains(back)).toBe(false);
+    await expect(back.matches(':popover-open')).toBe(true);
+  },
+};
```

```diff
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index a5cce99..8ab60f2 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -970,7 +970,8 @@ toast.dismiss(id?: string): void;                    // không có id thì đón
   - Toaster theo dõi modal stack (§5). Khi có modal của lib đang mở, Toaster render vùng toast vào `.flg-toast-host` của modal trên cùng bằng `createPortal`.
   - Khi đó vùng toast là một phần tử `position: fixed` bình thường, không mang `popover`, vì `<dialog>` đã nằm trong top layer.
   - Toast vì vậy vẫn nhìn thấy, bấm được và được đọc. Những gì người dùng đang nhập trong dialog được giữ nguyên.
-  - Khi modal đóng, vùng toast về lại vị trí trên trang.
+  - Khi modal đóng, vùng toast về lại vị trí trên trang và được `showPopover()` lại.
+  - Con trỏ hay focus nằm trên vùng cũ không còn giữ giờ sau khi vùng chuyển chỗ (Plan E1).
   - Chuyển chỗ không làm mất toast, vì dữ liệu nằm trong store. Các toast đang hiện được render ngay trong vùng mới; chúng có sẵn lúc vùng được chèn nên không bị đọc lại.
 - **Hạn chế, ghi trong docs:** `<dialog>` modal không do lib tạo không có trong modal stack. Toast khi đó nằm dưới dialog đó và không bấm được.
 
```

- [ ] **Step 5: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
pnpm build && pnpm check:package
```

Expected:
- `pnpm test:unit`: 753 test PASS, 3 skip.
- Story: 30 test PASS (5 story × 3 trình duyệt × 2 theme).
- `check:package` PASS.
- Lần đầu story nhập các module mới (Dialog, Field, Input), Vite có thể tối ưu lại dependency và tải lại trang giữa lúc chạy. Khi đó Vitest báo `Failed to import test file …Toast.stories.tsx`. Chạy lại lệnh thì qua.

- [ ] **Step 6: Commit**

```bash
git add src/components/toast docs/superpowers/specs
git commit -m "feat(toast): the toasts move into an open Dialog or Drawer" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Tương phản và forced colors

- **Check mới `toast-info-icon` (3:1)** đo icon và vạch của toast `info` (`--flg-accent-solid`) trên kính.
  - Light đạt 3.04:1; dark chỉ 2.29:1, đúng như mockup S2. Vì vậy dark thành dòng 14 của §4.9 (phát hiện 8).
  - Ở `prefers-contrast: more` cả hai theme đều đạt.
- **Forced colors:** vạch trạng thái dùng `CanvasText` (spec §4.5). Icon tự nhận màu hệ thống, vì màu đặt trên `<span>` bọc ngoài chứ không trên `<svg>`.

**Files:**
- Modify: `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/styles/preferences.css`, hai spec
- Test: `src/docs/ExceptionTable.test.tsx`

**Interfaces:**
- Consumes: không có gì mới.
- Produces: check id `toast-info-icon`; ngoại lệ `{ row: 14, theme: 'dark', check: 'toast-info-icon', recorded: 2.29 }`.

- [ ] **Step 1: Thêm phép đo, rồi chạy `check:contrast` để thấy nó fail**

```diff
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index a7de24b..755204d 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -39,6 +39,7 @@ export const CHECKS = {
   'highlight-icon': 4.5,
   'highlight-indicator': 3,
   'highlight-chosen-box': 3,
+  'toast-info-icon': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -304,6 +305,9 @@ export function measure(
           return boxes.map((box) => contrastRatio(composite(box, row), row));
         }),
       ),
+      // The icon and bar of an info toast (toast.css). The success, warning and error ones are the
+      // status colours, measured as text above, at 4.5:1.
+      'toast-info-icon': onSurface('accent-solid'),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
```

Run: `pnpm check:contrast`
Expected: `check:contrast` FAIL với đúng một dòng: `fail            dark  default       toast-info-icon       2.29 (min 3)`. Light đạt 3.04; ở `prefers-contrast: more` đạt 6.07 (light) và 7.42 (dark).

- [ ] **Step 2: Viết test cho dòng 14 của bảng ngoại lệ**

```diff
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index a2df0d5..2a62f04 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the thirteen rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the fourteen rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(13);
+    expect(rows).toHaveLength(14);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -31,6 +31,7 @@ describe('ExceptionTable', () => {
       '11',
       '12',
       '13',
+      '14',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -42,6 +43,8 @@ describe('ExceptionTable', () => {
     expect(cells(rows[10]!).slice(1, 3)).toEqual(['2.61:1', '1.91:1']);
     expect(cells(rows[11]!).slice(1, 3)).toEqual(['4.10:1', '3.36:1']);
     expect(cells(rows[12]!).slice(1, 3)).toEqual(['1.24:1', '1.12:1']);
+    expect(cells(rows[13]!)[1]).toMatch(/^meets AA \(3\.\d\d:1\)$/);
+    expect(cells(rows[13]!)[2]).toBe('2.29:1');
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -67,6 +70,7 @@ describe('ExceptionTable', () => {
       '1.4.11',
       '1.4.3',
       '1.4.11',
+      '1.4.11',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
```

Run: `pnpm vitest run --project unit src/docs/ExceptionTable.test.tsx`
Expected: 2 test FAIL: `lists the fourteen rows of spec §4.9…` với `expected […] to have a length of 14 but got 13`, và `names the WCAG criterion and minimum of every row`; 2 test PASS.

- [ ] **Step 3: Ghi dòng 14, và quy tắc forced colors**

```diff
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index a25af68..8ce1f2b 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -71,6 +71,10 @@ const D = {
   },
   12: { description: 'Muted text of a segmented tab on its track', criterion: '1.4.3' },
   13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
+  14: {
+    description: 'The icon and bar of an info toast against the surface',
+    criterion: '1.4.11',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -102,4 +106,5 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 12, theme: 'dark', check: 'segmented-text', recorded: 3.36, ...D[12] },
   { row: 13, theme: 'light', check: 'segmented-indicator', recorded: 1.24, ...D[13] },
   { row: 13, theme: 'dark', check: 'segmented-indicator', recorded: 1.12, ...D[13] },
+  { row: 14, theme: 'dark', check: 'toast-info-icon', recorded: 2.29, ...D[14] },
 ];
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index be04fd7..fa2dfbb 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -219,5 +219,9 @@
     .flg-breadcrumb-separator {
       opacity: 1;
     }
+    /* The status bar of a toast (spec §4.5); the named icon still tells the status. */
+    .flg-toast::before {
+      background: CanvasText;
+    }
   }
 }
```

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index f8d367b..6ee183b 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -325,10 +325,11 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
 | 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track` | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
+| 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 
-Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
+Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
-Cả mười ba điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Cả mười bốn điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
index 8ab60f2..e678737 100644
--- a/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
+++ b/docs/superpowers/specs/2026-10-05-fl-glass-ui-phase-2-design.md
@@ -405,7 +405,7 @@ Vì cùng một cặp màu, số đo không đổi so với Badge: 3.40:1 light
   - Vạch của tab `underline` (check `tab-indicator`). Vạch là gradient nhấn trên bề mặt, cùng cặp màu với trạng thái đã chọn của checkbox, nên số đo giống dòng 5 của §4.9: đạt ở light (3.04:1), 2.26:1 ở dark. Dòng 5 được mở rộng cho vạch này (Plan D).
   - Nền tab `segmented` đang chọn so với rãnh (check `segmented-indicator`).
   - Nền tab `pill` và nền trang hiện tại so với bề mặt (check `selected-indicator`, cùng cặp màu với dòng 8).
-  - Icon trạng thái của Toast.
+  - Icon trạng thái của Toast. Icon `success`, `warning` và `error` mang màu trạng thái, đã được đo như chữ ở ngưỡng 4.5:1. Icon và vạch của toast `info` mang `--flg-accent-solid` (mockup S2), được đo riêng (check `toast-info-icon`): đạt ở light (3.04:1), 2.29:1 ở dark, nên thành dòng 14 của §4.9 (Plan E1).
 - **Chữ tab chưa chọn** (`--flg-text-muted`) trên rãnh `segmented` (check `segmented-text`).
 - **Chữ tab `pill` đang chọn và trang hiện tại** (check `selected-text`, cùng cặp màu với dòng 7).
 
```

- [ ] **Step 4: Chạy toàn bộ kiểm tra của task**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
pnpm build && pnpm check:package
```

Expected:
- `check:contrast` PASS, với dòng `known-exception dark  default       toast-info-icon       2.29 (min 3)`.
- `pnpm test:unit`: 753 test PASS, 3 skip.
- Story: 30 test PASS (5 story × 3 trình duyệt × 2 theme).
- `check:package` PASS.
- Chụp story `Toast/Default` ở forced colors (Chromium, `emulateMedia({ forcedColors: 'active' })`): viền và vạch `CanvasText`, icon cùng màu chữ.

- [ ] **Step 5: Commit**

```bash
git add scripts src/docs src/styles/preferences.css docs/superpowers/specs
git commit -m "feat(toast): measure the info icon, and the status bar in forced colours" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: Trang docs, fixture và ngưỡng kích thước

- **Trang docs:** `Toast.mdx` theo khuôn các trang khác: cách dùng, options, props của Toaster, toast trong Dialog, accessibility, "nên / không nên".
- **Fixture:** cả hai app có `<Toaster />`. Dialog "Edit profile" có thêm nút "Notify".
  - Ở fixture Next.js, nút này là một client component của fixture (phát hiện 10).
  - Kịch bản kiểm tra: nhập tên, bấm "Notify", rồi đóng toast trong Dialog. Dialog phải còn mở và chữ đã nhập phải còn nguyên.
  - Fixture Vite chạy React 18.3, nên kịch bản chạy trên cả hai phiên bản React.
- **Ngưỡng `size-limit`:** ghi lại ở task này.

**Files:**
- Create: `src/components/toast/Toast.mdx`, `fixtures/next-app/app/notify.tsx`
- Modify: `fixtures/vite-app/src/App.tsx`, `fixtures/vite-app/src/Overlays.tsx`, `fixtures/next-app/app/layout.tsx`, `fixtures/next-app/app/overlays.tsx`, `scripts/test-fixtures.mjs`, `.size-limit.json`

**Interfaces:**
- Consumes: `Toaster`, `toast` từ `fl-glass-ui` (tarball của gói).
- Produces: không có API mới.

- [ ] **Step 1: Thêm kịch bản vào script fixture**

```diff
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index 9c71e1c..91f01cf 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -78,6 +78,7 @@ const COMPONENTS = [
   '.flg-accordion',
   '.flg-breadcrumb',
   '.flg-pagination',
+  '.flg-toaster',
 ];
 
 function run(command, args, cwd) {
@@ -217,6 +218,17 @@ async function checkOverlays(page, problems) {
   if (!(await hasFocus(page.getByRole('textbox', { name: 'Name' })))) {
     problems.push('focus did not move into the Dialog');
   }
+  // Plan E1: a toast shown while the Dialog is open moves into it, can be clicked, and leaves the
+  // Dialog and what was typed in it as they were.
+  const name = dialog.getByRole('textbox', { name: 'Name' });
+  await name.fill('Minh Anh');
+  await dialog.getByRole('button', { name: 'Notify' }).click();
+  const toasts = dialog.getByRole('region', { name: 'Notifications (F8)' });
+  await toasts.getByText('Profile saved').waitFor();
+  await toasts.getByRole('button', { name: 'Dismiss notification' }).click();
+  await toasts.getByText('Profile saved').waitFor({ state: 'detached' });
+  if (!(await dialog.evaluate((el) => el.open))) problems.push('closing a toast closed the Dialog');
+  if ((await name.inputValue()) !== 'Minh Anh') problems.push('the Dialog lost what was typed');
   await page.keyboard.press('Escape');
   await dialog.waitFor({ state: 'hidden' });
   if (!(await hasFocus(editProfile))) problems.push('focus did not return to the Dialog trigger');
```

- [ ] **Step 2: Thêm Toaster và nút "Notify" vào hai fixture**

`fixtures/next-app/app/notify.tsx`:

```tsx
'use client';

// Plan E1: a toast shown while the Dialog is open. A Server Component cannot pass the click handler,
// so the button is a client component of the fixture's own.
import { Button, toast } from 'fl-glass-ui';

export function NotifyButton() {
  return (
    <Button variant="secondary" onClick={() => toast.success('Profile saved')}>
      Notify
    </Button>
  );
}
```

```diff
diff --git a/fixtures/next-app/app/layout.tsx b/fixtures/next-app/app/layout.tsx
index 4b7ea46..6e68e2e 100644
--- a/fixtures/next-app/app/layout.tsx
+++ b/fixtures/next-app/app/layout.tsx
@@ -1,4 +1,5 @@
 import 'fl-glass-ui/styles.css';
+import { Toaster } from 'fl-glass-ui';
 import type { ReactNode } from 'react';
 
 export const metadata = { title: 'fl-glass-ui Next.js fixture' };
@@ -6,7 +7,10 @@ export const metadata = { title: 'fl-glass-ui Next.js fixture' };
 export default function RootLayout({ children }: { children: ReactNode }) {
   return (
     <html lang="en">
-      <body>{children}</body>
+      <body>
+        {children}
+        <Toaster />
+      </body>
     </html>
   );
 }
diff --git a/fixtures/next-app/app/overlays.tsx b/fixtures/next-app/app/overlays.tsx
index e3a0f0a..0697f4b 100644
--- a/fixtures/next-app/app/overlays.tsx
+++ b/fixtures/next-app/app/overlays.tsx
@@ -26,6 +26,7 @@ import {
   TooltipContent,
   TooltipTrigger,
 } from 'fl-glass-ui';
+import { NotifyButton } from './notify';
 
 export function Overlays() {
   return (
@@ -41,6 +42,7 @@ export function Overlays() {
             <Input name="name" defaultValue="Minh An" />
           </Field>
           <DialogFooter>
+            <NotifyButton />
             <DialogClose>Save</DialogClose>
           </DialogFooter>
         </DialogContent>
diff --git a/fixtures/vite-app/src/App.tsx b/fixtures/vite-app/src/App.tsx
index 103d2e0..a1097a5 100644
--- a/fixtures/vite-app/src/App.tsx
+++ b/fixtures/vite-app/src/App.tsx
@@ -20,6 +20,7 @@ import {
   Surface,
   Switch,
   Textarea,
+  Toaster,
 } from 'fl-glass-ui';
 import { useEffect, useState } from 'react';
 import { Menus } from './Menus';
@@ -94,6 +95,7 @@ export function App() {
         </Field>
       </section>
       <Overlays />
+      <Toaster />
       <Menus />
       <Selects />
       <Navigation />
diff --git a/fixtures/vite-app/src/Overlays.tsx b/fixtures/vite-app/src/Overlays.tsx
index 71bc086..1f9a8f2 100644
--- a/fixtures/vite-app/src/Overlays.tsx
+++ b/fixtures/vite-app/src/Overlays.tsx
@@ -1,5 +1,6 @@
 // The overlays of phase 2, plan A. The Next.js fixture renders the same markup from a Server Component.
 import {
+  Button,
   Dialog,
   DialogClose,
   DialogContent,
@@ -24,6 +25,7 @@ import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
+  toast,
 } from 'fl-glass-ui';
 
 export function Overlays() {
@@ -40,6 +42,10 @@ export function Overlays() {
             <Input name="name" defaultValue="Minh An" />
           </Field>
           <DialogFooter>
+            {/* Plan E1: a toast shown while the Dialog is open. */}
+            <Button variant="secondary" onClick={() => toast.success('Profile saved')}>
+              Notify
+            </Button>
             <DialogClose>Save</DialogClose>
           </DialogFooter>
         </DialogContent>
```

- [ ] **Step 3: Trang docs**

`src/components/toast/Toast.mdx`:

````mdx
import { Canvas, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Toast.stories';

<Meta of={Stories} />

# Toast

```tsx
import { Toaster, toast } from 'fl-glass-ui';

// Once, near the root of the app.
<Toaster />;

// Anywhere in client code, for example in an event handler.
toast.success('Changes saved');
toast.error({
  title: 'Could not send the invoice',
  description: 'Check the connection, then try again.',
  action: { label: 'Retry', onClick: sendInvoice },
});
```

<Canvas of={Stories.Default} />

## Showing a toast

`toast(input)` shows a toast and returns its id. `input` is either the title (any React node) or
an object:

| Option        | Meaning                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| `title`       | What happened.                                                                       |
| `description` | A second, quieter line.                                                              |
| `status`      | `"info"` (default), `"success"`, `"warning"` or `"error"`.                           |
| `action`      | `{ label, onClick }`: a button that runs `onClick`, then closes the toast.           |
| `duration`    | How long it stays, in ms. `Infinity` keeps it until it is closed.                    |
| `id`          | A toast shown again with the same id is updated in place, and its time starts again. |

`toast.success`, `toast.error`, `toast.warning` and `toast.info` set the status for you.
`toast.dismiss(id)` closes one toast, and `toast.dismiss()` closes them all.

A toast stays for the Toaster's `duration` (5000 ms by default). A toast with an `action` stays
until it is closed, so there is time to reach its button.

Call `toast()` only from code that runs in the browser: an event handler, an effect. On the server
it does nothing but print a warning in development, so no toast leaks from one request into the
next. A toast shown before the Toaster mounts waits, and shows once it does.

## The Toaster

| Prop        | Default           | Meaning                                                                              |
| ----------- | ----------------- | ------------------------------------------------------------------------------------ |
| `position`  | `"bottom-center"` | Also `"bottom-right"`, `"bottom-left"`, `"top-center"`, `"top-right"`, `"top-left"`. |
| `max`       | `3`               | How many show at once. The others wait, and show as one closes.                      |
| `duration`  | `5000`            | The time of a toast that sets none, in ms.                                           |
| `hotkey`    | `"F8"`            | The key that moves focus to the toasts.                                              |
| `labels`    | English           | `region`, `dismiss`, and one name per status. Replace any of them.                   |
| `className` |                   | On the region.                                                                       |

Place one Toaster in the app. Another one renders nothing and prints a warning in development.
The newest toast sits nearest the edge of the screen.

The time of every toast stands still while the pointer is over the toasts, while focus is in
them, and while the page is hidden. Then each toast runs for the time it had left.

## In a Dialog or Drawer

There is no portal or z-index to set up. On the page the toasts are a native
`popover="manual"`, above the page. While a Dialog or Drawer of this library is open, the toasts
move into it, so they can still be seen, clicked and read, and nothing typed in the dialog is
lost. When it closes, they come back.

A modal `<dialog>` that this library did not open makes the rest of the page inert, the toasts
among it: they sit under it and cannot be clicked.

## Accessibility

- The region is a landmark named "Notifications (F8)". F8 moves focus to it while a toast shows;
  Tab then goes through the toasts' buttons.
- Esc closes the toast that holds focus. Focus then goes to the toast that takes its place, else
  to the one before it, and with none left, back to where it was before.
- Toasts are read from a polite live region. An `error` toast is read at once, from an assertive
  one.
- The status icon is named ("Success", "Error"…), so the status is not told by its colour alone.
- Both live regions are in the page before the first toast, so the first one is read too.

## Do and don't

- Do keep a toast to a short sentence about something that already happened.
- Do give an error toast an `action` when there is something to do about it.
- Don't put the only way to do something in a toast; it goes away.
- Don't use a toast for something the user must answer. Use a Dialog.
````

- [ ] **Step 4: Ghi lại ngưỡng kích thước, rồi chạy toàn bộ kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm test:stories
pnpm check:contrast
pnpm build && pnpm size:record && pnpm check:package
pnpm test:fixtures
```

Expected: 753 unit test PASS (3 skip); 912 story test PASS; tương phản PASS; gói PASS; hai fixture PASS. `size:record` nâng JS từ 26797 lên 29195 B và CSS từ 6442 lên 6793 B.

- [ ] **Step 5: Commit**

```bash
git add src/components/toast/Toast.mdx fixtures scripts/test-fixtures.mjs .size-limit.json
git commit -m "docs(toast): the Toast page, the fixtures' toast in a Dialog, and the size limits" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines" (8 ảnh của `Toast/Default`). So ảnh với mockup S2 trước khi xin review.
- Mô tả PR nêu dòng 14 mới của §4.9 (spec §4.4: các điểm mới được nêu để chủ dự án biết).
- Bảng kiểm tra screen reader của PR có các dòng: toast `error` được đọc ngay, toast trong Dialog được đọc, F8 và Esc.
