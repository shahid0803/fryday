import { Canvas } from '@react-three/fiber'
import { Grid, Line, OrbitControls, TransformControls, useGLTF } from '@react-three/drei'
import { Component, Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Object3D } from 'three'
import type { SceneObject } from '../types/scene'

interface ViewportProps {
  objects: SceneObject[]
  selectedId: string
  onSelect: (objectId: string) => void
  onTransformChange?: (objectId: string, position: [number, number, number]) => void
}

// Error boundary to catch any GLTF or rendering failure inside Three.js
class ViewportErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error('Three.js Viewport error:', error)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export function Viewport({
  objects,
  selectedId,
  onSelect,
  onTransformChange,
}: ViewportProps) {
  return (
    <div className="relative w-full h-full bg-[#020406] select-none overflow-hidden">
      <Canvas
        camera={{ position: [5.5, 3.8, 7], fov: 38 }}
        shadows
        dpr={[1, 2]}
        className="w-full h-full"
      >
        <color attach="background" args={['#020406']} />
        <fog attach="fog" args={['#020406', 12, 28]} />

        {/* Cinematic Laboratory Lighting */}
        <ambientLight intensity={0.6} color="#d4e8ec" />
        <directionalLight
          castShadow
          position={[6, 9, 5]}
          intensity={1.9}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
          color="#fbf8f0"
        />
        {/* Luminous Cyan Accent Rim Light */}
        <pointLight position={[-6, 3, -5]} color="#4EEDDE" intensity={16} distance={30} />
        {/* Soft Warm Ivory Fill */}
        <pointLight position={[5, 2.5, 5]} color="#ede8df" intensity={10} distance={24} />
        {/* Floor ambient bounce */}
        <pointLight position={[0, -1.5, 0]} color="#0a1e26" intensity={5} distance={12} />

        {/* Floor / Ground Plane — offset to sit just below the scene origin */}
        <group position={[0, -0.66, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[8, 96]} />
            <meshStandardMaterial color="#030608" roughness={0.9} metalness={0.15} />
          </mesh>

          {/* Refined teal coordinate grid */}
          <Grid
            args={[16, 16]}
            cellColor="#0b1a21"
            sectionColor="#1d4d5a"
            cellThickness={0.35}
            sectionThickness={0.8}
            fadeDistance={22}
            fadeStrength={1.3}
            infiniteGrid={false}
          />
        </group>

        {/* Ambient Energy Ribbons — cinematic atmosphere, world-space */}
        <Line
          points={[
            [-5.5, 0.5, -3.2],
            [-3.2, 1.6, -2.1],
            [-0.8, 1.1, -0.5],
            [1.6, 2.0, 0.8],
            [3.8, 1.3, 2.0],
            [5.2, 0.7, 3.4],
          ]}
          color="#4EEDDE"
          lineWidth={0.9}
          transparent
          opacity={0.4}
        />
        <Line
          points={[
            [-4.8, 0.2, -2.8],
            [-2.6, 1.3, -1.6],
            [-0.2, 0.8, 0.0],
            [2.2, 1.7, 1.2],
            [4.4, 1.0, 2.5],
          ]}
          color="#00F5D4"
          lineWidth={0.4}
          transparent
          opacity={0.2}
        />

        {/* Scene Objects — rendered at their world-space positions from sceneTools.ts */}
        <ViewportErrorBoundary
          fallback={
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#e11d48" wireframe />
            </mesh>
          }
        >
          <Suspense fallback={<ModelLoadingFallback />}>
            {objects
              .filter((object) => object.visible)
              .map((object) => (
                <ModelPart
                  key={object.id}
                  object={object}
                  selected={selectedId === object.id}
                  onSelect={onSelect}
                  onTransformChange={onTransformChange}
                />
              ))}
          </Suspense>
        </ViewportErrorBoundary>

        {/* Orbit Controls with smooth damping */}
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          dampingFactor={0.07}
          minDistance={3.5}
          maxDistance={16}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0.8, 0]}
        />
      </Canvas>
    </div>
  )
}

function ModelLoadingFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial color="#4EEDDE" wireframe opacity={0.6} transparent />
    </mesh>
  )
}

interface ModelPartProps {
  object: SceneObject
  selected: boolean
  onSelect: (id: string) => void
  onTransformChange?: (id: string, position: [number, number, number]) => void
}

function ModelPart({ object, selected, onSelect, onTransformChange }: ModelPartProps) {
  const ref = useRef<Object3D>(null)
  const scaleMod = selected ? 1.03 : 1.0
  const scaledScale = object.scale.map((v) => v * scaleMod) as [number, number, number]

  return (
    <>
      <group
        ref={ref}
        position={object.position}
        rotation={object.rotation}
        scale={scaledScale}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(object.id)
        }}
      >
        {object.assetUrl ? (
          <GeneratedModel url={object.assetUrl} />
        ) : (
          renderProceduralMesh(object.id, selected)
        )}
      </group>

      {selected && (
        <TransformControls
          object={ref as React.RefObject<Object3D>}
          mode="translate"
          size={0.6}
          onMouseUp={() => {
            if (ref.current && onTransformChange) {
              const p = ref.current.position
              onTransformChange(object.id, [p.x, p.y, p.z])
            }
          }}
        />
      )}
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
    const factor = 2.4 / maxDimension
    clone.scale.setScalar(factor)
    const center = box.getCenter(new THREE.Vector3())
    clone.position.set(-center.x * factor, -center.y * factor, -center.z * factor)
    return clone
  }, [scene])
  return <primitive object={model} />
}

// ─── Procedural Bike Meshes ───────────────────────────────────────────────────
// Each case renders relative to its own local origin (the SceneObject position).
// Positions here are RELATIVE to the group center, not world-space.
function renderProceduralMesh(objectId: string, selected: boolean) {
  const accentEmissive = selected ? '#4EEDDE' : '#1a4a54'
  const accentIntensity = selected ? 0.55 : 0.18

  switch (objectId) {
    case 'frame':
      return (
        <>
          {/* Main horizontal tube */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[2.8, 0.16, 0.48]} />
            <meshStandardMaterial
              color="#dceef3"
              emissive={accentEmissive}
              emissiveIntensity={accentIntensity}
              metalness={0.82}
              roughness={0.22}
            />
          </mesh>
          {/* Front diagonal stay */}
          <mesh castShadow position={[0.55, 0.72, 0]} rotation={[0, 0, -0.58]}>
            <boxGeometry args={[1.8, 0.14, 0.42]} />
            <meshStandardMaterial
              color="#dceef3"
              emissive={accentEmissive}
              emissiveIntensity={accentIntensity}
              metalness={0.82}
              roughness={0.22}
            />
          </mesh>
          {/* Rear diagonal stay */}
          <mesh castShadow position={[-0.7, 0.72, 0]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[1.5, 0.14, 0.40]} />
            <meshStandardMaterial
              color="#dceef3"
              emissive={accentEmissive}
              emissiveIntensity={accentIntensity}
              metalness={0.82}
              roughness={0.22}
            />
          </mesh>
          {/* Seat tube vertical */}
          <mesh castShadow position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.75, 0.12, 0.32]} />
            <meshStandardMaterial
              color="#dceef3"
              emissive={accentEmissive}
              emissiveIntensity={accentIntensity}
              metalness={0.82}
              roughness={0.22}
            />
          </mesh>
        </>
      )

    case 'front-wheel':
    case 'rear-wheel':
      return (
        <>
          {/* Tyre ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.78, 0.155, 24, 64]} />
            <meshStandardMaterial
              color={selected ? '#0d1c22' : '#080d10'}
              emissive={selected ? '#4EEDDE' : '#0a1e28'}
              emissiveIntensity={selected ? 0.4 : 0.1}
              metalness={0.35}
              roughness={0.78}
            />
          </mesh>
          {/* Metallic hub axle */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.22, 16]} />
            <meshStandardMaterial
              color="#dff7ff"
              emissive="#4EEDDE"
              emissiveIntensity={0.4}
              metalness={0.92}
              roughness={0.12}
            />
          </mesh>
          {/* Spoke disc suggestion */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.03, 32]} />
            <meshStandardMaterial
              color="#0d1e26"
              emissive="#1c4a5a"
              emissiveIntensity={0.3}
              metalness={0.6}
              roughness={0.4}
              transparent
              opacity={0.6}
            />
          </mesh>
        </>
      )

    case 'handlebar':
      return (
        <>
          <mesh castShadow>
            <boxGeometry args={[0.92, 0.1, 0.08]} />
            <meshStandardMaterial
              color="#eaf3f5"
              emissive={accentEmissive}
              emissiveIntensity={accentIntensity}
              metalness={0.88}
              roughness={0.18}
            />
          </mesh>
          <mesh castShadow position={[0.38, 0.1, 0]}>
            <boxGeometry args={[0.18, 0.5, 0.08]} />
            <meshStandardMaterial
              color="#eaf3f5"
              emissive={accentEmissive}
              emissiveIntensity={accentIntensity * 0.7}
              metalness={0.88}
              roughness={0.18}
            />
          </mesh>
        </>
      )

    case 'seat':
      return (
        <>
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.74, 0.1, 0.36]} />
            <meshStandardMaterial
              color="#111820"
              emissive={selected ? '#4EEDDE' : '#000'}
              emissiveIntensity={selected ? 0.25 : 0}
              metalness={0.2}
              roughness={0.75}
            />
          </mesh>
          <mesh castShadow position={[0.05, -0.32, 0]}>
            <boxGeometry args={[0.09, 0.65, 0.09]} />
            <meshStandardMaterial color="#c8e4ed" metalness={0.9} roughness={0.14} />
          </mesh>
        </>
      )

    case 'pedals':
      return (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.13, 24]} />
            <meshStandardMaterial
              color="#b8d8e3"
              emissive="#4EEDDE"
              emissiveIntensity={selected ? 0.4 : 0.18}
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          <mesh castShadow position={[0, 0.08, 0.22]}>
            <boxGeometry args={[0.68, 0.055, 0.08]} />
            <meshStandardMaterial color="#b8d8e3" metalness={0.85} roughness={0.22} />
          </mesh>
        </>
      )

    case 'chain':
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.45, 0.048, 12, 40]} />
          <meshStandardMaterial
            color="#4EEDDE"
            emissive="#4EEDDE"
            emissiveIntensity={selected ? 0.65 : 0.42}
            metalness={0.9}
            roughness={0.14}
          />
        </mesh>
      )

    case 'engine':
      return (
        <>
          <mesh castShadow position={[0, 0.24, 0]}>
            <boxGeometry args={[0.78, 0.46, 0.44]} />
            <meshStandardMaterial
              color="#0a161c"
              emissive="#4EEDDE"
              emissiveIntensity={selected ? 0.55 : 0.38}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          <mesh castShadow position={[0.6, 0.0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.4, 24]} />
            <meshStandardMaterial
              color="#c5eaf5"
              emissive="#4EEDDE"
              emissiveIntensity={0.3}
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
        </>
      )

    default:
      return (
        <mesh castShadow>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#4EEDDE" wireframe />
        </mesh>
      )
  }
}
