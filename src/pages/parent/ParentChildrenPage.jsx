import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { fetchLinkedStudentsForParent, redeemLinkCode } from '../../services/profileService';
import { getBeltById } from '../../data/belts';
import { DEMO_CHILDREN } from '../../data/demoData';

export default function ParentChildrenPage() {
  const { profile, demoMode } = useAuth();
  const [children, setChildren] = useState([]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      if (demoMode) {
        setChildren(
          DEMO_CHILDREN.map((c) => ({
            id: c.id,
            full_name: c.name,
            belt_id: c.beltId,
          }))
        );
        setLoading(false);
        return;
      }
      try {
        const data = await fetchLinkedStudentsForParent(profile.id);
        setChildren(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile, demoMode]);

  async function handleRedeem(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      if (demoMode) {
        setMessage('Demo mode: link code accepted (simulated).');
        setCode('');
        return;
      }
      await redeemLinkCode(code, profile.id);
      setMessage('Child linked successfully.');
      setCode('');
      const data = await fetchLinkedStudentsForParent(profile.id);
      setChildren(data);
    } catch (err) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Children</h1>
      <p className="page-sub">Linked student accounts</p>

      <form onSubmit={handleRedeem} className="settings-form">
        {error && <div className="auth-banner auth-banner--error">{error}</div>}
        {message && <div className="auth-banner auth-banner--success">{message}</div>}

        <label className="auth-field">
          <span>Link a child with invite code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            required
            className="link-code-input"
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Linking…' : 'Link child'}
        </button>
      </form>

      <section className="panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="panel__head">
          <h2>Your children</h2>
        </div>
        {loading ? (
          <p className="empty-note">Loading…</p>
        ) : children.length === 0 ? (
          <p className="empty-note">
            No linked children yet. Ask your student for a link code from their profile settings.
          </p>
        ) : (
          <ul className="req-list">
            {children.map((child) => {
              const belt = getBeltById(child.belt_id);
              return (
                <li key={child.id} className="req-list__item">
                  <div className="req-list__body">
                    <strong>{child.full_name}</strong>
                    <p>{belt?.name ?? child.belt_id}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
