# fl-glass-ui — Thiết kế giai đoạn 0 + 1

- **Ngày:** 2026-10-01
- **Trạng thái:** Chờ duyệt
- **Phạm vi spec này:** Giai đoạn 0 (nền móng) và giai đoạn 1 (control cơ bản). Các giai đoạn 2–4 có spec riêng khi tới lượt.

---

## 1. Bối cảnh và mục tiêu

`fl-glass-ui` là thư viện UI **open-source** cho **React + TypeScript**, phong cách **glassmorphism**, publish lên npm. Mục tiêu dài hạn là phủ đủ các control phổ biến (~40 component) qua 5 giai đoạn.

Vì là open-source, các yêu cầu sau là bắt buộc chứ không phải "nice to have":

- API ổn định, có versioning và changelog.
- Accessibility đạt **WCAG 2.2 AA**, vì người dùng sẽ đưa lib vào sản phẩm thật.
- Bundle nhỏ, tree-shake được, chạy được với React Server Components (Next.js App Router).
- Có docs và trang demo công khai.

### Quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Framework | React + TypeScript |
| Hành vi & accessibility | **Tự viết**, không dùng thư viện headless (React Aria, Radix, Base UI) |
| Dependency | Cho phép tiện ích nhỏ không phải UI: `clsx` (giai đoạn 1), `@floating-ui/dom` (từ giai đoạn 2) |
| Styling | CSS thuần + CSS custom properties, phát hành dưới dạng file CSS |
| Phong cách | Light = **Acrylic tăng cường (C+)**, Dark = **Neon dịu (D1)**: một design system, hai mode, chung cấu trúc và họ màu nhấn |
| Tên package | `fl-glass-ui` (đã kiểm tra trống trên npm, kể cả các biến thể bỏ dấu câu) |
| Tổ chức repo | **Một package** + Storybook làm playground và docs công khai |
| Hosting | GitHub (Actions + Pages) |
| Giấy phép | MIT |

---

## 2. Lộ trình và phạm vi

| Giai đoạn | Nội dung |
|---|---|
| **0 — Nền móng** | Token & theme, `Surface`, primitives nội bộ, hạ tầng build/test/docs/release |
| **1 — Control cơ bản** | Button, IconButton, Field, Input, Textarea, Checkbox, RadioGroup + Radio, Switch, Card (+ phần con), Badge, Avatar, Divider, Spinner |
| 2 — Overlay & điều hướng | Dialog, Drawer, Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, Toast, Breadcrumb, Pagination |
| 3 — Input nâng cao | Combobox, Slider, NumberInput, SegmentedControl, TagInput, FileUpload, Calendar, DatePicker |
| 4 — Hiển thị dữ liệu & phản hồi | Table, Alert, Progress, Skeleton, Stepper, List |

**Ngoài phạm vi spec này:** mọi component của giai đoạn 2–4; Portal, focus trap, dismiss, roving tabindex, định vị popup, scroll lock, typeahead; hệ thống i18n; prop `size` cho Checkbox/Radio/Switch; Textarea tự giãn theo nội dung; trang docs/marketing riêng ngoài Storybook; package cho framework khác React.

---

## 3. Kiến trúc và đóng gói

### 3.1 Cấu trúc repo

Root của repo chính là package `fl-glass-ui`.

```
/
├─ src/
│  ├─ styles/                 # CSS thuần, tách khỏi TS để sau này tách package dễ
│  │  ├─ index.css            # @import toàn bộ theo thứ tự layer → dist/styles.css
│  │  ├─ layers.css           # khai báo thứ tự @layer
│  │  ├─ tokens.css           # token nền (không phụ thuộc theme)
│  │  ├─ themes/
│  │  │  ├─ light.css
│  │  │  └─ dark.css
│  │  ├─ preferences.css      # fallback & media query tùy chọn người dùng
│  │  ├─ utilities.css        # .flg-visually-hidden, focus ring dùng chung
│  │  ├─ surface.css
│  │  └─ components/          # button.css, input.css, checkbox.css, ...
│  ├─ internal/               # primitives nội bộ — KHÔNG export
│  ├─ components/
│  │  └─ <name>/              # <Name>.tsx, index.ts, <Name>.stories.tsx,
│  │                          # <Name>.test.tsx, <Name>.test-d.ts (nếu có)
│  └─ index.ts                # entry công khai duy nhất
├─ scripts/                   # contrast check, use-client check, ...
├─ fixtures/
│  ├─ vite-app/               # app kiểm thử cài từ tarball
│  └─ next-app/               # Next.js App Router, cài từ tarball
├─ .storybook/
├─ .github/workflows/
└─ docs/superpowers/specs/
```

### 3.2 Build

- **JS/TS:** build bằng **tsdown** → ESM, giữ nguyên cấu trúc module (`dist/components/button/Button.js`, …) để bundler của người dùng tree-shake được, kèm `.d.ts`.
- **`"use client"`:** chỉ các file component có hook, context hoặc event handler nội bộ mới mang directive (danh sách ở §6.2). Nếu tsdown không giữ directive khi build, thêm bước post-build chèn directive vào đầu đúng các file đó. Script kiểm tra ở §7 là tiêu chí nghiệm thu, cách làm nào cũng được miễn qua script.
- **CSS:** `src/styles/index.css` được build bằng **Lightning CSS** → `dist/styles.css`: gộp `@import`, minify, tự thêm `-webkit-backdrop-filter`, target theo browserslist ở §3.4. Code TS **không** import CSS.

### 3.3 `package.json` (các trường liên quan)

```json
{
  "name": "fl-glass-ui",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": "^18.3.0 || ^19.0.0",
    "react-dom": "^18.3.0 || ^19.0.0"
  },
  "dependencies": { "clsx": "^2.1.0" },
  "license": "MIT"
}
```

Chỉ phát hành ESM. Node từ 20.19 trở lên đã `require()` được ESM, nên người dùng CommonJS trên Node hiện đại vẫn dùng được.

### 3.4 Môi trường hỗ trợ

- **React** 18.3+ và 19. Component dùng `forwardRef` để chạy trên cả hai.
- **Trình duyệt** (browserslist): `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 16.4, iOS >= 16.4`.
  Mọi tính năng CSS được dùng (`backdrop-filter`, `:has()`, `mask-composite`, `@layer`, `:focus-visible`, `color-mix()`) đều có trên tập này. Mốc Safari nâng từ 16 lên **16.4** vì `color-mix()` (dùng cho nền của màu trạng thái) chỉ có từ 16.2, và 16.4 là bản ổn định đầu tiên đủ mọi tính năng trên.
- **Dev:** Node 24 LTS, pnpm 10, TypeScript bản ổn định mới nhất với `strict: true`.

### 3.5 Quy ước CSS

- **Tiền tố:** class `flg-*`, CSS variable `--flg-*`.
- **Biến thể:** dùng data-attribute: `data-variant`, `data-size`, `data-orientation`, `data-loading`, `data-invalid`, `data-disabled`.
- **Trạng thái của input gốc:** đọc bằng pseudo-class qua `:has()` (ví dụ `.flg-checkbox:has(> input:checked)`), không đồng bộ ra data-attribute.
- **Layer:** toàn bộ CSS nằm trong `@layer flg` với các layer con theo thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS không nằm trong layer của người dùng luôn thắng, không cần `!important`.

---

## 4. Token và theme

### 4.1 Hai tầng token

- **Token nền** (`tokens.css`): giống nhau ở mọi theme.
- **Token ngữ nghĩa** (`themes/*.css`): thay đổi theo theme. Đây là bề mặt tùy biến công khai.

### 4.2 Token nền

| Nhóm | Token | Giá trị |
|---|---|---|
| Bo góc | `--flg-radius-sm` / `-md` / `-lg` / `-full` | 6px / 8px / 12px / 9999px |
| Khoảng cách | `--flg-space-1` … `-10` | thang 4px: 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40 |
| Font | `--flg-font-sans` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| Cỡ chữ | `--flg-text-xs` / `-sm` / `-md` / `-lg` / `-xl` | .75rem / .8125rem / .875rem / 1rem / 1.125rem |
| Độ đậm | `--flg-weight-regular` / `-medium` / `-semibold` | 400 / 500 / 600 |
| Chiều cao control | `--flg-control-h-sm` / `-md` / `-lg` | 28px / 34px / 40px |
| Chuyển động | `--flg-duration-fast` / `-normal`, `--flg-ease` | 120ms / 200ms, `cubic-bezier(.2, 0, 0, 1)` |
| Focus | `--flg-focus-width` / `--flg-focus-offset` | 2px / 2px |

Control dùng `--flg-radius-md`. Surface và Card dùng `--flg-radius-lg`.

### 4.3 Token ngữ nghĩa

Đây là **giá trị khởi điểm**, lấy từ mockup đã duyệt (Cặp 2). Script tương phản ở §7 là cổng nghiệm thu: nếu fail, **chỉnh giá trị token, không hạ ngưỡng**.

| Token | Light (C+) | Dark (D1) |
|---|---|---|
| `--flg-glass-tint` | `rgba(250,251,255,.70)` | `rgba(22,26,44,.62)` |
| `--flg-glass-tint-solid` (fallback) | `rgba(250,251,255,.94)` | `rgba(22,26,44,.94)` |
| `--flg-glass-blur` | `30px` | `24px` |
| `--flg-glass-saturate` | `120%` | `130%` |
| `--flg-glass-border` | `linear-gradient(135deg, rgba(68,102,242,.55), rgba(60,180,235,.35) 50%, rgba(255,255,255,.95))` | `linear-gradient(135deg, rgba(120,140,255,.45), rgba(80,200,255,.25), rgba(255,255,255,.06))` |
| `--flg-glass-noise-opacity` | `.05` | `.03` |
| `--flg-glass-shadow` | `0 2px 4px rgba(0,0,0,.04), 0 12px 34px rgba(60,95,210,.18)` | `0 12px 40px rgba(0,0,0,.45)` |
| `--flg-text` | `#1f2433` | `#e6e9f5` |
| `--flg-text-muted` | `#4a5164` | `#aab0c6` |
| `--flg-accent-start` | `#4466f2` | `#5b7cff` |
| `--flg-accent-end` | `#1676b0` | `#46b8f0` |
| `--flg-accent-gradient` | `linear-gradient(135deg, var(--flg-accent-start), var(--flg-accent-end))` | (giống light) |
| `--flg-accent-solid` (chữ, viền, outline) | `#3554d1` | `#8ea6ff` |
| `--flg-on-accent` | `#ffffff` | `#0b1020` ⚠️ |
| `--flg-glow` | `0 4px 14px rgba(68,102,242,.35)` | `0 0 12px rgba(80,150,255,.28)` |
| `--flg-focus-color` | `#3554d1` | `#8ea6ff` |
| `--flg-focus-glow` | `0 0 12px rgba(60,180,235,.28)` | `0 0 10px rgba(110,150,255,.18)` |
| `--flg-control-bg` | `rgba(255,255,255,.85)` | `rgba(255,255,255,.05)` |
| `--flg-control-bg-secondary` | `rgba(255,255,255,.70)` | `rgba(255,255,255,.06)` |
| `--flg-control-border` | `rgba(31,36,51,.48)` ⚠️ | `rgba(255,255,255,.36)` ⚠️ |
| `--flg-control-track` | `rgba(31,36,51,.12)` | `rgba(255,255,255,.10)` |
| `--flg-success` / `-warning` / `-danger` | `#1a7f4b` / `#a15c00` / `#c62f3a` | `#4cd492` / `#f2b544` / `#ff7b84` |
| `--flg-on-danger` | `#ffffff` | `#1a0b0d` |
| `--flg-status-bg-alpha` | `12%` | `16%` |

Nền của màu trạng thái được tính bằng `color-mix(in srgb, var(--flg-success) var(--flg-status-bg-alpha), transparent)`, tương tự cho các màu khác.

⚠️ **Hai chỗ lệch so với mockup, do yêu cầu accessibility:**

1. **`--flg-control-border` đậm hơn mockup** (mockup dùng `.14` / `.11`). WCAG 1.4.11 yêu cầu ranh giới của control (viền input, ô checkbox, viền radio, viền track của switch khi tắt) đạt **3:1** so với nền. Giá trị trong mockup chỉ đạt khoảng 1.3:1.
2. **`--flg-on-accent` ở dark là chữ tối** (`#0b1020`). Chữ trắng trên đầu gradient sáng `#46b8f0` chỉ đạt khoảng 2.3:1. Đổi sang chữ tối giữ nguyên gradient sáng của D1 mà vẫn đạt trên 5:1.

### 4.4 Cơ chế theme

```css
:root, [data-flg-theme="light"] { color-scheme: light; /* token light */ }
[data-flg-theme="dark"]          { color-scheme: dark;  /* token dark */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-flg-theme]) { color-scheme: dark; /* token dark */ }
}
```

- Không đặt attribute thì lib theo hệ điều hành.
- Attribute đặt được trên một phần giao diện, ví dụ một sidebar tối trong trang sáng. Token cascade xuống bình thường.
- Tên `data-flg-theme` để tránh đụng `data-theme` của app người dùng. Với next-themes: `attribute="data-flg-theme"`.
- Giai đoạn 1 không có `ThemeProvider` hay hook JS cho theme.

### 4.5 Cách dựng lớp kính (`.flg-surface`)

- **Nền:** `background-color: var(--flg-glass-tint)` cùng `backdrop-filter: blur(var(--flg-glass-blur)) saturate(var(--flg-glass-saturate))`.
- **Viền gradient:** vẽ bằng `::after` dùng `mask-composite: exclude` (viền 1px). **Không dùng** kỹ thuật `background-clip: border-box`, vì với nền bán trong suốt, gradient sẽ lộ vào lòng panel.
- **Vân nhiễu:** vẽ bằng `::before`, nền là SVG `feTurbulence` dạng data URI, `opacity: var(--flg-glass-noise-opacity)`, `pointer-events: none`, `border-radius: inherit`.
- **Bóng:** `box-shadow: var(--flg-glass-shadow)`.

**Quy tắc hiệu năng:** chỉ `Surface` và `Card` (về sau thêm overlay) được dùng `backdrop-filter`. Control đặt bên trong chỉ có nền bán trong suốt (`--flg-control-bg`), **không** tự blur.

### 4.6 Fallback và tùy chọn người dùng (`preferences.css`)

| Điều kiện | Hành vi |
|---|---|
| `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` | Nền = `--flg-glass-tint-solid`, bỏ blur |
| `@media (prefers-reduced-transparency: reduce)` | Như trên |
| `@media (prefers-contrast: more)` | Nền đặc, viền màu đặc `--flg-text`, bỏ gradient viền, bỏ glow và noise |
| `@media (forced-colors: active)` | Dùng màu hệ thống (`Canvas`, `CanvasText`, `ButtonText`, `Highlight`, `GrayText`); giữ viền 1px cho mọi control; bỏ background-image |
| `@media (prefers-reduced-motion: reduce)` | Transition về 0. Spinner **vẫn quay nhưng chậm hơn** (bỏ hẳn chuyển động thì spinner mất ý nghĩa) |

### 4.7 Focus ring

Áp dụng cho mọi control khi `:focus-visible`:

```css
outline: var(--flg-focus-width) solid var(--flg-focus-color);
outline-offset: var(--flg-focus-offset);
box-shadow: var(--flg-focus-glow);   /* chỉ để trang trí */
```

`outline` màu đặc mới là phần bảo đảm tương phản 3:1. Glow chỉ là phần trang trí thêm. `Input` và `Textarea` hiện focus ring lên phần tử bọc ngoài qua `:has(> input:focus-visible)`.

### 4.8 Nền tham chiếu cho kiểm tra tương phản

Mỗi theme có một bộ nền tham chiếu. Màu chữ được kiểm tra trên **lớp tint phủ lên từng nền**. Để chọn trường hợp xấu nhất, script bỏ qua blur và noise, coi nền như một màu đặc.

- **Light:** `#ffffff`, `#c3cfe2`, `#8a8a8a`, `#7ea6ff`, `#ff5fa2`
- **Dark:** `#000000`, `#0f1220`, `#3a3a3a`, `#4a5bdc`, `#2fa8d8`

Bộ nền này cũng được dùng trong toolbar Storybook và được ghi trong docs. Ý nghĩa của nó: lib bảo đảm tương phản trên các nền này, và đặt kính lên nền rối hơn là trách nhiệm của người dùng.

---

## 5. Primitives nội bộ (`src/internal/`)

**Nguyên tắc native-first:** ở đâu HTML có phần tử gốc, lib dùng phần tử đó và phủ giao diện kính lên. Input gốc được giữ trong DOM: vẫn nhận focus và click, được phủ trùng lên phần hình ảnh với `opacity: 0`. Nhờ vậy lib có sẵn điều hướng phím mũi tên cho radio, việc gửi form, `required`, validation gốc, và tương thích react-hook-form.

| File | Export | Nhiệm vụ |
|---|---|---|
| `field-context.tsx` | `FieldContext`, `useFieldProps(props)` | Field cung cấp `controlId`, `labelId`, `descriptionId`, `errorId`, `invalid`, `required`, `disabled`, `labelMode` (`"for"` hoặc `"group"`, xem `Field` ở §6.3). `useFieldProps` gộp các giá trị này với props của control: `id`, `aria-describedby` (description trước, error sau), `aria-invalid`, `required`, `disabled`. Prop truyền trực tiếp vào control được ưu tiên hơn giá trị từ context. |
| `slot.tsx` | `Slot` | Dùng cho `asChild`. Nhận đúng một React element con và gộp vào nó: props (props của con ưu tiên), `className` (nối bằng `clsx`), `style` (gộp, của con ưu tiên), event handler (qua `composeEventHandlers`), ref (qua `mergeRefs`). Nếu con không phải một element hợp lệ duy nhất thì in cảnh báo dev và render `null`. |
| `compose-event-handlers.ts` | `composeEventHandlers(user, internal)` | Gọi handler của người dùng trước. Nếu `event.defaultPrevented` thì không gọi handler nội bộ. |
| `merge-refs.ts` | `mergeRefs(...refs)` | Hỗ trợ callback ref và object ref. |
| `data-attr.ts` | `dataAttr(bool)` | Trả `""` khi true, `undefined` khi false. |
| `warn.ts` | `devWarn(message)` | `console.warn("[fl-glass-ui] " + message)`, chỉ chạy khi `process.env.NODE_ENV !== "production"`, mỗi thông điệp in một lần. |

**Thay đổi so với lúc trao đổi:** `useControllableState` **bị bỏ khỏi giai đoạn 1**. Theo native-first, Checkbox, Switch và Radio chỉ chuyển `checked` hoặc `defaultChecked` xuống input gốc, và CSS đọc trạng thái qua `:has()`. Không còn chỗ nào cần state nội bộ. React tự cảnh báo khi một input gốc đổi giữa controlled và uncontrolled. Hook này sẽ quay lại ở giai đoạn 2, khi có component không dựa trên input gốc (Tabs, Select…).

**Cách báo lỗi:** lib không throw khi người dùng dùng sai. Lib cảnh báo qua `devWarn`. Các cảnh báo trong giai đoạn 1:

- `IconButton` thiếu cả `aria-label` lẫn `aria-labelledby` (cho người dùng JS không có TypeScript).
- `Slot` nhận con không hợp lệ.
- `Radio` nằm ngoài `RadioGroup`.
- `RadioGroup` nằm trong `Field` nhưng không phải con trực tiếp (Field không nhận ra nó là nhóm, xem §6.3).
- `Avatar` có `src` nhưng thiếu `alt`.

---

## 6. Component giai đoạn 1

### 6.1 Quy ước API chung

- Mọi component dùng `forwardRef`. Ref trỏ tới **phần tử DOM chính**; với control dựa trên input, đó là `<input>`/`<textarea>` gốc.
- Với control dựa trên input: `className` và `style` gắn vào **phần tử bọc ngoài**; mọi prop còn lại chuyển xuống **input gốc**.
- Giữ nguyên sự kiện gốc (`onChange(e)`) và thêm phiên bản tiện dụng (`onCheckedChange(checked: boolean)`, `onValueChange(value: string)`). Khi có cả hai, cả hai đều được gọi, `onChange` trước.
- Export phẳng (`Card`, `CardHeader`, …), không dùng kiểu `Card.Header`, vì dấu chấm không chạy qua ranh giới client của RSC.
- Mọi chữ mặc định do lib cung cấp đều bằng tiếng Anh và ghi đè được qua prop.
- Mỗi component export kiểu props của nó (`ButtonProps`, …).

### 6.2 Phân loại client và server

- **Client** (`"use client"`): `Button`, `IconButton`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `Radio`, `Switch`, `Avatar`.
- **Server-safe** (không có directive): `Surface`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge`, `Divider`, `Spinner`.

### 6.3 Đặc tả từng component

**`Surface`**: `HTMLAttributes<HTMLDivElement> & { asChild?: boolean }`
Render `<div class="flg-surface">`. Class `.flg-surface` dùng được độc lập, không cần React.

**`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`**
- `Card` là `Surface` có thêm padding và bố cục cột, nhận `asChild`.
- `CardTitle` mặc định render `<h3>` và nhận `asChild` để đổi cấp heading.
- `CardDescription` là `<p>`.
- Các phần còn lại là `<div>`.

**`Button`**: `ButtonHTMLAttributes & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; loading?: boolean; asChild?: boolean }`
- Mặc định `variant="primary"`, `size="md"`, **`type="button"`**.
- `primary` dùng `--flg-accent-gradient`, `--flg-on-accent` và `--flg-glow`. `secondary` dùng `--flg-control-bg-secondary` và `--flg-control-border`. `ghost` không có nền. `danger` dùng `--flg-danger` và `--flg-on-danger`.
- **`loading`:** đặt `aria-busy="true"` và `aria-disabled="true"`, chặn `onClick`, giữ focus và giữ nguyên chiều rộng. Spinner hiện trước children với `aria-hidden`. Lib không đặt `disabled` gốc trong trường hợp này.
- **`disabled` khi không dùng `asChild`:** dùng `disabled` gốc.
- **`asChild` + `disabled` hoặc `loading`:** dùng `aria-disabled="true"`, chặn click qua `preventDefault`, và đặt `tabIndex={-1}` khi `disabled`.

**`IconButton`**: cùng props với `Button` (kể cả `loading` và `asChild`), thêm ràng buộc kiểu:

```ts
type IconButtonProps = Omit<ButtonProps, "aria-label" | "aria-labelledby"> &
  ({ "aria-label": string } | { "aria-labelledby": string });
```

Nút hình vuông, kích thước bằng `--flg-control-h-*`. Ở runtime, cảnh báo dev nếu cả hai attribute đều rỗng.

**`Field`**: `{ label?: ReactNode; description?: ReactNode; error?: ReactNode; required?: boolean; disabled?: boolean; id?: string; className?: string; children: ReactNode }`

```html
<div class="flg-field" data-invalid data-disabled>
  <label id="{labelId}" for="{controlId}">Label <span aria-hidden="true">*</span></label>
  {children}
  <p id="{descriptionId}" class="flg-field-description">…</p>
  <p id="{errorId}" class="flg-field-error">…</p>
</div>
```

- `error` có giá trị (truthy) tương đương `invalid`.
- Dấu `*` của `required` có `aria-hidden`. Thông tin "bắt buộc" đến screen reader qua `required` gốc trên control.
- `label` không bắt buộc. Khi bọc `Checkbox` hoặc `Switch`, nhãn thường là children của chính control, còn `Field` chỉ cung cấp description và error.
- `id` của Field trở thành `controlId` (không gắn lên `div`). Nếu không có, id được sinh bằng `useId`.
- **Nhãn cho nhóm control:** `<label for>` chỉ hợp lệ với phần tử nhận nhãn được (input, textarea…), không hợp lệ với `div role="radiogroup"`. Vì vậy, khi con trực tiếp của Field là `RadioGroup` (nhận ra qua một static marker trên component), Field đặt `labelMode="group"` và render nhãn dạng `<span id="{labelId}" class="flg-field-label">`. `RadioGroup` khi đó lấy tên accessible qua `aria-labelledby`. Mọi trường hợp khác dùng `labelMode="for"` với `<label for>`. Nếu `RadioGroup` thấy `labelMode="for"` (nghĩa là nó bị bọc thêm một lớp nên Field không nhận ra), nó in cảnh báo dev.

**`Input`**: `Omit<InputHTMLAttributes, "size"> & { size?: "sm" | "md" | "lg"; invalid?: boolean; startContent?: ReactNode; endContent?: ReactNode }`
- Render `<div class="flg-input" data-size data-invalid data-disabled>{startContent}<input/>{endContent}</div>`.
- Bấm vào vùng bọc ngoài (không phải input) sẽ focus input.
- Nhận giá trị từ `useFieldProps`. `invalid` truyền trực tiếp thắng giá trị từ context.

**`Textarea`**: `TextareaHTMLAttributes & { invalid?: boolean }`
Mặc định `resize: vertical`, nhận giá trị từ `useFieldProps`.

**`Checkbox`**: `Omit<InputHTMLAttributes, "type"> & { indeterminate?: boolean; onCheckedChange?: (checked: boolean) => void }`

```html
<label class="flg-checkbox">
  <input type="checkbox" class="flg-checkbox-input" />
  <span class="flg-checkbox-box" aria-hidden="true"><svg><!-- check / dash --></svg></span>
  <span class="flg-checkbox-label">{children}</span>
</label>
```

- `indeterminate` được gán vào `input.indeterminate` trong effect. CSS đọc qua `:has(> input:indeterminate)`.

**`RadioGroup`**: `{ name?: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; orientation?: "vertical" | "horizontal"; required?: boolean; disabled?: boolean; invalid?: boolean; children; className; style; ... }`
- Render `<div role="radiogroup" data-orientation aria-labelledby aria-describedby aria-invalid aria-required>`, lấy giá trị từ `useFieldProps` khi nằm trong Field. Element này nhận `id = controlId`.
- `name` tự sinh bằng `useId` nếu người dùng không truyền.
- `orientation` chỉ ảnh hưởng bố cục (`data-orientation`), không đặt `aria-orientation`.
- Truyền qua context: `name`, `value`, `defaultValue`, `onValueChange`, `required`, `disabled`. Mỗi `Radio` đặt `required` và `disabled` gốc lên input của nó, để validation gốc và việc gửi form hoạt động đúng.

**`Radio`**: `Omit<InputHTMLAttributes, "type" | "name"> & { value: string }`
- Render `<label class="flg-radio"><input type="radio"/><span class="flg-radio-dot" aria-hidden="true"/><span>{children}</span></label>`.
- **Controlled** (group có `value`): `checked = value === group.value`.
- **Uncontrolled:** `defaultChecked = value === group.defaultValue`.

**`Switch`**: `Omit<InputHTMLAttributes, "type"> & { onCheckedChange?: (checked: boolean) => void }`
Render `<label class="flg-switch"><input type="checkbox" role="switch"/><span class="flg-switch-track" aria-hidden="true"><span class="flg-switch-thumb"/></span><span>{children}</span></label>`.

**`Badge`**: `HTMLAttributes<HTMLSpanElement> & { variant?: "neutral" | "accent" | "success" | "warning" | "danger" }`
- Mặc định `neutral`.
- Nền là màu trạng thái trộn với `--flg-status-bg-alpha` (§4.3). Chữ là màu trạng thái đặc. `accent` dùng `--flg-accent-solid`. `neutral` dùng nền `--flg-control-track` và chữ `--flg-text-muted`.

**`Avatar`**: `HTMLAttributes<HTMLSpanElement> & { src?: string; alt?: string; fallback?: ReactNode; size?: "sm" | "md" | "lg" }`
- Có ba trạng thái `loading | loaded | error`.
- Ảnh bị ẩn cho tới khi `onLoad`. Trước đó, và khi `error`, hiển thị `fallback`. Nếu không có `fallback` thì hiển thị icon người mặc định.
- Khi đang hiển thị fallback, phần tử gốc mang `role="img"` và `aria-label={alt}`.

**`Divider`**: `{ orientation?: "horizontal" | "vertical"; decorative?: boolean; className; style }`
- Ngang: `<hr class="flg-divider">`.
- Dọc: `<div role="separator" aria-orientation="vertical">`.
- `decorative`: thêm `role="none"` (bản ngang) hoặc `aria-hidden="true"` (bản dọc).

**`Spinner`**: `HTMLAttributes<HTMLSpanElement> & { size?: "sm" | "md" | "lg"; label?: string }`
- Render `<span role="status" class="flg-spinner"><svg aria-hidden="true"/><span class="flg-visually-hidden">{label}</span></span>`, với `label` mặc định là `"Loading"`.
- `Button` dùng một biến thể nội bộ không có `role="status"` và có `aria-hidden`.

---

## 7. Kiểm thử

| # | Lớp | Công cụ | Nội dung | Điều kiện fail |
|---|---|---|---|---|
| 1 | Unit | Vitest + jsdom + Testing Library | Primitives (Slot gộp props/ref/handler, thứ tự handler, `useFieldProps`), aria được nối đúng, controlled/uncontrolled, cảnh báo dev | Bất kỳ test nào fail |
| 2 | Trình duyệt thật | Storybook addon Vitest + Playwright trên **Chromium, Firefox, WebKit** | Mỗi story là một test. Kiểm tra Tab order, Space/Enter, phím mũi tên trong RadioGroup, focus ring khi điều hướng bằng bàn phím, `FormData` khi submit, `Button` không submit form theo mặc định, `loading` chặn click | Bất kỳ test nào fail |
| 3 | Accessibility | axe-core qua addon a11y với `test: "error"` | Mọi story × light/dark | Bất kỳ vi phạm nào |
| 4 | Tương phản | `scripts/check-contrast.ts`: đọc `themes/*.css` bằng Lightning CSS, tính độ tương phản trên tint phủ lên nền tham chiếu ở §4.8 | Chữ (`text`, `text-muted`, màu trạng thái, chữ Badge trên nền Badge, `on-accent` trên cả hai đầu gradient, `on-danger`) ≥ 4.5:1. Viền control, focus color, accent đặc trên surface ≥ 3:1 | Bất kỳ cặp nào dưới ngưỡng |
| 5 | Visual regression | Playwright `toHaveScreenshot`, **chỉ Chromium**, Docker image Playwright cố định phiên bản, chạy trên Storybook đã build tĩnh | Mỗi story × light/dark × {bình thường, không blur, reduced-transparency, contrast-more, forced-colors} | Sai khác vượt `maxDiffPixelRatio: 0.01` |
| 6 | Screen reader (thủ công) | NVDA + Firefox/Chrome trên Windows; VoiceOver + Safari trên macOS | Checklist cho từng component trong PR template | Mục chưa làm được ghi rõ **"chưa kiểm tra"**, không đánh dấu là đạt |

- Ảnh chuẩn của lớp 5 được commit vào repo. Cập nhật bằng `pnpm test:visual:update`, chạy trong cùng Docker image.
- Lớp 5 chỉ chạy Chromium vì cách vẽ `backdrop-filter` phụ thuộc GPU và hệ điều hành. Tương tác trên Firefox và WebKit đã được lớp 2 kiểm tra.

**Kiểm tra bổ sung trong CI:**

- **Test kiểu** (`*.test-d.ts`, Vitest typecheck): `<IconButton>` thiếu tên accessible phải **không compile được**. Các union `variant` và `size` từ chối giá trị lạ.
- **Gói phát hành:** `pnpm pack`, rồi chạy `publint` và `@arethetypeswrong/cli` trên đúng tarball đó.
- **`scripts/check-use-client.ts`:** mọi file JS của component client (§6.2) bắt đầu bằng `"use client"`. Không file nào của component server có directive này.
- **`size-limit`:** ngưỡng ghi lại ở lần build xanh đầu tiên (JS toàn bộ và `styles.css`, đều đo min+gzip). CI fail khi tăng quá 10% mà ngưỡng chưa được chủ động cập nhật.
- **Fixtures:** `fixtures/vite-app` và `fixtures/next-app` cài từ tarball, build thành công, render đủ 14 mục ở §6.3 không lỗi hay cảnh báo trên console. `next-app` render các component server-safe trực tiếp trong Server Component.
- **Lint:** ESLint flat config với `eslint-plugin-jsx-a11y` và `eslint-plugin-react-hooks`, kèm Prettier và `tsc --noEmit`.

---

## 8. Docs và phát hành

### 8.1 Storybook

- Dùng framework `@storybook/react-vite`, bản ổn định mới nhất có addon Vitest và addon a11y.
- **Trang hướng dẫn:**
  - *Getting started*: cài, `import "fl-glass-ui/styles.css"`, theme.
  - *Theming*: bảng token đầy đủ, ví dụ ghi đè, `data-flg-theme`, next-themes.
  - *Accessibility*: fallback, nền tham chiếu, trách nhiệm của người dùng khi đặt kính trên nền rối.
- **Mỗi component có một trang MDX:** cách dùng, bảng props (autodocs từ type TS), ví dụ, ghi chú accessibility, mục "nên / không nên".
- **Toolbar** có ba nút chuyển: theme light/dark; nền tham chiếu (§4.8); giả lập fallback (không blur, reduced-transparency, contrast-more).
- Deploy lên **GitHub Pages** khi merge vào `main`.

### 8.2 Phiên bản

- Quản lý phiên bản và changelog bằng **Changesets**.
- Lib ở **0.x** trong suốt giai đoạn 0–4. Xong giai đoạn 1 là `0.1.0`; mỗi giai đoạn sau tăng một bản minor.
- Ở 0.x, thay đổi phá API được phép nhưng phải ghi rõ trong changelog.
- `1.0.0` do chủ dự án quyết định, sớm nhất sau giai đoạn 2.

### 8.3 CI/CD (GitHub Actions)

| Workflow | Kích hoạt | Việc |
|---|---|---|
| `ci.yml` | PR và push vào `main` | Lint, typecheck, test kiểu, các lớp 1–5 ở §7, build, kiểm tra gói, `use-client`, `size-limit`, fixtures |
| `release.yml` | push vào `main` | Changesets mở hoặc cập nhật PR "Version Packages". Khi PR đó được merge thì publish lên npm qua **trusted publishing (OIDC) có provenance**, không lưu npm token |
| `docs.yml` | push vào `main` | Build Storybook rồi deploy lên Pages |

**Chủ dự án tự làm**, AI không làm thay: tạo tài khoản npm, bật 2FA, cấu hình trusted publisher cho `fl-glass-ui`, bật GitHub Pages, và lần publish đầu tiên.

### 8.4 File chuẩn của repo

`README.md` (cài đặt, quick start, link docs), `LICENSE` (MIT), `CONTRIBUTING.md` (cài môi trường dev, các lệnh test, cập nhật ảnh chuẩn visual, checklist screen reader), `.github/pull_request_template.md`, `.gitignore` (bao gồm `.superpowers/`).

---

## 9. Tiêu chí hoàn thành giai đoạn 0 + 1

1. Cả 14 mục ở §6.3 đều qua các lớp 1–5 ở §7. Cách đếm: `Card` cùng 5 phần con tính là một mục, `RadioGroup` và `Radio` tính là một mục. Lớp 6 đã làm, hoặc được ghi rõ "chưa kiểm tra" cho từng mục.
2. Toàn bộ kiểm tra bổ sung ở §7 xanh trong CI.
3. Fixture Vite và fixture Next.js (App Router) build và render đủ 14 mục từ tarball.
4. Storybook đã deploy và truy cập được trên GitHub Pages.
5. Changeset cho `0.1.0` đã sẵn sàng. Việc publish là quyết định của chủ dự án.

---

## 10. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Giá trị token khởi điểm không qua kiểm tra tương phản trên nền tham chiếu sặc sỡ | Script là cổng nghiệm thu. Chỉnh tint hoặc màu chữ, không hạ ngưỡng. Thay đổi lớn về hình ảnh phải báo lại chủ dự án |
| tsdown không giữ `"use client"` | Bước post-build chèn directive (§3.2), có script kiểm tra |
| Visual regression chập chờn do cách vẽ `backdrop-filter` | Chỉ Chromium, Docker cố định phiên bản, ngưỡng sai khác cho phép |
| `backdrop-filter` gây giật trên máy yếu | Quy tắc "chỉ lớp bề mặt mới blur" (§4.5); docs khuyến cáo không lồng nhiều Surface |
| Chỉ phát hành ESM làm khó người dùng Jest/CJS cũ | Ghi rõ trong README. Node ≥ 20.19 `require()` được ESM. Xem xét lại nếu có issue thực tế |
| Không có máy Mac để kiểm tra VoiceOver | Ghi "chưa kiểm tra" thay vì đánh dấu đạt (§7, lớp 6) |
