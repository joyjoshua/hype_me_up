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
  Cell,
  LineChart,
  Line
} from 'recharts'
import './Analytics.css'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']

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

  // Get user's name
  const firstName = user?.user_metadata?.first_name || ''
  const lastName = user?.user_metadata?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'User'

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const exerciseChartData = exercises.slice(0, 6).map(e => ({
    name: e.exercise.length > 12 ? e.exercise.slice(0, 12) + '...' : e.exercise,
    count: e.count,
    volume: e.total_reps
  }))

  const pieData = exercises.slice(0, 5).map(e => ({
    name: e.exercise,
    value: e.count
  }))

  // Monthly activity for line chart
  const monthlyActivity = consistency?.this_month_days.reduce((acc, day) => {
    const date = new Date(day).getDate()
    acc.push({ day: date, workouts: 1 })
    return acc
  }, [] as { day: number; workouts: number }[]) || []

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
          <h1 className="logo-text">Analytics</h1>
        </div>
        <button className="header-logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="analytics-main">
        <div className="analytics-greeting">
          <h2>{fullName}'s Workout Analytics</h2>
        </div>

        {/* Stats Cards */}
        <section className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <span className="stat-value">{consistency?.current_streak || 0}</span>
              <span className="stat-label">Day Streak</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💪</div>
            <div className="stat-content">
              <span className="stat-value">{summary?.total_workouts || 0}</span>
              <span className="stat-label">Total Workouts</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <span className="stat-value">{summary?.total_time_formatted || '0m'}</span>
              <span className="stat-label">Total Time</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-value">{summary?.total_volume || 0}</span>
              <span className="stat-label">Total Volume</span>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="charts-section">
          {/* Exercise Frequency Bar Chart */}
          <div className="chart-card">
            <h3>Exercise Frequency</h3>
            {exerciseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exerciseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No exercise data yet</div>
            )}
          </div>

          {/* Exercise Distribution Pie Chart */}
          <div className="chart-card">
            <h3>Exercise Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No exercise data yet</div>
            )}
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
          </div>
        </section>

        {/* Consistency Section */}
        <section className="consistency-section">
          <div className="chart-card full-width">
            <h3>Consistency Stats</h3>
            <div className="consistency-stats">
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
        <section className="workouts-section">
          <div className="chart-card full-width">
            <h3>Recent Workouts</h3>
            {workouts.length > 0 ? (
              <div className="workouts-table-wrapper">
                <table className="workouts-table">
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
                        <td>{workout.workout_performed}</td>
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
              <div className="empty-table">No workouts recorded yet. Start a workout to see your data!</div>
            )}
          </div>
        </section>

        {/* Exercises Table */}
        <section className="exercises-section">
          <div className="chart-card full-width">
            <h3>Exercise Breakdown</h3>
            {exercises.length > 0 ? (
              <div className="workouts-table-wrapper">
                <table className="workouts-table">
                  <thead>
                    <tr>
                      <th>Exercise</th>
                      <th>Times Performed</th>
                      <th>Total Sets</th>
                      <th>Total Reps</th>
                      <th>Total Time</th>
                      <th>Last Performed</th>
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
