# NOVA — AI 3D Design Copilot

NOVA is a cinematic React + Three.js workspace for conversational 3D scene editing. Phase 3 adds a provider-backed text-to-3D pipeline: a generation request becomes an asynchronous task, progress is polled, the returned GLB is normalized and imported into the live scene, and the generated object remains available to later scene commands.

## Features

- Futuristic React Three Fiber workspace with procedural bike scene
- Typed scene command layer with selection, move, scale, remove, undo, and reset
- Server-only OpenAI and Meshy credentials
- `generate3DModel` provider boundary with Meshy implementation
- Async generation routes with progress, cancellation, validation, and basic rate limiting
- GLB import through `GLTFLoader` with automatic centering and scale normalization
- Explicit development mock mode for UI testing without provider credentials

## Setup

```bash
npm install
copy .env.example .env
npm run dev:full
```

The Vite app runs on `http://localhost:5173` and proxies `/api` requests to the server on port `3001`.

Configure `.env` on the server:

```env
OPENAI_API_KEY=...
MESHY_API_KEY=...
PORT=3001
ENABLE_3D_MOCKS=false
```

`MESHY_API_KEY` is never sent to the browser. Set `ENABLE_3D_MOCKS=true` only in development to exercise task progress without spending provider credits; the mock is disabled in production.

## Generation API

- `POST /api/3d/text-to-3d` — creates a Meshy preview task
- `GET /api/3d/tasks/:taskId` — returns normalized task status and the GLB URL when ready
- `POST /api/3d/tasks/:taskId/cancel` — requests task deletion/cancellation

The server uses Meshy’s current v2 text-to-3D API and maps `model_urls.glb` to the safe `modelUrl` field returned to the client.

## Validation

```bash
npm run build
npx vitest run
npm run lint
```

Generated GLB files are loaded from the provider URL at runtime and are intentionally not committed to Git.
