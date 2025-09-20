# Useful Commands

## Clean & start dev

rm -rf .next && npm run dev

## Prisma

npx prisma generate
npx prisma migrate dev --name init
npx prisma studio

## Quick checks

open http://localhost:3000/api/health
open http://localhost:3000/api/prospects/<ID>
open http://localhost:3000/prospects/<ID>
