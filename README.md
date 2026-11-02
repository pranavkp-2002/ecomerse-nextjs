# ecomerse-frontend

Frontend monorepo for the [ecomerse API](https://github.com/pranavkp-2002/commerce-be-express)
(Express + MongoDB, in the sibling `ecomerse/` folder).

| Workspace        | What                                                  | Dev URL               |
| ---------------- | ----------------------------------------------------- | --------------------- |
| `apps/web`       | Storefront: browse, cart, checkout, orders, account   | http://localhost:3000 |
| `apps/admin`     | Admin panel: dashboard, products, categories, orders  | http://localhost:3001 |
| `packages/api`   | Typed API client, types, session store, formatters    | —                     |
| `packages/ui`    | Shared Tailwind components (Button, Field, Alert, …)  | —                     |

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, SWR,
npm workspaces and Turborepo.

## Getting started

1. **Run the API** (in `../ecomerse`). Its `.env` needs the frontends in the CORS allowlist:

   ```env
   PORT=5001
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001
   ```

   Port 5000 is taken by AirPlay Receiver on macOS, hence 5001.

2. **Configure the apps.** Copy the env template in each app (already done locally):

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/admin/.env.example apps/admin/.env.local
   ```

3. **Install and run:**

   ```bash
   npm install
   npm run dev          # both apps
   npm run dev:web      # storefront only
   npm run dev:admin    # admin only
   ```

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## Admin access

The admin panel only accepts users whose `role` is `admin`. The API has no endpoint to
promote a user, so register through the storefront and then set the role in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## How it talks to the API

- All requests go through `createApiClient` in `packages/api`. It adds the bearer
  token, turns error bodies into `ApiError` (with field-level `errors` from validation),
  and normalises the API's response shapes (e.g. `categroy`, `prodcut`, `cartData`) into
  clean types, so the apps never see them.
- Data is fetched **in the browser** with SWR, not in Server Components. The API's rate
  limiter keys on client IP, so server-side fetching would make every shopper share the
  Next.js server's limit.
- The JWT lives in `localStorage`, under a separate key per app: logging into the
  storefront never grants an admin session. A 401 clears the session.
- Checkout uses MongoDB transactions, so the database must be a replica set (Atlas is).
