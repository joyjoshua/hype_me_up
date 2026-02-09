// ============================================
// PAYMENT SERVICE
// Business logic for Dodo Payments integration
// ============================================

export interface CheckoutRequest {
    userId: string
    userEmail: string
    userName: string
}

export interface CheckoutResponse {
    success: boolean
    checkout_url: string
    subscription_id: string
}

export class PaymentService {
    private apiKey: string | undefined
    private productId: string | undefined
    private isTestMode: boolean
    private clientUrl: string

    constructor() {
        this.apiKey = process.env.DODO_PAYMENTS_API_KEY
        this.productId = process.env.DODO_PRODUCT_ID
        this.isTestMode = process.env.DODO_TEST_MODE !== 'false' // Default to test mode
        this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    }

    /**
     * Validate payment configuration
     */
    validateConfig(): { valid: boolean; error?: string; hint?: string } {
        if (!this.apiKey) {
            return {
                valid: false,
                error: 'DODO_PAYMENTS_API_KEY is not configured',
                hint: 'Add DODO_PAYMENTS_API_KEY to your .env file'
            }
        }
        if (!this.productId) {
            return {
                valid: false,
                error: 'DODO_PRODUCT_ID is not configured',
                hint: 'Add DODO_PRODUCT_ID to your .env file'
            }
        }
        return { valid: true }
    }

    /**
     * Create a checkout session with Dodo Payments
     */
    async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResponse> {
        const baseUrl = this.isTestMode
            ? 'https://test.dodopayments.com'
            : 'https://live.dodopayments.com'
        const apiUrl = `${baseUrl}/subscriptions`

        const requestBody = {
            billing: {
                city: "City",
                country: "US",
                state: "NY",
                street: "Street Address",
                zipcode: "10001"
            },
            customer: {
                email: request.userEmail,
                name: request.userName || 'Customer',
            },
            product_id: this.productId,
            quantity: 1,
            payment_link: true,
            return_url: `${this.clientUrl}/payment-success`,
            metadata: {
                user_id: request.userId,
            },
        }

        console.log('[PaymentService] Creating subscription:')
        console.log('  User ID:', request.userId)
        console.log('  Email:', request.userEmail)
        console.log('  API URL:', apiUrl)
        console.log('  Test Mode:', this.isTestMode)
        console.log('  Product ID:', this.productId)

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
        })

        const responseText = await response.text()
        console.log('[PaymentService] Response Status:', response.status)
        console.log('[PaymentService] Response Body:', responseText)

        if (!response.ok) {
            const error = new Error('Dodo API error') as Error & {
                status: number
                details: string
                hint?: string
            }
            error.status = response.status
            error.details = responseText

            if (response.status === 401) {
                error.hint = 'Your API key is invalid or expired. Please check: 1) Go to https://dashboard.dodopayments.com > Developer > API Keys, 2) Create a new key with WRITE access enabled, 3) Make sure you\'re using the correct key for your mode (test vs live)'
            } else if (response.status === 400) {
                error.hint = 'The request body is invalid. Check the product_id and required fields.'
            }

            throw error
        }

        const data = JSON.parse(responseText)
        console.log('[PaymentService] Subscription created successfully:', data.subscription_id)

        return {
            success: true,
            checkout_url: data.payment_link || data.checkout_url || data.url,
            subscription_id: data.subscription_id,
        }
    }

    /**
     * Verify webhook signature
     */
    async verifyWebhookSignature(body: object, signature: string): Promise<boolean> {
        const webhookSecret = process.env.DODO_WEBHOOK_SECRET

        if (!webhookSecret) {
            console.warn('[PaymentService] DODO_WEBHOOK_SECRET not set - skipping verification')
            return true // Allow in development
        }

        if (!signature) {
            return false
        }

        const crypto = await import('crypto')
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex')

        return signature === expectedSignature || signature === `sha256=${expectedSignature}`
    }
}

// Export singleton instance
export const paymentService = new PaymentService()
