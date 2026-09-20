import { describe, expect, it } from 'vitest'

import { applySceneTool, createInitialScene, resolveObjectId } from './sceneTools'

describe('scene tool layer', () => {
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
