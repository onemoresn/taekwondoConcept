import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { fetchLinkedStudentsForParent } from '../../services/profileService';
import { fetchStudentProgress, resolveProgressMap } from '../../services/progressService';
import { fetchRequirementsForBelt, countApprovedProgress } from '../../services/curriculumService';
import { fetchParentVerificationQueue } from '../../services/workflowService';
import { fetchParentVideoQueue } from '../../services/videoService';
import { getBeltById } from '../../data/belts';
import { PROGRESS_STATUS } from '../../constants/roles';
import ProgressRing from '../../components/ProgressRing';
import StatusBadge from '../../components/StatusBadge';
import { DEMO_CHILDREN } from '../../data/demoData';

export default function ParentDashboard() {
  const { profile, demoMode } = useAuth();
  const [childDetails, setChildDetails] = useState([]);
  const [pending, setPending] = useState([]);
  const [pendingVideos, setPendingVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let kids = [];
      if (demoMode) {
        kids = DEMO_CHILDREN.map((c) => ({
          id: c.id,
          full_name: c.name,
          belt_id: c.beltId,
        }));
      } else {
        kids = await fetchLinkedStudentsForParent(profile.id);
      }
      const details = await Promise.all(
        kids.map(async (child) => {
          const [reqs, progress] = await Promise.all([
            fetchRequirementsForBelt(child.belt_id),
            fetchStudentProgress(child.id),
          ]);
          const map = resolveProgressMap(reqs, progress);
          const stats = countApprovedProgress(reqs, map);
          const upcoming = reqs.filter((r) => {
            const st = map[r.id] ?? PROGRESS_STATUS.NOT_STARTED;
            return st !== PROGRESS_STATUS.APPROVED;
          });
          return { child, stats, upcoming, map };
        })
      );
      setChildDetails(details);

      const [queue, videos] = await Promise.all([
        fetchParentVerificationQueue(profile.id),
        fetchParentVideoQueue(profile.id),
      ]);
      setPending(queue);
      setPendingVideos(videos);
    } finally {
      setLoading(false);
    }
  }, [profile, demoMode]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page dashboard">
      <header className="dashboard__header">
        <div>
          <p className="eyebrow">Parent portal</p>
          <h1 className="dashboard__title">Your children</h1>
          <p className="dashboard__sub">Progress summary, upcoming requirements, and pending tasks</p>
        </div>
      </header>

      {loading ? (
        <p className="empty-note">Loading…</p>
      ) : (
        <div className="child-cards">
          {childDetails.map(({ child, stats }) => {
            const belt = getBeltById(child.belt_id);
            return (
              <article key={child.id} className="child-card">
                <div className="child-card__belt" style={{ background: belt?.color, color: belt?.textColor }}>
                  {belt?.name.split(' ')[0]}
                </div>
                <div className="child-card__info">
                  <h3>{child.full_name}</h3>
                  <p>{belt?.name} · {stats.approved}/{stats.total} approved</p>
                </div>
                <ProgressRing percent={stats.percent} size={64} stroke={5} />
              </article>
            );
          })}
        </div>
      )}

      {childDetails.map(({ child, upcoming, map }) => (
        <section key={child.id} className="panel">
          <div className="panel__head">
            <h2>{child.full_name} — upcoming</h2>
            <span className="panel__meta">{upcoming.length} remaining</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="empty-note">All requirements approved for current belt.</p>
          ) : (
            <ul className="req-list">
              {upcoming.slice(0, 5).map((req) => (
                <li key={req.id} className="req-list__item">
                  <div className="req-list__body">
                    <strong>{req.title}</strong>
                  </div>
                  <StatusBadge status={map[req.id] ?? PROGRESS_STATUS.NOT_STARTED} />
                </li>
              ))}
            </ul>
          )}
          {upcoming.length > 5 && (
            <p className="phase-note">+{upcoming.length - 5} more requirements</p>
          )}
        </section>
      ))}

      {pending.length > 0 && (
        <section className="panel panel--alert">
          <h2>Pending verification ({pending.length})</h2>
          <p>
            {pending[0].student?.full_name ?? 'Your child'} marked{' '}
            <strong>{pending[0].requirement?.title ?? pending[0].requirement_slug}</strong> as attempted.
          </p>
          <Link to="/parent/verify" className="btn btn-primary">Review now</Link>
        </section>
      )}

      {pendingVideos.length > 0 && (
        <section className="panel panel--alert">
          <h2>Videos to approve ({pendingVideos.length})</h2>
          <p>Practice videos need your approval before the instructor can review them.</p>
          <Link to="/parent/videos" className="btn btn-primary">Review videos</Link>
        </section>
      )}

      <div className="quick-links">
        <Link to="/parent/verify" className="quick-link">Verification tasks →</Link>
        <Link to="/parent/children" className="quick-link">Manage children →</Link>
      </div>
    </div>
  );
}
