import type { TranscriptMessage } from '../types/scene'

export function AssistantPanel({ transcript }: { transcript: TranscriptMessage[] }) {
  return (
    <div className="assistant-panel panel-surface">
      <div className="panel-header-row compact">
        <div className="panel-label">AI ASSISTANT</div>
        <div className="panel-badge">
          <span className="status-dot" />
          LIVE
        </div>
      </div>

      <div className="assistant-feed">
        {transcript.map((entry) => (
          <div key={entry.id} className={`assistant-card ${entry.role}`}>
            <div className="assistant-tag">{entry.role === 'user' ? 'USER' : 'AI'}</div>
            <h3>{entry.text}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}
