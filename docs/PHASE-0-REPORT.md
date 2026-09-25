# FRYDAY (NOVA) — Phase 0 Test & Baseline Report

**Date**: September 21, 2026  
**Auditor**: Antigravity Assistant  
**Repository**: [https://github.com/shahid0803/fryday.git](https://github.com/shahid0803/fryday.git)  
**Target Branch**: `main`  
**Phase**: Phase 0 — Baseline Audit, Verification & Stabilization  

---

## 1. Baseline Verification & Test Suite Status

All build, typecheck, linting, and testing commands have been executed using the project's actual scripts and toolchain.

### 1.1 Command Execution Summary

| Command | Status | Output / Findings | Exit Code |
| :--- | :--- | :--- | :--- |
| `npm install` | **PASS** | 231 packages installed, audited 232 packages, 0 vulnerabilities. | 0 |
| `npm run typecheck` (`tsc -b`) | **PASS** | Completed with 0 TypeScript compilation errors. | 0 |
| `npm run lint` (`oxlint`) | **PASS** | 0 warnings, 0 errors across 15 files with 116 rules. | 0 |
| `npm test` (`vitest run`) | **PASS** | 1 test file passed (`src/scene/sceneTools.test.ts`), 8 tests passed. | 0 |
| `npm run build` (`tsc -b && vite build`) | **PASS** | Production client bundle built in 1.52s. Total JS: 1.25MB (343kB gzip). | 0 |
| `npm run server` (`tsx server/index.ts`) | **PASS** | Express server booted cleanly on `http://localhost:3001`. | 0 |
| `GET /api/health` | **PASS** | Returned `{"ok": true, "status": "online"}`. | 0 |

---

## 2. What Works vs. What Fails

### 2.1 What Works (Verified Baseline)
- **Dependency & Build Pipeline**: Clean Vite 8 + React 19 + TypeScript + Tailwind 4 compilation.
- **Scene State Management**: Pure functions in `src/scene/sceneTools.ts` handle object creation, removal, translation, rotation, scaling, undo, and reset.
- **Procedural 3D Bike Scene**: Three.js WebGL rendering of procedural bike components (frame, front wheel, rear wheel, handlebars, seat, pedals, chain) with lighting and shadows.
- **Camera & Viewport Navigation**: Orbit controls (pan, zoom, orbit) with constrained polar angles and distances.
- **UI Shell**: Cyberpunk/cinematic layout with top navigation, scene tree panel, viewport canvas, assistant transcript feed, and bottom command bar.
- **Backend Proxy & Health**: Express server properly configures CORS, JSON parsing, rate limiting, and health endpoint.
- **API Secret Isolation**: Server-side isolation ensures `OPENAI_API_KEY` and `MESHY_API_KEY` are never exposed to the client.
- **Unit Test Coverage for Core Tools**: All 8 tests in `src/scene/sceneTools.test.ts` pass cleanly.

### 2.2 What Fails & Exact Error Scenarios

#### Scenario 1: Natural Language Multi-Target Commands ("remove both tyres")
* **Command Input**: `"remove both tyres"`
* **Observed Result**: Fails.
* **Exact Error Message**:
  ```text
  "I could not identify which wheel or tyre to remove."
  ```
* **Explanation**: In `src/ai/realtimeTools.ts`, `describeTargetObject` expects explicit singular qualifiers (`"front"` or `"rear"`/`"back"`). The plural phrase `"both tyres"` does not match any alias, returning `null`. Additionally, `removeObject` only supports a single `objectId`.

#### Scenario 2: Single-Word Undo Command ("undo")
* **Command Input**: `"undo"`
* **Observed Result**: Fails.
* **Exact Error Message**:
  ```text
  "The command is not currently supported by the scene tool layer."
  ```
* **Explanation**: `parseTextCommand` checks `/(undo|revert).*(that|last|scene)/`. If the user simply says or types `"undo"` without following words, regex matching fails.

#### Scenario 3: Manual 3D Gizmo Dragging (`TransformControls`)
* **User Action**: Selecting an object and dragging the translate gizmo in the 3D canvas.
* **Observed Result**: Mesh moves visually during the drag, but immediately snaps back to its original position upon any React re-render or selection change.
* **Explanation**: `<TransformControls>` in `src/App.tsx` has no `onObjectChange` or `onMouseUp` event listeners attached. React state `scene.objects` is never updated, and no undo history snapshot is saved.

#### Scenario 4: Hidden Objects in Scene Tree
* **Command Input**: `"hide front wheel"` (or calling `hideObject`)
* **Observed Result**: Object vanishes from the 3D viewport AND disappears completely from the left sidebar Scene Tree.
* **Explanation**: `App.tsx` filters `scene.objects.filter(object => object.visible)` before passing to `SceneNodeRow`. The existing `<EyeOff />` component logic is unreachable. The user has no UI mechanism to inspect or unhide hidden objects.

#### Scenario 5: Text-to-3D Provider Creation via Meshy API
* **API Action**: `POST /api/3d/text-to-3d` with real `MESHY_API_KEY`.
* **Observed Result**: Task fails during initialization or subsequent polling.
* **Exact Error Message**:
  ```text
  "Unable to read generation progress" / 404 on /api/3d/tasks/undefined
  ```
* **Explanation**: Meshy API v2 returns `{ "result": "<taskId>" }`. `MeshyProvider.ts` treats this as `MeshyTask` and accesses `task.id`, which resolves to `undefined`.

#### Scenario 6: Development Mock 3D Generation Completion
* **Action**: Generating 3D model with `ENABLE_3D_MOCKS=true`.
* **Observed Result**: Reaches 100% progress and throws an uncaught error.
* **Exact Error Message**:
  ```text
  Error: Generation succeeded.
  ```
* **Explanation**: `DevelopmentMockProvider` in `server/3d/index.ts` returns `modelUrl: undefined`. In `src/ai/generationClient.ts`, line 43 checks `if (task.status !== 'SUCCEEDED' || !task.modelUrl)` and throws an error using `task.error ?? 'Generation succeeded.'`.

#### Scenario 7: Remote GLB Loading in 3D Viewport
* **Action**: Importing a generated GLB model URL into the scene.
* **Observed Result**: Canvas crashes with uncaught React error.
* **Exact Error Message**:
  ```text
  Error: A component suspended while rendering, but no fallback was provided.
  Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.
  ```
* **Explanation**: Drei's `useGLTF(url)` inside `GeneratedModel` suspends during network load. There is no `<Suspense>` wrapper inside `SceneViewport` or around `Canvas`.

#### Scenario 8: Voice Input & Realtime AI WebRTC
* **User Action**: Clicking `VoiceButton` to start voice interaction.
* **Observed Result**: Browser requests microphone permissions; button changes to `LISTENING`. However, no speech recognition occurs, no audio is streamed, and speaking produces no AI response.
* **Explanation**: `RealtimeAIClient.startListening()` acquires `getUserMedia`, but no `RTCPeerConnection` or WebSocket data channel is ever created. No audio track is sent to OpenAI.

---

## 3. Current Architecture Overview

```
                      +---------------------------------------+
                      |               BROWSER                 |
                      |                                       |
                      |  +---------------------------------+  |
                      |  |     App.tsx (Main Layout)       |  |
                      |  +----------------+----------------+  |
                      |                   |                   |
             +--------+---------+         |        +----------+----------+
             |                  |         |        |                     |
             v                  v         v        v                     v
     +---------------+  +---------------+ | +---------------+  +------------------+
     | SceneNodeRow  |  | SceneViewport | | | AssistantFeed |  | CommandBar       |
     | (Scene Tree)  |  | (R3F Canvas)  | | | (Chat log)    |  | (Voice + Input)  |
     +---------------+  +-------+-------+ | +---------------+  +--------+---------+
                                |         |                             |
                                v         |                             v
                         +--------------+ |                   +-------------------+
                         | ModelPart &  | |                   | RealtimeAIClient  |
                         | Drei Controls| |                   | (Local Regex AI)  |
                         +--------------+ |                   +---------+---------+
                                          |                             |
                                          +--------------+--------------+
                                                         |
                                    HTTP Requests (/api) |
                                                         v
                      +---------------------------------------+
                      |            EXPRESS BACKEND            |
                      |             (server/index.ts)         |
                      |                                       |
                      |  - /api/health                        |
                      |  - /api/realtime/session (OpenAI proxy|
                      |  - /api/3d/text-to-3d    (Meshy proxy)|
                      |  - /api/3d/tasks/:taskId              |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |         EXTERNAL AI PROVIDERS         |
                      |  - OpenAI Realtime API (gpt-4o)       |
                      |  - Meshy Text-to-3D API (v2)          |
                      +---------------------------------------+
```

---

## 4. Recommended Implementation Sequence

To resolve existing bugs and systematically evolve FRYDAY into a production-grade conversational 3D workspace, the following phase sequence is recommended:

### Phase 1: Core Scene & Interaction Hardening (Next Phase)
1. **Scene Hierarchy Visibility**: Render all scene objects in the tree view; add interactive eye icons allowing users to toggle visibility.
2. **TransformControls Synchronization**: Attach `onObjectChange` and `onMouseUp` to `<TransformControls>` to commit matrix updates into `scene.objects` and record undo snapshots.
3. **Plural & Multi-Target Tool Execution**: Upgrade `resolveObjectId` and `describeTargetObject` to support multi-object resolution; update `applySceneTool` to support batch actions (e.g. removing/hiding both wheels).
4. **Command Parsing Polish**: Fix regex patterns in `parseTextCommand` so single-word commands like `"undo"`, `"reset"`, and `"motor"` succeed reliably.

### Phase 2: 3D Generation Pipeline Stabilization
1. **Meshy Provider Fix**: Correct response parsing in `server/3d/meshyProvider.ts` to capture `{ result: taskId }`.
2. **Mock Provider Model URL**: Provide a valid base64 or bundled minimal GLB asset in `DevelopmentMockProvider` so mock workflows run end-to-end.
3. **GLB Suspense & Error Handling**: Wrap `GeneratedModel` and `SceneViewport` with React `<Suspense>` and an error boundary to eliminate canvas crashes during GLB downloads.
4. **Asset Memory Disposal**: Dispose Three.js geometries and textures upon object removal.

### Phase 3: True Realtime AI & Voice Communication
1. **WebRTC Peer Connection**: Establish live WebRTC session using the OpenAI Realtime ephemeral token.
2. **Audio Track Streaming**: Stream microphone input to OpenAI; receive and play assistant voice output.
3. **Model-Driven Tool Calling**: Bind `sceneToolDefinitions` to OpenAI session tools so the LLM directly invokes functions with structured JSON arguments.

### Phase 4: Cinematic UI/UX Overhaul (Reference Video Alignment)
1. **Atmospheric 3D Styling**: Introduce glowing neon light ribbon trails, undulating dark terrain mesh, bloom post-processing, and particle fields matching the reference video.
2. **Modular UI Refactoring**: Decompose `App.tsx` into modular domain components (`SceneTree`, `ViewportControls`, `PropertiesPanel`, `Transcript`).
