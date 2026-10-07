# fl-glass-ui — Thiết kế giai đoạn 2 (overlay và điều hướng)

- **Ngày:** 2026-10-05
- **Trạng thái:** Chờ duyệt
- **Phạm vi spec này:** Giai đoạn 2: 11 component overlay và điều hướng, các primitives nội bộ chúng cần, và bản phát hành `0.2.0`.
- **Spec trước:** [`2026-10-01-fl-glass-ui-phase-0-1-design.md`](2026-10-01-fl-glass-ui-phase-0-1-design.md), gọi tắt là "spec 0+1". Mọi quy ước ở đó vẫn áp dụng, trừ chỗ spec này ghi rõ là thay thế.

---

## 1. Bối cảnh và mục tiêu

Giai đoạn 0 và 1 đã merge vào `main` (PR #1–#4). Changeset `0.1.0` đã sẵn sàng, việc publish do chủ dự án quyết định. Giai đoạn 2 thêm các component nổi lên trên trang (overlay) và các component điều hướng.

Các yêu cầu bắt buộc của spec 0+1 §1 giữ nguyên:

- Hành vi accessibility đạt WCAG 2.2 AA.
- Theme mặc định tuân thủ tuyệt đối mockup đã duyệt. Điểm chưa đạt tương phản được công khai ở §4.9 của spec 0+1 và được khắc phục ở `prefers-contrast: more`.
- Chạy được với React Server Components.
- Hành vi tự viết, không dùng thư viện headless.

### Quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Phạm vi | Đủ 11 component: Dialog, Drawer, Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, Toast, Breadcrumb, Pagination. Thêm ContextMenu, menu con, item checkbox/radio trong menu, và Select chọn nhiều |
| Chia việc | 1 spec, 5 plan, mỗi plan một PR (§2) |
| Trình duyệt | Nâng mốc lên **Safari/iOS 17.4** (§3.1). Đây là thay đổi phá vỡ của `0.2.0` |
| Định vị popup | `@floating-ui/dom`, ghim đúng phiên bản, chỉ dùng phần tính vị trí |
| Lớp nổi | Top layer gốc của trình duyệt: `<dialog>.showModal()` và thuộc tính `popover`. Không portal, không thang z-index |
| Select | Listbox tự viết, kèm một `<select>` gốc ẩn để form hoạt động như native |
| Toast | Hàm `toast()` gọi được ở bất kỳ đâu, kèm một `<Toaster />` đặt một lần trong app |
| Giao diện | Theo các mockup đã duyệt ở §4.1 |

---

## 2. Phạm vi và chia plan

| Plan | Nội dung | Phụ thuộc |
|---|---|---|
| **A** | Mốc trình duyệt mới, dependency `@floating-ui/dom`, token scrim. Primitives: `useControllableState`, `useFloating`, `usePopover`, `focus`, `lockScroll`, modal stack. Component: **Dialog, Drawer, Popover, Tooltip** | — |
| **B** | Primitives: `roving.ts` (`getNextIndex`, `focusNext`), `useTypeahead`. Component: các phần `Menu*` dùng chung, **DropdownMenu** (có menu con, item checkbox và radio), **ContextMenu** | A |
| **C** | Primitive: `collectChildren`. Component: **Select** chọn một và chọn nhiều, kèm `<select>` gốc ẩn | A, B |
| **D** | **Tabs, Accordion, Breadcrumb, Pagination** | B, C (`collectChildren`) |
| **E** | **Toast** và `Toaster`, các trang docs chung, fixtures đầy đủ, changeset `0.2.0` | A |

Mỗi plan tự mang đủ phần của mình: stories, test các lớp ở §7, ảnh chuẩn visual, trang MDX của component, danh sách `check:use-client` và `check:dist-css`, và ghi lại ngưỡng `size-limit`. Plan E làm thêm phần docs chung và phát hành.

**Ngoài phạm vi:**

- **Animation khi đóng.** Overlay biến mất ngay khi đóng.
- **Hướng phải sang trái (RTL).**
- **Từ thư viện headless:**
  - Combobox có ô tìm kiếm (giai đoạn 3).
  - Menubar và NavigationMenu.
  - HoverCard.
  - Popover dạng modal.
- **Toast:**
  - Xếp chồng thành tập.
  - Vuốt để đóng.
  - `toast.promise`.
- **Drawer:** kéo để đóng và các điểm dừng (snap points).
- **Select:**
  - Ảo hoá danh sách dài.
  - Nạp item bất đồng bộ.
  - Item do component tự định nghĩa bọc lại (xem §6.3, Select).
- **Tabs:** tuỳ chọn chỉ mount panel khi được chọn.
- **Hệ thống i18n.**

---

## 3. Kiến trúc

### 3.1 Môi trường hỗ trợ (thay §3.4 của spec 0+1)

- **Browserslist** mới:

  ```
  last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions,
  last 2 Safari versions, Safari >= 17.4, iOS >= 17.4
  ```

- **Lý do chọn 17.4:**
  - Popover API và sự kiện `toggle` có từ Safari 17.0.
  - `<details name>` (accordion chỉ mở một mục) có từ Safari 17.2.
  - `::backdrop` kế thừa custom property từ phần tử gốc chỉ từ Safari 17.4. Thiếu nó, lớp phủ không nhận được token của theme.
  - Lúc duyệt thiết kế, mốc chốt là 17.2. Chủ dự án nâng lên 17.4 ngày 2026-10-05, sau khi lập Plan A phát hiện điểm trên.
- **Tính năng dùng theo kiểu nâng cấp dần.** Trình duyệt không hỗ trợ thì chỉ mất hiệu ứng, chức năng vẫn chạy:
  - `@starting-style` cho animation lúc mở (Safari từ 17.5).
  - `::details-content` cùng `interpolate-size` cho animation chiều cao của Accordion (hiện chỉ có Chromium).
- **React 18.3 không xử lý `onToggle` cho phần tử `popover`.** Vì vậy lib luôn gắn sự kiện `toggle` và `cancel` bằng `addEventListener`, không dùng prop của React. Thuộc tính `popover` là chuỗi, nên React 18.3 vẫn chuyển nó xuống DOM bình thường.

### 3.2 Dependency

- **Thêm `@floating-ui/dom`**, ghim đúng một phiên bản (không dùng `^`): bản ổn định mới nhất lúc làm plan A. Plan A xác nhận bản đó định vị đúng phần tử trong top layer trước khi ghim.
- **Chỉ dùng:** `computePosition`, `autoUpdate`, và các middleware `offset`, `flip`, `shift`, `size`, `arrow`. Luôn dùng `strategy: "fixed"`.
- **Quy tắc dependency toàn cục:** từ giai đoạn này là `clsx` và `@floating-ui/dom`, không thêm gì khác.

### 3.3 Lớp nổi gốc

| Component | Cơ chế | Esc | Bấm ra ngoài |
|---|---|---|---|
| Dialog, Drawer | `<dialog>.showModal()` + khoá cuộn trang | sự kiện `cancel` | lib tự xử lý (§3.4) |
| Popover, DropdownMenu, ContextMenu, menu con, listbox của Select | `popover="auto"` | trình duyệt tự đóng | trình duyệt tự đóng (light dismiss) |
| Tooltip | `popover="manual"` | lib tự xử lý | không áp dụng |
| Vùng toast trên trang | `popover="manual"`, hiện ngay khi mount | lib tự xử lý (đóng toast đang focus) | không áp dụng |

- **Đồng bộ state:**
  - Sự kiện `toggle` (popover) và `close` (dialog) luôn được đồng bộ về state qua `onOpenChange`.
  - Khi đóng do trình duyệt (light dismiss, Esc), lib vẫn gọi `onOpenChange(false)`.
  - Ở chế độ controlled, `open` luôn là nguồn sự thật. Trình duyệt không cho huỷ việc đóng popover. Vì vậy, nếu trình duyệt tự đóng mà sau lần render kế tiếp component cha vẫn giữ `open={true}`, lib mở lại.
- **Vị trí trong DOM:** phần nội dung được render ngay sau trigger. Thứ tự Tab vì vậy chạy tự nhiên từ trigger vào nội dung, không cần portal.
  - Nhờ đó, popover lồng nhau (menu con trong menu, Select trong Dialog) có quan hệ cha con theo DOM. Mở popover con không làm popover cha bị light dismiss.
- **Vỏ overlay luôn được render.**
  - Vỏ là phần tử `<dialog>` hoặc phần tử `popover`. Nó luôn được render để HTML từ server có sẵn và ref ổn định.
  - Con của vỏ chỉ được render khi đang mở.
  - Ngoại lệ là `TooltipContent`: con luôn được render, vì nó là nguồn của `aria-describedby`.
  - Ngoại lệ thứ hai là panel của menu (`DropdownMenuContent`, `ContextMenuContent`, `MenuSubContent`): con luôn được render, để `MenuCheckboxItem` và `MenuRadioGroup` uncontrolled giữ giá trị từ lần mở này sang lần mở sau. Popover đóng là `display: none`, nên lúc đó các item nằm ngoài cây truy cập và thứ tự Tab. Hai hệ quả, phát hiện khi lập Plan B: menu con chỉ hiện sau khi menu cha đã hiện (một popover lồng được hiện trước cha sẽ bị cha đóng mất khi cha hiện), và menu con đóng theo khi menu cha đóng.
- **`aria-controls` trên trigger** chỉ có khi đang mở, vì lúc đóng phần tử đích chưa tồn tại.
- **Bỏ style mặc định của trình duyệt.** CSS nền của lib xoá style mặc định cho `[popover]` và `dialog` thuộc lib: `inset`, `margin`, `padding`, `border`, `background`, `color`, `max-width` và `max-height`.

### 3.4 Khung của Dialog và Drawer

```html
<dialog class="flg-dialog" aria-labelledby aria-describedby>   <!-- khung trong suốt, phủ toàn viewport -->
  <div class="flg-surface flg-card flg-dialog-panel">…</div>   <!-- panel kính -->
  <div class="flg-toast-host"></div>                           <!-- đích của vùng toast (§6.3 Toast) -->
</dialog>
```

- **`<dialog>` là khung trong suốt** có kích thước bằng viewport. Panel kính và đích toast là hai phần tử anh em bên trong khung.
- **Khung không có `transform`, `filter`, `backdrop-filter`, `opacity`, `mask` hay `clip-path`.** Nhờ vậy, phần tử `position: fixed` bên trong (vùng toast) vẫn định vị theo viewport. Các thuộc tính này cũng biến khung thành "backdrop root": khi đó kính của panel chỉ làm mờ được khung chứ không thấy trang phía sau. Animation thu phóng và mờ dần đặt trên panel.
- **Khung có `overflow: clip`, không phải `hidden`.** Khung `hidden` vẫn là một vùng cuộn: lúc mở, focus vào phần tử trong panel đang nằm ngoài màn hình (vị trí bắt đầu của animation trượt) làm khung cuộn tới nó, và drawer hiện ra ngay thay vì trượt vào.
- **Bấm ra ngoài** là cả `pointerdown`, `pointerup` lẫn `click` đều có `target` là chính `<dialog>`, tức vùng trống của khung, không phải panel.
  - Cần cả ba sự kiện để việc bôi đen chữ bắt đầu trong panel rồi thả chuột ra ngoài, hay bấm trên khung rồi thả chuột trong panel, không làm đóng dialog. Trình duyệt gửi `click` tới phần tử chứa cả chỗ bấm lẫn chỗ thả, nên riêng `click` không đủ.
  - Lần bấm bắt đầu khi đang có một popover `auto` mở bên trong dialog (menu, listbox của Select) không tính là bấm ra ngoài: lần bấm đó chỉ light-dismiss popover. Popover `manual` (Tooltip) không đóng khi bấm, nên không tính (thêm khi sửa sau review cuối Plan B).
  - Bấm vào vùng toast không tính là bấm ra ngoài.
- **Esc:**
  - Lib gọi `preventDefault()` trên `cancel` rồi gọi `onOpenChange(false)`. Trong chế độ controlled, component cha là bên quyết định.
  - Lib nghe thêm sự kiện `close` để đồng bộ state khi dialog bị đóng không qua lib. Hai trường hợp: form `method="dialog"`, và cơ chế chống lạm dụng của Chromium (Esc lần thứ hai đóng thẳng, không phát `cancel`).
- **Khoá cuộn và modal stack.** Mở thì đăng ký vào cả hai; đóng hoặc unmount thì huỷ đăng ký.
- **Phần còn lại của trang bị `inert`** do `showModal()` tự làm.

### 3.5 Animation

- **Chỉ có animation lúc mở**, viết bằng `@starting-style` và `transition`, dùng `--flg-duration-normal` và `--flg-ease`:

  | Component | Animation lúc mở |
  |---|---|
  | Dialog | Panel mờ dần lên, thu phóng `.96` → `1` |
  | Drawer | Panel trượt vào từ cạnh của nó |
  | Popover, menu, listbox, Tooltip | Mờ dần lên, kèm dịch 4px từ phía trigger |
  | Toast | Trượt vào từ mép màn hình, kèm mờ dần lên |

- **`::backdrop`** mờ dần lên.
- **`prefers-reduced-motion: reduce`:** các token thời lượng về `0ms` (spec 0+1 §4.6), nên mọi animation tự tắt.
- **Animation lúc đóng** nằm ngoài phạm vi (§2).

### 3.6 Client và server

- **Client** (`"use client"`): mọi component mới, trừ nhóm Breadcrumb.
- **Server-safe:** `Breadcrumb`, `BreadcrumbLink`, `BreadcrumbPage`.
- Hàm `toast` nằm trong module client. Docs ghi rõ: chỉ gọi `toast()` từ code chạy trên client.

### 3.7 Cấu trúc file bổ sung

```
src/internal/        use-controllable-state.ts, use-floating.ts, use-popover.ts, focus.ts,
                     lock-scroll.ts, modal-stack.ts, use-iso-layout-effect.ts, react-lazy.ts,
                     roving.ts, use-typeahead.ts, collect-children.ts,
                     use-popover-trigger.ts
src/components/      dialog/, drawer/, popover/, tooltip/, menu/ (phần Menu* dùng chung),
                     dropdown-menu/, context-menu/, select/, tabs/, accordion/,
                     breadcrumb/, pagination/, toast/
src/styles/components/
                     dialog.css (cả Drawer và ::backdrop), popover.css, tooltip.css,
                     floating.css (animation mở dùng chung của mọi thứ nổi cạnh trigger),
                     menu.css (cả listbox của Select), select.css,
                     tabs.css, accordion.css, breadcrumb.css, pagination.css, toast.css
```

---

## 4. Token và giao diện

### 4.1 Mockup đã duyệt

Các file nằm ở `docs/superpowers/specs/mockups/`. Mỗi file trình bày nhiều phương án. Spec này chỉ dùng **phương án đã chọn**, các phương án còn lại chỉ để tham khảo.

| File | Nội dung | Đã chọn |
|---|---|---|
| `phase-2-scrim.html` | Lớp phủ sau Dialog và Drawer | **A**: tối và làm mờ |
| `phase-2-menus.html` | Item đang được trỏ trong menu và Select | **A**: nền nhấn nhạt |
| `phase-2-tooltip-popover.html` | Tooltip, Popover | **T2**: tooltip kính; **P1**: popover có mũi tên |
| `phase-2-multi-select.html` | Ô kích hoạt của Select chọn nhiều | **M1**: thẻ (chip) |
| `phase-2-tabs-accordion.html` | Tabs, Accordion | **Cả T1, T2, T3** (thành prop `variant`); **A1**: một tấm kính có kẻ phân cách |
| `phase-2-toast.html` | Vị trí và cách thể hiện trạng thái | **P3**: giữa phía dưới; **S2**: icon và vạch màu bên trái |
| `phase-2-drawer-breadcrumb-pagination.html` | Drawer, Breadcrumb, Pagination | **Cả D1 và D2** (prop `variant`); **cả B1 và B2** (prop `separator`); **G1**: nền nhấn nhạt |

### 4.2 Token mới

| Token | Light | Dark |
|---|---|---|
| `--flg-scrim` | `rgba(15,20,40,.28)` | `rgba(0,0,0,.45)` |
| `--flg-scrim-blur` | `6px` | `6px` |

**`::backdrop`:**

- Nhận `background: var(--flg-scrim)` và `backdrop-filter: blur(var(--flg-scrim-blur))`. Từ mốc 17.4, mọi trình duyệt được hỗ trợ đều cho `::backdrop` kế thừa custom property, nên không cần giá trị dự phòng.
- Phương án bị loại: sinh thêm token cho selector `X ::backdrop`. Selector con cháu không biết theme nào gần nhất, nên một vùng light lồng trong vùng dark sẽ nhận lớp phủ dark ở mọi trình duyệt (phát hiện khi lập Plan A).

**Ở chế độ `solid` (không có `backdrop-filter`, hoặc bật `reduced-transparency`):**

- `--flg-scrim-blur` về `0px`.
- `--flg-scrim` giữ nguyên.

**Item đang được trỏ của menu và listbox** dùng năm token dẫn xuất. Mặc định chúng trỏ về token của mockup menu A; chế độ `prefers-contrast: more` đổi giá trị (§4.4):

| Token | Mặc định | `prefers-contrast: more` |
|---|---|---|
| `--flg-highlight-bg` | `var(--flg-accent-subtle)` | `#3554d1` (light), `#8ea6ff` (dark) |
| `--flg-highlight-text` | `var(--flg-text)` | `#ffffff` (light), `#0b1020` (dark) |
| `--flg-highlight-danger-bg` | `color-mix(in srgb, var(--flg-danger) 16%, transparent)` | `var(--flg-danger-fill)` |
| `--flg-highlight-danger-text` | `var(--flg-danger)` | `var(--flg-on-danger)` |
| `--flg-highlight-icon` | `var(--flg-text-muted)` | `var(--flg-highlight-text)` |

Icon, phím tắt và chevron của item đang được trỏ dùng `--flg-highlight-icon`. Ở item `danger`, chúng lấy màu chữ của item.

**Quy tắc hiệu năng (thay §4.5 của spec 0+1).** Chỉ các phần tử sau được dùng `backdrop-filter`:

- `Surface` và `Card`.
- Panel của Dialog và Drawer.
- Nội dung của Popover, menu và listbox.
- Tooltip và Toast.
- `::backdrop`.

Control đặt bên trong các phần tử này vẫn không tự blur.

### 4.3 Kích thước và giao diện từng component

Số liệu lấy từ mockup đã duyệt. Mọi giá trị đều dùng token có sẵn.

**Dialog:**

- Panel là `Surface` + bố cục `Card`, nên `DialogHeader`, `DialogTitle`, `DialogDescription` và `DialogFooter` dùng đúng class của các phần con của Card.
- Chiều rộng theo `size`:

  | `size` | Chiều rộng |
  |---|---|
  | `sm` | 360px |
  | `md` (mặc định) | 480px |
  | `lg` | 640px |

- Chiều rộng tối đa `calc(100vw - 32px)`.
- Chiều cao tối đa `calc(100dvh - 32px)`; vượt quá thì panel cuộn.
- Nằm giữa màn hình.

**Drawer:**

- **Bên trái và bên phải:** rộng 380px, tối đa `calc(100vw - 32px)`, cao hết màn hình.
- **Bên trên và bên dưới:** rộng hết màn hình, cao theo nội dung, tối đa `85dvh`.
- **`variant="flush"`** (mặc định): sát cạnh, chỉ bo góc `--flg-radius-lg` ở phía trong.
- **`variant="floating"`:** cách các mép 10px, bo đủ bốn góc.

**Popover:**

- Padding 12px, bo `--flg-radius-md`.
- Rộng theo nội dung, tối đa `calc(100vw - 32px)`.
- Mũi tên 12px:
  - Vẽ bằng một hình vuông xoay 45°, có viền `--flg-control-border` ở hai cạnh ngoài.
  - Nền kế thừa từ panel, `clip-path` giữ lại một tam giác.
  - Vị trí do middleware `arrow` tính.

**Tooltip:**

- Nền kính: `--flg-glass-tint`, `--flg-glass-filter`, `--flg-glass-shadow`.
- Viền 1px `--flg-control-border`.
- Padding 5px 9px, bo `--flg-radius-xs`.
- Chữ `--flg-text-xs` đậm `--flg-weight-medium`, màu `--flg-text`.
- Rộng tối đa 240px; dài hơn thì xuống dòng.
- Không có mũi tên.

**Menu (DropdownMenu, ContextMenu, menu con) và listbox của Select:**

- **Panel:** `Surface`, padding 4px, bo `--flg-radius-md`, chữ `--flg-text-sm`.
- **Kích thước panel:** menu rộng tối thiểu 180px. Listbox rộng tối thiểu bằng trigger. Cả hai cao tối đa bằng chỗ còn trống (middleware `size`); listbox thêm giới hạn 320px. Vượt quá thì cuộn.
- **Item:**
  - Cao 30px, padding 0 8px, khoảng cách 8px, bo `calc(var(--flg-radius-md) - 4px)`.
  - Cột icon rộng 16px ở đầu, màu `--flg-text-muted`.
  - Item checkbox hiện dấu check trong cột này. Item radio hiện chấm tròn 6px.
  - Mục đã chọn trong Select chọn một hiện dấu check ở cột đầu. Select chọn nhiều dùng ô vuông giống `Checkbox`.
- **Item đang được trỏ:**
  - Nền `--flg-accent-subtle`, chữ giữ `--flg-text`.
  - Item `danger` thì nền `color-mix(in srgb, var(--flg-danger) 16%, transparent)`.
- **Item `danger`:** chữ và icon màu `--flg-danger`.
- **Item disabled:** `opacity: .5`.
- **Nhãn nhóm:** padding 6px 8px 2px, chữ `--flg-text-xs` đậm `--flg-weight-medium`, màu `--flg-text-muted`.
- **Phím tắt và chevron của menu con:** nằm cuối item, chữ `--flg-text-xs`, màu `--flg-text-muted`.
- **Đường phân cách:** cao 1px, margin 4px 6px, màu `--flg-control-border`.

**Select:**

- **Trigger:** dùng lại khung của `Input` (cùng token kích thước, viền và nền, có `size` `sm`/`md`/`lg`) và có chevron 15px ở cuối.
- **Focus giống `Input`** (spec 0+1 §4.7): viền nhấn và ring. Khi đang lỗi, viền giữ màu danger.
- **Select chọn nhiều:**
  - Mỗi lựa chọn là một `Badge` `neutral`.
  - Không đủ chỗ thì phần còn lại gộp thành một `Badge` `accent` "+N".

**Tabs** (chữ `--flg-text-sm` đậm `--flg-weight-medium`, tab chưa chọn màu `--flg-text-muted`, tab đang chọn `--flg-text`, tab disabled `opacity: .45`):

- **`underline`** (mặc định):
  - Cả hàng tab có viền dưới 1px `--flg-control-border`.
  - Tab cao 32px, padding 0 14px.
  - Tab đang chọn có vạch 2px `--flg-accent-gradient`, thụt vào 10px mỗi bên.
- **`segmented`:**
  - Hàng tab là rãnh `--flg-control-track`, padding 3px, bo `--flg-radius-md`, rộng theo nội dung.
  - Tab cao 28px.
  - Tab đang chọn có nền `--flg-control-bg` và bóng `0 1px 3px rgba(0,0,0,.12)`.
- **`pill`:**
  - Tab bo `--flg-radius-full`.
  - Tab đang chọn có nền `--flg-accent-subtle`, chữ `--flg-accent-text`.
- **`orientation="vertical"`** (ngoài mockup, chủ dự án duyệt qua ảnh chuẩn visual):
  - Hàng tab xếp dọc, nằm bên trái panel.
  - Với `underline`, đường kẻ và vạch chuyển sang mép phải của hàng tab.

**Accordion (A1):**

- **Khung:** một `Surface` bo `--flg-radius-lg`, padding 4px 14px. Các mục ngăn bằng đường kẻ 1px `--flg-control-border`.
- **Trigger:** cao 40px, chữ `--flg-text-sm` đậm `--flg-weight-medium`.
- **Chevron:** 16px, màu `--flg-text-muted`, xoay 180° khi mở.
- **Nội dung:** padding dưới 12px, chữ `--flg-text-sm` màu `--flg-text-muted`.

**Breadcrumb:**

- Chữ `--flg-text-sm`.
- Link màu `--flg-text-muted`; khi hover đổi sang `--flg-text` và gạch chân.
- Trang hiện tại màu `--flg-text`, đậm `--flg-weight-medium`.
- Dấu phân cách màu `--flg-text-muted` với `opacity: .7`:
  - `separator="chevron"` (mặc định) là chevron 13px.
  - `separator="slash"` là ký tự `/`.
- Tự xuống dòng khi hết chỗ.

**Pagination (G1):**

- Nút trang 28×28px, padding ngang 6px, bo `--flg-radius-xs`, chữ `--flg-text-sm` đậm `--flg-weight-medium`.
- Trang hiện tại có nền `--flg-accent-subtle`, chữ `--flg-accent-text`.
- Dấu `…` màu `--flg-text-muted`.
- Nút trước và sau là `IconButton` `ghost` `sm`.

**Toast (P3 + S2):**

- **Panel:** `Surface`, bo `--flg-radius-md`, padding 10px 10px 10px 12px.
- **Vạch trạng thái:** 3px ở mép trái.
- **Icon trạng thái:** 17px.
- **Màu của vạch và icon theo trạng thái:**

  | Trạng thái | Màu |
  |---|---|
  | `success` | `--flg-success` |
  | `warning` | `--flg-warning` |
  | `error` | `--flg-danger` |
  | `info` | `--flg-accent-solid` |

- **Chữ:** tiêu đề `--flg-text-sm` đậm `--flg-weight-medium`; mô tả `--flg-text-xs` màu `--flg-text-muted`.
- **Nút hành động:** `Button` `secondary` `sm`.
- **Nút đóng:** icon 14px, màu `--flg-text-muted`.
- **Kích thước:** rộng 360px, tối đa `calc(100vw - 32px)`. Cách mép màn hình 16px; các toast cách nhau 8px.
- **Thứ tự:** toast mới nhất nằm gần mép nhất.

### 4.4 Tương phản (bổ sung cho §4.9 của spec 0+1)

**Mở rộng điểm 7 của §4.9** thành "chữ `--flg-accent-text` trên nền `--flg-accent-subtle`". Các vị trí dùng cặp này:

- `Badge` `accent`, kể cả thẻ "+N" của Select.
- Tab `pill` đang chọn.
- Trang hiện tại của Pagination.

Vì cùng một cặp màu, số đo không đổi so với Badge: 3.40:1 light (trên lớp phủ, xem bên dưới) và 3.76:1 dark. `scripts/contrast-exceptions.ts` được sửa nhãn cho điểm này.

**`scripts/check-contrast.ts` đo thêm:**

- **Panel trên lớp phủ.** Mọi cặp trên panel của Dialog và Drawer, đo trên nền tham chiếu đã phủ `--flg-scrim`. Cụ thể, mọi check bề mặt chạy cả trên kính thường lẫn trên panel phủ lớp tối, và lấy số thấp hơn. Ở light, cách đo này làm chữ Badge trạng thái tụt xuống 4.37:1. Chủ dự án chọn làm đậm 3% ba màu trạng thái ngoài mockup: `success` `#125c36`→`#115934`, `warning` `#774400`→`#734200`, `danger` `#96232c`→`#92222b` (2026-10-06). §4.9 ghi số mới cho dòng 2 (1.20:1) và dòng 7 (3.40:1).
- **Chữ trên nền kính:**
  - Chữ của item menu đang được trỏ, trên `--flg-accent-subtle`.
  - Chữ của item `danger` đang được trỏ, trên nền danger 16%.
  - Chữ của Tooltip và Toast.
- **Dấu hiệu không phải chữ, ngưỡng 3:1:**
  - Nền item đang được trỏ so với nền panel. Đây là dấu hiệu focus của menu và listbox.
  - Vạch của tab `underline`.
  - Nền tab `segmented` đang chọn so với rãnh.
  - Nền tab `pill` và nền trang hiện tại so với bề mặt.
  - Icon trạng thái của Toast.
- **Chữ tab chưa chọn** (`--flg-text-muted`) trên rãnh `segmented`.

**Cách xử lý kết quả:**

- Cặp nào dưới ngưỡng mà đúng như mockup thì được thêm vào §4.9 thành một dòng mới, kèm số đo (làm tròn xuống).
- Danh sách điểm mới được nêu trong mô tả PR để chủ dự án biết.
- Plan B đo item menu đang được trỏ và thêm ba dòng 8–10 vào §4.9: nền item so với panel (1.15:1 light, 1.18:1 dark), icon và phím tắt `--flg-text-muted` trên nền đó (4.37:1 light, 3.60:1 dark), chữ danger trên nền danger 16% (4.24:1 light; dark đạt). Chữ `--flg-text` trên nền item đạt ở cả hai theme. Cả ba dòng đều đạt ở `prefers-contrast: more`.

**`prefers-contrast: more`.** Mọi cặp mới đều phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, thêm các quy tắc sau (đều ngoài mockup, chỉ có hiệu lực khi người dùng bật tùy chọn này):

- Item đang được trỏ, tab `pill` đang chọn và trang hiện tại dùng nền đặc màu nhấn, kèm chữ tương ứng: `#3554d1` + `#ffffff` (light), `#8ea6ff` + `#0b1020` (dark).
- Tab `segmented` đang chọn có thêm viền 1px `--flg-text`.
- Vạch `underline` dùng màu nhấn đặc.

### 4.5 Forced colors

Mọi component mới có quy tắc riêng trong `preferences.css`:

- Panel overlay, Tooltip và Toast có viền 1px `CanvasText`.
- Item đang được trỏ dùng `Highlight` và `HighlightText`.
- Trạng thái đã chọn (tab, trang hiện tại, option đã chọn) có dấu hiệu không dựa vào màu nền: viền hoặc vạch màu `Highlight`.
- Vạch trạng thái của Toast dùng `CanvasText`.
- Icon dùng `currentColor`.

---

## 5. Primitives nội bộ mới (`src/internal/`)

| File | Export | Nhiệm vụ |
|---|---|---|
| `use-controllable-state.ts` | `useControllableState({ value, defaultValue, onChange })` | Trả `[value, setValue, reset]`. `reset` (thêm ở Plan C) đặt lại giá trị uncontrolled mà không gọi `onChange`, như reset form với control gốc (không có sự kiện `change`); giá trị controlled thì để nguyên. Controlled khi `value !== undefined`. `setValue` gọi `onChange` khi giá trị đổi, và chỉ cập nhật state nội bộ khi uncontrolled. Cảnh báo dev khi một component đổi giữa controlled và uncontrolled |
| `use-popover-trigger.ts` | `usePopoverState({ open, defaultOpen, onOpenChange, name })`, `useTriggerPress(open, toggle)` | Trạng thái mở của một `popover="auto"` có trigger, dùng chung cho Popover, DropdownMenu và Select (tách ở Plan C khi Select thành bản sao thứ ba). `usePopoverState` trả `{ open, request, report, contentRef, pendingToggle }`: `request` ghi `pendingToggle` khi trình duyệt đã tự đóng (light dismiss trước cú click của trigger), và giữ nguyên identity khi mở và đóng. `useTriggerPress` trả `onPointerDown`, `onPointerCancel`, `onClick`: cú click đi theo trạng thái lúc nhấn, click từ bàn phím (`detail` 0) đi theo trạng thái hiện tại |
| `use-floating.ts` | `useFloating({ open, reference, floating, side, align, offset, arrow })`; Plan B thêm `alignOffset` (lệch dọc theo cạnh, cho menu con) và `maxHeight` (middleware `size`, giới hạn thêm ngoài chỗ trống; menu truyền `Infinity`), Plan C thêm `matchWidth` (rộng tối thiểu bằng reference) và `onPlaced` (gọi một lần mỗi lần mở, ngay sau lần đặt vị trí đầu: menu và listbox cuộn item đang focus hoặc được trỏ vào tầm nhìn, vì lúc mở chúng chưa bị giới hạn chiều cao) | Bọc `computePosition` và `autoUpdate` (chỉ chạy khi `open`). Ghi `left`/`top` thẳng vào style, không render lại. Ghi `data-side` và `data-align` để CSS chọn hướng animation. `reference` có thể là phần tử hoặc một điểm toạ độ (ContextMenu) |
| `use-popover.ts` | `usePopover(ref, { open, onOpenChange, restoreFocusTo, onShown, pendingToggle })` | Gọi `showPopover()`/`hidePopover()` theo `open`. Nghe `toggle` để gọi `onOpenChange` khi trình duyệt tự đóng. Khi trình duyệt tự đóng (Esc, light dismiss), focus được trả về `restoreFocusTo` ngay ở `beforetoggle`, lúc popover còn hiện: Safari không focus nút được bấm, nên trình duyệt có thể trả focus về phần tử bao quanh trigger (ví dụ panel của Dialog) mà `toggle` không còn kéo về được (sửa sau review cuối Plan B). Lần nhấn lên chính trigger để đóng nó thì focus quay về trigger khi lần nhấn để focus ở trigger hoặc phần tử bao quanh nó (nếu người dùng đã chuyển focus sang chỗ khác không chứa trigger, focus ở nguyên đó): Safari focus phần tử focus được gần nhất bao quanh nút, ví dụ panel của Dialog (phát hiện khi lập Plan C). Đăng ký `restoreFocusTo` của popover với `registerPopoverReturn` |
| `focus.ts` | `getFocusables(root)`, `focusFirst(root)`, `isFocusable(el)`, `returnFocus(target, container, fallback)`, `registerPopoverReturn(popover, getTarget)` | Tìm các phần tử nhận focus được, theo thứ tự DOM, bỏ qua phần tử bị ẩn, `inert` hoặc `disabled`. `returnFocus` trả focus khi một overlay đóng. Nó focus đích trước; đích không nhận focus vì nằm trong một popover đã đóng thì đi tiếp tới chỗ popover đó trả focus về, theo bảng mà `registerPopoverReturn` ghi. `fallback` cũng đi như vậy |
| `lock-scroll.ts` | `lockScroll(): () => void` | Có đếm số lần khoá. Lần khoá đầu đặt `overflow: hidden` lên `<html>`, kèm `scrollbar-gutter: stable` nếu trang đang có thanh cuộn dọc (để bố cục không bị xô). Lần mở khoá cuối trả lại style cũ |
| `modal-stack.ts` | `registerModal(el, host)`, `subscribeModals(fn)`, `getTopModal()` | Danh sách các `<dialog>` modal của lib đang mở, theo thứ tự. `host` là phần tử `.flg-toast-host` của dialog đó. Toaster dùng danh sách này (§6.3) |
| `roving.ts` | `getNextIndex(items, current, key, { orientation, loop })`, `focusNext(event, items, options)`, `isDisabledItem(el)` | `getNextIndex` là hàm thuần: ra chỉ số kế tiếp cho các phím mũi tên, Home và End, bỏ qua item disabled. `focusNext` xử lý một `keydown`: tìm item kế tiếp, `preventDefault` rồi `.focus()` nó, trả `true` nếu đã xử lý. Menu dùng `focusNext` (mọi item có `tabIndex=-1`). Tabs (Plan D) tự giữ `tabIndex=0` ở tab đang chọn và dùng `getNextIndex`. Hook `useRovingFocus` hai chế độ của bản trao đổi bị bỏ khi lập Plan B: menu chỉ cần một hàm |
| `use-typeahead.ts` | `useTypeahead(getItems, onMatch, getCurrent?)` | `getCurrent` (thêm ở Plan C) là item mà lần gõ bắt đầu từ đó, mặc định là phần tử đang có focus; Select truyền option đang được trỏ, vì focus luôn ở trigger. Gom phím trong 500ms rồi so tiền tố, không phân biệt hoa thường. Gõ lặp một chữ thì nhảy vòng giữa các item cùng chữ đầu. Phím Space nằm giữa một chuỗi đang gõ được tính là ký tự |
| `use-iso-layout-effect.ts` | `useIsoLayoutEffect` | `useLayoutEffect` trên trình duyệt, `useEffect` trên server (React 18 cảnh báo layout effect khi render ở server). Overlay cần layout effect để mở, đo và chuyển focus trước khi trình duyệt vẽ |
| `react-lazy.ts` | `resolveLazy(value)` | Gỡ lazy reference của React. Server Component truyền client component xuống dưới dạng lazy reference; ở development nó còn truyền cả element con dưới dạng đó. `Slot` (giai đoạn 1) và `isFieldGroup`/`isFieldControl` dùng hàm này. Thiếu bước này, `asChild` trong Server Component in cảnh báo và lỗi hydrate ở Next dev (phát hiện khi lập Plan A) |
| `collect-children.ts` | `markPart(component, part)`, `partOf(node)`, `collectChildren(children, { parts, groups, onUnknown })` | Duyệt tĩnh `children` qua Fragment, mảng và các phần nhóm (`groups`) đã khai báo, trả danh sách `{ part, key, props, parts? }`. Nhận ra component qua marker (`markPart`) và gỡ lớp lazy reference của RSC, giống `isFieldControl` ở giai đoạn 1. Con không phải phần đã khai báo (kể cả component tự định nghĩa bọc một phần) đi vào `onUnknown`. Dùng cho Select và Breadcrumb |

**Cảnh báo dev mới:**

- `DialogContent` hoặc `DrawerContent` không có `DialogTitle`/`DrawerTitle`, và cũng không có `aria-label` hay `aria-labelledby`.
- `PopoverContent` thiếu cả `aria-label` lẫn `aria-labelledby`.
- Con của `TooltipTrigger` không nhận focus được.
- Một phần `Menu*` nằm ngoài menu; một `MenuRadioItem` nằm ngoài `MenuRadioGroup`.
- Select:
  - Có con không phải `SelectItem`, `SelectGroup` hay `SelectSeparator`. Con đó bị bỏ qua.
  - Có `SelectItem` với `value` rỗng.
  - Có giá trị không khớp item nào.
- Có hơn một `Toaster` được mount.
- `toast()` được gọi khi không có `window` (trên server). Lời gọi bị bỏ qua.
- Một component đổi giữa controlled và uncontrolled.

---

## 6. Component giai đoạn 2

### 6.1 Quy ước API chung (bổ sung cho §6.1 của spec 0+1)

- **Đóng/mở:** `open`, `defaultOpen`, `onOpenChange(open: boolean)` trên component gốc (`Dialog`, `Drawer`, `Popover`, `Tooltip`, `DropdownMenu`, `MenuSub`). Component gốc không render DOM, trừ `MenuSub`: nó render `<div role="none">` bọc sub-trigger và nội dung menu con (§6.3), và không nhận `ref`.
  - `ContextMenu` chỉ có `onOpenChange`, vì việc mở luôn gắn với một vị trí do người dùng tạo ra (chuột phải, chạm và giữ, phím).
- **Giá trị:** `value`, `defaultValue`, `onValueChange(value)`.
- **Trigger và nút đóng:** `DialogTrigger`, `DialogClose`, `DrawerTrigger`, `DrawerClose`, `PopoverTrigger`, `PopoverClose` và `DropdownMenuTrigger` render `Button` của lib và nhận mọi prop của `Button`, kể cả `asChild`. Giá trị mặc định của `Button` giữ nguyên.
- **`TooltipTrigger`** luôn hoạt động như `asChild`: nhận đúng một element con nhận focus được.
- **Phần nội dung:** `ref` trỏ vào phần tử mang ngữ nghĩa (`<dialog>`, phần tử có `role`). Prop `className` và `style` của `DialogContent` và `DrawerContent` gắn vào panel, vì panel là phần nhìn thấy. Đây là cùng nguyên tắc với `Input` ở giai đoạn 1.
- **Đặt tên:** các phần dùng chung của menu mang tên `Menu*` và dùng được trong cả DropdownMenu lẫn ContextMenu. Export phẳng như giai đoạn 1.
- **Chữ mặc định** bằng tiếng Anh, ghi đè được qua prop.

### 6.2 Phân loại client và server

Như §3.6.

### 6.3 Đặc tả từng component

**`Dialog`**: `{ open?; defaultOpen?; onOpenChange?; children }`

- **`DialogTrigger`:**
  - Bấm thì mở.
  - Mang `aria-haspopup="dialog"`, `aria-expanded`, và `aria-controls` (khi mở).
- **`DialogContent`:**

  ```ts
  HTMLAttributes<HTMLDialogElement> & {
    size?: "sm" | "md" | "lg";
    alert?: boolean;
    closeOnOutsideClick?: boolean;
    initialFocus?: RefObject<HTMLElement | null>;
    onCancel?: ReactEventHandler<HTMLDialogElement>;
  }
  ```

  - Cấu trúc như §3.4.
  - `aria-labelledby` và `aria-describedby` trỏ tới `DialogTitle` và `DialogDescription` nếu có. `aria-*` do người dùng truyền vào được ưu tiên.
  - `closeOnOutsideClick` mặc định `true`.
  - `alert` đặt `role="alertdialog"` và luôn tắt đóng khi bấm ra ngoài. Esc vẫn đóng.
  - `onCancel` của người dùng chạy trước lib. Nếu nó gọi `event.preventDefault()`, Esc không đóng dialog và `onOpenChange` không được gọi.
- **Focus lúc mở:**
  - Vào `initialFocus` nếu có.
  - Nếu không, vào phần tử nhận focus được đầu tiên trong panel.
  - Nếu panel không có phần tử nào nhận focus được, vào chính panel (`tabIndex=-1`).
  - Panel cuộn tới phần tử nhận focus, để nó luôn nhìn thấy được (WCAG 2.4.11).
  - Lý do: React xử lý `autoFocus` bằng cách gọi `.focus()` lúc mount, mà lúc đó dialog chưa hiện, nên không dựa vào được.
- **Focus lúc đóng:** về phần tử đã có focus trước khi mở, nếu phần tử đó còn trong DOM. Trình duyệt cũng tự làm việc này; lib làm lại để ba engine cho cùng kết quả.
  - Nếu trước khi mở không có phần tử nào có focus, focus về `DialogTrigger` (nếu có). Đây là trường hợp của Safari: bấm chuột vào nút không focus nút đó (phát hiện khi lập Plan A).
  - Nếu phần tử đó nằm trong một popover đã đóng, nó không nhận focus được. Trường hợp hay gặp: item của menu đã mở Dialog, vì item vẫn mount khi menu đóng. Khi đó focus đi tới chỗ popover đó trả focus về (trigger của menu; với ContextMenu là phần tử đã có focus trước khi menu mở), lần lượt ra ngoài nếu chỗ đó cũng nằm trong một popover đã đóng (item của menu con, rồi sub-trigger, rồi trigger của menu gốc). Không tìm được chỗ nào thì focus giữ nguyên (phát hiện khi review Plan B).
  - Lib focus phần tử đó trước, và chỉ đi tiếp khi nó không nhận focus; lib không xét `:popover-open`. jsdom không có `:popover-open` (popover nào cũng tính là đã đóng) nhưng vẫn cho focus phần tử bên trong popover, nên test của người dùng thấy focus về đúng phần tử đó, chứ không về trigger của popover bao ngoài (phát hiện khi review lại Plan B).
- **Các phần con:**
  - `DialogTitle`: `<h2>`, nhận `asChild`.
  - `DialogDescription`: `<p>`.
  - `DialogHeader`, `DialogFooter`: `<div>`.
  - `DialogClose`: bấm thì đóng.

**`Drawer`** và các phần `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter`, `DrawerClose`:

- Dùng chung lõi với Dialog. Mọi hành vi giống Dialog.
- Khác ở `DrawerContent`: không có `size`, nhưng có thêm:
  - `side?: "right" | "left" | "top" | "bottom"`, mặc định `"right"`.
  - `variant?: "flush" | "floating"`, mặc định `"flush"`.
- Panel trượt vào từ cạnh `side`.

**`Popover`**: `{ open?; defaultOpen?; onOpenChange?; children }`

- **`PopoverTrigger`:**
  - Mang `aria-haspopup="dialog"`, `aria-expanded`, và `aria-controls` (khi mở).
  - Bấm vào trigger khi popover đang mở thì đóng. Không được đóng rồi mở lại vì light dismiss.
- **`PopoverContent`:**

  ```ts
  HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    sideOffset?: number;
    arrow?: boolean;
  }
  ```

  - Mặc định `side="bottom"`, `align="start"` (như mockup P1), `sideOffset=8`, `arrow=true`.
  - Render `<div popover="auto" role="dialog">`.
  - Middleware: `offset`, `flip`, `shift` (padding 8px), `arrow`.
- **Focus lúc mở:** vào phần tử nhận focus được đầu tiên, nếu không có thì vào chính nội dung.
- **Focus lúc đóng:** về trigger, nhưng chỉ khi focus đang nằm trong popover hoặc ở `body`. Nếu người dùng đã bấm sang một control khác thì lib không giành lại focus. Safari không focus nút được bấm, nên lib nhận ra việc này qua `pointerdown` trên một phần tử nhận focus được nằm ngoài popover và trigger, thay vì qua vị trí của focus.
- **Không phải modal:** Tab ra khỏi nội dung không làm popover đóng.
- **Đóng khi:**
  - Bấm ra ngoài.
  - Bấm Esc.
  - Bấm trigger.
  - Bấm `PopoverClose`.

**`Tooltip`**: `{ open?; defaultOpen?; onOpenChange?; delay?: number; children }`, với `delay` mặc định 500ms.

- **`TooltipTrigger`:** gắn `aria-describedby` vào element con, trỏ tới nội dung.
- **`TooltipContent`:**
  - Nhận `side` (mặc định `"top"`), `align` (mặc định `"center"`) và `sideOffset` (mặc định 6).
  - Render `<div popover="manual" role="tooltip">`.
  - Con luôn được render (§3.3).
- **Mở:**
  - Chuột hoặc bút di vào trigger: mở sau `delay`.
  - Trigger nhận focus mà `:focus-visible` khớp (tức focus bằng bàn phím): mở ngay ở task kế tiếp. Không mở khi focus quay về trigger sau khi Esc đóng một overlay khác.
  - **Bỏ qua chờ:** nếu đang có một tooltip mở, hoặc một tooltip vừa đóng chưa quá 300ms, tooltip kế tiếp mở ngay. Trạng thái này dùng chung cho mọi tooltip.
  - Mỗi lúc chỉ có một tooltip: mở tooltip này thì tooltip kia đóng ngay, trong cùng một lần render.
  - Thao tác chạm (`pointerType === "touch"`) không mở tooltip.
- **Đóng:**
  - Esc.
  - Trigger mất focus.
  - Bấm vào trigger (`pointerdown`). Tooltip không mở lại do hover cho tới khi chuột rời trigger.
  - 100ms sau khi chuột rời cả trigger lẫn nội dung. Khoảng chờ này là vùng đệm: người dùng di chuột từ trigger sang tooltip mà tooltip không đóng (WCAG 1.4.13).
  - Một modal không chứa trigger mở lên trên trigger (kể cả khi chuột không rời trigger). Khi đó Esc thuộc về modal, không thuộc về tooltip.
- **Docs ghi rõ:**
  - Tooltip không được chứa nội dung tương tác.
  - Không gắn tooltip vào nút có `disabled` gốc, vì nút đó không nhận sự kiện. Nên dùng `aria-disabled`.

**Các phần `Menu*` dùng chung** (cho DropdownMenu, ContextMenu, menu con):

- **`MenuItem`:**

  ```ts
  { onSelect?: (event: Event) => void; disabled?: boolean; variant?: "default" | "danger"; textValue?: string; icon?: ReactNode; asChild?: boolean }
  ```

  - Render `role="menuitem"`.
  - `icon` nằm trong cột icon 16px ở đầu item, theo mockup menu A. `MenuSubTrigger` cũng nhận `icon` (thêm khi lập Plan B).
  - Chọn một item thì đóng toàn bộ cây menu và trả focus về trigger. Nếu `onSelect` gọi `event.preventDefault()`, menu giữ nguyên trạng thái mở.
- **`MenuCheckboxItem`:**
  - Nhận `checked`, `defaultChecked`, `onCheckedChange`, cùng các prop của `MenuItem` trừ `variant`.
  - Render `role="menuitemcheckbox"` với `aria-checked`.
  - Đóng menu giống `MenuItem`. `preventDefault` trong `onSelect` giữ menu mở.
- **`MenuRadioGroup` và `MenuRadioItem`:**
  - `MenuRadioGroup` nhận `value`, `defaultValue`, `onValueChange` và render `role="group"`.
  - `MenuRadioItem` nhận `value` và render `role="menuitemradio"` với `aria-checked`.
- **`MenuGroup` và `MenuLabel`:**
  - `MenuGroup` render `role="group"`. Nếu nhóm chứa một `MenuLabel`, nhóm lấy tên qua `aria-labelledby` trỏ tới nhãn đó.
  - `MenuLabel` render `role="presentation"`.
- **`MenuSeparator`:** `role="separator"`.
- **`MenuShortcut`:** `<span>` hiển thị phím tắt ở cuối item.
- **Highlight:**
  - Item đang được trỏ chính là item đang có focus.
  - Di chuột lên một item enabled thì focus chuyển vào item đó (`preventScroll`).
  - Chuột rời panel thì bỏ highlight: focus về chính panel, trừ khi đang mở một menu con.
  - CSS tạo kiểu highlight bằng `:focus`.
- **Bàn phím trong menu:**
  - ↑ và ↓ di chuyển, quay vòng ở hai đầu, bỏ qua item disabled.
  - Home và End nhảy về đầu và cuối.
  - Gõ chữ để nhảy tới item (typeahead theo `textValue`, nếu không có thì theo chữ của item).
  - Enter và Space chọn item.
  - Esc đóng menu đang mở trên cùng và trả focus về trigger của nó.
  - Tab đóng cả cây menu, và focus đi tiếp theo thứ tự tự nhiên.
  - Phím bị giữ chỉ tác dụng một lần: các lần lặp (`event.repeat`) của Enter và Space không chọn item, và các lần lặp của phím mở menu (trên trigger của DropdownMenu, Shift+F10 và phím ContextMenu trên vùng của ContextMenu) không mở lại menu (phát hiện khi review Plan B).
  - Một ô nhập trong menu (`input`, `textarea`, `select`, `contenteditable`, ví dụ ô lọc ở đầu menu) giữ phím gõ chữ, Home, End và ← (trong menu con) cho chính nó; typeahead bỏ qua nó. ↑ và ↓ vẫn chuyển sang các item. ARIA chỉ cho phép item, group và separator bên trong `role="menu"`, nên một ô nhập trong menu không qua được luật `aria-required-children` của axe; khi điều đó quan trọng, đặt ô nhập ra ngoài menu (phát hiện khi review lại Plan B).
- **Menu con:**
  - **`MenuSub`:** nhận `open`, `defaultOpen`, `onOpenChange`. Render `<div role="none">` bọc sub-trigger và nội dung menu con, theo đúng cấu trúc của mẫu APG.
  - **`MenuSubTrigger`:**
    - Render `role="menuitem"` với `aria-haspopup="menu"` và `aria-expanded`.
    - Mở bằng →, Enter hoặc Space, rồi focus vào item đầu của menu con.
    - Rê chuột vào thì mở sau 100ms.
  - **`MenuSubContent`:**
    - Là `popover="auto"` lồng trong popover của menu cha.
    - Mở về phía `right-start`, căn để item đầu thẳng hàng với sub-trigger, tự lật sang trái khi thiếu chỗ.
    - ← hoặc Esc đóng menu con và trả focus về sub-trigger.
  - **Vùng tam giác an toàn:** khi chuột đi từ sub-trigger sang menu con, việc lướt qua item khác trong vùng tam giác nối điểm chuột rời với cạnh gần của menu con không làm đổi focus. Chuột ra khỏi tam giác, hoặc đã quá 300ms kể từ lúc chuột rời sub-trigger, thì hover trở lại bình thường. Khoảng 300ms này cố định, tính từ lúc chuột rời sub-trigger chứ không phải từ lúc chuột dừng (giống Radix).

**`DropdownMenu`**: `{ open?; defaultOpen?; onOpenChange?; children }`

- **`DropdownMenuTrigger`:**
  - Mang `aria-haspopup="menu"`, `aria-expanded`, và `aria-controls` (khi mở).
  - Enter, Space hoặc ↓ thì mở và focus item đầu.
  - ↑ thì mở và focus item cuối.
- **`DropdownMenuContent`:**
  - Nhận `side` (mặc định `"bottom"`), `align` (mặc định `"start"`) và `sideOffset` (mặc định 4).
  - Render `<div popover="auto" role="menu" aria-labelledby={trigger}>`.

**`ContextMenu`**: `{ onOpenChange?; children }`

- **`ContextMenuTrigger`:** một `<div>` (hoặc `asChild`) đánh dấu vùng có menu chuột phải.
- **Mở bằng chuột phải:** sự kiện `contextmenu` bị `preventDefault`, menu mở tại vị trí con trỏ.
  - Nếu nút chuột vẫn đang nhấn khi `contextmenu` tới, menu mở lúc thả nút. Lý do: trình duyệt light-dismiss một popover đã hiện trong lúc con trỏ đang nhấn ngay khi con trỏ được thả, và WebKit với Firefox phát `contextmenu` trước khi thả nút. Chromium trên Windows phát nó sau khi thả, nên menu mở ngay (đo khi lập Plan B, cả ba engine).
  - Bấm chuột phải lần nữa trong vùng khi menu đang mở: menu đóng rồi mở lại tại điểm mới.
- **Mở bằng bàn phím:** Shift+F10 hoặc phím ContextMenu, và menu mở ngay dưới phần tử đang có focus trong vùng (góc dưới bên trái của nó).
  - Lib tự xử lý hai phím này ở `keydown`, vì WebKit và Firefox không biến chúng thành `contextmenu`. Chromium phát `contextmenu` cho phím ContextMenu sau `keyup`, lúc focus đã ở item đầu; panel `preventDefault` sự kiện đó để trình duyệt không hiện menu của nó.
- **Mở bằng chạm và giữ:**
  - Giữ 500ms mà không di quá 10px thì menu mở tại điểm chạm, lúc nhấc tay (cùng lý do light dismiss như chuột phải). Giới hạn 10px vẫn áp dụng sau khi đã đủ 500ms, cho tới lúc nhấc tay hoặc huỷ: ngón tay di quá 10px thì lần chạm không còn là chạm và giữ, và menu không mở.
  - Nếu trình duyệt tự phát `contextmenu` (Android), menu mở theo sự kiện đó và bộ đếm giờ bị huỷ.
  - Nếu trình duyệt huỷ lần chạm (`pointercancel`) sau khi đã đủ 500ms, menu chỉ mở (ngay, vì sẽ không có lần nhấc tay nào để chờ) khi ngón tay vẫn nằm trong giới hạn 10px. Một lần chạm đã đủ 500ms rồi chuyển thành cuộn trang thì di quá 10px trước `pointercancel`, nên menu không mở tại một chỗ đã cuộn đi.
  - Cú `click` đi sau lần nhấc tay đó không tới phần tử dưới ngón tay.
  - Vùng trigger có `-webkit-touch-callout: none` để iOS không hiện menu riêng của nó.
- **Focus:** khi mở, focus vào item đầu. Khi đóng, focus về phần tử đã có focus trước đó, nếu nó còn trong DOM. Với chuột và chạm, đó là phần tử có focus trước lần nhấn (lần nhấn có thể đã đưa focus về `<body>`). Nếu trước đó không có phần tử nào có focus, focus ở yên chỗ trình duyệt để nó.
- **`ContextMenuContent`:** giống `DropdownMenuContent` nhưng không có `side`/`align`. Vị trí tham chiếu là một điểm: menu mở về phía `right-start` của điểm, cách `sideOffset` (mặc định 2), và tự lật khi thiếu chỗ. Nó không có tên từ trigger, nên người dùng nên đặt `aria-label`.
- **Docs ghi rõ:** menu chuột phải không được là cách duy nhất để thực hiện một thao tác.

**`Select`**

```ts
type SelectBaseProps = {
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  size?: "sm" | "md" | "lg";
  autoComplete?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  open?: boolean;              // thêm ở Plan C, như các overlay khác
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
type SelectProps =
  | (SelectBaseProps & { multiple?: false; value?: string | null; defaultValue?: string; onValueChange?: (value: string) => void })
  | (SelectBaseProps & { multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void });
```

- **Cấu trúc:**

  ```html
  <div class="flg-select" data-size data-invalid data-disabled data-multiple>
    <button type="button" role="combobox" class="flg-select-trigger"
            aria-haspopup="listbox" aria-expanded aria-controls aria-activedescendant>…</button>
    <select class="flg-select-native" aria-hidden="true" tabindex="-1" name multiple required disabled>…</select>
    <div popover="auto" role="listbox" class="flg-surface flg-select-listbox" aria-multiselectable>
      <div role="option" id aria-selected aria-disabled data-highlighted>…</div>
    </div>
  </div>
  ```

  - Trigger mang thêm class `flg-input` để dùng lại khung của Input; listbox mang thêm class `flg-menu` để dùng lại panel và item của menu (option có `flg-menu-item`).
  - Đường phân cách là `<div role="none">`, vì listbox chỉ được chứa option và group.
  - `ref` trỏ vào button trigger.
  - `className` và `style` gắn vào phần tử bọc ngoài.
  - Các prop `id` và `aria-*` gắn vào trigger.
  - Listbox có cùng tên accessible với trigger.
- **Phần con:**
  - **`SelectItem`:**
    - Nhận `value` (khác rỗng), `disabled` và `textValue`.
    - `textValue` dùng cho typeahead và cho thẻ của Select chọn nhiều. Nếu không có, lib lấy chữ của children.
  - **`SelectGroup`:**
    - Nhận `label`.
    - Render `role="group"` với `aria-labelledby` trỏ tới nhãn.
  - **`SelectSeparator`.**
- **Danh sách item được đọc tĩnh từ `children`** qua `collectChildren` (§5). Nhờ vậy, HTML render ở server đã có sẵn chữ của lựa chọn trên trigger và đủ các `<option>` của `<select>` gốc.
  - `SelectItem` phải là con trực tiếp, hoặc nằm trong Fragment, mảng hay `SelectGroup`.
  - Component tự định nghĩa bọc ngoài `SelectItem` không được hỗ trợ. Nó bị bỏ qua và lib in cảnh báo dev.
- **Giá trị:**
  - Chọn một: `null` (hoặc không có giá trị) nghĩa là chưa chọn gì; khi đó trigger hiện `placeholder` bằng màu `--flg-text-muted`.
  - Chọn một: trigger hiện children của item đã chọn.
  - Chọn nhiều: trigger hiện thẻ như §4.3.
    - Số thẻ hiển thị được đo bằng `ResizeObserver`.
    - Các thẻ có `aria-hidden`.
    - Trigger chứa thêm một đoạn chữ ẩn (`flg-visually-hidden`) liệt kê đủ các lựa chọn, để screen reader đọc được.
- **Focus và highlight** theo mẫu APG "select-only combobox":
  - Focus DOM luôn nằm trên trigger. Bấm vào trigger thì lib focus nó: Safari không focus nút được bấm, nên nếu không, listbox mở ra mà bàn phím không tới được trigger (phát hiện khi lập Plan C).
  - Option đang được trỏ được báo qua `aria-activedescendant` và có `data-highlighted` (giao diện như item menu đang được trỏ).
  - Di chuột lên option thì option đó được trỏ.
- **Bàn phím khi listbox đang đóng:**
  - Enter, Space hoặc ↓ thì mở và trỏ vào option đã chọn, nếu chưa chọn thì vào option đầu.
  - ↑ thì mở và trỏ vào option đã chọn, nếu chưa chọn thì vào option cuối.
  - Home và End thì mở và trỏ vào option đầu và cuối.
  - Chọn một: gõ chữ thì đổi lựa chọn ngay mà không mở listbox.
- **Bàn phím khi listbox đang mở:**
  - Các phím mũi tên, Home, End và typeahead di chuyển option được trỏ, bỏ qua option disabled, không quay vòng.
  - Chọn một: Enter, Space hoặc Tab chọn option đang được trỏ và đóng listbox (Tab cho focus đi tiếp).
  - Chọn nhiều: Enter hoặc Space bật/tắt option đang được trỏ, listbox vẫn mở. Tab đóng listbox.
  - Esc đóng mà không đổi lựa chọn.
  - Focus rời trigger theo cách khác (code của app, screen reader đi tiếp, chuyển cửa sổ) thì listbox đóng, vì mọi phím của nó nằm trên trigger. Bấm trong listbox không lấy focus của trigger (phát hiện khi review Plan C).
- **Chuột:**
  - Chọn một: bấm vào option thì chọn và đóng.
  - Chọn nhiều: bấm vào option thì bật/tắt, listbox vẫn mở.
- **Listbox:**
  - Middleware: `offset` (6px), `flip`, `size` (rộng tối thiểu bằng trigger, cao tối đa `min(320px, chỗ còn trống)`).
  - Mức 320px cũng nằm trong CSS (`.flg-select-listbox`). `flip` chạy trước `size`, nên nếu không có nó, lần mở đầu tiên đo chiều cao tự nhiên của danh sách dài, lật sang phía có nhiều chỗ hơn, rồi nhảy lại khi đã bị giới hạn (phát hiện khi review Plan C).
  - Mở ra thì cuộn tới option được trỏ.
- **Chiều rộng:** Select rộng bằng phần tử chứa nó, như Input trong Field. Giá trị đã chọn không bao giờ làm đổi chiều rộng (thẻ của Select chọn nhiều cũng vậy); muốn hẹp hơn thì đặt `style` hoặc `className` (phát hiện khi lập Plan C: không có quy tắc này, thẻ làm Select phình ra trong bố cục grid).
- **`<select>` gốc ẩn:**
  - Nằm phủ trùng lên trigger với `position: absolute`, `inset: 0`, `opacity: 0` và `pointer-events: none`.
  - Mang `name`, `multiple`, `required`, `disabled`, `autoComplete`.
  - Có một `<option>` cho mỗi item, mang chữ của `textValue` (hoặc chữ của children). Select chọn một có thêm một `<option value="">` đứng đầu, để `required` hoạt động.
  - Option của một item `disabled` cũng `disabled`, trừ khi item đó đang được chọn. Trình duyệt bỏ option disabled ra khỏi `FormData` dù `required` vẫn tính nó, nên giá trị trigger đang hiện phải được gửi đi (phát hiện khi review Plan C).
  - Luôn được đồng bộ với giá trị hiện tại.
- **Nhờ `<select>` gốc ẩn:**
  - `FormData` có giá trị của Select.
  - Bong bóng validation gốc hiện đúng vị trí trigger. Khi trình duyệt focus vào `<select>` không hợp lệ, lib chuyển focus sang trigger.
  - Autofill của trình duyệt chạy được: sự kiện `change` trên `<select>` được đồng bộ về state và gọi `onValueChange`.
- **Khi form bị reset:**
  - Select uncontrolled trở về `defaultValue`, trừ khi reset bị huỷ bằng `preventDefault()` trong `onReset`. Listener của lib chạy trước `onReset` của React, nên lib chờ một task rồi mới xem reset có bị huỷ không (phát hiện khi review Plan C).
  - Select controlled giữ nguyên, giống input controlled của React.
- **Trong `Field`:**
  - Select mang marker `markAsFieldControl`, nên `<label for>` trỏ vào trigger. Bấm vào nhãn sẽ mở listbox; đây là hành vi của `<label>` trỏ vào một button.
  - Trigger nhận từ `useFieldProps`: `aria-describedby`, `aria-invalid`, `aria-required` và `disabled`.

**`Tabs`**

```ts
{ value?; defaultValue?; onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical"; activationMode?: "automatic" | "manual";
  variant?: "underline" | "segmented" | "pill"; children; className; style }
```

Mặc định `orientation="horizontal"`, `activationMode="automatic"`, `variant="underline"`.

- **Các phần con:**
  - `TabsList`: `role="tablist"`, `aria-orientation`. Người dùng nên đặt `aria-label` cho nó.
  - `TabsTrigger` (nhận `value`, `disabled`): `<button role="tab" aria-selected aria-controls>`. Roving tabindex: chỉ tab đang chọn có `tabIndex=0`. Tab disabled dùng `disabled` gốc và bị bỏ qua khi điều hướng.
  - `TabsContent` (nhận `value`): `role="tabpanel"` với `aria-labelledby` và `tabIndex=0`. Panel không được chọn vẫn được mount nhưng có `hidden`.
- **Bàn phím:**
  - ← và → (ngang) hoặc ↑ và ↓ (dọc) di chuyển, quay vòng ở hai đầu.
  - Home và End nhảy về đầu và cuối.
  - `automatic`: tab nhận focus là tab được chọn.
  - `manual`: phải bấm Enter hoặc Space mới chọn.

**`Accordion`**

```ts
| { type?: "single"; value?: string | null; defaultValue?: string; onValueChange?: (value: string | null) => void }
| { type: "multiple"; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void }
```

Mặc định `type="single"`.

- **Cấu trúc:**
  - Render một `Surface` chứa các `AccordionItem`.
  - `AccordionItem` (nhận `value`, `disabled`) là `<details>`. Ở `single`, mọi item có chung một `name` (sinh bằng `useId`), nên trình duyệt tự đóng item kia khi mở item này.
  - `AccordionTrigger` là `<summary>`, chứa children và chevron (`aria-hidden`).
  - `AccordionContent` là `<div>`.
- **Mở và đóng:**
  - Item đang mở vẫn đóng lại được, kể cả ở `single`.
  - Sự kiện `toggle` của từng `<details>` được đồng bộ về `value`.
  - Ở chế độ controlled, nếu trạng thái DOM khác `value` thì lib đặt lại `open` theo `value`.
- **Item disabled:**
  - `<summary>` có `aria-disabled="true"`.
  - Click (kể cả click do Enter hoặc Space) bị `preventDefault`.
- **Trước khi hydrate** accordion đã chạy được nhờ `<details>`. HTML từ server mang sẵn `open` theo `defaultValue` hoặc `value`.
- **Animation chiều cao** viết bằng `::details-content` và `interpolate-size: allow-keywords`. Trình duyệt không hỗ trợ thì mở ngay, không có animation.
- **Hạn chế, ghi trong docs:** heading đặt trong `<summary>` mất ngữ nghĩa heading, vì `<summary>` được đọc như một nút.

**`Breadcrumb`** (server-safe): `HTMLAttributes<HTMLElement> & { separator?: "chevron" | "slash" }`

- **Cấu trúc:**
  - Render `<nav aria-label="Breadcrumb"><ol>…</ol></nav>`.
  - `aria-label` ghi đè được.
- **Children:**
  - Được duyệt qua `collectChildren`, bỏ qua `null` và `false`.
  - Mỗi con nằm trong một `<li>`.
  - Mỗi `<li>` trừ cái cuối có thêm `<span class="flg-breadcrumb-separator" aria-hidden="true">` chứa dấu phân cách.
- **`BreadcrumbLink`:** `<a>`, nhận `asChild` (ví dụ `Link` của Next.js).
- **`BreadcrumbPage`:** `<span aria-current="page">`.
- **Icon trang chủ** do người dùng tự đặt vào children.

**`Pagination`**

```ts
Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  count: number; page?: number; defaultPage?: number; onPageChange?: (page: number) => void;
  siblingCount?: number; boundaryCount?: number; getHref?: (page: number) => string;
  previousLabel?: string; nextLabel?: string; getPageLabel?: (page: number) => string;
}
```

**Mặc định:**

| Prop | Giá trị |
|---|---|
| `defaultPage` | `1` |
| `siblingCount` | `1` |
| `boundaryCount` | `1` |
| `previousLabel` | `"Previous page"` |
| `nextLabel` | `"Next page"` |
| `getPageLabel` | ``(n) => `Page ${n}` `` |

**Quy tắc:**

- **Kẹp giá trị:** `count` nhỏ hơn 1 được coi là 1. `page` được kẹp vào khoảng `[1, count]`.
- **Cấu trúc:**
  - Render `<nav aria-label="Pagination">` (ghi đè được) chứa nút trước, các nút trang, dấu `…` và nút sau.
  - Trang hiện tại có `aria-current="page"`.
  - Dấu `…` có `aria-hidden`.
- **Dãy trang:**
  - Luôn hiện `boundaryCount` trang ở mỗi đầu, và `siblingCount` trang ở mỗi bên trang hiện tại.
  - Một khoảng trống chỉ thiếu đúng một trang thì hiện số trang đó thay cho `…`.
  - Tổng số ô hiển thị cố định khi `count` đủ lớn. Hàm tính dãy trang là hàm thuần, có test riêng.
- **Hai chế độ:**
  - **Mặc định:** các nút là `<button>`. Nút trước và sau có `disabled` khi ở hai đầu.
  - **Có `getHref`:** các nút là `<a href>` (nút trước và sau dùng `IconButton asChild`).
    - Ở hai đầu, nút trước và sau là `<a aria-disabled="true">` không có `href`.
    - Bấm link vẫn gọi `onPageChange`, và trình duyệt vẫn điều hướng bình thường.

**`toast` và `Toaster`**

```ts
type ToastStatus = "info" | "success" | "warning" | "error";
type ToastOptions = {
  id?: string; title: ReactNode; description?: ReactNode; status?: ToastStatus;
  action?: { label: string; onClick: (event: MouseEvent) => void }; duration?: number;
};
toast(input: ReactNode | ToastOptions): string;      // trả về id
toast.success / toast.error / toast.warning / toast.info(input: ReactNode | Omit<ToastOptions, "status">): string;
toast.dismiss(id?: string): void;                    // không có id thì đóng hết
```

- **Hàm `toast`:**
  - `status` mặc định là `"info"`.
  - Gọi lại với cùng `id` thì cập nhật toast đó và chạy lại thời gian.
  - `duration` là số mili giây. `Infinity` nghĩa là không tự đóng.
  - Toast có `action` mặc định là `Infinity`. Bấm nút hành động thì gọi `onClick` rồi đóng toast.
- **Store:**
  - Dữ liệu nằm trong một store cấp module.
  - Gọi `toast()` trước khi `Toaster` mount thì toast được xếp hàng và hiện khi `Toaster` mount.
  - Trên server, `toast()` không làm gì và in cảnh báo dev, để không rò toast giữa các request.
  - Chỉ `Toaster` mount đầu tiên hiển thị. Các `Toaster` khác in cảnh báo dev và render `null`.
- **Props của `<Toaster>`:**

  | Prop | Mặc định |
  |---|---|
  | `position` | `"bottom-center"`. Các giá trị khác: `"bottom-right"`, `"bottom-left"`, `"top-center"`, `"top-right"`, `"top-left"` |
  | `max` | `3`. Toast vượt số này chờ trong hàng đợi và hiện khi có toast đóng |
  | `duration` | `5000` |
  | `hotkey` | `"F8"` |
  | `labels` | `{ region: "Notifications", dismiss: "Dismiss notification", success: "Success", error: "Error", warning: "Warning", info: "Info" }`, ghi đè được từng khoá |

  `Toaster` cũng nhận `className`.

- **Cấu trúc:**

  ```html
  <section class="flg-toaster" data-position aria-label="Notifications (F8)" tabindex="-1">
    <ol aria-live="polite">
      <li class="flg-surface flg-toast" data-status>
        <svg role="img" aria-label="Success">…</svg> title, description, action, nút đóng
      </li>
    </ol>
    <div class="flg-visually-hidden" aria-live="assertive" aria-atomic="true"></div>
  </section>
  ```

  - `aria-label` của `<section>` là `labels.region` kèm `hotkey` trong ngoặc.
  - Cả hai vùng live có mặt ngay từ lúc mount, trước khi có toast đầu tiên.
  - Icon trạng thái mang tên theo `labels`, để trạng thái không chỉ được truyền bằng màu.
- **Thông báo cho screen reader:**
  - Toast thường được đọc qua vùng polite.
  - Toast `error` có `aria-live="off"` trên `<li>` của nó. Bản sao tiêu đề và mô tả của toast đó được đưa vào vùng assertive.
  - Bản sao bị xoá khi toast đóng.
- **Thời gian tự đóng:**
  - Mọi bộ đếm giờ tạm dừng khi chuột nằm trên vùng toast, khi focus nằm trong vùng, và khi trang bị ẩn (`visibilitychange`).
  - Khi tiếp tục, mỗi toast chạy nốt thời gian còn lại.
- **Bàn phím:**
  - `hotkey` chuyển focus vào vùng toast.
  - Esc đóng toast đang chứa focus.
- **Focus khi một toast đang chứa focus bị đóng:**
  - Focus sang toast kế tiếp.
  - Hết toast thì về phần tử có focus trước khi vào vùng toast.
  - Không còn phần tử đó thì về `body`.
- **Vị trí:**
  - Ở trang, vùng toast là một `popover="manual"`, hiện ngay khi mount.
  - Nếu modal của lib mở sau đó, vùng toast nằm dưới modal đó trong top layer.
- **Trong Dialog và Drawer:**
  - Toaster theo dõi modal stack (§5). Khi có modal của lib đang mở, Toaster render vùng toast vào `.flg-toast-host` của modal trên cùng bằng `createPortal`.
  - Khi đó vùng toast là một phần tử `position: fixed` bình thường, không mang `popover`, vì `<dialog>` đã nằm trong top layer.
  - Toast vì vậy vẫn nhìn thấy, bấm được và được đọc. Những gì người dùng đang nhập trong dialog được giữ nguyên.
  - Khi modal đóng, vùng toast về lại vị trí trên trang.
  - Chuyển chỗ không làm mất toast, vì dữ liệu nằm trong store. Các toast đang hiện được render ngay trong vùng mới; chúng có sẵn lúc vùng được chèn nên không bị đọc lại.
- **Hạn chế, ghi trong docs:** `<dialog>` modal không do lib tạo không có trong modal stack. Toast khi đó nằm dưới dialog đó và không bấm được.

---

## 7. Kiểm thử

Các lớp 1–6 của spec 0+1 §7 giữ nguyên, với phần bổ sung sau.

| # | Lớp | Bổ sung ở giai đoạn 2 |
|---|---|---|
| 1 | Unit (jsdom, React 19 và 18.3) | **Chỉ logic thuần:** `useControllableState`, `getNextIndex`, `useTypeahead`, `collectChildren`, đếm khoá của `lockScroll`, modal stack, hàm tính dãy trang của Pagination, store của toast (xếp hàng, `max`, cập nhật theo id, tạm dừng/tiếp tục, server no-op). jsdom thiếu Popover API và `showModal()`, nên mọi hành vi overlay được kiểm ở lớp 2 |
| 2 | Trình duyệt thật (Chromium, Firefox, WebKit) | Play function mở overlay rồi kiểm tra: phím bàn phím của từng component ở §6.3, focus lúc mở và trả focus, Esc, bấm ra ngoài (kể cả bôi đen chữ kéo ra ngoài không đóng Dialog), trigger bấm lại thì đóng, menu con và vùng tam giác, typeahead, ContextMenu bằng chuột phải và Shift+F10, `FormData` và reset form của Select, bong bóng validation chuyển focus sang trigger, đồng bộ `toggle`/`close` ở chế độ controlled, khoá cuộn, toast hiện và bấm được khi Dialog đang mở mà chữ đã nhập trong Dialog còn nguyên |
| 3 | Accessibility (axe) | Chạy **sau** play function, để kiểm cả trạng thái đang mở |
| 4 | Tương phản | Các cặp mới ở §4.4, cả chế độ mặc định lẫn `prefers-contrast: more` |
| 5 | Visual regression | Story trạng thái mở của mọi component, ở 4 chế độ × light/dark. Story overlay dùng stage phủ toàn viewport, vì top layer không nằm trong khung stage thường |
| 6 | Screen reader (thủ công) | Checklist cho từng component mới trong PR template, gồm cả việc toast lỗi được đọc ngay và toast trong Dialog được đọc |

**Input thật trong play function.**

- Esc của `<dialog>` và light dismiss của popover chỉ phản ứng với input mà trình duyệt tin cậy. `userEvent` của Testing Library phát sự kiện giả, nên không kích hoạt được hai hành vi này.
- Play function lấy `userEvent` của Vitest qua `.storybook/real-input.ts`. Bản này điều khiển Playwright, nên input là thật. Trong Storybook UI không có bản này, và các bước cần input thật được bỏ qua.
- Input thật chỉ đến đúng story khi mỗi lúc chỉ chạy một file. Vì vậy hai project story đặt `fileParallelism: false`, làm bộ test lâu thêm khoảng 20 giây (phát hiện khi lập Plan A).

**Kiểm tra bổ sung:**

- **Test kiểu:**
  - `Select` có `multiple: true` chỉ nhận `string[]`.
  - `Accordion` có `type: "multiple"` chỉ nhận `string[]`.
  - `TooltipTrigger` chỉ nhận đúng một element con.
  - Union của `side`, `variant` và `position` từ chối giá trị lạ.
- **Gói phát hành:**
  - `check:use-client` và `check:dist-css` cập nhật danh sách theo §3.6 và §3.7.
  - `rsc-probe` thêm `Breadcrumb`, `BreadcrumbLink`, `BreadcrumbPage`.
  - `size-limit` được ghi lại ngưỡng ở mỗi plan. `@floating-ui/dom` thêm khoảng 6KB min+gzip.
- **Fixtures:**
  - `vite-app` và `next-app` render đủ component giai đoạn 2.
  - Kịch bản kiểm tra: mở và đóng một Dialog, chọn một option của Select, mở một menu, và hiện một toast trong lúc Dialog đang mở. Console phải sạch.
  - `next-app` render Breadcrumb trong một Server Component.

---

## 8. Docs và phát hành

- **Mỗi component mới có một trang MDX**, cùng khuôn với giai đoạn 1: cách dùng, bảng props, ví dụ, ghi chú accessibility, "nên / không nên". Ghi chú accessibility nêu các hạn chế đã biết ở §6.3.
- **Getting started** thêm mục "Overlays":
  - Đặt `<Toaster />` một lần trong app.
  - Không cần portal hay z-index.
  - Lưu ý với `<dialog>` không do lib tạo.
- **Accessibility:**
  - Bảng §4.9 gồm phần mở rộng của điểm 7 và các dòng mới (nếu có) từ §4.4.
  - Ghi chú về toast và `<dialog>` không do lib tạo.
- **Phát hành:**
  - Một changeset `minor` cho `0.2.0`, ghi rõ thay đổi phá vỡ: mốc trình duyệt nâng lên Safari/iOS 17.4.
  - Nếu tới lúc đó `0.1.0` vẫn chưa publish, Changesets gộp hai changeset thành bản phát hành đầu tiên. Changelog của bản đó vẫn liệt kê đủ cả hai.
- **Việc của chủ dự án không đổi** (spec 0+1 §8.3): bỏ `"private": true`, cấu hình trusted publisher, mở public repo, và lần publish đầu tiên.

---

## 9. Tiêu chí hoàn thành giai đoạn 2

1. Cả 11 component ở §2, cùng ContextMenu, qua các lớp 1–5 ở §7.
   - Cách đếm: mỗi họ component (gốc cùng các phần con) tính là một mục; các phần `Menu*` tính chung với DropdownMenu.
   - Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục.
2. Toàn bộ kiểm tra bổ sung ở §7 xanh trong CI.
3. Fixture Vite và fixture Next.js chạy đủ kịch bản ở §7 từ tarball.
4. Mọi cặp tương phản mới đã đạt, hoặc đã có trong §4.9 kèm số đo.
5. Changeset `0.2.0` đã sẵn sàng. Việc publish là quyết định của chủ dự án.

---

## 10. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Popover API và `<dialog>` khác nhau giữa các engine (light dismiss, focus, sự kiện) | Lớp 2 chạy trên cả ba engine. Lib tự làm phần focus thay vì dựa vào trình duyệt (§6.3) |
| Floating UI tính sai vị trí cho phần tử nằm trong top layer | Dùng `strategy: "fixed"`. Plan A kiểm tra trước khi ghim phiên bản (§3.2). Visual test có ảnh trạng thái mở |
| jsdom thiếu Popover API và `showModal()` | Unit test chỉ cho logic thuần; hành vi kiểm ở trình duyệt thật |
| Chromium đóng dialog mà không phát `cancel` (chống lạm dụng Esc) | Nghe thêm `close` để đồng bộ state (§3.4) |
| axe báo lỗi cấu trúc menu lồng menu | Theo đúng cấu trúc của APG (`role="none"` bọc sub-trigger và menu con). Nếu axe vẫn báo, xử lý như §7 lớp 3 của spec 0+1: chỉ tắt rule cho đúng phần tử, kèm comment giải thích |
| Vùng live của toast bị gắn lại khi chuyển vào dialog, làm mất hoặc đọc lặp thông báo | Store giữ dữ liệu. Toast đang hiện được render cùng lúc với vùng mới. Lớp 6 kiểm tra trên NVDA và VoiceOver |
| `<select>` gốc ẩn hiện bong bóng validation sai chỗ hoặc không hiện | Phủ trùng lên trigger. Lớp 2 kiểm tra trên cả ba engine |
| Overlay đóng đột ngột vì chưa có animation lúc đóng | Chấp nhận ở giai đoạn này (§2). Làm sau khi `transition-behavior: allow-discrete` ổn định trên đủ ba engine |
| Bundle tăng do `@floating-ui/dom` | Chỉ import phần đã liệt kê (§3.2). `size-limit` ghi lại ngưỡng ở mỗi plan |
