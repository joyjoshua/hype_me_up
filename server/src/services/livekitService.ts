import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk'

// ============================================
// LIVEKIT SERVICE
// Business logic for LiveKit token generation and agent dispatch
// ============================================

export interface TokenRequest {
    roomName: string
    userId: string
    userName: string
    agentName?: string
}

export interface TokenResponse {
    token: string
    agentDispatched: boolean
    dispatchWarning?: string
}

export class LivekitService {
    private apiKey: string | undefined
    private apiSecret: string | undefined
    private livekitUrl: string | undefined

    constructor() {
        this.apiKey = process.env.LIVEKIT_API_KEY
        this.apiSecret = process.env.LIVEKIT_API_SECRET
        this.livekitUrl = process.env.LIVEKIT_URL
    }

    /**
     * Validate LiveKit configuration
     */
    validateConfig(): { valid: boolean; error?: string } {
        if (!this.apiKey || !this.apiSecret) {
            return { valid: false, error: 'LiveKit credentials not configured' }
        }
        if (!this.livekitUrl) {
            return { valid: false, error: 'LiveKit URL not configured' }
        }
        return { valid: true }
    }

    /**
     * Generate access token and dispatch agent
     */
    async generateToken(request: TokenRequest): Promise<TokenResponse> {
        const { roomName, userId, userName, agentName } = request

        // Create access token
        const at = new AccessToken(this.apiKey!, this.apiSecret!, {
            identity: userId,
            name: userName,
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

        // Dispatch agent
        const targetAgent = agentName || 'hype_me_up'
        let agentDispatched = true
        let dispatchWarning: string | undefined

        try {
            const dispatchClient = new AgentDispatchClient(this.livekitUrl!, this.apiKey!, this.apiSecret!)
            await dispatchClient.createDispatch(roomName, targetAgent, {
                metadata: JSON.stringify({
                    userId,
                    username: userName,
                    roomName,
                }),
            })
            console.log(`[LivekitService] Agent "${targetAgent}" dispatched to room "${roomName}"`)
        } catch (error) {
            agentDispatched = false
            dispatchWarning = error instanceof Error ? error.message : 'Unknown dispatch error'
            console.warn('[LivekitService] Agent dispatch warning:', dispatchWarning)
        }

        return { token, agentDispatched, dispatchWarning }
    }
}

// Export singleton instance
export const livekitService = new LivekitService()
