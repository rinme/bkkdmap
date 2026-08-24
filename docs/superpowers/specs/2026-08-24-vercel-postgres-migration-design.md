# Design Document: Vercel Postgres Migration & Performance Architecture

**Date**: 2026-08-24  
**Status**: Approved  
**Topic**: Migrating from Redis/KV REST to Vercel Postgres (Neon Serverless + Drizzle ORM) with Multi-layer Performance Caching  

---

## 1. Executive Summary
This document outlines the architectural migration of the **Bangkok 50 Districts Tracker** from Upstash Redis / Vercel KV REST adapter to **Vercel Postgres** (powered by Neon Serverless & Drizzle ORM). In addition to normalized relational storage, this redesign implements a multi-layer performance optimization strategy incorporating **Next.js server-side tagged caching (`unstable_cache` / `revalidateTag`)** and **client-side SWR with Optimistic UI updates** for instant 0ms interactions.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│ Client (Next.js 14 App Router + SWR)                   │
│  - Instant cache lookup                                │
│  - Optimistic UI updates (0ms click response)          │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Route Handlers (/api/districts, /api/import, etc.)     │
│  - Next.js Server Tagged Cache (`unstable_cache`)      │
│  - Cache Tag: `districts-state`                        │
│  - Purged automatically via `revalidateTag()` on write │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Storage Adapter Layer (`lib/db/`, `lib/storage.ts`)    │
│  - Drizzle ORM with @neondatabase/serverless           │
│  - Normalized Relational Tables                        │
│  - Fallback to Local JSON/Memory if no DATABASE_URL    │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Vercel Postgres / Neon Database                        │
│  - Table: `district_statuses`                          │
│  - Table: `places`                                     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema (`lib/db/schema.ts`)

```typescript
import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const districtStatuses = pgTable('district_statuses', {
  districtId: text('district_id').primaryKey(),
  isVisited: boolean('is_visited').notNull().default(false),
  generalNotes: text('general_notes'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const places = pgTable(
  'places',
  {
    id: text('id').primaryKey(),
    districtId: text('district_id')
      .notNull()
      .references(() => districtStatuses.districtId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category').notNull().default('Other'),
    visitedDate: text('visited_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    districtIdIdx: index('places_district_id_idx').on(table.districtId),
    categoryIdx: index('places_category_idx').on(table.category),
  })
);
```

---

## 4. Multi-Layer Performance & Caching Strategy

### 4.1 Server-Side Tagged Caching
- Read queries in `getTrackerState()` will be wrapped with Next.js `unstable_cache`:
  ```typescript
  export const getCachedTrackerState = unstable_cache(
    async () => fetchTrackerStateFromDB(),
    ['tracker-state-cache'],
    { tags: ['districts-state'], revalidate: 3600 }
  );
  ```
- Any mutation endpoint (`POST /api/districts`, `/api/reset`, `/api/import`) triggers:
  ```typescript
  revalidateTag('districts-state');
  ```
- Delivers **< 10ms edge read response** worldwide without redundant database roundtrips.

### 4.2 Client-Side SWR & Optimistic UI
- Integrating `swr` for data fetching on public and admin pages:
  - Cache deduplication across components.
  - Background revalidation on tab focus / network reconnect.
  - Optimistic UI updates when marking districts visited or logging spots.

### 4.3 Connection Pooling & Serverless Optimization
- Using `@neondatabase/serverless` connection pool / HTTP client for lightweight connection lifecycle in serverless lambdas.

---

## 5. Seeding, CLI Tools & Resilience Fallback

1. **Auto-Seed on Empty Database**:
   - When `getTrackerState()` detects an empty `district_statuses` table, it automatically populates all 50 districts with initial data from `data/initial-state.json`.
2. **CLI Scripts**:
   - `drizzle-kit push`: Push schema to Vercel Postgres directly without heavyweight migration files.
   - `scripts/seed.ts` (run via `bun run db:seed`): Dedicated CLI utility to seed or reset database.
3. **Resilient Local Fallback**:
   - If `DATABASE_URL` / `POSTGRES_URL` is absent, system transparently operates using local file storage `data/bangkok-tracker-state.json` and memory cache.

---

## 6. Files & Components Impacted

| File | Purpose | Action |
| --- | --- | --- |
| `package.json` | Add `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `swr` | Update dependencies & scripts |
| `drizzle.config.ts` | Drizzle configuration file for schema path and DB credentials | Create file |
| `lib/db/index.ts` | Database connection client initialization | Create file |
| `lib/db/schema.ts` | Drizzle relational schema definition | Create file |
| `lib/storage.ts` | Core state loader, queries, auto-seed, and mutations | Refactor to Postgres + caching |
| `scripts/seed.ts` | CLI script to seed database | Create file |
| `app/api/districts/route.ts` | Route handler with server cache revalidation | Update revalidateTag |
| `app/page.tsx` | Main tracker view with SWR integration | Update data fetching |
| `app/admin/page.tsx` | Admin panel with SWR & optimistic UI mutations | Update data fetching |
