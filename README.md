# fl-glass-ui

Glassmorphism UI components for React 18.3+ and 19. Plain CSS with no runtime styling, and
friendly to React Server Components.

> Status: 0.x, not yet published. Available: Surface, Card, Button, IconButton, Badge, Avatar,
> Divider and Spinner. Form controls come next.

## Install

    pnpm add fl-glass-ui

## Use

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
