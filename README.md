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

- Home / links: `/`
- Host dashboard: `/host`
- Player (use `?room=ROOMCODE` when joining): `/player?room=ABC123`
- Admin (not linked from Host/Player home): `/admin`

### Backend (API)

- Health: `GET /api/health`
- Admin login: `POST /api/admin/login` — then send `Authorization: Bearer <token>` for `/api/admin/*`
- Host login: `POST /api/host/login` — then socket emits `host:authenticate` with the token before host actions
- Certificate verify: `GET /api/certificates/:id/verify`

### Environment (Render / production)

Set at least: `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`, `HOST_USER`, `HOST_PASSWORD`, `FRONTEND_URL`, `BACKEND_URL`, `VITE_API_URL` (Netlify → frontend).

### Deploy flow

Pushes to `main` on GitHub update the repo. **Netlify** and **Render** deploy automatically if each service is connected to this repository and branch (check each dashboard after a push).
