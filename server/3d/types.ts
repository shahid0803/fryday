export type TextTo3DRequest = {
  prompt: string
  mode?: 'preview' | 'refine'
  previewTaskId?: string
  texturePrompt?: string
}

export type TextTo3DTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'

export type TextTo3DTask = {
  id: string
  status: TextTo3DTaskStatus
  progress: number
  modelUrl?: string
  thumbnailUrl?: string
  error?: string
  provider: string
}

export interface TextTo3DProvider {
  createTask(input: TextTo3DRequest): Promise<TextTo3DTask>
  getTask(taskId: string): Promise<TextTo3DTask>
  cancelTask(taskId: string): Promise<TextTo3DTask>
}
