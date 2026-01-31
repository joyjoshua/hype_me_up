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
          <h1 className="navbar-logo-text">Hype Me Up</h1>
        </div>
        
        <div className="navbar-links">
          <button className="nav-link active">
            Home
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
