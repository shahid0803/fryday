import { describe, expect, it } from 'vitest'

import { applySceneTool, createInitialScene, insertGeneratedAsset, resolveObjectId } from './sceneTools'

describe('scene tool layer', () => {
  it('removes an existing object and tracks history', () => {
    const scene = createInitialScene()
    const result = applySceneTool(scene, 'removeObject', { objectId: 'rear-wheel' })

    expect(result.result.success).toBe(true)
    expect(result.scene.objects.some((entry) => entry.id === 'rear-wheel')).toBe(false)
    expect(result.scene.history.length).toBeGreaterThan(0)
  })

  it('returns immutable scene references and preserves the previous scene', () => {
    const scene = createInitialScene()
    const previousObjects = scene.objects
    const result = applySceneTool(scene, 'removeObject', { objectId: 'rear-wheel' })

    expect(result.scene).not.toBe(scene)
    expect(result.scene.objects).not.toBe(previousObjects)
    expect(scene.objects.some((entry) => entry.id === 'rear-wheel')).toBe(true)
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

  it('restores the pre-reset scene when undo follows reset', () => {
    const changed = applySceneTool(createInitialScene(), 'removeObject', { objectId: 'rear-wheel' }).scene
    const reset = applySceneTool(changed, 'resetScene', {}).scene
    const undone = applySceneTool(reset, 'undoScene', {}).scene

    expect(undone.objects.some((entry) => entry.id === 'rear-wheel')).toBe(false)
  })

  it('assigns a unique ID when a generated asset collides', () => {
    const scene = createInitialScene()
    const first = insertGeneratedAsset(scene, { id: 'generated-bike', name: 'Bike', modelUrl: '/bike.glb' })
    const second = insertGeneratedAsset(first.scene, { id: 'generated-bike', name: 'Bike 2', modelUrl: '/bike-2.glb' })

    expect(first.objectId).toBe('generated-bike')
    expect(second.objectId).toBe('generated-bike-2')
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
