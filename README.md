# h2d-glass-ui

Glassmorphism UI components for React 18.3+ and 19. Plain CSS with no runtime styling, and
friendly to React Server Components.

> Status: 0.x, not yet published. Phase 1 is complete: Surface, Card, Button, IconButton, Badge,
> Avatar, Divider, Spinner, Field, Input, Textarea, Checkbox, RadioGroup and Switch.

## Install

    pnpm add h2d-glass-ui

## Use

    import 'h2d-glass-ui/styles.css';
    import { Button, Card, CardContent, CardFooter, Field, Input } from 'h2d-glass-ui';

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

## Documentation

Run `pnpm storybook` in a clone for the component documentation. `docs.yml` publishes the same
Storybook to GitHub Pages once Pages is enabled for the repository.

## Accessibility

Behaviour targets WCAG 2.2 AA. The default colours reproduce the approved design and miss the AA
contrast minimums in a few documented places; the Accessibility page lists them and provides a
ready-made AA override.

## Package format

ESM only. Node 20.19+ can `require()` it.

## License

MIT
