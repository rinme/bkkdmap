# Technical Specification: Image Upload Support, Auto-Resize Pipeline, and QoL Features

**Date:** 2026-08-26  
**Status:** Approved  
**Scope:** Bangkok District Tracker (`rinme/bkkdmap`)

---

## 1. Overview & Objective
This specification details the architecture and implementation for adding rich image upload capabilities, an intelligent client/server image compression and size reduction pipeline governed by dynamic Admin settings, and quality-of-life (QoL) user experience enhancements to the Bangkok District Tracker web application.

---

## 2. Architecture & Data Model

### 2.1 Type Definitions (`lib/types.ts`)
```ts
export interface AppSettings {
  maxImageSizeKb: number;       // Default: 1024 (1 MB threshold)
  maxImageDimension: number;   // Default: 1920 (max width/height px)
  imageQuality: number;        // Default: 80 (80% WebP quality)
  autoCompress: boolean;       // Default: true
  allowedMimeTypes: string[];  // Default: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  visitedDate?: string;
  notes?: string;
  photos?: string[];           // Array of relative URL paths, e.g. ["/uploads/bang-rak/spot-123.webp"]
}

export interface DistrictUserData {
  isVisited: boolean;
  generalNotes?: string;
  visitedPlaces: Place[];
  photos?: string[];           // Array of district-level photo URLs
}
```

### 2.2 Database Schema & DDL Migration (`lib/db/schema.ts` & `lib/storage.ts`)
- **`places` table**:
  - Add `photos text` column (stores JSON-serialized string array `string[]`).
- **`district_statuses` table**:
  - Add `photos text` column (stores JSON-serialized string array `string[]`).
- **`app_settings` table**:
  ```ts
  export const appSettings = pgTable('app_settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });
  ```
- **Auto-DDL Migration**: `ensureTablesExist` in `lib/storage.ts` adds `ALTER TABLE ... ADD COLUMN IF NOT EXISTS photos text` and `CREATE TABLE IF NOT EXISTS app_settings (...)` dynamically on launch, ensuring zero manual database migration overhead.

---

## 3. Image Compression & Upload Subsystem

### 3.1 Client-Side Compression Engine (`lib/image-compressor.ts`)
- **Canvas-based Auto-Resize**:
  - Intercepts dropped or selected images before network transmission.
  - Scales dimensions proportionally such that `max(width, height) <= maxImageDimension` (e.g. 1920px).
  - Encodes the canvas output as modern `image/webp` (fallback to `image/jpeg`).
  - **Iterative Target Sizing**: If the resulting file exceeds `maxImageSizeKb`, automatically steps down quality in iterations (e.g. 80% → 65% → 50%) until it falls within the required threshold.
  - Generates compression statistics: Original size, compressed size, and percentage saved (e.g. `-94.2%`).

### 3.2 Backend Upload API (`app/api/upload/route.ts`)
- **Authentication**: Requires valid admin session via `verifyAdminToken()`.
- **Validation**: Verifies file MIME type and maximum payload size against `AppSettings`.
- **Storage**:
  - Sanitizes `districtId` to prevent path traversal.
  - Saves files to disk under `public/uploads/<districtId>/<districtId>-<timestamp>-<randomId>.webp`.
  - Returns public URL: `/uploads/<districtId>/<filename>.webp`.
- **File Deletion (`DELETE /api/upload`)**:
  - Safely deletes unreferenced photo files from disk when removed in the UI.

### 3.3 Settings Management API (`app/api/settings/route.ts`)
- **`GET /api/settings`**: Returns current `AppSettings` object (falling back to default configuration).
- **`POST /api/settings`**: Validates and updates configuration in database and JSON fallback.

---

## 4. UI Components & Quality of Life (QoL) Enhancements

### 4.1 Admin Settings Panel (`components/admin/AdminSettingsModal.tsx`)
- Accessible via a Gear icon in the Admin Header.
- Interactive controls:
  - Max image file size (slider/input in KB/MB).
  - Max image dimension (px).
  - Compression quality percentage (50% - 100%).
  - Auto-compression toggle switch.
- **Live Compression Playground**: Admins can drag & drop any local image directly into the modal to preview live quality and see before/after file sizes before applying settings.
- "Reset to Recommended Defaults" button.

### 4.2 Enhanced Place & District Photo Manager (`components/admin/AdminPlaceManager.tsx`)
- Integrated multi-image drag-and-drop zone with instant thumbnail previews.
- Live compression indicator badge showing storage saved.
- Support for adding/removing photos for both individual visited spots and the district photo gallery.

### 4.3 Fullscreen Image Lightbox Viewer (`components/ui/ImageLightbox.tsx`)
- Accessible across both public and admin interfaces.
- Click any photo thumbnail to open high-resolution fullscreen view.
- Supports Next/Previous navigation, keyboard shortcuts (`ArrowLeft`, `ArrowRight`, `Escape`), touch swipe on mobile, and photo caption metadata (spot name, date, district).

### 4.4 Visual Thumbnail Strips & Badges
- **`DistrictCard.tsx`**: Renders a `📷 <count>` badge and mini thumbnail preview strip for districts with uploaded photos.
- **`DistrictBottomSheet.tsx`**: Renders an interactive photo gallery strip for the district and each visited spot.

### 4.5 Upgraded Search, Filter & Sort Bar (`DistrictListView.tsx`)
- **"📷 Has Photos" filter chip**: Instantly isolate districts containing photos.
- **Place Category filter**: Filter places across Bangkok (e.g. Cafes, Temples, Malls).
- **Sort Dropdown**: Sort by Name (A-Z), Most Logged Spots, or Recently Visited.

### 4.6 Backup & Export Bundle (`app/api/export/route.ts`)
- **JSON Only**: Fast, lightweight snapshot of the state.
- **Full ZIP Backup**: Packages `bangkok-tracker-state.json` together with the `public/uploads/` directory into a single `.zip` file.

---

## 5. Verification & Testing Strategy
1. **Unit / Integration Tests**:
   - Verify image compression step-down algorithm with large test images (> 5MB).
   - Test upload endpoint rejection of unauthenticated requests or invalid MIME types.
   - Verify database migrations and schema serialization/deserialization of `photos`.
2. **End-to-End Workflow Verification**:
   - Admin logs in, uploads multiple photos to a spot, adjusts max size in Admin Settings, and verifies compression metrics.
   - Public view renders thumbnails, opens Lightbox, and filters by "Has Photos".
   - Export ZIP bundle verifies generated archive integrity.
