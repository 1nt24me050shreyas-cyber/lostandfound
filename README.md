# Common Ground

A responsive lost-and-found portal built with React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Radix UI, and MSW.

## Requirements

- Node.js 20 or newer
- npm
- Chromium for Playwright and Lighthouse checks

## Setup

```sh
npm install
```

Copy `.env.example` to `.env` and start the app:

```powershell
Copy-Item .env.example .env
npm run dev
```

On macOS or Linux, use `cp .env.example .env`. The app runs at `http://localhost:5173`.

The browser MSW worker is enabled by default in development and production. It serves a seeded demo API; changes are held in mock memory and reset when its worker context restarts. Demo accounts:

| Role          | Email               | Password      |
| ------------- | ------------------- | ------------- |
| Member        | `alex@example.com`  | `password123` |
| Administrator | `admin@example.com` | `admin123`    |

Mock access and refresh tokens exist only in memory. Refresh is automatic after an eligible `401`; reloading the page signs the mock user out.

## Commands

| Command                   | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `npm run dev`             | Start the Vite development server                           |
| `npm run build`           | Type-check and create the production bundle                 |
| `npm run preview`         | Preview the production bundle                               |
| `npm run lint`            | Run ESLint                                                  |
| `npm run format`          | Format tracked and untracked supported files with Prettier  |
| `npm run format:check`    | Check formatting                                            |
| `npm test`                | Run Vitest and Testing Library tests once                   |
| `npm run test:watch`      | Run Vitest in watch mode                                    |
| `npm run test:e2e`        | Run Playwright flows in light and dark themes               |
| `npm run test:lighthouse` | Measure Lighthouse scores and enforce the target thresholds |
| `npm run prepare:mock`    | Copy the MSW service worker to `public/`                    |

Install the Playwright browser once before E2E or Lighthouse runs:

```sh
npx playwright install chromium
```

The Lighthouse command starts its own Vite server and requires the Playwright Chromium binary to be installed. It exits unsuccessfully if Performance is below 90, Accessibility below 100, or Best Practices below 95. Scores depend on the machine, network, and browser; run the check rather than treating these targets as achieved results.

## Structure

```text
src/
  app/             App composition, route table, auth and theme providers
  components/      Shared layout and UI components
  features/        Typed API clients, auth/session logic, feature schemas
  hooks/           Shared React hooks
  lib/             Environment parsing and API client
  mocks/           MSW browser worker, handlers, and seed data
  pages/           Route-level page components
  styles/          Theme tokens and component/layout styles
  types/           Shared domain types
tests/
  unit/            Vitest and Testing Library tests
  e2e/             Playwright user journeys
scripts/           Repository checks, including Lighthouse thresholds
```

## Design tokens and themes

Design tokens are defined in [`src/styles/tokens.css`](./src/styles/tokens.css). They include light/dark semantic colors, text-size values, spacing, radii, focus treatment, and shadows. Shared styles and components are in `src/styles/` and `src/components/ui/`. Visit `/design-system` to inspect the shared component set. Theme selection supports `light`, `dark`, and `system`, is stored under `common-ground-theme`, and follows the operating-system preference when set to `system`.

## Connecting a real API

The API boundary is `src/lib/api-client.ts`; feature-specific typed functions live under `src/features/*/*.api.ts`. The mock handlers in `src/mocks/handlers.ts` implement the contract documented in [`API-CONTRACT.md`](./API-CONTRACT.md).

1. Configure the deployed API base URL in `VITE_API_BASE_URL` (defaults to `/api`).
2. Set `VITE_ENABLE_MOCKS=false` in the deployment environment. `src/main.tsx` will then skip the browser MSW worker; without this explicit setting, the seeded mock API is enabled for production previews and deployments.
3. Implement the endpoint paths, JSON shapes, status codes, and role/ownership rules in `API-CONTRACT.md`. Keep responses compatible with the TypeScript domain types in `src/types/` and feature API modules.
4. Implement the contract's refresh-token rotation endpoint. The client sends the access token as a Bearer token and refreshes once after an eligible `401`; the current mock stores both tokens in memory, so production token persistence and secure refresh-token handling must be designed for the deployment.
5. Validate authentication, authorization, privacy, and file-upload behavior on the server. In particular, do not expose private contact fields or claimant proof in public listing responses.

`VITE_ENABLE_MOCKS` accepts `true` or `false`. `VITE_API_BASE_URL` must be a non-empty URL prefix suitable for the deployment.

## Further reading

- [`API-CONTRACT.md`](./API-CONTRACT.md): endpoint and payload contract for backend implementation
- [`PHASE-10-HARDENING.md`](./PHASE-10-HARDENING.md): accessibility, responsive, performance, and consistency pass
