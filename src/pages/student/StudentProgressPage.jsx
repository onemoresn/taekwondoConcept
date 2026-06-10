import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useCurriculum } from '../../hooks/useCurriculum';
import { useStudentBeltData } from '../../hooks/useStudentBeltData';
import { useWorkflowRefresh } from '../../hooks/useWorkflowRefresh';
import { resolveProgressMap, fetchStudentProgressRecords } from '../../services/progressService';
import { PROGRESS_STATUS } from '../../constants/roles';
import StatusBadge from '../../components/StatusBadge';

export default function StudentProgressPage() {
  const { profile } = useAuth();
  const beltSlug = profile?.belt_id ?? 'white';
  const { requirements, loading, error, reload: reloadCurriculum } = useCurriculum(beltSlug);
  const { progress: rawProgress, reload: reloadProgress } = useStudentBeltData(profile?.id);
  const [records, setRecords] = useState([]);
  const progressMap = resolveProgressMap(requirements, rawProgress);

  const refresh = useCallback(async () => {
    reloadProgress();
    reloadCurriculum();
    if (profile?.id) {
      const recs = await fetchStudentProgressRecords(profile.id);
      setRecords(recs);
    }
  }, [profile?.id, reloadProgress, reloadCurriculum]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useWorkflowRefresh(refresh);

  function getRecord(req) {
    return records.find(
      (r) => r.requirement_id === req.id || r.requirement_slug === req.slug
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">My progress</h1>
      <p className="page-desc">Track requirements from attempted → parent verified → instructor approved.</p>
      <div className="pipeline-legend">
        <span className="status-badge status--attempted">Attempted</span>
        <span>→</span>
        <span className="status-badge status--parent">Parent verified</span>
        <span>→</span>
        <span className="status-badge status--approved">Approved</span>
      </div>

      {loading && <p className="empty-note">Loading…</p>}
      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      <ul className="req-list">
        {requirements.map((req) => {
          const status = progressMap[req.id] ?? PROGRESS_STATUS.NOT_STARTED;
          const record = getRecord(req);
          return (
            <li key={req.id} className="req-list__item req-list__item--stacked">
              <div className="req-list__body">
                <strong>{req.title}</strong>
                <p>{req.description}</p>
                {record?.instructor_feedback && (
                  <p className="feedback-inline">Feedback: {record.instructor_feedback}</p>
                )}
              </div>
              <StatusBadge status={status} />
            </li>
          );
        })}
      </ul>

      {!loading && requirements.length === 0 && (
        <p className="empty-note">No requirements to track yet.</p>
      )}
    </div>
  );
}
