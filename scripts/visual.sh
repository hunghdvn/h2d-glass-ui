#!/usr/bin/env sh
# Runs the visual tests in the pinned Playwright image so screenshots match CI.
# Needs Docker. node_modules lives in a named volume so Linux binaries never touch the host copy.
set -eu
IMAGE=mcr.microsoft.com/playwright:v1.63.0-noble
docker run --rm --ipc=host \
  -v "$(pwd)":/work -v flg-glass-node-modules:/work/node_modules -w /work "$IMAGE" \
  sh -c "corepack enable && pnpm install --frozen-lockfile && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts $*"
