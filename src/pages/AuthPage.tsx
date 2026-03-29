import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { hasCompletedSetup } from '../lib/userProfile';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      navigate(hasCompletedSetup(user) ? '/cards' : '/setup', { replace: true });
    }
  }, [user, navigate]);

  async function handleSignUp() {
    setLoading(true);
    setError('');
    setMessage('');

    if (!supabase) {
      setError('App configuration is missing. Please contact support.');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          setup_complete: false,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.user && !data.session) {
      setMessage('Signup successful. Please check your email to confirm your account.');
    } else {
      navigate('/setup', { replace: true });
    }

    setLoading(false);
  }

  async function handleSignIn() {
    setLoading(true);
    setError('');
    setMessage('');

    if (!supabase) {
      setError('App configuration is missing. Please contact support.');
      setLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
    } else {
      navigate(hasCompletedSetup(data.user) ? '/cards' : '/setup', { replace: true });
    }

    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>RationMate Auth</h1>
        <p>Sign up or log in with your email and password.</p>

        <label htmlFor="fullName">Customer name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Jane Customer"
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />

        <div className="auth-actions">
          <button type="button" onClick={handleSignUp} disabled={loading || !fullName.trim() || !email || !password}>
            {loading ? 'Please wait...' : 'Sign Up'}
          </button>
          <button type="button" onClick={handleSignIn} disabled={loading || !email || !password}>
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}
      </section>
    </main>
  );
}
