import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'

// ============================================
// AUTH CONTROLLER
// Handles HTTP request/response for authentication endpoints
// ============================================

export class AuthController {
    /**
     * GET /api/me
     * Returns current authenticated user info
     */
    getMe(req: AuthenticatedRequest, res: Response) {
        res.json({
            user: req.user,
            message: 'You are authenticated!',
        })
    }
}

// Export singleton instance
export const authController = new AuthController()
