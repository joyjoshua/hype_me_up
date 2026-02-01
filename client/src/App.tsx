import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SubscriptionRoute } from './components/SubscriptionRoute'
import { Auth } from './pages/Auth'
import { Welcome } from './pages/Welcome'
import { Analytics } from './pages/Analytics/Analytics'
import { PaymentRequired } from './pages/PaymentRequired'
import { PaymentSuccess } from './pages/PaymentSuccess'

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Landing Page (includes Hero & Pricing sections) */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      
      {/* Payment Flow (requires auth, no subscription guard) */}
      <Route
        path="/payment-required"
        element={
          <ProtectedRoute>
            <PaymentRequired />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      
      {/* Protected App Pages (subscription check disabled for now) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Welcome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
