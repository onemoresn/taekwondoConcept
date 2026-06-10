import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { ROLE_LABELS } from '../constants/roles';

export default function LandingPage() {
  const { isAuthenticated, profile, demoMode } = useAuth();

  return (
    <div className="landing">
      <div className="landing__content">
        <p className="landing__phase">Phase 6 — Polish & Scale</p>
        <h1 className="landing__title">DOJANG</h1>
        <p className="landing__ko">도장 · Taekwondo Training</p>
        <p className="landing__desc">
          Belt progression, parent verification, and instructor review — built for every device.
        </p>

        {isAuthenticated ? (
          <div className="landing__auth-actions">
            <Link to={`/${profile.role}`} className="btn btn-primary">
              Go to {ROLE_LABELS[profile.role]} dashboard
            </Link>
          </div>
        ) : (
          <div className="landing__auth-actions">
            <Link to="/login" className="btn btn-primary">Sign in</Link>
            <Link to="/signup" className="btn btn-secondary">Create account</Link>
          </div>
        )}

        <div className="landing__roles">
          <div className="landing__role-card landing__role-card--student">
            <span>🥋</span>
            <strong>{ROLE_LABELS.student}</strong>
            <p>View belt requirements & training</p>
          </div>
          <div className="landing__role-card landing__role-card--parent">
            <span>👨‍👩‍👧</span>
            <strong>{ROLE_LABELS.parent}</strong>
            <p>Verify progress & submissions</p>
          </div>
          <div className="landing__role-card landing__role-card--instructor">
            <span>🎓</span>
            <strong>{ROLE_LABELS.instructor}</strong>
            <p>Review & manage curriculum</p>
          </div>
        </div>

        <p className="landing__note">
          {demoMode
            ? 'Demo mode: sign up with any email to preview each role. Add Supabase env vars for production auth.'
            : 'Sign up as Student, Parent, or Instructor. Each role lands on its own dashboard.'}
        </p>
      </div>
    </div>
  );
}
