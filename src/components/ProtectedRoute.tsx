import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <main className="centered-page">
        <p>Loading session...</p>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
