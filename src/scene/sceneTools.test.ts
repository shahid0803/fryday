import { describe, expect, it } from 'vitest'

import { parseTextCommand } from '../ai/realtimeTools'
import {
  applySceneTool,
  createInitialScene,
  executeSceneCommand,
  getSceneContext,
  resolveObjectId,
  resolveTargetObjects,
} from './sceneTools'

describe('scene tool layer & command architecture', () => {
  describe('core scene tools (backward compatibility)', () => {
    it('removes an existing object and tracks history', () => {
      const scene = createInitialScene()
      const result = applySceneTool(scene, 'removeObject', { objectId: 'rear-wheel' })

      expect(result.result.success).toBe(true)
      expect(result.scene.objects.some((entry) => entry.id === 'rear-wheel')).toBe(false)
      expect(result.scene.history.length).toBeGreaterThan(0)
    })

    it('adds and scales an engine', () => {
      const scene = createInitialScene()
      const next = applySceneTool(scene, 'addMotor', {})
      const scaled = applySceneTool(next.scene, 'scaleObject', { objectId: 'engine', scale: [0.7, 0.7, 0.7] })

      expect(next.result.success).toBe(true)
      expect(scaled.result.success).toBe(true)
      expect(scaled.scene.objects.find((entry) => entry.id === 'engine')?.scale).toEqual([0.7, 0.7, 0.7])
    })

    it('restores the previous state via undoScene', () => {
      const scene = createInitialScene()
      const removed = applySceneTool(scene, 'removeObject', { objectId: 'rear-wheel' })
      const undone = applySceneTool(removed.scene, 'undoScene', {})

      expect(undone.result.success).toBe(true)
      expect(undone.scene.objects.some((entry) => entry.id === 'rear-wheel')).toBe(true)
    })

    it('resets the scene back to the default bike layout', () => {
      const scene = createInitialScene()
      const result = applySceneTool(scene, 'resetScene', {})

      expect(result.result.success).toBe(true)
      expect(result.scene.scene).toBe('Mountain Bike')
      expect(result.scene.objects.length).toBeGreaterThan(0)
    })

    it('validates missing tool arguments', () => {
      const scene = createInitialScene()
      const result = applySceneTool(scene, 'moveObject', { objectId: 'frame' })

      expect(result.result.success).toBe(false)
      expect(result.result.error).toContain('position')
    })

    it('fails cleanly for an unknown object', () => {
      const scene = createInitialScene()
      const result = applySceneTool(scene, 'removeObject', { objectId: 'mystery-object' })

      expect(result.result.success).toBe(false)
      expect(result.result.error).toContain('not found')
    })

    it('fails cleanly for an unknown tool', () => {
      const scene = createInitialScene()
      const result = applySceneTool(scene, 'unknownTool', { objectId: 'frame' })

      expect(result.result.success).toBe(false)
      expect(result.result.error).toContain('Unsupported tool action')
    })

    it('resolves natural-language aliases to object IDs', () => {
      const scene = createInitialScene()
      const resolved = resolveObjectId('take off the rear tyre', scene)

      expect(resolved).toBe('rear-wheel')
    })
  })

  describe('manual transform synchronization (Command Bus)', () => {
    it('synchronizes manual movement and updates history', () => {
      const scene = createInitialScene()
      const initialPos = [...scene.objects.find((o) => o.id === 'frame')!.position]

      const res = executeSceneCommand(scene, {
        type: 'moveObject',
        objectId: 'frame',
        position: [1.5, 2.0, 0.5],
      })

      expect(res.result.success).toBe(true)
      const frame = res.scene.objects.find((o) => o.id === 'frame')!
      expect(frame.position).toEqual([1.5, 2.0, 0.5])
      expect(res.scene.history.length).toBe(1)
      expect(res.scene.history[0]!.objects.find((o) => o.id === 'frame')!.position).toEqual(initialPos)

      // Undoing restores the exact position
      const undoRes = executeSceneCommand(res.scene, { type: 'undoScene' })
      expect(undoRes.result.success).toBe(true)
      expect(undoRes.scene.objects.find((o) => o.id === 'frame')!.position).toEqual(initialPos)
    })

    it('synchronizes rotation and scale via setTransform', () => {
      const scene = createInitialScene()
      const res = executeSceneCommand(scene, {
        type: 'setTransform',
        objectId: 'seat',
        position: [0.15, 2.1, 0],
        rotation: [0, 0.3, 0],
        scale: [1.2, 1.2, 1.2],
      })

      expect(res.result.success).toBe(true)
      const seat = res.scene.objects.find((o) => o.id === 'seat')!
      expect(seat.position).toEqual([0.15, 2.1, 0])
      expect(seat.rotation).toEqual([0, 0.3, 0])
      expect(seat.scale).toEqual([1.2, 1.2, 1.2])
      expect(res.scene.selectedId).toBe('seat')
      expect(res.scene.history.length).toBe(1)
    })
  })

  describe('object visibility & recovery (hide vs show vs delete)', () => {
    it('maintains hidden objects in the scene graph and allows recovery', () => {
      const scene = createInitialScene()

      // 1. Hide front wheel
      const hidden = executeSceneCommand(scene, { type: 'hideObject', objectId: 'front-wheel' })
      expect(hidden.result.success).toBe(true)
      const obj = hidden.scene.objects.find((o) => o.id === 'front-wheel')!
      expect(obj.visible).toBe(false)
      // Object remains in scene hierarchy!
      expect(hidden.scene.objects.some((o) => o.id === 'front-wheel')).toBe(true)

      // 2. Show front wheel (recovery)
      const shown = executeSceneCommand(hidden.scene, { type: 'showObject', objectId: 'front-wheel' })
      expect(shown.result.success).toBe(true)
      expect(shown.scene.objects.find((o) => o.id === 'front-wheel')!.visible).toBe(true)

      // 3. Delete is separate from hide: removes completely from objects
      const removed = executeSceneCommand(shown.scene, { type: 'removeObject', objectId: 'front-wheel' })
      expect(removed.result.success).toBe(true)
      expect(removed.scene.objects.some((o) => o.id === 'front-wheel')).toBe(false)
    })

    it('supports batch hide and batch show', () => {
      const scene = createInitialScene()
      const res = executeSceneCommand(scene, {
        type: 'hideObjects',
        objectIds: ['front-wheel', 'rear-wheel'],
      })

      expect(res.result.success).toBe(true)
      expect(res.scene.objects.find((o) => o.id === 'front-wheel')!.visible).toBe(false)
      expect(res.scene.objects.find((o) => o.id === 'rear-wheel')!.visible).toBe(false)
      expect(res.scene.history.length).toBe(1)

      // Batch show
      const shown = executeSceneCommand(res.scene, {
        type: 'showObjects',
        objectIds: ['front-wheel', 'rear-wheel'],
      })
      expect(shown.result.success).toBe(true)
      expect(shown.scene.objects.find((o) => o.id === 'front-wheel')!.visible).toBe(true)
      expect(shown.scene.objects.find((o) => o.id === 'rear-wheel')!.visible).toBe(true)
    })
  })

  describe('multi-object operations & "remove both tyres"', () => {
    it('resolves group alias "both tyres" and removes both wheels in atomic command', () => {
      const scene = createInitialScene()
      const targets = resolveTargetObjects('both tyres', scene)
      expect(targets).toEqual(['front-wheel', 'rear-wheel'])

      const result = executeSceneCommand(scene, {
        type: 'removeObjects',
        objectIds: targets,
      })

      expect(result.result.success).toBe(true)
      expect(result.scene.objects.some((o) => o.id === 'front-wheel')).toBe(false)
      expect(result.scene.objects.some((o) => o.id === 'rear-wheel')).toBe(false)
      expect(result.scene.history.length).toBe(1) // Single history snapshot for atomic undo!

      // Single undo restores BOTH tyres
      const undone = executeSceneCommand(result.scene, { type: 'undoScene' })
      expect(undone.result.success).toBe(true)
      expect(undone.scene.objects.some((o) => o.id === 'front-wheel')).toBe(true)
      expect(undone.scene.objects.some((o) => o.id === 'rear-wheel')).toBe(true)
    })

    it('executes "remove both tyres" via text command parser', () => {
      const scene = createInitialScene()
      const outcome = parseTextCommand('remove both tyres', scene)

      expect(outcome.result.success).toBe(true)
      expect(outcome.scene.objects.some((o) => o.id === 'front-wheel')).toBe(false)
      expect(outcome.scene.objects.some((o) => o.id === 'rear-wheel')).toBe(false)
    })

    it('executes "hide both tyres" via text command parser', () => {
      const scene = createInitialScene()
      const outcome = parseTextCommand('hide both tyres', scene)

      expect(outcome.result.success).toBe(true)
      expect(outcome.scene.objects.find((o) => o.id === 'front-wheel')!.visible).toBe(false)
      expect(outcome.scene.objects.find((o) => o.id === 'rear-wheel')!.visible).toBe(false)
    })

    it('executes single-word "undo"', () => {
      const scene = createInitialScene()
      const removed = executeSceneCommand(scene, { type: 'removeObject', objectId: 'seat' })
      expect(removed.scene.objects.some((o) => o.id === 'seat')).toBe(false)

      const undone = parseTextCommand('undo', removed.scene)
      expect(undone.result.success).toBe(true)
      expect(undone.scene.objects.some((o) => o.id === 'seat')).toBe(true)
    })
  })

  describe('selection synchronization', () => {
    it('synchronizes selection and validates target', () => {
      const scene = createInitialScene()
      const res = executeSceneCommand(scene, { type: 'selectObject', objectId: 'handlebar' })

      expect(res.result.success).toBe(true)
      expect(res.scene.selectedId).toBe('handlebar')
    })

    it('fails cleanly when selecting nonexistent object', () => {
      const scene = createInitialScene()
      const res = executeSceneCommand(scene, { type: 'selectObject', objectId: 'nonexistent-part' })

      expect(res.result.success).toBe(false)
      expect(res.result.error).toContain('not found')
    })
  })

  describe('generated object compatibility', () => {
    it('inserts a generated asset as a normal scene object with full transform and undo support', () => {
      const scene = createInitialScene()
      const res = executeSceneCommand(scene, {
        type: 'insertGeneratedAsset',
        asset: {
          id: 'gen-futuristic-helmet',
          name: 'Futuristic Helmet',
          modelUrl: 'https://example.com/helmet.glb',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          position: [0, 1.5, 0],
          scale: [0.8, 0.8, 0.8],
        },
      })

      expect(res.result.success).toBe(true)
      expect(res.scene.selectedId).toBe('gen-futuristic-helmet')
      const helmet = res.scene.objects.find((o) => o.id === 'gen-futuristic-helmet')!
      expect(helmet).toBeDefined()
      expect(helmet.generated).toBe(true)
      expect(helmet.assetUrl).toBe('https://example.com/helmet.glb')
      expect(helmet.position).toEqual([0, 1.5, 0])

      // Can be transformed like any object
      const moved = executeSceneCommand(res.scene, {
        type: 'moveObject',
        objectId: 'gen-futuristic-helmet',
        position: [0.5, 1.8, 0],
      })
      expect(moved.scene.objects.find((o) => o.id === 'gen-futuristic-helmet')!.position).toEqual([0.5, 1.8, 0])

      // Can be hidden
      const hidden = executeSceneCommand(moved.scene, {
        type: 'hideObject',
        objectId: 'gen-futuristic-helmet',
      })
      expect(hidden.scene.objects.find((o) => o.id === 'gen-futuristic-helmet')!.visible).toBe(false)

      // Can be undone back to before generation
      const undo1 = executeSceneCommand(hidden.scene, { type: 'undoScene' }) // undo hide
      const undo2 = executeSceneCommand(undo1.scene, { type: 'undoScene' }) // undo move
      const undo3 = executeSceneCommand(undo2.scene, { type: 'undoScene' }) // undo insertion
      expect(undo3.scene.objects.some((o) => o.id === 'gen-futuristic-helmet')).toBe(false)
    })
  })

  describe('scene context & hierarchy metadata', () => {
    it('provides concise structured telemetry with parentId and transforms without geometry buffers', () => {
      const scene = createInitialScene()
      const context = getSceneContext(scene)

      expect(context.scene).toBe('Mountain Bike')
      expect(context.selectedId).toBe('frame')
      expect(context.objectCount).toBe(7)
      expect(context.visibleCount).toBe(7)

      // Inspect child object hierarchy
      const frontWheel = context.objects.find((o) => o.id === 'front-wheel')!
      expect(frontWheel.parentId).toBe('frame')
      expect(frontWheel.position).toEqual([1.9, 0.55, 0])
      expect(frontWheel.rotation).toEqual([0, 0, 0])
      expect(frontWheel.scale).toEqual([1, 1, 1])
      expect(frontWheel.metadata).toEqual({ placement: 'front', diameter: 29 })

      // Guaranteed no vertex / geometry buffers in context
      const serialized = JSON.stringify(context)
      expect(serialized).not.toContain('geometry')
      expect(serialized).not.toContain('buffer')
      expect(serialized.length).toBeLessThan(3000)
    })
  })
})
