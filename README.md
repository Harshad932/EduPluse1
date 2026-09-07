# EduPulse — Interactive Learning Platform

A full-stack demo app: a marketing site for an interactive-classroom product, plus an
Admin Dashboard for managing the Team / Student / Teacher / Mentor directory shown
on the site.

- **FrontEnd/** — React 18 + Vite + Tailwind CSS
- **BackEnd/** — Node.js + Express + MongoDB (Mongoose) + ImageKit for image hosting

`node_modules/` is **not** included in this zip — install dependencies yourself with
`npm install` in each folder (see below). This keeps the download small and makes
sure you get dependency builds that match your own machine/OS.

## 1. Backend setup

```bash
cd BackEnd
cp .env.example .env
# edit .env: set MONGODB_URI, ADMIN_SECRET_KEY, and (optionally) your ImageKit keys
npm install
npm run dev
```

The API starts on `http://localhost:5000` by default (or whatever `PORT` you set).
If `MONGODB_URI` is unreachable, the server still runs and falls back to a small
in-memory store, so you can try the app without a database — just note the data
won't survive a server restart in that mode.

### Admin authentication

Admin-only routes (`POST/PUT/DELETE /api/team`) require the real secret from
`ADMIN_SECRET_KEY`, sent as either:

- `Authorization: Bearer <ADMIN_SECRET_KEY>`, or
- `x-admin-key: <ADMIN_SECRET_KEY>`

Requests without a matching key are rejected with `403 Forbidden`.

### Optional scripts

```bash
npm run seed       # populate a few sample team members (server must already be running)
npm run test:e2e   # basic smoke test of the API (server must already be running)
```

## 2. Frontend setup

```bash
cd FrontEnd
cp .env.example .env
# edit .env if your backend isn't on http://localhost:5000, and set VITE_ADMIN_KEY
# to match BackEnd's ADMIN_SECRET_KEY
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). Click **Admin Panel** in
the navbar to open the dashboard and manage team members, including image uploads.

## 3. Building for production

```bash
cd FrontEnd
npm run build      # outputs static files to FrontEnd/dist
```

Serve `FrontEnd/dist` with any static host, and deploy `BackEnd` as a normal Node
service (set the same environment variables from `.env.example` on the host).

## Notes

- Image uploads go through ImageKit; if you leave the ImageKit env vars blank,
  image upload will return an error, but you can still create members with a
  plain `image_url` instead of uploading a file.
- The admin key sent from the browser (`VITE_ADMIN_KEY`) is visible to anyone
  who opens dev tools. That's fine for local development or a portfolio demo,
  but if you deploy this publicly, replace the shared-secret admin check with
  real authentication (e.g. a login form + server-issued session/JWT).
- Never commit your real `.env` files — `.gitignore` already excludes them.
