# Klask

This repository now contains two frontend experiences backed by one API service:

- `frontend/` : original Klask page
- `frontend/klask-4/` : Klask-4 React source project (Vite)

## State Storage

The backend exposes separate state endpoints:

- `GET/POST /api/state` (main Klask state)
- `GET/POST /api/klask4/state` (Klask-4 state)

Local mode state files:

- main: `data.json`
- klask-4: `klask-4-state.json`

GitHub mode state paths:

- main: `GITHUB_PATH`
- klask-4: `GITHUB_PATH_KLASK4` (defaults to `klask-4-state.json` if not set)

## Local Development

### Start Server Locally

Create `.env` in project root with at least:

```env
LOCAL_MODE=true
BASIC_USER=your_user
BASIC_PASS=your_pass
JWT_SECRET=your_long_random_secret
```

Install dependencies and start backend:

```bash
npm ci
node api/server.js
```

Server URL:

- `http://localhost:3000`

### Backend (quick command)

```bash
node api/server.js
```

### Klask-4 frontend (source-based)

```bash
npm --prefix frontend/klask-4 ci
npm --prefix frontend/klask-4 run dev
```

For production build artifacts:

```bash
npm --prefix frontend/klask-4 run build
```

## Tests

```bash
npm test
npm run test:coverage
```

Coverage is enforced at 100% for `frontend/js/game-logic.js`.

## Deploy Routing

`vercel.json` routes:

- `/api/*` -> `api/index.js`
- `/klask-4` and `/klask-4/*` -> `frontend/klask-4/dist/*`
- everything else -> `frontend/*`
