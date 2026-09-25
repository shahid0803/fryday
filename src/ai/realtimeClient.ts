import { parseTextCommand } from './realtimeTools'
import { generate3DModel } from './generationClient'
import { executeSceneCommand, createInitialScene } from '../scene/sceneTools'
import type { ConnectionState, GenerationState, SceneState, TranscriptMessage } from '../types/scene'

export type RealtimeClientListener<T> = (value: T) => void

export class RealtimeAIClient {
  private transcript: TranscriptMessage[] = []
  private status: ConnectionState = 'OFFLINE'
  private onStatusChange: RealtimeClientListener<ConnectionState> | null = null
  private onTranscriptChange: RealtimeClientListener<TranscriptMessage[]> | null = null
  private onSceneChange: RealtimeClientListener<SceneState> | null = null
  private onGenerationChange: RealtimeClientListener<GenerationState> | null = null
  private micStream: MediaStream | null = null

  onStatus(listener: RealtimeClientListener<ConnectionState>): void {
    this.onStatusChange = listener
  }

  onTranscript(listener: RealtimeClientListener<TranscriptMessage[]>): void {
    this.onTranscriptChange = listener
  }

  onScene(listener: RealtimeClientListener<SceneState>): void {
    this.onSceneChange = listener
  }

  onGeneration(listener: RealtimeClientListener<GenerationState>): void {
    this.onGenerationChange = listener
  }

  public get currentStatus(): ConnectionState {
    return this.status
  }

  async connect(): Promise<void> {
    this.setStatus('CONNECTING')

    try {
      const response = await fetch('/api/realtime/session', { method: 'POST' })
      const payload = (await response.json()) as {
        ok?: boolean
        mode?: 'mock' | 'realtime' | 'error'
        message?: string
        session?: unknown
        error?: string
      }

      if (!response.ok || payload.mode === 'error') {
        this.addAssistantMessage('Unable to reach the realtime service. Local fallback is active.')
        this.setStatus('CONNECTED')
        return
      }

      if (payload.mode === 'mock' || !payload.session) {
        this.addAssistantMessage(payload.message ?? 'Local AI ready.')
        this.setStatus('CONNECTED')
        return
      }

      this.addAssistantMessage('Realtime service connected.')
      this.setStatus('CONNECTED')
    } catch {
      this.addAssistantMessage('Local neural engine ready. Workspace active.')
      this.setStatus('CONNECTED')
    }
  }

  async startListening(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.setStatus('ERROR')
      this.addAssistantMessage('Microphone access is not available in this browser.')
      return
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.setStatus('LISTENING')
      this.addAssistantMessage('Listening for voice commands.')
    } catch {
      this.setStatus('ERROR')
      this.addAssistantMessage('Microphone access is required for voice control.')
    }
  }

  stopListening(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop())
      this.micStream = null
    }

    if (this.status === 'LISTENING') {
      this.setStatus('CONNECTED')
    }
  }

  async sendText(text: string, updateScene: (updater: (scene: SceneState) => SceneState) => void): Promise<void> {
    this.addUserMessage(text)
    this.setStatus('THINKING')

    await new Promise((resolve) => window.setTimeout(resolve, 160))

    if (/^(create|generate|make|build)\b/.test(text.trim().toLowerCase()) && /(3d|model|asset|bike|vehicle|chair|lamp|helmet)/.test(text.toLowerCase())) {
      try {
        this.setStatus('EXECUTING')
        const asset = await generate3DModel(text.trim(), (state) => {
          this.onGenerationChange?.(state)
          this.setStatus(state.status === 'GENERATING' ? 'EXECUTING' : 'CONNECTED')
        })
        let nextScene: SceneState | undefined
        updateScene((current) => {
          nextScene = executeSceneCommand(current, {
            type: 'insertGeneratedAsset',
            asset: {
              id: asset.id,
              name: asset.name,
              modelUrl: asset.modelUrl,
              thumbnailUrl: asset.thumbnailUrl,
              position: [0, 0.8, 0],
              scale: [1, 1, 1],
            },
          }).scene
          return nextScene
        })
        if (nextScene) this.onSceneChange?.(nextScene)
        this.addAssistantMessage(`${asset.name} is ready and added to the scene.`)
      } catch (error) {
        this.setStatus('ERROR')
        this.addAssistantMessage(error instanceof Error ? error.message : '3D generation failed.')
        this.setStatus('CONNECTED')
      }
      return
    }

    let result: ReturnType<typeof parseTextCommand> | undefined
    updateScene((current) => {
      result = parseTextCommand(text, current)
      return result.scene
    })
    this.setStatus('EXECUTING')

    if (!result || !result.result.success) {
      this.setStatus('ERROR')
      const message = result?.result.error ?? 'Unsupported command.'
      this.addAssistantMessage(message)
      this.setStatus('CONNECTED')
      return
    }

    this.onSceneChange?.(result.scene)
    const responseText = result.result.message ?? 'Command executed.'
    this.addAssistantMessage(responseText)
    this.setStatus('CONNECTED')
  }

  private addUserMessage(text: string): void {
    this.transcript = [
      ...this.transcript,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        status: 'final',
      },
    ]
    this.onTranscriptChange?.(this.transcript)
  }

  private addAssistantMessage(text: string): void {
    this.transcript = [
      ...this.transcript,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text,
        status: 'final',
      },
    ]
    this.onTranscriptChange?.(this.transcript)
  }

  private setStatus(status: ConnectionState): void {
    this.status = status
    this.onStatusChange?.(status)
  }
}

export function createRealtimeClient(): RealtimeAIClient {
  return new RealtimeAIClient()
}

export function createMockInitialScene(): SceneState {
  return createInitialScene()
}
