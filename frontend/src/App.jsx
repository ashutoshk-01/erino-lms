import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Toaster from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeadForm from './pages/LeadForm';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css'

const ProtectedRoute = ({ children }) => {
  const { user, loading, authChecked } = useAuth();

  if (loading || !authChecked) {
    return <LoadingSpinner />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return !user ? children : <Navigate to="/dashboard" replace />;
};


function AppContent() {
  const { user } = useAuth();

  return (
    <div>
      {user && <Header />}
      <main className={user ? 'pt-16' : ''}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads/new"
            element={
              <ProtectedRoute>
                <LeadForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads/:id/edit"
            element={
              <ProtectedRoute>
                <LeadForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} /> </Routes>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
