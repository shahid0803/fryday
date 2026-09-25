import { describe, expect, it } from 'vitest'
import { DevelopmentMockProvider } from './index'

describe('credit-free 3D provider', () => {
  it('completes a local task with an importable GLB URL', async () => {
    const provider = new DevelopmentMockProvider()
    const created = await provider.createTask({ prompt: 'mock mountain bike' })

    expect(created.status).toBe('IN_PROGRESS')
    const task = await new Promise<typeof created>((resolve) => {
      const timer = setInterval(async () => {
        const current = await provider.getTask(created.id)
        if (current.status === 'SUCCEEDED') {
          clearInterval(timer)
          resolve(current)
        }
      }, 250)
    })

    expect(task.modelUrl).toBe('/mock-assets/mock-cube.glb')
  }, 7000)

  it('cancels a local task without contacting an external provider', async () => {
    const provider = new DevelopmentMockProvider()
    const created = await provider.createTask({ prompt: 'mock asset' })
    const canceled = await provider.cancelTask(created.id)

    expect(canceled.status).toBe('CANCELED')
  })
})
