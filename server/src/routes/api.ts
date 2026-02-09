import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'

// Import Controllers
import {
  authController,
  livekitController,
  workoutController,
  subscriptionController
} from '../controllers/index.js'

// ============================================
// API ROUTES
// Clean router file - delegates to controllers
// ============================================

const router = Router()

// ============================================
// AUTH ROUTES
// ============================================
router.get('/me', authMiddleware, (req, res) => authController.getMe(req, res))

// ============================================
// LIVEKIT ROUTES
// ============================================
router.post('/livekit/token', authMiddleware, (req, res) => livekitController.generateToken(req, res))

// ============================================
// WORKOUT ROUTES
// ============================================
router.post('/voice-agent-summary', (req, res) => workoutController.createFromVoiceAgent(req, res))
router.get('/workouts', (req, res) => workoutController.getWorkouts(req, res))
router.get('/workouts/:id', (req, res) => workoutController.getWorkoutById(req, res))

// ============================================
// ANALYTICS ROUTES
// ============================================
router.get('/analytics/summary', (req, res) => workoutController.getAnalyticsSummary(req, res))
router.get('/analytics/exercises', (req, res) => workoutController.getExerciseAnalytics(req, res))
router.get('/analytics/consistency', (req, res) => workoutController.getConsistencyAnalytics(req, res))

// ============================================
// SUBSCRIPTION & PAYMENT ROUTES
// ============================================
router.post('/checkout/create-session', authMiddleware, (req, res) => subscriptionController.createCheckoutSession(req, res))
router.get('/subscription/status', authMiddleware, (req, res) => subscriptionController.getStatus(req, res))
router.post('/webhooks/dodo', (req, res) => subscriptionController.handleWebhook(req, res))

export default router
