import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface SubscriptionRouteProps {
  children: React.ReactNode
}

export function SubscriptionRoute({ children }: SubscriptionRouteProps) {
  const { user, session, loading: authLoading } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.access_token) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        const data = await response.json()
        setSubscriptionStatus(data.status)
      } catch (err) {
        console.error('Subscription check error:', err)
        setSubscriptionStatus('error')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (!user) {
        setLoading(false)
      } else {
        checkSubscription()
      }
    }
  }, [user, session, authLoading])

  if (authLoading || loading) {
    return (
      <div className="payment-page">
        <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: '#007AFF' }}></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // If user is logged in but doesn't have an active/trial subscription, redirect to payment
  if (!['trial', 'active'].includes(subscriptionStatus || '')) {
    return <Navigate to="/payment-required" replace />
  }

  return <>{children}</>
}
