import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { hasCompletedSetup } from '../lib/userProfile';
import AuthPage from '../pages/AuthPage';
import Dashboard from '../pages/Dashboard';
import SetupPage from '../pages/SetupPage';
import { missingSupabaseConfig } from '../services/supabase';

function MissingConfigPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Configuration required</h1>
        <p>
          This deployment is missing Supabase environment variables.
          Add <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> in Vercel,
          then redeploy.
        </p>
      </section>
    </main>
  );
}

export default function AppRoutes() {
  const { user, loading } = useAuth();
  const needsSetup = user && !hasCompletedSetup(user);
  const authenticatedHomePath = '/cards';

  if (missingSupabaseConfig) {
    return <MissingConfigPage />;
  }

  if (loading) {
    return <div className="auth-status">Loading authentication...</div>;
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to={needsSetup ? '/setup' : authenticatedHomePath} replace /> : <AuthPage />}
      />
      <Route
        path="/setup"
        element={(
          <ProtectedRoute>
            {needsSetup ? <SetupPage /> : <Navigate to={authenticatedHomePath} replace />}
          </ProtectedRoute>
        )}
      />
      <Route
        path="/cards"
        element={(
          <ProtectedRoute>
            {needsSetup ? <Navigate to="/setup" replace /> : <Dashboard />}
          </ProtectedRoute>
        )}
      />
      <Route path="/dashboard" element={<Navigate to={authenticatedHomePath} replace />} />
      <Route
        path="*"
        element={<Navigate to={user ? (needsSetup ? '/setup' : authenticatedHomePath) : '/auth'} replace />}
      />
    </Routes>
  );
}
