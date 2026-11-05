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
request, and merging it publishes to npm through trusted publishing (OIDC) with provenance. After
the first version, no npm token is needed or stored. Before the first release, take these steps in
this order:

1. Keep the repository public (it is, since 2026-11-04). npm refuses a provenance publish from a
   private repository (E422 "Unsupported GitHub Actions source repository visibility"), and
   `release.yml` sets `NPM_CONFIG_PROVENANCE`. If the repository has to go private, remove that
   variable instead: trusted publishing still works, only the provenance attestation is lost.
2. Check that `repository` and `bugs` in `package.json` still match the repository exactly. npm
   also rejects a provenance publish (E422) when `repository.url` does not match the repository the
   workflow runs in. `homepage` is the docs site, not the repository.
3. Keep GitHub Pages enabled with "GitHub Actions" as the source (it is, since 2026-11-04).
   `homepage` points at the Storybook that `docs.yml` deploys there, so without Pages the Homepage
   link on the npm page leads to a 404.
4. `"private": true` is gone from `package.json` (2026-11-05). Changesets skips private packages,
   so this is what lets the Release workflow version and publish. From `0.0.0` it folded every
   pending changeset into one minor release, `0.1.0`; the changelog still lists each of them.
5. npm offers trusted-publisher settings only for a package that already exists (true in November
   2026; check npm's documentation, it may change). The package was created on 2026-11-05 by a
   staged publish from the owner's machine, which leaves the placeholder version `0.0.0-stage`.
6. On npmjs.com the package has a trusted publisher, `hunghdvn/h2d-glass-ui` with `release.yml`,
   allowed to `npm publish` (otherwise every release would wait as a staged version for a
   maintainer's 2FA approval), and its publishing access is "Require two-factor authentication and
   disallow bypass 2fa tokens". npm marks a new trusted publisher "pending validation" until one
   publish goes through it, within two days. The first one was `0.1.0`, from this workflow, with
   provenance.

`release.yml` gives `setup-node` no `registry-url`: that would write an `.npmrc` holding a
placeholder token, which npm would send instead of asking GitHub for an OIDC token. It installs
npm 11, since trusted publishing needs npm 11.5.1 or later and `pnpm publish` hands the tarball to
npm.

`prepublishOnly` runs `pnpm build && pnpm check:package`, so even a manual `npm publish` cannot ship
a stale or missing `dist/`.
