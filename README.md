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

Frontend API env:

- `VITE_API_URL` (optional, shared from root `.env`, example: `http://localhost:3000/api`)
- If unset, frontend uses klask-style fallback:
  - `http://localhost:3000/api` on `localhost`
  - `/api` otherwise

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

## Validate Klask-4 Locally

Use this sequence to verify Klask-4 end-to-end.

1. Start backend API in local mode.

```bash
npm ci
node api/server.js
```

2. Build Klask-4 assets.

```bash
npm --prefix frontend/klask-4 ci
npm --prefix frontend/klask-4 run build
```

3. Validate static flow (same style as `frontend/index.html` via IDE static server).

- Open `http://localhost:63342/klask/frontend/klask-4/index.html`
- It should redirect to `frontend/klask-4/dist/index.html` and render the app.

4. Validate source/dev flow.

```bash
npm --prefix frontend/klask-4 run dev
```

- Open `http://localhost:5173`
- Confirm login works and data persists through `/api/klask4/state`.

5. Run tests/coverage.

```bash
npm test
npm run test:coverage
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
