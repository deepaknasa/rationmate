import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import { missingSupabaseConfig } from './lib/supabaseClient';

function MissingConfigPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Configuration required</h1>
        <p>
          This deployment is missing Supabase environment variables.
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in Vercel,
          then redeploy.
        </p>
      </section>
    </main>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (missingSupabaseConfig) {
    return <MissingConfigPage />;
  }

  if (loading) {
    return <div className="auth-status">Loading authentication...</div>;
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/auth'} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
