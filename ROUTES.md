# Routes Map

## Pages (App Router)

- `/` — dashboard
- `/prospects` — list
- `/prospects/new` — create
- `/prospects/[id]` — detail
- `/prospects/[id]/edit` — edit
- `/import` — import wizard

## API

- `/api/health` — returns "OK"
- `/api/prospects/[id]` (GET/PATCH/DELETE)

## Non-goals (must NOT exist)

- `app/prospects/[id]/route.ts` (would intercept the page route)
