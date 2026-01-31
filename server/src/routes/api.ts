import { Router, Response } from 'express'
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

// Protected route - returns current user info
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    user: req.user,
    message: 'You are authenticated!',
  })
})

// Generate LiveKit room access token
router.post('/livekit/token', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomName, participantIdentity, agentName } = req.body

    if (!roomName) {
      res.status(400).json({ error: 'roomName is required' })
      return
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.LIVEKIT_URL

    if (!apiKey || !apiSecret) {
      res.status(500).json({ error: 'LiveKit credentials not configured' })
      return
    }

    if (!livekitUrl) {
      res.status(500).json({ error: 'LiveKit URL not configured' })
      return
    }

    // Use authenticated user's ID as identity, or provided identity
    const identity = participantIdentity || req.user?.id || 'user'

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: req.user?.firstName || identity,
    })

    // Grant permissions
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    })

    // Generate JWT token
    const token = await at.toJwt()

    // Explicitly dispatch the named agent to this room
    // This is required because named agents don't auto-dispatch
    const targetAgent = agentName || 'hype_me_up'
    try {
      const dispatchClient = new AgentDispatchClient(livekitUrl, apiKey, apiSecret)
      await dispatchClient.createDispatch(roomName, targetAgent, {
        metadata: JSON.stringify({ userId: identity }),
      })
      console.log(`Agent "${targetAgent}" dispatched to room "${roomName}"`)
    } catch (dispatchError) {
      // Log but don't fail - agent might already be dispatched or room might not exist yet
      console.warn('Agent dispatch warning:', dispatchError)
    }

    res.json({ token })
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    res.status(500).json({ 
      error: 'Failed to generate token',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ============================================
// Voice Agent Summary Endpoint
// Stores workout data from voice agent calls
// ============================================

// Helper: Convert "MM:SS" to seconds
const parseWorkoutTime = (time: string): number | null => {
  if (!time) return null
  const parts = time.split(':').map(Number)
  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return (minutes * 60) + (seconds || 0)
  }
  return null
}

router.post('/voice-agent-summary', async (req, res) => {
  console.log('===========================================')
  console.log('[Analytics] Voice Agent Summary Endpoint Called')
  console.log('===========================================')
  console.log('[Analytics] Request Body:', JSON.stringify(req.body, null, 2))
  
  try {
    const { 
      user_id,      // Preferred: passed directly from voice agent metadata
      room_id,      // Fallback: legacy field, used as user_id if user_id not provided
      workout_performed, 
      activity, 
      sets, 
      reps, 
      muscle_target, 
      workout_time 
    } = req.body

    // Use user_id if provided, otherwise fall back to room_id
    const finalUserId = user_id || room_id

    if (!finalUserId) {
      console.error('[Analytics] Error: No user_id or room_id provided')
      res.status(400).json({ 
        error: 'user_id is required' 
      })
      return
    }

    if (!workout_performed) {
      console.error('[Analytics] Error: workout_performed is required')
      res.status(400).json({ error: 'workout_performed is required' })
      return
    }

    // Calculate duration in seconds
    const workout_time_seconds = parseWorkoutTime(workout_time)

    console.log('[Analytics] Saving workout log:')
    console.log('  - User ID:', finalUserId)
    console.log('  - Workout:', workout_performed)
    console.log('  - Activity:', activity)
    console.log('  - Sets:', sets)
    console.log('  - Reps:', reps)
    console.log('  - Duration:', workout_time, '→', workout_time_seconds, 'seconds')

    // Insert workout log into Supabase
    const { data, error } = await supabaseAdmin
      .from('workout_logs')
      .insert({
        user_id: finalUserId,
        workout_performed,
        activity,
        sets: sets || null,
        reps: reps || null,
        muscle_target,
        workout_time,
        workout_time_seconds,
      })
      .select()
      .single()

    if (error) {
      console.error('[Analytics] Supabase insert error:', error)
      res.status(500).json({ 
        error: 'Failed to save workout log',
        details: error.message 
      })
      return
    }

    console.log('[Analytics] Workout log saved successfully:', data.id)
    console.log('===========================================')

    res.json({ 
      success: true, 
      workout_id: data.id,
      message: 'Workout log saved successfully'
    })
  } catch (error) {
    console.error('[Analytics] Error processing voice agent summary:', error)
    res.status(500).json({
      error: 'Failed to process summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ============================================
// GET Workout Logs
// Fetch workout logs for a user
// ============================================
router.get('/workouts', async (req, res) => {
  try {
    const { user_id, limit = 50, offset = 0 } = req.query

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' })
      return
    }

    const { data, error } = await supabaseAdmin
      .from('workout_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      console.error('[Workouts] Supabase fetch error:', error)
      res.status(500).json({ 
        error: 'Failed to fetch workouts',
        details: error.message 
      })
      return
    }

    res.json({ 
      success: true, 
      workouts: data,
      count: data.length
    })
  } catch (error) {
    console.error('[Workouts] Error fetching workouts:', error)
    res.status(500).json({
      error: 'Failed to fetch workouts',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET single workout by ID
router.get('/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('workout_logs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[Workouts] Supabase fetch error:', error)
      res.status(404).json({ 
        error: 'Workout not found',
        details: error.message 
      })
      return
    }

    res.json({ 
      success: true, 
      workout: data
    })
  } catch (error) {
    console.error('[Workouts] Error fetching workout:', error)
    res.status(500).json({
      error: 'Failed to fetch workout',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

// Helper: Format seconds to readable duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

// GET /api/analytics/summary - Overview stats
router.get('/analytics/summary', async (req, res) => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' })
      return
    }

    // Fetch all workouts for the user
    const { data: workouts, error } = await supabaseAdmin
      .from('workout_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Analytics] Summary fetch error:', error)
      res.status(500).json({ error: 'Failed to fetch analytics', details: error.message })
      return
    }

    // Calculate stats
    const totalWorkouts = workouts.length
    const totalTimeSeconds = workouts.reduce((sum, w) => sum + (w.workout_time_seconds || 0), 0)
    const totalVolume = workouts.reduce((sum, w) => sum + ((w.sets || 0) * (w.reps || 0)), 0)
    
    // Get unique workout days
    const uniqueDays = new Set(workouts.map(w => w.created_at.split('T')[0]))
    const activeDays = uniqueDays.size

    // Get most recent workout
    const lastWorkout = workouts.length > 0 ? workouts[0] : null

    // Calculate current streak
    let currentStreak = 0
    if (workouts.length > 0) {
      const sortedDays = Array.from(uniqueDays).sort().reverse()
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      
      // Check if user worked out today or yesterday
      if (sortedDays[0] === today || sortedDays[0] === yesterday) {
        currentStreak = 1
        for (let i = 1; i < sortedDays.length; i++) {
          const prevDate = new Date(sortedDays[i - 1])
          const currDate = new Date(sortedDays[i])
          const diffDays = (prevDate.getTime() - currDate.getTime()) / 86400000
          if (diffDays === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }

    res.json({
      success: true,
      summary: {
        total_workouts: totalWorkouts,
        total_time_seconds: totalTimeSeconds,
        total_time_formatted: formatDuration(totalTimeSeconds),
        total_volume: totalVolume,
        active_days: activeDays,
        current_streak: currentStreak,
        last_workout: lastWorkout ? {
          id: lastWorkout.id,
          workout_performed: lastWorkout.workout_performed,
          created_at: lastWorkout.created_at
        } : null
      }
    })
  } catch (error) {
    console.error('[Analytics] Summary error:', error)
    res.status(500).json({
      error: 'Failed to fetch analytics summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /api/analytics/exercises - Exercise breakdown
router.get('/analytics/exercises', async (req, res) => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' })
      return
    }

    const { data: workouts, error } = await supabaseAdmin
      .from('workout_logs')
      .select('workout_performed, sets, reps, workout_time_seconds, created_at')
      .eq('user_id', user_id)

    if (error) {
      console.error('[Analytics] Exercises fetch error:', error)
      res.status(500).json({ error: 'Failed to fetch exercises', details: error.message })
      return
    }

    // Group by exercise
    const exerciseMap = new Map<string, {
      count: number
      total_sets: number
      total_reps: number
      total_time_seconds: number
      last_performed: string
    }>()

    for (const workout of workouts) {
      const name = workout.workout_performed.toLowerCase().trim()
      const existing = exerciseMap.get(name) || {
        count: 0,
        total_sets: 0,
        total_reps: 0,
        total_time_seconds: 0,
        last_performed: ''
      }

      existing.count++
      existing.total_sets += workout.sets || 0
      existing.total_reps += (workout.sets || 0) * (workout.reps || 0)
      existing.total_time_seconds += workout.workout_time_seconds || 0
      if (!existing.last_performed || workout.created_at > existing.last_performed) {
        existing.last_performed = workout.created_at
      }

      exerciseMap.set(name, existing)
    }

    // Convert to array and sort by count
    const exercises = Array.from(exerciseMap.entries())
      .map(([name, stats]) => ({
        exercise: name,
        ...stats,
        total_time_formatted: formatDuration(stats.total_time_seconds)
      }))
      .sort((a, b) => b.count - a.count)

    res.json({
      success: true,
      exercises,
      total_unique_exercises: exercises.length
    })
  } catch (error) {
    console.error('[Analytics] Exercises error:', error)
    res.status(500).json({
      error: 'Failed to fetch exercise analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /api/analytics/consistency - Streak and frequency data
router.get('/analytics/consistency', async (req, res) => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' })
      return
    }

    const { data: workouts, error } = await supabaseAdmin
      .from('workout_logs')
      .select('created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Analytics] Consistency fetch error:', error)
      res.status(500).json({ error: 'Failed to fetch consistency data', details: error.message })
      return
    }

    // Get unique workout days
    const workoutDays = [...new Set(workouts.map(w => w.created_at.split('T')[0]))].sort()

    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    for (let i = 0; i < workoutDays.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prevDate = new Date(workoutDays[i - 1])
        const currDate = new Date(workoutDays[i])
        const diffDays = (currDate.getTime() - prevDate.getTime()) / 86400000
        
        if (diffDays === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    // Current streak (only counts if last workout was today or yesterday)
    if (workoutDays.length > 0) {
      const lastDay = workoutDays[workoutDays.length - 1]
      if (lastDay === today || lastDay === yesterday) {
        currentStreak = tempStreak
      }
    }

    // Weekly frequency (last 4 weeks)
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0]
    const recentDays = workoutDays.filter(d => d >= fourWeeksAgo)
    const weeklyAverage = recentDays.length / 4

    // Monthly calendar (current month workout days)
    const currentMonth = new Date().toISOString().slice(0, 7)
    const thisMonthDays = workoutDays.filter(d => d.startsWith(currentMonth))

    res.json({
      success: true,
      consistency: {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        total_active_days: workoutDays.length,
        weekly_average: Math.round(weeklyAverage * 10) / 10,
        this_month_days: thisMonthDays,
        this_month_count: thisMonthDays.length,
        all_workout_days: workoutDays
      }
    })
  } catch (error) {
    console.error('[Analytics] Consistency error:', error)
    res.status(500).json({
      error: 'Failed to fetch consistency data',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
