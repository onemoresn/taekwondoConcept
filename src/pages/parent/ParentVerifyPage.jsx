import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useWorkflowRefresh } from '../../hooks/useWorkflowRefresh';
import { fetchParentVerificationQueue } from '../../services/workflowService';
import { parentVerify } from '../../services/workflowActions';
import { getBeltById } from '../../data/belts';

function VerifyCard({ item, onUpdated }) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const student = item.student;
  const req = item.requirement;
  const belt = getBeltById(student?.belt_id);

  async function handleVerify(verified) {
    setError('');
    setSubmitting(true);
    try {
      await parentVerify({
        progressId: item.id,
        verified,
        note: note.trim() || null,
        studentId: student.id,
        studentName: student.full_name,
        requirementTitle: req?.title ?? 'Requirement',
        beltName: belt?.name ?? student.belt_id,
      });
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Could not update');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="verify-card">
      <div className="verify-card__header">
        <span className="eyebrow">{student?.full_name} · {belt?.name ?? student?.belt_id}</span>
        <h2>{req?.title}</h2>
        {req?.description && <p>{req.description}</p>}
      </div>
      {item.student_note && (
        <p className="verify-card__note">Student note: {item.student_note}</p>
      )}
      <p className="verify-card__note">
        Marked attempted {item.attempted_at ? new Date(item.attempted_at).toLocaleDateString() : 'recently'}.
        Did they complete this requirement?
      </p>
      {error && <div className="auth-banner auth-banner--error">{error}</div>}
      <label className="auth-field">
        <span>Optional note</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Looked good at home practice" />
      </label>
      <div className="verify-card__actions">
        <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => handleVerify(true)}>
          Verify completion
        </button>
        <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => handleVerify(false)}>
          Not yet
        </button>
      </div>
    </article>
  );
}

export default function ParentVerifyPage() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await fetchParentVerificationQueue(profile.id);
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);
  useWorkflowRefresh(load);

  return (
    <div className="page">
      <h1 className="page-title">Verify completion</h1>
      <p className="page-desc">Confirm your child practiced a requirement before the instructor reviews it.</p>

      {error && <div className="auth-banner auth-banner--error">{error}</div>}
      {loading && <p className="empty-note">Loading…</p>}

      {!loading && queue.length === 0 && (
        <p className="empty-note">No items awaiting verification.</p>
      )}

      {queue.map((item) => (
        <VerifyCard key={item.id} item={item} onUpdated={load} />
      ))}
    </div>
  );
}

export { VerifyCard };
