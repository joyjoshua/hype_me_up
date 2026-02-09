import { supabaseAdmin } from '../lib/supabase.js'

// ============================================
// SUBSCRIPTION REPOSITORY
// Handles all database operations for subscriptions table
// ============================================

export interface Subscription {
    id?: string
    user_id: string
    dodo_subscription_id?: string
    status: 'pending' | 'trial' | 'active' | 'cancelled' | 'expired'
    plan?: string
    trial_ends_at?: string
    created_at?: string
    updated_at?: string
}

export interface SubscriptionUpsert {
    user_id: string
    dodo_subscription_id: string
    status: 'trial' | 'active'
    trial_ends_at?: string
    plan: string
    updated_at: string
}

export class SubscriptionRepository {
    /**
     * Find subscription by user ID
     */
    async findByUserId(user_id: string) {
        const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', user_id)
            .single()

        // PGRST116 = no rows found - not an error, just no subscription
        if (error && error.code !== 'PGRST116') throw error
        return data
    }

    /**
     * Find subscription by Dodo subscription ID
     */
    async findByDodoSubscriptionId(dodo_subscription_id: string) {
        const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('dodo_subscription_id', dodo_subscription_id)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
    }

    /**
     * Create or update subscription (upsert)
     */
    async upsert(subscription: SubscriptionUpsert) {
        const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: subscription.user_id,
                dodo_subscription_id: subscription.dodo_subscription_id,
                status: subscription.status,
                trial_ends_at: subscription.trial_ends_at,
                plan: subscription.plan,
                updated_at: subscription.updated_at,
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Update subscription status by Dodo subscription ID
     */
    async updateStatusByDodoId(dodo_subscription_id: string, status: string) {
        const { data, error } = await supabaseAdmin
            .from('subscriptions')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('dodo_subscription_id', dodo_subscription_id)
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Cancel subscription by Dodo subscription ID
     */
    async cancelByDodoId(dodo_subscription_id: string) {
        return this.updateStatusByDodoId(dodo_subscription_id, 'cancelled')
    }
}

// Export singleton instance
export const subscriptionRepository = new SubscriptionRepository()
