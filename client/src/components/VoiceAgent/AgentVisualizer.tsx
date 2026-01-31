import { useEffect, useState, useRef } from 'react'
import { useVoiceAssistant, useTracks, TrackReference } from '@livekit/components-react'
import { Track } from 'livekit-client'
import './VoiceAgent.css'

export function AgentVisualizer() {
  // Try to use useVoiceAssistant hook first (requires livekit-agents >= 0.9.0)
  const voiceAssistant = useVoiceAssistant()
  
  // Fallback to useTracks if useVoiceAssistant doesn't provide track
  const tracks = useTracks([{ source: 'agent' }], { onlySubscribed: true })
  const [audioLevels, setAudioLevels] = useState<number[]>([])
  const animationFrameRef = useRef<number>()
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  // Find agent audio track - prefer useVoiceAssistant, fallback to useTracks
  const agentTrack = voiceAssistant?.audioTrack
    ? { publication: { track: voiceAssistant.audioTrack } }
    : tracks.find(
        (trackRef: TrackReference) =>
          trackRef.publication?.kind === 'audio' && trackRef.participant?.identity?.includes('agent')
      )

  useEffect(() => {
    if (!agentTrack?.publication?.track) {
      setAudioLevels(new Array(20).fill(0))
      return
    }

    const track = agentTrack.publication.track as Track
    if (track.kind !== 'audio') {
      setAudioLevels(new Array(20).fill(0))
      return
    }

    // Set up audio analysis
    const setupAudioAnalysis = async () => {
      try {
        const stream = new MediaStream([track.mediaStreamTrack])
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.8
        source.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

        // Start animation loop
        const updateLevels = () => {
          if (!analyserRef.current || !dataArrayRef.current) return

          analyserRef.current.getByteFrequencyData(dataArrayRef.current)

          // Convert frequency data to visual bars (20 bars)
          const barCount = 20
          const step = Math.floor(dataArrayRef.current.length / barCount)
          const levels = []

          for (let i = 0; i < barCount; i++) {
            const index = i * step
            const value = dataArrayRef.current[index] || 0
            // Normalize to 0-100
            levels.push(Math.min(100, (value / 255) * 100))
          }

          setAudioLevels(levels)
          animationFrameRef.current = requestAnimationFrame(updateLevels)
        }

        updateLevels()
      } catch (error) {
        console.error('Error setting up audio analysis:', error)
        setAudioLevels(new Array(20).fill(0))
      }
    }

    setupAudioAnalysis()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [agentTrack])

  // Determine agent state - prefer useVoiceAssistant state, fallback to audio levels
  const assistantState = voiceAssistant?.state
  const isSpeakingFromLevels = audioLevels.some((level) => level > 10)
  const isSpeaking = assistantState === 'speaking' || (assistantState === undefined && isSpeakingFromLevels)
  const agentState = assistantState === 'speaking' 
    ? 'Speaking' 
    : assistantState === 'listening' 
    ? 'Listening' 
    : isSpeakingFromLevels 
    ? 'Speaking' 
    : 'Listening'

  return (
    <div className="agent-visualizer">
      <div className="visualizer-bars">
        {audioLevels.map((level, index) => (
          <div
            key={index}
            className="visualizer-bar"
            style={{
              height: `${Math.max(5, level)}%`,
              opacity: level > 5 ? 0.8 + level / 500 : 0.3,
            }}
          />
        ))}
      </div>
      <div className="agent-state">
        <span className={`state-indicator ${isSpeaking ? 'speaking' : 'listening'}`}></span>
        <span className="state-text">Agent State: {agentState}</span>
      </div>
    </div>
  )
}
