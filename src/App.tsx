import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, TransformControls, useGLTF } from '@react-three/drei'
import { ArrowUpRight, BellDot, Command, Cpu, Eye, EyeOff, Gauge, Layers3, Move3d, Settings, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Object3D } from 'three'

import { RealtimeAIClient } from './ai/realtimeClient'
import { AssistantPanel } from './components/AssistantPanel'
import { VoiceButton } from './components/VoiceButton'
import { createInitialScene } from './scene/sceneTools'
import type { ConnectionState, GenerationState, TranscriptMessage } from './types/scene'
import './App.css'

const APP_NAME = 'NOVA'

function App() {
  const [scene, setScene] = useState(() => createInitialScene())
  const [status, setStatus] = useState<ConnectionState>('OFFLINE')
  const [generation, setGeneration] = useState<GenerationState>({ status: 'IDLE', progress: 0 })
  const [draft, setDraft] = useState('Remove the rear wheel.')
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([
    {
      id: 'assistant-init',
      role: 'assistant',
      text: 'Local AI ready. I can help refine the bike geometry.',
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

  const handleVoiceToggle = async () => {
    if (!clientRef.current) return

    if (status === 'LISTENING') {
      clientRef.current.stopListening()
      return
    }

    await clientRef.current.startListening()
  }

  const handleCommandExecute = async () => {
    if (!clientRef.current || !draft.trim()) return
    await clientRef.current.sendText(draft.trim(), scene, setScene)
  }

  const visibleObjects = useMemo(() => scene.objects.filter((object) => object.visible), [scene])

  return (
    <div className="app-shell">
      <div className="grain-overlay" aria-hidden="true" />

      <header className="topbar panel-surface">
        <div className="brand-block">
          <div className="brand-mark">N</div>
          <div className="brand-copy">
            <div className="brand-wordmark">{APP_NAME}</div>
            <div className="system-status">
              <span className="status-dot" />
              {status === 'ERROR' ? 'REALTIME ERROR' : 'REALTIME ONLINE'}
            </div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <button type="button" className="nav-link active">WORKSPACE</button>
          <button type="button" className="nav-link">PROJECTS</button>
          <button type="button" className="nav-link">ASSETS</button>
          <button type="button" className="nav-link">HISTORY</button>
        </nav>

        <button type="button" className="settings-button" aria-label="Settings">
          <Settings size={14} />
        </button>
      </header>

      <div className="main-grid">
        <aside className="scene-panel panel-surface">
          <div className="panel-header-row">
            <span className="panel-label">SCENE</span>
            <button type="button" className="header-action">
              <BellDot size={12} />
            </button>
          </div>

          <div className="scene-tree">
            {visibleObjects.map((object) => (
              <SceneNodeRow
                key={object.id}
                object={object}
                selected={scene.selectedId === object.id}
                onSelect={(objectId) => {
                  setScene((current) => ({ ...current, selectedId: objectId }))
                }}
              />
            ))}
          </div>
        </aside>

        <main className="viewport-panel panel-surface">
          <div className="viewport-toolbar">
            <div className="toolbar-group">
              <span className="toolbar-tag">AERIAL</span>
              <span className="toolbar-tag muted">ISOMETRIC</span>
            </div>
            <div className="toolbar-group compact">
              <button type="button" className="ghost-chip">
                <Sparkles size={12} />
                LIVE
              </button>
              <button type="button" className="ghost-chip emphasis">
                <ArrowUpRight size={12} />
                EXPORT
              </button>
            </div>
          </div>

          <div className="viewport-shell">
            <SceneViewport scene={scene} selectedObject={scene.selectedId} onSelect={(objectId) => setScene((current) => ({ ...current, selectedId: objectId }))} />
            <div className="viewport-overlay">
              <div className="viewport-status">
                <span className="status-dot" />
                {status === 'LISTENING' ? 'LISTENING' : 'SCENE STABLE'}
              </div>
              <div className="viewport-pill">SELECTED: {scene.selectedId.toUpperCase()}</div>
            </div>
            {generation.status === 'GENERATING' && (
              <div className="generation-overlay">
                <Sparkles size={14} />
                <div>
                  <strong>GENERATING 3D MODEL</strong>
                  <span>{generation.prompt ?? 'Preparing asset'} · {generation.progress}%</span>
                </div>
                <div className="generation-progress"><span style={{ width: `${generation.progress}%` }} /></div>
              </div>
            )}
          </div>
        </main>

        <aside className="assistant-panel">
          <AssistantPanel transcript={transcript} />
        </aside>
      </div>

      <footer className="command-bar panel-surface">
        <VoiceButton status={status} onToggle={handleVoiceToggle} />

        <div className="command-prompt" aria-label="Command input">
          <Command size={14} />
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleCommandExecute()
              }
            }}
            aria-label="Command text"
          />
        </div>

        <button type="button" className="execute-button" onClick={() => void handleCommandExecute()}>
          EXECUTE
        </button>
      </footer>
    </div>
  )
}

function SceneNodeRow({
  object,
  selected,
  onSelect,
}: {
  object: { id: string; name: string; visible: boolean }
  selected: boolean
  onSelect: (objectId: string) => void
}) {
  return (
    <div className="scene-branch">
      <button type="button" className={`scene-node ${selected ? 'selected' : ''}`} onClick={() => onSelect(object.id)}>
        <span className="scene-node-icon">
          {renderObjectIcon(object.id)}
        </span>
        <span className="scene-node-label">{object.name}</span>
        <span className="scene-node-visibility">{object.visible ? <Eye size={10} /> : <EyeOff size={10} />}</span>
      </button>
    </div>
  )
}

function renderObjectIcon(objectId: string) {
  switch (objectId) {
    case 'frame':
      return <Layers3 size={12} />
    case 'front-wheel':
    case 'rear-wheel':
      return <Move3d size={12} />
    case 'handlebar':
      return <Sparkles size={12} />
    case 'seat':
    case 'pedals':
      return <Gauge size={12} />
    case 'chain':
    case 'engine':
      return <Cpu size={12} />
    default:
      return <Layers3 size={12} />
  }
}

function SceneViewport({
  scene,
  selectedObject,
  onSelect,
}: {
  scene: ReturnType<typeof createInitialScene>
  selectedObject: string
  onSelect: (objectId: string) => void
}) {
  return (
    <Canvas camera={{ position: [6, 4.5, 7], fov: 38 }} shadows dpr={[1, 1.8]} className="viewport-canvas">
      <color attach="background" args={['#070d12']} />
      <fog attach="fog" args={['#070d12', 9, 22]} />
      <ambientLight intensity={0.8} />
      <directionalLight castShadow position={[7, 8, 5]} intensity={1.9} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-5, 2.5, -4]} color="#7ae7ff" intensity={18} distance={30} />
      <pointLight position={[4, 3, 5]} color="#8be7bd" intensity={12} distance={24} />

      <group rotation={[0, 0.7, 0]} position={[0, -0.8, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]} receiveShadow>
          <circleGeometry args={[6, 80]} />
          <meshStandardMaterial color="#061014" roughness={0.9} metalness={0.15} />
        </mesh>

        <Grid args={[12, 12]} cellColor="#18363d" sectionColor="#79f1ff" cellThickness={0.5} sectionThickness={1.1} fadeDistance={26} fadeStrength={1.1} infiniteGrid={false} position={[0, -0.63, 0]} />

        <Line points={[[-4, 0.9, -2.5], [-2.2, 1.9, -1.5], [0, 1.6, 0], [2.4, 2.1, 1.2], [4.2, 1.3, 2.2]]} color="#79f1ff" lineWidth={0.8} transparent opacity={0.55} />

        {scene.objects
          .filter((object) => object.visible)
          .map((object) => (
            <ModelPart
              key={object.id}
              object={object}
              selected={selectedObject === object.id}
              onSelect={onSelect}
            />
          ))}
      </group>

      <OrbitControls enablePan enableZoom enableRotate minDistance={4} maxDistance={12} maxPolarAngle={Math.PI / 2.2} />
    </Canvas>
  )
}

function ModelPart({
  object,
  selected,
  onSelect,
}: {
  object: ReturnType<typeof createInitialScene>['objects'][number]
  selected: boolean
  onSelect: (value: string) => void
}) {
  const ref = useRef<Object3D>(null)

  return (
    <>
      <group
        ref={ref}
        position={object.position}
        rotation={object.rotation}
        scale={selected ? (object.scale.map((value) => value * 1.04) as [number, number, number]) : object.scale}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(object.id)
        }}
      >
        {object.assetUrl ? <GeneratedModel url={object.assetUrl} /> : renderObjectMesh(object)}
      </group>
      {selected && <TransformControls object={ref as React.RefObject<Object3D>} mode="translate" size={0.7} />}
    </>
  )
}

function GeneratedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
    const factor = 2.5 / maxDimension
    clone.scale.setScalar(factor)
    const center = box.getCenter(new THREE.Vector3())
    clone.position.set(-center.x * factor, -center.y * factor, -center.z * factor)
    return clone
  }, [scene])
  return <primitive object={model} />
}

function renderObjectMesh(object: ReturnType<typeof createInitialScene>['objects'][number]) {
  switch (object.id) {
    case 'frame':
      return (
        <>
          <mesh castShadow position={[0, 0.28, 0]}>
            <boxGeometry args={[2.8, 0.16, 0.5]} />
            <meshStandardMaterial color="#d9f3fb" emissive="#74f0ff" emissiveIntensity={0.35} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0.55, 1, 0]} rotation={[0, 0, -0.58]}>
            <boxGeometry args={[1.8, 0.14, 0.44]} />
            <meshStandardMaterial color="#d9f3fb" emissive="#74f0ff" emissiveIntensity={0.25} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[-0.7, 1.1, 0]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[1.5, 0.15, 0.42]} />
            <meshStandardMaterial color="#d9f3fb" emissive="#74f0ff" emissiveIntensity={0.25} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.8, 0.12, 0.34]} />
            <meshStandardMaterial color="#d9f3fb" emissive="#74f0ff" emissiveIntensity={0.2} metalness={0.8} roughness={0.25} />
          </mesh>
        </>
      )
    case 'front-wheel':
    case 'rear-wheel':
      return (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.78, 0.16, 24, 64]} />
            <meshStandardMaterial color="#b7d8de" emissive="#75d6ff" emissiveIntensity={0.18} metalness={0.75} roughness={0.2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.18, 16]} />
            <meshStandardMaterial color="#dff7ff" emissive="#8feaff" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )
    case 'handlebar':
      return (
        <>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.12, 0.08]} />
            <meshStandardMaterial color="#d9f3fb" emissive="#74f0ff" emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh castShadow position={[0.38, 0.08, 0]}>
            <boxGeometry args={[0.2, 0.5, 0.08]} />
            <meshStandardMaterial color="#d9f3fb" emissive="#74f0ff" emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )
    case 'seat':
      return (
        <>
          <mesh castShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[0.72, 0.12, 0.38]} />
            <meshStandardMaterial color="#b9e9ff" emissive="#67d8ff" emissiveIntensity={0.3} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0.05, -0.35, 0]}>
            <boxGeometry args={[0.12, 0.7, 0.12]} />
            <meshStandardMaterial color="#d7eff6" emissive="#74f0ff" emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
          </mesh>
        </>
      )
    case 'pedals':
      return (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.14, 24]} />
            <meshStandardMaterial color="#d0f1ff" emissive="#74f0ff" emissiveIntensity={0.2} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh castShadow position={[0, 0.08, 0.22]}>
            <boxGeometry args={[0.7, 0.06, 0.08]} />
            <meshStandardMaterial color="#d0f1ff" emissive="#74f0ff" emissiveIntensity={0.2} metalness={0.7} roughness={0.2} />
          </mesh>
        </>
      )
    case 'chain':
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.46, 0.06, 12, 40]} />
          <meshStandardMaterial color="#8de7ff" emissive="#5de5ff" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
        </mesh>
      )
    case 'engine':
      return (
        <>
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[0.75, 0.45, 0.45]} />
            <meshStandardMaterial color="#dfeef4" emissive="#7ae7ff" emissiveIntensity={0.3} metalness={0.75} roughness={0.2} />
          </mesh>
          <mesh castShadow position={[0.6, 0.3, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.4, 24]} />
            <meshStandardMaterial color="#dfeef4" emissive="#7ae7ff" emissiveIntensity={0.25} metalness={0.7} roughness={0.2} />
          </mesh>
        </>
      )
    default:
      return null
  }
}

export default App
