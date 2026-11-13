# h2d-glass-ui — Thiết kế giai đoạn 6 (Kbd, Dialog kéo được, DataGrid)

> Liên kết tới các spec trước giữ tên file cũ (`fl-glass-ui`), để các plan đã thực thi vẫn trỏ đúng.

- **Ngày:** 2026-11-13
- **Trạng thái:** Đã duyệt (2026-11-13), kể cả các dòng 37–43 của §4.9
- **Phạm vi spec này:** Giai đoạn 6: component `Kbd` cùng bộ định dạng phím dùng chung (`MenuShortcut keys`, gợi ý phím của `SearchField`), `DialogContent movable` và `fullScreenOnPhone`, component `DataGrid` (đo theo DevExtreme DataGrid) cùng engine dữ liệu của nó, và bản phát hành `0.5.0`.
- **Spec trước:** [`2026-10-01-fl-glass-ui-phase-0-1-design.md`](2026-10-01-fl-glass-ui-phase-0-1-design.md) ("spec 0+1"), [`2026-10-05-fl-glass-ui-phase-2-design.md`](2026-10-05-fl-glass-ui-phase-2-design.md) ("spec giai đoạn 2"), [`2026-11-02-fl-glass-ui-phase-3-design.md`](2026-11-02-fl-glass-ui-phase-3-design.md) ("spec giai đoạn 3"), [`2026-11-06-h2d-glass-ui-phase-4-design.md`](2026-11-06-h2d-glass-ui-phase-4-design.md) ("spec giai đoạn 4") và [`2026-11-10-h2d-glass-ui-phase-5-design.md`](2026-11-10-h2d-glass-ui-phase-5-design.md) ("spec giai đoạn 5"). Mọi quy ước ở năm spec đó vẫn áp dụng, trừ chỗ spec này ghi rõ là thay thế.

---

## 1. Bối cảnh và mục tiêu

Giai đoạn 5 đã phát hành thành `0.4.0` (`main` ở `b9bb9ca`). Ngày 2026-11-13 chủ dự án nói: "Vậy cần bổ sung Kbd, dialog cần có lựa chọn cho phép drag được, table thì cần thêm nhiều tính năng hơn nữa để phục vụ sorting, grouping, filtering, drag hay resize column cũng như cơ chế hỗ trợ insert và update inline hay popup,...", và khi được hỏi thì trả lời: "cứ làm đi. đầy đủ được như devexpress datagrid thì càng tốt". Thước đo phạm vi vì vậy là DevExtreme DataGrid: đủ các nhóm tính năng chính của nó cho một app nghiệp vụ; phần không làm nằm ở "Ngoài phạm vi" (§2) kèm lý do.

Các ràng buộc của giai đoạn 1–5 giữ nguyên, spec này không nhắc lại:

- Mốc trình duyệt Safari/iOS 17.4 (spec giai đoạn 2 §3.1).
- Không thư viện headless; dependency lúc chạy chỉ có `clsx` và `@floating-ui/dom` (spec 0+1 §1, spec giai đoạn 2 §3.2). Giai đoạn 6 không thêm dependency lúc chạy nào: không TanStack Table, không AG Grid, không thư viện ảo hoá hay kéo thả.
- Theme mặc định đúng tuyệt đối mockup đã duyệt; tương phản AA bảo đảm ở các chế độ người dùng bật (spec 0+1 §1, §4.6, §4.9).
- Quy tắc React Server Components (spec 0+1 §6.2, spec giai đoạn 2 §3.6, spec giai đoạn 3 §3.7, spec giai đoạn 4 §3.1, spec giai đoạn 5 §3.1).
- Dùng sai thì `devWarn`, không bao giờ throw (spec 0+1 §5).
- Chữ mặc định bằng tiếng Anh, ghi đè qua prop `labels`; khoá cần chèn giá trị là hàm (spec giai đoạn 3 §6.1).
- Forced colors (spec 0+1 §4.6, spec giai đoạn 2 §4.5) và giảm chuyển động (spec 0+1 §4.6, spec giai đoạn 4 §3.3).
- **Không hỗ trợ viết từ phải sang trái** (chủ dự án, 2026-11-09): cột ghim, tay nắm, phím ←/→ dùng hướng vật lý.

**Ai quyết định gì.** Chủ dự án bỏ qua các câu hỏi thiết kế, nên mọi quyết định về phạm vi, hành vi và API là của Claude ("Claude chốt"), ghi ở `.superpowers/spec/decisions.md` và chi tiết hoá ở đây. Giao diện do chủ dự án chọn qua mockup ngày 2026-11-13: "như đề xuất", tức **K1 D2 G1 C1 F1 R1 E2 EF1**, mỗi câu một phương án, nên giai đoạn này **không có prop giao diện mới** (khác giai đoạn 4 và 5). Chỗ ghi "(Claude chốt)" là chỗ chủ dự án nên đọc kỹ, nhất là chỗ đổi so với bản quyết định vì code, nền tảng hay chính mockup đã duyệt không cho làm đúng như vậy.

### Các điểm Claude chốt chủ dự án nên đọc

| Chủ đề | Quyết định |
|---|---|
| **Tương phản: cần duyệt** | Bảy điểm dưới ngưỡng ở theme mặc định, đúng như mockup, thành dòng **37–43** của §4.9: chữ của `Kbd` (dark 3.23), vạch đổi độ rộng cột (2.78 / 2.02), khung focus của ô (2.45 / 1.86), chữ mờ trên dải hàng nhóm (4.33 / 3.53), khung nét đứt của ô đã sửa (2.69 / 2.11), chữ và Badge trên nền nhấn 12% của dòng mới và ô đã sửa (3.04 / 3.44), chữ và Badge của dòng chờ xoá (2.71 / 2.83). Cả bảy đạt ở `prefers-contrast: more` (§4.4) |
| Phím | Một bộ định dạng nội bộ cho `Kbd`, `MenuShortcut keys` và gợi ý phím của `SearchField`. Ngữ pháp `mod+shift+k`, giữ thứ tự người viết (không sắp lại theo thứ tự của Apple). Trên Apple: ký hiệu, không dấu ngăn; nơi khác: chữ, cách nhau một khoảng `.3em` của CSS. Giữa hai phím có chữ ẩn "+" để trình đọc màn hình đọc "Command plus K", ký hiệu có tên ẩn. `Kbd` là server-safe; phần biết nền tảng là một component con client (§3.3, §6.3) |
| Dialog kéo được | Kéo bằng header (cả chuột, bút, chạm), kẹp cả hộp thoại trong viewport chừa 16px, mỗi lần mở bắt đầu ở giữa, bấm đúp header về giữa, dưới 640px tắt hẳn. Panel không bao giờ cao hơn khung (đã có `max-height: 100%`), nên quy tắc "giữ header trong viewport" của bản quyết định không xảy ra: luôn kẹp cả panel (Claude chốt, §3.4). Không có thao tác di chuyển bằng bàn phím, lý do theo WCAG 2.5.7 ở §3.4 |
| Dialog toàn màn hình | Prop mới `DialogContent fullScreenOnPhone` (dưới 640px), đúng hình điện thoại của EF1; làm ở plan F, nơi popup sửa dữ liệu cần nó (§6.3) |
| Popup sửa dữ liệu không kéo được mặc định | Bản quyết định ghi popup `movable` trên màn rộng, nhưng mockup EF1 đã duyệt vẽ Dialog không có tay nắm D2. Mockup thắng: `editing.popup.movable` mặc định `false`, bật được (Claude chốt, §6.3 DataGrid) |
| DataGrid là component mới | Đứng cạnh `Table`, tự viết, dùng lại lớp CSS và ba `variant` của `Table`. Engine dữ liệu là hàm thuần trong `data-grid/engine/`. `DataGrid` chỉ được export ở plan G; story của nó ẩn khỏi trang docs tới lúc đó (§2, §8) |
| ARIA của grid | `<table role="grid">`, thành `treegrid` khi có nhóm. `aria-rowcount`/`aria-rowindex` **chỉ khi cuộn ảo**; **không** dùng `aria-colcount`/`aria-colindex`, vì mọi cột đang hiện đều có trong DOM và cột ẩn không còn là cột của grid (đổi so với bản quyết định; Claude chốt, §3.6). `aria-expanded` của dòng có chi tiết nằm trên nút mở chi tiết, không trên dòng (dòng `aria-expanded` nghĩa là có dòng con trong cây; đúng như mockup R1). Mở/đóng nhóm không có thông báo live riêng: `aria-expanded` của hàng đang có focus đã được đọc |
| Mọi thao tác kéo có đường bàn phím | Đổi thứ tự cột `mod+Shift+←/→`, đổi độ rộng `Alt+Shift+←/→`, đổi thứ tự dòng `mod+Shift+↑/↓`, đổi cấp nhóm `mod+Shift+←/→` trên chip. Ghim và nhóm không có tổ hợp riêng: đường bàn phím là `Alt+↓` mở menu cột rồi chọn mục (hai phím), vì không còn tổ hợp nào an toàn trên mọi trình duyệt (Firefox `Ctrl+Shift+P` mở cửa sổ riêng tư, `Ctrl+Shift+G` tìm lùi…) (Claude chốt, §3.8) |
| Trạng thái nhóm | `grouping` là mảng `{ field, direction }`, không phải mảng tên cột như bản quyết định, vì chip của thanh nhóm R1 đổi được chiều sắp xếp của cấp đó và chiều đó phải nằm trong trạng thái để lưu được (Claude chốt) |
| Tên cột ghim | Prop của cột là `pinned`, không phải `fixed` như bản quyết định, để trùng tên với `columnLayout.pinned` của trạng thái (Claude chốt) |
| Chip thanh nhóm | Không có tay nắm sáu chấm: mockup R1 đã duyệt vẽ chip xám không tay nắm, dù ghi chú D2 nói "dùng cho chip thanh nhóm". Chip vẫn kéo được bằng cả thân chip. Sáu chấm D2 dùng cho Dialog và tay nắm kéo dòng (Claude chốt) |
| Nút Sửa / Xoá | Đúng từng mockup: ở chế độ `row`, `cell`, `batch` hiện khi hover hay khi dòng có focus, luôn hiện ở `(hover: none)` (E2); ở chế độ `form` và `popup` luôn hiện (EF1) (Claude chốt, sau builder check). Ẩn bằng `opacity: 0`, không `visibility`, để trình đọc màn hình vẫn thấy chúng khi duyệt bảng |
| Chiều cao dòng | Cố định theo `density` cho cả grid, ô không có padding dọc (cần cho cuộn ảo). Chuẩn: dòng dữ liệu 41px như G1, hàng nhóm 33px như R1; grid có cột thao tác (sửa/xoá) thì dòng dữ liệu cao 45px như E2 và EF1, vì nút 28px là nội dung cao nhất. Nhờ vậy cả ba mockup đều đúng từng pixel (Claude chốt, sau builder check; §4.3) |
| Cột ghim | Nền **đặc hoàn toàn** chỉ khi đã cuộn ngang, bằng token mới `--flg-data-grid-pin-bg` (bản không trong suốt của `--flg-glass-tint-solid`); header dính của grid cũng nằm trên nền đặc này. `Table` giữ nguyên (§4.2) |
| Lọc | Hàng lọc và lọc ở header trên cùng một cột là hai điều kiện độc lập, cộng bằng "và", không phản chiếu nhau. So khớp chuỗi không phân biệt hoa thường và dấu (cả "đ"). Phần khớp trong một dòng đang chọn chỉ còn chữ đậm (nền nhấn chồng lên nền nhấn, 1.13:1), không thêm màu mới (§4.3 F1) |
| Tổng và trang | Tổng cuối bảng tính trên mọi dòng sau lọc, không chỉ trang hiện tại. Phân trang khi có nhóm đếm cả hàng nhóm (như DevExtreme), nhóm bị cắt ngang trang được lặp tiêu đề kèm "(continued)" |
| Cuộn ảo và chiều cao thay đổi | Dòng dữ liệu và hàng nhóm có chiều cao cố định; form EF1 (một dòng đo được) được tính vào; master-detail tắt cuộn ảo (`devWarn`). Dòng đang có focus luôn được render để focus không rơi về `<body>` khi cuộn (§3.7) |
| Thay đổi ở component cũ | `MenuShortcut keys`; `SearchField` lấy chữ gợi ý từ bộ định dạng chung (không đổi pixel nào); `DialogContent movable` và `fullScreenOnPhone`, `DialogHeader` thêm lớp `flg-dialog-header`; `ArrowIcon` thêm hướng `right`; icon mới. `Table`, `Pagination`, `Checkbox` (đã có `indeterminate`), `Select`, `Combobox`, `Input`, `NumberInput`, `DatePicker`, `Tooltip`, `Popover` không đổi (§5) |
| Kiểm thử | Harness visual nhận `data-visual-drag` để chụp trạng thái đang kéo bằng chuột thật (§7). Ảnh chuẩn mới khoảng 340 ảnh qua bảy plan |
| Phát hành | Một changeset `minor` cho `0.5.0` ở plan G. Chủ dự án vẫn là người publish |

---

## 2. Phạm vi và chia plan

| Plan | Nội dung | Phụ thuộc |
|---|---|---|
| **A** | Primitive: `shortcut-format.ts`, `use-pointer-drag.ts` (§5); icon `GripIcon`. Harness visual: `data-visual-drag`. **Kbd** (K1); `MenuShortcut keys`; `SearchField` dùng bộ định dạng chung. **`DialogContent movable`** (D2), token `--flg-dialog-lift-shadow` | — |
| **B** | **DataGrid lõi**: engine (giá trị, định dạng, sắp xếp, phân trang, làm phẳng, cuộn ảo, pipeline), cột và hiển thị theo `dataType`, `caption`, `density`, `variant`, `<colgroup>` và cột co giãn, header dính, focus và bàn phím (mẫu grid), sắp xếp một và nhiều cột, chọn dòng, thanh phân trang, cuộn ảo, đang tải, trống, chế độ server cho sắp xếp và phân trang, `DataGridHandle` (phần của B), `onStateChange` | A |
| **C** | **Cột**: `columnLayout`, đổi độ rộng (kéo, bấm đúp, bàn phím), kéo đổi thứ tự (chuột, bàn phím), ghim trái/phải (nền đặc, vạch mép, bóng), chọn cột hiện, menu cột (nút ⋮, chuột phải, `Alt+↓`). Token `--flg-data-grid-pin-bg`, `--flg-data-grid-pin-shadow`, `--flg-column-resize-line`; primitive `auto-scroll.ts` | B |
| **D** | **Lọc**: engine lọc, `text-fold.ts`; hàng lọc với toán tử, lọc ở header (giá trị khác nhau), ô tìm kiếm có tô sáng, thanh bộ lọc, trống do lọc; lọc ở chế độ server | C |
| **E** | **Nhóm và tổng**: engine nhóm và tổng, `treegrid`, thanh nhóm (kéo tiêu đề vào, chip), hàng nhóm nhiều cấp, tổng theo nhóm, tổng cuối bảng dính dưới (`totalSummary` ở chế độ server); **master-detail**; **kéo đổi thứ tự dòng** | D |
| **F** | **Sửa dữ liệu**: năm chế độ, thêm/sửa/xoá, trình sửa theo kiểu và lookup, kiểm tra dữ liệu, `onSaving`, dấu của batch và thanh lưu (E2), form và popup (EF1); **`DialogContent fullScreenOnPhone`** | E |
| **G** | Xuất CSV; công thức lưu trạng thái; export `DataGrid` từ `src/index.ts`; trang docs "Examples/Data grid"; mục "Data grid" của Getting started; dòng của trang Accessibility; fixtures; changeset `minor` → `0.5.0` | F |

- **Các plan chạy lần lượt** A → G, như các giai đoạn trước; mỗi plan một PR theo đúng quy trình giai đoạn 5 (bản nháp trong draft worktree, Opus viết plan, chủ dự án xem plan, thực thi bằng cherry-pick, review từng task, review cả nhánh, sửa, PR, chủ dự án review, merge). B đi sau A vì DataGrid dùng phần của A (`use-pointer-drag` từ C, `GripIcon` ở E, `Kbd` trong bảng phím của docs từ B). C cần B (khung, header, bàn phím). D cần C (phễu đứng cạnh nút ⋮; story G1 đủ mặt chỉ có từ D). E cần D (menu cột có "Nhóm theo cột này" và kéo tiêu đề của C; tổng tính sau lọc). F cần E (cột thao tác, form dòng chung chỗ với dòng chi tiết). G cần tất cả.
- **`DataGrid` chỉ được export ở plan G** (bản quyết định). Từ B tới F, code nằm trên `main` nhưng không có trong `src/index.ts`; story và test import thẳng từ `src/components/data-grid/`. Story và trang MDX của nó mang tag `unreleased`, được cấu hình ẩn khỏi sidebar của trang docs đã build (builder chọn cách cấu hình tag của Storybook 10); chúng vẫn chạy trong `test:stories` và visual. Plan G bỏ tag. Nhờ vậy một bản vá `0.4.x` giữa giai đoạn không mang theo DataGrid làm dở, và trang docs công khai (deploy mỗi lần push lên `main`) không quảng cáo nó.
- **Mỗi plan tự mang đủ phần của mình,** như giai đoạn 2–5:
  - Stories: mỗi phương án giao diện một story vẽ lại đúng các trạng thái của mockup, phần nào làm ở plan nào thì story ở plan đó (§7); cộng các story hành vi gắn `no-visual`.
  - Test các lớp ở §7 (với DataGrid: test của engine tách riêng, kèm test hiệu năng), ảnh chuẩn visual (workflow `visual-update.yml`).
  - Trang MDX của component (trang `DataGrid.mdx` lớn dần qua B–G).
  - Danh sách `check:use-client`, `check:dist-css`, các ca của `check:rsc`.
  - Các check tương phản và ngoại lệ của mình (§4.4), cùng bảng §4.9 của spec 0+1 và nhãn trong `scripts/contrast-exceptions.ts`.
  - Ghi lại ngưỡng `size-limit` (`pnpm size:record`); từ B có thêm mục riêng "JS (DataGrid)" (§8).
- **Thay đổi ở code cũ** (không đổi hành vi, ảnh chuẩn cũ giữ nguyên), chi tiết ở §5:
  - Plan A: `Menu.tsx` (`MenuShortcut keys`), `SearchField.tsx` (chữ gợi ý qua bộ định dạng chung; hàm nội bộ `Kbd` của nó đổi tên thành `KeyHint`), `Dialog.tsx` và `modal.tsx` (`movable`, ngữ cảnh cho `DialogHeader`), `dialog.css`, `tests/visual/stories.visual.ts` (`data-visual-drag`).
  - Plan B: không có (DataGrid import `table/use-head-height.ts` và lớp CSS của Table, không sửa chúng).
  - Plan C: `icons.tsx` (`ArrowIcon` hướng `right` và icon mới).
  - Plan F: `Dialog.tsx`, `modal.tsx`, `dialog.css` (`fullScreenOnPhone`).
  - Plan G: `src/index.ts`, `src/index.test.ts`.

**Ngoài phạm vi** (theo bản quyết định; có thể làm ở giai đoạn sau):

- Xuất Excel và PDF (cần thư viện lớn; chỉ xuất CSV).
- Filter builder (cây điều kiện và/hoặc lồng nhau): thanh bộ lọc chỉ hiện và xoá bộ lọc đang áp dụng.
- Lọc ở header theo cây năm/tháng/ngày cho cột ngày (chỉ danh sách giá trị khác nhau).
- Nhóm và cuộn ảo khi dữ liệu nằm ở server; chế độ server dùng thanh phân trang.
- Ẩn cột theo độ ưu tiên trên màn hẹp, hàng chi tiết thích ứng: màn hẹp dùng cuộn ngang và cột ghim.
- Cột nhiều tầng (band columns), gộp ô, ghim dòng, tree list, pivot grid; cuộn ảo theo chiều ngang.
- Kéo dòng giữa hai grid; chọn một vùng ô; sao chép/dán ô qua clipboard; hoàn tác ngoài nút "Bỏ thay đổi" của batch (nút hoàn tác của một dòng chờ xoá E2 thì có).
- Kiểm tra dữ liệu bất đồng bộ trong từng ô (server kiểm tra qua `onSaving`, §6.3).
- Đổi kích thước Dialog bằng chuột; kéo Drawer; di chuyển Dialog bằng bàn phím (§3.4).
- Bảng lệnh (command palette); phím tắt toàn trang cho `Kbd` (Kbd chỉ vẽ phím, không nghe phím).

---

## 3. Kiến trúc

### 3.1 Client và server

| Component | Phân loại | Lý do |
|---|---|---|
| `Kbd` | Server-safe (`kbd/Kbd.tsx`) | `<Kbd>Esc</Kbd>` chỉ là markup. Với `keys`, nó render một con client `KbdKeys` (`kbd/kbd-keys.tsx`, `'use client'`) |
| `KbdKeys` (nội bộ, không export) | Client | Đọc nền tảng bằng `useApplePlatform()` (spec giai đoạn 5 §5) |
| `MenuShortcut` | Client (như cả `Menu.tsx`) | Không đổi |
| `DialogContent`, `DialogHeader` | Client (như trước) | `movable` cần pointer events, `ResizeObserver`, `useMediaQuery` |
| `DataGrid` | Client (`data-grid/DataGrid.tsx`) | Giữ trạng thái, nghe sự kiện, đo khung, cuộn ảo, focus |
| Engine của DataGrid (`data-grid/engine/*`) | Hàm thuần, không React | Test được riêng; không export ra ngoài gói |

- **Kbd trong Server Component.** `labels` của `Kbd` chỉ là chuỗi, nên vượt ranh giới server→client được. Một trang server viết `<Kbd keys="mod+k" />`: phần tử ngoài `<kbd class="flg-kbd">` render trên server, con `KbdKeys` là tham chiếu client.
- **DataGrid trong Server Component.** Cột có hàm (`cell`, `format`, `value`, `editor`…) không đi qua được ranh giới, nên docs dặn: định nghĩa cột và render `DataGrid` trong một client component nhỏ (`'use client'`), Server Component chỉ truyền `data` (dữ liệu tuần tự hoá được) xuống nó (§8). Grid vẫn render đủ HTML ở server (trang đầu hay cửa sổ đầu), §3.9.
- **`check:use-client`** thêm `src/components/kbd/kbd-keys.tsx`, `src/components/data-grid/DataGrid.tsx`.
- **`check:rsc`** thêm: `Kbd` có `children` (ra `<kbd class="flg-kbd">Esc</kbd>`); `Kbd keys="mod+k"`: probe kiểm phần tử ngoài và rằng con của nó có `type` là export `KbdKeys` của `dist/components/kbd/kbd-keys.js`, và không gọi nó (probe hiện gọi mọi hàm component, mà `KbdKeys` dùng hook; `renderTree` thêm một danh sách "tham chiếu client" để dừng ở đó; phát hiện khi viết spec).

### 3.2 Giao diện không có prop mới

Chủ dự án chọn một phương án cho mỗi câu, nên `Kbd`, `DialogContent movable` và mọi phần của `DataGrid` chỉ có một giao diện. `DataGrid` nhận `variant` của `Table` (`'lined'` mặc định · `'striped'` · `'minimal'`, đã duyệt ở giai đoạn 4) cho phần hàng và ô, và `density` (§4.3) cho chiều cao dòng. Mockup giai đoạn 6 vẽ mọi phần riêng của grid trên `lined`; ở `striped` và `minimal` các phần đó giữ đúng quy tắc của chúng (ngoài mockup).

### 3.3 Phím: ngữ pháp và bộ định dạng chung

**Ngữ pháp của `keys`** (Claude chốt). Một tổ hợp, các phần cách nhau bằng `+`, không phân biệt hoa thường, bỏ khoảng trắng hai bên mỗi phần:

| Phần | Apple | Nơi khác | Tên đọc ẩn (Apple) | `aria-keyshortcuts` |
|---|---|---|---|---|
| `mod` | ⌘ | Ctrl | Command | `Meta` / `Control` |
| `ctrl` | ⌃ | Ctrl | Control | `Control` |
| `alt` | ⌥ | Alt | Option | `Alt` |
| `shift` | ⇧ | Shift | Shift | `Shift` |
| `enter` | ↩ | Enter | Return | `Enter` |
| `esc`, `escape` | Esc | Esc | — | `Escape` |
| `tab` | ⇥ | Tab | Tab | `Tab` |
| `backspace` | ⌫ | Backspace | Delete | `Backspace` |
| `delete` | ⌦ | Del | Forward Delete | `Delete` |
| `up` `down` `left` `right` | ↑ ↓ ← → | ↑ ↓ ← → | Up Arrow… (cả hai nền tảng) | `ArrowUp`… |
| `space` | Space | Space | — | `Space` |
| `home` `end` `pageup` `pagedown` | Home, End, Page Up, Page Down | như Apple | — | `Home`… |
| `f1`–`f12` | F1… | F1… | — | `F1`… |
| `plus` | + | + | — | `Plus` |
| một ký tự | chữ in hoa (`k` → K), ký tự khác giữ nguyên (`/`, `,`, `[`) | như Apple | — | chữ in hoa / ký tự |

- **Giữ thứ tự người viết** (Claude chốt): `mod+shift+f` ra ⌘⇧F, "Ctrl Shift F", đúng mockup K1 (thứ tự HIG của Apple là ⇧⌘F; docs khuyên viết theo thứ tự đó nếu muốn).
- **Một tổ hợp mỗi `Kbd`**; dãy phím ("g rồi i") và phím thay thế không có. Phần lạ (`mod+foo`), phần rỗng (`mod++`) thì `devWarn` và phần đó được vẽ nguyên chữ.
- **Dấu ngăn:** trên Apple không có (khoảng `.05em` của CSS); nơi khác là khoảng `.3em` của CSS, không phải ký tự (mockup K1). Giữa hai phím có `<span class="flg-visually-hidden">+</span>` (đổi được qua `labels.separator`), để tên tính từ nội dung không dính thành "CtrlK" và trình đọc màn hình đọc "Control plus K". Phần tử ẩn là `position: absolute`, không phải flex item, nên không thêm khoảng.
- **Tên của ký hiệu:** trên Apple mỗi ký hiệu là `<span aria-hidden="true">⌘</span><span class="flg-visually-hidden">Command</span>`; tên đổi được qua `labels`. Chữ "Ctrl", "Shift", "Alt" ở nơi khác được đọc như chữ.
- **Bộ định dạng** `src/internal/shortcut-format.ts` (Plan A; §5): `parseKeys(keys)` → các phần đã chuẩn hoá (hay lỗi); `formatKeys(parts, apple, labels)` → mảng `{ glyph, name? }`; `shortcutText(parts, apple)` → chuỗi phẳng ("⌘K", "Ctrl K") cho chỗ không vẽ ô từng phím; `toAriaKeyShortcuts(parts, apple)` → "Meta+K" / "Control+K".
- **SearchField chuyển sang bộ định dạng** (Plan A) mà không đổi giao diện đã duyệt: `labels.shortcut` mặc định nay là `(s, apple) => s === '/' ? '/' : shortcutText(parseKeys('mod+k'), apple)` (vẫn ra "⌘K" / "Ctrl K"), `aria-keyshortcuts` lấy từ `toAriaKeyShortcuts`. Gợi ý vẫn là `<kbd class="flg-search-field-kbd" aria-hidden="true">` với CSS cũ (K1: SearchField giữ giao diện cũ). Hàm nhận phím `matchesShortcut` của nó giữ nguyên.
- **Nền tảng chỉ biết sau khi mount:** `KbdKeys` dùng `useApplePlatform()`; HTML từ server và lần render hydrate dùng dạng "nơi khác", rồi đổi sang ký hiệu Apple sau khi mount (bản quyết định). Khác SearchField (ô rỗng `hidden` cho tới khi biết), Kbd luôn hiện chữ vì nó nằm trong câu chữ: một chỗ trống trong câu tệ hơn một lần đổi "Ctrl K" → "⌘K". Docs ghi rõ.

### 3.4 Dialog kéo được

**Máy trạng thái con trỏ** (Plan A; dùng `usePointerDrag` của §5):

| Trạng thái | Vào khi | Làm gì | Ra khi |
|---|---|---|---|
| `idle` | — | Header có `cursor: grab` (màn ≥ 640px) | `pointerdown` hợp lệ → `pressed` |
| `pressed` | `pointerdown` trên `DialogHeader` của một `DialogContent movable`, `isPrimary`, nút chính (`button === 0`; với chuột trên Apple bỏ `ctrlKey`, vì đó là chuột phải), màn ≥ 640px, và đích không nằm trong phần tử tương tác của header (`button, a[href], input, select, textarea, label, summary, [contenteditable], [role=button], [role=link], [tabindex]:not([tabindex="-1"])`) | `preventDefault()` (focus và vùng chọn chữ ở yên: một lần nhấn trên header không kéo focus khỏi ô đang gõ về panel), `setPointerCapture` (bọc `try/catch`: sự kiện tổng hợp của test không có pointer thật), đọc `getBoundingClientRect()` của panel và độ lệch hiện tại, tính khung kẹp | Di quá 3px → `dragging`; `pointerup`, `pointercancel`, `lostpointercapture` → `idle` (một lần nhấn không kéo thì không đổi gì) |
| `dragging` | — | `data-dragging` trên `<dialog>` (như mockup); mỗi `pointermove` đặt `--flg-dialog-x`, `--flg-dialog-y` trên panel bằng `style.setProperty` (không qua React, không render lại), đã kẹp | `pointerup`, `pointercancel`, `lostpointercapture` → `idle`, bỏ `data-dragging` |

- **Dịch bằng `translate`:** `.flg-dialog-panel[data-movable] { translate: var(--flg-dialog-x, 0px) var(--flg-dialog-y, 0px) }`, chỉ trong `@media (min-width: 640px)`. `translate` độc lập với `transform` của animation mở (`scale(.96)`, spec giai đoạn 2 §3.5) và với `scale` của trạng thái nhấc lên, và không nằm trong `transition` của panel, nên panel bám theo con trỏ ngay. Khung `<dialog>` không có `transform` nào (spec giai đoạn 2 §3.4).
- **Kẹp:** độ lệch `x` nằm trong `[16 − trái₀, (W − 16) − phải₀]`, `y` trong `[16 − trên₀, (H − 16) − dưới₀]`, với `W`, `H` là kích thước của khung `<dialog>` (toàn viewport) và `trái₀`… là hình chữ nhật của panel ở độ lệch 0. 16px là padding của khung, tức lề khi căn giữa. Panel có `max-width: 100%` và `max-height: 100%` của khung, nên không bao giờ lớn hơn vùng đó: quy tắc "hộp thoại cao hơn viewport thì giữ header trong viewport" của bản quyết định không xảy ra, và một panel cao hết khung chỉ kéo được theo chiều ngang (Claude chốt). Lúc nhấc lên panel to thêm 2%, có thể lấn 1% mỗi phía vào lề 16px; không kẹp lại vì việc đó.
- **Đổi kích thước:** một `ResizeObserver` trên panel (nội dung mọc thêm, như lời báo lỗi) và trên khung (cửa sổ đổi cỡ) kẹp lại độ lệch hiện tại.
- **Về giữa:** mỗi lần mở bắt đầu ở giữa, tự nhiên, vì panel chỉ render khi mở (spec giai đoạn 2 §3.3) nên biến cũ mất theo. `dblclick` trên header (không trên phần tử tương tác) xoá hai biến: panel về giữa ngay, không animation (Claude chốt).
- **Dưới 640px** (`useMediaQuery('(min-width: 640px)')`): không nhận `pointerdown`, xoá hai biến (cửa sổ hẹp lại khi đang lệch thì panel về giữa; rộng lại vẫn ở giữa), tay nắm ẩn, header trở về bố cục cột thường, không `cursor`, không `touch-action`.
- **Chạm và bút:** chạy như chuột; header có `touch-action: none` và `user-select: none` khi kéo được.
- **Bấm ra ngoài:** lần nhấn bắt đầu trong panel, nên thả chuột ngoài panel sau khi kéo không đóng hộp thoại (luật bấm ra ngoài của spec giai đoạn 2 §3.4 đòi cả lần nhấn lẫn lần thả trên khung).
- **Esc** trong lúc kéo đóng hộp thoại như mọi khi; panel unmount và pointer capture tự nhả.
- **`alert`:** `movable` dùng được với `alert` (bản quyết định); bấm ra ngoài vẫn không đóng.
- **Hộp thoại lồng nhau và modal stack:** mỗi `DialogContent movable` có độ lệch riêng; hộp thoại con bắt đầu ở giữa viewport, không theo hộp thoại cha. Modal stack không biết vị trí: chỉ hộp trên cùng nhận con trỏ, phần còn lại `inert` do `showModal()`.
- **Không có `DialogHeader`:** không có chỗ để kéo; `devWarn` sau khi mở ("<DialogContent movable> needs a <DialogHeader> to drag it by.").
- **Không di chuyển bằng bàn phím** (bản quyết định; lý do theo WCAG): 2.5.7 Dragging Movements đòi một cách không kéo cho "chức năng" dùng thao tác kéo, và 2.1.1 đòi bàn phím cho mọi chức năng. Spec coi vị trí của hộp thoại là trình bày, không phải chức năng: (1) kéo không đổi dữ liệu hay trạng thái nào của ứng dụng, và vị trí bị quên khi đóng; (2) mọi việc hộp thoại làm được đều làm được ở vị trí giữa; (3) trang phía sau `inert` trong lúc hộp thoại mở, nên kéo không mở ra thêm thứ gì thao tác được, chỉ cho nhìn; (4) nội dung phía sau xem được bằng cách đóng hộp thoại, và form sửa dòng của DataGrid đã chứa mọi trường của dòng. Nếu một đợt kiểm định coi việc di chuyển là chức năng, cách sửa rẻ là thêm phím (`Alt+mũi tên` trên header) ở một bản sau (§10).
- **Hình ảnh** (tay nắm D2, nhấc lên, con trỏ): §4.3.

### 3.5 DataGrid: engine và pipeline

**Engine** (`src/components/data-grid/engine/`) là các hàm thuần không React, nhận dữ liệu và cấu hình đã chuẩn hoá, trả dữ liệu mới, không sửa đầu vào. Mỗi file có test đơn vị riêng (§7).

| File (plan) | Hàm chính | Ghi chú |
|---|---|---|
| `columns.ts` (B) | `resolveColumns(columns, layout, options)` | Cột đã chuẩn hoá: `id`, `getValue`, `dataType`, căn lề, bộ định dạng, `compare`, lookup thành `Map` giá trị → chữ; thứ tự, ẩn, ghim theo `columnLayout`; id lặp, cột thiếu `field`/`value` bị bỏ kèm `devWarn` |
| `values.ts` (B) | `isBlank`, `toComparable`, `formatValue`, `createTextCache()` | Rỗng là `null`, `undefined`, `''`, `NaN`, ngày không hợp lệ. Chữ đã định dạng của mỗi ô được nhớ trong một `WeakMap` theo đối tượng dòng (dữ liệu bất biến: dòng mới thì tính lại) |
| `sort.ts` (B) | `sortRows(rows, items, columns)` | Ổn định (kèm chỉ số gốc). Chuỗi: `Intl.Collator(locale, { numeric: true })` ("DH-2" trước "DH-10"); số, ngày, boolean so như số; `sortValue(row)` thay giá trị khi có; lookup theo chữ hiển thị. **Rỗng luôn xếp cuối**, ở cả hai chiều |
| `page.ts` (B) | `pageRows(flat, page)`, `pageCount` | Cắt danh sách đã làm phẳng; nhóm bị cắt ngang được lặp tiêu đề (E) |
| `flatten.ts` (B, E) | `flattenRows(tree, state)` | Danh sách phẳng các dòng hiển thị, mỗi dòng có `kind` (`data`, `group`, `detail`, `form`), cấp, `posinset`/`setsize` |
| `virtual.ts` (B) | `computeOffsets(flat, heights)`, `findWindow(offsets, scrollTop, viewport, overscan)` | Tổng tiền tố của chiều cao; tìm cửa sổ bằng tìm kiếm nhị phân |
| `pipeline.ts` (B…F) | `createPipeline()` | Nối các bước dưới đây, nhớ kết quả từng bước theo đầu vào của nó |
| `layout.ts` (C) | `resolveWidths`, `pinOffsets`, `moveColumn`, `autoFitWidth` | Độ rộng px của cột co giãn theo bề rộng khung, vị trí dính của cột ghim, đổi chỗ trong vùng |
| `text.ts` (D) | dùng `foldText` của `src/internal/text-fold.ts`; `findMatches(text, query)` | Khoảng khớp để tô sáng, trả về theo chỉ số của chuỗi gốc |
| `filter.ts` (D) | `filterRows`, `matchCondition`, `operatorsFor(dataType)`, `distinctValues(rows, column, search)` | §6.3 Lọc |
| `group.ts` (E) | `groupRows(rows, grouping, columns)`, `groupKey(path)` | Cây nhiều cấp; khoá nhóm là chuỗi JSON của đường giá trị (ngày thành ISO) |
| `summary.ts` (E) | `computeSummary(rows, items, columns)` | `count`, `sum`, `avg`, `min`, `max`, hàm tuỳ biến |
| `edit.ts` (F) | `applyChanges(rows, changes, rowKey)`, `mergeChange`, `rowDiff` | Dòng hiển thị khi có thay đổi chưa lưu |
| `validate.ts` (F) | `validateValue(value, rules, column, row, labels)` | §6.3 Sửa dữ liệu |
| `csv.ts` (G) | `toCsv(rows, columns, options)` | §6.3 Xuất CSV |

**Thứ tự pipeline** (chế độ client):

1. **Cột:** `resolveColumns` (không phụ thuộc dữ liệu).
2. **Dòng hiển thị:** `data` cộng thay đổi chưa lưu (F): dòng đã sửa mang giá trị mới, dòng chờ xoá được đánh dấu, dòng mới chèn ở `newRowPosition`.
3. **Tìm kiếm** (`filter.search`): giữ dòng có ít nhất một cột đang hiện, cho phép tìm (`allowSearch`), mà chữ đã định dạng chứa chuỗi tìm (so khớp gập dấu và hoa thường, `text-fold.ts` ở §5).
4. **Lọc theo cột** (khi `filter.enabled !== false`): mọi điều kiện của hàng lọc và tập giá trị của lọc ở header, cộng bằng "và" giữa các cột và giữa hai loại trên cùng một cột.
   - **Dòng có thay đổi chưa lưu không di chuyển** (Claude chốt, sau builder check): dòng đang sửa, dòng có ô đã sửa hay chờ xoá của batch, và dòng mới chưa lưu không bị bước 3–4 lọc bỏ, và bước 5–6 tính trên **giá trị đã lưu** của chúng, nên chúng không đổi chỗ khi sắp xếp và không nhảy sang nhóm khác dù cột sắp xếp hay cột nhóm vừa bị sửa; giá trị mới chỉ được áp lúc hiển thị (bước 2 là lớp phủ). Dòng mới chưa lưu nằm ngoài mọi nhóm, ở cấp 1 (`aria-level="1"`), ở đầu danh sách (trước hàng nhóm đầu tiên) hay ở cuối theo `newRowPosition`. Sau khi lưu, app đổi `data`, pipeline chạy lại và dòng về đúng chỗ của nó; focus theo khoá dòng (§3.6), nên vẫn ở trên dòng đó nếu nó còn hiện.
5. **Sắp xếp:** theo các cấp nhóm trước (chiều của từng cấp), rồi theo `sort`.
6. **Nhóm** (E): dựng cây; tổng theo nhóm trên dòng của nhóm.
7. **Tổng cuối bảng** (E): trên mọi dòng sau bước 4 (mọi trang), với giá trị đang hiển thị (thay đổi chưa lưu đã áp), trừ dòng chờ xoá (Claude chốt; bản quyết định).
8. **Làm phẳng:** theo `expandedGroups`, `expandedRows` (dòng chi tiết), dòng form đang mở.
9. **Trang** (cắt) hoặc **cửa sổ ảo** (§3.7).

- **Chế độ server** (`remote`): bỏ bước 3–5 và 9 (dữ liệu đã là trang hiện tại, đã lọc, đã sắp), bước 6 không có (nhóm ngoài phạm vi), bước 7 lấy `totalSummary` của app.
- **Nhớ kết quả:** mỗi bước nhớ theo danh tính của đầu vào (`data`, kết quả bước trước) và theo một chữ ký của cấu hình liên quan (id, `dataType`, lookup của cột; `filter`; `sort`…). Gõ vào ô tìm kiếm chạy lại từ bước 3; mở một nhóm chỉ chạy lại bước 8–9; cuộn chỉ chạy bước 9. Hàm của cột (`format`, `value`, `sortValue`) so theo danh tính: `columns` tạo mới mỗi lần render làm mọi bước chạy lại, nên `DataGrid` `devWarn` khi danh tính của `columns` đổi ba lần render liền mà id các cột không đổi ("pass a stable columns array: a module constant or useMemo").

**Độ phức tạp và mục tiêu** (10 000 dòng × 9 cột, chế độ client, laptop tầm trung):

| Bước | Độ phức tạp | Mục tiêu |
|---|---|---|
| Tìm kiếm | O(n·c), chữ đã định dạng lấy từ bộ nhớ đệm sau lần đầu | ≤ 30 ms |
| Lọc theo cột | O(n·k), k điều kiện | ≤ 20 ms |
| Sắp xếp hai cấp | O(n log n) phép so, khoá so đã tính sẵn một lần mỗi dòng | ≤ 50 ms |
| Nhóm hai cấp kèm tổng | O(n·g + n·s) bằng `Map` | ≤ 30 ms |
| Làm phẳng, trang, cửa sổ | O(r), cửa sổ O(log r) | ≤ 5 ms |
| Render khi cuộn ảo | — | ≤ khoảng 40 dòng mỗi khung hình |

- **Test chứng minh** (§7): `engine/perf.test.ts` dựng 10 000 đơn hàng bằng bộ sinh số có hạt giống, đo trung vị của 5 lần mỗi bước bằng `performance.now()`, in số đo ra log, và đòi dưới **ba lần** mục tiêu trong CI (máy CI chậm và ồn); mục tiêu thật được đo trên máy của chủ dự án và ghi trong mô tả PR của plan B, D, E. Lớp 2 (trình duyệt) kiểm số dòng trong DOM khi cuộn ảo luôn ≤ số dòng thấy được + 2 × vùng đệm + 1.

### 3.6 DataGrid: DOM, ARIA và focus

**Cấu trúc** (mọi phần, plan G; phần nào không bật thì không có):

```html
<div class="flg-data-grid" data-variant="lined" data-density="standard">
  <div class="flg-data-grid-toolbar">caption, thanh nhóm, tìm kiếm, chọn cột, xuất CSV, thêm dòng</div>
  <div class="flg-alert" role="alert">lỗi khi lưu (F)</div>
  <div class="flg-data-grid-main">
    <div class="flg-data-grid-savebar">3 unsaved changes … (F, batch)</div>
    <div class="flg-table-frame flg-data-grid-frame" data-variant="lined" data-size="md" data-sticky-header
         data-scrolled-left data-scrolled-right>
      <table class="flg-table flg-data-grid-table" role="grid" aria-labelledby=":r1:" aria-multiselectable="true"
             aria-rowcount="10003">                                   <!-- aria-rowcount, aria-rowindex: chỉ khi cuộn ảo -->
        <colgroup>…</colgroup>
        <thead class="flg-table-header">
          <tr class="flg-table-row" aria-rowindex="1"><th class="flg-table-head flg-data-grid-head" scope="col" aria-sort="descending" tabindex="-1">…</th>…</tr>
          <tr class="flg-table-row flg-data-grid-filter-row" aria-rowindex="2"><td class="flg-data-grid-filter-cell" tabindex="-1">…</td>…</tr>
        </thead>
        <tbody class="flg-table-body">
          <tr class="flg-data-grid-spacer" aria-hidden="true"><td colspan="9" style="height: 4100px"></td></tr>
          <tr class="flg-table-row flg-data-grid-row" aria-rowindex="103" aria-selected="true" data-selected>
            <td class="flg-table-cell flg-data-grid-cell" tabindex="0">…</td>
            <th class="flg-table-head flg-data-grid-cell" scope="row" tabindex="-1">DH-1028</th>…
          </tr>
          <tr class="flg-data-grid-spacer" aria-hidden="true">…</tr>
        </tbody>
        <tfoot class="flg-table-footer">…tổng…</tfoot>
      </table>
      <div class="flg-data-grid-overlay" aria-hidden="true">spinner</div>
    </div>
  </div>
  <div class="flg-data-grid-filter-panel">…</div>
  <div class="flg-data-grid-pager">…</div>
  <div class="flg-visually-hidden" aria-live="polite" aria-atomic="true"></div>
  <!-- menu cột, popover lọc ở header, chip đang kéo: mỗi thứ một cái cho cả grid, popover ở top layer -->
</div>
```

- **Vai trò:** `role="grid"` trên `<table>`; `role="treegrid"` khi `grouping` có ít nhất một cấp. Vai trò ngầm định của phần tử bảng được dùng (`tr` → row, `td` → gridcell, `th scope=col` → columnheader, `th scope=row` → rowheader); `role` chỉ đặt tường minh khi khác. Hàng đệm của cuộn ảo `aria-hidden`.
- **Tên:** `caption` (§6.3) đặt `aria-labelledby`, `description` đặt `aria-describedby`; không có `caption` thì cần `aria-label` hay `aria-labelledby` của người gọi, thiếu cả hai thì `devWarn` (qua `useRequireName`).
- **`aria-multiselectable="true"`** khi `selectionMode="multiple"`. **`aria-selected`** (`true`/`false`) trên mọi dòng dữ liệu khi có chọn dòng (khác `Table`, nơi `aria-selected` không được phép trên dòng của bảng, spec giai đoạn 4 §6.3).
- **`aria-sort`** chỉ trên tiêu đề của cấp sắp xếp đầu tiên (ARIA: một tiêu đề mỗi lúc). Mọi cột đang sắp có thêm chữ ẩn trong nút sắp xếp từ `labels.sortState(direction, level, count)` (", sorted descending, 2 of 2" khi sắp nhiều cột; không có gì thêm khi chỉ một cột), để cấp thứ hai trở đi cũng được đọc; số thứ tự nhìn thấy `aria-hidden`.
- **`aria-rowcount` / `aria-rowindex`:** chỉ khi `scrolling="virtual"` (dòng thiếu trong DOM): `aria-rowcount` = số hàng tiêu đề + số dòng hiển thị sau làm phẳng (cả hàng nhóm, dòng chi tiết) + số hàng tổng; `aria-rowindex` trên mọi hàng có trong DOM, đếm từ 1 ở hàng tiêu đề đầu. Khi phân trang, mọi dòng của trang đều trong DOM nên không đặt (thanh phân trang nói trang nào). **Không dùng `aria-colcount` / `aria-colindex`** (Claude chốt; bản quyết định ghi "khi có cột ẩn hoặc cuộn ảo"): không có cuộn ảo ngang, mọi cột đang hiện đều trong DOM, và cột người dùng đã ẩn không còn là cột của grid, nên đếm nó vào sẽ đọc sai "cột 5 trên 9".
- **Treegrid:** hàng nhóm có `aria-level`, `aria-expanded`, `aria-setsize`, `aria-posinset`; dòng dữ liệu dưới nhóm có `aria-level` = số cấp + 1 (và `aria-setsize`/`aria-posinset` trong nhóm của nó khi cuộn ảo).
- **Master-detail:** nút mở chi tiết mang `aria-expanded` và `aria-controls` trỏ vào dòng chi tiết; dòng dữ liệu không mang `aria-expanded` (Claude chốt, như mockup R1; §1).
- **Live region:** một vùng `aria-live="polite"` của chính grid (`useAnnounce`, nằm trong gốc nên vẫn được đọc khi grid ở trong Dialog). Thông báo ở §6.3 (`labels`), đều đi qua nó; thông báo theo sau việc gõ (tìm, lọc) chờ 500 ms.

**Mô hình focus** (mẫu data grid của APG):

- **Một điểm Tab.** Đúng một phần tử trong bảng có `tabindex="0"`: ô đang hoạt động (hay hàng nhóm đang hoạt động, hay control duy nhất của ô, bên dưới); mọi ô khác và mọi control trong ô `tabindex="-1"`. Thanh công cụ, thanh lưu, thanh bộ lọc và thanh phân trang là các điểm Tab riêng trước và sau bảng.
- **Vị trí hoạt động** lưu bằng (khoá dòng hoặc khoá nhóm, id cột), không bằng chỉ số DOM, nên sắp xếp, lọc, cuộn ảo không làm mất chỗ. Lúc đầu: ô đầu của dòng thân đầu tiên (không có dòng: ô tiêu đề đầu). Dòng hoạt động biến mất (lọc, xoá) thì vị trí chuyển sang dòng cùng chỉ số (kẹp lại), và nếu focus đang ở trong grid thì focus theo sang đó.
- **Ô chỉ có một control đơn giản** (ô chọn của cột chọn dòng, ô chọn tất cả ở tiêu đề, nút mở chi tiết, tay nắm kéo dòng): chính control đó là đích của focus (APG), Space/Enter tác động thẳng lên nó.
- **Ô có nhiều control** (tiêu đề cột có nút sắp xếp, phễu, ⋮; cột thao tác; `cell` tuỳ biến có link hay nút; dòng chi tiết): focus nằm trên ô; `Enter` hoặc `F2` vào "chế độ widget": focus sang control đầu, `Tab`/`Shift+Tab` đi vòng trong các control của ô, `Esc` hoặc `F2` về ô. Bấm chuột vào một control trong ô đặt ô đó làm ô hoạt động. Tiêu đề cột: `Enter` là sắp xếp (bản quyết định), nên chỉ `F2` vào các nút của nó.
- **Hàng nhóm** được focus nguyên hàng (`<tr tabindex>`, theo treegrid của APG), vì nó có một việc chính (mở/đóng) và ô tiêu đề của nó trải nhiều cột.
- **Rời grid:** `Tab`/`Shift+Tab` khi không ở chế độ widget hay sửa: focus đi tới điểm Tab kế tiếp ngoài bảng (trình duyệt tự làm, vì chỉ một phần tử có `tabindex="0"`).
- **Không bị header dính che** (WCAG 2.4.11): khung có `scroll-padding-top` bằng chiều cao đo được của `<thead>` (dùng lại `useHeadHeight` của Table), `scroll-padding-bottom` bằng chiều cao `<tfoot>`, `scroll-padding-left`/`-right` bằng bề rộng vùng ghim. Di chuyển bằng phím gọi `focus({ preventScroll: true })` rồi `scrollIntoView({ block: 'nearest', inline: 'nearest' })`, cái tôn trọng `scroll-padding`. Cuộn ảo: cuộn tới độ lệch tính được, render, rồi focus.
- **Sự kiện không phải của grid:** trình xử lý phím của grid bỏ qua sự kiện đã `defaultPrevented`, đang soạn chữ (`isComposing`), hay đến từ bên trong một `[popover]` (listbox của Select, lịch của DatePicker, menu, popover lọc nằm trong DOM của ô).

**Bản đồ phím** (bản quyết định; "mod" là ⌘ trên Apple, Ctrl ở nơi khác):

| Phím | Ở đâu | Việc |
|---|---|---|
| `←` `→` | ô | Sang ô bên trái/phải, không vòng sang hàng khác |
| `→` | hàng nhóm | Nhóm đóng: mở. Nhóm mở: tới dòng con đầu tiên |
| `←` | hàng nhóm | Nhóm mở: đóng. Nhóm đóng: tới hàng nhóm cha (nếu có) |
| `↑` `↓` | ô, hàng nhóm | Lên/xuống một hàng, giữ cột (cột được nhớ khi đi qua hàng nhóm và dòng chi tiết). `↑` từ dòng thân đầu lên hàng lọc, rồi hàng tiêu đề |
| `Home` `End` | ô | Ô đầu / cuối của hàng |
| `mod+Home` `mod+End` | ô | Ô đầu của dòng thân đầu tiên / ô cuối của dòng thân cuối cùng (trong trang hiện tại; cuộn ảo thì của mọi dòng). APG nói "hàng đầu", spec chọn dòng thân vì hàng tiêu đề tới được bằng `↑` (Claude chốt) |
| `PageUp` `PageDown` | ô | Lên/xuống số dòng thấy được trong khung, giữ cột; không đổi trang |
| `Enter` | tiêu đề cột | Sắp xếp cột này (tăng → giảm → bỏ), thay mọi sắp xếp khác |
| `Shift+Enter` | tiêu đề cột | Thêm cột vào sắp xếp nhiều cột, hay đổi chiều / bỏ nó (tăng → giảm → bỏ), giữ các cột khác |
| `Alt+↓`, `Shift+F10`, phím ContextMenu | tiêu đề cột | Mở menu cột (C) |
| `F2` | ô có nhiều control, tiêu đề cột | Vào chế độ widget; `F2` hay `Esc` để ra |
| `Enter` | ô có nhiều control | Như `F2` |
| `Enter`, `F2`, gõ một ký tự in được | ô sửa được, chế độ `cell` và `batch` | Bắt đầu sửa ô (ký tự gõ thay giá trị; `Enter`/`F2` giữ giá trị, con trỏ ở cuối) |
| `Enter`, `F2` | ô sửa được, chế độ `row`, `form`, `popup` | Bắt đầu sửa dòng, focus vào trình sửa của cột đó (form, popup: trường đầu sửa được) |
| `Enter` | ô thường (không control, không sửa được) | Gọi `onRowActivate(row, key)` nếu có |
| `Space` | ô của dòng dữ liệu, khi có chọn dòng | Chọn / bỏ chọn dòng (`single`: chọn dòng này) |
| `Shift+Space` | ô của dòng dữ liệu, `multiple` | Chọn khoảng từ dòng neo (lần chọn trước) tới dòng này |
| `mod+A` | ô thân, `multiple` | Chọn tất cả theo `selectAllMode` |
| `Esc` | chế độ widget, đang sửa | Ra khỏi chế độ widget / huỷ sửa (§6.3 Sửa dữ liệu) |
| `mod+Shift+←` `mod+Shift+→` | tiêu đề cột | Chuyển cột sang trái/phải một chỗ, trong vùng của nó (C) |
| `Alt+Shift+←` `Alt+Shift+→` | tiêu đề cột | Hẹp/rộng cột 10px, tôn trọng `minWidth` (C) |
| `mod+Shift+↑` `mod+Shift+↓` | ô của dòng dữ liệu, khi `rowReorder` | Chuyển dòng lên/xuống một chỗ (E) |
| `Enter`, `Space` | tay nắm kéo dòng | Mở menu dòng: Lên trên, Xuống dưới, Lên đầu, Xuống cuối (E) |
| `mod+Shift+←` `mod+Shift+→` | nút trong chip của thanh nhóm | Đổi cấp nhóm (E) |

- **Shift+bấm hay mod+bấm** trên tiêu đề là `Shift+Enter` của chuột (bản quyết định ghi "Ctrl+bấm"; trên Apple Ctrl+bấm là chuột phải, nên là ⌘+bấm). Shift+bấm trên dòng hay ô chọn là chọn khoảng.
- Không tổ hợp nào ở trên là phím của trình duyệt trên Chromium, Firefox, Safari (Windows, macOS, Linux): `Alt+←` (lùi trang) và `mod+PageUp/PageDown` (đổi tab) được tránh có chủ ý. Docs liệt kê đủ bảng này bằng `Kbd`.

### 3.7 DataGrid: bố cục, cuộn, dính, ghim, cuộn ảo

**Khung và chiều cao.** Gốc `.flg-data-grid` là cột `flex`. `height` (số px hay chuỗi CSS) đặt trên **gốc** (như DevExtreme: chiều cao của cả widget), khung `.flg-data-grid-frame` là phần `flex: 1; min-height: 0` và cuộn hai chiều (`overflow: auto`, sẵn từ `.flg-table-frame`). Không có `height`: grid cao theo nội dung, khung chỉ cuộn ngang, header dính không có tác dụng theo chiều dọc (như `Table`). Khung không tự là vùng có `tabindex` như `Table` (các ô đã nhận focus và cuộn theo).

**`table-layout: fixed` và `<colgroup>`.** Mỗi cột một `<col style="width: Npx">`, cả cột phục vụ (chọn dòng 40px, tay nắm kéo dòng 28px, mỗi cấp nhóm 28px, mở chi tiết 40px, thao tác 72px; số của G1 và R1, cột tay nắm và cột thao tác ngoài mockup).

- **Cột có `width`:** đúng số đó. **Cột không có `width`** co giãn: chia đều phần còn lại của bề rộng khung (đo bằng `ResizeObserver`), không dưới `minWidth` (mặc định 60px). Bảng rộng `max(bề rộng khung, tổng các cột)`; rộng hơn khung thì khung cuộn ngang.
- **Trước khi đo** (HTML từ server, lần render hydrate): cột co giãn là `<col>` không có `width`, bảng `width: 100%` và `min-width` bằng tổng các độ rộng cố định cộng `minWidth` của cột co giãn; CSS tự chia. Sau khi đo, mọi cột có px chính xác (cột ghim cần px để tính vị trí dính).
- **Đổi độ rộng kiểu "widget"** (bản quyết định): lần kéo đầu ghi độ rộng px hiện tại của **mọi** cột co giãn vào `columnLayout.widths`, nên kéo một cột chỉ làm bảng rộng ra hay hẹp lại, không lấy chỗ của cột bên cạnh. Hệ quả: sau đó các cột không co giãn theo cửa sổ nữa (như DevExtreme); "Tự vừa" hay xoá `widths` (lưu trạng thái) trả lại (Claude chốt).

**Dính** (`position: sticky`, z-index trong khung có `isolation: isolate` của `Table`):

| Phần | Dính | z-index |
|---|---|---|
| `<thead>` (tiêu đề, hàng lọc) | `top: 0` (dùng quy tắc `[data-sticky-header]` của Table; `striped`/`minimal` `top: -6px`) | 2 |
| `<tfoot>` (tổng cuối bảng) | `bottom: 0` | 2 |
| Ô của cột ghim trái / phải | `left` / `right` bằng tổng bề rộng các cột ghim đứng trước nó | 1 |
| Ô ghim trong `<thead>` / `<tfoot>` | như trên | 3 |
| Đường thả, đường kẻ hướng dẫn khi đổi độ rộng, lớp phủ đang tải | `position: absolute` trong khung | 4 |

- **Header dính của grid nằm trên nền đặc** `--flg-data-grid-pin-bg` (thay cho `--flg-glass-tint-solid` 94% của `Table`, vốn để lộ 6% chữ cuộn bên dưới; điểm mở của người vẽ mockup). `Table` không đổi (Claude chốt).
- **Cột ghim:** cột phục vụ ở đầu (chọn dòng, tay nắm, thụt nhóm, mở chi tiết) tự ghim trái khi có cột dữ liệu nào ghim trái; cột thao tác tự ghim phải khi có cột nào ghim phải. Ô ghim trong suốt khi chưa cuộn ngang (giống mọi ô, như hình trên của G1); khung có `data-scrolled-left` khi `scrollLeft > 0` và `data-scrolled-right` khi chưa cuộn tới cuối, và chỉ khi đó ô ghim phía tương ứng có nền đặc `--flg-data-grid-pin-bg`; nền hover, chọn, sọc của dòng vẽ lên ô ghim bằng một `::before` (`inset: 0; z-index: -1`), như mockup. Vạch mép và bóng: §4.3 G1. Ô ghim là `position: sticky` nên cũng là khối chứa của `::before`/`::after` của nó.

**Cuộn ảo** (`scrolling="virtual"`; bản quyết định):

- **Chiều cao cố định theo loại dòng:** dòng dữ liệu `rowHeight` (theo `density` và `variant`, bảng ở §4.3; ghi đè bằng prop `rowHeight`), hàng nhóm `rowHeight − 8`. Sau khi mount, grid đo khoảng cách thật giữa hai dòng liền nhau (gồm viền 1px của `lined` và `border-spacing` 2px của `striped`) và dùng số đo đó, để engine nào tính viền khác đi cũng không trôi (đo lại khi `density`, `variant` hay `rowHeight` đổi). Trước khi đo: hằng số của bảng §4.3.
- **Cửa sổ:** các dòng giao với `[scrollTop − vùng đệm, scrollTop + chiều cao khung + vùng đệm]`, vùng đệm 6 dòng mỗi phía; cuộn được cập nhật trong `requestAnimationFrame`. Phần trên và dưới cửa sổ là hai hàng đệm `aria-hidden` cao bằng tổng chiều cao của các dòng không render.
- **Dòng đang có focus luôn được render** (Claude chốt): nếu dòng hoạt động nằm ngoài cửa sổ trong khi focus ở trong grid (người dùng cuộn bằng chuột), nó được render đúng chỗ của nó, hàng đệm tách làm hai quanh nó. Focus không bao giờ rơi về `<body>` vì dòng của nó bị gỡ.
- **Dòng có chiều cao thay đổi:**
  - Dòng chi tiết (master-detail): cuộn ảo tắt, `devWarn` (bản quyết định).
  - Form của chế độ `form` (EF1): chỉ một form mở mỗi lúc; dòng của nó được đo bằng `ResizeObserver` và số đo vào bảng độ lệch (trước lần đo đầu: ước lượng 8 × `rowHeight`). Đây là dòng đo được duy nhất (Claude chốt).
  - Chế độ `row`, `cell`, `batch` giữ chiều cao dòng (E2: trình sửa nằm trong ô, lỗi ở Tooltip), nên không đổi gì cho cuộn ảo. Điểm mở "E1 lỗi dưới ô làm dòng cao lên" không còn, vì E1 không được chọn.
- **Cần chiều cao:** cuộn ảo cần khung có chiều cao (`height`); không có thì `devWarn` và cuộn thường. `paging` bị bỏ qua khi cuộn ảo (`devWarn` nếu truyền cả hai). Chế độ server không có cuộn ảo (bản quyết định; `devWarn`).

**Nội dung trải cả hàng** (dòng chi tiết, form EF1, ô trống/đang tải): ô trải mọi cột, nhưng phần nội dung bên trong là `position: sticky; left: 0` và rộng tối đa bằng bề rộng nhìn thấy của khung (`--flg-data-grid-frame-width`, grid đo và đặt trên khung), để form hay chi tiết luôn nằm trong tầm nhìn khi bảng rộng hơn khung và đã cuộn ngang (Claude chốt).

### 3.8 Kéo thả và đường bàn phím

Mọi thao tác kéo dùng chung `usePointerDrag` (§5): pointer capture, ngưỡng 4px trước khi thành kéo (một lần bấm không kéo vẫn là bấm: sắp xếp, mở menu), `Esc` huỷ và trả lại như trước, `lostpointercapture` kết thúc. Bản quyết định đòi mọi thao tác kéo có đường bàn phím (WCAG 2.1.1, 2.5.7):

| Thao tác kéo | Chuột, bút | Chạm | Đường không kéo (bàn phím, menu) |
|---|---|---|---|
| Đổi độ rộng cột (tay nắm ở mép phải tiêu đề) | Có; bấm đúp: tự vừa | Có: vùng chạm 24px, `touch-action: none` (bản quyết định) | `Alt+Shift+←/→` (10px); menu cột "Tự vừa độ rộng" |
| Kéo đổi thứ tự cột (kéo tiêu đề theo chiều ngang) | Có | Không: kéo trên tiêu đề xung đột với cuộn ngang (bản quyết định) | `mod+Shift+←/→`; menu cột "Chuyển sang trái/phải" |
| Kéo tiêu đề vào thanh nhóm | Có | Không (như trên) | Menu cột "Nhóm theo cột này" (`Alt+↓` rồi chọn) |
| Kéo chip để đổi cấp nhóm | Có | Có: chip nằm trên thanh công cụ, nơi không cuộn ngang (thanh xuống dòng) (Claude chốt) | `mod+Shift+←/→` trên nút của chip; × rồi nhóm lại |
| Ghim cột | Không có thao tác kéo (kéo chỉ đổi thứ tự trong vùng) | — | Menu cột "Ghim bên trái/phải", "Bỏ ghim" (`Alt+↓` rồi chọn) |
| Kéo đổi thứ tự dòng (tay nắm ở đầu dòng) | Có | Có: tay nắm chỉ dùng để kéo, `touch-action: none` (Claude chốt) | `mod+Shift+↑/↓`; menu dòng từ tay nắm (`Enter`) |
| Kéo hộp thoại `movable` | Có | Có (≥ 640px) | Không có (§3.4) |

- **Ghim và nhóm không có tổ hợp phím riêng** (Claude chốt; bản quyết định đòi "phím tắt" cho cả hai): đường bàn phím là `Alt+↓` rồi chọn mục, hai phím, đủ cho 2.1.1. Các tổ hợp còn trống đều trùng phím của trình duyệt (`Ctrl+Shift+P`, `Ctrl+Shift+G`, `Ctrl+Shift+B`…).
- **Tự cuộn khi kéo** (`auto-scroll.ts`, §5): con trỏ cách mép khung dưới 40px thì khung cuộn theo hướng đó, nhanh dần tới 20px mỗi khung hình ở sát mép.
- **Menu cột trên màn chạm:** nút ⋮ luôn hiện ở `(hover: none)` (§4.3 G1).

### 3.9 HTML từ server và hydrate

| Điều | Cách làm |
|---|---|
| Kbd có `keys` | Dạng "nơi khác" trên server và lúc hydrate; đổi sau khi mount (§3.3) |
| Dialog `movable` | Panel chỉ render khi mở (spec giai đoạn 2 §3.3); trạng thái kéo, số đo, `matchMedia` đều sau khi mount |
| DataGrid: nội dung | Server render đủ toolbar, bảng (trang đầu; cuộn ảo: cửa sổ đầu, số dòng = `ceil(height / rowHeight) + 6` khi `height` là số px, 20 dòng khi không), tổng, thanh phân trang, với mọi thuộc tính ARIA. Không có `Date.now()`, số ngẫu nhiên hay giá trị theo nền tảng; id qua `useId` |
| DataGrid: định dạng | Theo `locale` (mặc định `'en-US'`, bản quyết định), giống nhau trên server và client, trừ khi bản ICU của Node và của trình duyệt khác nhau (§10) |
| DataGrid: số đo | Độ rộng cột co giãn, khoảng cách giữa các dòng, chiều cao `<thead>`/`<tfoot>`, bề rộng khung, `data-scrolled-*`: chỉ sau khi mount. Trước đó CSS tự chia cột co giãn (§3.7); cột có `width` không xê dịch |
| DataGrid: trạng thái lưu | Công thức docs đọc `localStorage` sau khi mount và render lại grid với `key` mới (§6.3 Lưu trạng thái), nên HTML từ server là trạng thái mặc định |

### 3.10 Chuyển động và giảm chuyển động

| Phần | Chuyển động | Khi `prefers-reduced-motion: reduce` |
|---|---|---|
| Dialog nhấc lên khi kéo (D2) | `scale: 1.02` và bóng sâu hơn, chuyển trong `--flg-duration-fast` với `--flg-ease` (thời lượng ngoài mockup) | Không phóng to (bản quyết định); bóng vẫn đổi, ngay lập tức (token thời lượng về `0ms`) |
| Dialog về giữa khi bấm đúp | Ngay, không animation | — |
| Dialog toàn màn hình (F) | Animation mở có sẵn của Dialog | Như Dialog |
| Grid: kéo cột, đổi độ rộng, kéo dòng | Bám theo con trỏ, không animation (thao tác trực tiếp) | — |
| Grid: mở/đóng nhóm, chi tiết, form | Hiện, ẩn ngay; chevron đổi hướng bằng icon khác, không xoay (Claude chốt) | — |
| Grid: cuộn tới ô khi di chuyển bằng phím | `behavior: 'auto'`, không cuộn mượt | — |
| Dòng skeleton khi tải lần đầu | Theo `Skeleton` (spec giai đoạn 4 §3.3) | Theo `Skeleton` |

Không có animation lặp mới, nên khối `prefers-reduced-motion` của `preferences.css` chỉ thêm `scale: none` cho Dialog đang kéo.

### 3.11 Cấu trúc file bổ sung

```
src/internal/        shortcut-format.ts (A), use-pointer-drag.ts (A), auto-scroll.ts (C), text-fold.ts (D),
                     download.ts (G), icons.tsx (icon mới của A, C–F; ArrowIcon 'right')
src/components/kbd/  Kbd.tsx (server-safe), kbd-keys.tsx (client), index.ts
src/components/dialog/
                     Dialog.tsx, modal.tsx (movable, fullScreenOnPhone), use-movable.ts (A)
src/components/data-grid/
                     DataGrid.tsx ('use client'), index.ts, types.ts, labels.ts, grid-context.ts,
                     engine/ (§3.5, mỗi file kèm *.test.ts; perf.test.ts),
                     parts/ (Toolbar, Caption, GroupPanel, ColumnChooser, HeaderRow, HeaderCell, FilterRow,
                       HeaderFilter, ColumnMenu, Body, DataRow, Cell, GroupRow, DetailRow, SummaryFooter,
                       Pager, FilterPanel, EmptyRow, LoadingRows, SaveBar, EditForm, EditPopup, editors,
                       DragLayer, RowMenu),
                     hooks/ (use-grid-state, use-grid-keyboard, use-virtual-rows, use-column-widths,
                       use-column-drag, use-column-resize, use-row-drag, use-editing, use-selection)
src/styles/components/
                     kbd.css (A), data-grid.css (B–F), dialog.css (A, F)
src/docs/            DataGridExample.mdx, DataGridExample.stories.tsx, data-grid-example/ (G)
tests/visual/        stories.visual.ts (data-visual-drag, A)
scripts/             rsc-probe.mjs (tham chiếu client, A), lib/contrast.ts và contrast-exceptions.ts (A–F)
```

---

## 4. Token và giao diện

### 4.1 Mockup đã duyệt

Các file nằm ở `docs/superpowers/specs/mockups/`; CSS đọc được của từng phương án nằm ở `.superpowers/mockups/pages/*.src.html` (lớp `mk-` của phương án đó) và trùng từng dòng với CSS trong trang đã duyệt. Chủ dự án chọn ngày 2026-11-13 ([trang chọn](https://claude.ai/artifact/RhQnimZwXqd4iedRgRmACq)).

| File | Câu | Đã chọn | Không chọn (không làm) |
|---|---|---|---|
| `phase-6-kbd-dialog.html` | K1 | K1-1 ô phẳng như SearchField, menu vẽ ô (`mk-k1`) | K1-2 phím nổi, K1-3 chữ không khung |
| | D1 | D1-2 tay nắm sáu chấm (`mk-d2`) | D1-1 không tay nắm, D1-3 thanh kéo trên đỉnh |
| `phase-6-grid.html` | G1 | G1 cổ điển, biểu tượng luôn hiện (`mk-o1`) | G2 liền một khối, G3 bảng tính |
| | C1 | C1 vạch mảnh, đường thả (`mk-c1`) | C2, C3 |
| `phase-6-grid-data.html` | F1 | F1 ô kính, toán tử trong ô (`mk-f1`) | F2 gạch chân, F3 chip |
| | R1 | R1 dải nền (`mk-r1`) | R2, R3 |
| `phase-6-grid-edit.html` | E1 | phương án `e2`: liền ô như bảng tính (`mk-e2`) | `e1` khung riêng, `e3` dòng nổi |
| | E2 | phương án `ef1`: thẻ kính nổi, nhãn ở trên (`mk-ef1`) | `ef2`, `ef3` |

- **Mọi số liệu ở §4.3** lấy từ CSS `mk-` của đúng phương án đó. Mockup dùng chung token của lib, nên dark khác light chỉ ở giá trị token, trừ chỗ ghi riêng (bóng nhấc lên của D2, bóng mép cột ghim của G1).
- **Phần nền của mỗi trang** (thanh công cụ và biểu tượng tiêu đề trên trang lọc và trang sửa, thanh phân trang ở trang lọc) "chỉ làm nền" (ghi chú của trang): chúng thuộc G1, nên G1 quyết định chúng; chỗ các trang lệch nhau (thứ tự nút trên thanh công cụ, cỡ phễu 22px trên trang lọc so với 20px của G1) theo G1 (Claude chốt).
- **Phần khung của trang mockup** (nhãn `mk-tag`, chú thích, con trỏ vẽ tay `mk-cur`, khung điện thoại thu nhỏ) không thuộc component. Nội dung mẫu (đơn hàng "Lumen", Badge trạng thái Mới `accent`, Đang xử lý `warning`, Đã giao `success`, Đã huỷ `danger`, Avatar người phụ trách, chi tiết DH-1024) là nội dung của người dùng, dựng lại trong story và docs qua `cell` và `renderDetail`.

### 4.2 Token mới

**Token theo theme:**

| Token | Light | Dark | `prefers-contrast: more` | Plan | Dùng ở |
|---|---|---|---|---|---|
| `--flg-dialog-lift-shadow` | `0 6px 14px rgba(0,0,0,.08), 0 36px 80px rgba(60,95,210,.45)` | `0 8px 18px rgba(0,0,0,.45), 0 40px 90px rgba(0,0,0,.85)` | — | A | Panel của Dialog đang kéo (D2, giá trị của mockup) |
| `--flg-data-grid-pin-shadow` | `color-mix(in srgb, var(--flg-text) 20%, transparent)` | `color-mix(in srgb, #000 62%, transparent)` | — | C | Bóng ở mép cột ghim khi đã cuộn (G1, giá trị của mockup) |
| `--flg-data-grid-pin-bg` | `rgb(250,251,255)` | `rgb(22,26,44)` | — | C | Nền đặc của ô ghim khi đã cuộn và của header dính (ngoài mockup: mockup chồng hai lớp `--flg-glass-tint-solid`, còn 0,4% trong suốt; đây là cùng màu, đặc hẳn) |

**Token dẫn xuất** (`derivedTokens`, Plan C): `--flg-column-resize-line: color-mix(in srgb, var(--flg-text-muted) 60%, transparent)` (vạch giữa các tiêu đề, C1); `contrastMore.shared` đặt nó thành `var(--flg-text-muted)` (đặc, để đạt 3:1), như `--flg-slider-tick` và `--flg-dropzone-border`.

- `--flg-dialog-lift-shadow`, `--flg-data-grid-pin-shadow`, `--flg-column-resize-line` là giá trị mockup: `scripts/lib/theme-css.test.ts` thêm chúng vào bảng `MOCKUP`. `--flg-data-grid-pin-bg` đánh dấu "(outside mockup)" trong `values.ts`; docs của Theming nói ứng dụng đổi `--flg-glass-tint-solid` thì đổi cả nó.

**Màu mới không thành token** (như giai đoạn 4 và 5): viết thẳng bằng `color-mix` trong CSS của component; cái nào cần đo thì `scripts/lib/contrast.ts` tự tính lại từ token gốc (§4.4).

| Màu | Giá trị | Dùng ở | Đo |
|---|---|---|---|
| Viền của Kbd trên nút đặc | `color-mix(in srgb, currentColor 45%, transparent)` | Kbd trong Button `primary`, `danger` (K1) | Không (trang trí) |
| Dải hàng nhóm cấp 1 / cấp 2 trở đi, nền dòng chi tiết | `color-mix(in srgb, var(--flg-control-track) 75%, transparent)` / `35%` | R1 | Có |
| Nền ô đã sửa và dòng mới | `color-mix(in srgb, var(--flg-accent-solid) 12%, transparent)` | E2 batch | Có |
| Quầng của ô đang sửa | `color-mix(in srgb, var(--flg-accent-solid) 18%, transparent)` | E2 | Không (quầng phụ của khung 2px) |
| Lớp phủ khi tải lại | `color-mix(in srgb, var(--flg-glass-tint-solid) 55%, transparent)` | Grid đang tải lại (ngoài mockup) | Không (nội dung bên dưới đang bận) |

### 4.3 Kích thước và giao diện từng phần

Trong mục này "kính" là lớp `flg-surface`; "focus chung" là `outline: 2px solid var(--flg-focus-outline-color); outline-offset: 2px; box-shadow: var(--flg-focus-ring)`.

#### Kbd (K1)

- **`.flg-kbd`:** `display: inline-flex; align-items: center; gap: .3em` (Apple, `[data-platform='apple']`: `gap: .05em`), `position: relative` (khối chứa của chữ ẩn), `box-sizing: border-box`, cao `1.9em`, padding `0 .55em`, viền 1px `--flg-control-border`, bo `--flg-radius-xs`, nền `--flg-control-bg-secondary`, chữ `--flg-text-muted`, font `--flg-weight-medium` `.84em/1` `--flg-font-sans`, `letter-spacing: .02em`, không xuống dòng, `vertical-align: .12em`. Ở `--flg-text-sm` (câu chữ) là cao 20px, chữ 10.5px, đúng gợi ý phím 20px của SearchField. `<kbd>` con: `font: inherit; letter-spacing: inherit` (bỏ font monospace của trình duyệt).
- **Trong Tooltip** (`.flg-tooltip .flg-kbd`): cao `1.65em`, padding `0 .4em`, `vertical-align: 0`; khi đứng sau chữ (`:not(:first-child)`) cách trái 6px. Ở cỡ chữ của tooltip là cao 16px, như gợi ý của SearchField trong tooltip.
- **Trong menu** (`.flg-menu-shortcut .flg-kbd`): `vertical-align: 0`; giữ nguyên ô, cả ở mục đang được trỏ (`[data-highlighted]`, mục có focus) (điểm mở; K1 vẽ vậy). `MenuShortcut` có `keys` vẫn mang lớp `flg-menu-shortcut` (margin trái tự động, padding trái 12px, `--flg-text-xs`), nên ô cao khoảng 18px (chữ 9.7px). `MenuShortcut` có `children` chữ giữ đúng giao diện cũ.
- **Trên nút đặc** (`.flg-button:is([data-variant='primary'], [data-variant='danger']) .flg-kbd`): cách trái 2px, nền trong suốt, viền màu chữ của nút 45%, chữ `inherit` (`--flg-on-accent`, `--flg-on-danger`), `vertical-align: 0`. Mockup vẽ nút `primary`; `danger` theo cùng quy tắc (ngoài mockup). Nút `secondary`, `ghost`: giao diện thường của Kbd.
- **Dark:** chỉ khác giá trị token.

#### Dialog kéo được (D2)

- **Header** (`DialogHeader` của `DialogContent movable`, `[data-movable]`, chỉ trong `@media (min-width: 640px)`): `display: grid; grid-template-columns: 8px minmax(0, 1fr); column-gap: 10px; row-gap: 4px; align-items: center` (row-gap bằng khoảng 4px của `.flg-card-header`); mọi con trừ tay nắm nằm ở cột 2, nên tiêu đề lùi vào 18px và tay nắm thẳng mép trái của nội dung bên dưới. `cursor: grab`, `touch-action: none`, `user-select: none`; phần tử tương tác trong header `cursor: auto` (quy tắc của chúng thắng nếu có).
- **Tay nắm** (`.flg-dialog-grip`, `aria-hidden`): hàng 1 cột 1, 8×14px, `GripIcon` (sáu chấm tròn bán kính 1.4 tại (1.5, 1.5), (6.5, 1.5), (1.5, 7), (6.5, 7), (1.5, 12.5), (6.5, 12.5), tô `currentColor`), màu `--flg-text-muted`. Header hover (`@media (hover: hover)`): `--flg-text`. Đang kéo: `--flg-accent-text`.
- **Đang kéo** (`.flg-dialog[data-dragging]`): header `cursor: grabbing`; panel `scale: 1.02`, `box-shadow: var(--flg-dialog-lift-shadow)`; panel thêm `scale` và `box-shadow` vào `transition` (`--flg-duration-fast`, ngoài mockup).
- **Dưới 640px:** tay nắm `display: none`, header về `display: flex; flex-direction: column` của `.flg-card-header`.
- **Dark:** bóng nhấc lên lấy giá trị dark của token (mockup vẽ riêng cho dark); còn lại chỉ khác giá trị token.

#### Dialog toàn màn hình trên điện thoại (EF1, plan F)

`DialogContent fullScreenOnPhone` đặt `data-full-screen="phone"` trên `<dialog>`; trong `@media (max-width: 639.98px)`:

- Khung: padding 0. Panel: rộng và cao 100%, `max-height: none`, bo 0, không viền (`border-width: 0`), padding dưới cộng `env(safe-area-inset-bottom)` (ngoài mockup).
- `DialogHeader`: thêm padding trên 18px (đúng hình điện thoại của EF1). `DialogFooter`: `margin-top: auto` (dính đáy), các nút `flex: 1` (Huỷ / Lưu chia đôi).
- Trên 640px: Dialog thường, không đổi gì.

#### DataGrid: chiều cao dòng (B)

Ô của grid **không có padding dọc**; dòng `<tr>` có `height` cố định (biến `--flg-data-grid-row-height` trên gốc) và ô căn giữa dọc, nên mọi nội dung ≤ chiều cao dòng (Avatar `sm` 24px, Badge, nút `sm` 28px, Checkbox) nằm gọn, và chiều cao không phụ thuộc nội dung (cần cho cuộn ảo). Số được dựng từ số đo của `Table` (spec giai đoạn 4 §4.3): nội dung cao nhất thường gặp (Avatar `sm`, 24px) cộng padding dọc của variant ở cỡ tương ứng, cộng vạch 1px của `lined` (Claude chốt):

| `density` | Cỡ của Table | `lined` | `striped` (+2px giữa các dòng) | `minimal` | Hàng nhóm |
|---|---|---|---|---|---|
| `compact` | `sm` | 31 | 30 | 36 | dòng − 8 |
| `standard` (mặc định) | `md` | **41** (G1) | 40 | 52 | dòng − 8 (`lined`: **33**, R1) |
| `comfortable` | `md` | 49 | 48 | 60 | dòng − 8 |

- Padding ngang, cỡ chữ, màu, vạch, nền của ô theo `Table` (`--flg-table-px`, `sm` thì chữ `--flg-text-xs`). Ô trong `<thead>` giữ padding dọc của Table (tiêu đề không cuộn ảo).
- **Grid có cột thao tác** (`editing` bật `allowUpdating` hay `allowDeleting`, hay chế độ `row`): nội dung cao nhất là nút `sm` 28px thay cho Avatar 24px, nên mọi số của dòng dữ liệu trong bảng trên **+4px** (`standard` `lined`: **45**, đúng mockup E2 và EF1). Hàng nhóm không đổi (không có cột thao tác). Chiều cao vẫn cố định cho cả grid, nên cuộn ảo không đổi (Claude chốt, sau builder check; thay cho bản nháp "dòng 41px, thấp hơn mockup E2 4px").
- `striped`: sọc theo chỉ số của dòng trong danh sách đã làm phẳng (thuộc tính `data-stripe` trên `<tr>`), không theo `:nth-child`, vì cuộn ảo bỏ và thêm `<tr>` ở đầu cửa sổ làm `:nth-child` đổi sọc khi cuộn (Claude chốt, sau builder check).

#### DataGrid: toolbar, tiêu đề, ô, chọn dòng, ghim, phân trang (G1)

- **Gốc** `.flg-data-grid`: cột `flex`, khoảng cách 14px (G1), `min-width: 0`. `.flg-data-grid-main` (thanh lưu + khung) là cột không khoảng cách.
- **Thanh công cụ** `.flg-data-grid-toolbar`: hàng `flex`, căn giữa dọc, khoảng cách 8px, `flex-wrap: wrap`, `min-width: 0`. Thứ tự: caption, thanh nhóm (R1), khoảng giãn, ô tìm kiếm, nút chọn cột, nút xuất CSV, nút thêm (G1; trang lọc và trang sửa vẽ thứ tự khác, chỉ làm nền).
  - **Caption** (`caption`, `description`): khối `.flg-card-header` (cột, khoảng cách 4px) với tiêu đề `.flg-card-title` (`--flg-text-md`, đậm `--flg-weight-semibold`, `line-height: 1.3`) và mô tả `.flg-card-description` (`--flg-text-xs`, `--flg-text-muted`), dùng thẳng lớp của Card, đúng G1. `flex: 1 1 auto; min-width: 0`; khi có thanh nhóm: `flex: none`, cách phải 12px (R1), và khoảng giãn đứng sau thanh nhóm.
  - **Ô tìm kiếm:** `SearchField` cỡ `md`, rộng 260px, `flex: none` (G1).
  - **Chọn cột, xuất CSV:** IconButton `secondary` `md` (34×34), icon `ColumnsIcon`, `DownloadIcon`; có Tooltip (tên của nút; tuỳ chọn nội bộ `describe: false`, spec giai đoạn 5 §5).
  - **Thêm:** Button `primary` `md`, `PlusIcon` rồi chữ `labels.addRow`. Khi thanh lưu batch đang hiện (có thay đổi chưa lưu): `secondary` (điểm mở; chỉ "Lưu thay đổi" là nút chính).
  - Dưới 640px (ngoài mockup): caption chiếm cả hàng; ô tìm kiếm `flex: 1 1 160px`.
- **Khung:** `.flg-table-frame` với `data-variant`, `data-size` (theo `density`), `data-sticky-header`; mọi quy tắc của `Table` (viền, bo, vạch, nền tiêu đề, sọc, hover, chọn) áp nguyên.
- **Ô tiêu đề cột** (`.flg-data-grid-head`): `position: relative` (cho tay nắm C1). Nội dung `.flg-data-grid-head-content`: `flex`, căn giữa dọc, khoảng cách 4px, `min-width: 0`; cột căn `end`: `flex-direction: row-reverse`.
  - Nút sắp xếp: đúng `.flg-table-sort` của Table (chữ, icon sắp xếp 14px: chevron lên–xuống khi chưa sắp, mũi tên khi đã sắp; cột đang sắp: chữ `--flg-text`, icon `--flg-accent-text`); chữ dài thì "…". Cột không sắp được: chữ trần.
  - **Số thứ tự sắp xếp** (`.flg-data-grid-sort-index`, khi sắp nhiều cột, `aria-hidden`): trong nút, sau icon, cách trái −3px (cột `end`: cách phải −3px), `--flg-text-2xs` đậm `--flg-weight-semibold`, `--flg-accent-text`, `line-height: 1`.
  - **Nút biểu tượng** (`.flg-data-grid-head-button`: phễu, ⋮): trong cụm `.flg-data-grid-head-icons` (`inline-flex`, `flex: none`) ngay sau nút sắp xếp. 20×20px, margin `-2px 0`, bo `--flg-radius-xs`, không viền, không nền, `--flg-text-muted`, `cursor: pointer`; svg 13px. Hover (`(hover: hover)`) và `[aria-expanded='true']`: nền `--flg-control-track`, chữ `--flg-text`. Focus: focus chung. Phễu của cột đang lọc (`[data-active]`): `--flg-accent-text` và svg `fill: currentColor` (phễu đặc: đổi hình, không chỉ màu).
  - **⋮** chỉ hiện khi tiêu đề hover, có focus hay chứa focus, hay menu đang mở; luôn hiện ở `@media (hover: none)`. Ẩn bằng `opacity: 0` (giữ chỗ, chữ không xê dịch; vẫn trong cây truy cập).
- **Ô có focus** (G1): `box-shadow: inset 0 0 0 2px var(--flg-accent-solid)` (vuông, bên trong ô) cộng `outline: 2px solid var(--flg-focus-outline-color); outline-offset: -2px` (trong suốt ở mặc định; là dấu hiệu ở `prefers-contrast: more`), khi `:focus-visible` (điểm mở: khung vẽ bằng accent đặc, vì `--flg-focus-outline-color` trong suốt ở mặc định). Ô đầu của dòng đã chọn ở `lined` ghép cả vạch 3px: `inset 3px 0 0 var(--flg-accent-solid), inset 0 0 0 2px var(--flg-accent-solid)`. Tiêu đề cột có focus: cùng khung. Hàng nhóm có focus: khung 2px quanh cả hàng (cạnh trên, dưới trên mọi ô; trái ở ô đầu, phải ở ô cuối).
- **Dòng hover, dòng chọn:** đúng `Table` (`--flg-control-track`; `--flg-accent-subtle` cộng vạch 3px ở `lined`).
- **Cột chọn dòng:** 40px; Checkbox của lib; tiêu đề là Checkbox "chọn tất cả" (`indeterminate` khi chọn một phần).
- **Hàng tiêu đề của dòng** (cột `rowHeader`): `<th scope="row">`, chữ `--flg-weight-medium` như tiêu đề hàng của Table.
- **Cột ghim** (G1): ô cuối của vùng ghim trái có `box-shadow: inset -1px 0 0 var(--flg-control-border)` (vạch luôn có); khi đã cuộn (`[data-scrolled-left]`), thêm `::after` tuyệt đối `top: 0; bottom: -1px; left: 100%; width: 14px`, nền `linear-gradient(90deg, var(--flg-data-grid-pin-shadow), transparent)`, `pointer-events: none`. Vùng ghim phải đối xứng (`inset 1px 0 0`, `right: 100%`, gradient 270deg, khi `[data-scrolled-right]`). Nền đặc chỉ khi đã cuộn (§3.7); ô tiêu đề ghim: `linear-gradient(var(--flg-table-head-bg), var(--flg-table-head-bg)), var(--flg-data-grid-pin-bg)`; hover và chọn qua `::before`.
- **Thanh phân trang** (`.flg-data-grid-pager`): hàng `flex`, căn giữa dọc, khoảng cách 10px. Đếm (`labels.pageInfo`, "1–12 of 135"): `--flg-text-muted` `--flg-text-sm`, `tabular-nums`, không xuống dòng. Chọn số dòng: `Select` cỡ `sm`, rộng 116px, chữ `labels.pageSize(n)` ("12 / page"), tên `labels.rowsPerPage`. Khoảng giãn. `Pagination` của lib (nút `ghost` `sm`, tên trang qua `labels`).
- **Đang tải lần đầu** (ngoài mockup): đủ dòng của một trang (tối đa 20), mỗi ô dữ liệu một `Skeleton` `text` `pulse` rộng 40–80% (theo chỉ số cột, cố định). **Đang tải lại:** `.flg-data-grid-overlay` phủ phần thân (dưới `<thead>`), nền lớp phủ của §4.2, `Spinner` `md` ở giữa phần thấy được, chặn con trỏ.
- **Trống** (ngoài mockup, theo khối "trống do lọc" của F1): một dòng, ô trải mọi cột, padding `26px 12px`, căn giữa, được xuống dòng; tiêu đề `labels.noData` `--flg-text-sm` đậm `--flg-weight-semibold`; không icon, không nút.
- **Dark:** chỉ khác giá trị token, trừ `--flg-data-grid-pin-shadow` (đen 62%).

#### DataGrid: thao tác cột (C1)

- **Tay nắm đổi độ rộng** (`.flg-data-grid-resizer`, trong ô tiêu đề có `allowResizing`): tuyệt đối, `z-index: 3`, `top: 0; bottom: 0; right: -5px`, rộng 10px, `flex` căn giữa, `cursor: col-resize`, `touch-action: none`; ở `@media (pointer: coarse)`: `right: -12px`, rộng 24px (WCAG 2.5.8). `::before`: 1×14px, nền `--flg-column-resize-line` (vạch mảnh luôn có). Hover và đang kéo: `::before` 3px × 100%, bo 2px, `--flg-accent-solid`.
- **Đang kéo độ rộng:** cột đổi rộng ngay theo con trỏ (bản quyết định); đường dẫn `.flg-data-grid-resize-guide` tuyệt đối trong khung, rộng 2px, `--flg-accent-solid`, từ mép dưới của `<thead>` tới đáy phần thấy được của khung, thẳng tâm tay nắm; nhãn `.flg-data-grid-width-pill` (`aria-hidden`, `labels.columnWidth(px)`, "180 px"): đỉnh cách mép dưới của tiêu đề 10px, mép phải cách đường dẫn 6px về bên trái, padding `2px 8px`, viền 1px `--flg-accent-solid`, bo `--flg-radius-full`, nền `--flg-glass-tint-solid`, chữ `--flg-text` đậm `--flg-weight-semibold` `--flg-text-2xs`/1.3, `tabular-nums`, không xuống dòng. `cursor: col-resize` trên cả trang trong lúc kéo.
- **Kéo cột:** ô tiêu đề và mọi ô của cột gốc `opacity: .35`. Bóng là chip `.flg-surface.flg-data-grid-drag-chip` trong top layer (`popover="manual"`, `pointer-events: none`), cách con trỏ 16px sang phải và 16px xuống (theo hình): `inline-flex`, căn giữa, khoảng cách 4px, padding `5px 11px 5px 7px`, bo `--flg-radius-full`, chữ `--flg-text` đậm `--flg-weight-semibold` `--flg-text-xs`/1.3, `GripVerticalIcon` 13px `--flg-text-muted` trước chữ. Chỗ thả: `.flg-data-grid-drop-line` tuyệt đối trong khung, rộng 3px, cao hết phần thấy được của khung, `--flg-accent-solid`, tâm lệch −0.5px khỏi ranh giới hai cột (`left: ranh giới − 2px`); `::before` là chấm 7×7px tròn `--flg-accent-solid` ở đỉnh, `left: -2px`. `cursor: grabbing`.
- **Menu cột:** menu của lib (`.flg-menu`, kính), rộng 236px, mở dưới nút ⋮ (`align: start`, cách 4px) hay tại con trỏ (chuột phải). Các nhóm, cách nhau bằng `MenuSeparator` (menu phẳng, không nhãn nhóm), mỗi mục có icon 15px:
  1. Sắp xếp tăng (`ArrowIcon` up), Sắp xếp giảm (`ArrowIcon` down), Bỏ sắp xếp (`ChevronsUpDownIcon`; tắt khi cột chưa sắp). Khi `allowSorting`.
  2. Nhóm theo cột này (`GroupIcon`; E). Khi có thanh nhóm hay `grouping` và `allowGrouping`.
  3. Ghim bên trái (`PinLeftIcon`), Ghim bên phải (`PinRightIcon`), và khi cột đang ghim: Bỏ ghim (`PanelIcon`) (điểm mở); mục của phía đang ghim tắt. Khi `allowPinning`.
  4. Chuyển sang trái (`ArrowIcon` left), Chuyển sang phải (`ArrowIcon` right) (tắt ở mép vùng của cột, điểm mở), Tự vừa độ rộng (`MoveHorizontalIcon`). Khi `allowReordering` / `allowResizing`.
  5. Ẩn cột (`EyeOffIcon`). Khi `allowHiding` và còn hơn một cột dữ liệu đang hiện.
  - Nhóm không có mục nào thì bỏ cả nhóm và đường kẻ của nó.
- **Chọn cột:** `Popover` của lib từ nút chọn cột, `side="bottom" align="end"`, có mũi tên, rộng 220px, cột `flex` khoảng cách 9px. Tiêu đề `labels.columnChooser` (`--flg-text-sm`, đậm `--flg-weight-semibold`, `--flg-text`). Danh sách cột theo thứ tự hiện tại (cột đang nhóm không có mặt: chúng ở thanh nhóm), khoảng cách 9px, mỗi cột một `Checkbox` có nhãn; bật/tắt là đổi ngay (không có nút OK). Cột `allowHiding: false`: Checkbox đã chọn và tắt, cùng hàng (`flex`, hai đầu) với icon ổ khoá `LockIcon` 13px `--flg-text-muted` (`aria-hidden`; Checkbox có mô tả ẩn `labels.lockedColumn`).
- **Dark:** chỉ khác giá trị token.

#### DataGrid: lọc (F1)

- **Hàng lọc** (`.flg-data-grid-filter-row`, hàng thứ hai của `<thead>`): ô padding `6px 5px`, ô đầu padding trái 8px, ô cuối padding phải 8px, căn giữa dọc; nền như ô tiêu đề.
  - Chuỗi, số: `Input` cỡ `sm`, khoảng cách 4px, padding trái 3px; ô số căn chữ cuối dòng. Đầu ô là nút toán tử (`.flg-data-grid-operator`): 20×20px, lưới căn giữa, bo `--flg-radius-xs`, không viền, không nền, `--flg-text-muted`, svg 13px; cột có điều kiện ở hàng lọc (`[data-active]`): nền `--flg-accent-subtle`, chữ `--flg-accent-text`. Icon theo toán tử (§4.6).
  - Ngày: `DatePicker` cỡ `sm` với nút toán tử ở đầu ô; nút lịch 20×20px, svg 14px, cách phải −4px.
  - Boolean: `Select` cỡ `sm`: (Tất cả) / Có / Không, không có nút toán tử.
  - Lookup: `Select` cỡ `sm` với các mục của lookup và chữ chờ `labels.all` ("(All)"), không có nút toán tử (điểm mở).
  - "Trong khoảng" (ngoài mockup): ô là `Input` chỉ đọc ghi "1 – 5" (hay chữ chờ `labels.between`), bấm hay `Enter` mở một Popover giống Popover lọc ở header: hai `Field` "From", "To" với trình sửa của kiểu, Huỷ / OK.
  - Menu toán tử: menu của lib, `MenuRadioGroup` các toán tử của kiểu dữ liệu, mục đang chọn có chấm, icon 15px trước chữ.
- **Popover lọc ở header:** kính `.flg-popover` có mũi tên, `side="bottom" align="center"` từ phễu, rộng 216px, cột `flex` khoảng cách 9px. Trên cùng: `SearchField` cỡ `sm` (chữ chờ `labels.searchValues`). Danh sách (`.flg-data-grid-value-list`): cột, mỗi dòng một `Checkbox` cao 28px, padding `0 4px`; dòng đầu "(Select all)" (`indeterminate` khi chọn một phần), rồi `Divider` margin `3px 0`, rồi các giá trị, cuối cùng "(Blanks)" chữ `--flg-text-muted`. Danh sách cuộn khi cao quá 252px (9 dòng, ngoài mockup). Đáy: hàng `flex` căn cuối, khoảng cách 6px: Huỷ (`secondary` `sm`), OK (`primary` `sm`).
- **Tô sáng của tìm kiếm** (`mark.flg-data-grid-match`): margin `0 -1px`, padding 1px, bo 3px, nền `--flg-highlight-bg`, chữ `--flg-highlight-text`, đậm `--flg-weight-semibold`. Trong một dòng đang chọn, nền `--flg-highlight-bg` trùng `--flg-accent-subtle` của dòng, nên phần khớp gần như chỉ còn chữ đậm (1.13:1 so với dòng). Spec không thêm màu riêng (Claude chốt, điểm mở): tô sáng chỉ là dấu hiệu phụ (dòng đó đã nằm trong kết quả), và chữ đậm vẫn còn.
- **Thanh bộ lọc** (`.flg-data-grid-filter-panel`, giữa khung và thanh phân trang, chỉ khi có điều kiện theo cột): hàng `flex`, căn giữa dọc, khoảng cách 8px, cao tối thiểu 38px, padding `3px 6px 3px 12px`, viền 1px `--flg-control-border`, bo `--flg-radius-md`, nền `--flg-control-bg-secondary`, chữ `--flg-text` `--flg-text-sm`. Icon phễu 14px `--flg-accent-text`; chữ điều kiện: tên cột đậm `--flg-weight-semibold`, toán tử chữ thường, giá trị trong ngoặc đơn `‘ ’`, "và" (`labels.and`) màu `--flg-text-muted`; tập giá trị của lọc ở header ghi "thuộc (Đang xử lý)" (`labels.isAnyOf`) hay `labels.isNoneOf`. Nút "Xoá bộ lọc" Button `ghost` `sm` chữ `--flg-accent-text` (svg 13px nếu có). Khoảng giãn. `Switch` "Áp dụng bộ lọc" (`labels.applyFilter`).
- **Trống do lọc:** ô trải mọi cột, padding `26px 12px`, căn giữa, xuống dòng được; bên trong cột căn giữa khoảng cách 8px: vòng 38px nền `--flg-control-track` với `FunnelXIcon` 18px `--flg-text-muted`; tiêu đề `labels.noMatches` `--flg-text-sm` đậm `--flg-weight-semibold`; Button `secondary` `sm` "Xoá bộ lọc".
- **Dark:** chỉ khác giá trị token.

#### DataGrid: nhóm, tổng, master-detail (R1) và kéo dòng (ngoài mockup)

- **Thanh nhóm** (`.flg-data-grid-group-panel`, `role="group"`, tên `labels.groupPanel`): `flex`, căn giữa dọc, khoảng cách 6px, cao tối thiểu 34px, padding `3px 4px 3px 10px`, viền 1px `--flg-control-border`, bo `--flg-radius-md`, nền `--flg-control-bg-secondary` (khay). Nhãn "Nhóm theo" (`labels.groupBy`): `--flg-text-muted` `--flg-text-xs` đậm `--flg-weight-medium`. Giữa hai chip: `ChevronIcon` phải 14px `--flg-text-muted` (`aria-hidden`).
  - **Chip** (`.flg-data-grid-group-chip`): `inline-flex`, căn giữa, khoảng cách 1px, cao 26px, padding `0 3px 0 10px`, bo `--flg-radius-full`, nền `--flg-control-track`, chữ `--flg-text` `--flg-text-xs` đậm `--flg-weight-medium`, không xuống dòng, `cursor: grab`. Hai nút 20×20px bo tròn, không nền, `--flg-text-muted`, icon 12px: chiều (`ArrowIcon` up/down; nút đầu cách trái 3px) và bỏ nhóm (`CloseIcon`). Không tay nắm (§1).
  - **Rỗng:** padding `0 14px`, khoảng cách 8px, `--flg-text-muted` `--flg-text-xs`, `GroupIcon` 15px, chữ `labels.groupPanelHint`.
  - **Đang có tiêu đề hay chip kéo qua** (ngoài mockup): viền khay `--flg-accent-solid`, và một vạch 3px `--flg-accent-solid` cao 26px ở chỗ sẽ chèn.
- **Cột phục vụ:** mỗi cấp nhóm một cột 28px ở đầu (sau cột chọn dòng), cột mở chi tiết 40px. Ô của các cột này không padding, căn giữa. Ở `<thead>` chúng gộp thành một ô (`colspan`) với chữ ẩn `labels.groupsAndDetails`.
- **Hàng nhóm** (`.flg-data-grid-group-row`): cấu trúc: ô thụt (không dải) cho mỗi cấp trên nó, ô chevron (`ChevronIcon` 16px trong khung 22×22px, `--flg-text-muted`; phải khi đóng, xuống khi mở), ô tiêu đề trải tới trước cột đầu tiên có tổng nhóm, rồi mỗi cột sau đó một ô (trống hay tổng). Nền dải trên mọi ô trừ ô thụt: cấp 1 `control-track` 75%, cấp 2 trở đi 35% (§4.2). Chữ tiêu đề: tên cột và dấu hai chấm `--flg-text-muted`, giá trị đậm `--flg-weight-semibold` (`labels.blank` khi rỗng), số dòng "(4)" `--flg-text-muted`; nhóm bị cắt ngang trang thêm `labels.continued`. Tổng nhóm: nhãn ("Tổng:", `labels.summary.sum`) `--flg-text-muted` `--flg-weight-regular`, giá trị đậm `--flg-weight-semibold`, căn theo cột của nó ("Tổng:" thẳng cột Thành tiền). Tổng của cột nằm trong phần ô tiêu đề (cột dữ liệu đầu tiên) ghi ngay sau số dòng. `cursor: pointer`.
- **Tổng cuối bảng** (`<tfoot>`, dính dưới): đúng hàng chân của `Table` theo variant (`lined`: nền `--flg-control-bg-secondary`, vạch trên, đậm `--flg-weight-semibold`). Ô của các cột phục vụ gộp lại, trống. Nhãn chỉ khi mục tổng có `label` (R1: "Số đơn: 12"), hay khi kiểu khác `sum` (`labels.summary`); `sum` không có nhãn (R1).
- **Nút mở chi tiết** (`.flg-data-grid-detail-toggle`): 24×24px, bo `--flg-radius-xs`, không viền, không nền, `--flg-text-muted`, `ChevronIcon` 16px (phải / xuống); hover và `[aria-expanded='true']`: nền `--flg-control-track`, chữ `--flg-text`.
- **Dòng chi tiết** (`.flg-data-grid-detail-row`): ô thụt không dải, rồi ô trải phần còn lại, padding `12px 16px 14px`, xuống dòng được, nền dải 35% (R1). Nội dung là `renderDetail(row)`, nằm dính trái trong bề rộng khung (§3.7).
- **Kéo dòng** (ngoài mockup; theo D2 và C1): cột tay nắm 28px đầu dòng; tay nắm là nút 20×24px, không nền, `GripIcon` 8×14px `--flg-text-muted`; hover `--flg-text`, đang kéo `--flg-accent-text`, `cursor: grab`. Dòng gốc `opacity: .35`; chip kéo như C1 với chữ là tên dòng; chỗ thả là vạch ngang 3px `--flg-accent-solid` dài hết bề rộng thấy được của khung, chấm 7px ở đầu trái. Khi đang sắp xếp hay nhóm: nút tắt (`aria-disabled`, `opacity: .5`) và Tooltip `labels.reorderDisabled`.
- **Dark:** chỉ khác giá trị token.

#### DataGrid: sửa tại chỗ (E2)

- **Ô đang có trình sửa** (`.flg-data-grid-cell[data-editor]`): padding 0, nền `--flg-control-bg`. Trong chế độ `row`, mọi ô sửa được của dòng đang sửa có thêm `box-shadow: inset 1px 0 0 var(--flg-control-border), inset -1px 0 0 var(--flg-control-border)` (vạch hai bên); ở `cell`, `batch` chỉ ô đang sửa, và nó luôn có focus.
- **Trình sửa trong ô:** khung `.flg-input` cao `--flg-control-h-md` (34px; `compact`: `--flg-control-h-sm`), viền trong suốt, bo 0, nền trong suốt, không bóng, không outline (focus vẽ trên ô); nút −/+ của `NumberInput` bo 0. Dòng giữ chiều cao (E2).
- **Ô đang sửa có focus** (`:focus-within`): `outline: 2px solid var(--flg-focus-outline-color); outline-offset: -2px; box-shadow: inset 0 0 0 2px var(--flg-accent-solid), inset 0 0 0 5px color-mix(in srgb, var(--flg-accent-solid) 18%, transparent)`.
- **Ô có lỗi** (`[data-invalid]`): `box-shadow: inset 0 0 0 2px var(--flg-danger)` (cả khi không focus: ngoài mockup, vì lỗi phải thấy được khi focus đã đi); `AlertCircleIcon` 16px `--flg-danger` ở cuối khung nhập. Lời báo là Tooltip của lib, `side="bottom" align="start"`, cách 6px: `AlertCircleIcon` 14px `--flg-danger`, khoảng cách 6px, rồi chữ; mở khi ô có focus hay con trỏ ở trên.
- **Cột thao tác** (`.flg-data-grid-actions`, 72px, căn cuối, padding ngang `4px 8px`): các IconButton `sm` (28px), khoảng cách 2px; Lưu ✓ (`CheckIcon`, `primary`) và Huỷ ✕ (`CloseIcon`, `ghost`) cách nhau 4px; Sửa (`PencilIcon`), Xoá (`TrashIcon`), Hoàn tác (`UndoIcon`) là `ghost`. Mỗi nút có tên và Tooltip (`describe: false`). Sửa / Xoá ở chế độ `row`, `cell`, `batch`: `opacity: 0`, hiện khi dòng hover, chứa focus hay chứa ô hoạt động, luôn hiện ở `(hover: none)` (E2); ở chế độ `form` và `popup`: luôn hiện (EF1) (§1). Lưu / Huỷ của dòng đang sửa và Hoàn tác của dòng chờ xoá luôn hiện. Tiêu đề của cột là chữ ẩn `labels.actions`.
- **Batch:**
  - Ô đã sửa (`[data-changed]`): nền accent 12% (§4.2), `outline: 1.5px dashed var(--flg-accent-solid); outline-offset: -4px`; chữ ẩn `labels.changedCell` sau giá trị.
  - Dòng mới (`[data-new]`): mọi ô nền accent 12%; ô của cột tiêu đề dòng (hay cột đầu) là `.flg-data-grid-new-key`: `inline-flex`, khoảng cách 4px, `--flg-accent-text` đậm `--flg-weight-semibold`, `PlusIcon` 14px, chữ `labels.newRow` ("(new)") `--flg-text-muted` `--flg-weight-regular` nghiêng. Ô chỉ đọc mà rỗng của dòng mới: "—" `--flg-text-muted` (`aria-hidden`).
  - Dòng chờ xoá (`[data-deleted]`): mọi ô nền `--flg-highlight-danger-bg`, chữ `--flg-text-muted`, gạch ngang (cả Badge); ô thao tác không gạch, có nút Hoàn tác. Chữ ẩn `labels.deletedRow` ở ô đầu.
  - **Thanh lưu** (`.flg-data-grid-savebar`, gắn liền đỉnh khung): `flex`, căn giữa dọc, khoảng cách 8px, padding `5px 6px 5px 12px`, viền 1px `--flg-control-border` trừ cạnh dưới, bo `--flg-radius-md --flg-radius-md 0 0`, nền `--flg-accent-subtle`, chữ `--flg-text` `--flg-text-sm` đậm `--flg-weight-semibold`. `PencilIcon` 15px `--flg-accent-text`, chữ `labels.unsavedChanges(n)`, khoảng giãn, "Bỏ thay đổi" Button `ghost` `sm`, "Lưu thay đổi" Button `primary` `sm`. Khi thanh hiện, khung bỏ bo hai góc trên.
- **Lỗi khi lưu:** `Alert` `status="error"` (variant mặc định `stripe`) có nút đóng, giữa thanh công cụ và `.flg-data-grid-main` (ngoài mockup).
- **Dark:** chỉ khác giá trị token.

#### DataGrid: form và popup (EF1)

- **Dòng form** (chế độ `form`): thay chỗ dòng đang sửa; một ô trải mọi cột, padding `10px 10px 12px`, xuống dòng được. Bên trong: thẻ kính nổi `.flg-surface.flg-card.flg-data-grid-form` (bóng kính có sẵn), khoảng cách 14px, padding 16px, dính trái trong bề rộng khung (§3.7), `container-type: inline-size`.
  - Đầu: hàng `flex`, căn đường chữ, khoảng cách 10px: tiêu đề (`labels.editRowTitle(name)` hay `labels.newRowTitle`) `--flg-text-sm` đậm `--flg-weight-semibold` `--flg-text`; dòng phụ `labels.requiredHint` `--flg-text-xs` `--flg-text-muted` (chỉ khi có cột `required`).
  - Lưới trường (`.flg-data-grid-form-fields`): một cột; từ `@container (min-width: 480px)` hai cột `1fr 1fr`, khoảng cách `12px 20px` (một ranh giới duy nhất, bài học container query của Stepper, spec giai đoạn 4 §3.5). Thứ tự theo thứ tự cột của lưới; trường dài (`multiline`, hay `form.span: 2`) trải hai cột. Mỗi trường một `Field` của lib, nhãn ở trên (mặc định của Field), `*` khi có `required`, lỗi ở chỗ lỗi của Field. `NumberInput` rộng tối đa 180px, `DatePicker` 240px. Cột không sửa được: nhãn (`<span>`) và giá trị chữ (`.flg-data-grid-form-static`: `flex`, căn giữa dọc, cao `--flg-control-h-md`, `--flg-text-sm`, `tabular-nums`) (điểm mở).
  - Đáy: hàng `flex` căn cuối, khoảng cách 8px: Huỷ (`secondary` `sm`), Lưu (`primary` `sm`).
- **Popup** (chế độ `popup`): `Dialog` của lib, `size` mặc định `lg` (640px), `fullScreenOnPhone`. `DialogHeader` với `DialogTitle` (cùng chữ như form) và `DialogDescription` (`labels.requiredHint`); lưới trường như form (hai cột trên màn rộng); `DialogFooter`: Huỷ (`secondary` `md`), Lưu (`primary` `md`). Dưới 640px: toàn màn hình, một cột, Huỷ / Lưu chia đôi ở đáy (§Dialog toàn màn hình).
- **Dark:** chỉ khác giá trị token.

### 4.4 Tương phản (bổ sung cho §4.9 của spec 0+1)

`scripts/check-contrast.ts` đo thêm các cặp sau, trên kính thường và trên panel phủ lớp tối (spec giai đoạn 2 §4.4), lấy số thấp nhất trên mọi nền tham chiếu và mọi điểm màu của viền kính. Plan làm phần nào đo cặp của phần đó. Các số dưới đây Claude đã đo khi viết spec bằng chính các hàm của `scripts/lib/contrast.ts` (`parseColor`, `composite`, `contrastRatio`, `paintStops`, `tokensFor`; làm tròn xuống); plan đo lại khi viết check và dùng số của script.

**Cặp mới** ("+" là `prefers-contrast: more`, với các quy tắc của chế độ đó ở cuối mục này):

| Check | Plan | Cặp | Ngưỡng | Light | Dark | Light + | Dark + |
|---|---|---|---|---|---|---|---|
| `kbd-key-text` | A | Chữ `--flg-text-muted` của Kbd trên `--flg-control-bg-secondary`, thấp nhất của: trên kính (câu chữ, menu), trên `--flg-control-bg` (nút `secondary`), trên mục menu đang được trỏ (`--flg-highlight-bg`), trong tooltip | 4.5 | 6.71 | **3.23** | 6.28 | 7.63 |
| `dialog-grip` | A | Tay nắm D2: `--flg-text-muted` (nghỉ) và `--flg-accent-text` (đang kéo) trên panel | 3 | 3.95 | 4.10 | 5.95 | 9.29 |
| `grid-cell-focus` | B | Khung 2px `--flg-accent-solid` của ô có focus so với nền của ô: kính, dòng hover, dòng đã chọn | 3 | **2.45** | **1.86** | 6.07 | 7.42 |
| `grid-head-icon` | C | Phễu, ⋮ (`--flg-text-muted`) và phễu đang lọc (`--flg-accent-text`) trên nền tiêu đề `lined` (cả khi dính, trên nền đặc) | 3 | 5.42 | 3.64 | 6.09 | 7.90 |
| `grid-resize-line` | C | Vạch giữa các tiêu đề (`--flg-column-resize-line`) và vạch 3px khi hover hay kéo (`--flg-accent-solid`), trên nền tiêu đề | 3 | **2.78** | **2.02** | 6.22 | 6.31 |
| `grid-filter-operator` | D | Icon toán tử: `--flg-text-muted` trên `--flg-control-bg`, và `--flg-accent-text` trên `--flg-accent-subtle` khi cột đang lọc | 3 | 4.81 | 3.37 | 5.07 | 6.37 |
| `grid-search-match` | D | Chữ `--flg-highlight-text` trên phần khớp (`--flg-highlight-bg`), cả trong dòng đã chọn | 4.5 | 7.46 | 5.01 | 6.28 | 8.15 |
| `grid-empty-icon` | D | `FunnelXIcon` `--flg-text-muted` trên vòng `--flg-control-track` | 3 | 4.10 | 3.36 | 6.07 | 7.81 |
| `grid-group-text` | E | Chữ `--flg-text` trên dải hàng nhóm (75%, 35%) | 4.5 | 8.47 | 5.59 | 12.58 | 11.55 |
| `grid-group-text-muted` | E | Chữ `--flg-text-muted` (tên cột, số dòng, "Tổng:") và chevron trên dải hàng nhóm, thấp nhất của hai cấp | 4.5 | **4.33** | **3.53** | 6.44 | 8.46 |
| `grid-chip-text` | E | Chữ `--flg-text` của chip (`--flg-control-track`) trên khay | 4.5 | 10.84 | 4.55 | 12.12 | 8.85 |
| `grid-chip-icon` | E | Icon nút của chip (`--flg-text-muted`) trên chip | 3 | 5.55 | 3.02 | 6.20 | 6.49 |
| `grid-edit-invalid` | F | Khung 2px `--flg-danger` của ô có lỗi trên `--flg-control-bg`; icon lỗi trong tooltip | 3 | 5.98 | 5.65 | 8.16 | 11.80 |
| `grid-changed-frame` | F | Khung nét đứt `--flg-accent-solid` của ô đã sửa trên nền accent 12% của nó | 3 | **2.69** | **2.11** | 6.07 | 7.42 |
| `grid-new-row-text` | F | Trên nền accent 12%: "+" và chữ `--flg-accent-text` của dòng mới, "(new)" `--flg-text-muted` | 4.5 | **3.49** | **3.78** | 5.95 | 9.29 |
| `grid-wash-badge` | F | Chữ của Badge (năm kiểu) trên nền accent 12% của dòng mới và ô đã sửa | 4.5 | **3.04** | **3.44** | đạt | đạt |
| `grid-deleted-text` | F | Chữ `--flg-text-muted` của dòng chờ xoá trên `--flg-highlight-danger-bg` | 4.5 | **3.97** | **3.16** | 7.65 | 10.43 |
| `grid-deleted-badge` | F | Chữ của Badge trên nền của dòng chờ xoá | 4.5 | **2.71** | **2.83** | đạt | đạt |
| `grid-savebar` | F | Chữ `--flg-text` và `PencilIcon` (`--flg-accent-text`, ngưỡng 3) trên `--flg-accent-subtle` của thanh lưu | 4.5 / 3 | 8.54 / 3.40 | 5.76 / 3.76 | 12.42 / 4.94 | 11.19 / 7.31 |

Số in đậm là dưới ngưỡng ở theme mặc định. Ở `kbd-key-text`, dark là 3.64 trên kính và trong menu, 3.31 trên nút `secondary`, 3.23 trên mục đang được trỏ, 3.76 trong tooltip. "đạt" là Badge trên bề mặt sau khi chế độ "+" bỏ nền (check Badge đã có).

**Cặp đã có trong §4.9, được mở rộng** (cùng cặp màu, nên cùng số đo; không thêm check, chỉ sửa nhãn trong `contrast-exceptions.ts`):

| Dòng §4.9 | Vị trí mới |
|---|---|
| 1 (viền control) | Input, Select, DatePicker của hàng lọc; khung của popover lọc ở header |
| 2 (vòng focus) | Nút sắp xếp, phễu, ⋮ của grid, nút của toolbar, thanh nhóm, thanh lưu, cột thao tác, thanh phân trang; ô Checkbox của cột chọn dòng |
| 3 (viền focus của Input, dark 2.06) | Khung 2px `--flg-accent-solid` của ô đang sửa trên `--flg-control-bg` (E2) |
| 4 (chữ trắng trên gradient nhấn, dark 3.63 / 2.24) | Kbd trên Button `primary` (điểm mở: nhãn của nút đã như vậy từ trước) |
| 6 (`--flg-text-muted` trên bề mặt) | Đếm của thanh phân trang; "(Blanks)" của popover lọc; dòng phụ của form; ổ khoá của chọn cột |
| 9, 12, 32, 33, 34 (chữ mờ và Badge trên dòng chọn, dòng hover, sọc) | Các dòng tương ứng của DataGrid, vì grid vẽ dòng bằng lớp của Table |
| 14 (`--flg-accent-solid` so với bề mặt, dark 2.29) | Vạch thả 3px của kéo cột và kéo dòng; đường dẫn 2px khi đổi độ rộng |
| 20 (`--flg-accent-text` trên `--flg-control-bg-secondary`, dark 3.79) | Số thứ tự sắp xếp trong tiêu đề `lined`; "Xoá bộ lọc" của thanh bộ lọc |
| 22 (`--flg-text-muted` trên `--flg-control-bg-secondary`, dark 3.64) | Tiêu đề cột của grid `lined`; "và" của thanh bộ lọc; nhãn "Group by" và gợi ý của thanh nhóm |

**Dòng mới của §4.9 (cần chủ dự án duyệt).** Đúng như mockup, nên theo spec giai đoạn 2 §4.4 chúng thành dòng mới, kèm số đo làm tròn xuống, và được nêu trong mô tả PR của plan thêm chúng:

| # | Plan | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
|---|---|---|---|---|---|---|
| 37 | A | Chữ của `Kbd` (`--flg-text-muted` trên `--flg-control-bg-secondary`) trong câu chữ, menu, mục menu đang được trỏ, nút `secondary`, tooltip | đạt (6.71) | 3.23 | 4.5:1 | 1.4.3 |
| 38 | C | Vạch đổi độ rộng giữa các tiêu đề cột (60% chữ mờ) và vạch 3px khi hover hay kéo (`--flg-accent-solid`), trên nền tiêu đề | 2.78 | 2.02 | 3:1 | 1.4.11 |
| 39 | B | Khung 2px `--flg-accent-solid` của ô có focus so với ô (kính, dòng hover, dòng đã chọn) | 2.45 | 1.86 | 3:1 | 1.4.11 |
| 40 | E | Chữ `--flg-text-muted` trên dải của hàng nhóm (tên cột, số dòng, "Tổng:"), cấp 1 và cấp 2 | 4.33 | 3.53 | 4.5:1 | 1.4.3 |
| 41 | F | Khung nét đứt `--flg-accent-solid` của ô đã sửa trên nền accent 12% của nó | 2.69 | 2.11 | 3:1 | 1.4.11 |
| 42 | F | Trên nền accent 12% của dòng mới và ô đã sửa: chữ "+ (new)" của dòng mới (3.49 / 3.78) và chữ của Badge (3.04 / 3.44) | 3.04 | 3.44 | 4.5:1 | 1.4.3 |
| 43 | F | Dòng chờ xoá: chữ mờ (3.97 / 3.16) và chữ của Badge (2.71 / 2.83) trên `--flg-highlight-danger-bg`, đã gạch ngang | 2.71 | 2.83 | 4.5:1 | 1.4.3 |

- Dòng 37: check `kbd-key-text`; 38: `grid-resize-line`; 39: `grid-cell-focus`; 40: `grid-group-text-muted`; 41: `grid-changed-frame`; 42: `grid-new-row-text`, `grid-wash-badge`; 43: `grid-deleted-text`, `grid-deleted-badge`.
- Bối cảnh khi duyệt (không miễn tiêu chí): phím tắt của Kbd còn được nói bằng chữ ẩn; tay nắm đổi độ rộng có đường bàn phím và menu; vòng focus chung của lib (dòng 2) còn thấp hơn khung của ô; hàng nhóm còn có chevron, chữ đậm và `aria-level`; ô đã sửa còn chữ ẩn "changed"; dòng mới có "+" và chữ; dòng chờ xoá có gạch ngang, nút hoàn tác và chữ ẩn.
- Cả bảy dòng đều đạt ở `prefers-contrast: more` (cột "+" ở trên). Theo quy tắc của dự án, chỗ sửa tương phản đi vào chế độ người dùng bật; theme mặc định giữ đúng mockup.

**Không đo:** vạch mép và bóng của cột ghim (ranh giới trang trí, như vạch của Table); bóng nhấc lên của Dialog; chip đang kéo, mờ 35% của cột hay dòng gốc khi kéo (tạm thời, trong lúc kéo); viền 45% của Kbd trên nút đặc; quầng 18% của ô đang sửa; lớp phủ khi tải lại (nội dung bên dưới đang bận, như phần tắt); nền của phần khớp so với dòng (dấu hiệu phụ, §4.3 F1); nhãn "180 px" (chữ `--flg-text` trên nền đặc, 13.77 trở lên); nội dung của dòng chi tiết (của người dùng: docs dùng `--flg-text`, không dùng `--flg-text-muted`, trên dải 35%); mọi nền hover; mọi phần tắt.

**`prefers-contrast: more`:** mọi cặp mới phải đạt (lớp 4 (b) ở §7). Ngoài phần token đã có của chế độ này và quy tắc của `Table` (dòng hover, dòng chọn, sọc không có nền; dòng chọn có khung 2px, spec giai đoạn 4 §4.3), các quy tắc sau đều ngoài mockup:

- Kbd trong mục menu đang được trỏ: chữ `--flg-highlight-text`, nền trong suốt, viền `currentColor` (giữ nguyên thì chữ mờ nằm trên nền nhấn đặc, dưới 2:1).
- `--flg-column-resize-line` thành `--flg-text-muted` đặc (token, §4.2).
- Ô có focus, ô đang sửa có focus: khung `--flg-accent-solid` của chế độ này; `outline` `--flg-focus-outline-color` vẽ vào trong (`outline-offset: -2px`) như control trong Table `lined` (spec giai đoạn 4 §4.3).
- Dòng mới, ô đã sửa, dòng chờ xoá: bỏ nền (accent 12%, `--flg-highlight-danger-bg`, mà ở chế độ này là `--flg-danger-fill` đặc), như Table bỏ nền của dòng chọn; dấu hiệu còn lại là khung nét đứt (ô đã sửa), "+ (new)" (dòng mới), gạch ngang và chữ mờ (dòng chờ xoá), cộng chữ ẩn.
- Dải hàng nhóm và dòng chi tiết giữ nguyên (đạt với token của chế độ này).
- Phần khớp: `--flg-highlight-bg` đặc với `--flg-highlight-text` (token), cả trong dòng chọn (dòng chọn không còn nền).

### 4.5 Forced colors

Mọi phần mới có quy tắc riêng trong `preferences.css`. Icon dùng `currentColor`, màu đặt trên phần tử bọc ngoài (spec giai đoạn 2 §4.5).

- **Kbd:** viền và chữ theo hệ thống (`CanvasText`); trên nút đặc: `ButtonText`, viền `ButtonText`.
- **Dialog kéo được:** tay nắm `CanvasText`, đang kéo `Highlight`; bóng nhấc lên bị bỏ (panel đã có viền `CanvasText` của `.flg-surface`).
- **Dialog toàn màn hình:** không có quy tắc riêng.
- **DataGrid:**
  - Bảng: quy tắc có sẵn của `Table` (viền `CanvasText` ở `lined`, nút sắp xếp `ButtonText`, header dính nền `Canvas`).
  - Nút trên tiêu đề, nút toán tử, nút chip, nút mở chi tiết, tay nắm: `ButtonText`. Phễu đang lọc vẫn đặc (hình khác, không cần màu).
  - Ô có focus, hàng nhóm có focus: `outline: 2px solid CanvasText; outline-offset: -2px` (bóng bị bỏ).
  - Dòng đã chọn: mọi ô `outline: 2px solid Highlight; outline-offset: -2px` (như mục đang chọn của Nav); ô có focus giữ outline `CanvasText` của nó (luật cụ thể hơn). Thay cho quy tắc "Checkbox nói thay" của Table, vì chọn `single` không có Checkbox.
  - Ô ghim và tiêu đề dính: `background-color: Canvas; background-image: none`, để chữ cuộn bên dưới không lộ; vạch mép ghim là `border-inline-end` (hay `-start`) 1px `CanvasText` (bóng trong bị bỏ); bóng `::after` bị bỏ.
  - Hàng nhóm: dải bị bỏ; còn chevron, chữ đậm và vạch của `lined`.
  - Tay nắm đổi độ rộng: vạch `CanvasText`, hover và kéo `Highlight` (`forced-color-adjust: none`). Vạch thả, đường dẫn, chấm: `forced-color-adjust: none; background: Highlight`.
  - Phần khớp của tìm kiếm: `forced-color-adjust: none; background: Mark; color: MarkText`.
  - Ô đang sửa: outline như ô có focus. Ô có lỗi: `outline: 2px solid CanvasText` cộng icon lỗi (dấu hiệu không bằng màu). Ô đã sửa: nét đứt thành `CanvasText`; nền bị bỏ. Dòng mới: "+ (new)" còn. Dòng chờ xoá: gạch ngang còn.
  - Thanh lưu, thanh bộ lọc, khay của thanh nhóm: viền `CanvasText`, nền `Canvas`. Chip: viền 1px `CanvasText` (nền bị bỏ).
  - Chip đang kéo, popover, menu: quy tắc của `.flg-surface` và menu.

### 4.6 Icon

**Icon dùng chung** ở `src/internal/icons.tsx` (nét 2, `strokeIcon`, trừ chỗ ghi), chỉ những icon component tự vẽ; đường vẽ lấy từ mockup (ngoài mockup thì ghi):

- Plan A: `GripIcon` (viewBox `0 0 8 14`, sáu `circle` bán kính 1.4 tô `currentColor`, §4.3 D2): Dialog, tay nắm kéo dòng.
- Plan B: `ArrowIcon` (up, down), `ChevronsUpDownIcon`, `ChevronIcon` có sẵn; `CheckIcon` có sẵn (ô boolean).
- Plan C: `ArrowIcon` thêm `direction: 'right'` (`M5 12h14`, `m12 5 7 7-7 7`); `MoreVerticalIcon` (ba `circle` r=1 tại (12, 5), (12, 12), (12, 19)); `ColumnsIcon` (`rect` 3,3,18,18 rx 2 và `M9 3v18M15 3v18`); `DownloadIcon` (`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`, `m7 10 5 5 5-5`, `M12 15V3`); `PinLeftIcon` (`rect` như trên và `M9 3v18`); `PinRightIcon` (`rect` và `M15 3v18`); `PanelIcon` (chỉ `rect`, ngoài mockup: Bỏ ghim); `MoveHorizontalIcon` (`m18 8 4 4-4 4`, `M2 12h20`, `m6 8-4 4 4 4`); `EyeOffIcon` (`M10.73 5.08A10.74 10.74 0 0 1 21.94 11.65a1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49`, `M14.08 14.16a3 3 0 0 1-4.24-4.24`, `M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14`, `m2 2 20 20`); `LockIcon` (`rect` 4,11,16,10 rx 2 và `M8 11V7a4 4 0 0 1 8 0v4`); `GripVerticalIcon` (sáu `circle` r=1 tại x 9 và 15, y 5, 12, 19; chip kéo cột).
- Plan D: `FunnelIcon` (`M22 3H2l8 9.46V19l4 2v-8.54z`; CSS tô đặc khi đang lọc); `FunnelXIcon` (`M12.5 3H2l8 9.46V19l4 2v-8.54l1.2-1.4`, `m22 3-5 5M17 3l5 5`); `OperatorIcon` (`operator`): `contains` (`M21 6H3M10 12H3M10 18H3`, `circle` 17,15 r 3, `m21 19-1.9-1.9`), `=` (`M5 9h14M5 15h14`), `>` (`m7 6 10 6-10 6`) theo mockup; ngoài mockup: `<>` (dấu bằng và `M16 4 8 20`), `<` (`m17 6-10 6 10 6`), `<=` (`m17 4-10 5 10 5M7 19h10`), `>=` (`m7 4 10 5-10 5M7 19h10`), `between` (`M4 12h16M4 8v8M20 8v8`), `notContains` (`contains` và `m3 3 18 18`), `startsWith` (`M4 5v14M9 9h11M9 15h7`), `endsWith` (`M20 5v14M4 9h11M8 15h7`).
- Plan E: `GroupIcon` (`M21 12h-8`, `M21 6H8`, `M21 18h-8`, `M3 6v4c0 1.1.9 2 2 2h3`, `M3 10v6c0 1.1.9 2 2 2h3`); chevron, mũi tên, × có sẵn.
- Plan F: `PencilIcon` (`M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z`, `m15 5 4 4`); `TrashIcon` (`M3 6h18`, `M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6`, `M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2`, `M10 11v6M14 11v6`); `UndoIcon` (`M9 14 4 9l5-5`, `M4 9h10.5a5.5 5.5 0 0 1 0 11H11`); `AlertCircleIcon` (`circle` 12,12 r 10 và `M12 8v4M12 16h.01`); `PlusIcon`, `CheckIcon`, `CloseIcon` có sẵn.

**Icon của ứng dụng** (điện thoại, ghim bản đồ trong chi tiết DH-1024, icon trong mục menu của ví dụ) là nội dung của người dùng, nằm trong docs và story.

---

## 5. Primitives nội bộ mới

| File | Export | Nhiệm vụ |
|---|---|---|
| `shortcut-format.ts` (A) | `parseKeys(keys)`, `formatKeys(parts, apple, labels)`, `shortcutText(parts, apple)`, `toAriaKeyShortcuts(parts, apple)`, `DEFAULT_KEY_LABELS` | Ngữ pháp và bảng của §3.3, hàm thuần (không React, không đọc nền tảng: `apple` là tham số), nên server-safe và test được hết. `parseKeys` trả `{ parts, unknown }` để người gọi `devWarn` một lần |
| `use-pointer-drag.ts` (A) | `usePointerDrag(options)` → `{ onPointerDown }` | Một lần kéo bằng con trỏ: lọc `isPrimary`, nút chính, `pointerTypes` (vd `['mouse', 'pen']` cho kéo cột); `setPointerCapture` trong `try/catch`; `onPress` (nhấn), `onStart` (vượt `threshold`, mặc định 4px; Dialog 3px), `onMove` (gộp theo `requestAnimationFrame`), `onEnd`, `onCancel` (`Esc` nghe ở pha capture của `document` trong lúc kéo và `preventDefault`, khi `cancelOnEscape` (mặc định `true`); `pointercancel`; `lostpointercapture` trước khi thả). Dialog truyền `cancelOnEscape: false`, nên `Esc` trong lúc kéo vẫn đóng hộp thoại như §3.4 (sau builder check). Dialog, đổi độ rộng, kéo cột, kéo chip, kéo dòng dùng chung |
| `auto-scroll.ts` (C) | `createAutoScroll(element)` → `{ update(x, y), stop() }` | Tự cuộn khi con trỏ gần mép (§3.8), vòng `requestAnimationFrame`, dừng khi rời vùng mép hay khi kéo kết thúc |
| `text-fold.ts` (D) | `foldText(text, locale)` → `{ folded, map }`, `includesFolded(text, query, locale)` | Gập để so khớp: tách dấu (NFD), bỏ dấu (`\p{M}`), `đ`/`Đ` → `d`, `toLocaleLowerCase(locale)`; `map` trả chỉ số trong chuỗi gốc cho mỗi ký tự đã gập, để tô sáng đúng chỗ trong chữ gốc có dấu |
| `download.ts` (G) | `downloadText(text, fileName, type)` | Tải một chuỗi thành file: `Blob`, `URL.createObjectURL`, `<a download>` tạm, `revokeObjectURL` ở task sau; không làm gì trên server |

**Helper riêng của component** (trong thư mục của component): `dialog/use-movable.ts` (máy trạng thái của §3.4, kẹp, `ResizeObserver`, `useMediaQuery('(min-width: 640px)')`; `DialogContent` gọi nó và chuyển cờ `movable` cho `DialogHeader` qua một context nội bộ của `modal.tsx`); `kbd/kbd-keys.tsx`; mọi file của `data-grid/` (§3.11).

**Thay đổi ở component và primitive có sẵn** (mỗi cái là một thay đổi của component đó, có test và docs của nó):

- **`MenuShortcut`** (A): nhận `keys` (và `labels` của Kbd). Có `keys` thì vẽ `<Kbd keys>` bên trong `.flg-menu-shortcut` (K1: menu vẽ ô); `children` chữ giữ như cũ. Có cả hai thì `devWarn`, `keys` thắng.
- **`SearchField`** (A): chữ gợi ý và `aria-keyshortcuts` qua `shortcut-format.ts` (§3.3); hàm nội bộ `Kbd` đổi tên `KeyHint` (tránh trùng tên với component mới). Không đổi API, DOM hay CSS; ảnh chuẩn cũ giữ nguyên.
- **`DialogContent`** (A, F): `movable` (A), `fullScreenOnPhone` (F); **`DialogHeader`** (A) thêm lớp `flg-dialog-header` (không có CSS nào ở trạng thái thường, nên không đổi pixel nào) và, khi hộp thoại kéo được, `data-movable` và tay nắm. `Drawer` không đổi (bản quyết định).
- **`icons.tsx`** (A, C–F): icon mới (§4.6); `ArrowIcon` thêm hướng `right`.
- **Không đổi:** `Table` (DataGrid dùng lại lớp CSS, `TableVariant` và `use-head-height.ts`); `Pagination` (thanh phân trang của grid ghép `Pagination` với `Select` và chữ đếm; không thêm prop nào); `Checkbox` (đã có `indeterminate`); `Select`, `Combobox`, `Input`, `NumberInput`, `DatePicker`, `Textarea`, `Field`, `Switch` (dùng làm trình sửa và ô lọc như vốn có; giao diện liền ô của E2 là CSS trong `data-grid.css`); `Tooltip` (dùng `TooltipRoot` với các tuỳ chọn nội bộ đã có); `Popover`; menu (`MenuPanel` và ngữ cảnh menu đã nhận một `reference()` bất kỳ, như ContextMenu, nên menu cột mở được từ nút ⋮ hay từ một điểm).
- **Công cụ:** `scripts/rsc-probe.mjs` thêm danh sách tham chiếu client (§3.1); `tests/visual/stories.visual.ts` thêm `data-visual-drag` (§7); `scripts/lib/contrast.ts` thêm các check của §4.4.

**Primitives của giai đoạn 1–5 được dùng lại:** `useControllableState` (mọi bộ ba của grid, `columnLayout`), `useAnnounce` (vùng live của grid), `useRequireName` (tên của grid), `useMediaQuery` (640px của Dialog), `useApplePlatform` (`KbdKeys`), `useHeadHeight` (của Table), `numberFormat`/`dateTimeFormat` của `intl.ts`, các hàm ISO của `date.ts`, `isComposing`/`hasModifier` của `roving.ts`, `focusFirst`/`isVisible` của `focus.ts`, `MenuPanel` và `menu-context` (menu cột, menu dòng, menu toán tử), `usePopover`/`useFloating` (popover lọc ở header, một cái cho cả grid), `useIsoLayoutEffect`, `mergeRefs`, `composeEventHandlers`, `dataAttr`, `withDefaults`, `devWarn`.

**Cảnh báo dev mới** (lời không chứa giá trị, để `devWarn` gộp được các lần lặp):

- Kbd: phần lạ hay rỗng trong `keys` ("<Kbd> keys has a part it does not know; it is shown as written."); có cả `keys` và `children`.
- MenuShortcut: có cả `keys` và `children`.
- Dialog: `movable` mà không có `DialogHeader` sau khi mở.
- DataGrid:
  - Không có tên sau khi mount: "<DataGrid> needs a name: pass caption, or aria-label or aria-labelledby." (`useRequireName`).
  - Cột không có `field` cũng không có `id` cùng `value`; id cột lặp; không dòng nào trong 20 dòng đầu có `field` (gõ sai qua JavaScript).
  - `rowKey` cho ra `undefined` hay `null`; khoá lặp (kiểm trên dữ liệu khi `data` đổi, trong dev).
  - `columns` đổi danh tính ba lần render liền mà id không đổi (§3.5).
  - `format` là tuỳ chọn `Intl` không hợp lệ (bắt lỗi của `Intl`, rơi về định dạng mặc định).
  - Lookup: phần tử đầu thiếu `valueField` hay `displayField`.
  - `remote` mà không có `totalCount`; `remote` cùng nhóm (`grouping`, `groupPanel`), `scrolling="virtual"`, `selectAllMode="all"` (dùng `'page'`), tổng theo nhóm, hay lọc ở header không có `headerFilter.values`.
  - `scrolling="virtual"` mà không có `height`; cùng `paging`; cùng `renderDetail`.
  - `editing` mà không có `onSaving` ("<DataGrid editing> has no onSaving: changes are dropped."); cột `value` có `allowEditing` mà không có `setValue`; `multiline` ở cột không phải chuỗi.
  - `rowReorder` mà không có `onRowReorder`.
  - Mục tổng trỏ vào cột không có.
  - Giá trị lạ trong trạng thái (id cột không còn, hướng sắp xếp lạ) **không** cảnh báo: trạng thái có thể đến từ `localStorage` của người dùng cuối (như theme, spec giai đoạn 5 §5); chúng bị bỏ qua lặng lẽ.

---

## 6. Component giai đoạn 6

### 6.1 Quy ước API chung (bổ sung cho §6.1 của các spec trước)

- **`ref`:** `Kbd` → `<kbd>` ngoài cùng; `DialogContent` như cũ. **`DataGrid` → `DataGridHandle`** (bản quyết định: phương thức như `exportCsv()`), không phải phần tử DOM; phần tử gốc lấy qua `handle.element`. Đây là ngoại lệ của quy ước "ref trỏ vào phần tử DOM chính" (spec 0+1 §6.1), vì thao tác của grid là lệnh, không phải thuộc tính của một phần tử.
- **`className`, `style`** của DataGrid vào gốc `.flg-data-grid`; `aria-label`, `aria-labelledby`, `aria-describedby` vào `<table>` (tên của grid); mọi prop HTML khác (`id`, `data-*`) vào gốc.
- **Component tổng quát (generic):** `DataGrid` được viết bằng `forwardRef` rồi ép kiểu thành `<TRow>(props: DataGridProps<TRow> & { ref?: Ref<DataGridHandle> }) => ReactElement`, để `TRow` suy ra từ `data` (cả React 18.3 và 19).
- **Controlled:** mỗi trạng thái của grid là bộ ba `x` / `defaultX` / `onXChange` (`useControllableState`), như mọi component.
- **Trạng thái tuần tự hoá được:** mọi kiểu trạng thái của grid chỉ chứa chuỗi, số, boolean, mảng và đối tượng thường; giá trị lọc của cột ngày là chuỗi ISO `YYYY-MM-DD`. Nhờ vậy công thức lưu trạng thái chỉ cần `JSON.stringify` (§6.3).
- **Mỗi component export kiểu props của nó** và các kiểu giá trị (`KbdProps`, `KbdLabels`, `DataGridProps`, `DataGridColumn`, `DataGridHandle`, `DataGridState` và các phần của nó, `DataGridLabels`, `DataGridChange`…).

### 6.2 Phân loại client và server

Như §3.1.

### 6.3 Đặc tả từng component

**`Kbd`** (Plan A)

```ts
interface KbdLabels {
  command: string; option: string; control: string; shift: string; return: string; tab: string;
  delete: string; forwardDelete: string; up: string; down: string; left: string; right: string;
  separator: string;
}
type KbdProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & (
  | { keys: string; labels?: Partial<KbdLabels>; children?: never }
  | { keys?: never; labels?: never; children: ReactNode }
);
```

- **Mặc định** `labels`: `{ command: "Command", option: "Option", control: "Control", shift: "Shift", return: "Return", tab: "Tab", delete: "Delete", forwardDelete: "Forward Delete", up: "Up Arrow", down: "Down Arrow", left: "Left Arrow", right: "Right Arrow", separator: "+" }`. Tên chỉ cần cho ký hiệu; chữ ("Ctrl", "Esc") được đọc như chữ.
- **Cấu trúc:**

  ```html
  <kbd class="flg-kbd">Esc</kbd>                                          <!-- children -->
  <kbd class="flg-kbd" data-platform="apple">                             <!-- keys="mod+shift+f" trên Apple -->
    <kbd><span aria-hidden="true">⌘</span><span class="flg-visually-hidden">Command</span></kbd>
    <span class="flg-visually-hidden">+</span>
    <kbd><span aria-hidden="true">⇧</span><span class="flg-visually-hidden">Shift</span></kbd>
    <span class="flg-visually-hidden">+</span>
    <kbd>F</kbd>
  </kbd>
  <kbd class="flg-kbd"><kbd>Ctrl</kbd><span class="flg-visually-hidden">+</span><kbd>Shift</kbd>…</kbd>  <!-- nơi khác -->
  ```

  Theo HTML, một tổ hợp là các `<kbd>` lồng trong một `<kbd>` ngoài (bản quyết định). `data-platform` chỉ có sau khi mount trên Apple.
- **Chỉ vẽ phím:** Kbd không nghe phím, không đặt `aria-keyshortcuts` cho ai. **Kbd trong một nút** thành một phần tên của nút ("Save Command plus S"); docs khuyên `aria-hidden` cho Kbd và `aria-keyshortcuts` trên nút khi nút thật sự có phím tắt (mockup K1 vẽ nút "Lưu ⌘S" với `aria-keyshortcuts`).
- **Ngữ cảnh** (Tooltip, mục menu kể cả mục đang được trỏ, nút đặc): CSS theo chỗ đặt (§4.3), không cần prop.

**`MenuShortcut`** (thay đổi, Plan A)

```ts
type MenuShortcutProps = HTMLAttributes<HTMLSpanElement> & (
  | { keys?: never; labels?: never }
  | { keys: string; labels?: Partial<KbdLabels>; children?: never }
);
```

- `keys` → `<span class="flg-menu-shortcut"><kbd class="flg-kbd">…</kbd></span>`; `children` → như cũ. Tên của mục menu có cả phím ("Paste Command plus V"); muốn khác thì người dùng đặt `aria-keyshortcuts` trên `MenuItem` và `aria-hidden` cho `MenuShortcut`.

**`SearchField`** (thay đổi, Plan A): §3.3, §5. Không đổi API.

**`DialogContent`** (thay đổi, Plan A và F)

```ts
interface DialogContentProps extends ModalContentProps {
  size?: DialogSize; alert?: boolean;
  /** Drag the dialog by its header on screens 640px and wider. Default false. */
  movable?: boolean;
  /** Below 640px, fill the screen: no margin, no corners, the footer at the bottom. Default false. */
  fullScreenOnPhone?: boolean;
}
```

- **Không đặt tên `draggable`** (bản quyết định): đó là thuộc tính HTML toàn cục của kéo thả HTML5, và `DialogContent` chuyển prop xuống `<dialog>`.
- **`movable`:** §3.4 (hành vi), §4.3 (D2). Panel mang `data-movable` (đặt sau props của người dùng); `<dialog>` mang `data-dragging` khi đang kéo; `DialogHeader` mang `data-movable` và render tay nắm làm con đầu.
- **`fullScreenOnPhone`:** `<dialog>` mang `data-full-screen="phone"`; mọi thứ khác là CSS (§4.3). Dùng được với `alert` (docs khuyên không, vì hộp hỏi lại thường ngắn). Không có ý nghĩa với `Drawer`.

**`DataGrid`** (Plan B–G)

```ts
type DataGridKey = string | number;
type DataGridDataType = 'string' | 'number' | 'date' | 'datetime' | 'boolean';
type DataGridDensity = 'compact' | 'standard' | 'comfortable';
type DataGridSortDirection = 'asc' | 'desc';
type DataGridFilterOperator =
  | '=' | '<>' | '<' | '>' | '<=' | '>=' | 'between'
  | 'contains' | 'notContains' | 'startsWith' | 'endsWith';
type DataGridEditMode = 'row' | 'cell' | 'batch' | 'form' | 'popup';

// Trạng thái (§6.1: tuần tự hoá được). `field` là id của cột.
interface DataGridSortItem { field: string; direction: DataGridSortDirection }
interface DataGridColumnFilter {
  operator?: DataGridFilterOperator; value?: unknown;     // hàng lọc; 'between': [from, to]
  values?: readonly unknown[]; exclude?: boolean;          // lọc ở header; null là "(Blanks)"
}
interface DataGridFilter {
  search?: string;
  columns?: Readonly<Record<string, DataGridColumnFilter>>;
  enabled?: boolean;                                       // công tắc của thanh bộ lọc; mặc định true
}
interface DataGridGroupItem { field: string; direction: DataGridSortDirection }
interface DataGridExpandedGroups { allExpanded: boolean; except: readonly string[] }  // khoá nhóm
interface DataGridPage { index: number; size: number }
interface DataGridColumnLayout {
  order: readonly string[]; widths: Readonly<Record<string, number>>;
  hidden: readonly string[]; pinned: Readonly<Record<string, 'left' | 'right'>>;
}
interface DataGridState {
  sort: readonly DataGridSortItem[]; filter: DataGridFilter; grouping: readonly DataGridGroupItem[];
  expandedGroups: DataGridExpandedGroups; page: DataGridPage; selectedKeys: readonly DataGridKey[];
  expandedRows: readonly DataGridKey[]; columnLayout: DataGridColumnLayout;
}
```

```ts
// Cột: một mảng cấu hình (không phải cột JSX con), để `field` và các hàm giữ kiểu TRow.
interface DataGridCellContext<TRow, V> {
  row: TRow; rowKey: DataGridKey; value: V; text: string;   // text: giá trị đã định dạng
  column: DataGridColumnInfo; selected: boolean;
  highlight(text: string): ReactNode;                        // tô sáng phần khớp của ô tìm kiếm
}
interface DataGridEditorContext<TRow, V> {
  row: Partial<TRow>; value: V | null; setValue(value: V | null): void;
  commit(): void; cancel(): void; invalid: boolean; errorId: string | undefined;
  mode: DataGridEditMode; size: 'sm' | 'md'; autoFocus: boolean; label: string;
}
interface DataGridLookup { items: readonly object[]; valueField: string; displayField: string; searchable?: boolean }
type DataGridValidationRule<TRow, V> =
  | { type: 'required'; message?: string }
  | { type: 'range'; min?: number | string; max?: number | string; message?: string }  // số; ngày ISO
  | { type: 'stringLength'; min?: number; max?: number; message?: string }
  | { type: 'pattern'; pattern: RegExp; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'custom'; validate(value: V | null, row: Partial<TRow>): string | boolean | null | undefined; message?: string };
interface DataGridColumnBase<TRow, V> {
  caption?: string;                       // chữ của tiêu đề; mặc định là id
  dataType?: DataGridDataType;            // mặc định 'string'
  format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | ((value: V, row: TRow) => string);
  cell?(ctx: DataGridCellContext<TRow, V>): ReactNode;
  align?: 'start' | 'center' | 'end';
  width?: number; minWidth?: number; pinned?: 'left' | 'right'; visible?: boolean; rowHeader?: boolean;
  allowSorting?: boolean; allowFiltering?: boolean; allowHeaderFiltering?: boolean; allowSearch?: boolean;
  allowGrouping?: boolean; allowResizing?: boolean; allowReordering?: boolean; allowHiding?: boolean;
  allowPinning?: boolean; allowEditing?: boolean | ((row: TRow) => boolean);
  sortValue?(row: TRow): string | number | boolean | Date | null | undefined;
  lookup?: DataGridLookup;
  filterOperators?: readonly DataGridFilterOperator[];
  headerFilter?: { values?: readonly { value: unknown; text: string }[] };
  showWhenGrouped?: boolean;
  editor?(ctx: DataGridEditorContext<TRow, V>): ReactNode;
  validationRules?: readonly DataGridValidationRule<TRow, V>[];
  multiline?: boolean;
  form?: { visible?: boolean; span?: 1 | 2 };
  exportable?: boolean;                   // có trong CSV; mặc định true
}
type DataGridFieldColumn<TRow> = {
  [K in keyof TRow & string]: DataGridColumnBase<TRow, TRow[K]> & { field: K; id?: string; value?: never };
}[keyof TRow & string];
type DataGridValueColumn<TRow, V = unknown> = DataGridColumnBase<TRow, V> & {
  id: string; value(row: TRow): V; setValue?(row: Partial<TRow>, value: V | null): Partial<TRow>; field?: never;
};
type DataGridColumn<TRow> = DataGridFieldColumn<TRow> | DataGridValueColumn<TRow, any>;
/** Giữ kiểu V của một cột tính toán: `dataGridColumn<Order>()({ id: 'total', value: (r) => r.qty * r.price })`. */
declare function dataGridColumn<TRow>(): <V>(column: DataGridValueColumn<TRow, V>) => DataGridValueColumn<TRow, V>;

interface DataGridSummaryItem<TRow> {
  id?: string;                            // mặc định `${type}:${field}`
  column: string;                         // cột hiện tổng
  field?: string;                         // cột lấy giá trị; mặc định = column
  type: 'count' | 'sum' | 'avg' | 'min' | 'max' | ((rows: readonly TRow[]) => unknown);
  label?: string;
  format?: Intl.NumberFormatOptions | ((value: unknown) => string);
}
interface DataGridEditing<TRow> {
  mode: DataGridEditMode;
  allowAdding?: boolean; allowUpdating?: boolean | ((row: TRow) => boolean);
  allowDeleting?: boolean | ((row: TRow) => boolean);
  confirmDelete?: boolean; newRowPosition?: 'first' | 'last';
  startEditAction?: 'click' | 'dblClick';                    // cell, batch
  popup?: { size?: DialogSize; movable?: boolean; fullScreenOnPhone?: boolean };
}
type DataGridChange<TRow> =
  | { type: 'insert'; key: string; data: Partial<TRow> }      // key tạm: 'flg-new-1'…
  | { type: 'update'; key: DataGridKey; data: Partial<TRow>; row: TRow }   // data: chỉ các trường đã đổi
  | { type: 'remove'; key: DataGridKey; row: TRow };
interface DataGridSaveError {
  message?: string;
  fieldErrors?: readonly { key: DataGridKey; field: string; message: string }[];
}
interface DataGridCsvOptions {
  fileName?: string; separator?: ',' | ';' | '\t'; values?: 'formatted' | 'raw';
  bom?: boolean; selectedOnly?: boolean; escapeFormulas?: boolean;
}
interface DataGridToolbarItems {
  groupPanel: ReactNode; spacer: ReactNode; search: ReactNode;
  columnChooser: ReactNode; exportButton: ReactNode; addButton: ReactNode;   // null khi tắt
}

type DataGridProps<TRow> = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> & {
  data: readonly TRow[];
  rowKey: (keyof TRow & string) | ((row: TRow) => DataGridKey);
  columns: readonly DataGridColumn<TRow>[];
  caption?: ReactNode; description?: ReactNode; captionAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  variant?: TableVariant; density?: DataGridDensity; rowHeight?: number; locale?: string; timeZone?: string; // mặc định 'UTC', cho cột datetime
  height?: number | string; scrolling?: 'standard' | 'virtual';
  // mặc định cho mọi cột (cột ghi đè)
  allowSorting?: boolean; allowFiltering?: boolean; allowHeaderFiltering?: boolean; allowGrouping?: boolean;
  allowResizing?: boolean; allowReordering?: boolean; allowHiding?: boolean; allowPinning?: boolean;
  sortMode?: 'single' | 'multiple';
  sort?: readonly DataGridSortItem[]; defaultSort?: readonly DataGridSortItem[];
  onSortChange?: (sort: readonly DataGridSortItem[]) => void;
  filter?: DataGridFilter; defaultFilter?: DataGridFilter; onFilterChange?: (filter: DataGridFilter) => void;
  grouping?: readonly DataGridGroupItem[]; defaultGrouping?: readonly DataGridGroupItem[];
  onGroupingChange?: (grouping: readonly DataGridGroupItem[]) => void;
  expandedGroups?: DataGridExpandedGroups; defaultExpandedGroups?: DataGridExpandedGroups;
  onExpandedGroupsChange?: (expanded: DataGridExpandedGroups) => void; autoExpandAll?: boolean;
  paging?: false | { pageSize?: number; pageSizes?: readonly number[] };
  page?: DataGridPage; defaultPage?: DataGridPage; onPageChange?: (page: DataGridPage) => void;
  selectionMode?: 'none' | 'single' | 'multiple'; selectAllMode?: 'page' | 'all'; selectOnRowClick?: boolean;
  selectedKeys?: readonly DataGridKey[]; defaultSelectedKeys?: readonly DataGridKey[];
  onSelectedKeysChange?: (keys: readonly DataGridKey[]) => void;
  renderDetail?: (row: TRow) => ReactNode; rowHasDetail?: (row: TRow) => boolean;
  expandedRows?: readonly DataGridKey[]; defaultExpandedRows?: readonly DataGridKey[];
  onExpandedRowsChange?: (keys: readonly DataGridKey[]) => void;
  columnLayout?: DataGridColumnLayout; defaultColumnLayout?: Partial<DataGridColumnLayout>;
  onColumnLayoutChange?: (layout: DataGridColumnLayout) => void;
  onStateChange?: (state: DataGridState, changed: keyof DataGridState) => void;
  filterRow?: boolean; headerFilter?: boolean; filterPanel?: boolean;
  searchPanel?: boolean | { placeholder?: string };
  groupPanel?: boolean; columnChooser?: boolean; csvExport?: boolean | DataGridCsvOptions;
  summary?: { total?: readonly DataGridSummaryItem<TRow>[]; group?: readonly DataGridSummaryItem<TRow>[] };
  totalSummary?: Readonly<Record<string, unknown>>;
  rowReorder?: boolean;
  onRowReorder?: (fromKey: DataGridKey, toKey: DataGridKey, position: 'before' | 'after') => void;
  editing?: DataGridEditing<TRow>;
  onSaving?: (changes: readonly DataGridChange<TRow>[]) => void | Promise<void>;
  initNewRow?: () => Partial<TRow>;
  remote?: boolean; totalCount?: number; loading?: boolean;
  toolbar?: false | ((items: DataGridToolbarItems) => ReactNode);
  onRowActivate?: (row: TRow, key: DataGridKey) => void;
  rowClassName?: (row: TRow) => string | undefined;
  labels?: Partial<DataGridLabels>;
};

interface DataGridHandle {
  readonly element: HTMLDivElement | null;
  focus(): void;                                    // B: focus ô hoạt động
  scrollToRow(key: DataGridKey): boolean;           // B; E: mở các nhóm chứa nó; đổi trang nếu cần
  getState(): DataGridState;                        // B
  clearFilter(): void;                              // D: xoá tìm kiếm và mọi điều kiện cột
  expandAllGroups(): void; collapseAllGroups(): void;            // E
  addRow(): void; saveChanges(): Promise<boolean>; cancelChanges(): void;   // F
  exportCsv(options?: DataGridCsvOptions & { download?: boolean }): string;  // G
}
```

- **Mặc định:** `variant="lined"`, `density="standard"`, `locale="en-US"` (bản quyết định: HTML từ server và client giống nhau), `scrolling="standard"`, `captionAs="h3"` (như `CardTitle`), mọi `allow*` của grid `true` (chỉ có tác dụng khi tính năng đó bật; `allowEditing` của cột mặc định `true` khi `editing` có), `sortMode="multiple"`, `paging={ pageSize: 20, pageSizes: [10, 20, 50, 100] }` (như DevExtreme), `selectionMode="none"`, `selectAllMode="page"` (Claude chốt: "chọn tất cả" chỉ chọn những gì thấy được, như danh sách thư; `'all'` là lựa chọn), `selectOnRowClick` `true` ở `single`, `false` ở `multiple` (bản quyết định), `autoExpandAll=true`, `filterRow`, `headerFilter`, `filterPanel`, `searchPanel`, `groupPanel`, `columnChooser`, `csvExport`, `rowReorder` đều `false`, `filter.enabled=true`.
- **Kiểu tổng quát:** `field` chỉ nhận khoá chuỗi của `TRow`, và nhờ kiểu phân phối (`DataGridFieldColumn`), `cell` và `editor` của cột `{ field: 'total' }` nhận `value: TRow['total']`. Các hàm của cột được khai báo theo cú pháp phương thức, nên một cột tính toán có `V` cụ thể vẫn vừa mảng `DataGridColumn<TRow>[]`; `dataGridColumn<TRow>()` giữ `V` của nó. `rowKey` là khoá của `TRow` hay một hàm.
- **Id cột:** `field`, hoặc `id` bắt buộc khi dùng `value`. Mọi trạng thái nói về cột bằng id này.

**Phần lõi** (Plan B)

- **Hiển thị theo `dataType`** (bản quyết định):

  | `dataType` | Căn lề | Định dạng mặc định | Sắp xếp |
  |---|---|---|---|
  | `string` | đầu dòng | nguyên chữ | `Intl.Collator(locale, { numeric: true })` |
  | `number` | cuối dòng | `numberFormat(locale)` | số |
  | `date` | đầu dòng | `dateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })` ("11/05/2026" ở `en-US`, "05/11/2026" ở `vi-VN`) | thời điểm |
  | `boolean` | giữa | `true`: `CheckIcon` 16px `--flg-accent-text` cùng chữ ẩn `labels.yes`; `false`: chỉ chữ ẩn `labels.no` (ngoài mockup) | `false` trước `true` |

  - **Ngày và múi giờ** (Claude chốt, sau builder check; thay cho bản nháp "so theo thời điểm, lọc theo múi giờ của trình duyệt", vốn làm HTML của server khác của client và lệch một ngày ở phía tây UTC):
    - `date` là **ngày lịch không có giờ**, như `DatePicker` và `src/internal/date.ts`: nhận `Date` (đọc theo UTC, như `DatePicker`) hay chuỗi `YYYY-MM-DD`; định dạng với `timeZone: 'UTC'`; so sánh, lọc "bằng", nhóm, khoá nhóm, CSV `raw` (`YYYY-MM-DD`) và trình sửa (`DatePicker`) đều theo ngày đó. Server và client ra cùng một chữ.
    - `datetime` (thêm vào bảng trên: căn đầu dòng, mặc định `dateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone })`, sắp theo thời điểm) là **một thời điểm**: nhận `Date`, chuỗi ngày giờ ISO hay số mili giây. Hiển thị, lọc "bằng" (theo ngày lịch), nhóm (theo ngày lịch) đều ở múi giờ của prop `timeZone` của `DataGrid`, mặc định `'UTC'` để server và client giống nhau; docs chỉ cách truyền múi giờ của người dùng (cookie, hồ sơ). CSV `raw` là ISO 8601 có `Z`. Cột `datetime` không sửa được trừ khi có `editor` riêng (thư viện chưa có ô chọn giờ).
    - `devWarn` khi một chuỗi không đọc được thành ngày; ô coi là rỗng.
  - `format` là tuỳ chọn `Intl` (theo `dataType`) hay hàm `(value, row) => string`. Tuỳ chọn hỏng thì định dạng mặc định và `devWarn`.
  - Lookup: hiển thị `displayField` của phần tử có `valueField` bằng giá trị; sắp xếp, nhóm, tìm, lọc ở header, xuất CSV "đã định dạng" theo chữ hiển thị; lọc ở hàng lọc và giá trị lưu theo giá trị.
  - `cell(ctx)` thay nội dung của ô (vd Badge trạng thái, Avatar cùng tên); `ctx.highlight(text)` để ô tuỳ biến cũng tô sáng phần khớp. Không có `cell`: chữ đã định dạng, có tô sáng.
  - Chữ dài thì "…" (`overflow: hidden; text-overflow: ellipsis`); trình đọc màn hình vẫn đọc đủ. Không có tooltip cho chữ bị cắt (Claude chốt).
  - Ô rỗng không vẽ gì (dòng mới: §4.3 E2).
- **Caption:** `caption` vẽ trong thanh công cụ (§4.3 G1) bằng phần tử `captionAs`, có id, và đặt tên cho grid; `description` là mô tả của grid (Claude chốt; bản quyết định không có, nhưng G1 đặt tên thẻ cùng hàng thanh công cụ, và grid cần tên).
- **Thanh công cụ:** hiện khi có caption hay một mục. `toolbar={false}` bỏ nó; `toolbar={(items) => …}` sắp lại các mục mặc định và thêm nút riêng (bản quyết định); mặc định là `groupPanel, spacer, search, columnChooser, exportButton, addButton` sau caption.
- **Sắp xếp:** bấm tiêu đề (hay `Enter`): cột này thành cột sắp duy nhất, chiều kế tiếp của nó (chưa sắp → tăng → giảm → bỏ). Shift+bấm, mod+bấm (hay `Shift+Enter`): giữ các cột khác, thêm cột này (tăng) hay đổi chiều, hay bỏ nó. `sortMode="single"`: phím bổ trợ không có tác dụng. Số thứ tự hiện khi sắp nhiều cột. Thông báo: `labels.announceSort(text)`, vd "Sorted by Order date, descending, then Total, ascending"; `labels.announceSortCleared`. Chế độ server: chỉ gọi `onSortChange`.
- **Chọn dòng** (bản quyết định): `single`: bấm dòng chọn dòng (`selectOnRowClick`), `Space` trên ô; không có cột Checkbox. `multiple`: cột Checkbox (tên `labels.selectRow(name)`, `name` là chữ của cột `rowHeader`, hay khoá) và Checkbox "chọn tất cả" ở tiêu đề (`labels.selectAll` hay `labels.selectAllOnPage`; `indeterminate` khi chọn một phần của phạm vi đó); chỉ Checkbox mới chọn trừ khi `selectOnRowClick`. Shift+bấm (dòng hay Checkbox) và `Shift+Space`: chọn khoảng từ dòng neo, theo thứ tự đang hiển thị. `mod+A`: chọn tất cả. Không phân trang (cuộn ảo, `paging={false}`) thì `'page'` là mọi dòng sau lọc. Chọn theo khoá, nên giữ qua lọc, sắp xếp, đổi trang; dòng đã chọn mà bị lọc mất vẫn được chọn. Bấm vào control trong ô (`cell` tuỳ biến) không chọn dòng. Thông báo khi chọn tất cả và chọn khoảng: `labels.announceSelected(n)`.
- **Phân trang:** trang bắt đầu từ 0 (`index`); đổi bộ lọc, tìm kiếm hay nhóm thì về trang 0; sắp xếp giữ trang (kẹp lại nếu thừa). `paging={false}`: mọi dòng một trang (dùng cuộn ảo cho dữ liệu lớn). Thanh phân trang: §4.3 G1.
- **Cuộn ảo:** §3.7.
- **Đang tải và trống:** `loading` khi chưa có dòng nào: các dòng skeleton; khi đã có dòng: lớp phủ, giữ dữ liệu cũ (bản quyết định). Cả hai đặt `aria-busy="true"` trên `<table>` và thông báo `labels.loading`. Không có dòng: `labels.noData`; không có dòng do lọc: `labels.noMatches` và nút xoá bộ lọc (D).
- **Chế độ server** (`remote`, bản quyết định): `data` là trang hiện tại, `totalCount` bắt buộc (cho đếm và số trang), grid không tự sắp xếp, lọc, phân trang mà chỉ gọi `onSortChange`, `onFilterChange`, `onPageChange` để app tải lại; `loading` hiện lớp phủ. Tô sáng của tìm kiếm vẫn chạy trên trang hiện tại.
- **`onRowActivate`:** bấm đúp một dòng (không trên control) hay `Enter` trên một ô thường; để mở trang chi tiết của dòng chẳng hạn. Không có khi dòng đang sửa.
- **`onStateChange(state, changed)`:** gọi sau mọi thay đổi của một trong tám trạng thái (sau `onXChange` tương ứng), với trạng thái đầy đủ mới, để công thức lưu trạng thái chỉ cần một callback (bản quyết định).

**Cột** (Plan C)

- **`columnLayout`** gộp thứ tự, độ rộng, cột ẩn, cột ghim (bản quyết định). Giá trị ban đầu dựng từ cấu hình cột (`width`, `visible`, `pinned`, thứ tự của mảng); `defaultColumnLayout` ghi đè từng phần. Cột mới (chưa có trong `order`) nối vào cuối theo thứ tự của mảng; id không còn trong `columns` bị bỏ qua.
- **Đổi độ rộng:** kéo tay nắm (đổi ngay), bấm đúp tay nắm (tự vừa), `Alt+Shift+←/→` (10px), menu "Tự vừa độ rộng". Không dưới `minWidth` (mặc định 60px), không quá 2000px. Tự vừa đo `scrollWidth` của nội dung tiêu đề và của các ô cột đó đang có trong DOM (trang hiện tại hay cửa sổ ảo; docs nói rõ), cộng padding, kẹp `[minWidth, 600]`. Kiểu "widget" (§3.7). `onColumnLayoutChange` gọi khi thả (không gọi mỗi lần di chuột); trong lúc kéo, độ rộng tạm nằm trong grid, nên cột vẫn đổi ngay cả khi `columnLayout` là controlled; thông báo `labels.announceResized(caption, px)` sau phím (500 ms).
- **Kéo đổi thứ tự:** kéo tiêu đề theo chiều ngang (chuột, bút), chỉ trong cùng vùng (trái ghim / giữa / phải ghim, bản quyết định); ra ngoài vùng hay ngoài dải tiêu đề thì không có vạch thả và thả là huỷ. Cột `allowReordering: false` không kéo được, các cột khác vẫn đi qua nó. Phím `mod+Shift+←/→`, menu "Chuyển sang trái/phải" (tắt ở mép vùng). Thông báo `labels.announceMoved(caption, position, count)`.
- **Ghim:** trái hoặc phải, từ `pinned` của cột hay menu. Ghim thì cột về cuối vùng trái (hay đầu vùng phải); bỏ ghim thì về đầu (hay cuối) vùng giữa. Thông báo `labels.announcePinned(caption, side)`, `labels.announceUnpinned(caption)`.
- **Ẩn và hiện:** chọn cột (§4.3 C1) và menu "Ẩn cột"; luôn còn ít nhất một cột dữ liệu hiện. Cột ẩn không có trong DOM, tìm kiếm và CSV; điều kiện lọc của nó vẫn áp dụng và vẫn hiện ở thanh bộ lọc.
- **Menu cột:** một menu cho cả grid (render sau `<table>`, không trong ô tiêu đề, để nội dung tiêu đề gọn khi trình đọc màn hình đọc), mở từ nút ⋮ (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`; tên `labels.columnMenu(caption)`), chuột phải trên tiêu đề, `Alt+↓` / `Shift+F10` / phím ContextMenu trên tiêu đề có focus. Đóng thì focus về chỗ mở. Mục: §4.3 C1.

**Lọc** (Plan D)

- **Toán tử theo kiểu** (mặc định in đậm; `filterOperators` của cột thu hẹp): chuỗi **`contains`**, `notContains`, `startsWith`, `endsWith`, `=`, `<>`; số và ngày **`=`**, `<>`, `<`, `>`, `<=`, `>=`, `between`; boolean và lookup: chỉ `=` (Select, không có nút toán tử).
- **So khớp:** chuỗi qua `text-fold.ts` (không phân biệt hoa thường và dấu, "minh" khớp "Minh" và "Mính", "duong" khớp "Đường"; Claude chốt); số đọc bằng `parseNumber` theo `locale` (chữ không phải số thì điều kiện bị bỏ qua và ô lọc `invalid`); ngày theo ngày lịch; `between` gồm cả hai đầu. Giá trị rỗng không khớp điều kiện nào, trừ `<>` và `notContains` (Claude chốt).
- **Khi nào áp dụng** (bản quyết định để spec chốt): ô chữ và ô số sau 400 ms ngừng gõ, hay ngay khi `Enter`; Select, DatePicker, đổi toán tử: ngay. `Esc` trong ô lọc: còn chữ thì xoá (và áp dụng), rỗng thì về ô của grid.
- **Lọc ở header:** danh sách giá trị khác nhau của cột trên các dòng qua tìm kiếm và qua bộ lọc của **các cột khác** (danh sách thu theo bộ lọc khác, Claude chốt), cộng các giá trị đang chọn; sắp như cột (rỗng cuối, "(Blanks)"); chữ đã định dạng; tối đa 500 giá trị được vẽ, quá thì dòng `labels.moreValues(shown, total)` và tìm để thu hẹp. Ô tìm lọc danh sách bằng `includesFolded`. Danh sách là một điểm Tab (roving: `↑`/`↓`, `Home`/`End`, `Space` đánh dấu); thứ tự Tab: ô tìm → danh sách → Huỷ → OK; `Enter` (không trên nút) là OK, `Esc` là Huỷ; Tab ra khỏi nút cuối đóng popover và trả focus về phễu. OK: chọn hết thì bỏ điều kiện; chọn hơn nửa thì lưu thành `exclude: true` với các giá trị bỏ chọn (gọn hơn khi lưu), như DevExtreme. Một popover cho cả grid, render sau `<table>`, `role="dialog"`, tên `labels.filterColumn(caption)`.
- **Hàng lọc và lọc ở header cùng cột** là hai điều kiện độc lập, cộng "và", không phản chiếu nhau (điểm mở; đúng mockup F1, nơi Trạng thái lọc ở header "Đang xử lý" mà ô của hàng lọc vẫn "(Tất cả)").
- **Ô tìm kiếm** (`searchPanel`): `SearchField` trong thanh công cụ; áp dụng sau 300 ms; tìm trong mọi cột đang hiện có `allowSearch` theo chữ đã định dạng (bản quyết định); tô sáng mọi phần khớp. `labels.announceRowsFound(n)` sau 500 ms (cả với lọc theo cột).
- **Thanh bộ lọc** (`filterPanel`): chữ của mọi điều kiện theo cột (không gồm tìm kiếm), nút xoá bộ lọc (xoá tìm kiếm và mọi điều kiện), công tắc tạm tắt (`filter.enabled`). Khi tắt: grid hiện mọi dòng (tìm kiếm vẫn áp dụng), các ô lọc và phễu vẫn hiện điều kiện đã đặt.
- **Chế độ server:** chỉ gọi `onFilterChange`; lọc ở header lấy giá trị từ `headerFilter.values` của cột.

**Nhóm, tổng, master-detail, kéo dòng** (Plan E)

- **Nhóm:** kéo tiêu đề vào thanh nhóm (chuột, bút), menu "Nhóm theo cột này", hay `grouping`. Cấp mới thêm vào cuối, chiều tăng. Chip: nút chiều (tên `labels.groupDirection(caption, next)`), nút bỏ (`labels.ungroup(caption)`), kéo chip (mọi loại con trỏ) hay `mod+Shift+←/→` trên nút của chip để đổi cấp; kéo chip ra khỏi thanh và thả trên tiêu đề là bỏ nhóm. Cột đang nhóm ẩn khỏi tiêu đề và thân (như DevExtreme, bản quyết định) trừ khi `showWhenGrouped`. Thứ tự nhóm theo `sortValue` của cột nếu có (điểm mở), không thì như sắp xếp của cột; rỗng là nhóm cuối "(Blanks)". Thông báo `labels.announceGrouped(caption)` / `announceUngrouped`.
- **Mở/đóng:** `expandedGroups` = `{ allExpanded, except }` (khoá nhóm từ `groupKey`); `autoExpandAll` cho `allExpanded` ban đầu. Bấm hàng nhóm, `Enter`, `←`/`→` (§3.6). Không có thông báo live (§1).
- **Tổng** (`summary`, bản quyết định): `total` ở `<tfoot>` dính dưới, tính trên mọi dòng sau lọc (§3.5 bước 7); `group` trên hàng nhóm, tính trên dòng của nhóm. `count` đếm dòng; `sum`, `avg`, `min`, `max` trên giá trị không rỗng của `field` (số; `min`/`max` cả ngày); hàm tuỳ biến nhận các dòng. Định dạng: `format` của mục, không thì `format` của cột (`count` luôn là số nguyên). Nhãn: `label`, không thì `labels.summary[type]` ("Count", "Total", "Average", "Min", "Max"), trừ `sum` ở `<tfoot>` (không nhãn, như R1). Ô tổng có chữ ẩn của cột khi không có nhãn ("Total of Amount") để đọc rời vẫn hiểu. Chế độ server: `totalSummary[id]` của app; tổng nhóm không có (`devWarn`).
- **Master-detail** (bản quyết định): `renderDetail(row)` bật cột nút mở chi tiết (tên `labels.showDetails(name)` / `labels.hideDetails(name)`); `rowHasDetail(row)` để tắt cho từng dòng; `expandedRows` controllable. Dòng chi tiết có id, nút `aria-controls` trỏ vào nó; ô chi tiết là một ô của grid (`Enter`/`F2` vào nội dung, `Tab` đi vòng trong nó, `Esc` ra). Cuộn ảo tắt (§3.7).
- **Kéo dòng** (bản quyết định): `rowReorder` bật cột tay nắm; `onRowReorder(fromKey, toKey, position)`, app tự đổi `data`. Tắt khi đang sắp xếp hay nhóm (bản quyết định); chạy được khi đang lọc (vị trí so với dòng thấy được) và ở chế độ server (trong trang). Menu dòng từ tay nắm (`Enter`, `Space`, bấm): Lên trên, Xuống dưới, Lên đầu, Xuống cuối (tắt ở mép). `mod+Shift+↑/↓` trên mọi ô của dòng. Focus đi theo dòng (vị trí hoạt động theo khoá); thông báo `labels.announceRowMoved(name, position, count)`.

**Sửa dữ liệu** (Plan F)

- **Dữ liệu thuộc về app** (bản quyết định): grid không sửa `data`. Thay đổi chưa lưu nằm trong grid (không controlled; `handle.saveChanges()`, `cancelChanges()`), hiển thị đè lên `data` (§3.5 bước 2). Khi lưu, grid gọi `onSaving(changes)`, **mỗi dòng một thay đổi** (điểm mở): `insert` (khoá tạm `flg-new-N`, `data` là mọi trường đã đặt cùng `initNewRow()`), `update` (`data` chỉ các trường đã đổi; cột `value` qua `setValue`), `remove`.
  - `onSaving` trả về không phải Promise: coi như thành công ngay.
  - Trả về Promise: trong lúc chờ, `aria-busy` trên `<table>`, nút lưu ở trạng thái `loading`, trình sửa chỉ đọc. Resolve: thoát chế độ sửa, xoá thay đổi đã gửi, thông báo `labels.announceSaved`; app cập nhật `data` (dòng mới với khoá thật thay dòng tạm). Reject: giữ thay đổi và chế độ sửa, hiện `Alert` lỗi trong grid (`message` của lỗi, không thì `labels.saveFailed`) và thông báo nó; `fieldErrors` của `DataGridSaveError` đánh dấu đúng ô hay trường đó là lỗi (server kiểm dữ liệu qua đây; kiểm bất đồng bộ trong từng ô thì ngoài phạm vi).
  - Không có `onSaving`: `devWarn`, thay đổi bị bỏ khi "lưu".
- **Trình sửa mặc định** (bản quyết định; `editor(ctx)` để thay): chuỗi `Input` (`multiline`: `Textarea`, chỉ ở `form` và `popup`; ở ba chế độ trong ô, cột `multiline` hiện chữ, không sửa tại chỗ: Claude chốt, vì `Enter` của Textarea xuống dòng mà `Enter` của ô là lưu), số `NumberInput` (dùng `format` của cột nếu là tuỳ chọn `Intl`), ngày `DatePicker` (chuyển qua lại ISO; giá trị gốc là `Date` thì lưu lại `Date` lúc nửa đêm giờ địa phương, là chuỗi thì chuỗi ISO), boolean `Checkbox` (giữa ô; `Space` đổi), lookup `Select` khi có tối đa 20 mục, `Combobox` khi nhiều hơn (Claude chốt ngưỡng; `lookup.searchable` ép một trong hai); giá trị của lookup được đổi thành chuỗi cho Select/Combobox và đổi lại theo `valueField`. Cỡ: `sm` ở `compact`, `md` ở chỗ khác. Tên của trình sửa: `caption` (trong ô) hay nhãn của `Field` (form, popup). Cột `allowEditing: false`, `value` không có `setValue`, hay `allowEditing(row)` trả `false`: chữ thường trong chế độ `row` và form (điểm mở).
- **Kiểm tra dữ liệu** (`validationRules`, bản quyết định): `required` (rỗng theo `isBlank`), `range` (số; ngày bằng chuỗi ISO), `stringLength`, `pattern`, `email` (một `@`, phần sau có dấu chấm; cố ý lỏng), `custom` (đồng bộ: chuỗi là lời báo, `false` là lỗi với `message`). Lời báo mặc định qua `labels.validation` (hàm của `caption` và giới hạn). **Khi chạy** (Claude chốt): một trường khi trình sửa của nó chốt giá trị (rời ô, `Enter`, Tab; form: rời trường), và mọi trường sửa được của mọi dòng có thay đổi khi lưu (dòng mới: mọi trường; dòng sửa: mọi trường, để `required` của trường chưa chạm cũng được kiểm). Còn lỗi thì không lưu: focus tới chỗ lỗi đầu tiên và thông báo `labels.announceErrors(n)`. Lỗi hiện ở ô (E2) hay ở `Field` (form, popup), trình sửa có `aria-invalid` và `aria-describedby` trỏ vào một bản chữ ẩn của lời báo trong ô (luôn có, nên được đọc ngay khi focus, trước cả Tooltip).
- **Năm chế độ** (bản quyết định) và phím:

  | Chế độ | Bắt đầu | Trong lúc sửa | Lưu | Huỷ |
  |---|---|---|---|---|
  | `row` | Nút Sửa; `Enter`/`F2` trên một ô của dòng | Mọi ô sửa được của dòng thành trình sửa (E2); `Tab`/`Shift+Tab` đi qua các trình sửa rồi ✓ ✕ theo thứ tự DOM, rồi ra khỏi grid (dòng vẫn ở chế độ sửa) | Nút ✓; `Enter` trong một trình sửa (không khi popup của Select, DatePicker đang mở, không trong Textarea) | Nút ✕; `Esc` (popup của trình sửa đang mở thì `Esc` đóng popup trước) |
  | `cell` | Bấm ô (`startEditAction` `'click'`, mặc định; `'dblClick'`); `Enter`, `F2`, gõ ký tự | Một ô; `Tab`/`Shift+Tab` chốt và sang ô sửa được kế tiếp (qua hàng), mở trình sửa của nó | Rời ô (chốt) hay `Enter` (chốt, focus ở lại ô): mỗi lần chốt là một `onSaving([update])` | `Esc`: trả giá trị cũ, về ô |
  | `batch` | Như `cell` | Như `cell`, nhưng chốt chỉ ghi thay đổi (dấu E2) | "Lưu thay đổi" trên thanh lưu, `handle.saveChanges()` | "Bỏ thay đổi", `handle.cancelChanges()`; `Esc` chỉ huỷ ô đang sửa |
  | `form` | Nút Sửa; `Enter`/`F2` trên một ô | Form EF1 thay chỗ dòng; focus vào trường sửa được đầu tiên (EF1); phím của grid không chạy trong form; `Tab` đi qua các trường và nút | Nút Lưu; `Enter` trong một ô nhập (form gốc `<form>`, gửi đi) | Nút Huỷ; `Esc` |
  | `popup` | Như `form` | Dialog (§4.3 EF1); focus vào trường sửa được đầu tiên (`initialFocus`) | Như `form` | Huỷ, `Esc`; bấm ra ngoài không đóng (`closeOnOutsideClick={false}`, để một cú bấm lạc không bỏ mất thay đổi; Claude chốt) |

  - Chỉ một dòng ở chế độ sửa mỗi lúc trong `row`, `form`, `popup`: bắt đầu sửa dòng khác khi dòng đang sửa có thay đổi thì lưu dòng đó trước (lỗi thì ở lại).
  - **Focus khi trình sửa biến mất:** trước khi bỏ trình sửa (chốt, huỷ, lưu xong), grid đưa focus về ô (hay về ô đầu của dòng, với form và popup qua `returnFocus` của Dialog), để focus không rơi về `<body>`.
  - **Chế độ `cell` khi Promise đang chờ:** lần chốt kế tiếp được xếp hàng và gửi sau; reject: thay đổi ở lại ô đó với dấu lỗi và lời báo, `Enter` để gửi lại, `Esc` để bỏ.
- **Thêm dòng** (bản quyết định): nút "Thêm" trên thanh công cụ (khi `allowAdding`) hay `addRow()`. `row`: một dòng mới đang sửa ở `newRowPosition` của trang hiện tại (mặc định `'first'`), cả khi đang sắp xếp; `cell`, `batch`: dòng mới có dấu, focus vào ô sửa được đầu; `form`: form mới ở đầu (hay cuối); `popup`: Dialog "New row". Giá trị đầu từ `initNewRow()`. Dòng mới được giữ qua lọc và sắp xếp tới khi lưu (§3.5). Thông báo `labels.announceRowAdded`.
- **Xoá:** nút thùng rác ở cột thao tác (khi `allowDeleting`); `confirmDelete` (mặc định `true`) mở một `Dialog alert` cỡ `sm`: tiêu đề `labels.deleteTitle`, mô tả `labels.deleteDescription(name)`, Huỷ (`secondary`, nhận focus đầu), Xoá (`danger`); đồng ý thì `onSaving([remove])`. `batch` chỉ đánh dấu (không hỏi lại), nút Hoàn tác trả lại. Sau khi xoá, focus sang dòng cùng chỉ số. Thông báo `labels.announceRowDeleted` / `announceRowMarkedDeleted`.
- **Thanh lưu của batch:** §4.3 E2; hiện khi có ít nhất một thay đổi; số là số dòng có thay đổi (điểm mở). Thay đổi đầu tiên được thông báo một lần (`labels.unsavedChanges(n)`).
- **Popup:** `editing.popup` = `{ size: 'lg', movable: false, fullScreenOnPhone: true }` mặc định. `movable` mặc định `false` (§1: EF1 không vẽ tay nắm).

**Xuất CSV** (Plan G)

- **Dòng:** mọi dòng đang thấy sau tìm kiếm, lọc và sắp xếp, **mọi trang** (bản quyết định), theo thứ tự đang hiển thị nhưng phẳng (không hàng nhóm, không tổng, không chi tiết); `selectedOnly` chỉ dòng đã chọn. Giá trị lấy từ `data` đã lưu, không gồm thay đổi chưa lưu của batch (Claude chốt). Chế độ server: chỉ trang hiện tại (`devWarn`; docs: xuất ở server).
- **Cột:** các cột dữ liệu đang hiện, theo thứ tự đang hiển thị (trái ghim, giữa, phải ghim), trừ `exportable: false`; không có cột phục vụ. Hàng đầu là `caption`.
- **Giá trị:** `values: 'formatted'` (mặc định): chữ đã định dạng như ô (lookup theo chữ hiển thị, boolean `labels.yes`/`labels.no`); `'raw'`: số bằng `String(n)` (dấu chấm thập phân), ngày ISO 8601 (ngày không giờ: `YYYY-MM-DD`), boolean `true`/`false`, lookup theo giá trị.
- **Định dạng file** (RFC 4180): dấu ngăn `,` (`separator`: `;` cho Excel ở vùng dùng dấu phẩy thập phân, `\t`); một trường được bọc `"` khi có dấu ngăn, `"`, CR, LF hay khoảng trắng đầu/cuối, `"` bên trong nhân đôi; xuống dòng CRLF; BOM UTF-8 `﻿` ở đầu (`bom`, mặc định `true`) để Excel đọc đúng tiếng Việt. **Chặn công thức** (`escapeFormulas`, mặc định `true`, OWASP CSV injection): trường chữ (cột `string`, lookup) bắt đầu bằng `=`, `+`, `-`, `@`, tab hay CR được thêm `'` ở đầu.
- **`exportCsv(options)`** luôn trả chuỗi; `download: true` (hay có `fileName`) thì tải về bằng `downloadText` với `fileName` (mặc định `data.csv`), kiểu `text/csv;charset=utf-8`. Nút "Xuất CSV" của thanh công cụ gọi nó với `download: true` và các tuỳ chọn của `csvExport`.

**Lưu trạng thái** (Plan G; công thức docs, không có `stateStoring` tự động, bản quyết định)

```tsx
'use client';
const KEY = 'orders-grid-v1';          // đổi hậu tố khi cột thay đổi nhiều
function OrdersGrid({ data }: { data: Order[] }) {
  const [saved, setSaved] = useState<Partial<DataGridState> | null>(null);
  useEffect(() => {                      // sau khi mount: HTML từ server là trạng thái mặc định
    try { setSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null')); } catch { /* chế độ riêng tư */ }
  }, []);
  return (
    <DataGrid
      key={saved ? 'saved' : 'default'}  // render lại một lần với trạng thái đã lưu
      data={data} rowKey="id" columns={columns}
      defaultSort={saved?.sort} defaultFilter={saved?.filter} defaultGrouping={saved?.grouping}
      defaultColumnLayout={saved?.columnLayout} defaultPage={saved?.page}
      onStateChange={({ sort, filter, grouping, columnLayout, page }) => {
        try { localStorage.setItem(KEY, JSON.stringify({ sort, filter, grouping, columnLayout, page })); } catch {}
      }}
    />
  );
}
```

- Không lưu `selectedKeys`, `expandedRows`, `expandedGroups` theo mặc định (thuộc về một lần làm việc); docs nói cách thêm. Id cột không còn bị bỏ qua lặng lẽ (§5), nên trạng thái cũ không làm hỏng grid; hậu tố của khoá để bỏ hẳn trạng thái cũ khi cấu hình đổi lớn.

**`labels`** (mặc định tiếng Anh; khoá chèn giá trị là hàm; `name` là chữ của cột `rowHeader` hay khoá của dòng):

| Nhóm | Khoá và mặc định |
|---|---|
| Thanh công cụ (B–G) | `search` "Search", `searchPlaceholder` "Search…", `columnChooser` "Columns", `exportCsv` "Export CSV", `addRow` "Add row", `groupPanel` "Grouping", `groupBy` "Group by", `groupPanelHint` "Drag a column header here to group by that column", `groupDirection(caption, next)` "Sort ${caption} groups ${next}", `ungroup(caption)` "Ungroup ${caption}" |
| Tiêu đề, menu cột (B, C) | `sortState(direction, level, count)` ", sorted ascending" / ", sorted descending, 2 of 3", `columnMenu(caption)` "${caption} column menu", `sortAscending` "Sort ascending", `sortDescending` "Sort descending", `clearSorting` "Clear sorting", `groupByColumn` "Group by this column", `pinLeft` "Pin to the left", `pinRight` "Pin to the right", `unpin` "Unpin", `moveLeft` "Move left", `moveRight` "Move right", `autoFit` "Fit width to content", `hideColumn` "Hide column", `columnWidth(px)` "${px} px", `lockedColumn` "Always shown", `groupsAndDetails` "Groups and details", `actions` "Actions", `reorderColumn` "Reorder" |
| Chọn, trang (B) | `selectAll` "Select all rows", `selectAllOnPage` "Select all rows on this page", `selectRow(name)` "Select ${name}", `pageInfo(from, to, total)` "${from}–${to} of ${total}", `rowsPerPage` "Rows per page", `pageSize(n)` "${n} / page", `pagination` "Pagination", `previousPage` "Previous page", `nextPage` "Next page", `page(n)` "Page ${n}", `yes` "Yes", `no` "No", `loading` "Loading…", `noData` "No data" |
| Lọc (D) | `filterCell(caption)` "Filter ${caption}", `operator(name)` "Operator: ${name}", `operators` { `'='` "Equals", `'<>'` "Does not equal", `'<'` "Less than", `'>'` "Greater than", `'<='` "Less than or equal to", `'>='` "Greater than or equal to", `between` "Between", `contains` "Contains", `notContains` "Does not contain", `startsWith` "Starts with", `endsWith` "Ends with" }, `all` "(All)", `between` "From – to", `from` "From", `to` "To", `filterColumn(caption, active)` "Filter ${caption}" / "Filter ${caption} (filtered)", `searchValues` "Search values…", `selectAllValues` "(Select all)", `blank` "(Blanks)", `ok` "OK", `cancel` "Cancel", `moreValues(shown, total)` "Showing ${shown} of ${total} values. Search to narrow them.", `and` "and", `isAnyOf` "is any of", `isNoneOf` "is none of", `clearFilter` "Clear filter", `applyFilter` "Apply filter", `noMatches` "No rows match the filter" |
| Nhóm, tổng, chi tiết, kéo dòng (E) | `groupCount(n)` "(${n})", `continued` "(continued)", `summary` { `count` "Count", `sum` "Total", `avg` "Average", `min` "Min", `max` "Max" }, `summaryOf(type, caption)` "${type} of ${caption}", `showDetails(name)` "Show details of ${name}", `hideDetails(name)` "Hide details of ${name}", `reorderRow(name)` "Reorder ${name}", `moveUp` "Move up", `moveDown` "Move down", `moveToTop` "Move to top", `moveToBottom` "Move to bottom", `reorderDisabled` "Clear sorting and grouping to reorder rows" |
| Sửa (F) | `edit(name)` "Edit ${name}", `delete(name)` "Delete ${name}", `save(name)` "Save ${name}", `cancelEdit(name)` "Cancel editing ${name}", `undoDelete(name)` "Undo deleting ${name}", `newRow` "(new)", `changedCell` "changed", `deletedRow` "marked for deletion", `unsavedChanges(n)` "1 unsaved change" / "${n} unsaved changes", `saveChanges` "Save changes", `discardChanges` "Discard changes", `editRowTitle(name)` "Edit ${name}", `newRowTitle` "New row", `requiredHint` "Fields marked * are required.", `saveButton` "Save", `cancelButton` "Cancel", `deleteTitle` "Delete this row?", `deleteDescription(name)` "${name} will be deleted.", `deleteConfirm` "Delete", `saveFailed` "The changes could not be saved.", `validation` { `required(caption)` "${caption} is required", `range(caption, min, max)` "${caption} must be between ${min} and ${max}" (hay "at least" / "at most" khi thiếu một đầu), `stringLength(caption, min, max)` tương tự với "characters", `pattern(caption)` "${caption} is not valid", `email(caption)` "${caption} must be an email address" } |
| Thông báo live (B–F) | `announceSort(text)`, `announceSortCleared` "Sorting cleared", `announceSelected(n)` "${n} rows selected", `announceRowsFound(n)` "${n} rows" / "No rows", `announceMoved(caption, position, count)` "${caption} moved to column ${position} of ${count}", `announceResized(caption, px)` "${caption}, ${px} pixels wide", `announcePinned(caption, side)`, `announceUnpinned(caption)`, `announceHidden(caption)`, `announceShown(caption)`, `announceGrouped(caption)` "Grouped by ${caption}", `announceUngrouped(caption)`, `announceRowMoved(name, position, count)`, `announceSaved` "Changes saved", `announceRowAdded` "Row added", `announceRowDeleted` "Row deleted", `announceRowMarkedDeleted` "Row marked for deletion", `announceErrors(n)` "${n} fields need attention" |

---

## 7. Kiểm thử

Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn 2–5 §7 giữ nguyên, thêm phần sau.

| # | Lớp | Bổ sung ở giai đoạn 6 |
|---|---|---|
| 1 | Unit (jsdom, React 19 và 18.3) | **shortcut-format:** mọi dòng của bảng §3.3 trên hai nền tảng (ký hiệu, chữ, tên ẩn, `aria-keyshortcuts`), giữ thứ tự, phần lạ, phần rỗng, `plus`. **Kbd:** `children`; `keys` ra `<kbd>` lồng, chữ ẩn "+" giữa các phím, tên ẩn của ký hiệu; dạng "nơi khác" ở lần render đầu và Apple sau khi mount (giả lập `navigator`); `labels`; cảnh báo. **MenuShortcut:** `keys`, `children` như cũ, cả hai thì cảnh báo. **SearchField:** chữ gợi ý và `aria-keyshortcuts` như cũ (các test cũ chạy nguyên). **Dialog `movable`:** máy trạng thái với sự kiện con trỏ và hình chữ nhật giả lập: ngưỡng 3px, kẹp bốn phía, kẹp lại khi `ResizeObserver` báo, `dblclick` về giữa, phần tử tương tác trong header không bắt đầu kéo, `data-dragging`, dưới 640px không kéo (giả lập `matchMedia`), `setPointerCapture` ném lỗi không làm hỏng gì, mở lại thì ở giữa, cảnh báo thiếu header; `fullScreenOnPhone` đặt thuộc tính. **Engine** (mỗi file một test): sắp xếp ổn định, rỗng cuối ở hai chiều, "DH-2" trước "DH-10", `sortValue`, lookup theo chữ; mọi toán tử theo kiểu, quy tắc rỗng, `between` gồm hai đầu, gập dấu cả "đ"; tìm kiếm theo chữ đã định dạng; lọc ở header thu theo bộ lọc khác, `exclude`; nhóm nhiều cấp, khoá nhóm, thứ tự theo `sortValue`, nhóm rỗng; tổng (`avg`, `min`/`max` ngày, hàm tuỳ biến, tổng trên mọi dòng sau lọc, trừ dòng chờ xoá); làm phẳng theo `expandedGroups`, tiêu đề "(continued)" khi cắt trang; cửa sổ ảo (dòng đo được, dòng hoạt động được giữ); độ rộng, vị trí ghim, đổi chỗ trong vùng; `applyChanges`, `rowDiff`; mọi luật kiểm tra và lời báo; CSV (bọc `"`, nhân đôi `"`, CRLF, BOM, `;` và tab, `raw` và `formatted`, chặn công thức). **Hiệu năng:** `engine/perf.test.ts` (§3.5). **DataGrid:** vai trò `grid`/`treegrid`; `aria-sort` chỉ ở cấp đầu và chữ ẩn của các cấp sau; `aria-selected`, `aria-multiselectable`; `aria-rowcount`/`aria-rowindex` chỉ khi cuộn ảo; `aria-level`/`aria-expanded`/`aria-setsize`/`aria-posinset`; nút chi tiết `aria-expanded`/`aria-controls`; đúng một `tabindex="0"`; từng dòng của bản đồ phím (§3.6); chế độ widget; chọn dòng (`single`, `multiple`, khoảng, `mod+A`, hai `selectAllMode`); mọi bộ ba controlled và uncontrolled, `onStateChange`; chế độ server chỉ gọi callback; `labels`; thông báo live (đồng hồ giả); cảnh báo; thao tác cột bằng phím và menu; popover lọc ở header; hàng lọc (debounce); năm chế độ sửa, `onSaving` resolve, reject, `fieldErrors`, lúc chạy kiểm tra; hỏi lại khi xoá; thêm dòng; `exportCsv` (chuỗi, tải về với `URL.createObjectURL` giả lập); mọi phương thức của `DataGridHandle` |
| 2 | Trình duyệt thật (Chromium, Firefox, WebKit) | **Dialog:** kéo bằng chuột thật và bằng chạm (giả lập chạm), kẹp ở mép, đổi cỡ cửa sổ thì kẹp lại, qua 640px thì về giữa và không kéo, thả ngoài panel sau khi kéo không đóng; toàn màn hình ở 390px. **Grid:** header, hàng lọc, tổng và cột ghim dính khi cuộn hai chiều (ô ghim đặc chỉ sau khi cuộn, không lộ chữ bên dưới); khoảng cách giữa hai dòng đo được bằng hằng số của §4.3 ở cả ba variant (lệch thì grid vẫn dùng số đo, nhưng test báo để sửa hằng số); 10 000 dòng ảo: `mod+End` tới dòng cuối với `aria-rowindex` đúng, số dòng trong DOM giữ trong giới hạn, cuộn bằng chuột ra xa dòng có focus mà focus không rơi; focus đi bằng phím không bao giờ nằm dưới header, tổng hay cột ghim (`scroll-padding`); đổi độ rộng và kéo cột bằng chuột thật, tay nắm đổi độ rộng bằng chạm; kéo dòng bằng chạm; phím trong listbox của Select, lịch của DatePicker trong ô không lọt ra grid, `Esc` đóng popup trước rồi mới huỷ sửa; form EF1 dính trái khi bảng đã cuộn ngang |
| 3 | Accessibility (axe) | Chạy sau play function, ở mọi story. Đặc biệt: `aria-required-children`, `aria-required-parent` (grid, treegrid, row), `aria-allowed-attr` (`aria-selected`, `aria-sort`, `aria-expanded` trên hàng), `aria-hidden-focus` (hàng đệm), `empty-table-header` (tiêu đề của cột phục vụ có chữ ẩn), `nested-interactive`, `button-name`, `aria-dialog-name` (popover lọc, popup, hỏi lại), `label` (ô lọc) |
| 4 | Tương phản | Các cặp mới ở §4.4, cả chế độ mặc định lẫn `prefers-contrast: more` |
| 5 | Visual regression | Mỗi phương án đã chọn một hay nhiều story vẽ lại đúng các trạng thái của mockup, ở 4 chế độ × light/dark (danh sách bên dưới) |
| 6 | Screen reader (thủ công) | NVDA (Chrome, Firefox) và VoiceOver (macOS, iOS): Kbd đọc "Command plus K", "Control plus K"; Dialog kéo được không đổi cách đọc; grid: tên, tiêu đề cột và tiêu đề dòng được đọc khi đi qua ô, trạng thái sắp xếp kể cả cấp hai, chọn dòng, cấp và mở/đóng của treegrid, vị trí dòng khi cuộn ảo ("row 5,000 of 10,002"), thông báo live (sắp xếp, số dòng sau lọc, lưu), tên và lỗi của trình sửa (`aria-describedby`), popup, popover lọc, menu cột; NVDA tự vào chế độ focus khi tới grid |

**Story giao diện** (dựng lại nội dung mẫu của mockup; tiếng Anh như các story trước, trừ chỗ cần chữ của mockup để so; trạng thái kéo qua `data-visual-drag`, hover qua `data-visual-hover`, focus bàn phím và popup mở qua play function):

- **Plan A** (khoảng 10 story × 8 = 80 ảnh): `KbdInTextApple`, `KbdInTextOther` (câu chữ, Button `primary` "Save ⌘S", SearchField để so; nền tảng đặt bằng loader của story), `KbdInTooltipApple`, `KbdInTooltipOther`, `KbdInMenuApple`, `KbdInMenuOther` (menu mở, mục "Paste" đang được trỏ); `DialogMovable` (nghỉ, ở giữa), `DialogMovableHover` (header hover), `DialogMovableDragging` (kéo lệch `-112px, -34px` như mockup), `DialogMovablePhone` (`viewport-390x844`, không tay nắm).
- **Plan B** (khoảng 7 × 8 = 56): `GridCore` (phần của G1 mà B có: sắp hai cấp, ô chọn tiêu đề một phần, hai dòng đã chọn, một dòng hover, một ô có focus bàn phím, thanh phân trang), `GridStriped`, `GridMinimal`, `GridCompact`, `GridLoading`, `GridReloading`, `GridEmpty`. Story hành vi `no-visual`: 10 000 dòng ảo, chế độ server, bản đồ phím.
- **Plan C** (khoảng 7 × 8 = 56): `GridColumns` (G1 với cột ghim, ⋮ trên tiêu đề hover, nút chọn cột và xuất), `GridColumnsScrolled` (khung 700px đã cuộn ngang: ô ghim đặc, bóng ở mép), `ColumnResizeHandle` (nghỉ, hover), `ColumnResizing` (kéo +20px, nhãn "180 px"), `ColumnDragging` (kéo cột Kênh), `ColumnMenu` (menu của Khách hàng, "Ghim bên trái" đang được trỏ), `ColumnChooser` (Kênh đang ẩn, Mã đơn có ổ khoá).
- **Plan D** (khoảng 4 × 8 = 32): `G1` (đủ mặt G1: thêm ô tìm kiếm, phễu, phễu đặc của Trạng thái), `GridFiltering` (F1: hàng lọc có giá trị, toán tử đang bật, popover lọc của Trạng thái mở, tìm "minh" tô sáng, thanh bộ lọc, 6 dòng), `GridFilterEmpty`, `FilterOperatorMenu` (ngoài mockup).
- **Plan E** (khoảng 4 × 8 = 32): `GridGroups` (R1: thanh nhóm hai chip, nhóm hai cấp, tổng nhóm, DH-1024 mở chi tiết, tổng cuối bảng), `GroupPanelEmpty`, `GroupPanelDropTarget` (tiêu đề kéo trên thanh nhóm; ngoài mockup), `RowReorderDragging` (ngoài mockup).
- **Plan F** (khoảng 9 × 8 = 72): `EditRow` (E2 a), `EditCell`, `EditCellError` (E2 b), `EditBatch` (E2 c), `EditForm` (EF1 a), `EditPopup`, `EditPopupPhone` (`viewport-390x844`) (EF1 b), `ConfirmDelete`, và `DialogFullScreenPhone` của chính Dialog.
- **Plan G** (2 × 8 = 16): `DataGridExample` (1280×720), `DataGridExamplePhone` (390×844).
- Ảnh chuẩn mới: khoảng 340 ảnh qua bảy plan (§10). Story của DataGrid ở B–F mang tag `unreleased` (§2).

**Harness visual** (`tests/visual/stories.visual.ts`, Plan A):

- **`data-visual-drag="dx,dy"`:** phần tử đầu tiên mang thuộc tính này được kéo bằng chuột thật sau khi Storybook báo render xong: chuột tới tâm phần tử, `mouse.down()`, đi `dx, dy` trong 5 bước, chờ hai khung hình, rồi chụp, không thả. Lý do: `:hover` và pointer capture cần con trỏ thật (sự kiện tổng hợp của play function không đặt được capture, và trình duyệt không coi chúng là hover; spec giai đoạn 5 §7). Một story chỉ dùng một trong `data-visual-hover` và `data-visual-drag`. Story không có thuộc tính này chụp như cũ.

**Kiểm tra bổ sung:**

- **Test kiểu:** `field` chỉ nhận khoá chuỗi của `TRow`; `value` của `cell` đúng kiểu của `field`; cột `value` bắt buộc `id`; `rowKey` là khoá hay hàm; `TRow` suy từ `data`; `dataGridColumn` giữ `V`; `editing.mode`, `density`, `scrolling`, `selectionMode` từ chối giá trị lạ; trạng thái chỉ chứa kiểu JSON; `KbdProps` không nhận cả `keys` lẫn `children`; `MenuShortcutProps` tương tự; `movable`, `fullScreenOnPhone` là boolean; `DataGridHandle`.
- **Gói phát hành:** `check:use-client`, `check:rsc` theo §3.1; `check:dist-css` thêm `flg-kbd`, `flg-dialog-header`, `flg-dialog-grip`, `flg-data-grid`, `flg-data-grid-toolbar`, `flg-data-grid-frame`, `flg-data-grid-head`, `flg-data-grid-head-button`, `flg-data-grid-resizer`, `flg-data-grid-drop-line`, `flg-data-grid-filter-row`, `flg-data-grid-operator`, `flg-data-grid-value-list`, `flg-data-grid-match`, `flg-data-grid-filter-panel`, `flg-data-grid-group-panel`, `flg-data-grid-group-chip`, `flg-data-grid-group-row`, `flg-data-grid-detail-row`, `flg-data-grid-savebar`, `flg-data-grid-form`, `flg-data-grid-actions`, `flg-data-grid-pager`…; `size-limit` ghi lại ngưỡng ở mỗi plan.
- **`theme-css.test.ts`** giữ `--flg-dialog-lift-shadow`, `--flg-data-grid-pin-shadow`, `--flg-column-resize-line` đúng giá trị mockup.
- **`src/index.test.ts`** (G): `DataGrid`, `dataGridColumn` và các kiểu có trong export; trước G, một test giữ cho `DataGrid` **không** có trong `src/index.ts`.
- **Fixtures** (Plan G), mỗi app một trang riêng cho grid (Next.js: route `/grid`; Vite: entry thứ ba `grid.html`), để trang hiện có không đổi:
  - `next-app`: `app/grid/page.tsx` là Server Component, đọc một mảng đơn hàng mẫu và truyền xuống client component `orders-grid.tsx` (cột, `rowKey`, hàng lọc, lọc ở header, thanh nhóm với nhóm mặc định, tổng, chế độ sửa `row` với `onSaving` cập nhật state, xuất CSV).
  - `vite-app`: cùng bộ trong client.
  - Kịch bản: HTML từ server có `role="treegrid"`, `aria-sort`, tên từ caption, các dòng của trang đầu và hàng nhóm; hydrate không có cảnh báo; bấm tiêu đề thì sắp xếp; gõ vào hàng lọc thì số đếm đổi; nhóm qua menu cột; sửa một ô rồi lưu thì `data` đổi; `exportCsv()` bắt đầu bằng BOM và hàng tiêu đề; **tree-shaking:** bundle JS của trang chính (không import `DataGrid`) không chứa chuỗi riêng của DataGrid (lời `devWarn` "<DataGrid> needs a name"). Console sạch, như các giai đoạn trước. Chạy theo hướng dẫn cổng của dự án (bản sao đổi cổng của `test:fixtures`).

---

## 8. Docs và phát hành

- **Mỗi component mới có một trang MDX,** cùng khuôn với các giai đoạn trước (cách dùng, bảng props, ví dụ, ghi chú accessibility, "nên / không nên"):
  - `Kbd.mdx` (A): ngữ pháp (bảng §3.3), Apple và nơi khác, HTML từ server (đổi sau khi mount), ngữ cảnh (câu chữ, Tooltip, menu, nút), Kbd trong nút và `aria-keyshortcuts`, `labels`. Trang của menu thêm `MenuShortcut keys`; trang SearchField ghi nó dùng chung bộ định dạng.
  - `Dialog.mdx`: mục "Movable" (A: kéo bằng header, 640px, về giữa, chạm, lý do không có phím theo WCAG 2.5.7) và "Full screen on phones" (F).
  - `DataGrid.mdx` (B, lớn dần tới G; tag `unreleased` tới G): tổng quan và khi nào dùng `Table` hay `DataGrid`; cột và `dataType`, kiểu tổng quát, `dataGridColumn`; client component bọc grid và RSC; `columns` ổn định; sắp xếp, chọn dòng, phân trang, cuộn ảo (cần `height`), chế độ server; thao tác cột; lọc; nhóm, tổng, master-detail, kéo dòng; sửa dữ liệu (bảng năm chế độ, `onSaving`, kiểm tra, lỗi từ server); CSV; lưu trạng thái; **bảng phím** (§3.6, vẽ bằng `Kbd`) và **bảng chạm** (§3.8); `labels`; giới hạn của tự vừa độ rộng (chỉ đo các dòng đang vẽ).
- **Trang "Examples/Data grid"** (G, bản quyết định): một grid đủ tính năng trên dữ liệu đơn hàng mẫu (Lumen): caption, tìm kiếm, hàng lọc, lọc ở header, thanh bộ lọc, thanh nhóm, tổng, master-detail, cột ghim, chọn dòng, sửa (`row`, đổi được sang các chế độ khác bằng một Segmented control của ví dụ), xuất CSV, lưu trạng thái; Badge trạng thái theo đúng mockup (Mới `accent`, Đang xử lý `warning`, Đã giao `success`, Đã huỷ `danger`). Mỗi tính năng có trang story riêng.
- **Getting started**, mục mới **"Data grid"** (G): client component bọc grid, mảng cột, `rowKey`, dữ liệu từ Server Component, `locale` cho HTML từ server và client giống nhau (và cùng bản ICU, §10), chế độ server tóm tắt.
- **Accessibility:** bảng §4.9 tự dựng từ `scripts/contrast-exceptions.ts`, nên có các dòng 37–43 và nhãn mới của các dòng được mở rộng (§4.4); plan nào thêm dòng thì sửa cả bảng §4.9 và đoạn sau nó trong spec 0+1. Ghi chú: mẫu grid và treegrid, một điểm Tab, chế độ widget, vùng live, Kbd đọc tên ký hiệu, Dialog kéo được không có phím và vì sao.
- **Theming:** ba token mới; `--flg-data-grid-pin-bg` theo `--flg-glass-tint-solid`.
- **`size-limit`:** từ plan B thêm mục "JS (DataGrid)": `dist/components/data-grid/DataGrid.js`, `import: "{ DataGrid }"` (đo được khi chưa export từ `src/index.ts`); mục "JS (all exports)" và "CSS (styles.css)" ghi lại ở mỗi plan.
- **Phát hành:**
  - Một changeset `minor` cho `0.5.0` (G): `.changeset/phase-6-data-grid.md`, liệt kê `Kbd`, `MenuShortcut keys`, `DialogContent movable` và `fullScreenOnPhone`, `DataGrid` cùng `dataGridColumn` và các kiểu, ba token mới. Không có thay đổi phá vỡ.
  - **Việc của chủ dự án không đổi** (spec 0+1 §8.3): chủ dự án là người publish.

---

## 9. Tiêu chí hoàn thành giai đoạn 6

1. Kbd (cùng `MenuShortcut keys`), Dialog (`movable`, `fullScreenOnPhone`) và DataGrid qua các lớp 1–5 ở §7.
   - DataGrid được tính đủ khi mọi nhóm tính năng của bảng phạm vi (bản quyết định) qua các lớp 1–5: hiển thị theo kiểu, bàn phím, sắp xếp, chọn dòng, phân trang, cuộn ảo, chế độ server, đổi độ rộng, kéo cột, ghim, chọn cột, menu cột, bốn cách lọc, nhóm, hai loại tổng, master-detail, kéo dòng, năm chế độ sửa, kiểm tra dữ liệu, xuất CSV, lưu trạng thái.
   - Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục.
2. Toàn bộ kiểm tra bổ sung ở §7 xanh trong CI, gồm test hiệu năng của engine.
3. Fixture Vite và fixture Next.js chạy đủ kịch bản ở §7 từ tarball, kể cả kiểm tree-shaking.
4. Mọi cặp tương phản mới đã đạt, hoặc đã có trong §4.9 kèm số đo, và các dòng 37–43 đã được chủ dự án duyệt.
5. Trang Examples/Data grid, mục "Data grid" của Getting started và công thức lưu trạng thái có trên docs; `DataGrid` được export từ `src/index.ts`.
6. Changeset `0.5.0` đã sẵn sàng. Việc publish là quyết định của chủ dự án.

---

## 10. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Hiệu năng 10 000 dòng ở chế độ client: sắp xếp, lọc, nhóm, và render khi cuộn | Engine thuần có nhớ theo bước (§3.5), chữ đã định dạng nhớ theo dòng, khoá so tính trước; cuộn ảo vẽ khoảng 40 dòng; `devWarn` khi `columns` không ổn định. Test hiệu năng trong CI với ngân sách gấp ba, số đo thật trong mô tả PR của B, D, E. Nếu vượt: giảm vùng đệm, tách việc tính chữ cho tìm kiếm sang lúc rảnh (`requestIdleCallback`), ghi trong PR |
| `sticky` lồng nhau (ô ghim trong `<thead>` dính, `<tfoot>` dính dưới) cùng hàng đệm của cuộn ảo, nhất là WebKit (giai đoạn 4 đã gặp `<thead>` của `striped` chứa cả 2px spacing ở WebKit) | Lớp 2 ở cả ba engine, cả ba variant; khoảng cách dòng đo thật thay vì tin hằng số (§3.7). Nếu WebKit không dính ô ghim trong `<thead>` dính: ô tiêu đề dính từng ô (`top` và `left` trên `th`) thay cho cả `<thead>`, ghi trong PR |
| Focus rơi về `<body>` khi dòng ảo bị gỡ, khi trình sửa biến mất, khi dòng bị lọc hay xoá | Dòng hoạt động luôn được render (§3.7); focus về ô trước khi bỏ trình sửa (§6.3); vị trí hoạt động theo khoá và chuyển sang dòng cùng chỉ số (§3.6). Lớp 1 và 2 kiểm từng đường |
| Trình sửa trong ô và roving focus: phím mũi tên, `Enter`, `Esc`, `Tab` của Input, Select, Combobox, DatePicker đụng phím của grid | Grid bỏ qua sự kiện đã `defaultPrevented`, đang soạn chữ, hay từ trong một `[popover]` (§3.6); bảng phím theo chế độ (§6.3); lớp 2 kiểm từng trình sửa, kể cả `Esc` khi popup của nó đang mở |
| Kích thước CSS và JS | CSS của DataGrid (ước tính 5–6 KB gzip) nằm trong `styles.css` cho mọi app (bản quyết định); JS ước tính 35–45 KB gzip, chỉ app import `DataGrid` mới mang (tree-shaking, fixture kiểm). Mục `size-limit` riêng từ B; mô tả PR nêu số tăng của mỗi plan |
| Hydrate của grid render từ server: chữ định dạng khác nhau khi Node và trình duyệt có bản ICU khác (dấu cách hẹp trong tiền tệ…), cột co giãn xê dịch sau khi đo | `locale` mặc định cố định; docs khuyên Node có ICU đầy đủ và cột có `width` khi muốn không xê dịch; fixture Next.js kiểm console sạch. Nếu một định dạng vẫn lệch: định dạng đó chỉ chạy sau khi mount, ghi trong PR |
| Số ảnh chuẩn: khoảng 340 ảnh mới (hiện có 1228) | Mỗi plan chỉ thêm ảnh của mình, tạo qua workflow `visual-update.yml`; mô tả PR nêu số ảnh theo nhóm. Story `GridCore` của B không chụp lại ở C, D (C, D có story riêng) |
| Bảy dòng mới của §4.9 | Đúng mockup; đều đạt ở `prefers-contrast: more`; nêu trong mô tả PR của plan thêm chúng. Nếu chủ dự án muốn sửa ở theme mặc định thì đó là đổi giao diện đã duyệt, cần chủ dự án chọn lại |
| Coi việc di chuyển Dialog là trình bày, không phải chức năng (WCAG 2.5.7, 2.1.1) | Lý do ghi ở §3.4 và docs. Nếu một đợt kiểm định không đồng ý: thêm `Alt+mũi tên` trên header ở một bản sau, không đổi API |
| Tổ hợp phím của grid trùng phím của hệ điều hành hay trình đọc màn hình ở một máy nào đó | Mọi thao tác có đường qua menu (`Alt+↓`, `Shift+F10`); docs liệt kê phím; NVDA và VoiceOver được thử ở lớp 6 |
| Chip, menu, popover lọc nằm ngoài `<table>` (một cái cho cả grid) | `aria-controls`, `aria-expanded` trên nút mở; focus vào trong khi mở, về nút khi đóng; lớp 1 và 3 kiểm |
| Story và trang MDX của DataGrid hiện trên docs công khai trước plan G | Tag `unreleased` ẩn khỏi sidebar của bản build (§2). Nếu cấu hình tag của Storybook 10 không ẩn được: đặt chúng dưới tiêu đề `Internal/` và loại khỏi glob `stories` của bản build docs, ghi trong PR của B |
| Kbd trên Apple hiện "Ctrl K" một khung hình trước khi thành "⌘K" | Như SearchField, nền tảng chỉ biết sau khi mount; docs ghi rõ. Kbd trong câu chữ không thể để trống chỗ (§3.3) |
| Excel mở CSV với dấu ngăn của vùng | BOM UTF-8; `separator: ';'` cho vùng dùng dấu phẩy thập phân; docs có ví dụ |
| Chế độ server thiếu nhóm và cuộn ảo | Ngoài phạm vi (bản quyết định), `devWarn` khi dùng chung; docs nói rõ và chỉ cách phân trang |

