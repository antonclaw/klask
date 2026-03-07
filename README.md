# Klask

This repository now contains one frontend Vite project with two pages:

- `frontend/klask/index.html` -> Klask
- `frontend/klask/klask-4.html` -> Klask-4
- `frontend/klask/klask-4-solo.html` -> Klask-4 Solo Mode

## State Storage

The backend exposes separate state endpoints:

- `GET/POST /api/state` (main Klask state)
- `GET/POST /api/klask4/state` (Klask-4 state)

Klask-4 solo mode is stored in the same klask-4 state object under a separate field:

- `soloMode` (contains solo `games` and `activeGame`)

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

### Klask frontend (source-based)

```bash
npm --prefix frontend/klask ci
npm --prefix frontend/klask run dev
```

For production build artifacts:

```bash
npm --prefix frontend/klask run build
```

## Validate Locally

Use this sequence to verify both pages end-to-end.

1. Start backend API in local mode.

```bash
npm ci
node api/server.js
```

2. Build frontend assets.

```bash
npm --prefix frontend/klask ci
npm --prefix frontend/klask run build
```

3. Validate static flow (IDE static server).

- Open `http://localhost:63342/klask/frontend/index.html` (launcher to Klask).
- Validate Klask renders and button switches to Klask-4.
- Open `http://localhost:63342/klask/frontend/klask/dist/klask-4.html` directly if needed.

4. Validate source/dev flow.

```bash
npm --prefix frontend/klask run dev
```

- Open `http://localhost:5173` for Klask and `http://localhost:5173/klask-4.html` for Klask-4.
- Open `http://localhost:5173/klask-4-solo.html` for Klask-4 Solo Mode.
- Confirm data persists through `/api/state` and `/api/klask4/state`.

5. Run tests/coverage.

```bash
npm test
npm run test:coverage
```

Coverage is enforced at 100% for `frontend/klask/public/legacy/js/game-logic.js`.

## Deploy Routing

`vercel.json` routes:

- `/api/*` -> `api/index.js`
- `/` -> `index.html` from `frontend/klask/dist`
- `/klask-4` and `/klask-4/` -> `klask-4.html` from `frontend/klask/dist`
- `/klask-4-solo` and `/klask-4-solo/` -> `klask-4-solo.html` from `frontend/klask/dist`
