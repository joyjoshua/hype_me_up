import { workoutRepository, WorkoutLog } from '../repositories/index.js'

// ============================================
// WORKOUT SERVICE
// Business logic for workout operations
// ============================================

export interface CreateWorkoutInput {
    user_id: string
    workout_performed: string
    activity?: string
    sets?: number
    reps?: number
    muscle_target?: string
    workout_time?: string
}

export interface AnalyticsSummary {
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

export interface ExerciseStats {
    exercise: string
    count: number
    total_sets: number
    total_reps: number
    total_time_seconds: number
    total_time_formatted: string
    last_performed: string
}

export interface ConsistencyStats {
    current_streak: number
    longest_streak: number
    total_active_days: number
    weekly_average: number
    this_month_days: string[]
    this_month_count: number
    all_workout_days: string[]
}

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

// Helper: Format seconds to readable duration
const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
        return `${hours}h ${mins}m`
    }
    return `${mins}m`
}

export class WorkoutService {
    /**
     * Create a new workout log from voice agent summary
     */
    async createFromVoiceAgent(input: CreateWorkoutInput): Promise<WorkoutLog> {
        const workout_time_seconds = input.workout_time ? parseWorkoutTime(input.workout_time) : null

        console.log('[WorkoutService] Creating workout log:')
        console.log('  - User ID:', input.user_id)
        console.log('  - Workout:', input.workout_performed)
        console.log('  - Activity:', input.activity)
        console.log('  - Sets:', input.sets)
        console.log('  - Reps:', input.reps)
        console.log('  - Duration:', input.workout_time, '→', workout_time_seconds, 'seconds')

        return workoutRepository.create({
            user_id: input.user_id,
            workout_performed: input.workout_performed,
            activity: input.activity,
            sets: input.sets || null,
            reps: input.reps || null,
            muscle_target: input.muscle_target,
            workout_time: input.workout_time,
            workout_time_seconds,
        })
    }

    /**
     * Get paginated workouts for a user
     */
    async getWorkouts(user_id: string, limit = 50, offset = 0) {
        return workoutRepository.findByUserId({ user_id, limit, offset })
    }

    /**
     * Get single workout by ID
     */
    async getWorkoutById(id: string) {
        return workoutRepository.findById(id)
    }

    /**
     * Calculate analytics summary for a user
     */
    async getAnalyticsSummary(user_id: string): Promise<AnalyticsSummary> {
        const workouts = await workoutRepository.findAllByUserId(user_id)

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

        return {
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
    }

    /**
     * Get exercise breakdown analytics
     */
    async getExerciseAnalytics(user_id: string): Promise<{ exercises: ExerciseStats[], total_unique_exercises: number }> {
        const workouts = await workoutRepository.findExerciseDataByUserId(user_id)

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

        return {
            exercises,
            total_unique_exercises: exercises.length
        }
    }

    /**
     * Get consistency/streak analytics
     */
    async getConsistencyAnalytics(user_id: string): Promise<ConsistencyStats> {
        const workouts = await workoutRepository.findWorkoutDatesByUserId(user_id)

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

        return {
            current_streak: currentStreak,
            longest_streak: longestStreak,
            total_active_days: workoutDays.length,
            weekly_average: Math.round(weeklyAverage * 10) / 10,
            this_month_days: thisMonthDays,
            this_month_count: thisMonthDays.length,
            all_workout_days: workoutDays
        }
    }
}

// Export singleton instance
export const workoutService = new WorkoutService()
