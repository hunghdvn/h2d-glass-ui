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

The workflow pushes its commit with `GITHUB_TOKEN`, and GitHub does not start new workflow runs for
such pushes, so CI does not run on that commit. Re-running an earlier CI run does not help either:
a re-run tests the commit it first ran on, which has no baselines. Push any later change, or close
and reopen the pull request, before you rely on a green check; keep this in mind before making CI a
required check.

## Screen reader checks

Before a release, check each changed component with NVDA + Firefox or Chrome on Windows and with
VoiceOver + Safari on macOS, and record the result in the pull request. When a combination is not
available, write "not tested"; never mark it as passed.

## Changesets

Run `pnpm changeset` for any change to the published package and describe it for the changelog.

## Releasing (maintainers)

Publishing goes through `.github/workflows/release.yml`: Changesets opens a "Version Packages" pull
request, and merging it publishes to npm through trusted publishing (OIDC) with provenance. No npm
token is stored anywhere. Before the first release, take these steps in this order (the optional one can be skipped):

1. Make the repository public. npm refuses a provenance publish from a private repository
   (E422 "Unsupported GitHub Actions source repository visibility"), and `release.yml` sets
   `NPM_CONFIG_PROVENANCE`. If the repository has to stay private, remove that variable instead:
   trusted publishing still works, only the provenance attestation is lost.
2. Check that `repository`, `homepage` and `bugs` in `package.json` still match the repository
   exactly. npm also rejects a provenance publish (E422) when `repository.url` does not match the
   repository the workflow runs in.
3. Optionally enable GitHub Pages with "GitHub Actions" as the source, so `docs.yml` can deploy
   Storybook.
4. On npmjs.com (account with 2FA), configure a trusted publisher for `h2d-glass-ui` pointing at this
   repository and the `release.yml` workflow.
5. Remove `"private": true` from `package.json` when you are ready for the first publish. Changesets
   skips private packages, so this is also what makes the Release workflow open the "Version
   Packages" pull request that bumps the version to 0.1.0. Merging that pull request publishes.
   Until then the Release workflow skips the Changesets step, so pushes to `main` stay green.

`prepublishOnly` runs `pnpm build && pnpm check:package`, so even a manual `npm publish` cannot ship
a stale or missing `dist/`.
