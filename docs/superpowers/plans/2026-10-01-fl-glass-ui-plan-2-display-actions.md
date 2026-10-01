# fl-glass-ui: Plan 2, Component hiển thị và hành động (giai đoạn 1, phần 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm 7 mục component của giai đoạn 1 lên nền móng của Plan 1: Spinner, Button, IconButton, Badge, Avatar, Divider và nhóm Card. Mỗi component có test unit (React 18.3 và 19), story test trên 3 trình duyệt kèm axe, trang docs MDX, và được đưa vào các bước kiểm tra gói.

**Architecture:** Mỗi component nằm trong `src/components/<tên>/` gồm file TSX, `index.ts`, test, story và MDX; CSS nằm ở `src/styles/components/<tên>.css` và được import vào `src/styles/index.css` trước `preferences.css`. Component server-safe được thêm vào `scripts/rsc-probe.mjs`; component client (`"use client"`) được thêm vào `CLIENT_MODULES` của `scripts/check-use-client.ts`. Giao diện theo đúng mockup đã duyệt `docs/superpowers/specs/mockups/plan-2-components.html`.

**Tech Stack:** Như Plan 1: React 19 (dev; peer `^18.3.0 || ^19.0.0`, có project test React 18.3), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5, Storybook 10.6, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md` (§6 là đặc tả component). Mockup chuẩn: `docs/superpowers/specs/mockups/plan-2-components.html` (đã duyệt ngày 2026-10-01, nút danger theo phương án B) cùng các mockup của Plan 1.

**Phạm vi:** Plan 3 sẽ làm phần còn lại của giai đoạn 1: `FieldContext`/`useFieldProps`, Field, Input, Textarea, Checkbox, RadioGroup/Radio, Switch, fixture Vite và Next.js, gia cố `warn.ts`, link docs trong README, changeset `0.1.0`. Plan này **không** thêm changeset nào: package vẫn `private` ở `0.0.0`.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`. Runtime dependency **chỉ có** `clsx`. Không thêm `@floating-ui/dom`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể và trạng thái dùng data-attribute (`data-variant`, `data-size`, `data-orientation`, `data-loading`, `data-status`, `data-icon-only`).
- Toàn bộ CSS nằm trong các layer con theo đúng thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`. CSS component nằm trong `@layer flg.components`; quy tắc `forced-colors` nằm trong `@layer flg.preferences` ở `src/styles/preferences.css`.
- **Mockup lock:** không đổi giá trị token nào không có chú thích `(outside mockup)` trong `src/styles/theme/values.ts`. Giao diện component phải khớp `mockups/plan-2-components.html`.
- Chỉ `Surface` và `Card` được dùng `backdrop-filter`.
- `"use client"` chỉ có ở các module client theo spec §6.2. Trong plan này: `Button`, `IconButton`, `Avatar`. `Spinner`, `Badge`, `Divider` và mọi phần của `Card` là server-safe: không hook, không context, không `"use client"`.
- Mọi component dùng `forwardRef`, export kiểu props của nó, và export phẳng (không có `Card.Header`).
- Chữ mặc định do lib cung cấp bằng tiếng Anh và ghi đè được qua prop.
- Cảnh báo dev đi qua `devWarn` (`src/internal/warn.ts`), có tiền tố `[fl-glass-ui] `. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`); TypeScript 6.0.x `strict`; ESLint 9.39.
- Commit theo Conventional Commits. Thân commit kết thúc bằng một đoạn riêng `Co-Authored-By: <model thật sự viết commit> <noreply@anthropic.com>`; dùng `git commit -m "<subject>" -m "Co-Authored-By: ..."`.
- **Không** publish npm, **không** push lên `main`, giữ `"private": true`, không thêm changeset.
- Nếu `pnpm pkg set` bị sandbox chặn, sửa `package.json` trực tiếp và giữ JSON hợp lệ.
- Mỗi task thêm CSS và JS nên làm tăng kích thước gói một cách có chủ đích: chạy `pnpm build && pnpm size:record` trước `pnpm check:package` và commit `.size-limit.json` đã cập nhật.

## Review Focus

1. **Button không truyền `type`, đặt trong `<form>`:** bấm vào không được submit form. Test ở Task 3.
2. **Bấm hoặc nhấn Enter trên Button đang `loading`** (kể cả khi là `type="submit"` trong form): không gọi `onClick`, không submit, và focus vẫn ở trên nút. Test ở Task 3.
3. **`<Button asChild disabled>` bọc một link:** không điều hướng (default bị chặn), không chạy cả `onClick` của Button lẫn `onClick` riêng của link, và link bị loại khỏi thứ tự Tab. Test ở Task 3.
4. **Avatar có ảnh đã tải xong trước khi React gắn sự kiện** (ảnh trong cache, hoặc hydrate từ SSR) vẫn phải hiển thị ảnh. Đổi `src` thì phải quay về fallback cho tới khi ảnh mới tải xong. Test ở Task 6.
5. **Avatar không có `alt`** hiển thị chữ viết tắt hoặc icon mặc định không được có `role="img"` mà thiếu tên (axe báo vi phạm). Test ở Task 6, và story chạy axe.

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `src/styles/theme/values.ts`, `scripts/lib/contrast.ts` | Token `danger-fill` và phép đo `on-danger` (Task 1) |
| `src/components/spinner/{SpinnerIcon,Spinner}.tsx` | Hình spinner dùng chung, và Spinner có `role="status"` |
| `src/components/button/Button.tsx`, `src/internal/slot.tsx` | Button; Slot từ chối Fragment |
| `src/components/icon-button/IconButton.tsx` | Button vuông bắt buộc có tên accessible |
| `src/components/badge/Badge.tsx` | Badge |
| `src/components/avatar/Avatar.tsx` | Avatar với trạng thái tải ảnh |
| `src/components/divider/Divider.tsx` | Divider ngang và dọc |
| `src/components/card/Card.tsx` | Card và 5 phần con |
| `src/styles/components/*.css` | CSS từng component |
| `.storybook/icons.tsx` | Icon chỉ dùng trong story (không phát hành) |
| `scripts/rsc-probe.mjs`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts` | Đăng ký component mới vào các bước kiểm tra gói |
| `src/index.ts`, `src/index.test.ts` | API công khai và test khóa danh sách export |

---

### Task 1: Token nền nút danger (`danger-fill`)

**Files:**
- Modify: `src/styles/theme/values.ts`
- Modify: `scripts/lib/contrast.ts` (dòng đo `'on-danger'`)
- Test: `scripts/lib/contrast.test.ts`

**Interfaces:**
- Consumes: không có gì mới.
- Produces: token `--flg-danger-fill` (light `#96232c`, dark `#c2343f`); `--flg-on-danger` dark đổi thành `#ffffff`. Phép đo `on-danger` của `measure()` giờ là `on-danger` trên `danger-fill`.

- [ ] **Step 1: Viết test fail**

Thêm vào cuối `describe('evaluate catches regressions', ...)` trong `scripts/lib/contrast.test.ts` (dùng lại helper `withTheme` đã có trong describe đó):

```ts
  it('measures white danger-button text against the danger fill', () => {
    const { findings } = evaluate(withTheme('dark', { 'danger-fill': '#ffb3b8' }), KNOWN_EXCEPTIONS);
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'dark', check: 'on-danger', kind: 'below-threshold' }),
    );
  });
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project scripts scripts/lib/contrast.test.ts`
Expected: test mới FAIL. Lý do: `measure()` vẫn đo `on-danger` trên `danger`, nên đổi `danger-fill` không tạo ra finding nào.

- [ ] **Step 3: Thêm token và sửa phép đo**

Trong `src/styles/theme/values.ts`:
- `themes.light`: ngay sau dòng `danger: '#96232c', // (outside mockup)`, thêm `'danger-fill': '#96232c', // (outside mockup) Plan 2 mockup option B: danger button fill`.
- `themes.dark`: ngay sau dòng `danger: '#ffdbdd', // (outside mockup)`, thêm `'danger-fill': '#c2343f', // (outside mockup) Plan 2 mockup option B: danger button fill`. Đổi dòng `'on-danger': '#1a0b0d', // (outside mockup)` thành `'on-danger': '#ffffff', // (outside mockup)`.

Trong `scripts/lib/contrast.ts`, đổi dòng:

```ts
      'on-danger': contrastRatio(color('on-danger'), color('danger')),
```

thành:

```ts
      'on-danger': contrastRatio(color('on-danger'), color('danger-fill')),
```

- [ ] **Step 4: Chạy test và kiểm tra tương phản**

Run: `pnpm test:unit && pnpm check:contrast`
Expected: toàn bộ PASS. `check:contrast` vẫn in 68 dòng, đúng 11 dòng `known-exception`, rồi `Contrast check passed.` Các dòng `on-danger` đạt ≥ 4.5 ở cả hai theme (light khoảng 8.1, dark khoảng 5.4).

- [ ] **Step 5: Lint, typecheck, format và commit**

```bash
pnpm typecheck && pnpm lint
pnpm format
git add -A
git commit -m "feat: add a dedicated danger button fill token" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 2: Spinner

**Files:**
- Create: `src/components/spinner/SpinnerIcon.tsx`, `src/components/spinner/Spinner.tsx`, `src/components/spinner/index.ts`, `src/components/spinner/Spinner.stories.tsx`, `src/components/spinner/Spinner.mdx`, `src/styles/components/spinner.css`
- Test: `src/components/spinner/Spinner.test.tsx`
- Modify: `src/index.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/rsc-probe.mjs`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: token `--flg-accent-solid`, `--flg-spinner-duration`; class `.flg-visually-hidden`.
- Produces:
  - `SpinnerIcon(props: SVGProps<SVGSVGElement>)`: chỉ có hình SVG, `aria-hidden`. **Không** export ra API công khai; Button (Task 3) dùng nó.
  - `Spinner`, kiểu `ForwardRefExoticComponent<SpinnerProps & RefAttributes<HTMLSpanElement>>`, với `interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> { size?: 'sm' | 'md' | 'lg'; label?: string }`.
  - Class `.flg-spinner`. Bên trong `.flg-button`, spinner dùng kích thước `--flg-button-icon` và `currentColor` (CSS ở task này đã có sẵn quy tắc đó).
  - `scripts/check-dist-css.ts` có mảng `SHIPPED_CLASSES`. Các task sau thêm class của mình vào mảng này.

- [ ] **Step 1: Viết test**

`src/components/spinner/Spinner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders a status region that says "Loading" by default', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading');
    expect(status).toHaveClass('flg-spinner');
    expect(status).toHaveAttribute('data-size', 'md');
    expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces a custom label', () => {
    render(<Spinner label="Saving changes" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes');
  });

  it.each(['sm', 'md', 'lg'] as const)('reflects size %s', (size) => {
    render(<Spinner size={size} />);
    expect(screen.getByRole('status')).toHaveAttribute('data-size', size);
  });

  it('joins a className and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} className="mine" />);
    expect(ref.current).toHaveClass('flg-spinner', 'mine');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/spinner`
Expected: FAIL, vì không resolve được `./Spinner`.

- [ ] **Step 3: Viết component**

`src/components/spinner/SpinnerIcon.tsx`:

```tsx
import type { SVGProps } from 'react';

/** The spinner graphic alone. Decorative: hidden from assistive technology. */
export function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.25} strokeWidth={3} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
```

`src/components/spinner/Spinner.tsx`:

```tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SpinnerIcon } from './SpinnerIcon';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  /** Read out by screen readers. */
  label?: string;
}

/** A loading indicator announced as a status. Safe to render in React Server Components. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label = 'Loading', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      className={clsx('flg-spinner', className)}
      data-size={size}
      {...props}
    >
      <SpinnerIcon />
      <span className="flg-visually-hidden">{label}</span>
    </span>
  );
});
```

`src/components/spinner/index.ts`:

```ts
export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';
```

Thêm vào cuối `src/index.ts`:

```ts
export { Spinner } from './components/spinner';
export type { SpinnerProps } from './components/spinner';
```

- [ ] **Step 4: Viết CSS**

`src/styles/components/spinner.css`:

```css
@layer flg.components {
  .flg-spinner {
    --flg-spinner-size: 18px;
    display: inline-flex;
    flex: none;
    width: var(--flg-spinner-size);
    height: var(--flg-spinner-size);
    color: var(--flg-accent-solid);
  }
  .flg-spinner[data-size='sm'] {
    --flg-spinner-size: 14px;
  }
  .flg-spinner[data-size='lg'] {
    --flg-spinner-size: 24px;
  }
  .flg-button .flg-spinner {
    --flg-spinner-size: var(--flg-button-icon);
    color: currentColor;
  }
  .flg-spinner > svg {
    width: 100%;
    height: 100%;
    animation: flg-spin var(--flg-spinner-duration) linear infinite;
  }
  @keyframes flg-spin {
    to {
      transform: rotate(360deg);
    }
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/spinner.css';` ngay sau dòng `@import './surface.css';`.

Trong `src/styles/preferences.css`, thêm vào **bên trong** khối `@media (forced-colors: active) { ... }`, sau quy tắc `.flg-surface`:

```css
    .flg-spinner {
      color: CanvasText;
    }
```

- [ ] **Step 5: Story và trang docs**

`src/components/spinner/Spinner.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading');
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

export const CustomLabel: Story = {
  args: { label: 'Saving changes' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Saving changes');
  },
};
```

`src/components/spinner/Spinner.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Spinner.stories';

<Meta of={Stories} />

# Spinner

```tsx
import { Spinner } from 'fl-glass-ui';

<Spinner label="Loading results" />
```

<Canvas of={Stories.Default} />
<Controls />

## Sizes

<Canvas of={Stories.Sizes} />

## Accessibility

- The spinner is a `role="status"` live region. Its `label` (English "Loading" by default) is
  visually hidden and read out by screen readers; the graphic itself is hidden from them.
- With `prefers-reduced-motion: reduce` it keeps turning, three times slower, because a still
  spinner would no longer say "busy".
- Inside a `Button`, use the button's `loading` prop instead: it shows the same graphic without a
  second live region.

## Do and don't

- Do describe what is loading in `label` when the context is not obvious.
- Don't show several spinners for one operation.
````

- [ ] **Step 6: Đăng ký vào các bước kiểm tra gói**

Trong `scripts/rsc-probe.mjs`, thêm vào cuối mảng `CASES` (trước dấu `];`):

```js
  {
    label: 'Spinner',
    file: '../dist/components/spinner/Spinner.js',
    exportName: 'Spinner',
    element: (C) => createElement(C, null),
    expect: { type: 'span', className: 'flg-spinner' },
  },
```

Trong `scripts/check-dist-css.ts`, ngay trước `const requirements`, thêm:

```ts
/** Every component class whose CSS must reach dist/styles.css. Add one entry per component. */
const SHIPPED_CLASSES = ['flg-surface', 'flg-spinner'];
```

rồi trong mảng `requirements`, thay dòng `['ships the surface styles', css.includes('.flg-surface')],` bằng:

```ts
  ...SHIPPED_CLASSES.map((name): [string, boolean] => [`ships .${name}`, css.includes(`.${name}`)]),
```

- [ ] **Step 7: Chạy toàn bộ kiểm tra**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package`
Expected:
- test:unit PASS, kể cả 6 test Spinner chạy trên cả project `unit` và `unit-react18`.
- test:stories: 42 test PASS (7 story × 3 trình duyệt × 2 theme).
- `check:rsc` in thêm `ok   Spinner`.
- `check:dist-css` in `ok   ships .flg-spinner`.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Spinner" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 3: Button (và Slot từ chối Fragment)

**Files:**
- Create: `src/components/button/Button.tsx`, `src/components/button/index.ts`, `src/components/button/Button.stories.tsx`, `src/components/button/Button.mdx`, `src/styles/components/button.css`, `.storybook/icons.tsx`
- Test: `src/components/button/Button.test.tsx`, `src/components/button/Button.test-d.ts`, thêm 1 test vào `src/internal/slot.test.tsx`
- Modify: `src/internal/slot.tsx`, `src/index.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `Slot` (`src/internal/slot.tsx`), `dataAttr` (`src/internal/data-attr.ts`), `SpinnerIcon` (Task 2); token `--flg-accent-gradient`, `--flg-on-accent`, `--flg-glow`, `--flg-control-*`, `--flg-danger-fill`, `--flg-on-danger`, `--flg-focus-*`.
- Produces:
  - `Button`, kiểu `ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>`.
  - `type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'` và `type ButtonSize = 'sm' | 'md' | 'lg'`.
  - `interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean; asChild?: boolean }`.
  - Thuộc tính DOM: class `.flg-button`, `data-variant`, `data-size`, `data-loading` (rỗng khi đang loading). Button truyền nguyên mọi `data-*` khác xuống phần tử; IconButton (Task 4) dựa vào điều này để truyền `data-icon-only`.
  - Slot từ chối một Fragment đứng một mình, với thông điệp `` `asChild` cannot merge props into a Fragment; pass a single element. ``

- [ ] **Step 1: Viết test**

`src/components/button/Button.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders a primary, medium button that does not submit forms', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('flg-button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).not.toHaveAttribute('data-loading');
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('does not submit the surrounding form unless type="submit"', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Plain</Button>
        <Button type="submit">Send</Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Plain' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('reflects variant %s', (variant) => {
    render(<Button variant={variant}>x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
  });

  it.each(['sm', 'md', 'lg'] as const)('reflects size %s', (size) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', size);
  });

  it('uses the native disabled attribute', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Off' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps a loading button focusable but ignores clicks, Enter and form submission', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading onClick={onClick}>
          Saving
        </Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-loading', '');
    expect(button).not.toBeDisabled();
    expect(button.querySelector('.flg-spinner svg')).toHaveAttribute('aria-hidden', 'true');

    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
  });

  it('renders its child with button styling through asChild', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveClass('flg-button');
    expect(link).toHaveAttribute('data-variant', 'secondary');
    expect(link).not.toHaveAttribute('type');
  });

  it('blocks a disabled asChild link completely', () => {
    const onClick = vi.fn();
    const onLinkClick = vi.fn();
    render(
      <Button asChild disabled onClick={onClick}>
        <a href="/docs" onClick={onLinkClick}>
          Docs
        </a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    // fireEvent returns false when the default action (navigation) was prevented.
    expect(fireEvent.click(link)).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it('shows the spinner inside an asChild element while loading', () => {
    render(
      <Button asChild loading>
        <a href="/save">Save</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Save' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(link.querySelector('.flg-spinner')).not.toBeNull();
  });

  it('forwards the ref to the element it renders', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const linkRef = createRef<HTMLButtonElement>();
    render(
      <>
        <Button ref={buttonRef}>x</Button>
        <Button asChild ref={linkRef}>
          <a href="/x">y</a>
        </Button>
      </>,
    );
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(linkRef.current?.tagName).toBe('A');
  });
});
```

`src/components/button/Button.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { ButtonProps } from './Button';

test('Button accepts only the documented variants and sizes', () => {
  expectTypeOf<ButtonProps['variant']>().toEqualTypeOf<
    'primary' | 'secondary' | 'ghost' | 'danger' | undefined
  >();
  expectTypeOf<ButtonProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'link' is not a Button variant
  const unknownVariant: ButtonProps = { variant: 'link' };
  // @ts-expect-error 'xl' is not a Button size
  const unknownSize: ButtonProps = { size: 'xl' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(unknownSize).toBeObject();
});
```

Thêm vào cuối `describe('Slot', ...)` trong `src/internal/slot.test.tsx`:

```tsx
  it('renders nothing and warns when the child is a Fragment', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <Slot className="x">
        <>
          <span>a</span>
        </>
      </Slot>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] `asChild` cannot merge props into a Fragment; pass a single element.',
    );
  });
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/button src/internal/slot.test.tsx`
Expected:
- Các test Button FAIL vì không resolve được `./Button`.
- Test Fragment của Slot FAIL, vì Slot hiện vẫn clone Fragment và render `<span>a</span>`.

- [ ] **Step 3: Slot từ chối Fragment**

Trong `src/internal/slot.tsx`:
- Đổi dòng import `react` thành `import { Children, cloneElement, forwardRef, Fragment, isValidElement } from 'react';`.
- Ngay sau dòng `const child = children as ReactElement<AnyProps>;`, thêm:

```tsx
  if (child.type === Fragment) {
    devWarn('`asChild` cannot merge props into a Fragment; pass a single element.');
    return null;
  }
```

- [ ] **Step 4: Viết Button**

`src/components/button/Button.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { cloneElement, forwardRef, isValidElement } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { Slot } from '../../internal/slot';
import { SpinnerIcon } from '../spinner/SpinnerIcon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and ignores activation while keeping focus. */
  loading?: boolean;
  /** Render the single child element (for example a link) with the button's look and behaviour. */
  asChild?: boolean;
}

const spinner = (
  <span className="flg-spinner" aria-hidden="true">
    <SpinnerIcon />
  </span>
);

function withSpinner(children: ReactNode): ReactNode {
  return (
    <>
      {spinner}
      {children}
    </>
  );
}

// Runs in the capture phase so neither the button's nor an asChild element's own onClick fires,
// and preventDefault() also stops form submission and link navigation.
function blockActivation(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

/** The library's button. Never submits a form unless `type="submit"`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    asChild = false,
    disabled = false,
    type,
    className,
    children,
    ...props
  },
  ref,
) {
  const inert = loading || (asChild && disabled);
  const shared = {
    ...props,
    className: clsx('flg-button', className),
    'data-variant': variant,
    'data-size': size,
    'data-loading': dataAttr(loading),
    'aria-busy': loading || undefined,
    'aria-disabled': inert || props['aria-disabled'] || undefined,
    onClickCapture: inert ? blockActivation : props.onClickCapture,
  };

  if (asChild) {
    const child =
      loading && isValidElement<{ children?: ReactNode }>(children)
        ? cloneElement(children, undefined, withSpinner(children.props.children))
        : children;
    return (
      <Slot ref={ref as Ref<HTMLElement>} {...shared} tabIndex={disabled ? -1 : props.tabIndex}>
        {child}
      </Slot>
    );
  }

  return (
    <button ref={ref} type={type ?? 'button'} disabled={disabled} {...shared}>
      {loading ? withSpinner(children) : children}
    </button>
  );
});
```

`src/components/button/index.ts`:

```ts
export { Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button';
```

Thêm vào cuối `src/index.ts`:

```ts
export { Button } from './components/button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './components/button';
```

- [ ] **Step 5: Chạy test unit**

Run: `pnpm test:unit`
Expected: PASS, kể cả các test Button trên React 18.3 (project `unit-react18`), test kiểu `Button.test-d.ts`, và test Fragment của Slot.

- [ ] **Step 6: Viết CSS**

`src/styles/components/button.css` (theo mockup Plan 2, nút danger theo phương án B):

```css
@layer flg.components {
  .flg-button {
    --flg-button-h: var(--flg-control-h-md);
    --flg-button-px: 16px;
    --flg-button-font: var(--flg-text-sm);
    --flg-button-icon: 16px;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-sizing: border-box;
    height: var(--flg-button-h);
    padding: 0 var(--flg-button-px);
    border: 1px solid transparent;
    border-radius: var(--flg-radius-md);
    font-family: var(--flg-font-sans);
    font-size: var(--flg-button-font);
    font-weight: var(--flg-weight-semibold);
    line-height: 1;
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    transition:
      background-color var(--flg-duration-fast) var(--flg-ease),
      box-shadow var(--flg-duration-fast) var(--flg-ease),
      filter var(--flg-duration-fast) var(--flg-ease);
  }
  .flg-button[data-size='sm'] {
    --flg-button-h: var(--flg-control-h-sm);
    --flg-button-px: 12px;
    --flg-button-font: var(--flg-text-xs);
    --flg-button-icon: 14px;
  }
  .flg-button[data-size='lg'] {
    --flg-button-h: var(--flg-control-h-lg);
    --flg-button-px: 20px;
    --flg-button-font: var(--flg-text-md);
    --flg-button-icon: 18px;
  }
  .flg-button[data-icon-only] {
    width: var(--flg-button-h);
    padding: 0;
  }
  .flg-button > svg {
    width: var(--flg-button-icon);
    height: var(--flg-button-icon);
    flex: none;
  }
  /* An icon-only button shows the spinner instead of its icon while loading. */
  .flg-button[data-icon-only][data-loading] > svg {
    display: none;
  }

  .flg-button[data-variant='primary'] {
    background: var(--flg-accent-gradient);
    color: var(--flg-on-accent);
    box-shadow: var(--flg-glow);
  }
  .flg-button[data-variant='secondary'] {
    background: var(--flg-control-bg-secondary);
    border-color: var(--flg-control-border);
    color: var(--flg-text);
  }
  .flg-button[data-variant='ghost'] {
    background: transparent;
    color: var(--flg-text);
  }
  .flg-button[data-variant='danger'] {
    background: var(--flg-danger-fill);
    color: var(--flg-on-danger);
  }

  @media (hover: hover) {
    .flg-button:not(:disabled, [aria-disabled='true']):hover {
      filter: brightness(1.06);
    }
    .flg-button[data-variant='secondary']:not(:disabled, [aria-disabled='true']):hover {
      background: var(--flg-control-bg);
      filter: none;
    }
    .flg-button[data-variant='ghost']:not(:disabled, [aria-disabled='true']):hover {
      background: var(--flg-control-track);
      filter: none;
    }
  }
  .flg-button:not(:disabled, [aria-disabled='true']):active {
    filter: brightness(0.96);
  }

  .flg-button:focus-visible {
    outline: 2px solid var(--flg-focus-outline-color);
    outline-offset: 2px;
    box-shadow: var(--flg-focus-ring);
  }

  .flg-button:disabled,
  .flg-button[aria-disabled='true']:not([data-loading]) {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
  .flg-button[data-loading] {
    cursor: progress;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/button.css';` ngay sau dòng `@import './components/spinner.css';`.

Trong `src/styles/preferences.css`, thêm vào **bên trong** khối `@media (forced-colors: active) { ... }`:

```css
    .flg-button {
      border: 1px solid ButtonText;
    }
    .flg-button:disabled,
    .flg-button[aria-disabled='true']:not([data-loading]) {
      border-color: GrayText;
      color: GrayText;
    }
```

- [ ] **Step 7: Icon cho story, story và trang docs**

`.storybook/icons.tsx` (chỉ dùng trong story, không phát hành):

```tsx
import type { SVGProps } from 'react';

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
```

`src/components/button/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { PlusIcon } from '../../../.storybook/icons';
import { Button } from './Button';

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } as const;

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Save changes', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: 'Save changes' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button.matches(':focus-visible')).toBe(true);
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Delete
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving' },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole('button', { name: 'Saving' });
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
    await expect(button).toHaveAttribute('aria-busy', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AsLink: Story = {
  args: { asChild: true, variant: 'secondary', children: <a href="#docs">Read the docs</a> },
};

export const WithIcon: Story = {
  args: {
    variant: 'secondary',
    children: (
      <>
        <PlusIcon />
        New project
      </>
    ),
  },
};
```

`src/components/button/Button.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Button.stories';

<Meta of={Stories} />

# Button

```tsx
import { Button } from 'fl-glass-ui';

<Button onClick={save}>Save changes</Button>
```

<Canvas of={Stories.Default} />
<Controls />

## Variants

`primary` for the main action of a view, `secondary` for the others, `ghost` for low-emphasis
actions such as toolbars, and `danger` for actions that destroy data.

<Canvas of={Stories.Variants} />

## Sizes

<Canvas of={Stories.Sizes} />

## Loading

`loading` shows a spinner before the label, sets `aria-busy` and `aria-disabled`, and ignores
clicks, Enter and form submission. The button keeps focus, so keyboard users do not lose their
place. Change the label to say what is happening, for example "Saving".

<Canvas of={Stories.Loading} />

## Links that look like buttons

`asChild` renders the single child element instead of a `<button>`. With `disabled`, the element
gets `aria-disabled="true"`, leaves the tab order, and its clicks and navigation are blocked.

<Canvas of={Stories.AsLink} />

## Accessibility

- Renders `<button type="button">`, so it never submits a form by accident. Pass `type="submit"`
  for a form's submit button.
- Disabled buttons use the native `disabled` attribute.
- For a button that shows only an icon, use `IconButton`, which requires an accessible name.

## Do and don't

- Do keep one `primary` button per view.
- Do use `danger` only for actions that destroy data.
- Don't wrap another interactive element with `asChild`.
````

- [ ] **Step 8: Đăng ký vào các bước kiểm tra gói**

Trong `scripts/check-use-client.ts`, đổi:

```ts
const CLIENT_MODULES: readonly string[] = [];
```

thành:

```ts
const CLIENT_MODULES: readonly string[] = ['src/components/button/Button.tsx'];
```

Trong `scripts/check-dist-css.ts`, thêm `'flg-button'` vào mảng `SHIPPED_CLASSES`.

- [ ] **Step 9: Chạy toàn bộ kiểm tra**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package`
Expected:
- test:stories: 84 test PASS (14 story × 3 trình duyệt × 2 theme), không có vi phạm a11y nào.
- `check:use-client` in `use client: <N> module(s) checked, 1 client.`

- [ ] **Step 10: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Button and reject Fragment children in Slot" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 4: IconButton

**Files:**
- Create: `src/components/icon-button/IconButton.tsx`, `src/components/icon-button/index.ts`, `src/components/icon-button/IconButton.stories.tsx`, `src/components/icon-button/IconButton.mdx`
- Test: `src/components/icon-button/IconButton.test.tsx`, `src/components/icon-button/IconButton.test-d.ts`
- Modify: `src/index.ts`, `scripts/check-use-client.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `Button` và `ButtonProps` (Task 3); CSS `.flg-button[data-icon-only]` (Task 3); `devWarn`; icon trong `.storybook/icons.tsx` (Task 3).
- Produces:
  - `IconButton`, kiểu `ForwardRefExoticComponent<IconButtonProps & RefAttributes<HTMLButtonElement>>`.
  - `type IconButtonProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby'> & ({ 'aria-label': string } | { 'aria-labelledby': string })`.
  - Thông điệp cảnh báo `IconButton needs an accessible name: pass \`aria-label\` or \`aria-labelledby\`.`

- [ ] **Step 1: Viết test**

`src/components/icon-button/IconButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { IconButton } from './IconButton';
import type { IconButtonProps } from './IconButton';

const icon = <svg aria-hidden="true" />;
const WARNING =
  '[fl-glass-ui] IconButton needs an accessible name: pass `aria-label` or `aria-labelledby`.';

describe('IconButton', () => {
  beforeEach(() => {
    resetDevWarnings();
    vi.restoreAllMocks();
  });

  it('renders a square button named by aria-label', () => {
    render(<IconButton aria-label="Close">{icon}</IconButton>);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveClass('flg-button');
    expect(button).toHaveAttribute('data-icon-only', '');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('accepts aria-labelledby as its name', () => {
    render(
      <>
        <span id="close-label">Close dialog</span>
        <IconButton aria-labelledby="close-label">{icon}</IconButton>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('warns when it has no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<IconButton {...({} as IconButtonProps)}>{icon}</IconButton>);
    expect(warn).toHaveBeenCalledWith(WARNING);
  });

  it('does not warn when named', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<IconButton aria-label="Close">{icon}</IconButton>);
    expect(warn).not.toHaveBeenCalled();
  });

  it('passes variant, size and loading through to Button', () => {
    render(
      <IconButton aria-label="Add" variant="ghost" size="sm" loading>
        {icon}
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('forwards the ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton ref={ref} aria-label="Close">
        {icon}
      </IconButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
```

`src/components/icon-button/IconButton.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import type { IconButtonProps } from './IconButton';

test('IconButton requires an accessible name', () => {
  const withLabel: IconButtonProps = { 'aria-label': 'Close' };
  const withLabelledBy: IconButtonProps = { 'aria-labelledby': 'close-label' };
  // @ts-expect-error an IconButton without aria-label or aria-labelledby has no accessible name
  const unnamed: IconButtonProps = {};
  expectTypeOf(withLabel).toBeObject();
  expectTypeOf(withLabelledBy).toBeObject();
  expectTypeOf(unnamed).toBeObject();
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/icon-button`
Expected: FAIL, vì không resolve được `./IconButton`.

- [ ] **Step 3: Viết component**

`src/components/icon-button/IconButton.tsx`:

```tsx
'use client';

import { forwardRef } from 'react';
import { devWarn } from '../../internal/warn';
import { Button } from '../button/Button';
import type { ButtonProps } from '../button/Button';

export type IconButtonProps = Omit<ButtonProps, 'aria-label' | 'aria-labelledby'> &
  ({ 'aria-label': string } | { 'aria-labelledby': string });

/** A square button holding only an icon. TypeScript requires an accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(props, ref) {
    const name = props as { 'aria-label'?: string; 'aria-labelledby'?: string };
    if (!name['aria-label']?.trim() && !name['aria-labelledby']?.trim()) {
      devWarn('IconButton needs an accessible name: pass `aria-label` or `aria-labelledby`.');
    }
    return <Button ref={ref} data-icon-only="" {...props} />;
  },
);
```

`src/components/icon-button/index.ts`:

```ts
export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';
```

Thêm vào cuối `src/index.ts`:

```ts
export { IconButton } from './components/icon-button';
export type { IconButtonProps } from './components/icon-button';
```

- [ ] **Step 4: Story và trang docs**

`src/components/icon-button/IconButton.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { CloseIcon, GearIcon, MoreIcon, PlusIcon } from '../../../.storybook/icons';
import { IconButton } from './IconButton';

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' } as const;

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Add item', children: <PlusIcon />, onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Add item' })).toBeVisible();
  },
};

export const Variants: Story = {
  render: () => (
    <div style={row}>
      <IconButton aria-label="Add" variant="primary">
        <PlusIcon />
      </IconButton>
      <IconButton aria-label="Settings" variant="secondary">
        <GearIcon />
      </IconButton>
      <IconButton aria-label="More options" variant="ghost">
        <MoreIcon />
      </IconButton>
      <IconButton aria-label="Delete" variant="danger">
        <CloseIcon />
      </IconButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={row}>
      <IconButton aria-label="Close small" variant="secondary" size="sm">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Close medium" variant="secondary" size="md">
        <CloseIcon />
      </IconButton>
      <IconButton aria-label="Close large" variant="secondary" size="lg">
        <CloseIcon />
      </IconButton>
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Add item' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  },
};
```

`src/components/icon-button/IconButton.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './IconButton.stories';

<Meta of={Stories} />

# IconButton

```tsx
import { IconButton } from 'fl-glass-ui';

<IconButton aria-label="Close" variant="ghost">
  <CloseIcon />
</IconButton>
```

<Canvas of={Stories.Default} />
<Controls />

## Variants and sizes

The same `variant`, `size`, `loading` and `asChild` props as `Button`. The button is square, as
wide as it is tall.

<Canvas of={Stories.Variants} />
<Canvas of={Stories.Sizes} />

## Accessibility

- An icon alone has no name, so TypeScript requires `aria-label` or `aria-labelledby`. Without
  TypeScript, the library warns in development when both are missing.
- Mark the icon itself `aria-hidden`, so the name is not read twice.
- While `loading`, the spinner replaces the icon.

## Do and don't

- Do use a name that says what the button does ("Close dialog"), not what it shows ("X").
- Don't use an IconButton for an action that people cannot recognise from the icon alone; use a
  `Button` with text.
````

- [ ] **Step 5: Đăng ký và chạy toàn bộ kiểm tra**

Trong `scripts/check-use-client.ts`, thêm `'src/components/icon-button/IconButton.tsx'` vào `CLIENT_MODULES`. Kết quả là `['src/components/button/Button.tsx', 'src/components/icon-button/IconButton.tsx']`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package`
Expected:
- test:stories: 108 test PASS (18 story).
- `check:use-client` in `... 2 client.`
- Test kiểu `IconButton.test-d.ts` PASS. Nếu xóa dòng `@ts-expect-error`, test đó phải fail, vì `{}` không phải `IconButtonProps`.

- [ ] **Step 6: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add IconButton with a required accessible name" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 5: Badge

**Files:**
- Create: `src/components/badge/Badge.tsx`, `src/components/badge/index.ts`, `src/components/badge/Badge.stories.tsx`, `src/components/badge/Badge.mdx`, `src/styles/components/badge.css`
- Test: `src/components/badge/Badge.test.tsx`
- Modify: `src/index.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/rsc-probe.mjs`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: token `--flg-control-track`, `--flg-text`, `--flg-accent-subtle`, `--flg-accent-text`, `--flg-success|warning|danger`, `--flg-status-bg-alpha`.
- Produces:
  - `Badge`, kiểu `ForwardRefExoticComponent<BadgeProps & RefAttributes<HTMLSpanElement>>`.
  - `type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'` và `interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: BadgeVariant }`.
  - Server-safe.

- [ ] **Step 1: Viết test**

`src/components/badge/Badge.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders a neutral badge by default', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveClass('flg-badge');
    expect(badge).toHaveAttribute('data-variant', 'neutral');
  });

  it.each(['neutral', 'accent', 'success', 'warning', 'danger'] as const)(
    'reflects variant %s',
    (variant) => {
      render(<Badge variant={variant}>x</Badge>);
      expect(screen.getByText('x')).toHaveAttribute('data-variant', variant);
    },
  );

  it('joins a className and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Badge ref={ref} className="mine">
        x
      </Badge>,
    );
    expect(ref.current).toHaveClass('flg-badge', 'mine');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/badge`
Expected: FAIL, vì không resolve được `./Badge`.

- [ ] **Step 3: Viết component và CSS**

`src/components/badge/Badge.tsx`:

```tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** A short status label. Safe to render in React Server Components. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'neutral', className, ...props },
  ref,
) {
  return (
    <span ref={ref} className={clsx('flg-badge', className)} data-variant={variant} {...props} />
  );
});
```

`src/components/badge/index.ts`:

```ts
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';
```

Thêm vào cuối `src/index.ts`:

```ts
export { Badge } from './components/badge';
export type { BadgeProps, BadgeVariant } from './components/badge';
```

`src/styles/components/badge.css`:

```css
@layer flg.components {
  .flg-badge {
    --flg-badge-bg: var(--flg-control-track);
    --flg-badge-fg: var(--flg-text);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: var(--flg-radius-full);
    background: var(--flg-badge-bg);
    color: var(--flg-badge-fg);
    font-family: var(--flg-font-sans);
    font-size: var(--flg-text-2xs);
    font-weight: var(--flg-weight-semibold);
    line-height: 1.2;
    white-space: nowrap;
  }
  .flg-badge[data-variant='accent'] {
    --flg-badge-bg: var(--flg-accent-subtle);
    --flg-badge-fg: var(--flg-accent-text);
  }
  .flg-badge[data-variant='success'] {
    --flg-badge-bg: color-mix(in srgb, var(--flg-success) var(--flg-status-bg-alpha), transparent);
    --flg-badge-fg: var(--flg-success);
  }
  .flg-badge[data-variant='warning'] {
    --flg-badge-bg: color-mix(in srgb, var(--flg-warning) var(--flg-status-bg-alpha), transparent);
    --flg-badge-fg: var(--flg-warning);
  }
  .flg-badge[data-variant='danger'] {
    --flg-badge-bg: color-mix(in srgb, var(--flg-danger) var(--flg-status-bg-alpha), transparent);
    --flg-badge-fg: var(--flg-danger);
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/badge.css';` sau dòng `@import './components/button.css';`.

Trong `src/styles/preferences.css`, thêm vào bên trong khối `forced-colors`:

```css
    .flg-badge {
      border: 1px solid CanvasText;
    }
```

- [ ] **Step 4: Story và trang docs**

`src/components/badge/Badge.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Draft' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Draft')).toHaveAttribute('data-variant', 'neutral');
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="accent">Pro</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Expiring soon</Badge>
      <Badge variant="danger">Failed</Badge>
    </div>
  ),
};
```

`src/components/badge/Badge.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Badge.stories';

<Meta of={Stories} />

# Badge

```tsx
import { Badge } from 'fl-glass-ui';

<Badge variant="success">Active</Badge>
```

<Canvas of={Stories.Default} />
<Controls />

## Variants

<Canvas of={Stories.Variants} />

## Accessibility

- The text carries the meaning; the colour only reinforces it. Never rely on colour alone, for
  example a coloured dot with no text.
- The `accent` variant reproduces the approved design and is below the WCAG AA text contrast
  minimum (see the known gaps on the Accessibility page, row 7). Prefer `neutral` for long labels.

## Do and don't

- Do keep badge text to one or two words.
- Don't make a badge clickable; use a `Button` for actions.
````

- [ ] **Step 5: Đăng ký và chạy toàn bộ kiểm tra**

Trong `scripts/rsc-probe.mjs`, thêm vào cuối `CASES`:

```js
  {
    label: 'Badge',
    file: '../dist/components/badge/Badge.js',
    exportName: 'Badge',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'span', className: 'flg-badge' },
  },
```

Trong `scripts/check-dist-css.ts`, thêm `'flg-badge'` vào `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package`
Expected: test:stories cho 120 test PASS (20 story), và `check:rsc` in `ok   Badge`.

Nếu axe báo `color-contrast` cho badge `accent` (§4.9 dòng 7, một ngoại lệ đã ghi nhận), chỉ tắt rule đó cho đúng phần tử ấy. Thêm vào story `Variants`, và giữ quy tắc `region` của preview, vì mảng rule ở cấp story thay thế mảng của preview:

```tsx
  parameters: {
    a11y: {
      // Spec §4.9 row 7: the accent badge reproduces the approved mockup below AA contrast.
      config: {
        rules: [
          { id: 'region', enabled: false },
          { id: 'color-contrast', selector: '*:not(.flg-badge[data-variant="accent"])' },
        ],
      },
    },
  },
```

- [ ] **Step 6: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Badge" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 6: Avatar

**Files:**
- Create: `src/components/avatar/Avatar.tsx`, `src/components/avatar/index.ts`, `src/components/avatar/Avatar.stories.tsx`, `src/components/avatar/Avatar.mdx`, `src/styles/components/avatar.css`
- Test: `src/components/avatar/Avatar.test.tsx`
- Modify: `src/index.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/check-use-client.ts`, `scripts/check-dist-css.ts`, `tests/visual/stories.visual.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `devWarn`; token `--flg-control-track`, `--flg-text`, `--flg-text-muted`, `--flg-control-border`.
- Produces:
  - `Avatar`, kiểu `ForwardRefExoticComponent<AvatarProps & RefAttributes<HTMLSpanElement>>`.
  - `interface AvatarProps extends HTMLAttributes<HTMLSpanElement> { src?: string; alt?: string; fallback?: ReactNode; size?: 'sm' | 'md' | 'lg' }`.
  - `data-status` là `'loading' | 'loaded' | 'error'`.
  - Visual test chờ mọi ảnh tải xong và không còn `[data-status="loading"]` rồi mới chụp.

- [ ] **Step 1: Viết test**

`src/components/avatar/Avatar.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Avatar } from './Avatar';

const PHOTO = 'https://example.test/a.png';

const root = (container: HTMLElement) => container.querySelector('.flg-avatar') as HTMLElement;

describe('Avatar', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('shows the default icon without src, and stays decorative without alt', () => {
    const { container } = render(<Avatar />);
    const avatar = root(container);
    expect(avatar).toHaveAttribute('data-status', 'error');
    expect(avatar).toHaveAttribute('data-size', 'md');
    expect(avatar.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).not.toHaveAttribute('role');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('names the fallback after alt', () => {
    render(<Avatar alt="Trần Thị B" fallback="TB" />);
    const avatar = screen.getByRole('img', { name: 'Trần Thị B' });
    expect(avatar).toHaveTextContent('TB');
  });

  it('shows the fallback while the image loads, then the image', () => {
    const { container } = render(<Avatar src={PHOTO} alt="Nguyễn Văn A" fallback="NA" />);
    const avatar = root(container);
    const image = container.querySelector('img') as HTMLImageElement;
    expect(avatar).toHaveAttribute('data-status', 'loading');
    expect(avatar).toHaveAttribute('role', 'img');
    expect(avatar).toHaveTextContent('NA');

    fireEvent.load(image);
    expect(avatar).toHaveAttribute('data-status', 'loaded');
    expect(avatar).not.toHaveAttribute('role');
    expect(avatar).not.toHaveTextContent('NA');
    expect(screen.getByRole('img', { name: 'Nguyễn Văn A' }).tagName).toBe('IMG');
  });

  it('falls back when the image fails', () => {
    const { container } = render(<Avatar src={PHOTO} alt="Nguyễn Văn A" fallback="NA" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(root(container)).toHaveAttribute('data-status', 'error');
    expect(screen.getByRole('img', { name: 'Nguyễn Văn A' })).toHaveTextContent('NA');
  });

  it('shows an image that finished loading before React attached its listeners', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(64);
    const { container } = render(<Avatar src={PHOTO} alt="Nguyễn Văn A" />);
    expect(root(container)).toHaveAttribute('data-status', 'loaded');
  });

  it('goes back to the fallback when src changes, until the new image loads', () => {
    const { container, rerender } = render(<Avatar src={PHOTO} alt="A" fallback="A" />);
    fireEvent.load(container.querySelector('img') as HTMLImageElement);
    expect(root(container)).toHaveAttribute('data-status', 'loaded');
    rerender(<Avatar src="https://example.test/b.png" alt="A" fallback="A" />);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
  });

  it('warns when an image has no alt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Avatar src={PHOTO} />);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] Avatar has `src` but no `alt`; screen readers cannot tell who it shows.',
    );
  });

  it('reflects size, joins a className and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} size="lg" className="mine" />);
    expect(ref.current).toHaveClass('flg-avatar', 'mine');
    expect(ref.current).toHaveAttribute('data-size', 'lg');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/avatar`
Expected: FAIL, vì không resolve được `./Avatar`.

- [ ] **Step 3: Viết component**

`src/components/avatar/Avatar.tsx`:

```tsx
'use client';

import { clsx } from 'clsx';
import { forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { devWarn } from '../../internal/warn';

type Status = 'loading' | 'loaded' | 'error';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Who the avatar shows. Without it the avatar is decorative. */
  alt?: string;
  /** Shown until the image loads, or instead of it. Usually initials. */
  fallback?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

/** A person's picture, with initials or an icon until (or instead of) the image. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, fallback, size = 'md', className, ...props },
  ref,
) {
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'error');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    // An image that finished before React attached onLoad (cache, SSR hydration) never fires it.
    const image = imageRef.current;
    setStatus(image?.complete && image.naturalWidth > 0 ? 'loaded' : 'loading');
  }, [src]);

  if (src && !alt) {
    devWarn('Avatar has `src` but no `alt`; screen readers cannot tell who it shows.');
  }

  const showFallback = status !== 'loaded';
  const named = showFallback && Boolean(alt);
  return (
    <span
      ref={ref}
      className={clsx('flg-avatar', className)}
      data-size={size}
      data-status={status}
      role={named ? 'img' : undefined}
      aria-label={named ? alt : undefined}
      {...props}
    >
      {src ? (
        <img
          ref={imageRef}
          src={src}
          // Only the visible element carries the name: the hidden image stays unnamed until it loads.
          alt={status === 'loaded' ? (alt ?? '') : ''}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      ) : null}
      {showFallback ? (fallback ?? <PersonIcon />) : null}
    </span>
  );
});
```

`src/components/avatar/index.ts`:

```ts
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';
```

Thêm vào cuối `src/index.ts`:

```ts
export { Avatar } from './components/avatar';
export type { AvatarProps } from './components/avatar';
```

- [ ] **Step 4: Chạy test unit**

Run: `pnpm test:unit`
Expected: PASS, kể cả 8 test Avatar trên cả React 19 và React 18.3.

- [ ] **Step 5: Viết CSS**

`src/styles/components/avatar.css`:

```css
@layer flg.components {
  .flg-avatar {
    --flg-avatar-size: 32px;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: var(--flg-avatar-size);
    height: var(--flg-avatar-size);
    border-radius: var(--flg-radius-full);
    overflow: hidden;
    background: var(--flg-control-track);
    color: var(--flg-text);
    box-shadow: inset 0 0 0 1px var(--flg-control-border);
    font-family: var(--flg-font-sans);
    font-size: calc(var(--flg-avatar-size) * 0.4);
    font-weight: var(--flg-weight-semibold);
    line-height: 1;
    user-select: none;
    vertical-align: middle;
  }
  .flg-avatar[data-size='sm'] {
    --flg-avatar-size: 24px;
  }
  .flg-avatar[data-size='lg'] {
    --flg-avatar-size: 40px;
  }
  .flg-avatar > img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .flg-avatar[data-status='loading'] > img,
  .flg-avatar[data-status='error'] > img {
    opacity: 0;
  }
  .flg-avatar > svg {
    width: 60%;
    height: 60%;
    color: var(--flg-text-muted);
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/avatar.css';` sau dòng `@import './components/badge.css';`.

Trong `src/styles/preferences.css`, thêm vào bên trong khối `forced-colors`:

```css
    .flg-avatar {
      border: 1px solid CanvasText;
    }
```

- [ ] **Step 6: Story, trang docs và visual test**

`src/components/avatar/Avatar.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Avatar } from './Avatar';

const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6b37f"/><stop offset="1" stop-color="#c9576b"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fde3cf"/><path d="M12 64c2-14 10-20 20-20s18 6 20 20z" fill="#3b2a4d"/></svg>',
)}`;

const row = { display: 'flex', gap: 12, alignItems: 'center' } as const;

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  args: { src: PORTRAIT, alt: 'Nguyễn Văn A', fallback: 'NA' },
  play: async ({ canvas }) => {
    await waitFor(() =>
      expect(canvas.getByRole('img', { name: 'Nguyễn Văn A' }).tagName).toBe('IMG'),
    );
  },
};

export const Initials: Story = {
  args: { alt: 'Trần Thị B', fallback: 'TB' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Trần Thị B' })).toHaveTextContent('TB');
  },
};

export const DefaultIcon: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={row}>
      <Avatar size="sm" alt="Small" fallback="S" />
      <Avatar size="md" alt="Medium" fallback="M" />
      <Avatar size="lg" alt="Large" fallback="L" />
    </div>
  ),
};

export const BrokenImage: Story = {
  args: { src: 'data:image/png;base64,AAAA', alt: 'Lê Văn C', fallback: 'LC' },
  play: async ({ canvas }) => {
    await waitFor(() =>
      expect(canvas.getByRole('img', { name: 'Lê Văn C' })).toHaveAttribute('data-status', 'error'),
    );
  },
};
```

`src/components/avatar/Avatar.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Avatar.stories';

<Meta of={Stories} />

# Avatar

```tsx
import { Avatar } from 'fl-glass-ui';

<Avatar src={user.photo} alt={user.name} fallback="NA" />
```

<Canvas of={Stories.Image} />
<Controls />

## Fallbacks

Until the image loads, and when it fails, the avatar shows `fallback` (usually initials), or a
person icon when there is none.

<Canvas of={Stories.Initials} />
<Canvas of={Stories.BrokenImage} />

## Sizes

<Canvas of={Stories.Sizes} />

## Accessibility

- Pass `alt` with the person's name. The image uses it; while the fallback shows, the avatar
  becomes `role="img"` with that name.
- Without `alt` the avatar is decorative and exposes nothing to screen readers. Use that when the
  name is already written next to it.
- The development build warns when `src` is set without `alt`.

## Do and don't

- Do use initials as the fallback when you know the name.
- Don't put interactive content inside an avatar; wrap it in a `Button` with `asChild` instead.
````

Trong `tests/visual/stories.visual.ts`, thay hai dòng:

```ts
        const stage = page.getByTestId('flg-stage');
        await stage.waitFor();
```

bằng:

```ts
        const stage = page.getByTestId('flg-stage');
        await stage.waitFor();
        // Avatars swap fallback for image when it loads; wait until every image has settled.
        await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
        await expect(page.locator('[data-status="loading"]')).toHaveCount(0);
```

- [ ] **Step 7: Đăng ký và chạy toàn bộ kiểm tra**

Trong `scripts/check-use-client.ts`, thêm `'src/components/avatar/Avatar.tsx'` vào `CLIENT_MODULES`. Trong `scripts/check-dist-css.ts`, thêm `'flg-avatar'` vào `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected:
- test:stories: 150 test PASS (25 story), không có vi phạm axe nào. Story `DefaultIcon` không có `role="img"`.
- `check:use-client` in `... 3 client.`
- `--list` liệt kê 200 test (25 story × 2 theme × 4 chế độ). Không chạy visual test trên máy Windows.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Avatar with image loading states" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 7: Divider

**Files:**
- Create: `src/components/divider/Divider.tsx`, `src/components/divider/index.ts`, `src/components/divider/Divider.stories.tsx`, `src/components/divider/Divider.mdx`, `src/styles/components/divider.css`
- Test: `src/components/divider/Divider.test.tsx`
- Modify: `src/index.ts`, `src/styles/index.css`, `src/styles/preferences.css`, `scripts/rsc-probe.mjs`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: token `--flg-control-border`; `Button` (Task 3), chỉ dùng trong story.
- Produces:
  - `Divider`, kiểu `ForwardRefExoticComponent<DividerProps & RefAttributes<HTMLElement>>`.
  - `interface DividerProps extends HTMLAttributes<HTMLElement> { orientation?: 'horizontal' | 'vertical'; decorative?: boolean }`.
  - Server-safe.

- [ ] **Step 1: Viết test**

`src/components/divider/Divider.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders a horizontal <hr> separator by default', () => {
    render(<Divider />);
    const separator = screen.getByRole('separator');
    expect(separator.tagName).toBe('HR');
    expect(separator).toHaveClass('flg-divider');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('hides a decorative horizontal divider from assistive technology', () => {
    const { container } = render(<Divider decorative />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(container.querySelector('hr')).toHaveAttribute('role', 'none');
  });

  it('renders a vertical separator with its orientation', () => {
    render(<Divider orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator.tagName).toBe('DIV');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });

  it('hides a decorative vertical divider from assistive technology', () => {
    const { container } = render(<Divider orientation="vertical" decorative />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(container.querySelector('.flg-divider')).toHaveAttribute('aria-hidden', 'true');
  });

  it('joins a className and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<Divider ref={ref} className="mine" />);
    expect(ref.current).toHaveClass('flg-divider', 'mine');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/divider`
Expected: FAIL, vì không resolve được `./Divider`.

- [ ] **Step 3: Viết component và CSS**

`src/components/divider/Divider.tsx`:

```tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  orientation?: 'horizontal' | 'vertical';
  /** Purely visual: hidden from assistive technology. */
  decorative?: boolean;
}

/** A thin line between content. Safe to render in React Server Components. */
export const Divider = forwardRef<HTMLElement, DividerProps>(function Divider(
  { orientation = 'horizontal', decorative = false, className, ...props },
  ref,
) {
  const classes = clsx('flg-divider', className);
  if (orientation === 'vertical') {
    const semantics = decorative
      ? { 'aria-hidden': true }
      : { role: 'separator', 'aria-orientation': 'vertical' as const };
    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        className={classes}
        data-orientation="vertical"
        {...semantics}
        {...props}
      />
    );
  }
  return (
    <hr
      ref={ref as Ref<HTMLHRElement>}
      className={classes}
      data-orientation="horizontal"
      role={decorative ? 'none' : undefined}
      {...props}
    />
  );
});
```

`src/components/divider/index.ts`:

```ts
export { Divider } from './Divider';
export type { DividerProps } from './Divider';
```

Thêm vào cuối `src/index.ts`:

```ts
export { Divider } from './components/divider';
export type { DividerProps } from './components/divider';
```

`src/styles/components/divider.css`:

```css
@layer flg.components {
  .flg-divider {
    flex: none;
    margin: 0;
    border: 0;
    background: var(--flg-control-border);
  }
  .flg-divider[data-orientation='horizontal'] {
    width: 100%;
    height: 1px;
  }
  .flg-divider[data-orientation='vertical'] {
    width: 1px;
    align-self: stretch;
    min-height: 1em;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/divider.css';` sau dòng `@import './components/avatar.css';`.

Trong `src/styles/preferences.css`, thêm vào bên trong khối `forced-colors`:

```css
    .flg-divider {
      background: CanvasText;
    }
```

- [ ] **Step 4: Story và trang docs**

`src/components/divider/Divider.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from '../button/Button';
import { Divider } from './Divider';

const meta = {
  title: 'Components/Divider',
  component: Divider,
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <span>Account</span>
      <Divider {...args} />
      <span>Billing</span>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('separator')).toBeVisible();
  },
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button variant="ghost" size="sm">
        Edit
      </Button>
      <Divider orientation="vertical" />
      <Button variant="ghost" size="sm">
        Share
      </Button>
      <Divider orientation="vertical" />
      <Button variant="ghost" size="sm">
        Export
      </Button>
    </div>
  ),
};

export const Decorative: Story = {
  args: { decorative: true },
  render: (args) => (
    <div style={{ display: 'grid', gap: 12, width: 320 }}>
      <span>Above</span>
      <Divider {...args} />
      <span>Below</span>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('separator')).toBeNull();
  },
};
```

`src/components/divider/Divider.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Divider.stories';

<Meta of={Stories} />

# Divider

```tsx
import { Divider } from 'fl-glass-ui';

<Divider />
<Divider orientation="vertical" />
```

<Canvas of={Stories.Horizontal} />
<Controls />

## Vertical

A vertical divider stretches to the height of its flex row.

<Canvas of={Stories.Vertical} />

## Accessibility

- A divider is a `separator`: an `<hr>` horizontally, `role="separator"` with
  `aria-orientation="vertical"` vertically.
- Pass `decorative` when the line only adds visual rhythm and separates nothing meaningful; it is
  then hidden from screen readers.
````

- [ ] **Step 5: Đăng ký và chạy toàn bộ kiểm tra**

Trong `scripts/rsc-probe.mjs`, thêm vào cuối `CASES`:

```js
  {
    label: 'Divider',
    file: '../dist/components/divider/Divider.js',
    exportName: 'Divider',
    element: (C) => createElement(C, null),
    expect: { type: 'hr', className: 'flg-divider' },
  },
  {
    label: 'Divider vertical',
    file: '../dist/components/divider/Divider.js',
    exportName: 'Divider',
    element: (C) => createElement(C, { orientation: 'vertical' }),
    expect: { type: 'div', className: 'flg-divider' },
  },
```

Trong `scripts/check-dist-css.ts`, thêm `'flg-divider'` vào `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package`
Expected: test:stories cho 168 test PASS (28 story), và `check:rsc` in `ok   Divider` cùng `ok   Divider vertical`.

- [ ] **Step 6: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Divider" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 8: Card (cùng trang docs của Surface)

**Files:**
- Create: `src/components/card/Card.tsx`, `src/components/card/index.ts`, `src/components/card/Card.stories.tsx`, `src/components/card/Card.mdx`, `src/components/surface/Surface.mdx`, `src/styles/components/card.css`
- Test: `src/components/card/Card.test.tsx`
- Modify: `src/index.ts`, `src/styles/index.css`, `scripts/rsc-probe.mjs`, `scripts/check-dist-css.ts`, `.size-limit.json`

**Interfaces:**
- Consumes: `Surface` (Plan 1), `Slot`; trong story còn dùng `Button`, `Badge` và `Avatar`.
- Produces (tất cả server-safe):
  - `Card` (`CardProps extends HTMLAttributes<HTMLDivElement> { asChild?: boolean }`): `.flg-surface.flg-card`.
  - `CardHeader` (`div.flg-card-header`).
  - `CardTitle` (`CardTitleProps extends HTMLAttributes<HTMLHeadingElement> { asChild?: boolean }`; mặc định là `<h3>`).
  - `CardDescription` (`p.flg-card-description`).
  - `CardContent` (`div.flg-card-content`).
  - `CardFooter` (`div.flg-card-footer`).
  - Kiểu props: `CardProps`, `CardHeaderProps`, `CardTitleProps`, `CardDescriptionProps`, `CardContentProps`, `CardFooterProps`.

- [ ] **Step 1: Viết test**

`src/components/card/Card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

describe('Card', () => {
  it('renders a glass surface with the card layout and its parts', () => {
    render(
      <Card aria-label="Plan">
        <CardHeader>
          <CardTitle>Upgrade</CardTitle>
          <CardDescription>More sync</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>,
    );
    const card = screen.getByLabelText('Plan');
    expect(card).toHaveClass('flg-surface', 'flg-card');
    expect(screen.getByRole('heading', { level: 3, name: 'Upgrade' })).toHaveClass(
      'flg-card-title',
    );
    expect(screen.getByText('More sync').tagName).toBe('P');
    expect(screen.getByText('More sync')).toHaveClass('flg-card-description');
    expect(screen.getByText('Body')).toHaveClass('flg-card-content');
    expect(screen.getByText('Actions')).toHaveClass('flg-card-footer');
    expect(card.querySelector('.flg-card-header')).not.toBeNull();
  });

  it('renders a different element with asChild on Card and CardTitle', () => {
    render(
      <Card asChild>
        <section aria-labelledby="t">
          <CardTitle asChild>
            <h2 id="t">Billing</h2>
          </CardTitle>
        </section>
      </Card>,
    );
    const region = screen.getByRole('region', { name: 'Billing' });
    expect(region).toHaveClass('flg-surface', 'flg-card');
    expect(screen.getByRole('heading', { level: 2, name: 'Billing' })).toHaveClass(
      'flg-card-title',
    );
  });

  it('forwards refs and joins class names', () => {
    const cardRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    render(
      <Card ref={cardRef} className="mine">
        <CardTitle ref={titleRef}>T</CardTitle>
      </Card>,
    );
    expect(cardRef.current).toHaveClass('flg-card', 'mine');
    expect(titleRef.current?.tagName).toBe('H3');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/card`
Expected: FAIL, vì không resolve được `./Card`.

- [ ] **Step 3: Viết component và CSS**

`src/components/card/Card.tsx`:

```tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';
import { Slot } from '../../internal/slot';
import { Surface } from '../surface/Surface';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element instead of a `div`. */
  asChild?: boolean;
}
export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Render the single child element (another heading level) instead of an `h3`. */
  asChild?: boolean;
}
export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

/** A glass panel with the card layout. Safe to render in React Server Components. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref,
) {
  return <Surface ref={ref} className={clsx('flg-card', className)} {...props} />;
});

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-header', className)} {...props} />;
});

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { asChild = false, className, children, ...props },
  ref,
) {
  const classes = clsx('flg-card-title', className);
  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <h3 ref={ref} className={classes} {...props}>
      {children}
    </h3>
  );
});

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, ...props }, ref) {
    return <p ref={ref} className={clsx('flg-card-description', className)} {...props} />;
  },
);

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-content', className)} {...props} />;
});

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-footer', className)} {...props} />;
});
```

`src/components/card/index.ts`:

```ts
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';
export type {
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from './Card';
```

Thêm vào cuối `src/index.ts`:

```ts
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/card';
export type {
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from './components/card';
```

`src/styles/components/card.css` (padding 18px và gap 13px theo spec §4.2.1):

```css
@layer flg.components {
  .flg-card {
    display: flex;
    flex-direction: column;
    gap: 13px;
    padding: 18px;
  }
  .flg-card-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .flg-card-title {
    margin: 0;
    color: var(--flg-text);
    font-size: var(--flg-text-md);
    font-weight: var(--flg-weight-semibold);
    line-height: 1.3;
  }
  .flg-card-description {
    margin: 0;
    color: var(--flg-text-muted);
    font-size: var(--flg-text-xs);
    line-height: 1.45;
  }
  .flg-card-content {
    font-size: var(--flg-text-sm);
    line-height: 1.5;
  }
  .flg-card-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
}
```

Trong `src/styles/index.css`, thêm `@import './components/card.css';` sau dòng `@import './components/divider.css';`.

- [ ] **Step 4: Story và trang docs (Card và Surface)**

`src/components/card/Card.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Avatar } from '../avatar/Avatar';
import { Badge } from '../badge/Badge';
import { Button } from '../button/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { style: { width: 380 } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>Unlimited sync, priority support and a year of history.</CardDescription>
      </CardHeader>
      <CardContent>Your plan renews monthly. Cancel any time.</CardContent>
      <CardFooter>
        <Button variant="ghost">Not now</Button>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { name: 'Upgrade to Pro' })).toBeVisible();
  },
};

/** The composition from the approved mockup: avatar, name, plan and an accent badge. */
export const Composition: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>Unlimited sync, priority support and a year of history.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar alt="Nguyễn Văn A" fallback="NA" />
          <div>
            <div style={{ fontWeight: 600 }}>Nguyễn Văn A</div>
            <div style={{ color: 'var(--flg-text-muted)', fontSize: 'var(--flg-text-xs)' }}>
              Current plan: Free
            </div>
          </div>
          <Badge variant="accent" style={{ marginLeft: 'auto' }}>
            Pro
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Not now</Button>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  ),
};

export const Semantic: Story = {
  render: (args) => (
    <Card {...args} asChild>
      <section aria-labelledby="billing-title">
        <CardHeader>
          <CardTitle asChild>
            <h2 id="billing-title">Billing</h2>
          </CardTitle>
          <CardDescription>Rendered as a section with an h2.</CardDescription>
        </CardHeader>
      </section>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('region', { name: 'Billing' })).toBeVisible();
  },
};
```

Nếu axe báo `color-contrast` cho badge `accent` trong `Composition` (§4.9 dòng 7), thêm đúng khối `parameters.a11y` của Task 5 Step 5 vào story `Composition`.

`src/components/card/Card.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Card.stories';

<Meta of={Stories} />

# Card

```tsx
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'fl-glass-ui';

<Card>
  <CardHeader>
    <CardTitle>Upgrade to Pro</CardTitle>
    <CardDescription>Unlimited sync and priority support.</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>
    <Button variant="ghost">Not now</Button>
    <Button>Upgrade</Button>
  </CardFooter>
</Card>
```

<Canvas of={Stories.Default} />
<Controls />

## Composition

The parts are separate exports, so they work in React Server Components. Put anything inside
`CardContent`.

<Canvas of={Stories.Composition} />

## Semantics

`Card` renders a `div` and `CardTitle` an `h3`. Use `asChild` to pick the right elements for your
page outline, for example a `section` labelled by an `h2`.

<Canvas of={Stories.Semantic} />

## Do and don't

- Do keep the heading level consistent with the rest of the page.
- Don't nest cards inside cards: every card is a glass layer, and blur layers cost GPU time.
````

`src/components/surface/Surface.mdx`:

````mdx
import { Canvas, Controls, Meta } from '@storybook/addon-docs/blocks';
import * as Stories from './Surface.stories';

<Meta of={Stories} />

# Surface

The glass layer every panel builds on: tint, blur, border gradient, noise and shadow, all from
theme tokens. `Card` is a `Surface` with a layout.

```tsx
import { Surface } from 'fl-glass-ui';

<Surface style={{ padding: 18 }}>Content</Surface>
```

<Canvas of={Stories.Default} />
<Controls />

## Other elements

`asChild` renders the single child element with the glass styles.

<Canvas of={Stories.AsSection} />

## Nested themes

A subtree with `data-flg-theme` inside a surface gets that theme's glass.

<Canvas of={Stories.NestedTheme} />

## Accessibility and performance

- A surface has no role. Give it one through `asChild` (a `section` with a heading, an `aside`)
  when it is a landmark.
- Each surface blurs what is behind it, which costs GPU time. Avoid nesting surfaces, and avoid
  long lists of them.
- Without `backdrop-filter` support, or with `prefers-reduced-transparency: reduce`, the surface
  becomes almost opaque automatically.
````

- [ ] **Step 5: Đăng ký và chạy toàn bộ kiểm tra**

Trong `scripts/rsc-probe.mjs`, thêm vào cuối `CASES`:

```js
  {
    label: 'Card',
    file: '../dist/components/card/Card.js',
    exportName: 'Card',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-surface flg-card' },
  },
  {
    label: 'CardHeader',
    file: '../dist/components/card/Card.js',
    exportName: 'CardHeader',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-card-header' },
  },
  {
    label: 'CardTitle asChild',
    file: '../dist/components/card/Card.js',
    exportName: 'CardTitle',
    element: (C) => createElement(C, { asChild: true }, createElement('h2', null, 'x')),
    expect: { type: 'h2', className: 'flg-card-title' },
  },
  {
    label: 'CardDescription',
    file: '../dist/components/card/Card.js',
    exportName: 'CardDescription',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'p', className: 'flg-card-description' },
  },
  {
    label: 'CardContent',
    file: '../dist/components/card/Card.js',
    exportName: 'CardContent',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-card-content' },
  },
  {
    label: 'CardFooter',
    file: '../dist/components/card/Card.js',
    exportName: 'CardFooter',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-card-footer' },
  },
```

Trong `scripts/check-dist-css.ts`, thêm `'flg-card'` vào `SHIPPED_CLASSES`.

Run: `pnpm test:unit && pnpm typecheck && pnpm lint && pnpm test:stories && pnpm build && pnpm size:record && pnpm check:package && pnpm build-storybook`
Expected:
- test:stories: 186 test PASS (31 story).
- `check:rsc` in thêm 6 dòng `ok` của Card.
- `storybook-static/index.json` có `foundation-surface--docs` (nay lấy từ `Surface.mdx`) và `components-card--docs`.

- [ ] **Step 6: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Card and document Surface" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```

---

### Task 9: Khóa API công khai, gia cố kiểm tra gói, cập nhật docs

**Files:**
- Create: `src/index.test.ts`
- Modify: `scripts/check-use-client.ts`, `src/docs/GettingStarted.mdx`, `README.md`

**Interfaces:**
- Consumes: mọi export của Task 2–8.
- Produces:
  - Danh sách export công khai được khóa bằng test.
  - `check-use-client` fail khi một module được phát hành (nằm dưới `src/components/` hoặc `src/internal/`, hoặc là `src/index.ts`) không có file build tương ứng.

- [ ] **Step 1: Viết test khóa API**

`src/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as api from './index';

describe('public API', () => {
  it('exports exactly the documented components and nothing internal', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Avatar',
      'Badge',
      'Button',
      'Card',
      'CardContent',
      'CardDescription',
      'CardFooter',
      'CardHeader',
      'CardTitle',
      'Divider',
      'IconButton',
      'Spinner',
      'Surface',
    ]);
  });
});
```

Run: `pnpm vitest run --project unit src/index.test.ts`
Expected: PASS ngay. Test này khóa trạng thái hiện tại. Thử thêm tạm `export { Slot } from './internal/slot';` vào `src/index.ts` thì test phải FAIL. Hoàn tác bằng `git checkout src/index.ts`.

- [ ] **Step 2: Gia cố `check-use-client`**

Trong `scripts/check-use-client.ts`, ngay sau khai báo `CLIENT_MODULES`, thêm:

```ts
/** Modules tsdown must emit: everything reachable from src/index.ts lives under these paths. */
const isShipped = (file: string) =>
  file === 'src/index.ts' || file.startsWith('src/components/') || file.startsWith('src/internal/');
```

rồi đổi nhánh:

```ts
  } else if (expected) {
    problems.push(`${out}: missing build output for a client module.`);
  }
```

thành:

```ts
  } else if (expected || isShipped(file)) {
    problems.push(`${out}: missing build output${expected ? ' for a client module' : ''}.`);
  }
```

Kiểm tra rằng bước này thật sự bắt được lỗi:

```bash
pnpm build && pnpm check:use-client
rm dist/internal/slot.js && pnpm check:use-client; echo "exit=$?"
pnpm build && pnpm check:use-client
```

Expected:
- Lần chạy đầu PASS.
- Lần chạy thứ hai in `dist/internal/slot.js: missing build output.` cùng `exit=1`.
- Lần chạy thứ ba PASS trở lại.

- [ ] **Step 3: Cập nhật docs**

Trong `src/docs/GettingStarted.mdx`, thay khối dưới tiêu đề `## Use a component` (từ dòng `## Use a component` đến hết khối code ngay sau nó) bằng:

````mdx
## Use a component

```tsx
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from 'fl-glass-ui';

export function Upgrade() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
      </CardHeader>
      <CardContent>Unlimited sync and priority support.</CardContent>
      <CardFooter>
        <Button variant="ghost">Not now</Button>
        <Button>Upgrade</Button>
      </CardFooter>
    </Card>
  );
}
```

Available today: Surface, Card, Button, IconButton, Badge, Avatar, Divider and Spinner. Form
controls arrive next.
````

Trong `README.md`, thay dòng `> Status: 0.x. The foundation is in place; components land phase by phase.` bằng:

```md
> Status: 0.x, not yet published. Available: Surface, Card, Button, IconButton, Badge, Avatar,
> Divider and Spinner. Form controls come next.
```

rồi thay khối ví dụ dưới `## Use` bằng:

```md
    import 'fl-glass-ui/styles.css';
    import { Button, Card, CardContent, CardFooter } from 'fl-glass-ui';

    export function Upgrade() {
      return (
        <Card>
          <CardContent>Unlimited sync and priority support.</CardContent>
          <CardFooter>
            <Button>Upgrade</Button>
          </CardFooter>
        </Card>
      );
    }
```

- [ ] **Step 4: Chạy toàn bộ chuỗi kiểm tra**

Run:

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit && pnpm check:contrast && pnpm build && pnpm size:record && pnpm check:package && pnpm test:stories && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list
```

Expected:
- Mọi lệnh exit 0.
- test:stories: 186 PASS.
- `--list` liệt kê 248 test (31 story × 8).
- `check:use-client` in `... 3 client.`
- `check:rsc` in 13 dòng `ok`.

Có hai việc không làm được ở máy này, cần ghi lại để làm trên PR:
- **Ảnh chuẩn visual cho các story mới.** Job `visual` trên PR sẽ fail cho tới khi chạy workflow "Update visual baselines" trên nhánh của PR. Workflow này đã có trên `main` nên chạy thủ công được.
- **Kiểm tra screen reader thủ công** cho Button, IconButton, Avatar, Badge, Divider, Spinner và Card. Ghi "not tested" trong PR nếu không có NVDA hoặc VoiceOver.

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add -A
git commit -m "test: lock the public API and require build output for shipped modules" -m "Co-Authored-By: <model> <noreply@anthropic.com>"
```
