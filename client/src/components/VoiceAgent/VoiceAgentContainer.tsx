import { useState, useCallback } from 'react'
import { LiveKitRoom, useConnectionState, RoomAudioRenderer } from '@livekit/components-react'
import { useAuth } from '../../context/AuthContext'
import { AgentVisualizer } from './AgentVisualizer'
import { AgentControls } from './AgentControls'
import './VoiceAgent.css'

interface VoiceAgentContainerProps {
  roomName?: string
}

export function VoiceAgentContainer({ roomName }: VoiceAgentContainerProps) {
  const { user, session } = useAuth()
  
  // Generate user-specific room name (recommended for automatic dispatch)
  // Format: user-{userId} ensures each user gets isolated room
  const defaultRoomName = user?.id ? `user-${user.id}` : 'default-room'
  const finalRoomName = roomName || defaultRoomName
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [shouldConnect, setShouldConnect] = useState(false)

  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880'
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const handleConnect = useCallback(async () => {
    if (!session?.access_token) {
      setError('No authentication session found')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/api/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          roomName: finalRoomName,
          participantIdentity: user?.id || 'user',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get token' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setToken(data.token)
      setShouldConnect(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to voice agent')
      console.error('Error fetching LiveKit token:', err)
    } finally {
      setIsConnecting(false)
    }
  }, [session, user, finalRoomName, apiBase])

  const handleDisconnect = useCallback(() => {
    setToken(null)
    setShouldConnect(false)
    setError(null)
  }, [])

  if (error) {
    return (
      <div className="voice-agent-container">
        <div className="voice-agent-card voice-agent-error">
          <div className="error-icon">⚠️</div>
          <p>Unable to connect to voice agent</p>
          <p className="error-detail">{error}</p>
          <button onClick={handleConnect} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isConnecting) {
    return (
      <div className="voice-agent-container">
        <div className="voice-agent-card voice-agent-loading">
          <div className="loading-spinner"></div>
          <p>Connecting to your AI coach...</p>
        </div>
      </div>
    )
  }

  // Show connect button when not connected
  if (!shouldConnect || !token) {
    return (
      <div className="voice-agent-container">
        <div className="voice-agent-card voice-agent-idle">
          <div className="idle-icon">🎤</div>
          <p>Tap to start your voice-powered workout session</p>
          <button onClick={handleConnect} className="connect-button">
            Start Session
          </button>
        </div>
      </div>
    )
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      className="voice-agent-room"
    >
      <VoiceAgentContent onDisconnect={handleDisconnect} />
    </LiveKitRoom>
  )
}

interface VoiceAgentContentProps {
  onDisconnect: () => void
}

function VoiceAgentContent({ onDisconnect }: VoiceAgentContentProps) {
  const connectionState = useConnectionState()

  if (connectionState === 'connecting') {
    return (
      <div className="voice-agent-container">
        <div className="voice-agent-card voice-agent-loading">
          <div className="loading-spinner"></div>
          <p>Connecting...</p>
        </div>
      </div>
    )
  }

  if (connectionState === 'disconnected') {
    return (
      <div className="voice-agent-container">
        <div className="voice-agent-card voice-agent-idle">
          <div className="idle-icon">🔌</div>
          <p>Disconnected from voice agent</p>
          <button onClick={onDisconnect} className="connect-button">
            Reconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="voice-agent-container">
      <RoomAudioRenderer />
      <div className="voice-agent-card voice-agent-content">
        <AgentVisualizer />
        <AgentControls onDisconnect={onDisconnect} />
      </div>
    </div>
  )
}
