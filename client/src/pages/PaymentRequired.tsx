import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Payment.css'

export function PaymentRequired() {
  const { session, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartTrial = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout')
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payment-page">
      <div className="payment-card glass-card">
        <div className="payment-header">
          <div className="payment-badge">7-DAY FREE TRIAL</div>
          <h1>One last step, {user?.user_metadata?.first_name || 'friend'}!</h1>
          <p className="payment-subtitle">
            Unlock your full potential with HypeMeUp Pro. 
            No charges until your trial ends. Cancel anytime.
          </p>
        </div>

        <div className="payment-plan-details">
          <div className="plan-item">
            <span className="plan-dot"></span>
            <span>Unlimited AI coaching sessions</span>
          </div>
          <div className="plan-item">
            <span className="plan-dot"></span>
            <span>Advanced form correction & analytics</span>
          </div>
          <div className="plan-item">
            <span className="plan-dot"></span>
            <span>Personalized daily workout plans</span>
          </div>
        </div>

        {error && <div className="payment-error">{error}</div>}

        <button 
          className="payment-btn" 
          onClick={handleStartTrial} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Redirecting...
            </>
          ) : (
            'Start My 7-Day Free Trial'
          )}
        </button>
        
        <p className="payment-footer">
          Secure checkout by Dodo Payments.
        </p>
      </div>
    </div>
  )
}
