import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../../context/AuthProvider';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

export default function SignupPage() {
  const { signUp, demoMode } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.STUDENT);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signUp({ email, password, fullName, role });
      navigate(getDashboardPath(role), { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__back">← Home</Link>
        <h1 className="auth-card__title">Create account</h1>
        <p className="auth-card__sub">Join your dojang</p>

        {demoMode && (
          <div className="auth-banner auth-banner--info">
            Demo mode — account saved locally. Configure Supabase for real auth.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-banner auth-banner--error">{error}</div>}

          <label className="auth-field">
            <span>Full name</span>
            <input
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <fieldset className="auth-field">
            <legend>I am a…</legend>
            <div className="role-picker">
              {Object.values(ROLES).map((r) => (
                <label key={r} className={`role-picker__option${role === r ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                  />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
