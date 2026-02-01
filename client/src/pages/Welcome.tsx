import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { VoiceAgentContainer } from '../components/VoiceAgent/VoiceAgentContainer'
import './Welcome.css'

export function Welcome() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAnalytics = () => {
    navigate('/analytics')
  }

  // Get user's first name for greeting
  const firstName = user?.user_metadata?.first_name || ''
  const greeting = firstName ? `Hey, ${firstName}.` : 'Hey there.'

  return (
    <div className="welcome-page">
      {/* Glass Navbar */}
      <nav className="welcome-navbar">
        <div className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="dashLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="24" fill="url(#dashLogoGradient)" />
            <path d="M16 28C16 28 18 24 24 24C30 24 32 28 32 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="18" cy="20" r="2" fill="white" />
            <circle cx="30" cy="20" r="2" fill="white" />
          </svg>
          <h1 className="navbar-logo-text">HypeMeUp</h1>
        </div>
        
        <div className="navbar-links">
          <button className="nav-link active">
            Dashboard
          </button>
          <button className="nav-link" onClick={handleAnalytics}>
            Analytics
          </button>
        </div>

        <div className="navbar-actions">
          <button className="nav-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="welcome-main">
        {/* Hero Section */}
        <section className="welcome-hero">
          <p className="hero-eyebrow">Your Personal AI Coach</p>
          <h1 className="hero-title">{greeting}</h1>
          <p className="hero-subtitle">Ready to crush your workout? Let's get started.</p>
        </section>

        {/* Voice Agent */}
        <section className="voice-agent-section">
          <VoiceAgentContainer />
        </section>
      </main>
    </div>
  )
}
