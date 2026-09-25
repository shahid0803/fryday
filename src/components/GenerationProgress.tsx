import { Sparkles } from 'lucide-react'
import type { GenerationState } from '../types/scene'

interface GenerationProgressProps {
  generation: GenerationState
}

export function GenerationProgress({ generation }: GenerationProgressProps) {
  if (generation.status !== 'GENERATING') return null

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-80 max-w-[90vw] p-3 rounded-sm border border-[#4EEDDE]/30 bg-[#020406]/90 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.8)] select-none animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Sparkles size={12} className="text-[#4EEDDE] shrink-0 animate-spin" />
          <span className="font-mono text-[9px] tracking-[0.22em] text-[#4EEDDE] uppercase font-medium truncate">
            {generation.prompt ? `"${generation.prompt}"` : 'SYNTHESIZING ASSET'}
          </span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.15em] text-[#F5F2EB] font-bold shrink-0">
          {generation.progress}%
        </span>
      </div>

      {/* Sleek Luminous Teal Progress Bar */}
      <div className="w-full h-[2px] bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#4EEDDE] to-[#00F5D4] transition-all duration-300 shadow-[0_0_8px_rgba(78,237,222,0.8)]"
          style={{ width: `${generation.progress}%` }}
        />
      </div>
    </div>
  )
}
