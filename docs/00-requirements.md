# Assessment Brief — Document Management Mobile App

> **Track:** Mobile App Developer · **Duration:** 3–4 hours
> Source: assessment portal brief, captured here as the project's source of truth.

## What we are building

A mobile **Document Management App**. Users can upload company PDFs, see real-time
per-file upload progress, and receive notifications when background uploads finish.
Tests mobile development, API integration, and real-time communication.

## Hard rules

- **Commit every ~15 minutes.** Commit history is reviewed — no single end commit.
- **Mobile framework:** React Native (Expo or CLI) **or** Flutter. → *We use Expo (React Native + TypeScript).*
- **Backend:** any language/framework. Use the endpoint list below as a guide. → *We use Bun + Express.*
- **Design:** match the white/blue design language and Livvic font (or closest mobile equivalent).
- **No chatbot needed. No user authentication needed.**
- Show loaders/progress clearly — loading states, skeleton screens, progress indicators.

## Features

Features 1–3 are **required**. Push notifications are **optional**.

### 1. File Upload — Individual & Bulk *(required)*
- File picker supports selecting **one or multiple** PDF files.
- Per-file progress: filename, size, percentage, status.
- File status states (visible in UI): `queued`, `uploading`, `complete`, `failed`.
- Upload to backend and store the files.
- After upload, list documents with name, size, date, and a download/view action.

### 2. Smart Notifications for Bulk Uploads *(required)*
- **≤ 3 files:** per-file inline progress as normal.
- **> 3 files:** immediately show a non-blocking banner: *"Uploading X files in background…"*.
- When all files finish processing server-side, push a **real-time** notification
  (WebSocket or polling) reading *"X files uploaded successfully"* with a timestamp.
- Native push (FCM/APNs) is optional bonus.

### 3. Notification Center *(required)*
- Every notification (upload complete, upload failed) saved in DB with
  message, type, timestamp, read status.
- Bell icon/tab in nav with unread badge count.
- Tapping opens a Notifications screen listing all past notifications.
- Mark as read individually **or** clear all.
- Must **persist after app restart** (fetched from backend).

### 4. Push Notifications *(optional)*
- FCM (Android/both) or APNs (iOS) delivery.
- Triggered when a bulk upload completes server-side.
- Receivable when app is backgrounded/closed.
- Document FCM/APNs setup in README.

## Key screens

| Screen | Contents |
| --- | --- |
| Home / Upload | File picker / native picker, upload queue with per-file progress |
| Document Library | List/grid of uploads: name, size, date, download & delete |
| Notifications | Bell badge with unread count, full list, mark as read |
| AI Chat | *(optional, skipped — no chatbot required)* |

## Backend endpoints to implement

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/upload` | Upload one/more files. Returns upload IDs + initial status per file. |
| GET | `/api/upload/:id/status` | Processing status of one upload (queued/processing/complete/failed). |
| GET | `/api/documents` | List uploaded documents with metadata (name, size, date, URL). |
| DELETE | `/api/documents/:id` | Delete a document from storage + DB. |
| GET | `/api/notifications` | All notifications for the session, newest first. |
| PATCH | `/api/notifications/:id/read` | Mark one notification read. |
| PATCH | `/api/notifications/read-all` | Mark all read. |
| GET | `/api/notifications/unread-count` | Unread count (for badge). |
| WS | `/ws/notifications` | Server pushes an event when a bulk upload batch completes. |

## Submission

- Public GitHub repo with clear commit history (commit ≥ every 15 min).
- README with setup steps for **both** the mobile app and backend API.
- Optional 2–5 min screen recording (bonus).
- Backend runnable locally — include env var documentation.
