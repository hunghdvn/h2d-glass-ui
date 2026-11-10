# h2d-glass-ui: Plan A, `useMediaQuery`, `MenuIcon`, harness và AppShell (giai đoạn 5, phần 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan A, plan đầu của giai đoạn 5: khung ứng dụng `AppShell` cùng các phần (`AppShellHeader`, `AppShellSidebar`, `AppShellMain`, `AppShellFooter`, `AppShellSidebarTrigger`) và `AppShellBrand`, với hai bố cục `layout="sidebar"` (S1) và `layout="header"` (S2) theo mockup đã duyệt, rail ở màn rộng và tấm trượt ở màn hẹp; hook nội bộ `useMediaQuery` và icon `MenuIcon`; tag `viewport-<rộng>x<cao>` của harness visual và stage `'page'` của Storybook; trang `AppShell.mdx`, mục AppShell của trang Accessibility và ngưỡng kích thước.

**Architecture:**
- **`useMediaQuery`** (Task 1): hook nội bộ trong `src/internal/use-media-query.ts`. `useSyncExternalStore` trên `matchMedia(query)`; giá trị phía server và lúc hydrate là `false`; không có `matchMedia` (jsdom) thì `false`.
- **`MenuIcon`** (Task 1): ba vạch ngang, khung 24×24, nét 2, trong `src/internal/icons.tsx`.
- **Harness** (Task 1): hàm thuần `viewportFromTags` trong `scripts/lib/viewport-tag.ts`; `tests/visual/stories.visual.ts` đặt cỡ cửa sổ của mỗi story theo tag `viewport-<rộng>x<cao>` trước khi nạp trang. Stage `'page'` trong `.storybook/preview.tsx` và `.storybook/stage.css`.
- **AppShell và các phần** (Task 2): client (`AppShell.tsx`, `"use client"`). Gốc `div.flg-app-shell` là một lưới; các phần là con trực tiếp, đặt bằng số đường lưới. Header dính vì nó trải qua mọi hàng của cột mình. Sidebar là ô lưới trong suốt, tấm kính bên trong là phần dính. Skip link là con đầu của gốc. Brand được vẽ hai lần (header và đầu sidebar), CSS chỉ hiện một. `AppShellBrand` là server-safe (`AppShellBrand.tsx`).
- **Hai nguồn CSS** (Task 2–4): `src/styles/components/app-shell.css` là màn hẹp và phần chung. `scripts/lib/app-shell-css.ts` sinh `src/styles/generated/app-shell.css` (qua `pnpm gen:theme`), mỗi điểm gãy một khối `@media (min-width: N)` (lưới có sidebar, tấm kính dính, rail) và, từ Task 4, một khối `@media not all and (min-width: N)` (tấm trượt). Mỗi điểm gãy chỉ một ranh giới. `src/components/app-shell/breakpoints.ts` (Task 3) là nguồn duy nhất của các số đó cho bộ sinh và cho `useMediaQuery`.
- **Hai quy tắc cho tài liệu** (Task 2): `useHeaderOffset` ghi chiều cao đo được của header thành `--flg-app-shell-header-offset` trên `<html>`; `scroll-padding-top` của `<html>` lấy từ đó, và `body` bỏ margin, chỉ trên trang có khung.
- **Trigger, rail, trạng thái mở** (Task 3): `AppShellHeader` render `AppShellSidebarTrigger`, rồi ô brand, rồi `children`. Một nút hai việc: màn hẹp mở tấm trượt, màn rộng thu sidebar thành rail và mở lại. `collapsed` và `open` có controlled và uncontrolled. Rail chỉ là CSS, không có animation.
- **Tấm trượt** (Task 4): cùng phần tử sidebar thành một lớp `position: fixed` khi mở ở màn hẹp: `role="dialog"` không có `aria-modal`, `inert` cho phần còn lại của khung, khoá cuộn, focus vào trong rồi về nút đã mở, Esc (ba ngoại lệ), lớp nền, nút ×, trượt vào bằng `@starting-style`. Cửa sổ rộng ra thì tấm đóng. Context có `setOpen(open, { returnFocus, opener })` cho `NavItem` của Plan B.
- **Docs và ngưỡng** (Task 5): `AppShell.mdx` (ví dụ sống là `<iframe>` của story), mục "The app shell" của trang Accessibility, `pnpm size:record` một lần cho cả Plan A.

**Tech Stack:** Như giai đoạn 4: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0. Plan này không thêm dependency nào.

**Spec:** `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`. Plan này làm các phần sau:
- §2 dòng A: `useMediaQuery`, `MenuIcon`, tag `viewport-…` và stage `'page'` (Task 1); AppShell, các phần và `AppShellBrand` (Task 2–4); docs (Task 5).
- §1: các dòng của AppShell trong bảng "Các điểm Claude chốt": Giao diện thành prop (`layout`), Tấm trượt trên màn hẹp, Nút trigger và brand trong header, Brand, Lưới và header dính, Tài liệu dưới header dính, Điểm gãy, Kiểm thử (tag và stage).
- §3.1: dòng AppShell (client) và `AppShellBrand` (server-safe); `check:use-client` thêm `AppShell.tsx`; các ca `check:rsc` của `AppShellBrand` (Task 2).
- §3.2: dòng S (`layout`, `data-layout`) (Task 2).
- §3.3: cuộn bằng tài liệu, điểm gãy, CSS màn rộng sinh ba bản, biến độ đo, lưới, tài liệu dưới header dính (Task 2); thu gọn thành rail (Task 3).
- §3.4: tấm trượt (Task 4), trừ việc kích hoạt một `NavItem` thì đóng tấm (Plan B).
- §3.5: bố cục, tấm trượt và chỗ chừa cho header (Task 2, 4); rail, màn rộng hay hẹp trong JS, tên của trigger (Task 3).
- §3.6: tấm trượt và lớp nền (Task 4); rail không có animation (Task 3).
- §3.7: các file của Plan A.
- §4.1: mockup S1, S2 (`phase-5-shell.html`).
- §4.3 **AppShell**: header, sidebar, main, footer, brand, "Brand ở đâu", skip link, dark (Task 2); đầu hàng của header và rail (Task 3); hàng đầu của tấm trượt, nút ×, tấm trượt, lớp nền (Task 4).
- §4.4: dòng 2 và 6 mở rộng (brand là link, skip link; chữ của footer) (Task 2). Plan A không thêm check tương phản và không thêm dòng §4.9.
- §4.5 **AppShell**: skip link; header, sidebar, footer dùng quy tắc `.flg-surface` có sẵn (Task 2).
- §4.6: `MenuIcon` (Task 1); nút × dùng `CloseIcon` có sẵn (Task 4).
- §5: `use-media-query.ts` (Task 1); `app-shell-context.ts`, `use-header-offset.ts` (Task 2–4); các cảnh báo của AppShell (Task 2, 3, 4).
- §6.1: quy ước API (`ref`, `className`, `labels`, id do lib sinh, controlled).
- §6.3: `AppShell` và các phần (Task 2–4), `AppShellSidebarTrigger` (Task 3), `AppShellBrand` (Task 2).
- §7: lớp 1–3 của AppShell, test kiểu, kiểm tra gói (Task 2–4); story giao diện của Plan A (Task 2–4); harness: tag `viewport-…` và stage `'page'` (Task 1).
- §8: `AppShell.mdx` và ghi chú AppShell của trang Accessibility (Task 5).
- §9: Task 5 kết thúc bằng kiểm tra cuối của cả nhánh. Tiêu chí của §9 chỉ đủ sau Plan C.
- §10: các dòng `dvh`, phần tử dính trong lưới, `inert`, không `aria-modal`, `Toaster` trong main, ảnh chuẩn, CSS tăng, `:has()`, style cho tài liệu (Task 2–4).
- §4.9 của spec 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): nhãn của dòng 2 và 6, và một đoạn mới sau bảng (Task 2).

Chủ dự án chọn mockup ngày 2026-11-10 ("Cả S1 và S2, …") và duyệt spec cùng ngày, kể cả dòng 35–36 của §4.9 (của Plan B và Plan C).

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-5-plan-a`, mỗi task một commit: năm commit trên `3bd350a` (`feat/phase-5-spec`, tức `main` `1301cbb` cộng spec giai đoạn 5 đã duyệt và mockup): `93d77c5` (Task 1), `0d210ca` (Task 2), `aa5c1b0` (Task 3), `d8a19d7` (Task 4), `e27bd07` (Task 5).
- Mỗi test viết trước đã được chạy trên commit cha của task. Các test viết sau code, và cách chúng được kiểm bằng đột biến, nằm ở phát hiện 13.
- Cả năm task do subagent Claude Sonnet viết, lần lượt từng task. Plan A không dùng opencode: việc đó không được đề xuất trong phiên này (mỗi phiên cần chủ dự án đồng ý), và khung cần phán đoán (CSS lưới, focus, `inert`, ba engine). Claude (Opus) kiểm tra từng task.
- Claude chụp các story giao diện từ Storybook đã build và đối chiếu với s1, s2:
  - sau Task 2, `Sidebar` và `Header` (sáng, tối): khớp, trừ nút trigger (Task 3 thêm) và mục "Settings" chưa nằm ở đáy nav của story (Task 3 sửa CSS của story);
  - sau Task 3, `SidebarRail` và `HeaderPhone`: khớp;
  - sau Task 4, `SidebarPhoneOpen` và `HeaderPhoneOpen` ở 390×844: khớp.
- Mọi khối patch trong plan được lấy thẳng từ năm commit đó (`patches/make-patches.sh` của bản nháp tách mỗi commit thành patch test và patch code).

Kết quả đo ở `c41fb4c` (trước khi Claude sửa tên một test trong Task 4; nội dung code không đổi, đầu nhánh nay là `e27bd07`), ngày 2026-11-10, do Claude chạy (`check-p5a.sh` của bản nháp):

| Lệnh | Kết quả |
|---|---|
| `pnpm test:unit` | 3773 test PASS, 3 skip (188 file; project `unit`, `unit-react18` và `scripts`) |
| Story | app-shell 105, docs 30, ở mỗi project (`storybook-light`, `storybook-dark`). PASS ở Chromium, Firefox và WebKit, chạy từng thư mục một và từng project một. Cả bộ story chưa chạy một lượt trên máy này; CI chạy cả bộ |
| `pnpm check:contrast` | PASS. Plan A không thêm check; dòng 2 và 6 chỉ mở rộng nhãn |
| `pnpm check:package` | PASS với ngưỡng mới: JS 54338 B, CSS 15436 B (đo được JS 49.4 kB, CSS 14.03 kB; ngưỡng trước 51713 B và 14052 B) |
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name`, `pnpm build` | PASS |
| `pnpm build-storybook`, `pnpm check:docs-tables` | PASS (`no table built as text in 177 files`). Index đã build có đúng một trang docs của AppShell, `components-appshell--docs` |
| Fixtures | Không chạy: Plan A không đổi fixture (Plan C thêm trang khung vào hai fixture) |
| Visual | Chưa chạy. 64 ảnh chuẩn mới của tám story giao diện chạy lần đầu trong CI |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Năm task nháp là năm task của plan, cùng số thứ tự** (Claude chốt cách chia, để mỗi commit review được riêng).
   - Task 1: `useMediaQuery`, `MenuIcon`, tag `viewport-<rộng>x<cao>`, stage `'page'`.
   - Task 2: cấu trúc AppShell và hai bố cục ở mọi chiều rộng, chưa có trigger: các phần, `AppShellBrand`, context, skip link, bộ sinh CSS màn rộng, hai quy tắc cho tài liệu.
   - Task 3: `AppShellSidebarTrigger`, rail, đường đi của trạng thái `open` (tấm trượt chưa có giao diện và hành vi modal).
   - Task 4: tấm trượt ở màn hẹp: CSS, lớp nền, nút ×, trượt vào, mọi hành vi modal của §3.4.
   - Task 5: `AppShell.mdx`, ghi chú trên trang Accessibility, ngưỡng kích thước.
   - Mỗi task thêm những story giao diện nó vẽ đúng được: `Sidebar`, `Header` ở Task 2 (header chưa có trigger); `SidebarRail`, `HeaderRail`, `SidebarPhone`, `HeaderPhone` ở Task 3 (và trigger vào `Sidebar`, `Header`); `SidebarPhoneOpen`, `HeaderPhoneOpen` ở Task 4.
2. **Harness và story toàn trang** (Task 1, 2):
   - Stage `'page'`: `.storybook/preview.tsx` đặt `data-stage` cho `'viewport'` và `'page'`, mọi giá trị khác thì không đặt. `.flg-stage[data-stage='page']` không padding, `display: block`, `overflow: clip`, cao tối thiểu `100vh`, vẫn vẽ nền mockup.
   - **`place-items: normal`** (Task 2). Stage gốc có `place-items: center`, và Chromium căn phần tử khối con theo nó, nên gốc lưới của khung co về bề rộng nội dung và nằm giữa (`NoSidewaysScroll…`, lần chạy đầu: `expected 347.75 to be close to 264`). Story của Task 1 chỉ kiểm `top`, nên không thấy. Một dòng trong `.storybook/stage.css`.
   - Tag: `viewportFromTags` đọc `viewport-<rộng>x<cao>` (tag đầu khớp thắng; tag hỏng thì giữ mặc định). Harness gọi `page.setViewportSize(viewportFromTags(story.tags))` trước `page.goto` ở mọi story. Mặc định 1280×720 đúng bằng cỡ của config, nên story cũ được chụp như trước.
   - `.storybook/viewport.ts`: `withViewport(run)` đặt cỡ cửa sổ qua `page.viewport` của Vitest, chờ hai khung hình, và trả cỡ cũ khi `run` xong, kể cả khi nó throw. Trong giao diện Storybook không có cách đổi cỡ từ story, nên `withViewport` trả `undefined` mà không chạy gì, và story bỏ qua phần kiểm tra (như các story cần input thật).
   - Story điện thoại chạy dưới `test:stories` ở cỡ của runner (màn rộng): ở đó chúng giống `Sidebar`, `Header` trừ footer, và play function của `…PhoneOpen` không làm gì. Harness visual chụp chúng ở 390×844.
3. **Sidebar là ô lưới trong suốt, tấm kính là con dính của nó** (Task 2; spec đã sửa).
   - Bản đầu cho chính phần tử sidebar vừa là ô hàng 2 vừa `position: sticky`. Ở S2 cuối trang, nó đè lên footer 44px ở Chromium, Firefox và WebKit (`StickyHeaderLayout`: `expected 719.7 to be close to 675.7`). Phần tử dính bị giữ bởi content box của cha (cả lưới), không bởi ô lưới của nó.
   - Cách sửa: `.flg-app-shell-sidebar` là ô (`display: block` ở màn rộng, `none` ở màn hẹp, không có nền); `.flg-app-shell-sidebar-panel` (lớp `flg-surface`) là phần dính, cao `100%` của ô.
   - `className`, `style`, `ref` và mọi prop của `AppShellSidebar` vào ô, không vào tấm kính. `role="dialog"`, `aria-label` và `inert` của tấm trượt cũng nằm trên ô (Task 4). Tấm trượt cho ô `position: fixed`, và tấm kính lấp đầy ô.
   - Cuối trang S2, tấm kính bị đẩy lên chứ không co lại: đỉnh của nó trượt xuống dưới header, như sidebar của một trang tài liệu.
4. **Tài liệu dưới header dính** (Task 2):
   - `useHeaderOffset(header)` nhận phần tử (giữ trong state của `AppShell`), không nhận ref, nên một header mount sau khung vẫn được đo (spec §5 đã sửa). Thuộc tính chỉ ghi khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` thì không ghi gì và CSS giữ 56px hay 60px.
   - Quy tắc: `:root:has(.flg-app-shell > .flg-app-shell-header) { scroll-padding-top: var(--flg-app-shell-header-offset, 56px) }`, và trong mỗi khối màn rộng một bản với dự phòng 60px. `body:has(.flg-app-shell) { margin: 0 }`.
   - Story `FocusStaysBelowTheHeader…`: bản đầu dùng một hàng nằm hẳn ngoài cửa sổ và pass cả khi không có quy tắc, vì trình duyệt đặt hàng đó vào giữa màn hình. Bản cuối dùng hàng nằm trong cửa sổ nhưng sau header (`ROW_UNDER_HEADER`); bỏ quy tắc thì fail: `1280px: the focused row is below the header: expected 9.7 to be >= 59.5`.
5. **Skip link và axe `region`** (Task 2):
   - Skip link là con đầu của gốc, trỏ vào id của `AppShellMain`; main có `tabIndex={-1}`.
   - Một lần đi tới đoạn (`#…`) thật làm đóng trang trình duyệt của Vitest (Chromium và Firefox; cả `link.click()`). Vì vậy story `SkipLink…` bắt cú bấm ở pha capture và làm đúng việc trình duyệt làm: `main.scrollIntoView()` (theo `scroll-padding-top`) rồi `main.focus()`. Lần đi thật để cho fixture của Plan C. WebKit mặc định không đưa link vào thứ tự Tab, nên ở đó story đặt focus bằng script.
   - Story của AppShell bật lại các quy tắc trang của axe: `region`, `landmark-one-main`, `landmark-unique`, `bypass`. `region` bỏ hai chỗ qua `selector`: skip link (trang Storybook có link trước nó, nên axe không coi nó là link đầu trang) và hàng đầu của sidebar cùng mọi thứ trong đó (S1 màn rộng vẽ brand ở đó; sidebar không phải landmark, nên brand nằm ngoài mọi landmark). Chỗ thứ hai là ghi chú cho chủ dự án trong mô tả PR: muốn sửa thì brand phải nằm trong một landmark. Spec §7 lớp 3 đã sửa.
6. **Cấu trúc và API** (Task 2):
   - `layout` và `breakpoint` ngoài union thành giá trị mặc định (`'sidebar'`, `'lg'`), không có ép kiểu nào che chúng.
   - Brand: ô brand của header chỉ có khi `hasContent(brand)` (`brand={0}` vẫn vẽ); hàng đầu của sidebar luôn có.
   - `AppShellBrand`: kiểu props là một union, `children` chỉ có khi `asChild`, `href` chỉ có khi không `asChild` (spec §6.3 đã sửa). Con truyền từ Server Component có thể là tham chiếu lazy, nên nó đi qua `resolveLazy` trước `Slot`.
   - Các phần đăng ký với khung trong effect của chúng (cho các cảnh báo); `parentElement !== root` thì cảnh báo "not a direct child".
   - `AppShellLabels` ở Task 2 chỉ có `skipToContent`; Task 3 và 4 thêm các khoá còn lại.
   - Ô brand S2 ở màn rộng rộng 268px ở task này (chưa có trigger); Task 3 làm nó 226px khi trigger hiện.
7. **Bộ sinh CSS** `scripts/lib/app-shell-css.ts` (Task 2, 3, 4):
   - `wideRules(breakpoint)` nằm trong `@media (min-width: N)`. `sheetRules(breakpoint)` (Task 4) nằm trong `@media not all and (min-width: N)`, cùng số N: vẫn một ranh giới mỗi điểm gãy, và một `open` mà cha giữ `true` ở màn rộng không vẽ gì. File sinh ra có sáu khối.
   - `pnpm gen:theme` (`scripts/build-theme.ts`) ghi `src/styles/generated/app-shell.css`; thư mục `generated/` bị git bỏ qua, như `theme.css`. `src/styles/index.css` import nó ngay sau `components/app-shell.css`.
   - Lightning CSS viết `(min-width: 1024px)` thành `(width>=1024px)`, nên regex của `check:dist-css` nhận cả hai dạng.
   - `breakpoints.ts` (Task 3): `APP_SHELL_BREAKPOINTS` và `wideQuery`, dùng chung cho bộ sinh (qua re-export) và cho `useMediaQuery` của khung, nên script và stylesheet không thể lệch nhau.
   - Báo cáo Task 4 ghi một cách khác: nếu muốn tấm trượt là nền và `min-width` là ngoại lệ, khối màn rộng phải đặt lại vị trí, cỡ và transition của ô. Plan giữ cách `not all and`.
8. **Trigger, rail, trạng thái mở** (Task 3):
   - `AppShellHeader` render trigger, rồi ô brand, rồi `children` (`sidebarTrigger`, mặc định `true`). Thứ tự DOM là thứ tự Tab, đúng thứ tự nhìn.
   - Tên và `aria-expanded` theo mode: màn hẹp "Open navigation" và `open`; màn rộng "Collapse sidebar" hay "Expand sidebar" và `!collapsed`. Lần render đầu (server, hydrate) là màn hẹp, đổi tên sau hydrate.
   - `collapsible={false}`: không bao giờ là rail (`setCollapsed` không làm gì); `collapsed` hay `defaultCollapsed` bị bỏ qua kèm cảnh báo; trigger ẩn ở màn rộng qua `:not([data-collapsible])`, vẫn hiện ở màn hẹp.
   - Ô brand S2 ở màn rộng: 226px sau một trigger đang hiện, 268px khi không có (`collapsible={false}`); ô tìm kiếm bắt đầu ở 296px trong cả hai trường hợp (story `TriggerKeepsTheHeaderInPlace`). Màn hẹp: brand cách trigger thêm 4px.
   - Rail S1: hàng đầu chỉ còn dấu ở giữa cột; tên của brand ẩn khỏi mắt (kỹ thuật của `flg-visually-hidden`), vẫn là tên của link. Không có animation.
   - Nav của story ghim "Settings" xuống đáy: `.demo-nav ul { margin: 0 }` (0,1,1) thắng `.demo-nav-end { margin-top: auto }` (0,1,0), nên mục đó nằm ngay dưới link cuối (`NavEndAtTheBottom…`: `expected 507 to be close to 708`, ở ba engine). Sửa trong CSS của story (`.demo-nav .demo-nav-end`), không phải của lib.
   - Story rail vẽ tooltip của "Settings" đang được trỏ ngay trong story (`hoverSettings`: một `flg-tooltip` `position: fixed` ở `left: 78px; top: calc(100dvh - 32px)`, như mockup, `aria-hidden` để axe `region` không bắt; mục mang `data-visual-hover`). Không cần tuỳ chọn Tooltip của Plan B; Plan B thay nó bằng tooltip thật.
   - Header điện thoại của story có một IconButton tìm kiếm dưới 768px, như mockup.
9. **Tấm trượt** (Task 4):
   - `modal = open && !isWide`. Một layout effect theo `modal` làm mọi việc với trang và hoàn lại trong cleanup: `inert` (thuộc tính DOM, vì React 18.3 và 19 xử lý prop `inert` khác nhau) cho skip link, header, main, footer; `lockScroll()`; `focusFirst(sidebar)`; listener Esc trên `document`; trả focus khi đóng.
   - **Tìm các phần bằng `:scope >`.** Các phần đăng ký trong passive effect, chạy sau layout effect của khung, nên với `defaultOpen` registry còn rỗng lúc tấm phải chặn trang và chuyển focus. Chuyển việc đăng ký sang layout effect thì hỏng cảnh báo "direct child" (ref của gốc được gắn sau layout effect của con). Vì vậy khung tìm con trực tiếp bằng `:scope > .flg-app-shell-header` và các selector cùng loại; `registerPart` vẫn chặn một phần mount muộn.
   - `inerted` nhớ những gì khung đã làm `inert`, nên phần tử người dùng tự làm `inert` vẫn giữ nguyên khi đóng.
   - Esc bị bỏ qua khi sự kiện đã `defaultPrevented`, khi `getTopModal()` có giá trị, hay khi trong sidebar có `:popover-open` (bọc `try/catch`: jsdom và engine cũ throw với selector đó).
   - **Đổi cỡ màn:** khi `isWide` đi từ `false` sang `true` trong lúc mở, khung gọi `setOpen(false, { returnFocus: false })`. Chỉ lúc vượt qua mới tính (ref `wasWide`), nên một cha giữ `open` thì chỉ được hỏi một lần, nhận một khung màn rộng bình thường, và có lại tấm khi màn hẹp lại.
   - **`setOpen(open, { returnFocus, opener })`** (spec §5 đã sửa). `opener` là thêm so với spec: Safari không focus nút được bấm, nên `document.activeElement` không cho biết nút nào đã mở tấm; `AppShellSidebarTrigger` truyền chính nó khi mở. `returnFocus` mặc định `true`; focus về `opener`, không có thì trigger đầu tiên còn hiện, qua `returnFocus` của lib (chỉ dời focus đang ở `<body>` hay trong sidebar).
   - Sidebar mang `role="dialog"` và `aria-label` (`labels.navigation`) chỉ khi là tấm trượt, đặt trước `{...props}` nên role và tên của người dùng thắng; không có `aria-modal`.
   - Nút × (`CloseIcon`, `labels.closeNavigation`) chỉ có khi là tấm trượt: S1 sau brand, S2 trước brand, nên Tab và `focusFirst` đi đúng thứ tự nhìn.
   - Lớp nền là con cuối của gốc, chỉ render khi `modal`; nó chỉ đóng khi `target === currentTarget`. Trong trình duyệt, một lần bôi chữ từ sidebar thả trên lớp nền không đưa `click` tới nó, nên điều kiện này là phòng thêm và story của nó là test đặc tả.
   - Cảnh báo khi `.flg-toaster` nằm trong (hay chính là) một phần bị `inert`.
   - jsdom: `inert` là thuộc tính thường (không phản chiếu ra `[inert]`), nên unit test kiểm thuộc tính DOM, và `focusFirst` cần giả lập `checkVisibility`.
   - Helper test `tests/app-shell-window.ts` (`stubWindow`, `resize`) nằm ngoài `src`: ở trong `src/components/app-shell/` thì `check:use-client` đòi build output cho nó.
10. **Story giao diện** (Task 2–4):
    - Tám story có ảnh, `stage: 'page'`: `Sidebar`, `Header` (1280×720, mở rộng, có footer); `SidebarRail`, `HeaderRail` (rail, không footer, "Settings" được trỏ và có tooltip của story); `SidebarPhone`, `HeaderPhone` (`viewport-390x844`, đóng); `SidebarPhoneOpen`, `HeaderPhoneOpen` (`viewport-390x844`, tấm mở).
    - Story `…PhoneOpen` mở tấm trong play function bằng một cú bấm trên trigger rồi `blur()`, nên ảnh không có vòng focus. Ảnh vì vậy không cho thấy focus mà tấm thật đặt vào phần tử đầu.
    - Nội dung là ứng dụng "Lumen" của mockup, tiếng Anh, dựng bằng CSS riêng của story trong `.storybook/app-shell-demo.tsx`: nav trung tính và các IconButton trơn trên header, như trang S vẽ. Nav và widget thật của Plan B, C không nằm trong các ảnh này.
    - Mọi story khác của AppShell (27) gắn `no-visual`. Index đã build: 125 story có ảnh (117 trước Plan A).
11. **Docs** (Task 5):
    - `AppShell.mdx` thay trang autodocs; index có đúng một mục docs, `components-appshell--docs`.
    - **Ví dụ sống là `<iframe>` của story, không phải `<Canvas>`.** Cột docs rộng chừng 983px, dưới điểm gãy 1024px, nên `Canvas` hiện dạng màn hẹp của `Sidebar`, `Header` và `SidebarRail`. Trang nhúng `iframe.html?id=components-appshell--sidebar`, `--header`, `--sidebar-rail` (rộng tối thiểu 1100px trong một khung cuộn ngang) và `--sidebar-phone-open` (rộng 390px). Trang vì vậy phụ thuộc id của story: đổi tên một story là hỏng khung của nó.
    - Trang không nói rằng kích hoạt một `NavItem` thì đóng tấm (đó là Plan B).
    - Trang Accessibility: câu trỏ thêm "AppShell (its part in rows 2 and 6)", và mục mới "The app shell" (skip link và landmark, tấm trượt là hộp thoại có `inert` và không `aria-modal`, toast trên tấm, tên của trigger, `scroll-padding-top`).
    - Dòng 2 và 6: nhãn trong `scripts/contrast-exceptions.ts`, dòng của bảng §4.9 và đoạn sau bảng trong spec 0+1 (Task 2) khớp nhau. `ExceptionTable.test.tsx` đếm 34 dòng và không đọc nhãn, nên không đổi.
12. **Ngưỡng kích thước và `check:package` giữa các task:**
    - Ngưỡng ban đầu (do Plan C giai đoạn 4 ghi): JS 51713 B, CSS 14052 B.
    - Sau Task 1 và Task 2: `check:package` dừng ở `check:use-client`: `dist/internal/use-media-query.js: missing build output`. tsdown chỉ xuất các module đi tới được từ `src/index.ts`, và chưa component nào import hook đó. Ở Task 2, các bước còn lại chạy riêng thì pass (`size`: JS 48.25 kB trên 51.71 kB, CSS 13.76 kB trên 14.05 kB).
    - Sau Task 3: `check:package` PASS trọn (JS 48.89 kB, CSS 13.89 kB; còn 161 B cho CSS).
    - Sau Task 4: PASS, CSS 14.03 kB trên 14.05 kB (còn 20 B; brotli nén tốt ba khối lặp lại).
    - Task 5 chạy `pnpm size:record`: JS 54338 B, CSS 15436 B (số đo JS 49.4 kB, CSS 14.03 kB, cộng 10%). Việc gì thêm CSS hay JS sau Task 5 phải chạy lại `size:record`.
13. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
    - Task 1: `use-media-query.test.tsx` và `viewport-tag.test.ts` fail vì module chưa có, không vì hành vi. Test `MenuIcon` fail với `Element type is invalid … got: undefined`. Story `Sticky Header Sticks To The Document` fail với `expected null to be 'page'`; `Other Stories Keep Their Stage` là test đặc tả.
    - Task 2: test của bộ sinh viết trước (module chưa có). Unit test của component viết sau bản đầu của code, và được thấy fail bằng đột biến (Step 2 của Task 2 liệt kê). Test kiểu là test đặc tả. Story chạy trên code đang viết, và các lỗi đầu của chúng là thật (phát hiện 2, 3, 5); `FocusStaysBelowTheHeader…`, `SkipLink…`, `DocumentRules` được thấy fail bằng đột biến `scroll-padding-top: 0`.
    - Task 3: unit test và test của bộ sinh viết trước code và fail trước. Story rail viết sau CSS, thấy fail bằng đột biến. `NotCollapsible…` và `TriggerNameFollowsTheWindow` pass ngay (test đặc tả). `NavEndAtTheBottom…` bắt lỗi của CSS story, mà chỗ sửa nằm trong patch test, nên trên cây của plan nó pass ngay khi áp patch test.
    - Task 4: unit test viết trước code: 25 trong 34 test của `AppShellDrawer.test.tsx` fail; 9 test còn lại là ca phủ định, pass trên mọi code. Story viết sau code, thấy fail bằng đột biến. Story về cú bôi chữ trên lớp nền là test đặc tả.
    - Task 5 không có test: không có hành vi mới.
    - Trên cây của plan, patch test của Task 2 làm các file test của AppShell fail vì module chưa có (`Failed to resolve import …`).
14. **Các chỗ spec được sửa khi lập Plan A** (đánh dấu "(phát hiện khi lập Plan A)" ở chỗ nêu lý do):
    - Spec giai đoạn 5 §3.3 (Task 2): dòng Sidebar của bảng lưới (ô không có nền; tấm kính bên trong dính, có `max-height`); gạch đầu dòng "Sidebar co theo màn hình" (tấm kính bị đẩy, đỉnh trượt xuống dưới header); gạch đầu dòng mới "Phần tử sidebar là ô lưới trong suốt, tấm kính là con của nó".
    - §4.3 Sidebar (Task 2): tiêu đề (ô và tấm kính) và gạch đầu dòng đầu.
    - §5, danh sách helper: `useHeaderOffset(header)` nhận phần tử (Task 2); `setOpen(open, { returnFocus, opener })` và nghĩa của hai tuỳ chọn (Task 4).
    - §6.3: HTML của cấu trúc (ô và tấm kính) (Task 2); kiểu `AppShellBrandProps` thành union và gạch đầu dòng về `children` (Task 2).
    - §7 lớp 3: hai chỗ `region` bỏ qua (Task 2).
    - §10, dòng rủi ro về phần tử dính trong lưới (Task 2).
    - Spec 0+1 §4.9 (Task 2): nhãn dòng 2 (liên kết của `AppShellBrand`, skip link) và dòng 6 (chữ của footer), và một đoạn mới sau bảng về các vị trí đó.
    - Task 1, 3 và 5 không sửa dòng spec nào.
15. **Ảnh chuẩn của component cũ không đổi.**
    - Stage `'page'` và tag `viewport-…` chỉ có tác dụng với story xin chúng. Mọi story khác vẫn chụp ở 1280×720, cỡ mặc định của config.
    - CSS mới nằm trong `app-shell.css` và file sinh ra, đều dưới selector `.flg-app-shell…`. Quy tắc cho icon và nút ghost trong header chỉ áp trong `.flg-app-shell-header`. Hai quy tắc cho tài liệu chỉ áp trên trang có khung (`:root:has(…)`, `body:has(…)`). `preferences.css` chỉ thêm quy tắc của `.flg-app-shell-skip:focus`.
    - Không token nào được thêm hay đổi giá trị.
    - Story của `Examples/Page stage` gắn `no-visual`. Số story có ảnh đi từ 117 lên 125, đúng tám story của AppShell.
    - Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
16. **Duyệt của chủ dự án.** Không có gì chờ duyệt ngoài review PR. Plan A không thêm dòng §4.9. Mô tả PR vẫn liệt kê:
    - các dòng spec sửa trong bản nháp (phát hiện 14);
    - axe `region` bỏ qua hàng đầu của sidebar, nơi brand S1 màn rộng nằm ngoài mọi landmark (phát hiện 5);
    - dòng 2 và 6 của §4.9 mở rộng nhãn, không thêm dòng;
    - 64 ảnh chuẩn mới cần duyệt: tám story giao diện × 4 chế độ × sáng, tối, đếm từ index đã build (lệnh ở Step 4 của Task 5);
    - merge PR này không phát hành gì (Global Constraints, "Changeset").
17. **Các mục để lại** (không làm ở plan này):
    - Nút × đang có focus khi cửa sổ rộng ra thì biến mất cùng tấm, nên focus rơi về `<body>`. Một link của nav đang có focus thì vẫn giữ focus (spec nói "focus ở yên"; đúng với mọi thứ còn lại trong lưới).
    - Không có test `hydrateRoot` cho `defaultOpen`: việc chặn trang và chuyển focus ở lần render đầu chạy trong layout effect, sau khi mount.
    - Link trong sidebar chưa đóng tấm cho tới khi có `NavItem` của Plan B.
    - `NavItem` của Plan B đóng tấm bằng `setOpen(false)`, nên focus về nút trigger đã mở tấm, đúng spec §3.4 (Claude chốt khi duyệt plan). `returnFocus: false` chỉ dành cho lần đóng do cửa sổ rộng ra; test của nó tên ``is left alone by a close that asks `returnFocus: false` (the close when the window grows wide)`` (bản nháp đầu ghi nhầm là "what a link in the sheet does", Claude sửa tên trong commit Task 4).
    - Lần đi tới đoạn thật của skip link chỉ được kiểm ở fixture của Plan C.
    - Kiểm tra screen reader (§7 lớp 6): skip link, landmark, tấm trượt là hộp thoại "Navigation", và vùng toast vẫn được đọc khi tấm mở.
    - Safari và iPad thật chưa thử (`100dvh` của sidebar dính, §10); story chỉ chạy WebKit của Playwright.
    - `prefers-contrast: more` và forced colors của khung chỉ có trong ảnh chuẩn của harness. Không story nào focus skip link, nên quy tắc forced colors của nó chưa có test.
    - Không story nào dựng khung thiếu header hay sidebar trong engine thật (Review Focus 5).

**Phạm vi:**
- **Không làm ở plan này:**
  - Plan B: `Nav`, `NavSection`, `NavItem`, `NavGroup`, `Indicator`; tuỳ chọn nội bộ của `Tooltip`; móc `data-visual-hover="tooltip"`; quy tắc rail của Nav trong bộ sinh; hai token mới; dòng 35 của §4.9.
  - Plan C: `SearchField`, `ThemeSwitch`, `ThemeMenuGroup`, `ThemeScript`, `UserMenu`; công thức bảng thông báo; trang "Examples/App shell" và mục "App shell" của Getting started (cả công thức cookie đầy đủ); fixtures; changeset `minor` cho `0.4.0`; dòng 36 của §4.9.
  - Ngoài phạm vi của spec §2: menu ngang trên header, hộp lệnh, điều hướng sâu quá 2 cấp, sidebar phải, kéo đổi độ rộng sidebar, animation lúc đóng tấm trượt, hướng phải sang trái, hệ thống i18n.
  - Các mục để lại ở phát hiện 17.
- **Ảnh chuẩn visual:**
  - Story có ảnh: `Sidebar`, `Header`, `SidebarRail`, `HeaderRail`, `SidebarPhone`, `HeaderPhone`, `SidebarPhoneOpen`, `HeaderPhoneOpen` của AppShell, mỗi story 8 ảnh (4 chế độ × sáng, tối): 64 ảnh mới. Không story nào gắn `reduced-motion`.
  - Bốn story điện thoại gắn `viewport-390x844`, nên harness chụp chúng ở 390×844.
  - Ở `SidebarRail` và `HeaderRail`, harness rê chuột lên "Settings" (qua `data-visual-hover`) trước khi chụp; tooltip là của story.
  - Mọi story khác của AppShell và cả hai story của `Examples/Page stage` gắn `no-visual`. Index đã build có 125 story có ảnh (117 trước Plan A).
  - Story của Plan A dùng nav trung tính của story, nên Plan B không phải chụp lại chúng (§10).
  - Không tạo ảnh trên Windows. Ảnh chuẩn mới chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh; mọi story mới chạy lần đầu với ảnh chuẩn trong CI.
  - Ảnh của mọi component cũ phải giữ giống từng byte.

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Import trong trang MDX dùng `'h2d-glass-ui'`.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`.
  - `:has()` (khung không có header hay sidebar, trigger ẩn khi không có sidebar, hai quy tắc cho tài liệu), `inert`, `dvh` và `@media not all and (…)` có ở mọi trình duyệt của mốc này.
  - `@starting-style` dùng như Drawer: engine không biết nó chỉ bỏ hiệu ứng trượt vào.
  - `:popover-open` nằm trong `try/catch`; `checkVisibility` được gọi qua `?.`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute trên gốc: `data-layout`, `data-breakpoint`, `data-collapsible`, `data-collapsed`, `data-open`. Các phần không nhận `layout`: CSS đọc nó từ gốc.
- Biến độ đo của khung nằm trên gốc, không phải token theme: `--flg-app-shell-sidebar-width` (264px), `--flg-app-shell-rail-width` (68px), `--flg-app-shell-drawer-width` (300px), `--flg-app-shell-header-height` (56px hẹp, 60px rộng, `0px` khi không có header). `--flg-app-shell-header-offset` nằm trên `<html>`, do `AppShell` ghi.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS của AppShell nằm trong `@layer flg.components`, ở hai file: `src/styles/components/app-shell.css` (màn hẹp và phần chung) và `src/styles/generated/app-shell.css` (sinh bởi `pnpm gen:theme` từ `scripts/lib/app-shell-css.ts`; git bỏ qua; không sửa tay). Quy tắc `forced-colors` và `prefers-contrast: more` nằm trong `src/styles/preferences.css`.
- Mỗi điểm gãy đúng một ranh giới: quy tắc `min-width` và `not all and (min-width: …)` với cùng số, không bao giờ một cặp 1023/1024 hay `max-width`.
- **Mockup lock.** Không giá trị token nào trong `src/styles/theme/values.ts` đổi, và Plan A không thêm token. Component cũ phải giữ ảnh giống từng byte. AppShell theo đúng S1 và S2.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng từ `src/index.ts` (có trong `src/index.test.ts`). `AppShell.tsx` là client: bắt đầu bằng `"use client"` và có trong `scripts/check-use-client.ts`. `AppShellBrand.tsx` là server-safe: không `"use client"`, không hook, có ca trong `scripts/rsc-probe.mjs`. Class CSS mới có trong `scripts/check-dist-css.ts`. Helper chỉ test dùng nằm ngoài `src` (`tests/app-shell-window.ts`).
- `AppShellMain` và `AppShellSidebar` không nhận `id`: id do lib sinh luôn thắng (spec §6.1). Câu cảnh báo không chứa giá trị đổi theo mỗi lần render.
- Cảnh báo dev đi qua `devWarn`. Lib không throw khi người dùng dùng sai. Trang docs (`*.mdx`) viết bằng tiếng Anh, dòng văn ngắt ở 100 ký tự.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR từ `feat/phase-5-plan-a`. Nhánh đó cắt từ `feat/phase-5-spec` (`3bd350a`), nên PR mang theo cả hai commit spec.
- **Changeset:** Plan A **không** thêm changeset. Changeset `minor` cho `0.4.0` là của Plan C. Merge PR của Plan A là một push lên `main`, nên workflow "Release" (`.github/workflows/release.yml`) vẫn chạy:
  - `changesets/action@v2` không thấy changeset nào (`No changesets found. Attempting to publish any unpublished packages to npm`), nên chạy `publish-script`, tức `pnpm release` (`pnpm build && changeset publish`).
  - `changeset publish` thấy phiên bản `0.3.1` của `package.json` đã có trên npm và in `No unpublished projects to publish.`: không publish, không đẩy tag, không mở PR "Version Packages". Lượt chạy sau khi merge PR #36 (2026-11-10) đi đúng đường đó.
  - Code của Plan A nằm trên `main` mà chưa phát hành, cho tới khi changeset của Plan C và PR "Version Packages" của nó được merge. Nếu trước đó có một changeset khác (ví dụ một bản sửa `patch`) được merge, bản phát hành đó sẽ mang theo AppShell.
  - Claude không chạy `changeset version`, `changeset publish` hay `npm publish`.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (do Plan C giai đoạn 4 ghi): JS 51713 B, CSS 14052 B.
  - Sau Task 1 và Task 2, `pnpm check:package` dừng ở `check:use-client` (`dist/internal/use-media-query.js: missing build output`). Đó là điều đã biết: từ Task 3, khi `AppShell.tsx` import hook đó, nó pass. Không sửa `scripts/check-use-client.ts` để né lỗi này (phát hiện 12).
  - Từ Task 3, `check:package` PASS với ngưỡng cũ; sau Task 4 CSS chỉ còn 20 B dưới ngưỡng.
  - Chỉ Task 5 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép file này: `size:record` tự ghi ngưỡng. Kết quả ở bản nháp: JS 54338 B, CSS 15436 B.
- Trước mọi lệnh `pnpm vitest run --project storybook-*` chạy thẳng, chạy `pnpm gen:theme`: từ Task 2 nó còn ghi `src/styles/generated/app-shell.css`, mà story cần. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không chạy cả bộ story một lượt trên máy thiếu bộ nhớ.** Chạy từng thư mục một, và từng project một (`storybook-light` rồi `storybook-dark`: chạy cả hai trong một tiến trình đã làm đứt kết nối tới trình duyệt trên máy này), như các lệnh trong plan. Không gộp `src/docs` và `src/internal` vào một lần chạy unit (bản nháp hết bộ nhớ V8). CI chạy cả bộ. Không chạy hai lượt story cùng lúc.
- **Cổng 5173, 4173 và 5174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`**: script ghim cổng 5173 và 4173. Plan A không đổi fixture nào, nên không chạy fixture. Storybook chạy tạm (nếu cần) dùng cổng khác; không để server hay tiến trình Storybook chạy sót.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn của AppShell (64 ảnh) đến từ workflow "Update visual baselines" sau khi đẩy nhánh. Không ảnh cũ nào được đổi.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Task 1 đến Task 4 mỗi task có hai khối patch, test rồi code; áp theo đúng thứ tự trong plan. Khối test chứa file `*.test.ts(x)`, `*.test-d.ts`, `*.stories.tsx` và các helper chỉ test dùng (`.storybook/app-shell-demo.tsx`, `.storybook/viewport.ts`, `tests/app-shell-window.ts`). Task 5 chỉ có khối code (docs).
- Khối code của Task 2 và Task 5 có dòng bắt đầu bằng ba dấu backtick (khối code trong spec giai đoạn 5 và trong `AppShell.mdx`), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Task 1 và Task 2 cùng sửa `.storybook/stage.css`. Task 2, 3 và 4 cùng sửa `AppShell.tsx`, `app-shell-context.ts`, `AppShell.stories.tsx`, `AppShell.test-d.ts`, `.storybook/app-shell-demo.tsx`, `src/styles/components/app-shell.css`, `scripts/lib/app-shell-css.ts` và test của nó, `scripts/check-dist-css.ts`. Task 2 và 3 cùng sửa `AppShell.test.tsx`, `src/components/app-shell/index.ts`, `src/index.ts`, `src/index.test.ts`. Task 3 và 4 cùng sửa `AppShellSidebarTrigger.test.tsx`. Task 2 và 4 cùng sửa spec giai đoạn 5. Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan này không xoá file nào. `.size-limit.json` không có trong patch nào: Task 5 ghi nó bằng `pnpm size:record`. `src/styles/generated/app-shell.css` không có trong patch nào: `pnpm gen:theme` sinh nó.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng:

1. **Một trang dài ở S2, cuộn tới cuối.** Footer phải đẩy tấm kính của sidebar lên, không nằm dưới nó; đáy tấm kính trùng mép trên footer, đỉnh của nó trượt xuống dưới header; header vẫn ở đỉnh và bấm trúng được; footer bấm trúng được. Test ở Task 2:
   - story `StickyHeaderLayout`, `StickyHeaderLayoutWithoutFooter`, `StickySidebarLayout`, `StickySidebarLayoutWithoutFooter`, ở ba engine. Bản đầu (sidebar vừa là ô vừa dính) fail ở đây: `expected 719.7 to be close to 675.7` (phát hiện 3);
   - `buildAppShellCss > puts the sidebar in a column of the grid and makes its panel, and the header, sticky` (ô không có `position: sticky`; tấm kính có).
2. **Shift+Tab lên một control nằm dưới header dính.** Control được cuộn ra dưới header, không bị nó che, ở S1 và S2, ở 1280px và 390px; skip link cũng đưa main ra dưới header. Test ở Task 2:
   - story `FocusStaysBelowTheHeaderSidebarLayout`, `FocusStaysBelowTheHeaderHeaderLayout` (bỏ quy tắc thì fail: `1280px: the focused row is below the header: expected 9.7 to be >= 59.5`), `DocumentRules` (`scroll-padding-top` bằng header đo được, theo header lớn lên; `body` không margin), `SkipLinkSidebarLayout`, `SkipLinkHeaderLayout`;
   - `use-header-offset.test.tsx` (7 test: ghi khi mount, theo header lớn lên, chỉ ghi khi đổi, xoá khi unmount, header mount sau, không có `ResizeObserver`, không có border-box size);
   - `buildAppShellCss > keeps the header out from under the scroll with the wide fallback of 60px`.
3. **Tấm trượt đang mở trên điện thoại thì một toast tới.** Toast hiện trên tấm, bấm được, được đọc; tấm vẫn mở; Esc mà Toaster đã nhận thì không đóng tấm; `Toaster` đặt trong main thì có cảnh báo. Test ở Task 4:
   - story `ToastsOverTheSheet` (`Toaster` ngoài `AppShell`, `toast.success` khi tấm mở: toaster là `:popover-open`, toast không nằm trong `[inert]` hay `[aria-hidden]`, danh sách `aria-live="polite"` có chữ, `elementFromPoint` ở tâm toast là toast, cú bấm thật trên nút đóng của toast bỏ nó mà tấm vẫn mở), ở ba engine;
   - `a Toaster inside a part that goes inert` (4 test) và `Esc > leaves it to whoever already took the key (the Toaster does)`.
4. **Đổi cỡ từ điện thoại sang màn rộng khi tấm đang mở** (xoay iPad, kéo cửa sổ). Tấm đóng, `onOpenChange(false)` được gọi một lần, trang hết `inert` và cuộn lại được, focus không bị kéo về trigger; cha giữ `open` thì nhận một khung màn rộng bình thường và có lại tấm khi hẹp lại. Test ở Task 4:
   - story `SheetFollowsTheWindow` (390 → 1280: đóng, trigger thành "Collapse sidebar", sidebar 264px trong lưới; về 390 vẫn đóng) và `ControlledSheetAtWide`, ở ba engine;
   - `a window that crosses the breakpoint while the sheet is open` (3 test), `focus > stays where it is when the window grows wide, which closes the sheet`, `the mode follows the window > keeps a rail a rail when the mode changes, and a wide window closes an open sheet`.
   - Chỗ hở đã biết: nút × đang có focus thì focus rơi về `<body>` (phát hiện 17).
5. **Một khung không có header, không có sidebar, hay không có footer.** Không có header: hàng đầu cao 0, không có `scroll-padding-top`. Không có sidebar: lưới một cột ở mọi cỡ, trigger ẩn, không cảnh báo "no trigger". Không có footer: hàng 3 cao 0, sidebar S1 vẫn tới đáy màn hình. Test:
   - Task 2: `buildAppShellCss > gives a shell without a sidebar one column, and without a header no first row`; story `StickySidebarLayoutWithoutFooter`, `StickyHeaderLayoutWithoutFooter`; `the measure of the header > follows a header that mounts after the shell, and goes when the header is removed`; `AppShell > the brand > leaves out the cell of the header, but not the head of the sidebar, without a brand`.
   - Task 3: `buildAppShellCss > the rail and the trigger > narrows the sidebar column to the rail width when the root is collapsed` (quy tắc một cột của khung không có sidebar thắng quy tắc rail); `dev warnings for the trigger > are silent for a shell with no sidebar: there is nothing to open`.
   - Không story nào dựng khung thiếu header hay sidebar trong engine thật: hai trường hợp đó chỉ được giữ bởi test của bộ sinh và unit test. Reviewer nên đọc kỹ các quy tắc `:not(:has(> …))` của `app-shell.css` và của bộ sinh.

Các chỗ **chỉ story bắt được**: vị trí dính và footer đẩy sidebar (`Sticky…`), trang không cuộn ngang ở mọi điểm gãy và hai phía của mỗi ranh giới (`NoSidewaysScroll…`), control không nằm dưới header (`FocusStaysBelowTheHeader…`, `DocumentRules`, `SkipLink…`), cột rail và bề rộng ô brand (`TriggerFoldsTheSidebar…`, `TriggerKeepsTheHeaderInPlace`, `NotCollapsible…`), hình học, vùng bấm, Tab bị giữ trong tấm và khoá cuộn của tấm trượt (`Sheet…`), và toast trên tấm (`ToastsOverTheSheet`). jsdom không có layout, và `inert` của jsdom không chặn gì.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/internal/use-media-query.ts` (và test) | `useMediaQuery` (Task 1) |
| `src/internal/icons.tsx` (và test) | `MenuIcon` (Task 1) |
| `scripts/lib/viewport-tag.ts` (và test), `tests/visual/stories.visual.ts` | Tag `viewport-<rộng>x<cao>` của harness visual (Task 1) |
| `.storybook/preview.tsx`, `.storybook/stage.css`, `src/docs/PageStage.stories.tsx` | Stage `'page'` (Task 1; `place-items: normal` ở Task 2) |
| `src/components/app-shell/AppShell.tsx` | `AppShell` và các phần (Task 2); trigger, `collapsed`, `open` (Task 3); tấm trượt (Task 4) |
| `src/components/app-shell/AppShellBrand.tsx` | `AppShellBrand`, server-safe (Task 2) |
| `src/components/app-shell/app-shell-context.ts` | Context, `AppShellLabels`, đăng ký phần và trigger (Task 2, 3, 4) |
| `src/components/app-shell/use-header-offset.ts` | Đo header, ghi `--flg-app-shell-header-offset` (Task 2) |
| `src/components/app-shell/breakpoints.ts` | `APP_SHELL_BREAKPOINTS`, `wideQuery` (Task 3) |
| `src/components/app-shell/index.ts`, `src/index.ts`, `src/index.test.ts` | Export (Task 2, 3) |
| `src/components/app-shell/*.test.tsx`, `AppShell.test-d.ts`, `tests/app-shell-window.ts` | Unit test và test kiểu (Task 2, 3, 4) |
| `src/components/app-shell/AppShell.stories.tsx`, `.storybook/app-shell-demo.tsx`, `.storybook/viewport.ts` | Story và ứng dụng mẫu "Lumen" (Task 2, 3, 4) |
| `src/components/app-shell/AppShell.mdx` | Trang docs (Task 5) |
| `src/styles/components/app-shell.css`, `src/styles/index.css` | Màn hẹp và phần chung (Task 2, 3, 4) |
| `scripts/lib/app-shell-css.ts` (và test), `scripts/build-theme.ts` | Bộ sinh `src/styles/generated/app-shell.css` (Task 2, 3, 4) |
| `src/styles/preferences.css` | Forced colors của skip link (Task 2) |
| `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs` | Kiểm tra gói (Task 2, 3, 4) |
| `scripts/contrast-exceptions.ts`, spec 0+1 §4.9 | Nhãn dòng 2 và 6 (Task 2) |
| `src/docs/Accessibility.mdx` | Câu trỏ và mục "The app shell" (Task 5) |
| `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md` | Các dòng sửa khi lập Plan A (Task 2, 4) |
| `.size-limit.json` | Ngưỡng mới (Task 5) |

---

### Task 1: `useMediaQuery`, `MenuIcon`, tag `viewport-<rộng>x<cao>` và stage `'page'`

Spec §5 (`use-media-query.ts`), §4.6 (`MenuIcon`), §7 "Harness visual" (tag `viewport-…` và stage `'page'`; móc `data-visual-hover="tooltip"` là của Plan B), §2 "Thay đổi ở code cũ" (Plan A). Các mảnh khung cần, trước khi có component nào.
- **`useMediaQuery`**: `useSyncExternalStore` trên `matchMedia(query)`; phía server và lúc hydrate là `false`; không có `matchMedia` thì `false`; đổi `query` thì đăng ký lại.
- **`MenuIcon`**: đường `M4 6h16M4 12h16M4 18h16`, dùng `strokeIcon` như các icon bên cạnh.
- **Tag `viewport-<rộng>x<cao>`**: hàm thuần `viewportFromTags`, test ở project `scripts`; harness đặt cỡ cửa sổ của mỗi story theo nó trước khi nạp trang (phát hiện 2).
- **Stage `'page'`**: `.storybook/preview.tsx` đặt `data-stage="page"`; `.storybook/stage.css` theo đúng §7 (phát hiện 2).
- **Story** `Examples/Page stage` (`no-visual` ở meta): một header `position: sticky; top: 0` trong stage `'page'` dính vào tài liệu khi cửa sổ cuộn, ở ba engine; một story không xin stage thì giữ stage mặc định.
- Cuối task, `check:package` dừng ở `check:use-client` (phát hiện 12). Không ảnh chuẩn nào đổi.

**Files:**
- Create: `src/internal/use-media-query.ts`, `src/internal/use-media-query.test.tsx`, `scripts/lib/viewport-tag.ts`, `scripts/lib/viewport-tag.test.ts`, `src/docs/PageStage.stories.tsx`
- Modify: `src/internal/icons.tsx`, `src/internal/icons.test.tsx`, `tests/visual/stories.visual.ts`, `.storybook/preview.tsx`, `.storybook/stage.css`

**Interfaces:**
- Produces trong `src/internal/use-media-query.ts` (nội bộ, không export ra ngoài package): `useMediaQuery(query: string): boolean`.
- Produces trong `src/internal/icons.tsx` (nội bộ): `MenuIcon(props: SVGProps<SVGSVGElement>)`, SVG khung `0 0 24 24`, nét 2; `aria-hidden` và `focusable="false"` đến từ `strokeIcon`; props ghi đè được.
- Produces trong `scripts/lib/viewport-tag.ts`:
  - `interface Viewport { width: number; height: number }`.
  - `DEFAULT_VIEWPORT: Viewport` = `{ width: 1280, height: 720 }`.
  - `viewportFromTags(tags: readonly string[] | undefined): Viewport`: tag đầu khớp `^viewport-([1-9]\d*)x([1-9]\d*)$` thắng; không có hay hỏng thì `DEFAULT_VIEWPORT`.
- `tests/visual/stories.visual.ts`: `await page.setViewportSize(viewportFromTags(story.tags))` trước `page.goto`, ở mọi story và mọi chế độ.
- `.storybook/preview.tsx`: `stageOf(stage)` trả `'viewport'` hay `'page'`, mọi giá trị khác `undefined`; kết quả thành `data-stage` của `.flg-stage`.
- `.storybook/stage.css`: `.flg-stage[data-stage='page'] { display: block; padding: 0; overflow: clip; min-height: 100vh }` (Task 2 thêm `place-items: normal`).
- Story trong `src/docs/PageStage.stories.tsx`: meta `title: 'Examples/Page stage'`, `tags: ['no-visual']`; story `StickyHeaderSticksToTheDocument` (`parameters: { stage: 'page' }`), `OtherStoriesKeepTheirStage`.
- Consumes: `strokeIcon` của `icons.tsx`.
- Task sau dùng: Task 3 dùng `useMediaQuery` và `MenuIcon`; mọi story của AppShell (Task 2–4) dùng stage `'page'`; story điện thoại (Task 3, 4) gắn `viewport-390x844`. Plan B thêm `data-visual-hover="tooltip"` vào cùng harness; Plan C có story gắn `viewport-360x640`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/scripts/lib/viewport-tag.test.ts b/scripts/lib/viewport-tag.test.ts
new file mode 100644
index 0000000..2fb5896
--- /dev/null
+++ b/scripts/lib/viewport-tag.test.ts
@@ -0,0 +1,33 @@
+import { describe, expect, it } from 'vitest';
+import { DEFAULT_VIEWPORT, viewportFromTags } from './viewport-tag';
+
+describe('viewportFromTags', () => {
+  it('reads the size from a viewport-<width>x<height> tag', () => {
+    expect(viewportFromTags(['viewport-390x844'])).toEqual({ width: 390, height: 844 });
+  });
+
+  it('finds the tag among others', () => {
+    expect(viewportFromTags(['autodocs', 'viewport-360x640', 'reduced-motion'])).toEqual({
+      width: 360,
+      height: 640,
+    });
+  });
+
+  it('keeps 1280x720 for a story without the tag, or with no tags at all', () => {
+    expect(DEFAULT_VIEWPORT).toEqual({ width: 1280, height: 720 });
+    expect(viewportFromTags(['autodocs'])).toEqual(DEFAULT_VIEWPORT);
+    expect(viewportFromTags(undefined)).toEqual(DEFAULT_VIEWPORT);
+  });
+
+  it.each([
+    'viewport-390',
+    'viewport-x844',
+    'viewport-0x844',
+    'viewport-390x0',
+    'viewport-1e3x5',
+    'Viewport-390x844',
+    'viewport-390x844px',
+  ])('ignores the malformed tag %s', (tag) => {
+    expect(viewportFromTags([tag])).toEqual(DEFAULT_VIEWPORT);
+  });
+});
diff --git a/src/docs/PageStage.stories.tsx b/src/docs/PageStage.stories.tsx
new file mode 100644
index 0000000..eac96a7
--- /dev/null
+++ b/src/docs/PageStage.stories.tsx
@@ -0,0 +1,62 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { expect, waitFor } from 'storybook/test';
+
+// This proves the Storybook stage `page` (.storybook/stage.css) that the app-shell stories rely on:
+// a sticky header inside it sticks to the document, so the stage must not be a scroll container. The
+// story is `no-visual`, since it checks layout, which a screenshot cannot say.
+const meta = {
+  title: 'Examples/Page stage',
+  tags: ['no-visual'],
+} satisfies Meta;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+export const StickyHeaderSticksToTheDocument: Story = {
+  parameters: { stage: 'page' },
+  render: () => (
+    <div>
+      <header
+        data-testid="header"
+        style={{
+          position: 'sticky',
+          top: 0,
+          height: 56,
+          background: 'Canvas',
+          color: 'CanvasText',
+        }}
+      >
+        Header
+      </header>
+      <main style={{ height: 3000 }}>A page much taller than the window.</main>
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const stage = canvasElement.querySelector<HTMLElement>('[data-testid="flg-stage"]');
+    const header = canvasElement.querySelector<HTMLElement>('[data-testid="header"]');
+    if (!stage || !header) throw new Error('The stage and the header must exist.');
+    const style = getComputedStyle(stage);
+    await expect(stage.getAttribute('data-stage')).toBe('page');
+    await expect(style.paddingTop).toBe('0px');
+    await expect(style.display).toBe('block');
+    await expect(style.overflowX).toBe('clip');
+    await expect(style.overflowY).toBe('clip');
+    await expect(parseFloat(style.minHeight)).toBeGreaterThanOrEqual(window.innerHeight);
+    await expect(header.getBoundingClientRect().top).toBe(0);
+    window.scrollTo(0, 400);
+    // The window scrolled, and the header is still at its top edge.
+    await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
+    await expect(header.getBoundingClientRect().top).toBe(0);
+    window.scrollTo(0, 0);
+  },
+};
+
+/** A story that does not ask for a stage keeps the default one. */
+export const OtherStoriesKeepTheirStage: Story = {
+  render: () => <p data-testid="plain">A story with the default stage.</p>,
+  play: async ({ canvasElement }) => {
+    const stage = canvasElement.querySelector<HTMLElement>('[data-testid="flg-stage"]');
+    await expect(stage?.hasAttribute('data-stage')).toBe(false);
+    await expect(getComputedStyle(stage!).overflowY).toBe('hidden');
+  },
+};
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index d3e8f23..36d62c9 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -11,6 +11,7 @@ import {
   CloseIcon,
   ExclamationIcon,
   FileIcon,
+  MenuIcon,
   MinusIcon,
   PlusIcon,
   StatusIcon,
@@ -131,6 +132,15 @@ describe('shared icons', () => {
     ]);
   });
 
+  it('MenuIcon pins its path and is a hidden stroked icon', () => {
+    const { container } = render(<MenuIcon />);
+    const svg = container.querySelector('svg')!;
+    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
+    expect(svg.getAttribute('aria-hidden')).toBe('true');
+    const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
+    expect(paths).toEqual(['M4 6h16M4 12h16M4 18h16']);
+  });
+
   it('FileIcon pins its paths', () => {
     const { container } = render(<FileIcon />);
     const paths = Array.from(container.querySelectorAll('path')).map((p) => p.getAttribute('d'));
diff --git a/src/internal/use-media-query.test.tsx b/src/internal/use-media-query.test.tsx
new file mode 100644
index 0000000..87a3bdf
--- /dev/null
+++ b/src/internal/use-media-query.test.tsx
@@ -0,0 +1,116 @@
+import { act, render } from '@testing-library/react';
+import { renderToString } from 'react-dom/server';
+import { afterEach, describe, expect, it, vi } from 'vitest';
+import { useMediaQuery } from './use-media-query';
+
+type Listener = () => void;
+
+/** What the browser keeps for one query: whether it matches, and who is listening. */
+interface FakeQuery {
+  matches: boolean;
+  listeners: Set<Listener>;
+  fire: (matches: boolean) => void;
+}
+
+/**
+ * Installs a `matchMedia` like the browser's: every call returns a fresh list object, but all of
+ * them for one query share the state behind it. Returns the state per query.
+ */
+function stubMatchMedia(initial: (query: string) => boolean) {
+  const queries = new Map<string, FakeQuery>();
+  const stateOf = (query: string) => {
+    let state = queries.get(query);
+    if (!state) {
+      const created: FakeQuery = {
+        matches: initial(query),
+        listeners: new Set(),
+        fire(matches) {
+          created.matches = matches;
+          for (const listener of [...created.listeners]) listener();
+        },
+      };
+      state = created;
+      queries.set(query, created);
+    }
+    return state;
+  };
+  vi.stubGlobal(
+    'matchMedia',
+    vi.fn((query: string) => {
+      const state = stateOf(query);
+      return {
+        get matches() {
+          return state.matches;
+        },
+        media: query,
+        addEventListener: (_type: string, listener: Listener) => state.listeners.add(listener),
+        removeEventListener: (_type: string, listener: Listener) =>
+          state.listeners.delete(listener),
+      };
+    }),
+  );
+  return stateOf;
+}
+
+function Probe({ query }: { query: string }) {
+  return <p data-testid="value">{String(useMediaQuery(query))}</p>;
+}
+
+const read = (container: HTMLElement) =>
+  container.querySelector('[data-testid="value"]')!.textContent;
+
+afterEach(() => {
+  vi.unstubAllGlobals();
+});
+
+describe('useMediaQuery', () => {
+  it('returns what the query matches on the first client render', () => {
+    stubMatchMedia((query) => query === '(min-width: 1024px)');
+    const yes = render(<Probe query="(min-width: 1024px)" />);
+    expect(read(yes.container)).toBe('true');
+    const no = render(<Probe query="(min-width: 2000px)" />);
+    expect(read(no.container)).toBe('false');
+  });
+
+  it('re-renders when the query starts and stops matching', () => {
+    const stateOf = stubMatchMedia(() => false);
+    const { container } = render(<Probe query="(min-width: 1024px)" />);
+    expect(read(container)).toBe('false');
+    const state = stateOf('(min-width: 1024px)');
+    expect(state.listeners.size).toBe(1);
+    act(() => state.fire(true));
+    expect(read(container)).toBe('true');
+    act(() => state.fire(false));
+    expect(read(container)).toBe('false');
+  });
+
+  it('unsubscribes when the component unmounts', () => {
+    const stateOf = stubMatchMedia(() => false);
+    const { unmount } = render(<Probe query="(min-width: 1024px)" />);
+    const state = stateOf('(min-width: 1024px)');
+    expect(state.listeners.size).toBe(1);
+    unmount();
+    expect(state.listeners.size).toBe(0);
+  });
+
+  it('subscribes to the new query, and drops the old one, when the query changes', () => {
+    const stateOf = stubMatchMedia((query) => query === '(min-width: 600px)');
+    const { container, rerender } = render(<Probe query="(min-width: 1024px)" />);
+    expect(read(container)).toBe('false');
+    rerender(<Probe query="(min-width: 600px)" />);
+    expect(read(container)).toBe('true');
+    expect(stateOf('(min-width: 1024px)').listeners.size).toBe(0);
+    expect(stateOf('(min-width: 600px)').listeners.size).toBe(1);
+  });
+
+  it('is false on the server, even where the query would match', () => {
+    stubMatchMedia(() => true);
+    expect(renderToString(<Probe query="(min-width: 1024px)" />)).toContain('false');
+  });
+
+  it('is false when there is no matchMedia, as in jsdom', () => {
+    vi.stubGlobal('matchMedia', undefined);
+    const { container } = render(<Probe query="(min-width: 1024px)" />);
+    expect(read(container)).toBe('false');
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/internal/use-media-query.test.tsx src/internal/icons.test.tsx
pnpm vitest run --project scripts scripts/lib/viewport-tag.test.ts
pnpm vitest run --project storybook-light src/docs/PageStage.stories.tsx
```

Expected: FAIL.
- `use-media-query.test.tsx` không nạp được ở cả hai project React, nên 6 test không chạy: `Failed to resolve import "./use-media-query" from "src/internal/use-media-query.test.tsx". Does the file exist?`.
- `shared icons > MenuIcon pins its path and is a hidden stroked icon` fail ở mỗi project React: `Element type is invalid … got: undefined`, vì icon chưa được export.
- `viewport-tag.test.ts` không nạp được, vì module `./viewport-tag` chưa có.
- Story `Sticky Header Sticks To The Document` fail ở mỗi engine: `expected null to be 'page'` (stage chưa được map). `Other Stories Keep Their Stage` pass: nó là test đặc tả của stage mặc định, không fail trước được (phát hiện 13).

- [ ] **Step 3: Viết code**

```diff
diff --git a/.storybook/preview.tsx b/.storybook/preview.tsx
index 426b304..dd0e449 100644
--- a/.storybook/preview.tsx
+++ b/.storybook/preview.tsx
@@ -4,6 +4,9 @@ import '../src/styles/generated/simulate.css';
 import { referenceBackgrounds } from '../src/styles/theme/values';
 import './stage.css';
 
+/** The stage a story asks for; anything else is the default stage. */
+const stageOf = (stage: unknown) => (stage === 'viewport' || stage === 'page' ? stage : undefined);
+
 const withStage: Decorator = (Story, context) => {
   const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
   const backdrop = String(context.globals.backdrop ?? 'mockup');
@@ -17,7 +20,7 @@ const withStage: Decorator = (Story, context) => {
         simulate === 'solid' || simulate === 'contrast-more' ? simulate : undefined
       }
       data-backdrop={backdrop === 'mockup' ? 'mockup' : 'solid'}
-      data-stage={context.parameters.stage === 'viewport' ? 'viewport' : undefined}
+      data-stage={stageOf(context.parameters.stage)}
       style={backdrop === 'mockup' ? undefined : { background: `#${backdrop}` }}
     >
       <Story />
diff --git a/.storybook/stage.css b/.storybook/stage.css
index 3cf9a9c..43158d3 100644
--- a/.storybook/stage.css
+++ b/.storybook/stage.css
@@ -17,6 +17,16 @@
   min-height: 100vh;
 }
 
+/* A whole page, such as an app shell: no padding and no centring, so the page fills the stage. The
+   overflow is `clip`, not `hidden`: `hidden` makes the stage a scroll container, and a sticky header
+   would then stick to the stage instead of the document. The backdrop below still paints. */
+.flg-stage[data-stage='page'] {
+  display: block;
+  padding: 0;
+  overflow: clip;
+  min-height: 100vh;
+}
+
 .flg-stage[data-backdrop='mockup'][data-flg-theme='light'] {
   background: linear-gradient(120deg, #dfe9f3 0%, #c3cfe2 100%);
 }
diff --git a/scripts/lib/viewport-tag.ts b/scripts/lib/viewport-tag.ts
new file mode 100644
index 0000000..26b2167
--- /dev/null
+++ b/scripts/lib/viewport-tag.ts
@@ -0,0 +1,21 @@
+export interface Viewport {
+  width: number;
+  height: number;
+}
+
+/** What every story is shot at unless it says otherwise. */
+export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 720 };
+
+const TAG = /^viewport-([1-9]\d*)x([1-9]\d*)$/;
+
+/**
+ * The window size a story asks for with a `viewport-<width>x<height>` tag, such as
+ * `viewport-390x844`. A story without such a tag, or with a malformed one, keeps the default size.
+ */
+export function viewportFromTags(tags: readonly string[] | undefined): Viewport {
+  for (const tag of tags ?? []) {
+    const match = TAG.exec(tag);
+    if (match) return { width: Number(match[1]), height: Number(match[2]) };
+  }
+  return DEFAULT_VIEWPORT;
+}
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index d59db1d..0d77a5c 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -201,3 +201,12 @@ export function FileIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+/** Three horizontal bars, for the button that opens a navigation sidebar. */
+export function MenuIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M4 6h16M4 12h16M4 18h16" />
+    </svg>
+  );
+}
diff --git a/src/internal/use-media-query.ts b/src/internal/use-media-query.ts
new file mode 100644
index 0000000..39e8451
--- /dev/null
+++ b/src/internal/use-media-query.ts
@@ -0,0 +1,26 @@
+import { useCallback, useSyncExternalStore } from 'react';
+
+const getServerSnapshot = () => false;
+
+/**
+ * Whether the media query matches, kept up to date while the component is mounted. On the server and
+ * during hydration it is `false`, so the markup the server sent is the narrow one and the first
+ * client render agrees with it; a wide screen then gets one more render. Without `matchMedia`
+ * (jsdom does not implement it) it is `false`.
+ */
+export function useMediaQuery(query: string): boolean {
+  const subscribe = useCallback(
+    (onChange: () => void) => {
+      if (typeof window.matchMedia !== 'function') return () => {};
+      const list = window.matchMedia(query);
+      list.addEventListener('change', onChange);
+      return () => list.removeEventListener('change', onChange);
+    },
+    [query],
+  );
+  const getSnapshot = useCallback(
+    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
+    [query],
+  );
+  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
+}
diff --git a/tests/visual/stories.visual.ts b/tests/visual/stories.visual.ts
index aff601f..550375b 100644
--- a/tests/visual/stories.visual.ts
+++ b/tests/visual/stories.visual.ts
@@ -1,5 +1,6 @@
 import { expect, test } from '@playwright/test';
 import { existsSync, readFileSync } from 'node:fs';
+import { viewportFromTags } from '../../scripts/lib/viewport-tag';
 
 interface IndexEntry {
   id: string;
@@ -51,6 +52,9 @@ for (const story of stories) {
       if ('onlyTagged' in mode && !story.tags?.includes(mode.onlyTagged)) continue;
       test(`${story.id} · ${theme} · ${mode.name}`, async ({ page }) => {
         if ('media' in mode) await page.emulateMedia(mode.media);
+        // A story tagged `viewport-<width>x<height>` is shot at that size (a phone, say); the others at
+        // the 1280x720 of the config. Set before the page loads, so the first layout is already right.
+        await page.setViewportSize(viewportFromTags(story.tags));
         await page.goto(
           `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};simulate:${mode.simulate}`,
         );
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 --project scripts src/internal scripts
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
pnpm build-storybook
pnpm build && pnpm check:package
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS.
- Unit và scripts: 55 file, 497 test PASS, 3 skip. Trong đó `use-media-query.test.tsx` 6 test ở mỗi project React, test `MenuIcon` ở mỗi project React, và `viewport-tag.test.ts`.
- Story docs: 30 test PASS ở mỗi project (10 story × ba engine), kể cả 2 story của `Examples/Page stage`. axe chạy sau play function, không có vi phạm.
- `pnpm build-storybook`: PASS. Hai story mới gắn `no-visual`, nên số story có ảnh không đổi (117).
- `pnpm build && pnpm check:package`: FAIL ở `check:use-client`: `dist/internal/use-media-query.js: missing build output`. Đó là điều đã biết (phát hiện 12): chưa component nào import hook, nên tsdown chưa xuất nó; từ Task 3 bước này pass. `check:dist-css` chạy trước nó và pass. Không sửa `check-use-client.ts`, không chạy `size:record`.
- Story cũ không có tag nào mới và không dùng stage mới, và cỡ mặc định của harness bằng cỡ của config, nên ảnh chuẩn cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/preview.tsx \
  .storybook/stage.css \
  scripts/lib/viewport-tag.test.ts \
  scripts/lib/viewport-tag.ts \
  src/docs/PageStage.stories.tsx \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx \
  src/internal/use-media-query.test.tsx \
  src/internal/use-media-query.ts \
  tests/visual/stories.visual.ts
```
```bash
git commit -m "feat: add useMediaQuery, MenuIcon, the viewport-WxH visual tag and the page stage" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: AppShell, các phần và hai bố cục

Spec §1 (dòng Giao diện thành prop, Brand, Lưới và header dính, Điểm gãy, Tài liệu dưới header dính), §3.1, §3.2 dòng S, §3.3 (trừ đoạn rail), §3.5 (phần bố cục của dòng "Bố cục, rail"; dòng Chỗ chừa cho header), §3.7, §4.1, §4.3 **AppShell** (header chưa có trigger; sidebar với hàng đầu và thân; main; footer; brand; "Brand ở đâu"; skip link; dark; chưa có rail và tấm trượt), §4.4 (dòng 2 và 6), §4.5 **AppShell**, §5 (`app-shell-context.ts`, `use-header-offset.ts`, các cảnh báo trừ trigger, Toaster và thu gọn), §6.1, §6.3 (`AppShell`: cấu trúc, landmark, skip link, tài liệu; `AppShellSidebar`, `AppShellMain`, `AppShellFooter`; `AppShellBrand`), §7 lớp 1–3, §10 (dính, `dvh`, `:has()`, quy tắc cho tài liệu). Mockup S1, S2. Khung đúng ở mọi chiều rộng; trigger và tấm trượt đến ở Task 3 và 4. Báo cáo và code của Task 1 là điểm bắt đầu.
- **Các phần** (client, `AppShell.tsx`): `AppShell`, `AppShellHeader`, `AppShellSidebar`, `AppShellMain`, `AppShellFooter`. Kiểu và mặc định theo §6.3, chưa có các prop của thu gọn và mở. Giá trị ngoài union thành mặc định (phát hiện 6).
- **`AppShellBrand`** (server-safe, `AppShellBrand.tsx`): `href` thành `<a>`, không có thì `<span>`, `asChild` qua `Slot`; kiểu props là union (phát hiện 6).
- **Lưới**: màn hẹp là nền (một cột; sidebar `display: none`); quy tắc màn rộng sinh ba bản bằng `scripts/lib/app-shell-css.ts`, chạy qua `pnpm gen:theme` (phát hiện 7). Sidebar là ô lưới trong suốt với tấm kính dính (phát hiện 3).
- **Hai quy tắc cho tài liệu** và `useHeaderOffset` (phát hiện 4).
- **Skip link** là con đầu của gốc; axe bật các quy tắc trang cho story của AppShell, `region` bỏ hai chỗ (phát hiện 5).
- **Stage `'page'`** thêm `place-items: normal` (phát hiện 2).
- **Forced colors**: skip link có viền `CanvasText` và nền `Canvas`; header, sidebar, footer dùng quy tắc `.flg-surface` có sẵn.
- **§4.9**: nhãn dòng 2 (liên kết của `AppShellBrand`, skip link) và dòng 6 (chữ của footer) trong `scripts/contrast-exceptions.ts` và spec 0+1, cùng một đoạn mới sau bảng. Không thêm check, không thêm dòng.
- **Story:** `Sidebar`, `Header` là story giao diện (header chưa có trigger); `StickySidebarLayout`, `StickySidebarLayoutWithoutFooter`, `StickyHeaderLayout`, `StickyHeaderLayoutWithoutFooter`, `NoSidewaysScrollSidebarLayout`, `NoSidewaysScrollHeaderLayout`, `DocumentRules`, `FocusStaysBelowTheHeaderSidebarLayout`, `FocusStaysBelowTheHeaderHeaderLayout`, `SkipLinkSidebarLayout`, `SkipLinkHeaderLayout` gắn `no-visual`.
- Spec giai đoạn 5 và spec 0+1 được sửa (phát hiện 14).
- Cuối task, `check:package` vẫn dừng ở `check:use-client`; các bước sau nó pass khi chạy riêng (phát hiện 12).

**Files:**
- Create: `src/components/app-shell/AppShell.tsx`, `AppShellBrand.tsx`, `app-shell-context.ts`, `use-header-offset.ts`, `index.ts`, `AppShell.test.tsx`, `AppShell.test-d.ts`, `AppShellBrand.test.tsx`, `use-header-offset.test.tsx`, `AppShell.stories.tsx`, `src/styles/components/app-shell.css`, `scripts/lib/app-shell-css.ts`, `scripts/lib/app-shell-css.test.ts`, `.storybook/app-shell-demo.tsx`, `.storybook/viewport.ts`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/build-theme.ts`, `scripts/check-dist-css.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs`, `scripts/contrast-exceptions.ts`, `.storybook/stage.css`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `src/components/app-shell/AppShell.tsx` (client, `"use client"`), export qua `index.ts` và `src/index.ts`:
  - `AppShell`: `forwardRef<HTMLDivElement, AppShellProps>`; `ref` là gốc.
  - `AppShellHeader`: `forwardRef<HTMLElement, AppShellHeaderProps>` (`<header>`).
  - `AppShellSidebar`: `forwardRef<HTMLDivElement, AppShellSidebarProps>`; `ref`, `className`, `style` và mọi prop vào ô lưới, không vào tấm kính.
  - `AppShellMain`: `forwardRef<HTMLElement, AppShellMainProps>` (`<main tabIndex={-1}>`).
  - `AppShellFooter`: `forwardRef<HTMLElement, AppShellFooterProps>` (`<footer>`).
  - `AppShellProps = HTMLAttributes<HTMLDivElement> & { layout?: AppShellLayout; breakpoint?: AppShellBreakpoint; brand?: ReactNode; labels?: Partial<AppShellLabels> }`. Mặc định `layout` `'sidebar'`, `breakpoint` `'lg'`. Task 3 thêm các prop thu gọn và mở.
  - `AppShellHeaderProps = HTMLAttributes<HTMLElement>` (Task 3 thêm `sidebarTrigger`); `AppShellSidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>`; `AppShellMainProps = Omit<HTMLAttributes<HTMLElement>, 'id'>`; `AppShellFooterProps = HTMLAttributes<HTMLElement>`.
  - `AppShellLayout = 'sidebar' | 'header'`; `AppShellBreakpoint = 'md' | 'lg' | 'xl'`; `AppShellLabels` có `skipToContent` (mặc định `'Skip to content'`). Task 3 và 4 thêm khoá.
- Produces trong `src/components/app-shell/AppShellBrand.tsx` (server-safe), export qua `index.ts` và `src/index.ts`:
  - `AppShellBrand`: `forwardRef<HTMLElement, AppShellBrandProps>`.
  - `AppShellBrandProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & { logo?: ReactNode; name: ReactNode } & ({ href?: string; asChild?: false; children?: never } | { href?: never; asChild: true; children: ReactNode })`.
- Produces trong `src/components/app-shell/app-shell-context.ts` (nội bộ): `AppShellContext`; `AppShellContextValue` với `layout`, `breakpoint`, `labels`, `brand`, `mainId`, `sidebarId`, `registerPart(part, element): () => void`, `setHeader(element | null)`; `AppShellPart = 'header' | 'sidebar' | 'main' | 'footer'`; `PART_NAMES`; `useAppShellPart(part, ref): AppShellContextValue | null`.
- Produces trong `src/components/app-shell/use-header-offset.ts` (nội bộ): `HEADER_OFFSET_PROPERTY = '--flg-app-shell-header-offset'`; `useHeaderOffset(header: HTMLElement | null): void`.
- Produces trong `scripts/lib/app-shell-css.ts`: `APP_SHELL_BREAKPOINTS` (`md` 768, `lg` 1024, `xl` 1280; từ Task 3 lấy từ `breakpoints.ts` và re-export), `AppShellBreakpointName`, `wideRules(breakpoint): string`, `buildAppShellCss(): string`. `scripts/build-theme.ts` ghi kết quả vào `src/styles/generated/app-shell.css`.
- DOM và class:
  - Gốc `div.flg-app-shell` mang `data-layout`, `data-breakpoint`.
  - Con đầu `a.flg-app-shell-skip.flg-visually-hidden`, `href="#<id của main>"`.
  - `header.flg-surface.flg-app-shell-header`; ô brand `span.flg-app-shell-header-brand` chỉ khi `hasContent(brand)`.
  - `div.flg-app-shell-sidebar` (id do lib sinh) > `div.flg-surface.flg-app-shell-sidebar-panel` > `div.flg-app-shell-sidebar-head` (brand) và `div.flg-app-shell-sidebar-body` (`children`).
  - `main.flg-app-shell-main` (id do lib sinh, `tabindex="-1"`); `footer.flg-surface.flg-app-shell-footer`.
  - Brand: `.flg-app-shell-brand`, `.flg-app-shell-brand-logo` (`aria-hidden="true"`), `.flg-app-shell-brand-name`.
- Biến trên gốc: `--flg-app-shell-sidebar-width`, `--flg-app-shell-rail-width`, `--flg-app-shell-drawer-width`, `--flg-app-shell-header-height`. Trên `<html>`: `--flg-app-shell-header-offset`.
- Cảnh báo dev (sau tiền tố `[h2d-glass-ui] `):
  - `<AppShell> has no <AppShellMain>: the skip link has nowhere to go.`
  - `<AppShell> has more than one <AppShellHeader>.` (mỗi phần một câu)
  - `<AppShellHeader> must be rendered inside <AppShell>.` (mỗi phần một câu)
  - `<AppShellSidebar> must be a direct child of <AppShell>: a component around it is fine, an element around it is not.` (mỗi phần một câu)
- Danh sách kiểm tra gói: `scripts/check-use-client.ts` thêm `src/components/app-shell/AppShell.tsx`; `scripts/check-dist-css.ts` thêm 13 class ở trên, ba khối `@media` (mỗi khối chứa quy tắc của `data-breakpoint` của nó) và hai quy tắc cho tài liệu; `scripts/rsc-probe.mjs` thêm `AppShellBrand with href`, `AppShellBrand without href`, `AppShellBrand asChild`.
- Story:
  - `.storybook/app-shell-demo.tsx`: `DemoStyles`, `DemoBrand`, `DemoNav`, `DemoHeaderContent`, `DemoContent`, `DemoFooter`, `DemoRows({ count, step })`, `DemoPage(props: DemoPageProps)` với `DemoPageProps extends AppShellProps { footer?: boolean; rows?: number; header?: boolean }`.
  - `.storybook/viewport.ts`: `afterLayout()`, `ViewportControl { set(width, height?) }`, `withViewport(run)`.
  - `AppShell.stories.tsx`: meta `title: 'Components/AppShell'`, `parameters: { stage: 'page', a11y: { config: { rules: PAGE_RULES } } }`.
- Consumes: `clsx`, `hasContent`, `mergeRefs`, `devWarn`, `withDefaults`, `useIsoLayoutEffect`, `Slot`, `resolveLazy`; trong story: `realUserEvent`; trong ứng dụng mẫu: `Avatar`, `Badge`, `Card` và các phần, `IconButton`, `strokeIcon`.
- Task sau dùng: Task 3 thêm trigger vào `AppShellHeader` và quy tắc rail vào `wideRules`; Task 4 thêm `sheetRules` và hành vi của tấm trượt; Plan B đặt quy tắc rail của Nav vào cùng bộ sinh.

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/app-shell-demo.tsx b/.storybook/app-shell-demo.tsx
new file mode 100644
index 0000000..50e2333
--- /dev/null
+++ b/.storybook/app-shell-demo.tsx
@@ -0,0 +1,454 @@
+// The application of the AppShell stories: "Lumen", as the mockup draws it (phase-5-shell). Nothing here
+// is a component of the library: the mockup's navigation and header widgets are neutral placeholders
+// ("only to illustrate"), and the real ones are built by later plans. The stories are about the frame,
+// so the placeholders are drawn by the CSS in this file, the way the mockup page draws them.
+import type { ReactNode } from 'react';
+import {
+  AppShell,
+  AppShellBrand,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+  Avatar,
+  Badge,
+  Card,
+  CardContent,
+  CardDescription,
+  CardHeader,
+  CardTitle,
+  IconButton,
+} from '../src/index';
+import type { AppShellProps } from '../src/index';
+import { strokeIcon } from '../src/internal/icons';
+
+const CSS = `
+.demo-mark { display: block; width: 26px; height: 26px; border-radius: var(--flg-radius-md); background: var(--flg-accent-gradient); box-shadow: var(--flg-glow); }
+.demo-spacer { flex: 1 1 auto; }
+.demo-search { flex: none; width: 300px; max-width: 100%; margin-left: 4px; }
+.demo-search > input::-webkit-search-cancel-button { display: none; }
+.demo-kbd { flex: none; padding: 1px 6px; border: 1px solid var(--flg-control-border); border-radius: var(--flg-radius-xs); font: var(--flg-weight-medium) var(--flg-text-2xs)/1.4 var(--flg-font-sans); color: var(--flg-text-muted); }
+.demo-avatar-button { border-radius: var(--flg-radius-full); }
+.demo-avatar-button > .flg-avatar { --flg-avatar-size: 30px; }
+
+.demo-nav { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 12px 12px 12px; }
+.demo-nav ul { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
+.demo-item { appearance: none; box-sizing: border-box; width: 100%; margin: 0; border: 0; background: none; font: inherit; text-align: left; cursor: pointer; position: relative; display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 10px; border-radius: var(--flg-radius-md); color: var(--flg-text); text-decoration: none; font-size: var(--flg-text-sm); font-weight: var(--flg-weight-medium); white-space: nowrap; }
+.demo-item > svg { flex: none; width: 18px; height: 18px; color: var(--flg-text-muted); }
+.demo-item > svg.demo-chevron { width: 16px; height: 16px; }
+.demo-item[aria-current='page'] { background: var(--flg-accent-subtle); color: var(--flg-accent-text); font-weight: var(--flg-weight-semibold); }
+.demo-item[aria-current='page'] > svg { color: currentColor; }
+.demo-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
+.demo-item > .flg-badge { flex: none; }
+.demo-child { height: 32px; padding-left: 38px; font-weight: var(--flg-weight-regular); }
+.demo-sublist { margin-top: 2px; }
+.demo-section { padding: 16px 10px 6px; font-size: var(--flg-text-2xs); font-weight: var(--flg-weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--flg-text-muted); }
+.demo-nav-end { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--flg-control-border); }
+
+.demo-page { display: flex; flex-direction: column; gap: 20px; }
+.demo-title { margin: 0; font-size: 22px; font-weight: var(--flg-weight-semibold); line-height: 1.25; letter-spacing: -0.01em; }
+.demo-lead { margin: 4px 0 0; color: var(--flg-text); font-size: var(--flg-text-sm); }
+.demo-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
+.demo-cards > .flg-card, .demo-wide { gap: 12px; padding: 16px 18px; }
+.demo-list { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; list-style: none; }
+.demo-todo > li { display: flex; align-items: center; gap: 8px; }
+.demo-todo > li::before { content: ''; flex: none; box-sizing: border-box; width: 13px; height: 13px; border-radius: 50%; border: 1.5px solid var(--flg-text-muted); }
+.demo-messages > li { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--flg-text-muted); }
+.demo-messages b, .demo-activity b { color: var(--flg-text); font-weight: var(--flg-weight-semibold); }
+.demo-progress { display: flex; flex-direction: column; gap: 8px; }
+.demo-progress-row { display: flex; justify-content: space-between; gap: 8px; }
+.demo-bar { height: 6px; border-radius: var(--flg-radius-full); background: var(--flg-control-track); overflow: hidden; }
+.demo-bar > i { display: block; width: 68%; height: 100%; border-radius: inherit; background: var(--flg-accent-gradient); }
+.demo-activity { gap: 10px; }
+.demo-activity > li { display: flex; align-items: center; gap: 10px; }
+.demo-activity > li > span:nth-child(2) { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
+.demo-activity .demo-muted { flex: none; font-size: var(--flg-text-xs); }
+.demo-filler { display: flex; flex-direction: column; align-items: flex-start; gap: 80px; margin: 0; padding: 0; list-style: none; }
+@media (max-width: 767px) {
+  .demo-cards { grid-template-columns: 1fr; gap: 12px; }
+  .demo-search { width: auto; flex: 1; }
+}
+`;
+
+/** The CSS of the placeholders; every page of the stories carries it. */
+export function DemoStyles() {
+  return <style>{CSS}</style>;
+}
+
+type IconProps = { children: ReactNode; className?: string };
+const Icon = ({ children, className }: IconProps) => (
+  <svg {...strokeIcon} className={className}>
+    {children}
+  </svg>
+);
+
+const ICONS = {
+  home: (
+    <>
+      <path d="M3 10.5 12 3l9 7.5" />
+      <path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9" />
+    </>
+  ),
+  inbox: (
+    <>
+      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
+      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
+    </>
+  ),
+  calendar: (
+    <>
+      <rect x="3" y="4" width="18" height="18" rx="2" />
+      <path d="M16 2v4M8 2v4M3 10h18" />
+    </>
+  ),
+  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
+  people: (
+    <>
+      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
+      <circle cx="9" cy="7" r="4" />
+      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
+    </>
+  ),
+  chart: (
+    <>
+      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
+      <path d="M8 17v-3M13 17V9M18 17V5" />
+    </>
+  ),
+  gear: (
+    <>
+      <circle cx="12" cy="12" r="3" />
+      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
+    </>
+  ),
+  search: (
+    <>
+      <circle cx="11" cy="11" r="7" />
+      <path d="m21 21-4.3-4.3" />
+    </>
+  ),
+  bell: (
+    <>
+      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
+      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
+    </>
+  ),
+  sun: (
+    <>
+      <circle cx="12" cy="12" r="4" />
+      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
+    </>
+  ),
+};
+
+/** The brand of the mockup: the 26px gradient mark and the name. */
+export function DemoBrand() {
+  return (
+    <AppShellBrand
+      logo={<span className="demo-mark" />}
+      name="Lumen"
+      href="#home"
+      onClick={(event) => event.preventDefault()}
+    />
+  );
+}
+
+const noJump = (event: { preventDefault: () => void }) => event.preventDefault();
+
+function NavLink({
+  icon,
+  current = false,
+  count,
+  child = false,
+  children,
+}: {
+  icon?: keyof typeof ICONS;
+  current?: boolean;
+  count?: number;
+  child?: boolean;
+  children: string;
+}) {
+  return (
+    <li>
+      <a
+        className={child ? 'demo-item demo-child' : 'demo-item'}
+        href="#page"
+        aria-current={current ? 'page' : undefined}
+        onClick={noJump}
+      >
+        {icon ? <Icon>{ICONS[icon]}</Icon> : null}
+        <span className="demo-label">{children}</span>
+        {count ? <Badge>{count}</Badge> : null}
+      </a>
+    </li>
+  );
+}
+
+function NavGroup({
+  icon,
+  open = false,
+  label,
+  children,
+}: {
+  icon: keyof typeof ICONS;
+  open?: boolean;
+  label: string;
+  children?: ReactNode;
+}) {
+  return (
+    <li>
+      <button type="button" className="demo-item" aria-expanded={open}>
+        <Icon>{ICONS[icon]}</Icon>
+        <span className="demo-label">{label}</span>
+        <Icon className="demo-chevron">
+          <path d={open ? 'm6 9 6 6 6-6' : 'm9 18 6-6-6-6'} />
+        </Icon>
+      </button>
+      {open ? <ul className="demo-sublist">{children}</ul> : null}
+    </li>
+  );
+}
+
+/** The navigation of the mockup, drawn by the story's own CSS; Nav is a later plan. */
+export function DemoNav() {
+  return (
+    <nav className="demo-nav" aria-label="Main">
+      <ul>
+        <NavLink icon="home" current>
+          Overview
+        </NavLink>
+        <NavLink icon="inbox" count={12}>
+          Inbox
+        </NavLink>
+        <NavLink icon="calendar">Calendar</NavLink>
+      </ul>
+      <div className="demo-section">Projects</div>
+      <ul>
+        <NavGroup icon="folder" label="Design" open>
+          <NavLink child>Design system</NavLink>
+          <NavLink child>Mobile app</NavLink>
+        </NavGroup>
+        <NavGroup icon="folder" label="Engineering" />
+      </ul>
+      <div className="demo-section">Team</div>
+      <ul>
+        <NavLink icon="people">Members</NavLink>
+        <NavLink icon="chart" count={3}>
+          Reports
+        </NavLink>
+      </ul>
+      <ul className="demo-nav-end">
+        <NavLink icon="gear">Settings</NavLink>
+      </ul>
+    </nav>
+  );
+}
+
+/** What the mockup puts in the header besides the brand and the button that folds the sidebar. */
+export function DemoHeaderContent() {
+  return (
+    <>
+      <div className="flg-input demo-search">
+        <span className="flg-input-adornment">
+          <Icon>{ICONS.search}</Icon>
+        </span>
+        <input type="search" placeholder="Search…" aria-label="Search" />
+        <kbd className="demo-kbd">⌘K</kbd>
+      </div>
+      <span className="demo-spacer" />
+      <IconButton variant="ghost" aria-label="Notifications">
+        <Icon>{ICONS.bell}</Icon>
+      </IconButton>
+      <IconButton variant="ghost" aria-label="Theme">
+        <Icon>{ICONS.sun}</Icon>
+      </IconButton>
+      <IconButton
+        variant="ghost"
+        aria-label="Account: Minh Anh Nguyen"
+        className="demo-avatar-button"
+      >
+        <Avatar fallback="MA" alt="" />
+      </IconButton>
+    </>
+  );
+}
+
+const PEOPLE = [
+  { initials: 'PQ', name: 'Pham Quan', text: 'updated "Mobile app"', when: '10 minutes ago' },
+  {
+    initials: 'LH',
+    name: 'Le Hoang',
+    text: 'added 4 files to "Design system"',
+    when: '1 hour ago',
+  },
+  { initials: 'TT', name: 'Tran Thu', text: 'created the report "Week 45"', when: 'Yesterday' },
+];
+
+/** The main content of the mockup: a title, three cards and a wide one. */
+export function DemoContent({ children }: { children?: ReactNode }) {
+  return (
+    <div className="demo-page">
+      <div>
+        <h1 className="demo-title">Overview</h1>
+        <p className="demo-lead">Good morning, Minh Anh. Here is how today looks.</p>
+      </div>
+      <div className="demo-cards">
+        <Card>
+          <CardHeader>
+            <CardTitle asChild>
+              <h2>Today</h2>
+            </CardTitle>
+            <CardDescription>3 things to finish before 5 pm</CardDescription>
+          </CardHeader>
+          <CardContent>
+            <ul className="demo-list demo-todo">
+              <li>Review the new home page design</li>
+              <li>Engineering sync at 2 pm</li>
+              <li>Send the weekly report</li>
+            </ul>
+          </CardContent>
+        </Card>
+        <Card>
+          <CardHeader>
+            <CardTitle asChild>
+              <h2>Inbox</h2>
+            </CardTitle>
+            <CardDescription>12 unread messages</CardDescription>
+          </CardHeader>
+          <CardContent>
+            <ul className="demo-list demo-messages">
+              <li>
+                <b>Le Hoang</b> The new design is ready
+              </li>
+              <li>
+                <b>Tran Thu</b> Next week&apos;s schedule
+              </li>
+              <li>
+                <b>Pham Quan</b> Notes for the mobile app
+              </li>
+            </ul>
+          </CardContent>
+        </Card>
+        <Card>
+          <CardHeader>
+            <CardTitle asChild>
+              <h2>Project progress</h2>
+            </CardTitle>
+            <CardDescription>Design system</CardDescription>
+          </CardHeader>
+          <CardContent className="demo-progress">
+            <div className="demo-progress-row">
+              <span>34 of 50 tasks done</span>
+              <b>68%</b>
+            </div>
+            <div className="demo-bar">
+              <i />
+            </div>
+            <span style={{ color: 'var(--flg-text-muted)' }}>Due: 28 Nov 2026</span>
+          </CardContent>
+        </Card>
+      </div>
+      <Card className="demo-wide">
+        <CardHeader>
+          <CardTitle asChild>
+            <h2>Recent activity</h2>
+          </CardTitle>
+        </CardHeader>
+        <CardContent>
+          <ul className="demo-list demo-activity">
+            {PEOPLE.map((person) => (
+              <li key={person.initials}>
+                <Avatar fallback={person.initials} alt="" size="sm" />
+                <span>
+                  <b>{person.name}</b> {person.text}
+                </span>
+                <span className="demo-muted" style={{ color: 'var(--flg-text-muted)' }}>
+                  {person.when}
+                </span>
+              </li>
+            ))}
+          </ul>
+        </CardContent>
+      </Card>
+      {children}
+    </div>
+  );
+}
+
+/** The footer of the mockup. */
+export function DemoFooter() {
+  return (
+    <>
+      <span>© 2026 Lumen</span>
+      <span aria-hidden="true">·</span>
+      <a href="#terms" onClick={noJump}>
+        Terms
+      </a>
+      <span aria-hidden="true">·</span>
+      <a href="#help" onClick={noJump}>
+        Help
+      </a>
+    </>
+  );
+}
+
+/**
+ * A column of buttons, each a screen apart, to make the page tall and to give the keyboard
+ * something to go back to under the header.
+ */
+export function DemoRows({ count, step = 120 }: { count: number; step?: number }) {
+  return (
+    <ul className="demo-filler" style={{ gap: step - 34 }}>
+      {Array.from({ length: count }, (_, index) => (
+        <li key={index}>
+          <button type="button" data-row={index + 1} style={{ height: 34 }}>
+            Row {index + 1}
+          </button>
+        </li>
+      ))}
+    </ul>
+  );
+}
+
+export interface DemoPageProps extends AppShellProps {
+  /** Draws the footer. Default true. */
+  footer?: boolean;
+  /** Rows of buttons below the cards, to make the page scroll. */
+  rows?: number;
+  /** The header gets the brand cell and the widgets. Default true. */
+  header?: boolean;
+}
+
+/** The whole application of the mockup in an AppShell, in the order the docs recommend. */
+export function DemoPage({
+  footer = true,
+  header = true,
+  rows = 0,
+  children,
+  ...props
+}: DemoPageProps) {
+  return (
+    <>
+      <DemoStyles />
+      <AppShell brand={<DemoBrand />} {...props}>
+        {header ? (
+          <AppShellHeader>
+            <DemoHeaderContent />
+          </AppShellHeader>
+        ) : null}
+        <AppShellSidebar>
+          <DemoNav />
+        </AppShellSidebar>
+        <AppShellMain>
+          <DemoContent>{rows > 0 ? <DemoRows count={rows} /> : null}</DemoContent>
+          {children}
+        </AppShellMain>
+        {footer ? (
+          <AppShellFooter>
+            <DemoFooter />
+          </AppShellFooter>
+        ) : null}
+      </AppShell>
+    </>
+  );
+}
diff --git a/.storybook/viewport.ts b/.storybook/viewport.ts
new file mode 100644
index 0000000..e21342e
--- /dev/null
+++ b/.storybook/viewport.ts
@@ -0,0 +1,43 @@
+// Runs a play function at a size of the window. Layout that depends on the width of the window (the
+// breakpoints of the AppShell) is proven in the real engines, and the iframe that Vitest runs a story
+// in has a size of its own, so the story sets the one it needs. Under `pnpm test:stories` the size is
+// set through Vitest's `page.viewport`; in the Storybook UI there is no way to resize the preview from
+// a story, so `withViewport` returns `undefined` there without running anything and the story skips
+// its checks, as the stories that need trusted input do (real-input.ts).
+
+const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
+
+/** Two frames: the layout of the new size is done and the observers of the page have run. */
+export async function afterLayout(): Promise<void> {
+  await nextFrame();
+  await nextFrame();
+}
+
+export interface ViewportControl {
+  /** Sets the size of the window and waits until the page has laid itself out at it. */
+  set: (width: number, height?: number) => Promise<void>;
+}
+
+/**
+ * Hands `run` a way to change the size of the window, and puts the window back as it was when `run`
+ * ends, whatever happens, so the stories that follow are not shot at a size they did not ask for.
+ */
+export async function withViewport<T>(
+  run: (viewport: ViewportControl) => Promise<T>,
+): Promise<T | undefined> {
+  if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return undefined;
+  const { page } = await import('vitest/browser');
+  const original = { width: window.innerWidth, height: window.innerHeight };
+  const viewport: ViewportControl = {
+    set: async (width, height = original.height) => {
+      await page.viewport(width, height);
+      await afterLayout();
+    },
+  };
+  try {
+    return await run(viewport);
+  } finally {
+    await page.viewport(original.width, original.height);
+    await afterLayout();
+  }
+}
diff --git a/scripts/lib/app-shell-css.test.ts b/scripts/lib/app-shell-css.test.ts
new file mode 100644
index 0000000..a9a4350
--- /dev/null
+++ b/scripts/lib/app-shell-css.test.ts
@@ -0,0 +1,104 @@
+import { describe, expect, it } from 'vitest';
+import { APP_SHELL_BREAKPOINTS, buildAppShellCss, wideRules } from './app-shell-css';
+
+const flat = (text: string) => text.replace(/\s+/g, ' ').trim();
+
+/** The `@media` blocks of the generated file, as `[query, body]`, and what is outside them. */
+function mediaBlocks(css: string): Array<[string, string]> {
+  const blocks: Array<[string, string]> = [];
+  const open = /@media ([^{]+)\{/g;
+  for (let match = open.exec(css); match; match = open.exec(css)) {
+    let depth = 1;
+    let end = open.lastIndex;
+    while (depth > 0 && end < css.length) {
+      const char = css[end];
+      if (char === '{') depth += 1;
+      if (char === '}') depth -= 1;
+      end += 1;
+    }
+    blocks.push([match[1]!.trim(), css.slice(open.lastIndex, end - 1)]);
+    open.lastIndex = end;
+  }
+  return blocks;
+}
+
+describe('buildAppShellCss', () => {
+  const css = buildAppShellCss();
+  const blocks = mediaBlocks(css);
+
+  it('writes one min-width block per breakpoint, narrowest first, inside the components layer', () => {
+    expect(APP_SHELL_BREAKPOINTS).toEqual({ md: 768, lg: 1024, xl: 1280 });
+    expect(blocks.map(([query]) => query)).toEqual([
+      '(min-width: 768px)',
+      '(min-width: 1024px)',
+      '(min-width: 1280px)',
+    ]);
+    expect(css).toMatch(/^\/\*[\s\S]*?\*\/\s*@layer flg\.components \{/);
+  });
+
+  it('has one boundary per breakpoint: no max-width, no second bound', () => {
+    expect(css).not.toContain('max-width');
+    for (const [query] of blocks) expect(query).not.toMatch(/\band\b|,/);
+    expect(css).not.toMatch(/1023|767|1279/);
+  });
+
+  it('says each rule once per breakpoint, picked by the data-breakpoint of the root', () => {
+    expect(blocks).toHaveLength(3);
+    for (const [index, name] of (['md', 'lg', 'xl'] as const).entries()) {
+      const body = blocks[index]![1];
+      // Every selector of the block starts at the root of its own breakpoint, and no other.
+      const roots = new Set(body.match(/data-breakpoint='[a-z]+'/g));
+      expect([...roots]).toEqual([`data-breakpoint='${name}'`]);
+      expect(flat(body)).toBe(flat(wideRules(name)));
+    }
+    const strip = (name: 'md' | 'lg' | 'xl') => wideRules(name).replaceAll(`'${name}'`, "'BP'");
+    expect(strip('md')).toBe(strip('lg'));
+    expect(strip('lg')).toBe(strip('xl'));
+  });
+
+  it('puts the sidebar in a column of the grid and makes its panel, and the header, sticky', () => {
+    const body = wideRules('lg');
+    // The rule that starts with `selector` and ends at its closing brace.
+    const rule = (selector: string) => {
+      const start = body.indexOf(`${selector} {`);
+      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
+      return body.slice(start, body.indexOf('}', start));
+    };
+    const shell = ".flg-app-shell[data-breakpoint='lg']";
+    const cell = `${shell}[data-layout='sidebar'] > .flg-app-shell-sidebar`;
+    const headerCell = `${shell}[data-layout='header'] > .flg-app-shell-sidebar`;
+    expect(body).toContain(
+      'grid-template-columns: var(--flg-app-shell-sidebar-width) minmax(0, 1fr)',
+    );
+    expect(rule(cell)).toContain('grid-row: 1 / -1');
+    expect(rule(headerCell)).toContain('grid-row: 2');
+    // The panel sticks, not the cell: a sticky box is held by its parent, not by its grid area, so a
+    // cell that stuck could not be stopped by the footer at the end of the page.
+    expect(rule(`${shell} > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel`)).toContain(
+      'position: sticky',
+    );
+    expect(rule(`${cell} > .flg-app-shell-sidebar-panel`)).toContain('top: 0');
+    expect(rule(`${headerCell} > .flg-app-shell-sidebar-panel`)).toContain(
+      'top: var(--flg-app-shell-header-height)',
+    );
+    expect(rule(`${shell} > .flg-app-shell-sidebar`)).not.toContain('position: sticky');
+  });
+
+  it('keeps the header out from under the scroll with the wide fallback of 60px', () => {
+    for (const [, body] of blocks) {
+      expect(body).toMatch(
+        /:root:has\(\.flg-app-shell\[data-breakpoint='[a-z]+'\] > \.flg-app-shell-header\) \{\s*scroll-padding-top: var\(--flg-app-shell-header-offset, 60px\)/,
+      );
+    }
+  });
+
+  it('gives a shell without a sidebar one column, and without a header no first row', () => {
+    const body = wideRules('xl');
+    expect(body).toMatch(
+      /\[data-layout\]:not\(:has\(> \.flg-app-shell-sidebar\)\) \{\s*grid-template-columns: minmax\(0, 1fr\)/,
+    );
+    expect(body).toMatch(
+      /:not\(:has\(> \.flg-app-shell-header\)\) \{\s*--flg-app-shell-header-height: 0px/,
+    );
+  });
+});
diff --git a/src/components/app-shell/AppShell.stories.tsx b/src/components/app-shell/AppShell.stories.tsx
new file mode 100644
index 0000000..d40556f
--- /dev/null
+++ b/src/components/app-shell/AppShell.stories.tsx
@@ -0,0 +1,395 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { expect, waitFor } from 'storybook/test';
+import { DemoPage } from '../../../.storybook/app-shell-demo';
+import { realUserEvent } from '../../../.storybook/real-input';
+import { afterLayout, withViewport } from '../../../.storybook/viewport';
+import { AppShell } from './AppShell';
+
+// The stories of the frame draw the application of the mockup (Lumen) on a whole page: stage `page`,
+// so a sticky header sticks to the document as it does in an application. The two that look like the
+// approved mockups are `Sidebar` (S1) and `Header` (S2). The others check the layout in the real
+// engines, which jsdom has no layout for: they are `no-visual`, since a screenshot cannot say them.
+// An application is a page, so these stories ask axe for the rules about pages that the preview turns
+// off for the stories of single components (spec phase 5 §7, layer 3).
+const PAGE_RULES = [
+  // Two places are left out of `region`. The skip link: the page that Storybook renders a story in has
+  // links of its own before it, so axe does not take it for the first link of the page, which an
+  // application's skip link is. The head of the sidebar, where S1 draws the brand on a wide screen:
+  // the sidebar is not a landmark (spec §6.3), so a brand there is outside every landmark, where on a narrow screen it is
+  // in the banner.
+  {
+    id: 'region',
+    enabled: true,
+    selector:
+      ':not(.flg-app-shell-skip, .flg-app-shell-sidebar-head, .flg-app-shell-sidebar-head *)',
+  },
+  { id: 'landmark-one-main', enabled: true },
+  { id: 'landmark-unique', enabled: true },
+  { id: 'bypass', enabled: true },
+];
+
+const meta = {
+  title: 'Components/AppShell',
+  component: AppShell,
+  parameters: { stage: 'page', a11y: { config: { rules: PAGE_RULES } } },
+} satisfies Meta<typeof AppShell>;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/** S1 (spec §3.2): the sidebar runs from the top to the bottom of the screen; the header and the footer sit over the content column. */
+export const Sidebar: Story = {
+  render: () => <DemoPage layout="sidebar" />,
+};
+
+/** S2: the header runs across the whole width, and so does the footer, under the sidebar. */
+export const Header: Story = {
+  render: () => <DemoPage layout="header" />,
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Layout, in the real engines.
+
+const WIDE = { width: 1280, height: 720 };
+const HEADER_WIDE = 60;
+const SIDEBAR_WIDE = 264;
+
+/** The element of the shell, or a failure that says which one is missing. */
+function part<T extends HTMLElement = HTMLElement>(selector: string): T {
+  const element = document.querySelector<T>(selector);
+  if (!element) throw new Error(`${selector} is not in the story.`);
+  return element;
+}
+
+const rect = (selector: string) => part(selector).getBoundingClientRect();
+const clientWidth = () => document.documentElement.clientWidth;
+const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
+
+async function scrollTo(y: number) {
+  window.scrollTo(0, y);
+  await afterLayout();
+}
+
+/** A pixel is not worth arguing about; a fraction of one is the engines' rounding. */
+const near = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 0);
+
+/**
+ * The header and the sidebar stay where they are while the page scrolls under them, in both layouts
+ * and with and without a footer, and the sidebar stops at what the layout says at the end of the
+ * page. The ground is the grid: a sticky element does not leave its grid area, so a header that sat
+ * in the first row alone would scroll away with the page.
+ */
+function checkSticky(layout: 'sidebar' | 'header', footer: boolean) {
+  return async () => {
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      await expect(document.documentElement.scrollHeight).toBeGreaterThan(WIDE.height * 2);
+      const header = '.flg-app-shell-header';
+      // The panel is what is seen and what sticks; the sidebar itself is the cell of the grid.
+      const sidebar = '.flg-app-shell-sidebar-panel';
+      // In the middle of the page.
+      await scrollTo(800);
+      await expect(window.scrollY).toBeGreaterThan(700);
+      near(rect(header).top, 0);
+      near(rect(header).height, HEADER_WIDE);
+      near(rect(sidebar).top, layout === 'sidebar' ? 0 : HEADER_WIDE);
+      near(rect(sidebar).height, layout === 'sidebar' ? WIDE.height : WIDE.height - HEADER_WIDE);
+      near(rect(sidebar).left, 0);
+      near(rect(sidebar).width, SIDEBAR_WIDE);
+      // S1: the header covers the content column only; S2: the whole width.
+      near(rect(header).left, layout === 'sidebar' ? SIDEBAR_WIDE : 0);
+      near(rect(header).right, clientWidth());
+      // They are on top of the page, so a click lands on them and not on the content that scrolls.
+      const headerBox = rect(header);
+      const atHeader = document.elementFromPoint(
+        headerBox.left + headerBox.width / 2,
+        headerBox.top + headerBox.height / 2,
+      );
+      await expect(part(header).contains(atHeader)).toBe(true);
+      const sidebarBox = rect(sidebar);
+      const atSidebar = document.elementFromPoint(
+        sidebarBox.left + sidebarBox.width / 2,
+        sidebarBox.top + sidebarBox.height / 2,
+      );
+      await expect(part(sidebar).contains(atSidebar)).toBe(true);
+
+      // At the end of the page.
+      await scrollTo(maxScroll());
+      near(rect(header).top, 0);
+      if (footer) {
+        near(rect('.flg-app-shell-footer').bottom, window.innerHeight);
+        near(rect('.flg-app-shell-footer').height, 44);
+      }
+      if (layout === 'sidebar') {
+        // The sidebar owns the left edge to the bottom of the screen, whatever the footer does.
+        near(rect(sidebar).top, 0);
+        near(rect(sidebar).bottom, window.innerHeight);
+        if (footer) near(rect('.flg-app-shell-footer').left, SIDEBAR_WIDE);
+      } else if (footer) {
+        // The footer runs under the sidebar and pushes it up: it ends where the footer begins.
+        near(rect(sidebar).bottom, rect('.flg-app-shell-footer').top);
+        near(rect('.flg-app-shell-footer').left, 0);
+        near(rect('.flg-app-shell-footer').right, clientWidth());
+        // It is moved, not squeezed: its top slides under the header as the footer comes in, as the
+        // sidebar of a documentation site does.
+        near(rect(sidebar).height, WIDE.height - HEADER_WIDE);
+        const footerBox = rect('.flg-app-shell-footer');
+        const atFooter = document.elementFromPoint(footerBox.left + 40, footerBox.top + 20);
+        await expect(part('.flg-app-shell-footer').contains(atFooter)).toBe(true);
+      } else {
+        near(rect(sidebar).bottom, window.innerHeight);
+      }
+      await scrollTo(0);
+    });
+  };
+}
+
+const long = { rows: 40 };
+
+export const StickySidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" {...long} />,
+  play: checkSticky('sidebar', true),
+};
+export const StickySidebarLayoutWithoutFooter: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" footer={false} {...long} />,
+  play: checkSticky('sidebar', false),
+};
+export const StickyHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" {...long} />,
+  play: checkSticky('header', true),
+};
+export const StickyHeaderLayoutWithoutFooter: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" footer={false} {...long} />,
+  play: checkSticky('header', false),
+};
+
+const BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 } as const;
+const WIDTHS = [1280, 1024, 768, 390];
+
+/**
+ * One boundary per breakpoint, no sideways scroll at any width, and no width where neither layout
+ * applies: for each value of `breakpoint` the page is looked at at the usual widths and on both
+ * sides of the boundary itself. The attribute is set on the root straight away, as the CSS is the
+ * subject here and a re-render would add nothing.
+ */
+function checkWidths(layout: 'sidebar' | 'header') {
+  return async () => {
+    await withViewport(async (viewport) => {
+      const shell = part('.flg-app-shell');
+      for (const [name, boundary] of Object.entries(BREAKPOINTS)) {
+        shell.setAttribute('data-breakpoint', name);
+        for (const width of [...WIDTHS, boundary - 1, boundary]) {
+          await viewport.set(width);
+          const label = `${layout}, breakpoint ${name}, ${width}px`;
+          await expect(
+            document.documentElement.scrollWidth,
+            `${label}: no sideways scroll`,
+          ).toBeLessThanOrEqual(clientWidth());
+          const wide = width >= boundary;
+          const sidebar = getComputedStyle(part('.flg-app-shell-sidebar')).display;
+          await expect(sidebar, `${label}: the sidebar is in the grid only from the boundary`).toBe(
+            wide ? 'block' : 'none',
+          );
+          const column = wide && layout === 'sidebar' ? SIDEBAR_WIDE : 0;
+          near(rect('.flg-app-shell-header').left, column);
+          near(rect('.flg-app-shell-header').right, clientWidth());
+          near(rect('.flg-app-shell-main').left, wide ? SIDEBAR_WIDE : 0);
+          near(rect('.flg-app-shell-main').right, clientWidth());
+          near(rect('.flg-app-shell-header').height, wide ? HEADER_WIDE : 56);
+        }
+      }
+    });
+  };
+}
+
+export const NoSidewaysScrollSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" rows={6} />,
+  play: checkWidths('sidebar'),
+};
+export const NoSidewaysScrollHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" rows={6} />,
+  play: checkWidths('header'),
+};
+
+// ---------------------------------------------------------------------------------------------------
+// The document under a sticky header (spec §3.3).
+
+/**
+ * The shell measures its header and writes the height on `<html>`, and the page's own rule takes its
+ * `scroll-padding-top` from it, so a control focused from below, an `#anchor` and a find-in-page hit
+ * land under the header and not behind it. The margin of `<body>` is gone, so the frame touches the
+ * edges. A header that grows, because its height variable is changed, is followed.
+ */
+export const DocumentRules: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" rows={6} />,
+  play: async () => {
+    await withViewport(async (viewport) => {
+      const root = document.documentElement;
+      const header = part('.flg-app-shell-header');
+      const offset = () => root.style.getPropertyValue('--flg-app-shell-header-offset');
+      for (const [width, height] of [
+        [1280, 60],
+        [390, 56],
+      ] as const) {
+        await viewport.set(width);
+        await waitFor(() => expect(offset()).toBe(`${height}px`));
+        await expect(getComputedStyle(root).scrollPaddingTop).toBe(`${height}px`);
+        near(header.getBoundingClientRect().height, height);
+        const body = getComputedStyle(document.body);
+        await expect([
+          body.marginTop,
+          body.marginRight,
+          body.marginBottom,
+          body.marginLeft,
+        ]).toEqual(['0px', '0px', '0px', '0px']);
+        // The frame touches the edge of the window.
+        near(part('.flg-app-shell').getBoundingClientRect().left, 0);
+        near(header.getBoundingClientRect().top, 0);
+      }
+      await viewport.set(1280);
+      // The caller gives the header more room: the padding follows the measure, not a guess.
+      part('.flg-app-shell').style.setProperty('--flg-app-shell-header-height', '88px');
+      await waitFor(() => expect(offset()).toBe('88px'));
+      await expect(getComputedStyle(root).scrollPaddingTop).toBe('88px');
+    });
+  },
+};
+
+// Where the row the keyboard goes back to is put: inside the window, so a browser sees nothing to
+// scroll to, but under the header, so it is hidden. Only a `scroll-padding-top` that matches the
+// header tells it otherwise; a row that was out of the window altogether would be centred.
+const ROW_UNDER_HEADER = 10;
+
+/**
+ * A control that the keyboard goes back to is not left under the sticky header: Shift+Tab onto a row
+ * that is in the window but behind the header brings it out below the header (WCAG 2.4.11), in both
+ * layouts, on a wide and on a narrow screen. Skipped without trusted input.
+ */
+function checkFocusClear() {
+  return async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      for (const width of [1280, 390]) {
+        await viewport.set(width);
+        const header = part('.flg-app-shell-header');
+        await waitFor(() =>
+          expect(
+            document.documentElement.style.getPropertyValue('--flg-app-shell-header-offset'),
+          ).not.toBe(''),
+        );
+        const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-row]'));
+        await expect(rows).toHaveLength(40);
+        // Row 20 has the focus; row 19, above it, is behind the header.
+        const below = rows[19]!;
+        const above = rows[18]!;
+        below.focus();
+        await scrollTo(above.getBoundingClientRect().top + window.scrollY - ROW_UNDER_HEADER);
+        await expect(above.getBoundingClientRect().top).toBeLessThan(
+          header.getBoundingClientRect().bottom,
+        );
+        await real.keyboard('{Shift>}{Tab}{/Shift}');
+        await expect(above).toHaveFocus();
+        await waitFor(() => {
+          const headerBottom = header.getBoundingClientRect().bottom;
+          expect(
+            above.getBoundingClientRect().top,
+            `${width}px: the focused row is below the header`,
+          ).toBeGreaterThanOrEqual(headerBottom - 0.5);
+        });
+        await scrollTo(0);
+      }
+    });
+  };
+}
+
+export const FocusStaysBelowTheHeaderSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" rows={40} />,
+  play: checkFocusClear(),
+};
+export const FocusStaysBelowTheHeaderHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" rows={40} />,
+  play: checkFocusClear(),
+};
+
+// ---------------------------------------------------------------------------------------------------
+// The skip link.
+
+/**
+ * The first Tab shows the skip link, in view and readable; Enter takes the focus to the main, which is
+ * not under the header. Skipped without trusted input.
+ *
+ * Two things the engines do differently from a user's browser. Safari does not put links in the Tab
+ * order unless a setting is on, so WebKit gets the focus by script and the link is checked from there.
+ * And a navigation to a fragment closes the page the Vitest browser runs the story in, whatever the
+ * fragment, so Enter is caught before it navigates and the story does what the browser does for a
+ * fragment: scrolls to the target, which honours the `scroll-padding-top` of the page, and focuses it.
+ */
+function checkSkipLink() {
+  return async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const link = part<HTMLAnchorElement>('.flg-app-shell-skip');
+      const main = part('.flg-app-shell-main');
+      // Nothing of the page has the focus yet; the link is out of sight.
+      (document.activeElement as HTMLElement | null)?.blur();
+      await expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
+      const safari =
+        navigator.userAgent.includes('AppleWebKit') && !navigator.userAgent.includes('Chrome');
+      if (safari) link.focus();
+      else await real.keyboard('{Tab}');
+      await expect(link).toHaveFocus();
+      const box = link.getBoundingClientRect();
+      await expect(getComputedStyle(link).position).toBe('fixed');
+      await expect(box.width).toBeGreaterThan(40);
+      await expect(box.top).toBeGreaterThanOrEqual(0);
+      await expect(box.left).toBeGreaterThanOrEqual(0);
+      await expect(box.right).toBeLessThanOrEqual(clientWidth());
+      // It is the first thing under the pointer at its own centre: nothing covers it.
+      const at = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
+      await expect(at).toBe(link);
+      const followFragment = (event: MouseEvent) => {
+        if (event.target !== link) return;
+        event.preventDefault();
+        expect(link.getAttribute('href')).toBe(`#${main.id}`);
+        main.scrollIntoView();
+        main.focus({ preventScroll: true });
+      };
+      window.addEventListener('click', followFragment, true);
+      try {
+        await real.keyboard('{Enter}');
+      } finally {
+        window.removeEventListener('click', followFragment, true);
+      }
+      await waitFor(() => expect(main).toHaveFocus());
+      await afterLayout();
+      await expect(main.getBoundingClientRect().top).toBeGreaterThanOrEqual(
+        part('.flg-app-shell-header').getBoundingClientRect().bottom - 0.5,
+      );
+      // The link is out of sight again once the focus is gone.
+      await expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
+    });
+  };
+}
+
+export const SkipLinkSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" rows={20} />,
+  play: checkSkipLink(),
+};
+export const SkipLinkHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" rows={20} />,
+  play: checkSkipLink(),
+};
diff --git a/src/components/app-shell/AppShell.test-d.ts b/src/components/app-shell/AppShell.test-d.ts
new file mode 100644
index 0000000..439fe9a
--- /dev/null
+++ b/src/components/app-shell/AppShell.test-d.ts
@@ -0,0 +1,68 @@
+import { expectTypeOf, test } from 'vitest';
+import type { ReactNode } from 'react';
+import type {
+  AppShellBrandProps,
+  AppShellFooterProps,
+  AppShellHeaderProps,
+  AppShellLabels,
+  AppShellMainProps,
+  AppShellProps,
+  AppShellSidebarProps,
+} from '../../index';
+
+test('an AppShell takes only the documented layouts and breakpoints', () => {
+  expectTypeOf<AppShellProps['layout']>().toEqualTypeOf<'sidebar' | 'header' | undefined>();
+  expectTypeOf<AppShellProps['breakpoint']>().toEqualTypeOf<'md' | 'lg' | 'xl' | undefined>();
+  // @ts-expect-error an unknown layout
+  const unknownLayout: AppShellProps = { layout: 'floating' };
+  // @ts-expect-error the layout of a design that was not built
+  const notBuilt: AppShellProps = { layout: 'panes' };
+  // @ts-expect-error an unknown breakpoint
+  const unknownBreakpoint: AppShellProps = { breakpoint: 'sm' };
+  // @ts-expect-error a width is not a breakpoint
+  const width: AppShellProps = { breakpoint: 1024 };
+  expectTypeOf(unknownLayout).toBeObject();
+  expectTypeOf(notBuilt).toBeObject();
+  expectTypeOf(unknownBreakpoint).toBeObject();
+  expectTypeOf(width).toBeObject();
+});
+
+test('the brand is any node, and the words may be given in part', () => {
+  expectTypeOf<AppShellProps['brand']>().toEqualTypeOf<ReactNode>();
+  expectTypeOf<NonNullable<AppShellProps['labels']>>().toEqualTypeOf<Partial<AppShellLabels>>();
+  expectTypeOf<keyof AppShellLabels>().toEqualTypeOf<'skipToContent'>();
+});
+
+test('the main and the sidebar take no id, which the library sets for the skip link', () => {
+  // @ts-expect-error the id is the library's
+  const main: AppShellMainProps = { id: 'main' };
+  // @ts-expect-error the id is the library's
+  const sidebar: AppShellSidebarProps = { id: 'side' };
+  expectTypeOf(main).toBeObject();
+  expectTypeOf(sidebar).toBeObject();
+  // The header and the footer are not pointed at, so they keep theirs.
+  expectTypeOf<AppShellHeaderProps['id']>().toEqualTypeOf<string | undefined>();
+  expectTypeOf<AppShellFooterProps['id']>().toEqualTypeOf<string | undefined>();
+});
+
+test('a brand needs a name, and takes a child only with asChild', () => {
+  expectTypeOf<AppShellBrandProps['name']>().toEqualTypeOf<ReactNode>();
+  // @ts-expect-error the name is the text of the link
+  const nameless: AppShellBrandProps = { logo: 'L' };
+  // @ts-expect-error a child without asChild would be dropped
+  const lostChild: AppShellBrandProps = { name: 'Lumen', children: 'x' };
+  // @ts-expect-error asChild needs the element
+  const noChild: AppShellBrandProps = { name: 'Lumen', asChild: true };
+  // @ts-expect-error the element brings its own href
+  const both: AppShellBrandProps = { name: 'Lumen', asChild: true, href: '/', children: 'x' };
+  const ok: AppShellBrandProps[] = [
+    { name: 'Lumen' },
+    { name: 'Lumen', logo: 'L', href: '/' },
+    { name: 'Lumen', asChild: true, children: 'x' },
+  ];
+  expectTypeOf(nameless).toBeObject();
+  expectTypeOf(lostChild).toBeObject();
+  expectTypeOf(noChild).toBeObject();
+  expectTypeOf(both).toBeObject();
+  expectTypeOf(ok).toBeArray();
+});
diff --git a/src/components/app-shell/AppShell.test.tsx b/src/components/app-shell/AppShell.test.tsx
new file mode 100644
index 0000000..206d68e
--- /dev/null
+++ b/src/components/app-shell/AppShell.test.tsx
@@ -0,0 +1,382 @@
+import { render, screen } from '@testing-library/react';
+import { createRef } from 'react';
+import type { ComponentType, ReactNode } from 'react';
+import { beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import {
+  AppShell,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+} from './AppShell';
+import { AppShellBrand } from './AppShellBrand';
+
+beforeEach(() => {
+  resetDevWarnings();
+  vi.restoreAllMocks();
+});
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
+
+/** A shell with the four parts, in the order the docs recommend. */
+function Shell({
+  children,
+  ...props
+}: { children?: ReactNode } & Partial<Parameters<typeof AppShell>[0]>) {
+  return (
+    <AppShell {...props}>
+      <AppShellHeader>Header</AppShellHeader>
+      <AppShellSidebar>Sidebar</AppShellSidebar>
+      <AppShellMain>{children ?? 'Main'}</AppShellMain>
+      <AppShellFooter>Footer</AppShellFooter>
+    </AppShell>
+  );
+}
+
+describe('AppShell', () => {
+  it('renders the root with the sidebar layout and the lg breakpoint by default', () => {
+    const { container } = render(<Shell />);
+    const root = container.firstElementChild!;
+    expect(root.tagName).toBe('DIV');
+    expect(root).toHaveClass('flg-app-shell');
+    expect(root).toHaveAttribute('data-layout', 'sidebar');
+    expect(root).toHaveAttribute('data-breakpoint', 'lg');
+  });
+
+  it.each(['sidebar', 'header'] as const)('reflects layout %s', (layout) => {
+    const { container } = render(<Shell layout={layout} />);
+    expect(container.firstElementChild).toHaveAttribute('data-layout', layout);
+  });
+
+  it.each(['md', 'lg', 'xl'] as const)('reflects breakpoint %s', (breakpoint) => {
+    const { container } = render(<Shell breakpoint={breakpoint} />);
+    expect(container.firstElementChild).toHaveAttribute('data-breakpoint', breakpoint);
+  });
+
+  it('takes a value outside the unions as the default, and says so in the attributes', () => {
+    const { container } = render(
+      // @ts-expect-error a layout of plain JavaScript or of a cookie
+      <Shell layout="floating" breakpoint="sm" />,
+    );
+    const root = container.firstElementChild!;
+    expect(root).toHaveAttribute('data-layout', 'sidebar');
+    expect(root).toHaveAttribute('data-breakpoint', 'lg');
+  });
+
+  it('keeps className, style and other props, and forwards the ref to the root', () => {
+    const ref = createRef<HTMLDivElement>();
+    const { container } = render(
+      <AppShell ref={ref} className="mine" style={{ color: 'red' }} data-testid="root">
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    const root = container.firstElementChild as HTMLElement;
+    expect(ref.current).toBe(root);
+    expect(root).toHaveClass('flg-app-shell', 'mine');
+    expect(root.style.color).toBe('red');
+    expect(root).toHaveAttribute('data-testid', 'root');
+  });
+
+  describe('landmarks', () => {
+    it('is a banner, a main and a contentinfo, and the sidebar is not a landmark', () => {
+      const { container } = render(<Shell />);
+      expect(screen.getByRole('banner')).toHaveTextContent('Header');
+      expect(screen.getByRole('main')).toHaveTextContent('Main');
+      expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer');
+      const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
+      expect(sidebar.tagName).toBe('DIV');
+      expect(sidebar).not.toHaveAttribute('role');
+    });
+  });
+
+  describe('the skip link', () => {
+    it('is the first child of the root and points at the main', () => {
+      const { container } = render(<Shell />);
+      const link = container.firstElementChild!.firstElementChild as HTMLAnchorElement;
+      expect(link.tagName).toBe('A');
+      expect(link).toHaveClass('flg-app-shell-skip', 'flg-visually-hidden');
+      expect(link).toHaveTextContent('Skip to content');
+      const main = screen.getByRole('main');
+      expect(main.id).not.toBe('');
+      expect(link.getAttribute('href')).toBe(`#${main.id}`);
+    });
+
+    it('lets the main take the focus, which is where the browser puts it for the fragment', () => {
+      render(<Shell />);
+      const main = screen.getByRole('main');
+      expect(main).toHaveAttribute('tabindex', '-1');
+      main.focus();
+      expect(main).toHaveFocus();
+    });
+
+    it('says its words from `labels`, and keeps the default for a key left out', () => {
+      const { rerender } = render(<Shell labels={{ skipToContent: 'Đến nội dung' }} />);
+      expect(screen.getByRole('link', { name: 'Đến nội dung' })).toBeInTheDocument();
+      // A translation that was not found is `undefined`: the English word stays.
+      rerender(<Shell labels={{ skipToContent: undefined }} />);
+      expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
+    });
+
+    it('is a link to the main of its own shell when there are two', () => {
+      render(
+        <>
+          <Shell />
+          <Shell />
+        </>,
+      );
+      const mains = screen.getAllByRole('main');
+      const links = screen.getAllByRole('link', { name: 'Skip to content' });
+      expect(links.map((link) => link.getAttribute('href'))).toEqual(
+        mains.map((main) => `#${main.id}`),
+      );
+      expect(mains[0]!.id).not.toBe(mains[1]!.id);
+    });
+  });
+
+  describe('the parts', () => {
+    it('are the elements of the spec, with their own class names, props and refs', () => {
+      const header = createRef<HTMLElement>();
+      const sidebar = createRef<HTMLDivElement>();
+      const main = createRef<HTMLElement>();
+      const footer = createRef<HTMLElement>();
+      render(
+        <AppShell>
+          <AppShellHeader ref={header} className="a" aria-label="Top">
+            H
+          </AppShellHeader>
+          <AppShellSidebar ref={sidebar} className="b" data-x="1">
+            S
+          </AppShellSidebar>
+          <AppShellMain ref={main} className="c" aria-label="Content">
+            M
+          </AppShellMain>
+          <AppShellFooter ref={footer} className="d" title="Foot">
+            F
+          </AppShellFooter>
+        </AppShell>,
+      );
+      expect(header.current).toBe(screen.getByRole('banner'));
+      expect(header.current).toHaveClass('flg-surface', 'flg-app-shell-header', 'a');
+      expect(header.current).toHaveAttribute('aria-label', 'Top');
+      // The cell has no look of its own: the glass is the panel in it.
+      expect(sidebar.current).toHaveClass('flg-app-shell-sidebar', 'b');
+      expect(sidebar.current).not.toHaveClass('flg-surface');
+      expect(sidebar.current!.firstElementChild).toHaveClass(
+        'flg-surface',
+        'flg-app-shell-sidebar-panel',
+      );
+      expect(sidebar.current).toHaveAttribute('data-x', '1');
+      expect(main.current).toBe(screen.getByRole('main', { name: 'Content' }));
+      expect(main.current).toHaveClass('flg-app-shell-main', 'c');
+      expect(footer.current).toBe(screen.getByRole('contentinfo'));
+      expect(footer.current).toHaveClass('flg-surface', 'flg-app-shell-footer', 'd');
+      expect(footer.current).toHaveAttribute('title', 'Foot');
+    });
+
+    it('puts the children of the sidebar in the body of its panel, after the head', () => {
+      const { container } = render(<Shell />);
+      const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
+      expect(Array.from(sidebar.children).map((child) => child.className)).toEqual([
+        'flg-surface flg-app-shell-sidebar-panel',
+      ]);
+      const panel = sidebar.firstElementChild!;
+      expect(Array.from(panel.children).map((child) => child.className)).toEqual([
+        'flg-app-shell-sidebar-head',
+        'flg-app-shell-sidebar-body',
+      ]);
+      expect(sidebar.querySelector('.flg-app-shell-sidebar-body')).toHaveTextContent('Sidebar');
+    });
+
+    it('give the main and the sidebar an id of the library, which a caller cannot replace', () => {
+      const own = { id: 'mine' } as object;
+      const { container } = render(
+        <AppShell>
+          <AppShellSidebar {...own}>S</AppShellSidebar>
+          <AppShellMain {...own}>M</AppShellMain>
+        </AppShell>,
+      );
+      const main = screen.getByRole('main');
+      const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
+      expect(main.id).not.toBe('mine');
+      expect(sidebar.id).not.toBe('mine');
+      expect(main.id).not.toBe(sidebar.id);
+      expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
+        'href',
+        `#${main.id}`,
+      );
+    });
+  });
+
+  describe('the brand', () => {
+    const brand = <AppShellBrand name="Lumen" logo="L" href="/" />;
+
+    it('is drawn at the head of the header and at the head of the sidebar', () => {
+      const { container } = render(<Shell brand={brand} />);
+      const inHeader = container.querySelector(
+        '.flg-app-shell-header > .flg-app-shell-header-brand',
+      );
+      const inSidebar = container.querySelector(
+        '.flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head',
+      );
+      expect(inHeader?.querySelector('a.flg-app-shell-brand')).toHaveTextContent('Lumen');
+      expect(inSidebar?.querySelector('a.flg-app-shell-brand')).toHaveTextContent('Lumen');
+      // The brand cell comes before what the caller puts in the header.
+      expect(container.querySelector('.flg-app-shell-header')!.firstElementChild).toBe(inHeader);
+    });
+
+    it('leaves out the cell of the header, but not the head of the sidebar, without a brand', () => {
+      const { container } = render(<Shell />);
+      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
+      // The head stays so the navigation always starts below the line of the header.
+      expect(container.querySelector('.flg-app-shell-sidebar-head')).toBeEmptyDOMElement();
+    });
+
+    it.each([false, null, '', []])('leaves out the cell of the header for brand %j', (empty) => {
+      const { container } = render(<Shell brand={empty} />);
+      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
+    });
+
+    it('keeps a brand of 0, which is something to draw', () => {
+      const { container } = render(<Shell brand={0} />);
+      expect(container.querySelector('.flg-app-shell-header-brand')).toHaveTextContent('0');
+    });
+
+    it('follows a brand that changes while the shell is mounted', () => {
+      const { container, rerender } = render(<Shell />);
+      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
+      rerender(<Shell brand={brand} />);
+      expect(container.querySelector('.flg-app-shell-header-brand')).toHaveTextContent('Lumen');
+      rerender(<Shell />);
+      expect(container.querySelector('.flg-app-shell-header-brand')).toBeNull();
+    });
+  });
+
+  describe('dev warnings', () => {
+    it('are silent for a shell that is used as documented', () => {
+      const warn = spyWarn();
+      render(<Shell />);
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('are silent for a part inside a component that adds no element', () => {
+      const warn = spyWarn();
+      const Parts = () => (
+        <>
+          <AppShellHeader>H</AppShellHeader>
+          <AppShellMain>M</AppShellMain>
+        </>
+      );
+      render(
+        <AppShell>
+          <Parts />
+        </AppShell>,
+      );
+      expect(warn).not.toHaveBeenCalled();
+    });
+
+    it('say that there is no main to skip to', () => {
+      const warn = spyWarn();
+      render(
+        <AppShell>
+          <AppShellHeader>H</AppShellHeader>
+        </AppShell>,
+      );
+      expect(warnings(warn)).toEqual([
+        '[h2d-glass-ui] <AppShell> has no <AppShellMain>: the skip link has nowhere to go.',
+      ]);
+    });
+
+    it.each([
+      ['AppShellHeader', AppShellHeader],
+      ['AppShellSidebar', AppShellSidebar],
+      ['AppShellMain', AppShellMain],
+      ['AppShellFooter', AppShellFooter],
+    ] as Array<[string, ComponentType<{ children?: ReactNode }>]>)(
+      'say that there is more than one %s',
+      (name, Part) => {
+        const warn = spyWarn();
+        render(
+          <AppShell>
+            <AppShellMain>M</AppShellMain>
+            <Part>one</Part>
+            <Part>two</Part>
+          </AppShell>,
+        );
+        expect(warnings(warn)).toContain(`[h2d-glass-ui] <AppShell> has more than one <${name}>.`);
+      },
+    );
+
+    it('say that a part is outside an AppShell, one message for each part', () => {
+      const warn = spyWarn();
+      render(
+        <>
+          <AppShellHeader>H</AppShellHeader>
+          <AppShellSidebar>S</AppShellSidebar>
+          <AppShellMain>M</AppShellMain>
+          <AppShellFooter>F</AppShellFooter>
+        </>,
+      );
+      expect(warnings(warn)).toEqual([
+        '[h2d-glass-ui] <AppShellHeader> must be rendered inside <AppShell>.',
+        '[h2d-glass-ui] <AppShellSidebar> must be rendered inside <AppShell>.',
+        '[h2d-glass-ui] <AppShellMain> must be rendered inside <AppShell>.',
+        '[h2d-glass-ui] <AppShellFooter> must be rendered inside <AppShell>.',
+      ]);
+      // They still render, with an id of their own: the library does not throw on misuse.
+      expect(screen.getByRole('main')).toHaveAttribute('id');
+    });
+
+    it('say that a part is not a direct child, and name the part', () => {
+      const warn = spyWarn();
+      render(
+        <AppShell>
+          <div>
+            <AppShellSidebar>S</AppShellSidebar>
+          </div>
+          <AppShellMain>M</AppShellMain>
+        </AppShell>,
+      );
+      expect(warnings(warn)).toEqual([
+        '[h2d-glass-ui] <AppShellSidebar> must be a direct child of <AppShell>: a component around it is fine, an element around it is not.',
+      ]);
+    });
+
+    it('count a main that is mounted later, and warn for a second one at that point', () => {
+      const warn = spyWarn();
+      const { rerender } = render(
+        <AppShell>
+          <AppShellMain>M</AppShellMain>
+        </AppShell>,
+      );
+      expect(warn).not.toHaveBeenCalled();
+      rerender(
+        <AppShell>
+          <AppShellMain>M</AppShellMain>
+          <AppShellFooter>F</AppShellFooter>
+          <AppShellMain key="second">M2</AppShellMain>
+        </AppShell>,
+      );
+      expect(warnings(warn)).toEqual([
+        '[h2d-glass-ui] <AppShell> has more than one <AppShellMain>.',
+      ]);
+    });
+
+    it('do not carry a value, so a changing one cannot make a new message', () => {
+      const warn = spyWarn();
+      for (const layout of ['sidebar', 'header'] as const) {
+        render(
+          <AppShell layout={layout} brand={<AppShellBrand name={layout} />}>
+            <div>
+              <AppShellFooter>F</AppShellFooter>
+            </div>
+            <AppShellMain>M</AppShellMain>
+          </AppShell>,
+        );
+      }
+      // Two shells, one mistake each: the text is the same, so it is printed once.
+      expect(warn).toHaveBeenCalledTimes(1);
+    });
+  });
+});
diff --git a/src/components/app-shell/AppShellBrand.test.tsx b/src/components/app-shell/AppShellBrand.test.tsx
new file mode 100644
index 0000000..bb52ae4
--- /dev/null
+++ b/src/components/app-shell/AppShellBrand.test.tsx
@@ -0,0 +1,90 @@
+import { render, screen } from '@testing-library/react';
+import { createRef } from 'react';
+import { beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { AppShellBrand } from './AppShellBrand';
+
+beforeEach(() => {
+  resetDevWarnings();
+  vi.restoreAllMocks();
+});
+
+describe('AppShellBrand', () => {
+  it('is a link to its home with an href: the logo hidden, the name as the text', () => {
+    render(<AppShellBrand name="Lumen" logo={<i data-testid="mark" />} href="/home" />);
+    const link = screen.getByRole('link', { name: 'Lumen' });
+    expect(link.tagName).toBe('A');
+    expect(link).toHaveAttribute('href', '/home');
+    expect(link).toHaveClass('flg-app-shell-brand');
+    const logo = link.querySelector('.flg-app-shell-brand-logo')!;
+    expect(logo).toHaveAttribute('aria-hidden', 'true');
+    expect(logo).toContainElement(screen.getByTestId('mark'));
+    expect(link.querySelector('.flg-app-shell-brand-name')).toHaveTextContent('Lumen');
+    // The logo comes first.
+    expect(link.firstElementChild).toBe(logo);
+  });
+
+  it('is a span without an href, and then it is not a link', () => {
+    const { container } = render(<AppShellBrand name="Lumen" />);
+    expect(container.firstElementChild!.tagName).toBe('SPAN');
+    expect(screen.queryByRole('link')).toBeNull();
+    expect(container.firstElementChild).toHaveClass('flg-app-shell-brand');
+  });
+
+  it.each([undefined, null, false, '', []])('leaves out the logo for %j', (logo) => {
+    const { container } = render(<AppShellBrand name="Lumen" logo={logo} />);
+    expect(container.querySelector('.flg-app-shell-brand-logo')).toBeNull();
+    expect(container.querySelector('.flg-app-shell-brand-name')).toHaveTextContent('Lumen');
+  });
+
+  it('keeps the class name, the props and the ref of the caller', () => {
+    const ref = createRef<HTMLElement>();
+    render(<AppShellBrand ref={ref} name="Lumen" href="/" className="mine" data-x="1" />);
+    const link = screen.getByRole('link');
+    expect(ref.current).toBe(link);
+    expect(link).toHaveClass('flg-app-shell-brand', 'mine');
+    expect(link).toHaveAttribute('data-x', '1');
+  });
+
+  describe('asChild', () => {
+    it('renders the child with the class and with the logo and the name in it', () => {
+      render(
+        <AppShellBrand asChild logo="L" name="Lumen" className="mine">
+          <a href="/router" data-router="">
+            replaced
+          </a>
+        </AppShellBrand>,
+      );
+      const link = screen.getByRole('link', { name: 'Lumen' });
+      // The child keeps its own props; the content is the library's.
+      expect(link).toHaveAttribute('href', '/router');
+      expect(link).toHaveAttribute('data-router');
+      expect(link).toHaveClass('flg-app-shell-brand', 'mine');
+      expect(link).not.toHaveTextContent('replaced');
+      expect(link.querySelector('.flg-app-shell-brand-logo')).toHaveTextContent('L');
+    });
+
+    it('forwards the ref to the child', () => {
+      const ref = createRef<HTMLElement>();
+      render(
+        <AppShellBrand ref={ref} asChild name="Lumen">
+          <a href="/">x</a>
+        </AppShellBrand>,
+      );
+      expect(ref.current).toBe(screen.getByRole('link'));
+    });
+
+    it('warns, and renders nothing, when the child is not a single element', () => {
+      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+      const { container } = render(
+        <AppShellBrand asChild name="Lumen">
+          just text
+        </AppShellBrand>,
+      );
+      expect(container).toBeEmptyDOMElement();
+      expect(warn).toHaveBeenCalledWith(
+        '[h2d-glass-ui] `asChild` expects exactly one React element as its child.',
+      );
+    });
+  });
+});
diff --git a/src/components/app-shell/use-header-offset.test.tsx b/src/components/app-shell/use-header-offset.test.tsx
new file mode 100644
index 0000000..37612c1
--- /dev/null
+++ b/src/components/app-shell/use-header-offset.test.tsx
@@ -0,0 +1,158 @@
+import { act, render } from '@testing-library/react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { AppShell, AppShellHeader, AppShellMain } from './AppShell';
+import { HEADER_OFFSET_PROPERTY } from './use-header-offset';
+
+/** Stands in for ResizeObserver, which jsdom lacks; `resize(target, height)` reports what a browser would. */
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
+    resize(target: Element, blockSize: number) {
+      const entry = { target, borderBoxSize: [{ blockSize }] } as unknown as ResizeObserverEntry;
+      this.callback([entry], this as unknown as ResizeObserver);
+    }
+  }
+  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
+  return all;
+}
+
+const offset = () => document.documentElement.style.getPropertyValue(HEADER_OFFSET_PROPERTY);
+
+beforeEach(() => {
+  document.documentElement.style.removeProperty(HEADER_OFFSET_PROPERTY);
+});
+afterEach(() => {
+  vi.unstubAllGlobals();
+  vi.restoreAllMocks();
+});
+
+describe('the measure of the header', () => {
+  it('is written on <html> as soon as the shell mounts, from the layout height of the header', () => {
+    const observers = fakeResizeObservers();
+    // jsdom has no layout, so the height a header has is given to every element.
+    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(60);
+    render(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    expect(offset()).toBe('60px');
+    expect(observers).toHaveLength(1);
+  });
+
+  it('follows the header when it grows, with the size the observer reports', () => {
+    const observers = fakeResizeObservers();
+    const { container } = render(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    const header = container.querySelector('header')!;
+    act(() => observers[0]!.resize(header, 56));
+    expect(offset()).toBe('56px');
+    // A fraction is kept: the observer reports the layout size, not a rounded one.
+    act(() => observers[0]!.resize(header, 71.5));
+    expect(offset()).toBe('71.5px');
+  });
+
+  it('is written only when the height changes', () => {
+    const observers = fakeResizeObservers();
+    const set = vi.spyOn(document.documentElement.style, 'setProperty');
+    const { container } = render(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+      </AppShell>,
+    );
+    const header = container.querySelector('header')!;
+    act(() => observers[0]!.resize(header, 56));
+    const writes = set.mock.calls.length;
+    act(() => observers[0]!.resize(header, 56));
+    act(() => observers[0]!.resize(header, 56));
+    expect(set.mock.calls.length).toBe(writes);
+    act(() => observers[0]!.resize(header, 60));
+    expect(set.mock.calls.length).toBe(writes + 1);
+  });
+
+  it('is taken off <html> when the shell unmounts, and observing stops', () => {
+    const observers = fakeResizeObservers();
+    const { container, unmount } = render(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+      </AppShell>,
+    );
+    act(() => observers[0]!.resize(container.querySelector('header')!, 56));
+    expect(offset()).toBe('56px');
+    unmount();
+    expect(offset()).toBe('');
+    expect(observers[0]!.disconnect).toHaveBeenCalled();
+  });
+
+  it('follows a header that mounts after the shell, and goes when the header is removed', () => {
+    const observers = fakeResizeObservers();
+    const { container, rerender } = render(
+      <AppShell>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    expect(observers).toHaveLength(0);
+    expect(offset()).toBe('');
+    rerender(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    expect(observers).toHaveLength(1);
+    const header = container.querySelector('header')!;
+    act(() => observers[0]!.resize(header, 56));
+    expect(offset()).toBe('56px');
+    rerender(
+      <AppShell>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    expect(offset()).toBe('');
+    expect(observers[0]!.disconnect).toHaveBeenCalled();
+  });
+
+  it('writes nothing where there is no ResizeObserver, and the stylesheet keeps its 56px', () => {
+    vi.stubGlobal('ResizeObserver', undefined);
+    render(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+      </AppShell>,
+    );
+    expect(offset()).toBe('');
+  });
+
+  it('reads the layout height where an entry has no border-box size', () => {
+    const observers = fakeResizeObservers();
+    const { container } = render(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+      </AppShell>,
+    );
+    const header = container.querySelector('header')!;
+    vi.spyOn(header, 'offsetHeight', 'get').mockReturnValue(64);
+    act(() =>
+      observers[0]!.callback(
+        [{ target: header } as unknown as ResizeObserverEntry],
+        {} as ResizeObserver,
+      ),
+    );
+    expect(offset()).toBe('64px');
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index 7e5b6dd..ee8cbfb 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -12,6 +12,12 @@ describe('public API', () => {
       'AlertActions',
       'AlertDescription',
       'AlertTitle',
+      'AppShell',
+      'AppShellBrand',
+      'AppShellFooter',
+      'AppShellHeader',
+      'AppShellMain',
+      'AppShellSidebar',
       'Avatar',
       'Badge',
       'Breadcrumb',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/app-shell src/index.test.ts
pnpm vitest run --project scripts scripts/lib/app-shell-css.test.ts
```

Expected: FAIL.
- `app-shell-css.test.ts` không nạp được: `Failed to resolve import "./app-shell-css" from "scripts/lib/app-shell-css.test.ts". Does the file exist?`. Đây là lỗi đầu mà bản nháp thấy: test của bộ sinh viết trước bộ sinh.
- `AppShell.test.tsx`, `AppShellBrand.test.tsx` và `use-header-offset.test.tsx` không nạp được ở cả hai project React (`Failed to resolve import "./AppShell…"`), nên không test nào của chúng chạy.
- `AppShell.test-d.ts` báo lỗi kiểu vì module chưa có.
- `public API > exports exactly the documented components and nothing internal`: danh sách export nhận được thiếu sáu export của AppShell.

Story không chạy ở bước này: `AppShell.stories.tsx` và `.storybook/app-shell-demo.tsx` import `AppShell`, chưa có.

Unit test của component được viết sau bản đầu của code (phát hiện 13). Bản nháp thấy chúng fail bằng đột biến trên code đã xong:
- `AppShell > takes a value outside the unions as the default, and says so in the attributes`: dùng `String(layout)` thay `toLayout` thì `expected 'floating' to be 'sidebar'`.
- `AppShell > the skip link > is the first child of the root and points at the main`: `href="#main"` cố định thì fail.
- `AppShell > the brand > leaves out the cell of the header for brand %j`: thay `hasContent` bằng `!== undefined` thì các ca brand rỗng fail.
- `AppShell > dev warnings > say that a part is not a direct child, and name the part`: bỏ kiểm `parentElement` thì fail.
- `the measure of the header > is written only when the height changes`: bỏ điều kiện `height === written` thì fail.
- `AppShellBrand > leaves out the logo for %j`: thay `hasContent(logo)` bằng `logo !== undefined` thì bốn ca fail.
- `AppShell.test-d.ts` là test đặc tả (lúc biên dịch).

Story chạy trên code đang viết, và lỗi đầu của chúng là thật: `StickyHeaderLayout` (sidebar đè footer 44px, phát hiện 3), `NoSidewaysScroll…` (`place-items`, phát hiện 2), axe `region` (phát hiện 5). Với đột biến `scroll-padding-top: 0`: `DocumentRules` fail với `expected '0px' to be '60px'`, `FocusStaysBelowTheHeader…` với `1280px: the focused row is below the header: expected 9.7 to be >= 59.5`, `SkipLink…` với `expected 0 to be >= 59.5`.

- [ ] **Step 3: Viết code**

````diff
diff --git a/.storybook/stage.css b/.storybook/stage.css
index 43158d3..292c018 100644
--- a/.storybook/stage.css
+++ b/.storybook/stage.css
@@ -19,9 +19,12 @@
 
 /* A whole page, such as an app shell: no padding and no centring, so the page fills the stage. The
    overflow is `clip`, not `hidden`: `hidden` makes the stage a scroll container, and a sticky header
-   would then stick to the stage instead of the document. The backdrop below still paints. */
+   would then stick to the stage instead of the document. `place-items` goes back to its initial value:
+   an engine that aligns block-level boxes would otherwise centre the page at the width of its content.
+   The backdrop below still paints. */
 .flg-stage[data-stage='page'] {
   display: block;
+  place-items: normal;
   padding: 0;
   overflow: clip;
   min-height: 100vh;
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index dbf7fcc..b7e38ff 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -313,11 +313,11 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và liên kết của AppShellBrand cùng skip link của AppShell | 1.20:1 | 1.23:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
-| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
+| 6 | `--flg-text-muted` trên nền tham chiếu sáng nhất, và chữ `--flg-text-muted` của option Combobox khi đang lọc cùng dòng trạng thái, và chữ hàng thứ của Calendar, và giá trị của Progress `thin`; ở Stepper: số, tên và mô tả của bước chưa tới, mô tả của mọi bước, dòng "Step N" của bước chưa tới; ở List: mô tả và chữ ở ô cuối của hàng; ở Table `striped` và `minimal`: tiêu đề cột và icon của cột chưa sắp; ở AppShell: chữ của footer | đạt (5.08:1) | 4.10:1 (nền `#2fa8d8`) | 4.5:1 | 1.4.3 |
 | 7 | Chữ `--flg-accent-text` trên nền `--flg-accent-subtle`: Badge `accent`, tab `pill` đang chọn, trang hiện tại của Pagination; tiêu đề bước hiện tại của Stepper `compact`, tiêu đề hàng hiện tại của List | 3.40:1 (trên lớp phủ) | 3.76:1 | 4.5:1 | 1.4.3 |
 | 8 | Nền `--flg-accent-subtle` so với nền panel hoặc bề mặt: item menu (hoặc option của Select) đang được trỏ, tab `pill` đang chọn, trang hiện tại của Pagination; viên thuốc của bước hiện tại (Stepper `compact`), nền hàng hiện tại của List | 1.15:1 | 1.18:1 | 3:1 | 1.4.11 |
 | 9 | Icon, phím tắt và chevron (`--flg-text-muted`) trên item menu (hoặc option của Select) đang được trỏ; dòng gợi ý của vùng thả FileUpload khi đang kéo; mô tả của bước hiện tại trong viên thuốc (Stepper `compact`), mô tả và chữ ở ô cuối của hàng hiện tại List; chữ mờ trên hàng đã chọn của Table | 4.37:1 | 3.60:1 | 4.5:1 (phím tắt), 3:1 (icon) | 1.4.3, 1.4.11 |
@@ -357,6 +357,8 @@ Các số được **làm tròn xuống** 2 chữ số thập phân, và là đ
 
 Điểm 32–34 là chữ trên nền hàng của Table theo mockup T1–T3 (giai đoạn 4, Plan C), thêm khi đọc soát spec giai đoạn 4: Badge trên hàng đang hover (điểm 32, cả ba variant, kèm Badge ở ô cuối của hàng List bấm được, cùng nền `--flg-control-track`), chữ trên hàng lẻ của `striped` (điểm 33: chữ mờ và Badge) và Badge trên hàng đã chọn (điểm 34). Số là thấp nhất trong năm variant Badge, mỗi cái trên nền của chính nó đặt lên nền hàng; Badge `accent` thấp nhất vì nó là lớp nhuộm nhấn thứ hai. Chữ `--flg-text` trên cả ba nền hàng đạt (8.01:1 light, 5.23:1 dark), nên không phải ngoại lệ. Các vị trí khác của Table cùng cặp màu với các điểm 2 (vòng focus của nút sắp xếp và khung cuộn), 6 (tiêu đề cột `striped` và `minimal`, icon cột chưa sắp), 9 (chữ mờ trên hàng đã chọn), 12 (chữ mờ trên hàng đang hover) và 22 (tiêu đề cột `lined`); icon của cột đang sắp (`--flg-accent-text` trên bề mặt) là cặp của điểm 29, là icon nên ngưỡng 3:1 và đạt. Ở `prefers-contrast: more` hàng đã chọn có khung 2px thay cho nền nhuộm, `striped` có đường kẻ thay cho sọc và hàng không đổi nền khi hover, nên mọi chữ trong hàng nằm trên bề mặt và cả ba điểm đều đạt.
 
+Điểm 2 và 6 còn có các vị trí của AppShell (giai đoạn 5, Plan A): vòng focus của liên kết `AppShellBrand` và của skip link (điểm 2), chữ của footer (điểm 6, `--flg-text-muted` trên kính; liên kết trong footer dùng `--flg-text`). Cùng cặp màu nên cùng số đo, không thêm dòng (spec giai đoạn 5 §4.4).
+
 Cả ba mươi bốn điểm đều đạt ở chế độ `prefers-contrast: more` (§4.6). Trang Accessibility trong docs đăng nguyên bảng này kèm đoạn CSS ghi đè token đạt AA.
 
 ---
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index 7d7256e..79933c5 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -134,12 +134,13 @@ Mỗi cặp phương án đã chọn thành giá trị của một prop, nằm t
 | Phần | S1 rộng | S2 rộng | Hẹp |
 |---|---|---|---|
 | Header | cột 2, hàng 1 / -1, `align-self: start`, cao H, `position: sticky; top: 0`, `z-index: 3` | cột 1 / -1, hàng 1 / -1, như trái | cột 1, hàng 1 / -1, như trái |
-| Sidebar | cột 1, hàng 1 / -1, `align-self: stretch`, `max-height: 100dvh`, `sticky; top: 0`, `z-index: 2` | cột 1, hàng 2, `align-self: stretch`, `max-height: calc(100dvh - H)`, `sticky; top: H`, `z-index: 2` | `position: fixed` (§3.4) |
+| Sidebar (ô lưới, không có nền) | cột 1, hàng 1 / -1, `align-self: stretch`, `z-index: 2`; tấm kính bên trong: `sticky; top: 0`, `max-height: 100dvh` | cột 1, hàng 2, `align-self: stretch`, `z-index: 2`; tấm kính bên trong: `sticky; top: H`, `max-height: calc(100dvh - H)` | `position: fixed` (§3.4) |
 | Main | cột 2, hàng 2 | cột 2, hàng 2 | hàng 2 |
 | Footer | cột 2, hàng 3 | cột 1 / -1, hàng 3, `z-index: 3` | hàng 3 |
 
 - **Hàng đầu luôn cao đúng H** nên main bắt đầu dưới header dù header trải qua mọi hàng; header chỉ chiếm phần trên cùng (`align-self: start`) và nổi trên main khi trang cuộn.
-- **Sidebar co theo màn hình** nhờ `stretch` cùng `max-height`: trang ngắn thì sidebar cao bằng ô của nó; trang dài thì sidebar cao bằng phần còn lại của viewport và dính. Ở S2, khi cuộn tới cuối trang, ô của sidebar (hàng 2) kết thúc ở mép trên footer, nên footer đẩy sidebar lên (đúng ghi chú của mockup S2). Ở S1, sidebar chạy hết chiều cao và đáy nó trùng đáy trang khi cuộn tới cuối.
+- **Sidebar co theo màn hình** nhờ `stretch` cùng `max-height`: trang ngắn thì tấm kính cao bằng ô của nó; trang dài thì tấm kính cao bằng phần còn lại của viewport và dính. Ở S2, khi cuộn tới cuối trang, ô của sidebar (hàng 2) kết thúc ở mép trên footer, nên footer đẩy tấm kính lên (đúng ghi chú của mockup S2): đáy tấm kính trùng mép trên footer, và đỉnh của nó trượt xuống dưới header, như sidebar của một trang tài liệu. Ở S1, sidebar chạy hết chiều cao và đáy nó trùng đáy trang khi cuộn tới cuối.
+- **Phần tử sidebar là ô lưới trong suốt, tấm kính là con của nó** (phát hiện khi lập Plan A). Một phần tử `position: sticky` bị giữ bởi content box của phần tử cha, không bởi ô lưới nó nằm trong (đo ở Chromium, Firefox và WebKit: một sidebar vừa là ô hàng 2 vừa là phần tử dính đi qua đáy ô và nằm đè lên footer 44px, vì cha của nó là cả lưới). Nên `.flg-app-shell-sidebar` là ô (`display: block` ở màn rộng, `none` ở màn hẹp) và `.flg-app-shell-sidebar-panel` (lớp `flg-surface`) là phần tử dính, `height: 100%` của ô. `className`, `style` và mọi prop của `AppShellSidebar` vào ô, không vào tấm kính; `ref` trỏ vào ô.
 - **Không có footer:** hàng 3 cao 0. **Không có sidebar:** lưới chỉ một cột ở mọi cỡ (`:not(:has(> .flg-app-shell-sidebar))`), nút trigger ẩn.
 - **Các phần phải là con trực tiếp trong DOM** của `AppShell` (một component bọc không thêm phần tử thì được), vì chúng là ô của lưới; sai thì `devWarn` (§5).
 - **Thứ tự DOM tự do** vì vị trí là của CSS. Docs khuyên `AppShellHeader`, `AppShellSidebar`, `AppShellMain`, `AppShellFooter`: banner trước, rồi điều hướng, rồi nội dung.
@@ -280,9 +281,9 @@ Trong mục này "kính" là lớp `flg-surface` (nền tint, viền gradient 1p
 - **Nút ghost đang mở một popup** (`[aria-haspopup][aria-expanded='true']`) giữ nền `--flg-control-track`, như chuông khi bảng thông báo mở (B1, B3) và nút U2 khi menu mở. Quy tắc nằm trong header, không đổi `Button` ở chỗ khác. Nút trigger không có `aria-haspopup`, nên không bị; nút U1 có quy tắc riêng (vòng nhấn, không nền) thắng quy tắc này.
 - **Đầu hàng** (do `AppShellHeader` render, §6.3): nút trigger (IconButton `ghost` `md` 34×34, icon ☰ 18px), rồi ô brand. Ô brand: S1 rộng ẩn (`display: none`); S1 hẹp và S2 hiện. Màn hẹp: brand cách trigger thêm 4px (`margin-left: 4px`, tổng 8px). S2 rộng: ô brand `flex: none; width: 226px`, để phần tử kế tiếp bắt đầu đúng ở mép nội dung của main (16 + 34 + 8 + 226 + 8 + 4 = 296 = 264 + 32) ở cả khi sidebar mở rộng lẫn khi là rail ("logo và ô tìm kiếm đứng yên"); khi không có trigger ở màn rộng (`collapsible={false}`) ô rộng 268px để giữ cùng vị trí (Claude chốt).
 
-**Sidebar** (`<div class="flg-surface flg-app-shell-sidebar">`):
+**Sidebar** (`<div class="flg-app-shell-sidebar">`, ô lưới trong suốt, chứa `<div class="flg-surface flg-app-shell-sidebar-panel">`; §3.3) (phát hiện khi lập Plan A):
 
-- Kính, `border-radius: 0`, cột `flex`, `min-height: 0`, `overflow: hidden`. Màn rộng: rộng W (264px), rail R (68px).
+- Tấm kính (`-panel`): kính, `border-radius: 0`, cột `flex`, `min-height: 0`, `overflow: hidden`. Màn rộng: rộng W (264px), rail R (68px).
 - Cạnh: S1 bỏ cạnh trên, dưới, trái (còn cạnh phải); S2 bỏ cạnh trái, trên, dưới.
 - **Hàng đầu** (`.flg-app-shell-sidebar-head`): `flex: none`, căn giữa dọc, khoảng cách 8px.
   - S1 rộng: cao 60px (bằng header, nên mép dưới của header nối thẳng vào nav), padding `0 20px`, chứa brand. Rail: `justify-content: center`, padding 0, chữ của brand ẩn khỏi mắt (chỉ còn dấu). Không có `brand` thì hàng vẫn cao 60px, để nav luôn bắt đầu dưới đường của header (Claude chốt).
@@ -541,7 +542,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
 | `editable.ts` (C) | `isEditable(target)` | Chuyển nguyên từ `Toaster.tsx` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]`, hay con của chúng); Toaster và phím tắt của SearchField dùng chung |
 | `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store |
 
-**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `setOpen(open, { returnFocus })`, id của sidebar và main, `labels`, `brand`, đăng ký phần và trigger); `app-shell/use-header-offset.ts` (`useHeaderOffset(headerRef)`: `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
+**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `setOpen(open, { returnFocus })`, id của sidebar và main, `labels`, `brand`, đăng ký phần và trigger); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
 
 **Thay đổi ở primitive và component có sẵn:**
 
@@ -627,9 +628,11 @@ type AppShellSidebarTriggerProps = Omit<ButtonProps, 'aria-label' | 'aria-labell
       <span class="flg-app-shell-header-brand">…brand</span>
       …children
     </header>
-    <div class="flg-surface flg-app-shell-sidebar" id=":r1:" role="dialog" aria-label="Navigation">
-      <div class="flg-app-shell-sidebar-head">…brand <button … aria-label="Close navigation">×</button></div>
-      <div class="flg-app-shell-sidebar-body">…children (Nav)</div>
+    <div class="flg-app-shell-sidebar" id=":r1:" role="dialog" aria-label="Navigation">
+      <div class="flg-surface flg-app-shell-sidebar-panel">
+        <div class="flg-app-shell-sidebar-head">…brand <button … aria-label="Close navigation">×</button></div>
+        <div class="flg-app-shell-sidebar-body">…children (Nav)</div>
+      </div>
     </div>
     <main class="flg-app-shell-main" id=":r0:" tabindex="-1" inert>…</main>
     <footer class="flg-surface flg-app-shell-footer" inert>…</footer>
@@ -654,12 +657,16 @@ type AppShellSidebarTriggerProps = Omit<ButtonProps, 'aria-label' | 'aria-labell
 
 ```ts
 type AppShellBrandProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
-  logo?: ReactNode; name: ReactNode; href?: string; asChild?: boolean;
-};
+  logo?: ReactNode; name: ReactNode;
+} & (
+  | { href?: string; asChild?: false; children?: never }
+  | { href?: never; asChild: true; children: ReactNode }   // phần tử con duy nhất (Link của router)
+);
 ```
 
 - Server-safe. `href` → `<a class="flg-app-shell-brand" href>`; không có → `<span>`; `asChild` → phần tử con (vd `Link` của router) nhận lớp và nội dung qua `Slot`, như `Button asChild` (con giữ props của nó; lib đặt logo và tên làm nội dung).
 - Cấu trúc: `<span class="flg-app-shell-brand-logo" aria-hidden="true">{logo}</span><span class="flg-app-shell-brand-name">{name}</span>`. Tên là chữ của link; logo trang trí.
+- `children` chỉ có khi `asChild` (type bản đầu bỏ `children` mà vẫn cần phần tử con cho `asChild`, (phát hiện khi lập Plan A)); nội dung của phần tử con bị thay bằng logo và tên.
 - Truyền vào `AppShell brand`. `brand` là ReactNode bất kỳ cũng được, nhưng khi đó lib không biết phần nào là tên để ẩn ở rail; docs khuyên dùng `AppShellBrand`.
 
 **`Nav`**, **`NavSection`**, **`NavItem`**, **`NavGroup`**
@@ -861,7 +868,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 |---|---|---|
 | 1 | Unit (jsdom, React 19 và 18.3) | **AppShell:** skip link trỏ đúng id của main; `aria-controls` của trigger; tên và `aria-expanded` của trigger theo mode (giả lập `matchMedia`) và theo `collapsed`; `collapsed`/`open` controlled và uncontrolled; khi mở ở màn hẹp: `inert` trên skip link, header, main, footer (thuộc tính DOM, cả React 18.3), `role="dialog"` và tên trên sidebar, focus vào phần tử đầu, Esc đóng (và bỏ qua khi đã `defaultPrevented`, khi modal stack không rỗng, khi có popover mở), bấm lớp nền đóng, nút × đóng, focus về trigger; đổi mode khi mở thì gọi `onOpenChange(false)`; `--flg-app-shell-header-offset` được ghi lên `<html>` theo số đo (giả lập `ResizeObserver`), đổi khi header đổi cao, và bị xoá khi unmount; các cảnh báo. **AppShellBrand:** link, `span`, `asChild`. **Nav:** `aria-current`; link tắt; `asChild` gộp props và nội dung; nhóm mở sẵn từ con `active` (kể cả qua Fragment và tham chiếu lazy); `aria-expanded`/`aria-controls`/`hidden`; số đếm theo variant; ở rail: nhãn và số còn trong tên, chấm có mặt, tooltip không nối `aria-describedby`; click trong tấm trượt đóng tấm, click có phím bổ trợ thì không; các cảnh báo. **Indicator:** `count`, `max`, `showZero`, `dot`, `show`; `aria-hidden` không ghi đè được; cảnh báo. **SearchField:** giá trị, nút xoá, Esc, `onValueChange`, `FormData`, reset; phím tắt (cả bỏ qua khi đang gõ ở ô khác, cả `defaultPrevented`); chữ gợi ý và `aria-keyshortcuts` theo nền tảng (giả lập); mở, đóng của H3; cảnh báo thiếu tên. **Theme:** thứ tự đổi vòng; nhãn; đọc, ghi `localStorage`; `data-flg-theme` trên `<html>`; sự kiện `storage`; controlled không chạm `<html>`; giá trị phía server; `localStorage` ném lỗi; `ThemeMenuGroup` và `ThemeSwitch` cùng khoá luôn khớp. **ThemeScript:** chuỗi script đúng từng ký tự, khoá có `</script>` được thoát, `nonce`. **UserMenu:** tên của nút; chữ cái đầu; đầu menu không phải mục và là mô tả của menu; `showName`. **List:** `surface={false}`. **Toaster:** `isEditable` sau khi chuyển chỗ chạy như cũ |
 | 2 | Trình duyệt thật (Chromium, Firefox, WebKit) | Header dính và sidebar dính khi cuộn, ở cả S1 và S2; ở S2 footer đẩy sidebar lên ở cuối trang; trang không cuộn ngang ở mọi điểm gãy. Rail: bấm trigger đổi cột. Tấm trượt ở 390px: focus vào trong, Tab không ra khỏi sidebar (trừ ra ngoài `AppShell`), Esc, lớp nền, ×, `NavItem` đóng và trả focus; trang không cuộn khi tấm mở; đổi cỡ lên màn rộng thì đóng; **toast hiện, bấm được khi tấm đang mở** (`Toaster` ngoài `AppShell`). Skip link: Tab đầu tiên hiện nó, Enter đưa focus vào main và main không nằm dưới header. **Focus không bị header che** (Claude chốt; phát hiện khi đọc soát spec): một story `no-visual` (`stage: 'page'`, trang dài) cuộn để một phần tử focus được trong main nằm dưới header, rồi Shift+Tab từ phần tử phía dưới lên nó; sau đó mép trên của phần tử nằm dưới mép dưới của header, ở S1 và S2, màn rộng và màn hẹp; `scroll-padding-top` của `<html>` bằng chiều cao đo được của header, và `body` không có margin. Nav: tooltip ở rail khi hover và focus; flyout mở, Esc đóng và trả focus, bấm ngoài đóng, focus rời thì đóng, link trong flyout đóng nó. SearchField: "/" và ⌘K/Ctrl K focus ô (H3: mở ô), Esc xoá rồi đóng, ô phủ header dưới 768px với nút ←, Enter gửi form. ThemeSwitch: `<html>` đổi thuộc tính, hai trang cùng gốc đồng bộ qua `storage`, icon đúng trước khi hydrate với `ThemeScript`. UserMenu: phím của menu, đầu menu không nhận focus |
-| 3 | Accessibility (axe) | Chạy sau play function, ở mọi story. Story của AppShell bật lại các quy tắc trang (`region`, `landmark-one-main`, `landmark-unique`, `bypass`) mà `preview.tsx` tắt cho story component. Đặc biệt: `list` và `listitem` (Nav), `aria-allowed-attr`, `nested-interactive` (nút xoá trong khung ô), `aria-dialog-name` (tấm trượt), `button-name` |
+| 3 | Accessibility (axe) | Chạy sau play function, ở mọi story. Story của AppShell bật lại các quy tắc trang (`region`, `landmark-one-main`, `landmark-unique`, `bypass`) mà `preview.tsx` tắt cho story component (`region` bỏ hai chỗ (phát hiện khi lập Plan A): skip link, vì trang Storybook có link trước nó nên axe không coi nó là link đầu trang; và hàng đầu của sidebar, nơi S1 màn rộng vẽ brand: sidebar không phải landmark, nên brand ở đó nằm ngoài mọi landmark, còn ở màn hẹp nó nằm trong banner). Đặc biệt: `list` và `listitem` (Nav), `aria-allowed-attr`, `nested-interactive` (nút xoá trong khung ô), `aria-dialog-name` (tấm trượt), `button-name` |
 | 4 | Tương phản | Các cặp mới ở §4.4, cả chế độ mặc định lẫn `prefers-contrast: more` |
 | 5 | Visual regression | Mỗi phương án đã chọn một story vẽ lại đúng các trạng thái của mockup, ở 4 chế độ × light/dark (danh sách bên dưới) |
 | 6 | Screen reader (thủ công) | NVDA và VoiceOver (macOS, iOS): skip link; landmark; tấm trượt được đọc là hộp thoại "Navigation", và **vùng toast vẫn được đọc khi tấm mở** (kiểm lại quyết định không dùng `aria-modal`, §3.4); `aria-current` của mục nav; tên của mục ở rail (nhãn và số), flyout; trigger hai việc; ThemeSwitch (tên và gợi ý), ThemeMenuGroup; đầu menu của UserMenu được đọc khi mở; tên của chuông có số chưa đọc; SearchField: tên, phím tắt, nút xoá |
@@ -945,7 +952,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 | Rủi ro | Cách xử lý |
 |---|---|
 | `100dvh` trên iOS: chiều cao đổi khi thanh công cụ của Safari hiện hay ẩn, sidebar dính giật theo | Chỉ sidebar ở màn rộng (≥ 768px, iPad) và `min-height` của gốc dùng `dvh`; tấm trượt dùng `top: 0; bottom: 0`, không dùng `dvh`. Lớp 2 chạy trên WebKit; lớp 6 trên iPad thật nếu có. Nếu giật rõ, đổi `max-height` của sidebar sang `100svh` (để một dải trống khi thanh công cụ ẩn) và ghi trong mô tả PR |
-| Phần tử dính trong lưới không dính (bị giữ trong ô của nó) | Header trải qua mọi hàng của cột mình, sidebar `stretch` với `max-height` (§3.3). Lớp 2 kiểm cả hai bố cục ở ba engine, có và không có footer |
+| Phần tử dính trong lưới không dính (bị giữ trong ô của nó), hay dính mà không dừng ở footer | Header trải qua mọi hàng của cột mình; tấm kính của sidebar là con của ô lưới, vì phần tử dính bị giữ bởi cha chứ không bởi ô (§3.3). Lớp 2 kiểm cả hai bố cục ở ba engine, có và không có footer, kể cả việc footer đẩy sidebar S2 lên ở cuối trang |
 | `inert` và header dính, `backdrop-filter` | `inert` không đổi bố cục; lớp nền phủ lên header. Lớp 2 kiểm không bấm được, không Tab tới header khi tấm mở. `inert` qua thuộc tính DOM vì React 18.3 và 19 khác nhau (§3.4) |
 | Không có `aria-modal`: một screen reader có thể vẫn cho duyệt ra ngoài tấm | Phần còn lại thật sự `inert`, nên nó không ở trong cây truy cập. Lớp 6 kiểm cả việc toast được đọc khi tấm mở; nếu một tổ hợp cho duyệt ra ngoài mà toast vẫn được đọc với `aria-modal`, plan đổi lại và ghi trong mô tả PR |
 | `Toaster` đặt trong main thì bị `inert` khi tấm mở | Docs, `devWarn` (§5), ví dụ và fixture đặt nó ngoài `AppShell` |
diff --git a/scripts/build-theme.ts b/scripts/build-theme.ts
index 6cc054d..e32a068 100644
--- a/scripts/build-theme.ts
+++ b/scripts/build-theme.ts
@@ -1,8 +1,10 @@
 import { mkdirSync, writeFileSync } from 'node:fs';
+import { buildAppShellCss } from './lib/app-shell-css';
 import { buildSimulateCss, buildThemeCss } from './lib/theme-css';
 
 const outDir = 'src/styles/generated';
 mkdirSync(outDir, { recursive: true });
 writeFileSync(`${outDir}/theme.css`, buildThemeCss());
 writeFileSync(`${outDir}/simulate.css`, buildSimulateCss());
-console.log(`Wrote ${outDir}/theme.css and ${outDir}/simulate.css`);
+writeFileSync(`${outDir}/app-shell.css`, buildAppShellCss());
+console.log(`Wrote ${outDir}/theme.css, ${outDir}/simulate.css and ${outDir}/app-shell.css`);
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index bf4baed..6ce5e85 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -168,8 +168,35 @@ const SHIPPED_CLASSES = [
   'flg-table-sort',
   'flg-table-sort-static',
   'flg-table-sort-icon',
+  'flg-app-shell',
+  'flg-app-shell-header',
+  'flg-app-shell-header-brand',
+  'flg-app-shell-sidebar',
+  'flg-app-shell-sidebar-panel',
+  'flg-app-shell-sidebar-head',
+  'flg-app-shell-sidebar-body',
+  'flg-app-shell-main',
+  'flg-app-shell-footer',
+  'flg-app-shell-skip',
+  'flg-app-shell-brand',
+  'flg-app-shell-brand-logo',
+  'flg-app-shell-brand-name',
 ];
 
+// The wide-screen rules of the AppShell are generated, one `@media` block per breakpoint (spec phase 5
+// §3.3); Lightning CSS may write `(min-width: 768px)` as `(width >= 768px)`. Each block must be there
+// and must hold the rules of its own `data-breakpoint`, the first of which is the grid with a sidebar.
+const APP_SHELL_BLOCKS: Array<[string, boolean]> = Object.entries({
+  md: 768,
+  lg: 1024,
+  xl: 1280,
+}).map(([name, width]): [string, boolean] => [
+  `ships the AppShell rules of a wide screen for breakpoint ${name} (${width}px)`,
+  new RegExp(
+    `@media\\s*\\((?:min-width:\\s*${width}px|width\\s*>=\\s*${width}px)\\)\\s*\\{[\\s\\S]*?\\.flg-app-shell\\[data-breakpoint=["']?${name}["']?\\]`,
+  ).test(css),
+]);
+
 const requirements: Array<[string, boolean]> = [
   ['no unresolved @import', !css.includes('@import')],
   ['declares the flg layers in order', inOrder],
@@ -181,6 +208,12 @@ const requirements: Array<[string, boolean]> = [
     new RegExp(`\\.${name}(?![\\w-])`).test(css),
   ]),
   ['does not ship the Storybook simulation', !css.includes('data-flg-simulate')],
+  ...APP_SHELL_BLOCKS,
+  [
+    'ships the document rules of the AppShell (scroll padding under the header, no body margin)',
+    /scroll-padding-top:\s*var\(--flg-app-shell-header-offset/.test(css) &&
+      /body:has\(\.flg-app-shell\)/.test(css),
+  ],
 ];
 const failed = requirements.filter(([, ok]) => !ok);
 for (const [label, ok] of requirements) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
diff --git a/scripts/check-use-client.ts b/scripts/check-use-client.ts
index 7ab53aa..22e3c55 100644
--- a/scripts/check-use-client.ts
+++ b/scripts/check-use-client.ts
@@ -32,6 +32,7 @@ const CLIENT_MODULES: readonly string[] = [
   'src/components/pagination/Pagination.tsx',
   'src/components/progress/Progress.tsx',
   'src/components/table/Table.tsx',
+  'src/components/app-shell/AppShell.tsx',
   'src/components/calendar/Calendar.tsx',
   'src/components/date-picker/DatePicker.tsx',
   'src/components/file-upload/FileUpload.tsx',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 9d91808..fa79cc1 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -27,8 +27,9 @@ const D = {
   2: {
     description:
       'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
-      'step, on a row of a List, on the sort button and the scroll frame of a Table, and on an ' +
-      'invalid Input or Textarea, whose border stays red while focused',
+      'step, on a row of a List, on the sort button and the scroll frame of a Table, on the link of ' +
+      'an AppShellBrand and the skip link of an AppShell, and on an invalid Input or Textarea, ' +
+      'whose border stays red while focused',
     criterion: '1.4.11',
   },
   3: {
@@ -53,7 +54,7 @@ const D = {
       'Progress `thin`, in a Stepper the number, title and description of a step not reached, the ' +
       'description of every step and the "Step N" line of a step not reached, in a List the ' +
       'description and the end cell of a row, and in a Table `striped` and `minimal` the column ' +
-      'headings and the icon of a column that is not sorted',
+      'headings and the icon of a column that is not sorted, and the text of an AppShell footer',
     criterion: '1.4.3',
   },
   7: {
diff --git a/scripts/lib/app-shell-css.ts b/scripts/lib/app-shell-css.ts
new file mode 100644
index 0000000..f7a34eb
--- /dev/null
+++ b/scripts/lib/app-shell-css.ts
@@ -0,0 +1,138 @@
+/**
+ * The rules of the AppShell for a wide screen (spec phase 5 §3.3), written once and generated for
+ * each breakpoint. A media query cannot read a variable, so `breakpoint="md" | "lg" | "xl"` cannot
+ * be one rule: each breakpoint gets its own `@media (min-width: …)` block, picked by the
+ * `data-breakpoint` of the root. There is one boundary per breakpoint and the narrow screen is the
+ * base (src/styles/components/app-shell.css), so no width falls between two rules.
+ */
+export const APP_SHELL_BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 } as const;
+export type AppShellBreakpointName = keyof typeof APP_SHELL_BREAKPOINTS;
+
+/** The height of the header and of the first row of the grid on a wide screen. */
+const HEADER_HEIGHT = '60px';
+
+const HEADER = '.flg-app-shell-header';
+const SIDEBAR = '.flg-app-shell-sidebar';
+const PANEL = '.flg-app-shell-sidebar-panel';
+const MAIN = '.flg-app-shell-main';
+const FOOTER = '.flg-app-shell-footer';
+
+/**
+ * The rules for one breakpoint, without indentation. They are in the order the cascade needs: each
+ * rule that must win over an earlier one is more specific than it, or later.
+ */
+export function wideRules(breakpoint: AppShellBreakpointName): string {
+  const shell = `.flg-app-shell[data-breakpoint='${breakpoint}']`;
+  const sidebarLayout = `${shell}[data-layout='sidebar']`;
+  const headerLayout = `${shell}[data-layout='header']`;
+  // A shell without a sidebar is one column; the `[data-layout]` keeps these above the layout rules.
+  const noSidebar = `${shell}[data-layout]:not(:has(> ${SIDEBAR}))`;
+  return `${shell} {
+  --flg-app-shell-header-height: ${HEADER_HEIGHT};
+  grid-template-columns: var(--flg-app-shell-sidebar-width) minmax(0, 1fr);
+}
+${shell}:not(:has(> ${HEADER})) {
+  --flg-app-shell-header-height: 0px;
+}
+${shell} > ${HEADER} {
+  gap: 8px;
+  padding: 0 16px;
+}
+${shell} > ${MAIN} {
+  grid-column: 2;
+  padding: 28px 32px;
+}
+${shell} > ${SIDEBAR} {
+  grid-column: 1;
+  display: block;
+  align-self: stretch;
+  z-index: 2;
+}
+${shell} > ${SIDEBAR} > ${PANEL} {
+  position: sticky;
+}
+
+/* S1: the sidebar owns the left edge from top to bottom; the header and the footer sit over the
+   content column. The brand is the sidebar's, and its head is as tall as the header. */
+${sidebarLayout} > ${HEADER} {
+  grid-column: 2;
+}
+${sidebarLayout} > ${HEADER} > .flg-app-shell-header-brand {
+  display: none;
+}
+${sidebarLayout} > ${SIDEBAR} {
+  grid-row: 1 / -1;
+}
+${sidebarLayout} > ${SIDEBAR} > ${PANEL} {
+  top: 0;
+  max-height: 100dvh;
+}
+${sidebarLayout} > ${SIDEBAR} > ${PANEL} > .flg-app-shell-sidebar-head {
+  height: ${HEADER_HEIGHT};
+  padding: 0 20px;
+}
+${sidebarLayout} > ${FOOTER} {
+  grid-column: 2;
+  padding: 0 32px;
+}
+
+/* S2: the header owns the top edge and the footer the bottom edge; the sidebar sits between them,
+   and the footer pushes it up at the end of the page. The brand is the header's, in a cell as wide
+   as the head of a sidebar and the button that folds it, so what follows starts at the edge of the
+   content of main. */
+${headerLayout} > ${HEADER} {
+  grid-column: 1 / -1;
+}
+${headerLayout} > ${HEADER} > .flg-app-shell-header-brand {
+  flex: none;
+  width: 268px;
+}
+${headerLayout} > ${SIDEBAR} {
+  grid-row: 2;
+}
+${headerLayout} > ${SIDEBAR} > ${PANEL} {
+  top: var(--flg-app-shell-header-height);
+  max-height: calc(100dvh - var(--flg-app-shell-header-height));
+}
+${headerLayout} > ${SIDEBAR} > ${PANEL} > .flg-app-shell-sidebar-head {
+  display: none;
+}
+${headerLayout} > ${FOOTER} {
+  grid-column: 1 / -1;
+  z-index: 3;
+  padding: 0 20px;
+}
+
+${noSidebar} {
+  grid-template-columns: minmax(0, 1fr);
+}
+${noSidebar} > :is(${HEADER}, ${MAIN}, ${FOOTER}) {
+  grid-column: 1;
+}
+
+/* The padding of the page keeps what is scrolled to clear of the header; 60px is what a header is
+   before the shell has measured it. */
+:root:has(${shell} > ${HEADER}) {
+  scroll-padding-top: var(--flg-app-shell-header-offset, ${HEADER_HEIGHT});
+}`;
+}
+
+const indent = (text: string) =>
+  text
+    .split('\n')
+    .map((line) => (line === '' ? line : `  ${line}`))
+    .join('\n');
+
+/** The whole of `src/styles/generated/app-shell.css`. */
+export function buildAppShellCss(): string {
+  const blocks = (Object.keys(APP_SHELL_BREAKPOINTS) as AppShellBreakpointName[]).map(
+    (name) =>
+      `@media (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(wideRules(name))}\n}`,
+  );
+  return `/* The wide-screen rules of the AppShell, one block per breakpoint. Generated by scripts/build-theme.ts
+   from scripts/lib/app-shell-css.ts; do not edit. */
+@layer flg.components {
+${indent(blocks.join('\n'))}
+}
+`;
+}
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index 23e0e18..ca164ce 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -166,6 +166,29 @@ const CASES = [
     element: (C) => createElement(C, null, 'x'),
     expect: { type: 'div', className: 'flg-alert-actions' },
   },
+  // The brand goes into a layout that is a Server Component, so it must render without a hook.
+  {
+    label: 'AppShellBrand with href',
+    file: '../dist/components/app-shell/AppShellBrand.js',
+    exportName: 'AppShellBrand',
+    element: (C) => createElement(C, { name: 'Lumen', logo: 'L', href: '/' }),
+    expect: { type: 'a', className: 'flg-app-shell-brand' },
+  },
+  {
+    label: 'AppShellBrand without href',
+    file: '../dist/components/app-shell/AppShellBrand.js',
+    exportName: 'AppShellBrand',
+    element: (C) => createElement(C, { name: 'Lumen' }),
+    expect: { type: 'span', className: 'flg-app-shell-brand' },
+  },
+  {
+    label: 'AppShellBrand asChild',
+    file: '../dist/components/app-shell/AppShellBrand.js',
+    exportName: 'AppShellBrand',
+    element: (C) =>
+      createElement(C, { name: 'Lumen', asChild: true }, createElement('a', { href: '/home' })),
+    expect: { type: 'a', className: 'flg-app-shell-brand' },
+  },
   ...['rect', 'circle', 'text'].map((shape) => ({
     label: `Skeleton ${shape}`,
     file: '../dist/components/skeleton/Skeleton.js',
diff --git a/src/components/app-shell/AppShell.tsx b/src/components/app-shell/AppShell.tsx
new file mode 100644
index 0000000..68f7734
--- /dev/null
+++ b/src/components/app-shell/AppShell.tsx
@@ -0,0 +1,221 @@
+'use client';
+
+import { clsx } from 'clsx';
+import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
+import type { HTMLAttributes, ReactNode } from 'react';
+import { hasContent } from '../../internal/has-content';
+import { mergeRefs } from '../../internal/merge-refs';
+import { devWarn } from '../../internal/warn';
+import { withDefaults } from '../../internal/with-defaults';
+import { AppShellContext, PART_NAMES, useAppShellPart } from './app-shell-context';
+import type {
+  AppShellBreakpoint,
+  AppShellContextValue,
+  AppShellLabels,
+  AppShellLayout,
+  AppShellPart,
+} from './app-shell-context';
+import { useHeaderOffset } from './use-header-offset';
+
+export type { AppShellBreakpoint, AppShellLabels, AppShellLayout } from './app-shell-context';
+
+export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
+  /** Where the sidebar and the header sit: the sidebar runs the full height, or the header the full width. */
+  layout?: AppShellLayout;
+  /** The width from which the sidebar is in the grid: `md` 768px, `lg` 1024px, `xl` 1280px. */
+  breakpoint?: AppShellBreakpoint;
+  /** Drawn at the head of the header and of the sidebar; `AppShellBrand` is made for it. */
+  brand?: ReactNode;
+  /** Default English words; any of them can be replaced. */
+  labels?: Partial<AppShellLabels>;
+};
+export type AppShellHeaderProps = HTMLAttributes<HTMLElement>;
+export type AppShellSidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>;
+export type AppShellMainProps = Omit<HTMLAttributes<HTMLElement>, 'id'>;
+export type AppShellFooterProps = HTMLAttributes<HTMLElement>;
+
+const DEFAULT_LABELS: AppShellLabels = {
+  skipToContent: 'Skip to content',
+};
+
+// A value outside the union is a mistake of a caller that TypeScript did not see (plain JavaScript,
+// a value read from a cookie): it gets the default look, as every prop of the library does.
+const toLayout = (layout: unknown): AppShellLayout => (layout === 'header' ? 'header' : 'sidebar');
+const toBreakpoint = (breakpoint: unknown): AppShellBreakpoint =>
+  breakpoint === 'md' || breakpoint === 'xl' ? breakpoint : 'lg';
+
+/**
+ * The frame of an application: a header, a sidebar, the main content and a footer, laid out on a
+ * grid by CSS alone, so the HTML from the server is right at every width. The page scrolls with the
+ * document, the header and the sidebar stick. The parts are its direct children, in any order.
+ * Beside the layout it gives the page two rules of its own, on pages that render it: the margin of
+ * `<body>` is dropped, and the height of the header is written on `<html>` so that what is scrolled
+ * to is not left under it (see the docs).
+ */
+export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
+  { layout, breakpoint, brand, labels, className, children, ...props },
+  ref,
+) {
+  const rootRef = useRef<HTMLDivElement>(null);
+  const mainId = useId();
+  const sidebarId = useId();
+  const [header, setHeader] = useState<HTMLElement | null>(null);
+  const parts = useRef(new Map<AppShellPart, Set<HTMLElement>>());
+  const shellLayout = toLayout(layout);
+  const shellBreakpoint = toBreakpoint(breakpoint);
+  const words = useMemo(() => withDefaults(DEFAULT_LABELS, labels), [labels]);
+  useHeaderOffset(header);
+
+  const registerPart = useCallback((part: AppShellPart, element: HTMLElement) => {
+    const elements = parts.current.get(part) ?? new Set<HTMLElement>();
+    parts.current.set(part, elements);
+    elements.add(element);
+    const name = PART_NAMES[part];
+    if (elements.size > 1) devWarn(`<AppShell> has more than one <${name}>.`);
+    // The parts are cells of the grid of the shell, so an element around one takes its place.
+    if (element.parentElement !== rootRef.current) {
+      devWarn(
+        `<${name}> must be a direct child of <AppShell>: a component around it is fine, an element around it is not.`,
+      );
+    }
+    return () => {
+      elements.delete(element);
+    };
+  }, []);
+
+  // The parts register in their own effects, which run before this one.
+  useEffect(() => {
+    if (!parts.current.get('main')?.size) {
+      devWarn('<AppShell> has no <AppShellMain>: the skip link has nowhere to go.');
+    }
+  }, []);
+
+  const context = useMemo<AppShellContextValue>(
+    () => ({
+      layout: shellLayout,
+      breakpoint: shellBreakpoint,
+      labels: words,
+      brand,
+      mainId,
+      sidebarId,
+      registerPart,
+      setHeader,
+    }),
+    [shellLayout, shellBreakpoint, words, brand, mainId, sidebarId, registerPart],
+  );
+  const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
+
+  return (
+    <AppShellContext.Provider value={context}>
+      <div
+        ref={mergedRef}
+        className={clsx('flg-app-shell', className)}
+        data-layout={shellLayout}
+        data-breakpoint={shellBreakpoint}
+        {...props}
+      >
+        <a className="flg-app-shell-skip flg-visually-hidden" href={`#${mainId}`}>
+          {words.skipToContent}
+        </a>
+        {children}
+      </div>
+    </AppShellContext.Provider>
+  );
+});
+
+/**
+ * The banner of the page, sticky at the top. The brand comes first, then what the caller puts in it.
+ * Where the sidebar runs the full height, the brand is in the sidebar on a wide screen and not here.
+ */
+export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(function AppShellHeader(
+  { className, children, ...props },
+  ref,
+) {
+  const own = useRef<HTMLElement>(null);
+  const context = useAppShellPart('header', own);
+  const setHeader = context?.setHeader;
+  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own, setHeader), [ref, setHeader]);
+  return (
+    <header
+      ref={mergedRef}
+      className={clsx('flg-surface flg-app-shell-header', className)}
+      {...props}
+    >
+      {hasContent(context?.brand) ? (
+        <span className="flg-app-shell-header-brand">{context?.brand}</span>
+      ) : null}
+      {children}
+    </header>
+  );
+});
+
+/**
+ * The navigation column. It is not a landmark; the `Nav` inside it is. The element is the cell of the
+ * grid and has no look of its own: the glass is the panel in it, which is the part that sticks. A
+ * sticky box is held by the content box of its parent, not by the grid area it sits in, so a panel
+ * that was the cell itself could not be stopped by the footer at the end of the page; in a parent
+ * that fills the cell it is. The body of the panel scrolls on its own when its content is taller
+ * than the screen.
+ */
+export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
+  function AppShellSidebar({ className, children, ...props }, ref) {
+    const own = useRef<HTMLDivElement>(null);
+    const context = useAppShellPart('sidebar', own);
+    const fallbackId = useId();
+    const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
+    return (
+      <div
+        ref={mergedRef}
+        className={clsx('flg-app-shell-sidebar', className)}
+        {...props}
+        id={context?.sidebarId ?? fallbackId}
+      >
+        <div className="flg-surface flg-app-shell-sidebar-panel">
+          <div className="flg-app-shell-sidebar-head">{context?.brand}</div>
+          <div className="flg-app-shell-sidebar-body">{children}</div>
+        </div>
+      </div>
+    );
+  },
+);
+
+/** The content of the page, and the place the skip link goes to. */
+export const AppShellMain = forwardRef<HTMLElement, AppShellMainProps>(function AppShellMain(
+  { className, children, ...props },
+  ref,
+) {
+  const own = useRef<HTMLElement>(null);
+  const context = useAppShellPart('main', own);
+  const fallbackId = useId();
+  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own), [ref]);
+  return (
+    <main
+      ref={mergedRef}
+      className={clsx('flg-app-shell-main', className)}
+      tabIndex={-1}
+      {...props}
+      id={context?.mainId ?? fallbackId}
+    >
+      {children}
+    </main>
+  );
+});
+
+/** The strip at the foot of the page. */
+export const AppShellFooter = forwardRef<HTMLElement, AppShellFooterProps>(function AppShellFooter(
+  { className, children, ...props },
+  ref,
+) {
+  const own = useRef<HTMLElement>(null);
+  useAppShellPart('footer', own);
+  const mergedRef = useMemo(() => mergeRefs<HTMLElement>(ref, own), [ref]);
+  return (
+    <footer
+      ref={mergedRef}
+      className={clsx('flg-surface flg-app-shell-footer', className)}
+      {...props}
+    >
+      {children}
+    </footer>
+  );
+});
diff --git a/src/components/app-shell/AppShellBrand.tsx b/src/components/app-shell/AppShellBrand.tsx
new file mode 100644
index 0000000..22b7bf9
--- /dev/null
+++ b/src/components/app-shell/AppShellBrand.tsx
@@ -0,0 +1,70 @@
+import { clsx } from 'clsx';
+import { cloneElement, forwardRef, isValidElement } from 'react';
+import type { HTMLAttributes, ReactNode, Ref } from 'react';
+import { hasContent } from '../../internal/has-content';
+import { resolveLazy } from '../../internal/react-lazy';
+import { Slot } from '../../internal/slot';
+
+type AppShellBrandOwnProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
+  /** A mark, drawn before the name; it is decoration, so it is hidden from assistive technology. */
+  logo?: ReactNode;
+  /** The name of the application: the text of the link. */
+  name: ReactNode;
+};
+
+export type AppShellBrandProps = AppShellBrandOwnProps &
+  (
+    | { href?: string; asChild?: false; children?: never }
+    | {
+        href?: never;
+        /** Render the single child element (a router's `Link`, say) with the logo and the name in it. */
+        asChild: true;
+        children: ReactNode;
+      }
+  );
+
+/**
+ * The mark and the name of the application, a link to its home when it has an `href`. Safe to render
+ * in React Server Components. Give it to `AppShell` as `brand`, which draws it twice (the header and
+ * the sidebar) and shows one: so it must not carry an `id`.
+ */
+export const AppShellBrand = forwardRef<HTMLElement, AppShellBrandProps>(function AppShellBrand(
+  { logo, name, href, asChild = false, className, children, ...props },
+  ref,
+) {
+  const classes = clsx('flg-app-shell-brand', className);
+  const content = (
+    <>
+      {hasContent(logo) ? (
+        <span className="flg-app-shell-brand-logo" aria-hidden="true">
+          {logo}
+        </span>
+      ) : null}
+      <span className="flg-app-shell-brand-name">{name}</span>
+    </>
+  );
+  if (asChild) {
+    // A Server Component can pass the child as a lazy reference, which says nothing about the
+    // element until it is resolved.
+    const element = resolveLazy(children);
+    return (
+      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props}>
+        {isValidElement<{ children?: ReactNode }>(element)
+          ? cloneElement(element, undefined, content)
+          : element}
+      </Slot>
+    );
+  }
+  if (href !== undefined) {
+    return (
+      <a ref={ref as Ref<HTMLAnchorElement>} className={classes} href={href} {...props}>
+        {content}
+      </a>
+    );
+  }
+  return (
+    <span ref={ref as Ref<HTMLSpanElement>} className={classes} {...props}>
+      {content}
+    </span>
+  );
+});
diff --git a/src/components/app-shell/app-shell-context.ts b/src/components/app-shell/app-shell-context.ts
new file mode 100644
index 0000000..e265525
--- /dev/null
+++ b/src/components/app-shell/app-shell-context.ts
@@ -0,0 +1,63 @@
+import { createContext, useContext, useEffect } from 'react';
+import type { ReactNode, RefObject } from 'react';
+import { devWarn } from '../../internal/warn';
+
+export type AppShellLayout = 'sidebar' | 'header';
+export type AppShellBreakpoint = 'md' | 'lg' | 'xl';
+
+/** The words an AppShell says; translate them here. */
+export interface AppShellLabels {
+  /** The text of the skip link, the first thing a keyboard reaches. */
+  skipToContent: string;
+}
+
+/** The parts the shell lays out; each of them is a cell of its grid. */
+export type AppShellPart = 'header' | 'sidebar' | 'main' | 'footer';
+
+export const PART_NAMES: Record<AppShellPart, string> = {
+  header: 'AppShellHeader',
+  sidebar: 'AppShellSidebar',
+  main: 'AppShellMain',
+  footer: 'AppShellFooter',
+};
+
+/** What the shell hands to its parts: the ids they point at, the brand to draw, and the registry. */
+export interface AppShellContextValue {
+  layout: AppShellLayout;
+  breakpoint: AppShellBreakpoint;
+  labels: AppShellLabels;
+  /** Drawn twice, at the head of the header and at the head of the sidebar; CSS shows one. */
+  brand: ReactNode;
+  mainId: string;
+  sidebarId: string;
+  /** Tells the shell that a part is mounted, for the dev warnings; returns the way to take it back. */
+  registerPart: (part: AppShellPart, element: HTMLElement) => () => void;
+  /** The header element, which the shell measures; `null` when there is none. */
+  setHeader: (element: HTMLElement | null) => void;
+}
+
+export const AppShellContext = createContext<AppShellContextValue | null>(null);
+
+/**
+ * Registers a part with the shell once it is mounted, or warns that it is not inside one. A part
+ * outside an `AppShell` still renders: it is only a misuse, and the library does not throw on those.
+ */
+export function useAppShellPart(
+  part: AppShellPart,
+  ref: RefObject<HTMLElement | null>,
+): AppShellContextValue | null {
+  const context = useContext(AppShellContext);
+  // The function, not the context, is the dependency: the context changes with every `brand` and
+  // `labels` of the caller, and the registry should not be told each time.
+  const register = context?.registerPart;
+  useEffect(() => {
+    const element = ref.current;
+    if (!element) return undefined;
+    if (!register) {
+      devWarn(`<${PART_NAMES[part]}> must be rendered inside <AppShell>.`);
+      return undefined;
+    }
+    return register(part, element);
+  }, [register, part, ref]);
+  return context;
+}
diff --git a/src/components/app-shell/index.ts b/src/components/app-shell/index.ts
new file mode 100644
index 0000000..7836770
--- /dev/null
+++ b/src/components/app-shell/index.ts
@@ -0,0 +1,19 @@
+export {
+  AppShell,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+} from './AppShell';
+export type {
+  AppShellBreakpoint,
+  AppShellFooterProps,
+  AppShellHeaderProps,
+  AppShellLabels,
+  AppShellLayout,
+  AppShellMainProps,
+  AppShellProps,
+  AppShellSidebarProps,
+} from './AppShell';
+export { AppShellBrand } from './AppShellBrand';
+export type { AppShellBrandProps } from './AppShellBrand';
diff --git a/src/components/app-shell/use-header-offset.ts b/src/components/app-shell/use-header-offset.ts
new file mode 100644
index 0000000..d0184c2
--- /dev/null
+++ b/src/components/app-shell/use-header-offset.ts
@@ -0,0 +1,39 @@
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
+
+/** The custom property of `<html>` that holds the height of the sticky header. */
+export const HEADER_OFFSET_PROPERTY = '--flg-app-shell-header-offset';
+
+/**
+ * Hands the measured height of the header to the document, as a custom property its scroll padding
+ * is taken from: a sticky header covers the top of the viewport, so a control focused from below, an
+ * `#anchor` or a find-in-page hit would land under it (WCAG 2.4.11). A header is as tall as what is
+ * in it, and the stylesheet only knows the height of an empty one, so it is measured. The property
+ * is set on the element and not through React, so a render has nothing to reconcile and a `style` of
+ * the caller's on `<html>` is left alone, and only when the height changes. Where there is no
+ * ResizeObserver, as in jsdom, nothing is written and the stylesheet's own 56px or 60px stays.
+ * The header is an element and not a ref, so that a header that mounts after the shell is measured
+ * too.
+ */
+export function useHeaderOffset(header: HTMLElement | null): void {
+  useIsoLayoutEffect(() => {
+    if (!header || typeof ResizeObserver === 'undefined') return undefined;
+    const root = document.documentElement;
+    let written: number | undefined;
+    const measure = (entries: ResizeObserverEntry[] = []) => {
+      // The size the observer reports is the layout one and keeps fractions; where an entry has no
+      // border-box size the layout height is read, which is whole pixels.
+      const entry = entries.find((candidate) => candidate.target === header);
+      const height = entry?.borderBoxSize?.[0]?.blockSize ?? header.offsetHeight;
+      if (height === written) return;
+      written = height;
+      root.style.setProperty(HEADER_OFFSET_PROPERTY, `${height}px`);
+    };
+    const observer = new ResizeObserver(measure);
+    observer.observe(header);
+    measure();
+    return () => {
+      observer.disconnect();
+      root.style.removeProperty(HEADER_OFFSET_PROPERTY);
+    };
+  }, [header]);
+}
diff --git a/src/index.ts b/src/index.ts
index ff2bfb3..4ba2db0 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -258,3 +258,22 @@ export type {
   ToasterLabels,
   ToasterProps,
 } from './components/toast';
+export {
+  AppShell,
+  AppShellBrand,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+} from './components/app-shell';
+export type {
+  AppShellBrandProps,
+  AppShellBreakpoint,
+  AppShellFooterProps,
+  AppShellHeaderProps,
+  AppShellLabels,
+  AppShellLayout,
+  AppShellMainProps,
+  AppShellProps,
+  AppShellSidebarProps,
+} from './components/app-shell';
diff --git a/src/styles/components/app-shell.css b/src/styles/components/app-shell.css
new file mode 100644
index 0000000..cb4ec0f
--- /dev/null
+++ b/src/styles/components/app-shell.css
@@ -0,0 +1,198 @@
+/* AppShell (spec phase 5 §3.3, §4.3; mockup S1, S2): the frame of an application. This file is the
+   narrow screen and what every width shares; the rules of a wide screen (the grid with a sidebar,
+   the sticky sidebar, the paddings) are written once in scripts/lib/app-shell-css.ts and generated,
+   one `@media (min-width: …)` per breakpoint, into generated/app-shell.css, which comes after this
+   file. The narrow screen is the base so that no width falls between two rules.
+   The parts are cells of one grid and are placed by line numbers, not by area names: a sticky
+   element never leaves its grid area, so the header runs through every row of its column and the
+   page can scroll under it. The first row is always as tall as the header, so main starts below it. */
+@layer flg.components {
+  .flg-app-shell {
+    /* Measures of the frame, not tokens of the theme: a caller changes them through `style`. */
+    --flg-app-shell-sidebar-width: 264px;
+    --flg-app-shell-rail-width: 68px;
+    --flg-app-shell-drawer-width: 300px;
+    --flg-app-shell-header-height: 56px;
+    box-sizing: border-box;
+    display: grid;
+    grid-template-columns: minmax(0, 1fr);
+    grid-template-rows: var(--flg-app-shell-header-height) 1fr auto;
+    min-height: 100dvh;
+    isolation: isolate;
+    color: var(--flg-text);
+    font-family: var(--flg-font-sans);
+  }
+  /* No header: the first row has nothing to hold. */
+  .flg-app-shell:not(:has(> .flg-app-shell-header)) {
+    --flg-app-shell-header-height: 0px;
+  }
+
+  /* The header: a pane of glass whose edges at the border of the screen are dropped (the mockup
+     hides them with a negative margin, which at the right edge makes the page scroll sideways). */
+  .flg-app-shell-header {
+    grid-column: 1;
+    grid-row: 1 / -1;
+    align-self: start;
+    position: sticky;
+    top: 0;
+    z-index: 3;
+    display: flex;
+    align-items: center;
+    gap: 4px;
+    min-width: 0;
+    min-height: var(--flg-app-shell-header-height);
+    padding: 0 10px;
+    border-radius: 0;
+    border-top-width: 0;
+    border-right-width: 0;
+    border-left-width: 0;
+  }
+  /* An icon-only button in the header has an icon of 18px, as in the mockup; one inside a popover or
+     dialog opened from it is not part of the bar. */
+  .flg-app-shell-header .flg-button[data-icon-only]:not(:is([popover], dialog) *) {
+    --flg-button-icon: 18px;
+  }
+  /* A ghost button that has a popup open keeps the fill of its hover, as the bell does with the
+     notifications open. */
+  .flg-app-shell-header .flg-button[data-variant='ghost'][aria-haspopup][aria-expanded='true'] {
+    background: var(--flg-control-track);
+  }
+  .flg-app-shell-header-brand {
+    display: inline-flex;
+    min-width: 0;
+  }
+
+  /* The sidebar is the cell of the grid, with no look of its own; the glass is its panel, the part
+     that sticks (a sticky box is held by its parent, which here fills the cell). */
+  .flg-app-shell-sidebar {
+    display: none;
+    min-width: 0;
+    min-height: 0;
+  }
+  .flg-app-shell-sidebar-panel {
+    display: flex;
+    flex-direction: column;
+    box-sizing: border-box;
+    height: 100%;
+    min-width: 0;
+    min-height: 0;
+    overflow: hidden;
+    border-radius: 0;
+    border-top-width: 0;
+    border-bottom-width: 0;
+    border-left-width: 0;
+  }
+  .flg-app-shell-sidebar-head {
+    flex: none;
+    display: flex;
+    align-items: center;
+    gap: 8px;
+    box-sizing: border-box;
+    height: 56px;
+    padding: 0 10px;
+  }
+  .flg-app-shell-sidebar-body {
+    flex: 1;
+    min-height: 0;
+    display: flex;
+    flex-direction: column;
+    overflow-x: hidden;
+    overflow-y: auto;
+    overscroll-behavior: contain;
+  }
+
+  .flg-app-shell-main {
+    grid-column: 1;
+    grid-row: 2;
+    min-width: 0;
+    padding: 20px 16px;
+    /* The target of the skip link: a ring around all the content would help nobody. It has no
+       `scroll-margin-top` either, as the padding of the page already keeps it below the header. */
+    outline: none;
+  }
+
+  .flg-app-shell-footer {
+    grid-column: 1;
+    grid-row: 3;
+    display: flex;
+    align-items: center;
+    gap: 8px;
+    min-height: 44px;
+    padding: 0 16px;
+    border-radius: 0;
+    border-right-width: 0;
+    border-bottom-width: 0;
+    border-left-width: 0;
+    color: var(--flg-text-muted);
+    font-size: var(--flg-text-xs);
+  }
+  .flg-app-shell-footer a {
+    color: var(--flg-text);
+  }
+
+  /* The page of a shell is scrolled by the document. A sticky header covers the top of what is seen,
+     so what is scrolled to (a control focused from below, an #anchor, a find-in-page hit) is kept
+     clear of it: by the measured height of the header (AppShell writes it on <html>) and, until
+     there is one, by the height every header has. */
+  :root:has(.flg-app-shell > .flg-app-shell-header) {
+    scroll-padding-top: var(--flg-app-shell-header-offset, 56px);
+  }
+  /* The 8px margin of the browser would leave a band round a frame that touches the four edges, and
+     with the `min-height` of the frame make a short page scroll. Only on pages that have a shell. */
+  body:has(.flg-app-shell) {
+    margin: 0;
+  }
+
+  /* The skip link is out of sight until it has the focus. */
+  .flg-app-shell-skip:focus {
+    position: fixed;
+    top: 8px;
+    left: 8px;
+    z-index: 6;
+    width: auto;
+    height: auto;
+    margin: 0;
+    padding: 8px 12px;
+    overflow: visible;
+    clip-path: none;
+    white-space: normal;
+    border: 1px solid var(--flg-control-border);
+    border-radius: var(--flg-radius-md);
+    background: var(--flg-glass-tint-solid);
+    color: var(--flg-text);
+    font-size: var(--flg-text-sm);
+    font-weight: var(--flg-weight-semibold);
+    text-decoration: none;
+    box-shadow: var(--flg-glass-shadow), var(--flg-focus-ring);
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+  }
+
+  .flg-app-shell-brand {
+    display: inline-flex;
+    align-items: center;
+    gap: 9px;
+    min-width: 0;
+    color: var(--flg-text);
+    text-decoration: none;
+  }
+  .flg-app-shell-brand-logo {
+    flex: none;
+    display: inline-flex;
+  }
+  .flg-app-shell-brand-name {
+    min-width: 0;
+    overflow: hidden;
+    text-overflow: ellipsis;
+    white-space: nowrap;
+    font-size: var(--flg-text-md);
+    font-weight: var(--flg-weight-semibold);
+    letter-spacing: -0.01em;
+  }
+  a.flg-app-shell-brand:focus-visible {
+    border-radius: var(--flg-radius-md);
+    outline: 2px solid var(--flg-focus-outline-color);
+    outline-offset: 2px;
+    box-shadow: var(--flg-focus-ring);
+  }
+}
diff --git a/src/styles/index.css b/src/styles/index.css
index 1526b98..0b1c832 100644
--- a/src/styles/index.css
+++ b/src/styles/index.css
@@ -41,5 +41,7 @@
 @import './components/stepper.css';
 @import './components/list.css';
 @import './components/table.css';
+@import './components/app-shell.css';
+@import './generated/app-shell.css';
 @import './components/floating.css';
 @import './preferences.css';
diff --git a/src/styles/preferences.css b/src/styles/preferences.css
index dd35606..d7c0940 100644
--- a/src/styles/preferences.css
+++ b/src/styles/preferences.css
@@ -204,6 +204,13 @@
     .flg-divider {
       background: CanvasText;
     }
+    /* The skip link is a pane of its own once it shows, and its border is recoloured by the system. The
+       header, sidebar and footer of an AppShell take the `.flg-surface` rule above, and the edges they
+       drop stay dropped (spec phase 5 §4.5). */
+    .flg-app-shell-skip:focus {
+      border: 1px solid CanvasText;
+      background: Canvas;
+    }
     .flg-input {
       border-color: CanvasText;
     }
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/app-shell src/index.test.ts
pnpm vitest run --project unit --project unit-react18 src/docs
pnpm vitest run --project scripts
pnpm check:contrast
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
pnpm build && pnpm check:package
pnpm check:dist-css && pnpm check:rsc && pnpm check:publint && pnpm check:types && pnpm size
pnpm build-storybook
```

Expected:
- `pnpm gen:theme` in `Wrote src/styles/generated/theme.css, src/styles/generated/simulate.css and src/styles/generated/app-shell.css`.
- Unit: 111 test PASS (hai project React cộng lại, kể cả 4 test kiểu và `index.test.ts`), không lỗi kiểu. `src/docs`: 6 test PASS (`ExceptionTable` vẫn đòi 34 dòng).
- `scripts`: PASS, trong đó 6 test của `app-shell-css.test.ts`.
- `pnpm check:contrast`: PASS (`Contrast check passed.`). Không có check mới; các `known-exception` như trước.
- Story app-shell: 39 test PASS ở mỗi project (13 story × ba engine). axe chạy sau play function với các quy tắc trang, không có vi phạm.
- Story docs: 30 test PASS ở mỗi project; `Examples/Page stage` vẫn pass với `place-items: normal`. Ở task này bản nháp chỉ chạy `storybook-light`; ở đầu nhánh cả hai project pass.
- `pnpm build && pnpm check:package`: FAIL ở `check:use-client` (`dist/internal/use-media-query.js: missing build output`), như Task 1 (phát hiện 12).
- Các bước sau nó, chạy riêng: `check:dist-css` thấy 13 class `flg-app-shell*`, ba khối `@media` và hai quy tắc cho tài liệu; `check:rsc` in `ok` cho ba ca `AppShellBrand`; `check:publint`, `check:types` pass; `size` pass với JS 48.25 kB trên 51.71 kB, CSS 13.76 kB trên 14.05 kB. Không chạy `size:record`.
- `pnpm build-storybook`: PASS. Trong `storybook-static/index.json`, chỉ `Sidebar` và `Header` của AppShell không gắn `no-visual` (119 story có ảnh). Trang autodocs của `Components/AppShell` có ở task này; Task 5 thay nó bằng `AppShell.mdx`.
- AppShell là component mới, và các file dùng chung chỉ được thêm vào (phát hiện 15), nên ảnh chuẩn của component cũ giữ nguyên.

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/app-shell-demo.tsx \
  .storybook/stage.css \
  .storybook/viewport.ts \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/build-theme.ts \
  scripts/check-dist-css.ts \
  scripts/check-use-client.ts \
  scripts/contrast-exceptions.ts \
  scripts/lib/app-shell-css.test.ts \
  scripts/lib/app-shell-css.ts \
  scripts/rsc-probe.mjs \
  src/components/app-shell/AppShell.stories.tsx \
  src/components/app-shell/AppShell.test-d.ts \
  src/components/app-shell/AppShell.test.tsx \
  src/components/app-shell/AppShell.tsx \
  src/components/app-shell/AppShellBrand.test.tsx \
  src/components/app-shell/AppShellBrand.tsx \
  src/components/app-shell/app-shell-context.ts \
  src/components/app-shell/index.ts \
  src/components/app-shell/use-header-offset.test.tsx \
  src/components/app-shell/use-header-offset.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/app-shell.css \
  src/styles/index.css \
  src/styles/preferences.css
```
```bash
git commit -m "feat(app-shell): add AppShell, its parts and the two layouts" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: `AppShellSidebarTrigger`, rail và trạng thái mở

Spec §1 (dòng Nút trigger và brand trong header), §3.3 ("Thu gọn thành rail", cột rail của bảng lưới), §3.5 (phần rail của dòng "Bố cục, rail"; dòng Màn rộng hay hẹp trong JS; dòng Tên của trigger), §3.6 (dòng rail), §4.3 **AppShell** (header "Đầu hàng", Rail, brand ở rail), §5 (cảnh báo không có trigger, `collapsed` khi `collapsible` là `false`), §6.3 (`AppShellHeader`, `AppShellSidebarTrigger`, Thu gọn, phần trigger của Bàn phím, các prop và nhãn của thu gọn và mở), §7 lớp 1 và 2 cho trigger và rail. Báo cáo và code của Task 2 là điểm bắt đầu.
- **`AppShellSidebarTrigger`** trong `AppShell.tsx` (nên `check:use-client` không cần thêm file), và `AppShellHeader` render nó trước ô brand (`sidebarTrigger`, mặc định `true`) (phát hiện 8).
- **Hai trạng thái** qua `useControllableState`: `collapsed` (rail, màn rộng) và `open` (tấm trượt, màn hẹp). Mode lấy từ `useMediaQuery(wideQuery(breakpoint))`; phía server là màn hẹp. Gốc mang `data-collapsible`, `data-collapsed`, `data-open`.
- Ở task này `open` chỉ đổi thuộc tính: tấm trượt chưa có giao diện và hành vi (Task 4). Cửa sổ vượt điểm gãy chưa đóng tấm (một unit test giữ điều đó; Task 4 đổi nó).
- **Trigger đăng ký** vào context (`registerTrigger`), để Task 4 trả focus về nó.
- **`breakpoints.ts`** là nguồn duy nhất của số điểm gãy (phát hiện 7).
- **Quy tắc rail** trong `wideRules`; trigger ẩn ở màn rộng khi không `collapsible`; ô brand S2 226px và 268px; khoảng 4px của brand ở màn hẹp; không có animation (phát hiện 8).
- **Cảnh báo**: sidebar mà không có trigger (sau khi mount); `collapsed` hay `defaultCollapsed` khi `collapsible={false}`; trigger ngoài `AppShell` (vẫn render, không làm gì).
- **Ứng dụng mẫu**: nav ở dạng rail (chỉ icon, chấm cho số đếm, đường chia cho mục), hover trên `.demo-item`, `hoverSettings` (phát hiện 8), header điện thoại có nút tìm kiếm, "Settings" ghim xuống đáy.
- **Story:** `SidebarRail`, `HeaderRail`, `SidebarPhone`, `HeaderPhone` là story giao diện (hai story sau gắn `viewport-390x844`); `Sidebar` và `Header` giờ có trigger. `NavEndAtTheBottomSidebarLayout`, `NavEndAtTheBottomHeaderLayout`, `TriggerFoldsTheSidebarSidebarLayout`, `TriggerFoldsTheSidebarHeaderLayout`, `NotCollapsibleSidebarLayout`, `NotCollapsibleHeaderLayout`, `TriggerKeepsTheHeaderInPlace`, `TriggerNameFollowsTheWindow` gắn `no-visual`.
- Không sửa dòng spec nào. Cuối task, `check:package` PASS trọn, CSS còn 161 B dưới ngưỡng cũ (phát hiện 12).

**Files:**
- Create: `src/components/app-shell/breakpoints.ts`, `src/components/app-shell/AppShellSidebarTrigger.test.tsx`
- Modify: `src/components/app-shell/AppShell.tsx`, `app-shell-context.ts`, `index.ts`, `AppShell.test.tsx`, `AppShell.test-d.ts`, `AppShell.stories.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/components/app-shell.css`, `scripts/lib/app-shell-css.ts`, `scripts/lib/app-shell-css.test.ts`, `scripts/check-dist-css.ts`, `.storybook/app-shell-demo.tsx`

**Interfaces:**
- Produces trong `AppShell.tsx`, export qua `index.ts` và `src/index.ts`:
  - `AppShellSidebarTrigger`: `forwardRef<HTMLButtonElement, AppShellSidebarTriggerProps>`; `AppShellSidebarTriggerProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby' | 'children'>`. IconButton `ghost` `md` với `MenuIcon`, class `flg-app-shell-trigger`.
  - Tên: màn hẹp `labels.openNavigation`; màn rộng `labels.collapseSidebar` hay `labels.expandSidebar`. `aria-expanded`: màn hẹp `open`, màn rộng `!collapsed`. `aria-controls` là id của sidebar. `onClick` của người dùng chạy trước (`composeEventHandlers`); `preventDefault` chặn việc đổi trạng thái.
  - `AppShellHeaderProps = HTMLAttributes<HTMLElement> & { sidebarTrigger?: boolean }`, mặc định `true`.
  - `AppShellProps` thêm `collapsible?: boolean` (mặc định `true`), `collapsed?`, `defaultCollapsed?`, `onCollapsedChange?: (collapsed: boolean) => void`, `open?`, `defaultOpen?`, `onOpenChange?: (open: boolean) => void`.
  - `AppShellLabels` thêm `openNavigation` (`'Open navigation'`), `collapseSidebar` (`'Collapse sidebar'`), `expandSidebar` (`'Expand sidebar'`).
- `AppShellContextValue` thêm `isWide`, `collapsible`, `collapsed` (luôn `false` khi không `collapsible`), `setCollapsed(collapsed)`, `open`, `setOpen(open)` (Task 4 thêm tuỳ chọn), `registerTrigger(element): () => void`.
- Produces trong `src/components/app-shell/breakpoints.ts` (server-safe, nội bộ): `APP_SHELL_BREAKPOINTS: Record<AppShellBreakpoint, number>`; `wideQuery(breakpoint) => '(min-width: <N>px)'`. `scripts/lib/app-shell-css.ts` import và re-export `APP_SHELL_BREAKPOINTS`.
- Hook DOM trên gốc: `data-collapsible` (khi `collapsible`), `data-collapsed` (khi là rail), `data-open` (khi `open`; có cả trong HTML từ server khi `defaultOpen`).
- CSS:
  - Phần chung: `.flg-app-shell-trigger { flex: none }`; trigger ẩn khi khung không có sidebar; `.flg-app-shell-trigger + .flg-app-shell-header-brand { margin-left: 4px }`.
  - `wideRules`: `[data-collapsed]` cho cột `var(--flg-app-shell-rail-width)`; `:not([data-collapsible]) .flg-app-shell-trigger { display: none }`; brand `margin-left: 0`; hàng đầu S1 ở rail `justify-content: center; padding: 0`; tên brand ở rail ẩn khỏi mắt; ô brand S2 `width: 226px` sau trigger khi `[data-collapsible]`, còn lại 268px.
- Cảnh báo dev:
  - `<AppShell> has a sidebar but no <AppShellSidebarTrigger>: on narrow screens the navigation cannot be opened.`
  - ``<AppShell> has `collapsed` or `defaultCollapsed` but `collapsible` is false: the sidebar cannot collapse, so they are ignored.``
  - `<AppShellSidebarTrigger> must be rendered inside <AppShell>.`
- Danh sách kiểm tra gói: `scripts/check-dist-css.ts` thêm `flg-app-shell-trigger` và một kiểm tra quy tắc cột rail.
- Story: `DemoNav({ hoverSettings })` và `DemoPageProps.hoverSettings` (mục "Settings" được trỏ cùng tooltip của story).
- Consumes: `useMediaQuery`, `MenuIcon` (Task 1); `useControllableState`, `composeEventHandlers`, `dataAttr`, `IconButton`, `ButtonProps`.
- Task sau dùng: Task 4 dùng `registerTrigger`, `open` và `isWide`; Plan B: `NavItem` đọc rail từ `isWide && collapsed`.

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/app-shell-demo.tsx b/.storybook/app-shell-demo.tsx
index 50e2333..636f8a0 100644
--- a/.storybook/app-shell-demo.tsx
+++ b/.storybook/app-shell-demo.tsx
@@ -36,6 +36,7 @@ const CSS = `
 .demo-item { appearance: none; box-sizing: border-box; width: 100%; margin: 0; border: 0; background: none; font: inherit; text-align: left; cursor: pointer; position: relative; display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 10px; border-radius: var(--flg-radius-md); color: var(--flg-text); text-decoration: none; font-size: var(--flg-text-sm); font-weight: var(--flg-weight-medium); white-space: nowrap; }
 .demo-item > svg { flex: none; width: 18px; height: 18px; color: var(--flg-text-muted); }
 .demo-item > svg.demo-chevron { width: 16px; height: 16px; }
+.demo-item:hover, .demo-item[data-hover] { background: var(--flg-control-track); }
 .demo-item[aria-current='page'] { background: var(--flg-accent-subtle); color: var(--flg-accent-text); font-weight: var(--flg-weight-semibold); }
 .demo-item[aria-current='page'] > svg { color: currentColor; }
 .demo-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
@@ -43,7 +44,22 @@ const CSS = `
 .demo-child { height: 32px; padding-left: 38px; font-weight: var(--flg-weight-regular); }
 .demo-sublist { margin-top: 2px; }
 .demo-section { padding: 16px 10px 6px; font-size: var(--flg-text-2xs); font-weight: var(--flg-weight-semibold); letter-spacing: 0.06em; text-transform: uppercase; color: var(--flg-text-muted); }
-.demo-nav-end { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--flg-control-border); }
+.demo-nav .demo-nav-end { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--flg-control-border); }
+.demo-dot { display: none; }
+.demo-tip { position: fixed; z-index: 7; left: 78px; top: calc(100dvh - 32px); translate: 0 -50%; white-space: nowrap; pointer-events: none; }
+
+/* The rail, as the mockup draws it: the sidebar column is narrower, so what is in it is only icons.
+   Only on a wide screen: the sheet of a narrow one is never a rail, whatever "collapsed" says. */
+@media (min-width: 1024px) {
+  .flg-app-shell[data-collapsed] .demo-item { justify-content: center; gap: 0; height: 40px; padding: 0; }
+  .flg-app-shell[data-collapsed] .demo-item > .demo-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
+  .flg-app-shell[data-collapsed] .demo-item > .flg-badge,
+  .flg-app-shell[data-collapsed] .demo-chevron,
+  .flg-app-shell[data-collapsed] .demo-sublist { display: none; }
+  .flg-app-shell[data-collapsed] .demo-section { height: 1px; margin: 10px 6px; padding: 0; overflow: hidden; font-size: 0; background: var(--flg-control-border); }
+  .flg-app-shell[data-collapsed] .demo-dot { display: block; position: absolute; top: 8px; left: calc(50% + 5px); width: 8px; height: 8px; border-radius: 50%; background: var(--flg-danger-fill); box-shadow: 0 0 0 1.5px var(--flg-on-danger); }
+  [data-flg-theme='light'] .flg-app-shell[data-collapsed] .demo-dot { box-shadow: 0 0 0 2px var(--flg-glass-tint-solid); }
+}
 
 .demo-page { display: flex; flex-direction: column; gap: 20px; }
 .demo-title { margin: 0; font-size: 22px; font-weight: var(--flg-weight-semibold); line-height: 1.25; letter-spacing: -0.01em; }
@@ -66,7 +82,11 @@ const CSS = `
 .demo-filler { display: flex; flex-direction: column; align-items: flex-start; gap: 80px; margin: 0; padding: 0; list-style: none; }
 @media (max-width: 767px) {
   .demo-cards { grid-template-columns: 1fr; gap: 12px; }
-  .demo-search { width: auto; flex: 1; }
+  /* A phone has the search as a button, as the mockup draws it, and not as a field. */
+  .demo-search { display: none; }
+}
+@media (min-width: 768px) {
+  .demo-search-button { display: none; }
 }
 `;
 
@@ -160,12 +180,15 @@ function NavLink({
   current = false,
   count,
   child = false,
+  hover = false,
   children,
 }: {
   icon?: keyof typeof ICONS;
   current?: boolean;
   count?: number;
   child?: boolean;
+  /** The item the pointer is on in the look stories (see `DemoPage`). */
+  hover?: boolean;
   children: string;
 }) {
   return (
@@ -174,11 +197,13 @@ function NavLink({
         className={child ? 'demo-item demo-child' : 'demo-item'}
         href="#page"
         aria-current={current ? 'page' : undefined}
+        data-visual-hover={hover ? '' : undefined}
         onClick={noJump}
       >
         {icon ? <Icon>{ICONS[icon]}</Icon> : null}
         <span className="demo-label">{children}</span>
         {count ? <Badge>{count}</Badge> : null}
+        {count ? <i className="demo-dot" aria-hidden="true" /> : null}
       </a>
     </li>
   );
@@ -210,7 +235,7 @@ function NavGroup({
 }
 
 /** The navigation of the mockup, drawn by the story's own CSS; Nav is a later plan. */
-export function DemoNav() {
+export function DemoNav({ hoverSettings = false }: { hoverSettings?: boolean }) {
   return (
     <nav className="demo-nav" aria-label="Main">
       <ul>
@@ -238,7 +263,9 @@ export function DemoNav() {
         </NavLink>
       </ul>
       <ul className="demo-nav-end">
-        <NavLink icon="gear">Settings</NavLink>
+        <NavLink icon="gear" hover={hoverSettings}>
+          Settings
+        </NavLink>
       </ul>
     </nav>
   );
@@ -256,6 +283,9 @@ export function DemoHeaderContent() {
         <kbd className="demo-kbd">⌘K</kbd>
       </div>
       <span className="demo-spacer" />
+      <IconButton variant="ghost" aria-label="Search" className="demo-search-button">
+        <Icon>{ICONS.search}</Icon>
+      </IconButton>
       <IconButton variant="ghost" aria-label="Notifications">
         <Icon>{ICONS.bell}</Icon>
       </IconButton>
@@ -417,6 +447,12 @@ export interface DemoPageProps extends AppShellProps {
   rows?: number;
   /** The header gets the brand cell and the widgets. Default true. */
   header?: boolean;
+  /**
+   * The pointer is on "Settings", with the tooltip the rail shows (the mockup's hovered icon). The
+   * tooltip is drawn by the story, as Nav and its tooltip are a later plan: it is placed at the foot
+   * of the rail, where "Settings" is when the sidebar is as tall as the window.
+   */
+  hoverSettings?: boolean;
 }
 
 /** The whole application of the mockup in an AppShell, in the order the docs recommend. */
@@ -424,6 +460,7 @@ export function DemoPage({
   footer = true,
   header = true,
   rows = 0,
+  hoverSettings = false,
   children,
   ...props
 }: DemoPageProps) {
@@ -437,7 +474,7 @@ export function DemoPage({
           </AppShellHeader>
         ) : null}
         <AppShellSidebar>
-          <DemoNav />
+          <DemoNav hoverSettings={hoverSettings} />
         </AppShellSidebar>
         <AppShellMain>
           <DemoContent>{rows > 0 ? <DemoRows count={rows} /> : null}</DemoContent>
@@ -448,6 +485,11 @@ export function DemoPage({
             <DemoFooter />
           </AppShellFooter>
         ) : null}
+        {hoverSettings ? (
+          <div className="flg-tooltip demo-tip" aria-hidden="true">
+            Settings
+          </div>
+        ) : null}
       </AppShell>
     </>
   );
diff --git a/scripts/lib/app-shell-css.test.ts b/scripts/lib/app-shell-css.test.ts
index a9a4350..b72d053 100644
--- a/scripts/lib/app-shell-css.test.ts
+++ b/scripts/lib/app-shell-css.test.ts
@@ -101,4 +101,65 @@ describe('buildAppShellCss', () => {
       /:not\(:has\(> \.flg-app-shell-header\)\) \{\s*--flg-app-shell-header-height: 0px/,
     );
   });
+
+  describe('the rail and the trigger', () => {
+    const body = wideRules('lg');
+    const shell = ".flg-app-shell[data-breakpoint='lg']";
+    const rule = (selector: string) => {
+      const start = body.indexOf(`${selector} {`);
+      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
+      return body.slice(start, body.indexOf('}', start));
+    };
+
+    it('narrows the sidebar column to the rail width when the root is collapsed', () => {
+      expect(rule(`${shell}[data-collapsed]`)).toContain(
+        'grid-template-columns: var(--flg-app-shell-rail-width) minmax(0, 1fr)',
+      );
+      // A shell without a sidebar has one column however it is marked, so that rule must be the
+      // more specific: it comes later and carries a [data-layout] the rail rule does not.
+      expect(body.indexOf(`${shell}[data-collapsed] {`)).toBeLessThan(
+        body.indexOf(`${shell}[data-layout]:not(:has(> .flg-app-shell-sidebar)) {`),
+      );
+    });
+
+    it('centres the mark in the head of an S1 rail and hides the name from the eye only', () => {
+      const head = `${shell}[data-layout='sidebar'][data-collapsed] > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head`;
+      expect(rule(head)).toContain('justify-content: center');
+      expect(rule(head)).toContain('padding: 0');
+      const name = rule(
+        `${shell}[data-collapsed] .flg-app-shell-sidebar-head .flg-app-shell-brand-name`,
+      );
+      // The technique of `flg-visually-hidden`: the name stays the name of the link.
+      expect(name).toContain('position: absolute');
+      expect(name).toContain('clip-path: inset(50%)');
+      expect(name).not.toContain('display: none');
+    });
+
+    it('is 226px for the brand cell of S2 behind a trigger that is shown, 268px otherwise', () => {
+      const behind = `${shell}[data-layout='header'][data-collapsible] > .flg-app-shell-header > .flg-app-shell-trigger + .flg-app-shell-header-brand`;
+      expect(rule(behind)).toContain('width: 226px');
+      expect(
+        rule(
+          `${shell}[data-layout='header'] > .flg-app-shell-header > .flg-app-shell-header-brand`,
+        ),
+      ).toContain('width: 268px');
+      // Without the attribute the trigger is not shown on a wide screen, so 226 would leave a gap.
+      expect(body.indexOf(behind)).toBeGreaterThan(
+        body.indexOf(
+          `${shell}[data-layout='header'] > .flg-app-shell-header > .flg-app-shell-header-brand {`,
+        ),
+      );
+    });
+
+    it('takes the narrow gap of the brand away on a wide screen, and hides a trigger with no rail', () => {
+      expect(
+        rule(
+          `${shell} > .flg-app-shell-header > .flg-app-shell-trigger + .flg-app-shell-header-brand`,
+        ),
+      ).toContain('margin-left: 0');
+      expect(rule(`${shell}:not([data-collapsible]) .flg-app-shell-trigger`)).toContain(
+        'display: none',
+      );
+    });
+  });
 });
diff --git a/src/components/app-shell/AppShell.stories.tsx b/src/components/app-shell/AppShell.stories.tsx
index d40556f..6de16cf 100644
--- a/src/components/app-shell/AppShell.stories.tsx
+++ b/src/components/app-shell/AppShell.stories.tsx
@@ -393,3 +393,236 @@ export const SkipLinkHeaderLayout: Story = {
   render: () => <DemoPage layout="header" rows={20} />,
   play: checkSkipLink(),
 };
+
+// ---------------------------------------------------------------------------------------------------
+// The trigger, the rail and the phone (spec §3.3, §6.3).
+
+/**
+ * S1 at the rail (spec §4.3): the sidebar column is 68px, the head keeps the mark of the brand in the
+ * middle, the navigation is icons. The pointer is on "Settings", with the tooltip the mockup draws.
+ * The mockup draws the rail without a footer, and so do these.
+ */
+export const SidebarRail: Story = {
+  render: () => <DemoPage layout="sidebar" defaultCollapsed footer={false} hoverSettings />,
+};
+
+/** S2 at the rail: only the column under the header narrows, the brand and what follows stay put. */
+export const HeaderRail: Story = {
+  render: () => <DemoPage layout="header" defaultCollapsed footer={false} hoverSettings />,
+};
+
+/**
+ * S1 on a phone, the sidebar closed: the header has the button and the brand. The harness shoots a
+ * story with this tag at that size (spec §7).
+ */
+export const SidebarPhone: Story = {
+  tags: ['viewport-390x844'],
+  render: () => <DemoPage layout="sidebar" />,
+};
+
+/** S2 on a phone, the sidebar closed. */
+export const HeaderPhone: Story = {
+  tags: ['viewport-390x844'],
+  render: () => <DemoPage layout="header" />,
+};
+
+const RAIL = 68;
+const trigger = () => part<HTMLButtonElement>('.flg-app-shell-trigger');
+const rectOf = (element: Element) => element.getBoundingClientRect();
+
+/**
+ * "Settings" is the foot of the navigation: it is pinned to the bottom of the sidebar and not left
+ * under the last link, as the mockup draws it, in both layouts, with a footer beside the sidebar (S1)
+ * or under it (S2).
+ */
+function checkNavEnd(layout: 'sidebar' | 'header') {
+  return async () => {
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const panel = rect('.flg-app-shell-sidebar-panel');
+      const settings = rectOf(part('.demo-nav-end a'));
+      // The padding below the navigation is 12px.
+      near(settings.bottom, panel.bottom - 12);
+      near(panel.bottom, layout === 'sidebar' ? WIDE.height : WIDE.height - 44);
+    });
+  };
+}
+
+export const NavEndAtTheBottomSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" />,
+  play: checkNavEnd('sidebar'),
+};
+export const NavEndAtTheBottomHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" />,
+  play: checkNavEnd('header'),
+};
+
+/**
+ * The trigger switches the column at a wide width, in both layouts, with the keyboard: the sidebar is
+ * 264px, then 68px, then 264px again; the button is the same element and keeps the focus, and its
+ * name and `aria-expanded` follow. At the rail the mark of the brand is in the middle of the column
+ * (S1), or the brand cell and what follows it have not moved (S2: "the logo and the search stay
+ * put"). Skipped without trusted input.
+ */
+function checkRail(layout: 'sidebar' | 'header') {
+  return async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      const root = part('.flg-app-shell');
+      const button = trigger();
+      const mark = () =>
+        part(
+          layout === 'sidebar'
+            ? '.flg-app-shell-sidebar-head .demo-mark'
+            : '.flg-app-shell-header-brand .demo-mark',
+        );
+      const searchLeft = () => rectOf(part('.demo-search')).left;
+      const before = { search: searchLeft(), mark: rectOf(mark()).left };
+      const press = async (expected: 'rail' | 'expanded') => {
+        await real.keyboard('{Enter}');
+        await waitFor(() => expect(root.hasAttribute('data-collapsed')).toBe(expected === 'rail'));
+        await afterLayout();
+      };
+      button.focus();
+      await expect(button).toHaveAccessibleName('Collapse sidebar');
+      await expect(button).toHaveAttribute('aria-expanded', 'true');
+      near(rect('.flg-app-shell-sidebar-panel').width, SIDEBAR_WIDE);
+      near(rect('.flg-app-shell-main').left, SIDEBAR_WIDE);
+
+      await press('rail');
+      near(rect('.flg-app-shell-sidebar-panel').width, RAIL);
+      near(rect('.flg-app-shell-main').left, RAIL);
+      near(rect('.flg-app-shell-main').right, clientWidth());
+      near(rect('.flg-app-shell-header').left, layout === 'sidebar' ? RAIL : 0);
+      // The same button, with the focus still on it, now offering the way back.
+      await expect(trigger()).toBe(button);
+      await expect(button).toHaveFocus();
+      await expect(button).toHaveAccessibleName('Expand sidebar');
+      await expect(button).toHaveAttribute('aria-expanded', 'false');
+      if (layout === 'sidebar') {
+        // The mark is in the middle of the column; the name has gone out of sight, not out of the page.
+        const panel = rect('.flg-app-shell-sidebar-panel');
+        const box = rectOf(mark());
+        // The panel has a 1px edge on the right, so its content is 67px wide.
+        near(box.left + box.width / 2, (panel.left + panel.right - 1) / 2);
+        await expect(
+          rectOf(part('.flg-app-shell-sidebar-head .flg-app-shell-brand-name')).width,
+        ).toBeLessThanOrEqual(1);
+        await expect(
+          part('.flg-app-shell-sidebar-head a.flg-app-shell-brand').textContent,
+        ).toContain('Lumen');
+      } else {
+        near(searchLeft(), before.search);
+        near(rectOf(mark()).left, before.mark);
+      }
+
+      await press('expanded');
+      near(rect('.flg-app-shell-sidebar-panel').width, SIDEBAR_WIDE);
+      near(rect('.flg-app-shell-main').left, SIDEBAR_WIDE);
+      await expect(trigger()).toBe(button);
+      await expect(button).toHaveFocus();
+      await expect(button).toHaveAccessibleName('Collapse sidebar');
+      near(searchLeft(), before.search);
+    });
+  };
+}
+
+export const TriggerFoldsTheSidebarSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" rows={6} />,
+  play: checkRail('sidebar'),
+};
+export const TriggerFoldsTheSidebarHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" rows={6} />,
+  play: checkRail('header'),
+};
+
+/**
+ * With `collapsible={false}` there is no rail, so on a wide screen the button is not shown and the
+ * brand cell of S2 is as wide as the button and the cell together: what follows it starts where it
+ * does with the button (16 + 34 + 8 + 226 + 8 + 4 = 16 + 268 + 8 + 4 = 296). On a narrow screen the
+ * button is back, for it opens the sheet, and the brand stands 8px from it.
+ */
+function checkNotCollapsible(layout: 'sidebar' | 'header') {
+  return async () => {
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      await expect(getComputedStyle(trigger()).display).toBe('none');
+      near(rect('.flg-app-shell-sidebar-panel').width, SIDEBAR_WIDE);
+      if (layout === 'header') {
+        near(rect('.flg-app-shell-header-brand').width, 268);
+        near(rectOf(part('.demo-search')).left, 296);
+      }
+      await viewport.set(390);
+      await expect(getComputedStyle(trigger()).display).not.toBe('none');
+      near(rectOf(trigger()).width, 34);
+      await expect(trigger()).toHaveAccessibleName('Open navigation');
+      // 10px of padding, the button, the gap of 4px and 4px more: at 52px, where the sheet puts its
+      // own brand (S2).
+      near(rect('.flg-app-shell-header-brand').left, 52);
+    });
+  };
+}
+
+export const NotCollapsibleSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" collapsible={false} />,
+  play: checkNotCollapsible('sidebar'),
+};
+export const NotCollapsibleHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" collapsible={false} />,
+  play: checkNotCollapsible('header'),
+};
+
+/**
+ * With the trigger, S2's brand cell is 226px and what follows it starts at 296px, the edge of the
+ * content of main; and the narrow header is 56px tall with the brand at 52px.
+ */
+export const TriggerKeepsTheHeaderInPlace: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" />,
+  play: async () => {
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      near(rect('.flg-app-shell-header-brand').width, 226);
+      near(rectOf(part('.demo-search')).left, 296);
+      near(rectOf(trigger()).left, 16);
+      near(rectOf(trigger()).width, 34);
+      near(rect('.flg-app-shell-main').left + 32, 296);
+      await viewport.set(390);
+      near(rectOf(trigger()).left, 10);
+      near(rect('.flg-app-shell-header-brand').left, 52);
+      near(rect('.flg-app-shell-header').height, 56);
+    });
+  },
+};
+
+/**
+ * The name of the trigger follows the window across the breakpoint, on a mounted shell and not only
+ * on a fresh one (spec §3.5): wide, it folds the sidebar; narrow, it opens the navigation.
+ */
+export const TriggerNameFollowsTheWindow: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" />,
+  play: async () => {
+    await withViewport(async (viewport) => {
+      for (const [width, name, expanded] of [
+        [1280, 'Collapse sidebar', 'true'],
+        [390, 'Open navigation', 'false'],
+        [1024, 'Collapse sidebar', 'true'],
+        [1023, 'Open navigation', 'false'],
+      ] as const) {
+        await viewport.set(width);
+        await waitFor(() => expect(trigger()).toHaveAccessibleName(name));
+        await expect(trigger()).toHaveAttribute('aria-expanded', expanded);
+        await expect(trigger()).toHaveAttribute('aria-controls', part('.flg-app-shell-sidebar').id);
+      }
+    });
+  },
+};
diff --git a/src/components/app-shell/AppShell.test-d.ts b/src/components/app-shell/AppShell.test-d.ts
index 439fe9a..d595906 100644
--- a/src/components/app-shell/AppShell.test-d.ts
+++ b/src/components/app-shell/AppShell.test-d.ts
@@ -8,6 +8,7 @@ import type {
   AppShellMainProps,
   AppShellProps,
   AppShellSidebarProps,
+  AppShellSidebarTriggerProps,
 } from '../../index';
 
 test('an AppShell takes only the documented layouts and breakpoints', () => {
@@ -30,7 +31,9 @@ test('an AppShell takes only the documented layouts and breakpoints', () => {
 test('the brand is any node, and the words may be given in part', () => {
   expectTypeOf<AppShellProps['brand']>().toEqualTypeOf<ReactNode>();
   expectTypeOf<NonNullable<AppShellProps['labels']>>().toEqualTypeOf<Partial<AppShellLabels>>();
-  expectTypeOf<keyof AppShellLabels>().toEqualTypeOf<'skipToContent'>();
+  expectTypeOf<keyof AppShellLabels>().toEqualTypeOf<
+    'skipToContent' | 'openNavigation' | 'collapseSidebar' | 'expandSidebar'
+  >();
 });
 
 test('the main and the sidebar take no id, which the library sets for the skip link', () => {
@@ -66,3 +69,25 @@ test('a brand needs a name, and takes a child only with asChild', () => {
   expectTypeOf(both).toBeObject();
   expectTypeOf(ok).toBeArray();
 });
+
+test('the trigger takes its name from the shell, and the header may leave it out', () => {
+  expectTypeOf<AppShellHeaderProps['sidebarTrigger']>().toEqualTypeOf<boolean | undefined>();
+  // @ts-expect-error the name changes with the mode: it is `labels` of the AppShell
+  const named: AppShellSidebarTriggerProps = { 'aria-label': 'Menu' };
+  // @ts-expect-error the icon is the library's
+  const withChild: AppShellSidebarTriggerProps = { children: 'x' };
+  expectTypeOf(named).toBeObject();
+  expectTypeOf(withChild).toBeObject();
+  expectTypeOf<AppShellSidebarTriggerProps['onClick']>().not.toBeNever();
+});
+
+test('the shell takes its two states as controlled or uncontrolled', () => {
+  expectTypeOf<AppShellProps['collapsed']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<AppShellProps['open']>().toEqualTypeOf<boolean | undefined>();
+  expectTypeOf<AppShellProps['onCollapsedChange']>().toEqualTypeOf<
+    ((collapsed: boolean) => void) | undefined
+  >();
+  expectTypeOf<AppShellProps['onOpenChange']>().toEqualTypeOf<
+    ((open: boolean) => void) | undefined
+  >();
+});
diff --git a/src/components/app-shell/AppShell.test.tsx b/src/components/app-shell/AppShell.test.tsx
index 206d68e..6415fbc 100644
--- a/src/components/app-shell/AppShell.test.tsx
+++ b/src/components/app-shell/AppShell.test.tsx
@@ -222,8 +222,9 @@ describe('AppShell', () => {
       );
       expect(inHeader?.querySelector('a.flg-app-shell-brand')).toHaveTextContent('Lumen');
       expect(inSidebar?.querySelector('a.flg-app-shell-brand')).toHaveTextContent('Lumen');
-      // The brand cell comes before what the caller puts in the header.
-      expect(container.querySelector('.flg-app-shell-header')!.firstElementChild).toBe(inHeader);
+      // The brand cell comes after the trigger and before what the caller puts in the header.
+      const header = container.querySelector('.flg-app-shell-header')!;
+      expect(header.children[1]).toBe(inHeader);
     });
 
     it('leaves out the cell of the header, but not the head of the sidebar, without a brand', () => {
@@ -312,7 +313,7 @@ describe('AppShell', () => {
       const warn = spyWarn();
       render(
         <>
-          <AppShellHeader>H</AppShellHeader>
+          <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
           <AppShellSidebar>S</AppShellSidebar>
           <AppShellMain>M</AppShellMain>
           <AppShellFooter>F</AppShellFooter>
@@ -332,6 +333,7 @@ describe('AppShell', () => {
       const warn = spyWarn();
       render(
         <AppShell>
+          <AppShellHeader>H</AppShellHeader>
           <div>
             <AppShellSidebar>S</AppShellSidebar>
           </div>
diff --git a/src/components/app-shell/AppShellSidebarTrigger.test.tsx b/src/components/app-shell/AppShellSidebarTrigger.test.tsx
new file mode 100644
index 0000000..3a3d7cb
--- /dev/null
+++ b/src/components/app-shell/AppShellSidebarTrigger.test.tsx
@@ -0,0 +1,420 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import { createRef } from 'react';
+import type { ReactNode } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import {
+  AppShell,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+  AppShellSidebarTrigger,
+} from './AppShell';
+import type { AppShellProps } from './AppShell';
+import { AppShellBrand } from './AppShellBrand';
+
+// jsdom has no `matchMedia`, so a test says what the window is: wide when the query of the
+// breakpoint matches, and a call to `resize` is the user dragging the window across it.
+let wide = false;
+const listeners = new Set<() => void>();
+
+function stubWindow(initiallyWide: boolean) {
+  wide = initiallyWide;
+  listeners.clear();
+  vi.stubGlobal(
+    'matchMedia',
+    vi.fn((query: string) => ({
+      get matches() {
+        return wide && query.startsWith('(min-width:');
+      },
+      media: query,
+      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
+      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
+    })),
+  );
+}
+
+function resize(toWide: boolean) {
+  wide = toWide;
+  act(() => {
+    for (const listener of [...listeners]) listener();
+  });
+}
+
+beforeEach(() => {
+  resetDevWarnings();
+  vi.restoreAllMocks();
+});
+afterEach(() => {
+  vi.unstubAllGlobals();
+});
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
+
+// The only button of these shells.
+const trigger = () => screen.getByRole('button');
+
+function Shell({ children, ...props }: { children?: ReactNode } & AppShellProps) {
+  return (
+    <AppShell {...props}>
+      <AppShellHeader>Header</AppShellHeader>
+      <AppShellSidebar>Sidebar</AppShellSidebar>
+      <AppShellMain>{children ?? 'Main'}</AppShellMain>
+      <AppShellFooter>Footer</AppShellFooter>
+    </AppShell>
+  );
+}
+
+describe('AppShellHeader renders the trigger', () => {
+  it('first, then the brand cell, then what the caller put in the header', () => {
+    const { container } = render(
+      <Shell brand={<AppShellBrand name="Lumen" />}>
+        <span>x</span>
+      </Shell>,
+    );
+    const header = container.querySelector('.flg-app-shell-header')!;
+    expect(
+      Array.from(header.children).map((child) => child.className.replace('flg-button ', '')),
+    ).toEqual(['flg-app-shell-trigger', 'flg-app-shell-header-brand']);
+    expect(header.firstElementChild!.tagName).toBe('BUTTON');
+    // The caller's children come after both, in the order the Tab key goes.
+    expect(header.lastChild).toHaveTextContent('Header');
+  });
+
+  it('is an icon-only ghost button with a menu icon, as the mockup draws it', () => {
+    render(<Shell />);
+    expect(trigger()).toHaveClass('flg-button', 'flg-app-shell-trigger');
+    expect(trigger()).toHaveAttribute('data-variant', 'ghost');
+    expect(trigger()).toHaveAttribute('data-size', 'md');
+    expect(trigger()).toHaveAttribute('data-icon-only');
+    expect(trigger().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
+  });
+
+  it('leaves it out with sidebarTrigger={false}, and the caller can place one', () => {
+    const { container } = render(
+      <AppShell>
+        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
+        <AppShellSidebar>S</AppShellSidebar>
+        <AppShellMain>
+          <AppShellSidebarTrigger />
+        </AppShellMain>
+      </AppShell>,
+    );
+    expect(container.querySelectorAll('.flg-app-shell-trigger')).toHaveLength(1);
+    expect(container.querySelector('.flg-app-shell-header .flg-app-shell-trigger')).toBeNull();
+  });
+
+  it('does not hand `sidebarTrigger` to the DOM', () => {
+    const { container } = render(
+      <AppShell>
+        <AppShellHeader sidebarTrigger={false} data-x="1">
+          H
+        </AppShellHeader>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    const header = container.querySelector('header')!;
+    expect(header).toHaveAttribute('data-x', '1');
+    expect(header).not.toHaveAttribute('sidebartrigger');
+    expect(header).not.toHaveAttribute('sidebarTrigger');
+  });
+});
+
+describe('AppShellSidebarTrigger on a narrow screen', () => {
+  beforeEach(() => stubWindow(false));
+
+  it('points at the sidebar and offers to open the navigation, which is closed', () => {
+    const { container } = render(<Shell />);
+    const sidebar = container.querySelector('.flg-app-shell-sidebar')!;
+    expect(trigger()).toHaveAccessibleName('Open navigation');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+    expect(trigger()).toHaveAttribute('aria-controls', sidebar.id);
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+  });
+
+  it('toggles `open` on the root and in aria-expanded, uncontrolled', () => {
+    const onOpenChange = vi.fn();
+    const { container } = render(<Shell onOpenChange={onOpenChange} />);
+    const root = container.firstElementChild!;
+    fireEvent.click(trigger());
+    expect(root).toHaveAttribute('data-open');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+    expect(onOpenChange).toHaveBeenLastCalledWith(true);
+    fireEvent.click(trigger());
+    expect(root).not.toHaveAttribute('data-open');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+    expect(onOpenChange).toHaveBeenLastCalledWith(false);
+    expect(onOpenChange).toHaveBeenCalledTimes(2);
+  });
+
+  it('starts open from `defaultOpen`, in the very first render', () => {
+    const { container } = render(<Shell defaultOpen />);
+    expect(container.firstElementChild).toHaveAttribute('data-open');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+  });
+
+  it('reports a request and leaves the state to the parent when `open` is controlled', () => {
+    const onOpenChange = vi.fn();
+    const { container, rerender } = render(<Shell open={false} onOpenChange={onOpenChange} />);
+    fireEvent.click(trigger());
+    expect(onOpenChange).toHaveBeenCalledWith(true);
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+    rerender(<Shell open onOpenChange={onOpenChange} />);
+    expect(container.firstElementChild).toHaveAttribute('data-open');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+  });
+
+  it('leaves `collapsed` alone', () => {
+    const onCollapsedChange = vi.fn();
+    const { container } = render(<Shell onCollapsedChange={onCollapsedChange} />);
+    fireEvent.click(trigger());
+    expect(onCollapsedChange).not.toHaveBeenCalled();
+    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
+  });
+});
+
+describe('AppShellSidebarTrigger on a wide screen', () => {
+  beforeEach(() => stubWindow(true));
+
+  it('offers to collapse the sidebar, which is expanded', () => {
+    const { container } = render(<Shell />);
+    expect(trigger()).toHaveAccessibleName('Collapse sidebar');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
+  });
+
+  it('toggles `collapsed` on the root, in the name and in aria-expanded, uncontrolled', () => {
+    const onCollapsedChange = vi.fn();
+    const { container } = render(<Shell onCollapsedChange={onCollapsedChange} />);
+    const root = container.firstElementChild!;
+    fireEvent.click(trigger());
+    expect(root).toHaveAttribute('data-collapsed');
+    expect(trigger()).toHaveAccessibleName('Expand sidebar');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
+    fireEvent.click(trigger());
+    expect(root).not.toHaveAttribute('data-collapsed');
+    expect(trigger()).toHaveAccessibleName('Collapse sidebar');
+    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
+  });
+
+  it('starts as a rail from `defaultCollapsed`, in the very first render', () => {
+    const { container } = render(<Shell defaultCollapsed />);
+    expect(container.firstElementChild).toHaveAttribute('data-collapsed');
+    expect(trigger()).toHaveAccessibleName('Expand sidebar');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+  });
+
+  it('reports a request and leaves the state to the parent when `collapsed` is controlled', () => {
+    const onCollapsedChange = vi.fn();
+    const { container, rerender } = render(
+      <Shell collapsed={false} onCollapsedChange={onCollapsedChange} />,
+    );
+    fireEvent.click(trigger());
+    expect(onCollapsedChange).toHaveBeenCalledWith(true);
+    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
+    rerender(<Shell collapsed onCollapsedChange={onCollapsedChange} />);
+    expect(container.firstElementChild).toHaveAttribute('data-collapsed');
+    expect(trigger()).toHaveAccessibleName('Expand sidebar');
+  });
+
+  it('leaves `open` alone', () => {
+    const onOpenChange = vi.fn();
+    const { container } = render(<Shell onOpenChange={onOpenChange} />);
+    fireEvent.click(trigger());
+    expect(onOpenChange).not.toHaveBeenCalled();
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+  });
+
+  it('marks the root `data-collapsible`, which tells the CSS whether there is a rail', () => {
+    const { container, rerender } = render(<Shell />);
+    expect(container.firstElementChild).toHaveAttribute('data-collapsible');
+    rerender(<Shell collapsible={false} />);
+    expect(container.firstElementChild).not.toHaveAttribute('data-collapsible');
+  });
+
+  it('does nothing with `collapsible={false}`, and ignores `collapsed` with a warning', () => {
+    const warn = spyWarn();
+    const onCollapsedChange = vi.fn();
+    const { container } = render(
+      <Shell collapsible={false} collapsed onCollapsedChange={onCollapsedChange} />,
+    );
+    // The button is hidden by CSS at this width; a script that clicks it still changes nothing.
+    fireEvent.click(trigger());
+    expect(onCollapsedChange).not.toHaveBeenCalled();
+    expect(container.firstElementChild).not.toHaveAttribute('data-collapsed');
+    expect(warnings(warn)).toEqual([
+      '[h2d-glass-ui] <AppShell> has `collapsed` or `defaultCollapsed` but `collapsible` is false: the sidebar cannot collapse, so they are ignored.',
+    ]);
+  });
+
+  it('warns for `defaultCollapsed` with `collapsible={false}` too, and only then', () => {
+    const warn = spyWarn();
+    render(<Shell collapsible={false} />);
+    expect(warn).not.toHaveBeenCalled();
+    render(<Shell collapsible={false} defaultCollapsed />);
+    expect(warn).toHaveBeenCalledTimes(1);
+  });
+});
+
+describe('the mode follows the window', () => {
+  it('renames the trigger when the window crosses the breakpoint, on a mounted shell', () => {
+    stubWindow(false);
+    render(<Shell />);
+    expect(trigger()).toHaveAccessibleName('Open navigation');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+    resize(true);
+    expect(trigger()).toHaveAccessibleName('Collapse sidebar');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+    resize(false);
+    expect(trigger()).toHaveAccessibleName('Open navigation');
+  });
+
+  it('keeps each state when the mode changes: a rail stays a rail, an open sheet stays open', () => {
+    stubWindow(true);
+    const { container } = render(<Shell defaultCollapsed defaultOpen />);
+    const root = container.firstElementChild!;
+    resize(false);
+    expect(root).toHaveAttribute('data-collapsed');
+    expect(root).toHaveAttribute('data-open');
+    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+    resize(true);
+    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
+  });
+
+  it('listens to the query of its own breakpoint', () => {
+    stubWindow(true);
+    const matchMedia = window.matchMedia as unknown as ReturnType<typeof vi.fn>;
+    render(<Shell breakpoint="md" />);
+    expect(matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
+    render(<Shell breakpoint="xl" />);
+    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1280px)');
+    render(<Shell />);
+    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
+  });
+
+  it('is the narrow trigger without `matchMedia`, which is what the server renders', () => {
+    render(<Shell />);
+    expect(trigger()).toHaveAccessibleName('Open navigation');
+  });
+});
+
+describe('the words', () => {
+  beforeEach(() => stubWindow(false));
+
+  it('come from `labels`, one key at a time, and a key left out keeps its default', () => {
+    const { rerender } = render(<Shell labels={{ openNavigation: 'Mở điều hướng' }} />);
+    expect(trigger()).toHaveAccessibleName('Mở điều hướng');
+    rerender(<Shell labels={{ openNavigation: undefined }} />);
+    expect(trigger()).toHaveAccessibleName('Open navigation');
+    resize(true);
+    rerender(<Shell labels={{ collapseSidebar: 'Thu gọn', expandSidebar: 'Mở rộng' }} />);
+    expect(trigger()).toHaveAccessibleName('Thu gọn');
+    fireEvent.click(trigger());
+    expect(trigger()).toHaveAccessibleName('Mở rộng');
+  });
+});
+
+describe('the caller keeps what is theirs', () => {
+  beforeEach(() => stubWindow(false));
+
+  it('has its ref, class, style and attributes, and its own click handler runs first', () => {
+    const ref = createRef<HTMLButtonElement>();
+    const onClick = vi.fn();
+    const { container } = render(
+      <AppShell>
+        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
+        <AppShellSidebar>S</AppShellSidebar>
+        <AppShellMain>
+          <AppShellSidebarTrigger
+            ref={ref}
+            className="mine"
+            style={{ color: 'red' }}
+            data-testid="t"
+            aria-describedby="hint"
+            onClick={onClick}
+          />
+        </AppShellMain>
+      </AppShell>,
+    );
+    const button = screen.getByTestId('t');
+    expect(ref.current).toBe(button);
+    expect(button).toHaveClass('flg-app-shell-trigger', 'mine');
+    expect((button as HTMLElement).style.color).toBe('red');
+    expect(button).toHaveAttribute('aria-describedby', 'hint');
+    fireEvent.click(button);
+    expect(onClick).toHaveBeenCalledTimes(1);
+    expect(container.firstElementChild).toHaveAttribute('data-open');
+  });
+
+  it('does not toggle when the caller prevents the click', () => {
+    const { container } = render(
+      <AppShell>
+        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
+        <AppShellSidebar>S</AppShellSidebar>
+        <AppShellMain>
+          <AppShellSidebarTrigger onClick={(event) => event.preventDefault()} />
+        </AppShellMain>
+      </AppShell>,
+    );
+    fireEvent.click(trigger());
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+  });
+});
+
+describe('dev warnings for the trigger', () => {
+  beforeEach(() => stubWindow(false));
+
+  it('say that a sidebar has no trigger, once the shell is mounted', () => {
+    const warn = spyWarn();
+    render(
+      <AppShell>
+        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
+        <AppShellSidebar>S</AppShellSidebar>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    expect(warnings(warn)).toEqual([
+      '[h2d-glass-ui] <AppShell> has a sidebar but no <AppShellSidebarTrigger>: on narrow screens the navigation cannot be opened.',
+    ]);
+  });
+
+  it("are silent when the trigger is the header's, or one the caller placed elsewhere", () => {
+    const warn = spyWarn();
+    render(<Shell />);
+    render(
+      <AppShell>
+        <AppShellHeader sidebarTrigger={false}>H</AppShellHeader>
+        <AppShellSidebar>S</AppShellSidebar>
+        <AppShellMain>
+          <AppShellSidebarTrigger />
+        </AppShellMain>
+      </AppShell>,
+    );
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it('are silent for a shell with no sidebar: there is nothing to open', () => {
+    const warn = spyWarn();
+    render(
+      <AppShell>
+        <AppShellHeader>H</AppShellHeader>
+        <AppShellMain>M</AppShellMain>
+      </AppShell>,
+    );
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it('say that a trigger is outside an AppShell, and still render it', () => {
+    const warn = spyWarn();
+    render(<AppShellSidebarTrigger />);
+    expect(warnings(warn)).toEqual([
+      '[h2d-glass-ui] <AppShellSidebarTrigger> must be rendered inside <AppShell>.',
+    ]);
+    expect(trigger()).toBeInTheDocument();
+    // With nothing to open it does nothing, and does not throw.
+    expect(() => fireEvent.click(trigger())).not.toThrow();
+  });
+});
diff --git a/src/index.test.ts b/src/index.test.ts
index ee8cbfb..e120ac4 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -18,6 +18,7 @@ describe('public API', () => {
       'AppShellHeader',
       'AppShellMain',
       'AppShellSidebar',
+      'AppShellSidebarTrigger',
       'Avatar',
       'Badge',
       'Breadcrumb',
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/app-shell src/index.test.ts
pnpm vitest run --project scripts scripts/lib/app-shell-css.test.ts
```

Expected: FAIL.
- `AppShellSidebarTrigger.test.tsx`: 26 trong 28 test fail ở mỗi project React với `Element type is invalid … got: undefined`, vì `AppShellSidebarTrigger` chưa được export; 2 test pass.
- `buildAppShellCss > the rail and the trigger`: 4 test fail, ví dụ `.flg-app-shell[data-breakpoint='lg'][data-collapsed] has a rule: expected -1 to be >= 0`.
- `AppShell.test-d.ts`: lỗi kiểu ở danh sách khoá nhãn và ở hai test mới, `the trigger takes its name from the shell, and the header may leave it out` và `the shell takes its two states as controlled or uncontrolled`.
- `public API > exports exactly the documented components and nothing internal`: thiếu `AppShellSidebarTrigger`.
- Hai test có sẵn của `AppShell.test.tsx` được sửa cho trigger (`say that a part is not a direct child…` có thêm header; `say that a part is outside an AppShell…` dùng `sidebarTrigger={false}`). Báo cáo nháp không ghi kết quả của chúng trên cây cũ.

Story của task này không chạy ở bước này (phát hiện 13):
- Story rail viết sau CSS. Bản nháp thấy chúng fail bằng đột biến: đổi cột rail thành bề rộng sidebar thì `TriggerFoldsTheSidebar…` fail với `expected 264 to be close to 68`; đổi 226 thành 268 thì `TriggerKeepsTheHeaderInPlace` fail với `expected 268 to be close to 226`.
- `NotCollapsible…` và `TriggerNameFollowsTheWindow` pass ngay khi viết (test đặc tả).
- `NavEndAtTheBottom…` fail ở ba engine với `expected 507 to be close to 708` trước khi CSS của story được sửa. Chỗ sửa nằm trong patch test, nên trên cây của plan story này pass ngay sau Step 1.

- [ ] **Step 3: Viết code**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 6ce5e85..b2acbbd 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -178,6 +178,7 @@ const SHIPPED_CLASSES = [
   'flg-app-shell-main',
   'flg-app-shell-footer',
   'flg-app-shell-skip',
+  'flg-app-shell-trigger',
   'flg-app-shell-brand',
   'flg-app-shell-brand-logo',
   'flg-app-shell-brand-name',
@@ -214,6 +215,12 @@ const requirements: Array<[string, boolean]> = [
     /scroll-padding-top:\s*var\(--flg-app-shell-header-offset/.test(css) &&
       /body:has\(\.flg-app-shell\)/.test(css),
   ],
+  [
+    'ships the rail of the AppShell (the sidebar column narrows to the rail width)',
+    /\[data-collapsed\]\s*\{[^}]*grid-template-columns:\s*var\(--flg-app-shell-rail-width\)/.test(
+      css,
+    ),
+  ],
 ];
 const failed = requirements.filter(([, ok]) => !ok);
 for (const [label, ok] of requirements) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
diff --git a/scripts/lib/app-shell-css.ts b/scripts/lib/app-shell-css.ts
index f7a34eb..1a04ed2 100644
--- a/scripts/lib/app-shell-css.ts
+++ b/scripts/lib/app-shell-css.ts
@@ -5,7 +5,9 @@
  * `data-breakpoint` of the root. There is one boundary per breakpoint and the narrow screen is the
  * base (src/styles/components/app-shell.css), so no width falls between two rules.
  */
-export const APP_SHELL_BREAKPOINTS = { md: 768, lg: 1024, xl: 1280 } as const;
+import { APP_SHELL_BREAKPOINTS } from '../../src/components/app-shell/breakpoints';
+
+export { APP_SHELL_BREAKPOINTS };
 export type AppShellBreakpointName = keyof typeof APP_SHELL_BREAKPOINTS;
 
 /** The height of the header and of the first row of the grid on a wide screen. */
@@ -16,6 +18,9 @@ const SIDEBAR = '.flg-app-shell-sidebar';
 const PANEL = '.flg-app-shell-sidebar-panel';
 const MAIN = '.flg-app-shell-main';
 const FOOTER = '.flg-app-shell-footer';
+const HEAD = '.flg-app-shell-sidebar-head';
+const TRIGGER = '.flg-app-shell-trigger';
+const HEADER_BRAND = '.flg-app-shell-header-brand';
 
 /**
  * The rules for one breakpoint, without indentation. They are in the order the cascade needs: each
@@ -34,10 +39,23 @@ export function wideRules(breakpoint: AppShellBreakpointName): string {
 ${shell}:not(:has(> ${HEADER})) {
   --flg-app-shell-header-height: 0px;
 }
+/* The rail: the sidebar column narrows. It is not animated (spec §3.6): the columns of the grid
+   would lay the whole page out again on every frame. */
+${shell}[data-collapsed] {
+  grid-template-columns: var(--flg-app-shell-rail-width) minmax(0, 1fr);
+}
 ${shell} > ${HEADER} {
   gap: 8px;
   padding: 0 16px;
 }
+/* The trigger folds the sidebar, so a sidebar that cannot fold has no use for it here. */
+${shell}:not([data-collapsible]) ${TRIGGER} {
+  display: none;
+}
+/* The 4px that sets the brand off the trigger on a narrow screen is the search field's here. */
+${shell} > ${HEADER} > ${TRIGGER} + ${HEADER_BRAND} {
+  margin-left: 0;
+}
 ${shell} > ${MAIN} {
   grid-column: 2;
   padding: 28px 32px;
@@ -57,7 +75,7 @@ ${shell} > ${SIDEBAR} > ${PANEL} {
 ${sidebarLayout} > ${HEADER} {
   grid-column: 2;
 }
-${sidebarLayout} > ${HEADER} > .flg-app-shell-header-brand {
+${sidebarLayout} > ${HEADER} > ${HEADER_BRAND} {
   display: none;
 }
 ${sidebarLayout} > ${SIDEBAR} {
@@ -67,10 +85,27 @@ ${sidebarLayout} > ${SIDEBAR} > ${PANEL} {
   top: 0;
   max-height: 100dvh;
 }
-${sidebarLayout} > ${SIDEBAR} > ${PANEL} > .flg-app-shell-sidebar-head {
+${sidebarLayout} > ${SIDEBAR} > ${PANEL} > ${HEAD} {
   height: ${HEADER_HEIGHT};
   padding: 0 20px;
 }
+/* At the rail the head keeps only the mark, in the middle of the column. The name is the name of the
+   link, so it goes out of sight and not out of the page. */
+${sidebarLayout}[data-collapsed] > ${SIDEBAR} > ${PANEL} > ${HEAD} {
+  justify-content: center;
+  padding: 0;
+}
+${shell}[data-collapsed] ${HEAD} .flg-app-shell-brand-name {
+  position: absolute;
+  width: 1px;
+  height: 1px;
+  margin: -1px;
+  padding: 0;
+  overflow: hidden;
+  clip-path: inset(50%);
+  white-space: nowrap;
+  border: 0;
+}
 ${sidebarLayout} > ${FOOTER} {
   grid-column: 2;
   padding: 0 32px;
@@ -83,10 +118,14 @@ ${sidebarLayout} > ${FOOTER} {
 ${headerLayout} > ${HEADER} {
   grid-column: 1 / -1;
 }
-${headerLayout} > ${HEADER} > .flg-app-shell-header-brand {
+${headerLayout} > ${HEADER} > ${HEADER_BRAND} {
   flex: none;
   width: 268px;
 }
+/* Behind a trigger that is shown the cell is 34 + 8 narrower, so that what follows it stays put. */
+${headerLayout}[data-collapsible] > ${HEADER} > ${TRIGGER} + ${HEADER_BRAND} {
+  width: 226px;
+}
 ${headerLayout} > ${SIDEBAR} {
   grid-row: 2;
 }
@@ -94,7 +133,7 @@ ${headerLayout} > ${SIDEBAR} > ${PANEL} {
   top: var(--flg-app-shell-header-height);
   max-height: calc(100dvh - var(--flg-app-shell-header-height));
 }
-${headerLayout} > ${SIDEBAR} > ${PANEL} > .flg-app-shell-sidebar-head {
+${headerLayout} > ${SIDEBAR} > ${PANEL} > ${HEAD} {
   display: none;
 }
 ${headerLayout} > ${FOOTER} {
diff --git a/src/components/app-shell/AppShell.tsx b/src/components/app-shell/AppShell.tsx
index 68f7734..a2764cc 100644
--- a/src/components/app-shell/AppShell.tsx
+++ b/src/components/app-shell/AppShell.tsx
@@ -1,12 +1,28 @@
 'use client';
 
 import { clsx } from 'clsx';
-import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
+import {
+  forwardRef,
+  useCallback,
+  useContext,
+  useEffect,
+  useId,
+  useMemo,
+  useRef,
+  useState,
+} from 'react';
 import type { HTMLAttributes, ReactNode } from 'react';
+import { composeEventHandlers } from '../../internal/compose-event-handlers';
+import { dataAttr } from '../../internal/data-attr';
 import { hasContent } from '../../internal/has-content';
+import { MenuIcon } from '../../internal/icons';
 import { mergeRefs } from '../../internal/merge-refs';
+import { useControllableState } from '../../internal/use-controllable-state';
+import { useMediaQuery } from '../../internal/use-media-query';
 import { devWarn } from '../../internal/warn';
 import { withDefaults } from '../../internal/with-defaults';
+import type { ButtonProps } from '../button/Button';
+import { IconButton } from '../icon-button/IconButton';
 import { AppShellContext, PART_NAMES, useAppShellPart } from './app-shell-context';
 import type {
   AppShellBreakpoint,
@@ -15,6 +31,7 @@ import type {
   AppShellLayout,
   AppShellPart,
 } from './app-shell-context';
+import { wideQuery } from './breakpoints';
 import { useHeaderOffset } from './use-header-offset';
 
 export type { AppShellBreakpoint, AppShellLabels, AppShellLayout } from './app-shell-context';
@@ -26,16 +43,36 @@ export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
   breakpoint?: AppShellBreakpoint;
   /** Drawn at the head of the header and of the sidebar; `AppShellBrand` is made for it. */
   brand?: ReactNode;
+  /** Whether the sidebar can fold into a rail on a wide screen. Default `true`. */
+  collapsible?: boolean;
+  /** Whether the sidebar is a rail (wide screens). Controlled; ignored when not `collapsible`. */
+  collapsed?: boolean;
+  defaultCollapsed?: boolean;
+  onCollapsedChange?: (collapsed: boolean) => void;
+  /** Whether the sidebar is open as a sheet (narrow screens). Controlled. */
+  open?: boolean;
+  defaultOpen?: boolean;
+  onOpenChange?: (open: boolean) => void;
   /** Default English words; any of them can be replaced. */
   labels?: Partial<AppShellLabels>;
 };
-export type AppShellHeaderProps = HTMLAttributes<HTMLElement>;
+export type AppShellHeaderProps = HTMLAttributes<HTMLElement> & {
+  /** Draws the button that opens and folds the sidebar, before the brand. Default `true`. */
+  sidebarTrigger?: boolean;
+};
+export type AppShellSidebarTriggerProps = Omit<
+  ButtonProps,
+  'aria-label' | 'aria-labelledby' | 'children'
+>;
 export type AppShellSidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'>;
 export type AppShellMainProps = Omit<HTMLAttributes<HTMLElement>, 'id'>;
 export type AppShellFooterProps = HTMLAttributes<HTMLElement>;
 
 const DEFAULT_LABELS: AppShellLabels = {
   skipToContent: 'Skip to content',
+  openNavigation: 'Open navigation',
+  collapseSidebar: 'Collapse sidebar',
+  expandSidebar: 'Expand sidebar',
 };
 
 // A value outside the union is a mistake of a caller that TypeScript did not see (plain JavaScript,
@@ -51,9 +88,28 @@ const toBreakpoint = (breakpoint: unknown): AppShellBreakpoint =>
  * Beside the layout it gives the page two rules of its own, on pages that render it: the margin of
  * `<body>` is dropped, and the height of the header is written on `<html>` so that what is scrolled
  * to is not left under it (see the docs).
+ *
+ * It keeps two states, one for each kind of screen: `collapsed` (a rail, on a wide screen) and
+ * `open` (the sidebar as a sheet, on a narrow one). Both can be controlled, and neither changes when
+ * the window crosses the breakpoint.
  */
 export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
-  { layout, breakpoint, brand, labels, className, children, ...props },
+  {
+    layout,
+    breakpoint,
+    brand,
+    collapsible,
+    collapsed: collapsedProp,
+    defaultCollapsed,
+    onCollapsedChange,
+    open: openProp,
+    defaultOpen,
+    onOpenChange,
+    labels,
+    className,
+    children,
+    ...props
+  },
   ref,
 ) {
   const rootRef = useRef<HTMLDivElement>(null);
@@ -61,10 +117,41 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
   const sidebarId = useId();
   const [header, setHeader] = useState<HTMLElement | null>(null);
   const parts = useRef(new Map<AppShellPart, Set<HTMLElement>>());
+  const triggers = useRef(new Set<HTMLElement>());
   const shellLayout = toLayout(layout);
   const shellBreakpoint = toBreakpoint(breakpoint);
+  const canCollapse = collapsible !== false;
   const words = useMemo(() => withDefaults(DEFAULT_LABELS, labels), [labels]);
+  const isWide = useMediaQuery(wideQuery(shellBreakpoint));
+  const [collapsedState, setCollapsedState] = useControllableState({
+    value: collapsedProp,
+    defaultValue: defaultCollapsed ?? false,
+    onChange: onCollapsedChange,
+    name: 'AppShell `collapsed`',
+  });
+  const [open, setOpen] = useControllableState({
+    value: openProp,
+    defaultValue: defaultOpen ?? false,
+    onChange: onOpenChange,
+    name: 'AppShell `open`',
+  });
+  // A sidebar that cannot fold is never a rail, whatever `collapsed` says.
+  const collapsed = canCollapse && collapsedState;
+  const setCollapsed = useCallback(
+    (next: boolean) => {
+      if (canCollapse) setCollapsedState(next);
+    },
+    [canCollapse, setCollapsedState],
+  );
   useHeaderOffset(header);
+  const wantsRail = collapsedProp !== undefined || defaultCollapsed !== undefined;
+  useEffect(() => {
+    if (!canCollapse && wantsRail) {
+      devWarn(
+        '<AppShell> has `collapsed` or `defaultCollapsed` but `collapsible` is false: the sidebar cannot collapse, so they are ignored.',
+      );
+    }
+  }, [canCollapse, wantsRail]);
 
   const registerPart = useCallback((part: AppShellPart, element: HTMLElement) => {
     const elements = parts.current.get(part) ?? new Set<HTMLElement>();
@@ -83,11 +170,23 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
     };
   }, []);
 
+  const registerTrigger = useCallback((element: HTMLElement) => {
+    triggers.current.add(element);
+    return () => {
+      triggers.current.delete(element);
+    };
+  }, []);
+
   // The parts register in their own effects, which run before this one.
   useEffect(() => {
     if (!parts.current.get('main')?.size) {
       devWarn('<AppShell> has no <AppShellMain>: the skip link has nowhere to go.');
     }
+    if (parts.current.get('sidebar')?.size && !triggers.current.size) {
+      devWarn(
+        '<AppShell> has a sidebar but no <AppShellSidebarTrigger>: on narrow screens the navigation cannot be opened.',
+      );
+    }
   }, []);
 
   const context = useMemo<AppShellContextValue>(
@@ -95,13 +194,35 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
       layout: shellLayout,
       breakpoint: shellBreakpoint,
       labels: words,
+      isWide,
+      collapsible: canCollapse,
+      collapsed,
+      setCollapsed,
+      open,
+      setOpen,
       brand,
       mainId,
       sidebarId,
       registerPart,
+      registerTrigger,
       setHeader,
     }),
-    [shellLayout, shellBreakpoint, words, brand, mainId, sidebarId, registerPart],
+    [
+      shellLayout,
+      shellBreakpoint,
+      words,
+      isWide,
+      canCollapse,
+      collapsed,
+      setCollapsed,
+      open,
+      setOpen,
+      brand,
+      mainId,
+      sidebarId,
+      registerPart,
+      registerTrigger,
+    ],
   );
   const mergedRef = useMemo(() => mergeRefs(ref, rootRef), [ref]);
 
@@ -112,6 +233,9 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
         className={clsx('flg-app-shell', className)}
         data-layout={shellLayout}
         data-breakpoint={shellBreakpoint}
+        data-collapsible={dataAttr(canCollapse)}
+        data-collapsed={dataAttr(collapsed)}
+        data-open={dataAttr(open)}
         {...props}
       >
         <a className="flg-app-shell-skip flg-visually-hidden" href={`#${mainId}`}>
@@ -124,11 +248,13 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
 });
 
 /**
- * The banner of the page, sticky at the top. The brand comes first, then what the caller puts in it.
- * Where the sidebar runs the full height, the brand is in the sidebar on a wide screen and not here.
+ * The banner of the page, sticky at the top. It draws the button that opens and folds the sidebar,
+ * then the brand, then what the caller puts in it: in that order, so the Tab key goes the way the eye
+ * does. Where the sidebar runs the full height, the brand is in the sidebar on a wide screen and not
+ * here.
  */
 export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(function AppShellHeader(
-  { className, children, ...props },
+  { sidebarTrigger = true, className, children, ...props },
   ref,
 ) {
   const own = useRef<HTMLElement>(null);
@@ -141,6 +267,7 @@ export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(funct
       className={clsx('flg-surface flg-app-shell-header', className)}
       {...props}
     >
+      {sidebarTrigger ? <AppShellSidebarTrigger /> : null}
       {hasContent(context?.brand) ? (
         <span className="flg-app-shell-header-brand">{context?.brand}</span>
       ) : null}
@@ -149,6 +276,61 @@ export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(funct
   );
 });
 
+/**
+ * One button for the two things a sidebar does: on a narrow screen it opens the navigation, on a wide
+ * one it folds the sidebar into a rail and back. Which it is only the window knows, and the server
+ * does not, so the first render is the narrow one and a wide screen renames the button after
+ * hydration (spec §3.5). `AppShellHeader` draws it; `sidebarTrigger={false}` leaves it to the caller.
+ * With `collapsible={false}` the CSS hides it on a wide screen, where there is nothing for it to do.
+ */
+export const AppShellSidebarTrigger = forwardRef<HTMLButtonElement, AppShellSidebarTriggerProps>(
+  function AppShellSidebarTrigger({ className, onClick, ...props }, ref) {
+    const context = useContext(AppShellContext);
+    const own = useRef<HTMLButtonElement>(null);
+    const register = context?.registerTrigger;
+    const mergedRef = useMemo(() => mergeRefs<HTMLButtonElement>(ref, own), [ref]);
+    useEffect(() => {
+      const element = own.current;
+      if (!element) return undefined;
+      if (!register) {
+        devWarn('<AppShellSidebarTrigger> must be rendered inside <AppShell>.');
+        return undefined;
+      }
+      return register(element);
+    }, [register]);
+
+    const labels = context?.labels ?? DEFAULT_LABELS;
+    const rail = context?.isWide === true;
+    const collapsed = context?.collapsed === true;
+    const name = rail
+      ? collapsed
+        ? labels.expandSidebar
+        : labels.collapseSidebar
+      : labels.openNavigation;
+    const toggle = () => {
+      if (!context) return;
+      if (context.isWide) context.setCollapsed(!context.collapsed);
+      else context.setOpen(!context.open);
+    };
+
+    return (
+      <IconButton
+        variant="ghost"
+        size="md"
+        {...props}
+        ref={mergedRef}
+        className={clsx('flg-app-shell-trigger', className)}
+        aria-label={name}
+        aria-expanded={rail ? !collapsed : context?.open === true}
+        aria-controls={context?.sidebarId}
+        onClick={composeEventHandlers(onClick, toggle)}
+      >
+        <MenuIcon />
+      </IconButton>
+    );
+  },
+);
+
 /**
  * The navigation column. It is not a landmark; the `Nav` inside it is. The element is the cell of the
  * grid and has no look of its own: the glass is the panel in it, which is the part that sticks. A
diff --git a/src/components/app-shell/app-shell-context.ts b/src/components/app-shell/app-shell-context.ts
index e265525..d18d697 100644
--- a/src/components/app-shell/app-shell-context.ts
+++ b/src/components/app-shell/app-shell-context.ts
@@ -9,6 +9,12 @@ export type AppShellBreakpoint = 'md' | 'lg' | 'xl';
 export interface AppShellLabels {
   /** The text of the skip link, the first thing a keyboard reaches. */
   skipToContent: string;
+  /** The name of the trigger on a narrow screen, where it opens the navigation. */
+  openNavigation: string;
+  /** The name of the trigger on a wide screen while the sidebar is expanded. */
+  collapseSidebar: string;
+  /** The name of the trigger on a wide screen while the sidebar is a rail. */
+  expandSidebar: string;
 }
 
 /** The parts the shell lays out; each of them is a cell of its grid. */
@@ -21,17 +27,32 @@ export const PART_NAMES: Record<AppShellPart, string> = {
   footer: 'AppShellFooter',
 };
 
-/** What the shell hands to its parts: the ids they point at, the brand to draw, and the registry. */
+/** What the shell hands to its parts: the ids they point at, the brand to draw, its state and the registry. */
 export interface AppShellContextValue {
   layout: AppShellLayout;
   breakpoint: AppShellBreakpoint;
   labels: AppShellLabels;
+  /**
+   * Whether the window is at least as wide as the breakpoint. It is `false` on the server and while
+   * hydrating, so the first render is the narrow one the HTML was written for.
+   */
+  isWide: boolean;
+  /** Whether the sidebar can fold into a rail on a wide screen. */
+  collapsible: boolean;
+  /** Whether the sidebar is a rail; always `false` when it is not `collapsible`. */
+  collapsed: boolean;
+  setCollapsed: (collapsed: boolean) => void;
+  /** Whether the sidebar is open as a sheet on a narrow screen. */
+  open: boolean;
+  setOpen: (open: boolean) => void;
   /** Drawn twice, at the head of the header and at the head of the sidebar; CSS shows one. */
   brand: ReactNode;
   mainId: string;
   sidebarId: string;
   /** Tells the shell that a part is mounted, for the dev warnings; returns the way to take it back. */
   registerPart: (part: AppShellPart, element: HTMLElement) => () => void;
+  /** Tells the shell that a trigger is mounted, so focus can go back to it; returns the way to take it back. */
+  registerTrigger: (element: HTMLElement) => () => void;
   /** The header element, which the shell measures; `null` when there is none. */
   setHeader: (element: HTMLElement | null) => void;
 }
diff --git a/src/components/app-shell/breakpoints.ts b/src/components/app-shell/breakpoints.ts
new file mode 100644
index 0000000..3f5a1e8
--- /dev/null
+++ b/src/components/app-shell/breakpoints.ts
@@ -0,0 +1,16 @@
+import type { AppShellBreakpoint } from './app-shell-context';
+
+/**
+ * The widths from which the sidebar is in the grid. The CSS of the wide screen is generated from the
+ * same numbers (scripts/lib/app-shell-css.ts), and the shell asks the window the same question
+ * (`useMediaQuery`), so what the script knows and what the stylesheet draws cannot disagree.
+ */
+export const APP_SHELL_BREAKPOINTS: Record<AppShellBreakpoint, number> = {
+  md: 768,
+  lg: 1024,
+  xl: 1280,
+};
+
+/** The media query of a wide screen for a breakpoint, the one the generated CSS uses. */
+export const wideQuery = (breakpoint: AppShellBreakpoint) =>
+  `(min-width: ${APP_SHELL_BREAKPOINTS[breakpoint]}px)`;
diff --git a/src/components/app-shell/index.ts b/src/components/app-shell/index.ts
index 7836770..60b5b18 100644
--- a/src/components/app-shell/index.ts
+++ b/src/components/app-shell/index.ts
@@ -4,6 +4,7 @@ export {
   AppShellHeader,
   AppShellMain,
   AppShellSidebar,
+  AppShellSidebarTrigger,
 } from './AppShell';
 export type {
   AppShellBreakpoint,
@@ -14,6 +15,7 @@ export type {
   AppShellMainProps,
   AppShellProps,
   AppShellSidebarProps,
+  AppShellSidebarTriggerProps,
 } from './AppShell';
 export { AppShellBrand } from './AppShellBrand';
 export type { AppShellBrandProps } from './AppShellBrand';
diff --git a/src/index.ts b/src/index.ts
index 4ba2db0..114cba2 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -265,6 +265,7 @@ export {
   AppShellHeader,
   AppShellMain,
   AppShellSidebar,
+  AppShellSidebarTrigger,
 } from './components/app-shell';
 export type {
   AppShellBrandProps,
@@ -276,4 +277,5 @@ export type {
   AppShellMainProps,
   AppShellProps,
   AppShellSidebarProps,
+  AppShellSidebarTriggerProps,
 } from './components/app-shell';
diff --git a/src/styles/components/app-shell.css b/src/styles/components/app-shell.css
index cb4ec0f..ca62482 100644
--- a/src/styles/components/app-shell.css
+++ b/src/styles/components/app-shell.css
@@ -61,6 +61,17 @@
     display: inline-flex;
     min-width: 0;
   }
+  /* The button that opens the sidebar (narrow) or folds it (wide). A shell without a sidebar has
+     nothing for it to do. The brand stands 4px off it on a narrow screen, 8px with the gap. */
+  .flg-app-shell-trigger {
+    flex: none;
+  }
+  .flg-app-shell:not(:has(> .flg-app-shell-sidebar)) .flg-app-shell-trigger {
+    display: none;
+  }
+  .flg-app-shell-trigger + .flg-app-shell-header-brand {
+    margin-left: 4px;
+  }
 
   /* The sidebar is the cell of the grid, with no look of its own; the glass is its panel, the part
      that sticks (a sticky box is held by its parent, which here fills the cell). */
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/app-shell src/index.test.ts
pnpm vitest run --project scripts
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm build && pnpm check:package
pnpm build-storybook
```

Expected:
- Unit: 169 test PASS (hai project React cộng lại, kể cả 6 test kiểu và `index.test.ts`), không lỗi kiểu.
- `scripts`: 77 test PASS, trong đó 10 test của `app-shell-css.test.ts`.
- Story app-shell: 75 test PASS ở mỗi project (25 story × ba engine). axe chạy sau play function, không có vi phạm.
- `pnpm build && pnpm check:package`: PASS trọn (exit 0). `check:use-client` thấy build output của `use-media-query`; `check:dist-css` thấy `flg-app-shell-trigger` và quy tắc cột rail; `check:rsc`, `check:publint`, `check:types` pass; `size`: JS 48.89 kB trên 51.71 kB, CSS 13.89 kB trên 14.05 kB (còn 161 B). Không chạy `size:record`.
- `pnpm build-storybook`: PASS. Sáu story AppShell không gắn `no-visual`: `Sidebar`, `Header`, `SidebarRail`, `HeaderRail`, `SidebarPhone`, `HeaderPhone` (123 story có ảnh).
- Ảnh chuẩn của component cũ giữ nguyên (phát hiện 15).

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/app-shell-demo.tsx \
  scripts/check-dist-css.ts \
  scripts/lib/app-shell-css.test.ts \
  scripts/lib/app-shell-css.ts \
  src/components/app-shell/AppShell.stories.tsx \
  src/components/app-shell/AppShell.test-d.ts \
  src/components/app-shell/AppShell.test.tsx \
  src/components/app-shell/AppShell.tsx \
  src/components/app-shell/AppShellSidebarTrigger.test.tsx \
  src/components/app-shell/app-shell-context.ts \
  src/components/app-shell/breakpoints.ts \
  src/components/app-shell/index.ts \
  src/index.test.ts \
  src/index.ts \
  src/styles/components/app-shell.css
```
```bash
git commit -m "feat(app-shell): add the sidebar trigger, the rail and the open state" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: Tấm trượt ở màn hẹp

Spec §1 (dòng Tấm trượt trên màn hẹp), §3.4 (cả mục, trừ việc kích hoạt một `NavItem` thì đóng tấm), §3.5 (dòng Tấm trượt), §3.6 (dòng tấm trượt và lớp nền), §4.3 **AppShell** (Sidebar "Hàng đầu": hàng của tấm trượt và nút ×; Tấm trượt; cột "Hẹp, tấm mở" của "Brand ở đâu"), §4.5 (tấm trượt và lớp nền), §5 (cảnh báo Toaster; `setOpen` của context), §6.3 (Cấu trúc khi mở; phần tấm trượt của Bàn phím; Tấm trượt), §7 lớp 1–3 của tấm trượt, §10 (`inert`, `aria-modal`, `Toaster`). Báo cáo và code của Task 3 là điểm bắt đầu.
- **Hành vi modal** trong một layout effect theo `open && !isWide`: `inert` (thuộc tính DOM) cho skip link, header, main, footer; `lockScroll`; focus vào phần tử đầu của sidebar; Esc với ba ngoại lệ; trả focus khi đóng (phát hiện 9).
- **Các phần được tìm bằng `:scope >`**, không bằng registry; `registerPart` chặn một phần mount trong lúc tấm mở (phát hiện 9).
- **Ngữ nghĩa**: sidebar `role="dialog"` và `aria-label` chỉ khi là tấm trượt, không có `aria-modal`.
- **Nút ×** ở hàng đầu của sidebar, chỉ khi là tấm trượt (S1 sau brand, S2 trước brand); **lớp nền** là con cuối của gốc.
- **Đổi cỡ màn**: cửa sổ vượt điểm gãy lên màn rộng thì đóng tấm, một lần mỗi lần vượt (phát hiện 9).
- **`setOpen(open, { returnFocus, opener })`** trong context (phát hiện 9); spec §5 được sửa.
- **CSS**: `sheetRules` trong các khối `@media not all and (min-width: N)` (phát hiện 7): ô `position: fixed`, rộng `min(300px, 100vw - 48px)`, `z-index: 5`, bo góc phải; S1 brand lùi vào 8px; lớp nền `z-index: 4` với `--flg-scrim` và blur; trượt vào và mờ dần lên qua `@starting-style`, không có animation lúc đóng. Giảm chuyển động không cần quy tắc riêng: token thời lượng về 0.
- **Cảnh báo** khi `Toaster` nằm trong một phần bị `inert`.
- **Story:** `SidebarPhoneOpen`, `HeaderPhoneOpen` là story giao diện (`viewport-390x844`, mở trong play function, phát hiện 10). `SheetSidebarLayout`, `SheetHeaderLayout`, `SheetOnTheNarrowestPhone`, `SheetClosesSidebarLayout`, `SheetClosesHeaderLayout`, `SheetFollowsTheWindow`, `ControlledSheetAtWide`, `ToastsOverTheSheet` gắn `no-visual`, chạy ở 390×844 qua `withViewport`.
- Helper test `tests/app-shell-window.ts`; test cũ "keeps each state when the mode changes" thành `keeps a rail a rail when the mode changes, and a wide window closes an open sheet`.
- Cuối task, `check:package` PASS, CSS còn 20 B dưới ngưỡng cũ (phát hiện 12).

**Files:**
- Create: `src/components/app-shell/AppShellDrawer.test.tsx`, `tests/app-shell-window.ts`
- Modify: `src/components/app-shell/AppShell.tsx`, `app-shell-context.ts`, `AppShell.stories.tsx`, `AppShell.test-d.ts`, `AppShellSidebarTrigger.test.tsx`, `src/styles/components/app-shell.css`, `scripts/lib/app-shell-css.ts`, `scripts/lib/app-shell-css.test.ts`, `scripts/check-dist-css.ts`, `.storybook/app-shell-demo.tsx`, `docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md`

**Interfaces:**
- `app-shell-context.ts`:
  - `interface AppShellSetOpenOptions { returnFocus?: boolean; opener?: HTMLElement | null }` (nội bộ, không export ra ngoài package).
  - `AppShellContextValue.setOpen: (open: boolean, options?: AppShellSetOpenOptions) => void`. `returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, không có thì trigger đầu tiên còn hiện. `opener` chỉ `AppShellSidebarTrigger` truyền, khi mở. Lần đóng do đổi cỡ màn dùng `returnFocus: false`. `NavItem` của Plan B gọi `setOpen(false)` (focus về trigger, spec §3.4).
  - `AppShellLabels` thêm `navigation` (`'Navigation'`) và `closeNavigation` (`'Close navigation'`).
- DOM khi tấm mở ở màn hẹp:
  - Ô sidebar: `role="dialog"`, `aria-label` (`labels.navigation`), đặt trước `{...props}`; không có `aria-modal`.
  - `button.flg-app-shell-sidebar-close` (IconButton `ghost` `md`, `CloseIcon`, `aria-label` `labels.closeNavigation`) trong `.flg-app-shell-sidebar-head`.
  - `div.flg-app-shell-scrim[aria-hidden="true"]`, con cuối của gốc.
  - Thuộc tính DOM `inert` trên skip link, header, main, footer.
- Produces trong `scripts/lib/app-shell-css.ts`: `sheetRules(breakpoint): string`. `buildAppShellCss()` giờ viết ba khối `@media (min-width: N)` rồi ba khối `@media not all and (min-width: N)`.
- CSS phần chung: `.flg-app-shell-sidebar-close { flex: none; --flg-button-icon: 18px }`, S1 `margin-left: auto`; `.flg-app-shell-scrim { display: none }` (lớp nền chưa có kiểu sẽ thành một ô của lưới).
- Cảnh báo dev: `<Toaster> is inside a part of <AppShell> that goes inert while the navigation is open, so its toasts cannot be reached. Render it outside <AppShell> or as its direct child.`
- Danh sách kiểm tra gói: `scripts/check-dist-css.ts` thêm `flg-app-shell-sidebar-close`, `flg-app-shell-scrim`, và một kiểm tra khối tấm trượt (`not all and (width>=1024px)` có lớp nền `position: fixed`).
- Helper test `tests/app-shell-window.ts`: `stubWindow(initiallyWide: boolean)` (giả `matchMedia`; gỡ bằng `vi.unstubAllGlobals()`), `resize(toWide: boolean)`.
- Ứng dụng mẫu: nav trong tấm trượt cách hàng đầu 8px (`.flg-app-shell-sidebar[role='dialog'] .demo-nav`).
- Consumes: `focusFirst`, `returnFocus` (`src/internal/focus`), `lockScroll`, `getTopModal`, `useIsoLayoutEffect`, `CloseIcon`, `IconButton`; trong story: `Toaster`, `toast`, `realUserEvent`, `settled`, `APP_SHELL_BREAKPOINTS`.
- Plan B dùng: `NavItem` đọc `isWide`, `collapsed` và `open`, và gọi `setOpen(false)` để đóng tấm (§3.4: focus về trigger). Phát hiện 17 ghi một tên test nói khác.

- [ ] **Step 1: Viết test**

```diff
diff --git a/.storybook/app-shell-demo.tsx b/.storybook/app-shell-demo.tsx
index 636f8a0..4d58e44 100644
--- a/.storybook/app-shell-demo.tsx
+++ b/.storybook/app-shell-demo.tsx
@@ -32,6 +32,7 @@ const CSS = `
 .demo-avatar-button > .flg-avatar { --flg-avatar-size: 30px; }
 
 .demo-nav { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 12px 12px 12px; }
+.flg-app-shell-sidebar[role='dialog'] .demo-nav { padding-top: 8px; }
 .demo-nav ul { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
 .demo-item { appearance: none; box-sizing: border-box; width: 100%; margin: 0; border: 0; background: none; font: inherit; text-align: left; cursor: pointer; position: relative; display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 10px; border-radius: var(--flg-radius-md); color: var(--flg-text); text-decoration: none; font-size: var(--flg-text-sm); font-weight: var(--flg-weight-medium); white-space: nowrap; }
 .demo-item > svg { flex: none; width: 18px; height: 18px; color: var(--flg-text-muted); }
diff --git a/scripts/lib/app-shell-css.test.ts b/scripts/lib/app-shell-css.test.ts
index b72d053..765fad7 100644
--- a/scripts/lib/app-shell-css.test.ts
+++ b/scripts/lib/app-shell-css.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, it } from 'vitest';
-import { APP_SHELL_BREAKPOINTS, buildAppShellCss, wideRules } from './app-shell-css';
+import { APP_SHELL_BREAKPOINTS, buildAppShellCss, sheetRules, wideRules } from './app-shell-css';
 
 const flat = (text: string) => text.replace(/\s+/g, ' ').trim();
 
@@ -24,7 +24,10 @@ function mediaBlocks(css: string): Array<[string, string]> {
 
 describe('buildAppShellCss', () => {
   const css = buildAppShellCss();
-  const blocks = mediaBlocks(css);
+  const all = mediaBlocks(css);
+  // The wide screens come first, then the narrow ones, where the sidebar is a sheet.
+  const blocks = all.filter(([query]) => query.startsWith('(min-width'));
+  const sheets = all.filter(([query]) => query.startsWith('not all'));
 
   it('writes one min-width block per breakpoint, narrowest first, inside the components layer', () => {
     expect(APP_SHELL_BREAKPOINTS).toEqual({ md: 768, lg: 1024, xl: 1280 });
@@ -39,6 +42,13 @@ describe('buildAppShellCss', () => {
   it('has one boundary per breakpoint: no max-width, no second bound', () => {
     expect(css).not.toContain('max-width');
     for (const [query] of blocks) expect(query).not.toMatch(/\band\b|,/);
+    // The sheet is "not this width or more", with the same number, never the width below it.
+    expect(sheets.map(([query]) => query)).toEqual([
+      'not all and (min-width: 768px)',
+      'not all and (min-width: 1024px)',
+      'not all and (min-width: 1280px)',
+    ]);
+    expect(all).toHaveLength(6);
     expect(css).not.toMatch(/1023|767|1279/);
   });
 
@@ -84,6 +94,56 @@ describe('buildAppShellCss', () => {
     expect(rule(`${shell} > .flg-app-shell-sidebar`)).not.toContain('position: sticky');
   });
 
+  describe('the sheet', () => {
+    const body = sheetRules('lg');
+    const shell = ".flg-app-shell[data-breakpoint='lg'][data-open]";
+    const rule = (selector: string) => {
+      const start = body.indexOf(`${selector} {`);
+      expect(start, `${selector} has a rule`).toBeGreaterThanOrEqual(0);
+      return body.slice(start, body.indexOf('}', start));
+    };
+
+    it('is written once per breakpoint, for an open root only', () => {
+      expect(sheets).toHaveLength(3);
+      for (const [index, name] of (['md', 'lg', 'xl'] as const).entries()) {
+        expect(flat(sheets[index]![1])).toBe(flat(sheetRules(name)));
+        const roots = new Set(sheets[index]![1].match(/data-breakpoint='[a-z]+'\]\[data-open\]/g));
+        expect([...roots]).toEqual([`data-breakpoint='${name}'][data-open]`]);
+      }
+    });
+
+    it('turns the cell into a fixed layer above the scrim, as wide as the drawer or the screen less 48px', () => {
+      const cell = rule(`${shell} > .flg-app-shell-sidebar`);
+      expect(cell).toContain('position: fixed');
+      expect(cell).toContain('z-index: 5');
+      expect(cell).toContain('width: min(var(--flg-app-shell-drawer-width), calc(100vw - 48px))');
+      expect(cell).toContain('transition: translate var(--flg-duration-normal) var(--flg-ease)');
+      expect(rule(`${shell} > .flg-app-shell-scrim`)).toContain('z-index: 4');
+    });
+
+    it('rounds the edge of the panel that the page can be seen past, and no other', () => {
+      expect(rule(`${shell} > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel`)).toContain(
+        'border-radius: 0 var(--flg-radius-lg) var(--flg-radius-lg) 0',
+      );
+    });
+
+    it('moves the brand of an S1 head in by 8px, and has no such rule for S2', () => {
+      expect(
+        rule(
+          `${shell}[data-layout='sidebar'] > .flg-app-shell-sidebar > .flg-app-shell-sidebar-panel > .flg-app-shell-sidebar-head`,
+        ),
+      ).toContain('padding-left: 18px');
+      expect(body).not.toContain("[data-layout='header']");
+    });
+
+    it('slides the sheet in and fades the scrim in, through @starting-style, and has no exit', () => {
+      const start = body.slice(body.indexOf('@starting-style'));
+      expect(start).toContain('translate: -100% 0');
+      expect(start).toContain('opacity: 0');
+      expect(body).not.toMatch(/@keyframes|animation:/);
+    });
+  });
+
   it('keeps the header out from under the scroll with the wide fallback of 60px', () => {
     for (const [, body] of blocks) {
       expect(body).toMatch(
diff --git a/src/components/app-shell/AppShell.stories.tsx b/src/components/app-shell/AppShell.stories.tsx
index 6de16cf..f216257 100644
--- a/src/components/app-shell/AppShell.stories.tsx
+++ b/src/components/app-shell/AppShell.stories.tsx
@@ -1,9 +1,13 @@
 import type { Meta, StoryObj } from '@storybook/react-vite';
-import { expect, waitFor } from 'storybook/test';
+import { expect, userEvent, waitFor, within } from 'storybook/test';
 import { DemoPage } from '../../../.storybook/app-shell-demo';
-import { realUserEvent } from '../../../.storybook/real-input';
+import { realUserEvent, settled } from '../../../.storybook/real-input';
+import type { RealUserEvent } from '../../../.storybook/real-input';
 import { afterLayout, withViewport } from '../../../.storybook/viewport';
+import { Toaster } from '../toast/Toaster';
+import { toast } from '../toast/toast';
 import { AppShell } from './AppShell';
+import { APP_SHELL_BREAKPOINTS } from './breakpoints';
 
 // The stories of the frame draw the application of the mockup (Lumen) on a whole page: stage `page`,
 // so a sticky header sticks to the document as it does in an application. The two that look like the
@@ -626,3 +630,355 @@ export const TriggerNameFollowsTheWindow: Story = {
     });
   },
 };
+
+// ---------------------------------------------------------------------------------------------------
+// The sidebar as a sheet on a narrow screen (spec §3.4, §4.3).
+
+const PHONE = { width: 390, height: 844 };
+const root = () => part('.flg-app-shell');
+const cell = () => part('.flg-app-shell-sidebar');
+const scrim = () => part('.flg-app-shell-scrim');
+const isOpen = () => root().hasAttribute('data-open');
+const at = (x: number, y: number) => document.elementFromPoint(x, y);
+const SHUT_OUT = [
+  '.flg-app-shell-skip',
+  '.flg-app-shell-header',
+  '.flg-app-shell-main',
+  '.flg-app-shell-footer',
+];
+
+/** Opens the sheet with the trigger, by a click the browser trusts, and waits until it has slid in. */
+async function openSheet(real: RealUserEvent) {
+  await real.click(trigger());
+  await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
+  await settled(cell());
+}
+
+/** Waits until the sheet is gone: the root is no longer open and the page is free again. */
+async function expectClosed() {
+  await waitFor(() => expect(isOpen()).toBe(false));
+  await expect(document.querySelector('.flg-app-shell-scrim')).toBeNull();
+  await expect(cell()).not.toHaveAttribute('role');
+  for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(false);
+  await expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
+}
+
+/**
+ * The sheet as the mockup draws it, and what it shuts out: 300px wide (the screen less 48px when that
+ * is less), from the top to the bottom of the screen, above the scrim, which is above the header; a
+ * dialog with a name and no `aria-modal`; the rest of the frame is inert, so a pointer press at the
+ * header goes to the scrim and Tab never leaves the sidebar; focus goes in; the page does not scroll.
+ */
+function checkSheet(layout: 'sidebar' | 'header') {
+  return async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(PHONE.width, PHONE.height);
+      // Closed: out of the layout, and no dialog.
+      await expect(getComputedStyle(cell()).display).toBe('none');
+      await expect(cell()).not.toHaveAttribute('role');
+      await expect(document.querySelector('.flg-app-shell-scrim')).toBeNull();
+
+      await openSheet(real);
+      const box = cell().getBoundingClientRect();
+      await expect(getComputedStyle(cell()).position).toBe('fixed');
+      near(box.left, 0);
+      near(box.top, 0);
+      near(box.width, 300);
+      near(box.height, window.innerHeight);
+      await expect(cell()).toHaveAttribute('aria-label', 'Navigation');
+      await expect(cell()).not.toHaveAttribute('aria-modal');
+      // The head is 56px, with the brand and the button that closes the sheet.
+      const head = part('.flg-app-shell-sidebar-head');
+      near(head.getBoundingClientRect().height, 56);
+      const closeButton = part('.flg-app-shell-sidebar-close');
+      await expect(closeButton).toHaveAccessibleName('Close navigation');
+      near(closeButton.getBoundingClientRect().width, 34);
+      const brand = part('.flg-app-shell-sidebar-head .flg-app-shell-brand');
+      if (layout === 'sidebar') {
+        // S1: the brand stands at 18px, the button at the end of the head.
+        near(brand.getBoundingClientRect().left, 18);
+        near(closeButton.getBoundingClientRect().right, 300 - 10 - 1);
+      } else {
+        // S2: the button where the trigger is, the brand where the header's brand is.
+        near(closeButton.getBoundingClientRect().left, 10);
+        near(brand.getBoundingClientRect().left, 52);
+      }
+      // The glass is round where the page shows past it.
+      const panel = part('.flg-app-shell-sidebar-panel');
+      await expect(getComputedStyle(panel).borderTopRightRadius).not.toBe('0px');
+      await expect(getComputedStyle(panel).borderTopLeftRadius).toBe('0px');
+
+      // The scrim covers the screen, under the sheet and over the header.
+      const veil = scrim().getBoundingClientRect();
+      near(veil.width, PHONE.width);
+      near(veil.height, window.innerHeight);
+      await expect(at(350, 400)).toBe(scrim());
+      await expect(at(350, 28)).toBe(scrim());
+      await expect(cell().contains(at(150, 300))).toBe(true);
+
+      // The rest of the frame is inert, in the engine's own reckoning.
+      for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(true);
+      await expect(cell().inert).toBe(false);
+
+      // Focus went in: the first thing in the sidebar.
+      const first = cell().querySelector<HTMLElement>('a[href], button')!;
+      await expect(first).toHaveFocus();
+
+      // Tab, and Shift+Tab, stay in the sidebar, or leave the page; never reach what is inert.
+      const seen = new Set<Element>();
+      const stays = async () => {
+        const active = document.activeElement;
+        await expect(active === document.body || cell().contains(active)).toBe(true);
+        if (active && active !== document.body) seen.add(active);
+      };
+      for (let press = 0; press < 14; press += 1) {
+        await real.keyboard('{Tab}');
+        await stays();
+      }
+      for (let press = 0; press < 14; press += 1) {
+        await real.keyboard('{Shift>}{Tab}{/Shift}');
+        await stays();
+      }
+      await expect(seen.size).toBeGreaterThan(2);
+    });
+  };
+}
+
+export const SheetSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" rows={20} />,
+  play: checkSheet('sidebar'),
+};
+export const SheetHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" rows={20} />,
+  play: checkSheet('header'),
+};
+
+/** A narrow screen has no room for 300px and a strip of the scrim: the sheet is the screen less 48px. */
+export const SheetOnTheNarrowestPhone: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" />,
+  play: async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(320, PHONE.height);
+      await openSheet(real);
+      near(cell().getBoundingClientRect().width, 320 - 48);
+      await expect(at(310, 400)).toBe(scrim());
+    });
+  },
+};
+
+/**
+ * Esc, a press on the scrim and the button each close the sheet and give the focus back to the
+ * trigger that opened it; the page does not scroll while the sheet is open (PageDown pressed in it
+ * moves nothing, and does move the page once it is closed); a drag that starts on the text of the
+ * sidebar and ends on the scrim closes nothing.
+ */
+function checkSheetCloses() {
+  return async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(PHONE.width, PHONE.height);
+      const pageScrolls = () => document.documentElement.scrollHeight > window.innerHeight;
+      await expect(pageScrolls()).toBe(true);
+
+      const ways: Array<[string, () => Promise<void>]> = [
+        ['Esc', () => real.keyboard('{Escape}')],
+        [
+          'the scrim',
+          () => real.click(scrim(), { position: { x: 350, y: 400 } } as Record<string, unknown>),
+        ],
+        ['the button', () => real.click(part('.flg-app-shell-sidebar-close'))],
+      ];
+      for (const [name, close] of ways) {
+        await openSheet(real);
+        await expect(getComputedStyle(document.documentElement).overflow, name).toBe('hidden');
+        await close();
+        await expectClosed();
+        await waitFor(() => expect(trigger(), name).toHaveFocus());
+      }
+
+      // A page that is locked does not scroll; one that is not does (so the first proves something).
+      await openSheet(real);
+      await real.keyboard('{PageDown}');
+      // A key scrolls smoothly, so give it the time it would take before saying nothing moved.
+      await new Promise((resolve) => setTimeout(resolve, 400));
+      await expect(window.scrollY).toBe(0);
+      await real.keyboard('{Escape}');
+      await expectClosed();
+      await real.keyboard('{PageDown}');
+      await waitFor(() => expect(window.scrollY).toBeGreaterThan(0));
+      window.scrollTo(0, 0);
+      await afterLayout();
+
+      // A selection that begins in the sidebar and ends on the scrim is not a press on the scrim.
+      await openSheet(real);
+      const text = part('.flg-app-shell-sidebar .demo-section');
+      await real.dragAndDrop(text, scrim(), {
+        targetPosition: { x: 350, y: 400 },
+      } as Record<string, unknown>);
+      await afterLayout();
+      await expect(isOpen()).toBe(true);
+      await expect(cell()).toHaveAttribute('role', 'dialog');
+      await real.keyboard('{Escape}');
+      await expectClosed();
+    });
+  };
+}
+
+export const SheetClosesSidebarLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" rows={20} />,
+  play: checkSheetCloses(),
+};
+export const SheetClosesHeaderLayout: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="header" rows={20} />,
+  play: checkSheetCloses(),
+};
+
+/**
+ * A window that grows wide closes an open sheet (`onOpenChange(false)`): the scrim, the dialog and
+ * the lock are gone, the frame is in the grid again, and the trigger folds the sidebar. A parent that
+ * owns `open` and keeps it true at that size has the ordinary wide frame, and the sheet is back when
+ * the window narrows.
+ */
+export const SheetFollowsTheWindow: Story = {
+  tags: ['no-visual'],
+  render: () => <DemoPage layout="sidebar" />,
+  play: async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(PHONE.width, PHONE.height);
+      await openSheet(real);
+      await viewport.set(WIDE.width, WIDE.height);
+      await expectClosed();
+      await waitFor(() => expect(trigger()).toHaveAccessibleName('Collapse sidebar'));
+      near(cell().getBoundingClientRect().width, SIDEBAR_WIDE);
+      await expect(getComputedStyle(part('.flg-app-shell-sidebar-panel')).position).toBe('sticky');
+      // Narrow again: closed, as it was left.
+      await viewport.set(PHONE.width, PHONE.height);
+      await expect(isOpen()).toBe(false);
+      await expect(getComputedStyle(cell()).display).toBe('none');
+    });
+  },
+};
+
+/** A parent that keeps `open` true. */
+function KeepsOpen() {
+  return <DemoPage layout="sidebar" open onOpenChange={() => {}} />;
+}
+
+export const ControlledSheetAtWide: Story = {
+  tags: ['no-visual'],
+  render: () => <KeepsOpen />,
+  play: async () => {
+    await withViewport(async (viewport) => {
+      await viewport.set(WIDE.width, WIDE.height);
+      // Open, and nothing of it: the ordinary wide frame.
+      await expect(isOpen()).toBe(true);
+      await expect(document.querySelector('.flg-app-shell-scrim')).toBeNull();
+      await expect(cell()).not.toHaveAttribute('role');
+      for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(false);
+      await expect(getComputedStyle(document.documentElement).overflow).not.toBe('hidden');
+      near(cell().getBoundingClientRect().width, SIDEBAR_WIDE);
+      await expect(getComputedStyle(cell()).position).not.toBe('fixed');
+      await expect(at(600, 300)).not.toBe(null);
+      // Narrow: the sheet is there, since the parent still says open.
+      await viewport.set(PHONE.width, PHONE.height);
+      await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
+      await settled(cell());
+      await expect(getComputedStyle(cell()).position).toBe('fixed');
+      await expect(part('.flg-app-shell-scrim')).toBeVisible();
+      for (const selector of SHUT_OUT) await expect(part(selector).inert).toBe(true);
+    });
+  },
+};
+
+/**
+ * Toasts are over the sheet, and in reach: the Toaster stands outside the shell, so it is neither
+ * covered nor inert while the sheet is open. The toast is in the top layer, it is the thing under
+ * the pointer at its own centre, a press on its button works, and it is in the accessibility tree.
+ */
+export const ToastsOverTheSheet: Story = {
+  tags: ['no-visual'],
+  beforeEach: () => {
+    toast.dismiss();
+    return () => toast.dismiss();
+  },
+  render: () => (
+    <>
+      <DemoPage layout="sidebar" />
+      <Toaster />
+    </>
+  ),
+  play: async () => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await withViewport(async (viewport) => {
+      await viewport.set(PHONE.width, PHONE.height);
+      await openSheet(real);
+      toast.success({ id: 'saved', title: 'Changes saved', duration: Infinity });
+      const item = await waitFor(() => {
+        const found = document.querySelector<HTMLElement>('.flg-toast');
+        if (!found) throw new Error('no toast yet');
+        return found;
+      });
+      await settled(item);
+      const toaster = part('.flg-toaster');
+      await expect(toaster.matches(':popover-open')).toBe(true);
+      await expect(item).toBeVisible();
+      // Not inert, not hidden, and not inside the frame that went inert.
+      await expect(item.closest('[inert]')).toBeNull();
+      await expect(item.closest('[aria-hidden="true"]')).toBeNull();
+      await expect(item.closest('.flg-app-shell')).toBeNull();
+      // In the accessibility tree: named, and in a live region.
+      await expect(item).toHaveTextContent('Changes saved');
+      await expect(part('.flg-toaster-list')).toHaveAttribute('aria-live', 'polite');
+      // Over the sheet: the thing under the pointer at its centre is the toast.
+      const box = item.getBoundingClientRect();
+      await expect(item.contains(at(box.left + box.width / 2, box.top + box.height / 2))).toBe(
+        true,
+      );
+      // And a press on its button works, with the sheet still open behind it.
+      await real.click(part('.flg-toast-close'));
+      await waitFor(() => expect(document.querySelector('.flg-toast')).toBeNull());
+      await expect(isOpen()).toBe(true);
+      await real.keyboard('{Escape}');
+      await expectClosed();
+    });
+  },
+};
+
+/**
+ * S1 on a phone with the sheet open (spec §4.3, mockup S1 phone): opened by the trigger in the play
+ * function, as a person opens it. The harness shoots a story with this tag at that size; elsewhere
+ * (the runner has a wide window, where the trigger folds the sidebar) the story stays closed.
+ */
+async function openInPlay(canvasElement: HTMLElement) {
+  if (window.innerWidth >= APP_SHELL_BREAKPOINTS.lg) return;
+  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open navigation' }));
+  await waitFor(() => expect(cell()).toHaveAttribute('role', 'dialog'));
+  await settled(cell());
+  // The focus ring that goes to the first thing is not part of the mockup's drawing.
+  (document.activeElement as HTMLElement | null)?.blur();
+}
+
+export const SidebarPhoneOpen: Story = {
+  tags: ['viewport-390x844'],
+  render: () => <DemoPage layout="sidebar" />,
+  play: ({ canvasElement }) => openInPlay(canvasElement),
+};
+
+export const HeaderPhoneOpen: Story = {
+  tags: ['viewport-390x844'],
+  render: () => <DemoPage layout="header" />,
+  play: ({ canvasElement }) => openInPlay(canvasElement),
+};
diff --git a/src/components/app-shell/AppShell.test-d.ts b/src/components/app-shell/AppShell.test-d.ts
index d595906..357fd55 100644
--- a/src/components/app-shell/AppShell.test-d.ts
+++ b/src/components/app-shell/AppShell.test-d.ts
@@ -32,7 +32,12 @@ test('the brand is any node, and the words may be given in part', () => {
   expectTypeOf<AppShellProps['brand']>().toEqualTypeOf<ReactNode>();
   expectTypeOf<NonNullable<AppShellProps['labels']>>().toEqualTypeOf<Partial<AppShellLabels>>();
   expectTypeOf<keyof AppShellLabels>().toEqualTypeOf<
-    'skipToContent' | 'openNavigation' | 'collapseSidebar' | 'expandSidebar'
+    | 'skipToContent'
+    | 'navigation'
+    | 'openNavigation'
+    | 'closeNavigation'
+    | 'collapseSidebar'
+    | 'expandSidebar'
   >();
 });
 
diff --git a/src/components/app-shell/AppShellDrawer.test.tsx b/src/components/app-shell/AppShellDrawer.test.tsx
new file mode 100644
index 0000000..17a7e44
--- /dev/null
+++ b/src/components/app-shell/AppShellDrawer.test.tsx
@@ -0,0 +1,501 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import { useContext, useState } from 'react';
+import type { ReactNode } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { registerModal } from '../../internal/modal-stack';
+import { resetDevWarnings } from '../../internal/warn';
+import {
+  AppShell,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+  AppShellSidebarTrigger,
+} from './AppShell';
+import type { AppShellProps } from './AppShell';
+import { AppShellBrand } from './AppShellBrand';
+import { AppShellContext } from './app-shell-context';
+import { resize, stubWindow } from '../../../tests/app-shell-window';
+
+// jsdom lays nothing out, so nothing counts as visible and nothing can be focused by `focusFirst`.
+beforeEach(() => {
+  resetDevWarnings();
+  stubWindow(false);
+  HTMLElement.prototype.checkVisibility = () => true;
+});
+afterEach(() => {
+  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
+  vi.restoreAllMocks();
+  vi.unstubAllGlobals();
+  document.documentElement.removeAttribute('style');
+});
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
+
+const trigger = () => screen.getByRole('button', { name: 'Open navigation' });
+const closeButton = () => screen.getByRole('button', { name: 'Close navigation' });
+const sidebar = (container: HTMLElement) =>
+  container.querySelector<HTMLElement>('.flg-app-shell-sidebar')!;
+const scrim = (container: HTMLElement) => container.querySelector('.flg-app-shell-scrim');
+const inertParts = (container: HTMLElement) =>
+  Array.from(container.querySelectorAll<HTMLElement>('.flg-app-shell > *')).filter(
+    (child) => child.inert,
+  );
+
+function Shell({
+  children,
+  main,
+  ...props
+}: { children?: ReactNode; main?: ReactNode } & AppShellProps) {
+  return (
+    <AppShell {...props}>
+      <AppShellHeader>Header</AppShellHeader>
+      <AppShellSidebar>
+        <a href="#one">One</a>
+      </AppShellSidebar>
+      <AppShellMain>{main ?? 'Main'}</AppShellMain>
+      <AppShellFooter>Footer</AppShellFooter>
+      {children}
+    </AppShell>
+  );
+}
+
+describe('the sidebar as a sheet: what it says and what it shuts out', () => {
+  it('is a dialog with a name only while it is open on a narrow screen, and has no `aria-modal`', () => {
+    const { container, rerender } = render(<Shell open={false} />);
+    expect(sidebar(container)).not.toHaveAttribute('role');
+    expect(sidebar(container)).not.toHaveAttribute('aria-label');
+    rerender(<Shell open />);
+    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBe(sidebar(container));
+    expect(sidebar(container)).not.toHaveAttribute('aria-modal');
+    rerender(<Shell open={false} />);
+    expect(sidebar(container)).not.toHaveAttribute('role');
+  });
+
+  it('takes the name from `labels`, and keeps a role and a name the caller gave it', () => {
+    const { container } = render(
+      <AppShell open labels={{ navigation: 'Menu' }}>
+        <AppShellSidebar>x</AppShellSidebar>
+      </AppShell>,
+    );
+    expect(screen.getByRole('dialog', { name: 'Menu' })).toBe(sidebar(container));
+    const mine = render(
+      <AppShell open>
+        <AppShellSidebar aria-label="Sections" role="navigation">
+          x
+        </AppShellSidebar>
+      </AppShell>,
+    );
+    expect(sidebar(mine.container)).toHaveAttribute('aria-label', 'Sections');
+    expect(sidebar(mine.container)).toHaveAttribute('role', 'navigation');
+  });
+
+  it('makes the skip link, the header, the main and the footer inert, and nothing else', () => {
+    const { container } = render(
+      <Shell open>
+        <div className="mine">Outside</div>
+      </Shell>,
+    );
+    expect(inertParts(container).map((part) => part.tagName)).toEqual([
+      'A',
+      'HEADER',
+      'MAIN',
+      'FOOTER',
+    ]);
+    expect(inertParts(container)[0]).toHaveClass('flg-app-shell-skip');
+    expect(sidebar(container).inert).toBeFalsy();
+    expect(container.querySelector<HTMLElement>('.mine')!.inert).toBeFalsy();
+  });
+
+  it('releases them when it closes, and when the shell goes away', () => {
+    const { container, rerender, unmount } = render(<Shell open />);
+    const header = container.querySelector<HTMLElement>('header')!;
+    rerender(<Shell open={false} />);
+    expect(inertParts(container)).toEqual([]);
+    rerender(<Shell open />);
+    expect(header.inert).toBe(true);
+    unmount();
+    expect(header.inert).toBeFalsy();
+  });
+
+  it('leaves what the caller made inert as it was', () => {
+    const { container, rerender } = render(<Shell open={false} />);
+    container.querySelector<HTMLElement>('footer')!.inert = true;
+    rerender(<Shell open />);
+    rerender(<Shell open={false} />);
+    expect(container.querySelector<HTMLElement>('footer')!.inert).toBe(true);
+    expect(container.querySelector<HTMLElement>('header')!.inert).toBeFalsy();
+  });
+
+  it('makes a part that mounts while the sheet is open inert too', () => {
+    function Late() {
+      const [shown, setShown] = useState(false);
+      return (
+        <AppShell open>
+          <AppShellSidebar>x</AppShellSidebar>
+          <AppShellMain>
+            <button type="button" onClick={() => setShown(true)}>
+              show
+            </button>
+          </AppShellMain>
+          {shown ? <AppShellFooter>Late</AppShellFooter> : null}
+        </AppShell>
+      );
+    }
+    const { container } = render(<Late />);
+    expect(container.querySelector('footer')).toBeNull();
+    fireEvent.click(screen.getByText('show'));
+    expect(container.querySelector<HTMLElement>('footer')!.inert).toBe(true);
+  });
+
+  it('does none of it while the window is wide, whatever `open` says', () => {
+    stubWindow(true);
+    const { container } = render(<Shell open />);
+    expect(inertParts(container)).toEqual([]);
+    expect(sidebar(container)).not.toHaveAttribute('role');
+    expect(scrim(container)).toBeNull();
+    expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull();
+    expect(document.documentElement.style.overflow).toBe('');
+  });
+});
+
+describe('the scrim and the button that close the sheet', () => {
+  it('draws a scrim only while the sheet is open, hidden from assistive technology', () => {
+    const { container, rerender } = render(<Shell open={false} />);
+    expect(scrim(container)).toBeNull();
+    rerender(<Shell open />);
+    expect(scrim(container)).toHaveAttribute('aria-hidden', 'true');
+    expect(container.firstElementChild!.lastElementChild).toBe(scrim(container));
+  });
+
+  it('closes on a click on the scrim, and not on a click that only ends on it', () => {
+    const onOpenChange = vi.fn();
+    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    // A selection that starts in the sidebar and ends over the scrim makes a `click` whose target
+    // is the element that holds both, which is not the scrim.
+    fireEvent.click(container.firstElementChild!);
+    expect(onOpenChange).not.toHaveBeenCalled();
+    fireEvent.click(scrim(container)!);
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+    expect(scrim(container)).toBeNull();
+  });
+
+  it('draws a close button in the head, only while it is a sheet, named from `labels`', () => {
+    const { container, rerender } = render(<Shell open={false} />);
+    expect(screen.queryByRole('button', { name: 'Close navigation' })).toBeNull();
+    rerender(<Shell open labels={{ closeNavigation: 'Fermer' }} />);
+    const button = screen.getByRole('button', { name: 'Fermer' });
+    expect(button).toHaveClass('flg-button', 'flg-app-shell-sidebar-close');
+    expect(sidebar(container).querySelector('.flg-app-shell-sidebar-head')).toContainElement(
+      button,
+    );
+  });
+
+  it('puts the button after the brand in S1 and before it in S2, the way it is drawn', () => {
+    const brand = <AppShellBrand name="Lumen" href="/" />;
+    const order = (layout: 'sidebar' | 'header') => {
+      const { container, unmount } = render(<Shell open layout={layout} brand={brand} />);
+      const head = container.querySelector('.flg-app-shell-sidebar-head')!;
+      const names = Array.from(head.children).map((child) =>
+        child.matches('button') ? 'close' : 'brand',
+      );
+      unmount();
+      return names;
+    };
+    expect(order('sidebar')).toEqual(['brand', 'close']);
+    expect(order('header')).toEqual(['close', 'brand']);
+  });
+
+  it('closes on the button, and says so', () => {
+    const onOpenChange = vi.fn();
+    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    fireEvent.click(closeButton());
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+  });
+});
+
+describe('focus', () => {
+  it('goes to the first thing in the sidebar when it opens: the brand link in S1, the button in S2', () => {
+    const brand = <AppShellBrand name="Lumen" href="/" />;
+    const { rerender } = render(<Shell open={false} brand={brand} />);
+    rerender(<Shell open brand={brand} />);
+    const link = document.activeElement as HTMLElement;
+    expect(link).toHaveAttribute('href', '/');
+    expect(link.closest('.flg-app-shell-sidebar-head')).not.toBeNull();
+    rerender(<Shell open={false} layout="header" brand={brand} />);
+    rerender(<Shell open layout="header" brand={brand} />);
+    expect(closeButton()).toHaveFocus();
+  });
+
+  it('goes to the first thing from `defaultOpen` on the first render too', () => {
+    render(<Shell defaultOpen layout="header" />);
+    expect(closeButton()).toHaveFocus();
+  });
+
+  it('goes back to the trigger that opened the sheet when it closes by Esc, the scrim or the button', () => {
+    const { container } = render(<Shell layout="header" />);
+    for (const close of [
+      () => fireEvent.keyDown(document, { key: 'Escape' }),
+      () => fireEvent.click(scrim(container)!),
+      () => fireEvent.click(closeButton()),
+    ]) {
+      fireEvent.click(trigger());
+      expect(closeButton()).toHaveFocus();
+      close();
+      expect(container.firstElementChild).not.toHaveAttribute('data-open');
+      expect(trigger()).toHaveFocus();
+    }
+  });
+
+  it('goes back to the trigger that opened it when there are two', () => {
+    const { container } = render(
+      <AppShell layout="header">
+        <AppShellHeader>
+          <span>first</span>
+        </AppShellHeader>
+        <AppShellSidebar>x</AppShellSidebar>
+        <AppShellMain>
+          <AppShellSidebarTrigger />
+        </AppShellMain>
+      </AppShell>,
+    );
+    const [first, second] = screen.getAllByRole('button', { name: 'Open navigation' });
+    fireEvent.click(second!);
+    fireEvent.click(scrim(container)!);
+    expect(second).toHaveFocus();
+    expect(first).not.toHaveFocus();
+  });
+
+  it('stays where it is when the window grows wide, which closes the sheet', () => {
+    const { container } = render(<Shell defaultOpen layout="header" />);
+    const link = screen.getByRole('link', { name: 'One' });
+    link.focus();
+    resize(true);
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+    expect(link).toHaveFocus();
+  });
+
+  it('is left alone by a close that asks `returnFocus: false` (the close when the window grows wide)', () => {
+    function Link() {
+      const context = useContext(AppShellContext)!;
+      return (
+        <button type="button" onClick={() => context.setOpen(false, { returnFocus: false })}>
+          go
+        </button>
+      );
+    }
+    const { container } = render(
+      <Shell>
+        <Link />
+      </Shell>,
+    );
+    fireEvent.click(trigger());
+    const go = screen.getByText('go');
+    go.focus();
+    fireEvent.click(go);
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+    expect(trigger()).not.toHaveFocus();
+    expect(go).toHaveFocus();
+  });
+
+  it('returns by default when a part closes the sheet with `setOpen(false)`', () => {
+    function Link() {
+      const context = useContext(AppShellContext)!;
+      return (
+        <button type="button" onClick={() => context.setOpen(false)}>
+          go
+        </button>
+      );
+    }
+    render(
+      <Shell>
+        <Link />
+      </Shell>,
+    );
+    fireEvent.click(trigger());
+    fireEvent.click(screen.getByText('go'));
+    expect(trigger()).toHaveFocus();
+  });
+});
+
+describe('Esc', () => {
+  it('closes the sheet', () => {
+    const onOpenChange = vi.fn();
+    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    fireEvent.keyDown(document, { key: 'Escape' });
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+  });
+
+  it('ignores other keys', () => {
+    const onOpenChange = vi.fn();
+    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    fireEvent.keyDown(document, { key: 'Enter' });
+    expect(onOpenChange).not.toHaveBeenCalled();
+  });
+
+  it('leaves it to whoever already took the key (the Toaster does)', () => {
+    const onOpenChange = vi.fn();
+    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    const handled = (event: KeyboardEvent) => event.preventDefault();
+    // Before the shell's own listener, which is on the same node.
+    document.addEventListener('keydown', handled, true);
+    fireEvent.keyDown(document, { key: 'Escape' });
+    document.removeEventListener('keydown', handled, true);
+    expect(onOpenChange).not.toHaveBeenCalled();
+  });
+
+  it('leaves it to a dialog that is open on top of the sheet', () => {
+    const onOpenChange = vi.fn();
+    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    const unregister = registerModal({
+      dialog: document.createElement('dialog'),
+      host: document.createElement('div'),
+    });
+    fireEvent.keyDown(document, { key: 'Escape' });
+    expect(onOpenChange).not.toHaveBeenCalled();
+    unregister();
+    fireEvent.keyDown(document, { key: 'Escape' });
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+  });
+
+  it('leaves it to a popover that is open in the sidebar, which the browser closes on this key', () => {
+    const onOpenChange = vi.fn();
+    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    const popover = document.createElement('div');
+    const query = vi
+      .spyOn(sidebar(container), 'querySelector')
+      .mockImplementation(((selector: string) =>
+        selector === ':popover-open' ? popover : null) as typeof Element.prototype.querySelector);
+    fireEvent.keyDown(document, { key: 'Escape' });
+    expect(onOpenChange).not.toHaveBeenCalled();
+    expect(query).toHaveBeenCalledWith(':popover-open');
+    query.mockImplementation(() => null);
+    fireEvent.keyDown(document, { key: 'Escape' });
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+  });
+
+  it('is not listened to while the sheet is closed', () => {
+    const onOpenChange = vi.fn();
+    const { rerender } = render(<Shell open={false} onOpenChange={onOpenChange} />);
+    fireEvent.keyDown(document, { key: 'Escape' });
+    rerender(<Shell open onOpenChange={onOpenChange} />);
+    rerender(<Shell open={false} onOpenChange={onOpenChange} />);
+    fireEvent.keyDown(document, { key: 'Escape' });
+    expect(onOpenChange).not.toHaveBeenCalled();
+  });
+});
+
+describe('the page behind the sheet', () => {
+  it('does not scroll while the sheet is open, and does again once it is closed or gone', () => {
+    const { rerender, unmount } = render(<Shell open={false} />);
+    expect(document.documentElement.style.overflow).toBe('');
+    rerender(<Shell open />);
+    expect(document.documentElement.style.overflow).toBe('hidden');
+    rerender(<Shell open={false} />);
+    expect(document.documentElement.style.overflow).toBe('');
+    rerender(<Shell open />);
+    unmount();
+    expect(document.documentElement.style.overflow).toBe('');
+  });
+});
+
+describe('a window that crosses the breakpoint while the sheet is open', () => {
+  it('closes it: `onOpenChange(false)`, and the page is free again', () => {
+    const onOpenChange = vi.fn();
+    const { container } = render(<Shell defaultOpen onOpenChange={onOpenChange} />);
+    expect(document.documentElement.style.overflow).toBe('hidden');
+    resize(true);
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+    expect(inertParts(container)).toEqual([]);
+    expect(document.documentElement.style.overflow).toBe('');
+    // It stays closed when the window narrows again.
+    resize(false);
+    expect(container.firstElementChild).not.toHaveAttribute('data-open');
+  });
+
+  it('reports nothing when the sheet was closed', () => {
+    const onOpenChange = vi.fn();
+    render(<Shell onOpenChange={onOpenChange} />);
+    resize(true);
+    resize(false);
+    expect(onOpenChange).not.toHaveBeenCalled();
+  });
+
+  it('asks a parent that owns `open` to close it, and does nothing at the wide size if it keeps it open', () => {
+    const onOpenChange = vi.fn();
+    const { container } = render(<Shell open onOpenChange={onOpenChange} />);
+    expect(screen.getByRole('dialog')).toBeInTheDocument();
+    resize(true);
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
+    // The parent ignores it: `open` is still true, and the shell is an ordinary wide one.
+    expect(container.firstElementChild).toHaveAttribute('data-open');
+    expect(screen.queryByRole('dialog')).toBeNull();
+    expect(inertParts(container)).toEqual([]);
+    expect(scrim(container)).toBeNull();
+    expect(document.documentElement.style.overflow).toBe('');
+    // And the sheet is back when the window narrows.
+    resize(false);
+    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBe(sidebar(container));
+    expect(inertParts(container)).toHaveLength(4);
+    expect(document.documentElement.style.overflow).toBe('hidden');
+  });
+});
+
+describe('a Toaster inside a part that goes inert', () => {
+  const toaster = <section className="flg-toaster" />;
+  const message =
+    '[h2d-glass-ui] <Toaster> is inside a part of <AppShell> that goes inert while the navigation is open, so its toasts cannot be reached. Render it outside <AppShell> or as its direct child.';
+
+  it('warns, without a value in the text', () => {
+    const warn = spyWarn();
+    render(<Shell open main={toaster} />);
+    expect(warnings(warn)).toContain(message);
+  });
+
+  it('is quiet with the Toaster outside of the shell', () => {
+    const warn = spyWarn();
+    render(
+      <div>
+        <Shell open />
+        {toaster}
+      </div>,
+    );
+    expect(warnings(warn)).not.toContain(message);
+  });
+
+  it('is quiet with the Toaster as a direct child of the shell', () => {
+    const warn = spyWarn();
+    render(<Shell open>{toaster}</Shell>);
+    expect(warnings(warn)).not.toContain(message);
+  });
+
+  it('is quiet while the sheet is closed', () => {
+    const warn = spyWarn();
+    render(<Shell open={false} main={toaster} />);
+    expect(warnings(warn)).not.toContain(message);
+  });
+});
+
+describe('`setOpen` of the context', () => {
+  it('opens the sheet with a plain `setOpen(true)`, as a link of Plan B will not need but a caller may', () => {
+    function Opener() {
+      const context = useContext(AppShellContext)!;
+      return (
+        <button type="button" onClick={() => context.setOpen(true)}>
+          open
+        </button>
+      );
+    }
+    const { container } = render(
+      <Shell>
+        <Opener />
+      </Shell>,
+    );
+    act(() => screen.getByText('open').click());
+    expect(container.firstElementChild).toHaveAttribute('data-open');
+    expect(screen.getByRole('dialog')).toBeInTheDocument();
+  });
+});
diff --git a/src/components/app-shell/AppShellSidebarTrigger.test.tsx b/src/components/app-shell/AppShellSidebarTrigger.test.tsx
index 3a3d7cb..c2630fc 100644
--- a/src/components/app-shell/AppShellSidebarTrigger.test.tsx
+++ b/src/components/app-shell/AppShellSidebarTrigger.test.tsx
@@ -1,4 +1,4 @@
-import { act, fireEvent, render, screen } from '@testing-library/react';
+import { fireEvent, render, screen } from '@testing-library/react';
 import { createRef } from 'react';
 import type { ReactNode } from 'react';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
@@ -13,34 +13,7 @@ import {
 } from './AppShell';
 import type { AppShellProps } from './AppShell';
 import { AppShellBrand } from './AppShellBrand';
-
-// jsdom has no `matchMedia`, so a test says what the window is: wide when the query of the
-// breakpoint matches, and a call to `resize` is the user dragging the window across it.
-let wide = false;
-const listeners = new Set<() => void>();
-
-function stubWindow(initiallyWide: boolean) {
-  wide = initiallyWide;
-  listeners.clear();
-  vi.stubGlobal(
-    'matchMedia',
-    vi.fn((query: string) => ({
-      get matches() {
-        return wide && query.startsWith('(min-width:');
-      },
-      media: query,
-      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
-      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
-    })),
-  );
-}
-
-function resize(toWide: boolean) {
-  wide = toWide;
-  act(() => {
-    for (const listener of [...listeners]) listener();
-  });
-}
+import { resize, stubWindow } from '../../../tests/app-shell-window';
 
 beforeEach(() => {
   resetDevWarnings();
@@ -53,8 +26,8 @@ afterEach(() => {
 const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
 const warnings = (warn: ReturnType<typeof spyWarn>) => warn.mock.calls.map((call) => call[0]);
 
-// The only button of these shells.
-const trigger = () => screen.getByRole('button');
+// The trigger: with the sheet open there is a second button, the one that closes it.
+const trigger = () => document.querySelector<HTMLElement>('.flg-app-shell-trigger')!;
 
 function Shell({ children, ...props }: { children?: ReactNode } & AppShellProps) {
   return (
@@ -272,15 +245,24 @@ describe('the mode follows the window', () => {
     expect(trigger()).toHaveAccessibleName('Open navigation');
   });
 
-  it('keeps each state when the mode changes: a rail stays a rail, an open sheet stays open', () => {
+  it('keeps a rail a rail when the mode changes, and a wide window closes an open sheet', () => {
     stubWindow(true);
-    const { container } = render(<Shell defaultCollapsed defaultOpen />);
+    const onOpenChange = vi.fn();
+    const { container } = render(
+      <Shell defaultCollapsed defaultOpen onOpenChange={onOpenChange} />,
+    );
     const root = container.firstElementChild!;
+    // Wide to begin with: `open` is a state like any other, it just does nothing here (spec §3.4).
+    expect(root).toHaveAttribute('data-open');
     resize(false);
     expect(root).toHaveAttribute('data-collapsed');
     expect(root).toHaveAttribute('data-open');
     expect(trigger()).toHaveAttribute('aria-expanded', 'true');
+    expect(onOpenChange).not.toHaveBeenCalled();
     resize(true);
+    expect(root).toHaveAttribute('data-collapsed');
+    expect(root).not.toHaveAttribute('data-open');
+    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
     expect(trigger()).toHaveAttribute('aria-expanded', 'false');
   });
 
diff --git a/tests/app-shell-window.ts b/tests/app-shell-window.ts
new file mode 100644
index 0000000..a036241
--- /dev/null
+++ b/tests/app-shell-window.ts
@@ -0,0 +1,31 @@
+import { act } from '@testing-library/react';
+import { vi } from 'vitest';
+
+// jsdom has no `matchMedia`, so a test says what the window is: wide when the query of the
+// breakpoint matches, and a call to `resize` is the user dragging the window across it.
+let wide = false;
+const listeners = new Set<() => void>();
+
+/** Stands in for the window; undo it with `vi.unstubAllGlobals()`. */
+export function stubWindow(initiallyWide: boolean) {
+  wide = initiallyWide;
+  listeners.clear();
+  vi.stubGlobal(
+    'matchMedia',
+    vi.fn((query: string) => ({
+      get matches() {
+        return wide && query.startsWith('(min-width:');
+      },
+      media: query,
+      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
+      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
+    })),
+  );
+}
+
+export function resize(toWide: boolean) {
+  wide = toWide;
+  act(() => {
+    for (const listener of [...listeners]) listener();
+  });
+}
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 src/components/app-shell
pnpm vitest run --project scripts scripts/lib/app-shell-css.test.ts
```

Expected: FAIL.
- `AppShellDrawer.test.tsx` (34 test): lần chạy đầu của bản nháp có 25 test fail vì chưa có hành vi; 9 test còn lại là ca phủ định và pass trên mọi code. Một số lỗi đầu:
  - `` is a dialog with a name only while it is open on a narrow screen, and has no `aria-modal` ``: không tìm thấy role `"dialog"`.
  - `makes the skip link, the header, the main and the footer inert, and nothing else`: `expected undefined to be true`.
  - `closes on a click on the scrim, and not on a click that only ends on it`: lớp nền là `null`.
  - `` draws a close button in the head, only while it is a sheet, named from `labels` ``: không tìm thấy "Close navigation".
  - nhóm `focus`: `toHaveFocus` fail.
  - nhóm `Esc`: `onOpenChange` không được gọi.
  - `does not scroll while the sheet is open, and does again once it is closed or gone`: `overflow` là `''`, mong `hidden`.
  - nhóm `a window that crosses the breakpoint while the sheet is open`: `onOpenChange` không được gọi.
  - `a Toaster inside a part that goes inert > warns, without a value in the text`: không có cảnh báo nào.
- `the mode follows the window > keeps a rail a rail when the mode changes, and a wide window closes an open sheet`: `data-open` vẫn còn.
- `AppShell.test-d.ts`: lỗi kiểu ở danh sách khoá nhãn (`navigation`, `closeNavigation`).
- `app-shell-css.test.ts` fail vì `sheetRules` chưa có (nhóm `the sheet` gọi nó ngay khi khai báo), và `has one boundary per breakpoint: no max-width, no second bound` đòi sáu khối `@media`.

Story của task này viết sau code và không chạy ở bước này (phát hiện 13). Bản nháp thấy chúng fail bằng đột biến: bỏ `lockScroll` thì `SheetClosesSidebarLayout` fail ở Chromium và Firefox (`Esc: expected 'visible' to be 'hidden'`); không đặt `inert` thì `SheetSidebarLayout` fail (`expected false to be true`). Story về cú bôi chữ thả trên lớp nền là test đặc tả.

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
index 79933c5..f4747c7 100644
--- a/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
+++ b/docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md
@@ -542,7 +542,7 @@ Mọi component mới có quy tắc riêng trong `preferences.css`. Icon dùng `
 | `editable.ts` (C) | `isEditable(target)` | Chuyển nguyên từ `Toaster.tsx` (ô nhập văn bản, `textarea`, `select`, `[contenteditable]`, hay con của chúng); Toaster và phím tắt của SearchField dùng chung |
 | `theme-store.ts` (C) | `useThemeValue({ value, defaultValue, onValueChange, storageKey })`, `applyTheme(value)` | Store theo `storageKey`: đọc `localStorage` một lần khi có người đăng ký đầu tiên và khi có sự kiện `storage` cho đúng khoá; ghi khi người dùng chọn; báo cho mọi `ThemeSwitch` và `ThemeMenuGroup` cùng khoá (cả hai luôn khớp nhau). `useSyncExternalStore` với giá trị phía server là `defaultValue`. Controlled (`value` có mặt) thì chỉ trả `value` và gọi `onValueChange`, không đọc, không ghi, không chạm `<html>`. `applyTheme`: `'light'`/`'dark'` đặt `data-flg-theme` trên `document.documentElement`, `'system'` bỏ thuộc tính. `localStorage` bị chặn (chế độ riêng tư, chính sách) thì mọi lần đọc ghi được bọc `try/catch`: giá trị chỉ sống trong store |
 
-**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `setOpen(open, { returnFocus })`, id của sidebar và main, `labels`, `brand`, đăng ký phần và trigger); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
+**Helper riêng của component** (trong thư mục của component): `app-shell/app-shell-context.ts` (context của AppShell: `layout`, `breakpoint`, `isWide`, `collapsible`, `collapsed`, `setCollapsed`, `open`, `setOpen(open, { returnFocus, opener })` (`returnFocus` mặc định `true`: sau khi đóng, focus về `opener`, là nút trigger đã mở tấm, không có thì trigger đầu tiên còn hiện; `opener` chỉ do `AppShellSidebarTrigger` truyền khi mở; một lần đóng do đổi cỡ màn dùng `returnFocus: false`; phát hiện khi lập Plan A), id của sidebar và main, `labels`, `brand`, đăng ký phần và trigger); `app-shell/use-header-offset.ts` (`useHeaderOffset(header)`, với `header` là phần tử (lưu bằng state của `AppShell`, nên một header mount sau khung vẫn được đo; (phát hiện khi lập Plan A)): `ResizeObserver` trên header, ghi `--flg-app-shell-header-offset` lên `<html>` khi chiều cao đổi, xoá khi unmount; không có `ResizeObserver` (jsdom) thì không ghi gì, CSS dùng giá trị dự phòng; §3.3; Claude chốt; phát hiện khi đọc soát spec); `theme-switch/theme-script.ts` (hàm thuần `themeScriptSource(storageKey)`, §6.3, để test được chuỗi).
 
 **Thay đổi ở primitive và component có sẵn:**
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index b2acbbd..008a56a 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -179,6 +179,8 @@ const SHIPPED_CLASSES = [
   'flg-app-shell-footer',
   'flg-app-shell-skip',
   'flg-app-shell-trigger',
+  'flg-app-shell-sidebar-close',
+  'flg-app-shell-scrim',
   'flg-app-shell-brand',
   'flg-app-shell-brand-logo',
   'flg-app-shell-brand-name',
@@ -215,6 +217,12 @@ const requirements: Array<[string, boolean]> = [
     /scroll-padding-top:\s*var\(--flg-app-shell-header-offset/.test(css) &&
       /body:has\(\.flg-app-shell\)/.test(css),
   ],
+  [
+    'ships the sheet of the AppShell: a fixed sidebar and a scrim on the screens narrower than a breakpoint',
+    /@media\s*not all and\s*\((?:min-width:\s*1024px|width\s*>=\s*1024px)\)\s*\{[\s\S]*?\[data-open\][^{]*\.flg-app-shell-scrim\s*\{[^}]*position:\s*fixed/.test(
+      css,
+    ),
+  ],
   [
     'ships the rail of the AppShell (the sidebar column narrows to the rail width)',
     /\[data-collapsed\]\s*\{[^}]*grid-template-columns:\s*var\(--flg-app-shell-rail-width\)/.test(
diff --git a/scripts/lib/app-shell-css.ts b/scripts/lib/app-shell-css.ts
index 1a04ed2..c08e752 100644
--- a/scripts/lib/app-shell-css.ts
+++ b/scripts/lib/app-shell-css.ts
@@ -21,6 +21,7 @@ const FOOTER = '.flg-app-shell-footer';
 const HEAD = '.flg-app-shell-sidebar-head';
 const TRIGGER = '.flg-app-shell-trigger';
 const HEADER_BRAND = '.flg-app-shell-header-brand';
+const SCRIM = '.flg-app-shell-scrim';
 
 /**
  * The rules for one breakpoint, without indentation. They are in the order the cascade needs: each
@@ -156,6 +157,54 @@ ${noSidebar} > :is(${HEADER}, ${MAIN}, ${FOOTER}) {
 }`;
 }
 
+/**
+ * The rules of the sidebar as a sheet (spec phase 5 §3.4, §4.3), for the screens narrower than the
+ * breakpoint, without indentation. The sidebar is the one element of the grid, and while the root is
+ * open it turns into the fixed layer and its panel fills it; the scrim is a sibling under it. They
+ * are written for the screens that do not match `min-width`, so there is one boundary per breakpoint
+ * and an `open` that a parent keeps true on a wide screen shows nothing.
+ */
+export function sheetRules(breakpoint: AppShellBreakpointName): string {
+  const shell = `.flg-app-shell[data-breakpoint='${breakpoint}'][data-open]`;
+  return `${shell} > ${SIDEBAR} {
+  position: fixed;
+  top: 0;
+  bottom: 0;
+  left: 0;
+  z-index: 5;
+  display: block;
+  /* A strip of the scrim is left to touch, on the narrowest phones. */
+  width: min(var(--flg-app-shell-drawer-width), calc(100vw - 48px));
+  transition: translate var(--flg-duration-normal) var(--flg-ease);
+}
+${shell} > ${SIDEBAR} > ${PANEL} {
+  border-radius: 0 var(--flg-radius-lg) var(--flg-radius-lg) 0;
+}
+/* S1: the brand stands 8px in from where the head starts, as the mockup draws it. */
+${shell}[data-layout='sidebar'] > ${SIDEBAR} > ${PANEL} > ${HEAD} {
+  padding-left: 18px;
+}
+${shell} > ${SCRIM} {
+  position: fixed;
+  inset: 0;
+  z-index: 4;
+  display: block;
+  background: var(--flg-scrim);
+  -webkit-backdrop-filter: blur(var(--flg-scrim-blur));
+  backdrop-filter: blur(var(--flg-scrim-blur));
+  transition: opacity var(--flg-duration-normal) var(--flg-ease);
+}
+/* The sheet slides in and the scrim fades in; neither is animated out (spec §3.6). */
+@starting-style {
+  ${shell} > ${SIDEBAR} {
+    translate: -100% 0;
+  }
+  ${shell} > ${SCRIM} {
+    opacity: 0;
+  }
+}`;
+}
+
 const indent = (text: string) =>
   text
     .split('\n')
@@ -164,11 +213,19 @@ const indent = (text: string) =>
 
 /** The whole of `src/styles/generated/app-shell.css`. */
 export function buildAppShellCss(): string {
-  const blocks = (Object.keys(APP_SHELL_BREAKPOINTS) as AppShellBreakpointName[]).map(
-    (name) =>
-      `@media (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(wideRules(name))}\n}`,
-  );
-  return `/* The wide-screen rules of the AppShell, one block per breakpoint. Generated by scripts/build-theme.ts
+  const names = Object.keys(APP_SHELL_BREAKPOINTS) as AppShellBreakpointName[];
+  const blocks = [
+    ...names.map(
+      (name) =>
+        `@media (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(wideRules(name))}\n}`,
+    ),
+    ...names.map(
+      (name) =>
+        `@media not all and (min-width: ${APP_SHELL_BREAKPOINTS[name]}px) {\n${indent(sheetRules(name))}\n}`,
+    ),
+  ];
+  return `/* The rules of the AppShell that depend on the width, one block per breakpoint: the wide screens,
+   then the narrow ones, where the sidebar is a sheet. Generated by scripts/build-theme.ts
    from scripts/lib/app-shell-css.ts; do not edit. */
 @layer flg.components {
 ${indent(blocks.join('\n'))}
diff --git a/src/components/app-shell/AppShell.tsx b/src/components/app-shell/AppShell.tsx
index a2764cc..958cb8b 100644
--- a/src/components/app-shell/AppShell.tsx
+++ b/src/components/app-shell/AppShell.tsx
@@ -14,10 +14,14 @@ import {
 import type { HTMLAttributes, ReactNode } from 'react';
 import { composeEventHandlers } from '../../internal/compose-event-handlers';
 import { dataAttr } from '../../internal/data-attr';
+import { focusFirst, returnFocus } from '../../internal/focus';
 import { hasContent } from '../../internal/has-content';
-import { MenuIcon } from '../../internal/icons';
+import { CloseIcon, MenuIcon } from '../../internal/icons';
+import { lockScroll } from '../../internal/lock-scroll';
 import { mergeRefs } from '../../internal/merge-refs';
+import { getTopModal } from '../../internal/modal-stack';
 import { useControllableState } from '../../internal/use-controllable-state';
+import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { useMediaQuery } from '../../internal/use-media-query';
 import { devWarn } from '../../internal/warn';
 import { withDefaults } from '../../internal/with-defaults';
@@ -30,6 +34,7 @@ import type {
   AppShellLabels,
   AppShellLayout,
   AppShellPart,
+  AppShellSetOpenOptions,
 } from './app-shell-context';
 import { wideQuery } from './breakpoints';
 import { useHeaderOffset } from './use-header-offset';
@@ -70,7 +75,9 @@ export type AppShellFooterProps = HTMLAttributes<HTMLElement>;
 
 const DEFAULT_LABELS: AppShellLabels = {
   skipToContent: 'Skip to content',
+  navigation: 'Navigation',
   openNavigation: 'Open navigation',
+  closeNavigation: 'Close navigation',
   collapseSidebar: 'Collapse sidebar',
   expandSidebar: 'Expand sidebar',
 };
@@ -81,6 +88,16 @@ const toLayout = (layout: unknown): AppShellLayout => (layout === 'header' ? 'he
 const toBreakpoint = (breakpoint: unknown): AppShellBreakpoint =>
   breakpoint === 'md' || breakpoint === 'xl' ? breakpoint : 'lg';
 
+// `:popover-open` is a selector that older engines, and jsdom, do not know; they throw on it, and
+// have no popover to be open either.
+function hasOpenPopover(root: HTMLElement): boolean {
+  try {
+    return root.querySelector(':popover-open') !== null;
+  } catch {
+    return false;
+  }
+}
+
 /**
  * The frame of an application: a header, a sidebar, the main content and a footer, laid out on a
  * grid by CSS alone, so the HTML from the server is right at every width. The page scrolls with the
@@ -90,8 +107,14 @@ const toBreakpoint = (breakpoint: unknown): AppShellBreakpoint =>
  * to is not left under it (see the docs).
  *
  * It keeps two states, one for each kind of screen: `collapsed` (a rail, on a wide screen) and
- * `open` (the sidebar as a sheet, on a narrow one). Both can be controlled, and neither changes when
- * the window crosses the breakpoint.
+ * `open` (the sidebar as a sheet, on a narrow one). Both can be controlled. A rail stays a rail when
+ * the window crosses the breakpoint; an open sheet is closed by a window that grows wide, and a
+ * parent that keeps `open` true gets nothing from it at that size.
+ *
+ * While the sheet is open on a narrow screen it is a modal one, though not a `<dialog>`: the sidebar
+ * stays the one element of the grid (a `<dialog>` would need the navigation twice, or moved about
+ * and its state lost). The rest of the frame is `inert`, the page does not scroll, Esc closes it and
+ * focus goes in, then back to the button that opened it.
  */
 export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
   {
@@ -113,11 +136,17 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
   ref,
 ) {
   const rootRef = useRef<HTMLDivElement>(null);
+  const skipRef = useRef<HTMLAnchorElement>(null);
   const mainId = useId();
   const sidebarId = useId();
   const [header, setHeader] = useState<HTMLElement | null>(null);
   const parts = useRef(new Map<AppShellPart, Set<HTMLElement>>());
   const triggers = useRef(new Set<HTMLElement>());
+  // What the shell made inert, so it releases that and nothing the caller made inert.
+  const inerted = useRef(new Set<HTMLElement>());
+  const modalRef = useRef(false);
+  const opener = useRef<HTMLElement | null>(null);
+  const focusBack = useRef(false);
   const shellLayout = toLayout(layout);
   const shellBreakpoint = toBreakpoint(breakpoint);
   const canCollapse = collapsible !== false;
@@ -129,12 +158,23 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
     onChange: onCollapsedChange,
     name: 'AppShell `collapsed`',
   });
-  const [open, setOpen] = useControllableState({
+  const [open, setOpenState] = useControllableState({
     value: openProp,
     defaultValue: defaultOpen ?? false,
     onChange: onOpenChange,
     name: 'AppShell `open`',
   });
+  // The sheet: the sidebar as a modal layer. On a wide screen `open` does nothing, and a parent that
+  // keeps it true there gets the sheet back when the window narrows.
+  const modal = open && !isWide;
+  const setOpen = useCallback(
+    (next: boolean, { returnFocus: back = true, opener: from }: AppShellSetOpenOptions = {}) => {
+      if (next && from !== undefined) opener.current = from;
+      focusBack.current = !next && back;
+      setOpenState(next);
+    },
+    [setOpenState],
+  );
   // A sidebar that cannot fold is never a rail, whatever `collapsed` says.
   const collapsed = canCollapse && collapsedState;
   const setCollapsed = useCallback(
@@ -165,8 +205,14 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
         `<${name}> must be a direct child of <AppShell>: a component around it is fine, an element around it is not.`,
       );
     }
+    // A part that comes while the sheet is open is shut out like the others.
+    if (modalRef.current && part !== 'sidebar' && !element.inert) {
+      element.inert = true;
+      inerted.current.add(element);
+    }
     return () => {
       elements.delete(element);
+      inerted.current.delete(element);
     };
   }, []);
 
@@ -189,6 +235,74 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
     }
   }, []);
 
+  // A window that grows wide closes the sheet. It is the crossing that counts, not the state: a parent
+  // that keeps `open` true is not asked again until the window has been narrow once more.
+  const wasWide = useRef(isWide);
+  useEffect(() => {
+    if (isWide && !wasWide.current && open) setOpen(false, { returnFocus: false });
+    wasWide.current = isWide;
+  }, [isWide, open, setOpen]);
+
+  // Everything the sheet does to the page, done after the commit that shows it and undone in the one
+  // that hides it. `inert` goes on as a DOM property: React 18.3 does not know it as a boolean
+  // attribute, and 19 does, so a prop would differ between them.
+  useIsoLayoutEffect(() => {
+    modalRef.current = modal;
+    if (!modal) return undefined;
+    // The parts register in effects that run after this one, so the shell finds its direct children
+    // in the document, which is also where `inert` and the focus are about.
+    const root = rootRef.current;
+    const sidebar =
+      root?.querySelector<HTMLElement>(':scope > .flg-app-shell-sidebar') ?? undefined;
+    const shutOut = [
+      skipRef.current,
+      ...(root?.querySelectorAll<HTMLElement>(
+        ':scope > :is(.flg-app-shell-header, .flg-app-shell-main, .flg-app-shell-footer)',
+      ) ?? []),
+    ];
+    for (const element of shutOut) {
+      if (element && !element.inert) {
+        element.inert = true;
+        inerted.current.add(element);
+      }
+    }
+    if (
+      shutOut.some(
+        (element) => element?.matches('.flg-toaster') || element?.querySelector('.flg-toaster'),
+      )
+    ) {
+      devWarn(
+        '<Toaster> is inside a part of <AppShell> that goes inert while the navigation is open, so its toasts cannot be reached. Render it outside <AppShell> or as its direct child.',
+      );
+    }
+    const release = lockScroll();
+    if (sidebar) focusFirst(sidebar);
+
+    const onKeyDown = (event: KeyboardEvent) => {
+      if (event.key !== 'Escape' || event.defaultPrevented) return;
+      // A dialog opened from the sidebar takes the key, and so does a popover that is open in it: the
+      // browser closes that one as the default action of this very key press.
+      if (getTopModal() || (sidebar && hasOpenPopover(sidebar))) return;
+      setOpen(false);
+    };
+    document.addEventListener('keydown', onKeyDown);
+
+    return () => {
+      document.removeEventListener('keydown', onKeyDown);
+      modalRef.current = false;
+      for (const element of inerted.current) element.inert = false;
+      inerted.current.clear();
+      release();
+      if (focusBack.current) {
+        const visible = [...triggers.current].find(
+          (trigger) => trigger.checkVisibility?.() ?? true,
+        );
+        returnFocus(opener.current?.isConnected ? opener.current : visible, sidebar, visible);
+      }
+      focusBack.current = false;
+    };
+  }, [modal, setOpen]);
+
   const context = useMemo<AppShellContextValue>(
     () => ({
       layout: shellLayout,
@@ -238,10 +352,21 @@ export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppSh
         data-open={dataAttr(open)}
         {...props}
       >
-        <a className="flg-app-shell-skip flg-visually-hidden" href={`#${mainId}`}>
+        <a ref={skipRef} className="flg-app-shell-skip flg-visually-hidden" href={`#${mainId}`}>
           {words.skipToContent}
         </a>
         {children}
+        {modal ? (
+          // A click that ends here after a selection that began in the sidebar has the shell as its
+          // target, not this element, so it does not reach it.
+          <div
+            className="flg-app-shell-scrim"
+            aria-hidden="true"
+            onClick={(event) => {
+              if (event.target === event.currentTarget) setOpen(false);
+            }}
+          />
+        ) : null}
       </div>
     </AppShellContext.Provider>
   );
@@ -310,7 +435,7 @@ export const AppShellSidebarTrigger = forwardRef<HTMLButtonElement, AppShellSide
     const toggle = () => {
       if (!context) return;
       if (context.isWide) context.setCollapsed(!context.collapsed);
-      else context.setOpen(!context.open);
+      else context.setOpen(!context.open, { opener: own.current });
     };
 
     return (
@@ -345,15 +470,37 @@ export const AppShellSidebar = forwardRef<HTMLDivElement, AppShellSidebarProps>(
     const context = useAppShellPart('sidebar', own);
     const fallbackId = useId();
     const mergedRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, own), [ref]);
+    // A sheet while it is open on a narrow screen: a dialog, with the name of the navigation. The
+    // caller's own role and name come after and win.
+    const sheet = context !== null && context.open && !context.isWide;
+    const close = sheet ? (
+      <IconButton
+        variant="ghost"
+        size="md"
+        className="flg-app-shell-sidebar-close"
+        aria-label={context.labels.closeNavigation}
+        onClick={() => context.setOpen(false)}
+      >
+        <CloseIcon />
+      </IconButton>
+    ) : null;
     return (
       <div
         ref={mergedRef}
         className={clsx('flg-app-shell-sidebar', className)}
+        role={sheet ? 'dialog' : undefined}
+        aria-label={sheet ? context.labels.navigation : undefined}
         {...props}
         id={context?.sidebarId ?? fallbackId}
       >
         <div className="flg-surface flg-app-shell-sidebar-panel">
-          <div className="flg-app-shell-sidebar-head">{context?.brand}</div>
+          {/* The button stands where the trigger and the brand stand in the header: after the brand
+              where the brand is the sidebar's (S1), before it where the header has the trigger (S2). */}
+          <div className="flg-app-shell-sidebar-head">
+            {context?.layout === 'header' ? close : null}
+            {context?.brand}
+            {context?.layout === 'header' ? null : close}
+          </div>
           <div className="flg-app-shell-sidebar-body">{children}</div>
         </div>
       </div>
diff --git a/src/components/app-shell/app-shell-context.ts b/src/components/app-shell/app-shell-context.ts
index d18d697..2e3c45e 100644
--- a/src/components/app-shell/app-shell-context.ts
+++ b/src/components/app-shell/app-shell-context.ts
@@ -9,14 +9,28 @@ export type AppShellBreakpoint = 'md' | 'lg' | 'xl';
 export interface AppShellLabels {
   /** The text of the skip link, the first thing a keyboard reaches. */
   skipToContent: string;
+  /** The name of the sidebar while it is open as a sheet, which then is a dialog. */
+  navigation: string;
   /** The name of the trigger on a narrow screen, where it opens the navigation. */
   openNavigation: string;
+  /** The name of the button that closes the sheet. */
+  closeNavigation: string;
   /** The name of the trigger on a wide screen while the sidebar is expanded. */
   collapseSidebar: string;
   /** The name of the trigger on a wide screen while the sidebar is a rail. */
   expandSidebar: string;
 }
 
+export interface AppShellSetOpenOptions {
+  /**
+   * Whether focus goes back to the button that opened the sheet once it is closed. Default `true`; a
+   * close that follows a change of the window leaves the focus where it is.
+   */
+  returnFocus?: boolean;
+  /** The button that opens the sheet, so that focus can come back to it. */
+  opener?: HTMLElement | null;
+}
+
 /** The parts the shell lays out; each of them is a cell of its grid. */
 export type AppShellPart = 'header' | 'sidebar' | 'main' | 'footer';
 
@@ -44,7 +58,7 @@ export interface AppShellContextValue {
   setCollapsed: (collapsed: boolean) => void;
   /** Whether the sidebar is open as a sheet on a narrow screen. */
   open: boolean;
-  setOpen: (open: boolean) => void;
+  setOpen: (open: boolean, options?: AppShellSetOpenOptions) => void;
   /** Drawn twice, at the head of the header and at the head of the sidebar; CSS shows one. */
   brand: ReactNode;
   mainId: string;
diff --git a/src/styles/components/app-shell.css b/src/styles/components/app-shell.css
index ca62482..a43533d 100644
--- a/src/styles/components/app-shell.css
+++ b/src/styles/components/app-shell.css
@@ -112,6 +112,21 @@
     overscroll-behavior: contain;
   }
 
+  /* The sidebar as a sheet (§3.4) is the rules of generated/app-shell.css for the screens narrower than
+     the breakpoint. These are what it needs at every width: the button that closes it, drawn only while
+     it is a sheet (S1 pushes it to the end of the head, S2 has it first, where the trigger is in the
+     header), and the scrim, which is out of the grid until the sheet shows it. */
+  .flg-app-shell-sidebar-close {
+    flex: none;
+    --flg-button-icon: 18px;
+  }
+  .flg-app-shell[data-layout='sidebar'] .flg-app-shell-sidebar-close {
+    margin-left: auto;
+  }
+  .flg-app-shell-scrim {
+    display: none;
+  }
+
   .flg-app-shell-main {
     grid-column: 1;
     grid-row: 2;
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/components/app-shell src/index.test.ts
pnpm vitest run --project scripts
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm build && pnpm check:package
pnpm build-storybook
```

Expected:
- Unit: 237 test PASS (12 file, hai project React cộng lại; `AppShellDrawer.test.tsx` 34 test ở mỗi project), không lỗi kiểu. Test `inert` chạy cả ở React 18.3.
- `scripts`: 82 test PASS, trong đó 15 test của `app-shell-css.test.ts`.
- Story app-shell: 105 test PASS ở mỗi project (35 story × ba engine). axe chạy sau play function, không có vi phạm.
- `pnpm build && pnpm check:package`: PASS. `check:dist-css` thấy hai class mới và khối tấm trượt; `size`: JS 49.4 kB trên 51.71 kB, CSS 14.03 kB trên 14.05 kB (còn 20 B; brotli nén tốt ba khối lặp lại). Không chạy `size:record`.
- `pnpm build-storybook`: PASS. Tám story AppShell không gắn `no-visual`: sáu story của Task 3 cùng `SidebarPhoneOpen` và `HeaderPhoneOpen` (125 story có ảnh). 27 story còn lại của AppShell gắn `no-visual`.
- Không chạy `check:contrast` (không có cặp mới) hay fixture (Plan C).
- Ảnh chuẩn của component cũ giữ nguyên (phát hiện 15).

- [ ] **Step 5: Commit**

```bash
git add \
  .storybook/app-shell-demo.tsx \
  docs/superpowers/specs/2026-11-10-h2d-glass-ui-phase-5-design.md \
  scripts/check-dist-css.ts \
  scripts/lib/app-shell-css.test.ts \
  scripts/lib/app-shell-css.ts \
  src/components/app-shell/AppShell.stories.tsx \
  src/components/app-shell/AppShell.test-d.ts \
  src/components/app-shell/AppShell.tsx \
  src/components/app-shell/AppShellDrawer.test.tsx \
  src/components/app-shell/AppShellSidebarTrigger.test.tsx \
  src/components/app-shell/app-shell-context.ts \
  src/styles/components/app-shell.css \
  tests/app-shell-window.ts
```
```bash
git commit -m "feat(app-shell): add the narrow-screen sheet" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 5: `AppShell.mdx`, ghi chú Accessibility và ngưỡng kích thước của Plan A

Spec §8 (`AppShell.mdx` và mục "Looks"; ghi chú AppShell của trang Accessibility; bảng §4.9 tự dựng từ `scripts/contrast-exceptions.ts`), §9. Không có code của lib. Task này kết thúc bằng kiểm tra cuối của cả nhánh.
- **`AppShell.mdx`** thay trang autodocs, và có mọi điểm AppShell của §8: hai bố cục và khi nào dùng cái nào, điểm gãy và biến `--flg-app-shell-…`, rail và công thức cookie, tấm trượt và chỗ đặt `Toaster`, các phần là con trực tiếp trong DOM, render từ server, brand không mang `id`, hai quy tắc cho tài liệu (vì sao, và cách ghi đè), Accessibility, "Do and don't".
- **Ví dụ sống** là `<iframe>` của story, không phải `<Canvas>` (phát hiện 11).
- **Trang Accessibility:** câu trỏ thêm AppShell; mục mới "The app shell" (phát hiện 11).
- **Ngưỡng kích thước** cho cả Plan A, ghi bằng `pnpm size:record` (không chép `.size-limit.json`).
- Trang không nói việc kích hoạt một `NavItem` thì đóng tấm (Plan B).

**Files:**
- Create: `src/components/app-shell/AppShell.mdx`
- Modify: `src/docs/Accessibility.mdx`, `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- `AppShell.mdx`: `<Meta of={Stories} />` của `AppShell.stories.tsx`; các mục `## Props` (`AppShell`, `AppShellHeader`, `AppShellSidebar, AppShellMain, AppShellFooter`, `AppShellSidebarTrigger`, `AppShellBrand`, `Labels`), `## Looks`, `## Breakpoints`, `## The rail`, `## The sheet` (cùng `### Where to put the Toaster`), `## The parts are direct children`, `## Server rendering`, `## Brand, and why it has no id`, `## Rules for the document`, `## Accessibility`, `## Do and don't`.
- `<iframe src="iframe.html?id=…&viewMode=story">` của `components-appshell--sidebar`, `components-appshell--header`, `components-appshell--sidebar-rail` (rộng tối thiểu 1100px trong một khung cuộn ngang) và `components-appshell--sidebar-phone-open` (rộng 390px). Đổi tên các story đó là hỏng trang.
- `src/docs/Accessibility.mdx`: câu trỏ thêm "AppShell (its part in rows 2 and 6)"; mục `## The app shell`, trước "A `<dialog>` the library did not create".
- `.size-limit.json`: ngưỡng mới JS 54338 B, CSS 15436 B (do `size:record` ghi).
- Không có export, class, CSS hay token mới.
- Consumes: các story của Task 2–4 (id ở trên).
- Plan C dùng: mục "App shell" của Getting started và trang "Examples/App shell" trỏ về trang này.

- [ ] **Step 1: Viết test**

Task này không có patch test: nó chỉ viết docs và ghi ngưỡng, không có hành vi nào để một test fail trước (phát hiện 13). Đi thẳng tới Step 3.

- [ ] **Step 2: Chạy test, xác nhận fail**

Không có (Step 1).

- [ ] **Step 3: Viết code**

````diff
diff --git a/src/components/app-shell/AppShell.mdx b/src/components/app-shell/AppShell.mdx
new file mode 100644
index 0000000..3dd6ae9
--- /dev/null
+++ b/src/components/app-shell/AppShell.mdx
@@ -0,0 +1,358 @@
+import { Meta } from '@storybook/addon-docs/blocks';
+import * as Stories from './AppShell.stories';
+
+<Meta of={Stories} />
+
+# AppShell
+
+The frame of an application: a header, a sidebar, the main content and a footer, laid out on a grid
+by CSS alone, so the HTML from the server is already right at every width. On a wide screen the
+sidebar is a column that can fold into a rail; on a narrow one it is a sheet that slides in from the
+left. The page scrolls with the document, and the header and the sidebar stick.
+
+```tsx
+'use client';
+
+import {
+  AppShell,
+  AppShellBrand,
+  AppShellFooter,
+  AppShellHeader,
+  AppShellMain,
+  AppShellSidebar,
+} from 'h2d-glass-ui';
+
+export function Shell({ children }: { children: React.ReactNode }) {
+  return (
+    <AppShell brand={<AppShellBrand logo={<LogoMark />} name="Lumen" href="/" />}>
+      <AppShellHeader>{/* search, notifications, the user */}</AppShellHeader>
+      <AppShellSidebar>{/* the navigation */}</AppShellSidebar>
+      <AppShellMain>{children}</AppShellMain>
+      <AppShellFooter>© 2026 Lumen</AppShellFooter>
+    </AppShell>
+  );
+}
+```
+
+<div style={{ overflowX: 'auto' }}>
+  <iframe
+    title="The sidebar layout on a wide screen"
+    src="iframe.html?id=components-appshell--sidebar&viewMode=story"
+    loading="lazy"
+    style={{
+      display: 'block',
+      width: '100%',
+      minWidth: 1100,
+      height: 640,
+      border: '1px solid #8884',
+      borderRadius: 12,
+    }}
+  />
+</div>
+
+## Props
+
+### AppShell
+
+| Prop                | Type                           | Default     | Does                                                                               |
+| ------------------- | ------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
+| `layout`            | `'sidebar' \| 'header'`        | `'sidebar'` | Where the sidebar and the header sit (see Looks)                                   |
+| `breakpoint`        | `'md' \| 'lg' \| 'xl'`         | `'lg'`      | The width from which the sidebar is in the grid: 768, 1024 or 1280px               |
+| `brand`             | `ReactNode`                    | none        | Drawn at the head of the header and of the sidebar; `AppShellBrand` is made for it |
+| `collapsible`       | `boolean`                      | `true`      | Whether the sidebar can fold into a rail on a wide screen                          |
+| `collapsed`         | `boolean`                      | none        | Whether the sidebar is a rail (wide screens). Controlled                           |
+| `defaultCollapsed`  | `boolean`                      | `false`     | The same, uncontrolled                                                             |
+| `onCollapsedChange` | `(collapsed: boolean) => void` | none        | Called when the trigger folds or unfolds the sidebar                               |
+| `open`              | `boolean`                      | none        | Whether the sidebar is open as a sheet (narrow screens). Controlled                |
+| `defaultOpen`       | `boolean`                      | `false`     | The same, uncontrolled                                                             |
+| `onOpenChange`      | `(open: boolean) => void`      | none        | Called when the sheet opens or closes, including when the window grows wide        |
+| `labels`            | `Partial<AppShellLabels>`      | English     | The words of the frame (see Labels)                                                |
+
+`ref`, `className`, `style` and the other attributes of a `div` go to the root. `layout` and
+`breakpoint` are also on the root as `data-layout` and `data-breakpoint`; a value outside the union
+gets the default. A `collapsed` or `defaultCollapsed` on a shell that is not `collapsible` is
+ignored, and warned about in development.
+
+### AppShellHeader
+
+| Prop             | Type      | Default | Does                                                                  |
+| ---------------- | --------- | ------- | --------------------------------------------------------------------- |
+| `sidebarTrigger` | `boolean` | `true`  | Draws the `AppShellSidebarTrigger`, then the brand, before `children` |
+
+The other attributes of a `header` go to the element. Pass `sidebarTrigger={false}` to put an
+`AppShellSidebarTrigger` somewhere else in the header yourself.
+
+### AppShellSidebar, AppShellMain, AppShellFooter
+
+`AppShellSidebar` (a `div`), `AppShellMain` (a `main`) and `AppShellFooter` (a `footer`) take the
+attributes of their element. `AppShellSidebar` and `AppShellMain` take no `id`: the shell makes
+them, for `aria-controls` of the trigger and for the skip link. `ref`, `className` and `style` of the
+sidebar go to its column, which has no look of its own; the glass is a panel inside it.
+
+### AppShellSidebarTrigger
+
+The button that opens the sidebar on a narrow screen and folds it into a rail on a wide one. It is an
+`IconButton` (`ghost`, `md`) with a menu icon; `AppShellHeader` draws it. It takes the props of a
+`Button` except `aria-label`, `aria-labelledby` and `children`: its name is one of the `labels`.
+
+### AppShellBrand
+
+| Prop      | Type        | Does                                                                               |
+| --------- | ----------- | ---------------------------------------------------------------------------------- |
+| `name`    | `ReactNode` | The name of the application: the text of the link                                  |
+| `logo`    | `ReactNode` | A mark drawn before the name. It is decoration, hidden from assistive technology   |
+| `href`    | `string`    | Makes it a link (`a`); without it, it is a `span`                                  |
+| `asChild` | `boolean`   | Renders the one child element (a router's `Link`) with the logo and the name in it |
+
+With `asChild` the child keeps its own props and its content is replaced by the logo and the name,
+as with `Button asChild`:
+
+```tsx
+<AppShellBrand asChild logo={<LogoMark />} name="Lumen">
+  <Link href="/" />
+</AppShellBrand>
+```
+
+### Labels
+
+`labels` holds every word of the frame, in one place, on `AppShell`. A key given as `undefined`
+keeps its English default.
+
+| Key               | Default              | Where                                       |
+| ----------------- | -------------------- | ------------------------------------------- |
+| `skipToContent`   | `"Skip to content"`  | The skip link                               |
+| `navigation`      | `"Navigation"`       | The name of the sidebar while it is a sheet |
+| `openNavigation`  | `"Open navigation"`  | The trigger on a narrow screen              |
+| `closeNavigation` | `"Close navigation"` | The close button of the sheet               |
+| `collapseSidebar` | `"Collapse sidebar"` | The trigger on a wide screen, sidebar open  |
+| `expandSidebar`   | `"Expand sidebar"`   | The trigger on a wide screen, as a rail     |
+
+## Looks
+
+`layout` picks where the sidebar and the header sit. The default theme draws both as approved.
+
+- `layout="sidebar"` (default): the sidebar runs from the top of the screen to the bottom, with the
+  brand at its head. The header and the footer sit over the content column only. The brand is the
+  application's name and the sidebar its spine, so use it for a tool people live in: an admin
+  console, a mail client, a dashboard.
+- `layout="header"`: the header runs across the whole width, with the trigger and the brand at its
+  left, and so does the footer, under the sidebar. The sidebar starts under the header, and at the
+  end of the page the footer pushes it up. Use it where the page is the content and the navigation
+  is a help to it: a documentation site, a settings area, a shop's account pages.
+
+<div style={{ overflowX: 'auto' }}>
+  <iframe
+    title="The header layout on a wide screen"
+    src="iframe.html?id=components-appshell--header&viewMode=story"
+    loading="lazy"
+    style={{
+      display: 'block',
+      width: '100%',
+      minWidth: 1100,
+      height: 640,
+      border: '1px solid #8884',
+      borderRadius: 12,
+    }}
+  />
+</div>
+
+## Breakpoints
+
+`breakpoint` says from which width the sidebar is a column in the grid: `md` 768px, `lg` 1024px
+(default), `xl` 1280px. Below it the grid has one column and the sidebar is a sheet; from it the
+sidebar is a column of 264px, or of 68px as a rail. There is one boundary per breakpoint, so no width
+is left without a rule. The CSS for it is generated once for each of the three values, and the script
+uses the same media query as the CSS, so what the code says and what the page shows agree.
+
+The widths and the header are variables on the root, which you set with `style` on `AppShell`:
+
+| Variable                        | Default                                         | Is                                                |
+| ------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
+| `--flg-app-shell-sidebar-width` | `264px`                                         | The sidebar column                                |
+| `--flg-app-shell-rail-width`    | `68px`                                          | The sidebar column as a rail                      |
+| `--flg-app-shell-drawer-width`  | `300px`                                         | The sheet (never wider than the screen less 48px) |
+| `--flg-app-shell-header-height` | `56px` on a narrow screen, `60px` on a wide one | The row of the header                             |
+
+`--flg-app-shell-header-height` is `0px` when there is no `AppShellHeader`. They are the measures of
+the frame, not tokens of the theme.
+
+```tsx
+<AppShell style={{ '--flg-app-shell-sidebar-width': '300px' } as CSSProperties}>
+```
+
+## The rail
+
+On a wide screen the trigger folds the sidebar into a rail: the column goes from 264px to 68px, and
+the brand in the sidebar (the `sidebar` layout) keeps only its mark, and its name stays in the page,
+out of sight, as the name of the link. In the `header` layout only the column under the header
+narrows. What is inside the sidebar is yours to draw as a rail, from `[data-collapsed]` on the root. There is
+no animation: a changing column makes the whole page lay itself out again on every frame. On a narrow
+screen the sheet is always the open form, whatever `collapsed` says, and a rail stays a rail when the
+window crosses the breakpoint. With `collapsible={false}` there is no rail and the trigger is hidden
+on a wide screen.
+
+<div style={{ overflowX: 'auto' }}>
+  <iframe
+    title="The sidebar layout as a rail"
+    src="iframe.html?id=components-appshell--sidebar-rail&viewMode=story"
+    loading="lazy"
+    style={{
+      display: 'block',
+      width: '100%',
+      minWidth: 1100,
+      height: 640,
+      border: '1px solid #8884',
+      borderRadius: 12,
+    }}
+  />
+</div>
+
+The library does not keep the state. Save it in `onCollapsedChange`, and read it on the server so the
+first HTML is already the right width. With a cookie in Next.js:
+
+```tsx
+// app/(app)/layout.tsx: a Server Component
+const collapsed = (await cookies()).get('flg-sidebar')?.value === 'collapsed';
+return <Shell defaultCollapsed={collapsed}>{children}</Shell>;
+
+// shell.tsx: 'use client'
+<AppShell
+  defaultCollapsed={defaultCollapsed}
+  onCollapsedChange={(c) => {
+    document.cookie = `flg-sidebar=${c ? 'collapsed' : 'expanded'}; path=/; max-age=31536000; samesite=lax`;
+  }}
+>
+```
+
+## The sheet
+
+Under the breakpoint the sidebar is closed, and the trigger opens it as a sheet over the page. It is
+still the one sidebar element of the grid (a `Drawer` would need the navigation twice, or moved about
+with its state lost), made modal by the shell:
+
+- The skip link, the header, the main and the footer are `inert`, and the page does not scroll.
+- Focus goes to the first thing in the sidebar: the close button, or in the `sidebar` layout the link
+  of the brand first. It goes back to the trigger that opened it when the sheet closes.
+- Esc, a click on the dimmed page and the close button close it. A press on the sidebar's text that
+  ends on the dimmed page does not. Esc is left alone when a dialog opened from the sidebar is on
+  top, when a popover in the sidebar is open, and when something else has already used the key.
+- A window that grows to the breakpoint closes it (`onOpenChange(false)`).
+
+`open` and `onOpenChange` control it. A parent that keeps `open` true gets nothing from it on a wide
+screen, and gets the sheet back when the window narrows again.
+
+<iframe
+  title="The sheet open on a phone"
+  src="iframe.html?id=components-appshell--sidebar-phone-open&viewMode=story"
+  loading="lazy"
+  style={{
+    display: 'block',
+    width: 390,
+    maxWidth: '100%',
+    height: 640,
+    border: '1px solid #8884',
+    borderRadius: 12,
+  }}
+/>
+
+### Where to put the Toaster
+
+Toasts live in the top layer, so they stay above the sheet, in sight and pressable. That holds only
+while the `Toaster` is not inside the header, the main or the footer: those are `inert` while the
+sheet is open, and take what is in them with them. Render `<Toaster />` outside `AppShell`, or as its
+direct child. In development the shell warns when it finds one in a part that goes inert.
+
+```tsx
+<>
+  <AppShell>{/* … */}</AppShell>
+  <Toaster />
+</>
+```
+
+## The parts are direct children
+
+The header, the sidebar, the main and the footer are cells of the grid, so they must be direct
+children of `AppShell` in the DOM. A component of yours that renders one of them and adds no element
+around it is fine; a `div` around one is not, and the shell says so in development. The order in
+your JSX is free, since CSS sets the positions. Write the header, the sidebar, the main and the
+footer: the banner, then the navigation, then the content.
+
+With no `AppShellFooter` the third row is empty. With no sidebar the grid is one column at every
+width, and the trigger is hidden.
+
+## Server rendering
+
+The shell is a client component, since it measures the header and keeps the state of the sheet. The
+page around it can be a Server Component: it renders a small client component like `Shell` above and
+passes it the page as `children`, and what is in `AppShellMain` stays on the server. `AppShellBrand`
+needs no client code and can be rendered on the server and given as `brand`.
+
+The layout, the rail and the closed sheet are CSS, so the HTML from the server is right at every
+width. The few things only the window knows are fixed after hydration: the first render is the narrow
+one, and on a wide screen the name of the trigger changes from "Open navigation" to "Collapse
+sidebar" (or "Expand sidebar"). Nothing on the page moves.
+
+## Brand, and why it has no id
+
+`brand` is drawn twice, in the header and in the sidebar, and CSS shows one of the two: where the
+sidebar is a column in the `sidebar` layout it is the sidebar's, everywhere else the header's. So an
+`AppShellBrand` must not carry an `id`, which would then be in the page twice. Give it a `className`
+if you need a handle. A `brand` that is not an `AppShellBrand` works as well, but the shell does not
+know which part of it is the name, so it cannot hide that part at the rail.
+
+## Rules for the document
+
+The shell is the first thing in the library that styles the page itself, and only on a page that
+renders one. Both rules are in `@layer flg.components`, so a rule of yours, outside any layer, wins.
+
+- **`scroll-padding-top` on `<html>`** equals the height of the header. A sticky header covers the top
+  of the screen, so without it a control focused with Shift+Tab, a link to `#anchor` or a hit of
+  find-in-page can land under it, where it cannot be seen (WCAG 2.4.11). `AppShell` measures the
+  header and writes the height as `--flg-app-shell-header-offset` on `<html>`; until it has, 56px or
+  60px is used, so the HTML from the server is right too. The skip link goes to the main by the same
+  rule, so `AppShellMain` needs no margin of its own.
+- **`margin: 0` on `<body>`.** The browser's 8px margin would leave a border around a frame that is
+  meant to touch the four edges of the screen, push the header 8px from the top and, with the
+  `min-height` of the shell, give a short page a scrollbar.
+
+To use your own, write it unlayered, and add the header height yourself:
+
+```css
+html {
+  scroll-padding-top: calc(var(--flg-app-shell-header-offset, 56px) + 16px);
+}
+body {
+  margin: 8px;
+}
+```
+
+## Accessibility
+
+- The skip link is the first thing in the shell and goes to the main, which takes the focus
+  (`tabindex="-1"`). It is out of sight until it has the focus.
+- The landmarks are the `header` (banner), the `main` and the `footer` (contentinfo). The sidebar is a
+  `div`, not a landmark: put a `<nav>` in it, with a name if the page has more than one.
+- The trigger is a button that says what it does: "Open navigation" with `aria-expanded` on a narrow
+  screen, "Collapse sidebar" or "Expand sidebar" with `aria-expanded` on a wide one, and
+  `aria-controls` that points at the sidebar. While the sheet is open the header is `inert`, so the
+  name of the button that closes it is the one in the sidebar.
+- While it is a sheet the sidebar is a `role="dialog"` named "Navigation", and it has no
+  `aria-modal`. The rest of the frame is really `inert`, and `aria-modal` makes some browsers and
+  screen readers drop everything outside the dialog from the tree, toasts included. Tab goes only
+  through the sidebar and what is outside the shell (the toasts).
+- Focus is not left under the sticky header (see the rules for the document), and the shell never
+  uses a keyboard shortcut of its own; fold the rail from your own shortcut if you want one.
+- The focus ring of the brand link and the skip link, and the text of the footer, are among the
+  contrast gaps of rows 2 and 6 in the table on the Accessibility page. In forced colours the skip
+  link takes system colours.
+
+## Do and don't
+
+- Do put the `Toaster` outside the shell.
+- Do give the shell the saved width of the rail from a cookie, so there is no jump.
+- Do keep the parts as direct children of `AppShell`.
+- Do use `AppShellBrand` for `brand`, with no `id`.
+- Don't put a `<main>` of your own inside `AppShellMain`.
+- Don't use a `div` around a part; use a component that adds no element.
+- Don't wrap `AppShell` in an element that has a `transform`, `filter` or `opacity`: the sheet is
+  `position: fixed` and would be placed against it, not the screen.
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index c0029db..4e02e7d 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -63,7 +63,8 @@ application's responsibility.
 The contrast gaps of the Slider (rows 15 to 17), Calendar (row 18), FileUpload (rows 19 to 22),
 Alert (rows 23 to 26), Progress (rows 27 to 29), Stepper (rows 30 and 31, and its part in rows 26,
 27 and 29), List (its part in rows 31 and 32) and Table (rows 32 to 34, and its part in rows 2, 6,
-9, 12 and 22) are in the table above, which is built from the same data CI checks.
+9, 12 and 22) and AppShell (its part in rows 2 and 6) are in the table above, which is built from
+the same data CI checks.
 
 A List row that can be pressed has one link or button, the title, stretched over the whole row. It
 is named by the title alone: the description and the end cell are read when the person browses the
@@ -108,6 +109,26 @@ when a change is announced.
   `role="progressbar"` element. It is read when the person reaches it; the library does not announce
   each percent.
 
+## The app shell
+
+- **Skip link and landmarks.** `AppShell` starts with a skip link ("Skip to content") that goes to
+  `AppShellMain`, which takes the focus. The `header` is the banner, the `main` the main landmark and
+  the `footer` the contentinfo. The sidebar is a plain `div`, so the `<nav>` you put in it is the
+  navigation landmark; give it a name if the page has more than one.
+- **The sheet is a dialog, with no `aria-modal`.** On a narrow screen the open sidebar has
+  `role="dialog"` and the name "Navigation", and the skip link, the header, the main and the footer
+  are `inert`, so Tab stays in the sidebar. It does not set `aria-modal`: some browser and screen
+  reader pairs take it to mean that everything outside the dialog is gone from the accessibility
+  tree, and that would take the toasts with it. Focus goes into the sidebar and comes back to the
+  button that opened it.
+- **Toasts above the sheet.** The toasts are in the top layer, so they stay in sight and can be
+  pressed while the sheet is open, as long as the `Toaster` is not inside the header, the main or the
+  footer: those are `inert` with everything in them. Render the `Toaster` outside `AppShell`.
+- **The trigger** names what it does now: "Open navigation" on a narrow screen, "Collapse sidebar" or
+  "Expand sidebar" on a wide one, with `aria-expanded` and `aria-controls`.
+- **Where a scrolled-to element lands.** The shell gives `<html>` a `scroll-padding-top` equal to the
+  height of the sticky header, so focus, an `#anchor` and find-in-page never end up under it.
+
 ## A `<dialog>` the library did not create
 
 The library tracks the Dialogs and Drawers it opens. A modal `<dialog>` from anywhere else is not in
````

Build, rồi kiểm tra gói trước khi ghi ngưỡng:

```bash
pnpm gen:theme
pnpm build
pnpm check:package
```

Expected: PASS với ngưỡng cũ (CSS 14.03 kB trên 14.05 kB, JS 49.4 kB trên 51.71 kB): task này không đổi CSS hay JS.

Ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó:

```bash
pnpm size:record
```

Expected: ngưỡng mới gần JS 54338 B, CSS 15436 B (trước: 51713 B, 14052 B), là kết quả ở bản nháp; ngưỡng là số đo cộng 10%. Nếu số khác một chút, giữ số do `size:record` ghi và nêu trong báo cáo.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
pnpm vitest run --project unit --project unit-react18 src/docs
pnpm build && pnpm check:package
pnpm build-storybook
pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS. Dòng văn của hai trang MDX không quá 100 ký tự.
- `src/docs`: 2 file, 6 test PASS (`ExceptionTable` vẫn đòi 34 dòng; nó không đọc nhãn).
- `pnpm check:package`: PASS với ngưỡng mới: JS 49.4 kB trên 54.34 kB, CSS 14.03 kB trên 15.44 kB.
- `pnpm build-storybook`: PASS, nên `AppShell.mdx` và `Accessibility.mdx` biên dịch được. Index có đúng một mục docs của AppShell, `components-appshell--docs`. Lệnh không mở cổng nào.
- `pnpm check:docs-tables`: `Docs tables: no table built as text in 177 files.`
- Task này không đổi file nào trong `src` ngoài hai trang MDX, nên unit, story và ảnh chuẩn không đổi.

Kiểm tra cuối của cả nhánh, như Claude chạy ở đầu nhánh nháp `c41fb4c` (nay là `e27bd07`, chỉ khác tên một test):

```bash
pnpm gen:theme
pnpm check:name
npx tsc --noEmit -p .
pnpm test:unit
pnpm check:contrast
pnpm build && pnpm check:package
pnpm build-storybook
pnpm vitest run --project storybook-light src/components/app-shell
pnpm vitest run --project storybook-dark src/components/app-shell
pnpm vitest run --project storybook-light src/docs
pnpm vitest run --project storybook-dark src/docs
node -e "const e=Object.values(require('./storybook-static/index.json').entries);const v=e.filter((x)=>x.type==='story'&&!(x.tags||[]).includes('no-visual'));console.log(v.length);console.log(v.filter((x)=>x.id.startsWith('components-appshell--')).map((x)=>x.id).join(' '));console.log(e.filter((x)=>x.type==='docs'&&x.id.startsWith('components-appshell')).map((x)=>x.id).join(' '))"
```

Expected:
- `pnpm check:name`: PASS (`check:name: no "fl-glass-ui" outside docs/superpowers.`).
- `npx tsc --noEmit -p .`: PASS.
- `pnpm test:unit`: 3773 test PASS, 3 skip (188 file).
- `pnpm check:contrast`: PASS (`Contrast check passed.`).
- `pnpm check:package`: PASS với ngưỡng của Step 3.
- `pnpm build-storybook`: PASS. Thư mục `storybook-static` bị git bỏ qua.
- Story: app-shell 105 test PASS, docs 30 test PASS, ở mỗi project.
- Lệnh `node` in `125`, rồi `components-appshell--sidebar components-appshell--header components-appshell--sidebar-rail components-appshell--header-rail components-appshell--sidebar-phone components-appshell--header-phone components-appshell--sidebar-phone-open components-appshell--header-phone-open`, rồi `components-appshell--docs`: tám story giao diện, 64 ảnh chuẩn mới, như mô tả PR phải nêu (phát hiện 16).
- Không chạy cả bộ story một lượt; CI chạy cả bộ. Không chạy fixture: Plan A không đổi fixture.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  src/components/app-shell/AppShell.mdx \
  src/docs/Accessibility.mdx
```
```bash
git commit -m "docs(app-shell): add the AppShell page, the accessibility notes and the size limits" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

## Sau khi thực thi

- Đẩy nhánh, rồi tạo ảnh chuẩn bằng workflow "Update visual baselines": 64 ảnh mới của tám story giao diện (`Sidebar`, `Header`, `SidebarRail`, `HeaderRail`, `SidebarPhone`, `HeaderPhone`, `SidebarPhoneOpen`, `HeaderPhoneOpen`, mỗi story 4 chế độ × sáng, tối). Xem ảnh trước khi xin review: khớp s1, s2 ở chế độ `normal`; ảnh cũ của mọi component khác không đổi.
- Mô tả PR nêu cho chủ dự án: các dòng spec sửa khi làm nháp và khi review; các quyết định Claude tự chốt và các mục để lại; merge PR này không phát hành gì (không có changeset).

### Đã thực thi (2026-11-10)

- Năm commit của nhánh nháp được cherry-pick lên `feat/phase-5-plan-a` (`43dd7d8`, `455be77`, `ec85443`, `8fe3ab8`, `e94aa76`). Cây giống hệt đầu nhánh nháp (`e27bd07`), cộng file plan.
- Mỗi task có một reviewer riêng (năm reviewer chạy song song, chỉ đọc). Cả năm: Approved, chỉ có mục Minor.
- Review toàn nhánh trên Opus, dùng góp ý của chủ dự án ở PR #27, #28, #29 và #34 làm lăng kính: "With fixes" (4 Important, 10 Minor), các mục Important được kiểm bằng trang thử ở Chromium, Firefox và WebKit. Sửa trong một đợt, mỗi mục một commit (`f5a6425`..`2cb70b4`):
  - **Khung không có sidebar mất brand ở màn rộng** (S1), và ô brand của S2 giữ 226px dù không có trigger: ba quy tắc chỉ áp khi có sidebar (`f5a6425`, story `BrandWithoutSidebar…`).
  - **Phần tử có `z-index` riêng trong main vẽ đè lên header dính, lớp nền và tấm trượt:** main và footer có `isolation: isolate` (`0a1e270`, story `MainStaysUnderTheFrame`; kính trong main vẫn mờ nền: kiểm điểm ảnh ở Chromium, kiểm style tính được ở Firefox và WebKit).
  - **Focus chỉ về trigger khi tấm đóng qua `setOpen`:** nay focus về trigger sau mọi lần đóng, ai đóng cũng vậy, trừ `returnFocus: false` và lần đóng do cửa sổ rộng ra; logic của tấm chuyển vào `use-sheet.ts`, context có một giá trị `modal` (`5dd3af8`).
  - **Nút × có focus khi cửa sổ rộng ra thì focus rơi về `<body>`:** lần đóng đó đưa focus về trigger nếu focus không còn ở đâu, còn lại để yên (`5dd3af8`, bốn story focus ở ba engine).
  - Minor sửa luôn: hydrate trên màn rộng với tấm đang mở không còn bị coi là đổi cỡ màn (`b74b81f`); `{...props}` trước các thuộc tính trạng thái của gốc (`70164d3`); Esc đóng tấm cả khi có popover `manual` đang mở (`54fddd9`, story `EscWithPopoversInTheSheet`); chỉ link trơn trong footer đổi màu (`f6b8f8b`); harness visual chờ render xong với story có tag `viewport-…` (`c550e2d`); khung trong docs theo theme của docs và không kéo focus khỏi trang (`0b0104a`, story `SidebarPhoneOpenForDocs` nằm trong `<div inert>`); câu chữ của `AppShell.mdx` và trang Accessibility (header cao hơn hàng của nó, focus khi đóng, các thuộc tính của phần tử bao làm hỏng `position: fixed` và dính) (`46301c9`); ngưỡng kích thước JS 54522 B, CSS 15472 B (`2cb70b4`).
  - Các dòng spec sửa, đánh dấu "(phát hiện khi review cuối Plan A)": §3.3, §3.4 (lớp và chồng lớp; focus khi đóng; đổi cỡ màn), §3.5, §4.3, §5, §6.3. Một câu của dòng "Đóng" ở §3.4 được Claude chỉnh sau lần review lại (`8d25a11`).
  - Lần review lại: cả 11 mục đã xử lý, không có lỗi mới.
- **Quyết định Claude tự chốt khi thực thi** (chủ dự án có thể đảo lại):
  - `NavItem` của Plan B đóng tấm bằng `setOpen(false)`, nên focus về trigger.
  - Lần đóng do cửa sổ rộng ra đưa focus về trigger khi focus không còn ở đâu (kể cả người dùng chuột đang để focus ở `<body>`).
  - Story chỉ cho docs `SidebarPhoneOpenForDocs` là một hình không tương tác được (`<div inert>`), vì tấm mở sẵn vẫn kéo focus vào khung ở Chromium.
- **Để lại** (ghi trong mô tả PR), ngoài các mục ở phần phát hiện: cha controlled từ chối một lần đóng `returnFocus: false` rồi tự đóng thì focus không về (Plan A chưa có ai gọi lựa chọn đó); đổi `breakpoint` lúc tấm đang mở; chưa có test StrictMode cho tấm; `.storybook/story-frame.tsx` dùng đường dẫn nội bộ `storybook/internal/core-events`; kính trong main ở Safari thật, VoiceOver và NVDA chưa thử.
- Kiểm tra trên `2cb70b4` (người sửa chạy): lint, typecheck, format, unit + unit-react18 698 (3 skip, thư mục đã đổi), scripts 83, story app-shell 135 + 135 và docs 30 ở ba engine, `check:contrast`, build, `check:package`, build Storybook, `check:docs-tables`.
