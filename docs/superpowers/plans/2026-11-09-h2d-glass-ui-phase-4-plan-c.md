# h2d-glass-ui: Plan C, `ArrowIcon`, `ChevronsUpDownIcon`, Table, docs chung, fixtures và `0.3.0` (giai đoạn 4, phần 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan C, plan cuối của giai đoạn 4: `Table` và các phần của nó (`TableCaption`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`) với ba `variant` theo mockup đã duyệt, cùng icon `ArrowIcon`, `ChevronsUpDownIcon` và hook `useScrollable`; năm check tương phản mới và dòng 32–34 của §4.9; mục "Loading states" và "Show data" của Getting started và các ghi chú còn lại của trang Accessibility; sáu component của giai đoạn 4 trong hai fixture; changeset `minor` cho `0.3.0` và ngưỡng kích thước.

**Architecture:**
- **`ArrowIcon`, `ChevronsUpDownIcon`** (Task 1): mũi tên lên hoặc xuống của cột đang sắp, và hai chevron của cột sắp được mà chưa sắp. Khung 24×24, nét 2, trong `src/internal/icons.tsx`.
- **`useScrollable`** (Task 1): hook nội bộ trong `src/components/table/use-scrollable.ts`. Một `ResizeObserver` theo dõi khung và bảng; hook trả `true` khi bảng rộng hoặc cao hơn chỗ khung cho. State chỉ đổi khi kết quả đổi. Không có `ResizeObserver` (jsdom) thì luôn là `false`.
- **`Table`, `TableCaption`** (Task 1): client (`Table.tsx`, `"use client"`). `Table` render khung cuộn `div.flg-table-frame` (mang `className`, `style`, `data-variant`, `data-size`, `data-sticky-header`) quanh `<table>` (mang `ref` và mọi prop còn lại). Khi `useScrollable` báo cuộn được, khung mang `role="region"`, `tabIndex={0}` và tên. `TableCaption` lấy id từ context của `Table`, nên khung được đặt tên bằng caption.
- **Các phần server-safe** (Task 1): `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell` trong `table-parts.tsx`, không hook, không context. `TableHead` có nút sắp xếp chỉ khi có `onSort`; `aria-sort` chỉ nằm trên cột đang sắp.
- **Giao diện** (Task 1, 2): `src/styles/components/table.css` có phần chung và `lined` (Task 1), `striped` và `minimal` (Task 2). CSS chọn giao diện qua `data-variant` và `data-size` của khung, nên các phần không cần biết variant. `prefers-contrast: more` và forced colors nằm trong `preferences.css`.
- **Tương phản** (Task 1): năm check mới trong `scripts/lib/contrast.ts`; dòng 32, 33, 34 mới của §4.9; năm dòng cũ mở rộng nhãn.
- **Docs chung** (Task 3): hai mục mới của Getting started, có ví dụ sống từ hai file story `no-visual`; trang Accessibility có mục "Alert, Skeleton and progress".
- **Fixtures, changeset, ngưỡng** (Task 4): fixture Next.js và Vite dùng cả sáu component; kịch bản mới `checkDataDisplay`; `.changeset/phase-4-data-display.md`; `pnpm size:record` một lần cho cả Plan C.

**Tech Stack:** Như Plan A và Plan B của giai đoạn 4: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`. Plan này làm các phần sau:
- §2 dòng C: `ArrowIcon`, `ChevronsUpDownIcon` và Table (Task 1, 2); docs chung (Task 3); fixtures và changeset (Task 4).
- §3.1: dòng `Table`, `TableCaption` (client) và các phần của `table-parts.tsx` (server-safe); đoạn "Vì sao `TableCaption` là client"; `check:use-client` thêm `Table.tsx`; các ca `check:rsc` của `table-parts.tsx` (Task 1).
- §3.2: `variant` của Table (Task 1, 2).
- §3.5: khung cuộn đo bằng `ResizeObserver`, luôn là scroll container, và vòng focus (Task 1, 2).
- §3.6: các file của Plan C.
- §4.1: mockup T1–T3 (`phase-4-table.html`).
- §4.2: các màu trang trí của Table viết thẳng bằng `color-mix`: đường mờ của `minimal` và sọc của `striped` (Task 2). Plan C không thêm token.
- §4.3 **Table**: phần chung, `stickyHeader`, focus của khung và `lined` (Task 1); khung có padding, `striped`, `minimal` và tiêu đề dính trong khung có padding (Task 2).
- §4.4: năm check `table-*`, dòng 32–34, dòng 2, 6, 9, 12 và 22 mở rộng, mục "Không đo" và các quy tắc "+" của Table (Task 1; đường kẻ thay sọc ở Task 2).
- §4.5 **Table** (Task 1, 2).
- §4.6: `ArrowIcon`, `ChevronsUpDownIcon` (Task 1).
- §5: `use-scrollable.ts` và cảnh báo thiếu tên của Table (Task 1).
- §6.1, §6.2, §6.3: API của `Table` và các phần (Task 1).
- §7: Table ở lớp 1, 2, 3 và 5, test kiểu, kiểm tra gói (Task 1, 2); fixtures và kịch bản kiểm tra (Task 4).
- §8: trang Table (Task 1; mục "Variants" và ghi chú của `striped`, `minimal` ở Task 2); Getting started và Accessibility (Task 1, 3); changeset (Task 4).
- §9: Task 4 kết thúc bằng kiểm tra cuối của cả nhánh.
- §10: các dòng `ResizeObserver`, `clip-path` và gradient trên `<tr>`, khung rộng hơn vùng chứa 6px, vị trí dính trong khung có padding (Task 1, 2).
- §4.9 của spec giai đoạn 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): dòng 32, 33, 34 mới, phần Table của dòng 2, 6, 9, 12 và 22, một đoạn mới về điểm 32–34 (Task 1). Plan A đã thêm dòng 23 đến 29, Plan B dòng 30 và 31.

Chủ dự án chọn "tất cả lựa chọn" ngày 2026-11-06: mỗi phương án của mockup thành một giá trị `variant`. Chủ dự án duyệt spec ngày 2026-11-07, kể cả các dòng 23 đến 34 của §4.9. Plan A và Plan B đã merge (PR #27, #28).

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-4-plan-c`, mỗi task một commit: bốn commit trên `799dbf4` (`main` sau PR #28, tức đã có Plan A và Plan B): `7137b29` (Task 1), `7229000` (Task 2), `8663e65` (Task 3), `48243b9` (Task 4). Mỗi test viết trước đã được chạy trên commit cha của task, trừ các chỗ ghi rõ ở phát hiện 12.
- Cả bốn task do subagent Claude Sonnet viết, lần lượt từng task. Plan C không dùng opencode: Table cần phán đoán (chép đúng CSS của mockup, viết đúng ARIA, kiểm ở ba engine), còn docs chung và fixtures cần ngữ cảnh của cả thư viện. Claude (Opus) kiểm tra từng task.
- Claude chụp ba story `Lined`, `Striped`, `Minimal` từ Storybook đã build và đối chiếu với t1–t3: khớp, trừ một chỗ. Ô chọn tất cả của bảng `sm` trong mockup là ô trống, còn story vẽ trạng thái một phần. Task 2 được sửa chỗ đó, và commit của nó được amend (`11a1cd7` thành `b74eeca`).
- Người viết plan thấy 10 dòng văn dài 101–103 ký tự trong `Table.mdx` và `Accessibility.mdx` (`format:check` không bắt, vì Prettier giữ nguyên dòng văn của MDX). Claude ngắt lại các dòng đó trong chính commit đã viết ra chúng (Task 1 và Task 2, bằng rebase dừng ở từng commit), chỉ đổi chỗ xuống dòng: diff theo từ giữa đầu nhánh cũ `80df9f4` và đầu nhánh mới `48243b9` rỗng. Các SHA ở trên là sau lần ngắt dòng đó.
- Mọi khối patch trong plan được lấy thẳng từ bốn commit đó.

Kết quả đo ở `80df9f4`, ngày 2026-11-09, do Claude chạy; `48243b9` chỉ khác nó ở chỗ xuống dòng của hai trang docs (ở trên):

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 3443 test PASS, 3 skip (172 file; project `unit`, `unit-react18` và `scripts`) |
| Story | table 60, docs 24, ở mỗi project (`storybook-light`, `storybook-dark`). PASS ở Chromium, Firefox và WebKit, chạy từng thư mục một và từng project một. Cả bộ story chưa chạy một lượt trên máy này vì thiếu bộ nhớ; CI chạy cả bộ |
| `pnpm check:contrast` | PASS, với dòng 32, 33 và 34 mới của §4.9 là `known-exception` |
| `pnpm check:package` | PASS với ngưỡng mới: JS 51713 B, CSS 14052 B (đo được JS 47.01 kB, CSS 12.77 kB; ngưỡng trước 50772 B và 12656 B) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name`, `pnpm build` | PASS |
| `pnpm build-storybook` | PASS, kể cả trang `Table.mdx`, `GettingStarted.mdx` và `Accessibility.mdx` |
| Fixtures | `Fixtures OK: vite, next` (bản production và development của cả hai app), chạy ở Task 4 qua một bản sao của `scripts/test-fixtures.mjs` ở cổng 4179/5179 (bản sao đã xoá). Claude không chạy lại, vì lib không đổi sau lần chạy đó |
| Visual | Chưa chạy. 56 ảnh chuẩn mới của bảy story giao diện chạy lần đầu trong CI |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Bốn task nháp là bốn task của plan, cùng số thứ tự.**
   - Task 1 đặt phần chung của Table, `lined`, cả năm check tương phản và dòng 32–34 của §4.9, dù sọc đến Task 2 mới được vẽ: check đo cặp màu, và để ba dòng trong một task thì bảng §4.9 không có chỗ trống.
   - Task 2 thêm `striped` và `minimal`. Hai quyết định mà §10 giao cho engine (`clip-path` trên `<tr>`, vị trí dính trong khung có padding) được chốt bằng story ở ba engine trong task này (phát hiện 5).
   - Task 3 là docs chung; Task 4 là fixtures, changeset và ngưỡng kích thước cho cả Plan C (phát hiện 11).
2. **Mỗi variant có hai story giao diện** (Claude chốt khi nhận Task 1).
   - Mockup vẽ focus bàn phím trên một nút sắp xếp ở cả bảng `md` lẫn bảng `sm`, mà một trang chỉ có một phần tử giữ focus.
   - Vì vậy, ngoài `Lined`, `Striped`, `Minimal` (bảng đơn hàng có focus, bảng `sm`, trạng thái rỗng), mỗi variant có thêm một story cho bảng `sm` có focus: `LinedSmallFocus`, `StripedSmallFocus`, `MinimalSmallFocus`.
   - Cộng `StickyHeader`, Plan C có bảy story giao diện: 56 ảnh chuẩn mới (7 story × 4 chế độ × sáng, tối). Ba story `…SmallFocus` chiếm 24 ảnh trong số đó.
   - Không story nào của Table gắn `reduced-motion`: Table không có chuyển động lặp.
3. **`paintedPixels` trong `.storybook/painted-pixel.ts`** (Task 1).
   - Hàm mới `paintedPixels(element, points)` đọc nhiều điểm từ một ảnh chụp; `paintedPixel(element, x, y)` giờ gọi nó.
   - Ảnh chụp bắt đầu ở một pixel thiết bị nguyên, còn mép khung thì có thể không. Vì vậy vòng 2px được tìm ở ba độ sâu (0.5, 1.5 và 2.5px), cần nhiều điểm trên một ảnh.
   - Với `outline-offset: -2px`, outline 2px lấp đúng 2px đầu tiên bên trong mép viền của control (không phải 2–4px).
   - `elementFromPoint` không thấy outline, nên mọi kiểm tra vòng focus của Table đọc pixel đã vẽ.
4. **Table (Task 1):**
   - **Khung đầy hàng.** Khung dùng chuỗi từ khoá kéo giãn của `stepper.css` (`width: 100%` làm dự phòng, rồi `-webkit-fill-available`, `-moz-available`, `stretch`) cùng `min-width: 0` (Claude chốt). Trong một hàng flex cạnh thanh bên, khung lấy phần còn lại của hàng, và bảng rộng cuộn trong khung thay vì đẩy trang rộng ra. Margin, padding và viền người dùng thêm vào khung được trừ khỏi chiều rộng. Story `InAFlexRow` (ô 200px trong hàng 700px; bảng 1000px cuộn trong khung, khung thành vùng có tên) và `MarginAndPadding`.
   - **`sort` không có `onSort`** render `<span class="flg-table-sort-static">` chứa chữ và icon; `<th>` vẫn có `aria-sort` (spec §6.3 không nói DOM của trường hợp này). Class đó có trong `check:dist-css`, và `check:rsc` có ca `TableHead with a sort and no onSort`. `sort="none"` hiện hai chevron và không đặt `aria-sort`, có hay không có `onSort`.
   - **Tên của vùng cuộn.** Có `TableCaption` thì khung mang `aria-labelledby` trỏ vào id của caption; caption thắng `aria-label`, và id người dùng ép lên caption bị id do `Table` sinh thay thế. Không có caption thì khung mang `aria-label` hoặc `aria-labelledby` đã truyền cho `Table`; chúng vẫn ở lại trên `<table>`. `TableCaption` nằm ngoài `Table` là một caption thường, không lỗi.
   - **Cảnh báo thiếu tên** đi qua `useRequireName`, chỉ khi khung cuộn được: `<Table> needs a name: render a TableCaption inside it, or pass aria-label or aria-labelledby.` Câu không chứa giá trị, nên chỉ in một lần. Caption đăng ký id vào một ref, vì cảnh báo chạy trong cùng commit với layout effect của caption.
   - **`useScrollable`**: lượt đo đầu nằm trong layout effect, nên khung có vai trò ngay khi hiện ra. State chỉ đặt khi kết quả đổi, nên một lần đổi cỡ không đổi kết quả thì không render lại và không thể tạo vòng lặp `ResizeObserver`.
   - **Nền hover và nền hàng đã chọn** viết một lần trên `<tr>` ở phần chung (cùng các bản contrast-more của chúng). Vạch 3px của hàng đã chọn `lined` nằm trên ô đầu. `striped` ghi đè các nền đó trên ô (Task 2).
   - **Preferences.** Quy tắc vẽ outline vào trong khung `lined` (`outline-offset: -2px` cho nút sắp xếp, `Button` và `IconButton` trong ô, ô vuông Checkbox) nằm trong một khối `@media (prefers-contrast: more), (forced-colors: active)` chung. Ở forced colors, `box-shadow: none` lặp lại đủ các selector contrast-more (`:first-child`, `:last-child`, `:only-child`), để cụ thể bằng chúng; Claude đã đối chiếu từng cặp.
   - **Tiêu đề dính** lấy nền từ `--flg-table-head-bg`, đặt thành một gradient phủ trên `--flg-glass-tint-solid`. Forced colors đặt `background-color: Canvas`.
   - Ô tiêu đề hàng trong `<tbody>` (`TableHead scope="row"`) đậm `--flg-weight-medium` (ngoài spec).
5. **`striped` và `minimal` (Task 2): hai quyết định của §10 và hai lỗi tìm thấy.**
   - **`clip-path` trên `<tr>`** cắt được ở Chromium, Firefox và WebKit, sáng và tối. Story `StripedSelectedRow` đọc pixel: điểm ngay trong góc của hàng là của thẻ, dải có màu ở giữa đầu trái, và một màu qua ranh giới hai ô. Chromium và WebKit vốn đã vẽ nền hàng theo góc bo của ô đầu và ô cuối (với `clip-path: inset(0 round 0)` story vẫn pass ở hai engine đó); chỉ Firefox vẽ hình chữ nhật và cần `clip-path`. Không cần quay về vẽ nền trên từng ô.
   - **Hàng đã chọn không bị cắt khi một control trong hàng có focus bàn phím** (`:has(:focus-visible)` đặt `clip-path: none`). Ở `sm`, vòng focus của `IconButton` ở ô cuối vượt ra ngoài hàng 1px, và đường cắt lấy mất phần đó. Story `StripedSelectedRowFocus` đọc pixel 0.5px ngoài mép trên và mép dưới của hàng, trước và sau khi focus: khi còn cắt, pixel không đổi; khi bỏ cắt, nó đổi 10–13 ở sáng, 3–6 ở tối.
   - Cái giá của chỗ đó: trong lúc control có focus, Firefox hiện hai đầu hàng vuông; Chromium và WebKit vẫn bo nhờ các ô. Cách khác, nếu chủ dự án không thích: vẽ nền trên các ô trong lúc có focus (ở sáng sẽ có vệt ở ranh giới ô). Mô tả PR nêu điều này.
   - **Tiêu đề dính trong khung có padding.** Cả ba engine tính chỗ dính từ mép trong của padding, nên `top: 0` để lại một dải 6px mà các hàng hiện qua. `striped` và `minimal` đặt `top: -6px`. Story `StickyHeader` (mỗi variant một khung) kiểm tiêu đề sát mép trên, và bấm trúng tiêu đề ở giữa nó và ở 2px đầu của khung.
   - **Khung có `position: relative`** (phần chung; viết ở Task 2; giao diện `lined` không đổi). Chữ ẩn `.flg-visually-hidden` là `position: absolute`; không có cha định vị, nó nằm ở chỗ tĩnh của cột, ngoài vùng cắt của khung. Ô tiêu đề "Actions" chỉ có chữ ẩn, ở cột vượt mép phải, làm trang 375px cuộn ngang (cột đó thành 514px chiều rộng cuộn). Lỗi này có ở cả ba variant. Story `PaddedFrameInACard` bắt nó.
   - **Forced colors, hàng chân `striped`.** Spec ghi viền trên và dưới 1px `CanvasText`; Task 2 thêm viền đầu dòng ở ô đầu và viền cuối dòng ở ô cuối, để viên không hở hai đầu.
   - `minimal` ở forced colors nằm trong cùng quy tắc `border-color: CanvasText` với `lined`, vì đường kẻ của nó là `color-mix`.
   - Ở `prefers-contrast: more`, hàng đã chọn `striped` không bị cắt: khung 2px là bóng trong của các ô, đã bo theo ô.
   - **Khung có padding không đổi chỗ bảng.** Story `FocusRingsInPaddedFrame` (`striped`, `minimal` × `md`, `sm`): bảng nằm đúng toạ độ khi không có padding, và hộp của nút sắp xếp, của nút và Checkbox ở hàng cuối, nới 4px, vẫn nằm trong mép padding. Vòng của nút sắp xếp được đọc từ pixel 3px ngoài cạnh trên và cạnh trái, ở chế độ mặc định, ở contrast-more và ở forced colors (hai chế độ sau giả lập qua CDP, chỉ ở Chromium).
   - Khung `striped` và `minimal` rộng hơn vùng chứa 6px mỗi bên. Sát mép màn hình mà vùng chứa không có padding thì trang cuộn ngang 6px (§10); `Table.mdx` nói điều đó.
   - Hàng đã chọn của `lined` và `minimal` cũng có nền vẽ trên `<tr>`, không cắt. Không có story riêng cho gradient đó; `StripedSelectedRow` cho thấy cả ba engine vẽ gradient sáng (`--flg-accent-subtle`) của `<tr>` một lần cho cả hàng, nên rủi ro "gradient theo ô" của §10 không xảy ra.
6. **Tương phản (Task 1).** `check:contrast` đo năm cặp mới, trên kính thường và trên panel có scrim, lấy số thấp nhất trên mọi nền tham chiếu và mọi điểm màu. Số của script trùng số của spec §4.4 ở cả bốn cột:

   | Check | Sáng | Sáng, contrast-more | Tối | Tối, contrast-more | Ngưỡng |
   |---|---|---|---|---|---|
   | `table-row-text` | 8.01 | 14.94 | 5.23 | 14.23 | 4.5 |
   | `table-hover-badge` | 2.80 (dòng 32) | 4.94 | 3.03 (dòng 32) | 7.31 | 4.5 |
   | `table-stripe-text-muted` | 4.57 | 7.65 | 3.71 (dòng 33) | 10.43 | 4.5 |
   | `table-stripe-badge` | 3.09 (dòng 33) | 4.94 | 3.37 (dòng 33) | 7.31 | 4.5 |
   | `table-selected-badge` | 2.97 (dòng 34) | 4.94 | 3.27 (dòng 34) | 7.31 | 4.5 |

   - `table-row-text`: chữ `--flg-text` trên ba nền hàng (hover `--flg-control-track`, sọc là `--flg-control-track` 50%, hàng đã chọn `--flg-accent-subtle`, mỗi điểm của gradient tính riêng), lấy số thấp nhất. Nó đạt, nên không phải ngoại lệ.
   - Ba check Badge đo chữ của cả năm variant Badge, mỗi cái trên nền của chính nó đặt lên nền hàng; `accent` thấp nhất. `table-stripe-text-muted` đo chữ `--flg-text-muted` trên sọc.
   - Ở contrast-more ba nền hàng không còn (§4.3), nên cột "+" là số đo trên bề mặt.
   - Dòng mới của §4.9, số làm tròn xuống, tiêu chí `1.4.3`: dòng 32 (`table-hover-badge`, sáng và tối; kèm Badge ở ô cuối của hàng List bấm được, cùng nền), dòng 33 (`table-stripe-text-muted` tối; `table-stripe-badge` sáng và tối), dòng 34 (`table-selected-badge`, sáng và tối). `KNOWN_EXCEPTIONS` có thêm bảy phần tử.
   - Các vị trí khác cùng cặp màu với dòng cũ chỉ mở rộng nhãn, không thêm check: dòng 2 (vòng focus của nút sắp xếp và của khung cuộn), 6 (tiêu đề cột `striped` và `minimal`, icon của cột chưa sắp), 9 (chữ mờ trên hàng đã chọn), 12 (chữ mờ trên hàng đang hover) và 22 (tiêu đề cột `lined`). Icon của cột đang sắp (`--flg-accent-text` trên bề mặt) là cặp của dòng 29; là icon nên ngưỡng 3:1, và đạt (3.95, 4.44).
   - Bảng §4.9 thành 34 dòng; `ExceptionTable.test.tsx` đòi đúng số đó. Câu trỏ của `Accessibility.mdx` thêm Table, và trang có thêm một đoạn về Table (không có vùng live, `aria-sort`, vùng cuộn có tên, contrast-more). Đoạn sau bảng §4.9 của spec 0+1 thành "Cả ba mươi bốn điểm".
   - Test `measures the Badge on the row under the pointer, not on the surface` là ca đột biến: đổi `control-track` (nền hover, cũng là nền của Badge `neutral`) thành một màu tối như chữ thì `table-hover-badge` tụt dưới 1.5, vì check đo Badge trên nền hàng chứ không trên bề mặt.
7. **Docs chung (Task 3):**
   - **"Loading states"**: vùng chứa `aria-busy` luôn có mặt (về `false` khi xong), với vùng `role="status"` có mặt trước khi việc bắt đầu; Skeleton bên trong được thay bằng nội dung; `Progress` cho tiến độ biết được, `Spinner` cho chờ ngắn không biết trước; hàng đang tải của Table có Skeleton trong ô.
   - **"Show data"**: Table có sắp xếp, ô chọn bằng Checkbox (ô chọn tất cả có `indeterminate`) và Pagination; trạng thái rỗng (hàng `colSpan`); List điều hướng với `current` và `renderLink`; Stepper với nội dung theo `value`, các `Step` viết trong component render Stepper. Mục này nói rõ lib không sắp xếp, lọc hay phân trang dữ liệu, và trỏ tới trang của từng component thay vì chép lại.
   - Ví dụ sống đến từ `src/docs/LoadingStates.stories.tsx` (`Examples/Loading states`) và `src/docs/ShowData.stories.tsx` (`Examples/Show data`), cả hai gắn `no-visual` ở meta. Index đã build có 116 story có ảnh trước và sau Task 3; mọi mục mới đều `no-visual`.
   - Code trong các khối MDX giống code của story. Task 3 đã type-check các khối đó (tách ra một file tạm rồi xoá; chỉ còn các biến tự do như `done`, `pathname`, `Order` và `next/link`, như các trang MDX khác).
   - Accessibility: mục mới "Alert, Skeleton and progress" (Alert không là vùng live và hai công thức; Skeleton luôn ẩn, vùng chứa nói "đang tải"; Progress). Gạch đầu dòng về giảm chuyển động của "Other preferences" nói Progress và Skeleton dừng, còn spinner vẫn quay, chậm hơn. Ghi chú về vùng cuộn và tên của Table đã có từ Task 1; ghi chú Stepper và List có từ Plan B.
   - Đoạn đầu của Getting started thêm các component của giai đoạn 4.
8. **Fixtures (Task 4):**
   - **Next.js:** `app/data-display.tsx` là Server Component (section `aria-label="Data display"`): Alert không có `onDismiss`, Skeleton và SkeletonText, Stepper chỉ hiển thị (`aria-label="Server progress"`), List có một hàng `href` và một hàng `renderLink` dùng `Link` của Next, Table với các phần server-safe bên trong `Table`. Nó render `DataControls` của `app/data-controls.tsx` (client): Alert đóng được, Progress, List có `onSelect`, Table có `onSort`, Stepper bấm được (`aria-label="Client progress"`) với các `Step` viết ngay trong đó (§6.3). `page.tsx` render `DataDisplay`.
   - **Vite:** `src/DataDisplay.tsx` có cùng bộ component trong client; `App.tsx` render nó.
   - **Kịch bản** trong `scripts/test-fixtures.mjs`: `COMPONENTS` thêm sáu selector; HTML từ server của Next có `role="progressbar"`, một thẻ `<ol` có `class="flg-stepper"`, `<table class="flg-table"`, và đủ bốn bước của Stepper bấm được trong `<ol>` của nó.
   - Hàm mới `checkDataDisplay`: Stepper bấm được có bốn bước sau khi hydrate; bấm bước đã xong làm nó mang `aria-current="step"`; nút sắp xếp đặt `aria-sort` `ascending` rồi `descending`; bấm hàng List có `onSelect` gọi nó; khung bảng không là vùng khi bảng vừa, và mọi khung thành `role="region"` ở viewport 200px; cuối cùng nút đóng bỏ Alert. Console và output server sạch là kiểm tra có sẵn của script.
   - **`<ol role="list" class="flg-stepper"`.** Stepper render `role="list"` trước `class`, nên chuỗi `<ol class="flg-stepper"` của spec §7 không bao giờ khớp. Kịch bản khớp `class="flg-stepper"` trong một thẻ `<ol`; spec §7 được sửa.
   - **Khung bảng hẹp lại được trong fixture.** Ngay ở cửa sổ 200px, trang vẫn rộng ít nhất 384px (sau khi kiểm form thêm chip tệp và tag), và các bảng ngắn vẫn vừa khung. Fixture thêm cột `Ship to` có chữ không xuống dòng (bảng khoảng 330px: vừa khung 418px ở cửa sổ 1280px, tràn khung 288px ở cửa sổ 200px) và `maxWidth: '100vw'` cho section dữ liệu, để chiều rộng của nó theo cửa sổ. Đó chỉ là cách bày của fixture; kiểm tra dựa vào chỗ tràn thật của khung.
   - ESLint (`jsx-a11y/anchor-has-content`) bắt `renderLink` đầu tiên của Vite; giờ nó là `({ children, ...props }) => <a {...props}>{children}</a>`.
   - Next dùng cổng 3100 và 3101 của script, đều rảnh ở bản nháp. Sau lần chạy, không còn tiến trình nào nghe ở 3100, 3101, 4179, 5179.
9. **Changeset (Task 4).** `.changeset/phase-4-data-display.md`, `minor` cho `h2d-glass-ui`: sáu component cùng các phần và ba `variant` của mỗi cái; Alert, Skeleton, Stepper, List và các phần bên trong Table render được trong Server Component; viết các `Step` trong component render Stepper; không có thay đổi phá vỡ. `package.json` vẫn ở `0.2.1`; việc nâng lên `0.3.0` thuộc workflow Release (Global Constraints). Claude đã đọc soát changeset.
10. **Các chỗ spec được sửa hoặc thêm:**
    - Spec giai đoạn 4 §4.3 **Table**, phần chung (Task 2, "phát hiện khi lập Plan C"): khung có `position: relative`, và vì sao (phát hiện 5).
    - Spec giai đoạn 4 §4.3 `stickyHeader` (Task 2, cùng nhãn): cả ba engine tính chỗ dính từ mép trong của padding, nên `striped` và `minimal` đặt `top: -6px`.
    - Spec giai đoạn 4 §4.3 `striped` (Task 2, cùng nhãn): kết quả `clip-path` theo engine; hàng không bị cắt khi có `:has(:focus-visible)`; không cắt ở `prefers-contrast: more`.
    - Spec giai đoạn 4 §4.5 **Table** (Task 2, ghi "Claude chốt; ghi thêm hai cạnh bên khi lập Plan C"): viền đầu dòng và cuối dòng của hàng chân `striped`.
    - Spec giai đoạn 4 §7, Fixtures (Task 4, "phát hiện khi lập Plan C"): `<ol role="list" class="flg-stepper"` và cách kịch bản khớp nó.
    - Spec 0+1 §4.9 (Task 1): dòng 32, 33, 34 mới; dòng 2, 6, 9, 12 và 22 thêm vị trí của Table; một đoạn mới về điểm 32–34; "Cả ba mươi bốn điểm" (trước là "ba mươi mốt").
    - Task 1 và Task 3 không sửa dòng nào của spec giai đoạn 4.
11. **Ngưỡng kích thước:**
    - Ngưỡng ban đầu (do Plan B ghi): JS 50772 B, CSS 12656 B.
    - Sau Task 1: CSS 12.46 kB, còn 198 B dưới ngưỡng; `check:package` PASS.
    - Sau Task 2: CSS 12.77 kB, vượt ngưỡng 118 B. `check:package` fail chỉ ở `size` từ cuối Task 2 tới khi Task 4 ghi ngưỡng (Task 3 không đổi CSS).
    - Task 4 chạy `pnpm size:record`: JS 51713 B, CSS 14052 B (số đo JS 47.01 kB, CSS 12.77 kB, cộng 10%). Còn chừng 1.28 kB cho CSS và 4.7 kB cho JS. Việc gì thêm CSS hay JS sau Task 4 phải chạy lại `size:record`.
12. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: test mới của `icons.test.tsx` fail trên code cũ (`Element type is invalid … got: undefined`). `use-scrollable.test.tsx`, `Table.test.tsx` và `Table.test-d.ts` fail cả file vì module chưa có, nên không test nào được thấy fail vì lý do riêng. `public API` được thấy fail (danh sách nhận được thiếu tám export của Table). `the Table checks (spec phase 4 §4.4) > are all text at 4.5:1` fail với `expected undefined to be 4.5`. `ExceptionTable.test.tsx` chưa được thấy fail trên cây cũ; lỗi đầu mà bản nháp thấy là của `passes with only the known exceptions of spec §4.9`, với 7 phát hiện, khi đã có check mà chưa có bảy ngoại lệ.
    - Task 1: `Table.test-d.ts` viết sau code (test đặc tả). Story viết cùng code: `FocusRingsInsideLinedFrame` được thấy fail khi bỏ quy tắc preferences (`drawn inside: expected '2px' to be '-2px'`, lần chạy đột biến); các story hành vi khác là test đặc tả. `check:contrast` không có bước fail riêng: số của phát hiện 6 là đặc tả của script.
    - Task 2: story mới fail trên cây của Task 1 ở những chỗ đo CSS của Task 2 (Step 2 của Task 2). `StickyHeader` chỉ fail khi đã có padding mà chưa có `top: -6px`; `StripedSelectedRowFocus` chỉ fail khi hàng đang focus vẫn bị cắt; cả hai pass trên cây của Task 1. `PaddedScrollRegion` và bốn story giao diện mới pass ngay. Lần chạy đột biến thấy fail khi bỏ padding (hình học), bỏ `top: -6px` (dính), bỏ `clip-path` (góc ở Firefox), giữ đường cắt khi có focus (vòng focus) và bỏ preferences (style tính được).
    - Task 3: bảy story mới là test đặc tả của component có sẵn, không fail được vì thiếu code. Lần chạy đầu có 3 fail, đều do kỳ vọng sai của chính story `Orders` (sắp tăng dần thì DH-1039 đứng đầu, không phải DH-1041); story được sửa, code không đổi.
    - Task 4: kịch bản fixture là test. Với kịch bản mới và fixture cũ, nó fail với 16 lỗi (Step 2 của Task 4).
    - Trên cây của plan, test patch của Task 1 làm các file test của Table fail vì module chưa có (`Failed to resolve import …`).
13. **Ảnh chuẩn của component cũ không đổi.**
    - Plan C thêm file CSS mới `table.css`, các selector `.flg-table*` trong `preferences.css`, một `@import`, và các dòng trong danh sách đăng ký.
    - Không token nào được thêm hay đổi giá trị; các màu trang trí viết bằng `color-mix` trong `table.css`.
    - `ArrowIcon` và `ChevronsUpDownIcon` là icon mới; không component cũ nào dùng chúng. `painted-pixel.ts` chỉ được story dùng.
    - Story của docs chung gắn `no-visual`. Số story có ảnh đi từ 109 lên 116, đúng bảy story của Table.
    - Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
14. **Duyệt của chủ dự án.** Không có gì chờ chủ dự án duyệt ngoài review PR. Dòng 32–34 được duyệt cùng spec ngày 2026-11-07. Mô tả PR vẫn liệt kê:
    - dòng 32, 33, 34 kèm số đo, và năm dòng mở rộng (2, 6, 9, 12, 22);
    - các dòng spec sửa trong bản nháp (phát hiện 10);
    - hai đầu vuông của hàng đã chọn `striped` ở Firefox khi một control trong hàng có focus (phát hiện 5);
    - 56 ảnh chuẩn mới cần duyệt, theo nhóm variant: bảy story giao diện, đếm từ index đã build (story không gắn `no-visual`; lệnh ở Step 4 của Task 4).
15. **Các mục để lại** (không làm ở plan này):
    - Kiểm tra screen reader (§7 dòng 6): vùng cuộn, tên và `aria-sort` của Table chưa thử với NVDA và VoiceOver; các công thức của "Loading states" cũng vậy.
    - Safari thật chưa thử; story chỉ chạy WebKit của Playwright.
    - `prefers-contrast: more` và forced colors của Table chỉ được giả lập qua CDP ở Chromium (`FocusRingsInsideLinedFrame`, `FocusRingsInPaddedFrame`, `StripedPreferences`), cộng ảnh chuẩn của harness. Không có test tự động cho hai chế độ cùng bật.
    - Hai đầu vuông của hàng đã chọn `striped` ở Firefox khi một control trong hàng có focus (phát hiện 5).
    - Khung `striped` và `minimal` rộng hơn vùng chứa 6px mỗi bên (§10; docs nói).

**Phạm vi:**
- **Không làm ở plan này:**
  - Ngoài phạm vi của spec §2 cho Table: điều hướng ô bằng bàn phím (`role="grid"`), đổi cỡ hay sắp lại cột, cột ghim, hàng mở rộng, ảo hoá, chọn bằng kéo, và việc sắp xếp, lọc, phân trang dữ liệu trong lib (Pagination có sẵn). Hướng phải sang trái và hệ thống i18n.
  - Publish `0.3.0`: việc của chủ dự án (Global Constraints, "Changeset").
  - Các mục để lại ở phát hiện 15.
- **Ảnh chuẩn visual:**
  - Story có ảnh: `Lined`, `LinedSmallFocus`, `Striped`, `StripedSmallFocus`, `Minimal`, `MinimalSmallFocus` và `StickyHeader` của Table, mỗi story 8 ảnh (4 chế độ × sáng, tối): 56 ảnh mới. Không story nào gắn `reduced-motion`.
  - Mọi story khác của Table, và mọi story của `LoadingStates.stories.tsx` và `ShowData.stories.tsx`, gắn `no-visual`. Index đã build có 116 story có ảnh (109 trước Plan C).
  - Ở `Lined`, `Striped`, `Minimal`, harness rê chuột lên hàng DH-1040 (qua `data-visual-hover`) trước khi chụp, ở cả bốn chế độ.
  - Không tạo ảnh trên Windows. Ảnh chuẩn mới chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh; mọi story mới chạy lần đầu với ảnh chuẩn trong CI.
  - Ảnh của mọi component cũ phải giữ giống từng byte.

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`. `:has()` (ô chỉ có Checkbox hay IconButton, hàng đã chọn có control đang focus) và `clip-path` trên `<tr>` (kiểm ở ba engine, phát hiện 5) có ở mọi trình duyệt của mốc này. Chiều rộng kéo giãn có `width: 100%` làm dự phòng cho engine không biết từ khoá nào.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute: `data-variant`, `data-size`, `data-sticky-header` trên khung; `data-selected` trên `<tr>`; `data-align` trên `<th>` và `<td>`. Các phần của Table không nhận `variant`: CSS đọc nó từ khung. Biến cục bộ của Table là `--flg-table-py`, `--flg-table-hpy`, `--flg-table-px`, `--flg-table-head-bg`, đặt trên khung.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`. Quy tắc `forced-colors` và `prefers-contrast: more` nằm trong `src/styles/preferences.css`. Selector forced colors của một phần mà contrast-more cũng chỉnh phải cụ thể ít nhất bằng selector contrast-more đó (Chromium khớp cả hai khi màu bị ép; phát hiện 4).
- **Mockup lock.** Không giá trị token nào trong `src/styles/theme/values.ts` đổi, và Plan C không thêm token. Các màu chỉ để trang trí (sọc, đường mờ) được viết thẳng bằng `color-mix` trong `table.css` (spec §4.2). Component cũ phải giữ ảnh giống từng byte. Table theo đúng T1–T3, kể cả các cặp dưới ngưỡng của dòng 32, 33 và 34.
- Mọi component dùng `forwardRef`, export kiểu props và kiểu `variant` của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`). `Table.tsx` là client: bắt đầu bằng `"use client"` và có trong `scripts/check-use-client.ts`. `table-parts.tsx` là server-safe: không `"use client"`, không hook, có ca trong `scripts/rsc-probe.mjs`. Class CSS mới có trong `scripts/check-dist-css.ts`.
- `TableCaption` không nhận `id`: id do lib sinh luôn thắng (spec §6.1). Câu cảnh báo không chứa giá trị đổi theo mỗi lần render (bài học từ review Plan A).
- Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh, dòng văn ngắt ở 100 ký tự.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR.
- **Changeset:** Plan C thêm `.changeset/phase-4-data-display.md` (`minor`, Task 4), changeset duy nhất của giai đoạn 4. Merge PR của Plan C là một push lên `main`, nên workflow "Release" (`.github/workflows/release.yml`) chạy:
  - `changesets/action@v2` thấy changeset đang chờ, nên mở PR "Version Packages" (hoặc cập nhật PR đó nếu đã có). PR đó chạy `pnpm changeset version`: nâng `package.json` từ `0.2.1` lên `0.3.0`, ghi `CHANGELOG.md` và xoá file changeset. Lượt chạy này không publish gì.
  - Chỉ khi chủ dự án merge PR "Version Packages", lượt chạy sau của workflow mới chạy `pnpm release` (`pnpm build && changeset publish`): publish lên npm qua trusted publishing (OIDC, có provenance, không token nào nằm trong repo), đẩy tag phiên bản và tạo GitHub release.
  - Merge PR "Version Packages" là quyết định publish của chủ dự án. Claude không merge PR đó, không chạy `changeset version`, `changeset publish` hay `npm publish`.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (do Plan B ghi): JS 50772 B, CSS 12656 B.
  - Task 1 chạy `pnpm build && pnpm check:package` và nó PASS. Từ Task 2, `check:package` fail chỉ ở `size` (CSS vượt 118 B). Đó là điều đã biết; không ghi ngưỡng ở Task 1, 2 hay 3 (phát hiện 11).
  - Chỉ Task 4 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 51713 B, CSS 14052 B.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, và từng project một (`storybook-light` rồi `storybook-dark`: chạy cả hai trong một tiến trình đã làm đứt kết nối tới trình duyệt trên máy này), như các lệnh trong plan. CI chạy cả bộ. Không chạy hai lượt story cùng lúc.
- **Cổng 5173, 4173 và 5174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`**: script ghim cổng 5173 và 4173. Fixture chạy qua một bản sao tạm của `scripts/test-fixtures.mjs` với cổng đổi sang một cặp rảnh, kiểm trước bằng `netstat -ano | grep LISTENING` (bản nháp dùng 5179/4179), cùng cổng 3100 và 3101 của Next; Task 4 ghi lệnh. Xoá bản sao sau khi chạy, kể cả khi nó fail; bản sao không bao giờ được commit. Chỉ tắt tiến trình mình đã mở. Storybook chạy tạm (nếu cần) dùng cổng khác. Không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của Table (56 ảnh) đến từ workflow "Update visual baselines" sau khi đẩy nhánh. Không ảnh cũ nào được đổi.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Mỗi task có hai khối patch, test rồi code. Áp theo đúng thứ tự trong plan. Khối test của Task 4 là kịch bản fixture (`scripts/test-fixtures.mjs`).
- Khối code của Task 1 và Task 3 có dòng bắt đầu bằng ba dấu backtick (khối code trong `Table.mdx` và `GettingStarted.mdx`), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Task 1 và Task 2 cùng sửa `Table.stories.tsx`, `Table.mdx`, `table.css` và `preferences.css`; Task 1 và Task 3 cùng sửa `src/docs/Accessibility.mdx`; Task 2 và Task 4 cùng sửa spec giai đoạn 4. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào. `.size-limit.json` không có trong patch nào: Task 4 ghi nó bằng `pnpm size:record`.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Một bảng rộng hơn màn hình điện thoại, dùng bằng bàn phím.** Khung thành vùng có tên, Tab tới được, và phím mũi tên cuộn nó; khi bảng vừa lại, khung bỏ vai trò, `tabindex` và tên; HTML từ server không có ba thuộc tính đó; trang 375px không cuộn ngang khi Table nằm trong Card. Test:
   - Task 1: `becomes a named region a keyboard can reach when the table is wider, and drops it when it fits`, `has no role, tabindex or name while the table fits, nor in the HTML from a server`, `use-scrollable.test.tsx`; story `ScrollRegion` (đổi cỡ khung thật) và `ArrowKeysScroll` (phím thật), ở ba engine; axe `scrollable-region-focusable` chạy sau mọi play function.
   - Task 2: story `PaddedScrollRegion` và `PaddedFrameInACard` (story này cũng bắt lỗi `position: relative`, phát hiện 5).
   - Task 4: kịch bản fixture, mọi khung thành `role="region"` ở viewport 200px, ở Vite và Next, bản production và development.
2. **Một Table trong hàng flex cạnh thanh bên.** Khung lấy phần còn lại của hàng, và bảng rộng cuộn trong khung thay vì đẩy hàng và trang rộng ra; margin và padding người dùng thêm vào khung không đẩy nó ra ngoài cha. Test ở Task 1: story `InAFlexRow` và `MarginAndPadding`, ở ba engine. jsdom không có layout, nên chỉ story bắt được.
3. **Tiêu đề dính trong khung `striped` có chiều cao tối đa.** Tiêu đề nằm sát mép trên của vùng cuộn, không có dải 6px nào để các hàng hiện qua, và một cú bấm ở 2px đầu của khung trúng tiêu đề. Test: story `StickyHeader` (Task 1 viết, Task 2 mở rộng thành mỗi variant một khung), ở ba engine; bỏ `top: -6px` thì fail (`striped: flush with the top: expected 6 to be less than or equal to 0.5`). `Table.mdx` nói `stickyHeader` cần chiều cao tối đa trên khung.
4. **Sắp xếp có `onSort`, và một cột server đã sắp sẵn không có `onSort`.** Bấm nút gọi `onSort` với hướng kế tiếp; `aria-sort` chỉ nằm trên cột đang sắp; cột sắp sẵn có `aria-sort` và icon nhưng không có nút; `sort="none"` hiện chevron và không đặt `aria-sort`. Test:
   - Task 1: `with sort %s, a press calls onSort with %s` (bốn ca), `sets aria-sort only on the column that is sorted`, `keeps aria-sort and the icon of a sort without onSort, with no button`, `shows the chevrons of sort="none" without a button too, and sets no aria-sort`; story `Sorting` (bấm, rồi Enter trên nút); ca `check:rsc` `TableHead with a sort and no onSort` (render từ `dist` với điều kiện `react-server`).
   - Task 4: kịch bản fixture, nút sắp xếp đặt `aria-sort` `ascending` rồi `descending`, ở Vite và Next.
5. **Hàng đã chọn của `striped` có một control đang focus.** Đường cắt bo hai đầu hàng không lấy mất phần vòng focus của nút ở ô cuối nằm ngoài hàng; ở `prefers-contrast: more` hàng không bị cắt; Firefox hiện hai đầu vuông trong lúc control có focus. Test ở Task 2: story `StripedSelectedRowFocus` (pixel ở mép hàng, trước và sau focus), `StripedSelectedRow` (hàng được cắt bo, một màu qua ranh giới ô) và `StripedPreferences` (style tính được, chỉ ở Chromium), ở ba engine trừ phần CDP.

Các chỗ **chỉ story bắt được**: chiều rộng của khung trong hàng flex và trong Card (`InAFlexRow`, `MarginAndPadding`, `PaddedFrameInACard`), vị trí dính (`StickyHeader`), vòng focus không bị cắt (`FocusRingsInsideLinedFrame`, `FocusRingsInPaddedFrame`, `StripedSelectedRowFocus`, đọc pixel đã vẽ) và đường cắt trên `<tr>` (`StripedSelectedRow`). jsdom không có layout, không vẽ gì.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/icons.tsx` (và test) | `ArrowIcon`, `ChevronsUpDownIcon` (Task 1) |
| `src/components/table/*` | `Table`, `TableCaption` (client), các phần server-safe, `useScrollable`, test, story và trang MDX (Task 1); story và docs của `striped`, `minimal` (Task 2) |
| `src/styles/components/table.css` | Phần chung và `lined` (Task 1); `striped`, `minimal` và `position: relative` của khung (Task 2) |
| `src/styles/preferences.css` | `prefers-contrast: more` và forced colors của Table (Task 1, 2) |
| `src/styles/index.css`, `src/index.ts`, `src/index.test.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs` | Đăng ký, export, kiểm tra gói (Task 1) |
| `.storybook/painted-pixel.ts` | `paintedPixels` (Task 1) |
| `scripts/lib/contrast.ts` (và test), `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, spec 0+1 §4.9 | Năm check, dòng 32–34, phần Table của các dòng cũ, đoạn về Table trên trang Accessibility (Task 1) |
| `src/docs/GettingStarted.mdx`, `src/docs/Accessibility.mdx`, `src/docs/LoadingStates.stories.tsx`, `src/docs/ShowData.stories.tsx` | "Loading states", "Show data" và mục "Alert, Skeleton and progress" (Task 3) |
| `fixtures/next-app/app/*`, `fixtures/vite-app/src/*`, `scripts/test-fixtures.mjs` | Fixtures và kịch bản `checkDataDisplay` (Task 4) |
| `.changeset/phase-4-data-display.md` | Changeset `minor` cho `0.3.0` (Task 4) |
| `.size-limit.json` | Ngưỡng mới (Task 4) |
| `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md` | Các dòng sửa khi lập Plan C (Task 2, 4) |

---

### Task 1: `ArrowIcon`, `ChevronsUpDownIcon`, `useScrollable` và Table (phần chung, `lined`, dòng 32–34 của §4.9)

Spec §1 (dòng Table của bảng quyết định), §2 (dòng C), §3.1 (dòng Table, vì sao `TableCaption` là client, `check:use-client`, `check:rsc`), §3.2, §3.5 (Table), §3.6, §4.1, §4.2 (màu trang trí của Table), §4.3 **Table** (phần chung, `stickyHeader`, focus của khung, `lined`), §4.4 (năm check `table-*`; dòng 32, 33, 34; dòng 2, 6, 9, 12, 22 mở rộng; "Không đo" và các quy tắc "+" của Table), §4.5 **Table**, §4.6 (`ArrowIcon`, `ChevronsUpDownIcon`), §5 (`use-scrollable.ts`, cảnh báo của Table), §6.1, §6.2, §6.3 **Table** và các phần, §7 (Table ở dòng 1, 2, 3, 5; test kiểu; kiểm tra gói), §8 (trang Table), §10 (các dòng Table). Mockup T1. Một bảng dữ liệu ghép từ các phần; lib vẽ bảng và nói cột nào đang sắp, không sắp xếp, lọc hay phân trang dữ liệu.
- **`ArrowIcon`, `ChevronsUpDownIcon`** trong `icons.tsx`, đúng đường vẽ của §4.6.
- **`useScrollable`**: một `ResizeObserver` trên khung và bảng, lượt đo đầu trong layout effect, state chỉ đổi khi kết quả đổi; jsdom thì `false` (phát hiện 4).
- **`Table`, `TableCaption`** (client): khung `div.flg-table-frame` mang `className`, `style` và các `data-*`; `<table>` mang `ref` và các prop còn lại. Khung thành vùng có tên khi cuộn được; tên lấy từ caption, không có thì từ `aria-label` hay `aria-labelledby` của `Table`; thiếu tên thì một cảnh báo (phát hiện 4).
- **Các phần server-safe** trong `table-parts.tsx`. `TableHead` có `scope="col"` mặc định; nút sắp xếp chỉ khi có `onSort`; `aria-sort` chỉ khi `ascending` hay `descending`; `sort` không có `onSort` thành `span.flg-table-sort-static` (phát hiện 4).
- **Giao diện** (§4.3): phần chung (khung đầy hàng, ô, tiêu đề cột, ô chỉ có Checkbox hay IconButton, nút sắp xếp, hover, hàng đã chọn, caption, tiêu đề dính) và `lined` (T1). `striped` và `minimal` chưa được vẽ; Task 2 vẽ chúng.
- **`prefers-contrast: more` và forced colors** trong `preferences.css` (phát hiện 4):
  - contrast-more: hàng đã chọn có khung trong 2px thay nền nhuộm; hàng không đổi nền khi hover.
  - cả hai chế độ: outline của control vẽ vào trong khung `lined`.
  - forced colors: viền và đường kẻ `CanvasText`; nút sắp xếp `ButtonText`; tiêu đề dính có nền `Canvas`; không còn `box-shadow`, kể cả khung 2px của hàng đã chọn.
- **Tương phản:** năm check, dòng 32–34 mới, năm dòng cũ mở rộng nhãn (phát hiện 6). `ExceptionTable.test.tsx` đòi 34 dòng. `Accessibility.mdx` thêm Table vào câu trỏ và một đoạn về Table.
- **`paintedPixels`** trong `.storybook/painted-pixel.ts` (phát hiện 3).
- **Story:** `Lined`, `LinedSmallFocus`, `StickyHeader` là story giao diện (phát hiện 2); `ScrollRegion`, `ArrowKeysScroll`, `Sorting`, `InAFlexRow`, `MarginAndPadding`, `NarrowColumns`, `FocusRingsInsideLinedFrame` gắn `no-visual`.
- `Table.mdx` có mọi mục trừ "Variants" (Task 2 viết, khi đã có `Striped` và `Minimal`).
- Cuối task, `check:package` PASS: CSS còn 198 B dưới ngưỡng cũ (phát hiện 11).

**Files:**
- Create: `src/components/table/Table.tsx`, `table-parts.tsx`, `use-scrollable.ts`, `index.ts`, `Table.test.tsx`, `Table.test-d.ts`, `use-scrollable.test.tsx`, `Table.stories.tsx`, `Table.mdx`, `src/styles/components/table.css`
- Modify: `src/internal/icons.tsx`, `src/internal/icons.test.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `.storybook/painted-pixel.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs`, `scripts/lib/contrast.ts`, `scripts/lib/contrast.test.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/internal/icons.tsx` (không export ra ngoài package):
  - `type ArrowDirection = 'up' | 'down'`.
  - `ArrowIcon({ direction, ...props }: { direction: ArrowDirection } & SVGProps<SVGSVGElement>)`: đường `M12 5v14` và `m19 12-7 7-7-7` khi `down`; `M12 19V5` và `m5 12 7-7 7 7` khi `up`.
  - `ChevronsUpDownIcon(props: SVGProps<SVGSVGElement>)`: đường `m7 15 5 5 5-5` rồi `m7 9 5-5 5 5`.
  - Cả hai là SVG khung `0 0 24 24`, nét 2; `aria-hidden` và `focusable="false"` đến từ `strokeIcon`; props ghi đè được. Table vẽ chúng cỡ 14.
- Produces trong `src/components/table/use-scrollable.ts` (nội bộ, không export ra ngoài package): `useScrollable(frameRef: RefObject<HTMLElement | null>, tableRef: RefObject<HTMLElement | null>): boolean`.
- Produces trong `src/components/table/Table.tsx` (client, `"use client"`), export qua `index.ts` và `src/index.ts`:
  - `Table`: `forwardRef<HTMLTableElement, TableProps>`; `ref` là `<table>`.
  - `TableCaption`: `forwardRef<HTMLTableCaptionElement, TableCaptionProps>`; nằm ngoài `Table` thì là một `<caption>` thường.
  - `TableProps = TableHTMLAttributes<HTMLTableElement> & { variant?: TableVariant; size?: 'sm' | 'md'; stickyHeader?: boolean }`. Mặc định: `variant` `'lined'`, `size` `'md'`, `stickyHeader` `false`. `className` và `style` gắn vào khung; mọi prop khác gắn vào `<table>`.
  - `TableCaptionProps = Omit<HTMLAttributes<HTMLTableCaptionElement>, 'id'>`.
  - `TableVariant = 'lined' | 'striped' | 'minimal'`.
- Produces trong `src/components/table/table-parts.tsx` (server-safe), export qua `index.ts` và `src/index.ts`:
  - `TableHeader`, `TableBody`, `TableFooter`: `forwardRef<HTMLTableSectionElement, …>`, render `<thead>`, `<tbody>`, `<tfoot>`. `TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>`; `TableBodyProps` và `TableFooterProps` là cùng kiểu đó.
  - `TableRow`: `forwardRef<HTMLTableRowElement, TableRowProps>`; `TableRowProps = HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }`, mặc định `selected` `false`.
  - `TableHead`: `forwardRef<HTMLTableCellElement, TableHeadProps>`; `TableHeadProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> & { align?: TableAlign; sort?: TableSort; onSort?: (next: 'ascending' | 'descending') => void }`; `scope` mặc định `'col'`. Bấm nút gọi `onSort('descending')` khi `sort` là `'ascending'`, và `onSort('ascending')` trong mọi trường hợp khác.
  - `TableCell`: `forwardRef<HTMLTableCellElement, TableCellProps>`; `TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> & { align?: TableAlign }`.
  - `TableSort = 'ascending' | 'descending' | 'none'`; `TableAlign = 'start' | 'center' | 'end'`.
- Class: `flg-table-frame`, `flg-table`, `flg-table-caption`, `flg-table-header`, `flg-table-body`, `flg-table-footer`, `flg-table-row`, `flg-table-head`, `flg-table-cell`, `flg-table-sort` (nút sắp xếp), `flg-table-sort-static` (`sort` không có `onSort`), `flg-table-sort-icon` (`<span aria-hidden="true">` bọc icon; màu đặt ở đây, không đặt trên `<svg>`).
- Hook DOM:
  - Khung: `data-variant`, `data-size`, `data-sticky-header`. Khi cuộn được: `role="region"`, `tabindex="0"`, và `aria-labelledby` trỏ vào id của caption, hoặc `aria-label`/`aria-labelledby` của `Table` khi không có caption.
  - `data-selected` trên `<tr>`; `data-align` trên `<th>` và `<td>`; `aria-sort` trên `<th>` chỉ khi `sort` là `'ascending'` hay `'descending'`.
- Biến cục bộ trên khung: `--flg-table-py`, `--flg-table-hpy`, `--flg-table-px` (padding của ô và của tiêu đề cột: `md` 8px, 8px, 12px; `sm` 3px, 5px, 8px), `--flg-table-head-bg` (nền của tiêu đề cột).
- Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `): `<Table> needs a name: render a TableCaption inside it, or pass aria-label or aria-labelledby.`
- Năm check mới trong `CHECKS` của `scripts/lib/contrast.ts`, cả năm ngưỡng `4.5`: `table-row-text`, `table-hover-badge`, `table-stripe-text-muted`, `table-stripe-badge`, `table-selected-badge`.
- `KNOWN_EXCEPTIONS` có thêm bảy phần tử: dòng 32 (`table-hover-badge`, sáng 2.8, tối 3.03), dòng 33 (`table-stripe-text-muted` tối 3.71; `table-stripe-badge` sáng 3.09, tối 3.37), dòng 34 (`table-selected-badge`, sáng 2.97, tối 3.27), cả ba tiêu chí `1.4.3`. Mô tả của dòng 2, 6, 9, 12 và 22 thêm Table.
- Danh sách kiểm tra gói: `scripts/check-use-client.ts` thêm `src/components/table/Table.tsx`; `scripts/check-dist-css.ts` thêm mười hai class ở trên; `scripts/rsc-probe.mjs` thêm sáu ca `TableHeader`, `TableBody`, `TableFooter`, `TableRow selected`, `TableHead with a sort and no onSort`, `TableCell`.
- `.storybook/painted-pixel.ts`: `type Rgb = [number, number, number]`; `paintedPixels(element: Element, points: ReadonlyArray<readonly [number, number]>): Promise<Rgb[] | null>`; `paintedPixel(element, x, y)` giữ chữ ký cũ và gọi `paintedPixels`.
- Consumes: `clsx`, `dataAttr`, `mergeRefs`, `useIsoLayoutEffect`, `useRequireName`, `strokeIcon`; `paintStops`, `resolveToken` và các hàm đo trong `measure` của `scripts/lib/contrast.ts`; trong story: `Badge`, `Card`, `CardTitle`, `Checkbox`, `IconButton`, `realUserEvent` của `.storybook/real-input.ts`, `FillFrames` và `checkFillFrames` của `.storybook/fill-frames.tsx`.
- Task sau dùng: Task 2 vẽ `striped` và `minimal` trên cùng class và móc, và thêm story vào `Table.stories.tsx` (helper `Orders`, `Looks`, `focusCustomerSort`, `paintedPixels`); Task 3 dùng Table trong "Loading states" và "Show data"; Task 4 dùng Table trong hai fixture.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/contrast.test.ts b/scripts/lib/contrast.test.ts
index 21cc753..fd1b2fc 100644
--- a/scripts/lib/contrast.test.ts
+++ b/scripts/lib/contrast.test.ts
@@ -3,6 +3,7 @@ import * as values from '../../src/styles/theme/values';
 import type { ThemeName, TokenMap } from '../../src/styles/theme/values';
 import { KNOWN_EXCEPTIONS } from '../contrast-exceptions';
 import {
+  CHECKS,
   colorsIn,
   composite,
   contrastRatio,
@@ -192,3 +193,42 @@ describe('evaluate catches regressions', () => {
     );
   });
 });
+
+describe('the Table checks (spec phase 4 §4.4)', () => {
+  const TABLE_CHECKS = [
+    'table-row-text',
+    'table-hover-badge',
+    'table-stripe-text-muted',
+    'table-stripe-badge',
+    'table-selected-badge',
+  ] as const;
+
+  it('are all text at 4.5:1', () => {
+    for (const id of TABLE_CHECKS) expect(CHECKS[id], id).toBe(4.5);
+  });
+
+  // The numbers are those of the spec, measured over every reference backdrop and border stop.
+  it.each([
+    ['light', 'default', [8.01, 2.8, 4.57, 3.09, 2.97]],
+    ['dark', 'default', [5.23, 3.03, 3.71, 3.37, 3.27]],
+    // With contrast-more the row backgrounds are gone, so the text is on the surface itself: the
+    // Badge numbers are those of the Badges on the surface and the muted text is its own number.
+    ['light', 'contrast-more', [14.94, 4.94, 7.65, 4.94, 4.94]],
+    ['dark', 'contrast-more', [14.23, 7.31, 10.43, 7.31, 7.31]],
+  ] as const)('measure %s, %s mode: %j', (theme, mode, expected) => {
+    const measured = measure(values, theme, mode);
+    expect(TABLE_CHECKS.map((id) => measured[id])).toEqual(expected);
+  });
+
+  it('measures the Badge on the row under the pointer, not on the surface', () => {
+    // A hover background of the same colour as the Badge's own makes the neutral Badge unreadable.
+    const patched = {
+      ...values,
+      themes: {
+        ...values.themes,
+        light: { ...values.themes.light, 'control-track': 'rgb(31,36,51)' },
+      },
+    };
+    expect(measure(patched, 'light', 'default')['table-hover-badge']).toBeLessThan(1.5);
+  });
+});
diff --git a/src/components/table/Table.stories.tsx b/src/components/table/Table.stories.tsx
new file mode 100644
index 0000000..b8e43da
--- /dev/null
+++ b/src/components/table/Table.stories.tsx
@@ -0,0 +1,719 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import type { CSSProperties, ReactNode } from 'react';
+import { expect, fn, userEvent, waitFor } from 'storybook/test';
+import { FillFrames, checkFillFrames } from '../../../.storybook/fill-frames';
+import { paintedPixels } from '../../../.storybook/painted-pixel';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { strokeIcon } from '../../internal/icons';
+import type { BadgeProps } from '../badge/Badge';
+import { Badge } from '../badge/Badge';
+import { Card, CardTitle } from '../card/Card';
+import { Checkbox } from '../checkbox/Checkbox';
+import { IconButton } from '../icon-button/IconButton';
+import { Table, TableCaption } from './Table';
+import type { TableProps } from './Table';
+import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table-parts';
+import type { TableSort } from './table-parts';
+
+const meta = {
+  title: 'Components/Table',
+  component: Table,
+} satisfies Meta<typeof Table>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** The orders of the mockup. Their texts are English; the names and the figures are the mockup's. */
+const ORDERS: ReadonlyArray<{
+  id: string;
+  customer: string;
+  status: BadgeProps['variant'];
+  statusText: string;
+  date: string;
+  total: string;
+}> = [
+  {
+    id: 'DH-1042',
+    customer: 'Lê Minh Anh',
+    status: 'success',
+    statusText: 'Delivered',
+    date: '05/11/2026',
+    total: '1.250.000 ₫',
+  },
+  {
+    id: 'DH-1041',
+    customer: 'Trần Thu Hà',
+    status: 'accent',
+    statusText: 'Shipping',
+    date: '04/11/2026',
+    total: '890.000 ₫',
+  },
+  {
+    id: 'DH-1040',
+    customer: 'Phạm Quốc Bảo',
+    status: 'warning',
+    statusText: 'Pending',
+    date: '03/11/2026',
+    total: '2.430.000 ₫',
+  },
+  {
+    id: 'DH-1039',
+    customer: 'Đỗ Hải Yến',
+    status: 'danger',
+    statusText: 'Cancelled',
+    date: '02/11/2026',
+    total: '320.000 ₫',
+  },
+  {
+    id: 'DH-1038',
+    customer: 'Vũ Ngọc Lan',
+    status: 'success',
+    statusText: 'Delivered',
+    date: '01/11/2026',
+    total: '1.075.000 ₫',
+  },
+];
+
+/** The "…" of the row menu: the icon is the page's, not the library's. */
+const MoreIcon = () => (
+  <svg {...strokeIcon} width={16} height={16}>
+    <circle cx="12" cy="12" r="1" />
+    <circle cx="19" cy="12" r="1" />
+    <circle cx="5" cy="12" r="1" />
+  </svg>
+);
+
+const noop = () => {};
+
+type OrdersProps = Omit<TableProps, 'children'> & {
+  rows?: typeof ORDERS;
+  /** Draws the footer row. Default true. */
+  footer?: boolean;
+  /** The row that is chosen and the one the harness hovers. */
+  selected?: string;
+  hovered?: string;
+};
+
+/**
+ * The orders table of the mockup: the box that selects all in its mixed state, the date sorted
+ * descending, two columns that can be sorted and are not, a row that is chosen with a Badge `accent`,
+ * a row that is hovered (the harness hovers it, through `data-visual-hover`), and a footer.
+ */
+function Orders({
+  rows = ORDERS,
+  footer = true,
+  selected = 'DH-1041',
+  hovered = 'DH-1040',
+  ...props
+}: OrdersProps) {
+  return (
+    <Table {...props}>
+      <TableHeader>
+        <TableRow>
+          <TableHead>
+            <Checkbox aria-label="Select all" indeterminate />
+          </TableHead>
+          <TableHead>Order</TableHead>
+          <TableHead sort="none" onSort={noop}>
+            Customer
+          </TableHead>
+          <TableHead>Status</TableHead>
+          <TableHead sort="descending" onSort={noop}>
+            Date
+          </TableHead>
+          <TableHead align="end" sort="none" onSort={noop}>
+            Total
+          </TableHead>
+          <TableHead>
+            <span className="flg-visually-hidden">Actions</span>
+          </TableHead>
+        </TableRow>
+      </TableHeader>
+      <TableBody>
+        {rows.map((order) => (
+          <TableRow
+            key={order.id}
+            selected={order.id === selected}
+            {...(order.id === hovered ? { 'data-visual-hover': '' } : undefined)}
+          >
+            <TableCell>
+              <Checkbox aria-label={`Select ${order.id}`} defaultChecked={order.id === selected} />
+            </TableCell>
+            <TableCell style={{ fontWeight: 'var(--flg-weight-medium)' }}>{order.id}</TableCell>
+            <TableCell>{order.customer}</TableCell>
+            <TableCell>
+              <Badge variant={order.status}>{order.statusText}</Badge>
+            </TableCell>
+            <TableCell>{order.date}</TableCell>
+            <TableCell align="end">{order.total}</TableCell>
+            <TableCell>
+              <IconButton variant="ghost" size="sm" aria-label={`Actions for ${order.id}`}>
+                <MoreIcon />
+              </IconButton>
+            </TableCell>
+          </TableRow>
+        ))}
+      </TableBody>
+      {footer ? (
+        <TableFooter>
+          <TableRow>
+            <TableCell />
+            <TableCell colSpan={4}>Total · {rows.length} orders</TableCell>
+            <TableCell align="end">5.965.000 ₫</TableCell>
+            <TableCell />
+          </TableRow>
+        </TableFooter>
+      ) : null}
+    </Table>
+  );
+}
+
+/** The empty state is a recipe of the docs, written here as a page writes it: one cell across all the columns. */
+function EmptyOrders(props: Omit<TableProps, 'children'>) {
+  return (
+    <Table {...props}>
+      <TableHeader>
+        <TableRow>
+          <TableHead>
+            <Checkbox aria-label="Select all" disabled />
+          </TableHead>
+          <TableHead>Order</TableHead>
+          <TableHead sort="none" onSort={noop}>
+            Customer
+          </TableHead>
+          <TableHead>Status</TableHead>
+          <TableHead sort="descending" onSort={noop}>
+            Date
+          </TableHead>
+          <TableHead align="end" sort="none" onSort={noop}>
+            Total
+          </TableHead>
+          <TableHead>
+            <span className="flg-visually-hidden">Actions</span>
+          </TableHead>
+        </TableRow>
+      </TableHeader>
+      <TableBody>
+        <TableRow>
+          <TableCell colSpan={7} align="center" style={{ whiteSpace: 'normal' }}>
+            <div
+              style={{
+                display: 'flex',
+                flexDirection: 'column',
+                alignItems: 'center',
+                gap: 3,
+                padding: '14px 0',
+              }}
+            >
+              <svg
+                {...strokeIcon}
+                width={24}
+                height={24}
+                style={{ color: 'var(--flg-text-muted)', marginBottom: 4 }}
+              >
+                <path d="M22 12h-6l-2 3h-4l-2-3H2" />
+                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
+              </svg>
+              <span style={{ fontWeight: 'var(--flg-weight-semibold)' }}>No orders yet</span>
+              <span style={{ fontSize: 'var(--flg-text-xs)', color: 'var(--flg-text-muted)' }}>
+                New orders will show up here.
+              </span>
+            </div>
+          </TableCell>
+        </TableRow>
+      </TableBody>
+    </Table>
+  );
+}
+
+/** The small label of a section of the mockup page. */
+function Section({ label, children }: { label: string; children: ReactNode }) {
+  return (
+    <div style={{ display: 'grid', gap: 6 }}>
+      <span
+        style={{
+          font: '600 10px system-ui',
+          letterSpacing: '.06em',
+          textTransform: 'uppercase',
+          color: 'var(--flg-text-muted)',
+        }}
+      >
+        {label}
+      </span>
+      {children}
+    </div>
+  );
+}
+
+/**
+ * The states of the approved mockup (table T1-T3): the orders table, a card's heading naming it
+ * through `aria-labelledby` (the recipe of the docs when a heading is already on the page), the `sm`
+ * table, and the empty state.
+ */
+function Looks({ variant }: Pick<TableProps, 'variant'>) {
+  return (
+    <Card style={{ gap: 14, width: 760 }}>
+      <CardTitle id="orders-title">Recent orders</CardTitle>
+      <Orders variant={variant} aria-labelledby="orders-title" />
+      <Section label="Density sm">
+        <Orders
+          variant={variant}
+          size="sm"
+          rows={ORDERS.slice(0, 3)}
+          footer={false}
+          selected=""
+          hovered=""
+          aria-label="Recent orders, small"
+        />
+      </Section>
+      <Section label="Empty (one row spanning all the columns)">
+        <EmptyOrders variant={variant} aria-label="Recent orders, empty" />
+      </Section>
+    </Card>
+  );
+}
+
+// Tab twice: the box that selects all, then the sort button of the Customer column, where the
+// mockup draws the focus.
+const focusCustomerSort: Story['play'] = async ({ canvas }) => {
+  await userEvent.tab();
+  await userEvent.tab();
+  const focused = canvas.getAllByRole('button', { name: 'Customer' })[0]!;
+  await expect(focused).toHaveFocus();
+  await expect(focused.matches(':focus-visible')).toBe(true);
+};
+
+export const Lined: Story = { render: () => <Looks variant="lined" />, play: focusCustomerSort };
+
+/**
+ * The `sm` table with keyboard focus on a sort button, which the mockup draws in both densities. Only
+ * one element has the focus, so the density has a story of its own. In `sm` the controls in the last
+ * row are 3px from the edge of the frame, which is why a `lined` frame draws its rings inside under
+ * `prefers-contrast: more` and forced colours.
+ */
+export const LinedSmallFocus: Story = {
+  render: () => (
+    <Card style={{ width: 760 }}>
+      <Orders
+        variant="lined"
+        size="sm"
+        rows={ORDERS.slice(0, 3)}
+        footer={false}
+        selected=""
+        hovered=""
+        aria-label="Recent orders"
+      />
+    </Card>
+  ),
+  play: focusCustomerSort,
+};
+
+/** Twelve rows in a frame that is 180px tall: the heading stays at the top while the rows scroll. */
+const MANY_ROWS = Array.from({ length: 12 }, (_, index) => ({
+  ...ORDERS[index % ORDERS.length]!,
+  id: `DH-${1042 - index}`,
+}));
+
+/**
+ * `stickyHeader` keeps the column headings at the top of the frame, over the rows that scroll under
+ * them: the heading of the scrolled table is at the frame's top edge, and the rows do not show
+ * through it, so a press at the middle of a heading is a press of the heading. The look is that of the
+ * heading over rows, which is a little more opaque than the glass of the card.
+ */
+export const StickyHeader: Story = {
+  render: () => (
+    <Card style={{ width: 760 }}>
+      <Orders
+        variant="lined"
+        rows={MANY_ROWS}
+        footer={false}
+        selected=""
+        hovered=""
+        stickyHeader
+        style={{ maxHeight: 180 }}
+        aria-label="Recent orders"
+      />
+    </Card>
+  ),
+  play: async ({ canvasElement }) => {
+    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
+    frame.scrollTop = 90;
+    await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(60));
+    const heading = frame.querySelector<HTMLElement>('thead th:nth-child(2)')!;
+    const outer = frame.getBoundingClientRect();
+    const box = heading.getBoundingClientRect();
+    // At the top edge of what the frame shows, inside its border.
+    await expect(Math.abs(box.top - (outer.top + frame.clientTop))).toBeLessThanOrEqual(0.5);
+    // Nothing of a row is above it.
+    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
+    await expect(heading.contains(hit)).toBe(true);
+  },
+};
+
+/** A table wider than the frame it is given, named by its caption. */
+function CaptionedWide({ width }: { width: number }) {
+  return (
+    <div style={{ width: 900 }}>
+      <Table style={{ width }}>
+        <TableCaption>Recent orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            {['Order', 'Customer', 'Status', 'Date', 'Total'].map((name) => (
+              <TableHead key={name}>{name}</TableHead>
+            ))}
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {ORDERS.map((order) => (
+            <TableRow key={order.id}>
+              <TableCell>{order.id}</TableCell>
+              <TableCell>{order.customer}</TableCell>
+              <TableCell>{order.statusText}</TableCell>
+              <TableCell>{order.date}</TableCell>
+              <TableCell>{order.total}</TableCell>
+            </TableRow>
+          ))}
+        </TableBody>
+      </Table>
+    </div>
+  );
+}
+
+/**
+ * A table wider than its frame makes the frame a named region that a keyboard reaches, and a table
+ * that fits does not: the role, `tabindex` and name come and go as the frame is resized, which only a
+ * browser can do (ResizeObserver, layout). The name is the caption's, or the one the Table was given
+ * when it has no caption.
+ */
+export const ScrollRegion: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 16 }}>
+      <CaptionedWide width={320} />
+      <div style={{ width: 900 }}>
+        <Orders style={{ width: 320 }} footer={false} aria-label="Orders by name" />
+      </div>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const [frame, labelled] = Array.from(
+      canvasElement.querySelectorAll<HTMLElement>('.flg-table-frame'),
+    ) as [HTMLElement, HTMLElement];
+    await waitFor(() => expect(labelled).toHaveAttribute('role', 'region'));
+    await expect(canvas.getByRole('region', { name: 'Orders by name' })).toBe(labelled);
+    await expect(labelled.tabIndex).toBe(0);
+    await expect(labelled).toHaveAttribute('aria-label', 'Orders by name');
+    await expect(labelled).not.toHaveAttribute('aria-labelledby');
+
+    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
+    await expect(frame.tabIndex).toBe(0);
+    await expect(canvas.getByRole('region', { name: 'Recent orders' })).toBe(frame);
+    await expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth);
+    await expect(frame.getAttribute('aria-labelledby')).toBe(frame.querySelector('caption')!.id);
+
+    // The frame grows until the table fits: it is a plain frame again.
+    frame.style.width = '1400px';
+    await waitFor(() => expect(frame).not.toHaveAttribute('role'));
+    await expect(frame).not.toHaveAttribute('tabindex');
+    await expect(frame).not.toHaveAttribute('aria-labelledby');
+    await expect(canvas.queryByRole('region', { name: 'Recent orders' })).toBeNull();
+
+    // And shrinks again: the region comes back, named.
+    frame.style.width = '320px';
+    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
+    await expect(canvas.getByRole('region', { name: 'Recent orders' })).toBe(frame);
+  },
+};
+
+/** Real arrow keys scroll a frame that has the focus: that is what the tab stop is for. */
+export const ArrowKeysScroll: Story = {
+  tags: ['no-visual'],
+  render: () => <CaptionedWide width={320} />,
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
+    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
+    // A Tab from outside reaches it: nothing in this table can be focused before it.
+    frame.focus();
+    await expect(frame).toHaveFocus();
+    await expect(frame.scrollLeft).toBe(0);
+    await real.keyboard('{ArrowRight}');
+    await waitFor(() => expect(frame.scrollLeft).toBeGreaterThan(0));
+    const after = frame.scrollLeft;
+    await real.keyboard('{ArrowLeft}');
+    await waitFor(() => expect(frame.scrollLeft).toBeLessThan(after));
+  },
+};
+
+/** The columns of a table the way a person sorts them: one is sorted at a time. */
+function Sortable({ onSort }: { onSort: (key: string, next: 'ascending' | 'descending') => void }) {
+  const [sorted, setSorted] = useState<{ key: string; direction: TableSort }>({
+    key: 'date',
+    direction: 'descending',
+  });
+  const head = (key: string, name: string) => (
+    <TableHead
+      sort={sorted.key === key ? sorted.direction : 'none'}
+      onSort={(next) => {
+        onSort(key, next);
+        setSorted({ key, direction: next });
+      }}
+    >
+      {name}
+    </TableHead>
+  );
+  return (
+    <Table aria-label="Orders">
+      <TableHeader>
+        <TableRow>
+          {head('customer', 'Customer')}
+          {head('date', 'Date')}
+          {head('total', 'Total')}
+        </TableRow>
+      </TableHeader>
+    </Table>
+  );
+}
+
+/**
+ * A press on a sort button calls `onSort` with the direction to go to and the `aria-sort` follows it:
+ * only the sorted column has one. A column that is not sorted starts ascending; the sorted one turns
+ * over.
+ */
+const onSort = fn();
+
+export const Sorting: Story = {
+  tags: ['no-visual'],
+  render: () => <Sortable onSort={onSort} />,
+  play: async ({ canvas }) => {
+    onSort.mockClear();
+    const column = (name: string) => canvas.getByRole('columnheader', { name });
+    await expect(column('Date')).toHaveAttribute('aria-sort', 'descending');
+    await expect(column('Customer')).not.toHaveAttribute('aria-sort');
+
+    await userEvent.click(canvas.getByRole('button', { name: 'Customer' }));
+    await expect(onSort.mock.calls).toEqual([['customer', 'ascending']]);
+    await expect(column('Customer')).toHaveAttribute('aria-sort', 'ascending');
+    await expect(column('Date')).not.toHaveAttribute('aria-sort');
+
+    await userEvent.click(canvas.getByRole('button', { name: 'Customer' }));
+    await expect(onSort.mock.calls.at(-1)).toEqual(['customer', 'descending']);
+    await expect(column('Customer')).toHaveAttribute('aria-sort', 'descending');
+
+    // The keyboard presses it too, since it is a real button.
+    canvas.getByRole('button', { name: 'Total' }).focus();
+    await userEvent.keyboard('{Enter}');
+    await expect(onSort.mock.calls.at(-1)).toEqual(['total', 'ascending']);
+    await expect(column('Total')).toHaveAttribute('aria-sort', 'ascending');
+    await expect(column('Customer')).not.toHaveAttribute('aria-sort');
+  },
+};
+
+/**
+ * A Table fills the row it is in, also as an item of a flex row beside a box: it takes the rest of the
+ * row, and a table wider than that scrolls inside its frame, which becomes a named region, instead of
+ * pushing the row, and the page, wider. Only a real layout can show it.
+ */
+export const InAFlexRow: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div data-row style={{ display: 'flex', alignItems: 'start', gap: 12, width: 700 }}>
+      <span data-box style={{ flex: 'none', width: 200, height: 60 }} />
+      <Table aria-label="Orders">
+        <TableHeader>
+          <TableRow>
+            {['Order', 'Customer', 'Status', 'Date', 'Total'].map((name) => (
+              <TableHead key={name} style={{ minWidth: 200 }}>
+                {name}
+              </TableHead>
+            ))}
+          </TableRow>
+        </TableHeader>
+      </Table>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    const row = canvasElement.querySelector<HTMLElement>('[data-row]')!;
+    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
+    const rest = row.getBoundingClientRect().width - 200 - 12;
+    await expect(Math.abs(frame.getBoundingClientRect().width - rest)).toBeLessThanOrEqual(1);
+    await expect(frame.getBoundingClientRect().right).toBeLessThanOrEqual(
+      row.getBoundingClientRect().right + 0.5,
+    );
+    // The table is 1000px wide and scrolls in the frame: the row did not grow.
+    await expect(frame.scrollWidth).toBeGreaterThanOrEqual(1000);
+    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
+    await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
+    await expect(canvas.getByRole('region', { name: 'Orders' })).toBe(frame);
+  },
+};
+
+/**
+ * The margin, padding and border of a frame come out of its width: with `margin: 0 16px` or
+ * `padding: 8px`, in a 400px block and in a flex row beside a box, it stays inside its parent and
+ * fills what the parent leaves it.
+ */
+export const MarginAndPadding: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <FillFrames
+      name="table"
+      render={(style: CSSProperties) => (
+        <Table aria-label="Orders" style={style}>
+          <TableBody>
+            <TableRow>
+              <TableCell>DH-1042</TableCell>
+              <TableCell>Lê Minh Anh</TableCell>
+            </TableRow>
+          </TableBody>
+        </Table>
+      )}
+    />
+  ),
+  play: async ({ canvasElement }) => checkFillFrames(canvasElement, 'table'),
+};
+
+/**
+ * A cell that holds only a Checkbox is the narrow column of the boxes (16px of content, 4px of
+ * padding after it), and one that holds only an icon button is the narrow column of the actions
+ * (28px of content, padding of 4px and 8px): in a heading and in a body cell alike, whatever else is
+ * in the column.
+ */
+export const NarrowColumns: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 760 }}>
+      <Orders variant="lined" aria-label="Orders" />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const cells = Array.from(
+      canvasElement.querySelectorAll<HTMLElement>('tbody tr:first-child td'),
+    );
+    const boxes = cells[0]!;
+    const actions = cells[6]!;
+    const head = canvasElement.querySelector<HTMLElement>('thead th')!;
+    // The content-box width plus the padding of each side: 12 before and 4 after, and 4 and 8.
+    await expect(Math.round(boxes.getBoundingClientRect().width)).toBe(16 + 12 + 4);
+    await expect(Math.round(head.getBoundingClientRect().width)).toBe(16 + 12 + 4);
+    await expect(Math.round(actions.getBoundingClientRect().width)).toBe(28 + 4 + 8);
+    await expect(getComputedStyle(boxes).paddingRight).toBe('4px');
+    await expect(getComputedStyle(actions).paddingLeft).toBe('4px');
+    await expect(getComputedStyle(actions).paddingRight).toBe('8px');
+  },
+};
+
+/** What differs between a ring that is drawn and one that is not, at a point: any channel by this much. */
+const RING_DIFFERENCE = 60;
+
+/** How far inside the edge of a control the points are looked at, in CSS pixels. */
+const ACROSS = [0.5, 1.5, 2.5] as const;
+
+/**
+ * In a `lined` frame the rings of the library's controls are drawn inside them under
+ * `prefers-contrast: more` and forced colours, the two modes where the outline is the sign of focus:
+ * the frame clips what it paints outside its padding edge, and in `sm` the controls of the last row
+ * are 3px from it. Read from the painted pixels at three points across the first 3px inside the edge
+ * of the control nearest the edge of the frame: with `outline-offset: -2px` the 2px ring fills the
+ * two pixels there, and a ring drawn outside the control would leave all three the control's own
+ * colour. Three, since a screenshot starts at a whole device pixel and the frame may not. The
+ * preferences are emulated through the protocol, which only Chromium has.
+ */
+export const FocusRingsInsideLinedFrame: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 760 }}>
+      <Orders
+        variant="lined"
+        size="sm"
+        rows={ORDERS.slice(0, 2)}
+        footer={false}
+        selected=""
+        hovered=""
+        aria-label="Orders"
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    if (server.browser !== 'chromium') return;
+    const real = await realUserEvent();
+    if (!real) return;
+    const session = cdp();
+    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
+    const lastRow = frame.querySelector<HTMLElement>('tbody tr:last-child')!;
+    // The control that takes the focus, the element that draws its ring, and where the ring is: the
+    // side of the ring's element that is nearest the edge of the frame.
+    const sortButton = frame.querySelector<HTMLElement>('thead .flg-table-sort')!;
+    const iconButton = lastRow.querySelector<HTMLElement>('.flg-button')!;
+    const checkbox = lastRow.querySelector<HTMLElement>('.flg-checkbox')!;
+    const targets: Array<{
+      name: string;
+      focus: HTMLElement;
+      ring: HTMLElement;
+      at: (box: DOMRect) => Array<[number, number]>;
+    }> = [
+      {
+        name: 'sort button',
+        focus: sortButton,
+        ring: sortButton,
+        at: (box) => ACROSS.map((depth) => [box.x + box.width / 2, box.y + depth]),
+      },
+      {
+        name: 'icon button',
+        focus: iconButton,
+        ring: iconButton,
+        at: (box) => ACROSS.map((depth) => [box.x + box.width / 2, box.bottom - depth]),
+      },
+      {
+        name: 'checkbox',
+        focus: checkbox.querySelector<HTMLElement>('input')!,
+        ring: checkbox.querySelector<HTMLElement>('.flg-checkbox-box')!,
+        at: (box) => ACROSS.map((depth) => [box.x + depth, box.y + box.height / 2]),
+      },
+    ];
+    const outer = () => frame.getBoundingClientRect();
+    const pixelsAt = async (box: DOMRect, at: (box: DOMRect) => Array<[number, number]>) =>
+      (await paintedPixels(
+        frame,
+        at(box).map(([x, y]) => [x - outer().x, y - outer().y] as const),
+      ))!;
+    for (const feature of [
+      { name: 'prefers-contrast', value: 'more' },
+      { name: 'forced-colors', value: 'active' },
+    ]) {
+      await session.send('Emulation.setEmulatedMedia', { features: [feature] });
+      try {
+        await waitFor(() =>
+          expect(matchMedia(`(${feature.name}: ${feature.value})`).matches).toBe(true),
+        );
+        for (const { name, focus, ring, at } of targets) {
+          const label = `${feature.name}, ${name}`;
+          await real.keyboard('{Escape}');
+          (document.activeElement as HTMLElement | null)?.blur();
+          const before = await pixelsAt(ring.getBoundingClientRect(), at);
+          // The ring is drawn for a focus given by script after a key press (Chromium, WebKit).
+          focus.focus({ focusVisible: true });
+          await expect(focus, `${label}: it has the focus`).toHaveFocus();
+          await expect(focus.matches(':focus-visible'), `${label}: the ring is drawn`).toBe(true);
+          await expect(getComputedStyle(ring).outlineOffset, `${label}: drawn inside`).toBe('-2px');
+          const after = await pixelsAt(ring.getBoundingClientRect(), at);
+          const differs = after.some((pixel, point) =>
+            pixel.some(
+              (channel, index) => Math.abs(channel - before[point]![index]!) > RING_DIFFERENCE,
+            ),
+          );
+          await expect(
+            differs,
+            `${label}: the ring is painted inside the edge (${JSON.stringify(before)} before, ${JSON.stringify(after)} after)`,
+          ).toBe(true);
+          focus.blur();
+        }
+      } finally {
+        await session.send('Emulation.setEmulatedMedia', { features: [] });
+      }
+    }
+  },
+};
diff --git a/src/components/table/Table.test-d.ts b/src/components/table/Table.test-d.ts
new file mode 100644
index 0000000..dc1e454
--- /dev/null
+++ b/src/components/table/Table.test-d.ts
@@ -0,0 +1,68 @@
+import { createRef } from 'react';
+import type { ComponentProps } from 'react';
+import { expectTypeOf, test } from 'vitest';
+import type { TableCaptionProps, TableProps } from './Table';
+import { Table, TableCaption } from './Table';
+import type {
+  TableAlign,
+  TableCellProps,
+  TableHeadProps,
+  TableRowProps,
+  TableSort,
+} from './table-parts';
+import { TableCell, TableHead, TableRow } from './table-parts';
+
+test('a Table takes only the documented variants and sizes', () => {
+  expectTypeOf<TableProps['variant']>().toEqualTypeOf<
+    'lined' | 'striped' | 'minimal' | undefined
+  >();
+  expectTypeOf<TableProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
+  // @ts-expect-error an unknown variant
+  const unknownVariant: TableProps = { variant: 'grid' };
+  // @ts-expect-error the variant of another component
+  const otherVariant: TableProps = { variant: 'inset' };
+  expectTypeOf(unknownVariant).toBeObject();
+  expectTypeOf(otherVariant).toBeObject();
+});
+
+test('a Table takes a ref to its <table>, and the HTML attributes of one', () => {
+  expectTypeOf(createRef<HTMLTableElement>()).toExtend<ComponentProps<typeof Table>['ref']>();
+  expectTypeOf<TableProps['aria-label']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<TableProps['stickyHeader']>().toEqualTypeOf<boolean | undefined>();
+});
+
+test('a TableCaption takes no id: the Table makes it', () => {
+  expectTypeOf<TableCaptionProps>().not.toHaveProperty('id');
+  // @ts-expect-error the id is the Table's
+  const withId: TableCaptionProps = { id: 'mine' };
+  expectTypeOf(withId).toBeObject();
+  expectTypeOf(createRef<HTMLTableCaptionElement>()).toExtend<
+    ComponentProps<typeof TableCaption>['ref']
+  >();
+});
+
+test('a TableHead aligns to start, center or end and sorts in the documented ways', () => {
+  expectTypeOf<TableAlign>().toEqualTypeOf<'start' | 'center' | 'end'>();
+  expectTypeOf<TableHeadProps['align']>().toEqualTypeOf<TableAlign | undefined>();
+  // @ts-expect-error `left` is not an alignment: it would not follow the writing direction
+  const left: TableHeadProps = { align: 'left' };
+  expectTypeOf(left).toBeObject();
+  expectTypeOf<TableSort>().toEqualTypeOf<'ascending' | 'descending' | 'none'>();
+  expectTypeOf<TableHeadProps['sort']>().toEqualTypeOf<TableSort | undefined>();
+  // The next direction is never `none`: a press asks for one of the two.
+  expectTypeOf<NonNullable<TableHeadProps['onSort']>>().parameters.toEqualTypeOf<
+    ['ascending' | 'descending']
+  >();
+  expectTypeOf(createRef<HTMLTableCellElement>()).toExtend<
+    ComponentProps<typeof TableHead>['ref']
+  >();
+});
+
+test('a TableCell aligns the same way, and a TableRow can be selected', () => {
+  expectTypeOf<TableCellProps['align']>().toEqualTypeOf<TableAlign | undefined>();
+  expectTypeOf<TableRowProps['selected']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf(createRef<HTMLTableCellElement>()).toExtend<
+    ComponentProps<typeof TableCell>['ref']
+  >();
+  expectTypeOf(createRef<HTMLTableRowElement>()).toExtend<ComponentProps<typeof TableRow>['ref']>();
+});
diff --git a/src/components/table/Table.test.tsx b/src/components/table/Table.test.tsx
new file mode 100644
index 0000000..49f3f01
--- /dev/null
+++ b/src/components/table/Table.test.tsx
@@ -0,0 +1,484 @@
+import { act, render, screen, within } from '@testing-library/react';
+import userEvent from '@testing-library/user-event';
+import { createRef } from 'react';
+import type { ReactNode } from 'react';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { Checkbox } from '../checkbox/Checkbox';
+import { Table, TableCaption } from './Table';
+import type { TableProps } from './Table';
+import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table-parts';
+
+beforeEach(() => {
+  resetDevWarnings();
+  vi.restoreAllMocks();
+});
+afterEach(() => vi.unstubAllGlobals());
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const ARROW_UP = 'M12 19V5';
+const ARROW_DOWN = 'M12 5v14';
+const CHEVRONS = 'm7 15 5 5 5-5';
+const pathsOf = (element: Element) =>
+  Array.from(element.querySelectorAll('path')).map((path) => path.getAttribute('d'));
+
+/** The orders table of the mockup, a few columns of it. */
+function Orders(props: Partial<TableProps>) {
+  return (
+    <Table {...props}>
+      <TableHeader>
+        <TableRow>
+          <TableHead scope="col">Order</TableHead>
+          <TableHead align="end">Total</TableHead>
+        </TableRow>
+      </TableHeader>
+      <TableBody>
+        <TableRow>
+          <TableCell>DH-1042</TableCell>
+          <TableCell align="end">1.250.000</TableCell>
+        </TableRow>
+        <TableRow selected>
+          <TableCell>DH-1041</TableCell>
+          <TableCell align="end">890.000</TableCell>
+        </TableRow>
+      </TableBody>
+      <TableFooter>
+        <TableRow>
+          <TableCell>Total</TableCell>
+          <TableCell align="center">2.140.000</TableCell>
+        </TableRow>
+      </TableFooter>
+    </Table>
+  );
+}
+
+/** One header row of columns, for the tests of sorting. */
+function Columns({ children }: { children: ReactNode }) {
+  return (
+    <Table aria-label="x">
+      <TableHeader>
+        <TableRow>{children}</TableRow>
+      </TableHeader>
+    </Table>
+  );
+}
+
+/**
+ * Stands in for ResizeObserver, which jsdom lacks, and for the layout it has none of: the frame
+ * is `room` wide and the table needs `need`. `resize()` reports a change the way a browser would.
+ */
+function fakeLayout(initial: { room: number; need: number }) {
+  const sizes = { ...initial };
+  const observers: Array<{ callback: ResizeObserverCallback }> = [];
+  class FakeResizeObserver {
+    constructor(readonly callback: ResizeObserverCallback) {
+      observers.push(this);
+    }
+    observe() {}
+    unobserve() {}
+    disconnect() {}
+  }
+  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
+  const ofFrame = (value: () => number) =>
+    function (this: HTMLElement) {
+      return this.classList.contains('flg-table-frame') ? value() : 0;
+    };
+  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
+    ofFrame(() => sizes.room),
+  );
+  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
+    ofFrame(() => Math.max(sizes.room, sizes.need)),
+  );
+  return {
+    resize(patch: Partial<typeof sizes>) {
+      Object.assign(sizes, patch);
+      act(() => {
+        for (const observer of observers) observer.callback([], {} as ResizeObserver);
+      });
+    },
+  };
+}
+
+describe('Table', () => {
+  it('renders a scroll frame holding a table, lined and md by default', () => {
+    const { container } = render(<Orders />);
+    const frame = container.firstElementChild!;
+    expect(frame.tagName).toBe('DIV');
+    expect(frame).toHaveClass('flg-table-frame');
+    expect(frame).toHaveAttribute('data-variant', 'lined');
+    expect(frame).toHaveAttribute('data-size', 'md');
+    expect(frame).not.toHaveAttribute('data-sticky-header');
+    expect(frame.firstElementChild).toBe(screen.getByRole('table'));
+    expect(screen.getByRole('table')).toHaveClass('flg-table');
+  });
+
+  it.each(['lined', 'striped', 'minimal'] as const)('reflects variant %s', (variant) => {
+    const { container } = render(<Orders variant={variant} size="sm" stickyHeader />);
+    const frame = container.firstElementChild!;
+    expect(frame).toHaveAttribute('data-variant', variant);
+    expect(frame).toHaveAttribute('data-size', 'sm');
+    expect(frame).toHaveAttribute('data-sticky-header', '');
+  });
+
+  it('forwards the ref to the <table>, puts className and style on the frame and the rest on the table', () => {
+    const ref = createRef<HTMLTableElement>();
+    const { container } = render(
+      <Table ref={ref} className="mine" style={{ maxHeight: 120 }} id="orders" data-x="1" />,
+    );
+    const frame = container.firstElementChild!;
+    expect(ref.current).toBe(screen.getByRole('table'));
+    expect(frame).toHaveClass('flg-table-frame', 'mine');
+    expect(frame).toHaveStyle({ maxHeight: '120px' });
+    expect(frame).not.toHaveAttribute('id');
+    expect(ref.current).toHaveAttribute('id', 'orders');
+    expect(ref.current).toHaveAttribute('data-x', '1');
+    expect(ref.current).not.toHaveClass('mine');
+  });
+
+  it('gives each part its class, the header cells scope="col" and a selected row its mark', () => {
+    const { container } = render(<Orders />);
+    expect(container.querySelector('thead')).toHaveClass('flg-table-header');
+    expect(container.querySelector('tbody')).toHaveClass('flg-table-body');
+    expect(container.querySelector('tfoot')).toHaveClass('flg-table-footer');
+    expect(container.querySelectorAll('tr.flg-table-row')).toHaveLength(4);
+    expect(screen.getByRole('columnheader', { name: 'Order' })).toHaveClass('flg-table-head');
+    expect(screen.getByRole('columnheader', { name: 'Order' })).toHaveAttribute('scope', 'col');
+    expect(screen.getAllByRole('cell')[0]).toHaveClass('flg-table-cell');
+    const rows = container.querySelectorAll('tbody tr');
+    expect(rows[0]).not.toHaveAttribute('data-selected');
+    expect(rows[1]).toHaveAttribute('data-selected', '');
+  });
+
+  it('puts the alignment on header and body cells, and nothing when there is none', () => {
+    render(<Orders />);
+    expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute(
+      'data-align',
+      'end',
+    );
+    expect(screen.getByRole('columnheader', { name: 'Order' })).not.toHaveAttribute('data-align');
+    expect(screen.getByRole('cell', { name: '1.250.000' })).toHaveAttribute('data-align', 'end');
+    expect(screen.getByRole('cell', { name: '2.140.000' })).toHaveAttribute('data-align', 'center');
+    expect(screen.getByRole('cell', { name: 'DH-1042' })).not.toHaveAttribute('data-align');
+  });
+
+  it('lets a header cell take another scope, such as a row header', () => {
+    render(
+      <Table aria-label="x">
+        <TableBody>
+          <TableRow>
+            <TableHead scope="row">DH-1042</TableHead>
+          </TableRow>
+        </TableBody>
+      </Table>,
+    );
+    expect(screen.getByRole('rowheader', { name: 'DH-1042' })).toHaveAttribute('scope', 'row');
+  });
+
+  it('forwards the ref and the props of every part to its own element', () => {
+    const refs = {
+      header: createRef<HTMLTableSectionElement>(),
+      body: createRef<HTMLTableSectionElement>(),
+      footer: createRef<HTMLTableSectionElement>(),
+      row: createRef<HTMLTableRowElement>(),
+      head: createRef<HTMLTableCellElement>(),
+      cell: createRef<HTMLTableCellElement>(),
+      caption: createRef<HTMLTableCaptionElement>(),
+    };
+    render(
+      <Table>
+        <TableCaption ref={refs.caption} className="c">
+          Orders
+        </TableCaption>
+        <TableHeader ref={refs.header} className="h">
+          <TableRow ref={refs.row} className="r" data-testid="row">
+            <TableHead ref={refs.head} className="th" colSpan={2}>
+              Order
+            </TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody ref={refs.body}>
+          <TableRow>
+            <TableCell ref={refs.cell} className="td" colSpan={2}>
+              x
+            </TableCell>
+          </TableRow>
+        </TableBody>
+        <TableFooter ref={refs.footer} />
+      </Table>,
+    );
+    expect(refs.header.current?.tagName).toBe('THEAD');
+    expect(refs.body.current?.tagName).toBe('TBODY');
+    expect(refs.footer.current?.tagName).toBe('TFOOT');
+    expect(refs.row.current).toBe(screen.getByTestId('row'));
+    expect(refs.row.current).toHaveClass('flg-table-row', 'r');
+    expect(refs.head.current).toHaveClass('flg-table-head', 'th');
+    expect(refs.head.current).toHaveAttribute('colspan', '2');
+    expect(refs.cell.current).toHaveClass('flg-table-cell', 'td');
+    expect(refs.caption.current).toHaveClass('flg-table-caption', 'c');
+    expect(refs.header.current).toHaveClass('flg-table-header', 'h');
+  });
+});
+
+describe('sorting', () => {
+  it('sets aria-sort only on the column that is sorted', () => {
+    render(
+      <Columns>
+        <TableHead sort="ascending">A</TableHead>
+        <TableHead sort="descending">D</TableHead>
+        <TableHead sort="none" onSort={() => {}}>
+          N
+        </TableHead>
+        <TableHead onSort={() => {}}>U</TableHead>
+      </Columns>,
+    );
+    const head = (name: string) => screen.getByRole('columnheader', { name });
+    expect(head('A')).toHaveAttribute('aria-sort', 'ascending');
+    expect(head('D')).toHaveAttribute('aria-sort', 'descending');
+    expect(head('N')).not.toHaveAttribute('aria-sort');
+    expect(head('U')).not.toHaveAttribute('aria-sort');
+  });
+
+  it('draws the arrow of the direction, and the two chevrons while it is not sorted', () => {
+    render(
+      <Columns>
+        <TableHead sort="ascending" onSort={() => {}}>
+          A
+        </TableHead>
+        <TableHead sort="descending" onSort={() => {}}>
+          D
+        </TableHead>
+        <TableHead sort="none" onSort={() => {}}>
+          N
+        </TableHead>
+        <TableHead onSort={() => {}}>U</TableHead>
+      </Columns>,
+    );
+    const icon = (name: string) =>
+      screen.getByRole('columnheader', { name }).querySelector('.flg-table-sort-icon')!;
+    expect(pathsOf(icon('A'))).toEqual([ARROW_UP, 'm5 12 7-7 7 7']);
+    expect(pathsOf(icon('D'))).toEqual([ARROW_DOWN, 'm19 12-7 7-7-7']);
+    expect(pathsOf(icon('N'))).toEqual([CHEVRONS, 'm7 9 5-5 5 5']);
+    expect(pathsOf(icon('U'))).toEqual([CHEVRONS, 'm7 9 5-5 5 5']);
+    expect(icon('A')).toHaveAttribute('aria-hidden', 'true');
+    expect(icon('A').querySelector('svg')).toHaveAttribute('width', '14');
+  });
+
+  it('wraps the title in a button only when there is an onSort, and the name is the title', () => {
+    render(
+      <Columns>
+        <TableHead>Plain</TableHead>
+        <TableHead onSort={() => {}}>Sortable</TableHead>
+      </Columns>,
+    );
+    expect(screen.getAllByRole('button')).toHaveLength(1);
+    const button = screen.getByRole('button', { name: 'Sortable' });
+    expect(button).toHaveAttribute('type', 'button');
+    expect(button).toHaveClass('flg-table-sort');
+    expect(screen.getByRole('columnheader', { name: 'Plain' }).querySelector('svg')).toBeNull();
+  });
+
+  it.each([
+    ['ascending', 'descending'],
+    ['descending', 'ascending'],
+    ['none', 'ascending'],
+    [undefined, 'ascending'],
+  ] as const)('with sort %s, a press calls onSort with %s', async (sort, next) => {
+    const onSort = vi.fn();
+    render(
+      <Columns>
+        <TableHead sort={sort} onSort={onSort}>
+          Total
+        </TableHead>
+      </Columns>,
+    );
+    await userEvent.click(screen.getByRole('button', { name: 'Total' }));
+    expect(onSort).toHaveBeenCalledTimes(1);
+    expect(onSort).toHaveBeenCalledWith(next);
+  });
+
+  it('keeps aria-sort and the icon of a sort without onSort, with no button', () => {
+    render(
+      <Columns>
+        <TableHead sort="descending">Date</TableHead>
+      </Columns>,
+    );
+    const head = screen.getByRole('columnheader', { name: 'Date' });
+    expect(head).toHaveAttribute('aria-sort', 'descending');
+    expect(screen.queryByRole('button')).toBeNull();
+    expect(pathsOf(head)).toEqual([ARROW_DOWN, 'm19 12-7 7-7-7']);
+  });
+
+  it('shows the chevrons of sort="none" without a button too, and sets no aria-sort', () => {
+    render(
+      <Columns>
+        <TableHead sort="none">Date</TableHead>
+      </Columns>,
+    );
+    const head = screen.getByRole('columnheader', { name: 'Date' });
+    expect(head).not.toHaveAttribute('aria-sort');
+    expect(pathsOf(head)).toEqual([CHEVRONS, 'm7 9 5-5 5 5']);
+  });
+});
+
+describe('the scroll frame', () => {
+  it('has no role, tabindex or name while the table fits, nor in the HTML from a server', () => {
+    fakeLayout({ room: 400, need: 300 });
+    const { container } = render(<Orders aria-label="Orders" />);
+    const frame = container.firstElementChild!;
+    for (const name of ['role', 'tabindex', 'aria-label', 'aria-labelledby']) {
+      expect(frame).not.toHaveAttribute(name);
+    }
+    // Wider than the room, but a server has no layout to say so.
+    fakeLayout({ room: 200, need: 600 });
+    expect(renderToString(<Orders aria-label="Orders" />)).not.toMatch(/role=|tabindex=/);
+  });
+
+  it('becomes a named region a keyboard can reach when the table is wider, and drops it when it fits', () => {
+    const layout = fakeLayout({ room: 200, need: 600 });
+    const { container } = render(<Orders aria-label="Orders" />);
+    const frame = container.firstElementChild!;
+    expect(frame).toHaveAttribute('role', 'region');
+    expect(frame).toHaveAttribute('tabindex', '0');
+    expect(screen.getByRole('region', { name: 'Orders' })).toBe(frame);
+    layout.resize({ room: 800 });
+    for (const name of ['role', 'tabindex', 'aria-label']) expect(frame).not.toHaveAttribute(name);
+    layout.resize({ room: 100 });
+    expect(frame).toHaveAttribute('role', 'region');
+  });
+
+  it('is named by the caption, whose id the Table makes, and the caption wins over aria-label', () => {
+    fakeLayout({ room: 200, need: 600 });
+    const { container } = render(
+      <Table aria-label="for the table only">
+        <TableCaption>Recent orders</TableCaption>
+        <TableBody>
+          <TableRow>
+            <TableCell>x</TableCell>
+          </TableRow>
+        </TableBody>
+      </Table>,
+    );
+    const frame = container.firstElementChild!;
+    const caption = screen.getByText('Recent orders');
+    expect(caption.id).not.toBe('');
+    expect(frame).toHaveAttribute('aria-labelledby', caption.id);
+    expect(frame).not.toHaveAttribute('aria-label');
+    expect(screen.getByRole('region', { name: 'Recent orders' })).toBe(frame);
+    // The table keeps the name it was given.
+    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'for the table only');
+  });
+
+  it('takes the aria-labelledby given to the Table, which stays on the table as well', () => {
+    fakeLayout({ room: 200, need: 600 });
+    const { container } = render(
+      <>
+        <h2 id="orders-title">Recent orders</h2>
+        <Orders aria-labelledby="orders-title" />
+      </>,
+    );
+    expect(screen.getByRole('region', { name: 'Recent orders' })).toBe(
+      container.querySelector('.flg-table-frame'),
+    );
+    expect(screen.getByRole('table')).toHaveAttribute('aria-labelledby', 'orders-title');
+  });
+
+  it('overrules an id forced on the caption: the frame points at the one the Table made', () => {
+    fakeLayout({ room: 200, need: 600 });
+    const { container } = render(
+      <Table>
+        {/* @ts-expect-error the type has no `id`; a caller that forces one is overruled */}
+        <TableCaption id="mine">Orders</TableCaption>
+      </Table>,
+    );
+    expect(screen.getByText('Orders').id).not.toBe('mine');
+    expect(container.firstElementChild).toHaveAttribute(
+      'aria-labelledby',
+      screen.getByText('Orders').id,
+    );
+  });
+
+  it('renders a caption outside a Table as a plain caption, without failing', () => {
+    render(
+      <table>
+        <TableCaption>Alone</TableCaption>
+      </table>,
+    );
+    expect(screen.getByText('Alone')).toHaveClass('flg-table-caption');
+    expect(screen.getByText('Alone')).not.toHaveAttribute('id');
+  });
+});
+
+describe('the name warning', () => {
+  it('warns once, in words with no changing value, when a scrollable table has no name', () => {
+    const warn = spyWarn();
+    const layout = fakeLayout({ room: 200, need: 600 });
+    render(<Orders />);
+    layout.resize({ room: 150 });
+    layout.resize({ room: 120 });
+    expect(warn).toHaveBeenCalledTimes(1);
+    expect(warn.mock.calls[0]![0]).toBe(
+      '[h2d-glass-ui] <Table> needs a name: render a TableCaption inside it, or pass aria-label or aria-labelledby.',
+    );
+  });
+
+  it('does not warn while the table fits', () => {
+    const warn = spyWarn();
+    fakeLayout({ room: 400, need: 300 });
+    render(<Orders />);
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it.each([
+    ['a caption', <TableCaption key="c">Orders</TableCaption>, {}],
+    ['an aria-label', null, { 'aria-label': 'Orders' }],
+    ['an aria-labelledby', null, { 'aria-labelledby': 'somewhere' }],
+  ])('does not warn when it has %s', (_name, caption, props) => {
+    const warn = spyWarn();
+    fakeLayout({ room: 200, need: 600 });
+    render(<Table {...props}>{caption}</Table>);
+    expect(warn).not.toHaveBeenCalled();
+  });
+});
+
+describe('a table built from the parts, as a Server Component would', () => {
+  it('renders the parts to HTML with nothing but React, no hook and no context', () => {
+    const html = renderToString(
+      <table>
+        <TableHeader>
+          <TableRow>
+            <TableHead>A</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          <TableRow selected>
+            <TableCell align="end">1</TableCell>
+          </TableRow>
+        </TableBody>
+        <TableFooter />
+      </table>,
+    );
+    expect(html).toContain('<th scope="col" class="flg-table-head">A</th>');
+    expect(html).toContain('<tr class="flg-table-row" data-selected="">');
+    expect(html).toContain('<td class="flg-table-cell" data-align="end">1</td>');
+  });
+});
+
+describe('cells that hold a control', () => {
+  it('lets a Checkbox sit alone in a cell, with its own name', () => {
+    render(
+      <Table aria-label="x">
+        <TableBody>
+          <TableRow>
+            <TableCell>
+              <Checkbox aria-label="Select DH-1042" />
+            </TableCell>
+          </TableRow>
+        </TableBody>
+      </Table>,
+    );
+    const cell = within(screen.getByRole('table')).getAllByRole('cell')[0]!;
+    expect(cell.firstElementChild).toHaveClass('flg-checkbox');
+    expect(within(cell).getByRole('checkbox', { name: 'Select DH-1042' })).toBeInTheDocument();
+  });
+});
diff --git a/src/components/table/use-scrollable.test.tsx b/src/components/table/use-scrollable.test.tsx
new file mode 100644
index 0000000..540b9e8
--- /dev/null
+++ b/src/components/table/use-scrollable.test.tsx
@@ -0,0 +1,136 @@
+import { act, render, renderHook } from '@testing-library/react';
+import { useRef } from 'react';
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import { useScrollable } from './use-scrollable';
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
+/** The sizes jsdom has no layout to give: the frame's room and what the table needs. */
+interface Sizes {
+  clientWidth: number;
+  scrollWidth: number;
+  clientHeight: number;
+  scrollHeight: number;
+}
+
+function sizeOf(element: HTMLElement, sizes: Sizes) {
+  for (const name of Object.keys(sizes) as Array<keyof Sizes>) {
+    Object.defineProperty(element, name, { configurable: true, get: () => sizes[name] });
+  }
+}
+
+/** A frame and a table that report `sizes`, put in the document, with every render counted. */
+function Probe({ sizes, onRender }: { sizes: Sizes; onRender: (scrollable: boolean) => void }) {
+  const frame = useRef<HTMLDivElement>(null);
+  const table = useRef<HTMLTableElement>(null);
+  // The sizes must be there before the hook's layout effect reads them, as a browser's layout is.
+  const refFrame = (element: HTMLDivElement | null) => {
+    (frame as { current: HTMLDivElement | null }).current = element;
+    if (element) sizeOf(element, sizes);
+  };
+  const scrollable = useScrollable(frame, table);
+  onRender(scrollable);
+  return (
+    <div ref={refFrame} data-testid="frame" data-scrollable={String(scrollable)}>
+      <table ref={table} />
+    </div>
+  );
+}
+
+const fits: Sizes = { clientWidth: 400, scrollWidth: 400, clientHeight: 200, scrollHeight: 200 };
+
+afterEach(() => vi.unstubAllGlobals());
+
+describe('useScrollable', () => {
+  it('is false where there is no ResizeObserver, as in jsdom', () => {
+    const { result } = renderHook(() => {
+      const frame = useRef<HTMLDivElement>(null);
+      const table = useRef<HTMLTableElement>(null);
+      return useScrollable(frame, table);
+    });
+    expect(result.current).toBe(false);
+  });
+
+  it('is false while the table fits, and observes the frame and the table', () => {
+    const observers = fakeResizeObservers();
+    const { getByTestId } = render(<Probe sizes={fits} onRender={() => {}} />);
+    expect(getByTestId('frame')).toHaveAttribute('data-scrollable', 'false');
+    expect(observers).toHaveLength(1);
+    expect(Array.from(observers[0]!.observed, (target) => target.tagName)).toEqual([
+      'DIV',
+      'TABLE',
+    ]);
+  });
+
+  it.each([
+    ['wider', { ...fits, scrollWidth: 700 }],
+    ['taller', { ...fits, scrollHeight: 500 }],
+  ])('is true when the table is %s than the frame, before the first paint', (_name, sizes) => {
+    fakeResizeObservers();
+    const { getByTestId } = render(<Probe sizes={sizes} onRender={() => {}} />);
+    expect(getByTestId('frame')).toHaveAttribute('data-scrollable', 'true');
+  });
+
+  it('follows the frame as it is resized, both ways', () => {
+    const observers = fakeResizeObservers();
+    const sizes = { ...fits };
+    const { getByTestId } = render(<Probe sizes={sizes} onRender={() => {}} />);
+    const frame = getByTestId('frame');
+    sizes.scrollWidth = 700;
+    act(() => observers[0]!.resize());
+    expect(frame).toHaveAttribute('data-scrollable', 'true');
+    sizes.scrollWidth = 400;
+    act(() => observers[0]!.resize());
+    expect(frame).toHaveAttribute('data-scrollable', 'false');
+  });
+
+  it('renders again only when the answer changes, so a resize does not loop', () => {
+    const observers = fakeResizeObservers();
+    const sizes = { ...fits };
+    const onRender = vi.fn();
+    render(<Probe sizes={sizes} onRender={onRender} />);
+    const before = onRender.mock.calls.length;
+    // Resizes that leave the table fitting, and then ones that leave it scrolling.
+    act(() => observers[0]!.resize());
+    sizes.clientWidth = 420;
+    sizes.scrollWidth = 420;
+    act(() => observers[0]!.resize());
+    expect(onRender).toHaveBeenCalledTimes(before);
+    sizes.scrollWidth = 700;
+    act(() => observers[0]!.resize());
+    const scrolling = onRender.mock.calls.length;
+    expect(scrolling).toBe(before + 1);
+    sizes.scrollWidth = 800;
+    act(() => observers[0]!.resize());
+    expect(onRender).toHaveBeenCalledTimes(scrolling);
+  });
+
+  it('stops observing when it unmounts', () => {
+    const observers = fakeResizeObservers();
+    const { unmount } = render(<Probe sizes={fits} onRender={() => {}} />);
+    unmount();
+    expect(observers[0]!.disconnect).toHaveBeenCalled();
+  });
+});
diff --git a/src/docs/ExceptionTable.test.tsx b/src/docs/ExceptionTable.test.tsx
index 2ddcc11..37202a1 100644
--- a/src/docs/ExceptionTable.test.tsx
+++ b/src/docs/ExceptionTable.test.tsx
@@ -14,9 +14,9 @@ describe('ExceptionTable', () => {
       .getAllByRole('cell')
       .map((cell) => cell.textContent);
 
-  it('lists the thirty-one rows of spec §4.9 with light and dark measurements', () => {
+  it('lists the thirty-four rows of spec §4.9 with light and dark measurements', () => {
     const rows = bodyRows();
-    expect(rows).toHaveLength(31);
+    expect(rows).toHaveLength(34);
     expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
       '1',
       '2',
@@ -49,6 +49,9 @@ describe('ExceptionTable', () => {
       '29',
       '30',
       '31',
+      '32',
+      '33',
+      '34',
     ]);
     expect(rows[3]).toHaveTextContent('meets AA (4.74:1)');
     expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
@@ -90,6 +93,11 @@ describe('ExceptionTable', () => {
     // current step of a `compact` Stepper on its pill.
     expect(cells(rows[29]!).slice(1, 3)).toEqual(['2.63:1', '2.63:1']);
     expect(cells(rows[30]!).slice(1, 3)).toEqual(['2.61:1', '2.01:1']);
+    // The Table rows (spec phase 4 §4.4): a Badge on the row under the pointer, the text on the odd
+    // row of `striped` (only the muted text passes in light) and a Badge on a chosen row.
+    expect(cells(rows[31]!).slice(1, 3)).toEqual(['2.80:1', '3.03:1']);
+    expect(cells(rows[32]!).slice(1, 3)).toEqual(['3.09:1', '3.71:1 / 3.37:1']);
+    expect(cells(rows[33]!).slice(1, 3)).toEqual(['2.97:1', '3.27:1']);
   });
 
   it('shows the live measurement for a theme with no exception in a row', () => {
@@ -133,6 +141,9 @@ describe('ExceptionTable', () => {
       '1.4.3',
       '1.4.11',
       '1.4.11',
+      '1.4.3',
+      '1.4.3',
+      '1.4.3',
     ]);
     expect(cells(rows[3]!).at(-2)).toBe('4.5:1 text, 3:1 check marks');
     expect(cells(rows[0]!).at(-2)).toBe('3:1');
diff --git a/src/index.test.ts b/src/index.test.ts
index fcc7766..7e5b6dd 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -94,6 +94,14 @@ describe('public API', () => {
       'Stepper',
       'Surface',
       'Switch',
+      'Table',
+      'TableBody',
+      'TableCaption',
+      'TableCell',
+      'TableFooter',
+      'TableHead',
+      'TableHeader',
+      'TableRow',
       'Tabs',
       'TabsContent',
       'TabsList',
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index 511cb70..d3e8f23 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -2,10 +2,12 @@ import { render } from '@testing-library/react';
 import { describe, expect, it } from 'vitest';
 
 import {
+  ArrowIcon,
   BoxCheckIcon,
   CalendarIcon,
   CheckIcon,
   ChevronIcon,
+  ChevronsUpDownIcon,
   CloseIcon,
   ExclamationIcon,
   FileIcon,
@@ -68,6 +70,32 @@ describe('shared icons', () => {
     expect(svg.getAttribute('aria-hidden')).toBe('true');
   });
 
+  it.each([
+    ['down', ['M12 5v14', 'm19 12-7 7-7-7']],
+    ['up', ['M12 19V5', 'm5 12 7-7 7 7']],
+  ] as const)('ArrowIcon direction %s pins its paths', (direction, paths) => {
+    const { container } = render(<ArrowIcon direction={direction} />);
+    expect(Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual(
+      paths,
+    );
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    expect(svg.getAttribute('stroke-width')).toBe('2');
+  });
+
+  it('ChevronsUpDownIcon pins its paths: the lower chevron first, as the mockup draws them', () => {
+    const { container } = render(<ChevronsUpDownIcon width={14} />);
+    expect(Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual([
+      'm7 15 5 5 5-5',
+      'm7 9 5-5 5 5',
+    ]);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    expect(svg.getAttribute('width')).toBe('14');
+  });
+
   it('CloseIcon pins its path', () => {
     const { container } = render(<CloseIcon />);
     expect(container.querySelector('path')?.getAttribute('d')).toBe('M18 6 6 18M6 6l12 12');
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/table src/internal/icons.test.tsx src/docs/ExceptionTable.test.tsx src/index.test.ts scripts/lib/contrast.test.ts
```

Expected: FAIL.
- `use-scrollable.test.tsx` không nạp được ở cả hai project React, nên 7 test không chạy: `Failed to resolve import "./use-scrollable" from "src/components/table/use-scrollable.test.tsx". Does the file exist?`.
- `Table.test.tsx` không nạp được ở cả hai project React, nên 31 test không chạy: `Failed to resolve import "./Table" from "src/components/table/Table.test.tsx". Does the file exist?`.
- `Table.test-d.ts` báo lỗi kiểu vì module chưa có.
- `shared icons > ArrowIcon direction down pins its paths`, `shared icons > ArrowIcon direction up pins its paths` và `shared icons > ChevronsUpDownIcon pins its paths: the lower chevron first, as the mockup draws them` fail ở mỗi project React: `Element type is invalid … got: undefined`, vì hai icon chưa được export.
- `public API > exports exactly the documented components and nothing internal`: danh sách export nhận được thiếu tám export của Table.
- `the Table checks (spec phase 4 §4.4) > are all text at 4.5:1`: `expected undefined to be 4.5`. Bốn ca `measure …` và `measures the Badge on the row under the pointer, not on the surface` cũng fail, vì `measure` chưa trả năm check đó.
- `ExceptionTable > lists the thirty-four rows of spec §4.9 with light and dark measurements`: `expected [ … ] to have a length of 34 but got 31`. `names the WCAG criterion and minimum of every row`: danh sách tiêu chí có 31 phần tử, test mong 34. Bản nháp không thấy hai lỗi này trên cây cũ (phát hiện 12).

`pnpm check:contrast` không có bước fail riêng: số của phát hiện 6 là đặc tả của script. Story viết cùng code và chạy ở Step 4; `FocusRingsInsideLinedFrame` là story duy nhất được thấy fail, ở một lần chạy đột biến (phát hiện 12).

- [ ] **Step 3: Viết code**

````diff
diff --git a/.storybook/painted-pixel.ts b/.storybook/painted-pixel.ts
index d98e499..1902eba 100644
--- a/.storybook/painted-pixel.ts
+++ b/.storybook/painted-pixel.ts
@@ -3,12 +3,17 @@
 // of the element through Vitest browser mode, which only runs under `pnpm test:stories`; in the
 // Storybook UI it returns null, and play functions skip the steps that need it.
 
-/** The red, green and blue of the pixel at (x, y), in CSS pixels from the element's top left. */
-export async function paintedPixel(
+export type Rgb = [number, number, number];
+
+/**
+ * The red, green and blue of the pixels at each (x, y), in CSS pixels from the element's top left,
+ * from one screenshot. Use it where a point is not exact: a screenshot starts at a whole device pixel
+ * and the element may not, so a ring that is 2px wide is found by looking at a few points across it.
+ */
+export async function paintedPixels(
   element: Element,
-  x: number,
-  y: number,
-): Promise<[number, number, number] | null> {
+  points: ReadonlyArray<readonly [number, number]>,
+): Promise<Rgb[] | null> {
   if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return null;
   const { page } = await import('vitest/browser');
   const base64 = await page.screenshot({ element, save: false });
@@ -22,11 +27,19 @@ export async function paintedPixel(
   canvas.height = image.naturalHeight;
   const context = canvas.getContext('2d')!;
   context.drawImage(image, 0, 0);
-  const [red, green, blue] = context.getImageData(
-    Math.floor(x * scale),
-    Math.floor(y * scale),
-    1,
-    1,
-  ).data;
-  return [red!, green!, blue!];
+  return points.map(([x, y]) => {
+    const [red, green, blue] = context.getImageData(
+      Math.floor(x * scale),
+      Math.floor(y * scale),
+      1,
+      1,
+    ).data;
+    return [red!, green!, blue!];
+  });
+}
+
+/** The red, green and blue of the pixel at (x, y), in CSS pixels from the element's top left. */
+export async function paintedPixel(element: Element, x: number, y: number): Promise<Rgb | null> {
+  const pixels = await paintedPixels(element, [[x, y]]);
+  return pixels ? pixels[0]! : null;
 }
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index e4830cf..dbf7fcc 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -313,17 +313,17 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
-| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
+| 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
 | 10 | Chữ `--flg-danger` trên item `danger` đang được trỏ (nền danger 16%); tiêu đề và mô tả của bước lỗi trong viên thuốc (Stepper `compact`) | 4.24:1 | đạt (4.57:1) | 4.5:1 | 1.4.3 |
 | 11 | Ô checkbox đã chọn (màu nhấn) trên option đang được trỏ của Select chọn nhiều, so với nền `--flg-accent-subtle` của hàng | 2.61:1 | 1.91:1 | 3:1 | 1.4.11 |
-| 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được, và mô tả của bước Stepper bấm được, khi hover (`inset`, `plain`; `cards` ở dark) | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
+| 12 | Chữ `--flg-text-muted` của tab `segmented` trên rãnh `--flg-control-track`; mô tả của hàng List bấm được, và mô tả của bước Stepper bấm được, và chữ mờ trên hàng của Table, khi hover (`inset`, `plain`; `cards` ở dark) | 4.10:1 | 3.36:1 | 4.5:1 | 1.4.3 |
 | 13 | Tab `segmented` đang chọn (nền `--flg-control-bg`) so với rãnh | 1.24:1 | 1.12:1 | 3:1 | 1.4.11 |
 | 14 | Icon và vạch của toast `info` (`--flg-accent-solid`) so với nền; viền 2px của dấu tròn bước hiện tại (Stepper `circles`); viền 1.5px của hàng hiện tại (List `cards`) | đạt (3.04:1) | 2.29:1 | 3:1 | 1.4.11 |
 | 15 | Chấm vạch chia của Slider (`--flg-slider-tick`, 70% `--flg-text-muted`) so với nền | 2.88:1 | 2.82:1 | 3:1 | 1.4.11 |
@@ -333,7 +333,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 19 | Viền đứt nét của vùng thả FileUpload (`--flg-dropzone-border`, 45% `--flg-text-muted`) so với nền | 1.89:1 | 1.99:1 | 3:1 | 1.4.11 |
 | 20 | Chữ `--flg-accent-text` của nút chọn tệp trên nền vùng thả `--flg-control-bg-secondary` | đạt (5.42:1) | 3.79:1 | 4.5:1 | 1.4.3 |
 | 21 | Cỡ tệp (`--flg-text-muted`) trên nền dòng tệp `--flg-control-bg` của FileUpload; mô tả của Alert `plain` | đạt (7.44:1) | 3.71:1 | 4.5:1 | 1.4.3 |
-| 22 | Dòng gợi ý (`--flg-text-muted`) trên nền vùng thả `--flg-control-bg-secondary` của FileUpload; mô tả của Alert `stripe` | đạt (6.98:1) | 3.64:1 | 4.5:1 | 1.4.3 |
+| 22 | Dòng gợi ý (`--flg-text-muted`) trên nền vùng thả `--flg-control-bg-secondary` của FileUpload; mô tả của Alert `stripe`; tiêu đề cột của Table `lined` | đạt (6.98:1) | 3.64:1 | 4.5:1 | 1.4.3 |
 | 23 | Icon và vạch `info` (`--flg-accent-solid`) của Alert so với nền của Alert | đạt (4.18:1 `stripe`, 3.60:1 `tinted`, 3.62:1 `plain`) | 2.02:1 `stripe`, 1.84:1 `tinted`, 1.88:1 `plain` | 3:1 | 1.4.11 |
 | 24 | Tiêu đề của Alert `tinted` (màu trạng thái; `--flg-accent-text` cho `info`) trên nền nhuộm | đạt (4.68:1) | 3.37:1 | 4.5:1 | 1.4.3 |
 | 25 | Mô tả `--flg-text` của Alert `tinted` trên nền nhuộm | đạt (11.14:1) | 4.16:1 | 4.5:1 | 1.4.3 |
@@ -343,6 +343,9 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | 29 | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; dòng "Step N" của bước xong và bước hiện tại (Stepper `bars`) | 3.95:1 | 4.44:1 | 4.5:1 | 1.4.3 |
 | 30 | Vòng của bước chưa tới (`--flg-stepper-ring`, 65% `--flg-text-muted`) so với nền: Stepper `circles` và `compact` | 2.63:1 | 2.63:1 | 3:1 | 1.4.11 |
 | 31 | Vạch `--flg-accent-solid` trên nền nhấn nhạt `--flg-selected-bg`: viền 2px của dấu tròn bước hiện tại, Stepper `compact`; vạch 3px của hàng hiện tại, List `inset` | 2.61:1 | 2.01:1 | 3:1 | 1.4.11 |
+| 32 | Chữ của Badge trên hàng đang hover (`--flg-control-track`): Table (cả ba variant); Badge ở ô cuối của hàng List bấm được | 2.80:1 `accent` (trạng thái 3.69:1) | 3.03:1 `accent` (trạng thái 3.67:1, `neutral` 4.15:1) | 4.5:1 | 1.4.3 |
+| 33 | Chữ trên hàng lẻ của Table `striped` (`--flg-control-track` pha 50%): chữ mờ `--flg-text-muted`; chữ của Badge | đạt (4.57:1) chữ mờ; Badge 3.09:1 `accent` (trạng thái 4.09:1) | chữ mờ 3.71:1; Badge 3.37:1 `accent` (trạng thái 4.08:1) | 4.5:1 | 1.4.3 |
+| 34 | Chữ của Badge trên hàng đã chọn của Table (`--flg-accent-subtle`) | 2.97:1 `accent` (trạng thái 3.91:1) | 3.27:1 `accent` (trạng thái 3.98:1) | 4.5:1 | 1.4.3 |
 
 Các số được **làm tròn xuống** 2 chữ số thập phân, và là đúng các giá trị mà script tương phản ghi nhận làm mốc. Điểm 7 được phát hiện khi chạy thử script trong lúc lập kế hoạch. Điểm 8–10 là item đang được trỏ theo mockup menu A (giai đoạn 2, Plan B). Điểm 11 là ô checkbox theo mockup M1 (giai đoạn 2, Plan C), được đo từ khi review Plan C. Điểm 14 là icon `info` của toast theo mockup toast S2 (giai đoạn 2, Plan E1). Điểm 6 còn là chữ mờ của option Combobox đang lọc và dòng trạng thái (giai đoạn 3, Plan B) và chữ hàng thứ của Calendar (giai đoạn 3, Plan C): cùng cặp màu, nên cùng số đo. Điểm 18 là ngày của tháng khác theo mockup K1 (giai đoạn 3, Plan C), nửa độ mờ nên thấp hơn hẳn chữ mờ thường. Điểm 15–17 là chấm vạch, rãnh và núm của Slider theo mockup S3 (giai đoạn 3, Plan A). Điểm 19–22 là viền vùng thả, nút chọn tệp, cỡ tệp và dòng gợi ý của FileUpload theo mockup F1 (giai đoạn 3, Plan D); dòng gợi ý khi đang kéo (chữ mờ trên nền nhấn) cùng cặp màu với điểm 9, nên được ghi ở điểm 9 (phát hiện khi review cuối Plan D). Light của điểm 2 (trước là 1.21:1) và điểm 7 (trước là 3.53:1) giảm khi đo trên lớp phủ. Cũng vì lớp phủ, chủ dự án quyết định ngày 2026-10-06 làm đậm 3% ba màu trạng thái ngoài mockup của light (`success`, `warning`, `danger`), để chữ Badge trạng thái vẫn đạt 4.5:1 trong Dialog.
 
@@ -352,7 +355,9 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 30–31 là Stepper và List theo mockup St1–St3 và L1–L3 (giai đoạn 4, Plan B): vòng của bước chưa tới (điểm 30, `circles` và `compact`) và viền dấu tròn của bước hiện tại trên viên thuốc của `compact`, cùng vạch 3px của hàng hiện tại List `inset` trên nền hàng (điểm 31, cùng cặp màu nên cùng số đo). Số của bước hiện tại (`--flg-accent-text` trên `--flg-control-bg`, và trên dấu tròn trong viên thuốc) cùng cặp màu với điểm 26 nên được ghi ở đó; dấu ✓ của bước đã xong đạt (3.40 light, 3.59 dark), nên không phải ngoại lệ. Các vị trí khác của Stepper cùng cặp màu với các điểm 2, 5, 6, 7, 8, 9, 10, 14, 16, 27 và 29, nên được ghi ở đó. Ở `prefers-contrast: more` vòng thành màu đặc, thanh chưa tới có viền và viên thuốc của bước hiện tại là màu nhấn đặc, nên cả hai điểm đều đạt. Các vị trí khác của List cùng cặp màu với các điểm 2 (vòng focus vẽ trên hàng), 6 (mô tả và chữ ở ô cuối), 7 và 8 (tiêu đề và nền của hàng hiện tại), 9 (mô tả và chữ ở ô cuối của hàng hiện tại), 12 (mô tả của hàng bấm được khi hover) và 14 (viền 1.5px của `cards`), nên được ghi ở đó. Ở `prefers-contrast: more` hàng hiện tại là màu nhấn đặc, mọi chữ trong hàng và vạch của `inset` lấy `--flg-selected-text`, và hàng không đổi nền khi hover, nên điểm 31 đạt.
 
-Cả ba mươi mốt điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
+Điểm 32–34 là chữ trên nền hàng của Table theo mockup T1–T3 (giai đoạn 4, Plan C), thêm khi đọc soát spec giai đoạn 4: Badge trên hàng đang hover (điểm 32, cả ba variant, kèm Badge ở ô cuối của hàng List bấm được, cùng nền `--flg-control-track`), chữ trên hàng lẻ của `striped` (điểm 33: chữ mờ và Badge) và Badge trên hàng đã chọn (điểm 34). Số là thấp nhất trong năm variant Badge, mỗi cái trên nền của chính nó đặt lên nền hàng; Badge `accent` thấp nhất vì nó là lớp nhuộm nhấn thứ hai. Chữ `--flg-text` trên cả ba nền hàng đạt (8.01:1 light, 5.23:1 dark), nên không phải ngoại lệ. Các vị trí khác của Table cùng cặp màu với các điểm 2 (vòng focus của nút sắp xếp và khung cuộn), 6 (tiêu đề cột `striped` và `minimal`, icon cột chưa sắp), 9 (chữ mờ trên hàng đã chọn), 12 (chữ mờ trên hàng đang hover) và 22 (tiêu đề cột `lined`); icon của cột đang sắp (`--flg-accent-text` trên bề mặt) là cặp của điểm 29, là icon nên ngưỡng 3:1 và đạt. Ở `prefers-contrast: more` hàng đã chọn có khung 2px thay cho nền nhuộm, `striped` có đường kẻ thay cho sọc và hàng không đổi nền khi hover, nên mọi chữ trong hàng nằm trên bề mặt và cả ba điểm đều đạt.
+
+Cả ba mươi bốn điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index f695de9..bf4baed 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -156,6 +156,18 @@ const SHIPPED_CLASSES = [
   'flg-list-item-title',
   'flg-list-item-description',
   'flg-list-item-end',
+  'flg-table-frame',
+  'flg-table',
+  'flg-table-caption',
+  'flg-table-header',
+  'flg-table-body',
+  'flg-table-footer',
+  'flg-table-row',
+  'flg-table-head',
+  'flg-table-cell',
+  'flg-table-sort',
+  'flg-table-sort-static',
+  'flg-table-sort-icon',
 ];
 
 const requirements: Array<[string, boolean]> = [
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index c91b75d..7ab53aa 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -31,6 +31,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/accordion/Accordion.tsx',
   'src/components/pagination/Pagination.tsx',
   'src/components/progress/Progress.tsx',
+  'src/components/table/Table.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
   'src/components/file-upload/FileUpload.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index b67ffee..9d91808 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -27,8 +27,8 @@ const D = {
   2: {
     description:
       'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
-      'step, on a row of a List, and on an invalid Input or Textarea, whose border stays red while ' +
-      'focused',
+      'step, on a row of a List, on the sort button and the scroll frame of a Table, and on an ' +
+      'invalid Input or Textarea, whose border stays red while focused',
     criterion: '1.4.11',
   },
   3: {
@@ -51,8 +51,9 @@ const D = {
       'Muted text on the brightest reference backdrop, the muted text of a Combobox option ' +
       'while filtering and of its status row, the weekday row of a Calendar, the value of a ' +
       'Progress `thin`, in a Stepper the number, title and description of a step not reached, the ' +
-      'description of every step and the "Step N" line of a step not reached, and in a List the ' +
-      'description and the end cell of a row',
+      'description of every step and the "Step N" line of a step not reached, in a List the ' +
+      'description and the end cell of a row, and in a Table `striped` and `minimal` the column ' +
+      'headings and the icon of a column that is not sorted',
     criterion: '1.4.3',
   },
   7: {
@@ -72,7 +73,8 @@ const D = {
     description:
       'Muted icon, shortcut and submenu chevron on a highlighted menu item or option, the hint ' +
       'of a FileUpload zone while files are over it, the description of the current step of a ' +
-      'Stepper `compact`, and the description and end cell of the current row of a List',
+      'Stepper `compact`, the description and end cell of the current row of a List, and the muted ' +
+      'text on a chosen row of a Table',
     criterion: '1.4.3, 1.4.11',
     minimum: '4.5:1 shortcut text, 3:1 icons',
   },
@@ -91,8 +93,8 @@ const D = {
   12: {
     description:
       'Muted text of a segmented tab on its track, the description of a row of a List that can ' +
-      'be pressed, and the description of a pressable Stepper step, under the pointer (`inset` and ' +
-      '`plain`; `cards` in dark)',
+      'be pressed, the description of a pressable Stepper step, and the muted text on a row of a ' +
+      'Table, under the pointer (`inset` and `plain`; `cards` in dark)',
     criterion: '1.4.3',
   },
   13: { description: 'Selected segmented tab against its track', criterion: '1.4.11' },
@@ -131,8 +133,8 @@ const D = {
   },
   22: {
     description:
-      'The hint of a FileUpload zone, muted text on the zone background, and the description of ' +
-      'an Alert `stripe`',
+      'The hint of a FileUpload zone, muted text on the zone background, the description of an ' +
+      'Alert `stripe`, and the column headings of a Table `lined`',
     criterion: '1.4.3',
   },
   23: {
@@ -185,6 +187,22 @@ const D = {
       'current step in a Stepper `compact`, and the bar of the current row of a List `inset`',
     criterion: '1.4.11',
   },
+  32: {
+    description:
+      'The text of a Badge on a row of a Table under the pointer (the control track), and of a ' +
+      'Badge in the end cell of a List row that can be pressed, under the pointer',
+    criterion: '1.4.3',
+  },
+  33: {
+    description:
+      'The text on the odd row of a Table `striped` (the control track at 50%): the muted text ' +
+      'in dark, and the text of a Badge',
+    criterion: '1.4.3',
+  },
+  34: {
+    description: 'The text of a Badge on a chosen row of a Table (the accent wash)',
+    criterion: '1.4.3',
+  },
 } as const satisfies Record<number, ExceptionRowInfo>;
 
 /** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
@@ -251,4 +269,11 @@ export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
   { row: 30, theme: 'dark', check: 'stepper-ring', recorded: 2.63, ...D[30] },
   { row: 31, theme: 'light', check: 'current-edge', recorded: 2.61, ...D[31] },
   { row: 31, theme: 'dark', check: 'current-edge', recorded: 2.01, ...D[31] },
+  { row: 32, theme: 'light', check: 'table-hover-badge', recorded: 2.8, ...D[32] },
+  { row: 32, theme: 'dark', check: 'table-hover-badge', recorded: 3.03, ...D[32] },
+  { row: 33, theme: 'dark', check: 'table-stripe-text-muted', recorded: 3.71, ...D[33] },
+  { row: 33, theme: 'light', check: 'table-stripe-badge', recorded: 3.09, ...D[33] },
+  { row: 33, theme: 'dark', check: 'table-stripe-badge', recorded: 3.37, ...D[33] },
+  { row: 34, theme: 'light', check: 'table-selected-badge', recorded: 2.97, ...D[34] },
+  { row: 34, theme: 'dark', check: 'table-selected-badge', recorded: 3.27, ...D[34] },
 ];
diff --git a/scripts/lib/contrast.ts b/scripts/lib/contrast.ts
index 69f4e7a..3531c9f 100644
--- a/scripts/lib/contrast.ts
+++ b/scripts/lib/contrast.ts
@@ -76,6 +76,11 @@ export const CHECKS = {
   'stepper-current-number': 4.5,
   'stepper-done-mark': 3,
   'current-edge': 3,
+  'table-row-text': 4.5,
+  'table-hover-badge': 4.5,
+  'table-stripe-text-muted': 4.5,
+  'table-stripe-badge': 4.5,
+  'table-selected-badge': 4.5,
 } as const;
 export type CheckId = keyof typeof CHECKS;
 const CHECK_IDS = Object.keys(CHECKS) as CheckId[];
@@ -370,6 +375,42 @@ export function measure(
         return contrastRatio(composite(color('accent-text'), dot), dot);
       }),
     );
+    // A Table (table.css). Its rows have three backgrounds that text can sit on: the one under the
+    // pointer (control-track), the odd row of `striped` (control-track at 50%) and a chosen row
+    // (accent-subtle, a wash that may be a gradient: each stop counts). Contrast-more takes all three
+    // away (preferences.css), so everything in a row is on the surface itself.
+    const tableRows =
+      mode === 'contrast-more'
+        ? { hover: [surface], stripe: [surface], selected: [surface] }
+        : {
+            hover: [composite(color('control-track'), surface)],
+            stripe: [composite(withOpacity('control-track', 0.5), surface)],
+            selected: paintStops(resolveToken(t, 'accent-subtle')).map((stop) =>
+              composite(stop, surface),
+            ),
+          };
+    const textOnRows = (name: string, rows: Rgba[]) =>
+      Math.min(...rows.map((row) => contrastRatio(composite(color(name), row), row)));
+    // The five Badge variants, each on its own background laid over the row.
+    const badgeBackgrounds: Array<{ fg: string; bgs: Rgba[] }> = [
+      { fg: 'text', bgs: [color('control-track')] },
+      { fg: 'accent-text', bgs: paintStops(resolveToken(t, 'accent-subtle')) },
+      ...(['success', 'warning', 'danger'] as const).map((name) => {
+        const [r, g, b] = color(name);
+        return { fg: name, bgs: [[r, g, b, statusAlpha]] as Rgba[] };
+      }),
+    ];
+    const badgesOnRows = (rows: Rgba[]) =>
+      Math.min(
+        ...rows.flatMap((row) =>
+          badgeBackgrounds.flatMap(({ fg, bgs }) =>
+            bgs.map((bg) => {
+              const under = composite(bg, row);
+              return contrastRatio(composite(color(fg), under), under);
+            }),
+          ),
+        ),
+      );
     const measured: Omit<Record<CheckId, number>, OverlayCheck> = {
       text: onSurface('text'),
       'text-muted': onSurface('text-muted'),
@@ -531,6 +572,17 @@ export function measure(
                 return contrastRatio(composite(color('accent-solid'), wash), wash);
               }),
             ),
+      // The text colour on the three row backgrounds of a Table; the muted text on those is already
+      // measured by rows 9 and 12 of §4.9, except on the stripe.
+      'table-row-text': Math.min(
+        textOnRows('text', tableRows.hover),
+        textOnRows('text', tableRows.stripe),
+        textOnRows('text', tableRows.selected),
+      ),
+      'table-hover-badge': badgesOnRows(tableRows.hover),
+      'table-stripe-text-muted': textOnRows('text-muted', tableRows.stripe),
+      'table-stripe-badge': badgesOnRows(tableRows.stripe),
+      'table-selected-badge': badgesOnRows(tableRows.selected),
     };
     for (const id of SURFACE_CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
   }
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index aeef8ea..23e0e18 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -239,6 +239,46 @@ const CASES = [
     },
     expect: { type: 'ul', className: 'flg-list' },
   },
+  // The parts of a table that take no hook. The Table itself is a client component, so a table built
+  // in a Server Component puts these inside it; they are rendered here as React would, so a hook or
+  // a context in any of them fails. A sort without `onSort` is the form a server can write.
+  ...[
+    ['TableHeader', 'thead', 'flg-table-header'],
+    ['TableBody', 'tbody', 'flg-table-body'],
+    ['TableFooter', 'tfoot', 'flg-table-footer'],
+  ].map(([exportName, type, className]) => ({
+    label: exportName,
+    file: '../dist/components/table/table-parts.js',
+    exportName,
+    element: async (C) => {
+      const { TableRow } = await import(
+        new URL('../dist/components/table/table-parts.js', import.meta.url)
+      );
+      return createElement(C, null, createElement(TableRow, null));
+    },
+    expect: { type, className },
+  })),
+  {
+    label: 'TableRow selected',
+    file: '../dist/components/table/table-parts.js',
+    exportName: 'TableRow',
+    element: (C) => createElement(C, { selected: true }),
+    expect: { type: 'tr', className: 'flg-table-row' },
+  },
+  {
+    label: 'TableHead with a sort and no onSort',
+    file: '../dist/components/table/table-parts.js',
+    exportName: 'TableHead',
+    element: (C) => createElement(C, { sort: 'descending', align: 'end' }, 'Total'),
+    expect: { type: 'th', className: 'flg-table-head' },
+  },
+  {
+    label: 'TableCell',
+    file: '../dist/components/table/table-parts.js',
+    exportName: 'TableCell',
+    element: (C) => createElement(C, { align: 'end' }, 'x'),
+    expect: { type: 'td', className: 'flg-table-cell' },
+  },
 ];
 
 let failed = 0;
diff --git a/src/components/table/Table.mdx b/src/components/table/Table.mdx
new file mode 100644
index 0000000..9fd2ecb
--- /dev/null
+++ b/src/components/table/Table.mdx
@@ -0,0 +1,222 @@
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './Table.stories';
+
+<Meta of={Stories} />
+
+# Table
+
+Rows and columns of data, in a frame that scrolls when the table is wider than its room. The library
+draws the table and says what is sorted; it does not sort, filter or page the data, which is yours
+to do (and `Pagination` is there for the last).
+
+```tsx
+import {
+  Table,
+  TableBody,
+  TableCaption,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from 'h2d-glass-ui';
+
+<Table>
+  <TableCaption>Recent orders</TableCaption>
+  <TableHeader>
+    <TableRow>
+      <TableHead>Order</TableHead>
+      <TableHead align="end" sort="descending" onSort={(next) => setSort(next)}>
+        Total
+      </TableHead>
+    </TableRow>
+  </TableHeader>
+  <TableBody>
+    <TableRow>
+      <TableCell>DH-1042</TableCell>
+      <TableCell align="end">1.250.000 ₫</TableCell>
+    </TableRow>
+  </TableBody>
+</Table>;
+```
+
+<Canvas of={Stories.Lined} />
+
+## Props
+
+### Table
+
+| Prop           | Type                                | Default   | Does                                                          |
+| -------------- | ----------------------------------- | --------- | ------------------------------------------------------------- |
+| `variant`      | `'lined' \| 'striped' \| 'minimal'` | `'lined'` | The look                                                      |
+| `size`         | `'sm' \| 'md'`                      | `'md'`    | The padding of the cells and the size of the text             |
+| `stickyHeader` | `boolean`                           | `false`   | Keeps the column headings at the top of the frame (see below) |
+
+`ref` and every other attribute of a `table` (`aria-label`, `id`…) go to the `<table>`. `className`
+and `style` go to the scroll frame around it, the part that is seen: put a `max-height` there for a
+sticky heading, or a width.
+
+### TableCaption
+
+The name of the table, shown above it. It must be the first child of the `Table`, as a `<caption>`
+must. It takes no `id`: the Table makes one, so that the scroll frame can be named by it.
+
+### TableHeader, TableBody, TableFooter
+
+A `thead`, `tbody` and `tfoot`. Their rows and cells are the same as in a plain table. The footer
+row is drawn bold.
+
+### TableRow
+
+| Prop       | Type      | Does                                                                  |
+| ---------- | --------- | --------------------------------------------------------------------- |
+| `selected` | `boolean` | Draws the row as chosen. It is a look only: see "Choosing rows" below |
+
+### TableHead
+
+A `th`, with `scope="col"` unless you pass another.
+
+| Prop     | Type                                          | Does                                                                   |
+| -------- | --------------------------------------------- | ---------------------------------------------------------------------- |
+| `align`  | `'start' \| 'center' \| 'end'`                | The alignment of the text, and of the sort icon in a column of numbers |
+| `sort`   | `'ascending' \| 'descending' \| 'none'`       | How the column is sorted; draws the arrow or the two chevrons          |
+| `onSort` | `(next: 'ascending' \| 'descending') => void` | Makes the title a button, which calls it with the direction to go to   |
+
+### TableCell
+
+A `td`. It takes `align` as `TableHead` does.
+
+## Sorting
+
+`onSort` turns the title of the column into a button with an icon: the two chevrons while the
+column is not sorted, an arrow up or down while it is. A press calls `onSort` with `'descending'`
+when `sort` is `'ascending'`, and with `'ascending'` otherwise; sort the rows yourself and pass the
+new `sort`. If you want three states (ascending, descending, none), handle that in your `onSort`.
+
+`aria-sort` is on the column that is sorted and only on that one, as in the sortable table pattern
+of the ARIA Authoring Practices: `sort="none"` shows the chevrons and sets nothing. A `sort` with
+no `onSort` keeps `aria-sort` and the icon and has no button, for a table that came sorted from a
+server.
+
+<Canvas of={Stories.Sorting} />
+
+## Naming the table
+
+A table needs a name, and when it is wider or taller than its frame the frame needs one too, since
+it is then a region that a keyboard can reach (see "Wide tables"). Use a `TableCaption`, which is
+shown. When the table sits under a heading that is already on the page, as "Recent orders" does on a
+card, point at that heading instead:
+
+```tsx
+<CardTitle id="orders-title">Recent orders</CardTitle>
+<Table aria-labelledby="orders-title">…</Table>
+```
+
+The name is on the `<table>`, and on the frame when it can scroll. In development a table that can
+scroll and has no name is warned about.
+
+## Wide tables
+
+The frame always scrolls (`overflow: auto`), so a table wider than its room scrolls inside it, in a
+flex row beside a sidebar as in a block, and does not push the page wider. Once the table has
+something to scroll, the frame becomes `role="region"` with `tabindex="0"` and the name above, so
+the arrow keys scroll it for a person who has no pointer. That is decided in the browser after the
+first layout, so it is not in the HTML from the server, and it goes away when the table fits again.
+
+<Canvas of={Stories.ScrollRegion} />
+
+Cells do not wrap: a table wider than its frame scrolls. Give a cell `style={{ whiteSpace: 'normal'
+}}` (or a class) to let a long text wrap.
+
+## Sticky header
+
+`stickyHeader` keeps the column headings at the top of the frame while the rows scroll under them.
+It needs a height to scroll in, which is a `max-height` on the frame:
+
+```tsx
+<Table stickyHeader style={{ maxHeight: 320 }} aria-label="Orders">
+  …
+</Table>
+```
+
+The headings are laid over a solid layer, so the rows do not show through. That makes them a little
+more opaque than the glass of the card around the table.
+
+<Canvas of={Stories.StickyHeader} />
+
+## Choosing rows
+
+A row that is chosen is drawn with `selected`, but the state is said by the Checkbox in the row,
+with a name of its own ("Select DH-1042"): `aria-selected` is not allowed on the row of a table. A
+cell that holds only a Checkbox is the narrow column of the boxes, and a cell that holds only an
+icon button the narrow column of the actions. The box in the heading selects all, and shows the
+mixed state with `indeterminate` when some rows are chosen:
+
+```tsx
+<TableHead>
+  <Checkbox
+    aria-label="Select all"
+    checked={all}
+    indeterminate={some && !all}
+    onCheckedChange={toggleAll}
+  />
+</TableHead>
+…
+<TableRow selected={ids.has(order.id)}>
+  <TableCell>
+    <Checkbox aria-label={`Select ${order.id}`} checked={ids.has(order.id)} onCheckedChange={toggle(order.id)} />
+  </TableCell>
+</TableRow>
+```
+
+## Empty and loading states
+
+Both are recipes, not parts. An empty table is one row with one cell across all the columns, in
+the middle, allowed to wrap, with an icon, a title and a hint:
+
+```tsx
+<TableBody>
+  <TableRow>
+    <TableCell colSpan={7} align="center" style={{ whiteSpace: 'normal' }}>
+      <div style={{ display: 'grid', justifyItems: 'center', gap: 3, padding: '14px 0' }}>
+        <InboxIcon />
+        <strong>No orders yet</strong>
+        <span>New orders will show up here.</span>
+      </div>
+    </TableCell>
+  </TableRow>
+</TableBody>
+```
+
+While rows load, draw rows of `Skeleton` `text` in the cells.
+
+## Accessibility
+
+- It is a native `<table>`: Tab goes through the sort buttons and the controls in the cells, and
+  the arrow keys move nothing but the scroll of a frame that has the focus. There is no cell-by-cell
+  navigation (`role="grid"` is not offered).
+- The sort button is named by the title of the column; its icon is hidden. The direction is read
+  from `aria-sort`, and can also be read from the shape of the arrow.
+- A footer row is a `tfoot`, and a heading that is the heading of a row can be a `TableHead` in the
+  body with `scope="row"`.
+- The focus ring of a control in a `lined` table is drawn inside the control with
+  `prefers-contrast: more` and in forced colours, the two modes where the outline is the sign of
+  focus: the frame is a scroll box and clips what is drawn outside it, so a control that touches its
+  edge would lose a part of the ring. The controls of the library do this by themselves; your own
+  links and buttons in a cell do not, so keep them at least 4px from the edge of the frame.
+- With `prefers-contrast: more` the row under the pointer does not change its background, and a
+  chosen row has a 2px frame in the solid accent instead of a wash, so that every Badge and muted
+  text in a row is on the surface. In forced colours the edge and the rules are the text colour, the
+  sort button is a button's colour, and a chosen row has no mark of its own: its Checkbox says it.
+- A Badge on a row that is under the pointer, on a chosen row, or on the striped row of `striped`,
+  and the muted text on the striped row, are below 4.5:1 in the default theme, as the approved
+  mockup has them (rows 32 to 34 of the table on the Accessibility page); every one of them meets it
+  with `prefers-contrast: more`.
+
+## Do and don't
+
+- Do name the table, with a `TableCaption` or an `aria-labelledby` that points at its heading.
+- Do give every Checkbox and icon button in a row a name that says which row.
+- Do keep your own controls in a `lined` table 4px or more from the edge of the frame.
+- Don't expect the table to sort, filter or page: pass it the rows in the order to show.
+- Don't put a `TableCaption` anywhere but first in the `Table`.
+- Don't use a Table for layout.
diff --git a/src/components/table/Table.tsx b/src/components/table/Table.tsx
new file mode 100644
index 0000000..7b6053a
--- /dev/null
+++ b/src/components/table/Table.tsx
@@ -0,0 +1,106 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { createContext, forwardRef, useContext, useId, useMemo, useRef, useState } from 'react';
+import type { HTMLAttributes, MutableRefObject, TableHTMLAttributes } from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { mergeRefs } from '../../internal/merge-refs';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+import { useRequireName } from '../../internal/use-require-name';
+import { useScrollable } from './use-scrollable';
+
+export type TableVariant = 'lined' | 'striped' | 'minimal';
+
+export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
+  variant?: TableVariant;
+  size?: 'sm' | 'md';
+  /** Keeps the column headings at the top of the frame while the rows scroll. Needs a height on the frame. */
+  stickyHeader?: boolean;
+};
+
+export type TableCaptionProps = Omit<HTMLAttributes<HTMLTableCaptionElement>, 'id'>;
+
+/** What the Table gives its caption: the id the scroll frame is named by, and a way to say it is there. */
+interface TableContextValue {
+  captionId: string;
+  setCaptionId: (id: string | undefined) => void;
+  /** Read by the name warning, which runs in the same commit as the caption's layout effect. */
+  captionRef: MutableRefObject<string | undefined>;
+}
+
+const TableContext = createContext<TableContextValue | null>(null);
+
+/**
+ * A table in a scroll frame, in one of three looks. The frame is the visible part, so `className`
+ * and `style` go on it, and `ref` and every other prop go on the `<table>`. The frame always
+ * scrolls, which a sticky heading needs and a table wider than its room is given before any script
+ * runs. Once it has something to scroll it is also a named region a keyboard can reach, which only
+ * script can know, so that comes after the first layout. The library does not sort, filter or page
+ * the data: it draws the table and says what is sorted.
+ */
+export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
+  { variant = 'lined', size = 'md', stickyHeader = false, className, style, children, ...props },
+  ref,
+) {
+  const captionId = useId();
+  const [namedByCaption, setNamedByCaption] = useState<string | undefined>();
+  const captionRef = useRef<string | undefined>(undefined);
+  const frameRef = useRef<HTMLDivElement>(null);
+  const tableRef = useRef<HTMLTableElement>(null);
+  const scrollable = useScrollable(frameRef, tableRef);
+  const given = { 'aria-label': props['aria-label'], 'aria-labelledby': props['aria-labelledby'] };
+  useRequireName(given, 'Table', {
+    active: scrollable,
+    otherName: { description: 'render a TableCaption inside it', ref: captionRef },
+  });
+  const context = useMemo(
+    () => ({ captionId, setCaptionId: setNamedByCaption, captionRef }),
+    [captionId],
+  );
+  // The region is named by the caption when there is one, and otherwise by the name the table was
+  // given, which stays on the table too.
+  const name = namedByCaption ? { 'aria-labelledby': namedByCaption } : given;
+  return (
+    <TableContext.Provider value={context}>
+      <div
+        ref={frameRef}
+        className={clsx('flg-table-frame', className)}
+        style={style}
+        data-variant={variant}
+        data-size={size}
+        data-sticky-header={dataAttr(stickyHeader)}
+        {...(scrollable ? { role: 'region', tabIndex: 0, ...name } : undefined)}
+      >
+        <table ref={mergeRefs(ref, tableRef)} className="flg-table" {...props}>
+          {children}
+        </table>
+      </div>
+    </TableContext.Provider>
+  );
+});
+
+/**
+ * The name of the table, shown above it. It must be the first child of the `Table`, like a
+ * `<caption>`. It is a client part because the Table gives it the id that its scroll frame is named
+ * by; a caption outside a Table is a plain caption.
+ */
+export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
+  function TableCaption({ className, ...props }, ref) {
+    const context = useContext(TableContext);
+    const setCaptionId = context?.setCaptionId;
+    const captionRef = context?.captionRef;
+    const id = context?.captionId;
+    useIsoLayoutEffect(() => {
+      if (!setCaptionId || !captionRef || id === undefined) return undefined;
+      captionRef.current = id;
+      setCaptionId(id);
+      return () => {
+        captionRef.current = undefined;
+        setCaptionId(undefined);
+      };
+    }, [id, setCaptionId, captionRef]);
+    return (
+      <caption ref={ref} className={clsx('flg-table-caption', className)} {...props} id={id} />
+    );
+  },
+);
diff --git a/src/components/table/index.ts b/src/components/table/index.ts
new file mode 100644
index 0000000..6b76014
--- /dev/null
+++ b/src/components/table/index.ts
@@ -0,0 +1,13 @@
+export { Table, TableCaption } from './Table';
+export type { TableCaptionProps, TableProps, TableVariant } from './Table';
+export { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table-parts';
+export type {
+  TableAlign,
+  TableBodyProps,
+  TableCellProps,
+  TableFooterProps,
+  TableHeadProps,
+  TableHeaderProps,
+  TableRowProps,
+  TableSort,
+} from './table-parts';
diff --git a/src/components/table/table-parts.tsx b/src/components/table/table-parts.tsx
new file mode 100644
index 0000000..035f502
--- /dev/null
+++ b/src/components/table/table-parts.tsx
@@ -0,0 +1,144 @@
+import { clsx } from 'clsx';
+import { forwardRef } from 'react';
+import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
+import { dataAttr } from '../../internal/data-attr';
+import { ArrowIcon, ChevronsUpDownIcon } from '../../internal/icons';
+
+export type TableSort = 'ascending' | 'descending' | 'none';
+export type TableAlign = 'start' | 'center' | 'end';
+
+export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;
+export type TableBodyProps = TableHeaderProps;
+export type TableFooterProps = TableHeaderProps;
+
+export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
+  /**
+   * Draws the row as chosen. It is only a look: `aria-selected` is not allowed on the row of a
+   * table, so the state is said by the Checkbox in the row, which has a name of its own.
+   */
+  selected?: boolean;
+};
+
+export type TableHeadProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> & {
+  align?: TableAlign;
+  /**
+   * How the column is sorted. `'ascending'` and `'descending'` set `aria-sort` and draw their
+   * arrow; `'none'` draws the two chevrons of a column that can be sorted and sets nothing.
+   */
+  sort?: TableSort;
+  /**
+   * Makes the title a button. It is called with the direction the press asks for: `'descending'`
+   * when the column is sorted ascending, and `'ascending'` otherwise. Sorting the rows is the
+   * caller's work. A `sort` without `onSort` is only shown, for a table that came sorted.
+   */
+  onSort?: (next: 'ascending' | 'descending') => void;
+};
+
+export type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> & {
+  align?: TableAlign;
+};
+
+// The parts of a table that need no hook are in this file and not in Table.tsx, so a Server
+// Component can render a table without a client boundary for every cell.
+
+export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
+  function TableHeader({ className, ...props }, ref) {
+    return <thead ref={ref} className={clsx('flg-table-header', className)} {...props} />;
+  },
+);
+
+export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
+  { className, ...props },
+  ref,
+) {
+  return <tbody ref={ref} className={clsx('flg-table-body', className)} {...props} />;
+});
+
+export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
+  function TableFooter({ className, ...props }, ref) {
+    return <tfoot ref={ref} className={clsx('flg-table-footer', className)} {...props} />;
+  },
+);
+
+export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
+  { selected = false, className, ...props },
+  ref,
+) {
+  return (
+    <tr
+      ref={ref}
+      className={clsx('flg-table-row', className)}
+      data-selected={dataAttr(selected)}
+      {...props}
+    />
+  );
+});
+
+/** The icon of a column that can be sorted: the arrow of its direction, or the two chevrons. */
+function SortIcon({ sort }: { sort: TableSort | undefined }) {
+  const icon =
+    sort === 'ascending' || sort === 'descending' ? (
+      <ArrowIcon direction={sort === 'ascending' ? 'up' : 'down'} width={14} height={14} />
+    ) : (
+      <ChevronsUpDownIcon width={14} height={14} />
+    );
+  // The colour is set on the wrapper, not on the <svg>, which keeps a colour set on it in forced
+  // colours and would stay the theme's grey on a canvas of the same lightness.
+  return (
+    <span className="flg-table-sort-icon" aria-hidden="true">
+      {icon}
+    </span>
+  );
+}
+
+/**
+ * A column heading. `aria-sort` goes only on the column that is sorted, as in the sortable table
+ * pattern, and the title becomes a button when there is an `onSort`.
+ */
+export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
+  { align, sort, onSort, scope = 'col', className, children, ...props },
+  ref,
+) {
+  const sorted = sort === 'ascending' || sort === 'descending';
+  let content: ReactNode = children;
+  if (onSort) {
+    content = (
+      <button
+        type="button"
+        className="flg-table-sort"
+        onClick={() => onSort(sort === 'ascending' ? 'descending' : 'ascending')}
+      >
+        {children}
+        <SortIcon sort={sort} />
+      </button>
+    );
+  } else if (sort !== undefined) {
+    content = (
+      <span className="flg-table-sort-static">
+        {children}
+        <SortIcon sort={sort} />
+      </span>
+    );
+  }
+  return (
+    <th
+      ref={ref}
+      scope={scope}
+      className={clsx('flg-table-head', className)}
+      data-align={align}
+      aria-sort={sorted ? sort : undefined}
+      {...props}
+    >
+      {content}
+    </th>
+  );
+});
+
+export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
+  { align, className, ...props },
+  ref,
+) {
+  return (
+    <td ref={ref} className={clsx('flg-table-cell', className)} data-align={align} {...props} />
+  );
+});
diff --git a/src/components/table/use-scrollable.ts b/src/components/table/use-scrollable.ts
new file mode 100644
index 0000000..1e10927
--- /dev/null
+++ b/src/components/table/use-scrollable.ts
@@ -0,0 +1,36 @@
+import { useState } from 'react';
+import type { RefObject } from 'react';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+
+/**
+ * Whether the scroll frame of a Table has something to scroll: the table is wider or taller than
+ * the room the frame gives it. One ResizeObserver watches the frame and the table, since either
+ * one changing can decide it, and the state is set only when the answer changes, so a resize that
+ * leaves it as it was does not render again (and cannot start a loop of resize reports). Where
+ * there is no ResizeObserver, as in jsdom, nothing is measured and the answer stays false.
+ */
+export function useScrollable(
+  frameRef: RefObject<HTMLElement | null>,
+  tableRef: RefObject<HTMLElement | null>,
+): boolean {
+  const [scrollable, setScrollable] = useState(false);
+  useIsoLayoutEffect(() => {
+    const frame = frameRef.current;
+    const table = tableRef.current;
+    if (!frame || typeof ResizeObserver === 'undefined') return undefined;
+    let last = false;
+    const look = () => {
+      const next = frame.scrollWidth > frame.clientWidth || frame.scrollHeight > frame.clientHeight;
+      if (next === last) return;
+      last = next;
+      setScrollable(next);
+    };
+    const observer = new ResizeObserver(look);
+    observer.observe(frame);
+    if (table) observer.observe(table);
+    // The first look is before the first paint, so the frame has its role as soon as it shows.
+    look();
+    return () => observer.disconnect();
+  }, [frameRef, tableRef]);
+  return scrollable;
+}
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 396fcc9..4e60630 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -62,8 +62,8 @@ application's responsibility.
 
 The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22),
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
-27 and 29) and List (its part in row 31) are in the table above, which is built from the same data
-CI checks.
+27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
+9, 12 and 22) are in the table above, which is built from the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
@@ -77,6 +77,15 @@ the narrow form (under 480px) the words of every step but the current and a fail
 from sight the same way and are still read, so the steps do not lose their names for a screen
 reader.
 
+A Table has no live region and no cell-by-cell keyboard navigation: Tab goes through the sort
+buttons and the controls in the cells, as in any table. The column that is sorted carries
+`aria-sort`, and only that one does, as in the sortable table pattern; the arrow is hidden from
+screen readers and the sort button is named by its title. When a table is wider or taller than its
+frame, the frame becomes a named region that takes the keyboard, so the arrow keys scroll it: name
+it with a `TableCaption` or an `aria-label`. With `prefers-contrast: more` the row under the
+pointer and the stripes of `striped` are not drawn, and a chosen row has a 2px frame instead of a
+wash, so every Badge and every muted text in a row sits on the surface.
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
diff --git a/src/index.ts b/src/index.ts
index ed7bef8..ff2bfb3 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -225,6 +225,29 @@ export { Step, Stepper } from './components/stepper';
 export type { StepProps, StepperLabels, StepperProps, StepperVariant } from './components/stepper';
 export { List, ListItem } from './components/list';
 export type { ListItemLinkProps, ListItemProps, ListProps, ListVariant } from './components/list';
+export {
+  Table,
+  TableBody,
+  TableCaption,
+  TableCell,
+  TableFooter,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from './components/table';
+export type {
+  TableAlign,
+  TableBodyProps,
+  TableCaptionProps,
+  TableCellProps,
+  TableFooterProps,
+  TableHeadProps,
+  TableHeaderProps,
+  TableProps,
+  TableRowProps,
+  TableSort,
+  TableVariant,
+} from './components/table';
 export { Toaster, toast } from './components/toast';
 export type {
   ToastAction,
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index a150d72..d59db1d 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -97,6 +97,37 @@ export function ChevronIcon({
   );
 }
 
+export type ArrowDirection = 'up' | 'down';
+
+const ARROW_PATHS: Record<ArrowDirection, readonly [string, string]> = {
+  down: ['M12 5v14', 'm19 12-7 7-7-7'],
+  up: ['M12 19V5', 'm5 12 7-7 7 7'],
+};
+
+/** An arrow up or down: the sort direction in the heading of a Table column. */
+export function ArrowIcon({
+  direction,
+  ...props
+}: { direction: ArrowDirection } & SVGProps<SVGSVGElement>) {
+  const [stem, head] = ARROW_PATHS[direction];
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d={stem} />
+      <path d={head} />
+    </svg>
+  );
+}
+
+/** Two chevrons, one over the other: a column that can be sorted and is not sorted yet. */
+export function ChevronsUpDownIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="m7 15 5 5 5-5" />
+      <path d="m7 9 5-5 5 5" />
+    </svg>
+  );
+}
+
 /** The × that dismisses a toast (and any other close affordance). */
 export function CloseIcon(props: SVGProps<SVGSVGElement>) {
   return (
diff --git a/src/styles/components/table.css b/src/styles/components/table.css
new file mode 100644
index 0000000..613434f
--- /dev/null
+++ b/src/styles/components/table.css
@@ -0,0 +1,207 @@
+/* Table (spec phase 4 §4.3 Table, mockup T1-T3): a table in a scroll frame, in three looks. The parts
+   at the top are shared; each look writes only what differs. The frame is the box a person sees, so
+   the look is chosen on it (`data-variant`, `data-size`) and everything below reads it, which lets
+   the parts that need no hook stay free of context (spec §3.1). */
+@layer flg.components {
+  .flg-table-frame {
+    /* The padding of a cell, and of a column heading, in `md`. A look changes only the ones it needs. */
+    --flg-table-py: 8px;
+    --flg-table-hpy: 8px;
+    --flg-table-px: 12px;
+    /* The background of a column heading, which a sticky heading lays over a solid one. */
+    --flg-table-head-bg: transparent;
+    /* The frame always scrolls, so a sticky heading has a box to stick to and a table wider than its
+       room is scrolled before any script has run (spec §3.5). */
+    overflow: auto;
+    /* It fills its row with the margin box, so a margin of the caller's comes out of the width
+       instead of pushing past the parent. In a flex row it cannot be wider than what is left of the
+       row, and that needs `min-width: 0`: a scroll container would otherwise be as wide as its
+       table, which is what the scroll is for. Each engine takes the spelling it knows, and `100%` is
+       the fallback for one that knows none (as in stepper.css). */
+    min-width: 0;
+    width: 100%;
+    width: -webkit-fill-available;
+    width: -moz-available;
+    width: stretch;
+  }
+  .flg-table-frame[data-size='sm'] {
+    --flg-table-py: 3px;
+    --flg-table-hpy: 5px;
+    --flg-table-px: 8px;
+  }
+  /* The frame is a region that takes the keyboard once it has something to scroll, and its ring
+     follows its shape. */
+  .flg-table-frame:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+
+  .flg-table {
+    width: 100%;
+    border-collapse: separate;
+    border-spacing: 0;
+    color: var(--flg-text);
+    font-family: var(--flg-font-sans);
+    font-size: var(--flg-text-sm);
+    font-variant-numeric: tabular-nums;
+    line-height: 1.3;
+  }
+  .flg-table-frame[data-size='sm'] .flg-table {
+    font-size: var(--flg-text-xs);
+  }
+  /* The name of the table, above it. */
+  .flg-table-caption {
+    padding: var(--flg-table-py) var(--flg-table-px);
+    caption-side: top;
+    color: var(--flg-text);
+    font-size: var(--flg-text-sm);
+    font-weight: var(--flg-weight-semibold);
+    text-align: start;
+  }
+
+  .flg-table-head,
+  .flg-table-cell {
+    padding: var(--flg-table-py) var(--flg-table-px);
+    text-align: start;
+    vertical-align: middle;
+    white-space: nowrap;
+  }
+  /* A heading in the body is the heading of its row, such as the order number: not a column heading,
+     and not as faint as one. */
+  .flg-table-head {
+    font-weight: var(--flg-weight-medium);
+  }
+  .flg-table-header .flg-table-head {
+    padding-block: var(--flg-table-hpy);
+    background: var(--flg-table-head-bg);
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-table-footer :is(.flg-table-head, .flg-table-cell) {
+    font-weight: var(--flg-weight-semibold);
+  }
+  .flg-table :is(.flg-table-head, .flg-table-cell)[data-align='center'] {
+    text-align: center;
+  }
+  .flg-table :is(.flg-table-head, .flg-table-cell)[data-align='end'] {
+    text-align: end;
+  }
+
+  /* A cell that holds only a Checkbox is the narrow column of the boxes, and one that holds only an
+     icon button is the narrow column of the actions (the mockup's own classes for them). */
+  .flg-table :is(.flg-table-head, .flg-table-cell):has(> .flg-checkbox:only-child) {
+    width: 16px;
+    padding-inline-end: 4px;
+  }
+  .flg-table :is(.flg-table-head, .flg-table-cell):has(> .flg-button[data-icon-only]:only-child) {
+    width: 28px;
+    padding-inline: 4px 8px;
+  }
+  .flg-table :is(.flg-checkbox, .flg-button) {
+    vertical-align: middle;
+  }
+
+  /* The title of a column that can be sorted is a button; one that is only shown sorted is a span
+     laid out the same way. The button reaches beyond the cell's padding (negative margin, as the
+     padding gives it back), so its hover and focus have room. */
+  .flg-table-sort,
+  .flg-table-sort-static {
+    display: inline-flex;
+    align-items: center;
+    gap: 4px;
+    vertical-align: middle;
+    letter-spacing: inherit;
+    text-transform: inherit;
+  }
+  .flg-table-sort {
+    appearance: none;
+    margin: -3px -6px;
+    padding: 3px 6px;
+    border: 0;
+    border-radius: var(--flg-radius-xs);
+    background: none;
+    color: inherit;
+    cursor: pointer;
+    font: inherit;
+    text-align: inherit;
+  }
+  /* The icon is on the end side of the title, and in a column of numbers it comes first, so the
+     words stay in line with the figures. */
+  .flg-table-head[data-align='end'] :is(.flg-table-sort, .flg-table-sort-static) {
+    flex-direction: row-reverse;
+  }
+  /* The colour is on the span around the icon, not on the <svg> (spec §4.5). */
+  .flg-table-sort-icon {
+    display: inline-flex;
+    flex: none;
+    color: var(--flg-text-muted);
+  }
+  .flg-table-head:is([aria-sort='ascending'], [aria-sort='descending']) {
+    color: var(--flg-text);
+  }
+  .flg-table-head:is([aria-sort='ascending'], [aria-sort='descending']) .flg-table-sort-icon {
+    color: var(--flg-accent-text);
+  }
+  @media (hover: hover) {
+    .flg-table-sort:hover {
+      background: var(--flg-control-track);
+    }
+  }
+  .flg-table-sort:focus-visible {
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+
+  /* The row under a real pointer, and a chosen row. Both are only a second sign: the box in the row
+     says what is chosen. A look that draws them on the cells instead says so in its own rules. */
+  @media (hover: hover) {
+    .flg-table-body > .flg-table-row:hover {
+      background: var(--flg-control-track);
+    }
+  }
+  .flg-table-body > .flg-table-row[data-selected] {
+    background: var(--flg-accent-subtle);
+  }
+
+  /* A sticky heading is solid under its own background, so the rows that scroll under it do not
+     show through. It is a little more opaque than the glass of the card around the table. */
+  .flg-table-frame[data-sticky-header] .flg-table-header .flg-table-head {
+    position: sticky;
+    z-index: 1;
+    top: 0;
+    background:
+      linear-gradient(var(--flg-table-head-bg), var(--flg-table-head-bg)),
+      var(--flg-glass-tint-solid);
+  }
+
+  /* lined (T1): a frame with an edge, banded heading and footer, a rule between the rows. The frame
+     clips its content to its rounded corners, as the mockup's `overflow: hidden` does. */
+  .flg-table-frame[data-variant='lined'] {
+    --flg-table-head-bg: var(--flg-control-bg-secondary);
+    border: 1px solid var(--flg-control-border);
+    border-radius: var(--flg-radius-md);
+  }
+  .flg-table-frame[data-variant='lined'] .flg-table-header .flg-table-head {
+    border-bottom: 1px solid var(--flg-control-border);
+  }
+  .flg-table-frame[data-variant='lined'] .flg-table-body > .flg-table-row > * {
+    border-bottom: 1px solid var(--flg-control-border);
+  }
+  .flg-table-frame[data-variant='lined'] .flg-table-body > .flg-table-row:last-child > * {
+    border-bottom: 0;
+  }
+  .flg-table-frame[data-variant='lined'] .flg-table-footer :is(.flg-table-head, .flg-table-cell) {
+    border-top: 1px solid var(--flg-control-border);
+    background: var(--flg-control-bg-secondary);
+  }
+  /* The bar on the first cell of a chosen row. */
+  .flg-table-frame[data-variant='lined']
+    .flg-table-body
+    > .flg-table-row[data-selected]
+    > :first-child {
+    box-shadow: inset 3px 0 0 var(--flg-accent-solid);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 9bbef9c..1526b98 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -40,5 +40,6 @@
 @import './components/skeleton.css';
 @import './components/stepper.css';
 @import './components/list.css';
+@import './components/table.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index ccbb477..ca931a2 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -109,6 +109,50 @@
       > .flg-list-item[data-interactive]:not([data-current]):hover::before {
       background: none;
     }
+    /* A row of a Table does not change its background under the pointer, and a chosen row has no
+       wash: a Badge on either would fall below 4.5:1 (spec phase 4 §4.4), and the pointer is only a
+       second sign. A chosen row has a frame of 2px in the solid accent instead, drawn with inner
+       shadows on its cells: every cell has the top and bottom edge, the first one the left edge and
+       the last one the right edge, and a row of one cell has all four. In a `lined` Table it takes
+       the place of the 3px bar. The selectors of the shadows are repeated in the forced-colours
+       rules below, which drop them and come later in the layer. */
+    .flg-table-body > .flg-table-row:hover,
+    .flg-table-body > .flg-table-row[data-selected] {
+      background: none;
+    }
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head) {
+      box-shadow:
+        inset 0 2px 0 var(--flg-accent-solid),
+        inset 0 -2px 0 var(--flg-accent-solid);
+    }
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):first-child {
+      box-shadow:
+        inset 2px 0 0 var(--flg-accent-solid),
+        inset 0 2px 0 var(--flg-accent-solid),
+        inset 0 -2px 0 var(--flg-accent-solid);
+    }
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):last-child {
+      box-shadow:
+        inset -2px 0 0 var(--flg-accent-solid),
+        inset 0 2px 0 var(--flg-accent-solid),
+        inset 0 -2px 0 var(--flg-accent-solid);
+    }
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):only-child {
+      box-shadow: inset 0 0 0 2px var(--flg-accent-solid);
+    }
+  }
+  /* In these two modes the outline is what shows the focus, and the frame of a `lined` Table, which
+     has no room around its edge cells (3px at `sm`) and clips what it paints outside, would cut it.
+     The controls of the library in the frame draw it inside instead (spec phase 4 §4.3). The other
+     looks have 6px of padding in the frame for it. Only the offset changes, so the rule is the same
+     in both modes and does not have to win over itself. */
+  @media (prefers-contrast: more), (forced-colors: active) {
+    .flg-table-frame[data-variant='lined'] :is(.flg-table-sort, .flg-button):focus-visible,
+    .flg-table-frame[data-variant='lined']
+      .flg-checkbox:has(> input:focus-visible)
+      .flg-checkbox-box {
+      outline-offset: -2px;
+    }
   }
   @media (forced-colors: active) {
     /* A Surface, and each card of a `cards` List, which takes its glass (surface.css). */
@@ -638,6 +682,34 @@
       outline: 2px solid CanvasText;
       outline-offset: 2px;
     }
+    /* The edge of a `lined` Table and its rules are in the text colour; the bands of its heading and
+       footer, and the wash of the rows, are dropped by the system (spec phase 4 §4.5). */
+    .flg-table-frame[data-variant='lined'],
+    .flg-table-frame[data-variant='lined'] :is(.flg-table-head, .flg-table-cell) {
+      border-color: CanvasText;
+    }
+    /* The sort button, and the icon in it, are in the colour of a button. */
+    .flg-table-sort,
+    .flg-table-sort > .flg-table-sort-icon {
+      color: ButtonText;
+    }
+    /* A chosen row has no sign of its own: the Checkbox in it, in `Highlight`, says it. The 2px
+       frame of `prefers-contrast: more` is made of inner shadows, which this mode drops with the
+       rest, and so is the bar of `lined`. These selectors are those of the rules for the frame
+       above, as specific as they are, and come later in the layer: Chromium matches both modes
+       while colours are forced, and a shorter selector would lose to them whatever the order. */
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head),
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):first-child,
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):last-child,
+    .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):only-child {
+      box-shadow: none;
+    }
+    /* A sticky heading is solid in the colour of the canvas. Its own layer is a gradient, which this
+       mode drops, and the rows would show through. */
+    .flg-table-frame[data-sticky-header] .flg-table-header .flg-table-head {
+      background-color: Canvas;
+      background-image: none;
+    }
   }
   /* Repeating motion cannot be stopped by a duration of 0ms, which would repeat for ever (spec
      phase 4 §3.3), so what moves without end is stopped by hand here. Motion that happens once keeps
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm vitest run --project unit --project unit-react18 --project scripts src/components/table src/internal src/docs src/index.test.ts scripts/lib/contrast.test.ts
pnpm vitest run --project storybook-light src/components/table
pnpm vitest run --project storybook-dark src/components/table
pnpm build && pnpm check:package
pnpm build-storybook
```

Expected:
- `pnpm check:contrast`: PASS (`Contrast check passed.`). `table-hover-badge` (sáng, tối), `table-stripe-text-muted` (tối), `table-stripe-badge` (sáng, tối) và `table-selected-badge` (sáng, tối) là `known-exception`; `table-row-text` (cả hai theme) và `table-stripe-text-muted` (sáng) là `pass`. Số như phát hiện 6.
- Unit: PASS, không lỗi kiểu. Trong đó `Table.test.tsx` 31 test và `use-scrollable.test.tsx` 7 test ở mỗi project React, `Table.test-d.ts` 5, `ExceptionTable.test.tsx` 4 (34 dòng), `index.test.ts` 1, và sáu test mới `the Table checks (spec phase 4 §4.4)` trong `contrast.test.ts`.
- Story Table: 30 test PASS ở mỗi project (10 story × ba engine). axe chạy sau play function, không có vi phạm. `FocusRingsInsideLinedFrame` giả lập hai chế độ qua CDP, nên chỉ kiểm thật ở Chromium.
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy mười hai class `flg-table*`; `check:use-client` có `Table.tsx`; `check:rsc` in `ok` cho sáu ca của Table; `check:publint`, `check:types` pass; `size` pass với CSS 12.46 kB trên ngưỡng 12.66 kB. Không chạy `pnpm size:record` ở task này: Task 4 ghi ngưỡng cho cả Plan C (phát hiện 11).
- `pnpm build-storybook`: PASS, nên `Table.mdx` và `Accessibility.mdx` biên dịch được. Lệnh không mở cổng nào. Trong `storybook-static/index.json`, chỉ `Lined`, `LinedSmallFocus` và `StickyHeader` của Table không gắn `no-visual`.
- Table là component mới, và các file dùng chung chỉ được thêm vào (phát hiện 13), nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/painted-pixel.ts \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/contrast.test.ts \
  scripts/lib/contrast.ts \
  scripts/rsc-probe.mjs \
  src/components/table/Table.mdx \
  src/components/table/Table.stories.tsx \
  src/components/table/Table.test-d.ts \
  src/components/table/Table.test.tsx \
  src/components/table/Table.tsx \
  src/components/table/index.ts \
  src/components/table/table-parts.tsx \
  src/components/table/use-scrollable.test.tsx \
  src/components/table/use-scrollable.ts \
  src/docs/Accessibility.mdx \
  src/docs/ExceptionTable.test.tsx \
  src/index.test.ts \
  src/index.ts \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx \
  src/styles/components/table.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(table): add Table with the shared part and the lined look" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: Table `striped` và `minimal`

Spec §4.3 **Table** (khung có padding 6px và margin −6px của `striped` và `minimal`; **`striped`**; **`minimal`**; tiêu đề dính trong khung có padding), §4.4 (quy tắc "+": đường kẻ thay sọc), §4.5 **Table** (hàng chân `striped`, nền tiêu đề dính), §7 (story `Striped`, `Minimal`, `StickyHeader`; kiểm hình học của vòng focus), §8 (trang Table: "Variants", khung rộng hơn 6px, `stickyHeader` cần chiều cao tối đa trên khung), §10 (`clip-path` và gradient trên `<tr>`, vị trí dính trong khung có padding, khung rộng hơn 6px trong Card). Mockup T2, T3. Báo cáo và code của Task 1 là điểm bắt đầu.
- **Khung có padding** 6px và margin −6px ở cả bốn phía, ở `striped` và `minimal`: bảng không xê dịch, mép cắt của khung lùi ra 6px, nên vòng focus của control sát mép bảng còn nguyên (phát hiện 5).
- **`striped`** (T2): sọc ở hàng lẻ, `border-spacing: 0 2px`, ô đầu và ô cuối bo hai góc phía ngoài, tiêu đề cột `--flg-text-2xs` chữ hoa, hover trên ô, hàng chân là một viên viền mảnh vẽ bằng bóng trong. Hàng đã chọn vẽ một lần trên `<tr>` và bo hai đầu bằng `clip-path`, trừ khi một control trong hàng có focus bàn phím.
- **`minimal`** (T3): hàng thoáng (`--flg-table-py` 14px ở `md`), đường mờ 45% dưới tiêu đề cột và trên hàng chân, tiêu đề cột đậm `--flg-weight-medium`.
- **Tiêu đề dính** trong khung có padding: `top: -6px` (phát hiện 5).
- **Khung có `position: relative`** ở phần chung, để chữ ẩn trong ô không làm trang cuộn ngang (phát hiện 5).
- **Preferences:** ở `prefers-contrast: more`, `striped` có đường kẻ 1px thay sọc và hàng đã chọn không bị cắt; ở forced colors, hàng chân `striped` có viền ở mọi ô, cả hai đầu, và đường kẻ của `minimal` là `CanvasText`.
- **Docs:** mục "Variants" của `Table.mdx`, ghi chú về tiêu đề dính và khung rộng hơn 6px, và mục "Do and don't".
- **Story:** `Striped`, `Minimal`, `StripedSmallFocus`, `MinimalSmallFocus` là story giao diện; `StickyHeader` thành ba khung, mỗi variant một khung; `PaddedScrollRegion`, `FocusRingsInPaddedFrame`, `PaddedFrameInACard`, `StripedSelectedRow`, `StripedSelectedRowFocus`, `StripedPreferences` gắn `no-visual`. Bảng `sm` của các story giao diện (cả `Lined` và `LinedSmallFocus`) có ô chọn tất cả trống như mockup; bảng đơn hàng chính giữ trạng thái một phần.
- Spec giai đoạn 4 §4.3 và §4.5 được sửa (phát hiện 10).
- Không có class, export hay token mới. Cuối task, `check:package` fail chỉ ở `size` (phát hiện 11).

**Files:**
- Modify: `src/components/table/Table.stories.tsx`, `src/components/table/Table.mdx`, `src/styles/components/table.css`, `src/styles/preferences.css`, `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`

**Interfaces:**
- Không có export, class, token hay cảnh báo mới. CSS dùng lại các móc của Task 1: `data-variant` (`striped`, `minimal`), `data-size`, `data-sticky-header` trên khung, `data-selected` trên `<tr>`, `:has(:focus-visible)` trên hàng đã chọn.
- `table.css`:
  - Khung `striped` và `minimal`: `padding: 6px; margin: -6px`; ô tiêu đề dính `top: -6px`.
  - `striped`: `--flg-table-hpy` 4px (`sm` 3px). Hàng đã chọn: `clip-path: inset(0 round var(--flg-radius-md))` trên `<tr>`, và `clip-path: none` khi `:has(:focus-visible)`.
  - `minimal`: `--flg-table-py` 14px và `--flg-table-hpy` 6px (`sm` 6px và 4px).
  - Phần chung: khung có `position: relative`.
- `Table.stories.tsx`: helper `Orders` có thêm prop `mixed` (mặc định `true`): ô chọn tất cả ở trạng thái một phần, hay trống như bảng `sm` của mockup.
- Consumes: mọi thứ của Task 1, nhất là `paintedPixels`, `Orders`, `Looks` và `focusCustomerSort`; `Card`, `CardTitle` trong story.
- Task sau dùng: Task 4 ghi ngưỡng kích thước gồm cả CSS của task này.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/table/Table.stories.tsx b/src/components/table/Table.stories.tsx
index b8e43da..981be05 100644
--- a/src/components/table/Table.stories.tsx
+++ b/src/components/table/Table.stories.tsx
@@ -4,6 +4,7 @@ import type { CSSProperties, ReactNode } from 'react';
 import { expect, fn, userEvent, waitFor } from 'storybook/test';
 import { FillFrames, checkFillFrames } from '../../../.storybook/fill-frames';
 import { paintedPixels } from '../../../.storybook/painted-pixel';
+import type { Rgb } from '../../../.storybook/painted-pixel';
 import { realUserEvent } from '../../../.storybook/real-input';
 import { strokeIcon } from '../../internal/icons';
 import type { BadgeProps } from '../badge/Badge';
@@ -93,6 +94,8 @@ type OrdersProps = Omit<TableProps, 'children'> & {
   /** The row that is chosen and the one the harness hovers. */
   selected?: string;
   hovered?: string;
+  /** The box that selects all is in its mixed state. Default true; the `sm` tables of the mockup have none chosen. */
+  mixed?: boolean;
 };
 
 /**
@@ -105,6 +108,7 @@ function Orders({
   footer = true,
   selected = 'DH-1041',
   hovered = 'DH-1040',
+  mixed = true,
   ...props
 }: OrdersProps) {
   return (
@@ -112,7 +116,7 @@ function Orders({
       <TableHeader>
         <TableRow>
           <TableHead>
-            <Checkbox aria-label="Select all" indeterminate />
+            <Checkbox aria-label="Select all" indeterminate={mixed} />
           </TableHead>
           <TableHead>Order</TableHead>
           <TableHead sort="none" onSort={noop}>
@@ -260,6 +264,7 @@ function Looks({ variant }: Pick<TableProps, 'variant'>) {
         <Orders
           variant={variant}
           size="sm"
+          mixed={false}
           rows={ORDERS.slice(0, 3)}
           footer={false}
           selected=""
@@ -298,6 +303,7 @@ export const LinedSmallFocus: Story = {
       <Orders
         variant="lined"
         size="sm"
+        mixed={false}
         rows={ORDERS.slice(0, 3)}
         footer={false}
         selected=""
@@ -309,6 +315,39 @@ export const LinedSmallFocus: Story = {
   play: focusCustomerSort,
 };
 
+export const Striped: Story = {
+  render: () => <Looks variant="striped" />,
+  play: focusCustomerSort,
+};
+
+export const Minimal: Story = {
+  render: () => <Looks variant="minimal" />,
+  play: focusCustomerSort,
+};
+
+/** The `sm` table of a look with keyboard focus on a sort button: see `LinedSmallFocus`. */
+const smallFocus = (variant: NonNullable<TableProps['variant']>): Story => ({
+  render: () => (
+    <Card style={{ width: 760 }}>
+      <Orders
+        variant={variant}
+        size="sm"
+        mixed={false}
+        rows={ORDERS.slice(0, 3)}
+        footer={false}
+        selected=""
+        hovered=""
+        aria-label="Recent orders"
+      />
+    </Card>
+  ),
+  play: focusCustomerSort,
+});
+
+export const StripedSmallFocus: Story = smallFocus('striped');
+
+export const MinimalSmallFocus: Story = smallFocus('minimal');
+
 /** Twelve rows in a frame that is 180px tall: the heading stays at the top while the rows scroll. */
 const MANY_ROWS = Array.from({ length: 12 }, (_, index) => ({
   ...ORDERS[index % ORDERS.length]!,
@@ -317,46 +356,60 @@ const MANY_ROWS = Array.from({ length: 12 }, (_, index) => ({
 
 /**
  * `stickyHeader` keeps the column headings at the top of the frame, over the rows that scroll under
- * them: the heading of the scrolled table is at the frame's top edge, and the rows do not show
- * through it, so a press at the middle of a heading is a press of the heading. The look is that of the
- * heading over rows, which is a little more opaque than the glass of the card.
+ * them, in each look: the heading of the scrolled table is at the top edge of what the frame shows
+ * (inside its border, and inside no padding: `striped` and `minimal` have 6px of it, which the rows
+ * must not show through), and a press at the middle of a heading, and one in the first pixels of the
+ * frame, are presses of the heading. The look is that of the heading over rows, which is a little more
+ * opaque than the glass of the card.
  */
 export const StickyHeader: Story = {
   render: () => (
-    <Card style={{ width: 760 }}>
-      <Orders
-        variant="lined"
-        rows={MANY_ROWS}
-        footer={false}
-        selected=""
-        hovered=""
-        stickyHeader
-        style={{ maxHeight: 180 }}
-        aria-label="Recent orders"
-      />
+    <Card style={{ gap: 14, width: 760 }}>
+      {(['lined', 'striped', 'minimal'] as const).map((variant) => (
+        <Orders
+          key={variant}
+          variant={variant}
+          rows={MANY_ROWS}
+          footer={false}
+          selected=""
+          hovered=""
+          stickyHeader
+          style={{ maxHeight: 180 }}
+          aria-label={`Recent orders, ${variant}`}
+        />
+      ))}
     </Card>
   ),
   play: async ({ canvasElement }) => {
-    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
-    frame.scrollTop = 90;
-    await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(60));
-    const heading = frame.querySelector<HTMLElement>('thead th:nth-child(2)')!;
-    const outer = frame.getBoundingClientRect();
-    const box = heading.getBoundingClientRect();
-    // At the top edge of what the frame shows, inside its border.
-    await expect(Math.abs(box.top - (outer.top + frame.clientTop))).toBeLessThanOrEqual(0.5);
-    // Nothing of a row is above it.
-    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
-    await expect(heading.contains(hit)).toBe(true);
+    for (const frame of canvasElement.querySelectorAll<HTMLElement>('.flg-table-frame')) {
+      const variant = frame.dataset.variant;
+      frame.scrollTop = 90;
+      await waitFor(() => expect(frame.scrollTop, variant).toBeGreaterThan(60));
+      const heading = frame.querySelector<HTMLElement>('thead th:nth-child(2)')!;
+      const outer = frame.getBoundingClientRect();
+      const box = heading.getBoundingClientRect();
+      const top = outer.top + frame.clientTop;
+      // At the top edge of what the frame shows, inside its border and not below its padding.
+      await expect(Math.abs(box.top - top), `${variant}: flush with the top`).toBeLessThanOrEqual(
+        0.5,
+      );
+      // Nothing of a row is above it: at the middle of the heading, and in the first pixels of the
+      // frame, where the padding of `striped` and `minimal` is.
+      const middle = box.x + box.width / 2;
+      for (const y of [box.y + box.height / 2, top + 2]) {
+        const hit = document.elementFromPoint(middle, y);
+        await expect(heading.contains(hit), `${variant}: the heading is at ${y}`).toBe(true);
+      }
+    }
   },
 };
 
 /** A table wider than the frame it is given, named by its caption. */
-function CaptionedWide({ width }: { width: number }) {
+function CaptionedWide({ width, variant }: { width: number; variant?: TableProps['variant'] }) {
   return (
     <div style={{ width: 900 }}>
-      <Table style={{ width }}>
-        <TableCaption>Recent orders</TableCaption>
+      <Table variant={variant} style={{ width }}>
+        <TableCaption>{variant ? `Recent orders, ${variant}` : 'Recent orders'}</TableCaption>
         <TableHeader>
           <TableRow>
             {['Order', 'Customer', 'Status', 'Date', 'Total'].map((name) => (
@@ -628,6 +681,7 @@ export const FocusRingsInsideLinedFrame: Story = {
       <Orders
         variant="lined"
         size="sm"
+        mixed={false}
         rows={ORDERS.slice(0, 2)}
         footer={false}
         selected=""
@@ -717,3 +771,400 @@ export const FocusRingsInsideLinedFrame: Story = {
     }
   },
 };
+
+/**
+ * The frame of `striped` and `minimal` is a named region that a keyboard reaches when the table is
+ * wider than it, as the frame of `lined` is, and the padding that makes room for the rings does not
+ * make a table that fits look wider than its room: that one is not a region.
+ */
+export const PaddedScrollRegion: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 24 }}>
+      {(['striped', 'minimal'] as const).map((variant) => (
+        <div key={variant} data-case={variant} style={{ display: 'flow-root', width: 900 }}>
+          <CaptionedWide width={320} variant={variant} />
+        </div>
+      ))}
+      <div data-case="fits" style={{ display: 'flow-root', width: 900 }}>
+        <Orders variant="striped" aria-label="Orders that fit" />
+      </div>
+    </div>
+  ),
+  play: async ({ canvas, canvasElement }) => {
+    for (const variant of ['striped', 'minimal']) {
+      const frame = canvasElement.querySelector<HTMLElement>(
+        `[data-case="${variant}"] .flg-table-frame`,
+      )!;
+      await waitFor(() => expect(frame, variant).toHaveAttribute('role', 'region'));
+      await expect(frame.tabIndex).toBe(0);
+      await expect(canvas.getByRole('region', { name: `Recent orders, ${variant}` })).toBe(frame);
+    }
+    const fits = canvasElement.querySelector<HTMLElement>('[data-case="fits"] .flg-table-frame')!;
+    await expect(fits.scrollWidth).toBeLessThanOrEqual(fits.clientWidth);
+    await expect(fits).not.toHaveAttribute('role');
+  },
+};
+
+/** How far outside the edge of a button the points are looked at, in CSS pixels. */
+const OUTSIDE = [2.5, 3, 3.5] as const;
+
+/** What differs between a ring that is drawn and one that is not: any channel by this much. */
+const RING_SHOWN = 25;
+
+/** The looks that have a padded frame, in both densities. */
+const PADDED = [
+  { variant: 'striped', size: 'md' },
+  { variant: 'striped', size: 'sm' },
+  { variant: 'minimal', size: 'md' },
+  { variant: 'minimal', size: 'sm' },
+] as const;
+
+/** The modes a ring is looked for in: the default, more contrast and forced colours. */
+const RING_MODES = [
+  { label: 'default', feature: null },
+  { label: 'prefers-contrast', feature: { name: 'prefers-contrast', value: 'more' } },
+  { label: 'forced-colors', feature: { name: 'forced-colors', value: 'active' } },
+] as const;
+
+/**
+ * The frame of `striped` and `minimal` has 6px of padding and the same margin out, so that its
+ * scroll box does not clip a ring. In both densities the table sits where it would without the
+ * padding (its left and top edges are those of the box it is in, and it is as wide), and the box of
+ * a sort button, a button and a Checkbox of the last row, grown by 4px for the outline, is inside the
+ * padding edge of the frame. Then the ring of the sort button is looked for in the painted pixels,
+ * 3px outside its top and left sides, where a frame without the padding would cut it: by default, with
+ * more contrast and in forced colours (the last two are emulated through the protocol, which only
+ * Chromium has).
+ */
+export const FocusRingsInPaddedFrame: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ display: 'grid', gap: 24, width: 760 }}>
+      {PADDED.map(({ variant, size }) => (
+        <div
+          key={`${variant}-${size}`}
+          data-case={`${variant}-${size}`}
+          style={{ display: 'flow-root' }}
+        >
+          <Orders
+            variant={variant}
+            size={size}
+            rows={ORDERS.slice(0, 2)}
+            footer={false}
+            selected=""
+            hovered=""
+            aria-label={`Orders, ${variant} ${size}`}
+          />
+        </div>
+      ))}
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    const real = await realUserEvent();
+    const session = server.browser === 'chromium' ? cdp() : null;
+    for (const { variant, size } of PADDED) {
+      const name = `${variant} ${size}`;
+      const box = canvasElement.querySelector<HTMLElement>(`[data-case="${variant}-${size}"]`)!;
+      const frame = box.querySelector<HTMLElement>('.flg-table-frame')!;
+      const table = box.querySelector<HTMLElement>('table')!;
+      const room = box.getBoundingClientRect();
+      const at = table.getBoundingClientRect();
+      await expect(at.left, `${name}: the table has not moved sideways`).toBeCloseTo(room.left, 1);
+      await expect(at.top, `${name}: the table has not moved down`).toBeCloseTo(room.top, 1);
+      await expect(at.width, `${name}: the table is as wide`).toBeCloseTo(room.width, 1);
+      const outer = frame.getBoundingClientRect();
+      await expect(room.left - outer.left, `${name}: 6px of frame beside it`).toBeCloseTo(6, 1);
+      await expect(room.top - outer.top, `${name}: 6px of frame above it`).toBeCloseTo(6, 1);
+
+      const lastRow = frame.querySelector<HTMLElement>('tbody tr:last-child')!;
+      const sortButton = frame.querySelector<HTMLElement>('thead .flg-table-sort')!;
+      const iconButton = lastRow.querySelector<HTMLElement>('.flg-button')!;
+      const checkBox = lastRow.querySelector<HTMLElement>('.flg-checkbox-box')!;
+      // The padding edge of the frame: inside its border, of which it has none.
+      const edge = {
+        left: outer.left + frame.clientLeft,
+        top: outer.top + frame.clientTop,
+        right: outer.left + frame.clientLeft + frame.clientWidth,
+        bottom: outer.top + frame.clientTop + frame.clientHeight,
+      };
+      for (const [what, ring] of [
+        ['sort button', sortButton],
+        ['icon button', iconButton],
+        ['checkbox', checkBox],
+      ] as const) {
+        const r = ring.getBoundingClientRect();
+        const label = `${name}, ${what}: the ring is inside the padding edge`;
+        await expect(r.left - 4, label).toBeGreaterThanOrEqual(edge.left);
+        await expect(r.top - 4, label).toBeGreaterThanOrEqual(edge.top);
+        await expect(r.right + 4, label).toBeLessThanOrEqual(edge.right);
+        await expect(r.bottom + 4, label).toBeLessThanOrEqual(edge.bottom);
+      }
+
+      if (!real) continue;
+      for (const mode of RING_MODES) {
+        if (mode.feature && !session) continue;
+        await session?.send('Emulation.setEmulatedMedia', {
+          features: mode.feature ? [mode.feature] : [],
+        });
+        try {
+          if (mode.feature) {
+            const { name: feature, value } = mode.feature;
+            await waitFor(() => expect(matchMedia(`(${feature}: ${value})`).matches).toBe(true));
+          }
+          // Three points across the outline (2px wide, 2px away) on each side: a screenshot starts
+          // at a whole device pixel and the frame may not.
+          const look = () => {
+            const button = sortButton.getBoundingClientRect();
+            const x = button.x - outer.x;
+            const y = button.y - outer.y;
+            return OUTSIDE.flatMap((depth) => [
+              [x + button.width / 2, y - depth],
+              [x - depth, y + button.height / 2],
+            ]) as Array<[number, number]>;
+          };
+          (document.activeElement as HTMLElement | null)?.blur();
+          const before = await paintedPixels(frame, look());
+          if (!before) continue;
+          sortButton.focus({ focusVisible: true });
+          await expect(sortButton.matches(':focus-visible'), `${name}: focus is visible`).toBe(
+            true,
+          );
+          const after = (await paintedPixels(frame, look()))!;
+          for (const [side, label] of [
+            [0, 'above'],
+            [1, 'beside'],
+          ] as const) {
+            const moved = [0, 2, 4].some((step) =>
+              after[side + step]!.some(
+                (channel, index) => Math.abs(channel - before[side + step]![index]!) > RING_SHOWN,
+              ),
+            );
+            await expect(
+              moved,
+              `${name}, ${mode.label}: the ring shows ${label} the button (${JSON.stringify(before)} to ${JSON.stringify(after)})`,
+            ).toBe(true);
+          }
+          sortButton.blur();
+        } finally {
+          await session?.send('Emulation.setEmulatedMedia', { features: [] });
+        }
+      }
+    }
+  },
+};
+
+/**
+ * A Table of `striped` or `minimal` in a Card in a column 375px wide, a phone: its frame is 6px
+ * wider than the Card's content on each side, inside the Card's own padding, so nothing scrolls
+ * sideways, and the Table, wider than the room, scrolls in its frame.
+ */
+export const PaddedFrameInACard: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div
+      data-column
+      style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, width: 375 }}
+    >
+      {(['striped', 'minimal'] as const).map((variant) => (
+        <Card key={variant}>
+          <CardTitle id={`title-${variant}`}>Recent orders, {variant}</CardTitle>
+          <Orders variant={variant} aria-labelledby={`title-${variant}`} />
+        </Card>
+      ))}
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const column = canvasElement.querySelector<HTMLElement>('[data-column]')!;
+    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
+    for (const card of column.querySelectorAll<HTMLElement>('.flg-card')) {
+      const frame = card.querySelector<HTMLElement>('.flg-table-frame')!;
+      await waitFor(() => expect(frame).toHaveAttribute('role', 'region'));
+      const inner = card.getBoundingClientRect();
+      const outer = frame.getBoundingClientRect();
+      await expect(outer.left).toBeGreaterThanOrEqual(inner.left);
+      await expect(outer.right).toBeLessThanOrEqual(inner.right);
+      await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
+    }
+    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
+      document.documentElement.clientWidth,
+    );
+  },
+};
+
+/** How far apart two painted pixels may be and still be one colour, in a channel. */
+const SAME = 8;
+
+/**
+ * The chosen row of `striped` is painted once, on the row, and rounded with `clip-path` on the row
+ * (spec phase 4 §10: each engine is asked). From the painted pixels: the pixel one step inside the
+ * corner of the row is the card's and not the band's (the row is cut with rounded ends); the band is
+ * painted at the middle of its left end; and it is one colour across the boundary of two cells,
+ * where a wash on each cell would show a seam.
+ */
+export const StripedSelectedRow: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 760 }}>
+      <Card>
+        <Orders variant="striped" selected="DH-1041" hovered="" aria-label="Orders" />
+      </Card>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
+    const row = frame.querySelector<HTMLElement>('tr[data-selected]')!;
+    await expect(getComputedStyle(row).clipPath).not.toBe('none');
+    const cells = Array.from(row.querySelectorAll<HTMLElement>('td'));
+    const origin = frame.getBoundingClientRect();
+    const box = row.getBoundingClientRect();
+    const x = box.left - origin.left;
+    const y = box.top - origin.top;
+    // The boundary of the second and the third cell, near the top of the row, away from any text.
+    const seam = cells[2]!.getBoundingClientRect().left - origin.left;
+    const pixels = await paintedPixels(frame, [
+      [x + 1, y + 1],
+      [x - 4, y + 1],
+      [x + 2, y + box.height / 2],
+      [seam - 3, y + 2],
+      [seam - 0.5, y + 2],
+      [seam + 0.5, y + 2],
+      [seam + 3, y + 2],
+    ]);
+    if (!pixels) return;
+    const [corner, outside, band, ...across] = pixels as [Rgb, Rgb, Rgb, Rgb, Rgb, Rgb, Rgb];
+    const apart = (a: Rgb, b: Rgb) =>
+      Math.max(...a.map((channel, index) => Math.abs(channel - b[index]!)));
+    const seen = JSON.stringify({ corner, outside, band, across });
+    await expect(apart(band, outside), `the band is painted: ${seen}`).toBeGreaterThan(2);
+    await expect(apart(corner, outside), `the corner is cut: ${seen}`).toBeLessThanOrEqual(SAME);
+    await expect(apart(corner, band), `the corner is not the band: ${seen}`).toBeGreaterThan(
+      apart(corner, outside),
+    );
+    for (const pixel of across) {
+      await expect(apart(pixel, band), `one colour across a boundary: ${seen}`).toBeLessThanOrEqual(
+        SAME,
+      );
+    }
+  },
+};
+
+/** The part of a ring beyond a row is faint (3 to 13 in the channel that moves most); a cut leaves nothing. */
+const PART_OF_RING = 1;
+
+/**
+ * The chosen row of `striped` is cut with `clip-path`, and a ring drawn by a control in it reaches
+ * beyond the row in `sm`, where a row is hardly taller than a button: the cut must not take that
+ * part of the ring. The icon button of the chosen row is given the focus, and a point at the top edge
+ * of the row, where its 2px outline is half outside, is read before and after.
+ */
+export const StripedSelectedRowFocus: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 760 }}>
+      <Card>
+        <Orders
+          variant="striped"
+          size="sm"
+          rows={ORDERS.slice(0, 3)}
+          footer={false}
+          selected="DH-1041"
+          hovered=""
+          aria-label="Orders"
+        />
+      </Card>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    const frame = canvasElement.querySelector<HTMLElement>('.flg-table-frame')!;
+    const row = frame.querySelector<HTMLElement>('tr[data-selected]')!;
+    const button = row.querySelector<HTMLElement>('.flg-button')!;
+    const origin = frame.getBoundingClientRect();
+    const look = () => {
+      const edge = row.getBoundingClientRect();
+      const box = button.getBoundingClientRect();
+      return [
+        [box.x - origin.x + box.width / 2, edge.top - origin.y - 0.5],
+        [box.x - origin.x + box.width / 2, edge.bottom - origin.y + 0.5],
+      ] as Array<[number, number]>;
+    };
+    const before = await paintedPixels(frame, look());
+    if (!before) return;
+    button.focus({ focusVisible: true });
+    await expect(button.matches(':focus-visible')).toBe(true);
+    const after = (await paintedPixels(frame, look()))!;
+    for (const [side, label] of [
+      [0, 'top'],
+      [1, 'bottom'],
+    ] as const) {
+      const moved = after[side]!.some(
+        (channel, index) => Math.abs(channel - before[side]![index]!) > PART_OF_RING,
+      );
+      await expect(
+        moved,
+        `the ring is painted beyond the ${label} edge of the chosen row (${JSON.stringify(before[side])} to ${JSON.stringify(after[side])})`,
+      ).toBe(true);
+    }
+  },
+};
+
+/**
+ * The preferences of `striped`, read from computed styles (Chromium emulates the two through the
+ * protocol): with more contrast it has no stripes and a rule of 1px on the top of each row but the
+ * first, and a chosen row is not cut; in forced colours the edge of the footer row is a border of
+ * 1px on every cell, since the inner shadows that make it are dropped.
+ */
+export const StripedPreferences: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 760 }}>
+      <Orders variant="striped" selected="DH-1041" hovered="" aria-label="Orders" />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const { cdp, server } = await import('vitest/browser');
+    if (server.browser !== 'chromium') return;
+    const session = cdp();
+    const cell = (selector: string) =>
+      getComputedStyle(canvasElement.querySelector<HTMLElement>(selector)!);
+    // The first body row is odd, so it has a stripe; the second is the chosen one; the third is odd.
+    const stripe = 'tbody tr:nth-child(1) td:nth-child(2)';
+    const rule = 'tbody tr:nth-child(3) td:nth-child(2)';
+    const first = 'tbody tr:nth-child(1) td:nth-child(2)';
+    const footer = 'tfoot tr td:nth-child(2)';
+    await expect(cell(stripe).backgroundColor, 'default: a stripe').not.toBe('rgba(0, 0, 0, 0)');
+    await expect(cell(rule).boxShadow, 'default: no rule').toBe('none');
+    await expect(
+      getComputedStyle(canvasElement.querySelector('tr[data-selected]')!).clipPath,
+    ).not.toBe('none');
+    try {
+      await session.send('Emulation.setEmulatedMedia', {
+        features: [{ name: 'prefers-contrast', value: 'more' }],
+      });
+      await waitFor(() => expect(matchMedia('(prefers-contrast: more)').matches).toBe(true));
+      await expect(cell(stripe).backgroundColor, 'more contrast: no stripe').toBe(
+        'rgba(0, 0, 0, 0)',
+      );
+      await expect(cell(rule).boxShadow, 'more contrast: a rule on the top').toContain('inset');
+      await expect(cell(first).boxShadow, 'more contrast: none above the first').toBe('none');
+      await expect(
+        getComputedStyle(canvasElement.querySelector('tr[data-selected]')!).clipPath,
+        'more contrast: the chosen row is not cut',
+      ).toBe('none');
+      await session.send('Emulation.setEmulatedMedia', {
+        features: [{ name: 'forced-colors', value: 'active' }],
+      });
+      await waitFor(() => expect(matchMedia('(forced-colors: active)').matches).toBe(true));
+      await expect(cell(rule).boxShadow, 'forced colours: no shadow').toBe('none');
+      await expect(cell(footer).borderTopWidth, 'forced colours: the footer has an edge').toBe(
+        '1px',
+      );
+      await expect(cell(footer).borderBottomWidth).toBe('1px');
+    } finally {
+      await session.send('Emulation.setEmulatedMedia', { features: [] });
+    }
+  },
+};
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project storybook-light src/components/table
```

Expected: FAIL ở các story đo CSS của Task 2:
- `FocusRingsInPaddedFrame`: `striped md: 6px of frame beside it: expected +0 to be close to 6`, vì khung chưa có padding.
- `StripedSelectedRow`: `expected 'none' not to be 'none'` (`clip-path` tính được của hàng đã chọn).
- `PaddedFrameInACard`: cột 375px cuộn ngang, vì khung chưa có `position: relative` (phát hiện 5). Lần fail đầu ở bản nháp, `expected 561 to be less than or equal to 375`, còn có lỗi của chính story (cột lưới thiếu `minmax(0, 1fr)`, đã sửa trong story); số đo trên cây của Task 1 không được ghi lại.
- `StripedPreferences` (chỉ kiểm ở Chromium): fail ngay ở khẳng định đầu, `default: a stripe`, vì chưa có sọc. Dòng của báo cáo nháp, `more contrast: no stripe: expected 'color(srgb …)' to be 'rgba(0, 0, 0, 0)'`, là lúc đã có `table.css` mà chưa có `preferences.css` của Task 2.

Các story mới khác pass trên cây của Task 1 (phát hiện 12): `StickyHeader` (khung chưa có padding, nên chưa có dải 6px), `StripedSelectedRowFocus` (hàng chưa bị cắt), `PaddedScrollRegion`, và bốn story giao diện mới, vốn chỉ đặt focus.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
index dc2e9f9..89cd864 100644
--- a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
+++ b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
@@ -418,7 +418,7 @@ Trong mục này, "màu trạng thái" của Alert và Progress là: `info` →
 
 **Phần chung:**
 
-- **Khung cuộn** (`.flg-table-frame`): `overflow: auto` ở mọi variant, ngay từ HTML của server (§3.5). Mang `className` và `style` của `Table` (§6.3); người dùng đặt chiều cao tối đa ở đây khi dùng `stickyHeader`.
+- **Khung cuộn** (`.flg-table-frame`): `overflow: auto` ở mọi variant, ngay từ HTML của server (§3.5). Mang `className` và `style` của `Table` (§6.3); người dùng đặt chiều cao tối đa ở đây khi dùng `stickyHeader`. Khung có `position: relative` (phát hiện khi lập Plan C): chữ ẩn bằng `.flg-visually-hidden` trong ô (tiêu đề cột chỉ có chữ cho trình đọc màn hình) là `position: absolute`, và không có khung làm hệ quy chiếu thì nó nằm ở vị trí tĩnh của cột, ngoài vùng cắt của khung, làm cả trang cuộn ngang khi cột đó ở quá mép phải.
 - **Khung cuộn và vòng focus** (Claude chốt, phát hiện khi đọc soát spec). Yêu cầu: khung không cắt dấu hiệu focus nào của control bên trong bảng, ở mọi chế độ; ngoại lệ duy nhất là quầng `--flg-focus-ring` ở `lined`, vì mockup T1 đã cắt nó (khung `overflow: hidden`). Theo số đo của mockup, nút sắp xếp nằm cách mép bảng chừng 1–3px (`striped`: `border-spacing` 2px, padding 4px, margin −3px), nên một khung cuộn không có padding cắt quầng của nó ở `striped` và `minimal` (mockup T2, T3 vẽ quầng nguyên vẹn), và ở `prefers-contrast: more` cắt 1–3px của outline 2px cách 2px; ở `lined` cỡ `sm` cũng vậy.
   - `striped`, `minimal`: khung có padding 6px và margin −6px ở cả bốn phía, đúng cách hàng tab cuộn được của Tabs (chủ dự án chọn B; `tabs.css`). Bảng không xê dịch pixel nào; mép cắt của khung lùi ra 6px, nên quanh nút sắp xếp còn ít nhất 7px, đủ cho outline (4px) và vòng 3px của `--flg-focus-ring`. Phần nhạt nhất ở rìa quầng mờ của nó (blur 12px light, 10px dark) còn có thể chạm mép khung, như ở hàng tab cuộn được mà chủ dự án đã duyệt. Khung không có `max-width: 100%`: chiều rộng tự động là vùng chứa cộng 12px. Khác Tabs, margin âm có ở cả trục ngang, vì padding ngang không bù sẽ đẩy bảng vào 6px so với mockup (hệ quả ở §10).
   - `lined`: khung giữ viền và góc bo, nội dung sát viền như mockup T1, nên vẫn cắt. Ở `prefers-contrast: more` và forced colors, hai chế độ mà `outline` là dấu hiệu focus (ngoài mockup), control của lib trong khung `lined` vẽ outline vào trong: `outline-offset: -2px` cho nút sắp xếp, `Button` và `IconButton` trong ô, và ô vuông của Checkbox. Ở `sm`, Checkbox và IconButton ở hàng thân cuối chỉ cách mép khung 3px. Forced colors được thêm vì cùng lý do: chế độ đó bỏ `box-shadow`, nên outline là dấu hiệu duy nhất.
@@ -441,7 +441,7 @@ Trong mục này, "màu trạng thái" của Alert và Progress là: `info` →
 - **Hàng đã chọn** (`selected`): nền `--flg-accent-subtle` (Claude chốt). Mockup ghi `--flg-selected-bg`, bằng đúng `--flg-accent-subtle` ở mặc định; còn ở `prefers-contrast: more`, `--flg-selected-bg` thành nền nhấn đặc, mà một hàng bảng chứa Badge, Checkbox, nút và chữ mờ. Trạng thái chọn do Checkbox trong hàng nói (§6.3), nên nền hàng chỉ là dấu hiệu phụ.
   - Ở `prefers-contrast: more` (ngoài mockup; Claude chốt, phát hiện khi đọc soát spec): hàng đã chọn bỏ nền nhuộm và có một khung trong 2px `--flg-accent-solid` quanh hàng, vẽ bằng bóng trong trên các ô (mọi ô có cạnh trên và cạnh dưới, ô đầu thêm cạnh trái, ô cuối thêm cạnh phải; ở `lined` khung này thay vạch 3px). Lý do: chữ của Badge `accent` trên hai lớp nhuộm chỉ 4.17:1 light ngay ở chế độ này (§4.4). Khung đạt 6.07:1 light, 7.42:1 dark so với bề mặt.
 - **`TableCaption`** (ngoài mockup, mockup đặt tên bảng ở tiêu đề thẻ): `caption-side: top`, căn đầu dòng, padding `var(--py) var(--px)`, `--flg-text-sm` đậm `--flg-weight-semibold`, màu `--flg-text`. Docs khuyên `aria-labelledby` trỏ vào tiêu đề có sẵn khi bảng nằm dưới một tiêu đề nhìn thấy (§6.3).
-- **`stickyHeader`** (ngoài mockup, Claude chốt): ô tiêu đề cột `position: sticky; top: 0; z-index: 1`. Chúng có thêm một lớp nền `--flg-glass-tint-solid` dưới nền riêng của variant (nếu có), để các hàng cuộn qua không hiện xuyên qua tiêu đề. Ở dạng này, tiêu đề hơi đục hơn kính của thẻ chứa; chủ dự án duyệt khi xem story. Trong khung có padding (`striped`, `minimal`), Plan C kiểm ở ba engine rằng tiêu đề dính sát mép trên của vùng cuộn, không để các hàng hiện qua một dải 6px phía trên nó, và đặt `top` bằng âm padding nếu engine tính chỗ dính từ mép trong của padding.
+- **`stickyHeader`** (ngoài mockup, Claude chốt): ô tiêu đề cột `position: sticky; top: 0; z-index: 1`. Chúng có thêm một lớp nền `--flg-glass-tint-solid` dưới nền riêng của variant (nếu có), để các hàng cuộn qua không hiện xuyên qua tiêu đề. Ở dạng này, tiêu đề hơi đục hơn kính của thẻ chứa; chủ dự án duyệt khi xem story. Trong khung có padding (`striped`, `minimal`), Plan C kiểm ở ba engine rằng tiêu đề dính sát mép trên của vùng cuộn, không để các hàng hiện qua một dải 6px phía trên nó, và đặt `top` bằng âm padding nếu engine tính chỗ dính từ mép trong của padding. Kết quả đã kiểm (phát hiện khi lập Plan C): cả ba engine tính từ mép trong của padding, nên `striped` và `minimal` đặt `top: -6px`.
 - **Focus của khung cuộn** (khi nó là vùng cuộn được, §6.3): vòng focus chung theo hình của khung.
 
 **`lined` (T1, mặc định):** khung viền, tiêu đề và hàng chân có dải nền, kẻ giữa các hàng.
@@ -458,7 +458,7 @@ Trong mục này, "màu trạng thái" của Alert và Progress là: `info` →
 - Ô tiêu đề cột: `--flg-text-2xs`, chữ hoa, `letter-spacing: .06em`.
 - Ô đầu và ô cuối của mỗi hàng thân và hàng chân bo hai góc phía ngoài bằng `--flg-radius-md` (`border-start-start-radius`… để đúng cả khi viết từ phải sang trái sau này).
 - Hàng lẻ: các ô có nền sọc (§4.2). Hover: các ô nền `--flg-control-track`. Ở dark sọc và hover gần nhau hơn, đúng như mockup.
-- Hàng đã chọn: nền `--flg-accent-subtle` **vẽ một lần cho cả hàng**, không lặp lại theo từng ô (ghi chú của người vẽ: gradient của light lặp theo ô sẽ thành các vệt ở ranh giới ô). Spec vẽ nó trên `<tr>` (các ô của hàng đó bỏ nền sọc và nền hover) và bo hai đầu bằng `clip-path: inset(0 round var(--flg-radius-md))` trên `<tr>` (Claude chốt; kiểm ở Plan C, §10).
+- Hàng đã chọn: nền `--flg-accent-subtle` **vẽ một lần cho cả hàng**, không lặp lại theo từng ô (ghi chú của người vẽ: gradient của light lặp theo ô sẽ thành các vệt ở ranh giới ô). Spec vẽ nó trên `<tr>` (các ô của hàng đó bỏ nền sọc và nền hover) và bo hai đầu bằng `clip-path: inset(0 round var(--flg-radius-md))` trên `<tr>` (Claude chốt; kiểm ở Plan C, §10). Kết quả đã kiểm (phát hiện khi lập Plan C): cả ba engine cắt được `<tr>`; Chromium và WebKit vốn đã vẽ nền hàng theo góc bo của ô đầu và ô cuối, chỉ Firefox vẽ hình chữ nhật nên cần `clip-path`. Khi một control trong hàng đang có focus bàn phím (`:has(:focus-visible)`), hàng không bị cắt: ở `sm` hàng thấp hơn vòng focus của nút ở ô cuối nên đường cắt sẽ lấy mất phần vòng nằm ngoài hàng; Chromium và WebKit vẫn giữ góc bo nhờ các ô, Firefox hiện góc vuông cho tới khi focus rời đi. Ở `prefers-contrast: more` hàng đã chọn không bị cắt (khung 2px là bóng trong của các ô, đã bo theo ô).
 - Hàng chân: đậm `--flg-weight-semibold`; một viên viền mảnh vẽ bằng bóng trong: mọi ô có `inset 0 1px 0` và `inset 0 -1px 0` màu `--flg-control-border`, ô đầu có thêm `inset 1px 0 0`, ô cuối `inset -1px 0 0`.
 - Ở `prefers-contrast: more` (ngoài mockup; Claude chốt, phát hiện khi đọc soát spec): sọc được thay bằng đường kẻ 1px `--flg-control-border` ở cạnh trên của mỗi hàng thân trừ hàng đầu (bóng trong trên các ô), để mọi chữ trong ô nằm thẳng trên bề mặt. Chữ của Badge `accent` trên sọc chỉ 4.45:1 light ở chế độ đó (§4.4).
 
@@ -598,7 +598,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
   - Hàng disabled: `GrayText`.
 - **Table:**
   - Viền khung của `lined` và các đường kẻ: `CanvasText`. Nền tiêu đề, hàng chân, sọc và hover bị hệ thống bỏ.
-  - Hàng chân của `striped`: viên viền bằng bóng trong bị bỏ, nên các ô có viền trên và dưới 1px `CanvasText` (Claude chốt).
+  - Hàng chân của `striped`: viên viền bằng bóng trong bị bỏ, nên các ô có viền trên và dưới 1px `CanvasText`, ô đầu thêm viền đầu dòng và ô cuối thêm viền cuối dòng, để viên không hở hai đầu (Claude chốt; ghi thêm hai cạnh bên khi lập Plan C).
   - Hàng đã chọn: không có dấu riêng; Checkbox trong hàng (`Highlight`) nói trạng thái (Claude chốt). Khung 2px của chế độ `prefers-contrast: more` là bóng trong, nên chế độ này bỏ nó cùng mọi `box-shadow`.
   - Vòng focus: outline là dấu hiệu duy nhất ở chế độ này. Trong khung `lined`, outline của nút sắp xếp, `Button`, `IconButton` và ô vuông Checkbox vẽ vào trong (`outline-offset: -2px`); ở `striped` và `minimal`, padding 6px của khung giữ nó nguyên vẹn (§4.3; Claude chốt, phát hiện khi đọc soát spec).
   - Nút sắp xếp: chữ và icon `ButtonText`. Hướng sắp đọc được từ hình icon, không dựa vào màu.
diff --git a/src/components/table/Table.mdx b/src/components/table/Table.mdx
index 9fd2ecb..f3fbb8d 100644
--- a/src/components/table/Table.mdx
+++ b/src/components/table/Table.mdx
@@ -41,6 +41,35 @@ import {
 
 <Canvas of={Stories.Lined} />
 
+## Variants
+
+`variant` is the look of the table. All three have the same parts and props.
+
+- `lined` (the default): a frame with an edge and rounded corners, a banded heading and footer, and
+  a rule between the rows. It is the easiest to follow across many columns, and the heaviest.
+- `striped`: pills with no rules. Every other row has a faint stripe, the rows are 2px apart, and
+  the cells at the two ends of a row are rounded. The column headings are small capitals. A chosen
+  row is one rounded band.
+- `minimal`: no frame and no stripes, with roomy rows and a faint line under the heading and over
+  the footer.
+
+<Canvas of={Stories.Striped} />
+
+<Canvas of={Stories.Minimal} />
+
+`striped` and `minimal` have no edge, so the scroll frame around them has 6px of padding on every
+side, and the same margin out. That room is for the focus ring of a sort button or a control in a
+cell, which a scroll frame would clip where it touches the edge; the margin gives the room back, so
+the table does not move. The consequence is that the frame is 6px wider than the room it is in, on
+each side: put the table in something with at least 6px of padding, as a `Card` has. At the edge of
+a page with no padding of its own it can make the page scroll sideways by 6px.
+
+In `lined` the frame clips to its edge, and the table touches it: see "Accessibility" for what that
+means for your own controls in a cell.
+
+With `prefers-contrast: more`, `striped` has no stripes: a rule of 1px on top of each row tells them
+apart. In forced colours the footer row of `striped` has an edge of 1px in the text colour.
+
 ## Props
 
 ### Table
@@ -141,6 +170,9 @@ It needs a height to scroll in, which is a `max-height` on the frame:
 The headings are laid over a solid layer, so the rows do not show through. That makes them a little
 more opaque than the glass of the card around the table.
 
+The frame of `striped` and `minimal` has padding, and the headings stick to the top of what it
+shows, not 6px below it, so rows do not show through a band above them.
+
 <Canvas of={Stories.StickyHeader} />
 
 ## Choosing rows
@@ -216,6 +248,7 @@ While rows load, draw rows of `Skeleton` `text` in the cells.
 
 - Do name the table, with a `TableCaption` or an `aria-labelledby` that points at its heading.
 - Do give every Checkbox and icon button in a row a name that says which row.
+- Do put a `striped` or `minimal` table in something with at least 6px of padding, such as a `Card`.
 - Do keep your own controls in a `lined` table 4px or more from the edge of the frame.
 - Don't expect the table to sort, filter or page: pass it the rows in the order to show.
 - Don't put a `TableCaption` anywhere but first in the `Table`.
diff --git a/src/styles/components/table.css b/src/styles/components/table.css
index 613434f..ca2f558 100644
--- a/src/styles/components/table.css
+++ b/src/styles/components/table.css
@@ -13,6 +13,10 @@
     /* The frame always scrolls, so a sticky heading has a box to stick to and a table wider than its
        room is scrolled before any script has run (spec §3.5). */
     overflow: auto;
+    /* The box that a visually hidden text in a cell, which is positioned, is placed against and scrolls
+       with. Without it that text sits against the page, outside the frame's clip, and a column of
+       hidden headings past the right edge makes the page scroll sideways. */
+    position: relative;
     /* It fills its row with the margin box, so a margin of the caller's comes out of the width
        instead of pushing past the parent. In a flex row it cannot be wider than what is left of the
        row, and that needs `min-width: 0`: a scroll container would otherwise be as wide as its
@@ -204,4 +208,142 @@
     > :first-child {
     box-shadow: inset 3px 0 0 var(--flg-accent-solid);
   }
+
+  /* striped (T2) and minimal (T3): the frame has 6px of padding on every side and the same margin
+     out, as the scroll row of Tabs does. A scroll box clips what is painted outside its padding
+     edge, and the ring of a sort button, 4px of outline and a glow beyond that, is that close to the
+     edge of the table: the margin takes the room back, so the table does not move. The frame is 12px
+     wider than the room it is in, and a parent without padding of its own can scroll sideways by
+     6px (spec phase 4 §10). */
+  .flg-table-frame:is([data-variant='striped'], [data-variant='minimal']) {
+    margin: -6px;
+    padding: 6px;
+  }
+
+  /* A heading sticks to the edge of the padding box, which is the top of what the frame shows, so its
+      has to take the padding back: with 0 it sits 6px down, in every engine, and the rows show
+     through the band above it. */
+  .flg-table-frame:is([data-variant='striped'], [data-variant='minimal'])[data-sticky-header]
+    .flg-table-header
+    .flg-table-head {
+    top: -6px;
+  }
+
+  /* A heading sticks to the edge of the padding box, which is the top of what the frame shows, so its
+     `top` has to take the padding back: with 0 it sits 6px down, in every engine, and the rows show
+     through the band above it. */
+  .flg-table-frame:is([data-variant='striped'], [data-variant='minimal'])[data-sticky-header]
+    .flg-table-header
+    .flg-table-head {
+    top: -6px;
+  }
+
+  /* striped (T2): pills with no rules. The rows are 2px apart, and the cells of the first and last
+     column round the outer corners of each row. */
+  .flg-table-frame[data-variant='striped'] {
+    --flg-table-hpy: 4px;
+  }
+  .flg-table-frame[data-variant='striped'][data-size='sm'] {
+    --flg-table-hpy: 3px;
+  }
+  .flg-table-frame[data-variant='striped'] .flg-table {
+    border-spacing: 0 2px;
+  }
+  .flg-table-frame[data-variant='striped'] .flg-table-header .flg-table-head {
+    font-size: var(--flg-text-2xs);
+    letter-spacing: 0.06em;
+    text-transform: uppercase;
+  }
+  .flg-table-frame[data-variant='striped']
+    :is(.flg-table-body, .flg-table-footer)
+    > .flg-table-row
+    > :first-child {
+    border-start-start-radius: var(--flg-radius-md);
+    border-end-start-radius: var(--flg-radius-md);
+  }
+  .flg-table-frame[data-variant='striped']
+    :is(.flg-table-body, .flg-table-footer)
+    > .flg-table-row
+    > :last-child {
+    border-start-end-radius: var(--flg-radius-md);
+    border-end-end-radius: var(--flg-radius-md);
+  }
+  /* The stripes and the hover are on the cells, which are the pills, so the row paints nothing of
+     its own for them. */
+  .flg-table-frame[data-variant='striped']
+    .flg-table-body
+    > .flg-table-row:not([data-selected]):nth-child(odd)
+    > * {
+    background: color-mix(in srgb, var(--flg-control-track) 50%, transparent);
+  }
+  @media (hover: hover) {
+    .flg-table-frame[data-variant='striped']
+      .flg-table-body
+      > .flg-table-row:not([data-selected]):hover {
+      background: none;
+    }
+    .flg-table-frame[data-variant='striped']
+      .flg-table-body
+      > .flg-table-row:not([data-selected]):hover
+      > * {
+      background: var(--flg-control-track);
+    }
+  }
+  /* A chosen row is painted once, on the row, and rounded at both ends by cutting the row: a wash
+     on each cell would repeat the light theme's gradient in every cell and show a seam at each
+     boundary. Its cells paint nothing. */
+  .flg-table-frame[data-variant='striped'] .flg-table-body > .flg-table-row[data-selected] {
+    clip-path: inset(0 round var(--flg-radius-md));
+  }
+  /* The cut would also take the part of a ring that a control in the row draws beyond the row, as the
+     button of the last column does in `sm`, where the row is hardly taller than it. While one has
+     the keyboard focus the row is not cut. Chromium and WebKit still round it, since they paint a
+     row's background through its cells, whose corners are round; Firefox shows it square until the
+     focus leaves (spec phase 4 §10). */
+  .flg-table-frame[data-variant='striped']
+    .flg-table-body
+    > .flg-table-row[data-selected]:has(:focus-visible) {
+    clip-path: none;
+  }
+  /* The footer row is a pill with a thin edge, made of inner shadows so it does not move the text:
+     the top and bottom edge on every cell, the left on the first and the right on the last. */
+  .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > * {
+    box-shadow:
+      inset 0 1px 0 var(--flg-control-border),
+      inset 0 -1px 0 var(--flg-control-border);
+  }
+  .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > :first-child {
+    box-shadow:
+      inset 1px 0 0 var(--flg-control-border),
+      inset 0 1px 0 var(--flg-control-border),
+      inset 0 -1px 0 var(--flg-control-border);
+  }
+  .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > :last-child {
+    box-shadow:
+      inset -1px 0 0 var(--flg-control-border),
+      inset 0 1px 0 var(--flg-control-border),
+      inset 0 -1px 0 var(--flg-control-border);
+  }
+  .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > :only-child {
+    box-shadow: inset 0 0 0 1px var(--flg-control-border);
+  }
+
+  /* minimal (T3): roomy, with a faint line under the heading and over the footer. The line is
+     written out and is not the drop zone's token, which turns solid with more contrast: a rule in a
+     table is only a decoration (spec phase 4 §4.2). */
+  .flg-table-frame[data-variant='minimal'] {
+    --flg-table-py: 14px;
+    --flg-table-hpy: 6px;
+  }
+  .flg-table-frame[data-variant='minimal'][data-size='sm'] {
+    --flg-table-py: 6px;
+    --flg-table-hpy: 4px;
+  }
+  .flg-table-frame[data-variant='minimal'] .flg-table-header .flg-table-head {
+    border-bottom: 1px solid color-mix(in srgb, var(--flg-text-muted) 45%, transparent);
+    font-weight: var(--flg-weight-medium);
+  }
+  .flg-table-frame[data-variant='minimal'] .flg-table-footer :is(.flg-table-head, .flg-table-cell) {
+    border-top: 1px solid color-mix(in srgb, var(--flg-text-muted) 45%, transparent);
+  }
 }
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index ca931a2..4ebb7b9 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -140,6 +140,22 @@
     .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):only-child {
       box-shadow: inset 0 0 0 2px var(--flg-accent-solid);
     }
+    /* `striped` has no stripes and no hover here (the same two reasons as the row above): its rows
+       are told apart by a rule of 1px on the top of every row but the first, drawn with an inner
+       shadow on the cells, so that all the text is on the surface. A chosen row has the frame above
+       instead, and is not cut: a cut would round the corners of a frame whose cells already are. */
+    .flg-table-frame[data-variant='striped'] .flg-table-body > .flg-table-row > * {
+      background: none;
+    }
+    .flg-table-frame[data-variant='striped']
+      .flg-table-body
+      > .flg-table-row:not(:first-child, [data-selected])
+      > * {
+      box-shadow: inset 0 1px 0 var(--flg-control-border);
+    }
+    .flg-table-frame[data-variant='striped'] .flg-table-body > .flg-table-row[data-selected] {
+      clip-path: none;
+    }
   }
   /* In these two modes the outline is what shows the focus, and the frame of a `lined` Table, which
      has no room around its edge cells (3px at `sm`) and clips what it paints outside, would cut it.
@@ -685,7 +701,8 @@
     /* The edge of a `lined` Table and its rules are in the text colour; the bands of its heading and
        footer, and the wash of the rows, are dropped by the system (spec phase 4 §4.5). */
     .flg-table-frame[data-variant='lined'],
-    .flg-table-frame[data-variant='lined'] :is(.flg-table-head, .flg-table-cell) {
+    .flg-table-frame:is([data-variant='lined'], [data-variant='minimal'])
+      :is(.flg-table-head, .flg-table-cell) {
       border-color: CanvasText;
     }
     /* The sort button, and the icon in it, are in the colour of a button. */
@@ -704,6 +721,29 @@
     .flg-table-row[data-selected] > :is(.flg-table-cell, .flg-table-head):only-child {
       box-shadow: none;
     }
+    /* The rules of `striped` of `prefers-contrast: more` are inner shadows too, which this mode
+       drops, and the same selectors come again here for the same reason. The edge of its footer row
+       is made of them as well, so the cells have a border of 1px in the text colour instead: on the
+       top and the bottom, and on the side where the row ends (spec phase 4 §4.5). */
+    .flg-table-frame[data-variant='striped']
+      .flg-table-body
+      > .flg-table-row:not(:first-child, [data-selected])
+      > * {
+      box-shadow: none;
+    }
+    .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > * {
+      border-block: 1px solid CanvasText;
+      box-shadow: none;
+    }
+    .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > :first-child {
+      border-inline-start: 1px solid CanvasText;
+    }
+    .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > :last-child {
+      border-inline-end: 1px solid CanvasText;
+    }
+    .flg-table-frame[data-variant='striped'] .flg-table-footer > .flg-table-row > :only-child {
+      border-inline: 1px solid CanvasText;
+    }
     /* A sticky heading is solid in the colour of the canvas. Its own layer is a gradient, which this
        mode drops, and the rows would show through. */
     .flg-table-frame[data-sticky-header] .flg-table-header .flg-table-head {
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm check:contrast
pnpm vitest run --project unit --project unit-react18 src/components/table src/docs
pnpm vitest run --project storybook-light src/components/table
pnpm vitest run --project storybook-dark src/components/table
pnpm build && pnpm check:package
pnpm build-storybook
```

Expected:
- `pnpm check:contrast`: PASS. Không có check mới; các `known-exception` và số của chúng như sau Task 1.
- Unit: 7 file, 87 test PASS, không lỗi kiểu (task này không đổi unit test).
- Story Table: 60 test PASS ở mỗi project (20 story × ba engine). axe chạy sau play function, không có vi phạm. Các story đọc pixel và hình học chạy ở cả ba engine; phần giả lập qua CDP (`FocusRingsInPaddedFrame` ở contrast-more và forced colors, `StripedPreferences`) chỉ ở Chromium.
- `pnpm build && pnpm check:package`: FAIL chỉ ở bước `size`: CSS 12.77 kB trên ngưỡng 12.66 kB (vượt 118 B). Các bước trước đó pass; `check:dist-css` không đổi, vì task này không thêm class. Không chạy `pnpm size:record` (phát hiện 11).
- `pnpm build-storybook`: PASS, kể cả mục "Variants" của `Table.mdx`. Trong `storybook-static/index.json`, đúng bảy story của Table không gắn `no-visual`: `Lined`, `LinedSmallFocus`, `Striped`, `StripedSmallFocus`, `Minimal`, `MinimalSmallFocus`, `StickyHeader`.
- `position: relative` của khung không đổi giao diện `lined`; ảnh chuẩn của component cũ giữ nguyên (phát hiện 13).

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md \
  src/components/table/Table.mdx \
  src/components/table/Table.stories.tsx \
  src/styles/components/table.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(table): add the striped and minimal looks" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: Docs chung ("Loading states", "Show data", Accessibility)

Spec §8 (hai mục mới của Getting started, các ghi chú của trang Accessibility), §3.4 (mỗi component nói gì với screen reader), §3.3 (quy tắc giảm chuyển động mới), §6.3 (quy tắc các `Step` trong Server Component, `renderLink`, các công thức của Table). Không có code của lib.
- **"Loading states"** trong `GettingStarted.mdx`: vùng chứa `aria-busy` luôn có mặt với vùng `role="status"` có mặt từ trước; Skeleton thay bằng nội dung; `Progress` và `Spinner`; hàng đang tải của Table (phát hiện 7).
- **"Show data"**: Table có sắp xếp, ô chọn bằng Checkbox và Pagination; trạng thái rỗng; List điều hướng; Stepper với nội dung theo `value`. Mục này nói rõ lib không sắp xếp, lọc hay phân trang dữ liệu (phát hiện 7).
- **Ví dụ sống** từ hai file story mới, gắn `no-visual` ở meta, nên số story có ảnh không đổi (116). Code trong các khối MDX giống code của story.
- **Accessibility:** mục "Alert, Skeleton and progress", và gạch đầu dòng mới về giảm chuyển động trong "Other preferences". Ghi chú của Table có từ Task 1, của Stepper và List có từ Plan B.
- Đoạn đầu của Getting started thêm các component của giai đoạn 4.

**Files:**
- Create: `src/docs/LoadingStates.stories.tsx`, `src/docs/ShowData.stories.tsx`
- Modify: `src/docs/GettingStarted.mdx`, `src/docs/Accessibility.mdx`

**Interfaces:**
- Produces `src/docs/LoadingStates.stories.tsx`: meta `title: 'Examples/Loading states'`, `tags: ['no-visual']`; story `Container`, `KnownAndUnknown`, `TableRows`.
- Produces `src/docs/ShowData.stories.tsx`: meta `title: 'Examples/Show data'`, `tags: ['no-visual']`; story `Orders`, `Empty`, `Navigation`, `Steps`.
- `GettingStarted.mdx`: mục `## Loading states` và `## Show data`, giữa "Build a form" và "Pick a theme"; `Canvas` của `@storybook/addon-docs/blocks` hiện `LoadingStories.Container`, `LoadingStories.KnownAndUnknown`, `LoadingStories.TableRows`, `DataStories.Orders`, `DataStories.Navigation`, `DataStories.Steps`.
- `Accessibility.mdx`: mục `## Alert, Skeleton and progress`, trước "A `<dialog>` the library did not create".
- Không có export, class, CSS hay token mới.
- Consumes: `Skeleton`, `SkeletonText`, `Progress`, `Spinner`, `Button`, `Card` và các phần, `Table` và các phần (Task 1), `Checkbox`, `Pagination`, `List`, `ListItem`, `Stepper`, `Step`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/docs/LoadingStates.stories.tsx b/src/docs/LoadingStates.stories.tsx
new file mode 100644
index 0000000..ce04997
--- /dev/null
+++ b/src/docs/LoadingStates.stories.tsx
@@ -0,0 +1,194 @@
+import type { CSSProperties } from 'react';
+import { useEffect, useState } from 'react';
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { expect, userEvent, waitFor } from 'storybook/test';
+import { Button } from '../components/button/Button';
+import { Card, CardContent, CardHeader, CardTitle } from '../components/card/Card';
+import { Progress } from '../components/progress/Progress';
+import { Skeleton, SkeletonText } from '../components/skeleton/Skeleton';
+import { Spinner } from '../components/spinner/Spinner';
+import { Table, TableCaption } from '../components/table/Table';
+import {
+  TableBody,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from '../components/table/table-parts';
+
+// These examples are the code of "Loading states" in Getting started. They are `no-visual`: they
+// prove the recipe works (the container stays, the announcement is already in the page), and the
+// looks of the parts have their own stories.
+const meta = {
+  title: 'Examples/Loading states',
+  tags: ['no-visual'],
+} satisfies Meta;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** Stands for a visually hidden class of your own (`sr-only`), which the page has to provide. */
+const srOnly: CSSProperties = {
+  position: 'absolute',
+  width: 1,
+  height: 1,
+  overflow: 'hidden',
+  clip: 'rect(0 0 0 0)',
+  whiteSpace: 'nowrap',
+};
+
+/** Turns `loading` true when asked and back to false after `delay` ms, as a request would. */
+function useFakeRequest(delay: number) {
+  const [loading, setLoading] = useState(false);
+  useEffect(() => {
+    if (!loading) return;
+    const timer = setTimeout(() => setLoading(false), delay);
+    return () => clearTimeout(timer);
+  }, [loading, delay]);
+  return [loading, () => setLoading(true)] as const;
+}
+
+function WeeklyReport({ delay = 200 }: { delay?: number }) {
+  const [loading, refresh] = useFakeRequest(delay);
+  return (
+    <Card style={{ width: 360 }}>
+      {/* Always in the page, so a screen reader already watches it when its text changes. */}
+      <div role="status" style={srOnly}>
+        {loading ? 'Loading the weekly report' : ''}
+      </div>
+      {/* Always mounted: only what is inside it changes. */}
+      <section aria-busy={loading} aria-label="Weekly report">
+        {loading ? (
+          <>
+            <Skeleton shape="text" width="40%" />
+            <SkeletonText lines={2} />
+          </>
+        ) : (
+          <>
+            <CardHeader>
+              <CardTitle>Weekly report</CardTitle>
+            </CardHeader>
+            <CardContent>1,240 visits, up 8% on last week.</CardContent>
+          </>
+        )}
+      </section>
+      <Button variant="ghost" onClick={refresh} disabled={loading}>
+        Refresh
+      </Button>
+    </Card>
+  );
+}
+
+export const Container: Story = {
+  render: () => <WeeklyReport />,
+  play: async ({ canvas, canvasElement }) => {
+    const section = canvas.getByRole('region', { name: 'Weekly report' });
+    const status = canvas.getByRole('status');
+    // Before the work starts the region is already there, and empty.
+    await expect(status).toHaveTextContent('');
+    await expect(section).toHaveAttribute('aria-busy', 'false');
+
+    await userEvent.click(canvas.getByRole('button', { name: 'Refresh' }));
+    // The same two elements, not new ones: the region keeps watching, the container stays.
+    await expect(canvas.getByRole('status')).toBe(status);
+    await expect(canvas.getByRole('region', { name: 'Weekly report' })).toBe(section);
+    await expect(status).toHaveTextContent('Loading the weekly report');
+    await expect(section).toHaveAttribute('aria-busy', 'true');
+    // The Skeletons are hidden from screen readers; the container says "loading".
+    await expect(section.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
+    await expect(canvasElement.querySelector('[aria-busy="true"] [role="status"]')).toBeNull();
+
+    await waitFor(() => expect(section).toHaveAttribute('aria-busy', 'false'));
+    await expect(status).toHaveTextContent('');
+    await expect(canvas.getByText(/1,240 visits/)).toBeVisible();
+  },
+};
+
+/** A known amount of work gets a `Progress`; a short wait of unknown length gets a `Spinner`. */
+function Uploads({ done, total }: { done: number; total: number }) {
+  return (
+    <div style={{ display: 'grid', gap: 16, width: 320 }}>
+      <Progress
+        label="Uploading photos"
+        value={done}
+        max={total}
+        getValueText={(value, max) => `${value} of ${max} photos`}
+        showValue
+      />
+      <Spinner label="Saving your changes" />
+    </div>
+  );
+}
+
+export const KnownAndUnknown: Story = {
+  render: () => <Uploads done={3} total={8} />,
+  play: async ({ canvas }) => {
+    const bar = canvas.getByRole('progressbar', { name: 'Uploading photos' });
+    await expect(bar).toHaveAttribute('aria-valuenow', '3');
+    await expect(bar).toHaveAttribute('aria-valuemax', '8');
+    await expect(canvas.getByRole('status')).toHaveTextContent('Saving your changes');
+  },
+};
+
+const ORDERS = [
+  { id: 'DH-1042', customer: 'Lê Minh Anh', total: '1.250.000 ₫' },
+  { id: 'DH-1041', customer: 'Trần Quốc Bảo', total: '480.000 ₫' },
+];
+
+function OrdersLoading({ delay = 200 }: { delay?: number }) {
+  const [loading, reload] = useFakeRequest(delay);
+  return (
+    <div style={{ width: 480 }}>
+      <div role="status" style={srOnly}>
+        {loading ? 'Loading the orders' : ''}
+      </div>
+      <Table aria-busy={loading}>
+        <TableCaption>Recent orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Order</TableHead>
+            <TableHead>Customer</TableHead>
+            <TableHead align="end">Total</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {loading
+            ? [0, 1].map((row) => (
+                <TableRow key={row}>
+                  {/* The same three cells as a real row, so the columns do not move. */}
+                  {[0, 1, 2].map((cell) => (
+                    <TableCell key={cell}>
+                      <Skeleton shape="text" width={cell === 0 ? 72 : 120} />
+                    </TableCell>
+                  ))}
+                </TableRow>
+              ))
+            : ORDERS.map((order) => (
+                <TableRow key={order.id}>
+                  <TableCell>{order.id}</TableCell>
+                  <TableCell>{order.customer}</TableCell>
+                  <TableCell align="end">{order.total}</TableCell>
+                </TableRow>
+              ))}
+        </TableBody>
+      </Table>
+      <Button variant="ghost" onClick={reload} disabled={loading}>
+        Reload
+      </Button>
+    </div>
+  );
+}
+
+export const TableRows: Story = {
+  render: () => <OrdersLoading />,
+  play: async ({ canvas }) => {
+    const table = canvas.getByRole('table', { name: 'Recent orders' });
+    await expect(canvas.getAllByRole('row')).toHaveLength(3);
+    await userEvent.click(canvas.getByRole('button', { name: 'Reload' }));
+    await expect(canvas.getByRole('table', { name: 'Recent orders' })).toBe(table);
+    await expect(table).toHaveAttribute('aria-busy', 'true');
+    await expect(canvas.getByRole('status')).toHaveTextContent('Loading the orders');
+    await waitFor(() => expect(table).toHaveAttribute('aria-busy', 'false'));
+    await expect(canvas.getByRole('cell', { name: 'DH-1042' })).toBeVisible();
+  },
+};
diff --git a/src/docs/ShowData.stories.tsx b/src/docs/ShowData.stories.tsx
new file mode 100644
index 0000000..7fc881b
--- /dev/null
+++ b/src/docs/ShowData.stories.tsx
@@ -0,0 +1,242 @@
+import { useState } from 'react';
+import type { ComponentProps } from 'react';
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { expect, userEvent } from 'storybook/test';
+import { Button } from '../components/button/Button';
+import { Checkbox } from '../components/checkbox/Checkbox';
+import { List, ListItem } from '../components/list/List';
+import { Pagination } from '../components/pagination/Pagination';
+import { Step, Stepper } from '../components/stepper/Stepper';
+import { Table, TableCaption } from '../components/table/Table';
+import {
+  TableBody,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from '../components/table/table-parts';
+import type { TableSort } from '../components/table/table-parts';
+
+// These examples are the code of "Show data" in Getting started. They are `no-visual`: they prove
+// that the pieces fit together, and the looks of the parts have their own stories.
+const meta = {
+  title: 'Examples/Show data',
+  tags: ['no-visual'],
+} satisfies Meta;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+interface Order {
+  id: string;
+  customer: string;
+  total: number;
+}
+
+const ORDERS: Order[] = [
+  { id: 'DH-1042', customer: 'Lê Minh Anh', total: 1250000 },
+  { id: 'DH-1041', customer: 'Trần Quốc Bảo', total: 480000 },
+  { id: 'DH-1040', customer: 'Phạm Thu Hà', total: 2190000 },
+  { id: 'DH-1039', customer: 'Nguyễn Văn Dũng', total: 95000 },
+  { id: 'DH-1038', customer: 'Đỗ Mai Chi', total: 760000 },
+];
+
+const PAGE_SIZE = 3;
+
+/**
+ * The library draws the table, the boxes and the pages. Sorting, choosing and cutting the data into
+ * pages are done here, in plain code: the library never sorts, filters or pages.
+ */
+function OrdersTable({ orders }: { orders: Order[] }) {
+  const [sort, setSort] = useState<TableSort>('none');
+  const [page, setPage] = useState(1);
+  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
+
+  const sorted =
+    sort === 'none'
+      ? orders
+      : [...orders].sort((a, b) => (sort === 'ascending' ? a.total - b.total : b.total - a.total));
+  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
+  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
+
+  const onPage = rows.filter((order) => chosen.has(order.id)).length;
+  const toggle = (id: string, on: boolean) =>
+    setChosen((before) => {
+      const next = new Set(before);
+      if (on) next.add(id);
+      else next.delete(id);
+      return next;
+    });
+
+  return (
+    <div style={{ width: 520, display: 'grid', gap: 12 }}>
+      <Table>
+        <TableCaption>Recent orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            <TableHead>
+              {/* The box in the heading selects the rows of this page, and is mixed when only some are. */}
+              <Checkbox
+                aria-label="Select all"
+                checked={rows.length > 0 && onPage === rows.length}
+                indeterminate={onPage > 0 && onPage < rows.length}
+                onCheckedChange={(on) => rows.forEach((order) => toggle(order.id, on))}
+              />
+            </TableHead>
+            <TableHead>Order</TableHead>
+            <TableHead>Customer</TableHead>
+            <TableHead
+              align="end"
+              sort={sort}
+              onSort={(next) => {
+                setSort(next);
+                setPage(1);
+              }}
+            >
+              Total
+            </TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {rows.length === 0 ? (
+            <TableRow>
+              {/* One cell across every column, which may wrap. */}
+              <TableCell colSpan={4} align="center" style={{ whiteSpace: 'normal' }}>
+                <strong>No orders yet</strong>
+                <br />
+                New orders will show up here.
+              </TableCell>
+            </TableRow>
+          ) : (
+            rows.map((order) => (
+              <TableRow key={order.id} selected={chosen.has(order.id)}>
+                <TableCell>
+                  <Checkbox
+                    aria-label={`Select ${order.id}`}
+                    checked={chosen.has(order.id)}
+                    onCheckedChange={(on) => toggle(order.id, on)}
+                  />
+                </TableCell>
+                <TableCell>{order.id}</TableCell>
+                <TableCell>{order.customer}</TableCell>
+                <TableCell align="end">{order.total.toLocaleString('vi-VN')} ₫</TableCell>
+              </TableRow>
+            ))
+          )}
+        </TableBody>
+      </Table>
+      <Pagination count={pageCount} page={page} onPageChange={setPage} aria-label="Orders pages" />
+    </div>
+  );
+}
+
+export const Orders: Story = {
+  render: () => <OrdersTable orders={ORDERS} />,
+  play: async ({ canvas }) => {
+    const column = (name: string) => canvas.getByRole('columnheader', { name });
+    const first = () => canvas.getAllByRole('row')[1];
+    await expect(first()).toHaveTextContent('DH-1042');
+    await expect(column('Total')).not.toHaveAttribute('aria-sort');
+
+    // The app sorts: the library only says which column is sorted.
+    await userEvent.click(canvas.getByRole('button', { name: 'Total' }));
+    await expect(column('Total')).toHaveAttribute('aria-sort', 'ascending');
+    await expect(first()).toHaveTextContent('DH-1039');
+
+    // Choosing one row of three makes the box in the heading mixed.
+    const all = canvas.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
+    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select DH-1039' }));
+    await expect(all.indeterminate).toBe(true);
+    await expect(all.checked).toBe(false);
+    await userEvent.click(all);
+    await expect(all.indeterminate).toBe(false);
+    await expect(all.checked).toBe(true);
+
+    // The second page is cut by the app; the choice made on the first one is kept.
+    await userEvent.click(canvas.getByRole('button', { name: 'Page 2' }));
+    await expect(canvas.getAllByRole('row')).toHaveLength(3);
+    await expect(all.checked).toBe(false);
+    await userEvent.click(canvas.getByRole('button', { name: 'Page 1' }));
+    await expect(all.checked).toBe(true);
+  },
+};
+
+export const Empty: Story = {
+  render: () => <OrdersTable orders={[]} />,
+  play: async ({ canvas }) => {
+    const cell = canvas.getByRole('cell', { name: /No orders yet/ });
+    await expect(cell).toHaveAttribute('colspan', '4');
+    await expect(canvas.getAllByRole('row')).toHaveLength(2);
+  },
+};
+
+function Link({ href, ...props }: ComponentProps<'a'>) {
+  // Stands for the `Link` of your router. The content comes in `props.children`.
+  // eslint-disable-next-line jsx-a11y/anchor-has-content
+  return <a href={href} {...props} />;
+}
+
+function Sidebar({ path }: { path: string }) {
+  const item = (title: string, href: string) => (
+    <ListItem
+      title={title}
+      href={href}
+      current={path === href}
+      renderLink={(props) => <Link {...props} />}
+    />
+  );
+  return (
+    <nav aria-label="Settings" style={{ width: 260 }}>
+      <List size="sm">
+        {item('Profile', '/settings/profile')}
+        {item('Billing', '/settings/billing')}
+        {item('Team', '/settings/team')}
+      </List>
+    </nav>
+  );
+}
+
+export const Navigation: Story = {
+  render: () => <Sidebar path="/settings/billing" />,
+  play: async ({ canvas }) => {
+    // The current row says so on its link, which is the one the router rendered.
+    await expect(canvas.getByRole('link', { name: 'Billing' })).toHaveAttribute(
+      'aria-current',
+      'page',
+    );
+    await expect(canvas.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
+    await expect(canvas.getByRole('link', { name: 'Team' })).toHaveAttribute(
+      'href',
+      '/settings/team',
+    );
+  },
+};
+
+/** The component that renders the Stepper writes the Steps, and shows what the current one holds. */
+function Checkout() {
+  const [value, setValue] = useState(0);
+  return (
+    <div style={{ width: 480, display: 'grid', gap: 16 }}>
+      <Stepper value={value} onValueChange={setValue}>
+        <Step title="Cart" />
+        <Step title="Delivery" />
+        <Step title="Payment" />
+      </Stepper>
+      {value === 0 ? <Button onClick={() => setValue(1)}>Continue to delivery</Button> : null}
+      {value === 1 ? <p>Where should we send it?</p> : null}
+      {value === 2 ? <p>How would you like to pay?</p> : null}
+    </div>
+  );
+}
+
+export const Steps: Story = {
+  render: () => <Checkout />,
+  play: async ({ canvas }) => {
+    await userEvent.click(canvas.getByRole('button', { name: 'Continue to delivery' }));
+    await expect(canvas.getByText('Where should we send it?')).toBeVisible();
+    await expect(canvas.queryByRole('button', { name: 'Continue to delivery' })).toBeNull();
+    // Going back is the Stepper's `onValueChange`: the step that was done is a button.
+    await userEvent.click(canvas.getByRole('button', { name: /Cart/ }));
+    await expect(canvas.getByRole('button', { name: 'Continue to delivery' })).toBeVisible();
+  },
+};
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project storybook-light src/docs
```

Expected: PASS. Bảy story mới là test đặc tả của các component có sẵn (phát hiện 12): chúng không fail được vì thiếu code. Lần chạy đầu ở bản nháp có 3 fail, đều do kỳ vọng sai của chính story `Orders` (sắp tăng dần thì DH-1039 đứng đầu, không phải DH-1041); story được sửa, code không đổi. Kiểm tra thật của task này là Step 4: trang MDX biên dịch được, và số story có ảnh không đổi.

- [ ] **Step 3: Viết code**

````diff
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 4e60630..87e409c 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -86,6 +86,27 @@ it with a `TableCaption` or an `aria-label`. With `prefers-contrast: more` the r
 pointer and the stripes of `striped` are not drawn, and a chosen row has a 2px frame instead of a
 wash, so every Badge and every muted text in a row sits on the surface.
 
+## Alert, Skeleton and progress
+
+None of the phase 4 components makes a live region of its own. Each says what it is, and you choose
+when a change is announced.
+
+- **Alert has no `role` by default.** Text that is in the page from the start is not read as news
+  even when it has a role, and an error that a server rendered is not news, so the library does not
+  make `error` an `alert`. After something the person did, choose one of two recipes. For a polite
+  message, keep an empty `<div role="status">` in the page from the first render and render the
+  Alert into it: a screen reader reads only what changes in a live region it already knows. For an
+  urgent one, give the Alert `role="alert"` and put it into the tree after the action. Send focus
+  somewhere sensible when an Alert is closed.
+- **Skeleton is always `aria-hidden`.** Many blocks would be many announcements, so the container
+  says "loading" once: it stays mounted, carries `aria-busy` while the work runs and `false` after,
+  and a `role="status"` region that was in the page before the work started says what is loading.
+  "Loading states" in Getting started shows it. A Suspense `fallback` is inserted already filled, so
+  what it says is read on a best-effort basis.
+- **Progress** puts its name, value and state (`aria-valuetext` carries the state too) on the
+  `role="progressbar"` element. It is read when the person reaches it; the library does not announce
+  each percent.
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
@@ -99,4 +120,8 @@ Drawer, or keep toasts for moments when no other modal is open.
   almost opaque.
 - In `forced-colors: active` (Windows High Contrast) the library uses system colours and keeps
   borders and focus outlines visible.
-- With `prefers-reduced-motion: reduce` transitions stop; spinners keep turning, more slowly.
+- With `prefers-reduced-motion: reduce` transitions stop, and so do the repeating animations of
+  Progress and Skeleton: the indeterminate Progress is a still striped bar, and a Skeleton does not
+  pulse, shimmer or breathe. A repeating animation cannot be stopped by a zero duration, so the
+  library has a rule of its own for them. Spinners keep turning, more slowly, because a still one
+  would no longer say "busy".
diff --git a/src/docs/GettingStarted.mdx b/src/docs/GettingStarted.mdx
index 5154ac6..f90e192 100644
--- a/src/docs/GettingStarted.mdx
+++ b/src/docs/GettingStarted.mdx
@@ -1,4 +1,6 @@
-import { Meta } from '@storybook/addon-docs/blocks';
+import { Canvas, Meta } from '@storybook/addon-docs/blocks';
+import * as DataStories from './ShowData.stories';
+import * as LoadingStories from './LoadingStates.stories';
 
 <Meta title="Docs/Getting started" />
 
@@ -47,7 +49,8 @@ Phase 1 components: Surface, Card, Button, IconButton, Badge, Avatar, Divider, S
 Input, Textarea, Checkbox, RadioGroup and Switch. Phase 2 adds Dialog, Drawer, Popover, Tooltip,
 DropdownMenu, ContextMenu, Select, Tabs, Accordion, Breadcrumb, Pagination and Toast. Phase 3 adds
 the advanced inputs: Slider, NumberInput, SegmentedControl, Combobox, TagInput, FileUpload, Calendar
-and DatePicker.
+and DatePicker. Phase 4 adds the display of data and of progress: Alert, Progress, Skeleton,
+Stepper, List and Table.
 
 ## Overlays
 
@@ -158,6 +161,297 @@ export function BookingForm() {
 `FormData` then holds `guests`, `checkin` (an ISO date, or an empty string with no date), `budget`
 and `city`. A TagInput adds one entry per tag under the same `name`, and a range Slider adds two.
 
+## Loading states
+
+A page that waits has three jobs: keep its shape, tell a screen reader, and say how long when it
+knows. Skeleton, Progress and Spinner each do one of them. Skeleton is always hidden from screen
+readers, and Progress is not a live region, so the announcement is yours to make.
+
+**The container stays, and its content changes.** Keep the element that holds the data mounted, set
+`aria-busy` on it while the work runs and back to `false` when it ends, and swap the Skeletons for
+the content inside it. Say "loading" once, from a `role="status"` region that is already in the
+page, empty, before the work starts: a screen reader reads what changes in a live region it already
+knows, and does not read one that is inserted with its text.
+
+```tsx
+'use client';
+
+import { useState } from 'react';
+import { Button, Skeleton, SkeletonText } from 'h2d-glass-ui';
+
+export function WeeklyReport() {
+  const [loading, setLoading] = useState(false);
+  // Start the request in `refresh`, and call setLoading(false) when it ends.
+  const refresh = () => setLoading(true);
+  return (
+    <>
+      {/* `sr-only` stands for a visually hidden class of your own. */}
+      <div role="status" className="sr-only">
+        {loading ? 'Loading the weekly report' : ''}
+      </div>
+      <section aria-busy={loading} aria-label="Weekly report">
+        {loading ? (
+          <>
+            <Skeleton shape="text" width="40%" />
+            <SkeletonText lines={2} />
+          </>
+        ) : (
+          <p>1,240 visits, up 8% on last week.</p>
+        )}
+      </section>
+      <Button variant="ghost" onClick={refresh} disabled={loading}>
+        Refresh
+      </Button>
+    </>
+  );
+}
+```
+
+<Canvas of={LoadingStories.Container} />
+
+Put each Skeleton where its content will be, at the same size, so that nothing moves when the
+content arrives. A Suspense `fallback` is inserted already filled, so an announcement from inside it
+is best effort; the `aria-busy` container that stays mounted is the reliable part. The
+[Skeleton](?path=/docs/components-skeleton--docs) page has the shapes and the looks.
+
+**Known progress or an unknown wait.** A `Progress` is for work whose amount you know, such as files
+uploaded: give it a name, and a `getValueText` when the number matters. A `Spinner` is for a short
+wait of unknown length, such as saving a form. It is a `role="status"` region of its own, so mount
+it before the work starts, as above.
+
+```tsx
+import { Progress, Spinner } from 'h2d-glass-ui';
+
+<Progress
+  label="Uploading photos"
+  value={done}
+  max={total}
+  getValueText={(value, max) => `${value} of ${max} photos`}
+  showValue
+/>;
+
+<Spinner label="Saving your changes" />;
+```
+
+<Canvas of={LoadingStories.KnownAndUnknown} />
+
+**Rows that load.** Keep the Table and its heading, and draw Skeleton `text` in the cells, one for
+each column, so the columns do not move. The table carries the `aria-busy`, with the same status
+region beside it:
+
+```tsx
+<div role="status" className="sr-only">
+  {loading ? 'Loading the orders' : ''}
+</div>
+<Table aria-busy={loading}>
+  <TableCaption>Recent orders</TableCaption>
+  {/* The heading stays. */}
+  <TableBody>
+    {loading
+      ? [0, 1].map((row) => (
+          <TableRow key={row}>
+            {[0, 1, 2].map((cell) => (
+              <TableCell key={cell}>
+                <Skeleton shape="text" width={cell === 0 ? 72 : 120} />
+              </TableCell>
+            ))}
+          </TableRow>
+        ))
+      : orders.map((order) => <TableRow key={order.id}>{/* The cells. */}</TableRow>)}
+  </TableBody>
+</Table>
+```
+
+<Canvas of={LoadingStories.TableRows} />
+
+With `prefers-reduced-motion: reduce` the Skeletons and an indeterminate Progress stand still, and a
+Spinner keeps turning, more slowly: see the [Accessibility](?path=/docs/docs-accessibility--docs)
+page.
+
+## Show data
+
+The library draws data; it does not handle it. It does not sort, filter or page: you pass the rows
+in the order and the amount to show, and the components say what you tell them. A Table with
+sorting, chosen rows and pages is the sort, the selection and the page, held in state of your own.
+
+```tsx
+'use client';
+
+import { useState } from 'react';
+import {
+  Checkbox,
+  Pagination,
+  Table,
+  TableBody,
+  TableCaption,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from 'h2d-glass-ui';
+import type { TableSort } from 'h2d-glass-ui';
+
+const PAGE_SIZE = 3;
+
+export function OrdersTable({ orders }: { orders: Order[] }) {
+  const [sort, setSort] = useState<TableSort>('none');
+  const [page, setPage] = useState(1);
+  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
+
+  const sorted =
+    sort === 'none'
+      ? orders
+      : [...orders].sort((a, b) => (sort === 'ascending' ? a.total - b.total : b.total - a.total));
+  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
+  const rows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
+
+  const onPage = rows.filter((order) => chosen.has(order.id)).length;
+  const toggle = (id: string, on: boolean) =>
+    setChosen((before) => {
+      const next = new Set(before);
+      if (on) next.add(id);
+      else next.delete(id);
+      return next;
+    });
+
+  return (
+    <>
+      <Table>
+        <TableCaption>Recent orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            <TableHead>
+              <Checkbox
+                aria-label="Select all"
+                checked={rows.length > 0 && onPage === rows.length}
+                indeterminate={onPage > 0 && onPage < rows.length}
+                onCheckedChange={(on) => rows.forEach((order) => toggle(order.id, on))}
+              />
+            </TableHead>
+            <TableHead>Order</TableHead>
+            <TableHead>Customer</TableHead>
+            <TableHead
+              align="end"
+              sort={sort}
+              onSort={(next) => {
+                setSort(next);
+                setPage(1);
+              }}
+            >
+              Total
+            </TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {rows.length === 0 ? (
+            <TableRow>
+              <TableCell colSpan={4} align="center" style={{ whiteSpace: 'normal' }}>
+                <strong>No orders yet</strong>
+                <br />
+                New orders will show up here.
+              </TableCell>
+            </TableRow>
+          ) : (
+            rows.map((order) => (
+              <TableRow key={order.id} selected={chosen.has(order.id)}>
+                <TableCell>
+                  <Checkbox
+                    aria-label={`Select ${order.id}`}
+                    checked={chosen.has(order.id)}
+                    onCheckedChange={(on) => toggle(order.id, on)}
+                  />
+                </TableCell>
+                <TableCell>{order.id}</TableCell>
+                <TableCell>{order.customer}</TableCell>
+                <TableCell align="end">{order.total.toLocaleString('vi-VN')} ₫</TableCell>
+              </TableRow>
+            ))
+          )}
+        </TableBody>
+      </Table>
+      <Pagination count={pageCount} page={page} onPageChange={setPage} aria-label="Orders pages" />
+    </>
+  );
+}
+```
+
+<Canvas of={DataStories.Orders} />
+
+- **Sorting.** `onSort` makes the title a button and gives you the direction to go to; sort the rows
+  yourself and pass the new `sort`. Only the sorted column carries `aria-sort`.
+- **Choosing rows.** The Checkbox in the row, named for the row, says whether it is chosen;
+  `selected` on the row only draws it. The box in the heading selects all, and is `indeterminate`
+  when only some of the rows are chosen.
+- **Empty.** One row with one cell across every column (`colSpan`), in the middle, allowed to wrap.
+- **Pages.** `Pagination` takes the number of pages and the current one; cutting the rows is yours.
+
+The [Table](?path=/docs/components-table--docs) page has the rest: `stickyHeader`, the footer, the
+three looks and the scroll frame.
+
+**A List for navigation.** A row with an `href` is a link named by its title. `current` marks the
+page the person is on, and `renderLink` hands the link to the `Link` of your router: pass every prop
+on.
+
+```tsx
+import Link from 'next/link';
+import { List, ListItem } from 'h2d-glass-ui';
+
+<nav aria-label="Settings">
+  <List size="sm">
+    <ListItem
+      title="Profile"
+      href="/settings/profile"
+      current={pathname === '/settings/profile'}
+      renderLink={(props) => <Link {...props} />}
+    />
+    <ListItem
+      title="Billing"
+      href="/settings/billing"
+      current={pathname === '/settings/billing'}
+      renderLink={(props) => <Link {...props} />}
+    />
+  </List>
+</nav>;
+```
+
+<Canvas of={DataStories.Navigation} />
+
+Pagination takes `getHref` and `renderLink` in the same way, when its pages are addresses. The
+[List](?path=/docs/components-list--docs) page has the other looks and rows.
+
+**A Stepper with the content of each step.** The Stepper draws the line of steps and nothing else:
+show what the current step holds from the same `value`. Write the `Step`s in the component that
+renders the `Stepper`. A client component that receives `Step`s from a Server Component gets them
+already rendered, and the Stepper cannot read them.
+
+```tsx
+'use client';
+
+import { useState } from 'react';
+import { Button, Step, Stepper } from 'h2d-glass-ui';
+
+export function Checkout() {
+  const [value, setValue] = useState(0);
+  return (
+    <>
+      <Stepper value={value} onValueChange={setValue}>
+        <Step title="Cart" />
+        <Step title="Delivery" />
+        <Step title="Payment" />
+      </Stepper>
+      {value === 0 ? <Button onClick={() => setValue(1)}>Continue to delivery</Button> : null}
+      {value === 1 ? <p>Where should we send it?</p> : null}
+      {value === 2 ? <p>How would you like to pay?</p> : null}
+    </>
+  );
+}
+```
+
+<Canvas of={DataStories.Steps} />
+
+The [Stepper](?path=/docs/components-stepper--docs) page shows the wrong way to write it, and the
+warning it causes.
+
 ## Pick a theme
 
 Without a `data-flg-theme` attribute the library follows the operating system's light or dark
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit src/docs
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
pnpm build-storybook
node -e "const e=Object.values(require('./storybook-static/index.json').entries).filter((x)=>x.type==='story'&&!(x.tags||[]).includes('no-visual'));console.log(e.length)"
```

Expected:
- `lint`, `typecheck`, `format:check` PASS.
- Unit `src/docs`: 2 file, 6 test PASS (`ExceptionTable.test.tsx` 4, `TokenTable.test.tsx` 2).
- Story docs: 24 test PASS ở mỗi project (8 story × ba engine: `Examples/Sign up form` có sẵn và bảy story mới). axe chạy sau play function, không có vi phạm.
- `pnpm build-storybook`: PASS, nên `GettingStarted.mdx` và `Accessibility.mdx` biên dịch được. Lệnh cuối in `116`: cùng số story có ảnh như sau Task 2.
- Không chạy `pnpm build && pnpm check:package`: task này không đổi export hay CSS. Nếu chạy, nó vẫn fail chỉ ở `size` như sau Task 2.
- Task này không đổi file nào của lib, nên ảnh chuẩn của component giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  src/docs/Accessibility.mdx \
  src/docs/GettingStarted.mdx \
  src/docs/LoadingStates.stories.tsx \
  src/docs/ShowData.stories.tsx
```
```bash
git commit -m "docs: add Loading states and Show data to Getting started, and the phase 4 notes to Accessibility" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: Fixtures, changeset `0.3.0` và ngưỡng kích thước của Plan C

Spec §7 ("Fixtures": `next-app`, `vite-app`, kịch bản kiểm tra), §8 ("Phát hành"), §9. Task này kết thúc bằng kiểm tra cuối của cả nhánh.
- **`next-app`:** trang Server Component render thẳng Alert (không có `onDismiss`), Skeleton, SkeletonText, Stepper chỉ hiển thị, List có hàng `href` và hàng `renderLink` dùng `Link` của Next, và Table có các phần server-safe bên trong `Table`. Một client component có Alert đóng được, Progress, List có `onSelect`, Table có `onSort`, và Stepper bấm được với các `Step` viết ngay trong nó (phát hiện 8).
- **`vite-app`:** cùng bộ component, trong client.
- **Kịch bản** trong `scripts/test-fixtures.mjs`: sáu selector mới, kiểm HTML từ server của Next, và hàm `checkDataDisplay` (phát hiện 8). Spec §7 được sửa (phát hiện 10).
- **Fixture chỉ chạy qua bản sao đổi cổng** (Global Constraints), không bao giờ qua `pnpm test:fixtures`.
- **Changeset** `.changeset/phase-4-data-display.md`, `minor` (phát hiện 9).
- **Ngưỡng kích thước** cho cả Plan C, ghi bằng `pnpm size:record` (không chép `.size-limit.json`).

**Files:**
- Create: `fixtures/next-app/app/data-display.tsx`, `fixtures/next-app/app/data-controls.tsx`, `fixtures/vite-app/src/DataDisplay.tsx`, `.changeset/phase-4-data-display.md`
- Modify: `fixtures/next-app/app/page.tsx`, `fixtures/vite-app/src/App.tsx`, `scripts/test-fixtures.mjs`, `docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- `fixtures/next-app/app/data-display.tsx`: Server Component `DataDisplay`, một `<section aria-label="Data display">` có `maxWidth: '100vw'`. Nó chứa Stepper `aria-label="Server progress"`, List `aria-label="Server links"`, một Table có cột `Ship to`, và render `DataControls`. `page.tsx` render `DataDisplay`.
- `fixtures/next-app/app/data-controls.tsx` (`'use client'`): `DataControls`, với Alert `status="warning"` đóng được, Progress, Stepper `aria-label="Client progress"` (bước Details, Review, Confirm, Finish), List `aria-label="Client choices"` (hàng "Open settings", "Open profile" có `onSelect`) cùng `<p data-testid="chosen">`, và Table có cột "Total" sắp được.
- `fixtures/vite-app/src/DataDisplay.tsx`: `DataDisplay`, cùng các tên đó, trong client; `App.tsx` render nó.
- `scripts/test-fixtures.mjs`: `COMPONENTS` thêm `.flg-alert`, `.flg-progress`, `.flg-skeleton`, `.flg-stepper`, `.flg-list`, `.flg-table-frame`; kiểm HTML từ server khi `app.serverRendered`; `checkDataDisplay(page, problems)`, gọi cuối `inspect`.
- `.changeset/phase-4-data-display.md`: `'h2d-glass-ui': minor`.
- `.size-limit.json`: ngưỡng mới JS 51713 B, CSS 14052 B (do `size:record` ghi).
- Consumes: sáu component của giai đoạn 4 từ tarball `h2d-glass-ui` mà script đóng gói, và `Link` của `next/link`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index 4cb6385..87c113b 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -92,6 +92,12 @@ const COMPONENTS = [
   '.flg-file-upload',
   '.flg-calendar',
   '.flg-date-picker',
+  '.flg-alert',
+  '.flg-progress',
+  '.flg-skeleton',
+  '.flg-stepper',
+  '.flg-list',
+  '.flg-table-frame',
 ];
 
 function run(command, args, cwd) {
@@ -216,6 +222,7 @@ async function inspect(page, url, problems) {
   await checkSelects(page, problems);
   await checkNavigation(page, problems);
   await checkInputs(page, problems);
+  await checkDataDisplay(page, problems);
 }
 
 const hasFocus = (locator) => locator.evaluate((el) => el === document.activeElement);
@@ -435,6 +442,63 @@ async function checkInputs(page, problems) {
   }
 }
 
+/** Phase 4: the data display. Its parts take real input, and the Table frame follows the page's width. */
+async function checkDataDisplay(page, problems) {
+  const section = page.getByRole('region', { name: 'Data display' });
+  // Every step of the clickable Stepper is there after hydration.
+  const stepper = section.getByRole('list', { name: 'Client progress' });
+  if ((await stepper.getByRole('listitem').count()) !== 4) {
+    problems.push('the clickable Stepper does not have its four steps after hydration');
+  }
+
+  // Pressing a done step makes it the current one.
+  const details = stepper.getByRole('button', { name: /Details/ });
+  await details.click();
+  if ((await details.getAttribute('aria-current')) !== 'step') {
+    problems.push('pressing a done step did not make it the current step');
+  }
+
+  // Pressing a sort button sorts the column: `aria-sort` appears on it and flips on the next press.
+  const total = section.getByRole('columnheader', { name: 'Total' });
+  await total.getByRole('button').click();
+  if ((await total.getAttribute('aria-sort')) !== 'ascending') {
+    problems.push('pressing the sort button did not set aria-sort="ascending"');
+  }
+  await total.getByRole('button').click();
+  if ((await total.getAttribute('aria-sort')) !== 'descending') {
+    problems.push('pressing the sort button again did not set aria-sort="descending"');
+  }
+
+  // A row of a List with onSelect reports its press.
+  await section.getByRole('button', { name: 'Open profile' }).click();
+  if ((await page.getByTestId('chosen').textContent()) !== 'profile') {
+    problems.push('pressing a List row with onSelect did not call it');
+  }
+
+  // The frame of a table is a plain box while the table fits and a named region once it does not,
+  // and it is judged again when the page changes width.
+  const frames = section.locator('.flg-table-frame');
+  const regions = () => section.locator('.flg-table-frame[role="region"]').count();
+  const frameCount = await frames.count();
+  if ((await regions()) !== 0) problems.push('a table frame is a region while its table fits');
+  await page.setViewportSize({ width: 200, height: 800 });
+  await section
+    .locator('.flg-table-frame[role="region"]')
+    .first()
+    .waitFor({ timeout: 10_000 })
+    .catch(() => undefined);
+  if ((await regions()) !== frameCount) {
+    problems.push('the table frames did not become regions when the page got narrow');
+  }
+  await page.setViewportSize({ width: 1280, height: 720 });
+
+  // The close button removes the Alert. It goes last: the Alert is above the rest of the client
+  // part, and its removal moves them.
+  const alert = section.locator('.flg-alert[data-status="warning"]');
+  await alert.getByRole('button', { name: 'Dismiss', exact: true }).click();
+  if ((await alert.count()) !== 0) problems.push('the close button did not remove the Alert');
+}
+
 async function testApp(name, browser) {
   const app = APPS[name];
   const cwd = join(FIXTURES, app.dir);
@@ -477,6 +541,23 @@ async function testApp(name, browser) {
       ) {
         problems.push(`${label}: the server HTML lacks the Breadcrumb or the open Accordion item`);
       }
+      // Phase 4: the Server Components of the page render the data display into the HTML, and the
+      // Stepper written in a Client Component has every step in it, since it is rendered there too.
+      if (app.serverRendered) {
+        const client =
+          /<ol(?=[^>]*aria-label="Client progress")[\s\S]*?<\/ol>/.exec(html)?.[0] ?? '';
+        const found = {
+          'role="progressbar"': html.includes('role="progressbar"'),
+          '<ol class="flg-stepper"': /<ol[^>]*class="flg-stepper"/.test(html),
+          '<table class="flg-table"': html.includes('<table class="flg-table"'),
+          'every step of the clickable Stepper': ['Details', 'Review', 'Confirm', 'Finish'].every(
+            (title) => client.includes(title),
+          ),
+        };
+        for (const [what, present] of Object.entries(found)) {
+          if (!present) problems.push(`${label}: the server HTML lacks ${what}`);
+        }
+      }
       for (const problem of await checkPage(browser, server.url)) {
         problems.push(`${label}: ${problem}`);
       }
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Kiểm cổng trước. Lệnh này không được in dòng nào (khi đó `grep` trả mã 1, và đó là kết quả mong muốn):

```bash
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
```

Nếu 4179 hay 5179 bận, chọn một cặp khác đang rảnh (không bao giờ 5173, 4173 hay 5174) và sửa lệnh `sed` theo cặp đó. Nếu 3100 hay 3101 bận (script ghim hai cổng đó cho Next), dừng lại và báo cáo; không tắt tiến trình đang giữ chúng.

Run (chỉ fixture Vite, như bản nháp):

```bash
pnpm build
sed -e 's/5173/5179/g' -e 's/4173/4179/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs vite
rm scripts/test-fixtures.tmp.mjs
```

Expected: FAIL, `16 problem(s):`. Ở mỗi bản, `vite (production)` và `vite (development)`, có tám dòng: `missing .flg-alert`, `missing .flg-progress`, `missing .flg-skeleton`, `missing .flg-stepper`, `missing .flg-list`, `missing .flg-table-frame`, `the clickable Stepper does not have its four steps after hydration`, và một dòng hết giờ của `locator.click` (nút "Details" chưa có). Chạy `rm` kể cả khi lệnh `node` fail.

- [ ] **Step 3: Viết code**

```diff
diff --git a/.changeset/phase-4-data-display.md b/.changeset/phase-4-data-display.md
new file mode 100644
index 0000000..05a5235
--- /dev/null
+++ b/.changeset/phase-4-data-display.md
@@ -0,0 +1,26 @@
+---
+'h2d-glass-ui': minor
+---
+
+Phase 4 of the roadmap. Six components for showing data and progress, each in three looks chosen
+with `variant`:
+
+- Alert (with AlertTitle, AlertDescription and AlertActions): `stripe`, `tinted` and `plain`.
+  It shows a close button when it has `onDismiss`.
+- Progress: `thin`, `glow` and `inline`, determinate or indeterminate, with `status`, `showValue`
+  and `getValueText`.
+- Skeleton and SkeletonText: `pulse`, `shimmer` and `glass`.
+- Stepper (with Step): `circles`, `compact` and `bars`, horizontal or vertical. `value` says where
+  the process is; with `onValueChange` the steps that can be reached are buttons.
+- List (with ListItem): `inset`, `cards` and `plain`. A row can be a link (`href`, and `renderLink`
+  for a router's `Link`) or a button (`onSelect`).
+- Table (with TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell and
+  TableCaption): `lined`, `striped` and `minimal`. It sorts nothing itself: `sort` and `onSort`
+  on TableHead show and ask for the direction. The frame scrolls, can keep the heading in view
+  with `stickyHeader`, and becomes a named region a keyboard can reach once the table is wider
+  than its room.
+
+Alert, Skeleton, Stepper and List render in a Server Component, and so do the parts inside a
+Table. Write the Steps of a Stepper in the component that renders the Stepper.
+
+There are no breaking changes.
diff --git a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
index 89cd864..db109c1 100644
--- a/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
+++ b/docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md
@@ -1004,7 +1004,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 - **Fixtures** (Plan C):
   - `next-app`: trang Server Component render thẳng Alert (không có `onDismiss`), Skeleton, SkeletonText, Stepper chỉ hiển thị, List có hàng `href` và hàng `renderLink` với `Link` của Next, Table có các phần server-safe bên trong `Table`. Một client component có Alert đóng được, Progress, List có `onSelect`, Table có `onSort`, và một Stepper bấm được với các `Step` viết ngay trong client component đó (quy tắc ở §6.3; phát hiện khi đọc soát spec).
   - `vite-app`: cùng bộ component trong client.
-  - Kịch bản kiểm tra: HTML từ server có `role="progressbar"`, `<ol class="flg-stepper"`, `<table class="flg-table"`; Stepper bấm được có đủ bước trong HTML từ server và sau khi hydrate; bấm nút sắp đổi `aria-sort`; bấm nút đóng bỏ Alert; bấm bước đã xong đổi bước hiện tại; khung bảng thành `role="region"` khi trang hẹp. Console phải sạch, như các giai đoạn trước.
+  - Kịch bản kiểm tra: HTML từ server có `role="progressbar"`, `<ol role="list" class="flg-stepper"` (thẻ `<ol` của Stepper có `role="list"` trước `class`, nên kịch bản khớp theo `class="flg-stepper"` trong thẻ; phát hiện khi lập Plan C), `<table class="flg-table"`; Stepper bấm được có đủ bước trong HTML từ server và sau khi hydrate; bấm nút sắp đổi `aria-sort`; bấm nút đóng bỏ Alert; bấm bước đã xong đổi bước hiện tại; khung bảng thành `role="region"` khi trang hẹp. Console phải sạch, như các giai đoạn trước.
 
 ---
 
diff --git a/fixtures/next-app/app/data-controls.tsx b/fixtures/next-app/app/data-controls.tsx
new file mode 100644
index 0000000..68d75bd
--- /dev/null
+++ b/fixtures/next-app/app/data-controls.tsx
@@ -0,0 +1,83 @@
+'use client';
+
+// The data display that needs the client: an Alert that can be dismissed, a Progress, a List with
+// onSelect, a Table with onSort and a Stepper whose steps can be pressed. The Steps are written in
+// this component and not handed in by a Server Component: a Step that arrives already rendered
+// cannot be read by the Stepper.
+import {
+  Alert,
+  AlertTitle,
+  List,
+  ListItem,
+  Progress,
+  Step,
+  Stepper,
+  Table,
+  TableBody,
+  TableCaption,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from 'h2d-glass-ui';
+import type { TableSort } from 'h2d-glass-ui';
+import { useState } from 'react';
+
+const ORDERS = [
+  { id: '#2001', total: 300, city: 'Da Nang' },
+  { id: '#2002', total: 120, city: '12 Hang Bong Street, Hoan Kiem' },
+  { id: '#2003', total: 210, city: 'Hue' },
+];
+
+export function DataControls() {
+  const [alertOpen, setAlertOpen] = useState(true);
+  const [step, setStep] = useState(2);
+  const [chosen, setChosen] = useState('none');
+  const [sort, setSort] = useState<TableSort>('none');
+  const rows =
+    sort === 'none'
+      ? ORDERS
+      : [...ORDERS].sort((a, b) => (sort === 'ascending' ? a.total - b.total : b.total - a.total));
+  return (
+    <div style={{ display: 'grid', gap: 12 }}>
+      {alertOpen ? (
+        <Alert status="warning" onDismiss={() => setAlertOpen(false)}>
+          <AlertTitle>Storage is almost full</AlertTitle>
+        </Alert>
+      ) : null}
+      <Progress label="Uploading report" value={45} showValue />
+      <Stepper value={step} onValueChange={setStep} aria-label="Client progress">
+        <Step title="Details" />
+        <Step title="Review" />
+        <Step title="Confirm" />
+        <Step title="Finish" />
+      </Stepper>
+      <List aria-label="Client choices">
+        <ListItem title="Open settings" onSelect={() => setChosen('settings')} />
+        <ListItem title="Open profile" onSelect={() => setChosen('profile')} />
+      </List>
+      <p data-testid="chosen">{chosen}</p>
+      <Table>
+        <TableCaption>Client orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Order</TableHead>
+            <TableHead align="end" sort={sort} onSort={setSort}>
+              Total
+            </TableHead>
+            <TableHead>Ship to</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {rows.map((order) => (
+            <TableRow key={order.id}>
+              <TableCell>{order.id}</TableCell>
+              <TableCell align="end">${order.total}</TableCell>
+              <TableCell style={{ whiteSpace: 'nowrap' }}>{order.city}</TableCell>
+            </TableRow>
+          ))}
+        </TableBody>
+      </Table>
+    </div>
+  );
+}
diff --git a/fixtures/next-app/app/data-display.tsx b/fixtures/next-app/app/data-display.tsx
new file mode 100644
index 0000000..1d2d203
--- /dev/null
+++ b/fixtures/next-app/app/data-display.tsx
@@ -0,0 +1,79 @@
+// A Server Component: the data display of phase 4. Alert (without onDismiss), Skeleton, a Stepper
+// that only shows where a process is, a List whose links are plain and next/link, and a Table whose
+// parts all render on the server. The Stepper's Steps are written here, in the component that
+// renders the Stepper, so that it can read them. The Vite fixture renders the same markup on the
+// client.
+import {
+  Alert,
+  AlertDescription,
+  AlertTitle,
+  Badge,
+  List,
+  ListItem,
+  Skeleton,
+  SkeletonText,
+  Step,
+  Stepper,
+  Table,
+  TableBody,
+  TableCaption,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from 'h2d-glass-ui';
+import Link from 'next/link';
+import { DataControls } from './data-controls';
+
+export function DataDisplay() {
+  // The width follows the window, not the widest part of the page: the tables must see it narrow.
+  return (
+    <section aria-label="Data display" style={{ display: 'grid', gap: 12, maxWidth: '100vw' }}>
+      <Alert status="success">
+        <AlertTitle>Backup finished</AlertTitle>
+        <AlertDescription>The last copy is from this morning.</AlertDescription>
+      </Alert>
+      <div aria-busy="true" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
+        <Skeleton shape="circle" size={40} />
+        <SkeletonText lines={2} />
+      </div>
+      <Stepper value={1} aria-label="Server progress">
+        <Step title="Account" />
+        <Step title="Plan" description="Pick one" />
+        <Step title="Payment" />
+      </Stepper>
+      <List aria-label="Server links">
+        <ListItem title="Plain link" href="#plain-link" end={<Badge>New</Badge>} />
+        <ListItem
+          title="Router link"
+          description="Through next/link"
+          href="#router-link"
+          renderLink={(props) => <Link {...props} />}
+        />
+      </List>
+      <Table>
+        <TableCaption>Server orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Order</TableHead>
+            <TableHead align="end">Amount</TableHead>
+            <TableHead>Ship to</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          <TableRow>
+            <TableCell>#1042</TableCell>
+            <TableCell align="end">$120</TableCell>
+            <TableCell style={{ whiteSpace: 'nowrap' }}>12 Hang Bong Street, Hoan Kiem</TableCell>
+          </TableRow>
+          <TableRow>
+            <TableCell>#1043</TableCell>
+            <TableCell align="end">$75</TableCell>
+            <TableCell style={{ whiteSpace: 'nowrap' }}>3 Le Loi, Hue</TableCell>
+          </TableRow>
+        </TableBody>
+      </Table>
+      <DataControls />
+    </section>
+  );
+}
diff --git a/fixtures/next-app/app/page.tsx b/fixtures/next-app/app/page.tsx
index f43cafd..3186e5f 100644
--- a/fixtures/next-app/app/page.tsx
+++ b/fixtures/next-app/app/page.tsx
@@ -23,6 +23,7 @@ import {
   Textarea,
 } from 'h2d-glass-ui';
 import { ClientControls } from './client-controls';
+import { DataDisplay } from './data-display';
 import { Inputs } from './inputs';
 import { Menus } from './menus';
 import { Navigation } from './navigation';
@@ -77,6 +78,7 @@ export default function Page() {
       <Selects />
       <Navigation />
       <Inputs />
+      <DataDisplay />
     </main>
   );
 }
diff --git a/fixtures/vite-app/src/App.tsx b/fixtures/vite-app/src/App.tsx
index 82a0cbc..a957b15 100644
--- a/fixtures/vite-app/src/App.tsx
+++ b/fixtures/vite-app/src/App.tsx
@@ -23,6 +23,7 @@ import {
   Toaster,
 } from 'h2d-glass-ui';
 import { useEffect, useState } from 'react';
+import { DataDisplay } from './DataDisplay';
 import { Inputs } from './Inputs';
 import { Menus } from './Menus';
 import { Navigation } from './Navigation';
@@ -101,6 +102,7 @@ export function App() {
       <Selects />
       <Navigation />
       <Inputs />
+      <DataDisplay />
     </main>
   );
 }
diff --git a/fixtures/vite-app/src/DataDisplay.tsx b/fixtures/vite-app/src/DataDisplay.tsx
new file mode 100644
index 0000000..1c4804b
--- /dev/null
+++ b/fixtures/vite-app/src/DataDisplay.tsx
@@ -0,0 +1,129 @@
+// The data display of phase 4: Alert, Skeleton, Stepper, List, Progress and Table, rendered on the
+// client. The Next.js fixture renders the same markup with the server-safe parts in a Server
+// Component. The Steps are written in the component that renders the Stepper.
+import {
+  Alert,
+  AlertDescription,
+  AlertTitle,
+  Badge,
+  List,
+  ListItem,
+  Progress,
+  Skeleton,
+  SkeletonText,
+  Step,
+  Stepper,
+  Table,
+  TableBody,
+  TableCaption,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from 'h2d-glass-ui';
+import type { TableSort } from 'h2d-glass-ui';
+import { useState } from 'react';
+
+const ORDERS = [
+  { id: '#2001', total: 300, city: 'Da Nang' },
+  { id: '#2002', total: 120, city: '12 Hang Bong Street, Hoan Kiem' },
+  { id: '#2003', total: 210, city: 'Hue' },
+];
+
+export function DataDisplay() {
+  const [alertOpen, setAlertOpen] = useState(true);
+  const [step, setStep] = useState(2);
+  const [chosen, setChosen] = useState('none');
+  const [sort, setSort] = useState<TableSort>('none');
+  const rows =
+    sort === 'none'
+      ? ORDERS
+      : [...ORDERS].sort((a, b) => (sort === 'ascending' ? a.total - b.total : b.total - a.total));
+  // The width follows the window, not the widest part of the page: the tables must see it narrow.
+  return (
+    <section aria-label="Data display" style={{ display: 'grid', gap: 12, maxWidth: '100vw' }}>
+      <Alert status="success">
+        <AlertTitle>Backup finished</AlertTitle>
+        <AlertDescription>The last copy is from this morning.</AlertDescription>
+      </Alert>
+      <div aria-busy="true" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
+        <Skeleton shape="circle" size={40} />
+        <SkeletonText lines={2} />
+      </div>
+      <Stepper value={1} aria-label="Server progress">
+        <Step title="Account" />
+        <Step title="Plan" description="Pick one" />
+        <Step title="Payment" />
+      </Stepper>
+      <List aria-label="Server links">
+        <ListItem title="Plain link" href="#plain-link" end={<Badge>New</Badge>} />
+        <ListItem
+          title="Router link"
+          description="Through renderLink"
+          href="#router-link"
+          renderLink={({ children, ...props }) => <a {...props}>{children}</a>}
+        />
+      </List>
+      <Table>
+        <TableCaption>Server orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Order</TableHead>
+            <TableHead align="end">Amount</TableHead>
+            <TableHead>Ship to</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          <TableRow>
+            <TableCell>#1042</TableCell>
+            <TableCell align="end">$120</TableCell>
+            <TableCell style={{ whiteSpace: 'nowrap' }}>12 Hang Bong Street, Hoan Kiem</TableCell>
+          </TableRow>
+          <TableRow>
+            <TableCell>#1043</TableCell>
+            <TableCell align="end">$75</TableCell>
+            <TableCell style={{ whiteSpace: 'nowrap' }}>3 Le Loi, Hue</TableCell>
+          </TableRow>
+        </TableBody>
+      </Table>
+      {alertOpen ? (
+        <Alert status="warning" onDismiss={() => setAlertOpen(false)}>
+          <AlertTitle>Storage is almost full</AlertTitle>
+        </Alert>
+      ) : null}
+      <Progress label="Uploading report" value={45} showValue />
+      <Stepper value={step} onValueChange={setStep} aria-label="Client progress">
+        <Step title="Details" />
+        <Step title="Review" />
+        <Step title="Confirm" />
+        <Step title="Finish" />
+      </Stepper>
+      <List aria-label="Client choices">
+        <ListItem title="Open settings" onSelect={() => setChosen('settings')} />
+        <ListItem title="Open profile" onSelect={() => setChosen('profile')} />
+      </List>
+      <p data-testid="chosen">{chosen}</p>
+      <Table>
+        <TableCaption>Client orders</TableCaption>
+        <TableHeader>
+          <TableRow>
+            <TableHead>Order</TableHead>
+            <TableHead align="end" sort={sort} onSort={setSort}>
+              Total
+            </TableHead>
+            <TableHead>Ship to</TableHead>
+          </TableRow>
+        </TableHeader>
+        <TableBody>
+          {rows.map((order) => (
+            <TableRow key={order.id}>
+              <TableCell>{order.id}</TableCell>
+              <TableCell align="end">${order.total}</TableCell>
+              <TableCell style={{ whiteSpace: 'nowrap' }}>{order.city}</TableCell>
+            </TableRow>
+          ))}
+        </TableBody>
+      </Table>
+    </section>
+  );
+}
```

Build, rồi kiểm tra gói trước khi ghi ngưỡng:

```bash
pnpm gen:theme
pnpm build
pnpm check:package
```

Expected: FAIL chỉ ở bước `size`: CSS 12.77 kB trên ngưỡng 12.66 kB; JS 47.01 kB trên 50.77 kB, còn chỗ. Các bước trước đó pass.

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm size:record
```

Expected: ngưỡng mới gần JS 51713 B, CSS 14052 B (trước: 50772 B, 12656 B), là kết quả ở bản nháp; ngưỡng là số đo cộng 10%. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm build && pnpm check:package
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
sed -e 's/5173/5179/g' -e 's/4173/4179/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
```

Expected:
- `lint`, `typecheck`, `format:check` PASS. ESLint đọc cả mã nguồn của fixture (bản nháp bị nó bắt `jsx-a11y/anchor-has-content`, phát hiện 8); script fixture tự chạy `npm run typecheck` của Vite và `next build`.
- `check:package` PASS với ngưỡng mới: JS 47.01 kB trên 51.71 kB, CSS 12.77 kB trên 14.05 kB.
- Hai lệnh `netstat` không in dòng nào (`grep` trả mã 1): cổng rảnh trước khi chạy, và không server nào chạy sót sau đó. Nếu lệnh đầu in một dòng, đổi cặp cổng như Step 2. Nếu lệnh sau in một dòng, chỉ tắt tiến trình đó khi chính lần chạy này đã mở nó.
- Fixture: `Fixtures OK: vite, next.`, sau bản production và development của mỗi app. Console sạch, không có cảnh báo của lib trong output của server. Chạy `rm` kể cả khi lệnh `node` fail; bản sao không bao giờ được commit.
- Task này không đổi file nào trong `src/`, nên unit, story và ảnh chuẩn không đổi.

Kiểm tra cuối của cả nhánh, như bản nháp chạy ở `80df9f4` (cùng code với `48243b9`):

```bash
pnpm gen:theme
pnpm check:name
npx tsc --noEmit -p .
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm build-storybook
node -e "const e=Object.values(require('./storybook-static/index.json').entries).filter((x)=>x.type==='story'&&!(x.tags||[]).includes('no-visual'));console.log(e.length);console.log(e.filter((x)=>x.id.startsWith('components-table--')).map((x)=>x.id).join(' '))"
```

Expected:
- `pnpm check:name`: PASS, không có tên cũ ngoài `docs/superpowers`.
- `npx tsc --noEmit -p .`: PASS.
- `pnpm test:unit`: 3443 test PASS, 3 skip (172 file).
- `pnpm check:contrast`: PASS, với dòng 23 đến 34 là `known-exception`.
- `pnpm check:package`: PASS với ngưỡng của Step 3.
- `pnpm build-storybook`: PASS. Lệnh không mở cổng nào; thư mục `storybook-static` bị git bỏ qua.
- Lệnh `node` in `116`, rồi `components-table--lined components-table--lined-small-focus components-table--striped components-table--minimal components-table--striped-small-focus components-table--minimal-small-focus components-table--sticky-header`: bảy story giao diện, 56 ảnh chuẩn mới, như mô tả PR phải nêu (phát hiện 14).
- Story của table và docs đã chạy ở task của chúng. Không chạy cả bộ story một lượt; CI chạy cả bộ.

- [ ] **Step 5: Commit**

```bash
git add \
  .changeset/phase-4-data-display.md \
  .size-limit.json \
  docs/superpowers/specs/2026-11-06-h2d-glass-ui-phase-4-design.md \
  fixtures/next-app/app/data-controls.tsx \
  fixtures/next-app/app/data-display.tsx \
  fixtures/next-app/app/page.tsx \
  fixtures/vite-app/src/App.tsx \
  fixtures/vite-app/src/DataDisplay.tsx \
  scripts/test-fixtures.mjs
```
```bash
git commit -m "feat(fixtures): add the phase 4 components to both fixtures, the 0.3.0 changeset and the size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines": 56 ảnh mới của bảy story nhìn (Phạm vi). Xem ảnh trước khi xin review:
  - khớp mockup t1–t3 ở chế độ `normal`, kể cả hàng được rê chuột (qua `data-visual-hover`), focus trên nút sắp xếp ở bảng `md` và bảng `sm`, và trạng thái rỗng;
  - `StickyHeader`: nền của tiêu đề dính (chủ dự án duyệt khi xem, spec §4.3);
  - contrast-more: hàng đã chọn có khung 2px, `striped` có đường kẻ thay sọc, hàng không đổi nền khi hover;
  - forced colors: outline của control trong khung `lined` vẽ vào trong;
  - ảnh cũ của mọi component khác không đổi.
- Mô tả PR nêu cho chủ dự án: §4.9 dòng 32–34 kèm số đo; các dòng spec sửa; các quyết định Claude tự chốt và các mục để lại; luồng phát hành (merge PR này thì workflow Release mở PR "Version Packages" cho `0.3.0`; chủ dự án merge PR đó mới publish).

### Đã thực thi (2026-11-09)

- Bốn commit của nhánh nháp được cherry-pick lên `feat/phase-4-plan-c` (`2aa20e6`, `f5c50f1`, `a4b1e94`, `9b0d741`). Cây giống hệt đầu nhánh nháp (`48243b9`), cộng file plan.
- Mỗi task có một reviewer riêng (bốn reviewer chạy song song, chỉ đọc). Cả bốn: Approved. Task 2 có một mục Important: quy tắc `top: -6px` của tiêu đề dính trong khung có padding bị viết hai lần, lần đầu với comment hỏng chữ; xoá ở `40ce55b`. Lần ngắt dòng MDX của Claude ở bản nháp đã cắt đôi một đoạn code inline trong `Table.mdx`; nối lại ở `3896e8f`.
- Review toàn nhánh trên Opus, dùng 29 góp ý của chủ dự án ở PR #27 và #28 làm lăng kính: "With fixes" (3 Important, 13 Minor), mỗi mục Important được kiểm bằng trang thử ở Chromium, Firefox và WebKit. Sửa trong một đợt, mỗi mục một commit (`e5a0eb1`..`d9c9bc6`):
  - **`z-index` của tiêu đề dính lọt ra ngoài khung:** tiêu đề bảng đè lên header dính của trang có `z-index` thấp. Khung có `isolation: isolate` (`e5a0eb1`, story `StickyHeaderUnderPageHeader`).
  - **Tiêu đề dính che control đang có focus** khi Shift+Tab lên một hàng đã cuộn khuất (WCAG 2.4.11): khung có `scroll-padding-top` bằng một cận trên của chiều cao tiêu đề, tính từ biến cỡ, không thêm JS (`278c659`, story `StickyHeaderKeepsFocusInView`; WebKit không cuộn khung theo focus nên story chỉ khẳng định ở Chromium và Firefox).
  - **Công thức "Loading states" tắt chính nút đã bấm**, focus rơi về `<body>`: dùng `loading` của Button (`e931bec`).
  - Minor sửa luôn: `mergeRefs` của Table chỉ tạo một lần (`4aada7e`); `useScrollable` bỏ qua 1px làm tròn của WebKit (`90b01a9`); vòng focus của Switch và Radio trong khung `lined` cũng vẽ vào trong (`79cbc63`); `TableCell` trong `TableHeader` được coi là ô tiêu đề, kể cả khi dính và ở forced colors (`bad5c60`); câu chữ, mẫu code và story của Table (`aae3792`); "Show data" nói ô tiêu đề chọn mọi hàng của trang (`6c37b9b`); trang Accessibility nêu ba cách đặt tên bảng (`39dc169`); changeset nhắc bản sửa `labels` của giai đoạn 4 (`d9c9bc6`).
  - Các dòng spec sửa, đánh dấu "(phát hiện khi review cuối Plan C)": §4.3 và §4.5 (các control vẽ vòng focus vào trong khung `lined`), §7 dòng lớp 2.
  - Lần review lại: cả 16 mục đã xử lý, không có lỗi mới. Ghi chú ngoài phạm vi ("Select all" ở mẫu "Choosing rows" của `Table.mdx`) giữ nguyên: mẫu đó không phân trang, nên ô tiêu đề chọn đúng mọi hàng.
- **Quyết định Claude tự chốt khi thực thi** (chủ dự án có thể đảo lại):
  - `scroll-padding-top` là cận trên tính từ biến cỡ, không đo: tiêu đề xuống hai dòng sẽ cao hơn nó.
  - Switch và Radio được thêm vào các control vẽ vòng focus vào trong khung `lined` (spec sửa theo).
  - Changeset nhắc bản sửa `labels` truyền `undefined`/`null` của NumberInput và Toaster.
- **Để lại** (ghi trong mô tả PR), ngoài các mục ở phần phát hiện: hai đầu vuông của hàng đã chọn `striped` ở Firefox khi một control trong hàng có focus; WebKit không cuộn khung theo focus; Safari thật, VoiceOver và NVDA chưa thử.
- Kiểm tra trên `d9c9bc6`:
  - gen:theme, lint, typecheck, format, `tsc --noEmit -p .`, `check:name`, `check:contrast`, build, `check:package` (gồm `check:rsc`) và build Storybook đều đạt;
  - unit: 172 file, 3449 passed, 3 skipped;
  - kích thước: JS 46,99 kB (giới hạn 51,71 kB), CSS 12,81 kB (giới hạn 14,05 kB);
  - story, từng thư mục và từng theme một, ba engine: table 69 + 69, docs 24 + 24; switch 9 + 9 và radio-group 12 + 12 do người sửa chạy;
  - fixtures đã qua ở bản nháp (Task 4, bản sao đổi cổng); đợt sửa không đổi fixture, CI chạy lại.

### Review của chủ dự án trên PR #29 (2026-11-09)

- CI đầu tiên trên `cce421d` đỏ ở job `stories`: `FocusRingsInPaddedFrame`, "minimal sm, default: the ring shows above the button", ở Firefox và WebKit trên Linux. Vòng focus mặc định (vạch 3px với 18% của màu nhấn) chỉ đổi điểm ảnh 8–12 mỗi kênh ở đó, dưới ngưỡng 25 của phép kiểm; không có vòng thì điểm ảnh không đổi. Ngưỡng hạ xuống 4 ở `dedbafe`; kiểm tra hình học (vòng nằm trong mép padding) không đổi.
- Chủ dự án để lại 10 góp ý. Claude kiểm từng góp ý trong code, cả 10 đều đúng; một đợt sửa (sonnet), mỗi mục một commit (`7f5f108`..`2677b78`):
  - **#1, #6:** `<thead>` dính thành một khối thay cho từng ô, nên tiêu đề hai hàng giữ thứ tự (kiểm ở ba engine); `scroll-padding-top` lấy chiều cao đo được của `<thead>` (`--flg-table-head-height`, chỉ khi có `stickyHeader`), nên tiêu đề có `IconButton` hay hai hàng cũng không che control có focus (`7f5f108`). Ở `striped`, các ô của hàng tiêu đề sau hàng đầu phủ khe `border-spacing` bằng bóng 2px. Còn lại: WebKit tính 2px `border-spacing` phía trên hàng đầu vào `<thead>`, nên khi tiêu đề `striped` đã dính, một dải 2px phía trên để lộ các hàng ở Safari; phủ nó bằng bóng thì dải đó đặc cả khi chưa cuộn, đổi hình đã duyệt, nên để nguyên và nêu trong mô tả PR.
  - **#2:** `TableHead` không đặt `scope` nếu không được truyền; trình duyệt tự quyết theo vị trí ô (`7a5fd01`).
  - **#3:** khung giữ `role`, `tabIndex` và tên khi đang có focus, kể cả khi bảng hết tràn; bỏ khi mất focus (`d04c822`).
  - **#4:** không có `onSort` thì `sort="none"` chỉ là chữ, không có chevron (`20560b9`).
  - **#5:** story "Loading states" tự kết thúc request giả, không chạy đua với hẹn giờ (`79e021e`).
  - **#7:** `hidden`, `dir`, `lang` gắn vào khung; JSDoc và docs nói phần tử nào nhận prop nào (`2e1a312`).
  - **#9:** `TableCaption` chỉ đặt tên cho khung khi `<table>` của nó là bảng của chính Table; id của nó có sau lần layout đầu (`bccaac2`).
  - **#10:** bỏ `captionRef`, kiểm tra tên đọc state; cảnh báo vẫn gợi ý `TableCaption` (`c1298cc`, `2677b78`).
  - **#8** (cạnh vật lý khi viết từ phải sang trái): không sửa. Spec §2 đặt RTL ngoài phạm vi của cả thư viện, và Alert, List, Stepper cũng vẽ cạnh vật lý; để cho một đợt RTL riêng.
- Các dòng spec sửa, đánh dấu "(phát hiện khi review PR #29)": §4.3 `stickyHeader`, §5 cảnh báo của Table, §6.1 và §6.3 (`scope`, `sort="none"`, phần tử nhận `hidden`/`dir`/`lang`).
- Ảnh chuẩn: không ảnh nào cần đổi; probe Chromium cho thấy hộp các ô tiêu đề của `StickyHeader` không xê dịch, điểm ảnh khác nhiều nhất 2/255 ở chữ. CI so lại 56 ảnh.
