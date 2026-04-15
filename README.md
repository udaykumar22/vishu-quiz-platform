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
- Admin login: `POST /api/admin/login`
- Certificate verify: `GET /api/certificates/:id/verify`
