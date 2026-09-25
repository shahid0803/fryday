import { Layers, MessageSquareCode } from 'lucide-react'
import type { ConnectionState } from '../types/scene'

interface TopBarProps {
  status: ConnectionState
  activeTab: string
  setActiveTab: (tab: string) => void
  leftPanelOpen: boolean
  setLeftPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  rightPanelOpen: boolean
  setRightPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  onReplayIntro?: () => void
}

export function TopBar({
  status,
  activeTab,
  setActiveTab,
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  onReplayIntro,
}: TopBarProps) {
  const isOnline = status !== 'ERROR' && status !== 'OFFLINE'
  const statusLabel =
    status === 'LISTENING'
      ? 'SYSTEM LISTENING'
      : status === 'THINKING'
      ? 'NEURAL INFERENCE'
      : status === 'EXECUTING'
      ? 'GEOMETRY ENGINE'
      : status === 'SPEAKING'
      ? 'AUDIO SYNTHESIS'
      : isOnline
      ? 'SYSTEM READY'
      : 'SYSTEM OFFLINE'

  return (
    <header className="h-12 w-full flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#020406]/90 backdrop-blur-md z-30 select-none">
      {/* Left: Brand & System State */}
      <div className="flex items-center gap-5">
        {/* Toggle Left Hierarchy on mobile/tablet */}
        <button
          type="button"
          onClick={() => setLeftPanelOpen((prev) => !prev)}
          className={`p-1.5 rounded-sm border transition-colors md:hidden ${
            leftPanelOpen
              ? 'border-[#4EEDDE]/40 text-[#4EEDDE] bg-[#4EEDDE]/5'
              : 'border-white/10 text-[#9E9A91] hover:text-[#F5F2EB]'
          }`}
          title="Toggle Scene Tree"
          aria-label="Toggle Scene Hierarchy"
        >
          <Layers size={13} />
        </button>

        <div className="flex items-baseline gap-3">
          <span
            className="font-display font-bold text-base tracking-[0.28em] text-[#F5F2EB] uppercase cursor-pointer hover:text-[#4EEDDE] transition-colors"
            onClick={onReplayIntro}
            title="Click to replay prologue"
          >
            FRYDAY
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#5A564F] hidden sm:inline">
            // LAB V0.9
          </span>
        </div>

        {/* Small System State */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/[0.06]">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              status === 'ERROR'
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                : status === 'LISTENING' || status === 'EXECUTING'
                ? 'bg-[#4EEDDE] animate-pulse shadow-[0_0_8px_rgba(78,237,222,0.9)]'
                : 'bg-[#4EEDDE] shadow-[0_0_6px_rgba(78,237,222,0.6)]'
            }`}
          />
          <span className="font-mono text-[9px] tracking-[0.22em] text-[#9E9A91] uppercase">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Right: Understated Navigation */}
      <div className="flex items-center gap-1 sm:gap-2">
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
          {(['WORKSPACE', 'PROJECT', 'HISTORY', 'SETTINGS'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`font-mono text-[10px] tracking-[0.2em] uppercase px-2.5 py-1.5 rounded-sm transition-all ${
                  isActive
                    ? 'text-[#F5F2EB] border-b border-[#4EEDDE]'
                    : 'text-[#9E9A91] hover:text-[#F5F2EB] hover:bg-white/[0.02]'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </nav>

        {/* Toggle Right Assistant on mobile/tablet */}
        <button
          type="button"
          onClick={() => setRightPanelOpen((prev) => !prev)}
          className={`p-1.5 rounded-sm border transition-colors md:hidden ml-2 ${
            rightPanelOpen
              ? 'border-[#4EEDDE]/40 text-[#4EEDDE] bg-[#4EEDDE]/5'
              : 'border-white/10 text-[#9E9A91] hover:text-[#F5F2EB]'
          }`}
          title="Toggle Assistant Feed"
          aria-label="Toggle AI Assistant Feed"
        >
          <MessageSquareCode size={13} />
        </button>
      </div>
    </header>
  )
}
