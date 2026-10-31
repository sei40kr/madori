# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Madori is a browser-only floor plan editor. It exports as a static site and keeps all data in localStorage.

# Tech stack

- Next.js 16 (App Router, static export) with React 19 and TypeScript
- Chakra UI v3 for components, `next-themes` for color mode, `lucide-react` for icons
- zustand for state, `@use-gesture/react` for canvas input
- Bun as package manager and runner; Biome for lint and format (tabs, double quotes)
- Nix devshell for the toolchain; Terraform, S3, and CloudFront for hosting

# Commands

The Nix devshell (`flake.nix`, loaded by direnv) provides Bun and Node.js.

- `bun dev` — dev server on http://localhost:3000
- `bun run build` — static export to `out/` (`output: "export"`)
- `bun run check` — Biome lint and format check; `bun run format` fixes formatting
- `bunx tsc --noEmit` — type check (no script for it)

There are no tests.

# Architecture

Plan coordinates and sizes are in centimetres; `View` maps them to screen pixels.

- `src/lib/types.ts` — item types. Doors and windows sit on a wall and move with it (`attachedTo`).
- `PlanSvg` draws the plan; `Canvas` handles input. Export clones that SVG, so mark editor-only elements `data-noexport`.

## State and persistence

All state lives in one zustand store, `usePlanStore` in `src/lib/plan-store.ts`.

- `plans` holds every saved plan, each with `floors`. `items` and `name` mirror the open floor and plan; a `subscribe` at the bottom of the file writes them back into `plans`, so actions edit `items` only.
- Edit through `commit`. A `key` merges rapid edits to the same field into one undo step. Drags call `preview` on each move, then `record` the pre-drag items once.
- Undo spans the whole plan, so floor edits and floor additions, deletions, and moves undo in order. History resets when another plan opens.
- `persist` writes `plans`, `curId`, and `showGuide` to localStorage under `madori.plan.v1`; nothing goes to a server. Changing that shape needs a `version` bump and a `migrate` step.
- `skipHydration` is on, and `Editor` calls `rehydrate()` after mount so the server and first client renders match. Code that reads saved plans must wait for it.

# Design

Design mockup: https://claude.ai/design/p/d06ccf08-d9bc-4036-a091-f33a26745735?file=Floor+Plan+Maker.dc.html

Read it through the `claude_design` MCP. If it is not authenticated, run `/design-login` first.

# Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: it builds, syncs `out/` to S3, and invalidates CloudFront. Infrastructure lives in `terraform/` (see `terraform/README.md`).
