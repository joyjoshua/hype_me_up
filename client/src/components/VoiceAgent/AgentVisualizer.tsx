import { useEffect, useState, useRef, useMemo } from 'react'
import { useVoiceAssistant, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import './VoiceAgent.css'

export function AgentVisualizer() {
  // Try to use useVoiceAssistant hook first (requires livekit-agents >= 0.9.0)
  const voiceAssistant = useVoiceAssistant()
  
  // Fallback to useTracks if useVoiceAssistant doesn't provide track
  const tracks = useTracks([Track.Source.Microphone, Track.Source.Unknown], { onlySubscribed: true })
  const [audioLevels, setAudioLevels] = useState<number[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  // Find agent audio track - prefer useVoiceAssistant, fallback to useTracks
  // Memoize to prevent creating new object on every render
  const agentTrack = useMemo(() => {
    if (voiceAssistant?.audioTrack) {
      return { publication: { track: voiceAssistant.audioTrack } }
    }
    return tracks.find(
      (trackRef) =>
        trackRef.publication?.kind === 'audio' && trackRef.participant?.identity?.includes('agent')
    )
  }, [voiceAssistant?.audioTrack, tracks])

  // Extract the actual track for stable dependency
  const trackInstance = agentTrack?.publication?.track as Track | undefined

  useEffect(() => {
    if (!trackInstance) {
      setAudioLevels(new Array(20).fill(0))
      return
    }

    const track = trackInstance
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
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        dataArrayRef.current = dataArray

        // Start animation loop
        const updateLevels = () => {
          if (!analyserRef.current || !dataArrayRef.current) return

          analyserRef.current.getByteFrequencyData(dataArray)

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
  }, [trackInstance])

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
