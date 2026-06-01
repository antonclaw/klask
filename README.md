# Klask

Klask is a small score-tracking app with an Express API and a Vite frontend.
The same deployment serves three game modes from one frontend project:

- `frontend/klask/index.html` -> Klask
- `frontend/klask/klask-4.html` -> Klask-4
- `frontend/klask/klask-4-solo.html` -> Klask-4 Solo Mode

## Repository layout

- `api/` - Express API, authentication, and state persistence adapters.
- `frontend/` - Static launcher page used by IDE/static-server flows.
- `frontend/klask/` - Vite app, React entry points, and generated production assets.
- `frontend/tests/` - Node-based game logic tests.
- `vercel.json` - Vercel build and route configuration.

## State storage

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

## Scoring and ranking

`klask` does not calculate an Elo/MMR rating.

The main Klask screen shows player stats derived directly from match history in
`frontend/klask/src/klask/game-logic.ts`:

- `wins` and `losses` are counted per completed game.
- `winPercent = wins / (wins + losses) * 100`.
- `pointsWon` and `pointsLost` are accumulated from the final score of each game.
- `pointPercent = pointsWon / (pointsWon + pointsLost) * 100`.
- `totalChampionDays` and `maxChampionStreak` come from the separate champion
  history, not from a rating formula.

Champion changes are also not Elo-based. The app tracks a current champion,
an optional challenger window, and championship history events.

Frontend API environment:

- `VITE_API_URL` (optional, shared from root `.env`, example: `http://localhost:3000/api`)
- If unset, frontend uses klask-style fallback:
  - `http://localhost:3000/api` on `localhost`
  - `/api` otherwise

## Local development

### Start server locally

Create `.env` in project root with at least:

```env
LOCAL_MODE=true
BASIC_USER=your_user
BASIC_PASS=your_pass
JWT_SECRET=your_long_random_secret
```

`JWT_SECRET` is required because login returns a bearer token that is stored by
the frontend. Generate a long random value, for example:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Install dependencies and start backend:

```bash
npm ci
npm start
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

### API authentication

- `POST /api/login` accepts `{ "username": "...", "password": "***" }` and
  returns a JWT bearer token when the credentials match `BASIC_USER` and
  `BASIC_PASS`.
- State endpoints accept either `Authorization: Bearer <token>` or HTTP Basic
  auth. Basic auth is mainly useful for the first login or manual API checks.

### GitHub-backed storage

Production can store state in a GitHub repository instead of local JSON files.
Leave `LOCAL_MODE` unset or set it to anything other than `true`, then provide:

```env
BASIC_USER=your_user
BASIC_PASS=your_pass
JWT_SECRET=your_long_random_secret
GITHUB_TOKEN=github_token_with_repo_access
GITHUB_OWNER=owner_or_org
GITHUB_REPO=repo_name
GITHUB_BRANCH=master
GITHUB_PATH=data.json
GITHUB_PATH_KLASK4=klask-4-state.json
```

`GITHUB_PATH_KLASK4` is optional and defaults to `klask-4-state.json`.

## Validate locally

Use this sequence to verify both pages end-to-end.

1. Start backend API in local mode.

```bash
npm ci
npm start
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

Coverage is enforced at 100% for `frontend/klask/src/klask/game-logic.ts`.

## CI

GitHub Actions runs on pushes and pull requests to `master` and `main`. The CI
job installs root and frontend dependencies, builds the Vite app, and runs the
coverage-enforced logic tests.

## Deploy routing

`vercel.json` routes:

- `/api/*` -> `api/index.ts`
- `/` -> `index.html` from `frontend/klask/dist`
- `/klask-4` and `/klask-4/` -> `klask-4.html` from `frontend/klask/dist`
- `/klask-4-solo` and `/klask-4-solo/` -> `klask-4-solo.html` from `frontend/klask/dist`
