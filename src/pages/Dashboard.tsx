import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import RationBoard from '../components/RationBoard';

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
    <>
      <header className="auth-toolbar">
        <p className="auth-toolbar-email">Logged in as: <strong>{user?.email}</strong></p>
        <button type="button" onClick={handleLogout}>Logout</button>
      </header>
      <RationBoard />
    </>
  );
}
