# Contributing

## Setup

- Node 24 (see `.node-version`).
- pnpm 10: run `corepack enable`, and the version pinned in `package.json` is used automatically.
- `pnpm install`, then `pnpm exec playwright install chromium firefox webkit`.

## Everyday commands

| Command                                      | What it does                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm storybook`                             | Storybook on http://localhost:6006                                                                  |
| `pnpm test:unit`                             | Unit, type and script tests (jsdom and Node)                                                        |
| `pnpm test:stories`                          | Every story in Chromium, Firefox and WebKit, light and dark, with axe                               |
| `pnpm check:contrast`                        | WCAG contrast of every token over the reference backdrops                                           |
| `pnpm build`                                 | Builds `dist/`                                                                                      |
| `pnpm check:package`                         | Checks the build: CSS, `"use client"`, RSC safety, publint, attw, size                              |
| `pnpm test:fixtures`                         | Installs the packed build into the Vite and Next.js apps in `fixtures/` and checks them in Chromium |
| `pnpm lint`, `pnpm typecheck`, `pnpm format` | The usual                                                                                           |

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

## Releasing (maintainers)

Publishing goes through `.github/workflows/release.yml`: Changesets opens a "Version Packages" pull
request, and merging it publishes to npm through trusted publishing (OIDC) with provenance. No npm
token is stored anywhere. Before the first release, in this order:

1. Create the GitHub repository and push `main`.
2. Add `repository`, `homepage` and `bugs` to `package.json`, matching that repository exactly:

   ```json
   "repository": { "type": "git", "url": "git+https://github.com/<owner>/<repo>.git" },
   "homepage": "https://github.com/<owner>/<repo>#readme",
   "bugs": { "url": "https://github.com/<owner>/<repo>/issues" }
   ```

   npm rejects a provenance publish (E422) when `repository.url` is missing or does not match the
   repository the workflow runs in.

3. Enable GitHub Pages with "GitHub Actions" as the source, so `docs.yml` can deploy Storybook.
4. Run the "Update visual baselines" workflow once on `main` to create the first baselines.
5. On npmjs.com (account with 2FA), configure a trusted publisher for `fl-glass-ui` pointing at this
   repository and the `release.yml` workflow.
6. Remove `"private": true` from `package.json` only when you are ready for the first publish. Until
   then it keeps the Release workflow from publishing anything.

`prepublishOnly` runs `pnpm build && pnpm check:package`, so even a manual `npm publish` cannot ship
a stale or missing `dist/`.
