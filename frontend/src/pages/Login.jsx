import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Screen 3: Sign up / Login (one component, two modes).
export default function Login({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isSignup) {
        await signup(form);
        navigate('/profile-setup');
      } else {
        const res = await login({ email: form.email, password: form.password });
        navigate(res.assessmentCompleted ? '/home' : '/profile-setup');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div className="eyebrow">{isSignup ? 'Create your space' : 'Welcome back'}</div>
      <h1>{isSignup ? 'Begin your journey' : 'Return to yourself'}</h1>
      <form onSubmit={submit} style={{ marginTop: 18 }}>
        {isSignup && (
          <>
            <label>Name</label>
            <input value={form.name} onChange={set('name')} placeholder="Your name" />
          </>
        )}
        <label>Email</label>
        <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <label>Password</label>
        <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'One moment…' : isSignup ? 'Begin' : 'Log In'}</button>
      </form>
      <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
        {isSignup ? (
          <>Already have an account? <Link className="link" to="/login">Log in</Link></>
        ) : (
          <>New to Nouvel? <Link className="link" to="/signup">Create an account</Link></>
        )}
      </p>
    </div>
  );
}
