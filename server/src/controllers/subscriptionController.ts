import { Response } from 'express'
import { AuthenticatedRequest } from '../middleware/auth.js'
import { subscriptionService, paymentService } from '../services/index.js'

// ============================================
// SUBSCRIPTION CONTROLLER
// Handles HTTP request/response for subscription endpoints
// ============================================

export class SubscriptionController {
    /**
     * POST /api/checkout/create-session
     * Create a Dodo Payments checkout session
     */
    async createCheckoutSession(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.id
            const userEmail = req.user?.email || ''
            const userName = `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim()

            // Validate config
            const validation = paymentService.validateConfig()
            if (!validation.valid) {
                console.error('[SubscriptionController] Payment config error:', validation.error)
                res.status(500).json({
                    error: 'Payment configuration missing',
                    hint: validation.hint
                })
                return
            }

            const result = await paymentService.createCheckoutSession({
                userId: userId!,
                userEmail,
                userName
            })

            res.json(result)
        } catch (error: any) {
            console.error('[SubscriptionController] Checkout error:', error)

            if (error.status) {
                res.status(error.status).json({
                    error: 'Dodo API error',
                    details: error.details,
                    hint: error.hint
                })
                return
            }

            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }

    /**
     * GET /api/subscription/status
     * Check subscription status for authenticated user
     */
    async getStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.id

            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' })
                return
            }

            const status = await subscriptionService.getStatus(userId)

            res.json(status)
        } catch (error) {
            console.error('[SubscriptionController] Status error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }

    /**
     * POST /api/webhooks/dodo
     * Handle Dodo Payments webhooks
     */
    async handleWebhook(req: any, res: Response) {
        try {
            const event = req.body
            const signature = req.headers['x-dodo-signature'] as string

            console.log('[SubscriptionController] Webhook received:', event.type)

            // Verify signature
            const isValid = await paymentService.verifyWebhookSignature(req.body, signature)
            if (!isValid) {
                console.error('[SubscriptionController] Invalid webhook signature')
                res.status(401).json({ error: 'Invalid signature' })
                return
            }

            console.log('[SubscriptionController] Signature verified successfully')

            // Handle event types
            switch (event.type) {
                case 'subscription.active':
                case 'subscription.trialing': {
                    const userId = event.data.metadata?.user_id
                    if (userId) {
                        await subscriptionService.activateSubscription(
                            userId,
                            event.data.subscription_id,
                            event.type === 'subscription.trialing',
                            event.data.trial_ends_at
                        )
                        console.log('[SubscriptionController] Updated subscription for user:', userId)
                    }
                    break
                }

                case 'subscription.cancelled':
                case 'subscription.expired':
                    await subscriptionService.cancelSubscription(event.data.subscription_id)
                    console.log('[SubscriptionController] Cancelled subscription:', event.data.subscription_id)
                    break

                default:
                    console.log('[SubscriptionController] Unhandled event type:', event.type)
            }

            res.json({ received: true })
        } catch (error) {
            console.error('[SubscriptionController] Webhook error:', error)
            res.status(500).json({ error: 'Webhook processing failed' })
        }
    }
}

// Export singleton instance
export const subscriptionController = new SubscriptionController()
