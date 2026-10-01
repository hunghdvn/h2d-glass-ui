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
