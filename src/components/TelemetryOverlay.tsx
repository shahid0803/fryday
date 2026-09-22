import type { SceneObject } from '../types/scene'

interface TelemetryOverlayProps {
  selectedObject?: SceneObject
  totalObjects: number
}

export function TelemetryOverlay({ selectedObject, totalObjects }: TelemetryOverlayProps) {
  const pos = selectedObject?.position ?? [0, 0, 0]
  const scale = selectedObject?.scale ?? [1, 1, 1]

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none z-10">
      {/* Top HUD Row */}
      <div className="flex items-start justify-between">
        {/* Top-Left: Camera / Lens info */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-[#4EEDDE]" />
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#9E9A91] uppercase">
              PERSPECTIVE // 38° FOV
            </span>
          </div>
          <span className="font-mono text-[8.5px] tracking-[0.16em] text-[#5A564F]">
            ORBIT CONTROLS ACTIVE
          </span>
        </div>

        {/* Top-Right: Selected object telemetry — no overlap since assistant is right-panel */}
        {selectedObject && (
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#4EEDDE] uppercase">
              ACTIVE: {selectedObject.name}
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.15em] text-[#9E9A91]">
              POS [{pos[0].toFixed(2)}, {pos[1].toFixed(2)}, {pos[2].toFixed(2)}]
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.15em] text-[#5A564F]">
              SCL [{scale[0].toFixed(2)}, {scale[1].toFixed(2)}, {scale[2].toFixed(2)}]
            </span>
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
