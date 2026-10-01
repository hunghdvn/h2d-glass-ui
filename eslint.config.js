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
