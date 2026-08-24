# 🏛️ Bangkok 50 Districts Tracker (สำรวจ 50 เขตกรุงเทพมหานคร)

A mobile-first, production-ready full-stack web application to track visits, landmark discoveries, and specific explored spots across all **50 official districts (Khet / เขต)** of Bangkok on a high-precision interactive map.

---

## 🌟 Key Features

### 1. 🗺️ Interactive Bangkok 50-District SVG Map
- **Complete Vector Map:** Accurate SVG boundary paths and centroids for all 50 districts across Bangkok's 6 official administrative zones.
- **Vibrant Status Visualization:** Explored districts glow in vibrant emerald green (`#22c55e`); unvisited districts in clean muted slate (`#e2e8f0` light / `#1e293b` dark).
- **Chao Phraya River Integration:** Flowing river overlay traversing through riverside districts.
- **Mobile Gesture Navigation:** Smooth pinch-to-zoom, touch drag/pan, double-tap zoom, floating navigation controls, and centroid pins.
- **Zone Filters & Tooltips:** Live hover cards and quick zone filtering (Bangkok Central, South, North, East, Thonburi North, Thonburi South).

### 2. 📱 Native Mobile Bottom Sheet / Drawer
- Sliding drawer revealing district details, English & Thai names, BMA district code, area in km², and river status.
- Visited places list with category tags, visited dates, and personal reviews/notes.
- One-click Google Maps navigation and popular district landmark recommendations.

### 3. 🔍 Hybrid View Switcher & District Search
- Instant switcher between **Interactive Map**, **Searchable District List**, and **Analytics Dashboard**.
- Real-time search across English names, Thai names, district codes, and logged spot names.
- Multi-dimensional filters (Visited / Unvisited / All, Zone chips, Sort by spots count / area).

### 4. 📊 Sticky Progress Header & Gamified Ranks
- Compact top bar with safe-area support showing `Visited: X / 50 Districts (Y%)` and `Total Places: Z`.
- Smooth animated gradient progress track.
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
- **1-Tap Quick Visit Toggle:** Toggle districts visited/unvisited directly on the map or checklist.
- **State Backup & Restore:** 1-click JSON Export, Import, and Reset to default.
- Sticky bottom sync indicator verifying serverless auto-save status.

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Package Manager:** [Bun](https://bun.sh/) (`bun install`, `bun dev`, `bun run build`) / Node.js 18+
- **Frontend Framework:** Next.js 14 (App Router, Server & Client Components, TypeScript)
- **Styling & UI:** Tailwind CSS, Lucide Icons, Glassmorphism design system
- **Map Renderer:** Lightweight inline SVG coordinate system with vector matrix transformations
- **Serverless Storage Adapter:**
  1. **Local File / Memory Fallback:** `data/bangkok-tracker-state.json` (zero configuration for local offline dev)
  2. **Upstash Redis / Vercel KV:** Ultra-fast serverless KV via REST API
  3. **Supabase:** PostgreSQL REST storage support

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
│   │   └── reset/route.ts        # Reset state to default initial data
│   ├── globals.css               # Tailwind CSS & custom animations
│   ├── layout.tsx                # Root layout with viewport safe-area meta
│   └── page.tsx                  # Public interactive map & district explorer
├── components/
│   ├── admin/
│   │   ├── AdminLoginForm.tsx    # Admin password unlock form
│   │   ├── AdminPlaceManager.tsx # Modal to add/edit/delete places and notes
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
│   ├── ShareModal.tsx            # HTML5 Canvas snapshot exporter & share modal
│   ├── StatsModal.tsx            # Deep analytics modal with zone & category breakdown
│   └── ViewSwitcher.tsx          # Segmented control (Map / List / Analytics)
├── data/
│   ├── bangkok-districts.json    # Complete 50 Bangkok districts metadata & SVG paths
│   └── initial-state.json        # Curated starter visited places (CentralWorld, Wat Pho, etc.)
├── lib/
│   ├── auth.ts                   # Web Crypto JWT creation & session verification
│   ├── districts-data.ts         # District merge logic, rankings, and stats calculations
│   ├── storage.ts                # Unified storage adapter (Local, KV, Upstash, Supabase)
│   ├── types.ts                  # TypeScript definitions for districts, places, and state
│   └── utils.ts                  # Classnames, date formatters, and color utilities
├── build_map_data.py             # Python script for SVG coordinate & Voronoi generation
├── bunfig.toml                   # Bun configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies & scripts
├── postcss.config.js             # PostCSS Tailwind plugins
├── tailwind.config.ts            # Tailwind custom theme colors
├── tsconfig.json                 # TypeScript strict configuration
└── vercel.json                   # Vercel deployment configuration
```

---

## 🚀 Quick Start Guide (Local Development)

### 1. Prerequisites
- **Bun** (recommended) or **Node.js 18+** / **npm**

### 2. Installation
```bash
# Clone or navigate to the directory
cd bangkok-district-tracker

# Install dependencies using Bun
bun install

# Or using npm
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default credentials in `.env.local`:
```env
ADMIN_PASSWORD=bkk2026
JWT_SECRET=bangkok-50-districts-super-secure-jwt-key-2026
```

### 4. Run Development Server
```bash
# Run with Bun
bun dev

# Or with npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop.
To access the Admin dashboard, navigate to [http://localhost:3000/admin](http://localhost:3000/admin) (Default password: `bkk2026`).

---

## ⚙️ Environment Variables Reference

| Variable Name | Required | Default | Description |
|---|---|---|---|
| `ADMIN_PASSWORD` | **Yes** | `bkk2026` | Password for accessing the admin place manager at `/admin` |
| `JWT_SECRET` | No | Auto-generated | Secret key used for signing HMAC-SHA256 session cookies |
| `UPSTASH_REDIS_REST_URL` | Optional | `""` | Upstash Redis REST URL for persistent serverless storage |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | `""` | Upstash Redis REST Token |
| `KV_REST_API_URL` | Optional | `""` | Vercel KV REST API endpoint |
| `KV_REST_API_TOKEN` | Optional | `""` | Vercel KV REST API Bearer token |
| `SUPABASE_URL` | Optional | `""` | Supabase project URL (if using Supabase REST) |
| `SUPABASE_KEY` | Optional | `""` | Supabase API service/anon key |

*Note: When no external storage keys are configured, the application seamlessly uses local file storage (`data/bangkok-tracker-state.json`) and in-memory caching.*

---

## 🚢 Vercel Deployment Guide

Deploying Bangkok District Tracker to Vercel is seamless:

### Option 1: Deploy via Vercel CLI
```bash
# Install Vercel CLI if needed
bun add -g vercel

# Deploy
vercel
```

### Option 2: Deploy via Git (GitHub / GitLab)
1. Push this repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. In **Project Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD` = `your_strong_admin_password`
   - `JWT_SECRET` = `your_random_secret_token`
   - (Optional) Connect the **Upstash Redis** or **Vercel KV** integration from the Vercel Marketplace with 1 click.
4. Click **Deploy**.

---

## 📦 Packaging into a `.zip` Archive

To create a clean, distribution-ready `.zip` archive excluding temporary files:

```bash
# From the parent directory
zip -r bangkok-district-tracker.zip bangkok-district-tracker \
  -x "bangkok-district-tracker/node_modules/*" \
  -x "bangkok-district-tracker/.next/*" \
  -x "bangkok-district-tracker/.git/*" \
  -x "bangkok-district-tracker/*.log"
```

---

## 📄 License
MIT License. Crafted for Bangkok explorers and travel enthusiasts.
