# Payment Flow Implementation Plan

## Overview

Implement a mandatory payment flow where users must complete a Dodo Payments checkout after signup before accessing the main application.

## Current Flow
```
Landing Page → Signup → Dashboard (Welcome Page)
```

## Target Flow
```
Landing Page → Signup → Dodo Checkout → Payment Success → Dashboard (Welcome Page)
                                      → Payment Failed/Cancelled → Retry Payment Page
```

---

## Implementation Steps

### Phase 1: Database Schema Updates

**File:** `server/src/lib/supabase.ts` or Supabase Dashboard

Add subscription status tracking to user profiles:

```sql
-- Add to profiles table or create subscriptions table
ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'pending';
-- Values: 'pending', 'trial', 'active', 'cancelled', 'expired'

ALTER TABLE profiles ADD COLUMN subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN trial_ends_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN subscription_created_at TIMESTAMP;
```

**Or create a separate subscriptions table:**

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dodo_subscription_id TEXT,
  dodo_customer_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, trial, active, cancelled, expired
  plan TEXT, -- 'pro', 'team'
  trial_ends_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Phase 2: Server-Side Changes

#### 2.1 Update Checkout Endpoint

**File:** `server/src/routes/api.ts`

Modify `/checkout/create-session` to:
- Require authentication (user must be signed up)
- Store pending checkout in database
- Include user_id in Dodo metadata for webhook processing

```typescript
router.post('/checkout/create-session', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // Get user from auth
  const userId = req.user?.id
  const userEmail = req.user?.email
  
  // Create checkout with user metadata
  const requestBody = {
    product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
    return_url: `${CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    subscription_data: {
      trial_period_days: 7,
    },
    customer: {
      email: userEmail,
    },
    metadata: {
      user_id: userId,
    },
  }
  
  // ... create session and return checkout_url
})
```

#### 2.2 Add Subscription Status Endpoint

**File:** `server/src/routes/api.ts`

```typescript
// Check user's subscription status
router.get('/subscription/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id
  
  // Query subscription status from database
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('status, trial_ends_at, plan')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return res.json({ status: 'pending', hasAccess: false })
  }
  
  const hasAccess = ['trial', 'active'].includes(data.status)
  
  res.json({
    status: data.status,
    hasAccess,
    trialEndsAt: data.trial_ends_at,
    plan: data.plan,
  })
})
```

#### 2.3 Enhance Webhook Handler

**File:** `server/src/routes/api.ts`

Process Dodo webhooks to update subscription status:

```typescript
router.post('/webhooks/dodo', async (req, res: Response) => {
  const event = req.body
  
  // TODO: Verify webhook signature for security
  
  switch (event.type) {
    case 'subscription.active':
      // User completed checkout - activate subscription
      const userId = event.data.metadata?.user_id
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          dodo_subscription_id: event.data.subscription_id,
          status: 'trial', // or 'active' if no trial
          trial_ends_at: event.data.trial_ends_at,
          updated_at: new Date().toISOString(),
        })
      break
      
    case 'subscription.cancelled':
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('dodo_subscription_id', event.data.subscription_id)
      break
      
    // Handle other events...
  }
  
  res.json({ received: true })
})
```

---

### Phase 3: Client-Side Changes

#### 3.1 Create Payment Required Page

**File:** `client/src/pages/PaymentRequired.tsx`

New page shown to users who signed up but haven't completed payment:

```tsx
export function PaymentRequired() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const handleStartTrial = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      const data = await response.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="payment-required-page">
      <h1>Start Your Free Trial</h1>
      <p>Complete your registration by starting your 7-day free trial.</p>
      <button onClick={handleStartTrial} disabled={loading}>
        {loading ? 'Redirecting...' : 'Start Free Trial'}
      </button>
    </div>
  )
}
```

#### 3.2 Create Payment Success Page

**File:** `client/src/pages/PaymentSuccess.tsx`

Handle return from Dodo checkout:

```tsx
export function PaymentSuccess() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  
  useEffect(() => {
    // Poll subscription status (webhook may take a moment to process)
    const checkStatus = async () => {
      const response = await fetch('/api/subscription/status', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      const data = await response.json()
      
      if (data.hasAccess) {
        setStatus('success')
        setTimeout(() => navigate('/dashboard'), 2000)
      } else {
        // Retry after delay (webhook processing)
        setTimeout(checkStatus, 2000)
      }
    }
    
    checkStatus()
  }, [])
  
  return (
    <div className="payment-success-page">
      {status === 'loading' && <p>Processing your payment...</p>}
      {status === 'success' && <p>Welcome! Redirecting to your dashboard...</p>}
    </div>
  )
}
```

#### 3.3 Create Subscription Guard Component

**File:** `client/src/components/SubscriptionRoute.tsx`

Protect routes that require active subscription:

```tsx
export function SubscriptionRoute({ children }: { children: React.ReactNode }) {
  const { user, session, loading: authLoading } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!session) return
    
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        const data = await response.json()
        setSubscriptionStatus(data.status)
      } finally {
        setLoading(false)
      }
    }
    
    checkSubscription()
  }, [session])
  
  if (authLoading || loading) {
    return <div>Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/" replace />
  }
  
  // User is logged in but no active subscription
  if (!['trial', 'active'].includes(subscriptionStatus || '')) {
    return <Navigate to="/payment-required" replace />
  }
  
  return <>{children}</>
}
```

#### 3.4 Update Router Configuration

**File:** `client/src/App.tsx`

```tsx
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Auth /></PublicRoute>} />
      
      {/* Payment flow routes (auth required, no subscription required) */}
      <Route path="/payment-required" element={<ProtectedRoute><PaymentRequired /></ProtectedRoute>} />
      <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      
      {/* Protected routes (auth + subscription required) */}
      <Route path="/dashboard" element={<SubscriptionRoute><Welcome /></SubscriptionRoute>} />
      <Route path="/analytics" element={<SubscriptionRoute><Analytics /></SubscriptionRoute>} />
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

#### 3.5 Update Auth Flow After Signup

**File:** `client/src/pages/Auth.tsx`

Modify signup success handler to redirect to payment:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  // ... existing signup logic ...
  
  if (mode === 'signup') {
    // After successful signup, redirect to payment
    navigate('/payment-required')
  } else {
    // Login - check subscription status and redirect accordingly
    navigate('/dashboard') // SubscriptionRoute will handle redirect if needed
  }
}
```

---

### Phase 4: Environment & Configuration

#### 4.1 Update .env Files

**File:** `server/.env`

```env
# Dodo Payments
DODO_PAYMENTS_API_KEY=your_write_enabled_api_key
DODO_PRODUCT_ID=pdt_xxxxxxxxxxxxx
DODO_WEBHOOK_SECRET=your_webhook_secret
CLIENT_URL=http://localhost:5173
```

#### 4.2 Set Up Webhook in Dodo Dashboard

1. Go to Dodo Dashboard → Developer → Webhooks
2. Add webhook URL: `https://your-server.com/api/webhooks/dodo`
3. Select events:
   - `subscription.active`
   - `subscription.renewed`
   - `subscription.cancelled`
   - `subscription.on_hold`
   - `payment.succeeded`
   - `payment.failed`
4. Copy webhook signing secret to `.env`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `server/src/routes/api.ts` | Modify | Update checkout, add subscription status, enhance webhook |
| `client/src/pages/PaymentRequired.tsx` | Create | New page for payment prompt |
| `client/src/pages/PaymentSuccess.tsx` | Create | Handle checkout return |
| `client/src/components/SubscriptionRoute.tsx` | Create | Route guard for subscription |
| `client/src/pages/Auth.tsx` | Modify | Redirect to payment after signup |
| `client/src/App.tsx` | Modify | Update routes |
| `server/.env` | Modify | Add webhook secret |
| Supabase | Modify | Add subscriptions table |

---

## Testing Checklist

- [ ] New user signup redirects to payment-required page
- [ ] Payment-required page redirects to Dodo checkout
- [ ] Successful payment returns to payment-success page
- [ ] Payment-success polls and redirects to dashboard
- [ ] Dashboard is inaccessible without active subscription
- [ ] Existing users with subscription can access dashboard
- [ ] Cancelled subscription blocks dashboard access
- [ ] Webhook correctly updates subscription status
- [ ] Login flow checks subscription and redirects appropriately

---

## Test Cards (Dodo Test Mode)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |

**Expiry:** Any future date (e.g., 12/34)  
**CVV:** Any 3 digits (e.g., 123)
