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
      data-flg-simulate={
        simulate === 'solid' || simulate === 'contrast-more' ? simulate : undefined
      }
      data-backdrop={backdrop === 'mockup' ? 'mockup' : 'solid'}
      data-stage={context.parameters.stage === 'viewport' ? 'viewport' : undefined}
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
