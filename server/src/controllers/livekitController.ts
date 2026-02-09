import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { livekitService } from '../services/index.js'

// ============================================
// LIVEKIT CONTROLLER
// Handles HTTP request/response for LiveKit endpoints
// ============================================

export class LivekitController {
    /**
     * POST /api/livekit/token
     * Generate LiveKit room access token and dispatch agent
     */
    async generateToken(req: AuthenticatedRequest, res: Response) {
        try {
            const { roomName, participantIdentity, agentName } = req.body

            if (!roomName) {
                res.status(400).json({ error: 'roomName is required' })
                return
            }

            // Validate config
            const validation = livekitService.validateConfig()
            if (!validation.valid) {
                res.status(500).json({ error: validation.error })
                return
            }

            // Use authenticated user's ID as identity, or provided identity
            const userId = participantIdentity || req.user?.id || 'user'
            const userName = req.user?.firstName || userId

            const result = await livekitService.generateToken({
                roomName,
                userId,
                userName,
                agentName
            })

            res.json({ token: result.token })
        } catch (error) {
            console.error('[LivekitController] Error generating token:', error)
            res.status(500).json({
                error: 'Failed to generate token',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }
}

// Export singleton instance
export const livekitController = new LivekitController()
