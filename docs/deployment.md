# Vishu Quiz Deployment Guide

## 1) Environment variables

Backend:
- `PORT=4000`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=change-this`
- `ADMIN_USER=admin`
- `ADMIN_PASSWORD=strong-password`
- `HOST_USER=host` (quiz host sign-in for `/host`)
- `HOST_PASSWORD=strong-host-password`
- `FRONTEND_URL=https://your-netlify-site.netlify.app`
- `BACKEND_URL=https://your-render-service.onrender.com`

Frontend:
- `VITE_API_URL=https://your-render-service.onrender.com`

## 2) GitHub

1. Initialize repo:
   - `git init`
   - `git add .`
   - `git commit -m "Initial Vishu quiz platform"`
2. Create GitHub repo and push:
   - `gh repo create vishu-quiz-platform --private --source=. --remote=origin --push`

## 3) Render backend

1. Create PostgreSQL database in Render.
2. Create Web Service for `backend` directory.
3. Build command: `npm install && npm run build -w shared && npm run build -w backend`
4. Start command: `npm run start -w backend`
5. Configure backend environment variables.

## 4) Netlify frontend

1. Import same GitHub repository in Netlify.
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set `VITE_API_URL` to Render backend URL.

## 5) Smoke test

1. Open frontend on mobile and desktop browser.
2. Host creates room and shares QR.
3. Player joins, answers question, scoreboard updates live.
4. Complete round, generate certificate.
5. Scan certificate QR and verify endpoint output.
