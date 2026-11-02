# fl-glass-ui: Plan A, phần nền và ba điều khiển đầu (giai đoạn 3, phần 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm phần nền và ba điều khiển đầu của giai đoạn 3: icon dùng chung, `useFormReset`, slot `aside` của `Field`, rồi `SegmentedControl`, `NumberInput` và `Slider` (một nút và hai nút), cùng các cặp tương phản mới và ngưỡng kích thước.

**Architecture:**
- **Icon dùng chung** (Task 1): `ChevronIcon` (bốn hướng), `CloseIcon`, `MinusIcon`, `PlusIcon` và ba icon cho các plan sau. Năm component cũ đổi sang dùng chúng mà SVG sinh ra giữ nguyên từng thuộc tính.
- **`useFormReset(elementRef, onReset)`** (Task 2): đưa code reset form của `Select` thành hook; mọi điều khiển form của giai đoạn 3 dùng nó.
- **`Field` có `aside`** (Task 3): một slot bên phải hàng nhãn, nằm ngoài `<label>`. Hàng bọc chỉ có khi `aside` được đưa, nên `Field` không có `aside` sinh DOM và CSS như cũ.
- **`SegmentedControl`** (Task 4): radio native phủ lên label; phím, Tab, `required` và reset do trình duyệt lo. Giao diện G1.
- **`NumberInput`** (Task 5): input text có role `spinbutton`, đọc chữ gõ khi rời ô hoặc nhấn Enter, nút − và + lặp khi giữ, input ẩn mang số thô. `src/internal/number.ts` nằm trong task này vì `NumberInput` là nơi đầu tiên import nó. Giao diện N2.
- **`Slider`** (Task 6, 7): Task 6 làm một nút (giao diện S3: bong bóng, chấm bước); Task 7 thêm chế độ hai nút, không nút nào vượt nút kia.
- **Tương phản, reset không `name`, ngưỡng kích thước** (Task 8).

**Tech Stack:** Như Plan E2: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`. Plan này làm các phần sau:
- §2 dòng A: danh sách thành phần của Plan A. Task 2 sửa §2: `use-announce` và kênh lỗi của `Field` chuyển sang Plan B.
- §3.1: form, `name`, reset (Task 2, 4, 5, 6, 7, 8).
- §3.2: slot `aside` của `Field` (Task 3).
- §3.3: giá trị số, làm tròn theo bước, giá trị controlled ngoài khoảng (Task 5, 6, 7).
- §4.3, §4.4, §4.5, §4.6: giao diện, màu, forced colors và icon của ba component (Task 1, 4, 5, 6, 7, 8).
- §5: `src/internal/number.ts` (Task 5) và `src/internal/use-form-reset.ts` (Task 2); cảnh báo dev của ba component.
- §6.3: API của `Slider`, `NumberInput`, `SegmentedControl`.
- §7: các test mà spec nêu cho phần này.
- §4.9 của spec giai đoạn 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): ba dòng ngoại lệ mới, 15 đến 17 (Task 8).

Chủ dự án đã duyệt spec và chọn các giao diện S3, N2, G1 (và B cho `aside`) ngày 2026-11-02.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-3-plan-a`, mỗi task một commit. Mỗi test viết trước đã được chạy trên commit cha của task, trừ các chỗ ghi rõ ở mục 17 bên dưới.
- Icon dùng chung (Task 1) và `number.ts` (trong Task 5) do model miễn phí `reflection/beam-free` viết qua opencode, Claude kiểm tra và dọn lại. Các phần còn lại do subagent của Claude viết.
- Mọi khối patch trong plan được lấy thẳng từ các commit đó.

Kết quả ở commit cuối (`9f6a665`):

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 1425 test PASS, 3 skip (trước plan, ở main: 981 PASS, 3 skip) |
| Story | Mọi thư mục story đã chạm tới PASS ở Chromium, Firefox và WebKit, theme sáng và tối. Cả bộ story chưa chạy một lượt trên máy này vì thiếu bộ nhớ; CI chạy cả bộ |
| `pnpm check:contrast` | PASS, có ba dòng §4.9 mới |
| `pnpm check:package` | PASS với ngưỡng mới (JS 35860 B, CSS 7929 B; trước: 30784 B, 7126 B) |
| `pnpm test:fixtures` | Cả hai fixture (vite, next) PASS |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | PASS |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **`use-announce` và kênh lỗi của `Field` chuyển sang Plan B.** Không component nào của Plan A dùng chúng (spec §3.2, §3.6), và một module không ai import thì không có build output, nên `check:use-client` từ chối. Task 2 sửa dòng §2 của spec cho khớp.
2. **`number.ts` nằm trong Task 5.** Bản nháp làm nó thành commit riêng, nhưng `check:use-client` fail với "dist/internal/number.js: missing build output" cho tới khi có người import. Không thêm entry build.
3. **Icon dùng chung sinh SVG giống từng thuộc tính** (cùng `strokeIcon`, cùng path, cùng class), nên ảnh chuẩn không đổi. Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
4. **Slider tự theo dõi focus do con trỏ** bằng `data-pointer-focus`, vì Chromium và Firefox coi `:focus-visible` là đúng sau `focus()` gọi từ handler con trỏ (story `Dragging` fail lần đầu với `expected true to be false`). Cờ được đặt **sau** khi focus chuyển, không phải trước: ở chế độ hai nút, blur của nút cũ xoá cờ nếu đặt trước (sửa ở Task 7).
5. **`NumberInput` ghi thẳng vào input ẩn khi nhấn Enter**, để một form gửi ngầm trong cùng task thấy giá trị mới. Chỉ story `Typing` (Enter thật) bao phủ; jsdom flush render trong `act` nên test đơn vị không phân biệt được.
6. **Nút giữ lặp nhanh hơn React render.** Hai bước trong một task đọc cùng giá trị cũ; `NumberInput` đọc và ghi một ref `live` mà mỗi bước cập nhật.
7. **Story giữ-nút và cuộn chuột dùng `PointerEvent` và `WheelEvent` thật** qua `dispatchEvent`, vì `userEvent` của Vitest không có thao tác nhấn giữ. Nhịp lặp là đồng hồ thật của trình duyệt. Story `PressAndHold` từng chập chờn ở Firefox cho tới khi chờ 100ms sau khi nhả.
8. **Hai nút trùng giá trị: lần di chuyển đầu quyết định nút nào.** Nhấn vào một giá trị mà cả hai nút đang giữ thì chờ lần di chuyển rời khỏi giá trị đó; nhấn lên track ở một bên thì quyết định ngay. Khoảng cách hoà thì chọn nút thấp.
9. **`useFormReset` rơi về `closest('form')`** khi phần tử không có `.form` (Task 8). `Slider` không `name` không có input ẩn, nên nó theo dõi chính div điều khiển. Chọn cách này thay vì luôn render input ẩn không tên: gọn hơn, không thêm DOM, không có phần tử form lạc. `NumberInput` đã reset qua input nhìn thấy (nó thuộc form), nên chỉ thêm một test đặc tả.
10. **Giao diện `prefers-contrast: more` của Slider** (ngoài mockup): track có viền trong 1px màu `control-border`, fill dùng màu chữ, nút có mặt kính với viền chữ 2px. Lần thử đầu (chỉ thêm viền) fail 2.45 / 1.91 trên fill màu nhấn, nên fill phải đổi.
11. **Ba dòng §4.9 mới (15 đến 17) và giao diện contrast-more của mục 10 chờ chủ dự án duyệt** (PR hỏi). Mockup S3 vẽ đúng như vậy ở theme mặc định, nên giá trị không đổi (mockup lock).

    | Dòng | Cặp | Sáng | Tối |
    |---|---|---|---|
    | 15 | chấm bước so với surface | 2.88 | 2.82 |
    | 16 | track so với surface | 1.23 | 1.30 |
    | 17 | nút so với track và fill | 1.29 | 2.24 |

12. **`SegmentedControl` không có giao diện invalid**: spec không cho. Nhóm mang `data-invalid` và `aria-invalid`, không có CSS. PR hỏi chủ dự án có muốn viền danger không.
13. **Story của `SegmentedControl` không vẽ được vòng focus phím của mockup G1** (`:focus-visible` không ép được trong story tĩnh); vòng đó chỉ được CSS và assertion `:focus-visible` của story `Keyboard` bao phủ. Story đó đặt segment vô hiệu ở giữa, vì WebKit không quay vòng từ radio cuối qua một radio vô hiệu ở cuối.
14. **Quy tắc forced colors và `-webkit-touch-callout` chưa được máy kiểm** (story không giả lập forced-colors, và callout chỉ có trên iOS). Giao diện của `NumberInput` được kiểm bằng hình học trong story `Look`, không bằng so pixel.
15. **Chỗ spec để ngỏ, đã chọn:**
    - Mặc định của `Slider` khi không có `value` lẫn `defaultValue` là `min`; `min >= max` thì cảnh báo và coi `max` bằng `min`.
    - PageUp/PageDown từ giá trị lệch lưới rơi vào lưới (7, bước 5, `largeStep` 50 cho 55).
    - Input ẩn của `NumberInput` chỉ render khi có `name`.
    - Kiểu `percent` cần `step`, `min`, `max` theo phân số (0.01, 0, 1); `NumberInput.mdx` nói vậy.
    - Nút − và + có `touch-action: manipulation` (không có trong spec) để chạm đúp không phóng to.
16. **Hai cái bẫy khi sửa code:**
    - `commit?.(report(apply(...)))` không chạy `apply` khi `commit` là `undefined`, vì lời gọi tuỳ chọn bỏ qua đối số. Handler phím tính `apply` trước.
    - Callback của `Slider` có kiểu `(value: Reported<V>)`, để `defaultValue={60}` không suy ra `V = 60`.
17. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 5 (`NumberInput`): bản nháp chạy file test với một stub không render gì: 63 trong 64 test (React 19) fail; test kiểu `.test-d.ts` chỉ là test đặc tả.
    - Task 6: bản nháp viết code trước, rồi chạy file test với một stub `Slider` chỉ render `<div ref />`: 48 trong 57 test fail. 9 test còn lại (không có input ẩn khi không có `name`, không có chấm khi 100 bước, không cảnh báo khi có `name`, FormData rỗng, cảnh báo của `Field`) là test phủ định mà div rỗng thoả, không thể fail trước.
    - Task 7: chạy trên code Task 6, 30 trong 38 test mới và test kiểu fail; 8 test phủ định hoặc một nút pass.
    - Story của Task 7 (range) được viết sau code, chỉ chạy với code hoàn chỉnh; chúng bắt được hai lỗi thiết kế test (một lần kéo bắt đầu trên nút bị nút kia che).
    - Task 4 (`SegmentedControl`): không test nào fail vì lý do tinh vi hơn việc module chưa có.
    - Trên cây của plan, test patch của mỗi task fail vì module chưa tồn tại (`Failed to resolve import …`); các dòng "Expected" bên dưới ghi lỗi quan sát được ở bản nháp.

**Phạm vi:**
- **Không làm ở plan này:**
  - Changeset: Plan D tạo `0.3.0`; Plan A không có changeset.
  - `useAnnounce`, kênh lỗi của `Field` (Plan B).
  - Giao diện invalid của `SegmentedControl` (chờ chủ dự án).
  - Kiểm tra Safari/VoiceOver còn nợ.
- **Ảnh chuẩn visual:**
  - Ba component mới có story `Look` có ảnh; story còn lại gắn `no-visual`.
  - Không tạo ảnh trên Windows. Ảnh chuẩn của ba component chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh. Component cũ không đổi, nên ảnh cũ phải giữ nguyên từng byte.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-range`, `data-pointer-focus`, `data-invalid`...).
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` và `prefers-contrast: more` nằm trong `src/styles/preferences.css`.
- **Mockup lock.** Giá trị token có sẵn trong `src/styles/theme/values.ts` không đổi; chỉ thêm token mới `--flg-slider-tick` (spec §4.2). Component cũ (Select, Accordion, Menu, Breadcrumb, Pagination, Toaster, Field không có `aside`) phải giữ ảnh giống từng byte. Giao diện `prefers-contrast: more` của Slider nằm ngoài mockup và chờ chủ dự án duyệt.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Chữ mặc định do lib cung cấp bằng tiếng Anh, ghi đè được qua `labels`. Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`.
- **Không có changeset ở plan này.** Plan D tạo changeset `0.3.0`.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu: JS 30784 B, CSS 7126 B.
  - Task 1 đến 4 chạy `pnpm build && pnpm check:package` và pass hoàn toàn.
  - Từ Task 5, `pnpm check:package` chỉ fail ở `size`; các check còn lại pass. Theo lần chạy nháp: sau Task 5 JS 30.83 kB (vượt 50 B), sau Task 6 JS 31.97 kB và CSS 7.18 kB, sau Task 7 JS 32.6 kB và CSS 7.18 kB.
  - Chỉ Task 8 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở draft: JS 35860 B, CSS 7929 B.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, như các lệnh trong plan. CI chạy cả bộ.
- **Fixture** chạy ở cổng 5173 theo script. Nếu cổng 5173 đang bận, sao script `scripts/test-fixtures.mjs` ra một file tạm, thay `5173` bằng `5174`, chạy file đó bằng `node` sau `pnpm build`, rồi xoá file tạm. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của `SegmentedControl`, `NumberInput` và `Slider` đến từ workflow "Update visual baselines" sau khi đẩy nhánh.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch (test rồi code). Áp theo đúng thứ tự trong plan.
- Task 7 và Task 8 sửa file mà task trước đã tạo (`Slider.tsx`, các file test, `use-form-reset.ts`); patch đã tính sẵn điều đó nếu áp đúng thứ tự.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Slider trong form, không có `name`, bị form reset.** Giá trị không vào form, nhưng form reset vẫn phải đưa nó về mặc định. Test ở Task 8: `Slider.test.tsx`, `puts a slider with no name back to its default when the form is reset`, và `use-form-reset.test.tsx`, `finds the form of an element that is not a form control, through closest`.
2. **Range có hai nút gặp nhau.** Nút không vượt nút kia (bằng nhau thì được), và khi cả hai trùng giá trị thì lần di chuyển đầu chọn nút. Test ở Task 7: `Slider.test.tsx`, nhóm `range`, các test `stops a thumb at the value of the other with the keys, and lets them be equal`, `lets the thumbs be equal, and picks the thumb to drag by the first move` và `waits for a move that leaves the shared value before it picks a thumb`; story `RangeDragging`.
3. **NumberInput nhận chữ "1,5" ở locale `de-DE`, hoặc chữ rác.** Chữ đọc được thì thành số theo locale; chữ không đọc được thì trả lại chữ cũ và không báo gì. Test ở Task 5: `number.test.ts`, `parses de-DE formatted text with swapped separators` và `returns NaN for embedded letters`; `NumberInput.test.tsx`, `reads the typed text in the locale of the input` (vi-VN) và `puts back the old text, and reports nothing, when the text cannot be read`.
4. **Nhấn phím trong điều khiển nằm trong form.** `NumberInput`: Enter chốt chữ vừa gõ và ghi vào input ẩn trước khi form gửi (Task 5: `commits on Enter and leaves the Enter to the form`, story `Typing` với Enter và submit thật). `SegmentedControl`: mũi tên chọn đoạn, bỏ qua đoạn vô hiệu, form gửi và reset đúng (Task 4: `moves the selection with the arrow keys and skips a disabled item`, `submits the selected value with the form, and the browser resets it with the form`, story `Keyboard`).
5. **Bấm chuột vào nút Slider không hiện vòng focus; phím thì hiện.** Test ở Task 6: `Slider.test.tsx`, `marks the root while the thumb has the focus from a press, until a key or a blur`, và story `Dragging` (ba engine). Ở Task 7: `moves the thumb nearest to a press on the track, and focuses it` (hai nút, lỗi cờ đặt sớm).

Một chỗ **không có test**: `Field` có `aside` trên màn hẹp. CSS chỉ cho hàng `display: flex; gap: 8px` và `margin-left: auto` cho `aside`, không có `flex-wrap`, nên nhãn dài và `aside` chia nhau chỗ. Story `WithAside` chỉ kiểm hai thứ cùng một hàng ở bề rộng mặc định. PR nêu để chủ dự án xem.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/icons.tsx` (và test), `Select.tsx`, `Menu.tsx`, `Accordion.tsx`, `Breadcrumb.tsx`, `Pagination.tsx`, `Toaster.tsx` | Icon dùng chung (Task 1) |
| `src/internal/use-form-reset.ts` (và test), `Select.tsx`, spec giai đoạn 3 §2 | Hook reset form, chỉnh phạm vi Plan A/B (Task 2) |
| `src/components/field/Field.tsx`, `Field.mdx`, `Field.stories.tsx`, `src/styles/components/field.css` | `aside` (Task 3) |
| `src/components/segmented-control/*`, `src/styles/components/segmented-control.css` | `SegmentedControl` (Task 4) |
| `src/internal/number.ts` (và test), `src/components/number-input/*`, `src/styles/components/number-input.css` | `NumberInput` và các hàm số (Task 5) |
| `src/components/slider/*`, `src/styles/components/slider.css`, `src/styles/theme/values.ts` | `Slider` một nút (Task 6), hai nút (Task 7) |
| `src/styles/preferences.css`, `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Đăng ký, export, forced colors, contrast-more (Task 4 đến 8) |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, spec 0+1 §4.9 | Cặp tương phản và dòng 15 đến 17 (Task 8) |
| `.size-limit.json` | Ngưỡng mới (Task 8) |

---

### Task 1: Icon dùng chung

Spec §4.6. Select, Accordion, Menu, Breadcrumb và Pagination tự vẽ chevron, Toaster tự vẽ dấu ×. Task này đưa chúng vào `src/internal/icons.tsx` (`ChevronIcon` bốn hướng, `CloseIcon`) và thêm `MinusIcon`, `PlusIcon` cho `NumberInput` cùng `CalendarIcon`, `UploadIcon`, `FileIcon` cho các plan sau. Mọi icon dựng trên `strokeIcon` (24×24, `aria-hidden`, nét 2), nên SVG của năm component cũ giữ nguyên từng thuộc tính và ảnh chuẩn không đổi.

**Files:**
- Modify: `src/internal/icons.tsx`, `src/components/select/Select.tsx`, `src/components/menu/Menu.tsx`, `src/components/accordion/Accordion.tsx`, `src/components/breadcrumb/Breadcrumb.tsx`, `src/components/pagination/Pagination.tsx`, `src/components/toast/Toaster.tsx`
- Create: `src/internal/icons.test.tsx`

**Interfaces:**
- Produces:
  - `ChevronIcon` (prop `direction`: `'down' | 'up' | 'left' | 'right'`, mặc định `'down'`), `CloseIcon`, `MinusIcon`, `PlusIcon`, `CalendarIcon`, `UploadIcon`, `FileIcon`.
  - Task 5 dùng `MinusIcon` và `PlusIcon`; Plan B đến D dùng ba icon còn lại.
- Giữ nguyên: `BoxCheckIcon` (12×12) và các icon có sẵn.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
new file mode 100644
index 0000000..374f8a8
--- /dev/null
+++ b/src/internal/icons.test.tsx
@@ -0,0 +1,108 @@
+import { render } from '@testing-library/react';
+import { describe, expect, it } from 'vitest';
+
+import {
+  BoxCheckIcon,
+  CalendarIcon,
+  CheckIcon,
+  ChevronIcon,
+  CloseIcon,
+  FileIcon,
+  MinusIcon,
+  PlusIcon,
+  UploadIcon,
+  strokeIcon,
+} from './icons';
+
+describe('shared icons', () => {
+  it('strokeIcon is hidden and stroked at width 2 on a 24x24 viewBox', () => {
+    const { container } = render(<svg {...strokeIcon} />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    expect(svg.getAttribute('stroke-width')).toBe('2');
+  });
+
+  it('CheckIcon pins its path', () => {
+    const { container } = render(<CheckIcon />);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('M20 6 9 17l-5-5');
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+  });
+
+  it('BoxCheckIcon uses a 12x12 viewBox', () => {
+    const { container } = render(<BoxCheckIcon />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 12 12');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('M2.5 6.2 5 8.5l4.5-5');
+  });
+
+  it('ChevronIcon defaults to down', () => {
+    const { container } = render(<ChevronIcon />);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('m6 9 6 6 6-6');
+  });
+
+  it.each([
+    ['down', 'm6 9 6 6 6-6'],
+    ['up', 'm6 15 6-6 6 6'],
+    ['left', 'm15 18-6-6 6-6'],
+    ['right', 'm9 18 6-6-6-6'],
+  ])('ChevronIcon direction %s pins its path', (direction, path) => {
+    const { container } = render(<ChevronIcon direction={direction as 'down'} />);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe(path);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+  });
+
+  it('CloseIcon pins its path', () => {
+    const { container } = render(<CloseIcon />);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('M18 6 6 18M6 6l12 12');
+  });
+
+  it('MinusIcon pins its path', () => {
+    const { container } = render(<MinusIcon />);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('M5 12h14');
+  });
+
+  it('PlusIcon pins its path', () => {
+    const { container } = render(<PlusIcon />);
+    expect(container.querySelector('path')?.getAttribute('d')).toBe('M12 5v14M5 12h14');
+  });
+
+  it('CalendarIcon pins its shapes', () => {
+    const { container } = render(<CalendarIcon />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    expect(container.querySelector('rect')?.getAttribute('x')).toBe('3');
+    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
+    expect(paths).toEqual(['M16 2v4M8 2v4M3 10h18']);
+  });
+
+  it('UploadIcon pins its paths', () => {
+    const { container } = render(<UploadIcon />);
+    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
+    expect(paths).toEqual([
+      'M12 16V4',
+      'm7 9 5-5 5 5',
+      'M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
+    ]);
+  });
+
+  it('FileIcon pins its paths', () => {
+    const { container } = render(<FileIcon />);
+    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
+    expect(paths).toEqual([
+      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
+      'M14 2v6h6',
+    ]);
+  });
+
+  it('forwards extra props such as className', () => {
+    const { container } = render(<ChevronIcon direction="down" className="flg-select-chevron" />);
+    expect(container.querySelector('svg')?.getAttribute('class')).toBe('flg-select-chevron');
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit src/internal/icons.test.tsx
```

Expected: FAIL, 12 test, đều với `Element type is invalid … got: undefined` cho `ChevronIcon`, `CloseIcon`... (các icon chưa có).

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/accordion/Accordion.tsx b/src/components/accordion/Accordion.tsx
index 47f2e12..2966794 100644
--- a/src/components/accordion/Accordion.tsx
+++ b/src/components/accordion/Accordion.tsx
@@ -13,7 +13,7 @@ import {
 } from 'react';
 import type { DetailsHTMLAttributes, HTMLAttributes, MouseEvent } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
-import { strokeIcon } from '../../internal/icons';
+import { ChevronIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { useControllableState } from '../../internal/use-controllable-state';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
@@ -281,9 +281,7 @@ const CONTROL = 'a[href], button, input, select, textarea, label';
 
 const CHEVRON = (
   <span className="flg-accordion-chevron" aria-hidden="true">
-    <svg {...strokeIcon}>
-      <path d="m6 9 6 6 6-6" />
-    </svg>
+    <ChevronIcon direction="down" />
   </span>
 );
 
diff --git a/src/components/breadcrumb/Breadcrumb.tsx b/src/components/breadcrumb/Breadcrumb.tsx
index c73fc66..26a9268 100644
--- a/src/components/breadcrumb/Breadcrumb.tsx
+++ b/src/components/breadcrumb/Breadcrumb.tsx
@@ -2,7 +2,7 @@ import { clsx } from 'clsx';
 import { forwardRef, isValidElement } from 'react';
 import type { AnchorHTMLAttributes, HTMLAttributes, Ref } from 'react';
 import { flattenChildren } from '../../internal/collect-children';
-import { strokeIcon } from '../../internal/icons';
+import { ChevronIcon } from '../../internal/icons';
 import { Slot } from '../../internal/slot';
 
 export type BreadcrumbSeparator = 'chevron' | 'slash';
@@ -17,11 +17,7 @@ export interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElem
 }
 export type BreadcrumbPageProps = HTMLAttributes<HTMLSpanElement>;
 
-const CHEVRON = (
-  <svg {...strokeIcon}>
-    <path d="m9 18 6-6-6-6" />
-  </svg>
-);
+const CHEVRON = <ChevronIcon direction="right" />;
 
 /**
  * The path to the current page: `<nav aria-label="Breadcrumb">` around a list, one item per child,
diff --git a/src/components/menu/Menu.tsx b/src/components/menu/Menu.tsx
index cb14cf2..e11f2af 100644
--- a/src/components/menu/Menu.tsx
+++ b/src/components/menu/Menu.tsx
@@ -26,7 +26,7 @@ import type {
 } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { dataAttr } from '../../internal/data-attr';
-import { CheckIcon, strokeIcon } from '../../internal/icons';
+import { CheckIcon, ChevronIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { resolveLazy } from '../../internal/react-lazy';
 import { Slot } from '../../internal/slot';
@@ -38,11 +38,7 @@ import type { FocusOnOpen, MenuLevelContextValue } from './menu-context';
 import { MenuPanel } from './MenuPanel';
 
 const CHECK = <CheckIcon />;
-const CHEVRON = (
-  <svg {...strokeIcon} className="flg-menu-chevron">
-    <path d="m9 18 6-6-6-6" />
-  </svg>
-);
+const CHEVRON = <ChevronIcon className="flg-menu-chevron" direction="right" />;
 
 /** What happens when an item is chosen: `event.preventDefault()` keeps the menu open. */
 export type MenuSelectEvent = Event;
diff --git a/src/components/pagination/Pagination.tsx b/src/components/pagination/Pagination.tsx
index 4e12f74..53dc005 100644
--- a/src/components/pagination/Pagination.tsx
+++ b/src/components/pagination/Pagination.tsx
@@ -9,7 +9,7 @@ import type {
   ReactElement,
   ReactNode,
 } from 'react';
-import { strokeIcon } from '../../internal/icons';
+import { ChevronIcon } from '../../internal/icons';
 import { hasModifier } from '../../internal/roving';
 import { useControllableState } from '../../internal/use-controllable-state';
 import { devWarn } from '../../internal/warn';
@@ -48,13 +48,8 @@ export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onCh
   getPageLabel?: (page: number) => string;
 }
 
-const icon = (path: string) => (
-  <svg {...strokeIcon}>
-    <path d={path} />
-  </svg>
-);
-const PREVIOUS = icon('m15 18-6-6 6-6');
-const NEXT = icon('m9 18 6-6-6-6');
+const PREVIOUS = <ChevronIcon direction="left" />;
+const NEXT = <ChevronIcon direction="right" />;
 
 const defaultPageLabel = (page: number) => `Page ${page}`;
 
diff --git a/src/components/select/Select.tsx b/src/components/select/Select.tsx
index a52ca72..9163da9 100644
--- a/src/components/select/Select.tsx
+++ b/src/components/select/Select.tsx
@@ -13,7 +13,7 @@ import type {
 import { markPart } from '../../internal/collect-children';
 import { dataAttr } from '../../internal/data-attr';
 import { markAsFieldControl, useFieldContext, useFieldProps } from '../../internal/field-context';
-import { BoxCheckIcon, CheckIcon, strokeIcon } from '../../internal/icons';
+import { BoxCheckIcon, CheckIcon, ChevronIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { getNextIndex } from '../../internal/roving';
 import { useControllableState } from '../../internal/use-controllable-state';
@@ -97,11 +97,7 @@ export type SelectSeparatorProps = Record<string, never>;
 
 const OUTSIDE = (part: string) => `<${part}> must be rendered inside a <Select>.`;
 
-const CHEVRON = (
-  <svg {...strokeIcon} className="flg-select-chevron">
-    <path d="m6 9 6 6 6-6" />
-  </svg>
-);
+const CHEVRON = <ChevronIcon className="flg-select-chevron" direction="down" />;
 const CHECK = <CheckIcon />;
 const BOX_CHECK = <BoxCheckIcon />;
 
diff --git a/src/components/toast/Toaster.tsx b/src/components/toast/Toaster.tsx
index f060203..c8740d0 100644
--- a/src/components/toast/Toaster.tsx
+++ b/src/components/toast/Toaster.tsx
@@ -15,7 +15,7 @@ import type { FocusEvent, HTMLAttributes, KeyboardEvent, ReactNode } from 'react
 import { createPortal } from 'react-dom';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { returnFocus } from '../../internal/focus';
-import { strokeIcon } from '../../internal/icons';
+import { CloseIcon, strokeIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
 import { getTopModal, subscribeModals } from '../../internal/modal-stack';
 import { hasModifier } from '../../internal/roving';
@@ -185,9 +185,7 @@ function ToastItem({ entry, labels, register, moved }: ToastItemProps) {
         aria-label={labels.dismiss}
         onClick={() => toastStore.dismiss(id)}
       >
-        <svg {...strokeIcon}>
-          <path d="M18 6 6 18M6 6l12 12" />
-        </svg>
+        <CloseIcon />
       </button>
     </li>
   );
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index 2970607..aefc475 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -29,3 +29,82 @@ export function BoxCheckIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+export type ChevronDirection = 'down' | 'up' | 'left' | 'right';
+
+const CHEVRON_PATHS: Record<ChevronDirection, string> = {
+  down: 'm6 9 6 6 6-6',
+  up: 'm6 15 6-6 6 6',
+  left: 'm15 18-6-6 6-6',
+  right: 'm9 18 6-6-6-6',
+};
+
+/** A chevron in any of the four directions; Select, Accordion, Menu, Breadcrumb and Pagination use it. */
+export function ChevronIcon({
+  direction = 'down',
+  ...props
+}: { direction?: ChevronDirection } & SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d={CHEVRON_PATHS[direction]} />
+    </svg>
+  );
+}
+
+/** The × that dismisses a toast (and any other close affordance). */
+export function CloseIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M18 6 6 18M6 6l12 12" />
+    </svg>
+  );
+}
+
+/** A minus sign. */
+export function MinusIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M5 12h14" />
+    </svg>
+  );
+}
+
+/** A plus sign. */
+export function PlusIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M12 5v14M5 12h14" />
+    </svg>
+  );
+}
+
+/** A calendar grid, for date pickers. */
+export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <rect x="3" y="4" width="18" height="18" rx="2" />
+      <path d="M16 2v4M8 2v4M3 10h18" />
+    </svg>
+  );
+}
+
+/** An arrow pointing up into a tray, for file uploads. */
+export function UploadIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M12 16V4" />
+      <path d="m7 9 5-5 5 5" />
+      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
+    </svg>
+  );
+}
+
+/** A document with a folded corner. */
+export function FileIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
+      <path d="M14 2v6h6" />
+    </svg>
+  );
+}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal src/components/select src/components/menu src/components/accordion src/components/breadcrumb src/components/pagination src/components/toast
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
pnpm vitest run --project storybook-light --project storybook-dark src/components/accordion
pnpm vitest run --project storybook-light --project storybook-dark src/components/breadcrumb
pnpm vitest run --project storybook-light --project storybook-dark src/components/pagination
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
pnpm vitest run --project storybook-light --project storybook-dark src/components/dropdown-menu
pnpm build && pnpm check:package
```

Expected: mọi test PASS (ở bản nháp: 19 file, 206 test đơn vị ở các thư mục đã chạm; story: select 84, accordion 60, breadcrumb 12, pagination 18, toast 42, dropdown-menu 96); `check:package` PASS gồm `size` (JS 28.49 kB trên 30.78 kB, CSS 6.48 kB trên 7.13 kB). `menu` không có story riêng.

- [ ] **Step 5: Commit**

```bash
git add \
  src/components/accordion/Accordion.tsx \
  src/components/breadcrumb/Breadcrumb.tsx \
  src/components/menu/Menu.tsx \
  src/components/pagination/Pagination.tsx \
  src/components/select/Select.tsx \
  src/components/toast/Toaster.tsx \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx
```
```bash
git commit -m "refactor(internal): shared chevron and close icons, and the icons phase 3 needs" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: `useFormReset`, và chỉnh phạm vi Plan A trong spec

Spec §3.1 và §5. Code reset form nằm riêng trong `Select`; mọi điều khiển form của giai đoạn 3 cần đúng việc đó. Hook tìm form của phần tử, khôi phục mặc định khi reset **không bị huỷ** (một task sau sự kiện `reset`), và không làm gì khi ở ngoài form. Task này cũng sửa dòng §2 của spec: `use-announce` và kênh lỗi của `Field` sang Plan B (phát hiện 1).

Bản nháp ban đầu có cả `useAnnounce`; nó bị bỏ khỏi plan này.

**Files:**
- Create: `src/internal/use-form-reset.ts`, `src/internal/use-form-reset.test.tsx`
- Modify: `src/components/select/Select.tsx`, `docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md`

**Interfaces:**
- Produces: `useFormReset(elementRef, onReset)`.
  - `elementRef`: ref tới một phần tử (điều khiển form, hoặc phần tử bên trong một form).
  - `onReset`: gọi một task sau `reset` nếu sự kiện không bị `preventDefault`. Hook luôn gọi bản `onReset` mới nhất; huỷ timer đang chờ khi unmount.
  - Task 5 (`NumberInput`), Task 6 và 7 (`Slider`) dùng; Task 8 thêm đường `closest('form')`.
- Consumes: `useWriteOnCommit`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/internal/use-form-reset.test.tsx b/src/internal/use-form-reset.test.tsx
new file mode 100644
index 0000000..c757055
--- /dev/null
+++ b/src/internal/use-form-reset.test.tsx
@@ -0,0 +1,80 @@
+import { act, render } from '@testing-library/react';
+import { useRef } from 'react';
+import type { FormEvent } from 'react';
+import { describe, expect, it, vi } from 'vitest';
+import { useFormReset } from './use-form-reset';
+
+function Probe({
+  onReset,
+  onFormReset,
+}: {
+  onReset: () => void;
+  onFormReset?: (event: FormEvent<HTMLFormElement>) => void;
+}) {
+  const ref = useRef<HTMLInputElement>(null);
+  useFormReset(ref, onReset);
+  return (
+    <form data-testid="form" onReset={onFormReset}>
+      <input ref={ref} defaultValue="a" />
+    </form>
+  );
+}
+
+// The listener runs before React's `onReset`, so the hook waits a task before it looks.
+const aTask = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
+
+describe('useFormReset', () => {
+  it('calls onReset a task after the form is reset, not before', async () => {
+    const onReset = vi.fn();
+    const { getByTestId } = render(<Probe onReset={onReset} />);
+    (getByTestId('form') as HTMLFormElement).reset();
+    expect(onReset).not.toHaveBeenCalled();
+    await aTask();
+    expect(onReset).toHaveBeenCalledTimes(1);
+  });
+
+  it('does not call onReset when the reset is cancelled', async () => {
+    const onReset = vi.fn();
+    const { getByTestId } = render(
+      <Probe onReset={onReset} onFormReset={(event) => event.preventDefault()} />,
+    );
+    (getByTestId('form') as HTMLFormElement).reset();
+    await aTask();
+    expect(onReset).not.toHaveBeenCalled();
+  });
+
+  it('calls the latest onReset, not the one from the first render', async () => {
+    const first = vi.fn();
+    const second = vi.fn();
+    const { getByTestId, rerender } = render(<Probe onReset={first} />);
+    rerender(<Probe onReset={second} />);
+    (getByTestId('form') as HTMLFormElement).reset();
+    await aTask();
+    expect(first).not.toHaveBeenCalled();
+    expect(second).toHaveBeenCalledTimes(1);
+  });
+
+  it('stops listening on unmount, and a pending reset does not call onReset', async () => {
+    const onReset = vi.fn();
+    const { getByTestId, unmount } = render(<Probe onReset={onReset} />);
+    const form = getByTestId('form') as HTMLFormElement;
+    form.reset();
+    unmount();
+    await aTask();
+    form.reset();
+    await aTask();
+    expect(onReset).not.toHaveBeenCalled();
+  });
+
+  it('does nothing for an element outside a form', async () => {
+    function Alone({ onReset }: { onReset: () => void }) {
+      const ref = useRef<HTMLInputElement>(null);
+      useFormReset(ref, onReset);
+      return <input ref={ref} />;
+    }
+    const onReset = vi.fn();
+    expect(() => render(<Alone onReset={onReset} />)).not.toThrow();
+    await aTask();
+    expect(onReset).not.toHaveBeenCalled();
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/use-form-reset.test.tsx
```

Expected: FAIL, `Failed to resolve import "./use-form-reset"`, vì module chưa có. Test reset của `Select` (`keeps its value when the form reset is cancelled…`) là test đặc tả: nó pass cả trước lẫn sau khi đưa code ra hook.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
index 828497f..a064f94 100644
--- a/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
+++ b/docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md
@@ -41,16 +41,18 @@ Các ràng buộc của giai đoạn 1 và 2 giữ nguyên, spec này không nh
 
 | Plan | Nội dung | Phụ thuộc |
 |---|---|---|
-| **A** | Primitives: `number.ts`, `use-form-reset.ts` (tách từ Select), `use-announce.ts`, kênh báo lỗi của control lên `Field`, ô `aside` của `Field` (§3.2), icon dùng chung (§5). Component: **Slider** (một núm và khoảng), **NumberInput**, **SegmentedControl** | — |
-| **B** | Primitives: `list-rows.ts` (chuyển từ Select). Component: **Combobox**, **TagInput** | A (Claude chốt) |
-| **C** | Primitive: `date.ts`. Component: **Calendar**, **DatePicker** | A (Claude chốt) |
+| **A** | Primitives: `number.ts`, `use-form-reset.ts` (tách từ Select), ô `aside` của `Field` (§3.2), icon dùng chung (§5). Component: **Slider** (một núm và khoảng), **NumberInput**, **SegmentedControl** | — |
+| **B** | Primitives: `list-rows.ts` (chuyển từ Select), `use-announce.ts`, kênh báo lỗi của control lên `Field` (§3.2). Component: **Combobox**, **TagInput** | A (Claude chốt) |
+| **C** | Primitive: `date.ts`. Component: **Calendar**, **DatePicker** | A, B (phát hiện khi lập Plan A) |
 | **D** | Component: **FileUpload**. Docs chung (mục "Build a form" của Getting started, trang Accessibility), fixtures dùng cả 8 component, changeset `0.3.0` | A–C |
 
-- **Vì sao B và C phụ thuộc A** (Claude chốt). Bản quyết định ban đầu để B và C độc lập với A. Nhưng `use-form-reset`, `use-announce`, kênh báo lỗi lên `Field` và icon dùng chung được cả A, B, C, D dùng. Nếu B và C chạy song song mà mỗi plan tự thêm chúng, hai PR sẽ cùng viết một file. Đặt chúng ở Plan A thì B và C chỉ dùng lại.
+- **Vì sao B và C phụ thuộc A** (Claude chốt). Bản quyết định ban đầu để B và C độc lập với A. Nhưng `use-form-reset` và icon dùng chung được cả A, B, C, D dùng. Nếu B và C chạy song song mà mỗi plan tự thêm chúng, hai PR sẽ cùng viết một file. Đặt chúng ở Plan A thì B và C chỉ dùng lại.
+- **`use-announce` và kênh báo lỗi lên `Field` ở Plan B, và C phụ thuộc B** (phát hiện khi lập Plan A). Không component nào của Plan A dùng chúng (§3.2, §3.6: người dùng đầu tiên là Combobox và TagInput). Một module trong `src/internal/` không ai import thì không có file build, và `check:use-client` báo lỗi; code chưa ai dùng cũng là code chết khi review. Vì vậy chúng đi cùng người dùng đầu tiên, và các plan chạy lần lượt A, B, C, D như giai đoạn 2.
 - **Mỗi plan tự mang đủ phần của mình,** như giai đoạn 2: stories, test các lớp ở §7, ảnh chuẩn visual, trang MDX của component, danh sách `check:use-client` và `check:dist-css`, và ghi lại ngưỡng `size-limit`. Plan D làm thêm docs chung, fixtures và phát hành.
 - **Thay đổi ở code cũ** (không đổi hành vi, ảnh chuẩn visual giữ nguyên):
-  - Plan A: Select dùng `useFormReset` thay cho đoạn tự viết; `Field` có thêm kênh báo lỗi của control (§5); các chevron và dấu × đang vẽ riêng trong Select, Accordion, Menu, Breadcrumb, Pagination và Toaster chuyển sang icon dùng chung (§4.6).
+  - Plan A: Select dùng `useFormReset` thay cho đoạn tự viết; các chevron và dấu × đang vẽ riêng trong Select, Accordion, Menu, Breadcrumb, Pagination và Toaster chuyển sang icon dùng chung (§4.6).
   - Plan B: `select-rows.ts` chuyển thành `src/internal/list-rows.ts`, dùng chung cho Select và Combobox.
+  - Plan B: `Field` có thêm kênh báo lỗi của control (§5).
 
 **Ngoài phạm vi:**
 
diff --git a/src/components/select/Select.tsx b/src/components/select/Select.tsx
index 9163da9..6bd4e92 100644
--- a/src/components/select/Select.tsx
+++ b/src/components/select/Select.tsx
@@ -18,6 +18,7 @@ import { mergeRefs } from '../../internal/merge-refs';
 import { getNextIndex } from '../../internal/roving';
 import { useControllableState } from '../../internal/use-controllable-state';
 import { useFloating } from '../../internal/use-floating';
+import { useFormReset } from '../../internal/use-form-reset';
 import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { useWriteOnCommit } from '../../internal/use-write-on-commit';
 import { usePopover } from '../../internal/use-popover';
@@ -368,23 +369,12 @@ export const Select = markAsFieldControl(
     useWriteOnCommit(() => {
       defaultRef.current = defaultValue;
     });
-    useEffect(() => {
-      const form = nativeRef.current?.form;
-      if (!form) return;
-      // The browser resets the native <select> after this event: put an uncontrolled Select back to
-      // its default, and the native one back in step with a controlled value, a task later. This
-      // listener runs before React's `onReset`, so whether the reset was cancelled is only known
-      // then.
-      const onReset = (event: Event) => {
-        setTimeout(() => {
-          if (event.defaultPrevented) return;
-          resetValue(defaultRef.current);
-          resync((count) => count + 1);
-        }, 0);
-      };
-      form.addEventListener('reset', onReset);
-      return () => form.removeEventListener('reset', onReset);
-    }, [resetValue]);
+    // The browser resets the native <select> after the form's reset event: put an uncontrolled Select
+    // back to its default, and the native one back in step with a controlled value.
+    useFormReset(nativeRef, () => {
+      resetValue(defaultRef.current);
+      resync((count) => count + 1);
+    });
     const handleNativeChange = (event: ChangeEvent<HTMLSelectElement>) => {
       // Autofill, or anything else that changes the native <select> directly.
       if (multiple) {
diff --git a/src/internal/use-form-reset.ts b/src/internal/use-form-reset.ts
new file mode 100644
index 0000000..c4bbdef
--- /dev/null
+++ b/src/internal/use-form-reset.ts
@@ -0,0 +1,38 @@
+import { useEffect, useRef } from 'react';
+import type { RefObject } from 'react';
+import { useWriteOnCommit } from './use-write-on-commit';
+
+/**
+ * Calls `onReset` after the form that holds `elementRef` is reset, unless the reset was cancelled.
+ * A component uses it to put an uncontrolled value back to its default and to bring a native
+ * element, which the browser has just reset behind React's back, in step with its state again.
+ *
+ * The listener of the library runs before React's `onReset`, so whether the reset was cancelled with
+ * `preventDefault()` is only known a task later; the hook waits that task. It reads `onReset` at
+ * that moment, so the caller does not have to keep it stable.
+ */
+export function useFormReset(elementRef: RefObject<HTMLElement | null>, onReset: () => void): void {
+  const latest = useRef(onReset);
+  useWriteOnCommit(() => {
+    latest.current = onReset;
+  });
+  useEffect(() => {
+    const form = (elementRef.current as (HTMLElement & { form?: HTMLFormElement | null }) | null)
+      ?.form;
+    if (!form) return;
+    const pending = new Set<ReturnType<typeof setTimeout>>();
+    const onFormReset = (event: Event) => {
+      const timer = setTimeout(() => {
+        pending.delete(timer);
+        if (!event.defaultPrevented) latest.current();
+      }, 0);
+      pending.add(timer);
+    };
+    form.addEventListener('reset', onFormReset);
+    return () => {
+      form.removeEventListener('reset', onFormReset);
+      // A reset that is still waiting must not reach a component that is gone.
+      pending.forEach(clearTimeout);
+    };
+  }, [elementRef]);
+}
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal src/components/select
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
pnpm build && pnpm check:package
```

Expected: mọi test PASS (test của Select không đổi một dòng); story Select 84 test PASS; `check:package` PASS.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-02-fl-glass-ui-phase-3-design.md \
  src/components/select/Select.tsx \
  src/internal/use-form-reset.test.tsx \
  src/internal/use-form-reset.ts
```
```bash
git commit -m "refactor(internal): useFormReset, taken out of Select" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: `Field` có slot `aside`

Spec §3.2, và quyết định B của chủ dự án. Giá trị của Slider, bộ đếm của Textarea và các số đọc tương tự cần một chỗ cạnh nhãn mà không thuộc tên của điều khiển. Có `aside` thì nhãn và `aside` nằm trong một hàng flex `flg-field-head`; không có thì nhãn render trực tiếp như cũ, không bọc, không CSS mới tác động.

**Files:**
- Modify: `src/components/field/Field.tsx`, `src/components/field/Field.mdx`, `src/components/field/Field.stories.tsx`, `src/components/field/Field.test.tsx`, `src/styles/components/field.css`, `scripts/check-dist-css.ts`

**Interfaces:**
- Produces: prop `aside?: ReactNode` của `Field`.
  - `aside` nằm ngoài `<label>` nên không vào tên của điều khiển; không `aria-hidden`.
  - Class `flg-field-head` (hàng) và `flg-field-aside`. Cả hai nằm trong `check-dist-css`.
  - Task 6 và 7 dùng nó cho giá trị của `Slider`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/field/Field.stories.tsx b/src/components/field/Field.stories.tsx
index 7fe0ce3..cca72d2 100644
--- a/src/components/field/Field.stories.tsx
+++ b/src/components/field/Field.stories.tsx
@@ -2,6 +2,7 @@ import type { Meta, StoryObj } from '@storybook/react-vite';
 import { expect, userEvent } from 'storybook/test';
 import { MailIcon } from '../../../.storybook/icons';
 import { Input } from '../input/Input';
+import { Textarea } from '../textarea/Textarea';
 import { Field } from './Field';
 
 const meta = {
@@ -66,3 +67,24 @@ export const Disabled: Story = {
     await expect(canvas.getByRole('textbox', { name: 'Workspace URL' })).toBeDisabled();
   },
 };
+
+export const WithAside: Story = {
+  args: {
+    label: 'Bio',
+    description: undefined,
+    aside: '12/200',
+    children: <Textarea rows={3} defaultValue="Designer in Hanoi" />,
+  },
+  play: async ({ canvas }) => {
+    const textarea = canvas.getByRole('textbox', { name: 'Bio' });
+    const aside = canvas.getByText('12/200');
+    // The aside sits outside the label, so the name stays "Bio", and it shares the label's row.
+    await expect(textarea).toHaveAccessibleName('Bio');
+    await expect(aside.getBoundingClientRect().right).toBeGreaterThan(
+      canvas.getByText('Bio').getBoundingClientRect().right,
+    );
+    await expect(aside.getBoundingClientRect().top).toBeLessThan(
+      textarea.getBoundingClientRect().top,
+    );
+  },
+};
diff --git a/src/components/field/Field.test.tsx b/src/components/field/Field.test.tsx
index f3f3280..53024d5 100644
--- a/src/components/field/Field.test.tsx
+++ b/src/components/field/Field.test.tsx
@@ -193,4 +193,71 @@ describe('Field', () => {
         'control its own Field.',
     );
   });
+
+  describe('aside', () => {
+    it('renders at the right of the label row, outside the label', () => {
+      const { container } = render(
+        <Field label="Bio" aside="12/200">
+          <TextControl />
+        </Field>,
+      );
+      const aside = screen.getByText('12/200');
+      const label = container.querySelector('label') as HTMLLabelElement;
+      expect(aside).toHaveClass('flg-field-aside');
+      expect(label.contains(aside)).toBe(false);
+      expect(aside.parentElement).toBe(label.parentElement);
+      expect(aside.parentElement).toHaveClass('flg-field-head');
+      expect(label.nextElementSibling).toBe(aside);
+    });
+
+    it('does not name the control and is not hidden from screen readers', () => {
+      render(
+        <Field label="Bio" aside="12/200">
+          <TextControl />
+        </Field>,
+      );
+      expect(screen.getByRole('textbox', { name: 'Bio' })).toBeInTheDocument();
+      expect(screen.getByText('12/200')).not.toHaveAttribute('aria-hidden');
+    });
+
+    it('lets the user hide it themselves', () => {
+      render(
+        <Field label="Bio" aside={<span aria-hidden="true">12/200</span>}>
+          <TextControl />
+        </Field>,
+      );
+      expect(screen.getByText('12/200')).toHaveAttribute('aria-hidden', 'true');
+    });
+
+    it('sits beside the group label too', () => {
+      const { container } = render(
+        <Field label="Volume" aside="60%">
+          <GroupControl />
+        </Field>,
+      );
+      const label = container.querySelector('span.flg-field-label') as HTMLElement;
+      expect(label.nextElementSibling).toHaveTextContent('60%');
+    });
+
+    it('is absent, with no row wrapper, when not given', () => {
+      const { container } = render(
+        <Field label="Bio">
+          <TextControl />
+        </Field>,
+      );
+      expect(container.querySelector('.flg-field-aside')).toBeNull();
+      expect(container.querySelector('.flg-field-head')).toBeNull();
+      expect(container.querySelector('label')?.parentElement).toHaveClass('flg-field');
+    });
+
+    it('shows without a label', () => {
+      const { container } = render(
+        <Field aside="12/200">
+          <TextControl />
+        </Field>,
+      );
+      expect(screen.getByText('12/200')).toBeInTheDocument();
+      expect(container.querySelector('label')).toBeNull();
+    });
+  });
 });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/field
```

Expected: FAIL ở năm test: `renders at the right of the label row, outside the label`, `does not name the control and is not hidden from screen readers`, `lets the user hide it themselves` và `shows without a label` (cùng lỗi `Unable to find an element with the text: 12/200`), `sits beside the group label too` (`toHaveTextContent` fail). Test `is absent, with no row wrapper, when not given` là test đặc tả: pass cả trước lẫn sau. Story `WithAside` chạy ở Step 4.

- [ ] **Step 3: Viết code**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 029a980..7846e84 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -22,6 +22,8 @@ const SHIPPED_CLASSES = [
   'flg-divider',
   'flg-card',
   'flg-field',
+  'flg-field-head',
+  'flg-field-aside',
   'flg-input',
   'flg-textarea',
   'flg-checkbox',
diff --git a/src/components/field/Field.mdx b/src/components/field/Field.mdx
index 3997a49..c197716 100644
--- a/src/components/field/Field.mdx
+++ b/src/components/field/Field.mdx
@@ -34,6 +34,23 @@ after the description.
 
 <Canvas of={Stories.Disabled} />
 
+## Aside
+
+`aside` puts content at the right of the label row, such as a character counter or the value of a
+slider. It sits outside the label, so it does not become part of the control's name. A Field
+without `aside` looks exactly as before.
+
+<Canvas of={Stories.WithAside} />
+
+Field does not hide the aside from screen readers. When they already get the content another way,
+for example a value that the control announces itself, pass it with `aria-hidden="true"`:
+
+```tsx
+<Field label="Volume" aside={<span aria-hidden="true">60%</span>}>
+  …
+</Field>
+```
+
 ## Accessibility
 
 - The label points at the control through `for`, and the description and error are linked with
diff --git a/src/components/field/Field.tsx b/src/components/field/Field.tsx
index 9f4c760..3aa9ce0 100644
--- a/src/components/field/Field.tsx
+++ b/src/components/field/Field.tsx
@@ -22,6 +22,12 @@ export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id' |
   /** Shows an asterisk and makes the control required. */
   required?: boolean;
   disabled?: boolean;
+  /**
+   * Content at the right of the label row, such as a character counter or a slider's value. It sits
+   * outside the label, so it is not part of the control's name, and it is not hidden from screen
+   * readers: add `aria-hidden` yourself when they already get the content another way.
+   */
+  aside?: ReactNode;
   /**
    * The id of the control inside, which the label points at. A control's own `id` takes precedence.
    * Generated when omitted.
@@ -38,6 +44,7 @@ export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
     error,
     required = false,
     disabled = false,
+    aside,
     id,
     className,
     children,
@@ -88,6 +95,15 @@ export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
       ) : null}
     </>
   );
+  const labelElement = !label ? null : context.labelMode === 'group' ? (
+    <span id={context.labelId} className="flg-field-label">
+      {labelContent}
+    </span>
+  ) : (
+    <label id={context.labelId} htmlFor={context.controlId} className="flg-field-label">
+      {labelContent}
+    </label>
+  );
 
   return (
     <div
@@ -97,14 +113,13 @@ export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
       data-disabled={dataAttr(disabled)}
       {...props}
     >
-      {!label ? null : context.labelMode === 'group' ? (
-        <span id={context.labelId} className="flg-field-label">
-          {labelContent}
-        </span>
+      {aside ? (
+        <div className="flg-field-head">
+          {labelElement}
+          <span className="flg-field-aside">{aside}</span>
+        </div>
       ) : (
-        <label id={context.labelId} htmlFor={context.controlId} className="flg-field-label">
-          {labelContent}
-        </label>
+        labelElement
       )}
       <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
       {description ? (
diff --git a/src/styles/components/field.css b/src/styles/components/field.css
index c53e145..fe81c9d 100644
--- a/src/styles/components/field.css
+++ b/src/styles/components/field.css
@@ -11,6 +11,21 @@
     font-weight: var(--flg-weight-medium);
     line-height: 1.3;
   }
+  /* The row exists only when the field has an aside, so a field without one is laid out as before. */
+  .flg-field-head {
+    display: flex;
+    align-items: baseline;
+    justify-content: space-between;
+    gap: 8px;
+  }
+  .flg-field-aside {
+    margin-left: auto;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+    font-weight: var(--flg-weight-regular);
+    line-height: 1.3;
+    font-variant-numeric: tabular-nums;
+  }
   .flg-field-required {
     margin-left: 2px;
     color: var(--flg-danger);
@@ -30,6 +45,7 @@
   }
   /* The control dims itself when disabled; dimming the whole field would dim it twice. */
   .flg-field[data-disabled] > .flg-field-label,
+  .flg-field[data-disabled] > .flg-field-head,
   .flg-field[data-disabled] > .flg-field-description,
   .flg-field[data-disabled] > .flg-field-error {
     opacity: 0.5;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/field src/components/radio-group
pnpm vitest run --project storybook-light --project storybook-dark src/components/field
pnpm build && pnpm check:package
```

Expected: 74 test đơn vị PASS (field và radio-group); story Field 30 test PASS; `check:package` PASS. Field không có `aside` sinh cùng DOM và cùng CSS như trước (test `is absent…`), nên ảnh chuẩn không đổi; bản nháp không chụp so sánh.

- [ ] **Step 5: Commit**

```bash
git add \
  scripts/check-dist-css.ts \
  src/components/field/Field.mdx \
  src/components/field/Field.stories.tsx \
  src/components/field/Field.test.tsx \
  src/components/field/Field.tsx \
  src/styles/components/field.css
```
```bash
git commit -m "feat(field): an aside slot at the right of the label row" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: `SegmentedControl`

Spec §3.1, §4.3 (giao diện G1), §4.5, §6.3. Một lựa chọn đơn trong form cần ngữ nghĩa radio, giá trị gửi đi và reset, mà `segmented` của Tabs không có. Các đoạn là radio native phủ lên label với `opacity: 0` (như `toggle.css`), nên phím, Tab, `required` và reset do trình duyệt lo; CSS đọc lựa chọn qua `:has(> input:checked)`, nên HTML từ server đã đúng. Cảnh báo dev: thiếu `name`, item ngoài điều khiển, hai item cùng `value`. Điều khiển controlled giữ giá trị khi reset, như `RadioGroup`; không dùng `useFormReset`.

**Files:**
- Create: `src/components/segmented-control/SegmentedControl.tsx`, `SegmentedControlItem.tsx`, `SegmentedControlContext.ts`, `index.ts`, `SegmentedControl.test.tsx`, `SegmentedControl.test-d.ts`, `SegmentedControl.stories.tsx`, `SegmentedControl.mdx`, `src/styles/components/segmented-control.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`

**Interfaces:**
- Produces: `SegmentedControl`, `SegmentedControlItem`, `SegmentedControlProps`, `SegmentedControlItemProps` (export phẳng từ `src/index.ts`).
  - `SegmentedControl`: `name`, `value` (`string | null`) / `defaultValue`, `onValueChange`, `size` (`'sm' | 'md'`), `fullWidth`, `required`, `disabled`; `ref` trỏ tới nhóm (`role="radiogroup"`).
  - `SegmentedControlItem`: `value` (bắt buộc), `disabled`, `onChange` (chạy trước `onValueChange`); `ref` trỏ tới radio, `className` và `style` lên label.
  - Class `flg-segmented`, `-item`, `-input`, `-label`.
- Consumes: `useFieldProps`, `markAsFieldGroup`, `useRequireName`, `composeEventHandlers`, `devWarn`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/segmented-control/SegmentedControl.stories.tsx b/src/components/segmented-control/SegmentedControl.stories.tsx
new file mode 100644
index 0000000..bb2f66e
--- /dev/null
+++ b/src/components/segmented-control/SegmentedControl.stories.tsx
@@ -0,0 +1,195 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import type { FormEvent } from 'react';
+import { expect, fn, userEvent, waitFor } from 'storybook/test';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { Card } from '../card/Card';
+import { Field } from '../field/Field';
+import { SegmentedControl } from './SegmentedControl';
+import { SegmentedControlItem } from './SegmentedControlItem';
+
+const meta = {
+  title: 'Components/SegmentedControl',
+  component: SegmentedControl,
+  subcomponents: { SegmentedControlItem },
+  args: {
+    'aria-label': 'View',
+    defaultValue: 'grid',
+    onValueChange: fn(),
+    children: (
+      <>
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        <SegmentedControlItem value="list">List</SegmentedControlItem>
+        <SegmentedControlItem value="table">Table</SegmentedControlItem>
+      </>
+    ),
+  },
+} satisfies Meta<typeof SegmentedControl>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { display: 'grid', gap: 16, width: 420 } as const;
+const caption = {
+  fontSize: 'var(--flg-text-xs)',
+  color: 'var(--flg-text-muted)',
+  marginBottom: 6,
+} as const;
+
+/** The control of the mockup (G1): medium, small, and one with a disabled segment. */
+export const Look: Story = {
+  render: () => (
+    <div style={column}>
+      <Card style={{ gap: 12 }}>
+        <div>
+          <div style={caption}>Medium</div>
+          <SegmentedControl aria-label="View" defaultValue="grid">
+            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+            <SegmentedControlItem value="list">List</SegmentedControlItem>
+            <SegmentedControlItem value="table">Table</SegmentedControlItem>
+          </SegmentedControl>
+        </div>
+        <div>
+          <div style={caption}>Small</div>
+          <SegmentedControl aria-label="View, small" size="sm" defaultValue="grid">
+            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+            <SegmentedControlItem value="list">List</SegmentedControlItem>
+            <SegmentedControlItem value="table">Table</SegmentedControlItem>
+          </SegmentedControl>
+        </div>
+        <div>
+          <div style={caption}>One segment disabled</div>
+          <SegmentedControl aria-label="View, one disabled" defaultValue="grid">
+            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+            <SegmentedControlItem value="list">List</SegmentedControlItem>
+            <SegmentedControlItem value="table" disabled>
+              Table
+            </SegmentedControlItem>
+          </SegmentedControl>
+        </div>
+        <div>
+          <div style={caption}>Full width</div>
+          <SegmentedControl aria-label="View, full width" defaultValue="list" fullWidth>
+            <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+            <SegmentedControlItem value="list">List</SegmentedControlItem>
+            <SegmentedControlItem value="table">Table</SegmentedControlItem>
+          </SegmentedControl>
+        </div>
+      </Card>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const [medium, small] = canvas.getAllByRole('radiogroup');
+    // The track is 34px (`--flg-control-h-md`) and 28px tall, as in the mockup.
+    await expect(medium?.getBoundingClientRect().height).toBe(34);
+    await expect(small?.getBoundingClientRect().height).toBe(28);
+    // The native radio lies over its segment: a click anywhere on it lands on the real input.
+    const list = canvas.getAllByRole('radio', { name: 'List' })[0] as HTMLElement;
+    const box = list.getBoundingClientRect();
+    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
+      list,
+    );
+    // The selected segment is raised: it has the control background and a shadow.
+    const selected = canvas.getAllByRole('radio', { name: 'Grid' })[0]
+      ?.parentElement as HTMLElement;
+    await expect(getComputedStyle(selected).boxShadow).not.toBe('none');
+    await expect(getComputedStyle(list.parentElement as HTMLElement).boxShadow).toBe('none');
+  },
+};
+
+function ControlledView() {
+  const [view, setView] = useState('list');
+  return (
+    <Field label="View" description={`Showing: ${view}`}>
+      <SegmentedControl value={view} onValueChange={setView}>
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        <SegmentedControlItem value="list">List</SegmentedControlItem>
+        <SegmentedControlItem value="table">Table</SegmentedControlItem>
+      </SegmentedControl>
+    </Field>
+  );
+}
+
+export const InAField: Story = {
+  render: () => <ControlledView />,
+  play: async ({ canvas }) => {
+    const group = canvas.getByRole('radiogroup', { name: 'View' });
+    await expect(group).toHaveAccessibleDescription('Showing: list');
+    await userEvent.click(canvas.getByRole('radio', { name: 'Table' }));
+    await expect(group).toHaveAccessibleDescription('Showing: table');
+  },
+};
+
+export const Invalid: Story = {
+  render: () => (
+    <Field label="View" error="Choose a view." required>
+      <SegmentedControl>
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        <SegmentedControlItem value="list">List</SegmentedControlItem>
+      </SegmentedControl>
+    </Field>
+  ),
+  play: async ({ canvas }) => {
+    const group = canvas.getByRole('radiogroup', { name: 'View' });
+    await expect(group).toHaveAttribute('aria-invalid', 'true');
+    await expect(canvas.getByRole('radio', { name: 'Grid' })).toBeRequired();
+  },
+};
+
+function FormDemo() {
+  const [sent, setSent] = useState('');
+  const submit = (event: FormEvent<HTMLFormElement>) => {
+    event.preventDefault();
+    setSent(String(new FormData(event.currentTarget).get('view')));
+  };
+  return (
+    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
+      <Field label="View" required>
+        <SegmentedControl name="view">
+          <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+          <SegmentedControlItem value="table" disabled>
+            Table
+          </SegmentedControlItem>
+          <SegmentedControlItem value="list">List</SegmentedControlItem>
+        </SegmentedControl>
+      </Field>
+      <button type="submit">Save</button>
+      <button type="reset">Reset</button>
+      <output>{sent ? `Sent: ${sent}` : 'Nothing sent'}</output>
+    </form>
+  );
+}
+
+/** Real keys and a real submit, so Tab, the arrows and `required` are the browser's own. */
+export const Keyboard: Story = {
+  tags: ['no-visual'],
+  render: () => <FormDemo />,
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    const grid = canvas.getByRole<HTMLInputElement>('radio', { name: 'Grid' });
+    const list = canvas.getByRole('radio', { name: 'List' });
+    const table = canvas.getByRole('radio', { name: 'Table' });
+    const output = canvas.getByRole('status');
+    // Nothing is selected, so `required` makes the segments invalid: the form would not submit.
+    await expect(grid.validity.valueMissing).toBe(true);
+    if (!real) return;
+    // Tab enters the group, the arrows select, and they step over the disabled segment.
+    await real.tab();
+    await expect(grid).toHaveFocus();
+    await expect(grid.matches(':focus-visible')).toBe(true);
+    await real.keyboard('{ArrowRight}');
+    await expect(list).toHaveFocus();
+    await expect(list).toBeChecked();
+    await expect(table).not.toBeChecked();
+    await real.keyboard('{ArrowLeft}');
+    await expect(grid).toBeChecked();
+    await real.keyboard('{ArrowRight}');
+    await expect(list).toBeChecked();
+    await real.click(canvas.getByRole('button', { name: 'Save' }));
+    await waitFor(() => expect(output).toHaveTextContent('Sent: list'));
+    // Reset puts it back to nothing selected, and required again.
+    await real.click(canvas.getByRole('button', { name: 'Reset' }));
+    await expect(list).not.toBeChecked();
+    await expect(grid.validity.valueMissing).toBe(true);
+  },
+};
diff --git a/src/components/segmented-control/SegmentedControl.test-d.ts b/src/components/segmented-control/SegmentedControl.test-d.ts
new file mode 100644
index 0000000..ce0c070
--- /dev/null
+++ b/src/components/segmented-control/SegmentedControl.test-d.ts
@@ -0,0 +1,27 @@
+import { expectTypeOf, test } from 'vitest';
+import type { SegmentedControlProps } from './SegmentedControl';
+import type { SegmentedControlItemProps } from './SegmentedControlItem';
+
+test('SegmentedControl accepts only the sizes that have a look', () => {
+  expectTypeOf<SegmentedControlProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
+  // @ts-expect-error there is no large segmented control
+  const large: SegmentedControlProps = { size: 'lg' };
+  expectTypeOf(large).toBeObject();
+});
+
+test('SegmentedControl takes null for no selection, and reports a string', () => {
+  expectTypeOf<SegmentedControlProps['value']>().toEqualTypeOf<string | null | undefined>();
+  expectTypeOf<SegmentedControlProps['onValueChange']>().toEqualTypeOf<
+    ((value: string) => void) | undefined
+  >();
+});
+
+test('SegmentedControlItem requires a value and content, and leaves the selection to the group', () => {
+  expectTypeOf<SegmentedControlItemProps['value']>().toEqualTypeOf<string>();
+  // @ts-expect-error an item without a value cannot be selected
+  const noValue: SegmentedControlItemProps = { children: 'Grid' };
+  expectTypeOf(noValue).toBeObject();
+  // @ts-expect-error the group owns the selection
+  const checked: SegmentedControlItemProps = { value: 'a', children: 'A', checked: true };
+  expectTypeOf(checked).toBeObject();
+});
diff --git a/src/components/segmented-control/SegmentedControl.test.tsx b/src/components/segmented-control/SegmentedControl.test.tsx
new file mode 100644
index 0000000..23a19e8
--- /dev/null
+++ b/src/components/segmented-control/SegmentedControl.test.tsx
@@ -0,0 +1,249 @@
+import { render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef, useState } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { SegmentedControl } from './SegmentedControl';
+import type { SegmentedControlProps } from './SegmentedControl';
+import { SegmentedControlItem } from './SegmentedControlItem';
+
+function Views(props: SegmentedControlProps) {
+  return (
+    <SegmentedControl aria-label="View" {...props}>
+      <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+      <SegmentedControlItem value="list">List</SegmentedControlItem>
+      <SegmentedControlItem value="table">Table</SegmentedControlItem>
+    </SegmentedControl>
+  );
+}
+
+const radio = (name: string) => screen.getByRole('radio', { name });
+
+describe('SegmentedControl', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  it('renders a radiogroup of native radios, each inside a label, that share a generated name', () => {
+    const ref = createRef<HTMLDivElement>();
+    const { container } = render(
+      <SegmentedControl ref={ref} aria-label="View" className="mine">
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        <SegmentedControlItem value="list">List</SegmentedControlItem>
+      </SegmentedControl>,
+    );
+    const group = screen.getByRole('radiogroup', { name: 'View' });
+    expect(ref.current).toBe(group);
+    expect(group).toHaveClass('flg-segmented', 'mine');
+    expect(group).toHaveAttribute('data-size', 'md');
+    expect(group).not.toHaveAttribute('data-full-width');
+    const inputs = screen.getAllByRole('radio');
+    expect(new Set(inputs.map((input) => input.getAttribute('name'))).size).toBe(1);
+    expect(inputs[0]?.getAttribute('name')).toBeTruthy();
+    const label = container.querySelector('label.flg-segmented-item');
+    expect(label?.querySelector(':scope > input.flg-segmented-input')).toBe(inputs[0]);
+    expect(label?.querySelector(':scope > .flg-segmented-label')).toHaveTextContent('Grid');
+  });
+
+  it('uses the name, size and fullWidth passed in', () => {
+    render(<Views name="view" size="sm" fullWidth />);
+    const group = screen.getByRole('radiogroup');
+    expect(group).toHaveAttribute('data-size', 'sm');
+    expect(group).toHaveAttribute('data-full-width');
+    expect(radio('Grid')).toHaveAttribute('name', 'view');
+  });
+
+  it('starts at defaultValue and reports the value the user picks', async () => {
+    const onValueChange = vi.fn();
+    const user = userEvent.setup();
+    render(<Views defaultValue="list" onValueChange={onValueChange} />);
+    expect(radio('List')).toBeChecked();
+    await user.click(radio('Table'));
+    expect(onValueChange).toHaveBeenCalledWith('table');
+    expect(radio('Table')).toBeChecked();
+  });
+
+  it('follows value when controlled, and selects nothing for null', async () => {
+    const onValueChange = vi.fn();
+    const user = userEvent.setup();
+    const { rerender } = render(<Views value="list" onValueChange={onValueChange} />);
+    await user.click(radio('Grid'));
+    expect(onValueChange).toHaveBeenCalledWith('grid');
+    expect(radio('List')).toBeChecked();
+    rerender(<Views value="grid" onValueChange={onValueChange} />);
+    expect(radio('Grid')).toBeChecked();
+    rerender(<Views value={null} onValueChange={onValueChange} />);
+    expect(screen.getAllByRole('radio').some((input) => (input as HTMLInputElement).checked)).toBe(
+      false,
+    );
+  });
+
+  it('moves the selection with the arrow keys and skips a disabled item', async () => {
+    const onValueChange = vi.fn();
+    const user = userEvent.setup();
+    render(
+      <SegmentedControl aria-label="View" defaultValue="grid" onValueChange={onValueChange}>
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        <SegmentedControlItem value="list" disabled>
+          List
+        </SegmentedControlItem>
+        <SegmentedControlItem value="table">Table</SegmentedControlItem>
+      </SegmentedControl>,
+    );
+    await user.tab();
+    expect(radio('Grid')).toHaveFocus();
+    await user.keyboard('{ArrowRight}');
+    expect(radio('Table')).toHaveFocus();
+    expect(radio('Table')).toBeChecked();
+    expect(onValueChange).toHaveBeenLastCalledWith('table');
+  });
+
+  it('puts required and disabled on every radio, and an item can override disabled', () => {
+    render(
+      <SegmentedControl aria-label="View" required disabled>
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        <SegmentedControlItem value="list" disabled={false}>
+          List
+        </SegmentedControlItem>
+      </SegmentedControl>,
+    );
+    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
+    expect(radio('Grid')).toBeRequired();
+    expect(radio('Grid')).toBeDisabled();
+    expect(radio('List')).toBeEnabled();
+  });
+
+  it('marks the group invalid', () => {
+    render(<Views invalid />);
+    const group = screen.getByRole('radiogroup');
+    expect(group).toHaveAttribute('aria-invalid', 'true');
+    expect(group).toHaveAttribute('data-invalid');
+  });
+
+  it('calls an item onChange before onValueChange', async () => {
+    const calls: string[] = [];
+    const user = userEvent.setup();
+    render(
+      <SegmentedControl aria-label="View" onValueChange={(value) => calls.push(`value:${value}`)}>
+        <SegmentedControlItem value="grid" onChange={() => calls.push('change')}>
+          Grid
+        </SegmentedControlItem>
+      </SegmentedControl>,
+    );
+    await user.click(radio('Grid'));
+    expect(calls).toEqual(['change', 'value:grid']);
+  });
+
+  it('forwards an item ref, and puts className and style on its label', () => {
+    const ref = createRef<HTMLInputElement>();
+    const { container } = render(
+      <SegmentedControl aria-label="View">
+        <SegmentedControlItem ref={ref} value="grid" className="mine" style={{ marginTop: 4 }}>
+          Grid
+        </SegmentedControlItem>
+      </SegmentedControl>,
+    );
+    expect(ref.current).toBe(radio('Grid'));
+    const label = container.querySelector('label.flg-segmented-item') as HTMLLabelElement;
+    expect(label).toHaveClass('mine');
+    expect(label).toHaveStyle({ marginTop: '4px' });
+  });
+
+  it('submits the selected value with the form, and the browser resets it with the form', async () => {
+    const user = userEvent.setup();
+    const { container } = render(
+      <form>
+        <Views name="view" defaultValue="grid" />
+        <button type="reset">Reset</button>
+      </form>,
+    );
+    const form = container.querySelector('form') as HTMLFormElement;
+    expect(new FormData(form).get('view')).toBe('grid');
+    await user.click(radio('Table'));
+    expect(new FormData(form).get('view')).toBe('table');
+    await user.click(screen.getByRole('button', { name: 'Reset' }));
+    expect(new FormData(form).get('view')).toBe('grid');
+    expect(radio('Grid')).toBeChecked();
+  });
+
+  it('does not submit anything from a disabled group', () => {
+    const { container } = render(
+      <form>
+        <Views name="view" defaultValue="grid" disabled />
+      </form>,
+    );
+    expect(new FormData(container.querySelector('form') as HTMLFormElement).has('view')).toBe(
+      false,
+    );
+  });
+
+  it('is named by a Field label and described by the Field', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    const { container } = render(
+      <Field label="View" description="How the list looks." error="Pick a view." required>
+        <SegmentedControl>
+          <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        </SegmentedControl>
+      </Field>,
+    );
+    const group = screen.getByRole('radiogroup', { name: 'View' });
+    expect(container.querySelector('label.flg-field-label')).toBeNull();
+    expect(group).toHaveAccessibleDescription('How the list looks. Pick a view.');
+    expect(group).toHaveAttribute('aria-invalid', 'true');
+    expect(group).toHaveAttribute('aria-required', 'true');
+    expect(radio('Grid')).toBeRequired();
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it('warns about a group without a name', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(
+      <SegmentedControl>
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+      </SegmentedControl>,
+    );
+    expect(warn).toHaveBeenCalledWith(
+      '[fl-glass-ui] <SegmentedControl> needs a name: pass aria-label or aria-labelledby.',
+    );
+  });
+
+  it('warns about an item outside a SegmentedControl', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(<SegmentedControlItem value="grid">Grid</SegmentedControlItem>);
+    expect(warn).toHaveBeenCalledWith(
+      '[fl-glass-ui] SegmentedControlItem must be inside a SegmentedControl, which gives it its name.',
+    );
+  });
+
+  it('warns about two items with the same value', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(
+      <SegmentedControl aria-label="View">
+        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+        <SegmentedControlItem value="grid">Grid again</SegmentedControlItem>
+      </SegmentedControl>,
+    );
+    expect(warn).toHaveBeenCalledWith(
+      '[fl-glass-ui] Two SegmentedControlItem parts have the value "grid", so the user cannot tell them apart.',
+    );
+  });
+
+  it('does not warn when a control with distinct values re-renders', async () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    function Counter() {
+      const [n, setN] = useState(0);
+      return (
+        <>
+          <button type="button" onClick={() => setN(n + 1)}>
+            More {n}
+          </button>
+          <Views />
+        </>
+      );
+    }
+    const user = userEvent.setup();
+    render(<Counter />);
+    await user.click(screen.getByRole('button', { name: 'More 0' }));
+    expect(warn).not.toHaveBeenCalled();
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index bfea75a..342fe34 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -65,6 +65,8 @@ describe('public API', () => {
       'PopoverTrigger',
       'Radio',
       'RadioGroup',
+      'SegmentedControl',
+      'SegmentedControlItem',
       'Select',
       'SelectGroup',
       'SelectItem',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/segmented-control src/index.test.ts
```

Expected: FAIL, `Failed to resolve import "./SegmentedControl"` cho cả `SegmentedControl.test.tsx` và `SegmentedControl.test-d.ts`; `src/index.test.ts` fail vì danh sách export có `SegmentedControl` mà `src/index.ts` chưa có. Không test nào fail vì lý do tinh vi hơn.

- [ ] **Step 3: Viết code**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 7846e84..bc52e1f 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -55,6 +55,10 @@ const SHIPPED_CLASSES = [
   'flg-tabs-list',
   'flg-tabs-trigger',
   'flg-tabs-content',
+  'flg-segmented',
+  'flg-segmented-item',
+  'flg-segmented-input',
+  'flg-segmented-label',
   'flg-accordion',
   'flg-accordion-item',
   'flg-accordion-trigger',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 5c79acf..e2273fd 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -22,6 +22,8 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/context-menu/ContextMenu.tsx',
   'src/components/select/Select.tsx',
   'src/components/tabs/Tabs.tsx',
+  'src/components/segmented-control/SegmentedControl.tsx',
+  'src/components/segmented-control/SegmentedControlItem.tsx',
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
   'src/components/toast/toast.ts',
diff --git a/src/components/segmented-control/SegmentedControl.mdx b/src/components/segmented-control/SegmentedControl.mdx
new file mode 100644
index 0000000..d915cbe
--- /dev/null
+++ b/src/components/segmented-control/SegmentedControl.mdx
@@ -0,0 +1,84 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './SegmentedControl.stories';
+
+<Meta of={Stories} />
+
+# SegmentedControl
+
+```tsx
+import { Field, SegmentedControl, SegmentedControlItem } from 'fl-glass-ui';
+
+<Field label="View">
+  <SegmentedControl name="view" defaultValue="grid">
+    <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
+    <SegmentedControlItem value="list">List</SegmentedControlItem>
+    <SegmentedControlItem value="table">Table</SegmentedControlItem>
+  </SegmentedControl>
+</Field>;
+```
+
+<Canvas of={Stories.Look} />
+<Controls />
+
+## SegmentedControl or Tabs
+
+Both look the same, a raised segment in a track, and they are not interchangeable.
+
+- Use **SegmentedControl** to choose one value, such as a view, a period or a unit. It is a set of
+  native radios: it belongs in a form, submits its value, resets with the form and can be `required`.
+- Use **Tabs** with `variant="segmented"` to switch between panels of content. It has no value in a
+  form and is announced as tabs.
+
+## Sizes and width
+
+`size` is `"md"` (the default, 34px high like an Input) or `"sm"` (28px). There is no large size.
+The control is as wide as its segments; `fullWidth` makes it fill its container and share the width
+equally. Segment text never wraps, so a control wider than its container overflows it: keep to a few
+short choices, and use a [Select](?path=/docs/components-select--docs) for more.
+
+A segment can hold an icon before its text. The two sit 6px apart.
+
+## Controlled, in a Field
+
+Pass `value` and `onValueChange` to control the selection. Placed directly inside a `Field`, the
+control takes its name from the label and its description and error from the Field. Pass `null` to
+show no selection; `undefined` makes the control uncontrolled.
+
+<Canvas of={Stories.InAField} />
+
+## Invalid and required
+
+`required` and `disabled` reach every native radio, so the browser's validation and form submission
+work. An item's own `disabled` overrides the control's.
+
+<Canvas of={Stories.Invalid} />
+
+## Forms
+
+The segments are native radios that share one `name` (generated when you do not pass one), so
+`FormData` carries the selected value and a form reset puts it back to its default. A disabled
+control, like any disabled input, sends nothing.
+
+<Canvas of={Stories.Keyboard} />
+
+## Accessibility
+
+- Renders `role="radiogroup"` around native radio inputs. Tab enters the control at the selected
+  segment and the arrow keys move and select, skipping a disabled one. All of it is the browser's;
+  the library adds no key handling.
+- The radio lies over its segment with `opacity: 0`, so a click, the focus ring and the browser's
+  validation message all land on the segment.
+- Name the control with a `Field` label or `aria-label`. Keep it a direct child (a Fragment around
+  it is fine) of `Field`: the development build warns when it is wrapped and the Field cannot label
+  it. It warns too when the control has no name.
+- A `SegmentedControlItem` takes the control's name; one outside a `SegmentedControl` has none, and
+  the development build warns, as it does for two items with the same `value`.
+- In forced-colors mode every segment has an edge, `Highlight` when selected, so the selected one
+  does not rely on its fill and no segment changes width when it is selected.
+
+## Do and don't
+
+- Do give each segment a short label of one or two words.
+- Do select a sensible default when there is one.
+- Don't use it to switch panels; use Tabs.
+- Don't use it for more than about five choices; use a Select.
diff --git a/src/components/segmented-control/SegmentedControl.tsx b/src/components/segmented-control/SegmentedControl.tsx
new file mode 100644
index 0000000..1fab70e
--- /dev/null
+++ b/src/components/segmented-control/SegmentedControl.tsx
@@ -0,0 +1,133 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useCallback, useId, useMemo, useRef } from 'react';
+import type { HTMLAttributes } from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import {
+  FieldContext,
+  markAsFieldGroup,
+  useFieldContext,
+  useFieldProps,
+} from '../../internal/field-context';
+import { useRequireName } from '../../internal/use-require-name';
+import { devWarn } from '../../internal/warn';
+import { SegmentedControlContext } from './SegmentedControlContext';
+import type { SegmentedControlContextValue } from './SegmentedControlContext';
+
+export interface SegmentedControlProps extends Omit<
+  HTMLAttributes<HTMLDivElement>,
+  'defaultValue' | 'onChange'
+> {
+  /** The selected value, for a controlled control. `null` selects nothing; leave it `undefined` for an uncontrolled one. */
+  value?: string | null;
+  /** The value selected at first, for an uncontrolled control. */
+  defaultValue?: string;
+  /** Called with the value of the item the user selects. */
+  onValueChange?: (value: string) => void;
+  /** The form field name shared by every item. Generated when omitted. */
+  name?: string;
+  disabled?: boolean;
+  required?: boolean;
+  invalid?: boolean;
+  /** Default `"md"`. There is no large size. */
+  size?: 'sm' | 'md';
+  /** Fills the width of its container, and shares it equally between the segments. */
+  fullWidth?: boolean;
+}
+
+/**
+ * A row of segments of which the user picks one: native radios, so the arrow keys, Tab and the form
+ * work as they do for a RadioGroup. It looks like Tabs `segmented`, but chooses a value and does
+ * not switch panels.
+ */
+export const SegmentedControl = markAsFieldGroup(
+  forwardRef<HTMLDivElement, SegmentedControlProps>(function SegmentedControl(
+    {
+      value,
+      defaultValue,
+      onValueChange,
+      name,
+      size = 'md',
+      fullWidth,
+      className,
+      children,
+      ...props
+    },
+    ref,
+  ) {
+    const field = useFieldContext();
+    // Only a control that is the Field's direct child is the one the Field labels.
+    const labelled = field?.labelMode === 'group';
+    // An unlabelled control keeps its own id below, so the Field never sees it (and does not warn
+    // about it on top of the warning that follows).
+    const { invalid, required, disabled, id, ...groupProps } = useFieldProps(
+      labelled ? props : { ...props, id: undefined },
+    );
+    const generatedName = useId();
+    if (field?.labelMode === 'for' && field.labelId !== undefined) {
+      devWarn(
+        'SegmentedControl is inside a Field but is not its direct child, so the Field cannot ' +
+          'label it. Make SegmentedControl the direct child of Field.',
+      );
+    }
+    useRequireName(
+      {
+        'aria-label': props['aria-label'],
+        'aria-labelledby': props['aria-labelledby'] ?? (labelled ? field.labelId : undefined),
+      },
+      'SegmentedControl',
+    );
+    const groupName = name ?? generatedName;
+
+    // How many mounted items have each value, to warn about a second one.
+    const counts = useRef(new Map<string, number>());
+    const register = useCallback((itemValue: string) => {
+      const count = (counts.current.get(itemValue) ?? 0) + 1;
+      counts.current.set(itemValue, count);
+      if (count > 1) {
+        devWarn(
+          `Two SegmentedControlItem parts have the value "${itemValue}", so the user cannot tell ` +
+            'them apart.',
+        );
+      }
+      return () => {
+        counts.current.set(itemValue, (counts.current.get(itemValue) ?? 1) - 1);
+      };
+    }, []);
+
+    const context = useMemo<SegmentedControlContextValue>(
+      () => ({
+        name: groupName,
+        value,
+        defaultValue,
+        onValueChange,
+        required,
+        disabled,
+        register,
+      }),
+      [groupName, value, defaultValue, onValueChange, required, disabled, register],
+    );
+    return (
+      <div
+        ref={ref}
+        role="radiogroup"
+        className={clsx('flg-segmented', className)}
+        data-size={size}
+        data-full-width={dataAttr(fullWidth)}
+        data-invalid={dataAttr(invalid)}
+        aria-labelledby={labelled ? field.labelId : undefined}
+        aria-required={required || undefined}
+        {...groupProps}
+        id={labelled ? id : props.id}
+      >
+        {/* The Field belongs to the control, not to something placed inside one of its segments. */}
+        <FieldContext.Provider value={null}>
+          <SegmentedControlContext.Provider value={context}>
+            {children}
+          </SegmentedControlContext.Provider>
+        </FieldContext.Provider>
+      </div>
+    );
+  }),
+);
diff --git a/src/components/segmented-control/SegmentedControlContext.ts b/src/components/segmented-control/SegmentedControlContext.ts
new file mode 100644
index 0000000..9aaec31
--- /dev/null
+++ b/src/components/segmented-control/SegmentedControlContext.ts
@@ -0,0 +1,19 @@
+import { createContext, useContext } from 'react';
+
+/** What a SegmentedControl tells each SegmentedControlItem inside it. */
+export interface SegmentedControlContextValue {
+  name: string;
+  value: string | null | undefined;
+  defaultValue: string | undefined;
+  onValueChange: ((value: string) => void) | undefined;
+  required: boolean | undefined;
+  disabled: boolean | undefined;
+  /** Counts an item's value while it is mounted, and returns what undoes the count. */
+  register: (value: string) => () => void;
+}
+
+export const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);
+
+export function useSegmentedControlContext(): SegmentedControlContextValue | null {
+  return useContext(SegmentedControlContext);
+}
diff --git a/src/components/segmented-control/SegmentedControlItem.tsx b/src/components/segmented-control/SegmentedControlItem.tsx
new file mode 100644
index 0000000..4b1ed1c
--- /dev/null
+++ b/src/components/segmented-control/SegmentedControlItem.tsx
@@ -0,0 +1,53 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect } from 'react';
+import type { InputHTMLAttributes, ReactNode } from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { devWarn } from '../../internal/warn';
+import { useSegmentedControlContext } from './SegmentedControlContext';
+
+export interface SegmentedControlItemProps extends Omit<
+  InputHTMLAttributes<HTMLInputElement>,
+  'type' | 'name' | 'value' | 'checked' | 'defaultChecked'
+> {
+  value: string;
+  children: ReactNode;
+}
+
+/** One segment of a SegmentedControl. `className` and `style` go on the `<label>`. */
+export const SegmentedControlItem = forwardRef<HTMLInputElement, SegmentedControlItemProps>(
+  function SegmentedControlItem(
+    { value, required, disabled, onChange, className, style, children, ...props },
+    ref,
+  ) {
+    const group = useSegmentedControlContext();
+    if (!group) {
+      devWarn('SegmentedControlItem must be inside a SegmentedControl, which gives it its name.');
+    }
+    const register = group?.register;
+    useEffect(() => register?.(value), [register, value]);
+    const controlled = group?.value !== undefined;
+
+    const handleChange = composeEventHandlers(onChange, () => group?.onValueChange?.(value));
+
+    return (
+      <label className={clsx('flg-segmented-item', className)} style={style}>
+        <input
+          ref={ref}
+          type="radio"
+          className="flg-segmented-input"
+          {...props}
+          name={group?.name}
+          value={value}
+          checked={controlled ? group.value === value : undefined}
+          defaultChecked={controlled ? undefined : group?.defaultValue === value}
+          required={required ?? group?.required}
+          disabled={disabled ?? group?.disabled}
+          onChange={handleChange}
+        />
+        <span className="flg-segmented-label">{children}</span>
+      </label>
+    );
+  },
+);
diff --git a/src/components/segmented-control/index.ts b/src/components/segmented-control/index.ts
new file mode 100644
index 0000000..2124dc0
--- /dev/null
+++ b/src/components/segmented-control/index.ts
@@ -0,0 +1,4 @@
+export { SegmentedControl } from './SegmentedControl';
+export type { SegmentedControlProps } from './SegmentedControl';
+export { SegmentedControlItem } from './SegmentedControlItem';
+export type { SegmentedControlItemProps } from './SegmentedControlItem';
diff --git a/src/index.ts b/src/index.ts
index 6580290..32d60d4 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -148,6 +148,11 @@ export type {
   TabsTriggerProps,
   TabsVariant,
 } from './components/tabs';
+export { SegmentedControl, SegmentedControlItem } from './components/segmented-control';
+export type {
+  SegmentedControlItemProps,
+  SegmentedControlProps,
+} from './components/segmented-control';
 export {
   Accordion,
   AccordionContent,
diff --git a/src/styles/components/segmented-control.css b/src/styles/components/segmented-control.css
new file mode 100644
index 0000000..cbdf675
--- /dev/null
+++ b/src/styles/components/segmented-control.css
@@ -0,0 +1,80 @@
+/* SegmentedControl (spec phase 3 §4.3, mockup G1): the look of Tabs `segmented` (tabs.css). The
+   segments sit in a track as wide as they are; the selected one is raised. Each segment is a label
+   around a native radio, which lies over it, invisible, as in toggle.css: it keeps focus, clicks and
+   form behaviour, and the browser's own validation bubble points at the segment. */
+@layer flg.components {
+  .flg-segmented {
+    display: flex;
+    box-sizing: border-box;
+    width: fit-content;
+    padding: 3px;
+    border-radius: var(--flg-radius-md);
+    background: var(--flg-control-track);
+    font-family: var(--flg-font-sans);
+  }
+  .flg-segmented[data-full-width] {
+    width: 100%;
+  }
+  .flg-segmented-item {
+    position: relative;
+    /* Keeps the input's z-index inside the segment. */
+    isolation: isolate;
+    display: inline-flex;
+    flex: none;
+    align-items: center;
+    justify-content: center;
+    box-sizing: border-box;
+    height: 28px;
+    padding: 0 14px;
+    border-radius: calc(var(--flg-radius-md) - 3px);
+    color: var(--flg-text-muted);
+    font: var(--flg-weight-medium) var(--flg-text-sm) var(--flg-font-sans);
+    white-space: nowrap;
+    cursor: pointer;
+  }
+  .flg-segmented[data-full-width] .flg-segmented-item {
+    flex: 1 1 0;
+    min-width: 0;
+  }
+  .flg-segmented[data-size='sm'] .flg-segmented-item {
+    height: 22px;
+    padding: 0 10px;
+    font-size: var(--flg-text-xs);
+  }
+  .flg-segmented-label {
+    display: inline-flex;
+    align-items: center;
+    gap: 6px;
+  }
+  .flg-segmented-input {
+    position: absolute;
+    /* Above the label, so every click and every hit test lands on the real input. */
+    z-index: 1;
+    inset: 0;
+    width: 100%;
+    height: 100%;
+    margin: 0;
+    opacity: 0;
+    cursor: inherit;
+  }
+  .flg-segmented-item:has(> input:checked) {
+    background: var(--flg-control-bg);
+    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
+    color: var(--flg-text);
+  }
+  /* The focus ring is a shadow too: the selected segment keeps its own beneath it. */
+  .flg-segmented-item:has(> input:focus-visible) {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+  .flg-segmented-item:has(> input:checked:focus-visible) {
+    box-shadow:
+      0 1px 3px rgba(0, 0, 0, 0.12),
+      var(--flg-focus-ring);
+  }
+  .flg-segmented-item:has(> input:disabled) {
+    opacity: 0.45;
+    cursor: not-allowed;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 72ec6fc..9e62889 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -23,6 +23,7 @@
 @import './components/menu.css';
 @import './components/select.css';
 @import './components/tabs.css';
+@import './components/segmented-control.css';
 @import './components/accordion.css';
 @import './components/breadcrumb.css';
 @import './components/pagination.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 2de982f..9514c28 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -8,8 +8,10 @@
       background: var(--flg-highlight-text);
       color: var(--flg-highlight-bg);
     }
-    /* The selected segmented tab gets an edge of the text colour, which its track can tell apart. */
-    .flg-tabs-list[data-variant='segmented'] .flg-tabs-trigger[aria-selected='true'] {
+    /* The selected segmented tab, and segment, gets an edge of the text colour, which its track can
+       tell apart. */
+    .flg-tabs-list[data-variant='segmented'] .flg-tabs-trigger[aria-selected='true'],
+    .flg-segmented-item:has(> input:checked) {
       box-shadow: inset 0 0 0 1px var(--flg-text);
     }
   }
@@ -201,6 +203,17 @@
       .flg-tabs-trigger[aria-selected='true'] {
       border-color: Highlight;
     }
+    /* A selected segment of a SegmentedControl is marked the way a segmented tab is: every segment
+       has the edge, so none grows as it is selected and pushes the next one. */
+    .flg-segmented-item {
+      border: 1px solid Canvas;
+    }
+    .flg-segmented-item:has(> input:checked) {
+      border-color: Highlight;
+    }
+    .flg-segmented-item:has(> input:disabled) {
+      color: GrayText;
+    }
     /* A row of tabs that scrolls: the system scroll bar shows that it does, and a fade would lower
        the contrast this mode is for. */
     .flg-tabs-list[data-overflow] {
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/segmented-control src/components/radio-group src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/segmented-control
pnpm vitest run --project storybook-light --project storybook-dark src/components/radio-group
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs
pnpm build && pnpm check:package
```

Expected: 35 test đơn vị của `segmented-control` PASS (16 test × 2 project, và 3 test kiểu), cùng `radio-group`; story `segmented-control` 24 test PASS, `radio-group` và `tabs` không đổi; `check:package` PASS, gồm `check:use-client` và `size` (CSS 6.69 kB trên 7.13 kB). Axe bật trong story và pass. Không selector hay phần tử nào của component cũ đổi, nên ảnh chuẩn cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/segmented-control/SegmentedControl.mdx \
  src/components/segmented-control/SegmentedControl.stories.tsx \
  src/components/segmented-control/SegmentedControl.test-d.ts \
  src/components/segmented-control/SegmentedControl.test.tsx \
  src/components/segmented-control/SegmentedControl.tsx \
  src/components/segmented-control/SegmentedControlContext.ts \
  src/components/segmented-control/SegmentedControlItem.tsx \
  src/components/segmented-control/index.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/segmented-control.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(segmented-control): SegmentedControl and SegmentedControlItem, the G1 look on native radios" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 5: `NumberInput`, kèm `number.ts`

Spec §3.3, §4.3 (giao diện N2), §4.5, §5, §6.3, §7. Ô số trong form cần gõ, bước và giá trị gửi không phụ thuộc locale, mà `<input type="number">` làm kém (không có locale, không có định dạng, mũi tên không tuỳ biến được).
- Input nhìn thấy là text với role `spinbutton`. Chữ được đọc khi rời ô hoặc nhấn Enter (kẹp vào khoảng, làm tròn lên lưới `step`, ghi lại theo locale); chữ không đọc được thì trả lại chữ cũ và không báo gì. Chữ rỗng là `null`.
- Phím mũi tên, Page, Home/End bước theo lưới. Một input ẩn mang số thô, nên `FormData` không phụ thuộc locale.
- Nút − và + lặp khi giữ (400ms, rồi mỗi 60ms), không nhận focus.
- `src/internal/number.ts` nằm ở task này: nó chỉ có `NumberInput` import, và `check:use-client` fail với một module không ai import (phát hiện 2). File này do `reflection/beam-free` viết qua opencode, Claude dọn lại: một hàm `literalParts` chung, `StepDirection` kiểu `'up' | 'down'`.

**Files:**
- Create: `src/internal/number.ts`, `src/internal/number.test.ts`, `src/components/number-input/NumberInput.tsx`, `use-press-repeat.ts`, `index.ts`, `NumberInput.test.tsx`, `NumberInput.test-d.ts`, `NumberInput.stories.tsx`, `NumberInput.mdx`, `src/styles/components/number-input.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`

**Interfaces:**
- Produces trong `src/internal/number.ts` (thuần, không `"use client"`):
  - `clamp(value, min, max)`, `decimalsOf(n)`, `snapToStep(value, step, min)`.
  - `stepFrom(value, step, min, 'up' | 'down')`: bước tới giá trị lưới kế tiếp (7, bước 5, lên cho 10, không phải 12).
  - `formatNumber(value, locale, options?)`, `parseNumber(text, locale, options?)`: `parseNumber` đọc lại đúng cái `formatNumber` viết; chữ khác trả `NaN`.
  - Task 6 và 7 (`Slider`) dùng các hàm này.
- Produces: `NumberInput`, `NumberInputProps`; hook `usePressRepeat`; class `flg-number-input`.
- Consumes: `MinusIcon`, `PlusIcon` (Task 1), `useFormReset` (Task 2), `useFieldProps` và `markAsFieldControl`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/number-input/NumberInput.stories.tsx b/src/components/number-input/NumberInput.stories.tsx
new file mode 100644
index 0000000..dbac676
--- /dev/null
+++ b/src/components/number-input/NumberInput.stories.tsx
@@ -0,0 +1,255 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import type { FormEvent } from 'react';
+import { expect, fn, userEvent, waitFor } from 'storybook/test';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { Card } from '../card/Card';
+import { Field } from '../field/Field';
+import { NumberInput } from './NumberInput';
+
+const meta = {
+  title: 'Components/NumberInput',
+  component: NumberInput,
+  args: { 'aria-label': 'Quantity', defaultValue: 3, onValueChange: fn() },
+} satisfies Meta<typeof NumberInput>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { display: 'grid', gap: 16, width: 320 } as const;
+const caption = {
+  fontSize: 'var(--flg-text-xs)',
+  color: 'var(--flg-text-muted)',
+  marginBottom: 6,
+} as const;
+
+const frameOf = (input: HTMLElement) => input.parentElement as HTMLElement;
+const buttonsOf = (input: HTMLElement) =>
+  Array.from(frameOf(input).querySelectorAll<HTMLElement>(':scope > button'));
+
+/** The input of the mockup (N2): − at the left end, + at the right end, the number between them. */
+export const Look: Story = {
+  render: () => (
+    <div style={column}>
+      <Card style={{ gap: 12 }}>
+        <div>
+          <div style={caption}>Medium</div>
+          <NumberInput aria-label="Quantity, medium" defaultValue={3} min={1} max={10} />
+        </div>
+        <div>
+          <div style={caption}>Small</div>
+          <NumberInput aria-label="Quantity, small" size="sm" defaultValue={3} min={1} max={10} />
+        </div>
+        <div>
+          <div style={caption}>Large</div>
+          <NumberInput aria-label="Quantity, large" size="lg" defaultValue={3} min={1} max={10} />
+        </div>
+        <div>
+          <div style={caption}>At the lower limit</div>
+          <NumberInput aria-label="Quantity, at minimum" defaultValue={1} min={1} max={10} />
+        </div>
+        <div>
+          <div style={caption}>Disabled</div>
+          <NumberInput aria-label="Quantity, disabled" defaultValue={3} disabled />
+        </div>
+        <Field label="Quantity" description="From 1 to 10" error="Choose at least 2." required>
+          <NumberInput name="quantity" defaultValue={1} min={1} max={10} />
+        </Field>
+      </Card>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const medium = canvas.getByRole('spinbutton', { name: 'Quantity, medium' });
+    const small = canvas.getByRole('spinbutton', { name: 'Quantity, small' });
+    const large = canvas.getByRole('spinbutton', { name: 'Quantity, large' });
+    // The frame is the one of Input: 34, 28 and 40px tall.
+    await expect(frameOf(medium).getBoundingClientRect().height).toBe(34);
+    await expect(frameOf(small).getBoundingClientRect().height).toBe(28);
+    await expect(frameOf(large).getBoundingClientRect().height).toBe(40);
+    // The buttons are 32px wide at every size, as tall as the frame inside its border, with a 16px icon.
+    for (const input of [medium, small, large]) {
+      const [minus, plus] = buttonsOf(input) as [HTMLElement, HTMLElement];
+      for (const button of [minus, plus]) {
+        const box = button.getBoundingClientRect();
+        await expect(box.width).toBe(32);
+        await expect(box.height).toBe(frameOf(input).getBoundingClientRect().height - 2);
+        const icon = button.querySelector('svg') as SVGElement;
+        await expect(icon.getBoundingClientRect().width).toBe(16);
+      }
+      // A 1px line sits between each button and the text.
+      await expect(getComputedStyle(minus).borderRightWidth).toBe('1px');
+      await expect(getComputedStyle(plus).borderLeftWidth).toBe('1px');
+    }
+    // The number is centred and set in tabular figures.
+    await expect(getComputedStyle(medium).textAlign).toBe('center');
+    await expect(getComputedStyle(medium).fontVariantNumeric).toContain('tabular');
+    // A button at its limit is dimmed to 0.4; the other is not.
+    const atMinimum = canvas.getByRole('spinbutton', { name: 'Quantity, at minimum' });
+    const [less, more] = buttonsOf(atMinimum) as [HTMLElement, HTMLElement];
+    await expect(getComputedStyle(less).opacity).toBe('0.4');
+    await expect(getComputedStyle(more).opacity).toBe('1');
+    // A disabled control is dimmed once, as a whole, as Input is.
+    const disabled = canvas.getByRole('spinbutton', { name: 'Quantity, disabled' });
+    await expect(getComputedStyle(frameOf(disabled)).opacity).toBe('0.5');
+    await expect(getComputedStyle(buttonsOf(disabled)[0] as HTMLElement).opacity).toBe('1');
+  },
+};
+
+function ControlledQuantity() {
+  const [value, setValue] = useState<number | null>(2);
+  return (
+    <Field label="Quantity" description={`Value: ${value === null ? 'none' : value}`}>
+      <NumberInput value={value} onValueChange={setValue} min={0} max={20} />
+    </Field>
+  );
+}
+
+export const InAField: Story = {
+  render: () => <ControlledQuantity />,
+  play: async ({ canvas }) => {
+    const input = canvas.getByRole('spinbutton', { name: 'Quantity' });
+    await expect(input).toHaveAccessibleDescription('Value: 2');
+    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
+    await expect(input).toHaveAccessibleDescription('Value: 3');
+  },
+};
+
+export const Invalid: Story = {
+  render: () => (
+    <Field label="Quantity" error="Choose at least 2.">
+      <NumberInput defaultValue={1} min={1} />
+    </Field>
+  ),
+  play: async ({ canvas }) => {
+    const input = canvas.getByRole('spinbutton', { name: 'Quantity' });
+    await expect(input).toHaveAttribute('aria-invalid', 'true');
+    await expect(input).toHaveAccessibleDescription('Choose at least 2.');
+  },
+};
+
+function FormDemo() {
+  const [sent, setSent] = useState('');
+  const submit = (event: FormEvent<HTMLFormElement>) => {
+    event.preventDefault();
+    setSent(String(new FormData(event.currentTarget).get('amount')));
+  };
+  return (
+    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
+      <Field label="Amount" required>
+        <NumberInput name="amount" min={0} max={100} step={5} defaultValue={10} />
+      </Field>
+      <button type="submit">Save</button>
+      <button type="reset">Reset</button>
+      <output>{sent === '' ? 'Nothing sent' : `Sent: ${sent}`}</output>
+    </form>
+  );
+}
+
+/** Real typing and a real submit: the text is read when the field is left, or on Enter. */
+export const Typing: Story = {
+  tags: ['no-visual'],
+  render: () => <FormDemo />,
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const input = canvas.getByRole<HTMLInputElement>('spinbutton', { name: /Amount/ });
+    const output = canvas.getByRole('status');
+    // Typing is free: letters stay until the text is read.
+    await real.click(input);
+    await real.clear(input);
+    await real.keyboard('abc');
+    await expect(input).toHaveValue('abc');
+    // Text that cannot be read goes back to the old value (10) when the field is left.
+    await real.tab();
+    await expect(input).toHaveValue('10');
+    // A number off the grid is rounded onto it and clamped; Enter settles it, and the form
+    // submits that value.
+    await real.click(input);
+    await real.clear(input);
+    await real.keyboard('1,237{Enter}');
+    await waitFor(() => expect(output).toHaveTextContent('Sent: 100'));
+    await expect(input).toHaveValue('100');
+    // Emptying the field is no value, and `required` stops the submit.
+    await real.clear(input);
+    await real.tab();
+    await expect(input.validity.valueMissing).toBe(true);
+    // Reset puts back the default.
+    await real.click(canvas.getByRole('button', { name: 'Reset' }));
+    await waitFor(() => expect(input).toHaveValue('10'));
+  },
+};
+
+/** Real keys: the arrows step along the grid, the Page keys ten times as far, Home and End go to the ends. */
+export const Keys: Story = {
+  tags: ['no-visual'],
+  args: { min: 0, max: 50, step: 5, defaultValue: 7 },
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const input = canvas.getByRole('spinbutton');
+    await real.tab();
+    await expect(input).toHaveFocus();
+    await real.keyboard('{ArrowUp}');
+    await expect(input).toHaveValue('10');
+    await real.keyboard('{ArrowDown}{ArrowDown}');
+    await expect(input).toHaveValue('0');
+    await real.keyboard('{PageUp}');
+    await expect(input).toHaveValue('50');
+    await real.keyboard('{Home}');
+    await expect(input).toHaveValue('0');
+    await real.keyboard('{End}');
+    await expect(input).toHaveValue('50');
+    await expect(input).toHaveAttribute('aria-valuenow', '50');
+  },
+};
+
+const pointer = (type: string) =>
+  new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, isPrimary: true });
+
+/**
+ * Press and hold on the + button, on the browser's own clock: one step at once, more after 400ms, and
+ * none after the release. The pointer events are dispatched, because Vitest's user events have no
+ * press that stays down, but they are real `PointerEvent`s.
+ */
+export const PressAndHold: Story = {
+  tags: ['no-visual'],
+  args: { min: 0, max: 1000, defaultValue: 0 },
+  play: async ({ canvas }) => {
+    const input = canvas.getByRole('spinbutton');
+    const plus = canvas.getByRole('button', { name: 'Increase' });
+    plus.dispatchEvent(pointer('pointerdown'));
+    // One step on the press itself, and the focus did not move to the button.
+    await waitFor(() => expect(input).toHaveValue('1'));
+    await expect(plus).not.toHaveFocus();
+    await new Promise((resolve) => setTimeout(resolve, 900));
+    plus.dispatchEvent(pointer('pointerup'));
+    // A step that was already due when the button was released may still be rendering.
+    await new Promise((resolve) => setTimeout(resolve, 100));
+    const held = Number(input.getAttribute('aria-valuenow'));
+    // 400ms to start, then a step every 60ms: about 8 more in the next 500ms.
+    await expect(held).toBeGreaterThan(4);
+    await expect(held).toBeLessThan(20);
+    await new Promise((resolve) => setTimeout(resolve, 300));
+    await expect(input).toHaveAttribute('aria-valuenow', String(held));
+  },
+};
+
+/** The wheel steps only when `allowWheel` is set and the field has focus. */
+export const Wheel: Story = {
+  tags: ['no-visual'],
+  args: { allowWheel: true, defaultValue: 5 },
+  play: async ({ canvas }) => {
+    const input = canvas.getByRole('spinbutton');
+    const wheel = (deltaY: number) =>
+      input.dispatchEvent(new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true }));
+    wheel(-100);
+    await expect(input).toHaveValue('5');
+    input.focus();
+    wheel(-100);
+    await waitFor(() => expect(input).toHaveValue('6'));
+    wheel(100);
+    await waitFor(() => expect(input).toHaveValue('5'));
+    wheel(100);
+    await waitFor(() => expect(input).toHaveValue('4'));
+  },
+};
diff --git a/src/components/number-input/NumberInput.test-d.ts b/src/components/number-input/NumberInput.test-d.ts
new file mode 100644
index 0000000..29ff049
--- /dev/null
+++ b/src/components/number-input/NumberInput.test-d.ts
@@ -0,0 +1,32 @@
+import { expectTypeOf, test } from 'vitest';
+import type { NumberInputProps } from './NumberInput';
+
+test('NumberInput takes null for no value, and reports a number or null', () => {
+  expectTypeOf<NumberInputProps['value']>().toEqualTypeOf<number | null | undefined>();
+  expectTypeOf<NumberInputProps['defaultValue']>().toEqualTypeOf<number | undefined>();
+  expectTypeOf<NumberInputProps['onValueChange']>().toEqualTypeOf<
+    ((value: number | null) => void) | undefined
+  >();
+});
+
+test('NumberInput accepts only the sizes of Input', () => {
+  expectTypeOf<NumberInputProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
+  // @ts-expect-error 'xl' is not a size
+  const unknownSize: NumberInputProps = { size: 'xl' };
+  expectTypeOf(unknownSize).toBeObject();
+});
+
+test('NumberInput takes numbers for min, max and step, not the strings of a native input', () => {
+  // @ts-expect-error min is a number
+  const text: NumberInputProps = { min: '0' };
+  expectTypeOf(text).toBeObject();
+  // @ts-expect-error the input is always text with the spinbutton role
+  const typed: NumberInputProps = { type: 'number' };
+  expectTypeOf(typed).toBeObject();
+});
+
+test('NumberInput labels name only the two buttons', () => {
+  expectTypeOf<NumberInputProps['labels']>().toEqualTypeOf<
+    { increment?: string; decrement?: string } | undefined
+  >();
+});
diff --git a/src/components/number-input/NumberInput.test.tsx b/src/components/number-input/NumberInput.test.tsx
new file mode 100644
index 0000000..96a9184
--- /dev/null
+++ b/src/components/number-input/NumberInput.test.tsx
@@ -0,0 +1,736 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef, useState } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { NumberInput } from './NumberInput';
+import type { NumberInputProps } from './NumberInput';
+
+const spin = () => screen.getByRole('spinbutton');
+const decrease = () => screen.getByRole('button', { name: 'Decrease' });
+const increase = () => screen.getByRole('button', { name: 'Increase' });
+const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
+
+function Quantity(props: NumberInputProps) {
+  return <NumberInput aria-label="Quantity" {...props} />;
+}
+
+describe('NumberInput', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => {
+    vi.restoreAllMocks();
+    vi.useRealTimers();
+  });
+
+  describe('structure', () => {
+    it('renders a frame with a minus button, a spinbutton, a plus button and a hidden input', () => {
+      const ref = createRef<HTMLInputElement>();
+      const { container } = render(
+        <NumberInput
+          ref={ref}
+          aria-label="Quantity"
+          name="qty"
+          defaultValue={3}
+          className="mine"
+          size="lg"
+        />,
+      );
+      const frame = container.firstElementChild as HTMLElement;
+      expect(frame).toHaveClass('flg-input', 'flg-number-input', 'mine');
+      expect(frame).toHaveAttribute('data-size', 'lg');
+      expect(Array.from(frame.children).map((child) => child.tagName)).toEqual([
+        'BUTTON',
+        'INPUT',
+        'BUTTON',
+        'INPUT',
+      ]);
+      expect(ref.current).toBe(spin());
+      expect(spin()).toHaveAttribute('type', 'text');
+      expect(spin()).not.toHaveAttribute('name');
+      expect(spin()).toHaveAttribute('autocomplete', 'off');
+      for (const button of [decrease(), increase()]) {
+        expect(button).toHaveAttribute('type', 'button');
+        expect(button).toHaveAttribute('tabindex', '-1');
+      }
+      const hidden = frame.lastElementChild as HTMLInputElement;
+      expect(hidden).toHaveAttribute('type', 'hidden');
+      expect(hidden).toHaveAttribute('name', 'qty');
+      expect(hidden.value).toBe('3');
+    });
+
+    it('takes the labels of the buttons from `labels`', () => {
+      render(<Quantity labels={{ increment: 'More', decrement: 'Fewer' }} />);
+      expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
+      expect(screen.getByRole('button', { name: 'Fewer' })).toBeInTheDocument();
+    });
+
+    it('puts the other props, such as placeholder and id, on the spinbutton', () => {
+      render(<Quantity id="q" placeholder="Qty" />);
+      expect(spin()).toHaveAttribute('id', 'q');
+      expect(spin()).toHaveAttribute('placeholder', 'Qty');
+    });
+  });
+
+  describe('value, format and ARIA', () => {
+    it('shows the default value formatted for the locale', () => {
+      render(<Quantity defaultValue={1234.5} />);
+      expect(spin()).toHaveValue('1,234.5');
+    });
+
+    it('formats with the locale and the format options', () => {
+      const { unmount } = render(<Quantity defaultValue={1234.5} locale="vi-VN" />);
+      expect(spin()).toHaveValue('1.234,5');
+      unmount();
+      render(
+        <Quantity defaultValue={1234.5} formatOptions={{ style: 'currency', currency: 'USD' }} />,
+      );
+      expect(spin()).toHaveValue('$1,234.50');
+    });
+
+    it('shows up to three decimals, or those of the step when it has more', () => {
+      const { rerender } = render(<Quantity value={1.23456} />);
+      expect(spin()).toHaveValue('1.235');
+      rerender(<Quantity value={1.23456} step={0.0001} />);
+      expect(spin()).toHaveValue('1.2346');
+    });
+
+    it('is empty and has no aria-valuenow for null', () => {
+      render(<Quantity value={null} />);
+      expect(spin()).toHaveValue('');
+      expect(spin()).not.toHaveAttribute('aria-valuenow');
+    });
+
+    it('sets aria-valuenow, aria-valuemin, aria-valuemax and aria-valuetext', () => {
+      render(<Quantity value={1234} min={0} max={5000} />);
+      expect(spin()).toHaveAttribute('aria-valuenow', '1234');
+      expect(spin()).toHaveAttribute('aria-valuemin', '0');
+      expect(spin()).toHaveAttribute('aria-valuemax', '5000');
+      expect(spin()).toHaveAttribute('aria-valuetext', '1,234');
+    });
+
+    it('omits aria-valuemin and aria-valuemax without min and max', () => {
+      render(<Quantity value={1} />);
+      expect(spin()).not.toHaveAttribute('aria-valuemin');
+      expect(spin()).not.toHaveAttribute('aria-valuemax');
+    });
+
+    it('uses the decimal keyboard when min is not negative, and the text one otherwise', () => {
+      const { rerender } = render(<Quantity min={0} />);
+      expect(spin()).toHaveAttribute('inputmode', 'decimal');
+      rerender(<Quantity />);
+      expect(spin()).toHaveAttribute('inputmode', 'text');
+      rerender(<Quantity min={-5} />);
+      expect(spin()).toHaveAttribute('inputmode', 'text');
+      rerender(<Quantity min={-5} inputMode="numeric" />);
+      expect(spin()).toHaveAttribute('inputmode', 'numeric');
+    });
+
+    it('shows a controlled value outside the range clamped, warns, and does not report it', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const onValueChange = vi.fn();
+      render(<Quantity value={99} min={0} max={10} onValueChange={onValueChange} />);
+      expect(spin()).toHaveValue('10');
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('NumberInput'));
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('typing', () => {
+    it('lets the user type anything, and reports each key to onChange but not to onValueChange', async () => {
+      const onChange = vi.fn();
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity onChange={onChange} onValueChange={onValueChange} />);
+      await user.type(spin(), 'ab1');
+      expect(spin()).toHaveValue('ab1');
+      expect(onChange).toHaveBeenCalledTimes(3);
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('commits on blur: reads, clamps, snaps to the step grid and formats', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(
+        <>
+          <Quantity min={0} max={100} step={5} onValueChange={onValueChange} />
+          <button>other</button>
+        </>,
+      );
+      await user.type(spin(), '1,237');
+      await user.click(screen.getByText('other'));
+      expect(onValueChange).toHaveBeenCalledExactlyOnceWith(100);
+      expect(spin()).toHaveValue('100');
+      await user.clear(spin());
+      await user.type(spin(), '42');
+      await user.tab();
+      expect(spin()).toHaveValue('40');
+      expect(onValueChange).toHaveBeenLastCalledWith(40);
+    });
+
+    it('rounds a decimal onto the grid without float noise', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity step={0.1} onValueChange={onValueChange} />);
+      await user.type(spin(), '0.30000000000000004');
+      await user.tab();
+      expect(onValueChange).toHaveBeenCalledWith(0.3);
+    });
+
+    it('reads the typed text in the locale of the input', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity locale="vi-VN" step={0.1} onValueChange={onValueChange} />);
+      await user.type(spin(), '1.234,5');
+      await user.tab();
+      expect(onValueChange).toHaveBeenCalledWith(1234.5);
+      expect(spin()).toHaveValue('1.234,5');
+    });
+
+    it('makes the value null when the field is emptied', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
+      await user.clear(spin());
+      await user.tab();
+      expect(onValueChange).toHaveBeenCalledWith(null);
+      expect(spin()).not.toHaveAttribute('aria-valuenow');
+    });
+
+    it('puts back the old text, and reports nothing, when the text cannot be read', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
+      await user.clear(spin());
+      await user.type(spin(), 'abc');
+      await user.tab();
+      expect(spin()).toHaveValue('5');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('does not report a commit that leaves the value as it was', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
+      await user.click(spin());
+      await user.tab();
+      await user.click(spin());
+      await user.type(spin(), '{Backspace}5');
+      await user.tab();
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('commits on Enter and leaves the Enter to the form', async () => {
+      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(
+        <form onSubmit={onSubmit}>
+          <Quantity name="qty" onValueChange={onValueChange} />
+          <button type="submit">Save</button>
+        </form>,
+      );
+      await user.type(spin(), '12{Enter}');
+      expect(onValueChange).toHaveBeenCalledWith(12);
+      expect(onSubmit).toHaveBeenCalledTimes(1);
+      const form = spin().closest('form') as HTMLFormElement;
+      expect(new FormData(form).get('qty')).toBe('12');
+    });
+
+    it('runs the onKeyDown of the user first, and a preventDefault there stops the library', async () => {
+      const user = userEvent.setup();
+      render(
+        <Quantity
+          defaultValue={5}
+          onKeyDown={(event) => {
+            if (event.key === 'ArrowUp') event.preventDefault();
+          }}
+        />,
+      );
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}');
+      expect(spin()).toHaveValue('5');
+      await user.keyboard('{ArrowDown}');
+      expect(spin()).toHaveValue('4');
+    });
+
+    it('runs the onBlur of the user and still commits', async () => {
+      const onBlur = vi.fn();
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity onBlur={onBlur} onValueChange={onValueChange} />);
+      await user.type(spin(), '7');
+      await user.tab();
+      expect(onBlur).toHaveBeenCalledTimes(1);
+      expect(onValueChange).toHaveBeenCalledWith(7);
+    });
+  });
+
+  describe('keys', () => {
+    it('steps up and down along the grid', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={7} step={5} onValueChange={onValueChange} />);
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}');
+      expect(spin()).toHaveValue('10');
+      await user.keyboard('{ArrowDown}{ArrowDown}');
+      expect(spin()).toHaveValue('0');
+      expect(onValueChange).toHaveBeenCalledTimes(3);
+    });
+
+    it('stops at min and max', async () => {
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={1} min={0} max={2} />);
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
+      expect(spin()).toHaveValue('2');
+      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
+      expect(spin()).toHaveValue('0');
+    });
+
+    it('moves a largeStep with PageUp and PageDown, ten steps by default', async () => {
+      const user = userEvent.setup();
+      const { unmount } = render(<Quantity defaultValue={50} step={2} />);
+      await user.click(spin());
+      await user.keyboard('{PageUp}');
+      expect(spin()).toHaveValue('70');
+      await user.keyboard('{PageDown}{PageDown}');
+      expect(spin()).toHaveValue('30');
+      unmount();
+      render(<Quantity defaultValue={30} step={2} largeStep={4} />);
+      await user.click(spin());
+      await user.keyboard('{PageUp}');
+      expect(spin()).toHaveValue('34');
+    });
+
+    it('goes to min on Home and max on End when they exist', async () => {
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={5} min={1} max={9} />);
+      await user.click(spin());
+      await user.keyboard('{Home}');
+      expect(spin()).toHaveValue('1');
+      await user.keyboard('{End}');
+      expect(spin()).toHaveValue('9');
+    });
+
+    it('leaves Home and End to the caret when there is no min or max', () => {
+      const onValueChange = vi.fn();
+      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
+      // `fireEvent` returns false when the default was prevented.
+      expect(fireEvent.keyDown(spin(), { key: 'Home' })).toBe(true);
+      expect(fireEvent.keyDown(spin(), { key: 'End' })).toBe(true);
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('starts from min going up and from max going down when the value is null', async () => {
+      const user = userEvent.setup();
+      const { unmount } = render(<Quantity min={3} max={8} />);
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}');
+      expect(spin()).toHaveValue('3');
+      unmount();
+      render(<Quantity min={3} max={8} />);
+      await user.click(spin());
+      await user.keyboard('{ArrowDown}');
+      expect(spin()).toHaveValue('8');
+    });
+
+    it('starts from 0 when the value is null and there is no min or max', async () => {
+      const user = userEvent.setup();
+      const { unmount } = render(<Quantity />);
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}');
+      expect(spin()).toHaveValue('0');
+      unmount();
+      render(<Quantity />);
+      await user.click(spin());
+      await user.keyboard('{ArrowDown}');
+      expect(spin()).toHaveValue('0');
+    });
+
+    it('commits the text being typed before it steps', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={1} onValueChange={onValueChange} />);
+      await user.click(spin());
+      await user.clear(spin());
+      await user.type(spin(), '20{ArrowUp}');
+      expect(spin()).toHaveValue('21');
+      expect(onValueChange).toHaveBeenNthCalledWith(1, 20);
+      expect(onValueChange).toHaveBeenNthCalledWith(2, 21);
+    });
+
+    it('leaves a key with Alt, Ctrl or Meta to the browser', () => {
+      const onValueChange = vi.fn();
+      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
+      for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
+        expect(fireEvent.keyDown(spin(), { key: 'ArrowUp', [modifier]: true })).toBe(true);
+      }
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('prevents the default of the arrow keys, so the caret does not jump', () => {
+      render(<Quantity defaultValue={5} />);
+      expect(fireEvent.keyDown(spin(), { key: 'ArrowUp' })).toBe(false);
+    });
+  });
+
+  describe('buttons', () => {
+    it('steps by a click that comes from assistive technology or the keyboard', () => {
+      const onValueChange = vi.fn();
+      render(<Quantity defaultValue={5} onValueChange={onValueChange} />);
+      // `fireEvent.click` has `detail` 0, as a click made by a screen reader has.
+      fireEvent.click(increase());
+      expect(spin()).toHaveValue('6');
+      fireEvent.click(decrease());
+      fireEvent.click(decrease());
+      expect(spin()).toHaveValue('4');
+      expect(onValueChange).toHaveBeenCalledTimes(3);
+    });
+
+    it('steps once for a press, and takes no focus', () => {
+      render(
+        <>
+          <input aria-label="Other" />
+          <Quantity defaultValue={5} />
+        </>,
+      );
+      screen.getByLabelText('Other').focus();
+      // `fireEvent` returns false when the default was prevented: the press does not take focus.
+      expect(fireEvent.pointerDown(increase(), { button: 0, isPrimary: true })).toBe(false);
+      fireEvent.pointerUp(increase());
+      expect(spin()).toHaveValue('6');
+      expect(screen.getByLabelText('Other')).toHaveFocus();
+    });
+
+    it('does not step again for the click that ends a press', () => {
+      render(<Quantity defaultValue={5} />);
+      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
+      fireEvent.pointerUp(increase());
+      fireEvent.click(increase(), { detail: 1 });
+      expect(spin()).toHaveValue('6');
+    });
+
+    it('repeats while pressed: after 400ms, then every 60ms, and stops on release', () => {
+      vi.useFakeTimers();
+      render(<Quantity defaultValue={0} />);
+      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
+      expect(spin()).toHaveValue('1');
+      act(() => void vi.advanceTimersByTime(399));
+      expect(spin()).toHaveValue('1');
+      act(() => void vi.advanceTimersByTime(1));
+      expect(spin()).toHaveValue('2');
+      act(() => void vi.advanceTimersByTime(60 * 3));
+      expect(spin()).toHaveValue('5');
+      fireEvent.pointerUp(increase());
+      act(() => void vi.advanceTimersByTime(1000));
+      expect(spin()).toHaveValue('5');
+    });
+
+    it('stops repeating at the limit, when the pointer leaves, and when it is cancelled', () => {
+      vi.useFakeTimers();
+      render(<Quantity defaultValue={0} max={3} />);
+      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
+      act(() => void vi.advanceTimersByTime(400 + 60 * 10));
+      expect(spin()).toHaveValue('3');
+      expect(increase()).toBeDisabled();
+      fireEvent.pointerUp(increase());
+
+      fireEvent.pointerDown(decrease(), { button: 0, isPrimary: true });
+      fireEvent.pointerLeave(decrease());
+      act(() => void vi.advanceTimersByTime(1000));
+      expect(spin()).toHaveValue('2');
+
+      fireEvent.pointerDown(decrease(), { button: 0, isPrimary: true });
+      fireEvent.pointerCancel(decrease());
+      act(() => void vi.advanceTimersByTime(1000));
+      expect(spin()).toHaveValue('1');
+    });
+
+    it('stops repeating when the component goes away', () => {
+      vi.useFakeTimers();
+      const onValueChange = vi.fn();
+      const { unmount } = render(<Quantity defaultValue={0} onValueChange={onValueChange} />);
+      fireEvent.pointerDown(increase(), { button: 0, isPrimary: true });
+      unmount();
+      act(() => void vi.advanceTimersByTime(1000));
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+    });
+
+    it('ignores a press that is not the primary button', () => {
+      render(<Quantity defaultValue={5} />);
+      fireEvent.pointerDown(increase(), { button: 2, isPrimary: true });
+      expect(spin()).toHaveValue('5');
+    });
+
+    it('disables the button at its limit, and both when the control is disabled or read only', () => {
+      const { rerender } = render(<Quantity value={0} min={0} max={5} />);
+      expect(decrease()).toBeDisabled();
+      expect(increase()).toBeEnabled();
+      rerender(<Quantity value={5} min={0} max={5} />);
+      expect(increase()).toBeDisabled();
+      expect(decrease()).toBeEnabled();
+      rerender(<Quantity value={2} disabled />);
+      expect(decrease()).toBeDisabled();
+      expect(increase()).toBeDisabled();
+      rerender(<Quantity value={2} readOnly />);
+      expect(decrease()).toBeDisabled();
+      expect(increase()).toBeDisabled();
+    });
+
+    it('leaves both buttons on when there is no value, even at a limit of 0', () => {
+      render(<Quantity value={null} min={0} max={0} />);
+      expect(decrease()).toBeEnabled();
+      expect(increase()).toBeEnabled();
+    });
+  });
+
+  describe('read only and disabled', () => {
+    it('blocks the step keys and the wheel when read only, and still shows the value', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={5} readOnly allowWheel onValueChange={onValueChange} />);
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}{PageUp}');
+      fireEvent.wheel(spin(), { deltaY: -100 });
+      expect(spin()).toHaveValue('5');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('sets data-disabled on the frame and disables the hidden input', () => {
+      const { container } = render(<Quantity name="qty" defaultValue={5} disabled />);
+      expect(container.firstElementChild).toHaveAttribute('data-disabled');
+      expect(spin()).toBeDisabled();
+      const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
+      expect(hidden).toBeDisabled();
+    });
+  });
+
+  describe('wheel', () => {
+    it('does nothing by default', async () => {
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={5} />);
+      await user.click(spin());
+      fireEvent.wheel(spin(), { deltaY: -100 });
+      expect(spin()).toHaveValue('5');
+    });
+
+    it('steps on the wheel when allowed and focused, and stops the page scrolling', async () => {
+      const user = userEvent.setup();
+      render(<Quantity defaultValue={5} allowWheel />);
+      // Not focused: the page scrolls as usual.
+      expect(fireEvent.wheel(spin(), { deltaY: -100 })).toBe(true);
+      expect(spin()).toHaveValue('5');
+      await user.click(spin());
+      expect(fireEvent.wheel(spin(), { deltaY: -100 })).toBe(false);
+      expect(spin()).toHaveValue('6');
+      fireEvent.wheel(spin(), { deltaY: 100 });
+      fireEvent.wheel(spin(), { deltaY: 100 });
+      expect(spin()).toHaveValue('4');
+    });
+  });
+
+  describe('controlled', () => {
+    it('shows the value it is given, and asks the parent for a change', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      render(<Quantity value={5} onValueChange={onValueChange} />);
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}');
+      expect(onValueChange).toHaveBeenCalledWith(6);
+      // The parent did not accept it.
+      expect(spin()).toHaveValue('5');
+    });
+
+    it('follows the parent, and does not report a change the parent made', () => {
+      const onValueChange = vi.fn();
+      const { rerender } = render(<Quantity value={5} onValueChange={onValueChange} />);
+      rerender(<Quantity value={8} onValueChange={onValueChange} />);
+      expect(spin()).toHaveValue('8');
+      rerender(<Quantity value={null} onValueChange={onValueChange} />);
+      expect(spin()).toHaveValue('');
+      expect(onValueChange).not.toHaveBeenCalled();
+    });
+
+    it('works with state in the parent', async () => {
+      function Parent() {
+        const [value, setValue] = useState<number | null>(1);
+        return <Quantity value={value} onValueChange={setValue} />;
+      }
+      const user = userEvent.setup();
+      render(<Parent />);
+      await user.click(spin());
+      await user.keyboard('{ArrowUp}{ArrowUp}');
+      expect(spin()).toHaveValue('3');
+      await user.clear(spin());
+      await user.tab();
+      expect(spin()).toHaveValue('');
+    });
+
+    it('warns when it changes between uncontrolled and controlled', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { rerender } = render(<Quantity defaultValue={1} />);
+      rerender(<Quantity value={1} />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('NumberInput'));
+    });
+  });
+
+  describe('forms', () => {
+    it('submits the raw number in the hidden input, and an empty string for null', async () => {
+      const user = userEvent.setup();
+      const { container } = render(
+        <form>
+          <Quantity name="qty" defaultValue={1234.5} />
+        </form>,
+      );
+      const form = container.querySelector('form') as HTMLFormElement;
+      expect(new FormData(form).get('qty')).toBe('1234.5');
+      await user.clear(spin());
+      await user.tab();
+      expect(new FormData(form).get('qty')).toBe('');
+    });
+
+    it('sends nothing without a name, and nothing when disabled', () => {
+      const { container, rerender } = render(
+        <form>
+          <Quantity defaultValue={5} />
+        </form>,
+      );
+      const form = container.querySelector('form') as HTMLFormElement;
+      expect(Array.from(new FormData(form).keys())).toEqual([]);
+      rerender(
+        <form>
+          <Quantity name="qty" defaultValue={5} disabled />
+        </form>,
+      );
+      expect(Array.from(new FormData(form).keys())).toEqual([]);
+    });
+
+    it('puts required on the visible input, which takes part in validation', () => {
+      const { container } = render(
+        <form>
+          <Quantity name="qty" required />
+        </form>,
+      );
+      expect(spin()).toBeRequired();
+      const form = container.querySelector('form') as HTMLFormElement;
+      expect(form.checkValidity()).toBe(false);
+    });
+
+    it('puts an uncontrolled value, and its text, back to the default on reset', async () => {
+      const onValueChange = vi.fn();
+      const user = userEvent.setup();
+      const { container } = render(
+        <form>
+          <Quantity name="qty" defaultValue={5} onValueChange={onValueChange} />
+          <button type="reset">Reset</button>
+        </form>,
+      );
+      await user.type(spin(), '9');
+      await user.tab();
+      expect(spin()).toHaveValue('59');
+      await user.click(screen.getByText('Reset'));
+      await settle();
+      expect(spin()).toHaveValue('5');
+      const form = container.querySelector('form') as HTMLFormElement;
+      expect(new FormData(form).get('qty')).toBe('5');
+      // A reset is not a change the user made: only the commit of the 9 was reported.
+      expect(onValueChange).toHaveBeenCalledTimes(1);
+    });
+
+    it('drops text that was typed but not committed on reset', async () => {
+      const user = userEvent.setup();
+      render(
+        <form>
+          <Quantity defaultValue={5} />
+          <button type="reset">Reset</button>
+        </form>,
+      );
+      await user.type(spin(), '99');
+      await user.click(screen.getByText('Reset'));
+      await settle();
+      expect(spin()).toHaveValue('5');
+    });
+
+    it('keeps a controlled value on reset', async () => {
+      const user = userEvent.setup();
+      render(
+        <form>
+          <Quantity name="qty" value={7} />
+          <button type="reset">Reset</button>
+        </form>,
+      );
+      await user.click(screen.getByText('Reset'));
+      await settle();
+      expect(spin()).toHaveValue('7');
+    });
+
+    it('does nothing when the reset is cancelled', async () => {
+      const user = userEvent.setup();
+      render(
+        <form onReset={(event) => event.preventDefault()}>
+          <Quantity defaultValue={5} />
+          <button type="reset">Reset</button>
+        </form>,
+      );
+      await user.type(spin(), '9');
+      await user.tab();
+      await user.click(screen.getByText('Reset'));
+      await settle();
+      expect(spin()).toHaveValue('59');
+    });
+  });
+
+  describe('Field', () => {
+    it('is labelled by the Field, takes its description and error, and its required', () => {
+      render(
+        <Field label="Quantity" description="Between 1 and 10" error="Too many" required>
+          <NumberInput name="qty" />
+        </Field>,
+      );
+      const input = screen.getByRole('spinbutton', { name: /Quantity/ });
+      expect(input).toBeRequired();
+      expect(input).toHaveAccessibleDescription('Between 1 and 10 Too many');
+      expect(input).toHaveAttribute('aria-invalid', 'true');
+      expect(input.closest('.flg-number-input')).toHaveAttribute('data-invalid');
+    });
+
+    it('takes disabled from the Field', () => {
+      render(
+        <Field label="Quantity" disabled>
+          <NumberInput name="qty" />
+        </Field>,
+      );
+      expect(spin()).toBeDisabled();
+      expect(increase()).toBeDisabled();
+    });
+
+    it('marks itself invalid without a Field', () => {
+      const { container } = render(<Quantity invalid />);
+      expect(container.firstElementChild).toHaveAttribute('data-invalid');
+      expect(spin()).toHaveAttribute('aria-invalid', 'true');
+    });
+  });
+
+  describe('development warnings', () => {
+    it('warns when min is greater than max', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Quantity min={5} max={1} />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('min'));
+    });
+
+    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
+      'warns about a step of %s, and uses 1',
+      async (step) => {
+        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+        const user = userEvent.setup();
+        render(<Quantity defaultValue={5} step={step} />);
+        expect(warn).toHaveBeenCalledWith(expect.stringContaining('step'));
+        await user.click(spin());
+        await user.keyboard('{ArrowUp}');
+        expect(spin()).toHaveValue('6');
+      },
+    );
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 342fe34..bba77d1 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -58,6 +58,7 @@ describe('public API', () => {
       'MenuSub',
       'MenuSubContent',
       'MenuSubTrigger',
+      'NumberInput',
       'Pagination',
       'Popover',
       'PopoverClose',
diff --git a/src/internal/number.test.ts b/src/internal/number.test.ts
new file mode 100644
index 0000000..b1067ed
--- /dev/null
+++ b/src/internal/number.test.ts
@@ -0,0 +1,153 @@
+import { describe, expect, it } from 'vitest';
+import { clamp, decimalsOf, formatNumber, parseNumber, snapToStep, stepFrom } from './number';
+
+describe('clamp', () => {
+  it('clamps a value below min up to min', () => {
+    expect(clamp(-5, 0, 10)).toBe(0);
+  });
+
+  it('clamps a value above max down to max', () => {
+    expect(clamp(15, 0, 10)).toBe(10);
+  });
+
+  it('leaves an in-range value unchanged', () => {
+    expect(clamp(4, 0, 10)).toBe(4);
+  });
+});
+
+describe('decimalsOf', () => {
+  it('counts decimal places', () => {
+    expect(decimalsOf(0.1)).toBe(1);
+    expect(decimalsOf(0.05)).toBe(2);
+    expect(decimalsOf(5)).toBe(0);
+    expect(decimalsOf(1.234)).toBe(3);
+  });
+});
+
+describe('snapToStep', () => {
+  it('rounds 0.1 + 0.2 to 0.3 on a step of 0.1 from min 0', () => {
+    expect(snapToStep(0.1 + 0.2, 0.1, 0)).toBe(0.3);
+  });
+
+  it('snaps to the grid min + k*step using the larger decimal count', () => {
+    expect(snapToStep(0.3, 0.1, 0.05)).toBe(0.35);
+  });
+
+  it('snaps an arbitrary value to the nearest step', () => {
+    expect(snapToStep(7, 5, 0)).toBe(5);
+  });
+});
+
+describe('stepFrom', () => {
+  it('steps up from 7 with step 5 to 10, not 12', () => {
+    expect(stepFrom(7, 5, 0, 'up')).toBe(10);
+  });
+
+  it('steps down from 7 with step 5 to 5', () => {
+    expect(stepFrom(7, 5, 0, 'down')).toBe(5);
+  });
+
+  it('steps up from an on-grid value to the next grid value', () => {
+    expect(stepFrom(5, 5, 0, 'up')).toBe(10);
+  });
+
+  it('steps down from an on-grid value to the previous grid value', () => {
+    expect(stepFrom(5, 5, 0, 'down')).toBe(0);
+  });
+
+  it('steps up from 10 with step 5 to 15', () => {
+    expect(stepFrom(10, 5, 0, 'up')).toBe(15);
+  });
+
+  it('steps up with decimals', () => {
+    expect(stepFrom(0.25, 0.1, 0, 'up')).toBe(0.3);
+  });
+});
+
+describe('formatNumber', () => {
+  it('formats en-US with group and decimal separators', () => {
+    expect(formatNumber(1234.5, 'en-US')).toContain('1,234.5');
+  });
+
+  it('formats vi-VN with swapped separators', () => {
+    const out = formatNumber(1234.5, 'vi-VN');
+    expect(out).toContain('1.234,5');
+  });
+
+  it('formats de-DE with swapped separators', () => {
+    const out = formatNumber(1234.5, 'de-DE');
+    expect(out).toContain('1.234,5');
+  });
+
+  it('formats percent', () => {
+    expect(formatNumber(0.5, 'en-US', { style: 'percent' })).toContain('50');
+  });
+
+  it('formats currency', () => {
+    const out = formatNumber(1234.5, 'en-US', { style: 'currency', currency: 'USD' });
+    expect(out).toContain('1,234.50');
+  });
+});
+
+describe('parseNumber', () => {
+  it('parses en-US formatted text', () => {
+    expect(parseNumber('1,234.5', 'en-US')).toBe(1234.5);
+  });
+
+  it('parses vi-VN formatted text with swapped separators', () => {
+    expect(parseNumber('1.234,5', 'vi-VN')).toBe(1234.5);
+  });
+
+  it('parses de-DE formatted text with swapped separators', () => {
+    expect(parseNumber('1.234,5', 'de-DE')).toBe(1234.5);
+  });
+
+  it('parses percent text back through format options', () => {
+    const text = formatNumber(0.5, 'en-US', { style: 'percent' });
+    expect(parseNumber(text, 'en-US', { style: 'percent' })).toBe(0.5);
+  });
+
+  it('parses currency text back through format options', () => {
+    const text = formatNumber(1234.5, 'en-US', { style: 'currency', currency: 'USD' });
+    expect(parseNumber(text, 'en-US', { style: 'currency', currency: 'USD' })).toBe(1234.5);
+  });
+
+  it('returns NaN for garbage', () => {
+    expect(parseNumber('not a number', 'en-US')).toBeNaN();
+  });
+
+  it('returns NaN for embedded letters', () => {
+    expect(parseNumber('1a2', 'en-US')).toBeNaN();
+  });
+
+  it('returns NaN for trailing letters', () => {
+    expect(parseNumber('12abc', 'en-US')).toBeNaN();
+  });
+
+  it('returns NaN for multiple decimal separators', () => {
+    expect(parseNumber('1.2.3', 'en-US')).toBeNaN();
+  });
+
+  it('handles NBSP and NNBSP whitespace', () => {
+    expect(parseNumber('1\u00A0234,5'.replace(',', '.'), 'en-US')).not.toBeNaN();
+  });
+
+  it('parses NNBSP-separated vi-VN text', () => {
+    expect(parseNumber('1\u202F234,5', 'vi-VN')).toBe(1234.5);
+  });
+
+  it('parses de-DE percent text with a space', () => {
+    expect(parseNumber('12,5 %', 'de-DE', { style: 'percent' })).toBe(0.125);
+  });
+
+  it('parses en-US currency text', () => {
+    expect(parseNumber('$1,234.50', 'en-US', { style: 'currency', currency: 'USD' })).toBe(1234.5);
+  });
+});
+
+describe('round trip', () => {
+  it('parseNumber(formatNumber(x)) === x for decimals', () => {
+    const x = 1234.567;
+    expect(parseNumber(formatNumber(x, 'en-US'), 'en-US')).toBe(x);
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/number.test.ts src/components/number-input src/index.test.ts
```

Expected: FAIL, `Failed to resolve import "./number"` và `"./NumberInput"`; `src/index.test.ts` fail vì `NumberInput` chưa export. Ở bản nháp, `number.ts` được viết hai vòng (vòng đầu để `parseNumber('1a2')` ra 12, vòng sửa thêm `returns NaN for embedded letters` với lỗi `+ 12`, và `parses de-DE percent text with a space` với `expected 1.25 to be 0.125`). Các test `stepFrom` là test đặc tả cho phép tính. Test kiểu `NumberInput.test-d.ts` viết với props thật, cũng là test đặc tả.

- [ ] **Step 3: Viết code**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index bc52e1f..6578946 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -59,6 +59,7 @@ const SHIPPED_CLASSES = [
   'flg-segmented-item',
   'flg-segmented-input',
   'flg-segmented-label',
+  'flg-number-input',
   'flg-accordion',
   'flg-accordion-item',
   'flg-accordion-trigger',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index e2273fd..7451daf 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -24,6 +24,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/tabs/Tabs.tsx',
   'src/components/segmented-control/SegmentedControl.tsx',
   'src/components/segmented-control/SegmentedControlItem.tsx',
+  'src/components/number-input/NumberInput.tsx',
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
   'src/components/toast/toast.ts',
diff --git a/src/components/number-input/NumberInput.mdx b/src/components/number-input/NumberInput.mdx
new file mode 100644
index 0000000..26049fa
--- /dev/null
+++ b/src/components/number-input/NumberInput.mdx
@@ -0,0 +1,102 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './NumberInput.stories';
+
+<Meta of={Stories} />
+
+# NumberInput
+
+```tsx
+import { Field, NumberInput } from 'fl-glass-ui';
+
+<Field label="Quantity" description="From 1 to 10">
+  <NumberInput name="quantity" defaultValue={3} min={1} max={10} />
+</Field>;
+```
+
+<Canvas of={Stories.Look} />
+<Controls />
+
+## Typing, steps and the value
+
+The user types freely: the field keeps whatever is typed, and `onChange` sees each key. The text is
+read only when the field loses focus or on Enter. Then it is read in the locale, clamped to `min` and
+`max`, rounded onto the grid of `step` (which starts at `min`, or at 0) and written again in the
+locale's format. An empty field is `null`. Text that cannot be read goes back to the old text, and the
+value does not change. `onValueChange` is called with the settled value, never for a key typed.
+
+- **↑ and ↓** step along the grid: from 7 with `step={5}`, up goes to 10, not to 12.
+- **PageUp and PageDown** move `largeStep` (ten steps by default), rounded onto the grid.
+- **Home and End** go to `min` and `max` when there are any; otherwise they move the caret.
+- From no value, up goes to `min` (or 0) and down to `max` (or 0).
+- Text that is still being typed is settled before a step. A key with Alt, Ctrl or Meta is left to
+  the browser.
+
+The − and + buttons step the same way. Hold one down and it repeats, after 400ms and then every
+60ms, until it is released or the value reaches its limit. A press does not take focus, so the cursor
+stays in the field if it was there. The buttons are not in the Tab order, because the arrow keys do
+their work.
+
+The mouse wheel does nothing unless you set `allowWheel`. Then it steps the value while the field
+has focus, and the page does not scroll.
+
+<Canvas of={Stories.Typing} />
+<Canvas of={Stories.PressAndHold} />
+
+## Locale and format
+
+`locale` (default `"en-US"`, fixed so that the server and the client write the same text) decides
+the separators of the text shown and read. `formatOptions` takes the options of `Intl.NumberFormat`:
+a currency, a percentage or a unit. What the field writes it can read back.
+
+```tsx
+<NumberInput locale="vi-VN" defaultValue={1234.5} step={0.1} />
+<NumberInput formatOptions={{ style: 'currency', currency: 'USD' }} step={0.01} />
+<NumberInput formatOptions={{ style: 'percent' }} step={0.01} min={0} max={1} />
+```
+
+Without `formatOptions` the field shows up to three decimals, or as many as `step` has when that is
+more. The value is a plain number, and `min`, `max` and `step` are in that number: a percentage of
+`0.5` shows as `50%` and wants a `step` of `0.01`. It is not an input mask: for phone numbers or
+partly typed currency use an Input.
+
+## In a Field
+
+Placed directly inside a `Field`, the input takes its label, description, error, `required` and
+`disabled` from the Field. `ref`, `id`, `required`, `readOnly` and the `aria-*` props go on the
+visible input.
+
+<Canvas of={Stories.InAField} />
+<Canvas of={Stories.Invalid} />
+
+## Forms
+
+The visible input has no `name`. A hidden input with `name` carries the plain number (`1234.5`, not
+`1,234.5`) and is empty for `null`, so `FormData` does not depend on the locale. `required` is on the
+visible input, which takes part in the browser's validation. Enter settles the typed text and then the
+form submits that value. A form reset puts an uncontrolled field back to its `defaultValue` and drops
+text that was typed but not settled; a controlled one keeps the value it is given. A `disabled` field
+sends nothing.
+
+<Canvas of={Stories.Keys} />
+
+## Accessibility
+
+- The visible input is a text input with `role="spinbutton"`, `aria-valuenow` (when there is a
+  value), `aria-valuemin`, `aria-valuemax` and `aria-valuetext`, which is the text as formatted.
+- The buttons are named by `labels` (`Increase` and `Decrease` by default); translate them. They are
+  skipped by Tab, because the keys already do what they do, and a screen reader's own cursor can
+  still activate them.
+- `inputMode` is `"decimal"` when `min` is not negative and `"text"` otherwise, because the decimal
+  keyboard of iOS has no minus sign. Pass `inputMode` to set it yourself.
+- With `readOnly`, typing, the step keys, the wheel and both buttons are off.
+- In forced-colors mode the − and + are drawn in `ButtonText` (`GrayText` when disabled) and the
+  lines that separate them from the text in `CanvasText`.
+
+## Do and don't
+
+- Do set `min`, `max` and `step` when the number has limits: the field then fixes what is typed.
+- Do show the unit, or the allowed range, in the label or the description.
+- Don't use it for a number the user will not type or step, such as a phone number or an identifier;
+  use an Input with `inputMode`.
+- Don't leave `allowWheel` on in a long scrolling form: a wheel that lands on a focused field changes
+  the value.
diff --git a/src/components/number-input/NumberInput.tsx b/src/components/number-input/NumberInput.tsx
new file mode 100644
index 0000000..003703c
--- /dev/null
+++ b/src/components/number-input/NumberInput.tsx
@@ -0,0 +1,335 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
+import type { ChangeEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { dataAttr } from '../../internal/data-attr';
+import { markAsFieldControl, useFieldProps } from '../../internal/field-context';
+import { MinusIcon, PlusIcon } from '../../internal/icons';
+import { mergeRefs } from '../../internal/merge-refs';
+import {
+  clamp,
+  decimalsOf,
+  formatNumber,
+  parseNumber,
+  snapToStep,
+  stepFrom,
+} from '../../internal/number';
+import { hasModifier } from '../../internal/roving';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useFormReset } from '../../internal/use-form-reset';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+import { devWarn } from '../../internal/warn';
+import { usePressRepeat } from './use-press-repeat';
+
+export interface NumberInputProps extends Omit<
+  InputHTMLAttributes<HTMLInputElement>,
+  'type' | 'value' | 'defaultValue' | 'size' | 'min' | 'max' | 'step'
+> {
+  /** The value, for a controlled input. `null` is no value; leave it `undefined` for an uncontrolled one. */
+  value?: number | null;
+  /** The value at first, for an uncontrolled input. */
+  defaultValue?: number;
+  /** Called with the value the user settles on: after a blur or Enter, a step key, a −/+ press or the wheel. Not for each key typed. */
+  onValueChange?: (value: number | null) => void;
+  min?: number;
+  max?: number;
+  /** The grid of values, which starts at `min` (or 0). Default 1. */
+  step?: number;
+  /** What PageUp and PageDown move by. Default ten times `step`. */
+  largeStep?: number;
+  /** BCP 47 locale of the text shown and read. Default `"en-US"`. */
+  locale?: string;
+  /** Options of `Intl.NumberFormat`, for a percentage, a currency or a unit. */
+  formatOptions?: Intl.NumberFormatOptions;
+  /** Lets the wheel step the value while the field has focus. Default false. */
+  allowWheel?: boolean;
+  size?: 'sm' | 'md' | 'lg';
+  /** Marks the value as wrong. Inside a Field with an error this is already true. */
+  invalid?: boolean;
+  /** The names of the buttons. Defaults `{ increment: "Increase", decrement: "Decrease" }`. */
+  labels?: { increment?: string; decrement?: string };
+}
+
+const DEFAULT_LABELS = { increment: 'Increase', decrement: 'Decrease' };
+
+const isNumber = (n: number | undefined): n is number =>
+  typeof n === 'number' && Number.isFinite(n);
+
+/**
+ * A number field with a − button at the left end and a + button at the right end. The user types
+ * freely and the text is read when the field loses focus or on Enter; the arrow keys, the buttons
+ * (which repeat while held) and, if allowed, the wheel step along the grid of `step`. The value the
+ * form receives is a hidden input with the plain number. `className` and `style` go on the frame,
+ * `name` on the hidden input, every other prop on the visible input.
+ */
+export const NumberInput = markAsFieldControl(
+  forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
+    {
+      value,
+      defaultValue,
+      onValueChange,
+      min: minProp,
+      max: maxProp,
+      step: stepProp,
+      largeStep: largeStepProp,
+      locale = 'en-US',
+      formatOptions,
+      allowWheel = false,
+      size = 'md',
+      labels,
+      name,
+      className,
+      style,
+      inputMode,
+      onChange,
+      onKeyDown,
+      onBlur,
+      ...props
+    },
+    ref,
+  ) {
+    const { invalid, disabled, readOnly, ...inputProps } = useFieldProps(props);
+    const inactive = Boolean(disabled || readOnly);
+
+    const min = isNumber(minProp) ? minProp : undefined;
+    const max = isNumber(maxProp) ? maxProp : undefined;
+    const step = isNumber(stepProp) && stepProp > 0 ? stepProp : 1;
+    const largeStep = isNumber(largeStepProp) && largeStepProp > 0 ? largeStepProp : 10 * step;
+    useEffect(() => {
+      if (min !== undefined && max !== undefined && min > max) {
+        devWarn(`NumberInput: min (${min}) is greater than max (${max}).`);
+      }
+    }, [min, max]);
+    useEffect(() => {
+      if (stepProp !== undefined && step !== stepProp) {
+        devWarn(`NumberInput: step must be a positive finite number, not ${stepProp}; using 1.`);
+      }
+    }, [stepProp, step]);
+
+    const low = min ?? Number.NEGATIVE_INFINITY;
+    const high = max ?? Number.POSITIVE_INFINITY;
+    // The grid of the steps starts at min, or at 0 when there is none.
+    const origin = min ?? 0;
+    const options = useMemo<Intl.NumberFormatOptions>(
+      () => formatOptions ?? { maximumFractionDigits: Math.max(3, decimalsOf(step)) },
+      [formatOptions, step],
+    );
+
+    // Puts a number onto the grid, inside the range.
+    const fit = (n: number) => {
+      let fitted = snapToStep(clamp(n, low, high), step, origin);
+      // Rounding may land one step past an end that is not on the grid.
+      if (fitted > high) fitted = stepFrom(fitted, step, origin, 'down');
+      if (fitted < low) fitted = stepFrom(fitted, step, origin, 'up');
+      return clamp(fitted, low, high);
+    };
+
+    const [current, setValue, resetValue] = useControllableState<number | null>({
+      value,
+      defaultValue: defaultValue ?? null,
+      onChange: onValueChange,
+      name: 'NumberInput value',
+    });
+    // What is shown for a value the parent gave that is not usable or outside the range: the
+    // nearest usable one. The parent is not told; it still has what it passed.
+    const shown = current === null || !Number.isFinite(current) ? null : clamp(current, low, high);
+    useEffect(() => {
+      if (current !== null && shown !== current) {
+        devWarn(
+          `NumberInput value ${current} is outside the range or not a number; showing ` +
+            `${shown === null ? 'nothing' : shown}.`,
+        );
+      }
+    }, [current, shown]);
+
+    // The text the user has typed and not settled yet, or null while the text is the formatted value.
+    const [draft, setDraft] = useState<string | null>(null);
+    const text = draft ?? (shown === null ? '' : formatNumber(shown, locale, options));
+
+    const inputRef = useRef<HTMLInputElement>(null);
+    const hiddenRef = useRef<HTMLInputElement>(null);
+    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);
+    const defaultRef = useRef(defaultValue);
+    useWriteOnCommit(() => {
+      defaultRef.current = defaultValue;
+    });
+    // The form resets the visible input behind React's back; put the value and the text back.
+    useFormReset(inputRef, () => {
+      resetValue(defaultRef.current ?? null);
+      setDraft(null);
+    });
+
+    // Reads the typed text: a number on the grid, null for an empty field, undefined when the text
+    // cannot be read.
+    const read = (typed: string): number | null | undefined => {
+      if (typed.trim() === '') return null;
+      const parsed = parseNumber(typed, locale, options);
+      return Number.isNaN(parsed) ? undefined : fit(parsed);
+    };
+
+    // What the field holds right now. A held button steps faster than React renders, and a second
+    // step must start from the first one's result, so the steps read this ref, which the commit
+    // writes and which a step updates itself.
+    const live = useRef({ shown, draft });
+    useWriteOnCommit(() => {
+      live.current = { shown, draft };
+    });
+    const apply = (next: number | null) => {
+      live.current = { shown: value === undefined ? next : live.current.shown, draft: null };
+      setDraft(null);
+      setValue(next);
+    };
+
+    // Settles the typed text, if there is any, and returns the value the field has after that.
+    const settle = (): number | null => {
+      const { shown: before, draft: typed } = live.current;
+      if (typed === null) return before;
+      const settled = read(typed);
+      if (settled === undefined) {
+        live.current = { shown: before, draft: null };
+        setDraft(null);
+        return before;
+      }
+      apply(settled);
+      return settled;
+    };
+
+    // Moves the value one step (or a large one) up or down. Returns whether a further step in the
+    // same direction is possible, which the press-and-hold repeat asks.
+    const stepBy = (direction: 1 | -1, large = false): boolean => {
+      const from = settle();
+      let next: number;
+      if (from === null) next = direction === 1 ? (min ?? 0) : (max ?? 0);
+      else if (large) next = snapToStep(from + direction * largeStep, step, origin);
+      else next = stepFrom(from, step, origin, direction === 1 ? 'up' : 'down');
+      next = clamp(next, low, high);
+      apply(next);
+      return direction === 1 ? next < high : next > low;
+    };
+    const goTo = (target: number) => apply(fit(target));
+
+    const decrement = usePressRepeat(() => stepBy(-1));
+    const increment = usePressRepeat(() => stepBy(1));
+
+    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
+      if (hasModifier(event)) return;
+      if (event.key === 'Enter') {
+        // The form submits right after this keydown, perhaps before React has rendered the new value
+        // into the hidden input, so the value goes there now.
+        const settled = settle();
+        if (hiddenRef.current) hiddenRef.current.value = settled === null ? '' : String(settled);
+        return;
+      }
+      if (inactive) return;
+      switch (event.key) {
+        case 'ArrowUp':
+          stepBy(1);
+          break;
+        case 'ArrowDown':
+          stepBy(-1);
+          break;
+        case 'PageUp':
+          stepBy(1, true);
+          break;
+        case 'PageDown':
+          stepBy(-1, true);
+          break;
+        case 'Home':
+          // Without a min the key moves the caret, as in any text field.
+          if (min === undefined) return;
+          goTo(min);
+          break;
+        case 'End':
+          if (max === undefined) return;
+          goTo(max);
+          break;
+        default:
+          return;
+      }
+      event.preventDefault();
+    };
+
+    // React attaches `wheel` as a passive listener, which cannot stop the page from scrolling.
+    const wheelStep = useRef(stepBy);
+    useWriteOnCommit(() => {
+      wheelStep.current = stepBy;
+    });
+    useEffect(() => {
+      const input = inputRef.current;
+      if (!allowWheel || !input) return;
+      const onWheel = (event: WheelEvent) => {
+        if (document.activeElement !== input || input.disabled || input.readOnly) return;
+        if (event.deltaY === 0) return;
+        event.preventDefault();
+        wheelStep.current(event.deltaY < 0 ? 1 : -1);
+      };
+      input.addEventListener('wheel', onWheel, { passive: false });
+      return () => input.removeEventListener('wheel', onWheel);
+    }, [allowWheel]);
+
+    const { increment: incrementLabel, decrement: decrementLabel } = {
+      ...DEFAULT_LABELS,
+      ...labels,
+    };
+    const buttonProps = { type: 'button', tabIndex: -1 } as const;
+    return (
+      <div
+        className={clsx('flg-input', 'flg-number-input', className)}
+        style={style}
+        data-size={size}
+        data-invalid={dataAttr(invalid)}
+        data-disabled={dataAttr(disabled)}
+      >
+        <button
+          {...buttonProps}
+          aria-label={decrementLabel}
+          disabled={inactive || (shown !== null && shown <= low)}
+          {...decrement}
+        >
+          <MinusIcon />
+        </button>
+        <input
+          autoComplete="off"
+          {...inputProps}
+          ref={mergedRef}
+          type="text"
+          role="spinbutton"
+          inputMode={inputMode ?? (min !== undefined && min >= 0 ? 'decimal' : 'text')}
+          disabled={disabled}
+          readOnly={readOnly}
+          value={text}
+          aria-valuenow={shown ?? undefined}
+          aria-valuemin={min}
+          aria-valuemax={max}
+          aria-valuetext={shown === null ? undefined : formatNumber(shown, locale, options)}
+          onChange={composeEventHandlers(onChange, (event: ChangeEvent<HTMLInputElement>) =>
+            setDraft(event.target.value),
+          )}
+          onKeyDown={composeEventHandlers(onKeyDown, handleKeyDown)}
+          onBlur={composeEventHandlers(onBlur, () => {
+            settle();
+          })}
+        />
+        <button
+          {...buttonProps}
+          aria-label={incrementLabel}
+          disabled={inactive || (shown !== null && shown >= high)}
+          {...increment}
+        >
+          <PlusIcon />
+        </button>
+        {name === undefined ? null : (
+          <input
+            ref={hiddenRef}
+            type="hidden"
+            name={name}
+            value={shown === null ? '' : String(shown)}
+            disabled={disabled}
+          />
+        )}
+      </div>
+    );
+  }),
+);
diff --git a/src/components/number-input/index.ts b/src/components/number-input/index.ts
new file mode 100644
index 0000000..ff265ef
--- /dev/null
+++ b/src/components/number-input/index.ts
@@ -0,0 +1,2 @@
+export { NumberInput } from './NumberInput';
+export type { NumberInputProps } from './NumberInput';
diff --git a/src/components/number-input/use-press-repeat.ts b/src/components/number-input/use-press-repeat.ts
new file mode 100644
index 0000000..814d357
--- /dev/null
+++ b/src/components/number-input/use-press-repeat.ts
@@ -0,0 +1,66 @@
+import { useCallback, useEffect, useRef } from 'react';
+import type { MouseEvent, PointerEvent } from 'react';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+
+/** How long a press waits before it starts to repeat, and then how often it repeats. */
+const FIRST_DELAY = 400;
+const REPEAT_DELAY = 60;
+
+/** The handlers a −/+ button needs. */
+export interface PressRepeatHandlers {
+  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
+  onPointerUp: () => void;
+  onPointerCancel: () => void;
+  onPointerLeave: () => void;
+  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
+}
+
+/**
+ * Press and hold for a step button: `step` runs once at once on the press, then again after 400ms
+ * and every 60ms, until the pointer is released, leaves the button or is cancelled, the component
+ * goes away, or `step` returns false (it has reached its limit). `step` returns whether another
+ * step is possible, and the latest one given is the one that runs.
+ *
+ * The press does not take focus (`preventDefault` on `pointerdown`), so the focus stays where it was.
+ * A click that did not come from a pointer (`detail` 0: a screen reader or a switch activating the
+ * button) steps once; the click that ends a pointer press does not step a second time.
+ */
+export function usePressRepeat(step: () => boolean): PressRepeatHandlers {
+  const latest = useRef(step);
+  useWriteOnCommit(() => {
+    latest.current = step;
+  });
+  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
+
+  const stop = useCallback(() => {
+    clearTimeout(timer.current);
+    timer.current = undefined;
+  }, []);
+  useEffect(() => stop, [stop]);
+
+  const schedule = useCallback(
+    (delay: number) => {
+      timer.current = setTimeout(() => {
+        if (latest.current()) schedule(REPEAT_DELAY);
+        else stop();
+      }, delay);
+    },
+    [stop],
+  );
+
+  return {
+    onPointerDown: (event) => {
+      // Only the main button; a pointer event made without one (a test, an old engine) has none.
+      if (event.button > 0 || event.isPrimary === false) return;
+      event.preventDefault();
+      stop();
+      if (latest.current()) schedule(FIRST_DELAY);
+    },
+    onPointerUp: stop,
+    onPointerCancel: stop,
+    onPointerLeave: stop,
+    onClick: (event) => {
+      if (event.detail === 0) latest.current();
+    },
+  };
+}
diff --git a/src/index.ts b/src/index.ts
index 32d60d4..e451107 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -149,6 +149,8 @@ export type {
   TabsVariant,
 } from './components/tabs';
 export { SegmentedControl, SegmentedControlItem } from './components/segmented-control';
+export { NumberInput } from './components/number-input';
+export type { NumberInputProps } from './components/number-input';
 export type {
   SegmentedControlItemProps,
   SegmentedControlProps,
diff --git a/src/internal/number.ts b/src/internal/number.ts
new file mode 100644
index 0000000..19eb916
--- /dev/null
+++ b/src/internal/number.ts
@@ -0,0 +1,179 @@
+/** Pure number helpers shared by NumberInput and Slider (and any future numeric control). */
+
+const formatCache = new Map<string, Intl.NumberFormat>();
+
+function cacheKey(locale: string, options: Intl.NumberFormatOptions | undefined): string {
+  return `${locale}\u0001${JSON.stringify(options ?? null)}`;
+}
+
+function getFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
+  const key = cacheKey(locale, options);
+  let formatter = formatCache.get(key);
+  if (!formatter) {
+    formatter = new Intl.NumberFormat(locale, options);
+    formatCache.set(key, formatter);
+  }
+  return formatter;
+}
+
+/** Clamp `value` to the inclusive range `[min, max]`. */
+export function clamp(value: number, min: number, max: number): number {
+  return Math.min(Math.max(value, min), max);
+}
+
+/** Count the decimal places in the shortest decimal representation of `n`. */
+export function decimalsOf(n: number): number {
+  if (!Number.isFinite(n)) return 0;
+  const text = n.toString();
+  if (text.includes('e') || text.includes('E')) {
+    // Fall back to a fixed representation for very large/small numbers.
+    const fixed = n.toFixed(20);
+    const trimmed = fixed.replace(/0+$/, '');
+    const dot = trimmed.indexOf('.');
+    return dot === -1 ? 0 : trimmed.length - dot - 1;
+  }
+  const dot = text.indexOf('.');
+  return dot === -1 ? 0 : text.length - dot - 1;
+}
+
+/** Round `value` onto the grid `min + k*step`, using the larger decimal count of `step` and `min`. */
+export function snapToStep(value: number, step: number, min: number): number {
+  if (!Number.isFinite(value) || !Number.isFinite(step) || step === 0 || !Number.isFinite(min)) {
+    return value;
+  }
+  const decimals = Math.max(decimalsOf(step), decimalsOf(min));
+  const k = Math.round((value - min) / step);
+  const raw = min + k * step;
+  return decimals > 0 ? Number(raw.toFixed(decimals)) : raw;
+}
+
+/** Direction of a step: `'up'` moves to the next grid value, `'down'` to the previous one. */
+export type StepDirection = 'up' | 'down';
+
+/** Move one step along the grid `min + k*step` in the given direction. */
+export function stepFrom(
+  value: number,
+  step: number,
+  min: number,
+  direction: StepDirection,
+): number {
+  if (!Number.isFinite(value) || !Number.isFinite(step) || step === 0 || !Number.isFinite(min)) {
+    return value;
+  }
+  const up = direction === 'up';
+  const decimals = Math.max(decimalsOf(step), decimalsOf(min));
+  const ratio = (value - min) / step;
+  const k = up ? Math.floor(ratio) + 1 : Math.ceil(ratio) - 1;
+  const raw = min + k * step;
+  return decimals > 0 ? Number(raw.toFixed(decimals)) : raw;
+}
+
+/** Format a number with a cached `Intl.NumberFormat`. */
+export function formatNumber(
+  value: number,
+  locale: string,
+  options?: Intl.NumberFormatOptions,
+): string {
+  if (value === undefined) return '';
+  return getFormatter(locale, options).format(value);
+}
+
+/** Parts a formatter adds around the digits: currency, percent sign, unit, group, literal text. */
+const NUMBER_PARTS = new Set([
+  'integer',
+  'fraction',
+  'decimal',
+  'minusSign',
+  'plusSign',
+  'exponentInteger',
+  'exponentMinusSign',
+  'exponentSeparator',
+]);
+function literalParts(parts: Intl.NumberFormatPart[]): string[] {
+  return parts
+    .filter((part) => !NUMBER_PARTS.has(part.type) && part.value !== '')
+    .map((part) => part.value);
+}
+
+/** Parse a (possibly formatted) number back to a `number`, or `NaN` when unreadable. */
+export function parseNumber(
+  text: string,
+  locale: string,
+  options?: Intl.NumberFormatOptions,
+): number {
+  const trimmed = text.trim();
+  if (trimmed === '') return NaN;
+
+  const formatter = getFormatter(locale, options);
+  const parts = formatter.formatToParts(12345.6789);
+  let groupSeparator = '';
+  let decimalSeparator = '';
+  for (const part of parts) {
+    if (part.type === 'group' && !groupSeparator) groupSeparator = part.value;
+    else if (part.type === 'decimal' && !decimalSeparator) decimalSeparator = part.value;
+  }
+
+  // Fall back to the locale's plain formatter when the (possibly styled) one
+  // does not emit a decimal separator, e.g. percent with zero fraction digits.
+  if (!decimalSeparator) {
+    const plainParts = getFormatter(locale).formatToParts(1.5);
+    for (const part of plainParts) {
+      if (part.type === 'decimal') decimalSeparator = part.value;
+      else if (part.type === 'group' && !groupSeparator) groupSeparator = part.value;
+    }
+  }
+  if (!decimalSeparator) decimalSeparator = '.';
+
+  // Collect the literal fragments this formatter emits (currency, percent sign,
+  // unit, literal spacing, ...) so they can be stripped. Anything not in this
+  // list, not whitespace, and not the group separator survives and makes the
+  // result NaN.
+  const removable = [
+    ...new Set([
+      ...literalParts(parts),
+      ...literalParts(getFormatter(locale).formatToParts(12345.6789)),
+    ]),
+  ];
+
+  // Normalise minus signs.
+  let working = trimmed.replace(/\u2212/g, '-');
+
+  // Remove whitespace (space, NBSP, NNBSP and other Unicode spaces).
+  working = working.replace(/[\s\u00A0\u202F]/g, '');
+
+  // Remove the locale's group separator.
+  if (groupSeparator) {
+    working = working.split(groupSeparator).join('');
+  }
+
+  // Remove the fragments the formatter itself produces.
+  for (const fragment of removable.sort((a, b) => b.length - a.length)) {
+    working = working.split(fragment).join('');
+  }
+
+  if (working === '' || working === '-' || working === '+' || working === decimalSeparator) {
+    return NaN;
+  }
+
+  // Replace the locale decimal separator with a dot.
+  if (decimalSeparator !== '.') {
+    const idx = working.indexOf(decimalSeparator);
+    if (idx !== -1) {
+      working = working.slice(0, idx) + '.' + working.slice(idx + decimalSeparator.length);
+    }
+  }
+
+  // Validate the remaining token is a plain number. Any leftover character
+  // (a letter, a second decimal separator, ...) makes it NaN.
+  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(working)) {
+    return NaN;
+  }
+
+  const num = Number(working);
+  if (!Number.isFinite(num)) return NaN;
+
+  if (options?.style === 'percent') {
+    return num / 100;
+  }
+  return num;
+}
diff --git a/src/styles/components/number-input.css b/src/styles/components/number-input.css
new file mode 100644
index 0000000..6e5c628
--- /dev/null
+++ b/src/styles/components/number-input.css
@@ -0,0 +1,61 @@
+/* NumberInput (spec phase 3 §4.3, mockup N2): the frame of Input with a − button at the left end and a
+   + button at the right end, each 32px wide and as tall as the frame, a 1px line between a button and
+   the text. The frame takes its size, border, background and focus ring from input.css. */
+@layer flg.components {
+  .flg-number-input {
+    gap: 0;
+    padding: 0;
+    cursor: default;
+  }
+  .flg-number-input > input {
+    padding: 0 11px;
+    text-align: center;
+    font-variant-numeric: tabular-nums;
+    cursor: text;
+  }
+  .flg-number-input > button {
+    display: inline-flex;
+    flex: none;
+    align-items: center;
+    justify-content: center;
+    box-sizing: border-box;
+    width: 32px;
+    align-self: stretch;
+    margin: 0;
+    padding: 0;
+    border: 0;
+    background: transparent;
+    color: var(--flg-text-muted);
+    font: inherit;
+    cursor: pointer;
+    /* A held press must not open the system callout on iOS, select the icon or zoom on a double tap. */
+    -webkit-touch-callout: none;
+    user-select: none;
+    touch-action: manipulation;
+  }
+  .flg-number-input > button:first-child {
+    border-right: 1px solid var(--flg-control-border);
+    border-radius: calc(var(--flg-radius-md) - 1px) 0 0 calc(var(--flg-radius-md) - 1px);
+  }
+  .flg-number-input > button:nth-child(3) {
+    border-left: 1px solid var(--flg-control-border);
+    border-radius: 0 calc(var(--flg-radius-md) - 1px) calc(var(--flg-radius-md) - 1px) 0;
+  }
+  .flg-number-input > button > svg {
+    width: 16px;
+    height: 16px;
+  }
+  @media (hover: hover) {
+    .flg-number-input > button:not(:disabled):hover {
+      background: var(--flg-control-track);
+    }
+  }
+  .flg-number-input > button:disabled {
+    opacity: 0.4;
+    cursor: not-allowed;
+  }
+  /* A disabled control is already dimmed as a whole by the frame (input.css). */
+  .flg-number-input:has(> input:disabled) > button:disabled {
+    opacity: 1;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 9e62889..9adb78d 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -24,6 +24,7 @@
 @import './components/select.css';
 @import './components/tabs.css';
 @import './components/segmented-control.css';
+@import './components/number-input.css';
 @import './components/accordion.css';
 @import './components/breadcrumb.css';
 @import './components/pagination.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 9514c28..f04127d 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -214,6 +214,20 @@
     .flg-segmented-item:has(> input:disabled) {
       color: GrayText;
     }
+    /* The − and + of a NumberInput are drawn in the colour of a button, the line that separates them
+       from the text in the colour of the frame, and both go grey when the control is disabled. */
+    .flg-number-input > button {
+      color: ButtonText;
+    }
+    .flg-number-input > button:first-child {
+      border-right-color: CanvasText;
+    }
+    .flg-number-input > button:nth-child(3) {
+      border-left-color: CanvasText;
+    }
+    .flg-number-input:has(> input:disabled) > button {
+      color: GrayText;
+    }
     /* A row of tabs that scrolls: the system scroll bar shows that it does, and a fade would lower
        the contrast this mode is for. */
     .flg-tabs-list[data-overflow] {
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/internal/number.test.ts src/components/number-input src/components/input src/components/field src/index.test.ts
pnpm vitest run --project storybook-light --project storybook-dark src/components/number-input
pnpm build && pnpm check:package
```

Expected: `number.test.ts` 32 test PASS; `number-input` 126 test đơn vị PASS (63 × 2 project); cùng `input` và `field`, 191 test PASS; story `number-input` 42 test PASS (7 story × 3 engine × 2 theme; lần đầu có thể fail vì tên accessible trùng trong `Look`, hoặc `PressAndHold` chập chờn ở Firefox, chạy lại). `check:package`: `check:dist-css`, `check:use-client`, `check:rsc`, `check:publint`, `check:types` PASS; **`size` fail**: JS 30.83 kB trên 30.78 kB (vượt 50 B), CSS 6.86 kB trong ngưỡng 7.13 kB. Chưa ghi ngưỡng; Task 8 làm. Không file nào của component cũ đổi, nên không cần so sánh ảnh.

- [ ] **Step 5: Commit**

```bash
git add \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/number-input/NumberInput.mdx \
  src/components/number-input/NumberInput.stories.tsx \
  src/components/number-input/NumberInput.test-d.ts \
  src/components/number-input/NumberInput.test.tsx \
  src/components/number-input/NumberInput.tsx \
  src/components/number-input/index.ts \
  src/components/number-input/use-press-repeat.ts \
  src/index.test.ts \
  src/index.ts \
  src/internal/number.test.ts \
  src/internal/number.ts \
  src/styles/components/number-input.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(number-input): NumberInput, the N2 look with a − and a + inside the frame" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 6: `Slider` một nút

Spec §3.3, §4.2, §4.3 (giao diện S3), §4.5, §6.3. Một lựa chọn số trên thang cần phần tử role `slider`, kéo bằng con trỏ và giá trị gửi form.
- Nút là `span` có role `slider` (`id`, `name` và `aria-*` ở trên đó, `ref` ở gốc). Mũi tên, Page, Home, End bước theo lưới `step` qua `number.ts`.
- Nhấn lên track thì nút nhảy tới đó và tiếp tục như kéo. `use-pointer-drag` bắt con trỏ, giữ độ lệch khi nhấn lên nút, kết thúc ở `pointerup`, `pointercancel` và mất capture, và chặn bôi đen. `onValueCommit` chạy một lần mỗi lần kéo (nếu giá trị đổi) và sau mỗi phím làm giá trị đổi.
- Giao diện: track 4px, fill màu nhấn, nút 16px, bong bóng kính luôn ở trên nút (không có khi `disabled`), chấm tại các bước khi khoảng có tối đa mười bước hoặc khi `ticks` yêu cầu. Token mới `--flg-slider-tick`: 70% `--flg-text-muted`, đặc dưới `prefers-contrast: more`.
- Kiểu đã chuẩn bị cho range (`SliderValue = number | [number, number]`), nhưng task này chỉ dựng một nút: một giá trị mảng bị đọc như số đầu của nó. Task 7 hoàn thiện.
- Giá trị hiển thị cạnh nhãn dùng `aside` của `Field` (Task 3).

**Files:**
- Create: `src/components/slider/Slider.tsx`, `use-pointer-drag.ts`, `index.ts`, `Slider.test.tsx`, `Slider.test-d.ts`, `Slider.stories.tsx`, `Slider.mdx`, `src/styles/components/slider.css`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `src/styles/theme/values.ts`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`

**Interfaces:**
- Produces: `Slider` (generic `forwardRef`, bọc `markAsFieldGroup`), `SliderProps<V extends SliderValue = number>`, `SliderValue`.
  - Props: `value`, `defaultValue`, `onValueChange`, `onValueCommit` (kiểu `(value: Reported<V>)`), `min`, `max`, `step`, `largeStep`, `name`, `disabled`, `ticks`, `getValueText`, `size`... đúng như spec §6.3; `labels` chưa có (Task 7 thêm).
  - Hook `usePointerDrag`: báo `{ fraction, thumb }` ở `onStart` và `fraction` ở `onMove`; trả nút được nhấn và giữ độ lệch.
  - Class `flg-slider`, `-track`, `-fill`, `-thumb`, `-bubble`, `-tick`..., token `--flg-slider-tick`.
- Consumes: `stepFrom`, `snapToStep`, `clamp`, `formatNumber` (Task 5), `useFormReset` (Task 2), `useFieldProps`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/slider/Slider.stories.tsx b/src/components/slider/Slider.stories.tsx
new file mode 100644
index 0000000..f15f30d
--- /dev/null
+++ b/src/components/slider/Slider.stories.tsx
@@ -0,0 +1,231 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import type { FormEvent } from 'react';
+import { expect, fn, userEvent, waitFor } from 'storybook/test';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { Card } from '../card/Card';
+import { Field } from '../field/Field';
+import { Slider } from './Slider';
+
+const meta = {
+  title: 'Components/Slider',
+  component: Slider,
+  args: {
+    'aria-label': 'Volume',
+    defaultValue: 60,
+    onValueChange: fn(),
+    onValueCommit: fn(),
+  },
+} satisfies Meta<typeof Slider>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+const column = { display: 'grid', gap: 16, width: 420 } as const;
+
+/** The value at the right of the label row goes through `aside`; it is read from `aria-valuetext`. */
+const value = (text: string) => <span aria-hidden="true">{text}</span>;
+
+/** The sliders of the mockup (S3): a value in the label row, the bubble, the dots, a disabled one. */
+export const Look: Story = {
+  render: () => (
+    <div style={column}>
+      <Card style={{ gap: 14 }}>
+        <Field label="Volume" aside={value('60%')}>
+          <Slider defaultValue={60} getValueText={(v) => `${v}%`} />
+        </Field>
+        <Field label="Brightness" aside={value('3 / 5')}>
+          <Slider min={1} max={5} defaultValue={3} getValueText={(v) => `${v} of 5`} />
+        </Field>
+        <Field label="Alert sound (off)" aside={value('40%')} disabled>
+          <Slider defaultValue={40} getValueText={(v) => `${v}%`} />
+        </Field>
+      </Card>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const volume = canvas.getByRole('slider', { name: 'Volume' });
+    const brightness = canvas.getByRole('slider', { name: 'Brightness' });
+    const alert = canvas.getByRole('slider', { name: 'Alert sound (off)' });
+    const control = volume.parentElement as HTMLElement;
+    const box = (el: Element) => el.getBoundingClientRect();
+    // The control is 20px tall, the track 4px, the thumb 16px, as in the mockup.
+    await expect(box(control).height).toBe(20);
+    await expect(box(control.querySelector('.flg-slider-track') as Element).height).toBe(4);
+    await expect(box(volume).width).toBe(16);
+    await expect(box(volume).height).toBe(16);
+    // The centre of the thumb is at 60% of the track.
+    const track = box(control);
+    await expect(box(volume).left + 8 - track.left).toBeCloseTo(track.width * 0.6, 0);
+    // The bubble is 24px tall and its bottom edge is 6px above the top of the thumb.
+    const bubble = volume.querySelector('.flg-slider-bubble') as HTMLElement;
+    await expect(box(bubble).height).toBe(24);
+    await expect(box(volume).top - box(bubble).bottom).toBeCloseTo(6, 0);
+    await expect(bubble).toHaveTextContent('60%');
+    // The 30px above the control are kept for the bubble, in the HTML itself.
+    const root = control.parentElement as HTMLElement;
+    await expect(box(control).top - box(root).top).toBe(30);
+    // Five steps: five dots, 9px under the centre of the track, 4px across.
+    const dots = brightness.parentElement?.querySelectorAll('.flg-slider-ticks > i') ?? [];
+    await expect(dots.length).toBe(5);
+    const brightnessTrack = box(brightness.parentElement as HTMLElement);
+    const dot = box(dots[1] as Element);
+    await expect(dot.width).toBe(4);
+    await expect(dot.top - (brightnessTrack.top + brightnessTrack.height / 2)).toBeCloseTo(9, 0);
+    // The volume slider has 100 steps and so no dots.
+    await expect(control.querySelector('.flg-slider-ticks')).toBeNull();
+    // A disabled slider has no bubble and keeps no room for one.
+    await expect(alert.querySelector('.flg-slider-bubble')).toBeNull();
+    await expect(alert).toHaveAttribute('aria-disabled', 'true');
+    await expect(getComputedStyle(alert.closest('.flg-slider') as Element).paddingTop).toBe('0px');
+  },
+};
+
+function ControlledVolume() {
+  const [volume, setVolume] = useState(35);
+  return (
+    <Field label="Volume" aside={value(`${volume}%`)} description="Takes effect at once.">
+      <Slider value={volume} onValueChange={setVolume} getValueText={(v) => `${v}%`} />
+    </Field>
+  );
+}
+
+export const InAField: Story = {
+  render: () => (
+    <div style={column}>
+      <ControlledVolume />
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    const slider = canvas.getByRole('slider', { name: 'Volume' });
+    await expect(slider).toHaveAccessibleDescription('Takes effect at once.');
+    // The value in the label row is not part of the name: it is hidden, and sits outside the label.
+    await expect(slider).toHaveAttribute('aria-valuetext', '35%');
+    slider.focus();
+    await userEvent.keyboard('{ArrowRight}');
+    await waitFor(() => expect(slider).toHaveAttribute('aria-valuetext', '36%'));
+    await expect(canvas.getByText('36%', { selector: '.flg-field-aside *' })).toBeInTheDocument();
+  },
+};
+
+export const Invalid: Story = {
+  render: () => (
+    <div style={column}>
+      <Field label="Volume" error="Too loud for the night mode.">
+        <Slider defaultValue={90} />
+      </Field>
+    </div>
+  ),
+  play: async ({ canvas }) => {
+    await expect(canvas.getByRole('slider', { name: 'Volume' })).toHaveAttribute(
+      'aria-invalid',
+      'true',
+    );
+  },
+};
+
+/** A mark on the page at a fraction of the track, to drop the thumb on. */
+function markAt(control: HTMLElement, fraction: number) {
+  const box = control.getBoundingClientRect();
+  const mark = document.createElement('div');
+  mark.style.cssText = `position:fixed;width:2px;height:2px;left:${box.left + box.width * fraction}px;top:${box.top + box.height / 2}px`;
+  document.body.append(mark);
+  return mark;
+}
+
+/**
+ * A real pointer: the thumb is dragged, and a press on the track makes the thumb jump there and goes on
+ * as a drag. The value changes at each move and is committed once, at the release.
+ */
+export const Dragging: Story = {
+  tags: ['no-visual'],
+  args: { defaultValue: 20, 'aria-label': 'Volume' },
+  render: (args) => (
+    <div style={{ width: 400, paddingTop: 20 }}>
+      <Slider {...args} />
+    </div>
+  ),
+  play: async ({ canvas, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const slider = canvas.getByRole('slider', { name: 'Volume' });
+    const control = slider.parentElement as HTMLElement;
+    const marks: HTMLElement[] = [];
+    try {
+      // Drag from 20 to about 90.
+      const nine = markAt(control, 0.9);
+      marks.push(nine);
+      await real.dragAndDrop(slider, nine);
+      await waitFor(() => expect(Number(slider.getAttribute('aria-valuenow'))).toBeGreaterThan(85));
+      await expect(Number(slider.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(95);
+      // One commit for the whole drag, with the value that the last change reported.
+      await expect(args.onValueCommit).toHaveBeenCalledTimes(1);
+      await expect(args.onValueChange).toHaveBeenLastCalledWith(
+        Number(slider.getAttribute('aria-valuenow')),
+      );
+      await expect(args.onValueCommit).toHaveBeenCalledWith(
+        Number(slider.getAttribute('aria-valuenow')),
+      );
+      // The thumb has the focus, but the ring does not show: the press was not the keyboard.
+      await expect(slider).toHaveFocus();
+      await expect(getComputedStyle(slider).outlineStyle).toBe('none');
+      // The drag selected no text.
+      await expect(window.getSelection()?.toString()).toBe('');
+      // A press on the track, away from the thumb, puts the thumb under the pointer: the middle.
+      await real.click(control);
+      await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '50'));
+      await expect(args.onValueCommit).toHaveBeenCalledTimes(2);
+    } finally {
+      for (const mark of marks) mark.remove();
+    }
+  },
+};
+
+function FormDemo() {
+  const [sent, setSent] = useState('');
+  const submit = (event: FormEvent<HTMLFormElement>) => {
+    event.preventDefault();
+    setSent(String(new FormData(event.currentTarget).get('volume')));
+  };
+  return (
+    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
+      <Field label="Volume">
+        <Slider name="volume" defaultValue={30} step={5} />
+      </Field>
+      <button type="submit">Save</button>
+      <button type="reset">Reset</button>
+      <output>{sent ? `Sent: ${sent}` : 'Nothing sent'}</output>
+    </form>
+  );
+}
+
+/** Real keys and a real submit and reset: Tab reaches the thumb, the keys move it, the form gets the value. */
+export const Keyboard: Story = {
+  tags: ['no-visual'],
+  render: () => <FormDemo />,
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    const slider = canvas.getByRole('slider', { name: 'Volume' });
+    const output = canvas.getByRole('status');
+    if (!real) return;
+    await real.tab();
+    await expect(slider).toHaveFocus();
+    // Keyboard focus shows the ring: an outline and the ring shadow on the thumb.
+    await expect(slider.matches(':focus-visible')).toBe(true);
+    await expect(getComputedStyle(slider).outlineStyle).toBe('solid');
+    await real.keyboard('{ArrowRight}{ArrowRight}');
+    await expect(slider).toHaveAttribute('aria-valuenow', '40');
+    await real.keyboard('{PageUp}');
+    await expect(slider).toHaveAttribute('aria-valuenow', '50');
+    await real.keyboard('{End}');
+    await expect(slider).toHaveAttribute('aria-valuenow', '100');
+    await real.keyboard('{Home}{ArrowDown}');
+    await expect(slider).toHaveAttribute('aria-valuenow', '0');
+    await real.keyboard('{ArrowUp}');
+    await expect(slider).toHaveAttribute('aria-valuenow', '5');
+    await real.click(canvas.getByRole('button', { name: 'Save' }));
+    await waitFor(() => expect(output).toHaveTextContent('Sent: 5'));
+    await real.click(canvas.getByRole('button', { name: 'Reset' }));
+    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '30'));
+  },
+};
diff --git a/src/components/slider/Slider.test-d.ts b/src/components/slider/Slider.test-d.ts
new file mode 100644
index 0000000..47fa940
--- /dev/null
+++ b/src/components/slider/Slider.test-d.ts
@@ -0,0 +1,44 @@
+import { expectTypeOf, test } from 'vitest';
+import { Slider } from './Slider';
+import type { SliderProps } from './Slider';
+
+test('Slider reports a pair when it is given a pair, and a number when it is given a number', () => {
+  Slider({
+    defaultValue: [20, 75],
+    onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<[number, number]>(),
+    onValueCommit: (value) => expectTypeOf(value).toEqualTypeOf<[number, number]>(),
+  });
+  Slider({
+    value: [20, 75],
+    onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<[number, number]>(),
+  });
+  Slider({
+    defaultValue: 60,
+    onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<number>(),
+  });
+  Slider({
+    value: 60,
+    onValueCommit: (value) => expectTypeOf(value).toEqualTypeOf<number>(),
+  });
+});
+
+test('Slider is one thumb when it has neither a value nor a default value', () => {
+  Slider({ onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<number>() });
+  expectTypeOf<SliderProps['value']>().toEqualTypeOf<number | undefined>();
+});
+
+test('Slider takes only a number or a pair of numbers as a value', () => {
+  // @ts-expect-error a string is not a value
+  Slider({ value: '60' });
+  // @ts-expect-error a range has exactly two numbers
+  Slider({ value: [1, 2, 3] });
+});
+
+test('Slider takes numbers for min, max and step, and a function for the words of a value', () => {
+  expectTypeOf<SliderProps['min']>().toEqualTypeOf<number | undefined>();
+  expectTypeOf<SliderProps['getValueText']>().toEqualTypeOf<
+    ((value: number) => string) | undefined
+  >();
+  // @ts-expect-error the slider has no size
+  Slider({ size: 'md' });
+});
diff --git a/src/components/slider/Slider.test.tsx b/src/components/slider/Slider.test.tsx
new file mode 100644
index 0000000..8a2d4a5
--- /dev/null
+++ b/src/components/slider/Slider.test.tsx
@@ -0,0 +1,638 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef, useState } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Field } from '../field/Field';
+import { Slider } from './Slider';
+import type { SliderProps } from './Slider';
+
+const thumb = () => screen.getByRole('slider');
+const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 5)));
+
+function Volume(props: SliderProps) {
+  return <Slider aria-label="Volume" {...props} />;
+}
+
+/** The control is 200px wide and starts at x = 0, so a fraction of the track is 2px per percent. */
+function layOut(container: HTMLElement, thumbAt?: number) {
+  const control = container.querySelector('.flg-slider-control') as HTMLElement;
+  control.getBoundingClientRect = () =>
+    ({ left: 0, right: 200, width: 200, top: 0, bottom: 20, height: 20, x: 0, y: 0 }) as DOMRect;
+  if (thumbAt !== undefined) {
+    thumb().getBoundingClientRect = () =>
+      ({ left: thumbAt - 8, right: thumbAt + 8, width: 16, height: 16 }) as DOMRect;
+  }
+  return control;
+}
+
+const press = (el: Element, clientX: number, init: PointerEventInit = {}) =>
+  fireEvent.pointerDown(el, { clientX, pointerId: 1, button: 0, isPrimary: true, ...init });
+const move = (el: Element, clientX: number) =>
+  fireEvent.pointerMove(el, { clientX, pointerId: 1, isPrimary: true });
+const release = (el: Element, clientX: number) =>
+  fireEvent.pointerUp(el, { clientX, pointerId: 1, isPrimary: true });
+
+describe('Slider', () => {
+  beforeEach(() => resetDevWarnings());
+  afterEach(() => vi.restoreAllMocks());
+
+  describe('structure', () => {
+    it('renders a root with a control that holds the track, the fill and one thumb, and a hidden input', () => {
+      const ref = createRef<HTMLDivElement>();
+      const { container } = render(
+        <Slider ref={ref} aria-label="Volume" name="volume" defaultValue={60} className="mine" />,
+      );
+      const root = container.firstElementChild as HTMLElement;
+      expect(ref.current).toBe(root);
+      expect(root).toHaveClass('flg-slider', 'mine');
+      const control = root.firstElementChild as HTMLElement;
+      expect(control).toHaveClass('flg-slider-control');
+      expect(control.style.getPropertyValue('--flg-slider-start')).toBe('0%');
+      expect(control.style.getPropertyValue('--flg-slider-end')).toBe('60%');
+      expect(Array.from(control.children).map((child) => child.className.split(' ')[0])).toEqual([
+        'flg-slider-track',
+        'flg-slider-fill',
+        'flg-slider-thumb',
+      ]);
+      expect(thumb().style.getPropertyValue('--flg-slider-pos')).toBe('60%');
+      const hidden = root.lastElementChild as HTMLInputElement;
+      expect(hidden).toHaveAttribute('type', 'hidden');
+      expect(hidden).toHaveAttribute('name', 'volume');
+      expect(hidden.value).toBe('60');
+    });
+
+    it('draws the bubble as a glass span inside the thumb, hidden from assistive technology', () => {
+      render(<Volume defaultValue={60} />);
+      const bubble = thumb().firstElementChild as HTMLElement;
+      expect(bubble.tagName).toBe('SPAN');
+      expect(bubble).toHaveClass('flg-surface', 'flg-slider-bubble');
+      expect(bubble).toHaveAttribute('aria-hidden', 'true');
+      expect(bubble).toHaveTextContent('60');
+    });
+
+    it('puts the root props on the root and the id and the name on the thumb', () => {
+      const { container } = render(
+        <Volume id="vol" data-testid="root" style={{ width: 300 }} defaultValue={10} />,
+      );
+      const root = container.firstElementChild as HTMLElement;
+      expect(root).toHaveAttribute('data-testid', 'root');
+      expect(root.style.width).toBe('300px');
+      expect(root).not.toHaveAttribute('id');
+      expect(thumb()).toHaveAttribute('id', 'vol');
+      expect(thumb()).toHaveAttribute('aria-label', 'Volume');
+    });
+
+    it('sends no hidden input without a name', () => {
+      const { container } = render(<Volume defaultValue={10} />);
+      expect(container.querySelector('input')).toBeNull();
+    });
+  });
+
+  describe('ARIA', () => {
+    it('gives the thumb the slider role with its limits, value and orientation', () => {
+      render(<Volume defaultValue={60} min={10} max={90} />);
+      expect(thumb()).toHaveAttribute('tabindex', '0');
+      expect(thumb()).toHaveAttribute('aria-valuemin', '10');
+      expect(thumb()).toHaveAttribute('aria-valuemax', '90');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
+      expect(thumb()).toHaveAttribute('aria-orientation', 'horizontal');
+      expect(thumb()).not.toHaveAttribute('aria-valuetext');
+    });
+
+    it('sets aria-valuetext from getValueText, and shows the same words in the bubble', () => {
+      render(<Volume defaultValue={60} getValueText={(v) => `${v}%`} />);
+      expect(thumb()).toHaveAttribute('aria-valuetext', '60%');
+      expect(thumb()).toHaveTextContent('60%');
+    });
+
+    it('is not focusable and says aria-disabled when disabled, and has no bubble', () => {
+      render(<Volume defaultValue={60} disabled name="v" />);
+      expect(thumb()).not.toHaveAttribute('tabindex');
+      expect(thumb()).toHaveAttribute('aria-disabled', 'true');
+      expect(thumb()).toBeEmptyDOMElement();
+      expect(document.querySelector('input')).toBeDisabled();
+    });
+
+    it('sets aria-invalid on the thumb', () => {
+      render(<Volume defaultValue={60} invalid />);
+      expect(thumb()).toHaveAttribute('aria-invalid', 'true');
+    });
+  });
+
+  describe('keys', () => {
+    it('moves one step with the arrow keys', async () => {
+      const onValueChange = vi.fn();
+      render(<Volume defaultValue={50} onValueChange={onValueChange} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      await user.keyboard('{ArrowRight}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '51');
+      await user.keyboard('{ArrowUp}{ArrowUp}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '53');
+      await user.keyboard('{ArrowLeft}{ArrowDown}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '51');
+      expect(onValueChange).toHaveBeenCalledTimes(5);
+      expect(onValueChange).toHaveBeenLastCalledWith(51);
+    });
+
+    it('moves a large step with PageUp and PageDown, by default a tenth of the range', async () => {
+      render(<Volume defaultValue={50} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      await user.keyboard('{PageUp}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
+      await user.keyboard('{PageDown}{PageDown}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
+    });
+
+    it('takes a large step that is a multiple of step, and never less than one step', async () => {
+      render(<Volume defaultValue={0} min={0} max={25} step={5} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      // A tenth of 25 is 2.5, which is half a step: the large step is one step.
+      await user.keyboard('{PageUp}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '5');
+    });
+
+    it('takes the largeStep it is given', async () => {
+      render(<Volume defaultValue={0} largeStep={25} />);
+      thumb().focus();
+      await userEvent.setup().keyboard('{PageUp}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '25');
+    });
+
+    it('goes to the ends with Home and End, and stays inside them', async () => {
+      render(<Volume defaultValue={50} min={10} max={90} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      await user.keyboard('{Home}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+      await user.keyboard('{ArrowLeft}{PageDown}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+      await user.keyboard('{End}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '90');
+      await user.keyboard('{ArrowRight}{PageUp}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '90');
+    });
+
+    it('keeps the value on the grid that starts at min, also with decimals', async () => {
+      render(<Volume defaultValue={0.1} min={0} max={1} step={0.1} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      await user.keyboard('{ArrowRight}{ArrowRight}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '0.3');
+    });
+
+    it('steps from a value off the grid to the next grid value, as a number input does', async () => {
+      render(<Volume defaultValue={7} min={0} max={20} step={5} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      await user.keyboard('{ArrowRight}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+    });
+
+    it('ends on the last grid value when max is not on the grid', async () => {
+      render(<Volume defaultValue={0} min={0} max={10} step={4} />);
+      thumb().focus();
+      await userEvent.setup().keyboard('{End}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '8');
+    });
+
+    it('calls onValueCommit once for each key that changes the value, and not for one that does not', async () => {
+      const onValueCommit = vi.fn();
+      render(<Volume defaultValue={99} onValueCommit={onValueCommit} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      await user.keyboard('{ArrowRight}');
+      expect(onValueCommit).toHaveBeenLastCalledWith(100);
+      await user.keyboard('{ArrowRight}{End}');
+      expect(onValueCommit).toHaveBeenCalledTimes(1);
+      await user.keyboard('{Home}');
+      expect(onValueCommit).toHaveBeenCalledTimes(2);
+      expect(onValueCommit).toHaveBeenLastCalledWith(0);
+    });
+
+    it('leaves a key with Alt, Ctrl or Meta to the browser', async () => {
+      render(<Volume defaultValue={50} />);
+      thumb().focus();
+      const user = userEvent.setup();
+      await user.keyboard('{Alt>}{ArrowRight}{/Alt}{Control>}{Home}{/Control}{Meta>}{End}{/Meta}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
+    });
+
+    it('prevents the page from scrolling on the keys it handles, and on no other', () => {
+      render(<Volume defaultValue={50} />);
+      expect(fireEvent.keyDown(thumb(), { key: 'ArrowRight' })).toBe(false);
+      expect(fireEvent.keyDown(thumb(), { key: 'a' })).toBe(true);
+    });
+
+    it('does not move a disabled slider', () => {
+      render(<Volume defaultValue={50} disabled />);
+      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
+      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
+    });
+  });
+
+  describe('value', () => {
+    it('starts at min without a value, and at the default value', () => {
+      const { unmount } = render(<Volume min={20} />);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '20');
+      unmount();
+      render(<Volume defaultValue={30} />);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
+    });
+
+    it('follows a controlled value and only reports what the user asks', async () => {
+      const onValueChange = vi.fn();
+      render(<Volume value={40} onValueChange={onValueChange} />);
+      thumb().focus();
+      await userEvent.setup().keyboard('{ArrowRight}');
+      expect(onValueChange).toHaveBeenCalledWith(41);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
+    });
+
+    it('works as a controlled slider in a parent', async () => {
+      function Parent() {
+        const [value, setValue] = useState(10);
+        return <Volume value={value} onValueChange={setValue} />;
+      }
+      render(<Parent />);
+      thumb().focus();
+      await userEvent.setup().keyboard('{ArrowRight}{ArrowRight}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '12');
+    });
+
+    it('shows the nearest position for a value outside the range or not a number', () => {
+      const { rerender } = render(<Volume value={500} />);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
+      rerender(<Volume value={Number.NaN} />);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
+    });
+
+    it('sends the value in the hidden input as a plain number', () => {
+      const { container } = render(<Volume name="v" defaultValue={0.3} step={0.1} max={1} />);
+      expect((container.querySelector('input') as HTMLInputElement).value).toBe('0.3');
+    });
+
+    it('does not throw, and warns, for min that is not less than max', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Volume min={10} max={10} defaultValue={5} ticks />);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('min (10) must be less than max'));
+      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+    });
+
+    it('uses 1 for a step that is not a positive finite number, and warns', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Volume step={0} defaultValue={5} />);
+      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
+      expect(thumb()).toHaveAttribute('aria-valuenow', '6');
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('step must be a positive'));
+    });
+  });
+
+  describe('pointer', () => {
+    it('jumps the thumb to a press on the track, and focuses it', () => {
+      const onValueChange = vi.fn();
+      const { container } = render(<Volume defaultValue={10} onValueChange={onValueChange} />);
+      const control = layOut(container);
+      press(control.querySelector('.flg-slider-track') as Element, 150);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '75');
+      expect(onValueChange).toHaveBeenCalledWith(75);
+      expect(thumb()).toHaveFocus();
+    });
+
+    it('marks the root while the thumb has the focus from a press, until a key or a blur', () => {
+      const { container } = render(<Volume defaultValue={10} />);
+      const root = container.firstElementChild as HTMLElement;
+      const control = layOut(container);
+      press(control, 100);
+      release(control, 100);
+      expect(root).toHaveAttribute('data-pointer-focus');
+      fireEvent.keyDown(thumb(), { key: 'ArrowRight' });
+      expect(root).not.toHaveAttribute('data-pointer-focus');
+      press(control, 100);
+      release(control, 100);
+      expect(root).toHaveAttribute('data-pointer-focus');
+      fireEvent.focusOut(thumb());
+      expect(root).not.toHaveAttribute('data-pointer-focus');
+    });
+
+    it('rounds the pointer position onto the grid', () => {
+      const { container } = render(<Volume defaultValue={0} step={10} />);
+      const control = layOut(container);
+      press(control, 52);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
+      move(control, 71);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '40');
+    });
+
+    it('follows the pointer while it is down, and stays inside the ends', () => {
+      const { container } = render(<Volume defaultValue={0} />);
+      const control = layOut(container);
+      press(control, 20);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+      move(control, 100);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
+      move(control, 900);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
+      move(control, -300);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
+    });
+
+    it('stops following when the pointer is released', () => {
+      const { container } = render(<Volume defaultValue={0} />);
+      const control = layOut(container);
+      press(control, 20);
+      release(control, 20);
+      move(control, 100);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+    });
+
+    it('ignores another pointer while one is down', () => {
+      const { container } = render(<Volume defaultValue={0} />);
+      const control = layOut(container);
+      press(control, 20);
+      fireEvent.pointerMove(control, { clientX: 100, pointerId: 2 });
+      expect(thumb()).toHaveAttribute('aria-valuenow', '10');
+    });
+
+    it('keeps the distance between the pointer and the centre of the thumb when the press is on the thumb', () => {
+      const { container } = render(<Volume defaultValue={50} />);
+      const control = layOut(container, 100);
+      // 5px right of the centre of the thumb: the value does not jump to 52.5 or 53.
+      press(thumb(), 105);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
+      move(control, 125);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '60');
+    });
+
+    it('commits once, at the release, when the drag changed the value', () => {
+      const onValueChange = vi.fn();
+      const onValueCommit = vi.fn();
+      const { container } = render(
+        <Volume defaultValue={0} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
+      );
+      const control = layOut(container);
+      press(control, 20);
+      move(control, 60);
+      move(control, 100);
+      expect(onValueChange).toHaveBeenCalledTimes(3);
+      expect(onValueCommit).not.toHaveBeenCalled();
+      release(control, 100);
+      expect(onValueCommit).toHaveBeenCalledTimes(1);
+      expect(onValueCommit).toHaveBeenCalledWith(50);
+      // The browser fires this after the release; it must not commit again.
+      fireEvent.lostPointerCapture(control, { pointerId: 1 });
+      expect(onValueCommit).toHaveBeenCalledTimes(1);
+    });
+
+    it('does not commit when the drag ended where it began', () => {
+      const onValueCommit = vi.fn();
+      const { container } = render(<Volume defaultValue={50} onValueCommit={onValueCommit} />);
+      const control = layOut(container, 100);
+      press(thumb(), 100);
+      move(control, 140);
+      move(control, 100);
+      release(control, 100);
+      expect(onValueCommit).not.toHaveBeenCalled();
+    });
+
+    it('ends the drag on pointercancel and on a lost capture', () => {
+      const onValueCommit = vi.fn();
+      const { container } = render(<Volume defaultValue={0} onValueCommit={onValueCommit} />);
+      const control = layOut(container);
+      press(control, 40);
+      fireEvent.pointerCancel(control, { pointerId: 1 });
+      expect(onValueCommit).toHaveBeenCalledWith(20);
+      move(control, 100);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '20');
+      press(control, 60);
+      fireEvent.lostPointerCapture(control, { pointerId: 1 });
+      expect(onValueCommit).toHaveBeenLastCalledWith(30);
+      move(control, 100);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '30');
+    });
+
+    it('commits what the user asked for even when a controlled parent keeps the old value', () => {
+      const onValueCommit = vi.fn();
+      const { container } = render(<Volume value={0} onValueCommit={onValueCommit} />);
+      const control = layOut(container);
+      press(control, 100);
+      release(control, 100);
+      expect(onValueCommit).toHaveBeenCalledWith(50);
+    });
+
+    it('ignores the secondary button, and a disabled slider', () => {
+      const { container, rerender } = render(<Volume defaultValue={0} />);
+      const control = layOut(container);
+      press(control, 100, { button: 2 });
+      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
+      rerender(<Volume defaultValue={0} disabled />);
+      press(control, 100);
+      expect(thumb()).toHaveAttribute('aria-valuenow', '0');
+    });
+
+    it('prevents the default of a mouse press, so no text is selected and the thumb keeps its focus', () => {
+      const { container } = render(<Volume defaultValue={0} />);
+      const control = layOut(container);
+      expect(fireEvent.mouseDown(control)).toBe(false);
+    });
+
+    it('does not throw where the pointer cannot be captured', () => {
+      const { container } = render(<Volume defaultValue={0} />);
+      const control = layOut(container);
+      control.setPointerCapture = () => {
+        throw new DOMException('no such pointer', 'NotFoundError');
+      };
+      expect(() => press(control, 100)).not.toThrow();
+      expect(thumb()).toHaveAttribute('aria-valuenow', '50');
+    });
+  });
+
+  describe('ticks', () => {
+    const dots = (container: HTMLElement) =>
+      Array.from(container.querySelectorAll<HTMLElement>('.flg-slider-ticks > i'));
+
+    it('shows a dot at each step, the ends included, when the range has at most ten steps', () => {
+      const { container } = render(<Volume min={1} max={5} defaultValue={3} />);
+      expect(dots(container).map((dot) => dot.style.left)).toEqual([
+        '0%',
+        '25%',
+        '50%',
+        '75%',
+        '100%',
+      ]);
+      expect(container.firstElementChild).toHaveAttribute('data-ticks');
+      expect(container.querySelector('.flg-slider-ticks')).toHaveAttribute('aria-hidden', 'true');
+    });
+
+    it('shows the dots for exactly ten steps, and not for eleven', () => {
+      const { container, rerender } = render(<Volume min={0} max={10} />);
+      expect(dots(container)).toHaveLength(11);
+      rerender(<Volume min={0} max={11} />);
+      expect(dots(container)).toHaveLength(0);
+      expect(container.firstElementChild).not.toHaveAttribute('data-ticks');
+    });
+
+    it('counts the steps of a decimal grid without float noise', () => {
+      const { container } = render(<Volume min={0} max={1} step={0.1} />);
+      expect(dots(container)).toHaveLength(11);
+    });
+
+    it('shows none by default for the default range of 100 steps', () => {
+      const { container } = render(<Volume />);
+      expect(dots(container)).toHaveLength(0);
+    });
+
+    it('is forced on with ticks, and off with ticks={false}', () => {
+      const { container, rerender } = render(<Volume min={0} max={20} step={5} ticks />);
+      expect(dots(container)).toHaveLength(5);
+      rerender(<Volume min={0} max={5} ticks={false} />);
+      expect(dots(container)).toHaveLength(0);
+      expect(container.firstElementChild).not.toHaveAttribute('data-ticks');
+    });
+
+    it('draws only the steps that exist when max is not on the grid', () => {
+      const { container } = render(<Volume min={0} max={10} step={4} ticks />);
+      expect(dots(container).map((dot) => dot.style.left)).toEqual(['0%', '40%', '80%']);
+    });
+  });
+
+  describe('Field', () => {
+    it('is named by the label of the Field, on the thumb, and its aside is not part of the name', () => {
+      render(
+        <Field label="Volume" aside={<span aria-hidden="true">60%</span>}>
+          <Slider defaultValue={60} />
+        </Field>,
+      );
+      expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
+      expect(document.querySelector('.flg-field-label')?.tagName).toBe('SPAN');
+    });
+
+    it('gets the description and the error through aria-describedby, and invalid from the error', () => {
+      render(
+        <Field label="Volume" description="Between 0 and 100" error="Too loud">
+          <Slider defaultValue={60} />
+        </Field>,
+      );
+      expect(thumb()).toHaveAccessibleDescription('Between 0 and 100 Too loud');
+      expect(thumb()).toHaveAttribute('aria-invalid', 'true');
+    });
+
+    it('is disabled by the Field', () => {
+      render(
+        <Field label="Volume" disabled>
+          <Slider defaultValue={60} />
+        </Field>,
+      );
+      expect(thumb()).toHaveAttribute('aria-disabled', 'true');
+    });
+
+    it('takes the id of the thumb as the control id of the Field', () => {
+      render(
+        <Field label="Volume">
+          <Slider defaultValue={60} id="vol" />
+        </Field>,
+      );
+      expect(thumb()).toHaveAttribute('id', 'vol');
+      expect(screen.getByRole('slider', { name: 'Volume' })).toBe(thumb());
+    });
+
+    it('warns when it is not the direct child of the Field', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(
+        <Field label="Volume">
+          <div>
+            <Slider aria-label="Volume" defaultValue={60} />
+          </div>
+        </Field>,
+      );
+      // The Field here has a label element that points at nothing: the warning is the one that says why.
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not its direct child'));
+    });
+  });
+
+  describe('name', () => {
+    it('warns without a name, and not with aria-label, aria-labelledby or a Field label', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { unmount } = render(<Slider defaultValue={1} />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('<Slider> needs a name'));
+      unmount();
+      warn.mockClear();
+      resetDevWarnings();
+      render(
+        <>
+          <span id="l">Level</span>
+          <Slider aria-labelledby="l" />
+          <Slider aria-label="Level" />
+          <Field label="Level">
+            <Slider />
+          </Field>
+        </>,
+      );
+      expect(warn).not.toHaveBeenCalled();
+    });
+  });
+
+  describe('form', () => {
+    it('submits the value under the name', () => {
+      render(
+        <form data-testid="form">
+          <Volume name="volume" defaultValue={35} />
+        </form>,
+      );
+      const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
+      expect(data.get('volume')).toBe('35');
+    });
+
+    it('sends nothing when disabled', () => {
+      render(
+        <form data-testid="form">
+          <Volume name="volume" defaultValue={35} disabled />
+        </form>,
+      );
+      expect(new FormData(screen.getByTestId('form') as HTMLFormElement).has('volume')).toBe(false);
+    });
+
+    it('puts an uncontrolled slider back to its default value when the form is reset', async () => {
+      render(
+        <form data-testid="form">
+          <Volume name="volume" defaultValue={35} />
+        </form>,
+      );
+      thumb().focus();
+      await userEvent.setup().keyboard('{End}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
+      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
+      await settle();
+      expect(thumb()).toHaveAttribute('aria-valuenow', '35');
+    });
+
+    it('does not reset a slider whose form reset was cancelled', async () => {
+      render(
+        <form data-testid="form" onReset={(event) => event.preventDefault()}>
+          <Volume name="volume" defaultValue={35} />
+        </form>,
+      );
+      thumb().focus();
+      await userEvent.setup().keyboard('{End}');
+      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
+      await settle();
+      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
+    });
+
+    it('keeps the value of a controlled slider when the form is reset', async () => {
+      render(
+        <form data-testid="form">
+          <Volume name="volume" value={70} defaultValue={35} />
+        </form>,
+      );
+      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
+      await settle();
+      expect(thumb()).toHaveAttribute('aria-valuenow', '70');
+    });
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index bba77d1..ed164fd 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -72,6 +72,7 @@ describe('public API', () => {
       'SelectGroup',
       'SelectItem',
       'SelectSeparator',
+      'Slider',
       'Spinner',
       'Surface',
       'Switch',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/slider src/index.test.ts
```

Expected: FAIL, `Failed to resolve import "./Slider"`, và `src/index.test.ts` fail vì `Slider` chưa export. Chi tiết ở bản nháp (code viết trước, rồi chạy test với stub `Slider` chỉ render `<div ref />`): 48 trong 57 test fail, kiểu `Unable to find an accessible element with the role "slider"`; 9 test phủ định hoặc về form (không input ẩn khi không có `name`, không chấm khi 100 bước, không cảnh báo khi có `name`, FormData không có input, cảnh báo của `Field`) pass trên stub và không thể fail trước. Story `Dragging` fail lần đầu với `expected true to be false` (focus-visible sau nhấn chuột, phát hiện 4).

- [ ] **Step 3: Viết code**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 6578946..16f6309 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -60,6 +60,13 @@ const SHIPPED_CLASSES = [
   'flg-segmented-input',
   'flg-segmented-label',
   'flg-number-input',
+  'flg-slider',
+  'flg-slider-control',
+  'flg-slider-track',
+  'flg-slider-fill',
+  'flg-slider-ticks',
+  'flg-slider-thumb',
+  'flg-slider-bubble',
   'flg-accordion',
   'flg-accordion-item',
   'flg-accordion-trigger',
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 7451daf..068a91f 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -25,6 +25,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/segmented-control/SegmentedControl.tsx',
   'src/components/segmented-control/SegmentedControlItem.tsx',
   'src/components/number-input/NumberInput.tsx',
+  'src/components/slider/Slider.tsx',
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
   'src/components/toast/toast.ts',
diff --git a/src/components/slider/Slider.mdx b/src/components/slider/Slider.mdx
new file mode 100644
index 0000000..9922d51
--- /dev/null
+++ b/src/components/slider/Slider.mdx
@@ -0,0 +1,104 @@
+import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Slider.stories';
+
+<Meta of={Stories} />
+
+# Slider
+
+```tsx
+import { Field, Slider } from 'fl-glass-ui';
+
+<Field label="Volume" aside={<span aria-hidden="true">60%</span>}>
+  <Slider name="volume" defaultValue={60} getValueText={(v) => `${v}%`} />
+</Field>;
+```
+
+<Canvas of={Stories.Look} />
+<Controls />
+
+## The value
+
+`value` and `defaultValue` are a number: one thumb. `min` (default 0), `max` (default 100) and `step`
+(default 1) set the range and the grid of values, which starts at `min`; the value is always on the
+grid and inside the range. Without a value the thumb starts at `min`.
+
+`onValueChange` is called with every value the thumb takes, so for each step of a drag.
+`onValueCommit` is called once when a drag ends, if the value changed, and after each key that
+changed the value. Use it to save, and `onValueChange` to update what you show.
+
+A controlled slider shows what it is given; a value outside the range, or one that is not a number,
+is drawn at the nearest end, and the parent keeps what it passed.
+
+## The bubble, the dots and the words for a value
+
+The bubble above the thumb always shows the value, as a number or as `getValueText(value)`
+(`"60%"`, `"3 of 5"`). A disabled slider has no bubble, and keeps no room above it. The same words
+are `aria-valuetext`, so a screen reader reads `60%` where it would read `60`.
+
+Dots under the track mark each step, the ends included, when the range has at most ten steps
+(`(max − min) / step ≤ 10`). `ticks` forces them on or off: `ticks={false}` for a slider with few
+steps that should look continuous, `ticks` for one with more than ten that should still show them.
+
+## In a Field
+
+A Slider is a group for a Field: the label is a `<span>` that names the thumb through
+`aria-labelledby`, not a `<label for>`, because that cannot point at an element with the `slider`
+role. `description`, `error` and `disabled` of the Field reach the thumb; `required` does not apply,
+because a slider always has a value.
+
+**Show the value in the label row with the `aside` of the Field.** Slider does not draw it: the text
+differs from the bubble (`60%`, `20 – 75 million`, `3 / 5`), so only you know what it should say.
+Mark it `aria-hidden="true"`, because screen readers already get it from `aria-valuetext`.
+
+<Canvas of={Stories.InAField} />
+<Canvas of={Stories.Invalid} />
+
+`invalid` (also set by an `error` on the Field) only sets `aria-invalid` on the thumb: the look does
+not change.
+
+## Pointer and keys
+
+A press on the track makes the thumb jump to the pointer and carry on as a drag. A press on the thumb
+keeps the distance between the pointer and its centre, so the value does not jump. The pointer is
+captured, so the drag goes on outside the slider, and no text is selected. On a touch screen the
+thumb takes the touch, and the track leaves vertical scrolling to the page.
+
+| Key              | Does                                                                                     |
+| ---------------- | ---------------------------------------------------------------------------------------- |
+| ← or ↓           | One `step` less                                                                          |
+| → or ↑           | One `step` more                                                                          |
+| PageDown, PageUp | One `largeStep` less or more (default: about a tenth of the range, a multiple of `step`) |
+| Home, End        | The lowest and the highest value                                                         |
+
+A key with Alt, Ctrl or Meta is left to the browser.
+
+<Canvas of={Stories.Dragging} />
+
+## Forms
+
+A hidden input with `name` carries the value as a plain number (`String(value)`) and is not sent when
+the slider is `disabled`. A form reset puts an uncontrolled slider back to its `defaultValue` (or `min`);
+a controlled one keeps the value it is given.
+
+<Canvas of={Stories.Keyboard} />
+
+## Accessibility
+
+- The thumb is a `<span role="slider">` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`,
+  `aria-valuetext` (when you give `getValueText`) and `aria-orientation="horizontal"`. `id`,
+  `aria-label` and `aria-labelledby` go on it. A slider without a name gets a warning in development.
+- A disabled thumb has `aria-disabled="true"` and is not in the Tab order.
+- The bubble is `aria-hidden`: it repeats what `aria-valuetext` says.
+- The tick dots are decoration. The focus ring is on the thumb.
+- In forced-colors mode the track has a line in `CanvasText`, the filled part is `Highlight`, the thumb
+  is a `Canvas` disc with a 2px `CanvasText` edge, the dots are `CanvasText` and the bubble has its
+  line like a Tooltip. With `prefers-contrast: more` the dots are solid.
+
+## Do and don't
+
+- Do give the slider a name, with a Field `label`, `aria-label` or `aria-labelledby`.
+- Do pass the value for the label row to the `aside` of the Field, with `aria-hidden`.
+- Do use `getValueText` when the number alone is not clear (a unit, a percentage, "3 of 5").
+- Don't use a slider for a value people must type exactly: use a NumberInput, or both.
+- Don't put many sliders with bubbles on one page of heavy backgrounds: each bubble is a piece of glass
+  with a `backdrop-filter`, like nested Surfaces.
diff --git a/src/components/slider/Slider.tsx b/src/components/slider/Slider.tsx
new file mode 100644
index 0000000..531445d
--- /dev/null
+++ b/src/components/slider/Slider.tsx
@@ -0,0 +1,328 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useEffect, useRef, useState } from 'react';
+import type {
+  CSSProperties,
+  ForwardedRef,
+  HTMLAttributes,
+  KeyboardEvent,
+  ReactElement,
+  RefAttributes,
+} from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { markAsFieldGroup, useFieldContext, useFieldProps } from '../../internal/field-context';
+import { clamp, decimalsOf, snapToStep, stepFrom } from '../../internal/number';
+import { hasModifier } from '../../internal/roving';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useFormReset } from '../../internal/use-form-reset';
+import { useRequireName } from '../../internal/use-require-name';
+import { useWriteOnCommit } from '../../internal/use-write-on-commit';
+import { devWarn } from '../../internal/warn';
+import { usePointerDrag } from './use-pointer-drag';
+
+/** A number for a slider with one thumb, a pair for one with two (a range). */
+export type SliderValue = number | [number, number];
+
+/** What the callbacks of a slider receive: a number or a pair, never a literal type like `60`. */
+type Reported<V extends SliderValue> = V extends number ? number : V;
+
+export type SliderProps<V extends SliderValue = number> = Omit<
+  HTMLAttributes<HTMLDivElement>,
+  'defaultValue' | 'onChange'
+> & {
+  /** The value, for a controlled slider. A number is one thumb, a pair is two. */
+  value?: V;
+  /** The value at first, for an uncontrolled slider. Default `min`. */
+  defaultValue?: V;
+  /** Called on every change, so for each step while the thumb is dragged. */
+  onValueChange?: (value: Reported<V>) => void;
+  /** Called once when a drag ends (if the value changed) and after each key that changed the value. */
+  onValueCommit?: (value: Reported<V>) => void;
+  /** Default 0. */
+  min?: number;
+  /** Default 100. */
+  max?: number;
+  /** The grid of values, which starts at `min`. Default 1. */
+  step?: number;
+  /** What PageUp and PageDown move by. Default: the multiple of `step` nearest to a tenth of the range. */
+  largeStep?: number;
+  disabled?: boolean;
+  /** Sets `aria-invalid` on the thumb. Inside a Field with an error this is already true. */
+  invalid?: boolean;
+  /** The form field name; the hidden input that carries the value has it. */
+  name?: string;
+  /** Forces the tick dots on or off. By default they show when the range has at most 10 steps. */
+  ticks?: boolean;
+  /** The words for a value, in the bubble and in `aria-valuetext` (`"60%"`, `"3 of 5"`). */
+  getValueText?: (value: number) => string;
+};
+
+const isNumber = (n: number | undefined): n is number =>
+  typeof n === 'number' && Number.isFinite(n);
+
+/** A fraction as a percentage for CSS, without the noise of floating point. */
+const percent = (fraction: number) => `${Number((fraction * 100).toFixed(4))}%`;
+
+/**
+ * The slider of the mockup (S3): a thin track with the accent fill, a white thumb and a bubble above
+ * it that always shows the value, and tick dots under the track when the range has few steps. The
+ * thumb has the `slider` role and takes the arrow keys, the Page keys, Home, End and the pointer. A
+ * hidden input with `name` carries the value to the form. `ref`, `className` and `style` belong to
+ * the root; `id` and the `aria-*` props that name the slider go on the thumb.
+ *
+ * The value shown beside the label is not drawn here: pass it to the `aside` of the Field.
+ */
+export const Slider = markAsFieldGroup(
+  forwardRef(function Slider(
+    {
+      value,
+      defaultValue,
+      onValueChange,
+      onValueCommit,
+      min: minProp,
+      max: maxProp,
+      step: stepProp,
+      largeStep: largeStepProp,
+      name,
+      ticks,
+      getValueText,
+      className,
+      ...props
+    }: SliderProps<SliderValue>,
+    ref: ForwardedRef<HTMLDivElement>,
+  ) {
+    const field = useFieldContext();
+    // Only a slider that is the Field's direct child is the one the Field labels.
+    const labelled = field?.labelMode === 'group';
+    // An unlabelled slider keeps its own id below, so the Field never sees it (and does not warn
+    // about it on top of the warning that follows).
+    const {
+      invalid,
+      disabled,
+      // A slider always has a value, so there is nothing for `required` to check.
+      // eslint-disable-next-line @typescript-eslint/no-unused-vars
+      required: _required,
+      id,
+      'aria-label': ariaLabel,
+      'aria-labelledby': ariaLabelledBy,
+      'aria-describedby': ariaDescribedBy,
+      'aria-invalid': ariaInvalid,
+      ...rootProps
+    } = useFieldProps(labelled ? props : { ...props, id: undefined });
+    if (field?.labelMode === 'for' && field.labelId !== undefined) {
+      devWarn(
+        'Slider is inside a Field but is not its direct child, so the Field cannot label it. ' +
+          'Make Slider the direct child of Field.',
+      );
+    }
+    const labelledBy = ariaLabelledBy ?? (labelled ? field.labelId : undefined);
+    useRequireName({ 'aria-label': ariaLabel, 'aria-labelledby': labelledBy }, 'Slider');
+
+    const min = isNumber(minProp) ? minProp : 0;
+    const maxGiven = isNumber(maxProp) ? maxProp : 100;
+    // With no room between the ends the slider has one position, the minimum.
+    const max = Math.max(maxGiven, min);
+    const step = isNumber(stepProp) && stepProp > 0 ? stepProp : 1;
+    const range = max - min;
+    useEffect(() => {
+      if (maxGiven <= min) devWarn(`Slider: min (${min}) must be less than max (${maxGiven}).`);
+    }, [min, maxGiven]);
+    useEffect(() => {
+      if (stepProp !== undefined && step !== stepProp) {
+        devWarn(`Slider: step must be a positive finite number, not ${stepProp}; using 1.`);
+      }
+    }, [stepProp, step]);
+
+    // A multiple of step near a tenth of the range, and never less than one step.
+    const largeStep =
+      isNumber(largeStepProp) && largeStepProp > 0
+        ? largeStepProp
+        : Number((Math.max(1, Math.round(range / 10 / step)) * step).toFixed(decimalsOf(step)));
+
+    // Puts a number onto the grid, inside the range.
+    const fit = (n: number) => {
+      let fitted = snapToStep(clamp(n, min, max), step, min);
+      // Rounding may land one step past an end that is not on the grid.
+      if (fitted > max) fitted = stepFrom(fitted, step, min, 'down');
+      if (fitted < min) fitted = stepFrom(fitted, step, min, 'up');
+      return clamp(fitted, min, max);
+    };
+
+    const first = (v: SliderValue | undefined) => (Array.isArray(v) ? v[0] : v);
+    const [current, setValue, resetValue] = useControllableState<number>({
+      value: first(value),
+      defaultValue: first(defaultValue) ?? min,
+      onChange: onValueChange as ((value: number) => void) | undefined,
+      name: 'Slider value',
+    });
+    // What is shown for a value the parent gave that is not a number or is outside the range: the
+    // nearest position. The parent is not told; it still has what it passed.
+    const shown = isNumber(current) ? clamp(current, min, max) : min;
+    const position = percent(range > 0 ? (shown - min) / range : 0);
+
+    // What the slider holds right now. A drag moves faster than React renders, and each move must
+    // start from the one before, so the handlers read this ref, which the commit writes and which a
+    // change updates itself.
+    const live = useRef(shown);
+    useWriteOnCommit(() => {
+      live.current = shown;
+    });
+    // The value the user last asked for, which a parent that refuses it does not show.
+    const requested = useRef<number | null>(null);
+    const apply = (next: number) => {
+      requested.current = next;
+      if (value === undefined) live.current = next;
+      setValue(next);
+    };
+
+    const controlRef = useRef<HTMLDivElement>(null);
+    const thumbRef = useRef<HTMLSpanElement>(null);
+    const hiddenRef = useRef<HTMLInputElement>(null);
+    const defaultRef = useRef(first(defaultValue));
+    useWriteOnCommit(() => {
+      defaultRef.current = first(defaultValue);
+    });
+    // The form resets the hidden input behind React's back; put the value back with it.
+    useFormReset(hiddenRef, () => resetValue(defaultRef.current ?? min));
+
+    const commitRef = useRef(onValueCommit as ((value: number) => void) | undefined);
+    useWriteOnCommit(() => {
+      commitRef.current = onValueCommit as ((value: number) => void) | undefined;
+    });
+    // Whether the thumb has the focus because of a press, not because of the keyboard. Browsers
+    // disagree on whether a `focus()` from a press matches :focus-visible, so the ring is decided here.
+    const [pointerFocus, setPointerFocus] = useState(false);
+    // Where the value stood when the press began, to tell whether the drag changed it.
+    const startedAt = useRef(shown);
+    const moveTo = (fraction: number) => apply(fit(min + fraction * range));
+    const dragHandlers = usePointerDrag({
+      trackRef: controlRef,
+      disabled,
+      onStart: ({ fraction }) => {
+        startedAt.current = live.current;
+        requested.current = null;
+        moveTo(fraction);
+        // The press focuses the thumb so the keys go on from there. It is not keyboard focus, so
+        // the ring does not show.
+        setPointerFocus(true);
+        thumbRef.current?.focus({ preventScroll: true });
+      },
+      onMove: moveTo,
+      onEnd: () => {
+        const settled = requested.current;
+        if (settled !== null && settled !== startedAt.current) commitRef.current?.(settled);
+      },
+    });
+
+    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
+      setPointerFocus(false);
+      if (disabled || hasModifier(event)) return;
+      const from = live.current;
+      let next: number;
+      switch (event.key) {
+        case 'ArrowLeft':
+        case 'ArrowDown':
+          next = stepFrom(from, step, min, 'down');
+          break;
+        case 'ArrowRight':
+        case 'ArrowUp':
+          next = stepFrom(from, step, min, 'up');
+          break;
+        case 'PageDown':
+          next = from - largeStep;
+          break;
+        case 'PageUp':
+          next = from + largeStep;
+          break;
+        case 'Home':
+          next = min;
+          break;
+        case 'End':
+          next = max;
+          break;
+        default:
+          return;
+      }
+      event.preventDefault();
+      next = fit(next);
+      if (next === live.current) return;
+      apply(next);
+      commitRef.current?.(next);
+    };
+
+    // The dots are at the steps of the grid, the ends included. A range of at most ten steps shows
+    // them by itself.
+    const intervals = range > 0 ? Math.floor(range / step + 1e-9) : 0;
+    const showTicks = (ticks ?? range / step <= 10 + 1e-9) && intervals > 0;
+    const text = getValueText ? getValueText(shown) : String(shown);
+
+    return (
+      <div
+        ref={ref}
+        className={clsx('flg-slider', className)}
+        data-ticks={dataAttr(showTicks)}
+        data-disabled={dataAttr(disabled)}
+        data-invalid={dataAttr(invalid)}
+        data-pointer-focus={dataAttr(pointerFocus)}
+        {...rootProps}
+      >
+        <div
+          ref={controlRef}
+          className="flg-slider-control"
+          style={{ '--flg-slider-start': '0%', '--flg-slider-end': position } as CSSProperties}
+          {...dragHandlers}
+        >
+          <span className="flg-slider-track" aria-hidden="true" />
+          <span className="flg-slider-fill" aria-hidden="true" />
+          {showTicks ? (
+            <span className="flg-slider-ticks" aria-hidden="true">
+              {Array.from({ length: intervals + 1 }, (_, k) => (
+                <i key={k} style={{ left: percent((k * step) / range) }} />
+              ))}
+            </span>
+          ) : null}
+          {/* A disabled slider is not focusable, as a native control that is disabled. */}
+          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
+          <span
+            ref={thumbRef}
+            role="slider"
+            tabIndex={disabled ? undefined : 0}
+            className="flg-slider-thumb"
+            style={{ '--flg-slider-pos': position } as CSSProperties}
+            id={labelled ? id : props.id}
+            aria-valuemin={min}
+            aria-valuemax={max}
+            aria-valuenow={shown}
+            aria-valuetext={getValueText ? text : undefined}
+            aria-orientation="horizontal"
+            aria-label={ariaLabel}
+            aria-labelledby={labelledBy}
+            aria-describedby={ariaDescribedBy}
+            aria-invalid={ariaInvalid}
+            aria-disabled={disabled ? true : undefined}
+            onKeyDown={handleKeyDown}
+            onBlur={() => setPointerFocus(false)}
+          >
+            {disabled ? null : (
+              <span className="flg-surface flg-slider-bubble" aria-hidden="true">
+                {text}
+              </span>
+            )}
+          </span>
+        </div>
+        {name === undefined ? null : (
+          <input
+            ref={hiddenRef}
+            type="hidden"
+            name={name}
+            value={String(shown)}
+            disabled={disabled}
+          />
+        )}
+      </div>
+    );
+  }) as <V extends SliderValue = number>(
+    props: SliderProps<V> & RefAttributes<HTMLDivElement>,
+  ) => ReactElement | null,
+);
diff --git a/src/components/slider/index.ts b/src/components/slider/index.ts
new file mode 100644
index 0000000..9229294
--- /dev/null
+++ b/src/components/slider/index.ts
@@ -0,0 +1,2 @@
+export { Slider } from './Slider';
+export type { SliderProps, SliderValue } from './Slider';
diff --git a/src/components/slider/use-pointer-drag.ts b/src/components/slider/use-pointer-drag.ts
new file mode 100644
index 0000000..df4a3e9
--- /dev/null
+++ b/src/components/slider/use-pointer-drag.ts
@@ -0,0 +1,101 @@
+import { useRef } from 'react';
+import type { MouseEvent, PointerEvent, RefObject } from 'react';
+
+/** What a press starts: where along the track it landed, and the thumb it landed on, if any. */
+export interface DragStart {
+  /** 0 at the left end of the track, 1 at the right end. Already shifted by the grip offset. */
+  fraction: number;
+  thumb: HTMLElement | null;
+}
+
+export interface PointerDragOptions {
+  /** The element whose width is the range of the slider: its left edge is 0 and its right edge 1. */
+  trackRef: RefObject<HTMLElement | null>;
+  disabled?: boolean;
+  /** A press began. */
+  onStart: (start: DragStart) => void;
+  /** The pointer moved while pressed; `fraction` is clamped to 0..1. */
+  onMove: (fraction: number) => void;
+  /** The drag ended: released, cancelled, or the capture was lost. Called once per drag. */
+  onEnd: () => void;
+}
+
+/** The handlers for the element that carries the track and the thumbs. */
+export interface PointerDragHandlers {
+  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
+  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
+  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
+  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
+  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
+  onMouseDown: (event: MouseEvent<HTMLElement>) => void;
+}
+
+const THUMB = '[role="slider"]';
+
+/**
+ * Dragging along a track with a pointer. A press captures the pointer, so the drag goes on outside
+ * the element, and reports positions as a fraction of the track width until the pointer is released,
+ * the browser cancels it (a touch that turned into a scroll) or the capture is lost.
+ *
+ * A press on a thumb keeps the distance between the pointer and the centre of the thumb, so the
+ * value does not jump to where the pointer is; a press on the track puts the pointer at the value.
+ * The default action of the mouse press is prevented: it would start a text selection and move the
+ * focus away from the thumb that the caller has just focused.
+ */
+export function usePointerDrag({
+  trackRef,
+  disabled = false,
+  onStart,
+  onMove,
+  onEnd,
+}: PointerDragOptions): PointerDragHandlers {
+  // The pointer being tracked and how far from the centre of the thumb it took hold, as a fraction.
+  const drag = useRef<{ pointerId: number; grip: number } | null>(null);
+
+  const fractionAt = (clientX: number) => {
+    const rect = trackRef.current?.getBoundingClientRect();
+    if (!rect || rect.width <= 0) return 0;
+    return (clientX - rect.left) / rect.width;
+  };
+  const clamp01 = (fraction: number) => Math.min(Math.max(fraction, 0), 1);
+
+  const end = (event: PointerEvent<HTMLElement>) => {
+    if (drag.current?.pointerId !== event.pointerId) return;
+    // Cleared first: the browser releases the capture after `pointerup` and fires
+    // `lostpointercapture`, which must not end the drag a second time.
+    drag.current = null;
+    onEnd();
+  };
+
+  return {
+    onPointerDown: (event) => {
+      // Only the main button, and one pointer at a time.
+      if (disabled || event.button > 0 || event.isPrimary === false || drag.current) return;
+      const thumb = (event.target as Element).closest<HTMLElement>(THUMB);
+      let grip = 0;
+      const rect = trackRef.current?.getBoundingClientRect();
+      if (thumb && rect && rect.width > 0) {
+        const box = thumb.getBoundingClientRect();
+        grip = (event.clientX - (box.left + box.width / 2)) / rect.width;
+      }
+      drag.current = { pointerId: event.pointerId, grip };
+      try {
+        event.currentTarget.setPointerCapture?.(event.pointerId);
+      } catch {
+        // A pointer that is gone already (a synthetic one) cannot be captured; the drag still
+        // works while the pointer stays over the element.
+      }
+      onStart({ fraction: clamp01(fractionAt(event.clientX) - grip), thumb });
+    },
+    onPointerMove: (event) => {
+      if (drag.current?.pointerId !== event.pointerId) return;
+      onMove(clamp01(fractionAt(event.clientX) - drag.current.grip));
+    },
+    onPointerUp: end,
+    onPointerCancel: end,
+    onLostPointerCapture: end,
+    onMouseDown: (event) => {
+      if (!disabled) event.preventDefault();
+    },
+  };
+}
diff --git a/src/index.ts b/src/index.ts
index e451107..3097dbd 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -151,6 +151,8 @@ export type {
 export { SegmentedControl, SegmentedControlItem } from './components/segmented-control';
 export { NumberInput } from './components/number-input';
 export type { NumberInputProps } from './components/number-input';
+export { Slider } from './components/slider';
+export type { SliderProps, SliderValue } from './components/slider';
 export type {
   SegmentedControlItemProps,
   SegmentedControlProps,
diff --git a/src/styles/components/slider.css b/src/styles/components/slider.css
new file mode 100644
index 0000000..0f54402
--- /dev/null
+++ b/src/styles/components/slider.css
@@ -0,0 +1,116 @@
+/* Slider (spec phase 3 §4.3, mockup S3): a 4px track with the accent fill, a 16px white thumb like the
+   one of Switch, a glass bubble with the value always above the thumb, and tick dots under the track.
+   The root keeps 30px free above the control for the bubble, and 10px below it when there are dots, so
+   the bubble does not cover the label and the server HTML already has the right height. A disabled
+   slider has no bubble and does not keep the room. The 10px at each side of the root lets a thumb at
+   an end stay inside it. */
+@layer flg.components {
+  .flg-slider {
+    box-sizing: border-box;
+    padding: 30px 10px 0;
+    font-family: var(--flg-font-sans);
+  }
+  .flg-slider[data-ticks] {
+    padding-bottom: 10px;
+  }
+  .flg-slider[data-disabled] {
+    padding-top: 0;
+    opacity: 0.5;
+  }
+  .flg-slider-control {
+    position: relative;
+    height: 20px;
+    /* A drag must not select text. */
+    -webkit-user-select: none;
+    user-select: none;
+    /* The page still scrolls up and down from a touch that starts on the track; the thumb takes
+       every touch for itself. */
+    touch-action: pan-y;
+    cursor: pointer;
+  }
+  .flg-slider[data-disabled] .flg-slider-control {
+    cursor: not-allowed;
+  }
+  /* The control is as wide as the track, so a press in the 10px beside it would miss. This reaches it. */
+  .flg-slider-control::before {
+    content: '';
+    position: absolute;
+    inset: 0 -10px;
+  }
+  .flg-slider-track,
+  .flg-slider-fill {
+    position: absolute;
+    top: 50%;
+    box-sizing: border-box;
+    height: 4px;
+    translate: 0 -50%;
+    border-radius: var(--flg-radius-full);
+  }
+  .flg-slider-track {
+    inset-inline: 0;
+    background: var(--flg-control-track);
+  }
+  .flg-slider-fill {
+    left: var(--flg-slider-start, 0%);
+    width: calc(var(--flg-slider-end, 0%) - var(--flg-slider-start, 0%));
+    background: var(--flg-accent-gradient);
+  }
+  .flg-slider-ticks {
+    position: absolute;
+    inset-inline: 0;
+    top: calc(50% + 9px);
+  }
+  .flg-slider-ticks > i {
+    position: absolute;
+    width: 4px;
+    height: 4px;
+    translate: -50% 0;
+    border-radius: 50%;
+    background: var(--flg-slider-tick);
+  }
+  .flg-slider-thumb {
+    position: absolute;
+    top: 50%;
+    left: var(--flg-slider-pos, 0%);
+    box-sizing: border-box;
+    width: 16px;
+    height: 16px;
+    translate: -50% -50%;
+    border-radius: 50%;
+    background: var(--flg-control-thumb);
+    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
+    touch-action: none;
+    /* The ring below replaces the browser's own. */
+    outline: none;
+  }
+  .flg-slider-thumb:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow:
+      0 1px 3px rgba(0, 0, 0, 0.3),
+      var(--flg-focus-ring);
+  }
+  /* The thumb that a press focused has no ring: the ring is for the keyboard. */
+  .flg-slider[data-pointer-focus] .flg-slider-thumb:focus-visible {
+    outline: none;
+    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
+  }
+  /* A Surface for the glass; the rules here, one class deeper, win over its radius and position. The
+     thumb is its parent, so its bottom edge is 6px above the top of the thumb. */
+  .flg-slider .flg-slider-bubble {
+    position: absolute;
+    bottom: calc(100% + 6px);
+    left: 50%;
+    display: block;
+    height: 24px;
+    padding: 0 8px;
+    translate: -50% 0;
+    border-radius: var(--flg-radius-md);
+    color: var(--flg-text);
+    font-size: var(--flg-text-xs);
+    font-weight: var(--flg-weight-medium);
+    /* 24px less the 1px border of the Surface on each side. */
+    line-height: 22px;
+    white-space: nowrap;
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 9adb78d..10f8056 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -25,6 +25,7 @@
 @import './components/tabs.css';
 @import './components/segmented-control.css';
 @import './components/number-input.css';
+@import './components/slider.css';
 @import './components/accordion.css';
 @import './components/breadcrumb.css';
 @import './components/pagination.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index f04127d..2804f8b 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -228,6 +228,27 @@
     .flg-number-input:has(> input:disabled) > button {
       color: GrayText;
     }
+    /* A Slider: the track has a line, the fill is the selection colour, the thumb is a ring in the
+       text colour on the canvas, and the dots are text-coloured. The bubble is a Surface, which
+       already has its line above. Opting out of colour adjustment keeps the system colours named
+       here as they are, since the browser would otherwise replace a gradient or a shadow. */
+    .flg-slider-track {
+      border: 1px solid CanvasText;
+    }
+    .flg-slider-fill {
+      forced-color-adjust: none;
+      background: Highlight;
+    }
+    .flg-slider-ticks > i {
+      forced-color-adjust: none;
+      background: CanvasText;
+    }
+    .flg-slider-thumb {
+      forced-color-adjust: none;
+      border: 2px solid CanvasText;
+      background: Canvas;
+      box-shadow: none;
+    }
     /* A row of tabs that scrolls: the system scroll bar shows that it does, and a fade would lower
        the contrast this mode is for. */
     .flg-tabs-list[data-overflow] {
diff --git a/src/styles/theme/values.ts b/src/styles/theme/values.ts
index e91b4de..479e6cd 100644
--- a/src/styles/theme/values.ts
+++ b/src/styles/theme/values.ts
@@ -125,6 +125,8 @@ export const derivedTokens: TokenMap = {
   // with accent text, as an accent Badge.
   'selected-bg': 'var(--flg-accent-subtle)',
   'selected-text': 'var(--flg-accent-text)',
+  // The tick dots under a Slider track (mockup S3): the muted text colour at 70%.
+  'slider-tick': 'color-mix(in srgb, var(--flg-text-muted) 70%, transparent)',
 };
 
 /** No backdrop-filter support, or prefers-reduced-transparency: an almost opaque surface. */
@@ -151,6 +153,8 @@ export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: T
     // The solid accent of a highlighted item (spec §4.4).
     'selected-bg': 'var(--flg-highlight-bg)',
     'selected-text': 'var(--flg-highlight-text)',
+    // Solid, so the dots keep 3:1 against the surface (spec phase 3 §4.2).
+    'slider-tick': 'var(--flg-text-muted)',
   },
   light: {
     'glass-tint': 'rgb(250,251,255)',
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/slider
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/slider
pnpm build && pnpm check:package
pnpm check:contrast
```

Expected: 120 test PASS cho `slider` (58 × 2 project, và 4 test kiểu); `pnpm test:unit` 1350 PASS, 3 skip (kể cả `src/index.test.ts`); story `slider` 30 test PASS (5 story × 3 engine × 2 theme; axe đã bật); `check:contrast` PASS (chưa có cặp Slider). `check:package`: mọi check PASS trừ **`size`**: JS 31.97 kB trên 30.78 kB, CSS 7.18 kB trên 7.13 kB. Chưa ghi ngưỡng; Task 8 làm.

- [ ] **Step 5: Commit**

```bash
git add \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  src/components/slider/Slider.mdx \
  src/components/slider/Slider.stories.tsx \
  src/components/slider/Slider.test-d.ts \
  src/components/slider/Slider.test.tsx \
  src/components/slider/Slider.tsx \
  src/components/slider/index.ts \
  src/components/slider/use-pointer-drag.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/slider.css \
  src/styles/index.css \
  src/styles/preferences.css \
  src/styles/theme/values.ts
```
```bash
git commit -m "feat(slider): Slider with one thumb, the S3 look with a bubble and tick dots" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 7: `Slider` hai nút (range)

Spec §6.3 (Slider range), §3.3, §4.3. Một cặp số làm `value` hoặc `defaultValue` thì `Slider` thành range: gốc `role="group"` mang `name` và `id`, hai nút có tên theo `labels.minimum` và `labels.maximum` (mặc định "Minimum", "Maximum"), một input ẩn cho mỗi nút dưới cùng một `name` (nút thấp trước), và fill nằm giữa hai nút.
- Một nút dừng ở giá trị của nút kia (bằng nhau thì được); `aria-valuemax` của nút thấp là giá trị nút cao, `aria-valuemin` của nút cao là giá trị nút thấp.
- Nhấn lên track thì nút gần nhất nhảy tới (hoà thì chọn nút thấp); khi cả hai trùng giá trị, lần di chuyển đầu rời khỏi giá trị đó quyết định nút (phát hiện 8). Phím và Home/End dùng giới hạn của từng nút.
- Nút đang focus hoặc được kéo được nâng lên, để bong bóng của nó ở trên khi hai bong bóng chồng nhau (spec §4.3).
- Task này cũng sửa lỗi của Task 6: cờ `pointerFocus` đặt trước khi focus chuyển nên bị blur của nút cũ xoá (phát hiện 4).
- Cảnh báo dev: `value` không phải cặp hai số, cặp sai thứ tự (được đặt lại cho đúng), đổi giữa số và cặp.

**Files:**
- Modify: `src/components/slider/Slider.tsx`, `Slider.test.tsx`, `Slider.test-d.ts`, `Slider.stories.tsx`, `Slider.mdx`, `src/styles/components/slider.css`

**Interfaces:**
- Produces: prop `labels?: { minimum?: string; maximum?: string }` (chỉ có nghĩa với range); `SliderProps<[number, number]>` báo `[number, number]` ở `onValueChange` và `onValueCommit`.
  - Hàm nội bộ `apply(index, n)` (di chuyển một nút, trả về giá trị đã xin) và `limitsOf(index, values)`.
  - Stories `RangeDragging`, `RangeTrack`, `RangeKeyboard` (`no-visual`); `Look` có thêm hàng "Price range".
- Consumes: mọi thứ của Task 6.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/slider/Slider.stories.tsx b/src/components/slider/Slider.stories.tsx
index f15f30d..18784b8 100644
--- a/src/components/slider/Slider.stories.tsx
+++ b/src/components/slider/Slider.stories.tsx
@@ -1,7 +1,7 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
 import { useState } from 'react';
 import type { FormEvent } from 'react';
-import { expect, fn, userEvent, waitFor } from 'storybook/test';
+import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
 import { realUserEvent } from '../../../.storybook/real-input';
 import { Card } from '../card/Card';
 import { Field } from '../field/Field';
@@ -34,6 +34,9 @@ export const Look: Story = {
         <Field label="Volume" aside={value('60%')}>
           <Slider defaultValue={60} getValueText={(v) => `${v}%`} />
         </Field>
+        <Field label="Price range" aside={value('20 – 75 million')}>
+          <Slider defaultValue={[20, 75]} />
+        </Field>
         <Field label="Brightness" aside={value('3 / 5')}>
           <Slider min={1} max={5} defaultValue={3} getValueText={(v) => `${v} of 5`} />
         </Field>
@@ -62,6 +65,19 @@ export const Look: Story = {
     await expect(box(bubble).height).toBe(24);
     await expect(box(volume).top - box(bubble).bottom).toBeCloseTo(6, 0);
     await expect(bubble).toHaveTextContent('60%');
+    // The range slider: a group with two thumbs, and the fill runs from the one to the other.
+    const price = canvas.getByRole('group', { name: 'Price range' });
+    const [low, high] = within(price).getAllByRole('slider') as [HTMLElement, HTMLElement];
+    await expect(low).toHaveAccessibleName('Minimum');
+    await expect(high).toHaveAccessibleName('Maximum');
+    const priceBox = box(price.querySelector('.flg-slider-control') as Element);
+    const fill = box(price.querySelector('.flg-slider-fill') as Element);
+    await expect(fill.left - priceBox.left).toBeCloseTo(priceBox.width * 0.2, 0);
+    await expect(fill.width).toBeCloseTo(priceBox.width * 0.55, 0);
+    await expect(box(low).left + 8 - priceBox.left).toBeCloseTo(priceBox.width * 0.2, 0);
+    await expect(box(high).left + 8 - priceBox.left).toBeCloseTo(priceBox.width * 0.75, 0);
+    await expect(low.querySelector('.flg-slider-bubble')).toHaveTextContent('20');
+    await expect(high.querySelector('.flg-slider-bubble')).toHaveTextContent('75');
     // The 30px above the control are kept for the bubble, in the HTML itself.
     const root = control.parentElement as HTMLElement;
     await expect(box(control).top - box(root).top).toBe(30);
@@ -229,3 +245,146 @@ export const Keyboard: Story = {
     await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '30'));
   },
 };
+
+/**
+ * A real pointer on a range: each thumb is dragged, a thumb dragged past the other stops at its value,
+ * and with both on one value the first move says which of them goes.
+ */
+export const RangeDragging: Story = {
+  tags: ['no-visual'],
+  args: { defaultValue: [10, 90], 'aria-label': 'Price' },
+  render: (args) => (
+    <div style={{ width: 400, paddingTop: 20 }}>
+      <Slider {...args} />
+    </div>
+  ),
+  play: async ({ canvas, args }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const group = canvas.getByRole('group', { name: 'Price' });
+    const [low, high] = within(group).getAllByRole('slider') as [HTMLElement, HTMLElement];
+    const control = low.parentElement as HTMLElement;
+    const now = () => [low, high].map((thumb) => Number(thumb.getAttribute('aria-valuenow')));
+    const marks: HTMLElement[] = [];
+    const mark = (fraction: number) => {
+      const el = markAt(control, fraction);
+      marks.push(el);
+      return el;
+    };
+    try {
+      // The lower thumb from 10 to about 30; the upper one stays.
+      await real.dragAndDrop(low, mark(0.3));
+      await waitFor(() => expect(now()[0]).toBeGreaterThan(25));
+      await expect(now()[0]).toBeLessThanOrEqual(35);
+      await expect(now()[1]).toBe(90);
+      await expect(args.onValueCommit).toHaveBeenCalledTimes(1);
+      await expect(args.onValueCommit).toHaveBeenLastCalledWith(now());
+      await expect(low).toHaveFocus();
+      // The upper thumb to about 70.
+      await real.dragAndDrop(high, mark(0.7));
+      await waitFor(() => expect(now()[1]).toBeLessThan(75));
+      await expect(now()[1]).toBeGreaterThanOrEqual(65);
+      await expect(high).toHaveFocus();
+      // The upper thumb dragged far to the left stops at the lower one: they do not cross.
+      const lowAt = now()[0] as number;
+      await real.dragAndDrop(high, mark(0.02));
+      await waitFor(() => expect(now()).toEqual([lowAt, lowAt]));
+      // Both on one value, the upper thumb on top: the first move, to the right, takes the upper thumb, and the lower stays.
+      await real.dragAndDrop(high, mark(0.9));
+      await waitFor(() => expect(now()[1]).toBeGreaterThan(85));
+      await expect(now()[0]).toBe(lowAt);
+    } finally {
+      for (const el of marks) el.remove();
+    }
+  },
+};
+
+function TwoRanges() {
+  return (
+    <div style={{ width: 400, paddingTop: 20, display: 'grid', gap: 24 }}>
+      <Slider aria-label="Near the upper thumb" defaultValue={[10, 55]} />
+      <Slider aria-label="Near the lower thumb" defaultValue={[45, 90]} />
+    </div>
+  );
+}
+
+/** A press on the track moves the thumb nearest to it: the middle of the track is near one thumb of each slider. */
+export const RangeTrack: Story = {
+  tags: ['no-visual'],
+  render: () => <TwoRanges />,
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const parts = (name: string) => {
+      const group = canvas.getByRole('group', { name });
+      return {
+        control: group.firstElementChild as HTMLElement,
+        thumbs: within(group).getAllByRole('slider') as [HTMLElement, HTMLElement],
+      };
+    };
+    const upper = parts('Near the upper thumb');
+    await real.click(upper.control);
+    await waitFor(() => expect(upper.thumbs[1]).toHaveAttribute('aria-valuenow', '50'));
+    await expect(upper.thumbs[0]).toHaveAttribute('aria-valuenow', '10');
+    await expect(upper.thumbs[1]).toHaveFocus();
+    const lower = parts('Near the lower thumb');
+    await real.click(lower.control);
+    await waitFor(() => expect(lower.thumbs[0]).toHaveAttribute('aria-valuenow', '50'));
+    await expect(lower.thumbs[1]).toHaveAttribute('aria-valuenow', '90');
+    await expect(lower.thumbs[0]).toHaveFocus();
+  },
+};
+
+function RangeFormDemo() {
+  const [sent, setSent] = useState('');
+  const submit = (event: FormEvent<HTMLFormElement>) => {
+    event.preventDefault();
+    setSent(new FormData(event.currentTarget).getAll('price').join(','));
+  };
+  return (
+    <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: 320 }}>
+      <Field label="Price range">
+        <Slider name="price" defaultValue={[20, 70]} step={5} />
+      </Field>
+      <button type="submit">Save</button>
+      <button type="reset">Reset</button>
+      <output>{sent ? `Sent: ${sent}` : 'Nothing sent'}</output>
+    </form>
+  );
+}
+
+/** Real keys on both thumbs: each stops at the other, and the form gets both values, the lower first. */
+export const RangeKeyboard: Story = {
+  tags: ['no-visual'],
+  render: () => <RangeFormDemo />,
+  play: async ({ canvas }) => {
+    const real = await realUserEvent();
+    const [low, high] = canvas.getAllByRole('slider') as [HTMLElement, HTMLElement];
+    const output = canvas.getByRole('status');
+    if (!real) return;
+    await real.tab();
+    await expect(low).toHaveFocus();
+    await expect(low.matches(':focus-visible')).toBe(true);
+    await real.keyboard('{ArrowRight}{ArrowRight}');
+    await expect(low).toHaveAttribute('aria-valuenow', '30');
+    // The lower thumb stops at the upper one.
+    await real.keyboard('{End}');
+    await expect(low).toHaveAttribute('aria-valuenow', '70');
+    await expect(high).toHaveAttribute('aria-valuemin', '70');
+    await real.tab();
+    await expect(high).toHaveFocus();
+    await real.keyboard('{ArrowUp}{PageUp}');
+    await expect(high).toHaveAttribute('aria-valuenow', '85');
+    await real.keyboard('{Home}');
+    await expect(high).toHaveAttribute('aria-valuenow', '70');
+    await real.keyboard('{End}');
+    await expect(high).toHaveAttribute('aria-valuenow', '100');
+    await real.keyboard('{ArrowDown}');
+    await expect(high).toHaveAttribute('aria-valuenow', '95');
+    await real.click(canvas.getByRole('button', { name: 'Save' }));
+    await waitFor(() => expect(output).toHaveTextContent('Sent: 70,95'));
+    await real.click(canvas.getByRole('button', { name: 'Reset' }));
+    await waitFor(() => expect(high).toHaveAttribute('aria-valuenow', '70'));
+    await expect(low).toHaveAttribute('aria-valuenow', '20');
+  },
+};
diff --git a/src/components/slider/Slider.test-d.ts b/src/components/slider/Slider.test-d.ts
index 47fa940..df0ba01 100644
--- a/src/components/slider/Slider.test-d.ts
+++ b/src/components/slider/Slider.test-d.ts
@@ -42,3 +42,12 @@ test('Slider takes numbers for min, max and step, and a function for the words o
   // @ts-expect-error the slider has no size
   Slider({ size: 'md' });
 });
+
+test('Slider takes the words for the two thumbs of a range, each one optional', () => {
+  expectTypeOf<SliderProps<[number, number]>['labels']>().toEqualTypeOf<
+    { minimum?: string; maximum?: string } | undefined
+  >();
+  Slider({ defaultValue: [1, 2], labels: { maximum: 'Up to' } });
+  // @ts-expect-error only minimum and maximum are labelled
+  Slider({ defaultValue: [1, 2], labels: { middle: 'x' } });
+});
diff --git a/src/components/slider/Slider.test.tsx b/src/components/slider/Slider.test.tsx
index 8a2d4a5..9f91868 100644
--- a/src/components/slider/Slider.test.tsx
+++ b/src/components/slider/Slider.test.tsx
@@ -635,4 +635,416 @@ describe('Slider', () => {
       expect(thumb()).toHaveAttribute('aria-valuenow', '70');
     });
   });
+
+  describe('range', () => {
+    const thumbs = () => screen.getAllByRole('slider');
+    const values = () => thumbs().map((t) => t.getAttribute('aria-valuenow'));
+    const Price = (props: SliderProps<[number, number]>) => (
+      <Slider aria-label="Price" defaultValue={[20, 75]} {...props} />
+    );
+    /** The control is 200px wide: 2px per percent. A thumb is 16px, centred on its value. */
+    function layOutRange(container: HTMLElement) {
+      const control = layOut(container);
+      thumbs().forEach((t) => {
+        const centre = Number(t.getAttribute('aria-valuenow')) * 2;
+        t.getBoundingClientRect = () =>
+          ({ left: centre - 8, right: centre + 8, width: 16, height: 16 }) as DOMRect;
+      });
+      return control;
+    }
+
+    it('renders a group with two thumbs, the fill between them and one hidden input for each', () => {
+      const { container } = render(<Price name="price" />);
+      const root = container.firstElementChild as HTMLElement;
+      expect(root).toHaveAttribute('role', 'group');
+      expect(root).toHaveAttribute('data-range');
+      expect(root).toHaveAttribute('aria-label', 'Price');
+      const control = root.firstElementChild as HTMLElement;
+      expect(control.style.getPropertyValue('--flg-slider-start')).toBe('20%');
+      expect(control.style.getPropertyValue('--flg-slider-end')).toBe('75%');
+      expect(thumbs()).toHaveLength(2);
+      expect(thumbs().map((t) => t.style.getPropertyValue('--flg-slider-pos'))).toEqual([
+        '20%',
+        '75%',
+      ]);
+      expect(thumbs().map((t) => t.textContent)).toEqual(['20', '75']);
+      const inputs = Array.from(root.querySelectorAll('input'));
+      expect(inputs.map((i) => [i.type, i.name, i.value])).toEqual([
+        ['hidden', 'price', '20'],
+        ['hidden', 'price', '75'],
+      ]);
+    });
+
+    it('is not a group, and has no data-range, with one thumb', () => {
+      const { container } = render(<Volume defaultValue={5} />);
+      expect(container.firstElementChild).not.toHaveAttribute('role');
+      expect(container.firstElementChild).not.toHaveAttribute('data-range');
+    });
+
+    it('names the group, and the thumbs Minimum and Maximum, or the words of labels', () => {
+      const { unmount } = render(<Price />);
+      expect(screen.getByRole('group', { name: 'Price' })).toBeInTheDocument();
+      expect(thumbs().map((t) => t.getAttribute('aria-label'))).toEqual(['Minimum', 'Maximum']);
+      unmount();
+      render(<Price labels={{ minimum: 'Từ', maximum: 'Đến' }} />);
+      expect(thumbs().map((t) => t.getAttribute('aria-label'))).toEqual(['Từ', 'Đến']);
+    });
+
+    it('keeps the default word for a label that labels leaves out', () => {
+      render(<Price labels={{ maximum: 'Up to' }} />);
+      expect(thumbs().map((t) => t.getAttribute('aria-label'))).toEqual(['Minimum', 'Up to']);
+    });
+
+    it('takes the name of the group from aria-labelledby, and puts the id on the group', () => {
+      render(
+        <>
+          <span id="l">Price range</span>
+          <Slider aria-labelledby="l" defaultValue={[1, 2]} id="price" />
+        </>,
+      );
+      const group = screen.getByRole('group', { name: 'Price range' });
+      expect(group).toHaveAttribute('id', 'price');
+      for (const t of thumbs()) {
+        expect(t).not.toHaveAttribute('id');
+        expect(t).not.toHaveAttribute('aria-labelledby');
+      }
+    });
+
+    it('limits each thumb by the other in aria-valuemin and aria-valuemax', () => {
+      render(<Price min={10} max={90} />);
+      const limits = thumbs().map((t) => [
+        t.getAttribute('aria-valuemin'),
+        t.getAttribute('aria-valuemax'),
+      ]);
+      expect(limits).toEqual([
+        ['10', '75'],
+        ['20', '90'],
+      ]);
+    });
+
+    it('gives each thumb its own aria-valuetext and bubble text from getValueText', () => {
+      render(<Price getValueText={(v) => `${v} triệu`} />);
+      expect(thumbs().map((t) => t.getAttribute('aria-valuetext'))).toEqual([
+        '20 triệu',
+        '75 triệu',
+      ]);
+      expect(thumbs().map((t) => t.textContent)).toEqual(['20 triệu', '75 triệu']);
+    });
+
+    it('disables both thumbs and both inputs, and draws no bubble', () => {
+      const { container } = render(<Price disabled name="p" />);
+      for (const t of thumbs()) {
+        expect(t).toHaveAttribute('aria-disabled', 'true');
+        expect(t).not.toHaveAttribute('tabindex');
+        expect(t).toBeEmptyDOMElement();
+      }
+      for (const input of container.querySelectorAll('input')) expect(input).toBeDisabled();
+    });
+
+    it('sets aria-invalid, and aria-describedby from the Field, on both thumbs', () => {
+      render(
+        <Field label="Price" description="In millions" error="Too wide">
+          <Slider defaultValue={[20, 75]} />
+        </Field>,
+      );
+      for (const t of thumbs()) {
+        expect(t).toHaveAttribute('aria-invalid', 'true');
+        expect(t).toHaveAccessibleDescription('In millions Too wide');
+      }
+    });
+
+    it('is named by the label of the Field on the group', () => {
+      render(
+        <Field label="Price">
+          <Slider defaultValue={[20, 75]} id="price" />
+        </Field>,
+      );
+      const group = screen.getByRole('group', { name: 'Price' });
+      expect(group).toHaveAttribute('id', 'price');
+    });
+
+    it('moves each thumb with the keys, and reports a pair', async () => {
+      const onValueChange = vi.fn();
+      const onValueCommit = vi.fn();
+      render(<Price onValueChange={onValueChange} onValueCommit={onValueCommit} />);
+      const user = userEvent.setup();
+      thumbs()[0]!.focus();
+      await user.keyboard('{ArrowRight}{ArrowRight}');
+      expect(values()).toEqual(['22', '75']);
+      expect(onValueChange).toHaveBeenLastCalledWith([22, 75]);
+      thumbs()[1]!.focus();
+      await user.keyboard('{ArrowDown}{PageUp}');
+      expect(values()).toEqual(['22', '84']);
+      expect(onValueCommit).toHaveBeenCalledTimes(4);
+      expect(onValueCommit).toHaveBeenLastCalledWith([22, 84]);
+    });
+
+    it('stops a thumb at the value of the other with the keys, and lets them be equal', async () => {
+      render(<Price defaultValue={[20, 23]} />);
+      const user = userEvent.setup();
+      thumbs()[0]!.focus();
+      await user.keyboard('{PageUp}');
+      expect(values()).toEqual(['23', '23']);
+      await user.keyboard('{ArrowRight}');
+      expect(values()).toEqual(['23', '23']);
+      thumbs()[1]!.focus();
+      await user.keyboard('{PageDown}');
+      expect(values()).toEqual(['23', '23']);
+    });
+
+    it('sends Home and End to the limits of that thumb: the other thumb, or the end', async () => {
+      render(<Price min={10} max={90} />);
+      const user = userEvent.setup();
+      thumbs()[0]!.focus();
+      await user.keyboard('{End}');
+      expect(values()).toEqual(['75', '75']);
+      await user.keyboard('{Home}');
+      expect(values()).toEqual(['10', '75']);
+      thumbs()[1]!.focus();
+      await user.keyboard('{Home}');
+      expect(values()).toEqual(['10', '10']);
+      await user.keyboard('{End}');
+      expect(values()).toEqual(['10', '90']);
+    });
+
+    it('does not commit for a key that changes nothing', async () => {
+      const onValueCommit = vi.fn();
+      render(<Price defaultValue={[0, 100]} onValueCommit={onValueCommit} />);
+      thumbs()[0]!.focus();
+      await userEvent.setup().keyboard('{ArrowLeft}{Home}');
+      expect(onValueCommit).not.toHaveBeenCalled();
+    });
+
+    it('follows a controlled pair and reports what the user asks', async () => {
+      const onValueChange = vi.fn();
+      render(<Slider aria-label="Price" value={[20, 75]} onValueChange={onValueChange} />);
+      thumbs()[1]!.focus();
+      await userEvent.setup().keyboard('{ArrowRight}');
+      expect(onValueChange).toHaveBeenCalledWith([20, 76]);
+      expect(values()).toEqual(['20', '75']);
+    });
+
+    it('works as a controlled slider in a parent', async () => {
+      function Parent() {
+        const [value, setValue] = useState<[number, number]>([10, 30]);
+        return <Slider aria-label="Price" value={value} onValueChange={setValue} />;
+      }
+      render(<Parent />);
+      const user = userEvent.setup();
+      thumbs()[0]!.focus();
+      await user.keyboard('{ArrowRight}');
+      thumbs()[1]!.focus();
+      await user.keyboard('{ArrowLeft}');
+      expect(values()).toEqual(['11', '29']);
+    });
+
+    it('does not report a change when the parent builds a new array with the same numbers', () => {
+      const onValueChange = vi.fn();
+      const { rerender } = render(
+        <Slider aria-label="Price" value={[20, 75]} onValueChange={onValueChange} />,
+      );
+      rerender(<Slider aria-label="Price" value={[20, 75]} onValueChange={onValueChange} />);
+      expect(onValueChange).not.toHaveBeenCalled();
+      expect(values()).toEqual(['20', '75']);
+    });
+
+    it('puts a pair that is out of order the right way round, and warns', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Slider aria-label="Price" value={[75, 20]} />);
+      expect(values()).toEqual(['20', '75']);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('lower first'));
+    });
+
+    it('shows the nearest positions for a pair outside the range', () => {
+      render(<Slider aria-label="Price" value={[-5, 500]} />);
+      expect(values()).toEqual(['0', '100']);
+    });
+
+    it('warns, and does not throw, for a value that is not a pair of numbers', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      render(<Slider aria-label="Price" value={[Number.NaN, 40]} />);
+      expect(values()).toEqual(['0', '40']);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('pair of two numbers'));
+    });
+
+    it('warns when the value changes between a number and a pair', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { rerender } = render(<Slider aria-label="X" value={10} />);
+      expect(warn).not.toHaveBeenCalled();
+      rerender(<Slider aria-label="X" value={[10, 20]} />);
+      expect(warn).toHaveBeenCalledWith(expect.stringContaining('between a number and a pair'));
+      expect(values()).toEqual(['10', '20']);
+    });
+
+    it('moves the thumb nearest to a press on the track, and focuses it', () => {
+      const onValueChange = vi.fn();
+      const { container } = render(<Price onValueChange={onValueChange} />);
+      const control = layOutRange(container);
+      press(control, 60);
+      expect(values()).toEqual(['30', '75']);
+      expect(thumbs()[0]!).toHaveFocus();
+      expect(onValueChange).toHaveBeenLastCalledWith([30, 75]);
+      release(control, 60);
+      layOutRange(container);
+      press(control, 180);
+      expect(values()).toEqual(['30', '90']);
+      expect(thumbs()[1]!).toHaveFocus();
+      expect(container.firstElementChild).toHaveAttribute('data-pointer-focus');
+    });
+
+    it('picks the nearer thumb for a press between them', () => {
+      const { container } = render(<Price />);
+      const control = layOutRange(container);
+      // 45 is 25 from the lower thumb and 30 from the upper one.
+      press(control, 90);
+      expect(values()).toEqual(['45', '75']);
+      release(control, 90);
+      layOutRange(container);
+      // 65 is 20 from the lower thumb and 10 from the upper one.
+      press(control, 130);
+      expect(values()).toEqual(['45', '65']);
+    });
+
+    it('goes on as a drag of the thumb that the press moved', () => {
+      const { container } = render(<Price />);
+      const control = layOutRange(container);
+      press(control, 180);
+      move(control, 140);
+      expect(values()).toEqual(['20', '70']);
+    });
+
+    it('keeps the grip on a thumb that is pressed, and drags only that thumb', () => {
+      const { container } = render(<Price />);
+      const control = layOutRange(container);
+      press(thumbs()[1]!, 155);
+      expect(values()).toEqual(['20', '75']);
+      move(control, 175);
+      expect(values()).toEqual(['20', '85']);
+    });
+
+    it('does not let a dragged thumb pass the other: it stops at its value', () => {
+      const { container } = render(<Price />);
+      const control = layOutRange(container);
+      press(thumbs()[0]!, 40);
+      move(control, 190);
+      expect(values()).toEqual(['75', '75']);
+      move(control, 20);
+      expect(values()).toEqual(['10', '75']);
+      release(control, 20);
+      layOutRange(container);
+      press(thumbs()[1]!, 150);
+      move(control, 2);
+      expect(values()).toEqual(['10', '10']);
+    });
+
+    it('lets the thumbs be equal, and picks the thumb to drag by the first move', () => {
+      const first = render(<Price defaultValue={[50, 50]} />);
+      let control = layOutRange(first.container);
+      press(thumbs()[1]!, 100);
+      expect(values()).toEqual(['50', '50']);
+      move(control, 120);
+      expect(values()).toEqual(['50', '60']);
+      expect(thumbs()[1]!).toHaveFocus();
+      release(control, 120);
+      first.unmount();
+      const second = render(<Price defaultValue={[50, 50]} />);
+      control = layOutRange(second.container);
+      press(thumbs()[1]!, 100);
+      move(control, 80);
+      expect(values()).toEqual(['40', '50']);
+      expect(thumbs()[0]!).toHaveFocus();
+    });
+
+    it('waits for a move that leaves the shared value before it picks a thumb', () => {
+      const { container } = render(<Price defaultValue={[50, 50]} step={10} />);
+      const control = layOutRange(container);
+      press(control, 100);
+      // 3px is less than half a step of 10 (10px): the value is still 50.
+      move(control, 103);
+      expect(values()).toEqual(['50', '50']);
+      move(control, 60);
+      expect(values()).toEqual(['30', '50']);
+    });
+
+    it('commits the pair once at the release, and not when the drag ended where it began', () => {
+      const onValueCommit = vi.fn();
+      const { container } = render(<Price onValueCommit={onValueCommit} />);
+      const control = layOutRange(container);
+      press(thumbs()[0]!, 40);
+      move(control, 60);
+      move(control, 80);
+      expect(onValueCommit).not.toHaveBeenCalled();
+      release(control, 80);
+      expect(onValueCommit).toHaveBeenCalledTimes(1);
+      expect(onValueCommit).toHaveBeenCalledWith([40, 75]);
+      layOutRange(container);
+      press(thumbs()[1]!, 150);
+      move(control, 170);
+      move(control, 150);
+      release(control, 150);
+      expect(onValueCommit).toHaveBeenCalledTimes(1);
+    });
+
+    it('rounds the pointer onto the grid and keeps each thumb inside [min, max]', () => {
+      const { container } = render(<Price defaultValue={[20, 80]} step={10} />);
+      const control = layOutRange(container);
+      press(control, 18);
+      expect(values()).toEqual(['10', '80']);
+      move(control, -50);
+      expect(values()).toEqual(['0', '80']);
+    });
+
+    it('ignores a press on a disabled range slider', () => {
+      const { container } = render(<Price disabled />);
+      const control = layOutRange(container);
+      press(control, 100);
+      expect(values()).toEqual(['20', '75']);
+    });
+
+    it('draws the dots of a range with few steps', () => {
+      const { container } = render(<Price min={0} max={5} defaultValue={[1, 4]} />);
+      expect(container.querySelectorAll('.flg-slider-ticks > i')).toHaveLength(6);
+    });
+
+    it('submits both values under one name, the lower first, and sends none when disabled', () => {
+      const { rerender } = render(
+        <form data-testid="form">
+          <Price name="price" />
+        </form>,
+      );
+      const form = () => screen.getByTestId('form') as HTMLFormElement;
+      expect(new FormData(form()).getAll('price')).toEqual(['20', '75']);
+      rerender(
+        <form data-testid="form">
+          <Price name="price" disabled />
+        </form>,
+      );
+      expect(new FormData(form()).has('price')).toBe(false);
+    });
+
+    it('puts an uncontrolled range back to its default when the form is reset, and not a controlled one', async () => {
+      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
+      const { rerender } = render(
+        <form data-testid="form">
+          <Price name="price" />
+        </form>,
+      );
+      const form = () => screen.getByTestId('form') as HTMLFormElement;
+      thumbs()[1]!.focus();
+      await userEvent.setup().keyboard('{End}');
+      expect(values()).toEqual(['20', '100']);
+      act(() => form().reset());
+      await settle();
+      expect(values()).toEqual(['20', '75']);
+      expect(new FormData(form()).getAll('price')).toEqual(['20', '75']);
+      rerender(
+        <form data-testid="form">
+          <Slider aria-label="Price" name="price" value={[30, 40]} />
+        </form>,
+      );
+      act(() => form().reset());
+      await settle();
+      expect(values()).toEqual(['30', '40']);
+    });
+  });
 });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/slider
```

Expected: FAIL ở 30 trong 38 test mới của nhóm `range`, cộng test kiểu `takes the words for the two thumbs of a range` (`Property 'labels' does not exist on type 'SliderProps<[number, number]>'`). Một số dòng lỗi: `renders a group with two thumbs…` (`toHaveAttribute("role", "group")`), `stops a thumb at the value of the other…` (`['30']` mong đợi `['23','23']`), `moves the thumb nearest to a press on the track, and focuses it` (`['30']` mong đợi `['30','75']`, sau đó đến lỗi cờ `data-pointer-focus`). Tám test phủ định hoặc một nút pass sẵn trên code cũ (như `is not a group, and has no data-range, with one thumb`). Story range viết sau code (xem mục 17).

- [ ] **Step 3: Viết code**

```diff
diff --git a/src/components/slider/Slider.mdx b/src/components/slider/Slider.mdx
index 9922d51..376c871 100644
--- a/src/components/slider/Slider.mdx
+++ b/src/components/slider/Slider.mdx
@@ -29,6 +29,40 @@ changed the value. Use it to save, and `onValueChange` to update what you show.
 A controlled slider shows what it is given; a value outside the range, or one that is not a number,
 is drawn at the nearest end, and the parent keeps what it passed.
 
+## A range
+
+A pair as `value` or `defaultValue` gives a slider with two thumbs: a range. The type follows the
+value, so with `defaultValue={[20, 75]}` the callbacks receive a `[number, number]`, and with a number
+they receive a number.
+
+```tsx
+<Field label="Price range" aside={<span aria-hidden="true">20 – 75 million</span>}>
+  <Slider
+    name="price"
+    defaultValue={[20, 75]}
+    labels={{ minimum: 'Lowest price', maximum: 'Highest price' }}
+    onValueCommit={([lowest, highest]) => save(lowest, highest)}
+  />
+</Field>
+```
+
+<Canvas of={Stories.RangeTrack} />
+
+- **The thumbs do not cross.** A thumb stops at the value of the other, and the two may be equal. With
+  the keys, Home and End take a thumb to its own limits: the lowest value or the other thumb for the
+  first, the other thumb or the highest value for the second.
+- **A press on the track moves the nearest thumb** to the pointer, and goes on as a drag. A press on a
+  thumb keeps the grip, as with one thumb. With both thumbs on one value the first move away from it
+  chooses the thumb: to the right is the second, to the left the first.
+- **Each thumb has a bubble.** When the thumbs are close the bubbles overlap, and the bubble of the
+  thumb that has the focus, or that is being dragged, is on top.
+- **The pair is the value.** A pair that is out of order is shown the right way round (and warned
+  about), a number that is out of range is clamped, and a value that is not a pair of two numbers is
+  drawn with the missing end at the end of the range. The kind of slider is fixed for its life: do not
+  change a value between a number and a pair.
+
+<Canvas of={Stories.RangeDragging} />
+
 ## The bubble, the dots and the words for a value
 
 The bubble above the thumb always shows the value, as a number or as `getValueText(value)`
@@ -43,8 +77,9 @@ steps that should look continuous, `ticks` for one with more than ten that shoul
 
 A Slider is a group for a Field: the label is a `<span>` that names the thumb through
 `aria-labelledby`, not a `<label for>`, because that cannot point at an element with the `slider`
-role. `description`, `error` and `disabled` of the Field reach the thumb; `required` does not apply,
-because a slider always has a value.
+role. `description`, `error` and `disabled` of the Field reach the thumb (both thumbs of a range);
+`required` does not apply, because a slider always has a value. A range is named on its group: the
+label of the Field, `aria-label` or `aria-labelledby` name the `role="group"` root, and `id` goes there.
 
 **Show the value in the label row with the `aside` of the Field.** Slider does not draw it: the text
 differs from the bubble (`60%`, `20 – 75 million`, `3 / 5`), so only you know what it should say.
@@ -68,7 +103,7 @@ thumb takes the touch, and the track leaves vertical scrolling to the page.
 | ← or ↓           | One `step` less                                                                          |
 | → or ↑           | One `step` more                                                                          |
 | PageDown, PageUp | One `largeStep` less or more (default: about a tenth of the range, a multiple of `step`) |
-| Home, End        | The lowest and the highest value                                                         |
+| Home, End        | The lowest and the highest value (of a range: the limits of that thumb)                  |
 
 A key with Alt, Ctrl or Meta is left to the browser.
 
@@ -77,16 +112,21 @@ A key with Alt, Ctrl or Meta is left to the browser.
 ## Forms
 
 A hidden input with `name` carries the value as a plain number (`String(value)`) and is not sent when
-the slider is `disabled`. A form reset puts an uncontrolled slider back to its `defaultValue` (or `min`);
-a controlled one keeps the value it is given.
+the slider is `disabled`. A range has two, with one `name`, the lower value first, so
+`FormData.getAll(name)` is `["20", "75"]`. A form reset puts an uncontrolled slider back to its
+`defaultValue` (or `min`); a controlled one keeps the value it is given.
 
 <Canvas of={Stories.Keyboard} />
+<Canvas of={Stories.RangeKeyboard} />
 
 ## Accessibility
 
 - The thumb is a `<span role="slider">` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`,
   `aria-valuetext` (when you give `getValueText`) and `aria-orientation="horizontal"`. `id`,
   `aria-label` and `aria-labelledby` go on it. A slider without a name gets a warning in development.
+- A range is a `role="group"` with the name, and its thumbs are named `labels.minimum` and
+  `labels.maximum` ("Minimum" and "Maximum" by default; translate them). The `aria-valuemax` of the first
+  thumb is the value of the second, and the `aria-valuemin` of the second is the value of the first.
 - A disabled thumb has `aria-disabled="true"` and is not in the Tab order.
 - The bubble is `aria-hidden`: it repeats what `aria-valuetext` says.
 - The tick dots are decoration. The focus ring is on the thumb.
diff --git a/src/components/slider/Slider.tsx b/src/components/slider/Slider.tsx
index 531445d..5365f06 100644
--- a/src/components/slider/Slider.tsx
+++ b/src/components/slider/Slider.tsx
@@ -56,10 +56,17 @@ export type SliderProps<V extends SliderValue = number> = Omit<
   ticks?: boolean;
   /** The words for a value, in the bubble and in `aria-valuetext` (`"60%"`, `"3 of 5"`). */
   getValueText?: (value: number) => string;
+  /** The names of the two thumbs of a range. Default `"Minimum"` and `"Maximum"`. */
+  labels?: { minimum?: string; maximum?: string };
 };
 
-const isNumber = (n: number | undefined): n is number =>
-  typeof n === 'number' && Number.isFinite(n);
+const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
+
+/** One of the numbers a slider holds; the index is always one that it has. */
+const nth = (values: readonly number[], index: number) => values[index] ?? 0;
+
+const sameValues = (a: readonly number[], b: readonly number[]) =>
+  a.length === b.length && a.every((n, i) => n === b[i]);
 
 /** A fraction as a percentage for CSS, without the noise of floating point. */
 const percent = (fraction: number) => `${Number((fraction * 100).toFixed(4))}%`;
@@ -71,6 +78,10 @@ const percent = (fraction: number) => `${Number((fraction * 100).toFixed(4))}%`;
  * hidden input with `name` carries the value to the form. `ref`, `className` and `style` belong to
  * the root; `id` and the `aria-*` props that name the slider go on the thumb.
  *
+ * A pair as `value` or `defaultValue` makes it a range with two thumbs, which cannot pass each other.
+ * The root is then a `group` that has the name and the `id`, each thumb has a hidden input with the
+ * `name`, and `labels` names the thumbs.
+ *
  * The value shown beside the label is not drawn here: pass it to the `aside` of the Field.
  */
 export const Slider = markAsFieldGroup(
@@ -87,6 +98,7 @@ export const Slider = markAsFieldGroup(
       name,
       ticks,
       getValueText,
+      labels,
       className,
       ...props
     }: SliderProps<SliderValue>,
@@ -149,17 +161,56 @@ export const Slider = markAsFieldGroup(
       return clamp(fitted, min, max);
     };
 
-    const first = (v: SliderValue | undefined) => (Array.isArray(v) ? v[0] : v);
-    const [current, setValue, resetValue] = useControllableState<number>({
-      value: first(value),
-      defaultValue: first(defaultValue) ?? min,
-      onChange: onValueChange as ((value: number) => void) | undefined,
+    // A pair is a range, a number is one thumb.
+    const isRange = Array.isArray(value ?? defaultValue);
+    const wasRange = useRef(isRange);
+    useEffect(() => {
+      if (wasRange.current === isRange) return;
+      devWarn(
+        'Slider is changing between a number and a pair (one thumb and a range). ' +
+          'Pick one for the lifetime of the component.',
+      );
+      wasRange.current = isRange;
+    }, [isRange]);
+
+    const [current, setValue, resetValue] = useControllableState<SliderValue>({
+      value,
+      defaultValue: defaultValue ?? min,
+      onChange: onValueChange as ((value: SliderValue) => void) | undefined,
       name: 'Slider value',
     });
+    const malformed =
+      isRange && !(Array.isArray(current) && current.length === 2 && current.every(isNumber));
+    const unordered =
+      Array.isArray(current) &&
+      isNumber(current[0]) &&
+      isNumber(current[1]) &&
+      current[0] > current[1];
+    useEffect(() => {
+      if (malformed) {
+        devWarn('Slider: the value of a range must be a pair of two numbers, [lower, higher].');
+      }
+    }, [malformed]);
+    useEffect(() => {
+      if (unordered) {
+        devWarn('Slider: a range is [lower, higher], lower first; the pair was put in order.');
+      }
+    }, [unordered]);
+
     // What is shown for a value the parent gave that is not a number or is outside the range: the
-    // nearest position. The parent is not told; it still has what it passed.
-    const shown = isNumber(current) ? clamp(current, min, max) : min;
-    const position = percent(range > 0 ? (shown - min) / range : 0);
+    // nearest position, and for a missing end of a pair the end of the range. The parent is not told;
+    // it still has what it passed. A pair out of order is drawn the right way round.
+    const toValues = (raw: SliderValue): number[] => {
+      const at = (n: unknown, missing: number) => (isNumber(n) ? clamp(n, min, max) : missing);
+      if (!isRange) return [at(Array.isArray(raw) ? raw[0] : raw, min)];
+      const pair: unknown[] = Array.isArray(raw) ? raw : [];
+      const [lower, higher] = [at(pair[0], min), at(pair[1], max)];
+      return lower <= higher ? [lower, higher] : [higher, lower];
+    };
+    const shown = toValues(current);
+    const report = (values: number[]): SliderValue =>
+      isRange ? [nth(values, 0), nth(values, 1)] : nth(values, 0);
+    const positionOf = (n: number) => percent(range > 0 ? (n - min) / range : 0);
 
     // What the slider holds right now. A drag moves faster than React renders, and each move must
     // start from the one before, so the handlers read this ref, which the commit writes and which a
@@ -169,56 +220,105 @@ export const Slider = markAsFieldGroup(
       live.current = shown;
     });
     // The value the user last asked for, which a parent that refuses it does not show.
-    const requested = useRef<number | null>(null);
-    const apply = (next: number) => {
+    const requested = useRef<number[] | null>(null);
+    // Moves one thumb to `n`, which is inside its limits, and returns the value that was asked for.
+    const apply = (index: number, n: number) => {
+      const next = [...live.current];
+      next[index] = n;
       requested.current = next;
-      if (value === undefined) live.current = next;
-      setValue(next);
+      if (!sameValues(next, live.current)) {
+        if (value === undefined) live.current = next;
+        setValue(report(next));
+      }
+      return next;
+    };
+    // A thumb of a range stops at the other one: the first has `min` below it, the second `max` above.
+    const limitsOf = (index: number, values: number[]): [number, number] => [
+      index === 1 ? nth(values, 0) : min,
+      index === 0 && isRange ? nth(values, 1) : max,
+    ];
+    // Puts a number onto the grid, inside the limits of the thumb.
+    const place = (index: number, n: number) => {
+      const [lower, upper] = limitsOf(index, live.current);
+      return clamp(fit(n), lower, upper);
     };
 
     const controlRef = useRef<HTMLDivElement>(null);
-    const thumbRef = useRef<HTMLSpanElement>(null);
+    const thumbRefs = useRef<(HTMLSpanElement | null)[]>([]);
     const hiddenRef = useRef<HTMLInputElement>(null);
-    const defaultRef = useRef(first(defaultValue));
+    const defaultRef = useRef(defaultValue);
     useWriteOnCommit(() => {
-      defaultRef.current = first(defaultValue);
+      defaultRef.current = defaultValue;
     });
     // The form resets the hidden input behind React's back; put the value back with it.
     useFormReset(hiddenRef, () => resetValue(defaultRef.current ?? min));
 
-    const commitRef = useRef(onValueCommit as ((value: number) => void) | undefined);
+    const commitRef = useRef(onValueCommit as ((value: SliderValue) => void) | undefined);
     useWriteOnCommit(() => {
-      commitRef.current = onValueCommit as ((value: number) => void) | undefined;
+      commitRef.current = onValueCommit as ((value: SliderValue) => void) | undefined;
     });
-    // Whether the thumb has the focus because of a press, not because of the keyboard. Browsers
+    // Whether a thumb has the focus because of a press, not because of the keyboard. Browsers
     // disagree on whether a `focus()` from a press matches :focus-visible, so the ring is decided here.
     const [pointerFocus, setPointerFocus] = useState(false);
+    // The press focuses the thumb so the keys go on from there. It is not keyboard focus, so the
+    // ring does not show. The flag is set after the focus moves: the thumb that loses it clears the flag.
+    const focusThumb = (index: number) => {
+      thumbRefs.current[index]?.focus({ preventScroll: true });
+      setPointerFocus(true);
+    };
     // Where the value stood when the press began, to tell whether the drag changed it.
     const startedAt = useRef(shown);
-    const moveTo = (fraction: number) => apply(fit(min + fraction * range));
+    // The thumb that the drag moves, or -1 while that is not known: with both thumbs on one value,
+    // the first move away from it says which of them the pointer takes.
+    const dragged = useRef(0);
+    const moveTo = (fraction: number) => {
+      const target = min + fraction * range;
+      if (dragged.current < 0) {
+        const shared = nth(live.current, 0);
+        const fitted = fit(target);
+        if (fitted === shared) return;
+        dragged.current = fitted < shared ? 0 : 1;
+        focusThumb(dragged.current);
+      }
+      apply(dragged.current, place(dragged.current, target));
+    };
     const dragHandlers = usePointerDrag({
       trackRef: controlRef,
       disabled,
-      onStart: ({ fraction }) => {
+      onStart: ({ fraction, thumb }) => {
         startedAt.current = live.current;
         requested.current = null;
+        const pressed = thumb ? thumbRefs.current.indexOf(thumb) : -1;
+        const lower = nth(live.current, 0);
+        const higher = nth(live.current, 1);
+        if (!isRange) {
+          dragged.current = 0;
+        } else if (lower === higher) {
+          dragged.current = -1;
+        } else if (pressed >= 0) {
+          dragged.current = pressed;
+        } else {
+          // A press on the track takes the thumb nearest to it.
+          const at = min + fraction * range;
+          dragged.current = Math.abs(at - lower) <= Math.abs(at - higher) ? 0 : 1;
+        }
         moveTo(fraction);
-        // The press focuses the thumb so the keys go on from there. It is not keyboard focus, so
-        // the ring does not show.
-        setPointerFocus(true);
-        thumbRef.current?.focus({ preventScroll: true });
+        focusThumb(dragged.current >= 0 ? dragged.current : Math.max(pressed, 0));
       },
       onMove: moveTo,
       onEnd: () => {
         const settled = requested.current;
-        if (settled !== null && settled !== startedAt.current) commitRef.current?.(settled);
+        if (settled !== null && !sameValues(settled, startedAt.current)) {
+          commitRef.current?.(report(settled));
+        }
       },
     });
 
-    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
+    const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLSpanElement>) => {
       setPointerFocus(false);
       if (disabled || hasModifier(event)) return;
-      const from = live.current;
+      const from = nth(live.current, index);
+      const [lower, upper] = limitsOf(index, live.current);
       let next: number;
       switch (event.key) {
         case 'ArrowLeft':
@@ -236,41 +336,62 @@ export const Slider = markAsFieldGroup(
           next = from + largeStep;
           break;
         case 'Home':
-          next = min;
+          next = lower;
           break;
         case 'End':
-          next = max;
+          next = upper;
           break;
         default:
           return;
       }
       event.preventDefault();
-      next = fit(next);
-      if (next === live.current) return;
-      apply(next);
-      commitRef.current?.(next);
+      next = place(index, next);
+      if (next === from) return;
+      const asked = apply(index, next);
+      commitRef.current?.(report(asked));
     };
 
     // The dots are at the steps of the grid, the ends included. A range of at most ten steps shows
     // them by itself.
     const intervals = range > 0 ? Math.floor(range / step + 1e-9) : 0;
     const showTicks = (ticks ?? range / step <= 10 + 1e-9) && intervals > 0;
-    const text = getValueText ? getValueText(shown) : String(shown);
+    const textOf = (n: number) => (getValueText ? getValueText(n) : String(n));
+    // One thumb is named by the name of the slider. In a range the group has that name (and the id),
+    // and its thumbs are told apart by `labels`.
+    const groupProps = isRange
+      ? {
+          role: 'group',
+          id: labelled ? id : props.id,
+          'aria-label': ariaLabel,
+          'aria-labelledby': labelledBy,
+        }
+      : undefined;
+    const thumbName = (index: number) =>
+      isRange
+        ? (labels?.[index === 0 ? 'minimum' : 'maximum'] ?? ['Minimum', 'Maximum'][index])
+        : ariaLabel;
 
     return (
       <div
         ref={ref}
         className={clsx('flg-slider', className)}
+        data-range={dataAttr(isRange)}
         data-ticks={dataAttr(showTicks)}
         data-disabled={dataAttr(disabled)}
         data-invalid={dataAttr(invalid)}
         data-pointer-focus={dataAttr(pointerFocus)}
+        {...groupProps}
         {...rootProps}
       >
         <div
           ref={controlRef}
           className="flg-slider-control"
-          style={{ '--flg-slider-start': '0%', '--flg-slider-end': position } as CSSProperties}
+          style={
+            {
+              '--flg-slider-start': isRange ? positionOf(nth(shown, 0)) : '0%',
+              '--flg-slider-end': positionOf(nth(shown, shown.length - 1)),
+            } as CSSProperties
+          }
           {...dragHandlers}
         >
           <span className="flg-slider-track" aria-hidden="true" />
@@ -282,44 +403,55 @@ export const Slider = markAsFieldGroup(
               ))}
             </span>
           ) : null}
-          {/* A disabled slider is not focusable, as a native control that is disabled. */}
-          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
-          <span
-            ref={thumbRef}
-            role="slider"
-            tabIndex={disabled ? undefined : 0}
-            className="flg-slider-thumb"
-            style={{ '--flg-slider-pos': position } as CSSProperties}
-            id={labelled ? id : props.id}
-            aria-valuemin={min}
-            aria-valuemax={max}
-            aria-valuenow={shown}
-            aria-valuetext={getValueText ? text : undefined}
-            aria-orientation="horizontal"
-            aria-label={ariaLabel}
-            aria-labelledby={labelledBy}
-            aria-describedby={ariaDescribedBy}
-            aria-invalid={ariaInvalid}
-            aria-disabled={disabled ? true : undefined}
-            onKeyDown={handleKeyDown}
-            onBlur={() => setPointerFocus(false)}
-          >
-            {disabled ? null : (
-              <span className="flg-surface flg-slider-bubble" aria-hidden="true">
-                {text}
+          {shown.map((n, index) => {
+            const [lower, upper] = limitsOf(index, shown);
+            return (
+              // A disabled slider is not focusable, as a native control that is disabled.
+              // eslint-disable-next-line jsx-a11y/interactive-supports-focus
+              <span
+                key={index}
+                ref={(el) => {
+                  thumbRefs.current[index] = el;
+                }}
+                role="slider"
+                tabIndex={disabled ? undefined : 0}
+                className="flg-slider-thumb"
+                style={{ '--flg-slider-pos': positionOf(n) } as CSSProperties}
+                id={isRange ? undefined : labelled ? id : props.id}
+                aria-valuemin={lower}
+                aria-valuemax={upper}
+                aria-valuenow={n}
+                aria-valuetext={getValueText ? textOf(n) : undefined}
+                aria-orientation="horizontal"
+                aria-label={thumbName(index)}
+                aria-labelledby={isRange ? undefined : labelledBy}
+                aria-describedby={ariaDescribedBy}
+                aria-invalid={ariaInvalid}
+                aria-disabled={disabled ? true : undefined}
+                onKeyDown={handleKeyDown(index)}
+                onBlur={() => setPointerFocus(false)}
+              >
+                {disabled ? null : (
+                  <span className="flg-surface flg-slider-bubble" aria-hidden="true">
+                    {textOf(n)}
+                  </span>
+                )}
               </span>
-            )}
-          </span>
+            );
+          })}
         </div>
-        {name === undefined ? null : (
-          <input
-            ref={hiddenRef}
-            type="hidden"
-            name={name}
-            value={String(shown)}
-            disabled={disabled}
-          />
-        )}
+        {name === undefined
+          ? null
+          : shown.map((n, index) => (
+              <input
+                key={index}
+                ref={index === 0 ? hiddenRef : undefined}
+                type="hidden"
+                name={name}
+                value={String(n)}
+                disabled={disabled}
+              />
+            ))}
       </div>
     );
   }) as <V extends SliderValue = number>(
diff --git a/src/styles/components/slider.css b/src/styles/components/slider.css
index 0f54402..96851c1 100644
--- a/src/styles/components/slider.css
+++ b/src/styles/components/slider.css
@@ -90,6 +90,11 @@
       0 1px 3px rgba(0, 0, 0, 0.3),
       var(--flg-focus-ring);
   }
+  /* The bubbles of the two thumbs of a range overlap when the thumbs are close. The thumb that has the
+     focus, which a drag gives it too, goes on top, with its bubble inside it. */
+  .flg-slider-thumb:focus {
+    z-index: 1;
+  }
   /* The thumb that a press focused has no ring: the ring is for the keyboard. */
   .flg-slider[data-pointer-focus] .flg-slider-thumb:focus-visible {
     outline: none;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/slider
pnpm test:unit
pnpm vitest run --project storybook-light --project storybook-dark src/components/slider
pnpm build && pnpm check:package
```

Expected: 189 test PASS cho `slider` (92 × 2 project, và 5 test kiểu); `pnpm test:unit` 1419 PASS, 3 skip; story `slider` 48 test PASS (8 story × 3 engine × 2 theme). `check:package`: mọi check PASS trừ **`size`**: JS 32.6 kB trên 30.78 kB, CSS 7.18 kB trên 7.13 kB. Chưa ghi ngưỡng.

- [ ] **Step 5: Commit**

```bash
git add \
  src/components/slider/Slider.mdx \
  src/components/slider/Slider.stories.tsx \
  src/components/slider/Slider.test-d.ts \
  src/components/slider/Slider.test.tsx \
  src/components/slider/Slider.tsx \
  src/styles/components/slider.css
```
```bash
git commit -m "feat(slider): range mode with two thumbs that do not cross" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 8: Cặp tương phản, reset form không `name`, ngưỡng kích thước, kiểm tra cuối

Spec §3.1, §4.4, §4.9 của spec 0+1 và §7.
- **Tương phản.** `check:contrast` đo thêm `slider-bubble-text` (4.5), `slider-tick`, `slider-track`, `slider-thumb` và `stepper-icon` (3), trên kính thường và trên panel có scrim, giữ số thấp hơn. Chữ bong bóng (9.93 sáng / 6.80 tối) và icon của `NumberInput` (7.44 / 3.71) pass. Chấm bước, track và nút không đạt ở theme mặc định đúng như mockup S3 vẽ, nên thành dòng ngoại lệ 15, 16, 17 (bảng ở phát hiện 11; ghi trong `scripts/contrast-exceptions.ts`, bảng spec 0+1 §4.9, `ExceptionTable.test.tsx`, và câu "mười bốn" đổi thành "mười bảy").
- **Contrast-more.** `preferences.css` cho Slider: track có viền trong 1px màu `control-border`, fill màu chữ, nút có mặt kính với viền chữ 2px. Sau đó cả ba cặp pass (track 3.10 / 3.32, nút 11.85 / 10.65, chấm 7.65 / 10.43). Giao diện mặc định không đổi, nên không đổi ảnh chuẩn.
- **Reset không `name`.** `useFormReset` tìm form bằng `element.form ?? element.closest('form')`; `Slider` theo dõi div điều khiển của nó (bỏ `hiddenRef`). `NumberInput` đã reset được vì input nhìn thấy thuộc form; test mới chỉ ghi lại điều đó.
- **Ngưỡng kích thước** ghi bằng `pnpm size:record` (không chép `.size-limit.json`).

**Files:**
- Modify: `.size-limit.json`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`, `scripts/contrast-exceptions.ts`, `scripts/lib/contrast.ts`, `src/components/number-input/NumberInput.test.tsx`, `src/components/slider/Slider.test.tsx`, `Slider.tsx`, `src/docs/ExceptionTable.test.tsx`, `src/internal/use-form-reset.test.tsx`, `use-form-reset.ts`, `src/styles/preferences.css`

**Interfaces:**
- Produces: `useFormReset` rơi về `closest('form')`; ba dòng ngoại lệ §4.9 số 15 đến 17; ngưỡng mới JS 35860 B, CSS 7929 B.
- Consumes: mọi thứ ở Task 1 đến 7.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/number-input/NumberInput.test.tsx b/src/components/number-input/NumberInput.test.tsx
index 96a9184..7d7398c 100644
--- a/src/components/number-input/NumberInput.test.tsx
+++ b/src/components/number-input/NumberInput.test.tsx
@@ -639,6 +639,22 @@ describe('NumberInput', () => {
       expect(onValueChange).toHaveBeenCalledTimes(1);
     });
 
+    it('puts a value back to the default on reset when there is no name', async () => {
+      const user = userEvent.setup();
+      render(
+        <form>
+          <Quantity defaultValue={5} />
+          <button type="reset">Reset</button>
+        </form>,
+      );
+      await user.type(spin(), '9');
+      await user.tab();
+      expect(spin()).toHaveValue('59');
+      await user.click(screen.getByText('Reset'));
+      await settle();
+      expect(spin()).toHaveValue('5');
+    });
+
     it('drops text that was typed but not committed on reset', async () => {
       const user = userEvent.setup();
       render(
diff --git a/src/components/slider/Slider.test.tsx b/src/components/slider/Slider.test.tsx
index 9f91868..b6377b1 100644
--- a/src/components/slider/Slider.test.tsx
+++ b/src/components/slider/Slider.test.tsx
@@ -611,6 +611,20 @@ describe('Slider', () => {
       expect(thumb()).toHaveAttribute('aria-valuenow', '35');
     });
 
+    it('puts a slider with no name back to its default when the form is reset', async () => {
+      render(
+        <form data-testid="form">
+          <Volume defaultValue={35} />
+        </form>,
+      );
+      thumb().focus();
+      await userEvent.setup().keyboard('{End}');
+      expect(thumb()).toHaveAttribute('aria-valuenow', '100');
+      act(() => (screen.getByTestId('form') as HTMLFormElement).reset());
+      await settle();
+      expect(thumb()).toHaveAttribute('aria-valuenow', '35');
+    });
+
     it('does not reset a slider whose form reset was cancelled', async () => {
       render(
         <form data-testid="form" onReset={(event) => event.preventDefault()}>
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index cfdf665..7bf9b8a 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the fourteen rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the seventeen rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(14);
+    expect(rows).toHaveLength(17);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -32,6 +32,9 @@ describe('ExceptionTable', () => {
       '12',
       '13',
       '14',
+      '15',
+      '16',
+      '17',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -46,6 +49,10 @@ describe('ExceptionTable', () => {
     expect(cells(rows[13]!)[1]).toMatch(/^meets AA \(3\.\d\d:1\)$/);
     expect(cells(rows[13]!)[2]).toBe('2.29:1');
     expect(cells(rows[13]!).at(-2)).toBe('3:1');
+    // The Slider rows (spec phase 3 §4.4): tick dots, track, thumb.
+    expect(cells(rows[14]!).slice(1, 3)).toEqual(['2.88:1', '2.82:1']);
+    expect(cells(rows[15]!).slice(1, 3)).toEqual(['1.23:1', '1.30:1']);
+    expect(cells(rows[16]!).slice(1, 3)).toEqual(['1.29:1', '2.24:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -72,6 +79,9 @@ describe('ExceptionTable', () => {
       '1.4.3',
       '1.4.11',
       '1.4.11',
+      '1.4.11',
+      '1.4.11',
+      '1.4.11',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/internal/use-form-reset.test.tsx b/src/internal/use-form-reset.test.tsx
index c757055..23a8f8c 100644
--- a/src/internal/use-form-reset.test.tsx
+++ b/src/internal/use-form-reset.test.tsx
@@ -66,6 +66,23 @@ describe('useFormReset', () => {
     expect(onReset).not.toHaveBeenCalled();
   });
 
+  it('finds the form of an element that is not a form control, through closest', async () => {
+    function Plain({ onReset }: { onReset: () => void }) {
+      const ref = useRef<HTMLDivElement>(null);
+      useFormReset(ref, onReset);
+      return (
+        <form data-testid="form">
+          <div ref={ref} />
+        </form>
+      );
+    }
+    const onReset = vi.fn();
+    const { getByTestId } = render(<Plain onReset={onReset} />);
+    (getByTestId('form') as HTMLFormElement).reset();
+    await aTask();
+    expect(onReset).toHaveBeenCalledTimes(1);
+  });
+
   it('does nothing for an element outside a form', async () => {
     function Alone({ onReset }: { onReset: () => void }) {
       const ref = useRef<HTMLInputElement>(null);
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/use-form-reset.test.tsx src/components/slider src/components/number-input src/docs/ExceptionTable.test.tsx
```

Expected: FAIL ở ba chỗ.
- `use-form-reset.test.tsx`, `finds the form of an element that is not a form control, through closest`: `onReset` được gọi 0 lần.
- `Slider.test.tsx`, `puts a slider with no name back to its default when the form is reset`: `aria-valuenow` không phải 35.
- `ExceptionTable.test.tsx`: `lists the seventeen rows…` (độ dài mong đợi 17, nhận 14) và `names the WCAG criterion…`.

Test mới của `NumberInput` (`puts a value back to the default on reset when there is no name`) là test đặc tả: pass cả trước lẫn sau.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index 6ee183b..2869219 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -326,10 +326,13 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track` | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
 | 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
+| 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
+| 16 | Rãnh của Slider (`--flg-control-track`) so với nền | 1.23:1 | 1.30:1 | 3:1 | 1.4.11 |
+| 17 | Núm của Slider (`--flg-control-thumb`) so với rãnh và với phần đã chọn | 1.29:1 | 2.24:1 | 3:1 | 1.4.11 |
 
-Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
+Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
-Cả mười bốn điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Cả mười bảy điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 8ce1f2b..4906853 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -75,6 +75,12 @@ const D = {
     description: 'The icon and bar of an info toast against the surface',
     criterion: '1.4.11',
   },
+  15: { description: 'Tick dots under a Slider track, against the surface', criterion: '1.4.11' },
+  16: { description: 'Slider track against the surface', criterion: '1.4.11' },
+  17: {
+    description: 'Slider thumb against its track and against the filled part',
+    criterion: '1.4.11',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -107,4 +113,10 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 13, theme: 'light', check: 'segmented-indicator', recorded: 1.24, ...D[13] },
   { row: 13, theme: 'dark', check: 'segmented-indicator', recorded: 1.12, ...D[13] },
   { row: 14, theme: 'dark', check: 'toast-info-icon', recorded: 2.29, ...D[14] },
+  { row: 15, theme: 'light', check: 'slider-tick', recorded: 2.88, ...D[15] },
+  { row: 15, theme: 'dark', check: 'slider-tick', recorded: 2.82, ...D[15] },
+  { row: 16, theme: 'light', check: 'slider-track', recorded: 1.23, ...D[16] },
+  { row: 16, theme: 'dark', check: 'slider-track', recorded: 1.3, ...D[16] },
+  { row: 17, theme: 'light', check: 'slider-thumb', recorded: 1.29, ...D[17] },
+  { row: 17, theme: 'dark', check: 'slider-thumb', recorded: 2.24, ...D[17] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 755204d..ada9630 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -40,6 +40,11 @@ export const CHECKS = {
   'highlight-indicator': 3,
   'highlight-chosen-box': 3,
   'toast-info-icon': 3,
+  'slider-bubble-text': 4.5,
+  'slider-tick': 3,
+  'slider-track': 3,
+  'slider-thumb': 3,
+  'stepper-icon': 3,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -308,6 +313,33 @@ export function measure(
       // The icon and bar of an info toast (toast.css). The success, warning and error ones are the
       // status colours, measured as text above, at 4.5:1.
       'toast-info-icon': onSurface('accent-solid'),
+      // The text of a Slider bubble, which is a Surface of its own over the page or a panel.
+      'slider-bubble-text': onSurface('text'),
+      // The tick dots under the track: the dot colour is semi-transparent in the default theme.
+      'slider-tick': paintOnSurface('slider-tick'),
+      // Under contrast-more the track has a 1px edge of the control border (preferences.css).
+      'slider-track':
+        mode === 'contrast-more'
+          ? contrastRatio(composite(color('control-border'), surface), surface)
+          : contrastRatio(composite(color('control-track'), surface), surface),
+      // The thumb against the bare track and the filled part (the accent stops). Under
+      // contrast-more the fill is the text colour, the thumb is the surface colour with a 2px edge
+      // of the text colour: the edge is measured against the surface and the track, the face
+      // against the fill (preferences.css).
+      'slider-thumb':
+        mode === 'contrast-more'
+          ? Math.min(
+              contrastRatio(color('text'), surface),
+              contrastRatio(color('text'), composite(color('control-track'), surface)),
+              contrastRatio(surface, color('text')),
+            )
+          : Math.min(
+              contrastRatio(color('control-thumb'), composite(color('control-track'), surface)),
+              contrastRatio(color('control-thumb'), color('accent-start')),
+              contrastRatio(color('control-thumb'), color('accent-end')),
+            ),
+      // The − and + of a NumberInput, muted text on the background of the frame.
+      'stepper-icon': contrastRatio(composite(color('text-muted'), control), control),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/src/components/slider/Slider.tsx b/src/components/slider/Slider.tsx
index 5365f06..c952592 100644
--- a/src/components/slider/Slider.tsx
+++ b/src/components/slider/Slider.tsx
@@ -245,13 +245,13 @@ export const Slider = markAsFieldGroup(
 
     const controlRef = useRef<HTMLDivElement>(null);
     const thumbRefs = useRef<(HTMLSpanElement | null)[]>([]);
-    const hiddenRef = useRef<HTMLInputElement>(null);
     const defaultRef = useRef(defaultValue);
     useWriteOnCommit(() => {
       defaultRef.current = defaultValue;
     });
-    // The form resets the hidden input behind React's back; put the value back with it.
-    useFormReset(hiddenRef, () => resetValue(defaultRef.current ?? min));
+    // The form resets the hidden input behind React's back; put the value back with it. The control
+    // is the element to watch, so a slider with no `name`, and so no hidden input, is reset too.
+    useFormReset(controlRef, () => resetValue(defaultRef.current ?? min));
 
     const commitRef = useRef(onValueCommit as ((value: SliderValue) => void) | undefined);
     useWriteOnCommit(() => {
@@ -443,14 +443,7 @@ export const Slider = markAsFieldGroup(
         {name === undefined
           ? null
           : shown.map((n, index) => (
-              <input
-                key={index}
-                ref={index === 0 ? hiddenRef : undefined}
-                type="hidden"
-                name={name}
-                value={String(n)}
-                disabled={disabled}
-              />
+              <input key={index} type="hidden" name={name} value={String(n)} disabled={disabled} />
             ))}
       </div>
     );
diff --git a/src/internal/use-form-reset.ts b/src/internal/use-form-reset.ts
index c4bbdef..dca67d3 100644
--- a/src/internal/use-form-reset.ts
+++ b/src/internal/use-form-reset.ts
@@ -3,7 +3,8 @@ import type { RefObject } from 'react';
 import { useWriteOnCommit } from './use-write-on-commit';
 
 /**
- * Calls `onReset` after the form that holds `elementRef` is reset, unless the reset was cancelled.
+ * Calls `onReset` after the form that holds `elementRef` is reset (the element may be a form control
+ * or any element inside the form), unless the reset was cancelled.
  * A component uses it to put an uncontrolled value back to its default and to bring a native
  * element, which the browser has just reset behind React's back, in step with its state again.
  *
@@ -17,8 +18,10 @@ export function useFormReset(elementRef: RefObject<HTMLElement | null>, onReset:
     latest.current = onReset;
   });
   useEffect(() => {
-    const form = (elementRef.current as (HTMLElement & { form?: HTMLFormElement | null }) | null)
-      ?.form;
+    const element = elementRef.current as (HTMLElement & { form?: HTMLFormElement | null }) | null;
+    // A form control knows its form, even through the `form` attribute; any other element is
+    // looked up in the tree.
+    const form = element?.form ?? element?.closest('form');
     if (!form) return;
     const pending = new Set<ReturnType<typeof setTimeout>>();
     const onFormReset = (event: Event) => {
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index 2804f8b..2abf02b 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -14,6 +14,20 @@
     .flg-segmented-item:has(> input:checked) {
       box-shadow: inset 0 0 0 1px var(--flg-text);
     }
+    /* A Slider's track and thumb are drawn faint in the mockup. Here the track has an edge of the
+       control border, the fill is the text colour, and the thumb is the colour of the surface with
+       an edge of the text colour, so each can be told apart from what is beside it (spec phase 3
+       §4.4). */
+    .flg-slider-track {
+      box-shadow: inset 0 0 0 1px var(--flg-control-border);
+    }
+    .flg-slider-fill {
+      background: var(--flg-text);
+    }
+    .flg-slider-thumb {
+      border: 2px solid var(--flg-text);
+      background: var(--flg-glass-tint);
+    }
   }
   @media (forced-colors: active) {
     .flg-surface {
```

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm gen:theme
pnpm build
pnpm size:record
```

Expected: ngưỡng mới gần JS 35860 B, CSS 7929 B (trước: 30784 B, 7126 B), là kết quả ở bản nháp. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm vitest run --project storybook-light --project storybook-dark src/components/segmented-control
pnpm vitest run --project storybook-light --project storybook-dark src/components/number-input
pnpm vitest run --project storybook-light --project storybook-dark src/components/slider
pnpm vitest run --project storybook-light --project storybook-dark src/components/field
pnpm vitest run --project storybook-light --project storybook-dark src/components/select
pnpm vitest run --project storybook-light --project storybook-dark src/components/accordion
pnpm vitest run --project storybook-light --project storybook-dark src/components/dropdown-menu
pnpm vitest run --project storybook-light --project storybook-dark src/components/context-menu
pnpm vitest run --project storybook-light --project storybook-dark src/components/breadcrumb
pnpm vitest run --project storybook-light --project storybook-dark src/components/pagination
pnpm vitest run --project storybook-light --project storybook-dark src/components/toast
pnpm vitest run --project storybook-light --project storybook-dark src/components/tabs
pnpm test:fixtures
```

Expected:
- `pnpm test:unit`: 124 file, 1425 test PASS, 3 skip.
- `pnpm check:contrast`: PASS.
- `pnpm check:package`: PASS với ngưỡng mới.
- Story, từng thư mục, ở ba engine và hai theme: segmented-control 24, number-input 42, slider 48, field 30, select 84, accordion 60, dropdown-menu 96, context-menu 18, breadcrumb 12, pagination 18, toast 42, tabs 60, đều PASS.
- `pnpm test:fixtures`: cả hai fixture (vite, next) PASS. Nếu cổng 5173 bận, dùng bản sao tạm ở cổng 5174 như Global Constraints nêu.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.ts \
  src/components/number-input/NumberInput.test.tsx \
  src/components/slider/Slider.test.tsx \
  src/components/slider/Slider.tsx \
  src/docs/ExceptionTable.test.tsx \
  src/internal/use-form-reset.test.tsx \
  src/internal/use-form-reset.ts \
  src/styles/preferences.css
```
```bash
git commit -m "feat: contrast pairs of Slider and NumberInput, form reset without name, size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```


## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines". Có 10 story mới không mang thẻ `no-visual`: `Look`, `InAField` và `Invalid` của SegmentedControl, NumberInput và Slider, cùng `Field/WithAside`. Mỗi story có 8 ảnh, tổng cộng 80 ảnh. Xem ảnh trước khi xin review:
  - `Look` phải khớp mockup G1, N2 và S3;
  - ảnh cũ của Field và của các ô nhập khác phải không đổi.
- Mô tả PR nêu cho chủ dự án:
  - §4.9 dòng 15–17 và giao diện tương phản cao của Slider đã được duyệt;
  - viền báo lỗi của SegmentedControl theo lựa chọn 2B;
  - G1 khác Tabs `segmented` (T2), đúng như mockup: khoảng cách 0, padding `0 14px`, và đoạn vừa được chọn vừa đang focus giữ cả bóng lẫn vòng focus;
  - `aside` của Field không xuống dòng trên màn hẹp;
  - chưa thử Safari/VoiceOver và NVDA.

### Đã thực thi (2026-11-02)

- Tám commit của nhánh nháp được cherry-pick lên `feat/phase-3-plan-a` (`6f7da2d`..`8a668e7`). Task 1 và 2 do một mô hình miễn phí (`reflection/beam-free`, chạy qua opencode) viết nháp, rồi Claude kiểm tra. Các task còn lại do subagent Claude viết.
- Mỗi task có một reviewer riêng:
  - **Task 5, một phát hiện Critical:** `stepFrom` đứng yên trên lưới thập phân. Ví dụ, ở 0,3 với bước 0,1, nhấn phím lên vẫn ra 0,3. Đã sửa ở `5c1ffae`.
  - **Task 6, một phát hiện Important:** ở chế độ forced colours, núm Slider đang focus không có viền. Đã sửa ở `79ee7c5`. Cùng commit đó còn sửa hai lỗi khác:
    - một lần chạm chuyển thành cuộn trang thì Slider trả lại giá trị cũ;
    - một lần kéo bị bỏ dở không còn chặn lần nhấn sau.
  - Lần review lại thấy cả hai đợt sửa đã xử lý xong.
- Lựa chọn 2B của chủ dự án nằm ở `8e83d22`: viền `--flg-danger` 1px khi báo lỗi; ở forced colours là viền 1px `CanvasText`.
- Review toàn nhánh trên Opus không thấy phát hiện Critical nào. Có hai phát hiện Important:
  - sau khi form reset, SegmentedControl có điều khiển (controlled) bị lệch: radio và `FormData` giữ giá trị cũ trong khi component cha giữ giá trị mới;
  - Field làm mất `aside={0}`.
- Đợt sửa `f32f437`..`5188338` xử lý hai mục đó, cùng với:
  - M3: nút −/+ bị tắt có màu `GrayText` ở forced colours;
  - M5: đoạn đang focus được nâng lên trên các đoạn khác, như mockup G1;
  - M6: phím Enter bị bỏ qua khi IME đang soạn;
  - phần docs và dọn dẹp.

  Lần review lại thấy cả sáu mục đã xử lý và không có lỗi mới.
- Kiểm tra trên `5188338`:
  - lint, typecheck, format, contrast, build, package và fixtures (vite, next) đều đạt;
  - unit: 1453 passed, 3 skipped;
  - kích thước: JS 32,66 kB (giới hạn 35,86 kB), CSS 7,25 kB (giới hạn 7,93 kB);
  - đợt sửa cuối chạy các thư mục story đã đụng tới trên máy (segmented-control, number-input, slider, field) và đều đạt. Máy thiếu bộ nhớ, nên toàn bộ bộ story do CI chạy.
- Các mục để lại được ghi trong memory của dự án (`phase-3-plan-a-followups`):
  - RadioGroup có cùng lỗ hổng sau khi reset; cần kiểm tra cả Checkbox và Switch;
  - M1: input ẩn của NumberInput không nhận thuộc tính `form` (Select cũng vậy);
  - M2: `parseNumber` không đọc lại được dạng rút gọn ("1.2K" thành 1,2), tên tiền tệ và đơn vị dài ở số ít;
  - M7: bánh xe chuột không đổi giá trị trong shadow root;
  - các minor của từng task.
