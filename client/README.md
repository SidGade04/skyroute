# SkyRoute Client

React 19 + TypeScript SPA built with Vite 8, Tailwind v4 and shadcn/Radix. Deployed to Cloudflare Workers (static assets, SPA fallback) via `@cloudflare/vite-plugin`.

## Stack

React Router 7, axios, Supabase Auth (`@supabase/supabase-js`), date-fns, lucide-react.

## Environment

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:8080     # Vite dev proxy target for /api
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

axios uses relative `/api/...` URLs; in dev Vite proxies them to `VITE_API_URL`, so there's no CORS. The axios interceptor attaches the Supabase session JWT as `Authorization: Bearer`.

## Scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm install`     | Install deps                                 |
| `npm run dev`     | Dev server on http://localhost:3000          |
| `npm run build`   | `tsc -b && vite build` → `dist/`             |
| `npm run lint`    | ESLint                                       |
| `npm run preview` | Build, then serve with `wrangler dev`        |
| `npm run deploy`  | Build, then `wrangler deploy` (Cloudflare)   |

## Routes

| Path              | Page                                            |
| ----------------- | ----------------------------------------------- |
| `/`               | Search                                          |
| `/search-results` | Results with baggage-aware pricing and filters  |
| `/rendezvous`     | Multi-origin group meetup ranking (auth)        |
| `/alerts`         | Sniper price alerts (auth)                      |
| `/login`, `/signup`, `/auth/callback` | Supabase auth              |
| `/profile`        | User profile (auth)                             |

## Layout

```
src/
  api/          axios client, Supabase client, queries/ and mutations/
  components/   common, layout (Shell), search, rendezvous, sniper, ui (shadcn)
  hooks/        airport hooks
  pages/        route components
  types/        DTO types mirroring the API
  lib/utils.ts  cn() and formatters
```

`@` aliases `src/`.
