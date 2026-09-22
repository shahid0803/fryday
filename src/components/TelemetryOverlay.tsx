import type { SceneObject } from '../types/scene'

interface TelemetryOverlayProps {
  selectedObject?: SceneObject
  totalObjects: number
  transformMode?: 'translate' | 'rotate' | 'scale'
  onSetTransformMode?: (mode: 'translate' | 'rotate' | 'scale') => void
}

export function TelemetryOverlay({
  selectedObject,
  totalObjects,
  transformMode = 'translate',
  onSetTransformMode,
}: TelemetryOverlayProps) {
  const pos = selectedObject?.position ?? [0, 0, 0]
  const rot = selectedObject?.rotation ?? [0, 0, 0]
  const scale = selectedObject?.scale ?? [1, 1, 1]

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none z-10">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between">
        {/* Top-Left: Camera / Lens info & Transform Mode selector */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-[#4EEDDE]" />
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#9E9A91] uppercase">
              PERSPECTIVE // 38° FOV
            </span>
          </div>

          {/* Interactive Transform Mode Selector */}
          <div className="flex items-center gap-1 pointer-events-auto">
            {(['translate', 'rotate', 'scale'] as const).map((mode) => {
              const isActive = transformMode === mode
              const keyLabel = mode === 'translate' ? 'W' : mode === 'rotate' ? 'E' : 'R'
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onSetTransformMode?.(mode)}
                  className={`font-mono text-[8px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-sm border transition-all ${
                    isActive
                      ? 'border-[#4EEDDE] text-[#4EEDDE] bg-[#4EEDDE]/10 shadow-[0_0_8px_rgba(78,237,222,0.3)]'
                      : 'border-white/10 text-[#9E9A91] hover:text-[#F5F2EB] hover:border-white/20 bg-black/40'
                  }`}
                  title={`Switch to ${mode} mode (Hotkey: ${keyLabel})`}
                  aria-label={`${mode} mode`}
                >
                  {keyLabel}:{mode.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Top-Right: Selected object telemetry */}
        {selectedObject && (
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#4EEDDE] uppercase font-medium">
              ACTIVE: {selectedObject.name}
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.15em] text-[#9E9A91]">
              POS [{pos[0].toFixed(2)}, {pos[1].toFixed(2)}, {pos[2].toFixed(2)}]
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.15em] text-[#5A564F]">
              ROT [{rot[0].toFixed(2)}, {rot[1].toFixed(2)}, {rot[2].toFixed(2)}]
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.15em] text-[#5A564F]">
              SCL [{scale[0].toFixed(2)}, {scale[1].toFixed(2)}, {scale[2].toFixed(2)}]
            </span>
            {selectedObject.parentId && (
              <span className="font-mono text-[8px] tracking-[0.15em] text-[#5A564F]">
                PARENT: {selectedObject.parentId.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom HUD Row */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[8.5px] tracking-[0.2em] text-[#5A564F] uppercase">
            STAGE: 16M GRID
          </span>
          <span className="font-mono text-[8.5px] tracking-[0.2em] text-[#5A564F] uppercase">
            ENTITIES: {totalObjects}
          </span>
        </div>
        <div className="font-mono text-[8.5px] tracking-[0.2em] text-[#5A564F] uppercase">
          RENDER: R3F WEBGL2
        </div>
      </div>
    </div>
  )
}
