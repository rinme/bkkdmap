# 🏛️ Bangkok 50 Districts Tracker: Full-Stack MVC & Layered Architecture Lecture

A comprehensive, 16-slide lecture and case study deck designed around the **Bangkok 50 Districts Tracker (`bkkdmap`)** web application. This lecture adapts the pedagogical structure of the classic MVC lecture into a modern full-stack web paradigm (**Next.js 14 App Router · React 18 · TypeScript · Drizzle ORM · PostgreSQL / SQLite / Serverless KV**).

---

## 📑 Slide Deck Overview & Contents

```
========================================================================================
SLIDE 1  | FULL-STACK ARCHITECTURE (Title & Cover)
SLIDE 2  | Learning Objectives (4 Key Competencies)
SLIDE 3  | What Is Full-Stack MVC? (Model · Controller · View Diagram)
SLIDE 4  | Why Separate Concerns? (Maintainability, Reusability, Team Workflow, Types)
SLIDE 5  | The Three Layers, Defined (Model, View, Controller in bkkdmap)
SLIDE 6  | Case Study: The Bangkok 50 Districts Tracker App (Tech Stack Pillars)
SLIDE 7  | Project Structure (Folder Tree & Architectural Rationale)
SLIDE 8  | The Model Layer (Drizzle ORM Schema, Relational Constraints, Mutations)
SLIDE 9  | The View Layer (Interactive SVG Vector Map, SWR Data Sync, UI State)
SLIDE 10 | The Controller Layer (Next.js Route Handlers, JWT Auth Guard, Cache Tags)
SLIDE 11 | Routes: Connecting URLs to Controllers (HTTP Endpoints Matrix)
SLIDE 12 | Request Lifecycle: Adding a Visited Place (End-to-End Flow 1-5)
SLIDE 13 | The Relational Database Schema (Postgres Tables, DDL & Relations)
SLIDE 14 | Running the App in VS Code (Setup, DB Push, Dev Server Commands)
SLIDE 15 | Practice Exercises (4 Real-World Architectural Extension Challenges)
SLIDE 16 | Summary & Discussion (Key Takeaways, Q&A, Project Resources)
========================================================================================
```

---

## 🖼️ Detailed Slide Breakdown & Code References

### Slide 1: Title Slide (Cover)
- **Header:** `FULL-STACK ARCHITECTURE`
- **Subtitle:** `Model · View · Controller — with a Modern Relational Database`
- **Case Study Subtext:** `A hands-on lecture built around the Bangkok 50 Districts Tracker project (Next.js 14 · React · Drizzle ORM · PostgreSQL)`
- **Visual Aesthetic:** Dark Tech Navy (`#0a1120`) with Emerald Green badge (`#22c55e`) and clean typography.

---

### Slide 2: Learning Objectives
**Subtitle:** *By the end of this lecture, you will be able to:*
1. **Explain** the Model–View–Controller pattern and why separating concerns is essential in data-driven web apps.
2. **Trace** a request end-to-end through client user events, Next.js App Router API handlers, Drizzle ORM queries, and reactive UI components.
3. **Read and write** TypeScript code that queries and mutates a relational database from a dedicated model/storage layer.
4. **Run, extend, and debug** a production-ready full-stack GIS tracker application in VS Code with Bun and Next.js.

---

### Slide 3: What Is Full-Stack MVC?
**Subtitle:** *A design pattern that splits an application into three interconnected parts, each with one job.*
- **MODEL (Data & Rules):** PostgreSQL database + Drizzle ORM + GIS metadata.
- **CONTROLLER (Traffic Cop):** Next.js App Router route handlers (`app/api/districts/route.ts`), authentication guards, and cache revalidators.
- **VIEW (What You See):** Client React components, interactive 50-district SVG map, sliding bottom sheets, and analytics dashboards.
- **Key Idea:** *The Controller never writes raw SQL directly, and the View never contains database logic. Each layer can change, optimize, and test without breaking the others.*

---

### Slide 4: Why Separate Concerns?
| Pillar | Benefit in Bangkok District Tracker |
|---|---|
| ↻ **Maintainability** | Fix map rendering bugs or redesign UI components without cascading unintended side-effects into database queries or route handlers. |
| ⚙ **Reusability & Multi-Storage** | The unified storage layer seamlessly switches between PostgreSQL (Neon), local JSON file fallback, or serverless KV without touching React components. |
| ⌘ **Team Workflow** | Frontend developers focus on SVG pinch/zoom and gesture math while backend engineers optimize relational schemas and SQL indexing in parallel. |
| ✓ **Testability & Type Safety** | Shared TypeScript interfaces (`FullDistrict`, `Place`, `TrackerState`) ensure end-to-end type safety from database rows to UI props. |

---

### Slide 5: The Three Layers, Defined
- **MODEL (Owns the data):**
  - Defines relational schemas, executes type-safe queries, enforces cascading foreign key constraints, and persists state. Knows nothing about HTTP headers or JSX rendering.
  - *Files:* `lib/db/schema.ts`, `lib/storage.ts`, `lib/districts-data.ts`
- **VIEW (Owns the display):**
  - Renders the interactive SVG vector map, district cards, sliding bottom sheet, and analytics modals. Contains zero database queries.
  - *Files:* `app/page.tsx`, `components/map/BangkokMap.tsx`, `components/DistrictBottomSheet.tsx`
- **CONTROLLER (Owns the flow & security):**
  - Receives incoming HTTP requests, verifies HttpOnly JWT admin sessions, validates payloads, delegates to the Model, and invalidates server cache tags.
  - *Files:* `app/api/districts/route.ts`, `app/api/auth/login/route.ts`, `app/api/export/route.ts`

---

### Slide 6: Case Study: The Bangkok 50 Districts Tracker App
**Subtitle:** *A full-stack GIS web application to explore, track, and log visits across all 50 official districts of Bangkok.*
- **Next.js 14 (CONTROLLER):** App Router, Serverless Route Handlers, Cache Tagging.
- **React + Tailwind (VIEW):** Interactive SVG Vector Engine, Glassmorphism design system, SWR Data Sync.
- **Drizzle ORM (MODEL):** Type-safe PostgreSQL schemas, migrations, cascading foreign key relations.
- **Bun Runtime (RUNTIME):** Ultra-fast JavaScript/TypeScript runtime, bundler, and package manager.
- **Relational Architecture Note:** Visited spots are normalized as rows in a `places` table with a foreign key referencing `district_statuses`—ensuring ACID consistency and zero redundant state.

---

### Slide 7: Project Structure
```
bangkok-district-tracker/
|-- app/
|   |-- page.tsx              # VIEW: Public Map & Analytics
|   |-- admin/page.tsx        # VIEW: Admin Place Manager
|   `-- api/
|       |-- auth/login/       # CONTROLLER: JWT Auth
|       `-- districts/        # CONTROLLER: CRUD API Route Handler
|-- components/
|   |-- map/BangkokMap.tsx    # VIEW: SVG Vector Map Engine
|   `-- DistrictBottomSheet.tsx # VIEW: Slide-up Drawer
|-- lib/
|   |-- db/schema.ts          # MODEL: Drizzle Schema Definition
|   |-- storage.ts            # MODEL: Data Access & Mutations
|   `-- districts-data.ts     # MODEL: District Metadata & Stats
`-- data/bangkok-districts.json # DATA: 50 District Vector Polygons
```
**Why organize it this way?**
- `app/api/` isolates HTTP request parsing and authentication from visual components.
- `components/` encapsulates specialized UI widgets (vector map, bottom drawer, modals).
- `lib/db/` & `lib/storage.ts` encapsulates all database queries and schema definitions.
- `data/` maintains static GIS geo-polygons and starter landmark seed datasets.
- `lib/types.ts` provides shared, single-source-of-truth TypeScript definitions.

---

### Slide 8: The Model Layer
```typescript
// lib/db/schema.ts
export const districtStatuses = pgTable('district_statuses', {
  districtId: text('district_id').primaryKey(),
  isVisited: boolean('is_visited').notNull().default(false),
  generalNotes: text('general_notes'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const places = pgTable('places', {
  id: text('id').primaryKey(),
  districtId: text('district_id').notNull()
    .references(() => districtStatuses.districtId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull().default('Other'),
  visitedDate: text('visited_date'),
  notes: text('notes'),
});
```
**Notice:**
- **Type-Safe Schema:** Drizzle ORM defines tables with TypeScript inference, preventing SQL syntax and type errors at compile time.
- **Cascading Foreign Keys:** The `references()` constraint with `onDelete: 'cascade'` automatically cleans up places if a district status changes.
- **Zero HTTP / UI Logic:** No `req`, `res`, or HTML anywhere in this layer. It is pure data definition and database queries.

---

### Slide 9: The View Layer
```tsx
// components/map/BangkokMap.tsx
export function BangkokMap({ districts, onSelectDistrict }) {
  return (
    <svg viewBox="0 0 1000 800" className="w-full h-auto">
      {districts.map((district) => {
        const isVisited = district.userData?.isVisited;
        return (
          <path
            key={district.id}
            d={district.svgPath}
            fill={isVisited ? '#22c55e' : '#1e293b'}
            stroke="#060913"
            strokeWidth="1.5"
            onClick={() => onSelectDistrict(district)}
            className="transition-colors cursor-pointer hover:opacity-80"
          />
        );
      })}
    </svg>
  );
}
```
**Notice:**
- **Pure Declarative UI:** The view receives data props from SWR and renders colors dynamically without querying the database.
- **Event Dispatching:** `onClick` triggers `onSelectDistrict(district)`, delegating navigation and state logic back to the parent container.
- **Responsive SVG Matrix:** Handles pan, pinch-to-zoom, and touch gestures on the client without triggering backend roundtrips.

---

### Slide 10: The Controller Layer
```typescript
// app/api/districts/route.ts
export async function POST(req: NextRequest) {
  // 1. Verify Admin Authentication via JWT
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse & Validate Request Body
  const { action, districtId, place } = await req.json();
  if (action === 'add_place') {
    if (!place?.name) {
      return NextResponse.json({ error: 'Place name required' }, { status: 400 });
    }
    // 3. Delegate to Model Layer
    const res = await addPlaceToDistrict(districtId, place);
    
    // 4. Invalidate Server Cache & Return Response
    revalidateTag('districts-state');
    return NextResponse.json({ success: true, state: res.state });
  }
}
```
**Notice:**
- **Authentication Gatekeeper:** Verifies HttpOnly JWT session cookies before allowing state modifications, protecting against unauthorized writes.
- **Validation & Delegation:** Validates incoming JSON payloads and delegates storage operations to `lib/storage.ts` without writing raw SQL.
- **Cache Invalidation:** Calls `revalidateTag('districts-state')` to immediately refresh server-cached responses across all clients.

---

### Slide 11: Routes: Connecting URLs to Controllers
| Method | URL | Controller Action | Purpose |
|---|---|---|---|
| `GET` | `/api/districts` | `GET()` | Fetch all 50 districts, visited status & stats |
| `POST` | `/api/districts` | `action: 'toggle_visited'` | Toggle district visited status (`true` / `false`) |
| `POST` | `/api/districts` | `action: 'add_place'` | Add visited spot (Mall, Temple, Cafe, etc.) |
| `POST` | `/api/districts` | `action: 'delete_place'` | Remove a logged spot from a district |
| `POST` | `/api/auth/login` | `POST(password)` | Authenticate admin & issue HttpOnly JWT |
| `GET` | `/api/export` | `GET()` | Export full database snapshot as JSON |
| `POST` | `/api/import` | `POST(backup_json)` | Restore database state from uploaded JSON |
| `POST` | `/api/reset` | `POST()` | Reset database and reseed default landmarks |

---

### Slide 12: Request Lifecycle: Adding a Visited Place
```
[1] User submits 'Add Place' in Bottom Sheet  -->  VIEW: POST /api/districts
                                                        │
[2] Next.js App Router dispatches request    -->  ROUTER: app/api/districts/route.ts
                                                        │
[3] Controller verifies JWT & validates data -->  CONTROLLER: isAuthenticatedAdmin()
                                                        │
[4] Model executes Drizzle ORM insert        -->  MODEL: db.insert(places).values(...)
                                                        │
[5] Cache invalidated; SWR refetches data    -->  SWR / VIEW: District glows Emerald (#22c55e)
```

---

### Slide 13: The Relational Database
```sql
CREATE TABLE district_statuses (
  district_id text PRIMARY KEY,
  is_visited boolean NOT NULL DEFAULT false,
  general_notes text,
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE places (
  id text PRIMARY KEY,
  district_id text NOT NULL 
    REFERENCES district_statuses(district_id) 
    ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  visited_date text,
  notes text
);
```
*Try it yourself:* Add a `tags` table with a many-to-many `place_tags` junction table. Update `lib/storage.ts` to support tag filtering.

---

### Slide 14: Running the App in VS Code
```bash
# 1. Install dependencies
$ bun install

# 2. Push database schema to PostgreSQL
$ bun run db:push

# 3. Start local development server
$ bun dev

▲ Next.js 14.2.35
- Local:   http://localhost:3000
- Admin:   http://localhost:3000/admin (Password: bkk2026)

✓ Ready in 850ms
✓ Database connected (with local JSON fallback)
```

---

### Slide 15: Practice Exercises
1. 📍 **GIS Coordinate Pins (VIEW + MODEL):** Add `latitude` and `longitude` columns to `places` and render interactive pinpoint markers positioned inside district SVG boundaries.
2. 🔐 **Multi-User Passports (CONTROLLER + MODEL):** Extend Model & Controller layers from single-admin to multi-tenant user accounts with personal passport trackers.
3. 🏷️ **Faceted Category Search (MODEL + CONTROLLER):** Implement dynamic SQL filtering (`GET /api/districts?category=Cafe&zone=Thonburi`) in Drizzle ORM.
4. 📸 **Cloud Image Storage (STORAGE + VIEW):** Integrate AWS S3 or Cloudflare R2 storage in `app/api/upload` to support high-res photo albums per place.

---

### Slide 16: Summary & Discussion
- **Full-Stack MVC** separates an application into Model (data), View (display), and Controller (flow & security).
- **The Controller** is the single coordinator that manages validation, auth guards, and cache revalidation.
- **Relational databases** enforce data integrity via schemas, foreign keys, and cascading relationships.
- **The same architectural principles** scale from small tracker apps to enterprise geospatial platforms.
- **Questions & Next Steps:** Explore [README.md](file:///D:/mgproject/bkkdmap/README.md) for architecture documentation, API schemas, and deployment guides.
