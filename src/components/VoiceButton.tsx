import { Mic } from 'lucide-react'

import type { ConnectionState } from '../types/scene'

export function VoiceButton({
  status,
  onToggle,
}: {
  status: ConnectionState
  onToggle: () => void
}) {
  const isListening = status === 'LISTENING'
  const isThinking = status === 'THINKING'
  const isExecuting = status === 'EXECUTING'
  const isSpeaking = status === 'SPEAKING'
  const isError = status === 'ERROR'

  const label =
    isListening ? 'LISTENING' : isThinking ? 'THINKING' : isExecuting ? 'EXECUTING' : isSpeaking ? 'SPEAKING' : isError ? 'ERROR' : 'READY'

  return (
    <button
      type="button"
      className={`voice-button ${isListening ? 'listening' : ''} ${isThinking ? 'thinking' : ''} ${isExecuting ? 'executing' : ''} ${isSpeaking ? 'speaking' : ''}`}
      onClick={onToggle}
      aria-label="Toggle voice input"
    >
      <Mic size={14} />
      {label}
    </button>
  )
}
