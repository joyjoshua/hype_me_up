import { subscriptionRepository } from '../repositories/index.js'

// ============================================
// SUBSCRIPTION SERVICE
// Business logic for subscription operations
// ============================================

export interface SubscriptionStatus {
    status: 'pending' | 'trial' | 'active' | 'cancelled' | 'expired'
    hasAccess: boolean
    plan?: string
    trialEndsAt?: string
}

export class SubscriptionService {
    /**
     * Get subscription status for a user
     */
    async getStatus(user_id: string): Promise<SubscriptionStatus> {
        const subscription = await subscriptionRepository.findByUserId(user_id)

        if (!subscription) {
            return { status: 'pending', hasAccess: false }
        }

        const hasAccess = ['trial', 'active'].includes(subscription.status)

        return {
            status: subscription.status,
            hasAccess,
            plan: subscription.plan,
            trialEndsAt: subscription.trial_ends_at
        }
    }

    /**
     * Activate or update a subscription (from webhook)
     */
    async activateSubscription(
        user_id: string,
        dodo_subscription_id: string,
        isTrialing: boolean,
        trial_ends_at?: string
    ) {
        console.log('[SubscriptionService] Activating subscription for user:', user_id)

        return subscriptionRepository.upsert({
            user_id,
            dodo_subscription_id,
            status: isTrialing ? 'trial' : 'active',
            trial_ends_at,
            plan: 'pro',
            updated_at: new Date().toISOString()
        })
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(dodo_subscription_id: string) {
        console.log('[SubscriptionService] Cancelling subscription:', dodo_subscription_id)
        return subscriptionRepository.cancelByDodoId(dodo_subscription_id)
    }

    /**
     * Check if user has access
     */
    async hasAccess(user_id: string): Promise<boolean> {
        const status = await this.getStatus(user_id)
        return status.hasAccess
    }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()
