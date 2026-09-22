import { useEffect, useMemo, useRef, useState } from 'react'

import { RealtimeAIClient } from './ai/realtimeClient'
import { AssistantFeed } from './components/AssistantFeed'
import { CinematicIntro } from './components/CinematicIntro'
import { CommandBar } from './components/CommandBar'
import { GenerationProgress } from './components/GenerationProgress'
import { SceneHierarchy } from './components/SceneHierarchy'
import { TelemetryOverlay } from './components/TelemetryOverlay'
import { TopBar } from './components/TopBar'
import { Viewport } from './components/Viewport'
import { applySceneTool, createInitialScene } from './scene/sceneTools'
import type { ConnectionState, GenerationState, SceneState, TranscriptMessage } from './types/scene'
import './App.css'

export default function App() {
  const [scene, setScene] = useState<SceneState>(() => createInitialScene())
  const [status, setStatus] = useState<ConnectionState>('OFFLINE')
  const [generation, setGeneration] = useState<GenerationState>({ status: 'IDLE', progress: 0 })
  const [activeTab, setActiveTab] = useState<string>('WORKSPACE')
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  // Cinematic intro: bypass if previously seen in this browser
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !localStorage.getItem('fryday_intro_seen')
    } catch {
      return true
    }
  })

  const [transcript, setTranscript] = useState<TranscriptMessage[]>([
    {
      id: 'sys-welcome',
      role: 'assistant',
      text: 'FRYDAY Neural Laboratory active. Geometric scene context loaded.',
      status: 'final',
    },
  ])

  const clientRef = useRef<RealtimeAIClient | null>(null)

  useEffect(() => {
    const client = new RealtimeAIClient()
    client.onStatus(setStatus)
    client.onTranscript(setTranscript)
    client.onScene(setScene)
    client.onGeneration(setGeneration)
    void client.connect()
    clientRef.current = client

    return () => {
      client.stopListening()
    }
  }, [])

  const handleIntroComplete = () => {
    setShowIntro(false)
    try {
      localStorage.setItem('fryday_intro_seen', 'true')
    } catch {
      // Ignore localStorage exceptions in private browsing
    }
  }

  const handleReplayIntro = () => {
    setShowIntro(true)
  }

  const handleSelectObject = (objectId: string) => {
    setScene((prev) => ({ ...prev, selectedId: objectId }))
  }

  // Toggle visibility directly updates scene state & history (resolves Bug C)
  const handleToggleVisibility = (objectId: string, currentVisible: boolean) => {
    const action = currentVisible ? 'hideObject' : 'showObject'
    const outcome = applySceneTool(scene, action, { objectId })
    setScene(outcome.scene)
  }

  // Transform controls movement commits to scene state (resolves Bug B)
  const handleTransformChange = (objectId: string, position: [number, number, number]) => {
    const outcome = applySceneTool(scene, 'moveObject', { objectId, position })
    setScene(outcome.scene)
  }

  const handleCommandSend = async (text: string) => {
    if (!clientRef.current || !text.trim()) return
    await clientRef.current.sendText(text.trim(), scene, setScene)
  }

  const handleToggleVoice = async () => {
    if (!clientRef.current) return
    if (status === 'LISTENING') {
      clientRef.current.stopListening()
      return
    }
    await clientRef.current.startListening()
  }

  const selectedObject = useMemo(() => {
    return scene.objects.find((obj) => obj.id === scene.selectedId)
  }, [scene.objects, scene.selectedId])

  return (
    <div className="fryday-shell">
      {/* Cinematic Prologue Sequence */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      {/* Atmospheric Glow & Grain Overlays */}
      <div className="fryday-glow-overlay" aria-hidden="true" />
      <div className="fryday-grain" aria-hidden="true" />

      {/* Minimal Top Bar */}
      <TopBar
        status={status}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        onReplayIntro={handleReplayIntro}
      />

      {/* Main Laboratory Workspace */}
      <div className="workspace-grid">
        {/* Left Scene Hierarchy Panel */}
        <div className={`left-panel-drawer ${leftPanelOpen ? 'open' : ''} md:relative md:block`}>
          <SceneHierarchy
            sceneName={scene.scene}
            objects={scene.objects}
            selectedId={scene.selectedId}
            onSelect={handleSelectObject}
            onToggleVisibility={handleToggleVisibility}
          />
        </div>

        {/* Center 3D Viewport — The Centerpiece */}
        <main className="relative w-full h-full min-h-0 overflow-hidden" aria-label="3D Canvas Viewport">
          <Viewport
            objects={scene.objects}
            selectedId={scene.selectedId}
            onSelect={handleSelectObject}
            onTransformChange={handleTransformChange}
          />

          {/* Viewport Telemetry HUD */}
          <TelemetryOverlay
            selectedObject={selectedObject}
            totalObjects={scene.objects.length}
          />

          {/* 3D Generation Progress Overlay */}
          <GenerationProgress generation={generation} />

          {/* Floating Command Bar at Bottom of Viewport */}
          <div className="command-dock">
            <CommandBar
              status={status}
              onSend={handleCommandSend}
              onToggleVoice={handleToggleVoice}
              isExecuting={status === 'EXECUTING' || status === 'THINKING'}
            />
          </div>
        </main>

        {/* Right AI Assistant Panel */}
        <div className={`right-panel-drawer ${rightPanelOpen ? 'open' : ''} md:relative md:block`}>
          <AssistantFeed
            transcript={transcript}
            status={status}
          />
        </div>
      </div>
    </div>
  )
}
