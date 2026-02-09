import { Request, Response } from 'express'
import { workoutService } from '../services/index.js'

// ============================================
// WORKOUT CONTROLLER
// Handles HTTP request/response for workout endpoints
// ============================================

export class WorkoutController {
    /**
     * POST /api/voice-agent-summary
     * Store workout data from voice agent calls
     */
    async createFromVoiceAgent(req: Request, res: Response) {
        console.log('===========================================')
        console.log('[WorkoutController] Voice Agent Summary Endpoint Called')
        console.log('===========================================')
        console.log('[WorkoutController] Request Body:', JSON.stringify(req.body, null, 2))

        try {
            const {
                user_id,
                room_id,      // Legacy fallback
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
                console.error('[WorkoutController] Error: No user_id or room_id provided')
                res.status(400).json({ error: 'user_id is required' })
                return
            }

            if (!workout_performed) {
                console.error('[WorkoutController] Error: workout_performed is required')
                res.status(400).json({ error: 'workout_performed is required' })
                return
            }

            const workout = await workoutService.createFromVoiceAgent({
                user_id: finalUserId,
                workout_performed,
                activity,
                sets,
                reps,
                muscle_target,
                workout_time
            })

            console.log('[WorkoutController] Workout log saved successfully:', workout.id)
            console.log('===========================================')

            res.json({
                success: true,
                workout_id: workout.id,
                message: 'Workout log saved successfully'
            })
        } catch (error) {
            console.error('[WorkoutController] Error processing voice agent summary:', error)
            res.status(500).json({
                error: 'Failed to process summary',
                message: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    /**
     * GET /api/workouts
     * Fetch workout logs for a user with pagination
     */
    async getWorkouts(req: Request, res: Response) {
        try {
            const { user_id, limit = '50', offset = '0' } = req.query

            if (!user_id) {
                res.status(400).json({ error: 'user_id is required' })
                return
            }

            const workouts = await workoutService.getWorkouts(
                user_id as string,
                Number(limit),
                Number(offset)
            )

            res.json({
                success: true,
                workouts,
                count: workouts.length
            })
        } catch (error) {
            console.error('[WorkoutController] Error fetching workouts:', error)
            res.status(500).json({
                error: 'Failed to fetch workouts',
                message: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    /**
     * GET /api/workouts/:id
     * Fetch single workout by ID
     */
    async getWorkoutById(req: Request, res: Response) {
        try {
            const { id } = req.params

            if (!id || typeof id !== 'string') {
                res.status(400).json({ error: 'Valid workout id is required' })
                return
            }

            const workout = await workoutService.getWorkoutById(id)

            res.json({
                success: true,
                workout
            })
        } catch (error) {
            console.error('[WorkoutController] Error fetching workout:', error)
            res.status(404).json({
                error: 'Workout not found',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }

    /**
     * GET /api/analytics/summary
     * Overview stats for a user
     */
    async getAnalyticsSummary(req: Request, res: Response) {
        try {
            const { user_id } = req.query

            if (!user_id) {
                res.status(400).json({ error: 'user_id is required' })
                return
            }

            const summary = await workoutService.getAnalyticsSummary(user_id as string)

            res.json({
                success: true,
                summary
            })
        } catch (error) {
            console.error('[WorkoutController] Summary error:', error)
            res.status(500).json({
                error: 'Failed to fetch analytics summary',
                message: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    /**
     * GET /api/analytics/exercises
     * Exercise breakdown analytics
     */
    async getExerciseAnalytics(req: Request, res: Response) {
        try {
            const { user_id } = req.query

            if (!user_id) {
                res.status(400).json({ error: 'user_id is required' })
                return
            }

            const result = await workoutService.getExerciseAnalytics(user_id as string)

            res.json({
                success: true,
                exercises: result.exercises,
                total_unique_exercises: result.total_unique_exercises
            })
        } catch (error) {
            console.error('[WorkoutController] Exercises error:', error)
            res.status(500).json({
                error: 'Failed to fetch exercise analytics',
                message: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    /**
     * GET /api/analytics/consistency
     * Streak and frequency data
     */
    async getConsistencyAnalytics(req: Request, res: Response) {
        try {
            const { user_id } = req.query

            if (!user_id) {
                res.status(400).json({ error: 'user_id is required' })
                return
            }

            const consistency = await workoutService.getConsistencyAnalytics(user_id as string)

            res.json({
                success: true,
                consistency
            })
        } catch (error) {
            console.error('[WorkoutController] Consistency error:', error)
            res.status(500).json({
                error: 'Failed to fetch consistency data',
                message: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }
}

// Export singleton instance
export const workoutController = new WorkoutController()
