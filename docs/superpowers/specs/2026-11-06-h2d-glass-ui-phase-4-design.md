# h2d-glass-ui — Thiết kế giai đoạn 4 (hiển thị dữ liệu và phản hồi)

> File này mang tên mới của gói (`h2d-glass-ui`). Liên kết tới các spec trước giữ tên file cũ (`fl-glass-ui`), để các plan đã thực thi vẫn trỏ đúng.

- **Ngày:** 2026-11-06
- **Trạng thái:** Đã duyệt (2026-11-07), kể cả các dòng 23–34 của §4.9
- **Phạm vi spec này:** Giai đoạn 4: 6 component hiển thị dữ liệu và phản hồi, mỗi component có ba `variant`, các primitives nội bộ chúng cần, và bản phát hành `0.3.0`.
- **Spec trước:** [`2026-10-01-fl-glass-ui-phase-0-1-design.md`](2026-10-01-fl-glass-ui-phase-0-1-design.md) ("spec 0+1"), [`2026-10-05-fl-glass-ui-phase-2-design.md`](2026-10-05-fl-glass-ui-phase-2-design.md) ("spec giai đoạn 2") và [`2026-11-02-fl-glass-ui-phase-3-design.md`](2026-11-02-fl-glass-ui-phase-3-design.md) ("spec giai đoạn 3"). Mọi quy ước ở ba spec đó vẫn áp dụng, trừ chỗ spec này ghi rõ là thay thế.

---

## 1. Bối cảnh và mục tiêu

Giai đoạn 3 đã merge vào `main` (PR #11–#18) và phát hành thành `0.2.0`, sau đó là bản vá `0.2.1` (`main` ở `82a4318`). Giai đoạn 4 là dòng "Hiển thị dữ liệu & phản hồi" của lộ trình ở spec 0+1 §2: Alert, Progress, Skeleton, Stepper, List, Table.

Các ràng buộc của giai đoạn 1–3 giữ nguyên, spec này không nhắc lại:

- Mốc trình duyệt Safari/iOS 17.4 (spec giai đoạn 2 §3.1).
- Dependency lúc chạy chỉ có `clsx` và `@floating-ui/dom` (spec giai đoạn 2 §3.2).
- Theme mặc định đúng tuyệt đối mockup đã duyệt; tương phản AA bảo đảm ở các chế độ người dùng bật (spec 0+1 §1, §4.6, §4.9).
- Quy tắc React Server Components (spec 0+1 §6.2, spec giai đoạn 2 §3.6, spec giai đoạn 3 §3.7).
- Dùng sai thì `devWarn`, không bao giờ throw (spec 0+1 §5).
- Chữ mặc định bằng tiếng Anh, ghi đè qua prop `labels` (spec 0+1 §6.1, spec giai đoạn 3 §6.1); `locale` mặc định cố định `'en-US'`, mọi `Intl` đi qua `src/internal/intl.ts` (spec giai đoạn 3 §3.4).
- Forced colors (spec 0+1 §4.6, spec giai đoạn 2 §4.5) và giảm chuyển động (spec 0+1 §4.6, spec giai đoạn 2 §3.5).

**Ai quyết định gì.** Chủ dự án nói "bắt đầu luôn" ngày 2026-11-06 và bỏ qua các câu hỏi thiết kế. Vì vậy mọi quyết định về phạm vi, hành vi và API trong spec này là của Claude, kể cả chỗ không ghi "(Claude chốt)" từng dòng. Giao diện do chủ dự án chọn qua mockup: chủ dự án trả lời "tôi muốn tất cả lựa chọn", nên cả 18 phương án đều được duyệt và mỗi component có prop `variant` với ba giá trị (như Tabs có `underline | segmented | pill`). Chỗ ghi "(Claude chốt)" là các quyết định chủ dự án nên đọc kỹ khi duyệt, nhất là các chỗ phải đổi so với bản quyết định ban đầu vì code hoặc nền tảng không cho phép làm đúng như vậy.

### Các điểm Claude chốt chủ dự án nên đọc

| Chủ đề | Quyết định |
|---|---|
| Giao diện | Mỗi component có `variant` ba giá trị; mặc định là phương án Claude đề xuất trên trang chọn: Alert `stripe`, Progress `thin`, Skeleton `pulse`, Stepper `circles`, List `inset`, Table `lined` (§4.1) |
| **Tương phản: cần duyệt** | Script đo trên mọi nền tham chiếu và trên panel phủ lớp tối (spec giai đoạn 2 §4.4) ra 12 điểm dưới ngưỡng ở theme mặc định, đúng như mockup. Chúng thành các dòng **23–34** của §4.9 và cần chủ dự án duyệt (§4.4); ba dòng cuối là chữ (Badge, chữ mờ) trên nền hàng của Table, thêm khi đọc soát spec. Ba ghi chú của người vẽ mockup không đứng được khi đo như vậy: phần đã chạy của Progress so với rãnh (người vẽ ghi ≥ 3,06; đo được 2.45 light, 1.74 dark), vòng của bước chưa tới (ghi ~3,0 và 3,6; đo được 2.63 cả hai), chữ của Alert `tinted` (ghi "đủ 4.5:1"; dark chỉ còn 3.37 và 4.16 trên nền `#2fa8d8`) |
| Client và server | Chỉ `Progress`, `Table` và `TableCaption` là client. Alert, Skeleton, Stepper, List và các phần còn lại của Table dùng được thẳng trong Server Component (§3.1) |
| Stepper | `value` chỉ có dạng controlled, không có `defaultValue`; `value` bằng số bước nghĩa là mọi bước đã xong. Bước bấm được là các nút trong thứ tự Tab, không roving. Hover nhẹ (nền `--flg-control-track`) cho bước bấm được, ngoài mockup. Các `Step` phải được viết trong chính component render `Stepper` (§3.1, §6.3) |
| List | Thêm `size` (`sm` 44px cho danh sách điều hướng, `md` 52px), vì mockup vẽ cả hai chiều cao; thêm `renderLink` cho link của router, như Pagination (§6.3) |
| Table | Hàng đã chọn dùng `--flg-accent-subtle` thay cho `--flg-selected-bg` (giống hệt ở mặc định). Ở `prefers-contrast: more`, hàng đã chọn có khung 2px thay cho nền nhuộm, `striped` có đường kẻ thay cho sọc, hover không đổi nền. Khung cuộn không cắt vòng focus: `striped` và `minimal` có padding 6px bù bằng margin âm, `lined` vẽ outline vào trong ở các chế độ dùng outline. `aria-sort` chỉ đặt trên cột đang sắp. Nền của tiêu đề dính (`stickyHeader`) là ngoài mockup (§4.3) |
| Chuyển động | Các animation lặp (Progress chưa xác định, Skeleton) được tắt bằng quy tắc `prefers-reduced-motion` viết tay trong `preferences.css`, vì token thời lượng không dừng được animation lặp. Đây là thay đổi so với spec 0+1 §4.6 (§3.3) |
| Kiểm thử | Ảnh chuẩn visual có thêm lượt `reduced-motion` cho story gắn tag, và harness rê chuột lên phần tử có `data-visual-hover`, để trạng thái hover của mockup có ảnh chuẩn (§7) |
| Phát hành | Một changeset `minor` cho `0.3.0`. Chủ dự án vẫn là người publish |

---

## 2. Phạm vi và chia plan

| Plan | Nội dung | Phụ thuộc |
|---|---|---|
| **A** | Primitive: icon trạng thái dùng chung `StatusIcon` (chuyển bốn icon của Toaster vào `src/internal/icons.tsx`, Toast không đổi pixel nào). Lượt `reduced-motion` của harness visual. Component: **Alert**, **Progress**, **Skeleton** | — |
| **B** | Icon `ExclamationIcon`. Móc `data-visual-hover` của harness visual. Component: **List**, **Stepper** | A |
| **C** | Icon `ArrowIcon`, `ChevronsUpDownIcon`. Component: **Table**. Docs chung (mục "Loading states" và "Show data" của Getting started, trang Accessibility), fixtures dùng các component mới, changeset `minor` → `0.3.0` | A, B |

- **Các plan chạy lần lượt** A, B, C, như giai đoạn 2 và 3. B phụ thuộc A vì cả hai cùng viết `icons.tsx`, `values.ts`, `preferences.css`, `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts` và các danh sách kiểm tra gói; B còn mở rộng hai dòng §4.9 do A thêm (§4.4). C dùng Skeleton (A) và List (B) trong docs chung.
- **Mỗi plan tự mang đủ phần của mình,** như giai đoạn 2 và 3:
  - Stories: mỗi variant một story giao diện vẽ lại đúng các trạng thái của mockup (§7), cộng các story hành vi gắn `no-visual`.
  - Test các lớp ở §7 và ảnh chuẩn visual.
  - Trang MDX của component.
  - Danh sách `check:use-client`, `check:dist-css`, các ca của `check:rsc` (`scripts/rsc-probe.mjs`) cho phần server-safe.
  - Các check tương phản và ngoại lệ của mình (§4.4), cùng bảng §4.9 của spec 0+1 và nhãn các dòng trong `scripts/contrast-exceptions.ts`.
  - Ghi lại ngưỡng `size-limit` theo số đo thật (`pnpm size:record`).
- **Thay đổi ở code cũ** (không đổi hành vi, ảnh chuẩn visual cũ giữ nguyên):
  - Plan A: Toaster dùng `StatusIcon` thay cho bảng `ICONS` của nó; DOM ra giống hệt.
  - Plan A: `tests/visual/stories.visual.ts` có thêm lượt `reduced-motion` (§7).
  - Plan B: `tests/visual/stories.visual.ts` rê chuột lên `[data-visual-hover]` trước khi chụp (§7).

**Ngoài phạm vi:**

- **Alert:** banner toàn trang dính đầu trang; tự đóng theo thời gian; hàng đợi (việc của Toast).
- **Progress:** vòng tròn tiến độ (Spinner lo phần không xác định); nhiều đoạn chồng nhau; Meter; chữ nằm trong thanh.
- **Skeleton:** cấu hình chung cho cả app (docs chỉ cách bọc thành component riêng của ứng dụng); tự đo kích thước theo nội dung thật.
- **Stepper:** chứa nội dung của từng bước (khác Tabs); bước tuỳ chọn hay bị bỏ qua; bước `disabled`; điều hướng giữa các bước bằng phím mũi tên.
- **List:** chọn một hay nhiều hàng (listbox chọn giá trị là việc của Select và Combobox); kéo sắp xếp; ảo hoá; danh sách lồng nhiều cấp; DescriptionList (cặp khoá–giá trị).
- **Table:** điều hướng ô bằng bàn phím (`role="grid"`); đổi cỡ và sắp lại cột; cột ghim; hàng mở rộng; ảo hoá; chọn bằng kéo; xử lý dữ liệu (sắp xếp, lọc, phân trang) trong lib. Pagination đã có.
- **Hướng phải sang trái (RTL)** và **hệ thống i18n.**

---

## 3. Kiến trúc

### 3.1 Client và server

| Component | Phân loại | Lý do |
|---|---|---|
| `Alert`, `AlertTitle`, `AlertDescription`, `AlertActions` | Server-safe | Không có hook. Nút đóng là `IconButton` (client) chỉ được render khi có `onDismiss`, và `onDismiss` là hàm nên chỉ có khi Alert nằm trong client component |
| `Progress` | Client | `useId` nối nhãn nhìn thấy với `aria-labelledby`; `useRequireName` cảnh báo khi thiếu tên |
| `Skeleton`, `SkeletonText` | Server-safe | Chỉ là markup |
| `Stepper`, `Step` | Server-safe | `value` chỉ có dạng controlled nên không cần state; các bước được đọc tĩnh từ `children` (`collectChildren`), không qua context. Nút của bước chỉ có khi có `onValueChange` (một hàm) |
| `List`, `ListItem` | Server-safe | Không có hook. `renderLink` chạy ngay trên server khi List nằm trong Server Component, nên link của router dùng được ở đó |
| `Table`, `TableCaption` | Client | `Table` đo khung cuộn bằng `ResizeObserver` (§3.5). `TableCaption` lấy id do `Table` cấp qua context, để khung cuộn có tên |
| `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell` | Server-safe | Không có hook; nằm ở file riêng (`table/table-parts.tsx`) để bảng dựng từ server không thêm một ranh giới client cho mỗi ô |

- **Vì sao `TableCaption` là client** (Claude chốt). Một Server Component render `<TableCaption>` làm con của `Table` (client) thì gửi xuống client một `<caption>` đã render sẵn, nên `Table` không đọc tĩnh được nó như Stepper đọc `Step`. Context là cách duy nhất để hai phần dùng chung một id.
- **Stepper bấm được và các `Step` viết trong Server Component** (Claude chốt, phát hiện khi đọc soát spec). `Step` là marker server-safe. Nếu một trang Server Component truyền các `<Step>` làm con cho một client component của người dùng, và client component đó mới render `<Stepper onValueChange>`, thì RSC render từng `Step` ngay trên server (ra `null`, kèm cảnh báo "Step ngoài Stepper"), và Stepper ở client không nhận được bước nào. Spec giữ cách chia ở trên, vì Stepper chỉ hiển thị vẫn dùng được thẳng trong Server Component, và đặt một quy tắc: **viết các `Step` trong chính component render `Stepper`**. Docs và trang MDX nêu quy tắc này; hai cảnh báo dev nói rõ nguyên nhân (§5); fixture Next.js có một Stepper bấm được trong client component, với các `Step` viết ở đó (§7).
- **Prop là hàm** (`onDismiss`, `getValueText`, `onValueChange`, `onSelect`, `onSort`) chỉ có trong client component. `renderLink` và `labels` có hàm của Stepper thì khác: Stepper và List là server-safe, nên trong Server Component các hàm này chạy ngay trên server, không phải truyền qua ranh giới.
- **`check:use-client`** thêm `src/components/progress/Progress.tsx` và `src/components/table/Table.tsx`.
- **`check:rsc`** thêm các ca: Alert không có `onDismiss`, `AlertTitle asChild`, `AlertDescription`, `AlertActions`, `Skeleton` cả ba hình, `SkeletonText`, Stepper chỉ hiển thị (không có `onValueChange`), List với một hàng `href` và một hàng tĩnh, các phần của `table-parts.tsx`.

### 3.2 Variant

- **Prop `variant`** nằm trên phần tử gốc của mỗi component và thành `data-variant`, như Tabs. Phần con (`Step`, `ListItem`, các phần của Table) không nhận `variant`: CSS chọn giao diện qua phần tử gốc.
- **Bảng giá trị:**

  | Component | `variant` (mặc định in đậm) |
  |---|---|
  | Alert | **`'stripe'`** · `'tinted'` · `'plain'` |
  | Progress | **`'thin'`** · `'glow'` · `'inline'` |
  | Skeleton, SkeletonText | **`'pulse'`** · `'shimmer'` · `'glass'` |
  | Stepper | **`'circles'`** · `'compact'` · `'bars'` |
  | List | **`'inset'`** · `'cards'` · `'plain'` |
  | Table | **`'lined'`** · `'striped'` · `'minimal'` |

- **Mỗi component một file CSS** chứa cả ba variant; phần chung viết một lần, mỗi variant chỉ ghi phần khác. Cả ba variant đều nằm trong `styles.css`; lib không tách CSS theo variant (hệ quả ở §10).
- **Skeleton không có cấu hình chung cho cả app** (Claude chốt, theo bản quyết định ban đầu): mỗi khối nhận `variant` riêng. Docs chỉ cách bọc `Skeleton` thành component riêng của ứng dụng với `variant` cố định.

### 3.3 Chuyển động và giảm chuyển động

| Component | Chuyển động | Khi `prefers-reduced-motion: reduce` |
|---|---|---|
| Progress chưa xác định | Đoạn 35% trượt qua lại trên rãnh: 1.4s, `cubic-bezier(.65, 0, .35, 1)`, lặp, `alternate` | Đứng yên: đoạn sọc phủ cả rãnh (§4.3) |
| Progress đổi giá trị | Chiều rộng phần đã chạy chuyển trong `--flg-duration-normal` với `--flg-ease` (ngoài mockup) | Không chuyển: token thời lượng về `0ms` |
| Skeleton `pulse` | Độ mờ 1 → .4 → 1, 1.6s, `ease-in-out`, lặp | Đứng yên, độ mờ 1 |
| Skeleton `shimmer` | Vệt sáng quét trái sang phải, 1.6s, `linear`, lặp | Đứng yên, không có vệt sáng |
| Skeleton `glass` | Nền "thở" sang màu nhấn 20% rồi về, 2s, `ease-in-out`, lặp | Đứng yên ở nền gốc |
| List `cards` khi hover | Nổi lên 1px, bóng đậm hơn, chuyển trong `--flg-duration-fast` (ngoài mockup) | Không chuyển: token thời lượng về `0ms` |

- **Quy tắc viết tay cho giảm chuyển động** (Claude chốt). Spec 0+1 §4.6 chỉ đổi token thời lượng; Spinner vẫn quay (chậm hơn) vì đó là token `--flg-spinner-duration`. Animation lặp của Progress và Skeleton không dừng được bằng thời lượng (`0ms` lặp vô hạn vẫn là lặp), nên `preferences.css` có thêm một khối `@media (prefers-reduced-motion: reduce)` viết tay, cạnh khối forced colors. Mọi chuyển động một lần khác vẫn đi theo token như trước.
- **Đoạn trượt của Progress dùng `translate`,** không dùng `left` như mockup (Claude chốt): từ `0` tới `185.714%` chiều rộng của chính đoạn (65% / 35%) cho đúng từng khung hình của mockup, mà trình duyệt không phải tính lại bố cục mỗi khung.
- **`animation-delay` âm của mockup** (`-.5s`, `-.3s`, `-.75s`, `-.85s`) chỉ để ảnh chụp mockup dừng ở một khung hình đẹp. Lib bắt đầu animation từ 0 (Claude chốt).
- **Ảnh chuẩn visual:** Playwright chụp với `animations: 'disabled'`, nên animation lặp bị huỷ về trạng thái gốc: Skeleton là khối đặc ở độ mờ 1, `shimmer` không có vệt sáng, `glass` ở nền gốc, đoạn của Progress ở mép trái. Khung hình mockup chụp (vd. `glass` lúc ánh nhấn đậm nhất) không có trong ảnh chuẩn; keyframe đó được kiểm ở lớp 2 qua `getAnimations()` (§7).

### 3.4 Thông báo cho screen reader

Không component nào của giai đoạn 4 tự có vùng live (Claude chốt). Mỗi component báo theo cách của nó:

- **Alert:** mặc định không có `role`. Nội dung có sẵn lúc tải trang không được đọc dù có role, và một Alert lỗi render từ server không phải là thông báo mới, nên lib không tự gán `role="alert"` cho `error`. Docs có công thức (§8):
  - Thông báo lịch sự: một `<div role="status">` có mặt sẵn từ lúc mount (rỗng), Alert được render vào trong nó sau hành động. Screen reader chỉ đọc thay đổi trong vùng live nó đã biết (bài học Toaster, spec giai đoạn 2 §6.3).
  - Lỗi khẩn: Alert mang `role="alert"` và được chèn vào cây sau hành động.
- **Progress:** tên, giá trị và trạng thái nằm trên phần tử `role="progressbar"` (`aria-valuetext` có cả trạng thái, §6.3; thanh chưa xác định có trạng thái thì nói trạng thái qua mô tả, §6.3). Screen reader đọc khi người dùng tới nó; lib không thông báo từng phần trăm.
- **Skeleton:** luôn `aria-hidden="true"`. Báo "đang tải" là việc của vùng chứa: docs có công thức: vùng chứa luôn có mặt, `aria-busy` theo trạng thái tải (true khi đang tải, false sau đó) và Skeleton được thay bằng nội dung bên trong nó; lời báo đến từ một vùng `role="status"` có mặt trước khi việc bắt đầu (như `Spinner.mdx`), còn `fallback` của Suspense được chèn vào đã có chữ nên lời báo ở đó chỉ là cố gắng tối đa (phát hiện khi review cuối Plan A). Skeleton không tự làm vùng live: nhiều khối sẽ thành nhiều thông báo.
- **Stepper:** mỗi bước có chữ ẩn số thứ tự và trạng thái (§6.3).

### 3.5 Đo kích thước

- **Stepper ngang hẹp** dùng container query, không dùng JS: HTML từ server đã đúng.
  - Phần tử gốc `<ol>` ngang là container có tên: `container: flg-stepper / inline-size`. Quy tắc hẹp là `@container flg-stepper (width < 480px)`, viết theo cú pháp khoảng: `(max-width: 479px)` cùng `(min-width: 480px)` để hở các chiều rộng giữa 479 và 480px (cột 50% của hàng 959px, trang phóng to 110% hay 125%), nơi không quy tắc nào áp dụng (phát hiện khi review PR #28). Quy tắc nào cần dạng rộng thì viết `(width >= 480px)`. Có tên để một Stepper dọc (không phải container) nằm trong một container của người dùng không bị quy tắc hẹp áp nhầm (Claude chốt).
  - Chỉ Stepper ngang là container (Claude chốt). `inline-size` chặn chiều rộng của phần tử phụ thuộc nội dung; Stepper dọc trong một cha co theo nội dung sẽ bị ép về 0 nếu cũng là container.
  - Gốc `<ol>` ngang đầy hàng (Claude chốt, phát hiện khi lập Plan B), bằng chuỗi từ khoá kéo giãn (`width: 100%` làm dự phòng, rồi `-webkit-fill-available`, `-moz-available`, `stretch`): hộp margin của nó lấp vùng chứa, nên margin, padding và viền người dùng thêm (`className="mx-4"`, `style={{ padding: 8 }}`) được trừ khỏi chiều rộng thay vì đẩy nó ra ngoài cha và làm trang cuộn ngang, như `width: 100%` với `box-sizing: content-box` (phát hiện khi review PR #28). Lightning CSS giữ đủ bốn khai báo trong `dist/styles.css`. Một container `inline-size` không lấy kích thước từ nội dung, nên là một mục của hàng flex nó co về 0; Plan A cũng làm Progress và Skeleton đầy hàng vì lý do tương tự. Trong luồng khối không có gì đổi. Một story `no-visual` đo một Stepper ngang trong hàng flex cạnh một ô 40px: nó chiếm phần còn lại của hàng. Trong một cha co theo nội dung (không phải hàng flex có chiều rộng) nó vẫn co về 0, như rủi ro ở §10.
- **Table** đo khung cuộn bằng `ResizeObserver` trên cả khung lẫn `<table>`: khung "cuộn được" khi `scrollWidth > clientWidth` hoặc `scrollHeight > clientHeight`. Chỉ khi đó khung mới mang `role="region"`, `tabIndex={0}` và tên (§6.3). HTML từ server không có ba thuộc tính này; chúng xuất hiện sau khi mount. Trạng thái chỉ được đặt khi kết quả đổi, để không gây vòng lặp `ResizeObserver`. Khi khung đang giữ focus mà bảng hết tràn (cửa sổ được nới rộng, thiết bị xoay), khung giữ `role`, `tabIndex` và tên cho tới khi mất focus, rồi bỏ chúng nếu vẫn không tràn: gỡ `tabindex` khỏi phần tử đang focus làm trình duyệt đẩy focus về `<body>` và người dùng mất chỗ (phát hiện khi review PR #29).
  - Bản thân khung luôn là scroll container (`overflow: auto`) ngay từ HTML của server, ở mọi variant: `stickyHeader` cần nó, và bảng rộng hơn khung cuộn được trước khi hydrate.
  - Một scroll container cắt mọi thứ vẽ ra ngoài mép padding của nó, kể cả vòng focus của control nằm sát mép bảng. Cách giữ vòng focus nguyên vẹn ở §4.3 ("Khung cuộn và vòng focus"; Claude chốt, phát hiện khi đọc soát spec).

### 3.6 Cấu trúc file bổ sung

```
src/internal/        icons.tsx (mở rộng: StatusIcon, ExclamationIcon, ArrowIcon, ChevronsUpDownIcon)
src/components/      alert/, progress/, skeleton/, stepper/ (kèm step-states.ts), list/,
                     table/ (Table.tsx client: Table, TableCaption; table-parts.tsx: các phần còn lại;
                     use-scrollable.ts)
src/styles/components/
                     alert.css, progress.css, skeleton.css, stepper.css, list.css, table.css
src/styles/          preferences.css (thêm khối prefers-reduced-motion, quy tắc forced colors và
                     prefers-contrast: more của các component mới)
tests/visual/        stories.visual.ts (lượt reduced-motion, móc data-visual-hover)
```

---

## 4. Token và giao diện

### 4.1 Mockup đã duyệt

Các file nằm ở `docs/superpowers/specs/mockups/`; CSS đọc được của từng phương án (mã `a1`…`t3`) nằm ở `.superpowers/mockups/pages/*.src.html` và trùng từng dòng với CSS trong trang đã duyệt. Chủ dự án chọn "tất cả lựa chọn" ngày 2026-11-06 ([trang chọn](https://claude.ai/artifact/G6nZMNWptxMtwQf4FhDgiN)).

| File | Component | Phương án → `variant` |
|---|---|---|
| `phase-4-alert-progress-skeleton.html` | Alert | A1 → `stripe`, A2 → `tinted`, A3 → `plain` |
| | Progress | P1 → `thin`, P2 → `glow`, P3 → `inline` |
| | Skeleton | Sk1 → `pulse`, Sk2 → `shimmer`, Sk3 → `glass` |
| `phase-4-stepper-list.html` | Stepper | St1 → `circles`, St2 → `compact`, St3 → `bars` |
| | List | L1 → `inset`, L2 → `cards`, L3 → `plain` |
| `phase-4-table.html` | Table | T1 → `lined`, T2 → `striped`, T3 → `minimal` |

- **Mọi số liệu ở §4.3** lấy từ CSS `mk-` của đúng phương án đó. Mockup dùng chung token của lib, nên dark khác light chỉ ở giá trị token; các chỗ ngoại lệ (bóng và hover của List `cards`, vệt sáng của Skeleton `shimmer`) có token theo theme ở §4.2.
- **Phần khung của trang mockup** (thẻ "Thanh toán", nhãn `mk-tag`, chữ "←" chỉ trạng thái, khung đứt nét 320px) không thuộc component. Nội dung mẫu (Avatar, Badge, nút "…", cột ô chọn, trạng thái rỗng) là nội dung của người dùng, được dựng lại trong story và docs.

### 4.2 Token mới

**Token theo theme** (giá trị của mockup, chép nguyên văn, không phải "(outside mockup)"):

| Token | Light | Dark | Dùng ở |
|---|---|---|---|
| `--flg-skeleton-shine` | `rgba(255,255,255,.75)` | `rgba(255,255,255,.12)` | Vệt sáng của Skeleton `shimmer` |
| `--flg-list-card-shadow` | `0 1px 2px #0000000a, 0 6px 16px #3c5fd21f` | `0 6px 18px #00000047` | Bóng của mỗi hàng List `cards` |
| `--flg-list-card-shadow-hover` | `0 2px 4px #0000000f, 0 12px 26px #3c5fd238` | `0 12px 28px #00000073` | Bóng của hàng List `cards` khi hover |
| `--flg-list-card-hover-bg` | `var(--flg-control-bg)` | `var(--flg-control-track)` | Nền của hàng List `cards` khi hover |

- Bóng của hàng `cards` là màu mới của mockup: nhẹ hơn `--flg-glass-shadow`, để bóng của các thẻ sát nhau không chồng thành mảng tối.
- Hover của `cards` khác nhau theo theme: sáng lên bằng `--flg-control-bg` ở light, bằng `--flg-control-track` ở dark.
- `scripts/lib/theme-css.test.ts` thêm bốn token vào bảng `MOCKUP` của nó.

**Token dẫn xuất,** để script tương phản đo đúng thứ CSS dùng (cách làm của `--flg-slider-tick` ở spec giai đoạn 3 §4.2):

| Token | Mặc định | `prefers-contrast: more` | Dùng ở |
|---|---|---|---|
| `--flg-stepper-ring` | `color-mix(in srgb, var(--flg-text-muted) 65%, transparent)` | `var(--flg-text-muted)` | Vòng của bước chưa tới, Stepper `circles` và `compact` |

**Màu mới không thành token** (Claude chốt). Các màu chỉ để trang trí, không đo tương phản, được viết thẳng bằng `color-mix` trong CSS của component:

| Màu | Giá trị | Dùng ở |
|---|---|---|
| Đường mờ | `color-mix(in srgb, var(--flg-text-muted) 45%, transparent)` | Đường nối chưa đi của Stepper `circles` và `compact`; đường dưới tiêu đề và trên hàng chân của Table `minimal` |
| Sọc | `color-mix(in srgb, var(--flg-control-track) 50%, transparent)` | Hàng lẻ của Table `striped` |
| Quầng | `color-mix(in srgb, <màu> 18%` hoặc `16%, transparent)` | Quầng của bước hiện tại và bước lỗi, Stepper `circles` |
| Ánh nhấn | `color-mix(in srgb, var(--flg-accent-solid) 20%, var(--flg-control-bg-secondary))` | Đỉnh "thở" của Skeleton `glass` |
| Quầng sáng | `color-mix(in srgb, <màu phần đã chạy> 60%, transparent)` | Progress `glow` |
| Nền nhuộm, viền | `color-mix(in srgb, <màu trạng thái> var(--flg-status-bg-alpha), transparent)`, viền 45% | Alert `tinted`, như Badge trạng thái |
| Nền vòng icon | `color-mix(in srgb, <màu trạng thái> 16%, transparent)` | Alert `plain` |

- **Đường mờ của Table `minimal`** trong mockup là `var(--flg-dropzone-border)`. Spec viết thẳng cùng giá trị (Claude chốt): tên token đó thuộc FileUpload, và token đó thành màu đặc ở `prefers-contrast: more` vì viền vùng thả phải đạt 3:1, còn đường kẻ bảng chỉ để trang trí.

**Quy tắc hiệu năng** (bổ sung danh sách `backdrop-filter` của spec giai đoạn 2 §4.2): thêm **mỗi hàng của List `cards`**, vì mockup L2 vẽ mỗi hàng là một tấm kính. Gốc của List `inset` là một `Surface`, đã có trong danh sách. Docs khuyên `cards` cho danh sách ngắn (§10).

### 4.3 Kích thước và giao diện từng component

Trong mục này, "màu trạng thái" của Alert và Progress là: `info` → `--flg-accent-solid`; `success` → `--flg-success`; `warning` → `--flg-warning`; `error` → `--flg-danger`. CSS đặt nó vào một biến cục bộ (`--flg-alert-color`, `--flg-progress-color`), như `--flg-toast-color` của Toast.

#### Alert

**Phần chung của ba variant:**

- **Khung:** `display: flex`, `align-items: flex-start`, khoảng cách 10px, padding `10px 12px`, bo `--flg-radius-md`, chữ `--flg-text`, font `--flg-font-sans`.
- **Icon:** khối `inline-flex`, không co, cách trên 1px, màu là màu trạng thái; icon 17px.
- **Thân:** chiếm phần còn lại (`flex: 1`, `min-width: 0`).
- **Tiêu đề:** `--flg-text-sm`, đậm `--flg-weight-semibold`, `line-height: 1.35`.
- **Mô tả:** cách tiêu đề 2px, `--flg-text-xs`, `line-height: 1.45`, màu `--flg-text-muted`.
- **Hàng hành động:** `flex`, tự xuống dòng, khoảng cách 8px, cách phía trên 10px. Nút do người dùng đặt; docs và story dùng `Button` `secondary` `sm` và `ghost` `sm`, như mockup.
- **Nút đóng:** `IconButton` `ghost` `sm` (28×28px, icon × 14px) trong một khối `inline-flex` không co, margin `-5px -6px -5px 0`.
- **Dạng gọn** (Alert chỉ có tiêu đề, không có mô tả và hàng hành động): `align-items: center`, padding dọc 7px, icon không cách trên. Lib nhận ra dạng này bằng `:not(:has(.flg-alert-description, .flg-alert-actions))`, nên HTML từ server đã đúng (Claude chốt).

**`stripe` (A1, mặc định):** ô nền nhạt như ô nhập, vạch màu ở mép trái, như Toast.

- Nền `--flg-control-bg-secondary`, viền 1px `--flg-control-border`, `overflow: hidden`, padding trái 15px.
- Vạch: `::before` tuyệt đối, sát mép trái từ trên xuống dưới, rộng 3px, màu trạng thái.
- Tiêu đề màu `--flg-text`; mô tả màu `--flg-text-muted`.

**`tinted` (A2):** cả khối nhuộm màu trạng thái.

- Nền: lớp nhuộm `color-mix(in srgb, <màu trạng thái> var(--flg-status-bg-alpha), transparent)` (12% light, 16% dark) phủ trên `--flg-control-bg-secondary`: `background: linear-gradient(<nhuộm>, <nhuộm>), var(--flg-control-bg-secondary)`.
- Viền 1px `color-mix(in srgb, <màu trạng thái> 45%, transparent)`.
- Tiêu đề màu trạng thái, riêng `info` là `--flg-accent-text`. Mô tả màu `--flg-text`.

**`plain` (A3):** ô trung tính, icon trong vòng tròn màu, tiêu đề tô màu.

- Khoảng cách 12px, padding `12px 14px`, bo `--flg-radius-lg`, nền `--flg-control-bg`, viền 1px `--flg-control-border`.
- Icon nằm giữa một vòng tròn 32×32px nền `color-mix(in srgb, <màu trạng thái> 16%, transparent)`, không cách trên; icon 17px.
- Thân cách trên 7px, để tiêu đề thẳng hàng với tâm vòng tròn.
- Tiêu đề màu trạng thái (`info`: `--flg-accent-text`); mô tả `--flg-text-muted`.
- Nút đóng: margin `2px -4px 0 0`.
- Dạng gọn: padding dọc 8px; vòng tròn 26×26px, icon 15px; thân không cách trên.

**Dark:** chỉ khác giá trị token (nền trắng 6% hoặc 5%, viền trắng 11%, màu trạng thái sáng của dark). **Focus:** chỉ ở các nút bên trong, vòng focus chung.

#### Progress

**Phần chung:**

- **Khung:** cột dọc, khoảng cách 6px, font `--flg-font-sans`; phần tử gốc đầy hàng để làm phần tử của hàng flex vẫn chiếm phần còn lại của hàng (phát hiện khi review cuối Plan A), bằng chuỗi từ khoá kéo giãn (`width: 100%` làm dự phòng, rồi `-webkit-fill-available`, `-moz-available`, `stretch`) như Stepper (§3.5), nên margin, padding và viền của người dùng không làm nó tràn khỏi cha (phát hiện khi review PR #28).
- **Hàng nhãn:** `flex`, căn giữa dọc, hai đầu, khoảng cách 12px, cao tối thiểu 18px.
  - Nhãn: `--flg-text-sm`, màu `--flg-text`, một dòng, dài thì "…".
  - Giá trị: `inline-flex`, khoảng cách 4px, không co, `--flg-text-sm`, màu `--flg-text-muted`, `tabular-nums`, không xuống dòng, luôn ở mép phải kể cả khi không có nhãn (`margin-inline-start: auto`; Claude chốt, mockup không vẽ trường hợp này).
  - Icon trạng thái (`success`, `error`): 14px, màu trạng thái, đứng trước số.
- **Rãnh:** cao 4px, bo `--flg-radius-full`, nền `--flg-control-track`, `overflow: hidden`, `position: relative`.
- **Phần đã chạy:** tuyệt đối từ mép trái, rộng bằng giá trị (custom property `--flg-progress-value` trong `style`, nên HTML từ server đã đúng), bo theo rãnh. Màu: mặc định `--flg-accent-gradient`; `success` là `--flg-success`; `error` là `--flg-danger`. Đổi giá trị thì chiều rộng chuyển trong `--flg-duration-normal` (ngoài mockup).
- **Chưa xác định:** phần đã chạy rộng 35%, trượt qua lại (§3.3). Có `status` khác mặc định thì không trượt: phần đã chạy phủ cả rãnh, đứng yên, màu trạng thái, ở cả ba variant và cả hai size; đổi `status` khi chưa biết giá trị thì giao diện đổi ngay, không có transition, cả hai chiều (giá trị đến thì vẫn chạy dần); chữ giá trị của `inline` không vẽ (không có giá trị). Giảm chuyển động, forced colors và `prefers-contrast: more` theo đúng quy tắc của phần đã chạy đầy của trạng thái đó, nên không có sọc (chủ dự án chốt 2026-11-09; phát hiện khi review PR #34).
- **`sm`:** rãnh cao 2px.

**`thin` (P1, mặc định):** đúng như phần chung: rãnh mảnh 4px như Slider, hàng nhãn phía trên với giá trị bên phải.

**`glow` (P2):** viên thuốc dày phát sáng.

- Khoảng cách giữa hàng nhãn và rãnh 8px.
- Rãnh cao 10px, `overflow: visible` (để quầng sáng tràn ra), bóng trong `inset 0 1px 2px rgba(0,0,0,.12)`.
- Phần đã chạy: `background: linear-gradient(rgba(255,255,255,.24), rgba(255,255,255,0) 50%), <màu>` (ánh sáng ở nửa trên); bóng `0 0 10px color-mix(in srgb, <màu quầng> 60%, transparent)`, màu quầng là `--flg-accent-solid` khi mặc định, màu trạng thái khi `success` và `error`.
- Giá trị: `--flg-text-md`, đậm `--flg-weight-semibold`, màu `--flg-accent-text` khi mặc định, màu trạng thái khi `success`, `error`; icon 16px.
- `sm`: rãnh cao 6px.

**`inline` (P3):** thanh vừa, giá trị ở cuối thanh.

- Hàng nhãn chỉ có nhãn. Rãnh và giá trị nằm chung một hàng (`flex`, căn giữa dọc, khoảng cách 10px); rãnh chiếm phần còn lại.
- Rãnh cao 8px, bo 3px. Phần đã chạy khi mặc định là `--flg-accent-start` đặc.
- Giá trị: căn phải trong một cột rộng tối thiểu 52px (các thanh thẳng hàng), màu `--flg-text`, đậm `--flg-weight-medium`. Icon trạng thái vẫn mang màu trạng thái. Khi chưa xác định, cột 52px vẫn được giữ (rỗng), để thanh dài bằng các thanh khác.
- `sm`: rãnh cao 4px, bo 2px.

**Khi giảm chuyển động** (ngoài mockup, theo bản quyết định ban đầu): đoạn chưa xác định không chạy, phủ cả rãnh, và được cắt thành sọc chéo bằng `mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px)`. Dùng mask chứ không dùng nền sọc, để sọc giữ đúng màu (kể cả gradient) của phần đã chạy. Phủ cả rãnh để đoạn sọc không bị đọc nhầm thành một giá trị (Claude chốt). Ở `glow`, mask cũng cắt luôn quầng sáng, nên khi giảm chuyển động thanh chưa xác định của `glow` không có quầng (phát hiện khi lập Plan A).

**Dark:** chỉ khác giá trị token.

#### Skeleton

- **Phần tử:** `<span>` `display: block`, `box-sizing: border-box`, để Skeleton đặt được trong nội dung dạng câu (trong `<p>`, `<h2>`, ô bảng) (Claude chốt).
- **Hình:**
  - `rect`: bo `--flg-radius-md`; đầy hàng bằng chuỗi từ khoá kéo giãn (`width: 100%` làm dự phòng, rồi `-webkit-fill-available`, `-moz-available`, `stretch`), như Stepper (§3.5), để margin, padding và viền của người dùng không làm nó tràn khỏi cha (phát hiện khi review PR #28); cao `1lh` khi không có `height` (để khối không bao giờ cao 0; Claude chốt).
  - `circle`: bo 50%, rộng và cao bằng `size` (mặc định 40px, bằng Avatar `lg`; docs khuyên đặt bằng cỡ Avatar sẽ thay nó).
  - `text`: cao `.7em`, bo `--flg-radius-xs`, đầy hàng bằng cùng chuỗi từ khoá như `rect` (phát hiện khi review PR #28), margin dọc `calc((1lh - .7em) / 2)`. Như vậy một dòng Skeleton chiếm đúng một dòng chữ của chỗ nó nằm: mockup dựng mỗi dòng là một hộp cao bằng `line-height` của chữ thật (1.5em, 1.3em, 1.4em) với vạch `.7em` ở giữa.
  - Hình `text` là `display: inline-block; vertical-align: top`, không phải `block` (Claude chốt): margin dọc của hai khối `block` liền nhau gộp làm một, nên hai dòng Skeleton xếp chồng sẽ sát hơn một dòng chữ; margin của `inline-block` không gộp. Đầy hàng nên mỗi dòng vẫn nằm riêng một hàng. Có `width` thì nó rộng đúng bằng đó và nằm trong dòng như một từ: hai Skeleton `text` liền nhau có `width` chung một dòng như hai `span` chữ, nên đặt mỗi dòng vào chỗ chữ của nó sẽ nằm (tiêu đề và phụ đề mỗi cái một phần tử, như các story) hoặc dùng `SkeletonText`. Không đổi sang `display: block` (margin gộp vào cha và dòng kế, hai dòng sát hơn hai dòng chữ), cũng không dùng viền thay margin (viền làm tròn về số nguyên pixel) (phát hiện khi review PR #27).
- **`SkeletonText`:** phần tử gốc đầy hàng (để nằm trong hàng flex không bị co về 0; phát hiện khi review cuối Plan A), bằng cùng chuỗi từ khoá như `rect` (phát hiện khi review PR #28); các dòng `text` xếp dọc, không có khoảng cách thêm; khi có hơn một dòng, dòng cuối rộng 64% (độ rộng dòng ngắn của mockup; Claude chốt).

**`pulse` (Sk1, mặc định):** nền `--flg-control-track`; độ mờ 1 → .4 → 1.

**`shimmer` (Sk2):** nền `--flg-control-track`, `position: relative`, `overflow: hidden`; `::after` phủ kín, `background: linear-gradient(90deg, transparent, var(--flg-skeleton-shine) 50%, transparent)`, chạy từ `translateX(-100%)` tới `translateX(100%)`. Ở dark vệt sáng nhạt (trắng 12%), đúng như mockup.

**`glass` (Sk3):** nền `--flg-control-bg-secondary`, viền trong `inset 0 0 0 1px var(--flg-control-border)`; nền "thở" sang ánh nhấn (§4.2) rồi về.

#### Stepper

**Phần chung:**

- **Gốc:** `<ol role="list">` (§6.3), `list-style: none`, margin và padding 0, `--flg-text-sm`. Ngang thì là container `flg-stepper` (§3.5).
- **Mỗi bước có một trạng thái** (`data-state` trên `<li>`): `complete` (đã xong), `current` (hiện tại), `upcoming` (chưa tới), `error` (lỗi). Riêng bước ở `value` còn mang `data-current`, dù trạng thái của nó là gì: một bước ở `value` có `status="complete"` (xong mà chưa đi tiếp) có `data-state="complete"`, một bước lỗi ở đó có `data-state="error"`, nhưng nó vẫn là chỗ người dùng đang đứng. `value` bằng số bước thì không bước nào có `data-current`. Chữ của bản hẹp, viên thuốc của `compact` và độ đậm của tiêu đề bước hiện tại đọc `data-current`; dấu tròn, thanh và màu đọc `data-state` (phát hiện khi review PR #28: bước hiện tại có `status="complete"` mất tên ở bản hẹp và mất viên thuốc). CSS không đọc `aria-current`, vì `aria-current` có thể nằm trên nút (§6.3).
- **Phần bên trong** (`.flg-step-inner`) là `<button>` khi bước bấm được, `<span>` khi không. Nút được reset: `appearance: none`, không viền, không nền, `font: inherit`, `color: inherit`, `text-align: inherit`, `cursor: pointer`.
- **Chữ:** tiêu đề `--flg-text-sm`, `line-height: 1.3`, đậm `--flg-weight-medium`, màu `--flg-text`; mô tả `--flg-text-xs`, `line-height: 1.35`, màu `--flg-text-muted`.
  - Bước ở `value` (`data-current`, kể cả khi đã xong): tiêu đề đậm `--flg-weight-semibold` (phát hiện khi review PR #28).
  - `upcoming`: tiêu đề đậm `--flg-weight-regular`, màu `--flg-text-muted`.
  - `error`: tiêu đề và mô tả màu `--flg-danger`, tiêu đề đậm `--flg-weight-semibold`.
- **Đường nối chưa đi:** đường mờ 45% (§4.2), trang trí. Đường nối đã đi: `--flg-accent-solid`.
- **Focus:** vòng focus chung trên `.flg-step-inner` (`outline` 2px `--flg-focus-outline-color`, cách 2px, `--flg-focus-ring`), như `.mk-focus` của mockup.
- **Hover** (ngoài mockup; bản quyết định ban đầu để spec quyết): bước bấm được và không phải bước hiện tại có nền `--flg-control-track` trên `.flg-step-inner` khi `@media (hover: hover)`, như nút `ghost` và trang của Pagination (Claude chốt). Không thêm dấu hiệu nào khác cho bước bấm được ngoài con trỏ, focus và hover này. Bước lỗi bấm được cũng vậy, vì đó là bước người dùng hay quay lại sửa nhất: quy tắc hover (`.flg-stepper .flg-step > button.flg-step-inner:not([aria-current]):hover`, độ ưu tiên 0,5,1) thắng viên thuốc đỏ của `compact` (0,5,0). Ở `prefers-contrast: more` viên thuốc đỏ là nền đỏ đặc với chữ màu trên nền đỏ, nên bước lỗi giữ nền đỏ khi hover, như hàng của List không đổi nền khi hover ở chế độ đó (phát hiện khi review PR #28).
- **Ngang và đủ rộng:** chữ xuống dòng trong cột của bước (`circles`, `bars`); `compact` giữ chữ trên một dòng như mockup, tên dài làm đường nối ngắn lại (tối thiểu 12px); tên vẫn không vừa thì bị cắt bằng dấu chấm lửng, ở cả dạng rộng lẫn dạng hẹp: phần bên trong và chữ của bước được co nhỏ hơn nội dung (`min-width: 0`, tiêu đề và mô tả `overflow: hidden; text-overflow: ellipsis`), nên các bước không bao giờ chồng nhau và không tràn mép phải của Stepper; tên đầy đủ vẫn nằm trong chữ truy cập (phát hiện khi review cuối Plan B). Chỗ được chia như lưới CSS chia cột, không như flex: mỗi bước co được về 0 nhưng được lớn tới hết nội dung (max-content) trước, bước có tên ngắn lấy đủ chỗ rồi dừng, và chỉ bước còn thiếu chỗ mới bị cắt. Flex co mọi bước theo tỷ lệ chiều rộng của nó, nên một tên dài làm các tên ngắn cũng bị cắt; tên đủ chỗ thì không đổi (phát hiện khi review PR #28).
- **Hẹp** (`@container flg-stepper (width < 480px)`, chỉ ngang; §3.5): chữ của mọi bước không ở `value` (`data-current`) và không `error` bị ẩn khỏi mắt (bước ở `value` giữ tên dù đã xong; phát hiện khi review PR #28) bằng kỹ thuật `flg-visually-hidden` (vẫn được đọc). Ở `circles` và `bars`, chữ còn lại không xuống dòng và có thể tràn sang cột bên cạnh (cột đó không có chữ). Riêng bước đầu và bước cuối không có cột bên cạnh ở một phía, nên chữ còn lại của bước đầu neo về đầu và chữ của bước cuối neo về cuối, tràn về phía có cột bên cạnh (`align-self: flex-start` / `flex-end`, `text-align: start` / `end`); dấu tròn và thanh giữ nguyên vị trí, chữ không bao giờ ra ngoài hộp của Stepper và trang không rộng thêm (phát hiện khi review cuối Plan B). Chữ còn lại giữ chiều rộng của chính nó trên một dòng khi còn chỗ (`width: max-content; white-space: normal`, nên tên ngắn giữ nguyên hộp), và xuống dòng ở mép chỗ của bước, tính bằng đơn vị `cqi` của container `flg-stepper`: bước giữa của `circles` (chữ căn giữa dưới dấu tròn, tâm cột `c = (index + .5) * 100cqi / count`) rộng tối đa `2 * min(c, 100cqi - c)`; bước giữa của `bars` (chữ bắt đầu ở đầu cột, các cột cách nhau 8px) rộng tối đa `100cqi` trừ đầu cột, và không hẹp hơn cột (`min-width: 100%`, hộp nó có trước đây); bước đầu và bước cuối, neo về một mép, rộng tối đa cả Stepper (`circles` trừ padding 8px hai bên của nút: `100cqi - 16px`; `bars`: `100cqi`). `count` và `index` là custom property `--flg-step-count` trên `<ol>` và `--flg-step-index` trên mỗi `<li>`, do component đặt và gộp với `style` của người dùng (phát hiện khi review PR #28: tên dài của một bước giữa, như "Review your order details" ở bước 3 của 4 trong khung 320px, tràn qua mép Stepper và làm trang cuộn ngang). Ở `compact` chữ không tràn: cột bên cạnh có dấu tròn và đường nối, không trống, nên tên dài của viên thuốc bị cắt bằng dấu chấm lửng như ở dạng rộng, với cùng cách chia chỗ (thay cho "có thể tràn" và cho việc căn `flex-end` bước cuối; phát hiện khi review PR #28). Chi tiết theo từng variant bên dưới. Bản quyết định ban đầu nói "các bước khác chỉ còn dấu tròn"; `bars` thì chỉ còn thanh, và bước `error` cũng giữ chữ, theo mockup.

**`circles` (St1, mặc định):** vòng tròn số 30px, tên bên dưới.

- **Ngang:** lưới, mỗi bước một cột bằng nhau (`grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr)`; cùng kết quả với `repeat(4, …)` của mockup cho mọi số bước; Claude chốt). `<li>`: `position: relative`, `flex`, căn giữa ngang, `min-width: 0`.
- **Phần bên trong:** cột dọc, căn giữa, khoảng cách 6px, padding `4px 8px`, bo `--flg-radius-md`, chữ căn giữa.
- **Dấu tròn:** 30×30px, `box-sizing: border-box`, bo 50%, viền 1.5px `--flg-stepper-ring`, chữ số `--flg-text-sm` đậm `--flg-weight-semibold`, `line-height: 1`, `tabular-nums`, màu `--flg-text-muted`; icon bên trong 14px.
  - `complete`: nền `--flg-accent-solid`, viền trong suốt, dấu ✓ màu `--flg-on-accent`.
  - `current`: nền `--flg-control-bg`, viền 2px `--flg-accent-solid`, số màu `--flg-accent-text`, quầng `0 0 0 4px color-mix(in srgb, var(--flg-accent-solid) 18%, transparent)`.
  - `error`: nền `--flg-danger-fill`, viền trong suốt, dấu "!" màu `--flg-on-danger`, quầng `0 0 0 4px color-mix(in srgb, var(--flg-danger) 16%, transparent)`.
- **Chữ:** cột dọc, khoảng cách 2px, `min-width: 0`.
- **Đường nối ngang:** `::before` của mỗi `<li>` trừ bước đầu, cao 2px, bo 2px, cách đỉnh 18px (qua tâm dấu tròn), `left: calc(-50% + 22px)`, `right: calc(50% + 22px)` (nối từ dấu tròn của bước trước tới dấu tròn của bước này, cách mép mỗi dấu 7px). Đường trước một bước có màu đã đi khi bước trước nó là `complete`.
- **Dọc:** cột dọc; `<li>` căn trái, cách dưới 22px (bước cuối 0); phần bên trong thành hàng, căn trên, khoảng cách 12px, padding 0, chữ căn trái; chữ cách trên 6px. Đường nối dọc là `::after` của mọi bước trừ bước cuối: rộng 2px, bo 2px, cách trái 14px, từ 34px dưới đỉnh tới 4px trên đáy `<li>`; màu đã đi khi chính bước đó là `complete`. Đường nối ngang không có ở dạng dọc.
- **Hẹp:** chữ bị ẩn như phần chung; chữ còn lại không xuống dòng khi còn chỗ, và xuống dòng ở mép chỗ của bước (phần chung; phát hiện khi review PR #28).

**`compact` (St2):** vòng 22px, tên bên phải, bước hiện tại trong viên thuốc.

- **Ngang:** lưới một hàng, mỗi bước một cột (`grid-auto-flow: column`), căn giữa dọc. Mọi bước trừ bước cuối nằm trong cột `minmax(0, auto)`, bước cuối trong cột `minmax(0, max-content)`; số cột lấy từ custom property `--flg-step-count` mà component đặt trên `<ol>` (gộp với `style` của người dùng). Khi còn chỗ, các cột `auto` giãn đều, nên các đường nối dài bằng nhau như với flex trước đây, còn cột cuối không giãn (phát hiện khi review PR #28; trước đó là `flex` và `flex: 1 1 auto`). `<li>`: `flex`, căn giữa dọc, `min-width: 0`. Đường nối là `::after` của mọi bước trừ bước cuối: co giãn, rộng tối thiểu 12px (giữ được nhờ tên bị cắt, xem "Ngang và đủ rộng"; phát hiện khi review cuối Plan B), cao 2px, cách hai bên 6px, bo 2px; màu đã đi khi bước đó là `complete`.
- **Phần bên trong:** `inline-flex`, căn giữa dọc, khoảng cách 8px, padding `4px 12px 4px 4px`, bo `--flg-radius-full`, không xuống dòng.
  - Bước ở `value` (`data-current`): nền `--flg-selected-bg`; bước đó đã xong thì dấu ✓ của nó nằm trong viên thuốc (phát hiện khi review PR #28).
  - `error`: nền `--flg-highlight-danger-bg`, kể cả khi bước lỗi nằm ở `value`.
- **Dấu tròn:** 22×22px, viền 1.5px `--flg-stepper-ring`, chữ số `--flg-text-xs` đậm `--flg-weight-semibold`, `line-height: 1`, `tabular-nums`, màu `--flg-text-muted`; icon 12px.
  - `complete`: nền `--flg-accent-subtle`, viền trong suốt, ✓ màu `--flg-accent-text`.
  - `current`: nền `--flg-control-bg`, viền 2px `--flg-accent-solid`, số màu `--flg-accent-text`.
  - `error`: nền `--flg-danger-fill`, viền trong suốt, "!" màu `--flg-on-danger`.
- **Chữ:** cột dọc, khoảng cách 1px. Bước ở `value` (`data-current`) không lỗi: tiêu đề đậm `--flg-weight-semibold`, màu `--flg-selected-text`; mô tả giữ `--flg-text-muted` như mockup, và lấy `--flg-selected-text` ở `prefers-contrast: more`, vì viên thuốc khi đó thành nền nhấn đặc (như hàng hiện tại của List; Claude chốt, phát hiện khi đọc soát spec). `error`: tiêu đề và mô tả dùng `--flg-highlight-danger-text` thay cho `--flg-danger` của mockup (Claude chốt): hai token bằng nhau ở mặc định, còn ở `prefers-contrast: more` viên thuốc thành nền đỏ đặc và chữ phải đổi theo.
- **Dọc:** cột dọc, các bước giãn hết chiều ngang; `<li>` là khối `position: relative`, cách dưới 12px (bước cuối 0). Đường nối dọc là `::after` của mọi bước trừ bước cuối: rộng 2px, bo 2px, cách trái 14px, từ 30px dưới đỉnh tới 2px dưới đáy `<li>`. Phần bên trong thành `flex`, căn trên, được xuống dòng, bo `--flg-radius-lg`; chữ padding `3px 0 2px`.
- **Hẹp:** chữ bị ẩn như phần chung; phần bên trong của các bước đó còn padding 4px (chỉ còn dấu tròn); đường nối vẫn cách hai bên 6px như ở dạng rộng (quy tắc 4px của mockup có độ ưu tiên thấp hơn quy tắc ngang nên chưa bao giờ áp dụng, và hình đã duyệt vẽ 6px; phát hiện khi review cuối Plan B). Tên dài của bước còn chữ bị cắt như ở dạng rộng, không tràn (phát hiện khi review PR #28).

**`bars` (St3):** mỗi bước là một thanh 6px, không có vòng tròn.

- **Ngang:** lưới cột bằng nhau như `circles`, khoảng cách 8px. `<li>`: `flex`, `min-width: 0`.
- **Phần bên trong:** cột dọc, khoảng cách 8px, rộng 100%, padding 6px, margin -6px, bo `--flg-radius-md`, `box-sizing: content-box` (vùng focus và hover rộng hơn thanh 6px mỗi phía).
- **Thanh:** cao 6px, bo `--flg-radius-full`, nền `--flg-control-track`.
  - `complete`: `linear-gradient(90deg, var(--flg-accent-start), var(--flg-accent-end))`. Người vẽ chọn gradient vì màu nhấn đặc trên dark chỉ ~2,77:1.
  - `current`: gradient đó phủ nửa trái (`0 0 / 50% 100% no-repeat`) trên nền `--flg-control-track`.
  - `error`: `--flg-danger`.
- **Chữ:** cột dọc, khoảng cách 2px. Dòng "Step N" (`labels.caption`, §6.3): `inline-flex`, căn giữa dọc, khoảng cách 4px, `--flg-text-2xs`, đậm `--flg-weight-semibold`, `letter-spacing: .05em`, chữ hoa, `line-height: 1.3`, màu `--flg-text-muted`; icon 12px. `complete` và `current`: màu `--flg-accent-text`; `error`: `--flg-danger`. Bước `complete` có ✓, bước `error` có "!" trước chữ.
- **Dọc:** cột dọc, khoảng cách 6px; phần bên trong thành hàng, khoảng cách 12px, padding và margin 0; thanh rộng 4px, cao theo hàng (`align-self: stretch`), gradient theo chiều dọc (`180deg`), `current` phủ nửa trên (`0 0 / 100% 50%`); chữ padding `2px 0 6px`.
- **Hẹp:** chỉ còn các thanh; chữ của bước ở `value` và bước `error` không xuống dòng khi còn chỗ, và xuống dòng ở mép chỗ của bước (phần chung; phát hiện khi review PR #28).

**Dark:** chỉ khác giá trị token.

#### List

**Phần chung:**

- **Gốc:** `<ul role="list">` (§6.3), margin và padding 0, `list-style: none`.
- **Hàng:** `position: relative`, `flex`, căn giữa dọc, khoảng cách 12px, `box-sizing: border-box`, padding `8px 12px`, `--flg-text-sm`. Cao tối thiểu 52px (`size` `md`, danh sách thành viên của mockup) hoặc 44px (`size` `sm`, danh sách điều hướng của mockup).
- **Ô đầu** (`start`): `inline-flex`, căn giữa, không co, tối thiểu 32×32px, màu `--flg-text-muted`; icon con trực tiếp 18px. Avatar `md` (32px) vừa đúng ô.
- **Cột giữa:** chiếm phần còn lại, `min-width: 0`, cột dọc, khoảng cách 2px.
  - Tiêu đề: màu `--flg-text`, đậm `--flg-weight-medium`, `line-height: 1.3`, không gạch chân; một dòng, dài thì "…" như mô tả (phát hiện khi lập Plan B: không cắt thì tiêu đề dài đẩy ô cuối ra ngoài hàng).
  - Mô tả: `--flg-text-xs`, `line-height: 1.35`, màu `--flg-text-muted`, một dòng, dài thì "…".
- **Ô cuối** (`end`): `inline-flex`, căn giữa dọc, khoảng cách 8px, không co, màu `--flg-text-muted`, `--flg-text-xs`; icon con trực tiếp 16px. Chính ô cuối là lớp nằm trên liên kết kéo giãn: `position: relative; pointer-events: none`; nó đứng sau `::after` của tiêu đề trong cây nên được vẽ trên lớp phủ đó mà không cần `z-index`. Những gì bấm được bên trong lấy lại con trỏ bằng `pointer-events: auto` trên `:where(a, button, input, select, textarea, label, [tabindex], .flg-slider, dialog, [popover])`: `.flg-slider` vì rãnh của Slider được bấm ở chỗ không có `[tabindex]`; `dialog` và `[popover]` vì hộp thoại, menu và popover mở từ ô cuối nằm trong top layer nhưng vẫn ở trong ô cuối trong DOM (Claude chốt). Chữ thường trong ô cuối (như "2 hours ago") không nhận con trỏ, nên bấm vào đó là bấm tiêu đề, đúng với "bấm vào bất kỳ đâu trong hàng". Không phần tử nào trong ô cuối có `z-index`, nên control giữ cách xếp lớp của riêng nó: thumb có focus của Slider khoảng vẫn nằm trên thumb kia, input ẩn của Switch và `<select>` gốc của Select vẫn đè lên phần nhìn thấy. Thay cho quy tắc `position: relative; z-index: 1` trên mọi control trong layer `flg.base` của review cuối Plan B, vốn đè mất `z-index` của thumb có focus và lọt vào các popup (phát hiện khi review PR #28). `Button` trong ô cuối có margin `-4px -6px -4px 0`.
- **Liên kết kéo giãn:** tiêu đề là `<a>` hoặc `<button>` (§6.3) với `::after` phủ kín cả hàng (`position: absolute; inset: 0`), bo theo hàng; nó tự bỏ `outline` vì vòng focus vẽ trên hàng. Mức bo là biến `--flg-list-item-radius` mà mỗi variant đặt trên hàng (phát hiện khi lập Plan B: `border-radius: inherit` như mockup lấy từ tiêu đề, vốn không bo, nên vùng bấm vuông góc). Tiêu đề không có `position`, nên `overflow: hidden` của nó không cắt lớp phủ.
- **Gốc** có `min-width: 0` (phát hiện khi lập Plan B): List là một mục của hàng flex cạnh một ô khác thì co về phần còn lại, không bị chữ dài đẩy rộng hơn khung. Story `no-visual` đo cả khối lẫn hàng flex.
- **Hàng hiện tại** (`current`): tiêu đề màu `--flg-selected-text`, đậm `--flg-weight-semibold`; ô đầu màu `--flg-selected-text`.
- **Hàng disabled:** cả hàng `opacity: .5`; tiêu đề `cursor: not-allowed`. Hàng disabled không mang `data-interactive` (chỉ hàng bấm được và không disabled mới có), nên không đổi khi rê chuột; nó mang `data-disabled`.
- **Hover:** chỉ hàng bấm được và không disabled (`data-interactive`), khi `@media (hover: hover)`. Mockup chỉ vẽ hover trên một hàng liên kết; hàng tĩnh không đổi khi rê chuột (Claude chốt). Ở `prefers-contrast: more` hàng không đổi nền khi hover (`cards` vẫn nổi lên và đậm bóng), cùng lý do với hàng của Table: một Badge `accent` ở ô cuối chỉ còn 3.99:1 light trên nền hover ở chế độ đó (Claude chốt, phát hiện khi đọc soát spec).
- **Focus:** vòng focus chung vẽ trên hàng khi tiêu đề khớp `:focus-visible` (`.flg-list-item:has(> .flg-list-item-main > .flg-list-item-title:focus-visible)`), như `.mk-focus` của mockup. Vòng focus tràn 4px ra ngoài hàng: vào hàng sau ở `plain` (hai hàng cách nhau 2px), vào bóng của thẻ sau ở `cards`, vào hàng sau ở `inset`; hàng sau vẽ sau nên sẽ che nó. Vì vậy hàng có focus có `z-index: 1` ở mọi variant, không chỉ `inset` (phát hiện khi review PR #28). Story `no-visual` đọc điểm ảnh giữa outline ngay dưới hàng có focus (với màu thuần cho vòng focus, nền hàng hiện tại, nền hover và bóng của thẻ), ở `plain` và `cards`, khi hàng sau là hàng hiện tại và khi nó đang được rê chuột: điểm đó là màu của vòng focus. Không dùng `elementFromPoint` được, vì outline và bóng không nhận con trỏ.

**`inset` (L1, mặc định):** một khối kính, kẻ ngăn giữa các hàng.

- Gốc là một `Surface` (lớp `flg-surface`: kính, bo `--flg-radius-lg`, viền gradient 1px), padding 0.
- Đường ngăn: `::before` của mỗi hàng trừ hàng đầu, cao 1px, sát mép trên, từ 56px (sau ô đầu 32px: 12 + 32 + 12) tới mép phải, màu `--flg-control-border`. Hàng không có ô đầu thì đường bắt đầu từ 12px (Claude chốt; mockup luôn có ô đầu). Đường có `pointer-events: none`, như vạch của hàng hiện tại (phát hiện khi review PR #28).
- Hàng đầu bo hai góc trên, hàng cuối bo hai góc dưới, bằng `calc(var(--flg-radius-lg) - 1px)`, để nền hover và nền hàng hiện tại khớp góc trong của khối. Danh sách chỉ có một hàng thì hàng đó bo cả bốn góc (phát hiện khi lập Plan B; mockup luôn có nhiều hàng).
- Hover: nền `--flg-control-track`.
- Hàng hiện tại: nền `--flg-selected-bg`; vạch `::after` ở mép trái, cách trên và dưới 8px, rộng 3px, bo `0 3px 3px 0`, màu `--flg-accent-solid`, `pointer-events: none`: nó vẽ sau liên kết kéo giãn, nên không có thuộc tính này thì bấm vào mép trái của hàng không theo liên kết, như lớp `::before` của `cards` vốn đã có (phát hiện khi review PR #28).
- Focus: hàng có focus có `z-index: 1` (phần chung), để vòng focus tràn ra ngoài khối mà không bị hàng bên cạnh che (mockup ghi nhận vòng focus tràn ra ngoài khối).

**`cards` (L2):** mỗi hàng một thẻ kính.

- Gốc: cột dọc, khoảng cách 6px, padding 0.
- Mỗi hàng là một tấm kính như `Surface`, bo `--flg-radius-md`, bóng `--flg-list-card-shadow` thay cho `--flg-glass-shadow`, `isolation: isolate`.
  - `ListItem` không biết variant của `List` (cả hai là server-safe, không có context), nên không tự thêm lớp `flg-surface` được. Các khai báo kính của `.flg-surface` (viền trong suốt, ba lớp nền noise, tint và gradient viền, origin và clip, `backdrop-filter`) nằm trong một quy tắc riêng của `surface.css` có selector `.flg-surface, .flg-list[data-variant='cards'] > .flg-list-item`, nên chỉ có một nguồn; `list.css` chỉ giữ phần khác với `Surface` (bo, bóng, `isolation`, lớp `::before`). Selector của hàng giữ độ ưu tiên riêng (0,3,0), và các quy tắc `cards` của `list.css` đứng sau nên vẫn thắng (phát hiện khi review PR #28; trước đó `list.css` chép lại các khai báo đó, nên một thay đổi của `.flg-surface` sẽ lặng lẽ bỏ sót hàng `cards`). Quy tắc chung của `.flg-surface` (bo `--flg-radius-lg`, `--flg-glass-shadow`, màu chữ, font) không áp lên hàng. Các token của chế độ `solid` và `prefers-contrast: more` vẫn tự áp dụng, vì chúng đổi token chứ không đổi lớp.
- Nền hover và nền hàng hiện tại vẽ trên `::before` (phủ kín, `z-index: -1`, bo theo hàng, không nhận con trỏ), dưới nội dung và trên lớp kính.
  - `isolation: isolate` là của spec (Claude chốt): mockup dựa vào `backdrop-filter` để mỗi thẻ thành một stacking context. Ở chế độ `solid` (không có `backdrop-filter`) lớp `z-index: -1` sẽ chui xuống dưới nền kính và biến mất.
- Hover: bóng `--flg-list-card-shadow-hover`, `translate: 0 -1px`, nền `::before` `--flg-list-card-hover-bg`; chuyển trong `--flg-duration-fast` (ngoài mockup).
- Hàng hiện tại: `outline: 1.5px solid var(--flg-accent-solid)`, `outline-offset: -1px`; nền `::before` `--flg-selected-bg`.
- Focus: `outline` của vòng focus chung và `box-shadow: var(--flg-focus-ring)` (thay bóng của thẻ). Hàng vừa hiện tại vừa có focus thì `outline` của focus thắng: ở `prefers-contrast: more` và forced colors, `outline` là dấu hiệu focus duy nhất, nên nó không được nhường (Claude chốt). Hàng đó vẫn có nền và tiêu đề của hàng hiện tại.

**`plain` (L3):** hàng phẳng, không kẻ ngăn.

- Gốc: cột dọc, khoảng cách 2px, margin `0 -8px` (nền hover của hàng tràn vào padding của thẻ chứa, còn chữ thẳng hàng với nội dung xung quanh; mockup đặt List trong một Card).
- Hàng: padding 8px, bo `--flg-radius-md`.
- Hover: nền `--flg-control-track`. Hàng hiện tại: nền `--flg-selected-bg`.

**Dark:** chỉ khác giá trị token, trừ bóng và nền hover của `cards` (§4.2).

#### Table

**Phần chung:**

- **Khung cuộn** (`.flg-table-frame`): `overflow: auto` ở mọi variant, ngay từ HTML của server (§3.5). Mang `className` và `style` của `Table` (§6.3); người dùng đặt chiều cao tối đa ở đây khi dùng `stickyHeader`. Khung có `position: relative` (phát hiện khi lập Plan C): chữ ẩn bằng `.flg-visually-hidden` trong ô (tiêu đề cột chỉ có chữ cho trình đọc màn hình) là `position: absolute`, và không có khung làm hệ quy chiếu thì nó nằm ở vị trí tĩnh của cột, ngoài vùng cắt của khung, làm cả trang cuộn ngang khi cột đó ở quá mép phải.
- **Khung cuộn và vòng focus** (Claude chốt, phát hiện khi đọc soát spec). Yêu cầu: khung không cắt dấu hiệu focus nào của control bên trong bảng, ở mọi chế độ; ngoại lệ duy nhất là quầng `--flg-focus-ring` ở `lined`, vì mockup T1 đã cắt nó (khung `overflow: hidden`). Theo số đo của mockup, nút sắp xếp nằm cách mép bảng chừng 1–3px (`striped`: `border-spacing` 2px, padding 4px, margin −3px), nên một khung cuộn không có padding cắt quầng của nó ở `striped` và `minimal` (mockup T2, T3 vẽ quầng nguyên vẹn), và ở `prefers-contrast: more` cắt 1–3px của outline 2px cách 2px; ở `lined` cỡ `sm` cũng vậy.
  - `striped`, `minimal`: khung có padding 6px và margin −6px ở cả bốn phía, đúng cách hàng tab cuộn được của Tabs (chủ dự án chọn B; `tabs.css`). Bảng không xê dịch pixel nào; mép cắt của khung lùi ra 6px, nên quanh nút sắp xếp còn ít nhất 7px, đủ cho outline (4px) và vòng 3px của `--flg-focus-ring`. Phần nhạt nhất ở rìa quầng mờ của nó (blur 12px light, 10px dark) còn có thể chạm mép khung, như ở hàng tab cuộn được mà chủ dự án đã duyệt. Khung không có `max-width: 100%`: chiều rộng tự động là vùng chứa cộng 12px. Khác Tabs, margin âm có ở cả trục ngang, vì padding ngang không bù sẽ đẩy bảng vào 6px so với mockup (hệ quả ở §10).
  - `lined`: khung giữ viền và góc bo, nội dung sát viền như mockup T1, nên vẫn cắt. Ở `prefers-contrast: more` và forced colors, hai chế độ mà `outline` là dấu hiệu focus (ngoài mockup), control của lib trong khung `lined` vẽ outline vào trong: `outline-offset: -2px` cho nút sắp xếp, `Button` và `IconButton` trong ô, ô vuông của Checkbox, rãnh của Switch và chấm của Radio (phát hiện khi review cuối Plan C). Ở `sm`, Checkbox và IconButton ở hàng thân cuối chỉ cách mép khung 3px. Forced colors được thêm vì cùng lý do: chế độ đó bỏ `box-shadow`, nên outline là dấu hiệu duy nhất.
  - Nội dung riêng của người dùng trong ô (link…) không có quy tắc này; docs nói khung `lined` cắt sát viền.
- **Bảng:** rộng 100%, `border-collapse: separate`, `border-spacing: 0`, `--flg-font-sans`, `--flg-text-sm`, `line-height: 1.3`, màu `--flg-text`, `font-variant-numeric: tabular-nums`.
- **Ô** (`th`, `td`): padding `var(--py) var(--px)`, căn đầu dòng, `vertical-align: middle`, không xuống dòng. Bảng rộng hơn khung thì khung cuộn ngang (người dùng đổi `white-space` của ô qua `className` nếu muốn chữ xuống dòng).
  - `md`: `--py` 8px, `--px` 12px; `sm`: `--py` 3px, `--px` 8px, cả bảng `--flg-text-xs`.
- **Ô tiêu đề cột** (trong `thead`): padding dọc `--hpy` (8px ở `md`, 5px ở `sm`), `--flg-text-xs`, đậm `--flg-weight-semibold`, màu `--flg-text-muted`.
- **`align`:** `start`, `center`, `end` thành `text-align` tương ứng.
- **Ô chỉ chứa một Checkbox hoặc một IconButton** tự co lại như cột ô chọn và cột thao tác của mockup (Claude chốt; mockup dùng lớp riêng `mk-sel`, `mk-act`):
  - `:has(> .flg-checkbox:only-child)`: rộng 16px, padding cuối dòng 4px.
  - `:has(> .flg-button[data-icon-only]:only-child)`: rộng 28px, padding ngang `4px 8px`.
  - Checkbox và Button trong ô: `vertical-align: middle`.
- **Nút sắp xếp** (trong `th` có `onSort`): `inline-flex`, căn giữa dọc, khoảng cách 4px, margin `-3px -6px`, padding `3px 6px`, không viền, không nền, bo `--flg-radius-xs`, `font`, `color`, `text-transform` và `letter-spacing` kế thừa, `cursor: pointer`. Icon 14px không co, màu `--flg-text-muted` (đặt trên `<span>` bọc icon, §4.5).
  - Cột đang sắp (`aria-sort` `ascending` hoặc `descending`): chữ `--flg-text`, icon `--flg-accent-text`. Icon: mũi tên xuống khi `descending`, mũi tên lên khi `ascending` (mockup chỉ vẽ `descending`; Claude chốt), chevron lên–xuống khi chưa sắp.
  - Cột căn `end`: icon đứng trước nhãn (`flex-direction: row-reverse`), để chữ thẳng với số.
  - Hover (ngoài mockup): nền `--flg-control-track` khi `@media (hover: hover)`, như nút `ghost` (Claude chốt).
  - Focus: vòng focus chung trên nút.
- **Hàng thân khi hover:** chỉ con trỏ thật (`@media (hover: hover)`). Ở `prefers-contrast: more` hàng không đổi nền khi hover (ngoài mockup; Claude chốt, phát hiện khi đọc soát spec): chữ của Badge `accent` trên nền `--flg-control-track` chỉ 3.99:1 light ở chế độ đó (§4.4), và hover chỉ là phản hồi phụ.
- **Hàng đã chọn** (`selected`): nền `--flg-accent-subtle` (Claude chốt). Mockup ghi `--flg-selected-bg`, bằng đúng `--flg-accent-subtle` ở mặc định; còn ở `prefers-contrast: more`, `--flg-selected-bg` thành nền nhấn đặc, mà một hàng bảng chứa Badge, Checkbox, nút và chữ mờ. Trạng thái chọn do Checkbox trong hàng nói (§6.3), nên nền hàng chỉ là dấu hiệu phụ.
  - Ở `prefers-contrast: more` (ngoài mockup; Claude chốt, phát hiện khi đọc soát spec): hàng đã chọn bỏ nền nhuộm và có một khung trong 2px `--flg-accent-solid` quanh hàng, vẽ bằng bóng trong trên các ô (mọi ô có cạnh trên và cạnh dưới, ô đầu thêm cạnh trái, ô cuối thêm cạnh phải; ở `lined` khung này thay vạch 3px). Lý do: chữ của Badge `accent` trên hai lớp nhuộm chỉ 4.17:1 light ngay ở chế độ này (§4.4). Khung đạt 6.07:1 light, 7.42:1 dark so với bề mặt.
- **`TableCaption`** (ngoài mockup, mockup đặt tên bảng ở tiêu đề thẻ): `caption-side: top`, căn đầu dòng, padding `var(--py) var(--px)`, `--flg-text-sm` đậm `--flg-weight-semibold`, màu `--flg-text`. Docs khuyên `aria-labelledby` trỏ vào tiêu đề có sẵn khi bảng nằm dưới một tiêu đề nhìn thấy (§6.3).
- **`stickyHeader`** (ngoài mockup, Claude chốt): cả `<thead>` (`.flg-table-header`) là `position: sticky; top: 0; z-index: 1`, không phải từng ô: tiêu đề nhiều hàng (một hàng `colSpan` nhóm cột nằm trên hàng tên cột) dính thành một khối, các hàng giữ nguyên thứ tự và không đè lên nhau (phát hiện khi review PR #29; trước đó mỗi ô dính ở `top: 0` nên hàng dưới phủ hàng trên). Ba engine đều dính được `<thead>`. Các ô tiêu đề có thêm một lớp nền `--flg-glass-tint-solid` dưới nền riêng của variant (nếu có), để các hàng cuộn qua không hiện xuyên qua tiêu đề. Ở dạng này, tiêu đề hơi đục hơn kính của thẻ chứa; chủ dự án duyệt khi xem story. Trong khung có padding (`striped`, `minimal`), Plan C kiểm ở ba engine rằng tiêu đề dính sát mép trên của vùng cuộn, không để các hàng hiện qua một dải 6px phía trên nó, và đặt `top` bằng âm padding nếu engine tính chỗ dính từ mép trong của padding. Kết quả đã kiểm (phát hiện khi lập Plan C): cả ba engine tính từ mép trong của padding, nên `striped` và `minimal` đặt `top: -6px` trên `<thead>`. `scroll-padding-top` của khung là chiều cao thật của `<thead>`, không phải ước lượng từ padding (phát hiện khi review PR #29: tiêu đề có nút 28px, hay nhiều hàng, cao hơn ước lượng nên control nhận focus từ phía dưới còn nằm một phần dưới tiêu đề): `Table` (client) đo `<thead>` bằng `ResizeObserver` và đặt custom property `--flg-table-head-height` lên khung, chỉ khi có `stickyHeader`, lấy chiều cao từ `borderBoxSize[0].blockSize` của entry (giữ phần thập phân và không theo `transform`; thiếu thì dùng `offsetHeight`), không dùng `getBoundingClientRect()` vì panel của Dialog vào ở `scale(0.96)` và không gì quan sát một `transform` đổi (phát hiện khi review PR #29 lần hai); trước lần đo đầu và khi không có script, CSS dùng ước lượng cũ `2 * var(--flg-table-hpy) + 1.25rem`. Ở `striped`, 2px `border-spacing` giữa các hàng của tiêu đề nhiều hàng không thuộc ô nào (nền của `<thead>` không vẽ vào khoảng đó ở cả ba engine), nên ô của các hàng sau hàng đầu có một `::before` cao 2px (`position: absolute; z-index: -1; inset: -2px 0 auto`) cùng màu nền đặc để lấp nó, thay cho `box-shadow` vì forced colours bỏ shadow còn giữ màu nền (`Canvas`; phát hiện khi review PR #29 lần hai); tiêu đề một hàng không đổi (hàng đầu không có lớp phủ vì nó sẽ vẽ cả lúc nghỉ). Ở WebKit, hộp `<thead>` của `striped` chứa cả 2px spacing phía trên hàng của nó, nên ô tiêu đề thấp hơn mép khung 2px, và 2px đó không có nền (chỉ ở WebKit; Chromium và Firefox giữ ô sát mép).
- **Focus của khung cuộn** (khi nó là vùng cuộn được, §6.3): vòng focus chung theo hình của khung.

**`lined` (T1, mặc định):** khung viền, tiêu đề và hàng chân có dải nền, kẻ giữa các hàng.

- Khung: viền 1px `--flg-control-border`, bo `--flg-radius-md` (khung cuộn cắt nội dung theo góc bo, như `overflow: hidden` của mockup).
- Ô tiêu đề cột: nền `--flg-control-bg-secondary`, viền dưới 1px `--flg-control-border`.
- Ô thân: viền dưới 1px `--flg-control-border`; hàng thân cuối không có.
- Ô hàng chân: nền `--flg-control-bg-secondary`, viền trên 1px `--flg-control-border`, đậm `--flg-weight-semibold`.
- Hover: nền hàng `--flg-control-track`. Hàng đã chọn: nền hàng `--flg-accent-subtle`, ô đầu có vạch nhấn trong `inset 3px 0 0 var(--flg-accent-solid)`.

**`striped` (T2):** sọc xen kẽ bo tròn, không kẻ.

- `--hpy` 4px (`sm` 3px); `border-spacing: 0 2px` (các hàng cách nhau 2px).
- Ô tiêu đề cột: `--flg-text-2xs`, chữ hoa, `letter-spacing: .06em`.
- Ô đầu và ô cuối của mỗi hàng thân và hàng chân bo hai góc phía ngoài bằng `--flg-radius-md` (`border-start-start-radius`… để đúng cả khi viết từ phải sang trái sau này).
- Hàng lẻ: các ô có nền sọc (§4.2). Hover: các ô nền `--flg-control-track`. Ở dark sọc và hover gần nhau hơn, đúng như mockup.
- Hàng đã chọn: nền `--flg-accent-subtle` **vẽ một lần cho cả hàng**, không lặp lại theo từng ô (ghi chú của người vẽ: gradient của light lặp theo ô sẽ thành các vệt ở ranh giới ô). Spec vẽ nó trên `<tr>` (các ô của hàng đó bỏ nền sọc và nền hover) và bo hai đầu bằng `clip-path: inset(0 round var(--flg-radius-md))` trên `<tr>` (Claude chốt; kiểm ở Plan C, §10). Kết quả đã kiểm (phát hiện khi lập Plan C): cả ba engine cắt được `<tr>`; Chromium và WebKit vốn đã vẽ nền hàng theo góc bo của ô đầu và ô cuối, chỉ Firefox vẽ hình chữ nhật nên cần `clip-path`. Khi một control trong hàng đang có focus bàn phím (`:has(:focus-visible)`), hàng không bị cắt: ở `sm` hàng thấp hơn vòng focus của nút ở ô cuối nên đường cắt sẽ lấy mất phần vòng nằm ngoài hàng; Chromium và WebKit vẫn giữ góc bo nhờ các ô, Firefox hiện góc vuông cho tới khi focus rời đi. Ở `prefers-contrast: more` hàng đã chọn không bị cắt (khung 2px là bóng trong của các ô, đã bo theo ô).
- Hàng chân: đậm `--flg-weight-semibold`; một viên viền mảnh vẽ bằng bóng trong: mọi ô có `inset 0 1px 0` và `inset 0 -1px 0` màu `--flg-control-border`, ô đầu có thêm `inset 1px 0 0`, ô cuối `inset -1px 0 0`.
- Ở `prefers-contrast: more` (ngoài mockup; Claude chốt, phát hiện khi đọc soát spec): sọc được thay bằng đường kẻ 1px `--flg-control-border` ở cạnh trên của mỗi hàng thân trừ hàng đầu (bóng trong trên các ô), để mọi chữ trong ô nằm thẳng trên bề mặt. Chữ của Badge `accent` trên sọc chỉ 4.45:1 light ở chế độ đó (§4.4).

**`minimal` (T3):** tối giản, thoáng.

- `--py` 14px, `--hpy` 6px; `sm`: `--py` 6px, `--hpy` 4px. Một hàng có Checkbox hoặc nút cao 56px ở `md`.
- Ô tiêu đề cột: đậm `--flg-weight-medium` (không phải semibold), viền dưới 1px đường mờ 45% (§4.2).
- Hàng chân: viền trên 1px đường mờ 45%, đậm `--flg-weight-semibold`.
- Hover: nền hàng `--flg-control-track`. Hàng đã chọn: nền hàng `--flg-accent-subtle`.

**Trạng thái rỗng và đang tải** là công thức của docs (§8), không phải phần mới: một hàng với một ô `colSpan` bằng số cột, căn giữa, được xuống dòng; bên trong một cột dọc căn giữa, khoảng cách 3px, padding `14px 0`: icon 24px `--flg-text-muted` cách dưới thêm 4px, tiêu đề đậm `--flg-weight-semibold`, gợi ý `--flg-text-xs` `--flg-text-muted` (đúng mockup). Đang tải: các hàng có `Skeleton` `text` trong ô.

**Dark:** chỉ khác giá trị token.

### 4.4 Tương phản (bổ sung cho §4.9 của spec 0+1)

`scripts/check-contrast.ts` đo thêm các cặp sau, trên kính thường và trên panel phủ lớp tối (spec giai đoạn 2 §4.4), lấy số thấp nhất trên mọi nền tham chiếu và mọi điểm màu của viền kính. Plan làm component nào đo cặp của component đó. Các số dưới đây Claude đã đo khi viết spec bằng chính các hàm của `scripts/lib/contrast.ts` (làm tròn xuống); plan đo lại khi viết check và dùng số của script.

**Cặp mới** ("+" là `prefers-contrast: more`):

| Check | Plan | Cặp | Ngưỡng | Light | Dark | Light + | Dark + |
|---|---|---|---|---|---|---|---|
| `alert-stripe-text` | A | Tiêu đề `--flg-text` trên `--flg-control-bg-secondary` (A1) | 4.5 | 13.63 | 5.81 | 15.30 | 12.09 |
| `alert-stripe-icon` | A | Icon (và vạch) màu trạng thái trên `--flg-control-bg-secondary`, thấp nhất trong bốn trạng thái (`info`) | 3 | 4.18 | **2.02** | 6.22 | 6.31 |
| `alert-tinted-title` | A | Tiêu đề màu trạng thái (`info`: `--flg-accent-text`) trên nền nhuộm (A2), thấp nhất trong bốn trạng thái | 4.5 | 4.68 | **3.37** | 5.10 | 5.84 |
| `alert-tinted-text` | A | Mô tả `--flg-text` trên nền nhuộm, thấp nhất trong bốn trạng thái | 4.5 | 11.14 | **4.16** | 12.43 | 7.73 |
| `alert-tinted-icon` | A | Icon màu trạng thái trên nền nhuộm | 3 | 3.60 | **1.84** | 5.21 | 4.66 |
| `alert-plain-title` | A | Tiêu đề màu trạng thái trên `--flg-control-bg` (A3) | 4.5 | 5.78 | **3.90** | 6.12 | 8.13 |
| `alert-plain-icon` | A | Icon màu trạng thái trên vòng tròn 16% của nó, trên `--flg-control-bg` | 3 | 3.62 | **1.88** | 4.92 | 4.80 |
| `progress-fill` | A | Phần đã chạy (các điểm của `--flg-accent-gradient`, `--flg-success`, `--flg-danger`) so với rãnh `--flg-control-track` | 3 | **2.45** | **1.74** | 4.82 | 5.56 |
| `progress-glow-fill` | A | Như trên, kể cả nửa trên có ánh sáng trắng 24% của `glow`; ở "+" không có ánh sáng | 3 | **1.62** | **1.74** | 4.82 | 5.56 |
| `accent-text-on-surface` | A | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow` | 4.5 | **3.95** | **4.44** | 5.95 | 9.29 |
| `stepper-ring` | B | Vòng `--flg-stepper-ring` của bước chưa tới so với bề mặt | 3 | **2.63** | **2.63** | 7.65 | 10.43 |
| `stepper-current-number` | B | Số `--flg-accent-text` của bước hiện tại trên `--flg-control-bg` (St1), và trên dấu tròn nằm trong viên thuốc `--flg-selected-bg` (St2) | 4.5 | 5.67 | **3.33** | 6.12 | 8.13 |
| `stepper-done-mark` | B | Dấu ✓ của bước đã xong: `--flg-on-accent` trên `--flg-accent-solid` (St1), `--flg-accent-text` trên `--flg-accent-subtle` (St2) | 3 | 3.40 | 3.59 | 4.94 | 7.31 |
| `current-edge` | B | Vạch `--flg-accent-solid` trên nền `--flg-selected-bg`: vạch 3px của hàng hiện tại List `inset`, viền 2px của dấu tròn bước hiện tại Stepper `compact`. Ở "+" là `--flg-selected-text` trên `--flg-selected-bg` (quy tắc bên dưới) | 3 | **2.61** | **2.01** | 6.28 | 8.15 |
| `table-row-text` | C | Chữ `--flg-text` trên nền hover, sọc và nền hàng đã chọn, thấp nhất trong ba nền | 4.5 | 8.01 | 5.23 | 14.94 | 14.23 |
| `table-hover-badge` | C | Chữ của mỗi variant Badge trên nền của Badge đó, đặt trên hàng đang hover (`--flg-control-track`); thấp nhất là `accent` | 4.5 | **2.80** | **3.03** | 4.94 | 7.31 |
| `table-stripe-text-muted` | C | Chữ `--flg-text-muted` trên hàng lẻ của `striped` (sọc 50%) | 4.5 | 4.57 | **3.71** | 7.65 | 10.43 |
| `table-stripe-badge` | C | Chữ của mỗi variant Badge trên hàng lẻ của `striped` | 4.5 | **3.09** | **3.37** | 4.94 | 7.31 |
| `table-selected-badge` | C | Chữ của mỗi variant Badge trên hàng đã chọn (`--flg-accent-subtle`) | 4.5 | **2.97** | **3.27** | 4.94 | 7.31 |

Số in đậm là dưới ngưỡng ở theme mặc định. Plan B mở rộng `accent-text-on-surface` sang dòng "Step N" của Stepper `bars` (cùng cặp màu, cùng số đo).

**Chữ trên nền hàng của Table** (năm check cuối; Claude chốt, phát hiện khi đọc soát spec). Mockup đặt Badge, chữ và chữ mờ lên hàng đang hover, hàng lẻ của `striped` và hàng đã chọn, nên Plan C đo `--flg-text`, `--flg-text-muted` và chữ của cả năm variant Badge (`neutral`, `accent`, `success`, `warning`, `danger`, mỗi cái trên nền của chính nó) trên cả ba nền, ở cả ba variant (nền hover và nền hàng đã chọn giống nhau ở ba variant; sọc chỉ có ở `striped`). Badge `accent` thấp nhất vì nó là lớp nhuộm nhấn thứ hai; các Badge trạng thái thấp nhất là 3.69 light, 3.67 dark (hover), 4.09 và 4.08 (sọc), 3.91 và 3.98 (hàng đã chọn); `neutral` chỉ dưới ngưỡng ở dark trên nền hover (4.15). Ở `prefers-contrast: more` các nền đó không còn (§4.3): hàng đã chọn có khung 2px thay cho nền nhuộm, `striped` có đường kẻ thay cho sọc, hover không đổi nền. Nếu giữ chúng, chữ Badge `accent` chỉ còn 4.17 (hàng đã chọn), 4.45 (sọc) và 3.99 (hover) ở light, dưới ngưỡng của chế độ không cho ngoại lệ. Vì vậy cột "+" của năm check là số đo trên bề mặt.

**Vì sao số khác ghi chú của người vẽ mockup.** Người vẽ đo trên nền của trang mockup; script đo trường hợp xấu nhất. Ví dụ phần đã chạy so với rãnh ở light nằm trong khoảng 2.45–3.82 tuỳ nền và điểm màu của viền kính (trên nền trắng tới 3.67), và thấp nhất trên `#ff5fa2` phủ lớp tối. Ở dark, chữ của Alert `tinted` chỉ dưới 4.5:1 trên nền tham chiếu sáng nhất `#2fa8d8` (và `#4a5bdc` cho tiêu đề `info`, 4.07); trên các nền tối nó đạt.

**Cặp đã có trong §4.9, được mở rộng** (cùng cặp màu, nên cùng số đo; không thêm check):

| Dòng §4.9 | Vị trí mới |
|---|---|
| 2 (vòng focus) | Nút của bước Stepper; hàng List (vẽ trên hàng); nút sắp xếp và khung cuộn của Table |
| 5 (gradient nhấn so với nền) | Thanh của bước đã xong, Stepper `bars` |
| 6 (`--flg-text-muted` trên bề mặt) | Giá trị của Progress `thin`; số, tên và mô tả của bước chưa tới, mô tả của mọi bước, "Step N" của bước chưa tới (Stepper); mô tả và chữ ở ô cuối của List; tiêu đề cột Table `striped` và `minimal`; icon "chưa sắp" (icon đạt 3:1 của nó) |
| 7 (`--flg-selected-text` trên `--flg-selected-bg`) | Tiêu đề hàng hiện tại của List (cả ba variant); tiêu đề bước hiện tại, Stepper `compact` |
| 8 (`--flg-selected-bg` so với nền) | Nền hàng hiện tại của List (cả ba variant); viên thuốc của bước hiện tại, Stepper `compact` |
| 9 (`--flg-text-muted` trên nền nhấn nhạt) | Mô tả và chữ ở ô cuối của hàng hiện tại List; mô tả của bước hiện tại trong viên thuốc, Stepper `compact`; chữ mờ trên hàng đã chọn của Table (4.37 light, 3.60 dark; phát hiện khi đọc soát spec) |
| 10 (`--flg-danger` trên nền danger 16%) | Tiêu đề và mô tả của bước lỗi trong viên thuốc, Stepper `compact` |
| 12 (`--flg-text-muted` trên `--flg-control-track`) | Chữ mờ trên hàng đang hover của Table; mô tả của hàng List bấm được khi hover (`inset`, `plain`; `cards` ở dark) (4.10 light, 3.36 dark; phát hiện khi đọc soát spec) |
| 14 (`--flg-accent-solid` so với nền) | Viền 2px của dấu tròn bước hiện tại, Stepper `circles`; viền 1.5px của hàng hiện tại, List `cards` |
| 16 (`--flg-control-track` so với nền) | Rãnh của Progress (cả ba variant); thanh của bước chưa tới, Stepper `bars` |
| 21 (`--flg-text-muted` trên `--flg-control-bg`) | Mô tả của Alert `plain` |
| 22 (`--flg-text-muted` trên `--flg-control-bg-secondary`) | Mô tả của Alert `stripe`; tiêu đề cột Table `lined` |
| 27 (mới, `progress-fill`) | Nửa đã chạy của thanh bước hiện tại, Stepper `bars` (Plan B) |

Icon của cột đang sắp (`--flg-accent-text` trên bề mặt) là cặp của dòng 29; nó là icon nên ngưỡng là 3:1, và đạt (3.95, 4.44).

**Dòng mới của §4.9 (cần chủ dự án duyệt).** Đúng như mockup, nên theo spec giai đoạn 2 §4.4 chúng thành dòng mới, kèm số đo làm tròn xuống, và được nêu trong mô tả PR của plan thêm chúng:

| # | Plan | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
|---|---|---|---|---|---|---|
| 23 | A | Icon và vạch `info` (`--flg-accent-solid`) của Alert so với nền của Alert | đạt (4.18 `stripe`, 3.60 `tinted`, 3.62 `plain`) | 2.02 `stripe`, 1.84 `tinted`, 1.88 `plain` | 3:1 | 1.4.11 |
| 24 | A | Tiêu đề của Alert `tinted` (màu trạng thái; `--flg-accent-text` cho `info`) trên nền nhuộm | đạt (4.68) | 3.37 | 4.5:1 | 1.4.3 |
| 25 | A | Mô tả `--flg-text` của Alert `tinted` trên nền nhuộm | đạt (11.14) | 4.16 | 4.5:1 | 1.4.3 |
| 26 | A, B | Chữ `--flg-accent-text` trên `--flg-control-bg`: tiêu đề Alert `plain` `info`; số của bước hiện tại, Stepper `circles` và `compact` | đạt (5.78; 5.67) | 3.90; 3.33 | 4.5:1 | 1.4.3 |
| 27 | A | Phần đã chạy của Progress `thin`, `inline` so với rãnh; nửa đã chạy của Stepper `bars` (Plan B) | 2.45 | 1.74 | 3:1 | 1.4.11 |
| 28 | A | Phần đã chạy của Progress `glow` (cả ánh sáng ở nửa trên) so với rãnh | 1.62 | 1.74 | 3:1 | 1.4.11 |
| 29 | A, B | Chữ `--flg-accent-text` trên bề mặt: giá trị của Progress `glow`; "Step N" của bước xong và bước hiện tại, Stepper `bars` | 3.95 | 4.44 | 4.5:1 | 1.4.3 |
| 30 | B | Vòng của bước chưa tới (`--flg-stepper-ring`, 65% `--flg-text-muted`) so với nền, Stepper `circles` và `compact` | 2.63 | 2.63 | 3:1 | 1.4.11 |
| 31 | B | Vạch `--flg-accent-solid` trên nền nhấn nhạt `--flg-selected-bg`: vạch của hàng hiện tại List `inset`; viền dấu tròn bước hiện tại Stepper `compact` | 2.61 | 2.01 | 3:1 | 1.4.11 |
| 32 | C | Chữ của Badge trên hàng đang hover (`--flg-control-track`): Table (cả ba variant); Badge ở ô cuối của hàng List bấm được | 2.80 `accent` (trạng thái 3.69) | 3.03 `accent` (trạng thái 3.67, `neutral` 4.15) | 4.5:1 | 1.4.3 |
| 33 | C | Chữ trên hàng lẻ của Table `striped`: chữ mờ `--flg-text-muted`; chữ của Badge | đạt chữ mờ (4.57); Badge 3.09 `accent` (trạng thái 4.09) | chữ mờ 3.71; Badge 3.37 `accent` (trạng thái 4.08) | 4.5:1 | 1.4.3 |
| 34 | C | Chữ của Badge trên hàng đã chọn của Table (`--flg-accent-subtle`) | 2.97 `accent` (trạng thái 3.91) | 3.27 `accent` (trạng thái 3.98) | 4.5:1 | 1.4.3 |

- Mỗi dòng có một hoặc nhiều check trong `scripts/contrast-exceptions.ts` (dòng 23: ba check của ba variant; dòng 26: `alert-plain-title` và `stepper-current-number`; dòng 27 và 29 có thêm vị trí của Plan B mà không thêm check; dòng 32: `table-hover-badge`, kể cả vị trí trong List; dòng 33: `table-stripe-text-muted` và `table-stripe-badge`; dòng 34: `table-selected-badge`).
- Các dòng 32–34 thêm khi đọc soát spec (Claude chốt). Chính mockup T1–T3 đã duyệt đặt Badge `accent` ("Đang giao") trên hàng đã chọn DH-1041, Badge trạng thái trên hàng hover DH-1040 và trên các hàng lẻ có sọc của `striped`, nên các cặp này đúng như mockup.
- Cả mười hai dòng đều đạt ở `prefers-contrast: more` (cột "+" ở trên).
- Theo quy tắc của dự án, chỗ sửa tương phản đi vào chế độ người dùng bật; theme mặc định giữ đúng mockup. Nếu chủ dự án muốn đổi một cặp ở theme mặc định (ví dụ cho Progress rãnh đậm hơn), đó là một thay đổi mockup cần duyệt riêng.

**Không đo:**

- **Skeleton:** luôn `aria-hidden`, chỉ để trang trí; trạng thái "đang tải" do vùng chứa nói (§3.4).
- **Khung, viền và nền của Alert,** viền 45% của `tinted`: Alert không phải control; trạng thái do icon có tên và chữ nói.
- **Đường nối của Stepper, quầng, và viên thuốc của bước lỗi (`compact`):** trang trí; trạng thái do dấu bên trong, chữ đỏ và chữ ẩn nói.
- **Đĩa của bước đã xong và bước lỗi so với nền** (St1 đã xong 2.29 dark; St1 và St2 lỗi 1.51 dark; St2 đã xong 1.15 và 1.18): dấu ✓ và "!" bên trong mang trạng thái, và được đo với đĩa của chúng (`stepper-done-mark`, `on-danger`), như người vẽ ghi cho đĩa lỗi.
- **Table, như dấu hiệu:** viền khung, đường kẻ, sọc, nền hover; **nền hàng đã chọn và vạch của `lined`**: trạng thái chọn do Checkbox trong hàng nói, đã đo ở giai đoạn 1; nền hàng chỉ là dấu hiệu phụ (§6.3). Chữ nằm trên các nền đó thì được đo (ở trên). Khung 2px của hàng đã chọn ở `prefers-contrast: more` đạt 6.07 light, 7.42 dark so với bề mặt.
- **List:** đường ngăn của `inset`, mép của từng thẻ `cards`: List không phải control; hàng bấm được có tiêu đề là link hoặc nút.
- **Quầng sáng của Progress `glow`,** vệt sáng của Skeleton; mọi nền hover; mọi phần disabled (spec giai đoạn 3 §4.4).

**`prefers-contrast: more`:** mọi cặp mới phải đạt (lớp 4 (b) ở §7, không có ngoại lệ). Ngoài phần token đã có của chế độ này, các quy tắc sau đều ngoài mockup và chỉ có hiệu lực khi người dùng bật tuỳ chọn:

- `--flg-stepper-ring` thành màu đặc (§4.2).
- Rãnh của Progress, thanh chưa tới và thanh của bước hiện tại của Stepper `bars` có viền trong 1px `--flg-control-border`, như rãnh Slider (nửa trống của thanh hiện tại cũng là rãnh, và rãnh của Progress giữ viền khi có phần đã chạy bên trong; phát hiện khi lập Plan B). Forced colors thắng quy tắc này (§4.5).
- Progress `glow` bỏ lớp ánh sáng ở nửa trên (phần đã chạy chỉ còn màu của nó, nên `progress-glow-fill` đạt như `progress-fill`) và bỏ quầng sáng (Claude chốt: một quầng nhoè quanh thanh không giúp gì cho người cần tương phản cao). Quầng là một `color-mix` riêng, không đi theo token `--flg-glow` vốn đã về `none` ở chế độ này, nên phải bỏ bằng quy tắc.
- Hàng hiện tại của List: mọi chữ và icon trong hàng (tiêu đề, mô tả, ô đầu, ô cuối) lấy `--flg-selected-text`, vì nền hàng thành màu nhấn đặc; vạch của `inset` lấy `--flg-selected-text`. Docs nói hàng hiện tại nên chỉ có chữ và icon: một Badge hay nút trong hàng đó tự mang màu của nó (§8).
- Bước hiện tại của Stepper `compact`: viên thuốc thành màu nhấn đặc (qua `--flg-selected-bg`), nên dấu tròn trong nó đảo màu: nền `--flg-selected-text`, viền `--flg-selected-text`, số màu `--flg-selected-bg`; mô tả của bước lấy `--flg-selected-text` (giữ `--flg-text-muted` thì chỉ còn 1.25 light, 1.40 dark).
- Bước lỗi của Stepper `compact`: chữ đã dùng `--flg-highlight-danger-text` (§4.3), nên tự đổi theo nền đỏ đặc.
- Table (§4.3): hàng đã chọn bỏ nền nhuộm và có khung trong 2px `--flg-accent-solid`; `striped` thay sọc bằng đường kẻ 1px `--flg-control-border`; hàng thân không đổi nền khi hover. Mọi chữ trong ô khi đó nằm trên bề mặt.
- List: hàng bấm được không đổi nền khi hover (§4.3).
- Trong khung `lined` (cả ở forced colors): outline của control trong bảng vẽ vào trong, để khung không cắt nó (§4.3).

### 4.5 Forced colors

Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `currentColor`, màu đặt trên phần tử bọc ngoài chứ không trên `<svg>` (spec giai đoạn 2 §4.5).

- **Alert:**
  - Vạch của `stripe`: `CanvasText`, như vạch của Toast.
  - Viền của cả ba variant: `CanvasText`. Nền nhuộm của `tinted` và vòng tròn của `plain` bị hệ thống bỏ; trạng thái vẫn do hình icon và tên của nó nói.
- **Progress:**
  - Rãnh: `outline: 1px solid CanvasText` (phát hiện khi lập Plan A: một viền 1px chiếm hết chỗ của phần đã chạy trong rãnh `sm` cao 2px; outline nằm ngoài hộp nên không lấy chỗ).
  - Phần đã chạy: `forced-color-adjust: none`, nền `Highlight` (khai báo `background` đầy đủ, nên ánh sáng và gradient của `glow` cũng mất); quầng sáng mất cùng `box-shadow`.
  - Trạng thái `success`, `error`: icon và `aria-valuetext` nói, không dựa vào màu.
- **Skeleton:** `forced-color-adjust: none`, nền `GrayText`, không viền trong, không animation (`::after` của `shimmer` bị ẩn). Không có quy tắc này, khối nền sẽ thành `Canvas` trên `Canvas` và biến mất.
- **Stepper:**
  - Dấu tròn và thanh có `forced-color-adjust: none` và tự đặt màu hệ thống:
    - Chưa tới: viền `CanvasText`, nền `Canvas`, số `CanvasText`.
    - Đã xong (`circles` và `compact`): nền `Highlight`, ✓ `HighlightText`.
    - Hiện tại: viền 2px `Highlight`, nền `Canvas`, số `CanvasText`.
    - Lỗi: nền `CanvasText`, "!" `Canvas`.
  - Đường nối: đã đi `Highlight`, chưa đi `CanvasText`.
  - `compact`: mọi phần bên trong có sẵn viền 1px `Canvas`; bước hiện tại viền `Highlight`, bước lỗi viền `CanvasText`. Viền có sẵn ở mọi bước để bước không rộng thêm khi đổi trạng thái (bài học của tab, spec giai đoạn 2 §4.5).
  - `bars`: chưa tới nền `Canvas` viền 1px `CanvasText`; đã xong `Highlight`; hiện tại nửa `Highlight` trên `Canvas` có viền; lỗi `CanvasText`.
- **List:**
  - Đường ngăn của `inset`: `CanvasText`. Gốc của `inset` là `Surface`, đã có quy tắc của nó. Mỗi thẻ của `cards` nhận đúng quy tắc của `.flg-surface` (bỏ nền ảnh, nền `Canvas`, viền và chữ `CanvasText`, không bóng): selector của nó nằm ngay trong quy tắc forced colors của `.flg-surface` ở `preferences.css`, vì nó không mang lớp đó (§4.3; phát hiện khi review PR #28: trước đó là một bản chép).
  - Hàng hiện tại (cả ba variant): `outline: 2px solid Highlight; outline-offset: -2px`, vì nền của nó bị bỏ và `plain` khi đó chỉ còn chữ đậm (ghi chú của người vẽ). Vạch của `inset`: `forced-color-adjust: none`, nền `Highlight`. Khi hàng có focus, `outline` của focus thắng (§4.3).
  - Hàng disabled: `GrayText`.
- **Table:**
  - Viền khung của `lined` và các đường kẻ: `CanvasText`. Nền tiêu đề, hàng chân, sọc và hover bị hệ thống bỏ.
  - Hàng chân của `striped`: viên viền bằng bóng trong bị bỏ, nên các ô có viền trên và dưới 1px `CanvasText`, ô đầu thêm viền đầu dòng và ô cuối thêm viền cuối dòng, để viên không hở hai đầu (Claude chốt; ghi thêm hai cạnh bên khi lập Plan C).
  - Hàng đã chọn: không có dấu riêng; Checkbox trong hàng (`Highlight`) nói trạng thái (Claude chốt). Khung 2px của chế độ `prefers-contrast: more` là bóng trong, nên chế độ này bỏ nó cùng mọi `box-shadow`.
  - Vòng focus: outline là dấu hiệu duy nhất ở chế độ này. Trong khung `lined`, outline của nút sắp xếp, `Button`, `IconButton`, ô vuông Checkbox, rãnh Switch và chấm Radio vẽ vào trong (`outline-offset: -2px`; Switch và Radio: phát hiện khi review cuối Plan C); ở `striped` và `minimal`, padding 6px của khung giữ nó nguyên vẹn (§4.3; Claude chốt, phát hiện khi đọc soát spec).
  - Nút sắp xếp: chữ và icon `ButtonText`. Hướng sắp đọc được từ hình icon, không dựa vào màu.
  - Tiêu đề dính: `background-color: Canvas`, vì lớp nền bằng `background-image` của nó (§4.3) bị bỏ và các hàng sẽ hiện xuyên qua.

### 4.6 Icon

- **Icon dùng chung** ở `src/internal/icons.tsx`, nét 2 như `strokeIcon` (các mockup giai đoạn 4 cũng vẽ nét 2):
  - Plan A: `StatusIcon` với `status: 'info' | 'success' | 'warning' | 'error'`: đúng bốn đường vẽ của Toaster (vòng tròn chữ i, vòng tròn dấu ✓, tam giác dấu !, vòng tròn dấu ×). Toaster, Alert và Progress dùng nó. Props SVG truyền qua, nên Toaster vẫn đặt `role="img"` và `aria-label` như cũ.
  - Plan B: `ExclamationIcon` (khung 12×12, `M6 2.75v3.75M6 9.25h.01`), dấu "!" của bước lỗi. Dấu ✓ của bước đã xong là `BoxCheckIcon` có sẵn (cùng đường vẽ với mockup). Chevron phải của List trong story là `ChevronIcon` có sẵn.
  - Plan C: `ArrowIcon` với `direction: 'up' | 'down'` (`M12 5v14` và `m19 12-7 7-7-7` cho hướng xuống; đối xứng cho hướng lên), `ChevronsUpDownIcon` (`m7 15 5 5 5-5` và `m7 9 5-5 5 5`).
- Icon trong nội dung mẫu của mockup (ba chấm "…", hộp thư của trạng thái rỗng, icon của danh sách cài đặt) là nội dung của người dùng, không thuộc lib.

---

## 5. Primitives nội bộ mới

Giai đoạn 4 không thêm module mới vào `src/internal/` ngoài các icon ở §4.6.

**Helper riêng của component** (nằm trong thư mục của component, như `pagination-range.ts`):

| File | Nhiệm vụ |
|---|---|
| `stepper/step-states.ts` | Hàm thuần `stepStates({ count, value, statuses, linear, interactive })` trả mỗi bước `{ state, clickable }`. `state`: `status` của `Step` thắng; nếu không, chỉ số nhỏ hơn `value` là `complete`, bằng là `current`, lớn hơn là `upcoming`. `clickable` khi `interactive` và (`!linear`, hoặc chỉ số ≤ `value`, hoặc `status` là `complete`) |
| `table/use-scrollable.ts` | `useScrollable(frameRef, tableRef)` trả `boolean`. Một `ResizeObserver` trên khung và bảng; đọc `scrollWidth/clientWidth` và `scrollHeight/clientHeight`; chỉ đặt state khi kết quả đổi. Không có `ResizeObserver` (jsdom) thì trả `false` |

**Primitives của giai đoạn 1–3 được dùng lại:**

- `Slot`: `AlertTitle asChild`.
- `collectChildren`, `markPart`: `Stepper` đọc các `Step`.
- `useRequireName`: Progress (tên khác là `label`), Table (`active` khi khung cuộn được; tên khác là `TableCaption`, qua `otherName` với `{ current: namedByCaption }` dựng từ state mỗi lần render; nay là `given: () => namedByCaption !== undefined`, vì `otherName` của `useRequireName` thành một hàm hỏi sau khi mount, phát hiện khi review PR #39 của giai đoạn 5). Không có ref `captionRef` thứ hai: `TableCaption` đặt state `namedByCaption` trong layout effect của cùng commit với lần đo khung, nên state là nguồn duy nhất cho việc có caption hay không (phát hiện khi review PR #29).
- `numberFormat` của `intl.ts`: phần trăm của Progress.
- `IconButton`, `CloseIcon`: nút đóng của Alert.
- `useIsoLayoutEffect`, `mergeRefs`, `dataAttr`, `devWarn`, `strokeIcon`, `BoxCheckIcon`.

**Cảnh báo dev mới:**

- Progress:
  - Thiếu tên: không có `label`, `aria-label`, cũng không có `aria-labelledby`.
  - `value` ngoài `[0, max]` (lib kẹp); `value` là `NaN` hay vô hạn (lib coi là chưa xác định); `max` không phải số dương hữu hạn (lib dùng 100).
- Skeleton: `size` trên hình không phải `circle` (bị bỏ qua); `SkeletonText` có `lines` không phải số nguyên dương (lib dùng 1).
- Stepper:
  - Có con không phải `Step` (bị bỏ qua).
  - `value` không phải số nguyên trong `[0, số bước]` (lib làm tròn xuống và kẹp, để không bao giờ báo một bước đã xong trước khi nó xong; phát hiện khi review cuối Plan B; `NaN` coi là 0, vô cực kẹp như mọi số khác, phát hiện khi lập Plan B). Lời cảnh báo không chứa giá trị, để `devWarn` gộp được các lần lặp: "<Stepper> value must be a whole number from 0 to the number of steps; it was rounded into that range."
  - `linear={false}` mà không có `onValueChange` (không có tác dụng).
  - `Step` được render ngoài `Stepper`. Lời cảnh báo nêu nguyên nhân hay gặp nhất và cách sửa (Claude chốt, phát hiện khi đọc soát spec; §3.1): "<Step> rendered outside <Stepper>. Write the Steps in the same component that renders the Stepper: Steps passed from a Server Component into a client component arrive already rendered, and the Stepper cannot read them."
  - `Stepper` không đọc được bước nào (Claude chốt, cùng lý do): "<Stepper> has no steps. Its children must be <Step> elements written in the component that renders the Stepper (not passed in from a Server Component)." Stepper khi đó render một `<ol>` rỗng.
- List:
  - `ListItem` có cả `href` lẫn `onSelect` (`href` thắng): "<ListItem> has both href and onSelect; the href wins and onSelect is ignored."
  - `href`, `onSelect` hay `renderLink` mà không có `title` (hàng không bấm được, vì liên kết kéo giãn cần tiêu đề): "<ListItem> href, onSelect and renderLink need a title: the link or button is the title, stretched over the row. Without one the row is not pressable." Lời cảnh báo không chứa giá trị, để `devWarn` gộp được các lần lặp của nhiều hàng.
  - `renderLink` mà không có `href`: "<ListItem> renderLink has no effect without href."
- Table: khung cuộn được mà không có tên (không có `TableCaption`, `aria-label` hay `aria-labelledby`); `sort` không có `onSort` thì không cảnh báo (đó là chỉ báo tĩnh, §6.3).
- Alert: không có cảnh báo mới.

---

## 6. Component giai đoạn 4

### 6.1 Quy ước API chung (bổ sung cho §6.1 của spec 0+1, spec giai đoạn 2 và 3)

- **`variant`:** §3.2. **`size`:** `"sm" | "md"`, mặc định `"md"`, ở Progress, List và Table. Alert, Skeleton và Stepper không có `size`.
- **`ref`** trỏ vào phần tử mang ngữ nghĩa: phần tử gốc của Alert và các phần của nó, phần tử `role="progressbar"`, `<span>` của Skeleton, `<ol>` của Stepper, `<ul>` và `<li>` của List, `<table>` của Table và các phần tử bảng của các phần. `Step` là phần chỉ làm marker và không có `ref`, như `SelectItem` (spec 0+1 §6.1).
- **`className` và `style`** gắn vào phần tử gốc, trừ `Table`: chúng (cùng `hidden`, `dir` và `lang`, §6.3) gắn vào khung cuộn, phần nhìn thấy (nguyên tắc của `DialogContent`, spec giai đoạn 2 §6.1). `className` và `style` của `Step` gắn vào `<li>` của nó.
- **`labels`:** mọi chữ mặc định nằm trong một prop `labels`, ghi đè được từng khoá; khoá cần chèn giá trị là hàm (spec giai đoạn 3 §6.1).
- **`id` do lib sinh:** `TableCaption` được khung cuộn trỏ tới qua `aria-labelledby`, nên type bỏ `id` và id lib sinh luôn thắng (spec giai đoạn 2 §6.1).
- **Mỗi component export kiểu props của nó** và kiểu `variant` (`AlertVariant`, `ProgressVariant`…).

### 6.2 Phân loại client và server

Như §3.1.

### 6.3 Đặc tả từng component

**`Alert`**, **`AlertTitle`**, **`AlertDescription`**, **`AlertActions`**

```ts
type AlertStatus = 'info' | 'success' | 'warning' | 'error';
type AlertVariant = 'stripe' | 'tinted' | 'plain';
interface AlertLabels { info: string; success: string; warning: string; error: string; dismiss: string }
type AlertProps = HTMLAttributes<HTMLDivElement> & {
  status?: AlertStatus; variant?: AlertVariant;
  icon?: ReactNode | false;
  onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void;
  labels?: Partial<AlertLabels>;
};
type AlertTitleProps = HTMLAttributes<HTMLDivElement> & { asChild?: boolean };
type AlertDescriptionProps = HTMLAttributes<HTMLDivElement>;
type AlertActionsProps = HTMLAttributes<HTMLDivElement>;
```

- **Mặc định:** `status="info"`, `variant="stripe"`, `labels={ info: "Info", success: "Success", warning: "Warning", error: "Error", dismiss: "Dismiss" }`.
- **Thông báo tĩnh nằm trong trang,** khác Toast: không tự biến mất, không có hàng đợi.
- **Cấu trúc:**

  ```html
  <div class="flg-alert" data-variant="stripe" data-status="info">     <!-- role do người dùng truyền -->
    <span class="flg-alert-icon"><svg role="img" aria-label="Info">…</svg></span>
    <div class="flg-alert-body">
      <span class="flg-visually-hidden">Info: </span>   <!-- chỉ khi icon bị thay hoặc bỏ -->
      <div class="flg-alert-title">…</div>
      <div class="flg-alert-description">…</div>
      <div class="flg-alert-actions">…</div>
    </div>
    <span class="flg-alert-dismiss">                    <!-- chỉ khi có onDismiss -->
      <button class="flg-button" data-variant="ghost" data-size="sm" data-icon-only aria-label="Dismiss">×</button>
    </span>
  </div>
  ```

  - `children` của `Alert` đi vào `.flg-alert-body`.
  - `AlertTitle` là `<div>` chữ đậm, không phải heading: cấp heading tuỳ trang. `asChild` để nó thành `<h2>`… (`Slot`).
  - `AlertDescription` và `AlertActions` là `<div>`, vì chúng có thể chứa khối.
- **Icon:**
  - Mặc định là `StatusIcon` theo `status`, có tên (`role="img"`, `aria-label` từ `labels`), để trạng thái không chỉ nói bằng màu (cách của Toaster).
  - `icon` là ReactNode thì thay icon; `false` thì bỏ, và các giá trị lib nhận ra là không vẽ gì cũng như `false`: `null`, `true`, `''`, và mảng hay Fragment rỗng của những giá trị ấy (phát hiện khi review cuối Plan A; thu hẹp lại cho đúng với điều lib nhận ra được, phát hiện khi review PR #27). Một component trả về `null` vẫn giữ chỗ của icon, vì không thể biết nếu không render nó: muốn bỏ icon thì truyền `false`. Khi đó tên trạng thái vẫn được đọc: lib đặt nó thành chữ ẩn ở đầu thân (`labels[status]` cộng ": "), và khối bọc icon thay thế mang `aria-hidden` (Claude chốt). Người dùng đặt màu cho icon của họ qua `color` của khối bọc; mặc định khối bọc đã có màu trạng thái.
- **`onDismiss`:** có thì hiện nút đóng (`labels.dismiss`). Alert không tự ẩn: cha quyết định bỏ nó khỏi cây (controlled). Docs nói chuyển focus đi đâu khi Alert đóng lúc nút đóng đang có focus (về phần tử đã gây ra Alert, hoặc về tiêu đề của vùng chứa).
- **Vai trò live region:** §3.4. `role` do người dùng truyền (`"status"` hoặc `"alert"`).

**`Progress`**

```ts
type ProgressVariant = 'thin' | 'glow' | 'inline';
type ProgressStatus = 'default' | 'success' | 'error';
type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'children'> & {
  value?: number | null; max?: number;
  label?: ReactNode; showValue?: boolean;
  getValueText?: (value: number, max: number) => string;
  locale?: string; status?: ProgressStatus;
  size?: 'sm' | 'md'; variant?: ProgressVariant;
  labels?: Partial<{ success: string; error: string }>;
};
```

- **Mặc định:** `value=null`, `max=100`, `showValue=false`, `locale="en-US"`, `status="default"`, `size="md"`, `variant="thin"`, `labels={ success: "Success", error: "Error" }`.
  - `value` có thể bỏ trống, nghĩa là chưa xác định (Claude chốt; bản quyết định ban đầu ghi `value: number | null`).
- **Cấu trúc:**

  ```html
  <div role="progressbar" class="flg-progress" data-variant="thin" data-size="md" data-status="default"
       data-indeterminate aria-labelledby=":r1:" aria-valuemin="0" aria-valuemax="100"
       aria-valuenow="45" aria-valuetext>
    <div class="flg-progress-head">                          <!-- khi có label, hoặc giá trị ở thin/glow -->
      <span class="flg-progress-label" id=":r1:">Uploading contract.pdf</span>
      <span class="flg-progress-value" aria-hidden="true">  <!-- thin, glow -->
        <span class="flg-progress-icon"><svg>…</svg></span>45%
      </span>
    </div>
    <div class="flg-progress-line">
      <div class="flg-progress-track"><div class="flg-progress-fill" style="--flg-progress-value: 45%"></div></div>
      <span class="flg-progress-value" aria-hidden="true">45%</span>   <!-- inline -->
    </div>
  </div>
  ```

  - **Không dùng `<progress>` gốc** dù spec 0+1 §5 ưu tiên phần tử gốc (Claude chốt, theo bản quyết định ban đầu): `glow` cần ánh sáng và quầng trên phần đã chạy, giảm chuyển động cần mask, và đoạn chưa xác định cần trượt, mà phần đã chạy của `<progress>` là pseudo-element khác nhau giữa các engine (`::-webkit-progress-value`, `::-moz-progress-bar`), và WebKit không có phần nào để vẽ khi chưa xác định.
  - `role="progressbar"` nằm trên phần tử gốc, nên cả component là một nút với công nghệ hỗ trợ. Chữ giá trị nhìn thấy mang `aria-hidden`; giá trị đến screen reader qua các thuộc tính ARIA.
- **ARIA:**
  - `aria-valuemin="0"`, `aria-valuemax` là `max`, `aria-valuenow` là giá trị đã kẹp. Chưa xác định thì không có `aria-valuenow` và `aria-valuetext`.
  - **Chưa xác định mà có `status` khác mặc định:** trạng thái được nói qua mô tả, không qua giá trị. Phần tử `role="progressbar"` có `aria-describedby` trỏ tới một phần tử `<span hidden>` (id từ `useId`; không dùng `flg-visually-hidden`: nội dung mà `aria-describedby` trỏ thẳng tới vẫn được dùng dù ẩn, và node ẩn không bao giờ bị đọc như nội dung của thanh) chứa chữ trạng thái từ `labels` (`labels.success` / `labels.error`, cùng chữ với `aria-valuetext` khi đã biết giá trị). Vẫn không có `aria-valuetext` và `aria-valuenow`. `aria-describedby` của người dùng được giữ: hai id nối nhau. Người dùng không đặt `aria-describedby` mà đặt `aria-description` (hoặc không có thì `title`) thì chữ đó vào cùng phần tử ẩn, trước chữ trạng thái, cách nhau một dấu cách, vì `aria-describedby` thắng cả hai khi tính mô tả. `status` mà phiên bản này không biết thì coi như mặc định: trượt, không có mô tả. Thanh đã xác định không đổi (chủ dự án chốt 2026-11-09; phát hiện khi review PR #34).
  - Tên: `label` có thì `aria-labelledby` trỏ vào nhãn (id từ `useId`); `aria-label` hoặc `aria-labelledby` của người dùng thắng. Thiếu cả ba thì cảnh báo dev.
  - `aria-valuetext`: khi giá trị đã biết thì luôn đặt, là chữ giá trị (`getValueText(value, max)` khi có, không thì phần trăm). `status` là `success` hoặc `error` thì thêm tên trạng thái: `"62%, Error"`, vì `progressbar` không có thuộc tính ARIA nào nói lỗi (Claude chốt). Lý do đặt luôn: phần trăm làm tròn xuống nên chữ hiện ra khác `aria-valuenow` kể cả khi `max` là 100 (99,6 và "99%"), và một quy tắc đơn giản hơn hai (phát hiện khi review PR #27). Chưa xác định thì không đặt.
- **Chữ giá trị** (`showValue`): `getValueText(value, max)`, không có thì phần trăm `value / max` qua `numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })` ("45%", "45 %" ở `de-DE`). Phần trăm làm tròn xuống (`Math.floor` trên phần trăm đã bỏ nhiễu dấu phẩy động, rồi mới định dạng), nên 99,6 là "99%" và chỉ thanh đầy mới đọc "100%" (phát hiện khi review PR #27).
- **Icon trạng thái** (`success`, `error`): `StatusIcon` 14px (16px ở `glow`) trong ô giá trị, `aria-hidden`. Nó hiện cả khi `showValue` tắt (ô giá trị khi đó chỉ có icon), để trạng thái không chỉ nói bằng màu (ghi chú của người vẽ; Claude chốt cho trường hợp không có giá trị).
- **`size`:** §4.3. Không có `label` và không có giá trị thì chỉ còn rãnh (dạng `sm` dưới một dòng tệp của mockup); docs nhắc truyền `aria-label`.
- **Không phải control của Field** (Claude chốt): Progress không gửi form và không nhận nhãn của Field.

**`Skeleton`** và **`SkeletonText`**

```ts
type SkeletonVariant = 'pulse' | 'shimmer' | 'glass';
type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  shape?: 'rect' | 'circle' | 'text'; variant?: SkeletonVariant;
  width?: number | string; height?: number | string; size?: number | string;
};
type SkeletonTextProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  lines?: number; variant?: SkeletonVariant;
};
```

- **Mặc định:** `shape="rect"`, `variant="pulse"`, `size=40` (chỉ `circle`), `lines=3`.
- **Cấu trúc:**

  ```html
  <span class="flg-skeleton" data-variant="pulse" data-shape="circle" aria-hidden="true"
        style="width: 40px; height: 40px"></span>
  <span class="flg-skeleton-text" data-variant="pulse" aria-hidden="true">
    <span class="flg-skeleton" data-variant="pulse" data-shape="text"></span>
    <span class="flg-skeleton" data-variant="pulse" data-shape="text" style="width: 64%"></span>
  </span>
  ```

- **Kích thước:** `width`, `height`, `size` là số thì là px, là chuỗi thì là giá trị CSS; chúng thành `style` (`style` của người dùng thắng). Hoặc đặt qua `className`.
- **`aria-hidden="true"` luôn có**, đặt sau props của người dùng nên không ghi đè được.
- **Docs:** công thức vùng chứa `aria-busy` (§3.4, §8) và cách bọc thành component riêng với `variant` cố định.

**`Stepper`** và **`Step`**

```ts
type StepperVariant = 'circles' | 'compact' | 'bars';
interface StepperLabels {
  step: (n: number, total: number) => string; stepSeparator: string; separator: string;
  caption: (n: number) => string;
  completed: string; current: string; notStarted: string; error: string;
}
type StepperProps = Omit<HTMLAttributes<HTMLOListElement>, 'onChange' | 'children'> & {
  value: number; onValueChange?: (index: number) => void; linear?: boolean;
  orientation?: 'horizontal' | 'vertical'; variant?: StepperVariant;
  labels?: Partial<StepperLabels>; children: ReactNode;
};
type StepProps = {
  title: ReactNode; description?: ReactNode; status?: 'complete' | 'error';
  className?: string; style?: CSSProperties;
};
```

- **Mặc định:** `linear=true`, `orientation="horizontal"`, `variant="circles"`, `labels={ step: (n, total) => \`Step ${n} of ${total}\`, caption: (n) => \`Step ${n}\`, completed: "Completed", current: "Current", notStarted: "Not started", error: "Error" }`. `step` và `caption` là khoá Claude chốt thêm. `labels` còn có `stepSeparator: ": "` (sau `step(n, total)`) và `separator: ", "` (trước mô tả và trước chữ trạng thái): dấu câu của chữ ẩn cũng lấy từ `labels`, vì bản dịch dùng dấu câu khác (tiếng Nhật `"："` và `"、"`) hoặc để `step` tự mang dấu của nó (`(n, t) => \`Bước ${n}/${t} —\`` với `stepSeparator: " "`); mặc định giữ đúng câu tiếng Anh như cũ (phát hiện khi review PR #28).
- **`value`** là chỉ số (từ 0) của bước hiện tại, chỉ có dạng controlled (Claude chốt): Stepper không chứa nội dung từng bước, người dùng tự render nội dung theo `value`, nên họ luôn giữ giá trị đó. `value` bằng số bước nghĩa là mọi bước đã xong và không có bước hiện tại (Claude chốt).
- **`Step`** là phần chỉ làm marker (`markPart`): `Stepper` đọc các `Step` từ `children` qua `collectChildren` (qua Fragment và mảng) và tự render `<li>` của chúng; `Step` render ngoài `Stepper` thì không ra gì và cảnh báo dev. `Step` bọc trong component riêng của người dùng thì không được nhận ra (cảnh báo "con không phải Step"), như `SelectItem`.
- **Quy tắc: viết các `Step` trong chính component render `Stepper`** (Claude chốt, phát hiện khi đọc soát spec; §3.1). Một Stepper bấm được nằm trong client component; nếu các `Step` của nó được viết ở một Server Component rồi truyền vào qua `children`, RSC đã render chúng trên server (thành `null`) trước khi tới Stepper, nên Stepper không có bước nào. Stepper chỉ hiển thị viết thẳng trong Server Component thì không gặp chuyện này. Hai cảnh báo dev nêu đúng nguyên nhân (§5); docs và trang MDX có ví dụ đúng và sai (§8).
- **Trạng thái của bước:** `status` của `Step` thắng (`error`, hoặc `complete` cho bước đã xong ngoài thứ tự); nếu không thì bước trước `value` đã xong, bước `value` là hiện tại, bước sau chưa tới (`step-states.ts`, §5).
- **Cấu trúc** (`circles`; `compact` cùng cấu trúc; `bars` thay dấu tròn bằng thanh và thêm dòng "Step N"):

  ```html
  <ol class="flg-stepper" role="list" data-variant="circles" data-orientation="horizontal" style="--flg-step-count: 4">
    <li class="flg-step" data-state="complete" style="--flg-step-index: 0">
      <button type="button" class="flg-step-inner">       <!-- <span> khi không bấm được -->
        <span class="flg-step-indicator" aria-hidden="true"><svg>✓</svg></span>   <!-- số khi chưa xong -->
        <span class="flg-step-text">
          <span class="flg-visually-hidden">Step 1 of 4: </span>
          <span class="flg-step-title">Cart</span>
          <span class="flg-step-description">3 items</span>
          <span class="flg-visually-hidden">, Completed</span>
        </span>
      </button>
    </li>
    <li class="flg-step" data-state="current" data-current>
      <button type="button" class="flg-step-inner" aria-current="step">…</button>
    </li>
    <li class="flg-step" data-state="upcoming">
      <span class="flg-step-inner">…</span>
    </li>
  </ol>
  ```

  - `bars`: `<span class="flg-step-bar" aria-hidden="true">` thay cho dấu tròn, và `<span class="flg-step-caption" aria-hidden="true">` ("Step 1", kèm ✓ hoặc "!") đứng trước tiêu đề trong `.flg-step-text`.
  - Lib chỉ render phần của variant đang dùng (Claude chốt).
- **Ngữ nghĩa** (theo bản quyết định ban đầu):
  - `<ol>` mang thứ tự, và có `role="list"` như `List`: Safari bỏ ngữ nghĩa danh sách của một danh sách `list-style: none`, nên VoiceOver không đọc "list, 4 items" cho một Stepper nằm ngoài `<nav>` (phát hiện khi review PR #28).
  - `aria-current="step"` trên bước hiện tại: trên `<button>` khi bước đó bấm được, trên `<li>` khi không (Claude chốt). Nút nhận focus khi Tab, và screen reader chỉ đọc `aria-current` của phần tử đang có focus; mockup đặt nó trên `<li>`.
  - Mỗi bước có chữ ẩn số thứ tự (`labels.step`, rồi `labels.stepSeparator`) trước tiêu đề và chữ ẩn trạng thái (`labels.separator`, rồi `labels.completed`, `current`, `notStarted` hoặc `error`) sau mô tả; mô tả đứng sau `labels.separator`. Dấu tròn, thanh và dòng "Step N" mang `aria-hidden`, vì chữ ẩn đã nói điều đó. Một bước đọc thành: "Step 2 of 4: Delivery, Home delivery, 2–3 days, Completed".
  - Bản hẹp chỉ ẩn chữ khỏi mắt; screen reader vẫn đọc đủ.
- **Bấm để quay lại:**
  - Có `onValueChange` thì bước bấm được là `<button type="button">`: bước đã xong, bước hiện tại, bước có `status="complete"`; `linear={false}` cho bấm cả bước chưa tới.
  - Bước hiện tại là nút để focus ở yên sau khi người dùng quay lại một bước: bước được bấm thành bước hiện tại và vẫn là nút (theo bản quyết định ban đầu).
  - Bấm bước khác bước hiện tại thì gọi `onValueChange(index)`; bấm chính bước hiện tại không gọi gì (Claude chốt).
  - Không có `onValueChange` thì Stepper chỉ hiển thị.
- **Bàn phím:** các nút nằm trong thứ tự Tab theo DOM; Enter và Space là click gốc. Không có roving và phím mũi tên (Claude chốt): Stepper thường ít bước, và mỗi bước là một hành động riêng.
- **Hướng và bản hẹp:** §3.5, §4.3.

**`List`** và **`ListItem`**

```ts
type ListVariant = 'inset' | 'cards' | 'plain';
type ListProps = HTMLAttributes<HTMLUListElement> & { variant?: ListVariant; size?: 'sm' | 'md' };
type ListItemLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string; className: string; children: ReactNode;
};
type ListItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'title' | 'onSelect' | 'value'> & {
  title?: ReactNode; description?: ReactNode; start?: ReactNode; end?: ReactNode;
  href?: string; renderLink?: (props: ListItemLinkProps) => ReactElement;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  current?: boolean; disabled?: boolean;
};
```

- **Mặc định:** `variant="inset"`, `size="md"`.
- **Danh sách hiển thị,** không phải listbox chọn giá trị.
- **Cấu trúc:**

  ```html
  <ul role="list" class="flg-list" data-variant="inset" data-size="md">  <!-- inset thêm flg-surface -->
    <li class="flg-list-item" data-interactive data-current>
      <span class="flg-list-item-start">…</span>
      <span class="flg-list-item-main">
        <a class="flg-list-item-title" href="/profile" aria-current="page">Profile</a>
        <span class="flg-list-item-description">…</span>
        …children
      </span>
      <span class="flg-list-item-end">…</span>
    </li>
  </ul>
  ```

  - `role="list"` vì Safari bỏ ngữ nghĩa danh sách khi `list-style: none`.
  - Cột giữa chứa tiêu đề, mô tả, rồi `children`. Không có `title` thì `children` là nội dung tự do của hàng (theo bản quyết định ban đầu); hàng khi đó không bấm được.
  - Ô đầu, cột giữa và ô cuối là `<span>`; ô nào không có nội dung thì không render.
- **Tiêu đề:**
  - `href` → `<a href>`; `renderLink` có thì lib gọi nó với props của `<a>` (`href`, `className`, `children`, `aria-current`), như `renderLink` của Pagination (Claude chốt; cho link của router).
  - `onSelect` → `<button type="button">`.
  - Không có hai prop đó → `<span>`.
  - Liên kết kéo giãn (`::after`) phủ cả hàng, nên bấm đâu trong hàng cũng là bấm tiêu đề; phần tử tương tác trong ô cuối nằm trên lớp phủ nên vẫn bấm riêng được, và không có phần tử tương tác nào lồng nhau.
- **`current`:** `aria-current="page"` trên tiêu đề khi hàng bấm được, trên `<li>` khi không; hàng có `data-current`.
- **`disabled`** (chỉ có tác dụng ở hàng bấm được): link thành `<a role="link" aria-disabled="true">` không có `href`, nên không đi theo và không nhận focus (như mũi tên ở đầu của Pagination); nút có `disabled` gốc. **Hàng disabled không gọi `renderLink`** (Claude chốt, phát hiện khi lập Plan B): link của router cần một đích để đi tới, nên hàng disabled luôn dùng `<a>` của lib, như Pagination ở hai đầu. `renderLink` và docs nói rõ điều này.
- **Screen reader:** tên của link hay nút là tiêu đề; mô tả và ô cuối được đọc khi duyệt nội dung, không nằm trong tên (Claude chốt: List là server-safe nên không sinh id cho `aria-describedby`). Docs khuyên đặt chữ quan trọng trong `title`.
- **Hạn chế đã biết** (docs ghi): liên kết kéo giãn làm khó bôi đen chữ trong hàng.

**`Table`**, **`TableCaption`**, **`TableHeader`**, **`TableBody`**, **`TableFooter`**, **`TableRow`**, **`TableHead`**, **`TableCell`**

```ts
type TableVariant = 'lined' | 'striped' | 'minimal';
type TableSort = 'ascending' | 'descending' | 'none';
type TableAlign = 'start' | 'center' | 'end';
type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  variant?: TableVariant; size?: 'sm' | 'md'; stickyHeader?: boolean;
};
type TableCaptionProps = Omit<HTMLAttributes<HTMLTableCaptionElement>, 'id'>;
type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;   // cũng là TableBodyProps, TableFooterProps
type TableRowProps = HTMLAttributes<HTMLTableRowElement> & { selected?: boolean };
type TableHeadProps = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> & {
  align?: TableAlign; sort?: TableSort;
  onSort?: (next: 'ascending' | 'descending') => void;
};
type TableCellProps = Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> & { align?: TableAlign };
```

- **Mặc định:** `variant="lined"`, `size="md"`, `stickyHeader=false`; `TableHead` không đặt `scope` nếu không được truyền: trình duyệt tự quyết theo chỗ ô đứng (`th` trong header là tiêu đề cột, `th` ở đầu hàng của body hay footer là tiêu đề hàng), nên `TableHead` ở body hay footer không cần thêm gì (phát hiện khi review PR #29: `scope="col"` mặc định làm trình đọc màn hình đọc "DH-1042" như tiêu đề của các ô bên dưới thay vì các ô bên cạnh; các phần này an toàn cho server nên không biết mình nằm ở phần nào để tự chọn).
- **Bảng dạng ghép phần;** lib không xử lý dữ liệu: sắp xếp, lọc, phân trang do người dùng làm (Pagination có sẵn).
- **Cấu trúc:**

  ```html
  <div class="flg-table-frame" data-variant="lined" data-size="md" data-sticky-header
       role="region" tabindex="0" aria-labelledby=":r2:">  <!-- ba thuộc tính cuối chỉ khi cuộn được -->
    <table class="flg-table">
      <caption class="flg-table-caption" id=":r2:">Recent orders</caption>
      <thead class="flg-table-header">
        <tr class="flg-table-row">
          <th class="flg-table-head" aria-sort="descending" data-align="end">
            <button type="button" class="flg-table-sort">Total
              <span class="flg-table-sort-icon" aria-hidden="true"><svg>…</svg></span></button>
          </th>
        </tr>
      </thead>
      <tbody class="flg-table-body"><tr class="flg-table-row" data-selected>
        <td class="flg-table-cell" data-align="end">…</td></tr></tbody>
      <tfoot class="flg-table-footer">…</tfoot>
    </table>
  </div>
  ```

  - `ref` và mọi prop HTML còn lại của `Table` gắn vào `<table>`; `className`, `style`, `hidden`, `dir` và `lang` gắn vào khung (§6.1). `hidden`, `dir` và `lang` thuộc về hộp nhìn thấy: `<Table hidden>` chỉ ẩn `<table>` thì để lại một khung rỗng có viền và bo, và `dir="rtl"` chỉ đặt trên `<table>` thì điểm bắt đầu cuộn và bên của thanh cuộn vẫn theo LTR; `<table>` thừa hưởng `dir` và `lang` từ khung. Những prop còn lại (`id`, `aria-*`, `data-*`…) ở lại `<table>` như trước. JSDoc của `Table` và Table.mdx nói rõ phần tử nào nhận gì (phát hiện khi review PR #29).
  - `TableCaption` phải là con đầu của `Table`, như `<caption>` gốc. Chỉ `TableCaption` của chính `<table>` của `Table` mới nhận id và đặt tên cho khung: trong effect nó kiểm `<table>` chứa mình là phần tử con trực tiếp của khung (`.flg-table-frame`), nên `TableCaption` của một `<table>` thường lồng trong một ô không nhận id của `Table` ngoài (tránh trùng id) và khi bị gỡ không xoá tên của khung ngoài (phát hiện khi review PR #29). Vì vậy id xuất hiện trên `<caption>` sau lần layout đầu, không có trong HTML từ server, như tên của khung (§3.5).
- **Khung cuộn** (theo bản quyết định ban đầu; axe `scrollable-region-focusable`):
  - Khi khung cuộn được (§3.5), nó mang `role="region"`, `tabIndex={0}` và tên, để người dùng bàn phím cuộn được bằng phím mũi tên.
  - Tên: `aria-labelledby` trỏ vào `TableCaption` khi có (`TableCaption` lấy id từ context của `Table`); không có thì cùng `aria-label` hoặc `aria-labelledby` đã truyền cho `Table` (Claude chốt). Không có tên nào khi cuộn được thì cảnh báo dev.
  - Docs: bảng nằm dưới một tiêu đề nhìn thấy (như "Recent orders" của mockup là tiêu đề thẻ) thì truyền `aria-labelledby` trỏ vào tiêu đề đó thay cho `TableCaption`.
- **Sắp xếp:**
  - `onSort` có thì nội dung của `TableHead` nằm trong một `<button type="button">` cùng icon sắp xếp; bấm thì gọi `onSort(next)`, với `next` là `'descending'` khi `sort` đang là `'ascending'`, ngược lại là `'ascending'` (Claude chốt). Người dùng muốn ba trạng thái (tăng, giảm, bỏ sắp) thì tự xử lý trong `onSort`.
  - `aria-sort` trên `<th>` chỉ khi `sort` là `'ascending'` hay `'descending'` (Claude chốt, theo mẫu APG "sortable table": `aria-sort` chỉ ở một tiêu đề một lúc). Mockup ghi `aria-sort="none"` trên các cột sắp được mà chưa sắp; `'none'` vẫn là giá trị hợp lệ của prop, nhưng không thành thuộc tính; có `onSort` thì hiện icon chevron, không có `onSort` thì chỉ là chữ tiêu đề thường (phát hiện khi review PR #29: chevron trên cột không có nút hứa hẹn một control không tồn tại).
  - `sort` là `'ascending'` hay `'descending'` mà không có `onSort`: `<th>` vẫn có `aria-sort` và icon, nhưng không có nút; dùng cho bảng sắp sẵn từ server (Claude chốt). `sort="none"` không có `onSort` không hiện chevron: cột đó là chữ tiêu đề thường (phát hiện khi review PR #29).
  - Tên của nút là chữ tiêu đề; icon `aria-hidden`.
- **`align`:** `data-align` trên `<th>` và `<td>`; số dùng `tabular-nums` toàn bảng.
- **Hàng đã chọn** (`selected`): `data-selected`, chỉ là giao diện. `aria-selected` không hợp lệ trên hàng của `role="table"`; trạng thái chọn do Checkbox trong ô nói, với tên riêng ("Select DH-1042"). Docs có công thức cột ô chọn, kể cả ô chọn tất cả ở trạng thái một phần (`indeterminate`).
- **Bàn phím:** của trình duyệt: Tab qua nút sắp xếp, các control trong ô và khung cuộn (khi cuộn được). Không có điều hướng ô (`role="grid"` ngoài phạm vi).
- **Trạng thái rỗng và đang tải:** công thức docs (§4.3, §8), không có phần mới.

---

## 7. Kiểm thử

Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn 2 và 3 §7 giữ nguyên, thêm phần sau.

| # | Lớp | Bổ sung ở giai đoạn 4 |
|---|---|---|
| 1 | Unit (jsdom, React 19 và 18.3) | **Alert:** icon có tên theo `status` và theo `labels`; `icon` thay hay `false` thì có chữ ẩn trạng thái; không có `role` mặc định, `role` truyền qua; nút đóng chỉ khi có `onDismiss`; `AlertTitle asChild`. **Progress:** các thuộc tính ARIA (kẹp giá trị, chưa xác định bỏ `aria-valuenow`, `aria-valuetext` có trạng thái); phần trăm ở `en-US`, `vi-VN`, `de-DE`; `label` nối bằng `aria-labelledby`; cảnh báo thiếu tên và giá trị sai. **Skeleton:** `aria-hidden` không ghi đè được; số thành px; số dòng và dòng cuối 64%. **Stepper:** `step-states.ts` cạn (mọi `value`, `status` ghi đè, `linear`); nút chỉ ở bước bấm được; vị trí `aria-current`; chữ ẩn và `labels`; `onValueChange` không gọi cho bước hiện tại; các cảnh báo, kể cả lời của "Step ngoài Stepper" và "Stepper không có bước" (§5). **List:** phần tử của tiêu đề theo props; `renderLink` nhận đủ props; link disabled; vị trí `aria-current`; các cảnh báo. **Table:** `aria-sort` chỉ khi đang sắp; `next` của `onSort`; nút chỉ khi có `onSort`; `data-align`, `data-selected`; vùng cuộn có `role`, `tabIndex` và tên khi `useScrollable` báo cuộn được (giả lập `ResizeObserver`); cảnh báo thiếu tên. **Toaster:** DOM của icon không đổi sau khi dùng `StatusIcon` |
| 2 | Trình duyệt thật (Chromium, Firefox, WebKit) | Stepper hẹp trong khung 320px: chữ của bước khác bị ẩn khỏi mắt nhưng còn trong cây truy cập; Tab và Enter/Space trên bước; bấm quay lại giữ focus. List: bấm vào bất kỳ đâu trong hàng là bấm tiêu đề, bấm nút ở ô cuối thì không; hover của hàng chỉ ở hàng bấm được. Table: khung thành vùng cuộn được khi hẹp, cuộn bằng phím; tiêu đề dính khi cuộn dọc, sát mép trên của khung có padding; nút sắp xếp. **Vòng focus không bị cắt** (§4.3): ở `striped` và `minimal`, cỡ `md` và `sm`, hộp của nút sắp xếp nới ra 4px (outline) vẫn nằm trong mép padding của khung; ở `lined` với `prefers-contrast: more` và forced colors giả lập, `outline-offset` của nút sắp xếp, IconButton, ô vuông Checkbox, rãnh Switch và chấm Radio là `-2px`; bảng `striped` và `minimal` có cùng toạ độ với khi không có padding. Progress: giá trị đổi cập nhật ARIA. Progress và Skeleton: ở chế độ giảm chuyển động không còn animation (`getAnimations()` rỗng) |
| 3 | Accessibility (axe) | Chạy sau play function, ở mọi story. Đặc biệt: `aria-progressbar-name`, `scrollable-region-focusable` (Table hẹp), `list` (List, Stepper), `aria-allowed-attr` (`aria-current` trên nút) |
| 4 | Tương phản | Các cặp mới ở §4.4, cả chế độ mặc định lẫn `prefers-contrast: more` |
| 5 | Visual regression | Mỗi variant một story vẽ lại đúng các trạng thái của mockup, ở 4 chế độ × light/dark (§2). Story của Progress và Skeleton có thêm lượt giảm chuyển động. Hover qua `data-visual-hover`, focus bằng play function |
| 6 | Screen reader (thủ công) | NVDA và VoiceOver: công thức `role="status"` và `role="alert"` của Alert; tên, giá trị và trạng thái của Progress; chữ ẩn của bước và bản hẹp của Stepper; liên kết kéo giãn của List; vùng cuộn và `aria-sort` của Table |

**Story giao diện của mỗi variant** (dựng lại nội dung mẫu của mockup):

- **Alert** (`Stripe`, `Tinted`, `Plain`): bốn trạng thái có tiêu đề và mô tả, một Alert có hai nút hành động, một Alert đóng được, một Alert gọn chỉ có tiêu đề.
- **Progress** (`Thin`, `Glow`, `Inline`): 45% có nhãn và giá trị, 0%, 100% `success`, 62% `error`, chưa xác định, `sm` không nhãn dưới một dòng tệp. Gắn tag `reduced-motion`.
- **Skeleton** (`Pulse`, `Shimmer`, `Glass`): thẻ hồ sơ và danh sách ba dòng đang tải, cạnh nội dung đã tải. Gắn tag `reduced-motion`.
- **Stepper** (`Circles`, `Compact`, `Bars`): ngang (2 xong, 1 hiện tại, 1 chưa tới), bước hiện tại lỗi, focus bàn phím trên một bước đã xong, dọc có mô tả, bản hẹp trong khung 320px.
- **List** (`Inset`, `Cards`, `Plain`): danh sách thành viên (hàng tĩnh có Badge, hàng liên kết được hover, hàng có nút "…", hàng có focus) và danh sách cài đặt `sm` (hàng hiện tại, hàng liên kết, hàng có mô tả, hàng disabled).
- **Table** (`Lined`, `Striped`, `Minimal`): bảng đơn hàng (ô chọn tiêu đề một phần, cột đang sắp giảm dần, hai cột sắp được, focus trên nút sắp, một hàng đã chọn có Badge `accent`, một hàng hover, hàng chân), mật độ `sm` có focus trên nút sắp, trạng thái rỗng; thêm một story `StickyHeader`. Ảnh chuẩn ở `contrast-more` và `forced-colors` cho thấy outline của focus nguyên vẹn, khung 2px của hàng đã chọn và đường kẻ thay sọc.

**Harness visual** (`tests/visual/stories.visual.ts`):

- **Lượt `reduced-motion`** (Plan A): story có tag `reduced-motion` được chụp thêm với `page.emulateMedia({ reducedMotion: 'reduce' })`, light và dark, ở chế độ `normal` (2 ảnh mỗi story), tên `…--<theme>--reduced-motion.png`.
- **Móc `data-visual-hover`** (Plan B): nếu story có phần tử `[data-visual-hover]`, harness rê chuột thật lên phần tử đầu tiên trước khi chụp. `:hover` của CSS không bật được từ play function, vì sự kiện con trỏ của nó là sự kiện giả. Trước khi rê chuột, harness chờ Storybook báo lượt render của story đã xong (`window.__STORYBOOK_PREVIEW__.currentRender.phase === 'finished'`, đặt sau play function, lượt chờ animation và các hook `afterEach`, kể cả khi play function ném lỗi): play function của `Inset`, `Cards`, `Plain` Tab bốn lần, và lúc trang vừa tải xong nó có thể chưa chạy hết (phát hiện khi review PR #28; trước đó thứ tự chỉ dựa vào việc `toHaveScreenshot` chụp lại tới khi hai ảnh liên tiếp giống nhau). Story không có móc thì chụp như cũ.

**Kiểm tra bổ sung:**

- **Test kiểu:**
  - Union của `variant` mỗi component từ chối giá trị lạ, kể cả giá trị của component khác (`<Table variant="inset">`).
  - `Stepper` bắt buộc `value`; `Step` không nhận `ref`.
  - `TableCaption` không nhận `id`; `TableHead` `align` chỉ nhận `start | center | end`; `onSort` nhận `'ascending' | 'descending'`.
  - `Progress` nhận `value={null}` và không nhận `role`.
- **Gói phát hành:** `check:use-client`, `check:dist-css` và `check:rsc` thêm danh sách ở §3.1 và §3.6 (lớp CSS của mọi phần: `flg-alert`, `flg-progress`, `flg-skeleton`, `flg-stepper`, `flg-step`, `flg-list`, `flg-list-item`, `flg-table-frame`, `flg-table`, `flg-table-sort`…); `size-limit` ghi lại ngưỡng ở mỗi plan.
- **Khung hình của animation** (lớp 2, story của Skeleton và Progress): keyframe đọc qua `getAnimations()` đúng mockup (độ mờ .4 của `pulse`, vệt `--flg-skeleton-shine` của `shimmer`, đỉnh "thở" của `glass`, đoạn 35% của Progress), vì ảnh chuẩn chỉ chụp trạng thái gốc (§3.3). `theme-css.test.ts` giữ bốn token theo theme đúng giá trị mockup.
- **Fixtures** (Plan C):
  - `next-app`: trang Server Component render thẳng Alert (không có `onDismiss`), Skeleton, SkeletonText, Stepper chỉ hiển thị, List có hàng `href` và hàng `renderLink` với `Link` của Next, Table có các phần server-safe bên trong `Table`. Một client component có Alert đóng được, Progress, List có `onSelect`, Table có `onSort`, và một Stepper bấm được với các `Step` viết ngay trong client component đó (quy tắc ở §6.3; phát hiện khi đọc soát spec).
  - `vite-app`: cùng bộ component trong client.
  - Kịch bản kiểm tra: HTML từ server có `role="progressbar"`, `<ol role="list" class="flg-stepper"` (thẻ `<ol` của Stepper có `role="list"` trước `class`, nên kịch bản khớp theo `class="flg-stepper"` trong thẻ; phát hiện khi lập Plan C), `<table class="flg-table"`; Stepper bấm được có đủ bước trong HTML từ server và sau khi hydrate; bấm nút sắp đổi `aria-sort`; bấm nút đóng bỏ Alert; bấm bước đã xong đổi bước hiện tại; khung bảng thành `role="region"` khi trang hẹp. Console phải sạch, như các giai đoạn trước.

---

## 8. Docs và phát hành

- **Mỗi component mới có một trang MDX,** cùng khuôn với các giai đoạn trước: cách dùng, bảng props, ví dụ, ghi chú accessibility, "nên / không nên". Mỗi trang có một mục **"Variants"** vẽ ba variant cạnh nhau và nói khi nào dùng cái nào (theo ghi chú trên trang chọn của mockup).
- **Trang của từng component** ghi thêm:
  - Alert: công thức `role="status"` (vùng có sẵn) và `role="alert"` (chèn sau hành động) (§3.4); chuyển focus khi Alert đóng; `AlertTitle asChild` cho heading.
  - Progress: luôn có tên; `showValue` hoặc `getValueText` khi giá trị quan trọng; dạng `sm` dưới một dòng tệp với `aria-label`.
  - Skeleton: bọc thành component riêng với `variant` cố định; dùng `circle` bằng cỡ Avatar.
  - Stepper: render nội dung theo `value`; bấm quay lại với `onValueChange`; bản hẹp; quy tắc "viết các `Step` trong chính component render `Stepper`", với một ví dụ đúng (client component tự viết các `Step`) và một ví dụ sai (trang Server Component truyền `Step` vào client component) cùng lời cảnh báo nó gây ra (§6.3).
  - List: `renderLink` cho router; `size="sm"` cho danh sách điều hướng; hàng hiện tại nên chỉ có chữ và icon (§4.4); `cards` cho danh sách ngắn (§10); hạn chế bôi đen chữ.
  - Table: tên của bảng (`TableCaption` hay `aria-labelledby`); sắp xếp với `onSort`; cột ô chọn và ô chọn tất cả; `stickyHeader` cần chiều cao tối đa trên khung; khung `striped` và `minimal` rộng hơn bảng 6px mỗi phía (vùng chứa cần chừa chỗ đó ở mép màn hình); khung `lined` cắt sát viền, nên control riêng của người dùng trong ô nên cách viền ít nhất 4px.
- **Getting started** thêm hai mục (theo bản quyết định ban đầu):
  - **"Loading states":** vùng chứa `aria-busy` luôn có mặt (đổi về false khi xong) với vùng `role="status"` có mặt từ trước để báo, và các Skeleton bên trong được thay bằng nội dung (phát hiện khi review cuối Plan A); `Progress` cho tiến độ biết được, `Spinner` cho chờ ngắn không biết trước; hàng đang tải của Table với Skeleton trong ô.
  - **"Show data":** Table có sắp xếp, chọn bằng Checkbox và Pagination; trạng thái rỗng (hàng `colSpan`); List cho điều hướng với `current` và `renderLink`; Stepper với nội dung theo `value`, các `Step` viết trong cùng component với `Stepper`. Nói rõ lib không xử lý dữ liệu.
- **Accessibility:**
  - Bảng §4.9 tự dựng từ `scripts/contrast-exceptions.ts`, nên nó có các dòng 23–34 và nhãn mới của các dòng được mở rộng (§4.4). Plan nào thêm dòng thì sửa cả bảng §4.9 và đoạn sau nó trong spec 0+1, như giai đoạn 3.
  - Ghi chú: Alert không tự làm vùng live; Skeleton luôn ẩn và vùng chứa nói "đang tải"; chữ ẩn của Stepper; tên của link trong List; vùng cuộn của Table; quy tắc giảm chuyển động mới.
- **Phát hành:**
  - Một changeset `minor` cho `0.3.0`: `.changeset/phase-4-data-display.md`, liệt kê 6 component cùng các phần của chúng và ba `variant` của mỗi component. Không có thay đổi phá vỡ.
  - **Việc của chủ dự án không đổi** (spec 0+1 §8.3): chủ dự án là người publish.

---

## 9. Tiêu chí hoàn thành giai đoạn 4

1. Cả 6 họ component ở §2 qua các lớp 1–5 ở §7, ở cả ba variant.
   - Cách đếm: mỗi component cùng các phần con của nó tính là một mục (`AlertTitle`, `AlertDescription`, `AlertActions` tính với `Alert`; `SkeletonText` với `Skeleton`; `Step` với `Stepper`; `ListItem` với `List`; các phần của Table với `Table`).
   - Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục.
2. Toàn bộ kiểm tra bổ sung ở §7 xanh trong CI.
3. Fixture Vite và fixture Next.js chạy đủ kịch bản ở §7 từ tarball.
4. Mọi cặp tương phản mới đã đạt, hoặc đã có trong §4.9 kèm số đo, và các dòng 23–34 đã được chủ dự án duyệt.
5. Changeset `0.3.0` đã sẵn sàng. Việc publish là quyết định của chủ dự án.

---

## 10. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Ảnh chuẩn visual gấp khoảng ba lần: 18 story giao diện × 8 ảnh, cộng lượt giảm chuyển động và story phụ, khoảng 160 ảnh mới (hiện có 752) | Mỗi plan chỉ thêm ảnh của mình; tạo ảnh qua workflow `visual-update.yml` như trước; mô tả PR nêu số ảnh mới để chủ dự án duyệt theo nhóm variant |
| CSS tăng vì mọi variant đều nằm trong `styles.css` | Phần chung viết một lần, variant chỉ ghi phần khác (§3.2); `size-limit` ghi lại ngưỡng theo số đo thật ở mỗi plan. Tách CSS theo variant là việc của giai đoạn sau nếu cần |
| Container query của Stepper hẹp trên Safari | Có từ Safari 16, trước mốc 17.4. Container có tên, chỉ Stepper ngang là container (§3.5). Story hẹp chạy ở lớp 2 trên WebKit. Docs: Stepper ngang rộng bằng vùng chứa; đặt nó trong một cha co theo nội dung thì nó co về 0 |
| `ResizeObserver` của Table: vòng lặp "loop limit exceeded", hay vai trò vùng cuộn đến muộn | Chỉ đọc kích thước, chỉ đặt state khi kết quả đổi; vai trò chỉ có sau khi mount là chủ ý (HTML từ server không cuộn được bằng phím cho tới khi hydrate). Lớp 2 kiểm khung hẹp lại khi cửa sổ thu nhỏ |
| `clip-path` trên `<tr>` (hàng đã chọn của `striped`) và nền gradient của `<tr>` (`lined`, `minimal`) có thể bị một engine vẽ theo từng ô | Plan C mở story trên ba engine và ghi kết quả. Engine nào không cắt được hàng thì `striped` quay về vẽ nền trên từng ô như mockup (gradient lặp theo ô ở light), và mô tả PR nêu rõ để chủ dự án quyết |
| Nhiều hàng kính của List `cards` làm nặng `backdrop-filter` | Docs khuyên `cards` cho danh sách ngắn (khoảng 10 hàng trở xuống), `inset` hay `plain` cho danh sách dài |
| Nhiều Skeleton cùng chạy: `glass` đổi `background-color` nên trình duyệt vẽ lại mỗi khung hình | `pulse` (độ mờ) và `shimmer` (`transform`) chạy trên compositor; docs nói `glass` tốn hơn khi có nhiều khối. Giảm chuyển động dừng hết |
| Alert render cùng trang không được đọc khi có `role` | Lib không tự gán vai trò (§3.4); docs có hai công thức; lớp 6 kiểm cả hai |
| Phần đã chạy của Progress dưới 3:1 so với rãnh ở theme mặc định (dòng 27, 28) | Theme mặc định giữ mockup; `prefers-contrast: more` đạt; docs khuyên `showValue` khi giá trị quan trọng. Chủ dự án duyệt dòng §4.9 |
| `:has()` (dạng gọn của Alert, focus của hàng List, ô chỉ có Checkbox của Table) và đơn vị `lh` (Skeleton `text`) | Có trên mọi trình duyệt của mốc 17.4 và Firefox hiện hành; HTML từ server không cần JS cho các trạng thái này |
| Liên kết kéo giãn của List: khó bôi đen chữ, mô tả không nằm trong tên của link | Ghi trong docs (§6.3); nội dung quan trọng đặt trong `title` |
| Hover không chụp được từ play function | Móc `data-visual-hover` của harness (§7) |
| Khung của Table `striped` và `minimal` rộng hơn vùng chứa 6px mỗi phía (margin âm giữ vòng focus nguyên vẹn, §4.3): sát mép màn hình mà vùng chứa không có padding thì trang có thể cuộn ngang 6px | Khung trong suốt nên không thấy; Card và mọi vùng chứa có padding ≥ 6px không bị. Docs nêu điều này; story hẹp ở lớp 2 kiểm trang không cuộn ngang khi Table nằm trong Card |
| Vị trí dính của tiêu đề trong khung có padding khác nhau giữa các engine | Plan C kiểm ở ba engine và chỉnh `top` (§4.3) |
| Stepper bấm được không nhận bước nào khi các `Step` được viết trong Server Component và truyền vào client component | Quy tắc ở §6.3, hai cảnh báo dev nêu đúng nguyên nhân (§5), ví dụ đúng và sai trong docs, và fixture Next.js chạy đúng cách viết đúng (§7) |
