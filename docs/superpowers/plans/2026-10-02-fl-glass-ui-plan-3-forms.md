# fl-glass-ui: Plan 3, Control form, fixture và chuẩn bị 0.1.0 (giai đoạn 1, phần 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn tất giai đoạn 1. Plan này thêm 6 mục control form (Field, Input, Textarea, Checkbox, RadioGroup/Radio, Switch) cùng `FieldContext`/`useFieldProps`, thêm hai fixture Vite và Next.js cài từ tarball, xử lý các mục bị hoãn từ Plan 1–2, và chuẩn bị changeset `0.1.0`.

**Architecture:**
- **Theo native-first (spec §5):** mỗi control giữ một input gốc trong DOM. Input của Checkbox, Radio và Switch được phủ trong suốt lên phần hình ảnh. CSS đọc trạng thái qua `:has()`, và không control nào giữ state nội bộ cho `checked` hay `value`.
- **`Field` cung cấp context**, còn `useFieldProps` gộp context vào props của control: `id`, `aria-describedby`, `aria-invalid`, `required`, `disabled`.
- **Nhận diện `RadioGroup`:** Field biết RadioGroup qua một static marker, nhìn xuyên được qua lazy reference mà Server Component truyền xuống.
- **Bố cục file:** mỗi component nằm trong `src/components/<tên>/`. CSS nằm ở `src/styles/components/<tên>.css`, còn quy tắc `forced-colors` thêm vào `src/styles/preferences.css`.

**Tech Stack:** Như Plan 2: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63. Hai fixture dùng Next.js 16.3.8 (React 19.3) và Vite 8.3.1 (React 18.3.1), cài bằng npm từ tarball.

**Spec:** `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`: §5 (primitives, cảnh báo dev), §6.1–6.3 (API và đặc tả component), §7 (kiểm thử, fixture), §8.2 (phiên bản), §9 (tiêu chí hoàn thành).

**Mockup chuẩn:** `docs/superpowers/specs/mockups/plan-3-forms.html`, duyệt ngày 2026-10-02, dấu `*` bắt buộc màu danger. CSS trong plan này chép nguyên bản nháp đã duyệt. Chỉ có hai bổ sung, cả hai đều vô hình:
- `z-index: 1` trên input gốc của Checkbox, Radio và Switch.
- `isolation: isolate` trên phần bọc ngoài của ba control đó.

Lý do: `.flg-radio-dot` và `.flg-switch-track` có `position: relative`, nên nếu thiếu hai bổ sung này chúng sẽ nằm đè lên input gốc. Khi đó `click()` của Playwright vào radio hay switch thất bại, dù người dùng bấm vào label thì vẫn chọn được. Ảnh chụp trước và sau khi thêm giống nhau đến từng byte (đã đo khi chạy thử).

**Đã chạy thử khi lập kế hoạch:** toàn bộ code dưới đây đã chạy trên một nhánh nháp.
- `pnpm test:unit`: 320 test PASS trên React 19 và 18.3.
- `pnpm test:stories`: 336 test PASS, gồm 56 story × 3 trình duyệt × 2 theme, kèm axe.
- `pnpm check:package` PASS.
- `node scripts/test-fixtures.mjs`: cả hai fixture PASS ở production lẫn development.

Hai phát hiện từ lần chạy thử đã được đưa vào plan:
1. **Lazy reference khi dùng Server Component.** Khi một Server Component viết `<Field><RadioGroup>`, `child.type` mà Field nhận được là một lazy reference chứ không phải chính `RadioGroup`. Nếu không nhìn xuyên qua lazy reference, fixture Next.js render `<label for>` sai và in cảnh báo oan (đã thử bằng cách tắt nhánh này).
2. **Hit-test bị che.** Như đã nêu ở phần Mockup chuẩn.

**Phạm vi:**
- **Không làm:** đo tương phản cho chế độ solid fallback; story `NestedTheme`/`SolidFallback` ở dark; link docs trong README khi chưa có Pages (chủ dự án đã bỏ qua Pages).
- **Chủ dự án tự làm**, AI không làm thay (spec §8.3):
  - publish npm và bỏ `"private": true`;
  - cấu hình trusted publisher;
  - chuyển repo sang public trước lần publish đầu (xem Task 10).

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`. Runtime dependency **chỉ có** `clsx`. Không thêm `@floating-ui/dom`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-size`, `data-orientation`, `data-invalid`, `data-disabled`, …). Trạng thái của input gốc đọc bằng `:has()`.
- Toàn bộ CSS nằm trong các layer theo đúng thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` nằm trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`.
- **Mockup lock:** không đổi giá trị token nào trong `src/styles/theme/values.ts`. Giao diện control form phải khớp `mockups/plan-3-forms.html`; CSS ở plan này là bản đã duyệt, không được "cải thiện".
- Chỉ `Surface` và `Card` được dùng `backdrop-filter`.
- `"use client"` chỉ có ở module client theo spec §6.2. Plan này thêm: `Field.tsx`, `Input.tsx`, `Textarea.tsx`, `Checkbox.tsx`, `RadioGroup.tsx`, `Radio.tsx`, `Switch.tsx`. Hai file context nội bộ (`src/internal/field-context.tsx`, `src/components/radio-group/RadioGroupContext.ts`) **không** có directive.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng.
- Control dựa trên input (spec §6.1): ref trỏ tới input gốc. `className` và `style` gắn vào phần tử bọc ngoài, mọi prop khác xuống input gốc. Riêng `Textarea` không có phần bọc nên mọi thứ gắn lên `<textarea>`.
- Khi có cả `onChange` lẫn `onCheckedChange`/`onValueChange`, cả hai đều được gọi, `onChange` trước.
- Prop truyền trực tiếp vào control thắng giá trị từ Field.
- Chữ mặc định do lib cung cấp bằng tiếng Anh. Cảnh báo dev đi qua `devWarn`, có tiền tố `[fl-glass-ui] `. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits. Thân commit kết thúc bằng một đoạn riêng `Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>`; dùng `git commit -m "<subject>" -m "Co-Authored-By: ..."`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`. Plan này thêm đúng **một** changeset (Task 10).
- Nếu `pnpm pkg set` bị sandbox chặn, sửa `package.json` trực tiếp và giữ JSON hợp lệ.
- Mỗi task thêm CSS hoặc JS: chạy `pnpm build && pnpm size:record` trước `pnpm check:package` và commit `.size-limit.json` đã cập nhật.
- Không chạy visual test để tạo ảnh chuẩn trên máy Windows. Ảnh chuẩn chỉ tạo bằng workflow "Update visual baselines".

## Review Focus

Năm tình huống người dùng dễ gặp mà spec ngụ ý nhưng không nêu thành test. Mỗi dòng có test ở task tương ứng:

1. **Server Component viết `<Field label="Plan"><RadioGroup>…`:** Field phải nhận ra RadioGroup dù `child.type` là lazy reference. HTML render từ server dùng `<span class="flg-field-label">`, nhóm được đặt tên "Plan", và không có cảnh báo. Test ở Task 2 (lazy reference giả lập) và Task 9 (fixture Next.js thật).
2. **Test E2E của người dùng bấm vào input:** gọi `page.getByRole('radio' | 'checkbox' | 'switch').click()` trong Playwright phải chạm đúng input gốc, không bị phần hình ảnh che mất. Test ở Task 5–7 (`elementFromPoint` trong story, chạy trên 3 trình duyệt) và Task 9 (click thật trong fixture).
3. **Checkbox "chọn tất cả" controlled:** sau khi người dùng bấm, `indeterminate` vẫn hiện nếu prop vẫn là `true`, và tắt khi prop về `false`. Test ở Task 5 và Task 9.
4. **Field có `required`:** tên accessible là "Email" chứ không phải "Email*", và trạng thái bắt buộc đến screen reader qua `required` gốc. Test ở Task 2 và Task 8.
5. **Gửi form chứa đủ các control:** native validation chặn submit khi còn trường bắt buộc trống. `FormData` có đúng tên và giá trị: `value` của Radio được chọn, `value` của Checkbox, `"on"` của Switch, chuỗi rỗng của Textarea. Test ở Task 8.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `tsdown.config.ts` | Lọc cảnh báo `MODULE_LEVEL_DIRECTIVE` (Task 1) |
| `src/internal/warn.ts` | `devWarn` không throw khi không có `process` (Task 1) |
| `src/components/button/Button.tsx` | `asChild` nhận phần tử void như `<input type="submit">` (Task 1) |
| `src/internal/field-context.tsx` | `FieldContext`, `useFieldContext`, `useFieldProps`, `markAsFieldGroup`, `isFieldGroup` |
| `src/components/field/Field.tsx` | Label, mô tả, lỗi; chọn `labelMode` |
| `src/components/input/Input.tsx` | Input có khung, adornment, bấm khung để focus |
| `src/components/textarea/Textarea.tsx` | Textarea |
| `src/components/checkbox/Checkbox.tsx` | Checkbox có `indeterminate` |
| `src/components/radio-group/{RadioGroupContext.ts,RadioGroup.tsx,Radio.tsx}` | Nhóm radio và từng lựa chọn |
| `src/components/switch/Switch.tsx` | Switch (`role="switch"`) |
| `src/styles/components/{field,input,textarea,checkbox,radio,switch}.css` | CSS đã duyệt, mỗi component một file |
| `src/docs/FormExample.stories.tsx` | Form hoàn chỉnh: validation và `FormData` (Task 8) |
| `fixtures/{vite-app,next-app}/` | Hai ứng dụng mẫu cài lib từ tarball (Task 9) |
| `scripts/test-fixtures.mjs` | Đóng gói, cài, build, mở fixture trong Chromium (Task 9) |
| `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Đăng ký module client và class mới |
| `src/index.ts`, `src/index.test.ts` | API công khai và test khóa danh sách export |
| `.changeset/*.md`, `package.json`, `CONTRIBUTING.md` | Chuẩn bị `0.1.0` (Task 10) |

**Quy ước story:** story của Plan 2 có 32 story. Mỗi story chạy 6 test (3 trình duyệt × 2 theme) và 8 visual test (2 theme × 4 chế độ). Sau mỗi task, phần Expected ghi tổng số đếm được.

---

### Task 1: Gia cố trước khi phát hành

**Files:**
- Modify: `tsdown.config.ts`, `src/internal/warn.ts`, `src/components/button/Button.tsx`
- Test: `src/internal/warn.test.ts`, `src/components/button/Button.test.tsx`, `src/components/icon-button/IconButton.test.tsx`, `src/components/card/Card.test.tsx`

**Interfaces:**
- Consumes: không có gì mới.
- Produces: `devWarn` không còn throw khi không có `process`. `pnpm build` không còn in cảnh báo `MODULE_LEVEL_DIRECTIVE`. `<Button asChild><input type="submit" /></Button>` render được.

- [ ] **Step 1: Viết test fail cho `devWarn`**

Thêm vào cuối `describe('devWarn', ...)` trong `src/internal/warn.test.ts`:

```ts
  it('does not throw where `process` does not exist, and keeps warning there', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('process', undefined);
    try {
      expect(() => devWarn('no bundler')).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(warn).toHaveBeenCalledWith('[fl-glass-ui] no bundler');
  });
```

- [ ] **Step 2: Viết test fail cho Button và các test còn thiếu**

Trong `src/components/button/Button.test.tsx`, thêm ba test sau, ngay trước `it('blocks a middle-click on a disabled asChild link', ...)`:

```tsx
  it('activates with Space as well as Enter', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await user.tab();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not run its own onClickCapture while loading, since the click is blocked', () => {
    const onClickCapture = vi.fn();
    const { rerender } = render(<Button onClickCapture={onClickCapture}>Save</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClickCapture).toHaveBeenCalledOnce();
    rerender(
      <Button onClickCapture={onClickCapture} loading>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClickCapture).toHaveBeenCalledOnce();
  });

  it('renders a void element through asChild, without a spinner slot', () => {
    const { rerender } = render(
      <Button asChild>
        <input type="submit" value="Send" />
      </Button>,
    );
    const input = screen.getByRole('button', { name: 'Send' });
    expect(input).toHaveClass('flg-button');
    rerender(
      <Button asChild loading>
        <input type="submit" value="Send" />
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Send' })).toBe(input);
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(input.childNodes).toHaveLength(0);
  });
```

Trong `src/components/icon-button/IconButton.test.tsx`, thêm hai test sau, ngay trước `it('does not warn when named', ...)`:

```tsx
  it('warns when its label is only whitespace', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<IconButton aria-label="  ">{icon}</IconButton>);
    expect(warn).toHaveBeenCalledWith(WARNING);
  });

  it('renders its child through asChild', () => {
    render(
      <IconButton asChild aria-label="Settings">
        <a href="/settings">{icon}</a>
      </IconButton>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).toHaveClass('flg-button');
    expect(link).toHaveAttribute('data-icon-only', '');
  });
```

Trong `src/components/card/Card.test.tsx`, thêm test sau vào cuối `describe('Card', ...)`:

```tsx
  it('forwards refs and joins class names on every part', () => {
    const header = createRef<HTMLDivElement>();
    const description = createRef<HTMLParagraphElement>();
    const content = createRef<HTMLDivElement>();
    const footer = createRef<HTMLDivElement>();
    render(
      <Card>
        <CardHeader ref={header} className="h">
          <CardDescription ref={description} className="d">
            D
          </CardDescription>
        </CardHeader>
        <CardContent ref={content} className="c">
          C
        </CardContent>
        <CardFooter ref={footer} className="f">
          F
        </CardFooter>
      </Card>,
    );
    expect(header.current).toHaveClass('flg-card-header', 'h');
    expect(description.current).toHaveClass('flg-card-description', 'd');
    expect(content.current).toHaveClass('flg-card-content', 'c');
    expect(footer.current).toHaveClass('flg-card-footer', 'f');
  });
```

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/warn.test.ts src/components/button src/components/icon-button src/components/card`
Expected:
- Có đúng 2 test FAIL:
  - `does not throw where process does not exist…` fail với `TypeError: Cannot read properties of undefined (reading 'env')`.
  - `renders a void element through asChild…` fail với `input is a void element tag and must neither have children nor use dangerouslySetInnerHTML`.
- Các test còn lại PASS ngay. Chúng khóa hành vi đã có.

- [ ] **Step 4: Sửa `warn.ts`**

Thay toàn bộ `src/internal/warn.ts` bằng:

```ts
const warned = new Set<string>();

// Bundlers replace `process.env.NODE_ENV` with a string literal, so the check costs nothing in a
// production build. Without a bundler (native ESM in a browser) `process` may not exist at all.
function isProduction(): boolean {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

/** Development-only warning, printed once per distinct message. Never throws. */
export function devWarn(message: string): void {
  if (isProduction()) return;
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[fl-glass-ui] ${message}`);
}

/** Test helper: forget which messages were already printed. */
export function resetDevWarnings(): void {
  warned.clear();
}
```

Lưu ý: không đổi thành `typeof process !== 'undefined' && …`. Với webpack, biểu thức `process.env.NODE_ENV` được thay bằng chuỗi, nhưng `typeof process` vẫn là `'undefined'` trong trình duyệt, nên bản build production sẽ in cảnh báo.

- [ ] **Step 5: Sửa Button cho phần tử void**

Trong `src/components/button/Button.tsx`, chèn ngay trước comment `// Runs in the capture phase so neither the button's …`:

```tsx
// HTML void elements cannot have children, so an `asChild` element such as `<input type="submit">`
// is passed through as it is, without the spinner slot.
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
```

rồi thay:

```tsx
    const child = isValidElement<{ children?: ReactNode }>(children)
      ? cloneElement(children, undefined, withSpinner(loading, children.props.children))
      : children;
```

bằng:

```tsx
    const child =
      isValidElement<{ children?: ReactNode }>(children) &&
      !(typeof children.type === 'string' && VOID_ELEMENTS.has(children.type))
        ? cloneElement(children, undefined, withSpinner(loading, children.props.children))
        : children;
```

- [ ] **Step 6: Lọc cảnh báo directive của tsdown**

Thay toàn bộ `tsdown.config.ts` bằng:

```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  unbundle: true,
  root: 'src',
  outDir: 'dist',
  dts: true,
  clean: true,
  inputOptions: {
    // Rolldown warns that bundling may drop "use client". This build is unbundled, every module keeps
    // its own directive, and scripts/check-use-client.ts verifies that, so the warning is noise.
    onLog(level, log, defaultHandler) {
      if (log.code === 'MODULE_LEVEL_DIRECTIVE') return;
      defaultHandler(level, log);
    },
  },
});
```

- [ ] **Step 7: Chạy test và build**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm build 2>&1 | grep -c MODULE_LEVEL_DIRECTIVE; pnpm check:package`
Expected:
- `test:unit`, `typecheck` và `lint` PASS.
- `grep -c` in `0`.
- `check:package` PASS, `check:use-client` in `... 3 client.` Dòng `head -1 dist/components/button/Button.js` vẫn là `"use client";`.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "fix: harden devWarn, accept void asChild elements and silence directive warnings" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---
### Task 2: `FieldContext`, `useFieldProps` và `Field`

**Files:**
- Create: `src/internal/field-context.tsx`, `src/components/field/Field.tsx`, `src/components/field/index.ts`, `src/styles/components/field.css`
- Test: `src/internal/field-context.test.tsx`, `src/components/field/Field.test.tsx`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `dataAttr` (`src/internal/data-attr.ts`).
- Produces (các task 3–7 dùng đúng các tên này):
  - `interface FieldContextValue { controlId: string; labelId: string | undefined; descriptionId: string | undefined; errorId: string | undefined; invalid: boolean; required: boolean; disabled: boolean; labelMode: 'for' | 'group' }`.
  - `FieldContext` (`createContext<FieldContextValue | null>(null)`), `useFieldContext(): FieldContextValue | null`.
  - `interface FieldControlProps { id?; invalid?: boolean; required?: boolean; disabled?: boolean; 'aria-describedby'?: string; 'aria-invalid'?: AriaAttributes['aria-invalid'] }`.
  - `useFieldProps<P extends FieldControlProps>(props: P)` trả về `{ ...các prop còn lại của P, id, invalid: boolean, required, disabled, 'aria-describedby', 'aria-invalid' }`. `invalid` là boolean, dành cho `data-invalid` của control. Không bao giờ spread nó lên DOM.
  - `markAsFieldGroup<T extends object>(component: T): T` và `isFieldGroup(node: ReactNode): boolean`.
  - `Field`, kiểu `ForwardRefExoticComponent<FieldProps & RefAttributes<HTMLDivElement>>`. Ref trỏ tới `div.flg-field`.
  - `interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'children'> { label?; description?; error?: ReactNode; required?; disabled?: boolean; id?: string; children: ReactNode }`.

Field render theo spec §6.3:
- **Label:** chỉ render khi có `label`. Thông thường là `<label class="flg-field-label" for={controlId}>`. Khi con trực tiếp là một nhóm đã đánh dấu (`labelMode="group"`), label là `<span class="flg-field-label">`.
- **Dấu bắt buộc:** khi `required`, thêm `<span class="flg-field-required" aria-hidden="true">*</span>` vào trong label.
- **Mô tả và lỗi:** `<p class="flg-field-description">` và `<p class="flg-field-error">` chỉ render khi có nội dung tương ứng.
- **Id:** id của các phần được sinh từ `useId`. Prop `id` của Field trở thành `controlId`.

- [ ] **Step 1: Viết test cho `field-context`**

`src/internal/field-context.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createElement, forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FieldContext, isFieldGroup, markAsFieldGroup, useFieldProps } from './field-context';
import type { FieldContextValue, FieldControlProps } from './field-context';

const FIELD: FieldContextValue = {
  controlId: 'email',
  labelId: 'email-label',
  descriptionId: 'email-description',
  errorId: 'email-error',
  invalid: true,
  required: true,
  disabled: false,
  labelMode: 'for',
};

// A minimal control: what useFieldProps returns goes straight onto a native input.
function Probe(props: FieldControlProps) {
  const { invalid, ...inputProps } = useFieldProps(props);
  return <input data-invalid={invalid ? '' : undefined} {...inputProps} />;
}

function renderInField(ui: ReactNode, field: FieldContextValue = FIELD) {
  return render(<FieldContext.Provider value={field}>{ui}</FieldContext.Provider>);
}

describe('useFieldProps', () => {
  it('leaves a control outside a Field untouched', () => {
    render(<Probe />);
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('id');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('data-invalid');
    expect(input).not.toBeRequired();
    expect(input).toBeEnabled();
  });

  it('takes the id, description, error, invalid and required state from its Field', () => {
    renderInField(<Probe />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('aria-describedby', 'email-description email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid');
    expect(input).toBeRequired();
  });

  it('only points at the parts the Field renders', () => {
    renderInField(<Probe />, {
      ...FIELD,
      descriptionId: undefined,
      errorId: undefined,
      invalid: false,
    });
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('lets props passed to the control win over the Field', () => {
    renderInField(
      <Probe id="mine" aria-describedby="hint" invalid={false} required={false} disabled />,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'mine');
    expect(input).toHaveAttribute('aria-describedby', 'hint');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('data-invalid');
    expect(input).not.toBeRequired();
    expect(input).toBeDisabled();
  });

  it('reads aria-invalid passed directly as the invalid state', () => {
    const { unmount } = renderInField(<Probe aria-invalid="false" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-invalid');
    unmount();
    render(<Probe aria-invalid="spelling" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'spelling');
    expect(screen.getByRole('textbox')).toHaveAttribute('data-invalid');
  });
});

describe('isFieldGroup', () => {
  const Group = markAsFieldGroup(
    forwardRef<HTMLDivElement>(function Group(_props, ref) {
      return <div ref={ref} />;
    }),
  );
  function Plain() {
    return <div />;
  }

  it('recognises a marked component and nothing else', () => {
    expect(isFieldGroup(<Group />)).toBe(true);
    expect(isFieldGroup(<Plain />)).toBe(false);
    expect(isFieldGroup(<div />)).toBe(false);
    expect(isFieldGroup('text')).toBe(false);
    expect(isFieldGroup(null)).toBe(false);
  });

  it('sees through the lazy reference a Server Component passes down', () => {
    // The shape React's Flight client gives a client component an RSC payload refers to.
    const reference = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: Group,
      _init: (payload: unknown) => payload,
    };
    expect(isFieldGroup(createElement(reference as unknown as ElementType))).toBe(true);
  });
});
```

- [ ] **Step 2: Viết test cho `Field`**

Hai control trong file test là bản thay thế tạm. Control thật đến ở các task sau.

`src/components/field/Field.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef, forwardRef } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { markAsFieldGroup, useFieldContext, useFieldProps } from '../../internal/field-context';
import type { FieldControlProps } from '../../internal/field-context';
import { Field } from './Field';

// Stand-ins for the real controls, which arrive in later tasks.
function TextControl(props: FieldControlProps) {
  const { invalid, ...inputProps } = useFieldProps(props);
  return <input data-invalid={invalid ? '' : undefined} {...inputProps} />;
}
const GroupControl = markAsFieldGroup(
  forwardRef<HTMLDivElement, { children?: ReactNode }>(function GroupControl({ children }, ref) {
    const field = useFieldContext();
    return (
      <div ref={ref} role="radiogroup" id={field?.controlId} aria-labelledby={field?.labelId}>
        {children}
      </div>
    );
  }),
);

describe('Field', () => {
  it('labels the control inside it', () => {
    const { container } = render(
      <Field label="Email">
        <TextControl />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    const label = container.querySelector('label') as HTMLLabelElement;
    expect(label).toHaveClass('flg-field-label');
    expect(label).toHaveAttribute('for', input.id);
    expect(input.id).not.toBe('');
  });

  it('gives its id to the control', () => {
    render(
      <Field id="email" label="Email">
        <TextControl />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('id', 'email');
  });

  it('describes the control with the description first, then the error', () => {
    const { container } = render(
      <Field label="Email" description="We never share it." error="Enter a valid email.">
        <TextControl />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    const description = container.querySelector('.flg-field-description') as HTMLElement;
    const error = container.querySelector('.flg-field-error') as HTMLElement;
    expect(input).toHaveAttribute('aria-describedby', `${description.id} ${error.id}`);
    expect(input).toHaveAccessibleDescription('We never share it. Enter a valid email.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('.flg-field')).toHaveAttribute('data-invalid');
  });

  it('marks a required field with a hidden asterisk and a required control', () => {
    const { container } = render(
      <Field label="Email" required>
        <TextControl />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toBeRequired();
    const asterisk = container.querySelector('.flg-field-required');
    expect(asterisk).toHaveTextContent('*');
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
  });

  it('disables the control and marks the field disabled', () => {
    const { container } = render(
      <Field label="Email" disabled>
        <TextControl />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
    expect(container.querySelector('.flg-field')).toHaveAttribute('data-disabled');
  });

  it('renders only the parts it is given', () => {
    const { container } = render(
      <Field>
        <TextControl />
      </Field>,
    );
    const field = container.querySelector('.flg-field') as HTMLElement;
    expect(field.querySelector('label, .flg-field-label, p')).toBeNull();
    expect(field).not.toHaveAttribute('data-invalid');
    expect(field).not.toHaveAttribute('data-disabled');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('names a group through aria-labelledby, with a span instead of a label', () => {
    const { container } = render(
      <Field label="Plan" required>
        <GroupControl />
      </Field>,
    );
    expect(container.querySelector('label')).toBeNull();
    const label = container.querySelector('span.flg-field-label') as HTMLElement;
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toHaveAttribute(
      'aria-labelledby',
      label.id,
    );
  });

  it('joins a className, passes other props to the root and forwards the ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Field ref={ref} className="mine" data-testid="field" label="Email">
        <TextControl />
      </Field>,
    );
    expect(ref.current).toBe(screen.getByTestId('field'));
    expect(ref.current).toHaveClass('flg-field', 'mine');
  });
});
```

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/field-context.test.tsx src/components/field`
Expected: FAIL, vì không resolve được `./field-context` và `./Field`.

- [ ] **Step 4: Viết `field-context.tsx`**

`src/internal/field-context.tsx` (không có `"use client"`: file này chỉ được import từ module client):

```tsx
import { createContext, isValidElement, useContext } from 'react';
import type { AriaAttributes, ReactNode } from 'react';

/** What a `Field` tells the control inside it. */
export interface FieldContextValue {
  controlId: string;
  /** Present only when the Field renders a label. */
  labelId: string | undefined;
  /** Present only when the Field renders a description. */
  descriptionId: string | undefined;
  /** Present only when the Field renders an error. */
  errorId: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  /** `"group"` when the label names a group (RadioGroup) through aria-labelledby instead of `for`. */
  labelMode: 'for' | 'group';
}

export const FieldContext = createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

/** The props a control shares with its Field. Every one of them, passed directly, wins. */
export interface FieldControlProps {
  id?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
}

function isInvalidValue(value: AriaAttributes['aria-invalid']): boolean {
  return value !== undefined && value !== false && value !== 'false';
}

/**
 * Merges a control's props with its Field: `id`, `aria-describedby` (description first, then error),
 * `aria-invalid`, `required` and `disabled`. Returns the remaining props untouched, plus `invalid`
 * resolved to a boolean for the control's `data-invalid`.
 */
export function useFieldProps<P extends FieldControlProps>({
  id,
  invalid,
  required,
  disabled,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: P) {
  const field = useFieldContext();
  const resolvedInvalid =
    invalid ??
    (ariaInvalid === undefined ? (field?.invalid ?? false) : isInvalidValue(ariaInvalid));
  const fieldDescribedBy =
    [field?.descriptionId, field?.errorId].filter(Boolean).join(' ') || undefined;
  return {
    ...rest,
    id: id ?? field?.controlId,
    invalid: resolvedInvalid,
    required: required ?? field?.required,
    disabled: disabled ?? field?.disabled,
    'aria-describedby': describedBy ?? fieldDescribedBy,
    'aria-invalid': ariaInvalid ?? (resolvedInvalid || undefined),
  };
}

const FIELD_GROUP = Symbol.for('fl-glass-ui.field-group');
const REACT_LAZY = Symbol.for('react.lazy');

interface LazyComponent {
  $$typeof: symbol;
  _payload: unknown;
  _init: (payload: unknown) => unknown;
}

/** Marks a component that renders a group of controls, so a Field names it with aria-labelledby. */
export function markAsFieldGroup<T extends object>(component: T): T {
  Object.defineProperty(component, FIELD_GROUP, { value: true });
  return component;
}

/** Whether a Field's direct child is a marked group, such as RadioGroup. */
export function isFieldGroup(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  let type: unknown = node.type;
  // A Server Component passes client components down as lazy references. Reading one returns the
  // component once its code has loaded, and suspends until then, just as rendering it would.
  if (
    typeof type === 'object' &&
    type !== null &&
    (type as LazyComponent).$$typeof === REACT_LAZY
  ) {
    const lazy = type as LazyComponent;
    type = lazy._init(lazy._payload);
  }
  return (
    (typeof type === 'function' || (typeof type === 'object' && type !== null)) &&
    FIELD_GROUP in type
  );
}
```

Ghi chú cho người review: nhánh lazy là bắt buộc, không phải phòng xa. Khi lập kế hoạch, mình đã tắt nhánh này rồi chạy fixture Next.js của Task 9. Kết quả là HTML render từ server dùng `<label for>` cho RadioGroup, và RadioGroup in cảnh báo oan. `_init` có thể throw một promise khi code của component chưa tải xong. Đó đúng là cách React suspend một lazy component, nên lỗi được để nguyên, không bắt.

- [ ] **Step 5: Viết `Field`**

`src/components/field/Field.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { Children, forwardRef, useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { FieldContext, isFieldGroup } from '../../internal/field-context';
import type { FieldContextValue } from '../../internal/field-context';

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id' | 'children'> {
  label?: ReactNode;
  /** Help text under the control, announced with it. */
  description?: ReactNode;
  /** Error text under the control. Any error marks the field invalid. */
  error?: ReactNode;
  /** Shows an asterisk and makes the control required. */
  required?: boolean;
  disabled?: boolean;
  /** The id of the control inside, which the label points at. Generated when omitted. */
  id?: string;
  children: ReactNode;
}

/** Label, description and error for the control inside, wired up for assistive technology. */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    label,
    description,
    error,
    required = false,
    disabled = false,
    id,
    className,
    children,
    ...props
  },
  ref,
) {
  const baseId = useId();
  const invalid = Boolean(error);
  const context: FieldContextValue = {
    controlId: id ?? `${baseId}-control`,
    labelId: label ? `${baseId}-label` : undefined,
    descriptionId: description ? `${baseId}-description` : undefined,
    errorId: invalid ? `${baseId}-error` : undefined,
    invalid,
    required,
    disabled,
    // <label for> can only name a labelable element; a group is named through aria-labelledby.
    labelMode: Children.toArray(children).some(isFieldGroup) ? 'group' : 'for',
  };
  const labelContent = (
    <>
      {label}
      {required ? (
        <span className="flg-field-required" aria-hidden="true">
          *
        </span>
      ) : null}
    </>
  );

  return (
    <div
      ref={ref}
      className={clsx('flg-field', className)}
      data-invalid={dataAttr(invalid)}
      data-disabled={dataAttr(disabled)}
      {...props}
    >
      {!label ? null : context.labelMode === 'group' ? (
        <span id={context.labelId} className="flg-field-label">
          {labelContent}
        </span>
      ) : (
        <label id={context.labelId} htmlFor={context.controlId} className="flg-field-label">
          {labelContent}
        </label>
      )}
      <FieldContext.Provider value={context}>{children}</FieldContext.Provider>
      {description ? (
        <p id={context.descriptionId} className="flg-field-description">
          {description}
        </p>
      ) : null}
      {invalid ? (
        <p id={context.errorId} className="flg-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
```

`src/components/field/index.ts`:

```ts
export { Field } from './Field';
export type { FieldProps } from './Field';
```

- [ ] **Step 6: Chạy test để xác nhận pass**

Run: `pnpm vitest run --project unit --project unit-react18 src/internal/field-context.test.tsx src/components/field`
Expected: PASS ở cả hai project. Không có cảnh báo React nào trong output.

- [ ] **Step 7: CSS của Field**

`src/styles/components/field.css` (đúng bản đã duyệt):

```css
@layer flg.components {
  .flg-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-family: var(--flg-font-sans);
  }
  .flg-field-label {
    color: var(--flg-text-muted);
    font-size: var(--flg-text-xs);
    font-weight: var(--flg-weight-medium);
    line-height: 1.3;
  }
  .flg-field-required {
    margin-left: 2px;
    color: var(--flg-danger);
  }
  .flg-field-description,
  .flg-field-error {
    margin: 0;
    font-size: var(--flg-text-xs);
    line-height: 1.45;
  }
  .flg-field-description {
    color: var(--flg-text-muted);
  }
  .flg-field-error {
    color: var(--flg-danger);
    font-weight: var(--flg-weight-medium);
  }
  .flg-field[data-disabled] {
    opacity: 0.5;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/field.css';` ngay sau `@import './components/card.css';`.

- [ ] **Step 8: Export và đăng ký**

Thêm vào cuối `src/index.ts`:

```ts
export { Field } from './components/field';
export type { FieldProps } from './components/field';
```

Trong `src/index.test.ts`, thêm `'Field',` vào danh sách, ngay sau `'Divider',`. Danh sách vẫn sắp theo thứ tự chữ cái.

Trong `scripts/check-use-client.ts`:
- Đổi comment phía trên `CLIENT_MODULES` thành `/** Spec §6.2: the modules that must be client components. */`.
- Thêm `'src/components/field/Field.tsx',` vào cuối mảng `CLIENT_MODULES`.

Trong `scripts/check-dist-css.ts`, thêm `'flg-field',` vào cuối `SHIPPED_CLASSES`.

- [ ] **Step 9: Chạy toàn bộ kiểm tra**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm build && pnpm size:record && pnpm check:package`
Expected:
- Mọi lệnh exit 0.
- `check:use-client` in `... 4 client.`
- `check:dist-css` có dòng `ok   ships .flg-field`.
- `check:rsc` vẫn in 12 dòng `ok`.

- [ ] **Step 10: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Field and the field context controls read" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---
### Task 3: Input (kèm story và docs của Field)

**Files:**
- Create: `src/components/input/Input.tsx`, `src/components/input/index.ts`, `src/components/input/Input.stories.tsx`, `src/components/input/Input.mdx`, `src/components/field/Field.stories.tsx`, `src/components/field/Field.mdx`, `src/styles/components/input.css`
- Test: `src/components/input/Input.test.tsx`, `src/components/input/Input.test-d.ts`
- Modify: `.storybook/icons.tsx`, `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `useFieldProps`, `Field` (Task 2); `dataAttr`.
- Produces:
  - `Input`, kiểu `ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>`. Ref trỏ tới `<input>`.
  - `interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> { size?: 'sm' | 'md' | 'lg'; invalid?: boolean; startContent?: ReactNode; endContent?: ReactNode }`.
  - DOM: `div.flg-input[data-size][data-invalid][data-disabled]`, bên trong là `span.flg-input-adornment?`, rồi `<input>`, rồi `span.flg-input-adornment?`.
  - `MailIcon`, `SearchIcon` trong `.storybook/icons.tsx` (chỉ dùng cho story; Task 8 dùng `MailIcon`).

- [ ] **Step 1: Viết test**

`src/components/input/Input.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Field } from '../field/Field';
import { Input } from './Input';

const frameOf = (input: HTMLElement) => input.parentElement as HTMLElement;

describe('Input', () => {
  it('renders a medium input inside a frame, with className and style on the frame', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input
        ref={ref}
        className="mine"
        style={{ width: 200 }}
        name="email"
        placeholder="you@company.com"
        aria-label="Email"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    const frame = frameOf(input);
    expect(ref.current).toBe(input);
    expect(frame).toHaveClass('flg-input', 'mine');
    expect(frame).toHaveAttribute('data-size', 'md');
    expect(frame).toHaveStyle({ width: '200px' });
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@company.com');
    expect(input).not.toHaveAttribute('class');
  });

  it('reflects size and renders start and end content as adornments', () => {
    render(<Input size="lg" aria-label="Weight" startContent="≈" endContent="kg" />);
    const frame = frameOf(screen.getByRole('textbox', { name: 'Weight' }));
    expect(frame).toHaveAttribute('data-size', 'lg');
    const adornments = frame.querySelectorAll('.flg-input-adornment');
    expect(Array.from(adornments, (node) => node.textContent)).toEqual(['≈', 'kg']);
  });

  it('focuses the input when the frame or a decorative adornment is pressed', () => {
    render(<Input aria-label="Weight" endContent="kg" />);
    const input = screen.getByRole('textbox', { name: 'Weight' });
    expect(fireEvent.mouseDown(frameOf(input))).toBe(false);
    expect(input).toHaveFocus();
    input.blur();
    fireEvent.mouseDown(screen.getByText('kg'));
    expect(input).toHaveFocus();
  });

  it('leaves presses on an interactive adornment alone', () => {
    render(
      <Input
        aria-label="Search"
        endContent={
          <button type="button" aria-label="Clear">
            ×
          </button>
        }
      />,
    );
    expect(fireEvent.mouseDown(screen.getByRole('button', { name: 'Clear' }))).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Search' })).not.toHaveFocus();
  });

  it('does not focus a disabled input, and marks the frame disabled', () => {
    render(<Input aria-label="Email" disabled />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    fireEvent.mouseDown(frameOf(input));
    expect(input).not.toHaveFocus();
    expect(frameOf(input)).toHaveAttribute('data-disabled');
  });

  it('takes its label, description and invalid state from a Field', () => {
    render(
      <Field label="Email" description="Work address." error="Enter a valid email.">
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAccessibleDescription('Work address. Enter a valid email.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(frameOf(input)).toHaveAttribute('data-invalid');
  });

  it('lets invalid passed directly win over the Field', () => {
    render(
      <Field label="Email" error="Enter a valid email.">
        <Input invalid={false} />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(frameOf(input)).not.toHaveAttribute('data-invalid');
  });
});
```

`src/components/input/Input.test-d.ts`. Đây là test kiểu theo spec §7: union `size` phải từ chối giá trị lạ.

```ts
import { expectTypeOf, test } from 'vitest';
import type { InputProps } from './Input';

test('Input accepts only the documented sizes', () => {
  expectTypeOf<InputProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'xl' is not an Input size
  const unknownSize: InputProps = { size: 'xl' };
  expectTypeOf(unknownSize).toBeObject();
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/input`
Expected: FAIL, vì không resolve được `./Input`.

- [ ] **Step 3: Viết component**

`src/components/input/Input.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { InputHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { useFieldProps } from '../../internal/field-context';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
  /** Shown before the text, for example an icon. Decorative unless it is interactive. */
  startContent?: ReactNode;
  /** Shown after the text, for example a unit. */
  endContent?: ReactNode;
}

const INTERACTIVE = 'a[href], button, input, select, textarea, [tabindex]';

// A press on the frame, the padding or a decorative adornment focuses the input, as if the whole
// frame were the input. Presses on the input itself, or on an interactive adornment such as a clear
// button, behave normally.
function focusInput(event: MouseEvent<HTMLDivElement>) {
  const frame = event.currentTarget;
  const input = frame.querySelector<HTMLInputElement>(':scope > input');
  const target = event.target as Element;
  if (!input || input.disabled || target === input) return;
  const interactive = target.closest(INTERACTIVE);
  if (interactive && frame.contains(interactive)) return;
  event.preventDefault();
  input.focus();
}

/** A single-line text input. `className` and `style` go on the frame, every other prop on `<input>`. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', startContent, endContent, className, style, ...props },
  ref,
) {
  const { invalid, ...inputProps } = useFieldProps(props);
  return (
    // The frame only forwards mouse presses to the input; keyboard users reach the input directly.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={clsx('flg-input', className)}
      style={style}
      data-size={size}
      data-invalid={dataAttr(invalid)}
      data-disabled={dataAttr(inputProps.disabled)}
      onMouseDown={focusInput}
    >
      {startContent ? <span className="flg-input-adornment">{startContent}</span> : null}
      <input ref={ref} {...inputProps} />
      {endContent ? <span className="flg-input-adornment">{endContent}</span> : null}
    </div>
  );
});
```

Ghi chú:
- **Vì sao `mousedown` mà không phải `click`:** `preventDefault()` trên `mousedown` giữ focus khỏi rơi về `body` trước khi input nhận focus. Một `onClick` sẽ để focus nhảy hai lần.
- **Vì sao `closest` chỉ tính trong khung:** khi Input nằm trong một phần tử có `tabindex` (ví dụ dialog), `closest('[tabindex]')` sẽ khớp phần tử tổ tiên đó, nên kết quả chỉ được tính nếu nằm bên trong khung.
- **Dòng `eslint-disable`:** ESLint 9 báo directive không dùng đến, nên nếu bỏ handler `onMouseDown` thì phải bỏ luôn dòng comment này.

`src/components/input/index.ts`:

```ts
export { Input } from './Input';
export type { InputProps } from './Input';
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/input src/components/field`
Expected: PASS.

- [ ] **Step 5: CSS và forced-colors**

`src/styles/components/input.css` (đúng bản đã duyệt):

```css
@layer flg.components {
  .flg-input {
    --flg-input-h: var(--flg-control-h-md);
    --flg-input-px: 11px;
    --flg-input-font: var(--flg-text-sm);
    display: flex;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    /* Lets the field shrink inside grid and flex layouts; a native input is ~170px wide otherwise. */
    min-width: 0;
    height: var(--flg-input-h);
    padding: 0 var(--flg-input-px);
    border: 1px solid var(--flg-control-border);
    border-radius: var(--flg-radius-md);
    background: var(--flg-control-bg);
    color: var(--flg-text);
    font-family: var(--flg-font-sans);
    font-size: var(--flg-input-font);
    cursor: text;
    transition:
      border-color var(--flg-duration-fast) var(--flg-ease),
      box-shadow var(--flg-duration-fast) var(--flg-ease);
  }
  .flg-input[data-size='sm'] {
    --flg-input-h: var(--flg-control-h-sm);
    --flg-input-px: 9px;
    --flg-input-font: var(--flg-text-xs);
  }
  .flg-input[data-size='lg'] {
    --flg-input-h: var(--flg-control-h-lg);
    --flg-input-px: 13px;
    --flg-input-font: var(--flg-text-md);
  }
  .flg-input > input {
    flex: 1;
    min-width: 0;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .flg-input > input::placeholder {
    color: var(--flg-text-muted);
    opacity: 1;
  }
  .flg-input-adornment {
    display: inline-flex;
    flex: none;
    align-items: center;
    color: var(--flg-text-muted);
  }
  .flg-input-adornment > svg {
    width: 16px;
    height: 16px;
  }
  .flg-input:has(> input:focus-visible) {
    border-color: var(--flg-accent-solid);
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-input[data-invalid] {
    border-color: var(--flg-danger);
  }
  .flg-input[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .flg-input > input:disabled {
    cursor: not-allowed;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/input.css';` ngay sau dòng import `field.css`.

Trong `src/styles/preferences.css`, thêm vào cuối khối `@media (forced-colors: active)`, ngay sau quy tắc `.flg-divider`:

```css
    .flg-input {
      border-color: CanvasText;
    }
    .flg-input[data-disabled] {
      border-color: GrayText;
      color: GrayText;
    }
```

- [ ] **Step 6: Icon, story và docs**

Thêm vào cuối `.storybook/icons.tsx`:

```tsx
export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
```

`src/components/input/Input.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { SearchIcon } from '../../../.storybook/icons';
import { Input } from './Input';

const grid = { display: 'grid', gap: 12, width: 300 } as const;

const meta = {
  title: 'Components/Input',
  component: Input,
  decorators: [
    (Story) => (
      <div style={grid}>
        <Story />
      </div>
    ),
  ],
  args: { 'aria-label': 'Full name', placeholder: 'Nguyễn Văn A' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Full name' });
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('Ann');
    await expect(input).toHaveValue('Ann');
  },
};

export const Sizes: Story = {
  render: (args) => (
    <>
      <Input {...args} size="sm" aria-label="Small" placeholder="Small" />
      <Input {...args} size="md" aria-label="Medium" placeholder="Medium" />
      <Input {...args} size="lg" aria-label="Large" placeholder="Large" />
    </>
  ),
};

export const WithContent: Story = {
  render: (args) => (
    <>
      <Input {...args} aria-label="Search" placeholder="Search" startContent={<SearchIcon />} />
      <Input
        {...args}
        aria-label="Weight"
        placeholder={undefined}
        defaultValue="72"
        endContent="kg"
      />
    </>
  ),
  play: async ({ canvas }) => {
    const weight = canvas.getByRole('textbox', { name: 'Weight' });
    await userEvent.click(canvas.getByText('kg'));
    await expect(weight).toHaveFocus();
  },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: 'not-an-email', 'aria-label': 'Email' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Read only' },
};
```

`src/components/field/Field.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { MailIcon } from '../../../.storybook/icons';
import { Input } from '../input/Input';
import { Field } from './Field';

const meta = {
  title: 'Components/Field',
  component: Field,
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Email',
    description: 'We only use it to send sign-in links.',
    children: <Input type="email" placeholder="you@company.com" startContent={<MailIcon />} />,
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Email' });
    await expect(input).toHaveAccessibleDescription('We only use it to send sign-in links.');
    await userEvent.tab();
    await expect(input).toHaveFocus();
  },
};

export const Required: Story = {
  args: { required: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Email' })).toBeRequired();
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    description: undefined,
    required: true,
    error: 'Use at least 8 characters.',
    children: <Input type="password" defaultValue="12345" />,
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('input') as HTMLInputElement;
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Use at least 8 characters.');
  },
};

export const Disabled: Story = {
  args: {
    label: 'Workspace URL',
    description: 'Ask an owner to change it.',
    disabled: true,
    children: <Input defaultValue="acme.example.com" />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox', { name: 'Workspace URL' })).toBeDisabled();
  },
};
```

`src/components/input/Input.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Input.stories';

<Meta of={Stories} />

# Input

```tsx
import { Field, Input } from 'fl-glass-ui';

<Field label="Full name">
  <Input name="name" autoComplete="name" />
</Field>;
```

<Canvas of={Stories.Default} />
<Controls />

## Sizes

<Canvas of={Stories.Sizes} />

## Icons and units

`startContent` and `endContent` sit inside the frame. Pressing the frame or a decorative adornment
focuses the input; an interactive adornment, such as a clear button, keeps its own clicks.

<Canvas of={Stories.WithContent} />

## Invalid and disabled

Inside a `Field` with an `error` the input is already invalid. Pass `invalid` to mark it yourself.

<Canvas of={Stories.Invalid} />
<Canvas of={Stories.Disabled} />

## Accessibility

- Renders a native `<input>`, so autofill, validation and form submission work as usual. The ref,
  and every prop except `className` and `style`, go to the `<input>`; those two style the frame.
- Give it a name: wrap it in a `Field` with a `label`, or pass `aria-label`.
- Icons in `startContent` and `endContent` should be decorative (`aria-hidden`). Put a unit the
  user needs to hear in the label too, for example "Weight (kg)".

## Do and don't

- Do set `type`, `autoComplete` and `inputMode` to match the value.
- Don't use `placeholder` as the label; it disappears as soon as the user types.
````

`src/components/field/Field.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Field.stories';

<Meta of={Stories} />

# Field

```tsx
import { Field, Input } from 'fl-glass-ui';

<Field label="Email" description="We only use it to send sign-in links." required>
  <Input type="email" />
</Field>;
```

<Canvas of={Stories.Default} />
<Controls />

## Required

`required` shows an asterisk after the label and puts the native `required` attribute on the
control, which is what screen readers announce. The asterisk itself is hidden from them.

<Canvas of={Stories.Required} />

## Errors

Any `error` marks the field invalid: the control gets `aria-invalid="true"` and the error is read
after the description.

<Canvas of={Stories.WithError} />

## Disabled

<Canvas of={Stories.Disabled} />

## Accessibility

- The label points at the control through `for`, and the description and error are linked with
  `aria-describedby`, description first. Pass `id` to choose the control's id.
- A `RadioGroup` placed directly inside `Field` is named by the label through `aria-labelledby`.
  Keep it a direct child: wrapped in another element, the Field cannot recognise it, and the
  development build warns.
- With `Checkbox` and `Switch`, the control's own children usually are the label. Use `Field` for
  the description and the error only.

## Do and don't

- Do write errors that say how to fix the value ("Use at least 8 characters.").
- Don't pass props such as `id` or `aria-describedby` to the control unless you mean to replace
  what the Field provides: a prop passed directly to the control wins.
````

- [ ] **Step 7: Export, đăng ký và chạy toàn bộ kiểm tra**

Thêm vào cuối `src/index.ts`:

```ts
export { Input } from './components/input';
export type { InputProps } from './components/input';
```

Các chỗ cần thêm:
- Trong `src/index.test.ts`, thêm `'Input',` ngay sau `'IconButton',`.
- Trong `scripts/check-use-client.ts`, thêm `'src/components/input/Input.tsx',` vào cuối `CLIENT_MODULES`.
- Trong `scripts/check-dist-css.ts`, thêm `'flg-input',` vào cuối `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected:
- `test:stories` cho 246 test PASS (41 story), không có vi phạm axe nào.
- `check:use-client` in `... 5 client.`
- `--list` liệt kê 328 test. Không chạy visual test trên máy Windows.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Input with adornments, and Field stories" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---
### Task 4: Textarea

**Files:**
- Create: `src/components/textarea/Textarea.tsx`, `src/components/textarea/index.ts`, `src/components/textarea/Textarea.stories.tsx`, `src/components/textarea/Textarea.mdx`, `src/styles/components/textarea.css`
- Test: `src/components/textarea/Textarea.test.tsx`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `useFieldProps`, `Field`; `dataAttr`.
- Produces:
  - `Textarea`, kiểu `ForwardRefExoticComponent<TextareaProps & RefAttributes<HTMLTextAreaElement>>`.
  - `interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { invalid?: boolean }`.
  - DOM: `textarea.flg-textarea[data-invalid]`. Không có phần bọc ngoài, nên `className` và mọi prop khác đều gắn lên `<textarea>`.

- [ ] **Step 1: Viết test**

`src/components/textarea/Textarea.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Field } from '../field/Field';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a native textarea, joins a className and forwards the ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} className="mine" aria-label="Bio" rows={4} />);
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(ref.current).toBe(textarea);
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveClass('flg-textarea', 'mine');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).not.toHaveAttribute('data-invalid');
  });

  it('marks itself invalid', () => {
    render(<Textarea aria-label="Bio" invalid />);
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(textarea).toHaveAttribute('data-invalid');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('takes its label, description, required and disabled state from a Field', () => {
    render(
      <Field label="Bio" description="A few lines about you." required disabled>
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(textarea).toHaveAccessibleDescription('A few lines about you.');
    expect(textarea).toBeRequired();
    expect(textarea).toBeDisabled();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/textarea`
Expected: FAIL, vì không resolve được `./Textarea`.

- [ ] **Step 3: Viết component**

`src/components/textarea/Textarea.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { useFieldProps } from '../../internal/field-context';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Marks the value as wrong. Inside a Field with an error this is already true. */
  invalid?: boolean;
}

/** A multi-line text input that the user can resize vertically. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  const { invalid, ...textareaProps } = useFieldProps(props);
  return (
    <textarea
      ref={ref}
      className={clsx('flg-textarea', className)}
      data-invalid={dataAttr(invalid)}
      {...textareaProps}
    />
  );
});
```

`src/components/textarea/index.ts`:

```ts
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/textarea`
Expected: PASS.

- [ ] **Step 5: CSS và forced-colors**

`src/styles/components/textarea.css` (đúng bản đã duyệt):

```css
@layer flg.components {
  .flg-textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 80px;
    padding: 8px 11px;
    border: 1px solid var(--flg-control-border);
    border-radius: var(--flg-radius-md);
    background: var(--flg-control-bg);
    color: var(--flg-text);
    font-family: var(--flg-font-sans);
    font-size: var(--flg-text-sm);
    line-height: 1.5;
    resize: vertical;
    transition:
      border-color var(--flg-duration-fast) var(--flg-ease),
      box-shadow var(--flg-duration-fast) var(--flg-ease);
  }
  .flg-textarea::placeholder {
    color: var(--flg-text-muted);
    opacity: 1;
  }
  .flg-textarea:focus-visible {
    border-color: var(--flg-accent-solid);
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-textarea[data-invalid] {
    border-color: var(--flg-danger);
  }
  .flg-textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/textarea.css';` ngay sau dòng import `input.css`.

Trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`, thêm vào cuối, ngay sau các quy tắc `.flg-input`:

```css
    .flg-textarea {
      border-color: CanvasText;
    }
    .flg-textarea:disabled {
      border-color: GrayText;
      color: GrayText;
    }
```

- [ ] **Step 6: Story và docs**

`src/components/textarea/Textarea.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
  args: { 'aria-label': 'Bio', placeholder: 'A few lines about you' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Bio' });
    await userEvent.tab();
    await expect(textarea).toHaveFocus();
    await userEvent.keyboard('Line one{Enter}Line two');
    await expect(textarea).toHaveValue('Line one\nLine two');
  },
};

export const InAField: Story = {
  render: () => (
    <Field label="Bio" error="Write at least 20 characters.">
      <Textarea defaultValue="Too short" />
    </Field>
  ),
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Bio' });
    await expect(textarea).toHaveAttribute('aria-invalid', 'true');
    await expect(textarea).toHaveAccessibleDescription('Write at least 20 characters.');
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Read only', placeholder: undefined },
};
```

`src/components/textarea/Textarea.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Textarea.stories';

<Meta of={Stories} />

# Textarea

```tsx
import { Field, Textarea } from 'fl-glass-ui';

<Field label="About you">
  <Textarea name="bio" rows={4} />
</Field>;
```

<Canvas of={Stories.Default} />
<Controls />

## In a Field

<Canvas of={Stories.InAField} />

## Disabled

<Canvas of={Stories.Disabled} />

## Accessibility

- Renders a native `<textarea>`; the ref and every prop go to it.
- The user can resize it vertically. Set `rows` for its starting height.
- Give it a name with a `Field` label or `aria-label`.

## Do and don't

- Do say how long the text should be in the description when there is a limit.
- Don't use it for a single line of text; use `Input`.
````

- [ ] **Step 7: Export, đăng ký và chạy toàn bộ kiểm tra**

Thêm vào cuối `src/index.ts`:

```ts
export { Textarea } from './components/textarea';
export type { TextareaProps } from './components/textarea';
```

Các chỗ cần thêm:
- Trong `src/index.test.ts`, thêm `'Textarea',` vào cuối danh sách, ngay sau `'Surface',`.
- Trong `scripts/check-use-client.ts`, thêm `'src/components/textarea/Textarea.tsx',` vào cuối `CLIENT_MODULES`.
- Trong `scripts/check-dist-css.ts`, thêm `'flg-textarea',` vào cuối `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected:
- `test:stories` cho 264 test PASS (44 story).
- `check:use-client` in `... 6 client.`
- `--list` liệt kê 352 test.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Textarea" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Checkbox

**Files:**
- Create: `src/components/checkbox/Checkbox.tsx`, `src/components/checkbox/index.ts`, `src/components/checkbox/Checkbox.stories.tsx`, `src/components/checkbox/Checkbox.mdx`, `src/styles/components/checkbox.css`
- Test: `src/components/checkbox/Checkbox.test.tsx`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `useFieldProps`, `Field`; `dataAttr`.
- Produces:
  - `Checkbox`, kiểu `ForwardRefExoticComponent<CheckboxProps & RefAttributes<HTMLInputElement>>`. Ref trỏ tới `<input type="checkbox">`.
  - `interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> { indeterminate?: boolean; onCheckedChange?: (checked: boolean) => void }`.
  - DOM: `label.flg-checkbox[data-invalid]` chứa `input.flg-checkbox-input`, rồi `span.flg-checkbox-box[aria-hidden]` (bên trong là `svg.flg-checkbox-check` và `svg.flg-checkbox-dash`), rồi `span.flg-checkbox-label?`.
  - Checkbox không có prop `invalid`, vì spec §6.3 không liệt kê. `data-invalid` lấy từ `aria-invalid` truyền vào, hoặc từ Field.

- [ ] **Step 1: Viết test**

`src/components/checkbox/Checkbox.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../field/Field';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a native checkbox inside a label, with className and style on the label', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Checkbox ref={ref} className="mine" style={{ marginTop: 4 }} name="news">
        Email me updates
      </Checkbox>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Email me updates' });
    const label = container.querySelector('label') as HTMLLabelElement;
    expect(ref.current).toBe(checkbox);
    expect(checkbox).toHaveClass('flg-checkbox-input');
    expect(checkbox).toHaveAttribute('name', 'news');
    expect(label).toHaveClass('flg-checkbox', 'mine');
    expect(label).toHaveStyle({ marginTop: '4px' });
    expect(container.querySelector('.flg-checkbox-box')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.flg-checkbox-label')).toHaveTextContent('Email me updates');
  });

  it('calls onChange first, then onCheckedChange with the new state', async () => {
    const calls: string[] = [];
    const user = userEvent.setup();
    render(
      <Checkbox
        onChange={(event) => calls.push(`change:${event.target.checked}`)}
        onCheckedChange={(checked) => calls.push(`checked:${checked}`)}
      >
        Email me
      </Checkbox>,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Email me' }));
    expect(calls).toEqual(['change:true', 'checked:true']);
  });

  it('toggles with Space', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox onCheckedChange={onCheckedChange}>Email me</Checkbox>);
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Email me' })).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('shows indeterminate, and keeps showing it while the prop says so', async () => {
    function SelectAll() {
      const [, setClicks] = useState(0);
      return (
        <Checkbox indeterminate onCheckedChange={() => setClicks((count) => count + 1)}>
          All
        </Checkbox>
      );
    }
    const user = userEvent.setup();
    render(<SelectAll />);
    const checkbox = screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement;
    expect(checkbox).toBePartiallyChecked();
    await user.click(checkbox);
    expect(checkbox.indeterminate).toBe(true);
  });

  it('clears indeterminate when the prop does', () => {
    const { rerender } = render(<Checkbox indeterminate>All</Checkbox>);
    const checkbox = screen.getByRole('checkbox', { name: 'All' }) as HTMLInputElement;
    rerender(<Checkbox indeterminate={false}>All</Checkbox>);
    expect(checkbox.indeterminate).toBe(false);
  });

  it('is invalid and described inside a Field with an error', () => {
    const { container } = render(
      <Field error="Accept the terms to continue.">
        <Checkbox required>I accept the terms</Checkbox>
      </Field>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'I accept the terms' });
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAccessibleDescription('Accept the terms to continue.');
    expect(checkbox).toBeRequired();
    expect(container.querySelector('.flg-checkbox')).toHaveAttribute('data-invalid');
  });

  it('renders no label text span without children', () => {
    const { container } = render(<Checkbox aria-label="Select row" />);
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
    expect(container.querySelector('.flg-checkbox-label')).toBeNull();
  });
});
```

Test `keeps showing it while the prop says so` có ý nghĩa thật. Jsdom tự xóa `indeterminate` khi bấm, giống trình duyệt. Khi lập kế hoạch, mình đã đổi tạm effect sang dạng `useEffect(..., [indeterminate])` và test này FAIL.

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/checkbox`
Expected: FAIL, vì không resolve được `./Checkbox`.

- [ ] **Step 3: Viết component**

`src/components/checkbox/Checkbox.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { useFieldProps } from '../../internal/field-context';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Shows a dash instead of a check, for "some of these are selected". */
  indeterminate?: boolean;
  /** Called after `onChange` with the new checked state. */
  onCheckedChange?: (checked: boolean) => void;
}

/** A native checkbox with the glass look. `className` and `style` go on the `<label>`. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, onCheckedChange, onChange, className, style, children, ...props },
  ref,
) {
  const { invalid, ...inputProps } = useFieldProps(props);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  // `indeterminate` exists only as a DOM property. A click clears it, so it is set again after every
  // render: the prop stays the source of truth.
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <label
      className={clsx('flg-checkbox', className)}
      style={style}
      data-invalid={dataAttr(invalid)}
    >
      <input
        ref={inputRef}
        type="checkbox"
        className="flg-checkbox-input"
        {...inputProps}
        onChange={handleChange}
      />
      <span className="flg-checkbox-box" aria-hidden="true">
        <svg
          className="flg-checkbox-check"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          <path d="M2.5 6.2 5 8.5l4.5-5" />
        </svg>
        <svg
          className="flg-checkbox-dash"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          focusable="false"
        >
          <path d="M3 6h6" />
        </svg>
      </span>
      {children ? <span className="flg-checkbox-label">{children}</span> : null}
    </label>
  );
});
```

Ghi chú:
- **Không dùng `useLayoutEffect`:** spec §6.3 ghi "trong effect", và React 18.3 cảnh báo khi `useLayoutEffect` chạy ở SSR.
- **Vì sao dùng `useImperativeHandle`:** component cần ref riêng để đặt `indeterminate`, đồng thời vẫn phải trả ref của người dùng về đúng input gốc.

`src/components/checkbox/index.ts`:

```ts
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/checkbox`
Expected: PASS.

- [ ] **Step 5: CSS và forced-colors**

`src/styles/components/checkbox.css`. Đây là bản đã duyệt, thêm `isolation` và `z-index` (vô hình, xem phần Mockup chuẩn ở đầu plan):

```css
@layer flg.components {
  /* The native input sits, invisible, over the box: it keeps focus, clicks and form behaviour. */
  .flg-checkbox {
    position: relative;
    /* Keeps the input's z-index inside the control. */
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--flg-text);
    font-family: var(--flg-font-sans);
    font-size: var(--flg-text-sm);
    line-height: 1.3;
    cursor: pointer;
  }
  .flg-checkbox-input {
    position: absolute;
    /* Above the visual, so every click and every hit test lands on the real input. */
    z-index: 1;
    top: 50%;
    left: 0;
    width: 16px;
    height: 16px;
    margin: 0;
    opacity: 0;
    cursor: inherit;
    transform: translateY(-50%);
  }
  .flg-checkbox-box {
    display: grid;
    flex: none;
    place-items: center;
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--flg-control-border);
    border-radius: var(--flg-radius-xs);
    background: var(--flg-control-bg);
    color: var(--flg-on-accent);
  }
  .flg-checkbox-box > svg {
    display: none;
    width: 11px;
    height: 11px;
  }
  .flg-checkbox:has(> input:checked) .flg-checkbox-box,
  .flg-checkbox:has(> input:indeterminate) .flg-checkbox-box {
    border-color: transparent;
    background: var(--flg-accent-gradient);
  }
  .flg-checkbox:has(> input:checked:not(:indeterminate)) .flg-checkbox-check,
  .flg-checkbox:has(> input:indeterminate) .flg-checkbox-dash {
    display: block;
  }
  .flg-checkbox:has(> input:focus-visible) .flg-checkbox-box {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-checkbox[data-invalid] .flg-checkbox-box {
    border-color: var(--flg-danger);
  }
  .flg-checkbox:has(> input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/checkbox.css';` ngay sau dòng import `textarea.css`.

Trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`, thêm vào cuối, ngay sau các quy tắc `.flg-textarea`:

```css
    .flg-checkbox-box {
      border-color: CanvasText;
    }
    .flg-checkbox:has(> input:checked) .flg-checkbox-box,
    .flg-checkbox:has(> input:indeterminate) .flg-checkbox-box {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
    }
    .flg-checkbox:has(> input:disabled) {
      color: GrayText;
    }
    .flg-checkbox:has(> input:disabled) .flg-checkbox-box {
      border-color: GrayText;
    }
    .flg-checkbox:has(> input:disabled:is(:checked, :indeterminate)) .flg-checkbox-box {
      background: GrayText;
      color: Canvas;
    }
```

Thứ tự các quy tắc này có ý nghĩa. Quy tắc disabled có cùng độ đặc hiệu với quy tắc checked, nên phải đứng sau để thắng.

- [ ] **Step 6: Story và docs**

`src/components/checkbox/Checkbox.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Checkbox } from './Checkbox';

const row = { display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' } as const;
const column = { display: 'grid', gap: 8 } as const;

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'Email me product updates', onCheckedChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Email me product updates' });
    // The invisible native input, not its visual, must be what a click or a hit test reaches.
    const box = checkbox.getBoundingClientRect();
    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
      checkbox,
    );
    await userEvent.tab();
    await expect(checkbox).toHaveFocus();
    await expect(checkbox.matches(':focus-visible')).toBe(true);
    await userEvent.keyboard(' ');
    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const States: Story = {
  render: () => (
    <div style={row}>
      <Checkbox>Email</Checkbox>
      <Checkbox defaultChecked>SMS</Checkbox>
      <Checkbox indeterminate>All</Checkbox>
      <Checkbox aria-invalid>Required</Checkbox>
      <Checkbox defaultChecked disabled>
        Disabled
      </Checkbox>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox', { name: 'All' })).toBePartiallyChecked();
  },
};

function SelectAll() {
  const [selected, setSelected] = useState(['email']);
  const options = ['email', 'sms', 'push'];
  const toggle = (option: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, option] : current.filter((item) => item !== option),
    );
  return (
    <div style={column}>
      <Checkbox
        checked={selected.length === options.length}
        indeterminate={selected.length > 0 && selected.length < options.length}
        onCheckedChange={(checked) => setSelected(checked ? options : [])}
      >
        All channels
      </Checkbox>
      {options.map((option) => (
        <Checkbox
          key={option}
          checked={selected.includes(option)}
          onCheckedChange={(checked) => toggle(option, checked)}
          style={{ marginLeft: 24 }}
        >
          {option.toUpperCase()}
        </Checkbox>
      ))}
    </div>
  );
}

export const Indeterminate: Story = {
  render: () => <SelectAll />,
  play: async ({ canvas }) => {
    const all = canvas.getByRole('checkbox', { name: 'All channels' });
    await expect(all).toBePartiallyChecked();
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(canvas.getByRole('checkbox', { name: 'PUSH' })).toBeChecked();
  },
};

export const InAField: Story = {
  render: () => (
    <Field error="Accept the terms to continue.">
      <Checkbox required>I accept the terms of service</Checkbox>
    </Field>
  ),
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'I accept the terms of service' });
    await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    await expect(checkbox).toHaveAccessibleDescription('Accept the terms to continue.');
  },
};
```

Kiểm tra `elementFromPoint` trong story `Default` là test cho mục 2 của Review Focus. Khi lập kế hoạch, mình đã bỏ tạm `z-index: 1` của radio, và test tương tự ở story RadioGroup FAIL trên cả 3 trình duyệt.

`src/components/checkbox/Checkbox.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Checkbox.stories';

<Meta of={Stories} />

# Checkbox

```tsx
import { Checkbox } from 'fl-glass-ui';

<Checkbox name="updates" onCheckedChange={setUpdates}>
  Email me product updates
</Checkbox>;
```

<Canvas of={Stories.Default} />
<Controls />

## States

<Canvas of={Stories.States} />

## Indeterminate

`indeterminate` shows a dash for "some of these are selected", typically on a "select all"
checkbox. Screen readers announce it as partially checked.

<Canvas of={Stories.Indeterminate} />

## In a Field

Use a `Field` to add a description or an error. The checkbox's children stay its label.

<Canvas of={Stories.InAField} />

## Accessibility

- A native `<input type="checkbox">` sits, invisible, over the box. It keeps focus, Space,
  form submission and validation, and is what a click or a test tool reaches.
- The ref, and every prop except `className` and `style`, go to the input.
- `onChange` receives the native event; `onCheckedChange` receives the new state, after `onChange`.

## Do and don't

- Do write the label as a statement the user agrees to ("Email me product updates").
- Don't use a checkbox for an action that applies immediately; use `Switch`.
````

- [ ] **Step 7: Export, đăng ký và chạy toàn bộ kiểm tra**

Thêm vào cuối `src/index.ts`:

```ts
export { Checkbox } from './components/checkbox';
export type { CheckboxProps } from './components/checkbox';
```

Các chỗ cần thêm:
- Trong `src/index.test.ts`, thêm `'Checkbox',` ngay sau `'CardTitle',`.
- Trong `scripts/check-use-client.ts`, thêm `'src/components/checkbox/Checkbox.tsx',` vào cuối `CLIENT_MODULES`.
- Trong `scripts/check-dist-css.ts`, thêm `'flg-checkbox',` vào cuối `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected:
- `test:stories` cho 288 test PASS (48 story).
- `check:use-client` in `... 7 client.`
- `--list` liệt kê 384 test.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Checkbox with an indeterminate state" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---
### Task 6: RadioGroup và Radio

**Files:**
- Create: `src/components/radio-group/RadioGroupContext.ts`, `src/components/radio-group/RadioGroup.tsx`, `src/components/radio-group/Radio.tsx`, `src/components/radio-group/index.ts`, `src/components/radio-group/RadioGroup.stories.tsx`, `src/components/radio-group/RadioGroup.mdx`, `src/styles/components/radio.css`
- Test: `src/components/radio-group/RadioGroup.test.tsx`, `src/components/radio-group/RadioGroup.test-d.ts`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `useFieldContext`, `useFieldProps`, `markAsFieldGroup`, `Field`; `dataAttr`, `devWarn`.
- Produces:
  - `RadioGroup`, kiểu `ForwardRefExoticComponent<RadioGroupProps & RefAttributes<HTMLDivElement>>`, đã gắn marker nhóm của Field.
  - `interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> { name?; value?; defaultValue?: string; onValueChange?: (value: string) => void; orientation?: 'vertical' | 'horizontal'; required?; disabled?; invalid?: boolean }`.
  - `Radio`, kiểu `ForwardRefExoticComponent<RadioProps & RefAttributes<HTMLInputElement>>`.
  - `interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'name'> { value: string }`.
  - DOM:
    - Nhóm: `div.flg-radio-group[role=radiogroup][data-orientation][data-invalid]` với `id = controlId`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required`. Không có `aria-orientation`.
    - Mỗi Radio: `label.flg-radio` chứa `input.flg-radio-input[type=radio]`, rồi `span.flg-radio-dot[aria-hidden]`, rồi `span.flg-radio-label?`.
  - Hai cảnh báo dev (đúng nguyên văn, có test):
    - `RadioGroup is inside a Field but is not its direct child, so the Field cannot label it. Make RadioGroup the direct child of Field.`
    - `Radio must be inside a RadioGroup, which gives it its name.`

Quy tắc (spec §6.3):
- **Tên nhóm:** `name` sinh bằng `useId` khi không truyền.
- **Controlled hay uncontrolled:** khi group có `value` thì là controlled, `checked = value === group.value`. Khi không có, `defaultChecked = value === group.defaultValue`, hoặc dùng `defaultChecked` của chính Radio nếu group không có `defaultValue`.
- **`required` và `disabled`:** group đặt `required` và `disabled` gốc lên từng input. `disabled` riêng của một Radio thắng giá trị của group.
- **Tên accessible:** `aria-labelledby` lấy từ `field.labelId` ở cả hai `labelMode`. Nhờ vậy nhóm vẫn có tên ngay cả khi bị bọc sai, và cảnh báo dev báo cho người dùng biết để sửa.

- [ ] **Step 1: Viết test**

`src/components/radio-group/RadioGroup.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Field } from '../field/Field';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
import type { RadioGroupProps } from './RadioGroup';

function Sizes(props: RadioGroupProps) {
  return (
    <RadioGroup aria-label="Size" {...props}>
      <Radio value="s">Small</Radio>
      <Radio value="m">Medium</Radio>
      <Radio value="l">Large</Radio>
    </RadioGroup>
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('RadioGroup', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('renders a vertical radiogroup of native radios that share a generated name', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <RadioGroup ref={ref} aria-label="Size" className="mine">
        <Radio value="s">Small</Radio>
        <Radio value="m">Medium</Radio>
      </RadioGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(ref.current).toBe(group);
    expect(group).toHaveClass('flg-radio-group', 'mine');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).not.toHaveAttribute('aria-orientation');
    const names = screen.getAllByRole('radio').map((input) => input.getAttribute('name'));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  it('uses the name and orientation passed in', () => {
    render(<Sizes name="size" orientation="horizontal" />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'horizontal');
    expect(radio('Small')).toHaveAttribute('name', 'size');
  });

  it('starts at defaultValue and reports the value the user picks', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Sizes defaultValue="m" onValueChange={onValueChange} />);
    expect(radio('Medium')).toBeChecked();
    await user.click(radio('Large'));
    expect(onValueChange).toHaveBeenCalledWith('l');
    expect(radio('Large')).toBeChecked();
  });

  it('follows value when controlled', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Sizes value="m" onValueChange={onValueChange} />);
    await user.click(radio('Small'));
    expect(onValueChange).toHaveBeenCalledWith('s');
    expect(radio('Medium')).toBeChecked();
    rerender(<Sizes value="s" onValueChange={onValueChange} />);
    expect(radio('Small')).toBeChecked();
  });

  it('moves the selection with the arrow keys', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Sizes defaultValue="s" onValueChange={onValueChange} />);
    await user.tab();
    expect(radio('Small')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(radio('Medium')).toHaveFocus();
    expect(radio('Medium')).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith('m');
  });

  it('calls a Radio onChange before onValueChange', async () => {
    const calls: string[] = [];
    const user = userEvent.setup();
    render(
      <RadioGroup aria-label="Size" onValueChange={(value) => calls.push(`value:${value}`)}>
        <Radio value="s" onChange={() => calls.push('change')}>
          Small
        </Radio>
      </RadioGroup>,
    );
    await user.click(radio('Small'));
    expect(calls).toEqual(['change', 'value:s']);
  });

  it('puts required and disabled on every radio, and a Radio can override them', () => {
    render(
      <RadioGroup aria-label="Size" required disabled>
        <Radio value="s">Small</Radio>
        <Radio value="m" disabled={false}>
          Medium
        </Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    expect(radio('Small')).toBeRequired();
    expect(radio('Small')).toBeDisabled();
    expect(radio('Medium')).toBeEnabled();
  });

  it('is named by a Field label and described by the Field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <Field label="Size" description="Pick the closest fit." error="Choose a size." required>
        <RadioGroup>
          <Radio value="s">Small</Radio>
        </RadioGroup>
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(container.querySelector('label.flg-field-label')).toBeNull();
    expect(group).toHaveAccessibleDescription('Pick the closest fit. Choose a size.');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(group).toHaveAttribute('data-invalid');
    expect(group.id).not.toBe('');
    expect(radio('Small')).toBeRequired();
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when it sits inside a Field without being its direct child', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Field label="Size">
        <div>
          <Sizes />
        </div>
      </Field>,
    );
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] RadioGroup is inside a Field but is not its direct child, so the Field ' +
        'cannot label it. Make RadioGroup the direct child of Field.',
    );
  });

  it('warns about a Radio outside a RadioGroup', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Radio value="s">Small</Radio>);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] Radio must be inside a RadioGroup, which gives it its name.',
    );
  });

  it('forwards a Radio ref, and puts className and style on its label', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <RadioGroup aria-label="Size">
        <Radio ref={ref} value="s" className="mine" style={{ marginTop: 4 }}>
          Small
        </Radio>
      </RadioGroup>,
    );
    expect(ref.current).toBe(radio('Small'));
    const label = container.querySelector('label.flg-radio') as HTMLLabelElement;
    expect(label).toHaveClass('mine');
    expect(label).toHaveStyle({ marginTop: '4px' });
    expect(container.querySelector('.flg-radio-dot')).toHaveAttribute('aria-hidden', 'true');
  });
});
```

`src/components/radio-group/RadioGroup.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { RadioProps } from './Radio';
import type { RadioGroupProps } from './RadioGroup';

test('RadioGroup accepts only the documented orientations', () => {
  expectTypeOf<RadioGroupProps['orientation']>().toEqualTypeOf<
    'vertical' | 'horizontal' | undefined
  >();
  // @ts-expect-error 'diagonal' is not an orientation
  const unknownOrientation: RadioGroupProps = { orientation: 'diagonal' };
  expectTypeOf(unknownOrientation).toBeObject();
});

test('Radio requires a value', () => {
  expectTypeOf<RadioProps['value']>().toEqualTypeOf<string>();
  // @ts-expect-error a Radio without a value cannot be selected
  const noValue: RadioProps = {};
  expectTypeOf(noValue).toBeObject();
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/radio-group`
Expected: FAIL, vì không resolve được `./Radio` và `./RadioGroup`.

- [ ] **Step 3: Viết context, RadioGroup và Radio**

`src/components/radio-group/RadioGroupContext.ts` (không có `"use client"`):

```ts
import { createContext, useContext } from 'react';

/** What a RadioGroup tells each Radio inside it. */
export interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  defaultValue: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
  required: boolean | undefined;
  disabled: boolean | undefined;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export function useRadioGroupContext(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext);
}
```

`src/components/radio-group/RadioGroup.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef, useId } from 'react';
import type { HTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { markAsFieldGroup, useFieldContext, useFieldProps } from '../../internal/field-context';
import { devWarn } from '../../internal/warn';
import { RadioGroupContext } from './RadioGroupContext';
import type { RadioGroupContextValue } from './RadioGroupContext';

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  /** The form field name shared by every Radio. Generated when omitted. */
  name?: string;
  /** The selected value, for a controlled group. */
  value?: string;
  /** The value selected at first, for an uncontrolled group. */
  defaultValue?: string;
  /** Called with the value of the Radio the user selects. */
  onValueChange?: (value: string) => void;
  /** Layout only: arrow keys move through the options either way. */
  orientation?: 'vertical' | 'horizontal';
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}

/** A set of Radio options, of which the user picks one. Arrow keys move the selection. */
export const RadioGroup = markAsFieldGroup(
  forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
    {
      name,
      value,
      defaultValue,
      onValueChange,
      orientation = 'vertical',
      className,
      children,
      ...props
    },
    ref,
  ) {
    const field = useFieldContext();
    const { invalid, required, disabled, ...groupProps } = useFieldProps(props);
    const generatedName = useId();
    if (field?.labelMode === 'for') {
      devWarn(
        'RadioGroup is inside a Field but is not its direct child, so the Field cannot label it. ' +
          'Make RadioGroup the direct child of Field.',
      );
    }
    const context: RadioGroupContextValue = {
      name: name ?? generatedName,
      value,
      defaultValue,
      onValueChange,
      required,
      disabled,
    };
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={clsx('flg-radio-group', className)}
        data-orientation={orientation}
        data-invalid={dataAttr(invalid)}
        aria-labelledby={field?.labelId}
        aria-required={required || undefined}
        {...groupProps}
      >
        <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
      </div>
    );
  }),
);
```

Ghi chú:
- **`required` và `disabled`** được tách ra khỏi `groupProps`. Spread chúng lên `div` sẽ cho ra attribute không hợp lệ (`<div disabled>`). Thay vào đó, chúng đi qua context xuống từng input.
- **`aria-labelledby` của người dùng** nằm trong `groupProps`, và vì `groupProps` được spread sau nên nó thắng giá trị lấy từ Field.

`src/components/radio-group/Radio.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { devWarn } from '../../internal/warn';
import { useRadioGroupContext } from './RadioGroupContext';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'name'> {
  value: string;
}

/** One option of a RadioGroup. `className` and `style` go on the `<label>`. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    value,
    checked,
    defaultChecked,
    required,
    disabled,
    onChange,
    className,
    style,
    children,
    ...props
  },
  ref,
) {
  const group = useRadioGroupContext();
  if (!group) devWarn('Radio must be inside a RadioGroup, which gives it its name.');
  const controlled = group?.value !== undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    group?.onValueChange?.(value);
  };

  return (
    <label className={clsx('flg-radio', className)} style={style}>
      <input
        ref={ref}
        type="radio"
        className="flg-radio-input"
        {...props}
        name={group?.name}
        value={value}
        checked={controlled ? group.value === value : checked}
        defaultChecked={
          controlled
            ? undefined
            : group?.defaultValue === undefined
              ? defaultChecked
              : group.defaultValue === value
        }
        required={required ?? group?.required}
        disabled={disabled ?? group?.disabled}
        onChange={handleChange}
      />
      <span className="flg-radio-dot" aria-hidden="true" />
      {children ? <span className="flg-radio-label">{children}</span> : null}
    </label>
  );
});
```

`src/components/radio-group/index.ts`:

```ts
export { Radio } from './Radio';
export type { RadioProps } from './Radio';
export { RadioGroup } from './RadioGroup';
export type { RadioGroupProps } from './RadioGroup';
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/radio-group src/components/field`
Expected:
- PASS ở cả hai project.
- Test arrow-key dựa vào việc `@testing-library/user-event` 14 mô phỏng di chuyển giữa các radio. Trong trình duyệt thật, story `Default` kiểm tra lại điều này.

- [ ] **Step 5: CSS và forced-colors**

`src/styles/components/radio.css`. Đây là bản đã duyệt, thêm `isolation` và `z-index`. Nếu thiếu, `.flg-radio-dot` (vốn có `position: relative`) sẽ nằm đè lên input:

```css
@layer flg.components {
  .flg-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .flg-radio-group[data-orientation='horizontal'] {
    flex-flow: row wrap;
    gap: 16px;
  }
  /* The native input sits, invisible, over the dot: it keeps focus, arrow keys and form behaviour. */
  .flg-radio {
    position: relative;
    /* Keeps the input's z-index inside the control. */
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--flg-text);
    font-family: var(--flg-font-sans);
    font-size: var(--flg-text-sm);
    line-height: 1.3;
    cursor: pointer;
  }
  .flg-radio-input {
    position: absolute;
    /* Above the visual, so every click and every hit test lands on the real input. */
    z-index: 1;
    top: 50%;
    left: 0;
    width: 16px;
    height: 16px;
    margin: 0;
    opacity: 0;
    cursor: inherit;
    transform: translateY(-50%);
  }
  .flg-radio-dot {
    position: relative;
    flex: none;
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--flg-control-border);
    border-radius: var(--flg-radius-full);
    background: var(--flg-control-bg);
  }
  .flg-radio:has(> input:checked) .flg-radio-dot {
    border-color: var(--flg-accent-solid);
  }
  .flg-radio:has(> input:checked) .flg-radio-dot::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: inherit;
    background: var(--flg-accent-gradient);
  }
  .flg-radio:has(> input:focus-visible) .flg-radio-dot {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-radio-group[data-invalid] .flg-radio-dot {
    border-color: var(--flg-danger);
  }
  .flg-radio:has(> input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/radio.css';` ngay sau dòng import `checkbox.css`.

Trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`, thêm vào cuối, ngay sau các quy tắc `.flg-checkbox`:

```css
    .flg-radio-dot {
      border-color: CanvasText;
    }
    .flg-radio:has(> input:checked) .flg-radio-dot {
      border-color: Highlight;
    }
    .flg-radio:has(> input:checked) .flg-radio-dot::after {
      background: Highlight;
    }
    .flg-radio:has(> input:disabled) {
      color: GrayText;
    }
    .flg-radio:has(> input:disabled) .flg-radio-dot {
      border-color: GrayText;
    }
    .flg-radio:has(> input:disabled:checked) .flg-radio-dot::after {
      background: GrayText;
    }
```

- [ ] **Step 6: Story và docs**

`src/components/radio-group/RadioGroup.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  args: {
    'aria-label': 'Digest',
    defaultValue: 'daily',
    onValueChange: fn(),
    children: (
      <>
        <Radio value="daily">Daily</Radio>
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
      </>
    ),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const daily = canvas.getByRole('radio', { name: 'Daily' });
    const weekly = canvas.getByRole('radio', { name: 'Weekly' });
    // The invisible native input, not its visual, must be what a click or a hit test reaches.
    const box = weekly.getBoundingClientRect();
    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
      weekly,
    );
    await expect(daily).toBeChecked();
    await userEvent.tab();
    await expect(daily).toHaveFocus();
    await expect(daily.matches(':focus-visible')).toBe(true);
    await userEvent.keyboard('{ArrowDown}');
    await expect(weekly).toHaveFocus();
    await expect(weekly).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('weekly');
  },
};

export const Horizontal: Story = {
  args: {
    'aria-label': 'Size',
    orientation: 'horizontal',
    defaultValue: 'm',
    children: (
      <>
        <Radio value="s">S</Radio>
        <Radio value="m">M</Radio>
        <Radio value="l" disabled>
          L (sold out)
        </Radio>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('radio', { name: 'L (sold out)' })).toBeDisabled();
  },
};

function ControlledPlan() {
  const [plan, setPlan] = useState('pro');
  return (
    <Field label="Plan" description={`Selected: ${plan}`}>
      <RadioGroup value={plan} onValueChange={setPlan}>
        <Radio value="free">Free</Radio>
        <Radio value="pro">Pro</Radio>
        <Radio value="team">Team</Radio>
      </RadioGroup>
    </Field>
  );
}

export const InAField: Story = {
  render: () => <ControlledPlan />,
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Plan' });
    await expect(group).toHaveAccessibleDescription('Selected: pro');
    await userEvent.click(canvas.getByRole('radio', { name: 'Team' }));
    await expect(group).toHaveAccessibleDescription('Selected: team');
  },
};

export const Invalid: Story = {
  render: () => (
    <Field label="Shipping" error="Choose a shipping speed." required>
      <RadioGroup>
        <Radio value="standard">Standard</Radio>
        <Radio value="express">Express</Radio>
      </RadioGroup>
    </Field>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Shipping' });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByRole('radio', { name: 'Standard' })).toBeRequired();
  },
};
```

Kiểm tra mà test này cần bắt: bỏ tạm `z-index: 1` khỏi `.flg-radio-input` rồi chạy `pnpm vitest run --project storybook-light src/components/radio-group`. Story `Default` phải FAIL trên cả Chromium, Firefox lẫn WebKit. Sau đó hoàn tác.

`src/components/radio-group/RadioGroup.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './RadioGroup.stories';

<Meta of={Stories} />

# RadioGroup and Radio

```tsx
import { Field, Radio, RadioGroup } from 'fl-glass-ui';

<Field label="Digest">
  <RadioGroup name="digest" defaultValue="daily">
    <Radio value="daily">Daily</Radio>
    <Radio value="weekly">Weekly</Radio>
  </RadioGroup>
</Field>;
```

<Canvas of={Stories.Default} />
<Controls />

## Horizontal

`orientation` changes the layout only. The arrow keys move through the options either way, as
they do for native radios.

<Canvas of={Stories.Horizontal} />

## Controlled, in a Field

Pass `value` and `onValueChange` to control the selection. Placed directly inside a `Field`, the
group takes its name from the label.

<Canvas of={Stories.InAField} />

## Invalid and required

`required` and `disabled` reach every Radio's native input, so the browser's validation and form
submission work. A Radio's own `disabled` overrides the group's.

<Canvas of={Stories.Invalid} />

## Accessibility

- Renders `role="radiogroup"` around native radio inputs that share one `name` (generated when you
  do not pass one). Tab enters the group at the selected option; the arrow keys change it.
- Name the group with a `Field` label or `aria-label`. Keep it a direct child of `Field`: the
  development build warns when it is wrapped and the Field cannot label it.
- A `Radio` outside a `RadioGroup` has no name and the development build warns.

## Do and don't

- Do select a sensible default when there is one.
- Don't use radios for more than about seven options; use a select instead.
````

- [ ] **Step 7: Export, đăng ký và chạy toàn bộ kiểm tra**

Thêm vào cuối `src/index.ts`:

```ts
export { Radio, RadioGroup } from './components/radio-group';
export type { RadioGroupProps, RadioProps } from './components/radio-group';
```

Các chỗ cần thêm:
- Trong `src/index.test.ts`, thêm `'Radio',` và `'RadioGroup',` ngay sau `'Input',`.
- Trong `scripts/check-use-client.ts`, thêm `'src/components/radio-group/RadioGroup.tsx',` và `'src/components/radio-group/Radio.tsx',` vào cuối `CLIENT_MODULES`.
- Trong `scripts/check-dist-css.ts`, thêm `'flg-radio-group',` và `'flg-radio',` vào cuối `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected:
- `test:stories` cho 312 test PASS (52 story).
- `check:use-client` in `... 9 client.`
- `--list` liệt kê 416 test.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add RadioGroup and Radio" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 7: Switch

**Files:**
- Create: `src/components/switch/Switch.tsx`, `src/components/switch/index.ts`, `src/components/switch/Switch.stories.tsx`, `src/components/switch/Switch.mdx`, `src/styles/components/switch.css`
- Test: `src/components/switch/Switch.test.tsx`
- Modify: `src/index.ts`, `src/index.test.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `useFieldProps`, `Field`; `dataAttr`.
- Produces:
  - `Switch`, kiểu `ForwardRefExoticComponent<SwitchProps & RefAttributes<HTMLInputElement>>`.
  - `interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> { onCheckedChange?: (checked: boolean) => void }`.
  - DOM: `label.flg-switch[data-invalid]` chứa `input.flg-switch-input[type=checkbox][role=switch]`, rồi `span.flg-switch-track[aria-hidden] > span.flg-switch-thumb`, rồi `span.flg-switch-label?`.
  - CSS không có kiểu riêng cho trạng thái invalid của Switch. `data-invalid` vẫn được đặt để nhất quán với Checkbox, và `aria-invalid` vẫn đến input.

- [ ] **Step 1: Viết test**

`src/components/switch/Switch.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../field/Field';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders a native checkbox with role switch inside a label', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <Switch ref={ref} className="mine" name="push" defaultChecked>
        Push notifications
      </Switch>,
    );
    const toggle = screen.getByRole('switch', { name: 'Push notifications' });
    expect(ref.current).toBe(toggle);
    expect(toggle).toHaveAttribute('type', 'checkbox');
    expect(toggle).toBeChecked();
    expect(container.querySelector('label')).toHaveClass('flg-switch', 'mine');
    expect(container.querySelector('.flg-switch-track')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onChange first, then onCheckedChange, and toggles with Space', async () => {
    const calls: string[] = [];
    const user = userEvent.setup();
    render(
      <Switch
        onChange={(event) => calls.push(`change:${event.target.checked}`)}
        onCheckedChange={(checked) => calls.push(`checked:${checked}`)}
      >
        Push
      </Switch>,
    );
    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('switch', { name: 'Push' })).toBeChecked();
    expect(calls).toEqual(['change:true', 'checked:true']);
  });

  it('takes its description and disabled state from a Field', () => {
    const onCheckedChange = vi.fn();
    render(
      <Field description="Sent to this device only." disabled>
        <Switch onCheckedChange={onCheckedChange}>Push</Switch>
      </Field>,
    );
    const toggle = screen.getByRole('switch', { name: 'Push' });
    expect(toggle).toHaveAccessibleDescription('Sent to this device only.');
    expect(toggle).toBeDisabled();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/switch`
Expected: FAIL, vì không resolve được `./Switch`.

- [ ] **Step 3: Viết component**

`src/components/switch/Switch.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { useFieldProps } from '../../internal/field-context';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Called after `onChange` with the new on/off state. */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * An on/off switch: a native checkbox with `role="switch"`. `className` and `style` go on the
 * `<label>`.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { onCheckedChange, onChange, className, style, children, ...props },
  ref,
) {
  const { invalid, ...inputProps } = useFieldProps(props);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };

  return (
    <label className={clsx('flg-switch', className)} style={style} data-invalid={dataAttr(invalid)}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className="flg-switch-input"
        {...inputProps}
        onChange={handleChange}
      />
      <span className="flg-switch-track" aria-hidden="true">
        <span className="flg-switch-thumb" />
      </span>
      {children ? <span className="flg-switch-label">{children}</span> : null}
    </label>
  );
});
```

`src/components/switch/index.ts`:

```ts
export { Switch } from './Switch';
export type { SwitchProps } from './Switch';
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `pnpm vitest run --project unit --project unit-react18 src/components/switch`
Expected: PASS.

- [ ] **Step 5: CSS và forced-colors**

`src/styles/components/switch.css`. Đây là bản đã duyệt, thêm `isolation` và `z-index`. Nếu thiếu, `.flg-switch-track` (vốn có `position: relative`) sẽ nằm đè lên input:

```css
@layer flg.components {
  /* The native input sits, invisible, over the track: it keeps focus, clicks and form behaviour. */
  .flg-switch {
    position: relative;
    /* Keeps the input's z-index inside the control. */
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--flg-text);
    font-family: var(--flg-font-sans);
    font-size: var(--flg-text-sm);
    line-height: 1.3;
    cursor: pointer;
  }
  .flg-switch-input {
    position: absolute;
    /* Above the visual, so every click and every hit test lands on the real input. */
    z-index: 1;
    top: 50%;
    left: 0;
    width: 36px;
    height: 20px;
    margin: 0;
    opacity: 0;
    cursor: inherit;
    transform: translateY(-50%);
  }
  .flg-switch-track {
    position: relative;
    flex: none;
    box-sizing: border-box;
    width: 36px;
    height: 20px;
    border: 1px solid var(--flg-control-border);
    border-radius: var(--flg-radius-full);
    background: var(--flg-control-track);
    transition: background-color var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: var(--flg-radius-full);
    background: var(--flg-control-thumb);
    transition: transform var(--flg-duration-normal) var(--flg-ease);
  }
  .flg-switch:has(> input:checked) .flg-switch-track {
    border-color: transparent;
    background: var(--flg-accent-gradient);
  }
  .flg-switch:has(> input:checked) .flg-switch-thumb {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transform: translateX(16px);
  }
  .flg-switch:has(> input:focus-visible) .flg-switch-track {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }
  .flg-switch:has(> input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/switch.css';` ngay sau dòng import `radio.css`. Thứ tự import cuối cùng: `…card.css`, `field.css`, `input.css`, `textarea.css`, `checkbox.css`, `radio.css`, `switch.css`, rồi `preferences.css`.

Trong khối `@media (forced-colors: active)` của `src/styles/preferences.css`, thêm vào cuối, ngay sau các quy tắc `.flg-radio`:

```css
    .flg-switch-track {
      border-color: CanvasText;
    }
    .flg-switch-thumb {
      background: CanvasText;
    }
    .flg-switch:has(> input:checked) .flg-switch-track {
      border-color: Highlight;
      background: Highlight;
    }
    .flg-switch:has(> input:checked) .flg-switch-thumb {
      background: HighlightText;
    }
    .flg-switch:has(> input:disabled) {
      color: GrayText;
    }
    .flg-switch:has(> input:disabled) .flg-switch-track {
      border-color: GrayText;
    }
    .flg-switch:has(> input:disabled:checked) .flg-switch-track {
      background: GrayText;
    }
    .flg-switch:has(> input:disabled:checked) .flg-switch-thumb {
      background: Canvas;
    }
```

Ở forced-colors, nút gạt phải có màu riêng (`CanvasText`, rồi `HighlightText` khi bật). Lý do là `--flg-control-thumb` bị ép thành `Canvas`, trùng với nền track nên sẽ biến mất.

- [ ] **Step 6: Story và docs**

`src/components/switch/Switch.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Field } from '../field/Field';
import { Switch } from './Switch';

const row = { display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' } as const;

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { children: 'Push notifications', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const toggle = canvas.getByRole('switch', { name: 'Push notifications' });
    // The invisible native input, not its visual, must be what a click or a hit test reaches.
    const box = toggle.getBoundingClientRect();
    await expect(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)).toBe(
      toggle,
    );
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await expect(toggle.matches(':focus-visible')).toBe(true);
    await userEvent.keyboard(' ');
    await expect(toggle).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const States: Story = {
  render: () => (
    <div style={row}>
      <Switch>Quiet hours</Switch>
      <Switch defaultChecked>Push notifications</Switch>
      <Switch defaultChecked disabled>
        Disabled
      </Switch>
    </div>
  ),
};

export const InAField: Story = {
  render: () => (
    <Field description="Sent to this device only.">
      <Switch defaultChecked>Push notifications</Switch>
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('switch', { name: 'Push notifications' }),
    ).toHaveAccessibleDescription('Sent to this device only.');
  },
};
```

`src/components/switch/Switch.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Switch.stories';

<Meta of={Stories} />

# Switch

```tsx
import { Switch } from 'fl-glass-ui';

<Switch checked={push} onCheckedChange={setPush}>
  Push notifications
</Switch>;
```

<Canvas of={Stories.Default} />
<Controls />

## States

<Canvas of={Stories.States} />

## In a Field

<Canvas of={Stories.InAField} />

## Accessibility

- A native `<input type="checkbox" role="switch">` sits, invisible, over the track, so screen
  readers announce "switch, on" or "off" and Space toggles it.
- The ref, and every prop except `className` and `style`, go to the input.
- `onChange` receives the native event; `onCheckedChange` receives the new state, after `onChange`.

## Do and don't

- Do use a switch for a setting that takes effect immediately.
- Don't use a switch inside a form that needs a submit button; use `Checkbox`.
````

- [ ] **Step 7: Export, đăng ký và chạy toàn bộ kiểm tra**

Thêm vào cuối `src/index.ts`:

```ts
export { Switch } from './components/switch';
export type { SwitchProps } from './components/switch';
```

Các chỗ cần thêm:
- Trong `src/index.test.ts`, thêm `'Switch',` ngay sau `'Surface',`. Danh sách cuối cùng là `Avatar, Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Checkbox, Divider, Field, IconButton, Input, Radio, RadioGroup, Spinner, Surface, Switch, Textarea`.
- Trong `scripts/check-use-client.ts`, thêm `'src/components/switch/Switch.tsx',` vào cuối `CLIENT_MODULES`.
- Trong `scripts/check-dist-css.ts`, thêm `'flg-switch',` vào cuối `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected:
- `test:stories` cho 330 test PASS (55 story).
- `check:use-client` in `... 10 client.`, đúng bằng danh sách client ở spec §6.2.
- `--list` liệt kê 440 test.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Switch" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---
### Task 8: Ví dụ form hoàn chỉnh và cập nhật docs

**Files:**
- Create: `src/docs/FormExample.stories.tsx`
- Modify: `src/docs/GettingStarted.mdx`, `README.md`

**Interfaces:**
- Consumes: mọi component của Task 2–7, cùng `Button` và `Card` của Plan 2; `MailIcon` (Task 3).
- Produces: story `Examples/Sign-up form` → `SignUp`. Đây là test cho mục 4 và 5 của Review Focus: native validation, `FormData`, và tên accessible không chứa dấu `*`.

- [ ] **Step 1: Viết story form**

`src/docs/FormExample.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FormEvent } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { MailIcon } from '../../.storybook/icons';
import { Button } from '../components/button/Button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/card/Card';
import { Checkbox } from '../components/checkbox/Checkbox';
import { Field } from '../components/field/Field';
import { Input } from '../components/input/Input';
import { Radio } from '../components/radio-group/Radio';
import { RadioGroup } from '../components/radio-group/RadioGroup';
import { Switch } from '../components/switch/Switch';
import { Textarea } from '../components/textarea/Textarea';

interface SignUpFormProps {
  onSubmit: (values: Record<string, FormDataEntryValue>) => void;
}

function SignUpForm({ onSubmit }: SignUpFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
  };
  return (
    <Card style={{ width: 380 }}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start a 14-day trial. No card needed.</CardDescription>
      </CardHeader>
      <form
        aria-label="Create an account"
        onSubmit={handleSubmit}
        style={{ display: 'grid', gap: 14 }}
      >
        <Field label="Email" description="We only use it to send sign-in links." required>
          <Input
            name="email"
            type="email"
            placeholder="you@company.com"
            startContent={<MailIcon />}
          />
        </Field>
        <Field label="Password" required>
          <Input name="password" type="password" minLength={8} />
        </Field>
        <Field label="About you">
          <Textarea name="bio" placeholder="A few lines about you" />
        </Field>
        <Field label="Plan">
          <RadioGroup name="plan" defaultValue="pro" orientation="horizontal">
            <Radio value="free">Free</Radio>
            <Radio value="pro">Pro</Radio>
            <Radio value="team">Team</Radio>
          </RadioGroup>
        </Field>
        <Switch name="news" defaultChecked>
          Product news by email
        </Switch>
        <Checkbox name="terms" value="accepted" required>
          I accept the terms of service
        </Checkbox>
        <CardFooter>
          <Button variant="ghost" type="reset">
            Clear
          </Button>
          <Button type="submit">Create account</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

const meta = {
  title: 'Examples/Sign-up form',
  component: SignUpForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignUp: Story = {
  play: async ({ canvas, args }) => {
    const form = canvas.getByRole('form', { name: 'Create an account' }) as HTMLFormElement;
    await expect(form.checkValidity()).toBe(false);

    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), 'ann@example.com');
    await userEvent.type(canvas.getByLabelText(/^Password/), 'correct horse');
    await userEvent.click(canvas.getByRole('radio', { name: 'Team' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'I accept the terms of service' }));
    await expect(form.checkValidity()).toBe(true);

    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'ann@example.com',
      password: 'correct horse',
      bio: '',
      plan: 'team',
      news: 'on',
      terms: 'accepted',
    });
  },
};
```

Ghi chú:
- **Vì sao `getByLabelText(/^Password/)`:** Testing Library so khớp `textContent` của label, và chuỗi này có cả dấu `*` (`"Password*"`). Ô password không có ARIA role nên không truy vấn bằng `getByRole` được. Riêng ô Email thì `getByRole('textbox', { name: 'Email' })` vẫn khớp, vì tên accessible bỏ qua phần `aria-hidden`. Đây đúng là điều mục 4 của Review Focus cần giữ.
- **Vì sao không bấm submit khi form còn lỗi:** story chỉ kiểm `checkValidity()`. Bóng thông báo validation gốc của trình duyệt không thuộc trang, nên không được để nó xuất hiện trong ảnh chụp visual.

- [ ] **Step 2: Chạy story**

Run: `pnpm vitest run --project storybook-light --project storybook-dark src/docs/FormExample`
Expected: 6 test PASS (1 story × 3 trình duyệt × 2 theme), không có vi phạm axe nào.

- [ ] **Step 3: Cập nhật Getting started và README**

Trong `src/docs/GettingStarted.mdx`, thay đoạn:

```mdx
Available today: Surface, Card, Button, IconButton, Badge, Avatar, Divider and Spinner. Form
controls arrive next.
```

bằng:

````mdx
Phase 1 components: Surface, Card, Button, IconButton, Badge, Avatar, Divider, Spinner, Field,
Input, Textarea, Checkbox, RadioGroup and Switch.

## Build a form

Wrap each control in a `Field` for its label, description and error. Every control is a native
form element underneath, so `FormData`, the browser's validation and form libraries work as usual.

```tsx
import { Field, Input } from 'fl-glass-ui';

<Field label="Email" description="We only use it to send sign-in links." error={errors.email}>
  <Input name="email" type="email" autoComplete="email" />
</Field>;
```
````

Trong `README.md`, thay hai dòng:

```md
> Status: 0.x, not yet published. Available: Surface, Card, Button, IconButton, Badge, Avatar,
> Divider and Spinner. Form controls come next.
```

bằng:

```md
> Status: 0.x, not yet published. Phase 1 is complete: Surface, Card, Button, IconButton, Badge,
> Avatar, Divider, Spinner, Field, Input, Textarea, Checkbox, RadioGroup and Switch.
```

Thay khối ví dụ dưới `## Use` bằng:

```md
    import 'fl-glass-ui/styles.css';
    import { Button, Card, CardContent, CardFooter, Field, Input } from 'fl-glass-ui';

    export function SignIn() {
      return (
        <Card asChild>
          <form action="/sign-in">
            <CardContent>
              <Field label="Email" required>
                <Input name="email" type="email" autoComplete="email" />
              </Field>
            </CardContent>
            <CardFooter>
              <Button type="submit">Send sign-in link</Button>
            </CardFooter>
          </form>
        </Card>
      );
    }
```

Thay đoạn dưới `## Documentation` bằng:

```md
Run `pnpm storybook` in a clone for the component documentation. `docs.yml` publishes the same
Storybook to GitHub Pages once Pages is enabled for the repository.
```

- [ ] **Step 4: Chạy toàn bộ kiểm tra**

Run: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit && pnpm test:stories && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected:
- `test:stories` cho 336 test PASS (56 story).
- `--list` liệt kê 448 test.
- `pnpm build-storybook` không báo lỗi MDX.

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add -A
git commit -m "docs: add a complete sign-up form example and document the form controls" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 9: Fixture Vite và Next.js

**Files:**
- Create: `fixtures/vite-app/{package.json,tsconfig.json,vite.config.ts,index.html,src/main.tsx,src/App.tsx,public/avatar.svg,public/no-size.svg}`, `fixtures/next-app/{package.json,tsconfig.json,app/layout.tsx,app/page.tsx,app/client-controls.tsx,public/avatar.svg,public/no-size.svg}`, `scripts/test-fixtures.mjs`
- Modify: `package.json` (script `test:fixtures`), `.gitignore`, `.prettierignore`, `.github/workflows/ci.yml`, `CONTRIBUTING.md`

**Interfaces:**
- Consumes: tarball do `pnpm pack` tạo ra từ `dist/` (cần chạy `pnpm build` trước).
- Produces: `pnpm test:fixtures [vite] [next]` thực hiện các bước sau:
  1. Đóng gói lib thành `fixtures/fl-glass-ui.tgz`.
  2. Cài tarball vào từng fixture bằng `npm install --no-package-lock`.
  3. Build fixture: Vite chạy thêm `tsc --noEmit`; Next tự kiểm kiểu khi build.
  4. Mở trang trong Chromium, ở production rồi đến development.

  Lệnh fail khi có một trong các lỗi sau:
  - lỗi hoặc cảnh báo trên console;
  - lỗi trang;
  - dòng `[fl-glass-ui]`, `Warning:` hay `Error:` trong output của server;
  - thiếu một trong 14 mục ở §6.3;
  - RadioGroup không được Field đặt tên;
  - Avatar không đúng trạng thái `loaded,error,loaded`;
  - checkbox "All channels" không ở trạng thái indeterminate hoặc không bấm được;
  - không chọn được radio "Yearly".

Hai fixture cố ý khác nhau:
- **`vite-app`:** render phía client với **React 18.3.1**, đầu dưới của khoảng peer. Bản build production lẫn dev server đều phải sạch cảnh báo.
- **`next-app`:** dùng App Router với **React 19.3**. `app/page.tsx` là Server Component: component server-safe render trực tiếp trong đó, và component client cũng được ghép trực tiếp trong đó, kể cả `<Field><RadioGroup>` (mục 1 của Review Focus). Script kiểm cả HTML do server trả về, phải có `<span class="flg-field-label">Plan`.

Ba ca Avatar khi hydrate (mục bị hoãn từ Plan 2):
- `avatar.svg` có kích thước, thường đã tải xong trước khi React hydrate;
- `missing.png` không tồn tại;
- `no-size.svg` không có kích thước gốc.

- [ ] **Step 1: Fixture Vite**

`fixtures/vite-app/package.json`:

```json
{
  "name": "fl-glass-ui-fixture-vite",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "vite build",
    "preview": "vite preview",
    "dev": "vite"
  },
  "dependencies": {
    "fl-glass-ui": "file:../fl-glass-ui.tgz",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/react": "18.3.31",
    "@types/react-dom": "18.3.7",
    "@vitejs/plugin-react": "6.1.1",
    "typescript": "6.0.3",
    "vite": "8.3.1"
  }
}
```

`fixtures/vite-app/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`fixtures/vite-app/vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [react()] });
```

`fixtures/vite-app/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>fl-glass-ui Vite fixture</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`fixtures/vite-app/src/main.tsx`:

```tsx
import 'fl-glass-ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`fixtures/vite-app/src/App.tsx`:

```tsx
// Every component of phase 1, rendered with React 18.3, the bottom of the supported range.
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  Field,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Spinner,
  Surface,
  Switch,
  Textarea,
} from 'fl-glass-ui';
import { useEffect, useState } from 'react';

const CHANNELS = ['email', 'sms'];

export function App() {
  const [hydrated, setHydrated] = useState(false);
  const [channels, setChannels] = useState(['email']);
  const [period, setPeriod] = useState('monthly');
  useEffect(() => setHydrated(true), []);
  return (
    <main
      data-hydrated={hydrated ? '' : undefined}
      style={{ display: 'grid', gap: 16, maxWidth: 420, margin: '32px auto' }}
    >
      <Surface style={{ padding: 16 }}>A surface.</Surface>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Every component of phase 1 on one page.</CardDescription>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge variant="accent">Pro</Badge>
            <Spinner label="Loading usage" />
            <Avatar src="/avatar.svg" alt="Image with a size" fallback="IS" />
            <Avatar src="/missing.png" alt="Missing image" fallback="MI" />
            <Avatar src="/no-size.svg" alt="Image without a size" fallback="NS" />
          </div>
          <Divider />
          <Field label="Email" description="We only use it to send sign-in links." required>
            <Input name="email" type="email" />
          </Field>
          <Field label="About you">
            <Textarea name="bio" />
          </Field>
          <Field label="Plan" description="Billed monthly.">
            <RadioGroup name="plan" defaultValue="pro" orientation="horizontal">
              <Radio value="free">Free</Radio>
              <Radio value="pro">Pro</Radio>
            </RadioGroup>
          </Field>
          <Checkbox name="terms">I accept the terms of service</Checkbox>
          <Switch name="news" defaultChecked>
            Product news by email
          </Switch>
        </CardContent>
        <CardFooter>
          <IconButton aria-label="Settings" variant="ghost">
            ⚙
          </IconButton>
          <Button>Create account</Button>
        </CardFooter>
      </Card>
      <section style={{ display: 'grid', gap: 12 }}>
        <Checkbox
          checked={channels.length === CHANNELS.length}
          indeterminate={channels.length === 1}
          onCheckedChange={(checked) => setChannels(checked ? CHANNELS : [])}
        >
          All channels
        </Checkbox>
        <Field label="Billing period">
          <RadioGroup value={period} onValueChange={setPeriod}>
            <Radio value="monthly">Monthly</Radio>
            <Radio value="yearly">Yearly</Radio>
          </RadioGroup>
        </Field>
      </section>
    </main>
  );
}
```

Hai ảnh SVG, dùng giống hệt nhau cho cả hai fixture:

`fixtures/vite-app/public/avatar.svg` (có kích thước gốc):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7ea6ff"/><circle cx="32" cy="26" r="11" fill="#ffffff"/></svg>
```

`fixtures/vite-app/public/no-size.svg` (không có `width`/`height`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#c9576b"/><circle cx="32" cy="26" r="11" fill="#ffffff"/></svg>
```

- [ ] **Step 2: Fixture Next.js**

`fixtures/next-app/package.json`:

```json
{
  "name": "fl-glass-ui-fixture-next",
  "private": true,
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  },
  "dependencies": {
    "fl-glass-ui": "file:../fl-glass-ui.tgz",
    "next": "16.3.8",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@types/node": "24.19.0",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "typescript": "6.0.3"
  }
}
```

`fixtures/next-app/tsconfig.json` là bản `next build` tự hoàn thiện. Commit nguyên bản này để lần build sau không ghi đè:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "allowJs": true,
    "esModuleInterop": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

`fixtures/next-app/app/layout.tsx`:

```tsx
import 'fl-glass-ui/styles.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'fl-glass-ui Next.js fixture' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`fixtures/next-app/app/page.tsx`:

```tsx
// A Server Component: the server-safe components render here directly, and the client components
// are composed here too, the way an App Router page would use them.
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  Field,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Spinner,
  Surface,
  Switch,
  Textarea,
} from 'fl-glass-ui';
import { ClientControls } from './client-controls';

export default function Page() {
  return (
    <main style={{ display: 'grid', gap: 16, maxWidth: 420, margin: '32px auto' }}>
      <Surface style={{ padding: 16 }}>A surface rendered on the server.</Surface>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Every component of phase 1 on one page.</CardDescription>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge variant="accent">Pro</Badge>
            <Spinner label="Loading usage" />
            <Avatar src="/avatar.svg" alt="Image with a size" fallback="IS" />
            <Avatar src="/missing.png" alt="Missing image" fallback="MI" />
            <Avatar src="/no-size.svg" alt="Image without a size" fallback="NS" />
          </div>
          <Divider />
          <Field label="Email" description="We only use it to send sign-in links." required>
            <Input name="email" type="email" />
          </Field>
          <Field label="About you">
            <Textarea name="bio" />
          </Field>
          <Field label="Plan" description="Billed monthly.">
            <RadioGroup name="plan" defaultValue="pro" orientation="horizontal">
              <Radio value="free">Free</Radio>
              <Radio value="pro">Pro</Radio>
            </RadioGroup>
          </Field>
          <Checkbox name="terms">I accept the terms of service</Checkbox>
          <Switch name="news" defaultChecked>
            Product news by email
          </Switch>
        </CardContent>
        <CardFooter>
          <IconButton aria-label="Settings" variant="ghost">
            ⚙
          </IconButton>
          <Button>Create account</Button>
        </CardFooter>
      </Card>
      <ClientControls />
    </main>
  );
}
```

`fixtures/next-app/app/client-controls.tsx`:

```tsx
'use client';

import { Checkbox, Field, Radio, RadioGroup } from 'fl-glass-ui';
import { useEffect, useState } from 'react';

const CHANNELS = ['email', 'sms'];

// Controlled components inside a Client Component. `data-hydrated` tells the check that React has
// attached its event handlers.
export function ClientControls() {
  const [hydrated, setHydrated] = useState(false);
  const [channels, setChannels] = useState(['email']);
  const [period, setPeriod] = useState('monthly');
  useEffect(() => setHydrated(true), []);
  return (
    <section data-hydrated={hydrated ? '' : undefined} style={{ display: 'grid', gap: 12 }}>
      <Checkbox
        checked={channels.length === CHANNELS.length}
        indeterminate={channels.length === 1}
        onCheckedChange={(checked) => setChannels(checked ? CHANNELS : [])}
      >
        All channels
      </Checkbox>
      <Field label="Billing period">
        <RadioGroup value={period} onValueChange={setPeriod}>
          <Radio value="monthly">Monthly</Radio>
          <Radio value="yearly">Yearly</Radio>
        </RadioGroup>
      </Field>
    </section>
  );
}
```

Chép hai file `public/avatar.svg` và `public/no-size.svg` của fixture Vite sang `fixtures/next-app/public/`.

- [ ] **Step 3: Script kiểm tra fixture**

`scripts/test-fixtures.mjs`:

```js
// Installs the packed library into each fixture app, builds the app, then loads it in Chromium in
// production and in development mode. Fails on any console error or warning, any library warning
// in the server output, a missing component, or a broken interaction (spec §7, "Fixtures").
// Run `pnpm build` first. Usage: node scripts/test-fixtures.mjs [vite] [next]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const FIXTURES = join(ROOT, 'fixtures');
const IS_WINDOWS = process.platform === 'win32';

const APPS = {
  vite: {
    dir: 'vite-app',
    steps: [['typecheck'], ['build']],
    servers: [
      {
        mode: 'production',
        bin: 'node_modules/vite/bin/vite.js',
        args: ['preview', '--port', '4173', '--strictPort'],
        url: 'http://localhost:4173/',
      },
      {
        mode: 'development',
        bin: 'node_modules/vite/bin/vite.js',
        args: ['--port', '5173', '--strictPort'],
        url: 'http://localhost:5173/',
      },
    ],
  },
  next: {
    dir: 'next-app',
    steps: [['build']],
    // The page is a Server Component: its HTML must already name the RadioGroup with a span label.
    serverRendered: true,
    servers: [
      {
        mode: 'production',
        bin: 'node_modules/next/dist/bin/next',
        args: ['start', '-p', '3100'],
        url: 'http://localhost:3100/',
      },
      {
        mode: 'development',
        bin: 'node_modules/next/dist/bin/next',
        args: ['dev', '-p', '3101'],
        url: 'http://localhost:3101/',
      },
    ],
  },
};

/** One element per phase 1 component (spec §6.3), as the page renders it. */
const COMPONENTS = [
  '.flg-surface',
  '.flg-card',
  '.flg-button:not([data-icon-only])',
  '.flg-button[data-icon-only]',
  '.flg-badge',
  '.flg-avatar',
  '.flg-divider',
  '.flg-spinner',
  '.flg-field',
  '.flg-input',
  '.flg-textarea',
  '.flg-checkbox',
  '.flg-radio-group',
  '.flg-switch',
];

function run(command, args, cwd) {
  console.log(`$ ${command} ${args.join(' ')}   (${cwd})`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: IS_WINDOWS });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
  }
}

function packLibrary() {
  if (!existsSync(join(ROOT, 'dist', 'index.js'))) {
    throw new Error('dist/ is missing: run `pnpm build` first.');
  }
  const isTarball = (name) => /^fl-glass-ui-.+\.tgz$/.test(name);
  for (const name of readdirSync(FIXTURES).filter(isTarball)) rmSync(join(FIXTURES, name));
  run('pnpm', ['pack', '--pack-destination', 'fixtures'], ROOT);
  const tarball = readdirSync(FIXTURES).find(isTarball);
  if (!tarball) throw new Error('pnpm pack wrote no tarball.');
  renameSync(join(FIXTURES, tarball), join(FIXTURES, 'fl-glass-ui.tgz'));
}

function startServer(cwd, server) {
  const child = spawn(process.execPath, [server.bin, ...server.args], {
    cwd,
    detached: !IS_WINDOWS,
    env: { ...process.env, NODE_ENV: undefined, BROWSER: 'none', NEXT_TELEMETRY_DISABLED: '1' },
  });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  return {
    output: () => output,
    stop() {
      if (IS_WINDOWS) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
      else process.kill(-child.pid, 'SIGTERM');
    },
  };
}

async function isAnswering(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

async function fetchWhenReady(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.text();
    } catch {
      // Not listening yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`${url} did not answer within ${timeoutMs / 1000}s.`);
}

async function checkPage(browser, url) {
  const problems = [];
  const page = await browser.newPage();
  page.on('console', (message) => {
    if (message.type() !== 'error' && message.type() !== 'warning') return;
    // The broken-avatar case requests a file that does not exist on purpose.
    if (message.location().url.endsWith('/missing.png')) return;
    // Chromium's GPU driver notes about rendering the glass, not the page's own output.
    if (message.text().includes('GL Driver Message')) return;
    problems.push(`console.${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  try {
    await inspect(page, url, problems);
  } catch (error) {
    // Keep what the console said: it usually explains why the page never got ready.
    problems.push(error instanceof Error ? error.message.split('\n')[0] : String(error));
  }
  await page.close();
  return problems;
}

async function inspect(page, url, problems) {
  await page.goto(url);
  await page.locator('[data-hydrated]').waitFor({ timeout: 60_000 });
  await page.waitForLoadState('networkidle');

  for (const selector of COMPONENTS) {
    if ((await page.locator(selector).count()) === 0) problems.push(`missing ${selector}`);
  }
  for (const name of ['Plan', 'Billing period']) {
    if ((await page.getByRole('radiogroup', { name }).count()) !== 1) {
      problems.push(`the "${name}" RadioGroup did not get its name from the Field`);
    }
  }
  const statuses = await page
    .locator('.flg-avatar')
    .evaluateAll((avatars) => avatars.map((avatar) => avatar.getAttribute('data-status')));
  if (statuses.join() !== 'loaded,error,loaded') {
    problems.push(`avatar states are ${statuses.join()}, expected loaded,error,loaded`);
  }

  const all = page.getByRole('checkbox', { name: 'All channels' });
  if (!(await all.evaluate((input) => input.indeterminate))) {
    problems.push('"All channels" is not indeterminate');
  }
  await all.click();
  if (!(await all.isChecked())) problems.push('"All channels" did not check');
  const yearly = page.getByRole('radio', { name: 'Yearly' });
  await yearly.click();
  if (!(await yearly.isChecked())) problems.push('"Yearly" did not get selected');
}

async function testApp(name, browser) {
  const app = APPS[name];
  const cwd = join(FIXTURES, app.dir);
  rmSync(join(cwd, 'node_modules', 'fl-glass-ui'), { recursive: true, force: true });
  run('npm', ['install', '--no-package-lock', '--no-audit', '--no-fund'], cwd);
  for (const step of app.steps) run('npm', ['run', ...step], cwd);

  const problems = [];
  for (const server of app.servers) {
    const label = `${name} (${server.mode})`;
    console.log(`\n▶ ${label}: ${server.url}`);
    // Another server on the port would answer in place of the fixture and fail the check obscurely.
    if (await isAnswering(server.url)) throw new Error(`${server.url} is already in use.`);
    const running = startServer(cwd, server);
    try {
      const html = await fetchWhenReady(server.url);
      if (app.serverRendered && !/<span[^>]*class="flg-field-label"[^>]*>Plan</.test(html)) {
        problems.push(`${label}: the server HTML labels the Plan RadioGroup with <label for>`);
      }
      for (const problem of await checkPage(browser, server.url)) {
        problems.push(`${label}: ${problem}`);
      }
    } finally {
      running.stop();
    }
    for (const line of running.output().split('\n')) {
      if (/\[fl-glass-ui\]|Warning:|Error:/.test(line)) {
        problems.push(`${label} server: ${line.trim()}`);
      }
    }
  }
  return problems;
}

const names = process.argv.slice(2).length > 0 ? process.argv.slice(2) : Object.keys(APPS);
for (const name of names) if (!(name in APPS)) throw new Error(`Unknown fixture "${name}".`);

packLibrary();
const browser = await chromium.launch();
const problems = [];
try {
  for (const name of names) problems.push(...(await testApp(name, browser)));
} finally {
  await browser.close();
}
if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`\nFixtures OK: ${names.join(', ')}.`);
```

Ghi chú:
- **Vì sao fixture cài bằng npm:** để giống phần lớn người dùng lib, và để tránh việc pnpm tự bật `--frozen-lockfile` trong CI.
- **Vì sao server được chạy thẳng bằng `node`:** không qua `npm run`, nên chỉ có một tiến trình cần dừng. Trên Windows, script dùng `taskkill /T`. Trên Linux, nó dừng cả process group (`detached`).
- **Vì sao không giữ lockfile:** vì mỗi lần build, tarball có hash khác nhau.

- [ ] **Step 4: Đăng ký script, ignore và CI**

Trong `package.json`, thêm script `"test:fixtures": "node scripts/test-fixtures.mjs"` ngay sau `"test:visual:ci"`.

Thêm vào cuối `.gitignore`. Next 16 tự tạo `AGENTS.md` và `CLAUDE.md` mỗi lần chạy `next dev`, nên hai file này cũng phải được ignore:

```gitignore

# Fixture apps (scripts/test-fixtures.mjs)
fixtures/*/node_modules/
fixtures/*/dist/
fixtures/*/.next/
fixtures/*/next-env.d.ts
fixtures/next-app/AGENTS.md
fixtures/next-app/CLAUDE.md
*.tsbuildinfo
```

`fixtures/fl-glass-ui.tgz` đã được ignore bởi dòng `*.tgz` sẵn có.

Thêm vào cuối `.prettierignore`. Nếu thiếu, `pnpm format` sẽ ghi đè lên thư mục build của Next.js:

```gitignore
.next
next-env.d.ts
```

Trong `.github/workflows/ci.yml`, thêm job sau vào cuối `jobs:`:

```yaml
  fixtures:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm test:fixtures
```

Trong bảng "Everyday commands" của `CONTRIBUTING.md`, thêm một dòng ngay sau dòng `pnpm check:package`:

```md
| `pnpm test:fixtures`                         | Installs the packed build into the Vite and Next.js apps in `fixtures/` and checks them in Chromium |
```

Sau đó chạy `pnpm format` để Prettier căn lại bảng.

- [ ] **Step 5: Chạy fixture**

Run: `pnpm build && pnpm test:fixtures`
Expected:
- Kết thúc bằng `Fixtures OK: vite, next.`
- Trong output có bốn dòng `▶`: `vite (production)`, `vite (development)`, `next (production)`, `next (development)`.
- Lần đầu chạy mất vài phút vì phải cài Next.js.

Kiểm tra rằng script thật sự bắt được lỗi RSC:
1. Trong `src/internal/field-context.tsx`, tạm đổi `=== REACT_LAZY` thành `=== Symbol.for('disabled')`.
2. Chạy `pnpm build && pnpm test:fixtures next`.
3. Lệnh phải exit 1, có dòng `next (production): the server HTML labels the Plan RadioGroup with <label for>` và dòng cảnh báo `[fl-glass-ui] RadioGroup is inside a Field…` ở chế độ development.
4. Hoàn tác thay đổi, rồi chạy lại `pnpm build`.

- [ ] **Step 6: Chạy các kiểm tra khác và commit**

Run: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit`
Expected:
- PASS.
- ESLint cũng lint mã nguồn của fixture. `node_modules`, `dist` và `.next` của fixture đã nằm trong `globalIgnores` từ Plan 1.

```bash
pnpm format
git add -A
git commit -m "test: add Vite and Next.js fixture apps installed from the packed build" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 10: Chuẩn bị phát hành 0.1.0

**Files:**
- Create: `.changeset/first-release.md`
- Modify: `package.json`, `CONTRIBUTING.md`

**Interfaces:**
- Consumes: toàn bộ các task trước.
- Produces:
  - Một changeset `minor` cho `fl-glass-ui`. Sau khi chủ dự án bỏ `"private": true`, Changesets sẽ nâng `0.0.0 → 0.1.0`.
  - `package.json` có `repository`, `homepage` và `bugs` trỏ đúng tới `hunghdvn/glassmorphism-ui`.

Hai sự thật đã kiểm chứng khi lập kế hoạch. Cả hai được ghi vào CONTRIBUTING để chủ dự án biết:
1. **Changesets 3 bỏ qua package `private`.** Với `"private": true`, `changeset status` trả về `"releases": []`; bỏ `private` đi thì trả về `0.0.0 → 0.1.0`. Như vậy chưa có PR "Version Packages" nào được mở cho tới khi chủ dự án bỏ cờ này.
2. **npm từ chối provenance từ repo private.** Lỗi trả về là E422 "Unsupported GitHub Actions source repository visibility", mà `release.yml` lại đặt `NPM_CONFIG_PROVENANCE: 'true'`. Vì vậy repo phải public trước lần publish đầu, hoặc phải bỏ provenance.

- [ ] **Step 1: Changeset**

`.changeset/first-release.md`:

```md
---
'fl-glass-ui': minor
---

First release, completing phase 1 of the roadmap. Components: Surface, Card (with CardHeader,
CardTitle, CardDescription, CardContent and CardFooter), Button, IconButton, Badge, Avatar,
Divider, Spinner, Field, Input, Textarea, Checkbox, RadioGroup with Radio, and Switch. Styles ship
as plain CSS in `fl-glass-ui/styles.css`, with light and dark themes that follow the operating
system or `data-flg-theme`.
```

Run: `pnpm exec changeset status --output=changeset-status.json && node -e "const s=require('./changeset-status.json');console.log(s.changesets.length, s.releases.length)" && rm changeset-status.json`
Expected: in `1 0`. Có đúng một changeset, và chưa có bản phát hành nào vì package còn `private`.

- [ ] **Step 2: Thông tin repo trong `package.json`**

Thêm ba trường sau ngay sau `"license": "MIT",`, đúng thứ tự này:

```json
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hunghdvn/glassmorphism-ui.git"
  },
  "homepage": "https://github.com/hunghdvn/glassmorphism-ui#readme",
  "bugs": {
    "url": "https://github.com/hunghdvn/glassmorphism-ui/issues"
  },
```

Run: `git remote get-url origin && pnpm check:publint`
Expected:
- URL remote là `https://github.com/hunghdvn/glassmorphism-ui.git`, khớp với `repository.url` sau khi bỏ tiền tố `git+`.
- publint in `All good!`.

- [ ] **Step 3: Cập nhật phần phát hành trong CONTRIBUTING**

Trong `CONTRIBUTING.md`, thay toàn bộ danh sách đánh số dưới đoạn `token is stored anywhere. Before the first release, in this order:` (từ dòng `1. Create the GitHub repository and push \`main\`.` đến hết mục 6) bằng:

```md
1. Make the repository public. npm refuses a provenance publish from a private repository
   (E422 "Unsupported GitHub Actions source repository visibility"), and `release.yml` sets
   `NPM_CONFIG_PROVENANCE`. If the repository has to stay private, remove that variable instead:
   trusted publishing still works, only the provenance attestation is lost.
2. Check that `repository`, `homepage` and `bugs` in `package.json` still match the repository
   exactly. npm also rejects a provenance publish (E422) when `repository.url` does not match the
   repository the workflow runs in.
3. Optionally enable GitHub Pages with "GitHub Actions" as the source, so `docs.yml` can deploy
   Storybook.
4. On npmjs.com (account with 2FA), configure a trusted publisher for `fl-glass-ui` pointing at this
   repository and the `release.yml` workflow.
5. Remove `"private": true` from `package.json` when you are ready for the first publish. Changesets
   skips private packages, so this is also what makes the Release workflow open the "Version
   Packages" pull request that bumps the version to 0.1.0. Merging that pull request publishes.
```

Rồi thêm vào cuối mục `## Visual baselines`:

```md
The workflow pushes its commit with `GITHUB_TOKEN`, and GitHub does not start new workflow runs for
such pushes, so CI does not re-run on that commit. Push any later change, or re-run CI by hand,
before you rely on a green check; keep this in mind before making CI a required check.
```

- [ ] **Step 4: Chạy toàn bộ chuỗi kiểm tra lần cuối**

Run:

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit && pnpm check:contrast && pnpm build && pnpm size:record && pnpm check:package && pnpm test:stories && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list && pnpm test:fixtures
```

Expected:
- Mọi lệnh exit 0.
- `test:stories`: 336 PASS.
- `--list`: 448 test.
- `check:use-client`: `... 10 client.`
- `check:rsc`: 12 dòng `ok`.
- `test:fixtures`: `Fixtures OK: vite, next.`
- `git diff .size-limit.json` trống: kích thước không đổi so với Task 9.

Có hai việc không làm được ở máy này, ghi lại để làm trên PR:
- **Ảnh chuẩn visual cho 24 story mới.** Job `visual` trên PR sẽ fail cho tới khi chạy workflow "Update visual baselines" trên nhánh của PR.
- **Kiểm tra screen reader thủ công** cho Field, Input, Textarea, Checkbox, RadioGroup và Switch. Ghi "not tested" trong bảng của PR nếu không có NVDA hoặc VoiceOver.

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add -A
git commit -m "chore: prepare the 0.1.0 release" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```
