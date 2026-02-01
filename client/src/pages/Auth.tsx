import { useState, FormEvent, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

type AuthMode = 'login' | 'signup'
type BillingPeriod = 'monthly' | 'yearly'

export function Auth() {
  const location = useLocation()
  const initialMode: AuthMode = location.pathname === '/signup' ? 'signup' : 'login'
  
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [billing, setBilling] = useState<BillingPeriod>('yearly')
  const { signIn, signUp, user, session } = useAuth()
  const navigate = useNavigate()
  
  const heroRef = useRef<HTMLElement>(null)
  const pricingRef = useRef<HTMLElement>(null)

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle checkout - redirect to Dodo Payments hosted checkout
  const handleCheckout = async (planName: string) => {
    // If user is not logged in, prompt them to sign up first
    if (!user || !session) {
      switchMode('signup')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setCheckoutLoading(planName)
    
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan: planName.toLowerCase(),
          billing,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setError('')
  }

  const switchMode = (newMode: AuthMode) => {
    resetForm()
    setMode(newMode)
    navigate(newMode === 'login' ? '/login' : '/signup', { replace: true })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('First and last name are required')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      const { error } = await signUp(email, password, firstName.trim(), lastName.trim())
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Go directly to dashboard (payment flow disabled for now)
        navigate('/dashboard')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        navigate('/dashboard')
      }
    }
  }

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      features: [
        '3 AI coaching sessions per week',
        'Basic progress tracking',
        'Access to community workouts',
        'Email support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      description: 'For serious fitness enthusiasts',
      price: { monthly: 19, yearly: 15 },
      features: [
        'Unlimited AI coaching sessions',
        'Advanced analytics & insights',
        'Personalized workout plans',
        'Voice form correction',
        'Priority support',
        'Export your data',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Team',
      description: 'For gyms and training groups',
      price: { monthly: 49, yearly: 39 },
      features: [
        'Everything in Pro',
        'Up to 25 team members',
        'Team leaderboards',
        'Admin dashboard',
        'Custom branding',
        'API access',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  return (
    <div className="auth-landing-page">
      {/* ============================================
          SECTION 1: AUTH SPLIT LAYOUT
          ============================================ */}
      <section className="auth-split-section">
        {/* Left Side - Branding */}
        <div className="auth-branding-panel">
          <div className="auth-branding-content">
            {/* Logo */}
            <div className="auth-brand-logo">
              <div className="auth-logo-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="24" fill="url(#logoGradient)" />
                  <path d="M16 28C16 28 18 24 24 24C30 24 32 28 32 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="18" cy="20" r="2" fill="white" />
                  <circle cx="30" cy="20" r="2" fill="white" />
                </svg>
              </div>
              <span className="auth-logo-text">HypeMeUp</span>
            </div>

            {/* Hero Content */}
            <div className="auth-hero-content">
              <h1 className="auth-hero-title">
                Your AI Coach.<br />
                <span className="gradient-text">Always There.</span>
              </h1>
              <p className="auth-hero-subtitle">
                Get personalized motivation, real-time feedback, and unwavering support 
                from an AI that truly understands your fitness journey.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="auth-feature-pills">
              <div className="feature-pill">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L10.163 5.279L15 6.006L11.5 9.371L12.326 14L8 11.779L3.674 14L4.5 9.371L1 6.006L5.837 5.279L8 1Z" fill="currentColor"/>
                </svg>
                Voice-Powered
              </div>
              <div className="feature-pill">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                24/7 Available
              </div>
              <div className="feature-pill">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3a5 5 0 0 0-5 5c0 1.5.7 2.9 1.8 3.9L8 15l3.2-3.1A5 5 0 0 0 8 3z" fill="currentColor"/>
                </svg>
                Personalized
              </div>
            </div>

            {/* Social Proof */}
            <div className="auth-social-proof">
              <div className="avatar-stack">
                <div className="avatar" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>J</div>
                <div className="avatar" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>M</div>
                <div className="avatar" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>A</div>
                <div className="avatar" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>K</div>
              </div>
              <p className="social-proof-text">
                <strong>Building a community of people crushing their fitness goals</strong>
              </p>
            </div>

            {/* Scroll Indicator */}
            <button className="scroll-indicator" onClick={scrollToHero}>
              <span>Learn more</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M6 12l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="auth-branding-decoration">
            <div className="glow-orb glow-orb-1"></div>
            <div className="glow-orb glow-orb-2"></div>
            <div className="glow-orb glow-orb-3"></div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="auth-form-panel">
          <div className="auth-form-container">
            {/* Mode Toggle - Fixed at top */}
            <div className="auth-mode-toggle">
              <button 
                className={`mode-toggle-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Sign In
              </button>
              <button 
                className={`mode-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => switchMode('signup')}
              >
                Create Account
              </button>
              <div className={`mode-toggle-indicator ${mode}`}></div>
            </div>

            {/* Scrollable Form Content */}
            <div className="auth-form-scroll">
              {/* Form Header */}
              <div className="auth-form-header">
                <h2 className="auth-form-title">
                  {mode === 'login' ? 'Welcome back' : 'Get started for free'}
                </h2>
                <p className="auth-form-subtitle">
                  {mode === 'login' 
                    ? 'Sign in to continue your journey' 
                    : 'Create your account and start today'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="auth-error-banner">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 4v4M8 10v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-form-fields">
                {mode === 'signup' && (
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="firstName">First Name</label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>

                {mode === 'signup' && (
                  <div className="form-field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Only show Google OAuth and Terms on Sign In tab */}
              {mode === 'login' && (
                <>
                  {/* Divider */}
                  <div className="auth-divider-line">
                    <span>or continue with</span>
                  </div>

                  {/* OAuth Buttons */}
                  <div className="auth-oauth-buttons auth-oauth-single">
                    <button type="button" className="oauth-btn" disabled>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                  </div>

                  {/* Terms */}
                  <p className="auth-terms">
                    By continuing, you agree to our{' '}
                    <Link to="/terms">Terms of Service</Link> and{' '}
                    <Link to="/privacy">Privacy Policy</Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: HERO / FEATURES
          ============================================ */}
      <section className="hero-section" ref={heroRef}>
        <div className="hero-section-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            AI-Powered Fitness Coach
          </div>
          <h2 className="hero-section-title">
            Your Personal Trainer,<br />
            <span className="gradient-text">Powered by AI</span>
          </h2>
          <p className="hero-section-description">
            HypeMeUp uses advanced voice AI to provide real-time coaching, 
            motivation, and personalized feedback. It's like having a world-class 
            trainer in your pocket, available 24/7.
          </p>

          {/* Features Grid */}
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-purple">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16a4 4 0 0 0 8 0m-4-6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Voice-First Experience</h3>
              <p className="feature-description">
                Talk naturally with your AI coach. Get real-time feedback without touching your phone.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-green">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4v6m0 12v6M4 16h6m12 0h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="feature-title">Personalized Training</h3>
              <p className="feature-description">
                AI that learns your strengths and weaknesses to create workouts tailored for you.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-red">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <path d="M8 24l6-8 4 4 6-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="feature-title">Progress Analytics</h3>
              <p className="feature-description">
                Track your journey with detailed analytics. See improvements and stay motivated.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-yellow">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 10v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="feature-title">24/7 Availability</h3>
              <p className="feature-description">
                Your coach never sleeps. Get guidance and support whenever you need it.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="how-it-works">
            <h3 className="how-it-works-title">How It Works</h3>
            <div className="steps-row">
              <div className="step-item">
                <div className="step-number">01</div>
                <h4>Tell Us Your Goals</h4>
                <p>Share your fitness objectives and experience level.</p>
              </div>
              <div className="step-connector"></div>
              <div className="step-item">
                <div className="step-number">02</div>
                <h4>Start Your Session</h4>
                <p>Launch your workout and let AI guide you in real-time.</p>
              </div>
              <div className="step-connector"></div>
              <div className="step-item">
                <div className="step-number">03</div>
                <h4>Track & Improve</h4>
                <p>Review progress and watch AI optimize your training.</p>
              </div>
            </div>
          </div>

          <button className="scroll-to-pricing" onClick={scrollToPricing}>
            View Pricing
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M6 12l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ============================================
          SECTION 3: PRICING
          ============================================ */}
      <section className="pricing-section" ref={pricingRef}>
        <div className="pricing-section-content">
          <span className="pricing-eyebrow">Pricing</span>
          <h2 className="pricing-section-title">
            Simple, transparent<br />
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="pricing-section-description">
            Choose the plan that fits your fitness journey. All plans include 
            a 14-day free trial with no credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <button 
              className={`billing-option ${billing === 'monthly' ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`billing-option ${billing === 'yearly' ? 'active' : ''}`}
              onClick={() => setBilling('yearly')}
            >
              Yearly
            </button>
            <div className={`billing-indicator ${billing}`}></div>
            <span className="save-badge">-20%</span>
          </div>

          {/* Plans */}
          <div className="plans-grid">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`plan-card ${plan.popular ? 'plan-popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-badge">Most Popular</div>
                )}
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                </div>
                <div className="plan-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">
                    {plan.price[billing]}
                  </span>
                  {plan.price[billing] > 0 && (
                    <span className="price-period">/month</span>
                  )}
                </div>
                {billing === 'yearly' && plan.price.yearly > 0 && (
                  <p className="billed-yearly">
                    Billed ${plan.price.yearly * 12}/year
                  </p>
                )}
                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="plan-feature">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path 
                          d="M3 8l3 3 7-7" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  className={`plan-cta ${plan.popular ? 'plan-cta-primary' : ''}`}
                  onClick={() => plan.name === 'Free' ? switchMode('signup') : handleCheckout(plan.name)}
                  disabled={checkoutLoading === plan.name}
                >
                  {checkoutLoading === plan.name ? (
                    <>
                      <span className="spinner"></span>
                      Redirecting...
                    </>
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="faq-section">
            <h3 className="faq-title">Frequently Asked Questions</h3>
            <div className="faq-grid">
              <div className="faq-item">
                <h4>Can I cancel anytime?</h4>
                <p>Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
              </div>
              <div className="faq-item">
                <h4>What's included in the free trial?</h4>
                <p>The 14-day free trial includes full access to all Pro features. No credit card required to start.</p>
              </div>
              <div className="faq-item">
                <h4>Can I switch plans later?</h4>
                <p>Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
              </div>
              <div className="faq-item">
                <h4>Is there a student discount?</h4>
                <p>Yes! Students get 50% off any paid plan. Contact our support team with a valid student ID.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="auth-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="24" fill="url(#footerLogoGrad)" />
                <path d="M16 28C16 28 18 24 24 24C30 24 32 28 32 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="18" cy="20" r="2" fill="white" />
                <circle cx="30" cy="20" r="2" fill="white" />
              </svg>
              <span>HypeMeUp</span>
            </div>
            <p>Your AI-powered fitness companion.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} HypeMeUp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
