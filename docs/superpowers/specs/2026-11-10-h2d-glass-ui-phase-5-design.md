# h2d-glass-ui — Thiết kế giai đoạn 5 (khung ứng dụng: AppShell)

> Liên kết tới các spec trước giữ tên file cũ (`fl-glass-ui`), để các plan đã thực thi vẫn trỏ đúng.

- **Ngày:** 2026-11-10
- **Trạng thái:** Đã duyệt (2026-11-10), kể cả các dòng 35–36 của §4.9
- **Phạm vi spec này:** Giai đoạn 5: khung ứng dụng `AppShell` cùng các phần của nó, điều hướng `Nav`, các widget của header (`SearchField`, `ThemeSwitch`, `ThemeMenuGroup`, `ThemeScript`, `UserMenu`, `Indicator`), công thức bảng thông báo trong docs, và bản phát hành `0.4.0`.
- **Spec trước:** [`2026-10-01-fl-glass-ui-phase-0-1-design.md`](2026-10-01-fl-glass-ui-phase-0-1-design.md) ("spec 0+1"), [`2026-10-05-fl-glass-ui-phase-2-design.md`](2026-10-05-fl-glass-ui-phase-2-design.md) ("spec giai đoạn 2"), [`2026-11-02-fl-glass-ui-phase-3-design.md`](2026-11-02-fl-glass-ui-phase-3-design.md) ("spec giai đoạn 3") và [`2026-11-06-h2d-glass-ui-phase-4-design.md`](2026-11-06-h2d-glass-ui-phase-4-design.md) ("spec giai đoạn 4"). Mọi quy ước ở bốn spec đó vẫn áp dụng, trừ chỗ spec này ghi rõ là thay thế.

---

## 1. Bối cảnh và mục tiêu

Lộ trình gốc (spec 0+1 §2) dừng ở giai đoạn 4, đã xong và phát hành thành `0.3.0` rồi `0.3.1` (`main` ở `1301cbb`). Giai đoạn 5 là phần mở rộng chủ dự án chọn ngày 2026-11-10: "Tôi cần AppShell dạng phổ thông thôi. Có sidebar bên trái, header bên trên, footer có thể có hoặc không. Trên header thì có phần avatar để show personal menu cũng như notification và theme switch, có thể thêm searchbar tùy chọn".

Các ràng buộc của giai đoạn 1–4 giữ nguyên, spec này không nhắc lại:

- Mốc trình duyệt Safari/iOS 17.4 (spec giai đoạn 2 §3.1).
- Dependency lúc chạy chỉ có `clsx` và `@floating-ui/dom` (spec giai đoạn 2 §3.2).
- Theme mặc định đúng tuyệt đối mockup đã duyệt; tương phản AA bảo đảm ở các chế độ người dùng bật (spec 0+1 §1, §4.6, §4.9).
- Quy tắc React Server Components (spec 0+1 §6.2, spec giai đoạn 2 §3.6, spec giai đoạn 3 §3.7, spec giai đoạn 4 §3.1).
- Dùng sai thì `devWarn`, không bao giờ throw (spec 0+1 §5).
- Chữ mặc định bằng tiếng Anh, ghi đè qua prop `labels`; khoá cần chèn giá trị là hàm (spec giai đoạn 3 §6.1).
- Forced colors (spec 0+1 §4.6, spec giai đoạn 2 §4.5) và giảm chuyển động (spec 0+1 §4.6, spec giai đoạn 4 §3.3).
- **Không hỗ trợ viết từ phải sang trái** (chủ dự án, 2026-11-09): dùng cạnh vật lý (`left`, `right`) như các component trước.

**Ai quyết định gì.** Chủ dự án nói "cứ làm đi" và bỏ qua các câu hỏi thiết kế, nên mọi quyết định về phạm vi, hành vi và API là của Claude ("Claude chốt"), kể cả chỗ không ghi từng dòng. Giao diện do chủ dự án chọn qua mockup ngày 2026-11-10: "Cả S1 và S2, cả N1 và N2, cả H2 và H3, T1 và T3, U1 và U2, B1 và B3". Mỗi cặp thành giá trị của một prop (như `variant` của giai đoạn 4), mặc định là phương án đầu của cặp, trừ `Indicator status` (mặc định `'accent'` của B3, lý do ở §3.2). Chỗ ghi "(Claude chốt)" là chỗ chủ dự án nên đọc kỹ, nhất là chỗ đổi so với bản quyết định ban đầu vì code hoặc nền tảng không cho làm đúng như vậy.

### Các điểm Claude chốt chủ dự án nên đọc

| Chủ đề | Quyết định |
|---|---|
| Giao diện thành prop | `AppShell layout`: **`'sidebar'`** (S1) · `'header'` (S2). `Nav variant`: **`'pill'`** (N1) · `'bar'` (N2). `SearchField collapsible`: **`false`** (H2) · `true` (H3). Theme: `ThemeSwitch` (T1, nút trên header) và `ThemeMenuGroup` (T3, nhóm radio đặt trong `UserMenu` hay `DropdownMenu`). `UserMenu showName`: **`false`** (U1) · `true` (U2). `Indicator status`: **`'accent'`** (B3) · `'danger'` (B1) · `'success'` · `'warning'` (§3.2) |
| **Tương phản: cần duyệt** | Hai điểm dưới ngưỡng ở theme mặc định, đúng như mockup, thành dòng **35** (vạch nhấn của mục đang chọn N2 trên nền nhuộm của nó: 2.52 light, 2.03 dark, cần 3:1) và **36** (chữ của phím gợi ý `⌘K` trong ô tìm kiếm và trong tooltip: 3.31 dark, cần 4.5:1) của §4.9 (§4.4). Cả hai đạt ở `prefers-contrast: more` |
| Client và server | `AppShell` cùng các phần, `Nav` cùng các phần, `SearchField`, `ThemeSwitch`, `ThemeMenuGroup`, `UserMenu` là client. `AppShellBrand`, `Indicator`, `ThemeScript` dùng thẳng trong Server Component; nội dung của mọi phần (header, nav, main) vẫn render được từ server qua `children` (§3.1) |
| Tấm trượt trên màn hẹp | Không dùng `Drawer` hay `<dialog>` của lib: cùng một phần tử sidebar nằm trong lưới ở màn rộng và thành tấm trượt ở màn hẹp, để nav chỉ render một lần và giữ trạng thái. Lib tự làm phần modal: `inert` cho skip link, header, main, footer; khoá cuộn; focus; Esc; lớp nền; nút ×. Tấm không vào modal stack và không có `aria-modal`, để vùng toast (trong top layer, nằm trên tấm) vẫn thấy, bấm được và được đọc; điều kiện là `Toaster` không nằm trong header, main hay footer (§3.4) |
| Nút trigger và brand trong header | `AppShellHeader` tự render `AppShellSidebarTrigger` rồi brand ở đầu hàng, trước `children` (prop `sidebarTrigger`, mặc định `true`), thay cho việc người dùng tự đặt trigger như bản quyết định ban đầu: chỉ như vậy thứ tự Tab mới luôn là trigger rồi brand, đúng thứ tự nhìn thấy (§6.3) |
| Brand | Prop `brand` trên `AppShell`, kèm phần server-safe `AppShellBrand` (`logo`, `name`, `href`). Brand được render ở **hai chỗ** (header và đầu sidebar), CSS ẩn hẳn (`display: none`) chỗ không dùng ở mỗi bố cục và mỗi cỡ màn, nên công nghệ hỗ trợ chỉ gặp một (§4.3) |
| Lưới và header dính | Header dính được trong lưới CSS vì nó trải qua mọi hàng của cột mình (`align-self: start`), không nằm gọn trong hàng đầu: phần tử dính không ra khỏi ô lưới của nó. Cạnh viền ở mép màn hình bỏ bằng `border-*-width: 0`, không bằng margin âm như mockup (margin âm ở mép phải làm trang cuộn ngang 1px) (§3.3) |
| Tài liệu dưới header dính | `AppShell` đo header và ghi chiều cao lên `<html>` (`--flg-app-shell-header-offset`); một quy tắc của lib, chỉ ở trang có khung, đặt `scroll-padding-top` từ nó (dự phòng 56px / 60px cho HTML từ server), để focus bằng Shift+Tab, link `#anchor` và tìm trong trang không đưa phần tử vào dưới header (WCAG 2.4.11). Quy tắc thứ hai bỏ margin mặc định của `body`. Đây là lần đầu lib đặt style cho chính tài liệu, và chỉ trên trang có render `AppShell` (Claude chốt; phát hiện khi đọc soát spec; §3.3) |
| Điểm gãy | `breakpoint` `md`/`lg`/`xl`. CSS viết theo kiểu màn hẹp trước; các quy tắc màn rộng (lưới có sidebar, rail) viết một lần và được **sinh ra ba bản**, mỗi điểm gãy một `@media`, vì media query không đọc được biến (§3.3) |
| Nav | Số đo của Nav lấy từ trang mockup Nav (N1, N2); trang bố cục (S) vẽ một nav trung tính để giữ chỗ. Nhãn của nhóm chứa trang hiện tại dùng `--flg-accent-text` thay cho `--flg-selected-text` của mockup (bằng nhau ở mặc định; ở `prefers-contrast: more` thì `--flg-selected-text` là màu chữ trên nền nhấn đặc). Thu gọn thành rail không có animation. Flyout của nhóm trong rail mở mà focus ở yên trên nút nhóm (mẫu disclosure), đóng khi focus rời nút và flyout. Tooltip của rail không nối `aria-describedby` (chữ của nó trùng tên của link) (§4.3, §6.3) |
| Indicator | Mặc định `status="accent"` là có chủ ý, và đây là prop duy nhất có mặc định không phải phương án đầu của cặp chủ dự án viết ("B1 và B3"): Indicator là phần chung (chấm số đếm của rail, avatar…), không chỉ cái chuông; mockup Nav đã duyệt (N1, N2) vẽ chấm số đếm của rail màu nhấn, nên nhấn là mặc định trung tính của nó; đỏ (`'danger'`, B1) là giá trị công thức chuông truyền vào, vì thông báo chưa đọc cần nó (Claude chốt; phát hiện khi đọc soát spec; §3.2). Hai mockup đặt viên số ở hai chỗ khác nhau: B1 (`danger`) ở `top: 0; right: 0`, B3 (`accent`) ở `top: -3px; right: -4px`. Spec giữ đúng từng mockup, nên vị trí đi theo `status` (`success`, `warning` theo B3). Chấm (`dot`) lấy theo chấm số đếm của rail (trang Nav). Hai token mới: `--flg-indicator-accent` (của mockup B3) và `--flg-on-status` (ngoài mockup, chữ trên `success`/`warning`) (§4.2, §4.3) |
| SearchField | Dưới 768px (cố định, không theo `breakpoint` của AppShell): gợi ý phím ẩn; H2 giãn hết chỗ còn lại và chữ của brand chỉ còn dấu; H3 mở thì phủ cả hàng header với nút ←. Nút xoá × nằm trong thứ tự Tab. Thiếu tên thì `devWarn` (placeholder không phải tên) (§4.3, §6.3) |
| Theme | Không truyền `value`: lib đọc `localStorage` (khoá `flg-theme`), đặt hay bỏ `data-flg-theme` trên `<html>`, đồng bộ giữa các tab. HTML từ server chưa biết theme đã lưu; icon của `ThemeSwitch` vẫn đúng ngay từ trước khi hydrate nhờ CSS đọc thuộc tính trên `<html>` mà `ThemeScript` đã đặt. `ThemeScript` có `nonce` và `suppressHydrationWarning`. Ứng dụng không render từ server (Vite) chép đoạn script vào `index.html` (§3.5, §6.3) |
| UserMenu | Menu và tooltip mở từ header nằm cách nút 17px (đúng 6px dưới mép header 56px của mockup). Đầu menu (avatar, tên, dòng phụ) không phải mục menu; nó là mô tả của menu qua `aria-describedby`. Chữ cái đầu mặc định lấy từ chữ đầu của từ đầu và từ cuối của `name` (§6.3) |
| Thay đổi ở component cũ | `List` thêm `surface?: boolean` (bỏ lớp kính riêng của `inset`, cho bảng thông báo B1). `Tooltip` có một tuỳ chọn nội bộ không nối `aria-describedby`. `ArrowIcon` thêm hướng `left`. Hàm `isEditable` của Toaster chuyển vào `src/internal/`. Không đổi pixel nào của ảnh chuẩn cũ (§2) |
| Kiểm thử | Harness visual nhận tag `viewport-<rộng>x<cao>` để chụp story ở cỡ điện thoại, stage mới `stage: 'page'` cho story toàn trang, và `data-visual-hover="tooltip"` chờ tooltip hiện (§7) |
| Phát hành | Một changeset `minor` cho `0.4.0`. Chủ dự án vẫn là người publish |

---

## 2. Phạm vi và chia plan

| Plan | Nội dung | Phụ thuộc |
|---|---|---|
| **A** | Primitive: `useMediaQuery` (§5), icon `MenuIcon`. Harness visual: tag `viewport-…`, stage `page`. Component: **AppShell**, **AppShellHeader**, **AppShellSidebar**, **AppShellMain**, **AppShellFooter**, **AppShellSidebarTrigger**, **AppShellBrand**: bố cục S1 và S2, header dính, sidebar dính có thanh cuộn riêng, rail, tấm trượt trên màn hẹp, link "Skip to content". CSS màn rộng sinh theo điểm gãy | — |
| **B** | Tuỳ chọn nội bộ của `Tooltip` (không nối mô tả). Móc `data-visual-hover="tooltip"` của harness. Token `--flg-indicator-accent`, `--flg-on-status`. Component: **Nav**, **NavSection**, **NavItem**, **NavGroup** (cả rail, tooltip và flyout), **Indicator** | A |
| **C** | Icon `SearchIcon`, `SunIcon`, `MoonIcon`, `MonitorIcon`, hướng `left` của `ArrowIcon`; `isEditable` chuyển vào `src/internal/`; `theme-store` (§5); `List` thêm `surface`. Component: **SearchField**, **ThemeSwitch**, **ThemeMenuGroup**, **ThemeScript**, **UserMenu**. Công thức bảng thông báo (B1, B3), trang docs "Examples/App shell", mục "App shell" của Getting started, fixtures, changeset `minor` → `0.4.0` | A, B |

- **Các plan chạy lần lượt** A, B, C, như các giai đoạn trước. B phụ thuộc A: `NavItem` đọc context của AppShell (rail, tấm trượt), và quy tắc rail của Nav nằm trong khối màn rộng được sinh của A. C phụ thuộc A và B: các widget đặt trong `AppShellHeader`, công thức thông báo dùng `Indicator`, trang Examples dùng `Nav`. Cả ba cùng viết `icons.tsx`, `values.ts`, `preferences.css`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts` và các danh sách kiểm tra gói.
- **Mỗi plan tự mang đủ phần của mình,** như giai đoạn 2–4:
  - Stories: mỗi phương án giao diện đã chọn một story vẽ lại đúng các trạng thái của mockup (§7), cộng các story hành vi gắn `no-visual`.
  - Test các lớp ở §7 và ảnh chuẩn visual (tạo qua workflow `visual-update.yml`).
  - Trang MDX của component.
  - Danh sách `check:use-client`, `check:dist-css`, các ca của `check:rsc` (`scripts/rsc-probe.mjs`) cho phần server-safe.
  - Các check tương phản và ngoại lệ của mình (§4.4), cùng bảng §4.9 của spec 0+1 và nhãn các dòng trong `scripts/contrast-exceptions.ts`.
  - Ghi lại ngưỡng `size-limit` theo số đo thật (`pnpm size:record`).
- **Thay đổi ở code cũ** (không đổi hành vi, ảnh chuẩn visual cũ giữ nguyên):
  - Plan A: `.storybook/preview.tsx` và `stage.css` thêm `stage: 'page'`; `tests/visual/stories.visual.ts` đọc tag `viewport-…` (§7). Story cũ không có tag và không dùng stage mới, nên chụp như cũ.
  - Plan B: `Tooltip` nhận tuỳ chọn nội bộ `describe: false` (§5); `tests/visual/stories.visual.ts` chờ tooltip khi móc là `data-visual-hover="tooltip"` (§7).
  - Plan C: `List` thêm prop `surface` (mặc định `true`, DOM như cũ); `ArrowIcon` thêm `direction: 'left'`; Toaster lấy `isEditable` từ `src/internal/editable.ts` (cùng mã, chỉ đổi chỗ).

**Ngoài phạm vi** (theo bản quyết định ban đầu): menu ngang hay mega menu trên header; hộp lệnh (⌘K mở một command palette); điều hướng sâu quá 2 cấp; sidebar phải; kéo đổi độ rộng sidebar; breadcrumb riêng của header (dùng `Breadcrumb` có sẵn); thông báo đẩy hay realtime; component "bảng thông báo" (đó là công thức docs); animation lúc đóng tấm trượt (như overlay của giai đoạn 2); hệ thống i18n.

---

## 3. Kiến trúc

### 3.1 Client và server

| Component | Phân loại | Lý do |
|---|---|---|
| `AppShell`, `AppShellHeader`, `AppShellSidebar`, `AppShellMain`, `AppShellFooter`, `AppShellSidebarTrigger` | Client (`app-shell/AppShell.tsx`) | `AppShell` giữ trạng thái thu gọn và mở, nghe `matchMedia`, khoá cuộn; các phần đọc context của nó (id, nhãn, brand, trạng thái) và tự đặt `inert` |
| `AppShellBrand` | Server-safe (`app-shell/AppShellBrand.tsx`) | Chỉ là markup; `asChild` qua `Slot`, như `AlertTitle` |
| `Nav`, `NavSection`, `NavItem`, `NavGroup` | Client (`nav/Nav.tsx`) | `NavItem` đọc context của AppShell (rail, đóng tấm trượt) và render Tooltip ở rail; `NavGroup` giữ trạng thái mở và flyout; `NavSection` sinh id cho tiêu đề |
| `Indicator` | Server-safe | Không có hook |
| `SearchField` | Client | Giá trị, phím tắt, trạng thái mở của H3 |
| `ThemeSwitch`, `ThemeMenuGroup` | Client (`theme-switch/ThemeSwitch.tsx`) | `localStorage`, `<html>`, sự kiện `storage` |
| `ThemeScript` | Server-safe (`theme-switch/ThemeScript.tsx`) | Chỉ render một `<script>`; phải chạy được trong layout là Server Component |
| `UserMenu` | Client | Xây trên `DropdownMenu` |

- **Nội dung vẫn render từ server.** Mọi phần client nhận `children`, nên một trang Server Component render thẳng `<AppShell>` với header, nav và nội dung trang bên trong. Các phần của Nav là client component, nên khi một Server Component viết `<NavGroup><NavItem active …/></NavGroup>`, `NavGroup` nhận các `NavItem` như tham chiếu client (không render sẵn trên server như `Step` của giai đoạn 4), đọc được props của chúng (`active`) qua `collectChildren` và `markPart`, và mở sẵn nhóm ngay trong HTML từ server (§6.3).
- **Prop là hàm** (`onCollapsedChange`, `onOpenChange`, `onValueChange`) chỉ có trong client component. Docs có công thức một client component nhỏ bọc `AppShell` để lưu trạng thái thu gọn vào cookie (§8).
- **`check:use-client`** thêm `src/components/app-shell/AppShell.tsx`, `src/components/nav/Nav.tsx`, `src/components/search-field/SearchField.tsx`, `src/components/theme-switch/ThemeSwitch.tsx`, `src/components/user-menu/UserMenu.tsx`.
- **`check:rsc`** thêm các ca: `AppShellBrand` có `href` và có `asChild`; `Indicator` có `count`, quá `max`, `dot`, `show={false}`; `ThemeScript` có `storageKey` và `nonce` (HTML ra có đúng thẻ `<script nonce>`).

### 3.2 Prop giao diện

Mỗi cặp phương án đã chọn thành giá trị của một prop, nằm trên phần tử gốc của component và thành `data-*` (như `variant` của giai đoạn 4). Phần con không nhận prop đó; CSS chọn giao diện qua phần tử gốc.

| Câu | Component | Prop (mặc định in đậm) | `data-*` |
|---|---|---|---|
| S | `AppShell` | `layout`: **`'sidebar'`** (S1) · `'header'` (S2) | `data-layout` |
| N | `Nav` | `variant`: **`'pill'`** (N1) · `'bar'` (N2) | `data-variant` |
| H | `SearchField` | `collapsible`: **`false`** (H2) · `true` (H3) | `data-collapsible` |
| T | — | Hai component: `ThemeSwitch` (T1) và `ThemeMenuGroup` (T3), cùng một store nội bộ (§5). Người dùng chọn chỗ đặt | — |
| U | `UserMenu` | `showName`: **`false`** (U1) · `true` (U2) | `data-show-name` trên nút |
| B | `Indicator` | `status`: **`'accent'`** (B3) · `'danger'` (B1) · `'success'` · `'warning'` (hai giá trị sau ngoài mockup) | `data-status` |

- Bảng thông báo vẫn là công thức docs, có hai ví dụ: danh sách kẻ ngăn (B1, `Indicator status="danger"`) và có tab Tất cả / Chưa đọc (B3, `Indicator status="accent"`).
- **`Indicator status` mặc định `'accent'`, có chủ ý** (Claude chốt; phát hiện khi đọc soát spec). Đây là prop duy nhất có mặc định không phải phương án đầu của cặp chủ dự án viết ("B1 và B3"). Lý do: Indicator là phần chung, không chỉ cái chuông (chấm số đếm của rail, chấm trên avatar, số trên một nút bất kỳ); mockup Nav đã duyệt (N1, N2) vẽ chấm số đếm của rail màu nhấn, nên nhấn là mặc định trung tính của nó. Đỏ (`'danger'`, B1) là thứ công thức chuông truyền vào, vì thông báo chưa đọc cần sự gấp gáp đó.
- **Mỗi component một file CSS** chứa mọi giá trị của prop giao diện, như giai đoạn 4. Lib không tách CSS theo giá trị (hệ quả ở §10).

### 3.3 Bố cục, lưới và điểm gãy

**Cuộn bằng tài liệu.** Trang cuộn bằng thanh cuộn của tài liệu, không bằng một vùng cuộn riêng của `<main>` (theo bản quyết định ban đầu): cuộn bằng phím, `scroll-padding`, tìm trong trang, khôi phục vị trí cuộn của trình duyệt và của router đều chạy như trang thường. Header dính đầu trang, sidebar dính dưới header và có thanh cuộn riêng.

**Điểm gãy.** `breakpoint?: 'md' | 'lg' | 'xl'` = 768 / 1024 / 1280px, mặc định `'lg'`. "Màn rộng" là `(min-width: <điểm gãy>px)`, "màn hẹp" là phần còn lại. CSS viết **màn hẹp trước**: quy tắc nền (không media query) là bố cục hẹp, quy tắc màn rộng nằm trong `@media (min-width: …)` và thắng. Chỉ có một ranh giới mỗi điểm gãy, nên không có khoảng chiều rộng nào mà không quy tắc nào áp dụng (bài học container query của Stepper, spec giai đoạn 4 §3.5). JS dùng đúng chuỗi media query đó qua `useMediaQuery` (§5).

**CSS màn rộng sinh ba bản** (Claude chốt). Media query không đọc được biến, nên mỗi quy tắc màn rộng phải có một bản cho mỗi điểm gãy, chọn bằng `.flg-app-shell[data-breakpoint='md' | 'lg' | 'xl']`. Các quy tắc đó (lưới có sidebar, sidebar dính, rail của AppShell và của Nav, brand theo bố cục) được viết **một lần** trong một mẫu TypeScript, và bước `gen:theme` sinh `src/styles/generated/app-shell.css` với ba khối `@media`, như `theme.css` được sinh từ `values.ts`. `check:dist-css` kiểm cả ba khối có mặt. Kích thước thêm ở §10.

**Biến độ đo của khung** (không phải token theme; đặt trên `.flg-app-shell`, người dùng ghi đè qua `style`; Claude chốt): `--flg-app-shell-sidebar-width: 264px`, `--flg-app-shell-rail-width: 68px`, `--flg-app-shell-drawer-width: 300px`, `--flg-app-shell-header-height` (56px ở màn hẹp, 60px ở màn rộng; `0px` khi không có `AppShellHeader`, nhận ra bằng `:not(:has(> .flg-app-shell-header))`). Gọi tắt W, R, D, H bên dưới.

**Lưới.** Gốc: `display: grid`, `min-height: 100dvh`, hàng `H 1fr auto`, `isolation: isolate`. Bản quyết định đặt tên vùng; về khái niệm:

| | `layout="sidebar"` (S1) | `layout="header"` (S2) |
|---|---|---|
| Màn rộng | `"side head" "side main" "side foot"`, cột `W minmax(0, 1fr)` (rail: `R`) | `"head head" "side main" "foot foot"`, cột `W minmax(0, 1fr)` (rail: `R`) |
| Màn hẹp (cả hai bố cục) | `"head" "main" "foot"`, một cột `minmax(0, 1fr)`; sidebar ra khỏi lưới thành tấm trượt (§3.4) | như S1 |

Đặt bằng số đường lưới thay cho tên vùng, vì hai phần dính cần chỗ để dính (Claude chốt): phần tử `position: sticky` không bao giờ ra khỏi ô lưới của nó, nên một header nằm gọn trong hàng đầu cao H sẽ trôi đi cùng trang.

| Phần | S1 rộng | S2 rộng | Hẹp |
|---|---|---|---|
| Header | cột 2, hàng 1 / -1, `align-self: start`, cao H, `position: sticky; top: 0`, `z-index: 3` | cột 1 / -1, hàng 1 / -1, như trái | cột 1, hàng 1 / -1, như trái |
| Sidebar (ô lưới, không có nền) | cột 1, hàng 1 / -1, `align-self: stretch`, `z-index: 2`; tấm kính bên trong: `sticky; top: 0`, `max-height: 100dvh` | cột 1, hàng 2, `align-self: stretch`, `z-index: 2`; tấm kính bên trong: `sticky; top: H`, `max-height: calc(100dvh - H)` (H ở đây là hàng đầu: H, hay header đo được nếu cao hơn; phát hiện khi review PR #37) | `position: fixed` (§3.4) |
| Main | cột 2, hàng 2 | cột 2, hàng 2 | hàng 2 |
| Footer | cột 2, hàng 3 | cột 1 / -1, hàng 3, `z-index: 3` | hàng 3 |

- **Hàng đầu luôn cao đúng H** nên main bắt đầu dưới header dù header trải qua mọi hàng; header chỉ chiếm phần trên cùng (`align-self: start`) và nổi trên main khi trang cuộn.
- **Header cao hơn H** (xuống hai dòng ở màn vừa, một control cao hơn) (phát hiện khi review PR #37): hàng đầu là `max(var(--flg-app-shell-header-height), var(--flg-app-shell-header-offset, 0px))`, tức H hay chiều cao đo được của header (dưới đây), lấy số lớn hơn; nên header cao bao nhiêu main cũng bắt đầu dưới nó. Ở S2 `top` và `max-height` của tấm kính sidebar, ở S1 chiều cao hàng đầu của sidebar (§4.3) cũng lấy giá trị đó, để chúng gặp mép dưới của header. `min-height` của chính header chỉ lấy từ H, nên số đo không bao giờ quay lại nuôi header (không có vòng lặp). Trước khi hydrate, hay không có `ResizeObserver`, không có số đo và hàng cao H. Khi nội dung thêm vào được gỡ đi, header thấp lại, số đo theo, và hàng co lại về H. H vì vậy là chiều cao tối thiểu của header.
- **Sidebar co theo màn hình** nhờ `stretch` cùng `max-height`: trang ngắn thì tấm kính cao bằng ô của nó; trang dài thì tấm kính cao bằng phần còn lại của viewport và dính. Ở S2, khi cuộn tới cuối trang, ô của sidebar (hàng 2) kết thúc ở mép trên footer, nên footer đẩy tấm kính lên (đúng ghi chú của mockup S2): đáy tấm kính trùng mép trên footer, và đỉnh của nó trượt xuống dưới header, như sidebar của một trang tài liệu. Ở S1, sidebar chạy hết chiều cao và đáy nó trùng đáy trang khi cuộn tới cuối.
- **Phần tử sidebar là ô lưới trong suốt, tấm kính là con của nó** (phát hiện khi lập Plan A). Một phần tử `position: sticky` bị giữ bởi content box của phần tử cha, không bởi ô lưới nó nằm trong (đo ở Chromium, Firefox và WebKit: một sidebar vừa là ô hàng 2 vừa là phần tử dính đi qua đáy ô và nằm đè lên footer 44px, vì cha của nó là cả lưới). Nên `.flg-app-shell-sidebar` là ô (`display: block` ở màn rộng, `none` ở màn hẹp) và `.flg-app-shell-sidebar-panel` (lớp `flg-surface`) là phần tử dính, `height: 100%` của ô. `className`, `style` và mọi prop của `AppShellSidebar` vào ô, không vào tấm kính; `ref` trỏ vào ô.
- **Không có footer:** hàng 3 cao 0. **Không có sidebar:** lưới chỉ một cột ở mọi cỡ (`:not(:has(> .flg-app-shell-sidebar))`), nút trigger ẩn, và brand của header hiện ở mọi cỡ, ở cả hai bố cục (§4.3; phát hiện khi review cuối Plan A).
- **Các phần phải là con trực tiếp trong DOM** của `AppShell` (một component bọc không thêm phần tử thì được), vì chúng là ô của lưới; sai thì `devWarn` (§5).
- **Thứ tự DOM tự do** vì vị trí là của CSS. Docs khuyên `AppShellHeader`, `AppShellSidebar`, `AppShellMain`, `AppShellFooter`: banner trước, rồi điều hướng, rồi nội dung.

**Tài liệu dưới header dính** (Claude chốt; phát hiện khi đọc soát spec). Header dính che phần trên của viewport, nên trình duyệt có thể đưa một phần tử vào nằm ngay dưới nó: focus bằng Shift+Tab từ dưới lên, link `#anchor`, tìm trong trang (WCAG 2.4.11, focus không bị che). Table đã phải thêm `scroll-padding-top` cho tiêu đề dính sau review PR #29 của chủ dự án. Ở đây đó là việc của lib, không phải của từng ứng dụng:

- **Đo header.** `AppShell` đo `AppShellHeader` bằng một `ResizeObserver` (`borderBoxSize[0].blockSize`, thiếu thì `offsetHeight`, như `table/use-head-height.ts`) và ghi chiều cao thành custom property `--flg-app-shell-header-offset` trên `<html>` (`document.documentElement.style`), chỉ khi giá trị đổi. Unmount (hay header bị gỡ) thì xoá thuộc tính. Tên khác `--flg-app-shell-header-height` (biến đầu vào của lưới, đặt trên gốc của khung) vì đây là số đo, và nó sống trên `<html>`. Ngoài `scroll-padding-top`, số đo này còn vào hàng đầu của lưới (ở trên; phát hiện khi review PR #37).
- **Chừa chỗ khi cuộn.** Quy tắc của lib, chỉ ở trang có một khung có header: `:root:has(.flg-app-shell > .flg-app-shell-header) { scroll-padding-top: var(--flg-app-shell-header-offset, 56px) }`, và trong khối màn rộng được sinh (ở trên), mỗi điểm gãy một bản với giá trị dự phòng 60px. Giá trị dự phòng là chiều cao đã biết của header (56px hẹp, 60px rộng; như nhau ở hai bố cục, nên không cần bản theo bố cục), dùng cho HTML từ server trước khi hydrate. Sau đó số đo thắng (header cao hơn vì nội dung, hay người dùng đổi `--flg-app-shell-header-height`).
- Ở S1 màn rộng header chỉ phủ cột nội dung, còn `scroll-padding-top` áp cho cả trang. Vậy là đúng: theo tài liệu thì chỉ cột nội dung (main, footer) cuộn; sidebar dính cuộn trong vùng cuộn riêng của nó, nơi `scroll-padding` của tài liệu không áp.
- `AppShellMain` không có `scroll-margin-top` riêng (cộng với `scroll-padding-top` sẽ thành chừa hai lần): skip link đưa main xuống dưới header nhờ quy tắc trên.
- **Bỏ margin của `body`.** `body:has(.flg-app-shell) { margin: 0 }` (`AppShell` không cần là con trực tiếp của `body`). Đây là **lần đầu lib đặt style cho chính tài liệu** (`html`, `body`). Lý do: margin 8px mặc định của trình duyệt để lại một viền quanh khung vốn phải chạm bốn mép màn hình (mockup S1, S2), đẩy header lệch 8px khỏi mép trên, và cộng với `min-height: 100dvh` của gốc làm trang ngắn vẫn có thanh cuộn. Cả hai quy tắc chỉ áp trên trang có render `AppShell`, và nằm trong layer `flg.components` như mọi CSS của lib, nên một quy tắc của ứng dụng (không layer) luôn thắng chúng.

**Thu gọn thành rail** chỉ có ở màn rộng: `collapsed` đổi cột sidebar từ W sang R; ở màn hẹp tấm trượt luôn là nav mở rộng. `collapsible={false}` thì không có rail và trigger ẩn ở màn rộng.

### 3.4 Tấm trượt trên màn hẹp

**Vì sao không dùng `Drawer`** (Claude chốt). `Drawer` là một `<dialog>` mở bằng `showModal()` (spec giai đoạn 2 §3.3). Sidebar ở màn rộng nằm trong lưới; dùng `Drawer` ở màn hẹp nghĩa là render nav hai lần (một trong lưới, một trong dialog), hoặc dời nó qua lại giữa hai chỗ và mất trạng thái của nó (nhóm đang mở, ô nhập). Spec giữ **một** phần tử sidebar: ở màn hẹp nó thành `position: fixed` và trượt ra. Hệ quả:

| Việc | Cách làm |
|---|---|
| Đóng sẵn, không nháy | Quy tắc nền (màn hẹp) cho sidebar `display: none`; `[data-open]` trên gốc cho nó `display: flex`. HTML từ server đóng (`defaultOpen` mặc định `false`), không cần JS |
| Phần còn lại của trang | Khi mở ở màn hẹp, skip link, `AppShellHeader`, `AppShellMain`, `AppShellFooter` mang `inert` (thêm skip link so với bản quyết định, vì nó đứng đầu trang và Tab vòng về sẽ tới nó). `inert` đặt bằng thuộc tính DOM `element.inert` trong layout effect, không bằng prop của React: React 18.3 và 19 xử lý prop `inert` khác nhau (18.3 không biết nó là boolean). Con trực tiếp khác của `AppShell` không bị `inert` |
| Ngữ nghĩa | Sidebar mang `role="dialog"` và `aria-label` (`labels.navigation`, "Navigation") trong lúc mở ở màn hẹp, không có gì ở màn rộng. **Không có `aria-modal`** (Claude chốt): phần còn lại đã thật sự `inert`, còn `aria-modal` làm một số tổ hợp trình duyệt và screen reader bỏ mọi thứ ngoài hộp thoại khỏi cây truy cập, kể cả vùng toast (lớp 6 kiểm lại, §7) |
| Khoá cuộn | `lockScroll()` (spec giai đoạn 2 §5) khi mở, nhả khi đóng hoặc unmount. Thân cuộn của sidebar có `overscroll-behavior: contain` |
| Focus khi mở | `focusFirst(sidebar)` (không cuộn) ngay sau commit làm nó hiện: phần tử focus được đầu tiên, theo bản quyết định. Ở S1 đó là link của brand (nếu brand là link) rồi tới ×; ở S2 là ×. Nút trigger mở tấm được nhớ (`opener`) tới lần đóng kế tiếp rồi bị quên, nên một lần mở sau đó không có `opener` (cha controlled tự mở) không đưa focus về một trigger cũ (phát hiện khi review cuối Plan A) |
| Đóng | Esc; bấm lớp nền; nút × của sidebar; kích hoạt một `NavItem` (click thường, không phím bổ trợ, `defaultPrevented` chưa đặt). Focus về nút trigger đã mở nó (nút trigger đăng ký vào context; không có thì trigger đầu tiên còn hiện) **sau mọi lần đóng, ai đóng cũng vậy**: Esc, lớp nền, ×, `setOpen(false)` của context, hay cha controlled tự đặt `open={false}` (đổi trang, một nút "Xong" của họ). Chỉ hai lần đóng để focus yên: `setOpen(false, { returnFocus: false })`, và lần đóng do cửa sổ rộng ra (dòng "Đổi cỡ màn"). `returnFocus()` chỉ dời focus đang ở `<body>`, ở đâu cũng không, hay trong sidebar, nên focus người dùng đã đưa đi chỗ khác vẫn ở yên. Cờ `returnFocus: false` chỉ áp cho lần đóng ngay sau nó và bị quên sau mỗi lần đóng, như `opener`; riêng khi cha controlled từ chối lần đóng đó (giữ `open`), cờ còn đến lần đóng kế tiếp, nên lần đóng ấy cũng để focus yên (phát hiện khi review cuối Plan A). Cờ chỉ được ghi khi lời gọi `setOpen(false, …)` đóng một tấm đang hiện: một lời gọi không đổi gì (tấm đã đóng, hay cửa sổ đang rộng; handler của `NavItem` chạy ở mọi lần bấm) không ghi gì. Và cờ bị quên mỗi khi tấm hiện ra, ai mở cũng vậy (trigger, `setOpen(true)`, hay cha controlled tự đặt `open`), nên nó không sống qua một lần mở: một lần đóng của cha controlled (không đi qua `setOpen`) sau đó vẫn đưa focus về (phát hiện khi review PR #37) |
| Esc | Một listener `keydown` trên `document` khi tấm đang mở. Bỏ qua khi: sự kiện đã `defaultPrevented` (Toaster chặn Esc của nó, spec giai đoạn 2 §6.3); bộ gõ đang soạn chữ (`isComposing` của `roving.ts`: `isComposing` hay `keyCode` 229; Esc khi đó là của bộ gõ, huỷ ô gợi ý; phát hiện khi review PR #37); modal stack không rỗng (`getTopModal()`, một Dialog mở từ trong sidebar nhận Esc của nó); trong sidebar có một popover đang mở mà Esc đóng (`[popover]:not([popover="manual"]):popover-open`, selector của Tooltip, nay là `OPEN_POPOVER_CLOSES_ON_ESC` của `internal/popover.ts` mà cả hai cùng dùng, phát hiện khi review PR #37; trình duyệt đóng nó ở hành động mặc định của chính lần nhấn này). Popover `manual` không đóng bằng Esc nên không giữ phím: có nó đang mở, Esc vẫn đóng tấm (phát hiện khi review cuối Plan A) |
| Lớp nền | `<div class="flg-app-shell-scrim" aria-hidden="true">` do `AppShell` render khi mở; `click` trên nó thì đóng. Một lần bôi chữ bắt đầu trong sidebar và thả trên lớp nền không đóng (sự kiện `click` khi đó có `target` là phần tử chung, không phải lớp nền). Một lần nhấn trên lớp nền trong lúc sidebar có một popover đang mở mà lần nhấn đóng được (light dismiss; cùng selector với Esc, popover `manual` không tính) chỉ đóng popover đó, như lần nhấn ra ngoài của Dialog: lúc `pointerdown` lib ghi lại là có popover như vậy đang mở, và bỏ qua `click` theo sau lần nhấn đó; lần nhấn sau mới đóng tấm (phát hiện khi review PR #37) |
| Đổi cỡ màn | `matchMedia` của điểm gãy khớp trong lúc mở thì gọi `onOpenChange(false)` và bỏ `inert`, khoá cuộn. Focus ở yên (nếu nó ở trong sidebar, sidebar vẫn hiện trong lưới), trừ focus mà khung rộng không còn hiện: focus đang ở × (nút đó đi cùng tấm, focus rơi về `<body>`), hay ở hàng đầu của sidebar S2 (hàng đó, cả link của brand, `display: none` ở màn rộng; có engine như WebKit giữ focus trên phần tử đã ẩn thay vì đưa về `<body>`). Khi phần tử đang focus là `null`, `<body>`, hay không còn hiện (`isVisible` của `focus.ts`), focus được đưa tới trigger đầu tiên còn hiện (phát hiện khi review PR #37). Lần đóng này được nhận ra ngay trong cleanup của layout effect, bằng `window.matchMedia(<query của điểm gãy>).matches`, vì cleanup chạy trước effect theo dõi cửa sổ; effect đó gọi `onOpenChange(false)` mà không đi qua `setOpen`, nên không để lại cờ nào (phát hiện khi review cuối Plan A). Ở dạng controlled mà cha vẫn giữ `open`, tấm không có tác dụng gì ở màn rộng (mọi hành vi chỉ chạy khi `open && !isWide`) và hiện lại nếu màn hẹp lại |

- **Modal stack.** Tấm không đăng ký vào modal stack: stack là danh sách các `<dialog>` của lib cùng `.flg-toast-host` của chúng, và một host bên trong sidebar sẽ hỏng, vì sidebar có `backdrop-filter` (kính) và `translate` (trượt), hai thứ biến nó thành khối chứa của phần tử `position: fixed` bên trong (spec giai đoạn 2 §3.4). Một Dialog mở từ trong tấm thì tự `inert` cả tấm, rồi đóng lại thì trả về như cũ.
- **Toast khi tấm mở.** Vùng toast trên trang là `popover="manual"` trong top layer (spec giai đoạn 2 §6.3), luôn nằm trên tấm (tấm chỉ có `z-index`), nên toast **vẫn thấy, bấm được và được đọc**, như với Dialog và Drawer, với điều kiện `Toaster` không nằm trong header, main hay footer (khi đó nó bị `inert` theo cây DOM dù nằm trong top layer). Docs đặt `<Toaster />` ngoài `AppShell` hoặc là con trực tiếp của nó. Khi tấm mở mà tìm thấy `.flg-toaster` bên trong một phần bị `inert`, lib `devWarn` (§5).
- **Tooltip, menu, popover** mở từ trong tấm cũng ở top layer, nên luôn nằm trên tấm.
- **Lớp và chồng lớp.** Gốc `isolation: isolate`; trong đó: sidebar ở màn rộng `z-index: 2`, header và footer S2 `3`, lớp nền `4`, tấm trượt `5`, skip link khi có focus `6`. Gốc không có `transform`, `filter`, `opacity`, để `position: fixed` của tấm và lớp nền vẫn theo viewport. Main và footer cũng mang `isolation: isolate`, mỗi phần là một stacking context riêng, vì chúng chứa nội dung của người dùng: một `z-index` trong đó (khung bản đồ, mũi tên carousel, thanh công cụ dính) chỉ so với nội dung cùng phần, không bao giờ vẽ đè lên header, lớp nền hay tấm trượt (thiếu nó thì các số lớp ở trên chỉ đúng cho các phần của khung). Hệ quả: một lớp phủ render tại chỗ trong main (không portal, không ở top layer) không nổi lên trên header được; docs bảo portal nó ra ngoài khung hoặc dùng top layer. `isolation` không biến main thành backdrop root, nên kính trong main vẫn làm mờ nền trang (phát hiện khi review cuối Plan A).

### 3.5 HTML từ server và hydrate

| Điều | Cách làm |
|---|---|
| Bố cục, rail | Hoàn toàn bằng CSS (lưới, `@media`, `[data-collapsed]`), nên HTML từ server đã đúng ở mọi cỡ màn. `defaultCollapsed` từ cookie cho rail đúng ngay từ HTML đầu (công thức ở §8) |
| Tấm trượt | Đóng sẵn bằng CSS (§3.4). Trang hydrate ở màn rộng với `defaultOpen`/`open` true thì lần render hydrate vẫn là khung hẹp có tấm mở; layout effect của tấm hỏi `matchMedia` và không làm gì khi cửa sổ rộng (không `inert`, không khoá cuộn, không dời focus), và `wasWide` được gieo từ `matchMedia` sau khi mount, nên lần render rộng tiếp theo không bị coi là cửa sổ rộng ra (không `onOpenChange(false)`) (phát hiện khi review cuối Plan A) |
| Màn rộng hay hẹp trong JS | `useMediaQuery` dùng `useSyncExternalStore` với giá trị phía server là `false` (hẹp), rồi cập nhật sau khi hydrate. Chỉ phần không nhìn thấy đổi theo: tên và `aria-expanded` của trigger, việc render tooltip của rail, `popover` trên flyout. Thêm `data-rail` trên gốc (§6.3): lib không vẽ gì từ nó, nhưng phần người dùng vẽ từ nó theo kịp sau khi hydrate (phát hiện khi review PR #37) |
| Tên của trigger | Lần render đầu dùng tên của màn hẹp ("Open navigation", `aria-expanded="false"`), sau hydrate đổi sang "Collapse sidebar" / "Expand sidebar" nếu màn rộng |
| ThemeSwitch | Lần render đầu dùng `defaultValue` (`'system'`) như bản quyết định; store nội bộ có giá trị phía server, nên không lệch khi hydrate. Icon lấy theo `<html data-flg-theme>` bằng CSS trong lúc chờ (`[data-pending]`), nên người đã lưu Dark thấy trăng ngay từ HTML đầu (§6.3) |
| Phím gợi ý của SearchField | "⌘K" hay "Ctrl K" chỉ biết sau khi mount (nền tảng). HTML từ server có `<kbd>` rỗng với `hidden`; sau mount lib điền chữ, bỏ `hidden`, đặt `aria-keyshortcuts`. Với `shortcut="/"` thì chữ có ngay từ server |
| NavGroup mở sẵn | Từ props của các `NavItem` con (`active`), có ngay trên server (§3.1) |
| Chỗ chừa cho header khi cuộn | `scroll-padding-top` của `<html>` dùng giá trị dự phòng 56px / 60px cho tới khi `AppShell` ghi số đo (§3.3); `body` không margin ngay từ HTML đầu, vì cả hai là CSS (Claude chốt; phát hiện khi đọc soát spec) |

### 3.6 Chuyển động và giảm chuyển động

| Phần | Chuyển động (ngoài mockup) | Khi `prefers-reduced-motion: reduce` |
|---|---|---|
| Tấm trượt mở | Trượt vào từ trái: `translate: -100%` → `0` trong `--flg-duration-normal` với `--flg-ease`, qua `@starting-style` như Drawer (spec giai đoạn 2 §3.5) | Token thời lượng về `0ms`: không trượt (theo bản quyết định) |
| Lớp nền mở | Mờ dần lên, như `::backdrop` | Như trên |
| Tấm và lớp nền đóng | Không có animation (như overlay của giai đoạn 2) | — |
| Thu gọn / mở rộng rail | **Không có animation** (Claude chốt): đổi cột lưới khiến cả nội dung trang tính lại bố cục mỗi khung hình, và chữ của mục nav bị cắt dở khi cột co | — |
| Chevron của NavGroup, của UserMenu `showName` | Xoay trong `--flg-duration-fast` | Token về `0ms` |
| Nhóm của Nav mở / đóng | Hiện, ẩn ngay (`hidden`), không có animation chiều cao (Claude chốt) | — |
| SearchField H3 mở | Ô thay chỗ nút ngay, không có animation (Claude chốt) | — |

Không có animation lặp nào, nên không thêm quy tắc viết tay vào khối `prefers-reduced-motion` của `preferences.css`.

### 3.7 Cấu trúc file bổ sung

```
src/internal/        use-media-query.ts, theme-store.ts, theme-value.ts, editable.ts (chuyển từ Toaster), platform.ts,
                     icons.tsx (MenuIcon, SearchIcon, SunIcon, MoonIcon, MonitorIcon; ArrowIcon 'left')
src/components/      app-shell/ (AppShell.tsx client: AppShell và các phần; AppShellBrand.tsx;
                     app-shell-context.ts; use-header-offset.ts; use-sheet.ts), nav/, indicator/, search-field/,
                     theme-switch/ (ThemeSwitch.tsx client: ThemeSwitch, ThemeMenuGroup; ThemeScript.tsx;
                     theme-script.ts),
                     user-menu/
src/styles/components/
                     app-shell.css (màn hẹp và phần chung), nav.css, indicator.css, search-field.css,
                     theme-switch.css, user-menu.css
src/styles/generated/app-shell.css   (sinh: các quy tắc màn rộng × 3 điểm gãy, cả rail của Nav)
scripts/lib/         app-shell-css.ts (mẫu và bộ sinh của file trên)
tests/visual/        stories.visual.ts (tag viewport-…, chờ tooltip)
.storybook/          preview.tsx, stage.css (stage 'page')
```

---

## 4. Token và giao diện

### 4.1 Mockup đã duyệt

Các file nằm ở `docs/superpowers/specs/mockups/`; CSS đọc được của từng phương án nằm ở `.superpowers/mockups/pages/*.src.html` và trùng từng dòng với CSS trong trang đã duyệt. Chủ dự án chọn ngày 2026-11-10 ([trang chọn](https://claude.ai/artifact/PWQLtGmJVYhxq7EBxnYPom)).

| File | Câu | Đã chọn → prop | Không chọn (không làm) |
|---|---|---|---|
| `phase-5-shell.html` | S | S1 → `layout="sidebar"`, S2 → `layout="header"` | S3 (các tấm kính nổi) |
| `phase-5-nav.html` | N | N1 → `variant="pill"`, N2 → `variant="bar"` | N3 (viên gradient) |
| `phase-5-header.html` | H | H2 → `collapsible={false}`, H3 → `collapsible` | H1 (ô viên thuốc ở giữa) |
| | T | T1 → `ThemeSwitch`, T3 → `ThemeMenuGroup` | T2 (segmented) |
| | U | U1 → `showName={false}`, U2 → `showName` | U3 (hai dòng có vai trò) |
| | B | B1 → `status="danger"` + công thức danh sách kẻ ngăn, B3 → `status="accent"` + công thức có tab | B2 (chấm, thẻ) |

- **Mọi số liệu ở §4.3** lấy từ CSS `mk-` của đúng phương án đó. Mockup dùng chung token của lib, nên dark khác light chỉ ở giá trị token, trừ nền số của Indicator `accent` (§4.2).
- **Trang bố cục (S) vẽ widget và mục nav trung tính** ("chỉ để minh hoạ", ghi chú của trang). Vì vậy giao diện của mục nav lấy từ trang Nav, của widget header lấy từ trang Header; trang S quyết định khung: lưới, kích thước, cạnh viền, brand, rail, tấm trượt, khoảng cách của header (Claude chốt). Chỗ hai trang lệch nhau vài px được nêu tại chỗ.
- **Phần khung của trang mockup** (nhãn `mk-tag`, nhãn "← đang chọn", khung thu nhỏ bằng `zoom`, dải header bo góc của trang Header) không thuộc component. Nội dung mẫu ("Lumen", các thẻ trên main, avatar "MA", icon của ứng dụng) là nội dung của người dùng, được dựng lại trong story và docs.

### 4.2 Token mới

**Token theo theme** (Plan B):

| Token | Light | Dark | `prefers-contrast: more` | Dùng ở |
|---|---|---|---|---|
| `--flg-indicator-accent` | `var(--flg-accent-solid)` | `color-mix(in srgb, var(--flg-accent-start) 78%, #000)` | `var(--flg-accent-solid)` (`contrastMore.shared`) | Nền viên số của Indicator `accent` (B3, giá trị của mockup chép nguyên văn; ở dark pha 22% đen để chữ trắng đạt 4.5:1) |
| `--flg-on-status` | `#ffffff` | `#0b1020` | — | Chữ trên viên số `success` và `warning` (ngoài mockup) |

- `--flg-on-status` đánh dấu "(outside mockup)" trong `values.ts`; `--flg-indicator-accent` là giá trị mockup, nên `scripts/lib/theme-css.test.ts` thêm nó vào bảng `MOCKUP`.
- `scripts/lib/contrast.ts` học thêm dạng `color-mix(in srgb, <màu> N%, <màu đặc>)` (hiện chỉ đọc được dạng trộn với `transparent`), để đo đúng giá trị dark của `--flg-indicator-accent`.
- `--flg-indicator-accent` light trùng `--flg-accent-solid`: số trắng trên nó là 4.74:1 (cặp `on-accent-start` đã có).

**Màu mới không thành token** (Claude chốt; như cách giai đoạn 4 làm với nền nhuộm của Alert). Viết thẳng bằng `color-mix` trong CSS của component; cái nào được đo thì `contrast.ts` tự tính lại từ token gốc:

| Màu | Giá trị | Dùng ở | Đo |
|---|---|---|---|
| Nền nhuộm của mục đang chọn N2 | `linear-gradient(90deg, color-mix(in srgb, var(--flg-accent-solid) 18%, transparent), color-mix(in srgb, var(--flg-accent-solid) 3%, transparent))` | Mục đang chọn, nhóm chứa trang hiện tại ở rail, mục đang chọn trong flyout (N2) | Có (§4.4) |

**Biến độ đo của khung** (`--flg-app-shell-…`, §3.3) là biến của component, không phải token theme.

**Quy tắc hiệu năng** (bổ sung danh sách `backdrop-filter` của spec giai đoạn 2 §4.2): thêm **header, sidebar (cả khi là tấm trượt) và footer của AppShell**, mỗi cái một tấm kính như mockup S1, S2; lớp nền của tấm trượt (`blur(var(--flg-scrim-blur))`, như `::backdrop`). Flyout là Popover, đã có trong danh sách. Ba tấm lớn phủ cả trang và header nằm trên nội dung đang cuộn, nên trình duyệt làm mờ lại phần nằm dưới header mỗi khung hình cuộn (§10).

### 4.3 Kích thước và giao diện từng phần

Trong mục này "kính" là lớp `flg-surface` (nền tint, viền gradient 1px, `backdrop-filter`, `--flg-glass-shadow`); "bỏ cạnh X" là `border-X-width: 0` trên tấm kính đó.

#### AppShell (S1, S2)

**Header** (`<header class="flg-surface flg-app-shell-header">`):

- Kính, `border-radius: 0`. Một hàng `flex`, căn giữa dọc, `min-width: 0`.
- Màn rộng: cao 60px, padding `0 16px`, khoảng cách 8px. Màn hẹp: cao 56px, padding `0 10px`, khoảng cách 4px.
- Cạnh: S1 rộng bỏ cạnh trên, trái và phải (còn cạnh dưới; cạnh trái kề sidebar). S2 và màn hẹp bỏ cạnh trên, trái, phải. Mockup giấu cạnh ở mép màn hình bằng margin −1px; spec dùng `border-width: 0` (Claude chốt, §3.3), kết quả nhìn như nhau.
- Nút chỉ có icon nằm trong header (không nằm trong một popover hay dialog mở từ header) có icon 18px (`--flg-button-icon: 18px`), như mockup.
- **Nút ghost đang mở một popup** (`[aria-haspopup][aria-expanded='true']`) giữ nền `--flg-control-track`, như chuông khi bảng thông báo mở (B1, B3) và nút U2 khi menu mở. Quy tắc nằm trong header, không đổi `Button` ở chỗ khác. Nút trigger không có `aria-haspopup`, nên không bị; nút U1 có quy tắc riêng (vòng nhấn, không nền) thắng quy tắc này.
- **Đầu hàng** (do `AppShellHeader` render, §6.3): nút trigger (IconButton `ghost` `md` 34×34, icon ☰ 18px), rồi ô brand. Ô brand: S1 rộng ẩn (`display: none`); S1 hẹp và S2 hiện. Màn hẹp: brand cách trigger thêm 4px (`margin-left: 4px`, tổng 8px). S2 rộng: ô brand `flex: none; width: 226px`, để phần tử kế tiếp bắt đầu đúng ở mép nội dung của main (16 + 34 + 8 + 226 + 8 + 4 = 296 = 264 + 32) ở cả khi sidebar mở rộng lẫn khi là rail ("logo và ô tìm kiếm đứng yên"); khi không có trigger ở màn rộng (`collapsible={false}`) ô rộng 268px để giữ cùng vị trí (Claude chốt). Hai số đó lấy từ W: `calc(var(--flg-app-shell-sidebar-width) - 38px)` sau trigger (16 + 34 + 8 + (W − 38) + 8 + 4 = W + 32) và `calc(var(--flg-app-shell-sidebar-width) + 4px)` khi không có trigger (16 + (W + 4) + 8 + 4 = W + 32), nên với W = 264px là 226px và 268px, còn một sidebar rộng 300px vẫn giữ ô tìm kiếm thẳng với nội dung của main (phát hiện khi review PR #37). Ba quy tắc đó (ẩn ở S1 rộng, cách 4px ở màn hẹp, rộng 226px / 268px ở S2 rộng) chỉ áp khi khung có sidebar (`:has(> .flg-app-shell-sidebar)`): không có sidebar thì brand của header là brand duy nhất, nên luôn hiện, ô của nó rộng theo brand và bắt đầu ở padding của header (phát hiện khi review cuối Plan A).

**Sidebar** (`<div class="flg-app-shell-sidebar">`, ô lưới trong suốt, chứa `<div class="flg-surface flg-app-shell-sidebar-panel">`; §3.3) (phát hiện khi lập Plan A):

- Tấm kính (`-panel`): kính, `border-radius: 0`, cột `flex`, `min-height: 0`, `overflow: hidden`. Màn rộng: rộng W (264px), rail R (68px).
- Cạnh: S1 bỏ cạnh trên, dưới, trái (còn cạnh phải); S2 bỏ cạnh trái, trên, dưới.
- **Hàng đầu** (`.flg-app-shell-sidebar-head`): `flex: none`, căn giữa dọc, khoảng cách 8px.
  - S1 rộng: cao 60px (bằng header, nên mép dưới của header nối thẳng vào nav), padding `0 20px`, chứa brand. Rail: `justify-content: center`, padding 0, chữ của brand ẩn khỏi mắt (chỉ còn dấu). Không có `brand` thì hàng vẫn cao 60px, để nav luôn bắt đầu dưới đường của header (Claude chốt). Chiều cao là hàng đầu của lưới (§3.3): `max(var(--flg-app-shell-header-height), var(--flg-app-shell-header-offset, 0px))` (60px mặc định), nên một header cao 72px, hay xuống hai dòng, vẫn gặp hàng đầu ở đúng mép dưới (phát hiện khi review PR #37).
  - S2 rộng: không có hàng đầu (`display: none`), nav bắt đầu ngay dưới header.
  - Tấm trượt (cả hai bố cục): cao 56px, padding `0 10px`. S1: brand (cách trái thêm 8px) rồi nút × đẩy về cuối (`margin-left: auto`). S2: × rồi brand, nằm đúng chỗ ☰ và brand của header (× ở 10px, brand ở 52px, như ☰ và brand). Chiều cao là `var(--flg-app-shell-header-height)` (56px ở màn hẹp), bằng header (phát hiện khi review PR #37).
  - Không có `AppShellHeader`: biến là `0px` và không có đường nào để gặp, nên hàng đầu giữ chiều cao của một header, 60px ở S1 rộng và 56px ở tấm trượt, để brand và × có chỗ (phát hiện khi review PR #37).
  - Nút ×: IconButton `ghost` `md`, icon × 18px, tên `labels.closeNavigation`. Chỉ hiện khi là tấm trượt.
- **Thân** (`.flg-app-shell-sidebar-body`): `flex: 1`, `min-height: 0`, `overflow-y: auto`, `overflow-x: hidden`, `overscroll-behavior: contain`, và tự là một cột `flex` (để `Nav` giãn hết chiều cao còn lại). Chứa `children` (thường là `Nav`, §4.3 Nav). Trang S vẽ thân với padding ngang 12px và nav cách hàng đầu 12px; spec để Nav tự có padding theo trang Nav (10px), nên chữ của mục nav lệch 2px so với hình của trang S (Claude chốt, §4.1).

**Main** (`<main class="flg-app-shell-main">`): padding `28px 32px` ở màn rộng, `20px 16px` ở màn hẹp (như mockup); `min-width: 0`; không có nền (nằm thẳng trên nền của trang); không có `scroll-margin-top` riêng: `scroll-padding-top` của tài liệu đã giữ main (đích của skip link) và mọi thứ trong nó ra khỏi chỗ dưới header (§3.3; Claude chốt; phát hiện khi đọc soát spec); `:focus` không có outline (main là đích của skip link, một vòng focus quanh cả nội dung không giúp gì; Claude chốt). Bố cục bên trong (khoảng cách 20px giữa tiêu đề và các thẻ của mockup) là của nội dung: docs và ví dụ dựng lại, lib không áp.

**Footer** (`<footer class="flg-surface flg-app-shell-footer">`): kính, `border-radius: 0`, `flex`, căn giữa dọc, khoảng cách 8px, cao tối thiểu 44px, `--flg-text-xs`, màu `--flg-text-muted`; link bên trong màu `--flg-text`, chỉ link thường không có class (`a:not([class])`): link của lib (Breadcrumb, Pagination) đặt trong footer giữ màu của nó (phát hiện khi review cuối Plan A). Padding ngang: S1 32px (thẳng với nội dung main), S2 20px, màn hẹp 16px (ngoài mockup). Cạnh: S1 bỏ trái, phải, dưới (còn cạnh trên); S2 bỏ trái, phải, dưới.

**Brand** (`AppShellBrand`, §6.3; số đo của trang S): `inline-flex`, căn giữa dọc, khoảng cách 9px, `min-width: 0`, không gạch chân, màu `--flg-text`. Ô logo `flex: none`, `inline-flex`; logo là của người dùng (ví dụ của docs: ô vuông 26px bo `--flg-radius-md`, nền `--flg-accent-gradient`, bóng `--flg-glow`). Tên: `--flg-text-md`, đậm `--flg-weight-semibold`, `letter-spacing: -.01em`, một dòng, dài thì "…". Là link thì có vòng focus chung (bo `--flg-radius-md`). Chữ của tên ẩn khỏi mắt (kỹ thuật `flg-visually-hidden`, vẫn là tên của link) ở rail và ở header màn hẹp dưới 768px khi header có một `SearchField` không thu gọn (mockup H2 điện thoại: "logo chỉ còn dấu"; Claude chốt, qua `:has()`).

**Brand ở đâu** (hai chỗ, CSS ẩn hẳn một; Claude chốt):

| | Rộng, mở rộng | Rail | Hẹp, đóng | Hẹp, tấm mở |
|---|---|---|---|---|
| S1, ô brand của header | ẩn | ẩn | hiện | hiện, header `inert` |
| S1, hàng đầu của sidebar | hiện | chỉ dấu | (sidebar ẩn) | hiện |
| S2, ô brand của header | hiện | hiện | hiện | hiện, header `inert` |
| S2, hàng đầu của sidebar | không có | không có | (sidebar ẩn) | hiện |

Bảng là của khung có sidebar; không có sidebar thì chỉ có ô brand của header, hiện ở mọi cỡ (phát hiện khi review cuối Plan A). Lúc nào công nghệ hỗ trợ cũng chỉ gặp một brand. Nội dung của `brand` được render hai lần, nên docs nói brand không được mang `id`.

**Rail** (màn rộng, `collapsed`): cột sidebar R (68px); hàng đầu S1 chỉ còn dấu ở giữa; nav theo dạng rail (§4.3 Nav). Trigger mang tên "Expand sidebar".

**Tấm trượt** (màn hẹp, đang mở):

- `position: fixed; top: 0; bottom: 0; left: 0`, rộng D (300px) và tối đa `calc(100vw - 48px)` để còn một dải lớp nền để chạm (ngoài mockup), `z-index: 5`, kính, bo `0 var(--flg-radius-lg) var(--flg-radius-lg) 0`, bỏ cạnh trái, trên, dưới (còn cạnh phải cong theo góc bo).
- Hàng đầu 56px như trên; thân chứa Nav ở dạng mở rộng (rail không áp ở màn hẹp). Trang S cho nav trong tấm cách hàng đầu 8px; Nav giữ padding 10px của nó (lệch 2px, Claude chốt).
- **Lớp nền:** `position: fixed; inset: 0; z-index: 4`, nền `--flg-scrim`, `backdrop-filter: blur(var(--flg-scrim-blur))`, như `::backdrop` của Dialog. Header vẫn thấy mờ dưới lớp nền, như mockup.

**Skip link** (ngoài mockup; Claude chốt): `<a class="flg-app-shell-skip">`, ẩn khỏi mắt (`flg-visually-hidden`) khi không có focus. Khi có focus: `position: fixed; top: 8px; left: 8px; z-index: 6`, padding `8px 12px`, bo `--flg-radius-md`, nền `--flg-glass-tint-solid`, viền 1px `--flg-control-border`, chữ `--flg-text` `--flg-text-sm` đậm `--flg-weight-semibold`, bóng `--flg-glass-shadow`, cộng vòng focus chung.

**Dark:** chỉ khác giá trị token (kính tối, `--flg-scrim` đậm hơn), đúng như nửa Dark của mockup.

#### Nav (N1, N2)

**Phần chung** (số đo của trang Nav):

- **Gốc** `<nav class="flg-nav">`: cột `flex`, `flex-grow: 1` khi nằm trong thân sidebar (để mục ở đáy đẩy được xuống cuối thân; chỉ ở đó: `.flg-app-shell-sidebar-body > .flg-nav`, vì trong một hàng flex Nav sẽ chia hàng với phần tử bên cạnh; trong một cột flex của người dùng, như Drawer, docs nói tự cho `flex-grow: 1`; phát hiện khi review cuối Plan B), padding 10px. N2: padding trái 0 (các hàng chạy tới mép kính).
- **Danh sách:** cột, khoảng cách 2px, margin và padding 0, `list-style: none`.
- **Mục** (`.flg-nav-item`, cả link lẫn nút của nhóm): `flex`, căn giữa dọc, khoảng cách 10px, `box-sizing: border-box`, rộng bằng hàng (từ khoá `stretch` kèm `-webkit-fill-available` và `-moz-available`, `100%` làm dự phòng, như `stepper.css`: nút không tự giãn như thẻ `<a>`, và mục con có margin trái 28px; phát hiện khi lập Plan B), cao 36px, padding `0 10px`, bo `--flg-radius-md`, không viền, không nền, chữ `--flg-text`, font `--flg-weight-medium` `--flg-text-sm` / 1.2 `--flg-font-sans`, căn trái, không gạch chân, một dòng.
  - Icon (`.flg-nav-item-icon`): khối 18×18px không co, màu `--flg-text-muted`; svg con 18px.
  - Nhãn: chiếm phần còn lại, `min-width: 0`, dài thì "…".
  - Chevron của nhóm: 16px, màu `--flg-text-muted`; nhóm đóng chỉ sang phải, nhóm mở chỉ xuống (xoay, §3.6).
- **Hover** (`@media (hover: hover)`, mục không đang chọn, không tắt): nền `--flg-control-track`, icon lấy `--flg-text`.
- **Focus:** vòng focus chung trên mục (`outline` 2px `--flg-focus-outline-color` cách 2px, `--flg-focus-ring`), như `.mk-item[data-st=focus]`.
- **Tắt:** `opacity: .5`, `cursor: not-allowed`, không hover.
- **Mục con của nhóm:** cao 32px, cách trái 28px (`margin-left`, rộng phần còn lại), đậm `--flg-weight-regular`, không icon. Danh sách con cách nút nhóm 2px.
- **Tiêu đề mục** (`NavSection` có `title`): khối bọc cách phía trên 14px (khối đầu tiên của Nav không cách); tiêu đề cao 28px, một dòng căn giữa dọc, padding `0 10px`, màu `--flg-text-muted`, font `--flg-weight-medium` `--flg-text-xs` / 1.2; dài thì "…" như nhãn (`white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`, `min-width: 0`), nên là khối `display: block` căn giữa bằng `align-content: center` chứ không `flex` (chữ đặt thẳng trong flex container nằm trong một mục vô danh, không có "…"; dòng vẫn ở đúng chỗ cũ; phát hiện khi review cuối Plan B). `NavSection` không có `title`: chỉ là khoảng cách 14px (rail: đường chia). Một dãy mục đứng sau một `NavSection` (một `<ul>` riêng, không thuộc section, như screen reader nói) cũng cách nó 14px (`.flg-nav > .flg-nav-section + .flg-nav-list`), như section kế tiếp sẽ cách; không có khoảng đó thì dãy trông như phần cuối của section (rail: cùng đường chia; phát hiện khi review cuối Plan B).
- **Mục ở đáy** (`NavSection bottom`): `margin-top: auto`, padding trên 16px, cột khoảng cách 8px: một `Divider` ngang (`flg-divider`) rồi các mục.
- **Số đếm** (`badge` là số hay chuỗi): N1 là một `Badge` `neutral` (đúng lớp `flg-badge`); N2 là chữ số trần (§N2). `badge` là một element thì lib đặt nó vào ô cuối nguyên vậy.

**`pill` (N1, mặc định):** viên nền nhấn nhạt.

- Mục đang chọn (`aria-current="page"`): nền `--flg-selected-bg`, chữ và icon `--flg-selected-text`, đậm `--flg-weight-semibold`. Không đổi khi hover.
- Nhóm chứa trang hiện tại (`data-has-active`): nhãn đậm `--flg-weight-semibold`, chữ và icon `--flg-accent-text` (mockup: chữ `--flg-selected-text`, icon `--flg-accent-text`; hai token bằng nhau ở mặc định; spec dùng `--flg-accent-text` cho cả hai vì ở `prefers-contrast: more` `--flg-selected-text` là màu chữ dành cho nền nhấn đặc, ở đây chữ nằm thẳng trên kính; Claude chốt).
- Đường dẫn của nhóm: `::before` của mỗi mục con, tuyệt đối, cách trái −9px (thẳng dưới tâm icon của nhóm), từ −1px tới −1px theo chiều dọc (mục con đầu từ −7px, nối lên nút nhóm), rộng 1px, nền `--flg-control-border`, không nhận con trỏ.

**`bar` (N2):** vạch nhấn ở mép trái và nền nhạt dần.

- Mục cấp 1 và mục ở đáy: padding trái 20px, bo `0 var(--flg-radius-md) var(--flg-radius-md) 0`. Mục con: padding trái 20px, cùng cách bo. Tiêu đề mục: padding trái 20px, `--flg-text-2xs`, đậm `--flg-weight-semibold`, `letter-spacing: .08em`, chữ hoa. Đường chia ở đáy: rộng `calc(100% - 10px)`, cách trái 10px.
- Mục đang chọn: nền nhuộm N2 (§4.2), đậm `--flg-weight-semibold`, chữ giữ `--flg-text`, icon `--flg-accent-text`; vạch `::after` tuyệt đối sát mép trái, cách trên và dưới 6px, rộng 3px, bo `0 3px 3px 0`, nền `--flg-accent-solid`. Mục con đang chọn: vạch nằm ngay trên đường dẫn (`left: -1px`, cách trên dưới 3px, bo 3px).
- Nhóm chứa trang hiện tại: nhãn đậm, icon `--flg-accent-text`, chữ giữ `--flg-text`.
- Đường dẫn: `::before` của mục con tại `left: 0` (thẳng dưới tâm icon của nhóm), như N1.
- Số đếm: chữ số trần, `flex: none`, rộng tối thiểu 16px, căn phải, `--flg-text-xs` đậm `--flg-weight-semibold`, `tabular-nums`, màu `--flg-text-muted`; trên mục đang chọn lấy `--flg-text` (ngoài mockup: mockup không vẽ số trên mục đang chọn, và chữ mờ trên nền nhuộm chỉ 4.22 light, 3.63 dark; Claude chốt).
- Vòng focus của hàng sát mép kính tràn ra ngoài tấm 3–4px như mockup ghi; trong AppShell phần đó nằm ngoài màn hình (sidebar sát mép trái). Ở `prefers-contrast: more` và forced colors (hai chế độ dùng `outline` làm dấu hiệu focus), mục N2 có `outline-offset: -2px` (vẽ vào trong), như Table `lined` (Claude chốt).

**Rail** (sidebar thu gọn ở màn rộng; chung cho hai variant, trừ chỗ ghi):

- Gốc: padding `12px 0`, căn giữa ngang; danh sách khoảng cách 4px. Thân sidebar ở rail vẫn cuộn nhưng không có thanh cuộn (`scrollbar-width: none`, thêm `::-webkit-scrollbar { display: none }` cho Safari trước 18.2; CSS sinh ra theo từng điểm gãy, chỉ ở rail): một thanh cuộn chiếm chỗ (Windows, Linux có thanh cuộn cổ điển) sẽ làm cột hẹp lại, mục lệch khỏi giữa và vạch N2 rời mép kính, bị thân cắt mất; nhờ vậy cột giữ trọn bề rộng rail (phát hiện khi review PR #38).
- Mục: 40×40px, padding 0, căn giữa, bo `--flg-radius-md`, màu `--flg-text-muted`, icon 20px. Nhãn và số đếm ẩn khỏi mắt (`flg-visually-hidden`, vẫn là tên của link: "Inbox 12"); chevron và danh sách con ẩn hẳn (trừ khi danh sách con đang là flyout mở, bên dưới). Mục không có icon hiện chữ cái đầu của nhãn (`--flg-text-sm` đậm `--flg-weight-semibold`, `aria-hidden`).
- Hover: nền `--flg-control-track`, màu `--flg-text`.
- Chấm số đếm (mục có `badge`, trừ `badge={0}`: chấm nói "có gì đó", như Indicator ẩn số 0 theo mặc định; dạng mở rộng vẫn vẽ "0" và "0" vẫn trong tên của link; chuỗi rỗng không có số đếm nào; phát hiện khi review PR #38): chấm của Indicator (§Indicator), tuyệt đối `top: 7px; right: 7px`, 8px, `--flg-accent-solid`, vòng 2px `--flg-glass-tint-solid`, `aria-hidden`.
- Tiêu đề mục: tiêu đề ẩn khỏi mắt (vẫn là tên của nhóm), thay bằng một đường chia rộng 28px, cách trên dưới 4px: là `::before` của `NavSection` (không thêm phần tử vào DOM của dạng mở rộng, nên cấu trúc HTML của §6.3 giữ nguyên; khối đầu tiên của Nav không có đường này; ở forced colors nó là `CanvasText`; phát hiện khi lập Plan B). Một dãy mục đứng sau một section có cùng đường chia, là `::before` của `<ul>` của dãy, cũng `CanvasText` ở forced colors, và không có khoảng 14px của dạng mở rộng: cột rail giữ khoảng cách 4px của nó (phát hiện khi review cuối Plan B). Mục ở đáy: `margin-top: auto`, padding trên 12px, đường chia 28px rồi mục, khoảng cách 8px.
- N1, mục đang chọn và nhóm chứa trang hiện tại: nền `--flg-selected-bg`, icon `--flg-selected-text`.
- N2, như trên: nền nhuộm N2, icon `--flg-accent-text`, vạch 3px tại `left: calc(21px - var(--flg-app-shell-rail-width) / 2)`, tức −13px ở rail mặc định 68px (sát mép trong của kính rail: mục 40px nằm giữa bề rộng rail trừ 1px viền phải của tấm, cách mép kính `(R − 41px) / 2`, vạch nằm trong mép đó 0.5px, ở mọi bề rộng rail; phát hiện khi review cuối Plan B), cách trên dưới 8px, bo `0 3px 3px 0`, `--flg-accent-solid`.
- **Tooltip:** Tooltip của lib, `side="right"`, 6px ngoài mép phải của rail, chữ là nhãn. Khoảng cách tới mục được đo mỗi lần tooltip mở: từ mép phải của mục tới mép phải của tấm sidebar, làm tròn xuống, cộng 6px, nên theo `--flg-app-shell-rail-width`; ở rail mặc định 68px là 20px như mockup (mép phải của mục cách mép tấm 14.5px vì viền 1px; phát hiện khi review cuối Plan B). Hiện khi hover và focus bàn phím, như mọi Tooltip.
- **Flyout của nhóm:** Popover kính của lib (lớp `flg-surface flg-popover`, có mũi tên), `side="right"`, `align="start"`, cách nút 26px (16px cộng 10px chỗ của mũi tên, như Popover), lùi lên 6px (`alignOffset: -6`). Cột rộng 166px, padding 6px, khoảng cách 2px. Tiêu đề (tên nhóm): padding `6px 10px 4px`, màu `--flg-text-muted`, `--flg-weight-semibold` `--flg-text-xs` / 1.2. Các mục: cao 32px, giao diện mục của variant (N1 đang chọn: viên `--flg-selected-bg`). N2: flyout padding trái 0, mục padding trái 16px bo `0 md md 0`, tiêu đề padding trái 16px, mục đang chọn có vạch như mục cấp 1.

**Dark:** chỉ khác giá trị token.

#### Indicator (B1, B3)

- **Bọc** (`.flg-indicator`): `position: relative; display: inline-flex`, quanh đúng một phần tử (nút icon, avatar).
- **Viên số** (`.flg-indicator-mark`, `aria-hidden`): tuyệt đối, `box-sizing: border-box`, rộng tối thiểu 17px, cao 17px, padding `0 5px`, bo `--flg-radius-full`, font `--flg-weight-semibold` `--flg-text-2xs` / 17px `--flg-font-sans`, căn giữa, `tabular-nums`, `pointer-events: none`, vòng `box-shadow: 0 0 0 2px var(--flg-glass-tint-solid)` tách viên khỏi icon (ghi chú của người vẽ).
  - Vị trí (đúng từng mockup; Claude chốt giữ cả hai): `danger` (B1) `top: 0; right: 0`; `accent` (B3), `success`, `warning` `top: -3px; right: -4px`. Ghi đè được qua `--flg-indicator-top` và `--flg-indicator-right`.
  - Màu: `accent` nền `--flg-indicator-accent`, chữ `--flg-on-accent`; `danger` nền `--flg-danger-fill`, chữ `--flg-on-danger`; `success` / `warning` nền `--flg-success` / `--flg-warning`, chữ `--flg-on-status` (ngoài mockup).
- **Chấm** (`dot`): 8×8px, bo 50%, `top: 7px; right: 7px`, cùng vòng 2px; màu: `accent` `--flg-accent-solid` (chấm số đếm của rail, trang Nav), `danger` `--flg-danger-fill`, `success` `--flg-success`, `warning` `--flg-warning`.
- **Dark:** nền `accent` là `--flg-indicator-accent` của dark (pha đen); còn lại chỉ khác giá trị token.

#### SearchField (H2, H3)

**Phần chung:**

- Gốc `.flg-search-field`; bên trong là khung của `Input` (`.flg-input`, cùng cỡ `sm`/`md`/`lg`, cùng focus: viền `--flg-accent-solid`, `outline`, `--flg-focus-ring`). Ngoài header, gốc rộng như `Input` (đầy hàng). Trong `AppShellHeader`: `flex: 0 1 280px; width: 280px; min-width: 0`, cách phần tử trước thêm 4px (trang S); `width` có thêm vì một phần tử bọc quanh ô (cụm widget cuối header) rộng bằng nội dung bên trong, không đo theo flex-basis, nên ô chỉ rộng bằng cỡ tự nhiên của `<input>` (phát hiện khi lập Plan C).
- Đầu ô: icon kính lúp 16px, màu `--flg-text-muted` (ô trang trí của `Input`).
- `<input type="search">`: bỏ giao diện riêng của trình duyệt (`appearance: none`, `::-webkit-search-cancel-button` và `::-webkit-search-decoration` ẩn).
- Cuối ô (ô trang trí cuối có `margin-right: -5px`):
  - **Gợi ý phím** (`<kbd class="flg-search-field-kbd">`, khi ô rỗng và có `shortcut`): `inline-flex`, căn giữa, cao 20px, padding `0 6px`, viền 1px `--flg-control-border`, bo `--flg-radius-xs`, nền `--flg-control-bg-secondary`, chữ `--flg-text-muted` `--flg-weight-medium` `--flg-text-2xs` / 1, `letter-spacing: .02em`, một dòng.
  - **Nút xoá** (khi có chữ, thay chỗ gợi ý): `<button type="button">` 20×20px, bo `--flg-radius-full`, không nền, màu `--flg-text-muted`, icon × 14px. Hover (ngoài mockup): nền `--flg-control-track`, màu `--flg-text`. Focus: vòng focus chung.
- **Dưới 768px** (Claude chốt): gợi ý phím ẩn (mockup H2 điện thoại: "không có gợi ý phím").

**H2 (`collapsible={false}`, mặc định):** ô luôn hiện, rộng 280px trong header. Dưới 768px trong header: `flex: 1 1 0%` (như `flex: 1` của mockup; `1 1 auto` bắt các phần khác của header co lại theo cỡ tự nhiên của `<input>`; phát hiện khi lập Plan C), cách hai bên `0 4px 0 2px`, và chữ của brand chỉ còn dấu (§AppShell).

**H3 (`collapsible`):**

- **Thu gọn:** IconButton `ghost` `md` (34×34px, icon kính lúp 18px), tên `labels.open` ("Search"). Tooltip `side="bottom"`, `align="center"`, cách 8px, chữ là tên cộng gợi ý phím nằm trong tooltip (`kbd` cách trái 6px, cao 16px, padding `0 4px`).
- **Mở** (bấm nút hoặc phím tắt): nút ẩn, ô hiện ngay chỗ đó, rộng 300px, cách phải 6px, nhận focus. Rỗng thì có gợi ý phím; có chữ thì có nút xoá.
- **Mở, dưới 768px, trong `AppShellHeader`:** ô phủ cả hàng header: gốc `position: absolute; inset: 0`, `flex`, căn giữa dọc, khoảng cách 4px, padding `0 10px` (như header hẹp). Đầu hàng là nút ← (IconButton `ghost` `md`, icon mũi tên trái 18px, tên `labels.close`, "Close search"), rồi ô `flex: 1`, cách `0 4px 0 2px`. Các phần khác của header ẩn (`visibility: hidden`, qua `:has()`, nên chúng cũng ra khỏi cây truy cập và thứ tự Tab trong lúc đó). Docs: đặt SearchField là con trực tiếp của header (hoặc trong một phần tử bọc không có `position`).

**Qua phần tử bọc, và chỉ ô của chính header** (phát hiện khi review cuối Plan C): các luật trong header ở trên đúng như nhau khi ô nằm trong một phần tử bọc như `<form role="search">` của docs: dưới 768px, con của header chứa ô H2 là phần tử của hàng, lấy hết chỗ còn lại (`flex: 1 1 0%; min-width: 0`) và ô lấp đầy nó; khi H3 mở, phần tử bao quanh ô (form) không ẩn, nên landmark search vẫn ở trong cây truy cập, còn mọi phần tử khác của header (kể cả các widget nằm cạnh ô trong cùng phần tử bọc) ẩn như trên. Ô nằm trong một popover hay dialog mở từ header (vẫn trong DOM của header) không phải ô của header (`:not(:is([popover], dialog) *)`, như luật của AppShell): không rộng 280px, không phủ header, không có nút ←, không làm chữ của brand ẩn.

**Dark:** chỉ khác giá trị token.

#### ThemeSwitch (T1) và ThemeMenuGroup (T3)

**T1 (`ThemeSwitch`):**

- IconButton `ghost` `md` (34×34px), icon 18px: mặt trời (Light), trăng (Dark), màn hình (System). Ba icon đều có trong DOM (`.flg-theme-switch-icon[data-for]`); CSS hiện đúng một cái theo `data-value` của nút, hoặc theo `:root[data-flg-theme]` khi nút còn `data-pending` (§6.3).
- Hover: nền `--flg-control-track` (nút `ghost`). Focus: vòng focus chung.
- Tooltip `side="bottom"`, `align="end"`, cách 17px (6px dưới mép header 56px của mockup), chữ `labels.tooltip(current, next)`: "Theme: Light · click to switch to Dark". Hiện khi hover và focus bàn phím.

**T3 (`ThemeMenuGroup`):**

- `MenuRadioGroup` của lib với `MenuLabel` "Theme" ở đầu (giao diện nhãn menu có sẵn) và ba `MenuRadioItem` Light / Dark / System (chấm tròn của mục đang chọn có sẵn).
- Icon ở cuối mỗi mục (`.flg-theme-menu-icon`): `inline-flex`, `margin-left: auto`, padding trái 12px, màu `--flg-text-muted`, svg 15px; mục đang được trỏ (`[data-highlighted]`): `--flg-highlight-icon`.
- Hover và focus bàn phím: nền tô của mục menu (có sẵn).

**Dark:** chỉ khác giá trị token.

#### UserMenu (U1, U2)

**Nút U1 (`showName={false}`, mặc định):** Button `ghost` `md` chỉ có icon (34×34px), bo `--flg-radius-full`, chứa `Avatar` `md` (32px, trang trí). Hover: không đổi nền; vòng `box-shadow: 0 0 0 3px var(--flg-control-track)`. Menu đang mở (`aria-expanded="true"`): vòng `0 0 0 2px var(--flg-accent-solid)`. Focus bàn phím: vòng focus chung (thắng vòng hover).

**Nút U2 (`showName`):** Button `ghost` `md` (cao 34px), bo `--flg-radius-full`, khoảng cách 8px, padding `0 9px 0 5px`, đậm `--flg-weight-medium`. Bên trong: `Avatar` `sm` (24px), tên (một dòng, rộng tối đa 160px, dài thì "…"; ngoài mockup), chevron xuống 14px màu `--flg-text-muted`, lật lên khi mở. Hover và lúc mở: nền `--flg-control-track`.

**Menu:** `DropdownMenuContent`, `side="bottom"`, `align="end"`, cách nút 17px. Rộng 244px (U1) hay 230px (U2), không giới hạn `max-width` của menu.

- **Đầu menu** (`.flg-user-menu-header`, không phải mục menu): `flex`, căn giữa dọc, khoảng cách 10px, padding `8px 8px 9px`. Avatar `lg` (40px) ở U1, `md` (32px) ở U2. Cột chữ khoảng cách 3px, `min-width: 0`: tên `--flg-text-sm` đậm `--flg-weight-semibold`, `line-height: 1.2`, màu `--flg-text`; dòng phụ `--flg-text-xs`, `line-height: 1.2`, `--flg-text-muted`; cả hai một dòng, dài thì "…" (ngoài mockup). Sau đó là một `MenuSeparator`.
- Các mục là `children` của người dùng (`MenuItem` có icon, `MenuSeparator`…; mockup: Profile, Settings, phân cách, Log out).

**Dark:** chỉ khác giá trị token.

#### Công thức bảng thông báo (B1, B3) và thay đổi của List

Công thức docs, không phải component. Ghép từ phần có sẵn; số đo của mockup nằm trong ví dụ (style của ví dụ), trừ thay đổi của `List`:

- **Nút chuông:** `PopoverTrigger asChild` với một IconButton `ghost` `md` (icon chuông 18px, icon của docs), bọc trong `Indicator` (`status="danger"` cho B1, `"accent"` cho B3). Tên của nút có số chưa đọc: "Notifications, 2 unread". Hết chưa đọc thì không có Indicator, tên chỉ còn "Notifications".
- **Bảng:** `PopoverContent` `side="bottom"`, `align="end"`, cách 17px, `arrow={false}`, rộng 360px, `aria-label="Notifications"`.
  - B1: padding 0, khoảng cách 0. Hàng đầu: cao tối thiểu 44px, padding `4px 6px 4px 14px`, hai đầu, viền dưới 1px `--flg-control-border`; tiêu đề `--flg-text-md` đậm `--flg-weight-semibold`; nút "Mark all as read" là Button `ghost` `sm` màu `--flg-accent-text`, padding `0 8px`, khoảng cách 5px, icon hai dấu ✓. Danh sách: `List variant="inset" surface={false}` (mới), padding `2px 0 4px`; mỗi hàng cao tối thiểu 56px, padding `8px 14px 8px 12px`.
  - B3: padding `0 12px 10px`, khoảng cách 6px; hàng đầu padding trái 2px, phải 0, `margin-right: -6px`, không viền. `Tabs variant="underline"` (margin `0 -2px 2px`): "All" và "Unread" kèm `Badge` `accent` số chưa đọc (cách trái 2px, padding `2px 6px`). Danh sách `List variant="plain"`, hàng cao tối thiểu 54px.
  - Mỗi hàng là `ListItem` có `href` (hoặc `onSelect`): ô đầu là `Avatar` `md` hoặc một vòng icon 32px (nền `--flg-control-track`, icon 17px `--flg-text-muted`; thông báo thành công: nền `--flg-success` pha `--flg-status-bg-alpha`, icon `--flg-success`); tiêu đề đậm `--flg-weight-regular`; mô tả là thời gian.
  - **Chưa đọc** (không chỉ bằng màu): tiêu đề đậm `--flg-weight-semibold`, chữ ẩn "Unread: " ở đầu tiêu đề, và một chấm 8px `--flg-accent-solid` ở ô cuối (`aria-hidden`).
  - **Rỗng:** cột căn giữa, khoảng cách 6px, padding `18px 16px 22px` (B1: trên 22px), vòng icon 40px (icon chuông 20px), tiêu đề `--flg-text-sm` đậm, gợi ý `--flg-text-xs` `--flg-text-muted`.
- **"Mark all as read" ở yên** (phát hiện khi lập Plan C): nút còn đó cả khi không còn hàng chưa đọc, và chỉ mất khi danh sách rỗng (không có gì để đánh dấu). Nếu nó biến mất ngay khi bấm xong thì focus rơi xuống đầu trang; ở lại thì bấm thêm lần nữa không đổi gì. Ở Safari một cú bấm chuột không đưa focus vào nút mà vào tấm (tấm có `tabindex`), nên story chỉ đòi focus còn nằm trong tấm sau khi bấm chuột, và đòi nút giữ focus sau khi bấm phím.
- **Chuông có `count` là số chưa đọc** (phát hiện khi lập Plan C): `Indicator` nhận `count={số chưa đọc}` và tự không vẽ gì ở 0, nên công thức không cần `show`; tên của nút vẫn phải tự ghép số (§4.3 Indicator).
- **Thay đổi của `List`** (Plan C): prop `surface?: boolean`, mặc định `true`, chỉ có tác dụng ở `inset`. `false` thì gốc không mang lớp `flg-surface` (không kính, không viền, không bo, không bóng của riêng nó) và mang `data-surface="false"`; hàng đầu và hàng cuối bỏ góc bo của mình (nền hover chạm thẳng hai mép của tấm chứa). Đường ngăn, hover và hàng hiện tại giữ như `inset`. Dùng cho List đặt trong một tấm đã là kính (Popover, Card, Dialog). Ở variant khác thì không có tác dụng và `devWarn`.

### 4.4 Tương phản (bổ sung cho §4.9 của spec 0+1)

`scripts/check-contrast.ts` đo thêm các cặp sau, trên kính thường và trên panel phủ lớp tối (spec giai đoạn 2 §4.4; cũng là trường hợp của tấm trượt nằm trên lớp nền), lấy số thấp nhất trên mọi nền tham chiếu và mọi điểm màu của viền kính. Plan làm component nào đo cặp của component đó. Các số dưới đây Claude đã đo khi viết spec bằng chính các hàm của `scripts/lib/contrast.ts` (làm tròn xuống); plan đo lại khi viết check và dùng số của script.

**Cặp mới** ("+" là `prefers-contrast: more`):

| Check | Plan | Cặp | Ngưỡng | Light | Dark | Light + | Dark + |
|---|---|---|---|---|---|---|---|
| `nav-bar-indicator` | B | Vạch 3px `--flg-accent-solid` của mục đang chọn N2 trên nền nhuộm 18% của nó | 3 | **2.52** | **2.03** | 4.65 | 5.30 |
| `nav-bar-text` | B | Chữ `--flg-text` của mục đang chọn N2 (và số đếm của nó, §4.3) trên nền nhuộm, thấp nhất của hai điểm 18% và 3% | 4.5 | 8.24 | 5.82 | 11.44 | 10.17 |
| `nav-bar-icon` | B | Icon `--flg-accent-text` của mục đang chọn N2 trên nền nhuộm | 3 | 3.28 | 3.80 | 4.55 | 6.64 |
| `indicator-count-text` | B | Số trên viên của Indicator: `--flg-on-accent` trên `--flg-indicator-accent`, `--flg-on-danger` trên `--flg-danger-fill`, `--flg-on-status` trên `--flg-success` và `--flg-warning`; thấp nhất | 4.5 | 4.74 | 5.44 | 6.28 | 5.44 |
| `indicator-dot` | B | Chấm của Indicator (màu của bốn trạng thái) so với vòng `--flg-glass-tint-solid` của nó | 3 | 4.48 | 3.06 | 6.07 | 3.16 |
| `nav-rail-current-dot` | B | Chấm số đếm trên mục đang chọn N1 ở rail. Mặc định: chấm `--flg-accent-solid` so với vòng `--flg-glass-tint-solid` của nó, cả hai trên viên `--flg-selected-bg`. "+": viên là nền nhấn đặc, cùng màu với chấm, nên chấm lấy `--flg-selected-text` (giữ vòng) và được đo so với `--flg-selected-bg` (phát hiện khi review PR #38) | 3 | 4.44 | 4.20 | 6.28 | 8.15 |
| `kbd-text` | C | Chữ `--flg-text-muted` của phím gợi ý (nền `--flg-control-bg-secondary`) trong ô SearchField (trên `--flg-control-bg`) và trong tooltip của H3 (trên kính của tooltip) | 4.5 | 7.15 | **3.31** | 7.83 | 7.63 |

Số in đậm là dưới ngưỡng ở theme mặc định. Ở dark, `kbd-text` là 3.31 trong ô và 3.76 trong tooltip.

**Cặp đã có trong §4.9, được mở rộng** (cùng cặp màu, nên cùng số đo; không thêm check):

| Dòng §4.9 | Vị trí mới |
|---|---|
| 2 (vòng focus) | Mục và nút nhóm của Nav (cả rail và flyout); brand là link; skip link; nút xoá của SearchField; nút của UserMenu |
| 6 (`--flg-text-muted` trên bề mặt) | Tiêu đề mục của Nav (N1, N2), tiêu đề của flyout, số đếm trần của N2; chữ của footer; dòng phụ ở đầu menu của UserMenu; thời gian trong bảng thông báo (công thức) |
| 7 (`--flg-selected-text` trên `--flg-selected-bg`) | Chữ và icon của mục đang chọn N1 (cả rail và flyout) |
| 8 (`--flg-selected-bg` so với nền) | Nền của mục đang chọn N1 (cả rail và flyout) |
| 9 (`--flg-text-muted` trên nền nhấn nhạt) | Icon ở cuối mục của `ThemeMenuGroup` khi mục đang được trỏ (icon, ngưỡng 3:1, đạt) |
| 12 (`--flg-text-muted` trên `--flg-control-track`) | Số đếm trần của N2 trên mục đang hover |
| 14 (`--flg-accent-solid` so với nền) | Vạch của mục đang chọn N2 ở rail (nằm trên kính); chấm chưa đọc trong bảng thông báo (công thức) |
| 29 (`--flg-accent-text` trên bề mặt) | Nhãn của nhóm chứa trang hiện tại, N1; nút "Mark all as read" của bảng thông báo (công thức) |
| 32 (chữ Badge trên nền hover `--flg-control-track`) | Số đếm `Badge` `neutral` của N1 trên mục đang hover (dark 4.15) |

**Dòng mới của §4.9 (cần chủ dự án duyệt).** Đúng như mockup, nên theo spec giai đoạn 2 §4.4 chúng thành dòng mới, kèm số đo làm tròn xuống, và được nêu trong mô tả PR của plan thêm chúng:

| # | Plan | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
|---|---|---|---|---|---|---|
| 35 | B | Vạch `--flg-accent-solid` của mục đang chọn, Nav `bar` (N2), trên nền nhuộm 18% `--flg-accent-solid` của mục | 2.52 | 2.03 | 3:1 | 1.4.11 |
| 36 | C | Chữ `--flg-text-muted` của phím gợi ý (`⌘K`) trên nền `--flg-control-bg-secondary`: trong ô SearchField, trong tooltip của SearchField thu gọn | đạt (7.15) | 3.31 (ô), 3.76 (tooltip) | 4.5:1 | 1.4.3 |

- Dòng 35: một check `nav-bar-indicator`; dòng 36: một check `kbd-text`.
- Mục đang chọn N2 còn có chữ đậm và `aria-current="page"`, nên vạch không phải dấu hiệu duy nhất; phím gợi ý là chữ phụ, phím tắt còn được nói qua `aria-keyshortcuts`. Hai điều đó không miễn tiêu chí, chỉ là bối cảnh khi duyệt.
- Cả hai dòng đều đạt ở `prefers-contrast: more` (cột "+" ở trên).
- Theo quy tắc của dự án, chỗ sửa tương phản đi vào chế độ người dùng bật; theme mặc định giữ đúng mockup.

**Không đo:**

- Lớp nền, viền và cạnh của header, sidebar, footer, tấm trượt (khung, không phải control); đường dẫn của nhóm, đường chia của rail và của mục ở đáy (trang trí).
- Mọi nền hover; vòng hover (3px `--flg-control-track`) và vòng "đang mở" (2px `--flg-accent-solid`) của nút U1: trạng thái mở do chính menu đang hiện và `aria-expanded` nói.
- Vòng `--flg-glass-tint-solid` của Indicator (chỉ để tách viên khỏi icon). Viên số được đo qua chữ của nó; chấm được đo so với vòng (`indicator-dot`).
- Logo và chữ của brand, nội dung của main: của người dùng. **Chữ đặt thẳng trên nền trang** (tiêu đề trang trên main không có kính) phụ thuộc nền của ứng dụng, nên lib không đo; docs và ví dụ dùng `--flg-text`, không dùng `--flg-text-muted` (đo được khoảng 3.4:1 trên đốm xanh của nền mockup; theo bản quyết định).
- Mọi phần tắt (spec giai đoạn 3 §4.4).

**`prefers-contrast: more`:** mọi cặp mới phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, các quy tắc sau đều ngoài mockup:

- `--flg-indicator-accent` thành `--flg-accent-solid` (đặc), chữ `--flg-on-accent` của chế độ này (§4.2).
- N1, mục đang chọn: `--flg-selected-bg` đã thành nền nhấn đặc và `--flg-selected-text` là chữ cho nó (token). Số đếm `Badge` trong mục đó bỏ nền và lấy `--flg-selected-text` (giữ Badge `neutral` thì chỉ còn 2.19 light, 1.74 dark). Ở rail, chấm số đếm trên mục đó lấy `--flg-selected-text` qua biến `--flg-indicator-fill` và giữ vòng của nó (để nguyên thì chấm `--flg-accent-solid` trùng màu viên, chỉ còn vòng; check `nav-rail-current-dot`); forced colors không đổi, vì quy tắc forced colors của chấm đặt thẳng `background`. Nút nhóm không có số đếm nên không có chấm (phát hiện khi review PR #38).
- N1, nhóm chứa trang hiện tại: `--flg-accent-text` trên kính (5.95 light, 9.29 dark).
- N2: vạch, chữ và icon đạt với token của chế độ này; mục N2 vẽ `outline` của focus vào trong (§4.3).
- Phím gợi ý: đạt với `--flg-text-muted` của chế độ này.

### 4.5 Forced colors

Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `currentColor`, màu đặt trên phần tử bọc ngoài (spec giai đoạn 2 §4.5).

- **AppShell:**
  - Header, sidebar (cả tấm trượt), footer: quy tắc có sẵn của `.flg-surface` (nền `Canvas`, viền và chữ `CanvasText`, không bóng); các cạnh đã bỏ vẫn bỏ, nên mỗi tấm còn đúng đường ranh giới của mockup.
  - Lớp nền: không có quy tắc riêng, như `::backdrop` của Dialog; tấm trượt có viền `CanvasText` nên vẫn tách khỏi trang.
  - Skip link: viền 1px `CanvasText` (viền của nó bị hệ thống đổi màu), nền `Canvas`.
  - Main: không đổi.
- **Nav:**
  - Mục đang chọn N1 (cả rail và flyout): nền bị bỏ, nên có `outline: 2px solid Highlight; outline-offset: -2px`, như hàng hiện tại của List. Mục đang có focus thì `outline` của focus thắng.
  - Mục đang chọn N2: vạch `forced-color-adjust: none; background: Highlight`; nền nhuộm bị bỏ; vạch ở rail như vậy.
  - Nhóm chứa trang hiện tại: chữ đậm còn lại; ở rail (không còn chữ) nó nhận `outline` `Highlight` như mục đang chọn.
  - Đường dẫn và đường chia: `CanvasText`. Mục tắt: `GrayText`.
  - Số đếm N1 là `Badge`: quy tắc có sẵn của Badge. Chấm của rail: như chấm của Indicator.
- **Indicator:** `forced-color-adjust: none`, nền `Highlight`, chữ `HighlightText`, vòng `0 0 0 2px Canvas` (giữ được vì `box-shadow` không bị bỏ khi `forced-color-adjust: none`). Màu trạng thái mất, nhưng Indicator không mang trạng thái nào mà tên của nút không nói.
- **SearchField:** khung `Input` có sẵn; viền của `kbd` tự thành `CanvasText`, chữ `CanvasText`; nút xoá và nút ← màu `ButtonText`.
- **ThemeSwitch:** quy tắc của `Button`. **ThemeMenuGroup:** icon cuối mục `color: inherit` (mục đang được trỏ tự vẽ `Highlight` / `HighlightText` với `forced-color-adjust: none`, thuộc tính được kế thừa, nên không có quy tắc này icon giữ màu chữ mờ của tác giả trên nền `Highlight`).
- **UserMenu:** hai vòng của U1 là `box-shadow`, bị bỏ; trạng thái mở do menu đang hiện nói. Đầu menu: chữ `CanvasText`. U2: quy tắc của `Button`.
- **Công thức thông báo:** chấm chưa đọc của ví dụ có `forced-color-adjust: none; background: CanvasText`; chưa đọc vẫn đọc được qua chữ đậm.

### 4.6 Icon

**Icon dùng chung** ở `src/internal/icons.tsx` (nét 2, `strokeIcon`), chỉ những icon component tự vẽ; đường vẽ lấy từ mockup:

- Plan A: `MenuIcon` (`M4 6h16M4 12h16M4 18h16`), nút trigger. Nút × của tấm trượt dùng `CloseIcon` có sẵn.
- Plan B: chevron của nhóm dùng `ChevronIcon` có sẵn (`down`, `right`).
- Plan C: `SearchIcon` (`<circle cx="11" cy="11" r="7"/>` và `m20 20-3.5-3.5`); `SunIcon` (`<circle cx="12" cy="12" r="4"/>` và `M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41`); `MoonIcon` (`M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z`); `MonitorIcon` (`<rect x="2" y="3" width="20" height="14" rx="2"/>` và `M8 21h8M12 17v4`); `ArrowIcon` thêm `direction: 'left'` (`M19 12H5` và `m12 19-7-7 7-7`), nút ← của SearchField. Chevron của U2 là `ChevronIcon`; × của SearchField là `CloseIcon`.

**Icon của ứng dụng** (nhà, hộp thư, lịch, thư mục, người, biểu đồ, bánh răng, chuông, người dùng, đăng xuất, hai dấu ✓, vòng ✓) là nội dung của người dùng: chúng nằm trong docs và story (đường vẽ của trang Nav), không vào lib.

---

## 5. Primitives nội bộ mới

| File | Export | Nhiệm vụ |
|---|---|---|
| `use-media-query.ts` (A) | `useMediaQuery(query: string): boolean` | `useSyncExternalStore` trên `matchMedia(query)`; giá trị phía server và lần hydrate là `false`. Không có `matchMedia` (jsdom chưa giả lập) thì `false`. Mỗi query chỉ tạo một `MediaQueryList` (`useMemo` theo `query`), `subscribe` và `getSnapshot` cùng đọc `.matches` của nó, vì snapshot được đọc ở mọi lần render và sau mỗi commit (phát hiện khi review PR #37) |
| `popover.ts` (A) | `OPEN_POPOVER_CLOSES_ON_ESC`, `hasOpenPopover(root)` | Selector của popover đang mở mà Esc và lần nhấn ra ngoài đóng được (`auto`, `hint`; không phải `manual`), và lần tìm nó trong một phần tử, trả `false` ở engine không biết `:popover-open`. Tooltip và tấm trượt của AppShell dùng chung, để một sửa đổi tới được cả hai. Cùng lúc `isVisible` của `focus.ts` được export và tấm trượt dùng nó thay cho kiểm tra riêng (phát hiện khi review PR #37) |
| `child-keys.ts` (B, thêm vào file có sẵn) | `keyedChildren(children)` | Các con thành danh sách phẳng như `flattenChildren` (qua Fragment, mảng, iterable, tham chiếu lazy; bỏ những gì không render), mỗi con kèm một khoá là đường đi của nó trong children như được viết, như `Children.toArray` dựng: ở mỗi cấp là khoá riêng hay vị trí của nó (khe rỗng như `{cond && …}` vẫn được đếm), mảng lồng và Fragment thêm tiền tố là khoá hay vị trí của chúng; khoá riêng lặp lại trong cùng một danh sách thì dùng vị trí, như `childKeys`; hai hàm dùng chung một quy tắc khoá (`keyRule`: hai không gian `$` và `#`, thoát `:` và `=` trong khoá riêng, khoá lặp thì dùng vị trí), để một sửa đổi tới được cả hai (phát hiện khi review PR #38). Nhờ vậy một con đến hay đi không đổi khoá của các con sau nó. `flattenChildren` trả các `node` của nó, để chỉ có một lần duyệt (phát hiện khi review cuối Plan B) |
| `click.ts` (B) | `isPlainClick(event)`, `blockActivation(event)` | `isPlainClick`: lần bấm mà trình duyệt theo link ngay trong tab này (nút chính, không Ctrl, Cmd, Shift, Alt, chưa `defaultPrevented`, và link không có `target` khác `_self` cũng không có `download`: `target` rỗng là tab này, từ khoá đọc không phân biệt hoa thường; `target="_blank"` hay `download` để người dùng ở lại trang, nên tấm trượt, flyout và trang của Pagination giữ nguyên; phát hiện khi review PR #38), trước là `leftToBrowser` của Pagination. `blockActivation`: `preventDefault` và `stopPropagation` ở pha capture, trước là bản riêng của `Button` và của `NavItem`. Button, Pagination và Nav dùng chung, để một sửa đổi của "lần bấm thường" tới được mọi nơi (phát hiện khi review cuối Plan B) |
| `platform.ts` (C) | `isApplePlatform(): boolean` | `navigator.userAgentData?.platform`, không có thì `navigator.platform`, có chứa "Mac", "iPhone", "iPad" hay "iPod", không phân biệt hoa thường (`userAgentData` trả "macOS", `navigator.platform` trả "MacIntel") (phát hiện khi lập Plan C). Chỉ đọc sau khi mount: SearchField đọc nó bằng `useSyncExternalStore` có giá trị phía server là `undefined`, nên lần render hydrate cho cùng chữ với server rồi mới điền (phát hiện khi lập Plan C) |
| `editable.ts` (C) | `isEditable(target)` | Chuyển nguyên từ `Toaster.tsx` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]`, hay con của chúng); Toaster và phím tắt của SearchField dùng chung |
| `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })` trả `[giá trị, đặt giá trị]`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên (đọc lại khi mọi người đăng ký đã đi hết rồi có người mới) và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store. Kiểu `ThemeValue`, `isThemeValue` và khoá mặc định `'flg-theme'` nằm ở `theme-value.ts`, không có React, để `ThemeScript` (server-safe) không kéo hook của store vào (phát hiện khi lập Plan C) |

**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `modal` (`open && !isWide`: tấm đang là dialog; phần nào cần biết thì đọc nó, không tự tính lại; phát hiện khi review cuối Plan A), `setOpen(open, { returnFocus, opener })` (`returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, là nút trigger đã mở tấm, không có thì trigger đầu tiên còn hiện; `opener` chỉ do `AppShellSidebarTrigger` truyền khi mở; phát hiện khi lập Plan A. Focus cũng về như vậy khi cha controlled tự đóng không qua `setOpen`; lần đóng do cửa sổ rộng ra không dùng `setOpen` mà được nhận ra bằng `matchMedia` (§3.4); `opener` và cờ `returnFocus: false` bị quên sau mỗi lần đóng; phát hiện khi review cuối Plan A; cờ chỉ được ghi khi lời gọi đóng một tấm đang hiện, và cũng bị quên mỗi khi tấm hiện ra, §3.4; phát hiện khi review PR #37), id của sidebar và main, đăng ký phần và trigger; **không** có `labels` và `brand`: hai thứ đó nằm ở một context thứ hai, `AppShellTextContext` (`{ labels, brand }`), vì cha thường truyền chúng inline nên chúng là giá trị mới ở mọi lần render, và `NavItem` đọc context của AppShell (để đóng tấm trượt), nên nếu chúng cùng một context thì mọi mục nav render lại theo mọi lần render của cha; chỉ header, sidebar và trigger đọc context thứ hai; phát hiện khi lập Plan B, từ M8 của Plan A); `app-shell/app-shell-context.ts` còn `AppShellSidebarContext` (boolean, `true` trong thân của `AppShellSidebar`: chỗ duy nhất khung vẽ rail; `NavItem` và `NavGroup` chỉ là rail khi nó `true`, AppShell `collapsible`, `collapsed` và `isWide`; phát hiện khi lập Plan B); `app-shell/use-sheet.ts` (`useSheet`: layout effect của tấm trượt (`inert`, khoá cuộn, focus vào và về), Esc, lớp nền, việc đóng khi cửa sổ rộng ra; `AppShell.tsx` chỉ gọi nó; phát hiện khi review cuối Plan A); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `nav/nav-rail.tsx` (những phần chỉ rail có: `useRailState`, `RailTooltip`, chữ cái đầu, chấm số đếm, và `useFlyout`, toàn bộ logic flyout của `NavGroup`; `Nav.tsx` chỉ còn dựng danh sách và các mục; phát hiện khi review cuối Plan B); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).

**Thay đổi ở primitive và component có sẵn:**

- **Tooltip** (Plan B): tuỳ chọn nội bộ `describe` (mặc định `true`) trên context của `Tooltip`, không có trong type công khai và không export từ `src/index.ts`: nó là prop của `TooltipRoot` (export từ `tooltip/Tooltip.tsx`, không từ `tooltip/index.ts`), còn `Tooltip` công khai chỉ chuyển các prop công khai xuống nó (phát hiện khi lập Plan B). `false` thì `TooltipTrigger` không nối `aria-describedby`. Dùng khi chữ của tooltip đúng bằng tên của trigger (mục rail, nút thu gọn của SearchField) hoặc đã được nói theo cách khác (ThemeSwitch, §6.3), để screen reader không đọc hai lần. Tuỳ chọn nội bộ thứ hai, `enabled` (mặc định `true`), cùng chỗ: `false` thì không bộ hẹn giờ hover hay focus nào chạy, không tooltip nào khác bị đóng, tooltip này ở yên đóng, và nếu đang mở thì đóng lại (để nó không tự mở khi được bật lại: không gì báo cho nó rằng con trỏ hay focus đã rời trigger). Mục rail và nút nhóm dùng nó thay cho một trạng thái `open` controlled giữ ở ngoài: ở dạng mở rộng, và khi flyout của nhóm đang mở, `RailTooltip` truyền `enabled={false}`; trước đó TooltipRoot vẫn chạy bộ hẹn giờ rồi `show()`, đóng tooltip khác (như tooltip của một nút trên header) dù chính nó bị giữ đóng (phát hiện khi review PR #38).
- **List** (Plan C): prop `surface` (§4.3).
- **Icon** (A, C): §4.6.

**Primitives của giai đoạn 1–4 được dùng lại:** `useControllableState` (`collapsed`, `open`, `NavGroup open`, giá trị của SearchField); `lockScroll`; `getTopModal` (Esc của tấm trượt); `isCoveredByModal` (phím tắt của SearchField, chuyển từ `Tooltip` sang `modal-stack.ts`; phát hiện khi review cuối Plan C); `focusFirst`, `getFocusables`; `usePopover`, `useFloating` (flyout); `keyedChildren` (§5), `partOf`, `markPart` (`Nav`, `NavGroup`: cả hai đọc children một lần thành danh sách, dùng cho cả lần kiểm tra lẫn lần render; phát hiện khi review PR #38); `Slot` (`NavItem asChild`, `AppShellBrand asChild`); `useFieldProps`, `markAsFieldControl`, `useFormReset` (SearchField); `useIsoLayoutEffect`, `mergeRefs`, `composeEventHandlers`, `dataAttr`, `withDefaults`, `devWarn`, `hasModifier`.

**Cảnh báo dev mới** (lời cảnh báo không chứa giá trị, để `devWarn` gộp được các lần lặp):

- AppShell:
  - Không có `AppShellMain` sau khi mount: "<AppShell> has no <AppShellMain>: the skip link has nowhere to go."
  - Hơn một phần cùng loại (`AppShellHeader`, `AppShellSidebar`, `AppShellMain`, `AppShellFooter`).
  - Một phần render ngoài `AppShell`: "<AppShellSidebar> must be rendered inside <AppShell>." (mỗi phần một lời).
  - Một phần không phải con trực tiếp trong DOM của `AppShell` (kiểm `parentElement`): "… must be a direct child of <AppShell>: a component around it is fine, an element around it is not."
  - Có sidebar mà không có trigger nào được mount: "<AppShell> has a sidebar but no <AppShellSidebarTrigger>: on narrow screens the navigation cannot be opened."
  - Tấm mở mà có `.flg-toaster` nằm trong một phần bị `inert`: "<Toaster> is inside a part of <AppShell> that goes inert while the navigation is open, so its toasts cannot be reached. Render it outside <AppShell> or as its direct child."
  - `collapsed` hay `defaultCollapsed` khi `collapsible={false}` (bị bỏ qua).
- Nav:
  - `NavItem` hay `NavGroup` render ngoài một danh sách của Nav: "<NavItem> must be rendered inside <Nav>, <NavSection> or <NavGroup>."
  - `NavSection` không phải con trực tiếp của `Nav`.
  - `NavGroup` trong `NavGroup`: "<NavGroup> inside <NavGroup> is not supported: navigation has at most two levels."
  - Mục cấp 1 (`NavItem` không nằm trong nhóm, hoặc `NavGroup`) không có `icon` trong một AppShell thu gọn được: "<NavItem> at the top level needs an icon when the sidebar can collapse to a rail; the rail shows the first letter of its label instead." `NavGroup` có lời riêng, chỉ khác tên phần tử ("<NavGroup> at the top level needs…"); chỉ cảnh báo khi Nav nằm trong sidebar của AppShell đó (phát hiện khi lập Plan B).
- Indicator: `count` không phải số nguyên không âm hữu hạn (`NaN`, âm: không hiện; số lẻ: làm tròn xuống); `max` không phải số nguyên dương (lib dùng 99).
- SearchField: không có tên sau khi mount (không `aria-label`, `aria-labelledby`, cũng không có nhãn `<label>` trỏ vào): "<SearchField> needs a name: a Field label or aria-label. A placeholder is not a name."; `shortcut` không phải `'/'` hay `'mod+k'` (bị bỏ qua).
- UserMenu: `name` rỗng.
- List: `surface={false}` ở variant khác `inset`.
- ThemeSwitch, ThemeMenuGroup, ThemeScript, AppShellBrand: không có cảnh báo mới (giá trị lạ đọc từ `localStorage` bị bỏ qua lặng lẽ: đó là dữ liệu của người dùng cuối, không phải lỗi của lập trình viên).

---

## 6. Component giai đoạn 5

### 6.1 Quy ước API chung (bổ sung cho §6.1 của các spec trước)

- **Prop giao diện:** §3.2. **`size`:** chỉ SearchField (`"sm" | "md" | "lg"`, như `Input`).
- **`ref`** trỏ vào phần tử mang ngữ nghĩa: gốc của `AppShell` và phần tử của từng phần (`<header>`, phần tử sidebar, `<main>`, `<footer>`), nút của `AppShellSidebarTrigger`; `<nav>` của Nav, link (hoặc phần tử `asChild`) của `NavItem`, `<li>` của `NavGroup`, phần tử nhóm của `NavSection`; bọc của Indicator; `<input>` của SearchField; nút của `ThemeSwitch` và `UserMenu`; `<div role="group">` của `ThemeMenuGroup`. `ThemeScript` không có `ref`.
- **`className` và `style`** gắn vào phần tử gốc, trừ: `NavItem` (vào link), `SearchField` (vào gốc `.flg-search-field`, còn mọi prop khác vào `<input>`, như `Input`), `UserMenu` (vào nút; menu nhận `contentProps`).
- **`labels`:** mọi chữ mặc định nằm trong `labels`, ghi đè từng khoá; khoá cần chèn giá trị là hàm.
- **`id` do lib sinh:** `AppShellMain` và `AppShellSidebar` được trỏ tới (skip link, `aria-controls`), nên type bỏ `id` và id lib sinh luôn thắng (spec giai đoạn 2 §6.1).
- **Controlled:** `collapsed`/`defaultCollapsed`/`onCollapsedChange`, `open`/`defaultOpen`/`onOpenChange`, `value`/`defaultValue`/`onValueChange`, như mọi component.
- **Mỗi component export kiểu props của nó** và các kiểu giá trị (`AppShellLayout`, `AppShellBreakpoint`, `NavVariant`, `IndicatorStatus`, `ThemeValue`…).

### 6.2 Phân loại client và server

Như §3.1.

### 6.3 Đặc tả từng component

**`AppShell`**, **`AppShellHeader`**, **`AppShellSidebar`**, **`AppShellMain`**, **`AppShellFooter`**, **`AppShellSidebarTrigger`**

```ts
type AppShellLayout = 'sidebar' | 'header';
type AppShellBreakpoint = 'md' | 'lg' | 'xl';
interface AppShellLabels {
  skipToContent: string; navigation: string; openNavigation: string; closeNavigation: string;
  collapseSidebar: string; expandSidebar: string;
}
type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  layout?: AppShellLayout; breakpoint?: AppShellBreakpoint; brand?: ReactNode;
  collapsible?: boolean; collapsed?: boolean; defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  labels?: Partial<AppShellLabels>;
};
type AppShellHeaderProps = HTMLAttributes<HTMLElement> & { sidebarTrigger?: boolean };
type AppShellSidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>;
type AppShellMainProps = Omit<HTMLAttributes<HTMLElement>, 'id'>;
type AppShellFooterProps = HTMLAttributes<HTMLElement>;
type AppShellSidebarTriggerProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby' | 'children' | 'asChild'>;
// 'asChild' bị bỏ (phát hiện khi review PR #37): với nó Button chuyển props sang icon của chính nó,
// một <svg> không nhận focus và không đăng ký được làm trigger.
```

- **Mặc định:** `layout="sidebar"`, `breakpoint="lg"`, `collapsible=true`, `defaultCollapsed=false`, `defaultOpen=false`, `sidebarTrigger=true`, `labels={ skipToContent: "Skip to content", navigation: "Navigation", openNavigation: "Open navigation", closeNavigation: "Close navigation", collapseSidebar: "Collapse sidebar", expandSidebar: "Expand sidebar" }`. Mọi nhãn của khung nằm trên `AppShell`, một chỗ (Claude chốt).
- **Cấu trúc** (S1, màn hẹp, tấm đang mở):

  ```html
  <div class="flg-app-shell" data-layout="sidebar" data-breakpoint="lg" data-collapsible data-open>
    <a class="flg-app-shell-skip" href="#:r0:" inert>Skip to content</a>
    <header class="flg-surface flg-app-shell-header" inert>
      <button class="flg-button flg-app-shell-trigger" data-variant="ghost" data-size="md" data-icon-only
              aria-label="Open navigation" aria-expanded="true" aria-controls=":r1:">☰</button>
      <span class="flg-app-shell-header-brand">…brand</span>
      …children
    </header>
    <div class="flg-app-shell-sidebar" id=":r1:" role="dialog" aria-label="Navigation">
      <div class="flg-surface flg-app-shell-sidebar-panel">
        <div class="flg-app-shell-sidebar-head">…brand <button … aria-label="Close navigation">×</button></div>
        <div class="flg-app-shell-sidebar-body">…children (Nav)</div>
      </div>
    </div>
    <main class="flg-app-shell-main" id=":r0:" tabindex="-1" inert>…</main>
    <footer class="flg-surface flg-app-shell-footer" inert>…</footer>
    <div class="flg-app-shell-scrim" aria-hidden="true"></div>
  </div>
  ```

  - `data-collapsed` khi `collapsed`; `data-open` khi tấm mở (có cả trong HTML từ server khi `defaultOpen`, để story và test dựng được trạng thái mở; hành vi modal chỉ gắn sau khi mount).
  - `data-rail` chỉ khi rail đang có hiệu lực: `collapsible && collapsed && isWide`, nên chỉ có sau khi hydrate (server không biết chiều rộng). `data-collapsed` là trạng thái, vẫn còn ở màn hẹp, nơi tấm trượt là nav mở rộng; một quy tắc `[data-collapsed] .nhãn { display: none }` của người dùng sẽ làm tấm trên điện thoại chỉ còn icon nếu không lặp lại media query của điểm gãy. Rail của chính lib vẫn vẽ từ `[data-collapsed]` trong các khối `@media` được sinh, nên HTML từ server đúng; `data-rail` là cho nội dung người dùng vẽ trong sidebar, vốn không biết điểm gãy, và docs bảo vẽ rail của họ từ nó (phát hiện khi review PR #37).
  - `inert`, `role`, `aria-label` của sidebar chỉ có khi tấm mở ở màn hẹp (§3.4).
  - `data-layout`, `data-breakpoint`, `data-collapsible`, `data-collapsed`, `data-rail`, `data-open` đứng sau các prop của người dùng trên gốc, nên luôn là của lib: CSS vẽ theo chúng, và một `data-*` do component bọc chuyển xuống không được làm CSS vẽ một trạng thái khác trạng thái lib giữ (phát hiện khi review cuối Plan A).
- **Landmark:** `<header>` là banner, `<main>` là main, `<footer>` là contentinfo (gốc là `<div>`, không phải nội dung phân đoạn). Sidebar là `<div>`, không tự làm landmark; `Nav` bên trong là `<nav>`.
- **Skip link** là con đầu tiên của gốc, trỏ vào id của `AppShellMain` (lib sinh bằng `useId`); main có `tabIndex={-1}` nên nhận focus khi trình duyệt đi tới đoạn đó. Sau khi hydrate, `onClick` của link gọi `preventDefault()` rồi tự làm việc trình duyệt làm với đoạn đó: `main.scrollIntoView()` (theo `scroll-padding-top` của trang, main nằm ngay dưới header) rồi `main.focus({ preventScroll: true })`, nên `location.hash` không đổi: với router dùng hash (`HashRouter`, Electron, trang tĩnh), đoạn `#:r1:` sẽ bị đọc là một trang (trang không khớp, một mục rác cho Back). `href` giữ nguyên để link vẫn chạy trước khi hydrate. Chỉ `focus({ preventScroll: false })` thì không đủ: trình duyệt chỉ cuộn phần tử nằm ngoài tầm nhìn, còn main hiếm khi vậy, chỉ phần đầu của nó (đo ở cả ba engine: trang cuộn 900px thì đầu main vẫn ở −840px) (phát hiện khi review PR #37).
- **Tài liệu:** `AppShell` đo header và ghi `--flg-app-shell-header-offset` lên `<html>`; CSS của lib đặt `scroll-padding-top` của `<html>` và bỏ margin của `body` trên trang có khung (§3.3; Claude chốt; phát hiện khi đọc soát spec).
- **`AppShellHeader`:** render (khi `sidebarTrigger`) một `AppShellSidebarTrigger`, rồi ô brand, rồi `children`. Đây là thay đổi so với bản quyết định ban đầu, vốn để người dùng tự đặt trigger (Claude chốt): brand phải đứng ngay sau trigger trong DOM để thứ tự Tab đúng thứ tự nhìn thấy, và chỉ khi lib render cả hai thì điều đó mới chắc chắn. Không có sidebar (nhận ra bằng CSS, §3.3) thì trigger ẩn. `sidebarTrigger={false}` để người dùng tự đặt `AppShellSidebarTrigger` ở chỗ khác.
- **`AppShellSidebarTrigger`:** IconButton `ghost` `md`, icon ☰. Một nút hai việc: màn hẹp mở tấm trượt (tên `labels.openNavigation`, `aria-expanded` theo `open`); màn rộng thu gọn hoặc mở rộng rail (tên `labels.collapseSidebar` khi đang mở rộng, `labels.expandSidebar` khi là rail; `aria-expanded` là `!collapsed`). Không có rail (`collapsible={false}`) thì nút ẩn ở màn rộng. `aria-controls` luôn trỏ vào sidebar (sidebar luôn có trong DOM). Mode chỉ biết sau khi mount (§3.5). Trong lúc tấm mở, header `inert` nên nút không bấm được lần nữa; tên "Close navigation" vì vậy thuộc về nút × trong sidebar. Nút đăng ký vào context để focus trở về được (§3.4).
- **`AppShellSidebar`:** render hàng đầu (brand, nút × theo bố cục, §4.3) và thân chứa `children`. Có thanh cuộn riêng.
- **`AppShellMain`, `AppShellFooter`:** phần tử ngữ nghĩa, không thêm gì.
- **Thu gọn:** `collapsed` có controlled và uncontrolled. Lưu trạng thái là việc của người dùng (`onCollapsedChange`); docs có công thức cookie (§8).
- **Bàn phím:** skip link (Enter tới main); trigger (Enter, Space); khi tấm mở: Tab chỉ đi trong sidebar (phần còn lại của khung `inert`) và những gì nằm ngoài `AppShell` (vùng toast), Esc đóng. Không có phím tắt riêng để thu gọn rail (Claude chốt; ứng dụng tự gắn nếu muốn).
- **Tấm trượt:** §3.4.

**`AppShellBrand`**

```ts
type AppShellBrandProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  logo?: ReactNode; name: ReactNode;
} & (
  | { href?: string; asChild?: false; children?: never }
  | { href?: never; asChild: true; children: ReactNode }   // phần tử con duy nhất (Link của router)
);
```

- Server-safe. `href` → `<a class="flg-app-shell-brand" href>`; không có → `<span>`; `asChild` → phần tử con (vd `Link` của router) nhận lớp và nội dung qua `Slot`, như `Button asChild` (con giữ props của nó; lib đặt logo và tên làm nội dung).
- Cấu trúc: `<span class="flg-app-shell-brand-logo" aria-hidden="true">{logo}</span><span class="flg-app-shell-brand-name">{name}</span>`. Tên là chữ của link; logo trang trí.
- `children` chỉ có khi `asChild` (type bản đầu bỏ `children` mà vẫn cần phần tử con cho `asChild`, (phát hiện khi lập Plan A)); nội dung của phần tử con bị thay bằng logo và tên.
- Truyền vào `AppShell brand`. `brand` là ReactNode bất kỳ cũng được, nhưng khi đó lib không biết phần nào là tên để ẩn ở rail; docs khuyên dùng `AppShellBrand`.

**`Nav`**, **`NavSection`**, **`NavItem`**, **`NavGroup`**

```ts
type NavVariant = 'pill' | 'bar';
type NavProps = HTMLAttributes<HTMLElement> & {
  variant?: NavVariant; labels?: Partial<{ nav: string }>;
};
type NavSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode; bottom?: boolean;
};
type NavItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  icon?: ReactNode; badge?: ReactNode; active?: boolean; disabled?: boolean; asChild?: boolean;
  children: ReactNode;
};
type NavGroupProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title'> & {
  label: ReactNode; icon?: ReactNode;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};
```

- **Mặc định:** `variant="pill"`, `labels={ nav: "Main" }`. `NavGroup`: không truyền `open` lẫn `defaultOpen` thì mở sẵn khi có con `active`.
- **Cấu trúc:**

  ```html
  <nav class="flg-nav" data-variant="pill" aria-label="Main">
    <ul class="flg-nav-list" role="list">                     <!-- các mục đứng ngoài NavSection -->
      <li><a class="flg-nav-item" href="/" aria-current="page">
        <span class="flg-nav-item-icon" aria-hidden="true">…</span>
        <span class="flg-nav-item-label">Overview</span>
      </a></li>
      <li><a class="flg-nav-item" href="/inbox">
        <span class="flg-nav-item-icon" aria-hidden="true">…</span>
        <span class="flg-nav-item-label">Inbox</span>
        <span class="flg-badge flg-nav-item-badge" data-variant="neutral">12</span>   <!-- bar: flg-nav-item-count -->
        <span class="flg-indicator-mark" data-dot data-status="accent" aria-hidden="true"></span>  <!-- chỉ hiện ở rail -->
      </a></li>
    </ul>
    <div class="flg-nav-section" role="group" aria-labelledby=":r2:">
      <div class="flg-nav-section-title" id=":r2:">Projects</div>
      <ul class="flg-nav-list" role="list">
        <li class="flg-nav-group" data-open data-has-active>
          <button type="button" class="flg-nav-item" aria-expanded="true" aria-controls=":r3:">
            <span class="flg-nav-item-icon" aria-hidden="true">…</span>
            <span class="flg-nav-item-label">Design</span>
            <svg class="flg-nav-group-chevron" aria-hidden="true">…</svg>
          </button>
          <div class="flg-nav-sub" id=":r3:">                 <!-- popover="auto" ở rail -->
            <div class="flg-nav-flyout-title" aria-hidden="true">Design</div>   <!-- chỉ hiện trong flyout -->
            <ul class="flg-nav-list" role="list" aria-labelledby="<id của nút>">…</ul>
          </div>
        </li>
      </ul>
    </div>
  </nav>
  ```

  - `Nav` gom các mục đứng liền nhau ngoài `NavSection` vào một `<ul>` (qua `keyedChildren` và `partOf`); `NavSection` là `<div role="group">` có `<ul>` riêng. Phần tử không nhận ra (component bọc của người dùng) được coi là mục và vào `<ul>`. `role="list"` vì Safari bỏ ngữ nghĩa danh sách khi `list-style: none`.
  - Khoá: mỗi con mang khoá là đường đi của nó trong children như được viết (`keyedChildren`, §5: khe rỗng vẫn được đếm), mỗi `<ul>` của một dãy mục mang thứ tự của nó giữa các dãy (không phải giữa các khối). Một con có điều kiện (`{cond && <NavItem/>}`) hay một `NavSection` đến và đi trước một dãy không làm mount lại những gì sau nó: nhóm đang mở vẫn mở, nút vẫn là nút cũ, focus ở yên, như JSX đó trong React thường (phát hiện khi review cuối Plan B).
  - `NavSection` không có `title`: `<div>` không có `role`, chỉ là khoảng cách; trừ khi người gọi đặt tên cho nó (`aria-label`, `aria-labelledby`): khi đó nó cũng là `role="group"`, vì tên trên một phần tử không có role là không được phép và bị công nghệ hỗ trợ bỏ qua (phát hiện khi review PR #38). `bottom`: thêm `data-bottom`, đẩy xuống đáy (§4.3).
- **`NavItem`:**
  - Mặc định `<a href>`; `asChild` cho link của router, như `Button`: phần tử con giữ props của nó, nội dung của nó thành nhãn, lib bọc icon, nhãn, số đếm và chấm quanh nó.
  - `active` → `aria-current="page"`.
  - `disabled`: không `asChild` → `<a role="link" aria-disabled="true">` không có `href` (không đi, không nhận focus), như List; có `asChild` → phần tử con mang `aria-disabled="true"` và `tabIndex={-1}`, lần bấm bị chặn ở pha capture như `Button` (link của router bắt buộc có `href`; Claude chốt).
  - `badge` là số hay chuỗi: lib vẽ theo variant (§4.3), `0` cũng vậy; là element: đặt nguyên vào ô cuối. Ở rail chấm thay số, nhưng `0` không có chấm (§4.3 Rail; phát hiện khi review PR #38). Số đếm là chữ trong link, nên là một phần của tên ("Inbox 12"); docs khuyên chữ rõ hơn khi cần (`badge={<>12<span className="flg-visually-hidden"> unread</span></>}`).
  - Trong tấm trượt: click thường (không Ctrl, Meta, Shift, Alt; chưa `defaultPrevented`; link không có `target` khác `_self` hay `download`, phát hiện khi review PR #38) đóng tấm và trả focus về trigger.
  - Ở rail: tooltip với nhãn (tuỳ chọn nội bộ `describe: false`, vì nhãn đã là tên); chấm số đếm thay số; không có `icon` thì chữ cái đầu của nhãn (khi nhãn là chuỗi; không thì để trống; là điểm mã đầu tiên của nhãn sau khi chuẩn hoá NFC, `Array.from(text.normalize('NFC'))[0]`, như nhau ở server và mọi trình duyệt: "e" viết kèm dấu rời thành một chữ "é", emoji không bị cắt đôi, emoji ghép bằng ZWJ thì lấy phần đầu. Không dùng `Intl.Segmenter`: server có nó mà trình duyệt thiếu (Firefox trước 125) sẽ viết chữ khác nhau và React báo lệch khi hydrate; thay cho thay đổi "một Segmenter cho cả trang" trước đó; phát hiện khi review PR #38). Mục `disabled` không có tooltip: Tooltip đòi trigger nhận được focus bàn phím mà mục tắt thì không, và người không dùng được mục đó không cần nhãn của nó (phát hiện khi lập Plan B). Rail chỉ áp cho Nav nằm trong thân của `AppShellSidebar` của một AppShell `collapsible`: một Nav trong Drawer mở từ main thì không bao giờ là rail, dù AppShell đang thu gọn (context `AppShellSidebarContext`, §5; phát hiện khi lập Plan B). Sau khi mount, phần JS của rail theo DOM như CSS: context của React đi qua portal còn CSS của rail (`.flg-app-shell[data-collapsed] > .flg-app-shell-sidebar .flg-nav`) thì không, nên Nav chỉ là rail khi nó cũng nằm trong `.flg-app-shell > .flg-app-shell-sidebar` trong DOM (`useInSidebarDom` của `nav-rail.tsx`, đo một lần sau khi mount; DOM nói Nav ở đâu, context nói sidebar đó có đang là rail không). Một Nav mà portal đưa ra khỏi sidebar (dialog của thư viện khác mở từ rail) không có tooltip và flyout của rail, nhóm mở tại chỗ, như CSS vẽ nó ở dạng mở rộng. Lần render ở server và lần render đầu ở client vẫn theo context. Trường hợp không phải portal (Nav trong một popover, dialog hay drawer nằm trong sidebar trong DOM) giữ nguyên (phát hiện khi review PR #38). Chữ cái đầu và chấm có trong HTML từ server (CSS hiện chúng ở rail); tooltip và flyout chỉ có sau khi hydrate.
- **`NavGroup`:**
  - Nút có icon, nhãn, chevron; `aria-expanded`, `aria-controls` trỏ vào `.flg-nav-sub`. Danh sách con được gọi tên bằng nút (`aria-labelledby`). Ở rail, nút nhóm cũng có tooltip với nhãn, như mục.
  - Mở sẵn: đọc props `active` của các `NavItem` con trực tiếp (qua Fragment, mảng và iterable, kể cả tham chiếu lazy của RSC). Children được đọc một lần (`keyedChildren`, ghi nhớ theo `children`) thành một danh sách dùng cho cả lần kiểm tra lẫn lần render, nên một iterator chỉ duyệt được một lần (generator, iterator helper như `pages.values().map(…)`) vẫn cho đủ link, cả khi nhóm render lại lúc mở và đóng; `Nav` cũng vậy (StrictMode render hai lần). Bản development của React 18 tự duyệt một iterator là con JSX để kiểm khoá, nên ở đó iterator đã cạn trước khi tới nhóm: đó là giới hạn của React 18 (phát hiện khi review PR #38). Con bọc trong component của người dùng thì không nhận ra: docs nói truyền `defaultOpen` khi đó. `data-has-active` cũng tính như vậy.
  - Đóng: danh sách con có `hidden`.
  - **Ở rail:** bấm nút mở **flyout**: chính `.flg-nav-sub` nhận `popover="auto"` (chỉ sau khi mount và chỉ ở rail; ở dạng mở rộng không có thuộc tính này), hiện bằng `usePopover` và đặt chỗ bằng `useFloating` (§4.3). `aria-expanded` của nút và `hidden` của danh sách con khi đó theo flyout, không theo trạng thái mở của nhóm (trạng thái đó được giữ nguyên cho lúc sidebar mở rộng lại). Focus ở yên trên nút khi mở (mẫu disclosure; Tab đi tiếp vào các link vì flyout nằm ngay sau nút trong DOM; Claude chốt). Esc và bấm ra ngoài đóng (trình duyệt), focus về nút (`restoreFocusTo`). Flyout cũng đóng khi focus rời cả nút lẫn flyout, và khi một link trong nó được bấm thường (`isPlainClick`, §5, như tấm trượt: lần bấm với Ctrl, Cmd, Shift, Alt, trên link có `target` khác `_self` hay `download`, hay đã bị `preventDefault` thì flyout ở lại); lời đóng đi từ handler của chính `NavItem` (qua context của nhóm), mà link của router gọi trước khi tự `preventDefault` để điều hướng, không từ một listener trên danh sách, vì listener đó nghe lần bấm sau router và không phân biệt được với lần bấm mà handler của người dùng giữ lại (phát hiện khi review cuối Plan B). Trạng thái của flyout là nội bộ, không controlled (Claude chốt). Rời rail (mở rộng sidebar, hay màn hẹp) thì flyout đóng và mất `popover`.
  - Nhóm trong nhóm: `devWarn`, vẫn render như mục con.
- **Bàn phím:** Tab qua các link và nút nhóm; Enter theo link; Enter, Space mở hay đóng nhóm (ở rail: flyout). Không có roving hay phím mũi tên: đây là một danh sách link (theo bản quyết định).
- **Ngoài AppShell:** Nav dùng được độc lập (trong Drawer, trong một Card): không có rail, không có tấm trượt để đóng.

**`Indicator`**

```ts
type IndicatorStatus = 'accent' | 'danger' | 'success' | 'warning';
type IndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  count?: number; max?: number; dot?: boolean; showZero?: boolean; show?: boolean;
  status?: IndicatorStatus; children: ReactNode;
};
```

- **Mặc định:** `max=99`, `dot=false`, `showZero=false`, `show=true`, `status="accent"` (có chủ ý: Indicator là phần chung và mockup Nav vẽ chấm số đếm màu nhấn; công thức chuông truyền `'danger'`; §3.2; Claude chốt; phát hiện khi đọc soát spec).
- **Cấu trúc:** `<span class="flg-indicator">{children}<span class="flg-indicator-mark" data-status="danger" aria-hidden="true">3</span></span>`; chấm: `data-dot`, không có chữ.
- **Hiện gì:** `show={false}` → không có viên, chỉ còn `children` (vỏ `.flg-indicator` vẫn được render, như khi không có gì để hiện: phần tử bên trong giữ chỗ trong cây và giữ focus khi viên hiện rồi mất, và `ref`, `className` vẫn có chỗ gắn; phát hiện khi lập Plan B). `dot` → chấm (bỏ qua `count`). Không thì `count` > 0 (hoặc `count === 0` với `showZero`) → số; `count > max` → `"${max}+"` ("99+"). Chữ số thường, không qua `Intl` (Claude chốt: số đếm nhỏ, giống nhau ở mọi locale được hỗ trợ).
- **Chỉ để nhìn:** viên luôn `aria-hidden`, đặt sau props của người dùng. Con số phải nằm trong tên của nút bên trong (`aria-label="Notifications, 3 unread"`); docs nói rõ, ví dụ làm đúng.

**`SearchField`**

```ts
interface SearchFieldLabels {
  clear: string; open: string; close: string;
  shortcut: (shortcut: '/' | 'mod+k', apple: boolean) => string;
}
type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'value' | 'defaultValue'> & {
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg'; invalid?: boolean;
  shortcut?: '/' | 'mod+k'; collapsible?: boolean;
  labels?: Partial<SearchFieldLabels>;
};
```

- **Mặc định:** `size="md"`, `collapsible=false`, không có `shortcut`, `labels={ clear: "Clear search", open: "Search", close: "Close search", shortcut: (s, apple) => s === '/' ? '/' : apple ? '⌘K' : 'Ctrl K' }`. Tên phím nằm trong `labels` vì bàn phím của vài ngôn ngữ ghi khác ("Strg").
- **Cấu trúc** (H3 đang mở, có chữ):

  ```html
  <div class="flg-search-field" data-collapsible data-open>
    <button class="flg-button" data-variant="ghost" data-icon-only aria-label="Search" hidden>…</button>   <!-- nút thu gọn -->
    <button class="flg-button flg-search-field-back" data-variant="ghost" data-icon-only aria-label="Close search">←</button>  <!-- chỉ dưới 768px trong header -->
    <div class="flg-input" data-size="md">
      <span class="flg-input-adornment">🔍</span>
      <input type="search" name="q" aria-label="Search docs" aria-keyshortcuts="Meta+K" />
      <span class="flg-input-adornment">
        <button type="button" class="flg-search-field-clear" aria-label="Clear search">×</button>
        <!-- hoặc khi rỗng: <kbd class="flg-search-field-kbd" aria-hidden="true">⌘K</kbd> -->
      </span>
    </div>
  </div>
  ```

- **Control của form như `Input`:** `name` nằm trên `<input>` gốc nên `FormData` và validation gốc chạy như ô thường; `form` chuyền xuống `<input>`; `markAsFieldControl` để `Field` gắn nhãn, mô tả, lỗi; `value`/`defaultValue`/`onValueChange` (`onChange` gốc trước, theo spec 0+1 §6.1); reset form trả về `defaultValue` (`useFormReset` cập nhật việc hiện nút xoá). Enter gửi form chứa nó (hành vi gốc); docs có công thức `<form role="search">`.
- **Tên:** bắt buộc như `Input`: nhãn của `Field` hoặc `aria-label`/`aria-labelledby`; placeholder không phải tên; thiếu thì `devWarn` (§5).
- **Nút xoá:** hiện khi có chữ; bấm thì xoá, gọi `onValueChange('')`, focus lại ô. Nằm trong thứ tự Tab (Claude chốt: Esc cũng xoá, nhưng người dùng bàn phím không phải ai cũng biết).
- **Esc trong ô:** có chữ thì xoá như nút xoá (`preventDefault`, nên một Dialog chứa ô không đóng theo); rỗng thì không làm gì và để Esc đi tiếp (H3: đóng ô, §bên dưới). Ô `disabled` hay `readOnly` không bị Esc xoá chữ: Esc với nó như với ô rỗng (H3 vẫn đóng, giữ chữ) (phát hiện khi review cuối Plan C). Lib tự làm việc này thay cho trình duyệt, vì không phải trình duyệt nào cũng xoá ô search khi bấm Esc, và để Esc có cùng nghĩa ở mọi nơi.
- **Phím tắt** (`shortcut`): listener `keydown` trên `document`. `'/'`: `event.key === '/'` không kèm Ctrl, Meta, Alt (`hasModifier`; Shift được, vì vài bàn phím gõ "/" bằng Shift). `'mod+k'`: `K` với Meta trên nền tảng Apple, với Ctrl ở nơi khác (đúng một phím bổ trợ của nền tảng; Claude chốt). Bỏ qua khi đích của sự kiện là chỗ gõ chữ (`isEditable`, kể cả chính ô này) hoặc sự kiện đã `defaultPrevented`. Ô mà người dùng không tới được cũng không nhận phím: gốc của ô nằm trong một phần tử `inert` (header khi tấm trượt của AppShell mở) hay dưới một modal của lib (`isCoveredByModal`, chuyển từ `Tooltip` sang `modal-stack.ts`); khi đó phím không bị `preventDefault` và ô H3 không mở (phát hiện khi review cuối Plan C). Khớp thì `preventDefault` (không gõ "/" vào ô, không mở tìm nhanh của Firefox), focus ô và chọn hết chữ trong đó; H3 thì mở ô trước. `aria-keyshortcuts` trên `<input>` (và trên nút thu gọn): `"/"`, `"Meta+K"` hay `"Control+K"` (sau khi mount, §3.5). Hai SearchField cùng một phím tắt: ô được mount sau cùng nhận phím (Claude chốt).
- **H3 (`collapsible`):** lúc nghỉ là nút (tooltip là tên cộng phím, tuỳ chọn `describe: false` vì nút đã có tên và `aria-keyshortcuts`). Bấm nút hay phím tắt: mở và focus ô. Tự đóng khi ô rỗng và focus rời gốc, hoặc khi bấm Esc lúc ô rỗng (focus về nút). Có chữ thì không tự đóng. Nút ← (dưới 768px trong header) đóng ô mà giữ chữ, focus về nút (Claude chốt: chữ là giá trị của người dùng; mở lại thì chữ vẫn đó). Trạng thái mở là nội bộ, không controlled (Claude chốt).

**`ThemeSwitch`**, **`ThemeMenuGroup`**, **`ThemeScript`**

```ts
type ThemeValue = 'light' | 'dark' | 'system';
interface ThemeSwitchLabels {
  light: string; dark: string; system: string;
  trigger: (current: string) => string;
  tooltip: (current: string, next: string) => string;
  hint: (next: string) => string;
}
type ThemeSwitchProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby' | 'children' | 'value' | 'defaultValue' | 'asChild'> & {
  value?: ThemeValue; defaultValue?: ThemeValue; onValueChange?: (value: ThemeValue) => void;
  storageKey?: string; labels?: Partial<ThemeSwitchLabels>;
};
type ThemeMenuGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'children'> & {
  value?: ThemeValue; defaultValue?: ThemeValue; onValueChange?: (value: ThemeValue) => void;
  storageKey?: string; labels?: Partial<{ group: string; light: string; dark: string; system: string }>;
};
type ThemeScriptProps = { storageKey?: string; nonce?: string };
```

- **Mặc định:** `defaultValue="system"`, `storageKey="flg-theme"`. `ThemeSwitch labels={ light: "Light", dark: "Dark", system: "System", trigger: (c) => \`Theme: ${c}\`, tooltip: (c, n) => \`Theme: ${c} · click to switch to ${n}\`, hint: (n) => \`Click to switch to ${n}\` }`. `ThemeMenuGroup labels={ group: "Theme", light: "Light", dark: "Dark", system: "System" }`.
- **Không truyền `value`** (tự quản lý, theo bản quyết định): giá trị nằm trong `localStorage[storageKey]` (`'light'`, `'dark'` hay `'system'`; chọn System cũng ghi `'system'`, để tab khác nhận được qua sự kiện `storage`; Claude chốt). Chọn thì ghi và `applyTheme`; chọn lại đúng giá trị đang hiện thì không ghi và không gọi `onValueChange`, nên chọn System khi chưa lưu gì (đang hiện System) không ghi gì, và không cần: khoá vắng mặt được đọc là System ở mọi tab (phát hiện khi review cuối Plan C). Sự kiện `storage` cho đúng khoá từ tab khác thì cập nhật và `applyTheme`; khoá bị xoá hay `localStorage.clear()` (`newValue` là `null`) hay giá trị lạ thì là `'system'`, như `ThemeScript` đọc (phát hiện khi lập Plan C). Lần đầu sau mount: đọc `localStorage` (khác bản quyết định, vốn đọc thuộc tính trên `<html>`: `localStorage` là nguồn sự thật, còn thuộc tính vắng mặt không phân biệt được "System" với "chưa lưu"; Claude chốt); không có giá trị đã lưu (hay không đọc được) thì dùng `data-flg-theme` của `<html>`, vắng thì `defaultValue` (mặc định `'system'`), và kết quả được áp lên `<html>` (phát hiện khi lập Plan C). Nếu giá trị đã lưu khác thuộc tính đang có trên `<html>` (không có `ThemeScript`), lib áp nó ngay khi mount (trang khi đó có nháy một lần; docs nói thêm `ThemeScript`).
- **Có `value`** (controlled): chỉ là UI, gọi `onValueChange`, không chạm `<html>` hay `localStorage`: cho next-themes và ứng dụng tự quản lý theme.
- **`ThemeSwitch` (T1):** một nút đổi vòng light → dark → system → light. Tên `labels.trigger(<chữ của giá trị>)` ("Theme: Light"). Tooltip `labels.tooltip(current, next)`, với tuỳ chọn `describe: false`; nút có `aria-describedby` trỏ vào một `<span hidden>` (id từ `useId`) chứa `labels.hint(next)` ("Click to switch to Dark"), như mô tả ẩn của Progress (spec giai đoạn 4 §6.3), nên screen reader đọc "Theme: Light, button, Click to switch to Dark" mà không lặp tên. Không phải nhóm radio (theo bản quyết định).
  - **Icon trước khi hydrate** (Claude chốt): nút có `data-value` (giá trị đang dùng) và, ở chế độ tự quản lý, `data-pending` từ HTML của server tới effect đầu tiên. Khi còn `data-pending`, CSS chọn icon theo `<html>`: `:root[data-flg-theme='light']` → mặt trời, `'dark'` → trăng, không có thuộc tính → màn hình. Vì `ThemeScript` đã đặt thuộc tính trước khi trang vẽ, icon đúng ngay. Tên của nút đổi sau hydrate (không nhìn thấy).
- **`ThemeMenuGroup` (T3):** `MenuRadioGroup` có `MenuLabel` `labels.group` và ba `MenuRadioItem` (`light`, `dark`, `system`, đúng thứ tự của mockup), mỗi mục có icon ở cuối (`aria-hidden`). Cùng store và cùng logic với `ThemeSwitch`. Đặt bên trong `UserMenu` hay `DropdownMenuContent`; chọn một mục thì menu đóng như mọi mục radio. Đặt ngoài một menu thì các mục menu tự cảnh báo như đã có.
- **`ThemeScript`:** server-safe, render đúng một thẻ:

  ```html
  <script nonce="…">(function(k){try{var v=localStorage.getItem(k),d=document.documentElement;if(v==="light"||v==="dark")d.setAttribute("data-flg-theme",v);else d.removeAttribute("data-flg-theme")}catch(e){}})("flg-theme")</script>
  ```

  - Khoá được chèn bằng `JSON.stringify(storageKey)` rồi thay mọi `<` bằng `\u003c` (bản trước của dòng này viết cả hai vế là `<`; phát hiện khi lập Plan C), để một khoá lạ không đóng được thẻ script. Render bằng `dangerouslySetInnerHTML`, có `suppressHydrationWarning` (trình duyệt xoá giá trị `nonce` khỏi thuộc tính sau khi dùng, nên lúc hydrate React thấy thuộc tính khác; Claude chốt).
  - Đặt trong `<head>` (Next.js App Router: `app/layout.tsx`, trong `<head>` hoặc đầu `<body>`), chạy trước khi trang vẽ, nên không nháy. `<html>` của layout cần `suppressHydrationWarning`, vì script đổi thuộc tính của nó trước khi React hydrate; docs nói rõ.
  - Ứng dụng chỉ render ở client (Vite): React không chạy script do chính nó tạo, nên docs cho đoạn script trên để chép thẳng vào `index.html` (Claude chốt; fixture Vite làm vậy).
  - `'system'` và mọi giá trị khác bỏ thuộc tính: CSS của lib đã theo `prefers-color-scheme` qua `:root:not([data-flg-theme])`.
- **next-themes:** docs: `const { theme, setTheme } = useTheme()` với `attribute="data-flg-theme"`, rồi `<ThemeSwitch value={theme} onValueChange={setTheme} />`.

**`UserMenu`**

```ts
interface UserMenuLabels { trigger: (name: string) => string }
type UserMenuProps = Omit<ButtonProps, 'children' | 'aria-label' | 'aria-labelledby' | 'asChild' | 'id'> & {
  name: string; description?: ReactNode; avatar?: Omit<AvatarProps, 'size'>; showName?: boolean;
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  contentProps?: Omit<DropdownMenuContentProps, 'children'>;
  labels?: Partial<UserMenuLabels>; children: ReactNode;
};
```

- **Mặc định:** `showName=false`, `labels={ trigger: (name) => \`Account: ${name}\` }`. Menu `side="bottom"`, `align="end"`, `sideOffset={17}` (ghi đè qua `contentProps`).
- **Xây trên** `DropdownMenu` (trigger, menu, phím của menu) và `Avatar` có sẵn. Props của nút (`className`, `style`, `disabled`…) vào nút. Nút không nhận `asChild` (nội dung của nó là avatar, tên và chevron, nên một slot làm hỏng nó) và không nhận `id` (menu được gọi tên bằng `id` của nút, do `DropdownMenu` giữ), nên hai prop đó bị `Omit` khỏi kiểu (phát hiện khi lập Plan C). `variant` và `size` của `Button` vẫn qua được, mặc định `ghost` và `md`.
- **Nút:** tên `labels.trigger(name)`; U2 có tên nhìn thấy nằm trong tên đó ("Account: Nguyễn Minh Anh" chứa "Nguyễn Minh Anh"). Avatar trong nút và trong đầu menu là trang trí (`alt=""`, tên đã có).
- **Chữ cái đầu mặc định** khi không có `avatar.src` hay `avatar.fallback`: chữ đầu của từ đầu và từ cuối của `name`, viết hoa ("Ada Lovelace" → "AL"). Tên Việt Nam thường lấy hai từ cuối ("Nguyễn Minh Anh" → "MA" như mockup): truyền `avatar={{ fallback: 'MA' }}`; docs nói rõ (Claude chốt).
- **Đầu menu:** avatar, tên, `description`, đặt trong panel trước `children`, `role="presentation"`, không focus được, không phải mục menu (theo bản quyết định). Menu có `aria-describedby` trỏ vào nó (id từ `useId`, nối với `aria-describedby` của `contentProps` nếu có), nên screen reader đọc tên và dòng phụ khi menu mở (Claude chốt). Sau nó là một `MenuSeparator`.
- **`children`:** các mục menu có sẵn (`MenuItem`, `MenuGroup`, `MenuSeparator`, `MenuRadioGroup`, `ThemeMenuGroup`…).
- **Bàn phím:** của `DropdownMenu`: Enter, Space, ↓ mở ở mục đầu; ↑ mở ở mục cuối; Esc đóng và trả focus về nút.

---

## 7. Kiểm thử

Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn 2–4 §7 giữ nguyên, thêm phần sau.

| # | Lớp | Bổ sung ở giai đoạn 5 |
|---|---|---|
| 1 | Unit (jsdom, React 19 và 18.3) | **AppShell:** skip link trỏ đúng id của main; `aria-controls` của trigger; tên và `aria-expanded` của trigger theo mode (giả lập `matchMedia`) và theo `collapsed`; `collapsed`/`open` controlled và uncontrolled; khi mở ở màn hẹp: `inert` trên skip link, header, main, footer (thuộc tính DOM, cả React 18.3), `role="dialog"` và tên trên sidebar, focus vào phần tử đầu, Esc đóng (và bỏ qua khi đã `defaultPrevented`, khi modal stack không rỗng, khi có popover mở), bấm lớp nền đóng, nút × đóng, focus về trigger; đổi mode khi mở thì gọi `onOpenChange(false)`; `--flg-app-shell-header-offset` được ghi lên `<html>` theo số đo (giả lập `ResizeObserver`), đổi khi header đổi cao, và bị xoá khi unmount; các cảnh báo. **AppShellBrand:** link, `span`, `asChild`. **Nav:** `aria-current`; link tắt; `asChild` gộp props và nội dung; nhóm mở sẵn từ con `active` (kể cả qua Fragment và tham chiếu lazy); `aria-expanded`/`aria-controls`/`hidden`; số đếm theo variant; ở rail: nhãn và số còn trong tên, chấm có mặt, tooltip không nối `aria-describedby`; click trong tấm trượt đóng tấm, click có phím bổ trợ thì không; các cảnh báo. **Indicator:** `count`, `max`, `showZero`, `dot`, `show`; `aria-hidden` không ghi đè được; cảnh báo. **SearchField:** giá trị, nút xoá, Esc, `onValueChange`, `FormData`, reset; phím tắt (cả bỏ qua khi đang gõ ở ô khác, cả `defaultPrevented`); chữ gợi ý và `aria-keyshortcuts` theo nền tảng (giả lập); mở, đóng của H3; cảnh báo thiếu tên. **Theme:** thứ tự đổi vòng; nhãn; đọc, ghi `localStorage`; `data-flg-theme` trên `<html>`; sự kiện `storage`; controlled không chạm `<html>`; giá trị phía server; `localStorage` ném lỗi; `ThemeMenuGroup` và `ThemeSwitch` cùng khoá luôn khớp. **ThemeScript:** chuỗi script đúng từng ký tự, khoá có `</script>` được thoát, `nonce`. **UserMenu:** tên của nút; chữ cái đầu; đầu menu không phải mục và là mô tả của menu; `showName`. **List:** `surface={false}`. **Toaster:** `isEditable` sau khi chuyển chỗ chạy như cũ |
| 2 | Trình duyệt thật (Chromium, Firefox, WebKit) | Header dính và sidebar dính khi cuộn, ở cả S1 và S2; ở S2 footer đẩy sidebar lên ở cuối trang; trang không cuộn ngang ở mọi điểm gãy. Rail: bấm trigger đổi cột. Tấm trượt ở 390px: focus vào trong, Tab không ra khỏi sidebar (trừ ra ngoài `AppShell`), Esc, lớp nền, ×, `NavItem` đóng và trả focus; trang không cuộn khi tấm mở; đổi cỡ lên màn rộng thì đóng; **toast hiện, bấm được khi tấm đang mở** (`Toaster` ngoài `AppShell`). Skip link: Tab đầu tiên hiện nó, Enter đưa focus vào main và main không nằm dưới header. **Focus không bị header che** (Claude chốt; phát hiện khi đọc soát spec): một story `no-visual` (`stage: 'page'`, trang dài) cuộn để một phần tử focus được trong main nằm dưới header, rồi Shift+Tab từ phần tử phía dưới lên nó; sau đó mép trên của phần tử nằm dưới mép dưới của header, ở S1 và S2, màn rộng và màn hẹp; `scroll-padding-top` của `<html>` bằng chiều cao đo được của header, và `body` không có margin. Nav: tooltip ở rail khi hover và focus; flyout mở, Esc đóng và trả focus, bấm ngoài đóng, focus rời thì đóng, link trong flyout đóng nó. SearchField: "/" và ⌘K/Ctrl K focus ô (H3: mở ô), Esc xoá rồi đóng, ô phủ header dưới 768px với nút ←, Enter gửi form. ThemeSwitch: `<html>` đổi thuộc tính, hai trang cùng gốc đồng bộ qua `storage`, icon đúng trước khi hydrate với `ThemeScript`. UserMenu: phím của menu, đầu menu không nhận focus |
| 3 | Accessibility (axe) | Chạy sau play function, ở mọi story. Story của AppShell bật lại các quy tắc trang (`region`, `landmark-one-main`, `landmark-unique`, `bypass`) mà `preview.tsx` tắt cho story component (`region` bỏ hai chỗ (phát hiện khi lập Plan A): skip link, vì trang Storybook có link trước nó nên axe không coi nó là link đầu trang; và hàng đầu của sidebar, nơi S1 màn rộng vẽ brand: sidebar không phải landmark, nên brand ở đó nằm ngoài mọi landmark, còn ở màn hẹp nó nằm trong banner). Đặc biệt: `list` và `listitem` (Nav), `aria-allowed-attr`, `nested-interactive` (nút xoá trong khung ô), `aria-dialog-name` (tấm trượt), `button-name` |
| 4 | Tương phản | Các cặp mới ở §4.4, cả chế độ mặc định lẫn `prefers-contrast: more` |
| 5 | Visual regression | Mỗi phương án đã chọn một story vẽ lại đúng các trạng thái của mockup, ở 4 chế độ × light/dark (danh sách bên dưới) |
| 6 | Screen reader (thủ công) | NVDA và VoiceOver (macOS, iOS): skip link; landmark; tấm trượt được đọc là hộp thoại "Navigation", và **vùng toast vẫn được đọc khi tấm mở** (kiểm lại quyết định không dùng `aria-modal`, §3.4); `aria-current` của mục nav; tên của mục ở rail (nhãn và số), flyout; trigger hai việc; ThemeSwitch (tên và gợi ý), ThemeMenuGroup; đầu menu của UserMenu được đọc khi mở; tên của chuông có số chưa đọc; SearchField: tên, phím tắt, nút xoá |

**Story giao diện** (dựng lại nội dung mẫu của mockup; tiếng Anh như các story trước):

- **Plan A** (`stage: 'page'`): `Sidebar` (S1, 1280×720, sidebar mở rộng, có footer), `SidebarRail` (S1, rail, không footer), `SidebarPhone` (S1, 390×844, đóng), `SidebarPhoneOpen` (S1, tấm mở, mở bằng play function), và bốn story như vậy cho `Header` (S2). Như mockup S, sidebar chứa một nav trung tính dựng bằng CSS riêng của story (trang S vẽ như vậy), header chứa các IconButton trơn: các story này kiểm khung, không kiểm Nav. Story điện thoại gắn tag `viewport-390x844`.
- **Plan B:** `Pill`, `Bar` (Nav mở rộng trong một tấm kính 264px như cột trái của mockup N: mục đang chọn, số đếm, focus bàn phím trên một mục, tiêu đề mục, nhóm mở có con đang chọn, nhóm đóng, mục tắt, mục hover, mục ở đáy; để so sánh trên một hình, mục cấp 1 và mục con cùng `active` như mockup); `PillRail`, `BarRail` (AppShell S1 thu gọn, `stage: 'page'`: icon đang chọn, chấm số đếm, tooltip của mục đang hover qua `data-visual-hover="tooltip"`, flyout của nhóm mở bằng play function); `Indicator` (các trạng thái: `danger` và `accent` trên nút chuông, chấm, "99+", bốn `status`).
- **Plan C:** `SearchFieldDefault` (H2: rỗng với ⌘K, focus với chữ và nút xoá; trong các dải header dựng trong story), `SearchFieldDefaultPhone` (H2 trong AppShell, `viewport-360x640`), `SearchFieldCollapsible` (H3: thu gọn với tooltip qua `data-visual-hover="tooltip"`, mở rỗng, mở có chữ), `SearchFieldCollapsiblePhone` (H3 dưới 768px: thu gọn, và mở phủ header, hai story); `ThemeSwitch` (T1: Light, Dark, System bằng `value`, hover có tooltip) và `ThemeSwitchFocus` (focus bàn phím có tooltip: một lúc chỉ một tooltip hiện, nên hover và focus là hai story; phát hiện khi lập Plan C); `ThemeMenuGroup` (T3: menu của UserMenu mở, Light đang chọn, mục Dark đang được trỏ), `ThemeMenuGroupDark` và `ThemeMenuGroupSystem` (menu chỉ có phần Theme với Dark và System đang chọn: một popover mở một lúc, nên mỗi menu một story); `UserMenu`, `UserMenuOpen` (U1: nghỉ, hover, focus, mở) và như vậy cho `showName` (U2); `NotificationsList` (B1: nghỉ, mở, rỗng), `NotificationsTabs` (B3); trang Examples: `AppShellExample` (S1, N1, H2, T1, U1, B1, 1280×720) và `AppShellExamplePhone` (390×844).
- Story nhiều trạng thái của widget đặt mỗi trạng thái trong một dải kính dựng trong story theo dải header của trang mockup (cao 56px, padding `0 10px 0 8px`, khoảng cách 4px), vì nhiều `AppShell` không đặt được trên một trang; story một trạng thái cần đúng ngữ cảnh header (ô phủ của H3) dùng `AppShell` thật.
- Menu, popover, tooltip đang mở nằm trong top layer: các story đó dùng `stage: 'viewport'` hoặc `'page'`.
- Ảnh chuẩn mới: khoảng 30 story giao diện × 8 ảnh, khoảng 240 ảnh (§10).

**Harness visual** (`tests/visual/stories.visual.ts`, `.storybook/`):

- **Tag `viewport-<rộng>x<cao>`** (Plan A): story mang tag này được chụp sau `page.setViewportSize({ width, height })`. Story khác chụp ở 1280×720 như cũ.
- **Stage `'page'`** (Plan A): `.flg-stage[data-stage='page']` không padding, `display: block`, `overflow: clip` (không phải `hidden`: phần tử có `overflow: hidden` là một vùng cuộn, và header dính sẽ dính vào stage thay vì vào tài liệu), cao tối thiểu `100vh`, vẫn vẽ nền mockup.
- **`data-visual-hover="tooltip"`** (Plan B): sau khi rê chuột, harness chờ tới khi có một `[role='tooltip']:popover-open` rồi mới chụp (tooltip mở sau 500ms, và `toHaveScreenshot` có thể chụp hai khung giống nhau trước khi nó mở).

**Kiểm tra bổ sung:**

- **Test kiểu:** `layout`, `variant`, `status`, `breakpoint`, `shortcut` từ chối giá trị lạ; `AppShellMain` và `AppShellSidebar` không nhận `id`; `AppShellSidebarTrigger`, `ThemeSwitch` không nhận `aria-label`; `UserMenu` bắt buộc `name`; `NavGroup` bắt buộc `label`; `ThemeValue` chỉ ba giá trị; `List surface` là boolean.
- **Gói phát hành:** `check:use-client`, `check:dist-css` và `check:rsc` thêm danh sách ở §3.1 (lớp CSS của mọi phần: `flg-app-shell`, `flg-app-shell-header`, `flg-app-shell-sidebar`, `flg-app-shell-sidebar-head`, `flg-app-shell-sidebar-body`, `flg-app-shell-main`, `flg-app-shell-footer`, `flg-app-shell-trigger`, `flg-app-shell-skip`, `flg-app-shell-scrim`, `flg-app-shell-brand`, `flg-nav`, `flg-nav-item`, `flg-nav-group`, `flg-nav-sub`, `flg-nav-section`, `flg-indicator`, `flg-indicator-mark`, `flg-search-field`, `flg-search-field-kbd`, `flg-theme-switch`, `flg-theme-menu-icon`, `flg-user-menu` (lớp của nút; spec từng ghi `flg-user-menu-trigger`, phát hiện khi lập Plan C), `flg-user-menu-header`…), cùng ba khối `@media` của CSS sinh; `size-limit` ghi lại ngưỡng ở mỗi plan.
- **`theme-css.test.ts`** giữ `--flg-indicator-accent` đúng giá trị mockup.
- **Fixtures** (Plan C), mỗi app một trang riêng cho khung (Next.js: route `/shell`; Vite: một entry thứ hai), để trang hiện có không đổi:
  - `next-app`: `app/layout.tsx` có `<ThemeScript />` trong `<head>` và `suppressHydrationWarning` trên `<html>`. Trang `/shell` là Server Component: đọc cookie `flg-sidebar` cho `defaultCollapsed` (qua client component nhỏ ghi cookie, §8), render `AppShell` với brand (`AppShellBrand asChild` quanh `Link`), nav render từ server (mảng dữ liệu → `NavItem asChild` với `Link`, một `NavGroup` có con `active`, số đếm), header có SearchField trong `<form role="search">`, ThemeSwitch, bảng thông báo, UserMenu có `ThemeMenuGroup`; `Toaster` ngoài `AppShell`.
  - `vite-app`: cùng bộ trong client; đoạn script của theme chép vào HTML của entry.
  - Kịch bản kiểm tra: HTML từ server có skip link trỏ vào `<main` có id đó, `aria-current="page"` trên mục đang chọn, nhóm chứa nó đã mở (danh sách con không `hidden`), rail khi cookie là `collapsed` (`data-collapsed` trên gốc); `<html>` có `data-flg-theme="dark"` trước khi hydrate khi `localStorage` đã có `dark` (đặt bằng init script của Playwright); ở 390px bấm trigger mở tấm, Esc đóng, focus về trigger; ở 1280px bấm trigger đổi rail và ghi cookie; "/" focus ô tìm kiếm; ThemeSwitch đổi thuộc tính trên `<html>`; trên `/shell`, `body` có margin 0 và `scroll-padding-top` của `<html>` bằng chiều cao của header (60px ở 1280px, 56px ở 390px), còn trang chính (không có `AppShell`) giữ margin mặc định của `body` và không có `scroll-padding-top` (Claude chốt; phát hiện khi đọc soát spec). Console phải sạch, như các giai đoạn trước (kể cả không có cảnh báo hydrate).

---

## 8. Docs và phát hành

- **Mỗi component mới có một trang MDX,** cùng khuôn với các giai đoạn trước: cách dùng, bảng props, ví dụ, ghi chú accessibility, "nên / không nên". Trang có prop giao diện có một mục **"Looks"** vẽ các giá trị cạnh nhau và nói khi nào dùng cái nào (theo ghi chú trên trang chọn của mockup):
  - `AppShell.mdx` (Plan A; cả các phần, `AppShellBrand`, `AppShellSidebarTrigger`): hai bố cục; điểm gãy; rail và cookie; tấm trượt và chỗ đặt `Toaster`; các phần phải là con trực tiếp trong DOM; RSC (trang server, phần client nhỏ); biến `--flg-app-shell-…`; brand không mang `id`; hai quy tắc lib đặt cho tài liệu trên trang có khung (`scroll-padding-top` theo chiều cao header, `body` không margin), vì sao, và cách ghi đè (Claude chốt; phát hiện khi đọc soát spec). `Indicator.mdx` nói `status` mặc định `'accent'` và vì sao (§3.2).
  - `Nav.mdx` (Plan B): hai variant; `asChild` với `Link` của Next.js; `active` do ứng dụng tính từ đường dẫn hiện tại; `NavGroup` mở sẵn và giới hạn đọc props của con (con bọc trong component riêng thì truyền `defaultOpen`); hai cấp; icon cho mục cấp 1; số đếm trong tên.
  - `Indicator.mdx` (Plan B): số chỉ để nhìn, tên của nút phải có số (ví dụ đúng và sai); bốn `status`; vị trí ghi đè.
  - `SearchField.mdx`, `ThemeSwitch.mdx` (cả `ThemeMenuGroup`, `ThemeScript`, CSP `nonce`, next-themes, SPA), `UserMenu.mdx` (Plan C). `List.mdx` thêm `surface`.
- **Getting started**, mục mới **"App shell"** (Plan C, theo bản quyết định): cấu trúc tối thiểu (`AppShell`, `AppShellHeader`, `AppShellSidebar` + `Nav`, `AppShellMain`, `AppShellFooter` tuỳ chọn); trang Server Component và các phần client (nav render từ server, `asChild` với `Link`); **công thức cookie**:

  ```tsx
  // app/(app)/layout.tsx: Server Component
  const collapsed = (await cookies()).get('flg-sidebar')?.value === 'collapsed';
  return <Shell defaultCollapsed={collapsed}>{children}</Shell>;

  // shell.tsx: 'use client'
  <AppShell
    defaultCollapsed={defaultCollapsed}
    onCollapsedChange={(c) => {
      document.cookie = `flg-sidebar=${c ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
    }}
  >
  ```

  Lib đặt style cho tài liệu, chỉ trên trang có `AppShell` (Claude chốt; phát hiện khi đọc soát spec; §3.3): `scroll-padding-top` của `<html>` bằng chiều cao đo được của header, để focus, `#anchor` và tìm trong trang không rơi vào dưới header; `body` không margin, để khung chạm mép màn hình. Ứng dụng có `scroll-padding-top` hay margin riêng thì quy tắc của nó thắng (CSS của lib nằm trong layer); khi đó ứng dụng tự cộng chiều cao header (`var(--flg-app-shell-header-offset)`). `ThemeScript` trong `<head>` cùng `suppressHydrationWarning` trên `<html>`; next-themes; chữ đặt thẳng trên nền trang dùng `--flg-text`, không dùng `--flg-text-muted` (§4.4); `Toaster` ngoài `AppShell`.
- **Trang "Examples/App shell"** (Plan C): một ứng dụng đủ (sidebar với nav có nhóm và số đếm, header có trigger, tìm kiếm, thông báo, theme, user menu, footer), story toàn trang ở màn rộng và điện thoại; kèm **công thức bảng thông báo** (B1 danh sách kẻ ngăn, B3 có tab) với mã đầy đủ: chuông trong `Indicator`, tên của nút có số chưa đọc, chưa đọc không chỉ bằng màu, trạng thái rỗng, nút "Mark all as read" (focus ở đâu sau khi bấm: ở yên trên nút), `List surface={false}` trong `Popover`.
- **Accessibility:**
  - Bảng §4.9 tự dựng từ `scripts/contrast-exceptions.ts`, nên nó có các dòng 35–36 và nhãn mới của các dòng được mở rộng (§4.4). Plan nào thêm dòng thì sửa cả bảng §4.9 và đoạn sau nó trong spec 0+1, như các giai đoạn trước.
  - Ghi chú: skip link và landmark của AppShell; tấm trượt (hộp thoại, `inert`, không `aria-modal`, toast); tên của mục ở rail; Indicator chỉ để nhìn; phím tắt của SearchField và `aria-keyshortcuts`; ThemeSwitch nói giá trị hiện tại.
- **Phát hành:**
  - Một changeset `minor` cho `0.4.0`: `.changeset/phase-5-app-shell.md`, liệt kê các component cùng các phần của chúng, prop giao diện, hai token mới, prop `surface` của `List`. Không có thay đổi phá vỡ.
  - **Việc của chủ dự án không đổi** (spec 0+1 §8.3): chủ dự án là người publish.

---

## 9. Tiêu chí hoàn thành giai đoạn 5

1. Cả 6 họ component ở §2 qua các lớp 1–5 ở §7, ở mọi giá trị của prop giao diện.
   - Cách đếm: AppShell cùng các phần, `AppShellBrand` và `AppShellSidebarTrigger` là một mục; Nav cùng `NavSection`, `NavItem`, `NavGroup`; Indicator; SearchField; ThemeSwitch cùng `ThemeMenuGroup` và `ThemeScript`; UserMenu.
   - Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục.
2. Toàn bộ kiểm tra bổ sung ở §7 xanh trong CI.
3. Fixture Vite và fixture Next.js chạy đủ kịch bản ở §7 từ tarball.
4. Mọi cặp tương phản mới đã đạt, hoặc đã có trong §4.9 kèm số đo, và các dòng 35–36 đã được chủ dự án duyệt.
5. Trang Examples/App shell, mục "App shell" của Getting started và công thức bảng thông báo có trên docs.
6. Changeset `0.4.0` đã sẵn sàng. Việc publish là quyết định của chủ dự án.

---

## 10. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| `100dvh` trên iOS: chiều cao đổi khi thanh công cụ của Safari hiện hay ẩn, sidebar dính giật theo | Chỉ sidebar ở màn rộng (≥ 768px, iPad) và `min-height` của gốc dùng `dvh`; tấm trượt dùng `top: 0; bottom: 0`, không dùng `dvh`. Lớp 2 chạy trên WebKit; lớp 6 trên iPad thật nếu có. Nếu giật rõ, đổi `max-height` của sidebar sang `100svh` (để một dải trống khi thanh công cụ ẩn) và ghi trong mô tả PR |
| Phần tử dính trong lưới không dính (bị giữ trong ô của nó), hay dính mà không dừng ở footer | Header trải qua mọi hàng của cột mình; tấm kính của sidebar là con của ô lưới, vì phần tử dính bị giữ bởi cha chứ không bởi ô (§3.3). Lớp 2 kiểm cả hai bố cục ở ba engine, có và không có footer, kể cả việc footer đẩy sidebar S2 lên ở cuối trang |
| `inert` và header dính, `backdrop-filter` | `inert` không đổi bố cục; lớp nền phủ lên header. Lớp 2 kiểm không bấm được, không Tab tới header khi tấm mở. `inert` qua thuộc tính DOM vì React 18.3 và 19 khác nhau (§3.4) |
| Không có `aria-modal`: một screen reader có thể vẫn cho duyệt ra ngoài tấm | Phần còn lại thật sự `inert`, nên nó không ở trong cây truy cập. Lớp 6 kiểm cả việc toast được đọc khi tấm mở; nếu một tổ hợp cho duyệt ra ngoài mà toast vẫn được đọc với `aria-modal`, plan đổi lại và ghi trong mô tả PR |
| `Toaster` đặt trong main thì bị `inert` khi tấm mở | Docs, `devWarn` (§5), ví dụ và fixture đặt nó ngoài `AppShell` |
| Ảnh chuẩn visual: hai bố cục × hai cỡ màn × 8 chế độ, cộng Nav, widget, Examples, khoảng 240 ảnh mới (hiện có 948) | Mỗi plan chỉ thêm ảnh của mình; tạo ảnh qua workflow `visual-update.yml`; mô tả PR nêu số ảnh mới theo nhóm. Story của Plan A dùng nav trung tính của story, nên Plan B không phải chụp lại chúng |
| CSS tăng: ba bản quy tắc màn rộng, mọi giá trị của prop giao diện trong `styles.css` | Bản màn rộng sinh từ một nguồn (§3.3), nén gzip gần như không tốn cho phần lặp; phần chung viết một lần. `size-limit` ghi lại ngưỡng theo số đo thật ở mỗi plan (hiện CSS 14052 B, JS 51713 B) |
| Ba tấm kính lớn (header nằm trên nội dung đang cuộn) làm nặng `backdrop-filter` | Đúng mockup. Chế độ `solid` và `prefers-reduced-transparency` đã bỏ blur (spec 0+1 §4.6). Docs nhắc nội dung nặng (video) dưới header |
| Hydrate của ThemeSwitch: icon và tên khác giữa HTML từ server và sau hydrate | Icon chọn bằng CSS theo `<html>` khi còn `data-pending` (§6.3); store có giá trị phía server nên không có cảnh báo hydrate; chỉ tên (không nhìn thấy) đổi sau hydrate. Không có `ThemeScript` thì trang nháy một lần: docs nói thêm nó |
| `ThemeScript` và CSP, cảnh báo hydrate của `<html>` và của `nonce` | Prop `nonce`; `suppressHydrationWarning` trên script; docs đặt `suppressHydrationWarning` trên `<html>`. Fixture Next.js kiểm console sạch |
| `NavGroup` không nhận ra con `active` bọc trong component của người dùng | Docs và cảnh báo trong trang Nav: truyền `defaultOpen`; nhóm vẫn chạy, chỉ đóng sẵn |
| Vị trí của viên số Indicator khác nhau theo `status` (đúng hai mockup B1, B3), người dùng có thể thấy lạ khi đổi `status` | Ghi trong trang Indicator; biến `--flg-indicator-top`/`-right` để chỉnh. Nếu chủ dự án muốn một vị trí chung, chỉ đổi CSS |
| Flyout là `popover` gắn sau khi mount, trên chính danh sách con | Chỉ ở rail, chỉ sau hydrate; rời rail thì bỏ thuộc tính (§6.3). Lớp 2 kiểm đổi qua lại giữa rail và mở rộng khi flyout đang mở |
| Vòng focus của mục N2 sát mép kính bị cắt | Trong AppShell phần bị cắt nằm ngoài màn hình; ở `prefers-contrast: more` và forced colors outline vẽ vào trong (§4.3) |
| `:has()` (lưới khi không có header, sidebar; brand chỉ còn dấu với H2; ô phủ của H3; hai quy tắc của tài liệu) | Có trên mọi trình duyệt của mốc 17.4; HTML từ server không cần JS cho các trạng thái này |
| Lib lần đầu đặt style cho tài liệu (`scroll-padding-top` của `<html>`, margin của `body`) và có thể đụng style của ứng dụng (Claude chốt; phát hiện khi đọc soát spec) | Chỉ trên trang có render `AppShell` (`:root:has(...)`, `body:has(...)`); trong layer `flg.components`, nên quy tắc của ứng dụng thắng; số đo nằm trong một custom property có tên riêng để ứng dụng tự dùng; docs và mô tả PR của Plan A nói rõ. Fixture kiểm trang không có khung không bị đổi (§7) |
| Phím tắt `mod+k` trùng phím của trình duyệt hay của ứng dụng (Firefox: Ctrl K là ô tìm kiếm của trình duyệt) | `preventDefault` khi khớp; bỏ qua khi đang gõ; docs khuyên `'/'` nếu ứng dụng đã dùng ⌘K |
