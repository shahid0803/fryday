import { useEffect, useRef } from 'react'
import type { ConnectionState, TranscriptMessage } from '../types/scene'

interface AssistantFeedProps {
  transcript: TranscriptMessage[]
  status: ConnectionState
}

export function AssistantFeed({ transcript, status }: AssistantFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript, status])

  const statusStyles: Record<
    ConnectionState,
    { label: string; dotClass: string; textClass: string }
  > = {
    OFFLINE: { label: 'OFFLINE', dotClass: 'bg-[#5A564F]', textClass: 'text-[#5A564F]' },
    DISCONNECTED: { label: 'DISCONNECTED', dotClass: 'bg-[#5A564F]', textClass: 'text-[#5A564F]' },
    CONNECTING: { label: 'CONNECTING', dotClass: 'bg-amber-400 animate-pulse', textClass: 'text-amber-400' },
    CONNECTED: { label: 'READY', dotClass: 'bg-[#4EEDDE]', textClass: 'text-[#4EEDDE]' },
    LISTENING: {
      label: 'LISTENING',
      dotClass: 'bg-[#00F5D4] animate-ping',
      textClass: 'text-[#00F5D4]',
    },
    THINKING: {
      label: 'THINKING',
      dotClass: 'bg-[#4EEDDE] animate-pulse',
      textClass: 'text-[#4EEDDE]',
    },
    EXECUTING: {
      label: 'EXECUTING',
      dotClass: 'bg-[#4EEDDE] animate-pulse',
      textClass: 'text-[#4EEDDE]',
    },
    SPEAKING: {
      label: 'SPEAKING',
      dotClass: 'bg-[#00F5D4] animate-pulse',
      textClass: 'text-[#00F5D4]',
    },
    ERROR: { label: 'ERROR', dotClass: 'bg-rose-500', textClass: 'text-rose-400' },
  }

  const currentStatus = statusStyles[status] ?? statusStyles.CONNECTED

  return (
    <aside
      className="w-full h-full flex flex-col border-l border-white/[0.06] bg-[#020406]/85 backdrop-blur-md select-none text-[#F5F2EB]"
      aria-label="AI Assistant"
    >
      {/* Panel Header */}
      <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-display font-bold text-xs tracking-[0.24em] uppercase text-[#F5F2EB]">
            FRYDAY
          </span>
          <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-[#9E9A91]">
            AI Design Copilot
          </span>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-sm border border-white/[0.06] bg-black/40">
          <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotClass}`} />
          <span className={`font-mono text-[9px] tracking-[0.2em] font-medium ${currentStatus.textClass}`}>
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* Editorial Stream Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5">
        {transcript.map((msg) => {
          const isUser = msg.role === 'user'

          return (
            <div key={msg.id} className="space-y-1.5">
              {/* Role Header */}
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[9px] tracking-[0.25em] uppercase ${
                    isUser ? 'text-[#9E9A91]' : 'text-[#4EEDDE]'
                  }`}
                >
                  {isUser ? 'USER' : 'AI'}
                </span>
                <span className="h-[1px] flex-1 bg-white/[0.04]" />
              </div>

              {/* Message Typography (Editorial, Warm Ivory, No bubbles) */}
              <p
                className={`font-sans text-[12.5px] leading-relaxed tracking-[0.015em] ${
                  isUser
                    ? 'text-[#F5F2EB]/80 font-normal pl-1'
                    : 'text-[#F5F2EB] font-light pl-1'
                }`}
              >
                {msg.text}
              </p>
            </div>
          )
        })}

        {/* Dynamic Activity State Feedback */}
        {status === 'THINKING' && (
          <div className="space-y-1.5 pt-1 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.25em] text-[#4EEDDE] uppercase">
                AI // PROCESSING
              </span>
              <span className="h-[1px] flex-1 bg-[#4EEDDE]/20" />
            </div>
            <p className="font-mono text-[11px] text-[#9E9A91] tracking-[0.06em] pl-1">
              Evaluating scene context & geometry...
            </p>
          </div>
        )}

        {status === 'EXECUTING' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.25em] text-[#4EEDDE] uppercase">
                AI // EXECUTING
              </span>
              <span className="h-[1px] flex-1 bg-[#4EEDDE]/30" />
            </div>
            <p className="font-mono text-[11px] text-[#4EEDDE] tracking-[0.06em] pl-1 animate-pulse">
              Dispatching scene mutation...
            </p>
          </div>
        )}
      </div>

      {/* Feed Footer Telemetry */}
      <div className="h-9 px-4 border-t border-white/[0.06] bg-black/40 flex items-center justify-between font-mono text-[9px] tracking-[0.18em] text-[#5A564F]">
        <span>ENGINE: GPT-4O REALTIME</span>
        <span className="text-[#4EEDDE]/60">LATENCY: 42MS</span>
      </div>
    </aside>
  )
}
