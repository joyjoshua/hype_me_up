import { Router, Response } from 'express'
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

// Protected route - returns current user info
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.user,
    message: 'You are authenticated!',
  })
})

// Generate LiveKit room access token
router.post('/livekit/token', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomName, participantIdentity, agentName } = req.body

    if (!roomName) {
      res.status(400).json({ error: 'roomName is required' })
      return
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.LIVEKIT_URL

    if (!apiKey || !apiSecret) {
      res.status(500).json({ error: 'LiveKit credentials not configured' })
      return
    }

    if (!livekitUrl) {
      res.status(500).json({ error: 'LiveKit URL not configured' })
      return
    }

    // Use authenticated user's ID as identity, or provided identity
    const identity = participantIdentity || req.user?.id || 'user'

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: req.user?.firstName || identity,
    })

    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    })

    // Generate JWT token
    const token = await at.toJwt()

    // Explicitly dispatch the named agent to this room
    // This is required because named agents don't auto-dispatch
    const targetAgent = agentName || 'hype_me_up'
    try {
      const dispatchClient = new AgentDispatchClient(livekitUrl, apiKey, apiSecret)
      await dispatchClient.createDispatch(roomName, targetAgent, {
        metadata: JSON.stringify({ userId: identity }),
      })
      console.log(`Agent "${targetAgent}" dispatched to room "${roomName}"`)
    } catch (dispatchError) {
      // Log but don't fail - agent might already be dispatched or room might not exist yet
      console.warn('Agent dispatch warning:', dispatchError)
    }

    res.json({ token })
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    res.status(500).json({ 
      error: 'Failed to generate token',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ============================================
// TEST ENDPOINT - Voice Agent Summary
// This endpoint is isolated for testing purposes
// ============================================
router.post('/test/voice-agent-summary', async (req, res) => {
  console.log('===========================================')
  console.log('[TEST] Voice Agent Summary Endpoint Called')
  console.log('===========================================')
  console.log('[TEST] Request Headers:', JSON.stringify(req.headers, null, 2))
  console.log('[TEST] Request Body:', JSON.stringify(req.body, null, 2))
  
  try {
    const { job_id, room_id, room, started_at, ended_at, summary } = req.body

    console.log('[TEST] Parsed Data:')
    console.log('  - Job ID:', job_id)
    console.log('  - Room ID:', room_id)
    console.log('  - Room:', room)
    console.log('  - Started At:', started_at)
    console.log('  - Ended At:', ended_at)
    console.log('  - Summary:', summary)

    const response = {
      success: true,
      received: {
        job_id,
        room_id,
        room,
        started_at,
        ended_at,
        summary,
      },
      message: 'Summary received and logged successfully',
    }

    console.log('[TEST] Response:', JSON.stringify(response, null, 2))
    console.log('===========================================')
    console.log('[TEST] Voice Agent Summary Endpoint Complete')
    console.log('===========================================')

    res.json(response)
  } catch (error) {
    console.error('[TEST] Error processing voice agent summary:', error)
    res.status(500).json({
      error: 'Failed to process summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
