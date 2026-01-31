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

  // Get user's full name from metadata
  const firstName = user?.user_metadata?.first_name || ''
  const lastName = user?.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'User'

  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <div className="header-logo">
          <h1 className="logo-text">Hype Me Up</h1>
        </div>
        <div className="header-actions">
          <button className="header-analytics-button" onClick={handleAnalytics}>
            📊 Analytics
          </button>
          <button className="header-logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="welcome-main">
        <div className="welcome-greeting">
          <h1>Welcome, {fullName}!</h1>
        </div>
        
        <VoiceAgentContainer />
      </main>
    </div>
  )
}
