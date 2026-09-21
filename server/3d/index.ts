import type { TextTo3DProvider, TextTo3DRequest, TextTo3DTask } from './types'
import { MeshyProvider } from './meshyProvider'

export function createTextTo3DProvider(): TextTo3DProvider | null {
  const apiKey = process.env.MESHY_API_KEY
  if (apiKey) return new MeshyProvider(apiKey)
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_3D_MOCKS === 'true') {
    return new DevelopmentMockProvider()
  }
  return null
}

class DevelopmentMockProvider implements TextTo3DProvider {
  private readonly tasks = new Map<string, { createdAt: number; prompt: string }>()

  async createTask(input: TextTo3DRequest): Promise<TextTo3DTask> {
    const id = `dev-${Date.now()}`
    this.tasks.set(id, { createdAt: Date.now(), prompt: input.prompt })
    return this.getTask(id)
  }

  async getTask(taskId: string) {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error('Development task was not found.')
    const progress = Math.min(100, Math.floor((Date.now() - task.createdAt) / 1000) * 25)
    return {
      id: taskId,
      status: progress >= 100 ? 'SUCCEEDED' as const : 'IN_PROGRESS' as const,
      progress,
      provider: 'development-mock',
      error: undefined,
    }
  }

  async cancelTask(taskId: string) {
    this.tasks.delete(taskId)
    return { id: taskId, status: 'CANCELED' as const, progress: 0, provider: 'development-mock' }
  }
}
