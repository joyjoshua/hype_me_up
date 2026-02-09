import { supabaseAdmin } from '../lib/supabase.js'

// ============================================
// WORKOUT REPOSITORY
// Handles all database operations for workout_logs table
// ============================================

export interface WorkoutLog {
    id?: string
    user_id: string
    workout_performed: string
    activity?: string
    sets?: number | null
    reps?: number | null
    muscle_target?: string
    workout_time?: string
    workout_time_seconds?: number | null
    created_at?: string
}

export interface WorkoutFilters {
    user_id: string
    limit?: number
    offset?: number
}

export class WorkoutRepository {
    /**
     * Create a new workout log entry
     */
    async create(workout: WorkoutLog) {
        const { data, error } = await supabaseAdmin
            .from('workout_logs')
            .insert({
                user_id: workout.user_id,
                workout_performed: workout.workout_performed,
                activity: workout.activity,
                sets: workout.sets || null,
                reps: workout.reps || null,
                muscle_target: workout.muscle_target,
                workout_time: workout.workout_time,
                workout_time_seconds: workout.workout_time_seconds,
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    /**
     * Find all workouts for a user with pagination
     */
    async findByUserId({ user_id, limit = 50, offset = 0 }: WorkoutFilters) {
        const { data, error } = await supabaseAdmin
            .from('workout_logs')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) throw error
        return data
    }

    /**
     * Find a single workout by ID
     */
    async findById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('workout_logs')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    /**
     * Get all workouts for a user (for analytics)
     */
    async findAllByUserId(user_id: string) {
        const { data, error } = await supabaseAdmin
            .from('workout_logs')
            .select('*')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    }

    /**
     * Get workouts with selected fields for exercise analytics
     */
    async findExerciseDataByUserId(user_id: string) {
        const { data, error } = await supabaseAdmin
            .from('workout_logs')
            .select('workout_performed, sets, reps, workout_time_seconds, created_at')
            .eq('user_id', user_id)

        if (error) throw error
        return data
    }

    /**
     * Get workout dates for consistency analytics
     */
    async findWorkoutDatesByUserId(user_id: string) {
        const { data, error } = await supabaseAdmin
            .from('workout_logs')
            .select('created_at')
            .eq('user_id', user_id)
            .order('created_at', { ascending: true })

        if (error) throw error
        return data
    }
}

// Export singleton instance
export const workoutRepository = new WorkoutRepository()
