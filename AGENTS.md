# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 TypeScript app for editing and sharing globs. Route pages and API endpoints live in `pages/`, including `pages/api/p/[uuid]/social-image.tsx` for generated social images. Shared editor logic is in `lib/`, with interaction sessions under `lib/sessions/`. React UI is split between `components/`, `components/canvas/`, and `components/ui/`. Reusable hooks are in `hooks/`, global styling lives in `styles/` and `stitches.config.ts`, static assets are in `public/`, and Cypress fixtures/tests are in `cypress/`.

## Build, Test, and Development Commands

Use Yarn, since `yarn.lock` is committed. This stack builds on Node 22; run `nvm use` before installing or building.

- `yarn dev`: start the local Next.js development server at `http://localhost:3000`.
- `yarn build`: create a production Next.js build.
- `yarn start`: serve the production build after `yarn build`.
- `yarn typecheck`: run TypeScript without emitting files.
- `yarn lint`: run ESLint across TypeScript and JavaScript files.
- `yarn cypress:open`: open the Cypress runner for integration tests.
- `yarn cypress:run`: run Cypress specs headlessly.

## Coding Style & Naming Conventions

Write TypeScript and React function components using the existing style: two-space indentation, double quotes, no semicolons, and concise named constants. Component files generally use kebab-case paths such as `components/ui/icon-button.tsx`; exported React components use PascalCase. Hooks must be named `useSomething` and live in `hooks/` unless tightly coupled to a component folder. Prefer existing path aliases such as `lib/state`, `hooks/useTheme`, and `utils` over long relative imports.

## Testing Guidelines

Cypress is the active test framework. Integration specs live in `cypress/integration/` and commonly target interaction session behavior, for example `move-session.ts` or `resize-session.ts`. Add fixtures in `cypress/fixtures/` when tests need reusable project data. Run tests through the Cypress UI with `yarn cypress:open` or headlessly with `yarn cypress:run`.

## Commit & Pull Request Guidelines

Recent commits use short, sentence-case summaries such as `Minor cleanup` and `Adds sentry`. Keep commit subjects direct and under about 72 characters; mention the affected area when useful. Pull requests should include a brief description, testing performed, linked issues when applicable, and screenshots or recordings for UI changes to the editor, panels, canvas, or social image output.

## Security & Configuration Tips

Do not commit secrets for Supabase, Sentry, analytics, or deployment services. Copy `.env.example` to a local `.env` and fill in real values outside version control. Verify generated public/share links do not expose private project data.
