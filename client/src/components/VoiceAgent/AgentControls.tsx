import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { useState, useEffect } from 'react'
import './VoiceAgent.css'

interface AgentControlsProps {
  onDisconnect: () => void
}

export function AgentControls({ onDisconnect }: AgentControlsProps) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [isMuted, setIsMuted] = useState(false)

  // Track mute state from participant
  // Use specific property as dependency to avoid infinite loops
  const isMicEnabled = localParticipant?.isMicrophoneEnabled
  useEffect(() => {
    if (isMicEnabled !== undefined) {
      setIsMuted(!isMicEnabled)
    }
  }, [isMicEnabled])

  const handleMuteToggle = async () => {
    if (!localParticipant) return

    try {
      if (isMuted) {
        await localParticipant.setMicrophoneEnabled(true)
        setIsMuted(false)
      } else {
        await localParticipant.setMicrophoneEnabled(false)
        setIsMuted(true)
      }
    } catch (error) {
      console.error('Error toggling microphone:', error)
    }
  }

  const handleDisconnect = async () => {
    if (room) {
      await room.disconnect()
    }
    onDisconnect()
  }

  return (
    <div className="agent-controls">
      <button
        onClick={handleMuteToggle}
        className={`control-button mute-button ${isMuted ? 'muted' : ''}`}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        <span className="button-icon">🎤</span>
        <span className="button-text">{isMuted ? 'Unmute' : 'Mute'}</span>
      </button>
      <button
        onClick={handleDisconnect}
        className="control-button disconnect-button"
        aria-label="Disconnect from voice agent"
      >
        <span className="button-text">Disconnect</span>
      </button>
    </div>
  )
}
