# 🏛️ Bangkok 50 Districts Tracker (สำรวจ 50 เขตกรุงเทพมหานคร)

A mobile-first, production-ready full-stack web application to track visits, landmark discoveries, and specific explored spots across all **50 official districts (Khet / เขต)** of Bangkok on a high-precision interactive map.

Built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Drizzle ORM**, and **PostgreSQL (Neon / Vercel Postgres)** with multi-tier storage fallback (Postgres → Local JSON → In-Memory).

---

## 🌟 Key Features

### 1. 🗺️ Interactive Bangkok 50-District SVG Map
- **Complete Vector Map:** Accurate SVG boundary paths and centroids for all 50 districts across Bangkok's 6 official administrative zones.
- **Vibrant Status Visualization:** Explored districts glow in vibrant emerald green (`#22c55e`); unvisited districts in clean muted slate (`#e2e8f0` light / `#1e293b` dark).
- **Chao Phraya River Integration:** Flowing vector river overlay traversing through riverside districts.
- **Mobile Gesture Navigation:** Smooth pinch-to-zoom, touch drag/pan, double-tap zoom, floating navigation controls, and centroid pins.
- **Zone Filters & Tooltips:** Live hover cards and quick zone filtering (Bangkok Central, South, North, East, Thonburi North, Thonburi South).

### 2. 📱 Native Mobile Bottom Sheet / Drawer
- Sliding drawer revealing district details, English & Thai names, BMA district code, area in km², and river status.
- Visited places list with category tags, visited dates, photos, and personal reviews/notes.
- One-click Google Maps navigation and popular district landmark recommendations.

### 3. 🔍 Hybrid View Switcher & District Search
- Instant switcher between **Interactive Map**, **Searchable District List**, and **Analytics Dashboard**.
- Real-time search across English names, Thai names, district codes, and logged spot names.
- Multi-dimensional filters (Visited / Unvisited / All, Zone chips, Sort by spots count / area).

### 4. 📊 Sticky Progress Header & Gamified Ranks
- Compact top bar with safe-area support showing `Visited: X / 50 Districts (Y%)` and `Total Places: Z`.
- Smooth animated gradient progress track with real-time SWR auto-sync.
- **5-Tier Explorer Milestone Badges:**
  - 🥉 Level 1: *Bangkok Newcomer* (ผู้มาเยือนหน้าใหม่)
  - 🥈 Level 2: *City Explorer* (นักสำรวจพระนคร)
  - 🥇 Level 3: *Urban Wanderer* (นักผจญภัยเมืองกรุง)
  - 💎 Level 4: *Bangkok Connoisseur* (ผู้ชำนาญการกรุงเทพฯ)
  - 👑 Level 5: *Bangkok Master* (มหาเซียน 50 เขตกรุงเทพฯ)

### 5. 📸 Visual Passport Snapshot & Social Sharing
- In-browser HTML5 Canvas snapshot card generator (1200×675 HD PNG).
- Native Web Share API integration, clipboard copy, and social sharing links.

### 6. 🔒 Secure Admin Dashboard (`/admin`)
- Secured with `ADMIN_PASSWORD` via HttpOnly JWT session cookies (zero external dependencies using standard Web Crypto API).
- **Place Manager:** Add, edit, and remove spots with category selectors (Mall, Temple, Cafe, Park, Food, Culture, Landmark, Market, Nightlife, Transit).
- **Photo Upload & Compression:** In-app photo upload with client-side canvas compression and persistent database storage.
- **1-Tap Quick Visit Toggle:** Toggle districts visited/unvisited directly on the map or checklist.
- **State Backup & Restore:** 1-click JSON Export, Import, and Reset to default starter landmarks.
- Sticky bottom sync indicator verifying serverless auto-save status.

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Package Manager:** [Bun](https://bun.sh/) (`bun install`, `bun dev`, `bun run build`) / Node.js 18+
- **Frontend Framework:** Next.js 14 (App Router, Server & Client Components, TypeScript)
- **Database & ORM:** PostgreSQL (Neon / Vercel Postgres) via [Drizzle ORM](https://orm.drizzle.team/)
- **Styling & UI:** Tailwind CSS, Lucide Icons, Glassmorphism design system
- **Map Engine:** Lightweight inline SVG coordinate system with vector matrix transformations
- **Data Sync & Cache:** SWR real-time fetching + Next.js `revalidateTag` cache invalidation
- **Multi-Tier Storage Adapter:**
  1. **PostgreSQL / Neon (Primary):** Type-safe relational storage with automated schema provisioning and cascading foreign keys.
  2. **Local File Fallback:** `data/bangkok-tracker-state.json` (zero configuration for offline dev).
  3. **In-Memory Cache:** Fast in-memory state fallback.

---

## 📁 Project Structure

```
bangkok-district-tracker/
├── app/
│   ├── admin/
│   │   └── page.tsx              # Admin Dashboard (Auth, Place Manager, Quick Toggles)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts    # Verify ADMIN_PASSWORD & issue HttpOnly JWT
│   │   │   ├── logout/route.ts   # Clear session cookie
│   │   │   └── me/route.ts       # Verify current session state
│   │   ├── districts/
│   │   │   └── route.ts          # GET districts & stats, POST place/visit updates
│   │   ├── export/route.ts       # Export current state as JSON
│   │   ├── import/route.ts       # Import JSON backup
│   │   ├── reset/route.ts        # Reset state to default initial data
│   │   ├── settings/route.ts     # App upload & compression settings API
│   │   ├── upload/route.ts       # Photo upload endpoint
│   │   └── uploads/[...slug]/    # Dynamic image streaming endpoint
│   ├── globals.css               # Tailwind CSS & custom animations
│   ├── layout.tsx                # Root layout with viewport safe-area meta
│   └── page.tsx                  # Public interactive map & district explorer
├── components/
│   ├── admin/
│   │   ├── AdminLoginForm.tsx    # Admin password unlock form
│   │   ├── AdminPlaceManager.tsx # Modal to add/edit/delete places and notes
│   │   ├── AdminSettingsModal.tsx# Modal to adjust image upload size & quality
│   │   └── AdminSyncBar.tsx      # Sticky bottom sync status & export/import bar
│   ├── district-list/
│   │   ├── DistrictCard.tsx      # District card component with visit badges
│   │   └── DistrictListView.tsx  # Searchable & filterable district grid
│   ├── map/
│   │   ├── BangkokMap.tsx        # Interactive SVG map engine with touch/pan/zoom
│   │   └── MapControls.tsx       # Floating zoom, center, and filter buttons
│   ├── ui/                       # Reusable UI primitives (Button, Badge, Input, Modal)
│   ├── DistrictBottomSheet.tsx   # Slide-up mobile bottom sheet
│   ├── Header.tsx                # Sticky progress header with progress meter
│   ├── LiveSyncBadge.tsx         # Floating real-time database sync badge
│   ├── ShareModal.tsx            # HTML5 Canvas snapshot exporter & share modal
│   ├── StatsModal.tsx            # Deep analytics modal with zone & category breakdown
│   └── ViewSwitcher.tsx          # Segmented control (Map / List / Analytics)
├── data/
│   ├── bangkok-districts.json    # Complete 50 Bangkok districts metadata & SVG paths
│   └── initial-state.json        # Curated starter visited places (CentralWorld, Wat Pho, etc.)
├── lib/
│   ├── db/
│   │   ├── index.ts              # Neon / Postgres Drizzle connection pool
│   │   └── schema.ts             # Drizzle table definitions & relational schemas
│   ├── auth.ts                   # Web Crypto JWT creation & session verification
│   ├── districts-data.ts         # District merge logic, rankings, and stats calculations
│   ├── image-compressor.ts       # Client-side canvas image compression utility
│   ├── storage.ts                # Unified storage adapter (Postgres, Local JSON, Memory)
│   ├── types.ts                  # TypeScript definitions for districts, places, and state
│   └── utils.ts                  # Classnames, date formatters, and color utilities
├── presentation/
│   ├── Bangkok-District-Tracker-Architecture-Lecture.pptx # 16-slide architecture lecture deck
│   ├── Bangkok-District-Tracker-Architecture-Lecture.md   # Markdown transcript & presenter notes
│   ├── presentation-plan.json    # Structured JSON presentation plan
│   └── generate_presentation.py  # Python PPTX generation script
├── scripts/
│   ├── prebuild.ts               # Database table verification & auto-seeding during build
│   └── seed.ts                   # Manual database seeding script
├── build_map_data.py             # Python script for SVG coordinate & Voronoi generation
├── bunfig.toml                   # Bun configuration
├── drizzle.config.ts             # Drizzle Kit configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies & scripts
├── postcss.config.js             # PostCSS Tailwind plugins
├── tailwind.config.ts            # Tailwind custom theme colors
├── tsconfig.json                 # TypeScript strict configuration
└── vercel.json                   # Vercel deployment configuration
```

---

## 🗄️ Relational Database Schema (Drizzle ORM)

The database schema is defined in `lib/db/schema.ts` using Drizzle ORM:

```sql
-- 1. District Statuses
CREATE TABLE district_statuses (
  district_id text PRIMARY KEY,
  is_visited boolean NOT NULL DEFAULT false,
  general_notes text,
  photos text,
  updated_at timestamp NOT NULL DEFAULT NOW()
);

-- 2. Places (Cascade delete when district is reset)
CREATE TABLE places (
  id text PRIMARY KEY,
  district_id text NOT NULL REFERENCES district_statuses(district_id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  visited_date text,
  notes text,
  photos text,
  created_at timestamp NOT NULL DEFAULT NOW()
);

-- 3. App Settings
CREATE TABLE app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT NOW()
);

-- 4. Uploaded Images (Serverless-safe persistent photo store)
CREATE TABLE uploaded_images (
  id text PRIMARY KEY,
  district_id text NOT NULL,
  filename text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  data text NOT NULL,
  size text NOT NULL DEFAULT '0',
  created_at timestamp NOT NULL DEFAULT NOW()
);
```

---

## 🚀 Quick Start Guide (Local Development)

### 1. Prerequisites
- **Bun** (recommended) or **Node.js 18+** / **npm**

### 2. Installation & 1-Command Interactive Setup
```bash
# Clone or navigate to the directory
cd bangkok-district-tracker

# Install dependencies
bun install

# Run 1-command interactive setup
# Prompts for config (DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET),
# writes .env.local, builds project, and runs db:push / seed automatically!
bun run setup
```

### 3. Start Development Server
```bash
# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
To access the Admin dashboard, navigate to [http://localhost:3000/admin](http://localhost:3000/admin) (Default password: `bkk2026`).

---

### 🔧 Manual Setup Alternative (Step-by-Step)
If you prefer configuring manually instead of `bun run setup`:
1. Copy environment variables: `cp .env.example .env.local`
2. Configure `DATABASE_URL` and `ADMIN_PASSWORD` in `.env.local`
3. Push schema: `bun run db:push` (if using Postgres)
4. Seed database: `bun run db:seed` (if using Postgres)
5. Start dev server: `bun dev`

---

## ⚙️ Environment Variables Reference

| Variable Name | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Optional | `""` | PostgreSQL connection string (Neon / Vercel Postgres). Falls back to local JSON if empty. |
| `POSTGRES_URL` | Optional | `""` | Alias for `DATABASE_URL`. |
| `ADMIN_PASSWORD` | **Yes** | `bkk2026` | Password for accessing the admin place manager at `/admin`. |
| `JWT_SECRET` | No | Auto-generated | Secret key used for signing HMAC-SHA256 session cookies. |

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/districts` | Fetch all 50 districts merged with visit status and stats | No |
| `POST` | `/api/districts` | Perform mutation (`toggle_visited`, `add_place`, `update_place`, `delete_place`) | **Yes (Admin)** |
| `POST` | `/api/auth/login` | Authenticate with admin password and set HttpOnly JWT | No |
| `POST` | `/api/auth/logout` | Clear admin session cookie | No |
| `GET` | `/api/auth/me` | Check if current session is authenticated | No |
| `GET` | `/api/export` | Export complete database state snapshot as JSON | No |
| `POST` | `/api/import` | Import and restore database state from JSON backup | **Yes (Admin)** |
| `POST` | `/api/reset` | Reset database and reseed default starter landmarks | **Yes (Admin)** |
| `GET` | `/api/settings` | Retrieve image compression and upload settings | No |
| `POST` | `/api/settings` | Update image compression and upload settings | **Yes (Admin)** |
| `POST` | `/api/upload` | Upload and persist district spot photo | **Yes (Admin)** |
| `GET` | `/api/uploads/[...slug]` | Stream uploaded image file | No |

---

## 🎓 Architecture Lecture & Presentation Materials

Located in the [`presentation/`](./presentation) folder:
- **`Bangkok-District-Tracker-Architecture-Lecture.pptx`**: 16-slide PowerPoint presentation covering MVC patterns, Drizzle ORM, Next.js App Router, request lifecycle, relational database design, and practice exercises.
- **`Bangkok-District-Tracker-Architecture-Lecture.md`**: Full markdown transcript with slide-by-slide presenter notes and code references.
- **`presentation-plan.json`**: Structured JSON plan conforming to the presentation generation schema.
- **`generate_presentation.py`**: Python script to regenerate or customize the PowerPoint deck.

---

## 🚢 Deployment Guide

### Deploying to Vercel
1. Push this repository to GitHub / GitLab.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Under **Project Settings → Environment Variables**, configure:
   - `ADMIN_PASSWORD` = `your_secure_password`
   - (Optional) `DATABASE_URL` = Connect a Neon / Vercel Postgres database with 1 click.
4. Click **Deploy**.

---

## 📄 License
MIT License. Crafted for Bangkok explorers and web developers.
