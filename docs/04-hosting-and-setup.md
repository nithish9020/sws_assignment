# Cloudinary & Render Setup Guide

This guide covers how to set up Cloudinary for persistent file storage and how to deploy the backend service to Render.

---

## 1. Cloudinary Setup (Storage)

We use Cloudinary to store the uploaded PDF documents. Files are stored as `raw` resources so they are not modified by Cloudinary's image pipeline.

### Step 1: Create an Account
1. Go to [Cloudinary](https://cloudinary.com) and sign up for a free account.
2. Verify your email and log in to the **Cloudinary Console**.

### Step 2: Get Your API Credentials
1. On your Dashboard (or under **Settings > Access Keys**), look for your **Product Environment Credentials**.
2. You need three specific values:
   - **Cloud Name** (e.g., `dzz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcDEFghiJKLmnoPQRstuVWXyz`)

### Step 3: Add to Environment Variables
Open your `service/.env` file and add the credentials:

```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=docmanager
```

Your local backend is now fully configured to upload files to Cloudinary!

---

## 2. Render Hosting Setup (Backend Deployment)

We will deploy the Bun + Express service to Render. Since this is a monorepo, we will install dependencies from the root and then run the service.

### Step 1: Create a Render Web Service
1. Go to [Render](https://render.com) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.

### Step 2: Configure the Web Service
Set up the service with the following configuration:

- **Name:** `docmanager-service` (or whatever you prefer)
- **Region:** Choose the region closest to your Neon Database to reduce latency.
- **Branch:** `main`
- **Root Directory:** *(leave blank — we need to run from the root for the monorepo)*
- **Runtime:** `Node`
- **Build Command:** `npm install -g bun && bun install`
- **Start Command:** `cd service && bun run src/index.ts`

> [!TIP]
> By installing `bun` globally via `npm` during the build step, Render's default Node environment can seamlessly run our Bun server and utilize the `bun workspaces` feature!

### Step 3: Set Environment Variables on Render
Scroll down to the **Environment Variables** section in Render and add the following keys (copy them from your local `service/.env`):

| Key | Value |
| --- | --- |
| `DATABASE_URL` | *Your Neon Postgres Connection String* |
| `STORAGE_PROVIDER` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | *Your Cloudinary Cloud Name* |
| `CLOUDINARY_API_KEY` | *Your Cloudinary API Key* |
| `CLOUDINARY_API_SECRET` | *Your Cloudinary API Secret* |
| `CLOUDINARY_FOLDER` | `docmanager` |
| `CORS_ORIGIN` | `*` |

### Step 4: Deploy
1. Click **Create Web Service**.
2. Render will run the build command, install Bun and your dependencies, and start the Express server.
3. Once the deployment says **Live**, you can test the API by visiting `https://your-app-url.onrender.com/health`.

> [!WARNING]
> Render's free tier spins down after 15 minutes of inactivity. The first request after a spin-down might take ~50 seconds to respond as the server wakes up.
