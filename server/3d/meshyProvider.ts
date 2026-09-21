import type { TextTo3DProvider, TextTo3DRequest, TextTo3DTask, TextTo3DTaskStatus } from './types'

type MeshyTask = {
  id: string
  status: TextTo3DTaskStatus
  progress?: number
  model_urls?: { glb?: string }
  thumbnail_url?: string
  task_error?: { message?: string } | string
}

const MESHY_API_URL = 'https://api.meshy.ai/openapi/v2/text-to-3d'

function normalizeTask(task: MeshyTask): TextTo3DTask {
  const error = typeof task.task_error === 'string' ? task.task_error : task.task_error?.message
  return {
    id: task.id,
    status: task.status,
    progress: Math.max(0, Math.min(100, task.progress ?? 0)),
    modelUrl: task.model_urls?.glb,
    thumbnailUrl: task.thumbnail_url,
    error,
    provider: 'meshy',
  }
}

export class MeshyProvider implements TextTo3DProvider {
  constructor(private readonly apiKey: string) {}

  async createTask(input: TextTo3DRequest): Promise<TextTo3DTask> {
    const mode = input.mode ?? 'preview'
    const body = mode === 'refine'
      ? {
          mode,
          preview_task_id: input.previewTaskId,
          texture_prompt: input.texturePrompt ?? input.prompt,
        }
      : {
          mode,
          prompt: input.prompt,
          model_type: 'standard',
        }

    const task = await this.request<MeshyTask>(MESHY_API_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return normalizeTask(task)
  }

  async getTask(taskId: string): Promise<TextTo3DTask> {
    const task = await this.request<MeshyTask>(`${MESHY_API_URL}/${encodeURIComponent(taskId)}`)
    return normalizeTask(task)
  }

  async cancelTask(taskId: string): Promise<TextTo3DTask> {
    const task = await this.request<MeshyTask>(`${MESHY_API_URL}/${encodeURIComponent(taskId)}`, { method: 'DELETE' })
    return normalizeTask(task)
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const message = payload?.message ?? payload?.error?.message ?? 'Meshy request failed.'
      throw new Error(message)
    }
    return payload as T
  }
}
