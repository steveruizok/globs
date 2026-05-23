# Bit Rot Remediation Plan

## Current State

This repository is a legacy Next.js 10 / React 17 / TypeScript 4.2 app using Yarn 1 and Cypress 7. It installs successfully with the committed lockfile, but the production build does not run under Node 22 because old Next/PostCSS internals import an unexported PostCSS path. The build does complete under Node 16.20.2 when required public env vars are present.

Recent safe fixes added guardrails for analytics, local scripts, environment examples, Node version documentation, and Cypress expectations that match the current resize-session behavior.

## Verified Checks

- `yarn typecheck`: passes.
- `yarn lint`: passes with warnings.
- `yarn cypress:run --browser electron --headless`: passes 9 active tests.
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_KEY=dummy NEXT_PUBLIC_BASE_API_URL=http://localhost:3000 npx -y node@16 ./node_modules/.bin/next build`: passes.
- `yarn build` on Node 22: fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` from Next 10 / PostCSS.

## Phase 1: Stabilize the Existing App

1. Keep Node 16 documented through `.nvmrc` until the framework upgrade lands.
2. Add CI that runs `yarn install --frozen-lockfile`, `yarn typecheck`, `yarn lint`, and `yarn cypress:run`.
3. Decide whether empty Cypress specs should be deleted or implemented: `anchor-session.ts`, `handle-session.ts`, `rotate-session.ts`, `transform-session.ts`, and `translate-session.ts`.
4. Reduce lint warnings, starting with unused imports and variables. Avoid behavior changes during this cleanup.

## Phase 2: Dependency Security

1. Replace or upgrade high-risk dependency trees reported by `yarn audit`.
2. Prioritize runtime-facing packages: Next, Sentry, Supabase, Puppeteer, and Chromium social-image generation.
3. Re-run `yarn audit` after each upgrade batch and record remaining accepted risks.

## Phase 3: Framework Upgrade

1. Upgrade Next incrementally rather than jumping directly to the latest major.
2. Keep React at 17 for the first Next upgrade if possible, then move React separately.
3. Verify dynamic editor loading, `getServerSideProps` share pages, and the social-image API after each step.
4. Replace deprecated Next configuration and Sentry integration patterns as required.

## Phase 4: Test Coverage

1. Convert session tests to cover every interaction session with non-empty specs.
2. Add a smoke test for loading the editor canvas.
3. Add share-link tests around Supabase API wrappers with mocked responses.
4. Add a social-image API test or script that verifies Chromium launches and closes cleanly.

## Known Risks

- Supabase credentials are required at build time because shared project pages import the Supabase client during page-data collection.
- `chrome-aws-lambda` and `puppeteer-core` have a peer-version mismatch.
- The social-image API does not currently use a `finally` block to close Chromium on failure.
- `NEXT_PUBLIC_BASE_API_URL` is assumed in share links and social images; missing values will produce broken URLs.
