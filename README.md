# CampusStay — Next.js Edition

Your CampusStay hostel-finder, rebuilt as a **Next.js app** so it can run for free on **Vercel** with a free **Postgres** database. All the original features are preserved: browse & filter rooms, room details with reviews, enquiries, WhatsApp links, the anonymous watchlist with notifications, the manager dashboard, and the admin panel.

This guide assumes **no prior experience**. Follow it top to bottom.

---

## What changed from the PHP version (and why)

Vercel and GitHub can't run PHP or host a MySQL database, so three things were converted. **Your features and design are unchanged** — only the plumbing underneath.

| Original (PHP) | Now (Next.js) | Why |
|---|---|---|
| PHP pages (`index.php`, `browse.php`…) | React pages in `app/` | Vercel runs JavaScript, not PHP |
| MySQL database | **Postgres** (free Neon database) | Vercel has no MySQL; Postgres is the free standard |
| Photo uploads to a local `uploads/` folder | **Vercel Blob** cloud storage | Vercel servers have no permanent disk |
| PHP `$_SESSION` logins | Signed cookies (JWT) | Serverless functions don't keep sessions in memory |

---

## Step 1 — Create a free database (Neon)

1. Go to **https://neon.tech** and sign up (free, no card).
2. Click **Create Project**. Give it a name like `campusstay`. Leave the defaults.
3. When it's ready, Neon shows a **connection string** that looks like:
   ```
   postgres://alex:AbC123@ep-cool-name.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   **Copy it** and keep it somewhere safe — this is your `DATABASE_URL`.
4. In the Neon dashboard, open the **SQL Editor** (left sidebar).
5. Open the file **`db/schema.sql`** from this project, copy **all** of it, paste it into the SQL Editor, and click **Run**. This creates every table and adds the sample rooms.

> **Demo logins after this step** — two manager accounts exist with password `password`:
> `kwame@example.com` and `ama@example.com`. Delete the sample data before a real launch.

---

## Step 2 — Put the code on GitHub

1. Create a free account at **https://github.com** if you don't have one.
2. Click **New repository**, name it `campusstay`, keep it **Public** or **Private**, click **Create**.
3. Upload this project's files. The easiest no-terminal way:
   - On the new repo page, click **uploading an existing file**.
   - Drag in **all the files and folders** from this project (but **not** `node_modules` if it exists — it's large and not needed).
   - Click **Commit changes**.

---

## Step 3 — Deploy to Vercel

1. Go to **https://vercel.com** and sign up **with your GitHub account**.
2. Click **Add New → Project**, then **Import** your `campusstay` repo.
3. Vercel auto-detects Next.js — don't change the build settings.
4. Before clicking Deploy, open **Environment Variables** and add these three:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon string you copied in Step 1 |
   | `SESSION_SECRET` | any long random text (get one at https://generate-secret.vercel.app/32) |
   | `ADMIN_USERNAME` | pick an admin username, e.g. `admin` |
   | `ADMIN_PASSWORD` | pick a **strong** admin password |

5. Click **Deploy**. After ~1 minute you'll get a live URL like `https://campusstay.vercel.app`. Open it — your site is live. 🎉

---

## Step 4 — Turn on photo uploads (Vercel Blob)

The site works without this, but managers can't upload room photos until it's set up. It's quick:

1. In your Vercel project, open the **Storage** tab.
2. Click **Create Database → Blob**, accept the defaults, and connect it to this project.
3. Vercel automatically adds a `BLOB_READ_WRITE_TOKEN` variable for you.
4. Go to the **Deployments** tab and **Redeploy** the latest deployment so it picks up the token.

Now the "Add Room" form accepts photos and videos, stored in the cloud.

---

## Using the site

- **Public:** `/` home, `/browse` listings, `/rooms/123` a room, `/watchlist` saved rooms.
- **Managers:** `/manager/register` to sign up, `/manager/login`, then `/manager/dashboard`.
- **Admin:** `/admin/login` — sign in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set on Vercel.

---

## Running it on your own computer (optional)

Only if you want to preview changes locally before pushing:

1. Install **Node.js 18+** from https://nodejs.org.
2. In this folder, copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (your Neon string) and `SESSION_SECRET`.
3. In a terminal:
   ```bash
   npm install
   npm run dev
   ```
4. Open **http://localhost:3000**.

---

## Troubleshooting

- **Pages show a server error / can't load rooms** → `DATABASE_URL` is wrong or the schema wasn't run. Re-check Step 1, and make sure the value on Vercel matches Neon exactly.
- **Can't log in as admin** → confirm `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set on Vercel and that you **redeployed** after adding them.
- **Photo upload does nothing / warning shown** → Blob storage isn't connected yet. Do Step 4, then redeploy.
- **Changed environment variables but nothing changed** → Vercel only applies them on a **new deployment**. Redeploy from the Deployments tab.

---

## Project structure

```
campusstay-next/
├── app/
│   ├── page.js                  Home
│   ├── browse/                  Browse + filters
│   ├── rooms/[id]/              Room detail, gallery, reviews
│   ├── watchlist/               Saved rooms + notifications
│   ├── manager/                 Login, register, dashboard, add/edit room
│   ├── admin/                   Admin login + panel
│   └── api/                     Backend routes (auth, rooms, enquiry, review, watchlist, admin)
├── components/                  Reusable UI (RoomCard, modals, navbar, etc.)
├── lib/                         db.js (Postgres), auth.js (cookies), utils.js (helpers)
├── db/schema.sql                Run this in Neon once
├── middleware.js                Gives each visitor a watchlist token
└── .env.example                 Copy to .env.local for local dev
```
