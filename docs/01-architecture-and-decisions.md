# Architecture & Decisions

This document records **what** we chose and **why**, so every non-obvious decision
is traceable. Open decisions you still own are marked **🟡 YOUR CALL**.

## Repository layout

```
docs/      Requirements, decisions, phase-by-phase plan (this folder)
shared/    @docmanager/shared — Zod contracts + TS types (single source of truth)
service/   @docmanager/service — Bun + Express API, Drizzle/Neon, WebSocket, storage
app/       Expo (React Native + TS) mobile client
```

A **Bun workspaces monorepo**. `app` and `service` both import `@docmanager/shared`,
so a contract change (e.g. renaming `Document.size`) breaks the build on both ends
instead of failing at runtime.

## Stack decisions

| Concern | Choice | Why |
| --- | --- | --- |
| Package manager / monorepo | **Bun workspaces** | One install, shared contracts, fast TS execution with no build step for the service. |
| Mobile | **Expo (RN + TypeScript) + Expo Router** | Fastest path to a runnable app; file-based routing maps cleanly to the 3 required screens; managed workflow avoids native toolchain setup. |
| UI kit | **React Native Paper (Material 3)** | Gives the white/blue card-and-accent look out of the box; built-in progress bars, badges, snackbars match the brief's components. |
| Contracts | **Zod** | Validate the same shapes on client and server; infer TS types from one definition. |
| Backend framework | **Express on Bun** | Brief allows any backend; Express is the most familiar HTTP layer and Bun runs the TS directly (`bun --watch`) with zero build. |
| ORM / DB | **Drizzle ORM + Neon Postgres** | Type-safe queries that mirror the Zod contracts; Neon is serverless Postgres with a free tier and works on Render. |
| Real-time | **`ws` WebSocket** at `/ws/notifications` | Brief explicitly lists a WS endpoint; lets the server push the bulk-complete event. Polling is the documented fallback. |
| File transfer | **Multer (memory storage)** | Parses `multipart/form-data`; buffers go straight to the storage adapter, so nothing depends on local disk in production. |

## Document storage — the possibilities (you chose **Cloudinary**)

The service talks only to a `StorageAdapter` interface (`service/src/storage/types.ts`),
so the provider is a one-file swap. Options considered:

| Option | Setup cost | Persists on Render? | Notes |
| --- | --- | --- | --- |
| **Cloudinary ✅ chosen** | Low — 3 env vars | ✅ Yes (off-server) | Free tier, simple SDK, PDFs stored as `resource_type: raw`, hosted URLs. |
| Supabase Storage | Low–medium | ✅ Yes | S3-compatible, dashboard to browse files. |
| AWS S3 | High — bucket + IAM + region | ✅ Yes | Most production-credible, most config. |
| Local disk | None | ❌ **No** (Render disk is ephemeral) | Provided as a dev-only adapter; fine for local demo, not deploy. |

**Why Cloudinary:** lowest setup for a 3–4h window, files live off-server so the
ephemeral filesystem on Render is a non-issue, and it returns a ready-to-use
public URL for the library's download/view action.

> A `local` adapter is still planned (Phase 1) so the app can be demoed with **zero**
> external accounts before Cloudinary keys are added — flip `STORAGE_PROVIDER` in `.env`.

## 🟡 Decisions you still own

These are deliberately left to you; the plan flags exactly when each is needed.

1. **Cloudinary account + keys** — create a free account, fill `CLOUDINARY_*` in `service/.env`. *(Phase 1)*
2. **Neon project + `DATABASE_URL`** — create a project, copy the pooled connection string. *(Phase 0/1)*
3. **"Session" model** — brief says no auth but scopes notifications "for the current
   session". Simplest compliant choice: treat the whole backend as one shared session
   (no per-user filtering). Decide if you want a device/session header instead. *(Phase 3)*
4. **Real-time transport** — WebSocket (planned) vs. polling fallback. *(Phase 2)*
5. **Push notifications** — whether to attempt the optional FCM/APNs phase. *(Phase 4)*
6. **Deploy targets** — Render for the service, Expo EAS for app builds. Secrets are
   yours to add to GitHub. *(Phase 5)*

## Conventions

- **Commit cadence:** every ~15 min, one logical change per commit (assessment rule).
- **Env:** never commit `.env`; `.env.example` is the contract. Validated at boot by `service/src/env.ts`.
- **Status vocabulary:** `queued → uploading → processing → complete | failed` (defined once in `shared`).
- **Bulk threshold:** `BULK_UPLOAD_THRESHOLD = 3` lives in `shared` — used by both app and service.
