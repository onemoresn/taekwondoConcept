import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useSchool } from '../../context/SchoolProvider';
import { updateProfile, createLinkCode, fetchActiveLinkCodesForStudent } from '../../services/profileService';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import ThemeToggle from '../../components/ThemeToggle';
import AchievementPanel from '../../components/AchievementPanel';
import {
  isLeaderboardOptIn,
  setLeaderboardOptIn as saveLeaderboardOptIn,
} from '../../services/gamificationService';

export default function ProfileSettingsPage() {
  const { user, profile, refreshProfile, updateProfileLocal, demoMode } = useAuth();
  const { settings, activeSchool } = useSchool();
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(true);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [notificationEmail, setNotificationEmail] = useState(profile?.notification_email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [linkCodes, setLinkCodes] = useState([]);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setNotificationEmail(profile?.notification_email ?? '');
    setAvatarUrl(profile?.avatar_url ?? '');
  }, [profile]);

  useEffect(() => {
    if (profile?.role === ROLES.STUDENT && profile?.id) {
      setLeaderboardOptIn(isLeaderboardOptIn(profile.id));
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.role !== ROLES.STUDENT || demoMode) return;
    fetchActiveLinkCodesForStudent(profile.id)
      .then(setLinkCodes)
      .catch(() => setLinkCodes([]));
  }, [profile, demoMode]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const updates = {
        full_name: fullName.trim(),
        notification_email: notificationEmail.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };
      if (demoMode) {
        updateProfileLocal(updates);
        setMessage('Profile updated (demo mode).');
      } else {
        await updateProfile(user.id, updates);
        await refreshProfile();
        setMessage('Profile saved.');
      }
    } catch (err) {
      setError(err.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateCode() {
    setGeneratingCode(true);
    setError('');
    try {
      if (demoMode) {
        setLinkCodes([{ code: 'DEMO01', expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }]);
      } else {
        const code = await createLinkCode(profile.id, profile.id);
        const codes = await fetchActiveLinkCodesForStudent(profile.id);
        setLinkCodes(codes);
        setMessage(`Share code ${code.code} with your parent.`);
      }
    } catch (err) {
      setError(err.message || 'Could not create link code');
    } finally {
      setGeneratingCode(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Profile settings</h1>
      <p className="page-sub">{ROLE_LABELS[profile?.role]} account</p>

      {demoMode && (
        <div className="auth-banner auth-banner--info">
          Demo mode — profile changes are not saved to a database.
        </div>
      )}

      <section className="panel settings-section">
        <h2>Appearance</h2>
        <p className="phase-note">Choose dark, light, or match your system preference.</p>
        <ThemeToggle />
      </section>

      <form onSubmit={handleSave} className="settings-form">
        {error && <div className="auth-banner auth-banner--error">{error}</div>}
        {message && <div className="auth-banner auth-banner--success">{message}</div>}

        <label className="auth-field">
          <span>Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>

        <label className="auth-field">
          <span>Notification email</span>
          <input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder={user?.email}
          />
        </label>

        <label className="auth-field">
          <span>Avatar URL</span>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {profile?.role === ROLES.STUDENT && settings.gamification_enabled && profile?.id && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <AchievementPanel studentId={profile.id} showLink={settings.leaderboard_enabled} />
        </div>
      )}

      {profile?.role === ROLES.STUDENT && settings.leaderboard_enabled && (
        <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
          <h2>Leaderboard privacy</h2>
          <label className="flag-control flag-control--check">
            <input
              type="checkbox"
              checked={leaderboardOptIn}
              onChange={(e) => {
                const next = e.target.checked;
                setLeaderboardOptIn(next);
                saveLeaderboardOptIn(profile.id, next);
              }}
            />
            <span>Show me on the {activeSchool?.name ?? 'school'} leaderboard (first name + last initial only)</span>
          </label>
        </section>
      )}

      {profile?.role === ROLES.STUDENT && (
        <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
          <div className="panel__head">
            <h2>Parent link code</h2>
          </div>
          <p className="phase-note">
            Generate a code for your parent to link your account. Codes expire in 7 days.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGenerateCode}
            disabled={generatingCode}
          >
            {generatingCode ? 'Generating…' : 'Generate new code'}
          </button>
          {linkCodes.length > 0 && (
            <ul className="req-list" style={{ marginTop: 'var(--space-4)' }}>
              {linkCodes.map((lc) => (
                <li key={lc.code} className="req-list__item">
                  <div className="req-list__body">
                    <strong className="link-code">{lc.code}</strong>
                    <p>Expires {new Date(lc.expires_at).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
