# h2d-glass-ui

Glassmorphism UI components for React 18.3+ and 19. Plain CSS with no runtime styling, and
friendly to React Server Components.

> Status: 0.x. The API may still change between minor versions; the changelog says how.

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

The component documentation is at https://hunghdvn.github.io/h2d-glass-ui/: the Storybook that
`docs.yml` deploys to GitHub Pages on every push to `main`. Run `pnpm storybook` in a clone to work
on it locally.

## Accessibility

Behaviour targets WCAG 2.2 AA. The default colours reproduce the approved design and miss the AA
contrast minimums in a few documented places; the Accessibility page lists them and provides a
ready-made AA override.

## Package format

ESM only. Node 20.19+ can `require()` it.

## Sponsor

If h2d-glass-ui saves you time, you can support its development through
[GitHub Sponsors](https://github.com/sponsors/hunghdvn).

## License

MIT
