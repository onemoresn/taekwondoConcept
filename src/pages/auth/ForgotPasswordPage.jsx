import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';

export default function ForgotPasswordPage() {
  const { resetPassword, demoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage('Check your email for a password reset link.');
    } catch (err) {
      setError(err.message || 'Could not send reset email');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="auth-card__back">← Sign in</Link>
        <h1 className="auth-card__title">Reset password</h1>

        {demoMode && (
          <div className="auth-banner auth-banner--info">
            Demo mode — reset is simulated only.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-banner auth-banner--error">{error}</div>}
          {message && <div className="auth-banner auth-banner--success">{message}</div>}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
