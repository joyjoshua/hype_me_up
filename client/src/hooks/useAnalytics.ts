import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface WorkoutLog {
  id: string
  user_id: string
  workout_performed: string
  activity: string
  sets: number
  reps: number
  muscle_target: string
  workout_time: string
  workout_time_seconds: number
  created_at: string
}

interface AnalyticsSummary {
  total_workouts: number
  total_time_seconds: number
  total_time_formatted: string
  total_volume: number
  active_days: number
  current_streak: number
  last_workout: {
    id: string
    workout_performed: string
    created_at: string
  } | null
}

interface ExerciseStats {
  exercise: string
  count: number
  total_sets: number
  total_reps: number
  total_time_seconds: number
  total_time_formatted: string
  last_performed: string
}

interface ConsistencyData {
  current_streak: number
  longest_streak: number
  total_active_days: number
  weekly_average: number
  this_month_days: string[]
  this_month_count: number
  all_workout_days: string[]
}

export function useAnalytics() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [exercises, setExercises] = useState<ExerciseStats[]>([])
  const [consistency, setConsistency] = useState<ConsistencyData | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return

    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)

      try {
        const userId = user.id

        // Fetch all analytics data in parallel
        const [summaryRes, exercisesRes, consistencyRes, workoutsRes] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/summary?user_id=${userId}`),
          fetch(`${API_BASE}/api/analytics/exercises?user_id=${userId}`),
          fetch(`${API_BASE}/api/analytics/consistency?user_id=${userId}`),
          fetch(`${API_BASE}/api/workouts?user_id=${userId}&limit=10`)
        ])

        const [summaryData, exercisesData, consistencyData, workoutsData] = await Promise.all([
          summaryRes.json(),
          exercisesRes.json(),
          consistencyRes.json(),
          workoutsRes.json()
        ])

        if (summaryData.success) setSummary(summaryData.summary)
        if (exercisesData.success) setExercises(exercisesData.exercises)
        if (consistencyData.success) setConsistency(consistencyData.consistency)
        if (workoutsData.success) setWorkouts(workoutsData.workouts)

      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user?.id])

  const refetch = () => {
    if (user?.id) {
      setLoading(true)
      // Trigger re-fetch by changing a dependency
      const event = new Event('refetch-analytics')
      window.dispatchEvent(event)
    }
  }

  return {
    summary,
    exercises,
    consistency,
    workouts,
    loading,
    error,
    refetch
  }
}
