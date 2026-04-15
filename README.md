# Vishu Multiplayer Quiz Platform

Responsive multiplayer Vishu-themed quiz app with host/player/admin roles, live scoreboard, Fastest Finger First mode, auto-grading, and certificate verification by QR.

## Packages

- `frontend`: React + Vite client
- `backend`: Express + Socket.IO API
- `shared`: shared contracts/types

## Local run

1. Install dependencies:
   - `npm install`
2. Build question bank:
   - `npm run questions:build -w backend`
3. Start backend:
   - `npm run dev:backend`
4. Start frontend:
   - `npm run dev:frontend`

## Key routes

### Frontend (separate URLs)

- Home (player entry only): `/`
- Host dashboard (requires `HOST_USER` / `HOST_PASSWORD` on the API): `/host`
- Player (use `?room=ROOMCODE` when joining): `/player?room=ABC123`
- Admin (not linked from the home page): `/admin`

### Host vs admin credentials

- **Host** (quiz control): set `HOST_USER` and `HOST_PASSWORD` on the backend. Default local values are often `host` / `vishu-host` if unset.
- **Admin** (question bank): set `ADMIN_USER` and `ADMIN_PASSWORD` on the backend.

### Festival music file

- The UI plays `frontend/public/vishu-festival.mp3` from your own domain (reliable playback). Replace that file with any MP3 you have rights to use.

### Backend (API)

- Health: `GET /api/health`
- Admin login: `POST /api/admin/login`
- Certificate verify: `GET /api/certificates/:id/verify`
