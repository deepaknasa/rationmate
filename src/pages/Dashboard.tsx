import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getUserDisplayName } from '../lib/userProfile';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayName = getUserDisplayName(user);

  async function handleLogout() {
    if (!supabase) {
      console.error('Supabase client is not configured.');
      return;
    }

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
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Card List</h1>
          </div>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-label="Open account menu"
          >
            ☰
          </button>
        </div>

        {isMenuOpen && (
          <div className="burger-menu">
            <div className="burger-menu-profile">
              <p className="burger-menu-label">Customer</p>
              <p className="burger-menu-name">{displayName}</p>
              <p className="burger-menu-email">{user?.email ?? 'Unknown user'}</p>
            </div>
            <button
              type="button"
              className="burger-menu-item"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/cards', { replace: true });
              }}
            >
              Card List
            </button>
            <button type="button" className="burger-menu-item burger-menu-item-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}

        <p>You are logged in as:</p>
        <p className="user-email">{user?.email ?? 'Unknown user'}</p>
      </section>
    </main>
  );
}
