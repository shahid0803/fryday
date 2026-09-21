# FRYDAY (NOVA) — Architecture Audit Report

**Date**: September 21, 2026  
**Auditor**: Antigravity Assistant  
**Repository**: [https://github.com/shahid0803/fryday.git](https://github.com/shahid0803/fryday.git)  
**Status**: Baseline Audit & Stabilization (Phase 0)  

---

## 1. Executive Summary

FRYDAY (currently branded as **NOVA**) is an experimental conversational 3D design workspace built with React, Three.js, React Three Fiber, Express, and modern generative AI scaffolding. The long-term product vision is a JARVIS-like conversational 3D workspace where users speak or type natural language to create, inspect, manipulate, and refine 3D scenes in real time.

The current codebase establishes an initial prototype featuring a procedural 3D mountain bike, an interactive viewport, an assistant transcript sidebar, an Express backend proxy, a typed scene tool execution layer, and scaffolding for OpenAI Realtime voice interactions and Meshy text-to-3D generation.

This audit evaluates the codebase across frontend, backend, scene state, AI, realtime WebRTC, and 3D generation pipelines. Every component is classified according to its implementation maturity:
- `IMPLEMENTED` — Fully functioning and validated.
- `PARTIALLY IMPLEMENTED` — Functional core exists, but contains edge-case limitations or unhandled states.
- `SCAFFOLDED` — Interface or stub in place, but internal plumbing or actual network/protocol handling is not implemented.
- `MISSING` — Required capability not yet present in the codebase.
- `BROKEN` — Present in code, but fails at runtime due to logical, network, or schema errors.

---

## 2. Subsystem Architecture & Implementation Status

### 2.1 Frontend Architecture
* **Status**: `PARTIALLY IMPLEMENTED`
* **Stack**: React 19.2.0, Vite 8.3.0, Tailwind CSS 4.3.3, Lucide React 1.47.0, Three.js 0.186.0, `@react-three/fiber` 9.7.0, `@react-three/drei` 10.7.8.
* **Component Structure**:
  - `src/App.tsx`: Central shell combining top bar, left-hand Scene Tree (`SceneNodeRow`), center WebGL viewport (`SceneViewport`), right-hand AI Assistant feed (`AssistantPanel`), and bottom command bar (`VoiceButton` + input prompt).
  - `src/components/AssistantPanel.tsx`: Scrollable list rendering conversation history items categorized as `user` or `assistant`.
  - `src/components/VoiceButton.tsx`: Multi-state status button indicating states (`LISTENING`, `THINKING`, `EXECUTING`, `SPEAKING`, `ERROR`, `READY`).
* **Canvas & 3D Rendering**:
  - Uses `@react-three/fiber` `<Canvas>` with ambient, directional, and colored point lighting, atmospheric fog (`#070d12`), a circular ground pedestal, coordinate `<Grid>`, and a procedural neon accent `<Line>`.
  - Camera is controlled via Drei `<OrbitControls>` with configured distance and polar angle constraints.
  - Interactive selection is handled via raycasting on meshes, highlighting selected parts and displaying `<TransformControls>`.
* **Identified Deficiencies**:
  - Monolithic `App.tsx` contains scene state orchestration, UI markup, 3D scene elements, and procedural geometries in a single 420-line file.
  - Absence of `<Suspense>` inside `<Canvas>` crashes runtime when remote GLBs are rendered via Drei's `useGLTF`.
  - Missing global error boundaries around the WebGL context.

---

### 2.2 Backend Architecture
* **Status**: `IMPLEMENTED`
* **Stack**: Node.js, Express 5.2.1, TypeScript 6.0.2, `tsx` 4.23.15, `cors` 2.8.6, `dotenv` 18.0.1.
* **Server Entry Point**: `server/index.ts` running on port 3001 (proxied via Vite `/api` rewrite).
* **Endpoints**:
  - `GET /api/health`: Healthcheck endpoint returning `{ ok: true, status: 'online' }`.
  - `POST /api/realtime/session`: Initiates an ephemeral OpenAI Realtime session with `gpt-4o-realtime-preview-2024-12-17`, keeping `OPENAI_API_KEY` secure on the server. Falls back to mock mode if the key is unset.
  - `POST /api/3d/text-to-3d`: Validates prompt length (3–1000 characters), applies an in-memory IP rate limiter (max 10 requests per minute), and delegates task creation to the 3D provider.
  - `GET /api/3d/tasks/:taskId`: Returns normalized task status, progress percentage, and asset URLs.
  - `POST /api/3d/tasks/:taskId/cancel`: Requests task cancellation.
* **Security & Boundary Enforcement**:
  - Secrets (`OPENAI_API_KEY`, `MESHY_API_KEY`) reside exclusively server-side.
  - No secrets are passed to or bundled within the client.

---

### 2.3 Scene State Architecture
* **Status**: `PARTIALLY IMPLEMENTED`
* **Core Files**: `src/types/scene.ts`, `src/scene/sceneTools.ts`.
* **State Shape**:
  - `SceneState`: Contains `scene` name, active `selectedId`, an array of `objects: SceneObject[]`, and an undo stack `history: SceneSnapshot[]` (capped at 20 snapshots).
  - `SceneObject`: Represents an entity with `id`, `name`, `type`, `visible`, `position`, `scale`, `rotation`, and optional `assetUrl` / `thumbnailUrl`.
* **Tool Dispatch Engine (`applySceneTool`)**:
  - Pure transformation function taking `(scene, toolName, args)` and returning `{ scene: SceneState, result: ToolResult }`.
  - Maintains immutable state history via `pushSceneHistory(scene)` before modifying operations.
* **Identified Deficiencies**:
  - Single-target limitation: All tool mutations operate strictly on a single `objectId: string`. No batch operations or plural targets are supported.
  - Manual gizmo manipulations are completely disconnected from the scene state.

---

### 2.4 AI Architecture
* **Status**: `SCAFFOLDED`
* **Core Files**: `src/ai/realtimeClient.ts`, `src/ai/realtimeTools.ts`.
* **Current Operational Mechanism**:
  - When the user submits text in `App.tsx`, `RealtimeAIClient.sendText` intercepts the string.
  - Generation intent regex: Tests if text matches `/^(create|generate|make|build)\b/` combined with 3D keywords; if so, triggers `generate3DModel()`.
  - Tool execution regex: Passes command string to `parseTextCommand(text, scene)`.
  - `parseTextCommand` uses hardcoded regular expressions to detect commands (`undo`, `reset`, `addMotor`, `scaleObject`, `moveObject`, `removeObject`, `selectObject`).
* **Identified Deficiencies**:
  - No LLM semantic reasoning is involved in the text command loop.
  - Fragile regex heuristics fail on variations of natural language input (e.g. typing "undo" without suffix words).
  - Tool catalog schema (`toolCatalog`) is defined in TypeScript but never provided to OpenAI model calls.

---

### 2.5 Realtime Architecture
* **Status**: `SCAFFOLDED` / `BROKEN`
* **Analysis**:
  - Backend creates an OpenAI ephemeral session token via `/api/realtime/session`.
  - Client calls `fetch('/api/realtime/session')` during `client.connect()`.
  - **No WebRTC Connection**: `RealtimeAIClient` does NOT create an `RTCPeerConnection`, does not exchange SDP offers/answers with OpenAI's WebRTC gateway (`https://api.openai.com/v1/realtime`), and does not establish a data channel.
  - **No Audio Streaming**: `startListening()` executes `navigator.mediaDevices.getUserMedia({ audio: true })` and stores the stream in a local field, but never binds audio tracks to an outgoing peer connection.
  - **No Voice Feedback**: The system lacks an incoming audio track handler or audio element to play assistant speech responses.
  - **Summary**: Realtime voice connection is a non-functional scaffold.

---

### 2.6 3D Generation Architecture
* **Status**: `PARTIALLY IMPLEMENTED` / `BROKEN`
* **Core Files**: `server/3d/meshyProvider.ts`, `server/3d/index.ts`, `src/ai/generationClient.ts`.
* **Pipeline**:
  1. Client calls `POST /api/3d/text-to-3d` with prompt.
  2. Server dispatches request to `TextTo3DProvider` (`MeshyProvider` or `DevelopmentMockProvider`).
  3. Client enters a polling loop via `GET /api/3d/tasks/:taskId` every 2500ms until status is `SUCCEEDED`, `FAILED`, or `CANCELED`.
  4. Upon success, client receives `modelUrl` and calls `applySceneTool(scene, 'createObject', ...)` with `type: 'generated-model'` and `assetUrl: modelUrl`.
* **Identified Deficiencies & Provider Bugs**:
  - **Meshy Response Format Mismatch (`BROKEN`)**: Meshy API v2 `POST` returns `{ "result": "<task_id>" }`. The server expects `{ id, status, progress }`, causing task initialization to return `undefined` id and fail immediately.
  - **Mock Provider Missing `modelUrl` (`BROKEN`)**: `DevelopmentMockProvider` reaches 100% progress and returns `status: 'SUCCEEDED'` without a `modelUrl`. `generationClient.ts` throws an error because `!task.modelUrl`, breaking local mock testing.
  - **Missing Suspense in Viewer (`BROKEN`)**: When `assetUrl` is assigned to a `SceneObject`, Three.js crashes on `useGLTF(url)` due to missing `<Suspense>`.

---

## 3. Tool Catalog Inventory

The scene tool definitions are cataloged in `src/scene/sceneTools.ts` (`sceneToolDefinitions`) and mirrored in `src/ai/realtimeTools.ts` (`toolCatalog`):

| Tool Name | Parameters | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `createObject` | `objectId`, `name`, `type`, `position?`, `scale?`, `assetUrl?`, `thumbnailUrl?` | Creates a new entity in the scene graph and registers it in history. | `IMPLEMENTED` |
| `removeObject` | `objectId` | Removes an object by ID or resolved alias; records history snapshot. | `IMPLEMENTED` (Single target only) |
| `hideObject` | `objectId` | Sets `visible = false`; retains object in state hierarchy. | `PARTIALLY IMPLEMENTED` (Hidden from UI tree) |
| `showObject` | `objectId` | Restores visibility (`visible = true`). | `PARTIALLY IMPLEMENTED` (Cannot select in UI when hidden) |
| `moveObject` | `objectId`, `position: [x,y,z]` | Updates object position in 3D space. | `IMPLEMENTED` |
| `rotateObject` | `objectId`, `rotation: [x,y,z]` | Updates object Euler rotation. | `IMPLEMENTED` |
| `scaleObject` | `objectId`, `scale: [x,y,z]` | Updates object scale vector. | `IMPLEMENTED` |
| `selectObject` | `objectId` | Changes `scene.selectedId` without recording an undo snapshot. | `IMPLEMENTED` |
| `resetScene` | None | Reinitializes scene to default mountain bike layout. | `IMPLEMENTED` |
| `undoScene` | None | Pops the latest snapshot from `scene.history` and restores objects. | `IMPLEMENTED` |
| `getSceneState` | None | Returns active scene hierarchy and object descriptors. | `IMPLEMENTED` |
| `addMotor` | `objectId?` | Convenience helper adding or selecting an engine model on the bike. | `IMPLEMENTED` |
| `generate3DModel`| `prompt`, `mode?` | Initiates asynchronous text-to-3D generation. | `BROKEN` (Provider response schema mismatch) |

---

## 4. Verification of the 8 Known Critical Bugs

### Bug A: "remove both tyres"
* **Status**: `BROKEN`
* **Root Cause**:
  1. In `src/ai/realtimeTools.ts` (lines 125–152, 200–209), the command matching regex matches `"remove both tyres"`, but calls `describeTargetObject()`.
  2. `describeTargetObject` checks for `"rear"` / `"back"` and `"front"`. The phrase `"remove both tyres"` contains neither qualifier.
  3. The alias check fails because none of the alias arrays contain `"both tyres"`.
  4. `describeTargetObject` returns `null`, yielding the error: `"I could not identify which wheel or tyre to remove."`
  5. Additionally, the underlying tool `removeObject` accepts only a single string `objectId`. There is no mechanism in `applySceneTool` to dispatch multi-object removal.

### Bug B: Manual TransformControls changing scene state
* **Status**: `BROKEN`
* **Root Cause**:
  1. In `src/App.tsx` (line 299):
     `<TransformControls object={ref as React.RefObject<Object3D>} mode="translate" size={0.7} />`
  2. `<TransformControls>` lacks any event handlers (`onObjectChange`, `onChange`, or `onMouseUp`).
  3. Dragging the gizmo mutates Three.js's in-memory `Object3D` matrix directly. React state (`scene.objects`) is unaware of the mutation.
  4. On any subsequent React render, the component reads the original `object.position` from state and resets the 3D mesh, snapping it back to its original location.
  5. Manual transformations never record snapshots to `scene.history`.

### Bug C: Hidden objects remaining in scene hierarchy
* **Status**: `BROKEN`
* **Root Cause**:
  1. In `src/App.tsx` (line 63 & 103):
     `const visibleObjects = useMemo(() => scene.objects.filter((object) => object.visible), [scene])`
     The sidebar Scene Tree only maps over `visibleObjects`.
  2. When an object is hidden via `hideObject`, it is purged from the sidebar list entirely.
  3. In `SceneNodeRow`, lines 203–204 provide UI for visibility status (`<Eye>` vs `<EyeOff>`), but this is rendered unreachable because hidden nodes are never passed in.
  4. If an object is hidden while selected, `scene.selectedId` continues pointing to the invisible object, leaving the UI in an inconsistent state.

### Bug D: Realtime AI actually connecting or not
* **Status**: `SCAFFOLDED` / `BROKEN`
* **Root Cause**:
  1. In `src/ai/realtimeClient.ts` (lines 37–69), `connect()` requests an ephemeral session token from `/api/realtime/session`.
  2. When the session payload arrives, `RealtimeAIClient` simply sets its internal state to `'CONNECTED'` and posts a status message to the transcript.
  3. It does not establish an `RTCPeerConnection`, does not handle WebRTC signaling, does not negotiate audio transceivers, and does not open a data channel.
  4. Realtime streaming does not connect to OpenAI at runtime.

### Bug E: Actual realtime tool calling or not
* **Status**: `SCAFFOLDED`
* **Root Cause**:
  1. Tool schemas in `src/ai/realtimeTools.ts` are never submitted to the OpenAI Realtime session creation endpoint in `server/index.ts`.
  2. In `RealtimeAIClient.sendText`, tool dispatch is executed entirely on the client through the local regex parser `parseTextCommand()`.
  3. No model-driven tool calling (`function_call` / tool calling events) is wired up.

### Bug F: Text-to-3D provider response handling
* **Status**: `BROKEN`
* **Root Cause**:
  1. Meshy v2 text-to-3D endpoint (`POST https://api.meshy.ai/openapi/v2/text-to-3d`) returns `{ "result": "<task_id_string>" }`.
  2. In `server/3d/meshyProvider.ts`, `createTask()` executes:
     `const task = await this.request<MeshyTask>(MESHY_API_URL, ...)`
     `return normalizeTask(task)`
  3. `normalizeTask` expects `task.id`, which is `undefined` because the ID is stored in `task.result`.
  4. In `server/3d/index.ts`, `DevelopmentMockProvider.getTask` omits `modelUrl` on `'SUCCEEDED'`.
  5. In `src/ai/generationClient.ts`, line 43 asserts `!task.modelUrl` and throws an error upon 100% completion of any mock task.

### Bug G: Generated GLB loading
* **Status**: `BROKEN`
* **Root Cause**:
  1. In `src/App.tsx`, `GeneratedModel` calls Drei's `useGLTF(url)`.
  2. `useGLTF` suspends rendering while downloading assets.
  3. Neither `SceneViewport` nor `Canvas` contains a React `<Suspense fallback={...}>` boundary.
  4. Suspending without a Suspense boundary throws an uncaught React runtime exception, crashing the entire WebGL canvas.
  5. In addition, there is no error boundary to handle network or CORS errors from external model hosting domains.

### Bug H: Undo after generated objects
* **Status**: `PARTIALLY IMPLEMENTED` / `BROKEN`
* **Root Cause**:
  1. Generating an asset invokes `applySceneTool(scene, 'createObject', ...)`, which pushes a snapshot to `scene.history`.
  2. Calling `undoScene` removes the object from `scene.objects`.
  3. However, `generation` state in `App.tsx` is maintained independently and is not reset when an undo occurs.
  4. If an undo occurs while a generation task is still running, the asynchronous promise completes later and re-inserts or selects the object.
  5. In `parseTextCommand`, the regex for undo is `/(undo|revert).*(that|last|scene)/`. Typing or speaking `"undo"` by itself fails to match and returns an unsupported command error.
  6. Three.js geometry, material, and GLTF caches are not disposed when an object is removed via undo.

---

## 5. Security Audit Findings

| Area | Status | Finding | Action Taken |
| :--- | :--- | :--- | :--- |
| **Committed Secrets** | `PASS` | No live API keys, tokens, or credentials exist in git history or files. | Verified via git log regex scan. |
| **`.gitignore` Coverage** | `BROKEN` -> `FIXED` | `.env` was NOT explicitly listed in `.gitignore`. Any created `.env` could easily be committed. | Added `.env`, `.env.*`, `!.env.example`, `*.glb`, `*.gltf` to `.gitignore`. |
| **`.env.example`** | `IMPLEMENTED` | Template existed but lacked comments and instructions. | Updated with explicit variable documentation and security guidelines. |
| **Client Secret Leakage** | `PASS` | Vite client bundle contains no references to server API keys. `MESHY_API_KEY` and `OPENAI_API_KEY` are isolated to `server/`. | Verified via frontend source search. |
| **Tracked Binaries** | `PASS` | No `node_modules` or `.glb` files are committed. | Verified via `git ls-files`. |

---

## 6. Technical Debt & Maintainability

1. **Monolithic Viewport Component**: `src/App.tsx` contains 420+ lines mixing application layout, scene node tree, Three.js lights, cameras, grids, procedural bike geometry, and generation overlays.
2. **Missing Test Automation for UI & AI**: Vitest suite only covers `src/scene/sceneTools.test.ts`. There are zero unit or integration tests for `realtimeTools.ts`, `realtimeClient.ts`, `generationClient.ts`, or backend routes.
3. **Hardcoded Scene Graph**: The bike parts are hardcoded procedural shapes with static dimensions rather than modular, composable scene graph nodes.
4. **Lack of Asset Disposal**: Three.js meshes and materials are not cleaned up with `.dispose()`, leading to GPU memory leaks when objects are repeatedly added and removed.
5. **No Visual Redesign Applied**: In accordance with Phase 0 constraints, the futuristic visual direction depicted in the reference video (cinematic neon ribbon trails, glowing terrain, dark aesthetic) has NOT yet been applied. UI preservation is maintained for Phase 1.

---

## 7. Recommended Next Steps (Phase 1 & Beyond)

1. **Phase 1: Scene State & Tool Execution Hardening**:
   - Refactor `resolveObjectId` and `describeTargetObject` to support multi-object and plural targeting ("remove both tyres", "hide all wheels").
   - Wire `<TransformControls>` events (`onChange`, `onMouseUp`) directly to `scene.objects` state updates and undo history snapshots.
   - Refactor Scene Tree hierarchy in `App.tsx` to render all scene objects (visible and hidden) with clickable visibility toggle buttons.
   - Fix undo parsing regex so `"undo"` alone triggers `undoScene`.

2. **Phase 2: Text-to-3D Provider & GLB Import Stabilization**:
   - Fix `MeshyProvider` response normalization to handle `{ result: taskId }`.
   - Fix `DevelopmentMockProvider` to return a valid local placeholder GLB URL.
   - Wrap `GeneratedModel` and `SceneViewport` with React `<Suspense>` and a Three.js Error Boundary to prevent viewport crashes.
   - Implement proper Three.js asset disposal on object removal.

3. **Phase 3: Realtime WebRTC & Voice Integration**:
   - Implement full WebRTC peer connection in `RealtimeAIClient` using OpenAI Realtime ephemeral session credentials.
   - Connect client microphone track to peer connection; bind incoming assistant audio track to an HTML `<audio>` element for two-way conversation.
   - Configure OpenAI Realtime function tools with `toolCatalog` schema to achieve genuine model-driven tool execution.

4. **Phase 4: Visual Redesign & Cinematic Atmosphere (Reference Video Alignment)**:
   - Implement dark cinematic aesthetic matching the HUSTEON reference video: glowing neon particle curves, procedural terrain, luminescent highlights, and high-fidelity typography.
