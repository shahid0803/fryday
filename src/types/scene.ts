export type ConnectionState =
  | 'OFFLINE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'LISTENING'
  | 'THINKING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'DISCONNECTED'
  | 'ERROR'

export type SceneObject = {
  id: string
  name: string
  type: string
  visible: boolean
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
}

export type SceneSnapshot = {
  scene: string
  selectedId: string
  objects: SceneObject[]
}

export type SceneState = {
  scene: string
  selectedId: string
  objects: SceneObject[]
  history: SceneSnapshot[]
}

export type ToolArgumentRecord = Record<string, unknown>

export type ToolDefinition = {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<
      string,
      {
        type: string
        description?: string
        items?: { type: string }
        minItems?: number
        maxItems?: number
      }
    >
    required: string[]
  }
}

export type ToolResult = {
  success: boolean
  action?: string
  objectId?: string
  message?: string
  error?: string
  details?: Record<string, unknown>
}

export type TranscriptMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  status?: 'partial' | 'final'
}
