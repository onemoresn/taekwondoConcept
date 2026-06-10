import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useCurriculum } from '../../hooks/useCurriculum';
import { useStudentBeltData } from '../../hooks/useStudentBeltData';
import { useWorkflowRefresh } from '../../hooks/useWorkflowRefresh';
import { countApprovedProgress } from '../../services/curriculumService';
import { resolveProgressMap } from '../../services/progressService';
import { groupRequirementsByType } from '../../data/curriculumSeed';
import ProgressRing from '../../components/ProgressRing';
import RequirementGroup from '../../components/RequirementGroup';
import AchievementPanel from '../../components/AchievementPanel';
import { useSchool } from '../../context/SchoolProvider';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { settings } = useSchool();
  const beltSlug = profile?.belt_id ?? 'white';
  const { belt, requirements, loading, error } = useCurriculum(beltSlug);
  const { progress: rawProgress, flags, loading: progressLoading, reload } = useStudentBeltData(profile?.id);
  useWorkflowRefresh(reload);

  const progressMap = resolveProgressMap(requirements, rawProgress);
  const { percent, approved, total } = countApprovedProgress(requirements, progressMap);
  const grouped = groupRequirementsByType(requirements);

  return (
    <div className="page dashboard">
      <header className="dashboard__header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="dashboard__title">{profile?.full_name ?? 'Student'}</h1>
          <p className="dashboard__sub">
            {belt?.name ?? beltSlug} {belt?.korean ? `· ${belt.korean}` : ''}
          </p>
        </div>
        <ProgressRing percent={percent} label="belt" />
      </header>

      <div className="badge-row">
        <div className="badge-pill"><strong>{flags.tips}</strong><span>Tips</span></div>
        <div className="badge-pill">
          <strong>{flags.test_ready ? 'Yes' : 'No'}</strong>
          <span>Test ready</span>
        </div>
      </div>

      {settings.gamification_enabled && profile?.id && (
        <AchievementPanel studentId={profile.id} compact />
      )}

      {(loading || progressLoading) && <p className="empty-note">Loading curriculum…</p>}
      {error && <div className="auth-banner auth-banner--error">{error}</div>}

      {!loading && requirements.length === 0 && (
        <p className="empty-note">No requirements published for {belt?.name ?? beltSlug} yet.</p>
      )}

      {Object.entries(grouped).map(([type, reqs]) => (
        <RequirementGroup
          key={type}
          type={type}
          requirements={reqs}
          progressMap={progressMap}
          detailBasePath="/student/training"
        />
      ))}

      {requirements.length > 0 && (
        <p className="phase-note">{approved}/{total} requirements approved for this belt.</p>
      )}

      <div className="quick-links">
        <Link to="/student/training" className="quick-link">Training library →</Link>
        <Link to="/student/progress" className="quick-link">My progress →</Link>
      </div>
    </div>
  );
}
