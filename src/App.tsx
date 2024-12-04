import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { useAuthStore } from './store/authStore';
import { Profile } from './pages/Profile';
import { Workouts } from './pages/Workouts';
import { FitFamComparison } from './pages/PartnerComparison';
import { WorkoutDetails } from './pages/WorkoutDetails';
import { FitFam } from './pages/Partners';
import { Hero } from './components/Hero';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';

function App() {
  const { isAuthenticated, isInitialized, initAuth } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        await initAuth();
      } catch (err) {
        console.error('Auth initialization error:', err);
      }
    };
    init();
  }, [initAuth]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" />;
    }
    return <>{children}</>;
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-black text-white relative">
        {isAuthenticated && <Header />}
        <Routes>
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Hero />
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/workouts" element={
            <ProtectedRoute>
              <Workouts />
            </ProtectedRoute>
          } />
          <Route path="/partners" element={
            <ProtectedRoute>
              <FitFam />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/workouts/:workoutId" element={
            <ProtectedRoute>
              <WorkoutDetails />
            </ProtectedRoute>
          } />
          <Route path="/partners/:partnerId" element={
            <ProtectedRoute>
              <FitFamComparison />
            </ProtectedRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <div className="min-h-screen pt-16 flex items-center">
                <LoginForm />
              </div>
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <div className="min-h-screen pt-16 flex items-center">
                <SignupForm />
              </div>
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <div className="min-h-screen pt-16 flex items-center">
                <ForgotPasswordForm />
              </div>
            </PublicRoute>
          } />
          <Route path="*" element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;