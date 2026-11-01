# Common Ground

A responsive lost-and-found portal built with React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, and MSW.

## Run locally

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

In PowerShell, `Copy-Item` creates the local environment file. On macOS or Linux, use `cp .env.example .env`.

The browser-based MSW API is enabled in development by default. Set `VITE_ENABLE_MOCKS=false` when connecting to a real API. API requests use `VITE_API_BASE_URL`.

## Design system

Visit `/design-system` to preview the shared interface components in light and dark themes. Theme preference supports `light`, `dark`, and `system` and is saved in local storage. Tokens live in `src/styles/tokens.css`; Radix UI primitives power accessible dialogs, tabs, select menus, choice controls, tooltips, avatars, and notifications.

The app shell includes responsive navigation, listing search, a guest account menu, scroll restoration, and footer help pages at `/contact`, `/privacy`, `/guidelines`, `/faq`, and `/how-it-works`.

## Commands

```sh
npm run dev
npm run build
npm run lint
npm run format
npm run format:check
```
