import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email?: string
    firstName?: string
    lastName?: string
  }
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
