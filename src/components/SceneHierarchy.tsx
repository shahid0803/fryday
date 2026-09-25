import { Eye, EyeOff, Layers, Sparkles } from 'lucide-react'
import type { SceneObject } from '../types/scene'

interface SceneHierarchyProps {
  sceneName: string
  objects: SceneObject[]
  selectedId: string
  onSelect: (objectId: string) => void
  onToggleVisibility: (objectId: string, currentVisible: boolean) => void
}

export function SceneHierarchy({
  sceneName,
  objects,
  selectedId,
  onSelect,
  onToggleVisibility,
}: SceneHierarchyProps) {
  const visibleCount = objects.filter((o) => o.visible).length

  return (
    <aside
      className="w-full h-full flex flex-col border-r border-white/[0.06] bg-[#020406]/85 backdrop-blur-md select-none text-[#F5F2EB]"
      aria-label="Scene Hierarchy"
    >
      {/* Panel Header */}
      <div className="h-10 px-3.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={12} className="text-[#4EEDDE]" />
          <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-[#9E9A91]">
            Scene Hierarchy
          </span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.15em] text-[#5A564F]">
          {visibleCount}/{objects.length} VIS
        </span>
      </div>

      {/* Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Root Node: Scene / Assembly Name */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-[#F5F2EB] font-mono text-[11px] tracking-[0.14em]">
          <span className="text-[#4EEDDE]/60 text-[9px]">■</span>
          <span className="font-medium uppercase tracking-[0.18em] text-[#EDE8DF]">
            {sceneName}
          </span>
        </div>

        {/* Child Nodes */}
        <div className="ml-2 pl-2 border-l border-white/[0.07] space-y-0.5">
          {objects.map((object, idx) => {
            const isSelected = selectedId === object.id
            const isHidden = !object.visible
            const isLast = idx === objects.length - 1

            return (
              <div
                key={object.id}
                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-sm transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#4EEDDE]/[0.06] border-l-2 border-[#4EEDDE] text-[#F5F2EB]'
                    : isHidden
                    ? 'text-[#5A564F] hover:text-[#9E9A91] hover:bg-white/[0.02]'
                    : 'text-[#9E9A91] hover:text-[#F5F2EB] hover:bg-white/[0.02]'
                }`}
                onClick={() => onSelect(object.id)}
                role="treeitem"
                aria-selected={isSelected}
              >
                {/* Node Label & Connector */}
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-mono text-[9px] text-[#5A564F] select-none">
                    {isLast ? '└' : '├'}
                  </span>
                  {object.generated ? (
                    <Sparkles size={10} className="text-[#4EEDDE] shrink-0" />
                  ) : (
                    <span className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-[#4EEDDE]' : 'bg-white/20'}`} />
                  )}
                  <span
                    className={`font-sans text-[11.5px] truncate tracking-[0.04em] ${
                      isSelected ? 'font-medium text-[#F5F2EB]' : isHidden ? 'line-through text-[#5A564F]' : ''
                    }`}
                  >
                    {object.name}
                  </span>
                </div>

                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleVisibility(object.id, object.visible)
                  }}
                  className={`p-1 rounded transition-colors ${
                    isHidden
                      ? 'text-[#5A564F] hover:text-[#4EEDDE]'
                      : 'text-white/20 group-hover:text-white/60 hover:text-[#F5F2EB]'
                  }`}
                  title={isHidden ? 'Click to show object' : 'Click to hide object'}
                  aria-label={isHidden ? `Show ${object.name}` : `Hide ${object.name}`}
                >
                  {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Node Status Footer */}
      <div className="p-3 border-t border-white/[0.06] bg-black/40 font-mono text-[9px] tracking-[0.18em] text-[#5A564F] flex items-center justify-between">
        <span>SEL: {selectedId ? selectedId.toUpperCase() : 'NONE'}</span>
        <span className="text-[#4EEDDE]/80">3D // READY</span>
      </div>
    </aside>
  )
}
