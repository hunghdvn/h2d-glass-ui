#!/usr/bin/env sh
# Runs the visual tests in the pinned Playwright image so screenshots match CI.
# Needs Docker. node_modules lives in a named volume so Linux binaries never touch the host copy.
# Arguments go to `playwright test`, e.g. `sh scripts/visual.sh --update-snapshots`.
set -eu
IMAGE=mcr.microsoft.com/playwright:v1.63.0-noble

if ! command -v docker >/dev/null 2>&1; then
  echo 'scripts/visual.sh: docker is not on PATH. Install Docker, or run the "Update visual baselines" workflow instead.' >&2
  exit 1
fi

# Git Bash on Windows rewrites anything that looks like a POSIX path (`-w /work` would become
# `C:/Program Files/Git/work`). Switch that off and mount the Windows form of the current directory.
export MSYS_NO_PATHCONV=1
HOST_DIR=$(pwd -W 2>/dev/null || pwd)

docker run --rm --ipc=host \
  -v "$HOST_DIR":/work -v flg-glass-node-modules:/work/node_modules -w /work "$IMAGE" \
  sh -c 'corepack enable && pnpm install --frozen-lockfile && pnpm build-storybook && pnpm exec playwright test -c playwright.visual.config.ts "$@"' \
  sh "$@"
