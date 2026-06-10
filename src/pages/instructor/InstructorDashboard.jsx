import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { useSchool } from '../../context/SchoolProvider';
import { fetchInstructorReviewQueue } from '../../services/workflowService';
import { buildClassReadinessReport, heatmapClass } from '../../services/reportService';
import ReadinessHeatmap from '../../components/ReadinessHeatmap';

export default function InstructorDashboard() {
  const { profile } = useAuth();
  const { activeSchool } = useSchool();
  const [queue, setQueue] = useState([]);
  const [reports, setReports] = useState([]);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const [reviewQueue, classReports] = await Promise.all([
      fetchInstructorReviewQueue(profile.id),
      buildClassReadinessReport(profile.id, activeSchool?.id),
    ]);
    setQueue(reviewQueue);
    setReports(heatmapClass(classReports));
  }, [profile?.id, activeSchool?.id]);

  useEffect(() => { load(); }, [load]);

  const testReady = reports.filter((r) => r.flags.test_ready).length;
  const nearReady = reports.filter((r) => r.percent >= 70 && !r.flags.test_ready).length;

  return (
    <div className="page dashboard">
      <header className="dashboard__header">
        <div>
          <p className="eyebrow">Instructor portal</p>
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__sub">Roster readiness, reviews, and test prep</p>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <strong>{queue.length}</strong>
          <span>Pending reviews</span>
        </div>
        <div className="stat-card">
          <strong>{reports.length}</strong>
          <span>Active students</span>
        </div>
        <div className="stat-card">
          <strong>{testReady}</strong>
          <span>Test-ready</span>
        </div>
      </div>

      {nearReady > 0 && (
        <section className="panel">
          <h2>Near test-ready ({nearReady})</h2>
          <p className="phase-note">Students at 70%+ progress who are not yet flagged test-ready.</p>
          <ul className="review-list">
            {reports.filter((r) => r.percent >= 70 && !r.flags.test_ready).map((r) => (
              <li key={r.student.id}>
                <strong>{r.student.full_name}</strong> — {r.percent}% ({r.approved}/{r.total})
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <div className="panel__head">
          <h2>Readiness heatmap</h2>
          <Link to="/instructor/reports" className="panel__meta">Export →</Link>
        </div>
        <ReadinessHeatmap reports={reports} />
      </section>

      {queue.length > 0 && (
        <section className="panel panel--alert">
          <h2>Needs your review</h2>
          <ul className="review-list">
            {queue.slice(0, 3).map((item) => (
              <li key={item.id}>
                <strong>{item.student?.full_name}</strong> — {item.requirement?.title}
                <Link to="/instructor/reviews">Review →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="quick-links">
        <Link to="/instructor/reports" className="quick-link">Reports & checklists →</Link>
        <Link to="/instructor/curriculum" className="quick-link">Manage curriculum →</Link>
      </div>
    </div>
  );
}
