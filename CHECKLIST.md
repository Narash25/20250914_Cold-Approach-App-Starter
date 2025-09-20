# Cold Approach App — Engineering Checklist

## Legend
- [ ] = TODO
- [~] = In progress
- [x] = Done
- [!] = Blocked / Needs decision

## Foundations
- [x] Repo uses Git with main + feature branches
- [x] TypeScript strict mode enabled
- [x] Prisma set up (SQLite, dev.db)
- [x] `.env` with DATABASE_URL="file:./dev.db"
- [x] Prisma client generated
- [x] Initial migrations applied

## Routing & Pages
- [x] Prospects list page `/prospects`
- [x] Prospect detail page `/prospects/[id]`
- [x] Prospect edit page `/prospects/[id]/edit`
- [x] Removed route collision (`app/prospects/[id]/route.ts`)
- [~] Navigation uses `next/link` everywhere (remove `<a>` where possible)
- [ ] Confirm no middleware/rewrites interfere with `/prospects/:id`

## API
- [x] API route `app/api/prospects/[id]/route.ts` (GET/PATCH/DELETE)
- [ ] Health route `app/api/health` returns `OK` (temporary)
- [~] DELETE works end-to-end (no 404)
- [ ] Touches API (optional) confirmed if used

## Prospect Form / Validation
- [x] First Name / Last Name fields
- [x] Email: inline validation
- [x] Phone: intl input with country flag; default Malaysia
- [x] Date format: `dd-m-yyyy` on UI
- [x] Server parses `dd-m-yyyy` safely
- [ ] Show only relevant error messages (no premature errors)

## Import
- [x] CSV import (PapaParse)
- [x] Excel import (.xlsx/.xls) (SheetJS) with date handling
- [ ] Helpful import UX: sample file, column mapping (later)

## Dashboard
- [x] Basic metrics/today’s touches
- [ ] Correct name display (first + last everywhere)
- [ ] Filters/search (nice-to-have)

## Delete / Edit flows
- [~] Delete button calls `/api/prospects/:id` and returns to list
- [x] Edit page pre-fills form with prospect data
- [ ] Confirm edit updates firstContact correctly

## Quality / Tooling
- [x] `npm run dev` starts clean
- [x] `rm -rf .next && npm run dev` recommended when routing changed
- [ ] Add ESLint & Prettier configs (optional)
- [ ] Basic component tests (later)

---

## Today’s Focus
- [ ] Verify `api/health` works
- [ ] Fix DELETE 404 (ensure API path + restart + cache cleared)
- [ ] Replace remaining `<a>` with `next/link` + `prefetch={false}` in list & header- [x] Started DELETE flow PR
