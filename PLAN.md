# Bit Rot Remediation Plan

## Current State

This repository is a Next.js 15 / React 18 / TypeScript 5.9 app using Yarn 1 and Cypress 15. It installs successfully with the committed lockfile and builds under Node 22 when required public env vars are present.

Recent safe fixes added guardrails for analytics, local scripts, environment examples, Node version documentation, and Cypress expectations that match the current resize-session behavior.

## Verified Checks

- `yarn typecheck`: passes.
- `yarn lint`: passes with no warnings.
- `yarn cypress:run --browser electron --headless`: passes 9 active tests.
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_KEY=dummy NEXT_PUBLIC_BASE_API_URL=http://localhost:3000 yarn build`: passes on Node 22.19.0.
- Sentry source-map upload wiring: when `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, and `VERCEL_GIT_COMMIT_SHA` are all set in production builds, the Sentry webpack plugin runs and attempts release creation. Verified locally with dummy credentials (401 from Sentry confirms the plugin is active; use real org/project/token in CI or Vercel for successful uploads).

## Phase 1: Stabilize the Existing App

1. Keep Node 22 documented through `.nvmrc` and `package.json`.
2. Add CI that runs `yarn install --frozen-lockfile`, `yarn typecheck`, `yarn lint`, and `yarn cypress:run`.
3. Removed empty Cypress placeholder specs (`anchor-session`, `handle-session`, `rotate-session`, `transform-session`, `translate-session`); keep `move-session` and `resize-session` until Phase 4 adds coverage for the remaining sessions.
4. Reduce lint warnings, starting with unused imports and variables. Avoid behavior changes during this cleanup.

## Phase 2: Dependency Security

1. Replace or upgrade high-risk dependency trees reported by `yarn audit`.
2. Prioritize runtime-facing packages: Next, Sentry, Supabase, Puppeteer, and Chromium social-image generation.
3. Re-run `yarn audit` after each upgrade batch and record remaining accepted risks.
4. Accepted risk: most remaining advisories come from `@state-designer/react` pulling in the deprecated `tsdx`/Jest toolchain. Yarn `resolutions` patch several shared transitive packages; a full fix likely requires replacing or forking `@state-designer/react`.

## Phase 3: Framework Upgrade

1. Keep Next and React on supported versions for Node 22.
2. Verify dynamic editor loading, `getServerSideProps` share pages, and the social-image API after framework changes.
3. Replace deprecated Sentry integration patterns as required.

## Phase 4: Test Coverage

1. Convert session tests to cover every interaction session with non-empty specs.
2. Add a smoke test for loading the editor canvas.
3. Add share-link tests around Supabase API wrappers with mocked responses.
4. Add a social-image API test or script that verifies Chromium launches and closes cleanly.

## Known Risks

- Supabase credentials are required at build time because shared project pages import the Supabase client during page-data collection.
- `NEXT_PUBLIC_BASE_API_URL` is assumed in share links and social images; missing values will produce broken URLs.
