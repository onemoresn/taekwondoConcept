import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../../context/AuthProvider';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

export default function LoginPage() {
  const { signIn, demoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;

  async function handleDemoLogin(role) {
    setError('');
    setSubmitting(true);
    try {
      const result = await signIn({ email: 'demo@dojang.local', password: 'demo123', demoRole: role });
      const destRole = result.profile?.role ?? role;
      const dest = from?.startsWith(`/${destRole}`) ? from : getDashboardPath(destRole);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await signIn({ email, password });
      const role = result.profile?.role ?? result.user?.role ?? ROLES.STUDENT;
      const dest = from?.startsWith(`/${role}`) ? from : getDashboardPath(role);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__back">← Home</Link>
        <h1 className="auth-card__title">Sign in</h1>
        <p className="auth-card__sub">Welcome back to Dojang</p>

        {demoMode && (
          <>
            <div className="auth-banner auth-banner--info">
              Demo mode — use quick login below or any email/password (role from signup).
            </div>
            <div className="demo-quick-login">
              {Object.values(ROLES).map((role) => (
                <button
                  key={role}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={submitting}
                  onClick={() => handleDemoLogin(role)}
                >
                  Demo {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-banner auth-banner--error">{error}</div>}

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
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__footer">
          <Link to="/forgot-password">Forgot password?</Link>
          {' · '}
          <Link to="/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
}
