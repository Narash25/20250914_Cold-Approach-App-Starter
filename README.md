# Cold Approach — 5 Key Touch (DVI Malaysia)

A focused tool to manage cold outreach using the 5-touch methodology:

- Import leads (CSV/XLSX)
- Track 5 touches with dates and status
- Validate email/phone (intl, default MY)
- Edit/Delete prospects
- Next.js (App Router) + Prisma + SQLite

## Quickstart

```bash
npm install
cp .env.example .env         # DATABASE_URL="file:./dev.db"
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
