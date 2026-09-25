import type { GenerationState } from '../types/scene'

type GenerationTask = {
  id: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'
  progress: number
  modelUrl?: string
  thumbnailUrl?: string
  error?: string
}

export type GeneratedAsset = {
  id: string
  name: string
  prompt: string
  modelUrl: string
  thumbnailUrl?: string
}

export type GenerationListener = (state: GenerationState) => void

function isTask(value: unknown): value is GenerationTask {
  if (!value || typeof value !== 'object') return false
  const task = value as Partial<GenerationTask>
  return typeof task.id === 'string'
    && typeof task.progress === 'number'
    && ['PENDING', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'CANCELED'].includes(task.status ?? '')
}

export async function generate3DModel(prompt: string, onState: GenerationListener): Promise<GeneratedAsset> {
  onState({ status: 'GENERATING', progress: 0, prompt })
  const response = await fetch('/api/3d/text-to-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const payload = (await response.json().catch(() => null)) as { task?: unknown; error?: string } | null
  if (!response.ok || !payload || !isTask(payload.task)) throw new Error(payload?.error ?? 'Unable to start 3D generation.')

  let task = payload.task
  onState({ status: 'GENERATING', progress: task.progress, prompt, taskId: task.id })
  while (task.status === 'PENDING' || task.status === 'IN_PROGRESS') {
    await new Promise((resolve) => window.setTimeout(resolve, 2500))
    const statusResponse = await fetch(`/api/3d/tasks/${encodeURIComponent(task.id)}`)
    const statusPayload = (await statusResponse.json().catch(() => null)) as { task?: unknown; error?: string } | null
    if (!statusResponse.ok || !statusPayload || !isTask(statusPayload.task)) throw new Error(statusPayload?.error ?? 'Unable to read generation progress.')
    task = statusPayload.task
    onState({ status: 'GENERATING', progress: task.progress, prompt, taskId: task.id })
  }

  if (task.status !== 'SUCCEEDED' || !task.modelUrl) {
    const error = task.error ?? `Generation ${task.status.toLowerCase()}.`
    onState({ status: task.status === 'CANCELED' ? 'CANCELED' : 'ERROR', progress: task.progress, prompt, taskId: task.id, error })
    throw new Error(error)
  }

  const asset = {
    id: `generated-${task.id}`,
    name: prompt.length > 32 ? `${prompt.slice(0, 32)}...` : prompt,
    prompt,
    modelUrl: task.modelUrl,
    thumbnailUrl: task.thumbnailUrl,
  }
  onState({ status: 'READY', progress: 100, prompt, taskId: task.id })
  return asset
}
