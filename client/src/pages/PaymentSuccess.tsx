import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Payment.css'

export function PaymentSuccess() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [status, setStatus] = useState<'checking' | 'success' | 'delay'>('checking')
  const [dots, setDots] = useState('...')

  // Animation for loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!session) return

    let attempts = 0
    const maxAttempts = 10

    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        const data = await response.json()

        if (data.hasAccess) {
          setStatus('success')
          setTimeout(() => navigate('/dashboard'), 2000)
        } else {
          attempts++
          if (attempts < maxAttempts) {
            // Webhook might be slow, try again in 2 seconds
            setTimeout(checkSubscription, 2000)
          } else {
            setStatus('delay')
          }
        }
      } catch (err) {
        console.error('Error checking status:', err)
        setStatus('delay')
      }
    }

    checkSubscription()
  }, [session, navigate])

  return (
    <div className="payment-page">
      <div className="payment-card glass-card text-center">
        {status === 'checking' && (
          <>
            <div className="success-icon pulse">✓</div>
            <h1>Confirming payment{dots}</h1>
            <p className="payment-subtitle">
              We're waiting for Dodo Payments to confirm your subscription. 
              This usually takes a few seconds.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon bounce">✓</div>
            <h1>You're all set!</h1>
            <p className="payment-subtitle">
              Your Pro trial is now active. Redirecting you to your dashboard...
            </p>
          </>
        )}

        {status === 'delay' && (
          <>
            <div className="success-icon warning">!</div>
            <h1>Taking longer than usual</h1>
            <p className="payment-subtitle">
              Your payment was successful, but we haven't received the confirmation yet. 
              You can try refreshing or go to the dashboard in a minute.
            </p>
            <button className="payment-btn" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
