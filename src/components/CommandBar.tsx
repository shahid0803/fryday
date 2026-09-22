import { ArrowUp, Mic, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ConnectionState } from '../types/scene'

interface CommandBarProps {
  status: ConnectionState
  onSend: (text: string) => void
  onToggleVoice: () => void
  isExecuting?: boolean
}

export function CommandBar({
  status,
  onSend,
  onToggleVoice,
  isExecuting = false,
}: CommandBarProps) {
  const [prompt, setPrompt] = useState('')
  const isListening = status === 'LISTENING'

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!prompt.trim() || isExecuting) return
    onSend(prompt.trim())
    setPrompt('')
  }

  const suggestions = [
    'Add electric motor',
    'Remove rear wheel',
    'Scale engine up',
    'Reset workspace',
  ]

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2 select-none">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 px-2 scrollbar-none">
        <Sparkles size={11} className="text-[#4EEDDE]/60 shrink-0 mr-1" />
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSend(suggestion)}
            className="shrink-0 font-mono text-[9px] tracking-[0.12em] uppercase text-[#9E9A91] hover:text-[#F5F2EB] hover:border-[#4EEDDE]/40 px-2.5 py-1 rounded-sm border border-white/[0.06] bg-[#020406]/70 backdrop-blur-md transition-all duration-150"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Main Command Input Box */}
      <form
        onSubmit={handleSubmit}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm border transition-all duration-200 bg-[#020406]/90 backdrop-blur-lg shadow-[0_12px_40px_rgba(0,0,0,0.8)] ${
          isListening
            ? 'border-[#4EEDDE] shadow-[0_0_24px_rgba(78,237,222,0.25)]'
            : 'border-white/[0.08] hover:border-white/[0.16] focus-within:border-[#4EEDDE]/60'
        }`}
      >
        {/* Microphone Button with Voice State Ripple */}
        <div className="relative flex items-center justify-center">
          {isListening && (
            <span className="absolute w-7 h-7 rounded-full bg-[#4EEDDE]/20 animate-ping pointer-events-none" />
          )}
          <button
            type="button"
            onClick={onToggleVoice}
            className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-sm border transition-all ${
              isListening
                ? 'bg-[#4EEDDE] text-black border-[#4EEDDE] shadow-[0_0_12px_rgba(78,237,222,0.8)]'
                : 'bg-white/[0.03] text-[#9E9A91] hover:text-[#F5F2EB] border-white/[0.06] hover:border-white/20'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to start voice command'}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <Mic size={13} className="animate-pulse" /> : <Mic size={13} />}
          </button>
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build..."
          disabled={isExecuting}
          className="flex-1 bg-transparent text-[#F5F2EB] placeholder:text-[#5A564F] font-sans text-xs tracking-[0.02em] px-2 py-1 outline-none disabled:opacity-50"
          aria-label="Command prompt"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!prompt.trim() || isExecuting}
          className={`w-7 h-7 flex items-center justify-center rounded-sm border transition-all ${
            prompt.trim() && !isExecuting
              ? 'bg-[#4EEDDE]/15 border-[#4EEDDE]/50 text-[#4EEDDE] hover:bg-[#4EEDDE] hover:text-black hover:shadow-[0_0_12px_rgba(78,237,222,0.6)]'
              : 'bg-white/[0.02] border-white/[0.05] text-[#5A564F] cursor-not-allowed'
          }`}
          title="Execute command"
          aria-label="Submit command"
        >
          <ArrowUp size={13} />
        </button>
      </form>
    </div>
  )
}
