# fl-glass-ui: Plan 1, Nền móng (giai đoạn 0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng toàn bộ nền móng của `fl-glass-ui`. Gồm: hệ token và theme sinh từ một nguồn duy nhất, kiểm tra tương phản tự động, primitive `Slot`, component `Surface`, pipeline build và kiểm tra gói, Storybook có test trên trình duyệt thật, visual regression, CI/CD và tài liệu repo.

**Architecture:** Mọi token nằm trong `src/styles/theme/values.ts`. Script sinh ra `src/styles/generated/theme.css`; script kiểm tra tương phản đọc thẳng file TS này. Thư viện là một package ESM duy nhất, build bằng tsdown (giữ cấu trúc module), còn CSS build bằng Lightning CSS. Storybook 10 vừa là playground, vừa là trang docs, vừa là nguồn test trên trình duyệt thật (addon Vitest) và visual regression (Playwright).

**Tech Stack:** React 19 (dev; peer `^18.3.0 || ^19.0.0`), TypeScript 6.0, tsdown 0.23, Lightning CSS 1.33, Vitest 5 (jsdom và browser mode với Playwright 1.63), Storybook 10.6, ESLint 9.39, Prettier 3, Changesets 3, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-01-fl-glass-ui-phase-0-1-design.md`. Người thực thi đọc cả spec lẫn plan. Mockup chuẩn nằm ở `docs/superpowers/specs/mockups/`.

**Phạm vi:** Plan này chỉ làm giai đoạn 0. Có một chỗ lệch có chủ đích so với spec §5: `FieldContext`/`useFieldProps` được dời sang Plan 2. Lý do là chỉ `Field` và các control dùng tới chúng, nên sẽ viết chung với `Field`, theo nguyên tắc đặt code ở đúng task sử dụng nó. Plan 2 (14 mục component của giai đoạn 1, fixtures Vite và Next.js, changeset `0.1.0`) sẽ được viết **sau khi** plan này chạy xong, dựa trên cấu hình công cụ đã được kiểm chứng ở đây.

## Global Constraints

- Tên package `fl-glass-ui`; chỉ ESM; `exports` gồm `.` và `./styles.css`; `"sideEffects": ["**/*.css"]`.
- `peerDependencies`: `react` và `react-dom` là `^18.3.0 || ^19.0.0`. Runtime dependency **chỉ có** `clsx`. Không thêm `@floating-ui/dom` ở giai đoạn 0–1.
- browserslist: `last 2 Chrome versions, last 2 Edge versions, last 2 Firefox versions, last 2 Safari versions, Safari >= 16.4, iOS >= 16.4`.
- Class có tiền tố `flg-`, CSS custom property có tiền tố `--flg-`. Biến thể dùng data-attribute.
- Toàn bộ CSS nằm trong các layer con theo đúng thứ tự `flg.tokens, flg.theme, flg.base, flg.components, flg.preferences`.
- Theme chọn bằng `data-flg-theme="light" | "dark"`. Không có attribute thì theo hệ điều hành.
- **Mockup lock:** giá trị token mặc định phải bằng đúng mockup đã duyệt (spec §4.3). **Không được đổi** một token mockup nào nếu chủ dự án chưa duyệt. Chỉ những token ghi *(ngoài mockup)* mới được chỉnh để qua kiểm tra tương phản.
- Chỉ `Surface` và `Card` (về sau thêm overlay) được dùng `backdrop-filter`.
- `"use client"` chỉ xuất hiện trên các module thuộc danh sách client ở spec §6.2. Module server-safe không được dùng hook hay context.
- Cảnh báo dev đi qua `devWarn`, có tiền tố `[fl-glass-ui] `, chạy khi `process.env.NODE_ENV !== 'production'`. Lib không throw khi người dùng dùng sai.
- Node 24 LTS; pnpm 10 (`"packageManager": "pnpm@10.34.6"`).
- TypeScript **6.0.x** với `strict`. TS 7 không dùng được, vì `typescript-eslint@8.71` chỉ hỗ trợ `>=4.8.4 <6.1.0`.
- ESLint **9.39**, vì `eslint-plugin-jsx-a11y@6.10.2` chỉ hỗ trợ đến ESLint 9.
- Giấy phép MIT.
- Commit theo Conventional Commits. Commit do agent tạo phải kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Không** publish npm, **không** tạo GitHub repo hay remote, **không** push. Các việc này do chủ dự án làm. `package.json` giữ `"private": true` cho tới khi chủ dự án tự bỏ đi trước lần publish đầu tiên. Nhờ vậy workflow Release không thể vô tình publish.
- Nếu `pnpm add` hoặc `pnpm install` in ra `Ignored build scripts: <tên>`, thêm `<tên>` vào `"pnpm": { "onlyBuiltDependencies": [...] }` trong `package.json`, rồi chạy lại `pnpm install`.

## Review Focus

1. **Một subtree `data-flg-theme` lồng trong theme khác** (sidebar tối trong trang sáng) phải dùng token suy ra (`--flg-glass-filter`, `--flg-accent-gradient`) theo giá trị của chính nó, không kế thừa từ `:root`. Test nằm ở Task 3 (selector của khối derived) và Task 7 (story `NestedTheme` đọc computed style).
2. **Hệ điều hành ở dark mode và trang không đặt `data-flg-theme`** phải nhận đúng bộ token của dark, kể cả ở `prefers-contrast: more`. Test ở Task 3 so sánh từng khai báo của khối auto-dark với khối dark.
3. **Fallback (không có `backdrop-filter`, `prefers-reduced-transparency`) và `prefers-contrast: more` phải áp dụng được bên trong subtree theme lồng nhau.** Test ở Task 3 (selector `:root, [data-flg-theme]`) và Task 7 (story `SolidFallback`).
4. **`asChild` với một child mang sẵn `className`, `style`, `ref`, `onClick`, kể cả child gọi `preventDefault()`.** Kết quả phải gộp đúng thứ tự và không mất ref của child. Test ở Task 2.
5. **Người dùng import `fl-glass-ui/styles.css` trong một app không có PostCSS hay Lightning CSS.** File phải tự đủ: không còn `@import`, đã có `-webkit-backdrop-filter`, có khai báo layer, không lẫn CSS giả lập của Storybook. Kiểm tra ở Task 6 (`check-dist-css`).

---

## Bản đồ file

| File | Trách nhiệm |
|---|---|
| `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitattributes`, `.node-version`, `LICENSE` | Cấu hình repo và công cụ |
| `vitest.config.ts`, `vitest.setup.ts` | Các project test: `unit`, `scripts`, `storybook-light`, `storybook-dark` |
| `src/internal/data-attr.ts`, `warn.ts`, `compose-event-handlers.ts`, `merge-refs.ts`, `slot.tsx` | Primitives nội bộ, không export |
| `src/styles/theme/values.ts` | Nguồn duy nhất của mọi token |
| `scripts/lib/theme-css.ts`, `scripts/build-theme.ts` | Sinh `generated/theme.css`, `generated/simulate.css`, và đoạn CSS AA cho docs |
| `src/styles/index.css`, `utilities.css`, `surface.css`, `preferences.css` | CSS viết tay |
| `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `scripts/check-contrast.ts` | Kiểm tra tương phản (spec §7, lớp 4) |
| `src/components/surface/*` | Component `Surface` |
| `tsdown.config.ts`, `scripts/build-css.ts`, `scripts/lib/use-client.ts`, `scripts/post-build-use-client.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs`, `scripts/check-dist-css.ts`, `scripts/record-size-limits.ts`, `.size-limit.json` | Build và kiểm tra gói |
| `.storybook/main.ts`, `preview.tsx`, `stage.css` | Storybook: toolbar, decorator nền, a11y |
| `src/docs/*.mdx`, `TokenTable.tsx`, `ExceptionTable.tsx` | Trang docs sinh từ dữ liệu thật |
| `playwright.visual.config.ts`, `tests/visual/stories.visual.ts`, `scripts/serve-static.mjs`, `scripts/visual.sh` | Visual regression |
| `.github/workflows/*.yml`, `.github/pull_request_template.md`, `.changeset/config.json`, `README.md`, `CONTRIBUTING.md` | CI/CD và tài liệu repo |

---

### Task 1: Scaffold repo + tiện ích nội bộ

**Files:**
- Create: `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitattributes`, `.node-version`, `LICENSE`, `vitest.config.ts`, `vitest.setup.ts`, `src/index.ts`
- Create: `src/internal/data-attr.ts`, `src/internal/warn.ts`, `src/internal/compose-event-handlers.ts`, `src/internal/merge-refs.ts`
- Test: `src/internal/data-attr.test.ts`, `src/internal/data-attr.test-d.ts`, `src/internal/warn.test.ts`, `src/internal/compose-event-handlers.test.ts`, `src/internal/merge-refs.test.tsx`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: không có.
- Produces:
  - `dataAttr(condition: boolean | undefined): '' | undefined`
  - `devWarn(message: string): void`, `resetDevWarnings(): void` (chỉ dùng trong test)
  - `composeEventHandlers<E extends { defaultPrevented: boolean }>(userHandler: ((event: E) => void) | undefined, internalHandler: ((event: E) => void) | undefined): (event: E) => void`
  - `mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T>`

- [ ] **Step 1: Kiểm tra pnpm 10**

Chạy trong thư mục repo: `pnpm --version`
Kết quả mong đợi: `10.x`. Nếu ra `9.x`, chạy `corepack enable` rồi kiểm tra lại. Nếu `corepack enable` báo lỗi quyền, chạy `npm install -g pnpm@10.34.6`.

- [ ] **Step 2: Tạo các file cấu hình**

`package.json`:

```json
{
  "name": "fl-glass-ui",
  "version": "0.0.0",
  "private": true,
  "description": "Glassmorphism UI components for React.",
  "license": "MIT",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "packageManager": "pnpm@10.34.6",
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run --project unit --project scripts"
  },
  "peerDependencies": {
    "react": "^18.3.0 || ^19.0.0",
    "react-dom": "^18.3.0 || ^19.0.0"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "scripts", "tests", ".storybook", "*.ts"]
}
```

`eslint.config.js`:

```js
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist',
    'storybook-static',
    'coverage',
    'test-results',
    'playwright-report',
    'src/styles/generated',
    'docs/superpowers/specs/mockups',
    'fixtures/*/node_modules',
    'fixtures/*/dist',
    'fixtures/*/.next',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
]);
```

`.prettierrc.json`:

```json
{ "singleQuote": true, "printWidth": 100, "trailingComma": "all" }
```

`.prettierignore`:

```
dist
storybook-static
coverage
test-results
playwright-report
pnpm-lock.yaml
src/styles/generated
docs/superpowers
tests/visual/__screenshots__
```

`.gitattributes`:

```
* text=auto eol=lf
*.png binary
```

`.node-version`:

```
24
```

`LICENSE`:

```
MIT License

Copyright (c) 2026 fl-glass-ui contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.ts'],
          typecheck: { enabled: true, include: ['src/**/*.test-d.ts'], tsconfig: './tsconfig.json' },
        },
      },
      {
        extends: true,
        test: { name: 'scripts', environment: 'node', include: ['scripts/**/*.test.ts'] },
      },
    ],
  },
});
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
```

`src/index.ts`:

```ts
export {};
```

Thêm vào cuối `.gitignore`:

```
# Generated theme CSS (scripts/build-theme.ts)
src/styles/generated/
*.log
```

- [ ] **Step 3: Cài dependency**

```bash
pnpm add clsx@2.1.1
pnpm add -D react@19.3.0 react-dom@19.3.0 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24 typescript@6.0.3 eslint@9.39.5 @eslint/js@9.39.5 typescript-eslint@8.71.0 eslint-plugin-jsx-a11y@6.10.2 eslint-plugin-react-hooks@7.1.1 globals@17.13.0 prettier@3.9.9 vitest@5.0.3 jsdom@30.1.1 @testing-library/react@16.3.3 @testing-library/dom@10 @testing-library/jest-dom@7.0.1 @testing-library/user-event@14.6.7 @vitejs/plugin-react@6.1.1 vite@8.3.1 tsx@4.23.15
```

Kết quả mong đợi: cài xong, không có lỗi. Nếu pnpm in ra `Ignored build scripts: <tên>`, thêm khối `"pnpm": { "onlyBuiltDependencies": ["<tên>"] }` vào `package.json`, rồi chạy lại `pnpm install`.

- [ ] **Step 4: Viết test cho các tiện ích**

`src/internal/data-attr.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { dataAttr } from './data-attr';

describe('dataAttr', () => {
  it('returns an empty string for true so React renders a bare attribute', () => {
    expect(dataAttr(true)).toBe('');
  });

  it('returns undefined for false or undefined so React omits the attribute', () => {
    expect(dataAttr(false)).toBeUndefined();
    expect(dataAttr(undefined)).toBeUndefined();
  });
});
```

`src/internal/data-attr.test-d.ts`:

```ts
import { expectTypeOf, test } from 'vitest';
import { dataAttr } from './data-attr';

test('dataAttr returns a bare-attribute value or nothing', () => {
  expectTypeOf(dataAttr(true)).toEqualTypeOf<'' | undefined>();
});
```

`src/internal/warn.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devWarn, resetDevWarnings } from './warn';

describe('devWarn', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('prefixes the message with the library name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    devWarn('something is off');
    expect(warn).toHaveBeenCalledWith('[fl-glass-ui] something is off');
  });

  it('prints each distinct message only once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    devWarn('a');
    devWarn('a');
    devWarn('b');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('is silent in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env.NODE_ENV = 'production';
    devWarn('hidden');
    expect(warn).not.toHaveBeenCalled();
  });
});
```

`src/internal/compose-event-handlers.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { composeEventHandlers } from './compose-event-handlers';

interface FakeEvent {
  defaultPrevented: boolean;
  preventDefault(): void;
}

const makeEvent = (): FakeEvent => {
  const event: FakeEvent = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };
  return event;
};

describe('composeEventHandlers', () => {
  it('calls the user handler before the internal one', () => {
    const calls: string[] = [];
    const handler = composeEventHandlers<FakeEvent>(
      () => calls.push('user'),
      () => calls.push('internal'),
    );
    handler(makeEvent());
    expect(calls).toEqual(['user', 'internal']);
  });

  it('skips the internal handler when the user handler prevents default', () => {
    const internal = vi.fn();
    const handler = composeEventHandlers<FakeEvent>((event) => event.preventDefault(), internal);
    handler(makeEvent());
    expect(internal).not.toHaveBeenCalled();
  });

  it('works when either handler is missing', () => {
    const internal = vi.fn();
    composeEventHandlers<FakeEvent>(undefined, internal)(makeEvent());
    expect(internal).toHaveBeenCalledOnce();
    expect(() => composeEventHandlers<FakeEvent>(vi.fn(), undefined)(makeEvent())).not.toThrow();
  });
});
```

`src/internal/merge-refs.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { mergeRefs } from './merge-refs';

describe('mergeRefs', () => {
  it('assigns the node to object refs and callback refs', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    render(<div ref={mergeRefs(objectRef, callbackRef)} />);
    expect(objectRef.current).toBeInstanceOf(HTMLDivElement);
    expect(callbackRef).toHaveBeenCalledWith(objectRef.current);
  });

  it('clears object refs and calls callback refs with null on unmount', () => {
    const objectRef = createRef<HTMLDivElement>();
    const callbackRef = vi.fn();
    const { unmount } = render(<div ref={mergeRefs(objectRef, callbackRef)} />);
    unmount();
    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it('runs a cleanup returned by a callback ref instead of calling it with null', () => {
    const cleanup = vi.fn();
    const callbackRef = vi.fn(() => cleanup);
    const dispose = mergeRefs<HTMLDivElement>(callbackRef)(document.createElement('div'));
    expect(typeof dispose).toBe('function');
    (dispose as () => void)();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(callbackRef).toHaveBeenCalledTimes(1);
  });

  it('ignores null and undefined refs', () => {
    expect(() =>
      mergeRefs<HTMLDivElement>(null, undefined)(document.createElement('div')),
    ).not.toThrow();
  });
});
```

- [ ] **Step 5: Chạy test để xác nhận fail**

Run: `pnpm test:unit`
Expected: FAIL, vì Vitest không resolve được `./data-attr`, `./warn`, `./compose-event-handlers` và `./merge-refs`.

- [ ] **Step 6: Viết code**

`src/internal/data-attr.ts`:

```ts
/** Value for a boolean data-attribute: present (`""`) when true, omitted when false. */
export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined;
}
```

`src/internal/warn.ts`:

```ts
const warned = new Set<string>();

/** Development-only warning, printed once per distinct message. Never throws. */
export function devWarn(message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[fl-glass-ui] ${message}`);
}

/** Test helper: forget which messages were already printed. */
export function resetDevWarnings(): void {
  warned.clear();
}
```

`src/internal/compose-event-handlers.ts`:

```ts
/**
 * Runs the consumer's handler first, then the library's own handler unless the consumer
 * called `event.preventDefault()`.
 */
export function composeEventHandlers<E extends { defaultPrevented: boolean }>(
  userHandler: ((event: E) => void) | undefined,
  internalHandler: ((event: E) => void) | undefined,
): (event: E) => void {
  return (event) => {
    userHandler?.(event);
    if (!event.defaultPrevented) internalHandler?.(event);
  };
}
```

`src/internal/merge-refs.ts`:

```ts
import type { Ref, RefCallback } from 'react';

/** Combines several refs into one callback ref. Supports React 19 ref cleanup functions. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (value: T | null) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(value);
        cleanups.push(typeof cleanup === 'function' ? cleanup : () => ref(null));
      } else if (ref) {
        ref.current = value;
        cleanups.push(() => {
          ref.current = null;
        });
      }
    }
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}
```

- [ ] **Step 7: Chạy test, lint và typecheck**

Run: `pnpm test:unit && pnpm lint && pnpm typecheck`
Expected: 4 file test PASS (12 test), type test PASS, lint và typecheck không có lỗi.

- [ ] **Step 8: Format và commit**

```bash
pnpm format
git add -A
git commit -m "chore: scaffold fl-glass-ui with internal utilities" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Primitive `Slot` (cho `asChild`)

**Files:**
- Create: `src/internal/slot.tsx`
- Test: `src/internal/slot.test.tsx`

**Interfaces:**
- Consumes: `composeEventHandlers`, `mergeRefs`, `devWarn` (Task 1); `clsx`.
- Produces: `Slot`, là `ForwardRefExoticComponent<SlotProps & RefAttributes<HTMLElement>>`, cùng `interface SlotProps extends HTMLAttributes<HTMLElement> { children?: ReactNode }`. Thông điệp cảnh báo cố định: `` `asChild` expects exactly one React element as its child. ``

- [ ] **Step 1: Viết test**

`src/internal/slot.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Slot } from './slot';
import { resetDevWarnings } from './warn';

describe('Slot', () => {
  beforeEach(() => {
    resetDevWarnings();
    vi.restoreAllMocks();
  });

  it('renders the child element with both class names', () => {
    render(
      <Slot className="from-slot">
        <a href="/x" className="from-child">
          Link
        </a>
      </Slot>,
    );
    expect(screen.getByRole('link', { name: 'Link' })).toHaveClass('from-slot', 'from-child');
  });

  it('lets child props win over slot props', () => {
    render(
      <Slot id="slot-id" title="slot">
        <span id="child-id">x</span>
      </Slot>,
    );
    const span = screen.getByText('x');
    expect(span).toHaveAttribute('id', 'child-id');
    expect(span).toHaveAttribute('title', 'slot');
  });

  it('merges styles with child values winning on conflicts', () => {
    render(
      <Slot style={{ color: 'red', padding: 4 }}>
        <span style={{ color: 'blue' }}>x</span>
      </Slot>,
    );
    const span = screen.getByText('x');
    expect(span.style.color).toBe('blue');
    expect(span.style.padding).toBe('4px');
  });

  it('calls the child handler first, then the slot handler', () => {
    const calls: string[] = [];
    render(
      <Slot onClick={() => calls.push('slot')}>
        <button type="button" onClick={() => calls.push('child')}>
          go
        </button>
      </Slot>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(calls).toEqual(['child', 'slot']);
  });

  it('skips the slot handler when the child handler prevents default', () => {
    const slotHandler = vi.fn();
    render(
      <Slot onClick={slotHandler}>
        <button type="button" onClick={(event) => event.preventDefault()}>
          go
        </button>
      </Slot>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(slotHandler).not.toHaveBeenCalled();
  });

  it('forwards its ref and keeps the child ref', () => {
    const slotRef = createRef<HTMLElement>();
    const childRef = createRef<HTMLAnchorElement>();
    render(
      <Slot ref={slotRef}>
        <a href="/x" ref={childRef}>
          Link
        </a>
      </Slot>,
    );
    expect(slotRef.current).toBe(screen.getByRole('link'));
    expect(childRef.current).toBe(screen.getByRole('link'));
  });

  it.each([
    ['text', 'just text'],
    ['two elements', [<span key="a">a</span>, <span key="b">b</span>]],
  ])('renders nothing and warns when the child is %s', (_label, children) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Slot>{children}</Slot>);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] `asChild` expects exactly one React element as its child.',
    );
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/internal/slot.test.tsx`
Expected: FAIL, vì không resolve được `./slot`.

- [ ] **Step 3: Viết code**

`src/internal/slot.tsx`:

```tsx
import { clsx } from 'clsx';
import { Children, cloneElement, forwardRef, isValidElement, version } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { composeEventHandlers } from './compose-event-handlers';
import { mergeRefs } from './merge-refs';
import { devWarn } from './warn';

type AnyProps = Record<string, unknown>;
type AnyHandler = (event: { defaultPrevented: boolean }) => void;

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

// React 19 passes `ref` as a regular prop; React 18 keeps it on the element.
const REF_IS_PROP = Number.parseInt(version, 10) >= 19;

function getElementRef(element: ReactElement): Ref<unknown> | undefined {
  return REF_IS_PROP
    ? (element.props as { ref?: Ref<unknown> }).ref
    : (element as unknown as { ref?: Ref<unknown> }).ref;
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof slotValue === 'function') {
      merged[key] = composeEventHandlers(
        childValue as AnyHandler | undefined,
        slotValue as AnyHandler,
      );
    } else if (key === 'className') {
      merged[key] = clsx(slotValue as string | undefined, childValue as string | undefined);
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as object | undefined), ...(childValue as object | undefined) };
    }
  }
  return merged;
}

/**
 * Renders its single child element with the slot's props merged in; this is how `asChild` works.
 * Child props win, except that class names are joined, styles are merged, and event handlers run
 * child-first (the slot's handler is skipped if the child's handler calls `preventDefault()`).
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...slotProps },
  forwardedRef,
) {
  if (Children.count(children) !== 1 || !isValidElement(children)) {
    devWarn('`asChild` expects exactly one React element as its child.');
    return null;
  }
  const child = children as ReactElement<AnyProps>;
  const childRef = getElementRef(child);
  return cloneElement(child, {
    ...mergeProps(slotProps as AnyProps, child.props),
    ref: forwardedRef ? mergeRefs<unknown>(forwardedRef as Ref<unknown>, childRef) : childRef,
  });
});
```

- [ ] **Step 4: Chạy test**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: toàn bộ PASS (thêm 8 test mới), không lỗi type hay lint.

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Slot primitive for asChild" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Token, theme và bộ sinh CSS

**Files:**
- Create: `src/styles/theme/values.ts`, `scripts/lib/theme-css.ts`, `scripts/build-theme.ts`, `src/styles/index.css`, `src/styles/utilities.css`
- Test: `scripts/lib/theme-css.test.ts`
- Modify: `package.json` (script `gen:theme`)

**Interfaces:**
- Consumes: không có.
- Produces (từ `src/styles/theme/values.ts`):
  - `type ThemeName = 'light' | 'dark'` và `type TokenMap = Readonly<Record<string, string>>`
  - Các hằng: `baseTokens`, `themes: Record<ThemeName, TokenMap>`, `derivedTokens`, `solidFallback`, `contrastMore: { shared; light; dark }`, `reducedMotion`, `referenceBackgrounds: Record<ThemeName, readonly string[]>`, `LIGHT_NOISE`
  - Tên token **không** kèm tiền tố `--flg-`. Ví dụ `'glass-tint'` sinh ra `--flg-glass-tint`.
- Produces (từ `scripts/lib/theme-css.ts`): `buildThemeCss(v?)`, `buildSimulateCss(v?)`, `buildAaOverrideSnippet(v?)`, tất cả trả về `string`; `SEL` (bảng selector); `type ThemeValues`.

- [ ] **Step 1: Viết `values.ts` (dữ liệu, chưa có logic)**

`src/styles/theme/values.ts`:

```ts
/**
 * Single source of truth for every fl-glass-ui design token.
 * Names carry no `--flg-` prefix: `'glass-tint'` becomes `--flg-glass-tint`.
 *
 * MOCKUP LOCK: the per-theme values reproduce the approved mockups in
 * docs/superpowers/specs/mockups/ exactly. Only tokens marked "(outside mockup)" may be tuned
 * without the project owner's approval. scripts/lib/theme-css.test.ts fails if a mockup value drifts.
 */
export type ThemeName = 'light' | 'dark';
export type TokenMap = Readonly<Record<string, string>>;

export const baseTokens: TokenMap = {
  'radius-xs': '4px',
  'radius-md': '8px',
  'radius-lg': '12px',
  'radius-full': '9999px',
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '20px',
  'space-6': '24px',
  'space-8': '32px',
  'space-10': '40px',
  'font-sans': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  'text-2xs': '0.65625rem',
  'text-xs': '0.71875rem',
  'text-sm': '0.78125rem',
  'text-md': '0.96875rem',
  'weight-regular': '400',
  'weight-medium': '500',
  'weight-semibold': '600',
  'control-h-sm': '28px',
  'control-h-md': '34px',
  'control-h-lg': '40px',
  'duration-fast': '120ms',
  'duration-normal': '200ms',
  ease: 'cubic-bezier(0.2, 0, 0, 1)',
  'spinner-duration': '800ms',
};

export const LIGHT_NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E\")";

export const themes: Readonly<Record<ThemeName, TokenMap>> = {
  light: {
    'glass-tint': 'rgba(250,251,255,.70)',
    'glass-tint-solid': 'rgba(250,251,255,.94)', // (outside mockup)
    'glass-blur': '30px',
    'glass-saturate': '120%',
    'glass-border':
      'linear-gradient(135deg, rgba(68,102,242,.55), rgba(60,180,235,.35) 50%, rgba(255,255,255,.95))',
    'glass-noise': LIGHT_NOISE,
    'glass-shadow': '0 2px 4px rgba(0,0,0,.04), 0 12px 34px rgba(60,95,210,.18)',
    text: '#1f2433',
    'text-muted': '#4a5164',
    'accent-start': '#4466f2',
    'accent-end': '#1676b0',
    'accent-solid': '#4466f2',
    'accent-text': '#2f55d8',
    'accent-subtle': 'linear-gradient(135deg, rgba(68,102,242,.14), rgba(22,118,176,.14))',
    'on-accent': '#ffffff',
    glow: '0 4px 14px rgba(68,102,242,.35)',
    'focus-ring': '0 0 0 3px rgba(68,102,242,.18), 0 0 12px rgba(60,180,235,.28)',
    'control-bg': 'rgba(255,255,255,.85)',
    'control-bg-secondary': 'rgba(255,255,255,.70)',
    'control-border': 'rgba(31,36,51,.14)',
    'control-track': 'rgba(31,36,51,.12)',
    'control-thumb': '#ffffff',
    success: '#125c36', // (outside mockup)
    warning: '#7a4500', // (outside mockup)
    danger: '#9c252e', // (outside mockup)
    'on-danger': '#ffffff', // (outside mockup)
    'status-bg-alpha': '12%', // (outside mockup)
  },
  dark: {
    'glass-tint': 'rgba(22,26,44,.62)',
    'glass-tint-solid': 'rgba(22,26,44,.94)', // (outside mockup)
    'glass-blur': '24px',
    'glass-saturate': '130%',
    'glass-border':
      'linear-gradient(135deg, rgba(120,140,255,.45), rgba(80,200,255,.25), rgba(255,255,255,.06))',
    'glass-noise': 'none',
    'glass-shadow': '0 12px 40px rgba(0,0,0,.45)',
    text: '#e6e9f5',
    'text-muted': 'rgba(230,233,245,.68)',
    'accent-start': '#5b7cff',
    'accent-end': '#46b8f0',
    'accent-solid': 'rgba(110,150,255,.75)',
    'accent-text': '#a9bcff',
    'accent-subtle': 'rgba(110,140,255,.16)',
    'on-accent': '#ffffff',
    glow: '0 0 12px rgba(80,150,255,.28)',
    'focus-ring': '0 0 0 3px rgba(110,150,255,.18), 0 0 10px rgba(110,150,255,.18)',
    'control-bg': 'rgba(255,255,255,.05)',
    'control-bg-secondary': 'rgba(255,255,255,.06)',
    'control-border': 'rgba(255,255,255,.11)',
    'control-track': 'rgba(255,255,255,.10)',
    'control-thumb': '#ffffff',
    success: '#b4efd3', // (outside mockup)
    warning: '#fadda6', // (outside mockup)
    danger: '#ffd3d6', // (outside mockup)
    'on-danger': '#1a0b0d', // (outside mockup)
    'status-bg-alpha': '16%', // (outside mockup)
  },
};

/** Recomputed on every theme root so nested `data-flg-theme` subtrees use their own values. */
export const derivedTokens: TokenMap = {
  'glass-filter': 'blur(var(--flg-glass-blur)) saturate(var(--flg-glass-saturate))',
  'accent-gradient': 'linear-gradient(135deg, var(--flg-accent-start), var(--flg-accent-end))',
  'focus-outline-color': 'transparent',
};

/** No backdrop-filter support, or prefers-reduced-transparency: an almost opaque surface. */
export const solidFallback: TokenMap = {
  'glass-tint': 'var(--flg-glass-tint-solid)',
  'glass-filter': 'none',
};

/** prefers-contrast: more. Outside the mockup; must meet WCAG AA with no exceptions. */
export const contrastMore: Readonly<{ shared: TokenMap; light: TokenMap; dark: TokenMap }> = {
  shared: {
    'glass-tint': 'var(--flg-glass-tint-solid)',
    'glass-filter': 'none',
    'glass-noise': 'none',
    'glass-border': 'linear-gradient(var(--flg-text), var(--flg-text))',
    glow: 'none',
    'focus-ring': 'none',
  },
  light: {
    'control-border': 'rgba(31,36,51,.50)',
    'focus-outline-color': '#3554d1',
    'accent-start': '#3554d1',
    'accent-end': '#3554d1',
    'accent-solid': '#3554d1',
    'on-accent': '#ffffff',
  },
  dark: {
    'control-border': 'rgba(255,255,255,.36)',
    'text-muted': '#c4c9da',
    'focus-outline-color': '#8ea6ff',
    'accent-start': '#8ea6ff',
    'accent-end': '#8ea6ff',
    'accent-solid': '#8ea6ff',
    'on-accent': '#0b1020',
  },
};

export const reducedMotion: TokenMap = {
  'duration-fast': '0ms',
  'duration-normal': '0ms',
  'spinner-duration': '2400ms',
};

/** Spec §4.8: contrast is guaranteed over these backdrops (blur and noise ignored). */
export const referenceBackgrounds: Readonly<Record<ThemeName, readonly string[]>> = {
  light: ['#ffffff', '#c3cfe2', '#8a8a8a', '#7ea6ff', '#ff5fa2'],
  dark: ['#000000', '#0f1220', '#3a3a3a', '#4a5bdc', '#2fa8d8'],
};
```

- [ ] **Step 2: Viết test cho bộ sinh CSS**

Cài trình kiểm tra cú pháp CSS: `pnpm add -D lightningcss@1.33.0`

`scripts/lib/theme-css.test.ts`:

```ts
import { transform } from 'lightningcss';
import { describe, expect, it } from 'vitest';
import * as values from '../../src/styles/theme/values';
import { buildAaOverrideSnippet, buildSimulateCss, buildThemeCss, SEL } from './theme-css';

/** Declarations inside the first `selector {` block found after `after`. Blocks hold no nested braces. */
function blockBody(css: string, selector: string, after: string): string {
  const from = css.indexOf(after);
  if (from < 0) throw new Error(`Anchor not found: ${after}`);
  const open = css.indexOf(`${selector} {`, from);
  if (open < 0) throw new Error(`Block not found: ${selector} after ${after}`);
  const start = css.indexOf('{', open) + 1;
  return css
    .slice(start, css.indexOf('}', start))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

const parses = (css: string) =>
  transform({ filename: 'test.css', code: Buffer.from(css), errorRecovery: false });

// Spec §4.3, copied verbatim from the approved mockups. Changing these needs the owner's approval.
const MOCKUP: Record<values.ThemeName, Record<string, string>> = {
  light: {
    'glass-tint': 'rgba(250,251,255,.70)',
    'glass-blur': '30px',
    'glass-saturate': '120%',
    'glass-border':
      'linear-gradient(135deg, rgba(68,102,242,.55), rgba(60,180,235,.35) 50%, rgba(255,255,255,.95))',
    'glass-noise': values.LIGHT_NOISE,
    'glass-shadow': '0 2px 4px rgba(0,0,0,.04), 0 12px 34px rgba(60,95,210,.18)',
    text: '#1f2433',
    'text-muted': '#4a5164',
    'accent-start': '#4466f2',
    'accent-end': '#1676b0',
    'accent-solid': '#4466f2',
    'accent-text': '#2f55d8',
    'accent-subtle': 'linear-gradient(135deg, rgba(68,102,242,.14), rgba(22,118,176,.14))',
    'on-accent': '#ffffff',
    glow: '0 4px 14px rgba(68,102,242,.35)',
    'focus-ring': '0 0 0 3px rgba(68,102,242,.18), 0 0 12px rgba(60,180,235,.28)',
    'control-bg': 'rgba(255,255,255,.85)',
    'control-bg-secondary': 'rgba(255,255,255,.70)',
    'control-border': 'rgba(31,36,51,.14)',
    'control-track': 'rgba(31,36,51,.12)',
    'control-thumb': '#ffffff',
  },
  dark: {
    'glass-tint': 'rgba(22,26,44,.62)',
    'glass-blur': '24px',
    'glass-saturate': '130%',
    'glass-border':
      'linear-gradient(135deg, rgba(120,140,255,.45), rgba(80,200,255,.25), rgba(255,255,255,.06))',
    'glass-noise': 'none',
    'glass-shadow': '0 12px 40px rgba(0,0,0,.45)',
    text: '#e6e9f5',
    'text-muted': 'rgba(230,233,245,.68)',
    'accent-start': '#5b7cff',
    'accent-end': '#46b8f0',
    'accent-solid': 'rgba(110,150,255,.75)',
    'accent-text': '#a9bcff',
    'accent-subtle': 'rgba(110,140,255,.16)',
    'on-accent': '#ffffff',
    glow: '0 0 12px rgba(80,150,255,.28)',
    'focus-ring': '0 0 0 3px rgba(110,150,255,.18), 0 0 10px rgba(110,150,255,.18)',
    'control-bg': 'rgba(255,255,255,.05)',
    'control-bg-secondary': 'rgba(255,255,255,.06)',
    'control-border': 'rgba(255,255,255,.11)',
    'control-track': 'rgba(255,255,255,.10)',
    'control-thumb': '#ffffff',
  },
};

describe('theme values', () => {
  it.each(['light', 'dark'] as const)('keeps every %s mockup token exactly as approved', (theme) => {
    for (const [name, value] of Object.entries(MOCKUP[theme])) {
      expect(values.themes[theme][name], name).toBe(value);
    }
  });

  it('defines the same token names for light and dark', () => {
    expect(Object.keys(values.themes.dark).sort()).toEqual(Object.keys(values.themes.light).sort());
  });

  it('overrides for dark every token that contrast-more overrides for light', () => {
    for (const name of Object.keys(values.contrastMore.light)) {
      expect(values.contrastMore.dark, name).toHaveProperty(name);
    }
  });
});

describe('buildThemeCss', () => {
  const css = buildThemeCss();

  it('produces valid CSS', () => {
    expect(() => parses(css)).not.toThrow();
  });

  it('wraps tokens, themes and preferences in the flg layers', () => {
    expect(css).toContain('@layer flg.tokens {');
    expect(css).toContain('@layer flg.theme {');
    expect(css).toContain('@layer flg.preferences {');
  });

  it('declares derived tokens on every theme root, not only :root', () => {
    const body = blockBody(css, SEL.everyThemeRoot, '@layer flg.theme');
    expect(body).toContain(
      '--flg-glass-filter: blur(var(--flg-glass-blur)) saturate(var(--flg-glass-saturate));',
    );
    expect(body).toContain('--flg-focus-outline-color: transparent;');
  });

  it('gives OS dark mode exactly the explicit dark tokens', () => {
    expect(blockBody(css, SEL.autoDark, '@media (prefers-color-scheme: dark)')).toBe(
      blockBody(css, SEL.dark, '@layer flg.theme'),
    );
  });

  it.each(['@supports not (', '@media (prefers-reduced-transparency: reduce)'])(
    'applies the solid fallback to nested theme roots under %s',
    (anchor) => {
      const body = blockBody(css, SEL.everyThemeRoot, anchor);
      expect(body).toContain('--flg-glass-tint: var(--flg-glass-tint-solid);');
      expect(body).toContain('--flg-glass-filter: none;');
    },
  );

  it('gives OS dark mode the dark contrast-more overrides', () => {
    expect(
      blockBody(css, SEL.autoDark, '@media (prefers-contrast: more) and (prefers-color-scheme: dark)'),
    ).toBe(blockBody(css, SEL.dark, '@media (prefers-contrast: more) {'));
  });

  it('removes motion under prefers-reduced-motion but keeps the spinner turning', () => {
    const body = blockBody(css, ':root', '@media (prefers-reduced-motion: reduce)');
    expect(body).toContain('--flg-duration-normal: 0ms;');
    expect(body).toContain('--flg-spinner-duration: 2400ms;');
  });
});

describe('buildSimulateCss', () => {
  const css = buildSimulateCss();

  it('produces valid CSS in the preferences layer', () => {
    expect(() => parses(css)).not.toThrow();
    expect(css).toContain('@layer flg.preferences {');
  });

  it('targets the simulation attribute only', () => {
    expect(css).toContain('[data-flg-simulate~="solid"], [data-flg-simulate~="solid"] [data-flg-theme] {');
    expect(css).toContain('[data-flg-simulate~="contrast-more"][data-flg-theme="dark"]');
    expect(css).not.toContain('@media');
  });
});

describe('buildAaOverrideSnippet', () => {
  const css = buildAaOverrideSnippet();

  it('produces valid, unlayered CSS that also covers OS dark mode', () => {
    expect(() => parses(css)).not.toThrow();
    expect(css).not.toContain('@layer');
    expect(css).toContain(`${SEL.autoDark} {`);
    expect(css).toContain('--flg-on-accent: #0b1020;');
  });
});
```

- [ ] **Step 3: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project scripts`
Expected: FAIL, vì không resolve được `./theme-css`.

- [ ] **Step 4: Viết bộ sinh CSS**

`scripts/lib/theme-css.ts`:

```ts
import * as defaultValues from '../../src/styles/theme/values';
import type { TokenMap } from '../../src/styles/theme/values';

export type ThemeValues = Pick<
  typeof defaultValues,
  'baseTokens' | 'themes' | 'derivedTokens' | 'solidFallback' | 'contrastMore' | 'reducedMotion'
>;

export const SEL = {
  everyThemeRoot: ':root, [data-flg-theme]',
  light: ':root, [data-flg-theme="light"]',
  dark: '[data-flg-theme="dark"]',
  autoDark: ':root:not([data-flg-theme])',
} as const;

const NO_BACKDROP_FILTER =
  'not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))';

type CssNode = string | { header: string; children: CssNode[] };

const block = (header: string, ...children: CssNode[]): CssNode => ({ header, children });
const decls = (tokens: TokenMap): string[] =>
  Object.entries(tokens).map(([name, value]) => `--flg-${name}: ${value};`);

function render(nodes: CssNode[], depth = 0): string {
  const pad = '  '.repeat(depth);
  return nodes
    .map((node) =>
      typeof node === 'string'
        ? `${pad}${node}`
        : `${pad}${node.header} {\n${render(node.children, depth + 1)}\n${pad}}`,
    )
    .join('\n');
}

/** The published theme: base tokens, both themes, derived tokens and every preference mode. */
export function buildThemeCss(v: ThemeValues = defaultValues): string {
  return `${render([
    '/* Generated by scripts/build-theme.ts from src/styles/theme/values.ts. Do not edit. */',
    block('@layer flg.tokens', block(':root', ...decls(v.baseTokens))),
    block(
      '@layer flg.theme',
      block(SEL.light, 'color-scheme: light;', ...decls(v.themes.light)),
      block(SEL.dark, 'color-scheme: dark;', ...decls(v.themes.dark)),
      block(
        '@media (prefers-color-scheme: dark)',
        block(SEL.autoDark, 'color-scheme: dark;', ...decls(v.themes.dark)),
      ),
      block(SEL.everyThemeRoot, ...decls(v.derivedTokens)),
    ),
    block(
      '@layer flg.preferences',
      block(`@supports ${NO_BACKDROP_FILTER}`, block(SEL.everyThemeRoot, ...decls(v.solidFallback))),
      block(
        '@media (prefers-reduced-transparency: reduce)',
        block(SEL.everyThemeRoot, ...decls(v.solidFallback)),
      ),
      block(
        '@media (prefers-contrast: more)',
        block(SEL.everyThemeRoot, ...decls(v.contrastMore.shared)),
        block(SEL.light, ...decls(v.contrastMore.light)),
        block(SEL.dark, ...decls(v.contrastMore.dark)),
      ),
      block(
        '@media (prefers-contrast: more) and (prefers-color-scheme: dark)',
        block(SEL.autoDark, ...decls(v.contrastMore.dark)),
      ),
      block('@media (prefers-reduced-motion: reduce)', block(':root', ...decls(v.reducedMotion))),
    ),
  ])}\n`;
}

/** Storybook-only: the same overrides, switched on by `data-flg-simulate`. Never published. */
export function buildSimulateCss(v: ThemeValues = defaultValues): string {
  const solid = '[data-flg-simulate~="solid"]';
  const more = '[data-flg-simulate~="contrast-more"]';
  return `${render([
    '/* Storybook-only simulation of fallback modes. Generated by scripts/build-theme.ts. Not published. */',
    block(
      '@layer flg.preferences',
      block(`${solid}, ${solid} [data-flg-theme]`, ...decls(v.solidFallback)),
      block(`${more}, ${more} [data-flg-theme]`, ...decls(v.contrastMore.shared)),
      block(
        `${more}[data-flg-theme="light"], ${more} [data-flg-theme="light"]`,
        ...decls(v.contrastMore.light),
      ),
      block(
        `${more}[data-flg-theme="dark"], ${more} [data-flg-theme="dark"]`,
        ...decls(v.contrastMore.dark),
      ),
    ),
  ])}\n`;
}

/** Docs: unlayered overrides that make the default theme meet WCAG AA contrast. */
export function buildAaOverrideSnippet(v: ThemeValues = defaultValues): string {
  return `${render([
    '/* fl-glass-ui: WCAG AA contrast overrides. Paste outside any @layer so it wins over the library. */',
    block(SEL.everyThemeRoot, ...decls(v.contrastMore.shared)),
    block(SEL.light, ...decls(v.contrastMore.light)),
    block(SEL.dark, ...decls(v.contrastMore.dark)),
    block('@media (prefers-color-scheme: dark)', block(SEL.autoDark, ...decls(v.contrastMore.dark))),
  ])}\n`;
}
```

`scripts/build-theme.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildSimulateCss, buildThemeCss } from './lib/theme-css';

const outDir = 'src/styles/generated';
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/theme.css`, buildThemeCss());
writeFileSync(`${outDir}/simulate.css`, buildSimulateCss());
console.log(`Wrote ${outDir}/theme.css and ${outDir}/simulate.css`);
```

`src/styles/utilities.css`:

```css
@layer flg.base {
  .flg-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
}
```

`src/styles/index.css`:

```css
/* fl-glass-ui stylesheet. The layer order is declared before any import so every block lands in it. */
@layer flg.tokens, flg.theme, flg.base, flg.components, flg.preferences;

@import './generated/theme.css';
@import './utilities.css';
```

Thêm script: `pnpm pkg set scripts.gen:theme="tsx scripts/build-theme.ts"`

- [ ] **Step 5: Chạy test và sinh CSS**

Run: `pnpm test:unit && pnpm gen:theme && pnpm typecheck && pnpm lint`
Expected: toàn bộ PASS, kể cả 15 test mới trong `theme-css.test.ts`. Lệnh sinh CSS in ra `Wrote src/styles/generated/theme.css and src/styles/generated/simulate.css`. `git status` không được liệt kê thư mục `generated/`, vì thư mục này đã nằm trong gitignore.

- [ ] **Step 6: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add design tokens and theme CSS generator" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Kiểm tra tương phản (spec §7, lớp 4)

**Files:**
- Create: `scripts/lib/contrast.ts`, `scripts/contrast-exceptions.ts`, `scripts/check-contrast.ts`
- Test: `scripts/lib/contrast.test.ts`
- Modify: `package.json` (script `check:contrast`)

**Interfaces:**
- Consumes: `values.ts` (Task 3).
- Produces:
  - `CHECKS: Record<CheckId, number>` (ngưỡng) và `type CheckId`
  - `type Mode = 'default' | 'contrast-more'`
  - `parseColor(s: string): Rgba`, `colorsIn(s: string): Rgba[]`, `composite(top: Rgba, bottom: Rgba): Rgba`, `contrastRatio(a: Rgba, b: Rgba): number`, `resolveToken(t: TokenMap, name: string): string`
  - `measure(values: ContrastValues, theme: ThemeName, mode: Mode): Record<CheckId, number>` (lấy giá trị thấp nhất trên các nền tham chiếu, làm tròn xuống 2 chữ số)
  - `evaluate(values: ContrastValues, exceptions: readonly KnownException[]): { rows: ContrastRow[]; findings: Finding[] }`
  - `KNOWN_EXCEPTIONS: readonly KnownException[]` (spec §4.9), trong đó `interface KnownException { row: number; theme: ThemeName; check: CheckId; recorded: number; description: string }`

- [ ] **Step 1: Viết test**

`scripts/lib/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import * as values from '../../src/styles/theme/values';
import type { ThemeName, TokenMap } from '../../src/styles/theme/values';
import { KNOWN_EXCEPTIONS } from '../contrast-exceptions';
import {
  colorsIn,
  composite,
  contrastRatio,
  evaluate,
  measure,
  parseColor,
  resolveToken,
} from './contrast';

describe('color math', () => {
  it('parses hex, rgb and rgba', () => {
    expect(parseColor('#1f2433')).toEqual([31, 36, 51, 1]);
    expect(parseColor('rgba(250,251,255,.70)')).toEqual([250, 251, 255, 0.7]);
    expect(parseColor('rgb(1, 2, 3)')).toEqual([1, 2, 3, 1]);
  });

  it('rejects colors it cannot measure', () => {
    expect(() => parseColor('hsl(0 0% 0%)')).toThrow(/Unsupported color/);
  });

  it('extracts every color stop from a gradient', () => {
    expect(colorsIn('linear-gradient(135deg, rgba(68,102,242,.14), #ffffff)')).toEqual([
      [68, 102, 242, 0.14],
      [255, 255, 255, 1],
    ]);
  });

  it('gives 21:1 for black on white', () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 5);
  });

  it('matches the known ratio of #777777 on white', () => {
    expect(contrastRatio(parseColor('#777777'), parseColor('#ffffff'))).toBeCloseTo(4.48, 2);
  });

  it('composites a translucent color over an opaque one', () => {
    expect(composite([255, 255, 255, 0.5], [0, 0, 0, 1])).toEqual([127.5, 127.5, 127.5, 1]);
  });

  it('resolves nested var() references and reports missing tokens', () => {
    expect(resolveToken({ a: 'var(--flg-b)', b: 'var(--flg-c)', c: '#000000' }, 'a')).toBe(
      '#000000',
    );
    expect(() => resolveToken({}, 'nope')).toThrow(/nope/);
  });
});

describe('evaluate with the shipped values', () => {
  it('passes with only the known exceptions of spec §4.9', () => {
    expect(evaluate(values, KNOWN_EXCEPTIONS).findings).toEqual([]);
  });

  it('records exactly the measured value of every known exception', () => {
    for (const exception of KNOWN_EXCEPTIONS) {
      expect(measure(values, exception.theme, 'default')[exception.check], exception.check).toBe(
        exception.recorded,
      );
    }
  });

  it('has no exception at all in contrast-more mode', () => {
    const rows = evaluate(values, KNOWN_EXCEPTIONS).rows.filter(
      (row) => row.mode === 'contrast-more',
    );
    expect(rows.filter((row) => row.status !== 'pass')).toEqual([]);
  });
});

describe('evaluate catches regressions', () => {
  const withTheme = (theme: ThemeName, patch: TokenMap) => ({
    ...values,
    themes: { ...values.themes, [theme]: { ...values.themes[theme], ...patch } },
  });

  it('flags a token outside the exception list that drops below its threshold', () => {
    const { findings } = evaluate(withTheme('light', { 'text-muted': '#9aa0b0' }), KNOWN_EXCEPTIONS);
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'light', check: 'text-muted', kind: 'below-threshold' }),
    );
  });

  it('flags a known exception that gets worse', () => {
    const { findings } = evaluate(withTheme('dark', { 'accent-end': '#7fd0ff' }), KNOWN_EXCEPTIONS);
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'dark', check: 'on-accent-end', kind: 'exception-worse' }),
    );
  });

  it('flags a known exception that no longer fails, so the public table stays true', () => {
    const { findings } = evaluate(withTheme('dark', { 'accent-end': '#1673ad' }), KNOWN_EXCEPTIONS);
    expect(findings).toContainEqual(
      expect.objectContaining({ theme: 'dark', check: 'on-accent-end', kind: 'exception-stale' }),
    );
  });

  it('flags any failure in contrast-more mode', () => {
    const patched = {
      ...values,
      contrastMore: {
        ...values.contrastMore,
        light: { ...values.contrastMore.light, 'control-border': 'rgba(31,36,51,.20)' },
      },
    };
    expect(evaluate(patched, KNOWN_EXCEPTIONS).findings).toContainEqual(
      expect.objectContaining({
        theme: 'light',
        mode: 'contrast-more',
        check: 'control-border',
        kind: 'below-threshold',
      }),
    );
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project scripts scripts/lib/contrast.test.ts`
Expected: FAIL, vì không resolve được `./contrast` và `../contrast-exceptions`.

- [ ] **Step 3: Viết code**

`scripts/lib/contrast.ts`:

```ts
import type * as ValuesModule from '../../src/styles/theme/values';
import type { ThemeName, TokenMap } from '../../src/styles/theme/values';
import type { KnownException } from '../contrast-exceptions';

export type Rgba = readonly [number, number, number, number];
export type Mode = 'default' | 'contrast-more';
export type ContrastValues = Pick<
  typeof ValuesModule,
  'themes' | 'derivedTokens' | 'contrastMore' | 'referenceBackgrounds'
>;

/** Spec §7, layer 4: 4.5:1 for text, 3:1 for borders, focus and checked-state fills. */
export const CHECKS = {
  text: 4.5,
  'text-muted': 4.5,
  success: 4.5,
  warning: 4.5,
  danger: 4.5,
  'badge-success': 4.5,
  'badge-warning': 4.5,
  'badge-danger': 4.5,
  'badge-accent': 4.5,
  'badge-neutral': 4.5,
  'on-accent-start': 4.5,
  'on-accent-end': 4.5,
  'on-danger': 4.5,
  'control-border': 3,
  'focus-indicator': 3,
  'input-focus-border': 3,
  'checked-fill': 3,
} as const;
export type CheckId = keyof typeof CHECKS;
const CHECK_IDS = Object.keys(CHECKS) as CheckId[];

export function parseColor(input: string): Rgba {
  const value = input.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) {
    const h = hex[1];
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
      1,
    ];
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(
    value,
  );
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
  throw new Error(`Unsupported color: ${input}`);
}

export function colorsIn(input: string): Rgba[] {
  return (input.match(/#[0-9a-f]{6}\b|rgba?\([^)]*\)/gi) ?? []).map(parseColor);
}

/** Paints `top` over an opaque `bottom`. */
export function composite(top: Rgba, bottom: Rgba): Rgba {
  const a = top[3];
  return [
    top[0] * a + bottom[0] * (1 - a),
    top[1] * a + bottom[1] * (1 - a),
    top[2] * a + bottom[2] * (1 - a),
    1,
  ];
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (c: Rgba) => 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]);

export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function resolveToken(tokens: TokenMap, name: string): string {
  const raw = tokens[name];
  if (raw === undefined) throw new Error(`Unknown token --flg-${name}`);
  return raw.replace(/var\(--flg-([a-z0-9-]+)\)/g, (_match, ref: string) => resolveToken(tokens, ref));
}

export function tokensFor(values: ContrastValues, theme: ThemeName, mode: Mode): TokenMap {
  const base = { ...values.derivedTokens, ...values.themes[theme] };
  return mode === 'default'
    ? base
    : { ...base, ...values.contrastMore.shared, ...values.contrastMore[theme] };
}

const floor2 = (x: number) => Math.floor(x * 100) / 100;

/** Lowest ratio of every check across the theme's reference backdrops, rounded down. */
export function measure(values: ContrastValues, theme: ThemeName, mode: Mode): Record<CheckId, number> {
  const t = tokensFor(values, theme, mode);
  const color = (name: string) => parseColor(resolveToken(t, name));
  const statusAlpha = Number.parseFloat(resolveToken(t, 'status-bg-alpha')) / 100;
  const outline = resolveToken(t, 'focus-outline-color');
  const focusColor =
    outline === 'transparent' ? colorsIn(resolveToken(t, 'focus-ring'))[0] : parseColor(outline);
  if (!focusColor) throw new Error(`${theme}/${mode}: no visible focus indicator color`);

  const lowest = Object.fromEntries(CHECK_IDS.map((id) => [id, Number.POSITIVE_INFINITY])) as Record<
    CheckId,
    number
  >;
  for (const backdrop of values.referenceBackgrounds[theme]) {
    const surface = composite(color('glass-tint'), parseColor(backdrop));
    const control = composite(color('control-bg'), surface);
    const onSurface = (name: string) => contrastRatio(composite(color(name), surface), surface);
    const statusBadge = (name: string) => {
      const [r, g, b] = color(name);
      return contrastRatio(color(name), composite([r, g, b, statusAlpha], surface));
    };
    const accentBadge = Math.min(
      ...colorsIn(resolveToken(t, 'accent-subtle')).map((stop) => {
        const bg = composite(stop, surface);
        return contrastRatio(composite(color('accent-text'), bg), bg);
      }),
    );
    const neutralBg = composite(color('control-track'), surface);
    const measured: Record<CheckId, number> = {
      text: onSurface('text'),
      'text-muted': onSurface('text-muted'),
      success: onSurface('success'),
      warning: onSurface('warning'),
      danger: onSurface('danger'),
      'badge-success': statusBadge('success'),
      'badge-warning': statusBadge('warning'),
      'badge-danger': statusBadge('danger'),
      'badge-accent': accentBadge,
      'badge-neutral': contrastRatio(composite(color('text'), neutralBg), neutralBg),
      'on-accent-start': contrastRatio(color('on-accent'), color('accent-start')),
      'on-accent-end': contrastRatio(color('on-accent'), color('accent-end')),
      'on-danger': contrastRatio(color('on-danger'), color('danger')),
      'control-border': Math.min(
        contrastRatio(composite(color('control-border'), control), control),
        contrastRatio(composite(color('control-border'), surface), surface),
      ),
      'focus-indicator': contrastRatio(composite(focusColor, surface), surface),
      'input-focus-border': contrastRatio(composite(color('accent-solid'), control), control),
      'checked-fill': Math.min(
        contrastRatio(color('accent-start'), surface),
        contrastRatio(color('accent-end'), surface),
      ),
    };
    for (const id of CHECK_IDS) lowest[id] = Math.min(lowest[id], measured[id]);
  }
  return Object.fromEntries(CHECK_IDS.map((id) => [id, floor2(lowest[id])])) as Record<CheckId, number>;
}

export interface ContrastRow {
  theme: ThemeName;
  mode: Mode;
  check: CheckId;
  measured: number;
  threshold: number;
  status: 'pass' | 'known-exception' | 'fail';
}

export interface Finding {
  theme: ThemeName;
  mode: Mode;
  check: CheckId;
  measured: number;
  threshold: number;
  kind: 'below-threshold' | 'exception-worse' | 'exception-stale';
  exception?: KnownException;
}

export function evaluate(
  values: ContrastValues,
  exceptions: readonly KnownException[],
): { rows: ContrastRow[]; findings: Finding[] } {
  const rows: ContrastRow[] = [];
  const findings: Finding[] = [];
  for (const theme of ['light', 'dark'] as const) {
    for (const mode of ['default', 'contrast-more'] as const) {
      const results = measure(values, theme, mode);
      for (const check of CHECK_IDS) {
        const measured = results[check];
        const threshold = CHECKS[check];
        const base = { theme, mode, check, measured, threshold };
        const exception =
          mode === 'default'
            ? exceptions.find((e) => e.theme === theme && e.check === check)
            : undefined;
        let kind: Finding['kind'] | undefined;
        if (exception) {
          if (measured >= threshold) kind = 'exception-stale';
          else if (measured < exception.recorded) kind = 'exception-worse';
        } else if (measured < threshold) {
          kind = 'below-threshold';
        }
        if (kind) findings.push({ ...base, kind, ...(exception ? { exception } : {}) });
        rows.push({ ...base, status: kind ? 'fail' : exception ? 'known-exception' : 'pass' });
      }
    }
  }
  return { rows, findings };
}
```

`scripts/contrast-exceptions.ts`:

```ts
import type { ThemeName } from '../src/styles/theme/values';
import type { CheckId } from './lib/contrast';

export interface KnownException {
  /** Row number in spec §4.9 and in the docs Accessibility table. */
  readonly row: number;
  readonly theme: ThemeName;
  readonly check: CheckId;
  /** Contrast measured with the approved mockup values, rounded down. Getting worse fails CI. */
  readonly recorded: number;
  readonly description: string;
}

const D = {
  1: 'Control borders (input, checkbox, radio, switch when off) against the surface',
  2: 'Focus ring on Button, IconButton, Checkbox, Radio and Switch',
  3: 'Input and Textarea border while focused',
  4: 'White text and check marks on the accent gradient',
  5: 'Accent fill of checked states (checkbox, radio dot, switch on) against the surface',
  6: 'Muted text on the brightest reference backdrop',
  7: 'Accent badge text on the accent badge background',
} as const;

/** Spec §4.9. The default theme keeps the approved mockup values, so these gaps are accepted. */
export const KNOWN_EXCEPTIONS: readonly KnownException[] = [
  { row: 1, theme: 'light', check: 'control-border', recorded: 1.29, description: D[1] },
  { row: 1, theme: 'dark', check: 'control-border', recorded: 1.32, description: D[1] },
  { row: 2, theme: 'light', check: 'focus-indicator', recorded: 1.22, description: D[2] },
  { row: 2, theme: 'dark', check: 'focus-indicator', recorded: 1.24, description: D[2] },
  { row: 3, theme: 'dark', check: 'input-focus-border', recorded: 2.14, description: D[3] },
  { row: 4, theme: 'dark', check: 'on-accent-start', recorded: 3.63, description: D[4] },
  { row: 4, theme: 'dark', check: 'on-accent-end', recorded: 2.24, description: D[4] },
  { row: 5, theme: 'dark', check: 'checked-fill', recorded: 2.37, description: D[5] },
  { row: 6, theme: 'dark', check: 'text-muted', recorded: 4.25, description: D[6] },
  { row: 7, theme: 'light', check: 'badge-accent', recorded: 3.69, description: D[7] },
  { row: 7, theme: 'dark', check: 'badge-accent', recorded: 3.91, description: D[7] },
];
```

`scripts/check-contrast.ts`:

```ts
import * as values from '../src/styles/theme/values';
import { KNOWN_EXCEPTIONS } from './contrast-exceptions';
import { evaluate } from './lib/contrast';
import type { Finding } from './lib/contrast';

const explain = (f: Finding): string => {
  const where = `${f.theme}/${f.mode} ${f.check} = ${f.measured.toFixed(2)}`;
  if (f.kind === 'exception-worse') {
    return `${where} is worse than the recorded ${f.exception?.recorded} (spec §4.9 row ${f.exception?.row}).`;
  }
  if (f.kind === 'exception-stale') {
    return `${where} now meets ${f.threshold}:1. Remove spec §4.9 row ${f.exception?.row} from scripts/contrast-exceptions.ts and the spec.`;
  }
  return `${where} is below ${f.threshold}:1. Tune a token marked "(outside mockup)" in values.ts; mockup tokens change only with the owner's approval.`;
};

const { rows, findings } = evaluate(values, KNOWN_EXCEPTIONS);
for (const row of rows) {
  console.log(
    `${row.status.padEnd(16)}${row.theme.padEnd(6)}${row.mode.padEnd(14)}${row.check.padEnd(20)}${row.measured.toFixed(2)} (min ${row.threshold})`,
  );
}
if (findings.length > 0) {
  console.error(`\n${findings.length} contrast problem(s):`);
  for (const finding of findings) console.error(`- ${explain(finding)}`);
  process.exit(1);
}
console.log('\nContrast check passed.');
```

Thêm script: `pnpm pkg set scripts.check:contrast="tsx scripts/check-contrast.ts"`

- [ ] **Step 4: Chạy test và lệnh kiểm tra**

Run: `pnpm test:unit && pnpm check:contrast`
Expected: toàn bộ test PASS. `check:contrast` in ra 68 dòng (17 kiểm tra × 2 theme × 2 chế độ), trong đó đúng 11 dòng `known-exception`, rồi kết thúc bằng `Contrast check passed.`

Nếu test `records exactly the measured value` fail, **không sửa** số `recorded`. Hãy kiểm tra xem logic đo có khớp spec §7 lớp 4 không, rồi báo lại. Các số này đã được đo trước khi viết plan và đã được ghi vào spec §4.9.

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add automated contrast check with documented exceptions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Component `Surface`

**Files:**
- Create: `src/components/surface/Surface.tsx`, `src/components/surface/index.ts`, `src/styles/surface.css`, `src/styles/preferences.css`
- Test: `src/components/surface/Surface.test.tsx`
- Modify: `src/index.ts`, `src/styles/index.css`

**Interfaces:**
- Consumes: `Slot` (Task 2); các token `--flg-glass-*`, `--flg-radius-lg`, `--flg-text`, `--flg-font-sans` (Task 3).
- Produces: `Surface`, là `ForwardRefExoticComponent<SurfaceProps & RefAttributes<HTMLDivElement>>`, với `interface SurfaceProps extends HTMLAttributes<HTMLDivElement> { asChild?: boolean }`. Class CSS công khai là `.flg-surface`. Đây là component server-safe: không hook, không `"use client"`.

- [ ] **Step 1: Viết test**

`src/components/surface/Surface.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Surface } from './Surface';

describe('Surface', () => {
  it('renders a div with the glass class and its children', () => {
    render(<Surface>Content</Surface>);
    const surface = screen.getByText('Content');
    expect(surface.tagName).toBe('DIV');
    expect(surface).toHaveClass('flg-surface');
  });

  it('joins a custom className and passes other attributes through', () => {
    render(
      <Surface className="mine" id="panel" aria-label="Panel">
        x
      </Surface>,
    );
    const surface = screen.getByLabelText('Panel');
    expect(surface).toHaveClass('flg-surface', 'mine');
    expect(surface).toHaveAttribute('id', 'panel');
  });

  it('forwards the ref to the div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Surface ref={ref}>x</Surface>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders the child element instead of a div with asChild', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Surface asChild ref={ref} className="outer">
        <section aria-label="Profile" className="inner">
          x
        </section>
      </Surface>,
    );
    const section = screen.getByRole('region', { name: 'Profile' });
    expect(section).toHaveClass('flg-surface', 'outer', 'inner');
    expect(ref.current).toBe(section);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/components/surface`
Expected: FAIL, vì không resolve được `./Surface`.

- [ ] **Step 3: Viết code**

`src/components/surface/Surface.tsx`:

```tsx
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';
import { Slot } from '../../internal/slot';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element instead of a `div`, with Surface's props merged onto it. */
  asChild?: boolean;
}

/** The glass layer every other surface builds on. Safe to render in React Server Components. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { asChild = false, className, ...props },
  ref,
) {
  const classes = clsx('flg-surface', className);
  if (asChild) return <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props} />;
  return <div ref={ref} className={classes} {...props} />;
});
```

`src/components/surface/index.ts`:

```ts
export { Surface } from './Surface';
export type { SurfaceProps } from './Surface';
```

`src/index.ts` (thay toàn bộ nội dung):

```ts
export { Surface } from './components/surface';
export type { SurfaceProps } from './components/surface';
```

`src/styles/surface.css`:

```css
@layer flg.components {
  .flg-surface {
    position: relative;
    box-sizing: border-box;
    border: 1px solid transparent;
    border-radius: var(--flg-radius-lg);
    background-image:
      var(--flg-glass-noise),
      linear-gradient(var(--flg-glass-tint), var(--flg-glass-tint)),
      var(--flg-glass-border);
    background-origin: padding-box, padding-box, border-box;
    background-clip: padding-box, padding-box, border-box;
    -webkit-backdrop-filter: var(--flg-glass-filter);
    backdrop-filter: var(--flg-glass-filter);
    box-shadow: var(--flg-glass-shadow);
    color: var(--flg-text);
    font-family: var(--flg-font-sans);
  }
}
```

`src/styles/preferences.css`:

```css
/* Only the parts of the preference modes that tokens cannot express (spec §4.6). */
@layer flg.preferences {
  @media (forced-colors: active) {
    .flg-surface {
      background-image: none;
      background-color: Canvas;
      border-color: CanvasText;
      color: CanvasText;
      box-shadow: none;
    }
  }
}
```

`src/styles/index.css` (thay toàn bộ nội dung):

```css
/* fl-glass-ui stylesheet. The layer order is declared before any import so every block lands in it. */
@layer flg.tokens, flg.theme, flg.base, flg.components, flg.preferences;

@import './generated/theme.css';
@import './utilities.css';
@import './surface.css';
@import './preferences.css';
```

- [ ] **Step 4: Chạy test**

Run: `pnpm test:unit && pnpm typecheck && pnpm lint`
Expected: toàn bộ PASS (thêm 4 test Surface).

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Surface glass layer" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Build và kiểm tra gói

**Files:**
- Create: `tsdown.config.ts`, `scripts/build-css.ts`, `scripts/lib/use-client.ts`, `scripts/post-build-use-client.ts`, `scripts/check-use-client.ts`, `scripts/rsc-probe.mjs`, `scripts/check-dist-css.ts`, `scripts/record-size-limits.ts`, `.size-limit.json`
- Test: `scripts/lib/use-client.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/index.ts` và `src/styles/index.css` (các task trước).
- Produces:
  - Thư mục `dist/` gồm `index.js`, `index.d.ts`, `components/surface/Surface.js`, `internal/*.js`, `styles.css`.
  - `hasUseClient(code: string): boolean`, `ensureUseClient(code: string): string`, `distPathFor(srcFile: string): string`, `isLibrarySource(file: string): boolean`.
  - `CLIENT_MODULES` trong `scripts/check-use-client.ts` hiện là rỗng. Plan 2 sẽ điền vào theo spec §6.2.
  - Mảng `CASES` trong `scripts/rsc-probe.mjs`. Plan 2 sẽ thêm các component server-safe vào đây.

- [ ] **Step 1: Viết test cho tiện ích `use client`**

`scripts/lib/use-client.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { distPathFor, ensureUseClient, hasUseClient, isLibrarySource } from './use-client';

describe('hasUseClient', () => {
  it.each([
    ['"use client";\nexport {}', true],
    ["'use client'\nexport {}", true],
    ['// leading comment\n/* block */\n"use client";', true],
    ['export {};\n"use client";', false],
    ['"use server";', false],
  ])('detects the directive in %j', (code, expected) => {
    expect(hasUseClient(code)).toBe(expected);
  });
});

describe('ensureUseClient', () => {
  it('prepends the directive once', () => {
    const once = ensureUseClient('export const a = 1;');
    expect(once).toBe('"use client";\nexport const a = 1;');
    expect(ensureUseClient(once)).toBe(once);
  });
});

describe('distPathFor', () => {
  it('maps a source file to its build output', () => {
    expect(distPathFor('src/components/button/Button.tsx')).toBe('dist/components/button/Button.js');
    expect(distPathFor('src\\internal\\slot.tsx')).toBe('dist/internal/slot.js');
  });
});

describe('isLibrarySource', () => {
  it.each([
    ['src/components/surface/Surface.tsx', true],
    ['src/internal/merge-refs.ts', true],
    ['src/components/surface/Surface.test.tsx', false],
    ['src/internal/data-attr.test-d.ts', false],
    ['src/components/surface/Surface.stories.tsx', false],
    ['src/docs/TokenTable.tsx', false],
    ['src/styles/index.css', false],
  ])('classifies %s', (file, expected) => {
    expect(isLibrarySource(file)).toBe(expected);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project scripts scripts/lib/use-client.test.ts`
Expected: FAIL, vì không resolve được `./use-client`.

- [ ] **Step 3: Viết tiện ích và các script build/kiểm tra**

`scripts/lib/use-client.ts`:

```ts
const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*(['"])use client\1/;

export function hasUseClient(code: string): boolean {
  return DIRECTIVE.test(code);
}

export function ensureUseClient(code: string): string {
  return hasUseClient(code) ? code : `"use client";\n${code}`;
}

export function distPathFor(srcFile: string): string {
  return srcFile
    .replace(/\\/g, '/')
    .replace(/^src\//, 'dist/')
    .replace(/\.tsx?$/, '.js');
}

/** Library modules that end up in dist/ (no tests, stories, type tests or docs). */
export function isLibrarySource(file: string): boolean {
  const path = file.replace(/\\/g, '/');
  return (
    /\.tsx?$/.test(path) &&
    !/\.(test|test-d|stories)\.tsx?$/.test(path) &&
    !path.endsWith('.d.ts') &&
    !path.startsWith('src/docs/')
  );
}

export function librarySources(listing: readonly string[]): string[] {
  return listing.map((file) => `src/${file.replace(/\\/g, '/')}`).filter(isLibrarySource);
}
```

`scripts/post-build-use-client.ts`:

```ts
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { distPathFor, ensureUseClient, hasUseClient, librarySources } from './lib/use-client';

// tsdown may drop module directives; make sure every client module keeps "use client".
let patched = 0;
for (const file of librarySources(readdirSync('src', { recursive: true, encoding: 'utf8' }))) {
  if (!hasUseClient(readFileSync(file, 'utf8'))) continue;
  const out = distPathFor(file);
  if (!existsSync(out)) throw new Error(`Missing build output for client module ${file}: ${out}`);
  const code = readFileSync(out, 'utf8');
  const next = ensureUseClient(code);
  if (next !== code) {
    writeFileSync(out, next);
    patched += 1;
  }
}
console.log(`use client: ${patched} file(s) patched.`);
```

`scripts/check-use-client.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { distPathFor, hasUseClient, librarySources } from './lib/use-client';

/** Spec §6.2: the modules that must be client components. Plan 2 adds entries as components land. */
const CLIENT_MODULES: readonly string[] = [];

const files = librarySources(readdirSync('src', { recursive: true, encoding: 'utf8' }));
const problems: string[] = [];
for (const file of files) {
  const expected = CLIENT_MODULES.includes(file);
  if (hasUseClient(readFileSync(file, 'utf8')) !== expected) {
    problems.push(`${file}: "use client" must be ${expected ? 'present' : 'absent'} (spec §6.2).`);
  }
  const out = distPathFor(file);
  if (existsSync(out)) {
    if (hasUseClient(readFileSync(out, 'utf8')) !== expected) {
      problems.push(`${out}: "use client" must be ${expected ? 'present' : 'absent'} in the build.`);
    }
  } else if (expected) {
    problems.push(`${out}: missing build output for a client module.`);
  }
}
for (const listed of CLIENT_MODULES) {
  if (!files.includes(listed)) problems.push(`${listed}: listed in CLIENT_MODULES but not found.`);
}
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`use client: ${files.length} module(s) checked, ${CLIENT_MODULES.length} client.`);
```

`scripts/rsc-probe.mjs`:

```js
// Renders server-safe modules from dist/ with React's `react-server` build, the build React Server
// Components use. A module that touches hooks or context there fails here.
// Run with: node --conditions=react-server scripts/rsc-probe.mjs
import { createElement } from 'react';

const FORWARD_REF = Symbol.for('react.forward_ref');

function renderTree(node) {
  if (node === null || node === undefined || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(renderTree);
  const { type, props } = node;
  if (typeof type === 'string') {
    return { type, props: { ...props, children: renderTree(props.children) } };
  }
  if (typeof type === 'function') return renderTree(type(props));
  if (type && type.$$typeof === FORWARD_REF) return renderTree(type.render(props, null));
  throw new Error(`Unsupported element type: ${String(type)}`);
}

/** Plan 2 appends the other server-safe components of spec §6.2. */
const CASES = [
  {
    label: 'Surface',
    file: '../dist/components/surface/Surface.js',
    exportName: 'Surface',
    element: (C) => createElement(C, null, 'x'),
    expect: { type: 'div', className: 'flg-surface' },
  },
  {
    label: 'Surface asChild',
    file: '../dist/components/surface/Surface.js',
    exportName: 'Surface',
    element: (C) => createElement(C, { asChild: true }, createElement('section', { className: 'own' }, 'x')),
    expect: { type: 'section', className: 'flg-surface own' },
  },
];

let failed = 0;
for (const c of CASES) {
  try {
    const mod = await import(new URL(c.file, import.meta.url));
    const tree = renderTree(c.element(mod[c.exportName]));
    if (tree.type !== c.expect.type || tree.props.className !== c.expect.className) {
      throw new Error(`expected <${c.expect.type} class="${c.expect.className}">, got <${tree.type} class="${tree.props.className}">`);
    }
    console.log(`ok   ${c.label}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${c.label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failed > 0) process.exit(1);
```

`scripts/build-css.ts`:

```ts
import browserslist from 'browserslist';
import { browserslistToTargets, bundle } from 'lightningcss';
import { mkdirSync, writeFileSync } from 'node:fs';

const { code, warnings } = bundle({
  filename: 'src/styles/index.css',
  minify: true,
  targets: browserslistToTargets(browserslist()),
});
for (const warning of warnings) console.warn(`lightningcss: ${warning.message}`);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/styles.css', code);
console.log(`Wrote dist/styles.css (${code.length} bytes)`);
```

`scripts/check-dist-css.ts`:

```ts
import { readFileSync } from 'node:fs';

const css = readFileSync('dist/styles.css', 'utf8');

// Lightning CSS may rewrite `@layer a, b, c;` into blocks emitted in that order, so check the order in
// which each layer name first appears, whether in a statement list or as a block.
const LAYERS = ['tokens', 'theme', 'base', 'components', 'preferences'];
const positions = LAYERS.map((name) => css.search(new RegExp(`(?:@layer\\s*|,\\s*)flg\\.${name}\\b`)));
const inOrder = positions.every((pos, i) => pos >= 0 && (i === 0 || pos > (positions[i - 1] ?? -1)));

const requirements: Array<[string, boolean]> = [
  ['no unresolved @import', !css.includes('@import')],
  ['declares the flg layers in order', inOrder],
  ['prefixes backdrop-filter for Safari', css.includes('-webkit-backdrop-filter')],
  ['ships the automatic dark theme', /prefers-color-scheme:\s*dark/.test(css)],
  ['ships the contrast-more mode', /prefers-contrast:\s*more/.test(css)],
  ['ships the surface styles', css.includes('.flg-surface')],
  ['does not ship the Storybook simulation', !css.includes('data-flg-simulate')],
];
const failed = requirements.filter(([, ok]) => !ok);
for (const [label, ok] of requirements) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
if (failed.length > 0) process.exit(1);
```

`scripts/record-size-limits.ts`:

```ts
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Spec §7: limits are the first green build's sizes plus 10%. Re-run only to accept a growth on purpose.
interface Entry {
  name: string;
  path: string;
  import?: string;
  limit?: string;
}
const configPath = '.size-limit.json';
const unlimited = (JSON.parse(readFileSync(configPath, 'utf8')) as Entry[]).map((entry) => {
  const copy = { ...entry };
  delete copy.limit;
  return copy;
});
writeFileSync(configPath, `${JSON.stringify(unlimited, null, 2)}\n`);
const results = JSON.parse(execSync('pnpm exec size-limit --json', { encoding: 'utf8' })) as Array<{
  name: string;
  size: number;
}>;
const limited = unlimited.map((entry) => {
  const measured = results.find((result) => result.name === entry.name);
  if (!measured) throw new Error(`size-limit did not report "${entry.name}"`);
  return { ...entry, limit: `${Math.ceil(measured.size * 1.1)} B` };
});
writeFileSync(configPath, `${JSON.stringify(limited, null, 2)}\n`);
for (const entry of limited) console.log(`${entry.name}: limit ${entry.limit}`);
```

`.size-limit.json`:

```json
[
  { "name": "JS (all exports)", "path": "dist/index.js", "import": "*" },
  { "name": "CSS (styles.css)", "path": "dist/styles.css" }
]
```

`tsdown.config.ts`:

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
});
```

- [ ] **Step 4: Cài công cụ và cập nhật `package.json`**

```bash
pnpm add -D tsdown@0.23.0 browserslist@4.29.3 publint@0.3.24 @arethetypeswrong/cli@0.18.5 size-limit@14.1.0 @size-limit/preset-small-lib@14.1.0
```

Gộp các khóa sau vào `package.json`. Riêng `scripts` thì **thay toàn bộ** bằng bản dưới đây:

```json
{
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  },
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Edge versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "Safari >= 16.4",
    "iOS >= 16.4"
  ],
  "scripts": {
    "gen:theme": "tsx scripts/build-theme.ts",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run --project unit --project scripts",
    "check:contrast": "tsx scripts/check-contrast.ts",
    "build": "pnpm gen:theme && tsdown && tsx scripts/build-css.ts && tsx scripts/post-build-use-client.ts",
    "check:dist-css": "tsx scripts/check-dist-css.ts",
    "check:use-client": "tsx scripts/check-use-client.ts",
    "check:rsc": "node --conditions=react-server scripts/rsc-probe.mjs",
    "check:publint": "publint --strict",
    "check:types": "attw --pack . --profile esm-only --exclude-entrypoints ./styles.css",
    "size": "size-limit",
    "size:record": "tsx scripts/record-size-limits.ts",
    "check:package": "pnpm check:dist-css && pnpm check:use-client && pnpm check:rsc && pnpm check:publint && pnpm check:types && pnpm size"
  }
}
```

- [ ] **Step 5: Chạy test, build rồi ghi ngưỡng kích thước**

Run: `pnpm test:unit && pnpm build && pnpm size:record`
Expected:
- Test PASS.
- Build tạo ra `dist/index.js`, `dist/index.d.ts`, `dist/components/surface/Surface.js` và `dist/styles.css`.
- `size:record` in ra hai dòng `... : limit <N> B` và ghi `limit` vào `.size-limit.json`.

- [ ] **Step 6: Chạy toàn bộ kiểm tra gói**

Run: `pnpm check:package`
Expected:
- Tất cả 7 dòng của `check:dist-css` đều là `ok`.
- `check:use-client` in ra `use client: <N> module(s) checked, 0 client.`
- `check:rsc` in ra `ok   Surface` và `ok   Surface asChild`.
- `publint` không báo lỗi.
- `attw` không có cảnh báo cho profile `esm-only`.
- `size-limit` báo cả hai mục đều nằm trong ngưỡng.

Nếu `check:rsc` báo lỗi kiểu "forwardRef is not a function", nghĩa là bản React `react-server` không có `forwardRef`. Khi đó **dừng lại và báo**: đây là giả định của spec §6.2 về các component server-safe.

- [ ] **Step 7: Format và commit**

```bash
pnpm format
git add -A
git commit -m "build: add tsdown and Lightning CSS builds with package checks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Storybook và test trên trình duyệt thật (spec §7, lớp 2–3)

**Files:**
- Create: `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/stage.css`, `src/components/surface/Surface.stories.tsx`
- Modify: `vitest.config.ts`, `package.json`

**Interfaces:**
- Consumes: `Surface` (Task 5); `referenceBackgrounds` (Task 3); `generated/simulate.css` (Task 3).
- Produces:
  - Global của Storybook: `theme: 'light' | 'dark'`, `backdrop: 'mockup' | <mã hex không có #>`, `simulate: 'none' | 'solid' | 'contrast-more'`.
  - Mọi story render bên trong `<div data-testid="flg-stage" data-flg-theme=… data-flg-simulate=…>`. Visual test (Task 9) chụp ảnh đúng phần tử này.
  - Các project Vitest `storybook-light` và `storybook-dark`, mỗi project chạy trên Chromium, Firefox và WebKit.

- [ ] **Step 1: Cài Storybook, addon và trình duyệt**

```bash
pnpm add -D storybook@10.6.1 @storybook/react-vite@10.6.1 @storybook/addon-vitest@10.6.1 @storybook/addon-a11y@10.6.1 @storybook/addon-docs@10.6.1 @vitest/browser@5.0.3 @vitest/browser-playwright@5.0.3 playwright@1.63.0
pnpm exec playwright install chromium firefox webkit
```

- [ ] **Step 2: Viết cấu hình Storybook**

`.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  typescript: { reactDocgen: 'react-docgen-typescript' },
};

export default config;
```

`.storybook/preview.tsx`:

```tsx
import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles/index.css';
import '../src/styles/generated/simulate.css';
import { referenceBackgrounds } from '../src/styles/theme/values';
import './stage.css';

const withStage: Decorator = (Story, context) => {
  const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
  const backdrop = String(context.globals.backdrop ?? 'mockup');
  const simulate = context.globals.simulate;
  return (
    <div
      data-testid="flg-stage"
      className="flg-stage"
      data-flg-theme={theme}
      data-flg-simulate={simulate === 'solid' || simulate === 'contrast-more' ? simulate : undefined}
      data-backdrop={backdrop === 'mockup' ? 'mockup' : 'solid'}
      style={backdrop === 'mockup' ? undefined : { background: `#${backdrop}` }}
    >
      <Story />
    </div>
  );
};

const backdropItems = [
  { value: 'mockup', title: 'Mockup backdrop' },
  ...(['light', 'dark'] as const).flatMap((theme) =>
    referenceBackgrounds[theme].map((hex) => ({
      value: hex.slice(1),
      title: `${theme} reference ${hex}`,
    })),
  ),
];

const preview: Preview = {
  decorators: [withStage],
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    backdrop: {
      description: 'What sits behind the glass',
      toolbar: { title: 'Backdrop', icon: 'photo', items: backdropItems, dynamicTitle: true },
    },
    simulate: {
      description: 'Simulate a fallback mode',
      toolbar: {
        title: 'Simulate',
        icon: 'accessibility',
        items: [
          { value: 'none', title: 'No simulation' },
          { value: 'solid', title: 'Solid (no blur / reduced transparency)' },
          { value: 'contrast-more', title: 'Contrast: more' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', backdrop: 'mockup', simulate: 'none' },
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'error',
      // Stories render components, not pages, so the page-landmark rule does not apply.
      config: { rules: [{ id: 'region', enabled: false }] },
    },
  },
};

export default preview;
```

`.storybook/stage.css` (nền giống hệt khung sân khấu trong `mockups/theme-pairing-v3.html`, Cặp 2):

```css
.flg-stage {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 320px;
  padding: 32px;
  display: grid;
  place-items: center;
  color: var(--flg-text);
  font-family: var(--flg-font-sans);
}

.flg-stage[data-backdrop='mockup'][data-flg-theme='light'] {
  background: linear-gradient(120deg, #dfe9f3 0%, #c3cfe2 100%);
}

.flg-stage[data-backdrop='mockup'][data-flg-theme='dark'] {
  background: linear-gradient(160deg, #0f1220 0%, #141a2e 100%);
}

.flg-stage[data-backdrop='mockup']::before,
.flg-stage[data-backdrop='mockup']::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 50%;
}

.flg-stage[data-backdrop='mockup'][data-flg-theme='light']::before {
  width: 230px;
  height: 230px;
  top: -60px;
  left: -30px;
  background: #7ea6ff;
  filter: blur(14px);
}

.flg-stage[data-backdrop='mockup'][data-flg-theme='light']::after {
  width: 200px;
  height: 200px;
  right: -20px;
  bottom: -60px;
  background: #7fd6f5;
  filter: blur(14px);
}

.flg-stage[data-backdrop='mockup'][data-flg-theme='dark']::before {
  width: 210px;
  height: 210px;
  top: -50px;
  left: -10px;
  background: #4a5bdc;
  filter: blur(40px);
  opacity: 0.55;
}

.flg-stage[data-backdrop='mockup'][data-flg-theme='dark']::after {
  width: 200px;
  height: 200px;
  right: -10px;
  bottom: -60px;
  background: #2fa8d8;
  filter: blur(40px);
  opacity: 0.45;
}
```

- [ ] **Step 3: Viết story kèm `play` (đây là test fail đầu tiên)**

`src/components/surface/Surface.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Surface } from './Surface';

const meta = {
  title: 'Foundation/Surface',
  component: Surface,
  args: { children: 'Glass surface', style: { padding: 18, width: 320 } },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsSection: Story = {
  args: { asChild: true, children: <section aria-label="Profile">Rendered as a section</section> },
};

/** Review Focus 1: a dark subtree inside a light page derives its own glass filter. */
export const NestedTheme: Story = {
  globals: { theme: 'light' },
  render: (args) => (
    <Surface {...args}>
      Outer light surface
      <div data-flg-theme="dark" data-testid="nested" style={{ marginTop: 13 }}>
        <Surface style={{ padding: 18 }}>Inner dark surface</Surface>
      </div>
    </Surface>
  ),
  play: async ({ canvas }) => {
    const nested = getComputedStyle(canvas.getByTestId('nested'));
    await expect(nested.getPropertyValue('--flg-glass-blur').trim()).toBe('24px');
    await expect(nested.getPropertyValue('--flg-glass-filter').replace(/\s+/g, ' ').trim()).toBe(
      'blur(24px) saturate(130%)',
    );
  },
};

/** Review Focus 3: the solid fallback also reaches a nested theme subtree. */
export const SolidFallback: Story = {
  globals: { theme: 'light', simulate: 'solid' },
  render: (args) => (
    <Surface {...args}>
      Solid fallback
      <div data-flg-theme="dark" data-testid="nested" style={{ marginTop: 13 }}>
        <Surface style={{ padding: 18 }}>Nested dark, also solid</Surface>
      </div>
    </Surface>
  ),
  play: async ({ canvas }) => {
    const nested = getComputedStyle(canvas.getByTestId('nested'));
    await expect(nested.getPropertyValue('--flg-glass-filter').trim()).toBe('none');
    await expect(nested.getPropertyValue('--flg-glass-tint').replace(/\s/g, '')).toBe(
      'rgba(22,26,44,.94)',
    );
  },
};
```

- [ ] **Step 4: Thêm project trình duyệt vào Vitest**

`vitest.config.ts` (thay toàn bộ nội dung):

```ts
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const storybookProject = (theme: 'light' | 'dark') => ({
  extends: true,
  plugins: [storybookTest({ configDir: '.storybook', initialGlobals: { theme } })],
  test: {
    name: `storybook-${theme}`,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' as const },
        { browser: 'firefox' as const },
        { browser: 'webkit' as const },
      ],
    },
  },
});

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.ts'],
          typecheck: { enabled: true, include: ['src/**/*.test-d.ts'], tsconfig: './tsconfig.json' },
        },
      },
      {
        extends: true,
        test: { name: 'scripts', environment: 'node', include: ['scripts/**/*.test.ts'] },
      },
      storybookProject('light'),
      storybookProject('dark'),
    ],
  },
});
```

Plugin Storybook tự nạp annotation từ `preview.tsx` và các addon, nên **không** tạo thêm `.storybook/vitest.setup.ts`.

Thêm script:

```bash
pnpm pkg set scripts.storybook="pnpm gen:theme && storybook dev -p 6006"
pnpm pkg set scripts.build-storybook="pnpm gen:theme && storybook build"
pnpm pkg set scripts.test:stories="pnpm gen:theme && vitest run --project storybook-light --project storybook-dark"
```

- [ ] **Step 5: Chạy test story**

Run: `pnpm test:stories`
Expected: 24 test PASS (4 story × 3 trình duyệt × 2 theme), không có vi phạm a11y nào.

Muốn chắc test thật sự bắt lỗi, làm thử một lần rồi hoàn tác: đổi selector `SEL.everyThemeRoot` trong `scripts/lib/theme-css.ts` thành `':root'`, chạy `pnpm test:stories`. Kết quả phải là `NestedTheme` FAIL, vì `--flg-glass-filter` lúc này kế thừa `blur(30px) saturate(120%)` của light. Sau đó khôi phục lại bằng `git checkout scripts/lib/theme-css.ts`.

- [ ] **Step 6: Build Storybook**

Run: `pnpm build-storybook`
Expected: tạo ra `storybook-static/`. File `storybook-static/index.json` có đủ 4 id: `foundation-surface--default`, `foundation-surface--as-section`, `foundation-surface--nested-theme`, `foundation-surface--solid-fallback`.

- [ ] **Step 7: Lint, typecheck, format và commit**

```bash
pnpm lint && pnpm typecheck && pnpm test:unit
pnpm format
git add -A
git commit -m "test: add Storybook with real-browser story and a11y tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Trang docs sinh từ dữ liệu thật

**Files:**
- Create: `src/docs/TokenTable.tsx`, `src/docs/ExceptionTable.tsx`, `src/docs/GettingStarted.mdx`, `src/docs/Theming.mdx`, `src/docs/Accessibility.mdx`
- Test: `src/docs/TokenTable.test.tsx`, `src/docs/ExceptionTable.test.tsx`

**Interfaces:**
- Consumes: `values.ts` (Task 3), `buildAaOverrideSnippet` (Task 3), `KNOWN_EXCEPTIONS` và `CHECKS` (Task 4).
- Produces: `TokenTable({ columns }: { columns: Readonly<Record<string, TokenMap>> })`, `ExceptionTable()`. Hai component này chỉ dùng cho docs và không được export.

- [ ] **Step 1: Viết test**

`src/docs/TokenTable.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TokenTable } from './TokenTable';

describe('TokenTable', () => {
  it('renders one row per token name and a column per map', () => {
    render(<TokenTable columns={{ light: { a: '1', b: '2' }, dark: { a: '3' } }} />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Token',
      'light',
      'dark',
    ]);
    expect(within(rows[2]!).getByRole('rowheader')).toHaveTextContent('--flg-b');
    expect(rows[2]).toHaveTextContent('—');
  });

  it('shortens very long values but keeps the full value in a title', () => {
    const long = `url("${'x'.repeat(120)}")`;
    render(<TokenTable columns={{ value: { noise: long } }} />);
    const cell = screen.getByTitle(long);
    expect(cell.textContent?.length).toBeLessThanOrEqual(80);
  });
});
```

`src/docs/ExceptionTable.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExceptionTable } from './ExceptionTable';

describe('ExceptionTable', () => {
  it('lists the seven rows of spec §4.9 with light and dark measurements', () => {
    render(<ExceptionTable />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(7);
    expect(rows[3]).toHaveTextContent('meets AA');
    expect(rows[3]).toHaveTextContent('3.63:1 / 2.24:1');
    expect(rows[6]).toHaveTextContent('3.69:1');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `pnpm vitest run --project unit src/docs`
Expected: FAIL, vì không resolve được `./TokenTable` và `./ExceptionTable`.

- [ ] **Step 3: Viết component và các trang MDX**

`src/docs/TokenTable.tsx`:

```tsx
import type { TokenMap } from '../styles/theme/values';

export interface TokenTableProps {
  columns: Readonly<Record<string, TokenMap>>;
}

const MAX = 80;
const shorten = (value: string) => (value.length > MAX ? `${value.slice(0, MAX - 1)}…` : value);

/** One row per token name, one column per token map (for example light and dark). */
export function TokenTable({ columns }: TokenTableProps) {
  const headers = Object.keys(columns);
  const names = [...new Set(Object.values(columns).flatMap((map) => Object.keys(map)))];
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Token</th>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {names.map((name) => (
          <tr key={name}>
            <th scope="row">
              <code>--flg-{name}</code>
            </th>
            {headers.map((header) => {
              const value = columns[header]?.[name];
              return (
                <td key={header}>
                  {value === undefined ? '—' : <code title={value}>{shorten(value)}</code>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

`src/docs/ExceptionTable.tsx`:

```tsx
import { KNOWN_EXCEPTIONS } from '../../scripts/contrast-exceptions';
import { CHECKS } from '../../scripts/lib/contrast';

/** Spec §4.9 as a table, built from the same data the contrast check enforces. */
export function ExceptionTable() {
  const rows = [...new Set(KNOWN_EXCEPTIONS.map((exception) => exception.row))];
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Where</th>
          <th scope="col">Light</th>
          <th scope="col">Dark</th>
          <th scope="col">WCAG AA minimum</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const entries = KNOWN_EXCEPTIONS.filter((exception) => exception.row === row);
          const first = entries[0];
          if (!first) return null;
          const cell = (theme: 'light' | 'dark') =>
            entries
              .filter((exception) => exception.theme === theme)
              .map((exception) => `${exception.recorded.toFixed(2)}:1`)
              .join(' / ') || 'meets AA';
          return (
            <tr key={row}>
              <td>{row}</td>
              <td>{first.description}</td>
              <td>{cell('light')}</td>
              <td>{cell('dark')}</td>
              <td>{CHECKS[first.check]}:1</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

`src/docs/GettingStarted.mdx`:

````mdx
import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Docs/Getting started" />

# Getting started

fl-glass-ui is a glassmorphism component library for React 18.3+ and 19. It ships plain CSS and
works in React Server Components.

## Install

```bash
pnpm add fl-glass-ui
```

## Load the styles once

```tsx
import 'fl-glass-ui/styles.css';
```

All library CSS lives in the `flg` cascade layer, so any CSS you write outside a layer overrides it
without `!important`.

## Use a component

```tsx
import { Surface } from 'fl-glass-ui';

export function Panel() {
  return <Surface style={{ padding: 18 }}>Hello, glass</Surface>;
}
```

## Pick a theme

Without a `data-flg-theme` attribute the library follows the operating system's light or dark
preference. Set the attribute to force a theme, on `<html>` or on any subtree:

```html
<html data-flg-theme="dark"></html>
```

With next-themes, set `attribute="data-flg-theme"`.
````

`src/docs/Theming.mdx`:

````mdx
import { Meta } from '@storybook/addon-docs/blocks';
import { baseTokens, contrastMore, derivedTokens, themes } from '../styles/theme/values';
import { TokenTable } from './TokenTable';

<Meta title="Docs/Theming" />

# Theming

Every visual decision is a CSS custom property prefixed with `--flg-`. Override any of them in your
own CSS, outside a cascade layer:

```css
:root {
  --flg-accent-start: #7c3aed;
  --flg-accent-end: #db2777;
}
```

## Light, dark and nested themes

`data-flg-theme="light"` or `"dark"` works on `<html>` or on any element, so a dark sidebar can sit
inside a light page. Without the attribute the operating system preference decides.

## Theme tokens

<TokenTable columns={{ light: themes.light, dark: themes.dark }} />

## Derived tokens

Recomputed on every theme root, so a nested theme uses its own blur and accent gradient.

<TokenTable columns={{ value: derivedTokens }} />

## Base tokens

<TokenTable columns={{ value: baseTokens }} />

## Higher-contrast overrides

Applied automatically when the operating system asks for more contrast (`prefers-contrast: more`).

<TokenTable
  columns={{ shared: contrastMore.shared, light: contrastMore.light, dark: contrastMore.dark }}
/>
````

`src/docs/Accessibility.mdx`:

````mdx
import { Meta, Source } from '@storybook/addon-docs/blocks';
import { buildAaOverrideSnippet } from '../../scripts/lib/theme-css';
import { referenceBackgrounds } from '../styles/theme/values';
import { ExceptionTable } from './ExceptionTable';

<Meta title="Docs/Accessibility" />

# Accessibility

Keyboard support, focus handling, semantics and screen-reader behaviour target WCAG 2.2 AA.

## Colour contrast: known gaps

The default theme reproduces the approved visual design exactly. In the places below that design
falls short of the WCAG AA contrast minimums. Values are the lowest ratio measured over the
reference backdrops, rounded down, and CI fails if any of them gets worse.

<ExceptionTable />

Every gap is closed when the operating system asks for more contrast (`prefers-contrast: more`).

## Meeting AA by default

If your product must meet WCAG AA without relying on that setting, paste this into your global CSS,
outside any `@layer`:

<Source language="css" code={buildAaOverrideSnippet()} />

## Reference backdrops

Contrast is measured with glass over these colours. Placing glass over busier imagery is the
application's responsibility.

- Light: {referenceBackgrounds.light.join(', ')}
- Dark: {referenceBackgrounds.dark.join(', ')}

## Other preferences

- Without `backdrop-filter` support, or with `prefers-reduced-transparency: reduce`, surfaces become
  almost opaque.
- In `forced-colors: active` (Windows High Contrast) the library uses system colours and keeps
  borders and focus outlines visible.
- With `prefers-reduced-motion: reduce` transitions stop; spinners keep turning, more slowly.
````

- [ ] **Step 4: Chạy test và build Storybook**

Run: `pnpm test:unit && pnpm build-storybook`
Expected: test PASS (thêm 3 test). Build Storybook thành công, và `storybook-static/index.json` có thêm 3 mục `docs-getting-started--docs`, `docs-theming--docs` và `docs-accessibility--docs`.

- [ ] **Step 5: Lint, typecheck, format và commit**

```bash
pnpm lint && pnpm typecheck
pnpm format
git add -A
git commit -m "docs: add getting started, theming and accessibility pages" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Visual regression (spec §7, lớp 5)

**Files:**
- Create: `playwright.visual.config.ts`, `tests/visual/stories.visual.ts`, `scripts/serve-static.mjs`, `scripts/visual.sh`
- Modify: `package.json`

**Interfaces:**
- Consumes: `storybook-static/index.json` và `data-testid="flg-stage"` (Task 7). Một story có tag `no-visual` sẽ được bỏ qua.
- Produces: ảnh chuẩn tại `tests/visual/__screenshots__/<story-id>--<theme>--<mode>.png`. Có 4 chế độ: `normal`, `solid`, `contrast-more`, `forced-colors`.

- [ ] **Step 1: Cài Playwright test runner**

```bash
pnpm add -D @playwright/test@1.63.0
```

- [ ] **Step 2: Viết cấu hình, test và server tĩnh**

`playwright.visual.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/visual',
  testMatch: '*.visual.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:6007' },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'node scripts/serve-static.mjs storybook-static 6007',
    url: 'http://127.0.0.1:6007/index.json',
    reuseExistingServer: !process.env.CI,
  },
});
```

`tests/visual/stories.visual.ts`:

```ts
import { expect, test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

interface IndexEntry {
  id: string;
  type: 'story' | 'docs';
  tags?: string[];
}

const INDEX = 'storybook-static/index.json';
if (!existsSync(INDEX)) throw new Error(`${INDEX} is missing. Run "pnpm build-storybook" first.`);
const entries = (JSON.parse(readFileSync(INDEX, 'utf8')) as { entries: Record<string, IndexEntry> })
  .entries;
const stories = Object.values(entries).filter(
  (entry) => entry.type === 'story' && !entry.tags?.includes('no-visual'),
);

const THEMES = ['light', 'dark'] as const;
const MODES = [
  { name: 'normal', simulate: 'none' },
  { name: 'solid', simulate: 'solid' },
  { name: 'contrast-more', simulate: 'none', media: { contrast: 'more' } },
  { name: 'forced-colors', simulate: 'none', media: { forcedColors: 'active' } },
] as const;

for (const story of stories) {
  for (const theme of THEMES) {
    for (const mode of MODES) {
      test(`${story.id} · ${theme} · ${mode.name}`, async ({ page }) => {
        if ('media' in mode) await page.emulateMedia(mode.media);
        await page.goto(
          `/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};simulate:${mode.simulate}`,
        );
        const stage = page.getByTestId('flg-stage');
        await stage.waitFor();
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        await expect(stage).toHaveScreenshot(`${story.id}--${theme}--${mode.name}.png`);
      });
    }
  }
}
```

`scripts/serve-static.mjs`:

```js
// Minimal static file server for the built Storybook, used by the visual tests.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const [root = 'storybook-static', port = '6007'] = process.argv.slice(2);
const base = resolve(root);
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  let file = normalize(join(base, path));
  if (!file.startsWith(base)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(Number(port), '127.0.0.1', () => {
  console.log(`Serving ${base} on http://127.0.0.1:${port}`);
});
```

`scripts/visual.sh`:

```sh
#!/usr/bin/env sh
# Runs the visual tests in the pinned Playwright image so screenshots match CI.
# Needs Docker. node_modules lives in a named volume so Linux binaries never touch the host copy.
set -eu
IMAGE=mcr.microsoft.com/playwright:v1.63.0-noble
docker run --rm --ipc=host \
  -v "$(pwd)":/work -v flg-glass-node-modules:/work/node_modules -w /work "$IMAGE" \
  sh -c "corepack enable && pnpm install --frozen-lockfile && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts $*"
```

Thêm script:

```bash
pnpm pkg set scripts.test:visual="sh scripts/visual.sh"
pnpm pkg set scripts.test:visual:update="sh scripts/visual.sh --update-snapshots"
pnpm pkg set scripts.test:visual:ci="playwright test -c playwright.visual.config.ts"
```

- [ ] **Step 3: Kiểm tra danh sách test**

Run: `pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts --list`
Expected: liệt kê đúng **32 test** (4 story × 2 theme × 4 chế độ). Mỗi tên test có dạng `foundation-surface--default · light · normal`.

Máy hiện tại **không có Docker**, nên chưa tạo được ảnh chuẩn khớp với CI tại đây. Ảnh chuẩn đầu tiên sẽ do workflow `Update visual baselines` ở Task 10 tạo ra. Đừng commit ảnh chụp trên Windows: `backdrop-filter` vẽ khác nhau giữa các hệ điều hành, nên ảnh Windows sẽ làm CI fail.

- [ ] **Step 4: Lint, typecheck, format và commit**

```bash
pnpm lint && pnpm typecheck
pnpm format
git add -A
git commit -m "test: add Playwright visual regression over every story" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: CI/CD, Changesets và tài liệu repo

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/docs.yml`, `.github/workflows/release.yml`, `.github/workflows/visual-update.yml`, `.github/pull_request_template.md`, `.changeset/config.json`, `README.md`, `CONTRIBUTING.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: mọi script trong `package.json` đã tạo ở các task trước.
- Produces: các workflow `CI`, `Docs`, `Release`, `Update visual baselines`; script `changeset` và `release`.

- [ ] **Step 1: Cài Changesets**

```bash
pnpm add -D @changesets/cli@3.0.3
pnpm exec changeset init
pnpm pkg set scripts.changeset="changeset"
pnpm pkg set scripts.release="pnpm build && changeset publish"
```

Thay toàn bộ nội dung `.changeset/config.json` bằng:

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 2: Viết các workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm gen:theme
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm test:unit
      - run: pnpm check:contrast
      - run: pnpm build
      - run: pnpm check:package

  stories:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium firefox webkit
      - run: pnpm test:stories

  visual:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.63.0-noble
      options: --ipc=host
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build-storybook
      - run: pnpm test:visual:ci
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-report
          path: playwright-report
```

`.github/workflows/docs.yml`:

```yaml
name: Docs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build-storybook
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: storybook-static

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      # Opens or updates the "Version Packages" PR; once that PR is merged, publishes to npm through
      # trusted publishing (OIDC) with provenance. No npm token is stored in the repository.
      - uses: changesets/action@v1
        with:
          version: pnpm changeset version
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_CONFIG_PROVENANCE: 'true'
```

`.github/workflows/visual-update.yml`:

```yaml
name: Update visual baselines

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.63.0-noble
      options: --ipc=host
    steps:
      - run: apt-get update && apt-get install -y git
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build-storybook
      - run: pnpm test:visual:ci --update-snapshots
      - name: Commit updated baselines
        run: |
          git config --global --add safe.directory "$GITHUB_WORKSPACE"
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add tests/visual/__screenshots__
          git diff --cached --quiet || (git commit -m "test: update visual baselines" && git push)
```

- [ ] **Step 3: Viết tài liệu repo**

`.github/pull_request_template.md`:

```md
## What changed

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` and `pnpm check:contrast` pass locally
- [ ] Stories added or updated, and `pnpm test:stories` passes
- [ ] Visual baselines updated through the "Update visual baselines" workflow if the change is intentionally visual
- [ ] A changeset is included (`pnpm changeset`) if the published package changes
- [ ] No mockup token in `src/styles/theme/values.ts` changed without the project owner's approval

## Screen reader check (one row per changed component)

Write "not tested" rather than leaving a box unticked when a combination was not available.

| Component | NVDA + Firefox or Chrome (Windows) | VoiceOver + Safari (macOS) |
| --------- | ---------------------------------- | -------------------------- |
|           |                                    |                            |
```

`README.md`:

```md
# fl-glass-ui

Glassmorphism UI components for React 18.3+ and 19. Plain CSS with no runtime styling, and
friendly to React Server Components.

> Status: 0.x. The foundation is in place; components land phase by phase.

## Install

    pnpm add fl-glass-ui

## Use

    import 'fl-glass-ui/styles.css';
    import { Surface } from 'fl-glass-ui';

    export function Panel() {
      return <Surface style={{ padding: 18 }}>Hello, glass</Surface>;
    }

## Documentation

The Storybook documentation is published to GitHub Pages from `main`.

## Accessibility

Behaviour targets WCAG 2.2 AA. The default colours reproduce the approved design and miss the AA
contrast minimums in a few documented places; the Accessibility page lists them and provides a
ready-made AA override.

## Package format

ESM only. Node 20.19+ can `require()` it.

## License

MIT
```

`CONTRIBUTING.md`:

```md
# Contributing

## Setup

- Node 24 (see `.node-version`).
- pnpm 10: run `corepack enable`, and the version pinned in `package.json` is used automatically.
- `pnpm install`, then `pnpm exec playwright install chromium firefox webkit`.

## Everyday commands

| Command                | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `pnpm storybook`       | Storybook on http://localhost:6006                              |
| `pnpm test:unit`       | Unit, type and script tests (jsdom and Node)                    |
| `pnpm test:stories`    | Every story in Chromium, Firefox and WebKit, light and dark, with axe |
| `pnpm check:contrast`  | WCAG contrast of every token over the reference backdrops       |
| `pnpm build`           | Builds `dist/`                                                  |
| `pnpm check:package`   | Checks the build: CSS, `"use client"`, RSC safety, publint, attw, size |
| `pnpm lint`, `pnpm typecheck`, `pnpm format` | The usual                                  |

## Design tokens

Every token lives in `src/styles/theme/values.ts`; the CSS is generated from it (`pnpm gen:theme`).
Values that reproduce the approved mockups (`docs/superpowers/specs/mockups/`) are locked: change
them only with the project owner's approval. Tokens marked "(outside mockup)" may be tuned to pass
the contrast check.

## Visual baselines

Screenshots are compared in a pinned Linux container, because glass renders differently on each
operating system. To create or update baselines, run the "Update visual baselines" workflow on your
branch; it commits the new images. With Docker installed you can also run `pnpm test:visual:update`
locally. Never commit screenshots taken outside the container.

## Screen reader checks

Before a release, check each changed component with NVDA + Firefox or Chrome on Windows and with
VoiceOver + Safari on macOS, and record the result in the pull request. When a combination is not
available, write "not tested"; never mark it as passed.

## Changesets

Run `pnpm changeset` for any change to the published package and describe it for the changelog.
```

- [ ] **Step 4: Kiểm tra cú pháp YAML và toàn bộ chuỗi kiểm tra cục bộ**

Run:

```bash
for f in .github/workflows/*.yml; do pnpm dlx js-yaml "$f" > /dev/null && echo "ok $f"; done
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit && pnpm check:contrast && pnpm build && pnpm check:package && pnpm test:stories
```

Expected:
- 4 dòng `ok .github/workflows/....yml`.
- Toàn bộ chuỗi kiểm tra xanh, đúng thứ tự của job `checks` và `stories` trong CI.

Có ba việc **chưa kiểm chứng được** trên máy này: các workflow chạy thật trên GitHub, việc publish qua OIDC, và việc deploy Pages. Lý do là repo chưa có remote, và đó là việc của chủ dự án. Hãy ghi rõ điều này khi báo cáo kết quả.

- [ ] **Step 5: Format và commit**

```bash
pnpm format
git add -A
git commit -m "ci: add CI, docs, release and visual baseline workflows" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Việc của chủ dự án sau Plan 1 (agent không làm thay)

1. Tạo repo trên GitHub, thêm remote, rồi push `main`.
2. Thêm vào `package.json` các trường `repository` (`{ "type": "git", "url": "git+https://github.com/<owner>/<repo>.git" }`), `homepage` và `bugs`, khớp đúng với repo vừa tạo. Thiếu `repository.url`, hoặc URL không khớp với repo chạy workflow, thì npm từ chối publish có provenance (lỗi E422). Agent không điền thay, vì chỉ biết URL sau khi repo đã được tạo.
3. Bật GitHub Pages với nguồn là "GitHub Actions".
4. Chạy workflow **Update visual baselines** một lần trên `main` để tạo ảnh chuẩn đầu tiên.
5. Tạo tài khoản npm (bật 2FA), cấu hình trusted publisher cho `fl-glass-ui` trỏ tới repo và `release.yml`. Khi đến giai đoạn 1, bỏ `"private": true` khỏi `package.json` rồi tự làm lần publish đầu tiên (spec §8.3).
