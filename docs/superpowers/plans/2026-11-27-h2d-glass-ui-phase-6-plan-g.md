# h2d-glass-ui: Plan G, đóng băng API, xuất CSV, công thức lưu trạng thái và `DataGrid` công khai trong `0.5.0` (giai đoạn 6, phần 7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm Plan G, plan cuối của giai đoạn 6: đưa `DataGrid` ra công khai và chuẩn bị `0.5.0`. Trước hết một commit chỉ sửa story của Tooltip đã fail trên `main` ở CI (Task 0). Rồi đóng băng API: chữ của các control mà grid vẽ đi qua bản ghi nhãn `labels.controls`, một khoá `cancel` cho mọi nút Cancel, `DataGridSummaryProp` đổi tên `DataGridSummary`, JSDoc nói hàm nào của app gặp được dòng mới, và mọi chữ cũ được viết lại (Task 1); xuất CSV: `exportCsv()` của handle, prop `csvExport`, trường cột `exportable`, nút xuất của G1 trong thanh công cụ (Task 2); công thức lưu trạng thái trong `DataGrid.mdx`, chạy bằng test và một story (Task 3); `DataGrid`, `dataGridColumn` và 39 kiểu được export từ `src/index.ts`, thẻ `unreleased` và entry thứ hai của tsdown bỏ đi, một ca `rsc` mới, ngưỡng kích thước ghi lần đầu (Task 4); trang "Examples/Data grid" với đơn hàng của Lumen (Task 5); mục "Data grid" của Getting started và "The data grid" của Accessibility (Task 6); một trang grid trong mỗi fixture cùng kiểm tra tree-shaking (Task 7); changeset `minor` cho `0.5.0`, ngưỡng kích thước ghi lần cuối, README và lượt rà cuối (Task 8).

**Architecture:**
- **Đóng băng API** (Task 1; spec §6.1, §6.3): mọi tên công khai sau Task 1 là tên của `0.5.0`; tên mới chỉ đến từ CSV của Task 2. Bản ghi nhãn `controls` (mười khoá, trong `LABEL_RECORDS`, ghép một cấp) được `controlLabelsOf(controls)` (`labels.ts`) chuyển thành `ControlLabels { date, number, combobox, search }`, đúng hình `labels` của từng control; `DataGrid.tsx` làm nó một lần cho mỗi `labels` (`useMemo`) và đưa vào `GridContextValue.controlLabels`, từ đó tới DatePicker của trình sửa (`parts/editors/CellEditor.tsx`), của ô lọc (`FilterCell.tsx`) và của hai đầu khoảng (`BetweenEditor.tsx`), NumberInput và Combobox của trình sửa, SearchField của thanh công cụ (`SearchBox.tsx`, qua `toolbarContent`) và của lọc ở header (`HeaderFilter.tsx`). Mặc định của mỗi khoá là mặc định của chính control, nên không gì đổi cho tới khi app đưa chữ.
- **CSV** (Task 2; §6.3 "Xuất CSV"): engine thuần `engine/csv.ts` (`csvField`, `toCsv`, `csvColumns`, `CsvColumn`, `CsvOptions`), `rawText` của `engine/values.ts` (cùng `isoDayOf` riêng mà `toFilterKey`, `formatValue` và `rawText` dùng chung), `PipelineResult.savedRows` của `engine/pipeline.ts` (dòng đã lưu sau tìm kiếm và lọc, theo thứ tự đang hiện, mọi trang); hook `hooks/use-csv-export.ts` (`useCsvExport`, `sameCsvExport`, `CsvSource`) đọc lần commit cuối qua một ref ghi lúc commit (`useWriteOnCommit`); `csvOptionsOf` của `normalize.ts`; phần `parts/ExportButton.tsx`; helper chung `src/internal/download.ts` (`downloadText`, không directive) và `DownloadIcon` của `src/internal/icons.tsx`. Nút gọi chính `exportCsv({ download: true })`: một hàm, hai đường.
- **Công khai** (Task 4; §2, §3.1, §6.2): `src/index.ts` export `DataGrid`, `dataGridColumn` và 39 kiểu; `tsdown.config.ts` chỉ còn entry `src/index.ts`, và `dist/components/data-grid/DataGrid.js` vẫn được build không gộp (đường dẫn của mục "JS (DataGrid)"). `src/components/data-grid/DataGrid.tsx` vẫn là module client duy nhất của grid: 1241 dòng ở `8fb9ff8`, 1275 cuối plan. `hooks/use-editing.ts` giữ 1702 dòng (không tách ở G, OQ 16).
- **Trang Examples** (Task 5; §8): code trong `src/docs/data-grid-example/` (`OrdersGrid.tsx` `'use client'`, `columns.tsx`, `orders.ts`), import từ `'../../index'` và hiện trên trang là `'h2d-glass-ui'` (như ví dụ App shell). Bố cục (rộng hay điện thoại) chọn bằng một media query `(max-width: 639px)` đọc qua `useSyncExternalStore` (ảnh chụp của server: rộng), không đọc DOM trong render; grid mang key là lớp bố cục, nên qua 640px thì grid của bố cục kia được mount; trạng thái lưu có khoá riêng cho mỗi lớp (`lumen-orders-grid-v1-wide`, `-phone`).
- **Trạng thái sửa không phải trạng thái** (§6.3): thay đổi chưa lưu, dòng hay ô đang sửa, lần lưu đang chờ và lỗi của nó không bao giờ nằm trong `DataGridState`, `getState()`, `onStateChange`, công thức lưu trạng thái hay một CSV. CSV ghi giá trị đã lưu của mọi dòng, bất kể dòng đó đang chờ gì.
- **Fixtures** (Task 7; §7 "Fixtures"): Next.js có route `/grid` (Server Component đưa dữ liệu thuần cho một Client Component), Vite có entry thứ ba `grid.html`; `scripts/test-fixtures.mjs` thêm `checkGridHtml` (chỉ Next.js), `checkGrid`, `checkTreeShaking` (chỉ server production) và `waitUntil`.

**Tech Stack:** Như Plan F: React 19.3 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63, `@floating-ui/dom` 1.8.0, `size-limit` 14.1, `@changesets/cli`. Plan này không thêm dependency. CSV dùng `Blob`, `URL.createObjectURL`, `URL.revokeObjectURL` và một `<a download>` tạm; ví dụ dùng `useSyncExternalStore` và `window.matchMedia`; grid dùng lại `IconButton`, `TooltipRoot`, `DatePicker`, `NumberInput`, `Combobox`, `SearchField`, `useWriteOnCommit`, `useKept`, `devWarn`, `withDefaults`; ví dụ dùng thêm `Card`, `SegmentedControl`, `Table`. Fixture Next.js và Vite có sẵn từ các giai đoạn trước.

**Spec:** `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`. Plan này làm các phần sau (cùng các dòng sửa khi lập Plan G, phát hiện 21):
- §2 dòng G (Task 1–8); đoạn "`DataGrid` chỉ được export ở plan G" và dòng tsdown của "Thay đổi ở code cũ" (Task 4); "Thay đổi ở code cũ", gạch Plan G (`src/index.ts`, `src/index.test.ts`: Task 4).
- §3.1 (grid là client component, Server Component đưa dữ liệu thuần: Task 4, ca `rsc`; Task 7, fixture Next.js). §3.5 bảng file, dòng `csv.ts` (Task 2). §3.9 (HTML của server là trạng thái mặc định: Task 3, 5, 7). §3.11 (`download.ts`, `csv.ts`: Task 2; `src/docs/data-grid-example/`: Task 5).
- §4.1, §4.3 G1 "Chọn cột, xuất CSV" (nút xuất `mk-o1`: Task 2); §4.6 `DownloadIcon` (Task 2). Trang Examples không có mockup: theo lựa chọn của chủ dự án, dựng từ các phần đã duyệt (Task 5).
- §5: cảnh báo dev của `csvExport` và `exportCsv` (Task 2), của trạng thái sai dạng (Task 3, như đã có).
- §6.3 `DataGrid`: khối interface (`summary?: DataGridSummary<TRow>`, `labels?: DataGridLabelsInput`, `getState()` đủ tám phần), bảng nhãn (`cancel` chung, bản ghi `controls`: Task 1); prop `csvExport`, trường cột `exportable`, handle `exportCsv`, mục `exportButton`, nhãn `exportCsv`, "Xuất CSV" (Task 2); "Lưu trạng thái" (Task 3). §6.2 (Task 4).
- §7: lớp 1 (engine CSV, `downloadText`, công thức lưu trạng thái), "Gói phát hành" (`check:rsc`), "`src/index.test.ts` (G)" (Task 4), "Fixtures" (Task 7), danh sách story Plan G (Task 5, 8).
- §8: `DataGrid.mdx` (CSV, "Saving the state", phần mở đầu), trang "Examples/Data grid" (Task 5), Getting started, Accessibility (Task 6), Theming (đọc, không đổi: Task 6), `size-limit` (Task 4, 8), "Phát hành" (Task 8).
- §9: mục 1 (lớp 6 "chưa kiểm tra" từng mục), mục 3 (fixture), mục 5, mục 6 (Task 8). §10: dòng `unreleased` (Task 4).
- §4.9 của spec 0+1 (`docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`): nhãn dòng 2 thêm nút xuất CSV (Task 2).

Chủ dự án chọn mockup ngày 2026-11-13 ("như đề xuất": K1 D2 G1 C1 F1 R1 E2 EF1), duyệt spec cùng ngày ("ok") và nói "cứ làm đi" cho cả giai đoạn 6. Ngày 2026-11-27, sau khi PR #46 (Plan F) merge thành `8fb9ff8` và Plan F được dọn, chủ dự án nói "làm luôn" cho Plan G. Cùng ngày chủ dự án chọn mọi đề xuất trên trang quyết định Claude dựng (https://claude.ai/artifact/LppDmg1QbSacUdJKjCST3U; ảnh chụp từ một story tạm `src/docs/P6gOptions.stories.tsx` của bản nháp, không bao giờ commit): OQ 1 (b) + (p2), OQ 2 (b) `controls`, OQ 3 đổi tên, OQ 4 (a), OQ 17 (a) (phát hiện 2). `main` và nhánh `feat/phase-6-plan-g` cùng ở `8fb9ff8`.

**Đã chạy thử khi lập kế hoạch:**
- Toàn bộ code dưới đây đã chạy trên nhánh nháp `draft/phase-6-plan-g` (worktree `D:/Repositories/h2d-p6g-tasks`), mỗi task một commit: chín commit trên `8fb9ff8`: `d2d7199` (Task 0), `99c384f` (Task 1), `b57b64f` (Task 2), `7a26db7` (Task 3), `a58060f` (Task 4), `18e7b97` (Task 5), `44da4a4` (Task 6), `148fc79` (Task 7), `dedef6e` (Task 8).
- Sau mỗi task Claude xem nó và chốt những gì phải sửa; ba fixup G1F1–G1F3 và một fixup của chính Claude là commit `fixup!` của Task 5 (phát hiện 4). Commit Tooltip (Task 0) của Claude đứng sau Task 1 ở bản nháp. Sau Task 8, Claude dựng lại nhánh bằng rebase trên `8fb9ff8`: commit Tooltip lên đầu (nó không đụng gì của Task 1–8), bốn fixup gộp vào Task 5 bằng autosquash: mười ba commit thành chín. Các hash trước khi gộp ở nhánh `draft/phase-6-plan-g-before-fixups` (đầu `835e140`): `49f20d9` (Task 1), `4b06347` (Task 0), `ff1ad97` (Task 2), `7fcb7d8` (Task 3), `7ecbb61` (Task 4), `4f7cdd5` + `3794dea` + `8152790` + `d74e8da` + `4354d8d` (Task 5, G1F1, G1F2, G1F3, fixup thứ tư của Claude), `1ccd11d` (Task 6), `19ffdb6` (Task 7), `835e140` (Task 8). Cây sau khi gộp (`dedef6e`) giống cây của nhánh trước khi gộp.
- Mỗi test viết trước đã được chạy trên commit cha của nó và được thấy fail, nếu fail được: với module mới, một stub rỗng đúng chữ ký; với test của grid, file test chạy trên cây cha. Test viết sau code và test đặc tả của từng task ở phát hiện 20 và Step 2 của task đó.
- Task 1–8 và các fixup G1F1–G1F3 do subagent Claude Sonnet viết, lần lượt từng task; Claude (Opus) viết Task 0 và fixup thứ tư của Task 5 (`4354d8d`). Plan G không dùng opencode. Claude (Opus) kiểm tra từng task: đọc diff (Task 1: đường đi của nhãn, mặc định bằng mặc định của control, từng câu JSDoc đối chiếu code; Task 8: changeset, README và `package.json`); chạy lại `check-p6g.sh` (`check-p6f.sh` của Plan F trỏ vào `D:/Repositories/h2d-p6g-tasks`: gen:theme, lint, typecheck, format, `tsc -p .`, `check:name`, `check:contrast`, build, `check:package`, size, ba project unit mỗi project một lượt, build Storybook, `check:docs-tables`) sau Task 1, 2, 5 (trên `4354d8d`) và 8 (bản ghi `task-N-claude-check.txt`); chạy lại 11 ca của `saved-state.test.tsx` ở hai bản React (Task 3); đo sidebar của bản Storybook đã build (Task 4, OQ 18); thử lại hai khoảng chờ của thông báo (Task 6: loading 1000 ms, rows found 500 ms).
- Claude chụp từ bản Storybook vừa build: Task 2 `G1` ở sáng, tối và forced colours (nút xuất sau nút chọn cột, 34×34, cách 8px, icon của mockup, màu hệ thống ở forced colours); Task 5 `DataGridExample` (1280×720, sáng) và `DataGridExamplePhone` (390×844, tối), dẫn tới G1F1–G1F3; sau G1F1, `GroupPanelEmpty` so A/B (phát hiện 4). Người viết Task 5 đo cả hai story giao diện của trang (phát hiện 11).
- Mọi khối patch trong plan được lấy thẳng từ chín commit đó (`patches/make-patches.sh` của bản nháp tách mỗi commit thành patch test và patch code; `.size-limit.json` không nằm trong patch nào; Task 0 chỉ có patch test, Task 6, 7, 8 chỉ có patch code).

Kết quả đo ngày 2026-11-27, do Claude chạy trên `835e140` (`check-p6g.sh`; 15 bước, mọi bước rc 0; bản ghi `check-output.txt`), cây giống đầu nhánh nháp `dedef6e`:

| Lệnh | Kết quả |
|---|---|
| `pnpm gen:theme`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `npx tsc --noEmit -p .`, `pnpm check:name` | PASS |
| `pnpm check:contrast` | PASS (`Contrast check passed.`). Không cặp mới; nhãn dòng 2 thêm nút xuất (Task 2) |
| `pnpm build` | PASS |
| `pnpm check:package`, `pnpm size` | PASS với ngưỡng của Task 8: JS (all exports) 119.61 kB trên 131571 B, JS (DataGrid) 98.18 kB trên 107996 B, CSS 20.98 kB trên 23079 B (ngưỡng ở `8fb9ff8`: 63820 B, 105887 B, 23054 B; phát hiện 17) |
| `vitest run --project unit`, `--project unit-react18`, `--project scripts` (mỗi project một lượt, `--maxWorkers=3`) | PASS. `unit` 238 file, 5891 (1 skipped); `unit-react18` 122 file, 4356 (4 skipped); `scripts` 7 file, 261 (ở `8fb9ff8`: 5744, 4259, 261) |
| `pnpm build-storybook`, `pnpm check:docs-tables` | PASS (`no table built as text in 228 files`). Index đã build có 196 story có ảnh (194 ở `8fb9ff8`: thêm `DataGridExample`, `DataGridExamplePhone`), 146 mục DataGrid, không mục nào mang `unreleased` |
| `pnpm changeset status` | Một changeset `minor` của `h2d-glass-ui` (Task 8) |
| Story | Người viết mỗi task chạy story của các thư mục task đó đụng tới ở sáng và tối, ba engine, sáu lượt: data-grid 138 (Task 1), 139 (Task 2), 140 (Task 3, 4), 141 (sau G1F1); docs 26 (Task 2), 32 (Task 5 và các fixup); Claude chạy tooltip 14 (Task 0) và, trên `4354d8d`, `DataGridGrouping` 27 / 27 và docs 32 / 32 ở sáu lượt. Task 6 chạy docs ở Chromium sáng (chỉ MDX đổi); Task 8 chạy data-grid (141) và docs (32) ở Chromium sáng làm lượt cuối. Cả bộ story trên máy Linux ARM (`oracle-arm`) trong image của CI, mỗi lượt một trình duyệt (`mcr.microsoft.com/playwright:v1.63.0-noble`, 3 CPU, 8 GB; đỉnh `dedef6e`; `storybook-light` và `storybook-dark`): Chromium 116 file 1294 PASS, Firefox 116 file 1294 PASS, WebKit 116 file 1294 PASS; không fail, không chạy lại. |
| Fixtures | `Fixtures OK: vite, next.` qua bản sao đổi cổng (5179 / 4179; Next.js 3100 / 3101) ở Task 4, Task 7 (57 giây: vite 27, next 33) và Task 8 |
| Visual | Chưa chạy. 16 ảnh chuẩn mới và 8 ảnh của `G1` đổi một lần đến từ CI |

Các phát hiện từ lần chạy thử đã được đưa vào plan:

1. **Chín commit nháp là chín task của plan, Task 0 tới Task 8** (cách chia của `split.md`, cộng Task 0 của Claude).
   - Task 0: story `WhileANonModalOverlayHasFocus` của Tooltip (chỉ story; phát hiện 3).
   - Task 1: đóng băng API (FZ1–FZ6; phát hiện 6). Task 2: xuất CSV và nút xuất; `G1` vẽ nút (phát hiện 7). Task 3: công thức lưu trạng thái (phát hiện 9). Task 4: `DataGrid` ra gốc gói, `unreleased` và entry thứ hai của tsdown bỏ đi, ca `rsc`, ngưỡng kích thước lần đầu (phát hiện 10). Task 5: trang "Examples/Data grid" cùng G1F1–G1F3 và fixup thứ tư (phát hiện 4, 11). Task 6: Getting started "Data grid", Accessibility "The data grid" (phát hiện 12). Task 7: trang grid của fixture và kiểm tra tree-shaking (phát hiện 13). Task 8: changeset `0.5.0`, ngưỡng kích thước lần cuối, README và lượt rà cuối (phát hiện 14).
   - Thứ tự: `0.5.0` đóng băng mọi tên công khai, và Task 2–8 viết docs, ví dụ và fixture theo các tên đó, nên đổi tên sau chúng là đổi ở bốn chỗ: Task 1 đi đầu, không đổi hành vi nào ngoài chữ của các control (mặc định giữ nguyên, không pixel nào dời). CSV (2) thêm tên công khai trước khi Task 4 export danh sách đủ một lần. Công thức (3) là docs và test trên prop đã có, vào khi trang còn ẩn, nên trang công khai xuất hiện đủ. Export (4) đứng trước mọi thứ import từ gốc gói: ví dụ (5) import từ `'../../index'`, fixture (7) import từ gốc tarball; Task 4 cũng ghi ngưỡng một lần, vì "JS (all exports)" nhận cả grid và sẽ làm mọi `check:package` sau fail (OQ 13). Ví dụ (5) sau lựa chọn của chủ dự án; Getting started và Accessibility (6) sau ví dụ để liên kết tới một trang có thật; fixture (7) sau API công khai; changeset và ngưỡng (8) cuối cùng, để nói đúng những gì merge và để lần ghi thấy mọi byte.
   - Task 0 không có trong `split.md`: Claude làm nó trong lúc lập bản nháp, sau khi story fail trên `main` ở CI; ở bản nháp nó đứng sau Task 1 và được dời lên đầu khi gộp vì nó không đụng gì của Task 1–8.
2. **Lựa chọn của chủ dự án và phán quyết của Claude cho mười tám câu hỏi mở** (cuối `common.md`, 2026-11-27; câu hỏi và phương án ở cuối `split.md`):
   1. **OQ 1 (chủ dự án) = (b) + (p2).** Màn hình rộng (b) "mặc định yên": khung và thứ tự thanh công cụ của G1, thanh nhóm trống với gợi ý, hàng lọc, tổng cuối bảng, sắp theo ngày (mới nhất trước), hai dòng đã chọn, không nhóm, không chi tiết mở, Order ghim trái; Channel ẩn trong bộ chọn cột vì tám cột không vừa 1280px mà không cuộn ngang (đo trên bản nháp; Order, Qty và Total không có phễu, như G1). Điện thoại (p2) thay (p1) của người viết `split.md`: bố cục riêng qua `defaultColumnLayout`, hiện Order, Customer, Status, Total, các cột khác trong bộ chọn, **không ghim gì** (Claude đo: vùng ghim của (p1) là 192px của khung 303px, chỉ còn 111px để cuộn). Ví dụ chọn bố cục không đọc DOM trong render: media query qua `useSyncExternalStore` (ảnh chụp của server: rộng), grid mang key là lớp bố cục, khoá lưu trạng thái riêng cho mỗi lớp. Thanh phân trang xuống ba hàng ở 390px (như grid đã làm; PR nêu).
   2. **OQ 2 (chủ dự án) = (b):** một bản ghi nhãn `controls` (mười khoá của FZ2), trong `LABEL_RECORDS`.
   3. **OQ 3 (chủ dự án):** `DataGridSummaryProp` → `DataGridSummary` (không kiểu nào khác của thư viện có hậu tố `Prop`; đổi miễn phí bây giờ, phá vỡ sau `0.5.0`).
   4. **OQ 4 (chủ dự án) = (a):** một khoá `cancel` cho mọi nút Cancel của grid; `cancelButton` bỏ. Các cặp khác (`ok` / `applyFilter`, `saveButton` / `save(name)` / `saveChanges`) gọi tên những thứ khác nhau và ở lại.
   5. **OQ 5 (a):** `DataGridCellContext.row` giữ `TRow`; mọi hàm của app gặp được dòng mới nói vậy, và mỗi lần ném lỗi trên dòng mới được bắt và cảnh báo một lần (FZ4). `isNew` là việc về sau.
   6. **OQ 6 (a):** `DataGridColumnBase` không được export; test kiểu export gọi tên nó là ngoại lệ duy nhất.
   7. **OQ 7 (a):** cột đang được nhóm theo được xuất ở chỗ của nó trong bố cục, như thể đang hiện.
   8. **OQ 8 (a):** `selectedOnly` xuất các dòng đã chọn trong số dòng còn lại sau tìm kiếm và lọc; docs nói vậy.
   9. **OQ 9 (a):** tuỳ chọn của handle đặt lên trên tuỳ chọn của `csvExport`.
   10. **OQ 10 (a):** CRLF kết thúc mọi bản ghi, kể cả bản ghi cuối.
   11. **OQ 11 (a):** CSV là các dòng grid đang hiện (dòng giữ chỗ vì thay đổi chưa lưu, dòng chờ xoá, như đang vẽ), với giá trị đã lưu.
   12. **OQ 12 (a):** `G1` bật `csvExport`; 8 ảnh của nó đổi một lần (`git rm` trước, rồi `visual-update.yml`); PR liệt kê chúng. `GridGroups` và `EditBatch` giữ nguyên.
   13. **OQ 13 (a):** Task 4 chạy `pnpm size:record`; Task 8 ghi lại lần nữa.
   14. **OQ 14:** dấu của tree-shaking là `flg-data-grid-frame`, tìm trong các tệp `.js` mà trang production tải, được chứng minh có mặt trên trang grid trước khi tin là vắng trên trang chính; dòng spec sửa. Next.js: đo ở Task 7, và chỉ khi các chunk của `/` mang grid thì thêm `optimizePackageImports` (đo được: không cần, phát hiện 13).
   15. **OQ 15 (a):** fixture dùng `vi-VN`, VND và ngày tháng.
   16. **OQ 16 (a):** không tách `use-editing.ts` ở G (việc sau `0.5.0`).
   17. **OQ 17 (chủ dự án) = (a):** Task 8 sửa số đếm và danh sách component trong README và `description` của `package.json`.
   18. **OQ 18:** đo sau Task 4; nếu sidebar hỏng thì đổi tiêu đề `DataGrid.stories.tsx` thành `Components/DataGrid/Overview`. Claude đo trên bản tĩnh: sidebar vẽ "DataGrid" là một nhóm chứa Docs, các story của nó và Columns, Editing, Filtering, Grouping; trang docs nạp được, console không cảnh báo: giữ nguyên, không đổi tiêu đề.
   - **Lớp bảo vệ của CSV** (`split.md` "An app callback that throws"): chấp nhận. CSV đọc qua `textOf` của grid, lớp bảo vệ duy nhất mà lúc vẽ dùng; lần ném lỗi trên dòng đã lưu đi tiếp, như khi ô vẽ; docs của `exportCsv` nói một `format` hay `value` ném lỗi thì ném từ nó. Không có lớp bảo vệ thứ hai.
   - Mọi "(proposed)" khác của `split.md` và `briefs.md`: chấp nhận như đã viết (phát hiện 5).
3. **Task 0: story Tooltip `WhileANonModalOverlayHasFocus`** (của Claude, chỉ story):
   - CI của `main` trên `8fb9ff8` (run 45865670552) fail ở story này, `storybook-dark` WebKit, "expected true to be false": tooltip còn mở sau Esc, dù có các lần chờ 3 giây của `dc4cf44` (nên không phải chậm). Đó là lần fail thứ hai của story có sẵn này trong 4 lượt CI (lượt 1 của PR #46 cũng vậy); chạy lại job thì xanh: story lỗi chập chờn, 2 trong 5 lượt CI.
   - Không tái hiện được: WebKit trên Windows (story một mình 6 lần, cả file 4 lần, đều pass); WebKit x86 trên `oracle-vps`, Playwright đi đúng các bước của story trên bản Storybook tĩnh: 12 / 12 pass, Esc đóng tooltip mỗi lần. Log của CI chỉ có cây DOM.
   - Giả thuyết còn lại: phím Esc tới một frame khác. Story đặt focus bằng script (`el.focus()` trên "Save note" rồi "Pin"), và lệnh phím của vitest chỉ gọi `window.focus()` khi `activeElement` là `body`; nếu frame của test mất focus của frame, phím được nhấn ở chỗ khác.
   - Sửa: hàm `escapeFrom(name)` gọi `window.focus()`, focus nút được gọi tên, rồi nhấn `{Escape}`; một listener `keydown` (capture) đếm các lần Esc trang thấy; lời fail của hai lần chờ nói số lần Esc đã thấy, `document.hasFocus()` và chữ của phần tử đang có focus; `panel.showPopover()` vào trong `try`, `finally` gỡ listener và chỉ ẩn panel khi nó đang mở. Lần fail sau (nếu có) phân biệt được hai nguyên nhân.
   - Tooltip 14 / 14 ở sáng và tối × Chromium, Firefox, WebKit. Không code thư viện, không ảnh chuẩn (story `no-visual`), không id story nào đổi.
4. **Các fixup sau Task 5** (cuối `common.md`; mỗi fixup một commit `fixup!` của Task 5, nay gộp vào Task 5):
   - **G1F1, thanh nhóm trống ở bề rộng hẹp:** ở 390px với lề 32px của ví dụ, gợi ý "Drag a column header here to group by that column" không vừa một hàng, và thanh (`flex-wrap: wrap`) đẩy icon lên một hàng riêng trên hai hàng chữ. Thanh trống giữ icon ở đầu hàng đầu và gói chữ bên cạnh. Test trước: story `no-visual` `GroupPanelHintWraps` (`DataGridGrouping.stories.tsx`, grid rộng 240px vì ở 300px câu còn vừa một hàng 272px): icon kết thúc trước khi chữ bắt đầu trên cùng hàng, gợi ý chiếm hai hàng trở lên, không gì vượt viền thanh; fail trên `4f7cdd5` ("the icon is before the text: expected 510 to be less than or equal to 495"). Story không gọi `noTitleIsCut` (grid 240px cắt tiêu đề cột, không liên quan). `flg-data-grid-group-hint` vào `scripts/check-dist-css.ts`.
   - **Fixup thứ tư của Claude (`4354d8d`) thay quy tắc của G1F1:** quy tắc của người viết (`align-items: flex-start`, `padding: 7px 14px`, dòng 18px, `margin-block` của icon) đặt gợi ý của `GroupPanelEmpty` cao hơn 1px khi Claude so A/B trên bản build (8 ảnh sẽ dời). Thanh trống giữ `align-items: center` với padding khối đối xứng 4px (`padding: 4px 14px`), cộng `flex-wrap: nowrap` và `.flg-data-grid-group-hint { min-width: 0 }`: so A/B với quy tắc trước G1F1, 0 pixel khác (Chromium, sáng); ở 240px gợi ý xuống hai hàng cạnh icon, icon ở giữa. Thanh một hàng vẫn cao 34px (play của `GroupPanelEmpty` khẳng định 34px và padding 14px, vẫn pass). Thanh có chip không đổi.
   - Story giao diện vẽ thanh trống: `GroupPanelEmpty` (thẻ 1332px trong cửa sổ 1440), `DataGridExample` (thẻ 1216px) và `DataGridExamplePhone` (thanh khoảng 318px): cả ba một hàng; `GroupPanelDropTarget` và `GridGroups` có chip.
   - **G1F2, lề của ví dụ trên điện thoại:** chủ dự án chọn (p2) từ một ảnh có lề 16px. 32px là padding của stage Storybook (`.storybook/stage.css`), không phải của `OrdersGrid`, và một quy tắc stage chung sẽ dời các story 390px khác, nên decorator của chính trang (meta của `DataGridExample.stories.tsx`) thêm `@media (max-width: 639px) { .flg-stage { padding: 16px } }`. Đo lại (390×844, sáng, Chromium): thẻ x 16..374 (rộng 358), y 135..773; khung `clientWidth` 318, `scrollWidth` 742 (cuộn 424px); thanh công cụ 166,8px, bốn hàng (caption, thanh nhóm, tìm kiếm + chọn cột + xuất, thêm); thanh phân trang 60px, ba hàng; khung cao 345px. Play khẳng định mép trái thẻ 16, mép phải bằng mép stage trừ 16, đáy thẻ ≤ đáy stage trừ 16, khung hẹp hơn thẻ. Người viết lưu ý: ở chế độ Docs của trang, quy tắc này áp cho cả trang khi cửa sổ dưới 640px (chỉ stage của các story trên trang đó).
   - **G1F3, grid trong một track của CSS grid hay flex:** Task 5 thấy một DataGrid trong track `auto` nới track ra bằng bảng (782px trong cửa sổ 390px), và wrapper của ví dụ cần `gridTemplateColumns: 'minmax(0, 1fr)'`. `DataGrid.mdx` thêm một dòng "Do and don't" với mẫu ba dòng (`minmax(0, 1fr)` hay `min-width: 0`).
5. **Các phán quyết "đề xuất" của `briefs.md` và các điểm Claude chấp nhận trong `progress.md`** (Claude xác nhận tất cả):
   - Mọi task: sau Task 1 mọi tên công khai là tên cuối, task sau thấy tên muốn đổi thì dừng và báo (không task nào báo); mọi khoá nhãn có mặc định tiếng Anh, ghép bằng `withDefaults`, bản ghi ghép một cấp và danh sách bản ghi là hằng `LABEL_RECORDS`; prop object G thêm (`csvExport`) giữ theo giá trị (`useKept` với `sameCsvExport`, so từng thành viên), nên một object viết trong JSX không vẽ dòng nào (`DataGrid.renders.test.tsx`); giá trị ngoài kiểu là mặc định với một `devWarn` mỗi prop, lời không chứa giá trị.
   - **FZ1 (chữ cũ):** `DataGridState` nói đủ tám phần; `DataGridLabels` bỏ "and later the names of its controls"; `DataGridToolbarItems` bỏ "only the ones of this version"; chú thích trên `DataGridProps` nói không có `onChange` vì grid không có một giá trị duy nhất; JSDoc của `toolbar` kể `addButton` (Task 2 thêm `exportButton`); `getState()` nói tám phần; "a later plan" của `engine/column-menu.ts`, "those of later plans" của `engine/columns.ts` và `engine/layout.ts` (nay gọi tên năm cột phục vụ). JSDoc thêm mặc định còn thiếu: `captionAs` (`'h3'`), `variant` (`'lined'`), `density` (`'standard'`), `loading` (`false`), `align` (theo kiểu), `rowHeader` (`false`), `allowSorting` của cột (của grid). Không mặc định nào khác nhau giữa code, JSDoc, MDX và spec (bảng kiểm của `task-1-report.md`).
   - **FZ2 (chữ của các control, OQ 2 (b)):** phát hiện 6. **FZ3 (tên, OQ 3, 4):** `DataGridSummary`, một `cancel`. **FZ4 (dòng mới và `TRow`, OQ 5 (a)):** phát hiện 6. **FZ5 (kiểu export đủ, OQ 6 (a)):** `index.exports.test.ts` đọc `types.ts` và `index.ts` của grid như văn bản (không danh sách viết tay). **FZ6 (spec và docs khớp nhau):** khối interface của §6.3 nói `labels?: DataGridLabelsInput`, `summary?: DataGridSummary<TRow>`, `getState()` tám phần; bảng nhãn có `controls` và `cancel` chung; bảng Props, Labels, Handle của `DataGrid.mdx` kể mọi prop, khoá và thành viên với mặc định của nó.
   - **Ghi lại, không đổi** (mỗi thứ lớn thêm được sau `0.5.0` mà không phá vỡ): `DataGridEditorContext` (`saving`, `commit` theo chế độ, chốt ở đợt sửa của Plan F), `addRow(): void`, kết quả `void | Promise<void>` của `onSaving`, `onRowReorder(fromKey, toKey, position)`, `remote`, `captionAs`, `searchPanel.placeholder` bên cạnh `labels.searchPlaceholder`, `dataGridColumn<TRow>()` dạng curry, `DataGridHandle.element`, `DataGridLabelsInput` (lý do `labels` không phải `Partial<DataGridLabels>`), `DataGridColumnBase` không export.
   - CSV (Task 2): hình của `engine/csv.ts` như đề xuất (`toCsv(rows, columns, options)`, `CsvColumn { caption; text(row); guard }`, `csvField(text, separator, guard)`, hàng tiêu đề được chặn công thức), `rawText(value, dataType)`, `PipelineResult.savedRows`, nút theo `ColumnChooser.tsx` (`TooltipRoot describe={false}`, IconButton `secondary` `md`, `TooltipContent side="bottom" align="center" sideOffset={8}`), lời cảnh báo ("<DataGrid csvExport> separator must be ',', ';' or '\t': ',' is used.", cùng dạng cho `values`, `bom`, `selectedOnly`, `escapeFormulas`, `fileName`, và `exportCsv` thay `csvExport` cho một lời gọi, `download` nữa; "<DataGrid> exportCsv() in server mode writes only the rows of the current page; export the whole data on the server."), không thông báo nào sau một lần xuất (lần tải của trình duyệt là phản hồi), dòng của nhóm đang đóng được xuất, không cột nào thì chỉ có BOM, caption được bọc và chặn công thức, ca hiệu năng 10 000 × 9 với ngưỡng gấp ba trung vị, nhãn dòng 2 của tương phản.
   - CSV, các điểm Claude chấp nhận của người viết Task 2 (`progress.md`): **chỉ `download: true` hay `fileName` của chính lời gọi mới tải về** (và `download: false` tắt một `fileName`); `fileName` của `csvExport` được đặt dưới của lời gọi (nút đặt tên file theo nó) nhưng tự nó không bao giờ tải, vì nếu không mọi `exportCsv()` của một app có `fileName` sẽ tải file không ai hỏi. `csvExport` là `null`, `undefined` hay `false` thì tắt không lời; `true` thì bật với mặc định; giá trị khác (chuỗi, mảng) thì tắt với một cảnh báo. `selectedOnly` với `selectionMode="none"` chỉ có hàng tiêu đề, bất kể khoá đã đưa. BOM viết `String.fromCharCode(0xfeff)` trong nguồn (không ký tự vô hình nào); test và story đọc byte qua `TextDecoder('utf-8', { ignoreBOM: true })` vì `Blob.text()` bỏ BOM. Ngưỡng hiệu năng: mục tiêu 10 ms (formatted) và 30 ms (raw) nhân `SLACK` 3 như các mục tiêu khác của engine.
   - Công thức (Task 3): khối MDX là component của test chép nguyên văn (import từ `'h2d-glass-ui'` trong MDX, từ thư mục trong test); docs nêu năm phần được lưu và vì sao không lưu `selectedKeys`, `expandedRows`, `expandedGroups` (và cách thêm), khoá có hậu tố, trạng thái gặp cột đã đổi, trạng thái sai dạng, chế độ riêng tư, HTML của server là trạng thái mặc định, vì sao trạng thái sửa bị bỏ ra; story `SavedState` có nút "Reload" tăng một key React.
   - Công khai (Task 4): `src/index.ts` export 39 kiểu theo thứ tự chữ cái; `src/index.test.ts` đọc nguồn của hai entry; intro của `DataGrid.mdx` viết như của một component đã phát hành và liên kết tới "Examples/Data grid" ngay từ Task 4 (Task 5 làm nó trỏ đúng chỗ); ca `rsc` chỉ đưa cột `field` (hàm không qua được ranh giới).
   - Ví dụ (Task 5): file theo đề xuất (`OrdersGrid.tsx`, `columns.tsx`, `orders.ts`, `DataGridExample.stories.tsx`, `DataGridExample.mdx`); 40 đơn DH-1001…DH-1040 từ 1 tới 12/11/2026, mỗi đơn 1–3 dòng hàng, `qty` và `total` là tổng của các dòng; SegmentedControl "Edit mode" `sm` năm phân đoạn với một dòng chữ nói đổi chế độ bỏ thay đổi chưa lưu; `onSaving` áp thay đổi vào `useState` của ví dụ ngay (không độ trễ giả); điểm ngắt 639px là "điện thoại" của Dialog (`fullScreenOnPhone`, `DIALOG_WIDE_QUERY`), vì các điểm ngắt của AppShell (768 / 1024 / 1280) nói về sidebar; `usePhone` năm dòng của chính ví dụ vì hằng của Dialog là nội bộ và `useMediaQuery` không được export. Người viết đề xuất, Claude chấp nhận: trên điện thoại sắp theo Order giảm dần thay vì ngày (sắp theo cột ẩn không được áp, và số đơn tăng cùng ngày nên thứ tự như nhau); wrapper `minmax(0, 1fr)`.
   - Getting started và Accessibility (Task 6): mục "Data grid" sau "Show data" và "The data grid" trước "Other preferences"; người viết sửa brief theo code: `treegrid` chỉ khi có nhóm (chi tiết là một dòng của `grid`; §6.3 của spec đã nói vậy, "hay chi tiết" của brief là lỡ tay của người viết brief); "Selection" của vùng live chỉ là một khoảng, chọn hết và `mod+A` (một lần nhấn ô chọn không nói gì); phím viết bằng chữ thường như các mục khác của trang (prettier không giữ yên `<Kbd />` đứng đầu dòng trong một mục danh sách MDX); kiểm tra của trình đọc màn hình ghi "not checked yet".
   - Fixture (Task 7): `defaultSort` theo `id` tăng để HTML của server có `aria-sort`; `defaultGrouping={[{ field: 'status', direction: 'asc' }]}` (`DataGridGroupItem` bắt buộc `direction`; dạng của brief không qua typecheck); bộ chọn phía trang dùng `th` / `tr` (phần tử bảng mang role ngầm định); kiểm CSV đòi cả khách hàng vừa lưu có trong file (giá trị đã lưu).
   - Changeset (Task 8): bốn token mới kể từ `0.4.0`, không phải ba (`--flg-dialog-lift-shadow` dưới `movable`, ba token của grid dưới DataGrid); câu kích thước của README viết lại (47 / 13 kB đã cũ từ giai đoạn 4); 40 → 48 component (6 của giai đoạn 5, Kbd, DataGrid, đếm theo họ như danh sách của README); mở đầu của Getting started thêm một câu cho giai đoạn 6; ngưỡng CSS 23079 B.
6. **Đóng băng API** (Task 1; OQ 2–6; spec §6.1, §6.3 đã sửa):
   - **Bản ghi `controls`** (`DataGridLabels['controls']`; `DataGridLabelsInput['controls']` là `Partial<…>`): `chooseDate` "Choose date" (`openCalendar` và `dialog` của DatePicker), `invalidDate` "Invalid date", `unavailableDate` "This date is not available", `previousMonth` "Previous month", `nextMonth` "Next month", `increase` "Increase" (`increment` của NumberInput), `decrease` "Decrease" (`decrement`), `noResults` "No results", `results(count)` "1 result" / "${count} results" (Combobox), `clearSearch` "Clear search" (`clear` của SearchField). Mỗi mặc định chép giá trị mặc định của chính control (control giữ mặc định của nó). `LABEL_RECORDS` = `['operators', 'panelOperators', 'summary', 'validation', 'controls']`; `mergeLabels` và `sameLabels` đọc hằng đó nên không cần code mới.
   - **Đường đi của chữ** (nội bộ): `controlLabelsOf(controls)` → `ControlLabels { date: DatePickerLabels; number: { increment; decrement }; combobox: { noResults; results }; search: { clear } }`; `DataGrid.tsx` dựng nó trong một `useMemo` theo `labels` đã giữ, không bao giờ trong render của một ô; `GridContextValue.controlLabels` mang nó tới các phần; `SearchBox` nhận prop `labels`, `toolbarContent` nhận tuỳ chọn `controlLabels`. Không test số lần render nào đếm memo này (lo ngại 1 của `task-1-report.md`, chấp nhận: một `useMemo` trên nhãn đã giữ).
   - **Tên:** `DataGridSummaryProp<TRow>` → `DataGridSummary<TRow>` (`types.ts`, `index.ts` của grid, `engine/summary.ts`, `hooks/use-grid-summary.ts`, `hooks/use-renewal-warning.ts` (`useSummaryWarning`), `normalize.ts`, `DataGrid.summary.test.tsx`, mẫu của MDX); khoá `cancelButton` bỏ, `cancel` "Cancel" là nút Cancel của popover lọc, hộp hỏi trước khi xoá, form và popup (`ConfirmDelete`, `EditForm`, `EditPopup`).
   - **FZ4, hàm của app mà dòng mới gặp:** `value(row)` (qua `readOfRow`: ô, bộ nhớ chữ, tổng; ném lỗi thì bắt, cảnh báo một lần, ô trống), `format(value, row)` (chỉ khi giá trị không trống), `cell(ctx)`, `rowClassName(row)` (qua `readOfRow`), `allowEditing(row)` của cột (lớp bảo vệ riêng của `canEdit`: ném lỗi thì `false`, một cảnh báo "a column allowEditing threw: the cell cannot be edited."; cùng luật cho dòng đã lưu, nên không có luật thứ hai), `validate(value, row)`, `setValue(row, v)`, `ctx.row` của trình sửa (kiểu `Partial<TRow>` sẵn; `validateRow` đọc qua `readOfRow`). Không bao giờ gặp dòng mới: `allowUpdating(row)` (dòng mới luôn sửa được), `allowDeleting(row)` (Xoá bỏ dòng mới không hỏi), `sortValue`, `rowHasDetail`, `renderDetail`, `onRowActivate` (`isSavedRow`, `flat.added`). Mỗi điều nằm trong JSDoc của nó, của `initNewRow`, và trong mục "Adding rows" của `DataGrid.mdx`. Lo ngại 2 của báo cáo: `allowEditing` theo lớp bảo vệ của `canEdit` (ném lỗi là `false`) chứ không theo `readOfRow` (ném lỗi là trống), vì hai hàm trả lời hai câu hỏi khác nhau; cả hai cảnh báo một lần và không lần nào thoát ra.
   - **Kiểu export đủ** (OQ 6 (a)): `index.exports.test.ts` khẳng định mọi `export interface` / `export type` của `types.ts` trừ `DataGridColumnBase` được `index.ts` của grid export, và mọi kiểu `DataGrid*` mà `DataGridProps`, `DataGridHandle`, `DataGridColumn`, `DataGridCellContext`, `DataGridEditorContext` gọi tên cũng vậy; một ca tự kiểm phép phân tích nguồn.
   - Docs: bảng Labels có hàng `controls` và một bảng riêng mười khoá của nó, hàng `ok` / `cancel` nói `cancel` là mọi Cancel; Props (`summary` kiểu `DataGridSummary<TRow>`, `labels` nói năm bản ghi đưa được từng phần); Handle (`getState()` tám phần); "Adding rows" (hàm nào dòng mới gặp). Prettier dàn lại bảng Labels (ô khoá rộng nhất là `cancelButton` đã bỏ), nên diff MDX của bảng đó phần lớn là khoảng trắng (`git diff -w`).
7. **Xuất CSV** (Task 2; OQ 7–12; spec §6.3 "Xuất CSV" đã sửa; mockup G1 `mk-o1`):
   - **Dòng:** `PipelineResult.savedRows` (`keyedState.value`): dòng đã lưu sau tìm kiếm và lọc, theo thứ tự đang hiện, phẳng theo thứ tự các nhóm (dòng của nhóm đóng có mặt), mọi trang (`paging={false}` và grid ảo: mọi dòng sau lọc); không bao giờ `keyed` (mang lớp phủ) và không bao giờ dòng mới. Dòng giữ chỗ vì thay đổi chưa lưu và dòng chờ xoá có mặt với giá trị đã lưu, ở chỗ grid vẽ chúng (OQ 11); dòng mới, dòng chi tiết, hàng nhóm, hàng tổng không bao giờ; dòng của form đang mở và dòng đang sửa tại chỗ là dòng đã lưu của nó. `selectedOnly` lọc theo khoá đã chọn (OQ 8). Chế độ server: trang đang có, một cảnh báo. Dữ liệu rỗng: chỉ hàng tiêu đề; `loading`: các dòng grid đang giữ.
   - **Cột:** các cột dữ liệu đang hiện theo thứ tự vẽ (trái ghim, giữa, phải ghim), cột đang nhóm ở chỗ của nó trong bố cục (OQ 7; `applied.columns`), trừ cột ẩn, `exportable: false` (giá trị không phải boolean là `true`, không cảnh báo, như các boolean khác của cột) và mọi cột phục vụ (`isDataColumn`: ô chọn, tay nắm, thụt, nút chi tiết, cột thao tác). Hàng tiêu đề là `caption` dạng chuỗi, không thì id.
   - **Giá trị:** `values: 'formatted'` (mặc định) là chữ của ô qua `textOf` của grid (bộ nhớ chữ qua `readOfRow`): định dạng Intl theo `locale` và `timeZone`, chữ của hàm `format`, chữ hiển thị của lookup, `labels.yes` / `labels.no`; một `cell` tuỳ biến xuất chữ đó, không xuất thứ nó vẽ. `values: 'raw'`: `rawText` (số `String(n)` dấu chấm, `-0` là `0`, `NaN` và `Infinity` trống; `date` ngày ISO; `datetime` `toISOString()` theo UTC; boolean `true` / `false`; chuỗi nguyên; giá trị bị kiểu từ chối thì trống và cảnh báo như mọi lần đọc; lookup là `String(value)`; cột có `format` mà kiểu không đọc được giá trị thì ghi chữ của `format`, như `filterKey`).
   - **Định dạng:** RFC 4180; `separator` `,` (hay `;`, `\t`); trường được bọc `"` khi có dấu ngăn, `"`, CR, LF hay khoảng trắng đầu / cuối, `"` bên trong nhân đôi; CRLF sau mọi bản ghi kể cả bản ghi cuối (OQ 10); BOM trước (`bom`, mặc định `true`), có cả trong chuỗi trả về; `escapeFormulas` (mặc định `true`): trường của cột `string` hay lookup, và caption, bắt đầu bằng `=`, `+`, `-`, `@`, tab hay CR được thêm `'` trước khi bọc; số, ngày, boolean không bao giờ (một số âm đã định dạng vẫn là số). Không cột nào: chỉ BOM (khi `bom`), không bản ghi.
   - **Handle và tuỳ chọn:** `exportCsv(options?)` luôn trả chuỗi; tuỳ chọn của lời gọi đặt lên tuỳ chọn của `csvExport` (OQ 9); dùng được khi không có `csvExport` (prop chỉ thêm nút); mỗi tuỳ chọn ngoài tập giá trị là mặc định với một cảnh báo (tuỳ chọn của prop cảnh báo từ lần commit, của lời gọi từ `exportCsv`); đọc dòng, cột, chọn và tuỳ chọn của lần commit cuối qua ref ghi lúc commit, nên là một hàm duy nhất suốt đời grid. `downloadText(text, fileName ?? 'data.csv', 'text/csv;charset=utf-8')`: `Blob`, `URL.createObjectURL`, một `<a>` (`href`, `download`, `hidden`) gắn vào `document.body`, `click()`, gỡ ngay, `URL.revokeObjectURL` trong một task sau (`setTimeout(…, 0)`); không có `document` (server) thì không làm gì.
   - **Nút** (`exportButton`): `parts/ExportButton.tsx` (`memo`), `IconButton` `secondary` `md` (34×34) lớp `flg-data-grid-export-button`, `DownloadIcon` (ba đường của §4.6), Tooltip với tên (`describe: false`), `labels.exportCsv` "Export CSV"; nhấn gọi `exportCsv({ download: true })`. `null` khi không có `csvExport`. Thứ tự mặc định của thanh công cụ: `groupPanel`, `spacer`, `search`, `columnChooser`, `exportButton`, `addButton` (§4.3 G1; F1 vẽ thứ tự khác, G1 thắng); nút là một mục cho luật "không gì để vẽ"; hàm `toolbar` nhận `items.exportButton` (luôn là một khoá); `toolbar={false}` bỏ nó. CSS: `.flg-data-grid-chooser-button, .flg-data-grid-export-button { flex: none; }`; không quy tắc forced colours mới (IconButton có quy tắc của nó).
   - **Tương phản:** không cặp mới (IconButton `secondary`); nhãn dòng 2 nêu "the export button" sau nút chọn cột trong `scripts/contrast-exceptions.ts`, bảng §4.9 của spec 0+1 ("nút xuất CSV") và đoạn của `Accessibility.mdx`; `ExceptionTable.test.tsx` vẫn đếm 43.
   - **`G1`** (`DataGridFiltering.stories.tsx`, OQ 12): bật `csvExport`; play khẳng định nút xuất là anh em kế (bỏ qua phần tử popover mà bộ chọn cột gắn sau nút của nó) của nút chọn cột, 34×34, tên "Export CSV", và `noTitleIsCut`. JSDoc của `G1` và chú thích của `GridColumns`, `ColumnChooser`, `GridGroups`, `EditBatch` nói chúng để `csvExport` tắt (và vì sao), không đổi code. So với `mk-o1`: cùng variant, cỡ, icon, thứ tự và khoảng 8px (`gap` của thanh); chữ tiếng Anh; tooltip không vẽ lúc nghỉ (mockup không vẽ); ô tìm kiếm 260px như các phán quyết G1 trước.
   - Docs: mục "CSV export" của `DataGrid.mdx` (bảng tuỳ chọn, dòng, cột, giá trị, định dạng và `escapeFormulas`, BOM và Excel, `;` cho vùng dùng dấu phẩy thập phân, chế độ server: xuất ở server, `format` ném lỗi thì `exportCsv` ném), thứ tự và `exportButton` của mục Toolbar, Props (`csvExport`), trường cột (`exportable`), Handle (mười một thành viên), Labels (`exportCsv`), hai dòng "Do and don't".
8. **Hiệu năng của CSV** (`engine/perf.test.ts`, 10 000 dòng × 9 cột, `toCsv` với `csvColumns`, trung vị của năm lượt trên máy này, ba phiên): formatted, chữ đã có trong bộ nhớ **9–10 ms** (lượt lạnh đầu tiên 84–86 ms); raw **28–30 ms**. Ngưỡng gấp ba: `CSV_TARGET_MS = 10`, `CSV_RAW_TARGET_MS = 30`, nhân `SLACK` 3, nên 30 ms và 90 ms. Người viết lưu ý ngưỡng formatted 30 ms sát cho một CI bận: nếu nó chập chờn, nâng mục tiêu, không sửa code.
9. **Công thức lưu trạng thái** (Task 3; spec §6.3 "Lưu trạng thái" đã sửa):
   - `'use client'`; `const KEY = 'orders-grid-v1'`; `useState<Partial<DataGridState> | null>(null)`; một effect đọc `localStorage.getItem(KEY)` trong `try` và đặt nó; `<DataGrid key={saved ? 'saved' : 'default'} … defaultSort={saved?.sort} defaultFilter={saved?.filter} defaultGrouping={saved?.grouping} defaultColumnLayout={saved?.columnLayout} defaultPage={saved?.page} onStateChange={…}>` ghi năm phần trong `try`. HTML của server là trạng thái mặc định; grid mount lại một lần sau khi đọc. Khối MDX ("### Saving the state", trước "## Keyboard") và component của `saved-state.test.tsx` là cùng một văn bản giữa hai chú thích đánh dấu (người viết so bằng `diff`; MDX thêm import).
   - Lưu `sort`, `filter`, `grouping`, `columnLayout`, `page`; không lưu `selectedKeys`, `expandedRows`, `expandedGroups` theo mặc định (một lần làm việc, không phải ưu tiên), docs nói cách thêm. Trạng thái gặp cột đã đổi không một lời: id bố cục không còn cột thì bỏ, cột mới nối thêm, mục sắp xếp hay nhóm của trường grid không có thì bị bỏ qua và ở lại trong trạng thái, điều kiện lọc của cột không có ở lại, trang quá cuối bị kẹp. Văn bản không phải JSON là mặc định, không cảnh báo; trạng thái sai dạng (`{ "sort": 5 }`) là mặc định với một cảnh báo dev mỗi prop ("defaultSort is not an array of sort items"). `getItem` và `setItem` ném lỗi thì grid đi tiếp. Một lần sửa ở chế độ batch không gọi `onStateChange`, và `getState()` có đúng tám khoá.
   - Đoạn State nay kể đủ tám prop `default*` và nói công thức lưu năm phần.
10. **Grid ra công khai** (Task 4; spec §2, §10 đã sửa):
   - `src/index.ts` (sau các dòng của `Kbd`): `export { DataGrid, dataGridColumn } from './components/data-grid'` và `export type { … }` với 39 kiểu của `index.ts` của grid theo thứ tự chữ cái (`DataGridCellContext` … `DataGridValueColumn`). Không tên nào đổi hay bỏ.
   - `src/index.test.ts`: danh sách khoá chính xác thêm `DataGrid` và `dataGridColumn`; test "nguồn của `src/index.ts` không nhắc `data-grid`" thành "exports every name the DataGrid folder exports, values and types alike": đọc nguồn của hai entry, so từng tên và loại của nó, và đòi grid export hơn 40 tên để một lần phân tích rỗng không pass. Nó chỉ thấy khối `export { … }` và `export type { … }` (một `export *` hay `export type X` một dòng không được thấy; `index.ts` của grid không dùng cả hai).
   - `tags: ['unreleased']` và chú thích của nó bỏ khỏi năm file story (không thẻ nào khác ở đó); khối `tags` của `.storybook/main.ts` và chú thích của nó bỏ đi. Index đã build trước và sau: 145 mục `Components/DataGrid…`, cùng danh sách id (không tên ảnh chuẩn nào dời), thẻ `unreleased` 145 → 0. Năm tiêu đề: `Components/DataGrid`, `Components/DataGrid/Columns`, `…/Editing`, `…/Filtering`, `…/Grouping`; `Components/DataGrid` vừa là component (story và trang docs) vừa là cha của bốn tiêu đề kia; Claude đo sidebar (OQ 18): giữ.
   - `tsdown.config.ts`: `entry: ['src/index.ts']`, chú thích về entry thứ hai bỏ; `dist/components/data-grid/DataGrid.js` vẫn có sau `pnpm build`.
   - `scripts/rsc-probe.mjs`: ca "DataGrid is a client component: a Server Component that renders it hands it to the client": export của `dist/index.js` là tham chiếu client (`dist/components/data-grid/DataGrid.js`), và `data`, `rowKey`, `columns` (một cột `field`), `caption` qua được ranh giới.
   - `DataGrid.mdx`: phần mở đầu viết lại như của một component đã phát hành (nó là gì, khi nào dùng nó thay `Table`, liên kết `?path=/docs/examples-data-grid--docs`); "built in steps", "not released yet", "API grows" biến mất; danh sách tính năng thêm CSV; năm mẫu code import từ `'h2d-glass-ui'`. Grep `src/`, `.storybook/`, `scripts/`, `tests/` tìm `unreleased`, "Plan G", "until it is released", "built in steps": không còn (các câu "not exported from the package" của `table-parts.tsx` và `Tooltip.tsx` nói về phần nội bộ khác, vẫn đúng).
   - Lúc tĩnh ở 1280px trang docs DataGrid cuộn ngang (mép phải bảng Props ở 1446px, cột docs 965px; bảng Labels 989px): có sẵn ở mọi trang docs có bảng Props rộng (Combobox 1034px), bảng của grid rộng nhất và trước đây bị ẩn (`unreleased`). Không sửa ở G: quyết định của chủ dự án (phát hiện 23).
11. **Trang "Examples/Data grid"** (Task 5 cùng G1F1–G1F3 và fixup thứ tư; OQ 1; spec §8):
   - `orders.ts`: `Order`, `OrderLine`, `ORDERS` (40 đơn), `ASSIGNEE_ITEMS`, `TODAY` (`'2026-11-27'`), `nextOrderId`. `columns.tsx` (`COLUMNS`): Order (row header, 112), Customer (186, bắt buộc), Assignee (180, lookup với Avatar), Order date (150), Status (150, lookup với Badge: New `accent`, Processing `warning`, Delivered `success`, Cancelled `danger`), Channel (120, lookup), Qty (88), Total (142, VND); Order, Qty, Total có `allowHeaderFiltering: false` như G1 và `allowEditing: false`.
   - `OrdersGrid.tsx` (`'use client'`, import từ `'../../index'`): grid với `caption="Orders"`, mô tả, `variant="lined"`, `height` 520 (rộng) / 600 (điện thoại), `locale="vi-VN"`, `selectionMode="multiple"`, `defaultSelectedKeys={['DH-1038', 'DH-1033']}`, `paging={{ pageSize: 12, pageSizes: [12, 24, 48] }}`, `searchPanel`, `columnChooser`, `filterRow`, `headerFilter`, `filterPanel`, `groupPanel`, `csvExport={{ fileName: 'lumen-orders.csv' }}`, `summary` (cuối bảng: số đơn và tổng Total; nhóm: tổng Total), `renderDetail` (bảng các dòng hàng), `editing={{ mode, allowAdding: true, allowDeleting: true }}`, `onSaving` áp thay đổi vào danh sách, `initNewRow`; bố cục mặc định theo lớp (`wide`: Order ghim trái, Channel ẩn; `phone`: ẩn Assignee, Order date, Channel, Qty, không ghim), sắp xếp mặc định theo lớp (`wide`: ngày giảm dần; `phone`: Order giảm dần), và công thức lưu trạng thái với khoá theo lớp. Thẻ `Card`; trên nó SegmentedControl "Edit mode" và dòng chữ.
   - Đo (Chromium; người viết Task 5 và G1F2): `DataGridExample` (1280×720, stage là cửa sổ): thẻ x 32..1248 (1216), y 101..659; khung rộng 1176, `scrollWidth` 1176 (không cuộn ngang); 12 dòng, khung cao 421px; thanh công cụ một hàng 41px (caption và mô tả, thanh nhóm với gợi ý 319px, tìm kiếm 260, chọn cột, xuất, thêm); bảy tiêu đề (Channel trong bộ chọn); không tiêu đề nào bị cắt; `aria-sort="descending"` trên Order date; Order `data-pinned="left"`; DH-1038 và DH-1033 đã chọn; dòng đầu DH-1040; không hàng nhóm, không chi tiết mở; chân "Orders: 40" và "Total of Total 583.080.000 ₫". `DataGridExamplePhone` (390×844): số đo của G1F2 (phát hiện 4); bốn tiêu đề Order, Customer, Status, Total; `aria-sort` trên Order; không `[data-pinned]`; khung cuộn ngang. Ảnh của Claude sau Task 5 (trước các fixup): bản rộng đúng (b), không cuộn ngang; bản điện thoại khung 271 / 742, không ghim, thẻ kết thúc ở 773 trên 844, và icon của thanh nhóm trống nằm một hàng riêng (G1F1).
   - Story (`title: 'Examples/Data grid'`, `parameters: { stage: 'viewport', a11y: region tắt }`, `beforeEach` xoá cả hai khoá): `DataGridExample` (`viewport-1280x720`) và `DataGridExamplePhone` (`viewport-390x844`) đặt cửa sổ bằng `withViewport` và chờ bố cục của nó (điện thoại: chờ grid mount lại không có Assignee), đưa con trỏ ra khỏi grid, không ô nào có focus, `noTitleIsCut`, khung không cuộn ngang (rộng) hay cuộn (điện thoại), các trạng thái của (b), thẻ nằm trong stage. Bốn story hành vi `no-visual`, mỗi story đặt cửa sổ 1280×720: `ExampleEditModes` (từng phân đoạn qua nhóm tên "Edit mode": Row có nút Sửa; Cell không có, nhấn mở trình sửa; Batch giữ một thay đổi, thanh nói "1 unsaved change"; quay về Row thì thanh mất và ô giữ khách hàng đã lưu; Form mở `form.flg-data-grid-form`; Popup mở `dialog[open]`), `ExampleSaves` (Sửa DH-1039, gõ, Enter, ô hiện giá trị mới, chữ của chân không đổi), `ExampleSavedState` (nhấn Customer, khoá rộng có sắp xếp, khoá điện thoại trống, mount lại qua nút "Reload" của wrapper, sắp xếp trở lại; `finally` xoá khoá), `ExampleExport` (`lumen-orders.csv`, dòng thứ hai bằng các trường của dòng đầu đang hiện theo các cột của hàng tiêu đề, 40 bản ghi cộng hàng tiêu đề và CRLF cuối; stub được trả lại trong `finally`). Mọi lần chờ có thời hạn 5 giây riêng có tên; không loạt phím nào được đếm.
   - `DataGridExample.mdx`: `<Meta of={Stories} />`, phần mở đầu, `StoryFrame` của story rộng và story điện thoại (`phone`), một đoạn cho mỗi tính năng với liên kết tới trang story của nó, ba khối `Source` (`asShown` viết `'../../index'` thành `'h2d-glass-ui'`). Sidebar: "Examples › Data grid" sau "App shell"; liên kết của `DataGrid.mdx` trỏ đúng chỗ.
   - Điều về grid mà ví dụ tìm ra (không đổi grid): sắp theo một cột ẩn không được áp; grid trong một track `auto` nới track ra bằng bảng (G1F3).
12. **Getting started và Accessibility** (Task 6; chỉ MDX):
   - `GettingStarted.mdx` "Data grid" (sau "Show data", trước "App shell"): vì sao một client component bọc grid (nó giữ state và cột mang hàm); một trang Server Component (`app/orders/page.tsx`) đọc dữ liệu và đưa dòng thuần cho `orders-grid.tsx`; cột là hằng của module, `dataGridColumn<Order>()` cho cột tính; `rowKey`, `columns` ổn định (và hàm của `labels`, `rowClassName`, `summary`), cùng `locale` ở server và trình duyệt (và Node có ICU đủ), `width` để không dời sau hydrate; "Rows from a server" với mẫu `RemoteOrders` (`remote`, `totalCount`, `loading`, `sort` / `filter` / `page` controlled với `onSortChange` / `onFilterChange` / `onPageChange`, bỏ một câu trả lời cũ); liên kết tới trang DataGrid, mục "Server mode" của nó và "Examples/Data grid". Ba mẫu code được người viết chép vào một thư mục tạm dưới `src/docs/`, trỏ `'h2d-glass-ui'` về `../../index`, `npx tsc --noEmit -p .` sạch, rồi xoá; `RemoteOrders` không chạy với server nào.
   - `Accessibility.mdx` "The data grid" (trước "Other preferences"): role và tên (`grid`, `treegrid` chỉ khi có nhóm), tiêu đề cột và tiêu đề dòng, một điểm Tab và các phím, chế độ widget, mọi câu của vùng live với khoá `labels` của nó, trình sửa (tên là caption, lỗi qua `aria-describedby`), đường phím và menu của mỗi kiểu kéo, chạm, forced colours, rồi danh sách kiểm tra của trình đọc màn hình (lớp 6), mỗi mục "not checked yet", và một đoạn nói điều đã biết (khẳng định trong DOM, axe sau mỗi story) và điều chưa biết (mỗi trình đọc nói gì). Bảng phím được liên kết (`?path=/docs/components-datagrid--docs#keyboard`), không chép lại.
   - `Theming.mdx` đọc, không đổi: ba token của grid đã có.
   - Lo ngại của người viết: câu "một Dialog modal chứa grid không làm grid im lặng" suy từ việc vùng live ở trong gốc của grid (chú thích của `useAnnounce`), chưa chạy trong một Dialog.
13. **Fixtures** (Task 7; OQ 14, 15; spec §7 đã sửa):
   - Next.js: `app/grid/orders.ts` (30 đơn thuần), `app/grid/page.tsx` (Server Component), `app/grid/orders-grid.tsx` (`'use client'`: Status Badge lookup, Channel lookup, `rowKey="id"`, `caption="Orders"`, `filterRow`, `headerFilter`, `groupPanel`, `defaultSort` theo `id` tăng, `defaultGrouping` theo Status, `summary` cuối bảng và nhóm, `editing={{ mode: 'row' }}` với `onSaving` cập nhật state, `csvExport={{ fileName: 'orders.csv' }}`, `locale="vi-VN"`, VND, `data-hydrated` trên một wrapper). Vite: `grid.html`, `src/grid-main.tsx`, `src/GridPage.tsx` (cùng grid, dữ liệu dựng trong file), `grid:` là entry thứ ba của `vite.config.ts` (chú thích nói ba entry).
   - `scripts/test-fixtures.mjs`: `gridPath` cho mỗi app (`/grid.html`, `/grid`); `checkGridHtml(origin, path)` (chỉ Next.js: `role="treegrid"`, `aria-sort`, grid được gọi tên bởi id của caption, đơn đầu của nhóm đầu, một hàng nhóm); `checkGrid(browser, url)` (console không báo gì từ lúc nạp tới cuối, kể cả cảnh báo hydrate; nhấn "Order date" đổi `aria-sort`; gõ vào ô lọc Customer đổi chữ đếm của thanh phân trang; nhóm qua menu ⋮ của Channel thêm một chip; chế độ `row`: Sửa dòng đầu, gõ khách hàng, ✓, dòng hiện nó; nút xuất cho một lần tải tên như `csvExport` nói, bắt đầu bằng BOM và hàng tiêu đề của các cột đang hiện, có cả khách hàng vừa lưu); `checkTreeShaking(browser, origin, app)` (chỉ server production: gom thân mọi phản hồi `.js` khi nạp trang chính và khi nạp trang grid; `flg-data-grid-frame` phải có trong JS của trang grid, không thì "the check is broken", và vắng trong JS của trang chính); `waitUntil` (mỗi lần chờ có thời hạn và lời riêng). Nối vào `testApp` sau các kiểm tra của shell, với nhãn `… grid:` và `… tree-shaking:`.
   - Next.js đo được: không cấu hình gì, `/` không mang `flg-data-grid-frame` và `/grid` mang nó, nên không cần `optimizePackageImports`, không `next.config`, Getting started không thêm dòng nào; kiểm tra bật cho cả hai app. Vite: trang chính không mang, trang grid mang (grid vào chunk `grid-*.js` riêng).
   - Cột Status đang nhóm không được vẽ thành tiêu đề nhưng có trong hàng tiêu đề của CSV ở chỗ của nó (`Order,Customer,Order date,Status,Channel,Qty,Total`): OQ 7 đứng vững.
   - Thời gian: cả lượt 57 giây (khoảng 5 giây cài đặt, cache npm ấm), vite 27, next 33; job fixtures 30 phút của CI dư rất nhiều, nên `ci.yml` không đổi. Fixture chỉ chạy Chromium: lần tải thật trong WebKit không chạy.
14. **Changeset, kích thước, README** (Task 8; OQ 17; spec §2, §7, §8, §9 đã sửa):
   - `.changeset/phase-6-data-grid.md`: `'h2d-glass-ui': minor`; một câu tóm tắt giai đoạn 6; Kbd; `MenuShortcut` nhận `keys`; `DialogContent` `movable` (với token `--flg-dialog-lift-shadow`) và `fullScreenOnPhone`; DataGrid với `dataGridColumn` và các kiểu, các tính năng, và ba token `--flg-data-grid-pin-bg`, `--flg-data-grid-pin-shadow`, `--flg-column-resize-line`; "DataGrid is a client component. It stays out of an app that does not import it."; "There are no breaking changes." (đúng, vì grid chưa từng được export). Không gì về các bước publish. `pnpm changeset status`: một `minor`.
   - README: "40 accessible components" → "48"; câu kích thước: "about 120 kB of JavaScript (98 kB of it the data grid) and 21 kB of CSS, … an app that does not import the data grid does not load it" (số của `size-limit`; câu tree-shaking là điều kiểm tra của Task 7 chứng minh); "Data display" thêm DataGrid và Kbd; dòng mới "Application frame" (AppShell, Nav, Indicator, SearchField, ThemeSwitch, UserMenu); liên kết tới ví dụ data grid; tám định nghĩa liên kết mới. `description` của `package.json`: 48. Cách đếm: 40 của README là số họ component trong danh sách của nó (Card cùng các phần đếm một; DropdownMenu và ContextMenu đếm riêng; các phần `Menu*` chung không đếm); đi qua các export giá trị của `src/index.ts` theo họ: 40 họ tới giai đoạn 4, cộng 6 của giai đoạn 5 và Kbd, DataGrid. Mở đầu của `GettingStarted.mdx` thêm "Phase 6 adds Kbd, for keys written for the platform, and DataGrid, for data you own."
   - Hai chú thích không còn đúng được sửa: bốn nhãn "Plan G:" của `scripts/test-fixtures.mjs` thành "Phase 6:" (dạng của file); "the real ones are built by later plans" của `.storybook/app-shell-demo.tsx` (sai từ giai đoạn 5). Grep cuối của `src/`, `.storybook/`, `scripts/`, `tests/`, `README.md` tìm "Plan G", "unreleased", "not released", "until release", "later plans", "for now": các chỗ còn lại đúng (`DataGrid.csv.test.tsx:9`, `DataGrid.renders.test.tsx:1755` gọi tên nguồn gốc của mục spec; "released" nghĩa là thả con trỏ hay Tab; "a later leave"; "disables for now" là chủ đề của test).
15. **Nhãn mới và nhãn đổi của G** (`labels.ts`, mọi khoá có mặc định tiếng Anh): Task 1: bản ghi `controls` (mười khoá, phát hiện 6); `cancel` "Cancel" là mọi Cancel, `cancelButton` bỏ. Task 2: `exportCsv` "Export CSV". Không khoá nào khác đổi.
16. **Story** (spec §7 đã sửa):
   - Mới: `CsvExport` (`DataGridFiltering.stories.tsx`, `no-visual`, Task 2: nút sau bộ chọn cột, tooltip "Export CSV" khi hover, một lần nhấn với stub cho đúng một `Blob` kiểu `text/csv;charset=utf-8` bắt đầu bằng BOM và hàng tiêu đề, tên `data.csv`); `SavedState` (`DataGrid.stories.tsx`, `no-visual`, Task 3: nhấn "Order date" qua nút sắp xếp của tiêu đề, khoá giữ `[{ field: 'date', direction: 'asc' }]`, nhấn "Reload", chờ tiêu đề cũ rời DOM rồi `aria-sort="ascending"` trên tiêu đề mới; khoá riêng `saved-state-story-v1` xoá trong `beforeEach` và `finally`); `GroupPanelHintWraps` (`DataGridGrouping.stories.tsx`, `no-visual`, Task 5, G1F1); `DataGridExample`, `DataGridExamplePhone`, `ExampleEditModes`, `ExampleSaves`, `ExampleSavedState`, `ExampleExport` (`src/docs/DataGridExample.stories.tsx`, Task 5).
   - Đổi: `G1` (Task 2, OQ 12: `csvExport`, play mới); thẻ `unreleased` bỏ khỏi năm file (Task 4); `WhileANonModalOverlayHasFocus` của Tooltip (Task 0). Không play nào của một story giao diện A–F khác đổi; chú thích của `GridColumns`, `ColumnChooser`, `GridGroups`, `EditBatch` đổi lời, không đổi code.
   - Luật: không story nào chờ bằng giây mặc định của `waitFor`; không story nào đếm điều một loạt phím thật làm; story đưa con trỏ ra khỏi grid trước khi đọc một dòng đang nghỉ; một lần nhấn tìm theo chữ đi qua một cha có tên (nhóm "Edit mode", vùng của grid); story giao diện không vẽ popup mở; story chạm `localStorage` xoá khoá của nó trong `beforeEach` và `finally`; story tải file stub `URL.createObjectURL`, `URL.revokeObjectURL` và `HTMLAnchorElement.prototype.click`, đọc `Blob` và trả mọi stub lại trong `finally`, không bao giờ tải thật.
17. **Ngưỡng kích thước và `check:package` giữa các task:**
   - Ở `8fb9ff8`: ngưỡng JS (all exports) 63820 B, JS (DataGrid) 105887 B, CSS 23054 B; số đo 58.02 kB, 96.53 kB, 20.97 kB.
   - Sau từng task (các báo cáo, đo trên commit nháp trước khi gộp; Task 0 không đổi gì): "JS (DataGrid)" 96.88 kB (Task 1), 98.18 kB (Task 2–8); "JS (all exports)" 58.02 kB (Task 1–3), **119.61 kB** (Task 4–8: mục này đo `import: "*"` không tree-shake, nên nay mang cả grid, +61.6 kB); CSS 20.97 kB (Task 1–4), 20.98 kB (Task 5 sau fixup thứ tư, tới Task 8; 20.99 kB sau G1F1 trước fixup đó).
   - Task 0–3: `check:package` PASS với ngưỡng cũ. **Task 4: trước lần ghi, bước `size` của `check:package` fail ở "JS (all exports)"** ("exceeded by 55.79 kB"), như brief đoán trước; mọi bước trước nó pass. Task 4 chạy `pnpm size:record` (ngưỡng là số đo cộng 10%): JS (all exports) 131571 B, JS (DataGrid) 107996 B, CSS 23064 B (hai mục sau dời vì lần ghi đo lại các số của Task 1–3, không phải vì Task 4). Task 5–7 PASS với ngưỡng đó. Task 8 ghi lại sau mọi task: chỉ CSS đổi, 23064 → 23079 B (quy tắc thanh nhóm trống của G1F1 và fixup thứ tư); hai mục kia giữ 131571 B và 107996 B.
   - Mức tăng so với `8fb9ff8`: "JS (DataGrid)" +1.65 kB (96.53 → 98.18: chữ của các control +0.35, CSV +1.30: engine, `downloadText`, icon, nút); CSS +0.01 kB; "JS (all exports)" +61.59 kB (grid vào entry). `.size-limit.json` là file duy nhất `size:record` đổi.
18. **Thay đổi ở code ngoài thư mục grid** (spec §2): không đổi hành vi hay giao diện của component cũ nào.
   - `src/internal/icons.tsx` và test: `DownloadIcon` (Task 2). `src/internal/download.ts` và test (mới, Task 2). `src/styles/components/data-grid.css` (Task 2, 5), `scripts/check-dist-css.ts` (`flg-data-grid-export-button` Task 2, `flg-data-grid-group-hint` Task 5). `scripts/contrast-exceptions.ts`, §4.9 của spec 0+1, `src/docs/Accessibility.mdx` (nhãn dòng 2, Task 2; mục "The data grid", Task 6).
   - `src/index.ts`, `src/index.test.ts`, `tsdown.config.ts`, `.storybook/main.ts`, `scripts/rsc-probe.mjs` (Task 4). `src/docs/` (trang Examples và code của nó, Task 5; Getting started, Task 6, 8). Fixture Next.js và Vite, `scripts/test-fixtures.mjs` (Task 7, 8). `.changeset/phase-6-data-grid.md`, `README.md`, `package.json` (`description`), `.storybook/app-shell-demo.tsx` (chú thích) (Task 8). `src/components/tooltip/Tooltip.stories.tsx` (Task 0).
   - Không token mới, không giá trị token nào đổi, không custom property mới, không data-attribute mới. Không file nào bị xoá.
19. **Dòng đã đổi theo `split.md` "What Plan F left to Plan G"**: CSV (Task 2; dòng đã lưu, không dòng mới); công thức lưu trạng thái, bỏ trạng thái sửa (Task 3); export, `unreleased`, entry thứ hai của tsdown (Task 4); trang Examples với SegmentedControl đổi chế độ sửa (Task 5); Getting started "Data grid" (Task 6); fixture với chế độ `row` và `onSaving` (Task 7); changeset nêu `DialogContent fullScreenOnPhone` (Task 8); hình API của review cuối Plan F: dòng mới với `TRow` (I4, OQ 5, Task 1), `DataGridEditorContext` (ghi lại, không đổi), Minor 10 chữ của các control (OQ 2, Task 1), `addRow()` và `onSaving` (ghi lại: lớn thêm được). PR #46 để lại: NVDA và VoiceOver (không ở G; Task 6 viết "not checked yet", Task 8 ghi §9), điện thoại thật (không ở G), tooltip dùng chung (không ở G), tách `use-editing.ts` (OQ 16, không ở G), ảnh forced colours và contrast-more chỉ từ CI (vẫn đúng).
20. **Chỗ bước fail-first không đầy đủ**, theo các báo cáo của bản nháp:
   - Task 0: lỗi chỉ gặp ở CI và không tái hiện được trên máy nào xem được, nên story không fail trước; bằng chứng là lượt pass ở ba engine và lời fail mới.
   - Task 1: `DataGrid.controls-words.test.tsx` 8 ca chữ tiếng Việt fail trước (`Unable to find an accessible element with the role "button" and name "Chọn ngày"`, `… "Tăng"`, `Unable to find an element with the text: Không có kết quả`, `… "Xoá tìm kiếm"`, `toHaveTextContent` cho lỗi của trình sửa ngày); 8 ca mặc định pass trước (đặc tả: mặc định là của chính control; hai ca đầu fail ở bộ chọn của chính người viết, sửa trước khi lượt tiếng Việt được tính). **Các ca mới của `labels.test.ts` viết sau code** (chứng minh trên `labels.ts` cũ với một stub `controlLabelsOf`: 6 fail). **`index.exports.test.ts` không fail trước được** (export đã đủ): kiểm bằng đột biến (bỏ `DataGridToolbarItems` khỏi `index.ts` thì hai ca fail, `expected [ 'DataGridToolbarItems' ] to deeply equal []`). **`DataGrid.newrow-callbacks.test.tsx` là đặc tả** (lớp bảo vệ có từ Plan F; ca `format` fail lần đầu vì grid chỉ gọi `format` cho giá trị không trống, nên test cho `initNewRow: () => ({ qty: 2 })`). **`DataGrid.test-d.ts` viết sau khi đổi tên.**
   - Task 2: stub đúng chữ ký trước cho `engine/csv.ts`, `rawText`, `downloadText`, `DownloadIcon`: `csv.test.ts` (18 ca) `expected '' to be 'Nguyễn Văn An'`; `rawText` `expected '' to be '1234.5'` (ca trống pass trên stub); `pipeline.test.ts` `Cannot read properties of undefined (reading 'map')`; `download.test.ts` `expected [] to have a length of 1 but got +0` (ca không `document` pass trên stub); `icons.test.tsx` `expected [] to deeply equal [ …(3) ]`; `DataGrid.csv.test.tsx` (50 ca) `TypeError: gridRef.current.exportCsv is not a function`; `DataGrid.chooser.test.tsx` `Unable to find an accessible element with the role "button" and name "Export CSV"` và `expected [ 'addButton', 'columnChooser', …(3) ] to deeply equal [ …(4) ]`; `perf.test.ts` fail ở import của `csvColumns`; test kiểu báo lỗi kiểu. **Ca thứ hai của "the CSV export" trong `DataGrid.renders.test.tsx` là đặc tả** (ca đầu fail nhờ khẳng định nút). **Story `CsvExport` viết cùng code và không chạy trên code cũ** (ca unit cùng nội dung fail trước).
   - Task 3: **cả 11 ca của `saved-state.test.tsx` là đặc tả** (grid đã làm điều công thức cần); chỉ lỗi của chính người viết fail trước (hướng sắp xếp viết `'ascending'`; ca batch cần stub `HTMLElement.prototype.checkVisibility` trong jsdom). Không kiểm đột biến nào. Story `SavedState` pass trên grid như cũ.
   - Task 4: `src/index.test.ts` fail trước (`expected [ 'Accordion', …(126) ] to deeply equal [ …(128) ]`, `DataGrid is exported: expected undefined to be 'value'`); ca mới của `rsc-probe.mjs` (trong khối code) fail trên bản build trước khi export (`Unsupported element type: undefined`); `check:package` fail ở `size` tới khi ghi ngưỡng.
   - Task 5: file story của trang không nạp được trên cây của Task 4 (ví dụ chưa có); người viết viết story cùng ví dụ (một story đo trước, để chọn chiều cao và độ rộng), và các lần fail đầu của file đã xong là lỗi của chính test (chữ của chân "Orders: 40", dòng đầu của điện thoại DH-1001 vì sắp theo cột ẩn, Assignee trong CSV có chữ viết tắt của Avatar trước tên, stage lớn hơn cửa sổ vì các đốm nền của mockup tràn ra nên khẳng định là chiều cao stage bằng cửa sổ). `GroupPanelHintWraps` (G1F1) fail trước trên CSS cũ.
   - Task 6: chỉ docs, không gì fail trước được; bằng chứng là bản build docs, `check:docs-tables` và các test có sẵn của mỗi điều trang nói (Step 2 của Task 6).
   - Task 7: bản sao đổi cổng chạy trên cây của Task 6 với script mới và không có trang grid: mỗi kiểm tra mới fail (Step 2 của Task 7), kể cả đối chứng dương của tree-shaking.
   - Task 8: file phát hành, không gì fail trước được; kiểm tra là `pnpm changeset status`, `check:package` với ngưỡng mới và fixture một lượt.
   - Trên cây của plan (patch test áp trước patch code): file test của một module mới không nạp được (`Failed to resolve import "./csv"`, `"./download"`; `perf.test.ts` vốn import `./csv` cũng vậy), hàm mới chưa có thì `TypeError: … is not a function`, test hành vi fail trên assertion, test kiểu báo lỗi kiểu.
21. **Các chỗ spec được sửa khi lập Plan G** (đánh dấu "(phát hiện khi lập Plan G)"; spec giai đoạn 6 trừ khi ghi khác):
   - Task 1: khối interface của §6.3: `summary?: DataGridSummary<TRow>` (tên kiểu, trước là `DataGridSummaryProp`), `labels?: DataGridLabelsInput` (`Partial<DataGridLabels>` không ghép được các bản ghi), `getState()` đủ tám phần; bảng nhãn: `cancel` của hàng Lọc (D) là mọi nút Cancel, `cancelButton` bỏ khỏi hàng Sửa (F), hàng mới "Điều khiển vẽ sẵn (G)" với bản ghi `controls`.
   - Task 2: §6.3 "Xuất CSV": Dòng (nhóm đóng, phạm vi của `selectedOnly`, dòng giữ chỗ và dòng chờ xoá, dòng mới), Cột (cột đang nhóm, không còn cột, caption được bọc và chặn), Định dạng file (CRLF sau mọi hàng), `exportCsv` (thứ tự ghép, dùng được không có `csvExport`, cái gì tải về, tuỳ chọn ngoài tập giá trị, lớp bảo vệ). Spec 0+1 §4.9 dòng 2: "nút xuất CSV".
   - Task 3: §6.3 "Lưu trạng thái": công thức docs là component mà test chạy; hai điểm khác bản trên (chú thích của `catch`; trạng thái sai dạng rơi về mặc định với một cảnh báo mỗi prop, văn bản không phải JSON rơi về mặc định không cảnh báo). Người viết lưu ý "hai điểm" viết lỏng.
   - Task 4: §2 đoạn `unreleased` (đã làm ở Task 4: 39 kiểu, năm file story, khối `tags`, id không đổi), dòng tsdown của Plan B (đã bỏ ở Task 4), dòng `size-limit` của §8 (lần ghi của Task 4), dòng `unreleased` của §10 (đã xong).
   - Task 7: §7 "Fixtures", mệnh đề tree-shaking: dấu `flg-data-grid-frame` trong các tệp `.js` mà trang production tải, đối chứng dương trên trang grid, lý do (lời `devWarn` dựng từ mẫu chuỗi nên không bundle nào chứa nguyên văn "<DataGrid> needs a name"), Next.js không cần `optimizePackageImports`.
   - Task 8: §2 dòng G (xong ở Plan G); §7 danh sách ảnh chuẩn Plan G (16 mới và 8 của `G1` đổi một lần); §8 dòng `size-limit` của Task 8; §9 mục 1, lớp 6 "Chưa kiểm tra" với từng mục (Kbd, Dialog kéo được, các mục của grid, NVDA tự vào chế độ focus), việc của chủ dự án.
22. **Ảnh chuẩn.**
   - Mới: 16 = 2 story giao diện × 8 (4 chế độ × sáng, tối): `DataGridExample` (`viewport-1280x720`), `DataGridExamplePhone` (`viewport-390x844`), id `examples-data-grid--…`. Không story nào của G gắn `reduced-motion`.
   - **Đổi một lần, có chủ đích:** 8 ảnh của `G1` (`components-datagrid-filtering--g-1--*`; nút xuất sau nút chọn cột). `G1Scrolled` không bật `csvExport` và không đổi.
   - **Không ảnh nào khác đổi:** bỏ `unreleased` không dời ảnh nào (harness chỉ bỏ qua `no-visual`, `tests/visual/stories.visual.ts`), id không đổi; nút xuất là `null` khi không có `csvExport`, nên `GridColumns`, `ColumnChooser`, `GridGroups`, `EditBatch` và các story khác giữ thanh công cụ; chữ của Task 1 là tên aria và mặc định; Task 3 chỉ thêm một story `no-visual`; quy tắc thanh nhóm trống của fixup thứ tư dời 0 pixel ở `GroupPanelEmpty` (so A/B, Chromium sáng).
   - Index đã build: 196 story có ảnh (194 ở `8fb9ff8`); ảnh của B 58, C 56, D 40, E 32, F 64 như trước; Examples 16. Bản nháp không chạy so sánh pixel (ảnh chuẩn cần Docker); CI visual xác nhận.
23. **Duyệt của chủ dự án.** Mô tả PR nêu:
   - ảnh chuẩn: 8 ảnh của `G1` đổi một lần (nút xuất; `git rm` trước, rồi `visual-update.yml`), 16 ảnh mới (`DataGridExample`, `DataGridExamplePhone` × 4 chế độ × sáng, tối), mọi ảnh khác không đổi (`GroupPanelEmpty` đo 0 pixel); đếm lại từ index đã build (lệnh ở Step 4 của Task 8);
   - "JS (all exports)" từ 58 kB lên khoảng 120 kB vì grid nay ở gốc gói (mục đó đo mọi export không tree-shake), và một app không import grid không tải nó (kiểm tra tree-shaking của Task 7, cả Next.js lẫn Vite);
   - trang docs của DataGrid cuộn ngang ở 1280px (bảng Props), như mọi trang docs có bảng Props rộng: quyết định của chủ dự án, không sửa ở G;
   - trang Examples nằm ngoài mockup (không mockup nào vẽ nó): (b) và (p2) mà chủ dự án chọn trên trang quyết định, thanh công cụ của điện thoại bốn hàng và thanh phân trang ba hàng như grid đã làm, sắp theo Order trên điện thoại, lề 16px trên điện thoại;
   - thay đổi story của Tooltip (Task 0), vì sao (2 trong 5 lượt CI fail, không tái hiện được), và lời fail của nó nói gì nếu nó fail lần nữa (số lần Esc trang thấy, `document.hasFocus()`, phần tử có focus);
   - lớp 6 (NVDA, VoiceOver) chưa kiểm tra cho Kbd, Dialog kéo được và grid (§9): việc của chủ dự án;
   - các dòng spec sửa trong bản nháp (phát hiện 21);
   - ngưỡng kích thước (phát hiện 17);
   - `0.5.0` do chủ dự án publish (PR "Version Packages" và `npm publish` qua workflow Release), không bao giờ do plan; merge PR này mở PR "Version Packages", và docs công khai có grid ngay khi merge (Pages deploy mỗi lần push lên `main`);
   - các quyết định Claude tự chốt (phát hiện 2, 4, 5), các mục để lại cho review cuối (phần "Review Focus") và các mục để lại (phát hiện 24).
24. **Các mục để lại** (không làm ở plan này; `split.md` "Left after phase 6"):
   - Việc của người, không phải code: lớp 6 (NVDA với Chrome và Firefox, VoiceOver trên macOS và iOS) cho Kbd, Dialog kéo được và mọi mục grid ở §7; điện thoại thật (popup của EF1, trang Examples trên điện thoại, các kiểu kéo bằng chạm); các kiểm tra Safari còn nợ từ giai đoạn 1; §9 mục 4, chủ dự án duyệt các dòng 37–43 của §4.9; publish `0.5.0`.
   - Việc sau trong code: tách `use-editing.ts` (1702 dòng) và `DataGrid.tsx` (1275 dòng); một tooltip dùng chung cho nút thao tác và tay nắm tắt; hiệu năng của 10 000 dòng đo trong trình duyệt thật; `isNew` trên `DataGridCellContext` nếu app cần; `addRow()` trả khoá mới và `onSaving` trả khoá cho các `insert` (thêm được, không phá vỡ).
   - Ngoài phạm vi theo quyết định (§2): nhóm và cuộn ảo ở chế độ server, `stateStoring` tự động, xuất Excel (`.xlsx`), clipboard, kiểm tra bất đồng bộ trong từng ô, phải sang trái (chủ dự án, 2026-11-09).

**Phạm vi:**
- **Không làm ở plan này:** các mục ở phát hiện 24 và phần "Review Focus". Không tách `use-editing.ts` (OQ 16). Không sửa trang docs cuộn ngang ở 1280px. Không chạy `changeset version`, `changeset publish` hay `npm publish`.
- **Ảnh chuẩn visual:**
  - 2 story giao diện mới, mỗi story 8 ảnh: 16 ảnh mới, không `reduced-motion` (Task 5: `DataGridExample` `viewport-1280x720`, `DataGridExamplePhone` `viewport-390x844`; trang ngoài mockup, theo lựa chọn của chủ dự án).
  - 8 ảnh của `G1` đổi một lần (Task 2; OQ 12).
  - Mọi story khác của Plan G gắn `no-visual` (`CsvExport`, `SavedState`, `GroupPanelHintWraps`, bốn story hành vi của Examples). Index đã build có 196 story có ảnh.
  - Không tạo ảnh trên Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines" sau khi đẩy nhánh, sau khi 8 ảnh của `G1` đã được xoá bằng `git rm`.
  - Ảnh của mọi story và component khác phải giữ giống từng byte (phát hiện 22).

## Global Constraints

- Tên package `h2d-glass-ui`; chỉ ESM; `exports` gồm `.`, `./styles.css` và `./package.json`; `"sideEffects": ["**/*.css"]`.
- `pnpm check:name` fail khi tên cũ xuất hiện lại ngoài `docs/superpowers`. Ví dụ code trong trang MDX import từ `'h2d-glass-ui'`; `DataGrid.mdx` cũng vậy từ Task 4 (trước đó nó import grid từ `'./data-grid'`, vì grid chưa được export). Code của trang Examples import từ `'../../index'` và được trang hiện là `'h2d-glass-ui'` (`asShown`), như ví dụ App shell.
- Cảnh báo dev bắt đầu bằng `[h2d-glass-ui]`: `devWarn` thêm `WARN_PREFIX` của `src/internal/warn.ts`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`.
- Runtime dependency **chỉ có** `clsx` và `@floating-ui/dom`, cả hai ghim đúng phiên bản (`2.1.1`, `1.8.0`). Plan này không thêm dependency.
- Browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 17.4, iOS >= 17.4`. `Blob`, `URL.createObjectURL`, thuộc tính `download` của `<a>`, `TextDecoder`, `window.matchMedia`, `useSyncExternalStore`: có ở mọi trình duyệt và mọi bản React của mốc này. Code vẫn kiểm `typeof document` (`downloadText` không làm gì ở server); ví dụ đọc `window.matchMedia` chỉ trong `subscribe` và ảnh chụp của client.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Giao diện và trạng thái dùng data-attribute của Plan B–F; G không thêm data-attribute nào.
- G không thêm custom property nào và không token nào. Không giá trị token nào trong `src/styles/theme/values.ts` đổi.
- CSS nằm trong các layer theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS của grid ở `src/styles/components/data-grid.css` trong `@layer flg.components`; quy tắc `forced-colors`, `prefers-contrast: more` và `prefers-reduced-motion` ở `src/styles/preferences.css` (G không thêm quy tắc nào ở đó: nút xuất là IconButton, có quy tắc của nó).
- **Mockup lock.** Theme mặc định vẽ đúng G1 (`mk-o1`) ở nút xuất: IconButton `secondary` `md` 34×34, `DownloadIcon`, sau nút chọn cột và trước nút thêm, cách 8px. Trang Examples không có mockup: nó theo lựa chọn của chủ dự án trên trang quyết định ((b) + (p2)), dựng từ các phần đã duyệt (khung, thanh công cụ, tiêu đề, dòng và thanh phân trang của G1; hàng lọc và phễu của F1; thanh nhóm, hàng nhóm và tổng của R1; chế độ `row` của E2; màu Badge của §8). Chữ của grid và caption là tiếng Anh như mọi story trước; tên, ngày và số của các đơn Lumen là của mockup (`locale="vi-VN"`, VND). Mọi thứ đã phát hành vẽ y như trước.
- **`DataGrid` được export từ `src/index.ts` từ Task 4.**
  - Task 0–3: không gì của grid nằm trong `src/index.ts` (`src/index.test.ts` canh); mọi story của DataGrid (năm file) và `DataGrid.mdx` mang thẻ `unreleased`; tsdown có entry thứ hai `src/components/data-grid/index.ts`; test và story import từ `src/components/data-grid/`.
  - Từ Task 4: `src/index.ts` export `DataGrid`, `dataGridColumn` và mọi kiểu của `index.ts` của grid (`src/index.test.ts` đọc nguồn của hai entry); không story hay trang nào mang `unreleased`, và `.storybook/main.ts` không còn khối `tags`; tsdown chỉ còn entry `src/index.ts`. Story vẫn được import từ thư mục.
- **API đóng băng từ Task 1:** mọi tên công khai sau Task 1 là tên của `0.5.0`. Tên công khai mới chỉ đến từ Task 2 (`DataGridCsvOptions`, `csvExport`, `exportable`, `exportCsv`, `exportButton`, nhãn `exportCsv`). Một task muốn tên khác thì dừng và báo, không đổi tên.
- `DataGrid` dùng `forwardRef` (ép kiểu thành hàm generic), `ref` là `DataGridHandle`, nay mười một thành viên (`element`, `getState`, `focus`, `scrollToRow`, `clearFilter`, `expandAllGroups`, `collapseAllGroups`, `addRow`, `saveChanges`, `cancelChanges`, `exportCsv` ở Task 2). **Trạng thái sửa không phải trạng thái:** không bao giờ trong `getState()`, `onStateChange`, công thức hay CSV. Chỉ `src/components/data-grid/DataGrid.tsx` bắt đầu bằng `'use client'` trong grid; phần, hook, engine và context không có directive; `src/internal/download.ts` không có directive (nó được gọi từ một handler). Một file `.ts`/`.tsx` dưới `src/components/` là nguồn thư viện (`check:use-client` đòi file build của nó): dữ liệu và helper của story ở trong file story hay `.storybook/`; code của ví dụ ở `src/docs/data-grid-example/`.
- **Một quy tắc, một chỗ** (bài học PR #43, #45, #46): CSV đọc mọi trường qua `textOf` của grid, lớp bảo vệ duy nhất mà lúc vẽ dùng (không có lớp thứ hai); dòng đã lưu là `isSavedRow` và `savedRows`; ô trống là `isBlank`; một ngày là ngày ISO của `isoDayOf` (một hàm cho `toFilterKey`, `formatValue`, `rawText`); danh sách bản ghi nhãn là `LABEL_RECORDS`; hình chữ của mỗi control là `controlLabelsOf`; một lần tải là `downloadText`; nút và handle là một hàm (`exportCsv`); công thức của docs là component mà test chạy.
- Class CSS mới có trong `scripts/check-dist-css.ts`: `flg-data-grid-export-button` (Task 2), `flg-data-grid-group-hint` (Task 5). Không check tương phản mới; nhãn dòng 2 đổi trong `scripts/contrast-exceptions.ts`, bảng §4.9 của spec 0+1 và đoạn của `Accessibility.mdx` cùng nhau; `src/docs/ExceptionTable.test.tsx` vẫn 43 dòng.
- Cảnh báo dev đi qua `devWarn`, chỉ sau commit (StrictMode render hai lần), một lần cho mỗi prop, lời không chứa giá trị đổi theo mỗi lần render. Lib không throw khi người dùng dùng sai: một tuỳ chọn CSV ngoài tập giá trị là mặc định với một cảnh báo; `csvExport` lạ là tắt với một cảnh báo; storage ném lỗi trong công thức thì grid đi tiếp. Ngoại lệ có chủ đích (spec §6.3): một `format` hay `value` ném lỗi trên dòng đã lưu thì ném từ `exportCsv()`, như khi ô vẽ. Trang docs (`*.mdx`) viết bằng tiếng Anh, dòng văn ngắt ở 100 ký tự.
- **Không bộ máy nào chạy khi tính năng tắt:** không `csvExport` thì không nút xuất (mục `exportButton` là `null`); `exportCsv` của handle không làm gì cho tới khi được gọi; anchor tạm bị gỡ ngay, object URL được thu hồi bằng hẹn giờ của nó kể cả sau unmount.
- **Mọi callback có handler của nó** (bài học PR #42): một lần nhấn nút xuất tải đúng một lần; không gì được thông báo sau một lần xuất. Một lời hứa hay một giá trị trả về chỉ báo thành công khi đúng (bài học PR #46): kiểm tra "đã lưu" của fixture chờ dòng hiện giá trị đã lưu, không chờ một lần nhấn trả về; câu docs "trạng thái được khôi phục" đúng cho mọi phần nó kể.
- **Story không chờ bằng giây mặc định của `waitFor`** cho thứ một lần cập nhật hiển thị mang tới: mỗi lần chờ có thời hạn riêng và lời phân biệt trễ với mất. **Story không bao giờ đếm điều một loạt phím thật làm**; nó khẳng định điều loạt phím kết thúc ở đó. Story đưa con trỏ ra khỏi grid trước khi đọc một dòng đang nghỉ; một lần nhấn tìm theo chữ đi qua một cha có tên (vùng live có thể nói cùng chữ); story giao diện có popup giữ chỗ cho nó và khẳng định nó kết thúc trong stage (story giao diện của G không vẽ popup nào mở); cột của story giao diện vừa khung (hay, trên điện thoại, khung cuộn ngang). Story chạm `localStorage` xoá khoá trong `beforeEach` và `finally`; story tải file stub mọi thứ và trả lại trong `finally`, không bao giờ tải thật.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits, dùng `git commit -m "<subject>" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"`.
- **Không** publish npm bằng tay, **không** push lên `main`. `main` được bảo vệ (chỉ nhận PR, các check phải xanh): plan kết thúc bằng một PR từ `feat/phase-6-plan-g`. Nhánh đó cắt từ `8fb9ff8` (`main`: Plan F merge ở PR #46), nên PR mang chín commit của Plan G (Task 0–8) và file plan.
- **Changeset:** Plan G thêm `.changeset/phase-6-data-grid.md` (`minor`, Task 8), changeset duy nhất của giai đoạn 6. Merge PR của Plan G là một push lên `main`, nên workflow "Release" (`.github/workflows/release.yml`) chạy:
  - `changesets/action@v2` thấy changeset đang chờ, nên mở PR "Version Packages" (hoặc cập nhật PR đó nếu đã có). PR đó chạy `pnpm changeset version`: nâng `package.json` từ `0.4.0` lên `0.5.0`, ghi `CHANGELOG.md` và xoá file changeset. Lượt chạy này không publish gì.
  - Chỉ khi chủ dự án merge PR "Version Packages", lượt chạy sau của workflow mới chạy `pnpm release` (`pnpm build && changeset publish`): publish `0.5.0` lên npm qua trusted publishing (OIDC, có provenance, không token nào nằm trong repo), đẩy tag phiên bản và tạo GitHub release. Bản đó mang theo cả Plan A tới Plan G.
  - Merge PR "Version Packages" là quyết định publish của chủ dự án. Không ai trong plan này merge PR đó, chạy `changeset version`, `changeset publish` hay `npm publish`, hay cầm token npm.
- **Ngưỡng `size-limit`:**
  - Ngưỡng ban đầu (ở `8fb9ff8`): JS (all exports) 63820 B, JS (DataGrid) 105887 B, CSS 23054 B.
  - Chỉ Task 4 và Task 8 chạy `pnpm size:record` và commit `.size-limit.json`. Plan không chép số: `size:record` tự ghi ngưỡng. Task 0–3: `check:package` PASS với ngưỡng cũ. Task 4: trước lần ghi, `check:package` fail **chỉ** ở bước `size` ("JS (all exports)"); sau lần ghi PASS. Task 5–8: PASS.
  - Kết quả ở bản nháp: Task 4 ghi JS (all exports) 131571 B, JS (DataGrid) 107996 B, CSS 23064 B; Task 8 ghi 131571 B, 107996 B, 23079 B.
- Trước mọi lệnh `pnpm vitest run` chạy thẳng, chạy `pnpm gen:theme`: nó ghi các file trong `src/styles/generated/`, mà story cần. Lần chạy story đầu có thể fail với `Failed to import test file …` khi Vite tối ưu lại; chạy lại.
- **Không bao giờ chạy cả bộ story một lượt trên máy của chủ dự án** (máy thiếu bộ nhớ). Chạy từng thư mục một, từng project một và **từng trình duyệt một** (`--browser=chromium`, rồi `firefox`, rồi `webkit`), như các lệnh trong plan. Unit chạy với `--maxWorkers=3`. CI chạy cả bộ. Không chạy hai lượt story cùng lúc. Mọi lệnh dài chạy ở foreground, không bao giờ để chạy nền. Một lần chạy bị giết có thể để lại `chrome-headless-shell` hay `WebKitWebProcess` chạy: chỉ tắt những tiến trình do chính mình mở. Một lượt WebKit có thể xong mà để ống `pnpm` mở: ghi ra file thay vì ống.
- **Trình duyệt của Playwright:** nếu story hay fixture không khởi động được vì bộ nhớ đệm dùng chung của máy thiếu các bản repo ghim (`chromium-1243`, `firefox-1543`, `webkit-2359`), cài đúng các bản đó vào một thư mục riêng (không bao giờ vào bộ nhớ đệm dùng chung) và chạy mọi lượt story và fixture với `PLAYWRIGHT_BROWSERS_PATH` trỏ vào thư mục ấy (như Plan C–F).
- **Cổng 5173, 4173, 5174 và 4174 thuộc các app khác của chủ dự án**: không dùng, không tắt tiến trình đang giữ chúng. **Không chạy thẳng `pnpm test:fixtures`**: script ghim cổng 5173 và 4173. Chạy fixture bằng một bản sao tạm của `scripts/test-fixtures.mjs` với cổng đổi sang một cặp rảnh (kiểm trước bằng `netstat -ano | grep LISTENING`; 5179 / 4179 đã dùng được; không bao giờ 4173, 5173, 4174, 5174), sau `pnpm build`, rồi xoá bản sao, kể cả khi nó fail; không bao giờ commit bản sao, và sửa `scripts/test-fixtures.mjs` chính nó rồi chép lại sau mỗi lần sửa. Fixture Next.js dùng 3100 và 3101; nếu một cổng đang bị giữ thì dừng và báo. Storybook hay server tĩnh chạy tạm (ví dụ để chụp story) dùng cổng khác, và không được để chạy sót.
- **Không ảnh chuẩn nào ngoài 8 ảnh của `G1` và 16 ảnh mới của trang Examples được đổi.** Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh đến từ workflow "Update visual baselines" sau khi đẩy nhánh.
- Khi sửa file bằng script trên Windows, giữ xuống dòng LF. `pnpm format` sửa lại nếu lỡ ghi CRLF.
- Phải sang trái không được hỗ trợ (chủ dự án, 2026-11-09): dùng cạnh vật lý; một điểm chỉ của RTL là việc về sau.

**Cách áp patch.**
- Mọi file, kể cả file mới, được đưa dưới dạng patch (`git diff`). Lưu nguyên khối patch vào một file **ngoài** repo (ví dụ `../task.patch`), giữ LF, rồi chạy `git apply ../task.patch` ở gốc repo.
- Nếu `git apply` báo lỗi thì dừng lại và báo cáo: nghĩa là cây đang khác với cây mà plan đã chạy thử.
- Task 0 có một khối (test). Task 1–5 mỗi task hai khối, test rồi code; áp theo đúng thứ tự trong plan. Task 6, 7, 8 có một khối (code). Khối test chứa file `*.test.ts(x)`, `*.test-d.ts` và `*.stories.tsx` (cùng các helper chỉ story dùng, `.storybook/platform.ts` và `.storybook/data-grid-orders.tsx`, mà G không đổi). Khối code chứa mọi file khác, kể cả CSS, MDX, `tsdown.config.ts`, `.storybook/main.ts`, `.storybook/app-shell-demo.tsx`, các script, fixture, `README.md`, `package.json`, changeset và các dòng spec.
- Khối code của Task 1, 2, 3, 4 và 6 có dòng bắt đầu bằng ba dấu backtick (khối code trong `DataGrid.mdx`, `GettingStarted.mdx` và trong spec), nên chúng được rào bằng bốn dấu backtick. Nội dung patch là các dòng giữa hai hàng rào, như mọi khối khác.
- Các file nhiều task cùng sửa:
  - Task 1, 2: `types.ts`, `labels.ts`, `index.ts` của grid, `normalize.ts`, `DataGrid.tsx`, `parts/toolbar-content.tsx`, `DataGrid.test-d.ts`. Task 1, 2, 3, 4, 7, 8: spec giai đoạn 6. Task 1–5: `DataGrid.mdx`.
  - Task 2, 4: `DataGridColumns.stories.tsx`, `DataGridEditing.stories.tsx`, `DataGridFiltering.stories.tsx`. Task 2, 4, 5: `DataGridGrouping.stories.tsx`. Task 3, 4: `DataGrid.stories.tsx`.
  - Task 2, 5: `src/styles/components/data-grid.css`, `scripts/check-dist-css.ts`. Task 2, 6: `src/docs/Accessibility.mdx`. Task 6, 8: `src/docs/GettingStarted.mdx`. Task 7, 8: `scripts/test-fixtures.mjs`.
  - Patch đã tính sẵn điều đó nếu áp đúng thứ tự.
- Plan G không xoá file nào. `.size-limit.json` không có trong patch nào: Task 4 và Task 8 ghi lại nó bằng `pnpm size:record`. `src/styles/generated/*.css` không có trong patch nào (git bỏ qua): `pnpm gen:theme` sinh chúng.

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý. Mỗi dòng có test ở task tương ứng, trừ chỗ ghi rõ là chưa có:

1. **CSV của một grid đã nhóm, lọc và sắp xếp, có một cột ẩn, một cột `exportable: false`, một dòng chờ xoá ở chế độ batch và một ô bắt đầu bằng `=`.** File là: BOM; hàng tiêu đề gồm các cột dữ liệu đang hiện theo thứ tự bố cục (trái ghim, giữa, phải ghim), cột đang nhóm ở chỗ của nó như thể đang hiện, không có cột ẩn, cột `exportable: false` hay cột phục vụ nào, caption được bọc và chặn công thức như một trường; rồi một bản ghi cho mỗi dòng đã lưu còn lại sau tìm kiếm và lọc, phẳng theo thứ tự các nhóm (dòng của nhóm đóng có mặt, không hàng nhóm, không tổng, không chi tiết), mọi trang; dòng chờ xoá có mặt với giá trị đã lưu ở chỗ grid vẽ nó, ô đã sửa chưa lưu ghi giá trị đã lưu, dòng mới không có; ô chữ `=SUM(A1)` của cột `string` hay lookup thành `'=SUM(A1)` (rồi được bọc nếu cần), một số âm không bị chặn; mỗi bản ghi kết thúc bằng CRLF, kể cả bản cuối. Test:
   - Task 2: `DataGrid.csv.test.tsx` `the rows > writes a grouped grid flat, in the order of its groups, with no group row and the rows of a closed group`, `writes only the rows the conditions of a column keep`, `writes the rows in the order of the sort`, `writes the rows of every page, not the ones of the page shown`; `the columns > writes the shown columns in the order drawn, and leaves a hidden one out`, `writes a column at its place in the layout when it is grouped, as if it were shown`, `puts a column pinned to the right last and a column pinned to the left first`, `leaves out a column that says exportable false, and keeps one whose value is not a boolean`, `quotes and guards a caption as it does a field`; `the values > guards a text that starts like a formula in a string column and a lookup, and not a number`; `what is not saved, and what is not a row > writes a row marked for deletion, with its saved values`, `writes the saved value of a cell with a change that is not saved`, `writes no new row, even with values typed in it`; `engine/csv.test.ts` (`csvField`, `toCsv`: CRLF, BOM, chặn công thức); `engine/pipeline.test.ts` `createPipeline savedRows`.
   - Chỗ hở đã biết: mỗi điều có ca riêng; chưa ca nào gộp tất cả trong một grid. Một `format` hay `value` ném lỗi trên dòng đã lưu ném từ `exportCsv()` (như khi ô vẽ), docs và JSDoc nói vậy, nhưng không test nào ghim nó (ô cũng fail khi vẽ, nên test không tới được nếu không stub ô).
2. **Công thức lưu trạng thái: một bố cục đã lưu được đọc lại sau khi một cột bị bỏ và một cột được thêm, một giá trị đã lưu không phải JSON, và một storage ném lỗi.** Grid vẽ trạng thái mặc định ở server và lần render đầu, đọc storage trong một effect và mount lại một lần; id của cột đã mất bị bỏ, cột mới được nối, mục sắp xếp, nhóm và lọc của trường grid không có ở lại trong `getState()` mà không làm gì, không một lời cảnh báo; văn bản không phải JSON là mặc định không cảnh báo; trạng thái sai dạng là mặc định với một cảnh báo mỗi prop; `getItem` hay `setItem` ném lỗi thì grid đi tiếp; một lần sửa không gọi `onStateChange`. Test:
   - Task 3: `saved-state.test.tsx` `the saved-state recipe > takes a column that is gone, and one that is new, without a word`, `is the default for text that is no JSON, and throws nothing`, `is the default sort, with one shape warning, for a state of the wrong shape`, `goes on when the storage throws, on a read and on a write`, `keeps the sort, grouping and filter of a field the grid lacks in the state it gives back`, `calls no onStateChange for an edit, and the state has exactly the eight parts`, `renders on the server the HTML of the default grid` (cả hai bản React); story `SavedState` (ba engine, `localStorage` thật).
   - Task 5: story `ExampleSavedState` (khoá theo lớp bố cục).
   - Chỗ hở đã biết: mọi ca là đặc tả, không kiểm đột biến nào; story `SavedState` dùng khoá và dữ liệu riêng (không phải khối nguyên văn).
3. **Một app Next.js import `DataGrid` từ gốc gói trong một trang server.** Trang Server Component đưa dữ liệu thuần cho một Client Component bọc grid; HTML của server có `role="treegrid"`, `aria-sort`, tên từ caption, đơn đầu và một hàng nhóm; hydrate không cảnh báo; export của `dist/index.js` là tham chiếu client; một trang không import grid không tải JS của nó. Test:
   - Task 4: `scripts/rsc-probe.mjs` ca "DataGrid is a client component: a Server Component that renders it hands it to the client" (`pnpm check:rsc`, trong `check:package`); `src/index.test.ts` `exports every name the DataGrid folder exports, values and types alike`.
   - Task 7: `scripts/test-fixtures.mjs` `checkGridHtml` (Next.js), `checkGrid` (cả hai app, server dev và production), `checkTreeShaking` (server production, đối chứng dương trên trang grid rồi trang chính).
   - Chỗ hở đã biết: fixture chỉ chạy Chromium (lần tải thật trong WebKit không chạy); tree-shaking chỉ kiểm ở server production (server dev của Vite bundle trước cả gói); Next.js đo không có `optimizePackageImports`, ở phiên bản của fixture.
4. **Trang Examples trên điện thoại.** Server và lần render đầu của hydrate vẽ bố cục rộng; trên client media query `(max-width: 639px)` nói điện thoại, grid mang key là lớp bố cục nên mount lại với bố cục điện thoại: Order, Customer, Status, Total, không ghim gì, sắp theo Order; trạng thái đã lưu của bố cục rộng không được đọc ở điện thoại (khoá riêng mỗi lớp). Test:
   - Task 5: story `DataGridExamplePhone` (đặt cửa sổ 390×844 và chờ grid của điện thoại mount: không Assignee; bốn tiêu đề; `aria-sort` trên Order; không `[data-pinned]`; khung cuộn ngang; lề 16px; thẻ trong stage), `ExampleSavedState` (sắp xếp của bố cục rộng nằm dưới khoá rộng, khoá điện thoại trống), `DataGridExample` (bố cục rộng).
   - Chỗ hở đã biết: không test nào render `OrdersGrid` trên server (ảnh chụp "rộng" của server đọc từ code); không story nào đổi cửa sổ qua lại 640px khi grid đang có trạng thái; không story nào khẳng định grid điện thoại bỏ qua một khoá rộng đã có (khoá riêng là do cấu trúc); chưa thử trên điện thoại thật; thanh công cụ bốn hàng và thanh phân trang ba hàng như grid đã làm.
5. **Một app `vi-VN` đưa `labels.controls`.** Chữ tới DatePicker (nút lịch, hộp thoại lịch, hai nút tháng, lỗi "ngày không hợp lệ" và "ngày không dùng được"), NumberInput (hai nút bước), Combobox ("không có kết quả" và số kết quả được nói) trong trình sửa, DatePicker của ô lọc và của hai đầu khoảng, SearchField của thanh công cụ và của lọc ở header (nút xoá); không có `labels` thì mỗi tên là mặc định của control; chữ đưa một phần giữ chín chữ còn lại. Test:
   - Task 1: `DataGrid.controls-words.test.tsx` (khối `controls named by the defaults of the controls` và `controls named by the words of the labels`: `names the calendar button of a date editor, its dialog and its month buttons`, `says the date editor faults in its words`, `names the calendar button of the date filter cell`, `names the calendar buttons of the two ends of a between editor`, `names the steppers of a number editor`, `says "no results" and the count of a Combobox editor in its words`, `names the clear button of the toolbar search`, `names the clear button of the search of a header filter`; cả hai bản React); `labels.test.ts` `the controls record > keeps the other nine words when the caller gives one`, `is handed to each control in the shape that control takes, whole`; `sameLabels > compares the controls record by its words`; `DataGrid.test-d.ts` `the names frozen for 0.5.0: the summary type, the controls words and one Cancel`.
   - Chỗ hở đã biết: không story nào chạy các chữ này trong trình duyệt thật; không test số lần render nào chứng minh các object nhãn được làm một lần (một `useMemo`, lo ngại của `task-1-report.md`); cửa sổ lịch của trình sửa và ô lọc dùng cùng `chooseDate` cho nút và hộp thoại.

Các chỗ **chỉ story hay fixture bắt được**: nút xuất ngay sau nút chọn cột, 34×34, không gì xuống hàng (`G1`, `CsvExport`); tooltip "Export CSV" khi hover và một lần tải với BOM trong engine thật (`CsvExport`, `ExampleExport`); `localStorage` thật và lần mount lại (`SavedState`, `ExampleSavedState`); thanh nhóm trống gói chữ cạnh icon ở 240px (`GroupPanelHintWraps`); bố cục của trang Examples ở 1280×720 và 390×844, lề 16px, năm chế độ sửa, lần lưu và lần xuất trong engine thật (sáu story của `DataGridExample.stories.tsx`); phím Esc trong frame có focus (`WhileANonModalOverlayHasFocus`); HTML của server, hydrate, lần tải thật và tree-shaking ở Next.js và Vite (fixture). jsdom không có layout; unit test giả lập kích thước, `URL.createObjectURL`, `matchMedia` và bộ đếm giờ.

**Để lại cho review cuối** (không phải lỗi phải sửa trong một task; review cuối của nhánh quyết, và mô tả PR nêu những gì còn lại):
- Không test số lần render nào đếm memo của các object nhãn của control; `allowEditing` theo lớp bảo vệ của `canEdit` (ném lỗi là `false`) chứ không theo `readOfRow` (ném lỗi là trống); các ca mới của `labels.test.ts` và `index.exports.test.ts` viết sau code (`task-1-report.md`).
- Lời cảnh báo của `exportCsv` khi một tuỳ chọn của lời gọi ngoài tập giá trị nói "<mặc định> is used", trong khi giá trị của `csvExport` mới là cái được dùng nếu prop có đặt tuỳ chọn đó (`progress.md`, Task 2).
- Ngưỡng hiệu năng formatted 30 ms sát cho một CI bận; story `CsvExport` không fail trước; `exportCsv` gọi trước lần commit đầu không có gì để đọc (chỉ tới được qua một ref callback tuỳ biến); một `format` / `value` ném lỗi trên dòng đã lưu ném từ `exportCsv`, không test nào ghim (`task-2-report.md`).
- Câu "hai điểm khác" của dòng spec §6.3 về công thức viết lỏng; không kiểm đột biến nào cho 11 ca đặc tả (`task-3-report.md`).
- Bộ phân tích nguồn của `src/index.test.ts` chỉ thấy khối `export { … }` và `export type { … }`; nút `Components/DataGrid` của sidebar vừa là trang vừa là thư mục (đã đo, giữ) (`task-4-report.md`).
- Điện thoại sắp theo Order thay vì ngày; thanh công cụ bốn hàng, thanh phân trang ba hàng; `usePhone` chép 640 của Dialog vì không hằng chung nào công khai (`task-5-report.md`); quy tắc lề 16px của decorator áp cả trang khi xem ở chế độ Docs dưới 640px (`fixups-g1f1-g1f3-report.md`).
- Câu "một Dialog modal chứa grid không làm grid im lặng" chưa chạy trong một Dialog; mẫu `RemoteOrders` chỉ biên dịch, không chạy với server; phím viết bằng chữ thường trên trang Accessibility (`task-6-report.md`).
- Fixture chỉ chạy Chromium: lần tải thật trong WebKit không chạy (`task-7-report.md`, brief Task 2).
- Changeset nêu bốn token, không phải ba; câu kích thước của README viết lại ngoài số đếm; Task 8 chỉ chạy story ở một engine làm lượt cuối (`task-8-report.md`).
- Ảnh forced colours và contrast-more của nút xuất (`G1`) và của trang Examples (Badge, Avatar) chỉ đến từ CI; Claude quét ảnh forced colours của mọi story giao diện mới hay đổi tìm màu của theme trước khi xin review.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/components/tooltip/Tooltip.stories.tsx` | `WhileANonModalOverlayHasFocus` focus frame trước Esc và nói điều nó thấy (Task 0) |
| `src/components/data-grid/types.ts`, `labels.ts`, `index.ts`, `normalize.ts` | Tên đóng băng, bản ghi `controls`, `cancel`, `DataGridSummary`, `ControlLabels`, `controlLabelsOf`, JSDoc (Task 1); `DataGridCsvOptions`, `csvExport`, `exportable`, `exportCsv`, `exportButton`, nhãn `exportCsv`, `csvOptionsOf` (Task 2) |
| `src/components/data-grid/DataGrid.tsx`, `grid-context.ts`, `hooks/use-grid-context-value.ts` | `controlLabels` làm một lần cho mỗi `labels` (Task 1); `exportCsv` của handle, nút xuất (Task 2) |
| `src/components/data-grid/parts/editors/CellEditor.tsx`, `FilterCell.tsx`, `BetweenEditor.tsx`, `SearchBox.tsx`, `HeaderFilter.tsx`, `toolbar-content.tsx` | Chữ của các control (Task 1); mục `exportButton` (Task 2) |
| `src/components/data-grid/parts/ConfirmDelete.tsx`, `EditForm.tsx`, `EditPopup.tsx` | `labels.cancel` (Task 1) |
| `src/components/data-grid/engine/summary.ts`, `column-menu.ts`, `columns.ts`, `layout.ts`, `hooks/use-grid-summary.ts`, `hooks/use-renewal-warning.ts` | Tên `DataGridSummary`, chữ cũ (Task 1) |
| `src/components/data-grid/engine/csv.ts`, `values.ts`, `pipeline.ts`, `hooks/use-csv-export.ts`, `hooks/use-normalized-props.ts`, `parts/ExportButton.tsx` | CSV: `toCsv`, `csvField`, `csvColumns`, `rawText`, `savedRows`, `useCsvExport`, nút (Task 2) |
| `src/internal/download.ts`, `src/internal/icons.tsx` (và test) | `downloadText`, `DownloadIcon` (Task 2) |
| `src/styles/components/data-grid.css`, `scripts/check-dist-css.ts` | Nút xuất (Task 2); thanh nhóm trống, `flg-data-grid-group-hint` (Task 5) |
| `scripts/contrast-exceptions.ts`, spec 0+1 §4.9, `src/docs/Accessibility.mdx` | Nhãn dòng 2 (Task 2); mục "The data grid" (Task 6) |
| `src/components/data-grid/DataGrid.mdx` | Labels, Props, Handle, "Adding rows" (Task 1); "CSV export", Toolbar (Task 2); "Saving the state" (Task 3); phần mở đầu, import từ `'h2d-glass-ui'` (Task 4); "Do and don't" (Task 5, G1F3) |
| `src/components/data-grid/DataGrid.controls-words.test.tsx`, `DataGrid.newrow-callbacks.test.tsx`, `index.exports.test.ts`, `labels.test.ts`, `DataGrid.summary.test.tsx`, `DataGrid.test-d.ts` | Test của Task 1 |
| `src/components/data-grid/DataGrid.csv.test.tsx`, `engine/csv.test.ts`, `engine/values.test.ts`, `engine/pipeline.test.ts`, `engine/perf.test.ts`, `DataGrid.chooser.test.tsx`, `DataGrid.renders.test.tsx`, `DataGrid.loading.test.tsx`, `columns.test-d.ts`, `src/internal/download.test.ts`, `src/internal/icons.test.tsx` | Test của Task 2 |
| `src/components/data-grid/saved-state.test.tsx` | Công thức lưu trạng thái (Task 3) |
| `src/components/data-grid/DataGrid*.stories.tsx` | `G1`, `CsvExport`, chú thích (Task 2); `SavedState` (Task 3); bỏ `unreleased` (Task 4); `GroupPanelHintWraps` (Task 5) |
| `src/index.ts`, `src/index.test.ts`, `tsdown.config.ts`, `.storybook/main.ts`, `scripts/rsc-probe.mjs` | Grid ra gốc gói, một entry, không thẻ `unreleased`, ca `rsc` (Task 4) |
| `src/docs/data-grid-example/` (`OrdersGrid.tsx`, `columns.tsx`, `orders.ts`), `src/docs/DataGridExample.mdx`, `src/docs/DataGridExample.stories.tsx` | Trang "Examples/Data grid" (Task 5) |
| `src/docs/GettingStarted.mdx` | Mục "Data grid" (Task 6); câu giai đoạn 6 của phần mở đầu (Task 8) |
| `fixtures/next-app/app/grid/`, `fixtures/vite-app/grid.html`, `fixtures/vite-app/src/grid-main.tsx`, `fixtures/vite-app/src/GridPage.tsx`, `fixtures/vite-app/vite.config.ts`, `scripts/test-fixtures.mjs` | Trang grid, kịch bản, tree-shaking (Task 7); nhãn "Phase 6:" (Task 8) |
| `.changeset/phase-6-data-grid.md`, `README.md`, `package.json`, `.storybook/app-shell-demo.tsx` | Changeset `0.5.0`, số đếm và danh sách component, câu kích thước, chú thích (Task 8) |
| `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md` | Các dòng sửa khi lập Plan G (Task 1, 2, 3, 4, 7, 8) |
| `.size-limit.json` | Ngưỡng mới (Task 4, Task 8, `pnpm size:record`) |

---

### Task 0: story Tooltip `WhileANonModalOverlayHasFocus`: focus frame trước mỗi Esc và nói điều nó thấy

Một commit chỉ sửa story, làm trước mọi task của G (phát hiện 1, 3). Bắt đầu từ `8fb9ff8`.
- **Điều đã fail trên `main`:** CI của `main` trên `8fb9ff8` (run 45865670552) đỏ ở `storybook-dark` WebKit, story `WhileANonModalOverlayHasFocus` của `Tooltip.stories.tsx`: "expected true to be false", tooltip còn mở sau Esc, dù có các lần chờ 3 giây của `dc4cf44` (nên không phải chậm). Lượt 1 của CI PR #46 fail y vậy; chạy lại job thì xanh: story lỗi chập chờn, 2 trong 5 lượt CI.
- **Không tái hiện được:** WebKit trên Windows (story một mình 6 lần, cả file 4 lần, đều pass); WebKit x86 trên `oracle-vps`, Playwright đi đúng các bước của story trên bản Storybook tĩnh: 12 / 12 pass, Esc đóng tooltip mỗi lần. Log của CI chỉ có cây DOM.
- **Vì sao sửa như vậy:** story đặt focus bằng script (`el.focus()` trên "Save note" rồi "Pin"), và lệnh phím của vitest chỉ gọi `window.focus()` khi `activeElement` là `body`. Nếu frame của test mất focus của frame, phím Esc được nhấn ở chỗ khác. Giả thuyết này là cái còn lại sau các lần thử trên.
- **Sửa:** hàm `escapeFrom(name)` gọi `window.focus()`, focus nút được gọi tên, rồi nhấn `{Escape}`; một listener `keydown` (capture) đếm các lần Esc trang thấy; lời fail của hai lần chờ nói số lần Esc đã thấy, `document.hasFocus()` và chữ của phần tử đang có focus; `panel.showPopover()` vào trong `try`, `finally` gỡ listener và chỉ ẩn panel khi nó đang mở. Nếu story fail lần nữa, lời fail phân biệt được "phím không tới trang" với "phím tới mà tooltip không đóng".
- Không code thư viện, không ảnh chuẩn (story `no-visual`), không id story nào đổi. Mọi khẳng định khác của story giữ nguyên.

**Files:**
- Modify: `src/components/tooltip/Tooltip.stories.tsx` (story `WhileANonModalOverlayHasFocus`)

**Interfaces:**
- Không thêm gì. Story giữ tên, thẻ và các bước (hover, Esc trong một Dialog không modal, Esc trong một popover thủ công); chỉ cách nhấn Esc và lời fail đổi.

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/tooltip/Tooltip.stories.tsx b/src/components/tooltip/Tooltip.stories.tsx
index e09a955..48091ff 100644
--- a/src/components/tooltip/Tooltip.stories.tsx
+++ b/src/components/tooltip/Tooltip.stories.tsx
@@ -623,25 +623,40 @@ export const WhileANonModalOverlayHasFocus: Story = {
     const trigger = canvas.getByRole('button', { name: 'Settings' });
     const tip = canvas.getByRole('tooltip', { hidden: true });
     const dialog = canvas.getByRole('dialog', { name: 'Notes' }) as HTMLDialogElement;
-    await real.hover(trigger);
-    await waitFor(() => expect(isOpen(tip)).toBe(true), EVENTUALLY);
-    canvas.getByRole('button', { name: 'Save note' }).focus();
-    await real.keyboard('{Escape}');
-    await waitFor(() => expect(isOpen(tip)).toBe(false), EVENTUALLY);
-    await expect(dialog.open).toBe(true);
-    // The same with focus in a manual popover. The pointer leaves the trigger and comes back first.
+    // What the page saw of each Esc, for the message of a failure: this story failed twice in CI's
+    // WebKit with the tooltip still open, and never on a machine that could be watched.
+    let escapes = 0;
+    const countEscape = (event: KeyboardEvent) => {
+      if (event.key === 'Escape') escapes += 1;
+    };
+    const seen = () =>
+      `the tooltip closes on Esc (Esc keydowns seen: ${escapes}, the frame has focus: ${document.hasFocus()}, focus on: ${document.activeElement?.textContent ?? 'none'})`;
+    // Focus is put in place by script, so the keyboard of the test focuses no frame (it does so only when
+    // nothing has focus): this frame is focused first, so the key cannot go to another one.
+    const escapeFrom = async (name: string) => {
+      window.focus();
+      canvas.getByRole('button', { name }).focus();
+      await real.keyboard('{Escape}');
+    };
+    document.addEventListener('keydown', countEscape, true);
     const panel = canvas.getByTestId('panel');
-    panel.showPopover();
     try {
+      await real.hover(trigger);
+      await waitFor(() => expect(isOpen(tip)).toBe(true), EVENTUALLY);
+      await escapeFrom('Save note');
+      await waitFor(() => expect(isOpen(tip), seen()).toBe(false), EVENTUALLY);
+      await expect(dialog.open).toBe(true);
+      // The same with focus in a manual popover. The pointer leaves the trigger and comes back first.
+      panel.showPopover();
       await real.hover(canvas.getByRole('button', { name: 'Save note' }));
       await real.hover(trigger);
       await waitFor(() => expect(isOpen(tip)).toBe(true), EVENTUALLY);
-      canvas.getByRole('button', { name: 'Pin' }).focus();
-      await real.keyboard('{Escape}');
-      await waitFor(() => expect(isOpen(tip)).toBe(false), EVENTUALLY);
+      await escapeFrom('Pin');
+      await waitFor(() => expect(isOpen(tip), seen()).toBe(false), EVENTUALLY);
       await expect(isOpen(panel)).toBe(true);
     } finally {
-      panel.hidePopover();
+      document.removeEventListener('keydown', countEscape, true);
+      if (panel.matches(':popover-open')) panel.hidePopover();
     }
   },
 };
```

- [ ] **Step 2: Chạy story, xác nhận nó pass (lỗi của CI không tái hiện được)**

Không có code để viết, và không có bước đỏ / xanh: lỗi chỉ gặp ở CI (2 trong 5 lượt), không trên máy nào xem được (phát hiện 3). Chạy file story ở đúng tổ hợp CI đã fail:

```bash
pnpm gen:theme
pnpm vitest run --project storybook-dark --browser=webkit src/components/tooltip/Tooltip.stories.tsx
```

Expected:
- PASS, 14 story, `WhileANonModalOverlayHasFocus` trong số đó.
- Bằng chứng của task là lượt pass ở cả ba engine (Step 4) và lời fail mới: nếu CI gặp lại lỗi, lời đó nói số lần Esc trang thấy, `document.hasFocus()` và phần tử có focus.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
for b in chromium firefox webkit; do
  pnpm vitest run --project storybook-light --browser=$b src/components/tooltip
  pnpm vitest run --project storybook-dark --browser=$b src/components/tooltip
done
```

Expected:
- `lint`, `typecheck`, `format:check`: PASS.
- Story tooltip: 14 PASS ở mỗi lượt (sáu lượt). Ở bản nháp Claude chạy đúng sáu lượt này (bản ghi `tooltip-runs.txt`).
- Unit, build, `check:package` không chạy: không code thư viện nào đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  src/components/tooltip/Tooltip.stories.tsx
```
```bash
git commit -m "test(tooltip): WhileANonModalOverlayHasFocus focuses its frame before Esc and says what it saw" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 1: đóng băng API trước `0.5.0`: chữ của các control, một nút Cancel, `DataGridSummary`

Spec §6.1, §6.3 (khối interface, bảng nhãn, "Thêm dòng"), §8 `DataGrid.mdx`. Không có mockup: không pixel nào dời. Bắt đầu từ commit của Task 0.
- **Bản ghi nhãn `controls`** (OQ 2 (b), FZ2): mười khoá, mặc định là chữ mặc định của chính control; `controlLabelsOf` chuyển nó thành hình `labels` của DatePicker, NumberInput, Combobox và SearchField; `DataGrid.tsx` làm nó một lần cho mỗi `labels` và đưa nó qua context tới trình sửa ô, ô lọc, hai đầu khoảng, lọc ở header và ô tìm kiếm (phát hiện 6).
- **Tên** (OQ 3, 4; FZ3): `DataGridSummaryProp` → `DataGridSummary`; khoá `cancelButton` bỏ, `cancel` là mọi nút Cancel (popover lọc, hộp hỏi trước khi xoá, form, popup).
- **Dòng mới** (OQ 5 (a), FZ4): `TRow` giữ nguyên; JSDoc của mỗi hàm của app nói nó có gặp dòng mới không, và lần ném lỗi trên dòng mới được bắt và cảnh báo một lần (đã có từ Plan F; test đặc tả mới).
- **Chữ cũ và mặc định** (FZ1): JSDoc, chú thích và các mặc định còn thiếu (phát hiện 5); không mặc định nào khác nhau giữa code, JSDoc, MDX và spec.
- **Kiểu export đủ** (OQ 6 (a), FZ5): `index.exports.test.ts`; `DataGridColumnBase` là ngoại lệ duy nhất.
- **Spec và docs khớp nhau** (FZ6): khối interface và bảng nhãn của §6.3 (phát hiện 21); bảng Labels, Props, Handle và mục "Adding rows" của `DataGrid.mdx`.
- Không đổi hành vi nào ngoài chữ của các control; không gì trong `src/index.ts`; không story, không CSS, không ảnh chuẩn.

**Files:**
- Create: `src/components/data-grid/DataGrid.controls-words.test.tsx`, `DataGrid.newrow-callbacks.test.tsx`, `index.exports.test.ts`
- Modify: `src/components/data-grid/DataGrid.tsx`, `types.ts`, `index.ts`, `labels.ts`, `labels.test.ts`, `normalize.ts`, `grid-context.ts`, `DataGrid.mdx`, `DataGrid.summary.test.tsx`, `DataGrid.test-d.ts`, `engine/column-menu.ts`, `engine/columns.ts`, `engine/layout.ts`, `engine/summary.ts`, `hooks/use-grid-context-value.ts`, `hooks/use-grid-summary.ts`, `hooks/use-renewal-warning.ts`, `parts/BetweenEditor.tsx`, `parts/ConfirmDelete.tsx`, `parts/EditForm.tsx`, `parts/EditPopup.tsx`, `parts/FilterCell.tsx`, `parts/HeaderFilter.tsx`, `parts/SearchBox.tsx`, `parts/editors/CellEditor.tsx`, `parts/toolbar-content.tsx`; `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`

**Interfaces:**
- Produces trong `types.ts` (export qua `data-grid/index.ts`; ra gốc gói ở Task 4), các tên của `0.5.0`:
  - `DataGridSummary<TRow>` = `{ total?: …; group?: … }` (thay `DataGridSummaryProp<TRow>`, không còn tên cũ).
  - `DataGridLabels['controls']`: `chooseDate`, `invalidDate`, `unavailableDate`, `previousMonth`, `nextMonth`, `increase`, `decrease`, `noResults`, `results(count: number)`, `clearSearch`; `DataGridLabelsInput['controls']?: Partial<…>`.
  - `DataGridLabels.cancel` là mọi nút Cancel; `cancelButton` không còn.
- Nội bộ:
  - `labels.ts`: `LABEL_RECORDS` = `['operators', 'panelOperators', 'summary', 'validation', 'controls']`; `ControlLabels { date: DatePickerLabels; number: { increment; decrement }; combobox: { noResults; results }; search: { clear } }`; `controlLabelsOf(controls: DataGridLabels['controls']): ControlLabels`.
  - `GridContextValue.controlLabels` (`grid-context.ts`, `hooks/use-grid-context-value.ts`); `SearchBox` nhận prop `labels`; `toolbarContent` nhận tuỳ chọn `controlLabels`; `useSummaryWarning` nhận `DataGridSummary<TRow>`.
- Consumes: `labels` của `DatePicker`, `NumberInput`, `Combobox`, `SearchField` (mặc định của chúng không đổi); `withDefaults`, `mergeLabels`, `sameLabels`; `readOfRow`, `canEdit`, `isSavedRow` của Plan F.
- Task sau dùng: Task 2 (khoá nhãn `exportCsv` vào cùng bản ghi gốc, mục `exportButton`, `toolbarContent`), Task 4 (export `DataGridSummary` và mọi kiểu ra gốc gói), Task 5–8 (docs, ví dụ, fixture, changeset viết theo các tên này).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/data-grid/DataGrid.controls-words.test.tsx b/src/components/data-grid/DataGrid.controls-words.test.tsx
new file mode 100644
index 0000000..ad7911c
--- /dev/null
+++ b/src/components/data-grid/DataGrid.controls-words.test.tsx
@@ -0,0 +1,217 @@
+import { act, fireEvent, render, screen, within } from '@testing-library/react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { DataGrid } from './DataGrid';
+import type { DataGridColumn, DataGridLabels, DataGridProps } from './index';
+
+// The words of the controls the grid draws (spec phase 6 §6.3 "Nhãn", the record `controls`): the DatePickers
+// of the cell editor, of the filter cell and of the `between` editor, the NumberInput and the Combobox of the
+// editor, and the SearchFields of the toolbar and of the header filter. Each says the grid's words, and the
+// component's own when the grid is given none. What a layout engine decides is in the stories.
+
+// Which popovers are showing: jsdom has no Popover API.
+let showing: Set<Element>;
+beforeEach(() => {
+  resetDevWarnings();
+  // jsdom's document has no focus once an input is blurred, which a DatePicker would read as a window switch.
+  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
+  showing = new Set();
+  HTMLElement.prototype.checkVisibility = () => true;
+  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
+    showing.add(this);
+  };
+  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
+    showing.delete(this);
+  };
+  Element.prototype.scrollIntoView = () => {};
+  const matches = Element.prototype.matches;
+  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
+    this: Element,
+    selector: string,
+  ) {
+    return selector === ':popover-open' ? showing.has(this) : matches.call(this, selector);
+  });
+});
+afterEach(() => {
+  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
+  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
+  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
+  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
+  vi.restoreAllMocks();
+});
+
+interface Order {
+  id: string;
+  customer: string;
+  status: number | null;
+  qty: number | null;
+  placed: string | null;
+}
+
+const STATUSES = [
+  { id: 1, name: 'New' },
+  { id: 2, name: 'Processing' },
+  { id: 3, name: 'Delivered' },
+];
+
+const ORDERS: Order[] = [
+  { id: 'DH-1', customer: 'An', status: 1, qty: 3, placed: '2026-11-05' },
+  { id: 'DH-2', customer: 'Bình', status: 2, qty: 5, placed: '2026-11-06' },
+];
+
+const COLUMNS: DataGridColumn<Order>[] = [
+  { field: 'id', caption: 'Order', rowHeader: true, allowEditing: false, width: 100 },
+  { field: 'customer', caption: 'Customer', width: 140 },
+  {
+    field: 'status',
+    caption: 'Status',
+    width: 140,
+    // `searchable` makes it a Combobox whatever the number of items.
+    lookup: { items: STATUSES, valueField: 'id', displayField: 'name', searchable: true },
+  },
+  { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 },
+  { field: 'placed', caption: 'Placed', dataType: 'date', width: 150 },
+];
+
+function Orders(props: Partial<DataGridProps<Order>>) {
+  return (
+    <DataGrid
+      data={ORDERS}
+      rowKey="id"
+      columns={COLUMNS}
+      caption="Orders"
+      paging={false}
+      onSaving={() => {}}
+      {...props}
+    />
+  );
+}
+
+const DEFAULTS = {
+  chooseDate: 'Choose date',
+  invalidDate: 'Invalid date',
+  unavailableDate: 'This date is not available',
+  previousMonth: 'Previous month',
+  nextMonth: 'Next month',
+  increase: 'Increase',
+  decrease: 'Decrease',
+  noResults: 'No results',
+  results: (count: number) => (count === 1 ? '1 result' : `${count} results`),
+  clearSearch: 'Clear search',
+};
+
+const VIETNAMESE: DataGridLabels['controls'] = {
+  chooseDate: 'Chọn ngày',
+  invalidDate: 'Ngày không hợp lệ',
+  unavailableDate: 'Không chọn được ngày này',
+  previousMonth: 'Tháng trước',
+  nextMonth: 'Tháng sau',
+  increase: 'Tăng',
+  decrease: 'Giảm',
+  noResults: 'Không có kết quả',
+  results: (count) => `${count} kết quả`,
+  clearSearch: 'Xoá tìm kiếm',
+};
+
+const click = (element: HTMLElement) => act(() => element.click());
+/** The animation frame and the timers a control uses to say something. */
+const aTaskLater = (ms = 0) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
+const editedRow = () => document.querySelector<HTMLTableRowElement>('tr[data-editing]')!;
+const startEdit = (name: string) => click(screen.getByRole('button', { name: `Edit ${name}` }));
+const popover = () => document.querySelector<HTMLElement>('.flg-data-grid-filter-popover')!;
+
+describe.each([
+  ['the defaults of the controls', undefined, DEFAULTS],
+  ['the words of the labels', VIETNAMESE, VIETNAMESE],
+] as const)('controls named by %s', (_name, given, words) => {
+  const labels = given === undefined ? undefined : { controls: given };
+
+  it('names the calendar button of a date editor, its dialog and its month buttons', () => {
+    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
+    startEdit('DH-1');
+    const button = within(editedRow()).getByRole('button', { name: words.chooseDate });
+    click(button);
+    const dialog = editedRow().querySelector<HTMLElement>('.flg-date-picker-popup')!;
+    expect(dialog).toHaveAttribute('aria-label', words.chooseDate);
+    expect(
+      within(dialog).getByRole('button', { name: words.previousMonth, hidden: true }),
+    ).toBeInTheDocument();
+    expect(
+      within(dialog).getByRole('button', { name: words.nextMonth, hidden: true }),
+    ).toBeInTheDocument();
+  });
+
+  it('says the date editor faults in its words', () => {
+    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
+    startEdit('DH-1');
+    const input = within(editedRow()).getByLabelText('Placed') as HTMLInputElement;
+    act(() => void fireEvent.change(input, { target: { value: 'abc' } }));
+    act(() => void fireEvent.blur(input));
+    expect(editedRow().querySelector('.flg-field-error')).toHaveTextContent(words.invalidDate);
+  });
+
+  it('names the calendar button of the date filter cell', () => {
+    render(<Orders filterRow labels={labels} />);
+    const root = screen.getByLabelText('Filter Placed').closest<HTMLElement>('.flg-date-picker')!;
+    expect(within(root).getByRole('button', { name: words.chooseDate })).toBeInTheDocument();
+    expect(root.querySelector('.flg-date-picker-popup')).toHaveAttribute(
+      'aria-label',
+      words.chooseDate,
+    );
+  });
+
+  it('names the calendar buttons of the two ends of a between editor', () => {
+    render(
+      <Orders
+        filterRow
+        defaultFilter={{ columns: { placed: { operator: 'between' } } }}
+        labels={labels}
+      />,
+    );
+    click(screen.getByRole('combobox', { name: 'Filter Placed' }));
+    const buttons = within(popover()).getAllByRole('button', {
+      name: words.chooseDate,
+      hidden: true,
+    });
+    expect(buttons).toHaveLength(2);
+  });
+
+  it('names the steppers of a number editor', () => {
+    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
+    startEdit('DH-1');
+    const row = within(editedRow());
+    expect(row.getByRole('button', { name: words.increase, hidden: true })).toBeInTheDocument();
+    expect(row.getByRole('button', { name: words.decrease, hidden: true })).toBeInTheDocument();
+  });
+
+  it('says "no results" and the count of a Combobox editor in its words', async () => {
+    render(<Orders editing={{ mode: 'row' }} labels={labels} />);
+    startEdit('DH-1');
+    const status = within(editedRow()).getByRole('combobox', { name: 'Status' });
+    act(() => status.focus());
+    act(() => void fireEvent.change(status, { target: { value: 'zzz' } }));
+    expect(screen.getByText(words.noResults)).toBeInTheDocument();
+    act(() => void fireEvent.change(status, { target: { value: 'Proc' } }));
+    await aTaskLater(600);
+    const live = Array.from(document.querySelectorAll('[aria-live]')).map((el) => el.textContent);
+    expect(live).toContain(words.results(1));
+  });
+
+  it('names the clear button of the toolbar search', () => {
+    render(<Orders searchPanel defaultFilter={{ search: 'An' }} labels={labels} />);
+    expect(screen.getByRole('button', { name: words.clearSearch })).toBeInTheDocument();
+  });
+
+  it('names the clear button of the search of a header filter', () => {
+    render(<Orders headerFilter labels={labels} />);
+    click(screen.getByRole('button', { name: 'Filter Customer' }));
+    const search = within(popover()).getByRole('searchbox', {
+      name: 'Search values',
+      hidden: true,
+    });
+    act(() => void fireEvent.change(search, { target: { value: 'A' } }));
+    expect(
+      within(popover()).getByRole('button', { name: words.clearSearch, hidden: true }),
+    ).toBeInTheDocument();
+  });
+});
diff --git a/src/components/data-grid/DataGrid.newrow-callbacks.test.tsx b/src/components/data-grid/DataGrid.newrow-callbacks.test.tsx
new file mode 100644
index 0000000..0713517
--- /dev/null
+++ b/src/components/data-grid/DataGrid.newrow-callbacks.test.tsx
@@ -0,0 +1,163 @@
+import { act, fireEvent, render, screen } from '@testing-library/react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { DataGrid } from './DataGrid';
+import type { DataGridColumn, DataGridProps } from './index';
+
+// The functions of the app that are given a row (spec phase 6 §6.3, PR #46 R1): a new row holds only the fields
+// `initNewRow()` gave and the ones typed, so a function typed for a whole row can throw on it. The ones a new row
+// reaches (`value`, `format`, `cell`, `rowClassName`, `allowEditing`) are caught: the grid warns once and draws a
+// blank; the others are never given a new row.
+
+let showing: Set<Element>;
+beforeEach(() => {
+  resetDevWarnings();
+  showing = new Set();
+  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
+    showing.add(this);
+  };
+  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
+    showing.delete(this);
+  };
+  Element.prototype.scrollIntoView = () => {};
+  const matches = Element.prototype.matches;
+  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (
+    this: Element,
+    selector: string,
+  ) {
+    return selector === ':popover-open' ? showing.has(this) : matches.call(this, selector);
+  });
+  HTMLElement.prototype.checkVisibility = () => true;
+});
+afterEach(() => {
+  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
+  Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
+  Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
+  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
+  vi.restoreAllMocks();
+});
+
+interface Order {
+  id: string;
+  customer: string;
+  qty: number;
+}
+
+const ORDERS: Order[] = [
+  { id: 'DH-1', customer: 'An', qty: 3 },
+  { id: 'DH-2', customer: 'Bình', qty: 5 },
+];
+
+const ID: DataGridColumn<Order> = {
+  field: 'id',
+  caption: 'Order',
+  rowHeader: true,
+  allowEditing: false,
+  width: 100,
+};
+const CUSTOMER: DataGridColumn<Order> = { field: 'customer', caption: 'Customer', width: 140 };
+const QTY: DataGridColumn<Order> = { field: 'qty', caption: 'Qty', dataType: 'number', width: 100 };
+
+function Orders(props: Partial<DataGridProps<Order>>) {
+  return (
+    <DataGrid
+      data={ORDERS}
+      rowKey="id"
+      columns={[ID, CUSTOMER, QTY]}
+      caption="Orders"
+      paging={false}
+      editing={{ mode: 'cell', allowAdding: true }}
+      onSaving={() => {}}
+      {...props}
+    />
+  );
+}
+
+const addRow = () => act(() => screen.getByRole('button', { name: 'Add row' }).click());
+const newRow = () => document.querySelector<HTMLTableRowElement>('tr[data-new]');
+const warned = (spy: { mock: { calls: unknown[][] } }): string[] =>
+  spy.mock.calls.map((call) => String(call[0]));
+// A function typed for a whole row that reads a field a new row does not have.
+const needsCustomer = (row: Order): string => row.customer.toUpperCase();
+
+describe('a function that throws on a new row is caught', () => {
+  const cases: [string, Partial<DataGridProps<Order>>, string][] = [
+    [
+      'a column value',
+      { columns: [ID, CUSTOMER, { id: 'name', caption: 'Name', value: needsCustomer }] },
+      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
+    ],
+    [
+      // A format is asked for a value that is there: `initNewRow()` gives the quantity, not the customer.
+      'a column format',
+      {
+        columns: [ID, CUSTOMER, { ...QTY, format: (_value, row) => needsCustomer(row) }],
+        initNewRow: () => ({ qty: 2 }),
+      },
+      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
+    ],
+    [
+      'a column cell',
+      {
+        columns: [ID, CUSTOMER, { ...QTY, cell: (ctx) => needsCustomer(ctx.row) }],
+        initNewRow: () => ({ qty: 2 }),
+      },
+      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
+    ],
+    [
+      'rowClassName',
+      { rowClassName: (row) => (needsCustomer(row) === '' ? 'empty' : undefined) },
+      'a column value, format or cell, a rowClassName or a custom total threw on a new row',
+    ],
+    [
+      'a column allowEditing',
+      { columns: [ID, { ...CUSTOMER, allowEditing: (row) => needsCustomer(row) !== '' }] },
+      'a column allowEditing threw: the cell cannot be edited.',
+    ],
+  ];
+
+  it.each(cases)('%s: nothing escapes, one warning, and the row is there', (_name, props, text) => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    render(<Orders {...props} />);
+    addRow();
+    expect(newRow()).not.toBeNull();
+    // Drawn again with the same words: warned once, not once per draw.
+    fireEvent.focus(newRow()!);
+    expect(warned(warn).filter((message) => message.includes(text))).toHaveLength(1);
+  });
+});
+
+describe('a function that is never given a new row', () => {
+  const noField = (rows: Order[], row: Order) => {
+    if (row.id === undefined) rows.push(row);
+  };
+
+  it('is not asked for its sort value, its detail, its activation or its permissions', () => {
+    const seen: Order[] = [];
+    const { rerender } = render(
+      <Orders
+        columns={[ID, { ...CUSTOMER, sortValue: (row) => (noField(seen, row), row.customer) }, QTY]}
+        defaultSort={[{ field: 'customer', direction: 'asc' }]}
+        renderDetail={(row) => (noField(seen, row), (<span>detail</span>))}
+        rowHasDetail={(row) => (noField(seen, row), true)}
+        defaultExpandedRows={['DH-1']}
+        onRowActivate={(row) => noField(seen, row)}
+        editing={{
+          mode: 'cell',
+          allowAdding: true,
+          allowUpdating: (row) => (noField(seen, row), true),
+          allowDeleting: (row) => (noField(seen, row), true),
+        }}
+      />,
+    );
+    addRow();
+    const added = newRow()!;
+    fireEvent.click(added.querySelector('td, th')!);
+    fireEvent.keyDown(added.querySelector('td, th')!, { key: 'Enter' });
+    act(() => screen.getByRole('button', { name: 'Delete (new)' }).click());
+    expect(newRow()).toBeNull();
+    addRow();
+    rerender(<Orders />);
+    expect(seen).toEqual([]);
+  });
+});
diff --git a/src/components/data-grid/DataGrid.summary.test.tsx b/src/components/data-grid/DataGrid.summary.test.tsx
index e27ecaa..42e8c0a 100644
--- a/src/components/data-grid/DataGrid.summary.test.tsx
+++ b/src/components/data-grid/DataGrid.summary.test.tsx
@@ -2,12 +2,7 @@ import { act, createEvent, fireEvent, render, screen } from '@testing-library/re
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
 import { resetDevWarnings } from '../../internal/warn';
 import { DataGrid } from './DataGrid';
-import type {
-  DataGridColumn,
-  DataGridGroupItem,
-  DataGridProps,
-  DataGridSummaryProp,
-} from './index';
+import type { DataGridColumn, DataGridGroupItem, DataGridProps, DataGridSummary } from './index';
 
 // The totals (spec phase 6 §3.5 steps 6-7, §3.6 "Hàng tổng là một hàng của grid", §4.3 R1 "Hàng nhóm" and
 // "Tổng cuối bảng", §5, §6.3 "Tổng"): the totals on the group rows, the footer, what it adds up (every
@@ -57,14 +52,14 @@ const COLUMNS: DataGridColumn<Order>[] = [
 const BY_STATUS: DataGridGroupItem[] = [{ field: 'status', direction: 'asc' }];
 
 // What R1 asks for: a count under the first column, the sum under Qty, the sum of the prices.
-const FOOTER: DataGridSummaryProp<Order> = {
+const FOOTER: DataGridSummary<Order> = {
   total: [
     { column: 'id', type: 'count', label: 'Orders' },
     { column: 'qty', type: 'sum' },
     { column: 'price', type: 'sum' },
   ],
 };
-const GROUPS: DataGridSummaryProp<Order> = {
+const GROUPS: DataGridSummary<Order> = {
   group: [
     { column: 'qty', type: 'sum' },
     { column: 'price', type: 'sum' },
@@ -538,7 +533,7 @@ describe('the items', () => {
           {
             total: [{ column: 'qty', type: 'sum' }, 'oops', { type: 'sum' }],
             group: 'no',
-          } as unknown as DataGridSummaryProp<Order>
+          } as unknown as DataGridSummary<Order>
         }
         totalSummary={7 as unknown as Record<string, unknown>}
         remote
diff --git a/src/components/data-grid/DataGrid.test-d.ts b/src/components/data-grid/DataGrid.test-d.ts
index 4a29222..67c4f5c 100644
--- a/src/components/data-grid/DataGrid.test-d.ts
+++ b/src/components/data-grid/DataGrid.test-d.ts
@@ -14,8 +14,10 @@ import type {
   DataGridProps,
   DataGridRowDrop,
   DataGridState,
+  DataGridSummary,
   DataGridToolbarItems,
 } from './index';
+import * as gridTypes from './index';
 
 interface Order {
   id: string;
@@ -439,7 +441,7 @@ test('the column chooser is a boolean, and the toolbar is `false` or a function
   // @ts-expect-error `true` is not a toolbar
   const yes: DataGridProps<Order>['toolbar'] = true;
   void yes;
-  // @ts-expect-error an item of a later plan is not there to place yet
+  // @ts-expect-error an item the toolbar does not have is not there to place
   const exportCsv: DataGridProps<Order>['toolbar'] = (items) => items.exportCsv;
   void exportCsv;
   expectTypeOf<DataGridLabels['announceShown']>().toEqualTypeOf<(caption: string) => string>();
@@ -499,3 +501,34 @@ test('the filter panel: its prop, and the labels of its sentence', () => {
   const wrong: DataGridProps<Order> = { data: [], rowKey: 'id', columns: [], filterPanel: 'yes' };
   void wrong;
 });
+
+test('the names frozen for 0.5.0: the summary type, the controls words and one Cancel', () => {
+  expectTypeOf<DataGridProps<Order>['summary']>().toEqualTypeOf<
+    DataGridSummary<Order> | undefined
+  >();
+  // @ts-expect-error the type was named `DataGridSummaryProp` before it was released
+  type Old = gridTypes.DataGridSummaryProp<Order>;
+  expectTypeOf<Old>().toBeAny();
+  expectTypeOf<DataGridLabels['controls']['results']>().toEqualTypeOf<(count: number) => string>();
+  expectTypeOf<DataGridLabels['controls']['increase']>().toEqualTypeOf<string>();
+  expectTypeOf<keyof DataGridLabels['controls']>().toEqualTypeOf<
+    | 'chooseDate'
+    | 'invalidDate'
+    | 'unavailableDate'
+    | 'previousMonth'
+    | 'nextMonth'
+    | 'increase'
+    | 'decrease'
+    | 'noResults'
+    | 'results'
+    | 'clearSearch'
+  >();
+  // The record is given in part, as `operators` is.
+  expectTypeOf<DataGridLabelsInput['controls']>().toEqualTypeOf<
+    Partial<DataGridLabels['controls']> | undefined
+  >();
+  expectTypeOf<DataGridLabels['cancel']>().toEqualTypeOf<string>();
+  // @ts-expect-error the Cancel of the delete dialog, the form and the popup is `cancel`
+  type OldCancel = DataGridLabels['cancelButton'];
+  expectTypeOf<OldCancel>().toBeAny();
+});
diff --git a/src/components/data-grid/index.exports.test.ts b/src/components/data-grid/index.exports.test.ts
new file mode 100644
index 0000000..e20aca0
--- /dev/null
+++ b/src/components/data-grid/index.exports.test.ts
@@ -0,0 +1,81 @@
+import { readFileSync } from 'node:fs';
+import { describe, expect, it } from 'vitest';
+
+// The types of the public API are all exported (spec phase 6 §6.3): an app can name the type of every prop, of
+// every column field, of the handle and of the two contexts. Decided from the sources, never from a list kept by
+// hand, so a type added later without an export fails here. `DataGridColumnBase` is the one deliberate exception:
+// it is the shared part of the two column types and an app writes `DataGridColumn`.
+
+const types = readFileSync('src/components/data-grid/types.ts', 'utf8');
+const index = readFileSync('src/components/data-grid/index.ts', 'utf8');
+
+const NOT_EXPORTED = ['DataGridColumnBase'];
+
+/** Every `export interface X` and `export type X` of `types.ts`, with the text of its declaration. */
+const declarations = new Map<string, string>();
+const heads = [...types.matchAll(/^export (?:interface|type) (\w+)/gm)];
+heads.forEach((head, at) => {
+  const end = heads[at + 1]?.index ?? types.length;
+  declarations.set(head[1]!, types.slice(head.index, end));
+});
+
+/** The names `index.ts` exports from `./types`. */
+const exported = new Set(
+  [...index.matchAll(/export type \{([^}]*)\} from '\.\/types'/g)].flatMap((block) =>
+    block[1]!
+      .split(',')
+      .map((name) => name.trim())
+      .filter(Boolean),
+  ),
+);
+
+/** The `DataGrid…` names a declaration mentions, comments out (a comment names things it does not use). */
+function mentions(name: string): string[] {
+  const code = declarations
+    .get(name)!
+    .replace(/\/\*[\s\S]*?\*\//g, '')
+    .replace(/\/\/.*$/gm, '');
+  return [...new Set(code.match(/\bDataGrid\w*/g))].filter(
+    (other) => other !== name && declarations.has(other),
+  );
+}
+
+describe('the types of the data grid', () => {
+  it('reads the declarations it is about (a sanity check of the parse)', () => {
+    expect(declarations.size).toBeGreaterThan(30);
+    expect(declarations.has('DataGridProps')).toBe(true);
+    expect(exported.has('DataGridProps')).toBe(true);
+  });
+
+  it('exports every type that types.ts exports, but the deliberate ones', () => {
+    const missing = [...declarations.keys()].filter(
+      (name) => !exported.has(name) && !NOT_EXPORTED.includes(name),
+    );
+    expect(missing).toEqual([]);
+    for (const name of NOT_EXPORTED) expect(exported.has(name)).toBe(false);
+  });
+
+  it('exports every type that the props, the handle, the columns and the contexts name', () => {
+    const roots = [
+      'DataGridProps',
+      'DataGridHandle',
+      'DataGridColumn',
+      'DataGridCellContext',
+      'DataGridEditorContext',
+    ];
+    const reached = new Set<string>();
+    const walk = (name: string) => {
+      if (reached.has(name)) return;
+      reached.add(name);
+      mentions(name).forEach(walk);
+    };
+    roots.forEach(walk);
+    // The walk must really have walked: the column types and the labels are behind the props.
+    expect(reached.has('DataGridFieldColumn')).toBe(true);
+    expect(reached.has('DataGridLabelsInput')).toBe(true);
+    const unreachable = [...reached].filter(
+      (name) => !exported.has(name) && !NOT_EXPORTED.includes(name),
+    );
+    expect(unreachable).toEqual([]);
+  });
+});
diff --git a/src/components/data-grid/labels.test.ts b/src/components/data-grid/labels.test.ts
index 3b60ad9..abae57d 100644
--- a/src/components/data-grid/labels.test.ts
+++ b/src/components/data-grid/labels.test.ts
@@ -1,6 +1,6 @@
 import { describe, expect, it } from 'vitest';
 import { sameLabels } from './hooks/use-renewal-warning';
-import { DEFAULT_LABELS, LABEL_RECORDS, mergeLabels } from './labels';
+import { DEFAULT_LABELS, LABEL_RECORDS, controlLabelsOf, mergeLabels } from './labels';
 
 describe('LABEL_RECORDS', () => {
   it('names every label that is a record of words, read from the defaults and not from a list', () => {
@@ -9,6 +9,45 @@ describe('LABEL_RECORDS', () => {
       .map(([key]) => key);
     expect([...LABEL_RECORDS].sort()).toEqual(records.sort());
     expect(LABEL_RECORDS).toContain('validation');
+    expect(LABEL_RECORDS).toContain('controls');
+  });
+});
+
+describe('the controls record', () => {
+  it('keeps the other nine words when the caller gives one', () => {
+    const { controls } = mergeLabels({ controls: { increase: 'Tăng' } });
+    expect(controls.increase).toBe('Tăng');
+    expect(Object.keys(controls)).toHaveLength(10);
+    expect({ ...controls, increase: 'Increase' }).toEqual(DEFAULT_LABELS.controls);
+  });
+
+  it('says what the controls say by themselves, so nothing changes until an app passes words', () => {
+    const { controls } = DEFAULT_LABELS;
+    expect(controls.results(1)).toBe('1 result');
+    expect(controls.results(7)).toBe('7 results');
+    expect(controls.chooseDate).toBe('Choose date');
+    expect(controls.clearSearch).toBe('Clear search');
+  });
+
+  it('is handed to each control in the shape that control takes, whole', () => {
+    const controls = mergeLabels({
+      controls: { chooseDate: 'Chọn ngày', decrease: 'Giảm' },
+    }).controls;
+    const made = controlLabelsOf(controls);
+    expect(made.date).toMatchObject({ openCalendar: 'Chọn ngày', dialog: 'Chọn ngày' });
+    expect(made.date.invalidDate).toBe('Invalid date');
+    expect(made.number).toEqual({ increment: 'Increase', decrement: 'Giảm' });
+    expect(made.combobox.noResults).toBe('No results');
+    expect(made.combobox.results).toBe(controls.results);
+    expect(made.search).toEqual({ clear: 'Clear search' });
+  });
+});
+
+describe('the Cancel button', () => {
+  it('has one word for the filter popover, the delete dialog, the form and the popup', () => {
+    expect(DEFAULT_LABELS.cancel).toBe('Cancel');
+    expect(Object.keys(DEFAULT_LABELS)).not.toContain('cancelButton');
+    expect(mergeLabels({ cancel: 'Huỷ' }).cancel).toBe('Huỷ');
   });
 });
 
@@ -40,6 +79,17 @@ describe('mergeLabels', () => {
 });
 
 describe('sameLabels', () => {
+  it('compares the controls record by its words', () => {
+    const results = (count: number) => `${count}`;
+    expect(sameLabels({ controls: { results } }, { controls: { results } })).toBe(true);
+    expect(sameLabels({ controls: { increase: 'Tăng' } }, { controls: { increase: 'Tăng' } })).toBe(
+      true,
+    );
+    expect(sameLabels({ controls: { increase: 'Tăng' } }, { controls: { increase: 'Up' } })).toBe(
+      false,
+    );
+  });
+
   it('compares the validation record by its words, as every other record of labels', () => {
     const required = (caption: string) => `${caption}?`;
     expect(sameLabels({ validation: { required } }, { validation: { required } })).toBe(true);
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 --maxWorkers=3 src/components/data-grid
```

Expected: FAIL.
- `DataGrid.controls-words.test.tsx`, ở cả hai project: 8 ca của khối `controls named by the words of the labels` fail (`Unable to find an accessible element with the role "button" and name "Chọn ngày"` cho trình sửa ngày, ô lọc và hai đầu khoảng; `… name "Tăng"` cho hai nút bước; `Unable to find an element with the text: Không có kết quả` cho Combobox; `… name "Xoá tìm kiếm"` cho ô tìm kiếm của thanh công cụ và của lọc ở header; `toHaveTextContent` cho lỗi của trình sửa ngày). 8 ca của khối `controls named by the defaults of the controls` pass: đặc tả, mặc định là của chính control.
- `labels.test.ts`: các ca mới fail (`controlLabelsOf` chưa có; `LABEL_RECORDS` chưa có `controls`; `cancelButton` còn đó; `sameLabels` chưa so bản ghi `controls`).
- `DataGrid.test-d.ts` báo lỗi kiểu (`DataGridSummary` chưa được export; `controls`).
- PASS ngay: `index.exports.test.ts` (export đã đủ trước), `DataGrid.newrow-callbacks.test.tsx` (lớp bảo vệ có từ Plan F), `DataGrid.summary.test.tsx` (chỉ đổi tên một kiểu, tên kiểu được xoá khi dịch; `pnpm typecheck` báo nó cho tới Step 3).

Theo báo cáo của bản nháp (phát hiện 20): 8 ca tiếng Việt fail trước như trên; hai ca mặc định fail lần đầu ở bộ chọn của chính người viết, sửa trước khi lượt tiếng Việt được tính. **Các ca mới của `labels.test.ts` viết sau code**, chứng minh trên `labels.ts` cũ với một stub `controlLabelsOf`: 6 fail (`expected [ 'operators', 'panelOperators', …(2) ] to include 'controls'`, `Cannot read properties of undefined (reading 'increase')`, `expected [ 'yes', 'no', … ] to not include 'cancelButton'`). **`index.exports.test.ts` không fail trước được**: kiểm bằng đột biến (bỏ `DataGridToolbarItems` khỏi `index.ts` của grid thì hai ca fail, `expected [ 'DataGridToolbarItems' ] to deeply equal []`). **`DataGrid.newrow-callbacks.test.tsx` là đặc tả** (ca `format` fail lần đầu vì grid chỉ gọi `format` cho giá trị không trống, nên test cho `initNewRow: () => ({ qty: 2 })`). **`DataGrid.test-d.ts` viết sau khi đổi tên.**

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index 24aa5a2..7dce61c 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -1018,7 +1018,7 @@ type DataGridProps<TRow> = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'on
   filterRow?: boolean; headerFilter?: boolean; filterPanel?: boolean;
   searchPanel?: boolean | { placeholder?: string };
   groupPanel?: boolean; columnChooser?: boolean; csvExport?: boolean | DataGridCsvOptions;
-  summary?: { total?: readonly DataGridSummaryItem<TRow>[]; group?: readonly DataGridSummaryItem<TRow>[] };
+  summary?: DataGridSummary<TRow>;     // E; `DataGridSummary` là `{ total?: readonly DataGridSummaryItem<TRow>[]; group?: readonly DataGridSummaryItem<TRow>[] }` (phát hiện khi lập Plan G: tên kiểu, trước đó là `DataGridSummaryProp`)
   totalSummary?: Readonly<Record<string, unknown>>;
   rowReorder?: boolean;
   onRowReorder?: (fromKey: DataGridKey, toKey: DataGridKey, position: 'before' | 'after') => void;
@@ -1029,14 +1029,14 @@ type DataGridProps<TRow> = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'on
   toolbar?: false | ((items: DataGridToolbarItems) => ReactNode);
   onRowActivate?: (row: TRow, key: DataGridKey) => void;
   rowClassName?: (row: TRow) => string | undefined;
-  labels?: Partial<DataGridLabels>;
+  labels?: DataGridLabelsInput;        // (phát hiện khi lập Plan G: `Partial<DataGridLabels>` không ghép được các bản ghi `operators`, `panelOperators`, `summary`, `validation`, `controls`; `DataGridLabelsInput` cho phép đưa từng chữ của bản ghi, ghép một cấp)
 };
 
 interface DataGridHandle {
   readonly element: HTMLDivElement | null;
   focus(): void;                                    // B: focus ô hoạt động
   scrollToRow(key: DataGridKey): boolean;           // B; E: mở các nhóm chứa nó; đổi trang nếu cần
-  getState(): DataGridState;                        // B
+  getState(): DataGridState;                        // B; đủ tám phần của `DataGridState` (phát hiện khi lập Plan G)
   clearFilter(): void;                              // D: xoá tìm kiếm và mọi điều kiện cột
   expandAllGroups(): void; collapseAllGroups(): void;            // E
   addRow(): void; saveChanges(): Promise<boolean>; cancelChanges(): void;   // F
@@ -1175,9 +1175,10 @@ function OrdersGrid({ data }: { data: Order[] }) {
 | Thanh công cụ (B–G) | `search` "Search", `searchPlaceholder` "Search…", `columnChooser` "Columns", `lastShownColumn` "At least one column stays shown" (phát hiện khi lập Plan C: `lastShownColumn` là mô tả ẩn của ô bị tắt của cột hiện cuối cùng khi nó không bị khoá (`lockedColumn` là của ô khoá); cột vừa khoá vừa hiện cuối cùng chỉ có mô tả của ổ khoá; mô tả mất khi ô không còn bị tắt vì lý do đó), `exportCsv` "Export CSV", `addRow` "Add row", `groupPanel` "Grouping", `groupBy` "Group by", `groupPanelHint` "Drag a column header here to group by that column", `groupDirection(caption, next)` "Sort ${caption} groups ${next}", `ungroup(caption)` "Ungroup ${caption}" |
 | Tiêu đề, menu cột (B, C) | `sortState(direction, level, count)` `''` khi chỉ một cột được sắp (`aria-sort` đã nói) và ", sorted descending, 2 of 3" khi nhiều cột (phát hiện khi lập Plan B), `columnMenu(caption)` "${caption} column menu", `sortAscending` "Sort ascending", `sortDescending` "Sort descending", `clearSorting` "Clear sorting", `groupByColumn` "Group by this column", `pinLeft` "Pin to the left", `pinRight` "Pin to the right", `unpin` "Unpin", `moveLeft` "Move left", `moveRight` "Move right", `autoFit` "Fit width to content", `hideColumn` "Hide column", `columnWidth(px)` "${px} px", `lockedColumn` "Always shown", `groupsAndDetails` "Groups and details", `actions` "Actions", `reorderColumn` "Reorder" |
 | Chọn, trang (B) | `selectAll` "Select all rows", `selectAllOnPage` "Select all rows on this page", `selectRow(name)` "Select ${name}", `pageInfo(from, to, total)` "${from}–${to} of ${total}", `rowsPerPage` "Rows per page", `pageSize(n)` "${n} / page", `pagination` "Pagination", `previousPage` "Previous page", `nextPage` "Next page", `page(n)` "Page ${n}", `yes` "Yes", `no` "No", `loading` "Loading…", `noData` "No data" |
-| Lọc (D) | `filterCell(caption)` "Filter ${caption}", `operator(name)` "Operator: ${name}", `operators` { `'='` "Equals", `'<>'` "Does not equal", `'<'` "Less than", `'>'` "Greater than", `'<='` "Less than or equal to", `'>='` "Greater than or equal to", `between` "Between", `contains` "Contains", `notContains` "Does not contain", `startsWith` "Starts with", `endsWith` "Ends with" }, `all` "(All)", `between` "From – to", `from` "From", `to` "To", `range(from, to)` "${from} – ${to}" (ô `between` và thanh bộ lọc, chỉ khi có cả hai đầu; một đầu để mở viết `>=` hay `<=` bằng `panelOperators` và giá trị; phát hiện khi lập Plan D, Claude chốt OQ 5), `panelOperators` { `'='` "=", `'<>'` "≠", `'<'` "<", `'>'` ">", `'<='` "≤", `'>='` "≥", `contains` "contains", `notContains` "does not contain", `startsWith` "starts with", `endsWith` "ends with" } (không có `between`; chữ của toán tử trong thanh bộ lọc, một record gộp một cấp như `operators`; phát hiện khi lập Plan D, Claude chốt OQ 5), `quoted(text)` "‘${text}’" (chuỗi được quote trong thanh bộ lọc; phát hiện khi lập Plan D, Claude chốt OQ 5), `filterColumn(caption, active)` "Filter ${caption}" / "Filter ${caption} (filtered)", `searchValues` "Search values…", `searchValuesName` "Search values" (phát hiện khi lập Plan D), `selectAllValues` "(Select all)", `blank` "(Blanks)", `ok` "OK", `cancel` "Cancel", `moreValues(shown, total)` "Showing ${shown} of ${total} values. Search to narrow them.", `and` "and", `isAnyOf` "is any of", `isNoneOf` "is none of", `clearFilter` "Clear filter", `applyFilter` "Apply filter", `noMatches` "No rows match the filter" |
+| Lọc (D) | `filterCell(caption)` "Filter ${caption}", `operator(name)` "Operator: ${name}", `operators` { `'='` "Equals", `'<>'` "Does not equal", `'<'` "Less than", `'>'` "Greater than", `'<='` "Less than or equal to", `'>='` "Greater than or equal to", `between` "Between", `contains` "Contains", `notContains` "Does not contain", `startsWith` "Starts with", `endsWith` "Ends with" }, `all` "(All)", `between` "From – to", `from` "From", `to` "To", `range(from, to)` "${from} – ${to}" (ô `between` và thanh bộ lọc, chỉ khi có cả hai đầu; một đầu để mở viết `>=` hay `<=` bằng `panelOperators` và giá trị; phát hiện khi lập Plan D, Claude chốt OQ 5), `panelOperators` { `'='` "=", `'<>'` "≠", `'<'` "<", `'>'` ">", `'<='` "≤", `'>='` "≥", `contains` "contains", `notContains` "does not contain", `startsWith` "starts with", `endsWith` "ends with" } (không có `between`; chữ của toán tử trong thanh bộ lọc, một record gộp một cấp như `operators`; phát hiện khi lập Plan D, Claude chốt OQ 5), `quoted(text)` "‘${text}’" (chuỗi được quote trong thanh bộ lọc; phát hiện khi lập Plan D, Claude chốt OQ 5), `filterColumn(caption, active)` "Filter ${caption}" / "Filter ${caption} (filtered)", `searchValues` "Search values…", `searchValuesName` "Search values" (phát hiện khi lập Plan D), `selectAllValues` "(Select all)", `blank` "(Blanks)", `ok` "OK", `cancel` "Cancel" (nút Cancel của mọi hộp: popover lọc, hộp hỏi trước khi xoá, form và popup; phát hiện khi lập Plan G, trước đó là `cancel` và `cancelButton`), `moreValues(shown, total)` "Showing ${shown} of ${total} values. Search to narrow them.", `and` "and", `isAnyOf` "is any of", `isNoneOf` "is none of", `clearFilter` "Clear filter", `applyFilter` "Apply filter", `noMatches` "No rows match the filter" |
 | Nhóm, tổng, chi tiết, kéo dòng (E) | `groupColumn(caption)` "${caption}:" (phát hiện khi lập Plan E), `groupCount(n)` "(${n})", `continued` "(continued)", `summary` { `count` "Count", `sum` "Total", `avg` "Average", `min` "Min", `max` "Max" }, `summaryLabel(label)` "${label}:", `summaryOf(type, caption)` "${type} of ${caption}", `showDetails(name)` "Show details of ${name}", `hideDetails(name)` "Hide details of ${name}", `reorderRow(name)` "Reorder ${name}", `moveUp` "Move up", `moveDown` "Move down", `moveToTop` "Move to top", `moveToBottom` "Move to bottom", `reorderDisabled` "Clear sorting and grouping to reorder rows" |
-| Sửa (F) | `edit(name)` "Edit ${name}", `delete(name)` "Delete ${name}", `save(name)` "Save ${name}", `cancelEdit(name)` "Cancel editing ${name}", `undoDelete(name)` "Undo deleting ${name}", `newRow` "(new)", `changedCell` "changed", `deletedRow` "marked for deletion", `unsavedChanges(n)` "1 unsaved change" / "${n} unsaved changes", `saveChanges` "Save changes", `discardChanges` "Discard changes", `editRowTitle(name)` "Edit ${name}", `newRowTitle` "New row", `requiredHint` "Fields marked * are required.", `saveButton` "Save", `cancelButton` "Cancel", `deleteTitle` "Delete this row?", `deleteDescription(name)` "${name} will be deleted.", `deleteConfirm` "Delete", `saveFailed` "The changes could not be saved.", `dismissError` "Dismiss" (nút đóng alert lỗi khi lưu; phát hiện khi review cuối Plan F), `validation` { `required(caption)` "${caption} is required", `range(caption, min, max)` "${caption} must be between ${min} and ${max}" (hay "at least" / "at most" khi thiếu một đầu), `stringLength(caption, min, max)` tương tự với "characters", `pattern(caption)` "${caption} is not valid", `email(caption)` "${caption} must be an email address" } |
+| Sửa (F) | `edit(name)` "Edit ${name}", `delete(name)` "Delete ${name}", `save(name)` "Save ${name}", `cancelEdit(name)` "Cancel editing ${name}", `undoDelete(name)` "Undo deleting ${name}", `newRow` "(new)", `changedCell` "changed", `deletedRow` "marked for deletion", `unsavedChanges(n)` "1 unsaved change" / "${n} unsaved changes", `saveChanges` "Save changes", `discardChanges` "Discard changes", `editRowTitle(name)` "Edit ${name}", `newRowTitle` "New row", `requiredHint` "Fields marked * are required.", `saveButton` "Save", `deleteTitle` "Delete this row?", `deleteDescription(name)` "${name} will be deleted.", `deleteConfirm` "Delete", `saveFailed` "The changes could not be saved.", `dismissError` "Dismiss" (nút đóng alert lỗi khi lưu; phát hiện khi review cuối Plan F), `validation` { `required(caption)` "${caption} is required", `range(caption, min, max)` "${caption} must be between ${min} and ${max}" (hay "at least" / "at most" khi thiếu một đầu), `stringLength(caption, min, max)` tương tự với "characters", `pattern(caption)` "${caption} is not valid", `email(caption)` "${caption} must be an email address" } |
+| Điều khiển vẽ sẵn (G) | `controls` { `chooseDate` "Choose date" (tên nút lịch và hộp thoại lịch của DatePicker), `invalidDate` "Invalid date", `unavailableDate` "This date is not available", `previousMonth` "Previous month", `nextMonth` "Next month", `increase` "Increase" (NumberInput `increment`), `decrease` "Decrease" (`decrement`), `noResults` "No results", `results(count)` "1 result" / "${count} results" (Combobox), `clearSearch` "Clear search" (SearchField `clear`) }: bản ghi ghép một cấp như `operators`; mỗi mặc định là mặc định của chính điều khiển, nên không đổi gì cho đến khi ứng dụng đưa chữ; lưới chuyển chúng cho DatePicker của ô sửa, ô lọc và popover khoảng, NumberInput và Combobox của ô sửa, và hai SearchField (thanh công cụ, lọc ở header) (phát hiện khi lập Plan G) |
 | Thông báo live (B–F) | `announceSort(sorted)` (`sorted`: các mục `{ caption, direction }`; phát hiện khi lập Plan B), `announceSortCleared` "Sorting cleared", `announceSelected(n)` "${n} rows selected", `announceRowsFound(n)` "${n} rows" / "No rows", `announceMoved(caption, position, count)` "${caption} moved to column ${position} of ${count}", `announceResized(caption, px)` "${caption}, ${px} pixels wide", `announcePinned(caption, side)`, `announceUnpinned(caption)`, `announceHidden(caption)`, `announceShown(caption)`, `announceGrouped(caption)` "Grouped by ${caption}", `announceUngrouped(caption)` "${caption} ungrouped", `announceGroupMoved(caption, level, count)` "${caption} moved to grouping level ${level} of ${count}", `announceRowMoved(name, position, count)` "${name} moved to row ${position} of ${count}" (ba mục này: phát hiện khi lập Plan E), `announceSaved` "Changes saved", `announceRowAdded` "Row added", `announceRowDeleted` "Row deleted", `announceRowMarkedDeleted` "Row marked for deletion", `announceErrors(n)` "${n} fields need attention" |
 
 ---
diff --git a/src/components/data-grid/DataGrid.mdx b/src/components/data-grid/DataGrid.mdx
index 79c485c..22c7397 100644
--- a/src/components/data-grid/DataGrid.mdx
+++ b/src/components/data-grid/DataGrid.mdx
@@ -1401,7 +1401,7 @@ const summary = {
     { column: 'total', type: 'sum' },
   ],
   group: [{ column: 'total', type: 'sum' }],
-} satisfies DataGridSummaryProp<Order>;
+} satisfies DataGridSummary<Order>;
 
 <DataGrid data={orders} rowKey="id" columns={columns} caption="Orders" summary={summary} />;
 ```
@@ -1792,8 +1792,8 @@ mode changes (the answer, when it comes, is ignored).
 first, and stays open when its fields fail their rules. The form is one row with one cell across
 every column, and in the cell a floating glass card: a title (`labels.editRowTitle(name)`,
 `labels.newRowTitle` for a new row), the line `labels.requiredHint` when a field is required, the
-fields and the buttons Cancel (`labels.cancelButton`) and Save (`labels.saveButton`, which loads
-while the save is pending).
+fields and the buttons Cancel (`labels.cancel`) and Save (`labels.saveButton`, which loads while the
+save is pending).
 
 The form stands in the place of its row, and the row stays in the selection: "select all" on the page (and mod+A)
 chooses it by its key, the box of the title counts it, and it is the anchor of a range by Shift. The form of a new row
@@ -1827,8 +1827,8 @@ Dialog for the grid, drawn after the table, and **the row stays in the table as
 opens in it and its buttons are the same as before. The fields, the title
 (`labels.editRowTitle(name)`, `labels.newRowTitle`), the line `labels.requiredHint` (the Dialog's
 description, when a field is required), the checks, `onSaving` and the errors are those of the form
-(see Form mode); the buttons are Cancel (`labels.cancelButton`) and Save (`labels.saveButton`, which
-loads while the save is pending), at the end of the Dialog's footer.
+(see Form mode); the buttons are Cancel (`labels.cancel`) and Save (`labels.saveButton`, which loads
+while the save is pending), at the end of the Dialog's footer.
 
 `editing.popup` sets the Dialog:
 
@@ -1995,7 +1995,7 @@ row does not draw (a hidden column, another row) adds its message to the alert's
 
 `allowDeleting` puts **Delete** (`labels.delete(name)`) after Edit, 2px apart, shown as Edit is, on rows that are
 not being edited. With `confirmDelete` (the default) it opens one dialog for the grid, with `labels.deleteTitle`,
-`labels.deleteDescription(name)`, Cancel (`labels.cancelButton`, focused first) and Delete
+`labels.deleteDescription(name)`, Cancel (`labels.cancel`, focused first) and Delete
 (`labels.deleteConfirm`); <Kbd keys="esc" /> and Cancel close it. Delete in the dialog closes it and calls
 `onSaving([{ type: 'remove', key, row }])`; the dialog does not wait for the answer, the table is `aria-busy`
 while a Promise is pending, a reject shows the alert, and `labels.announceRowDeleted` is said when it has gone
@@ -2026,7 +2026,10 @@ number twice; a key of `data` that equals one is skipped, with a warning), and i
   show. A new row holds only the fields `initNewRow()` gave and the ones typed, though its type is `TRow`: a column
   that reads a field of the row (a `value`, a `format` or a `cell`, `rowClassName`, a custom total) should find it
   in `initNewRow()`. When such a function throws on a new row the grid catches it, warns once and leaves what it
-  drew blank; the same functions of the saved rows are never caught.
+  drew blank; the same functions of the saved rows are never caught. A column's `allowEditing` is given a new row
+  too, and a throw counts as `false`, with one warning. `allowUpdating`, `allowDeleting`, `sortValue`,
+  `rowHasDetail`, `renderDetail` and `onRowActivate` are never given a new row: it is always edited, Delete gives it
+  up, it is not sorted, has no detail and is not activated.
   The check of the rules never throws: a `value` that throws while a row is validated is taken as a blank (so
   `required` fails and the other rules pass), with one warning.
 - **Row mode.** The row opens in edit mode with the focus in its first editor. ✓ and <Kbd keys="enter" /> call
@@ -2342,9 +2345,9 @@ has a `tabindex`, and the cell is the stop.
 | `expandedRows`           | `readonly (string \| number)[]`                                                                              |              | The rows whose detail is open (controlled)                                                |
 | `defaultExpandedRows`    | `readonly (string \| number)[]`                                                                              |              | The rows whose detail is open at first                                                    |
 | `onExpandedRowsChange`   | `(keys) => void`                                                                                             |              | Called with the keys of the open details after a press                                    |
-| `summary`                | `{ total?, group? }`                                                                                         |              | The totals of the footer and of the group rows; a stable value; see Totals                |
+| `summary`                | `DataGridSummary<TRow>`                                                                                      |              | The totals of the footer and of the group rows; a stable value; see Totals                |
 | `totalSummary`           | `Record<string, unknown>`                                                                                    |              | Server mode: the values of the footer's totals, by the id of each item                    |
-| `labels`                 | `DataGridLabelsInput`                                                                                        |              | The words the grid says; `operators`, `panelOperators` and `summary` may be given in part |
+| `labels`                 | `DataGridLabelsInput`                                                                                        |              | The words the grid says; its five records (see Labels) may be given in part, word by word |
 
 The default `locale` is `'en-US'` and not the language of the browser, so that the HTML from the
 server and the first render in the browser say the same. Pass the person's language. Anything that
@@ -2366,7 +2369,7 @@ The `ref` is a handle, not the element. It has ten members:
 | Member                | Is                                                                                                        |
 | --------------------- | --------------------------------------------------------------------------------------------------------- |
 | `element`             | The root `div` of the grid; `null` before it is mounted                                                   |
-| `getState()`          | The state as the grid shows it: the page as drawn, the layout as shown                                    |
+| `getState()`          | The state as the grid shows it, all eight parts: the page as drawn, the layout as shown                   |
 | `focus()`             | Moves the focus to the active cell, and scrolls it into view                                              |
 | `scrollToRow(key)`    | Brings the row into view, opening its groups and going to its page first; `false` when no row has the key |
 | `clearFilter()`       | Clears the search and every condition, and goes to the first page                                         |
@@ -2399,106 +2402,125 @@ filter panel writes its sentence with keys of its own: `panelOperators`, `and`,
 `isNoneOf`, `applyFilter` and `quoted`. An app that translates `operators` (the words of the filter
 row) must translate these too, or the panel speaks English beside a row that does not.
 
-| Key                                                                 | Default                                                            | Is                                                                                                  |
-| ------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
-| `yes`                                                               | `Yes`                                                              | The hidden word of a boolean `true`                                                                 |
-| `no`                                                                | `No`                                                               | The hidden word of a boolean `false`                                                                |
-| `sortState`                                                         | `''` for one column; `, sorted descending, 2 of 3` otherwise       | Hidden words in a sort button: `(direction, level, count)`                                          |
-| `announceSort`                                                      | `Sorted by Order date, descending, then Total, ascending`          | What is said after a press: `(sorted)`, the items with their captions                               |
-| `announceSortCleared`                                               | `Sorting cleared`                                                  | What is said when a press leaves no sort                                                            |
-| `pageInfo`                                                          | `1–20 of 135`                                                      | The count in the bar: `(from, to, total)`                                                           |
-| `rowsPerPage`                                                       | `Rows per page`                                                    | The name of the choice of size                                                                      |
-| `pageSize`                                                          | `20 / page`                                                        | An item of that choice: `(size)`                                                                    |
-| `pagination`                                                        | `Pagination`                                                       | The name of the pages                                                                               |
-| `previousPage`                                                      | `Previous page`                                                    | The name of the button                                                                              |
-| `nextPage`                                                          | `Next page`                                                        | The name of the button                                                                              |
-| `page`                                                              | `Page 3`                                                           | The name of a page's button: `(page)`                                                               |
-| `selectAllOnPage`                                                   | `Select all rows on this page`                                     | The name of the box in the title, scope `'page'`                                                    |
-| `selectAll`                                                         | `Select all rows`                                                  | The name of that box, scope `'all'`                                                                 |
-| `selectRow`                                                         | `Select DH-1030`                                                   | The name of the box of a row: `(name)`                                                              |
-| `announceSelected`                                                  | `5 rows selected`                                                  | What is said after a range or a select all: `(count)`                                               |
-| `loading`                                                           | `Loading…`                                                         | Said when the grid starts loading; the hidden words of the spinner                                  |
-| `noData`                                                            | `No data`                                                          | What an empty grid says                                                                             |
-| `noMatches`                                                         | `No rows match the filter`                                         | What a grid says when its filter keeps no row                                                       |
-| `clearFilter`                                                       | `Clear filter`                                                     | The button of that grid, which clears the filter                                                    |
-| `announceRowsFound`                                                 | `12 rows`                                                          | What is said after a change of the filter: `(count)`, "No rows" and "1 row"                         |
-| `filterCell`                                                        | `Filter Customer`                                                  | The name of the cell of the filter row: `(caption)`                                                 |
-| `operator`                                                          | `Operator: Contains`                                               | The name of the operator's button: `(name)`, the name of the operator                               |
-| `operators`                                                         | `Contains`, `Equals`, `Starts with`…                               | The words of the eleven operators, by operator; a record given in part is merged                    |
-| `all`                                                               | `(All)`                                                            | The placeholder and the first item of a Select of the filter row                                    |
-| `between`                                                           | `From – to`                                                        | The placeholder of the field of a range                                                             |
-| `from`, `to`                                                        | `From`, `To`                                                       | The names of the two ends in the popover of a range                                                 |
-| `range`                                                             | `5 – 9`                                                            | A range with both ends, in the field of a range and the filter panel: `(from, to)`                  |
-| `panelOperators`                                                    | `contains`, `≥`, `does not contain`…                               | The words of ten operators (not `between`) in the filter panel; a record given in part is merged    |
-| `quoted`                                                            | `‘ltd’`                                                            | A text that a condition looks for, in the filter panel: `(text)`                                    |
-| `and`                                                               | `and`                                                              | Between two conditions in the filter panel                                                          |
-| `isAnyOf`, `isNoneOf`                                               | `is any of`, `is none of`                                          | A header condition in the filter panel, before its values in brackets                               |
-| `applyFilter`                                                       | `Apply filter`                                                     | The name of the switch of the filter panel                                                          |
-| `ok`, `cancel`                                                      | `OK`, `Cancel`                                                     | The buttons of the popover of a range and of the header filter                                      |
-| `filterColumn`                                                      | `Filter Status`, `Filter Status (filtered)`                        | The name of the funnel and of its popover: `(caption, active)`                                      |
-| `searchValues`, `searchValuesName`                                  | `Search values…`, `Search values`                                  | The hint and the name of the search field of the header filter                                      |
-| `selectAllValues`                                                   | `(Select all)`                                                     | The first line of the list of values                                                                |
-| `blank`                                                             | `(Blanks)`                                                         | The line of the list for the cells that are blank                                                   |
-| `moreValues`                                                        | `Showing 500 of 600 values. Search to narrow them.`                | The line under a list with more values than are drawn: `(shown, total)`                             |
-| `search`                                                            | `Search`                                                           | The name of the search field                                                                        |
-| `searchPlaceholder`                                                 | `Search…`                                                          | The placeholder of the search field, unless `searchPanel` brings one                                |
-| `columnWidth`                                                       | `180 px`                                                           | The label that says the width of a column being dragged: `(px)`                                     |
-| `announceResized`                                                   | `Customer, 230 pixels wide`                                        | What is said after the keys or a fit resized a column: `(caption, px)`                              |
-| `announceMoved`                                                     | `Customer moved to column 3 of 4`                                  | What is said after a column was moved: `(caption, position, count)`                                 |
-| `columnMenu`                                                        | `Customer column menu`                                             | The name of the button of a title, and of its menu: `(caption)`                                     |
-| `sortAscending`, `sortDescending`, `clearSorting`                   | `Sort ascending`, `Sort descending`, `Clear sorting`               | The items of the menu for the sort                                                                  |
-| `pinLeft`, `pinRight`, `unpin`                                      | `Pin to the left`, `Pin to the right`, `Unpin`                     | The items of the menu for pinning                                                                   |
-| `moveLeft`, `moveRight`, `autoFit`                                  | `Move left`, `Move right`, `Fit width to content`                  | The items of the menu for the place and the width of a column                                       |
-| `hideColumn`                                                        | `Hide column`                                                      | The item that hides the column                                                                      |
-| `announcePinned`                                                    | `Customer pinned to the left`                                      | What is said after a pin: `(caption, side)`                                                         |
-| `announceUnpinned`                                                  | `Customer unpinned`                                                | What is said after an unpin: `(caption)`                                                            |
-| `announceHidden`                                                    | `Customer hidden`                                                  | What is said after a column was hidden, from its menu or the chooser: `(caption)`                   |
-| `announceShown`                                                     | `Customer shown`                                                   | What is said after the chooser showed a column: `(caption)`                                         |
-| `columnChooser`                                                     | `Columns`                                                          | The name of the chooser's button, and its title                                                     |
-| `lastShownColumn`                                                   | `At least one column stays shown`                                  | The hidden description of the box of the only column shown                                          |
-| `lockedColumn`                                                      | `Always shown`                                                     | The hidden description of the box of a column that cannot be hidden                                 |
-| `groupCount`                                                        | `(4)`                                                              | The number of rows a group row says after its value: `(count)`                                      |
-| `continued`                                                         | `(continued)`                                                      | What the repeat of a group at the top of a page says after its count                                |
-| `groupsAndDetails`                                                  | `Groups and details`                                               | The hidden name of the title cell over the indent columns and the detail buttons                    |
-| `groupColumn`                                                       | `Status:`                                                          | What a group row says before its value: `(caption)`                                                 |
-| `groupPanel`                                                        | `Grouping`                                                         | The name of the group panel                                                                         |
-| `groupBy`                                                           | `Group by`                                                         | The word before the chips                                                                           |
-| `groupPanelHint`                                                    | `Drag a column header here to group by that column`                | What the empty panel says                                                                           |
-| `groupDirection`                                                    | `Sort Status groups descending`                                    | The name of the direction button of a chip: `(caption, next)`                                       |
-| `ungroup`                                                           | `Ungroup Status`                                                   | The name of the remove button of a chip: `(caption)`                                                |
-| `groupByColumn`                                                     | `Group by this column`                                             | The item of the column menu                                                                         |
-| `announceGrouped`                                                   | `Grouped by Status`                                                | What is said after a column was grouped by: `(caption)`                                             |
-| `announceUngrouped`                                                 | `Status ungrouped`                                                 | What is said after a level was removed: `(caption)`                                                 |
-| `announceGroupMoved`                                                | `Status moved to grouping level 2 of 3`                            | What is said after a level was moved: `(caption, level, count)`                                     |
-| `summary`                                                           | `Count`, `Total`, `Average`, `Min`, `Max`                          | The word before a total with no `label`, by type; a record, merged one level deep                   |
-| `summaryLabel`                                                      | `Total:`                                                           | A label as it stands before the value: `(label)`                                                    |
-| `showDetails`, `hideDetails`                                        | `Show details of DH-1024`, `Hide details of DH-1024`               | The name of the button of a detail, closed and open: `(name)`                                       |
-| `reorderColumn`                                                     | `Reorder`                                                          | The hidden words in the title of the column of handles                                              |
-| `reorderRow`                                                        | `Reorder DH-1024`                                                  | The name of the handle of a row: `(name)`                                                           |
-| `actions`                                                           | `Actions`                                                          | The hidden title of the column of buttons                                                           |
-| `edit`, `save`, `cancelEdit`                                        | `Edit DH-1024`, `Save DH-1024`, `Cancel editing DH-1024`           | The names of the buttons of a row: `(name)`                                                         |
-| `editRowTitle`, `newRowTitle`                                       | `Edit DH-1024`, `New row`                                          | The title of the form of a row: `editRowTitle(name)`, and of a new row                              |
-| `requiredHint`, `saveButton`                                        | `Fields marked * are required.`, `Save`                            | The line under the title of a form that has a required field, and the form's Save button            |
-| `announceSaved`                                                     | `Changes saved`                                                    | What is said when a save has gone through                                                           |
-| `delete`                                                            | `Delete DH-1024`                                                   | The name of the button that deletes a row: `(name)`                                                 |
-| `deleteTitle`, `deleteDescription`, `deleteConfirm`, `cancelButton` | `Delete this row?`, `DH-1024 will be deleted.`, `Delete`, `Cancel` | The words of the dialog that asks before a delete, and the form's Cancel; `deleteDescription(name)` |
-| `saveFailed`                                                        | `The changes could not be saved.`                                  | The alert when a save is refused and the error says no words of its own                             |
-| `dismissError`                                                      | `Dismiss`                                                          | The name of the button that takes the save-error alert away                                         |
-| `announceRowDeleted`                                                | `Row deleted`                                                      | What is said when a delete has gone through                                                         |
-| `addRow`                                                            | `Add row`                                                          | The name of the toolbar's button that adds a row                                                    |
-| `newRow`                                                            | `(new)`                                                            | What stands for the name of a new row: in its row header's cell, and in the names of its buttons    |
-| `announceRowAdded`                                                  | `Row added`                                                        | What is said when a row has been added                                                              |
-| `changedCell`, `deletedRow`                                         | `changed`, `marked for deletion`                                   | The hidden words after a changed cell, and in the first cell of a row marked for deletion (batch)   |
-| `announceRowMarkedDeleted`                                          | `Row marked for deletion`                                          | What is said when a row has been marked for deletion (batch)                                        |
-| `undoDelete`                                                        | `Undo deleting DH-1024`                                            | The name of the button that takes the mark off a row: `(name)`                                      |
-| `unsavedChanges`                                                    | `1 unsaved change`, `3 unsaved changes`                            | The words of the save bar: `(count)` of rows                                                        |
-| `saveChanges`, `discardChanges`                                     | `Save changes`, `Discard changes`                                  | The buttons of the save bar                                                                         |
-| `announceErrors`                                                    | `2 fields need attention`                                          | What is said when a save finds fields that fail: `(count)`                                          |
-| `validation`                                                        | `Customer is required`                                             | The words of a rule with no message: `required`, `range`, `stringLength`, `pattern`, `email`        |
-| `moveUp`, `moveDown`, `moveToTop`, `moveToBottom`                   | `Move up`, `Move down`, `Move to top`, `Move to bottom`            | The items of the row menu                                                                           |
-| `reorderDisabled`                                                   | `Clear sorting and grouping to reorder rows`                       | The tooltip of a handle that is off, and what the row keys say then                                 |
-| `announceRowMoved`                                                  | `DH-1024 moved to row 3 of 12`                                     | What is said after a row was moved: `(name, position, count)`                                       |
-| `summaryOf`                                                         | `Total of Qty`                                                     | The hidden words before a total with no visible label: `(type, caption)`                            |
+| Key                                                 | Default                                                      | Is                                                                                                |
+| --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
+| `yes`                                               | `Yes`                                                        | The hidden word of a boolean `true`                                                               |
+| `no`                                                | `No`                                                         | The hidden word of a boolean `false`                                                              |
+| `sortState`                                         | `''` for one column; `, sorted descending, 2 of 3` otherwise | Hidden words in a sort button: `(direction, level, count)`                                        |
+| `announceSort`                                      | `Sorted by Order date, descending, then Total, ascending`    | What is said after a press: `(sorted)`, the items with their captions                             |
+| `announceSortCleared`                               | `Sorting cleared`                                            | What is said when a press leaves no sort                                                          |
+| `pageInfo`                                          | `1–20 of 135`                                                | The count in the bar: `(from, to, total)`                                                         |
+| `rowsPerPage`                                       | `Rows per page`                                              | The name of the choice of size                                                                    |
+| `pageSize`                                          | `20 / page`                                                  | An item of that choice: `(size)`                                                                  |
+| `pagination`                                        | `Pagination`                                                 | The name of the pages                                                                             |
+| `previousPage`                                      | `Previous page`                                              | The name of the button                                                                            |
+| `nextPage`                                          | `Next page`                                                  | The name of the button                                                                            |
+| `page`                                              | `Page 3`                                                     | The name of a page's button: `(page)`                                                             |
+| `selectAllOnPage`                                   | `Select all rows on this page`                               | The name of the box in the title, scope `'page'`                                                  |
+| `selectAll`                                         | `Select all rows`                                            | The name of that box, scope `'all'`                                                               |
+| `selectRow`                                         | `Select DH-1030`                                             | The name of the box of a row: `(name)`                                                            |
+| `announceSelected`                                  | `5 rows selected`                                            | What is said after a range or a select all: `(count)`                                             |
+| `loading`                                           | `Loading…`                                                   | Said when the grid starts loading; the hidden words of the spinner                                |
+| `noData`                                            | `No data`                                                    | What an empty grid says                                                                           |
+| `noMatches`                                         | `No rows match the filter`                                   | What a grid says when its filter keeps no row                                                     |
+| `clearFilter`                                       | `Clear filter`                                               | The button of that grid, which clears the filter                                                  |
+| `announceRowsFound`                                 | `12 rows`                                                    | What is said after a change of the filter: `(count)`, "No rows" and "1 row"                       |
+| `filterCell`                                        | `Filter Customer`                                            | The name of the cell of the filter row: `(caption)`                                               |
+| `operator`                                          | `Operator: Contains`                                         | The name of the operator's button: `(name)`, the name of the operator                             |
+| `operators`                                         | `Contains`, `Equals`, `Starts with`…                         | The words of the eleven operators, by operator; a record given in part is merged                  |
+| `all`                                               | `(All)`                                                      | The placeholder and the first item of a Select of the filter row                                  |
+| `between`                                           | `From – to`                                                  | The placeholder of the field of a range                                                           |
+| `from`, `to`                                        | `From`, `To`                                                 | The names of the two ends in the popover of a range                                               |
+| `range`                                             | `5 – 9`                                                      | A range with both ends, in the field of a range and the filter panel: `(from, to)`                |
+| `panelOperators`                                    | `contains`, `≥`, `does not contain`…                         | The words of ten operators (not `between`) in the filter panel; a record given in part is merged  |
+| `quoted`                                            | `‘ltd’`                                                      | A text that a condition looks for, in the filter panel: `(text)`                                  |
+| `and`                                               | `and`                                                        | Between two conditions in the filter panel                                                        |
+| `isAnyOf`, `isNoneOf`                               | `is any of`, `is none of`                                    | A header condition in the filter panel, before its values in brackets                             |
+| `applyFilter`                                       | `Apply filter`                                               | The name of the switch of the filter panel                                                        |
+| `ok`, `cancel`                                      | `OK`, `Cancel`                                               | The buttons of the popover of a range and of the header filter, and every other Cancel            |
+| `filterColumn`                                      | `Filter Status`, `Filter Status (filtered)`                  | The name of the funnel and of its popover: `(caption, active)`                                    |
+| `searchValues`, `searchValuesName`                  | `Search values…`, `Search values`                            | The hint and the name of the search field of the header filter                                    |
+| `selectAllValues`                                   | `(Select all)`                                               | The first line of the list of values                                                              |
+| `blank`                                             | `(Blanks)`                                                   | The line of the list for the cells that are blank                                                 |
+| `moreValues`                                        | `Showing 500 of 600 values. Search to narrow them.`          | The line under a list with more values than are drawn: `(shown, total)`                           |
+| `search`                                            | `Search`                                                     | The name of the search field                                                                      |
+| `searchPlaceholder`                                 | `Search…`                                                    | The placeholder of the search field, unless `searchPanel` brings one                              |
+| `columnWidth`                                       | `180 px`                                                     | The label that says the width of a column being dragged: `(px)`                                   |
+| `announceResized`                                   | `Customer, 230 pixels wide`                                  | What is said after the keys or a fit resized a column: `(caption, px)`                            |
+| `announceMoved`                                     | `Customer moved to column 3 of 4`                            | What is said after a column was moved: `(caption, position, count)`                               |
+| `columnMenu`                                        | `Customer column menu`                                       | The name of the button of a title, and of its menu: `(caption)`                                   |
+| `sortAscending`, `sortDescending`, `clearSorting`   | `Sort ascending`, `Sort descending`, `Clear sorting`         | The items of the menu for the sort                                                                |
+| `pinLeft`, `pinRight`, `unpin`                      | `Pin to the left`, `Pin to the right`, `Unpin`               | The items of the menu for pinning                                                                 |
+| `moveLeft`, `moveRight`, `autoFit`                  | `Move left`, `Move right`, `Fit width to content`            | The items of the menu for the place and the width of a column                                     |
+| `hideColumn`                                        | `Hide column`                                                | The item that hides the column                                                                    |
+| `announcePinned`                                    | `Customer pinned to the left`                                | What is said after a pin: `(caption, side)`                                                       |
+| `announceUnpinned`                                  | `Customer unpinned`                                          | What is said after an unpin: `(caption)`                                                          |
+| `announceHidden`                                    | `Customer hidden`                                            | What is said after a column was hidden, from its menu or the chooser: `(caption)`                 |
+| `announceShown`                                     | `Customer shown`                                             | What is said after the chooser showed a column: `(caption)`                                       |
+| `columnChooser`                                     | `Columns`                                                    | The name of the chooser's button, and its title                                                   |
+| `lastShownColumn`                                   | `At least one column stays shown`                            | The hidden description of the box of the only column shown                                        |
+| `lockedColumn`                                      | `Always shown`                                               | The hidden description of the box of a column that cannot be hidden                               |
+| `groupCount`                                        | `(4)`                                                        | The number of rows a group row says after its value: `(count)`                                    |
+| `continued`                                         | `(continued)`                                                | What the repeat of a group at the top of a page says after its count                              |
+| `groupsAndDetails`                                  | `Groups and details`                                         | The hidden name of the title cell over the indent columns and the detail buttons                  |
+| `groupColumn`                                       | `Status:`                                                    | What a group row says before its value: `(caption)`                                               |
+| `groupPanel`                                        | `Grouping`                                                   | The name of the group panel                                                                       |
+| `groupBy`                                           | `Group by`                                                   | The word before the chips                                                                         |
+| `groupPanelHint`                                    | `Drag a column header here to group by that column`          | What the empty panel says                                                                         |
+| `groupDirection`                                    | `Sort Status groups descending`                              | The name of the direction button of a chip: `(caption, next)`                                     |
+| `ungroup`                                           | `Ungroup Status`                                             | The name of the remove button of a chip: `(caption)`                                              |
+| `groupByColumn`                                     | `Group by this column`                                       | The item of the column menu                                                                       |
+| `announceGrouped`                                   | `Grouped by Status`                                          | What is said after a column was grouped by: `(caption)`                                           |
+| `announceUngrouped`                                 | `Status ungrouped`                                           | What is said after a level was removed: `(caption)`                                               |
+| `announceGroupMoved`                                | `Status moved to grouping level 2 of 3`                      | What is said after a level was moved: `(caption, level, count)`                                   |
+| `summary`                                           | `Count`, `Total`, `Average`, `Min`, `Max`                    | The word before a total with no `label`, by type; a record, merged one level deep                 |
+| `summaryLabel`                                      | `Total:`                                                     | A label as it stands before the value: `(label)`                                                  |
+| `showDetails`, `hideDetails`                        | `Show details of DH-1024`, `Hide details of DH-1024`         | The name of the button of a detail, closed and open: `(name)`                                     |
+| `reorderColumn`                                     | `Reorder`                                                    | The hidden words in the title of the column of handles                                            |
+| `reorderRow`                                        | `Reorder DH-1024`                                            | The name of the handle of a row: `(name)`                                                         |
+| `actions`                                           | `Actions`                                                    | The hidden title of the column of buttons                                                         |
+| `edit`, `save`, `cancelEdit`                        | `Edit DH-1024`, `Save DH-1024`, `Cancel editing DH-1024`     | The names of the buttons of a row: `(name)`                                                       |
+| `editRowTitle`, `newRowTitle`                       | `Edit DH-1024`, `New row`                                    | The title of the form of a row: `editRowTitle(name)`, and of a new row                            |
+| `requiredHint`, `saveButton`                        | `Fields marked * are required.`, `Save`                      | The line under the title of a form that has a required field, and the form's Save button          |
+| `announceSaved`                                     | `Changes saved`                                              | What is said when a save has gone through                                                         |
+| `delete`                                            | `Delete DH-1024`                                             | The name of the button that deletes a row: `(name)`                                               |
+| `deleteTitle`, `deleteDescription`, `deleteConfirm` | `Delete this row?`, `DH-1024 will be deleted.`, `Delete`     | The words of the dialog that asks before a delete; `deleteDescription(name)`                      |
+| `saveFailed`                                        | `The changes could not be saved.`                            | The alert when a save is refused and the error says no words of its own                           |
+| `dismissError`                                      | `Dismiss`                                                    | The name of the button that takes the save-error alert away                                       |
+| `announceRowDeleted`                                | `Row deleted`                                                | What is said when a delete has gone through                                                       |
+| `addRow`                                            | `Add row`                                                    | The name of the toolbar's button that adds a row                                                  |
+| `newRow`                                            | `(new)`                                                      | What stands for the name of a new row: in its row header's cell, and in the names of its buttons  |
+| `announceRowAdded`                                  | `Row added`                                                  | What is said when a row has been added                                                            |
+| `changedCell`, `deletedRow`                         | `changed`, `marked for deletion`                             | The hidden words after a changed cell, and in the first cell of a row marked for deletion (batch) |
+| `announceRowMarkedDeleted`                          | `Row marked for deletion`                                    | What is said when a row has been marked for deletion (batch)                                      |
+| `undoDelete`                                        | `Undo deleting DH-1024`                                      | The name of the button that takes the mark off a row: `(name)`                                    |
+| `unsavedChanges`                                    | `1 unsaved change`, `3 unsaved changes`                      | The words of the save bar: `(count)` of rows                                                      |
+| `saveChanges`, `discardChanges`                     | `Save changes`, `Discard changes`                            | The buttons of the save bar                                                                       |
+| `announceErrors`                                    | `2 fields need attention`                                    | What is said when a save finds fields that fail: `(count)`                                        |
+| `validation`                                        | `Customer is required`                                       | The words of a rule with no message: `required`, `range`, `stringLength`, `pattern`, `email`      |
+| `moveUp`, `moveDown`, `moveToTop`, `moveToBottom`   | `Move up`, `Move down`, `Move to top`, `Move to bottom`      | The items of the row menu                                                                         |
+| `reorderDisabled`                                   | `Clear sorting and grouping to reorder rows`                 | The tooltip of a handle that is off, and what the row keys say then                               |
+| `announceRowMoved`                                  | `DH-1024 moved to row 3 of 12`                               | What is said after a row was moved: `(name, position, count)`                                     |
+| `summaryOf`                                         | `Total of Qty`                                               | The hidden words before a total with no visible label: `(type, caption)`                          |
+| `controls`                                          | `Choose date`, `Increase`, `No results`, `Clear search`…     | The words of the controls the grid draws, a record merged one level deep: see below               |
+
+`labels.controls` holds the words of the controls the grid draws, each of which takes words of its own. Each
+default is the control's own, so nothing changes until you pass them:
+
+| `controls` key               | Default                        | Is                                                                              |
+| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
+| `chooseDate`                 | `Choose date`                  | The name of the calendar button of a date field, and of its calendar's dialog   |
+| `invalidDate`                | `Invalid date`                 | What a date field says of text that is no date                                  |
+| `unavailableDate`            | `This date is not available`   | What a date field says of a date outside its `min` and `max`                    |
+| `previousMonth`, `nextMonth` | `Previous month`, `Next month` | The names of the calendar's month buttons                                       |
+| `increase`, `decrease`       | `Increase`, `Decrease`         | The names of the buttons of a number editor                                     |
+| `noResults`                  | `No results`                   | What the list of a Combobox editor says when no choice matches                  |
+| `results`                    | `1 result`, `3 results`        | What a Combobox editor announces after the text changed: `(count)`              |
+| `clearSearch`                | `Clear search`                 | The name of the clear button of the toolbar's search and of the header filter's |
+
+They reach the DatePickers of the cell editor, the filter cell and the range popover, the NumberInput and the
+Combobox of the editors, and the two search fields. A record given in part keeps the words it leaves out:
+`labels={{ controls: { increase: 'Tăng' } }}` changes one name.
 
 ## Do and don't
 
diff --git a/src/components/data-grid/DataGrid.tsx b/src/components/data-grid/DataGrid.tsx
index 9b0e04d..71399d9 100644
--- a/src/components/data-grid/DataGrid.tsx
+++ b/src/components/data-grid/DataGrid.tsx
@@ -73,7 +73,7 @@ import { useSelection } from './hooks/use-selection';
 import { useLoadingAnnounce } from './hooks/use-loading-announce';
 import { useOverlayTop } from './hooks/use-overlay-top';
 import { OVERSCAN } from './hooks/use-virtual-rows';
-import { mergeLabels } from './labels';
+import { controlLabelsOf, mergeLabels } from './labels';
 import { isWhole } from './normalize';
 import { Body } from './parts/Body';
 import { FilterPanel } from './parts/FilterPanel';
@@ -279,6 +279,8 @@ function DataGridImpl<TRow>(
   // only the rows it changes; new functions in them are new labels, which warn (spec phase 6 §5).
   const givenLabels = useKept(labelsProp, sameLabels);
   const labels = useMemo(() => mergeLabels(givenLabels), [givenLabels]);
+  // The words of the controls in the shape each control takes: made once per labels, not per cell.
+  const controlLabels = useMemo(() => controlLabelsOf(labels.controls), [labels]);
   useRowPropsWarning(rowClassName, labelsProp);
   useDetailPropsWarning(renderDetail, rowHasDetail);
   // The grid has details when `renderDetail` is a function: any other value is none, and no column is added.
@@ -881,6 +883,7 @@ function DataGridImpl<TRow>(
     resolved: chooserColumns,
     layout: shownLayout,
     labels,
+    controlLabels,
     showColumn,
     addRow: editingConfig?.allowAdding === true ? editing.add : null,
     addVariant: editing.changeCount > 0 ? 'secondary' : 'primary',
@@ -985,6 +988,7 @@ function DataGridImpl<TRow>(
     pins,
     layoutPins,
     labels,
+    controlLabels,
     variant,
     locale,
     virtual,
diff --git a/src/components/data-grid/engine/column-menu.ts b/src/components/data-grid/engine/column-menu.ts
index 4fa6676..994ebb3 100644
--- a/src/components/data-grid/engine/column-menu.ts
+++ b/src/components/data-grid/engine/column-menu.ts
@@ -53,7 +53,7 @@ type Item = ColumnMenuEntry | false;
 /**
  * The groups of a column's menu, in the order of C1 crop d, each as a list of the items it has: a
  * group with no item is left out, and the menu draws a separator between the groups that are left. The
- * groups are built from a list, so a later plan puts its own between two of them ("Group by this
+ * groups are built from a list, so one more group goes between two of them ("Group by this
  * column" is the second).
  */
 export function columnMenuGroups(input: ColumnMenuInput): ColumnMenuEntry[][] {
diff --git a/src/components/data-grid/engine/columns.ts b/src/components/data-grid/engine/columns.ts
index 2c68a56..8050a94 100644
--- a/src/components/data-grid/engine/columns.ts
+++ b/src/components/data-grid/engine/columns.ts
@@ -441,8 +441,8 @@ export function resolveColumns<TRow>(
 }
 
 /**
- * Whether a column is a data column: no service column (the column of boxes, and those of later
- * plans). The one rule for what the keys of a title, the menu, a resize and a move work on.
+ * Whether a column is a data column: no service column (the grid's own: the boxes, the handles,
+ * the indents, the detail buttons and the actions). The one rule for what the keys of a title, the menu, a resize and a move work on.
  */
 export function isDataColumn(column: { readonly service?: unknown }): boolean {
   return column.service === undefined;
diff --git a/src/components/data-grid/engine/layout.ts b/src/components/data-grid/engine/layout.ts
index 711b52b..89aa396 100644
--- a/src/components/data-grid/engine/layout.ts
+++ b/src/components/data-grid/engine/layout.ts
@@ -473,7 +473,8 @@ export interface DataColumns {
 
 /**
  * The data columns of the shown columns, given the side of each shown column: every column that is no
- * service column (the column of boxes, and those of later plans), wherever it is. The one rule for what
+ * service column (the grid's own: the boxes, the handles, the indents, the
+ * detail buttons and the actions), wherever it is. The one rule for what
  * a drag, a key, a resize and the menu of a column may work on.
  */
 export function dataColumnsOf(
diff --git a/src/components/data-grid/engine/summary.ts b/src/components/data-grid/engine/summary.ts
index 92dbe9f..2bf2b34 100644
--- a/src/components/data-grid/engine/summary.ts
+++ b/src/components/data-grid/engine/summary.ts
@@ -1,6 +1,6 @@
 import { numberFormat } from '../../../internal/intl';
 import { isNumber } from '../../../internal/number';
-import type { DataGridSummaryItem, DataGridSummaryProp } from '../types';
+import type { DataGridSummaryItem, DataGridSummary } from '../types';
 import type { ResolvedColumn } from './columns';
 import type { TextReader } from './filter';
 import { isNewRow, readOfRow, readOfRows } from './edit';
@@ -140,8 +140,8 @@ const shapeOfItems = (items: readonly DataGridSummaryItem<never>[] | undefined):
  * the next, which the grid warns about when it goes on.
  */
 export function sameSummaryShape(
-  a: DataGridSummaryProp<never> | undefined,
-  b: DataGridSummaryProp<never> | undefined,
+  a: DataGridSummary<never> | undefined,
+  b: DataGridSummary<never> | undefined,
 ): boolean {
   return (
     shapeOfItems(a?.total) === shapeOfItems(b?.total) &&
@@ -155,8 +155,8 @@ export function sameSummaryShape(
  * a new object every render; the one of an earlier render is kept while it says the same.
  */
 export function sameSummary(
-  a: DataGridSummaryProp<never> | undefined,
-  b: DataGridSummaryProp<never> | undefined,
+  a: DataGridSummary<never> | undefined,
+  b: DataGridSummary<never> | undefined,
 ): boolean {
   if (a === b) return true;
   if (!a || !b) return false;
diff --git a/src/components/data-grid/grid-context.ts b/src/components/data-grid/grid-context.ts
index 791f3d3..1864591 100644
--- a/src/components/data-grid/grid-context.ts
+++ b/src/components/data-grid/grid-context.ts
@@ -6,6 +6,7 @@ import type { FlatRow } from './engine/flatten';
 import type { TextReader } from './engine/filter';
 import type { ScopeState } from './engine/selection';
 import type { ResolvedSummaryItem } from './engine/summary';
+import type { ControlLabels } from './labels';
 import type { ColumnMenuControl } from './hooks/use-column-menu';
 import type { DragViewStore } from './hooks/use-drag-view';
 import type { RowMenuControl } from './hooks/use-row-menu';
@@ -64,6 +65,8 @@ export interface GridContextValue<TRow = unknown> {
   /** The same for each of `layoutColumns`: what the cells of the rows are given. */
   layoutPins: readonly (PinPlace | undefined)[];
   labels: DataGridLabels;
+  /** The words of `labels.controls` in the shape each control takes (`DatePicker`, `NumberInput`, `Combobox`, `SearchField`). */
+  controlLabels: ControlLabels;
   variant: TableVariant;
   /** The grid's `locale`: the filter row reads and writes its numbers and days by it. */
   locale: string;
diff --git a/src/components/data-grid/hooks/use-grid-context-value.ts b/src/components/data-grid/hooks/use-grid-context-value.ts
index b2326dd..601aea7 100644
--- a/src/components/data-grid/hooks/use-grid-context-value.ts
+++ b/src/components/data-grid/hooks/use-grid-context-value.ts
@@ -33,6 +33,7 @@ export interface GridContextOptions<TRow> {
   pins: readonly (PinPlace | undefined)[];
   layoutPins: readonly (PinPlace | undefined)[];
   labels: DataGridLabels;
+  controlLabels: GridContextValue<TRow>['controlLabels'];
   variant: TableVariant;
   locale: string;
   virtual: boolean;
@@ -73,6 +74,7 @@ export function useGridContextValue<TRow>(
     options;
   const { groupTotals, summaryReader, filler, fillerAt, pins, layoutPins, labels, variant } =
     options;
+  const { controlLabels } = options;
   const { locale, virtual, filterRow, headerFilter, skeletonRows, textOf, rowClassName } = options;
   const { sorting, onSortPress, selectionMode, selectAllMode, rowClick, activates } = options;
   const { selectionActions, grouped, panel, rowHeader, rowReorder, resize, reorder } = options;
@@ -99,6 +101,7 @@ export function useGridContextValue<TRow>(
       pins,
       layoutPins,
       labels,
+      controlLabels,
       variant,
       locale,
       virtual,
@@ -149,6 +152,7 @@ export function useGridContextValue<TRow>(
       textOf,
       rowReorder,
       labels,
+      controlLabels,
       locale,
       variant,
       virtual,
diff --git a/src/components/data-grid/hooks/use-grid-summary.ts b/src/components/data-grid/hooks/use-grid-summary.ts
index a19daf5..b4cd19e 100644
--- a/src/components/data-grid/hooks/use-grid-summary.ts
+++ b/src/components/data-grid/hooks/use-grid-summary.ts
@@ -2,7 +2,7 @@ import { useMemo } from 'react';
 import { resolveSummaryItems, sameSummary } from '../engine/summary';
 import type { ResolvedSummaryItem } from '../engine/summary';
 import type { ResolvedColumn } from '../engine/columns';
-import type { DataGridSummaryProp } from '../types';
+import type { DataGridSummary } from '../types';
 import { useSummaryWarning } from './use-renewal-warning';
 import { useKept } from './use-kept';
 
@@ -31,7 +31,7 @@ export function useGridSummary<TRow>({
   summary,
   resolved,
 }: {
-  summary: DataGridSummaryProp<TRow> | undefined;
+  summary: DataGridSummary<TRow> | undefined;
   resolved: readonly ResolvedColumn<TRow>[];
 }): GridSummary<TRow> {
   const summaryKept = useKept(summary, sameSummary);
diff --git a/src/components/data-grid/hooks/use-renewal-warning.ts b/src/components/data-grid/hooks/use-renewal-warning.ts
index bcd7d8f..badcfa7 100644
--- a/src/components/data-grid/hooks/use-renewal-warning.ts
+++ b/src/components/data-grid/hooks/use-renewal-warning.ts
@@ -2,7 +2,7 @@ import { useEffect, useRef } from 'react';
 import { devWarn, isProduction } from '../../../internal/warn';
 import { sameSummary, sameSummaryShape } from '../engine/summary';
 import { LABEL_RECORDS } from '../labels';
-import type { DataGridColumn, DataGridLabelsInput, DataGridSummaryProp } from '../types';
+import type { DataGridColumn, DataGridLabelsInput, DataGridSummary } from '../types';
 
 const COMMITS = 3;
 
@@ -92,7 +92,7 @@ export function sameLabels(
  * a `summary` while it says the same, functions by identity, so each such render resolves the items and
  * computes every total again and draws every group row again.
  */
-export function useSummaryWarning<TRow>(summary: DataGridSummaryProp<TRow> | undefined): void {
+export function useSummaryWarning<TRow>(summary: DataGridSummary<TRow> | undefined): void {
   useRenewalWarning(
     summary,
     (previous, next) =>
diff --git a/src/components/data-grid/index.ts b/src/components/data-grid/index.ts
index f0e6494..3afcc86 100644
--- a/src/components/data-grid/index.ts
+++ b/src/components/data-grid/index.ts
@@ -35,7 +35,7 @@ export type {
   DataGridSortMode,
   DataGridState,
   DataGridSummaryItem,
-  DataGridSummaryProp,
+  DataGridSummary,
   DataGridToolbarItems,
   DataGridValidationRule,
   DataGridValueColumn,
diff --git a/src/components/data-grid/labels.ts b/src/components/data-grid/labels.ts
index 30c27f9..1abf000 100644
--- a/src/components/data-grid/labels.ts
+++ b/src/components/data-grid/labels.ts
@@ -1,4 +1,5 @@
 import { withDefaults } from '../../internal/with-defaults';
+import type { DatePickerLabels } from '../date-picker/DatePicker';
 import type { DataGridLabels, DataGridLabelsInput, DataGridSortDirection } from './types';
 
 const directionWord = (direction: DataGridSortDirection) =>
@@ -140,7 +141,6 @@ export const DEFAULT_LABELS: DataGridLabels = {
   deleteTitle: 'Delete this row?',
   deleteDescription: (name) => `${name} will be deleted.`,
   deleteConfirm: 'Delete',
-  cancelButton: 'Cancel',
   saveFailed: 'The changes could not be saved.',
   dismissError: 'Dismiss',
   announceRowDeleted: 'Row deleted',
@@ -173,6 +173,19 @@ export const DEFAULT_LABELS: DataGridLabels = {
     pattern: (caption) => `${caption} is not valid`,
     email: (caption) => `${caption} must be an email address`,
   },
+  // Each is the default of the control that takes it, written out: the controls keep theirs.
+  controls: {
+    chooseDate: 'Choose date',
+    invalidDate: 'Invalid date',
+    unavailableDate: 'This date is not available',
+    previousMonth: 'Previous month',
+    nextMonth: 'Next month',
+    increase: 'Increase',
+    decrease: 'Decrease',
+    noResults: 'No results',
+    results: (count) => (count === 1 ? '1 result' : `${count} results`),
+    clearSearch: 'Clear search',
+  },
 };
 
 /**
@@ -184,6 +197,7 @@ export const LABEL_RECORDS = [
   'panelOperators',
   'summary',
   'validation',
+  'controls',
 ] as const satisfies readonly (keyof DataGridLabels)[];
 
 /**
@@ -199,3 +213,35 @@ export function mergeLabels(given: DataGridLabelsInput | undefined): DataGridLab
     ),
   );
 }
+
+/** The words the grid hands to the controls it draws, each in the shape of that control's own `labels`. */
+export interface ControlLabels {
+  /** For a DatePicker: the button, the dialog, the faults and the calendar's month buttons. */
+  date: DatePickerLabels;
+  /** For a NumberInput. */
+  number: { increment: string; decrement: string };
+  /** For a Combobox. */
+  combobox: { noResults: string; results: (count: number) => string };
+  /** For a SearchField. */
+  search: { clear: string };
+}
+
+/**
+ * The `controls` labels in the shape each control takes. The grid makes it once per `labels` (the controls'
+ * parts get the same objects on every draw), never in a cell's render.
+ */
+export function controlLabelsOf(controls: DataGridLabels['controls']): ControlLabels {
+  return {
+    date: {
+      openCalendar: controls.chooseDate,
+      dialog: controls.chooseDate,
+      invalidDate: controls.invalidDate,
+      unavailableDate: controls.unavailableDate,
+      previousMonth: controls.previousMonth,
+      nextMonth: controls.nextMonth,
+    },
+    number: { increment: controls.increase, decrement: controls.decrease },
+    combobox: { noResults: controls.noResults, results: controls.results },
+    search: { clear: controls.clearSearch },
+  };
+}
diff --git a/src/components/data-grid/normalize.ts b/src/components/data-grid/normalize.ts
index baa4c58..100d4fe 100644
--- a/src/components/data-grid/normalize.ts
+++ b/src/components/data-grid/normalize.ts
@@ -10,7 +10,7 @@ import type {
   DataGridProps,
   DataGridSortItem,
   DataGridSummaryItem,
-  DataGridSummaryProp,
+  DataGridSummary,
 } from './types';
 
 /** The size of a page when `paging` says none. */
@@ -335,7 +335,7 @@ export function normalizeProps<TRow>(given: GivenProps<TRow>): SafeProps<TRow> {
 
   // The totals: each of `total` and `group` that is a list keeps its items of their kind, a part that is
   // no list is left out; the same object comes back when nothing was wrong. `totalSummary` is an object.
-  function summary(value: unknown): DataGridSummaryProp<TRow> | undefined {
+  function summary(value: unknown): DataGridSummary<TRow> | undefined {
     if (value === undefined) return undefined;
     if (!isObject(value)) {
       problems.add('summary');
@@ -354,9 +354,9 @@ export function normalizeProps<TRow>(given: GivenProps<TRow>): SafeProps<TRow> {
         clean = false;
       }
     }
-    if (clean) return value as DataGridSummaryProp<TRow>;
+    if (clean) return value as DataGridSummary<TRow>;
     problems.add('summary');
-    return kept as DataGridSummaryProp<TRow>;
+    return kept as DataGridSummary<TRow>;
   }
   function totalSummary(value: unknown): Readonly<Record<string, unknown>> | undefined {
     if (value === undefined) return undefined;
diff --git a/src/components/data-grid/parts/BetweenEditor.tsx b/src/components/data-grid/parts/BetweenEditor.tsx
index e4b739d..f2e5836 100644
--- a/src/components/data-grid/parts/BetweenEditor.tsx
+++ b/src/components/data-grid/parts/BetweenEditor.tsx
@@ -43,7 +43,7 @@ export function BetweenEditor<TRow>({
   column: ResolvedColumn<TRow>;
   applyRef: ApplyRef;
 }) {
-  const { labels, locale } = useGridContext<TRow>();
+  const { labels, controlLabels, locale } = useGridContext<TRow>();
   const { filter, apply } = useFilterView();
   const numeric = column.dataType === 'number';
   const [start, finish] = rangeEnds(column, conditionOf(filter, column.id)?.value);
@@ -113,6 +113,7 @@ export function BetweenEditor<TRow>({
               ref={ref}
               size="sm"
               locale={locale}
+              labels={controlLabels.date}
               value={text === '' ? null : text}
               onValueChange={(next) => set(next ?? '')}
             />
diff --git a/src/components/data-grid/parts/ConfirmDelete.tsx b/src/components/data-grid/parts/ConfirmDelete.tsx
index 29c17f8..38333c8 100644
--- a/src/components/data-grid/parts/ConfirmDelete.tsx
+++ b/src/components/data-grid/parts/ConfirmDelete.tsx
@@ -62,7 +62,7 @@ export function ConfirmDelete<TRow>({
         </DialogHeader>
         <DialogFooter>
           <Button ref={cancel} variant="secondary" onClick={onClose}>
-            {labels.cancelButton}
+            {labels.cancel}
           </Button>
           <Button variant="danger" onClick={onDelete}>
             {labels.deleteConfirm}
diff --git a/src/components/data-grid/parts/EditForm.tsx b/src/components/data-grid/parts/EditForm.tsx
index a660374..06a04fd 100644
--- a/src/components/data-grid/parts/EditForm.tsx
+++ b/src/components/data-grid/parts/EditForm.tsx
@@ -131,7 +131,7 @@ function EditFormImpl<TRow>({ flat, active, ariaRowIndex, editing }: EditFormPro
           />
           <div className="flg-data-grid-form-foot">
             <Button type="button" variant="secondary" size="sm" onClick={() => edit.cancel()}>
-              {labels.cancelButton}
+              {labels.cancel}
             </Button>
             <Button type="submit" variant="primary" size="sm" loading={editing.saving}>
               {labels.saveButton}
diff --git a/src/components/data-grid/parts/EditPopup.tsx b/src/components/data-grid/parts/EditPopup.tsx
index 7e16565..c1af84d 100644
--- a/src/components/data-grid/parts/EditPopup.tsx
+++ b/src/components/data-grid/parts/EditPopup.tsx
@@ -122,7 +122,7 @@ function PopupContent<TRow>({
       </form>
       <DialogFooter>
         <Button type="button" variant="secondary" onClick={() => edit.cancel()}>
-          {labels.cancelButton}
+          {labels.cancel}
         </Button>
         <Button type="submit" form={formId} variant="primary" loading={editing.saving}>
           {labels.saveButton}
diff --git a/src/components/data-grid/parts/FilterCell.tsx b/src/components/data-grid/parts/FilterCell.tsx
index 2f2eeb8..71247b3 100644
--- a/src/components/data-grid/parts/FilterCell.tsx
+++ b/src/components/data-grid/parts/FilterCell.tsx
@@ -203,7 +203,7 @@ function TypedFilter<TRow>({
  * the day it kept.
  */
 function DateFilter<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
-  const { labels, locale } = useGridContext<TRow>();
+  const { labels, controlLabels, locale } = useGridContext<TRow>();
   const { filter, apply, onClear } = useFilterView();
   const condition = conditionOf(filter, column.id);
   const held = isIsoDate(condition?.value) ? condition.value : null;
@@ -260,6 +260,7 @@ function DateFilter<TRow>({ column }: { column: ResolvedColumn<TRow> }) {
       ref={input}
       size="sm"
       locale={locale}
+      labels={controlLabels.date}
       aria-label={labels.filterCell(column.caption)}
       startContent={<OperatorButton column={column} />}
       value={held ?? dropped}
diff --git a/src/components/data-grid/parts/HeaderFilter.tsx b/src/components/data-grid/parts/HeaderFilter.tsx
index eeb2a3e..5aee6a1 100644
--- a/src/components/data-grid/parts/HeaderFilter.tsx
+++ b/src/components/data-grid/parts/HeaderFilter.tsx
@@ -59,7 +59,7 @@ export function HeaderFilter<TRow>({
   column: ResolvedColumn<TRow>;
   applyRef: ApplyRef;
 }) {
-  const { labels } = useGridContext<TRow>();
+  const { labels, controlLabels } = useGridContext<TRow>();
   const { filter, apply, listValues } = useFilterView();
   const [{ items, narrowed }] = useState(() => listValues(column.id));
   // The boxes as they were when the popover opened: an OK that leaves them so is a Cancel.
@@ -148,6 +148,7 @@ export function HeaderFilter<TRow>({
       <SearchField
         size="sm"
         aria-label={labels.searchValuesName}
+        labels={controlLabels.search}
         placeholder={labels.searchValues}
         value={search}
         onValueChange={setSearch}
diff --git a/src/components/data-grid/parts/SearchBox.tsx b/src/components/data-grid/parts/SearchBox.tsx
index 9c5acba..c585376 100644
--- a/src/components/data-grid/parts/SearchBox.tsx
+++ b/src/components/data-grid/parts/SearchBox.tsx
@@ -14,6 +14,8 @@ export interface SearchBoxProps {
   /** The name of the field. */
   label: string;
   placeholder: string;
+  /** The words of the field's own parts (the name of its clear button). */
+  labels: { clear: string };
 }
 
 /**
@@ -27,7 +29,7 @@ export interface SearchBoxProps {
  * a search the field sent itself, which a parent may give back later than a newer keystroke, does
  * not.
  */
-export function SearchBox({ label, placeholder }: SearchBoxProps) {
+export function SearchBox({ label, placeholder, labels }: SearchBoxProps) {
   const { filter, apply, onClear } = useFilterView();
   const held = filter.search ?? '';
   const [text, setText] = useState(held);
@@ -110,6 +112,7 @@ export function SearchBox({ label, placeholder }: SearchBoxProps) {
       className="flg-data-grid-search"
       size="md"
       aria-label={label}
+      labels={labels}
       placeholder={placeholder}
       value={text}
       {...composition.props}
diff --git a/src/components/data-grid/parts/editors/CellEditor.tsx b/src/components/data-grid/parts/editors/CellEditor.tsx
index 19da338..bb17d5f 100644
--- a/src/components/data-grid/parts/editors/CellEditor.tsx
+++ b/src/components/data-grid/parts/editors/CellEditor.tsx
@@ -83,7 +83,7 @@ function DefaultEditor<TRow>({
   errorId,
   labelled = false,
 }: EditorProps<TRow>) {
-  const { locale } = useGridContext<TRow>();
+  const { locale, controlLabels } = useGridContext<TRow>();
   const kind = editorKind(column);
   const value = useDraftValue(edit.draft, row, (held) =>
     readOfRow(row, () => toEditorValue(column, held), blankEditorValue(column)),
@@ -125,6 +125,7 @@ function DefaultEditor<TRow>({
         <NumberInput
           {...common}
           locale={locale}
+          labels={controlLabels.number}
           formatOptions={numberOptions(column)}
           value={value as number | null}
           readOnly={saving}
@@ -136,6 +137,7 @@ function DefaultEditor<TRow>({
         <DatePicker
           {...common}
           locale={locale}
+          labels={controlLabels.date}
           value={value as string | null}
           readOnly={saving}
           onValueChange={set}
@@ -165,7 +167,12 @@ function DefaultEditor<TRow>({
       );
     case 'combobox':
       return (
-        <Combobox {...common} value={value as string | null} onValueChange={(next) => set(next)}>
+        <Combobox
+          {...common}
+          labels={controlLabels.combobox}
+          value={value as string | null}
+          onValueChange={(next) => set(next)}
+        >
           {column.choices!.map((choice) => (
             <ComboboxItem key={String(choice.value)} value={String(choice.value)}>
               {choice.text}
diff --git a/src/components/data-grid/parts/toolbar-content.tsx b/src/components/data-grid/parts/toolbar-content.tsx
index dffdcc8..4d71286 100644
--- a/src/components/data-grid/parts/toolbar-content.tsx
+++ b/src/components/data-grid/parts/toolbar-content.tsx
@@ -3,6 +3,7 @@ import { Button } from '../../button/Button';
 import { ColumnChooser } from './ColumnChooser';
 import { SearchBox } from './SearchBox';
 import { ToolbarSpacer } from './Toolbar';
+import type { ControlLabels } from '../labels';
 import type { ResolvedColumn } from '../engine/columns';
 import type { ReactNode } from 'react';
 import type { DataGridColumnLayout, DataGridLabels, DataGridProps } from '../types';
@@ -20,6 +21,8 @@ export interface ToolbarContentOptions<TRow> {
   /** The layout as shown. */
   layout: DataGridColumnLayout;
   labels: DataGridLabels;
+  /** The words of the search field's own parts, made once per `labels`. */
+  controlLabels: ControlLabels;
   showColumn: (columnId: string, show: boolean) => void;
   /** Adds a row: the button of the toolbar calls it; `null` when the grid cannot add rows, and the button is none. */
   addRow: (() => void) | null;
@@ -58,6 +61,7 @@ export function toolbarContent<TRow>({
   resolved,
   layout,
   labels,
+  controlLabels,
   showColumn,
   addRow,
   addVariant = 'primary',
@@ -70,6 +74,7 @@ export function toolbarContent<TRow>({
       <SearchBox
         key="search"
         label={labels.search}
+        labels={controlLabels.search}
         placeholder={search.placeholder ?? labels.searchPlaceholder}
       />
     ) : null,
diff --git a/src/components/data-grid/types.ts b/src/components/data-grid/types.ts
index 422cdfd..23b629a 100644
--- a/src/components/data-grid/types.ts
+++ b/src/components/data-grid/types.ts
@@ -60,7 +60,7 @@ export interface DataGridSummaryItem<TRow> {
 }
 
 /** The `summary` prop: the totals of the footer (`total`) and of the group rows (`group`). */
-export interface DataGridSummaryProp<TRow> {
+export interface DataGridSummary<TRow> {
   /** The totals of the footer, which sticks at the bottom of a grid with a `height`: every row after the filter. */
   total?: readonly DataGridSummaryItem<TRow>[];
   /** The totals of the group rows: the rows of the group. Not drawn in server mode. */
@@ -153,8 +153,9 @@ export interface DataGridColumnLayout {
 }
 
 /**
- * What the grid keeps for an app to save: the sort, the filter, the page, the chosen rows and the
- * layout of the columns. It holds only what JSON can carry. Later plans add the rest of the state.
+ * What the grid keeps for an app to save, in eight parts: the sort, the filter, the page, the chosen rows,
+ * the layout of the columns, the grouping, the open groups and the open details. It holds only what JSON can
+ * carry. Edits that are not saved are not state: they go through `onSaving`.
  */
 export interface DataGridState {
   sort: readonly DataGridSortItem[];
@@ -191,6 +192,11 @@ export interface DataGridColumnInfo {
 }
 
 export interface DataGridCellContext<TRow, V> {
+  /**
+   * The row. A new row (see `DataGridEditing.initNewRow`) is typed as a `TRow` too, but holds only the fields
+   * `initNewRow()` gave and the ones typed: read a field that may be missing with care (a throw on a new row is
+   * caught, with one warning, and the cell is left blank).
+   */
   row: TRow;
   rowKey: DataGridKey;
   value: V;
@@ -251,13 +257,14 @@ export interface DataGridEditing<TRow> {
    * Whether a row can be edited, for every row or by row; `true` when left out. A grid whose rows cannot be
    * edited (and that cannot delete) draws no column of buttons. A row none of whose fields can be edited (the cells
    * it draws in `row` mode, the form's fields in `form` and `popup`) has no Edit button and no key starts it. A
-   * function that throws counts as `false`, with one warning.
+   * function that throws counts as `false`, with one warning. It is never given a new row: a new row can always
+   * be edited.
    */
   allowUpdating?: boolean | ((row: TRow) => boolean);
   /**
    * Whether a row can be deleted, for every row or by row; `false` when left out. A function that throws counts as
    * `false`, with one warning. A Delete button stands in the column of buttons after Edit, on the rows that are not
-   * being edited.
+   * being edited. It is never given a new row: Delete gives a new row up, with no question and nothing sent.
    */
   allowDeleting?: boolean | ((row: TRow) => boolean);
   /**
@@ -335,10 +342,16 @@ export interface DataGridColumnBase<TRow, V> {
   caption?: string;
   /** How the value is read, compared and shown; `'string'` when left out. */
   dataType?: DataGridDataType;
-  /** Intl options for the column's type, or a function that writes the text of a value. */
+  /**
+   * Intl options for the column's type, or a function that writes the text of a value. A function is given a new row
+   * (see `DataGridEditing.initNewRow`) with the value it holds, when that is not blank: a throw on it is caught,
+   * with one warning, and the cell is left blank.
+   */
   format?:
     Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | ((value: V, row: TRow) => string);
+  /** What the cell holds instead of its text. It is given a new row too: a throw on it is caught, with one warning, and the cell is left blank. */
   cell?(ctx: DataGridCellContext<TRow, V>): ReactNode;
+  /** The side the text is aligned to; by the type when left out. */
   align?: 'start' | 'center' | 'end';
   /** A fixed width in pixels; the column is flexible when left out. */
   width?: number;
@@ -351,7 +364,9 @@ export interface DataGridColumnBase<TRow, V> {
   pinned?: DataGridPin;
   /** `false` hides the column when the layout does not know it yet, as `columnLayout.hidden` does. */
   visible?: boolean;
+  /** Draws the column as the heading of its row (`th scope="row"`); the first one that says so wins. `false` when left out. */
   rowHeader?: boolean;
+  /** Whether the title is a button that sorts; the grid's `allowSorting` when left out. */
   allowSorting?: boolean;
   /**
    * Whether the column's width can be changed (by its handle and by keys); the grid's `allowResizing`
@@ -373,6 +388,7 @@ export interface DataGridColumnBase<TRow, V> {
    * `allowHiding` when left out. A column hidden by `visible: false` or by the layout stays hidden.
    */
   allowHiding?: boolean;
+  /** What the column sorts by instead of its value. It is never given a new row: new rows are not sorted. */
   sortValue?(row: TRow): string | number | boolean | Date | null | undefined;
   lookup?: DataGridLookup;
   /**
@@ -417,7 +433,8 @@ export interface DataGridColumnBase<TRow, V> {
    * Whether the cell can be edited, for every row or by row; `true` when left out. A column that
    * cannot be edited (and a computed one without `setValue`) shows its text where the others edit. A function is
    * given the row as the grid shows it (the saved values with the changes held over them) when the cell is drawn,
-   * started and checked. A function that throws counts as `false`, with one warning.
+   * started and checked; a new row too, with only the fields `initNewRow()` gave and the ones typed. A function that
+   * throws counts as `false`, with one warning, on a new row as on any other.
    */
   allowEditing?: boolean | ((row: TRow) => boolean);
   /**
@@ -529,8 +546,8 @@ export type DataGridColumn<TRow> = DataGridFieldColumn<TRow> | DataGridValueColu
 export type DataGridDensity = 'compact' | 'standard' | 'comfortable';
 
 /**
- * Every word the grid says that is not the caller's: hidden text, and later the names of its
- * controls and what it announces. All of them have an English default.
+ * Every word the grid says that is not the caller's: hidden text, the names of its controls and what it
+ * announces. All of them have an English default.
  */
 export interface DataGridLabels {
   /** The words of a boolean `true`, hidden next to its check, and of a `false`. */
@@ -629,7 +646,7 @@ export interface DataGridLabels {
   applyFilter: string;
   /** The button of the filter popover that applies what it holds. */
   ok: string;
-  /** The button of the filter popover that closes it and changes nothing. */
+  /** The Cancel button of the filter popover, of the dialog that asks before a delete, of the form and of the popup: each closes it and changes nothing. */
   cancel: string;
   /**
    * What is said after the search or a condition changed, a moment after the last change: how many rows
@@ -758,8 +775,6 @@ export interface DataGridLabels {
   deleteDescription(name: string): string;
   /** The button of that dialog that deletes. */
   deleteConfirm: string;
-  /** The button of that dialog that gives up, and of the form. */
-  cancelButton: string;
   /** The alert when a save is refused and the error says no words of its own. */
   saveFailed: string;
   /** The name of the button that takes the save-error alert away. */
@@ -806,17 +821,46 @@ export interface DataGridLabels {
     pattern(caption: string): string;
     email(caption: string): string;
   };
+  /**
+   * The words of the controls the grid draws, which each take words of their own: the DatePickers of the cell
+   * editor, of the filter cell and of the `between` editor, the NumberInput and the Combobox of the editor, and
+   * the SearchFields of the toolbar and of the header filter. The defaults are the controls' own. Merged one level
+   * deep, as `operators`.
+   */
+  controls: {
+    /** The name of the calendar button of a date field, and of its calendar's dialog. */
+    chooseDate: string;
+    /** What a date field says of text that is no date. */
+    invalidDate: string;
+    /** What a date field says of a date outside its `min` and `max`. */
+    unavailableDate: string;
+    /** The name of the calendar's button that shows the month before. */
+    previousMonth: string;
+    /** The name of the calendar's button that shows the month after. */
+    nextMonth: string;
+    /** The name of the button of a number editor that adds one step. */
+    increase: string;
+    /** The name of the button of a number editor that takes one step off. */
+    decrease: string;
+    /** What the list of a Combobox editor says when no choice matches the text. */
+    noResults: string;
+    /** What a Combobox editor announces after the text changed: how many choices match. */
+    results(count: number): string;
+    /** The name of the button that clears a search field (the toolbar's and the header filter's). */
+    clearSearch: string;
+  };
 }
 
 /**
  * The `labels` a caller passes: any of the labels, and of the records (`operators`, `panelOperators`,
- * `summary`, `validation`) any of their words. The records are merged one level deep, so
+ * `summary`, `validation`, `controls`) any of their words. The records are merged one level deep, so
  * `{ operators: { contains: 'Chứa' } }` keeps the other operators' defaults.
  */
 export type DataGridLabelsInput = Partial<
-  Omit<DataGridLabels, 'operators' | 'panelOperators' | 'summary' | 'validation'>
+  Omit<DataGridLabels, 'operators' | 'panelOperators' | 'summary' | 'validation' | 'controls'>
 > & {
   validation?: Partial<DataGridLabels['validation']>;
+  controls?: Partial<DataGridLabels['controls']>;
   operators?: Partial<DataGridLabels['operators']>;
   summary?: Partial<DataGridLabels['summary']>;
   panelOperators?: Partial<DataGridLabels['panelOperators']>;
@@ -825,7 +869,7 @@ export type DataGridLabelsInput = Partial<
 /**
  * What a `toolbar` function is given: the items the toolbar draws by default, each a node to place, or
  * `null` when its feature is off; the spacer is always there. The toolbar gets an item for each part
- * of the grid that has a button: only the ones of this version are here.
+ * of the grid that has a button.
  */
 export interface DataGridToolbarItems {
   /** An element that takes the room between the items before it and the items after it. */
@@ -841,7 +885,8 @@ export interface DataGridToolbarItems {
 }
 
 // The root always has children of its own, so `children` and `dangerouslySetInnerHTML` (which may
-// not go with children) are not props; `onChange` is left to the controlled state of later plans.
+// not go with children) are not props; nor is `onChange`, because the grid has no single value: each part of
+// its state has its own `on…Change`, and `onStateChange` gives them all.
 // This is an object type, so an app can `extend` it.
 export type DataGridProps<TRow> = Omit<
   HTMLAttributes<HTMLDivElement>,
@@ -857,16 +902,19 @@ export type DataGridProps<TRow> = Omit<
   caption?: ReactNode;
   /** What the grid is about, under the caption; it describes the grid. */
   description?: ReactNode;
+  /** The element of the caption; `'h3'` when left out, and when the value is none of these. */
   captionAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
   /**
    * The row above the grid: the caption, then the items of the grid (`groupPanel`, `spacer`, `search`,
-   * `columnChooser`). `false` takes the items away and keeps the caption, which names the grid and the
+   * `columnChooser`, `addButton`). `false` takes the items away and keeps the caption, which names the grid and the
    * pager. A function is given the items, and what it returns is drawn after the caption instead of
    * them: place them in the order you like and add your own. The row is not drawn when it holds no
    * caption, no description and no item.
    */
   toolbar?: false | ((items: DataGridToolbarItems) => ReactNode);
+  /** The look of the Table the grid is drawn in; `'lined'` when left out, and when the value is none of the three. */
   variant?: TableVariant;
+  /** The height of a row: `'standard'` when left out, and when the value is none of the three. */
   density?: DataGridDensity;
   /** The height of a row in pixels, over the one the density and variant give. */
   rowHeight?: number;
@@ -889,12 +937,12 @@ export type DataGridProps<TRow> = Omit<
   /**
    * Whether the data is being loaded. With no row to show, a page of skeleton rows stands in the place
    * of the rows; with rows, they stay under a layer with a spinner. Either way the table is `aria-busy`
-   * and the grid says `labels.loading` once.
+   * and the grid says `labels.loading` once. `false` when left out.
    */
   loading?: boolean;
   /**
-   * A class for the row of a data row. On a new row (it holds only what `initNewRow()` gave and the ones typed) a
-   * throw is caught, with one warning, and the row has no class.
+   * A class for a data row. A new row (it holds only what `initNewRow()` gave and the ones typed) is given too: a
+   * throw on it is caught, with one warning, and the row has no class.
    */
   rowClassName?: (row: TRow) => string | undefined;
   /**
@@ -977,7 +1025,7 @@ export type DataGridProps<TRow> = Omit<
   totalCount?: number;
   /**
    * A row is activated by Enter on a cell that holds no control of its own, or by a double press on
-   * a cell that is not a control: to open the page of the row, for instance.
+   * a cell that is not a control: to open the page of the row, for instance. A new row is never activated.
    */
   onRowActivate?: (row: TRow, key: DataGridKey) => void;
   /**
@@ -1013,7 +1061,10 @@ export type DataGridProps<TRow> = Omit<
    * sees the data that came since). A throw is caught and warned once, and the row starts empty. A new row holds only
    * these fields and the ones typed, though the functions of the columns take it as a `TRow`: give a field that a
    * column's `value`, `format` or `cell`, the `rowClassName` or a custom total reads a value here, or what it drew is
-   * left blank (the throw is caught, with one warning). The same goes for the check of the rules: a value that throws there is a blank.
+   * left blank (the throw is caught, with one warning). The same goes for the check of the rules: a value that throws
+   * there is a blank. A column's `allowEditing` is given a new row too (a throw counts as `false`); `allowUpdating`,
+   * `allowDeleting`, `sortValue`, `rowHasDetail`, `renderDetail` and `onRowActivate` never are, and `validate` and
+   * `setValue` are typed for the fields set so far (`Partial<TRow>`).
    */
   initNewRow?: () => Partial<TRow>;
   /**
@@ -1076,7 +1127,7 @@ export type DataGridProps<TRow> = Omit<
    * it is kept while it says the same, and functions count by identity. In server mode only `total` is
    * drawn, from `totalSummary`.
    */
-  summary?: DataGridSummaryProp<TRow>;
+  summary?: DataGridSummary<TRow>;
   /**
    * Server mode: the values of the footer's totals as the server computed them, by the `id` of each item
    * (the `id` it has, else `${type}:${field}`). An id with no value is blank. Read with `remote` only.
@@ -1090,12 +1141,14 @@ export type DataGridProps<TRow> = Omit<
    * button, and its content stays in sight when the frame is scrolled sideways. A grid with details
    * scrolls as usual: `scrolling="virtual"` is not used with it, since a detail has no fixed height. Pass a
    * stable function (a module function or `useCallback`): it is read by every row. A control the detail
-   * draws is a stop of its own cell, as a control of a custom cell is.
+   * draws is a stop of its own cell, as a control of a custom cell is. It is never given a new row, which has no
+   * detail.
    */
   renderDetail?: (row: TRow) => ReactNode;
   /**
    * Whether a row has a detail; without it every row has one when `renderDetail` is given. A row that has
-   * none draws an empty cell where the button is, and its key in `expandedRows` does nothing.
+   * none draws an empty cell where the button is, and its key in `expandedRows` does nothing. It is never given a
+   * new row, which has no detail.
    */
   rowHasDetail?: (row: TRow) => boolean;
   /** The keys of the rows whose detail is open. Pass it with `onExpandedRowsChange`. */
@@ -1207,9 +1260,9 @@ export interface DataGridHandle {
   /** The element the grid is drawn in, `null` before it is mounted. */
   readonly element: HTMLDivElement | null;
   /**
-   * The state the grid shows, as its last commit left it, so from its first commit on: the sort,
-   * the page as drawn (a page out of range is the nearest), the chosen keys and the layout of the
-   * columns as shown.
+   * The state the grid shows, as its last commit left it, so from its first commit on, all eight parts
+   * of `DataGridState`: the sort, the filter, the page as drawn (a page out of range is the nearest), the
+   * chosen keys, the layout of the columns as shown, the grouping, the open groups and the open details.
    */
   getState(): DataGridState;
   /** Moves the keyboard focus to the active cell, and scrolls it into view. */
````

Diff của bảng Labels trong `DataGrid.mdx` phần lớn là khoảng trắng (prettier dàn lại bảng khi ô khoá rộng nhất, `cancelButton`, bị bỏ): đọc nó bằng `git diff -w`.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check && npx tsc --noEmit -p . && pnpm check:name
pnpm vitest run --project unit --maxWorkers=3 src/components/data-grid
pnpm vitest run --project unit-react18 --maxWorkers=3 src/components/data-grid
for b in chromium firefox webkit; do
  pnpm vitest run --project storybook-light --browser=$b src/components/data-grid
  pnpm vitest run --project storybook-dark --browser=$b src/components/data-grid
done
pnpm build && pnpm check:package
pnpm build-storybook && pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`, `tsc -p .`, `check:name`: PASS.
- `unit` (`src/components/data-grid`): 82 file, 2953 PASS, test kiểu không lỗi; `unit-react18`: 45 file, 1993 PASS. Claude chạy lại cả ba project trên commit nháp: `unit` 234 file, 5775 PASS (1 skipped); `unit-react18` 120 file, 4281 PASS (4 skipped); `scripts` 7 file, 261 PASS; mọi bước của `check-p6g.sh` pass (bản ghi `task-1-claude-check.txt`).
- Story data-grid: 138 PASS ở mỗi lượt (sáu lượt). Không file story nào đổi.
- `pnpm build && pnpm check:package`: PASS với ngưỡng cũ; "JS (DataGrid)" 96.88 kB (+0.35 kB), JS (all exports) 58.02 kB, CSS 20.97 kB.
- `pnpm check:docs-tables`: `Docs tables: no table built as text in 225 files.`
- Claude đọc diff: đường đi của nhãn, mặc định bằng mặc định của control, từng câu JSDoc đối chiếu code (tám phần của `DataGridState`, `captionAs` `'h3'`, `variant` `'lined'`).
- `check:contrast`, fixture không chạy: không cặp tương phản, không fixture nào đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  src/components/data-grid/DataGrid.controls-words.test.tsx \
  src/components/data-grid/DataGrid.mdx \
  src/components/data-grid/DataGrid.newrow-callbacks.test.tsx \
  src/components/data-grid/DataGrid.summary.test.tsx \
  src/components/data-grid/DataGrid.test-d.ts \
  src/components/data-grid/DataGrid.tsx \
  src/components/data-grid/engine/column-menu.ts \
  src/components/data-grid/engine/columns.ts \
  src/components/data-grid/engine/layout.ts \
  src/components/data-grid/engine/summary.ts \
  src/components/data-grid/grid-context.ts \
  src/components/data-grid/hooks/use-grid-context-value.ts \
  src/components/data-grid/hooks/use-grid-summary.ts \
  src/components/data-grid/hooks/use-renewal-warning.ts \
  src/components/data-grid/index.exports.test.ts \
  src/components/data-grid/index.ts \
  src/components/data-grid/labels.test.ts \
  src/components/data-grid/labels.ts \
  src/components/data-grid/normalize.ts \
  src/components/data-grid/parts/BetweenEditor.tsx \
  src/components/data-grid/parts/ConfirmDelete.tsx \
  src/components/data-grid/parts/EditForm.tsx \
  src/components/data-grid/parts/EditPopup.tsx \
  src/components/data-grid/parts/FilterCell.tsx \
  src/components/data-grid/parts/HeaderFilter.tsx \
  src/components/data-grid/parts/SearchBox.tsx \
  src/components/data-grid/parts/editors/CellEditor.tsx \
  src/components/data-grid/parts/toolbar-content.tsx \
  src/components/data-grid/types.ts
```
```bash
git commit -m "feat(data-grid): freeze the API before 0.5.0: controls words, one Cancel, DataGridSummary" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 2: xuất CSV: `csvExport`, `exportCsv()`, `exportable` và nút xuất

Spec §3.5 (dòng `csv.ts`), §3.11, §4.3 G1 "Chọn cột, xuất CSV", §4.6 `DownloadIcon`, §5, §6.3 (`csvExport`, `exportable`, `exportCsv`, `exportButton`, nhãn `exportCsv`, "Xuất CSV"), §7 lớp 1, "Hiệu năng"; §4.9 dòng 2 của spec 0+1. Mockup G1 (`mk-o1`): nút xuất. Bắt đầu từ commit của Task 1.
- **Engine** (`engine/csv.ts`, `rawText`, `PipelineResult.savedRows`): RFC 4180, BOM, CRLF sau mọi bản ghi, chặn công thức, dòng đã lưu theo thứ tự đang hiện, cột theo thứ tự bố cục (phát hiện 7). Hiệu năng ở 10 000 dòng × 9 cột (phát hiện 8).
- **Handle** `exportCsv(options?)`: một hàm suốt đời grid, đọc lần commit cuối qua ref; tuỳ chọn của lời gọi đặt lên `csvExport` (OQ 9); chỉ `download: true` hay `fileName` của chính lời gọi mới tải về; `downloadText` (`src/internal/download.ts`).
- **Nút xuất** (`exportButton`, `parts/ExportButton.tsx`, `DownloadIcon`): IconButton `secondary` `md` sau nút chọn cột, trước nút thêm; nhấn gọi `exportCsv({ download: true })`. `G1` bật `csvExport` (OQ 12): 8 ảnh của nó đổi một lần.
- **Không đổi gì khác:** không `csvExport` thì không nút; các story khác giữ thanh công cụ; nhãn dòng 2 của tương phản thêm nút xuất (không cặp mới).
- Docs: mục "CSV export" của `DataGrid.mdx` và các bảng. Spec §6.3 "Xuất CSV" và spec 0+1 §4.9 dòng 2 được sửa (phát hiện 21).

**Files:**
- Create: `src/components/data-grid/engine/csv.ts`, `engine/csv.test.ts`, `hooks/use-csv-export.ts`, `parts/ExportButton.tsx`, `DataGrid.csv.test.tsx`; `src/internal/download.ts`, `src/internal/download.test.ts`
- Modify: `src/components/data-grid/DataGrid.tsx`, `types.ts`, `index.ts`, `labels.ts`, `normalize.ts`, `DataGrid.mdx`, `engine/pipeline.ts`, `engine/pipeline.test.ts`, `engine/values.ts`, `engine/values.test.ts`, `engine/perf.test.ts`, `hooks/use-normalized-props.ts`, `parts/toolbar-content.tsx`, `DataGrid.chooser.test.tsx`, `DataGrid.loading.test.tsx`, `DataGrid.renders.test.tsx`, `DataGrid.test-d.ts`, `columns.test-d.ts`, `DataGridColumns.stories.tsx`, `DataGridEditing.stories.tsx`, `DataGridFiltering.stories.tsx`, `DataGridGrouping.stories.tsx`; `src/internal/icons.tsx`, `src/internal/icons.test.tsx`; `src/styles/components/data-grid.css`; `src/docs/Accessibility.mdx`; `scripts/check-dist-css.ts`, `scripts/contrast-exceptions.ts`; `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`, `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`

**Interfaces:**
- Produces trong `types.ts` (export qua `data-grid/index.ts`; ra gốc gói ở Task 4), các tên công khai mới duy nhất của G:
  - `DataGridCsvOptions { fileName?: string; separator?: ',' | ';' | '\t'; values?: 'formatted' | 'raw'; bom?: boolean; selectedOnly?: boolean; escapeFormulas?: boolean }`.
  - `DataGridProps.csvExport?: boolean | DataGridCsvOptions`; trường cột `exportable?: boolean`.
  - `DataGridHandle.exportCsv(options?: DataGridCsvOptions & { download?: boolean }): string` (handle mười một thành viên).
  - `DataGridToolbarItems.exportButton: ReactNode` (`null` khi không có `csvExport`); thứ tự mặc định `groupPanel`, `spacer`, `search`, `columnChooser`, `exportButton`, `addButton`.
  - `DataGridLabels.exportCsv` "Export CSV".
- Nội bộ:
  - `engine/csv.ts`: `CsvColumn<TRow> { caption; text(row); guard }`, `CsvOptions { separator; bom; escapeFormulas }`, `csvField(text, separator, guard)`, `toCsv(rows, columns, options)`, `csvColumns(columns, values, textOf)`.
  - `engine/values.ts`: `rawText(value, dataType)` (cùng `isoDayOf` riêng với `toFilterKey`, `formatValue`). `engine/pipeline.ts`: `PipelineResult.savedRows`.
  - `hooks/use-csv-export.ts`: `CsvSource<TRow>`, `sameCsvExport(a, b)`, `useCsvExport(source)`. `normalize.ts`: `csvOptionsOf(given, 'csvExport' | 'exportCsv')`. `parts/ExportButton.tsx`: `ExportButton` (`memo`, `{ label, onExport }`).
  - `src/internal/download.ts`: `downloadText(text, fileName, type)` (không directive); `src/internal/icons.tsx`: `DownloadIcon`.
- DOM và CSS: lớp `flg-data-grid-export-button` (`flex: none` cùng nút chọn cột); không quy tắc forced colours mới.
- Story: `CsvExport` (`DataGridFiltering.stories.tsx`, `no-visual`); `G1` đổi (nút xuất, play mới).
- Consumes: `textOf` và `readOfRow` của grid, `isDataColumn`, `isSavedRow`, `useWriteOnCommit`, `useKept`, `devWarn`, `IconButton`, `TooltipRoot`, `TooltipContent`.
- Task sau dùng: Task 4 (export `DataGridCsvOptions`), Task 5 (`csvExport={{ fileName: 'lumen-orders.csv' }}`, `ExampleExport`), Task 6 (Accessibility), Task 7 (`checkGrid` tải CSV), Task 8 (changeset).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/data-grid/DataGrid.chooser.test.tsx b/src/components/data-grid/DataGrid.chooser.test.tsx
index 621b8da..9a665cb 100644
--- a/src/components/data-grid/DataGrid.chooser.test.tsx
+++ b/src/components/data-grid/DataGrid.chooser.test.tsx
@@ -131,7 +131,11 @@ const open = () => click(button()!);
 
 const CAPTION = 'flg-card-header flg-data-grid-caption';
 const SPACER = 'flg-data-grid-toolbar-spacer';
+const BOM = String.fromCharCode(0xfeff);
 const CHOOSER = 'flg-button flg-data-grid-chooser-button';
+/** The text of a blob with its byte order mark: `Blob.text()` decodes as UTF-8 and drops it. */
+const blobText = async (blob: Blob) =>
+  new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());
 
 describe('the button', () => {
   it('is an icon button named "Columns" that opens a dialog', () => {
@@ -492,7 +496,7 @@ describe('the toolbar', () => {
     expect(toolbar()).toBeNull();
   });
 
-  it('with a function gets the five items, and draws what it returns after the caption', () => {
+  it('with a function gets the six items, and draws what it returns after the caption', () => {
     const received = vi.fn();
     render(
       <Orders
@@ -512,6 +516,7 @@ describe('the toolbar', () => {
     expect(Object.keys(items).sort()).toEqual([
       'addButton',
       'columnChooser',
+      'exportButton',
       'groupPanel',
       'search',
       'spacer',
@@ -581,3 +586,139 @@ describe('the toolbar', () => {
     expect(toolbarPopovers()).toHaveLength(0);
   });
 });
+
+// The export button (spec phase 6 §4.3 G1, §6.3 "Xuất CSV"): the third item of the toolbar's end, between the chooser
+// and the add button, drawn for `csvExport`. What it writes is proven in `DataGrid.csv.test.tsx`.
+describe('the export button', () => {
+  const EXPORT = 'flg-button flg-data-grid-export-button';
+  const ADD = 'flg-button';
+  const exportButton = () => screen.queryByRole('button', { name: 'Export CSV' });
+  let blobs: Blob[];
+  let named: Array<string | null>;
+  beforeEach(() => {
+    blobs = [];
+    named = [];
+    URL.createObjectURL = (blob: Blob | MediaSource) => {
+      blobs.push(blob as Blob);
+      return 'blob:x';
+    };
+    URL.revokeObjectURL = () => {};
+    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
+      this: HTMLAnchorElement,
+    ) {
+      named.push(this.getAttribute('download'));
+    });
+  });
+  afterEach(() => {
+    delete (URL as { createObjectURL?: unknown }).createObjectURL;
+    delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
+  });
+
+  it('is not there without csvExport, and not for false', () => {
+    const { unmount } = render(<Orders />);
+    expect(exportButton()).toBeNull();
+    unmount();
+    render(<Orders csvExport={false} />);
+    expect(exportButton()).toBeNull();
+  });
+
+  it('is an icon button named "Export CSV", secondary and medium, with an icon', () => {
+    render(<Orders csvExport />);
+    const trigger = exportButton()!;
+    expect(trigger).toHaveAttribute('data-variant', 'secondary');
+    expect(trigger).toHaveAttribute('data-size', 'md');
+    expect(trigger).toHaveAttribute('data-icon-only');
+    expect(trigger).toHaveClass('flg-data-grid-export-button');
+    expect(trigger.querySelector('svg')).toBeInTheDocument();
+    // The tooltip says the name the button has, so it does not describe it.
+    expect(trigger).not.toHaveAttribute('aria-describedby');
+  });
+
+  it('is drawn for an object of options, even an empty one', () => {
+    render(<Orders csvExport={{}} />);
+    expect(exportButton()).toBeInTheDocument();
+  });
+
+  it('has the words of the label', () => {
+    render(<Orders csvExport labels={{ exportCsv: 'CSV herunterladen' }} />);
+    expect(screen.getByRole('button', { name: 'CSV herunterladen' })).toBeInTheDocument();
+    expect(exportButton()).toBeNull();
+  });
+
+  it('stands after the chooser and before the add button', () => {
+    render(
+      <Orders
+        csvExport
+        searchPanel
+        editing={{ mode: 'row', allowAdding: true }}
+        onSaving={() => {}}
+      />,
+    );
+    expect(classesOfToolbar()).toEqual([
+      CAPTION,
+      SPACER,
+      expect.stringContaining('flg-search'),
+      CHOOSER,
+      EXPORT,
+      ADD,
+    ]);
+  });
+
+  it('is an item that makes the toolbar drawn, with no caption and nothing else', () => {
+    render(<Orders csvExport columnChooser={false} caption={undefined} aria-label="Orders" />);
+    expect(classesOfToolbar()).toEqual([SPACER, EXPORT]);
+  });
+
+  it('is given to a toolbar function as `exportButton`, and is null without csvExport', () => {
+    const received = vi.fn();
+    const { unmount } = render(
+      <Orders
+        csvExport
+        toolbar={(items) => {
+          received(items);
+          return [items.spacer, items.exportButton];
+        }}
+      />,
+    );
+    expect(received.mock.calls[0]![0].exportButton).not.toBeNull();
+    expect(exportButton()).toBeInTheDocument();
+    unmount();
+    received.mockClear();
+    render(<Orders toolbar={(items) => (received(items), items.spacer)} />);
+    expect(received.mock.calls[0]![0].exportButton).toBeNull();
+  });
+
+  it('is dropped by `toolbar={false}`', () => {
+    render(<Orders csvExport toolbar={false} />);
+    expect(exportButton()).toBeNull();
+  });
+
+  it('downloads once for a press, as data.csv, with the heading row and the BOM', async () => {
+    render(<Orders csvExport />);
+    click(exportButton()!);
+    expect(named).toEqual(['data.csv']);
+    expect(blobs).toHaveLength(1);
+    expect(blobs[0]!.type).toBe('text/csv;charset=utf-8');
+    expect(await blobText(blobs[0]!)).toBe(
+      `${BOM}Order,Customer,Qty,Total\r\nDH-1030,Nguyễn Minh,4,"1,250,000"\r\nDH-1029,Trần Hải,1,"890,000"\r\n`,
+    );
+  });
+
+  it('downloads with the options of csvExport, the same ones the handle merges', async () => {
+    render(
+      <Orders csvExport={{ fileName: 'orders.csv', separator: ';', values: 'raw', bom: false }} />,
+    );
+    click(exportButton()!);
+    expect(named).toEqual(['orders.csv']);
+    expect(await blobText(blobs[0]!)).toBe(
+      'Order;Customer;Qty;Total\r\nDH-1030;Nguyễn Minh;4;1250000\r\nDH-1029;Trần Hải;1;890000\r\n',
+    );
+  });
+
+  it('downloads the rows the grid shows now, after a search', async () => {
+    render(<Orders csvExport defaultFilter={{ search: 'Hải' }} />);
+    click(exportButton()!);
+    expect(await blobText(blobs[0]!)).toContain('DH-1029');
+    expect(await blobText(blobs[0]!)).not.toContain('DH-1030');
+  });
+});
diff --git a/src/components/data-grid/DataGrid.csv.test.tsx b/src/components/data-grid/DataGrid.csv.test.tsx
new file mode 100644
index 0000000..3b96d95
--- /dev/null
+++ b/src/components/data-grid/DataGrid.csv.test.tsx
@@ -0,0 +1,724 @@
+import { act, fireEvent, render, screen, within } from '@testing-library/react';
+import { createRef } from 'react';
+import type { Ref } from 'react';
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
+import { DataGrid } from './DataGrid';
+import type { DataGridColumn, DataGridCsvOptions, DataGridHandle, DataGridProps } from './index';
+
+// The CSV export (spec phase 6 §6.3 "Xuất CSV", Plan G): one case for each line of what it meets, through the
+// handle's `exportCsv`, which the toolbar's button calls too (`DataGrid.chooser.test.tsx` proves that). What needs a
+// real download (the `Blob` and the anchor) is stubbed here and read in the stories of the three engines.
+
+beforeEach(() => {
+  resetDevWarnings();
+  Element.prototype.scrollIntoView = () => {};
+  HTMLElement.prototype.checkVisibility = () => true;
+});
+afterEach(() => {
+  Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility');
+  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
+  vi.restoreAllMocks();
+  vi.unstubAllGlobals();
+});
+
+interface Order {
+  id: string;
+  customer: string;
+  status: number;
+  placed: string;
+  at: string;
+  qty: number | null;
+  price: number;
+  total: number;
+  paid: boolean;
+}
+
+const STATUSES = [
+  { id: 1, name: 'New' },
+  { id: 2, name: 'Processing' },
+  { id: 3, name: 'Delivered' },
+];
+
+const ORDERS: Order[] = [
+  {
+    id: 'DH-1',
+    customer: 'An',
+    status: 1,
+    placed: '2026-11-05',
+    at: '2026-11-05T17:30:00Z',
+    qty: 3,
+    price: 10,
+    total: 1250000.5,
+    paid: true,
+  },
+  {
+    id: 'DH-2',
+    customer: 'Bình',
+    status: 2,
+    placed: '2026-11-04',
+    at: '2026-11-04T01:00:00Z',
+    qty: 5,
+    price: 20,
+    total: 890000,
+    paid: false,
+  },
+  {
+    id: 'DH-3',
+    customer: 'Chi',
+    status: 1,
+    placed: '2026-11-03',
+    at: '2026-11-03T10:00:00Z',
+    qty: 1,
+    price: 30,
+    total: 15400000,
+    paid: true,
+  },
+  {
+    id: 'DH-4',
+    customer: 'Dung, Khang',
+    status: 3,
+    placed: '2026-11-02',
+    at: '2026-11-02T23:59:59Z',
+    qty: 7,
+    price: 40,
+    total: -120,
+    paid: false,
+  },
+  {
+    id: 'DH-5',
+    customer: '=Hà',
+    status: 2,
+    placed: '2026-11-01',
+    at: '2026-11-01T00:00:00Z',
+    qty: null,
+    price: 50,
+    total: 5,
+    paid: true,
+  },
+  {
+    id: 'DH-6',
+    customer: 'Em "E"',
+    status: 1,
+    placed: '2026-10-31',
+    at: '2026-10-31T12:00:00Z',
+    qty: 2,
+    price: 60,
+    total: 0,
+    paid: false,
+  },
+];
+
+const COLUMNS: DataGridColumn<Order>[] = [
+  { field: 'id', caption: 'Order', rowHeader: true, width: 100 },
+  { field: 'customer', caption: 'Customer', width: 140 },
+  {
+    field: 'status',
+    caption: 'Status',
+    width: 120,
+    dataType: 'number',
+    lookup: { items: STATUSES, valueField: 'id', displayField: 'name' },
+  },
+  { field: 'placed', caption: 'Placed', dataType: 'date', width: 110 },
+  { field: 'at', caption: 'At', dataType: 'datetime', width: 140 },
+  { field: 'qty', caption: 'Qty', dataType: 'number', width: 70 },
+  { field: 'total', caption: 'Total', dataType: 'number', width: 110 },
+  { field: 'paid', caption: 'Paid', dataType: 'boolean', width: 70 },
+];
+
+function Orders({
+  gridRef,
+  ...props
+}: Partial<DataGridProps<Order>> & { gridRef?: Ref<DataGridHandle> }) {
+  return (
+    <DataGrid
+      ref={gridRef}
+      data={ORDERS}
+      rowKey="id"
+      columns={COLUMNS}
+      caption="Orders"
+      paging={false}
+      {...props}
+    />
+  );
+}
+
+const BOM = String.fromCharCode(0xfeff);
+/** The text of a blob with its byte order mark: `Blob.text()` decodes as UTF-8 and drops it. */
+const blobText = async (blob: Blob) =>
+  new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+
+/** Renders the grid and gives the handle's `exportCsv`, called in an `act` as an app's press would be. */
+function setup(props: Partial<DataGridProps<Order>> = {}) {
+  const gridRef = createRef<DataGridHandle>();
+  const view = render(<Orders gridRef={gridRef} {...props} />);
+  const exportCsv = (options?: Parameters<DataGridHandle['exportCsv']>[0]) => {
+    let text = '';
+    act(() => {
+      text = gridRef.current!.exportCsv(options);
+    });
+    return text;
+  };
+  return { ...view, exportCsv, gridRef };
+}
+
+/** The records of a CSV: it must end with a CRLF, and its BOM is taken off. */
+function records(csv: string): string[] {
+  const text = csv.startsWith(BOM) ? csv.slice(1) : csv;
+  expect(text.endsWith('\r\n')).toBe(true);
+  return text.slice(0, -2).split('\r\n');
+}
+/** The first field of each record but the heading: the order ids, which hold no comma. */
+const ids = (csv: string) =>
+  records(csv)
+    .slice(1)
+    .map((record) => record.split(',')[0]);
+const heading = (csv: string) => records(csv)[0];
+
+describe('the rows', () => {
+  it('writes every row, in the order of the data, with a heading row, a CRLF after every record and the BOM first', () => {
+    const { exportCsv } = setup();
+    const csv = exportCsv();
+    expect(csv.startsWith(`${BOM}Order,Customer,Status,Placed,At,Qty,Total,Paid\r\n`)).toBe(true);
+    expect(ids(csv)).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-4', 'DH-5', 'DH-6']);
+  });
+
+  it('writes only the rows the search keeps', () => {
+    const { exportCsv } = setup({ defaultFilter: { search: 'khang' } });
+    expect(ids(exportCsv())).toEqual(['DH-4']);
+  });
+
+  it('writes only the rows the conditions of a column keep', () => {
+    const { exportCsv } = setup({
+      defaultFilter: { columns: { qty: { operator: '>', value: 4 } } },
+    });
+    expect(ids(exportCsv())).toEqual(['DH-2', 'DH-4']);
+  });
+
+  it('writes the rows in the order of the sort', () => {
+    const { exportCsv } = setup({ defaultSort: [{ field: 'qty', direction: 'desc' }] });
+    // A blank sorts last in both directions.
+    expect(ids(exportCsv())).toEqual(['DH-4', 'DH-2', 'DH-1', 'DH-6', 'DH-3', 'DH-5']);
+  });
+
+  it('writes the rows of every page, not the ones of the page shown', () => {
+    const { exportCsv } = setup({ paging: { pageSize: 2 } });
+    expect(screen.getAllByRole('row')).toHaveLength(1 + 2);
+    expect(ids(exportCsv())).toHaveLength(6);
+  });
+
+  it('writes the rows of a grid that scrolls its rows (virtual) too, all of them', () => {
+    const { exportCsv } = setup({ scrolling: 'virtual', height: 200, paging: undefined });
+    expect(ids(exportCsv())).toHaveLength(6);
+  });
+
+  it('writes a grouped grid flat, in the order of its groups, with no group row and the rows of a closed group', () => {
+    const { exportCsv } = setup({
+      defaultGrouping: [{ field: 'status', direction: 'asc' }],
+      defaultExpandedGroups: { allExpanded: false, except: [] },
+    });
+    // Every group is closed: three group rows and no data row on the screen.
+    expect(document.querySelectorAll('tbody > tr')).toHaveLength(3);
+    // The status is the third field; a semicolon keeps the comma of a customer's name out of the way.
+    const csv = exportCsv({ separator: ';' });
+    const statuses = records(csv)
+      .slice(1)
+      .map((record) => record.split(';')[2]);
+    expect(statuses).toHaveLength(6);
+    // Each status is in one run: the rows come group by group.
+    const runs = statuses.filter((status, at) => status !== statuses[at - 1]);
+    expect(runs).toHaveLength(3);
+    expect(new Set(runs).size).toBe(3);
+    expect(records(csv).some((record) => record.includes('(2)') || record.includes('(3)'))).toBe(
+      false,
+    );
+  });
+
+  it('writes the chosen rows only with selectedOnly, among the rows the search and the filter keep', () => {
+    const { exportCsv } = setup({
+      selectionMode: 'multiple',
+      defaultSelectedKeys: ['DH-2', 'DH-4'],
+    });
+    expect(ids(exportCsv({ selectedOnly: true }))).toEqual(['DH-2', 'DH-4']);
+    expect(ids(exportCsv())).toHaveLength(6);
+  });
+
+  it('leaves out a chosen row the filter hides, and writes the heading alone when nothing is chosen', () => {
+    const { exportCsv } = setup({
+      selectionMode: 'multiple',
+      defaultSelectedKeys: ['DH-2', 'DH-4'],
+      defaultFilter: { search: 'khang' },
+    });
+    expect(ids(exportCsv({ selectedOnly: true }))).toEqual(['DH-4']);
+    const none = setup({ selectionMode: 'multiple' });
+    expect(ids(none.exportCsv({ selectedOnly: true }))).toEqual([]);
+    expect(heading(none.exportCsv({ selectedOnly: true }))).toBe(
+      'Order,Customer,Status,Placed,At,Qty,Total,Paid',
+    );
+  });
+
+  it('writes the heading alone for selectedOnly in a grid that cannot choose, whatever keys it was given', () => {
+    const { exportCsv } = setup({ selectionMode: 'none', defaultSelectedKeys: ['DH-2'] });
+    expect(ids(exportCsv({ selectedOnly: true }))).toEqual([]);
+  });
+
+  it('writes the rows of the page it was given in server mode, and warns once that it is the page', () => {
+    const warn = spyWarn();
+    const { exportCsv } = setup({ remote: true, totalCount: 50, data: ORDERS.slice(0, 3) });
+    expect(ids(exportCsv())).toEqual(['DH-1', 'DH-2', 'DH-3']);
+    exportCsv();
+    const said = warn.mock.calls.filter(([message]) => String(message).includes('exportCsv()'));
+    expect(said).toHaveLength(1);
+    expect(String(said[0]![0])).toBe(
+      `${WARN_PREFIX} <DataGrid> exportCsv() in server mode writes only the rows of the current page; export the whole data on the server.`,
+    );
+  });
+
+  it('writes the rows of a grid with no data as the heading alone', () => {
+    const { exportCsv } = setup({ data: [] });
+    expect(ids(exportCsv())).toEqual([]);
+    expect(heading(exportCsv())).toBe('Order,Customer,Status,Placed,At,Qty,Total,Paid');
+  });
+
+  it('writes a row that is loading as held: the rows the grid holds now', () => {
+    const { exportCsv } = setup({ loading: true });
+    expect(ids(exportCsv())).toHaveLength(6);
+  });
+});
+
+describe('the columns', () => {
+  it('writes the shown columns in the order drawn, and leaves a hidden one out', () => {
+    const { exportCsv } = setup({
+      defaultColumnLayout: { order: ['id', 'total', 'customer'], hidden: ['paid', 'at'] },
+    });
+    expect(heading(exportCsv())).toBe('Order,Total,Customer,Status,Placed,Qty');
+  });
+
+  it('writes a column at its place in the layout when it is grouped, as if it were shown', () => {
+    const { exportCsv } = setup({
+      defaultGrouping: [{ field: 'customer', direction: 'asc' }],
+    });
+    // The grouped column is not drawn; the CSV keeps it where the layout puts it.
+    expect(heading(exportCsv())).toBe('Order,Customer,Status,Placed,At,Qty,Total,Paid');
+  });
+
+  it('puts a column pinned to the right last and a column pinned to the left first', () => {
+    const { exportCsv } = setup({
+      defaultColumnLayout: { pinned: { customer: 'right', qty: 'left' } },
+    });
+    expect(heading(exportCsv())).toBe('Qty,Order,Status,Placed,At,Total,Paid,Customer');
+  });
+
+  it('writes no column the grid adds for itself: the boxes, the handles, the buttons of rows', () => {
+    const { exportCsv } = setup({
+      selectionMode: 'multiple',
+      rowReorder: true,
+      renderDetail: () => 'detail',
+      editing: { mode: 'row', allowDeleting: true },
+      onSaving: () => {},
+    });
+    expect(heading(exportCsv())).toBe('Order,Customer,Status,Placed,At,Qty,Total,Paid');
+  });
+
+  it('leaves out a column that says exportable false, and keeps one whose value is not a boolean', () => {
+    const columns: DataGridColumn<Order>[] = COLUMNS.map((column) =>
+      'field' in column && column.field === 'customer'
+        ? { ...column, exportable: false }
+        : 'field' in column && column.field === 'at'
+          ? { ...column, exportable: 'no' as unknown as boolean }
+          : column,
+    );
+    const { exportCsv } = setup({ columns });
+    expect(heading(exportCsv())).toBe('Order,Status,Placed,At,Qty,Total,Paid');
+  });
+
+  it('writes the heading row alone with no column, as the BOM and nothing else without it', () => {
+    const columns: DataGridColumn<Order>[] = [{ field: 'id', caption: 'Order', exportable: false }];
+    const { exportCsv } = setup({ columns });
+    expect(exportCsv()).toBe(BOM);
+    expect(exportCsv({ bom: false })).toBe('');
+  });
+
+  it('writes the caption of a column, and the id of a column that has none', () => {
+    const columns: DataGridColumn<Order>[] = [
+      { field: 'id' },
+      { id: 'twice', caption: 'Twice', value: (row) => (row.qty ?? 0) * 2, dataType: 'number' },
+    ];
+    const { exportCsv } = setup({ columns });
+    expect(heading(exportCsv())).toBe('id,Twice');
+  });
+
+  it('quotes and guards a caption as it does a field', () => {
+    const columns: DataGridColumn<Order>[] = [
+      { field: 'id', caption: '=SUM(A1)' },
+      { field: 'customer', caption: 'Name, full' },
+    ];
+    const { exportCsv } = setup({ columns });
+    expect(heading(exportCsv())).toBe(`'=SUM(A1),"Name, full"`);
+    expect(heading(exportCsv({ escapeFormulas: false }))).toBe(`=SUM(A1),"Name, full"`);
+  });
+});
+
+describe('the values', () => {
+  it('writes the text of the cells by default: a lookup by its words, a date and a number by the grid locale', () => {
+    const { exportCsv } = setup({ locale: 'vi-VN', defaultFilter: { search: 'DH-1' } });
+    const [, record] = records(exportCsv());
+    const total = new Intl.NumberFormat('vi-VN').format(1250000.5);
+    const placed = new Intl.DateTimeFormat('vi-VN', {
+      year: 'numeric',
+      month: '2-digit',
+      day: '2-digit',
+      timeZone: 'UTC',
+    }).format(Date.UTC(2026, 10, 5));
+    expect(record).toContain(`New,${placed},`);
+    // A number of the locale with a decimal comma is quoted when the separator is a comma.
+    expect(record).toContain(`"${total}"`);
+    expect(record!.endsWith(',Yes')).toBe(true);
+  });
+
+  it('writes a datetime in the time zone of the grid', () => {
+    const utc = setup({ timeZone: 'UTC', defaultFilter: { search: 'DH-1' } });
+    const hanoi = setup({ timeZone: 'Asia/Ho_Chi_Minh', defaultFilter: { search: 'DH-1' } });
+    const written = (zone: string) =>
+      new Intl.DateTimeFormat('en-US', {
+        dateStyle: 'short',
+        timeStyle: 'short',
+        timeZone: zone,
+      }).format(Date.UTC(2026, 10, 5, 17, 30));
+    // 17:30 UTC is 00:30 of the next day in Ha Noi: the two texts are not the same.
+    expect(written('UTC')).not.toBe(written('Asia/Ho_Chi_Minh'));
+    expect(utc.exportCsv()).toContain(`"${written('UTC')}"`);
+    expect(hanoi.exportCsv()).toContain(`"${written('Asia/Ho_Chi_Minh')}"`);
+  });
+
+  it('writes a lookup by its words, and by its value in raw', () => {
+    const { exportCsv } = setup({ defaultFilter: { search: 'DH-2' } });
+    expect(records(exportCsv())[1]!.split(',')[2]).toBe('Processing');
+    expect(records(exportCsv({ values: 'raw' }))[1]!.split(',')[2]).toBe('2');
+  });
+
+  it('writes the raw values: a number with a dot, a day as ISO, an instant in UTC, a boolean as true or false', () => {
+    const { exportCsv } = setup({ locale: 'vi-VN', timeZone: 'Asia/Ho_Chi_Minh' });
+    const [, first, second] = records(exportCsv({ values: 'raw' }));
+    expect(first).toBe('DH-1,An,1,2026-11-05,2026-11-05T17:30:00.000Z,3,1250000.5,true');
+    expect(second).toBe('DH-2,Bình,2,2026-11-04,2026-11-04T01:00:00.000Z,5,890000,false');
+  });
+
+  it('writes a blank value as nothing in both', () => {
+    const { exportCsv } = setup({ defaultFilter: { search: 'DH-5' } });
+    expect(records(exportCsv())[1]!.split(',')).toContain('');
+    expect(records(exportCsv({ values: 'raw' }))[1]).toBe(
+      `DH-5,'=Hà,2,2026-11-01,2026-11-01T00:00:00.000Z,,5,true`,
+    );
+  });
+
+  it('writes a column that is computed, by its value or its text', () => {
+    const columns: DataGridColumn<Order>[] = [
+      { field: 'id' },
+      {
+        id: 'amount',
+        caption: 'Amount',
+        dataType: 'number',
+        value: (row) => (row.qty ?? 0) * row.price,
+      },
+      {
+        id: 'label',
+        caption: 'Label',
+        value: (row) => `${row.id}!`,
+        format: (value) => `[${value}]`,
+      },
+    ];
+    const { exportCsv } = setup({ columns, defaultFilter: { search: 'DH-2' } });
+    expect(records(exportCsv())[1]).toBe('DH-2,100,[DH-2!]');
+    expect(records(exportCsv({ values: 'raw' }))[1]).toBe('DH-2,100,DH-2!');
+  });
+
+  it('writes a boolean by the words of labels, and true or false in raw', () => {
+    const { exportCsv } = setup({
+      labels: { yes: 'Có', no: 'Không' },
+      defaultFilter: { search: 'DH-2' },
+    });
+    expect(records(exportCsv())[1]!.endsWith(',Không')).toBe(true);
+    expect(records(exportCsv({ values: 'raw' }))[1]!.endsWith(',false')).toBe(true);
+  });
+
+  it('writes the text of a custom cell, not what it draws', () => {
+    const columns: DataGridColumn<Order>[] = [
+      { field: 'id', cell: ({ text }) => <b>{`<<${text}>>`}</b> },
+      { field: 'customer' },
+    ];
+    const { exportCsv } = setup({ columns, defaultFilter: { search: 'DH-2' } });
+    expect(screen.getByText('<<DH-2>>')).toBeInTheDocument();
+    expect(records(exportCsv())[1]).toBe('DH-2,Bình');
+  });
+
+  it('writes the text a format function gives in raw too when the type cannot read the value', () => {
+    const columns: DataGridColumn<Order>[] = [
+      { field: 'id' },
+      {
+        id: 'parts',
+        caption: 'Parts',
+        dataType: 'number',
+        value: (row) => ({ qty: row.qty }),
+        format: (value) => `qty ${(value as { qty: number }).qty}`,
+      },
+    ];
+    spyWarn();
+    const { exportCsv } = setup({ columns, defaultFilter: { search: 'DH-2' } });
+    expect(records(exportCsv({ values: 'raw' }))[1]).toBe('DH-2,qty 5');
+  });
+
+  it('guards a text that starts like a formula in a string column and a lookup, and not a number', () => {
+    const { exportCsv } = setup({ defaultFilter: { search: 'DH-5' } });
+    expect(records(exportCsv())[1]!.split(',')[1]).toBe("'=Hà");
+    expect(records(exportCsv({ escapeFormulas: false }))[1]!.split(',')[1]).toBe('=Hà');
+    // -120 is a number: it stays one.
+    const negative = setup({ defaultFilter: { search: 'DH-4' } });
+    expect(records(negative.exportCsv())[1]).toContain(',-120,');
+  });
+
+  it('quotes a field with a comma or a quote, and uses the separator it is asked for', () => {
+    const { exportCsv } = setup({ defaultFilter: { search: 'khang' } });
+    expect(records(exportCsv())[1]!.startsWith('DH-4,"Dung, Khang",')).toBe(true);
+    expect(records(exportCsv({ separator: ';' }))[1]!.startsWith('DH-4;Dung, Khang;')).toBe(true);
+    const quote = setup({ defaultFilter: { search: 'DH-6' } });
+    expect(records(quote.exportCsv())[1]!.startsWith('DH-6,"Em ""E""",')).toBe(true);
+  });
+
+  it('puts the BOM first unless bom is false', () => {
+    const { exportCsv } = setup();
+    expect(exportCsv().startsWith(BOM)).toBe(true);
+    expect(exportCsv({ bom: false }).startsWith(BOM)).toBe(false);
+  });
+});
+
+describe('what is not saved, and what is not a row', () => {
+  const type = (label: string, text: string) =>
+    act(
+      () =>
+        void fireEvent.change(within(screen.getByRole('grid')).getByLabelText(label), {
+          target: { value: text },
+        }),
+    );
+  const rowOf = (id: string) =>
+    Array.from(document.querySelectorAll<HTMLElement>('tbody > tr.flg-data-grid-row')).find((row) =>
+      row.children[0]!.textContent?.includes(id),
+    )!;
+  const cellOf = (id: string, caption: string) => {
+    const heads = Array.from(
+      document.querySelectorAll('thead th'),
+      (head) => head.textContent,
+    ).filter((text) => text !== '');
+    return rowOf(id).querySelectorAll<HTMLElement>(':scope > td, :scope > th')[
+      heads.indexOf(caption)
+    ]!;
+  };
+  /** Changes a cell in batch mode: opens the editor, types and commits. */
+  const change = (id: string, caption: string, text: string) => {
+    act(() => cellOf(id, caption).click());
+    type(caption, text);
+    act(() => {
+      fireEvent.keyDown(within(screen.getByRole('grid')).getByLabelText(caption), {
+        key: 'Enter',
+      });
+    });
+  };
+  const BATCH = { mode: 'batch', allowDeleting: true, allowAdding: true } as const;
+
+  it('writes the saved value of a cell with a change that is not saved', () => {
+    const { exportCsv } = setup({ editing: BATCH, onSaving: () => {} });
+    change('DH-1', 'Customer', 'Hoa');
+    expect(cellOf('DH-1', 'Customer')).toHaveTextContent('Hoa');
+    const csv = exportCsv();
+    expect(csv).toContain('DH-1,An,');
+    expect(csv).not.toContain('Hoa');
+  });
+
+  it('writes a row kept by the filter only because it has a change, in the place the grid shows it', () => {
+    const { exportCsv, rerender, gridRef } = setup({ editing: BATCH, onSaving: () => {} });
+    change('DH-1', 'Customer', 'Hoa');
+    rerender(
+      <Orders
+        gridRef={gridRef}
+        editing={BATCH}
+        onSaving={() => {}}
+        filter={{ search: 'khang' }}
+        onFilterChange={() => {}}
+      />,
+    );
+    // DH-1 no longer matches, but it has a change, so the grid keeps it; the CSV holds what the grid shows.
+    expect(rowOf('DH-1')).toBeTruthy();
+    expect(ids(exportCsv())).toEqual(['DH-1', 'DH-4']);
+    expect(exportCsv()).toContain('DH-1,An,');
+  });
+
+  it('writes a row marked for deletion, with its saved values', () => {
+    const { exportCsv } = setup({ editing: BATCH, onSaving: () => {} });
+    act(() => screen.getByRole('button', { name: 'Delete DH-2' }).click());
+    expect(rowOf('DH-2')).toHaveAttribute('data-deleted');
+    expect(ids(exportCsv())).toContain('DH-2');
+  });
+
+  it('writes no new row, even with values typed in it', () => {
+    const { exportCsv } = setup({
+      editing: BATCH,
+      onSaving: () => {},
+      initNewRow: () => ({ id: 'X' }),
+    });
+    act(() => screen.getByRole('button', { name: 'Add row' }).click());
+    expect(document.querySelectorAll('tr[data-new]')).toHaveLength(1);
+    expect(ids(exportCsv())).toEqual(['DH-1', 'DH-2', 'DH-3', 'DH-4', 'DH-5', 'DH-6']);
+  });
+
+  it('writes no detail row and no row of totals, and no group row', () => {
+    const { exportCsv } = setup({
+      renderDetail: () => <p>the detail</p>,
+      defaultExpandedRows: ['DH-1'],
+      summary: { total: [{ column: 'qty', type: 'sum' }] },
+    });
+    expect(screen.getByText('the detail')).toBeInTheDocument();
+    const csv = exportCsv();
+    expect(csv).not.toContain('detail');
+    expect(records(csv)).toHaveLength(1 + 6);
+  });
+
+  it('writes the saved row of the row whose form is open, and a row being edited in place', () => {
+    const { exportCsv } = setup({ editing: { mode: 'row' }, onSaving: () => {} });
+    act(() => screen.getByRole('button', { name: 'Edit DH-2' }).click());
+    type('Customer', 'Typed');
+    expect(ids(exportCsv())).toHaveLength(6);
+    expect(exportCsv()).not.toContain('Typed');
+  });
+});
+
+describe('the handle and its options', () => {
+  it('works without csvExport, which only adds the button', () => {
+    const { exportCsv } = setup();
+    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
+    expect(exportCsv().startsWith(BOM)).toBe(true);
+  });
+
+  it('lays the options of the call over the ones of csvExport', () => {
+    const { exportCsv } = setup({ csvExport: { separator: ';', bom: false } });
+    // No option given: the ones of csvExport.
+    expect(exportCsv().startsWith('Order;Customer;')).toBe(true);
+    // An option given wins, and the others stay.
+    expect(exportCsv({ separator: '\t' }).startsWith('Order\tCustomer\t')).toBe(true);
+    expect(exportCsv({ bom: true }).startsWith(`${BOM}Order;Customer;`)).toBe(true);
+  });
+
+  it('uses the default for an option outside its union, and warns once for each option', () => {
+    const warn = spyWarn();
+    const { exportCsv } = setup();
+    const bad = {
+      separator: 'x',
+      values: 'json',
+      bom: 'yes',
+      selectedOnly: 1,
+      escapeFormulas: 'no',
+      fileName: 5,
+    } as unknown as DataGridCsvOptions;
+    const csv = exportCsv(bad);
+    exportCsv(bad);
+    expect(csv.startsWith(`${BOM}Order,Customer,Status,Placed`)).toBe(true);
+    expect(ids(csv)).toHaveLength(6);
+    const said = warn.mock.calls.map(([message]) => String(message));
+    expect(said).toEqual([
+      `${WARN_PREFIX} <DataGrid exportCsv> separator must be ',', ';' or '\\t': ',' is used.`,
+      `${WARN_PREFIX} <DataGrid exportCsv> values must be 'formatted' or 'raw': 'formatted' is used.`,
+      `${WARN_PREFIX} <DataGrid exportCsv> bom must be true or false: true is used.`,
+      `${WARN_PREFIX} <DataGrid exportCsv> selectedOnly must be true or false: false is used.`,
+      `${WARN_PREFIX} <DataGrid exportCsv> escapeFormulas must be true or false: true is used.`,
+      `${WARN_PREFIX} <DataGrid exportCsv> fileName must be a string: data.csv is used.`,
+    ]);
+  });
+
+  it('uses the default for an option of csvExport outside its union, with one warning from the commit', () => {
+    const warn = spyWarn();
+    const { exportCsv } = setup({
+      csvExport: { separator: 'x', values: 'json' } as unknown as DataGridCsvOptions,
+    });
+    expect(exportCsv().startsWith(`${BOM}Order,Customer`)).toBe(true);
+    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
+      `${WARN_PREFIX} <DataGrid csvExport> separator must be ',', ';' or '\\t': ',' is used.`,
+      `${WARN_PREFIX} <DataGrid csvExport> values must be 'formatted' or 'raw': 'formatted' is used.`,
+    ]);
+  });
+
+  it('is off for a csvExport that is neither true nor an object, with one warning', () => {
+    const warn = spyWarn();
+    setup({ csvExport: 'yes' as unknown as boolean });
+    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
+    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
+      `${WARN_PREFIX} <DataGrid> csvExport is neither a boolean nor an object of options; it is off.`,
+    ]);
+  });
+
+  describe('the download', () => {
+    let blobs: Blob[];
+    let clicked: Array<{ name: string | null; href: string | null }>;
+    beforeEach(() => {
+      vi.useFakeTimers();
+      blobs = [];
+      clicked = [];
+      URL.createObjectURL = (blob: Blob | MediaSource) => {
+        blobs.push(blob as Blob);
+        return `blob:${blobs.length}`;
+      };
+      URL.revokeObjectURL = () => {};
+      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
+        this: HTMLAnchorElement,
+      ) {
+        clicked.push({ name: this.getAttribute('download'), href: this.getAttribute('href') });
+      });
+    });
+    afterEach(() => {
+      vi.useRealTimers();
+      delete (URL as { createObjectURL?: unknown }).createObjectURL;
+      delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
+    });
+
+    it('downloads nothing for a call with no download and no file name, and still returns the text', () => {
+      const { exportCsv } = setup();
+      expect(exportCsv().length).toBeGreaterThan(10);
+      expect(clicked).toEqual([]);
+      expect(blobs).toEqual([]);
+    });
+
+    it('downloads data.csv for download true, as text/csv in UTF-8, and returns the same text', async () => {
+      const { exportCsv } = setup();
+      const csv = exportCsv({ download: true });
+      expect(clicked).toEqual([{ name: 'data.csv', href: 'blob:1' }]);
+      expect(blobs).toHaveLength(1);
+      expect(blobs[0]!.type).toBe('text/csv;charset=utf-8');
+      expect(await blobText(blobs[0]!)).toBe(csv);
+    });
+
+    it('downloads under a file name that is given, even without download, as it is given', () => {
+      const { exportCsv } = setup();
+      exportCsv({ fileName: 'orders 2026.csv' });
+      expect(clicked).toEqual([{ name: 'orders 2026.csv', href: 'blob:1' }]);
+    });
+
+    it('does not download for download false, whatever the file name', () => {
+      const { exportCsv } = setup();
+      exportCsv({ download: false, fileName: 'x.csv' });
+      expect(clicked).toEqual([]);
+    });
+
+    it('takes the file name of csvExport, and a file name of the call over it', () => {
+      const { exportCsv } = setup({ csvExport: { fileName: 'from-prop.csv' } });
+      exportCsv({ download: true });
+      exportCsv({ download: true, fileName: 'from-call.csv' });
+      expect(clicked.map((one) => one.name)).toEqual(['from-prop.csv', 'from-call.csv']);
+    });
+
+    it('does not download for a file name in csvExport alone: it only names the download of a press', () => {
+      const { exportCsv } = setup({ csvExport: { fileName: 'from-prop.csv' } });
+      exportCsv();
+      expect(clicked).toEqual([]);
+    });
+  });
+});
diff --git a/src/components/data-grid/DataGrid.loading.test.tsx b/src/components/data-grid/DataGrid.loading.test.tsx
index fb4e243..bf95079 100644
--- a/src/components/data-grid/DataGrid.loading.test.tsx
+++ b/src/components/data-grid/DataGrid.loading.test.tsx
@@ -676,7 +676,7 @@ describe('the width of what spans every column', () => {
 });
 
 describe('the handle', () => {
-  it('has exactly the ten members the grid has so far', () => {
+  it('has exactly the eleven members of the handle', () => {
     const ref = createRef<DataGridHandle>();
     render(<DataGrid ref={ref} data={ORDERS} rowKey="id" columns={COLUMNS} caption="Orders" />);
     expect(Object.keys(ref.current as object).sort()).toEqual([
@@ -686,6 +686,7 @@ describe('the handle', () => {
       'collapseAllGroups',
       'element',
       'expandAllGroups',
+      'exportCsv',
       'focus',
       'getState',
       'saveChanges',
diff --git a/src/components/data-grid/DataGrid.renders.test.tsx b/src/components/data-grid/DataGrid.renders.test.tsx
index d53f534..7fdf9ba 100644
--- a/src/components/data-grid/DataGrid.renders.test.tsx
+++ b/src/components/data-grid/DataGrid.renders.test.tsx
@@ -1751,3 +1751,40 @@ describe('editing a row', () => {
     expect(renders.cell).toBeGreaterThan(0);
   });
 });
+
+// The export button (phase 6 Plan G): `csvExport` is kept by value, so an object written in the JSX is
+// not a change, and nothing of the rows reads it.
+describe('the CSV export', () => {
+  const small = (props: Partial<React.ComponentProps<typeof DataGrid<Order>>> = {}) => (
+    <DataGrid
+      data={ORDERS.slice(0, 5)}
+      rowKey="id"
+      columns={COLUMNS}
+      caption="Orders"
+      paging={false}
+      {...props}
+    />
+  );
+  const reset = () => {
+    renders.cell = 0;
+    renders.headerCell = 0;
+    renders.body = 0;
+  };
+
+  it('draws no row and no title for an object written inline that says what it said before', () => {
+    const { rerender } = render(small({ csvExport: { fileName: 'a.csv', separator: ';' } }));
+    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
+    reset();
+    rerender(small({ csvExport: { fileName: 'a.csv', separator: ';' } }));
+    expect(renders.cell).toBe(0);
+    expect(renders.headerCell).toBe(0);
+  });
+
+  it('draws no row for a new file name or separator: the rows do not read them', () => {
+    const { rerender } = render(small({ csvExport: { fileName: 'a.csv' } }));
+    reset();
+    rerender(small({ csvExport: { fileName: 'b.csv', separator: ';' } }));
+    expect(renders.cell).toBe(0);
+    expect(renders.headerCell).toBe(0);
+  });
+});
diff --git a/src/components/data-grid/DataGrid.test-d.ts b/src/components/data-grid/DataGrid.test-d.ts
index 67c4f5c..b4510e4 100644
--- a/src/components/data-grid/DataGrid.test-d.ts
+++ b/src/components/data-grid/DataGrid.test-d.ts
@@ -5,6 +5,7 @@ import { DataGrid } from './DataGrid';
 import { dataGridColumn } from './data-grid-column';
 import type {
   DataGridColumnLayout,
+  DataGridCsvOptions,
   DataGridFilter,
   DataGridHandle,
   DataGridKey,
@@ -262,7 +263,7 @@ test('scrolling is a union, and the handle scrolls to a row by its key', () => {
   expectTypeOf<DataGridHandle['scrollToRow']>().toEqualTypeOf<(key: DataGridKey) => boolean>();
 });
 
-test('loading is a boolean, its two words are strings, and the handle has ten members', () => {
+test('loading is a boolean, its two words are strings, and the handle has eleven members', () => {
   expectTypeOf<DataGridProps<Order>['loading']>().toEqualTypeOf<boolean | undefined>();
   // @ts-expect-error a loading is true or false
   const loading: DataGridProps<Order>['loading'] = 'yes';
@@ -278,6 +279,7 @@ test('loading is a boolean, its two words are strings, and the handle has ten me
     | 'expandAllGroups'
     | 'collapseAllGroups'
     | 'addRow'
+    | 'exportCsv'
     | 'saveChanges'
     | 'cancelChanges'
   >();
@@ -430,6 +432,7 @@ test('the column chooser is a boolean, and the toolbar is `false` or a function
     search: ReactNode;
     columnChooser: ReactNode;
     groupPanel: ReactNode;
+    exportButton: ReactNode;
     addButton: ReactNode;
   }>();
   const own: DataGridProps<Order>['toolbar'] = (items) => [
@@ -532,3 +535,31 @@ test('the names frozen for 0.5.0: the summary type, the controls words and one C
   type OldCancel = DataGridLabels['cancelButton'];
   expectTypeOf<OldCancel>().toBeAny();
 });
+
+test('the CSV export: csvExport takes a boolean or options, exportCsv takes options and download and gives a string', () => {
+  expectTypeOf<DataGridProps<Order>['csvExport']>().toEqualTypeOf<
+    boolean | DataGridCsvOptions | undefined
+  >();
+  expectTypeOf<DataGridCsvOptions>().toEqualTypeOf<{
+    fileName?: string;
+    separator?: ',' | ';' | '	';
+    values?: 'formatted' | 'raw';
+    bom?: boolean;
+    selectedOnly?: boolean;
+    escapeFormulas?: boolean;
+  }>();
+  expectTypeOf<DataGridHandle['exportCsv']>().toEqualTypeOf<
+    (options?: DataGridCsvOptions & { download?: boolean }) => string
+  >();
+  expectTypeOf<DataGridLabels['exportCsv']>().toEqualTypeOf<string>();
+  expectTypeOf<DataGridToolbarItems['exportButton']>().toEqualTypeOf<ReactNode>();
+  // @ts-expect-error a separator is one of the three
+  const separator: DataGridCsvOptions = { separator: '|' };
+  void separator;
+  // @ts-expect-error a value is formatted or raw
+  const values: DataGridCsvOptions = { values: 'json' };
+  void values;
+  // @ts-expect-error download is for the call of exportCsv: the prop does not take it
+  const download: DataGridCsvOptions = { download: true };
+  void download;
+});
diff --git a/src/components/data-grid/DataGridColumns.stories.tsx b/src/components/data-grid/DataGridColumns.stories.tsx
index c2c0c08..65eb13e 100644
--- a/src/components/data-grid/DataGridColumns.stories.tsx
+++ b/src/components/data-grid/DataGridColumns.stories.tsx
@@ -1994,8 +1994,9 @@ const CHOOSER_CROP_COLUMNS = [
  * C1, crop e: the chooser opened from the button at the end of the toolbar, with Channel hidden and
  * Order that cannot be hidden (the lock). The crop is 634px wide with 10px of padding, and its popover
  * hangs below it, as the mockup's does; the rows are DH-1024 and DH-1025, and the table is cut by the
- * frame after Status as the crop is. Not drawn here, as in the other looks of C: the search field (D) and
- * the export button (G), so the button is at the end of the toolbar and the popover, which follows it, is
+ * frame after Status as the crop is. Not drawn here, as in the other looks of C: the search field (D), and
+ * the export button, since the story leaves `csvExport` off (the crop has none), so the chooser button is at
+ * the end of the toolbar and the popover, which follows it, is
  * lined up with its end, and its arrow points at the button; the table stands 4px lower (the grid keeps
  * 14px between the toolbar and the frame, the crop 10px). The play opens the popover with a press and
  * lets go of the focus the popover took, as the crop shows no ring.
@@ -2082,8 +2083,8 @@ export const ColumnChooser: Story = {
  * the ⋮ of Customer's title under the pointer (the track background, 20px). The state is Plan B's
  * (`lookPlay`): the sort, DH-1028 and DH-1025 chosen, the focus on DH-1026 · Customer, the frame at the
  * rows 4 to 11. The harness has one pointer, so it hovers the ⋮ and not the row of DH-1030 as `GridCore`
- * does. Not drawn here: the search field and the funnels (D), the export button (G) and the add button
- * (F); and the thin lines between the titles are C1's, which G1 was drawn without (spec phase 6 §10).
+ * does. Not drawn here: the search field and the funnels (D), the export button (the story leaves
+ * `csvExport` off, as its crop has none) and the add button (F); and the thin lines between the titles are C1's, which G1 was drawn without (spec phase 6 §10).
  */
 export const GridColumns: Story = {
   tags: ['viewport-1440x720'],
diff --git a/src/components/data-grid/DataGridEditing.stories.tsx b/src/components/data-grid/DataGridEditing.stories.tsx
index 56fb59d..771f047 100644
--- a/src/components/data-grid/DataGridEditing.stories.tsx
+++ b/src/components/data-grid/DataGridEditing.stories.tsx
@@ -1463,8 +1463,8 @@ export const BatchKeys: Story = {
  * the frame. The new row is first ("+ (new)", "—" in Total), DH-1027 is marked for deletion (red wash, muted, struck,
  * Undo, the cell of the buttons not struck) and DH-1028 has two changed cells (Order date, Status): "3 unsaved changes".
  * Not as in the mockup: every row is 45px (OQ 1; the mockup's resting rows are 35.6px), the add button is `md`, last and
- * `secondary` while the bar shows (G1, spec §4.3), the action column is 72px and last, the words are English, and G1's
- * export button is Plan G's.
+ * `secondary` while the bar shows (G1, spec §4.3), the action column is 72px and last, the words are English, and the
+ * story leaves `csvExport` off, so G1's export button is not drawn (the crop is E2's, and has none).
  */
 export const EditBatch: Story = {
   tags: ['viewport-1440x720'],
diff --git a/src/components/data-grid/DataGridFiltering.stories.tsx b/src/components/data-grid/DataGridFiltering.stories.tsx
index 556d160..1a27df6 100644
--- a/src/components/data-grid/DataGridFiltering.stories.tsx
+++ b/src/components/data-grid/DataGridFiltering.stories.tsx
@@ -1865,7 +1865,8 @@ async function g1Funnels(root: HTMLElement) {
  * Status's filled (filtered without Cancelled, which no order is, so every row stays), next to the
  * column chooser and the ⋮ of Customer under the pointer. The state is Plan B's (`lookPlay`: the
  * sort, DH-1028 and DH-1025 chosen, the focus on DH-1026 · Customer, the frame at the rows 4 to
- * 11). Not drawn here: the export button (G), the add button (F) and C1's lines between the titles.
+ * 11). The export button (`csvExport`) follows the chooser's, a 34px square as the mockup draws it. Not
+ * drawn here: the add button (F) and C1's lines between the titles.
  */
 export const G1: Story = {
   tags: ['viewport-1440x720'],
@@ -1892,6 +1893,7 @@ export const G1: Story = {
           searchPanel
           headerFilter
           columnChooser
+          csvExport
           defaultFilter={G1_FILTER}
           defaultColumnLayout={{ pinned: { id: 'left' } }}
         />
@@ -1914,7 +1916,17 @@ export const G1: Story = {
         Node.DOCUMENT_POSITION_FOLLOWING,
       'the search field comes before the chooser',
     ).toBeTruthy();
+    // The export button follows the chooser's (the popover the chooser mounts is not part of the row), a 34px
+    // square named "Export CSV", as the mockup draws it.
+    const chooser = root.querySelector<HTMLElement>('.flg-data-grid-chooser-button')!;
+    let after = chooser.nextElementSibling;
+    while (after?.hasAttribute('popover')) after = after.nextElementSibling;
+    const exporter = within(root).getByRole('button', { name: 'Export CSV' });
+    await expect(after, 'the export button follows the chooser').toBe(exporter);
+    near(exporter.getBoundingClientRect().width, 34, 0.5, 'the export button is 34px wide');
+    near(exporter.getBoundingClientRect().height, 34, 0.5, 'the export button is 34px tall');
     await g1Funnels(root);
+    await noTitleIsCut(root);
     // The condition filters nothing: the grid still has its 135 orders.
     await expect(root.querySelector('.flg-data-grid-pager')).toHaveTextContent('1–12 of 135');
     const more = moreOf(root, 'Customer');
@@ -1999,6 +2011,102 @@ export const G1Scrolled: Story = {
   },
 };
 
+// ---- G: the export button -------------------------------------------------------------------------
+
+/**
+ * How long the export story waits for a tooltip to open and close: it opens after the delay of the
+ * tooltip and closes in a rendering update, which Linux WebKit on x86 (CI) delivers late.
+ */
+const TIP = { timeout: 5000 };
+
+/**
+ * The export button of the toolbar (spec phase 6 §4.3 G1, §6.3 "Xuất CSV"): it is the next part of the
+ * toolbar after the chooser's button, its tooltip says "Export CSV" on a real hover, and a press makes one
+ * `Blob` of type `text/csv;charset=utf-8` that is downloaded as `data.csv`, whose text starts with the BOM and
+ * the heading row. The download is never real: `URL.createObjectURL` and the click of the anchor are
+ * stubbed, and put back in `finally`.
+ */
+export const CsvExport: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <DataGrid
+      data={SALES.slice(0, 5)}
+      rowKey="id"
+      columns={SALE_COLUMNS}
+      caption="Orders"
+      locale="vi-VN"
+      columnChooser
+      csvExport
+      paging={false}
+    />
+  ),
+  play: async ({ canvasElement }) => {
+    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
+    const exporter = within(root).getByRole('button', { name: 'Export CSV' });
+    const chooser = root.querySelector<HTMLElement>('.flg-data-grid-chooser-button')!;
+    // The popover the chooser mounts stands between them and is not part of the row.
+    let after = chooser.nextElementSibling;
+    while (after?.hasAttribute('popover')) after = after.nextElementSibling;
+    await expect(after, 'the export button follows the chooser').toBe(exporter);
+
+    // The tooltip says the name, on a real pointer; a button that is described by it would say it twice.
+    const real = await realUserEvent();
+    const tip = () =>
+      Array.from(root.querySelectorAll<HTMLElement>('[role="tooltip"]')).find(
+        (one) => one.textContent === 'Export CSV',
+      );
+    await expect(exporter).not.toHaveAttribute('aria-describedby');
+    if (real) {
+      await real.hover(exporter);
+      await waitFor(
+        () =>
+          expect(tip()?.matches(':popover-open'), 'the tooltip opens on the pointer').toBe(true),
+        TIP,
+      );
+      await real.unhover(exporter);
+      await waitFor(
+        () => expect(tip()?.matches(':popover-open'), 'the tooltip closes').toBe(false),
+        TIP,
+      );
+    }
+
+    // A press downloads once, from a blob of the text and the type, under data.csv.
+    const blobs: Blob[] = [];
+    const named: string[] = [];
+    const { createObjectURL, revokeObjectURL } = URL;
+    const { click } = HTMLAnchorElement.prototype;
+    URL.createObjectURL = (blob: Blob | MediaSource) => {
+      blobs.push(blob as Blob);
+      return 'blob:story';
+    };
+    URL.revokeObjectURL = () => {};
+    HTMLAnchorElement.prototype.click = function stubbed(this: HTMLAnchorElement) {
+      named.push(this.download);
+    };
+    try {
+      await userEvent.click(exporter);
+      await expect(blobs, 'one blob').toHaveLength(1);
+      await expect(named).toEqual(['data.csv']);
+      await expect(blobs[0]!.type).toBe('text/csv;charset=utf-8');
+      // `Blob.text()` drops the BOM as it decodes, so the bytes are decoded with it kept.
+      const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(
+        await blobs[0]!.arrayBuffer(),
+      );
+      await expect(text.charCodeAt(0), 'the text starts with the BOM').toBe(0xfeff);
+      await expect(text.slice(1).split('\r\n')[0]).toBe(
+        'Order,Customer,Assignee,Order date,Status,Channel,Qty,Total',
+      );
+      // Five rows, a record each, and the CRLF that ends the last.
+      await expect(text.endsWith('\r\n')).toBe(true);
+      await expect(text.split('\r\n')).toHaveLength(1 + 5 + 1);
+    } finally {
+      URL.createObjectURL = createObjectURL;
+      URL.revokeObjectURL = revokeObjectURL;
+      HTMLAnchorElement.prototype.click = click;
+    }
+  },
+};
+
 // ---- F1: the orders, the columns and the two crops ----------------------------------------------
 
 interface FilterOrder extends Omit<Sale, 'status'> {
diff --git a/src/components/data-grid/DataGridGrouping.stories.tsx b/src/components/data-grid/DataGridGrouping.stories.tsx
index 28d0bb3..d808d98 100644
--- a/src/components/data-grid/DataGridGrouping.stories.tsx
+++ b/src/components/data-grid/DataGridGrouping.stories.tsx
@@ -1678,7 +1678,7 @@ const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, '
  * R1, crop 1, in full (spec phase 6 §4.3 R1): the toolbar with the tray and its two chips, two levels of
  * groups with their totals, DH-1028 and DH-1024 with the buttons of their details (DH-1024's open, with the
  * track), DH-1024's detail row, and the total footer. The differences from the crop, all listed in the
- * rulings of the draft: the toolbar has no "add" and no "export" button and G1's order (the search field,
+ * rulings of the draft: the toolbar has no "add" button and leaves `csvExport` off (so no "export" button: the crop is R1's) and has G1's order (the search field,
  * then the column chooser; the field is 260px); the titles have the room of the menu and no sort icon;
  * the words are English; the data rows are 33px (OQ 1) and the footer adds up what the rows add up to,
  * 162.010.000 ₫ where the crop says 161.910.000 ₫ (OQ 2).
diff --git a/src/components/data-grid/columns.test-d.ts b/src/components/data-grid/columns.test-d.ts
index a3080b1..57c83bc 100644
--- a/src/components/data-grid/columns.test-d.ts
+++ b/src/components/data-grid/columns.test-d.ts
@@ -149,3 +149,10 @@ test('the sort item and the page hold JSON only', () => {
   expectTypeOf<IsJson<{ at: Date }>>().toEqualTypeOf<false>();
   expectTypeOf<IsJson<{ run(): void }>>().toEqualTypeOf<false>();
 });
+
+test('a column says whether it is in the CSV with a boolean', () => {
+  expectTypeOf<DataGridColumn<Order>['exportable']>().toEqualTypeOf<boolean | undefined>();
+  // @ts-expect-error exportable is true or false
+  const exportable: DataGridColumn<Order> = { field: 'id', exportable: 'no' };
+  void exportable;
+});
diff --git a/src/components/data-grid/engine/csv.test.ts b/src/components/data-grid/engine/csv.test.ts
new file mode 100644
index 0000000..115be1e
--- /dev/null
+++ b/src/components/data-grid/engine/csv.test.ts
@@ -0,0 +1,142 @@
+import { describe, expect, it } from 'vitest';
+import { csvField, toCsv } from './csv';
+import type { CsvColumn, CsvOptions } from './csv';
+
+interface Row {
+  a: string;
+  n: string;
+}
+
+const OPTIONS: CsvOptions = { separator: ',', bom: false, escapeFormulas: true };
+const BOM = String.fromCharCode(0xfeff);
+
+// Two columns that read the fields of a row: `a` is guarded (a string column), `n` is not (a number).
+const COLUMNS: CsvColumn<Row>[] = [
+  { caption: 'A', text: (row) => row.a, guard: true },
+  { caption: 'N', text: (row) => row.n, guard: false },
+];
+const csv = (rows: Row[], options: Partial<CsvOptions> = {}, columns = COLUMNS) =>
+  toCsv(rows, columns, { ...OPTIONS, ...options });
+
+describe('csvField', () => {
+  it('writes a plain field as it is', () => {
+    expect(csvField('Nguyễn Văn An', ',', false)).toBe('Nguyễn Văn An');
+    expect(csvField('', ',', true)).toBe('');
+  });
+
+  it('quotes a field that holds the separator, a quote, a CR or a LF', () => {
+    expect(csvField('a,b', ',', false)).toBe('"a,b"');
+    expect(csvField('a"b', ',', false)).toBe('"a""b"');
+    expect(csvField('a\rb', ',', false)).toBe('"a\rb"');
+    expect(csvField('a\nb', ',', false)).toBe('"a\nb"');
+  });
+
+  it('quotes a field with a space at its start or at its end, and not one with a space inside', () => {
+    expect(csvField(' a', ',', false)).toBe('" a"');
+    expect(csvField('a ', ',', false)).toBe('"a "');
+    expect(csvField('a b', ',', false)).toBe('a b');
+  });
+
+  it('doubles every quote inside a quoted field', () => {
+    expect(csvField('say "hi" "now"', ',', false)).toBe('"say ""hi"" ""now"""');
+  });
+
+  it('quotes by the separator it is given: a comma needs no quotes with ; or a tab', () => {
+    expect(csvField('1,5', ';', false)).toBe('1,5');
+    expect(csvField('1;5', ';', false)).toBe('"1;5"');
+    expect(csvField('1,5', '\t', false)).toBe('1,5');
+    expect(csvField('a\tb', '\t', false)).toBe('"a\tb"');
+    expect(csvField('a;b', ',', false)).toBe('a;b');
+  });
+
+  it('puts a quote before a guarded field that starts with = + - @ tab or CR', () => {
+    expect(csvField('=1+1', ',', true)).toBe("'=1+1");
+    expect(csvField('+1', ',', true)).toBe("'+1");
+    expect(csvField('-1', ',', true)).toBe("'-1");
+    expect(csvField('@sum', ',', true)).toBe("'@sum");
+    expect(csvField('\tx', ',', true)).toBe("'\tx");
+    // A CR is a reason to quote as well.
+    expect(csvField('\rx', ',', true)).toBe('"\'\rx"');
+  });
+
+  it('leaves an unguarded field that starts with them as it is: a negative number stays one', () => {
+    expect(csvField('-12', ',', false)).toBe('-12');
+    expect(csvField('=1', ',', false)).toBe('=1');
+  });
+
+  it('does not touch a guarded field that only holds them inside', () => {
+    expect(csvField('a=1', ',', true)).toBe('a=1');
+  });
+
+  it('quotes a guarded field that needs both: the quote first, then the quotes around it', () => {
+    expect(csvField('=a,b', ',', true)).toBe('"\'=a,b"');
+    expect(csvField('-"x"', ',', true)).toBe('"\'-""x"""');
+  });
+});
+
+describe('toCsv', () => {
+  it('writes the heading row and a record for each row, every record ended with CRLF', () => {
+    expect(
+      csv([
+        { a: 'x', n: '1' },
+        { a: 'y', n: '2' },
+      ]),
+    ).toBe('A,N\r\nx,1\r\ny,2\r\n');
+  });
+
+  it('ends the last record with CRLF too, and gives the heading alone for no row', () => {
+    expect(csv([{ a: 'x', n: '1' }])).toMatch(/\r\n$/);
+    expect(csv([])).toBe('A,N\r\n');
+  });
+
+  it('puts the BOM first when it is asked for, and not otherwise', () => {
+    expect(csv([], { bom: true })).toBe(`${BOM}A,N\r\n`);
+    expect(csv([], { bom: false })).toBe('A,N\r\n');
+  });
+
+  it('joins the fields with the separator it is given', () => {
+    expect(csv([{ a: 'x', n: '1,5' }], { separator: ';' })).toBe('A;N\r\nx;1,5\r\n');
+    expect(csv([{ a: 'x', n: '1' }], { separator: '\t' })).toBe('A\tN\r\nx\t1\r\n');
+  });
+
+  it('guards a guarded column and leaves an unguarded one, when escapeFormulas is on', () => {
+    expect(csv([{ a: '=1+1', n: '-12' }])).toBe("A,N\r\n'=1+1,-12\r\n");
+  });
+
+  it('guards nothing when escapeFormulas is off', () => {
+    expect(csv([{ a: '=1+1', n: '-12' }], { escapeFormulas: false })).toBe('A,N\r\n=1+1,-12\r\n');
+  });
+
+  it('writes and guards the headings as it does a field', () => {
+    const columns: CsvColumn<Row>[] = [
+      { caption: '=HYPERLINK("x")', text: (row) => row.a, guard: false },
+      { caption: 'Total, VND', text: (row) => row.n, guard: false },
+    ];
+    expect(csv([], {}, columns)).toBe('"\'=HYPERLINK(""x"")","Total, VND"\r\n');
+    expect(csv([], { escapeFormulas: false }, columns)).toBe(
+      '"=HYPERLINK(""x"")","Total, VND"\r\n',
+    );
+  });
+
+  it('writes a CSV of no column as the BOM alone, or as nothing', () => {
+    expect(csv([{ a: 'x', n: '1' }], { bom: true }, [])).toBe(BOM);
+    expect(csv([{ a: 'x', n: '1' }], { bom: false }, [])).toBe('');
+  });
+
+  it('reads each field once, row by row, in the order of the columns', () => {
+    const seen: string[] = [];
+    const columns: CsvColumn<Row>[] = [
+      { caption: 'N', text: (row) => (seen.push(`n${row.n}`), row.n), guard: false },
+      { caption: 'A', text: (row) => (seen.push(`a${row.a}`), row.a), guard: true },
+    ];
+    csv(
+      [
+        { a: 'x', n: '1' },
+        { a: 'y', n: '2' },
+      ],
+      {},
+      columns,
+    );
+    expect(seen).toEqual(['n1', 'ax', 'n2', 'ay']);
+  });
+});
diff --git a/src/components/data-grid/engine/perf.test.ts b/src/components/data-grid/engine/perf.test.ts
index bc08ce7..146e588 100644
--- a/src/components/data-grid/engine/perf.test.ts
+++ b/src/components/data-grid/engine/perf.test.ts
@@ -8,6 +8,7 @@ import { filterRows, searchRows } from './filter';
 import { flattenRows, flattenTree } from './flatten';
 import type { FlatDataRow } from './flatten';
 import { groupRows, groupedRows, rowPlaces } from './group';
+import { csvColumns, toCsv } from './csv';
 import { countRows, pageRows } from './page';
 import { createPipeline } from './pipeline';
 import { sortRows } from './sort';
@@ -24,6 +25,10 @@ const SEARCH_TARGET_MS = 30;
 const FILTER_TARGET_MS = 20;
 const GROUP_TARGET_MS = 30;
 const LIST_TARGET_MS = 5;
+// The CSV: the medians measured on the author's machine were 10 ms (the texts in the cache) and 29 ms (raw, which
+// reads each value again); the budget is three times each.
+const CSV_TARGET_MS = 10;
+const CSV_RAW_TARGET_MS = 30;
 const WINDOW_TARGET_MS = 5;
 const SLACK = 3;
 const RUNS = 5;
@@ -478,3 +483,36 @@ describe('performance of editing on 10 000 rows by 9 columns', () => {
     expect(ms).toBeLessThan(VALIDATE_TARGET_MS * SLACK);
   });
 });
+
+describe('performance of the CSV export on 10 000 rows by 9 columns', () => {
+  const orders = makeOrders(10_000);
+
+  it(`writes the formatted CSV in under ${CSV_TARGET_MS * SLACK} ms`, () => {
+    // One text cache across the runs, as the grid has: the first run writes each text, the next read them.
+    const cache = createTextCache<Order>();
+    const columns = csvColumns(resolved, 'formatted', (row, column) => cache.text(row, column));
+    const run = () => toCsv(orders, columns, { separator: ',', bom: true, escapeFormulas: true });
+    const cold = time(run);
+    const text = run();
+    // The BOM and the heading, 10 000 records and the CRLF that ends the last.
+    expect(text.split('\r\n')).toHaveLength(10_002);
+    const ms = median(run);
+    console.log(
+      `CSV, 10 000 rows by 9 columns: cold ${cold.toFixed(1)} ms, median of ${RUNS} runs ${ms.toFixed(1)} ms (budget ${CSV_TARGET_MS * SLACK} ms)`,
+    );
+    expect(ms).toBeLessThan(CSV_TARGET_MS * SLACK);
+  });
+
+  it(`writes the raw CSV in under ${CSV_RAW_TARGET_MS * SLACK} ms`, () => {
+    const cache = createTextCache<Order>();
+    const columns = csvColumns(resolved, 'raw', (row, column) => cache.text(row, column));
+    const run = () => toCsv(orders, columns, { separator: ',', bom: true, escapeFormulas: true });
+    const text = run();
+    expect(text.split('\r\n')).toHaveLength(10_002);
+    const ms = median(run);
+    console.log(
+      `CSV raw, 10 000 rows by 9 columns: median of ${RUNS} runs ${ms.toFixed(1)} ms (budget ${CSV_RAW_TARGET_MS * SLACK} ms)`,
+    );
+    expect(ms).toBeLessThan(CSV_RAW_TARGET_MS * SLACK);
+  });
+});
diff --git a/src/components/data-grid/engine/pipeline.test.ts b/src/components/data-grid/engine/pipeline.test.ts
index 2781ab0..d36756b 100644
--- a/src/components/data-grid/engine/pipeline.test.ts
+++ b/src/components/data-grid/engine/pipeline.test.ts
@@ -1252,3 +1252,75 @@ describe('createPipeline with unsaved changes', () => {
     });
   });
 });
+
+describe('createPipeline savedRows', () => {
+  const byQty: DataGridGroupItem[] = [{ field: 'qty', direction: 'asc' }];
+  const qtyOver5: DataGridFilter = { columns: { qty: { operator: '>', value: 5 } } };
+  const row = (id: string) => DATA.find((one) => one.id === id)!;
+  const keysOf = (rows: readonly { key: unknown }[]) => rows.map((one) => one.key);
+
+  it('holds the saved rows after the search and the filter in the order shown, before the page', () => {
+    const result = createPipeline<Order>().run(
+      input({ filter: qtyOver5, sort: qtyAsc, page: { index: 0, size: 3 } }),
+    );
+    const expected = result.rows;
+    expect(expected.length).toBeGreaterThan(3);
+    expect(result.savedRows.map((one) => one.row)).toEqual(expected);
+    expect(result.savedRows.every((one) => one.kind === 'data' && one.row.qty > 5)).toBe(true);
+  });
+
+  it('holds the rows in the groups order, a closed group included, and no group row', () => {
+    const result = createPipeline<Order>().run(
+      input({ grouping: byQty, expanded: { allExpanded: false, except: [] } }),
+    );
+    // Every group is closed: the list draws the group rows alone, and the saved rows are all 30.
+    expect(result.flat.every((one) => one.kind === 'group')).toBe(true);
+    expect(result.savedRows).toHaveLength(30);
+    expect(result.savedRows.map((one) => one.row.qty)).toEqual(
+      [...DATA].map((one) => one.qty).sort((a, b) => a - b),
+    );
+    expect(result.savedRows.every((one) => one.kind === 'data')).toBe(true);
+  });
+
+  it('is the saved row objects, and holds no new row', () => {
+    const changes = applyChanges(
+      DATA,
+      new Map<string, PendingChange<Order>>([
+        ['DH-1', { type: 'update', key: 'DH-1', data: { qty: 99 }, row: row('DH-1') }],
+        ['flg-new-1', { type: 'insert', key: 'flg-new-1', data: { qty: 5 } }],
+      ]),
+      getKey,
+    );
+    const result = createPipeline<Order>().run(input({ changes }));
+    expect(result.savedRows).toHaveLength(30);
+    expect(keysOf(result.savedRows)).not.toContain('flg-new-1');
+    // The saved values, not the unsaved change over them, and the very object of the data.
+    expect(result.savedRows.find((one) => one.key === 'DH-1')!.row).toBe(row('DH-1'));
+    expect(result.keyed.find((one) => one.key === 'DH-1')!.row.qty).toBe(99);
+  });
+
+  it('is the same array when nothing it reads changed, and not after a new filter', () => {
+    const pipeline = createPipeline<Order>();
+    const first = pipeline.run(input({ sort: qtyAsc }));
+    const again = pipeline.run(input({ sort: qtyAsc, page: { index: 1, size: 5 } }));
+    expect(again.savedRows).toBe(first.savedRows);
+    // A committed change moves `keyed` and leaves the saved rows as they were.
+    const changes = applyChanges(
+      DATA,
+      new Map<string, PendingChange<Order>>([
+        ['DH-1', { type: 'update', key: 'DH-1', data: { qty: 99 }, row: row('DH-1') }],
+      ]),
+      getKey,
+    );
+    expect(pipeline.run(input({ sort: qtyAsc, changes })).savedRows).toBe(first.savedRows);
+    expect(pipeline.run(input({ sort: qtyAsc, filter: qtyOver5 })).savedRows).not.toBe(
+      first.savedRows,
+    );
+  });
+
+  it('holds the rows of the page in server mode', () => {
+    const page = DATA.slice(0, 5);
+    const result = createPipeline<Order>().run(input({ data: page, remote: true, totalCount: 30 }));
+    expect(result.savedRows.map((one) => one.row)).toEqual(page);
+  });
+});
diff --git a/src/components/data-grid/engine/values.test.ts b/src/components/data-grid/engine/values.test.ts
index 8e07a0a..a2048f8 100644
--- a/src/components/data-grid/engine/values.test.ts
+++ b/src/components/data-grid/engine/values.test.ts
@@ -1,7 +1,7 @@
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
 import type { MockInstance } from 'vitest';
 import { WARN_PREFIX, resetDevWarnings } from '../../../internal/warn';
-import { createTextCache, formatValue, isBlank, toComparable } from './values';
+import { createTextCache, formatValue, isBlank, rawText, toComparable } from './values';
 
 const DAY = 86_400_000;
 const NOV_5 = Date.UTC(2026, 10, 5);
@@ -371,3 +371,69 @@ describe('values', () => {
     });
   });
 });
+
+describe('rawText', () => {
+  beforeEach(() => {
+    resetDevWarnings();
+    vi.spyOn(console, 'warn').mockImplementation(() => {});
+  });
+  afterEach(() => vi.restoreAllMocks());
+
+  it('writes a number with a dot, whatever the locale would write', () => {
+    expect(rawText(1234.5, 'number')).toBe('1234.5');
+    expect(rawText(-3, 'number')).toBe('-3');
+    expect(rawText(0, 'number')).toBe('0');
+  });
+
+  it('writes -0 as 0, and NaN and Infinity as blank', () => {
+    expect(rawText(-0, 'number')).toBe('0');
+    expect(rawText(Number.NaN, 'number')).toBe('');
+    expect(rawText(Infinity, 'number')).toBe('');
+  });
+
+  it('writes a date as its ISO day, from a Date and from an ISO string alike', () => {
+    expect(rawText(new Date(NOV_5 + 3 * 3_600_000), 'date')).toBe('2026-11-05');
+    expect(rawText('2026-11-05', 'date')).toBe('2026-11-05');
+    expect(rawText(new Date(Date.UTC(2026, 0, 1)), 'date')).toBe('2026-01-01');
+  });
+
+  it('writes a datetime as an ISO instant in UTC, from a Date, a number and an offset string', () => {
+    const instant = Date.UTC(2026, 10, 5, 8, 30, 15, 120);
+    expect(rawText(new Date(instant), 'datetime')).toBe('2026-11-05T08:30:15.120Z');
+    expect(rawText(instant, 'datetime')).toBe('2026-11-05T08:30:15.120Z');
+    expect(rawText('2026-11-05T15:30:15.120+07:00', 'datetime')).toBe('2026-11-05T08:30:15.120Z');
+    expect(rawText('2026-11-05T08:30:15Z', 'datetime')).toBe('2026-11-05T08:30:15.000Z');
+  });
+
+  it('writes a boolean as true or false', () => {
+    expect(rawText(true, 'boolean')).toBe('true');
+    expect(rawText(false, 'boolean')).toBe('false');
+  });
+
+  it('writes a string as it is, and a number in a string column as its digits', () => {
+    expect(rawText('a, b', 'string')).toBe('a, b');
+    expect(rawText(42, 'string')).toBe('42');
+  });
+
+  it('writes a blank as blank for every type, with no warning', () => {
+    for (const dataType of ['string', 'number', 'date', 'datetime', 'boolean'] as const) {
+      for (const value of [null, undefined, '', Number.NaN, new Date('nope')]) {
+        expect(rawText(value, dataType)).toBe('');
+      }
+    }
+    expect(console.warn).not.toHaveBeenCalled();
+  });
+
+  it('writes a value its type refuses as blank, and warns as every read does', () => {
+    expect(rawText('twelve', 'number')).toBe('');
+    expect(rawText('2026-13-45', 'date')).toBe('');
+    expect(rawText('2026-11-05T08:30:15', 'datetime')).toBe('');
+    expect(rawText('yes', 'boolean')).toBe('');
+    expect(rawText({}, 'string')).toBe('');
+    expect(console.warn).toHaveBeenCalled();
+  });
+
+  it('writes an instant past the range of a Date as blank, and does not throw', () => {
+    expect(rawText(8.64e15 + 1, 'datetime')).toBe('');
+  });
+});
diff --git a/src/internal/download.test.ts b/src/internal/download.test.ts
new file mode 100644
index 0000000..50003ff
--- /dev/null
+++ b/src/internal/download.test.ts
@@ -0,0 +1,80 @@
+import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
+import { downloadText } from './download';
+
+/** The text of a blob with its byte order mark: `Blob.text()` decodes as UTF-8 and drops it. */
+const blobText = async (blob: Blob) =>
+  new TextDecoder('utf-8', { ignoreBOM: true }).decode(await blob.arrayBuffer());
+
+const BOM = String.fromCharCode(0xfeff);
+
+describe('downloadText', () => {
+  let created: Blob[];
+  let revoked: string[];
+  let clicked: HTMLAnchorElement[];
+  let present: boolean[];
+
+  beforeEach(() => {
+    vi.useFakeTimers();
+    created = [];
+    revoked = [];
+    clicked = [];
+    present = [];
+    // jsdom has neither function: they are stubbed here and taken away again in `afterEach`.
+    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
+      created.push(blob as Blob);
+      return 'blob:csv-1';
+    });
+    URL.revokeObjectURL = vi.fn((url: string) => {
+      revoked.push(url);
+    });
+    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
+      this: HTMLAnchorElement,
+    ) {
+      clicked.push(this);
+      present.push(document.body.contains(this));
+    });
+  });
+  afterEach(() => {
+    vi.useRealTimers();
+    vi.restoreAllMocks();
+    vi.unstubAllGlobals();
+    delete (URL as { createObjectURL?: unknown }).createObjectURL;
+    delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
+  });
+
+  it('clicks one anchor with the name and the address of the blob, which is in the page then', () => {
+    downloadText('a,b', 'orders.csv', 'text/csv;charset=utf-8');
+    expect(clicked).toHaveLength(1);
+    expect(clicked[0]!.getAttribute('href')).toBe('blob:csv-1');
+    expect(clicked[0]!.getAttribute('download')).toBe('orders.csv');
+    expect(clicked[0]!.hidden).toBe(true);
+    expect(present).toEqual([true]);
+  });
+
+  it('removes the anchor at once', () => {
+    downloadText('a', 'x.csv', 'text/csv');
+    expect(document.body.contains(clicked[0]!)).toBe(false);
+    expect(document.querySelector('a[download]')).toBeNull();
+  });
+
+  it('makes the blob of the text and the type it is given', async () => {
+    downloadText(`${BOM}a,b\r\n`, 'x.csv', 'text/csv;charset=utf-8');
+    expect(created).toHaveLength(1);
+    expect(created[0]!.type).toBe('text/csv;charset=utf-8');
+    expect(await blobText(created[0]!)).toBe(`${BOM}a,b\r\n`);
+  });
+
+  it('gives the address back in a later task, and not before', () => {
+    downloadText('a', 'x.csv', 'text/csv');
+    expect(revoked).toEqual([]);
+    vi.runAllTimers();
+    expect(revoked).toEqual(['blob:csv-1']);
+  });
+
+  it('does nothing and does not throw where there is no document', () => {
+    vi.stubGlobal('document', undefined);
+    expect(() => downloadText('a', 'x.csv', 'text/csv')).not.toThrow();
+    expect(created).toEqual([]);
+    expect(clicked).toEqual([]);
+  });
+});
diff --git a/src/internal/icons.test.tsx b/src/internal/icons.test.tsx
index b0a06a6..b17219c 100644
--- a/src/internal/icons.test.tsx
+++ b/src/internal/icons.test.tsx
@@ -9,6 +9,7 @@ import {
   ChevronIcon,
   ChevronsUpDownIcon,
   CloseIcon,
+  DownloadIcon,
   ColumnsIcon,
   ExclamationIcon,
   FileIcon,
@@ -402,6 +403,16 @@ describe('shared icons', () => {
     expect(paths(container)).toEqual(['M8 11V7a4 4 0 0 1 8 0v4']);
   });
 
+  it('DownloadIcon is a tray with an arrow into it: the button that exports a DataGrid as CSV', () => {
+    const { container } = render(<DownloadIcon />);
+    stroked(container);
+    expect(paths(container)).toEqual([
+      'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
+      'm7 10 5 5 5-5',
+      'M12 15V3',
+    ]);
+  });
+
   it('passes its props to the svg', () => {
     const { container } = render(<MoreVerticalIcon width={13} className="x" />);
     const svg = container.querySelector('svg')!;
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 --maxWorkers=3 src/components/data-grid src/internal
```

Expected: FAIL.
- `engine/csv.test.ts`, `src/internal/download.test.ts` không nạp được (`Failed to resolve import "./csv" …`, `"./download"`); `engine/perf.test.ts`, vốn import `./csv`, cũng vậy.
- `engine/values.test.ts` (`rawText` chưa có), `engine/pipeline.test.ts` (`savedRows` chưa có), `src/internal/icons.test.tsx` (`DownloadIcon` chưa có).
- `DataGrid.csv.test.tsx`, ở cả hai project: `TypeError: gridRef.current.exportCsv is not a function`.
- `DataGrid.chooser.test.tsx`: `Unable to find an accessible element with the role "button" and name "Export CSV"`, và ca của hàm `toolbar` (`expected [ 'addButton', 'columnChooser', …(3) ] to deeply equal [ …(4) ]`); `DataGrid.loading.test.tsx` (handle mười thành viên, chưa phải mười một); ca đầu của "the CSV export" trong `DataGrid.renders.test.tsx` (khẳng định nút).
- `DataGrid.test-d.ts`, `columns.test-d.ts` báo lỗi kiểu (`csvExport`, `exportable`, `exportCsv`, `exportButton`).

Theo báo cáo của bản nháp (phát hiện 20): stub đúng chữ ký trước cho `engine/csv.ts`, `rawText`, `downloadText`, `DownloadIcon`, nên mỗi ca fail trên assertion: `csv.test.ts` (18 ca) `expected '' to be 'Nguyễn Văn An'`; `rawText` `expected '' to be '1234.5'` (ca trống pass trên stub); `pipeline.test.ts` `Cannot read properties of undefined (reading 'map')`; `download.test.ts` `expected [] to have a length of 1 but got +0` (ca không `document` pass trên stub); `icons.test.tsx` `expected [] to deeply equal [ …(3) ]`; `DataGrid.csv.test.tsx` (50 ca) như trên. **Ca thứ hai của "the CSV export" trong `DataGrid.renders.test.tsx` là đặc tả.** **Story `CsvExport` viết cùng code và không chạy trên code cũ** (ca unit cùng nội dung fail trước); nó và `G1` chạy ở Step 4.

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
index c2c8839..aafe014 100644
--- a/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
+++ b/docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md
@@ -313,7 +313,7 @@ Bộ nền này cũng được dùng trong toolbar Storybook và được ghi tr
 | # | Điểm | Light | Dark | Ngưỡng | Tiêu chí WCAG |
 |---|---|---|---|---|---|
 | 1 | Viền control (input, ô checkbox, radio, switch tắt, và Input, Select của hàng lọc ở DataGrid, cùng khung ô tìm của popover lọc ở header (phát hiện khi lập Plan D)) so với nền | 1.28:1 | 1.31:1 | 3:1 | 1.4.11 |
-| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và nút sắp xếp, nút ⋮ của menu cột, nút phễu của lọc ở header (phát hiện khi lập Plan D), nút chọn cột, nút của thanh phân trang, nút toán tử của ô lọc (phát hiện khi lập Plan D), nút "Clear filter" của grid trống do lọc, nút "Clear filter" và công tắc của thanh bộ lọc (phát hiện khi lập Plan D), nút của chip trong thanh nhóm, nút mở chi tiết và tay nắm của dòng (giai đoạn 6, Plan E), nút Sửa, Xoá, Hoàn tác, ✓ và ✕ của cột thao tác cùng nút "Bỏ thay đổi" và "Lưu thay đổi" của thanh lưu, mà vòng focus của chúng còn được đo trên nền của thanh (giai đoạn 6, Plan F; phát hiện khi review cuối Plan F) và ô chọn của cột chọn dòng ở DataGrid, và liên kết của AppShellBrand cùng skip link của AppShell, và mục cùng nút nhóm của Nav, và nút xoá của SearchField, và nút của UserMenu | 1.20:1 / 1.18:1 | 1.23:1 / 1.19:1 | 3:1 | 1.4.11 |
+| 2 | Focus ring của Button, IconButton, Checkbox, Radio, Switch, và của Input/Textarea đang lỗi (viền giữ màu danger khi focus), và nút của bước Stepper, và hàng của List, và nút sắp xếp cùng khung cuộn của Table, và nút sắp xếp, nút ⋮ của menu cột, nút phễu của lọc ở header (phát hiện khi lập Plan D), nút chọn cột, nút xuất CSV (phát hiện khi lập Plan G), nút của thanh phân trang, nút toán tử của ô lọc (phát hiện khi lập Plan D), nút "Clear filter" của grid trống do lọc, nút "Clear filter" và công tắc của thanh bộ lọc (phát hiện khi lập Plan D), nút của chip trong thanh nhóm, nút mở chi tiết và tay nắm của dòng (giai đoạn 6, Plan E), nút Sửa, Xoá, Hoàn tác, ✓ và ✕ của cột thao tác cùng nút "Bỏ thay đổi" và "Lưu thay đổi" của thanh lưu, mà vòng focus của chúng còn được đo trên nền của thanh (giai đoạn 6, Plan F; phát hiện khi review cuối Plan F) và ô chọn của cột chọn dòng ở DataGrid, và liên kết của AppShellBrand cùng skip link của AppShell, và mục cùng nút nhóm của Nav, và nút xoá của SearchField, và nút của UserMenu | 1.20:1 / 1.18:1 | 1.23:1 / 1.19:1 | 3:1 | 1.4.11 |
 | 3 | Viền Input/Textarea khi focus (control không lỗi), và khung của ô DataGrid đang giữ focus trong một trình sửa, trên màu `--flg-control-bg` (giai đoạn 6, Plan F) | đạt (4.45:1) | 2.06:1 | 3:1 | 1.4.11 |
 | 4 | Chữ trắng trên nút primary và dấu check trắng trên màu nhấn; phím `Kbd` trên nút primary (giai đoạn 6, cùng chữ trắng) | đạt (4.74:1) | 3.63:1 ở đầu `#5b7cff`, 2.24:1 ở đầu `#46b8f0` | 4.5:1 (chữ), 3:1 (dấu check) | 1.4.3, 1.4.11 |
 | 5 | Màu nhấn của trạng thái đã chọn (checkbox, chấm radio, switch bật) và vạch dưới tab `underline` đang chọn, so với nền; thanh của bước đã xong (Stepper `bars`) | đạt (3.04:1) | 2.26:1 | 3:1 | 1.4.11 |
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index 7dce61c..23cf67e 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -1136,11 +1136,11 @@ interface DataGridHandle {
 
 **Xuất CSV** (Plan G)
 
-- **Dòng:** mọi dòng đang thấy sau tìm kiếm, lọc và sắp xếp, **mọi trang** (bản quyết định), theo thứ tự đang hiển thị nhưng phẳng (không hàng nhóm, không tổng, không chi tiết); `selectedOnly` chỉ dòng đã chọn. Giá trị lấy từ `data` đã lưu, không gồm thay đổi chưa lưu của batch (Claude chốt). Chế độ server: chỉ trang hiện tại (`devWarn`; docs: xuất ở server).
-- **Cột:** các cột dữ liệu đang hiện, theo thứ tự đang hiển thị (trái ghim, giữa, phải ghim), trừ `exportable: false`; không có cột phục vụ. Hàng đầu là `caption`.
+- **Dòng:** mọi dòng đang thấy sau tìm kiếm, lọc và sắp xếp, **mọi trang** (bản quyết định), theo thứ tự đang hiển thị nhưng phẳng (không hàng nhóm, không tổng, không chi tiết); `selectedOnly` chỉ dòng đã chọn. Phát hiện khi lập Plan G: dòng của nhóm đang đóng vẫn được xuất (nhóm chỉ sắp thứ tự); `selectedOnly` lấy các dòng đã chọn trong số dòng còn lại sau tìm kiếm và lọc (dòng đã chọn mà bộ lọc ẩn thì không xuất; `selectionMode="none"` hay chưa chọn gì thì chỉ có hàng tiêu đề); một dòng chỉ được giữ lại vì có thay đổi chưa lưu, và một dòng đang chờ xoá, vẫn được xuất với giá trị đã lưu, ở chỗ grid đang vẽ chúng; dòng mới không bao giờ được xuất. Giá trị lấy từ `data` đã lưu, không gồm thay đổi chưa lưu của batch (Claude chốt). Chế độ server: chỉ trang hiện tại (`devWarn`; docs: xuất ở server).
+- **Cột:** các cột dữ liệu đang hiện, theo thứ tự đang hiển thị (trái ghim, giữa, phải ghim), trừ `exportable: false`; không có cột phục vụ. Hàng đầu là `caption`. Phát hiện khi lập Plan G: cột đang được nhóm theo (grid không vẽ nó) vẫn được xuất, ở chỗ của nó trong bố cục như thể đang hiện, để một grid nhóm theo Status không mất giá trị Status; cột ẩn thì không; không còn cột nào thì kết quả chỉ có BOM (khi `bom`) và không có hàng nào; `caption` cũng được bọc `"` và chặn công thức như một trường.
 - **Giá trị:** `values: 'formatted'` (mặc định): chữ đã định dạng như ô (lookup theo chữ hiển thị, boolean `labels.yes`/`labels.no`); `'raw'`: số bằng `String(n)` (dấu chấm thập phân), ngày ISO 8601 (ngày không giờ: `YYYY-MM-DD`), boolean `true`/`false`, lookup theo giá trị.
-- **Định dạng file** (RFC 4180): dấu ngăn `,` (`separator`: `;` cho Excel ở vùng dùng dấu phẩy thập phân, `\t`); một trường được bọc `"` khi có dấu ngăn, `"`, CR, LF hay khoảng trắng đầu/cuối, `"` bên trong nhân đôi; xuống dòng CRLF; BOM UTF-8 `﻿` ở đầu (`bom`, mặc định `true`) để Excel đọc đúng tiếng Việt. **Chặn công thức** (`escapeFormulas`, mặc định `true`, OWASP CSV injection): trường chữ (cột `string`, lookup) bắt đầu bằng `=`, `+`, `-`, `@`, tab hay CR được thêm `'` ở đầu.
-- **`exportCsv(options)`** luôn trả chuỗi; `download: true` (hay có `fileName`) thì tải về bằng `downloadText` với `fileName` (mặc định `data.csv`), kiểu `text/csv;charset=utf-8`. Nút "Xuất CSV" của thanh công cụ gọi nó với `download: true` và các tuỳ chọn của `csvExport`.
+- **Định dạng file** (RFC 4180): dấu ngăn `,` (`separator`: `;` cho Excel ở vùng dùng dấu phẩy thập phân, `\t`); một trường được bọc `"` khi có dấu ngăn, `"`, CR, LF hay khoảng trắng đầu/cuối, `"` bên trong nhân đôi; xuống dòng CRLF (phát hiện khi lập Plan G: sau mọi hàng, kể cả hàng cuối); BOM UTF-8 `﻿` ở đầu (`bom`, mặc định `true`) để Excel đọc đúng tiếng Việt. **Chặn công thức** (`escapeFormulas`, mặc định `true`, OWASP CSV injection): trường chữ (cột `string`, lookup) bắt đầu bằng `=`, `+`, `-`, `@`, tab hay CR được thêm `'` ở đầu.
+- **`exportCsv(options)`** luôn trả chuỗi; `download: true` (hay có `fileName`) thì tải về bằng `downloadText` với `fileName` (mặc định `data.csv`), kiểu `text/csv;charset=utf-8`. Nút "Xuất CSV" của thanh công cụ gọi nó với `download: true` và các tuỳ chọn của `csvExport`. Phát hiện khi lập Plan G: tuỳ chọn của lời gọi được đặt lên trên tuỳ chọn của `csvExport` (nên nút và handle luôn như nhau); `exportCsv` dùng được khi không có `csvExport` (prop chỉ thêm nút); chỉ `download: true` hay `fileName` trong chính lời gọi mới tải về (`download: false` tắt), `fileName` của prop chỉ đặt tên cho lần tải của nút; tuỳ chọn ngoài tập giá trị của nó là mặc định, một cảnh báo cho mỗi tuỳ chọn; chữ của mọi trường đọc qua cùng lớp bảo vệ khi vẽ ô, nên một `format` hay `value` ném lỗi trên dòng đã lưu thì ném từ `exportCsv()` như khi vẽ ô.
 
 **Lưu trạng thái** (Plan G; công thức docs, không có `stateStoring` tự động, bản quyết định)
 
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 688e0b1..22e6616 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -227,6 +227,7 @@ const SHIPPED_CLASSES = [
   'flg-data-grid-toolbar-spacer',
   'flg-data-grid-chooser',
   'flg-data-grid-chooser-button',
+  'flg-data-grid-export-button',
   'flg-data-grid-chooser-title',
   'flg-data-grid-chooser-list',
   'flg-data-grid-chooser-row',
diff --git a/scripts/contrast-exceptions.ts b/scripts/contrast-exceptions.ts
index 2820d0c..382d1ff 100644
--- a/scripts/contrast-exceptions.ts
+++ b/scripts/contrast-exceptions.ts
@@ -29,7 +29,7 @@ const D = {
   2: {
     description:
       'Focus ring on Button, IconButton, Checkbox, Radio and Switch, on the button of a Stepper ' +
-      'step, on a row of a List, on the sort button and the scroll frame of a Table, on the sort button, the button of a column menu, the funnel of a header filter, the button of the column chooser, the pager buttons, ' +
+      'step, on a row of a List, on the sort button and the scroll frame of a Table, on the sort button, the button of a column menu, the funnel of a header filter, the button of the column chooser, the export button, the pager buttons, ' +
       'the operator button of a filter cell, the "Clear filter" button of an empty grid, the button and the switch of the filter panel, ' +
       'the buttons of the chips of the group panel, the detail toggle and the handle of a row, ' +
       'the buttons of the column of actions of a DataGrid (Edit, Delete, Undo, Save and Cancel) and of its save bar ' +
diff --git a/src/components/data-grid/DataGrid.mdx b/src/components/data-grid/DataGrid.mdx
index 22c7397..a3770f6 100644
--- a/src/components/data-grid/DataGrid.mdx
+++ b/src/components/data-grid/DataGrid.mdx
@@ -131,6 +131,7 @@ const tax = dataGridColumn<Order>()({
 | `allowPinning`         | Whether its menu can pin and unpin the column; the grid's `allowPinning` when left out                 |
 | `allowHiding`          | Whether its menu can hide the column; the grid's `allowHiding` when left out                           |
 | `sortValue`            | A function `(row) => value` that the column is sorted by, in place of its value                        |
+| `exportable`           | Whether the column is in the CSV; `true` when left out; see CSV export                                 |
 | `allowSearch`          | Whether the search reads the column and its cells are marked; `true` when left out                     |
 | `allowFiltering`       | Whether the column has a cell in the filter row; the grid's `allowFiltering` when left out             |
 | `filterOperators`      | The operators of its filter cell, narrowed from its type, in the type's order                          |
@@ -633,15 +634,94 @@ box for each data column, with the caption of the column as its label.
 
 Without `columnChooser` no button is drawn and no popover is mounted.
 
+## CSV export
+
+`csvExport` adds a button after the column chooser (an icon button named by `labels.exportCsv`, with
+a tooltip that says the same name) that downloads the rows as a CSV file. `true` takes the defaults
+and an object takes the options of `DataGridCsvOptions`. The handle's `exportCsv(options)` does the
+same without a button: it always returns the text, and it downloads the file when the call says
+`download: true` or gives a `fileName` (`download: false` turns that off). The button calls the same
+function with `download: true`, so the two ways to export always agree. The options of a call are
+laid over those of `csvExport`, and `exportCsv()` works without the prop, which only adds the button.
+A `fileName` in `csvExport` names the download of the button; it never starts one by itself.
+
+| Option           | Default       | Is                                                                         |
+| ---------------- | ------------- | -------------------------------------------------------------------------- |
+| `fileName`       | `'data.csv'`  | The name of the downloaded file, used as it is given                       |
+| `separator`      | `','`         | `','`, `';'` (what Excel reads where the decimal mark is a comma) or a tab |
+| `values`         | `'formatted'` | `'formatted'` writes the text of the cells, `'raw'` writes the values      |
+| `bom`            | `true`        | Starts the text with a byte order mark, so that Excel reads it as UTF-8    |
+| `selectedOnly`   | `false`       | Only the chosen rows, among the ones the search and the filter keep        |
+| `escapeFormulas` | `true`        | Puts a `'` before a text that a spreadsheet could run as a formula         |
+
+An option outside its union (a `separator` of `'|'`, a `bom` of `'yes'`) is its default, with one
+warning in development; the grid never throws for it.
+
+**The rows** are the ones the grid shows after the search and the filter, in the order shown, and
+**every page** of them, whatever the pager shows. The CSV is flat: no group row, no total row and no
+detail row, and the rows of a closed group are in it, since a group only orders them. A row that is
+kept by the search or the filter only because it has an unsaved change is in it, in the place the grid
+shows it, and so is a row marked for deletion. A new row is not. A value is always the **saved**
+one: a change that is not saved, in any edit mode, and a value being typed, are not in the CSV.
+`selectedOnly` keeps the chosen rows among those; a chosen row that the filter hides is not exported,
+and a grid with no chosen row, or with `selectionMode="none"`, gives the heading row alone.
+
+**The columns** are the shown data columns in the order they are drawn: the left zone, the middle
+and the right zone (see Pinned columns). A hidden column is not in it. A column the grouping takes
+out of the table is written at its place in the layout, as if it were shown, so a grid grouped by
+status still has the statuses. The columns the grid adds for itself (the boxes, the handles, the
+buttons of the rows) are never written, and a column with `exportable: false` is left out. The first
+record is the heading: the `caption` of each column, or its id.
+
+**The values** of `'formatted'` are the text each cell writes: the column's Intl `format` with the
+grid's `locale` and `timeZone`, the words of a lookup, `labels.yes` and `labels.no` for a boolean, the
+text of a `format` function, and a computed column's text. A custom `cell` is written as its `text`,
+not as what it draws. A blank is an empty field. The values of `'raw'` are: a number with a dot, a
+`date` as `YYYY-MM-DD`, a `datetime` as ISO 8601 in UTC (`2026-11-05T17:30:00.000Z`), a boolean as
+`true` or `false`, a string as it is, and a lookup by its value. A value its type cannot read is blank
+in `'raw'`, as the cell is, except in a column whose own `format` function writes it: that column
+writes the `format` text. The texts come through the same guard drawing uses, so a `format` or a
+`value` that throws on a row of `data` throws from `exportCsv()` as it does when the cell is drawn.
+
+**The format** is RFC 4180: a field is in double quotes when it holds the separator, a double quote,
+a CR or an LF, or a space at its start or its end, and a double quote inside is doubled. Every record
+ends with CRLF, the last one too. With `bom` the text starts with U+FEFF, which is what makes Excel
+show Vietnamese letters correctly; where the decimal mark is a comma, `separator: ';'` makes Excel
+split the fields. `escapeFormulas` is the guard against CSV injection (OWASP): a text of a `string`
+column or a lookup, and a heading, that starts with `=`, `+`, `-`, `@`, a tab or a CR gets a `'`
+before it, so a spreadsheet shows it as text. A number, a date and a boolean never get one, so a
+negative number stays a number. Turn it off only for a file that no spreadsheet will open.
+
+**Server mode** (`remote`): `data` is the page, so the CSV holds the rows of the current page, in the
+order the server gave, and `exportCsv()` warns once in development. Export the whole data on the
+server. Nothing is announced after an export: the browser's download is the answer.
+
+```tsx
+const grid = useRef<DataGridHandle>(null);
+
+<DataGrid
+  ref={grid}
+  data={orders}
+  rowKey="id"
+  columns={columns}
+  caption="Orders"
+  csvExport={{ fileName: 'orders.csv', separator: ';' }}
+/>;
+
+// The text, with no download: the same as the button writes.
+const text = grid.current?.exportCsv({ selectedOnly: true });
+```
+
 ## Toolbar
 
 The toolbar is the row above the grid: the caption block (see below), then the items of the grid:
 `groupPanel`, the tray of the grouping (see The group panel), `spacer`, which takes the room
-between the caption and the rest, `search`, the search field (see Search), and `columnChooser`,
-the button of the chooser, and `addButton`, the button that adds a row (see Adding rows). The default
-order is the group panel, the spacer, the search field, the chooser, the add button. The toolbar gets an item for each part of the grid that comes with a
-control, so `DataGridToolbarItems` grows with the grid. The toolbar is drawn when it has a caption,
-a description or an item.
+between the caption and the rest, `search`, the search field (see Search), `columnChooser`, the
+button of the chooser, `exportButton`, the button that downloads the CSV (see CSV export), and
+`addButton`, the button that adds a row (see Adding rows). The default order is the group panel, the
+spacer, the search field, the chooser, the export button, the add button. The toolbar gets an item
+for each part of the grid that comes with a control. The toolbar is drawn when it has a caption, a
+description or an item.
 
 - **`toolbar={false}`** takes the items away and **keeps the caption**, which names the grid (its
   `aria-labelledby`) and the pager. Without a caption or a description, the toolbar is not drawn.
@@ -2325,6 +2405,7 @@ has a `tabindex`, and the cell is the stop.
 | `defaultColumnLayout`    | `Partial<DataGridColumnLayout>`                                                                              |              | Parts of the layout at first                                                              |
 | `onColumnLayoutChange`   | `(layout) => void`                                                                                           |              | Called with the layout a person asks for                                                  |
 | `columnChooser`          | `boolean`                                                                                                    | `false`      | A toolbar button that shows and hides the columns                                         |
+| `csvExport`              | `boolean \| DataGridCsvOptions`                                                                              | `false`      | A toolbar button that downloads the rows as CSV; see CSV export                           |
 | `searchPanel`            | `boolean \| { placeholder?: string }`                                                                        | `false`      | A search field in the toolbar; see Search                                                 |
 | `groupPanel`             | `boolean`                                                                                                    | `false`      | A tray of chips in the toolbar, and a way to drag a title in; see The group panel         |
 | `filterRow`              | `boolean`                                                                                                    | `false`      | A row of filter cells under the titles; see The filter row                                |
@@ -2364,7 +2445,7 @@ is no `children`, and no `dangerouslySetInnerHTML`: the grid draws everything in
 
 ## Handle
 
-The `ref` is a handle, not the element. It has ten members:
+The `ref` is a handle, not the element. It has eleven members:
 
 | Member                | Is                                                                                                        |
 | --------------------- | --------------------------------------------------------------------------------------------------------- |
@@ -2376,6 +2457,7 @@ The `ref` is a handle, not the element. It has ten members:
 | `expandAllGroups()`   | Opens every group; nothing when they are open                                                             |
 | `collapseAllGroups()` | Closes every group; nothing when they are closed                                                          |
 | `addRow()`            | Adds a row and edits it, as the toolbar's button does; nothing without `editing.allowAdding`              |
+| `exportCsv(options)`  | The rows as CSV text, always returned; downloads it with `download: true` or a `fileName`                 |
 | `saveChanges()`       | Saves what is not saved (see Batch mode); resolves `true` when it went through, `false` when not          |
 | `cancelChanges()`     | Drops what is not saved and closes any editor, the form and the popup; says nothing                       |
 
@@ -2458,6 +2540,7 @@ row) must translate these too, or the panel speaks English beside a row that doe
 | `announceHidden`                                    | `Customer hidden`                                            | What is said after a column was hidden, from its menu or the chooser: `(caption)`                 |
 | `announceShown`                                     | `Customer shown`                                             | What is said after the chooser showed a column: `(caption)`                                       |
 | `columnChooser`                                     | `Columns`                                                    | The name of the chooser's button, and its title                                                   |
+| `exportCsv`                                         | `Export CSV`                                                 | The name of the export button, and its tooltip                                                    |
 | `lastShownColumn`                                   | `At least one column stays shown`                            | The hidden description of the box of the only column shown                                        |
 | `lockedColumn`                                      | `Always shown`                                               | The hidden description of the box of a column that cannot be hidden                               |
 | `groupCount`                                        | `(4)`                                                        | The number of rows a group row says after its value: `(count)`                                    |
@@ -2539,9 +2622,13 @@ Combobox of the editors, and the two search fields. A record given in part keeps
   a layer and does not need a spinner of yours.
 - Do change `data` in `onRowReorder` when you use `rowReorder`, and keep the order: the grid moves
   nothing, and the keys of the rows are what it follows.
+- Do pass `csvExport` and not a button of your own, or call `exportCsv()` from yours: both write the
+  same text. Export the whole data on the server in server mode.
 - Don't give two rows the same key.
 - Don't expect the handles to work while the grid sorts or groups: they are off then, and say why.
 - Don't sort or page `data` yourself without `remote`: the grid does, and sorting twice is wasted.
+- Don't turn `escapeFormulas` off for a file that a spreadsheet will open: a name that starts with
+  `=` becomes a formula there.
 - Don't write a `datetime` without an offset, or a `date` that is not `YYYY-MM-DD`.
 - Don't count on a text being fully visible in a cell: a long one is cut. Give the column room, or
   show the whole text in a `cell`.
diff --git a/src/components/data-grid/DataGrid.tsx b/src/components/data-grid/DataGrid.tsx
index 71399d9..2a999f2 100644
--- a/src/components/data-grid/DataGrid.tsx
+++ b/src/components/data-grid/DataGrid.tsx
@@ -22,7 +22,7 @@ import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
 import { useWriteOnCommit } from '../../internal/use-write-on-commit';
 import { useHeadHeight } from '../table/use-head-height';
 import { hasMenu } from './engine/column-menu';
-import { isPlaceColumn } from './engine/columns';
+import { isDataColumn, isPlaceColumn } from './engine/columns';
 import type { ResolvedColumn } from './engine/columns';
 import { drawsActions, formColumns, hasFormFields, readOfRow } from './engine/edit';
 import { EMPTY_FILTER } from './engine/filter';
@@ -53,6 +53,7 @@ import { useFootHeight } from './hooks/use-foot-height';
 import { useGridKeyboard } from './hooks/use-grid-keyboard';
 import { ALL_OPEN, useGridState } from './hooks/use-grid-state';
 import { useKept } from './hooks/use-kept';
+import { sameCsvExport, useCsvExport } from './hooks/use-csv-export';
 import { useResolvedColumns, useShownColumns } from './hooks/use-grid-columns';
 import { useGridFilter } from './hooks/use-grid-filter';
 import { useGridGrouping } from './hooks/use-grid-grouping';
@@ -209,6 +210,7 @@ function DataGridImpl<TRow>(
     defaultColumnLayout: defaultColumnLayoutProp,
     onColumnLayoutChange,
     columnChooser,
+    csvExport: csvExportProp,
     groupPanel: groupPanelProp,
     summary: summaryProp,
     totalSummary: totalSummaryProp,
@@ -232,6 +234,8 @@ function DataGridImpl<TRow>(
   // shape, and one that was not says so once, after the commit (spec phase 6 §5).
   // `editing` is kept by value, so an object written in the JSX draws no row.
   const editingKept = useKept(editingProp, sameEditing);
+  // `csvExport` is kept by value too: an object written in the JSX that says what it said draws nothing.
+  const csvExportKept = useKept(csvExportProp, sameCsvExport);
   const safe = useNormalizedProps({
     editing: editingKept,
     data: dataProp,
@@ -255,6 +259,7 @@ function DataGridImpl<TRow>(
     defaultExpandedRows: defaultExpandedRowsProp,
     summary: summaryProp,
     totalSummary: totalSummaryProp,
+    csvExport: csvExportKept,
   });
   const { data, columns, paging, sort, defaultSort, page, defaultPage } = safe;
   const { grouping, defaultGrouping, expandedGroups, defaultExpandedGroups } = safe;
@@ -263,7 +268,7 @@ function DataGridImpl<TRow>(
   const { summary: summaryGiven, totalSummary } = safe;
   const { selectedKeys, defaultSelectedKeys, pageSize: configuredSize, warnings } = safe;
   const { columnLayout, defaultColumnLayout } = safe;
-  const { editing: editingConfig } = safe;
+  const { editing: editingConfig, csvExport } = safe;
   // The column of buttons is drawn when a button can stand in it: a grid that cannot update a row has none.
   const hasActions = editingConfig !== undefined && drawsActions(editingConfig);
   // The dialog that asks before a delete is there when the grid can delete and asks.
@@ -764,6 +769,28 @@ function DataGridImpl<TRow>(
       readOfRow(row, () => textCache.text(row, column), ''),
     [textCache],
   );
+  // The columns the CSV may write: the shown data columns in the order drawn (a grouped one at its place in the
+  // layout) but the ones that say `exportable: false`.
+  const exportColumns = useMemo(
+    () =>
+      applied.columns.filter(
+        (column) => isDataColumn(column) && column.column.exportable !== false,
+      ),
+    [applied.columns],
+  );
+  const exportCsv = useCsvExport({
+    savedRows: result.savedRows,
+    columns: exportColumns,
+    selectedKeys: state.selectedKeys,
+    selectionMode,
+    remote,
+    options: csvExport,
+    textOf,
+  });
+  // The button does what the handle does with `download`: one function for both ways to export.
+  const pressExport = useCallback(() => {
+    exportCsv({ download: true });
+  }, [exportCsv]);
   const { reordering, rowMenu, focusRowLink, contextPart } = useRowReordering({
     reorderRows,
     sorted: sorting.count > 0,
@@ -885,6 +912,7 @@ function DataGridImpl<TRow>(
     labels,
     controlLabels,
     showColumn,
+    exportCsv: csvExport === undefined ? null : pressExport,
     addRow: editingConfig?.allowAdding === true ? editing.add : null,
     addVariant: editing.changeCount > 0 ? 'secondary' : 'primary',
   });
@@ -932,6 +960,7 @@ function DataGridImpl<TRow>(
       expandAllGroups: groupingView.expandAll,
       collapseAllGroups: groupingView.collapseAll,
       addRow: editing.add,
+      exportCsv,
       saveChanges: editing.saveAll,
       cancelChanges: editing.cancelAll,
     }),
@@ -942,6 +971,7 @@ function DataGridImpl<TRow>(
       groupingView.expandAll,
       groupingView.collapseAll,
       editing.add,
+      exportCsv,
       editing.saveAll,
       editing.cancelAll,
     ],
diff --git a/src/components/data-grid/engine/csv.ts b/src/components/data-grid/engine/csv.ts
new file mode 100644
index 0000000..4b0aec4
--- /dev/null
+++ b/src/components/data-grid/engine/csv.ts
@@ -0,0 +1,98 @@
+import type { ResolvedColumn } from './columns';
+import { readOfRow } from './edit';
+import { isBlank, rawText } from './values';
+
+/** One column of a CSV: its heading, how it writes a row, and whether a formula in it is a danger. */
+export interface CsvColumn<TRow> {
+  caption: string;
+  /** The text of the row in this column, before any quoting. */
+  text(row: TRow): string;
+  /** `true` for a column of free text (a `string` column or a lookup): `escapeFormulas` applies to it. */
+  guard: boolean;
+}
+
+/** The options of a CSV as `exportCsv` resolves them: no member is left out. */
+export interface CsvOptions {
+  separator: ',' | ';' | '\t';
+  /** Whether the text starts with a byte order mark, which makes Excel read it as UTF-8. */
+  bom: boolean;
+  escapeFormulas: boolean;
+}
+
+// The byte order mark, U+FEFF: written by its code so that no invisible character stands in the source.
+const BOM = String.fromCharCode(0xfeff);
+// What a spreadsheet reads as the start of a formula (OWASP "CSV injection"): the characters of the spec
+// and the two that can hide one behind a blank.
+const FORMULA = /^[=+\-@\t\r]/;
+const NEEDS_QUOTES = /["\r\n]|^\s|\s$/;
+
+/**
+ * One field of a record (RFC 4180): quoted when it holds the separator, a quote, a line break or a space
+ * at either end, with every inner quote doubled. A `guard`ed field that starts like a formula gets a quote
+ * mark before it first, so a spreadsheet reads it as text; the quoting then looks at the field as it is
+ * written.
+ */
+export function csvField(text: string, separator: string, guard: boolean): string {
+  const safe = guard && FORMULA.test(text) ? `'${text}` : text;
+  return safe.includes(separator) || NEEDS_QUOTES.test(safe)
+    ? `"${safe.replace(/"/g, '""')}"`
+    : safe;
+}
+
+/**
+ * The CSV of rows (spec phase 6 §6.3 "Xuất CSV"): a heading row of the captions, then a record for each row,
+ * every record ended with CRLF (the last too), and the BOM first when asked. With no column there is no record:
+ * the BOM alone, or nothing. The rows are read once each, column by column; what a field says is the column's.
+ */
+export function toCsv<TRow>(
+  rows: readonly TRow[],
+  columns: readonly CsvColumn<TRow>[],
+  { separator, bom, escapeFormulas }: CsvOptions,
+): string {
+  if (columns.length === 0) return bom ? BOM : '';
+  // The headings are free text too: a caption may come from data in an app whose columns are dynamic.
+  const records = [
+    columns.map((column) => csvField(column.caption, separator, escapeFormulas)).join(separator),
+  ];
+  const guards = columns.map((column) => escapeFormulas && column.guard);
+  for (const row of rows) {
+    records.push(
+      columns
+        .map((column, at) => csvField(column.text(row), separator, guards[at]!))
+        .join(separator),
+    );
+  }
+  return `${bom ? BOM : ''}${records.join('\r\n')}\r\n`;
+}
+
+/**
+ * The columns of a CSV for the grid's columns. `formatted` writes the text of the cell, which `textOf` gives (the
+ * grid's text cache behind its guard for a new row); `raw` writes the value as `rawText` does: a lookup by its value,
+ * and, for a column whose own `format` writes a value its type cannot read, that text, as the filter key does. A
+ * value is read through `readOfRow`: a throw on a saved row is the app's and goes on, as it does when the cell draws.
+ */
+export function csvColumns<TRow>(
+  columns: readonly ResolvedColumn<TRow>[],
+  values: 'formatted' | 'raw',
+  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string,
+): CsvColumn<TRow>[] {
+  return columns.map((column) => ({
+    caption: column.caption,
+    guard: column.dataType === 'string' || column.choices !== undefined,
+    text:
+      values === 'formatted'
+        ? (row) => textOf(row, column)
+        : (row) =>
+            readOfRow(
+              row,
+              () => {
+                const value = column.value(row);
+                if (isBlank(value)) return '';
+                if (column.choices !== undefined) return String(value);
+                const raw = rawText(value, column.dataType);
+                return raw === '' && column.ownText ? textOf(row, column) : raw;
+              },
+              '',
+            ),
+  }));
+}
diff --git a/src/components/data-grid/engine/pipeline.ts b/src/components/data-grid/engine/pipeline.ts
index e5016a4..a0a1b2d 100644
--- a/src/components/data-grid/engine/pipeline.ts
+++ b/src/components/data-grid/engine/pipeline.ts
@@ -94,6 +94,12 @@ export interface PipelineResult<TRow> {
    * key and its place in its groups; the rows a closed group hides are in it.
    */
   keyed: readonly FlatDataRow<TRow>[];
+  /**
+   * `keyed` as it was before the unsaved changes went over it: the saved rows themselves, in the order shown,
+   * a closed group's and every page's included, and no new row. The same array while the rows and their order
+   * are the same, whatever the changes do. In server mode it is the page. The CSV export writes these.
+   */
+  savedRows: readonly FlatDataRow<TRow>[];
   /** The totals of every row after the search and the filter; `null` without items, and in server mode. */
   totals: SummaryValues<TRow> | null;
   /** The list the grid draws from: data, group and detail rows; the whole list, not a page. */
@@ -406,12 +412,25 @@ export function createPipeline<TRow>() {
       );
 
       return whole(
-        [afterSearch, rows, tree, keyed, totals, flat, visible, total, pages, pageIndex],
+        [
+          afterSearch,
+          rows,
+          tree,
+          keyed,
+          keyedSaved,
+          totals,
+          flat,
+          visible,
+          total,
+          pages,
+          pageIndex,
+        ],
         () => ({
           searched: afterSearch,
           rows,
           tree,
           keyed,
+          savedRows: keyedSaved,
           totals,
           flat,
           total,
diff --git a/src/components/data-grid/engine/values.ts b/src/components/data-grid/engine/values.ts
index bfe81f4..261cbd6 100644
--- a/src/components/data-grid/engine/values.ts
+++ b/src/components/data-grid/engine/values.ts
@@ -144,6 +144,12 @@ function dayInZone(instant: number, timeZone: string): string | null {
   return year >= 1 && year <= 9999 ? toIso(year, month, day) : null;
 }
 
+// The ISO day of the UTC midnight that `read` gives for a `date`: the one rule for a day written back.
+function isoDayOf(midnight: number): string {
+  const day = new Date(midnight);
+  return toIso(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate());
+}
+
 /**
  * What a filter holds of a value, as JSON (spec phase 6 §6.1): the string, the number or the boolean as
  * the type reads it, and for a `date` its ISO day, for a `datetime` the ISO day it falls on in
@@ -158,10 +164,8 @@ export function toFilterKey(
   const parsed = read(value, dataType);
   if (parsed === null) return null;
   switch (dataType) {
-    case 'date': {
-      const day = new Date(parsed as number);
-      return toIso(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate());
-    }
+    case 'date':
+      return isoDayOf(parsed as number);
     case 'datetime':
       return dayInZone(parsed as number, timeZone);
     default:
@@ -190,11 +194,9 @@ export function formatValue(
       return numberFormat(locale, options as Intl.NumberFormatOptions | undefined).format(
         parsed as number,
       );
-    case 'date': {
-      const day = new Date(parsed as number);
-      const iso = toIso(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate());
+    case 'date':
       return formatDate(
-        iso,
+        isoDayOf(parsed as number),
         locale,
         (options as Intl.DateTimeFormatOptions | undefined) ?? {
           year: 'numeric',
@@ -202,7 +204,6 @@ export function formatValue(
           day: '2-digit',
         },
       );
-    }
     case 'datetime':
       return dateTimeFormat(
         locale,
@@ -289,3 +290,24 @@ export function createTextCache<TRow>() {
 
 /** What `createTextCache` gives: the text of a cell, its folded form and its filter key, each made once. */
 export type TextCache<TRow> = ReturnType<typeof createTextCache<TRow>>;
+
+/**
+ * What a CSV writes of a value in `raw` (spec phase 6 §6.3 "Xuất CSV"): the value as its type reads it, in a form no
+ * locale changes. A number is its digits with a dot, a `date` its ISO day, a `datetime` its instant in UTC with a
+ * `Z`, a boolean `true` or `false`, a string itself. `''` for a blank, for a value the type refuses (which warns as
+ * every read does), and for an instant a `Date` cannot hold.
+ */
+export function rawText(value: unknown, dataType: DataGridDataType): string {
+  const parsed = read(value, dataType);
+  if (parsed === null) return '';
+  switch (dataType) {
+    case 'date':
+      return isoDayOf(parsed as number);
+    case 'datetime':
+      return Math.abs(parsed as number) > MAX_INSTANT
+        ? ''
+        : new Date(parsed as number).toISOString();
+    default:
+      return String(parsed);
+  }
+}
diff --git a/src/components/data-grid/hooks/use-csv-export.ts b/src/components/data-grid/hooks/use-csv-export.ts
new file mode 100644
index 0000000..cb45201
--- /dev/null
+++ b/src/components/data-grid/hooks/use-csv-export.ts
@@ -0,0 +1,85 @@
+import { useCallback, useRef } from 'react';
+import { downloadText } from '../../../internal/download';
+import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
+import { devWarn } from '../../../internal/warn';
+import { csvColumns, toCsv } from '../engine/csv';
+import type { ResolvedColumn } from '../engine/columns';
+import type { FlatDataRow } from '../engine/flatten';
+import { csvOptionsOf } from '../normalize';
+import type { DataGridCsvOptions, DataGridKey, DataGridSelectionMode } from '../types';
+
+/** What the export reads of the grid, as the last commit showed it. */
+export interface CsvSource<TRow> {
+  /** The saved rows after the search and the filter, in the order shown (`PipelineResult.savedRows`). */
+  savedRows: readonly FlatDataRow<TRow>[];
+  /** The columns the CSV may write: the shown data columns in the order drawn, `exportable: false` left out. */
+  columns: readonly ResolvedColumn<TRow>[];
+  selectedKeys: readonly DataGridKey[];
+  selectionMode: DataGridSelectionMode;
+  remote: boolean;
+  /** The options of `csvExport`, of their type; `undefined` when the prop is off. */
+  options: DataGridCsvOptions | undefined;
+  /** The text of a cell, through the one guard drawing uses. */
+  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string;
+}
+
+const CSV_TYPE = 'text/csv;charset=utf-8';
+
+/** Whether two `csvExport` values say the same: the same options, member by member. */
+export function sameCsvExport(a: unknown, b: unknown): boolean {
+  if (Object.is(a, b)) return true;
+  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
+  const left = a as DataGridCsvOptions;
+  const right = b as DataGridCsvOptions;
+  return (
+    left.fileName === right.fileName &&
+    left.separator === right.separator &&
+    left.values === right.values &&
+    left.bom === right.bom &&
+    left.selectedOnly === right.selectedOnly &&
+    left.escapeFormulas === right.escapeFormulas
+  );
+}
+
+/**
+ * The handle's `exportCsv` (spec phase 6 §6.3 "Xuất CSV"), the one function the toolbar's button and an app share. It
+ * reads what the last commit showed through a ref written on commit, never during a render, so it is the same
+ * function for as long as the grid lives and says what is on the screen when it is called. The options of the call are
+ * laid over those of `csvExport`, each outside its union is its default with one warning, and the text is always
+ * returned; the file is downloaded when the call says `download: true`, or gives a `fileName` and does not say
+ * `download: false`. A `fileName` of the prop alone never downloads by itself: it names the download of the button.
+ */
+export function useCsvExport<TRow>(source: CsvSource<TRow>) {
+  const latest = useRef(source);
+  useWriteOnCommit(() => {
+    latest.current = source;
+  });
+  return useCallback((given?: DataGridCsvOptions & { download?: boolean }): string => {
+    const now = latest.current;
+    const { options: call, warnings } = csvOptionsOf(given, 'exportCsv');
+    for (const warning of warnings) devWarn(warning);
+    const { download, ...callOptions } = call;
+    const options = { ...now.options, ...callOptions };
+    if (now.remote) {
+      devWarn(
+        '<DataGrid> exportCsv() in server mode writes only the rows of the current page; export the whole data on the server.',
+      );
+    }
+    // A grid that cannot choose rows has no chosen row, whatever keys it was given.
+    const chosen = new Set(now.selectionMode === 'none' ? [] : now.selectedKeys);
+    const rows = (
+      options.selectedOnly === true
+        ? now.savedRows.filter((one) => chosen.has(one.key))
+        : now.savedRows
+    ).map((one) => one.row);
+    const text = toCsv(rows, csvColumns(now.columns, options.values ?? 'formatted', now.textOf), {
+      separator: options.separator ?? ',',
+      bom: options.bom ?? true,
+      escapeFormulas: options.escapeFormulas ?? true,
+    });
+    if (download ?? callOptions.fileName !== undefined) {
+      downloadText(text, options.fileName ?? 'data.csv', CSV_TYPE);
+    }
+    return text;
+  }, []);
+}
diff --git a/src/components/data-grid/hooks/use-normalized-props.ts b/src/components/data-grid/hooks/use-normalized-props.ts
index 1eb5b43..6a5c83e 100644
--- a/src/components/data-grid/hooks/use-normalized-props.ts
+++ b/src/components/data-grid/hooks/use-normalized-props.ts
@@ -31,6 +31,7 @@ export function useNormalizedProps<TRow>(given: GivenProps<TRow>): SafeProps<TRo
     summary,
     totalSummary,
     editing,
+    csvExport,
   } = given;
   return useMemo(
     () =>
@@ -57,6 +58,7 @@ export function useNormalizedProps<TRow>(given: GivenProps<TRow>): SafeProps<TRo
         summary,
         totalSummary,
         editing,
+        csvExport,
       }),
     [
       data,
@@ -81,6 +83,7 @@ export function useNormalizedProps<TRow>(given: GivenProps<TRow>): SafeProps<TRo
       summary,
       totalSummary,
       editing,
+      csvExport,
     ],
   );
 }
diff --git a/src/components/data-grid/index.ts b/src/components/data-grid/index.ts
index 3afcc86..6d71e3e 100644
--- a/src/components/data-grid/index.ts
+++ b/src/components/data-grid/index.ts
@@ -8,6 +8,7 @@ export type {
   DataGridColumnFilter,
   DataGridColumnInfo,
   DataGridColumnLayout,
+  DataGridCsvOptions,
   DataGridDataType,
   DataGridDensity,
   DataGridEditMode,
diff --git a/src/components/data-grid/labels.ts b/src/components/data-grid/labels.ts
index 1abf000..d24287e 100644
--- a/src/components/data-grid/labels.ts
+++ b/src/components/data-grid/labels.ts
@@ -99,6 +99,7 @@ export const DEFAULT_LABELS: DataGridLabels = {
   announceHidden: (caption) => `${caption} hidden`,
   announceShown: (caption) => `${caption} shown`,
   columnChooser: 'Columns',
+  exportCsv: 'Export CSV',
   lockedColumn: 'Always shown',
   lastShownColumn: 'At least one column stays shown',
   groupCount: (count) => `(${count})`,
diff --git a/src/components/data-grid/normalize.ts b/src/components/data-grid/normalize.ts
index 100d4fe..4ae4618 100644
--- a/src/components/data-grid/normalize.ts
+++ b/src/components/data-grid/normalize.ts
@@ -1,6 +1,7 @@
 import type {
   DataGridColumn,
   DataGridColumnLayout,
+  DataGridCsvOptions,
   DataGridEditing,
   DataGridExpandedGroups,
   DataGridFilter,
@@ -83,6 +84,7 @@ const MALFORMED = {
   totalSummary: '<DataGrid> totalSummary is not an object of values by id; no total is shown.',
   editing: '<DataGrid> editing is not an object with a mode; editing is off.',
   editingMode: '<DataGrid> editing has an unknown mode: editing is off.',
+  csvExport: '<DataGrid> csvExport is neither a boolean nor an object of options; it is off.',
 } as const;
 
 /** The modes of `editing` the grid has; a task adds its mode here. */
@@ -115,16 +117,59 @@ export type GivenProps<TRow> = Pick<
   | 'summary'
   | 'totalSummary'
   | 'editing'
+  | 'csvExport'
 >;
 
 /** The same props in shapes the grid can use, and the warnings about the ones that were not. */
-export interface SafeProps<TRow> extends GivenProps<TRow> {
+export interface SafeProps<TRow> extends Omit<GivenProps<TRow>, 'csvExport'> {
+  /** The options of `csvExport` that are of their type, `{}` for `true`; `undefined` when the export is off. */
+  csvExport: DataGridCsvOptions | undefined;
   /** The size of a page that `paging` gives, or the default. */
   pageSize: number;
   /** The words of the dev warnings, one for each prop that was not of its shape. */
   warnings: readonly string[];
 }
 
+const CSV_SEPARATORS: readonly unknown[] = [',', ';', '\t'];
+const CSV_VALUES: readonly unknown[] = ['formatted', 'raw'];
+
+/**
+ * The options of a CSV export that are of their type, and a warning for each that was not (an option outside its
+ * union is its default). `where` names the source in the words: the `csvExport` prop or a call of `exportCsv`. The
+ * words hold no value, so `devWarn` says each once. `download` is read too, and means something only to `exportCsv`.
+ */
+export function csvOptionsOf(
+  given: unknown,
+  where: 'csvExport' | 'exportCsv',
+): { options: DataGridCsvOptions & { download?: boolean }; warnings: string[] } {
+  const options: DataGridCsvOptions & { download?: boolean } = {};
+  const warnings: string[] = [];
+  if (!isObject(given)) return { options, warnings };
+  const bad = (name: string, rule: string, used: string) =>
+    warnings.push(`<DataGrid ${where}> ${name} must be ${rule}: ${used} is used.`);
+  const { fileName, separator, values, bom, selectedOnly, escapeFormulas, download } = given;
+  if (separator !== undefined) {
+    if (CSV_SEPARATORS.includes(separator)) options.separator = separator as ',' | ';' | '\t';
+    else bad('separator', "',', ';' or '\\t'", "','");
+  }
+  if (values !== undefined) {
+    if (CSV_VALUES.includes(values)) options.values = values as 'formatted' | 'raw';
+    else bad('values', "'formatted' or 'raw'", "'formatted'");
+  }
+  const flags = { bom, selectedOnly, escapeFormulas, download };
+  const used = { bom: 'true', selectedOnly: 'false', escapeFormulas: 'true', download: 'false' };
+  for (const name of Object.keys(flags) as (keyof typeof flags)[]) {
+    if (flags[name] === undefined) continue;
+    if (typeof flags[name] === 'boolean') options[name] = flags[name];
+    else bad(name, 'true or false', used[name]);
+  }
+  if (fileName !== undefined) {
+    if (typeof fileName === 'string') options.fileName = fileName;
+    else bad('fileName', 'a string', 'data.csv');
+  }
+  return { options, warnings };
+}
+
 /**
  * Turns the props of the grid that hold its data or its state into shapes it can use, so that a
  * value its type forbids, from JavaScript or from a state a person saved (spec phase 6 §5), never
@@ -379,6 +424,21 @@ export function normalizeProps<TRow>(given: GivenProps<TRow>): SafeProps<TRow> {
     return value as unknown as DataGridEditing<TRow>;
   }
 
+  // `csvExport`: `true` and an object are on, `undefined`, `null` and `false` are off, and any other value is off with a
+  // warning. The warnings of an object's options come after the others.
+  const csvWarnings: string[] = [];
+  function csvExport(value: unknown): DataGridCsvOptions | undefined {
+    if (value === undefined || value === null || value === false) return undefined;
+    if (value === true) return {};
+    if (!isObject(value)) {
+      problems.add('csvExport');
+      return undefined;
+    }
+    const { options, warnings } = csvOptionsOf(value, 'csvExport');
+    csvWarnings.push(...warnings);
+    return options;
+  }
+
   const safe = {
     data,
     columns,
@@ -403,7 +463,14 @@ export function normalizeProps<TRow>(given: GivenProps<TRow>): SafeProps<TRow> {
     summary: summary(given.summary),
     totalSummary: totalSummary(given.totalSummary),
     editing: editing(given.editing),
+    csvExport: csvExport(given.csvExport),
   };
   const order = Object.keys(MALFORMED) as Malformed[];
-  return { ...safe, warnings: order.filter((name) => problems.has(name)).map((n) => MALFORMED[n]) };
+  return {
+    ...safe,
+    warnings: [
+      ...order.filter((name) => problems.has(name)).map((n) => MALFORMED[n]),
+      ...csvWarnings,
+    ],
+  };
 }
diff --git a/src/components/data-grid/parts/ExportButton.tsx b/src/components/data-grid/parts/ExportButton.tsx
new file mode 100644
index 0000000..1d9ee85
--- /dev/null
+++ b/src/components/data-grid/parts/ExportButton.tsx
@@ -0,0 +1,38 @@
+import { memo } from 'react';
+import { DownloadIcon } from '../../../internal/icons';
+import { IconButton } from '../../icon-button/IconButton';
+import { TooltipContent, TooltipRoot, TooltipTrigger } from '../../tooltip/Tooltip';
+
+export interface ExportButtonProps {
+  /** The name of the button and the words of its tooltip (`labels.exportCsv`). */
+  label: string;
+  /** The press: the handle's `exportCsv` with `download: true`, the one function of both ways to export. */
+  onExport: () => void;
+}
+
+/**
+ * The button of the toolbar that downloads the rows as CSV (spec phase 6 §4.3 G1, §6.3 "Xuất CSV"): an icon button,
+ * `secondary` and `md` as the column chooser's, with a tooltip that says its name. The grid draws it only for a grid
+ * that asks for `csvExport`. It writes nothing itself and announces nothing: the browser's download is the answer.
+ */
+export const ExportButton = memo(function ExportButton({ label, onExport }: ExportButtonProps) {
+  return (
+    // The tooltip says the name the button has already, so it does not describe it.
+    <TooltipRoot describe={false}>
+      <TooltipTrigger>
+        <IconButton
+          variant="secondary"
+          size="md"
+          className="flg-data-grid-export-button"
+          aria-label={label}
+          onClick={onExport}
+        >
+          <DownloadIcon />
+        </IconButton>
+      </TooltipTrigger>
+      <TooltipContent side="bottom" align="center" sideOffset={8}>
+        {label}
+      </TooltipContent>
+    </TooltipRoot>
+  );
+});
diff --git a/src/components/data-grid/parts/toolbar-content.tsx b/src/components/data-grid/parts/toolbar-content.tsx
index 4d71286..7657669 100644
--- a/src/components/data-grid/parts/toolbar-content.tsx
+++ b/src/components/data-grid/parts/toolbar-content.tsx
@@ -1,6 +1,7 @@
 import { PlusIcon } from '../../../internal/icons';
 import { Button } from '../../button/Button';
 import { ColumnChooser } from './ColumnChooser';
+import { ExportButton } from './ExportButton';
 import { SearchBox } from './SearchBox';
 import { ToolbarSpacer } from './Toolbar';
 import type { ControlLabels } from '../labels';
@@ -24,6 +25,8 @@ export interface ToolbarContentOptions<TRow> {
   /** The words of the search field's own parts, made once per `labels`. */
   controlLabels: ControlLabels;
   showColumn: (columnId: string, show: boolean) => void;
+  /** The press of the export button: the handle's `exportCsv` that downloads; `null` without `csvExport`, and the button is none. */
+  exportCsv: (() => void) | null;
   /** Adds a row: the button of the toolbar calls it; `null` when the grid cannot add rows, and the button is none. */
   addRow: (() => void) | null;
   /**
@@ -63,6 +66,7 @@ export function toolbarContent<TRow>({
   labels,
   controlLabels,
   showColumn,
+  exportCsv,
   addRow,
   addVariant = 'primary',
 }: ToolbarContentOptions<TRow>) {
@@ -88,6 +92,10 @@ export function toolbarContent<TRow>({
           onToggle={showColumn}
         />
       ) : null,
+    exportButton:
+      exportCsv === null ? null : (
+        <ExportButton key="exportButton" label={labels.exportCsv} onExport={exportCsv} />
+      ),
     addButton:
       addRow === null ? null : (
         <Button key="addButton" variant={addVariant} size="md" onClick={addRow}>
@@ -98,13 +106,22 @@ export function toolbarContent<TRow>({
   };
   if (toolbar === false) return null;
   if (typeof toolbar === 'function') return toolbar(items);
-  if (!items.groupPanel && !items.search && !items.columnChooser && !items.addButton) return null;
+  if (
+    !items.groupPanel &&
+    !items.search &&
+    !items.columnChooser &&
+    !items.exportButton &&
+    !items.addButton
+  ) {
+    return null;
+  }
   return (
     <>
       {items.groupPanel}
       {items.spacer}
       {items.search}
       {items.columnChooser}
+      {items.exportButton}
       {items.addButton}
     </>
   );
diff --git a/src/components/data-grid/types.ts b/src/components/data-grid/types.ts
index 23b629a..8485ee4 100644
--- a/src/components/data-grid/types.ts
+++ b/src/components/data-grid/types.ts
@@ -417,6 +417,11 @@ export interface DataGridColumnBase<TRow, V> {
    * left out, since each group row already says its value.
    */
   showWhenGrouped?: boolean;
+  /**
+   * Whether the column is in the CSV (`csvExport`, `exportCsv()`); `true` when left out, and when the value is
+   * not a boolean. A column that is hidden is not in it either, whatever it says.
+   */
+  exportable?: boolean;
   /**
    * The operators the filter row offers, narrowed from the column's type, in the type's order and
    * with the type's first as the default. None of them being of the type: all of the type's.
@@ -681,6 +686,8 @@ export interface DataGridLabels {
   announceShown(caption: string): string;
   /** The title of the column chooser, and the name of its button. */
   columnChooser: string;
+  /** The name of the button that exports the rows as CSV (`csvExport`), and of its tooltip. */
+  exportCsv: string;
   /** What a box in the chooser that cannot be cleared says for its column, which is always shown. */
   lockedColumn: string;
   /** What a box in the chooser that cannot be cleared says when its column is the only one shown. */
@@ -866,6 +873,39 @@ export type DataGridLabelsInput = Partial<
   panelOperators?: Partial<DataGridLabels['panelOperators']>;
 };
 
+/**
+ * What the CSV export writes and how (spec phase 6 §6.3 "Xuất CSV"): the `csvExport` prop and the options of
+ * `exportCsv()`, which are laid over the prop's. An option outside its union is its default, with a warning.
+ *
+ * The rows are the ones the grid shows after the search and the filter, in the order shown and flat (no group,
+ * total or detail row), of every page, with their saved values: what is not saved yet, in any edit mode, is not
+ * in it, and a new row is not either; a row marked for deletion still is. The columns are the shown ones in the
+ * order drawn (left zone, middle, right zone), a grouped column at its place in the layout, without the grid's own
+ * and without the ones that say `exportable: false`. In server mode the rows are the page the grid holds.
+ */
+export interface DataGridCsvOptions {
+  /** The name of the downloaded file, used as it is given; `'data.csv'` when left out. */
+  fileName?: string;
+  /** What ends a field; `','` when left out. `';'` is the one Excel reads where the decimal mark is a comma. */
+  separator?: ',' | ';' | '\t';
+  /**
+   * `'formatted'` (the default) writes the text of the cells (the column's Intl format with the grid's
+   * `locale` and `timeZone`, a lookup's words, `labels.yes` and `labels.no`); `'raw'` writes the values: a number
+   * with a dot, a day as `YYYY-MM-DD`, an instant as ISO 8601 in UTC, a boolean as `true` or `false`, a lookup by
+   * its value.
+   */
+  values?: 'formatted' | 'raw';
+  /** Whether the text starts with a byte order mark, so that Excel reads it as UTF-8; `true` when left out. */
+  bom?: boolean;
+  /** Only the chosen rows, among the ones the search and the filter keep; `false` when left out. */
+  selectedOnly?: boolean;
+  /**
+   * Whether a text that starts with `=`, `+`, `-`, `@`, a tab or a CR gets a `'` before it, in a `string` column,
+   * a lookup and a heading, so that a spreadsheet does not run it as a formula; `true` when left out.
+   */
+  escapeFormulas?: boolean;
+}
+
 /**
  * What a `toolbar` function is given: the items the toolbar draws by default, each a node to place, or
  * `null` when its feature is off; the spacer is always there. The toolbar gets an item for each part
@@ -878,6 +918,8 @@ export interface DataGridToolbarItems {
   search: ReactNode;
   /** The button that opens the column chooser; `null` without `columnChooser`. */
   columnChooser: ReactNode;
+  /** The button that downloads the rows as CSV, between the chooser and the add button; `null` without `csvExport`. */
+  exportButton: ReactNode;
   /** The tray with the chips of the grouping; `null` without `groupPanel` (and in server mode). */
   groupPanel: ReactNode;
   /** The button that adds a row, last by default; `null` without `editing.allowAdding`. */
@@ -906,7 +948,7 @@ export type DataGridProps<TRow> = Omit<
   captionAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
   /**
    * The row above the grid: the caption, then the items of the grid (`groupPanel`, `spacer`, `search`,
-   * `columnChooser`, `addButton`). `false` takes the items away and keeps the caption, which names the grid and the
+   * `columnChooser`, `exportButton`, `addButton`). `false` takes the items away and keeps the caption, which names the grid and the
    * pager. A function is given the items, and what it returns is drawn after the caption instead of
    * them: place them in the order you like and add your own. The row is not drawn when it holds no
    * caption, no description and no item.
@@ -1106,6 +1148,13 @@ export type DataGridProps<TRow> = Omit<
    * column shown has a box that cannot be cleared. A box changes the layout at once.
    */
   columnChooser?: boolean;
+  /**
+   * Adds a button to the toolbar, after the column chooser, that downloads the rows as CSV (`false` when left out;
+   * `true` and an object of options are on, and anything else is `false`, with a warning). The options are the ones
+   * `exportCsv()` takes; an object written in the JSX that says what it said before draws no row. The press does what
+   * `exportCsv({ ...csvExport, download: true })` does.
+   */
+  csvExport?: boolean | DataGridCsvOptions;
   /**
    * Adds the group panel to the toolbar, before the search field (`false` when left out; any value that
    * is not `true` is `false`): a tray that holds a chip for each level of the grouping, in order. A chip
@@ -1303,6 +1352,16 @@ export interface DataGridHandle {
    * `false`, whether or not a field of it can take the focus.
    */
   saveChanges(): Promise<boolean>;
+  /**
+   * The rows as CSV, always returned as a string (`DataGridCsvOptions` says which rows and which columns). The
+   * `options` are laid over the ones of `csvExport`, which is not needed to call it. It also downloads the file,
+   * as `text/csv;charset=utf-8` under `fileName` (`'data.csv'`), when the call says `download: true` or gives a
+   * `fileName`; a `fileName` of the prop alone only names the download of the button. Nothing is announced. The rows
+   * are read as the last commit showed them, so call it from a handler, not while rendering. In server mode it writes
+   * the page the grid holds and warns once: export the whole data on the server. A `format` or `value` of the app
+   * that throws on a saved row throws from here as it does when the cell is drawn.
+   */
+  exportCsv(options?: DataGridCsvOptions & { download?: boolean }): string;
   /**
    * Drops what has not been saved and closes any editor: every change of `batch` mode, the row being edited in
    * `row` mode, the open form or Dialog of `form` and `popup` mode, the cell being edited and the new rows of `cell`
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 76c046c..2c6e301 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -71,7 +71,7 @@ row 40, the muted text of a group row (the name of the column, the count, "Total
 text on the wash of a new row and of a changed cell, a row marked for deletion), and its part in row
 1, the border of the Input and the Select of the filter row and of the search field of the header
 filter, in row 2, the focus ring of the button of a column menu, of the funnel of a header filter,
-of the column chooser, of the operator button of a filter cell, of the "Clear filter" button of an
+of the column chooser, of the export button, of the operator button of a filter cell, of the "Clear filter" button of an
 empty grid, of the button and the switch of the filter panel, of the buttons of a group chip, of the
 detail toggle and of the handle of a row, in row 14, the line that shows where a column or a row is
 dropped, in rows 20 and 22, the "Clear filter" button and the "and" of that panel, and in row 6, the
diff --git a/src/internal/download.ts b/src/internal/download.ts
new file mode 100644
index 0000000..2f6799b
--- /dev/null
+++ b/src/internal/download.ts
@@ -0,0 +1,17 @@
+/**
+ * Offers a text to the user as a file: a `Blob` behind a temporary link that is clicked, which the browser
+ * saves under `fileName`. The address of the blob is given back in a later task, after the click has been taken.
+ * Where there is no `document` (the server) it does nothing: a download is the answer to a press.
+ */
+export function downloadText(text: string, fileName: string, type: string): void {
+  if (typeof document === 'undefined') return;
+  const url = URL.createObjectURL(new Blob([text], { type }));
+  const link = document.createElement('a');
+  link.href = url;
+  link.download = fileName;
+  link.hidden = true;
+  document.body.append(link);
+  link.click();
+  link.remove();
+  setTimeout(() => URL.revokeObjectURL(url), 0);
+}
diff --git a/src/internal/icons.tsx b/src/internal/icons.tsx
index 314bc58..4f98770 100644
--- a/src/internal/icons.tsx
+++ b/src/internal/icons.tsx
@@ -508,3 +508,14 @@ export function AlertCircleIcon(props: SVGProps<SVGSVGElement>) {
     </svg>
   );
 }
+
+/** A tray with an arrow into it: the button that exports a DataGrid as CSV. */
+export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
+  return (
+    <svg {...strokeIcon} {...props}>
+      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
+      <path d="m7 10 5 5 5-5" />
+      <path d="M12 15V3" />
+    </svg>
+  );
+}
diff --git a/src/styles/components/data-grid.css b/src/styles/components/data-grid.css
index 1c8a589..0643eb5 100644
--- a/src/styles/components/data-grid.css
+++ b/src/styles/components/data-grid.css
@@ -259,7 +259,8 @@
     flex: 1 1 0;
     min-width: 0;
   }
-  .flg-data-grid-chooser-button {
+  .flg-data-grid-chooser-button,
+  .flg-data-grid-export-button {
     flex: none;
   }
   /* The search field (G1): 260px, which the row does not squeeze, between the spacer and the chooser. */
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check && npx tsc --noEmit -p . && pnpm check:name
pnpm check:contrast
pnpm vitest run --project unit --maxWorkers=3 src/components/data-grid src/internal src/docs
pnpm vitest run --project unit-react18 --maxWorkers=3 src/components/data-grid src/internal src/docs
pnpm vitest run --project scripts --maxWorkers=3
for d in src/components/data-grid src/docs; do
  for b in chromium firefox webkit; do
    pnpm vitest run --project storybook-light --browser=$b $d
    pnpm vitest run --project storybook-dark --browser=$b $d
  done
done
pnpm build && pnpm check:package
pnpm build-storybook && pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`, `tsc -p .`, `check:name`: PASS. `pnpm check:contrast`: `Contrast check passed.` (không cặp mới; nhãn dòng 2 nêu nút xuất).
- `unit` (`data-grid`, `internal`, `docs`): 134 file, 3672 PASS (1 skipped); `unit-react18`: 67 file, 2370 PASS (2 skipped); `scripts`: 7 file, 261 PASS (`check-dist-css.ts` đổi). `src/docs/ExceptionTable.test.tsx` vẫn đếm 43 dòng. Claude chạy lại cả ba project trên commit nháp: `unit` 237 file, 5880 PASS; `unit-react18` 121 file, 4345 PASS; `scripts` 261; mọi bước của `check-p6g.sh` pass (bản ghi `task-2-claude-check.txt`).
- `engine/perf.test.ts`: hai ca CSV dưới 30 ms (formatted) và 90 ms (raw); ở bản nháp trung vị 9–10 ms và 28–30 ms (phát hiện 8). Nếu ca formatted chập chờn trên một máy bận, nâng mục tiêu, không sửa code.
- Story, ở mỗi lượt (sáu lượt): data-grid 139, docs 26 PASS.
- `pnpm build && pnpm check:package`: PASS với ngưỡng cũ; "JS (DataGrid)" 98.18 kB (+1.30 kB: engine, `downloadText`, icon, nút; ngưỡng 105887 B), JS (all exports) 58.02 kB (grid chưa ở gốc gói), CSS 20.97 kB.
- `pnpm check:docs-tables`: `no table built as text in 225 files`; index đã build có `components-datagrid-filtering--csv-export` mang `unreleased` và `no-visual`.
- Ảnh (Claude, bản Storybook nháp): `G1` ở sáng, tối và forced colours: nút xuất sau nút chọn cột, 34×34, cách 8px, icon của mockup, không gì xuống hàng; ở forced colours icon và viền lấy màu hệ thống (quy tắc của IconButton).
- Fixture không chạy: không fixture nào đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  scripts/check-dist-css.ts \
  scripts/contrast-exceptions.ts \
  src/components/data-grid/DataGrid.chooser.test.tsx \
  src/components/data-grid/DataGrid.csv.test.tsx \
  src/components/data-grid/DataGrid.loading.test.tsx \
  src/components/data-grid/DataGrid.mdx \
  src/components/data-grid/DataGrid.renders.test.tsx \
  src/components/data-grid/DataGrid.test-d.ts \
  src/components/data-grid/DataGrid.tsx \
  src/components/data-grid/DataGridColumns.stories.tsx \
  src/components/data-grid/DataGridEditing.stories.tsx \
  src/components/data-grid/DataGridFiltering.stories.tsx \
  src/components/data-grid/DataGridGrouping.stories.tsx \
  src/components/data-grid/columns.test-d.ts \
  src/components/data-grid/engine/csv.test.ts \
  src/components/data-grid/engine/csv.ts \
  src/components/data-grid/engine/perf.test.ts \
  src/components/data-grid/engine/pipeline.test.ts \
  src/components/data-grid/engine/pipeline.ts \
  src/components/data-grid/engine/values.test.ts \
  src/components/data-grid/engine/values.ts \
  src/components/data-grid/hooks/use-csv-export.ts \
  src/components/data-grid/hooks/use-normalized-props.ts \
  src/components/data-grid/index.ts \
  src/components/data-grid/labels.ts \
  src/components/data-grid/normalize.ts \
  src/components/data-grid/parts/ExportButton.tsx \
  src/components/data-grid/parts/toolbar-content.tsx \
  src/components/data-grid/types.ts \
  src/docs/Accessibility.mdx \
  src/internal/download.test.ts \
  src/internal/download.ts \
  src/internal/icons.test.tsx \
  src/internal/icons.tsx \
  src/styles/components/data-grid.css
```
```bash
git commit -m "feat(data-grid): CSV export: csvExport, exportCsv(), exportable and the export button" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 3: công thức lưu trạng thái, chạy bằng test và một story

Spec §6.3 "Lưu trạng thái", §3.9, §5 (trạng thái sai dạng), §7 lớp 1, §8 `DataGrid.mdx`. Không có mockup. Bắt đầu từ commit của Task 2.
- **Công thức** (phát hiện 9): `'use client'`, khoá `orders-grid-v1`, trạng thái đọc trong một effect, grid mang `key={saved ? 'saved' : 'default'}` nên mount lại một lần sau khi đọc; `onStateChange` ghi năm phần (`sort`, `filter`, `grouping`, `columnLayout`, `page`) trong `try`. HTML của server là trạng thái mặc định.
- **Docs là test:** khối `OrdersGrid` của "### Saving the state" (trước "## Keyboard") là đúng văn bản của component trong `saved-state.test.tsx`, giữa hai chú thích `// --- The recipe, as DataGrid.mdx writes it … ---` và `// --- End of the recipe. ---` (MDX thêm import). Mỗi câu của mục được một ca chứng minh. Đoạn State kể đủ tám prop `default*`.
- **Story** `SavedState` (`DataGrid.stories.tsx`, `no-visual`): `localStorage` thật và lần mount lại qua nút "Reload", khoá riêng `saved-state-story-v1`.
- Không đổi code thư viện. Spec §6.3 được sửa (phát hiện 21).

**Files:**
- Create: `src/components/data-grid/saved-state.test.tsx`
- Modify: `src/components/data-grid/DataGrid.mdx`, `DataGrid.stories.tsx`; `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`

**Interfaces:**
- Không tên công khai nào thêm, đổi hay bỏ. Công thức dùng `DataGridState`, `onStateChange` và năm prop `default*` có sẵn.
- Story: `SavedState` (`no-visual`; `beforeEach` và `finally` xoá khoá của nó).
- Task sau dùng: Task 5 (ví dụ chép công thức với khoá `lumen-orders-grid-v1-wide` / `-phone`), Task 6 (Getting started liên kết tới trang DataGrid).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/data-grid/DataGrid.stories.tsx b/src/components/data-grid/DataGrid.stories.tsx
index 015556f..f057053 100644
--- a/src/components/data-grid/DataGrid.stories.tsx
+++ b/src/components/data-grid/DataGrid.stories.tsx
@@ -11,7 +11,13 @@ import type { TableVariant } from '../table/Table';
 import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table/table-parts';
 import { DataGrid } from './DataGrid';
 import { ROW_HEIGHT, rowPitch } from './row-heights';
-import type { DataGridColumn, DataGridDensity, DataGridHandle, DataGridProps } from './index';
+import type {
+  DataGridColumn,
+  DataGridDensity,
+  DataGridHandle,
+  DataGridProps,
+  DataGridState,
+} from './index';
 
 interface Order {
   id: string;
@@ -2214,3 +2220,90 @@ export const EmptyScrolled: Story = {
     ).toBeLessThan(frame.offsetWidth - frame.clientWidth + 2);
   },
 };
+
+const SAVED_STATE_KEY = 'saved-state-story-v1';
+
+/** The recipe of the docs' "Saving the state", with the key of this story and the story's orders. */
+const SavedStateGrid = () => {
+  const [saved, setSaved] = useState<Partial<DataGridState> | null>(null);
+  useEffect(() => {
+    try {
+      setSaved(JSON.parse(localStorage.getItem(SAVED_STATE_KEY) ?? 'null'));
+    } catch {
+      // Private mode or text that is no JSON: the default state stays.
+    }
+  }, []);
+  return (
+    <DataGrid
+      key={saved ? 'saved' : 'default'}
+      data={ORDERS}
+      rowKey="id"
+      columns={COLUMNS}
+      caption="Orders"
+      defaultSort={saved?.sort}
+      defaultFilter={saved?.filter}
+      defaultGrouping={saved?.grouping}
+      defaultColumnLayout={saved?.columnLayout}
+      defaultPage={saved?.page}
+      onStateChange={({ sort, filter, grouping, columnLayout, page }) => {
+        try {
+          localStorage.setItem(
+            SAVED_STATE_KEY,
+            JSON.stringify({ sort, filter, grouping, columnLayout, page }),
+          );
+        } catch {
+          // Private mode or a full storage: the state is not kept, the grid goes on.
+        }
+      }}
+    />
+  );
+};
+
+/** "Reload" stands for a new visit: it mounts the recipe's component anew, which reads the storage again. */
+const SavedStateReload = () => {
+  const [visit, setVisit] = useState(1);
+  return (
+    <div data-testid="saved-state">
+      <button type="button" onClick={() => setVisit((count) => count + 1)}>
+        Reload
+      </button>
+      <SavedStateGrid key={visit} />
+    </div>
+  );
+};
+
+/**
+ * The recipe of the docs, with the real `localStorage`: a sort is stored by the press, and a visit that
+ * mounts the component anew has it back. The key is removed before the story and after it.
+ */
+export const SavedState: Story = {
+  tags: ['no-visual'],
+  beforeEach: () => {
+    localStorage.removeItem(SAVED_STATE_KEY);
+  },
+  render: () => <SavedStateReload />,
+  play: async ({ canvas }) => {
+    try {
+      const root = canvas.getByTestId('saved-state');
+      const sortOf = () => headOf(root, 'Order date');
+      await expect(sortOf()).not.toHaveAttribute('aria-sort');
+      titleOf(root, 'Order date').click();
+      await waitFor(() => expect(sortOf()).toHaveAttribute('aria-sort', 'ascending'), {
+        timeout: 5000,
+      });
+      await expect(JSON.parse(localStorage.getItem(SAVED_STATE_KEY)!).sort).toEqual([
+        { field: 'date', direction: 'asc' },
+      ]);
+
+      const before = sortOf();
+      within(root).getByRole('button', { name: 'Reload' }).click();
+      await waitFor(() => expect(before.isConnected).toBe(false), { timeout: 5000 });
+      // The new visit draws the default state first, then reads the storage after it mounts.
+      await waitFor(() => expect(sortOf()).toHaveAttribute('aria-sort', 'ascending'), {
+        timeout: 5000,
+      });
+    } finally {
+      localStorage.removeItem(SAVED_STATE_KEY);
+    }
+  },
+};
diff --git a/src/components/data-grid/saved-state.test.tsx b/src/components/data-grid/saved-state.test.tsx
new file mode 100644
index 0000000..fa529cc
--- /dev/null
+++ b/src/components/data-grid/saved-state.test.tsx
@@ -0,0 +1,283 @@
+import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
+import { createRef, useEffect, useState } from 'react';
+import { renderToString } from 'react-dom/server';
+import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
+import { resetDevWarnings } from '../../internal/warn';
+import { DataGrid } from './DataGrid';
+import type { DataGridColumn, DataGridHandle, DataGridState } from './index';
+
+// The saved-state recipe of `DataGrid.mdx` ("Saving the state", spec phase 6 §6.3 "Lưu trạng thái"), written here
+// exactly as the page writes it, and what it does through the grid. The grid has no `stateStoring`: an app keeps
+// the state in `onStateChange` and gives it back as the `default*` props. Most cases are characterizations of what
+// the grid already does, so they pass on the first run.
+
+interface Order {
+  id: string;
+  customer: string;
+  status: string;
+  qty: number;
+}
+
+const STATUSES = ['new', 'processing', 'delivered'];
+const ORDERS: Order[] = Array.from({ length: 12 }, (_, index) => ({
+  id: `DH-${1000 + index}`,
+  customer: `Customer ${index + 1}`,
+  status: STATUSES[index % 3]!,
+  qty: ((index * 5) % 9) + 1,
+}));
+
+const columns: DataGridColumn<Order>[] = [
+  { field: 'id', caption: 'Order', rowHeader: true, width: 104 },
+  { field: 'customer', caption: 'Customer', width: 160 },
+  { field: 'status', caption: 'Status', width: 120 },
+  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80 },
+];
+
+// --- The recipe, as `DataGrid.mdx` writes it (its imports come from 'h2d-glass-ui' there). ---
+const KEY = 'orders-grid-v1';
+
+function OrdersGrid({ data }: { data: Order[] }) {
+  const [saved, setSaved] = useState<Partial<DataGridState> | null>(null);
+  useEffect(() => {
+    try {
+      setSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
+    } catch {
+      // Private mode or text that is no JSON: the default state stays.
+    }
+  }, []);
+  return (
+    <DataGrid
+      key={saved ? 'saved' : 'default'}
+      data={data}
+      rowKey="id"
+      columns={columns}
+      caption="Orders"
+      defaultSort={saved?.sort}
+      defaultFilter={saved?.filter}
+      defaultGrouping={saved?.grouping}
+      defaultColumnLayout={saved?.columnLayout}
+      defaultPage={saved?.page}
+      onStateChange={({ sort, filter, grouping, columnLayout, page }) => {
+        try {
+          localStorage.setItem(KEY, JSON.stringify({ sort, filter, grouping, columnLayout, page }));
+        } catch {
+          // Private mode or a full storage: the state is not kept, the grid goes on.
+        }
+      }}
+    />
+  );
+}
+// --- End of the recipe. ---
+
+beforeEach(() => {
+  resetDevWarnings();
+  localStorage.removeItem(KEY);
+});
+afterEach(() => {
+  vi.restoreAllMocks();
+  localStorage.removeItem(KEY);
+});
+
+const spyWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});
+const head = (caption: string) =>
+  Array.from(document.querySelectorAll<HTMLElement>('thead th')).find((th) =>
+    th.textContent?.startsWith(caption),
+  );
+const sortButton = (caption: string) => head(caption)!.querySelector('button')!;
+const pageInfo = () => document.querySelector('.flg-data-grid-page-info')?.textContent;
+const ids = () =>
+  Array.from(document.querySelectorAll('tbody > tr.flg-data-grid-row'), (row) =>
+    row.children[0]!.textContent?.trim(),
+  );
+
+describe('the saved-state recipe', () => {
+  it('shows the default state when nothing is stored', () => {
+    render(<OrdersGrid data={ORDERS} />);
+    expect(head('Qty')).not.toHaveAttribute('aria-sort');
+    expect(head('Customer')).toBeInTheDocument();
+    expect(ids()).toHaveLength(12);
+    expect(localStorage.getItem(KEY)).toBeNull();
+  });
+
+  it('stores the five parts, and nothing else, when a press sorts', () => {
+    render(<OrdersGrid data={ORDERS} />);
+    fireEvent.click(sortButton('Qty'));
+    const stored = JSON.parse(localStorage.getItem(KEY)!);
+    expect(Object.keys(stored).sort()).toEqual([
+      'columnLayout',
+      'filter',
+      'grouping',
+      'page',
+      'sort',
+    ]);
+    expect(stored.sort).toEqual([{ field: 'qty', direction: 'asc' }]);
+    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
+  });
+
+  it('shows a stored state after the effect: the sort, a hidden column, the grouping and the page', () => {
+    localStorage.setItem(
+      KEY,
+      JSON.stringify({
+        sort: [{ field: 'qty', direction: 'desc' }],
+        grouping: [{ field: 'status', direction: 'asc' }],
+        columnLayout: { hidden: ['customer'] },
+        page: { index: 1, size: 5 },
+      }),
+    );
+    render(<OrdersGrid data={ORDERS} />);
+    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
+    expect(head('Customer')).toBeUndefined();
+    expect(screen.getByRole('treegrid')).toBeInTheDocument();
+    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
+    expect(pageInfo()).toMatch(/^6–10 of/);
+  });
+
+  it('takes a column that is gone, and one that is new, without a word', () => {
+    const warn = spyWarn();
+    localStorage.setItem(
+      KEY,
+      JSON.stringify({
+        sort: [
+          { field: 'gone', direction: 'asc' },
+          { field: 'qty', direction: 'desc' },
+        ],
+        grouping: [{ field: 'gone', direction: 'asc' }],
+        filter: { columns: { gone: { operator: '=', value: 1 } } },
+        columnLayout: { order: ['gone', 'qty', 'id'], hidden: ['gone'] },
+        page: { index: 40, size: 5 },
+      }),
+    );
+    render(<OrdersGrid data={ORDERS} />);
+    expect(warn).not.toHaveBeenCalled();
+    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
+    // The ids it names come first, the one it does not name is appended, the one that is gone is dropped.
+    const captions = Array.from(document.querySelectorAll('thead th'), (th) =>
+      th.textContent?.trim(),
+    );
+    expect(captions.filter(Boolean)).toEqual(['Qty', 'Order', 'Customer', 'Status']);
+    // A page past the end is the last one.
+    expect(pageInfo()).toMatch(/^11–12 of 12/);
+  });
+
+  it('is the default for text that is no JSON, and throws nothing', () => {
+    const warn = spyWarn();
+    localStorage.setItem(KEY, '{');
+    expect(() => render(<OrdersGrid data={ORDERS} />)).not.toThrow();
+    expect(head('Qty')).not.toHaveAttribute('aria-sort');
+    expect(ids()).toHaveLength(12);
+    expect(warn).not.toHaveBeenCalled();
+  });
+
+  it('is the default sort, with one shape warning, for a state of the wrong shape', () => {
+    const warn = spyWarn();
+    localStorage.setItem(KEY, JSON.stringify({ sort: 5 }));
+    render(<OrdersGrid data={ORDERS} />);
+    expect(head('Qty')).not.toHaveAttribute('aria-sort');
+    expect(warn).toHaveBeenCalledTimes(1);
+    expect(warn.mock.calls[0]?.[0]).toContain('defaultSort is not an array of sort items');
+  });
+
+  it('goes on when the storage throws, on a read and on a write', () => {
+    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
+      throw new DOMException('denied', 'SecurityError');
+    });
+    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
+      throw new DOMException('full', 'QuotaExceededError');
+    });
+    expect(() => render(<OrdersGrid data={ORDERS} />)).not.toThrow();
+    expect(() => fireEvent.click(sortButton('Qty'))).not.toThrow();
+    expect(set).toHaveBeenCalledOnce();
+    expect(head('Qty')).toHaveAttribute('aria-sort', 'ascending');
+  });
+
+  it('writes what it reads back: a sorted grid, reloaded, is sorted again', () => {
+    const first = render(<OrdersGrid data={ORDERS} />);
+    fireEvent.click(sortButton('Qty'));
+    fireEvent.click(sortButton('Qty'));
+    const sorted = ids();
+    first.unmount();
+    render(<OrdersGrid data={ORDERS} />);
+    expect(head('Qty')).toHaveAttribute('aria-sort', 'descending');
+    expect(ids()).toEqual(sorted);
+  });
+
+  it('keeps the sort, grouping and filter of a field the grid lacks in the state it gives back', () => {
+    const ref = createRef<DataGridHandle>();
+    const sort = [
+      { field: 'gone', direction: 'asc' as const },
+      { field: 'qty', direction: 'desc' as const },
+    ];
+    const grouping = [{ field: 'gone', direction: 'asc' as const }];
+    const filter = { columns: { gone: { operator: '=' as const, value: 1 } } };
+    render(
+      <DataGrid
+        ref={ref}
+        data={ORDERS}
+        rowKey="id"
+        columns={columns}
+        caption="Orders"
+        defaultSort={sort}
+        defaultGrouping={grouping}
+        defaultFilter={filter}
+      />,
+    );
+    const state = ref.current!.getState();
+    expect(state.sort).toEqual(sort);
+    expect(state.grouping).toEqual(grouping);
+    expect(state.filter.columns).toEqual(filter.columns);
+  });
+
+  it('calls no onStateChange for an edit, and the state has exactly the eight parts', () => {
+    const onStateChange = vi.fn();
+    // jsdom has no checkVisibility, which the grid asks before it moves the focus into an editor.
+    HTMLElement.prototype.checkVisibility = () => true;
+    onTestFinished(() => void Reflect.deleteProperty(HTMLElement.prototype, 'checkVisibility'));
+    const ref = createRef<DataGridHandle>();
+    render(
+      <DataGrid
+        ref={ref}
+        data={ORDERS}
+        rowKey="id"
+        columns={columns}
+        caption="Orders"
+        editing={{ mode: 'batch' }}
+        onSaving={() => {}}
+        onStateChange={onStateChange}
+      />,
+    );
+    const cell = Array.from(document.querySelectorAll<HTMLElement>('tbody > tr > td')).find(
+      (td) => td.textContent === 'Customer 1',
+    )!;
+    act(() => cell.click());
+    const field = screen.getByLabelText('Customer') as HTMLInputElement;
+    act(() => void fireEvent.change(field, { target: { value: 'Hoa' } }));
+    act(() => {
+      fireEvent(
+        field,
+        createEvent.keyDown(field, { key: 'Enter', bubbles: true, cancelable: true }),
+      );
+    });
+    expect(document.querySelector('.flg-data-grid-savebar')).not.toBeNull();
+    expect(onStateChange).not.toHaveBeenCalled();
+    expect(Object.keys(ref.current!.getState()).sort()).toEqual([
+      'columnLayout',
+      'expandedGroups',
+      'expandedRows',
+      'filter',
+      'grouping',
+      'page',
+      'selectedKeys',
+      'sort',
+    ]);
+  });
+
+  it('renders on the server the HTML of the default grid', () => {
+    localStorage.setItem(KEY, JSON.stringify({ sort: [{ field: 'qty', direction: 'asc' }] }));
+    const defaults = renderToString(
+      <DataGrid data={ORDERS} rowKey="id" columns={columns} caption="Orders" />,
+    );
+    // Effects do not run on the server and the recipe never reads `localStorage` in a render: the stored
+    // sort is not in the HTML.
+    expect(renderToString(<OrdersGrid data={ORDERS} />)).toBe(defaults);
+  });
+});
```

- [ ] **Step 2: Chạy test, xác nhận nó pass ngay (đặc tả)**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --project unit-react18 --maxWorkers=3 src/components/data-grid/saved-state.test.tsx
```

Expected: PASS, 11 ca ở mỗi project. Không gì fail trước được: grid đã làm điều công thức cần, và task này chỉ thêm docs cùng test của nó.

Theo báo cáo của bản nháp (phát hiện 20): **cả 11 ca là đặc tả**; chỉ lỗi của chính người viết fail trước (hướng sắp xếp viết `'ascending'` thay vì `'asc'`; ca batch cần stub `HTMLElement.prototype.checkVisibility` trong jsdom, gỡ trong `onTestFinished`). Không kiểm đột biến nào. Claude chạy lại 11 ca ở hai bản React: 11 / 11 mỗi bản. Story `SavedState` chạy ở Step 4 trên đúng grid như cũ (khối code của task không đổi code thư viện).

- [ ] **Step 3: Viết code**

````diff
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index 23cf67e..0add33e 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -1166,7 +1166,7 @@ function OrdersGrid({ data }: { data: Order[] }) {
 }
 ```
 
-- Không lưu `selectedKeys`, `expandedRows`, `expandedGroups` theo mặc định (thuộc về một lần làm việc); docs nói cách thêm. Id cột không còn bị bỏ qua lặng lẽ (§5), nên trạng thái cũ không làm hỏng grid; hậu tố của khoá để bỏ hẳn trạng thái cũ khi cấu hình đổi lớn.
+- Không lưu `selectedKeys`, `expandedRows`, `expandedGroups` theo mặc định (thuộc về một lần làm việc); docs nói cách thêm. Id cột không còn bị bỏ qua lặng lẽ (§5), nên trạng thái cũ không làm hỏng grid; hậu tố của khoá để bỏ hẳn trạng thái cũ khi cấu hình đổi lớn. Công thức docs là component mà test chạy, từng dòng (`saved-state.test.tsx`); hai điểm khác bản trên: `catch` có ghi chú và trạng thái sai dạng (`sort: 5`) rơi về mặc định kèm một cảnh báo dev mỗi prop (§5), còn văn bản không phải JSON thì rơi về mặc định không cảnh báo (phát hiện khi lập Plan G).
 
 **`labels`** (mặc định tiếng Anh; khoá chèn giá trị là hàm; `name` là chữ của cột `rowHeader`, vẽ hay không, hay khoá của dòng):
 
diff --git a/src/components/data-grid/DataGrid.mdx b/src/components/data-grid/DataGrid.mdx
index a3770f6..237e0f3 100644
--- a/src/components/data-grid/DataGrid.mdx
+++ b/src/components/data-grid/DataGrid.mdx
@@ -2194,8 +2194,10 @@ returns it, with the part the press asks for in its place: a page that is past t
 is sent as the page that is drawn, so what you save is never a page that is not there. It is called
 from what a person does, never from a render: a controlled value that you change from outside does
 not call it. The one exception is the page that server mode asks for (see Server mode). The state
-holds only what JSON can carry, so it can go to `localStorage` or to a server and come back as
-`defaultSort`, `defaultPage`, `defaultFilter`, `defaultSelectedKeys` and `defaultColumnLayout`.
+holds only what JSON can carry, so it can go to `localStorage` or to a server and come back as the
+eight `default*` props: `defaultSort`, `defaultFilter`, `defaultPage`, `defaultSelectedKeys`,
+`defaultColumnLayout`, `defaultGrouping`, `defaultExpandedGroups` and `defaultExpandedRows`. The
+recipe in "Saving the state" below does it for five of them.
 
 `ref.current.getState()` returns the state the grid shows as its last commit left it, which is from
 its first commit on: what you hold, but with the page as drawn.
@@ -2211,6 +2213,93 @@ prop warns once in
 development, without its value. What a state may hold for good reasons is still taken without a
 word: a column that is gone, a direction or a key that means nothing, a page out of range.
 
+### Saving the state
+
+The grid has no `stateStoring` option: it does not know where an app keeps things. The state goes out
+through `onStateChange` and comes back through the `default*` props, and the recipe below is the
+whole of it. It is the component that the unit tests run, line for line.
+
+```tsx
+'use client';
+import { useEffect, useState } from 'react';
+import { DataGrid, type DataGridState } from 'h2d-glass-ui';
+import { columns, type Order } from './columns';
+
+const KEY = 'orders-grid-v1';
+
+function OrdersGrid({ data }: { data: Order[] }) {
+  const [saved, setSaved] = useState<Partial<DataGridState> | null>(null);
+  useEffect(() => {
+    try {
+      setSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
+    } catch {
+      // Private mode or text that is no JSON: the default state stays.
+    }
+  }, []);
+  return (
+    <DataGrid
+      key={saved ? 'saved' : 'default'}
+      data={data}
+      rowKey="id"
+      columns={columns}
+      caption="Orders"
+      defaultSort={saved?.sort}
+      defaultFilter={saved?.filter}
+      defaultGrouping={saved?.grouping}
+      defaultColumnLayout={saved?.columnLayout}
+      defaultPage={saved?.page}
+      onStateChange={({ sort, filter, grouping, columnLayout, page }) => {
+        try {
+          localStorage.setItem(KEY, JSON.stringify({ sort, filter, grouping, columnLayout, page }));
+        } catch {
+          // Private mode or a full storage: the state is not kept, the grid goes on.
+        }
+      }}
+    />
+  );
+}
+```
+
+<Canvas of={Stories.SavedState} />
+
+**The server's HTML is the default state.** The recipe reads `localStorage` in an effect, never
+while it renders, so the server and the first render in the browser draw the same grid. After the
+mount it sets the stored state, and the `key` changes from `default` to `saved`: the grid mounts
+once more with the stored state as its starting values.
+
+**What it saves.** The sort, the filter, the grouping, the layout of the columns and the page: what
+a person arranges to read the data in their way. It leaves out `selectedKeys`, `expandedRows` and
+`expandedGroups`, which belong to one sitting: a selection or an open detail that comes back
+tomorrow is a surprise. To save them as well, add them to the object that `onStateChange` stores,
+and give them back as `defaultSelectedKeys`, `defaultExpandedRows` and `defaultExpandedGroups`: three
+more props and three more fields.
+
+**A state meets the columns it finds.** The columns can change between two visits, and the grid
+takes the stored state without a word:
+
+- a column id that is gone is dropped from the layout, and a column that is new is appended to it;
+- a sort or grouping item of a field the grid does not have is ignored, and stays in the state;
+- a filter condition of a column the grid does not have stays, and filters nothing;
+- a page past the end is the last page.
+
+When the columns change a lot, change the suffix of the key (`orders-grid-v2`): the old state is
+never read again.
+
+**A state of the wrong shape is the default.** A `sort` that is not an array, or a `page` that is
+not an object, comes from a storage that someone edited or from another version of the recipe. The
+grid never throws on it: that part is its default, and the prop warns once in development, in the
+words of `defaultSort is not an array of sort items`, without the value. Text that is no JSON is
+the default too, and warns nothing: the recipe catches it.
+
+**Private mode and a full storage.** `localStorage` can throw, on a read and on a write. Both calls
+are in a `try`, so the grid goes on without keeping its state.
+
+**The edit state is not in it.** Unsaved changes, the row or the cell being edited, a save that is
+being sent and its errors are never in `DataGridState`, in `getState()` or in `onStateChange`: an
+edit calls none of them. Bringing them back after a reload would write old edits over data that
+has changed since, would keep rows that are not complete in the browser's storage, and would go
+around `onSaving`, the one path that a change takes to your data.
+
 ## Keyboard
 
 The grid follows the data grid pattern of the WAI-ARIA Authoring Practices: it is **one stop of
````

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check && npx tsc --noEmit -p . && pnpm check:name
pnpm vitest run --project unit --maxWorkers=3 src/components/data-grid
pnpm vitest run --project unit-react18 --maxWorkers=3 src/components/data-grid
for b in chromium firefox webkit; do
  pnpm vitest run --project storybook-light --browser=$b src/components/data-grid
  pnpm vitest run --project storybook-dark --browser=$b src/components/data-grid
done
diff <(sed -n '/^function OrdersGrid({ data }/,/^}/p' src/components/data-grid/saved-state.test.tsx) <(sed -n '/^function OrdersGrid({ data }/,/^}/p' src/components/data-grid/DataGrid.mdx)
pnpm build && pnpm check:package
pnpm build-storybook && pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`, `tsc -p .`, `check:name`: PASS.
- `unit` (`src/components/data-grid`): 85 file, 3063 PASS; `unit-react18`: 47 file, 2067 PASS.
- Story data-grid: 140 PASS ở mỗi lượt (sáu lượt). Không play nào của một story A–F đổi.
- `diff` không in gì: khối của docs là component mà test chạy (31 dòng).
- `pnpm build && pnpm check:package`: PASS, số đo không đổi (98.18 kB, 58.02 kB, 20.97 kB).
- `pnpm check:docs-tables`: `no table built as text in 225 files`.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  src/components/data-grid/DataGrid.mdx \
  src/components/data-grid/DataGrid.stories.tsx \
  src/components/data-grid/saved-state.test.tsx
```
```bash
git commit -m "docs(data-grid): the saved-state recipe, run by tests and by a story" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 4: export `DataGrid` từ gốc gói, bỏ thẻ `unreleased`

Spec §2 (đoạn `unreleased`, dòng tsdown của "Thay đổi ở code cũ", gạch Plan G của `src/index.ts`), §3.1, §6.2, §7 "Gói phát hành", "`src/index.test.ts` (G)", §8 `size-limit`, §10 dòng `unreleased`. Không có mockup. Bắt đầu từ commit của Task 3.
- **`src/index.ts`** export `DataGrid`, `dataGridColumn` và 39 kiểu của `index.ts` của grid theo thứ tự chữ cái; `src/index.test.ts` đọc nguồn của hai entry và so từng tên (phát hiện 10).
- **Storybook:** `tags: ['unreleased']` bỏ khỏi năm file story, khối `tags` của `.storybook/main.ts` bỏ; id story không đổi, không ảnh nào dời. Sidebar đo được (OQ 18): giữ tiêu đề.
- **Build:** `tsdown.config.ts` chỉ còn entry `src/index.ts`; `dist/components/data-grid/DataGrid.js` vẫn có (đường dẫn của mục "JS (DataGrid)").
- **`rsc`:** ca "DataGrid is a client component: a Server Component that renders it hands it to the client" trong `scripts/rsc-probe.mjs`.
- **Docs:** phần mở đầu của `DataGrid.mdx` viết như của một component đã phát hành, liên kết tới "Examples/Data grid" (Task 5 làm nó trỏ đúng chỗ); năm mẫu code import từ `'h2d-glass-ui'`.
- **Ngưỡng kích thước** ghi lần đầu (OQ 13): "JS (all exports)" nay mang cả grid (phát hiện 17). Spec §2, §8, §10 được sửa (phát hiện 21).

**Files:**
- Modify: `src/index.ts`, `src/index.test.ts`; `tsdown.config.ts`; `.storybook/main.ts`; `scripts/rsc-probe.mjs`; `src/components/data-grid/DataGrid.mdx`, `DataGrid.stories.tsx`, `DataGridColumns.stories.tsx`, `DataGridEditing.stories.tsx`, `DataGridFiltering.stories.tsx`, `DataGridGrouping.stories.tsx`; `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`; `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- API công khai của gói từ task này (`import { … } from 'h2d-glass-ui'`):
  - Giá trị: `DataGrid`, `dataGridColumn`.
  - Kiểu: `DataGridCellContext`, `DataGridChange`, `DataGridColumn`, `DataGridColumnFilter`, `DataGridColumnInfo`, `DataGridColumnLayout`, `DataGridCsvOptions`, `DataGridDataType`, `DataGridDensity`, `DataGridEditMode`, `DataGridEditing`, `DataGridEditorContext`, `DataGridExpandedGroups`, `DataGridFieldColumn`, `DataGridFilter`, `DataGridFilterOperator`, `DataGridGroupItem`, `DataGridHandle`, `DataGridKey`, `DataGridLabels`, `DataGridLabelsInput`, `DataGridLookup`, `DataGridPage`, `DataGridPin`, `DataGridPopup`, `DataGridProps`, `DataGridRowDrop`, `DataGridSaveError`, `DataGridSelectAllMode`, `DataGridSelectionMode`, `DataGridSortDirection`, `DataGridSortItem`, `DataGridSortMode`, `DataGridState`, `DataGridSummary`, `DataGridSummaryItem`, `DataGridToolbarItems`, `DataGridValidationRule`, `DataGridValueColumn` (39). `DataGridColumnBase` không được export (OQ 6 (a)).
  - Cùng các bản ghi và khoá nhãn, thành viên của handle, `csvExport`, `exportable`, lớp CSS và ba token của grid đã có.
- Build: một entry `src/index.ts`; `dist/index.js` export `DataGrid` là tham chiếu client tới `dist/components/data-grid/DataGrid.js`.
- Storybook: không story hay trang nào mang `unreleased`; tiêu đề `Components/DataGrid`, `…/Columns`, `…/Editing`, `…/Filtering`, `…/Grouping` giữ nguyên.
- `.size-limit.json`: ngưỡng mới của ba mục.
- Task sau dùng: Task 5 (ví dụ import từ `'../../index'`), Task 6 (mẫu của Getting started import từ `'h2d-glass-ui'`), Task 7 (fixture import từ gốc tarball), Task 8 (changeset, README, ghi ngưỡng lần cuối).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/data-grid/DataGrid.stories.tsx b/src/components/data-grid/DataGrid.stories.tsx
index f057053..1a142d5 100644
--- a/src/components/data-grid/DataGrid.stories.tsx
+++ b/src/components/data-grid/DataGrid.stories.tsx
@@ -87,9 +87,6 @@ const COLUMNS: DataGridColumn<Order>[] = [
 const meta = {
   title: 'Components/DataGrid',
   component: DataGrid,
-  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
-  // the built docs, still run by the story tests and shot by the visual harness.
-  tags: ['unreleased'],
   // The props every story needs; a story gives its own where it differs.
   args: { data: ORDERS, rowKey: 'id', columns: COLUMNS, 'aria-label': 'Orders' },
   parameters: {
diff --git a/src/components/data-grid/DataGridColumns.stories.tsx b/src/components/data-grid/DataGridColumns.stories.tsx
index 65eb13e..1d99f3b 100644
--- a/src/components/data-grid/DataGridColumns.stories.tsx
+++ b/src/components/data-grid/DataGridColumns.stories.tsx
@@ -20,9 +20,6 @@ import type { DataGridColumn, DataGridColumnLayout, DataGridHandle, DataGridProp
 const meta = {
   title: 'Components/DataGrid/Columns',
   component: DataGrid,
-  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
-  // the built docs, still run by the story tests and shot by the visual harness.
-  tags: ['unreleased'],
   args: { data: SALES, rowKey: 'id', columns: SALE_COLUMNS, 'aria-label': 'Orders' },
   parameters: {
     a11y: {
diff --git a/src/components/data-grid/DataGridEditing.stories.tsx b/src/components/data-grid/DataGridEditing.stories.tsx
index 771f047..8fcaf97 100644
--- a/src/components/data-grid/DataGridEditing.stories.tsx
+++ b/src/components/data-grid/DataGridEditing.stories.tsx
@@ -124,9 +124,6 @@ const EDIT_COLUMNS: DataGridColumn<EditOrder>[] = [
 const meta = {
   title: 'Components/DataGrid/Editing',
   component: DataGrid,
-  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of the built
-  // docs, still run by the story tests and shot by the visual harness.
-  tags: ['unreleased'],
   args: {
     data: EDIT_ORDERS,
     rowKey: 'id',
diff --git a/src/components/data-grid/DataGridFiltering.stories.tsx b/src/components/data-grid/DataGridFiltering.stories.tsx
index 1a27df6..60248b2 100644
--- a/src/components/data-grid/DataGridFiltering.stories.tsx
+++ b/src/components/data-grid/DataGridFiltering.stories.tsx
@@ -22,9 +22,6 @@ import type { DataGridCellContext, DataGridColumn, DataGridFilter, DataGridProps
 const meta = {
   title: 'Components/DataGrid/Filtering',
   component: DataGrid,
-  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
-  // the built docs, still run by the story tests and shot by the visual harness.
-  tags: ['unreleased'],
   args: { data: SALES, rowKey: 'id', columns: SALE_COLUMNS, 'aria-label': 'Orders' },
   parameters: {
     a11y: {
diff --git a/src/components/data-grid/DataGridGrouping.stories.tsx b/src/components/data-grid/DataGridGrouping.stories.tsx
index d808d98..edce797 100644
--- a/src/components/data-grid/DataGridGrouping.stories.tsx
+++ b/src/components/data-grid/DataGridGrouping.stories.tsx
@@ -169,9 +169,6 @@ const R1_COLUMNS: DataGridColumn<R1Order>[] = [
 const meta = {
   title: 'Components/DataGrid/Grouping',
   component: DataGrid,
-  // Built but not released until the grid is exported (spec phase 6 §2): hidden from the sidebar of
-  // the built docs, still run by the story tests and shot by the visual harness.
-  tags: ['unreleased'],
   args: { data: R1_ORDERS, rowKey: 'id', columns: R1_COLUMNS, 'aria-label': 'Orders' },
   parameters: {
     a11y: {
diff --git a/src/index.test.ts b/src/index.test.ts
index f0c8813..9774daf 100644
--- a/src/index.test.ts
+++ b/src/index.test.ts
@@ -41,6 +41,7 @@ describe('public API', () => {
       'ContextMenu',
       'ContextMenuContent',
       'ContextMenuTrigger',
+      'DataGrid',
       'DatePicker',
       'Dialog',
       'DialogClose',
@@ -131,15 +132,32 @@ describe('public API', () => {
       'TooltipContent',
       'TooltipTrigger',
       'UserMenu',
+      'dataGridColumn',
       'toast',
     ]);
   });
 
-  // The export list above sees only what exists at run time. The DataGrid is built but not released
-  // (spec phase 6 §2): its types would not show there, so the source of the entry is read.
-  it('does not name the DataGrid, in values or in types, until it is released', () => {
-    const source = readFileSync('src/index.ts', 'utf8');
-    expect(source).not.toMatch(/data-grid/i);
-    expect(source).not.toMatch(/DataGrid/);
+  // The export list above sees only what exists at run time, and a type does not exist there: the
+  // sources are read. Every name the grid's own entry exports is exported by the package entry, in
+  // values and in types alike, so a name added to the grid cannot be left out of the package.
+  it('exports every name the DataGrid folder exports, values and types alike', () => {
+    const names = (file: string) => {
+      const found = new Map<string, 'value' | 'type'>();
+      const source = readFileSync(file, 'utf8');
+      for (const [, type, list = ''] of source.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
+        for (const item of list.split(',')) {
+          const name = item
+            .trim()
+            .split(/\s+as\s+/)
+            .pop();
+          if (name) found.set(name, type ? 'type' : 'value');
+        }
+      }
+      return found;
+    };
+    const grid = names('src/components/data-grid/index.ts');
+    const root = names('src/index.ts');
+    expect(grid.size).toBeGreaterThan(40);
+    for (const [name, kind] of grid) expect(root.get(name), `${name} is exported`).toBe(kind);
   });
 });
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project unit --maxWorkers=3 src/index.test.ts
```

Expected: FAIL: `AssertionError: expected [ 'Accordion', …(126) ] to deeply equal [ …(128) ]` (danh sách khoá chưa có `DataGrid`, `dataGridColumn`) và `DataGrid is exported: expected undefined to be 'value'`. (`unit-react18` chỉ gồm `*.test.tsx`, nên không chạy file này.)

Ca mới của `scripts/rsc-probe.mjs` nằm trong khối code của Step 3. Chứng minh nó fail trước khi export: lưu khối patch của Step 3 vào `../task.patch`, áp riêng phần đó, build và chạy probe, rồi trả file về:

```bash
git apply --include='scripts/rsc-probe.mjs' ../task.patch
pnpm build
pnpm check:rsc
git checkout -- scripts/rsc-probe.mjs
```

Expected: `check:rsc` FAIL ở ca "DataGrid is a client component …" (`Unsupported element type: undefined`: `dist/index.js` chưa export `DataGrid`); các ca cũ pass. Theo báo cáo của bản nháp: đúng như trên.

- [ ] **Step 3: Viết code**

````diff
diff --git a/.storybook/main.ts b/.storybook/main.ts
index 94c1ff1..33c72d0 100644
--- a/.storybook/main.ts
+++ b/.storybook/main.ts
@@ -15,10 +15,6 @@ const config: StorybookConfig = {
     '@storybook/addon-vitest',
   ],
   typescript: { reactDocgen: 'react-docgen-typescript' },
-  // Stories and pages tagged `unreleased` (the DataGrid until Plan G exports it) stay out of the sidebar of
-  // the built site. They are still in index.json, which the visual harness reads, and still run in
-  // the story tests.
-  tags: { unreleased: { excludeFromSidebar: true } },
 };
 
 export default config;
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index 0add33e..36812fb 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -66,7 +66,7 @@ Các ràng buộc của giai đoạn 1–5 giữ nguyên, spec này không nhắ
 | **G** | Xuất CSV; công thức lưu trạng thái; export `DataGrid` từ `src/index.ts`; trang docs "Examples/Data grid"; mục "Data grid" của Getting started; dòng của trang Accessibility; fixtures; changeset `minor` → `0.5.0` | F |
 
 - **Các plan chạy lần lượt** A → G, như các giai đoạn trước; mỗi plan một PR theo đúng quy trình giai đoạn 5 (bản nháp trong draft worktree, Opus viết plan, chủ dự án xem plan, thực thi bằng cherry-pick, review từng task, review cả nhánh, sửa, PR, chủ dự án review, merge). B đi sau A vì DataGrid dùng phần của A (`use-pointer-drag` từ C, `GripIcon` ở E, `Kbd` trong bảng phím của docs từ B). C cần B (khung, header, bàn phím). D cần C (phễu đứng cạnh nút ⋮; story G1 đủ mặt chỉ có từ D). E cần D (menu cột có "Nhóm theo cột này" và kéo tiêu đề của C; tổng tính sau lọc). F cần E (cột thao tác, form dòng chung chỗ với dòng chi tiết). G cần tất cả.
-- **`DataGrid` chỉ được export ở plan G** (bản quyết định). Từ B tới F, code nằm trên `main` nhưng không có trong `src/index.ts`; story và test import thẳng từ `src/components/data-grid/`. Story và trang MDX của nó mang tag `unreleased`, được cấu hình ẩn khỏi sidebar của trang docs đã build (builder chọn cách cấu hình tag của Storybook 10); chúng vẫn chạy trong `test:stories` và visual. Plan G bỏ tag. Nhờ vậy một bản vá `0.4.x` giữa giai đoạn không mang theo DataGrid làm dở, và trang docs công khai (deploy mỗi lần push lên `main`) không quảng cáo nó.
+- **`DataGrid` chỉ được export ở plan G** (bản quyết định). Từ B tới F, code nằm trên `main` nhưng không có trong `src/index.ts`; story và test import thẳng từ `src/components/data-grid/`. Story và trang MDX của nó mang tag `unreleased`, được cấu hình ẩn khỏi sidebar của trang docs đã build (builder chọn cách cấu hình tag của Storybook 10); chúng vẫn chạy trong `test:stories` và visual. Plan G bỏ tag (đã làm ở Plan G, Task 4: `DataGrid`, `dataGridColumn` và 39 kiểu được export từ `src/index.ts`, năm file story bỏ `tags: ['unreleased']`, và khối `tags` của `.storybook/main.ts` bị xoá; id của story không đổi) (phát hiện khi lập Plan G). Nhờ vậy một bản vá `0.4.x` giữa giai đoạn không mang theo DataGrid làm dở, và trang docs công khai (deploy mỗi lần push lên `main`) không quảng cáo nó.
 - **Mỗi plan tự mang đủ phần của mình,** như giai đoạn 2–5:
   - Stories: mỗi phương án giao diện một story vẽ lại đúng các trạng thái của mockup, phần nào làm ở plan nào thì story ở plan đó (§7); cộng các story hành vi gắn `no-visual`.
   - Test các lớp ở §7 (với DataGrid: test của engine tách riêng, kèm test hiệu năng), ảnh chuẩn visual (workflow `visual-update.yml`).
@@ -76,7 +76,7 @@ Các ràng buộc của giai đoạn 1–5 giữ nguyên, spec này không nhắ
   - Ghi lại ngưỡng `size-limit` (`pnpm size:record`); từ B có thêm mục riêng "JS (DataGrid)" (§8).
 - **Thay đổi ở code cũ** (không đổi hành vi, ảnh chuẩn cũ giữ nguyên), chi tiết ở §5:
   - Plan A: `Menu.tsx` (`MenuShortcut keys`), `SearchField.tsx` (chữ gợi ý qua bộ định dạng chung; hàm nội bộ `Kbd` của nó đổi tên thành `KeyHint`), `Dialog.tsx` và `modal.tsx` (`movable`, ngữ cảnh cho `DialogHeader`), `dialog.css`, `tests/visual/stories.visual.ts` (`data-visual-drag`).
-  - Plan B: `intl.ts` thêm `collator(locale, options?)`, một bộ so sánh dựng một lần cho mỗi cặp locale và tuỳ chọn như `numberFormat`, qua cùng `usableLocale` (phát hiện khi lập Plan B); DataGrid import `table/use-head-height.ts` và lớp CSS của Table, không sửa chúng. Cũng ở Plan B (phát hiện khi lập Plan B): `tsdown.config.ts` thêm entry `src/components/data-grid/index.ts` (cùng `engine/virtual.ts` tới khi cuộn ảo import nó; task cuộn ảo đã bỏ dòng thứ hai vì `use-virtual-rows.ts` import nó) cho tới plan G, vì không gì từ `src/index.ts` tới được grid, và `check:use-client` cần file `dist` của mọi nguồn thư viện (gói mang các file này, `exports` chỉ lộ `.`); `scripts/check-use-client.ts` bỏ qua module chỉ có kiểu (không có `.js`, có `.d.ts`); `.storybook/main.ts` đặt `tags: { unreleased: { excludeFromSidebar: true } }` (đã thử trên Storybook 10.6: story và trang docs có tag vẫn nằm trong `storybook-static/index.json` và vẫn chạy, chỉ sidebar bỏ chúng); `src/index.test.ts` thêm test rằng nguồn của `src/index.ts` không nhắc `data-grid`; `src/styles/theme/values.ts` và `Theming.mdx` thêm `--flg-data-grid-pin-bg`. Cũng ở Plan B (phát hiện khi lập Plan B, task bàn phím): `internal/controls.ts` xuất `POPUP_SELECTOR` (`[popover], dialog`, hai phần tử cuối của danh sách `CONTROLS`, không đổi danh sách) và `internal/focus.ts` thêm `getTabbableKinds(root)` cùng tham số `released` cho `isFocusable` và `getFocusables` (phần tử mà container đã đặt `tabindex="-1"`, vẫn được tính là Tab được); tập phần tử đó nay nằm trong chính `focus.ts`, một `WeakSet` cấp module với `releaseControl(el)`, `giveBackControl(el)`, `isReleased(el)`, không truyền qua tham số nữa, và `isFocusable`/`getFocusables` nhận tuỳ chọn `{ released: true }` để tính chúng; tập là chung cho mọi grid, nên chế độ widget của một grid chỉ giữ control mà chính nó đã nhả (lọc theo `closest('table[role="grid"]')`), còn control mà grid trong ô đã nhả thuộc grid đó, và điểm Tab của grid đó đứng thay chúng (vòng sửa thứ hai); không có tuỳ chọn thì vẫn là thứ tự Tab như hiện có, nên `focusFirst` và các nơi khác không đổi; không là thuộc tính DOM, vì sẽ ghi thêm vào phần tử của người dùng và kích observer thuộc tính của `use-release-controls.ts` (phát hiện khi review PR #42); `scripts/lib/contrast.ts` và `contrast-exceptions.ts` thêm check `grid-cell-focus` và dòng 38. Cũng ở Plan B (phát hiện khi lập Plan B): `table/table-parts.tsx` xuất `SortIcon` (chỉ cho grid dùng chung; không xuất khỏi gói, đầu ra của `Table` không đổi).
+  - Plan B: `intl.ts` thêm `collator(locale, options?)`, một bộ so sánh dựng một lần cho mỗi cặp locale và tuỳ chọn như `numberFormat`, qua cùng `usableLocale` (phát hiện khi lập Plan B); DataGrid import `table/use-head-height.ts` và lớp CSS của Table, không sửa chúng. Cũng ở Plan B (phát hiện khi lập Plan B): `tsdown.config.ts` thêm entry `src/components/data-grid/index.ts` (cùng `engine/virtual.ts` tới khi cuộn ảo import nó; task cuộn ảo đã bỏ dòng thứ hai vì `use-virtual-rows.ts` import nó) cho tới plan G (đã bỏ ở Plan G, Task 4: `tsdown.config.ts` chỉ còn entry `src/index.ts`, vì `src/index.ts` nay export grid và `dist/components/data-grid/DataGrid.js` vẫn được build, không gộp) (phát hiện khi lập Plan G), vì không gì từ `src/index.ts` tới được grid, và `check:use-client` cần file `dist` của mọi nguồn thư viện (gói mang các file này, `exports` chỉ lộ `.`); `scripts/check-use-client.ts` bỏ qua module chỉ có kiểu (không có `.js`, có `.d.ts`); `.storybook/main.ts` đặt `tags: { unreleased: { excludeFromSidebar: true } }` (đã thử trên Storybook 10.6: story và trang docs có tag vẫn nằm trong `storybook-static/index.json` và vẫn chạy, chỉ sidebar bỏ chúng); `src/index.test.ts` thêm test rằng nguồn của `src/index.ts` không nhắc `data-grid`; `src/styles/theme/values.ts` và `Theming.mdx` thêm `--flg-data-grid-pin-bg`. Cũng ở Plan B (phát hiện khi lập Plan B, task bàn phím): `internal/controls.ts` xuất `POPUP_SELECTOR` (`[popover], dialog`, hai phần tử cuối của danh sách `CONTROLS`, không đổi danh sách) và `internal/focus.ts` thêm `getTabbableKinds(root)` cùng tham số `released` cho `isFocusable` và `getFocusables` (phần tử mà container đã đặt `tabindex="-1"`, vẫn được tính là Tab được); tập phần tử đó nay nằm trong chính `focus.ts`, một `WeakSet` cấp module với `releaseControl(el)`, `giveBackControl(el)`, `isReleased(el)`, không truyền qua tham số nữa, và `isFocusable`/`getFocusables` nhận tuỳ chọn `{ released: true }` để tính chúng; tập là chung cho mọi grid, nên chế độ widget của một grid chỉ giữ control mà chính nó đã nhả (lọc theo `closest('table[role="grid"]')`), còn control mà grid trong ô đã nhả thuộc grid đó, và điểm Tab của grid đó đứng thay chúng (vòng sửa thứ hai); không có tuỳ chọn thì vẫn là thứ tự Tab như hiện có, nên `focusFirst` và các nơi khác không đổi; không là thuộc tính DOM, vì sẽ ghi thêm vào phần tử của người dùng và kích observer thuộc tính của `use-release-controls.ts` (phát hiện khi review PR #42); `scripts/lib/contrast.ts` và `contrast-exceptions.ts` thêm check `grid-cell-focus` và dòng 38. Cũng ở Plan B (phát hiện khi lập Plan B): `table/table-parts.tsx` xuất `SortIcon` (chỉ cho grid dùng chung; không xuất khỏi gói, đầu ra của `Table` không đổi).
   - Plan C: `icons.tsx` (`ArrowIcon` hướng `right` và icon mới; không có `DownloadIcon`: nút xuất là của Plan G, Claude chốt OQ 9); `context-menu/ContextMenu.tsx` (phép thử phím menu, ContextMenu và `Shift+F10`, chuyển sang `src/internal/menu-key.ts` với tên `isMenuKey` để lưới dùng chung; không đổi hành vi; Claude chốt OQ 10, phát hiện khi lập Plan C); `src/internal/auto-scroll.ts` (file mới, §5); `src/styles/theme/values.ts` và `src/docs/Theming.mdx` (hai token `--flg-data-grid-pin-shadow` và `--flg-column-resize-line`), `src/styles/preferences.css` (forced colors, contrast more, giảm chuyển động của phần cột), `scripts/check-dist-css.ts` (lớp CSS mới), `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `src/docs/ExceptionTable.test.tsx`, `src/docs/Accessibility.mdx` và §4.9 của spec 0+1 (dòng 39, `grid-head-icon`, `grid-resize-line`); `.storybook/data-grid-orders.tsx` (dữ liệu và hàm `lookPlay` dùng chung giữa hai file story của grid). Mọi thứ trên không đổi hành vi của component cũ và không đổi ảnh chuẩn cũ (phát hiện khi lập Plan C).
   - Plan D: `combobox/Combobox.tsx` (chỉ đổi đường import: phép gập và khoảng khớp chuyển từ `combobox/match.ts` sang `src/internal/text-fold.ts`, không đổi hành vi; các test của `match.ts` chuyển cùng; Claude chốt OQ 1, phát hiện khi lập Plan D); `date-picker/DatePicker.tsx` (prop `startContent`, vẽ đúng như của `Input`; không truyền thì DOM và ảnh chuẩn y như cũ; Claude chốt OQ 2, phát hiện khi lập Plan D) cùng `DatePicker.mdx`, `DatePicker.test.tsx`. Mọi file Plan D đổi ngoài `data-grid/` (phát hiện khi lập Plan D, task cuối): `src/internal/text-fold.ts` và `text-fold.test.ts` (file mới, nhận phần của `combobox/match.ts`; `combobox/match.ts` và `match.test.ts` bị xoá, `Combobox.tsx` đổi đường import); `src/internal/icons.tsx` và `icons.test.tsx` (`FunnelIcon`, `FunnelXIcon`, `OperatorIcon`); `date-picker/DatePicker.tsx`, `DatePicker.mdx`, `DatePicker.test.tsx` (`startContent`); `src/styles/components/data-grid.css` và `src/styles/preferences.css` (phần lọc: ô lọc, phễu, thanh bộ lọc, trống do lọc, tô sáng; forced colours, contrast more); `scripts/check-dist-css.ts` (lớp CSS mới), `scripts/lib/contrast.ts` và `contrast.test.ts` (`grid-filter-operator` và phễu trong `grid-head-icon`), `scripts/contrast-exceptions.ts` (nhãn các dòng 1, 2, 6, 20, 22), `src/docs/Accessibility.mdx` và §4.9 của spec 0+1 (cùng nhãn; không có dòng mới nên `ExceptionTable.test.tsx` không đổi); `.storybook/data-grid-orders.tsx` (`lookPlay` Tab tới khi bảng có focus, tối đa bốn lần, báo lỗi có lời khi không tới). Không token mới, không file nào của component cũ đổi hành vi hay ảnh chuẩn.
   - Plan E (phát hiện khi lập Plan E, task cuối): mọi file Plan E đổi ngoài `data-grid/`: `src/internal/icons.tsx` và `icons.test.tsx` (`GroupIcon`; `GripIcon` của A dùng lại cho tay nắm); `src/styles/components/data-grid.css` và `src/styles/preferences.css` (nhóm, tổng, chi tiết, thanh nhóm, kéo dòng; forced colours, contrast more); `scripts/check-dist-css.ts` (lớp CSS mới); `scripts/lib/contrast.ts` và `contrast.test.ts` (`grid-group-text`, `grid-group-text-muted`, `grid-chip-text`, `grid-chip-icon`); `scripts/contrast-exceptions.ts` (nhãn các dòng 2, 14, 22 và dòng 40 mới), `src/docs/ExceptionTable.test.tsx` (đếm 40), `src/docs/Accessibility.mdx` và §4.9 của spec 0+1 (cùng nhãn và dòng 40). Không token mới, không file nào của component cũ đổi hành vi hay ảnh chuẩn.
@@ -1234,7 +1234,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 - **Getting started**, mục mới **"Data grid"** (G): client component bọc grid, mảng cột, `rowKey`, dữ liệu từ Server Component, `locale` cho HTML từ server và client giống nhau (và cùng bản ICU, §10), chế độ server tóm tắt.
 - **Accessibility:** bảng §4.9 tự dựng từ `scripts/contrast-exceptions.ts`, nên có các dòng 37–43 và nhãn mới của các dòng được mở rộng (§4.4); plan nào thêm dòng thì sửa cả bảng §4.9 và đoạn sau nó trong spec 0+1. Ghi chú: mẫu grid và treegrid, một điểm Tab, chế độ widget, vùng live, Kbd đọc tên ký hiệu, Dialog kéo được không có phím và vì sao.
 - **Theming:** ba token mới; `--flg-data-grid-pin-bg` theo `--flg-glass-tint-solid`.
-- **`size-limit`:** từ plan B thêm mục "JS (DataGrid)": `dist/components/data-grid/DataGrid.js`, `import: "{ DataGrid }"` (đo được khi chưa export từ `src/index.ts`, nhờ entry thứ hai của tsdown, §2; phát hiện khi lập Plan B); mục "JS (all exports)" và "CSS (styles.css)" ghi lại ở mỗi plan. Plan C ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 30,51 kB lên 44,75 kB (ngưỡng 49222 B, hơn dự kiến ở §2 vì menu cột, `Popover`, `Tooltip`, `Checkbox` và popover chọn cột vào cùng entry với grid), "CSS (styles.css)" từ 17,28 kB lên 18,30 kB (ngưỡng 20126 B), "JS (all exports)" gần như không đổi (57,90 kB; ngưỡng 63686 B) (phát hiện khi lập Plan C). Plan D ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 45,23 kB lên 60,02 kB (+14,79 kB; ngưỡng 66027 B; hơn dự kiến 35–45 kB của §10 vì `Input`, `Select`, `DatePicker` với `Calendar`, `SearchField`, `Switch`, `Field`, các mục radio của menu, phép gập chữ và engine lọc vào cùng entry với grid), "CSS (styles.css)" từ 18,32 kB lên 18,90 kB (+0,58 kB; ngưỡng 20786 B), "JS (all exports)" 57,93 kB (+30 B; ngưỡng 63728 B) (phát hiện khi lập Plan D). Plan E ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 61,34 kB trên `main` lên 73,94 kB (+12,60 kB; 60,02 kB là số cuối của Plan D lúc lập bản nháp, và 1,32 kB giữa hai số là của PR #44, nên +13,92 kB so với 60,02 kB không phải mức tăng của Plan E; ngưỡng 81337 B; hơn dự kiến 8–12 kB của kế hoạch: engine nhóm và tổng, hàng nhóm, thanh nhóm và hai kiểu kéo, tổng, chi tiết, kéo dòng và menu dòng vào cùng entry với grid; tăng theo task: Task 1 +0,42 (ranh giới của các hook), 2 +1,83, 3 +2,36, 4 +0,41, 5 +2,11, 6 +1,96, 7 +1,04, 8 +2,47 kB), "CSS (styles.css)" từ 18,90 kB lên 19,97 kB (ngưỡng 21964 B), "JS (all exports)" 57,90 kB (ngưỡng 63693 B) (phát hiện khi lập Plan E; các số +12,60 kB và +0,42 kB sửa ở review cuối Plan E). Plan F ghi lại ngưỡng sau khi xong (phát hiện khi lập Plan F, task cuối): "JS (DataGrid)" từ 74,52 kB trên `main` lên 94,26 kB (+19,74 kB; ngưỡng 103689 B; hơn dự kiến vì mọi chế độ sửa, các trình sửa theo kiểu, kiểm tra dữ liệu, thanh lưu, form, popup, hộp xác nhận xoá và alert lỗi vào cùng entry với grid; tăng theo task: Task 1 +0,90 (ranh giới của các hook), 2 +0,71, 3 0 (Dialog nằm ngoài entry của grid), 4 +6,85, 5 +4,55, 6 +1,67, 7 +1,44, 8 +1,90, 9 +1,20, 10 +0,52 kB), "CSS (styles.css)" từ 19,99 kB lên 20,94 kB (ngưỡng 23036 B), "JS (all exports)" từ 57,90 kB lên 57,92 kB (ngưỡng 63715 B; `DialogContent fullScreenOnPhone`). Sau đợt sửa của review cuối Plan F ghi lại lần nữa (sửa ở review cuối Plan F): "JS (DataGrid)" 96,26 kB (+2,00 kB so với 94,26 kB; ngưỡng 105887 B; tăng theo phần: A +0,93, B +0,69, C +0,27, D +0,11 kB: hàng đợi ô, lưu theo lô, các phép bắt lỗi của hàm app, `taken()`, `ModeFocusProbe`, `saving` của ngữ cảnh trình sửa, nhãn `dismissError`), "CSS (styles.css)" 20,96 kB (ngưỡng 23054 B), "JS (all exports)" 58,02 kB (ngưỡng 63820 B).
+- **`size-limit`:** từ plan B thêm mục "JS (DataGrid)": `dist/components/data-grid/DataGrid.js`, `import: "{ DataGrid }"` (đo được khi chưa export từ `src/index.ts`, nhờ entry thứ hai của tsdown, §2; phát hiện khi lập Plan B); mục "JS (all exports)" và "CSS (styles.css)" ghi lại ở mỗi plan. Plan C ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 30,51 kB lên 44,75 kB (ngưỡng 49222 B, hơn dự kiến ở §2 vì menu cột, `Popover`, `Tooltip`, `Checkbox` và popover chọn cột vào cùng entry với grid), "CSS (styles.css)" từ 17,28 kB lên 18,30 kB (ngưỡng 20126 B), "JS (all exports)" gần như không đổi (57,90 kB; ngưỡng 63686 B) (phát hiện khi lập Plan C). Plan D ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 45,23 kB lên 60,02 kB (+14,79 kB; ngưỡng 66027 B; hơn dự kiến 35–45 kB của §10 vì `Input`, `Select`, `DatePicker` với `Calendar`, `SearchField`, `Switch`, `Field`, các mục radio của menu, phép gập chữ và engine lọc vào cùng entry với grid), "CSS (styles.css)" từ 18,32 kB lên 18,90 kB (+0,58 kB; ngưỡng 20786 B), "JS (all exports)" 57,93 kB (+30 B; ngưỡng 63728 B) (phát hiện khi lập Plan D). Plan E ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 61,34 kB trên `main` lên 73,94 kB (+12,60 kB; 60,02 kB là số cuối của Plan D lúc lập bản nháp, và 1,32 kB giữa hai số là của PR #44, nên +13,92 kB so với 60,02 kB không phải mức tăng của Plan E; ngưỡng 81337 B; hơn dự kiến 8–12 kB của kế hoạch: engine nhóm và tổng, hàng nhóm, thanh nhóm và hai kiểu kéo, tổng, chi tiết, kéo dòng và menu dòng vào cùng entry với grid; tăng theo task: Task 1 +0,42 (ranh giới của các hook), 2 +1,83, 3 +2,36, 4 +0,41, 5 +2,11, 6 +1,96, 7 +1,04, 8 +2,47 kB), "CSS (styles.css)" từ 18,90 kB lên 19,97 kB (ngưỡng 21964 B), "JS (all exports)" 57,90 kB (ngưỡng 63693 B) (phát hiện khi lập Plan E; các số +12,60 kB và +0,42 kB sửa ở review cuối Plan E). Plan F ghi lại ngưỡng sau khi xong (phát hiện khi lập Plan F, task cuối): "JS (DataGrid)" từ 74,52 kB trên `main` lên 94,26 kB (+19,74 kB; ngưỡng 103689 B; hơn dự kiến vì mọi chế độ sửa, các trình sửa theo kiểu, kiểm tra dữ liệu, thanh lưu, form, popup, hộp xác nhận xoá và alert lỗi vào cùng entry với grid; tăng theo task: Task 1 +0,90 (ranh giới của các hook), 2 +0,71, 3 0 (Dialog nằm ngoài entry của grid), 4 +6,85, 5 +4,55, 6 +1,67, 7 +1,44, 8 +1,90, 9 +1,20, 10 +0,52 kB), "CSS (styles.css)" từ 19,99 kB lên 20,94 kB (ngưỡng 23036 B), "JS (all exports)" từ 57,90 kB lên 57,92 kB (ngưỡng 63715 B; `DialogContent fullScreenOnPhone`). Sau đợt sửa của review cuối Plan F ghi lại lần nữa (sửa ở review cuối Plan F): "JS (DataGrid)" 96,26 kB (+2,00 kB so với 94,26 kB; ngưỡng 105887 B; tăng theo phần: A +0,93, B +0,69, C +0,27, D +0,11 kB: hàng đợi ô, lưu theo lô, các phép bắt lỗi của hàm app, `taken()`, `ModeFocusProbe`, `saving` của ngữ cảnh trình sửa, nhãn `dismissError`), "CSS (styles.css)" 20,96 kB (ngưỡng 23054 B), "JS (all exports)" 58,02 kB (ngưỡng 63820 B). Plan G, Task 4 ghi lại sau khi export grid từ `src/index.ts` (phát hiện khi lập Plan G): "JS (all exports)" 119,61 kB (ngưỡng 131571 B; mục này đo `import: "*"` không tree-shake, nên nay mang cả grid; app chỉ dùng `Button` không mang grid, việc đó do kiểm tra tree-shaking của Task 7 giữ), "JS (DataGrid)" 98,18 kB (ngưỡng 107996 B), "CSS (styles.css)" 20,97 kB (ngưỡng 23064 B).
 - **Phát hành:**
   - Một changeset `minor` cho `0.5.0` (G): `.changeset/phase-6-data-grid.md`, liệt kê `Kbd`, `MenuShortcut keys`, `DialogContent movable` và `fullScreenOnPhone`, `DataGrid` cùng `dataGridColumn` và các kiểu, ba token mới. Không có thay đổi phá vỡ.
   - **Việc của chủ dự án không đổi** (spec 0+1 §8.3): chủ dự án là người publish.
@@ -1269,7 +1269,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 | Coi việc di chuyển Dialog là trình bày, không phải chức năng (WCAG 2.5.7, 2.1.1) | Lý do ghi ở §3.4 và docs. Nếu một đợt kiểm định không đồng ý: thêm `Alt+mũi tên` trên header ở một bản sau, không đổi API |
 | Tổ hợp phím của grid trùng phím của hệ điều hành hay trình đọc màn hình ở một máy nào đó | Mọi thao tác có đường qua menu (`Alt+↓`, `Shift+F10`); docs liệt kê phím; NVDA và VoiceOver được thử ở lớp 6 |
 | Chip, menu, popover lọc nằm ngoài `<table>` (một cái cho cả grid) | `aria-controls`, `aria-expanded` trên nút mở; focus vào trong khi mở, về nút khi đóng; lớp 1 và 3 kiểm |
-| Story và trang MDX của DataGrid hiện trên docs công khai trước plan G | Tag `unreleased` ẩn khỏi sidebar của bản build (§2). Nếu cấu hình tag của Storybook 10 không ẩn được: đặt chúng dưới tiêu đề `Internal/` và loại khỏi glob `stories` của bản build docs, ghi trong PR của B |
+| Story và trang MDX của DataGrid hiện trên docs công khai trước plan G | Tag `unreleased` ẩn khỏi sidebar của bản build (§2; đã xong ở Plan G, Task 4: tag và cấu hình của nó đã bỏ cùng lúc với việc export, phát hiện khi lập Plan G). Nếu cấu hình tag của Storybook 10 không ẩn được: đặt chúng dưới tiêu đề `Internal/` và loại khỏi glob `stories` của bản build docs, ghi trong PR của B |
 | Kbd trên Apple hiện "Ctrl K" một khung hình trước khi thành "⌘K" | Như SearchField, nền tảng chỉ biết sau khi mount; docs ghi rõ. Kbd trong câu chữ không thể để trống chỗ (§3.3) |
 | Excel mở CSV với dấu ngăn của vùng | BOM UTF-8; `separator: ';'` cho vùng dùng dấu phẩy thập phân; docs có ví dụ |
 | Chế độ server thiếu nhóm và cuộn ảo | Ngoài phạm vi (bản quyết định), `devWarn` khi dùng chung; docs nói rõ và chỉ cách phân trang |
diff --git a/scripts/rsc-probe.mjs b/scripts/rsc-probe.mjs
index d580d0f..64faf4d 100644
--- a/scripts/rsc-probe.mjs
+++ b/scripts/rsc-probe.mjs
@@ -104,6 +104,31 @@ const CASES = [
       if (tree.props.labels?.command !== 'C') throw new Error('labels did not pass through');
     },
   },
+  // The DataGrid is a client component from the package entry. A Server Component hands it its data and
+  // the columns that are plain data (a field column); a column with a function could not cross, so none
+  // is passed. The probe checks that the entry's export is the client reference and that the props
+  // reach it.
+  {
+    label:
+      'DataGrid is a client component: a Server Component that renders it hands it to the client',
+    file: '../dist/index.js',
+    exportName: 'DataGrid',
+    clients: [{ file: '../dist/components/data-grid/DataGrid.js', exportName: 'DataGrid' }],
+    element: (C) =>
+      createElement(C, {
+        data: [{ id: 'a', name: 'Ann' }],
+        rowKey: 'id',
+        columns: [{ field: 'name', caption: 'Name' }],
+        caption: 'People',
+      }),
+    expect: { type: { client: 'DataGrid' } },
+    check: (tree) => {
+      if (tree.props.rowKey !== 'id') throw new Error('rowKey did not pass through');
+      if (tree.props.data.length !== 1) throw new Error('data did not pass through');
+      if (tree.props.columns[0].field !== 'name') throw new Error('columns did not pass through');
+      if (tree.props.caption !== 'People') throw new Error('caption did not pass through');
+    },
+  },
   {
     label: 'Divider',
     file: '../dist/components/divider/Divider.js',
diff --git a/src/components/data-grid/DataGrid.mdx b/src/components/data-grid/DataGrid.mdx
index 237e0f3..4068577 100644
--- a/src/components/data-grid/DataGrid.mdx
+++ b/src/components/data-grid/DataGrid.mdx
@@ -8,23 +8,22 @@ import * as GroupingStories from './DataGridGrouping.stories';
 # DataGrid
 
 Rows of data in typed columns, drawn in the look of a [Table](?path=/docs/components-table--docs).
-The grid is the part of the library that knows about the data. It is built in steps: today it reads
-the columns, formats each value for its type and its locale, draws the rows with a sticky heading,
-sorts them, pages them, chooses rows, groups them with totals, opens a detail under a row, moves rows,
-adds, edits and deletes rows (in the row, in a cell, in a batch, in a form or in a popup), draws a long
-list by windows, filters them (a search field that marks what it finds, a row of filter cells, a funnel
-on each title that lists the values, and a bar that says the conditions), says when it loads and when it
-is empty, and has a keyboard.
-
-**It is not released yet.** The grid is built in steps, and it is not exported from the package
-until the last of them, so this page and its stories are not in the sidebar of the published docs.
-What is here is what the code does today: **the API grows until release**, and a prop, a state key
-or a label that is not on this page is not in the code. The stories import the grid from its own
-folder.
+The grid is the part of the library that knows about the data. It reads the columns, formats each
+value for its type and its locale, draws the rows with a sticky heading, sorts them, pages them,
+chooses rows, groups them with totals, opens a detail under a row, moves rows, adds, edits and
+deletes rows (in the row, in a cell, in a batch, in a form or in a popup), draws a long list by
+windows, filters them (a search field that marks what it finds, a row of filter cells, a funnel on
+each title that lists the values, and a bar that says the conditions), exports them as CSV, says when
+it loads and when it is empty, and has a keyboard.
+
+Use it for a screen of records that people sort, search, filter and change: orders, customers, a
+queue of tickets. For a short list of rows you write yourself, a `Table` is lighter. The grid is one
+component with one set of props, and this page lists all of them. For the grid in a whole screen, see
+[Examples/Data grid](?path=/docs/examples-data-grid--docs).
 
 ```tsx
-import { DataGrid } from './data-grid';
-import type { DataGridColumn } from './data-grid';
+import { DataGrid } from 'h2d-glass-ui';
+import type { DataGridColumn } from 'h2d-glass-ui';
 
 interface Order {
   id: string;
@@ -102,7 +101,7 @@ The type of a computed column is lost when you write it inline in an array of `D
 `dataGridColumn` keeps it:
 
 ```tsx
-import { dataGridColumn } from './data-grid';
+import { dataGridColumn } from 'h2d-glass-ui';
 
 const tax = dataGridColumn<Order>()({
   id: 'tax',
@@ -249,7 +248,7 @@ give it only the data, which is plain, from the page:
 ```tsx
 'use client';
 
-import { DataGrid } from './data-grid';
+import { DataGrid } from 'h2d-glass-ui';
 
 const columns = [/* … */];
 
diff --git a/src/index.ts b/src/index.ts
index b2660f5..2d39d9f 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -305,3 +305,45 @@ export type {
 } from './components/theme-switch';
 export { Kbd } from './components/kbd';
 export type { KbdLabels, KbdProps } from './components/kbd';
+export { DataGrid, dataGridColumn } from './components/data-grid';
+export type {
+  DataGridCellContext,
+  DataGridChange,
+  DataGridColumn,
+  DataGridColumnFilter,
+  DataGridColumnInfo,
+  DataGridColumnLayout,
+  DataGridCsvOptions,
+  DataGridDataType,
+  DataGridDensity,
+  DataGridEditMode,
+  DataGridEditing,
+  DataGridEditorContext,
+  DataGridExpandedGroups,
+  DataGridFieldColumn,
+  DataGridFilter,
+  DataGridFilterOperator,
+  DataGridGroupItem,
+  DataGridHandle,
+  DataGridKey,
+  DataGridLabels,
+  DataGridLabelsInput,
+  DataGridLookup,
+  DataGridPage,
+  DataGridPin,
+  DataGridPopup,
+  DataGridProps,
+  DataGridRowDrop,
+  DataGridSaveError,
+  DataGridSelectAllMode,
+  DataGridSelectionMode,
+  DataGridSortDirection,
+  DataGridSortItem,
+  DataGridSortMode,
+  DataGridState,
+  DataGridSummary,
+  DataGridSummaryItem,
+  DataGridToolbarItems,
+  DataGridValidationRule,
+  DataGridValueColumn,
+} from './components/data-grid';
diff --git a/tsdown.config.ts b/tsdown.config.ts
index 9fc67b1..fe295c9 100644
--- a/tsdown.config.ts
+++ b/tsdown.config.ts
@@ -1,11 +1,7 @@
 import { defineConfig } from 'tsdown';
 
 export default defineConfig({
-  // The DataGrid is not exported from src/index.ts until it is released, so nothing reaches it from the
-  // first entry. The second makes the build emit it, and `check:use-client` and the size limit read the
-  // result; the package carries those files, which `exports` does not expose. Plan G exports the grid
-  // from src/index.ts and removes the second entry.
-  entry: ['src/index.ts', 'src/components/data-grid/index.ts'],
+  entry: ['src/index.ts'],
   format: 'esm',
   platform: 'neutral',
   unbundle: true,
````

Build, rồi ghi ngưỡng kích thước. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó. Với ngưỡng cũ, bước `size` của `pnpm check:package` fail (phát hiện 17):

```bash
pnpm gen:theme
pnpm build
pnpm check:package
pnpm size:record
pnpm check:package
```

Expected:
- Lần `check:package` đầu FAIL **chỉ** ở bước `size`, mục "JS (all exports)" ("exceeded by 55.79 kB": 119.61 kB trên ngưỡng 63820 B); `check:dist-css`, `check:use-client`, `check:rsc` (cả ca mới), `check:publint`, `check:types` pass trước nó.
- `size:record` ghi ngưỡng mới; ngưỡng là số đo cộng 10%. Ở bản nháp: JS (all exports) 131571 B, JS (DataGrid) 107996 B, CSS 23064 B (trước: 63820 B, 105887 B, 23054 B; hai mục sau dời vì lần ghi đo lại các số của Task 1–3, không phải vì task này), như dòng §8 của spec trong patch. `.size-limit.json` là file duy nhất lệnh đó đổi. Giữ số do `size:record` ghi; nếu nó khác số trên, nêu trong báo cáo.
- Lần `check:package` sau: PASS với ngưỡng mới.

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check && npx tsc --noEmit -p . && pnpm check:name
pnpm vitest run --project unit --maxWorkers=3 src/index.test.ts
pnpm vitest run --project scripts --maxWorkers=3
for b in chromium firefox webkit; do
  pnpm vitest run --project storybook-light --browser=$b src/components/data-grid
  pnpm vitest run --project storybook-dark --browser=$b src/components/data-grid
done
pnpm build-storybook && pnpm check:docs-tables
node -e "const e=Object.values(require('./storybook-static/index.json').entries);console.log(e.filter((x)=>x.id.startsWith('components-datagrid')).length,e.filter((x)=>(x.tags||[]).includes('unreleased')).length)"
ls dist/components/data-grid/DataGrid.js
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
sed -e 's/5173/5179/g' -e 's/4173/4179/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
```

Nếu 4179 hay 5179 bận, chọn một cặp khác đang rảnh (không bao giờ 5173, 4173, 5174 hay 4174) và sửa lệnh `sed` theo cặp đó. Nếu 3100 hay 3101 bận (script ghim hai cổng đó cho Next.js), dừng lại và báo cáo; không tắt tiến trình đang giữ chúng. Chạy `rm` kể cả khi lệnh `node` fail.

Expected:
- `lint`, `typecheck`, `format:check`, `tsc -p .`, `check:name`: PASS.
- `src/index.test.ts`: 2 / 2 PASS; `scripts`: 7 file, 261 PASS.
- Story data-grid: 140 PASS ở mỗi lượt (sáu lượt): chỉ thẻ và chú thích của nó đổi.
- `pnpm check:docs-tables`: `no table built as text in 225 files`. Lệnh `node` in `145 0`: 145 mục DataGrid (trước task này cũng 145, cùng danh sách id), không mục nào mang `unreleased` (trước: 145).
- `ls` in đường dẫn: file của mục "JS (DataGrid)" vẫn được build.
- Fixture: `Fixtures OK: vite, next.` (bản production và development của cả hai app; fixture chưa có trang grid). Hai lệnh `netstat` không in dòng nào: cổng rảnh trước khi chạy, và không server nào chạy sót.
- Sidebar (Claude, bản tĩnh; OQ 18): "DataGrid" là một nhóm chứa Docs, các story của nó và Columns, Editing, Filtering, Grouping; trang docs nạp được, console không cảnh báo: giữ tiêu đề. Trang docs DataGrid cuộn ngang ở 1280px (bảng Props): có sẵn ở mọi trang có bảng Props rộng, mô tả PR nêu (phát hiện 10, 23).
- `pnpm build`, `pnpm check:package`: đã chạy ở Step 3.

- [ ] **Step 5: Commit**

```bash
git add \
  .size-limit.json \
  .storybook/main.ts \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  scripts/rsc-probe.mjs \
  src/components/data-grid/DataGrid.mdx \
  src/components/data-grid/DataGrid.stories.tsx \
  src/components/data-grid/DataGridColumns.stories.tsx \
  src/components/data-grid/DataGridEditing.stories.tsx \
  src/components/data-grid/DataGridFiltering.stories.tsx \
  src/components/data-grid/DataGridGrouping.stories.tsx \
  src/index.test.ts \
  src/index.ts \
  tsdown.config.ts
```
```bash
git commit -m "feat: export DataGrid from the package root and drop the unreleased tag" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 5: trang "Examples/Data grid": đơn hàng của Lumen trong một DataGrid

Spec §8 (trang Examples), §3.9, §3.11 (`src/docs/data-grid-example/`). Trang không có mockup: nó theo lựa chọn của chủ dự án trên trang quyết định, (b) cho màn hình rộng và (p2) cho điện thoại (OQ 1), dựng từ các phần đã duyệt của G1, F1, R1, E2. Bắt đầu từ commit của Task 4.
- **Ví dụ** (`src/docs/data-grid-example/`): 40 đơn của Lumen, tám cột, mọi tính năng của grid bật, SegmentedControl "Edit mode" đổi năm chế độ sửa, `onSaving` áp thay đổi vào state, công thức lưu trạng thái với khoá theo lớp bố cục, `csvExport={{ fileName: 'lumen-orders.csv' }}` (phát hiện 11).
- **Bố cục theo lớp:** media query `(max-width: 639px)` qua `useSyncExternalStore` (ảnh chụp của server: rộng); grid mang key là lớp bố cục; rộng: Order ghim trái, Channel ẩn, sắp theo ngày giảm dần; điện thoại: Order, Customer, Status, Total, không ghim, sắp theo Order giảm dần.
- **Trang và story:** `DataGridExample.mdx` (hai khung, một đoạn cho mỗi tính năng, ba khối `Source` hiện `'h2d-glass-ui'`); hai story giao diện (16 ảnh mới) và bốn story hành vi `no-visual`.
- **Các fixup gộp vào task này** (phát hiện 4): G1F1 và fixup thứ tư của Claude (thanh nhóm trống giữ icon ở đầu và gói chữ bên cạnh, padding khối đối xứng 4px, 0 pixel dời ở `GroupPanelEmpty`; story `GroupPanelHintWraps`), G1F2 (lề 16px của trang trên điện thoại, qua decorator của chính trang), G1F3 (một dòng "Do and don't" về grid trong track của CSS grid hay flex).
- Không tên công khai nào thêm, đổi hay bỏ; không spec, không token.

**Files:**
- Create: `src/docs/data-grid-example/OrdersGrid.tsx`, `src/docs/data-grid-example/columns.tsx`, `src/docs/data-grid-example/orders.ts`, `src/docs/DataGridExample.mdx`, `src/docs/DataGridExample.stories.tsx`
- Modify: `src/components/data-grid/DataGrid.mdx`, `src/components/data-grid/DataGridGrouping.stories.tsx`; `src/styles/components/data-grid.css`; `scripts/check-dist-css.ts`

**Interfaces:**
- Không thêm gì vào API của gói. Code của ví dụ import từ `'../../index'` (trang hiện `'h2d-glass-ui'` qua `asShown` của MDX):
  - `orders.ts`: `Order`, `OrderLine`, `ORDERS`, `ASSIGNEE_ITEMS`, `TODAY`, `nextOrderId`. `columns.tsx`: `COLUMNS`. `OrdersGrid.tsx` (`'use client'`): `OrdersGrid`.
  - `localStorage`: `lumen-orders-grid-v1-wide`, `lumen-orders-grid-v1-phone`.
- CSS: thanh nhóm trống (`[data-empty]`: `flex-wrap: nowrap`, `padding: 4px 14px`, `align-items` giữ `center`) và `.flg-data-grid-group-hint { min-width: 0 }`; lớp `flg-data-grid-group-hint` vào `scripts/check-dist-css.ts`.
- Story: `DataGridExample` (`viewport-1280x720`), `DataGridExamplePhone` (`viewport-390x844`), id `examples-data-grid--data-grid-example`, `examples-data-grid--data-grid-example-phone`; `ExampleEditModes`, `ExampleSaves`, `ExampleSavedState`, `ExampleExport`, `GroupPanelHintWraps` (`no-visual`). Meta của trang: `stage: 'viewport'`, luật `region` tắt, decorator `@media (max-width: 639px) { .flg-stage { padding: 16px; } }`, `beforeEach` xoá hai khoá.
- Consumes: Task 2 (`csvExport`), Task 3 (công thức), Task 4 (export từ `src/index.ts`); `Card`, `SegmentedControl`, `Badge`, `Avatar`, `Table`; `withViewport`, `noTitleIsCut`, `realUserEvent`, `StoryFrame`.
- Task sau dùng: Task 6 (liên kết `?path=/docs/examples-data-grid--docs`), Task 8 (README liên kết tới ví dụ).

- [ ] **Step 1: Viết test**

```diff
diff --git a/src/components/data-grid/DataGridGrouping.stories.tsx b/src/components/data-grid/DataGridGrouping.stories.tsx
index edce797..be88ecf 100644
--- a/src/components/data-grid/DataGridGrouping.stories.tsx
+++ b/src/components/data-grid/DataGridGrouping.stories.tsx
@@ -770,6 +770,60 @@ export const GroupPanelNarrow: Story = {
   },
 };
 
+/**
+ * Outside the mockups: the empty tray in a grid 240px wide, where the hint does not fit one line. The
+ * icon stays at the start of the first line and the text wraps beside it (the icon is not alone on a
+ * line above it), and nothing runs past the border of the tray.
+ */
+export const GroupPanelHintWraps: Story = {
+  tags: ['no-visual'],
+  render: () => (
+    <div style={{ width: 240 }}>
+      <DataGrid
+        data={R1_ORDERS}
+        rowKey="id"
+        columns={R1_COLUMNS}
+        caption="Orders"
+        locale="vi-VN"
+        paging={false}
+        groupPanel
+      />
+    </div>
+  ),
+  play: async ({ canvasElement }) => {
+    const root = canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
+    const tray = panelOf(root);
+    await expect(tray).toHaveAttribute('data-empty');
+    const trayBox = tray.getBoundingClientRect();
+    const icon = tray.querySelector('svg')!.getBoundingClientRect();
+    const hint = tray.querySelector<HTMLElement>('.flg-data-grid-group-hint')!;
+    const hintBox = hint.getBoundingClientRect();
+    // Two lines or more: over 1.8 times the font size.
+    const fontSize = parseFloat(getComputedStyle(hint).fontSize);
+    await expect(
+      hintBox.height / fontSize,
+      `the hint is ${hintBox.height}px high at a font of ${fontSize}px`,
+    ).toBeGreaterThanOrEqual(1.8);
+    // Side by side: the icon ends before the text starts, centred on the lines of it.
+    await expect(icon.right, 'the icon is before the text').toBeLessThanOrEqual(hintBox.left);
+    const centre = icon.top + icon.height / 2;
+    await expect(
+      Math.abs(centre - (hintBox.top + hintBox.height / 2)),
+      'the icon is centred on the text',
+    ).toBeLessThanOrEqual(1);
+    // Inside the border, on every side.
+    const border = 1;
+    await expect(icon.left).toBeGreaterThanOrEqual(trayBox.left + border);
+    await expect(hintBox.right, 'the text stays in the tray').toBeLessThanOrEqual(
+      trayBox.right - border,
+    );
+    await expect(hintBox.top).toBeGreaterThanOrEqual(trayBox.top + border);
+    await expect(hintBox.bottom, 'two lines sit inside the border').toBeLessThanOrEqual(
+      trayBox.bottom - border,
+    );
+  },
+};
+
 /** A grid grouped by three levels whose parent keeps the grouping, as a caller that saves it does. */
 const GroupingGrid = (props: Partial<DataGridProps<R1Order>>) => {
   const [grouping, setGrouping] = useState<DataGridGroupItem[]>([
diff --git a/src/docs/DataGridExample.stories.tsx b/src/docs/DataGridExample.stories.tsx
new file mode 100644
index 0000000..916463b
--- /dev/null
+++ b/src/docs/DataGridExample.stories.tsx
@@ -0,0 +1,459 @@
+import type { Meta, StoryObj } from '@storybook/react-vite';
+import { useState } from 'react';
+import { expect, waitFor, within } from 'storybook/test';
+import { noTitleIsCut } from '../../.storybook/data-grid-orders';
+import { realUserEvent } from '../../.storybook/real-input';
+import { withViewport } from '../../.storybook/viewport';
+import { ASSIGNEE_ITEMS, ORDERS } from './data-grid-example/orders';
+import { OrdersGrid } from './data-grid-example/OrdersGrid';
+
+// The page "Examples/Data grid": the orders of "Lumen" in a DataGrid with what the grid offers turned
+// on, wide and on a phone. The code is in `data-grid-example/`, and `DataGridExample.mdx` shows that very
+// code, so what a reader copies is what the stories run.
+
+const KEYS = ['lumen-orders-grid-v1-wide', 'lumen-orders-grid-v1-phone'];
+const clearStorage = () => {
+  for (const key of KEYS) localStorage.removeItem(key);
+};
+
+const meta = {
+  title: 'Examples/Data grid',
+  // The stage keeps 32px around the card; a phone has 16px, as an app has (the owner chose the phone look
+  // from a shot with that gutter). Only this page changes the stage, and only below the phone width.
+  decorators: [
+    (Story) => (
+      <>
+        <style>{`@media (max-width: 639px) { .flg-stage { padding: 16px; } }`}</style>
+        <Story />
+      </>
+    ),
+  ],
+  parameters: {
+    // The example fills the window, as a page does (the stage is as big as the window); the grid is
+    // not a page, so the rule about landmarks is off, as in the grid's own stories.
+    stage: 'viewport',
+    a11y: { config: { rules: [{ id: 'region', enabled: false }] } },
+  },
+  // The example keeps its state in `localStorage`, one key for each layout: no story reads what
+  // another left, and no shot does.
+  beforeEach: () => {
+    clearStorage();
+  },
+} satisfies Meta;
+
+export default meta;
+type Story = StoryObj<typeof meta>;
+
+/**
+ * How long a story waits for the grid to show what a press or a key asked of it: the state changes in
+ * the press, and the commit and the focus it gives come in the engine's next rendering update, which
+ * Linux WebKit on x86 (CI) delivers late. Each message says what was missing, so a late update can be
+ * told from one that never came.
+ */
+const RENDER_UPDATE = { timeout: 5000 };
+
+const tableOf = (root: HTMLElement) =>
+  root.querySelector<HTMLTableElement>('table[role="grid"], table[role="treegrid"]')!;
+const rowOf = (root: HTMLElement, order: string) =>
+  Array.from(tableOf(root).tBodies[0]!.rows).find((row) => row.textContent?.includes(order))!;
+/** The cell of a row under the title of a column. */
+const cellOf = (root: HTMLElement, order: string, caption: string): HTMLElement => {
+  const heads = Array.from(tableOf(root).tHead!.rows[0]!.cells).filter(
+    (cell) => !cell.classList.contains('flg-data-grid-filler'),
+  );
+  const at = heads.findIndex((head) => head.textContent?.trim() === caption);
+  return Array.from(rowOf(root, order).cells).filter(
+    (cell) => !cell.classList.contains('flg-data-grid-filler'),
+  )[at] as HTMLElement;
+};
+const headOf = (root: HTMLElement, caption: string) =>
+  Array.from(root.querySelectorAll<HTMLElement>('thead th')).find((th) =>
+    th.textContent?.startsWith(caption),
+  )!;
+const captionsOf = (root: HTMLElement) =>
+  Array.from(root.querySelectorAll('.flg-data-grid-head-title')).map((title) => title.textContent);
+const gridOf = (canvasElement: HTMLElement) =>
+  canvasElement.querySelector<HTMLElement>('.flg-data-grid')!;
+const frameOf = (root: HTMLElement) => root.querySelector<HTMLElement>('.flg-table-frame')!;
+const editedRow = (root: HTMLElement) =>
+  tableOf(root).querySelector<HTMLTableRowElement>('tr[data-editing]');
+const editedCell = (root: HTMLElement) =>
+  tableOf(root).querySelector<HTMLElement>('td[data-editing], th[data-editing]');
+/** The text of a cell with the no-break spaces of the locale made plain. */
+const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');
+const vnd = (amount: number) =>
+  plain(new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount));
+
+/** The radio of a segment of the switch, found through the switch's own name. */
+const segmentOf = (canvasElement: HTMLElement, name: string) =>
+  within(within(canvasElement).getByRole('radiogroup', { name: 'Edit mode' })).getByRole('radio', {
+    name,
+  });
+
+/** The totals of the footer, written as the cells write them: the count of the orders and the sum of Total. */
+const footerOf = (root: HTMLElement) =>
+  plain(root.querySelector('tfoot')?.textContent).replace(/\s+/g, ' ').trim();
+
+/**
+ * What both looks have at rest, the ruling's "calm default" (spec phase 6 §8): the pointer is off the
+ * grid and no cell has the focus; the orders are sorted by date, newest first; two rows are chosen;
+ * nothing is grouped and no detail is open, so the tray shows its hint; the filter row, the funnels and
+ * the footer of totals are there; no title is cut; and the whole card is inside the stage.
+ */
+async function atRest(canvasElement: HTMLElement) {
+  const root = gridOf(canvasElement);
+  const real = await realUserEvent();
+  await real?.unhover(root);
+  await expect(root.contains(document.activeElement), 'no cell has the focus').toBe(false);
+  await noTitleIsCut(canvasElement);
+
+  const rows = Array.from(tableOf(root).tBodies[0]!.rows);
+  await expect(rows[0]).toHaveTextContent('DH-1040');
+  await expect(rows.filter((row) => row.getAttribute('aria-selected') === 'true')).toHaveLength(2);
+  await expect(rowOf(root, 'DH-1038')).toHaveAttribute('aria-selected', 'true');
+  await expect(rowOf(root, 'DH-1033')).toHaveAttribute('aria-selected', 'true');
+  await expect(root.querySelector('.flg-data-grid-group-row')).toBeNull();
+  await expect(root.querySelector('.flg-data-grid-detail-row')).toBeNull();
+  await expect(root.querySelector('.flg-data-grid-chip-button')).toBeNull();
+  await expect(root.querySelector('.flg-data-grid-group-hint')).not.toBeNull();
+  await expect(root.querySelector('input[type="search"]')).toHaveValue('');
+  await expect(root.querySelector('.flg-data-grid-filter-row')).not.toBeNull();
+
+  // The footer adds up all the orders, not the page.
+  const sum = ORDERS.reduce((all, order) => all + order.total, 0);
+  await expect(footerOf(root)).toContain(`Orders: ${ORDERS.length}`);
+  await expect(footerOf(root)).toContain(vnd(sum));
+
+  // The whole card is inside the stage: the stage is the window, and nothing of the card is below
+  // the room that its padding leaves.
+  const stage = canvasElement.querySelector<HTMLElement>('.flg-stage')!;
+  const card = canvasElement.querySelector<HTMLElement>('.flg-card')!;
+  const padding = parseFloat(getComputedStyle(stage).paddingBottom);
+  // A stage that grew is taller than the window: the shot would be longer than the page.
+  await expect(stage.getBoundingClientRect().height, 'the stage grew').toBe(window.innerHeight);
+  await expect(
+    card.getBoundingClientRect().bottom,
+    `the card ends at ${card.getBoundingClientRect().bottom}, the stage at ${stage.getBoundingClientRect().bottom}`,
+  ).toBeLessThanOrEqual(stage.getBoundingClientRect().bottom - padding);
+  await expect(card.getBoundingClientRect().right).toBeLessThanOrEqual(
+    stage.getBoundingClientRect().right - padding,
+  );
+}
+
+const render = () => <OrdersGrid />;
+
+/**
+ * The orders of "Lumen" on a wide screen: G1's card and toolbar (the caption, the tray with its hint, the
+ * search, the column chooser, the export and the add button), the filter row and the funnels, the footer of
+ * totals, sorted by date, newest first, with two rows chosen and Order pinned to the left. The eight
+ * columns do not fit the frame without a sideways scroll, so Channel is hidden at first; it is in the
+ * column chooser.
+ */
+export const DataGridExample: Story = {
+  tags: ['viewport-1280x720'],
+  render,
+  play: async ({ canvasElement }) => {
+    await withViewport(async (viewport) => {
+      await viewport.set(1280, 720);
+      const root = gridOf(canvasElement);
+      await waitFor(
+        () => expect(captionsOf(root), 'the wide layout').toContain('Assignee'),
+        RENDER_UPDATE,
+      );
+      await atRest(canvasElement);
+      await expect(captionsOf(root)).toEqual([
+        'Order',
+        'Customer',
+        'Assignee',
+        'Order date',
+        'Status',
+        'Qty',
+        'Total',
+      ]);
+      await expect(headOf(root, 'Order date')).toHaveAttribute('aria-sort', 'descending');
+      await expect(headOf(root, 'Order')).toHaveAttribute('data-pinned', 'left');
+      // The columns fit the frame: nothing scrolls sideways.
+      const frame = frameOf(root);
+      await expect(
+        frame.scrollWidth,
+        `the frame scrolls: ${frame.scrollWidth} in ${frame.clientWidth}`,
+      ).toBeLessThanOrEqual(frame.clientWidth);
+      // The toolbar is one row.
+      const toolbar = root.querySelector<HTMLElement>('.flg-data-grid-toolbar')!;
+      await expect(toolbar.getBoundingClientRect().height).toBeLessThan(60);
+    });
+  },
+};
+
+/**
+ * The same example on a phone: Order, Customer, Status and Total, the other columns in the column
+ * chooser, and nothing pinned, since a pinned zone would leave next to no room to scroll. The frame scrolls
+ * sideways; the toolbar and the pager wrap, as the grid is built.
+ */
+export const DataGridExamplePhone: Story = {
+  tags: ['viewport-390x844'],
+  render,
+  play: async ({ canvasElement }) => {
+    await withViewport(async (viewport) => {
+      await viewport.set(390, 844);
+      const root = gridOf(canvasElement);
+      await waitFor(
+        () => expect(captionsOf(root), 'the phone layout').not.toContain('Assignee'),
+        RENDER_UPDATE,
+      );
+      await atRest(canvasElement);
+      await expect(captionsOf(root)).toEqual(['Order', 'Customer', 'Status', 'Total']);
+      // Order date is in the chooser, and a hidden column is not sorted by: Order stands in.
+      await expect(headOf(root, 'Order')).toHaveAttribute('aria-sort', 'descending');
+      await expect(root.querySelector('[data-pinned]'), 'nothing is pinned').toBeNull();
+      const frame = frameOf(root);
+      await expect(
+        frame.scrollWidth,
+        `the frame does not scroll: ${frame.scrollWidth} in ${frame.clientWidth}`,
+      ).toBeGreaterThan(frame.clientWidth);
+      // The phone's gutter is 16px: the card is the width of the stage less two of them, and ends above
+      // the stage's bottom with the room that the gutter leaves.
+      const stage = canvasElement.querySelector<HTMLElement>('.flg-stage')!.getBoundingClientRect();
+      const card = canvasElement.querySelector<HTMLElement>('.flg-card')!.getBoundingClientRect();
+      await expect([card.left, card.right], 'the gutter is 16px').toEqual([16, stage.right - 16]);
+      await expect(card.bottom, 'the card ends in the stage').toBeLessThanOrEqual(
+        stage.bottom - 16,
+      );
+      await expect(frame.clientWidth, 'the frame is the card less its padding').toBeLessThan(
+        card.width,
+      );
+    });
+  },
+};
+
+// ---------------------------------------------------------------------------------------------------
+// Behaviour, in the real engines. Nothing here is a look: a screenshot cannot say it. The tags are
+// written on each story, not in a helper: the Storybook indexer reads them without running the file.
+
+/** A story of the wide layout: the window is set to it, whatever size the runner opened. */
+const wide = (run: (root: HTMLElement, canvasElement: HTMLElement) => Promise<void>) =>
+  (async ({ canvasElement }) => {
+    await withViewport(async (viewport) => {
+      await viewport.set(1280, 720);
+      const root = gridOf(canvasElement);
+      await waitFor(
+        () => expect(captionsOf(root), 'the wide layout').toContain('Assignee'),
+        RENDER_UPDATE,
+      );
+      await run(root, canvasElement);
+    });
+  }) satisfies Story['play'];
+
+/**
+ * The switch above the grid changes `editing.mode`: row mode has the Edit buttons, cell mode edits a
+ * cell on a press, batch mode holds a change and shows the save bar, form mode opens a form in the place
+ * of the row and popup mode a Dialog. A switch drops what was not saved: the bar goes and the value is the
+ * saved one.
+ */
+export const ExampleEditModes: Story = {
+  tags: ['no-visual'],
+  render,
+  play: wide(async (root, canvasElement) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await real.unhover(root);
+    const edit = (order: string) =>
+      root.querySelector<HTMLElement>(`button[aria-label="Edit ${order}"]`);
+    const bar = () => root.querySelector<HTMLElement>('.flg-data-grid-savebar');
+    const form = () => tableOf(root).querySelector('form.flg-data-grid-form');
+    const choose = async (name: string) => {
+      await real.click(segmentOf(canvasElement, name));
+      await waitFor(() => expect(segmentOf(canvasElement, name)).toBeChecked(), RENDER_UPDATE);
+    };
+
+    // Row: the action column has an Edit button on every row.
+    await expect(segmentOf(canvasElement, 'Row')).toBeChecked();
+    await expect(edit('DH-1040'), 'row mode has Edit').not.toBeNull();
+
+    // Cell: no Edit button, and a press on a Customer cell opens its editor.
+    await choose('Cell');
+    await waitFor(() => expect(edit('DH-1040'), 'cell mode has no Edit').toBeNull(), RENDER_UPDATE);
+    await real.click(cellOf(root, 'DH-1040', 'Customer'));
+    await waitFor(
+      () => expect(editedCell(root)?.querySelector('input'), 'a cell editor opened').toBeTruthy(),
+      RENDER_UPDATE,
+    );
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(editedCell(root)).toBeNull(), RENDER_UPDATE);
+
+    // Batch: a change is held, and the bar says so.
+    await choose('Batch');
+    await real.click(cellOf(root, 'DH-1040', 'Customer'));
+    await waitFor(
+      () => expect(editedCell(root)?.querySelector('input'), 'a cell editor opened').toBeTruthy(),
+      RENDER_UPDATE,
+    );
+    await real.fill(editedCell(root)!.querySelector('input')!, 'Nguyễn Văn Hoa');
+    await real.keyboard('{Enter}');
+    await waitFor(() => expect(bar(), 'the save bar shows').not.toBeNull(), RENDER_UPDATE);
+    await expect(bar()).toHaveTextContent('1 unsaved change');
+
+    // Back to row: what was not saved is dropped, the bar is gone, and the cell holds the saved value.
+    await choose('Row');
+    await waitFor(() => expect(bar(), 'the bar went').toBeNull(), RENDER_UPDATE);
+    await expect(cellOf(root, 'DH-1040', 'Customer')).toHaveTextContent(ORDERS[39]!.customer);
+    await expect(cellOf(root, 'DH-1040', 'Customer')).not.toHaveTextContent('Nguyễn Văn Hoa');
+
+    // Form: Edit opens a form in the place of the row.
+    await choose('Form');
+    await real.hover(rowOf(root, 'DH-1039'));
+    await real.click(edit('DH-1039')!);
+    await waitFor(() => expect(form(), 'the form opened').not.toBeNull(), RENDER_UPDATE);
+    await real.keyboard('{Escape}');
+    await waitFor(() => expect(form(), 'the form closed').toBeNull(), RENDER_UPDATE);
+
+    // Popup: Edit opens a Dialog over the grid.
+    await choose('Popup');
+    await real.hover(rowOf(root, 'DH-1039'));
+    await real.click(edit('DH-1039')!);
+    await waitFor(
+      () => expect(document.querySelector('dialog[open]'), 'the dialog opened').not.toBeNull(),
+      RENDER_UPDATE,
+    );
+    await real.keyboard('{Escape}');
+    await waitFor(
+      () => expect(document.querySelector('dialog[open]'), 'the dialog closed').toBeNull(),
+      RENDER_UPDATE,
+    );
+  }),
+};
+
+/**
+ * Row mode: Edit, type a customer, Enter. The cell shows what was typed once the save has gone through
+ * `onSaving` to the example's own list, and the footer's count is what it was.
+ */
+export const ExampleSaves: Story = {
+  tags: ['no-visual'],
+  render,
+  play: wide(async (root) => {
+    const real = await realUserEvent();
+    if (!real) return;
+    await real.unhover(root);
+    const before = footerOf(root);
+    await real.hover(rowOf(root, 'DH-1039'));
+    await real.click(root.querySelector<HTMLElement>('button[aria-label="Edit DH-1039"]')!);
+    await waitFor(
+      () => expect(editedRow(root), 'the row is being edited').not.toBeNull(),
+      RENDER_UPDATE,
+    );
+    const editor = editedRow(root)!.querySelector<HTMLInputElement>(
+      'input[aria-label="Customer"]',
+    )!;
+    await real.fill(editor, 'Nguyễn Văn Hoa');
+    await real.keyboard('{Enter}');
+    await waitFor(() => expect(editedRow(root), 'the edit ended').toBeNull(), RENDER_UPDATE);
+    await waitFor(
+      () =>
+        expect(
+          cellOf(root, 'DH-1039', 'Customer'),
+          'the cell shows what was saved',
+        ).toHaveTextContent('Nguyễn Văn Hoa'),
+      RENDER_UPDATE,
+    );
+    await expect(footerOf(root)).toBe(before);
+  }),
+};
+
+/** Two visits to the page: the second mounts the example anew, which reads the storage again. */
+const Visits = () => {
+  const [visit, setVisit] = useState(1);
+  return (
+    <div data-testid="visits" style={{ width: '100%' }}>
+      <button type="button" onClick={() => setVisit((count) => count + 1)}>
+        Reload
+      </button>
+      <OrdersGrid key={visit} />
+    </div>
+  );
+};
+
+/**
+ * What a person arranges stays: a press on Customer sorts by it, the sort is in the storage under the
+ * key of the wide layout (the phone layout has none), and a new visit has it back.
+ */
+export const ExampleSavedState: Story = {
+  tags: ['no-visual'],
+  render: () => <Visits />,
+  play: wide(async (root, canvasElement) => {
+    try {
+      const visits = within(canvasElement.querySelector<HTMLElement>('[data-testid="visits"]')!);
+      const sortOf = () => headOf(gridOf(canvasElement), 'Customer');
+      await expect(sortOf()).not.toHaveAttribute('aria-sort');
+      sortOf().querySelector<HTMLElement>('.flg-table-sort')!.click();
+      await waitFor(
+        () => expect(sortOf(), 'the press sorted').toHaveAttribute('aria-sort', 'ascending'),
+        RENDER_UPDATE,
+      );
+      await expect(JSON.parse(localStorage.getItem(KEYS[0]!)!).sort).toEqual([
+        { field: 'customer', direction: 'asc' },
+      ]);
+      await expect(localStorage.getItem(KEYS[1]!)).toBeNull();
+
+      visits.getByRole('button', { name: 'Reload' }).click();
+      await waitFor(
+        () => expect(root.isConnected, 'the grid mounted anew').toBe(false),
+        RENDER_UPDATE,
+      );
+      // The new visit draws the default state first, then reads the storage after it mounts.
+      await waitFor(
+        () => expect(sortOf(), 'the sort is back').toHaveAttribute('aria-sort', 'ascending'),
+        RENDER_UPDATE,
+      );
+    } finally {
+      clearStorage();
+    }
+  }),
+};
+
+/**
+ * The export button: one press downloads `lumen-orders.csv`, whose second line holds the fields of the
+ * first row the grid shows. The download is never real: `URL.createObjectURL` and the click of the anchor
+ * are stubbed, and put back in `finally`.
+ */
+export const ExampleExport: Story = {
+  tags: ['no-visual'],
+  render,
+  play: wide(async (root) => {
+    const blobs: Blob[] = [];
+    const named: string[] = [];
+    const { createObjectURL, revokeObjectURL } = URL;
+    const { click } = HTMLAnchorElement.prototype;
+    URL.createObjectURL = (blob: Blob | MediaSource) => {
+      blobs.push(blob as Blob);
+      return 'blob:story';
+    };
+    URL.revokeObjectURL = () => {};
+    HTMLAnchorElement.prototype.click = function stubbed(this: HTMLAnchorElement) {
+      named.push(this.download);
+    };
+    try {
+      within(root).getByRole('button', { name: 'Export CSV' }).click();
+      await waitFor(() => expect(blobs, 'one blob').toHaveLength(1), RENDER_UPDATE);
+      await expect(named).toEqual(['lumen-orders.csv']);
+      const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(
+        await blobs[0]!.arrayBuffer(),
+      );
+      const lines = text.slice(1).split('\r\n');
+      const heading = lines[0]!.split(',');
+      // The first row is the newest order; its fields are what its cells write, in the columns' order.
+      await expect(rowOf(root, 'DH-1040')).toBe(tableOf(root).tBodies[0]!.rows[0]);
+      const assignee = ASSIGNEE_ITEMS.find((item) => item.value === ORDERS[39]!.assignee)!.text;
+      await expect(lines[1]!.split(',').map(plain)).toEqual(
+        heading.map((caption) =>
+          caption === 'Assignee' ? assignee : plain(cellOf(root, 'DH-1040', caption)?.textContent),
+        ),
+      );
+      // A record for each of the 40 orders, and the CRLF that ends the last.
+      await expect(lines).toHaveLength(1 + ORDERS.length + 1);
+    } finally {
+      URL.createObjectURL = createObjectURL;
+      URL.revokeObjectURL = revokeObjectURL;
+      HTMLAnchorElement.prototype.click = click;
+    }
+  }),
+};
```

- [ ] **Step 2: Chạy test, xác nhận fail**

Run:

```bash
pnpm gen:theme
pnpm vitest run --project storybook-light --browser=chromium src/components/data-grid/DataGridGrouping.stories.tsx src/docs/DataGridExample.stories.tsx
```

Expected: FAIL.
- `src/docs/DataGridExample.stories.tsx` không nạp được (`Failed to resolve import "./data-grid-example/…"`): ví dụ chưa có.
- `GroupPanelHintWraps`: "the icon is before the text: expected 510 to be less than or equal to 495" (icon nằm một hàng riêng trên chữ); các story khác của `DataGridGrouping.stories.tsx` pass.

Theo báo cáo của bản nháp (phát hiện 20): người viết viết story cùng ví dụ (một story đo trước, để chọn chiều cao và độ rộng), nên **sáu story của trang không fail trước trên code đã xong**; các lần fail đầu của file đã xong là lỗi của chính test (chữ của chân "Orders: 40"; dòng đầu của điện thoại DH-1001 vì sắp theo cột ẩn; Assignee trong CSV có chữ viết tắt của Avatar trước tên; stage lớn hơn cửa sổ vì các đốm nền tràn ra, nên khẳng định là chiều cao stage bằng cửa sổ). `GroupPanelHintWraps` (G1F1) fail trước trên CSS cũ như trên, ở Chromium. Lần chạy story đầu có thể fail `Failed to import test file …` khi Vite tối ưu lại: chạy lại.

- [ ] **Step 3: Viết code**

```diff
diff --git a/scripts/check-dist-css.ts b/scripts/check-dist-css.ts
index 22e6616..6baeeea 100644
--- a/scripts/check-dist-css.ts
+++ b/scripts/check-dist-css.ts
@@ -280,6 +280,7 @@ const SHIPPED_CLASSES = [
   'flg-data-grid-savebar-spacer',
   'flg-data-grid-row-menu',
   'flg-data-grid-group-panel',
+  'flg-data-grid-group-hint',
   'flg-data-grid-group-label',
   'flg-data-grid-group-separator',
   'flg-data-grid-group-chip',
diff --git a/src/components/data-grid/DataGrid.mdx b/src/components/data-grid/DataGrid.mdx
index 4068577..6ac42f8 100644
--- a/src/components/data-grid/DataGrid.mdx
+++ b/src/components/data-grid/DataGrid.mdx
@@ -2712,6 +2712,16 @@ Combobox of the editors, and the two search fields. A record given in part keeps
   nothing, and the keys of the rows are what it follows.
 - Do pass `csvExport` and not a button of your own, or call `exportCsv()` from yours: both write the
   same text. Export the whole data on the server in server mode.
+- Do give a track or a flex item that holds a grid `minmax(0, 1fr)` or `min-width: 0`. An `auto`
+  track, or a flex item, is as wide as its content at least, so a grid in one is never narrower than
+  its columns and its frame never scrolls: the page does.
+
+  ```tsx
+  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
+    <DataGrid data={orders} rowKey="id" columns={columns} caption="Orders" />
+  </div>
+  ```
+
 - Don't give two rows the same key.
 - Don't expect the handles to work while the grid sorts or groups: they are off then, and say why.
 - Don't sort or page `data` yourself without `remote`: the grid does, and sorting twice is wasted.
diff --git a/src/docs/DataGridExample.mdx b/src/docs/DataGridExample.mdx
new file mode 100644
index 0000000..37a1114
--- /dev/null
+++ b/src/docs/DataGridExample.mdx
@@ -0,0 +1,96 @@
+import { Meta, Source } from '@storybook/addon-docs/blocks';
+import { StoryFrame } from '../../.storybook/story-frame';
+import * as Stories from './DataGridExample.stories';
+import columnsCode from './data-grid-example/columns.tsx?raw';
+import gridCode from './data-grid-example/OrdersGrid.tsx?raw';
+import ordersCode from './data-grid-example/orders.ts?raw';
+
+export const asShown = (code) => code.replaceAll("'../../index'", "'h2d-glass-ui'");
+
+<Meta of={Stories} />
+
+# Data grid
+
+The orders of "Lumen", the application of the mockups, in a `DataGrid` with most of what the grid
+offers turned on: a search, a filter row and the funnels of the header filter, a tray to group by,
+totals, a detail under each row, columns that can be pinned, hidden and moved, five ways to edit, a
+CSV export, and a state that is kept between visits. The page shows it, and gives its code. The code
+is the code the stories run: it is copied from the files, not written again for the page.
+
+## The grid
+
+On a wide screen the grid starts calm: sorted by Order date, newest first, with two orders chosen,
+nothing grouped and no detail open, and Order pinned to the left. The tray above the grid says what
+it is for, and the toolbar has the caption, the search, the column chooser, the export button and
+the add button, in that order.
+
+<StoryFrame title="The grid on a wide screen" id="examples-data-grid--data-grid-example" />
+
+Eight columns do not fit the room of a 1280px window without a scroll sideways, so Channel is
+hidden at first. It is in the column chooser: tick its box and the grid scrolls.
+
+On a phone the grid shows Order, Customer, Status and Total, and the other columns wait in the
+chooser. Nothing is pinned: the box of the row and the button of its detail already take 80px, and
+a pinned Order would leave next to no room to scroll the rest. The toolbar and the pager wrap to
+more rows, as the grid is built.
+
+<StoryFrame title="The grid on a phone" id="examples-data-grid--data-grid-example-phone" phone />
+
+## The layout
+
+One component, two layouts. The layout is chosen by a media query, and the grid is given the
+layout's `defaultColumnLayout`. The query is read through `useSyncExternalStore`, so the server and
+the first render in the browser agree: the server says "wide", and a phone renders once more after
+the page is hydrated.
+The grid has the layout as its `key`, so a window that crosses 640px (the width the Dialog calls a
+phone) mounts the grid of the other layout instead of changing the columns under the person's hands.
+Each layout keeps its own state, under a key of its own, since the columns of one are not the
+columns of the other.
+
+The sort is the one thing that differs besides the columns: a column that is hidden is not sorted
+by, and the phone does not show Order date, so there the grid is sorted by Order, whose numbers
+count up with the dates.
+
+## What the page turns on
+
+- **Searching and filtering.** `searchPanel`, `filterRow`, `headerFilter` and `filterPanel`; Order,
+  Qty and Total have no funnel, since a list of every one of their values is no help. See
+  [Filtering](?path=/docs/components-datagrid-filtering--docs).
+- **Grouping and totals.** `groupPanel` is the tray, and `summary` is the footer (the count of the
+  orders and the sum of Total) and the same sum on a group row. Drag Status into the tray, or choose
+  "Group by this column" in the column menu. See
+  [Grouping](?path=/docs/components-datagrid-grouping--docs).
+- **A detail under each row.** `renderDetail` draws the lines of the order. It is never given a new
+  row, which has no lines yet.
+- **Columns.** The widths, the pin of Order, `lookup` for Status, Assignee and Channel (which gives
+  them a Select to edit with, and a list of values to filter by), and the Badge and the Avatar that
+  draw them. See [Columns](?path=/docs/components-datagrid-columns--docs).
+- **Choosing rows.** `selectionMode="multiple"` puts a box in front of every row, and two rows are
+  chosen at first.
+- **Editing.** The switch above the grid sets `editing.mode`. A new mode drops the changes that were
+  not saved, which is the grid's own rule. `onSaving` is told what changed and the example applies
+  it to its list, which is all the grid needs of an application: it never changes `data`. Qty and
+  Total are what the lines add up to, so no editor changes them. See
+  [Editing](?path=/docs/components-datagrid-editing--docs).
+- **CSV.** `csvExport` adds the button, and `fileName` names the file it downloads. The file holds
+  the rows the grid shows, with the columns it shows.
+- **The saved state.** The sort, the filter, the grouping, the layout of the columns and the page
+  are kept in `localStorage` when they change, and read after the grid has mounted, which is the
+  recipe in [State](?path=/docs/components-datagrid--docs#saving-the-state).
+
+## The code
+
+The grid. `OrdersGrid` is a Client Component, since it keeps the orders, the mode and the state in
+React state; a page that is a Server Component can render it, and can read the orders and hand them
+down instead of importing them.
+
+<Source code={asShown(gridCode)} language="tsx" />
+
+The columns, a constant of the module: a `columns` that changes on every render makes the grid draw
+again (see "A stable `columns`" in [DataGrid](?path=/docs/components-datagrid--docs)).
+
+<Source code={asShown(columnsCode)} language="tsx" />
+
+The orders. A real application reads them from its server.
+
+<Source code={asShown(ordersCode)} language="ts" />
diff --git a/src/docs/data-grid-example/OrdersGrid.tsx b/src/docs/data-grid-example/OrdersGrid.tsx
new file mode 100644
index 0000000..09a8f33
--- /dev/null
+++ b/src/docs/data-grid-example/OrdersGrid.tsx
@@ -0,0 +1,254 @@
+'use client';
+
+import { useEffect, useState, useSyncExternalStore } from 'react';
+import {
+  Card,
+  DataGrid,
+  SegmentedControl,
+  SegmentedControlItem,
+  Table,
+  TableBody,
+  TableCell,
+  TableHead,
+  TableHeader,
+  TableRow,
+} from '../../index';
+import type {
+  DataGridChange,
+  DataGridColumnLayout,
+  DataGridEditMode,
+  DataGridState,
+  DataGridSortItem,
+  DataGridSummary,
+} from '../../index';
+import { COLUMNS } from './columns';
+import { ORDERS, TODAY, nextOrderId } from './orders';
+import type { Order } from './orders';
+
+const MODES: { value: DataGridEditMode; label: string }[] = [
+  { value: 'row', label: 'Row' },
+  { value: 'cell', label: 'Cell' },
+  { value: 'batch', label: 'Batch' },
+  { value: 'form', label: 'Form' },
+  { value: 'popup', label: 'Popup' },
+];
+
+/** The totals of the footer and of the group rows: how many orders, and what they add up to. */
+const SUMMARY: DataGridSummary<Order> = {
+  total: [
+    { column: 'id', type: 'count', label: 'Orders' },
+    { column: 'total', type: 'sum' },
+  ],
+  group: [{ column: 'total', type: 'sum' }],
+};
+
+type LayoutClass = 'wide' | 'phone';
+
+/**
+ * Where each layout starts. The wide one pins Order to the left and keeps Channel in the column
+ * chooser, which is what fits the room; the phone one shows four columns and pins nothing, since a
+ * pinned zone would leave next to no room to scroll.
+ */
+const LAYOUTS: Record<LayoutClass, Partial<DataGridColumnLayout>> = {
+  wide: { pinned: { id: 'left' }, hidden: ['channel'] },
+  phone: { hidden: ['assignee', 'date', 'channel', 'qty'], pinned: {} },
+};
+
+/**
+ * The newest orders first. A sort of a column that is hidden is not applied, and the phone layout hides
+ * Order date, so there the order numbers, which count up with the dates, stand in.
+ */
+const SORTS: Record<LayoutClass, DataGridSortItem[]> = {
+  wide: [{ field: 'date', direction: 'desc' }],
+  phone: [{ field: 'id', direction: 'desc' }],
+};
+
+/** Below 640px, the width the Dialog calls a phone (`fullScreenOnPhone`). */
+const PHONE_QUERY = '(max-width: 639px)';
+
+const subscribe = (onChange: () => void) => {
+  const list = window.matchMedia(PHONE_QUERY);
+  list.addEventListener('change', onChange);
+  return () => list.removeEventListener('change', onChange);
+};
+
+/**
+ * Whether the window is a phone. The server and the first render of a hydration say no, so the
+ * HTML is the wide layout; a phone then renders once more.
+ */
+function usePhone() {
+  return useSyncExternalStore(
+    subscribe,
+    () => window.matchMedia(PHONE_QUERY).matches,
+    () => false,
+  );
+}
+
+/** What each layout keeps, under a key of its own: the columns of one are not those of the other. */
+const keyOf = (layout: LayoutClass) => `lumen-orders-grid-v1-${layout}`;
+
+const readState = (layout: LayoutClass): Partial<DataGridState> | null => {
+  try {
+    return JSON.parse(localStorage.getItem(keyOf(layout)) ?? 'null');
+  } catch {
+    // Private mode or text that is no JSON: the default state stays.
+    return null;
+  }
+};
+
+/** Applies what `onSaving` is told to the list; the grid never changes `data` itself. */
+function applyChanges(orders: Order[], changes: readonly DataGridChange<Order>[]): Order[] {
+  let next = orders;
+  for (const change of changes) {
+    if (change.type === 'update')
+      next = next.map((order) => (order.id === change.key ? { ...order, ...change.data } : order));
+    else if (change.type === 'remove') next = next.filter((order) => order.id !== change.key);
+    else
+      next = [
+        {
+          id: nextOrderId(next),
+          customer: '',
+          assignee: 'lan',
+          date: TODAY,
+          status: 'new',
+          channel: 'Website',
+          qty: 0,
+          total: 0,
+          lines: [],
+          ...change.data,
+        },
+        ...next,
+      ];
+  }
+  return next;
+}
+
+const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
+
+/** What a row opens to: the lines of the order. */
+function renderDetail(order: Order) {
+  if (order.lines.length === 0)
+    return <span style={{ fontSize: 'var(--flg-text-sm)' }}>No lines yet.</span>;
+  return (
+    <Table variant="lined" size="sm" aria-label={`Lines of ${order.id}`} style={{ maxWidth: 480 }}>
+      <TableHeader>
+        <TableRow>
+          <TableHead>Product</TableHead>
+          <TableHead align="end">Qty</TableHead>
+          <TableHead align="end">Unit price</TableHead>
+        </TableRow>
+      </TableHeader>
+      <TableBody>
+        {order.lines.map((line) => (
+          <TableRow key={line.product}>
+            <TableCell>{line.product}</TableCell>
+            <TableCell align="end">{line.qty}</TableCell>
+            <TableCell align="end">{VND.format(line.price)}</TableCell>
+          </TableRow>
+        ))}
+      </TableBody>
+    </Table>
+  );
+}
+
+/** The grid of one layout. It keeps the saved state, so a layout that is mounted again reads it again. */
+function Grid({
+  layout,
+  mode,
+  orders,
+  onOrders,
+}: {
+  layout: LayoutClass;
+  mode: DataGridEditMode;
+  orders: Order[];
+  onOrders: (next: (orders: Order[]) => Order[]) => void;
+}) {
+  const [saved, setSaved] = useState<Partial<DataGridState> | null>(null);
+  useEffect(() => setSaved(readState(layout)), [layout]);
+  return (
+    <DataGrid
+      key={saved ? 'saved' : 'default'}
+      data={orders}
+      rowKey="id"
+      columns={COLUMNS}
+      caption="Orders"
+      description="40 orders · Lumen, November 2026"
+      variant="lined"
+      height={layout === 'phone' ? 600 : 520}
+      locale="vi-VN"
+      selectionMode="multiple"
+      defaultSelectedKeys={['DH-1038', 'DH-1033']}
+      paging={{ pageSize: 12, pageSizes: [12, 24, 48] }}
+      searchPanel
+      columnChooser
+      filterRow
+      headerFilter
+      filterPanel
+      groupPanel
+      csvExport={{ fileName: 'lumen-orders.csv' }}
+      summary={SUMMARY}
+      renderDetail={renderDetail}
+      editing={{ mode, allowAdding: true, allowDeleting: true }}
+      onSaving={(changes) => onOrders((current) => applyChanges(current, changes))}
+      initNewRow={(): Partial<Order> => ({
+        id: nextOrderId(orders),
+        date: TODAY,
+        status: 'new',
+        channel: 'Website',
+        qty: 0,
+        total: 0,
+      })}
+      defaultSort={saved?.sort ?? SORTS[layout]}
+      defaultFilter={saved?.filter}
+      defaultGrouping={saved?.grouping}
+      defaultColumnLayout={saved?.columnLayout ?? LAYOUTS[layout]}
+      defaultPage={saved?.page}
+      onStateChange={({ sort, filter, grouping, columnLayout, page }) => {
+        try {
+          localStorage.setItem(
+            keyOf(layout),
+            JSON.stringify({ sort, filter, grouping, columnLayout, page }),
+          );
+        } catch {
+          // Private mode or a full storage: the state is not kept, the grid goes on.
+        }
+      }}
+    />
+  );
+}
+
+/**
+ * The orders of "Lumen" in a grid: the example of the page "Examples/Data grid". The orders and the
+ * edit mode are the example's own state; what a person arranges (sort, filter, grouping, columns,
+ * page) is kept in `localStorage`, one record for each layout.
+ */
+export function OrdersGrid() {
+  const [orders, setOrders] = useState(ORDERS);
+  const [mode, setMode] = useState<DataGridEditMode>('row');
+  const layout: LayoutClass = usePhone() ? 'phone' : 'wide';
+  return (
+    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', width: '100%', gap: 12 }}>
+      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
+        <SegmentedControl
+          aria-label="Edit mode"
+          size="sm"
+          value={mode}
+          onValueChange={(value) => setMode(value as DataGridEditMode)}
+        >
+          {MODES.map(({ value, label }) => (
+            <SegmentedControlItem key={value} value={value}>
+              {label}
+            </SegmentedControlItem>
+          ))}
+        </SegmentedControl>
+        <span style={{ fontSize: 'var(--flg-text-sm)', color: 'var(--flg-text-muted)' }}>
+          Changing the mode drops the changes that are not saved.
+        </span>
+      </div>
+      <Card>
+        {/* The layout is the grid's key: a window that crosses 640px mounts the grid of the other one. */}
+        <Grid key={layout} layout={layout} mode={mode} orders={orders} onOrders={setOrders} />
+      </Card>
+    </div>
+  );
+}
diff --git a/src/docs/data-grid-example/columns.tsx b/src/docs/data-grid-example/columns.tsx
new file mode 100644
index 0000000..e798b03
--- /dev/null
+++ b/src/docs/data-grid-example/columns.tsx
@@ -0,0 +1,88 @@
+import { Avatar, Badge } from '../../index';
+import type { DataGridColumn } from '../../index';
+import { ASSIGNEE_ITEMS } from './orders';
+import type { Order } from './orders';
+
+const STATUS_ITEMS = [
+  { value: 'new', text: 'New', variant: 'accent' },
+  { value: 'processing', text: 'Processing', variant: 'warning' },
+  { value: 'delivered', text: 'Delivered', variant: 'success' },
+  { value: 'cancelled', text: 'Cancelled', variant: 'danger' },
+] as const;
+
+/**
+ * The columns of the orders. `qty` and `total` are what the lines add up to, so no editor changes
+ * them, and `id` is given by the grid's `initNewRow`. The widths add up to the room of the wide
+ * layout; Channel is hidden there and stays in the column chooser.
+ */
+export const COLUMNS: DataGridColumn<Order>[] = [
+  {
+    field: 'id',
+    caption: 'Order',
+    rowHeader: true,
+    width: 112,
+    allowEditing: false,
+    allowHeaderFiltering: false,
+  },
+  {
+    field: 'customer',
+    caption: 'Customer',
+    width: 186,
+    validationRules: [{ type: 'required' }],
+  },
+  {
+    field: 'assignee',
+    caption: 'Assignee',
+    width: 180,
+    lookup: { items: ASSIGNEE_ITEMS, valueField: 'value', displayField: 'text' },
+    cell: ({ value, text }) => (
+      <span
+        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, verticalAlign: 'middle' }}
+      >
+        <Avatar
+          size="sm"
+          alt=""
+          fallback={ASSIGNEE_ITEMS.find((item) => item.value === value)?.initials}
+        />
+        {text}
+      </span>
+    ),
+  },
+  { field: 'date', caption: 'Order date', dataType: 'date', width: 150 },
+  {
+    field: 'status',
+    caption: 'Status',
+    width: 150,
+    lookup: { items: STATUS_ITEMS, valueField: 'value', displayField: 'text' },
+    cell: ({ value, text }) => (
+      <Badge variant={STATUS_ITEMS.find((item) => item.value === value)?.variant}>{text}</Badge>
+    ),
+  },
+  {
+    field: 'channel',
+    caption: 'Channel',
+    width: 120,
+    lookup: {
+      items: ['Store', 'Website', 'Phone'].map((value) => ({ value, text: value })),
+      valueField: 'value',
+      displayField: 'text',
+    },
+  },
+  {
+    field: 'qty',
+    caption: 'Qty',
+    dataType: 'number',
+    width: 88,
+    allowEditing: false,
+    allowHeaderFiltering: false,
+  },
+  {
+    field: 'total',
+    caption: 'Total',
+    dataType: 'number',
+    format: { style: 'currency', currency: 'VND' },
+    width: 142,
+    allowHeaderFiltering: false,
+    allowEditing: false,
+  },
+];
diff --git a/src/docs/data-grid-example/orders.ts b/src/docs/data-grid-example/orders.ts
new file mode 100644
index 0000000..fcd79f8
--- /dev/null
+++ b/src/docs/data-grid-example/orders.ts
@@ -0,0 +1,97 @@
+/** One line of an order: what was bought, how many, and the price of one. */
+export interface OrderLine {
+  product: string;
+  qty: number;
+  price: number;
+}
+
+/** An order of "Lumen". `qty` and `total` are what the lines add up to. */
+export interface Order {
+  id: string;
+  customer: string;
+  assignee: 'lan' | 'huy' | 'anh';
+  /** The ISO day of the order. */
+  date: string;
+  status: 'new' | 'processing' | 'delivered' | 'cancelled';
+  channel: 'Store' | 'Website' | 'Phone';
+  qty: number;
+  total: number;
+  lines: OrderLine[];
+}
+
+const CUSTOMERS = [
+  'Tạp hóa Hoa Mai',
+  'Nhà hàng Sen Vàng',
+  'Công ty An Phát',
+  'Studio Ánh Dương',
+  'Đỗ Khánh Linh',
+  'Công ty Thịnh Vượng',
+  'Hoàng Đức Long',
+  'Cà phê Sương Sớm',
+  'Nhà sách Đông A',
+  'Trần Thu Hà',
+  'Công ty Minh Phát',
+  'Xưởng gỗ Tân Lập',
+  'Siêu thị Việt Hưng',
+  'Quán Trà Chiều',
+];
+
+const PRODUCTS = [
+  { product: 'Desk lamp', price: 450000 },
+  { product: 'Notebook, set of 10', price: 180000 },
+  { product: 'Ceramic mug', price: 95000 },
+  { product: 'Standing desk', price: 4800000 },
+  { product: 'Monitor arm', price: 1250000 },
+  { product: 'Wireless keyboard', price: 890000 },
+  { product: 'Desk mat', price: 320000 },
+  { product: 'Cable organiser', price: 75000 },
+];
+
+const ASSIGNEES = ['lan', 'huy', 'anh'] as const;
+const STATUSES = [
+  'delivered',
+  'processing',
+  'new',
+  'delivered',
+  'delivered',
+  'processing',
+  'cancelled',
+] as const;
+const CHANNELS = ['Store', 'Website', 'Phone'] as const;
+
+/**
+ * The assignees, as a lookup: the rows hold the id, the grid shows the name, and the editor is a
+ * Select of the names.
+ */
+export const ASSIGNEE_ITEMS = [
+  { value: 'lan', text: 'Võ Thị Lan', initials: 'VL' },
+  { value: 'huy', text: 'Lê Quang Huy', initials: 'QH' },
+  { value: 'anh', text: 'Nguyễn Minh Anh', initials: 'MA' },
+];
+
+/** The day of the example, a constant so the server and the browser draw the same page. */
+export const TODAY = '2026-11-27';
+
+/** Forty orders, DH-1001 to DH-1040, over the first twelve days of November 2026. */
+export const ORDERS: Order[] = Array.from({ length: 40 }, (_, index) => {
+  const lines: OrderLine[] = Array.from({ length: 1 + (index % 3) }, (_, line) => ({
+    ...PRODUCTS[(index * 3 + line * 5) % PRODUCTS.length]!,
+    qty: 1 + ((index * 7 + line * 3) % 12),
+  }));
+  const day = 1 + Math.floor(index / 3.5);
+  return {
+    id: `DH-${1001 + index}`,
+    customer: CUSTOMERS[index % CUSTOMERS.length]!,
+    assignee: ASSIGNEES[index % ASSIGNEES.length]!,
+    date: `2026-11-${String(day).padStart(2, '0')}`,
+    status: STATUSES[index % STATUSES.length]!,
+    channel: CHANNELS[(index + 1) % CHANNELS.length]!,
+    qty: lines.reduce((sum, { qty }) => sum + qty, 0),
+    total: lines.reduce((sum, { qty, price }) => sum + qty * price, 0),
+    lines,
+  };
+});
+
+/** The id the next new order gets: one more than the greatest number in the list. */
+export const nextOrderId = (orders: readonly Order[]) =>
+  `DH-${1 + Math.max(1000, ...orders.map((order) => Number(order.id.slice(3))))}`;
diff --git a/src/styles/components/data-grid.css b/src/styles/components/data-grid.css
index 0643eb5..abc610d 100644
--- a/src/styles/components/data-grid.css
+++ b/src/styles/components/data-grid.css
@@ -308,9 +308,14 @@
     border-radius: var(--flg-radius-md);
     background: var(--flg-control-bg-secondary);
   }
+  /* The empty tray keeps its icon beside the hint and wraps the hint next to it when the tray is narrower
+     than the sentence (a phone): no wrapping of the items. The block padding is the same on both sides, so
+     a single line keeps the centre it has in 34px, and two lines stay inside the border, the icon centred
+     on them. */
   .flg-data-grid-group-panel[data-empty] {
+    flex-wrap: nowrap;
     gap: 8px;
-    padding: 0 14px;
+    padding: 4px 14px;
     color: var(--flg-text-muted);
     font-size: var(--flg-text-xs);
   }
@@ -319,6 +324,9 @@
     width: 15px;
     height: 15px;
   }
+  .flg-data-grid-group-hint {
+    min-width: 0;
+  }
   .flg-data-grid-group-label {
     color: var(--flg-text-muted);
     font-size: var(--flg-text-xs);
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check && npx tsc --noEmit -p . && pnpm check:name
pnpm vitest run --project unit --maxWorkers=3 src/docs
pnpm vitest run --project scripts --maxWorkers=3
for d in src/components/data-grid src/docs; do
  for b in chromium firefox webkit; do
    pnpm vitest run --project storybook-light --browser=$b $d
    pnpm vitest run --project storybook-dark --browser=$b $d
  done
done
pnpm build && pnpm check:package
pnpm build-storybook && pnpm check:docs-tables
```

Expected:
- `lint`, `typecheck`, `format:check`, `tsc -p .`, `check:name`: PASS.
- `unit` (`src/docs`): 2 file, 6 PASS (`unit-react18` không có file nào ở đó); `scripts`: 7 file, 261 PASS. Claude chạy lại cả ba project trên đầu nháp của task (`4354d8d`, sau các fixup): `unit` 238 file, 5891 PASS (1 skipped); `unit-react18` 122 file, 4356 PASS (4 skipped); `scripts` 261; mọi bước của `check-p6g.sh` pass (bản ghi `task-5-claude-check.txt`).
- Story, ở mỗi lượt (sáu lượt): data-grid 141, docs 32 PASS. Ở bản nháp người sửa G1F1–G1F3 chạy cả mười hai lượt; Claude chạy `DataGridGrouping` 27 / 27 và docs 32 / 32 ở sáu lượt trên `4354d8d`.
- `pnpm build && pnpm check:package`: PASS với ngưỡng của Task 4; CSS 20.98 kB, hai mục JS không đổi.
- `pnpm check:docs-tables`: `no table built as text in 228 files`. Index đã build: "Examples › Data grid" sau "App shell"; liên kết `?path=/docs/examples-data-grid--docs` của `DataGrid.mdx` trỏ đúng chỗ.
- Ảnh (Claude, bản build, Chromium):
  - `DataGridExample` (1280×720, sáng) đúng (b): thẻ 1216px, khung 1176px không cuộn ngang, thanh công cụ một hàng, bảy tiêu đề (Channel trong bộ chọn), Order ghim, Order date sắp giảm dần, DH-1038 và DH-1033 đã chọn, chân "Orders: 40" và tổng Total (phát hiện 11).
  - `DataGridExamplePhone` (390×844, tối) đúng (p2) sau G1F1, G1F2: lề 16px (thẻ x 16..374), khung 318 / 742 cuộn ngang, không ghim, bốn tiêu đề, thanh công cụ bốn hàng, thanh phân trang ba hàng, thẻ kết thúc ở 773 trên 844; thanh nhóm trống một hàng với icon cạnh chữ.
  - `GroupPanelEmpty` so A/B với quy tắc trước G1F1: 0 pixel khác (Chromium, sáng); ở 240px gợi ý xuống hai hàng cạnh icon, icon ở giữa.
- Visual không chạy: 16 ảnh mới đến từ CI. Fixture không chạy: không fixture nào đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  scripts/check-dist-css.ts \
  src/components/data-grid/DataGrid.mdx \
  src/components/data-grid/DataGridGrouping.stories.tsx \
  src/docs/DataGridExample.mdx \
  src/docs/DataGridExample.stories.tsx \
  src/docs/data-grid-example/OrdersGrid.tsx \
  src/docs/data-grid-example/columns.tsx \
  src/docs/data-grid-example/orders.ts \
  src/styles/components/data-grid.css
```
```bash
git commit -m "docs: the Examples/Data grid page, the orders of Lumen in a DataGrid" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 6: data grid trong Getting started và Accessibility

Spec §8 (Getting started, Accessibility, Theming), §9 mục 1 (lớp 6), §3.1, §3.9. Không có mockup. Bắt đầu từ commit của Task 5.
- **Getting started, "Data grid"** (sau "Show data", trước "App shell"): vì sao một client component bọc grid; một trang Server Component đưa dòng thuần cho `orders-grid.tsx`; cột là hằng của module; `rowKey`, `columns` ổn định, cùng `locale` ở server và trình duyệt, `width`; "Rows from a server" với mẫu `RemoteOrders` (phát hiện 12).
- **Accessibility, "The data grid"** (trước "Other preferences"): role và tên, tiêu đề, một điểm Tab và các phím, chế độ widget, mọi câu của vùng live với khoá `labels` của nó, trình sửa, đường phím của mỗi kiểu kéo, chạm, forced colours, rồi danh sách kiểm tra của trình đọc màn hình (lớp 6), mỗi mục "not checked yet".
- Người viết sửa brief theo code: `treegrid` chỉ khi có nhóm; "Selection" của vùng live chỉ là một khoảng, chọn hết và `mod+A`; phím viết bằng chữ thường như các mục khác của trang (phát hiện 5).
- `Theming.mdx` đọc, không đổi: ba token của grid đã có.
- Chỉ MDX: không code, story, ảnh chuẩn, tên công khai hay dòng spec nào đổi.

Task này chỉ có khối code (hai trang MDX): không có Step 1. Không gì fail trước được, nên không có Step 2: điều chứng minh nó là bản build docs, `check:docs-tables`, việc ba mẫu code biên dịch được, và các test có sẵn giữ từng điều trang nói (Step 4).

**Files:**
- Modify: `src/docs/GettingStarted.mdx`, `src/docs/Accessibility.mdx`

**Interfaces:**
- Không thêm gì. Liên kết các trang dùng: `?path=/docs/components-datagrid--docs` (và hai neo `#keyboard`, `#server-mode` của nó), `?path=/docs/examples-data-grid--docs`.
- Task sau dùng: Task 8 (câu giai đoạn 6 ở phần mở đầu của Getting started).

- [ ] **Step 3: Viết code**

````diff
diff --git a/src/docs/Accessibility.mdx b/src/docs/Accessibility.mdx
index 2c6e301..87b3916 100644
--- a/src/docs/Accessibility.mdx
+++ b/src/docs/Accessibility.mdx
@@ -230,6 +230,110 @@ that stack: the toasts, which sit in the page, become inert under it, so a keybo
 user cannot reach them and a pointer cannot click them. Open modals through the library's Dialog and
 Drawer, or keep toasts for moments when no other modal is open.
 
+## The data grid
+
+The [DataGrid](?path=/docs/components-datagrid--docs) follows the data grid pattern of the
+WAI-ARIA Authoring Practices. Its key table is the
+[Keyboard](?path=/docs/components-datagrid--docs#keyboard) section of its page; this is what a
+person who uses a screen reader or a keyboard should expect, and what has been checked.
+
+- **Roles and name.** The table is a `grid`, and a `treegrid` while the rows are grouped: each
+  group is a row with `aria-expanded` and `aria-level`, and the rows under it carry their level.
+  The detail of a row (`renderDetail`) is not a tree: it is a row of the grid, opened by a button
+  with `aria-expanded`, and `aria-controls` while it is open. The name of the grid is, in this
+  order, your `aria-labelledby`, its `caption`, or your `aria-label`; the `description` joins your
+  `aria-describedby`. A grid with none of the three warns in development, so give it one.
+  `aria-multiselectable` is set when many rows can be chosen, and `aria-busy` while the grid loads
+  or saves.
+- **Headings.** Every title is a `th scope="col"`, and the column with `rowHeader` is a
+  `th scope="row"`, so a screen reader that moves across a row says the title and the row's
+  heading. The title of the sorted column carries `aria-sort`; with a sort of several levels only
+  the first does, and the hidden words of each sort button say the others ("sorted descending, 2
+  of 3"). The box that chooses a row is named by the row's heading ("Select DH-1030"), or by its
+  key when no column is the heading.
+- **One Tab stop, and the keys.** The grid is one stop of Tab. Inside it the arrow keys move
+  between cells, Home and End go to the ends of the row, PageUp and PageDown go up and down by the
+  rows the frame shows, and mod+Home and mod+End go to the first and the last cell (`mod` is ⌘ on
+  an Apple system and Ctrl elsewhere). Focus never falls to the `<body>`: when the row that holds
+  it goes away it moves to a neighbour, and a cell never hides under the sticky heading. In a grid
+  that draws only the rows near the view (`scrolling="virtual"`) the table says how many rows there
+  are (`aria-rowcount`) and each row its place (`aria-rowindex`), since the rows that are not
+  drawn cannot be counted by the page.
+- **Controls inside a cell: widget mode.** A cell that holds a link, a button or a field is the
+  Tab stop, and the controls are not. Enter or F2 goes into the cell (the first control has the
+  focus), Tab and Shift+Tab go round its controls without leaving it, and Esc or F2 come back to
+  the cell. In widget mode every other key belongs to the control, so the arrows move the caret of
+  a field. The same keys reach the buttons of a title (F2 on it goes to the sort button, and Tab
+  on to the funnel and the menu), the filter row, and the content of a detail.
+- **What the live region says.** The grid has one polite live region (`aria-live="polite"`) in
+  its own root, in the page from the first render and empty, so a screen reader knows it before
+  anything is said, and a modal Dialog that holds the grid does not silence it. Every sentence is
+  a `labels` key, so it can be translated:
+  - a sort: "Sorted by Order date, descending, then Total, ascending", or "Sorting cleared"
+    (`announceSort`, `announceSortCleared`);
+  - the rows found, 500 ms after the last change of the search or of a filter: "12 rows", "1 row"
+    or "No rows" (`announceRowsFound`); in server mode it waits for the rows you load;
+  - the choice, after a range, a select all and mod+A: "5 rows selected" (`announceSelected`); a
+    plain press on a box says nothing here, since the box itself changes state;
+  - a column resized with the keys or fitted, moved, pinned, unpinned, hidden or shown
+    (`announceResized`, `announceMoved`, `announcePinned`, `announceUnpinned`, `announceHidden`,
+    `announceShown`);
+  - the grouping: grouped by, ungrouped, a level moved (`announceGrouped`, `announceUngrouped`,
+    `announceGroupMoved`);
+  - a row moved, "DH-1024 moved to row 3 of 12" (`announceRowMoved`), and the reason a row cannot
+    be moved while the grid sorts or groups (`reorderDisabled`);
+  - editing: "Changes saved", "Row added", "Row deleted", "Row marked for deletion" in batch mode,
+    and "2 fields need attention" when a save finds fields that fail (`announceSaved`,
+    `announceRowAdded`, `announceRowDeleted`, `announceRowMarkedDeleted`, `announceErrors`);
+  - loading: "Loading…" (`loading`), only when the wait has lasted a second.
+
+  A save that is refused is not in this list: its alert (`role="alert"`) is its own announcement,
+  and it has a button that dismisses it. Only what the person does is announced: a sort, a filter
+  or a choice that your own code sets from outside says nothing.
+
+- **Editors.** The editor of a cell is named by the title of its column, and the editors of the
+  form and the popup by their visible labels. A field that is refused has `aria-invalid` and is
+  described by the message, which is hidden text in its cell; the same words open in a tooltip for
+  the eye. A save that finds fields that fail puts the focus on the first of them. A custom
+  `editor` is given `invalid` and `errorId` to do the same.
+- **Every drag has a path for the keyboard and the menus.** Nothing the grid does by dragging is
+  only a drag (WCAG 2.5.7): a column is resized with Alt+Shift+Left and
+  Alt+Shift+Right and moved with mod+Shift+Left and mod+Shift+Right, and the menu of its title
+  (Alt+Down, Shift+F10 or the ContextMenu key) sorts, pins, moves, fits, hides and groups by it; a
+  level of the grouping moves with the same keys as a column, on its chip; a row moves with
+  mod+Shift+Up and mod+Shift+Down, or from the menu that Enter or Space opens on its handle.
+- **Touch.** A finger on a title scrolls the frame instead of dragging the column, so a column is
+  moved and grouped from its menu, whose button is always shown on a touch screen (it appears on
+  hover with a mouse). The handle that resizes a column, the handle of a row and the chips of the
+  group panel take a finger (`touch-action: none`), and the handle is 24px wide.
+- **Forced colours.** With `forced-colors: active` the grid is drawn with system colours: the
+  pinned cells are `Canvas` with the line at their edge, the line between titles is the text
+  colour, the frame of the focused cell and the frame of a refused cell are outlines, the match of
+  a search takes the `Mark` colours, the group panel has the border and background of the system,
+  and the veil of a reload is transparent so that the spinner shows. The marks of editing
+  do not rest on colour alone: a changed cell has a dashed frame and the hidden word "changed", a
+  row marked for deletion has the hidden words "marked for deletion", and a refused field has an
+  icon at the end of its editor.
+
+Reading the grid aloud has not been tried with a screen reader yet. The checks of layer 6 of the
+phase's test plan are manual, and each is **not checked yet**:
+
+- NVDA with Chrome, NVDA with Firefox, VoiceOver on macOS and VoiceOver on iOS: the grid's name,
+  the title of the column and the heading of the row, read when the person moves across a cell;
+- the sort state, the second level included, and the choice of a row;
+- the level and the open or closed state of a group in a `treegrid`;
+- the place of a row in a virtual grid ("row 5,000 of 10,002");
+- the live sentences above: a sort, the rows found after a filter, a save;
+- the name and the error of an editor, through `aria-describedby`;
+- a popup, the popover of a filter and the menu of a column;
+- that NVDA goes into focus mode when it reaches the grid;
+- how Kbd is read ("Command plus K", "Control plus K") and that the movable Dialog reads as any
+  other dialog (see Keys and A movable Dialog above).
+
+What is known is what the tests and the stories assert: the roles, names, states and sentences
+above are set in the DOM, and axe runs after every story and fails it on a violation. How each
+reader says them is not known yet.
+
 ## Other preferences
 
 - Without `backdrop-filter` support, or with `prefers-reduced-transparency: reduce`, surfaces become
diff --git a/src/docs/GettingStarted.mdx b/src/docs/GettingStarted.mdx
index 0078f2e..30e512b 100644
--- a/src/docs/GettingStarted.mdx
+++ b/src/docs/GettingStarted.mdx
@@ -453,6 +453,147 @@ export function Checkout() {
 The [Stepper](?path=/docs/components-stepper--docs) page shows the wrong way to write it, and the
 warning it causes.
 
+## Data grid
+
+`DataGrid` is the part of the library that does handle data: it sorts, filters, groups and pages
+the rows you give it, and it can edit them. It is one component with one set of props. The
+[DataGrid](?path=/docs/components-datagrid--docs) page lists all of them, and
+[Examples/Data grid](?path=/docs/examples-data-grid--docs) has the orders of a shop in one, with
+the parts switched on.
+
+**A client component wraps it.** The grid keeps state (the sort, the filter, the page, the choice),
+and its columns hold functions (`cell`, `format`, `value`), which cannot cross from a Server
+Component to a client one. Read the data in the Server Component, which hands the grid only plain
+rows, and write the columns in a `'use client'` file. The grid still renders its toolbar, its
+heading and the rows of the first page on the server, so the page has them before any script runs.
+
+```tsx
+// app/orders/page.tsx: Server Component
+import { OrdersGrid } from './orders-grid';
+
+export default async function OrdersPage() {
+  const orders = await loadOrders();
+  return <OrdersGrid orders={orders} />;
+}
+```
+
+```tsx
+// app/orders/orders-grid.tsx
+'use client';
+
+import { DataGrid, dataGridColumn } from 'h2d-glass-ui';
+import type { DataGridColumn } from 'h2d-glass-ui';
+
+interface Order {
+  id: string;
+  customer: string;
+  date: string; // '2026-11-05'
+  qty: number;
+  price: number;
+}
+
+// A column that is computed from the row has an `id` and a `value`; `dataGridColumn` keeps the
+// type of that value for `format` and `cell`.
+const total = dataGridColumn<Order>()({
+  id: 'total',
+  caption: 'Total',
+  dataType: 'number',
+  value: (order) => order.qty * order.price,
+  format: { style: 'currency', currency: 'VND' },
+  width: 160,
+});
+
+// The columns are a constant outside the component, so every render gives the grid the same array.
+const columns: DataGridColumn<Order>[] = [
+  { field: 'id', caption: 'Order', rowHeader: true, width: 112 },
+  { field: 'customer', caption: 'Customer' },
+  { field: 'date', caption: 'Order date', dataType: 'date', width: 150 },
+  { field: 'qty', caption: 'Qty', dataType: 'number', width: 88 },
+  total,
+];
+
+export function OrdersGrid({ orders }: { orders: Order[] }) {
+  return <DataGrid data={orders} rowKey="id" columns={columns} caption="Orders" locale="vi-VN" />;
+}
+```
+
+- **`rowKey`** is what a row is known by: the name of a property of the row, or a function that
+  returns a string or a number. The chosen rows, the place of the keyboard and the saved changes
+  are all kept by it, so it must be unique, and it must not change when the row is sorted or paged:
+  an index is not a key.
+- **The columns are the same array on every render.** Write them in a constant or in `useMemo`: a
+  new array prepares them again each time, and the grid warns after three renders in a row. The
+  functions of `labels`, `rowClassName` and `summary` are the same: keep them outside the component.
+- **`locale` is the same on the server and in the browser.** The grid writes numbers and dates with
+  `Intl` for the `locale` it is given (`'en-US'` when left out; a `datetime` is shown in
+  `timeZone`, `'UTC'` when left out), so the HTML from the server and the first render in the
+  browser say the same. They differ only when
+  the two `Intl` implementations do. Run Node with full ICU (the default of current releases) and,
+  if you can, of a version close to your visitors' browsers, since some versions write another space
+  or sign in a currency; React warns in development about a text that differs at hydration.
+- **Give the columns a `width`.** The grid measures its frame once it is in the browser. Columns
+  with no `width` share the room that is left, and until the measure the stylesheet shares it out,
+  so they can move a little when the page hydrates. A column with a `width` is the same size before
+  and after.
+
+**Rows from a server.** For a list that is too long to send whole, set `remote`: the grid sorts,
+filters and pages nothing, and `data` is the page you loaded. The bar shows `totalCount` rows, and a
+press on a title, a change of the filter or a press on a page calls `onSortChange`,
+`onFilterChange` or `onPageChange` for you to load again; `loading` draws the wait.
+
+```tsx
+'use client';
+
+import { useEffect, useState } from 'react';
+import { DataGrid } from 'h2d-glass-ui';
+import type { DataGridFilter, DataGridPage, DataGridSortItem } from 'h2d-glass-ui';
+
+export function RemoteOrders() {
+  const [sort, setSort] = useState<readonly DataGridSortItem[]>([]);
+  const [filter, setFilter] = useState<DataGridFilter>({});
+  const [page, setPage] = useState<DataGridPage>({ index: 0, size: 20 });
+  const [found, setFound] = useState<{ rows: Order[]; total: number }>();
+  const [loading, setLoading] = useState(true);
+
+  useEffect(() => {
+    let current = true;
+    setLoading(true);
+    loadOrders({ sort, filter, page }).then((answer) => {
+      // An answer that comes after a newer request is dropped.
+      if (!current) return;
+      setFound(answer);
+      setLoading(false);
+    });
+    return () => {
+      current = false;
+    };
+  }, [sort, filter, page]);
+
+  return (
+    <DataGrid
+      data={found?.rows ?? []}
+      rowKey="id"
+      columns={columns}
+      caption="Orders"
+      remote
+      totalCount={found?.total ?? 0}
+      loading={loading}
+      sort={sort}
+      onSortChange={setSort}
+      filter={filter}
+      onFilterChange={setFilter}
+      page={page}
+      onPageChange={setPage}
+    />
+  );
+}
+```
+
+In server mode the order of `data` is the server's: the grid cannot tell whether it matches the
+heading. It does not group, and its CSV holds the rows of the current page. The
+[Server mode](?path=/docs/components-datagrid--docs#server-mode) section of the DataGrid page has
+the rest.
+
 ## App shell
 
 `AppShell` is the frame of an application: a header, a sidebar with a navigation, the main content
````

- [ ] **Step 4: Chạy kiểm tra**

Ba mẫu code của Getting started (trang `app/orders/page.tsx`, `orders-grid.tsx`, `RemoteOrders`) phải biên dịch: chép từng mẫu vào một file `.tsx` trong một thư mục tạm dưới `src/docs/`, đổi `'h2d-glass-ui'` thành `'../../index'`, khai báo `Order` và `loadOrders`, chạy `npx tsc --noEmit -p .`, rồi xoá thư mục tạm (không commit). Sau đó:

```bash
pnpm gen:theme
pnpm lint && pnpm format:check && npx tsc --noEmit -p .
pnpm build-storybook && pnpm check:docs-tables
pnpm vitest run --project storybook-light --browser=chromium src/docs
pnpm vitest run --project unit --maxWorkers=3 src/components/data-grid/DataGrid.test.tsx src/components/data-grid/DataGrid.grouping.test.tsx src/components/data-grid/DataGrid.keyboard.test.tsx src/components/data-grid/DataGrid.selection.test.tsx src/components/data-grid/DataGrid.filter.test.tsx src/components/data-grid/DataGrid.resize.test.tsx src/components/data-grid/DataGrid.reorder.test.tsx src/components/data-grid/DataGrid.row-reorder.test.tsx src/components/data-grid/DataGrid.loading.test.tsx src/components/data-grid/DataGrid.editing.test.tsx src/components/data-grid/DataGrid.cell-edit.test.tsx src/styles/forced-colors.test.ts
```

Expected:
- `tsc` của thư mục tạm: sạch. `lint`, `format:check`, `tsc -p .` (sau khi xoá thư mục tạm): PASS.
- `pnpm build-storybook`: PASS. `pnpm check:docs-tables`: `no table built as text in 228 files`.
- Story `src/docs`, Chromium sáng: 6 file, 32 PASS (chỉ MDX đổi; `ExceptionTable` vẫn 43 dòng). Ở bản nháp người viết chạy đúng lượt này.
- Các test có sẵn giữ điều trang nói, tất cả PASS (không đổi ở task này; ở bản nháp chúng pass trong mọi lượt `check-p6g.sh`, lần cuối trên `835e140`):
  - Role, tên, tiêu đề, HTML của server: `DataGrid.test.tsx` "roles and name", `draws the column title in a th with scope col, and the row header as a th with scope row`, `has the live region of the grid last in the root, empty`, "the server and the client" (`renders every row, the name and the roles on the server`).
  - `treegrid` chỉ khi có nhóm: `DataGrid.grouping.test.tsx` `is a treegrid while the rows are grouped, and a grid otherwise, keeping the focus across`.
  - Một điểm Tab, chế độ widget, hydrate im lặng: `DataGrid.keyboard.test.tsx` "the one Tab stop", `is the same on the server and in the browser, so a hydration says nothing`.
  - Câu của vùng live: `DataGrid.selection.test.tsx` `says nothing for a plain choice by Space`; `DataGrid.filter.test.tsx` "the rows found"; `DataGrid.resize.test.tsx` `says the new width once, 500 ms after the last press`, `says the width in the words of labels.columnWidth`; `DataGrid.reorder.test.tsx` `says where the column went: its place among the shown columns`; `DataGrid.row-reorder.test.tsx`; `DataGrid.loading.test.tsx` `says the label once, when loading starts`, `says nothing for a load of half a second, and says it once for one of 1.2 s`.
  - Trình sửa (tên là caption, lỗi qua `aria-describedby`): `DataGrid.editing.test.tsx`, `DataGrid.cell-edit.test.tsx`.
  - Forced colours: `src/styles/forced-colors.test.ts` "the audit of forced-color-adjust: none".
- Claude thử lại hai khoảng chờ của thông báo trên bản nháp: loading 1000 ms, rows found 500 ms, đúng như trang nói.
- Unit của cả project, `check:package`, fixture, visual không chạy: chỉ MDX đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  src/docs/Accessibility.mdx \
  src/docs/GettingStarted.mdx
```
```bash
git commit -m "docs: the data grid in Getting started and Accessibility" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 7: trang DataGrid trong mỗi fixture, và kiểm tra tree-shaking

Spec §7 "Fixtures" (kịch bản và mệnh đề tree-shaking), §3.1, §3.9. Không có mockup. Bắt đầu từ commit của Task 6.
- **Next.js:** route `/grid`: Server Component `app/grid/page.tsx` đưa 30 đơn thuần cho Client Component `app/grid/orders-grid.tsx` (`vi-VN`, VND, ngày; OQ 15). **Vite:** entry thứ ba `grid.html` (`src/grid-main.tsx`, `src/GridPage.tsx`).
- **Kịch bản** (`scripts/test-fixtures.mjs`): `checkGridHtml` (HTML của server, chỉ Next.js), `checkGrid` (console sạch, sắp xếp, lọc, nhóm, sửa ở chế độ `row`, tải CSV), `checkTreeShaking` (đối chứng dương trên trang grid, rồi trang chính không mang `flg-data-grid-frame`; OQ 14), `waitUntil` (phát hiện 13).
- Next.js đo được: không cần `optimizePackageImports`. Bốn nhãn chú thích "Plan G:" của script được Task 8 đổi thành "Phase 6:".
- Spec §7 "Fixtures" được sửa (phát hiện 21). Không code thư viện, không story.

Task này không có khối test riêng: kiểm tra là các hàm mới của `scripts/test-fixtures.mjs`, nằm trong khối code ở Step 3 cùng hai trang mà chúng kiểm. Không có Step 1.

**Files:**
- Create: `fixtures/next-app/app/grid/orders.ts`, `fixtures/next-app/app/grid/page.tsx`, `fixtures/next-app/app/grid/orders-grid.tsx`; `fixtures/vite-app/grid.html`, `fixtures/vite-app/src/grid-main.tsx`, `fixtures/vite-app/src/GridPage.tsx`
- Modify: `fixtures/vite-app/vite.config.ts`; `scripts/test-fixtures.mjs`; `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`

**Interfaces:**
- Fixture: Next.js `/grid`, Vite `/grid.html` (`grid:` là entry thứ ba của `vite.config.ts`). Grid của cả hai: `rowKey="id"`, `caption="Orders"`, `filterRow`, `headerFilter`, `groupPanel`, `defaultSort={[{ field: 'id', direction: 'asc' }]}` (để HTML của server có `aria-sort`), `defaultGrouping={[{ field: 'status', direction: 'asc' }]}` (`DataGridGroupItem` bắt buộc `direction`), `summary`, `editing={{ mode: 'row' }}` với `onSaving`, `csvExport={{ fileName: 'orders.csv' }}`, `locale="vi-VN"`, `data-hydrated` trên một wrapper.
- `scripts/test-fixtures.mjs`: `gridPath` cho mỗi app; `checkGridHtml(origin, path)`, `checkGrid(browser, url)`, `checkTreeShaking(browser, origin, app)`, `waitUntil`; nhãn lỗi `… grid:` và `… tree-shaking:`; dấu `flg-data-grid-frame`; lời của đối chứng dương "the check is broken: the scripts of ${app.gridPath} lack ${marker}".
- Consumes: Task 4 (export từ gốc gói), Task 2 (CSV), Plan F (chế độ `row`, `onSaving`).
- Task sau dùng: Task 8 (changeset và README nói grid ở ngoài một app không import nó; lượt fixture cuối).

- [ ] **Step 2: Chạy kịch bản mới trên cây của Task 6, xác nhận fail**

Lưu khối patch của Step 3 vào `../task.patch`, áp riêng phần kịch bản (hai trang grid chưa có), build, chạy bản sao đổi cổng, rồi trả file về:

```bash
pnpm gen:theme
git apply --include='scripts/test-fixtures.mjs' ../task.patch
pnpm build
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
sed -e 's/5173/5179/g' -e 's/4173/4179/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
git checkout -- scripts/test-fixtures.mjs
```

Cổng như Step 4 của Task 4. Chạy `rm` và `git checkout` kể cả khi lệnh `node` fail.

Expected: FAIL, ở mỗi kiểm tra mới, kể cả đối chứng dương:
- vite: `vite (production) grid: locator.waitFor: Timeout 15000ms exceeded.` (server trả trang chính cho `/grid.html`, nên `treegrid` không bao giờ hiện); `vite (production) tree-shaking: the check is broken: the scripts of /grid.html lack flg-data-grid-frame`.
- next: `next (production) grid: the server HTML has no role="treegrid"` (trang trả 404; rồi "lacks DH-1003", "no group row", console 404, `locator.waitFor: Timeout 60000ms exceeded.`); `next (production) tree-shaking: the check is broken: the scripts of /grid lack flg-data-grid-frame`.
- Server dev của cả hai app fail y vậy ở các kiểm tra grid.
- Theo báo cáo của bản nháp: đúng như trên (bản sao chạy trên `1ccd11d` với script mới, các trang grid dời đi).

- [ ] **Step 3: Viết code**

```diff
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index 36812fb..edab82c 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -1220,7 +1220,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 - **Fixtures** (Plan G), mỗi app một trang riêng cho grid (Next.js: route `/grid`; Vite: entry thứ ba `grid.html`), để trang hiện có không đổi:
   - `next-app`: `app/grid/page.tsx` là Server Component, đọc một mảng đơn hàng mẫu và truyền xuống client component `orders-grid.tsx` (cột, `rowKey`, hàng lọc, lọc ở header, thanh nhóm với nhóm mặc định, tổng, chế độ sửa `row` với `onSaving` cập nhật state, xuất CSV).
   - `vite-app`: cùng bộ trong client.
-  - Kịch bản: HTML từ server có `role="treegrid"`, `aria-sort`, tên từ caption, các dòng của trang đầu và hàng nhóm; hydrate không có cảnh báo; bấm tiêu đề thì sắp xếp; gõ vào hàng lọc thì số đếm đổi; nhóm qua menu cột; sửa một ô rồi lưu thì `data` đổi; `exportCsv()` bắt đầu bằng BOM và hàng tiêu đề; **tree-shaking:** bundle JS của trang chính (không import `DataGrid`) không chứa chuỗi riêng của DataGrid (lời `devWarn` "<DataGrid> needs a name"). Console sạch, như các giai đoạn trước. Chạy theo hướng dẫn cổng của dự án (bản sao đổi cổng của `test:fixtures`).
+  - Kịch bản: HTML từ server có `role="treegrid"`, `aria-sort`, tên từ caption, các dòng của trang đầu và hàng nhóm; hydrate không có cảnh báo; bấm tiêu đề thì sắp xếp; gõ vào hàng lọc thì số đếm đổi; nhóm qua menu cột; sửa một ô rồi lưu thì `data` đổi; `exportCsv()` bắt đầu bằng BOM và hàng tiêu đề; **tree-shaking:** các tệp `.js` mà trang chính (không import `DataGrid`) tải ở bản production không chứa chuỗi `flg-data-grid-frame` (tên class của khung grid, viết nguyên văn trong `DataGrid.tsx`); cùng phép tìm đó phải thấy chuỗi trong các tệp `.js` của trang grid, nếu không thì phép kiểm bị hỏng và báo lỗi (phát hiện khi lập Plan G: lời `devWarn` của DataGrid dựng từ mẫu chuỗi nên không bundle nào chứa nguyên văn; Next.js đo được trang `/` không mang chuỗi này nên không cần `optimizePackageImports`). Console sạch, như các giai đoạn trước. Chạy theo hướng dẫn cổng của dự án (bản sao đổi cổng của `test:fixtures`).
 
 ---
 
diff --git a/fixtures/next-app/app/grid/orders-grid.tsx b/fixtures/next-app/app/grid/orders-grid.tsx
new file mode 100644
index 0000000..e292a2f
--- /dev/null
+++ b/fixtures/next-app/app/grid/orders-grid.tsx
@@ -0,0 +1,96 @@
+'use client';
+
+import { Badge, DataGrid } from 'h2d-glass-ui';
+import type { DataGridColumn, DataGridSummary } from 'h2d-glass-ui';
+import { useEffect, useState } from 'react';
+import type { Order } from './orders';
+
+const STATUS_ITEMS = [
+  { value: 'new', text: 'New', variant: 'accent' },
+  { value: 'processing', text: 'Processing', variant: 'warning' },
+  { value: 'delivered', text: 'Delivered', variant: 'success' },
+  { value: 'cancelled', text: 'Cancelled', variant: 'danger' },
+] as const;
+
+const COLUMNS: DataGridColumn<Order>[] = [
+  { field: 'id', caption: 'Order', rowHeader: true, width: 110, allowEditing: false },
+  {
+    field: 'customer',
+    caption: 'Customer',
+    width: 200,
+    validationRules: [{ type: 'required' }],
+  },
+  { field: 'date', caption: 'Order date', dataType: 'date', width: 140 },
+  {
+    field: 'status',
+    caption: 'Status',
+    width: 140,
+    lookup: { items: STATUS_ITEMS, valueField: 'value', displayField: 'text' },
+    cell: ({ value, text }) => (
+      <Badge variant={STATUS_ITEMS.find((item) => item.value === value)?.variant}>{text}</Badge>
+    ),
+  },
+  {
+    field: 'channel',
+    caption: 'Channel',
+    width: 120,
+    lookup: {
+      items: ['Store', 'Website', 'Phone'].map((value) => ({ value, text: value })),
+      valueField: 'value',
+      displayField: 'text',
+    },
+  },
+  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80, allowEditing: false },
+  {
+    field: 'total',
+    caption: 'Total',
+    dataType: 'number',
+    format: { style: 'currency', currency: 'VND' },
+    width: 140,
+    allowEditing: false,
+  },
+];
+
+const SUMMARY: DataGridSummary<Order> = {
+  total: [
+    { column: 'id', type: 'count', label: 'Orders' },
+    { column: 'total', type: 'sum' },
+  ],
+  group: [{ column: 'total', type: 'sum' }],
+};
+
+// `data-hydrated` tells the check that React has attached its event handlers.
+export function OrdersGrid({ orders }: { orders: Order[] }) {
+  const [hydrated, setHydrated] = useState(false);
+  const [data, setData] = useState(orders);
+  useEffect(() => setHydrated(true), []);
+  return (
+    <section data-hydrated={hydrated ? '' : undefined}>
+      <DataGrid
+        data={data}
+        rowKey="id"
+        columns={COLUMNS}
+        caption="Orders"
+        locale="vi-VN"
+        height={520}
+        paging={{ pageSize: 10 }}
+        filterRow
+        headerFilter
+        groupPanel
+        defaultSort={[{ field: 'id', direction: 'asc' }]}
+        defaultGrouping={[{ field: 'status', direction: 'asc' }]}
+        summary={SUMMARY}
+        editing={{ mode: 'row' }}
+        csvExport={{ fileName: 'orders.csv' }}
+        onSaving={(changes) =>
+          setData((current) =>
+            current.map((order) => {
+              const change = changes.find((one) => one.type === 'update' && one.key === order.id);
+              return change && change.type === 'update' ? { ...order, ...change.data } : order;
+            }),
+          )
+        }
+      />
+    </section>
+  );
+}
diff --git a/fixtures/next-app/app/grid/orders.ts b/fixtures/next-app/app/grid/orders.ts
new file mode 100644
index 0000000..7c1eb53
--- /dev/null
+++ b/fixtures/next-app/app/grid/orders.ts
@@ -0,0 +1,35 @@
+// Plain data: the Server Component hands it to the client grid, so nothing in it is a function.
+export interface Order {
+  id: string;
+  customer: string;
+  /** The ISO day of the order. */
+  date: string;
+  status: 'new' | 'processing' | 'delivered' | 'cancelled';
+  channel: 'Store' | 'Website' | 'Phone';
+  qty: number;
+  total: number;
+}
+
+const CUSTOMERS = [
+  'Tạp hóa Hoa Mai',
+  'Nhà hàng Sen Vàng',
+  'Công ty An Phát',
+  'Studio Ánh Dương',
+  'Đỗ Khánh Linh',
+  'Công ty Thịnh Vượng',
+  'Hoàng Đức Long',
+  'Cà phê Sương Sớm',
+];
+const STATUSES = ['delivered', 'processing', 'new', 'delivered', 'cancelled'] as const;
+const CHANNELS = ['Store', 'Website', 'Phone'] as const;
+
+/** Thirty orders, DH-1001 to DH-1030, over the first ten days of November 2026. */
+export const orders: Order[] = Array.from({ length: 30 }, (_, index) => ({
+  id: `DH-${1001 + index}`,
+  customer: CUSTOMERS[index % CUSTOMERS.length]!,
+  date: `2026-11-${String(1 + Math.floor(index / 3)).padStart(2, '0')}`,
+  status: STATUSES[index % STATUSES.length]!,
+  channel: CHANNELS[(index + 1) % CHANNELS.length]!,
+  qty: 1 + ((index * 7) % 12),
+  total: (1 + ((index * 5) % 9)) * 185000,
+}));
diff --git a/fixtures/next-app/app/grid/page.tsx b/fixtures/next-app/app/grid/page.tsx
new file mode 100644
index 0000000..732f77a
--- /dev/null
+++ b/fixtures/next-app/app/grid/page.tsx
@@ -0,0 +1,12 @@
+// A Server Component: it imports the orders and hands them to the grid, which is a Client Component.
+// The grid's HTML is rendered here, on the server, with the first page of the first group in it.
+import { OrdersGrid } from './orders-grid';
+import { orders } from './orders';
+
+export default function GridPage() {
+  return (
+    <main style={{ margin: '32px auto', maxWidth: 1100, padding: '0 16px' }}>
+      <OrdersGrid orders={orders} />
+    </main>
+  );
+}
diff --git a/fixtures/vite-app/grid.html b/fixtures/vite-app/grid.html
new file mode 100644
index 0000000..299e11d
--- /dev/null
+++ b/fixtures/vite-app/grid.html
@@ -0,0 +1,12 @@
+<!doctype html>
+<html lang="en">
+  <head>
+    <meta charset="UTF-8" />
+    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <title>h2d-glass-ui Vite fixture: data grid</title>
+  </head>
+  <body>
+    <div id="root"></div>
+    <script type="module" src="/src/grid-main.tsx"></script>
+  </body>
+</html>
diff --git a/fixtures/vite-app/src/GridPage.tsx b/fixtures/vite-app/src/GridPage.tsx
new file mode 100644
index 0000000..40d3675
--- /dev/null
+++ b/fixtures/vite-app/src/GridPage.tsx
@@ -0,0 +1,133 @@
+// The data grid on the client with React 18.3: the same grid as the Next.js fixture's /grid page,
+// with its orders built here since this app has no server to hand them over.
+import { Badge, DataGrid } from 'h2d-glass-ui';
+import type { DataGridColumn, DataGridSummary } from 'h2d-glass-ui';
+import { useEffect, useState } from 'react';
+
+interface Order {
+  id: string;
+  customer: string;
+  /** The ISO day of the order. */
+  date: string;
+  status: 'new' | 'processing' | 'delivered' | 'cancelled';
+  channel: 'Store' | 'Website' | 'Phone';
+  qty: number;
+  total: number;
+}
+
+const CUSTOMERS = [
+  'Tạp hóa Hoa Mai',
+  'Nhà hàng Sen Vàng',
+  'Công ty An Phát',
+  'Studio Ánh Dương',
+  'Đỗ Khánh Linh',
+  'Công ty Thịnh Vượng',
+  'Hoàng Đức Long',
+  'Cà phê Sương Sớm',
+];
+const STATUSES = ['delivered', 'processing', 'new', 'delivered', 'cancelled'] as const;
+const CHANNELS = ['Store', 'Website', 'Phone'] as const;
+
+/** Thirty orders, DH-1001 to DH-1030, over the first ten days of November 2026. */
+const orders: Order[] = Array.from({ length: 30 }, (_, index) => ({
+  id: `DH-${1001 + index}`,
+  customer: CUSTOMERS[index % CUSTOMERS.length]!,
+  date: `2026-11-${String(1 + Math.floor(index / 3)).padStart(2, '0')}`,
+  status: STATUSES[index % STATUSES.length]!,
+  channel: CHANNELS[(index + 1) % CHANNELS.length]!,
+  qty: 1 + ((index * 7) % 12),
+  total: (1 + ((index * 5) % 9)) * 185000,
+}));
+
+const STATUS_ITEMS = [
+  { value: 'new', text: 'New', variant: 'accent' },
+  { value: 'processing', text: 'Processing', variant: 'warning' },
+  { value: 'delivered', text: 'Delivered', variant: 'success' },
+  { value: 'cancelled', text: 'Cancelled', variant: 'danger' },
+] as const;
+
+const COLUMNS: DataGridColumn<Order>[] = [
+  { field: 'id', caption: 'Order', rowHeader: true, width: 110, allowEditing: false },
+  {
+    field: 'customer',
+    caption: 'Customer',
+    width: 200,
+    validationRules: [{ type: 'required' }],
+  },
+  { field: 'date', caption: 'Order date', dataType: 'date', width: 140 },
+  {
+    field: 'status',
+    caption: 'Status',
+    width: 140,
+    lookup: { items: STATUS_ITEMS, valueField: 'value', displayField: 'text' },
+    cell: ({ value, text }) => (
+      <Badge variant={STATUS_ITEMS.find((item) => item.value === value)?.variant}>{text}</Badge>
+    ),
+  },
+  {
+    field: 'channel',
+    caption: 'Channel',
+    width: 120,
+    lookup: {
+      items: ['Store', 'Website', 'Phone'].map((value) => ({ value, text: value })),
+      valueField: 'value',
+      displayField: 'text',
+    },
+  },
+  { field: 'qty', caption: 'Qty', dataType: 'number', width: 80, allowEditing: false },
+  {
+    field: 'total',
+    caption: 'Total',
+    dataType: 'number',
+    format: { style: 'currency', currency: 'VND' },
+    width: 140,
+    allowEditing: false,
+  },
+];
+
+const SUMMARY: DataGridSummary<Order> = {
+  total: [
+    { column: 'id', type: 'count', label: 'Orders' },
+    { column: 'total', type: 'sum' },
+  ],
+  group: [{ column: 'total', type: 'sum' }],
+};
+
+// `data-hydrated` tells the check that React has attached its event handlers.
+export function GridPage() {
+  const [hydrated, setHydrated] = useState(false);
+  const [data, setData] = useState(orders);
+  useEffect(() => setHydrated(true), []);
+  return (
+    <main
+      style={{ margin: '32px auto', maxWidth: 1100, padding: '0 16px' }}
+      data-hydrated={hydrated ? '' : undefined}
+    >
+      <DataGrid
+        data={data}
+        rowKey="id"
+        columns={COLUMNS}
+        caption="Orders"
+        locale="vi-VN"
+        height={520}
+        paging={{ pageSize: 10 }}
+        filterRow
+        headerFilter
+        groupPanel
+        defaultSort={[{ field: 'id', direction: 'asc' }]}
+        defaultGrouping={[{ field: 'status', direction: 'asc' }]}
+        summary={SUMMARY}
+        editing={{ mode: 'row' }}
+        csvExport={{ fileName: 'orders.csv' }}
+        onSaving={(changes) =>
+          setData((current) =>
+            current.map((order) => {
+              const change = changes.find((one) => one.type === 'update' && one.key === order.id);
+              return change && change.type === 'update' ? { ...order, ...change.data } : order;
+            }),
+          )
+        }
+      />
+    </main>
+  );
+}
diff --git a/fixtures/vite-app/src/grid-main.tsx b/fixtures/vite-app/src/grid-main.tsx
new file mode 100644
index 0000000..a6356c5
--- /dev/null
+++ b/fixtures/vite-app/src/grid-main.tsx
@@ -0,0 +1,10 @@
+import 'h2d-glass-ui/styles.css';
+import { StrictMode } from 'react';
+import { createRoot } from 'react-dom/client';
+import { GridPage } from './GridPage';
+
+createRoot(document.getElementById('root') as HTMLElement).render(
+  <StrictMode>
+    <GridPage />
+  </StrictMode>,
+);
diff --git a/fixtures/vite-app/vite.config.ts b/fixtures/vite-app/vite.config.ts
index 05c9851..b83815d 100644
--- a/fixtures/vite-app/vite.config.ts
+++ b/fixtures/vite-app/vite.config.ts
@@ -2,8 +2,9 @@ import { resolve } from 'node:path';
 import react from '@vitejs/plugin-react';
 import { defineConfig } from 'vite';
 
-// Two entries: the page of the components, and `shell.html`, the frame of an application with the
-// theme script in its HTML. The first does not change when the second does.
+// Three entries: the page of the components, `shell.html`, the frame of an application with the
+// theme script in its HTML, and `grid.html`, a data grid alone. The first does not change when the
+// others do.
 export default defineConfig({
   plugins: [react()],
   build: {
@@ -11,6 +12,7 @@ export default defineConfig({
       input: {
         main: resolve(import.meta.dirname, 'index.html'),
         shell: resolve(import.meta.dirname, 'shell.html'),
+        grid: resolve(import.meta.dirname, 'grid.html'),
       },
     },
   },
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index d006d3e..b97ec9f 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -20,6 +20,8 @@ const APPS = {
     // The frame of an application is a second entry. Its links are hashes, so the hash chooses
     // the active item.
     shellPath: '/shell.html#/projects/mobile',
+    // The data grid alone, as a third entry.
+    gridPath: '/grid.html',
     // Vite listens on one address of the host it is given. Inside the Playwright container CI uses,
     // `localhost` also names ::1, and Vite listened there while the check below never reached it,
     // so the host is an address. Next.js listens on every interface, so `localhost` is fine there.
@@ -45,6 +47,8 @@ const APPS = {
     serverRendered: true,
     // The route of the frame; it reads the active item from the path.
     shellPath: '/shell/projects/mobile',
+    // The route of the data grid: a Server Component that hands plain data to a Client Component.
+    gridPath: '/grid',
     servers: [
       {
         mode: 'production',
@@ -569,6 +573,165 @@ async function checkShellHtml(origin, path) {
   return problems;
 }
 
+/**
+ * Plan G: what the server sends for the data grid, before any script has run: the grid is a
+ * treegrid (the page groups its rows), named by the caption, sorted, with the first order of the
+ * first group and a group row in it.
+ */
+async function checkGridHtml(origin, path) {
+  const problems = [];
+  const html = await (await fetch(origin + path)).text();
+  const grid = startTag(html, /\srole="treegrid"/);
+  if (!grid) problems.push('the server HTML has no role="treegrid"');
+  const labelledBy = grid?.match(/aria-labelledby="([^"]+)"/)?.[1];
+  if (!labelledBy) problems.push('the grid has no aria-labelledby');
+  else if (!new RegExp(`\\sid="${labelledBy}"[^>]*>Orders<`).test(html)) {
+    problems.push('the grid is not named by the caption, "Orders"');
+  }
+  if (!/\saria-sort="/.test(html)) problems.push('the server HTML has no aria-sort');
+  if (!html.includes('DH-1003')) {
+    problems.push('the server HTML lacks DH-1003, the first order of the first page');
+  }
+  if (!/class="[^"]*flg-data-grid-group-row/.test(html)) {
+    problems.push('the server HTML has no group row');
+  }
+  return problems;
+}
+
+/** Waits for `predicate` in the page, and says what it waited for when the time runs out. */
+const waitUntil = (page, what, predicate, arg) =>
+  page
+    .waitForFunction(predicate, arg, { timeout: 15_000 })
+    .catch(() => Promise.reject(new Error(`timed out waiting for ${what}`)));
+
+/**
+ * Plan G: the data grid in a real browser. It sorts, filters, groups, edits a row and exports the
+ * rows, and the console says nothing from the load to the end (the hydration warnings included).
+ */
+async function checkGrid(browser, url) {
+  const problems = [];
+  const page = await browser.newPage();
+  listenForProblems(page, problems);
+  const note = (error) => problems.push(error instanceof Error ? error.message : String(error));
+  try {
+    await page.goto(url);
+    await page.locator('[data-hydrated]').waitFor({ timeout: 60_000 });
+    await page.waitForLoadState('networkidle');
+    const grid = page.getByRole('treegrid', { name: 'Orders' });
+    await grid.waitFor({ timeout: 15_000 });
+
+    // A press on a heading sorts the column.
+    const date = grid.getByRole('columnheader', { name: /^Order date/ });
+    if ((await date.getAttribute('aria-sort')) !== null) problems.push('Order date starts sorted');
+    await date.getByText('Order date', { exact: true }).click();
+    await waitUntil(page, 'aria-sort on Order date', () =>
+      [...document.querySelectorAll('th[aria-sort]')].some(
+        (head) => head.textContent === 'Order date',
+      ),
+    ).catch(note);
+
+    // Typing in the filter cell of Customer narrows the rows: the pager says how many are left.
+    const pageInfo = () => page.locator('.flg-data-grid-page-info').textContent();
+    const before = await pageInfo();
+    const customer = page.getByRole('textbox', { name: 'Filter Customer' });
+    await customer.fill('Hoa Mai');
+    await waitUntil(
+      page,
+      'the pager to change after the Customer filter',
+      (was) => document.querySelector('.flg-data-grid-page-info')?.textContent !== was,
+      before,
+    ).catch(note);
+    await customer.fill('');
+    await waitUntil(
+      page,
+      'the pager to come back after the Customer filter is cleared',
+      (was) => document.querySelector('.flg-data-grid-page-info')?.textContent === was,
+      before,
+    ).catch(note);
+
+    // The menu of a column groups by it: a chip for it joins the one of Status.
+    await grid.getByRole('columnheader', { name: /^Channel/ }).hover();
+    await page.getByRole('button', { name: 'Channel column menu' }).click();
+    await page.getByRole('menuitem', { name: 'Group by this column' }).click();
+    await page
+      .getByRole('button', { name: 'Ungroup Channel' })
+      .waitFor({ timeout: 15_000 })
+      .catch(() => problems.push('"Group by this column" did not add a chip for Channel'));
+
+    // Row mode: Edit, a new customer, ✓, and the row shows it.
+    const edit = grid.getByRole('button', { name: /^Edit DH-/ }).first();
+    const order = ((await edit.getAttribute('aria-label')) ?? '').slice('Edit '.length);
+    await grid.getByRole('row').filter({ hasText: order }).first().hover();
+    await edit.click();
+    await grid.locator('[aria-label="Customer"]').fill('Khách Mới');
+    await page.getByRole('button', { name: `Save ${order}` }).click();
+    await waitUntil(
+      page,
+      'the saved customer to show in its row',
+      (id) =>
+        [...document.querySelectorAll('tr')].some(
+          (row) => row.textContent?.includes(id) && row.textContent.includes('Khách Mới'),
+        ),
+      order,
+    ).catch(note);
+
+    // The export button downloads the shown columns, in the file `csvExport` names.
+    const download = page.waitForEvent('download', { timeout: 15_000 });
+    await page.getByRole('button', { name: 'Export CSV' }).click();
+    const file = await download.catch(() => undefined);
+    if (!file) problems.push('the export button gave no download');
+    else {
+      if (file.suggestedFilename() !== 'orders.csv') {
+        problems.push(`the download is named ${file.suggestedFilename()}, expected orders.csv`);
+      }
+      const chunks = [];
+      for await (const chunk of await file.createReadStream()) chunks.push(chunk);
+      const text = Buffer.concat(chunks).toString('utf8');
+      const heading = '﻿Order,Customer,Order date,Status,Channel,Qty,Total\r\n';
+      if (!text.startsWith(heading)) {
+        problems.push(`the CSV starts with ${JSON.stringify(text.slice(0, 80))}`);
+      }
+      if (!text.includes('Khách Mới')) problems.push('the CSV lacks the customer that was saved');
+    }
+  } catch (error) {
+    note(error instanceof Error ? error.message.split('\n')[0] : error);
+  }
+  await page.close();
+  return problems;
+}
+
+/**
+ * Plan G: a page that does not draw the grid does not carry it. The scripts a production page loads
+ * are searched for `flg-data-grid-frame`, a class name the grid writes literally and no `devWarn` or
+ * label builds from a template (spec §7). The grid page has it, or the check is broken and says so.
+ */
+async function checkTreeShaking(browser, origin, app) {
+  const marker = 'flg-data-grid-frame';
+  const scriptsOf = async (path) => {
+    const page = await browser.newPage();
+    const bodies = [];
+    page.on('response', (response) => {
+      if ((response.headers()['content-type'] ?? '').includes('javascript')) {
+        bodies.push(response.text().catch(() => ''));
+      }
+    });
+    try {
+      await page.goto(origin + path);
+      await page.waitForLoadState('networkidle');
+      return (await Promise.all(bodies)).join('\n');
+    } finally {
+      await page.close();
+    }
+  };
+  if (!(await scriptsOf(app.gridPath)).includes(marker)) {
+    return [`the check is broken: the scripts of ${app.gridPath} lack ${marker}`];
+  }
+  if ((await scriptsOf('/')).includes(marker)) {
+    return [`the scripts of the main page carry the data grid (${marker})`];
+  }
+  return [];
+}
+
 /** Phase 5: the frame of an application in a real browser, at 1280px and at 390px. */
 async function checkShell(browser, url) {
   const problems = [];
@@ -793,6 +956,17 @@ async function testApp(name, browser) {
         ...(await checkShell(browser, origin + app.shellPath)),
       ];
       for (const problem of shell) problems.push(`${label} shell: ${problem}`);
+      // Plan G: the data grid, in the server's HTML, in the browser, and out of the main page.
+      const gridProblems = [
+        ...(app.serverRendered ? await checkGridHtml(origin, app.gridPath) : []),
+        ...(await checkGrid(browser, origin + app.gridPath)),
+      ];
+      for (const problem of gridProblems) problems.push(`${label} grid: ${problem}`);
+      if (server.mode === 'production') {
+        for (const problem of await checkTreeShaking(browser, origin, app)) {
+          problems.push(`${label} tree-shaking: ${problem}`);
+        }
+      }
     } catch (error) {
       // Keep the server's own output: it usually explains why it never got ready.
       const tail = running.output().split('\n').slice(-30).join('\n');
```

- [ ] **Step 4: Chạy kiểm tra**

Run:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check && npx tsc --noEmit -p .
pnpm build && pnpm check:package
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
sed -e 's/5173/5179/g' -e 's/4173/4179/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
```

Expected:
- `lint`, `typecheck`, `format:check`, `tsc -p .`: PASS.
- `pnpm build && pnpm check:package`: PASS với ngưỡng của Task 4; số đo không đổi (không nguồn thư viện nào đổi).
- Fixture: `Fixtures OK: vite, next.` Ở bản nháp cả lượt 57 giây (khoảng 5 giây cài đặt, cache npm ấm): vite 27, next 33; job fixtures 30 phút của CI dư rất nhiều, nên `ci.yml` không đổi. Hai lệnh `netstat` không in dòng nào.
- Next.js không cấu hình gì: `/` không mang `flg-data-grid-frame`, `/grid` mang nó. Vite: trang chính không mang, trang grid mang (chunk `grid-*.js` riêng). Hàng tiêu đề của CSV là `Order,Customer,Order date,Status,Channel,Qty,Total`: cột Status đang nhóm ở chỗ của nó (OQ 7).
- Fixture chỉ chạy Chromium: lần tải thật trong WebKit không chạy (để lại cho review cuối).
- Unit, story không chạy: không test, story hay nguồn thư viện nào đổi.

- [ ] **Step 5: Commit**

```bash
git add \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  fixtures/next-app/app/grid/orders-grid.tsx \
  fixtures/next-app/app/grid/orders.ts \
  fixtures/next-app/app/grid/page.tsx \
  fixtures/vite-app/grid.html \
  fixtures/vite-app/src/GridPage.tsx \
  fixtures/vite-app/src/grid-main.tsx \
  fixtures/vite-app/vite.config.ts \
  scripts/test-fixtures.mjs
```
```bash
git commit -m "test(fixtures): a DataGrid page in each app, and the tree-shaking check" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

---

### Task 8: changeset `0.5.0`, ngưỡng kích thước, README; kiểm tra cuối của nhánh

Spec §2 dòng G, §7 (danh sách ảnh chuẩn Plan G), §8 (`size-limit`, "Phát hành"), §9 (mục 1, lớp 6). Không có mockup. Task này kết thúc bằng kiểm tra cuối của cả nhánh. Bắt đầu từ commit của Task 7.
- **Changeset** `.changeset/phase-6-data-grid.md`, `'h2d-glass-ui': minor`: Kbd, `MenuShortcut` `keys`, `DialogContent` `movable` (token `--flg-dialog-lift-shadow`) và `fullScreenOnPhone`, DataGrid với `dataGridColumn` và ba token; "DataGrid is a client component. It stays out of an app that does not import it."; "There are no breaking changes." Bốn token mới kể từ `0.4.0`, không phải ba (phát hiện 14).
- **README** (OQ 17): 40 → 48 component, câu kích thước viết lại, DataGrid và Kbd trong "Data display", dòng "Application frame", liên kết tới ví dụ; `description` của `package.json`: 48. `package.json` giữ `"version": "0.4.0"`: `changeset version` của PR "Version Packages" nâng nó.
- **Getting started:** phần mở đầu thêm một câu cho giai đoạn 6.
- **Hai chú thích cũ:** bốn nhãn "Plan G:" của `scripts/test-fixtures.mjs` thành "Phase 6:"; "the real ones are built by later plans" của `.storybook/app-shell-demo.tsx`.
- **Ngưỡng kích thước** ghi lần cuối, sau mọi task (phát hiện 17). Spec §2, §7, §8, §9 được sửa (phát hiện 21).

Task này chỉ có khối code (file phát hành, docs và chú thích): không có Step 1. Không gì fail trước được, nên không có Step 2: kiểm tra là `pnpm changeset status`, `pnpm size` và `pnpm check:package` với ngưỡng mới, và lượt fixture cuối (Step 3, Step 4).

**Files:**
- Create: `.changeset/phase-6-data-grid.md`
- Modify: `README.md`; `package.json`; `src/docs/GettingStarted.mdx`; `scripts/test-fixtures.mjs`; `.storybook/app-shell-demo.tsx`; `docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md`; `.size-limit.json` (do `size:record` ghi)

**Interfaces:**
- Changeset `minor` duy nhất của giai đoạn 6: merge PR mở PR "Version Packages" cho `0.5.0` (Global Constraints).
- `.size-limit.json`: ngưỡng cuối của ba mục.
- Không tên công khai nào thêm, đổi hay bỏ.
- Consumes: mọi task của G; Plan A–F (Kbd, `MenuShortcut keys`, `DialogContent movable`, `fullScreenOnPhone`, các token).
- Plan sau dùng: mọi plan sau chạy lại `size:record` khi thêm CSS hay JS; việc để lại ở phát hiện 24.

- [ ] **Step 3: Viết code**

```diff
diff --git a/.changeset/phase-6-data-grid.md b/.changeset/phase-6-data-grid.md
new file mode 100644
index 0000000..7c94c3b
--- /dev/null
+++ b/.changeset/phase-6-data-grid.md
@@ -0,0 +1,25 @@
+---
+'h2d-glass-ui': minor
+---
+
+Phase 6 of the roadmap: a data grid, and the small parts it needed.
+
+- Kbd: a key or a combination of keys, written for the platform (`keys="mod+k"` is ⌘K on a Mac and
+  Ctrl K elsewhere), in text, in tooltips and in menus.
+- MenuShortcut takes `keys`, so a menu item's shortcut is written for the platform as Kbd is.
+- DialogContent gets `movable` (the user drags the dialog by its header, on screens 640px and wider)
+  and `fullScreenOnPhone` (below 640px the dialog fills the screen). `movable` adds one theme token,
+  `--flg-dialog-lift-shadow`.
+- DataGrid, with `dataGridColumn` and its types: a grid for data you own. Typed columns, sorting,
+  paging, virtual scrolling and a server mode, where you sort, filter and page yourself. Columns
+  resize, reorder, pin and hide through a chooser. There are four ways to filter (a search box, a
+  filter row, a menu on each header and a filter panel), grouping with totals, master-detail rows
+  and row reordering. Five edit modes (cell, row, form, popup and batch) check what is typed with
+  rules, send each change to your code and report what failed. The data goes out as a CSV file, and
+  the saved-state recipe in the DataGrid page keeps the sort, filter, layout and groups across
+  visits. It adds three theme tokens: `--flg-data-grid-pin-bg`, `--flg-data-grid-pin-shadow` and
+  `--flg-column-resize-line`.
+
+DataGrid is a client component. It stays out of an app that does not import it.
+
+There are no breaking changes.
diff --git a/.storybook/app-shell-demo.tsx b/.storybook/app-shell-demo.tsx
index feef303..143d9e2 100644
--- a/.storybook/app-shell-demo.tsx
+++ b/.storybook/app-shell-demo.tsx
@@ -1,7 +1,8 @@
 // The application of the AppShell stories: "Lumen", as the mockup draws it (phase-5-shell). Nothing here
 // is a component of the library: the mockup's navigation and header widgets are neutral placeholders
-// ("only to illustrate"), and the real ones are built by later plans. The stories are about the frame,
-// so the placeholders are drawn by the CSS in this file, the way the mockup page draws them.
+// ("only to illustrate"), and the real ones are the Nav, the SearchField and the other widgets of the
+// library. The stories are about the frame, so the placeholders are drawn by the CSS in this file, the
+// way the mockup page draws them.
 import type { ReactNode } from 'react';
 import {
   AppShell,
diff --git a/README.md b/README.md
index d9a28d6..d29fbd7 100644
--- a/README.md
+++ b/README.md
@@ -4,7 +4,7 @@
 [![CI](https://github.com/hunghdvn/h2d-glass-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/hunghdvn/h2d-glass-ui/actions/workflows/ci.yml)
 [![License: MIT](https://img.shields.io/npm/l/h2d-glass-ui)](LICENSE)
 
-Glassmorphism UI components for React 18.3+ and 19: 40 accessible components with light and dark
+Glassmorphism UI components for React 18.3+ and 19: 48 accessible components with light and dark
 themes, in plain CSS with no runtime styling, ready for React Server Components.
 
 <p align="center">
@@ -43,8 +43,9 @@ themes, in plain CSS with no runtime styling, ready for React Server Components.
 - **Accessible.** Keyboard and screen-reader behaviour target WCAG 2.2 AA (see
   [Accessibility](#accessibility)).
 - **Small.** Two runtime dependencies (`@floating-ui/dom` and `clsx`). Every export together is about
-  47 kB of JavaScript and 13 kB of CSS, minified and compressed with Brotli, and the JavaScript
-  tree-shakes to what you import. Size limits are checked in CI.
+  120 kB of JavaScript (98 kB of it the data grid) and 21 kB of CSS, minified and compressed with
+  Brotli, and the JavaScript tree-shakes to what you import: an app that does not import the data
+  grid does not load it. Size limits are checked in CI.
 
 ## Install
 
@@ -97,12 +98,14 @@ With next-themes, pass `attribute="data-flg-theme"` to its `ThemeProvider`.
 - **Forms:** [Field], [Input], [Textarea], [Checkbox], [RadioGroup], [Switch], [Select], [Combobox], [TagInput], [Slider], [NumberInput], [SegmentedControl], [FileUpload], [Calendar], [DatePicker]
 - **Overlays:** [Dialog], [Drawer], [Popover], [Tooltip], [DropdownMenu], [ContextMenu], [Toast]
 - **Navigation:** [Tabs], [Accordion], [Breadcrumb], [Pagination], [Stepper]
-- **Data display:** [Table], [List], [Badge], [Avatar]
+- **Data display:** [Table], [DataGrid], [List], [Badge], [Avatar], [Kbd]
 - **Feedback:** [Alert], [Progress], [Skeleton], [Spinner]
+- **Application frame:** [AppShell], [Nav], [Indicator], [SearchField], [ThemeSwitch], [UserMenu]
 
 The docs also have worked examples: a [sign-up form](https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/examples-sign-up-form--docs),
-[loading states](https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/examples-loading-states--docs) and
-[showing data](https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/examples-show-data--docs).
+[loading states](https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/examples-loading-states--docs),
+[showing data](https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/examples-show-data--docs) and a
+[data grid](https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/examples-data-grid--docs).
 
 ## Theming
 
@@ -188,7 +191,15 @@ If h2d-glass-ui saves you time, you can support its development through
 [List]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-list--docs
 [Badge]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-badge--docs
 [Avatar]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-avatar--docs
+[DataGrid]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-datagrid--docs
+[Kbd]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-kbd--docs
 [Alert]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-alert--docs
 [Progress]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-progress--docs
 [Skeleton]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-skeleton--docs
 [Spinner]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-spinner--docs
+[AppShell]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-appshell--docs
+[Nav]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-nav--docs
+[Indicator]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-indicator--docs
+[SearchField]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-searchfield--docs
+[ThemeSwitch]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-themeswitch--docs
+[UserMenu]: https://hunghdvn.github.io/h2d-glass-ui/?path=/docs/components-usermenu--docs
diff --git a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
index edab82c..5bfe1e0 100644
--- a/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
+++ b/docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md
@@ -63,7 +63,7 @@ Các ràng buộc của giai đoạn 1–5 giữ nguyên, spec này không nhắ
 | **D** | **Lọc**: engine lọc, `text-fold.ts`; hàng lọc với toán tử, lọc ở header (giá trị khác nhau), ô tìm kiếm có tô sáng, thanh bộ lọc, trống do lọc; lọc ở chế độ server | C |
 | **E** | **Nhóm và tổng**: engine nhóm và tổng, `treegrid`, thanh nhóm (kéo tiêu đề vào, chip), hàng nhóm nhiều cấp, tổng theo nhóm, tổng cuối bảng dính dưới (`totalSummary` ở chế độ server); **master-detail**; **kéo đổi thứ tự dòng** | D |
 | **F** | **Sửa dữ liệu**: năm chế độ, thêm/sửa/xoá, trình sửa theo kiểu và lookup, kiểm tra dữ liệu, `onSaving`, dấu của batch và thanh lưu (E2), form và popup (EF1); **`DialogContent fullScreenOnPhone`** | E |
-| **G** | Xuất CSV; công thức lưu trạng thái; export `DataGrid` từ `src/index.ts`; trang docs "Examples/Data grid"; mục "Data grid" của Getting started; dòng của trang Accessibility; fixtures; changeset `minor` → `0.5.0` | F |
+| **G** | Xuất CSV; công thức lưu trạng thái; export `DataGrid` từ `src/index.ts`; trang docs "Examples/Data grid"; mục "Data grid" của Getting started; dòng của trang Accessibility; fixtures; changeset `minor` → `0.5.0` (xong ở Plan G, phát hiện khi lập Plan G) | F |
 
 - **Các plan chạy lần lượt** A → G, như các giai đoạn trước; mỗi plan một PR theo đúng quy trình giai đoạn 5 (bản nháp trong draft worktree, Opus viết plan, chủ dự án xem plan, thực thi bằng cherry-pick, review từng task, review cả nhánh, sửa, PR, chủ dự án review, merge). B đi sau A vì DataGrid dùng phần của A (`use-pointer-drag` từ C, `GripIcon` ở E, `Kbd` trong bảng phím của docs từ B). C cần B (khung, header, bàn phím). D cần C (phễu đứng cạnh nút ⋮; story G1 đủ mặt chỉ có từ D). E cần D (menu cột có "Nhóm theo cột này" và kéo tiêu đề của C; tổng tính sau lọc). F cần E (cột thao tác, form dòng chung chỗ với dòng chi tiết). G cần tất cả.
 - **`DataGrid` chỉ được export ở plan G** (bản quyết định). Từ B tới F, code nằm trên `main` nhưng không có trong `src/index.ts`; story và test import thẳng từ `src/components/data-grid/`. Story và trang MDX của nó mang tag `unreleased`, được cấu hình ẩn khỏi sidebar của trang docs đã build (builder chọn cách cấu hình tag của Storybook 10); chúng vẫn chạy trong `test:stories` và visual. Plan G bỏ tag (đã làm ở Plan G, Task 4: `DataGrid`, `dataGridColumn` và 39 kiểu được export từ `src/index.ts`, năm file story bỏ `tags: ['unreleased']`, và khối `tags` của `.storybook/main.ts` bị xoá; id của story không đổi) (phát hiện khi lập Plan G). Nhờ vậy một bản vá `0.4.x` giữa giai đoạn không mang theo DataGrid làm dở, và trang docs công khai (deploy mỗi lần push lên `main`) không quảng cáo nó.
@@ -1204,7 +1204,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 - **Plan D** (5 × 8 = 40; Claude chốt OQ 4 (b): `GridColumns` và `GridColumnsScrolled` của C giữ nguyên, D thêm story riêng): `G1` (đủ mặt G1: ô tìm kiếm sau caption, phễu của Customer, Assignee, Order date, Status, Channel, phễu đặc của Status lọc "không có Cancelled", nút chọn cột, ⋮ của Customer được hover), `G1Scrolled` (khung 700px đã cuộn ngang, thêm phễu và phễu đặc), `GridFiltering` (F1 khung đầu: hàng lọc có giá trị, toán tử đang bật của Customer và Qty, popover lọc của Status mở, tìm "minh" tô sáng ở Customer và Assignee, thanh bộ lọc, trang "1–6 of 6"), `GridFilterEmpty` (F1 khung "Trống do lọc": không toolbar, hàng lọc "công ty" và "> 500", ô trống có vòng, thanh bộ lọc, không thanh phân trang), `FilterOperatorMenu` (ngoài mockup). Story có popup mở dành chỗ cho popup trong stage (harness chỉ chụp stage) và `play` kiểm popup kết thúc bên trong stage. Mọi story ảnh của D kiểm không tiêu đề nào bị cắt. Cột của D nằm trong file story, không động tới `SALE_COLUMNS`: G1 của D rộng hơn một chút để phễu không cắt chữ ("Order date" 150px thay 140px và "Channel" 130px thay 120px: đo thấy "Order date" thiếu 9px ở Chromium và Firefox, 7px ở WebKit, và "Channel" thiếu 8px ở cả ba; "Customer" 228px trả 20px, tổng vẫn 1292px, và `G1Scrolled` cuộn ít hơn 20px để "Assignee" trượt dưới vùng ghim đúng như mockup). Khác mockup dự kiến: không nút xuất (G) và nút thêm (F); không vạch đổi độ rộng giữa tiêu đề (C1, OQ 1 của Plan C); chữ tiếng Anh; con trỏ và thanh cuộn 4px của mockup; viền focus của ô tìm trong popover (popover chuyển focus vào đó khi mở); thứ tự toolbar của G1 (tìm, chọn cột); khoảng cách 14px giữa các khối (F1 vẽ 12px).
 - **Plan E** (khoảng 4 × 8 = 32): `GridGroups` (R1: thanh nhóm hai chip, nhóm hai cấp, tổng nhóm, DH-1024 mở chi tiết, tổng cuối bảng), `GroupPanelEmpty`, `GroupPanelDropTarget` (tiêu đề kéo trên thanh nhóm; ngoài mockup), `RowReorderDragging` (ngoài mockup: lưới G1 có cột tay nắm sau cột chọn, chưa sắp xếp, tay nắm của dòng thứ ba đang kéo tới giữa dòng thứ năm và thứ sáu: dòng thứ ba mờ 35% với tay nắm màu nhấn, chip có tên dòng, vạch 3px ngang bề rộng khung có chấm ở đầu trái dưới dòng thứ năm). Story hành vi `no-visual` của kéo dòng, ba engine: `RowReorderKeys`, `RowReorderKeysOnAMac`, `RowMenuKeys`, `RowReorderMouse` (chuột thật, vạch, chip, dấu con trỏ, tự cuộn), `RowReorderTouch` (con trỏ `touch` do trang phát, như `ChipDragTouch`; bài đơn vị làm cùng việc). Khác mockup dự kiến của `GridGroups`: không nút thêm (F) và nút xuất (G); thứ tự toolbar của G1 (tìm, chọn cột) và ô tìm 260px (R1 vẽ 250px); chỗ của ⋮, biểu tượng sắp xếp và vạch đổi độ rộng ở tiêu đề (G1 và C1); chữ tiếng Anh; tổng cuối bảng 162.010.000 ₫ (OQ 2, số của R1 không cộng đúng); độ rộng 520px của khay trống ở `GroupPanelEmpty` (OQ 6). Mọi story ảnh của E kiểm không tiêu đề nào bị cắt.
 - **Plan F** (9 × 8 = 72, phát hiện khi lập Plan F, task cuối): `EditRow` (E2 a, `viewport-1440x720`), `EditCell`, `EditCellError` (E2 b), `EditBatch` (E2 c, `viewport-1440x720`), `EditForm` (EF1 a, `viewport-1440x900`), `EditPopup` (EF1 b, `stage: 'viewport'`, 1280×720), `EditPopupPhone` (EF1 b điện thoại, `viewport-390x844`), `ConfirmDelete` (ngoài mockup: Dialog `alert` của thư viện), và `DialogFullScreenPhone` của chính Dialog (`viewport-390x844`). Khác mockup, đều dự kiến: chữ tiếng Anh; không vẽ con trỏ trong ô; dòng 45px (OQ 1; E2 vẽ dòng nghỉ 35,6px); cột thao tác 72px, ở cuối; tiêu đề cao hơn 1px (G1 quyết định tiêu đề); không có nút xuất (G); bảng ở sau popup là cả sân khấu chứ không phải thẻ 640px, và điện thoại không có khung viền và không phóng to 0,55; thanh công cụ của E2 (c) theo thứ tự G1 (nút thêm cuối, `md`). Các story hành vi (`no-visual`, ba engine) gồm `RowEditKeys`, `CellEditKeys`, `BatchKeys`, `FormKeys`, `FormScrolled`, `FormContainer`, `PopupKeys`, `PopupSelectEsc`, `PopupAddKeepsPlace`, `PopupMovable`, các story của Dialog toàn màn hình, và các story kiểm bố cục (`BatchPinnedMarks`, `VirtualCellKeys`). Review cuối Plan F thêm các story hành vi `FormDateEsc` và `PopupDateEsc` (`Esc` đầu tiên chỉ đóng lịch của trường ngày, trong form và popup), `EditedRowComesBack` (dòng đang sửa quay lại cùng bản nháp sau khi đổi trang, không giành lại focus) và `ModeChangeKeepsFocus` (tắt `editing` hay đổi chế độ không đưa focus về `<body>`), cùng `DialogFullScreenPhoneKeepsNestedCards` của Dialog (một Card có footer trong nội dung của Dialog toàn màn hình giữ bố cục của nó) (phát hiện khi review cuối Plan F).
-- **Plan G** (2 × 8 = 16): `DataGridExample` (1280×720), `DataGridExamplePhone` (390×844).
+- **Plan G** (2 × 8 = 16 mới, và 8 đổi một lần): `DataGridExample` (1280×720), `DataGridExamplePhone` (390×844); 8 ảnh của `G1` (`DataGridFiltering.stories.tsx`) đổi một lần vì thanh công cụ của nó nay có nút xuất CSV (Claude chốt OQ 12 (a); `git rm` rồi `visual-update.yml`), không có ảnh chuẩn nào khác của A–F đổi (phát hiện khi lập Plan G).
 - Ảnh chuẩn mới: khoảng 340 ảnh qua bảy plan (§10). Story của DataGrid ở B–F mang tag `unreleased` (§2).
 
 **Harness visual** (`tests/visual/stories.visual.ts`, Plan A):
@@ -1234,7 +1234,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 - **Getting started**, mục mới **"Data grid"** (G): client component bọc grid, mảng cột, `rowKey`, dữ liệu từ Server Component, `locale` cho HTML từ server và client giống nhau (và cùng bản ICU, §10), chế độ server tóm tắt.
 - **Accessibility:** bảng §4.9 tự dựng từ `scripts/contrast-exceptions.ts`, nên có các dòng 37–43 và nhãn mới của các dòng được mở rộng (§4.4); plan nào thêm dòng thì sửa cả bảng §4.9 và đoạn sau nó trong spec 0+1. Ghi chú: mẫu grid và treegrid, một điểm Tab, chế độ widget, vùng live, Kbd đọc tên ký hiệu, Dialog kéo được không có phím và vì sao.
 - **Theming:** ba token mới; `--flg-data-grid-pin-bg` theo `--flg-glass-tint-solid`.
-- **`size-limit`:** từ plan B thêm mục "JS (DataGrid)": `dist/components/data-grid/DataGrid.js`, `import: "{ DataGrid }"` (đo được khi chưa export từ `src/index.ts`, nhờ entry thứ hai của tsdown, §2; phát hiện khi lập Plan B); mục "JS (all exports)" và "CSS (styles.css)" ghi lại ở mỗi plan. Plan C ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 30,51 kB lên 44,75 kB (ngưỡng 49222 B, hơn dự kiến ở §2 vì menu cột, `Popover`, `Tooltip`, `Checkbox` và popover chọn cột vào cùng entry với grid), "CSS (styles.css)" từ 17,28 kB lên 18,30 kB (ngưỡng 20126 B), "JS (all exports)" gần như không đổi (57,90 kB; ngưỡng 63686 B) (phát hiện khi lập Plan C). Plan D ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 45,23 kB lên 60,02 kB (+14,79 kB; ngưỡng 66027 B; hơn dự kiến 35–45 kB của §10 vì `Input`, `Select`, `DatePicker` với `Calendar`, `SearchField`, `Switch`, `Field`, các mục radio của menu, phép gập chữ và engine lọc vào cùng entry với grid), "CSS (styles.css)" từ 18,32 kB lên 18,90 kB (+0,58 kB; ngưỡng 20786 B), "JS (all exports)" 57,93 kB (+30 B; ngưỡng 63728 B) (phát hiện khi lập Plan D). Plan E ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 61,34 kB trên `main` lên 73,94 kB (+12,60 kB; 60,02 kB là số cuối của Plan D lúc lập bản nháp, và 1,32 kB giữa hai số là của PR #44, nên +13,92 kB so với 60,02 kB không phải mức tăng của Plan E; ngưỡng 81337 B; hơn dự kiến 8–12 kB của kế hoạch: engine nhóm và tổng, hàng nhóm, thanh nhóm và hai kiểu kéo, tổng, chi tiết, kéo dòng và menu dòng vào cùng entry với grid; tăng theo task: Task 1 +0,42 (ranh giới của các hook), 2 +1,83, 3 +2,36, 4 +0,41, 5 +2,11, 6 +1,96, 7 +1,04, 8 +2,47 kB), "CSS (styles.css)" từ 18,90 kB lên 19,97 kB (ngưỡng 21964 B), "JS (all exports)" 57,90 kB (ngưỡng 63693 B) (phát hiện khi lập Plan E; các số +12,60 kB và +0,42 kB sửa ở review cuối Plan E). Plan F ghi lại ngưỡng sau khi xong (phát hiện khi lập Plan F, task cuối): "JS (DataGrid)" từ 74,52 kB trên `main` lên 94,26 kB (+19,74 kB; ngưỡng 103689 B; hơn dự kiến vì mọi chế độ sửa, các trình sửa theo kiểu, kiểm tra dữ liệu, thanh lưu, form, popup, hộp xác nhận xoá và alert lỗi vào cùng entry với grid; tăng theo task: Task 1 +0,90 (ranh giới của các hook), 2 +0,71, 3 0 (Dialog nằm ngoài entry của grid), 4 +6,85, 5 +4,55, 6 +1,67, 7 +1,44, 8 +1,90, 9 +1,20, 10 +0,52 kB), "CSS (styles.css)" từ 19,99 kB lên 20,94 kB (ngưỡng 23036 B), "JS (all exports)" từ 57,90 kB lên 57,92 kB (ngưỡng 63715 B; `DialogContent fullScreenOnPhone`). Sau đợt sửa của review cuối Plan F ghi lại lần nữa (sửa ở review cuối Plan F): "JS (DataGrid)" 96,26 kB (+2,00 kB so với 94,26 kB; ngưỡng 105887 B; tăng theo phần: A +0,93, B +0,69, C +0,27, D +0,11 kB: hàng đợi ô, lưu theo lô, các phép bắt lỗi của hàm app, `taken()`, `ModeFocusProbe`, `saving` của ngữ cảnh trình sửa, nhãn `dismissError`), "CSS (styles.css)" 20,96 kB (ngưỡng 23054 B), "JS (all exports)" 58,02 kB (ngưỡng 63820 B). Plan G, Task 4 ghi lại sau khi export grid từ `src/index.ts` (phát hiện khi lập Plan G): "JS (all exports)" 119,61 kB (ngưỡng 131571 B; mục này đo `import: "*"` không tree-shake, nên nay mang cả grid; app chỉ dùng `Button` không mang grid, việc đó do kiểm tra tree-shaking của Task 7 giữ), "JS (DataGrid)" 98,18 kB (ngưỡng 107996 B), "CSS (styles.css)" 20,97 kB (ngưỡng 23064 B).
+- **`size-limit`:** từ plan B thêm mục "JS (DataGrid)": `dist/components/data-grid/DataGrid.js`, `import: "{ DataGrid }"` (đo được khi chưa export từ `src/index.ts`, nhờ entry thứ hai của tsdown, §2; phát hiện khi lập Plan B); mục "JS (all exports)" và "CSS (styles.css)" ghi lại ở mỗi plan. Plan C ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 30,51 kB lên 44,75 kB (ngưỡng 49222 B, hơn dự kiến ở §2 vì menu cột, `Popover`, `Tooltip`, `Checkbox` và popover chọn cột vào cùng entry với grid), "CSS (styles.css)" từ 17,28 kB lên 18,30 kB (ngưỡng 20126 B), "JS (all exports)" gần như không đổi (57,90 kB; ngưỡng 63686 B) (phát hiện khi lập Plan C). Plan D ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 45,23 kB lên 60,02 kB (+14,79 kB; ngưỡng 66027 B; hơn dự kiến 35–45 kB của §10 vì `Input`, `Select`, `DatePicker` với `Calendar`, `SearchField`, `Switch`, `Field`, các mục radio của menu, phép gập chữ và engine lọc vào cùng entry với grid), "CSS (styles.css)" từ 18,32 kB lên 18,90 kB (+0,58 kB; ngưỡng 20786 B), "JS (all exports)" 57,93 kB (+30 B; ngưỡng 63728 B) (phát hiện khi lập Plan D). Plan E ghi lại ngưỡng sau khi xong: "JS (DataGrid)" từ 61,34 kB trên `main` lên 73,94 kB (+12,60 kB; 60,02 kB là số cuối của Plan D lúc lập bản nháp, và 1,32 kB giữa hai số là của PR #44, nên +13,92 kB so với 60,02 kB không phải mức tăng của Plan E; ngưỡng 81337 B; hơn dự kiến 8–12 kB của kế hoạch: engine nhóm và tổng, hàng nhóm, thanh nhóm và hai kiểu kéo, tổng, chi tiết, kéo dòng và menu dòng vào cùng entry với grid; tăng theo task: Task 1 +0,42 (ranh giới của các hook), 2 +1,83, 3 +2,36, 4 +0,41, 5 +2,11, 6 +1,96, 7 +1,04, 8 +2,47 kB), "CSS (styles.css)" từ 18,90 kB lên 19,97 kB (ngưỡng 21964 B), "JS (all exports)" 57,90 kB (ngưỡng 63693 B) (phát hiện khi lập Plan E; các số +12,60 kB và +0,42 kB sửa ở review cuối Plan E). Plan F ghi lại ngưỡng sau khi xong (phát hiện khi lập Plan F, task cuối): "JS (DataGrid)" từ 74,52 kB trên `main` lên 94,26 kB (+19,74 kB; ngưỡng 103689 B; hơn dự kiến vì mọi chế độ sửa, các trình sửa theo kiểu, kiểm tra dữ liệu, thanh lưu, form, popup, hộp xác nhận xoá và alert lỗi vào cùng entry với grid; tăng theo task: Task 1 +0,90 (ranh giới của các hook), 2 +0,71, 3 0 (Dialog nằm ngoài entry của grid), 4 +6,85, 5 +4,55, 6 +1,67, 7 +1,44, 8 +1,90, 9 +1,20, 10 +0,52 kB), "CSS (styles.css)" từ 19,99 kB lên 20,94 kB (ngưỡng 23036 B), "JS (all exports)" từ 57,90 kB lên 57,92 kB (ngưỡng 63715 B; `DialogContent fullScreenOnPhone`). Sau đợt sửa của review cuối Plan F ghi lại lần nữa (sửa ở review cuối Plan F): "JS (DataGrid)" 96,26 kB (+2,00 kB so với 94,26 kB; ngưỡng 105887 B; tăng theo phần: A +0,93, B +0,69, C +0,27, D +0,11 kB: hàng đợi ô, lưu theo lô, các phép bắt lỗi của hàm app, `taken()`, `ModeFocusProbe`, `saving` của ngữ cảnh trình sửa, nhãn `dismissError`), "CSS (styles.css)" 20,96 kB (ngưỡng 23054 B), "JS (all exports)" 58,02 kB (ngưỡng 63820 B). Plan G, Task 4 ghi lại sau khi export grid từ `src/index.ts` (phát hiện khi lập Plan G): "JS (all exports)" 119,61 kB (ngưỡng 131571 B; mục này đo `import: "*"` không tree-shake, nên nay mang cả grid; app chỉ dùng `Button` không mang grid, việc đó do kiểm tra tree-shaking của Task 7 giữ), "JS (DataGrid)" 98,18 kB (ngưỡng 107996 B), "CSS (styles.css)" 20,97 kB (ngưỡng 23064 B). Plan G, Task 8 ghi lại lần cuối, sau mọi task của G (phát hiện khi lập Plan G): "JS (all exports)" 119,61 kB (ngưỡng 131571 B, không đổi), "JS (DataGrid)" 98,18 kB (ngưỡng 107996 B, không đổi), "CSS (styles.css)" 20,98 kB (ngưỡng 23079 B; từ 20,97 kB và 23064 B của Task 4, vì luật của thanh nhóm rỗng ở bề rộng hẹp).
 - **Phát hành:**
   - Một changeset `minor` cho `0.5.0` (G): `.changeset/phase-6-data-grid.md`, liệt kê `Kbd`, `MenuShortcut keys`, `DialogContent movable` và `fullScreenOnPhone`, `DataGrid` cùng `dataGridColumn` và các kiểu, ba token mới. Không có thay đổi phá vỡ.
   - **Việc của chủ dự án không đổi** (spec 0+1 §8.3): chủ dự án là người publish.
@@ -1245,7 +1245,7 @@ Các lớp 1–6 của spec 0+1 §7 và phần bổ sung của spec giai đoạn
 
 1. Kbd (cùng `MenuShortcut keys`), Dialog (`movable`, `fullScreenOnPhone`) và DataGrid qua các lớp 1–5 ở §7.
    - DataGrid được tính đủ khi mọi nhóm tính năng của bảng phạm vi (bản quyết định) qua các lớp 1–5: hiển thị theo kiểu, bàn phím, sắp xếp, chọn dòng, phân trang, cuộn ảo, chế độ server, đổi độ rộng, kéo cột, ghim, chọn cột, menu cột, bốn cách lọc, nhóm, hai loại tổng, master-detail, kéo dòng, năm chế độ sửa, kiểm tra dữ liệu, xuất CSV, lưu trạng thái.
-   - Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục.
+   - Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục. **Chưa kiểm tra** (phát hiện khi lập Plan G; không ai đã chạy NVDA hay VoiceOver trên giai đoạn 6): Kbd đọc "Command plus K" và "Control plus K"; Dialog kéo được không đổi cách đọc; grid: tên, tiêu đề cột và tiêu đề dòng khi đi qua ô, trạng thái sắp xếp kể cả cấp hai, chọn dòng, cấp và mở/đóng của treegrid, vị trí dòng khi cuộn ảo, thông báo live (sắp xếp, số dòng sau lọc, lưu), tên và lỗi của trình sửa, popup, popover lọc, menu cột, và NVDA tự vào chế độ focus khi tới grid. Mỗi mục là một việc của chủ dự án, ở NVDA (Chrome, Firefox) và VoiceOver (macOS, iOS).
 2. Toàn bộ kiểm tra bổ sung ở §7 xanh trong CI, gồm test hiệu năng của engine.
 3. Fixture Vite và fixture Next.js chạy đủ kịch bản ở §7 từ tarball, kể cả kiểm tree-shaking.
 4. Mọi cặp tương phản mới đã đạt, hoặc đã có trong §4.9 kèm số đo, và các dòng 37–43 đã được chủ dự án duyệt.
diff --git a/package.json b/package.json
index 7a3eb82..592f22f 100644
--- a/package.json
+++ b/package.json
@@ -1,7 +1,7 @@
 {
   "name": "h2d-glass-ui",
   "version": "0.4.0",
-  "description": "Glassmorphism UI components for React 18.3+ and 19: 40 accessible components with light and dark themes, plain CSS with no runtime, ready for React Server Components.",
+  "description": "Glassmorphism UI components for React 18.3+ and 19: 48 accessible components with light and dark themes, plain CSS with no runtime, ready for React Server Components.",
   "keywords": [
     "react",
     "react-components",
diff --git a/scripts/test-fixtures.mjs b/scripts/test-fixtures.mjs
index b97ec9f..5cc5fc5 100644
--- a/scripts/test-fixtures.mjs
+++ b/scripts/test-fixtures.mjs
@@ -574,7 +574,7 @@ async function checkShellHtml(origin, path) {
 }
 
 /**
- * Plan G: what the server sends for the data grid, before any script has run: the grid is a
+ * Phase 6: what the server sends for the data grid, before any script has run: the grid is a
  * treegrid (the page groups its rows), named by the caption, sorted, with the first order of the
  * first group and a group row in it.
  */
@@ -605,7 +605,7 @@ const waitUntil = (page, what, predicate, arg) =>
     .catch(() => Promise.reject(new Error(`timed out waiting for ${what}`)));
 
 /**
- * Plan G: the data grid in a real browser. It sorts, filters, groups, edits a row and exports the
+ * Phase 6: the data grid in a real browser. It sorts, filters, groups, edits a row and exports the
  * rows, and the console says nothing from the load to the end (the hydration warnings included).
  */
 async function checkGrid(browser, url) {
@@ -701,7 +701,7 @@ async function checkGrid(browser, url) {
 }
 
 /**
- * Plan G: a page that does not draw the grid does not carry it. The scripts a production page loads
+ * Phase 6: a page that does not draw the grid does not carry it. The scripts a production page loads
  * are searched for `flg-data-grid-frame`, a class name the grid writes literally and no `devWarn` or
  * label builds from a template (spec §7). The grid page has it, or the check is broken and says so.
  */
@@ -956,7 +956,7 @@ async function testApp(name, browser) {
         ...(await checkShell(browser, origin + app.shellPath)),
       ];
       for (const problem of shell) problems.push(`${label} shell: ${problem}`);
-      // Plan G: the data grid, in the server's HTML, in the browser, and out of the main page.
+      // Phase 6: the data grid, in the server's HTML, in the browser, and out of the main page.
       const gridProblems = [
         ...(app.serverRendered ? await checkGridHtml(origin, app.gridPath) : []),
         ...(await checkGrid(browser, origin + app.gridPath)),
diff --git a/src/docs/GettingStarted.mdx b/src/docs/GettingStarted.mdx
index 30e512b..ba2f6cb 100644
--- a/src/docs/GettingStarted.mdx
+++ b/src/docs/GettingStarted.mdx
@@ -51,7 +51,8 @@ DropdownMenu, ContextMenu, Select, Tabs, Accordion, Breadcrumb, Pagination and T
 the advanced inputs: Slider, NumberInput, SegmentedControl, Combobox, TagInput, FileUpload, Calendar
 and DatePicker. Phase 4 adds the display of data and of progress: Alert, Progress, Skeleton,
 Stepper, List and Table. Phase 5 adds the frame of an application: AppShell, Nav, Indicator,
-SearchField, ThemeSwitch and UserMenu.
+SearchField, ThemeSwitch and UserMenu. Phase 6 adds Kbd, for keys written for the platform, and
+DataGrid, for data you own.
 
 ## Overlays
 
```

Build, rồi ghi ngưỡng kích thước lần cuối. Plan không chép `.size-limit.json`: `size:record` tự ghi file đó.

```bash
pnpm gen:theme
pnpm build
pnpm size:record
pnpm check:package
pnpm changeset status
```

Expected:
- `size:record` ghi ngưỡng mới; ngưỡng là số đo cộng 10%. Ở bản nháp chỉ CSS đổi: 23064 → 23079 B (quy tắc thanh nhóm trống của Task 5); JS (all exports) giữ 131571 B, JS (DataGrid) giữ 107996 B, như dòng §8 của spec trong patch. `.size-limit.json` là file duy nhất lệnh đó đổi. Giữ số do `size:record` ghi; nếu nó khác số trên, nêu trong báo cáo.
- `pnpm check:package`: PASS với ngưỡng mới.
- `pnpm changeset status`: một changeset, `h2d-glass-ui` được nâng `minor`.

- [ ] **Step 4: Chạy kiểm tra**

Kiểm tra cuối của cả nhánh, như Claude chạy trên bản nháp (`check-p6g.sh`), cộng story theo từng thư mục, từng project và từng trình duyệt, và lượt fixture:

```bash
pnpm gen:theme
pnpm lint && pnpm typecheck && pnpm format:check
npx tsc --noEmit -p .
pnpm check:name
pnpm check:contrast
pnpm build && pnpm check:package
pnpm size
pnpm vitest run --project unit --maxWorkers=3
pnpm vitest run --project unit-react18 --maxWorkers=3
pnpm vitest run --project scripts --maxWorkers=3
pnpm build-storybook
pnpm check:docs-tables
for d in src/components/data-grid src/components/tooltip src/docs; do
  for b in chromium firefox webkit; do
    pnpm vitest run --project storybook-light --browser=$b $d
    pnpm vitest run --project storybook-dark --browser=$b $d
  done
done
node -e "const e=Object.values(require('./storybook-static/index.json').entries);const v=e.filter((x)=>x.type==='story'&&!(x.tags||[]).includes('no-visual'));const n=(l)=>l.length*8+2*l.filter((x)=>x.tags.includes('reduced-motion')).length;const t=(p)=>v.filter((x)=>x.id.startsWith(p));console.log(v.length);console.log(n(t('components-datagrid--')),n(t('components-datagrid-columns--')),n(t('components-datagrid-filtering--')),n(t('components-datagrid-grouping--')),n(t('components-datagrid-editing--')));console.log(n(t('examples-data-grid--')),t('examples-data-grid--').map((x)=>x.id).join(' '));console.log(e.filter((x)=>(x.tags||[]).includes('unreleased')).length,e.filter((x)=>x.id.startsWith('components-datagrid')).length)"
grep -rnE "Plan G|unreleased|not released|until release|later plans|for now" src .storybook scripts tests README.md
wc -l src/components/data-grid/DataGrid.tsx src/components/data-grid/hooks/use-editing.ts
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
sed -e 's/5173/5179/g' -e 's/4173/4179/g' scripts/test-fixtures.mjs > scripts/test-fixtures.tmp.mjs
node scripts/test-fixtures.tmp.mjs
rm scripts/test-fixtures.tmp.mjs
netstat -ano | grep LISTENING | grep -E ':(3100|3101|4179|5179) '
```

Cổng như Step 4 của Task 4. Chạy `rm` kể cả khi lệnh `node` fail.

Expected:
- `lint`, `typecheck`, `format:check`, `tsc -p .`: PASS. `pnpm check:name`: `check:name: no "fl-glass-ui" outside docs/superpowers.` `pnpm check:contrast`: `Contrast check passed.`
- `pnpm build`, `pnpm check:package`, `pnpm size`: PASS với ngưỡng của Step 3; số đo JS (all exports) 119.61 kB, JS (DataGrid) 98.18 kB, CSS 20.98 kB.
- `unit`: 238 file, 5891 PASS (1 skipped); `unit-react18`: 122 file, 4356 PASS (4 skipped); `scripts`: 7 file, 261 PASS (ở `8fb9ff8`: 5744, 4259, 261). Đây là số Claude đo trên `835e140`, cây giống đầu nhánh nháp và cây của plan sau task này.
- `pnpm build-storybook`: PASS. `pnpm check:docs-tables`: `Docs tables: no table built as text in 228 files.`
- Story, ở mỗi lượt: data-grid 141, tooltip 14, docs 32 PASS. Lượt chạy đầu có thể fail `Failed to import test file …` khi Vite tối ưu lại: chạy lại thư mục đó. Ở bản nháp người viết Task 8 chạy data-grid và docs ở Chromium sáng làm lượt cuối; các lượt sáu engine của từng thư mục ở Task 0, 4 và 5 (tooltip, data-grid, docs); Claude chạy cả bộ story trên `oracle-arm` trong image của CI (kết quả ở đầu plan).
- Lệnh `node` in `196`; rồi `58 56 40 32 64`; rồi `16 examples-data-grid--data-grid-example examples-data-grid--data-grid-example-phone`; rồi `0 146`: 196 story có ảnh (194 ở `8fb9ff8`), ảnh của Plan B (58), C (56), D (40), E (32), F (64) như trước, 16 ảnh của trang Examples, không mục nào mang `unreleased`, 146 mục DataGrid (thêm `GroupPanelHintWraps`): **16 ảnh chuẩn mới, cộng 8 ảnh của `G1` đổi một lần**, như mô tả PR phải nêu (phát hiện 22, 23).
- `grep` in đúng sáu dòng: `DataGrid.csv.test.tsx:9` và `DataGrid.renders.test.tsx:1755` (gọi tên nguồn gốc của mục spec), `DataGrid.grouping.test.tsx:643` và `src/internal/focus.test.ts:190` ("released" là thả con trỏ hay Tab), `DatePicker.test.tsx:1233` ("a later leave"), `Tooltip.test.tsx:66` ("disables for now" là chủ đề của test). Không dòng nào ở `.storybook`, `scripts`, `tests` hay `README.md`.
- `wc -l`: `DataGrid.tsx` 1275, `use-editing.ts` 1702 (không tách ở G, OQ 16).
- Fixture: `Fixtures OK: vite, next.` Hai lệnh `netstat` không in dòng nào.
- Claude đọc changeset, diff của README và `package.json`: khớp nhau và khớp code.
- Không chạy cả bộ story một lượt trên máy này; CI chạy cả bộ. Visual không chạy: ảnh chuẩn đến từ CI.

- [ ] **Step 5: Commit**

```bash
git add \
  .changeset/phase-6-data-grid.md \
  .size-limit.json \
  .storybook/app-shell-demo.tsx \
  README.md \
  docs/superpowers/specs/2026-11-13-h2d-glass-ui-phase-6-design.md \
  package.json \
  scripts/test-fixtures.mjs \
  src/docs/GettingStarted.mdx
```
```bash
git commit -m "chore(release): the 0.5.0 changeset, size limits and README for phase 6" -m "Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>"
```

## Sau khi thực thi

- Đẩy nhánh. Xoá 8 ảnh chuẩn của `G1` (`git rm 'tests/visual/__screenshots__/components-datagrid-filtering--g-1--*'`, đúng 8 file: `--dark--` và `--light--` × `contrast-more`, `forced-colors`, `normal`, `solid`; mẫu không khớp `components-datagrid-filtering--g-1-scrolled--…`), commit, đẩy, rồi chạy workflow "Update visual baselines": workflow chỉ ghi lại ảnh đang fail, nên ảnh dời phải được xoá trước. Nó vẽ lại 8 ảnh của `G1` và tạo 16 ảnh mới của hai story giao diện của trang Examples (mỗi story 4 chế độ × sáng, tối; không story nào gắn `reduced-motion`). Không ảnh nào khác của Plan A–F hay component khác đổi (phát hiện 22): nếu CI visual báo một ảnh khác đổi, dừng và báo, đó là lỗi của plan. Xem ảnh trước khi xin review:
  - `G1` (1440×720) cạnh G1 (`mk-o1`): nút xuất ngay sau nút chọn cột và trước nút thêm, IconButton `secondary` 34×34 cách 8px, icon khay có mũi tên đi vào (`DownloadIcon`); không gì xuống hàng, caption không bị bóp, ô tìm kiếm 260px như trước; mọi phần khác của ảnh y như ảnh cũ.
  - `DataGridExample` (1280×720, stage là cửa sổ) đúng (b) mà chủ dự án chọn: thẻ có SegmentedControl "Edit mode" ở trên, thanh công cụ một hàng (caption và mô tả, thanh nhóm trống với gợi ý, tìm kiếm, chọn cột, xuất, thêm), hàng lọc, bảy tiêu đề (Channel trong bộ chọn), Order ghim trái, Order date sắp giảm dần, DH-1040 ở đầu, DH-1038 và DH-1033 đã chọn, Badge của Status, Avatar của Assignee, chân "Orders: 40" và tổng Total, thanh phân trang; khung không cuộn ngang, không tiêu đề nào bị cắt.
  - `DataGridExamplePhone` (390×844) đúng (p2): lề 16px quanh thẻ, bốn tiêu đề Order, Customer, Status, Total, không cột nào ghim, khung cuộn ngang, sắp theo Order giảm dần, thanh công cụ bốn hàng (caption, thanh nhóm, tìm kiếm cùng chọn cột và xuất, thêm), thanh phân trang ba hàng, thẻ kết thúc trên đáy stage; icon của thanh nhóm trống nằm cạnh chữ, không ở một hàng riêng.
  - Khác biệt chờ sẵn (phát hiện 7, 11, 23): chữ tiếng Anh ("Export CSV", không phải "Xuất CSV" của mockup); tooltip của nút xuất không vẽ lúc nghỉ (mockup không vẽ); trang Examples không có mockup, nên nó so với lựa chọn trên trang quyết định chứ không với một mockup; trên điện thoại thứ tự là Order thay vì ngày (sắp theo cột ẩn không được áp; số đơn tăng cùng ngày nên thứ tự như nhau), thanh công cụ bốn hàng và thanh phân trang ba hàng như grid đã làm.
  - Ở `forced-colors` và `contrast-more` (trước CI không ảnh nào của nút xuất hay của trang Examples được chụp ở hai chế độ này): nút xuất là IconButton, icon và viền màu hệ thống ở forced colours, viền đậm ở contrast-more (quy tắc của IconButton, G không thêm quy tắc nào); ở trang Examples, Badge, Avatar, dòng đã chọn, cột Order ghim (nền `Canvas` và đường viền ở forced colours, nền đặc ở contrast-more), thanh nhóm trống và SegmentedControl theo quy tắc có sẵn của chúng. Nếu một ảnh ở hai chế độ này vẽ màu của theme trên nền hệ thống, dừng và báo.
- Mô tả PR nêu cho chủ dự án những gì phát hiện 23 liệt kê, các quyết định Claude tự chốt (phát hiện 2, 4, 5), các mục để lại cho review cuối (phần "Review Focus") và các mục để lại (phát hiện 24). Nó nói rõ ảnh chuẩn: 8 ảnh của `G1` đổi một lần, 16 ảnh mới, mọi ảnh khác không đổi (`GroupPanelEmpty` đo 0 pixel), với số đếm của lệnh `node` ở Step 4 của Task 8.
- Plan G có changeset `minor`, nên merge PR này mở PR "Version Packages" cho `0.5.0` (Global Constraints): PR đó nâng `package.json`, ghi `CHANGELOG.md` và xoá changeset; chỉ khi chủ dự án merge nó thì workflow Release mới publish `0.5.0` lên npm, mang cả Plan A tới Plan G. Không ai trong plan này merge PR đó, chạy `changeset version`, `changeset publish` hay `npm publish`, hay cầm token npm. Docs trên Pages deploy ở mỗi lần push lên `main`, nên trang DataGrid và trang "Examples/Data grid" công khai ngay khi PR này merge, trước khi `0.5.0` lên npm: mô tả PR nói vậy.
