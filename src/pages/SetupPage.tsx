import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getUserDisplayName, hasCompletedSetup } from '../lib/userProfile';

export default function SetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    if (hasCompletedSetup(user)) {
      navigate('/cards', { replace: true });
      return;
    }

    setFullName(getUserDisplayName(user));
  }, [navigate, user]);

  async function handleCompleteSetup() {
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError('Enter your name to complete setup.');
      return;
    }

    if (!supabase || !user) {
      setError('App configuration is missing. Please contact support.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: trimmedName,
        setup_complete: true,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    navigate('/cards', { replace: true });
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Complete your setup</h1>
        <p>First-time login detected. Tell us your name before continuing to the dashboard.</p>

        <label htmlFor="fullName">Customer name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Enter your full name"
        />

        <button type="button" onClick={handleCompleteSetup} disabled={loading}>
          {loading ? 'Saving...' : 'Continue to dashboard'}
        </button>

        {error && <p className="auth-error">{error}</p>}
      </section>
    </main>
  );
}
