import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import apiRoutes from './routes/api.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', apiRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
