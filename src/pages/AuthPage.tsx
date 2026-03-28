import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, user, navigate]);

  async function handleSignUp() {
    setLoading(true);
    setError('');
    setMessage('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (!data.session) {
      setMessage('Signup successful. Check your email to confirm your account.');
    } else {
      navigate('/dashboard', { replace: true });
    }

    setLoading(false);
  }

  async function handleSignIn() {
    setLoading(true);
    setError('');
    setMessage('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate('/dashboard', { replace: true });
    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Rationmate Auth</h1>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
        />

        <div className="auth-actions">
          <button type="button" onClick={handleSignUp} disabled={loading || authLoading}>
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
          <button type="button" onClick={handleSignIn} disabled={loading || authLoading}>
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </div>

        {message ? <p className="auth-message">{message}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
      </section>
    </main>
  );
}
