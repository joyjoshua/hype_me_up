import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAnalytics } from '../../hooks/useAnalytics'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import './Analytics.css'

// Apple-inspired color palette
const COLORS = ['#0071e3', '#30d158', '#bf5af2', '#ff9f0a', '#ff375f', '#5e5ce6']

// Custom tooltip style
const tooltipStyle = {
  backgroundColor: 'rgba(29, 29, 31, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '12px 16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
}

export function Analytics() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { summary, exercises, consistency, workouts, loading, error } = useAnalytics()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleBack = () => {
    navigate('/')
  }

  // Get user's first name
  const firstName = user?.user_metadata?.first_name || ''
  const displayName = firstName || 'Your'

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const exerciseChartData = exercises.slice(0, 6).map(e => ({
    name: e.exercise.length > 10 ? e.exercise.slice(0, 10) + '...' : e.exercise,
    count: e.count,
    volume: e.total_reps
  }))

  const pieData = exercises.slice(0, 5).map(e => ({
    name: e.exercise,
    value: e.count
  }))

  return (
    <div className="analytics-page">
      {/* Glass Navbar */}
      <nav className="analytics-navbar">
        <div className="navbar-logo">
          <h1 className="navbar-logo-text">Hype Me Up</h1>
        </div>
        
        <div className="navbar-links">
          <button className="nav-link" onClick={handleBack}>
            Home
          </button>
          <button className="nav-link active">
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
      <main className="analytics-main">
        {/* Page Header */}
        <header className="analytics-header">
          <p className="header-eyebrow">Workout Insights</p>
          <h2 className="header-title">{displayName}'s Progress</h2>
        </header>

        {/* Stats Bento Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <span className="stat-value">{consistency?.current_streak || 0}</span>
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💪</span>
            <span className="stat-value">{summary?.total_workouts || 0}</span>
            <span className="stat-label">Total Workouts</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">{summary?.total_time_formatted || '0m'}</span>
            <span className="stat-label">Total Time</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{summary?.total_volume?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Volume</span>
          </div>
        </section>

        {/* Charts Grid */}
        <section className="charts-grid">
          {/* Exercise Frequency Bar Chart */}
          <div className="glass-card">
            <h3 className="glass-card-title">Exercise Frequency</h3>
            {exerciseChartData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exerciseChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6e6e73" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis 
                      stroke="#6e6e73" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: '#f5f5f7', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#86868b' }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#0071e3" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-chart">No exercise data yet</div>
            )}
          </div>

          {/* Exercise Distribution Pie Chart */}
          <div className="glass-card">
            <h3 className="glass-card-title">Exercise Distribution</h3>
            {pieData.length > 0 ? (
              <>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: '#f5f5f7', fontWeight: 600 }}
                        itemStyle={{ color: '#86868b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="pie-legend">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="legend-item">
                      <span
                        className="legend-color"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="legend-label">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-chart">No exercise data yet</div>
            )}
          </div>
        </section>

        {/* Consistency Section */}
        <section className="consistency-section">
          <div className="glass-card">
            <h3 className="glass-card-title">Consistency</h3>
            <div className="consistency-grid">
              <div className="consistency-stat">
                <span className="consistency-value">{consistency?.current_streak || 0}</span>
                <span className="consistency-label">Current Streak</span>
              </div>
              <div className="consistency-stat">
                <span className="consistency-value">{consistency?.longest_streak || 0}</span>
                <span className="consistency-label">Longest Streak</span>
              </div>
              <div className="consistency-stat">
                <span className="consistency-value">{consistency?.weekly_average || 0}</span>
                <span className="consistency-label">Weekly Average</span>
              </div>
              <div className="consistency-stat">
                <span className="consistency-value">{consistency?.this_month_count || 0}</span>
                <span className="consistency-label">This Month</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Workouts Table */}
        <section className="table-section">
          <div className="glass-card">
            <h3 className="glass-card-title">Recent Workouts</h3>
            {workouts.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Exercise</th>
                      <th>Activity</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workouts.map(workout => (
                      <tr key={workout.id}>
                        <td>{new Date(workout.created_at).toLocaleDateString()}</td>
                        <td className="exercise-name">{workout.workout_performed}</td>
                        <td>{workout.activity || '-'}</td>
                        <td>{workout.sets || '-'}</td>
                        <td>{workout.reps || '-'}</td>
                        <td>{workout.workout_time || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-table">
                No workouts recorded yet. Start a session to track your progress!
              </div>
            )}
          </div>
        </section>

        {/* Exercises Breakdown Table */}
        <section className="table-section">
          <div className="glass-card">
            <h3 className="glass-card-title">Exercise Breakdown</h3>
            {exercises.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Exercise</th>
                      <th>Times</th>
                      <th>Sets</th>
                      <th>Reps</th>
                      <th>Time</th>
                      <th>Last Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map(exercise => (
                      <tr key={exercise.exercise}>
                        <td className="exercise-name">{exercise.exercise}</td>
                        <td>{exercise.count}</td>
                        <td>{exercise.total_sets}</td>
                        <td>{exercise.total_reps}</td>
                        <td>{exercise.total_time_formatted}</td>
                        <td>{new Date(exercise.last_performed).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-table">No exercises recorded yet</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
