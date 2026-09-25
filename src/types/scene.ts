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
  rotation: [number, number, number]
  scale: [number, number, number]
  parentId?: string
  metadata?: Record<string, unknown>
  assetUrl?: string
  thumbnailUrl?: string
  generated?: boolean
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

export type SceneCommand =
  | { type: 'selectObject'; objectId: string }
  | { type: 'moveObject'; objectId: string; position: [number, number, number] }
  | { type: 'rotateObject'; objectId: string; rotation: [number, number, number] }
  | { type: 'scaleObject'; objectId: string; scale: [number, number, number] }
  | {
      type: 'setTransform'
      objectId: string
      position?: [number, number, number]
      rotation?: [number, number, number]
      scale?: [number, number, number]
    }
  | { type: 'hideObject'; objectId: string }
  | { type: 'showObject'; objectId: string }
  | { type: 'removeObject'; objectId: string }
  | { type: 'hideObjects'; objectIds: string[] }
  | { type: 'showObjects'; objectIds: string[] }
  | { type: 'removeObjects'; objectIds: string[] }
  | {
      type: 'createObject'
      objectId: string
      name: string
      objectType?: string
      position?: [number, number, number]
      rotation?: [number, number, number]
      scale?: [number, number, number]
      parentId?: string
      metadata?: Record<string, unknown>
      assetUrl?: string
      thumbnailUrl?: string
      generated?: boolean
    }
  | {
      type: 'insertGeneratedAsset'
      asset: {
        id: string
        name: string
        modelUrl: string
        thumbnailUrl?: string
        position?: [number, number, number]
        rotation?: [number, number, number]
        scale?: [number, number, number]
      }
    }
  | { type: 'resetScene' }
  | { type: 'undoScene' }

export type SceneContextObject = {
  id: string
  name: string
  type: string
  visible: boolean
  parentId?: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  metadata?: Record<string, unknown>
}

export type SceneContext = {
  scene: string
  selectedId: string
  objects: SceneContextObject[]
  objectCount: number
  visibleCount: number
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
  objectIds?: string[]
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

export type GenerationState = {
  status: 'IDLE' | 'GENERATING' | 'READY' | 'ERROR' | 'CANCELED'
  taskId?: string
  progress: number
  prompt?: string
  error?: string
}
