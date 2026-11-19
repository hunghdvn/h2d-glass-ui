import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      // MDX reads only CommonMark: without GitHub-flavoured Markdown, the props and keyboard tables
      // of the MDX pages are shown as lines of pipes. `pnpm check:docs-tables` guards it.
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
  ],
  typescript: { reactDocgen: 'react-docgen-typescript' },
  // Stories and pages tagged `unreleased` (the DataGrid until Plan G exports it) stay out of the sidebar of
  // the built site. They are still in index.json, which the visual harness reads, and still run in
  // the story tests.
  tags: { unreleased: { excludeFromSidebar: true } },
};

export default config;
