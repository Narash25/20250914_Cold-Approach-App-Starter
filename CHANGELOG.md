# Changelog

## [Unreleased]

- (plan) Convert remaining anchors to `next/link` and disable prefetch for stability.

## 2025-09-18

- Fixed route collisions: removed `app/prospects/[id]/route.ts`.
- Standardized list -> detail -> edit navigation to page routes.
- Added robust delete button using `/api/prospects/:id`.
- Improved validation (email/phone), intl phone input default MY.
- Enabled .xlsx/.xls import support; clarified supported formats on UI.
- Prisma schema updated with firstName/lastName; migrations applied.

## 2025-09-15

- Bootstrapped app: Next.js + Prisma + SQLite, seed data, 5-key touches generation.
