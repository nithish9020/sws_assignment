# Implementation Plan — Phase by Phase

How to read this: each phase has a **Goal**, the **decisions you own** (🟡), the
**tasks** split by package, **commit checkpoints** (~15 min apart, per the assessment
rule), and **acceptance criteria** to know you're done. Build phases in order;
Features 1–3 (Phases 1–3) are required, Phase 4 is optional.

Legend: `[S]` shared · `[B]` service (backend) · `[A]` app (mobile) · 🟡 your decision.

---

## Phase 0 — Foundation runs end to end
**Goal:** both sides install, boot, and the app can reach a backend `/health`.
**Status of repo now:** `shared` complete; `service` partial (missing storage factory,
local adapter, routes, ws hub, `index.ts`); `app` not created.

### 🟡 Decisions
- **Neon `DATABASE_URL`** — create a Neon project, copy the **pooled** connection string.
- Confirm **Expo SDK version** (use latest stable; `npx create-expo-app` picks it).

### Tasks
- `[B]` Add `service/src/storage/local.ts` (writes to `LOCAL_UPLOAD_DIR`, serves `/uploads`).
- `[B]` Add `service/src/storage/index.ts` — factory choosing adapter from `STORAGE_PROVIDER`.
- `[B]` Add `service/src/ws/hub.ts` — track WS clients, `broadcast(event)` helper.
- `[B]` Add `service/src/index.ts` — Express app, CORS, JSON, `/health`, mount routers,
  attach `ws` server to the same HTTP server at `/ws/notifications`.
- `[B]` Stub routers (`routes/upload.ts`, `documents.ts`, `notifications.ts`) returning 501
  so the server boots before features exist.
- `[A]` `npx create-expo-app@latest app --template` (TypeScript), add `expo-router`,
  `react-native-paper`, `axios`, `expo-document-picker`, `expo-file-system`.
- `[A]` Add `app/src/api/client.ts` (axios base URL from `EXPO_PUBLIC_API_URL`) and a
  Home screen that pings `/health`.
- Root: `bun install`; `cp service/.env.example service/.env` and fill `DATABASE_URL`.
- `[B]` `bun run db:push` to create tables in Neon.

### Commit checkpoints
1. `feat(service): storage factory + local adapter + ws hub`
2. `feat(service): express app, /health, ws server, stub routers`
3. `feat(app): expo + router + paper scaffold, /health ping`

### Acceptance
- `bun run dev:service` → `GET /health` returns `{ ok: true }`.
- `bun run dev:app` → app loads, shows backend reachable.
- Tables exist in Neon (`documents`, `uploads`, `notifications`).

### Why
Get a runnable skeleton first so every later phase is testable immediately, and so
the demo works with the **local** adapter before Cloudinary keys exist.

---

## Phase 1 — Feature 1: File upload (individual & bulk) + Library
**Goal:** pick PDFs, upload with per-file progress, see them listed, view/delete.

### 🟡 Decisions
- **Cloudinary keys** — create account, set `CLOUDINARY_*`, set `STORAGE_PROVIDER=cloudinary`
  (or stay on `local` to demo without an account).
- Library layout: **list vs grid** (brief shows a list; list is simpler).

### Tasks
- `[B]` `POST /api/upload` (multer memory) → per file: insert `uploads` row (`processing`),
  push buffer to storage adapter, insert `documents` row, set `uploads.status=complete`
  (or `failed` + error). Respond with `UploadResponse` (`background = files.length > 3`).
- `[B]` `GET /api/upload/:id/status` → current `uploads` row status.
- `[B]` `GET /api/documents` → all documents, newest first (`DocumentList`).
- `[B]` `DELETE /api/documents/:id` → adapter.remove(storageKey) + delete row.
- `[A]` Upload screen: `expo-document-picker` (`multiple: true`, `type: application/pdf`),
  build a queue, upload via `axios` with `onUploadProgress` for **per-file %**.
- `[A]` Per-file card: filename, size, %, status chip (`queued/uploading/complete/failed`).
- `[A]` Library screen: `GET /api/documents`, card list with name/size/date, view (open URL)
  + delete; skeleton loader while fetching.

### Commit checkpoints
1. `feat(service): POST /api/upload with storage + documents`
2. `feat(service): GET documents, upload status, DELETE document`
3. `feat(app): document picker + upload queue with per-file progress`
4. `feat(app): document library list with view/delete + skeletons`

### Acceptance
- Upload 1–3 PDFs → each shows its own live progress → reaches `complete`.
- Library lists them with correct name/size/date; view opens the file; delete removes it.

### Why
Per-file progress needs the client to drive uploads individually (axios
`onUploadProgress`); the server reports authoritative status via the `uploads` table,
which Phase 2 reuses for background completion.

---

## Phase 2 — Feature 2: Smart bulk notifications (real-time)
**Goal:** > 3 files → background banner now, real-time "X files uploaded" later.

### 🟡 Decisions
- **Transport: WebSocket (recommended) vs polling.** WS endpoint is already scaffolded;
  polling `unread-count` every few seconds is the fallback.

### Tasks
- `[B]` In `POST /api/upload`, when `files.length > BULK_UPLOAD_THRESHOLD`: respond
  immediately with `background: true` and process files **after** responding.
- `[B]` On batch completion, insert a `bulk_upload_complete` notification and
  `hub.broadcast({ event: "notification", data })` over `/ws/notifications`.
- `[A]` If response `background === true`: show non-blocking banner
  *"Uploading X files in background…"* (Paper `Banner`/`Snackbar`).
- `[A]` Open a WS connection on app start; on `notification` event show a toast
  *"X files uploaded successfully"* + timestamp, and refresh the notifications query.

### Commit checkpoints
1. `feat(service): background bulk processing + ws broadcast on completion`
2. `feat(app): background upload banner for >3 files`
3. `feat(app): websocket client + real-time completion toast`

### Acceptance
- Upload 4+ files → banner appears instantly, request doesn't block the UI.
- When the batch finishes server-side, a real-time notification arrives with a timestamp.

### Why
The brief's distinction (≤3 inline vs >3 background) is the core of this feature;
processing-after-response + a WS push is the cleanest way to deliver "later, in real time".

---

## Phase 3 — Feature 3: Notification center (persisted)
**Goal:** bell badge with unread count, full list, mark read / clear all, survives restart.

### 🟡 Decisions
- **Session model** — default: single shared session (no per-user filter). Decide if you
  want a device id header to scope notifications.

### Tasks
- `[B]` `GET /api/notifications` (newest first), `GET /api/notifications/unread-count`,
  `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.
- `[B]` Also emit `upload_complete` / `upload_failed` notifications from Phase 1's flow.
- `[A]` Notifications tab with a **bell + unread badge** (poll `unread-count` or update via WS).
- `[A]` Notifications screen: list (message, type, relative time, read indicator),
  tap-to-read, "mark all read" action; skeleton while loading.
- `[A]` Use TanStack Query (or Zustand) so the badge invalidates when items are read.

### Commit checkpoints
1. `feat(service): notifications CRUD + unread count`
2. `feat(app): notifications screen + mark read / read-all`
3. `feat(app): bell badge with unread count + restart persistence`

### Acceptance
- Notifications persist across app restart (refetched from backend).
- Badge reflects unread count; marking read (single + all) updates it live.

### Why
Persistence is explicitly required; storing in Postgres and refetching guarantees the
list survives restarts, and a single query source keeps the badge in sync.

---

## Phase 4 — Push notifications *(optional bonus)*
**Goal:** native push when a bulk upload completes, even backgrounded/closed.

### 🟡 Decisions
- **Attempt or skip** (only if Phases 1–3 are solid).
- **Channel:** Expo Push (simplest with Expo) vs raw FCM/APNs.

### Tasks
- `[A]` `expo-notifications`: request permission, get push token, send token to backend.
- `[B]` Store device tokens; on bulk completion, call Expo Push / FCM with the message.
- `docs`/README: document the FCM/APNs (or Expo Push) setup steps.

### Acceptance
- Backgrounding the app and completing a bulk upload delivers a system notification.

### Why
Expo Push wraps FCM/APNs and is by far the fastest route inside an Expo app; the brief
only asks that it work backgrounded and that setup is documented.

---

## Phase 5 — CI/CD, README, submission
**Goal:** workflows for Expo build + Render deploy, runnable README, clean history.

### 🟡 Decisions
- Add the GitHub secrets (`EXPO_TOKEN`, `RENDER_*`) — **you do this**.

### Tasks
- `.github/workflows/expo-build.yml` — EAS build on tag/manual (template, secrets TBD).
- `.github/workflows/render-deploy.yml` — deploy service to Render (template, secrets TBD).
- Root `README.md` — setup for app **and** service, env var table, run commands.
- Verify commit history shows ~15-min cadence across phases.

### Acceptance
- Workflows are valid YAML and reference documented secrets.
- A fresh clone can follow the README to run both sides locally.

### Why
Workflows + README are submission requirements; keeping secrets out of the repo and in
GitHub settings is the safe pattern (and avoids the token-in-URL issue noted in the docs).

---

## At-a-glance checklist

- [ ] Phase 0 — foundation runs (`/health`, app boots, tables created)
- [ ] Phase 1 — upload + per-file progress + library (view/delete) **[required]**
- [ ] Phase 2 — bulk background banner + real-time completion **[required]**
- [ ] Phase 3 — notification center, badge, persistence **[required]**
- [ ] Phase 4 — push notifications **[optional]**
- [ ] Phase 5 — workflows + README + history check
