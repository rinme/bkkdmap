# Image Upload Support, Auto-Resize Pipeline, and QoL Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add photo upload capabilities to places and districts with smart client/server auto-compression governed by an Admin Settings panel, plus rich QoL features (fullscreen lightbox, thumbnail previews, advanced filters, and ZIP bundle export).

**Architecture:** Hybrid client/server architecture where client-side Canvas auto-resizes images against admin-configured size/dimension thresholds before uploading to `/api/upload` which writes to `public/uploads/<districtId>/`. State and settings are persisted via Drizzle ORM Postgres + local file fallback. Public and Admin views feature Lightbox viewing, photo badges, and upgraded search/filter capabilities.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Drizzle ORM / Postgres, SWR.

**Spec:** [`docs/superpowers/specs/2026-08-26-image-upload-and-qol-design.md`](file:///D:/mgproject/bkkdmap/docs/superpowers/specs/2026-08-26-image-upload-and-qol-design.md)

## Global Constraints
- Do not introduce heavy native server dependencies; use web-standard Canvas API on client and standard Node `fs`/`stream` on server.
- Preserve backward compatibility for existing records in `data/bangkok-tracker-state.json` and Postgres tables.
- All uploads must be authenticated with admin session check.
- Mobile-first responsive UI styling matching the existing dark neon emerald design system.

---

### Task 1: Data Model, Schema, and Storage Layer (`lib/types.ts`, `lib/db/schema.ts`, `lib/storage.ts`)

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/db/schema.ts`
- Modify: `lib/storage.ts`

**Interfaces:**
- Consumes: Existing `Place`, `DistrictUserData`, `TrackerState` types.
- Produces: `AppSettings` interface, `getAppSettings(): Promise<AppSettings>`, `saveAppSettings(settings: AppSettings): Promise<AppSettings>`, updated `Place` and `DistrictUserData` with optional `photos?: string[]`.

- [ ] **Step 1: Update `lib/types.ts` with `AppSettings` and `photos` properties**

```typescript
// Add to lib/types.ts
export interface AppSettings {
  maxImageSizeKb: number;       // Default: 1024 (1 MB)
  maxImageDimension: number;   // Default: 1920 (px)
  imageQuality: number;        // Default: 80 (%)
  autoCompress: boolean;       // Default: true
  allowedMimeTypes: string[];  // Default: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  maxImageSizeKb: 1024,
  maxImageDimension: 1920,
  imageQuality: 80,
  autoCompress: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
};
```
Update `Place` to include `photos?: string[]` and `DistrictUserData` to include `photos?: string[]`.

- [ ] **Step 2: Update `lib/db/schema.ts` with `photos` columns and `appSettings` table**

Add `photos: text('photos')` to `places` and `districtStatuses`.
Add `appSettings` table:
```typescript
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

- [ ] **Step 3: Update `lib/storage.ts` with auto-DDL, settings helpers, and photo persistence**

Ensure `ensureTablesExist` creates `app_settings` and alters `places`/`district_statuses` to add `photos` if not present.
Add `getAppSettings()`, `saveAppSettings()`, and ensure `addPlaceToDistrict`, `updatePlaceInDistrict`, `saveTrackerState`, `fetchStateFromPostgres` serialize/deserialize `photos` (JSON string).

- [ ] **Step 4: Verify storage and schema compilation**

Run: `bun run build` or `next build` (or typecheck via `tsc --noEmit`).
Expected: Compilation passes without type errors.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/db/schema.ts lib/storage.ts
git commit -m "feat: add AppSettings and photos schema to data and storage layer"
```

---

### Task 2: Client-Side Image Compression Engine (`lib/image-compressor.ts`)

**Files:**
- Create: `lib/image-compressor.ts`

**Interfaces:**
- Consumes: `AppSettings` from `lib/types.ts`.
- Produces: `compressImage(file: File, settings?: Partial<AppSettings>): Promise<CompressedImageResult>`, `formatBytes(bytes: number): string`.

- [ ] **Step 1: Implement `lib/image-compressor.ts`**

```typescript
import { AppSettings, DEFAULT_APP_SETTINGS } from './types';

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsPercentage: number;
  width: number;
  height: number;
  format: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressImage(
  file: File,
  settings: Partial<AppSettings> = {}
): Promise<CompressedImageResult> {
  const config = { ...DEFAULT_APP_SETTINGS, ...settings };
  const originalSize = file.size;

  if (!config.autoCompress && originalSize <= config.maxImageSizeKb * 1024) {
    return {
      file,
      blob: file,
      previewUrl: URL.createObjectURL(file),
      originalSize,
      compressedSize: originalSize,
      savingsPercentage: 0,
      width: 0,
      height: 0,
      format: file.type,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);

    img.onload = async () => {
      try {
        let { width, height } = img;
        const maxDim = config.maxImageDimension;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not obtain canvas context');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let quality = config.imageQuality / 100;
        let blob: Blob | null = null;

        // Progressive reduction if target size exceeded
        for (let iteration = 0; iteration < 4; iteration++) {
          blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob((b) => res(b), 'image/webp', quality)
          );
          if (!blob) break;
          if (blob.size <= config.maxImageSizeKb * 1024 || quality <= 0.4) {
            break;
          }
          quality -= 0.15;
        }

        if (!blob) {
          blob = file;
        }

        const compressedSize = blob.size;
        const savingsPercentage = Math.max(
          0,
          parseFloat((((originalSize - compressedSize) / originalSize) * 100).toFixed(1))
        );

        const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
        const compressedFile = new File([blob], newFileName, { type: 'image/webp' });
        const previewUrl = URL.createObjectURL(blob);

        resolve({
          file: compressedFile,
          blob,
          previewUrl,
          originalSize,
          compressedSize,
          savingsPercentage,
          width,
          height,
          format: 'image/webp',
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsDataURL(file);
  });
}
```

- [ ] **Step 2: Verify `lib/image-compressor.ts` typing**

Run: `tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/image-compressor.ts
git commit -m "feat: implement client-side canvas image compression engine with target sizing"
```

---

### Task 3: Backend Upload, Settings, and ZIP Export APIs (`app/api/upload`, `app/api/settings`, `app/api/export`)

**Files:**
- Create: `app/api/upload/route.ts`
- Create: `app/api/settings/route.ts`
- Modify: `app/api/export/route.ts`

**Interfaces:**
- Consumes: `verifyAdminToken` from `lib/auth.ts`, `getAppSettings`/`saveAppSettings` from `lib/storage.ts`.
- Produces: 
  - `POST /api/upload`: handles multipart image upload, returns `{ success: true, url: string, filename: string, size: number }`.
  - `DELETE /api/upload`: deletes image given `?url=...`.
  - `GET /api/settings`: returns current `AppSettings`.
  - `POST /api/settings`: updates `AppSettings`.
  - `GET /api/export?format=zip`: returns full ZIP archive of state + images.

- [ ] **Step 1: Create `app/api/settings/route.ts`**

Implement `GET` and `POST` handlers verifying admin session for `POST`, returning `AppSettings`.

- [ ] **Step 2: Create `app/api/upload/route.ts`**

Implement `POST` handler:
- Check admin authentication.
- Read form-data (`districtId`, `file`).
- Sanitize districtId (alphanumeric + hyphen only).
- Verify file size & MIME type against `AppSettings`.
- Ensure directory `public/uploads/<districtId>` exists.
- Write file using `fs.promises.writeFile`.
- Return `{ success: true, url: "/uploads/<districtId>/<filename>", filename, size }`.
Implement `DELETE` handler to remove photo from disk safely.

- [ ] **Step 3: Update `app/api/export/route.ts` with ZIP bundle support**

Handle `?format=zip` query parameter. If `format=zip`, create a lightweight zip stream of state JSON + `public/uploads` directory. If standard request, return JSON as before.

- [ ] **Step 4: Test API routes with Next.js build verification**

Run: `bun run build` or `next build`
Expected: Clean build and all dynamic routes validated.

- [ ] **Step 5: Commit**

```bash
git add app/api/upload/route.ts app/api/settings/route.ts app/api/export/route.ts
git commit -m "feat: add upload, settings, and ZIP export API endpoints"
```

---

### Task 4: Admin Settings Modal with Live Compression Playground (`components/admin/AdminSettingsModal.tsx`)

**Files:**
- Create: `components/admin/AdminSettingsModal.tsx`
- Modify: `components/Header.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `AppSettings` from `lib/types.ts`, `compressImage` from `lib/image-compressor.ts`.
- Produces: `AdminSettingsModal` component with interactive sliders, live test drag-and-drop compressor, and "Reset to Defaults".

- [ ] **Step 1: Create `components/admin/AdminSettingsModal.tsx`**

Build modal containing:
- Max image file size slider/input (200 KB to 5 MB).
- Max image dimension (800px to 3840px).
- WebP Quality slider (40% to 100%).
- Auto-compress toggle switch.
- **Live Interactive Playground**: Drop any test photo to see before/after compression stats, dimensions, and visual quality preview immediately.
- Reset to recommended defaults button and Save Settings action via `/api/settings`.

- [ ] **Step 2: Wire Settings Modal into `Header.tsx` and `app/admin/page.tsx`**

Add Settings Gear button in `Header.tsx` when `isAdmin` is true.
Add state `isSettingsOpen` in `app/admin/page.tsx` to launch `AdminSettingsModal`.

- [ ] **Step 3: Verify build and UI layout**

Run: `tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminSettingsModal.tsx components/Header.tsx app/admin/page.tsx
git commit -m "feat: add Admin Settings modal with live image compression playground"
```

---

### Task 5: Fullscreen Image Lightbox Viewer (`components/ui/ImageLightbox.tsx`)

**Files:**
- Create: `components/ui/ImageLightbox.tsx`

**Interfaces:**
- Consumes: Array of image URLs + optional captions/metadata.
- Produces: `ImageLightbox` component with keyboard arrows (`ArrowLeft`/`ArrowRight`), Esc to close, touch swipe navigation, zoom button, and counter indicator (`3 / 8`).

- [ ] **Step 1: Create `components/ui/ImageLightbox.tsx`**

Implement fullscreen modal with:
- Dark blurred backdrop.
- Next / Previous buttons + keyboard arrow event listeners.
- Touch swipe gesture support for mobile.
- Zoom in/out toggle.
- Caption overlay displaying Place/District name and date.

- [ ] **Step 2: Verify component typing**

Run: `tsc --noEmit`
Expected: Passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/ImageLightbox.tsx
git commit -m "feat: create fullscreen interactive image lightbox modal"
```

---

### Task 6: Photo Upload UI in Admin Place Manager (`components/admin/AdminPlaceManager.tsx`)

**Files:**
- Modify: `components/admin/AdminPlaceManager.tsx`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `compressImage` from `lib/image-compressor.ts`, `/api/upload` endpoint, `ImageLightbox`.
- Produces: Drag-and-drop file upload zone, instant live compression savings badges, thumbnail list with delete & view actions, and District Album tab/section.

- [ ] **Step 1: Add photo upload state and dropzone to `AdminPlaceManager.tsx`**

- Add multi-file drag-and-drop area in the "Add / Edit Visited Spot" form.
- Automatically compress photos on client via `compressImage()` and display live compression savings pill (e.g. `⚡ 4.1 MB ➔ 210 KB (-95%)`).
- Display uploaded photo thumbnail cards with delete (`X`) and view buttons.
- Add District Photo Gallery section allowing admins to upload general district album photos.

- [ ] **Step 2: Update `app/admin/page.tsx` handlers for photo persistence**

Ensure `handlePlaceAdded`, `handlePlaceUpdated`, and a new `handleDistrictPhotosUpdated` persist `photos` array to `/api/districts`.

- [ ] **Step 3: Verify build**

Run: `bun run build` or `next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/admin/AdminPlaceManager.tsx app/admin/page.tsx
git commit -m "feat: integrate drag-and-drop photo uploader and district gallery manager"
```

---

### Task 7: QoL Enhancements — Photo Thumbnails, Advanced Search & Filter Bar (`DistrictCard.tsx`, `DistrictBottomSheet.tsx`, `DistrictListView.tsx`)

**Files:**
- Modify: `components/district-list/DistrictCard.tsx`
- Modify: `components/DistrictBottomSheet.tsx`
- Modify: `components/district-list/DistrictListView.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `photos` from `Place` and `FullDistrict`, `ImageLightbox`.
- Produces:
  - Photo count badges (`📷 3`) & thumbnail previews on `DistrictCard`.
  - Photo gallery carousel & place photo thumbnails in `DistrictBottomSheet`.
  - Filter chips ("All", "Visited", "Unvisited", "📷 Has Photos"), Place Category filter dropdown, and Sort options (A-Z, Most Spots, Recently Visited) in `DistrictListView`.

- [ ] **Step 1: Enhance `DistrictCard.tsx` with photo badge & thumbnail preview strip**

Render mini photo thumbnail cards and a camera icon badge if the district or its places have photos. Clicking a thumbnail opens the Lightbox.

- [ ] **Step 2: Enhance `DistrictBottomSheet.tsx` with photo galleries**

Render district photo gallery banner and place photo thumbnails with click-to-lightbox functionality.

- [ ] **Step 3: Enhance `DistrictListView.tsx` with "Has Photos" filter, Category filter, and Sorting**

- Add filter chip: `📷 Has Photos`.
- Add Category filter dropdown (Filter districts containing specific spot categories).
- Add Sort dropdown (Alphabetical, Most Logged Spots, Recently Visited).

- [ ] **Step 4: Verify integration in `app/page.tsx` and `app/admin/page.tsx`**

Ensure Public and Admin modes render all thumbnails and filters seamlessly.

- [ ] **Step 5: Run full application build and verify all tests**

Run: `bun run build`
Expected: Build passes with 0 errors.

- [ ] **Step 6: Commit**

```bash
git add components/district-list/DistrictCard.tsx components/DistrictBottomSheet.tsx components/district-list/DistrictListView.tsx app/page.tsx
git commit -m "feat: add photo thumbnails, lightbox trigger, and advanced search/filter QoL features"
```

---

### Task 8: End-to-End Verification and Final Polish

**Files:**
- Review all modified files.

- [ ] **Step 1: Verify End-to-End Image Upload & Compression Flow**
  - Verify client auto-compressor with test images.
  - Verify dynamic settings change in Admin Settings Modal.
  - Verify public viewing with Lightbox and filter by "Has Photos".
  - Verify JSON and ZIP backup exports.

- [ ] **Step 2: Commit final documentation / polish**

```bash
git commit --allow-empty -m "chore: complete image upload, auto-resize, and QoL feature verification"
```
