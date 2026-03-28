import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error.message);
      return;
    }

    navigate('/auth', { replace: true });
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <h1>Dashboard</h1>
        <p>You are logged in as:</p>
        <p className="user-email">{user?.email ?? 'Unknown user'}</p>
        <button type="button" onClick={handleLogout}>Logout</button>
      </section>
    </main>
  );
}
