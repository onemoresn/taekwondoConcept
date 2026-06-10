import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useCurriculum } from '../../hooks/useCurriculum';
import { useStudentBeltData } from '../../hooks/useStudentBeltData';
import { useWorkflowRefresh } from '../../hooks/useWorkflowRefresh';
import { groupRequirementsByType } from '../../data/curriculumSeed';
import { PROGRESS_STATUS, PROGRESS_STATUS_LABELS } from '../../constants/roles';
import { studentMarkAttempted } from '../../services/workflowActions';
import { fetchProgressRecord } from '../../services/workflowService';
import RequirementGroup from '../../components/RequirementGroup';
import RequirementContentView from '../../components/RequirementContentView';
import StatusBadge, { RequirementTypeIcon } from '../../components/StatusBadge';
import { resolveProgressMap } from '../../services/progressService';
import VideoSubmissionPanel from '../../components/VideoSubmissionPanel';

function RequirementWorkflowPanel({ requirement, belt, profile, onUpdated }) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [record, setRecord] = useState(null);

  const loadRecord = useCallback(async () => {
    const r = await fetchProgressRecord(profile.id, requirement.id, requirement.slug);
    setRecord(r);
  }, [profile.id, requirement.id, requirement.slug]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const status = record?.status ?? PROGRESS_STATUS.NOT_STARTED;
  const canAttempt = [PROGRESS_STATUS.NOT_STARTED, PROGRESS_STATUS.DENIED].includes(status);

  async function handleAttempt(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await studentMarkAttempted({
        studentId: profile.id,
        studentName: profile.full_name,
        beltName: belt?.name ?? profile.belt_id,
        requirementId: requirement.id,
        requirementSlug: requirement.slug,
        requirementTitle: requirement.title,
        note: note.trim() || null,
      });
      setMessage('Marked as attempted — your parent will be notified.');
      setNote('');
      await loadRecord();
      onUpdated?.();
    } catch (err) {
      setError(err.message || 'Could not update progress');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel workflow-panel">
      <div className="panel__head">
        <h2>Progress</h2>
        <StatusBadge status={status} />
      </div>

      {error && <div className="auth-banner auth-banner--error">{error}</div>}
      {message && <div className="auth-banner auth-banner--success">{message}</div>}

      {record?.instructor_feedback && (
        <div className="feedback-box">
          <strong>Instructor feedback</strong>
          <p>{record.instructor_feedback}</p>
        </div>
      )}

      {record?.parent_note && (
        <p className="phase-note">Parent note: {record.parent_note}</p>
      )}

      {canAttempt ? (
        <form onSubmit={handleAttempt} className="settings-form">
          <label className="auth-field">
            <span>Optional note for your parent</span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Practiced 10 reps each leg at home"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : status === PROGRESS_STATUS.DENIED ? 'Mark attempted again' : 'Mark as attempted'}
          </button>
        </form>
      ) : (
        <p className="phase-note">
          Status: {PROGRESS_STATUS_LABELS[status]}. Waiting for {status === PROGRESS_STATUS.ATTEMPTED ? 'parent verification' : 'next step in the workflow'}.
        </p>
      )}
    </section>
  );
}

export default function StudentTrainingPage() {
  const { requirementId } = useParams();
  const { profile } = useAuth();
  const beltSlug = profile?.belt_id ?? 'white';
  const { belt, requirements, loading, error, reload: reloadCurriculum } = useCurriculum(beltSlug);
  const { progress: rawProgress, reload: reloadProgress } = useStudentBeltData(profile?.id);
  const grouped = groupRequirementsByType(requirements);
  const progressMap = resolveProgressMap(requirements, rawProgress);
  const selected = requirementId ? requirements.find((r) => r.id === requirementId) : null;

  const refresh = () => {
    reloadProgress();
    reloadCurriculum();
  };
  useWorkflowRefresh(refresh);

  if (selected) {
    return (
      <div className="page">
        <Link to="/student/training" className="auth-card__back">← Training</Link>
        <div className="req-detail-header">
          <RequirementTypeIcon type={selected.type} />
          <div>
            <h1 className="page-title">{selected.title}</h1>
            <p className="page-desc">{selected.description}</p>
          </div>
        </div>
        <RequirementContentView requirement={selected} />
        <RequirementWorkflowPanel
          requirement={selected}
          belt={belt}
          profile={profile}
          onUpdated={refresh}
        />
        <VideoSubmissionPanel
          requirement={selected}
          profile={profile}
          onUpdated={refresh}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Training</h1>
      <p className="page-desc">
        {belt?.name ?? beltSlug} curriculum — tap View to mark requirements attempted.
      </p>

      {loading && <p className="empty-note">Loading…</p>}
      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      {Object.entries(grouped).map(([type, reqs]) => (
        <RequirementGroup
          key={type}
          type={type}
          requirements={reqs}
          progressMap={progressMap}
          detailBasePath="/student/training"
        />
      ))}

      {!loading && requirements.length === 0 && (
        <p className="empty-note">No training content for your belt yet.</p>
      )}
    </div>
  );
}
